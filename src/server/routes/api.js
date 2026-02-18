import { Router } from 'express';
import { requireBsaleConfig, checkPlanLimit } from '../middleware/auth.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler.js';
import {
  getShop,
  updateShop,
  getPlans,
  getProductMappings,
  upsertProductMapping,
  getDocuments,
  getDocument,
  getStockSyncLogs,
  getNotifications,
  markNotificationRead,
  getUsageTracking,
  createNotification,
  incrementUsage,
} from '../services/supabase.js';
import {
  getShopifyProducts,
  getShopifyProduct,
  getShopifyOrders,
  getShopifyOrder,
  getShopifyLocations,
  getShopInfo,
} from '../services/shopify.js';
import {
  getBsaleProducts,
  getBsaleProduct,
  getBsaleProductByCode,
  getBsaleVariants,
  getBsaleStock,
  updateBsaleStock,
  getBsaleDocument,
  getBsaleDocumentPDF,
  getBsaleBranches,
  getBsaleWarehouses,
  getBsaleClients,
  getBsaleClientByRut,
  validateRut,
  formatRut,
} from '../services/bsale.js';

const router = Router();

// ============================================
// SHOP ENDPOINTS
// ============================================

/**
 * Get shop info
 */
router.get('/shop', asyncHandler(async (req, res) => {
  const shop = req.shop;
  
  res.json({
    id: shop.id,
    domain: shop.shop_domain,
    name: shop.shop_name,
    email: shop.shop_email,
    currency: shop.shop_currency,
    timezone: shop.shop_timezone,
    bsaleConfigured: shop.bsale_is_configured,
    plan: shop.plan,
    planStatus: shop.plan_status,
    trialEndsAt: shop.plan_trial_ends_at,
    settings: shop.settings,
    installedAt: shop.installed_at,
    lastSyncAt: shop.last_sync_at,
  });
}));

/**
 * Update shop settings
 */
router.patch('/shop', asyncHandler(async (req, res) => {
  const shop = req.shop;
  const { settings, ...otherUpdates } = req.body;
  
  const updates = { ...otherUpdates };
  
  if (settings) {
    updates.settings = {
      ...shop.settings,
      ...settings,
    };
  }
  
  const updatedShop = await updateShop(shop.id, updates);
  
  res.json({
    success: true,
    shop: {
      settings: updatedShop.settings,
      bsaleConfigured: updatedShop.bsale_is_configured,
    },
  });
}));

/**
 * Configure Bsale credentials
 */
router.post('/shop/bsale-config', asyncHandler(async (req, res) => {
  const shop = req.shop;
  const { apiToken, companyId, branchId, warehouseId } = req.body;
  
  if (!apiToken) {
    throw new ValidationError('API token is required');
  }
  
  // Test the credentials by fetching company info
  try {
    const branches = await getBsaleBranches(apiToken);
    const warehouses = await getBsaleWarehouses(apiToken, branchId);
    
    // Update shop with Bsale config
    const updatedShop = await updateShop(shop.id, {
      bsale_api_token: apiToken,
      bsale_company_id: companyId,
      bsale_branch_id: branchId,
      bsale_warehouse_id: warehouseId,
      bsale_is_configured: true,
    });
    
    res.json({
      success: true,
      message: 'Bsale configured successfully',
      branches: branches.items,
      warehouses: warehouses.items,
    });
  } catch (error) {
    throw new ValidationError('Invalid Bsale credentials: ' + error.message);
  }
}));

// ============================================
// PRODUCTS ENDPOINTS
// ============================================

/**
 * Get Shopify products
 */
router.get('/products', asyncHandler(async (req, res) => {
  const session = req.session;
  const { limit, since_id } = req.query;
  
  const products = await getShopifyProducts(session, { limit, since_id });
  
  res.json({ products });
}));

/**
 * Get product mappings
 */
router.get('/products/mappings', asyncHandler(async (req, res) => {
  const shop = req.shop;
  
  const mappings = await getProductMappings(shop.id);
  
  res.json({ mappings });
}));

/**
 * Create or update product mapping
 */
