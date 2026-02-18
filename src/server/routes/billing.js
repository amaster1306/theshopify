import { Router } from 'express';
import { asyncHandler, ValidationError, ForbiddenError } from '../middleware/errorHandler.js';
import {
  getShop,
  updateShop,
  getPlan,
  getPlans,
  getPlanBySlug,
} from '../services/supabase.js';

const router = Router();

// Note: This implementation uses Stripe for billing
// You can replace this with Polar or any other billing provider

/**
 * Get available plans
 */
router.get('/plans', asyncHandler(async (req, res) => {
  const plans = await getPlans();
  
  res.json({ plans });
}));

/**
 * Get current subscription
 */
router.get('/subscription', asyncHandler(async (req, res) => {
  const shop = req.shop;
  
  res.json({
    subscription: {
      planId: shop.plan_id,
      plan: shop.plan,
      status: shop.plan_status,
      trialEndsAt: shop.plan_trial_ends_at,
      subscriptionId: shop.plan_subscription_id,
      subscriptionStatus: shop.plan_subscription_status,
    },
  });
}));

/**
 * Create checkout session for plan upgrade
 */
router.post('/checkout', asyncHandler(async (req, res) => {
  const shop = req.shop;
  const { planSlug, interval } = req.body; // interval: 'monthly' or 'yearly'
  
  if (!planSlug) {
    throw new ValidationError('Plan slug is required');
  }
  
  const plan = await getPlanBySlug(planSlug);
  if (!plan) {
    throw new ValidationError('Plan not found');
  }
  
  // In production, you would create a Stripe checkout session here
  // For now, we'll simulate the checkout process
  
  const stripePriceId = interval === 'yearly' 
    ? plan.stripe_price_id_yearly 
    : plan.stripe_price_id_monthly;
  
  if (!stripePriceId) {
    throw new ValidationError('Price not configured for this plan');
  }
  
  // Simulated checkout URL
  // In production, use Stripe's checkout.sessions.create()
  const checkoutUrl = `${process.env.SHOPIFY_APP_URL}/billing/complete?plan=${planSlug}&session=mock_session`;
  
  res.json({
    checkoutUrl,
    plan: {
      id: plan.id,
      name: plan.name,
      price: interval === 'yearly' ? plan.price_yearly : plan.price_monthly,
      interval,
    },
  });
}));

/**
 * Handle successful payment (webhook or redirect)
 */
router.post('/complete', asyncHandler(async (req, res) => {
  const shop = req.shop;
  const { planSlug, sessionId } = req.body;
  
  // In production, verify the Stripe session here
  // const session = await stripe.checkout.sessions.retrieve(sessionId);
  
  const plan = await getPlanBySlug(planSlug);
  if (!plan) {
    throw new ValidationError('Plan not found');
  }
  
  // Update shop with new plan
  const updatedShop = await updateShop(shop.id, {
    plan_id: plan.id,
    plan_status: 'active',
    plan_subscription_id: sessionId,
    plan_subscription_status: 'active',
  });
  
  res.json({
    success: true,
    plan: {
      id: plan.id,
      name: plan.name,
      features: plan.features,
    },
  });
}));

/**
 * Cancel subscription
 */
router.post('/cancel', asyncHandler(async (req, res) => {
  const shop = req.shop;
  
  if (!shop.plan_subscription_id) {
    throw new ValidationError('No active subscription found');
  }
  
  // In production, cancel the Stripe subscription
  // await stripe.subscriptions.cancel(shop.plan_subscription_id);
  
  // Update shop status
  await updateShop(shop.id, {
    plan_status: 'cancelled',
    plan_subscription_status: 'cancelled',
  });
  
  res.json({
    success: true,
    message: 'Subscription cancelled successfully',
  });
}));

/**
 * Reactivate subscription
 */
router.post('/reactivate', asyncHandler(async (req, res) => {
  const shop = req.shop;
  
  if (!shop.plan_subscription_id) {
    throw new ValidationError('No previous subscription found');
  }
  
  // In production, reactivate the Stripe subscription
  // await stripe.subscriptions.update(shop.plan_subscription_id, { cancel_at_period_end: false });
  
  // Update shop status
  await updateShop(shop.id, {
    plan_status: 'active',
    plan_subscription_status: 'active',
  });
  
  res.json({
    success: true,
    message: 'Subscription reactivated successfully',
  });
}));

/**
 * Stripe webhook handler
 * This endpoint receives webhooks from Stripe for subscription events
 */
router.post('/webhook/stripe', asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const body = req.body;
  
  // In production, verify the webhook signature
  // const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  
  const event = body;
  
  // Handle different event types
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const shopDomain = session.client_reference_id;
      
      if (shopDomain) {
        const planId = session.metadata?.planId;
        const shop = await getShop(shopDomain);
        
        if (shop && planId) {
          await updateShop(shop.id, {
            plan_id: planId,
            plan_status: 'active',
            plan_subscription_id: session.subscription,
            plan_subscription_status: 'active',
          });
        }
      }
      break;
    }
    
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const shop = await getShopBySubscriptionId(subscription.id);
      
      if (shop) {
        await updateShop(shop.id, {
          plan_status: subscription.status === 'active' ? 'active' : 'past_due',
          plan_subscription_status: subscription.status,
        });
      }
      break;
    }
    
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const shop = await getShopBySubscriptionId(subscription.id);
      
      if (shop) {
        await updateShop(shop.id, {
          plan_status: 'expired',
          plan_subscription_status: 'cancelled',
        });
      }
      break;
    }
    
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const shop = await getShopBySubscriptionId(invoice.subscription);
      
      if (shop) {
        await updateShop(shop.id, {
          plan_status: 'past_due',
        });
      }
      break;
    }
  }
  
  res.json({ received: true });
}));

// Helper function (would be implemented in supabase.js in production)
async function getShopBySubscriptionId(subscriptionId) {
  // This would query the shops table by plan_subscription_id
  // For now, return null
  return null;
}

export default router;