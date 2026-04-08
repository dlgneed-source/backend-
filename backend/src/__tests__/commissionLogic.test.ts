import { describe, it, expect } from "vitest";
import { UserStatus } from "@prisma/client";
import {
  calculateCommissions,
  totalCommissionPercentage,
  COMMISSION_LEVELS,
  resolveCommissionRecipients,
} from "../utils/commissionLogic";

describe("Commission Logic", () => {
  const planEconomics = [
    { id: 1, joiningFee: 5, levelCommission: 0.5 },
    { id: 2, joiningFee: 10, levelCommission: 1 },
    { id: 3, joiningFee: 20, levelCommission: 2 },
    { id: 4, joiningFee: 40, levelCommission: 4 },
    { id: 5, joiningFee: 80, levelCommission: 8 },
    { id: 6, joiningFee: 160, levelCommission: 16 },
  ];

  it("should have 7 commission levels", () => {
    expect(COMMISSION_LEVELS).toHaveLength(7);
  });

  it("should have correct commission percentages: 4, 2, 1, 1, 1, 0.5, 0.5", () => {
    const expected = [4, 2, 1, 1, 1, 0.5, 0.5];
    COMMISSION_LEVELS.forEach((level, i) => {
      expect(level.percentage).toBe(expected[i]);
    });
  });

  it("should have correct level numbers 1-7", () => {
    COMMISSION_LEVELS.forEach((level, i) => {
      expect(level.level).toBe(i + 1);
    });
  });

  it("should calculate correct total commission percentage (10%)", () => {
    // 4 + 2 + 1 + 1 + 1 + 0.5 + 0.5 = 10
    const total = totalCommissionPercentage();
    expect(total).toBe(10);
  });

  it("should calculate commissions correctly for Plan 1 joiningFee of $5", () => {
    const commissions = calculateCommissions(5);
    expect(commissions).toHaveLength(7);
    expect(commissions[0].amount).toBeCloseTo(0.2, 4); // 4% of $5
    expect(commissions[1].amount).toBeCloseTo(0.1, 4); // 2% of $5
    expect(commissions[2].amount).toBeCloseTo(0.05, 4); // 1% of $5
    expect(commissions[3].amount).toBeCloseTo(0.05, 4); // 1% of $5
    expect(commissions[4].amount).toBeCloseTo(0.05, 4); // 1% of $5
    expect(commissions[5].amount).toBeCloseTo(0.025, 4); // 0.5% of $5
    expect(commissions[6].amount).toBeCloseTo(0.025, 4); // 0.5% of $5
  });

  it("should calculate commissions correctly for Plan 2 joiningFee of $10", () => {
    const commissions = calculateCommissions(10);
    expect(commissions[0].amount).toBeCloseTo(0.4, 4); // 4% of $10
    expect(commissions[1].amount).toBeCloseTo(0.2, 4); // 2% of $10
    expect(commissions[2].amount).toBeCloseTo(0.1, 4); // 1% of $10
  });

  it("should calculate commissions correctly for Plan 3 joiningFee of $20", () => {
    const commissions = calculateCommissions(20);
    expect(commissions[0].amount).toBeCloseTo(0.8, 4); // 4% of $20
    expect(commissions[1].amount).toBeCloseTo(0.4, 4); // 2% of $20
  });

  it("should calculate commissions correctly for Plan 4 joiningFee of $40", () => {
    const commissions = calculateCommissions(40);
    expect(commissions[0].amount).toBeCloseTo(1.6, 4); // 4% of $40
    expect(commissions[1].amount).toBeCloseTo(0.8, 4); // 2% of $40
  });

  it("should calculate commissions correctly for Plan 5 joiningFee of $80", () => {
    const commissions = calculateCommissions(80);
    expect(commissions[0].amount).toBeCloseTo(3.2, 4); // 4% of $80
    expect(commissions[1].amount).toBeCloseTo(1.6, 4); // 2% of $80
  });

  it("should calculate commissions correctly for Plan 6 joiningFee of $160", () => {
    const commissions = calculateCommissions(160);
    expect(commissions[0].amount).toBeCloseTo(6.4, 4); // 4% of $160
    expect(commissions[1].amount).toBeCloseTo(3.2, 4); // 2% of $160
  });

  it("should have correct commission level structure", () => {
    const commissions = calculateCommissions(10);
    commissions.forEach((c) => {
      expect(c).toHaveProperty("level");
      expect(c).toHaveProperty("percentage");
      expect(c).toHaveProperty("amount");
    });
  });

  it("total commission from joiningFee should equal 10% of joiningFee", () => {
    const joiningFee = 100;
    const commissions = calculateCommissions(joiningFee);
    const total = commissions.reduce((sum, c) => sum + c.amount, 0);
    expect(total).toBeCloseTo(10, 4); // 10% of 100
  });

  it("applies deterministic 6-decimal rounding for edge slotFee values", () => {
    const commissions = calculateCommissions(1.9999999);
    expect(commissions[0].amount).toBe(0.08);
    expect(commissions[1].amount).toBe(0.04);
    expect(commissions[5].amount).toBe(0.01);
  });

  it("matches defined levelCommission totals for Plan 1-6", () => {
    for (const plan of planEconomics) {
      const commissions = calculateCommissions(plan.joiningFee);
      const total = commissions.reduce((sum, c) => sum + c.amount, 0);
      expect(total).toBe(plan.levelCommission);
    }
  });

  it("handles missing and inactive uplines safely", () => {
    const statuses = new Map<string, UserStatus>([
      ["u1", "ACTIVE"],
      ["u2", "SUSPENDED"],
      ["u3", "ACTIVE"],
    ]);
    const recipients = resolveCommissionRecipients(["u1", "u2", "u3"], statuses);

    expect(recipients[0]).toBe("u1");
    expect(recipients[1]).toBeNull();
    expect(recipients[2]).toBe("u3");
    expect(recipients.slice(3).every((id) => id === null)).toBe(true);
  });
});
