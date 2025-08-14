import Post from "../models/posts/PostModel.js";

export const createPost = async (req, res) => {
  try {
    const { title, body } = req.body;
    const userId = req.userId;

    const post = await Post.create({ userId, title, body });

    res.status(201).json({ message: "Post created", post });
  } catch (err) {
    console.error("Create Post Error:", err);
    res.status(500).json({ message: "Failed to create post" });
  }
};

export const listPosts = async (_req, res) => {
  try {
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("userId", "username");
    res.json({ posts });
  } catch (err) {
    console.error("List Posts Error:", err);
    res.status(500).json({ message: "Failed to load posts" });
  }
};
