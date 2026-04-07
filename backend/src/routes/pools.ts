import { Router } from "express";
import { getAllPools, getPlanPools, getDistributions, getPoolSummary } from "../controllers/poolController";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.get("/", getAllPools);
router.get("/summary", getPoolSummary);
router.get("/distributions", getDistributions);
router.get("/:planId", getPlanPools);

export default router;
