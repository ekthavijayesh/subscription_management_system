-- ==============================================================================
-- Development Seed Data
-- Development fixtures only. Never applied in production.
-- ==============================================================================

-- 1. Sample Products
INSERT INTO public.products (id, name, description, sku, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Cloud Infrastructure Suite', 'Scalable managed cloud instances and container hosting', 'PROD-CLOUD-01', true),
  ('22222222-2222-2222-2222-222222222222', 'API Analytics Pro', 'High throughput API observability, telemetry and monitoring', 'PROD-ANALYTICS-01', true),
  ('33333333-3333-3333-3333-333333333333', 'Enterprise Dedicated Storage', 'Secure compliant object and block storage with snapshot retention', 'PROD-STORAGE-01', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Sample Product Variants
INSERT INTO public.product_variants (id, product_id, name, sku, attributes, is_active)
VALUES
  ('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', 'Standard Tier (4 vCPU / 16GB)', 'VAR-CLOUD-STD', '{"vCPU": 4, "ram": "16GB"}'::jsonb, true),
  ('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', 'High-Performance (16 vCPU / 64GB)', 'VAR-CLOUD-HP', '{"vCPU": 16, "ram": "64GB"}'::jsonb, true),
  ('44444444-4444-4444-4444-444444444443', '22222222-2222-2222-2222-222222222222', 'Up to 10M events/month', 'VAR-ANALYTICS-10M', '{"events_limit": 10000000}'::jsonb, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Sample Plans
INSERT INTO public.plans (id, product_id, variant_id, name, billing_interval, interval_count, price, currency, is_active)
VALUES
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444441', 'Cloud Standard Monthly', 'month', 1, 99.00, 'USD', true),
  ('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444441', 'Cloud Standard Annual', 'year', 1, 990.00, 'USD', true),
  ('55555555-5555-5555-5555-555555555553', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444442', 'Cloud High-Perf Monthly', 'month', 1, 299.00, 'USD', true),
  ('55555555-5555-5555-5555-555555555554', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444443', 'API Analytics 10M Monthly', 'month', 1, 49.00, 'USD', true),
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', NULL, 'Dedicated Storage 1TB Base', 'month', 1, 149.00, 'USD', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Sample Tax Rules
INSERT INTO public.tax_rules (id, name, jurisdiction, rate, is_inclusive, priority, is_active)
VALUES
  ('66666666-6666-6666-6666-666666666661', 'US State Tech Sales Tax', 'US-CA', 0.0825, false, 1, true),
  ('66666666-6666-6666-6666-666666666662', 'EU Standard Digital VAT', 'EU', 0.2000, false, 1, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Sample Discounts
INSERT INTO public.discounts (id, code, type, value, currency, starts_at, ends_at, max_redemptions, times_redeemed, is_active)
VALUES
  ('77777777-7777-7777-7777-777777777771', 'WELCOME15', 'percentage', 15.00, 'USD', now() - interval '10 days', now() + interval '90 days', 500, 0, true),
  ('77777777-7777-7777-7777-777777777772', 'EARLYBIRD50', 'fixed_amount', 50.00, 'USD', now() - interval '10 days', now() + interval '60 days', 100, 0, true)
ON CONFLICT (id) DO NOTHING;
