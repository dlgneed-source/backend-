import { Router } from "express";
import {
  getProfile,
  updateProfile,
  getBalance,
  getTransactions,
  getEnrollments,
  getReferralLink,
  searchUserByMemberId,
} from "../controllers/userController";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.get("/profile", authenticateUser, getProfile);
router.patch("/profile", authenticateUser, updateProfile);
router.get("/balance", authenticateUser, getBalance);
router.get("/transactions", authenticateUser, getTransactions);
router.get("/enrollments", authenticateUser, getEnrollments);
router.get("/referral-link", authenticateUser, getReferralLink);
router.get("/search", authenticateUser, searchUserByMemberId);

export default router;
