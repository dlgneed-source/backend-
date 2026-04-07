import { Router } from "express";
import { getNonce, login, getMe, refreshToken, devLogin } from "../controllers/authController";
import { authenticateUser } from "../middleware/auth";
import { authRateLimiter } from "../middleware/security";
import { validate, walletAuthSchema } from "../middleware/validation";
import config from "../config";

const router = Router();

router.get("/nonce/:walletAddress", authRateLimiter, getNonce);
router.post("/login", authRateLimiter, validate(walletAuthSchema), login);
if (config.NODE_ENV !== "production") {
  router.post("/dev-login", authRateLimiter, devLogin);
}
router.get("/me", authenticateUser, getMe);
router.post("/refresh", authenticateUser, refreshToken);

export default router;
