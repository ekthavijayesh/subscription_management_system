# Subscription Management System — Claude Code Guide

## 1. Purpose and current project state

This repository will contain a multi-tenant-ready (but initially single-organization) SaaS-style Subscription Management System. It centralizes customers, staff, catalogues, plans, quotations, subscriptions, invoicing, payments, discounts, tax, reporting, notifications, and auditable activity.

**Current state (2026-10-31):** greenfield repository; only `README.md` exists. No application, Supabase project, schema, authentication, or UI has been implemented. Do not assume a file, package, route, database object, or integration exists merely because this document describes it.

Read this file and the documents in `docs/` before every task. The authoritative incremental plan is `docs/DEVELOPMENT_ROADMAP.md`; progress belongs in `docs/PROGRESS.md`.

## 2. Product scope

### Roles and dashboards

| Role | Primary capabilities | Boundary |
| --- | --- | --- |
| `admin` | Staff/customer management; catalogues, plans, subscriptions, quotations, invoices, payments, taxes, discounts, permissions, reports, activities | Full organization management; cannot bypass database audit controls |
| `staff` | Register/manage permitted customers; assigned customer list; quotations; permitted subscription operations; invoices; payments; assigned reports/activities | Only records assigned or explicitly permitted by policy |
| `customer` | Own profile, products/plans, own subscriptions/renewals, quotations, invoices/PDFs, payments, cancellation requests, settings | Own records only |

### Modules

1. Authentication and user management
2. RBAC and route/data authorization
3. Customer management
4. Staff management
5. Products
6. Product variants
7. Subscription plans
8. Quotations
9. Subscriptions
10. Invoices
11. Payments
12. Discounts
13. Tax rules
14. Automated billing and renewal
15. Notifications and activity logs
16. Admin dashboard and analytics
17. Staff dashboard and analytics
18. Customer dashboard and analytics
19. Reports and PDF generation

### Out of scope until explicitly approved

Multi-organization tenancy, payment gateway selection/webhooks, multi-currency settlement, proration, usage metering, credit notes/refunds, public self-service signup, e-invoicing compliance, and localization are not approved product decisions. Build extension points, but do not invent production behavior for them.

## 3. Decisions awaiting product-owner approval

Document assumptions in task output and validate these before their dependent task:

1. Operating currency, locale, time zone, invoice numbering format, legal entity, tax jurisdiction and tax-inclusion rules.
2. Payment providers, payment methods, verification/webhook requirements, partial/overpayments, refunds and chargebacks.
3. Which staff permissions exist beyond role, staff-to-customer assignment model, and approval authority for quotations/cancellations.
4. Renewal policy: auto-renew default, grace period, dunning, retry schedule, cancellation effective date, and proration.
5. PDF template/legal fields, storage retention, notification channels/templates, and report definitions.
6. Whether organization/tenant isolation is required now. The schema reserves `organization_id` only after a deliberate tenancy decision; do not add partial tenancy.

Working assumptions for planning only: one organization, one base currency, no online gateway until approved, invoices are immutable once issued, amounts are stored as `numeric(14,2)`, and all instants use `timestamptz` in UTC.

## 4. Technology and architecture rules

- **Frontend:** Next.js App Router, TypeScript strict mode, Tailwind CSS, shadcn/ui, Lucide icons, Recharts.
- **Backend:** Next.js Server Components, Server Actions for authenticated UI mutations, and Route Handlers for integrations/downloads/cron endpoints. No Express, Flask, separate API server, or client-side privileged database access.
- **Data/auth:** Supabase PostgreSQL, Supabase Auth, RLS, migrations and generated TypeScript database types.
- **Forms:** React Hook Form + Zod. Schemas are shared when their client-safe rules match server validation; all server mutations validate again.
- **Delivery:** Git/GitHub, Vercel. Scheduled billing must use a secure scheduler/cron mechanism approved during TASK-052.

### Server/client boundary

1. Server Components load initial protected data through server Supabase client and domain queries.
2. Client Components are interactive leaves only: forms, table controls, charts, dialogs, and optimistic UI. They never receive service-role credentials.
3. Business rules live in `src/lib/services/` and transactions/RPC functions where atomic database guarantees are needed. Route handlers and Server Actions are thin authorization/validation/adaptation layers.
4. RLS is mandatory. UI visibility is usability, not authorization. Recheck actor, role, ownership/assignment and record state on the server/database for every mutation.
5. Use service-role client only in server-only modules for trusted administration, webhook verification, or scheduled jobs. Never import it into code reachable by the browser.

### Recommended structure

```text
src/
  app/
    (auth)/{login,signup,forgot-password,callback}/
    (dashboard)/admin/, staff/, customer/
    api/{webhooks,pdf,cron}/route.ts
    actions/                 # Server Actions, grouped by domain
    layout.tsx, page.tsx, globals.css
  components/
    ui/                      # shadcn primitives only
    shared/                  # page shell, states, data table, form field
    features/{customers,products,plans,quotations,subscriptions,invoices,payments}/
  lib/
    supabase/{client,server,admin,middleware}.ts
    auth/{authorization,permissions}.ts
    services/                # domain use cases; no React
    repositories/            # focussed query access where useful
    validations/             # Zod schemas
    utils/, constants/, types/
  middleware.ts
supabase/
  migrations/                # ordered SQL, never edit applied migrations
  seed.sql                   # development-only and idempotent
  functions/                 # only if approved later
docs/
tests/{unit,integration,e2e}/
```

