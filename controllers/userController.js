import User from "../models/users/UserModel.js";
import { getDailyCounter } from "../utils/getDailyCounter.js";

export const getMe = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select(
      "username email status createdAt"
    );
    const quota = await getDailyCounter(userId);

    res.json({
      user,
      quota: {
        posts: quota.posts,
        comments: quota.comments,
        dms: quota.dms,
        dmUnlocked: quota.dmUnlocked,
      },
    });
  } catch (err) {
    console.error("Fetch /me error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};
