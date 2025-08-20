// models/bookmarks/BookmarkModel.js
import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },
  },
  { timestamps: true }
);

// one bookmark per user per post
bookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });

export default mongoose.model("Bookmark", bookmarkSchema);
