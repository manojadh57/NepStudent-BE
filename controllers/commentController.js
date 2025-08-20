import Comment from "../models/comment/CommentModel.js"; // default export
import Post from "../models/posts/PostModel.js"; // default export

function serialize(c) {
  const u = c.userId || c.user || null;
  const postRef = c.postId ?? c.post ?? null;

  return {
    id: String(c._id),
    postId: postRef ? String(postRef) : null,
    body: c.body ?? c.content ?? "",
    parentId: c.parentCommentId ? String(c.parentCommentId) : null,
    depth: c.depth ?? 0,
    author: {
      id: u?._id ? String(u._id) : null,
      username: u?.username || "anonymous",
    },
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

/** GET /api/v1/comments/:postId */
export const getCommentsForPost = async (req, res) => {
  try {
    const postId = req.params.postId;

    // Ensure the post exists for a clean 404
    const post = await Post.findById(postId).select("_id");
    if (!post) {
      return res.status(404).json({ ok: false, error: "POST_NOT_FOUND" });
    }

    // Support either 'postId' or 'post' in your Comment schema
    const docs = await Comment.find({
      $or: [{ postId }, { post: postId }],
    })
      .sort({ createdAt: 1 })
      .populate({ path: "userId", select: "username" })
      .populate({ path: "user", select: "username" });

    const comments = docs.map(serialize);
    return res.json({ ok: true, comments });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

/** POST /api/v1/comments  { postId, body, parentCommentId? } */
export const createComment = async (req, res) => {
  try {
    const authorId = req.userId || req.user?._id;
    if (!authorId) {
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
    }

    const postId = (req.body?.postId || "").toString().trim();
    const body = (req.body?.body ?? req.body?.content ?? "").toString().trim();
    const parentCommentId = req.body?.parentCommentId || null;

    if (!postId || !body) {
      return res.status(400).json({
        ok: false,
        error: "VALIDATION_ERROR",
        message: "postId and body are required",
      });
    }

    // Validate post exists
    const post = await Post.findById(postId).select("_id");
    if (!post) {
      return res.status(404).json({ ok: false, error: "POST_NOT_FOUND" });
    }

    // Optional parent -> compute depth (cap at 3)
    let depth = 0;
    let parent = null;
    if (parentCommentId) {
      parent = await Comment.findById(parentCommentId).select(
        "depth postId post"
      );
      if (!parent)
        return res.status(400).json({ ok: false, error: "INVALID_PARENT" });

      const parentPost = String(parent.postId ?? parent.post ?? "");
      if (parentPost !== String(post._id)) {
        return res.status(400).json({ ok: false, error: "PARENT_MISMATCH" });
      }
      depth = Math.min(3, (parent.depth || 0) + 1);
    }

    // Create (write to both common field names so your schema is covered)
    const created = await Comment.create({
      body,
      postId: post._id,
      post: post._id,
      parentCommentId: parent ? parent._id : null,
      depth,
      userId: authorId,
      user: authorId,
    });

    // Populate author for response
    await created
      .populate({ path: "userId", select: "username" })
      .populate({ path: "user", select: "username" });

    return res.status(201).json({ ok: true, comment: serialize(created) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};
