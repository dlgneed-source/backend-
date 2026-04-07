import { GiftCodeStatus } from "@prisma/client";

export function isGiftCodeExpired(expiresAt: Date | null | undefined, now = new Date()): boolean {
  return Boolean(expiresAt && expiresAt < now);
}

export function getGiftCodeRedeemability(
  status: GiftCodeStatus,
  expiresAt: Date | null | undefined,
  now = new Date()
): { redeemable: boolean; effectiveStatus: GiftCodeStatus } {
  if (isGiftCodeExpired(expiresAt, now)) {
    return { redeemable: false, effectiveStatus: "EXPIRED" };
  }
  if (status !== "ACTIVE") {
    return { redeemable: false, effectiveStatus: status };
  }
  return { redeemable: true, effectiveStatus: "ACTIVE" };
}
