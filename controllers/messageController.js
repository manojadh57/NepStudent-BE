import Message from "../models/messages/MessageModel.js";
import { getDailyCounter } from "../utils/getDailyCounter.js";

export const sendMessage = async (req, res) => {
  try {
    const fromUserId = req.userId;
    const { toUserId, body } = req.body;

    const counter = await getDailyCounter(fromUserId);

    // Check daily DM quota
    if (counter.dms === 0 || counter.dmUnlocked) {
      counter.dms += 1;
      await counter.save();

      const message = await Message.create({ fromUserId, toUserId, body });
      return res.status(201).json({ message: "DM sent", data: message });
    }

    // Not unlocked and already used 1 DM
    return res.status(402).json({
      message: "You’ve used your free daily DM. Unlock unlimited DMs for $5.",
      checkoutUrl: "/api/v1/billing/dm-unlock/session", // frontend should hit this
    });
  } catch (err) {
    console.error("Send DM error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};

export const getInboxMessages = async (req, res) => {
  try {
    const userId = req.userId;

    const messages = await Message.find({ toUserId: userId })
      .sort({ createdAt: -1 }) // newest first
      .populate("fromUserId", "username") // show sender name
      .limit(100); // optional limit

    res.json({ inbox: messages });
  } catch (err) {
    console.error("Inbox fetch error:", err);
    res.status(500).json({ message: "Failed to load messages" });
  }
};
