/**
 * Enrollment ID Utility
 * Generates unique 6-digit numeric enrollment IDs.
 */

import { PrismaClient } from "@prisma/client";

/**
 * Generate a random 6-digit numeric string (100000–999999)
 */
function randomSixDigit(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Generate a unique 6-digit enrollment ID that does not already exist in the database.
 * Retries up to `maxAttempts` times before throwing.
 */
export async function generateUniqueEnrollmentId(
  prisma: PrismaClient,
  maxAttempts = 10
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const id = randomSixDigit();
    const existing = await prisma.enrollment.findUnique({ where: { id } });
    if (!existing) return id;
  }
  throw new Error("Could not generate a unique enrollment ID after multiple attempts");
}
