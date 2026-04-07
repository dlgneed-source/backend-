/**
 * Withdrawal Controller
 * EIP-712 atomic withdrawal system
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth";
import { signWithdrawal, isDeadlineValid } from "../utils/eip712";
import { createError } from "../middleware/errorHandler";

const prisma = new PrismaClient();

const WITHDRAWAL_MIN = parseFloat(process.env.WITHDRAWAL_MIN_AMOUNT || "5");
const WITHDRAWAL_MAX = parseFloat(process.env.WITHDRAWAL_MAX_AMOUNT || "10000");

/**
 * POST /withdrawals/request
 * Create a withdrawal request
 */
export async function requestWithdrawal(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { amount, walletAddress } = req.body;
  const userId = req.user!.id;

  try {
    if (amount < WITHDRAWAL_MIN || amount > WITHDRAWAL_MAX) {
      res.status(400).json({
        success: false,
        message: `Amount must be between $${WITHDRAWAL_MIN} and $${WITHDRAWAL_MAX}`,
      });
      return;
    }

    // Check available balance
    const { availableBalance } = await getUserBalance(userId);
    if (availableBalance < amount) {
      res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: $${availableBalance.toFixed(2)}`,
      });
      return;
    }

    // Check for pending withdrawals
    const pendingCount = await prisma.withdrawal.count({
      where: { userId, status: { in: ["PENDING", "PROCESSING"] } },
    });

    if (pendingCount >= 3) {
      res.status(400).json({
        success: false,
        message: "Maximum 3 pending withdrawals allowed",
      });
      return;
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId,
        amount,
        walletAddress: walletAddress.toLowerCase(),
        status: "PENDING",
      },
    });

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted for review",
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        walletAddress: withdrawal.walletAddress,
        status: withdrawal.status,
        requestedAt: withdrawal.requestedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to submit withdrawal" });
  }
}

/**
 * POST /withdrawals/sign
 * Admin signs a withdrawal (EIP-712) - returns signature for on-chain execution
 */
export async function signWithdrawalRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { withdrawalId } = req.body;

  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { user: { select: { id: true, walletAddress: true } } },
    });

    if (!withdrawal) {
      res.status(404).json({ success: false, message: "Withdrawal not found" });
      return;
    }

    if (withdrawal.status !== "APPROVED") {
      res.status(400).json({ success: false, message: "Withdrawal must be approved before signing" });
      return;
    }

    // Generate nonce based on withdrawal ID
    const nonce = parseInt(withdrawal.id.replace(/[^0-9]/g, "").slice(0, 10)) || Date.now();

    const { signature, deadline, hash } = await signWithdrawal(
      withdrawal.walletAddress,
      withdrawal.amount,
      nonce,
      3600 // 1 hour validity
    );

    // Update withdrawal with signature
    await prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: { signature, nonce: nonce.toString(), status: "PROCESSING" },
    });

    res.json({
      success: true,
      message: "Withdrawal signed, ready for on-chain execution",
      signature,
      deadline,
      hash,
      nonce,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        walletAddress: withdrawal.walletAddress,
      },
    });
  } catch (err: any) {
    if (err.message?.includes("Signer private key not configured")) {
      res.status(503).json({ success: false, message: "Signing service not configured" });
      return;
    }
    res.status(500).json({ success: false, message: "Failed to sign withdrawal" });
  }
}

/**
 * GET /withdrawals/my
 * Get current user's withdrawals
 */
export async function getMyWithdrawals(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { userId: req.user!.id },
        orderBy: { requestedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.withdrawal.count({ where: { userId: req.user!.id } }),
    ]);

    res.json({
      success: true,
      withdrawals,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch withdrawals" });
  }
}

/**
 * POST /withdrawals/:id/confirm
 * User confirms on-chain execution (updates txHash)
 */
export async function confirmWithdrawal(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = req.params;
  const { txHash } = req.body;

  try {
    const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });

    if (!withdrawal || withdrawal.userId !== req.user!.id) {
      res.status(404).json({ success: false, message: "Withdrawal not found" });
      return;
    }

    if (withdrawal.status !== "PROCESSING") {
      res.status(400).json({ success: false, message: "Withdrawal not in processing state" });
      return;
    }

    const updated = await prisma.withdrawal.update({
      where: { id },
      data: { txHash, status: "COMPLETED", processedAt: new Date() },
    });

    // Record withdrawal transaction
    await prisma.transaction.create({
      data: {
        userId: withdrawal.userId,
        type: "WITHDRAWAL",
        amount: withdrawal.amount,
        description: "Withdrawal completed",
        status: "COMPLETED",
        txHash,
        metadata: { withdrawalId: id },
      },
    });

    res.json({ success: true, message: "Withdrawal confirmed", withdrawal: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to confirm withdrawal" });
  }
}

// =============================================
// HELPERS
// =============================================

async function getUserBalance(userId: string): Promise<{ totalEarned: number; totalWithdrawn: number; availableBalance: number }> {
  const [earned, withdrawn] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId,
        type: { in: ["COMMISSION", "UPLINE_COMMISSION", "FLUSHOUT", "INCENTIVE"] },
        status: "COMPLETED",
      },
      _sum: { amount: true },
    }),
    prisma.withdrawal.aggregate({
      where: { userId, status: { in: ["COMPLETED", "APPROVED", "PROCESSING"] } },
      _sum: { amount: true },
    }),
  ]);

  const totalEarned = earned._sum.amount || 0;
  const totalWithdrawn = withdrawn._sum.amount || 0;
  return { totalEarned, totalWithdrawn, availableBalance: Math.max(0, totalEarned - totalWithdrawn) };
}
