/**
 * Gift Code Controller
 * Generate and redeem gift codes for plan enrollments
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth";
import { v4 as uuidv4 } from "uuid";
import { getGiftCodeRedeemability } from "../utils/giftCodeRules";

const prisma = new PrismaClient();

/**
 * POST /gift-codes/generate
 * Generate a gift code for a plan (admin or authorized user)
 */
export async function generateGiftCode(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { planId, expiryDays = 30 } = req.body;
  const generatedById = req.user!.id;

  try {
    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      res.status(404).json({ success: false, message: "Plan not found or inactive" });
      return;
    }

    const code = generateCode(planId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const giftCode = await prisma.giftCode.create({
      data: {
        code,
        planId,
        generatedById,
        expiresAt,
        status: "ACTIVE",
      },
      include: { plan: { select: { name: true } } },
    });

    res.status(201).json({
      success: true,
      message: "Gift code generated",
      giftCode: {
        id: giftCode.id,
        code: giftCode.code,
        planId: giftCode.planId,
        planName: giftCode.plan.name,
        expiresAt: giftCode.expiresAt,
        status: giftCode.status,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to generate gift code" });
  }
}

/**
 * POST /gift-codes/redeem
 * Redeem a gift code for enrollment
 */
export async function redeemGiftCode(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { code } = req.body;
  const userId = req.user!.id;

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, referredById: true },
    });
    if (!currentUser || currentUser.status !== "ACTIVE") {
      res.status(403).json({ success: false, message: "Inactive users cannot redeem gift codes" });
      return;
    }

    const giftCode = await prisma.giftCode.findUnique({
      where: { code },
      include: { plan: true },
    });

    if (!giftCode) {
      res.status(404).json({ success: false, message: "Gift code not found" });
      return;
    }

    if (!giftCode.plan.isActive) {
      res.status(409).json({ success: false, message: "Plan is inactive" });
      return;
    }

    const redeemability = getGiftCodeRedeemability(giftCode.status, giftCode.expiresAt, new Date());
    if (!redeemability.redeemable) {
      if (redeemability.effectiveStatus === "EXPIRED" && giftCode.status !== "EXPIRED") {
        await prisma.giftCode.update({ where: { id: giftCode.id }, data: { status: "EXPIRED" } });
      }
      res.status(400).json({ success: false, message: `Gift code is ${redeemability.effectiveStatus.toLowerCase()}` });
      return;
    }

    // Check if user already enrolled in this plan
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: { userId, planId: giftCode.planId, status: "ACTIVE" },
    });

    if (existingEnrollment) {
      res.status(409).json({ success: false, message: "Already enrolled in this plan" });
      return;
    }

    const { calculateFlushoutDate } = await import("../utils/flushoutLogic");
    const { distributeCommissions } = await import("../utils/commissionLogic");

    const flushoutAt = calculateFlushoutDate(new Date(), giftCode.plan.flushoutDays);

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        planId: giftCode.planId,
        status: "ACTIVE",
        flushoutAt,
      },
    });

    // Mark gift code as used
    await prisma.giftCode.update({
      where: { id: giftCode.id },
      data: { status: "USED", usedAt: new Date() },
    });

    // Create redemption record
    await prisma.giftCodeRedemption.create({
      data: {
        giftCodeId: giftCode.id,
        redeemedById: userId,
        enrollmentId: enrollment.id,
      },
    });

    // Upline commission (direct referrer gets configured plan commission)
    const directUpline = currentUser.referredById
      ? await prisma.user.findUnique({
          where: { id: currentUser.referredById },
          select: { id: true, status: true },
        })
      : null;

    if (directUpline?.status === "ACTIVE" && giftCode.plan.uplineCommission > 0) {
      await prisma.uplineCommission.create({
        data: {
          enrollmentId: enrollment.id,
          recipientId: directUpline.id,
          amount: giftCode.plan.uplineCommission,
          planId: giftCode.planId,
        },
      });

      await prisma.transaction.create({
        data: {
          userId: directUpline.id,
          type: "UPLINE_COMMISSION",
          amount: giftCode.plan.uplineCommission,
          description: `Upline commission from Plan ${giftCode.planId} enrollment`,
          status: "COMPLETED",
          metadata: { enrollmentId: enrollment.id, planId: giftCode.planId },
        },
      });
    }

    // Distribute commissions (gift code counts as enrollment, uses slotFee)
    await distributeCommissions(enrollment.id, userId, giftCode.plan.slotFee, giftCode.planId);

    // System fee to treasury ledger
    await prisma.systemFeeLedger.create({
      data: {
        enrollmentId: enrollment.id,
        planId: giftCode.planId,
        amount: giftCode.plan.systemFee,
        description: "System fee on enrollment",
      },
    });

    // SYSTEM pool gets systemFee
    await prisma.pool.upsert({
      where: { planId_type: { planId: giftCode.planId, type: "SYSTEM" } },
      update: {
        balance: { increment: giftCode.plan.systemFee },
        totalReceived: { increment: giftCode.plan.systemFee },
      },
      create: {
        planId: giftCode.planId,
        type: "SYSTEM",
        balance: giftCode.plan.systemFee,
        totalReceived: giftCode.plan.systemFee,
        totalDistributed: 0,
      },
    });

    // Record transaction
    await prisma.transaction.create({
      data: {
        userId,
        type: "GIFT_CODE",
        amount: giftCode.plan.joiningFee,
        description: `Gift code redemption - Plan ${giftCode.planId} (${giftCode.plan.name})`,
        status: "COMPLETED",
        metadata: { giftCodeId: giftCode.id, enrollmentId: enrollment.id },
      },
    });

    res.json({
      success: true,
      message: "Gift code redeemed successfully",
      enrollment: {
        id: enrollment.id,
        planId: giftCode.planId,
        planName: giftCode.plan.name,
        flushoutAt,
        memberProfit: giftCode.plan.memberProfit,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to redeem gift code" });
  }
}

/**
 * GET /gift-codes/my
 * Get gift codes generated by current user
 */
export async function getMyGiftCodes(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const [giftCodes, total] = await Promise.all([
      prisma.giftCode.findMany({
        where: { generatedById: req.user!.id },
        include: {
          plan: { select: { name: true } },
          redemption: { include: { redeemedBy: { select: { walletAddress: true, name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.giftCode.count({ where: { generatedById: req.user!.id } }),
    ]);

    res.json({
      success: true,
      giftCodes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch gift codes" });
  }
}

/**
 * GET /gift-codes/:code/validate
 * Validate a gift code without redeeming
 */
export async function validateGiftCode(req: Request, res: Response): Promise<void> {
  const { code } = req.params;

  try {
    const giftCode = await prisma.giftCode.findUnique({
      where: { code },
      include: { plan: { select: { id: true, name: true, memberProfit: true, flushoutDays: true } } },
    });

    if (!giftCode) {
      res.status(404).json({ success: false, message: "Gift code not found" });
      return;
    }

    const redeemability = getGiftCodeRedeemability(giftCode.status, giftCode.expiresAt, new Date());
    const isValid = redeemability.redeemable;

    res.json({
      success: true,
      valid: isValid,
      status: redeemability.effectiveStatus,
      plan: isValid ? giftCode.plan : null,
      expiresAt: giftCode.expiresAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to validate gift code" });
  }
}

// =============================================
// HELPERS
// =============================================

function generateCode(planId: number): string {
  const prefix = `EA${planId}`;
  const random = uuidv4().replace(/-/g, "").toUpperCase().slice(0, 8);
  return `${prefix}-${random}`;
}
