import { plansApi, poolsApi } from '@/lib/api';

type PoolStatsResponse = Awaited<ReturnType<typeof poolsApi.getStats>>;
type PlanMembersResponse = Awaited<ReturnType<typeof plansApi.getMembers>>;

export type DashboardPoolMetrics = {
  leaderPool: number;
  rewardPool: number;
  sponsorPool: number;
  totalMembers: number;
  leaderPlans: number;
  rewardPlans: number;
  sponsorPlans: number;
  hasData: boolean;
};

const toSafeNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export function aggregateDashboardPoolMetrics(
  poolStats: PoolStatsResponse['stats'] | null | undefined,
  planMembers: PlanMembersResponse['members'] | null | undefined
): DashboardPoolMetrics {
  const plans = Array.isArray(poolStats?.plans) ? poolStats!.plans : [];

  let leaderPool = 0;
  let rewardPool = 0;
  let sponsorPool = 0;
  let leaderPlans = 0;
  let rewardPlans = 0;
  let sponsorPlans = 0;

  plans.forEach((plan) => {
    const leader = toSafeNumber(plan?.pools?.leaderPool);
    const reward = toSafeNumber(plan?.pools?.rewardPool);
    const sponsor = toSafeNumber(plan?.pools?.sponsorPool);

    leaderPool += leader;
    rewardPool += reward;
    sponsorPool += sponsor;

    if (leader > 0) leaderPlans += 1;
    if (reward > 0) rewardPlans += 1;
    if (sponsor > 0) sponsorPlans += 1;
  });

  const totalMembers = toSafeNumber(planMembers?.totalEnrollments);
  const hasData = plans.length > 0 || totalMembers > 0 || leaderPool > 0 || rewardPool > 0 || sponsorPool > 0;

  return {
    leaderPool,
    rewardPool,
    sponsorPool,
    totalMembers,
    leaderPlans,
    rewardPlans,
    sponsorPlans,
    hasData,
  };
}

export async function fetchDashboardPoolMetrics(): Promise<DashboardPoolMetrics> {
  const [poolStatsResponse, planMembersResponse] = await Promise.all([poolsApi.getStats(), plansApi.getMembers()]);
  return aggregateDashboardPoolMetrics(poolStatsResponse?.stats, planMembersResponse?.members);
}
