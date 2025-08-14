import User from "../models/users/UserModel.js";

export const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = user.status === "active" ? "suspended" : "active";
    await user.save();

    res.json({
      message: `User is now ${user.status}`,
      user: { id: user._id, username: user.username, status: user.status },
    });
  } catch (err) {
    console.error("Admin toggle error:", err);
    res.status(500).json({ message: "Could not update user status" });
  }
};
