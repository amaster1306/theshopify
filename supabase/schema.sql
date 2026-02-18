-- Shopify Bsale Integration Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- SHOPS TABLE
-- Stores information about connected Shopify stores
-- ============================================
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_domain VARCHAR(255) UNIQUE NOT NULL,
    shop_name VARCHAR(255),
    shop_email VARCHAR(255),
    shop_currency VARCHAR(10) DEFAULT 'CLP',
    shop_timezone VARCHAR(100) DEFAULT 'America/Santiago',
    
    -- Shopify tokens
    access_token TEXT NOT NULL,
    scope TEXT,
    
    -- Bsale configuration
    bsale_api_token TEXT,
    bsale_company_id INTEGER,
    bsale_branch_id INTEGER,
    bsale_warehouse_id INTEGER,
    bsale_is_configured BOOLEAN DEFAULT FALSE,
    
    -- Plan subscription
    plan_id UUID REFERENCES plans(id),
    plan_status VARCHAR(50) DEFAULT 'trial', -- trial, active, past_due, cancelled
    plan_trial_ends_at TIMESTAMP WITH TIME ZONE,
    plan_subscription_id VARCHAR(255), -- Stripe/Polar subscription ID
    plan_subscription_status VARCHAR(50),
    
    -- Settings
    settings JSONB DEFAULT '{
        "auto_generate_documents": true,
        "default_document_type": "boleta",
        "sync_stock_enabled": true,
        "sync_stock_direction": "bidirectional",
        "sync_interval_minutes": 15,
        "notify_on_error": true,
        "notification_email": null
    }'::jsonb,
    
    -- Timestamps
    installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uninstalled_at TIMESTAMP WITH TIME ZONE,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    last_document_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_plan_status CHECK (plan_status IN ('trial', 'active', 'past_due', 'cancelled', 'expired'))
);

-- ============================================
-- PLANS TABLE
-- Subscription plans for the app
-- ============================================
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    
    -- Pricing
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Stripe/Polar IDs
    stripe_price_id_monthly VARCHAR(255),
    stripe_price_id_yearly VARCHAR(255),
    polar_product_id VARCHAR(255),
    
    -- Features
    features JSONB DEFAULT '{
        "max_orders_per_month": null,
        "max_documents_per_month": null,
        "stock_sync_enabled": true,
        "stock_sync_interval_minutes": 15,
        "document_types": ["boleta", "factura", "nota_venta"],
        "webhooks_enabled": true,
        "priority_support": false,
        "custom_branding": false
    }'::jsonb,
    
    -- Limits
    max_orders_per_month INTEGER,
    max_documents_per_month INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default plans
INSERT INTO plans (name, slug, description, price_monthly, price_yearly, features, max_orders_per_month, max_documents_per_month, is_popular, sort_order) VALUES
('Starter', 'starter', 'Perfect for small stores starting with Bsale integration', 19.00, 190.00, 
    '{"max_orders_per_month": 100, "max_documents_per_month": 100, "stock_sync_enabled": true, "stock_sync_interval_minutes": 60, "document_types": ["boleta"], "webhooks_enabled": true, "priority_support": false, "custom_branding": false}'::jsonb,
    100, 100, FALSE, 1),
    
('Professional', 'professional', 'Ideal for growing businesses with moderate order volume', 49.00, 490.00,
    '{"max_orders_per_month": 500, "max_documents_per_month": 500, "stock_sync_enabled": true, "stock_sync_interval_minutes": 15, "document_types": ["boleta", "factura", "nota_venta"], "webhooks_enabled": true, "priority_support": true, "custom_branding": false}'::jsonb,
    500, 500, TRUE, 2),
    
('Business', 'business', 'For established stores with high order volume', 99.00, 990.00,
    '{"max_orders_per_month": null, "max_documents_per_month": null, "stock_sync_enabled": true, "stock_sync_interval_minutes": 5, "document_types": ["boleta", "factura", "nota_venta"], "webhooks_enabled": true, "priority_support": true, "custom_branding": true}'::jsonb,
    NULL, NULL, FALSE, 3);

-- ============================================
-- PRODUCTS MAPPING TABLE
-- Maps Shopify products to Bsale products
-- ============================================
CREATE TABLE product_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Shopify product info
    shopify_product_id BIGINT NOT NULL,
    shopify_product_title VARCHAR(500),
    shopify_variant_id BIGINT,
    shopify_sku VARCHAR(255),
    
    -- Bsale product info
    bsale_product_id INTEGER NOT NULL,
    bsale_variant_id INTEGER,
    bsale_sku VARCHAR(255),
    bsale_name VARCHAR(500),
    
    -- Sync settings
    sync_stock BOOLEAN DEFAULT TRUE,
    sync_price BOOLEAN DEFAULT FALSE,
    last_stock_sync_at TIMESTAMP WITH TIME ZONE,
    last_stock_sync_quantity INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    sync_error TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(shop_id, shopify_product_id, shopify_variant_id)
);

