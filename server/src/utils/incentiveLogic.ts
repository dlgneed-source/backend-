// ============================================================================
// INCENTIVE LOGIC - Club and Individual Incentives
// ============================================================================
// Pro-rata: 25%, 50%, 75%, 100% tiers
// ============================================================================

import { prisma } from './prisma';
import { logger } from './logger';
import { createAuditLog } from './audit';

// Club Incentive Tiers (from income model)
const CLUB_INCENTIVES = [
  { tier: 1, plan1: 25, plan2: 18, plan3: 14, plan4: 4, plan5: 2, plan6: 1, reward: 30, rank: 'Bronze' },
  { tier: 2, plan1: 50, plan2: 36, plan3: 28, plan4: 8, plan5: 4, plan6: 2, reward: 70, rank: 'Silver' },
  { tier: 3, plan1: 75, plan2: 54, plan3: 42, plan4: 12, plan5: 6, plan6: 3, reward: 110, rank: 'Gold' },
  { tier: 4, plan1: 100, plan2: 72, plan3: 56, plan4: 16, plan5: 8, plan6: 4, reward: 200, rank: 'Platinum' },
];

// Individual Incentive Targets (from income model)
const INDIVIDUAL_INCENTIVES = [
  { planId: 1, target: 100, reward: 20 },
  { planId: 2, target: 75, reward: 25 },
  { planId: 3, target: 50, reward: 28 },
  { planId: 4, target: 25, reward: 25 },
  { planId: 5, target: 15, reward: 30 },
  { planId: 6, target: 10, reward: 30 },
];

// Pro-rata tiers
const PRO_RATA_TIERS = [
  { min: 0.75, multiplier: 0.75 },
  { min: 0.50, multiplier: 0.50 },
  { min: 0.25, multiplier: 0.25 },
];

export const calculateClubIncentive = async (userId: string): Promise<{
  eligible: boolean;
  tier?: number;
  reward?: number;
  rank?: string;
  proRata?: number;
  completionRate?: number;
}> => {
  try {
    const referrals = await prisma.user.findMany({
      where: { referrerId: userId },
      include: { enrollments: true },
    });

    const planCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (const referral of referrals) {
      for (const enrollment of referral.enrollments) {
        if (enrollment.status === 'ACTIVE' || enrollment.status === 'MATURED') {
          planCounts[enrollment.planId] = (planCounts[enrollment.planId] || 0) + 1;
        }
      }
    }

    // Check each tier (highest first)
    for (let i = CLUB_INCENTIVES.length - 1; i >= 0; i--) {
      const tier = CLUB_INCENTIVES[i];
      const planTargets = [tier.plan1, tier.plan2, tier.plan3, tier.plan4, tier.plan5, tier.plan6];
      const planAchieved = [planCounts[1], planCounts[2], planCounts[3], planCounts[4], planCounts[5], planCounts[6]];

      const completionRates = planTargets.map((target, idx) =>
        target > 0 ? Math.min(planAchieved[idx] / target, 1) : 1
      );

      const avgCompletion = completionRates.reduce((a, b) => a + b, 0) / completionRates.length;

      if (avgCompletion >= 1.0) {
        return { eligible: true, tier: tier.tier, reward: tier.reward, rank: tier.rank, proRata: 1.0, completionRate: avgCompletion };
      }

      // Pro-rata calculation
      for (const proRataTier of PRO_RATA_TIERS) {
        if (avgCompletion >= proRataTier.min) {
          const proRataReward = Math.floor(tier.reward * proRataTier.multiplier);
          return { eligible: true, tier: tier.tier, reward: proRataReward, rank: tier.rank, proRata: proRataTier.multiplier, completionRate: avgCompletion };
        }
      }
    }

    return { eligible: false, completionRate: 0 };
  } catch (error) {
    logger.error('Failed to calculate club incentive', { error, userId });
    return { eligible: false, completionRate: 0 };
  }
};

export const calculateIndividualIncentive = async (
  userId: string,
  planId: number
): Promise<{
  eligible: boolean;
  count: number;
  target: number;
  reward?: number;
  proRata?: number;
  completionRate?: number;
}> => {
  try {
    const incentiveConfig = INDIVIDUAL_INCENTIVES.find((i) => i.planId === planId);
    if (!incentiveConfig) {
      return { eligible: false, count: 0, target: 0 };
    }

    const count = await prisma.enrollment.count({
      where: {
        planId,
        user: { referrerId: userId },
        status: { in: ['ACTIVE', 'MATURED'] },
      },
    });

    const completionRate = count / incentiveConfig.target;

    if (count >= incentiveConfig.target) {
      return { eligible: true, count, target: incentiveConfig.target, reward: incentiveConfig.reward, proRata: 1.0, completionRate };
    }

    for (const proRataTier of PRO_RATA_TIERS) {
      if (completionRate >= proRataTier.min) {
        const proRataReward = Math.floor(incentiveConfig.reward * proRataTier.multiplier);
        return { eligible: true, count, target: incentiveConfig.target, reward: proRataReward, proRata: proRataTier.multiplier, completionRate };
      }
    }

    return { eligible: false, count, target: incentiveConfig.target, completionRate };
  } catch (error) {
    logger.error('Failed to calculate individual incentive', { error, userId, planId });
    return { eligible: false, count: 0, target: 0 };
  }
};

