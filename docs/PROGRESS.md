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
