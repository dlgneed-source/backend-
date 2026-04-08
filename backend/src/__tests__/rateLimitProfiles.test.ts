import { describe, expect, it } from "vitest";
import {
  ADMIN_CRITICAL_ACTION_RATE_LIMIT_PROFILE,
  AUTH_RATE_LIMIT_PROFILE,
  GIFT_CODE_CREATE_RATE_LIMIT_PROFILE,
  WITHDRAWAL_ADMIN_RATE_LIMIT_PROFILE,
  WITHDRAWAL_RATE_LIMIT_PROFILE,
} from "../middleware/security";

describe("rate limit profiles", () => {
  it("enforces strict auth login limits", () => {
    expect(AUTH_RATE_LIMIT_PROFILE.windowMs).toBe(15 * 60 * 1000);
    expect(AUTH_RATE_LIMIT_PROFILE.max).toBe(20);
  });

  it("enforces withdrawal limits for user and admin signing endpoints", () => {
    expect(WITHDRAWAL_RATE_LIMIT_PROFILE.max).toBe(5);
    expect(WITHDRAWAL_ADMIN_RATE_LIMIT_PROFILE.max).toBe(20);
  });

  it("enforces gift-code creation and critical admin action limits", () => {
    expect(GIFT_CODE_CREATE_RATE_LIMIT_PROFILE.max).toBe(30);
    expect(ADMIN_CRITICAL_ACTION_RATE_LIMIT_PROFILE.max).toBe(40);
  });
});
