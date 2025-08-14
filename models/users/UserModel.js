import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", UserSchema);
