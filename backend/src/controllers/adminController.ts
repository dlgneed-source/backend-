/**
 * Admin Controller
 * Administrative operations: user management, withdrawal approval, system config
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth";
import { generateAdminToken } from "../middleware/auth";
import { verifyWalletSignature, generateSignInMessage } from "../utils/eip712";
import { processFlushout } from "../utils/flushoutLogic";
import { v4 as uuidv4 } from "uuid";
import { isValidWalletAddress } from "../middleware/security";

const prisma = new PrismaClient();

async function getManualFlushoutEnrollmentIds(enrollmentIds: string[]): Promise<Set<string>> {
  if (enrollmentIds.length === 0) {
    return new Set<string>();
  }

  const logs = await prisma.auditLog.findMany({
    where: {
      action: "ENROLLMENT_FLUSHED",
      description: { contains: "Manual flushout", mode: "insensitive" },
    },
    select: {
      metadata: true,
      description: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const idSet = new Set<string>(enrollmentIds);
  const manualIds = new Set<string>();

  logs.forEach((log) => {
    let enrollmentId: string | undefined;

    if (log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)) {
      const value = (log.metadata as Record<string, unknown>).enrollmentId;
      if (typeof value === "string") {
        enrollmentId = value;
      }
    }

    if (!enrollmentId) {
      const matched = log.description.match(/#([a-zA-Z0-9]+)/);
      if (matched?.[1]) {
        enrollmentId = matched[1];
      }
    }

    if (enrollmentId && idSet.has(enrollmentId)) {
      manualIds.add(enrollmentId);
    }
  });

  return manualIds;
}

// =============================================
// ADMIN AUTH
// =============================================

/**
 * GET /admin/nonce/:walletAddress
 */
export async function getAdminNonce(req: Request, res: Response): Promise<void> {
  const walletAddress = String(req.params.walletAddress || "").toLowerCase();

  if (!isValidWalletAddress(walletAddress)) {
    res.status(400).json({ success: false, message: "Invalid wallet address" });
    return;
  }

  try {
    const nonce = uuidv4();
    const message = generateSignInMessage(walletAddress, nonce);

    await prisma.admin.update({
      where: { walletAddress },
      data: { nonce },
    });

    res.json({ success: true, nonce, message });
  } catch {
    res.status(404).json({ success: false, message: "Admin not found" });
  }
}

/**
 * POST /admin/login
 */