-- ============================================
-- DOCUMENTS TABLE
-- Generated documents (boletas, facturas, notas de venta)
-- ============================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Shopify order info
    shopify_order_id BIGINT NOT NULL,
    shopify_order_name VARCHAR(50),
    shopify_order_number INTEGER,
    
    -- Bsale document info
    bsale_document_id INTEGER,
    bsale_document_number VARCHAR(50),
    bsale_document_type VARCHAR(50) NOT NULL, -- boleta, factura, nota_venta
    bsale_sii_code INTEGER, -- SII document code
    
    -- Customer info
    customer_rut VARCHAR(20), -- Chilean RUT
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    
    -- Document details
    document_type VARCHAR(50) NOT NULL,
    gross_amount DECIMAL(12, 2),
    tax_amount DECIMAL(12, 2),
    net_amount DECIMAL(12, 2),
    currency VARCHAR(10) DEFAULT 'CLP',
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, generated, sent, error, cancelled
    sii_status VARCHAR(50), -- SII acceptance status
    sii_track_id VARCHAR(100),
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_retry_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    generated_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_document_status CHECK (status IN ('pending', 'generated', 'sent', 'error', 'cancelled')),
    CONSTRAINT valid_document_type CHECK (document_type IN ('boleta', 'factura', 'nota_venta', 'nota_credito', 'nota_debito'))
);

-- ============================================
-- STOCK SYNC LOG TABLE
-- Records of stock synchronization operations
-- ============================================
CREATE TABLE stock_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    product_mapping_id UUID REFERENCES product_mappings(id) ON DELETE SET NULL,
    
    -- Sync direction
    direction VARCHAR(20) NOT NULL, -- shopify_to_bsale, bsale_to_shopify
    
    -- Stock changes
    previous_quantity INTEGER,
    new_quantity INTEGER,
    delta INTEGER,
    
    -- Source info
    source VARCHAR(50) NOT NULL, -- webhook, manual, scheduled
    source_id VARCHAR(255), -- ID of the triggering event
    
    -- Status
    status VARCHAR(50) DEFAULT 'success', -- success, error, pending
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_sync_direction CHECK (direction IN ('shopify_to_bsale', 'bsale_to_shopify')),
    CONSTRAINT valid_sync_status CHECK (status IN ('success', 'error', 'pending'))
);

-- ============================================
-- WEBHOOK EVENTS TABLE
-- Stores incoming webhook events for processing
-- ============================================
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Webhook info
    topic VARCHAR(100) NOT NULL, -- orders/create, products/update, etc.
    payload JSONB NOT NULL,
    headers JSONB,
    
    -- Processing
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Result
    result JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_webhook_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- ============================================
-- USAGE TRACKING TABLE
-- Monthly usage statistics for billing
-- ============================================
CREATE TABLE usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Period
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    
    -- Usage counts
    orders_count INTEGER DEFAULT 0,
    documents_count INTEGER DEFAULT 0,
    documents_boletas INTEGER DEFAULT 0,
    documents_facturas INTEGER DEFAULT 0,
    documents_notas_venta INTEGER DEFAULT 0,
    stock_syncs_count INTEGER DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0,
    
    -- Errors
    errors_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(shop_id, year, month)
);

-- ============================================
-- NOTIFICATIONS TABLE
-- System notifications for shop owners
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
    
    -- Notification
    type VARCHAR(50) NOT NULL, -- error, warning, info, success
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Related entity
    entity_type VARCHAR(50), -- document, stock_sync, webhook
    entity_id UUID,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_notification_type CHECK (type IN ('error', 'warning', 'info', 'success'))
);

-- ============================================
-- AUDIT LOG TABLE
-- Tracks all important changes
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE SET NULL,
    
    -- Action
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(255),
    
    -- Changes
    old_values JSONB,
    new_values JSONB,
    
    -- Actor
    actor_type VARCHAR(50), -- system, user, webhook
    actor_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_shops_domain ON shops(shop_domain);
CREATE INDEX idx_shops_plan_status ON shops(plan_status);
CREATE INDEX idx_shops_last_sync ON shops(last_sync_at DESC);

