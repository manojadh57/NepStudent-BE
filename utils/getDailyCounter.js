import DailyCounter from "../models/users/DailyCounterModel.js";

export async function getDailyCounter(userId) {
  const dateKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const counter = await DailyCounter.findOneAndUpdate(
    { userId, dateKey },
    { $setOnInsert: { posts: 0, comments: 0, dms: 0, dmUnlocked: false } },
    { upsert: true, new: true }
  );

  return counter;
}