Use route groups only for organization. URLs should be stable, resource-oriented, and role-scoped. Keep feature components beside their domain, avoid a global `components` dumping ground, and prefer named exports.

## 5. Code, UX, and quality standards

- TypeScript: `strict: true`; no `any`, untyped database rows, suppressed errors, or unsafe casts without a documented boundary. Prefer domain types derived from generated Supabase types.
- Naming: PascalCase components/types, camelCase functions/variables, kebab-case routes/files except React component files, singular domain service names. Keep code comments for non-obvious rationale only.
- Validate strings, UUIDs, dates, enum values, arrays, and decimal inputs with Zod. Convert money strings safely; never calculate money with JavaScript floating point.
- Centralize errors: expected failures return typed, user-safe messages; unexpected errors are logged with request/context IDs but never leak secrets or SQL details. Use error boundaries and `not-found` routes.
- Each async screen needs a loading state/skeleton. Collections need empty, loading, error, retry, pagination, search/filter, accessible table behavior, and mobile presentation.
- Buttons must have a working implemented action, deliberate disabled state with explanation, or must not be rendered. No permanent mock data, fake success states, placeholder endpoints, or dead controls.
- Use optimistic updates only where rollback/error recovery is safe. Confirm destructive actions. Ensure keyboard access, semantic labels, focus management in dialogs, responsive layouts, and WCAG-minded contrast.
- Use UTC in persistence; format for the user at the presentation edge. Store financial snapshots with issued documents; do not recalculate historical documents from edited catalogue data.

## 6. Environment and Supabase configuration