CREATE INDEX idx_product_mappings_shop ON product_mappings(shop_id);
CREATE INDEX idx_product_mappings_shopify ON product_mappings(shopify_product_id, shopify_variant_id);
CREATE INDEX idx_product_mappings_bsale ON product_mappings(bsale_product_id);

CREATE INDEX idx_documents_shop ON documents(shop_id);
CREATE INDEX idx_documents_order ON documents(shopify_order_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_created ON documents(created_at DESC);

CREATE INDEX idx_stock_sync_shop ON stock_sync_logs(shop_id);
CREATE INDEX idx_stock_sync_created ON stock_sync_logs(created_at DESC);

CREATE INDEX idx_webhook_shop ON webhook_events(shop_id);
CREATE INDEX idx_webhook_status ON webhook_events(status);
CREATE INDEX idx_webhook_created ON webhook_events(created_at DESC);

CREATE INDEX idx_usage_shop_period ON usage_tracking(shop_id, year, month);

CREATE INDEX idx_notifications_shop ON notifications(shop_id);
CREATE INDEX idx_notifications_unread ON notifications(shop_id, is_read);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Plans are publicly readable
CREATE POLICY "Plans are publicly readable" ON plans
    FOR SELECT USING (is_active = TRUE);

-- Shop policies (authenticated via API)
CREATE POLICY "Shops are readable by owner" ON shops
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Shops are updatable by owner" ON shops
    FOR UPDATE USING (auth.uid()::text = id::text);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_mappings_updated_at BEFORE UPDATE ON product_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment usage tracking
CREATE OR REPLACE FUNCTION increment_usage(
    p_shop_id UUID,
    p_orders INTEGER DEFAULT 0,
    p_documents INTEGER DEFAULT 0,
    p_boletas INTEGER DEFAULT 0,
    p_facturas INTEGER DEFAULT 0,
    p_notas_venta INTEGER DEFAULT 0,
    p_stock_syncs INTEGER DEFAULT 0,
    p_api_calls INTEGER DEFAULT 0,
    p_errors INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO usage_tracking (shop_id, year, month, orders_count, documents_count, 
        documents_boletas, documents_facturas, documents_notas_venta, 
        stock_syncs_count, api_calls_count, errors_count)
    VALUES (p_shop_id, EXTRACT(YEAR FROM NOW()), EXTRACT(MONTH FROM NOW()),
        p_orders, p_documents, p_boletas, p_facturas, p_notas_venta,
        p_stock_syncs, p_api_calls, p_errors)
    ON CONFLICT (shop_id, year, month) DO UPDATE SET
        orders_count = usage_tracking.orders_count + p_orders,
        documents_count = usage_tracking.documents_count + p_documents,
        documents_boletas = usage_tracking.documents_boletas + p_boletas,
        documents_facturas = usage_tracking.documents_facturas + p_facturas,
        documents_notas_venta = usage_tracking.documents_notas_venta + p_notas_venta,
        stock_syncs_count = usage_tracking.stock_syncs_count + p_stock_syncs,
        api_calls_count = usage_tracking.api_calls_count + p_api_calls,
        errors_count = usage_tracking.errors_count + p_errors,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check plan limits
CREATE OR REPLACE FUNCTION check_plan_limit(
    p_shop_id UUID,
    p_limit_type VARCHAR -- 'orders' or 'documents'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_plan_features JSONB;
    v_current_usage INTEGER;
    v_limit INTEGER;
BEGIN
    -- Get plan features
    SELECT features INTO v_plan_features
    FROM plans p
    JOIN shops s ON s.plan_id = p.id
    WHERE s.id = p_shop_id;
    
    IF v_plan_features IS NULL THEN
        RETURN TRUE; -- No plan, allow (trial mode)
    END IF;
    
    -- Get current month usage
    SELECT 
        CASE WHEN p_limit_type = 'orders' THEN orders_count
             WHEN p_limit_type = 'documents' THEN documents_count
        END
    INTO v_current_usage
    FROM usage_tracking
    WHERE shop_id = p_shop_id
    AND year = EXTRACT(YEAR FROM NOW())
    AND month = EXTRACT(MONTH FROM NOW());
    
    v_current_usage := COALESCE(v_current_usage, 0);
    
    -- Get limit from plan
    v_limit := CASE WHEN p_limit_type = 'orders' THEN (v_plan_features->>'max_orders_per_month')::INTEGER
                    WHEN p_limit_type = 'documents' THEN (v_plan_features->>'max_documents_per_month')::INTEGER
               END;
    
    -- null limit means unlimited
    IF v_limit IS NULL THEN
        RETURN TRUE;
    END IF;
    
    RETURN v_current_usage < v_limit;
END;
$$ LANGUAGE plpgsql;