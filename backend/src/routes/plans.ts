import { Router } from "express";
import { getAllPlans, getPlanById, enrollInPlan, getPlanStats } from "../controllers/planController";
import { authenticateUser } from "../middleware/auth";
import { validate, enrollSchema } from "../middleware/validation";

const router = Router();

router.get("/", getAllPlans);
router.get("/:planId", getPlanById);
router.get("/:planId/stats", getPlanStats);
router.post("/enroll", authenticateUser, validate(enrollSchema), enrollInPlan);

export default router;
