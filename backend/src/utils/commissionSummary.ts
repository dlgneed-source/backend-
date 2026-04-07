import config from "../config";

const ROUND_SCALE = 1_000_000;
const COMMISSION_CHAIN = config.COMMISSION_LEVELS.map((item) => ({
  storedLevel: item.level,
  displayLevel: item.level + 1,
  label: `Level ${item.level + 1}`,
  percentage: item.percentage,
}));

export interface CommissionLevelSummary {
  key: string;
  label: string;
  percentage: number | null;
  amount: number;
}

interface BuildCommissionSummaryParams {
  uplineAmount?: number | null;
  levelAmounts?: Array<{
    level: number;
    amount?: number | null;
  }> | null;
}

const toScaledInt = (value: number): number => Math.round((value + Number.EPSILON) * ROUND_SCALE);
const fromScaledInt = (value: number): number => value / ROUND_SCALE;

const sanitizeAmount = (value: number | null | undefined): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return value;
};

export function buildCommissionLevelSummary({
  uplineAmount,
  levelAmounts,
}: BuildCommissionSummaryParams): { levels: CommissionLevelSummary[]; totalEarned: number } {
  const levelAmountMap = new Map<number, number>();

  for (const row of levelAmounts ?? []) {
    if (!row || typeof row.level !== "number" || !Number.isInteger(row.level) || row.level < 1) {
      continue;
    }
    const current = levelAmountMap.get(row.level) ?? 0;
    const next = current + sanitizeAmount(row.amount);
    levelAmountMap.set(row.level, next);
  }

  const levels: CommissionLevelSummary[] = [
    {
      key: "DIRECT_UPLINE",
      label: "Direct Upline",
      percentage: null,
      amount: fromScaledInt(toScaledInt(sanitizeAmount(uplineAmount))),
    },
    ...COMMISSION_CHAIN.map((chainLevel) => ({
      key: `LEVEL_${chainLevel.displayLevel}`,
      label: chainLevel.label,
      percentage: chainLevel.percentage,
      amount: fromScaledInt(toScaledInt(sanitizeAmount(levelAmountMap.get(chainLevel.storedLevel)))),
    })),
  ];

  const totalEarned = fromScaledInt(
    levels.reduce((sum, level) => sum + toScaledInt(level.amount), 0),
  );

  return {
    levels,
    totalEarned,
  };
}
