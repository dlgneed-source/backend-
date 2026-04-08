import { describe, expect, it } from "vitest";
import {
  calculateAggregateTotals,
  calculateCommissionTotal,
  calculateEnrollmentPayoutTotal,
  calculateFlushoutTotal,
  calculatePlanTotals,
  calculatePoolTotal,
} from "../utils/earningIntegrity";

describe("earning integrity math", () => {
  it("calculates pool totals correctly", () => {
    expect(calculatePoolTotal({ leaderPool: 1, rewardPool: 2, sponsorPool: 3 })).toBe(6);
    expect(calculatePoolTotal({ leaderPool: 8, rewardPool: 4, sponsorPool: 2 })).toBe(14);
  });

  it("calculates flushout totals correctly", () => {
    expect(calculateFlushoutTotal({ memberProfit: 12, leaderPool: 1, rewardPool: 0, sponsorPool: 0 })).toBe(13);
    expect(calculateFlushoutTotal({ memberProfit: 200, leaderPool: 8, rewardPool: 4, sponsorPool: 2 })).toBe(214);
  });

  it("calculates commission totals from joiningFee correctly", () => {
    expect(calculateCommissionTotal(5)).toBe(0.5);
    expect(calculateCommissionTotal(10)).toBe(1);
    expect(calculateCommissionTotal(160)).toBe(16);
  });

  it("handles multi-plan, multiple ID totals", () => {
    const aggregate = calculateAggregateTotals([
      {
        planId: 1,
        enrollmentCount: 3,
        joiningFee: 5,
        memberProfit: 12,
        leaderPool: 1,
        rewardPool: 0,
        sponsorPool: 0,
      },
      {
        planId: 4,
        enrollmentCount: 2,
        joiningFee: 40,
        memberProfit: 200,
        leaderPool: 8,
        rewardPool: 4,
        sponsorPool: 2,
      },
    ]);

    expect(aggregate.plans).toHaveLength(2);
    expect(aggregate.plans[0]).toMatchObject({
      planId: 1,
      enrollmentCount: 3,
      commissionTotal: 1.5,
      poolTotal: 3,
      flushoutTotal: 39,
    });
    expect(aggregate.plans[1]).toMatchObject({
      planId: 4,
      enrollmentCount: 2,
      commissionTotal: 8,
      poolTotal: 28,
      flushoutTotal: 428,
    });

    expect(aggregate.totals.commissionTotal).toBe(9.5);
    expect(aggregate.totals.poolTotal).toBe(31);
    expect(aggregate.totals.flushoutTotal).toBe(467);
  });

  it("keeps rounding consistent for edge values", () => {
    const totals = calculatePlanTotals({
      planId: 99,
      enrollmentCount: 7,
      joiningFee: 1.9999999,
      memberProfit: 0.3333333,
      leaderPool: 0.1111111,
      rewardPool: 0.2222222,
      sponsorPool: 0.1234567,
    });

    expect(totals.commissionTotal).toBe(1.4);
    expect(totals.poolTotal).toBe(3.19753);
    expect(totals.flushoutTotal).toBe(5.530861);
  });

  it("rejects non-integer enrollmentCount to avoid silent truncation", () => {
    expect(() =>
      calculatePlanTotals({
        planId: 7,
        enrollmentCount: 2.5,
        joiningFee: 5,
        memberProfit: 12,
        leaderPool: 1,
        rewardPool: 0,
        sponsorPool: 0,
      })
    ).toThrow("enrollmentCount must be an integer");
  });

  it("matches plan economics totals for Plan 1-6", () => {
    const plans = [
      { planId: 1, joiningFee: 5, uplineCommission: 1, systemFee: 0.5, levelCommission: 0.5, memberProfit: 12, leaderPool: 1, rewardPool: 0, sponsorPool: 0, totalCollection: 15 },
      { planId: 2, joiningFee: 10, uplineCommission: 2, systemFee: 1, levelCommission: 1, memberProfit: 30, leaderPool: 2, rewardPool: 2, sponsorPool: 0, totalCollection: 38 },
      { planId: 3, joiningFee: 20, uplineCommission: 4, systemFee: 1, levelCommission: 2, memberProfit: 80, leaderPool: 4, rewardPool: 3, sponsorPool: 0, totalCollection: 94 },
      { planId: 4, joiningFee: 40, uplineCommission: 7, systemFee: 1, levelCommission: 4, memberProfit: 200, leaderPool: 8, rewardPool: 4, sponsorPool: 2, totalCollection: 226 },
      { planId: 5, joiningFee: 80, uplineCommission: 14, systemFee: 2, levelCommission: 8, memberProfit: 400, leaderPool: 16, rewardPool: 10, sponsorPool: 2, totalCollection: 452 },
      { planId: 6, joiningFee: 160, uplineCommission: 32, systemFee: 2, levelCommission: 16, memberProfit: 800, leaderPool: 24, rewardPool: 12, sponsorPool: 4, totalCollection: 890 },
    ];

    for (const plan of plans) {
      expect(calculateCommissionTotal(plan.joiningFee)).toBe(plan.levelCommission);
      expect(calculateEnrollmentPayoutTotal(plan)).toBe(plan.totalCollection);
    }
  });
});
