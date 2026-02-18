import { Router } from 'express';
import { verifyWebhook } from '../middleware/auth.js';
import { 
  getShop, 
  updateShop, 
  createWebhookEvent, 
  updateWebhookEvent,
  createDocument,
  updateDocument,
  getDocument,
  getProductMapping,
  upsertProductMapping,
  createStockSyncLog,
  incrementUsage,
  createNotification,
} from '../services/supabase.js';
import { 
  getShopifyOrder, 
  getShopifyProduct,
  updateShopifyVariant,
  updateInventoryLevel,
  getInventoryLevels,
} from '../services/shopify.js';
import {
  getBsaleProductByCode,
  getBsaleVariant,
  getBsaleStock,
  updateBsaleStock,
  createBoleta,
  createFactura,
  createNotaVenta,
  createNotaCredito,
  getBsaleDocument,
  validateRut,
} from '../services/bsale.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Webhook verification middleware
router.use(verifyWebhook);

/**
 * Orders Create Webhook
 * Generate document (boleta/factura/nota_venta) for new orders
 */
router.post('/orders/create', asyncHandler(async (req, res) => {
  const order = req.body;
  const shopDomain = req.shopDomain;
  
  console.log(`Order created: ${order.name} in ${shopDomain}`);

  // Get shop configuration
  const shop = await getShop(shopDomain);
  if (!shop || !shop.bsale_is_configured) {
    console.log(`Shop not configured for Bsale: ${shopDomain}`);
    return res.status(200).send('OK');
  }

  // Create webhook event record
  const webhookEvent = await createWebhookEvent({
    shop_id: shop.id,
    topic: 'orders/create',
    payload: order,
    status: 'processing',
  });

  try {
    // Check if document already exists for this order
    const existingDoc = await getDocument(shop.id, order.id);
    if (existingDoc) {
      console.log(`Document already exists for order ${order.name}`);
      await updateWebhookEvent(webhookEvent.id, {
        status: 'completed',
        result: { documentId: existingDoc.id, skipped: true },
      });
      return res.status(200).send('OK');
    }

    // Determine document type based on settings and customer data
    const documentType = determineDocumentType(shop, order);
    
    // Prepare order data for document generation
    const orderData = prepareOrderData(order);
    
    // Map line items to Bsale variants
    const items = await mapOrderItems(shop, order.line_items);
    
    if (items.length === 0) {
      console.log(`No mapped items for order ${order.name}`);
      await updateWebhookEvent(webhookEvent.id, {
        status: 'failed',
        error_message: 'No mapped items found',
      });
      return res.status(200).send('OK');
    }

    // Generate document in Bsale
    let bsaleDocument;
    switch (documentType) {
      case 'factura':
        bsaleDocument = await createFactura(
          shop.bsale_api_token,
          shop.bsale_branch_id,
          orderData,
          items
        );
        break;
      case 'nota_venta':
        bsaleDocument = await createNotaVenta(
          shop.bsale_api_token,
          shop.bsale_branch_id,
          orderData,
          items
        );
        break;
      case 'boleta':
      default:
        bsaleDocument = await createBoleta(
          shop.bsale_api_token,
          shop.bsale_branch_id,
          orderData,
          items
        );
    }

    // Save document record
    const document = await createDocument({
      shop_id: shop.id,
      shopify_order_id: order.id,
      shopify_order_name: order.name,
      shopify_order_number: order.order_number,
      bsale_document_id: bsaleDocument.id,
      bsale_document_number: bsaleDocument.number,
      bsale_document_type: documentType,
      bsale_sii_code: bsaleDocument.siiCode,
      customer_rut: orderData.customerRut,
      customer_name: `${orderData.customerFirstName} ${orderData.customerLastName}`.trim(),
      customer_email: orderData.customerEmail,
      document_type: documentType,
      gross_amount: parseFloat(order.total_price),
      tax_amount: parseFloat(order.total_tax),
      net_amount: parseFloat(order.subtotal_price),
      currency: order.currency,
      status: 'generated',
      generated_at: new Date().toISOString(),
    });

    // Update usage tracking
    await incrementUsage(shop.id, {
      p_orders: 1,
      p_documents: 1,
      [`p_${documentType}s`]: 1,
    });

    // Update webhook event
    await updateWebhookEvent(webhookEvent.id, {
      status: 'completed',
      result: { documentId: document.id, bsaleDocumentId: bsaleDocument.id },
    });

    console.log(`Document generated: ${bsaleDocument.number} for order ${order.name}`);
    res.status(200).send('OK');
  } catch (error) {
    console.error(`Error processing order ${order.name}:`, error);
    
    await updateWebhookEvent(webhookEvent.id, {
      status: 'failed',
      error_message: error.message,
    });

    // Create notification for error
    await createNotification({
      shop_id: shop.id,
      type: 'error',
      title: 'Document Generation Failed',
      message: `Failed to generate document for order ${order.name}: ${error.message}`,
      entity_type: 'document',
    });

    res.status(200).send('OK');
  }
}));

