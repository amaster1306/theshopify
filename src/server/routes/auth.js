import { Router } from 'express';
import { getShopify, getShopInfo, registerWebhooks } from '../services/shopify.js';
import { upsertShop, getShop, updateShop, getPlanBySlug } from '../services/supabase.js';

const router = Router();

/**
 * OAuth callback - Called when app is installed
 */
router.get('/callback', async (req, res) => {
  try {
    const shopify = getShopify();
    
    const { shop, hmac, code, state, timestamp } = req.query;
    
    if (!shop || !hmac || !code) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Validate HMAC
    const validated = shopify.utils.validateHmac(
      JSON.stringify({
        code,
        hmac,
        shop,
        state,
        timestamp,
      }),
      hmac
    );

    if (!validated) {
      return res.status(401).json({ error: 'Invalid HMAC signature' });
    }

    // Exchange code for access token
    const session = await shopify.auth.tokenExchange({
      session: {
        shop,
        state: state || 'init',
      },
      code,
    });

    // Get shop info
    const shopInfo = await getShopInfo(session);

    // Get starter plan for new installations
    const starterPlan = await getPlanBySlug('starter');

    // Calculate trial end date (14 days from now)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    // Save shop to database
    const shopData = {
      shop_domain: shop,
      shop_name: shopInfo.name,
      shop_email: shopInfo.email,
      shop_currency: shopInfo.currency,
      shop_timezone: shopInfo.timezone,
      access_token: session.accessToken,
      scope: session.scope,
      plan_id: starterPlan?.id || null,
      plan_status: 'trial',
      plan_trial_ends_at: trialEndsAt.toISOString(),
      installed_at: new Date().toISOString(),
      uninstalled_at: null,
    };

    const savedShop = await upsertShop(shopData);

    // Register webhooks
    const host = process.env.SHOPIFY_APP_URL;
    if (host) {
      await registerWebhooks(session, host);
    }

    // Redirect to app
    const appUrl = `${process.env.SHOPIFY_APP_URL}?shop=${shop}`;
    res.redirect(appUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ 
      error: 'OAuth callback failed',
      message: error.message,
    });
  }
});

/**
 * OAuth start - Begin OAuth flow
 */
router.get('/start', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Check if shop is already installed
    const existingShop = await getShop(shop);
    
    if (existingShop && existingShop.access_token) {
      // Shop already installed, redirect to app
      const appUrl = `${process.env.SHOPIFY_APP_URL}?shop=${shop}`;
      return res.redirect(appUrl);
    }

    // Start OAuth flow
    const shopify = getShopify();
    const authUrl = shopify.auth.buildAuthUrl({
      shop,
      redirectPath: '/api/auth/callback',
      isOnline: false,
    });

    res.redirect(authUrl);
  } catch (error) {
    console.error('OAuth start error:', error);
    res.status(500).json({ 
      error: 'OAuth start failed',
      message: error.message,
    });
  }
});

/**
 * Get current session info
 */
router.get('/session', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const shopData = await getShop(shop);
    
    if (!shopData) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Return safe session data (no sensitive tokens)
    res.json({
      shop: {
        id: shopData.id,
        domain: shopData.shop_domain,
        name: shopData.shop_name,
        email: shopData.shop_email,
        currency: shopData.shop_currency,
        timezone: shopData.shop_timezone,
        bsaleConfigured: shopData.bsale_is_configured,
        plan: shopData.plan,
        planStatus: shopData.plan_status,
        trialEndsAt: shopData.plan_trial_ends_at,
        settings: shopData.settings,
        installedAt: shopData.installed_at,
        lastSyncAt: shopData.last_sync_at,
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ 
      error: 'Failed to get session',
      message: error.message,
    });
  }
});

/**
 * Logout / Uninstall
 */
router.post('/logout', async (req, res) => {
  try {
    const { shop } = req.body;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    await updateShop(shop, {
      uninstalled_at: new Date().toISOString(),
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed',
      message: error.message,
    });
  }
});

/**
 * Verify app is installed and get access token
 */
router.get('/verify', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const shopData = await getShop(shop);
    
    if (!shopData) {
      return res.json({ installed: false });
    }

    if (shopData.uninstalled_at) {
      return res.json({ installed: false });
    }

    res.json({ 
      installed: true,
      accessToken: shopData.access_token,
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ 
      error: 'Verification failed',
      message: error.message,
    });
  }
});

export default router;