import { Router } from "express";
import { getPlanEconomics } from "../controllers/systemController";

const router = Router();

router.get("/plan-economics", getPlanEconomics);

export default router;
