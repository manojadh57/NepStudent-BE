import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  votePost,
  voteComment,
  getPostVotes,
  getCommentVotes,
} from "../controllers/voteController.js";

const router = express.Router();

/* Public counts (optionally includes myVote if you send Authorization) */
router.get("/posts/:id", getPostVotes);
router.get("/comments/:id", getCommentVotes);

/* Cast/clear votes (requires Authorization) */
router.post("/posts/:id", verifyToken, votePost); // body: { dir: 1 | 0 | -1 }
router.post("/comments/:id", verifyToken, voteComment); // body: { dir: 1 | 0 | -1 }

export default router;