Required environment variables are documented in `docs/SETUP.md`. At minimum:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # server only; never prefix NEXT_PUBLIC_
NEXT_PUBLIC_APP_URL=
CRON_SECRET=                     # server-only, once scheduler is approved
```

Commit `.env.example` with blank values only; commit neither `.env.local` nor credentials. Validate server configuration at startup/use. Create browser, server, and admin Supabase clients separately; enforce `server-only` in the admin client module. Generate database types after every migration and do not hand-maintain duplicate table interfaces.

## 7. Database contract

Detailed design and relationships are in `docs/DATABASE_DESIGN.md` and `docs/ER_DIAGRAM.md`. All IDs are UUIDs (`gen_random_uuid()`), database timestamps are `timestamptz`, money is `numeric(14,2) CHECK (amount >= 0)`, status fields are controlled enums/checks, and tables have `created_at`, `updated_at` (where mutable), and relevant actor timestamps.

### Core tables

| Table | Ownership and essential purpose |
| --- | --- |
| `profiles` | one-to-one with `auth.users`; role, contact, activation profile |
| `products` / `product_variants` | sellable catalogue and variant attributes/status |
| `plans` | cadence, pricing, product/variant linkage, active status |
| `customer_staff_assignments` | staff access scope; required supporting table |
| `quotations` / `quotation_items` | versioned/snapshotted commercial offers |
| `subscriptions` / `subscription_items` | customer agreement, lifecycle, billing schedule, captured price/tax/discount data |
| `invoices` / `invoice_items` | immutable issued billing documents and line snapshots |
| `payments` | payment attempts/receipts allocated to invoices |
| `discounts` / `tax_rules` | effective-dated configuration and snapshots when applied |
| `subscription_events` | append-only lifecycle/billing events |
| `activity_logs` | append-only actor audit trail |
| `notifications` / `cancellation_requests` | required supporting tables for reliable notification/cancellation workflows |

### Integrity requirements

- A `profiles.id` FK references `auth.users.id`; profile creation happens through a controlled `SECURITY DEFINER` trigger/function or authorized server workflow, never client-selected roles.
- Use item tables for all document lines. Snapshots include description, SKU/product/variant IDs as applicable, quantity, unit price, discount/tax rates/amounts and line total.
- Invoice has `subscription_id`, `billing_period_start`, `billing_period_end`, status, number and totals. Add a **unique constraint/index on `(subscription_id, billing_period_start, billing_period_end)`** (for issued/draft invoice policy as decided) to prevent duplicate period invoices. Create invoices transactionally and make the operation idempotent.
- Invoice number is unique. Issued invoice and its items are not edited/deleted; corrections require an approved future credit-note design.
- Plans/products/variants used in historical items may be archived, never hard-deleted. Historical names/prices remain snapshots.
- All state transitions pass through domain service/RPC validation and append subscription events/activity logs.
- Add indexes for every FK, status/date dashboards, customer ownership, staff assignment and invoice due-date queries. Use a `set_updated_at` trigger on mutable rows.

### RLS baseline

Enable and force RLS on every exposed application table. Default deny. `authenticated` users can read/update their own profile only through allowed columns. Customers can select only their owned records and create only permitted cancellation requests. Staff can access customers only through active assignment plus explicit permission. Admin accesses organization-wide records. Insert/update/delete policies must be separate and narrow; do not use broad `USING (true)` policies. `activity_logs`, issued invoices, events, and financial snapshots are append-only/read-scoped. Test policies as anonymous, customer, staff (assigned/unassigned), and admin users.

## 8. Authoritative business workflows

### Customer registration

`Registration/invite → Supabase Auth user → controlled profile creation → default customer role (or admin invitation assignment) → email/session confirmation → role-aware dashboard redirect`.

Never accept a role from browser sign-up input. Admin-created staff get a secure invite; profile role assignment occurs in a trusted transaction and is logged.

### Quotation to subscription

`Authorized staff/admin selects customer → active product → valid active variant → active plan → server calculates current price → eligible discount → applicable effective tax → quotation/items snapshots and totals → approval/acceptance → one atomic subscription creation with subscription-item snapshots → event/activity/notification`.

Quote acceptance must reject expired, superseded, cancelled, or already converted quotations. Preserve conversion reference and avoid duplicate subscriptions from retries with idempotency/unique constraints.

### Subscription billing

`Renewal due → secure scheduled job identifies eligible active subscriptions → transactional billing validation/lock → idempotent invoice creation for the period → notification/payment collection → verified payment record/allocation → invoice status update → subscription period advance only when policy permits → events/activity`.

Do not run billing from a browser request. Use a signed scheduler endpoint and a transaction/RPC to guard concurrency. Failed/late payment follows the yet-to-be-approved dunning policy.

### Invoice management

`Invoice generation → role/RLS-scoped list with filters/pagination → immutable detail and item snapshots → server-authorized PDF rendering → private storage or streamed response → audit download activity`.

### Cancellation

`Customer request → authorization and duplicate-state validation → pending request → authorized admin/staff decision → cancellation policy processing → subscription status/effective date → append event/activity → notification`.

Do not directly cancel a subscription merely because a customer clicks a UI control.

## 9. Security requirements

Follow `docs/SECURITY.md`. In particular: trust RLS and server authorization, not UI; keep secrets server-only; validate all inputs; verify webhook signatures before parsing trusted data; check cron secret with constant-time-safe mechanisms where possible; protect actions from CSRF/session misuse according to platform guidance; rate-limit abuse-sensitive endpoints; never log tokens, card/bank data, passwords or service-role keys; use least privilege and private document storage with short-lived signed URLs; and review dependencies/migrations before deployment.

## 10. Execution protocol for Claude Code

1. Read `CLAUDE.md`, relevant `docs/`, current `docs/PROGRESS.md`, and inspect the repository before changing anything.
2. Choose exactly one unblocked task from the roadmap. Respect dependencies; do not skip phases.
3. Restate the task objective, assumptions, affected files/schema, and test plan before implementation. Ask the product owner before material architectural or policy changes.
4. Reuse existing patterns. Do not overwrite working code or make unrelated refactors. Use actual Supabase operations, migrations and RLS—never permanent mock implementations.
5. Implement complete vertical behavior: authorization, validation, UX states, audit/activity impacts, docs, and tests appropriate to the task.
6. Run the specified tests/lint/type checks and inspect failures. Fix errors before marking complete. Do not claim unrun tests passed.
7. Update `docs/PROGRESS.md`, relevant architecture docs, and task status/checklist only after acceptance criteria are met.
8. Commit only when asked; use small task-scoped commits and never commit secrets.

After every task, report: implemented behavior; files created/changed; database changes; tests performed and results; remaining issues/assumptions; checklist status; and the next recommended unblocked task.

## 11. Phase-by-phase task index

The full definitions, dependencies, acceptance criteria, tests, and checklists live in `docs/DEVELOPMENT_ROADMAP.md`.

| Phase | Tasks |
| --- | --- |
| 0 — analysis/planning | TASK-001 to TASK-004 |
| 1 — Next.js foundation | TASK-005 to TASK-008 |
| 2 — Supabase/database | TASK-009 to TASK-015 |
| 3 — auth/RBAC | TASK-016 to TASK-020 |
| 4 — shared UI/layouts | TASK-021 to TASK-024 |
| 5 — customers/staff | TASK-025 to TASK-028 |
| 6 — catalogue | TASK-029 to TASK-032 |
| 7 — plans | TASK-033 to TASK-034 |
| 8 — quotations | TASK-035 to TASK-038 |
| 9 — subscriptions | TASK-039 to TASK-042 |
| 10 — invoices/PDF | TASK-043 to TASK-046 |
| 11 — payments | TASK-047 to TASK-049 |
| 12 — discounts/taxes | TASK-050 to TASK-051 |
| 13 — billing/notifications | TASK-052 to TASK-055 |
| 14 — dashboards/reports | TASK-056 to TASK-059 |
| 15 — quality/security/performance | TASK-060 to TASK-063 |
| 16 — production | TASK-064 to TASK-066 |

Do not begin implementation until the product owner approves this architecture and roadmap.
