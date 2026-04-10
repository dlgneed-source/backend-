import { describe, expect, it } from "vitest";
import { buildCommissionLevelSummary } from "../utils/commissionSummary";

describe("buildCommissionLevelSummary", () => {
  it("keeps direct upline separate from level chain", () => {
    const summary = buildCommissionLevelSummary({
      uplineAmount: 2,
      levelAmounts: [{ level: 2, amount: 1 }],
    });

    expect(summary.levels[0]).toMatchObject({
      key: "DIRECT_UPLINE",
      label: "Direct Upline",
      percentage: null,
      amount: 2,
    });
    expect(summary.levels[1]).toMatchObject({
      label: "Level 2",
      percentage: 4,
      amount: 1,
    });
  });

  it("returns percentage chain for level 2 to level 8", () => {
    const summary = buildCommissionLevelSummary({});
    expect(summary.levels.map((level) => level.label)).toEqual([
      "Direct Upline",
      "Level 2",
      "Level 3",
      "Level 4",
      "Level 5",
      "Level 6",
      "Level 7",
      "Level 8",
    ]);
    expect(summary.levels.map((level) => level.percentage)).toEqual([
      null,
      4,
      2,
      1,
      1,
      1,
      0.5,
      0.5,
    ]);
  });

  it("uses precision-safe rounding", () => {
    const summary = buildCommissionLevelSummary({
      uplineAmount: 0.123456789,
      levelAmounts: [{ level: 2, amount: 0.333333335 }],
    });

    expect(summary.levels[0].amount).toBe(0.123457);
    expect(summary.levels[1].amount).toBe(0.333333);
    expect(summary.totalEarned).toBe(0.45679);
  });

  it("safely handles empty and null data", () => {
    const summary = buildCommissionLevelSummary({
      uplineAmount: null,
      levelAmounts: null,
    });

    expect(summary.totalEarned).toBe(0);
    expect(summary.levels).toHaveLength(8);
    expect(summary.levels.every((level) => level.amount === 0)).toBe(true);
  });

  it("ignores mismatched/invalid levels and sanitizes negative entries", () => {
    const summary = buildCommissionLevelSummary({
      uplineAmount: -4,
      levelAmounts: [
        { level: 1, amount: -2 },
        { level: 2, amount: 1.5 },
        { level: 2, amount: 2.5 },
        { level: 99, amount: 8 },
        { level: 0, amount: 3 },
      ],
    });

    expect(summary.levels[0].amount).toBe(0);   // Direct Upline: -4 sanitized to 0
    expect(summary.levels[1].amount).toBe(4);   // Level 2 (stored 2): 1.5+2.5=4
    expect(summary.levels.slice(2).every((level) => level.amount === 0)).toBe(true);
    expect(summary.totalEarned).toBe(4);
  });
});
