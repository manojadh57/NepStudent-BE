// src/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// ROUTES
import authRouter from "./routes/authRoutes.js";
import postRouter from "./routes/postRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import billingRouter from "./routes/billingRoutes.js";
import userRouter from "./routes/userRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import voteRouter from "./routes/voteRoutes.js";
import bookmarkRouter from "./routes/bookmarkRoutes.js";

// If you export this from your controller:
import { handleStripeWebhook } from "./controllers/billingController.js";

const app = express();

/* ----------------------------- CORS (whitelist) ---------------------------- */
const origins = (
  process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || origins.includes(origin)) return cb(null, true);
      return cb(new Error("CORS: Origin not allowed"));
    },
    credentials: true,
  })
);

/* ----------------------- Stripe webhook: MUST be raw ----------------------- */
// Mount BEFORE express.json(); also copy to req.rawBody in case controller expects it.
app.post(
  "/api/v1/billing/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    req.rawBody = req.body; // keep backward-compat if controller reads rawBody
    return handleStripeWebhook(req, res, next);
  }
);

/* ----------------------------- Body & Cookies ------------------------------ */
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* --------------------------------- Health --------------------------------- */
app.get("/healthz", (_req, res) => res.json({ ok: true }));

/* --------------------------------- Routes --------------------------------- */
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/billing", billingRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/votes", voteRouter);
app.use("/api/v1/bookmarks", bookmarkRouter);

/* ------------------------------ Not Found 404 ------------------------------ */
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "NOT_FOUND" });
});

/* ------------------------------ Error Handler ------------------------------ */
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    ok: false,
    error: err.code || "SERVER_ERROR",
    message: err.message || "Unexpected error",
  });
});

export default app;
