import { Router } from "express";
import {
  getProgress,
  getIncentiveTiers,
  claimClub,
  checkIndividual,
  getMyClaims,
} from "../controllers/incentiveController";
import { authenticateUser } from "../middleware/auth";
import { validate, claimIncentiveSchema } from "../middleware/validation";

const router = Router();

router.get("/tiers", getIncentiveTiers);
router.get("/progress", authenticateUser, getProgress);
router.post("/claim/club", authenticateUser, validate(claimIncentiveSchema), claimClub);
router.get("/check-individual/:planId", authenticateUser, checkIndividual);
router.get("/claims", authenticateUser, getMyClaims);

export default router;
