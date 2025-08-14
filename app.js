import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import authRouter from "./routes/authRoutes.js";
import postRouter from "./routes/postRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import billingRouter from "./routes/billingRoutes.js";
import userRouter from "./routes/userRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import { handleStripeWebhook } from "./controllers/billingController.js";

const app = express();

// Stripe Webhook — must be raw BEFORE express.json()
app.post(
  "/api/v1/webhooks/stripe",
  bodyParser.raw({ type: "application/json" }),
  handleStripeWebhook
);

// JSON + Cookie + CORS
const allow = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
];
app.use(cors({ origin: allow, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/posts", postRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/billing", billingRouter);
app.use("/api/v1/users", userRouter);

app.use("/api/v1/admin", adminRouter);

export default app;
