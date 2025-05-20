import Stripe from 'stripe';
import asyncHandler from '../middlewares/asyncHAndler.middleware.js';
import Payment from '../models/payment.model.js';
import User from '../models/usermodel.js';
import AppError from "../utils/error.util.js";


/**
 * @GET_STRIPE_PUBLIC_KEY
 * Sends Stripe public key to client
 */
export const getStripePublicKey = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: 'Stripe Public API Key',
    key: "",
  });
});

/**
 * @CREATE_STRIPE_SUBSCRIPTION
 * Create a Stripe subscription for a user
 */
export const buySubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.user;
  const user = await User.findById(id);
  if (!user) return next(new AppError("Unauthorized, please login"));
  if (user.role === 'ADMIN') return next(new AppError("Admin cannot purchase a subscription", 400));

  // If user already has an active subscription, return it
  if (user.stripeSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    if (subscription && subscription.status === 'active') {
      return res.status(200).json({
        success: true,
        message: "Already subscribed",
        subscription_id: subscription.id,
      });
    }
  }

  // Create Stripe Customer if not exists
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
    });
    stripeCustomerId = customer.id;
    user.stripeCustomerId = stripeCustomerId;
    await user.save();
  }

  // Create subscription
  const subscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [
      { price: "price_1ROu2r2LewuTEXoEkWjtlCcm" }, // Your Stripe price ID (plan)
    ],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });

  user.stripeSubscriptionId = subscription.id;
  user.subscriptionStatus = subscription.status;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Subscription created successfully',
    subscription_id: subscription.id,
    client_secret: subscription.latest_invoice.payment_intent.client_secret, // For frontend payment confirmation
  });
});

/**
 * @VERIFY_SUBSCRIPTION (via Webhook)
 * Stripe requires webhook to verify and update subscription status
 * So this function would not be used as Razorpay's signature verification is done here.
 * Instead, webhook will handle payment success/failure and update user subscription.
 */

/**
 * @CANCEL_SUBSCRIPTION
 * Cancel Stripe subscription and update user status
 */
export const cancelSubscription = asyncHandler(async (req, res, next) => {
  const { id } = req.user;

  const user = await User.findById(id);
  if (!user) return next(new AppError("Unauthorized, please login"));
  if (user.role === 'ADMIN') return next(new AppError("Admin cannot cancel subscription", 400));

  if (!user.stripeSubscriptionId) {
    return next(new AppError("No active subscription found", 400));
  }

  await stripe.subscriptions.del(user.stripeSubscriptionId);

  user.subscriptionStatus = 'canceled';
  user.stripeSubscriptionId = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Subscription canceled successfully',
  });
});

/**
 * @WEBHOOK_HANDLER
 * Stripe webhook endpoint to listen for subscription payment events
 * Update user subscription status accordingly
 */
export const stripeWebhookHandler = asyncHandler(async (req, res, next) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      const user = await User.findOne({ stripeSubscriptionId: subscriptionId });
      if (user) {
        user.subscriptionStatus = 'active';
        await user.save();

        // Optionally, store payment details
        await Payment.create({
          user: user._id,
          stripePaymentIntentId: invoice.payment_intent,
          subscriptionId,
          amountPaid: invoice.amount_paid,
          paymentStatus: 'succeeded',
        });
      }
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      const user = await User.findOne({ stripeSubscriptionId: subscriptionId });
      if (user) {
        user.subscriptionStatus = 'past_due';
        await user.save();
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const user = await User.findOne({ stripeSubscriptionId: subscription.id });
      if (user) {
        user.subscriptionStatus = 'canceled';
        user.stripeSubscriptionId = null;
        await user.save();
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

/**
 * @GET_ALL_SUBSCRIPTIONS
 * Fetch all Stripe subscriptions (for admin) and monthly stats
 */
export const allPayments = asyncHandler(async (req, res, next) => {
  const { limit = 10, starting_after = null } = req.query;

  const subscriptions = await stripe.subscriptions.list({
    limit: parseInt(limit),
    starting_after,
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const finalMonths = monthNames.reduce((acc, month) => ({ ...acc, [month]: 0 }), {});

  subscriptions.data.forEach((subscription) => {
    const startDate = new Date(subscription.created * 1000);
    const month = monthNames[startDate.getMonth()];
    finalMonths[month] = (finalMonths[month] || 0) + 1;
  });

  const monthlySalesRecord = monthNames.map(month => finalMonths[month]);

  res.status(200).json({
    success: true,
    message: 'All subscriptions',
    subscriptions,
    finalMonths,
    monthlySalesRecord,
  });
});
