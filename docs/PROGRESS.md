# Progress

## Current status

**Current phase:** Phases 1–15 (Foundations, Design System, Customer/Staff Management, Catalogue, Plans, Pricing Engine Read Model, Analytics, Reporting & Performance/Accessibility Review Complete)

**Current task:** All 22 tasks owned by Amaya are complete (`TASK-007, TASK-011, TASK-012, TASK-021, TASK-022, TASK-023, TASK-024, TASK-025, TASK-026, TASK-027, TASK-028, TASK-029, TASK-030, TASK-031, TASK-032, TASK-033, TASK-034, TASK-056, TASK-057, TASK-058, TASK-059, TASK-062`).

**Implementation status:** 
- Next.js App Router application structure, strict TypeScript baseline, Tailwind CSS, shadcn/ui components, and Zod environment validation initialized (Phase 1 complete).
- Complete Supabase PostgreSQL schema with Row-Level Security (RLS), integrity constraints, audit logging, performance indexes, and seed fixtures created (Phase 2 schema complete).
- Generated TypeScript database types, Supabase browser/server/admin clients, Edge Middleware session refresher, authentication validation schemas, server actions, and role dashboard shells (Admin, Staff, Customer) implemented (Phase 3 baseline complete).
- Shared design system, UI primitives (Table, Dialog, DropdownMenu, Select, Tabs, Checkbox, Textarea, Skeleton, Badge, StatusBadge), responsive shells with mobile drawer and breadcrumbs, and reusable data states (`DataTable`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `ConfirmationDialog`, `FormField`) completed (Phase 4 complete).
- Customer directory, customer detail, staff administration, self-profile settings, and customer-staff assignment features implemented with role-scoped security and audit logging (Phase 5 complete).
- Product management, variant administration, active catalogue browsing, archive-safe lifecycle management, and mutation audit trails delivered (Phase 6 complete).
- Subscription plan administration, validation, and server-authoritative pricing read model delivered and handed off to Ektha (Phase 7 complete).
- Admin, Staff, and Customer analytics dashboards with server-derived metrics, revenue totals, overdue invoice monitoring, and assignment scoping delivered (Phase 14 complete).
- Report generation and CSV export with authorization, pagination boundaries, date filters, and audit logging delivered (Phase 14 complete).
- Performance, accessibility, and query index audit completed with full evidence documented in `docs/ACCESSIBILITY_PERFORMANCE_AUDIT.md` (Phase 15 complete).
**Current phase:** Phase 4 — Commercial Lifecycle & Finance (Ektha's domain)

**Current task:** TASK-035 — Quotation Pricing Engine (server-only deterministic pricing)

**Implementation status:**
- Architecture and roadmap approved by product owner (Phase 0 complete).
- Next.js App Router application structure, strict TypeScript baseline, Tailwind CSS, shadcn/ui components, and Zod environment validation initialized (Phase 1 complete).
- Complete Supabase PostgreSQL schema with Row-Level Security (RLS), integrity constraints, audit logging, performance indexes, and seed fixtures created (Phase 2 schema complete).
- Generated TypeScript database types, Supabase browser/server/admin clients, Edge Middleware session refresher, authentication validation schemas, server actions, and role dashboard shells (Admin, Staff, Customer) implemented (Phase 3 baseline complete).
- TypeScript strict mode: 0 errors. Unit tests: 7/7 passing.
- **TASK-013 & TASK-014 (Ektha):** Financial/commercial schema fully implemented in initial migration — subscriptions, subscription_items, invoices, invoice_items, payments, subscription_events, cancellation_requests, notifications, discounts, tax_rules, activity_logs — all with RLS, constraints, and indexes.

## Decision log / blockers

- Base currency set to `USD`, amounts stored as `numeric(14,2)`, timestamps stored in UTC `timestamptz`.
- Single-organization baseline established with RLS data isolation.
- Duplicate billing period constraint `UNIQUE (subscription_id, billing_period_start, billing_period_end)` enforced at database level.
- `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` isolated in server-only modules; client components restricted to anon key with RLS.
- Server pricing calculation uses integer cents math (`Math.round(price * 100)`) to eliminate floating-point rounding errors.
- Archiving products, variants, or plans sets `is_active = false` and never performs hard deletes, preserving historical quotation snapshots and invoice lines.
- Report exports are safeguarded with a maximum upper bound (1,000 rows) to prevent heap exhaustion.

## Task tracker

| Task range | Status | Evidence |
| --- | --- | --- |
| TASK-001–004 (Phase 0) | Complete | Signed off by product owner instruction |
| TASK-005 (App Init) | Complete | `package.json`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx` |
| TASK-006 (Quality Tooling) | Complete | `.eslintrc.json`, `vitest.config.ts`, test suites |
| TASK-007 (Tailwind & shadcn) | Complete | `tailwind.config.ts`, `globals.css`, UI primitives (`components/ui/`) |
| TASK-008 (Environment Baseline) | Complete | `.gitignore`, `.env.example`, `src/lib/env.ts` |
| TASK-009–010 (Identity/Profile Schema) | Complete | `supabase/migrations/20261031000001_initial_schema.sql`, `src/types/database.types.ts` |
| TASK-011 (Catalogue & Plan Schema) | Complete | Migration tables: `products`, `product_variants`, `plans`, indexes, constraints, RLS |
| TASK-012 (CRM & Quotation Schema) | Complete | Migration tables: `customer_staff_assignments`, `quotations`, `quotation_items`, RLS |
| TASK-013–015 (Billing Schema & RLS Review) | Complete | Invoices, subscriptions, payments, audit logs, seed data, forced RLS |
| TASK-016–018 (Auth & Role Shells) | Complete | `src/lib/supabase/`, `middleware.ts`, `(auth)/`, `(dashboard)/` |
| TASK-019–020 (Permissions & Hardening) | Complete | `src/lib/auth/permissions.ts`, `src/lib/auth/authorization.ts` |
| TASK-021 (Design System Foundation) | Complete | `src/components/ui/status-badge.tsx`, typography tokens, badge variants |
| TASK-022 (App Shells & Navigation) | Complete | `src/components/shared/dashboard-layout.tsx` (responsive mobile drawer, breadcrumbs) |
| TASK-023 (Reusable Data/Form States) | Complete | `DataTable`, `EmptyState`, `ErrorState`, `LoadingSkeleton`, `ConfirmationDialog`, `FormField` |
| TASK-024 (Dashboard Landing Pages) | Complete | `admin/page.tsx`, `staff/page.tsx`, `customer/page.tsx` with live database counts |
| TASK-025 (Customer Directory & Detail) | Complete | `src/app/(dashboard)/admin/customers/`, `staff/customers/`, `src/app/actions/customers.ts` |
| TASK-026 (Customer Self Profile) | Complete | `src/app/(dashboard)/customer/settings/`, `src/components/features/customers/customer-self-form.tsx` |
| TASK-027 (Staff Administration) | Complete | `src/app/(dashboard)/admin/staff/`, `src/app/actions/staff.ts` |
| TASK-028 (Staff-Customer Assignment) | Complete | `src/app/actions/assignments.ts`, `customer-assignment-dialog.tsx` |
| TASK-029 (Product CRUD & Archiving) | Complete | `src/app/(dashboard)/admin/products/`, `src/app/actions/products.ts` |
| TASK-030 (Variant CRUD) | Complete | `src/app/(dashboard)/admin/products/[id]/`, `src/app/actions/variants.ts` |
| TASK-031 (Catalogue Browsing) | Complete | `src/app/(dashboard)/staff/catalogue/`, `customer/catalogue/`, `catalogue-grid.tsx` |
| TASK-032 (Catalogue Regression & Audit) | Complete | Audit logging in all mutations, tests verifying archival invariants |
| TASK-033 (Plan Administration) | Complete | `src/app/(dashboard)/admin/plans/`, `src/app/actions/plans.ts` |
| TASK-034 (Pricing Engine Read Model) | Complete | `src/lib/services/pricing.ts`, unit tests in `tests/unit/pricing.test.ts` |
| TASK-056 (Admin Analytics) | Complete | `src/lib/services/analytics.ts`, `src/components/features/analytics/admin-analytics-view.tsx` |
| TASK-057 (Staff Analytics) | Complete | `src/components/features/analytics/staff-analytics-view.tsx`, assigned-scope queries |
| TASK-058 (Customer Analytics) | Complete | `src/components/features/analytics/customer-analytics-view.tsx`, renewal timelines |
| TASK-059 (Reports & CSV Export) | Complete | `src/lib/services/reports.ts`, `src/app/actions/reports.ts`, `report-generator.tsx` |
| TASK-062 (Perf & Accessibility Audit) | Complete | `docs/ACCESSIBILITY_PERFORMANCE_AUDIT.md`, index verification, ARIA live compliance |

---

### Amaya Task Details & Acceptance Evidence

#### TASK-007, 021, 022, 023 — UI Primitives, Design System & Shells
- **Status:** Complete
- **Implemented:** Full suite of accessible Radix/shadcn primitives (`Table`, `Dialog`, `DropdownMenu`, `Select`, `Tabs`, `Checkbox`, `Textarea`, `Skeleton`, `Badge`, `StatusBadge`), responsive `DashboardShell` with mobile drawer navigation and dynamic breadcrumbs, `DataTable` with client-side/debounced filtering, sorting, pagination, empty/error/loading/confirmation patterns.
- **Evidence:** `tests/unit/ui-components.test.ts` passed (5/5 tests).

#### TASK-011 & TASK-012 — Catalogue, Plan & CRM Schemas
- **Status:** Complete
- **Implemented:** Migration `20261031000001_initial_schema.sql` establishes `products`, `product_variants`, `plans`, `customer_staff_assignments`, `quotations`, `quotation_items` with UUID keys, constraints (`numeric(14,2)` non-negative checks, interval enum, unique SKUs), updated_at triggers, and RLS policies.

#### TASK-024 — Role Dashboard Landing Pages
- **Status:** Complete
- **Implemented:** Role dashboards for Admin, Staff, and Customer load real profile and count data from PostgreSQL via server components without invented metrics or non-functional placeholder buttons.

#### TASK-025 & TASK-026 — Customer Management & Self-Profile Settings
- **Status:** Complete
- **Implemented:** Scoped customer directories for admin and staff, customer detail view, create customer action (creates Auth user via admin client, updates profile, logs audit), update customer action, and restricted customer self-profile update form (`full_name`, `phone`, `company_name`, `billing_address` only; rejects privilege escalation).
- **Evidence:** `tests/unit/validations.test.ts` passed (customer schemas).

#### TASK-027 & TASK-028 — Staff Administration & Staff-Customer Assignments
- **Status:** Complete
- **Implemented:** Admin staff listing, invite staff action (creates staff account with random secure password and confirmed email, logs audit), activate/deactivate toggle (prevents self-deactivation), staff assignment dialog, and assignment toggle actions enforcing active RLS constraints.
- **Evidence:** `tests/unit/validations.test.ts` passed (staff and assignment schemas).

#### TASK-029 to TASK-032 — Products, Variants & Catalogue Browsing
- **Status:** Complete
- **Implemented:** Admin product table and creation dialog with SKU uniqueness, product detail page, variant creation dialog with JSON attribute validation, archive-safe actions (never hard-deletes; sets `is_active = false`), active catalogue browsing grid for staff and customer, and immutable activity audit logs for all mutations.
- **Evidence:** `tests/unit/validations.test.ts` passed (product/variant schemas).

#### TASK-033 & TASK-034 — Plan Administration & Server Pricing Read Model
- **Status:** Complete
- **Implemented:** Admin plan table and creation dialog (validates cadence, positive intervals, non-negative prices), archive action, and server pricing service (`src/lib/services/pricing.ts`) exposing `getPlanPricingTerms` and `calculateServerLineItem` using cents integer calculation. Rejects client-stated prices.
- **Evidence:** `tests/unit/pricing.test.ts` passed (3/3 tests). Ready for Ektha's TASK-035.

#### TASK-056 to TASK-058 — Role Analytics Dashboards
- **Status:** Complete
- **Implemented:** Server-derived metric aggregation in `src/lib/services/analytics.ts`:
  - **Admin:** Total collected revenue, active subscription counts, overdue invoice tracking, monthly revenue history, subscription breakdown.
  - **Staff:** Strictly scoped to assigned customer accounts (no cross-staff leakage), tracking assigned subscriptions, open quotes, and collected revenue.
  - **Customer:** Own active subscription counts, next renewal date/amount, outstanding invoices, settled payment total.
- **Evidence:** `tests/unit/analytics.test.ts` passed (4/4 tests).

#### TASK-059 — Reports & CSV Data Export
- **Status:** Complete
- **Implemented:** Report export service (`src/lib/services/reports.ts`), server action (`src/app/actions/reports.ts`), and UI component (`report-generator.tsx`) supporting Revenue, Subscriptions, Customers, and Invoices reports with date filters, CSV escaping, bounded safety limits (max 1,000 records), and audit logging.
- **Evidence:** `tests/unit/reports.test.ts` passed (2/2 tests).

#### TASK-062 — Performance & Accessibility Review
- **Status:** Complete
- **Implemented:** Full review of keyboard navigation, focus management (Radix modals), ARIA landmarks, ARIA live regions for empty/error states, high-contrast WCAG-compliant status badges, mobile viewport responsiveness, database index coverage, server-side data fetching, and memory safeguards.
- **Evidence:** Documented in `docs/ACCESSIBILITY_PERFORMANCE_AUDIT.md`.
- Approval granted for package installation over network.
- **TASK-048 (payment webhooks): BLOCKED** — awaiting payment provider selection from product owner.
- **Grace period / proration policy: BLOCKED** — do not encode until policy approved.
- **TASK-035 dependency note:** Shamil TASK-019/020 (permission/RLS hardening) and Amaya TASK-025/028/034 (customer management, assignment, plan UI) are not yet done. Pricing engine is built against the public DB schema contracts (products, plans, discounts, tax_rules tables) which already exist. Once Amaya's UI is available, the engine is already callable.

## Task tracker

| Task range | Owner | Status | Evidence |
| --- | --- | --- | --- |
| TASK-001–004 (Phase 0) | All | Complete | Signed off by product owner instruction |
| TASK-005 (App Init) | All | Complete | `package.json`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx` |
| TASK-006 (Quality Tooling) | All | Complete | `.eslintrc.json`, `vitest.config.ts`, test suites |
| TASK-007 (Tailwind & shadcn) | All | Complete | `tailwind.config.ts`, `postcss.config.mjs`, `globals.css`, UI primitives |
| TASK-008 (Environment Baseline) | All | Complete | `.gitignore`, `.env.example`, `src/lib/env.ts` |
| TASK-009–015 (Database & RLS) | All | Complete | `supabase/config.toml`, `supabase/migrations/20261031000001_initial_schema.sql`, `supabase/seed.sql`, `src/types/database.types.ts` |
| TASK-016–018 (Auth & Role Shells) | All | Complete | `src/lib/supabase/`, `middleware.ts`, `(auth)/`, `(dashboard)/` |
| TASK-013 (Subscription/billing schema) | **Ektha** | Complete | Tables: `subscriptions`, `subscription_items`, `invoices`, `invoice_items`, `payments`, `subscription_events`, `cancellation_requests`, `notifications`. Migration: `20261031000001_initial_schema.sql`. All RLS + indexes applied. Invariant: `UNIQUE (subscription_id, billing_period_start, billing_period_end)`. |
| TASK-014 (Discounts/taxes/audit schema) | **Ektha** | Complete | Tables: `discounts`, `tax_rules`, `activity_logs`. Effective-date columns (`starts_at`, `ends_at`), rate constraints, RLS. Migration: `20261031000001_initial_schema.sql`. Append-only `activity_logs` design. |
| TASK-035 (Quotation pricing engine) | **Ektha** | **Complete** | `src/lib/services/quotation-pricing.service.ts`, `src/lib/validations/quotation.ts`, `tests/unit/services/quotation-pricing.test.ts`. 29 tests passing. Fixed-point BigInt math (SCALE=10000), no floats. PricingError codes, discount/tax validation, grand-total invariant. |
| TASK-036 (Quotation draft create/edit) | **Ektha** | **Complete** | `src/lib/services/quotation.service.ts`, `src/app/actions/quotations.ts`, `src/components/quotations/quotation-form.tsx`, `src/app/(dashboard)/staff/quotations/`. Enforces draft-only edits, re-prices snapshots on save, server-side auth/role guards. |
| TASK-037 (Quotation state machine & transitions) | **Ektha** | **Complete** | `src/lib/services/quotation-state.service.ts`, `tests/unit/services/quotation-state.test.ts`, `transitionQuotationAction`, activity logging and in-app notifications on transition. |
| TASK-038 (Quotation conversion) | **Ektha** | **Complete** | `src/lib/services/quotation-conversion.service.ts`, `convertQuotationAction`. Atomically creates subscription & snapshots line items idempotently. |
| TASK-039 (Role-scoped subscription views) | **Ektha** | **Complete** | `src/lib/services/subscription.service.ts`, role-scoped pages at `src/app/(dashboard)/staff/subscriptions/` and `src/app/(dashboard)/customer/subscriptions/`. |
| TASK-040 (Subscription lifecycle state machine) | **Ektha** | **Complete** | `src/lib/services/subscription-state.service.ts`, `tests/unit/services/subscription-state.test.ts`, `transitionSubscriptionStatus`, `transitionSubscriptionAction`, and UI action controls. |
| TASK-041 (Customer cancellation requests workflow) | **Ektha** | **Complete** | `src/lib/services/cancellation.service.ts`, `src/app/actions/cancellations.ts`, `CustomerCancellationForm`, `/staff/cancellations/` approval portal. |
| TASK-042 (Renewal dates & canonical UTC calculations) | **Ektha** | **Complete** | `src/lib/services/renewal-calculation.service.ts`, `tests/unit/services/renewal-calculation.test.ts`. 7 unit tests passing. Strict UTC math, month-end & leap-year clamping, gapless period calculation. |
| TASK-043 (Transaction-safe invoicing & period uniqueness) | **Ektha** | **Complete** | `src/lib/services/invoicing.service.ts`, `src/app/actions/invoices.ts`. Enforces `UNIQUE (subscription_id, billing_period_start, billing_period_end)`, idempotent retry/conflict handling, snapshot item generation. |
| TASK-044 (Scoped invoice list/detail & immutable presentation) | **Ektha** | **Complete** | Read queries & actions (`listInvoices`, `getInvoiceById`), role-scoped views at `/staff/invoices/` and `/customer/invoices/`. |
| TASK-045 (Server-side invoice PDF generation & download audit) | **Ektha** | **Complete** | `/api/invoices/[id]/pdf` route, private access authorization, printable invoice template, download audit logging to `activity_logs`. |
| TASK-046 (Document immutability & invoice status transitions) | **Ektha** | **Complete** | `src/lib/services/invoice-state.service.ts`, `tests/unit/services/invoice-state.test.ts`. Enforces document immutability on issued invoices, validated status machine (`draft -> issued -> paid/overdue/cancelled/void`), audit logging. |
| TASK-047 (Payment recording & safe balance allocation) | **Ektha** | **Complete** | `src/lib/services/payment.service.ts`, `src/app/actions/payments.ts`, `RecordPaymentModal`. Transaction-safe balance recalculation, overpayment protection, status transitions to `paid`. |
| TASK-048 (Payment provider webhooks) | **Ektha** | **Blocked** | Awaiting explicit payment-provider selection (Stripe, Razorpay, etc.) by product owner per `ektha.md`. |
| TASK-049 (Role-scoped payment history & receipts) | **Ektha** | **Complete** | Read queries & actions (`listPayments`, `getPaymentById`), role-scoped views at `/staff/payments/` and `/customer/payments/`. |
| TASK-050 & TASK-051 (Discounts & tax rules administration) | **Ektha** | **Complete** | `src/lib/services/discounts-taxes.service.ts`, `src/app/actions/discounts-taxes.ts`, `/admin/pricing-rules/`. Integration with server pricing engine verified. |
| TASK-052 (Secure automated billing scheduler & cron route) | **Ektha** | **Complete** | `src/lib/services/billing-scheduler.service.ts`, `/api/billing/cron` endpoint. Protected by `CRON_SECRET`, dry-run mode, repeat-safe work selection, telemetry logging. |
| TASK-053 (Subscription renewal execution & dunning policy) | **Ektha** | **Complete** | `src/lib/services/renewal-execution.service.ts`, `executeRenewalAction`. Handles period advancement, `cancel_at_period_end` termination, invoice balance checks, event tracking. |
| TASK-054 (Provider-neutral notification service & queue) | **Ektha** | **Complete** | `src/lib/services/notification.service.ts`, `tests/unit/services/notification.test.ts`, `src/app/actions/notifications.ts`. Sanitizes sensitive fields, templated delivery, read receipts. |
| TASK-055 (Commercial analytics contracts & audit observability) | **Ektha** | **Complete** | `src/lib/services/analytics-contracts.service.ts`, `src/app/actions/analytics.ts`. MRR/ARR aggregations, revenue collected, merged audit stream contracts for reporting. |

---

### Phase 0 — Requirements, Architecture & Roadmap Sign-off
- Status: Complete
- Implemented: Requirement baseline, ADR, schema design, workflows, and approval gate.
- Checklist: [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-005 to TASK-008 — Next.js Project & Config Baseline
- Status: Complete
- Implemented: Strict TypeScript Next.js App Router project, Tailwind styling, shadcn tokens & primitives, safe Zod environment validation, Vitest test runner.
- Files changed: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `next.config.mjs`, `.gitignore`, `.env.example`, `src/lib/env.ts`, `src/lib/utils.ts`, `src/components/ui/`, `vitest.config.ts`.
- Checklist: [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-009 to TASK-015 — Supabase Schema, Invariants & RLS
- Status: Complete
- Implemented: Full production database schema migration covering 17 tables, strict constraints (`numeric(14,2)` non-negative checks, period uniqueness on invoices, FKs), triggers for `updated_at` and `on_auth_user_created`, granular RLS policies for admin, staff, and customer scopes, development seeds, and strict database TypeScript definitions.
- Files changed: `supabase/config.toml`, `supabase/migrations/20261031000001_initial_schema.sql`, `supabase/seed.sql`, `src/types/database.types.ts`.
- Checklist: [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-016 to TASK-018 — Supabase SSR Clients, Auth & Role Layouts
- Status: Complete
- Implemented: Browser client, server client with cookie storage, server-only admin client with `server-only`, Edge session refresh middleware, login/signup/forgot-password forms, server actions, and protected dashboard shells for Admin, Staff, and Customer.
- Files changed: `src/lib/supabase/`, `src/middleware.ts`, `src/lib/auth/`, `src/app/(auth)/`, `src/app/(dashboard)/`.
- Next task: TASK-019 (Permission and assignment service deep verification) / Phase 4-5 feature implementation.

---

### TASK-013 — Subscription & Billing Schema (Ektha)
- **Status:** Complete
- **Migration:** `supabase/migrations/20261031000001_initial_schema.sql`
- **Tables created:** `subscriptions`, `subscription_items`, `invoices`, `invoice_items`, `payments`, `subscription_events`, `cancellation_requests`, `notifications`
- **Financial invariants:** `numeric(14,2)` for all monetary columns; `timestamptz` UTC for all timestamps; `UNIQUE (subscription_id, billing_period_start, billing_period_end)` prevents duplicate billing periods; non-negative `CHECK` constraints on all monetary columns.
- **RLS:** All tables have FORCE ROW LEVEL SECURITY. Scoped to customer ownership + staff assignment + admin override.
- **Indexes:** All FK columns indexed; `status`, `due_date`, `current_period_end` indexed for query performance.
- **Tests:** Schema constraints validated; TypeScript types generated in `src/types/database.types.ts`.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-014 — Discounts, Taxes & Audit Schema (Ektha)
- **Status:** Complete
- **Migration:** `supabase/migrations/20261031000001_initial_schema.sql`
- **Tables created:** `discounts`, `tax_rules`, `activity_logs`
- **Design notes:** `discounts` has effective-date range (`starts_at`, `ends_at`), redemption counting (`times_redeemed`, `max_redemptions`), `type IN ('percentage','fixed_amount')`, `value > 0`. `tax_rules` has `rate numeric(6,4)`, jurisdiction, priority, effective dates, `is_inclusive` flag. `activity_logs` is append-only (no UPDATE/DELETE policies); insert via admin service only.
- **Unresolved policy:** Multi-jurisdiction tax rule resolution not encoded — awaiting policy approval.
- **RLS:** Discounts/tax_rules readable by all authenticated for active records; admin-only management. Activity logs: admin read-only.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-035 — Quotation Pricing Engine (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/quotation-pricing.service.ts` — server-only pricing engine
  - `src/lib/validations/quotation.ts` — Zod schemas for all quotation I/O
  - `tests/unit/services/quotation-pricing.test.ts` — 29 unit tests
  - `tests/__mocks__/server-only.ts` — test mock for Next.js server-only guard
  - `vitest.config.ts` — added `server-only` alias for test environment
  - `tsconfig.json` — added `"target": "ES2020"` for BigInt support
- **Financial invariants enforced:**
  - All monetary arithmetic uses `BigInt` (SCALE=10000), zero floats
  - `discount_amount` capped at `line_subtotal` for fixed discounts
  - Tax applied on post-discount base, not gross
  - `line_total >= 0` and `grand_total >= 0` checked; violation throws `PricingError`
  - Client totals are never trusted — all recomputed server-side
- **API/read contract (for Amaya and callers):**
  - `priceLineItems(input: PriceLineItemsInput): Promise<QuotationPriceSummary>`
  - Returns `{ currency, items: PricedLineItem[], subtotal, discount_total, tax_total, total }` — all amounts as `"0.00"` strings
  - `PricingError` with stable `.code: PricingErrorCode` for all validation failures
  - Input schema: `CreateQuotationInputSchema` (Zod) — validates UUIDs, future `valid_until`, positive quantities, 3-char currency, discount code normalisation
- **Tests:** 29/29 passing (toCents, fromCents, pricing math, discount/tax scenarios, Zod schema)
- **Unresolved policy:** Multi-jurisdiction tax — only first active `tax_rule` by priority is applied; full jurisdiction engine needs policy approval before implementation.
- **Dependency note:** TASK-035 builds against existing `plans`, `discounts`, `tax_rules` tables. Shamil TASK-019/020 (RLS hardening) and Amaya TASK-025/028/034 (customer/plan UI) are not yet complete — no blocking since the engine is purely server-side and called via server actions.
- **Next task:** TASK-036 (quotation draft create/edit forms and server actions)
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-036 — Quotation Draft Create/Edit Actions & Forms (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/quotation.service.ts` — server-side CRUD and snapshot recalculation for draft quotations
  - `src/app/actions/quotations.ts` — server actions `createQuotationAction`, `updateQuotationAction`, `getQuotationAction`, `listQuotationsAction` with Zod validation and `requireRole(["staff", "admin"])`
  - `src/components/quotations/quotation-form.tsx` — reusable form for creating and updating draft quotations
  - `src/app/(dashboard)/staff/quotations/page.tsx` — quotations list view
  - `src/app/(dashboard)/staff/quotations/new/page.tsx` — quotation creation page
  - `src/app/(dashboard)/staff/quotations/[id]/edit/page.tsx` — draft-only quotation edit page
  - `src/components/ui/textarea.tsx`, `src/components/ui/select.tsx` — form UI primitives
- **Invariants:**
  - Only drafts can be modified; attempts to edit non-draft quotations fail fast.
  - Line items and totals are always re-priced server-side using the `quotation-pricing.service.ts` engine; client-provided totals are never trusted.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-037 — Quotation State Machine, Permissions & Events (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/quotation-state.service.ts` — state transition rules, role-level permissions, and expiration checks
  - `src/lib/services/quotation.service.ts` — `transitionQuotationStatus` implementation appending activity logs and dispatching in-app notifications
  - `src/app/actions/quotations.ts` — `transitionQuotationAction` server action
  - `src/components/quotations/quotation-actions-bar.tsx` — interactive state transition action controls
  - `src/app/(dashboard)/staff/quotations/[id]/page.tsx` — quotation detail view
  - `tests/unit/services/quotation-state.test.ts` — 9 state machine unit tests
- **Invariants:**
  - Strict state transition enforcement: `draft -> sent -> approved/rejected/expired/cancelled`.
  - Roles strictly checked (e.g. customers cannot send drafts; expired quotes cannot be sent or approved).
  - Every transition writes to `activity_logs` and sends an in-app `notifications` row.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-038 — Quotation Conversion to Subscription (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/quotation-conversion.service.ts` — atomic, idempotent quotation-to-subscription conversion logic
  - `src/app/actions/quotations.ts` — `convertQuotationAction` server action
  - `src/components/quotations/quotation-actions-bar.tsx` — integrated convert action button for approved quotations
- **Invariants:**
  - Quotation must have status `approved` and valid until date must be in the future.
  - Idempotent conversion: checks if a subscription with `source_quotation_id` already exists, returning the existing subscription rather than creating duplicates.
  - Snapshot preservation: copies exact `unit_price`, `quantity`, `discount_amount`, `tax_rate`, `tax_amount`, and `line_total` from the quotation to `subscription_items`.
  - Atomicity: if item insertion fails, the created subscription is rolled back.
  - Updates quotation status to `converted` and records `converted_at` timestamp.
  - Appends to `subscription_events` and emits a notification to the customer.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-039 — Role-Scoped Subscription Data & Views (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/subscription.service.ts` — server-side query contracts (`listSubscriptions`, `getSubscriptionById`) with item breakdowns and audit/lifecycle event tracking
  - `src/app/(dashboard)/staff/subscriptions/page.tsx` — staff/admin subscription management view
  - `src/app/(dashboard)/staff/subscriptions/[id]/page.tsx` — staff/admin subscription detail with period dates, line items, and audit history
  - `src/app/(dashboard)/customer/subscriptions/page.tsx` — customer self-service subscription list (scoped via RLS)
  - `src/app/(dashboard)/customer/subscriptions/[id]/page.tsx` — customer self-service subscription detail with ownership verification
- **Invariants:**
  - Customer data isolation strictly maintained by Row Level Security (RLS) policies and layout authorization guards (`requireRole`).
  - Read contracts expose complete financial snapshots (`unit_price`, `discounts`, `tax_amount`, `line_total`, and `total`).
  - UTC canonical timestamps displayed consistently for billing period start and end.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-040 — Subscription Lifecycle & State Machine (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/subscription-state.service.ts` — explicit lifecycle state machine rules (`active <-> paused`, `active <-> past_due`, `cancelled`, `expired`) and role guards
  - `src/lib/services/subscription.service.ts` — `transitionSubscriptionStatus` implementation appending `subscription_events` and notifying the customer
  - `src/app/actions/subscriptions.ts` — `transitionSubscriptionAction` server action guarded with `requireRole(["staff", "admin"])`
  - `src/components/subscriptions/subscription-actions-bar.tsx` — staff UI action controls for pausing, resuming, curing, and cancelling subscriptions
  - `src/app/(dashboard)/staff/subscriptions/[id]/page.tsx` — integrated action controls into staff subscription details
  - `tests/unit/services/subscription-state.test.ts` — 5 unit tests verifying state transitions and permission barriers
- **Invariants:**
  - Customer direct mutation prohibited; customer cancellation must follow the approval workflow (TASK-041).
  - Terminal statuses (`cancelled`, `expired`) cannot transition to active/paused.
  - Every status change records an entry in `subscription_events` with previous/new status and reason, and emits an in-app customer notification.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-041 — Customer Cancellation Requests Workflow (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/cancellation.service.ts` — server-side cancellation workflows (`requestCancellation`, `decideCancellationRequest`, `listCancellationRequests`)
  - `src/app/actions/cancellations.ts` — server actions (`requestCancellationAction`, `decideCancellationAction`, `listCancellationRequestsAction`)
  - `src/components/subscriptions/customer-cancellation-form.tsx` — customer self-service modal/card to submit cancellation reasons
  - `src/components/subscriptions/cancellation-decision-buttons.tsx` — staff approve/reject controls
  - `src/app/(dashboard)/staff/cancellations/page.tsx` — staff management and review queue for cancellation requests
  - `src/app/(dashboard)/customer/subscriptions/[id]/page.tsx` — integrated cancellation request trigger into customer subscription details
- **Invariants:**
  - Customers cannot directly mutate subscription status to `cancelled`. They can only create a cancellation request with a non-empty reason.
  - Subscriptions with existing pending requests block duplicate pending request submissions.
  - Staff decisions are atomic: approving marks the request `approved`, transitions subscription (immediate cancellation or `cancel_at_period_end`), appends to `subscription_events`, and notifies customer via `notifications`.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-042 — Renewal Dates & Canonical UTC Calculations (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/renewal-calculation.service.ts` — canonical UTC billing period calculations (`calculateNextBillingPeriod`, `addUTCMonths`, `getDaysInUTCMonth`, `isSubscriptionDueForRenewal`)
  - `tests/unit/services/renewal-calculation.test.ts` — 7 unit tests covering week/month/quarter/year intervals, month-end clamping (Jan 31 -> Feb 28), leap year calculations (Feb 29), and renewal eligibility
- **Invariants:**
  - Date arithmetic is canonical UTC (`Date.UTC` and ISO 8601 strings).
  - Continuous coverage: `nextPeriodStart` is strictly equal to `previousPeriodEnd` (no billing gaps or overlaps).
  - Safe month-end boundary clamping: adding 1 month to Jan 31 clamps to Feb 28 (or Feb 29 in leap years), never overflowing into March.
  - Policy constraint respected: Grace period and proration behavior are omitted pending explicit policy approval.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-043 — Transaction-Safe Invoicing & Period Uniqueness (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/invoicing.service.ts` — server-side invoice generator (`generateSubscriptionInvoice`) enforcing period uniqueness and line-item snapshot replication
  - `src/app/actions/invoices.ts` — server action `generateInvoiceAction` with `requireRole(["staff", "admin"])`
- **Invariants:**
  - Database constraint: `CONSTRAINT uq_subscription_billing_period UNIQUE (subscription_id, billing_period_start, billing_period_end)` strictly enforced.
  - Idempotency & Concurrency: When an invoice for the requested period already exists (or a race condition triggers the unique constraint), the existing invoice record is returned rather than generating a duplicate.
  - Snapshot integrity: Line items are cloned from `subscription_items` into `invoice_items` so that subsequent subscription plan or price updates never mutate issued invoice history.
  - Atomicity: If invoice line items fail to insert, the created invoice header is rolled back immediately.
  - In-app notification and audit trail written to `activity_logs`.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-044 — Scoped Invoice List, Filters & Immutable Presentation (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/invoicing.service.ts` — server-side query operations (`listInvoices`, `getInvoiceById`) returning line items and financial summaries
  - `src/app/actions/invoices.ts` — server actions (`listInvoicesAction`, `getInvoiceAction`) with `requireAuth()`
  - `src/app/(dashboard)/staff/invoices/page.tsx` — staff billing overview and invoice table
  - `src/app/(dashboard)/staff/invoices/[id]/page.tsx` — staff invoice details view showing period bounds, payment balances, and immutable snapshot items
  - `src/app/(dashboard)/customer/invoices/page.tsx` — customer self-service invoice listing (scoped via RLS)
  - `src/app/(dashboard)/customer/invoices/[id]/page.tsx` — customer invoice detail and payment breakdown view with ownership isolation
- **Invariants:**
  - Strict read isolation: Customer access bounded by PostgreSQL RLS and user ID checks.
  - Immutable presentation: Invoices display stored financial snapshot columns (`unit_price`, `quantity`, `discount_amount`, `tax_amount`, `line_total`, `total`, `amount_due`), ensuring changes to plan catalogues never alter past issued invoices.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-045 — Server-Side Invoice PDF Generation & Download Audit (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/app/api/invoices/[id]/pdf/route.ts` — authorized server-side document rendering endpoint with print-to-PDF styles and audit logging
  - `src/app/(dashboard)/staff/invoices/[id]/page.tsx` — integrated Export/Print PDF action button
  - `src/app/(dashboard)/customer/invoices/[id]/page.tsx` — integrated Export/Print PDF action button
- **Invariants:**
  - Server-side access control: Session authenticated; customers can only access their own invoices (403 Forbidden on mismatch); staff and admin have access across the organization.
  - Complete download audit: Every export or print request appends an event to `activity_logs` (`invoice_pdf_viewed`) with actor ID, invoice number, and timestamp.
  - Immutable presentation: Renders verified stored historical snapshots directly without mutating underlying database state.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-046 — Invoice Document Immutability & Status Transitions (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/invoice-state.service.ts` — state transition rules (`draft -> issued -> paid | overdue | cancelled | void`), document immutability assertion (`assertInvoiceMutable`), and role validation
  - `src/lib/services/invoicing.service.ts` — `transitionInvoiceStatus` implementation appending `activity_logs` and customer notifications
  - `src/app/actions/invoices.ts` — server action `transitionInvoiceAction` with `requireRole(["staff", "admin"])`
  - `tests/unit/services/invoice-state.test.ts` — 5 unit tests validating transitions and document immutability checks
- **Invariants:**
  - Issued document immutability: Any invoice in `issued`, `paid`, `overdue`, or terminal state cannot have its amounts or line items modified.
  - Strict status transitions: Customer roles cannot trigger invoice state modifications; terminal states (`paid`, `cancelled`, `void`) cannot be reopened or mutated.
  - Status updates record timestamps (`paid_at`) and write immutable entries into `activity_logs` and `notifications`.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-047 — Payment Recording & Transaction-Safe Allocation (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/payment.service.ts` — server-side payment recording (`recordPayment`) with fixed-point balance math (`amount_paid`, `amount_due`), overpayment guards, and automatic `paid` transition
  - `src/app/actions/payments.ts` — server action `recordPaymentAction` protected with `requireRole(["staff", "admin"])`
  - `src/components/invoices/record-payment-modal.tsx` — staff UI component for logging manual/offline payments
  - `src/app/(dashboard)/staff/invoices/[id]/page.tsx` — integrated payment recording modal
- **Invariants:**
  - Fixed-point arithmetic: All payments and invoice balance modifications are computed using integer cents (`toCents`/`fromCents`), avoiding floating-point imprecision.
  - Policy enforcement: Overpayment is strictly forbidden per policy constraints (`payment amount <= amount_due`).
  - Safe status update: When `amount_due === "0.00"`, the invoice transitions to `paid` with `paid_at` recorded.
  - Atomicity: If updating the invoice balance fails, the inserted payment record is safely rolled back.
  - Complete audit trail: Appends to `activity_logs` (`payment_recorded`) and notifies the customer in-app.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-049 — Role-Scoped Payment History & Receipts (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/payment.service.ts` — read operations (`listPayments`, `getPaymentById`) filterable by customer, invoice, and status
  - `src/app/actions/payments.ts` — server actions `listPaymentsAction` and `getPaymentAction` protected with `requireAuth()`
  - `src/app/(dashboard)/staff/payments/page.tsx` — staff ledger of all recorded payments with references, customer IDs, and linked invoices
  - `src/app/(dashboard)/customer/payments/page.tsx` — customer receipts view (isolated by customer RLS)
- **Invariants:**
  - Strict read isolation: Customer access bounded by PostgreSQL RLS (`customer_id = auth.uid()`).
  - Immutable presentation: Payment numbers, amounts, settlement methods, and timestamps reflect historical facts recorded at the time of payment.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-050 & TASK-051 — Discounts & Tax Rules Administration (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/validations/discounts-taxes.ts` — strict Zod validation schemas for discounts and tax rules
  - `src/lib/services/discounts-taxes.service.ts` — server-side CRUD and activation methods (`createDiscount`, `listDiscounts`, `toggleDiscountStatus`, `createTaxRule`, `listTaxRules`, `toggleTaxRuleStatus`)
  - `src/app/actions/discounts-taxes.ts` — server actions guarded with `requireRole(["admin"])`
  - `src/app/(dashboard)/admin/pricing-rules/page.tsx` — admin configuration dashboard for active discount codes, redemption counts, jurisdictions, and tax priorities
- **Invariants:**
  - Pricing Engine Integration: The records managed here directly supply `quotation-pricing.service.ts` with effective dates (`starts_at`, `ends_at`), max redemption thresholds, and priority rates.
  - Safe Rates: Tax rules require rates between 0 and 1 (numeric(6,4)); discounts validate non-negative values and percentage vs fixed amount requirements.
  - Strict Admin Authorization: Only users with `admin` role can create or toggle discount codes and tax rules.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-052 — Secure Automated Billing Scheduler & Cron Route (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/billing-scheduler.service.ts` — automated billing work selector (`executeAutomatedBillingRun`) with repeat-safe querying, dry-run mode, and run observability
  - `src/app/api/billing/cron/route.ts` — protected cron execution endpoint requiring `Authorization: Bearer <CRON_SECRET>`
- **Invariants:**
  - No browser-triggered billing: Route rejects any call without matching `CRON_SECRET` bearer token (`401 Unauthorized`).
  - Repeat-safe work selection: Selects only subscriptions with `status = 'active'`, `auto_renew = true`, `cancel_at_period_end = false`, and `current_period_end <= now`.
  - Concurrency/Period Uniqueness: Invoicing calls strictly adhere to `uq_subscription_billing_period`, preventing duplicate invoicing on repeated or concurrent cron triggers.
  - Observability & Dry-Run: Supports `?dryRun=true` to preview workload without mutations; logs comprehensive telemetry and error summaries to `activity_logs`.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-053 — Subscription Renewal Execution & Policy Enforcement (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/renewal-execution.service.ts` — renewal execution logic (`executeSubscriptionRenewal`) enforcing period boundaries, `cancel_at_period_end` automatic termination, and optional settlement verification
  - `src/app/actions/renewals.ts` — server action `executeRenewalAction` protected with `requireRole(["staff", "admin"])`
- **Invariants:**
  - Policy enforcement: Never advance a subscription period unless status is `active` and `auto_renew = true`.
  - Termination on cycle end: Subscriptions marked with `cancel_at_period_end = true` automatically transition to `cancelled` with `cancelled_at` set when processing period expiration.
  - Traceability: Every renewal advancement records `subscription_renewed` in `subscription_events` with previous/new UTC period timestamps and dispatches confirmation notifications.
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-054 — Provider-Neutral Notification Service & Queue (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/notification.service.ts` — provider-neutral notification dispatcher (`queueNotification`, `listUserNotifications`, `markNotificationAsRead`) with automated metadata sanitization (`sanitizePayload`) and canonical templates (`renderNotificationTemplate`)
  - `src/app/actions/notifications.ts` — server actions (`getUserNotificationsAction`, `markNotificationReadAction`) secured with `requireAuth()`
  - `tests/unit/services/notification.test.ts` — 2 unit tests verifying data sanitization and template rendering
- **Invariants:**
  - Sensitive payload protection: Passwords, authorization tokens, credit cards, CVVs, and secret keys are recursively stripped/redacted before persisting to database metadata.
  - Multi-channel flexibility: Model cleanly abstracts delivery between `in_app` and `email` channels.
  - Scoped delivery & read receipts: Users can only read and update the status of notifications matching their own user ID (`recipient_id = auth.uid()`).
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review

### TASK-055 — Commercial Analytics & Audit Observability Contracts (Ektha)
- **Status:** Complete
- **Files changed:**
  - `src/lib/services/analytics-contracts.service.ts` — stable analytical contracts (`getCommercialMetricsSummary`, `getCommercialActivityStream`) providing normalized MRR, ARR, revenue collected, outstanding balances, and merged chronological audit logs
  - `src/app/actions/analytics.ts` — server actions (`getCommercialMetricsAction`, `getCommercialActivityStreamAction`) protected with `requireRole(["admin", "staff"])`
- **Invariants & Read Contracts:**
  - Financial consistency: All MRR/ARR aggregations and currency sums computed using integer cents arithmetic without floating-point errors.
  - Complete Commercial Observability: Merges append-only `subscription_events` and `activity_logs` into a single, unified activity stream.
  - Handoff ready: Directly serves Amaya's downstream reporting and dashboard visualization tasks (TASK-056 to TASK-059).
- **Checklist:** [x] requirements [x] implementation [x] security/RLS [x] tests [x] docs/types [x] review
