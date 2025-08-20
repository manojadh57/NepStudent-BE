import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import { enforceDMQuota, enforceWordLimit } from "../middlewares/limits.js";
import {
  sendMessage,
  getInbox,
  getOutbox,
  getThread,
} from "../controllers/messageController.js";

const router = express.Router();

// List messages you received
// GET /api/v1/messages/inbox
router.get("/inbox", verifyToken, getInbox);

// List messages you sent
// GET /api/v1/messages/outbox
router.get("/outbox", verifyToken, getOutbox);

// Full conversation with a specific user (both directions)
// GET /api/v1/messages/thread/:userId
router.get("/thread/:userId", verifyToken, getThread);

// Send a DM (1/day free per your enforceDMQuota)
// POST /api/v1/messages  { toUserId, body }
router.post(
  "/",
  verifyToken,
  enforceDMQuota,
  enforceWordLimit(500),
  sendMessage
);

export default router;
