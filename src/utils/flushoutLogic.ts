/**
 * flushoutLogic.ts
 *
 * Handles flushout events for completed slots.
 *
 * A flushout is triggered by one of two reasons:
 *   • TEAM_FILLED  — the required number of members joined under a slot.
 *   • TIME_EXPIRED — the slot's expiry timestamp has passed.
 *
 * Both reasons use the same distribution logic; only the trigger differs.
 *
 * Per-plan distribution (all values in USD):
 * ┌──────┬──────────┬────────────┬──────────┬───────────┬────────────┬─────────────┐
 * │ Plan │ Entry($) │ MemberProfit│ SystemFee│ LeaderPool│ RewardPool │ SponsorPool │
 * ├──────┼──────────┼────────────┼──────────┼───────────┼────────────┼─────────────┤
 * │  1   │     5    │     12     │     2    │     1     │      0     │      0      │
 * │  2   │    10    │     30     │     2    │     2     │      2     │      0      │
 * │  3   │    20    │     80     │     4    │     4     │      3     │      0      │
 * │  4   │    40    │    200     │    10    │     8     │      4     │      2      │
 * │  5   │    80    │    400     │    20    │    16     │     10     │      2      │
 * │  6   │   160    │    800     │    40    │    24     │     12     │      4      │
 * └──────┴──────────┴────────────┴──────────┴───────────┴────────────┴─────────────┘
 *
 * Idempotency: before processing a flushout the caller must check that no
 * Flushout record exists for the slot (unique constraint on slotId).
 */

export enum FlushoutReason {
  TEAM_FILLED = "TEAM_FILLED",
  TIME_EXPIRED = "TIME_EXPIRED",
}

export interface FlushoutPlanConfig {
  planId: number;
  memberProfit: number;
  systemFee: number;
  leaderPool: number;
  rewardPool: number;
  sponsorPool: number;
}

/** Canonical flushout amounts per plan, keyed by planId */
export const FLUSHOUT_PLAN_CONFIG: Record<number, FlushoutPlanConfig> = {
  1: { planId: 1, memberProfit: 12, systemFee: 2,  leaderPool: 1,  rewardPool: 0,  sponsorPool: 0 },
  2: { planId: 2, memberProfit: 30, systemFee: 2,  leaderPool: 2,  rewardPool: 2,  sponsorPool: 0 },
  3: { planId: 3, memberProfit: 80, systemFee: 4,  leaderPool: 4,  rewardPool: 3,  sponsorPool: 0 },
  4: { planId: 4, memberProfit: 200,systemFee: 10, leaderPool: 8,  rewardPool: 4,  sponsorPool: 2 },
  5: { planId: 5, memberProfit: 400,systemFee: 20, leaderPool: 16, rewardPool: 10, sponsorPool: 2 },
  6: { planId: 6, memberProfit: 800,systemFee: 40, leaderPool: 24, rewardPool: 12, sponsorPool: 4 },
};

export interface FlushoutResult {
  slotId: string;
  planId: number;
  reason: FlushoutReason;
  memberProfit: number;
  systemFee: number;
  leaderPool: number;
  rewardPool: number;
  sponsorPool: number;
  alreadyProcessed: boolean;
}

/**
 * Computes the flushout distribution for a given slot.
 *
 * @param slotId           - UUID of the slot being flushed.
 * @param planId           - Plan identifier (1–6).
 * @param reason           - TEAM_FILLED or TIME_EXPIRED.
 * @param alreadyProcessed - Pass `true` if a Flushout record already exists
 *                           for this slot (idempotency guard: caller checked DB).
 * @returns FlushoutResult with distribution amounts.
 * @throws   If `planId` is not in FLUSHOUT_PLAN_CONFIG.
 */
export function computeFlushout(
  slotId: string,
  planId: number,
  reason: FlushoutReason,
  alreadyProcessed: boolean,
): FlushoutResult {
  const config = FLUSHOUT_PLAN_CONFIG[planId];
  if (!config) {
    throw new Error(
      `computeFlushout: unknown planId "${planId}". Valid IDs: ${Object.keys(FLUSHOUT_PLAN_CONFIG).join(", ")}`,
    );
  }

  if (alreadyProcessed) {
    return {
      slotId,
      planId,
      reason,
      memberProfit: 0,
      systemFee: 0,
      leaderPool: 0,
      rewardPool: 0,
      sponsorPool: 0,
      alreadyProcessed: true,
    };
  }

  return {
    slotId,
    planId,
    reason,
    memberProfit: round8(config.memberProfit),
    systemFee:    round8(config.systemFee),
    leaderPool:   round8(config.leaderPool),
    rewardPool:   round8(config.rewardPool),
    sponsorPool:  round8(config.sponsorPool),
    alreadyProcessed: false,
  };
}

/**
 * Determines the flushout reason for a slot given the current time.
 *
 * @param teamSize      - Number of members required for TEAM_FILLED.
 * @param currentMembers - Current filled member count under this slot.
 * @param expiresAt     - Slot expiry timestamp.
 * @param now           - Current timestamp (defaults to Date.now()).
 * @returns FlushoutReason or `null` if the slot should not yet be flushed.
 */
export function determineFlushoutReason(
  teamSize: number,
  currentMembers: number,
  expiresAt: Date,
  now: Date = new Date(),
): FlushoutReason | null {
  if (currentMembers >= teamSize) {
    return FlushoutReason.TEAM_FILLED;
  }
  if (now >= expiresAt) {
    return FlushoutReason.TIME_EXPIRED;
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round8(value: number): number {
  return Math.round(value * 1e8) / 1e8;
}
