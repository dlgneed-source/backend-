/**
 * Incentive Controller
 * Club and individual incentive claims
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthenticatedRequest } from "../middleware/auth";
import {
  getIncentiveProgress,
  claimClubIncentive,
  checkIndividualIncentive,
  CLUB_INCENTIVES,
  INDIVIDUAL_INCENTIVES,
} from "../utils/incentiveLogic";

const prisma = new PrismaClient();

/**
 * GET /incentives/progress
 * Get current user's incentive progress
 */
export async function getProgress(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const progress = await getIncentiveProgress(req.user!.id);
    res.json({ success: true, progress });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch incentive progress" });
  }
}

/**
 * GET /incentives/tiers
 * Get all incentive tiers
 */
export async function getIncentiveTiers(req: Request, res: Response): Promise<void> {
  res.json({
    success: true,
    clubIncentives: CLUB_INCENTIVES,
    individualIncentives: INDIVIDUAL_INCENTIVES,
  });
}

/**
 * POST /incentives/claim/club
 * Claim a club incentive
 */
export async function claimClub(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { rank } = req.body;

  try {
    const result = await claimClubIncentive(req.user!.id, rank);

    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.status(201).json({
      success: true,
      message: result.message,
      claimId: result.claimId,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to submit claim" });
  }
}

/**
 * GET /incentives/check-individual/:planId
 * Check individual incentive eligibility for a plan
 */
export async function checkIndividual(req: AuthenticatedRequest, res: Response): Promise<void> {
  const planId = parseInt(req.params.planId);

  try {
    const result = await checkIndividualIncentive(req.user!.id, planId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to check incentive eligibility" });
  }
}

/**
 * GET /incentives/claims
 * Get user's incentive claims
 */
export async function getMyClaims(req: AuthenticatedRequest, res: Response): Promise<void> {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const [claims, total] = await Promise.all([
      prisma.incentiveClaim.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.incentiveClaim.count({ where: { userId: req.user!.id } }),
    ]);

    res.json({
      success: true,
      claims,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch claims" });
  }
}
