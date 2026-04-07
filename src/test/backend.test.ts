/**
 * Tests for the production-remediated backend utilities.
 * Validates exact plan math, commission distribution, flushout logic,
 * incentive tiers, cron helpers, and EIP-712 nonce atomicity.
 */

import { describe, it, expect } from "vitest";

// ── Utilities under test ──────────────────────────────────────────────────────
import {
  calculateLevelCommissions,
  unclaimedLevelCommission,
  LEVEL_COMMISSION_RATES,
} from "../utils/commissionLogic";

import {
  computeFlushout,
  determineFlushoutReason,
  FlushoutReason,
  FLUSHOUT_PLAN_CONFIG,
} from "../utils/flushoutLogic";

import {
  calculateIncentivePayouts,
  calculateEqualIncentivePayouts,
  sumPayouts,
} from "../utils/incentiveLogic";

import {
  lastDayOfMonth,
  isLeapYear,
  buildMonthlyCronExpression,
} from "../utils/cronJobs";

import {
  buildWithdrawalMessage,
  buildWithdrawalSignatureRequest,
  incrementNonceAtomic,
} from "../utils/eip712";

import {
  processEntryFee,
  processSlotFlushout,
  getAllPlans,
  getPlanById,
  getPlanOrThrow,
  PLAN_CONFIGS,
} from "../controllers/planController";

// ─── Commission Logic ─────────────────────────────────────────────────────────

describe("commissionLogic", () => {
  it("LEVEL_COMMISSION_RATES percentages sum to 10 (10% of entryFee)", () => {
    const total = LEVEL_COMMISSION_RATES.reduce((s, r) => s + r.percentage, 0);
    expect(total).toBe(10);
  });

  it("distributes commissions to 7 levels with correct USD amounts for $5 entry", () => {
    const chain = ["u1", "u2", "u3", "u4", "u5", "u6", "u7"];
    const dist = calculateLevelCommissions(5, chain); // $5 entry fee
    expect(dist).toHaveLength(7);
    // Level 1: 4% of $5 = $0.20
    expect(dist[0]).toMatchObject({ level: 1, userId: "u1", amount: 0.2 });
    // Level 2: 2% of $5 = $0.10
    expect(dist[1]).toMatchObject({ level: 2, userId: "u2", amount: 0.1 });
    // Level 3: 1% of $5 = $0.05
    expect(dist[2]).toMatchObject({ level: 3, userId: "u3", amount: 0.05 });
    // Level 6: 0.5% of $5 = $0.025
    expect(dist[5]).toMatchObject({ level: 6, userId: "u6", amount: 0.025 });
    // Level 7: 0.5% of $5 = $0.025
    expect(dist[6]).toMatchObject({ level: 7, userId: "u7", amount: 0.025 });
    // Total = 10% of $5 = $0.50
    const total = dist.reduce((s, d) => s + d.amount, 0);
    expect(total).toBeCloseTo(0.5, 8);
  });

  it("handles a short sponsor chain (3 levels) and returns unclaimed amount", () => {
    const chain = ["u1", "u2", "u3"];
    const dist = calculateLevelCommissions(5, chain); // $5 entry fee
    expect(dist).toHaveLength(3);
    const unclaimed = unclaimedLevelCommission(5, chain);
    // Levels 1-3 claimed: (4+2+1)% of $5 = 7% = $0.35
    // Levels 4-7 unclaimed: (1+1+0.5+0.5)% of $5 = 3% = $0.15
    expect(unclaimed).toBeCloseTo(0.15, 8);
  });

  it("unclaimed is 0 when full 7-level chain is provided", () => {
    const chain = ["u1", "u2", "u3", "u4", "u5", "u6", "u7"];
    expect(unclaimedLevelCommission(5, chain)).toBeCloseTo(0, 8);
  });

  it("levelCut 0.5 (Plan 1) level-1 gets 4% of $5 = $0.20", () => {
    const chain = ["u1"];
    const dist = calculateLevelCommissions(5, chain); // entryFee = $5
    expect(dist[0].amount).toBeCloseTo(0.2, 8); // 4% of $5 = $0.20
  });
});

// ─── Flushout Logic ──────────────────────────────────────────────────────────

