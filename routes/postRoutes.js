import express from "express";
import {
  createPost,
  listPosts,
  getPostById,
} from "../controllers/postController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { enforcePostQuota, enforceWordLimit } from "../middlewares/limits.js";

const router = express.Router();

router.post(
  "/",
  verifyToken,
  enforcePostQuota,
  enforceWordLimit(200),
  createPost
);
router.get("/", listPosts);

router.get(":id", getPostById);

export default router;
