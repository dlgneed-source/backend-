/**
 * Validation Middleware
 * Request body validation using Zod
 */

import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

/**
 * Generic validation middleware factory
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

// =============================================
// AUTH SCHEMAS
// =============================================

export const walletAuthSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  signature: z.string().min(1, "Signature required"),
  referralCode: z.string().optional(),
});

export const adminLoginSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
  signature: z.string().min(1, "Signature required"),
});

// =============================================
// ENROLLMENT SCHEMAS
// =============================================

export const enrollSchema = z.object({
  planId: z.number().int().min(1).max(6),
  referralCode: z.string().optional(),
  txHash: z.string().optional(),
});

// =============================================
// WITHDRAWAL SCHEMAS
// =============================================

export const withdrawalRequestSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address"),
});

export const withdrawalSignSchema = z.object({
  withdrawalId: z.string().min(1),
});

// =============================================
// ADMIN SCHEMAS
// =============================================

export const approveWithdrawalSchema = z.object({
  withdrawalId: z.string().min(1),
  txHash: z.string().optional(),
});

export const rejectWithdrawalSchema = z.object({
  withdrawalId: z.string().min(1),
  reason: z.string().min(1, "Rejection reason required"),
});

export const createGiftCodeSchema = z.object({
  planId: z.number().int().min(1).max(6),
  expiryDays: z.number().int().min(1).max(365).optional().default(30),
  quantity: z.number().int().min(1).max(50).optional().default(1),
  code: z
    .string()
    .trim()
    .min(4, "Code must be at least 4 characters")
    .max(32, "Code must be at most 32 characters")
    .regex(/^[A-Z0-9_-]+$/, "Code can only contain uppercase letters, numbers, underscore and hyphen")
    .optional(),
});

export const updateUserStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED", "BLOCKED"]),
  reason: z.string().optional(),
});

export const systemConfigSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
  description: z.string().optional(),
});

// =============================================
// GIFT CODE SCHEMAS
// =============================================

export const redeemGiftCodeSchema = z.object({
  code: z.string().min(1, "Gift code required"),
});

export const adminUpdateGiftCodeStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED"]),
});

// =============================================
// INCENTIVE SCHEMAS
// =============================================

export const claimIncentiveSchema = z.object({
  rank: z.enum(["BRONZE", "SILVER", "GOLD", "PLATINUM"]),
});

// =============================================
// QUERY PARAM VALIDATORS
// =============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: result.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
      return;
    }
    req.query = result.data as any;
    next();
  };
}
