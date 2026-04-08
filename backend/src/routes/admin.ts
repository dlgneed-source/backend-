import { Router } from "express";
import {
  getAdminNonce,
  adminLogin,
  adminCredentialLogin,
  linkAdminWallet,
  getDashboard,
  getPlanMetrics,
  getPoolMetrics,
  withdrawPoolFunds,
  getUsers,
  updateUserStatus,
  getWithdrawals,
  manualFlushout,
  getFlushouts,
  getIncentiveClaims,
  approveIncentiveClaim,
  getRewardsMetrics,
  triggerKillSwitch,
  getAdminGiftCodes,
  adminCreateGiftCode,
  updateAdminGiftCodeStatus,
  getSystemConfig,
  updateSystemConfig,
  getAuditLogs,
  getTreasury,
} from "../controllers/adminController";
import { authenticateAdmin, requireAdminRoles, requireSuperAdmin } from "../middleware/auth";
import { adminCriticalActionRateLimiter, authRateLimiter, giftCodeCreateRateLimiter } from "../middleware/security";
import {
  validate,
  adminLoginSchema,
  adminCredentialLoginSchema,
  adminLinkWalletSchema,
  updateUserStatusSchema,
  systemConfigSchema,
  createGiftCodeSchema,
  adminUpdateGiftCodeStatusSchema,
  adminPoolWithdrawSchema,
  adminKillSwitchSchema,
  adminManualFlushoutSchema,
} from "../middleware/validation";

const router = Router();
const withdrawPoolMiddleware = [
  authenticateAdmin,
  requireAdminRoles(["SUPER_ADMIN", "ADMIN"]),
  validate(adminPoolWithdrawSchema),
] as const;

// Auth
router.get("/nonce/:walletAddress", authRateLimiter, getAdminNonce);
router.post("/login", authRateLimiter, validate(adminLoginSchema), adminLogin);
router.post("/login/credentials", authRateLimiter, validate(adminCredentialLoginSchema), adminCredentialLogin);
router.post("/link-wallet", authenticateAdmin, validate(adminLinkWalletSchema), linkAdminWallet);

// Dashboard
router.get("/dashboard", authenticateAdmin, getDashboard);
router.get("/plan-metrics", authenticateAdmin, getPlanMetrics);
router.get("/pool-metrics", authenticateAdmin, getPoolMetrics);
router.post("/pools/withdraw", adminCriticalActionRateLimiter, ...withdrawPoolMiddleware, withdrawPoolFunds);

// Users
router.get("/users", authenticateAdmin, getUsers);
router.patch("/users/:userId/status", authenticateAdmin, validate(updateUserStatusSchema), updateUserStatus);

// Withdrawals
router.get("/withdrawals", authenticateAdmin, getWithdrawals);

// Flushout
router.post("/flushout/:enrollmentId", authenticateAdmin, adminCriticalActionRateLimiter, validate(adminManualFlushoutSchema), manualFlushout);
router.get("/flushouts", authenticateAdmin, getFlushouts);

// Incentives
router.get("/incentive-claims", authenticateAdmin, getIncentiveClaims);
router.patch("/incentive-claims/:claimId/approve", authenticateAdmin, approveIncentiveClaim);
router.get("/rewards-metrics", authenticateAdmin, getRewardsMetrics);

// Gift Codes
router.get("/gift-codes", authenticateAdmin, getAdminGiftCodes);
router.post("/gift-codes", authenticateAdmin, giftCodeCreateRateLimiter, requireAdminRoles(["SUPER_ADMIN", "ADMIN"]), validate(createGiftCodeSchema), adminCreateGiftCode);
router.patch("/gift-codes/:giftCodeId/status", authenticateAdmin, requireAdminRoles(["SUPER_ADMIN", "ADMIN"]), validate(adminUpdateGiftCodeStatusSchema), updateAdminGiftCodeStatus);

// Config (super admin only)
router.get("/config", authenticateAdmin, requireSuperAdmin, getSystemConfig);
router.put("/config/:key", authenticateAdmin, requireSuperAdmin, validate(systemConfigSchema), updateSystemConfig);
router.post("/kill-switch/trigger", authenticateAdmin, adminCriticalActionRateLimiter, requireSuperAdmin, validate(adminKillSwitchSchema), triggerKillSwitch);

// Audit
router.get("/audit-logs", authenticateAdmin, getAuditLogs);

// Treasury
router.get("/treasury", authenticateAdmin, getTreasury);

export default router;