describe("flushoutLogic — plan math", () => {
  const cases = [
    [1, 12,  2,  1,  0, 0],
    [2, 30,  2,  2,  2, 0],
    [3, 80,  4,  4,  3, 0],
    [4, 200, 10, 8,  4, 2],
    [5, 400, 20, 16, 10, 2],
    [6, 800, 40, 24, 12, 4],
  ] as const;

  cases.forEach(([planId, profit, sysFee, leader, reward, sponsor]) => {
    it(`Plan ${planId}: correct flushout distribution`, () => {
      const result = computeFlushout(`slot-${planId}`, planId, FlushoutReason.TEAM_FILLED, false);
      expect(result.alreadyProcessed).toBe(false);
      expect(result.memberProfit).toBe(profit);
      expect(result.systemFee).toBe(sysFee);
      expect(result.leaderPool).toBe(leader);
      expect(result.rewardPool).toBe(reward);
      expect(result.sponsorPool).toBe(sponsor);
    });
  });

  it("returns all zeros and alreadyProcessed=true when slot was already processed", () => {
    const result = computeFlushout("s1", 1, FlushoutReason.TIME_EXPIRED, true);
    expect(result.alreadyProcessed).toBe(true);
    expect(result.memberProfit).toBe(0);
    expect(result.systemFee).toBe(0);
  });

  it("throws for unknown planId", () => {
    expect(() => computeFlushout("s1", 99, FlushoutReason.TEAM_FILLED, false)).toThrow();
  });
});

describe("flushoutLogic — determineFlushoutReason", () => {
  const futureDate = new Date(Date.now() + 86400000);
  const pastDate   = new Date(Date.now() - 86400000);

  it("returns TEAM_FILLED when currentMembers >= teamSize", () => {
    expect(determineFlushoutReason(3, 3, futureDate)).toBe(FlushoutReason.TEAM_FILLED);
    expect(determineFlushoutReason(3, 5, futureDate)).toBe(FlushoutReason.TEAM_FILLED);
  });

  it("returns TIME_EXPIRED when past expiry and team not filled", () => {
    expect(determineFlushoutReason(3, 1, pastDate)).toBe(FlushoutReason.TIME_EXPIRED);
  });

  it("returns null when neither condition is met", () => {
    expect(determineFlushoutReason(3, 2, futureDate)).toBeNull();
  });
});

// ─── Incentive Logic ─────────────────────────────────────────────────────────

describe("incentiveLogic", () => {
  it("splits $1000 pool equally at 100% tier", () => {
    const payouts = calculateEqualIncentivePayouts(1000, ["a", "b"], 100);
    expect(payouts[0].payout).toBe(500);
    expect(payouts[1].payout).toBe(500);
    expect(sumPayouts(payouts)).toBe(1000);
  });

  it("applies 50% tier correctly", () => {
    const payouts = calculateEqualIncentivePayouts(1000, ["a", "b"], 50);
    expect(payouts[0].payout).toBe(250);
    expect(sumPayouts(payouts)).toBe(500);
  });

  it("pro-rata split by contribution at 75% tier", () => {
    const payouts = calculateIncentivePayouts(
      1000,
      [
        { userId: "a", contribution: 300 },
        { userId: "b", contribution: 700 },
      ],
      75,
    );
    // pro-rata: a=300, b=700
    // payouts:  a=300*0.75=225, b=700*0.75=525
    expect(payouts[0].payout).toBeCloseTo(225, 6);
    expect(payouts[1].payout).toBeCloseTo(525, 6);
  });

  it("returns [] for empty participant list", () => {
    expect(calculateIncentivePayouts(1000, [], 100)).toEqual([]);
  });

  it("returns [] for totalPool=0", () => {
    expect(calculateEqualIncentivePayouts(0, ["a", "b"], 100)).toEqual([]);
  });
});

// ─── Cron Jobs ───────────────────────────────────────────────────────────────

describe("cronJobs — date helpers", () => {
  it("correctly identifies leap years", () => {
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2023)).toBe(false);
  });

  it("lastDayOfMonth handles February in non-leap year (28)", () => {
    expect(lastDayOfMonth(2023, 2)).toBe(28);
  });

  it("lastDayOfMonth handles February in leap year (29)", () => {
    expect(lastDayOfMonth(2024, 2)).toBe(29);
  });

  it("lastDayOfMonth returns 31 for January", () => {
    expect(lastDayOfMonth(2024, 1)).toBe(31);
  });

  it("lastDayOfMonth returns 30 for April", () => {
    expect(lastDayOfMonth(2024, 4)).toBe(30);
  });

  it("buildMonthlyCronExpression uses correct last day for February 2024", () => {
    const feb2024 = new Date(2024, 1, 1); // Feb 1 2024
    const expr = buildMonthlyCronExpression(feb2024);
    expect(expr).toBe("0 0 29 2 *");
  });

  it("buildMonthlyCronExpression uses 28 for February 2023", () => {
    const feb2023 = new Date(2023, 1, 1);
    expect(buildMonthlyCronExpression(feb2023)).toBe("0 0 28 2 *");
  });
});

// ─── EIP-712 ─────────────────────────────────────────────────────────────────