export async function adminLogin(req: Request, res: Response): Promise<void> {
  const { walletAddress, signature } = req.body;

  try {
    const normalizedWallet = walletAddress.toLowerCase();

    const admin = await prisma.admin.findUnique({
      where: { walletAddress: normalizedWallet },
    });

    if (!admin || !admin.isActive || !admin.nonce) {
      res.status(401).json({ success: false, message: "Admin not found or inactive" });
      return;
    }

    const expectedMessage = generateSignInMessage(normalizedWallet, admin.nonce);

    let signerAddress: string;
    try {
      signerAddress = verifyWalletSignature(expectedMessage, signature);
    } catch {
      res.status(401).json({ success: false, message: "Invalid signature" });
      return;
    }

    if (signerAddress.toLowerCase() !== normalizedWallet) {
      res.status(401).json({ success: false, message: "Signature mismatch" });
      return;
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { nonce: null, lastLoginAt: new Date() },
    });

    const token = generateAdminToken(admin.id, admin.walletAddress, admin.role);

    res.json({ success: true, token, admin: { id: admin.id, walletAddress: admin.walletAddress, role: admin.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Admin login failed" });
  }
}

// =============================================
// DASHBOARD
// =============================================

/**
 * GET /admin/dashboard
 */
export async function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [users, enrollments, withdrawals, treasury, pools, plans, recentWithdrawals, recentFlushouts] = await Promise.all([
      prisma.user.count(),
      prisma.enrollment.groupBy({ by: ["status"], _count: true }),
      prisma.withdrawal.groupBy({ by: ["status"], _count: true }),
      prisma.treasury.findFirst(),
      prisma.pool.groupBy({ by: ["type"], _sum: { balance: true } }),
      prisma.plan.findMany({
        where: { isActive: true },
        select: { id: true, name: true, joiningFee: true },
        orderBy: { id: "asc" },
      }),
      prisma.withdrawal.findMany({
        include: { user: { select: { walletAddress: true, name: true } } },
        orderBy: { requestedAt: "desc" },
        take: 5,
      }),
      prisma.enrollment.findMany({
        where: {
          OR: [{ status: "FLUSHED" }, { flushoutAt: { not: null } }],
        },
        include: {
          user: { select: { walletAddress: true, name: true } },
          plan: { select: { id: true, name: true, memberProfit: true } },
        },
        orderBy: { flushoutAt: "desc" },
        take: 5,
      }),
    ]);

    const enrollmentMap: Record<string, number> = {};
    enrollments.forEach((e) => { enrollmentMap[e.status] = e._count; });

    const withdrawalMap: Record<string, number> = {};
    withdrawals.forEach((w) => { withdrawalMap[w.status] = w._count; });

    const poolMap: Record<string, number> = {};
    pools.forEach((p) => { poolMap[p.type] = p._sum.balance || 0; });

    const enrollmentsByPlan = await prisma.enrollment.groupBy({
      by: ["planId", "status"],
      _count: true,
    });

    const planStatusMap = new Map<number, { active: number; matured: number; flushed: number; totalEnrollments: number }>();
    enrollmentsByPlan.forEach((entry) => {
      const existing = planStatusMap.get(entry.planId) || { active: 0, matured: 0, flushed: 0, totalEnrollments: 0 };
      if (entry.status === "ACTIVE") existing.active += entry._count;
      if (entry.status === "MATURED") existing.matured += entry._count;
      if (entry.status === "FLUSHED") existing.flushed += entry._count;
      existing.totalEnrollments += entry._count;
      planStatusMap.set(entry.planId, existing);
    });

    const totalPoolBalance = pools.reduce((sum, pool) => sum + (pool._sum.balance || 0), 0);
    const totalWithdrawalsAmount = await prisma.withdrawal.aggregate({
      where: { status: { in: ["APPROVED", "COMPLETED"] } },
      _sum: { amount: true },
    });
    const totalFlushouts = enrollments.reduce((sum, row) => (
      row.status === "FLUSHED" ? sum + row._count : sum
    ), 0);

    const planPerformance = plans.map((plan) => {
      const counts = planStatusMap.get(plan.id) || { active: 0, matured: 0, flushed: 0, totalEnrollments: 0 };
      return {
        planId: plan.id,
        planName: plan.name,
        activeUsers: counts.active,
        maturedUsers: counts.matured,
        flushedUsers: counts.flushed,
        totalEnrollments: counts.totalEnrollments,
        totalRevenue: Number((counts.totalEnrollments * plan.joiningFee).toFixed(6)),
      };
    });

    const manualFlushoutIds = await getManualFlushoutEnrollmentIds(recentFlushouts.map((record) => record.id));

    res.json({
      success: true,
      dashboard: {
        users,
        enrollments: enrollmentMap,
        withdrawals: withdrawalMap,
        treasury,
        pools: poolMap,
        stats: {
          totalUsers: users,
          totalBalance: Number(totalPoolBalance.toFixed(6)),
          totalWithdrawals: Number((totalWithdrawalsAmount._sum.amount || 0).toFixed(6)),
          totalFlushouts,
        },
        planPerformance,
        recentWithdrawals: recentWithdrawals.map((withdrawal) => ({
          id: withdrawal.id,
          userId: withdrawal.userId,
          wallet: withdrawal.user.walletAddress,
          userName: withdrawal.user.name,
          amount: withdrawal.amount,
          status: withdrawal.status,
          requestedAt: withdrawal.requestedAt,
          processedAt: withdrawal.processedAt,
          txHash: withdrawal.txHash,
        })),
        recentFlushouts: recentFlushouts.map((record) => ({
          id: record.id,
          userId: record.userId,
          wallet: record.user.walletAddress,
          userName: record.user.name,
          planId: record.planId,
          planName: record.plan.name,
          amount: record.plan.memberProfit,
          flushedAt: record.flushoutAt ?? record.updatedAt,
          type: manualFlushoutIds.has(record.id) ? "Manual" : "Auto",
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch dashboard" });
  }
}

// =============================================
// USER MANAGEMENT
// =============================================

/**
 * GET /admin/users
 */
export async function getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;

  try {
    const where = search
      ? {
          OR: [
            { walletAddress: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          walletAddress: true,
          name: true,
          email: true,
          status: true,
          referralCode: true,
          createdAt: true,
          lastLoginAt: true,
          _count: { select: { enrollments: true, referrals: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch users" });
  }
}

/**
 * PATCH /admin/users/:userId/status
 */
export async function updateUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { userId } = req.params;
  const { status, reason } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.admin!.id,
        userId,
        action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_BLOCKED",
        description: `User status changed to ${status}. Reason: ${reason || "N/A"}`,
        metadata: { previousStatus: updated.status, reason },
      },
    });

    res.json({ success: true, message: `User status updated to ${status}`, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update user status" });
  }
}

// =============================================
// WITHDRAWAL MANAGEMENT
// =============================================

/**
 * GET /admin/withdrawals
 */
export async function getWithdrawals(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const status = req.query.status as string;

  try {
    const where = status ? { status: status as any } : {};

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        include: { user: { select: { walletAddress: true, name: true } } },
        orderBy: { requestedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.withdrawal.count({ where }),
    ]);

    res.json({ success: true, withdrawals, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch withdrawals" });
  }
}

/**
 * GET /admin/flushouts
 */
export async function getFlushouts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 5000);
  const skip = (page - 1) * limit;

  try {
    const where = {
      OR: [{ status: "FLUSHED" as const }, { flushoutAt: { not: null } }],
    };

    const [flushouts, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        include: {
          user: { select: { walletAddress: true, name: true } },
          plan: { select: { id: true, name: true, memberProfit: true } },
        },
        orderBy: { flushoutAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.enrollment.count({ where }),
    ]);

    const manualFlushoutIds = await getManualFlushoutEnrollmentIds(flushouts.map((record) => record.id));

    res.json({
      success: true,
      flushouts: flushouts.map((record) => ({
        id: record.id,
        userId: record.userId,
        wallet: record.user.walletAddress,
        userName: record.user.name,
        planId: record.planId,
        planName: record.plan.name,
        amount: record.plan.memberProfit,
        flushedAt: record.flushoutAt ?? record.updatedAt,
        type: manualFlushoutIds.has(record.id) ? "Manual" : "Auto",
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch flushouts" });
  }
}

/**
 * PATCH /admin/withdrawals/:withdrawalId/approve
 */
export async function approveWithdrawal(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { withdrawalId } = req.params;
  const { txHash } = req.body;

  try {
    const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!withdrawal) {
      res.status(404).json({ success: false, message: "Withdrawal not found" });
      return;
    }

    if (withdrawal.status !== "PENDING") {
      res.status(400).json({ success: false, message: "Only pending withdrawals can be approved" });
      return;
    }

    const updated = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "APPROVED", processedAt: new Date(), txHash },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.admin!.id,
        userId: withdrawal.userId,
        action: "WITHDRAWAL_APPROVED",
        description: `Withdrawal #${withdrawalId} of $${withdrawal.amount} approved`,
        metadata: { withdrawalId, amount: withdrawal.amount, txHash },
      },
    });

    res.json({ success: true, message: "Withdrawal approved", withdrawal: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to approve withdrawal" });
  }
}

/**
 * PATCH /admin/withdrawals/:withdrawalId/reject
 */
export async function rejectWithdrawal(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { withdrawalId } = req.params;
  const { reason } = req.body;

  try {
    const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
    if (!withdrawal) {
      res.status(404).json({ success: false, message: "Withdrawal not found" });
      return;
    }

    if (!["PENDING", "PROCESSING"].includes(withdrawal.status)) {
      res.status(400).json({ success: false, message: "Cannot reject this withdrawal" });
      return;
    }

    const updated = await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { status: "REJECTED", rejectedAt: new Date(), rejectionNote: reason },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.admin!.id,
        userId: withdrawal.userId,
        action: "WITHDRAWAL_REJECTED",
        description: `Withdrawal #${withdrawalId} rejected. Reason: ${reason}`,
        metadata: { withdrawalId, amount: withdrawal.amount, reason },
      },
    });

    res.json({ success: true, message: "Withdrawal rejected", withdrawal: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to reject withdrawal" });
  }
}

// =============================================
// FLUSHOUT MANAGEMENT
// =============================================

/**
 * POST /admin/flushout/:enrollmentId
 * Manually trigger flushout for an enrollment
 */
export async function manualFlushout(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { enrollmentId } = req.params;

  try {
    const result = await processFlushout(enrollmentId);

    if (result.status === "failed") {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    await prisma.auditLog.create({
      data: {
        adminId: req.admin!.id,
        action: "ENROLLMENT_FLUSHED",
        description: `Manual flushout for enrollment #${enrollmentId}`,
        metadata: { enrollmentId, memberProfit: result.memberProfit },
      },
    });

    res.json({ success: true, message: "Flushout processed", result });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to process flushout" });
  }
}

// =============================================
// INCENTIVE MANAGEMENT
// =============================================

/**
 * GET /admin/incentive-claims
 */
export async function getIncentiveClaims(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const status = req.query.status as string;

  try {
    const where = status ? { status: status as any } : {};

    const [claims, total] = await Promise.all([
      prisma.incentiveClaim.findMany({
        where,
        include: { user: { select: { walletAddress: true, name: true } } },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.incentiveClaim.count({ where }),
    ]);

    res.json({ success: true, claims, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch claims" });
  }
}

/**
 * PATCH /admin/incentive-claims/:claimId/approve
 */
export async function approveIncentiveClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { claimId } = req.params;

  try {
    const claim = await prisma.incentiveClaim.findUnique({ where: { id: claimId } });
    if (!claim) {
      res.status(404).json({ success: false, message: "Claim not found" });
      return;
    }

    if (claim.status !== "PENDING") {
      res.status(400).json({ success: false, message: "Only pending claims can be approved" });
      return;
    }

    const updated = await prisma.incentiveClaim.update({
      where: { id: claimId },
      data: { status: "APPROVED", approvedAt: new Date() },
    });

    await prisma.transaction.create({
      data: {
        userId: claim.userId,
        type: "INCENTIVE",
        amount: claim.reward,
        description: `${claim.rank} club incentive approved`,
        status: "COMPLETED",
        metadata: { claimId, rank: claim.rank },
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.admin!.id,
        userId: claim.userId,
        action: "INCENTIVE_APPROVED",
        description: `Incentive claim #${claimId} (${claim.rank} - $${claim.reward}) approved`,
        metadata: { claimId, rank: claim.rank, reward: claim.reward },
      },
    });

    res.json({ success: true, message: "Incentive claim approved", claim: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to approve claim" });
  }
}

// =============================================
// GIFT CODE MANAGEMENT
// =============================================

/**
 * GET /admin/gift-codes
 * Admin gift code listing
 */
export async function getAdminGiftCodes(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;
  const status = (req.query.status as string | undefined)?.toUpperCase();
  const search = (req.query.search as string | undefined)?.trim();

  try {
    await prisma.giftCode.updateMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: new Date() },
      },
      data: { status: "EXPIRED" },
    });

    const where = {
      ...(status && ["ACTIVE", "USED", "EXPIRED", "DISABLED"].includes(status) ? { status: status as "ACTIVE" | "USED" | "EXPIRED" | "DISABLED" } : {}),
      ...(search ? { code: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [giftCodes, total] = await Promise.all([
      prisma.giftCode.findMany({
        where,
        include: {
          plan: { select: { id: true, name: true, joiningFee: true } },
          redemption: {
            select: {
              redeemedAt: true,
              redeemedBy: { select: { id: true, walletAddress: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.giftCode.count({ where }),
    ]);

    res.json({
      success: true,
      giftCodes: giftCodes.map((giftCode) => ({
        id: giftCode.id,
        code: giftCode.code,
        planId: giftCode.planId,
        planName: giftCode.plan.name,
        amount: giftCode.plan.joiningFee,
        status: giftCode.status,
        expiresAt: giftCode.expiresAt,
        createdAt: giftCode.createdAt,
        updatedAt: giftCode.updatedAt,
        usedCount: giftCode.redemption ? 1 : 0,
        maxUses: 1,
        redeemedAt: giftCode.redemption?.redeemedAt ?? null,
        redeemedBy: giftCode.redemption?.redeemedBy ?? null,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch gift codes" });
  }
}

/**
 * POST /admin/gift-codes
 * Admin creates gift codes
 */
export async function adminCreateGiftCode(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { planId, expiryDays = 30, quantity = 1, code: requestedCode } = req.body;

  try {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) {
      res.status(404).json({ success: false, message: "Plan not found" });
      return;
    }

    if (!plan.isActive) {
      res.status(409).json({ success: false, message: "Plan is inactive" });
      return;
    }

    // Find admin's user record (admin wallet may also have a user record)
    const adminUser = await prisma.user.findFirst({
      where: { walletAddress: req.admin!.walletAddress },
    });

    if (!adminUser) {
      res.status(400).json({ success: false, message: "Admin user profile not found" });
      return;
    }

    if (requestedCode && quantity > 1) {
      res.status(400).json({ success: false, message: "Custom code supports quantity 1 only" });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const createdCodes = [];
    for (let i = 0; i < Math.min(quantity, 50); i++) {
      const code = (requestedCode ? requestedCode.trim().toUpperCase() : `EA${planId}-${uuidv4().replace(/-/g, "").toUpperCase().slice(0, 8)}`);

      const existing = await prisma.giftCode.findUnique({ where: { code } });
      if (existing) {
        res.status(409).json({
          success: false,
          message: `Gift code "${code}" already exists`,
        });
        return;
      }

      const giftCode = await prisma.giftCode.create({
        data: { code, planId, generatedById: adminUser.id, expiresAt, status: "ACTIVE" },
        include: { plan: { select: { id: true, name: true, joiningFee: true } } },
      });

      createdCodes.push({
        id: giftCode.id,
        code: giftCode.code,
        planId: giftCode.planId,
        planName: giftCode.plan.name,
        amount: giftCode.plan.joiningFee,
        status: giftCode.status,
        expiresAt: giftCode.expiresAt,
        createdAt: giftCode.createdAt,
        usedCount: 0,
        maxUses: 1,
      });

      if (requestedCode) {
        break;
      }
    }

    await prisma.auditLog.create({
      data: {
        adminId: req.admin!.id,
        action: "GIFT_CODE_CREATED",
        description: `Created ${createdCodes.length} gift code(s) for Plan ${planId}`,
        metadata: { planId, quantity: createdCodes.length, codes: createdCodes.map((item) => item.code) },
      },
    });

    res.status(201).json({ success: true, giftCodes: createdCodes });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create gift codes" });
  }
}

/**
 * PATCH /admin/gift-codes/:giftCodeId/status
 * Update admin gift code status
 */
export async function updateAdminGiftCodeStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { giftCodeId } = req.params;
  const { status } = req.body as { status: "ACTIVE" | "DISABLED" };

  try {
    const giftCode = await prisma.giftCode.findUnique({
      where: { id: giftCodeId },
      include: {
        plan: { select: { id: true, name: true, joiningFee: true } },
        redemption: { select: { redeemedAt: true, redeemedBy: { select: { id: true, walletAddress: true, name: true } } } },
      },
    });

    if (!giftCode) {
      res.status(404).json({ success: false, message: "Gift code not found" });
      return;
    }

    if (giftCode.status === "ACTIVE" && giftCode.expiresAt && giftCode.expiresAt < new Date()) {
      await prisma.giftCode.update({
        where: { id: giftCode.id },
        data: { status: "EXPIRED" },
      });
      res.status(409).json({ success: false, message: "Gift code is expired. Refresh and try again." });
      return;
    }

    if (giftCode.status === "USED" || giftCode.status === "EXPIRED") {
      res.status(400).json({ success: false, message: `Cannot change status for ${giftCode.status.toLowerCase()} gift code` });
      return;
    }

    if (giftCode.status === status) {
      res.json({
        success: true,
        message: "Gift code status unchanged",
        giftCode: {
          id: giftCode.id,
          code: giftCode.code,
          planId: giftCode.planId,
          planName: giftCode.plan.name,
          amount: giftCode.plan.joiningFee,
          status: giftCode.status,
          expiresAt: giftCode.expiresAt,
          createdAt: giftCode.createdAt,
          usedCount: giftCode.redemption ? 1 : 0,
          maxUses: 1,
          redeemedAt: giftCode.redemption?.redeemedAt ?? null,
          redeemedBy: giftCode.redemption?.redeemedBy ?? null,
        },
      });
      return;
    }

    const updated = await prisma.giftCode.update({
      where: { id: giftCode.id },
      data: { status },
      include: {
        plan: { select: { id: true, name: true, joiningFee: true } },
        redemption: { select: { redeemedAt: true, redeemedBy: { select: { id: true, walletAddress: true, name: true } } } },
      },
    });

    if (status === "DISABLED") {
      await prisma.auditLog.create({
        data: {
          adminId: req.admin!.id,
          action: "GIFT_CODE_DISABLED",
          description: `Gift code ${updated.code} disabled`,
          metadata: { giftCodeId: updated.id, fromStatus: giftCode.status, toStatus: status },
        },
      });
    }

    res.json({
      success: true,
      message: "Gift code status updated",
      giftCode: {
        id: updated.id,
        code: updated.code,
        planId: updated.planId,
        planName: updated.plan.name,
        amount: updated.plan.joiningFee,
        status: updated.status,
        expiresAt: updated.expiresAt,
        createdAt: updated.createdAt,
        usedCount: updated.redemption ? 1 : 0,
        maxUses: 1,
        redeemedAt: updated.redemption?.redeemedAt ?? null,
        redeemedBy: updated.redemption?.redeemedBy ?? null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update gift code status" });
  }
}

// =============================================
// SYSTEM CONFIG
// =============================================

/**
 * GET /admin/config
 */
export async function getSystemConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const configs = await prisma.systemConfig.findMany({ orderBy: { key: "asc" } });
    res.json({ success: true, configs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch config" });
  }
}

/**
 * PUT /admin/config/:key
 */
export async function updateSystemConfig(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { key } = req.params;
  const { value, description } = req.body;

  try {
    const updated = await prisma.systemConfig.upsert({
      where: { key },
      update: { value, description, updatedBy: req.admin!.id },
      create: { key, value, description, updatedBy: req.admin!.id },
    });

    await prisma.auditLog.create({
      data: {
        adminId: req.admin!.id,
        action: "SYSTEM_CONFIG_UPDATED",
        description: `Config "${key}" updated`,
        metadata: { key, newValue: value },
      },
    });

    res.json({ success: true, config: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update config" });
  }
}

// =============================================
// AUDIT LOGS
// =============================================

/**
 * GET /admin/audit-logs
 */
export async function getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  try {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: {
          admin: { select: { walletAddress: true, name: true } },
          user: { select: { walletAddress: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count(),
    ]);

    res.json({ success: true, logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch audit logs" });
  }
}

// =============================================
// TREASURY
// =============================================

/**
 * GET /admin/treasury
 */
export async function getTreasury(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [treasury, recentLedger] = await Promise.all([
      prisma.treasury.findFirst(),
      prisma.treasuryLedger.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    res.json({ success: true, treasury, recentLedger });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch treasury" });
  }
}