export const processMonthlyIncentives = async (): Promise<{
  clubIncentives: number;
  individualIncentives: number;
  totalAmount: number;
}> => {
  const startTime = Date.now();
  let clubCount = 0;
  let individualCount = 0;
  let totalAmount = 0;

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const users = await prisma.user.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    for (const user of users) {
      // Club incentive
      const clubIncentive = await calculateClubIncentive(user.id);
      if (clubIncentive.eligible && clubIncentive.reward && clubIncentive.reward > 0) {
        const existingClaim = await prisma.incentiveClaim.findFirst({
          where: {
            userId: user.id,
            type: 'CLUB',
            tier: clubIncentive.tier,
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        });

        if (!existingClaim) {
          await prisma.$transaction(async (tx) => {
            await tx.incentiveClaim.create({
              data: {
                userId: user.id,
                type: 'CLUB',
                tier: clubIncentive.tier!,
                amount: clubIncentive.reward!,
                proRata: clubIncentive.proRata,
                status: 'APPROVED',
                claimedAt: new Date(),
              },
            });

            await tx.user.update({
              where: { id: user.id },
              data: {
                balance: { increment: clubIncentive.reward! },
                totalEarned: { increment: clubIncentive.reward! },
              },
            });

            await tx.transaction.create({
              data: {
                userId: user.id,
                type: 'INCENTIVE',
                amount: clubIncentive.reward!,
                description: `Club incentive - ${clubIncentive.rank} tier${clubIncentive.proRata && clubIncentive.proRata < 1 ? ` (${Math.round(clubIncentive.proRata * 100)}%)` : ''}`,
              },
            });
          });

          clubCount++;
          totalAmount += clubIncentive.reward;
        }
      }

      // Individual incentives for each plan
      for (const planConfig of INDIVIDUAL_INCENTIVES) {
        const individualIncentive = await calculateIndividualIncentive(user.id, planConfig.planId);

        if (individualIncentive.eligible && individualIncentive.reward && individualIncentive.reward > 0) {
          const existingClaim = await prisma.incentiveClaim.findFirst({
            where: {
              userId: user.id,
              type: 'INDIVIDUAL',
              planId: planConfig.planId,
              createdAt: { gte: monthStart, lte: monthEnd },
            },
          });

          if (!existingClaim) {
            await prisma.$transaction(async (tx) => {
              await tx.incentiveClaim.create({
                data: {
                  userId: user.id,
                  type: 'INDIVIDUAL',
                  planId: planConfig.planId,
                  tier: planConfig.planId,
                  amount: individualIncentive.reward!,
                  proRata: individualIncentive.proRata,
                  status: 'APPROVED',
                  claimedAt: new Date(),
                },
              });

              await tx.user.update({
                where: { id: user.id },
                data: {
                  balance: { increment: individualIncentive.reward! },
                  totalEarned: { increment: individualIncentive.reward! },
                },
              });

              await tx.transaction.create({
                data: {
                  userId: user.id,
                  type: 'INCENTIVE',
                  amount: individualIncentive.reward!,
                  description: `Individual incentive - Plan ${planConfig.planId}${individualIncentive.proRata && individualIncentive.proRata < 1 ? ` (${Math.round(individualIncentive.proRata * 100)}%)` : ''}`,
                },
              });
            });

            individualCount++;
            totalAmount += individualIncentive.reward;
          }
        }
      }
    }

    logger.info('Monthly incentives processed', { clubIncentives: clubCount, individualIncentives: individualCount, totalAmount, duration: Date.now() - startTime });

    await createAuditLog({
      action: 'MONTHLY_INCENTIVES_PROCESSED',
      entityType: 'SYSTEM',
      entityId: 'monthly-cron',
      newValue: { clubCount, individualCount, totalAmount },
    });

    return { clubIncentives: clubCount, individualIncentives: individualCount, totalAmount };
  } catch (error) {
    logger.error('Failed to process monthly incentives', { error });
    throw error;
  }
};
