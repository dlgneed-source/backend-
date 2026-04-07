import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { successResponse } from '../utils/response';
import { ValidationError } from '../utils/errors';
import { config } from '../config';

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { walletAddress } = req.body;

  if (!walletAddress || typeof walletAddress !== 'string') {
    throw new ValidationError('walletAddress is required');
  }

  const normalizedWallet = walletAddress.toLowerCase();

  // TODO: In production, verify the signature against the wallet address
  // For now, auto-create or find user by wallet
  let user = await prisma.user.findUnique({ where: { walletAddress: normalizedWallet } });

  if (!user) {
    // Check for referrer from query
    const referrerId = req.body.referrerId || null;

    user = await prisma.user.create({
      data: {
        walletAddress: normalizedWallet,
        referrerId,
      },
    });
  }

  // Update last active
  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: new Date() },
  });

  const token = jwt.sign(
    { id: user.id, walletAddress: user.walletAddress },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  successResponse(res, {
    token,
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      name: user.name,
      balance: user.balance,
      totalEarned: user.totalEarned,
      totalInvested: user.totalInvested,
      totalWithdrawn: user.totalWithdrawn,
      status: user.status,
    },
  }, 'Login successful');
});
