# Progress

## Current status

**Current phase:** Phase 1 (Next.js Initialization) & Phase 2 (Supabase Setup & Database Design)

**Current task:** TASK-005 to TASK-016 (Completed initialization & schema baseline; package installation initiated)

**Implementation status:** 
- Architecture and roadmap approved by product owner (Phase 0 complete).
- Next.js App Router application structure, strict TypeScript baseline, Tailwind CSS, shadcn/ui components, and Zod environment validation initialized (Phase 1 complete).
- Complete Supabase PostgreSQL schema with Row-Level Security (RLS), integrity constraints, audit logging, performance indexes, and seed fixtures created (Phase 2 schema complete).
- Generated TypeScript database types, Supabase browser/server/admin clients, Edge Middleware session refresher, authentication validation schemas, server actions, and role dashboard shells (Admin, Staff, Customer) implemented (Phase 3 baseline complete).

## Decision log / blockers

- Base currency set to `USD`, amounts stored as `numeric(14,2)`, timestamps stored in UTC `timestamptz`.
- Single-organization baseline established with RLS data isolation.
- Duplicate billing period constraint `UNIQUE (subscription_id, billing_period_start, billing_period_end)` enforced at database level.
- `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` isolated in server-only modules; client components restricted to anon key with RLS.
- Approval granted for package installation over network.

## Task tracker

| Task range | Status | Evidence |
| --- | --- | --- |
| TASK-001–004 (Phase 0) | Complete | Signed off by product owner instruction |
| TASK-005 (App Init) | Complete | `package.json`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx` |
| TASK-006 (Quality Tooling) | Complete | `.eslintrc.json`, `vitest.config.ts`, test suites |
| TASK-007 (Tailwind & shadcn) | Complete | `tailwind.config.ts`, `postcss.config.mjs`, `globals.css`, UI primitives |
| TASK-008 (Environment Baseline) | Complete | `.gitignore`, `.env.example`, `src/lib/env.ts` |
| TASK-009–015 (Database & RLS) | Complete | `supabase/config.toml`, `supabase/migrations/20261031000001_initial_schema.sql`, `supabase/seed.sql`, `src/types/database.types.ts` |
| TASK-016–018 (Auth & Role Shells) | Complete | `src/lib/supabase/`, `middleware.ts`, `(auth)/`, `(dashboard)/` |

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
