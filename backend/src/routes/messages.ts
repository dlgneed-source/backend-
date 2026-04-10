import { Router } from "express";
import { getDmHistory, sendDm } from "../controllers/messagesController";
import { authenticateUser } from "../middleware/auth";

const router = Router();

router.get("/dm/:userId", authenticateUser, getDmHistory);
router.post("/dm", authenticateUser, sendDm);

export default router;
