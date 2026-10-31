-- ==============================================================================
-- Subscription Management System — Initial Production Schema Migration
-- Matches CLAUDE.md, docs/DATABASE_DESIGN.md, docs/ER_DIAGRAM.md, docs/SECURITY.md
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Helper Functions for Authentication, Roles & Triggers
-- ------------------------------------------------------------------------------

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 2. Core Profiles Table (1:1 with auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'staff', 'customer')) DEFAULT 'customer',
  full_name text,
  email text NOT NULL,
  phone text,
  company_name text,
  billing_address jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Safe security helper functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'staff') AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Automatically create customer profile on auth.users sign-up (default customer role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 3. Customer Staff Assignments
-- ------------------------------------------------------------------------------
CREATE TABLE public.customer_staff_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_active_customer_staff UNIQUE (customer_id, staff_id)
);

CREATE TRIGGER set_assignments_updated_at
  BEFORE UPDATE ON public.customer_staff_assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.is_assigned_to_customer(target_customer_id uuid)
RETURNS boolean AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public.customer_staff_assignments
    WHERE staff_id = auth.uid()
      AND customer_id = target_customer_id
      AND is_active = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 4. Catalogue: Products & Product Variants
-- ------------------------------------------------------------------------------
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sku text UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  name text NOT NULL,
  sku text UNIQUE,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. Plans
-- ------------------------------------------------------------------------------
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  name text NOT NULL,
  billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'year', 'week', 'quarter')),
  interval_count integer NOT NULL DEFAULT 1 CHECK (interval_count > 0),
  price numeric(14,2) NOT NULL CHECK (price >= 0),
  currency text NOT NULL DEFAULT 'USD',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 6. Discounts & Tax Rules
-- ------------------------------------------------------------------------------
CREATE TABLE public.discounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed_amount')),
  value numeric(14,2) NOT NULL CHECK (value > 0),
  currency text DEFAULT 'USD',
  starts_at timestamptz,
  ends_at timestamptz,
  max_redemptions integer,
  times_redeemed integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_discounts_updated_at
  BEFORE UPDATE ON public.discounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  jurisdiction text NOT NULL,
  rate numeric(6,4) NOT NULL CHECK (rate >= 0),
  is_inclusive boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_tax_rules_updated_at
  BEFORE UPDATE ON public.tax_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 7. Quotations & Quotation Items
-- ------------------------------------------------------------------------------
CREATE TABLE public.quotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('draft', 'sent', 'approved', 'rejected', 'converted', 'expired', 'cancelled')) DEFAULT 'draft',
  valid_until timestamptz NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  subtotal numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  discount_total numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (discount_total >= 0),
  tax_total numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (tax_total >= 0),
  total numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  accepted_at timestamptz,
  converted_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_quotations_updated_at
  BEFORE UPDATE ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.quotation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id uuid NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  description text NOT NULL,
  sku text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  discount_amount numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_rate numeric(6,4) NOT NULL DEFAULT 0.0000 CHECK (tax_rate >= 0),
  tax_amount numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  line_total numeric(14,2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 8. Subscriptions & Subscription Items
-- ------------------------------------------------------------------------------
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  source_quotation_id uuid UNIQUE REFERENCES public.quotations(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('active', 'paused', 'past_due', 'cancelled', 'expired')) DEFAULT 'active',
  billing_interval text NOT NULL CHECK (billing_interval IN ('month', 'year', 'week', 'quarter')),
  interval_count integer NOT NULL DEFAULT 1 CHECK (interval_count > 0),
  currency text NOT NULL DEFAULT 'USD',
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  auto_renew boolean NOT NULL DEFAULT true,
  subtotal numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
  discount_total numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (discount_total >= 0),
  tax_total numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (tax_total >= 0),
  total numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (total >= 0),
  cancelled_at timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  cancellation_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.subscription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  description text NOT NULL,
  sku text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  discount_amount numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_rate numeric(6,4) NOT NULL DEFAULT 0.0000 CHECK (tax_rate >= 0),
  tax_amount numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  line_total numeric(14,2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_subscription_items_updated_at
  BEFORE UPDATE ON public.subscription_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 9. Invoices & Invoice Items
-- ------------------------------------------------------------------------------
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE RESTRICT,
  billing_period_start timestamptz NOT NULL,
  billing_period_end timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'issued', 'paid', 'overdue', 'cancelled', 'void')) DEFAULT 'issued',
  due_date timestamptz NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  subtotal numeric(14,2) NOT NULL CHECK (subtotal >= 0),
  discount_total numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (discount_total >= 0),
  tax_total numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (tax_total >= 0),
  total numeric(14,2) NOT NULL CHECK (total >= 0),
  amount_paid numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (amount_paid >= 0),
  amount_due numeric(14,2) NOT NULL CHECK (amount_due >= 0),
  issued_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Architectural invariant: exactly one invoice per subscription period
  CONSTRAINT uq_subscription_billing_period UNIQUE (subscription_id, billing_period_start, billing_period_end)
);

CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TABLE public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  subscription_item_id uuid REFERENCES public.subscription_items(id) ON DELETE SET NULL,
  description text NOT NULL,
  sku text,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(14,2) NOT NULL CHECK (unit_price >= 0),
  discount_amount numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
  tax_rate numeric(6,4) NOT NULL DEFAULT 0.0000 CHECK (tax_rate >= 0),
  tax_amount numeric(14,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
  line_total numeric(14,2) NOT NULL CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 10. Payments
-- ------------------------------------------------------------------------------
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number text UNIQUE NOT NULL,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'USD',
  payment_method text NOT NULL CHECK (payment_method IN ('credit_card', 'bank_transfer', 'cash', 'manual', 'other')),
  provider text,
  provider_transaction_id text,
  status text NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'completed',
  recorded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  verified_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 11. Cancellation Requests
-- ------------------------------------------------------------------------------
CREATE TABLE public.cancellation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  decision_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  decision_notes text,
  effective_date timestamptz,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_cancellation_requests_updated_at
  BEFORE UPDATE ON public.cancellation_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 12. Observability: Events & Activity Logs (Append-Only)
-- ------------------------------------------------------------------------------
CREATE TABLE public.subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 13. Notifications
-- ------------------------------------------------------------------------------
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('in_app', 'email')) DEFAULT 'in_app',
  status text NOT NULL CHECK (status IN ('unread', 'read', 'sent', 'failed')) DEFAULT 'unread',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 14. Performance Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_assignments_customer ON public.customer_staff_assignments(customer_id);
CREATE INDEX idx_assignments_staff ON public.customer_staff_assignments(staff_id);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_product_variants_product ON public.product_variants(product_id);
CREATE INDEX idx_plans_product ON public.plans(product_id);
CREATE INDEX idx_plans_variant ON public.plans(variant_id);
CREATE INDEX idx_plans_active ON public.plans(is_active);
CREATE INDEX idx_quotations_customer ON public.quotations(customer_id);
CREATE INDEX idx_quotations_status ON public.quotations(status);
CREATE INDEX idx_quotation_items_quotation ON public.quotation_items(quotation_id);
CREATE INDEX idx_subscriptions_customer ON public.subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON public.subscriptions(current_period_end);
CREATE INDEX idx_subscription_items_sub ON public.subscription_items(subscription_id);
CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);
CREATE INDEX idx_invoices_subscription ON public.invoices(subscription_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_invoice_items_invoice ON public.invoice_items(invoice_id);
CREATE INDEX idx_payments_invoice ON public.payments(invoice_id);
CREATE INDEX idx_payments_customer ON public.payments(customer_id);
CREATE INDEX idx_subscription_events_sub ON public.subscription_events(subscription_id);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id, status);

-- ------------------------------------------------------------------------------
-- 15. Row Level Security (RLS) Configuration — Default Deny & Explicit Policies
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

ALTER TABLE public.customer_staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_staff_assignments FORCE ROW LEVEL SECURITY;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products FORCE ROW LEVEL SECURITY;

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants FORCE ROW LEVEL SECURITY;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans FORCE ROW LEVEL SECURITY;

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts FORCE ROW LEVEL SECURITY;

ALTER TABLE public.tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules FORCE ROW LEVEL SECURITY;

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations FORCE ROW LEVEL SECURITY;

ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items FORCE ROW LEVEL SECURITY;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;

ALTER TABLE public.subscription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_items FORCE ROW LEVEL SECURITY;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices FORCE ROW LEVEL SECURITY;

ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items FORCE ROW LEVEL SECURITY;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;

ALTER TABLE public.cancellation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancellation_requests FORCE ROW LEVEL SECURITY;

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_events FORCE ROW LEVEL SECURITY;

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications FORCE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS Policies
-- ------------------------------------------------------------------------------

-- Profiles:
-- 1. Users can read their own profile; staff/admins can read customer profiles
CREATE POLICY "Users can view own profile or permitted profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id 
    OR public.is_admin()
    OR (public.is_staff() AND public.is_assigned_to_customer(id))
  );

-- 2. Users can update own profile (cannot alter role or active status via client)
CREATE POLICY "Users can update own contact profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    role = (SELECT role FROM public.profiles WHERE id = auth.uid()) AND
    is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins have full access to profiles"
  ON public.profiles FOR ALL
  USING (public.is_admin());

-- Products, Variants, Plans:
-- Read-only for authenticated users if active; full access for admin
CREATE POLICY "Authenticated users can view active products"
  ON public.products FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.is_admin());

CREATE POLICY "Authenticated users can view active variants"
  ON public.product_variants FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage variants"
  ON public.product_variants FOR ALL
  USING (public.is_admin());

