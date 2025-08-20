import Post from "../models/posts/PostModel.js";

/** Keep response shape simple and consistent */
function serialize(p) {
  const u = p.userId || p.user || null;
  return {
    id: String(p._id),
    title: p.title,
    body: p.body ?? "", // DB uses 'body'
    author: {
      id: u?._id ? String(u._id) : null,
      username: u?.username || "anonymous",
    },
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// helper to read owner id regardless of field/population
const ownerIdOf = (doc) =>
  String(doc.userId?._id || doc.userId || doc.user?._id || doc.user || "");

/** GET /api/v1/posts?page=&limit= */
export const getAllPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit || "20", 10))
    );
    const skip = (page - 1) * limit;

    const docs = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      // populate whichever ref your schema uses
      .populate({ path: "userId", select: "username" })
      .populate({ path: "user", select: "username" });

    const posts = docs.map(serialize);
    return res.json({ ok: true, page, limit, posts });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

/** GET /api/v1/posts/:id */
export const getPost = async (req, res) => {
  try {
    const doc = await Post.findById(req.params.id)
      .populate({ path: "userId", select: "username" })
      .populate({ path: "user", select: "username" });

    if (!doc) {
      return res.status(404).json({ ok: false, error: "POST_NOT_FOUND" });
    }
    return res.json({ ok: true, post: serialize(doc) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

/** POST /api/v1/posts  { title, body }  (also accepts { content } and maps to body) */
export const createPost = async (req, res) => {
  try {
    const title = (req.body?.title || "").trim();
    const body = (req.body?.body ?? req.body?.content ?? "").toString().trim();

    if (!title || !body) {
      return res.status(400).json({
        ok: false,
        error: "VALIDATION_ERROR",
        message: "title and body are required",
      });
    }

    // req.userId or req.user._id should be set by your auth middleware
    const authorId = req.userId || req.user?._id;
    if (!authorId) {
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
    }

    const created = await Post.create({
      title,
      body, // save as 'body' consistently
      userId: authorId, // if your schema uses 'userId'
      user: authorId, // if your schema uses 'user'
    });

    // populate username for response
    await created
      .populate({ path: "userId", select: "username" })
      .populate({ path: "user", select: "username" });

    return res.status(201).json({ ok: true, post: serialize(created) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

// PATCH /api/v1/posts/:id   { title?, body? }  (also accepts 'content')
export const updatePost = async (req, res) => {
  try {
    const me = String(req.userId || req.user?._id || "");
    const postId = req.params.id;

    const post = await Post.findById(postId)
      .populate({ path: "userId", select: "username" })
      .populate({ path: "user", select: "username" });

    if (!post)
      return res.status(404).json({ ok: false, error: "POST_NOT_FOUND" });

    if (me !== ownerIdOf(post)) {
      return res.status(403).json({ ok: false, error: "FORBIDDEN" });
    }

    const title = req.body?.title;
    const body = req.body?.body ?? req.body?.content;

    if (title !== undefined) post.title = String(title).trim();
    if (body !== undefined) post.body = String(body).trim();

    await post.save();
    await post
      .populate({ path: "userId", select: "username" })
      .populate({ path: "user", select: "username" });

    const u = post.userId || post.user || null;
    return res.json({
      ok: true,
      post: {
        id: String(post._id),
        title: post.title,
        body: post.body ?? "",
        author: {
          id: u?._id ? String(u._id) : ownerIdOf(post),
          username: u?.username || "anonymous",
        },
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

// DELETE /api/v1/posts/:id
export const deletePost = async (req, res) => {
  try {
    const me = String(req.userId || req.user?._id || "");
    const postId = req.params.id;

    const post = await Post.findById(postId).select("_id userId user");
    if (!post)
      return res.status(404).json({ ok: false, error: "POST_NOT_FOUND" });

    if (me !== ownerIdOf(post)) {
      return res.status(403).json({ ok: false, error: "FORBIDDEN" });
    }

    await Post.deleteOne({ _id: postId });
    return res.json({ ok: true, deleted: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};
