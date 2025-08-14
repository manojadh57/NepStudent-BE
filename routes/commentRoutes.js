import express from "express";
import {
  getCommentsForPost,
  createComment,
} from "../controllers/commentController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  enforceCommentQuota,
  enforceWordLimit,
} from "../middlewares/limits.js";

const router = express.Router();

// ✅ Create a new comment (root or reply)
router.post(
  "/comments",
  verifyToken,
  enforceCommentQuota,
  enforceWordLimit(200),
  createComment
);

// ✅ Get all comments (threaded) for a post
router.get("/posts/:id/comments", getCommentsForPost);

export default router;