CREATE POLICY "Authenticated users can view active plans"
  ON public.plans FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage plans"
  ON public.plans FOR ALL
  USING (public.is_admin());

-- Discounts & Taxes:
CREATE POLICY "Authenticated can view active discounts and taxes"
  ON public.discounts FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage discounts"
  ON public.discounts FOR ALL
  USING (public.is_admin());

CREATE POLICY "Authenticated can view active tax rules"
  ON public.tax_rules FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins can manage tax rules"
  ON public.tax_rules FOR ALL
  USING (public.is_admin());

-- Quotations & Items:
CREATE POLICY "Users view permitted quotations"
  ON public.quotations FOR SELECT
  USING (
    customer_id = auth.uid()
    OR public.is_admin()
    OR (public.is_staff() AND public.is_assigned_to_customer(customer_id))
  );

CREATE POLICY "Staff and admin can create/manage quotations"
  ON public.quotations FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (public.is_staff() AND public.is_assigned_to_customer(customer_id))
  );

CREATE POLICY "Staff and admin can update quotations"
  ON public.quotations FOR UPDATE
  USING (
    public.is_admin()
    OR (public.is_staff() AND public.is_assigned_to_customer(customer_id))
  );

CREATE POLICY "View quotation items"
  ON public.quotation_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_id AND (
        q.customer_id = auth.uid() OR
        public.is_admin() OR
        (public.is_staff() AND public.is_assigned_to_customer(q.customer_id))
      )
    )
  );

CREATE POLICY "Manage quotation items"
  ON public.quotation_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.quotations q
      WHERE q.id = quotation_id AND (
        public.is_admin() OR
        (public.is_staff() AND public.is_assigned_to_customer(q.customer_id))
      )
    )
  );

-- Subscriptions & Items:
CREATE POLICY "Users view permitted subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    customer_id = auth.uid()
    OR public.is_admin()
    OR (public.is_staff() AND public.is_assigned_to_customer(customer_id))
  );

CREATE POLICY "Staff and admin manage subscriptions"
  ON public.subscriptions FOR ALL
  USING (
    public.is_admin()
    OR (public.is_staff() AND public.is_assigned_to_customer(customer_id))
  );

CREATE POLICY "Users view permitted subscription items"
  ON public.subscription_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = subscription_id AND (
        s.customer_id = auth.uid() OR
        public.is_admin() OR
        (public.is_staff() AND public.is_assigned_to_customer(s.customer_id))
      )
    )
  );

-- Invoices & Items:
CREATE POLICY "Users view permitted invoices"
  ON public.invoices FOR SELECT
  USING (
    customer_id = auth.uid()
    OR public.is_admin()
    OR (public.is_staff() AND public.is_assigned_to_customer(customer_id))
  );

CREATE POLICY "Staff and admin manage invoices"
  ON public.invoices FOR ALL
  USING (
    public.is_admin()
    OR (public.is_staff() AND public.is_assigned_to_customer(customer_id))
  );

CREATE POLICY "Users view permitted invoice items"
  ON public.invoice_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id AND (
        i.customer_id = auth.uid() OR
        public.is_admin() OR
        (public.is_staff() AND public.is_assigned_to_customer(i.customer_id))
      )
    )
  );

-- Payments:
CREATE POLICY "Users view permitted payments"
  ON public.payments FOR SELECT
  USING (
    customer_id = auth.uid()
    OR public.is_admin()
    OR (public.is_staff() AND public.is_assigned_to_customer(customer_id))
  );

CREATE POLICY "Staff and admin record payments"
  ON public.payments FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR (public.is_staff() AND public.is_assigned_to_customer(customer_id))
  );

-- Cancellation Requests:
CREATE POLICY "Customers view own cancellation requests"
  ON public.cancellation_requests FOR SELECT
  USING (
    customer_id = auth.uid()
    OR public.is_admin()
    OR (public.is_staff() AND public.is_assigned_to_customer(customer_id))
  );

CREATE POLICY "Customers create cancellation request for own subscription"
  ON public.cancellation_requests FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Staff/admin decide cancellation requests"
  ON public.cancellation_requests FOR UPDATE
  USING (
    public.is_admin()
    OR (public.is_staff() AND public.is_assigned_to_customer(customer_id))
  );

-- Subscription Events & Activity Logs (Append-only, scoped reads):
CREATE POLICY "View subscription events"
  ON public.subscription_events FOR SELECT
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.id = subscription_id AND (
        s.customer_id = auth.uid()
        OR (public.is_staff() AND public.is_assigned_to_customer(s.customer_id))
      )
    )
  );

CREATE POLICY "Admin view activity logs"
  ON public.activity_logs FOR SELECT
  USING (public.is_admin());

-- Notifications:
CREATE POLICY "Users access own notifications"
  ON public.notifications FOR ALL
  USING (recipient_id = auth.uid());
