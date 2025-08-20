import Bookmark from "../models/bookmarks/BookmarkModel.js";
import Post from "../models/posts/PostModel.js";

function isValidObjectId(id) {
  return /^[a-fA-F0-9]{24}$/.test(String(id));
}

function serializePost(p) {
  const u = p.userId || p.user || null;
  return {
    id: String(p._id),
    title: p.title,
    body: p.body ?? "",
    author: {
      id: u?._id ? String(u._id) : null,
      username: u?.username || "anonymous",
    },
    createdAt: p.createdAt,
  };
}

// POST /api/v1/bookmarks/:postId/toggle
export const toggleBookmark = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    if (!userId)
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });

    const postId = req.params.postId;
    if (!isValidObjectId(postId)) {
      return res.status(400).json({ ok: false, error: "INVALID_ID" });
    }

    const post = await Post.findById(postId).select("_id");
    if (!post)
      return res.status(404).json({ ok: false, error: "POST_NOT_FOUND" });

    const existing = await Bookmark.findOne({ userId, postId });
    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.json({ ok: true, bookmarked: false });
    }

    await Bookmark.create({ userId, postId });
    return res.status(201).json({ ok: true, bookmarked: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

// GET /api/v1/bookmarks?page=&limit=
export const listMyBookmarks = async (req, res) => {
  try {
    const userId = req.userId || req.user?._id;
    if (!userId)
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });

    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit || "20", 10))
    );
    const skip = (page - 1) * limit;

    const docs = await Bookmark.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "postId",
        select: "title body userId user createdAt",
        populate: [
          { path: "userId", select: "username" },
          { path: "user", select: "username" },
        ],
      });

    // filter out bookmarks whose posts were deleted
    const items = docs
      .filter((b) => b.postId)
      .map((b) => serializePost(b.postId));

    return res.json({ ok: true, page, limit, posts: items });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};
