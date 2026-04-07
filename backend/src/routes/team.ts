import { Router } from "express";
import {
  getDirectReferrals,
  getTeamStats,
  getTeamTree,
  getTeamCommissions,
} from "../controllers/teamController";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.get("/direct", authenticateUser, getDirectReferrals);
router.get("/stats", authenticateUser, getTeamStats);
router.get("/tree", authenticateUser, getTeamTree);
router.get("/commissions", authenticateUser, getTeamCommissions);

export default router;
