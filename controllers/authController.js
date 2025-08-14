import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import User from "../models/users/UserModel.js";
import { generateUsername } from "../utils/generateUsername.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const sign = (payload, expiresIn) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Missing token" });

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ googleId });
    if (!user) {
      const username = generateUsername();
      user = await User.create({ googleId, email, username });
    }

    const accessToken = sign({ userId: user._id }, "15m");
    const refreshToken = sign({ userId: user._id }, "7d");

    res.json({
      accessToken,
      refreshToken,
      username: user.username,
      userId: user._id,
    });
  } catch (err) {
    console.error("Google Login Error:", err.message);
    res.status(401).json({ message: "Google authentication failed." });
  }
};
