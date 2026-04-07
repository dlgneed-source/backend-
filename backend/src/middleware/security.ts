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

/**
 * CORS configuration
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) {
      // Allow non-browser requests (Postman, server-to-server)
      callback(null, true);
      return;
    }
    if (config.CORS_ORIGINS.includes(origin) || config.NODE_ENV === "development") {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
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
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts" },
});

/**
 * Withdrawal rate limiter
 */
export const withdrawalRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many withdrawal requests" },
});

/**
 * Request ID middleware - adds unique ID to each request
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const id = req.headers["x-request-id"] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
