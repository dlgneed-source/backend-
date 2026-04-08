import type { Plan } from "@prisma/client";
import config from "../config";
import { roundMoney, sumMoney } from "./money";

export interface PlanEconomicsSnapshotPlan {
  planId: number;
  name: string;
  fees: {
    joiningFee: number;
    slotFee: number;
    teamSize: number;
    totalCollection: number;
  };
  distributions: {
    directUpline: number;
    levelCommission: number;
    systemFee: number;
    pools: {
      leader: number;
      reward: number;
      sponsor: number;
    };
    memberProfit: number;
  };
  flushout: {
    days: number;
    payoutTotal: number;
  };
  validations: {
    levelCommissionFromChain: number;
    levelCommissionMatches: boolean;
    payoutComponentsTotal: number;
    totalCollectionMatches: boolean;
  };
}

export function buildPlanEconomicsSnapshot(plans: Plan[]) {
  const levelChain = config.COMMISSION_LEVELS.map((item) => ({
    level: item.level,
    percentage: item.percentage,
  }));

  const chainPercentageTotal = sumMoney(levelChain.map((item) => item.percentage));

  const normalizedPlans: PlanEconomicsSnapshotPlan[] = plans
    .map((plan) => {
      const levelCommissionFromChain = roundMoney((plan.joiningFee * chainPercentageTotal) / 100);
      const payoutComponentsTotal = sumMoney([
        plan.uplineCommission,
        plan.systemFee,
        plan.levelCommission,
        plan.memberProfit,
        plan.leaderPool,
        plan.rewardPool,
        plan.sponsorPool,
      ]);

      return {
        planId: plan.id,
        name: plan.name,
        fees: {
          joiningFee: roundMoney(plan.joiningFee),
          slotFee: roundMoney(plan.slotFee),
          teamSize: plan.teamSize,
          totalCollection: roundMoney(plan.totalCollection),
        },
        distributions: {
          directUpline: roundMoney(plan.uplineCommission),
          levelCommission: roundMoney(plan.levelCommission),
          systemFee: roundMoney(plan.systemFee),
          pools: {
            leader: roundMoney(plan.leaderPool),
            reward: roundMoney(plan.rewardPool),
            sponsor: roundMoney(plan.sponsorPool),
          },
          memberProfit: roundMoney(plan.memberProfit),
        },
        flushout: {
          days: plan.flushoutDays,
          payoutTotal: sumMoney([plan.memberProfit, plan.leaderPool, plan.rewardPool, plan.sponsorPool]),
        },
        validations: {
          levelCommissionFromChain,
          levelCommissionMatches: roundMoney(plan.levelCommission) === levelCommissionFromChain,
          payoutComponentsTotal,
          totalCollectionMatches: roundMoney(plan.totalCollection) === payoutComponentsTotal,
        },
      };
    })
    .sort((a, b) => a.planId - b.planId);

  return {
    generatedAt: new Date().toISOString(),
    backendSourceOfTruth: true,
    levelCommissionChain: {
      directCommissionLabel: "Direct Upline",
      levels: levelChain,
      totalPercentage: chainPercentageTotal,
      base: "joiningFee",
    },
    flushoutRules: {
      mode: "plan.flushoutDays",
      payoutFormula: "memberProfit + leaderPool + rewardPool + sponsorPool",
    },
    smartContract: {
      contractAddress: config.CONTRACT_ADDRESS || "TBD",
      chainId: config.CHAIN_ID || null,
      placeholder: !config.CONTRACT_ADDRESS,
      note: !config.CONTRACT_ADDRESS ? "Smart contract integration placeholder (to be configured later)." : undefined,
    },
    plans: normalizedPlans,
  };
}
