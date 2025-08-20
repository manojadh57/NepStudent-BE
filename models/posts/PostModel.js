import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true }, // keep 'body' as your DB field
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // if you use userId
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // or user — either is ok
    category: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Post", postSchema);
