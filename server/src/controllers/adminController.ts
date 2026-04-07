import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response';
import { ValidationError, NotFoundError } from '../utils/errors';
import crypto from 'crypto';

// GET /api/admin/gift-codes
export const getGiftCodes = asyncHandler(async (_req: Request, res: Response) => {
  const codes = await prisma.giftCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { redemptions: true } } },
  });
  successResponse(res, codes, 'Gift codes fetched');
});

// POST /api/admin/gift-codes
export const createGiftCode = asyncHandler(async (req: Request, res: Response) => {
  const adminId = (req as any).user!.id;
  const { amount, maxUses, expiresInDays } = req.body;

  if (!amount || amount <= 0) throw new ValidationError('Valid amount required');
  if (!maxUses || maxUses <= 0) throw new ValidationError('Valid maxUses required');
  if (!expiresInDays || expiresInDays <= 0) throw new ValidationError('Valid expiresInDays required');

  const code = 'EAK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const giftCode = await prisma.giftCode.create({
    data: { code, amount, maxUses, expiresAt, createdBy: adminId },
  });

  successResponse(res, giftCode, 'Gift code created', 201);
});

// POST /api/admin/gift-codes/:id/revoke
export const revokeGiftCode = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const code = await prisma.giftCode.findUnique({ where: { id } });
  if (!code) throw new NotFoundError('Gift code not found');

  const updated = await prisma.giftCode.update({
    where: { id },
    data: { status: 'DISABLED' },
  });
  successResponse(res, updated, 'Gift code revoked');
});

// POST /api/gift-codes/redeem
export const redeemGiftCode = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user!.id;
  const { code } = req.body;

  if (!code) throw new ValidationError('Code is required');

  const result = await prisma.$transaction(async (tx) => {
    const giftCode = await tx.giftCode.findUnique({ where: { code } });
    if (!giftCode) throw new NotFoundError('Invalid gift code');
    if (giftCode.status !== 'ACTIVE') throw new ValidationError('Gift code is not active');
    if (giftCode.usedCount >= giftCode.maxUses) throw new ValidationError('Gift code fully used');
    if (new Date() > giftCode.expiresAt) throw new ValidationError('Gift code expired');

    // Check if user already redeemed
    const existing = await tx.giftCodeRedemption.findFirst({
      where: { giftCodeId: giftCode.id, userId },
    });
    if (existing) throw new ValidationError('Already redeemed this code');

    // Credit user
    await tx.user.update({
      where: { id: userId },
      data: { balance: { increment: giftCode.amount } },
    });

    // Record redemption
    await tx.giftCodeRedemption.create({
      data: { giftCodeId: giftCode.id, userId, amount: giftCode.amount },
    });

    // Update gift code usage
    const updatedCode = await tx.giftCode.update({
      where: { id: giftCode.id },
      data: {
        usedCount: { increment: 1 },
        status: giftCode.usedCount + 1 >= giftCode.maxUses ? 'DEPLETED' : 'ACTIVE',
      },
    });

    // Transaction record
    await tx.transaction.create({
      data: {
        userId,
        type: 'GIFT_CODE',
        amount: giftCode.amount,
        description: `Gift code redeemed: ${code}`,
        referenceId: giftCode.id,
      },
    });

    return updatedCode;
  });

  successResponse(res, result, 'Gift code redeemed successfully');
});

// GET /api/admin/users
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { joinedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, walletAddress: true, name: true, email: true,
        status: true, joinedAt: true, lastActiveAt: true,
        totalInvested: true, totalEarned: true, balance: true,
        _count: { select: { referrals: true, enrollments: true } },
      },
    }),
    prisma.user.count(),
  ]);

  successResponse(res, { users, total, page, limit }, 'Users fetched');
});

// POST /api/admin/users/:id/suspend
export const suspendUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: 'SUSPENDED' },
  });
  successResponse(res, user, 'User suspended');
});

// POST /api/admin/users/:id/unsuspend
export const unsuspendUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { status: 'ACTIVE' },
  });
  successResponse(res, user, 'User unsuspended');
});

// GET /api/admin/dashboard
export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, activeUsers, totalEnrollments, activeEnrollments, pools, treasury] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.enrollment.count(),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.pool.findMany(),
    prisma.treasury.findFirst({ where: { key: 'SYSTEM_OWNER_TREASURY' } }),
  ]);

  successResponse(res, {
    totalUsers, activeUsers, totalEnrollments, activeEnrollments,
    pools, treasuryBalance: treasury?.balance || 0,
  }, 'Dashboard stats fetched');
});

// GET /api/admin/withdrawals
export const getWithdrawals = asyncHandler(async (req: Request, res: Response) => {
  const status = req.query.status as string | undefined;
  const where = status ? { status: status as any } : {};
  const withdrawals = await prisma.withdrawal.findMany({
    where,
    orderBy: { requestedAt: 'desc' },
    include: { user: { select: { walletAddress: true, name: true } } },
  });
  successResponse(res, withdrawals, 'Withdrawals fetched');
});

// POST /api/admin/withdrawals/:id/approve
export const approveWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const withdrawal = await prisma.withdrawal.update({
    where: { id: req.params.id },
    data: { status: 'APPROVED', processedAt: new Date(), processedBy: (req as any).user!.id },
  });
  successResponse(res, withdrawal, 'Withdrawal approved');
});

// POST /api/admin/withdrawals/:id/reject
export const rejectWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const withdrawal = await prisma.withdrawal.update({
    where: { id: req.params.id },
    data: { status: 'REJECTED', processedAt: new Date(), processedBy: (req as any).user!.id, failReason: reason },
  });
  // Refund balance
  await prisma.user.update({
    where: { id: withdrawal.userId },
    data: { balance: { increment: withdrawal.amount } },
  });
  successResponse(res, withdrawal, 'Withdrawal rejected');
});

// GET /api/admin/flushouts
export const getFlushouts = asyncHandler(async (_req: Request, res: Response) => {
  const flushouts = await prisma.enrollment.findMany({
    where: { status: 'FLUSHED' },
    orderBy: { maturedAt: 'desc' },
    include: { user: { select: { walletAddress: true } }, plan: { select: { name: true } } },
  });
  successResponse(res, flushouts, 'Flushouts fetched');
});

// GET /api/admin/commissions
export const getCommissions = asyncHandler(async (_req: Request, res: Response) => {
  const commissions = await prisma.commission.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      fromUser: { select: { walletAddress: true } },
      toUser: { select: { walletAddress: true } },
    },
  });
  successResponse(res, commissions, 'Commissions fetched');
});

// GET /api/admin/security-logs
export const getSecurityLogs = asyncHandler(async (_req: Request, res: Response) => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  successResponse(res, logs, 'Security logs fetched');
});

// GET /api/pools
export const getPools = asyncHandler(async (_req: Request, res: Response) => {
  const pools = await prisma.pool.findMany({
    include: { plan: { select: { name: true } } },
  });
  successResponse(res, pools, 'Pools fetched');
});

// POST /api/withdraw
export const requestWithdrawal = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user!.id;
  const { amount } = req.body;

  if (!amount || amount <= 0) throw new ValidationError('Valid amount required');

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User not found');
    if (Number(user.balance) < amount) throw new ValidationError('Insufficient balance');

    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });

    const withdrawal = await tx.withdrawal.create({
      data: { userId, amount },
    });

    await tx.transaction.create({
      data: {
        userId,
        type: 'WITHDRAWAL',
        amount,
        description: `Withdrawal request`,
        referenceId: withdrawal.id,
      },
    });

    return withdrawal;
  });

  successResponse(res, result, 'Withdrawal requested', 201);
});
