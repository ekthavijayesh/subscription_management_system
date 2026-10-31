# Operations & Disaster Recovery Runbook (TASK-063)

**Author:** Shamil (Foundation, Security, Architecture & Release Owner)  
**Date:** 2026-10-31  
**Audience:** Site Reliability Engineering, DevOps, and Platform Operations

---

## 1. Database Backup & Retention Policies

The production database is hosted on Supabase PostgreSQL (`gsviltgahkigiyepvwie`).

### 1.1 Automated Backups
* **Daily Full Snapshots:** Supabase automatically executes daily full physical database snapshots at 00:00 UTC.
* **Continuous Write-Ahead Log (WAL) Archiving:** Enabled for continuous point-in-time recovery (PITR) with a minimum 7-day retention window.
* **Storage Location:** Backups are stored in geographically replicated encrypted storage managed by Supabase.

### 1.2 Manual Pre-Release Backup Procedure
Before applying major migrations or releases, execute a manual logical backup:

```bash
# Set connection string from production environment
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.gsviltgahkigiyepvwie.supabase.co:5432/postgres"

# Generate compressed plain SQL schema and data dump
pg_dump -Fc --no-owner --no-privileges "$DATABASE_URL" > "backup-pre-release-$(date +%Y%m%d%H%M%S).dump"
```

---

## 2. Point-in-Time Recovery (PITR) Protocol

In the event of accidental mass data deletion or database corruption:

1. **Access Supabase Dashboard:** Navigate to `Database` -> `Backups` -> `Point in Time Recovery`.
2. **Identify Target Timestamp:** Inspect `activity_logs` or server telemetry to determine the exact timestamp (UTC) immediately preceding the corruptive event.
3. **Trigger Recovery:** Select `Restore to point in time` and specify the timestamp.
4. **Post-Restore Integrity Checks:**
   - Verify table counts across `profiles`, `subscriptions`, `invoices`, and `payments`.
   - Verify that PostgreSQL triggers (`on_auth_user_created`, `set_updated_at`) are functioning.
   - Run integration test suite against the restored database.

---

## 3. Schema Migration & Rollback Protocols

### 3.1 Applying Migrations
* All migrations are committed to `supabase/migrations/` in strict numeric-timestamp sequence.
* Never edit an already applied migration; create a new compensatory forward migration.

Apply migration via Supabase CLI:
```bash
supabase db push --db-url "$DATABASE_URL"
```

### 3.2 Rollback Strategy
Because the system stores historical snapshots (quotes, invoices), hard-dropping columns can corrupt immutable billing history.
* **Expansion/Contract Pattern:**
  1. If a column or table must be phased out, mark it deprecated in the application layer.
  2. Maintain read compatibility.
  3. Apply a subsequent migration dropping columns only after all dependent versions are retired.
* **Zero-Downtime Rollbacks:**
  If a release fails smoke testing, immediately roll back the Vercel deployment to the previous green deployment hash. Since migrations are backward-compatible, older code will continue operating safely.

---

## 4. Incident Management & Severity Triage

| Severity | Definition | Response SLA | Action Required |
| :--- | :--- | :---: | :--- |
| **P1 — Critical** | System down, payment failure loop, security breach, or data corruption | **15 minutes** | Page on-call team, freeze deployments, initiate failover or PITR if necessary. |
| **P2 — Major** | Degraded feature (e.g. PDF generation failing, quotation calculation slow) | **1 hour** | Engage feature owner, prepare hotfix. |
| **P3 — Moderate** | Non-blocking bug with viable workaround (e.g. report CSV export timeout) | **4 hours** | Triage in sprint backlog; deploy during normal release cycle. |
| **P4 — Minor** | Visual cosmetic issue, typo in UI labels | **Next sprint** | Normal deployment. |

### Escalation Matrix
1. **Primary On-Call:** Shamil (Release & Security Owner)
2. **Commercial & Billing Lead:** Ektha (Finance & Billing Owner)
3. **Frontend & UX Lead:** Amaya (UI & Catalogue Owner)
4. **Product Owner Escalation:** kattan kaapi (`kattannkaapii@gmail.com`)

---

## 5. Automated Health & Uptime Monitoring

* **Health Endpoint:** `GET /` or `GET /login` monitored every 60 seconds.
* **Cron Telemetry:** Monitor `/api/billing/cron` execution logs via `activity_logs` where `action = 'automated_billing_run'`.
* **Webhook Telemetry:** Monitor `/api/webhooks/payment` failure rates. Alert on >3 consecutive signature mismatches or 500 errors.
