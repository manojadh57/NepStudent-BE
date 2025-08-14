import Stripe from "stripe";
import DailyCounterModel from "../models/users/DailyCounterModel.js";

let stripe;
function getStripeInstance() {
  if (!stripe) {
    console.log("Stripe key loaded:", process.env.STRIPE_SECRET_KEY);
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

// ✅ Create Stripe Checkout Session for DM Day Pass
export const createDMUnlockSession = async (req, res) => {
  try {
    const userId = req.userId;
    const dateKey = new Date().toISOString().slice(0, 10);

    const stripe = getStripeInstance();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 500, // $5.00
            product_data: {
              name: "DM Day Pass",
              description: "Unlimited direct messages until midnight UTC",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        dateKey,
        product: "dm_day_pass",
      },
      success_url: `${process.env.FRONTEND_URL}/dm-success`,
      cancel_url: `${process.env.FRONTEND_URL}/dm-cancel`,
    });

    res.json({ checkoutUrl: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    res.status(500).json({ message: "Failed to create Stripe session" });
  }
};

// ✅ Stripe Webhook: Unlock DMs on Payment
export const handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const rawBody = req.rawBody;
    const stripe = getStripeInstance();

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const dateKey = session.metadata.dateKey;

      await DailyCounterModel.findOneAndUpdate(
        { userId, dateKey },
        { $set: { dmUnlocked: true } },
        { upsert: true }
      );

      console.log(`✅ DM unlocked for user ${userId} on ${dateKey}`);
    }

    res.status(200).send("Webhook received");
  } catch (err) {
    console.error("❌ Stripe webhook error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
