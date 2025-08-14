import express from "express";
import {
  sendMessage,
  getInboxMessages,
} from "../controllers/messageController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { enforceDMQuota, enforceWordLimit } from "../middlewares/limits.js";

const router = express.Router();

// Send a DM (1 free/day, else 402 Payment Required)
router.post(
  "/",
  verifyToken,
  enforceDMQuota,
  enforceWordLimit(100),
  sendMessage
);

//get message//
router.get("/inbox", verifyToken, getInboxMessages);

export default router;
