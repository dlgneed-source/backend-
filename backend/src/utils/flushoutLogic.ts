/**
 * Flushout Logic
 * When an enrollment's flushout period expires, the member receives their
 * memberProfit from the pool. Remaining pool funds are redistributed.
 *
 * Distribution breakdown per plan:
 * - memberProfit → paid to enrolled user
 * - leaderPool → added to LEADER pool
 * - rewardPool → added to REWARD pool (if > 0)
 * - sponsorPool → added to SPONSOR pool (if > 0)
 *
 * Enrollment-time payouts (system fee, direct upline, multi-level commission chain) are handled
 * during enrollment creation and should not be duplicated during flushout.
 */

import { PrismaClient, EnrollmentStatus } from "@prisma/client";

const prisma = new PrismaClient();

export interface FlushoutResult {
  enrollmentId: string;
  userId: string;
  planId: number;
  memberProfit: number;
  status: "success" | "failed";
  message?: string;
}

/**
 * Process flushout for a single enrollment
 */
export async function processFlushout(enrollmentId: string): Promise<FlushoutResult> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { plan: true, user: true },
  });

  if (!enrollment) {
    return { enrollmentId, userId: "", planId: 0, memberProfit: 0, status: "failed", message: "Enrollment not found" };
  }

  if (enrollment.status !== "ACTIVE") {
    return {
      enrollmentId,
      userId: enrollment.userId,
      planId: enrollment.planId,
      memberProfit: 0,
      status: "failed",
      message: `Enrollment already ${enrollment.status}`,
    };
  }

  const { plan, user } = enrollment;

  try {
    // Update enrollment status to FLUSHED
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: "FLUSHED", flushoutAt: new Date() },
    });

    // Pay member profit
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "FLUSHOUT",
        amount: plan.memberProfit,
        description: `Plan ${plan.id} (${plan.name}) flushout - member profit`,
        status: "COMPLETED",
        metadata: { enrollmentId, planId: plan.id },
      },
    });

    // Add to Leader pool
    if (plan.leaderPool > 0) {
      await addToPool(plan.id, "LEADER", plan.leaderPool, enrollmentId);
    }

    // Add to Reward pool
    if (plan.rewardPool > 0) {
      await addToPool(plan.id, "REWARD", plan.rewardPool, enrollmentId);
    }

    // Add to Sponsor pool
    if (plan.sponsorPool > 0) {
      await addToPool(plan.id, "SPONSOR", plan.sponsorPool, enrollmentId);
    }

    return {
      enrollmentId,
      userId: user.id,
      planId: plan.id,
      memberProfit: plan.memberProfit,
      status: "success",
    };
  } catch (err: any) {
    return {
      enrollmentId,
      userId: enrollment.userId,
      planId: enrollment.planId,
      memberProfit: 0,
      status: "failed",
      message: err.message,
    };
  }
}

/**
 * Process all pending flushouts (called by cron job)
 */
export async function processAllPendingFlushouts(): Promise<FlushoutResult[]> {
  const now = new Date();

  // Find all active enrollments whose flushout time has passed
  const expiredEnrollments = await prisma.enrollment.findMany({
    where: {
      status: "ACTIVE",
      flushoutAt: { lte: now },
    },
    include: { plan: true },
    take: 100, // Process in batches
  });

  const results: FlushoutResult[] = [];
  for (const enrollment of expiredEnrollments) {
    const result = await processFlushout(enrollment.id);
    results.push(result);
  }

  return results;
}

/**
 * Add funds to a pool
 */
async function addToPool(
  planId: number,
  type: "LEADER" | "REWARD" | "SPONSOR" | "SYSTEM",
  amount: number,
  enrollmentId: string
): Promise<void> {
  const pool = await prisma.pool.upsert({
    where: { planId_type: { planId, type } },
    update: {
      balance: { increment: amount },
      totalReceived: { increment: amount },
    },
    create: {
      planId,
      type,
      balance: amount,
      totalReceived: amount,
      totalDistributed: 0,
    },
  });

  await prisma.poolDistribution.create({
    data: {
      poolId: pool.id,
      enrollmentId,
      amount,
      description: `Flushout contribution to ${type} pool`,
    },
  });
}

/**
 * Calculate when an enrollment should be flushed out
 */
export function calculateFlushoutDate(enrolledAt: Date, flushoutDays: number): Date {
  const date = new Date(enrolledAt);
  date.setDate(date.getDate() + flushoutDays);
  return date;
}

/**
 * Get flushout statistics
 */
export async function getFlushoutStats() {
  const [flushed, pending, active] = await Promise.all([
    prisma.enrollment.count({ where: { status: "FLUSHED" } }),
    prisma.enrollment.count({
      where: { status: "ACTIVE", flushoutAt: { lte: new Date() } },
    }),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
  ]);

  return { flushed, pendingFlushout: pending, active };
}
