import { Router } from "express";
import { getAllPlans, getPlanById, enrollInPlan, getPlanStats, getPlanMembers, getMyEnrollments } from "../controllers/planController";
import { authenticateUser } from "../middleware/auth";
import { validate, enrollSchema } from "../middleware/validation";

const router = Router();

router.get("/", getAllPlans);
router.get("/members", getPlanMembers);
router.get("/my-enrollments", authenticateUser, getMyEnrollments);
router.get("/:planId", getPlanById);
router.get("/:planId/stats", getPlanStats);
router.post("/enroll", authenticateUser, validate(enrollSchema), enrollInPlan);

export default router;
