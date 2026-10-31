# Project Overview

## Vision

Build a secure web application for the complete commercial lifecycle of recurring subscriptions: catalogue and plan definition, quotation, acceptance, subscription, recurring billing, invoice, payment, cancellation, reporting, and auditability.

## Users

- **Admins** operate the system and every business module.
- **Staff** perform delegated customer-facing commercial and billing work for assigned customers and permissions.
- **Customers** self-serve only their account and financial documents.

## Product principles

Financial records are accurate, traceable and historically stable; authorization is enforced on the server and in the database; every important state change is auditable; workflows are complete rather than cosmetic; and responsive, accessible interfaces use one coherent design system.

## Scope boundary

The initial release uses Next.js, Supabase, Tailwind, shadcn/ui, Lucide, Recharts, React Hook Form, Zod, Vercel and GitHub. There is no separate backend. Items requiring product decisions (gateway, tax rules, currency, multi-tenancy, proration and dunning) are listed in `CLAUDE.md` and must be approved before implementation.

## Success measures

An authorized user can complete the correct role-specific workflow; an unauthorized one cannot access its data through the UI, route, server action, or direct Supabase query. Duplicate invoices cannot be created for a subscription billing period. Issued pricing stays correct after catalogue changes. Critical paths have automated tests and production operations are observable.
