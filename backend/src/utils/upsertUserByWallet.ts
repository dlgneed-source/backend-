import { Prisma, PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

const REFERRAL_CODE_LENGTH = 12;
const MAX_REFERRAL_CODE_ATTEMPTS = 5;

function generateReferralCode(): string {
  return uuidv4().replace(/-/g, "").toUpperCase().slice(0, REFERRAL_CODE_LENGTH);
}

function isReferralCodeUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.includes("referralCode");
  }

  return target === "referralCode";
}

export async function upsertActiveUserByWallet(
  prisma: PrismaClient,
  walletAddress: string,
): Promise<{ id: string }> {
  const normalizedWallet = walletAddress.toLowerCase();

  for (let attempt = 0; attempt < MAX_REFERRAL_CODE_ATTEMPTS; attempt++) {
    try {
      return await prisma.user.upsert({
        where: { walletAddress: normalizedWallet },
        update: {},
        create: {
          walletAddress: normalizedWallet,
          status: "ACTIVE",
          referralCode: generateReferralCode(),
        },
        select: { id: true },
      });
    } catch (error) {
      if (isReferralCodeUniqueConstraintError(error)) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to generate unique referral code for wallet");
}
