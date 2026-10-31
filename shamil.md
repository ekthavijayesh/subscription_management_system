# Shamil — Foundation, Security, Release Owner

## Mission

Own the project foundation, Supabase/Auth/RBAC security boundary, and final quality/release work. Your work unblocks both other contributors. Follow `CLAUDE.md`, `docs/DEVELOPMENT_ROADMAP.md`, and `docs/PROGRESS.md` before each task. Do not begin application implementation until Phase 0 has received owner approval.

## Exact task ownership

You own these tasks and no one else should complete them without coordinating with you:

`TASK-001, TASK-002, TASK-003, TASK-004, TASK-005, TASK-006, TASK-008, TASK-009, TASK-010, TASK-015, TASK-016, TASK-017, TASK-018, TASK-019, TASK-020, TASK-060, TASK-061, TASK-063, TASK-064, TASK-065, TASK-066`.

This is 21 of 66 tasks. The complete allocation ledger is: Shamil 21, Amaya 22, Ektha 23; every task is assigned exactly once.

## Execution plan and handoffs

| Order | Tasks | Deliverable / handoff |
| --- | --- | --- |
| 1 | 001–004 | Get product-owner approval of requirements, architecture, ER/workflows, assumptions and roadmap. Announce the approval/blockers to both members. |
| 2 | 005–006, 008 | Create strict Next.js/tooling/env baseline. **Amaya** may then start TASK-007; **all members** can use the agreed scripts and folder conventions. |
| 3 | 009–010 | Establish Supabase/migration workflow and secure identity/profile schema. Share generated type workflow and profile role contract. |
| 4 | 015 | After Amaya completes 011–012 and Ektha completes 013–014, integrate/inspect migrations, indexes, forced RLS and policy tests. This is the gate for feature application work. |
| 5 | 016–020 | Implement clients, authentication, authorization and full RLS integration. Hand Amaya/Ektha the stable auth helper, route protection and permission/assignment contracts. |
| 6 | 060–061, 063 | Once features are integrated, own cross-system test completion, security review, recovery/operations documentation. TASK-062 belongs to Amaya; incorporate its performance/accessibility evidence. |
| 7 | 064–066 | Configure/review production environment, controlled release and launch readiness after all upstream tasks are complete. |

## Task-level instructions

### Planning and foundation

- **TASK-001 Requirements baseline:** turn the approved brief into measurable requirements, exclusions and decision log. Do not close without owner review.
- **TASK-002 Architecture decision record:** lock the approved Next.js/Supabase boundaries and explicitly retain unresolved policy decisions; do not unilaterally choose gateways, tenancy, tax or cancellation policy.
- **TASK-003 Data/workflow review:** validate the data model and five workflows with the owner; surface business-state edge cases to Ektha before billing work.
- **TASK-004 Approval gate:** record explicit approval in `docs/PROGRESS.md`; if it is absent, implementation tasks remain blocked.
- **TASK-005/006:** set up strict TypeScript, scripts, lint, test foundations and repository conventions. Never overwrite documentation from others.
- **TASK-008:** build validated env separation, safe `.env.example`, ignores and setup guidance. No secrets in source or outputs.

### Supabase, auth and authorization

- **TASK-009:** document/link the Supabase migration/type-generation workflow. Ensure all developers can apply dev migrations in ordered sequence.
- **TASK-010:** own `profiles`, role enum and secure profile creation. A browser must never choose an admin/staff role.
- **TASK-015:** merge only reviewed migrations. Confirm indexes, `FORCE ROW LEVEL SECURITY`, and negative RLS tests for anonymous/customer/staff/admin. This task may require small corrective migrations but must not rewrite another member's applied migration.
- **TASK-016:** own browser/server/admin Supabase clients; admin client must be `server-only` and unreachable from Client Components.
- **TASK-017:** own sign-in/out/reset/callback/invite auth journeys.
- **TASK-018:** own route protection and role redirects; role-scoped layouts must reject direct navigation.
- **TASK-019:** publish the permission constants and authorization helper API that Amaya/Ektha must use. Coordinate any new permission with both before changing the contract.
- **TASK-020:** execute end-to-end direct-access negative tests and resolve auth/RLS mismatches before feature teams depend on a feature.

### Quality and production

- **TASK-060:** consolidate module tests into CI quality gates; do not mark complete until reports include all role and financial flows.
- **TASK-061:** lead threat-model/remediation of actions, RLS, storage, headers, secrets and dependencies.
- **TASK-063:** own backup/restore, migration/release/rollback and incident runbooks.
- **TASK-064–066:** set production variables/redirects/least privilege, orchestrate safe migration/release, and obtain launch acceptance. Never deploy with missing owner approval or unresolved critical security issue.

## File ownership and coordination

Primary areas: root configuration; `src/lib/supabase/`, `src/lib/auth/`, `src/middleware.ts`; `src/app/(auth)/`; shared test/CI configuration; `supabase/config.toml`; identity/RLS/integration migrations; `docs/SETUP.md`, `docs/SECURITY.md`, `docs/PROGRESS.md` and release/runbook documents.

Do not change Amaya's UI/catalogue/customer files or Ektha's commercial workflow files unless agreed. Before a shared-file edit (root config, generated types, migrations, dashboard shell, `PROGRESS.md`), notify the affected owner and rebase/merge deliberately. Add a new migration rather than editing an already shared/applied one.

## Required handoff format

For each completed task, update `docs/PROGRESS.md` and send both members: task ID; changed files; database/policy contract; commands/tests and result; any migration to apply; unresolved issue; next unblocked task. Use the universal checklist in the roadmap.

## Your completion gate

Your work is done only when TASK-066 is owner-approved, production smoke tests cover all three roles, rollout/rollback is documented, and every task in the global ledger is marked complete with evidence.
