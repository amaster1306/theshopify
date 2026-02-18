import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import '@shopify/shopify-api/adapters/node';

let shopify = null;

export function initShopify() {
  shopify = shopifyApi({
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    apiKey: process.env.SHOPIFY_API_KEY,
    scopes: process.env.SHOPIFY_SCOPES?.split(',') || [
      'read_orders',
      'write_orders',
      'read_products',
      'write_products',
      'read_inventory',
      'write_inventory',
    ],
    hostName: process.env.SHOPIFY_APP_URL?.replace(/^https?:\/\//, '') || 'localhost:3000',
    apiVersion: LATEST_API_VERSION,
    isEmbeddedApp: true,
    logger: {
      level: process.env.NODE_ENV === 'development' ? 0 : 1, // 0 = debug, 1 = info
    },
    // Session storage is handled by Supabase
    // We'll implement custom session storage
  });

  console.log('Shopify API initialized');
}

export function getShopify() {
  if (!shopify) {
    throw new Error('Shopify not initialized');
  }
  return shopify;
}

// GraphQL client for Shopify Admin API
export async function getShopifyGraphQLClient(session) {
  const client = new shopify.clients.Graphql({
    session,
  });
  return client;
}

// REST client for Shopify Admin API
export async function getShopifyRestClient(session) {
  const client = new shopify.clients.Rest({
    session,
  });
  return client;
}

// Product operations
export async function getShopifyProducts(session, options = {}) {
  const client = await getShopifyRestClient(session);
  
  const params = {
    path: 'products',
    query: {
      limit: options.limit || 50,
      fields: 'id,title,handle,variants,options,images',
    },
  };

  if (options.since_id) {
    params.query.since_id = options.since_id;
  }

  const response = await client.get(params);
  return response.body.products;
}

export async function getShopifyProduct(session, productId) {
  const client = await getShopifyRestClient(session);
  
  const response = await client.get({
    path: `products/${productId}`,
    query: {
      fields: 'id,title,handle,body_html,vendor,product_type,variants,options,images',
    },
  });

  return response.body.product;
}

export async function updateShopifyProduct(session, productId, updates) {
  const client = await getShopifyRestClient(session);
  
  const response = await client.put({
    path: `products/${productId}`,
    data: { product: updates },
  });

  return response.body.product;
}

// Variant operations
export async function updateShopifyVariant(session, variantId, updates) {
  const client = await getShopifyRestClient(session);
  
  const response = await client.put({
    path: `variants/${variantId}`,
    data: { variant: updates },
  });

  return response.body.variant;
}

// Inventory operations
export async function getInventoryItem(session, inventoryItemId) {
  const client = await getShopifyRestClient(session);
  
  const response = await client.get({
    path: `inventory_items/${inventoryItemId}`,
  });

  return response.body.inventory_item;
}

export async function updateInventoryLevel(session, inventoryItemId, locationId, quantity) {
  const client = await getShopifyRestClient(session);
  
  const response = await client.post({
    path: 'inventory_levels/set',
    data: {
      location_id: locationId,
      inventory_item_id: inventoryItemId,
      available: quantity,
    },
  });

  return response.body.inventory_level;
}

export async function getInventoryLevels(session, options = {}) {
  const client = await getShopifyRestClient(session);
  
  const params = {
    path: 'inventory_levels',
    query: {},
  };

  if (options.location_id) {
    params.query.location_ids = options.location_id;
  }

  if (options.inventory_item_ids) {
    params.query.inventory_item_ids = options.inventory_item_ids;
  }

  const response = await client.get(params);
  return response.body.inventory_levels;
}

// Order operations
export async function getShopifyOrders(session, options = {}) {
  const client = await getShopifyRestClient(session);
  
  const params = {
    path: 'orders',
    query: {
      limit: options.limit || 50,
      status: options.status || 'any',
      fields: 'id,name,order_number,created_at,updated_at,total_price,currency,customer,line_items,billing_address,shipping_address,financial_status,fulfillment_status',
    },
  };

  if (options.since_id) {
    params.query.since_id = options.since_id;
  }

  if (options.created_at_min) {
    params.query.created_at_min = options.created_at_min;
  }

  if (options.created_at_max) {
    params.query.created_at_max = options.created_at_max;
  }

  const response = await client.get(params);
  return response.body.orders;
}

export async function getShopifyOrder(session, orderId) {
  const client = await getShopifyRestClient(session);
  
  const response = await client.get({
    path: `orders/${orderId}`,
    query: {
      fields: 'id,name,order_number,created_at,updated_at,total_price,subtotal_price,total_tax,currency,customer,line_items,billing_address,shipping_address,financial_status,fulfillment_status,note,note_attributes,tags',
    },
  });

  return response.body.order;
}

// Location operations
export async function getShopifyLocations(session) {
  const client = await getShopifyRestClient(session);
  
  const response = await client.get({
    path: 'locations',
  });

  return response.body.locations;
}

// Shop operations
export async function getShopInfo(session) {
  const client = await getShopifyRestClient(session);
  
  const response = await client.get({
    path: 'shop',
  });

  return response.body.shop;
}

// Webhook operations
export async function registerWebhooks(session, host) {
  const client = await getShopifyRestClient(session);
  
  const webhooks = [
    {
      topic: 'orders/create',
      address: `${host}/webhooks/orders/create`,
      format: 'json',
    },
    {
      topic: 'orders/updated',
      address: `${host}/webhooks/orders/updated`,
      format: 'json',
    },
    {
      topic: 'orders/cancelled',
      address: `${host}/webhooks/orders/cancelled`,
      format: 'json',
    },
    {
      topic: 'products/create',
      address: `${host}/webhooks/products/create`,
      format: 'json',
    },
    {
      topic: 'products/update',
      address: `${host}/webhooks/products/update`,
      format: 'json',
    },
    {
      topic: 'products/delete',
      address: `${host}/webhooks/products/delete`,
      format: 'json',
    },
    {
      topic: 'inventory_levels/update',
      address: `${host}/webhooks/inventory_levels/update`,
      format: 'json',
    },
    {
      topic: 'app/uninstalled',
      address: `${host}/webhooks/app/uninstalled`,
      format: 'json',
    },
  ];

  const results = [];

  for (const webhook of webhooks) {
    try {
      const response = await client.post({
        path: 'webhooks',
        data: { webhook },
      });
      results.push({ topic: webhook.topic, success: true, data: response.body });
    } catch (error) {
      // Webhook might already exist
      if (error.response?.body?.errors?.[0]?.message?.includes('already exists')) {
        results.push({ topic: webhook.topic, success: true, message: 'Already exists' });
      } else {
        results.push({ topic: webhook.topic, success: false, error: error.message });
      }
    }
  }

  return results;
}

export async function getWebhooks(session) {
  const client = await getShopifyRestClient(session);
  
  const response = await client.get({
    path: 'webhooks',
  });

  return response.body.webhooks;
}

// Customer operations
export async function getShopifyCustomer(session, customerId) {
  const client = await getShopifyRestClient(session);
  
  const response = await client.get({
    path: `customers/${customerId}`,
  });

  return response.body.customer;
}

// Metafields operations
export async function setOrderMetafield(session, orderId, metafield) {
  const client = await getShopifyRestClient(session);
  
  const response = await client.post({
    path: `orders/${orderId}/metafields`,
    data: { metafield },
  });

  return response.body.metafield;
}

export async function getOrderMetafields(session, orderId) {
  const client = await getShopifyRestClient(session);
  
  const response = await client.get({
    path: `orders/${orderId}/metafields`,
  });

  return response.body.metafields;
}

export default {
  initShopify,
  getShopify,
  getShopifyGraphQLClient,
  getShopifyRestClient,
  getShopifyProducts,
  getShopifyProduct,
  updateShopifyProduct,
  updateShopifyVariant,
  getInventoryItem,
  updateInventoryLevel,
  getInventoryLevels,
  getShopifyOrders,
  getShopifyOrder,
  getShopifyLocations,
  getShopInfo,
  registerWebhooks,
  getWebhooks,
  getShopifyCustomer,
  setOrderMetafield,
  getOrderMetafields,
};