# Production Environment Configuration Guide (TASK-064)

**Author:** Shamil (Foundation, Security, Architecture & Release Owner)  
**Date:** 2026-10-31

---

## 1. Configured Production Credentials

The application is configured to connect to the live Supabase instance:
* **Project Reference:** `gsviltgahkigiyepvwie`
* **Supabase URL:** `https://gsviltgahkigiyepvwie.supabase.co`
* **Anon / Publishable Key:** `[CONFIGURED_IN_ENV]`
* **Service Role Secret Key:** `[REDACTED_SECURE_IN_ENV]`
* **JWKS Endpoint:** `https://gsviltgahkigiyepvwie.supabase.co/auth/v1/.well-known/jwks.json`

---

## 2. Vercel Deployment Environment Settings

Set the following environment variables in the Vercel Dashboard (`Settings` -> `Environment Variables`):

| Variable Name | Target Environments | Secret Type | Description |
| :--- | :---: | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Public | Live Supabase HTTPS API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Public | Anon key governed by PostgreSQL RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | **Sensitive / Server-only** | Service role key for admin billing and webhooks |
| `NEXT_PUBLIC_APP_URL` | Production | Public | Production canonical domain (e.g., `https://subscription-system.vercel.app`) |
| `CRON_SECRET` | Production | **Sensitive / Server-only** | 32-character high-entropy secret for scheduled billing |
| `PAYMENT_WEBHOOK_SECRET` | Production | **Sensitive / Server-only** | Gateway signing secret for HMAC verification |

---

## 3. Supabase Authentication URL Configuration

In the Supabase Management Console (`Authentication` -> `URL Configuration`):
1. **Site URL:**
   `https://subscription-system.vercel.app`
2. **Redirect URLs:**
   - `https://subscription-system.vercel.app/auth/callback`
   - `https://subscription-system.vercel.app/login`
   - `https://subscription-system.vercel.app/forgot-password`
   - `http://localhost:3000/**` (Development only)

---

## 4. Scheduled Billing Job (Cron) Configuration

The background billing engine is triggered by calling `/api/billing/cron`.

### Configuring Vercel Cron (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/billing/cron",
      "schedule": "0 0 * * *"
    }
  ]
}
```

The endpoint requires the header `Authorization: Bearer <CRON_SECRET>` or query parameter `?secret=<CRON_SECRET>`.
Browser requests without this credential receive an immediate `401 Unauthorized`.
