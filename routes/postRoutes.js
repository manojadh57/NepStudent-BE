import express from "express";
import {
  getAllPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} from "../controllers/postController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { enforcePostQuota, enforceWordLimit } from "../middlewares/limits.js";

const router = express.Router();
router.get("/", getAllPosts);
router.post(
  "/",
  verifyToken,
  enforcePostQuota,
  enforceWordLimit(200),
  createPost
);
router.get("/:id", getPost);
router.patch("/:id", verifyToken, updatePost);
router.delete("/:id", verifyToken, deletePost);
export default router;
