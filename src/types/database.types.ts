export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "admin" | "staff" | "customer";
export type BillingInterval = "month" | "year" | "week" | "quarter";
export type QuotationStatus =
  | "draft"
  | "sent"
  | "approved"
  | "rejected"
  | "converted"
  | "expired"
  | "cancelled";
export type SubscriptionStatus =
  | "active"
  | "paused"
  | "past_due"
  | "cancelled"
  | "expired";
export type InvoiceStatus =
  | "draft"
  | "issued"
  | "paid"
  | "overdue"
  | "cancelled"
  | "void";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentMethod =
  | "credit_card"
  | "bank_transfer"
  | "cash"
  | "manual"
  | "other";
export type DiscountType = "percentage" | "fixed_amount";
export type CancellationStatus = "pending" | "approved" | "rejected";
export type NotificationChannel = "in_app" | "email";
export type NotificationStatus = "unread" | "read" | "sent" | "failed";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          email: string;
          phone: string | null;
          company_name: string | null;
          billing_address: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name?: string | null;
          email: string;
          phone?: string | null;
          company_name?: string | null;
          billing_address?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string | null;
          email?: string;
          phone?: string | null;
          company_name?: string | null;
          billing_address?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customer_staff_assignments: {
        Row: {
          id: string;
          customer_id: string;
          staff_id: string;
          assigned_by: string | null;
          permissions: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          staff_id: string;
          assigned_by?: string | null;
          permissions?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          staff_id?: string;
          assigned_by?: string | null;
          permissions?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          sku: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          sku?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          sku?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          sku: string | null;
          attributes: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          sku?: string | null;
          attributes?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          sku?: string | null;
          attributes?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          name: string;
          billing_interval: BillingInterval;
          interval_count: number;
          price: number;
          currency: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          name: string;
          billing_interval: BillingInterval;
          interval_count?: number;
          price: number;
          currency?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_id?: string | null;
          name?: string;
          billing_interval?: BillingInterval;
          interval_count?: number;
          price?: number;
          currency?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      discounts: {
        Row: {
          id: string;
          code: string;
          type: DiscountType;
          value: number;
          currency: string | null;
          starts_at: string | null;
          ends_at: string | null;
          max_redemptions: number | null;
          times_redeemed: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          type: DiscountType;
          value: number;
          currency?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          max_redemptions?: number | null;
          times_redeemed?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          type?: DiscountType;
          value?: number;
          currency?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          max_redemptions?: number | null;
          times_redeemed?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tax_rules: {
        Row: {
          id: string;
          name: string;
          jurisdiction: string;
          rate: number;
          is_inclusive: boolean;
          priority: number;
          starts_at: string | null;
          ends_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          jurisdiction: string;
          rate: number;
          is_inclusive?: boolean;
          priority?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          jurisdiction?: string;
          rate?: number;
          is_inclusive?: boolean;
          priority?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quotations: {
        Row: {
          id: string;
          quotation_number: string;
          customer_id: string;
          created_by: string;
          status: QuotationStatus;
          valid_until: string;
          currency: string;
          subtotal: number;
          discount_total: number;
          tax_total: number;
          total: number;
          accepted_at: string | null;
          converted_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          quotation_number: string;
          customer_id: string;
          created_by: string;
          status?: QuotationStatus;
          valid_until: string;
          currency?: string;
          subtotal?: number;
          discount_total?: number;
          tax_total?: number;
          total?: number;
          accepted_at?: string | null;
          converted_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          quotation_number?: string;
          customer_id?: string;
          created_by?: string;
          status?: QuotationStatus;
          valid_until?: string;
          currency?: string;
          subtotal?: number;
          discount_total?: number;
          tax_total?: number;
          total?: number;
          accepted_at?: string | null;
          converted_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      quotation_items: {
        Row: {
          id: string;
          quotation_id: string;
          product_id: string | null;
          variant_id: string | null;
          plan_id: string | null;
          description: string;
          sku: string | null;
          quantity: number;
          unit_price: number;
          discount_amount: number;
          tax_rate: number;
          tax_amount: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quotation_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          plan_id?: string | null;
          description: string;
          sku?: string | null;
          quantity: number;
          unit_price: number;
          discount_amount?: number;
          tax_rate?: number;
          tax_amount?: number;
          line_total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quotation_id?: string;
          product_id?: string | null;
          variant_id?: string | null;
          plan_id?: string | null;
          description?: string;
          sku?: string | null;
          quantity?: number;
          unit_price?: number;
          discount_amount?: number;
          tax_rate?: number;
          tax_amount?: number;
          line_total?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          subscription_number: string;
          customer_id: string;
          source_quotation_id: string | null;
          status: SubscriptionStatus;
          billing_interval: BillingInterval;
          interval_count: number;
          currency: string;
          current_period_start: string;
          current_period_end: string;
          auto_renew: boolean;
          subtotal: number;
          discount_total: number;
          tax_total: number;
          total: number;
          cancelled_at: string | null;
          cancel_at_period_end: boolean;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subscription_number: string;
          customer_id: string;
          source_quotation_id?: string | null;
          status?: SubscriptionStatus;
          billing_interval: BillingInterval;
          interval_count?: number;
          currency?: string;
          current_period_start: string;
          current_period_end: string;
          auto_renew?: boolean;
          subtotal?: number;
          discount_total?: number;
          tax_total?: number;
          total?: number;
          cancelled_at?: string | null;
          cancel_at_period_end?: boolean;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subscription_number?: string;
          customer_id?: string;
          source_quotation_id?: string | null;
          status?: SubscriptionStatus;
          billing_interval?: BillingInterval;
          interval_count?: number;
          currency?: string;
          current_period_start?: string;
          current_period_end?: string;
          auto_renew?: boolean;
          subtotal?: number;
          discount_total?: number;
          tax_total?: number;
          total?: number;
          cancelled_at?: string | null;
          cancel_at_period_end?: boolean;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscription_items: {
        Row: {
          id: string;
          subscription_id: string;
          plan_id: string | null;
          product_id: string | null;
          variant_id: string | null;
          description: string;
          sku: string | null;
          quantity: number;
          unit_price: number;
          discount_amount: number;
          tax_rate: number;
          tax_amount: number;
          line_total: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          plan_id?: string | null;
          product_id?: string | null;
          variant_id?: string | null;
          description: string;
          sku?: string | null;
          quantity: number;
          unit_price: number;
          discount_amount?: number;
          tax_rate?: number;
          tax_amount?: number;
          line_total: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          plan_id?: string | null;
          product_id?: string | null;
          variant_id?: string | null;
          description?: string;
          sku?: string | null;
          quantity?: number;
          unit_price?: number;
          discount_amount?: number;
          tax_rate?: number;
          tax_amount?: number;
          line_total?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          customer_id: string;
          subscription_id: string | null;
          billing_period_start: string;
          billing_period_end: string;
          status: InvoiceStatus;
          due_date: string;
          currency: string;
          subtotal: number;
          discount_total: number;
          tax_total: number;
          total: number;
          amount_paid: number;
          amount_due: number;
          issued_at: string;
          paid_at: string | null;
          pdf_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          invoice_number: string;
          customer_id: string;
          subscription_id?: string | null;
          billing_period_start: string;
          billing_period_end: string;
          status?: InvoiceStatus;
          due_date: string;
          currency?: string;
          subtotal: number;
          discount_total?: number;
          tax_total?: number;
          total: number;
          amount_paid?: number;
          amount_due: number;
          issued_at?: string;
          paid_at?: string | null;
          pdf_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          invoice_number?: string;
          customer_id?: string;
          subscription_id?: string | null;
          billing_period_start?: string;
          billing_period_end?: string;
          status?: InvoiceStatus;
          due_date?: string;
          currency?: string;
          subtotal?: number;
          discount_total?: number;
          tax_total?: number;
          total?: number;
          amount_paid?: number;
          amount_due?: number;
          issued_at?: string;
          paid_at?: string | null;
          pdf_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          subscription_item_id: string | null;
          description: string;
          sku: string | null;
          quantity: number;
          unit_price: number;
          discount_amount: number;
          tax_rate: number;
          tax_amount: number;
          line_total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          subscription_item_id?: string | null;
          description: string;
          sku?: string | null;
          quantity: number;
          unit_price: number;
          discount_amount?: number;
          tax_rate?: number;
          tax_amount?: number;
          line_total: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          subscription_item_id?: string | null;
          description?: string;
          sku?: string | null;
          quantity?: number;
          unit_price?: number;
          discount_amount?: number;
          tax_rate?: number;
          tax_amount?: number;
          line_total?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          payment_number: string;
          invoice_id: string;
          customer_id: string;
          amount: number;
          currency: string;
          payment_method: PaymentMethod;
          provider: string | null;
          provider_transaction_id: string | null;
          status: PaymentStatus;
          recorded_by: string | null;
          verified_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          payment_number: string;
          invoice_id: string;
          customer_id: string;
          amount: number;
          currency?: string;
          payment_method: PaymentMethod;
          provider?: string | null;
          provider_transaction_id?: string | null;
          status?: PaymentStatus;
          recorded_by?: string | null;
          verified_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          payment_number?: string;
          invoice_id?: string;
          customer_id?: string;
          amount?: number;
          currency?: string;
          payment_method?: PaymentMethod;
          provider?: string | null;
          provider_transaction_id?: string | null;
          status?: PaymentStatus;
          recorded_by?: string | null;
          verified_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      cancellation_requests: {
        Row: {
          id: string;
          subscription_id: string;
          customer_id: string;
          reason: string;
          status: CancellationStatus;
          decision_by: string | null;
          decision_notes: string | null;
          effective_date: string | null;
          decided_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          customer_id: string;
          reason: string;
          status?: CancellationStatus;
          decision_by?: string | null;
          decision_notes?: string | null;
          effective_date?: string | null;
          decided_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          customer_id?: string;
          reason?: string;
          status?: CancellationStatus;
          decision_by?: string | null;
          decision_notes?: string | null;
          effective_date?: string | null;
          decided_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscription_events: {
        Row: {
          id: string;
          subscription_id: string;
          event_type: string;
          actor_id: string | null;
          occurred_at: string;
          metadata: Json;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          event_type: string;
          actor_id?: string | null;
          occurred_at?: string;
          metadata?: Json;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          event_type?: string;
          actor_id?: string | null;
          occurred_at?: string;
          metadata?: Json;
        };
        Relationships: [];
      };
      activity_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          changes: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          changes?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          entity_type?: string;
          entity_id?: string;
          action?: string;
          changes?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          title: string;
          message: string;
          channel: NotificationChannel;
          status: NotificationStatus;
          metadata: Json;
          sent_at: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          title: string;
          message: string;
          channel?: NotificationChannel;
          status?: NotificationStatus;
          metadata?: Json;
          sent_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipient_id?: string;
          title?: string;
          message?: string;
          channel?: NotificationChannel;
          status?: NotificationStatus;
          metadata?: Json;
          sent_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      current_user_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_assigned_to_customer: {
        Args: {
          target_customer_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      billing_interval: BillingInterval;
      quotation_status: QuotationStatus;
      subscription_status: SubscriptionStatus;
      invoice_status: InvoiceStatus;
      payment_status: PaymentStatus;
      payment_method: PaymentMethod;
      discount_type: DiscountType;
      cancellation_status: CancellationStatus;
      notification_channel: NotificationChannel;
      notification_status: NotificationStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
