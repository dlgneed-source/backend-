/**
 * EIP-712 Typed Structured Data Signing
 * Used for atomic withdrawal authorization
 */

import { randomBytes } from "crypto";
import { ethers } from "ethers";
import config from "../config";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const UINT256_MAX = (1n << 256n) - 1n;

export class EIP712ValidationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "EIP712ValidationError";
  }
}

// EIP-712 Domain
export const EIP712_DOMAIN = Object.freeze({
  name: config.EIP712_DOMAIN_NAME,
  version: config.EIP712_DOMAIN_VERSION,
  chainId: config.CHAIN_ID,
  verifyingContract: config.CONTRACT_ADDRESS,
});

// Withdrawal type definition
export const WITHDRAWAL_TYPES = {
  Withdrawal: [
    { name: "recipient", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
};

export interface WithdrawalData {
  recipient: string;
  amount: bigint;
  nonce: bigint;
  deadline: bigint;
}

export interface VerifyWithdrawalInput {
  recipient: string;
  amountUsdc: number;
  nonce: number;
  deadline: number;
  signature: string;
  expectedSigner?: string;
}

function configError(message: string): EIP712ValidationError {
  return new EIP712ValidationError(message, "EIP712_CONFIG_INVALID", 503);
}

function requestError(message: string, code = "EIP712_REQUEST_INVALID", statusCode = 400): EIP712ValidationError {
  return new EIP712ValidationError(message, code, statusCode);
}

function normalizePrivateKey(): string {
  const raw = config.SIGNER_PRIVATE_KEY?.trim();
  if (!raw) {
    throw configError("Missing SIGNER_PRIVATE_KEY for withdrawal signing");
  }

  const normalized = raw.startsWith("0x") ? raw : `0x${raw}`;
  if (!/^0x[a-fA-F0-9]{64}$/.test(normalized)) {
    throw configError("Invalid SIGNER_PRIVATE_KEY format");
  }

  return normalized;
}

function getSignerWallet(): ethers.Wallet {
  return new ethers.Wallet(normalizePrivateKey());
}

export function getValidatedEIP712Domain(): typeof EIP712_DOMAIN {
  if (!config.EIP712_DOMAIN_NAME?.trim()) {
    throw configError("Missing EIP712_DOMAIN_NAME");
  }

  if (!config.EIP712_DOMAIN_VERSION?.trim()) {
    throw configError("Missing EIP712_DOMAIN_VERSION");
  }

  if (!Number.isInteger(config.CHAIN_ID) || config.CHAIN_ID <= 0) {
    throw configError("Invalid CHAIN_ID for EIP-712 domain");
  }

  if (!config.CONTRACT_ADDRESS?.trim()) {
    throw configError("Missing CONTRACT_ADDRESS for EIP-712 domain");
  }

  if (!ethers.isAddress(config.CONTRACT_ADDRESS)) {
    throw configError("Invalid CONTRACT_ADDRESS format");
  }

  const checksummedContract = ethers.getAddress(config.CONTRACT_ADDRESS);
  if (checksummedContract === ZERO_ADDRESS) {
    throw configError("CONTRACT_ADDRESS cannot be zero address");
  }

  return {
    name: config.EIP712_DOMAIN_NAME,
    version: config.EIP712_DOMAIN_VERSION,
    chainId: config.CHAIN_ID,
    verifyingContract: checksummedContract,
  };
}

function toUsdcUnits(amountUsdc: number): bigint {
  if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) {
    throw requestError("Invalid withdrawal amount", "EIP712_AMOUNT_INVALID");
  }

  return ethers.parseUnits(amountUsdc.toFixed(6), 6);
}

function toNonce(nonce: number): bigint {
  if (!Number.isInteger(nonce) || nonce < 0) {
    throw requestError("Invalid withdrawal nonce", "EIP712_NONCE_INVALID");
  }

  const nonceBigInt = BigInt(nonce);
  if (nonceBigInt > UINT256_MAX) {
    throw requestError("Withdrawal nonce exceeds uint256 range", "EIP712_NONCE_INVALID");
  }
  return nonceBigInt;
}

function toDeadline(deadline: number): bigint {
  if (!Number.isInteger(deadline) || deadline <= 0) {
    throw requestError("Invalid withdrawal deadline", "EIP712_DEADLINE_INVALID");
  }
  const deadlineBigInt = BigInt(deadline);
  if (deadlineBigInt > UINT256_MAX) {
    throw requestError("Withdrawal deadline exceeds uint256 range", "EIP712_DEADLINE_INVALID");
  }
  return deadlineBigInt;
}

function buildWithdrawalData(recipient: string, amountUsdc: number, nonce: number, deadline: number): WithdrawalData {
  if (!ethers.isAddress(recipient)) {
    throw requestError("Invalid withdrawal recipient address", "EIP712_RECIPIENT_INVALID");
  }

  const normalizedRecipient = ethers.getAddress(recipient);
  if (normalizedRecipient === ZERO_ADDRESS) {
    throw requestError("Withdrawal recipient cannot be zero address", "EIP712_RECIPIENT_INVALID");
  }

  return {
    recipient: normalizedRecipient,
    amount: toUsdcUnits(amountUsdc),
    nonce: toNonce(nonce),
    deadline: toDeadline(deadline),
  };
}

/**
 * Get the domain separator hash
 */
export function getDomainSeparator(): string {
  return ethers.TypedDataEncoder.hashDomain(getValidatedEIP712Domain());
}

/**
 * Get the typed data hash for a withdrawal
 */
export function getWithdrawalHash(data: WithdrawalData): string {
  return ethers.TypedDataEncoder.hash(getValidatedEIP712Domain(), WITHDRAWAL_TYPES, data);
}

/**
 * Sign a withdrawal request (server-side with treasury signer)
 */
export async function signWithdrawal(
  recipient: string,
  amountUsdc: number,
  nonce: number,
  deadlineSeconds: number = config.EIP712_WITHDRAWAL_TTL_SECONDS
): Promise<{ signature: string; deadline: number; hash: string }> {
  if (!Number.isInteger(deadlineSeconds) || deadlineSeconds <= 0) {
    throw requestError("Invalid deadline seconds", "EIP712_DEADLINE_INVALID");
  }

  const maxDeadline = config.EIP712_MAX_DEADLINE_SECONDS;
  if (!Number.isInteger(maxDeadline) || maxDeadline <= 0) {
    throw configError("Invalid EIP712_MAX_DEADLINE_SECONDS");
  }
  if (deadlineSeconds > maxDeadline) {
    throw requestError(`Deadline exceeds allowed maximum of ${maxDeadline} seconds`, "EIP712_DEADLINE_INVALID");
  }

  const domain = getValidatedEIP712Domain();
  const signer = getSignerWallet();
  const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds;
  const data = buildWithdrawalData(recipient, amountUsdc, nonce, deadline);
  validateWithdrawalDeadline(deadline);

  const signature = await signer.signTypedData(domain, WITHDRAWAL_TYPES, data);
  const recoveredSigner = verifySignedWithdrawal({
    recipient: data.recipient,
    amountUsdc,
    nonce,
    deadline,
    signature,
    expectedSigner: signer.address,
  });

  if (recoveredSigner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new EIP712ValidationError(
      "Generated signature failed verification",
      "EIP712_SIGNATURE_VERIFICATION_FAILED",
      500
    );
  }

  const hash = ethers.TypedDataEncoder.hash(domain, WITHDRAWAL_TYPES, data);

  return { signature, deadline, hash };
}

/**
 * Verify a withdrawal signature
 */
export function verifySignedWithdrawal(input: VerifyWithdrawalInput): string {
  validateWithdrawalDeadline(input.deadline);

  if (!input.signature || typeof input.signature !== "string") {
    throw requestError("Signature is required", "EIP712_SIGNATURE_INVALID", 401);
  }

  try {
    ethers.Signature.from(input.signature);
  } catch {
    throw requestError("Malformed signature format", "EIP712_SIGNATURE_INVALID", 401);
  }

  const domain = getValidatedEIP712Domain();
  const data = buildWithdrawalData(input.recipient, input.amountUsdc, input.nonce, input.deadline);

  let recovered: string;
  try {
    recovered = ethers.verifyTypedData(domain, WITHDRAWAL_TYPES, data, input.signature);
  } catch {
    throw requestError("Signature verification failed", "EIP712_SIGNATURE_INVALID", 401);
  }

  if (input.expectedSigner) {
    if (!ethers.isAddress(input.expectedSigner)) {
      throw configError("Invalid expected signer address");
    }
    if (recovered.toLowerCase() !== input.expectedSigner.toLowerCase()) {
      throw requestError("Signature signer mismatch", "EIP712_SIGNATURE_MISMATCH", 401);
    }
  }

  return recovered;
}

export function verifyWithdrawalSignature(
  recipient: string,
  amountUsdc: number,
  nonce: number,
  deadline: number,
  signature: string
): string {
  return verifySignedWithdrawal({ recipient, amountUsdc, nonce, deadline, signature });
}

/**
 * Check if a withdrawal deadline is still valid
 */
export function isDeadlineValid(deadline: number): boolean {
  try {
    validateWithdrawalDeadline(deadline);
    return true;
  } catch {
    return false;
  }
}

export function validateWithdrawalDeadline(deadline: number): void {
  if (!Number.isInteger(deadline) || deadline <= 0) {
    throw requestError("Invalid withdrawal deadline", "EIP712_DEADLINE_INVALID");
  }

  const now = Math.floor(Date.now() / 1000);
  if (deadline <= now) {
    throw requestError("Withdrawal signature has expired", "EIP712_DEADLINE_EXPIRED");
  }

  const maxFuture = config.EIP712_MAX_DEADLINE_SECONDS;
  if (!Number.isInteger(maxFuture) || maxFuture <= 0) {
    throw configError("Invalid EIP712_MAX_DEADLINE_SECONDS");
  }

  if (deadline > now + maxFuture) {
    throw requestError("Withdrawal deadline exceeds allowed window", "EIP712_DEADLINE_INVALID");
  }
}

/**
 * Generate a unique nonce for withdrawal
 */
export function generateWithdrawalNonce(): number {
  const randomHex = Buffer.from(randomBytes(8)).toString("hex");
  const nonce53Bit = BigInt(`0x${randomHex}`) & ((1n << 53n) - 1n);
  return Number(nonce53Bit);
}

export async function ensureNonceNotUsed(
  nonce: number,
  hasNonce: (nonce: string) => Promise<boolean>
): Promise<void> {
  const normalizedNonce = toNonce(nonce).toString();
  const alreadyUsed = await hasNonce(normalizedNonce);
  if (alreadyUsed) {
    throw requestError("Nonce already used", "EIP712_NONCE_REPLAY", 409);
  }
}

/**
 * Verify that a user's wallet signed a specific message (for authentication)
 */
export function verifyWalletSignature(message: string, signature: string): string {
  return ethers.verifyMessage(message, signature);
}

/**
 * Generate a sign-in message for wallet authentication
 */
export function generateSignInMessage(walletAddress: string, nonce: string): string {
  return [
    "Welcome to eAkhuwat!",
    "",
    "Sign this message to verify your wallet ownership.",
    "",
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Time: ${new Date().toISOString()}`,
  ].join("\n");
}
