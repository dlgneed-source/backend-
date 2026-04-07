import { calculateCommissions } from "./commissionLogic";
import { roundMoney, sumMoney } from "./money";

export interface PlanMathInput {
  planId: number;
  memberProfit: number;
  leaderPool: number;
  rewardPool: number;
  sponsorPool: number;
  slotFee: number;
  enrollmentCount?: number;
}

export interface PlanMathTotals {
  planId: number;
  enrollmentCount: number;
  commissionTotal: number;
  flushoutTotal: number;
  poolTotal: number;
}

export function calculatePoolTotal(plan: Pick<PlanMathInput, "leaderPool" | "rewardPool" | "sponsorPool">): number {
  return sumMoney([plan.leaderPool, plan.rewardPool, plan.sponsorPool]);
}

export function calculateFlushoutTotal(plan: Pick<PlanMathInput, "memberProfit" | "leaderPool" | "rewardPool" | "sponsorPool">): number {
  return sumMoney([plan.memberProfit, calculatePoolTotal(plan)]);
}

export function calculateCommissionTotal(slotFee: number): number {
  return sumMoney(calculateCommissions(slotFee).map((commission) => commission.amount));
}

export function calculatePlanTotals(plan: PlanMathInput): PlanMathTotals {
  const enrollmentCount = Math.max(0, Math.trunc(plan.enrollmentCount ?? 1));
  const commissionTotalPerEnrollment = calculateCommissionTotal(plan.slotFee);
  const flushoutTotalPerEnrollment = calculateFlushoutTotal(plan);
  const poolTotalPerEnrollment = calculatePoolTotal(plan);

  return {
    planId: plan.planId,
    enrollmentCount,
    commissionTotal: roundMoney(commissionTotalPerEnrollment * enrollmentCount),
    flushoutTotal: roundMoney(flushoutTotalPerEnrollment * enrollmentCount),
    poolTotal: roundMoney(poolTotalPerEnrollment * enrollmentCount),
  };
}

export function calculateAggregateTotals(plans: PlanMathInput[]): {
  plans: PlanMathTotals[];
  totals: { commissionTotal: number; flushoutTotal: number; poolTotal: number };
} {
  const planTotals = plans.map(calculatePlanTotals);
  return {
    plans: planTotals,
    totals: {
      commissionTotal: sumMoney(planTotals.map((plan) => plan.commissionTotal)),
      flushoutTotal: sumMoney(planTotals.map((plan) => plan.flushoutTotal)),
      poolTotal: sumMoney(planTotals.map((plan) => plan.poolTotal)),
    },
  };
}