/**
 * Orders Updated Webhook
 */
router.post('/orders/updated', asyncHandler(async (req, res) => {
  const order = req.body;
  const shopDomain = req.shopDomain;
  
  console.log(`Order updated: ${order.name} in ${shopDomain}`);
  res.status(200).send('OK');
}));

/**
 * Orders Cancelled Webhook
 * Generate credit note for cancelled orders
 */
router.post('/orders/cancelled', asyncHandler(async (req, res) => {
  const order = req.body;
  const shopDomain = req.shopDomain;
  
  console.log(`Order cancelled: ${order.name} in ${shopDomain}`);

  const shop = await getShop(shopDomain);
  if (!shop || !shop.bsale_is_configured) {
    return res.status(200).send('OK');
  }

  // Check if document exists for this order
  const document = await getDocument(shop.id, order.id);
  if (!document || document.status === 'cancelled') {
    return res.status(200).send('OK');
  }

  try {
    // Get original Bsale document
    const bsaleDoc = await getBsaleDocument(shop.bsale_api_token, document.bsale_document_id);
    
    // Prepare order data
    const orderData = prepareOrderData(order);
    
    // Map items
    const items = await mapOrderItems(shop, order.line_items);
    
    // Create credit note
    const creditNote = await createNotaCredito(
      shop.bsale_api_token,
      shop.bsale_branch_id,
      { number: bsaleDoc.number, siiCode: bsaleDoc.siiCode },
      orderData,
      items
    );

    // Update document status
    await updateDocument(document.id, {
      status: 'cancelled',
      error_message: `Cancelled via credit note ${creditNote.number}`,
    });

    console.log(`Credit note generated: ${creditNote.number}`);
  } catch (error) {
    console.error(`Error cancelling order ${order.name}:`, error);
  }

  res.status(200).send('OK');
}));

/**
 * Products Create Webhook
 */
router.post('/products/create', asyncHandler(async (req, res) => {
  const product = req.body;
  const shopDomain = req.shopDomain;
  
  console.log(`Product created: ${product.title} in ${shopDomain}`);
  res.status(200).send('OK');
}));

/**
 * Products Update Webhook
 */
router.post('/products/update', asyncHandler(async (req, res) => {
  const product = req.body;
  const shopDomain = req.shopDomain;
  
  console.log(`Product updated: ${product.title} in ${shopDomain}`);
  res.status(200).send('OK');
}));

/**
 * Products Delete Webhook
 */
router.post('/products/delete', asyncHandler(async (req, res) => {
  const product = req.body;
  const shopDomain = req.shopDomain;
  
  console.log(`Product deleted: ${product.id} in ${shopDomain}`);
  res.status(200).send('OK');
}));

/**
 * Inventory Levels Update Webhook
 * Sync stock from Shopify to Bsale
 */
