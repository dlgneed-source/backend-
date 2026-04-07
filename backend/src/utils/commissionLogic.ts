/**
 * Commission Logic
 * Multi-level commission distribution: 4%, 2%, 1%, 1%, 1%, 0.5%, 0.5%
 * Applied on the slotFee (entry fee paid by new enrollee)
 */

import { PrismaClient, UserStatus } from "@prisma/client";
import config from "../config";
import { roundMoney } from "./money";

const prisma = new PrismaClient();

// Commission percentages per upline level
export const COMMISSION_LEVELS = config.COMMISSION_LEVELS;

export interface CommissionBreakdown {
  level: number;
  percentage: number;
  amount: number;
  recipientId: string | null;
}

/**
 * Calculate commission amounts for a given slot fee
 */
export function calculateCommissions(slotFee: number): Array<{ level: number; percentage: number; amount: number }> {
  return COMMISSION_LEVELS.map(({ level, percentage }) => ({
    level,
    percentage,
    amount: roundMoney((slotFee * percentage) / 100),
  }));
}

export function resolveCommissionRecipients(
  uplineChain: string[],
  statusByUserId: Map<string, UserStatus>
): Array<string | null> {
  return COMMISSION_LEVELS.map((_, index) => {
    const candidateId = uplineChain[index];
    if (!candidateId) return null;
    return statusByUserId.get(candidateId) === "ACTIVE" ? candidateId : null;
  });
}

/**
 * Get upline chain for a user (up to 7 levels)
 */
export async function getUplineChain(userId: string, maxLevels = 7): Promise<string[]> {
  const chain: string[] = [];
  let currentId: string | null = userId;

  for (let i = 0; i < maxLevels; i++) {
    const user: { referredById: string | null } | null = await prisma.user.findUnique({
      where: { id: currentId! },
      select: { referredById: true },
    });

    if (!user || !user.referredById) break;
    chain.push(user.referredById);
    currentId = user.referredById;
  }

  return chain;
}

/**
 * Distribute commissions to upline chain when a new enrollment happens
 * @param enrollmentId - The new enrollment ID
 * @param enrolleeId - The new user's ID
 * @param slotFee - The slot fee paid
 * @param planId - The plan ID
 */
export async function distributeCommissions(
  enrollmentId: string,
  enrolleeId: string,
  slotFee: number,
  planId: number
): Promise<CommissionBreakdown[]> {
  const uplineChain = await getUplineChain(enrolleeId, COMMISSION_LEVELS.length);
  const commissions = calculateCommissions(slotFee);
  const uplineCandidates = Array.from(new Set(uplineChain.slice(0, commissions.length)));
  const uplineUsers = uplineCandidates.length
    ? await prisma.user.findMany({
        where: { id: { in: uplineCandidates } },
        select: { id: true, status: true },
      })
    : [];
  const statusByUserId = new Map<string, UserStatus>(uplineUsers.map((user) => [user.id, user.status]));
  const resolvedRecipients = resolveCommissionRecipients(uplineChain, statusByUserId);
  const results: CommissionBreakdown[] = [];

  for (let i = 0; i < commissions.length; i++) {
    const { level, percentage, amount } = commissions[i];
    const recipientId = resolvedRecipients[i];

    if (recipientId && amount > 0) {
      // Create commission record
      await prisma.commission.create({
        data: {
          fromUserId: enrolleeId,
          toUserId: recipientId,
          enrollmentId,
          level,
          percentage,
          amount,
          planId,
        },
      });

      // Create transaction for recipient
      await prisma.transaction.create({
        data: {
          userId: recipientId,
          type: "COMMISSION",
          amount,
          description: `Level ${level} commission (${percentage}%) from enrollment`,
          status: "COMPLETED",
          metadata: { enrollmentId, planId, level, percentage },
        },
      });
    }

    results.push({ level, percentage, amount, recipientId });
  }

  return results;
}

/**
 * Calculate total commission distributed from a slot fee
 */
export function totalCommissionPercentage(): number {
  return COMMISSION_LEVELS.reduce((sum, { percentage }) => sum + percentage, 0);
}

/**
 * Get commission summary for a user
 */
export async function getUserCommissionSummary(userId: string) {
  const [total, byLevel] = await Promise.all([
    prisma.commission.aggregate({
      where: { toUserId: userId },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.commission.groupBy({
      by: ["level"],
      where: { toUserId: userId },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    totalEarned: total._sum.amount || 0,
    totalTransactions: total._count,
    byLevel: byLevel.map((b) => ({
      level: b.level,
      amount: b._sum.amount || 0,
      count: b._count,
    })),
  };
}
