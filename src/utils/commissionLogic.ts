/**
 * commissionLogic.ts
 *
 * Exact level-based upline commission distribution.
 *
 * Level rates as a percentage of the plan's entry fee:
 *   Level 1 → 4%   of entryFee
 *   Level 2 → 2%   of entryFee
 *   Level 3 → 1%   of entryFee
 *   Level 4 → 1%   of entryFee
 *   Level 5 → 1%   of entryFee
 *   Level 6 → 0.5% of entryFee
 *   Level 7 → 0.5% of entryFee
 *
 * Total = 10% of entryFee — which equals the plan's `levelCut` field.
 * Remaining 90% of entryFee is split between upline, system, and slot
 * as defined in the plan configuration.
 */

export interface LevelCommission {
  level: number;
  /** Percentage of entryFee allocated to this level (e.g. 4 means 4%) */
  percentage: number;
}

/** Ordered commission rates for levels 1 through 7 (percentages of entryFee) */
export const LEVEL_COMMISSION_RATES: LevelCommission[] = [
  { level: 1, percentage: 4   }, // 4% of entryFee
  { level: 2, percentage: 2   }, // 2% of entryFee
  { level: 3, percentage: 1   }, // 1% of entryFee
  { level: 4, percentage: 1   }, // 1% of entryFee
  { level: 5, percentage: 1   }, // 1% of entryFee
  { level: 6, percentage: 0.5 }, // 0.5% of entryFee
  { level: 7, percentage: 0.5 }, // 0.5% of entryFee
];

/** Sum of all level percentages = 10% of entryFee = levelCut */
const TOTAL_LEVEL_PERCENTAGE = LEVEL_COMMISSION_RATES.reduce(
  (sum, r) => sum + r.percentage,
  0,
);

if (TOTAL_LEVEL_PERCENTAGE !== 10) {
  throw new Error(
    `LEVEL_COMMISSION_RATES must sum to 10% of entryFee, got ${TOTAL_LEVEL_PERCENTAGE}`,
  );
}

export interface CommissionDistribution {
  level: number;
  userId: string;
  amount: number; // USD, rounded to 8 decimal places
}

/**
 * Calculates how much each upline in the sponsor chain receives.
 *
 * @param entryFee     - Full plan entry fee in USD (e.g. 5, 10, 20 …).
 * @param sponsorChain - Array of user IDs ordered from direct upline (level 1)
 *                       up to the 7th ancestor.  May be shorter than 7 entries
 *                       if the chain is shallower; unclaimed commission is
 *                       retained in the system fee pool (caller's responsibility).
 * @returns Array of distributions, one per qualifying upline.
 */
export function calculateLevelCommissions(
  entryFee: number,
  sponsorChain: string[],
): CommissionDistribution[] {
  const distributions: CommissionDistribution[] = [];
  const depth = Math.min(sponsorChain.length, LEVEL_COMMISSION_RATES.length);

  for (let i = 0; i < depth; i++) {
    const rate = LEVEL_COMMISSION_RATES[i];
    const amount = round8(entryFee * (rate.percentage / 100));
    distributions.push({
      level: rate.level,
      userId: sponsorChain[i],
      amount,
    });
  }

  return distributions;
}

/**
 * Returns the portion of the level-commission budget (10% of entryFee) that
 * was NOT distributed because the sponsor chain was shorter than 7 levels.
 * This should be credited to the system fee ledger.
 *
 * @param entryFee     - Full plan entry fee in USD.
 * @param sponsorChain - Sponsor chain used when distributing commissions.
 */
export function unclaimedLevelCommission(
  entryFee: number,
  sponsorChain: string[],
): number {
  const totalLevelBudget = round8(entryFee * (TOTAL_LEVEL_PERCENTAGE / 100));
  const distributed = calculateLevelCommissions(entryFee, sponsorChain).reduce(
    (sum, d) => sum + d.amount,
    0,
  );
  return round8(totalLevelBudget - distributed);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Round to 8 decimal places to match Decimal(20,8) storage precision */
function round8(value: number): number {
  return Math.round(value * 1e8) / 1e8;
}
