import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create 6 Plans based on income model
  const plans: Prisma.PlanCreateInput[] = [
    {
      id: 1,
      name: 'Foundation',
      joiningFee: 5.0,
      teamSize: 5,
      uplineCommission: 1.0,
      systemFee: 0.5,
      levelCommission: 0.5,
      slotFee: 3.0,
      totalCollection: 15.0,
      memberProfit: 12.0,
      leaderPool: 1.0,
      rewardPool: 0.0,
      sponsorPool: 0.0,
      roi: 240.0,
      flushoutDays: 30,
    },
    {
      id: 2,
      name: 'Pro Builder',
      joiningFee: 10.0,
      teamSize: 6,
      uplineCommission: 2.0,
      systemFee: 1.0,
      levelCommission: 1.0,
      slotFee: 6.0,
      totalCollection: 36.0,
      memberProfit: 30.0,
      leaderPool: 2.0,
      rewardPool: 2.0,
      sponsorPool: 0.0,
      roi: 300.0,
      flushoutDays: 45,
    },
    {
      id: 3,
      name: 'Cyber Elite',
      joiningFee: 20.0,
      teamSize: 6,
      uplineCommission: 4.0,
      systemFee: 1.0,
      levelCommission: 2.0,
      slotFee: 13.0,
      totalCollection: 78.0,
      memberProfit: 66.0,
      leaderPool: 4.0,
      rewardPool: 4.0,
      sponsorPool: 0.0,
      roi: 330.0,
      flushoutDays: 60,
    },
    {
      id: 4,
      name: 'AI Mastery',
      joiningFee: 40.0,
      teamSize: 7,
      uplineCommission: 7.0,
      systemFee: 1.0,
      levelCommission: 4.0,
      slotFee: 28.0,
      totalCollection: 196.0,
      memberProfit: 170.0,
      leaderPool: 10.0,
      rewardPool: 8.0,
      sponsorPool: 0.0,
      roi: 425.0,
      flushoutDays: 75,
    },
    {
      id: 5,
      name: 'Digital Commander',
      joiningFee: 80.0,
      teamSize: 8,
      uplineCommission: 14.0,
      systemFee: 2.0,
      levelCommission: 8.0,
      slotFee: 56.0,
      totalCollection: 448.0,
      memberProfit: 400.0,
      leaderPool: 20.0,
      rewardPool: 16.0,
      sponsorPool: 4.0,
      roi: 500.0,
      flushoutDays: 90,
    },
    {
      id: 6,
      name: 'Supreme Visionary',
      joiningFee: 160.0,
      teamSize: 8,
      uplineCommission: 32.0,
      systemFee: 2.0,
      levelCommission: 16.0,
      slotFee: 110.0,
      totalCollection: 880.0,
      memberProfit: 800.0,
      leaderPool: 24.0,
      rewardPool: 12.0,
      sponsorPool: 4.0,
      roi: 500.0,
      flushoutDays: 120,
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id as number },
      update: plan,
      create: plan,
    });
    console.log(`  ✓ Plan ${plan.id}: ${plan.name}`);
  }

  // Create system treasury
  await prisma.treasury.upsert({
    where: { key: 'SYSTEM_OWNER_TREASURY' },
    update: {},
    create: {
      key: 'SYSTEM_OWNER_TREASURY',
      name: 'System / Owner Treasury',
      balance: 0,
      totalReceived: 0,
      totalPaidOut: 0,
    },
  });
  console.log('  ✓ System Treasury created');

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
