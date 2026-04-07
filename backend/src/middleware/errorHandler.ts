/**
 * Global Error Handler Middleware
 */

import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Create an operational error
 */
export function createError(message: string, statusCode = 500): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}

/**
 * Global error handler
 */
export function errorHandler(
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
    return;
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      // Unique constraint violation
      const field = (err.meta?.target as string[])?.join(", ") || "field";
      res.status(409).json({
        success: false,
        message: `Duplicate value: ${field} already exists`,
      });
      return;
    }

    if (err.code === "P2025") {
      // Record not found
      res.status(404).json({
        success: false,
        message: "Record not found",
      });
      return;
    }

    res.status(400).json({
      success: false,
      message: "Database error",
      code: err.code,
    });
    return;
  }

  // Prisma validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: "Invalid database query",
    });
    return;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({ success: false, message: "Invalid token" });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({ success: false, message: "Token expired" });
    return;
  }

  // Operational errors
  const appErr = err as AppError;
  if (appErr.isOperational) {
    res.status(appErr.statusCode || 500).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unknown errors - don't leak details in production
  console.error("❌ Unhandled error:", err);

  res.status(500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
}

/**
 * 404 handler for unknown routes
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
}
