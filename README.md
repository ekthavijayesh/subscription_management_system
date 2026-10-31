# Subscription Management System

## 1. Project Overview

The **Subscription Management System** is a full-stack, enterprise-grade SaaS web application built with Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, and Supabase PostgreSQL. It centralizes customers, staff, product catalogues, variants, subscription plans, quotations, recurring subscriptions, transaction-safe invoicing, PDF generation, payments, discounts, tax rules, automated background billing, notifications, and auditable activity logs in one unified platform.

The system features three role-scoped dashboards for **Admin**, **Staff**, and **Customer**, each backed by strict PostgreSQL Row-Level Security (RLS) policies and server authorization guards.

---

## 2. Project Task Directories

All **66 roadmap tasks** have been completed, verified with automated tests, and documented across two dedicated folders:

* 📁 **[`completed_tasks/`](./completed_tasks/README.md):** Detailed ledger, deliverables, and acceptance evidence for all **66 completed tasks**.
  * [Master Completed Report](./completed_tasks/README.md)
  * [Shamil's Completed Tasks (21/21 — 100%)](./completed_tasks/SHAMIL_COMPLETED.md)
  * [Amaya's Completed Tasks (22/22 — 100%)](./completed_tasks/AMAYA_COMPLETED.md)
  * [Ektha's Completed Tasks (23/23 — 100%)](./completed_tasks/EKTHA_COMPLETED.md)
* 📁 **[`tasks_to_complete/`](./tasks_to_complete/README.md):** Resolution reports and implementation records for previously pending tasks.
  * [Master Resolution README](./tasks_to_complete/README.md)
  * [Shamil's Completed Quality & Release Tasks (Phase 15 & 16)](./tasks_to_complete/SHAMIL_PENDING.md)
  * [Ektha's Completed Webhook Task (TASK-048)](./tasks_to_complete/EKTHA_PENDING.md)

---

## 3. Executive Task Status Ledger

| Contributor | Focus Domain | Assigned | Completed | Pending | Status |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Amaya** | UX, Primitives, CRM, Catalogue, Plans & Analytics | 22 | **22** | 0 | **100% Complete** |
| **Ektha** | Financial Lifecycle, Invoicing, Payments & Billing | 23 | **23** | 0 | **100% Complete** |
| **Shamil** | Foundation, Security, RLS, Auth & Release | 21 | **21** | 0 | **100% Complete** |
| **Total** | **Project Global Roadmap** | **66** | **66** | **0** | **100% Complete** |

---

## 4. Architecture & Key Invariants

* **Strict Server/Client Boundary:** Interactive leaves are lightweight Client Components; all data fetching and mutations execute via Server Components and Server Actions.
* **Server-Only Security:** `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` are protected by `import "server-only"` and never exposed to the browser.
* **Deterministic Financial Math:**
  * Base currency: `USD`.
  * Database precision: `numeric(14,2)` with non-negative constraints.
  * Server pricing engine uses fixed-point `BigInt` (SCALE=10000) and integer cents math (`Math.round(price * 100)`), eliminating floating-point rounding errors.
* **Period Invariant & Idempotency:** Database constraint `UNIQUE (subscription_id, billing_period_start, billing_period_end)` prevents duplicate invoices during automated or manual runs.
* **Historical Immutability:** Historical quotations and issued invoices store captured line item snapshots. Products and plans use soft-delete archiving (`is_active = false`), preserving past billing records.
* **Canonical UTC Timestamps:** All dates and billing periods are computed in UTC, clamped to month boundaries (Jan 31 -> Feb 28, Feb 29 in leap years).
* **Payment Webhook Verification:** Provider-neutral webhook route (`/api/webhooks/payment`) with cryptographic HMAC SHA-256 signature verification, 5-minute replay mitigation window, and idempotency tracking.

---

## 5. Main Modules

| Module | Scope & Implementation |
| :--- | :--- |
| **Authentication & RBAC** | Supabase Auth, SSR cookie sessions, login, signup, forgot password, role redirects, and permissions API (`src/lib/auth/`). |
| **Customer & Staff Management** | Scoped directory, customer detail, self-service profile settings, staff invite flow, and staff-customer assignments. |
| **Products & Variants** | Product catalogue, SKU uniqueness, JSON attribute variants, and active catalogue browsing grids. |
| **Subscription Plans** | Cadence intervals (day, week, month, year), trial days, pricing rules, and server pricing read model. |
| **Quotations & Conversion** | Deterministic quotation pricing engine, draft edit form, state machine (`draft -> sent -> approved/rejected/expired`), and atomic quote-to-subscription conversion. |
| **Subscriptions & Invoices** | Lifecycle states (`active`, `paused`, `past_due`, `cancelled`), cancellation requests review portal, immutable issued invoices, and server-side PDF generation. |
| **Payments & History** | Transaction-safe payment recording against open invoice balances, overpayment protection, HMAC webhook processing, and role-scoped payment ledgers. |
| **Discounts & Taxes** | Effective-dated discount codes, percentage/fixed amounts, redemption limits, jurisdiction tax rules, and pricing engine integration. |
| **Automated Billing Scheduler** | Protected cron endpoint (`/api/billing/cron`) secured by `CRON_SECRET`, dry-run mode, and repeat-safe querying. |
| **Notifications & Observability** | Abstracted notification queue with metadata sanitization (redacting passwords and card numbers) and append-only `activity_logs`. |
| **Dashboards & Analytics** | Role-tailored metrics: Organization MRR/revenue for Admin; assigned customer metrics for Staff; active subscriptions and renewal timelines for Customer. |
| **Reporting & Export** | Bounded CSV data export (up to 1,000 records) for Revenue, Subscriptions, Customers, and Invoices. |
| **Operations & Security** | Backup protocols, Point-in-Time Recovery (PITR), schema rollback guidelines in `docs/OPERATIONS_RUNBOOK.md`, and HTTP security headers in `next.config.mjs`. |

---

## 6. Configured Environment Variables

The project is configured with the official project Supabase API keys in `.env` and `.env.local`:

```dotenv
# Public Supabase Client configuration
NEXT_PUBLIC_SUPABASE_URL=https://gsviltgahkigiyepvwie.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Server-only Supabase Service Role Key (NEVER expose to client)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Public Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Server-only Cron Secret for automated billing endpoints
CRON_SECRET=your_cron_secret

# Supabase direct configuration & keys
SUPABASE_URL=https://gsviltgahkigiyepvwie.supabase.co
SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
SUPABASE_SECRET_KEY=your_supabase_service_role_key
SUPABASE_JWKS_URL=https://gsviltgahkigiyepvwie.supabase.co/auth/v1/.well-known/jwks.json
```

---

## 7. Quality & Verification Gates

* **ESLint:** `npm run lint` passed with **0 warnings and 0 errors**.
* **TypeScript:** `npm run typecheck` (`tsc --noEmit`) passed with **0 errors**.
* **Automated Test Suite:** `npm test` (`vitest run`) passed **99/99 tests across 16 test files**.
* **CI Quality Gate:** `.github/workflows/ci.yml` automates verification on all pushes and PRs.
* **Go/No-Go Acceptance:** Signed off in `docs/LAUNCH_READINESS.md`.

---

## 8. Project Documentation Index

All technical specifications, diagrams, runbooks, and security policies are maintained in [`docs/`](./docs/):

* [`CLAUDE.md`](./CLAUDE.md) — Master implementation rules, coding standards, and architectural contracts.
* [`shamil.md`](./shamil.md) — Shamil's Foundation, Security, and Release task ledger.
* [`amaya.md`](./amaya.md) — Amaya's UX, CRM, Catalogue, and Analytics task ledger.
* [`ektha.md`](./ektha.md) — Ektha's Commercial Lifecycle, Billing, and Finance task ledger.
* [`docs/DEVELOPMENT_ROADMAP.md`](./docs/DEVELOPMENT_ROADMAP.md) — Authoritative 66-task development roadmap.
* [`docs/PROGRESS.md`](./docs/PROGRESS.md) — Living progress ledger with acceptance evidence.
* [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) — System architecture, boundaries, and ADRs.
* [`docs/DATABASE_DESIGN.md`](./docs/DATABASE_DESIGN.md) — Database tables, constraints, and RLS policies.
* [`docs/ER_DIAGRAM.md`](./docs/ER_DIAGRAM.md) — Entity-relationship diagrams and foreign key links.
* [`docs/WORKFLOWS.md`](./docs/WORKFLOWS.md) — 5 core business workflows.
* [`docs/SECURITY.md`](./docs/SECURITY.md) — Security policies, threat model, and RLS guidelines.
* [`docs/SECURITY_REVIEW_REPORT.md`](./docs/SECURITY_REVIEW_REPORT.md) — Security review audit report & threat model.
* [`docs/OPERATIONS_RUNBOOK.md`](./docs/OPERATIONS_RUNBOOK.md) — Backup, PITR, rollback, and incident runbook.
* [`docs/PRODUCTION_ENVIRONMENT.md`](./docs/PRODUCTION_ENVIRONMENT.md) — Production environment configuration.
* [`docs/LAUNCH_READINESS.md`](./docs/LAUNCH_READINESS.md) — Production launch readiness & Go/No-Go sign-off.
* [`docs/SETUP.md`](./docs/SETUP.md) — Development installation and Supabase setup guide.
* [`docs/ACCESSIBILITY_PERFORMANCE_AUDIT.md`](./docs/ACCESSIBILITY_PERFORMANCE_AUDIT.md) — WCAG AA compliance and performance evidence.

---

## 9. Quick Start & Seed Accounts

### Starting the Development Server

```bash
npm install
npm run dev
```

Navigate to `http://localhost:3000`.

### Pre-Seeded Demo Accounts

The project includes pre-configured demo users across all three RBAC roles:

| Role | Email | Password | Redirect Dashboard |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@demo.com` | `AdminPassword123!` | `/admin` |
| **Staff** | `staff@demo.com` | `StaffPassword123!` | `/staff` |
| **Customer** | `customer@demo.com` | `CustomerPassword123!` | `/customer` |

To re-seed or verify demo users against your Supabase project:
```bash
node scripts/seed-users.mjs
```

> [!NOTE]
> Ensure **Email provider** is enabled under **Authentication -> Providers -> Email** in your Supabase project dashboard so email/password sign-in is allowed.

