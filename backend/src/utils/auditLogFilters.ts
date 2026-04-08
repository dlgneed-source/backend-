import type { AuditAction } from "@prisma/client";

const AUDIT_ACTIONS = new Set<AuditAction>([
  "USER_CREATED",
  "USER_SUSPENDED",
  "USER_BLOCKED",
  "ENROLLMENT_CREATED",
  "ENROLLMENT_FLUSHED",
  "WITHDRAWAL_APPROVED",
  "WITHDRAWAL_REJECTED",
  "GIFT_CODE_CREATED",
  "GIFT_CODE_DISABLED",
  "INCENTIVE_APPROVED",
  "INCENTIVE_REJECTED",
  "POOL_DISTRIBUTED",
  "SYSTEM_CONFIG_UPDATED",
  "ADMIN_CREATED",
]);

export interface AuditLogFilterInput {
  action?: string;
  adminId?: string;
  from?: string;
  to?: string;
}

export function buildAuditLogWhere({ action, adminId, from, to }: AuditLogFilterInput) {
  const normalizedAction = action?.trim();
  const normalizedAdminId = adminId?.trim();
  const normalizedFrom = from?.trim();
  const normalizedTo = to?.trim();

  if (normalizedAction && !AUDIT_ACTIONS.has(normalizedAction as AuditAction)) {
    throw new Error("INVALID_ACTION_FILTER");
  }

  const fromDate = normalizedFrom ? new Date(normalizedFrom) : null;
  const toDate = normalizedTo ? new Date(normalizedTo) : null;
  if (fromDate && Number.isNaN(fromDate.getTime())) {
    throw new Error("INVALID_FROM_DATE");
  }
  if (toDate && Number.isNaN(toDate.getTime())) {
    throw new Error("INVALID_TO_DATE");
  }

  return {
    ...(normalizedAction ? { action: normalizedAction as AuditAction } : {}),
    ...(normalizedAdminId ? { adminId: normalizedAdminId } : {}),
    ...((fromDate || toDate)
      ? {
          createdAt: {
            ...(fromDate ? { gte: fromDate } : {}),
            ...(toDate ? { lte: toDate } : {}),
          },
        }
      : {}),
  };
}
