import { describe, it, expect } from "vitest";
import {
  CLUB_INCENTIVES,
  INDIVIDUAL_INCENTIVES,
  checkClubIncentiveTier,
  type TeamReferralCounts,
} from "../utils/incentiveLogic";

describe("Incentive Logic", () => {
  describe("CLUB_INCENTIVES", () => {
    it("should have 4 tiers: BRONZE, SILVER, GOLD, PLATINUM", () => {
      expect(CLUB_INCENTIVES).toHaveLength(4);
      const ranks = CLUB_INCENTIVES.map((c) => c.rank);
      expect(ranks).toEqual(["BRONZE", "SILVER", "GOLD", "PLATINUM"]);
    });

    it("BRONZE tier should have correct requirements", () => {
      const bronze = CLUB_INCENTIVES[0];
      expect(bronze.plan1Ids).toBe(25);
      expect(bronze.plan2Ids).toBe(18);
      expect(bronze.plan3Ids).toBe(14);
      expect(bronze.plan4Ids).toBe(4);
      expect(bronze.plan5Ids).toBe(2);
      expect(bronze.plan6Ids).toBe(1);
      expect(bronze.reward).toBe(30);
    });

    it("SILVER tier should have correct requirements", () => {
      const silver = CLUB_INCENTIVES[1];
      expect(silver.plan1Ids).toBe(50);
      expect(silver.plan2Ids).toBe(36);
      expect(silver.plan3Ids).toBe(28);
      expect(silver.plan4Ids).toBe(8);
      expect(silver.plan5Ids).toBe(4);
      expect(silver.plan6Ids).toBe(2);
      expect(silver.reward).toBe(70);
    });

    it("GOLD tier should have correct requirements", () => {
      const gold = CLUB_INCENTIVES[2];
      expect(gold.plan1Ids).toBe(75);
      expect(gold.plan2Ids).toBe(54);
      expect(gold.plan3Ids).toBe(42);
      expect(gold.plan4Ids).toBe(12);
      expect(gold.plan5Ids).toBe(6);
      expect(gold.plan6Ids).toBe(3);
      expect(gold.reward).toBe(110);
    });

    it("PLATINUM tier should have correct requirements", () => {
      const platinum = CLUB_INCENTIVES[3];
      expect(platinum.plan1Ids).toBe(100);
      expect(platinum.plan2Ids).toBe(72);
      expect(platinum.plan3Ids).toBe(56);
      expect(platinum.plan4Ids).toBe(16);
      expect(platinum.plan5Ids).toBe(8);
      expect(platinum.plan6Ids).toBe(4);
      expect(platinum.reward).toBe(200);
    });
  });

  describe("INDIVIDUAL_INCENTIVES", () => {
    it("should have 6 individual incentive targets (one per plan)", () => {
      expect(INDIVIDUAL_INCENTIVES).toHaveLength(6);
    });

    it("Plan 1 individual incentive should require 100 referrals for $20 reward", () => {
      const p1 = INDIVIDUAL_INCENTIVES.find((i) => i.planId === 1);
      expect(p1?.target).toBe(100);
      expect(p1?.reward).toBe(20);
    });

    it("Plan 6 individual incentive should require 10 referrals for $30 reward", () => {
      const p6 = INDIVIDUAL_INCENTIVES.find((i) => i.planId === 6);
      expect(p6?.target).toBe(10);
      expect(p6?.reward).toBe(30);
    });
  });

  describe("checkClubIncentiveTier", () => {
    it("should return null when no tiers are met", () => {
      const counts: TeamReferralCounts = { plan1: 0, plan2: 0, plan3: 0, plan4: 0, plan5: 0, plan6: 0 };
      expect(checkClubIncentiveTier(counts)).toBeNull();
    });

    it("should return BRONZE tier when bronze requirements are met exactly", () => {
      const counts: TeamReferralCounts = {
        plan1: 25, plan2: 18, plan3: 14, plan4: 4, plan5: 2, plan6: 1,
      };
      const tier = checkClubIncentiveTier(counts);
      expect(tier?.rank).toBe("BRONZE");
    });

    it("should return SILVER tier when silver requirements are met", () => {
      const counts: TeamReferralCounts = {
        plan1: 50, plan2: 36, plan3: 28, plan4: 8, plan5: 4, plan6: 2,
      };
      const tier = checkClubIncentiveTier(counts);
      expect(tier?.rank).toBe("SILVER");
    });

    it("should return PLATINUM when all platinum requirements are met", () => {
      const counts: TeamReferralCounts = {
        plan1: 100, plan2: 72, plan3: 56, plan4: 16, plan5: 8, plan6: 4,
      };
      const tier = checkClubIncentiveTier(counts);
      expect(tier?.rank).toBe("PLATINUM");
    });

    it("should return BRONZE (not SILVER) when between tiers", () => {
      const counts: TeamReferralCounts = {
        plan1: 30, plan2: 20, plan3: 15, plan4: 5, plan5: 2, plan6: 1,
      };
      const tier = checkClubIncentiveTier(counts);
      expect(tier?.rank).toBe("BRONZE");
    });

    it("should return null if any plan requirement is not met", () => {
      const counts: TeamReferralCounts = {
        plan1: 25, plan2: 18, plan3: 14, plan4: 4, plan5: 2, plan6: 0, // plan6 not met
      };
      expect(checkClubIncentiveTier(counts)).toBeNull();
    });
  });
});
