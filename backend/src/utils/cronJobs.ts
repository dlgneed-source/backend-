/**
 * Cron Jobs
 * Scheduled tasks for automated backend operations
 */

import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { processAllPendingFlushouts } from "./flushoutLogic";

const prisma = new PrismaClient();

let cronJobsRunning = false;

/**
 * Initialize all cron jobs
 */
export function initCronJobs(): void {
  if (cronJobsRunning) {
    console.log("⏱️  Cron jobs already running");
    return;
  }

  // Process flushouts every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    console.log("⏱️  [CRON] Processing pending flushouts...");
    try {
      const results = await processAllPendingFlushouts();
      const success = results.filter((r) => r.status === "success").length;
      const failed = results.filter((r) => r.status === "failed").length;
      if (results.length > 0) {
        console.log(`✅ [CRON] Flushouts: ${success} success, ${failed} failed`);
      }
    } catch (err) {
      console.error("❌ [CRON] Flushout error:", err);
    }
  });

  // Process approved withdrawals every hour
  cron.schedule("0 * * * *", async () => {
    console.log("⏱️  [CRON] Processing approved withdrawals...");
    try {
      await processApprovedWithdrawals();
    } catch (err) {
      console.error("❌ [CRON] Withdrawal processing error:", err);
    }
  });

  // Pool distribution check every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    console.log("⏱️  [CRON] Running pool health check...");
    try {
      await poolHealthCheck();
    } catch (err) {
      console.error("❌ [CRON] Pool health check error:", err);
    }
  });

  // Daily treasury reconciliation at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("⏱️  [CRON] Running daily treasury reconciliation...");
    try {
      await reconcileTreasury();
    } catch (err) {
      console.error("❌ [CRON] Treasury reconciliation error:", err);
    }
  });

  // Expire gift codes daily at 1am
  cron.schedule("0 1 * * *", async () => {
    console.log("⏱️  [CRON] Expiring old gift codes...");
    try {
      await expireGiftCodes();
    } catch (err) {
      console.error("❌ [CRON] Gift code expiry error:", err);
    }
  });

  cronJobsRunning = true;
  console.log("✅ Cron jobs initialized");
}

/**
 * Process approved withdrawals (mark as COMPLETED after blockchain confirmation)
 */
async function processApprovedWithdrawals(): Promise<void> {
  const approved = await prisma.withdrawal.findMany({
    where: { status: "APPROVED" },
    take: 50,
  });

  for (const withdrawal of approved) {
    // In production, check on-chain confirmation here
    // For now, mark as PROCESSING
    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: { status: "PROCESSING" },
    });
  }

  if (approved.length > 0) {
    console.log(`✅ [CRON] Processing ${approved.length} approved withdrawals`);
  }
}

/**
 * Check pool balances and log anomalies
 */
async function poolHealthCheck(): Promise<void> {
  const pools = await prisma.pool.findMany({
    include: { plan: { select: { name: true } } },
  });

  for (const pool of pools) {
    if (pool.balance < 0) {
      console.error(`⚠️  [CRON] Pool ${pool.id} (${pool.plan.name} - ${pool.type}) has negative balance: ${pool.balance}`);
    }
  }
}

/**
 * Reconcile treasury totals
 */
async function reconcileTreasury(): Promise<void> {
  const treasury = await prisma.treasury.findFirst();
  if (!treasury) return;

  const [deposits, withdrawals, commissions, fees] = await Promise.all([
    prisma.transaction.aggregate({
      where: { type: "DEPOSIT", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "WITHDRAWAL", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "COMMISSION", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.systemFeeLedger.aggregate({
      _sum: { amount: true },
    }),
  ]);

  await prisma.treasury.update({
    where: { id: treasury.id },
    data: {
      totalDeposited: deposits._sum.amount || 0,
      totalWithdrawn: withdrawals._sum.amount || 0,
      totalCommissions: commissions._sum.amount || 0,
      totalSystemFees: fees._sum.amount || 0,
    },
  });

  console.log("✅ [CRON] Treasury reconciliation complete");
}

/**
 * Expire gift codes past their expiry date
 */
async function expireGiftCodes(): Promise<void> {
  const result = await prisma.giftCode.updateMany({
    where: {
      status: "ACTIVE",
      expiresAt: { lte: new Date() },
    },
    data: { status: "EXPIRED" },
  });

  if (result.count > 0) {
    console.log(`✅ [CRON] Expired ${result.count} gift codes`);
  }
}

/**
 * Stop all cron jobs (for graceful shutdown)
 */
export function stopCronJobs(): void {
  cron.getTasks().forEach((task) => task.stop());
  cronJobsRunning = false;
  console.log("⏹️  Cron jobs stopped");
}
