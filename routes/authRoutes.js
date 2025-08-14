import express from "express";
import { googleLogin } from "../controllers/authController.js";

const router = express.Router();

// match the frontend: /api/v1/auth/google
router.post("/google", googleLogin);

export default router;
