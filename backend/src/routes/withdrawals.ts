import { Router } from "express";
import {
  requestWithdrawal,
  signWithdrawalRequest,
  getMyWithdrawals,
  confirmWithdrawal,
} from "../controllers/withdrawalController";
import { authenticateAdmin, authenticateUser, requireAdminRoles } from "../middleware/auth";
import { withdrawalRateLimiter } from "../middleware/security";
import { validate, withdrawalRequestSchema, withdrawalSignSchema } from "../middleware/validation";

const router = Router();

router.post("/request", authenticateUser, withdrawalRateLimiter, validate(withdrawalRequestSchema), requestWithdrawal);
router.post("/sign", authenticateAdmin, requireAdminRoles(["SUPER_ADMIN", "ADMIN"]), validate(withdrawalSignSchema), signWithdrawalRequest);
router.get("/my", authenticateUser, getMyWithdrawals);
router.post("/:id/confirm", authenticateUser, confirmWithdrawal);

export default router;
