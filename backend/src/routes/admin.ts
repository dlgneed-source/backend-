import { Router } from "express";
import {
  getAdminNonce,
  adminLogin,
  getDashboard,
  getUsers,
  updateUserStatus,
  getWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  manualFlushout,
  getIncentiveClaims,
  approveIncentiveClaim,
  adminCreateGiftCode,
  getSystemConfig,
  updateSystemConfig,
  getAuditLogs,
  getTreasury,
} from "../controllers/adminController";
import { authenticateAdmin, requireSuperAdmin } from "../middleware/auth";
import { authRateLimiter } from "../middleware/security";
import {
  validate,
  adminLoginSchema,
  updateUserStatusSchema,
  approveWithdrawalSchema,
  rejectWithdrawalSchema,
  systemConfigSchema,
  createGiftCodeSchema,
} from "../middleware/validation";

const router = Router();

// Auth
router.get("/nonce/:walletAddress", authRateLimiter, getAdminNonce);
router.post("/login", authRateLimiter, validate(adminLoginSchema), adminLogin);

// Dashboard
router.get("/dashboard", authenticateAdmin, getDashboard);

// Users
router.get("/users", authenticateAdmin, getUsers);
router.patch("/users/:userId/status", authenticateAdmin, validate(updateUserStatusSchema), updateUserStatus);

// Withdrawals
router.get("/withdrawals", authenticateAdmin, getWithdrawals);
router.patch("/withdrawals/:withdrawalId/approve", authenticateAdmin, approveWithdrawal);
router.patch("/withdrawals/:withdrawalId/reject", authenticateAdmin, validate(rejectWithdrawalSchema), rejectWithdrawal);

// Flushout
router.post("/flushout/:enrollmentId", authenticateAdmin, manualFlushout);

// Incentives
router.get("/incentive-claims", authenticateAdmin, getIncentiveClaims);
router.patch("/incentive-claims/:claimId/approve", authenticateAdmin, approveIncentiveClaim);

// Gift Codes
router.post("/gift-codes", authenticateAdmin, validate(createGiftCodeSchema), adminCreateGiftCode);

// Config (super admin only)
router.get("/config", authenticateAdmin, requireSuperAdmin, getSystemConfig);
router.put("/config/:key", authenticateAdmin, requireSuperAdmin, validate(systemConfigSchema), updateSystemConfig);

// Audit
router.get("/audit-logs", authenticateAdmin, getAuditLogs);

// Treasury
router.get("/treasury", authenticateAdmin, getTreasury);

export default router;
