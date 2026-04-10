/**
 * Security Middleware
 * Rate limiting, helmet, CORS configuration
 */

import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import config from "../config";

/**
 * Helmet security headers
 */
export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
});

const ALWAYS_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8080",
];

/**
 * CORS configuration
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    console.log(`[CORS] Incoming origin: ${origin ?? "(no origin)"}`);
    if (!origin) {
      // Allow non-browser requests (Postman, server-to-server)
      callback(null, true);
      return;
    }
    const allowed = ALWAYS_ALLOWED_ORIGINS.includes(origin)
      || config.CORS_ORIGINS.includes(origin)
      || config.NODE_ENV === "development";
    if (allowed) {
      console.log(`[CORS] Origin allowed: ${origin}`);
      callback(null, true);
    } else {
      console.log(`[CORS] Origin BLOCKED: ${origin}`);
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
  exposedHeaders: ["X-Request-ID"],
  maxAge: 86400,
});

/**
 * General API rate limiter
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});

/**
 * Strict rate limiter for auth endpoints
 */
export const AUTH_RATE_LIMIT_PROFILE = {
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many authentication attempts" },
} as const;
export const authRateLimiter = rateLimit({
  ...AUTH_RATE_LIMIT_PROFILE,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Withdrawal rate limiter
 */
export const WITHDRAWAL_RATE_LIMIT_PROFILE = {
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many withdrawal requests" },
} as const;
export const withdrawalRateLimiter = rateLimit({
  ...WITHDRAWAL_RATE_LIMIT_PROFILE,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Admin withdrawal-sign limiter
 */
export const WITHDRAWAL_ADMIN_RATE_LIMIT_PROFILE = {
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Too many admin withdrawal signing attempts" },
} as const;
export const withdrawalAdminRateLimiter = rateLimit({
  ...WITHDRAWAL_ADMIN_RATE_LIMIT_PROFILE,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Gift code creation limiter
 */
export const GIFT_CODE_CREATE_RATE_LIMIT_PROFILE = {
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many gift code creation attempts" },
} as const;
export const giftCodeCreateRateLimiter = rateLimit({
  ...GIFT_CODE_CREATE_RATE_LIMIT_PROFILE,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Admin critical action limiter
 */
export const ADMIN_CRITICAL_ACTION_RATE_LIMIT_PROFILE = {
  windowMs: 30 * 60 * 1000,
  max: 40,
  message: { success: false, message: "Too many critical admin actions, slow down" },
} as const;
export const adminCriticalActionRateLimiter = rateLimit({
  ...ADMIN_CRITICAL_ACTION_RATE_LIMIT_PROFILE,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Request ID middleware - adds unique ID to each request
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = req.headers["x-request-id"] || `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  req.headers["x-request-id"] = id as string;
  res.setHeader("X-Request-ID", id);
  next();
}

/**
 * Security check: Validate wallet address format
 */
export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Sanitize string input to prevent injection
 */
export function sanitizeString(input: string): string {
  return input.replace(/[<>"'`]/g, "").trim();
}
