import { createClient } from '@supabase/supabase-js';

let supabase = null;
let supabaseAdmin = null;

export function initSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  // Client for user operations
  supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Admin client for server operations (bypasses RLS)
  if (supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  console.log('Supabase initialized');
}

export function getSupabase() {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }
  return supabase;
}

export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin not initialized');
  }
  return supabaseAdmin;
}

// Shop operations
export async function getShop(shopDomain) {
  const { data, error } = await getSupabaseAdmin()
    .from('shops')
    .select(`
      *,
      plan:plans(*)
    `)
    .eq('shop_domain', shopDomain)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

export async function getShopById(shopId) {
  const { data, error } = await getSupabaseAdmin()
    .from('shops')
    .select(`
      *,
      plan:plans(*)
    `)
    .eq('id', shopId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createShop(shopData) {
  const { data, error } = await getSupabaseAdmin()
    .from('shops')
    .insert(shopData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateShop(shopId, updates) {
  const { data, error } = await getSupabaseAdmin()
    .from('shops')
    .update(updates)
    .eq('id', shopId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertShop(shopData) {
  const { data, error } = await getSupabaseAdmin()
    .from('shops')
    .upsert(shopData, { onConflict: 'shop_domain' })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Plan operations
export async function getPlans() {
  const { data, error } = await getSupabaseAdmin()
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    throw error;
  }

  return data;
}

export async function getPlan(planId) {
  const { data, error } = await getSupabaseAdmin()
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPlanBySlug(slug) {
  const { data, error } = await getSupabaseAdmin()
    .from('plans')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Product mapping operations
export async function getProductMapping(shopId, shopifyProductId, shopifyVariantId = null) {
  let query = getSupabaseAdmin()
    .from('product_mappings')
    .select('*')
    .eq('shop_id', shopId)
    .eq('shopify_product_id', shopifyProductId);

  if (shopifyVariantId) {
    query = query.eq('shopify_variant_id', shopifyVariantId);
  } else {
    query = query.is('shopify_variant_id', null);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

export async function getProductMappings(shopId) {
  const { data, error } = await getSupabaseAdmin()
    .from('product_mappings')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertProductMapping(mappingData) {
  const { data, error } = await getSupabaseAdmin()
    .from('product_mappings')
    .upsert(mappingData, {
      onConflict: 'shop_id,shopify_product_id,shopify_variant_id',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Document operations
export async function createDocument(documentData) {
  const { data, error } = await getSupabaseAdmin()
    .from('documents')
    .insert(documentData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getDocument(shopId, orderId) {
  const { data, error } = await getSupabaseAdmin()
    .from('documents')
    .select('*')
    .eq('shop_id', shopId)
    .eq('shopify_order_id', orderId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

export async function getDocuments(shopId, options = {}) {
  let query = getSupabaseAdmin()
    .from('documents')
    .select('*', { count: 'exact' })
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (options.status) {
    query = query.eq('status', options.status);
  }

  if (options.documentType) {
    query = query.eq('document_type', options.documentType);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return { data, count };
}

export async function updateDocument(documentId, updates) {
  const { data, error } = await getSupabaseAdmin()
    .from('documents')
    .update(updates)
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Stock sync log operations
export async function createStockSyncLog(logData) {
  const { data, error } = await getSupabaseAdmin()
    .from('stock_sync_logs')
    .insert(logData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getStockSyncLogs(shopId, options = {}) {
  let query = getSupabaseAdmin()
    .from('stock_sync_logs')
    .select('*', { count: 'exact' })
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + options.limit - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return { data, count };
}

// Webhook event operations
export async function createWebhookEvent(eventData) {
  const { data, error } = await getSupabaseAdmin()
    .from('webhook_events')
    .insert(eventData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateWebhookEvent(eventId, updates) {
  const { data, error } = await getSupabaseAdmin()
    .from('webhook_events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Usage tracking operations
export async function getUsageTracking(shopId, year, month) {
  const { data, error } = await getSupabaseAdmin()
    .from('usage_tracking')
    .select('*')
    .eq('shop_id', shopId)
    .eq('year', year)
    .eq('month', month)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

export async function incrementUsage(shopId, usageData) {
  const { error } = await getSupabaseAdmin().rpc('increment_usage', {
    p_shop_id: shopId,
    ...usageData,
  });

  if (error) {
    throw error;
  }
}

// Notification operations
export async function createNotification(notificationData) {
  const { data, error } = await getSupabaseAdmin()
    .from('notifications')
    .insert(notificationData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getNotifications(shopId, options = {}) {
  let query = getSupabaseAdmin()
    .from('notifications')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (options.unreadOnly) {
    query = query.eq('is_read', false);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data;
}

export async function markNotificationRead(notificationId) {
  const { data, error } = await getSupabaseAdmin()
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Audit log operations
export async function createAuditLog(logData) {
  const { data, error } = await getSupabaseAdmin()
    .from('audit_logs')
    .insert(logData)
    .select()
    .single();

  if (error) {
    console.error('Failed to create audit log:', error);
  }

  return data;
}

export default {
  initSupabase,
  getSupabase,
  getSupabaseAdmin,
  getShop,
  getShopById,
  createShop,
  updateShop,
  upsertShop,
  getPlans,
  getPlan,
  getPlanBySlug,
  getProductMapping,
  getProductMappings,
  upsertProductMapping,
  createDocument,
  getDocument,
  getDocuments,
  updateDocument,
  createStockSyncLog,
  getStockSyncLogs,
  createWebhookEvent,
  updateWebhookEvent,
  getUsageTracking,
  incrementUsage,
  createNotification,
  getNotifications,
  markNotificationRead,
  createAuditLog,
};