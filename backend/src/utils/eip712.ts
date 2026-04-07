/**
 * EIP-712 Typed Structured Data Signing
 * Used for atomic withdrawal authorization
 */

import { ethers } from "ethers";
import config from "../config";

// EIP-712 Domain
export const EIP712_DOMAIN = {
  name: config.EIP712_DOMAIN_NAME,
  version: config.EIP712_DOMAIN_VERSION,
  chainId: config.CHAIN_ID,
  verifyingContract: config.CONTRACT_ADDRESS,
};

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

/**
 * Get the domain separator hash
 */
export function getDomainSeparator(): string {
  return ethers.TypedDataEncoder.hashDomain(EIP712_DOMAIN);
}

/**
 * Get the typed data hash for a withdrawal
 */
export function getWithdrawalHash(data: WithdrawalData): string {
  return ethers.TypedDataEncoder.hash(EIP712_DOMAIN, WITHDRAWAL_TYPES, data);
}

/**
 * Sign a withdrawal request (server-side with treasury signer)
 */
export async function signWithdrawal(
  recipient: string,
  amountUsdc: number,
  nonce: number,
  deadlineSeconds: number = 3600 // 1 hour default
): Promise<{ signature: string; deadline: number; hash: string }> {
  if (!config.SIGNER_PRIVATE_KEY) {
    throw new Error("Signer private key not configured");
  }

  const signer = new ethers.Wallet(config.SIGNER_PRIVATE_KEY);
  const deadline = Math.floor(Date.now() / 1000) + deadlineSeconds;

  // Convert amount to 6 decimals (USDC standard)
  const amountWei = BigInt(Math.round(amountUsdc * 1_000_000));

  const data: WithdrawalData = {
    recipient,
    amount: amountWei,
    nonce: BigInt(nonce),
    deadline: BigInt(deadline),
  };

  const signature = await signer.signTypedData(EIP712_DOMAIN, WITHDRAWAL_TYPES, data);
  const hash = getWithdrawalHash(data);

  return { signature, deadline, hash };
}

/**
 * Verify a withdrawal signature
 */
export function verifyWithdrawalSignature(
  recipient: string,
  amountUsdc: number,
  nonce: number,
  deadline: number,
  signature: string
): string {
  const amountWei = BigInt(Math.round(amountUsdc * 1_000_000));

  const data: WithdrawalData = {
    recipient,
    amount: amountWei,
    nonce: BigInt(nonce),
    deadline: BigInt(deadline),
  };

  return ethers.verifyTypedData(EIP712_DOMAIN, WITHDRAWAL_TYPES, data, signature);
}

/**
 * Check if a withdrawal deadline is still valid
 */
export function isDeadlineValid(deadline: number): boolean {
  return Math.floor(Date.now() / 1000) < deadline;
}

/**
 * Generate a unique nonce for withdrawal
 */
export function generateWithdrawalNonce(): number {
  return Math.floor(Date.now() / 1000);
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