describe("eip712", () => {
  it("buildWithdrawalMessage constructs correct payload", () => {
    const msg = buildWithdrawalMessage("user-1", "1000000000000000000", 5);
    expect(msg).toEqual({ userId: "user-1", amount: "1000000000000000000", nonce: 5 });
  });

  it("buildWithdrawalSignatureRequest includes domain, types, and message", () => {
    const req = buildWithdrawalSignatureRequest("u1", "500", 3, "0xContract", 1);
    expect(req.domain.chainId).toBe(1);
    expect(req.domain.verifyingContract).toBe("0xContract");
    expect(req.types.Withdrawal).toBeDefined();
    expect(req.message.nonce).toBe(3);
  });

  it("incrementNonceAtomic increments correctly", async () => {
    let storedNonce = 4;
    const result = await incrementNonceAtomic(
      "user-1",
      async (current) => {
        storedNonce = current + 1;
        return storedNonce;
      },
      async (_userId) => storedNonce,
    );
    expect(result.previousNonce).toBe(4);
    expect(result.newNonce).toBe(5);
  });

  it("incrementNonceAtomic throws if update returns unexpected nonce", async () => {
    await expect(
      incrementNonceAtomic(
        "user-1",
        async (_current) => 99, // wrong!
        async (_userId) => 4,
      ),
    ).rejects.toThrow();
  });
});

// ─── Plan Controller ─────────────────────────────────────────────────────────

describe("planController — entry fee splits", () => {
  const cases = [
    [1, 5,   1,  0.5, 0.5, 3  ],
    [2, 10,  2,  1,   1,   6  ],
    [3, 20,  4,  1,   2,   13 ],
    [4, 40,  7,  1,   4,   28 ],
    [5, 80,  14, 2,   8,   56 ],
    [6, 160, 32, 2,   16,  110],
  ] as const;

  cases.forEach(([planId, entryFee, upline, system, level, slot]) => {
    it(`Plan ${planId} ($${entryFee}): upline=${upline}, system=${system}, level=${level}, slot=${slot}`, () => {
      // Use a full 7-level sponsor chain so no unclaimed commission is added to systemFee
      const chain = ["u1","u2","u3","u4","u5","u6","u7"];
      const result = processEntryFee(planId, chain);
      expect(result.entryFee).toBe(entryFee);
      expect(result.uplinePayout).toBe(upline);
      expect(result.systemFee).toBeCloseTo(system, 6);
      expect(result.slotCredit).toBe(slot);
    });
  });

  it("adds unclaimed level commission to system fee when chain is short", () => {
    const result = processEntryFee(1, []); // no uplines, entryFee = $5
    // All 10% of levelCut ($0.50) is unclaimed → systemFee = 0.5 + 0.5 = 1.0
    expect(result.systemFee).toBeCloseTo(1.0, 6);
    expect(result.unclaimedLevelCommission).toBeCloseTo(0.5, 6);
  });
});

describe("planController — slot flushout", () => {
  const futureDate = new Date(Date.now() + 86400000);
  const pastDate   = new Date(Date.now() - 86400000);

  it("returns null when slot is not yet flushable", () => {
    expect(processSlotFlushout({
      slotId: "s1", planId: 1, currentMembers: 1,
      expiresAt: futureDate, alreadyProcessed: false,
    })).toBeNull();
  });

  it("returns flushout result for TEAM_FILLED", () => {
    const result = processSlotFlushout({
      slotId: "s1", planId: 2, currentMembers: 3,
      expiresAt: futureDate, alreadyProcessed: false,
    });
    expect(result?.memberProfit).toBe(30);
    expect(result?.reason).toBe(FlushoutReason.TEAM_FILLED);
  });

  it("returns flushout result for TIME_EXPIRED", () => {
    const result = processSlotFlushout({
      slotId: "s1", planId: 3, currentMembers: 1,
      expiresAt: pastDate, alreadyProcessed: false,
    });
    expect(result?.memberProfit).toBe(80);
    expect(result?.reason).toBe(FlushoutReason.TIME_EXPIRED);
  });

  it("returns alreadyProcessed=true without distributing when slot was processed", () => {
    const result = processSlotFlushout({
      slotId: "s1", planId: 1, currentMembers: 5,
      expiresAt: futureDate, alreadyProcessed: true,
    });
    expect(result?.alreadyProcessed).toBe(true);
    expect(result?.memberProfit).toBe(0);
  });
});

describe("planController — plan listing helpers", () => {
  it("getAllPlans returns 6 plans sorted by id", () => {
    const plans = getAllPlans();
    expect(plans).toHaveLength(6);
    expect(plans.map((p) => p.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("getPlanById returns undefined for invalid id", () => {
    expect(getPlanById(99)).toBeUndefined();
  });

  it("getPlanOrThrow throws for unknown planId", () => {
    expect(() => getPlanOrThrow(0)).toThrow();
  });
});
