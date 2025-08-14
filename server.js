import dotenv from "dotenv";
dotenv.config(); // ✅ this must be before everything else

import app from "./app.js";
import mongoose from "mongoose";

const PORT = process.env.PORT || 8000;

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("❌ MongoDB error:", err));
