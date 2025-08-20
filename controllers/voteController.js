// controllers/voteController.js
import Vote from "../models/votes/VoteModel.js";

function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(String(id));
}

async function summarize(targetType, targetId, maybeUserId) {
  const [up, down, mine] = await Promise.all([
    Vote.countDocuments({ targetType, targetId, value: 1 }),
    Vote.countDocuments({ targetType, targetId, value: -1 }),
    maybeUserId
      ? Vote.findOne({ targetType, targetId, userId: maybeUserId }).lean()
      : null,
  ]);
  return { up, down, score: up - down, myVote: mine?.value ?? 0 };
}

async function setVote(req, res, targetType) {
  try {
    const userId = req.userId || req.user?._id;
    if (!userId)
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });

    const targetId = req.params.id;
    if (!isValidObjectId(targetId)) {
      return res.status(400).json({ ok: false, error: "INVALID_ID" });
    }

    const dirRaw = req.body?.dir;
    const dir = Number(dirRaw);
    if (![1, 0, -1].includes(dir)) {
      return res
        .status(400)
        .json({
          ok: false,
          error: "INVALID_DIR",
          message: "dir must be 1, 0, or -1",
        });
    }

    const existing = await Vote.findOne({ userId, targetType, targetId });

    if (dir === 0) {
      if (existing) await Vote.deleteOne({ _id: existing._id });
      const summary = await summarize(targetType, targetId, userId);
      return res.json({ ok: true, ...summary });
    }

    if (!existing) {
      await Vote.create({ userId, targetType, targetId, value: dir });
    } else if (existing.value === dir) {
      // same vote -> toggle off
      await Vote.deleteOne({ _id: existing._id });
    } else {
      // switch vote
      existing.value = dir;
      await existing.save();
    }

    const summary = await summarize(targetType, targetId, userId);
    return res.status(201).json({ ok: true, ...summary });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
}

async function getVotes(req, res, targetType) {
  try {
    const targetId = req.params.id;
    if (!isValidObjectId(targetId)) {
      return res.status(400).json({ ok: false, error: "INVALID_ID" });
    }
    const maybeUserId = req.userId || req.user?._id; // optional (if header present)
    const summary = await summarize(targetType, targetId, maybeUserId);
    return res.json({ ok: true, ...summary });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
}

/* --------- Exports for Posts --------- */
export const votePost = (req, res) => setVote(req, res, "post");
export const getPostVotes = (req, res) => getVotes(req, res, "post");

/* --------- Exports for Comments ------ */
export const voteComment = (req, res) => setVote(req, res, "comment");
export const getCommentVotes = (req, res) => getVotes(req, res, "comment");
