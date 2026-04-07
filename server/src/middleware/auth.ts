import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../utils/prisma';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; walletAddress: string };
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

  const admin = await prisma.admin.findFirst({
    where: { walletAddress: (req as any).user.walletAddress, isActive: true },
  });

  if (!admin) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  (req as any).admin = admin;
  next();
};
