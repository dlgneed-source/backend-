import { describe, it, expect } from "vitest";
import { calculateFlushoutDate } from "../utils/flushoutLogic";

describe("Flushout Logic", () => {
  describe("calculateFlushoutDate", () => {
    it("should calculate Plan 1 flushout date (3 days)", () => {
      const enrolledAt = new Date("2024-01-01T00:00:00Z");
      const flushoutAt = calculateFlushoutDate(enrolledAt, 3);
      expect(flushoutAt.toISOString()).toBe("2024-01-04T00:00:00.000Z");
    });

    it("should calculate Plan 2 flushout date (8 days)", () => {
      const enrolledAt = new Date("2024-01-01T00:00:00Z");
      const flushoutAt = calculateFlushoutDate(enrolledAt, 8);
      expect(flushoutAt.toISOString()).toBe("2024-01-09T00:00:00.000Z");
    });

    it("should calculate Plan 3 flushout date (16 days)", () => {
      const enrolledAt = new Date("2024-01-01T00:00:00Z");
      const flushoutAt = calculateFlushoutDate(enrolledAt, 16);
      expect(flushoutAt.toISOString()).toBe("2024-01-17T00:00:00.000Z");
    });

    it("should calculate Plan 4 flushout date (25 days)", () => {
      const enrolledAt = new Date("2024-01-01T00:00:00Z");
      const flushoutAt = calculateFlushoutDate(enrolledAt, 25);
      expect(flushoutAt.toISOString()).toBe("2024-01-26T00:00:00.000Z");
    });

    it("should calculate Plan 5 flushout date (40 days)", () => {
      const enrolledAt = new Date("2024-01-01T00:00:00Z");
      const flushoutAt = calculateFlushoutDate(enrolledAt, 40);
      expect(flushoutAt.toISOString()).toBe("2024-02-10T00:00:00.000Z");
    });

    it("should calculate Plan 6 flushout date (60 days)", () => {
      const enrolledAt = new Date("2024-01-01T00:00:00Z");
      const flushoutAt = calculateFlushoutDate(enrolledAt, 60);
      expect(flushoutAt.toISOString()).toBe("2024-03-01T00:00:00.000Z");
    });

    it("should not modify the original date", () => {
      const enrolledAt = new Date("2024-06-15T10:30:00Z");
      const original = enrolledAt.getTime();
      calculateFlushoutDate(enrolledAt, 5);
      expect(enrolledAt.getTime()).toBe(original);
    });
  });

  describe("Plan flushout days validation", () => {
    const plans = [
      { id: 1, name: "Foundation", flushoutDays: 3 },
      { id: 2, name: "Pro Builder", flushoutDays: 8 },
      { id: 3, name: "Cyber Elite", flushoutDays: 16 },
      { id: 4, name: "AI Mastery", flushoutDays: 25 },
      { id: 5, name: "Quantum Leader", flushoutDays: 40 },
      { id: 6, name: "Supreme Visionary", flushoutDays: 60 },
    ];

    plans.forEach((plan) => {
      it(`Plan ${plan.id} (${plan.name}) should have ${plan.flushoutDays} day flushout period`, () => {
        const enrolledAt = new Date();
        const flushoutAt = calculateFlushoutDate(enrolledAt, plan.flushoutDays);
        const diffMs = flushoutAt.getTime() - enrolledAt.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        expect(diffDays).toBe(plan.flushoutDays);
      });
    });
  });
});
