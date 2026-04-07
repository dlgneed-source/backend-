import { describe, expect, it } from "vitest";
import { getGiftCodeRedeemability, isGiftCodeExpired } from "../utils/giftCodeRules";

describe("gift code rules", () => {
  it("flags expired gift code correctly", () => {
    const now = new Date("2026-01-10T00:00:00.000Z");
    expect(isGiftCodeExpired(new Date("2026-01-09T23:59:59.000Z"), now)).toBe(true);
    expect(isGiftCodeExpired(new Date("2026-01-10T00:00:00.000Z"), now)).toBe(false);
  });

  it("returns EXPIRED effective status when expired", () => {
    const now = new Date("2026-01-10T00:00:00.000Z");
    const redeemability = getGiftCodeRedeemability("ACTIVE", new Date("2026-01-01T00:00:00.000Z"), now);
    expect(redeemability).toEqual({ redeemable: false, effectiveStatus: "EXPIRED" });
  });

  it("keeps non-active statuses non-redeemable", () => {
    expect(getGiftCodeRedeemability("USED", null)).toEqual({ redeemable: false, effectiveStatus: "USED" });
    expect(getGiftCodeRedeemability("DISABLED", null)).toEqual({ redeemable: false, effectiveStatus: "DISABLED" });
  });

  it("allows active non-expired gift codes", () => {
    const now = new Date("2026-01-10T00:00:00.000Z");
    const redeemability = getGiftCodeRedeemability("ACTIVE", new Date("2026-01-20T00:00:00.000Z"), now);
    expect(redeemability).toEqual({ redeemable: true, effectiveStatus: "ACTIVE" });
  });
});
