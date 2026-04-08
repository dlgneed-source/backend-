/**
 * Authentication Middleware
 * JWT-based auth for users and admins
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import config from "../config";

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    walletAddress: string;
    status: string;
  };
  admin?: {
    id: string;
    walletAddress: string | null;
    role: string;
  };
}

/**
 * User JWT authentication middleware
 */
export async function authenticateUser(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "No token provided" });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string;
      walletAddress: string;
      type: string;
    };

    if (decoded.type !== "user") {
      res.status(401).json({ success: false, message: "Invalid token type" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, walletAddress: true, status: true },
    });

    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    if (user.status === "BLOCKED" || user.status === "SUSPENDED") {
      res.status(403).json({ success: false, message: `Account ${user.status.toLowerCase()}` });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

/**
 * Admin JWT authentication middleware
 */
export async function authenticateAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, message: "No token provided" });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as {
      id: string;
      walletAddress: string;
      role: string;
      type: string;
    };

    let admin:
      | {
          id: string;
          walletAddress: string | null;
          role: string;
          isActive: boolean;
        }
      | null = null;

    if (decoded.type === "admin") {
      admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
        select: { id: true, walletAddress: true, role: true, isActive: true },
      });
    } else if (decoded.type === "user") {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, walletAddress: true, status: true },
      });

      if (
        !user ||
        user.walletAddress.toLowerCase() !== decoded.walletAddress.toLowerCase() ||
        user.status === "BLOCKED" ||
        user.status === "SUSPENDED"
      ) {
        res.status(403).json({ success: false, message: "Admin permission denied" });
        return;
      }

      admin = await prisma.admin.findUnique({
        where: { walletAddress: decoded.walletAddress.toLowerCase() },
        select: { id: true, walletAddress: true, role: true, isActive: true },
      });
      if (!admin) {
        res.status(403).json({ success: false, message: "Admin permission denied" });
        return;
      }
    } else {
      res.status(401).json({ success: false, message: "Invalid token type" });
      return;
    }

    if (!admin || !admin.isActive) {
      res.status(401).json({ success: false, message: "Admin not found or inactive" });
      return;
    }

    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Invalid or expired admin token" });
  }
}

/**
 * Super admin only middleware
 */
export function requireSuperAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.admin || req.admin.role !== "SUPER_ADMIN") {
    res.status(403).json({ success: false, message: "Super admin access required" });
    return;
  }
  next();
}

export function requireAdminRoles(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.admin || !allowedRoles.includes(req.admin.role)) {
      res.status(403).json({ success: false, message: "Insufficient admin permissions" });
      return;
    }
    next();
  };
}

/**
 * Generate JWT token for user
 */
export function generateUserToken(userId: string, walletAddress: string): string {
  return jwt.sign(
    { id: userId, walletAddress, type: "user" },
    config.JWT_SECRET,
    { expiresIn: config.JWT_EXPIRES_IN }
  );
}

/**
 * Generate JWT token for admin
 */
export function generateAdminToken(adminId: string, walletAddress: string | null, role: string): string {
  return jwt.sign(
    { id: adminId, walletAddress, role, type: "admin" },
    config.JWT_SECRET,
    { expiresIn: config.JWT_ADMIN_EXPIRES_IN }
  );
}
