/**
 * Pool Controller
 * Pool balances and distribution info
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth";

const prisma = new PrismaClient();

/**
 * GET /pools
 * Get all pool balances
 */
export async function getAllPools(req: Request, res: Response): Promise<void> {
  try {
    const pools = await prisma.pool.findMany({
      include: { plan: { select: { id: true, name: true } } },
      orderBy: [{ planId: "asc" }, { type: "asc" }],
    });

    res.json({ success: true, pools });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch pools" });
  }
}

/**
 * GET /pools/:planId
 * Get pools for a specific plan
 */
export async function getPlanPools(req: Request, res: Response): Promise<void> {
  const planId = parseInt(req.params.planId);

  try {
    const pools = await prisma.pool.findMany({
      where: { planId },
      include: { plan: { select: { name: true } } },
      orderBy: { type: "asc" },
    });

    res.json({ success: true, pools });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch plan pools" });
  }
}

/**
 * GET /pools/distributions
 * Get recent pool distributions
 */
export async function getDistributions(req: Request, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const [distributions, total] = await Promise.all([
      prisma.poolDistribution.findMany({
        include: {
          pool: { include: { plan: { select: { name: true } } } },
          enrollment: { include: { user: { select: { walletAddress: true } } } },
        },
        orderBy: { distributedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.poolDistribution.count(),
    ]);

    res.json({
      success: true,
      distributions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch distributions" });
  }
}

/**
 * GET /pools/summary
 * Get overall pool summary
 */
export async function getPoolSummary(req: Request, res: Response): Promise<void> {
  try {
    const pools = await prisma.pool.groupBy({
      by: ["type"],
      _sum: { balance: true, totalDistributed: true, totalReceived: true },
    });

    const summary = pools.map((p) => ({
      type: p.type,
      balance: p._sum.balance || 0,
      totalReceived: p._sum.totalReceived || 0,
      totalDistributed: p._sum.totalDistributed || 0,
    }));

    res.json({ success: true, summary });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch pool summary" });
  }
}
