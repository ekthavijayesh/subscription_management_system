# Setup Guide

## Status

The application has not been initialized yet. This document defines the intended setup for TASK-005 through TASK-009; do not interpret commands as already completed.

## Prerequisites

- Supported current Node.js LTS and package manager selected by the repository owner.
- Git, a GitHub repository, Supabase account/project and Vercel account/project.
- Access to approved environment variables; never paste secrets into source files or issue trackers.

## Intended local environment

Create `.env.local` from `.env.example` after TASK-008:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=
```

`SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` are server-only. Neither must begin with `NEXT_PUBLIC_` or be imported by a Client Component. The actual variable names required by approved payment/email/PDF providers will be added only when those integrations are selected.

## Expected development workflow

1. Inspect the current branch and `CLAUDE.md`; select one unblocked roadmap task.
2. Install approved dependencies using the lockfile/package manager selected in TASK-005.
3. Start the Next.js app through the project script once initialized.
4. Run Supabase migrations in ordered sequence against a local/dev project; never manually patch a shared/production database.
5. Generate TypeScript database types after schema changes and include them in the task review.
6. Run lint, typecheck, unit/integration/E2E tests relevant to the task before completion.

## Supabase configuration checklist

- Create development, preview/staging (if used) and production projects/environments deliberately; do not point local experiments at production.
- Configure Auth site URL and exact redirect URLs for local, preview and production.
- Apply migrations from `supabase/migrations`; use `supabase/seed.sql` only for development fixtures and never for production business data.
- Enable RLS in the same migration as each application table and test roles directly.
- Configure private storage/buckets and retention only after PDF/document requirements are approved.

## Deployment checklist

- Add environment values to the correct Vercel scope, with production secrets separated from preview/development.
- Confirm no secret is built into browser JavaScript; inspect build/runtime configuration.
- Apply reviewed migrations before or in a controlled compatible release sequence; back up/verify rollback approach.
- Configure approved scheduler and webhook URLs/secrets only after endpoints and signature validation are implemented.
- Execute role-based production smoke tests: admin, assigned/unassigned staff, customer, invoice download, and scheduler authorization.

See `SECURITY.md` for control requirements and `DEVELOPMENT_ROADMAP.md` for task-specific tests.
