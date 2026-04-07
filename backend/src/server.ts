/**
 * eAkhuwat Production Backend Server
 */

import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

import config from "./config";
import { helmetMiddleware, corsMiddleware, apiRateLimiter, requestIdMiddleware } from "./middleware/security";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Routes
import authRoutes from "./routes/auth";
import planRoutes from "./routes/plans";
import userRoutes from "./routes/users";
import teamRoutes from "./routes/team";
import withdrawalRoutes from "./routes/withdrawals";
import giftCodeRoutes from "./routes/giftCodes";
import incentiveRoutes from "./routes/incentives";
import poolRoutes from "./routes/pools";
import adminRoutes from "./routes/admin";

// Utils
import { initCronJobs } from "./utils/cronJobs";
import { initSmartContract } from "./utils/smartContract";

const app = express();

// =============================================
// MIDDLEWARE
// =============================================

app.use(requestIdMiddleware);
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

if (config.NODE_ENV !== "test") {
  app.use(morgan(config.NODE_ENV === "production" ? "combined" : "dev"));
}

// Apply general rate limiter
app.use("/api", apiRateLimiter);

// =============================================
// HEALTH CHECK
// =============================================

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: config.NODE_ENV,
  });
});

// =============================================
// API ROUTES
// =============================================

app.use("/api/auth", authRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/users", userRoutes);
app.use("/api/team", teamRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/gift-codes", giftCodeRoutes);
app.use("/api/incentives", incentiveRoutes);
app.use("/api/pools", poolRoutes);
app.use("/api/admin", adminRoutes);

// =============================================
// ERROR HANDLING
// =============================================

app.use(notFoundHandler);
app.use(errorHandler);

// =============================================
// START SERVER
// =============================================

async function startServer() {
  try {
    // Initialize smart contract connection
    initSmartContract();

    // Start cron jobs (skip in test mode)
    if (config.NODE_ENV !== "test") {
      initCronJobs();
    }

    app.listen(config.PORT, () => {
      console.log(`
╔═══════════════════════════════════════════╗
║        eAkhuwat Backend Server            ║
╠═══════════════════════════════════════════╣
║  Port:       ${config.PORT}                          ║
║  Environment: ${config.NODE_ENV.padEnd(28)}║
║  Contract:   ${config.CONTRACT_ADDRESS.slice(0, 20)}...   ║
╚═══════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("⏹️  SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("⏹️  SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

startServer();

export default app;
