import express from "express";
import { toggleUserStatus } from "../controllers/adminController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
// You can later add an isAdmin middleware here

const router = express.Router();

// ✅ Suspend or unsuspend a user (toggle)
router.patch("/users/:userId", verifyToken, toggleUserStatus);

export default router;
