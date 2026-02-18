import React, { createContext, useContext } from 'react';

const ShopContext = createContext(null);

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopContext.Provider');
  }
  return context;
}

export function usePlanFeatures() {
  const { shop } = useShop();
  
  if (!shop?.plan?.features) {
    return {
      maxOrdersPerMonth: null,
      maxDocumentsPerMonth: null,
      stockSyncEnabled: true,
      stockSyncIntervalMinutes: 60,
      documentTypes: ['boleta'],
      webhooksEnabled: true,
      prioritySupport: false,
      customBranding: false,
    };
  }
  
  return {
    maxOrdersPerMonth: shop.plan.features.max_orders_per_month,
    maxDocumentsPerMonth: shop.plan.features.max_documents_per_month,
    stockSyncEnabled: shop.plan.features.stock_sync_enabled,
    stockSyncIntervalMinutes: shop.plan.features.stock_sync_interval_minutes,
    documentTypes: shop.plan.features.document_types,
    webhooksEnabled: shop.plan.features.webhooks_enabled,
    prioritySupport: shop.plan.features.priority_support,
    customBranding: shop.plan.features.custom_branding,
  };
}

export function usePlanStatus() {
  const { planStatus, shop } = useShop();
  
  const isTrial = planStatus === 'trial';
  const isActive = planStatus === 'active';
  const isPastDue = planStatus === 'past_due';
  const isCancelled = planStatus === 'cancelled';
  const isExpired = planStatus === 'expired';
  
  const trialEndsAt = shop?.trialEndsAt ? new Date(shop.trialEndsAt) : null;
  const trialDaysRemaining = trialEndsAt 
    ? Math.max(0, Math.ceil((trialEndsAt - new Date()) / (1000 * 60 * 60 * 24)))
    : 0;
  
  return {
    planStatus,
    isTrial,
    isActive,
    isPastDue,
    isCancelled,
    isExpired,
    trialEndsAt,
    trialDaysRemaining,
    needsPayment: isPastDue || isExpired,
  };
}

export default ShopContext;