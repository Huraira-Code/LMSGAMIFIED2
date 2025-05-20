import { Router } from 'express';
import {
  getStripePublicKey,
  buySubscription,
  cancelSubscription,
  allPayments,
  stripeWebhookHandler
} from '../controllers/payment.controllers.js';

import { authorizedRoles, isLoggedIn } from '../middlewares/auth.middlewares.js';

const router = Router();

/**
 * @route GET /stripe-key
 * @description Fetches Stripe public API key for authenticated users.
 * @access Private, Authenticated users only
 */
router
  .route('/stripe-key')
  .get(isLoggedIn, getStripePublicKey);

/**
 * @route POST /subscribe
 * @description Initiates a Stripe subscription for the user.
 * @access Private, Authenticated users only
 */
router
  .route('/subscribe')
  .post(isLoggedIn, buySubscription);

/**
 * @route POST /unsubscribe
 * @description Cancels the user's Stripe subscription.
 * @access Private, Authenticated users only
 */
router
  .route('/unsubscribe')
  .post(isLoggedIn, cancelSubscription);

/**
 * @route GET /
 * @description Fetches all Stripe subscriptions (for admin only).
 * @access Private, Admin users only
 */
router
  .route('/')
  .get(isLoggedIn, authorizedRoles('ADMIN'), allPayments);

/**
 * @route POST /webhook
 * @description Stripe webhook to handle payment events (invoice paid, subscription canceled, etc.)
 * @access Public (must bypass body parser!)
 */
router
  .route('/webhook')
  .post(stripeWebhookHandler); // Note: middleware for raw body required

export default router;
