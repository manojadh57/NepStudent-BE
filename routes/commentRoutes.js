import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  enforceCommentQuota,
  enforceWordLimit,
} from "../middlewares/limits.js";
import {
  getCommentsForPost,
  createComment,
} from "../controllers/commentController.js";

const router = express.Router();

/**
 * GET /api/v1/comments/:postId
 * List all comments for a post (flat list with parentId so UI can thread)
 */
router.get("/:postId", getCommentsForPost);

/**
 * POST /api/v1/comments
 * Body: { postId, body, parentCommentId? }
 */
router.post(
  "/",
  verifyToken,
  enforceCommentQuota,
  enforceWordLimit(300),
  createComment
);

export default router;
