import config from "../config";
import { roundMoney, sumMoney } from "./money";

export interface PlanMathInput {
  planId: number;
  joiningFee: number;
  uplineCommission?: number;
  systemFee?: number;
  levelCommission?: number;
  totalCollection?: number;
  teamSize?: number;
  memberProfit: number;
  leaderPool: number;
  rewardPool: number;
  sponsorPool: number;
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

export function calculateCommissionTotal(joiningFee: number): number {
  return sumMoney(
    config.COMMISSION_LEVELS.map((level) => roundMoney((joiningFee * level.percentage) / 100))
  );
}

export function calculateEnrollmentPayoutTotal(
  plan: Pick<PlanMathInput, "uplineCommission" | "systemFee" | "levelCommission" | "memberProfit" | "leaderPool" | "rewardPool" | "sponsorPool">
): number {
  return sumMoney([
    plan.uplineCommission || 0,
    plan.systemFee || 0,
    plan.levelCommission || 0,
    plan.memberProfit,
    plan.leaderPool,
    plan.rewardPool,
    plan.sponsorPool,
  ]);
}

export function calculatePlanTotals(plan: PlanMathInput): PlanMathTotals {
  const requestedEnrollmentCount = plan.enrollmentCount ?? 1;
  if (!Number.isFinite(requestedEnrollmentCount) || requestedEnrollmentCount < 0) {
    throw new Error("enrollmentCount must be a finite non-negative number");
  }
  if (!Number.isInteger(requestedEnrollmentCount)) {
    throw new Error("enrollmentCount must be an integer");
  }
  const enrollmentCount = requestedEnrollmentCount;
  const commissionTotalPerEnrollment = calculateCommissionTotal(plan.joiningFee);
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
