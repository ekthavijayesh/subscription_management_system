# Architecture

## System boundary

Browser → Next.js App Router on Vercel → Supabase Auth/PostgreSQL/Storage. Server Actions handle authenticated UI commands; Route Handlers serve webhooks, protected downloads and scheduled jobs. Supabase RLS is the final data boundary. No Express or Flask layer is allowed.

## Layers

| Layer | Responsibility | Must not contain |
| --- | --- | --- |
| `app/` pages/layouts | composition, metadata, role entry points | business mutations/query duplication |
| `app/actions/`, `api/` | parse request, authenticate, authorize, call service, map response | pricing/state-transition rules |
| `lib/services/` | domain workflows, transactions, idempotency decisions | React/UI imports |
| `lib/repositories/` | targeted persistence/query functions | policy-free raw access exposed to UI |
| `lib/validations/` | Zod input schemas | secret access |
| `components/features` | feature screens/forms | service-role use |
| `components/ui` | shadcn primitives | business behavior |

## Rendering and data access

Use Server Components for initial protected rendering. Interactive components receive minimal serializable data and invoke Server Actions. Browser Supabase client uses only the public anon key and remains subject to RLS. Server Supabase client carries the user session. The admin client is a `server-only` isolated escape hatch for scheduled jobs and verified webhooks.

## Authorization sequence

`session → profile role/active state → permission/assignment → resource state/ownership → RLS/query → action`. Each mutation has both a server authorization check and an RLS-compatible database design. Authorization helpers return explicit outcomes; they do not simply hide components.

## Reliability

Workflows spanning documents/statuses use a transaction or database RPC. Billing and conversion requests are idempotent. Use unique constraints as the authoritative protection from retried/concurrent requests, then map constraint violations to useful domain errors.

## Observability

Record business `activity_logs` and `subscription_events`; use structured server logs without secrets. Add request IDs and error boundaries. Define operational alerts during deployment work.