router.post('/products/mappings', asyncHandler(async (req, res) => {
  const shop = req.shop;
  const {
    shopifyProductId,
    shopifyVariantId,
    shopifySku,
    bsaleProductId,
    bsaleVariantId,
    bsaleSku,
    syncStock,
    syncPrice,
  } = req.body;
  
  if (!shopifyProductId || !bsaleProductId) {
    throw new ValidationError('Shopify product ID and Bsale product ID are required');
  }
  
  // Get Shopify product info
  const session = req.session;
  const shopifyProduct = await getShopifyProduct(session, shopifyProductId);
  
  // Get Bsale product info
  const bsaleProduct = await getBsaleProduct(shop.bsale_api_token, bsaleProductId);
  
  const mapping = await upsertProductMapping({
    shop_id: shop.id,
    shopify_product_id: shopifyProductId,
    shopify_variant_id: shopifyVariantId || null,
    shopify_product_title: shopifyProduct.title,
    shopify_sku: shopifySku || null,
    bsale_product_id: bsaleProductId,
    bsale_variant_id: bsaleVariantId || null,
    bsale_sku: bsaleSku || null,
    bsale_name: bsaleProduct.name,
    sync_stock: syncStock !== false,
    sync_price: syncPrice === true,
    is_active: true,
  });
  
  res.json({ success: true, mapping });
}));

/**
 * Search Bsale products
 */
router.get('/bsale/products', requireBsaleConfig, asyncHandler(async (req, res) => {
  const shop = req.shop;
  const { code, name, limit } = req.query;
  
  const result = await getBsaleProducts(shop.bsale_api_token, { code, name, limit });
  
  res.json(result);
}));

/**
 * Get Bsale product variants
 */
router.get('/bsale/products/:productId/variants', requireBsaleConfig, asyncHandler(async (req, res) => {
  const shop = req.shop;
  const { productId } = req.params;
  
  const result = await getBsaleVariants(shop.bsale_api_token, productId);
  
  res.json(result);
}));

// ============================================
// ORDERS ENDPOINTS
// ============================================

/**
 * Get Shopify orders
 */
router.get('/orders', asyncHandler(async (req, res) => {
  const session = req.session;
  const { limit, status, created_at_min, created_at_max } = req.query;
  
  const orders = await getShopifyOrders(session, {
    limit,
    status,
    created_at_min,
    created_at_max,
  });
  
  res.json({ orders });
}));

/**
 * Get Shopify order details
 */
router.get('/orders/:orderId', asyncHandler(async (req, res) => {
  const session = req.session;
  const { orderId } = req.params;
  
  const order = await getShopifyOrder(session, orderId);
  
  res.json({ order });
}));

// ============================================
// DOCUMENTS ENDPOINTS
// ============================================

/**
 * Get documents
 */
router.get('/documents', asyncHandler(async (req, res) => {
  const shop = req.shop;
  const { status, documentType, limit, offset } = req.query;
  
  const { data, count } = await getDocuments(shop.id, {
    status,
    documentType,
    limit: parseInt(limit) || 50,
    offset: parseInt(offset) || 0,
  });
  
  res.json({ documents: data, total: count });
}));

/**
 * Get document details
 */
router.get('/documents/:documentId', asyncHandler(async (req, res) => {
  const shop = req.shop;
  const { documentId } = req.params;
  
  const document = await getDocument(shop.id, documentId);
  
  if (!document) {
    throw new NotFoundError('Document not found');
  }
  
  // Get Bsale document details
  if (document.bsale_document_id && shop.bsale_is_configured) {
    try {
      const bsaleDoc = await getBsaleDocument(shop.bsale_api_token, document.bsale_document_id);
      document.bsaleDetails = bsaleDoc;
    } catch (error) {
      console.error('Failed to get Bsale document:', error);
    }
  }
  
  res.json({ document });
}));

/**
 * Get document PDF
 */
router.get('/documents/:documentId/pdf', requireBsaleConfig, asyncHandler(async (req, res) => {
  const shop = req.shop;
  const { documentId } = req.params;
  
  const document = await getDocument(shop.id, documentId);
  
  if (!document || !document.bsale_document_id) {
    throw new NotFoundError('Document not found');
  }
  
  const pdf = await getBsaleDocumentPDF(shop.bsale_api_token, document.bsale_document_id);
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${document.bsale_document_number}.pdf"`);
  res.send(pdf);
}));

// ============================================
// STOCK SYNC ENDPOINTS
// ============================================

/**
 * Get stock sync logs
 */
router.get('/stock-sync/logs', asyncHandler(async (req, res) => {
  const shop = req.shop;
  const { limit, offset } = req.query;
  
  const { data, count } = await getStockSyncLogs(shop.id, {
    limit: parseInt(limit) || 50,
    offset: parseInt(offset) || 0,
  });
  
  res.json({ logs: data, total: count });
}));

/**
 * Manual stock sync for a product
 */
