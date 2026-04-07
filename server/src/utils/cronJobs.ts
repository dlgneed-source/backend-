// ============================================================================
// CRON JOBS - Scheduled Tasks
// ============================================================================

import cron from 'node-cron';
import { prisma } from './prisma';
import { logger } from './logger';
import { processFlushout } from './flushoutLogic';
import { processMonthlyIncentives } from './incentiveLogic';
import { createAuditLog } from './audit';

const lastRunTracker = {
  monthlyIncentives: new Date(0),
  expiredFlushouts: new Date(0),
  teamFilledFlushouts: new Date(0),
};

const isLastDayOfMonth = (): boolean => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return tomorrow.getDate() === 1;
};

const processMonthlyIncentivesIfLastDay = async (): Promise<void> => {
  const today = new Date();
  if (!isLastDayOfMonth()) {
    logger.info('Not the last day of month, skipping monthly incentives');
    return;
  }

  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (lastRunTracker.monthlyIncentives >= todayStart) {
    logger.info('Monthly incentives already processed today, skipping');
    return;
  }

  logger.info('Today is the last day of month, running monthly incentive distribution');
  try {
    await processMonthlyIncentives();
    lastRunTracker.monthlyIncentives = new Date();
  } catch (error) {
    logger.error('Failed to process monthly incentives', { error });
  }
};

const processExpiredFlushouts = async (): Promise<void> => {
  const startTime = Date.now();
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (lastRunTracker.expiredFlushouts >= todayStart) {
    logger.info('Expired flushouts already processed today, skipping');
    return;
  }

  try {
    const now = new Date();
    const expiredEnrollments = await prisma.enrollment.findMany({
      where: { status: 'ACTIVE', expiresAt: { lte: now } },
      include: { plan: true, user: true },
    });

    logger.info(`Found ${expiredEnrollments.length} expired enrollments`);

    for (const enrollment of expiredEnrollments) {
      try {
        await processFlushout(enrollment.id, 'TIME_EXPIRED');
      } catch (error) {
        logger.error('Failed to process expired flushout', { error, enrollmentId: enrollment.id });
      }
    }

    logger.info('Expired flushouts processed', { count: expiredEnrollments.length, duration: Date.now() - startTime });

    await createAuditLog({
      action: 'EXPIRED_FLUSHOUTS_PROCESSED',
      entityType: 'SYSTEM',
      entityId: 'cron-daily',
      newValue: { count: expiredEnrollments.length },
    });

    lastRunTracker.expiredFlushouts = new Date();
  } catch (error) {
    logger.error('Failed to process expired flushouts', { error });
  }
};

const processTeamFilledFlushouts = async (): Promise<void> => {
  const startTime = Date.now();

  try {
    const activeEnrollments = await prisma.enrollment.findMany({
      where: { status: 'ACTIVE' },
      include: { plan: true, _count: { select: { referrals: true } } },
    });

    const filledEnrollments = activeEnrollments.filter(
      (e) => e._count.referrals >= e.plan.teamSize
    );

    logger.info(`Found ${filledEnrollments.length} team-filled enrollments`);

    for (const enrollment of filledEnrollments) {
      try {
        await processFlushout(enrollment.id, 'TEAM_FILLED');
      } catch (error) {
        logger.error('Failed to process team-filled flushout', { error, enrollmentId: enrollment.id });
      }
    }

    logger.info('Team-filled flushouts processed', { count: filledEnrollments.length, duration: Date.now() - startTime });

    await createAuditLog({
      action: 'TEAM_FILLED_FLUSHOUTS_PROCESSED',
      entityType: 'SYSTEM',
      entityId: 'cron-hourly',
      newValue: { count: filledEnrollments.length },
    });

    lastRunTracker.teamFilledFlushouts = new Date();
  } catch (error) {
    logger.error('Failed to process team-filled flushouts', { error });
  }
};

const cleanupExpiredGiftCodes = async (): Promise<void> => {
  try {
    const now = new Date();
    const result = await prisma.giftCode.updateMany({
      where: { status: 'ACTIVE', expiresAt: { lt: now } },
      data: { status: 'EXPIRED' },
    });
    logger.info('Expired gift codes cleaned up', { count: result.count });
  } catch (error) {
    logger.error('Failed to cleanup expired gift codes', { error });
  }
};

export const initializeCronJobs = (): void => {
  // Daily midnight: time-based flushouts
  cron.schedule('0 0 * * *', async () => {
    logger.info('Running daily flushout check cron job');
    await processExpiredFlushouts();
  });

  // Hourly: team-filled flushouts
  cron.schedule('0 * * * *', async () => {
    logger.info('Running team-filled flushout check cron job');
    await processTeamFilledFlushouts();
  });

  // Daily: check if last day for monthly incentives
  cron.schedule('0 0 * * *', async () => {
    logger.info('Checking for monthly incentive distribution');
    await processMonthlyIncentivesIfLastDay();
  });

  // Daily 1 AM: cleanup expired gift codes
  cron.schedule('0 1 * * *', async () => {
    logger.info('Running expired gift code cleanup cron job');
    await cleanupExpiredGiftCodes();
  });

  logger.info('All cron jobs initialized');
};
