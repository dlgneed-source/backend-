import { Router } from "express";
import { getNonce, login, getMe, refreshToken, devLogin } from "../controllers/authController";
import { authenticateUser } from "../middleware/auth";
import { validate, walletAuthSchema } from "../middleware/validation";
import config from "../config";

const router = Router();

router.get("/nonce/:walletAddress", getNonce);
router.get("/nonce", getNonce);
router.post("/login", validate(walletAuthSchema), login);
router.post("/verify", validate(walletAuthSchema), login);
if (config.NODE_ENV !== "production") {
  router.post("/dev-login", devLogin);
}
router.get("/me", authenticateUser, getMe);
router.post("/refresh", authenticateUser, refreshToken);

export default router;