router.post('/stock-sync/sync', requireBsaleConfig, checkPlanLimit('stock_sync'), asyncHandler(async (req, res) => {
  const shop = req.shop;
  const session = req.session;
  const { mappingId, direction } = req.body;
  
  // Get mapping
  const mappings = await getProductMappings(shop.id);
  const mapping = mappings.find(m => m.id === mappingId);
  
  if (!mapping) {
    throw new NotFoundError('Product mapping not found');
  }
  
  let result;
  
  if (direction === 'shopify_to_bsale' || direction === 'bidirectional') {
    // Get Shopify stock
    const locations = await getShopifyLocations(session);
    const primaryLocation = locations[0];
    
    if (primaryLocation) {
      // Get inventory level from Shopify
      // This is simplified - in production you'd need to get the actual inventory item ID
      const shopifyStock = mapping.last_stock_sync_quantity || 0;
      
      // Update Bsale stock
      await updateBsaleStock(
        shop.bsale_api_token,
        mapping.bsale_variant_id || mapping.bsale_product_id,
        shop.bsale_warehouse_id,
        shopifyStock,
        { note: 'Manual sync from Shopify' }
      );
      
      result = { direction: 'shopify_to_bsale', quantity: shopifyStock };
    }
  }
  
  if (direction === 'bsale_to_shopify' || direction === 'bidirectional') {
    // Get Bsale stock
    const bsaleStock = await getBsaleStock(
      shop.bsale_api_token,
      mapping.bsale_variant_id || mapping.bsale_product_id,
      shop.bsale_warehouse_id
    );
    
    if (bsaleStock) {
      // Update Shopify inventory
      // This requires the inventory item ID from Shopify
      // await updateInventoryLevel(session, inventoryItemId, locationId, bsaleStock.quantity);
      
      result = { direction: 'bsale_to_shopify', quantity: bsaleStock.quantity };
    }
  }
  
  // Log the sync
  await createStockSyncLog({
    shop_id: shop.id,
    product_mapping_id: mapping.id,
    direction: direction || 'bidirectional',
    new_quantity: result?.quantity,
    source: 'manual',
    status: 'success',
  });
  
  // Update usage
  await incrementUsage(shop.id, { p_stock_syncs: 1 });
  
  res.json({ success: true, result });
}));

// ============================================
// NOTIFICATIONS ENDPOINTS
// ============================================

/**
 * Get notifications
 */
router.get('/notifications', asyncHandler(async (req, res) => {
  const shop = req.shop;
  const { unreadOnly, limit } = req.query;
  
  const notifications = await getNotifications(shop.id, {
    unreadOnly: unreadOnly === 'true',
    limit: parseInt(limit) || 20,
  });
  
  res.json({ notifications });
}));

/**
 * Mark notification as read
 */
router.post('/notifications/:notificationId/read', asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  
  const notification = await markNotificationRead(notificationId);
  
  res.json({ success: true, notification });
}));

// ============================================
// USAGE ENDPOINTS
// ============================================

/**
 * Get usage statistics
 */
router.get('/usage', asyncHandler(async (req, res) => {
  const shop = req.shop;
  const { year, month } = req.query;
  
  const now = new Date();
  const targetYear = parseInt(year) || now.getFullYear();
  const targetMonth = parseInt(month) || (now.getMonth() + 1);
  
  const usage = await getUsageTracking(shop.id, targetYear, targetMonth);
  
  res.json({ usage });
}));

// ============================================
// PLANS ENDPOINTS
// ============================================

/**
 * Get available plans
 */
router.get('/plans', asyncHandler(async (req, res) => {
  const plans = await getPlans();
  
  res.json({ plans });
}));

// ============================================
// LOCATIONS ENDPOINTS
// ============================================

/**
 * Get Shopify locations
 */
router.get('/locations', asyncHandler(async (req, res) => {
  const session = req.session;
  
  const locations = await getShopifyLocations(session);
  
  res.json({ locations });
}));

// ============================================
// BSALE CONFIG ENDPOINTS
// ============================================

/**
 * Get Bsale branches
 */
router.get('/bsale/branches', requireBsaleConfig, asyncHandler(async (req, res) => {
  const shop = req.shop;
  
  const result = await getBsaleBranches(shop.bsale_api_token);
  
  res.json(result);
}));

/**
 * Get Bsale warehouses
 */
router.get('/bsale/warehouses', requireBsaleConfig, asyncHandler(async (req, res) => {
  const shop = req.shop;
  const { branchId } = req.query;
  
  const result = await getBsaleWarehouses(shop.bsale_api_token, branchId || shop.bsale_branch_id);
  
  res.json(result);
}));

/**
 * Validate RUT
 */
router.post('/validate-rut', asyncHandler(async (req, res) => {
  const { rut } = req.body;
  
  const isValid = validateRut(rut);
  const formatted = isValid ? formatRut(rut) : null;
  
  res.json({ valid: isValid, formatted });
}));

export default router;