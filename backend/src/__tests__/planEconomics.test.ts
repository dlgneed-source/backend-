import { describe, expect, it } from "vitest";
import { buildPlanEconomicsSnapshot } from "../utils/planEconomics";

describe("plan economics snapshot", () => {
  it("builds backend source-of-truth economics with level-chain validation", () => {
    const snapshot = buildPlanEconomicsSnapshot([
      {
        id: 1,
        name: "Foundation",
        joiningFee: 5,
        teamSize: 5,
        uplineCommission: 1,
        systemFee: 0.5,
        levelCommission: 0.5,
        slotFee: 3,
        totalCollection: 15,
        memberProfit: 12,
        leaderPool: 1,
        rewardPool: 0,
        sponsorPool: 0,
        roi: 240,
        flushoutDays: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    expect(snapshot.backendSourceOfTruth).toBe(true);
    expect(snapshot.levelCommissionChain.totalPercentage).toBe(10);
    expect(snapshot.plans).toHaveLength(1);
    expect(snapshot.plans[0].validations.levelCommissionMatches).toBe(true);
    expect(snapshot.plans[0].validations.totalCollectionMatches).toBe(true);
    expect(snapshot.plans[0].flushout.payoutTotal).toBe(13);
  });
});
