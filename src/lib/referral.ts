type UnknownRecord = Record<string, unknown>;

export function toSafeNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

export function getDirectReferralIncome(
  commissionSummary?: { levels?: unknown } | null,
): number | null {
  const levels = commissionSummary?.levels;
  if (!Array.isArray(levels)) return null;

  const directLevel = levels.find((level) => {
    if (!level || typeof level !== 'object') return false;
    const candidate = level as UnknownRecord;
    const key = typeof candidate.key === 'string' ? candidate.key.toUpperCase() : '';
    const label = typeof candidate.label === 'string' ? candidate.label.toLowerCase() : '';
    return key === 'DIRECT_UPLINE' || label === 'direct upline';
  });

  if (!directLevel || typeof directLevel !== 'object') return null;
  const amount = toSafeNonNegativeNumber((directLevel as UnknownRecord).amount);
  return amount ?? 0;
}
