// ============================================================================
// FLUSHOUT LOGIC - Process Flushout for Enrollments
// ============================================================================
// Idempotent - cannot process the same enrollment twice
// Handles both TEAM_FILLED and TIME_EXPIRED flushout types
// ============================================================================

import { prisma } from './prisma';
import { logger } from './logger';
import { createAuditLog } from './audit';

export const processFlushout = async (
  enrollmentId: string,
  flushoutType: 'TEAM_FILLED' | 'TIME_EXPIRED'
): Promise<void> => {
  const startTime = Date.now();

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { plan: true, user: true },
    });

    if (!enrollment) {
      throw new Error(`Enrollment ${enrollmentId} not found`);
    }

    // Idempotency check - only process ACTIVE enrollments
    if (enrollment.status !== 'ACTIVE') {
      logger.warn('Enrollment already processed, skipping', {
        enrollmentId,
        status: enrollment.status,
        profitPaid: enrollment.profitPaid,
      });
      return;
    }

    // Double-check profit hasn't been paid
    if (enrollment.profitPaid) {
      logger.warn('Profit already paid for enrollment, skipping', {
        enrollmentId,
        profitAmount: enrollment.profitAmount?.toString(),
      });
      return;
    }

    const { plan, user } = enrollment;

    // Execute flushout in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Pay member profit to user
      await tx.user.update({
        where: { id: user.id },
        data: {
          balance: { increment: plan.memberProfit },
          totalEarned: { increment: plan.memberProfit },
        },
      });

      // 2. Add to Leader Pool
      if (Number(plan.leaderPool) > 0) {
        await tx.pool.upsert({
          where: { planId_type: { planId: plan.id, type: 'LEADER' } },
          update: { balance: { increment: plan.leaderPool } },
          create: {
            name: `Plan ${plan.id} Leader Pool`,
            planId: plan.id,
            type: 'LEADER',
            balance: plan.leaderPool,
          },
        });
      }

      // 3. Add to Reward Pool
      if (Number(plan.rewardPool) > 0) {
        await tx.pool.upsert({
          where: { planId_type: { planId: plan.id, type: 'REWARD' } },
          update: { balance: { increment: plan.rewardPool } },
          create: {
            name: `Plan ${plan.id} Reward Pool`,
            planId: plan.id,
            type: 'REWARD',
            balance: plan.rewardPool,
          },
        });
      }

      // 4. Add to Sponsor Pool
      if (Number(plan.sponsorPool) > 0) {
        await tx.pool.upsert({
          where: { planId_type: { planId: plan.id, type: 'SPONSOR' } },
          update: { balance: { increment: plan.sponsorPool } },
          create: {
            name: `Plan ${plan.id} Sponsor Pool`,
            planId: plan.id,
            type: 'SPONSOR',
            balance: plan.sponsorPool,
          },
        });
      }

      // 5. Update enrollment status
      await tx.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: flushoutType === 'TEAM_FILLED' ? 'MATURED' : 'FLUSHED',
          maturedAt: new Date(),
          profitPaid: true,
          profitAmount: plan.memberProfit,
        },
      });

      // 6. Create transaction record
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: 'PROFIT',
          amount: plan.memberProfit,
          description: `Plan ${plan.id} ${flushoutType === 'TEAM_FILLED' ? 'matured' : 'flushed'} - profit credited`,
          referenceId: enrollmentId,
        },
      });
    });

    logger.info('Flushout processed successfully', {
      enrollmentId,
      userId: user.id,
      planId: plan.id,
      memberProfit: plan.memberProfit.toString(),
      leaderPool: plan.leaderPool.toString(),
      rewardPool: plan.rewardPool.toString(),
      sponsorPool: plan.sponsorPool.toString(),
      flushoutType,
      duration: Date.now() - startTime,
    });

    await createAuditLog({
      action: 'FLUSHOUT_PROCESSED',
      entityType: 'ENROLLMENT',
      entityId: enrollmentId,
      userId: user.id,
      newValue: {
        planId: plan.id,
        memberProfit: plan.memberProfit.toString(),
        leaderPool: plan.leaderPool.toString(),
        rewardPool: plan.rewardPool.toString(),
        sponsorPool: plan.sponsorPool.toString(),
        flushoutType,
      },
    });
  } catch (error) {
    logger.error('Failed to process flushout', { error, enrollmentId, flushoutType });
    throw error;
  }
};

export const checkTeamFilled = async (enrollmentId: string): Promise<boolean> => {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { plan: true },
  });

  if (!enrollment) return false;

  const referralCount = await prisma.enrollmentReferral.count({
    where: { enrollmentId },
  });

  return referralCount >= enrollment.plan.teamSize;
};

export const getFlushoutStats = async (planId: number) => {
  const stats = await prisma.enrollment.groupBy({
    by: ['status'],
    where: { planId },
    _count: { status: true },
  });

  const profitSum = await prisma.enrollment.aggregate({
    where: { planId, profitPaid: true },
    _sum: { profitAmount: true },
  });

  return {
    totalEnrollments: stats.reduce((acc, s) => acc + s._count.status, 0),
    matured: stats.find((s) => s.status === 'MATURED')?._count.status || 0,
    flushed: stats.find((s) => s.status === 'FLUSHED')?._count.status || 0,
    active: stats.find((s) => s.status === 'ACTIVE')?._count.status || 0,
    totalProfitDistributed: profitSum._sum.profitAmount?.toNumber() || 0,
  };
};
