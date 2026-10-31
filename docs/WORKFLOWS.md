# Business Workflows

## Customer registration

1. User is invited or uses an approved registration policy.
2. Supabase Auth creates/verifies the identity.
3. Trusted database/server workflow creates exactly one `profiles` row with a safe role.
4. Session and active profile are checked; middleware/server layout redirects to the role dashboard.
5. Profile creation and administrator role/activation changes are audited.

Reject unverified/inactive profiles; never trust a role posted by a client.

## Quotation to subscription

1. Authorized actor selects an accessible customer and active catalogue/plan records.
2. Server calculates prices, eligible discounts, effective taxes and totals; it stores quotation item snapshots.
3. Quote transitions through only permitted states and cannot be accepted when expired/cancelled/superseded.
4. An atomic idempotent conversion creates subscription and item snapshots, links source quote, adds event/activity/notification.
5. Repeated submit receives the original result or a conflict, not a second agreement.

## Subscription billing

1. Secure scheduler identifies active due subscriptions using UTC due dates and approved renewal policy.
2. Transaction locks/validates state and creates at most one invoice for `subscription_id + period start + period end`.
3. Invoice uses subscription snapshots, is issued according to approved policy, and payment request/notification occurs.
4. Verified payment is recorded once, allocated atomically and updates invoice/subscription only through allowed state transitions.
5. Every attempt/result produces subscription event/activity data; failures follow approved retry/dunning policy.

## Invoice management

1. Authorized role opens a scoped list with search, filters and pagination.
2. Server/RLS returns invoice and immutable line snapshots.
3. PDF rendering uses server-side authorized data; file/storage URL is private or short-lived.
4. Download and status actions are auditable.

## Cancellation

1. Customer submits cancellation request for own eligible subscription.
2. System validates identity, duplicate/open request and state; it creates pending request/activity/notification.
3. Authorized staff/admin decides under approved policy.
4. Domain service sets effective date/status, records event/activity and sends notification.
5. Billing eligibility respects final cancellation date; direct UI-only cancellation is prohibited.
