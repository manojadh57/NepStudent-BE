import Comment from "../models/comment/CommentModel.js";

export const createComment = async (req, res) => {
  try {
    const { postId, parentCommentId = null, body } = req.body;
    const userId = req.userId;

    const comment = await Comment.create({
      postId,
      userId,
      parentCommentId,
      body,
      depth: parentCommentId ? 1 : 0,
    });

    res.status(201).json({ message: "Comment posted", comment });
  } catch (err) {
    console.error("Create Comment Error:", err);
    res.status(500).json({ message: "Failed to create comment" });
  }
};

export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await Comment.find({ postId })
      .sort({ createdAt: 1 }) // oldest first
      .populate("userId", "username"); // to show who wrote it

    res.json({ comments });
  } catch (err) {
    console.error("Fetch Comments Error:", err);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};