router.post('/inventory_levels/update', asyncHandler(async (req, res) => {
  const inventoryUpdate = req.body;
  const shopDomain = req.shopDomain;
  
  console.log(`Inventory update for item ${inventoryUpdate.inventory_item_id} in ${shopDomain}`);

  const shop = await getShop(shopDomain);
  if (!shop || !shop.bsale_is_configured || !shop.settings?.sync_stock_enabled) {
    return res.status(200).send('OK');
  }

  // Check sync direction
  const syncDirection = shop.settings?.sync_stock_direction || 'bidirectional';
  if (syncDirection === 'bsale_to_shopify') {
    // Only sync from Bsale to Shopify, ignore Shopify updates
    return res.status(200).send('OK');
  }

  try {
    // Find product mapping by Shopify variant
    // Note: We need to find the variant that uses this inventory item
    // This requires additional API calls to Shopify
    
    // For now, log the update
    await createStockSyncLog({
      shop_id: shop.id,
      direction: 'shopify_to_bsale',
      previous_quantity: inventoryUpdate.old_available,
      new_quantity: inventoryUpdate.new_available,
      delta: inventoryUpdate.new_available - inventoryUpdate.old_available,
      source: 'webhook',
      source_id: inventoryUpdate.inventory_item_id,
      status: 'pending',
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing inventory update:', error);
    res.status(200).send('OK');
  }
}));

/**
 * App Uninstalled Webhook
 */
router.post('/app/uninstalled', asyncHandler(async (req, res) => {
  const shopDomain = req.shopDomain;
  
  console.log(`App uninstalled from ${shopDomain}`);

  try {
    await updateShop(shopDomain, {
      uninstalled_at: new Date().toISOString(),
      access_token: null,
    });

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling app uninstall:', error);
    res.status(200).send('OK');
  }
}));

// Helper functions

function determineDocumentType(shop, order) {
  // Check if customer has RUT (required for factura)
  const customerRut = extractRutFromOrder(order);
  
  // Check settings for default document type
  const defaultType = shop.settings?.default_document_type || 'boleta';
  
  // If factura is requested but no valid RUT, fall back to boleta
  if (defaultType === 'factura' && !validateRut(customerRut)) {
    return 'boleta';
  }
  
  return defaultType;
}

function extractRutFromOrder(order) {
  // Try to get RUT from various sources
  // 1. Note attributes
  const rutAttribute = order.note_attributes?.find(
    attr => attr.name.toLowerCase() === 'rut' || attr.name.toLowerCase() === 'rut'
  );
  if (rutAttribute?.value) return rutAttribute.value;
  
  // 2. Customer metafields
  if (order.customer?.default_address?.company) {
    // Company name might contain RUT
    const match = order.customer.default_address.company.match(/\d{7,8}-[\dKk]/);
    if (match) return match[0];
  }
  
  // 3. Billing address company
  if (order.billing_address?.company) {
    const match = order.billing_address.company.match(/\d{7,8}-[\dKk]/);
    if (match) return match[0];
  }
  
  return null;
}

function prepareOrderData(order) {
  const customer = order.customer || {};
  const billingAddress = order.billing_address || customer.default_address || {};
  
  return {
    orderName: order.name,
    orderNumber: order.order_number,
    customerRut: extractRutFromOrder(order),
    customerFirstName: customer.first_name || billingAddress.first_name || '',
    customerLastName: customer.last_name || billingAddress.last_name || '',
    customerEmail: customer.email || order.email || '',
    companyName: billingAddress.company || '',
    address: billingAddress.address1 || '',
    city: billingAddress.city || '',
    phone: billingAddress.phone || customer.phone || '',
  };
}

async function mapOrderItems(shop, lineItems) {
  const items = [];
  
  for (const lineItem of lineItems) {
    // Find product mapping
    const mapping = await getProductMapping(
      shop.id,
      lineItem.product_id,
      lineItem.variant_id
    );
    
    if (mapping && mapping.bsale_product_id) {
      items.push({
        bsaleVariantId: mapping.bsale_variant_id || mapping.bsale_product_id,
        quantity: lineItem.quantity,
        price: parseFloat(lineItem.price),
        name: lineItem.name,
        sku: lineItem.sku,
      });
    }
  }
  
  return items;
}

export default router;