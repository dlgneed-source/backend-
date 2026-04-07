/**
 * Incentive Logic
 * Two types of incentives:
 * 1. Club Incentives (team-based): Bronze/Silver/Gold/Platinum based on total enrolled IDs across plans
 * 2. Individual Incentives: Per-plan target referral count rewards
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Club incentive tiers (team-based, cumulative across all plans)
export const CLUB_INCENTIVES = [
  { id: 1, plan1Ids: 25, plan2Ids: 18, plan3Ids: 14, plan4Ids: 4, plan5Ids: 2, plan6Ids: 1, reward: 30, rank: "BRONZE" as const },
  { id: 2, plan1Ids: 50, plan2Ids: 36, plan3Ids: 28, plan4Ids: 8, plan5Ids: 4, plan6Ids: 2, reward: 70, rank: "SILVER" as const },
  { id: 3, plan1Ids: 75, plan2Ids: 54, plan3Ids: 42, plan4Ids: 12, plan5Ids: 6, plan6Ids: 3, reward: 110, rank: "GOLD" as const },
  { id: 4, plan1Ids: 100, plan2Ids: 72, plan3Ids: 56, plan4Ids: 16, plan5Ids: 8, plan6Ids: 4, reward: 200, rank: "PLATINUM" as const },
];

// Individual incentive targets per plan
export const INDIVIDUAL_INCENTIVES = [
  { planId: 1, target: 100, reward: 20 },
  { planId: 2, target: 75, reward: 25 },
  { planId: 3, target: 50, reward: 28 },
  { planId: 4, target: 25, reward: 25 },
  { planId: 5, target: 15, reward: 30 },
  { planId: 6, target: 10, reward: 30 },
];

export type IncentiveRank = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export interface TeamReferralCounts {
  plan1: number;
  plan2: number;
  plan3: number;
  plan4: number;
  plan5: number;
  plan6: number;
}

/**
 * Count team enrollments per plan for a user (direct + indirect)
 */
export async function getTeamEnrollmentCounts(userId: string): Promise<TeamReferralCounts> {
  const counts: TeamReferralCounts = { plan1: 0, plan2: 0, plan3: 0, plan4: 0, plan5: 0, plan6: 0 };

  // Get all team members (BFS traversal)
  const teamIds = await getAllTeamMemberIds(userId);

  if (teamIds.length === 0) return counts;

  // Count enrollments per plan
  const enrollments = await prisma.enrollment.groupBy({
    by: ["planId"],
    where: {
      userId: { in: teamIds },
      status: { in: ["ACTIVE", "MATURED", "FLUSHED"] },
    },
    _count: true,
  });

  for (const e of enrollments) {
    const key = `plan${e.planId}` as keyof TeamReferralCounts;
    if (key in counts) {
      counts[key] = e._count;
    }
  }

  return counts;
}

/**
 * Get all team member IDs for a user (entire downline tree)
 */
export async function getAllTeamMemberIds(userId: string, maxDepth = 20): Promise<string[]> {
  const visited = new Set<string>();
  const queue: string[] = [userId];
  const result: string[] = [];

  while (queue.length > 0 && result.length < 10000) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const referrals = await prisma.user.findMany({
      where: { referredById: currentId },
      select: { id: true },
      take: 1000,
    });

    for (const ref of referrals) {
      if (!visited.has(ref.id)) {
        result.push(ref.id);
        queue.push(ref.id);
      }
    }
  }

  return result;
}

/**
 * Check which club incentive tier a user qualifies for
 */
export function checkClubIncentiveTier(counts: TeamReferralCounts): typeof CLUB_INCENTIVES[number] | null {
  // Check from highest to lowest tier
  for (let i = CLUB_INCENTIVES.length - 1; i >= 0; i--) {
    const tier = CLUB_INCENTIVES[i];
    if (
      counts.plan1 >= tier.plan1Ids &&
      counts.plan2 >= tier.plan2Ids &&
      counts.plan3 >= tier.plan3Ids &&
      counts.plan4 >= tier.plan4Ids &&
      counts.plan5 >= tier.plan5Ids &&
      counts.plan6 >= tier.plan6Ids
    ) {
      return tier;
    }
  }
  return null;
}

/**
 * Check individual plan incentive eligibility
 */
export async function checkIndividualIncentive(
  userId: string,
  planId: number
): Promise<{ eligible: boolean; reward: number; directReferrals: number; target: number }> {
  const incentive = INDIVIDUAL_INCENTIVES.find((i) => i.planId === planId);
  if (!incentive) return { eligible: false, reward: 0, directReferrals: 0, target: 0 };

  // Count direct referrals enrolled in this plan
  const directReferrals = await prisma.enrollment.count({
    where: {
      planId,
      user: { referredById: userId },
      status: { in: ["ACTIVE", "MATURED", "FLUSHED"] },
    },
  });

  const eligible = directReferrals >= incentive.target;

  // Check if already claimed
  if (eligible) {
    const existingClaim = await prisma.incentiveClaim.findFirst({
      where: {
        userId,
        rank: "BRONZE", // Individual incentives stored as a custom marker
        metadata: { path: ["planId"], equals: planId },
        status: { in: ["PENDING", "APPROVED", "PAID"] },
      },
    });

    if (existingClaim) {
      return { eligible: false, reward: incentive.reward, directReferrals, target: incentive.target };
    }
  }

  return { eligible, reward: incentive.reward, directReferrals, target: incentive.target };
}

/**
 * Claim a club incentive
 */
export async function claimClubIncentive(
  userId: string,
  rank: IncentiveRank
): Promise<{ success: boolean; message: string; claimId?: string }> {
  const tier = CLUB_INCENTIVES.find((t) => t.rank === rank);
  if (!tier) return { success: false, message: "Invalid incentive rank" };

  // Check if already claimed
  const existingClaim = await prisma.incentiveClaim.findFirst({
    where: { userId, rank, status: { in: ["PENDING", "APPROVED", "PAID"] } },
  });

  if (existingClaim) {
    return { success: false, message: `${rank} incentive already claimed` };
  }

  // Verify eligibility
  const counts = await getTeamEnrollmentCounts(userId);
  const eligible = checkClubIncentiveTier(counts);

  if (!eligible || eligible.rank !== rank) {
    return { success: false, message: `Not eligible for ${rank} incentive` };
  }

  // Create claim
  const claim = await prisma.incentiveClaim.create({
    data: {
      userId,
      rank,
      reward: tier.reward,
      status: "PENDING",
      metadata: { counts: counts as any, tier: tier as any },
    },
  });

  return { success: true, message: "Incentive claim submitted for review", claimId: claim.id };
}

/**
 * Get incentive progress for a user
 */
export async function getIncentiveProgress(userId: string) {
  const counts = await getTeamEnrollmentCounts(userId);
  const currentTier = checkClubIncentiveTier(counts);

  // Calculate progress toward next tier
  const nextTierIndex = currentTier
    ? CLUB_INCENTIVES.findIndex((t) => t.rank === currentTier.rank) + 1
    : 0;

  const nextTier = nextTierIndex < CLUB_INCENTIVES.length ? CLUB_INCENTIVES[nextTierIndex] : null;

  const claims = await prisma.incentiveClaim.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return {
    teamCounts: counts,
    currentTier,
    nextTier,
    claims,
  };
}
