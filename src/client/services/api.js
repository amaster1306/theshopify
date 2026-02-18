import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get shop domain from URL
function getShopDomain() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('shop');
}

// Add shop parameter to all requests
api.interceptors.request.use((config) => {
  const shop = getShopDomain();
  if (shop) {
    config.params = { ...config.params, shop };
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;
      
      if (status === 401) {
        // Unauthorized - redirect to auth
        const shop = getShopDomain();
        if (shop) {
          window.location.href = `/api/auth/start?shop=${shop}`;
        }
      } else if (status === 403) {
        // Forbidden - plan limit or feature not available
        console.error('Access forbidden:', data.message);
      } else if (status === 404) {
        // Not found
        console.error('Resource not found:', data.message);
      }
      
      return Promise.reject(data);
    }
    
    if (error.request) {
      // No response received
      console.error('No response received:', error.message);
      return Promise.reject({ error: 'Network error', message: 'Please check your connection' });
    }
    
    return Promise.reject({ error: 'Unknown error', message: error.message });
  }
);

// ============================================
// Shop endpoints
// ============================================

export async function getShopInfo(shop) {
  const response = await api.get('/shop', { params: { shop } });
  return response.data.shop;
}

export async function updateShopSettings(settings) {
  const response = await api.patch('/shop', { settings });
  return response.data.shop;
}

export async function configureBsale(config) {
  const response = await api.post('/shop/bsale-config', config);
  return response.data;
}

// ============================================
// Products endpoints
// ============================================

export async function getShopifyProducts(options = {}) {
  const response = await api.get('/products', { params: options });
  return response.data;
}

export async function getProductMappings() {
  const response = await api.get('/products/mappings');
  return response.data.mappings;
}

export async function createProductMapping(mapping) {
  const response = await api.post('/products/mappings', mapping);
  return response.data.mapping;
}

export async function getBsaleProducts(options = {}) {
  const response = await api.get('/bsale/products', { params: options });
  return response.data;
}

export async function getBsaleVariants(productId) {
  const response = await api.get(`/bsale/products/${productId}/variants`);
  return response.data;
}

// ============================================
// Orders endpoints
// ============================================

export async function getOrders(options = {}) {
  const response = await api.get('/orders', { params: options });
  return response.data;
}

export async function getOrder(orderId) {
  const response = await api.get(`/orders/${orderId}`);
  return response.data.order;
}

// ============================================
// Documents endpoints
// ============================================

export async function getDocuments(options = {}) {
  const response = await api.get('/documents', { params: options });
  return response.data;
}

export async function getDocument(documentId) {
  const response = await api.get(`/documents/${documentId}`);
  return response.data.document;
}

export async function getDocumentPdfUrl(documentId) {
  return `/api/documents/${documentId}/pdf?shop=${getShopDomain()}`;
}

// ============================================
// Stock sync endpoints
// ============================================

export async function getStockSyncLogs(options = {}) {
  const response = await api.get('/stock-sync/logs', { params: options });
  return response.data;
}

export async function syncStock(mappingId, direction) {
  const response = await api.post('/stock-sync/sync', { mappingId, direction });
  return response.data;
}

// ============================================
// Notifications endpoints
// ============================================

export async function getNotifications(options = {}) {
  const response = await api.get('/notifications', { params: options });
  return response.data.notifications;
}

export async function markNotificationRead(notificationId) {
  const response = await api.post(`/notifications/${notificationId}/read`);
  return response.data.notification;
}

// ============================================
// Usage endpoints
// ============================================

export async function getUsage(year, month) {
  const response = await api.get('/usage', { params: { year, month } });
  return response.data.usage;
}

// ============================================
// Plans endpoints
// ============================================

export async function getPlans() {
  const response = await api.get('/plans');
  return response.data.plans;
}

export async function getSubscription() {
  const response = await api.get('/billing/subscription');
  return response.data.subscription;
}

export async function createCheckout(planSlug, interval) {
  const response = await api.post('/billing/checkout', { planSlug, interval });
  return response.data;
}

export async function cancelSubscription() {
  const response = await api.post('/billing/cancel');
  return response.data;
}

export async function reactivateSubscription() {
  const response = await api.post('/billing/reactivate');
  return response.data;
}

// ============================================
// Locations endpoints
// ============================================

export async function getLocations() {
  const response = await api.get('/locations');
  return response.data.locations;
}

// ============================================
// Bsale config endpoints
// ============================================

export async function getBsaleBranches() {
  const response = await api.get('/bsale/branches');
  return response.data;
}

export async function getBsaleWarehouses(branchId) {
  const response = await api.get('/bsale/warehouses', { params: { branchId } });
  return response.data;
}

export async function validateRut(rut) {
  const response = await api.post('/validate-rut', { rut });
  return response.data;
}

export default api;