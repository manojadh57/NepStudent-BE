import Message from "../models/messages/MessageModel.js";
import User from "../models/users/UserModel.js";

function serialize(m) {
  const from = m.fromUserId || m.from || null;
  const to = m.toUserId || m.to || null;

  return {
    id: String(m._id),
    from: {
      id: from?._id ? String(from._id) : null,
      username: from?.username || "anonymous",
    },
    to: {
      id: to?._id ? String(to._id) : null,
      username: to?.username || "anonymous",
    },
    body: m.body ?? m.content ?? "",
    createdAt: m.createdAt,
  };
}

/**
 * POST /api/v1/messages
 * Body: { toUserId, body }
 */
export const sendMessage = async (req, res) => {
  try {
    const fromId = req.userId || req.user?._id;
    if (!fromId) {
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
    }

    const toUserId = (req.body?.toUserId || "").toString().trim();
    const body = (req.body?.body ?? req.body?.content ?? "").toString().trim();

    if (!toUserId || !body) {
      return res
        .status(400)
        .json({
          ok: false,
          error: "VALIDATION_ERROR",
          message: "toUserId and body are required",
        });
    }
    if (toUserId === String(fromId)) {
      return res.status(400).json({ ok: false, error: "CANNOT_MESSAGE_SELF" });
    }

    const recipient = await User.findById(toUserId).select("_id username");
    if (!recipient) {
      return res.status(404).json({ ok: false, error: "RECIPIENT_NOT_FOUND" });
    }

    // Write to both common field names so your existing schema is covered
    const created = await Message.create({
      body,
      fromUserId: fromId,
      from: fromId,
      toUserId,
      to: toUserId,
    });

    await created
      .populate({ path: "fromUserId", select: "username" })
      .populate({ path: "from", select: "username" })
      .populate({ path: "toUserId", select: "username" })
      .populate({ path: "to", select: "username" });

    return res.status(201).json({ ok: true, message: serialize(created) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

/**
 * GET /api/v1/messages/inbox
 * Messages sent to me
 */
export const getInbox = async (req, res) => {
  try {
    const me = req.userId || req.user?._id;
    if (!me) {
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
    }

    const docs = await Message.find({
      $or: [{ toUserId: me }, { to: me }],
    })
      .sort({ createdAt: -1 })
      .populate({ path: "fromUserId", select: "username" })
      .populate({ path: "from", select: "username" })
      .populate({ path: "toUserId", select: "username" })
      .populate({ path: "to", select: "username" });

    return res.json({ ok: true, messages: docs.map(serialize) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

/**
 * GET /api/v1/messages/outbox
 * Messages I sent
 */
export const getOutbox = async (req, res) => {
  try {
    const me = req.userId || req.user?._id;
    if (!me) {
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
    }

    const docs = await Message.find({
      $or: [{ fromUserId: me }, { from: me }],
    })
      .sort({ createdAt: -1 })
      .populate({ path: "fromUserId", select: "username" })
      .populate({ path: "from", select: "username" })
      .populate({ path: "toUserId", select: "username" })
      .populate({ path: "to", select: "username" });

    return res.json({ ok: true, messages: docs.map(serialize) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};

/**
 * GET /api/v1/messages/thread/:userId
 * Full 1:1 conversation between me and :userId (both directions)
 */
export const getThread = async (req, res) => {
  try {
    const me = req.userId || req.user?._id;
    if (!me) {
      return res.status(401).json({ ok: false, error: "UNAUTHENTICATED" });
    }
    const otherId = req.params.userId;

    const docs = await Message.find({
      $or: [
        { $and: [{ fromUserId: me }, { toUserId: otherId }] },
        { $and: [{ from: me }, { to: otherId }] },
        { $and: [{ fromUserId: otherId }, { toUserId: me }] },
        { $and: [{ from: otherId }, { to: me }] },
      ],
    })
      .sort({ createdAt: 1 }) // chronological
      .populate({ path: "fromUserId", select: "username" })
      .populate({ path: "from", select: "username" })
      .populate({ path: "toUserId", select: "username" })
      .populate({ path: "to", select: "username" });

    return res.json({ ok: true, messages: docs.map(serialize) });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
};
