/**
 * eip712.ts
 *
 * EIP-712 typed-data helpers for withdrawal signing.
 *
 * Security requirement: the nonce used in the signed message must be
 * incremented atomically inside the same database transaction that
 * creates the Withdrawal record.  This prevents replay attacks where
 * two concurrent requests could sign with the same nonce.
 *
 * Signing flow:
 * 1. Open a DB transaction.
 * 2. Increment user.nonce (SELECT … FOR UPDATE / atomic update).
 * 3. Build the EIP-712 typed-data hash with the new nonce.
 * 4. Store the Withdrawal record (userId, amount, nonce, status=PENDING).
 * 5. Sign the hash off-chain (or return it to the frontend for MetaMask).
 * 6. Commit the transaction.
 *
 * If any step fails the transaction rolls back and the nonce is NOT consumed.
 */

// ─── Domain & Type definitions ────────────────────────────────────────────────

export interface Eip712Domain {
  name: string;
  version: string;
  chainId: number;
  verifyingContract: string; // checksummed EVM address
}

export interface WithdrawalMessage {
  userId: string;
  amount: string; // stringified integer (wei or smallest unit) — avoids float precision
  nonce: number;
}

/** EIP-712 type descriptor for the Withdrawal struct */
export const WITHDRAWAL_TYPES = {
  Withdrawal: [
    { name: "userId",  type: "string"  },
    { name: "amount",  type: "string"  },
    { name: "nonce",   type: "uint256" },
  ],
} as const;

// ─── Hash builders ────────────────────────────────────────────────────────────

/**
 * Returns the EIP-712 domain separator hash inputs.
 * Pass to ethers.js `TypedDataEncoder.hashDomain(domain)` or equivalent.
 */
export function buildDomain(
  contractAddress: string,
  chainId: number,
  appName = "DLGNeed",
  version = "1",
): Eip712Domain {
  return {
    name: appName,
    version,
    chainId,
    verifyingContract: contractAddress,
  };
}

/**
 * Assembles the typed-data message for a withdrawal.
 *
 * @param userId  - DB user UUID.
 * @param amount  - Withdrawal amount as an integer string (avoid floats).
 * @param nonce   - The NEW nonce value from the DB (already incremented).
 */
export function buildWithdrawalMessage(
  userId: string,
  amount: string,
  nonce: number,
): WithdrawalMessage {
  return { userId, amount, nonce };
}

// ─── Atomic nonce increment helper ────────────────────────────────────────────

export interface NonceIncrementResult {
  previousNonce: number;
  newNonce: number;
}

/**
 * Atomically increments the user's nonce.
 *
 * In production this runs **inside a database transaction**.
 * The function signature accepts a generic `updateFn` so it can be tested
 * without a real DB.
 *
 * @param userId   - User whose nonce is being incremented.
 * @param updateFn - DB update function: receives current nonce, returns new nonce.
 *                   Must run inside an open transaction to be atomic.
 * @returns The previous and new nonce values.
 *
 * @example (Prisma pseudocode inside a transaction)
 *   const result = await incrementNonceAtomic(userId, async (current) => {
 *     const updated = await tx.user.update({
 *       where: { id: userId },
 *       data:  { nonce: { increment: 1 } },
 *       select: { nonce: true },
 *     });
 *     return updated.nonce;
 *   });
 */
export async function incrementNonceAtomic(
  userId: string,
  updateFn: (currentNonce: number) => Promise<number>,
  getCurrentNonce: (userId: string) => Promise<number>,
): Promise<NonceIncrementResult> {
  const previousNonce = await getCurrentNonce(userId);
  const newNonce = await updateFn(previousNonce);

  if (newNonce !== previousNonce + 1) {
    throw new Error(
      `incrementNonceAtomic: expected newNonce=${previousNonce + 1}, got ${newNonce} for user ${userId}`,
    );
  }

  return { previousNonce, newNonce };
}

// ─── Full withdrawal signature request ───────────────────────────────────────

export interface WithdrawalSignatureRequest {
  domain: Eip712Domain;
  types: typeof WITHDRAWAL_TYPES;
  message: WithdrawalMessage;
}

/**
 * Builds the complete EIP-712 signing payload that should be passed to
 * ethers.js `_signTypedData` (v5) or `signTypedData` (v6) / MetaMask.
 *
 * @param userId          - DB user UUID.
 * @param amountString    - Amount as integer string.
 * @param newNonce        - Already-incremented nonce from the DB transaction.
 * @param contractAddress - Deployed withdrawal contract address.
 * @param chainId         - EVM chain ID.
 */
export function buildWithdrawalSignatureRequest(
  userId: string,
  amountString: string,
  newNonce: number,
  contractAddress: string,
  chainId: number,
): WithdrawalSignatureRequest {
  return {
    domain: buildDomain(contractAddress, chainId),
    types: WITHDRAWAL_TYPES,
    message: buildWithdrawalMessage(userId, amountString, newNonce),
  };
}
