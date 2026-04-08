/**
 * Admin Controller
 * Administrative operations: user management, withdrawal approval, system config
 */

import { Request, Response } from "express";
import { PoolType, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthenticatedRequest } from "../middleware/auth";
import { generateAdminToken } from "../middleware/auth";
import { verifyWalletSignature, generateSignInMessage } from "../utils/eip712";
import { processFlushout } from "../utils/flushoutLogic";
import { v4 as uuidv4 } from "uuid";
import { isValidWalletAddress } from "../middleware/security";
import { buildAuditLogWhere } from "../utils/auditLogFilters";
import { upsertActiveUserByWallet } from "../utils/upsertUserByWallet";

const prisma = new PrismaClient();
const MAX_FLUSHOUTS_PAGE_SIZE = 5000;
const CURRENCY_PRECISION = 6;
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("invalid-credential-probe", 12);

function extractEnrollmentIdFromManualFlushoutLog(log: { metadata: unknown; description: string }): string | undefined {
  if (log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)) {
    const value = (log.metadata as Record<string, unknown>).enrollmentId;
    if (typeof value === "string") {
      return value;
    }
  }

  const matched = log.description.match(/#([a-zA-Z0-9]+)/);
  if (matched?.[1]) {
    return matched[1];
  }

  return undefined;
}

