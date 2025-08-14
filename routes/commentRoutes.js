import express from "express";
import {
  createComment,
  getCommentsByPost,
} from "../controllers/commentController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  enforceCommentQuota,
  enforceWordLimit,
} from "../middlewares/limits.js";

const router = express.Router();

// Create comment
router.post(
  "/",
  verifyToken,
  enforceCommentQuota,
  enforceWordLimit(200),
  createComment
);

// ✅ Get all comments for a post
router.get("/:postId", getCommentsByPost); // No auth needed for read

export default router;
