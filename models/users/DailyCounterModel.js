import mongoose from "mongoose";

const DailyCounterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dateKey: { type: String, required: true },
  posts: { type: Number, default: 0 },
  comments: { type: Number, default: 0 },
  dms: { type: Number, default: 0 },
  dmUnlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

DailyCounterSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export default mongoose.model("DailyCounter", DailyCounterSchema);
