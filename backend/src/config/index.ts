import dotenv from "dotenv";
import type { StringValue } from "ms";
dotenv.config();

function parseIntEnv(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const config = {
  // Server
  PORT: parseInt(process.env.PORT || "3001"),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost:5432/eakhuwat",

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === "production"
    ? (() => { throw new Error("JWT_SECRET environment variable is required in production"); })()
    : "eakhuwat-jwt-secret-change-in-production"),
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || "7d") as StringValue,
  JWT_ADMIN_EXPIRES_IN: (process.env.JWT_ADMIN_EXPIRES_IN || "1d") as StringValue,

  // CORS
  CORS_ORIGINS: (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:3000").split(","),

  // Blockchain / Smart Contract
  RPC_URL: process.env.RPC_URL || "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
  CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS || "",
  TREASURY_WALLET: process.env.TREASURY_WALLET || "",
  CHAIN_ID: parseIntEnv(process.env.CHAIN_ID, NaN),
  SIGNER_PRIVATE_KEY: process.env.SIGNER_PRIVATE_KEY || "",

  // EIP-712
  EIP712_DOMAIN_NAME: process.env.EIP712_DOMAIN_NAME || "eAkhuwat",
  EIP712_DOMAIN_VERSION: process.env.EIP712_DOMAIN_VERSION || "1",
  EIP712_WITHDRAWAL_TTL_SECONDS: parseIntEnv(process.env.EIP712_WITHDRAWAL_TTL_SECONDS, 3600),
  EIP712_MAX_DEADLINE_SECONDS: parseIntEnv(process.env.EIP712_MAX_DEADLINE_SECONDS, 86400),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 min
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "100"),

  // Admin
  ADMIN_WALLET: process.env.ADMIN_WALLET || "0x0000000000000000000000000000000000000001",

  // Commission levels: 4%, 2%, 1%, 1%, 1%, 0.5%, 0.5%
  COMMISSION_LEVELS: [
    { level: 1, percentage: 4 },
    { level: 2, percentage: 2 },
    { level: 3, percentage: 1 },
    { level: 4, percentage: 1 },
    { level: 5, percentage: 1 },
    { level: 6, percentage: 0.5 },
    { level: 7, percentage: 0.5 },
  ],
};

export default config;
