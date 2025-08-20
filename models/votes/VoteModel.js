// models/votes/VoteModel.js
import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: { type: String, enum: ["post", "comment"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    value: { type: Number, enum: [-1, 1], required: true }, // -1 = down, +1 = up
  },
  { timestamps: true }
);

// one vote per user per target
voteSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
// fast counts per target
voteSchema.index({ targetType: 1, targetId: 1, value: 1 });

export default mongoose.model("Vote", voteSchema);
