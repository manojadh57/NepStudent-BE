// routes/bookmarkRoutes.js
import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  toggleBookmark,
  listMyBookmarks,
} from "../controllers/bookmarkController.js";

const router = express.Router();

router.get("/", verifyToken, listMyBookmarks);
router.post("/:postId/toggle", verifyToken, toggleBookmark);

export default router;
