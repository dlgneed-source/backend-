import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // =============================================
  // SEED PLANS (6 Plans)
  // =============================================
  const plans = [
    {
      id: 1,
      name: "Foundation",
      joiningFee: 5,
      teamSize: 5,
      uplineCommission: 1,
      systemFee: 0.5,
      levelCommission: 0.5,
      slotFee: 3,
      totalCollection: 15,
      memberProfit: 12,
      leaderPool: 1,
      rewardPool: 0,
      sponsorPool: 0,
      roi: 240,
      flushoutDays: 3,
    },
    {
      id: 2,
      name: "Pro Builder",
      joiningFee: 10,
      teamSize: 6,
      uplineCommission: 2,
      systemFee: 1,
      levelCommission: 1,
      slotFee: 6,
      totalCollection: 36,
      memberProfit: 30,
      leaderPool: 2,
      rewardPool: 2,
      sponsorPool: 0,
      roi: 300,
      flushoutDays: 8,
    },
    {
      id: 3,
      name: "Cyber Elite",
      joiningFee: 20,
      teamSize: 7,
      uplineCommission: 4,
      systemFee: 1,
      levelCommission: 2,
      slotFee: 13,
      totalCollection: 91,
      memberProfit: 80,
      leaderPool: 4,
      rewardPool: 3,
      sponsorPool: 0,
      roi: 400,
      flushoutDays: 16,
    },
    {
      id: 4,
      name: "AI Mastery",
      joiningFee: 40,
      teamSize: 8,
      uplineCommission: 7,
      systemFee: 1,
      levelCommission: 4,
      slotFee: 28,
      totalCollection: 224,
      memberProfit: 200,
      leaderPool: 8,
      rewardPool: 4,
      sponsorPool: 2,
      roi: 500,
      flushoutDays: 25,
    },
    {
      id: 5,
      name: "Quantum Leader",
      joiningFee: 80,
      teamSize: 8,
      uplineCommission: 14,
      systemFee: 2,
      levelCommission: 8,
      slotFee: 56,
      totalCollection: 448,
      memberProfit: 400,
      leaderPool: 16,
      rewardPool: 10,
      sponsorPool: 2,
      roi: 500,
      flushoutDays: 40,
    },
    {
      id: 6,
      name: "Supreme Visionary",
      joiningFee: 160,
      teamSize: 8,
      uplineCommission: 32,
      systemFee: 2,
      levelCommission: 16,
      slotFee: 110,
      totalCollection: 880,
      memberProfit: 800,
      leaderPool: 24,
      rewardPool: 12,
      sponsorPool: 4,
      roi: 500,
      flushoutDays: 60,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
    console.log(`✅ Plan ${plan.id} (${plan.name}) seeded`);
  }

  // =============================================
  // SEED POOLS (for each plan)
  // =============================================
  const poolTypes = ["SYSTEM", "LEADER", "REWARD", "SPONSOR"] as const;
  for (const plan of plans) {
    // Determine which pool types apply per plan
    const typesForPlan: Array<typeof poolTypes[number]> = ["SYSTEM", "LEADER"];
    if (plan.rewardPool > 0) typesForPlan.push("REWARD");
    if (plan.sponsorPool > 0) typesForPlan.push("SPONSOR");

    for (const pType of typesForPlan) {
      await prisma.pool.upsert({
        where: { planId_type: { planId: plan.id, type: pType } },
        update: {},
        create: {
          planId: plan.id,
          type: pType,
          balance: 0,
          totalReceived: 0,
          totalDistributed: 0,
        },
      });
    }
    console.log(`✅ Pools for Plan ${plan.id} seeded`);
  }

  // =============================================
  // SEED SYSTEM CONFIG
  // =============================================
  const configs = [
    {
      key: "COMMISSION_LEVELS",
      value: JSON.stringify([
        { level: 1, percentage: 4 },
        { level: 2, percentage: 2 },
        { level: 3, percentage: 1 },
        { level: 4, percentage: 1 },
        { level: 5, percentage: 1 },
        { level: 6, percentage: 0.5 },
        { level: 7, percentage: 0.5 },
      ]),
      description: "Multi-level commission percentages (7 levels)",
    },
    {
      key: "CLUB_INCENTIVES",
      value: JSON.stringify([
        { id: 1, plan1Ids: 25, plan2Ids: 18, plan3Ids: 14, plan4Ids: 4, plan5Ids: 2, plan6Ids: 1, reward: 30, rank: "BRONZE" },
        { id: 2, plan1Ids: 50, plan2Ids: 36, plan3Ids: 28, plan4Ids: 8, plan5Ids: 4, plan6Ids: 2, reward: 70, rank: "SILVER" },
        { id: 3, plan1Ids: 75, plan2Ids: 54, plan3Ids: 42, plan4Ids: 12, plan5Ids: 6, plan6Ids: 3, reward: 110, rank: "GOLD" },
        { id: 4, plan1Ids: 100, plan2Ids: 72, plan3Ids: 56, plan4Ids: 16, plan5Ids: 8, plan6Ids: 4, reward: 200, rank: "PLATINUM" },
      ]),
      description: "Club incentive tiers (Bronze/Silver/Gold/Platinum)",
    },
    {
      key: "INDIVIDUAL_INCENTIVES",
      value: JSON.stringify([
        { planId: 1, target: 100, reward: 20 },
        { planId: 2, target: 75, reward: 25 },
        { planId: 3, target: 50, reward: 28 },
        { planId: 4, target: 25, reward: 25 },
        { planId: 5, target: 15, reward: 30 },
        { planId: 6, target: 10, reward: 30 },
      ]),
      description: "Individual incentive targets per plan",
    },
    {
      key: "WITHDRAWAL_MIN_AMOUNT",
      value: "5",
      description: "Minimum withdrawal amount in USD",
    },
    {
      key: "WITHDRAWAL_MAX_AMOUNT",
      value: "10000",
      description: "Maximum withdrawal amount in USD",
    },
    {
      key: "GIFT_CODE_EXPIRY_DAYS",
      value: "30",
      description: "Default gift code expiry in days",
    },
    {
      key: "FLUSHOUT_ENABLED",
      value: "true",
      description: "Enable automatic flushout processing",
    },
    {
      key: "CONTRACT_ADDRESS",
      value: process.env.CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
      description: "Smart contract address",
    },
    {
      key: "CHAIN_ID",
      value: process.env.CHAIN_ID || "1",
      description: "Blockchain chain ID",
    },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value, description: config.description },
      create: config,
    });
    console.log(`✅ Config "${config.key}" seeded`);
  }

  // =============================================
  // SEED TREASURY (single record)
  // =============================================
  const treasuryCount = await prisma.treasury.count();
  if (treasuryCount === 0) {
    await prisma.treasury.create({
      data: {
        totalDeposited: 0,
        totalWithdrawn: 0,
        totalCommissions: 0,
        totalSystemFees: 0,
        totalPoolFunds: 0,
        balance: 0,
      },
    });
    console.log("✅ Treasury seeded");
  }

  // =============================================
  // SEED SUPER ADMIN
  // =============================================
  const adminWallet = process.env.ADMIN_WALLET || "0x0000000000000000000000000000000000000001";
  await prisma.admin.upsert({
    where: { walletAddress: adminWallet },
    update: {},
    create: {
      walletAddress: adminWallet,
      name: "Super Admin",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log("✅ Super Admin seeded");

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
