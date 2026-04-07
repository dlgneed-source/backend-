import { describe, it, expect } from "vitest";
import { UserStatus } from "@prisma/client";
import {
  calculateCommissions,
  totalCommissionPercentage,
  COMMISSION_LEVELS,
  resolveCommissionRecipients,
} from "../utils/commissionLogic";

describe("Commission Logic", () => {
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

  it("should calculate commissions correctly for Plan 1 slotFee of $3", () => {
    const commissions = calculateCommissions(3);
    expect(commissions).toHaveLength(7);
    expect(commissions[0].amount).toBeCloseTo(0.12, 4); // 4% of $3
    expect(commissions[1].amount).toBeCloseTo(0.06, 4); // 2% of $3
    expect(commissions[2].amount).toBeCloseTo(0.03, 4); // 1% of $3
    expect(commissions[3].amount).toBeCloseTo(0.03, 4); // 1% of $3
    expect(commissions[4].amount).toBeCloseTo(0.03, 4); // 1% of $3
    expect(commissions[5].amount).toBeCloseTo(0.015, 4); // 0.5% of $3
    expect(commissions[6].amount).toBeCloseTo(0.015, 4); // 0.5% of $3
  });

  it("should calculate commissions correctly for Plan 2 slotFee of $6", () => {
    const commissions = calculateCommissions(6);
    expect(commissions[0].amount).toBeCloseTo(0.24, 4); // 4% of $6
    expect(commissions[1].amount).toBeCloseTo(0.12, 4); // 2% of $6
    expect(commissions[2].amount).toBeCloseTo(0.06, 4); // 1% of $6
  });

  it("should calculate commissions correctly for Plan 3 slotFee of $13", () => {
    const commissions = calculateCommissions(13);
    expect(commissions[0].amount).toBeCloseTo(0.52, 4); // 4% of $13
    expect(commissions[1].amount).toBeCloseTo(0.26, 4); // 2% of $13
  });

  it("should calculate commissions correctly for Plan 4 slotFee of $28", () => {
    const commissions = calculateCommissions(28);
    expect(commissions[0].amount).toBeCloseTo(1.12, 4); // 4% of $28
    expect(commissions[1].amount).toBeCloseTo(0.56, 4); // 2% of $28
  });

  it("should calculate commissions correctly for Plan 5 slotFee of $56", () => {
    const commissions = calculateCommissions(56);
    expect(commissions[0].amount).toBeCloseTo(2.24, 4); // 4% of $56
    expect(commissions[1].amount).toBeCloseTo(1.12, 4); // 2% of $56
  });

  it("should calculate commissions correctly for Plan 6 slotFee of $110", () => {
    const commissions = calculateCommissions(110);
    expect(commissions[0].amount).toBeCloseTo(4.4, 4); // 4% of $110
    expect(commissions[1].amount).toBeCloseTo(2.2, 4); // 2% of $110
  });

  it("should have correct commission level structure", () => {
    const commissions = calculateCommissions(10);
    commissions.forEach((c) => {
      expect(c).toHaveProperty("level");
      expect(c).toHaveProperty("percentage");
      expect(c).toHaveProperty("amount");
    });
  });

  it("total commission from slotFee should equal 10% of slotFee", () => {
    const slotFee = 100;
    const commissions = calculateCommissions(slotFee);
    const total = commissions.reduce((sum, c) => sum + c.amount, 0);
    expect(total).toBeCloseTo(10, 4); // 10% of 100 (4+2+1+1+1+0.5+0.5)
  });

  it("applies deterministic 6-decimal rounding for edge slotFee values", () => {
    const commissions = calculateCommissions(1.9999999);
    expect(commissions[0].amount).toBe(0.08);
    expect(commissions[1].amount).toBe(0.04);
    expect(commissions[5].amount).toBe(0.01);
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
