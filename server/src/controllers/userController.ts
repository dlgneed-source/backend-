import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response';
import { ValidationError, NotFoundError } from '../utils/errors';

// GET /api/user/profile
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, walletAddress: true, name: true, email: true,
      status: true, joinedAt: true, lastActiveAt: true,
      totalInvested: true, totalEarned: true, totalWithdrawn: true, balance: true,
      referrerId: true, nonce: true,
      _count: { select: { referrals: true, enrollments: true } },
    },
  });

  if (!user) throw new NotFoundError('User not found');
  successResponse(res, user, 'Profile fetched');
});

// GET /api/user/transactions
export const getUserTransactions = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user!.id;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  successResponse(res, { transactions, total, page, limit }, 'Transactions fetched');
});

// GET /api/user/referral-tree
export const getUserReferralTree = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user!.id;

  async function buildTree(uid: string, depth: number): Promise<any> {
    if (depth > 7) return null;
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, walletAddress: true, name: true, referrals: { select: { id: true } } },
    });
    if (!user) return null;
    const children = await Promise.all(
      user.referrals.map((r) => buildTree(r.id, depth + 1))
    );
    return {
      name: user.name || user.walletAddress.slice(0, 6) + '...' + user.walletAddress.slice(-4),
      wallet: user.walletAddress.slice(0, 5) + '...' + user.walletAddress.slice(-4),
      level: depth,
      children: children.filter(Boolean),
    };
  }

  const tree = await buildTree(userId, 0);
  successResponse(res, tree, 'Referral tree fetched');
});

// GET /api/user/stats
export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user!.id;
  const [user, enrollments, referralCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.enrollment.findMany({ where: { userId, status: 'ACTIVE' }, include: { plan: true } }),
    prisma.user.count({ where: { referrerId: userId } }),
  ]);

  if (!user) throw new NotFoundError('User not found');

  successResponse(res, {
    balance: user.balance,
    totalEarned: user.totalEarned,
    totalInvested: user.totalInvested,
    totalWithdrawn: user.totalWithdrawn,
    activeEnrollments: enrollments.length,
    referralCount,
    activePlans: enrollments.map((e) => ({ planId: e.planId, name: e.plan.name, expiresAt: e.expiresAt })),
  }, 'Stats fetched');
});
