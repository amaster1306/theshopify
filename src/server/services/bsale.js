import axios from 'axios';

const BSALE_API_URL = process.env.BSALE_API_URL || 'https://api.bsale.cl/v1';

// Create axios instance for Bsale API
function createBsaleClient(apiToken) {
  return axios.create({
    baseURL: BSALE_API_URL,
    headers: {
      'access_token': apiToken,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });
}

// ============================================
// PRODUCT OPERATIONS
// ============================================

export async function getBsaleProducts(apiToken, options = {}) {
  const client = createBsaleClient(apiToken);
  
  const params = {
    limit: options.limit || 50,
    offset: options.offset || 0,
  };

  if (options.code) {
    params.code = options.code;
  }

  if (options.name) {
    params.name = options.name;
  }

  const response = await client.get('/products.json', { params });
  return response.data;
}

export async function getBsaleProduct(apiToken, productId) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.get(`/products/${productId}.json`);
  return response.data;
}

export async function getBsaleProductByCode(apiToken, code) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.get('/products.json', {
    params: { code, limit: 1 },
  });

  return response.data.items?.[0] || null;
}

export async function createBsaleProduct(apiToken, productData) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.post('/products.json', productData);
  return response.data;
}

export async function updateBsaleProduct(apiToken, productId, updates) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.put(`/products/${productId}.json`, updates);
  return response.data;
}

// ============================================
// VARIANT OPERATIONS
// ============================================

export async function getBsaleVariants(apiToken, productId) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.get('/variants.json', {
    params: { product_id: productId },
  });

  return response.data;
}

export async function getBsaleVariant(apiToken, variantId) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.get(`/variants/${variantId}.json`);
  return response.data;
}

export async function updateBsaleVariant(apiToken, variantId, updates) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.put(`/variants/${variantId}.json`, updates);
  return response.data;
}

// ============================================
// STOCK OPERATIONS
// ============================================

export async function getBsaleStock(apiToken, variantId, warehouseId) {
  const client = createBsaleClient(apiToken);
  
  const params = { variant_id: variantId };
  if (warehouseId) {
    params.warehouse_id = warehouseId;
  }

  const response = await client.get('/stocks.json', { params });
  return response.data.items?.[0] || null;
}

export async function updateBsaleStock(apiToken, variantId, warehouseId, quantity, options = {}) {
  const client = createBsaleClient(apiToken);
  
  const data = {
    variant_id: variantId,
    warehouse_id: warehouseId,
    quantity: quantity,
  };

  if (options.note) {
    data.note = options.note;
  }

  const response = await client.post('/stocks.json', data);
  return response.data;
}

export async function adjustBsaleStock(apiToken, variantId, warehouseId, adjustment, options = {}) {
  const client = createBsaleClient(apiToken);
  
  const data = {
    variant_id: variantId,
    warehouse_id: warehouseId,
    quantity: adjustment, // Positive to add, negative to subtract
  };

  if (options.note) {
    data.note = options.note;
  }

  const response = await client.post('/stocks/adjust.json', data);
  return response.data;
}

// ============================================
// DOCUMENT OPERATIONS (BOLETA, FACTURA, NOTA DE VENTA)
// ============================================

export async function getBsaleDocumentTypes(apiToken) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.get('/document_types.json');
  return response.data;
}

export async function getBsaleDocuments(apiToken, options = {}) {
  const client = createBsaleClient(apiToken);
  
  const params = {
    limit: options.limit || 50,
    offset: options.offset || 0,
  };

  if (options.code) {
    params.code = options.code;
  }

  if (options.client_rut) {
    params.client_rut = options.client_rut;
  }

  const response = await client.get('/documents.json', { params });
  return response.data;
}

export async function getBsaleDocument(apiToken, documentId) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.get(`/documents/${documentId}.json`);
  return response.data;
}

export async function getBsaleDocumentPDF(apiToken, documentId) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.get(`/documents/${documentId}/pdf.json`, {
    responseType: 'arraybuffer',
  });

  return response.data;
}

/**
 * Create a document in Bsale (Boleta, Factura, or Nota de Venta)
 * 
 * @param {string} apiToken - Bsale API token
 * @param {object} documentData - Document data
 * @param {number} documentData.documentTypeId - Bsale document type ID
 * @param {number} documentData.branchId - Bsale branch ID
 * @param {number} documentData.emissionDate - Emission date timestamp
 * @param {object} documentData.client - Client information
 * @param {string} documentData.client.code - Client code (RUT)
 * @param {string} documentData.client.firstName - Client first name
 * @param {string} documentData.client.lastName - Client last name
 * @param {string} documentData.client.email - Client email
 * @param {string} documentData.client.phone - Client phone
 * @param {string} documentData.client.address - Client address
 * @param {string} documentData.client.city - Client city
 * @param {string} documentData.client.company - Company name (for facturas)
 * @param {string} documentData.client.activity - Company activity
 * @param {array} documentData.details - Document details (line items)
 * @param {number} documentData.details[].variantId - Bsale variant ID
 * @param {number} documentData.details[].quantity - Quantity
 * @param {number} documentData.details[].quantity - Unit price
 * @param {number} documentData.details[].discount - Discount percentage
 * @param {string} documentData.details[].comment - Line comment
 * @param {string} documentData.reference - Reference document (for notas de credito)
 * @param {string} documentData.siiCode - SII code for reference document
 * @param {string} documentData.note - Document note
 */
