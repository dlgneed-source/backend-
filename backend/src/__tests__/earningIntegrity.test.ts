import { describe, expect, it } from "vitest";
import {
  calculateAggregateTotals,
  calculateCommissionTotal,
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

  it("calculates commission totals from slotFee correctly", () => {
    expect(calculateCommissionTotal(3)).toBe(0.3);
    expect(calculateCommissionTotal(6)).toBe(0.6);
    expect(calculateCommissionTotal(110)).toBe(11);
  });

  it("handles multi-plan, multiple ID totals", () => {
    const aggregate = calculateAggregateTotals([
      {
        planId: 1,
        enrollmentCount: 3,
        slotFee: 3,
        memberProfit: 12,
        leaderPool: 1,
        rewardPool: 0,
        sponsorPool: 0,
      },
      {
        planId: 4,
        enrollmentCount: 2,
        slotFee: 28,
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
      commissionTotal: 0.9,
      poolTotal: 3,
      flushoutTotal: 39,
    });
    expect(aggregate.plans[1]).toMatchObject({
      planId: 4,
      enrollmentCount: 2,
      commissionTotal: 5.6,
      poolTotal: 28,
      flushoutTotal: 428,
    });

    expect(aggregate.totals.commissionTotal).toBe(6.5);
    expect(aggregate.totals.poolTotal).toBe(31);
    expect(aggregate.totals.flushoutTotal).toBe(467);
  });

  it("keeps rounding consistent for edge values", () => {
    const totals = calculatePlanTotals({
      planId: 99,
      enrollmentCount: 7,
      slotFee: 1.9999999,
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
        slotFee: 3,
        memberProfit: 12,
        leaderPool: 1,
        rewardPool: 0,
        sponsorPool: 0,
      })
    ).toThrow("enrollmentCount must be an integer");
  });
});
