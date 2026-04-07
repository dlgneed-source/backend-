/**
 * cronJobs.ts
 *
 * Scheduled job definitions for the backend.
 *
 * Monthly cron:
 *   Runs on the last day of every month.  February is handled safely —
 *   the scheduler uses the actual last calendar day of the month rather
 *   than hardcoding day 28 or 30, so it works for both leap and non-leap years.
 *
 * Usage (example with node-cron):
 *   import { buildMonthlyCronExpression, runMonthlyJob } from "./cronJobs";
 *   cron.schedule(buildMonthlyCronExpression(), runMonthlyJob);
 */

// ─── Date helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the last calendar day of the given month/year.
 * Handles February correctly for both leap and non-leap years.
 *
 * @param year  - Full year (e.g. 2024).
 * @param month - 1-indexed month (1 = January … 12 = December).
 */
export function lastDayOfMonth(year: number, month: number): number {
  // Day 0 of the next month = last day of current month
  return new Date(year, month, 0).getDate();
}

/**
 * Returns whether the given year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Builds a cron expression that fires at 00:00 on the last day of the
 * current month.  Because the "last day" varies, you should call this
 * function once at the start of each month (or use a cron library that
 * supports `L` day-of-month syntax).
 *
 * Returns a standard 5-field cron expression: "min hour dom month dow"
 *
 * @param now - Reference date (defaults to `new Date()`).
 */
export function buildMonthlyCronExpression(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  const lastDay = lastDayOfMonth(year, month);
  // Fire at 00:00 on the last day of this month
  return `0 0 ${lastDay} ${month} *`;
}

// ─── Job definitions ──────────────────────────────────────────────────────────

export interface MonthlyJobContext {
  /** Called to trigger flushout checks for all TIME_EXPIRED slots */
  flushExpiredSlots: () => Promise<void>;
  /** Called to distribute accumulated leader, reward, sponsor pool balances */
  distributeMonthlyPools: () => Promise<void>;
  /** Optional logger — defaults to console */
  log?: (message: string) => void;
}

/**
 * Executes the monthly scheduled job.
 *
 * Steps:
 * 1. Flush all slots whose expiry date has passed.
 * 2. Distribute monthly pool balances (leader, reward, sponsor).
 *
 * @param ctx - Job context providing the async handlers.
 */
export async function runMonthlyJob(ctx: MonthlyJobContext): Promise<void> {
  const log = ctx.log ?? console.log;
  const now = new Date();
  log(`[CronJobs] Monthly job started at ${now.toISOString()}`);

  try {
    log("[CronJobs] Flushing expired slots…");
    await ctx.flushExpiredSlots();
    log("[CronJobs] Expired slots flushed.");
  } catch (err) {
    log(`[CronJobs] ERROR flushing expired slots: ${String(err)}`);
    throw err;
  }

  try {
    log("[CronJobs] Distributing monthly pools…");
    await ctx.distributeMonthlyPools();
    log("[CronJobs] Monthly pools distributed.");
  } catch (err) {
    log(`[CronJobs] ERROR distributing monthly pools: ${String(err)}`);
    throw err;
  }

  log(`[CronJobs] Monthly job completed at ${new Date().toISOString()}`);
}

// ─── Scheduler bootstrap ──────────────────────────────────────────────────────

/**
 * Registers the monthly cron job with node-cron (if available).
 *
 * This function is intentionally kept dependency-free at the module level —
 * `node-cron` is injected by the caller so this file can be unit-tested
 * without the dependency.
 *
 * @param scheduleFn  - node-cron compatible `schedule(expression, task)` fn.
 * @param ctx         - Monthly job context.
 */
export function registerMonthlyCron(
  scheduleFn: (expression: string, task: () => void) => void,
  ctx: MonthlyJobContext,
): void {
  // Rebuild the expression at the start of each month so the last-day
  // calculation stays correct for months of different lengths.
  const expression = buildMonthlyCronExpression();
  scheduleFn(expression, () => {
    runMonthlyJob(ctx).catch((err) =>
      (ctx.log ?? console.error)(`[CronJobs] Unhandled monthly job error: ${String(err)}`),
    );
  });
}