export async function createBsaleDocument(apiToken, documentData) {
  const client = createBsaleClient(apiToken);
  
  const payload = {
    documentTypeId: documentData.documentTypeId,
    branchId: documentData.branchId,
    emissionDate: documentData.emissionDate || Math.floor(Date.now() / 1000),
    client: documentData.client,
    details: documentData.details.map(detail => ({
      variantId: detail.variantId,
      quantity: detail.quantity,
      unitPrice: detail.unitPrice,
      discount: detail.discount || 0,
      comment: detail.comment || '',
    })),
    note: documentData.note || '',
  };

  // Add reference for credit/debit notes
  if (documentData.reference) {
    payload.reference = documentData.reference;
    payload.siiCode = documentData.siiCode;
  }

  const response = await client.post('/documents.json', payload);
  return response.data;
}

/**
 * Create a Boleta
 */
export async function createBoleta(apiToken, branchId, orderData, items) {
  // Get document type ID for Boleta (usually 1 or configured)
  const documentTypes = await getBsaleDocumentTypes(apiToken);
  const boletaType = documentTypes.items?.find(
    dt => dt.name?.toLowerCase().includes('boleta') || dt.siiCode === 39
  );

  if (!boletaType) {
    throw new Error('Boleta document type not found in Bsale');
  }

  const documentData = {
    documentTypeId: boletaType.id,
    branchId: branchId,
    client: {
      code: orderData.customerRut || '', // Optional for boleta
      firstName: orderData.customerFirstName || '',
      lastName: orderData.customerLastName || '',
      email: orderData.customerEmail || '',
    },
    details: items.map(item => ({
      variantId: item.bsaleVariantId,
      quantity: item.quantity,
      unitPrice: item.price,
      discount: item.discount || 0,
      comment: item.name,
    })),
    note: `Shopify Order: ${orderData.orderName}`,
  };

  return createBsaleDocument(apiToken, documentData);
}

/**
 * Create a Factura
 */
export async function createFactura(apiToken, branchId, orderData, items) {
  // Get document type ID for Factura (usually 2 or configured)
  const documentTypes = await getBsaleDocumentTypes(apiToken);
  const facturaType = documentTypes.items?.find(
    dt => dt.name?.toLowerCase().includes('factura') || dt.siiCode === 33
  );

  if (!facturaType) {
    throw new Error('Factura document type not found in Bsale');
  }

  // Factura requires client RUT and company info
  if (!orderData.customerRut) {
    throw new Error('Customer RUT is required for Factura');
  }

  const documentData = {
    documentTypeId: facturaType.id,
    branchId: branchId,
    client: {
      code: orderData.customerRut,
      firstName: orderData.customerFirstName || '',
      lastName: orderData.customerLastName || '',
      email: orderData.customerEmail || '',
      company: orderData.companyName || '',
      activity: orderData.companyActivity || '',
      address: orderData.address || '',
      city: orderData.city || '',
      phone: orderData.phone || '',
    },
    details: items.map(item => ({
      variantId: item.bsaleVariantId,
      quantity: item.quantity,
      unitPrice: item.price,
      discount: item.discount || 0,
      comment: item.name,
    })),
    note: `Shopify Order: ${orderData.orderName}`,
  };

  return createBsaleDocument(apiToken, documentData);
}

/**
 * Create a Nota de Venta
 */
export async function createNotaVenta(apiToken, branchId, orderData, items) {
  // Get document type ID for Nota de Venta
  const documentTypes = await getBsaleDocumentTypes(apiToken);
  const notaVentaType = documentTypes.items?.find(
    dt => dt.name?.toLowerCase().includes('nota de venta') || dt.siiCode === 41
  );

  if (!notaVentaType) {
    throw new Error('Nota de Venta document type not found in Bsale');
  }

  const documentData = {
    documentTypeId: notaVentaType.id,
    branchId: branchId,
    client: {
      code: orderData.customerRut || '',
      firstName: orderData.customerFirstName || '',
      lastName: orderData.customerLastName || '',
      email: orderData.customerEmail || '',
    },
    details: items.map(item => ({
      variantId: item.bsaleVariantId,
      quantity: item.quantity,
      unitPrice: item.price,
      discount: item.discount || 0,
      comment: item.name,
    })),
    note: `Shopify Order: ${orderData.orderName}`,
  };

  return createBsaleDocument(apiToken, documentData);
}