async function getManualFlushoutEnrollmentIds(enrollmentIds: string[]): Promise<Set<string>> {
  if (enrollmentIds.length === 0) {
    return new Set<string>();
  }

  const uniqueEnrollmentIds = Array.from(new Set(enrollmentIds));

  const logs = await prisma.auditLog.findMany({
    where: {
      action: "ENROLLMENT_FLUSHED",
      OR: uniqueEnrollmentIds.map((id) => ({
        description: { contains: `#${id}` },
      })),
    },
    select: {
      metadata: true,
      description: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const idSet = new Set<string>(uniqueEnrollmentIds);
  const manualIds = new Set<string>();

  logs.forEach((log) => {
    const enrollmentId = extractEnrollmentIdFromManualFlushoutLog(log);
    const metadata = log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
      ? (log.metadata as Record<string, unknown>)
      : null;
    const explicitManualFlag = metadata?.flushoutType === "MANUAL";
    const fallbackManualFlag = /manual flushout/i.test(log.description);
    const isManual = explicitManualFlag || fallbackManualFlag;

    if (enrollmentId && idSet.has(enrollmentId) && isManual) {
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

/**
 * POST /admin/login/credentials
 */
export async function adminCredentialLogin(req: Request, res: Response): Promise<void> {
  const { loginId, password } = req.body as { loginId: string; password: string };

  try {
    const normalizedLoginId = loginId.trim().toLowerCase();

    const admin = await prisma.admin.findFirst({
      where: {
        email: {
          equals: normalizedLoginId,
          mode: "insensitive",
        },
      },
    });

    const passwordHashToCheck = admin?.passwordHash || DUMMY_PASSWORD_HASH;
    const isPasswordValid = await bcrypt.compare(password, passwordHashToCheck);
    if (!admin || !admin.isActive || !admin.passwordHash || !isPasswordValid) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateAdminToken(admin.id, admin.walletAddress, admin.role);

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        walletAddress: admin.walletAddress,
        role: admin.role,
        loginId: admin.email,
      },
      authMethod: "credentials",
    });
  } catch {
    res.status(500).json({ success: false, message: "Admin credential login failed" });
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
        totalRevenue: counts.totalEnrollments * plan.joiningFee,
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

/**
 * GET /admin/plan-metrics
 */
export async function getPlanMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [plans, enrollmentsByPlan] = await Promise.all([
      prisma.plan.findMany({
        where: { isActive: true },
        select: { id: true, name: true, joiningFee: true },
        orderBy: { id: "asc" },
      }),
      prisma.enrollment.groupBy({
        by: ["planId", "status"],
        _count: true,
      }),
    ]);

    const planStatusMap = new Map<number, { active: number; matured: number; flushed: number; totalEnrollments: number }>();
    enrollmentsByPlan.forEach((entry) => {
      const existing = planStatusMap.get(entry.planId) || { active: 0, matured: 0, flushed: 0, totalEnrollments: 0 };
      if (entry.status === "ACTIVE") existing.active += entry._count;
      if (entry.status === "MATURED") existing.matured += entry._count;
      if (entry.status === "FLUSHED") existing.flushed += entry._count;
      existing.totalEnrollments += entry._count;
      planStatusMap.set(entry.planId, existing);
    });

    const totalEnrollments = Array.from(planStatusMap.values()).reduce((sum, counts) => (
      sum + counts.totalEnrollments
    ), 0);

    const planMetrics = plans.map((plan) => {
      const counts = planStatusMap.get(plan.id) || { active: 0, matured: 0, flushed: 0, totalEnrollments: 0 };
      const adoptionRate = totalEnrollments > 0 ? (counts.totalEnrollments / totalEnrollments) * 100 : 0;

      return {
        planId: plan.id,
        planName: plan.name,
        activeUsers: counts.active,
        maturedUsers: counts.matured,
        flushedUsers: counts.flushed,
        totalEnrollments: counts.totalEnrollments,
        totalRevenue: counts.totalEnrollments * plan.joiningFee,
        adoptionRate: Math.round(adoptionRate * 100) / 100,
      };
    });

    res.json({
      success: true,
      planMetrics,
      totals: {
        totalEnrollments,
      },
    });
  } catch (err) {
    console.error("[admin] Failed to fetch plan metrics:", err);
    res.status(500).json({ success: false, message: "Failed to fetch plan metrics" });
  }
}

/**
 * GET /admin/pool-metrics
 */
export async function getPoolMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const pools = await prisma.pool.findMany({
      include: {
        plan: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ type: "asc" }, { planId: "asc" }],
    });

    const totals = pools.reduce((acc, pool) => {
      const safeBalance = Number(pool.balance) || 0;
      if (pool.type === "SYSTEM") acc.systemPool += safeBalance;
      if (pool.type === "LEADER") acc.leaderPool += safeBalance;
      if (pool.type === "REWARD") acc.rewardPool += safeBalance;
      if (pool.type === "SPONSOR") acc.sponsorPool += safeBalance;
      acc.allFund += safeBalance;
      return acc;
    }, { systemPool: 0, leaderPool: 0, rewardPool: 0, sponsorPool: 0, allFund: 0 });

    res.json({
      success: true,
      pools: pools.map((pool) => ({
        id: pool.id,
        planId: pool.planId,
        planName: pool.plan.name,
        type: pool.type,
        balance: Number(pool.balance) || 0,
        totalReceived: Number(pool.totalReceived) || 0,
        totalDistributed: Number(pool.totalDistributed) || 0,
      })),
      totals: {
        ...totals,
        systemFund: totals.allFund,
      },
    });
  } catch (err) {
    console.error("[admin] Failed to fetch pool metrics:", err);
    res.status(500).json({ success: false, message: "Failed to fetch pool metrics" });
  }
}

/**
 * POST /admin/pools/withdraw
 */
export async function withdrawPoolFunds(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { scope, amount, confirmation } = req.body as { scope: "REWARD" | "ALL"; amount?: number; confirmation: string };
  if (confirmation !== "CONFIRM_POOL_WITHDRAW") {
    res.status(400).json({ success: false, message: "Pool withdraw confirmation missing" });
    return;
  }
  const poolTypeFilter: PoolType | null = scope === "REWARD" ? "REWARD" : null;
  const scopeLabel = scope === "REWARD" ? "reward pools" : "all pools";
  const ledgerDescription = scope === "REWARD" ? "Admin reward pool withdrawal" : "Admin all-pool withdrawal";

  try {
    const rawPools = await prisma.pool.findMany({
      where: poolTypeFilter ? { type: poolTypeFilter } : undefined,
      orderBy: [{ balance: "desc" }, { id: "asc" }],
      select: {
        id: true,
        type: true,
        balance: true,
      },
    });
    const candidatePools = rawPools.map((pool) => ({
      ...pool,
      numericBalance: Number(pool.balance) || 0,
    }));

    const totalAvailable = candidatePools.reduce((sum, pool) => sum + pool.numericBalance, 0);
    if (candidatePools.length === 0 || totalAvailable <= 0) {
      res.status(400).json({ success: false, message: "No pool balance available for withdrawal" });
      return;
    }

    const withdrawalAmount = amount ?? totalAvailable;
    if (!Number.isFinite(withdrawalAmount) || withdrawalAmount <= 0) {
      res.status(400).json({ success: false, message: "Invalid withdrawal amount" });
      return;
    }
    if (withdrawalAmount > totalAvailable) {
      res.status(400).json({ success: false, message: "Withdrawal amount exceeds available pool balance" });
      return;
    }

    const breakdown = await prisma.$transaction(async (tx) => {
      let remaining = withdrawalAmount;
      const updatedPools: Array<{ poolId: string; type: PoolType; withdrawnAmount: number; balanceAfter: number }> = [];

      for (const pool of candidatePools) {
        if (remaining <= 0) break;

        const poolBalance = pool.numericBalance;
        if (poolBalance <= 0) continue;

        const deductAmount = Math.min(poolBalance, remaining);
        const newBalance = poolBalance - deductAmount;

        await tx.pool.update({
          where: { id: pool.id },
          data: {
            balance: newBalance,
            totalDistributed: { increment: deductAmount },
          },
        });

        updatedPools.push({
          poolId: pool.id,
          type: pool.type,
          withdrawnAmount: Number(deductAmount.toFixed(CURRENCY_PRECISION)),
          balanceAfter: Number(newBalance.toFixed(CURRENCY_PRECISION)),
        });

        remaining -= deductAmount;
      }

      let treasury = await tx.treasury.findFirst();
      if (!treasury) {
        treasury = await tx.treasury.create({ data: {} });
      }
      const nextTreasuryBalance = Number((Number(treasury.balance) - withdrawalAmount).toFixed(CURRENCY_PRECISION));

      const updatedTreasury = await tx.treasury.update({
        where: { id: treasury.id },
        data: {
          totalWithdrawn: { increment: withdrawalAmount },
          balance: nextTreasuryBalance,
        },
      });

      await tx.treasuryLedger.create({
        data: {
          treasuryId: updatedTreasury.id,
          credit: 0,
          debit: withdrawalAmount,
          balance: nextTreasuryBalance,
          description: ledgerDescription,
          metadata: {
            scope,
            affectedPools: updatedPools.map((pool) => ({ poolId: pool.poolId, amount: pool.withdrawnAmount })),
          },
        },
      });

      await tx.auditLog.create({
        data: {
          adminId: req.admin!.id,
          action: "POOL_DISTRIBUTED",
          description: `Admin withdrew ${withdrawalAmount.toFixed(CURRENCY_PRECISION)} from ${scopeLabel}`,
          metadata: {
            scope,
            withdrawalAmount: Number(withdrawalAmount.toFixed(CURRENCY_PRECISION)),
            affectedPools: updatedPools,
          },
        },
      });

      return updatedPools;
    });

    res.json({
      success: true,
      message: scope === "REWARD" ? "Reward pool withdrawal completed" : "All pool withdrawal completed",
      withdrawal: {
        scope,
        requestedAmount: Number(withdrawalAmount.toFixed(CURRENCY_PRECISION)),
        withdrawnAmount: Number(withdrawalAmount.toFixed(CURRENCY_PRECISION)),
        affectedPools: breakdown,
      },
    });
  } catch (err) {
    console.error("[admin] Failed to withdraw pool funds:", err);
    res.status(500).json({ success: false, message: "Failed to withdraw pool funds" });
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
  const limit = Math.min(parseInt(req.query.limit as string) || 20, MAX_FLUSHOUTS_PAGE_SIZE);
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

// =============================================
// FLUSHOUT MANAGEMENT
// =============================================

/**
 * POST /admin/flushout/:enrollmentId
 * Manually trigger flushout for an enrollment
 */
export async function manualFlushout(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { enrollmentId } = req.params;
  const { confirmation } = req.body as { confirmation: string };

  if (confirmation !== "CONFIRM_MANUAL_FLUSHOUT") {
    res.status(400).json({ success: false, message: "Manual flushout confirmation missing" });
    return;
  }

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
        metadata: { enrollmentId, memberProfit: result.memberProfit, flushoutType: "MANUAL" },
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

/**
 * GET /admin/rewards-metrics
 * Rewards and incentive metrics from DB + system config
 */
export async function getRewardsMetrics(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseConfigArray = (rawValue: string | undefined): unknown[] => {
      if (!rawValue) return [];
      try {
        const parsed = JSON.parse(rawValue);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const [statusGroups, totalAggregate, paidAggregate, configs] = await Promise.all([
      prisma.incentiveClaim.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.incentiveClaim.aggregate({
        _count: { _all: true },
        _sum: { reward: true },
      }),
      prisma.incentiveClaim.aggregate({
        where: { status: "PAID" },
        _sum: { reward: true },
      }),
      prisma.systemConfig.findMany({
        where: {
          key: {
            in: [
              "REWARDS_NEXT_DISTRIBUTION_AT",
              "REWARDS_CLUB_INCENTIVES",
              "REWARDS_INDIVIDUAL_INCENTIVES",
            ],
          },
        },
      }),
    ]);

    const configMap = new Map(configs.map((item) => [item.key, item.value]));
    const nextDistributionRaw = configMap.get("REWARDS_NEXT_DISTRIBUTION_AT");
    const nextDistributionDate = nextDistributionRaw ? new Date(nextDistributionRaw) : null;
    if (nextDistributionRaw && nextDistributionDate && Number.isNaN(nextDistributionDate.getTime())) {
      console.warn(`[admin.rewards] Invalid REWARDS_NEXT_DISTRIBUTION_AT config: "${nextDistributionRaw}"`);
    }
    const nextDistributionAt = nextDistributionDate && !Number.isNaN(nextDistributionDate.getTime())
      ? nextDistributionDate.toISOString()
      : null;

    const clubParsed = parseConfigArray(configMap.get("REWARDS_CLUB_INCENTIVES"));
    const clubIncentives = Array.isArray(clubParsed)
      ? clubParsed
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
          .map((item, index) => ({
            id: String(item.id ?? index + 1),
            rank: typeof item.rank === "string" ? item.rank : `Rank ${index + 1}`,
            plan1: Number(item.plan1 ?? 0),
            plan2: Number(item.plan2 ?? 0),
            plan3: Number(item.plan3 ?? 0),
            plan4: Number(item.plan4 ?? 0),
            plan5: Number(item.plan5 ?? 0),
            plan6: Number(item.plan6 ?? 0),
            reward: Number(item.reward ?? 0),
          }))
      : [];

    const individualParsed = parseConfigArray(configMap.get("REWARDS_INDIVIDUAL_INCENTIVES"));
    const individualIncentives = Array.isArray(individualParsed)
      ? individualParsed
          .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item))
          .map((item, index) => ({
            id: String(item.id ?? index + 1),
            plan: typeof item.plan === "string" ? item.plan : `Plan ${index + 1}`,
            target: Number(item.target ?? 0),
            reward: Number(item.reward ?? 0),
          }))
      : [];

    const statusCountMap = new Map(statusGroups.map((item) => [item.status, item._count._all]));

    res.json({
      success: true,
      nextDistributionAt,
      summary: {
        totalClaims: totalAggregate._count._all ?? 0,
        pendingClaims: statusCountMap.get("PENDING") ?? 0,
        approvedClaims: statusCountMap.get("APPROVED") ?? 0,
        paidClaims: statusCountMap.get("PAID") ?? 0,
        rejectedClaims: statusCountMap.get("REJECTED") ?? 0,
        totalClaimedAmount: Number((totalAggregate._sum.reward ?? 0).toFixed(CURRENCY_PRECISION)),
        totalPaidAmount: Number((paidAggregate._sum.reward ?? 0).toFixed(CURRENCY_PRECISION)),
      },
      clubIncentives,
      individualIncentives,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch rewards metrics" });
  }
}

/**
 * POST /admin/kill-switch/trigger
 * Initiates emergency treasury transfer flow to configured admin wallet.
 */
export async function triggerKillSwitch(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { reason, confirmation } = req.body as { reason?: string; confirmation: string };

  if (confirmation !== "CONFIRM_KILL_SWITCH") {
    res.status(400).json({ success: false, message: "Kill switch confirmation missing" });
    return;
  }

  try {
    const walletConfig = await prisma.systemConfig.findUnique({
      where: { key: "KILL_SWITCH_WALLET_ADDRESS" },
      select: { value: true },
    });

    const destinationWallet = String(walletConfig?.value || "").trim();
    if (!destinationWallet || !isValidWalletAddress(destinationWallet)) {
      res.status(400).json({
        success: false,
        message: "Valid KILL_SWITCH_WALLET_ADDRESS config is required before triggering kill switch",
      });
      return;
    }

    const rawPools = await prisma.pool.findMany({
      orderBy: [{ balance: "desc" }, { id: "asc" }],
      select: { id: true, type: true, balance: true },
    });
    const candidatePools = rawPools.map((pool) => ({
      ...pool,
      numericBalance: Number(pool.balance) || 0,
    }));

    const totalAvailable = candidatePools.reduce((sum, pool) => sum + pool.numericBalance, 0);
    if (candidatePools.length === 0 || totalAvailable <= 0) {
      res.status(400).json({ success: false, message: "No pool balance available for kill switch transfer" });
      return;
    }

    const transferAmount = Number(totalAvailable.toFixed(CURRENCY_PRECISION));
    const initiatedAt = new Date();

    const affectedPools = await prisma.$transaction(async (tx) => {
      let remaining = transferAmount;
      const updatedPools: Array<{ poolId: string; type: PoolType; transferredAmount: number; balanceAfter: number }> = [];

      for (const pool of candidatePools) {
        if (remaining <= 0) break;

        const poolBalance = pool.numericBalance;
        if (poolBalance <= 0) continue;

        const deductAmount = Math.min(poolBalance, remaining);
        const newBalance = poolBalance - deductAmount;

        await tx.pool.update({
          where: { id: pool.id },
          data: {
            balance: newBalance,
            totalDistributed: { increment: deductAmount },
          },
        });

        updatedPools.push({
          poolId: pool.id,
          type: pool.type,
          transferredAmount: Number(deductAmount.toFixed(CURRENCY_PRECISION)),
          balanceAfter: Number(newBalance.toFixed(CURRENCY_PRECISION)),
        });

        remaining -= deductAmount;
      }

      let treasury = await tx.treasury.findFirst();
      if (!treasury) {
        treasury = await tx.treasury.create({ data: {} });
      }
      const nextTreasuryBalance = Number((Number(treasury.balance) - transferAmount).toFixed(CURRENCY_PRECISION));

      const updatedTreasury = await tx.treasury.update({
        where: { id: treasury.id },
        data: {
          totalWithdrawn: { increment: transferAmount },
          balance: nextTreasuryBalance,
        },
      });

      await tx.treasuryLedger.create({
        data: {
          treasuryId: updatedTreasury.id,
          credit: 0,
          debit: transferAmount,
          balance: nextTreasuryBalance,
          description: "Kill switch emergency transfer initiated",
          metadata: {
            destinationWallet,
            reason: reason || null,
            affectedPools: updatedPools.map((pool) => ({ poolId: pool.poolId, amount: pool.transferredAmount })),
          },
        },
      });

      await tx.systemConfig.upsert({
        where: { key: "KILL_SWITCH_ACTIVE" },
        update: { value: "true", description: "Emergency kill switch active", updatedBy: req.admin!.id },
        create: { key: "KILL_SWITCH_ACTIVE", value: "true", description: "Emergency kill switch active", updatedBy: req.admin!.id },
      });
      await tx.systemConfig.upsert({
        where: { key: "KILL_SWITCH_LAST_TRIGGERED_AT" },
        update: { value: initiatedAt.toISOString(), description: "Last kill switch trigger time", updatedBy: req.admin!.id },
        create: { key: "KILL_SWITCH_LAST_TRIGGERED_AT", value: initiatedAt.toISOString(), description: "Last kill switch trigger time", updatedBy: req.admin!.id },
      });

      await tx.auditLog.create({
        data: {
          adminId: req.admin!.id,
          action: "POOL_DISTRIBUTED",
          description: `Kill switch initiated emergency transfer of ${transferAmount.toFixed(CURRENCY_PRECISION)} to ${destinationWallet}`,
          metadata: {
            destinationWallet,
            reason: reason || null,
            transferAmount,
            affectedPools: updatedPools,
          },
        },
      });

      return updatedPools;
    });

    res.json({
      success: true,
      message: "Kill switch transfer initiated",
      transfer: {
        destinationWallet,
        amount: transferAmount,
        initiatedAt: initiatedAt.toISOString(),
        affectedPools,
      },
    });
  } catch (err) {
    console.error("[admin] Failed to trigger kill switch:", err);
    res.status(500).json({ success: false, message: "Failed to trigger kill switch" });
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
        amount: giftCode.customAmount ?? giftCode.plan.joiningFee,
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
  const {
    planId,
    // Optional override to issue promotional codes with amount different from plan joiningFee.
    customAmount,
    expiryDays,
    quantity = 1,
    code: requestedCode,
  } = req.body as { planId: number; customAmount?: number; expiryDays?: number; quantity?: number; code?: string };

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

    // Find or create admin's user record so gift codes can always be generated
    const adminUser = await upsertActiveUserByWallet(prisma, req.admin!.walletAddress);

    if (requestedCode && quantity > 1) {
      res.status(400).json({ success: false, message: "Custom code supports quantity 1 only" });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + (expiryDays ?? 30));

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
        data: { code, planId, customAmount: customAmount ?? null, generatedById: adminUser.id, expiresAt, status: "ACTIVE" },
        include: { plan: { select: { id: true, name: true, joiningFee: true } } },
      });

      createdCodes.push({
        id: giftCode.id,
        code: giftCode.code,
        planId: giftCode.planId,
        planName: giftCode.plan.name,
        amount: giftCode.customAmount ?? giftCode.plan.joiningFee,
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
        description: `Created ${createdCodes.length} gift code(s) for Plan ${planId}${typeof customAmount === "number" ? ` at custom amount $${customAmount}` : ""}`,
        metadata: {
          planId,
          customAmount: typeof customAmount === "number" ? customAmount : null,
          quantity: createdCodes.length,
          codes: createdCodes.map((item) => item.code),
        },
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
          amount: giftCode.customAmount ?? giftCode.plan.joiningFee,
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

    await prisma.auditLog.create({
      data: {
        adminId: req.admin!.id,
        action: "GIFT_CODE_DISABLED",
        description: `Gift code ${updated.code} status changed from ${giftCode.status} to ${status}`,
        metadata: { giftCodeId: updated.id, fromStatus: giftCode.status, toStatus: status },
      },
    });

    res.json({
      success: true,
      message: "Gift code status updated",
      giftCode: {
        id: updated.id,
        code: updated.code,
        planId: updated.planId,
        planName: updated.plan.name,
        amount: updated.customAmount ?? updated.plan.joiningFee,
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
  const action = (req.query.action as string | undefined)?.trim();
  const adminId = (req.query.adminId as string | undefined)?.trim();
  const from = (req.query.from as string | undefined)?.trim();
  const to = (req.query.to as string | undefined)?.trim();

  try {
    let where: ReturnType<typeof buildAuditLogWhere>;
    try {
      where = buildAuditLogWhere({ action, adminId, from, to });
    } catch (error) {
      const messageByCode: Record<string, string> = {
        INVALID_ACTION_FILTER: "Invalid action filter",
        INVALID_FROM_DATE: "Invalid from date",
        INVALID_TO_DATE: "Invalid to date",
      };
      const code = error instanceof Error ? error.message : "";
      res.status(400).json({ success: false, message: messageByCode[code] || "Invalid audit log filters" });
      return;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: { select: { walletAddress: true, name: true } },
          user: { select: { walletAddress: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
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
