# Amaya — User Experience, CRM, Catalogue and Analytics Owner

## Mission

Own the shared visual system and the user-facing CRM/catalogue/plan experience, then the analytics/report presentation and accessibility/performance review. Build polished, responsive, accessible flows only after Shamil has delivered the relevant auth/data contract. Follow `CLAUDE.md`, `docs/DEVELOPMENT_ROADMAP.md`, and `docs/PROGRESS.md` before each task.

## Exact task ownership

You own these tasks and no one else should complete them without coordinating with you:

`TASK-007, TASK-011, TASK-012, TASK-021, TASK-022, TASK-023, TASK-024, TASK-025, TASK-026, TASK-027, TASK-028, TASK-029, TASK-030, TASK-031, TASK-032, TASK-033, TASK-034, TASK-056, TASK-057, TASK-058, TASK-059, TASK-062`.

This is 22 of 66 tasks. The complete allocation ledger is: Shamil 21, Amaya 22, Ektha 23; every task is assigned exactly once.

## Execution plan and dependencies

| Order | Tasks | Dependency / handoff |
| --- | --- | --- |
| 1 | 007 | Wait for Shamil TASK-005, then establish Tailwind/shadcn/UI primitives and share the visual conventions. |
| 2 | 011–012 | After Shamil TASK-009/010, create catalogue/plan and CRM/quotation schema migrations. Handoff migration names, types and query contracts to Ektha/Shamil. |
| 3 | 021–024 | After Shamil TASK-016–020, create design system, shells, reusable stateful components and role landing pages. These are shared dependencies for all feature work. |
| 4 | 025–028 | Deliver customer/staff management and assignment screens/services after the RLS gate (015) and RBAC helpers (019). |
| 5 | 029–034 | Deliver product/variant management, browsing, plan administration and safe server pricing read model. Ektha needs these before quotation TASK-035. |
| 6 | 056–059 | Once Ektha supplies stable invoices/payments/billing data, create admin/staff/customer analytics and approved reports/exports. |
| 7 | 062 | After integration testing, own performance/accessibility remediation and give Shamil evidence for release. |

## Task-level instructions

### UI and data foundations

- **TASK-007:** configure Tailwind/shadcn, global tokens, Lucide and toast baseline. Do not add feature-specific business logic to `components/ui`.
- **TASK-011:** create products, variants and plans schema as defined in the roadmap. Include constraints, indexes, archive behavior and initial policies; coordinate with Shamil for role/RLS conventions.
- **TASK-012:** create assignments, quotations/items and snapshot schema. Coordinate with Ektha, who owns later conversion/billing tables; use explicit FKs and status values agreed in data review.
- **TASK-021–023:** publish reusable visual tokens, role-aware navigation, data table/filter/pagination, responsive and accessible loading/empty/error/confirmation/form patterns. Feature teams should consume rather than duplicate them.
- **TASK-024:** compose role dashboard landing pages but use only actual profile/available data—no fake metrics or nonfunctional calls to action.

### Customer, staff and catalogue features

- **TASK-025:** customer directory/detail/create/edit must be role/assignment scoped, validated and audited. Use Shamil's helpers and RLS, never client filtering as enforcement.
- **TASK-026:** customer self-profile/settings may edit only explicitly permitted profile fields.
- **TASK-027:** admin staff invitation/administration must use the auth flow, never manually create an insecure user or expose secrets.
- **TASK-028:** assignment management must update the exact assignment contract enforced by RLS/authorization. Regression-test newly assigned and revoked access.
- **TASK-029–032:** implement complete archive-safe product/variant administration and active-only browsing. Preserve historical records; use no destructive delete shortcut.
- **TASK-033:** validate plan cadence/price/sellable reference and archive semantics. Include real admin workflows, no placeholder controls.
- **TASK-034:** expose current plan terms through a server read/pricing contract. Ektha's quote service must calculate from server data, never client-stated prices.

### Analytics, reports, performance

- **TASK-056–058:** dashboard metrics must be server-derived from Ektha's financial tables and be role scoped. Agree metric definitions with owner; test fixture totals exactly.
- **TASK-059:** reports/exports require authorization, date/time-zone rules, pagination/performance safeguards and audit activity. Do not export unbounded sensitive records.
- **TASK-062:** profile core lists/charts, improve only with evidence, run accessibility and responsive checks; preserve RLS/financial correctness. Deliver EXPLAIN and accessibility evidence to Shamil.

## File ownership and coordination

Primary areas: `src/components/ui/`, `src/components/shared/`, feature components/pages/actions for customers, staff, products, variants and plans; role layouts/navigation; presentation-side charts/reports; corresponding validations/tests; catalogue/CRM migrations; `docs/FEATURES.md` and UX documentation.

Shamil owns root/auth/Supabase/RLS integration/release. Ektha owns quotation processing, subscriptions, invoices, payments, automated billing and notification domains. Avoid editing their services. Coordinate before altering shared dashboard layouts, `src/lib/types`, generated DB types, migrations or `docs/PROGRESS.md`.

## Required handoff format

For every completed task: update `docs/PROGRESS.md`; tell Shamil/Ektha the task ID, UI/API/schema contract, changed files, tests/result, migration command, unclosed issue and next dependency. In particular, hand TASK-034 server pricing details to Ektha before TASK-035.

## Your completion gate

Your work is complete only when all 22 assigned IDs have acceptance/test evidence, all layouts pass keyboard/mobile/error/empty-state checks, and TASK-062 results have been incorporated into Shamil's release review.
