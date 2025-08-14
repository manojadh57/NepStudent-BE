import express from "express";
import { createDMUnlockSession } from "../controllers/billingController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// Create Stripe session to unlock DMs
router.post("/dm-unlock/session", verifyToken, createDMUnlockSession);

export default router;
