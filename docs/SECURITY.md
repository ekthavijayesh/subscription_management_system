# Security Guide

## Security model

Security is enforced in layers: Supabase Auth authenticates; server code validates and authorizes commands; PostgreSQL constraints preserve data invariants; Supabase RLS controls every data path; and UI role visibility improves usability only. No layer is a replacement for another.

## Required controls

### Credentials and configuration

- Commit only `.env.example` with blank placeholders. Keep `.env.local`, Supabase keys, webhook secrets, cron secret and provider credentials out of Git/logs/client bundles.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are the only intended browser Supabase configuration values. The anon key is protected by RLS.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only, isolated in a module importing `server-only`, and is used only for an explicitly reviewed trusted workflow.
- Rotate exposed/retired secrets immediately. Use Vercel/Supabase managed environment settings for deployment.

### Auth and authorization

- Fetch the session/profile on the server for every protected page/action/route. Require active profile and role.
- Never permit sign-up input to choose `admin` or `staff`. Profile creation/role changes use a trusted DB function/trigger or server admin flow.
- Authorize each resource against role **and** ownership/staff assignment/status. Do not rely on URL, client state, hidden buttons or a role claim alone.
- Treat Server Actions as public mutation endpoints: authenticate, validate Zod input, authorize, handle errors safely and rate-limit sensitive actions if applicable.

### Database and RLS

- Enable and force RLS on all exposed tables. Default deny; create separate narrow `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies.
- Never use permissive `USING (true)` / `WITH CHECK (true)` production policies. Policies must prevent row reassignment/role escalation through update fields.
- For a `SECURITY DEFINER` function, use a fixed safe `search_path`, narrow grants, explicit authorization checks, no dynamic SQL unless rigorously parameterized, and tests.
- Use FKs, checks, unique constraints and transactions/RPCs for invariants—especially invoice period uniqueness, state transitions, and payment allocation.
- Keep issued invoices, events and audit logs append-only. Archive rather than hard-delete catalogue records with history.

### Input, output and documents

- Validate all inputs with Zod and enforce equivalent database constraints. Parse UUIDs, decimal strings, dates, enums and pagination bounds.
- Never use JavaScript floating point for currency; use database numeric arithmetic or a reviewed decimal representation.
- React escaping is not a license to inject raw HTML. Sanitize any future rich text. Do not include confidential error detail in UI responses.
- Generate PDFs on the server from authorized snapshot data. Use private storage or short-lived signed URLs and check invoice ownership/access at download time.

### Integrations and automation

- Verify webhook signature, timestamp/replay protection and provider event identity before any state mutation. Make handlers idempotent using provider event IDs/unique constraints.
- Scheduled billing endpoint requires a strong secret and must not be callable by normal browser clients. Use transaction locking/idempotency and structured logs.
- Record sufficient audit metadata without recording passwords, full tokens, payment card/bank data, keys or unnecessary PII.

### Platform protections

- Use secure cookies/session behavior from supported Supabase SSR guidance. Configure production redirect URLs exactly.
- Set security headers/CSP after verifying necessary Supabase/PDF assets; protect against clickjacking and content-type sniffing.
- Keep dependencies updated; run lockfile/dependency vulnerability scans in CI. Use HTTPS only in production.
- Define retention/access/export/deletion requirements with the owner before collecting additional personal data.

## Required verification matrix

For each policy-sensitive feature, test anonymous, customer owning/non-owning, staff assigned/unassigned, admin, inactive user, and direct API/Supabase access. Include cross-tenant cases if tenancy is later approved. Test malformed input, replayed submission, concurrent invoice creation, expired session, invalid state transition, signed URL expiration, invalid webhook/cron secret and audit event creation.

## Incident response

Disable/rotate compromised credentials; preserve relevant audit/server logs; block affected account/token; assess data exposure; restore from approved backup/migration process; then document root cause and remediation. Do not place secrets or raw payment details in incident tickets.
