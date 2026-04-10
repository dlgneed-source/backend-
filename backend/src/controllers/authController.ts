/**
 * Auth Controller
 * Wallet-based authentication using message signing
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { verifyWalletSignature, generateSignInMessage } from "../utils/eip712";
import { generateUserToken } from "../middleware/auth";
import { AuthenticatedRequest } from "../middleware/auth";
import config from "../config";
import { isValidWalletAddress } from "../middleware/security";

const prisma = new PrismaClient();

/**
 * GET /auth/nonce/:walletAddress
 * Get a nonce for wallet signing
 */
export async function getNonce(req: Request, res: Response): Promise<void> {
  const walletAddress = String(req.params.walletAddress || req.query.walletAddress || "").toLowerCase();

  if (!isValidWalletAddress(walletAddress)) {
    res.status(400).json({ success: false, message: "Invalid wallet address" });
    return;
  }

  try {
    const nonce = uuidv4();
    const message = generateSignInMessage(walletAddress, nonce);

    // Store nonce temporarily in user record (or create pending user)
    const existingUser = await prisma.user.findUnique({ where: { walletAddress: walletAddress.toLowerCase() } });
    const memberId = existingUser?.memberId ?? await generateUniqueMemberId();

    await prisma.user.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: { nonce },
      create: {
        walletAddress: walletAddress.toLowerCase(),
        nonce,
        memberId,
        referralCode: generateReferralCode(walletAddress),
      },
    });

    res.json({ success: true, nonce, message });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to generate nonce" });
  }
}

/**
 * POST /auth/login
 * Verify wallet signature and issue JWT
 */
export async function login(req: Request, res: Response): Promise<void> {
  const { walletAddress, signature, referralCode } = req.body;

  try {
    const normalizedWallet = walletAddress.toLowerCase();

    // Find user
    const user = await prisma.user.findUnique({
      where: { walletAddress: normalizedWallet },
    });

    if (!user || !user.nonce) {
      res.status(400).json({ success: false, message: "Please request a nonce first" });
      return;
    }

    const expectedMessage = generateSignInMessage(normalizedWallet, user.nonce);

    // Verify signature
    let signerAddress: string;
    try {
      signerAddress = verifyWalletSignature(expectedMessage, signature);
    } catch (err) {
      if (config.NODE_ENV === "development") {
        console.error("Signature verification failed:", err);
      }
      res.status(401).json({ success: false, message: "Invalid signature" });
      return;
    }

    if (signerAddress.toLowerCase() !== normalizedWallet) {
      res.status(401).json({ success: false, message: "Signature address mismatch" });
      return;
    }

    // Handle referral
    let referredById: string | undefined;
    if (referralCode && !user.referredById) {
      const referrer = await prisma.user.findFirst({
        where: { referralCode },
      });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    // Clear nonce and update login
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        nonce: null,
        lastLoginAt: new Date(),
        ...(referredById && !user.referredById ? { referredById } : {}),
      },
    });

    const token = generateUserToken(updatedUser.id, updatedUser.walletAddress);

    res.json({
      success: true,
      token,
      user: {
        id: updatedUser.id,
        walletAddress: updatedUser.walletAddress,
        name: updatedUser.name,
        referralCode: updatedUser.referralCode,
        status: updatedUser.status,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed" });
  }
}

/**
 * GET /auth/me
 * Get current authenticated user profile
 */
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        memberId: true,
        walletAddress: true,
        name: true,
        email: true,
        avatarUrl: true,
        referralCode: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: { referrals: true, enrollments: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
}

/**
 * POST /auth/refresh
 * Refresh JWT token
 */
export async function refreshToken(req: AuthenticatedRequest, res: Response): Promise<void> {
  const token = generateUserToken(req.user!.id, req.user!.walletAddress);
  res.json({ success: true, token });
}

/**
 * POST /auth/dev-login
 * Development-only login for frontend local integration
 */
export async function devLogin(req: Request, res: Response): Promise<void> {
  if (config.NODE_ENV === "production") {
    res.status(403).json({ success: false, message: "dev-login is disabled in production" });
    return;
  }

  const walletAddress = String(req.body?.walletAddress || "").toLowerCase();
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : undefined;

  if (!isValidWalletAddress(walletAddress)) {
    res.status(400).json({ success: false, message: "Invalid wallet address" });
    return;
  }

  try {
    const existingUserForDev = await prisma.user.findUnique({ where: { walletAddress } });
    const memberIdForDev = existingUserForDev?.memberId ?? await generateUniqueMemberId();

    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {
        ...(name ? { name } : {}),
        lastLoginAt: new Date(),
      },
      create: {
        walletAddress,
        name: name || null,
        memberId: memberIdForDev,
        referralCode: generateReferralCode(walletAddress),
        lastLoginAt: new Date(),
      },
    });

    const token = generateUserToken(user.id, user.walletAddress);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        name: user.name,
        referralCode: user.referralCode,
        status: user.status,
      },
    });
  } catch (err) {
    console.error("dev-login failed:", err);
    const detail = err instanceof Error ? err.message : "unknown error";
    res.status(500).json({
      success: false,
      message: config.NODE_ENV === "development" ? `Development login failed: ${detail}` : "Development login failed",
    });
  }
}

// =============================================
// HELPERS
// =============================================

function generateReferralCode(walletAddress: string): string {
  const suffix = walletAddress.slice(-6).toUpperCase();
  const prefix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `EA${prefix}${suffix}`;
}

async function generateUniqueMemberId(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = String(Math.floor(100000 + Math.random() * 900000));
    const existing = await prisma.user.findUnique({ where: { memberId: candidate } });
    if (!existing) return candidate;
  }
  // Fallback: use timestamp-based 6-digit suffix
  return String(Date.now()).slice(-6);
}
