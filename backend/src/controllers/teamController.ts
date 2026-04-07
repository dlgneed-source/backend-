/**
 * Team Controller
 * Team/referral tree and downline management
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth";
import { getAllTeamMemberIds } from "../utils/incentiveLogic";
import { buildCommissionLevelSummary } from "../utils/commissionSummary";

const prisma = new PrismaClient();

/**
 * GET /team/direct
 * Get direct referrals (level 1)
 */
export async function getDirectReferrals(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const [referrals, total] = await Promise.all([
      prisma.user.findMany({
        where: { referredById: req.user!.id },
        select: {
          id: true,
          walletAddress: true,
          name: true,
          status: true,
          createdAt: true,
          _count: { select: { enrollments: true, referrals: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: { referredById: req.user!.id } }),
    ]);

    res.json({
      success: true,
      referrals,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch referrals" });
  }
}

/**
 * GET /team/stats
 * Get team-wide statistics
 */
export async function getTeamStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const teamIds = await getAllTeamMemberIds(req.user!.id);
    const level1Referrals = await prisma.user.findMany({
      where: { referredById: req.user!.id },
      select: { id: true },
    });
    const level1Count = level1Referrals.length;
    const level1Ids = level1Referrals.map((referral) => referral.id);

    const [totalMembers, level2Count, enrollmentsByPlan, activeEnrollments] = await Promise.all([
      Promise.resolve(teamIds.length),
      level1Ids.length
        ? prisma.user.count({
            where: {
              referredById: { in: level1Ids },
            },
          })
        : Promise.resolve(0),
      prisma.enrollment.groupBy({
        by: ["planId"],
        where: {
          userId: { in: teamIds },
          status: { in: ["ACTIVE", "MATURED", "FLUSHED"] },
        },
        _count: true,
      }),
      prisma.enrollment.count({
        where: { userId: { in: teamIds }, status: "ACTIVE" },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalMembers,
        level1Count,
        level2Count,
        activeEnrollments,
        enrollmentsByPlan: enrollmentsByPlan.map((e) => ({
          planId: e.planId,
          count: e._count,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch team stats" });
  }
}

/**
 * GET /team/tree
 * Get simplified team tree (up to 3 levels deep for UI)
 */
export async function getTeamTree(req: AuthenticatedRequest, res: Response): Promise<void> {
  const maxDepth = Math.min(parseInt(req.query.depth as string) || 3, 5);

  try {
    const tree = await buildTree(req.user!.id, maxDepth);
    res.json({ success: true, tree });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch team tree" });
  }
}

/**
 * GET /team/commissions
 * Get commissions earned from team
 */
export async function getTeamCommissions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const [commissions, total, totalEarned, uplineEarned, byLevel] = await Promise.all([
      prisma.commission.findMany({
        where: { toUserId: req.user!.id },
        include: {
          fromUser: { select: { walletAddress: true, name: true } },
          enrollment: { include: { plan: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.commission.count({ where: { toUserId: req.user!.id } }),
      prisma.commission.aggregate({
        where: { toUserId: req.user!.id },
        _sum: { amount: true },
      }),
      prisma.uplineCommission.aggregate({
        where: { recipientId: req.user!.id },
        _sum: { amount: true },
      }),
      prisma.commission.groupBy({
        by: ["level"],
        where: { toUserId: req.user!.id },
        _sum: { amount: true },
      }),
    ]);

    const summary = buildCommissionLevelSummary({
      uplineAmount: uplineEarned._sum.amount,
      levelAmounts: byLevel.map((row) => ({
        level: row.level,
        amount: row._sum.amount,
      })),
    });
    const normalizedCommissions = commissions.map((commission) => ({
      ...commission,
      displayLevel: commission.level + 1,
    }));

    res.json({
      success: true,
      commissions: normalizedCommissions,
      totalEarned: parseFloat(
        ((totalEarned._sum.amount || 0) + (uplineEarned._sum.amount || 0)).toFixed(6),
      ),
      commissionSummary: summary,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch team commissions" });
  }
}

// =============================================
// HELPERS
// =============================================

interface TreeNode {
  id: string;
  walletAddress: string;
  name: string | null;
  level: number;
  enrollmentCount: number;
  children?: TreeNode[];
}

async function buildTree(userId: string, maxDepth: number, currentDepth = 0): Promise<TreeNode[]> {
  if (currentDepth >= maxDepth) return [];

  const directReferrals = await prisma.user.findMany({
    where: { referredById: userId },
    select: {
      id: true,
      walletAddress: true,
      name: true,
      _count: { select: { enrollments: true } },
    },
    take: 50, // Limit for performance
  });

  const nodes: TreeNode[] = [];
  for (const ref of directReferrals) {
    const children = await buildTree(ref.id, maxDepth, currentDepth + 1);
    nodes.push({
      id: ref.id,
      walletAddress: ref.walletAddress,
      name: ref.name,
      level: currentDepth + 1,
      enrollmentCount: ref._count.enrollments,
      children: children.length > 0 ? children : undefined,
    });
  }

  return nodes;
}
