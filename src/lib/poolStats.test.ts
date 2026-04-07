import { describe, expect, it, vi } from 'vitest';
import { aggregateDashboardPoolMetrics, fetchDashboardPoolMetrics } from '@/lib/poolStats';
import { plansApi, poolsApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  poolsApi: { getStats: vi.fn() },
  plansApi: { getMembers: vi.fn() },
}));

describe('poolStats response handling', () => {
  it('maps API responses into dashboard metrics', async () => {
    vi.mocked(poolsApi.getStats).mockResolvedValueOnce({
      success: true,
      stats: {
        plans: [
          { planId: 1, planName: 'P1', pools: { leaderPool: 100, rewardPool: 50, sponsorPool: 0 } },
          { planId: 2, planName: 'P2', pools: { leaderPool: 25, rewardPool: 0, sponsorPool: 10 } },
        ],
        totals: { leaderPool: 125, rewardPool: 50, sponsorPool: 10 },
      },
    });
    vi.mocked(plansApi.getMembers).mockResolvedValueOnce({
      success: true,
      members: {
        plans: [
          { planId: 1, planName: 'P1', enrollments: 4 },
          { planId: 2, planName: 'P2', enrollments: 3 },
        ],
        totalEnrollments: 7,
      },
    });

    const metrics = await fetchDashboardPoolMetrics();
    expect(metrics).toMatchObject({
      leaderPool: 125,
      rewardPool: 50,
      sponsorPool: 10,
      totalMembers: 7,
      leaderPlans: 2,
      rewardPlans: 1,
      sponsorPlans: 1,
      hasData: true,
    });
  });

  it('handles empty payloads', () => {
    const metrics = aggregateDashboardPoolMetrics(
      { plans: [], totals: { leaderPool: 0, rewardPool: 0, sponsorPool: 0 } },
      { plans: [], totalEnrollments: 0 }
    );

    expect(metrics).toEqual({
      leaderPool: 0,
      rewardPool: 0,
      sponsorPool: 0,
      totalMembers: 0,
      leaderPlans: 0,
      rewardPlans: 0,
      sponsorPlans: 0,
      hasData: false,
    });
  });

  it('handles partial/null data as zero', () => {
    const metrics = aggregateDashboardPoolMetrics(
      {
        plans: [
          { planId: 1, planName: 'P1', pools: { leaderPool: null, rewardPool: 20, sponsorPool: undefined } },
          { planId: 2, planName: 'P2', pools: { leaderPool: undefined, rewardPool: null, sponsorPool: 8 } },
        ],
        totals: { leaderPool: null, rewardPool: null, sponsorPool: null },
      },
      {
        plans: [{ planId: 1, planName: 'P1', enrollments: null }],
        totalEnrollments: undefined,
      }
    );

    expect(metrics).toMatchObject({
      leaderPool: 0,
      rewardPool: 20,
      sponsorPool: 8,
      totalMembers: 0,
      leaderPlans: 0,
      rewardPlans: 1,
      sponsorPlans: 1,
      hasData: true,
    });
  });
});
