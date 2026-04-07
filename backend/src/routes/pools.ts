import { Router } from "express";
import { getAllPools, getPlanPools, getDistributions, getPoolSummary, getPoolStats } from "../controllers/poolController";

const router = Router();

router.get("/", getAllPools);
router.get("/stats", getPoolStats);
router.get("/summary", getPoolSummary);
router.get("/distributions", getDistributions);
router.get("/:planId", getPlanPools);

export default router;
