import express from "express";
import { authorizeRoles, isAuthenticatedUser } from "../middlewares/auth.js";
import { getPaymentConfigs } from "../Controllers/PaymentController.js";

const router = express.Router();


router.get(
  "/payment-config",
  isAuthenticatedUser,
  authorizeRoles("admin"),
  getPaymentConfigs,
);

export default router;
