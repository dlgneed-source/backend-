/**
 * Pool Controller
 * Pool balances and distribution info
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

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

/**
 * GET /pools/stats
 * Get plan-wise pool balances and overall totals
 */
export async function getPoolStats(req: Request, res: Response): Promise<void> {
  try {
    const [plans, pools] = await Promise.all([
      prisma.plan.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { id: "asc" },
      }),
      prisma.pool.findMany({
        select: { planId: true, type: true, balance: true },
      }),
    ]);

    const plansWithPools = plans.map((plan) => ({
      planId: plan.id,
      planName: plan.name,
      pools: {
        leaderPool: 0,
        rewardPool: 0,
        sponsorPool: 0,
      },
    }));

    const byPlan = new Map<number, (typeof plansWithPools)[number]>();
    plansWithPools.forEach((plan) => byPlan.set(plan.planId, plan));

    pools.forEach((pool) => {
      const target = byPlan.get(pool.planId);
      if (!target) return;

      const safeBalance = Number(pool.balance) || 0;
      if (pool.type === "LEADER") target.pools.leaderPool = safeBalance;
      if (pool.type === "REWARD") target.pools.rewardPool = safeBalance;
      if (pool.type === "SPONSOR") target.pools.sponsorPool = safeBalance;
    });

    const totals = plansWithPools.reduce(
      (acc, plan) => {
        acc.leaderPool += Number(plan.pools.leaderPool) || 0;
        acc.rewardPool += Number(plan.pools.rewardPool) || 0;
        acc.sponsorPool += Number(plan.pools.sponsorPool) || 0;
        return acc;
      },
      { leaderPool: 0, rewardPool: 0, sponsorPool: 0 }
    );

    res.json({
      success: true,
      stats: {
        plans: plansWithPools,
        totals,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch pool stats" });
  }
}
