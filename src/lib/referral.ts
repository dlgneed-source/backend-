type UnknownRecord = Record<string, unknown>;
const DIRECT_UPLINE_KEY = 'DIRECT_UPLINE';
const DIRECT_UPLINE_LABEL = 'direct upline';

export function toSafeNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return value;
}

export function toSafeNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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
    return key === DIRECT_UPLINE_KEY || label === DIRECT_UPLINE_LABEL;
  });

  if (!directLevel || typeof directLevel !== 'object') return null;
  const amount = toSafeNonNegativeNumber((directLevel as UnknownRecord).amount);
  return amount;
}
