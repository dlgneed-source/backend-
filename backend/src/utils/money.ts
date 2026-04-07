const MONEY_SCALE = 1_000_000;

export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * MONEY_SCALE) / MONEY_SCALE;
}

export function sumMoney(values: number[]): number {
  const scaled = values.reduce((sum, value) => sum + Math.round((Number.isFinite(value) ? value : 0) * MONEY_SCALE), 0);
  return scaled / MONEY_SCALE;
}
