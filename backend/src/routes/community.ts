import { Router } from "express";
import { getCommunityBootstrap } from "../controllers/communityController";

const router = Router();

router.get("/bootstrap", getCommunityBootstrap);

export default router;
