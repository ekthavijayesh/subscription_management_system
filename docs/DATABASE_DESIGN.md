# Database Design

## Conventions

All application records use UUID PKs, `timestamptz`, explicit foreign keys, `created_at`, and `updated_at` when mutable. Monetary columns are `numeric(14,2)` with non-negative checks; quantities are positive numeric/integer checks; rates are constrained to valid ranges. Use lowercase snake_case. Index every FK and frequent ownership/status/date filter. Use generated database types.

## Entities

| Entity | Key fields and rules |
| --- | --- |
| `profiles` | `id` PK/FK `auth.users`, `role` (`admin`,`staff`,`customer`), identity/contact fields, `is_active`; role assigned only by trusted flow |
| `products` | name, description, SKU unique where used, active/archive state |
| `product_variants` | product FK, name/SKU, attributes JSONB only for flexible attributes, active state; unique product/name or SKU policy |
| `plans` | product/optional variant FK, name, interval/unit, price, currency, active; validate cadence and sellable reference |
| `customer_staff_assignments` | customer/staff profile FKs, permissions, active/effective range; unique active assignment policy |
| `quotations` | customer, creator, status, currency, validity, subtotal/discount/tax/total snapshots, accepted/converted timestamps |
| `quotation_items` | quotation FK, product/variant/plan references plus immutable display/price/tax/discount snapshots |
| `subscriptions` | customer, source quotation nullable, status, dates, renewal, cadence/currency/totals snapshots, cancellation metadata |
| `subscription_items` | subscription FK, plan/product/variant refs plus immutable commercial snapshots |
| `invoices` | customer/subscription FKs, unique number, period bounds, due date, status, totals, issued/paid timestamps; unique subscription/period |
| `invoice_items` | invoice FK, source subscription item nullable, immutable pricing/tax/discount/display snapshots |
| `payments` | invoice/customer FK, amount, method, provider/reference unique when present, status, verified timestamp, verifier |
| `discounts` | code unique where applicable, type/value, active/effective period, eligibility constraints |
| `tax_rules` | jurisdiction/category/rate, inclusive flag, priority, effective period, active state |
| `subscription_events` | append-only subscription FK, type, occurred time, actor, metadata |
| `activity_logs` | append-only actor, entity type/id, action, before/after-safe metadata, timestamp/IP context policy |
| `notifications` | recipient, channel/template, payload safe metadata, status/sent timestamp |
| `cancellation_requests` | subscription/customer FKs, reason, status, request/decision/effective timestamps, decision actor |

## Integrity and historical truth

Use FKs with restrictive/archive-friendly deletion behavior. Products, variants and plans linked to commercial history are archived, not deleted. Quotation, subscription, invoice and item snapshots retain the applied description, identifiers, quantity, prices, taxes, discounts and totals. Issued invoices and their items are immutable.

Invoice creation must run atomically. A unique constraint on `invoices(subscription_id, billing_period_start, billing_period_end)` prevents duplicates. Clarify whether drafts occupy the same uniqueness key before coding; safest initial policy is one invoice of any active status per period.

## Migrations and RLS

Each schema change is a new ordered `supabase/migrations` SQL file with indexes, constraints, triggers, comments where useful, RLS enable/force, policies and rollback considerations. Never alter a migration already applied outside local development. Include policy tests. Only narrowly scoped `SECURITY DEFINER` functions may access auth/admin information; set `search_path` securely and grant execute intentionally.
