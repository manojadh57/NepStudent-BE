import { getDailyCounter } from "../utils/getDailyCounter.js";

export function enforceWordLimit(maxWords) {
  return (req, res, next) => {
    const wordCount = req.body?.body?.trim().split(/\s+/).length;
    if (wordCount > maxWords) {
      return res
        .status(422)
        .json({ message: `Too long. Max allowed is ${maxWords} words.` });
    }
    next();
  };
}

export async function enforcePostQuota(req, res, next) {
  const userId = req.userId;
  const counter = await getDailyCounter(userId);
  if (counter.posts >= 1) {
    return res
      .status(429)
      .json({ message: "Daily post limit reached (1/day)." });
  }
  counter.posts += 1;
  await counter.save();
  next();
}

export async function enforceCommentQuota(req, res, next) {
  const userId = req.userId;
  const counter = await getDailyCounter(userId);
  if (counter.comments >= 3) {
    return res
      .status(429)
      .json({ message: "Daily comment limit reached (3/day)." });
  }
  counter.comments += 1;
  await counter.save();
  next();
}

export async function enforceDMQuota(req, res, next) {
  const userId = req.userId;
  const counter = await getDailyCounter(userId);

  if (counter.dms === 0 || counter.dmUnlocked) {
    counter.dms += 1;
    await counter.save();
    return next();
  }

  return res
    .status(402)
    .json({ message: "Daily free DM used. Unlock more for $5." });
}
