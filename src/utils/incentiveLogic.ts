/**
 * incentiveLogic.ts
 *
 * Pro-rata club and individual incentive calculations.
 *
 * Incentive tiers distribute a shared pool among qualifying participants
 * proportional to their contribution (pro-rata):
 *
 *   Tier 25%  → participant receives 25% of their pro-rata share
 *   Tier 50%  → participant receives 50% of their pro-rata share
 *   Tier 75%  → participant receives 75% of their pro-rata share
 *   Tier 100% → participant receives 100% of their pro-rata share
 *
 * "Pro-rata share" = (participant's contribution / total pool contributions)
 *                    × totalPool
 */

export type IncentiveTier = 25 | 50 | 75 | 100;

export interface IncentiveParticipant {
  userId: string;
  contribution: number; // amount this participant contributed to the pool
}

export interface IncentivePayout {
  userId: string;
  /** Gross pro-rata entitlement before tier deduction */
  proRataShare: number;
  /** Net amount actually paid out after applying tier */
  payout: number;
  tier: IncentiveTier;
}

/**
 * Calculates pro-rata incentive payouts for a pool of participants.
 *
 * @param totalPool     - Total amount available for distribution (USD).
 * @param participants  - List of participants and their contributions.
 * @param tier          - The incentive tier to apply (25 | 50 | 75 | 100).
 * @returns Array of payouts, one per participant.
 *
 * @example
 *   // $1000 pool split between two users with equal contributions at 50% tier
 *   calculateIncentivePayouts(1000, [
 *     { userId: "a", contribution: 500 },
 *     { userId: "b", contribution: 500 },
 *   ], 50);
 *   // → [{ userId: "a", proRataShare: 500, payout: 250, tier: 50 }, ...]
 */
export function calculateIncentivePayouts(
  totalPool: number,
  participants: IncentiveParticipant[],
  tier: IncentiveTier,
): IncentivePayout[] {
  if (totalPool <= 0) return [];
  if (participants.length === 0) return [];

  const totalContribution = participants.reduce(
    (sum, p) => sum + p.contribution,
    0,
  );

  if (totalContribution <= 0) {
    throw new Error(
      "calculateIncentivePayouts: total participant contribution must be > 0",
    );
  }

  return participants.map((p) => {
    const proRataShare = round8((p.contribution / totalContribution) * totalPool);
    const payout = round8(proRataShare * (tier / 100));
    return { userId: p.userId, proRataShare, payout, tier };
  });
}

/**
 * Splits a pool equally among participants at a given tier.
 * Useful for leader-pool and reward-pool distributions where
 * each qualifying member gets an equal slice.
 *
 * @param totalPool    - Total amount to distribute.
 * @param userIds      - IDs of qualifying participants.
 * @param tier         - The incentive tier to apply.
 * @returns Array of payouts.
 */
export function calculateEqualIncentivePayouts(
  totalPool: number,
  userIds: string[],
  tier: IncentiveTier,
): IncentivePayout[] {
  if (userIds.length === 0) return [];
  const equalContribution = totalPool / userIds.length;
  const participants: IncentiveParticipant[] = userIds.map((userId) => ({
    userId,
    contribution: equalContribution,
  }));
  return calculateIncentivePayouts(totalPool, participants, tier);
}

/**
 * Returns the sum of all payouts in a payout array.
 * Useful for verifying no more than totalPool is distributed.
 */
export function sumPayouts(payouts: IncentivePayout[]): number {
  return round8(payouts.reduce((sum, p) => sum + p.payout, 0));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round8(value: number): number {
  return Math.round(value * 1e8) / 1e8;
}
