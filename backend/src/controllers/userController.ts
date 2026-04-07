/**
 * User Controller
 * User profile, balance, transactions
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth";
import { roundMoney } from "../utils/money";

const prisma = new PrismaClient();

/**
 * GET /users/profile
 * Get current user full profile
 */
export async function getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        referredBy: { select: { id: true, walletAddress: true, name: true, referralCode: true } },
        enrollments: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: { referrals: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
}

/**
 * PATCH /users/profile
 * Update user profile (name, email)
 */
export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { name, email } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
      },
      select: { id: true, walletAddress: true, name: true, email: true, referralCode: true },
    });

    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
}

/**
 * GET /users/balance
 * Get user balance summary
 */
export async function getBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.user!.id;

    const [commissions, uplineCommissions, flushouts, withdrawals, incentives] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: "COMMISSION", status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: "UPLINE_COMMISSION", status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: "FLUSHOUT", status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { userId, status: { in: ["COMPLETED", "APPROVED"] } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: "INCENTIVE", status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

    const totalEarned =
      (commissions._sum.amount || 0) +
      (uplineCommissions._sum.amount || 0) +
      (flushouts._sum.amount || 0) +
      (incentives._sum.amount || 0);

    const totalWithdrawn = withdrawals._sum.amount || 0;
    const availableBalance = totalEarned - totalWithdrawn;

    res.json({
      success: true,
      balance: {
        totalEarned: roundMoney(totalEarned),
        totalWithdrawn: roundMoney(totalWithdrawn),
        availableBalance: roundMoney(Math.max(0, availableBalance)),
        breakdown: {
          commissions: roundMoney(commissions._sum.amount || 0),
          uplineCommissions: roundMoney(uplineCommissions._sum.amount || 0),
          flushouts: roundMoney(flushouts._sum.amount || 0),
          incentives: roundMoney(incentives._sum.amount || 0),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch balance" });
  }
}

/**
 * GET /users/transactions
 * Get user transaction history
 */
export async function getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId: req.user!.id } }),
    ]);

    res.json({
      success: true,
      transactions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch transactions" });
  }
}

/**
 * GET /users/enrollments
 * Get user's enrollment history
 */
export async function getEnrollments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user!.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, enrollments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch enrollments" });
  }
}

/**
 * GET /users/referral-link
 * Get user's referral link
 */
export async function getReferralLink(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { referralCode: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const referralLink = `${baseUrl}/join?ref=${user.referralCode}`;

    res.json({ success: true, referralCode: user.referralCode, referralLink });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch referral link" });
  }
}
