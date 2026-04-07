import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response';
import { ValidationError, NotFoundError } from '../utils/errors';
import { distributeLevelCommission } from '../utils/commissionLogic';

const SYSTEM_TREASURY_KEY = 'SYSTEM_OWNER_TREASURY';

export const getPlans = asyncHandler(async (_req: Request, res: Response) => {
  const plans = await prisma.plan.findMany({ orderBy: { id: 'asc' } });
  successResponse(res, plans, 'Plans fetched successfully');
});

export const getPlanById = asyncHandler(async (req: Request, res: Response) => {
  const planId = Number(req.params.planId);
  if (!Number.isInteger(planId)) throw new ValidationError('Invalid planId');

  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new NotFoundError('Plan not found');

  successResponse(res, plan, 'Plan fetched successfully');
});

export const enrollInPlan = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user!.id;
  const planId = Number(req.body.planId);

  if (!Number.isInteger(planId)) throw new ValidationError('Valid planId is required');

  const result = await prisma.$transaction(async (tx) => {
    const [user, plan] = await Promise.all([
      tx.user.findUnique({ where: { id: userId } }),
      tx.plan.findUnique({ where: { id: planId } }),
    ]);

    if (!user) throw new NotFoundError('User not found');
    if (!plan) throw new NotFoundError('Plan not found');

    const joiningFee = new Decimal(plan.joiningFee.toString());
    const systemFee = new Decimal(plan.systemFee.toString());
    const uplineCommission = new Decimal(plan.uplineCommission.toString());

    if (new Decimal(user.balance.toString()).lt(joiningFee)) {
      throw new ValidationError('Insufficient balance');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + plan.flushoutDays);

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        balance: { decrement: joiningFee },
        totalInvested: { increment: joiningFee },
      },
    });

    const enrollment = await tx.enrollment.create({
      data: { userId, planId, expiresAt },
    });

    await tx.transaction.create({
      data: {
        userId,
        type: 'ENROLLMENT',
        amount: joiningFee,
        description: `Enrollment in Plan ${planId}`,
        referenceId: enrollment.id,
      },
    });

    // Track system fee
    await tx.systemFeeLedger.create({
      data: {
        enrollmentId: enrollment.id,
        planId: plan.id,
        amount: systemFee,
      },
    });

    // Treasury upsert
    const treasury = await tx.treasury.upsert({
      where: { key: SYSTEM_TREASURY_KEY },
      update: {
        balance: { increment: systemFee },
        totalReceived: { increment: systemFee },
      },
      create: {
        key: SYSTEM_TREASURY_KEY,
        name: 'System / Owner Treasury',
        balance: systemFee,
        totalReceived: systemFee,
        totalPaidOut: new Decimal(0),
      },
    });

    await tx.treasuryLedger.create({
      data: {
        treasuryId: treasury.id,
        planId: plan.id,
        enrollmentId: enrollment.id,
        type: 'SYSTEM_FEE',
        amount: systemFee,
        description: `System fee for Plan ${plan.id}`,
        referenceId: enrollment.id,
      },
    });

    // Upline commission
    if (user.referrerId) {
      const referrer = await tx.user.findUnique({ where: { id: user.referrerId } });

      if (referrer && referrer.status === 'ACTIVE') {
        await tx.user.update({
          where: { id: referrer.id },
          data: {
            balance: { increment: uplineCommission },
            totalEarned: { increment: uplineCommission },
          },
        });

        await tx.uplineCommission.create({
          data: {
            enrollmentId: enrollment.id,
            planId: plan.id,
            referrerId: referrer.id,
            amount: uplineCommission,
          },
        });

        await tx.transaction.create({
          data: {
            userId: referrer.id,
            type: 'UPLINE_COMMISSION',
            amount: uplineCommission,
            description: `Direct commission from Plan ${planId}`,
            referenceId: enrollment.id,
          },
        });
      }
    }

    // 7-level commission distribution
    await distributeLevelCommission(tx, userId, planId, joiningFee);

    // Audit log
    await tx.auditLog.create({
      data: {
        action: 'PLAN_ENROLLED',
        entityType: 'ENROLLMENT',
        entityId: enrollment.id,
        userId,
        newValue: JSON.stringify({
          planId,
          joiningFee: joiningFee.toString(),
          systemFee: systemFee.toString(),
          uplineCommission: uplineCommission.toString(),
        }),
      },
    });

    return { updatedUser, enrollment, treasury };
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });

  successResponse(res, {
    enrollment: result.enrollment,
    balance: result.updatedUser.balance,
    treasuryBalance: result.treasury.balance,
  }, 'Successfully enrolled in plan', 201);
});

export const getUserEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user!.id;
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: { plan: true, referrals: true },
    orderBy: { enrolledAt: 'desc' },
  });

  successResponse(res, enrollments, 'Enrollments fetched successfully');
});
