import { Router } from "express";
import {
  generateGiftCode,
  redeemGiftCode,
  getMyGiftCodes,
  validateGiftCode,
} from "../controllers/giftCodeController";
import { authenticateAdmin, authenticateUser, requireAdminRoles } from "../middleware/auth";
import { validate, createGiftCodeSchema, redeemGiftCodeSchema } from "../middleware/validation";

const router = Router();

router.post("/generate", authenticateAdmin, requireAdminRoles(["SUPER_ADMIN", "ADMIN"]), validate(createGiftCodeSchema), generateGiftCode);
router.post("/redeem", authenticateUser, validate(redeemGiftCodeSchema), redeemGiftCode);
router.get("/my", authenticateUser, getMyGiftCodes);
router.get("/:code/validate", validateGiftCode);

export default router;
