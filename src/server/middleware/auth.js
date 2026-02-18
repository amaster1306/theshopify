import { getShopify } from '../services/shopify.js';
import { getShop, getShopById } from '../services/supabase.js';

/**
 * Middleware to verify Shopify session
 * Extracts shop domain from query params or session token
 */
export async function verifyShopifySession(req, res, next) {
  try {
    const shopify = getShopify();
    
    // Get shop domain from various sources
    let shopDomain = req.query.shop || req.headers['x-shopify-shop-domain'];
    
    // If embedded app, get from authorization header
    if (!shopDomain && req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const payload = await shopify.session.decodeSessionToken(token);
        shopDomain = payload.dest.replace(/^https?:\/\//, '');
      } catch (error) {
        console.error('Failed to decode session token:', error);
      }
    }

    if (!shopDomain) {
      return res.status(400).json({ 
        error: 'Missing shop parameter',
        message: 'Shop domain is required',
      });
    }

    // Normalize shop domain
    shopDomain = shopDomain.toLowerCase().trim();
    if (!shopDomain.includes('.myshopify.com')) {
      shopDomain = `${shopDomain}.myshopify.com`;
    }

    // Get shop from database
    const shop = await getShop(shopDomain);
    
    if (!shop) {
      return res.status(404).json({ 
        error: 'Shop not found',
        message: 'Shop is not installed or not configured',
      });
    }

    // Check if shop is uninstalled
    if (shop.uninstalled_at) {
      return res.status(403).json({ 
        error: 'Shop uninstalled',
        message: 'This app has been uninstalled from your store',
      });
    }

    // Check plan status
    if (shop.plan_status === 'cancelled' || shop.plan_status === 'expired') {
      return res.status(403).json({ 
        error: 'Plan expired',
        message: 'Your subscription has expired. Please renew to continue using the app.',
        planStatus: shop.plan_status,
      });
    }

    // Attach shop to request
    req.shop = shop;
    req.shopDomain = shopDomain;

    // Create session object for Shopify API calls
    req.session = {
      id: shop.id,
      shop: shopDomain,
      accessToken: shop.access_token,
      state: 'active',
      isOnline: true,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication failed',
      message: error.message,
    });
  }
}

/**
 * Middleware to check if Bsale is configured
 */
export function requireBsaleConfig(req, res, next) {
  const shop = req.shop;

  if (!shop.bsale_is_configured || !shop.bsale_api_token) {
    return res.status(400).json({ 
      error: 'Bsale not configured',
      message: 'Please configure your Bsale API credentials first',
      requiresConfig: true,
    });
  }

  next();
}

/**
 * Middleware to check plan limits
 */
export async function checkPlanLimit(limitType) {
  return async (req, res, next) => {
    const shop = req.shop;

    // Check if plan allows this action
    if (shop.plan?.features) {
      const features = shop.plan.features;
      
      if (limitType === 'orders' && features.max_orders_per_month !== null) {
        // Check usage tracking
        const now = new Date();
        const usage = await getUsageTracking(shop.id, now.getFullYear(), now.getMonth() + 1);
        
        if (usage && usage.orders_count >= features.max_orders_per_month) {
          return res.status(403).json({ 
            error: 'Plan limit reached',
            message: `You have reached your monthly limit of ${features.max_orders_per_month} orders`,
            limit: features.max_orders_per_month,
            current: usage.orders_count,
          });
        }
      }

      if (limitType === 'documents' && features.max_documents_per_month !== null) {
        const now = new Date();
        const usage = await getUsageTracking(shop.id, now.getFullYear(), now.getMonth() + 1);
        
        if (usage && usage.documents_count >= features.max_documents_per_month) {
          return res.status(403).json({ 
            error: 'Plan limit reached',
            message: `You have reached your monthly limit of ${features.max_documents_per_month} documents`,
            limit: features.max_documents_per_month,
            current: usage.documents_count,
          });
        }
      }

      // Check feature availability
      if (limitType === 'stock_sync' && !features.stock_sync_enabled) {
        return res.status(403).json({ 
          error: 'Feature not available',
          message: 'Stock synchronization is not available in your current plan',
        });
      }
    }

    next();
  };
}

/**
 * Middleware to verify webhook authenticity
 */
export function verifyWebhook(req, res, next) {
  try {
    const shopify = getShopify();
    
    // Get HMAC from header
    const hmac = req.headers['x-shopify-hmac-sha256'];
    if (!hmac) {
      return res.status(401).json({ error: 'Missing HMAC signature' });
    }

    // Verify HMAC
    const body = JSON.stringify(req.body);
    const generatedHmac = shopify.utils.crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(body, 'utf8')
      .digest('base64');

    if (generatedHmac !== hmac) {
      return res.status(401).json({ error: 'Invalid HMAC signature' });
    }

    // Get shop domain from header
    const shopDomain = req.headers['x-shopify-shop-domain'];
    if (shopDomain) {
      req.shopDomain = shopDomain.toLowerCase();
    }

    next();
  } catch (error) {
    console.error('Webhook verification error:', error);
    return res.status(401).json({ error: 'Webhook verification failed' });
  }
}

/**
 * Optional auth - attaches shop if available but doesn't require it
 */
export async function optionalAuth(req, res, next) {
  try {
    const shopDomain = req.query.shop || req.headers['x-shopify-shop-domain'];
    
    if (shopDomain) {
      const shop = await getShop(shopDomain);
      if (shop && !shop.uninstalled_at) {
        req.shop = shop;
        req.session = {
          id: shop.id,
          shop: shopDomain,
          accessToken: shop.access_token,
          state: 'active',
          isOnline: true,
        };
      }
    }
    
    next();
  } catch (error) {
    // Continue without shop
    next();
  }
}

export default {
  verifyShopifySession,
  requireBsaleConfig,
  checkPlanLimit,
  verifyWebhook,
  optionalAuth,
};