/**
 * Create a Nota de Credito
 */
export async function createNotaCredito(apiToken, branchId, referenceDocument, orderData, items) {
  // Get document type ID for Nota de Credito
  const documentTypes = await getBsaleDocumentTypes(apiToken);
  const notaCreditoType = documentTypes.items?.find(
    dt => dt.name?.toLowerCase().includes('nota de credito') || dt.siiCode === 61
  );

  if (!notaCreditoType) {
    throw new Error('Nota de Credito document type not found in Bsale');
  }

  const documentData = {
    documentTypeId: notaCreditoType.id,
    branchId: branchId,
    client: {
      code: orderData.customerRut || '',
      firstName: orderData.customerFirstName || '',
      lastName: orderData.customerLastName || '',
      email: orderData.customerEmail || '',
    },
    details: items.map(item => ({
      variantId: item.bsaleVariantId,
      quantity: item.quantity,
      unitPrice: item.price,
      discount: item.discount || 0,
      comment: item.name,
    })),
    reference: referenceDocument.number,
    siiCode: referenceDocument.siiCode,
    note: `Refund for Shopify Order: ${orderData.orderName}`,
  };

  return createBsaleDocument(apiToken, documentData);
}

// ============================================
// CLIENT OPERATIONS
// ============================================

export async function getBsaleClients(apiToken, options = {}) {
  const client = createBsaleClient(apiToken);
  
  const params = {
    limit: options.limit || 50,
    offset: options.offset || 0,
  };

  if (options.code) {
    params.code = options.code;
  }

  if (options.email) {
    params.email = options.email;
  }

  const response = await client.get('/clients.json', { params });
  return response.data;
}

export async function getBsaleClientByRut(apiToken, rut) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.get('/clients.json', {
    params: { code: rut, limit: 1 },
  });

  return response.data.items?.[0] || null;
}

export async function createBsaleClient(apiToken, clientData) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.post('/clients.json', clientData);
  return response.data;
}

export async function updateBsaleClient(apiToken, clientId, updates) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.put(`/clients/${clientId}.json`, updates);
  return response.data;
}

// ============================================
// COMPANY AND BRANCH OPERATIONS
// ============================================

export async function getBsaleCompany(apiToken) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.get('/companies.json');
  return response.data.items?.[0] || null;
}

export async function getBsaleBranches(apiToken) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.get('/branches.json');
  return response.data;
}

export async function getBsaleWarehouses(apiToken, branchId) {
  const client = createBsaleClient(apiToken);
  
  const params = {};
  if (branchId) {
    params.branch_id = branchId;
  }

  const response = await client.get('/warehouses.json', { params });
  return response.data;
}

// ============================================
// TAX OPERATIONS
// ============================================

export async function getBsaleTaxes(apiToken) {
  const client = createBsaleClient(apiToken);
  
  const response = await client.get('/taxes.json');
  return response.data;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate RUT format (Chilean tax ID)
 */
export function validateRut(rut) {
  if (!rut) return false;
  
  // Remove dots and dashes
  const cleanRut = rut.replace(/[.-]/g, '');
  
  if (cleanRut.length < 8 || cleanRut.length > 9) return false;
  
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();
  
  let sum = 0;
  let multiplier = 2;
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const expectedDv = 11 - (sum % 11);
  const calculatedDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();
  
  return dv === calculatedDv;
}

/**
 * Format RUT for display
 */
export function formatRut(rut) {
  if (!rut) return '';
  
  const cleanRut = rut.replace(/[.-]/g, '');
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();
  
  // Add dots as thousands separator
  let formattedBody = '';
  for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) {
      formattedBody = '.' + formattedBody;
    }
    formattedBody = body[i] + formattedBody;
  }
  
  return `${formattedBody}-${dv}`;
}

export default {
  getBsaleProducts,
  getBsaleProduct,
  getBsaleProductByCode,
  createBsaleProduct,
  updateBsaleProduct,
  getBsaleVariants,
  getBsaleVariant,
  updateBsaleVariant,
  getBsaleStock,
  updateBsaleStock,
  adjustBsaleStock,
  getBsaleDocumentTypes,
  getBsaleDocuments,
  getBsaleDocument,
  getBsaleDocumentPDF,
  createBsaleDocument,
  createBoleta,
  createFactura,
  createNotaVenta,
  createNotaCredito,
  getBsaleClients,
  getBsaleClientByRut,
  createBsaleClient,
  updateBsaleClient,
  getBsaleCompany,
  getBsaleBranches,
  getBsaleWarehouses,
  getBsaleTaxes,
  validateRut,
  formatRut,
};