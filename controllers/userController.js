// controllers/userController.js
import User from "../models/users/UserModel.js";
import Post from "../models/posts/PostModel.js";
import Comment from "../models/comment/CommentModel.js";
import Message from "../models/messages/MessageModel.js";

// GET /api/v1/users/me
export const getMe = async (req, res) => {
  try {
    const id = req.userId || req.user?._id;
    if (!id)
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });

    const u = await User.findById(id).select("_id username email status");
    if (!u) return res.status(404).json({ ok: false, error: "USER_NOT_FOUND" });

    return res.json({
      ok: true,
      user: {
        id: String(u._id),
        username: u.username,
        email: u.email,
        status: u.status,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

// GET /api/v1/users/search?q=man
export const searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    if (!q) return res.json({ ok: true, users: [] });

    const users = await User.find({
      username: { $regex: q, $options: "i" },
      status: { $ne: "suspended" },
    })
      .select("_id username")
      .limit(10);

    return res.json({
      ok: true,
      users: users.map((u) => ({ id: String(u._id), username: u.username })),
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

// GET /api/v1/users/:id
export const getUserById = async (req, res) => {
  try {
    const u = await User.findById(req.params.id).select(
      "_id username email status createdAt"
    );
    if (!u) return res.status(404).json({ ok: false, error: "USER_NOT_FOUND" });

    return res.json({
      ok: true,
      user: {
        id: String(u._id),
        username: u.username,
        email: u.email,
        status: u.status,
        joinedAt: u.createdAt,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

// GET /api/v1/users/:id/posts?page=&limit=
export const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit || "20", 10))
    );
    const skip = (page - 1) * limit;

    // Support either 'userId' or 'user' in your Post model
    const docs = await Post.find({
      $or: [{ userId }, { user: userId }],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({ path: "userId", select: "username" })
      .populate({ path: "user", select: "username" });

    const posts = docs.map((p) => {
      const u = p.userId || p.user || null;
      return {
        id: String(p._id),
        title: p.title,
        body: p.body ?? "",
        author: {
          id: u?._id ? String(u._id) : userId,
          username: u?.username || "anonymous",
        },
        createdAt: p.createdAt,
      };
    });

    return res.json({ ok: true, page, limit, posts });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

export const deleteMe = async (req, res) => {
  try {
    const id = req.userId || req.user?._id;
    if (!id)
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });

    // Optional cascade: /api/v1/users/me?purge=1
    const purge = req.query.purge === "1" || req.query.purge === "true";

    if (purge) {
      await Promise.all([
        // delete my posts
        Post.deleteMany({ $or: [{ userId: id }, { user: id }] }),
        // delete my comments
        Comment.deleteMany({ $or: [{ userId: id }, { user: id }] }),
        // delete messages I sent or received
        Message.deleteMany({
          $or: [{ fromUserId: id }, { from: id }, { toUserId: id }, { to: id }],
        }),
        // If you added these, uncomment:
        // Bookmark.deleteMany({ userId: id }),
        // Vote.deleteMany({ userId: id }),
      ]);
    }

    await User.deleteOne({ _id: id });

    // NOTE: Frontend should clear its local token after this.
    return res.json({ ok: true, deleted: true, purged: !!purge });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};
