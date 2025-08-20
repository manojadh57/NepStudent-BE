import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/users/UserModel.js"; // adjust path if needed

const google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyToken = async (req, res, next) => {
  try {
    const bearer =
      req.headers.authorization?.split(" ")[1] || req.cookies?.accessToken;
    if (!bearer)
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });

    // 1) Try our own JWT first (fast)
    try {
      const p = jwt.verify(bearer, process.env.JWT_SECRET);
      req.userId = p.sub || p.id || p._id;
      req.user = { _id: req.userId, username: p.username };
      return next();
    } catch (_) {}

    // 2) Fallback: treat it as a Google ID token
    try {
      const ticket = await google.verifyIdToken({
        idToken: bearer,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload(); // { sub, email, name, ... }
      const googleId = payload.sub;

      let user = await User.findOne({ googleId }).select("_id username");
      if (!user && payload.email) {
        user = await User.findOne({ email: payload.email }).select(
          "_id username"
        );
      }
      if (!user)
        return res
          .status(401)
          .json({ ok: false, error: "UNREGISTERED_GOOGLE_USER" });

      req.userId = String(user._id);
      req.user = { _id: req.userId, username: user.username };
      return next();
    } catch (_) {
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};
