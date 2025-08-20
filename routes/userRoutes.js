// routes/userRoutes.js
import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  getMe,
  searchUsers,
  getUserById,
  getUserPosts,
  deleteMe,
} from "../controllers/userController.js";

const router = express.Router();

// Who am I
router.get("/me", verifyToken, getMe);

// Delete my account (optional purge via ?purge=1)
router.delete("/me", verifyToken, deleteMe);

// Search users
router.get("/search", verifyToken, searchUsers);

// Public profile
router.get("/:id", getUserById);

// User's posts
router.get("/:id/posts", getUserPosts);

export default router;
