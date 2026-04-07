/**
 * planController.ts
 *
 * Remediated plan controller implementing the exact income model math.
 *
 * Per-plan entry split:
 * ┌──────┬──────────┬─────────┬───────────┬──────────┬──────────┐
 * │ Plan │ Entry($) │ Upline  │ System    │ Level    │ Slot     │
 * ├──────┼──────────┼─────────┼───────────┼──────────┼──────────┤
 * │  1   │     5    │   1.00  │   0.50    │   0.50   │   3.00   │
 * │  2   │    10    │   2.00  │   1.00    │   1.00   │   6.00   │
 * │  3   │    20    │   4.00  │   1.00    │   2.00   │  13.00   │
 * │  4   │    40    │   7.00  │   1.00    │   4.00   │  28.00   │
 * │  5   │    80    │  14.00  │   2.00    │   8.00   │  56.00   │
 * │  6   │   160    │  32.00  │   2.00    │  16.00   │ 110.00   │
 * └──────┴──────────┴─────────┴───────────┴──────────┴──────────┘
 */

import {
  calculateLevelCommissions,
  unclaimedLevelCommission,
  type CommissionDistribution,
} from "../utils/commissionLogic";

import {
  computeFlushout,
  determineFlushoutReason,
  FlushoutReason,
  type FlushoutResult,
  FLUSHOUT_PLAN_CONFIG,
} from "../utils/flushoutLogic";

// ─── Plan configurations ──────────────────────────────────────────────────────

export interface PlanConfig {
  id: number;
  name: string;
  entryFee: number;
  uplineCut: number;
  systemCut: number;
  levelCut: number;
  slotAmount: number;
  teamSize: number;
  expiryDays: number;
}

/** Canonical plan configurations — single source of truth */
export const PLAN_CONFIGS: Record<number, PlanConfig> = {
  1: { id: 1, name: "Plan 1", entryFee: 5,   uplineCut: 1,  systemCut: 0.5, levelCut: 0.5, slotAmount: 3,   teamSize: 3,  expiryDays: 30 },
  2: { id: 2, name: "Plan 2", entryFee: 10,  uplineCut: 2,  systemCut: 1,   levelCut: 1,   slotAmount: 6,   teamSize: 3,  expiryDays: 30 },
  3: { id: 3, name: "Plan 3", entryFee: 20,  uplineCut: 4,  systemCut: 1,   levelCut: 2,   slotAmount: 13,  teamSize: 3,  expiryDays: 30 },
  4: { id: 4, name: "Plan 4", entryFee: 40,  uplineCut: 7,  systemCut: 1,   levelCut: 4,   slotAmount: 28,  teamSize: 3,  expiryDays: 30 },
  5: { id: 5, name: "Plan 5", entryFee: 80,  uplineCut: 14, systemCut: 2,   levelCut: 8,   slotAmount: 56,  teamSize: 3,  expiryDays: 30 },
  6: { id: 6, name: "Plan 6", entryFee: 160, uplineCut: 32, systemCut: 2,   levelCut: 16,  slotAmount: 110, teamSize: 3,  expiryDays: 30 },
};

// ─── Entry split ──────────────────────────────────────────────────────────────

export interface EntrySplitResult {
  planId: number;
  entryFee: number;
  uplinePayout: number;
  systemFee: number;
  levelCommissions: CommissionDistribution[];
  unclaimedLevelCommission: number;
  slotCredit: number;
}

/**
 * Calculates how an entry fee is split at the moment of joining a plan.
 *
 * @param planId       - Plan identifier (1–6).
 * @param sponsorChain - Ordered upline user IDs (direct upline first).
 */
export function processEntryFee(
  planId: number,
  sponsorChain: string[],
): EntrySplitResult {
  const plan = getPlanOrThrow(planId);

  const levelCommissions = calculateLevelCommissions(
    plan.entryFee,
    sponsorChain,
  );

  const unclaimed = unclaimedLevelCommission(plan.entryFee, sponsorChain);

  return {
    planId,
    entryFee: plan.entryFee,
    uplinePayout: plan.uplineCut,
    systemFee: round8(plan.systemCut + unclaimed),
    levelCommissions,
    unclaimedLevelCommission: unclaimed,
    slotCredit: plan.slotAmount,
  };
}

// ─── Flushout ─────────────────────────────────────────────────────────────────

export interface SlotFlushoutInput {
  slotId: string;
  planId: number;
  currentMembers: number;
  expiresAt: Date;
  alreadyProcessed: boolean;
  now?: Date;
}

/**
 * Determines whether a slot should be flushed and computes the distribution.
 *
 * @returns FlushoutResult if the slot qualifies, `null` otherwise.
 */
export function processSlotFlushout(
  input: SlotFlushoutInput,
): FlushoutResult | null {
  const plan = getPlanOrThrow(input.planId);

  const reason = determineFlushoutReason(
    plan.teamSize,
    input.currentMembers,
    input.expiresAt,
    input.now,
  );

  if (!reason) return null;

  return computeFlushout(
    input.slotId,
    input.planId,
    reason,
    input.alreadyProcessed,
  );
}

// ─── Plan listing ─────────────────────────────────────────────────────────────

/** Returns all plans as an array, sorted by planId ascending */
export function getAllPlans(): PlanConfig[] {
  return Object.values(PLAN_CONFIGS).sort((a, b) => a.id - b.id);
}

/** Returns a single plan by ID */
export function getPlanById(planId: number): PlanConfig | undefined {
  return PLAN_CONFIGS[planId];
}

/** Returns a single plan by ID, throwing if not found */
export function getPlanOrThrow(planId: number): PlanConfig {
  const plan = PLAN_CONFIGS[planId];
  if (!plan) {
    throw new Error(
      `getPlanOrThrow: unknown planId "${planId}". Valid IDs: ${Object.keys(PLAN_CONFIGS).join(", ")}`,
    );
  }
  return plan;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round8(value: number): number {
  return Math.round(value * 1e8) / 1e8;
}

// Re-export utility types for consumers
export type { CommissionDistribution, FlushoutResult, FlushoutReason };
export { FLUSHOUT_PLAN_CONFIG };
