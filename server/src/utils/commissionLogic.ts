// ============================================================================
// COMMISSION LOGIC - Level Commission Distribution
// ============================================================================
// Commission percentages applied to the joining fee base
// ============================================================================

import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { logger } from './logger';

const LEVEL_PERCENTAGES = [0.04, 0.02, 0.01, 0.01, 0.01, 0.005, 0.005] as const;

type Tx = Prisma.TransactionClient;

export interface CommissionBreakdown {
  level: number;
  percentage: number;
  amount: string;
}

export const getCommissionBreakdown = (joiningFee: Decimal | number | string): CommissionBreakdown[] => {
  const base = new Decimal(joiningFee.toString());
  return LEVEL_PERCENTAGES.map((percentage, idx) => ({
    level: idx + 1,
    percentage,
    amount: base.mul(percentage).toFixed(8),
  }));
};

export const getTotalCommission = (joiningFee: Decimal | number | string): string => {
  return new Decimal(joiningFee.toString()).mul(0.10).toFixed(8);
};

export const distributeLevelCommission = async (
  tx: Tx,
  fromUserId: string,
  planId: number,
  joiningFee: Decimal | number | string
): Promise<void> => {
  const base = new Decimal(joiningFee.toString());

  // Fetch up to 7 uplines
  let currentUserId: string | null = fromUserId;
  const uplines: Array<{ id: string }> = [];

  for (let depth = 0; depth < 7; depth += 1) {
    const currentUser = await tx.user.findUnique({
      where: { id: currentUserId },
      select: { referrerId: true },
    });

    if (!currentUser?.referrerId) break;

    const referrer = await tx.user.findUnique({
      where: { id: currentUser.referrerId },
      select: { id: true, status: true },
    });

    if (!referrer || referrer.status !== 'ACTIVE') break;

    uplines.push({ id: referrer.id });
    currentUserId = referrer.id;
  }

  let distributed = new Decimal(0);

  for (let i = 0; i < uplines.length; i += 1) {
    const percentage = LEVEL_PERCENTAGES[i];
    const amount = base.mul(percentage);
    distributed = distributed.plus(amount);

    await tx.user.update({
      where: { id: uplines[i].id },
      data: {
        balance: { increment: amount },
        totalEarned: { increment: amount },
      },
    });

    await tx.commission.create({
      data: {
        fromUserId,
        toUserId: uplines[i].id,
        amount,
        level: i + 1,
        planId,
      },
    });

    await tx.transaction.create({
      data: {
        userId: uplines[i].id,
        type: 'COMMISSION',
        amount,
        description: `Level ${i + 1} commission from Plan ${planId}`,
      },
    });
  }

  if (distributed.lt(base.mul(0.10))) {
    logger.warn('Commission distribution incomplete due to missing uplines', {
      fromUserId,
      planId,
      base: base.toString(),
      distributed: distributed.toString(),
    });
  }
};

export const previewLevelCommission = (joiningFee: Decimal | number | string) => {
  const base = new Decimal(joiningFee.toString());
  return {
    level1: base.mul(0.04).toFixed(8),
    level2: base.mul(0.02).toFixed(8),
    level3: base.mul(0.01).toFixed(8),
    level4: base.mul(0.01).toFixed(8),
    level5: base.mul(0.01).toFixed(8),
    level6: base.mul(0.005).toFixed(8),
    level7: base.mul(0.005).toFixed(8),
    total: base.mul(0.10).toFixed(8),
  };
};

// Test helper
export const verifyCommissionDistribution = (levelCommission: number) => {
  return previewLevelCommission(levelCommission);
};
