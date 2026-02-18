export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      shops: {
        Row: {
          id: string
          shop_domain: string
          shop_name: string | null
          shop_email: string | null
          shop_currency: string
          shop_timezone: string
          access_token: string
          scope: string | null
          bsale_api_token: string | null
          bsale_company_id: number | null
          bsale_branch_id: number | null
          bsale_warehouse_id: number | null
          bsale_is_configured: boolean
          plan_id: string | null
          plan_status: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
          plan_trial_ends_at: string | null
          plan_subscription_id: string | null
          plan_subscription_status: string | null
          settings: ShopSettings
          installed_at: string
          uninstalled_at: string | null
          last_sync_at: string | null
          last_document_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_domain: string
          shop_name?: string | null
          shop_email?: string | null
          shop_currency?: string
          shop_timezone?: string
          access_token: string
          scope?: string | null
          bsale_api_token?: string | null
          bsale_company_id?: number | null
          bsale_branch_id?: number | null
          bsale_warehouse_id?: number | null
          bsale_is_configured?: boolean
          plan_id?: string | null
          plan_status?: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
          plan_trial_ends_at?: string | null
          plan_subscription_id?: string | null
          plan_subscription_status?: string | null
          settings?: ShopSettings
          installed_at?: string
          uninstalled_at?: string | null
          last_sync_at?: string | null
          last_document_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_domain?: string
          shop_name?: string | null
          shop_email?: string | null
          shop_currency?: string
          shop_timezone?: string
          access_token?: string
          scope?: string | null
          bsale_api_token?: string | null
          bsale_company_id?: number | null
          bsale_branch_id?: number | null
          bsale_warehouse_id?: number | null
          bsale_is_configured?: boolean
          plan_id?: string | null
          plan_status?: 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
          plan_trial_ends_at?: string | null
          plan_subscription_id?: string | null
          plan_subscription_status?: string | null
          settings?: ShopSettings
          installed_at?: string
          uninstalled_at?: string | null
          last_sync_at?: string | null
          last_document_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          price_monthly: number
          price_yearly: number | null
          currency: string
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          polar_product_id: string | null
          features: PlanFeatures
          max_orders_per_month: number | null
          max_documents_per_month: number | null
          is_active: boolean
          is_popular: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          price_monthly: number
          price_yearly?: number | null
          currency?: string
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          polar_product_id?: string | null
          features?: PlanFeatures
          max_orders_per_month?: number | null
          max_documents_per_month?: number | null
          is_active?: boolean
          is_popular?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          price_monthly?: number
          price_yearly?: number | null
          currency?: string
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          polar_product_id?: string | null
          features?: PlanFeatures
          max_orders_per_month?: number | null
          max_documents_per_month?: number | null
          is_active?: boolean
          is_popular?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      product_mappings: {
        Row: {
          id: string
          shop_id: string
          shopify_product_id: number
          shopify_product_title: string | null
          shopify_variant_id: number | null
          shopify_sku: string | null
          bsale_product_id: number
          bsale_variant_id: number | null
          bsale_sku: string | null
          bsale_name: string | null
          sync_stock: boolean
          sync_price: boolean
          last_stock_sync_at: string | null
          last_stock_sync_quantity: number | null
          is_active: boolean
          sync_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          shopify_product_id: number
          shopify_product_title?: string | null
          shopify_variant_id?: number | null
          shopify_sku?: string | null
          bsale_product_id: number
          bsale_variant_id?: number | null
          bsale_sku?: string | null
          bsale_name?: string | null
          sync_stock?: boolean
          sync_price?: boolean
          last_stock_sync_at?: string | null
          last_stock_sync_quantity?: number | null
          is_active?: boolean
          sync_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          shopify_product_id?: number
          shopify_product_title?: string | null
          shopify_variant_id?: number | null
          shopify_sku?: string | null
          bsale_product_id?: number
          bsale_variant_id?: number | null
          bsale_sku?: string | null
          bsale_name?: string | null
          sync_stock?: boolean
          sync_price?: boolean
          last_stock_sync_at?: string | null
          last_stock_sync_quantity?: number | null
          is_active?: boolean
          sync_error?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          shop_id: string
          shopify_order_id: number
          shopify_order_name: string | null
          shopify_order_number: number | null
          bsale_document_id: number | null
          bsale_document_number: string | null
          bsale_document_type: string | null
          bsale_sii_code: number | null
          customer_rut: string | null
          customer_name: string | null
          customer_email: string | null
          document_type: 'boleta' | 'factura' | 'nota_venta' | 'nota_credito' | 'nota_debito'
          gross_amount: number | null
          tax_amount: number | null
          net_amount: number | null
          currency: string
          status: 'pending' | 'generated' | 'sent' | 'error' | 'cancelled'
          sii_status: string | null
          sii_track_id: string | null
          error_message: string | null
          retry_count: number
          last_retry_at: string | null
          generated_at: string | null
          sent_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          shopify_order_id: number
          shopify_order_name?: string | null
          shopify_order_number?: number | null
          bsale_document_id?: number | null
          bsale_document_number?: string | null
          bsale_document_type?: string | null
          bsale_sii_code?: number | null
          customer_rut?: string | null
          customer_name?: string | null
          customer_email?: string | null
          document_type: 'boleta' | 'factura' | 'nota_venta' | 'nota_credito' | 'nota_debito'
          gross_amount?: number | null
          tax_amount?: number | null
          net_amount?: number | null
          currency?: string
          status?: 'pending' | 'generated' | 'sent' | 'error' | 'cancelled'
          sii_status?: string | null
          sii_track_id?: string | null
          error_message?: string | null
          retry_count?: number
          last_retry_at?: string | null
          generated_at?: string | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          shopify_order_id?: number
          shopify_order_name?: string | null
          shopify_order_number?: number | null
          bsale_document_id?: number | null
          bsale_document_number?: string | null
          bsale_document_type?: string | null
          bsale_sii_code?: number | null
          customer_rut?: string | null
          customer_name?: string | null
          customer_email?: string | null
          document_type?: 'boleta' | 'factura' | 'nota_venta' | 'nota_credito' | 'nota_debito'
          gross_amount?: number | null
          tax_amount?: number | null
          net_amount?: number | null
          currency?: string
          status?: 'pending' | 'generated' | 'sent' | 'error' | 'cancelled'
          sii_status?: string | null
          sii_track_id?: string | null
          error_message?: string | null
          retry_count?: number
          last_retry_at?: string | null
          generated_at?: string | null
          sent_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stock_sync_logs: {
        Row: {
          id: string
          shop_id: string
          product_mapping_id: string | null
          direction: 'shopify_to_bsale' | 'bsale_to_shopify'
          previous_quantity: number | null
          new_quantity: number | null
          delta: number | null
          source: string
          source_id: string | null
          status: 'success' | 'error' | 'pending'
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          product_mapping_id?: string | null
          direction: 'shopify_to_bsale' | 'bsale_to_shopify'
          previous_quantity?: number | null
          new_quantity?: number | null
          delta?: number | null
          source: string
          source_id?: string | null
          status?: 'success' | 'error' | 'pending'
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          product_mapping_id?: string | null
          direction?: 'shopify_to_bsale' | 'bsale_to_shopify'
          previous_quantity?: number | null
          new_quantity?: number | null
          delta?: number | null
          source?: string
          source_id?: string | null
          status?: 'success' | 'error' | 'pending'
          error_message?: string | null
          created_at?: string
        }
      }
      webhook_events: {
        Row: {
          id: string
          shop_id: string
          topic: string
          payload: Json
          headers: Json | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          processed_at: string | null
          error_message: string | null
          retry_count: number
          result: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          topic: string
          payload: Json
          headers?: Json | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          processed_at?: string | null
          error_message?: string | null
          retry_count?: number
          result?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          topic?: string
          payload?: Json
          headers?: Json | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          processed_at?: string | null
          error_message?: string | null
          retry_count?: number
          result?: Json | null
          created_at?: string
        }
      }
      usage_tracking: {
        Row: {
          id: string
          shop_id: string
          year: number
          month: number
          orders_count: number
          documents_count: number
          documents_boletas: number
          documents_facturas: number
          documents_notas_venta: number
          stock_syncs_count: number
          api_calls_count: number
          errors_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          year: number
          month: number
          orders_count?: number
          documents_count?: number
          documents_boletas?: number
          documents_facturas?: number
          documents_notas_venta?: number
          stock_syncs_count?: number
          api_calls_count?: number
          errors_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          year?: number
          month?: number
          orders_count?: number
          documents_count?: number
          documents_boletas?: number
          documents_facturas?: number
          documents_notas_venta?: number
          stock_syncs_count?: number
          api_calls_count?: number
          errors_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          shop_id: string
          type: 'error' | 'warning' | 'info' | 'success'
          title: string
          message: string
          entity_type: string | null
          entity_id: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          type: 'error' | 'warning' | 'info' | 'success'
          title: string
          message: string
          entity_type?: string | null
          entity_id?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          type?: 'error' | 'warning' | 'info' | 'success'
          title?: string
          message?: string
          entity_type?: string | null
          entity_id?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          shop_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_values: Json | null
          new_values: Json | null
          actor_type: string | null
          actor_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          shop_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          actor_type?: string | null
          actor_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          actor_type?: string | null
          actor_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_usage: {
        Args: {
          p_shop_id: string
          p_orders?: number
          p_documents?: number
          p_boletas?: number
          p_facturas?: number
          p_notas_venta?: number
          p_stock_syncs?: number
          p_api_calls?: number
          p_errors?: number
        }
        Returns: void
      }
      check_plan_limit: {
        Args: {
          p_shop_id: string
          p_limit_type: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Type exports for convenience
export type Shop = Database['public']['Tables']['shops']['Row']
export type ShopInsert = Database['public']['Tables']['shops']['Insert']
export type ShopUpdate = Database['public']['Tables']['shops']['Update']

export type Plan = Database['public']['Tables']['plans']['Row']
export type PlanInsert = Database['public']['Tables']['plans']['Insert']
export type PlanUpdate = Database['public']['Tables']['plans']['Update']

export type ProductMapping = Database['public']['Tables']['product_mappings']['Row']
export type ProductMappingInsert = Database['public']['Tables']['product_mappings']['Insert']
export type ProductMappingUpdate = Database['public']['Tables']['product_mappings']['Update']

export type Document = Database['public']['Tables']['documents']['Row']
export type DocumentInsert = Database['public']['Tables']['documents']['Insert']
export type DocumentUpdate = Database['public']['Tables']['documents']['Update']

export type StockSyncLog = Database['public']['Tables']['stock_sync_logs']['Row']
export type StockSyncLogInsert = Database['public']['Tables']['stock_sync_logs']['Insert']

export type WebhookEvent = Database['public']['Tables']['webhook_events']['Row']
export type WebhookEventInsert = Database['public']['Tables']['webhook_events']['Insert']

export type UsageTracking = Database['public']['Tables']['usage_tracking']['Row']
export type UsageTrackingInsert = Database['public']['Tables']['usage_tracking']['Insert']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']

export type AuditLog = Database['public']['Tables']['audit_logs']['Row']
export type AuditLogInsert = Database['public']['Tables']['audit_logs']['Insert']

// JSONB type definitions
export interface ShopSettings {
  auto_generate_documents: boolean
  default_document_type: 'boleta' | 'factura' | 'nota_venta'
  sync_stock_enabled: boolean
  sync_stock_direction: 'bidirectional' | 'shopify_to_bsale' | 'bsale_to_shopify'
  sync_interval_minutes: number
  notify_on_error: boolean
  notification_email: string | null
}

export interface PlanFeatures {
  max_orders_per_month: number | null
  max_documents_per_month: number | null
  stock_sync_enabled: boolean
  stock_sync_interval_minutes: number
  document_types: ('boleta' | 'factura' | 'nota_venta')[]
  webhooks_enabled: boolean
  priority_support: boolean
  custom_branding: boolean
}