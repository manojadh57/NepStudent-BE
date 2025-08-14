import Comment from "../models/comment/CommentModel.js";
import User from "../models/users/UserModel.js";

// Build threaded tree
function buildCommentTree(comments) {
  const map = {};
  const roots = [];

  comments.forEach((comment) => {
    comment.children = [];
    map[comment._id.toString()] = comment;
  });

  comments.forEach((comment) => {
    if (comment.parentCommentId) {
      const parent = map[comment.parentCommentId.toString()];
      if (parent) parent.children.push(comment);
    } else {
      roots.push(comment);
    }
  });

  return roots;
}

// ✅ GET /posts/:id/comments
export const getCommentsForPost = async (req, res) => {
  try {
    const { id: postId } = req.params;

    const comments = await Comment.find({ postId })
      .sort({ createdAt: 1 })
      .lean();

    // Optional: include usernames
    const userIds = [...new Set(comments.map((c) => c.userId?.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).select(
      "_id username"
    );
    const userMap = {};
    users.forEach((u) => (userMap[u._id] = u.username));

    // Inject usernames into comments
    comments.forEach((comment) => {
      comment.username = userMap[comment.userId?.toString()] || "unknown";
    });

    const threaded = buildCommentTree(comments);
    res.json({ comments: threaded });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Failed to load comments" });
  }
};

// ✅ POST /comments
export const createComment = async (req, res) => {
  try {
    const { postId, parentCommentId = null, body } = req.body;

    const comment = new Comment({
      postId,
      userId: req.userId,
      parentCommentId,
      body,
      createdAt: new Date(),
    });

    await comment.save();
    res.status(201).json({ message: "Comment created." });
  } catch (err) {
    console.error("Error posting comment:", err);
    res.status(500).json({ message: "Failed to post comment" });
  }
};
