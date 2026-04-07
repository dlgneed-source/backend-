/**
 * Plan Controller
 * Manage and view plans
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth";

const prisma = new PrismaClient();

/**
 * GET /plans
 * Get all active plans
 */
export async function getAllPlans(req: Request, res: Response): Promise<void> {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });
    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch plans" });
  }
}

/**
 * GET /plans/:planId
 * Get single plan details
 */
export async function getPlanById(req: Request, res: Response): Promise<void> {
  const planId = parseInt(req.params.planId);

  try {
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        pools: true,
        _count: { select: { enrollments: true } },
      },
    });

    if (!plan) {
      res.status(404).json({ success: false, message: "Plan not found" });
      return;
    }

    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch plan" });
  }
}

/**
 * POST /plans/enroll
 * Enroll a user into a plan
 */
export async function enrollInPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { planId, txHash } = req.body;
  const userId = req.user!.id;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, referredById: true },
    });
    if (!currentUser || currentUser.status !== "ACTIVE") {
      res.status(403).json({ success: false, message: "Inactive users cannot enroll in plans" });
      return;
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      res.status(404).json({ success: false, message: "Plan not found or inactive" });
      return;
    }

    // Check if user already has an ACTIVE enrollment in this plan
    const existing = await prisma.enrollment.findFirst({
      where: { userId, planId, status: "ACTIVE" },
    });

    if (existing) {
      res.status(409).json({ success: false, message: "Already enrolled in this plan" });
      return;
    }

    // Import here to avoid circular dep
    const { distributeCommissions } = await import("../utils/commissionLogic");
    const { calculateFlushoutDate } = await import("../utils/flushoutLogic");

    const flushoutAt = calculateFlushoutDate(new Date(), plan.flushoutDays);

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        planId,
        status: "ACTIVE",
        flushoutAt,
        txHash,
      },
    });

    // Upline commission (direct referrer gets joiningFee commission)
    const directUpline = currentUser.referredById
      ? await prisma.user.findUnique({
          where: { id: currentUser.referredById },
          select: { id: true, status: true },
        })
      : null;

    if (directUpline?.status === "ACTIVE" && plan.uplineCommission > 0) {
      await prisma.uplineCommission.create({
        data: {
          enrollmentId: enrollment.id,
          recipientId: directUpline.id,
          amount: plan.uplineCommission,
          planId,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: directUpline.id,
          type: "UPLINE_COMMISSION",
          amount: plan.uplineCommission,
          description: `Upline commission from Plan ${planId} enrollment`,
          status: "COMPLETED",
          metadata: { enrollmentId: enrollment.id, planId },
        },
      });
    }

    // Distribute multi-level commissions from slotFee
    await distributeCommissions(enrollment.id, userId, plan.slotFee, planId);

    // System fee to treasury
    await prisma.systemFeeLedger.create({
      data: {
        enrollmentId: enrollment.id,
        planId,
        amount: plan.systemFee,
        description: "System fee on enrollment",
      },
    });

    // SYSTEM pool gets systemFee
    await prisma.pool.upsert({
      where: { planId_type: { planId, type: "SYSTEM" } },
      update: {
        balance: { increment: plan.systemFee },
        totalReceived: { increment: plan.systemFee },
      },
      create: {
        planId,
        type: "SYSTEM",
        balance: plan.systemFee,
        totalReceived: plan.systemFee,
        totalDistributed: 0,
      },
    });

    // Create deposit transaction for user
    await prisma.transaction.create({
      data: {
        userId,
        type: "DEPOSIT",
        amount: plan.joiningFee,
        description: `Plan ${planId} (${plan.name}) enrollment fee`,
        status: "COMPLETED",
        metadata: { enrollmentId: enrollment.id, planId },
      },
    });

    res.status(201).json({
      success: true,
      message: "Successfully enrolled",
      enrollment: {
        id: enrollment.id,
        planId,
        planName: plan.name,
        flushoutAt,
        memberProfit: plan.memberProfit,
      },
    });
  } catch (err: any) {
    console.error("Enrollment error:", err);
    res.status(500).json({ success: false, message: "Enrollment failed" });
  }
}

/**
 * GET /plans/:planId/stats
 * Get plan statistics
 */
export async function getPlanStats(req: Request, res: Response): Promise<void> {
  const planId = parseInt(req.params.planId);

  try {
    const [plan, enrollmentCounts, pools] = await Promise.all([
      prisma.plan.findUnique({ where: { id: planId } }),
      prisma.enrollment.groupBy({
        by: ["status"],
        where: { planId },
        _count: true,
      }),
      prisma.pool.findMany({ where: { planId } }),
    ]);

    if (!plan) {
      res.status(404).json({ success: false, message: "Plan not found" });
      return;
    }

    const statusMap: Record<string, number> = {};
    enrollmentCounts.forEach((e) => {
      statusMap[e.status] = e._count;
    });

    res.json({
      success: true,
      stats: {
        plan,
        enrollments: {
          active: statusMap["ACTIVE"] || 0,
          flushed: statusMap["FLUSHED"] || 0,
          matured: statusMap["MATURED"] || 0,
          total: Object.values(statusMap).reduce((a, b) => a + b, 0),
        },
        pools,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch plan stats" });
  }
}

/**
 * GET /plans/members
 * Enrollment-based member counts by plan
 */
export async function getPlanMembers(req: Request, res: Response): Promise<void> {
  try {
    const [plans, enrollmentCounts] = await Promise.all([
      prisma.plan.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { id: "asc" },
      }),
      prisma.enrollment.groupBy({
        by: ["planId"],
        _count: { _all: true },
      }),
    ]);

    const countByPlan = new Map<number, number>();
    enrollmentCounts.forEach((row) => countByPlan.set(row.planId, row._count._all || 0));

    const plansWithMembers = plans.map((plan) => ({
      planId: plan.id,
      planName: plan.name,
      enrollments: countByPlan.get(plan.id) || 0,
    }));

    const totalEnrollments = plansWithMembers.reduce((sum, plan) => sum + (plan.enrollments || 0), 0);

    res.json({
      success: true,
      members: {
        plans: plansWithMembers,
        totalEnrollments,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch plan members" });
  }
}
