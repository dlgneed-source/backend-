import { describe, expect, it } from "vitest";
import { buildAuditLogWhere } from "../utils/auditLogFilters";

describe("audit log filters", () => {
  it("builds filtered where clause for action/admin/date", () => {
    const where = buildAuditLogWhere({
      action: "POOL_DISTRIBUTED",
      adminId: "admin_123",
      from: "2026-04-01T00:00:00.000Z",
      to: "2026-04-08T23:59:59.000Z",
    });

    expect(where).toMatchObject({
      action: "POOL_DISTRIBUTED",
      adminId: "admin_123",
    });
    expect(where).toHaveProperty("createdAt.gte");
    expect(where).toHaveProperty("createdAt.lte");
  });

  it("rejects invalid action filter", () => {
    expect(() => buildAuditLogWhere({ action: "NOT_A_REAL_ACTION" })).toThrow("INVALID_ACTION_FILTER");
  });

  it("rejects invalid date filters", () => {
    expect(() => buildAuditLogWhere({ from: "invalid" })).toThrow("INVALID_FROM_DATE");
    expect(() => buildAuditLogWhere({ to: "invalid" })).toThrow("INVALID_TO_DATE");
  });
});
