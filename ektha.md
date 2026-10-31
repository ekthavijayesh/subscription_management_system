# Ektha — Commercial Lifecycle, Finance, Billing and Notifications Owner

## Mission

Own the financial/commercial vertical slice: subscription and finance schema, quotations, subscriptions, invoices/PDFs, payments, discounts/taxes, automated billing, notifications and audit observability. Work from durable snapshots, database transactions, idempotency and state machines—not client assumptions. Follow `CLAUDE.md`, `docs/DEVELOPMENT_ROADMAP.md`, and `docs/PROGRESS.md` before each task.

## Exact task ownership

You own these tasks and no one else should complete them without coordinating with you:

`TASK-013, TASK-014, TASK-035, TASK-036, TASK-037, TASK-038, TASK-039, TASK-040, TASK-041, TASK-042, TASK-043, TASK-044, TASK-045, TASK-046, TASK-047, TASK-048, TASK-049, TASK-050, TASK-051, TASK-052, TASK-053, TASK-054, TASK-055`.

This is 23 of 66 tasks. The complete allocation ledger is: Shamil 21, Amaya 22, Ektha 23; every task is assigned exactly once.

## Execution plan and dependencies

| Order | Tasks | Dependency / handoff |
| --- | --- | --- |
| 1 | 013–014 | After Shamil 009/010 and Amaya 011/012, create subscription/billing/payment/audit schema. Give Shamil migrations for TASK-015 integration. |
| 2 | 035–038 | After Shamil 019/020 and Amaya 025/028/034, build quotation pricing/lifecycle/conversion. Handoff subscription contracts to UI/report owners. |
| 3 | 039–042 | Build role-scoped subscription views, lifecycle/cancellation/renewal information after quote conversion exists. |
| 4 | 043–046 | Build transaction-safe invoicing, scoped details and approved server-side PDFs. |
| 5 | 047–049 | Build payment recording/history; TASK-048 waits for explicit payment-provider selection. |
| 6 | 050–051 | Finalize discount/tax administration and pricing integration with Amaya UI support only if coordinated. |
| 7 | 052–055 | After owner decisions on scheduler/renewal policy, build secure billing, notifications and audit/activity completion. Provide report data contracts to Amaya (056–059). |

## Task-level instructions

### Financial schema

- **TASK-013:** create subscriptions/items, invoices/items, payments, events, cancellations and notifications. Use UUID/FKs, numeric monetary columns, statuses, indexes, timestamps, snapshots and unique `(subscription_id, billing_period_start, billing_period_end)` protection. Invoice period uniqueness must survive retry/concurrency.
- **TASK-014:** create effective-dated discounts/taxes and append-only audit design. Do not invent a tax jurisdiction/policy: block/ask where required. Include RLS/constraints and tests.

### Quotation and subscription workflows

- **TASK-035:** build a server-only deterministic pricing engine. Validate catalogue/plan active status, customer scope, quantity, discounts/taxes and money; never accept client totals.
- **TASK-036:** implement actual draft create/edit forms/actions using Amaya's shared components but own service logic. Persist snapshots and safe recalculation.
- **TASK-037:** implement quote state machine (send/approve/reject/expire/cancel), permissions, events and notifications. Invalid transition must be impossible server-side.
- **TASK-038:** atomically and idempotently convert an approved valid quote exactly once, preserving source reference and snapshots. Test concurrent submission.
- **TASK-039–042:** make subscription data ownership/assignment-safe, state transitions explicit, customer cancellation a request—not direct status write—and renewal dates canonical in UTC. Wait for policy approval before encoding grace/proration behavior.

### Invoices and payments

- **TASK-043:** generate invoices in a transaction/RPC/locking strategy with snapshot lines and period uniqueness. Repeated request returns existing/conflict, never a duplicate.
- **TASK-044:** scoped invoice list/detail, filters and immutable issued presentation. Amaya may contribute visual components, but you own data/action correctness.
- **TASK-045:** select PDF mechanism only after requirements review; render authorized immutable invoice snapshots server-side. Use private/signed access and record download audit.
- **TASK-046:** enforce issued document immutability, correct numbering/status events/retry behavior and full audit.
- **TASK-047:** record manual payment with validated amount/method/reference and transaction-safe allocation/status updates. Do not assume partial/overpay/refund rules; seek approval.
- **TASK-048:** do not begin provider webhook implementation until owner chooses a provider. Then enforce signature verification, replay/idempotency, narrow server route and audit.
- **TASK-049:** show strictly scoped payment history/receipts.

### Pricing, billing and notifications

- **TASK-050–051:** admin configuration and pricing-engine integration for discounts/taxes. Effective date, eligibility/rates/priority and historical snapshots must be tested.
- **TASK-052:** no browser-triggered billing. Use an approved scheduler, protected cron secret, locking, dry-run/observability and repeat-safe work selection.
- **TASK-053:** execute renewals with approved payment/dunning policy and record every success/failure. Never advance a subscription outside explicit policy.
- **TASK-054:** build a provider-neutral queue/template/delivery model with no sensitive payload logging and retry observability.
- **TASK-055:** ensure all important commercial state changes append events/activity; provide stable query/read contracts to Amaya's reports/dashboard tasks.

## File ownership and coordination

Primary areas: `src/lib/services/` for quotation/subscription/invoice/payment/billing/notification domains; their validations, server actions/routes and tests; feature modules under quotations/subscriptions/invoices/payments; billing/webhook/cron routes; finance/audit migrations; commercial workflow docs.

Shamil owns authentication, RBAC helper contract, RLS integration and deployment. Amaya owns shared UI and catalogue/customer/plan modules. Import their public contracts; do not change their files merely to work around a missing dependency—request/record the change. Coordinate schema additions with Shamil before shared migration integration and give Amaya query contracts before analytics.

## Required handoff format

After each task update `docs/PROGRESS.md` and give both members: task ID; changed files; migration name and application order; financial/state invariants; API/read contract; tests/results including concurrency/RLS negatives; unresolved policy decision; next task. Explicitly notify Amaya after TASK-034 dependencies are consumed, TASK-038 conversion exists, and TASK-055 exposes analytics-ready data.

## Your completion gate

Your work is complete only when all 23 assigned IDs have tests/evidence, issued financial history cannot mutate, duplicate period invoices are demonstrably prevented, all scheduled/webhook paths are signed/idempotent, and Amaya/Shamil have the data and audit contracts required for reporting/release.
