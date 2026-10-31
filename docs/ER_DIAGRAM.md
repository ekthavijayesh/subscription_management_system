# Entity Relationship Diagram

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : has
  PROFILES ||--o{ CUSTOMER_STAFF_ASSIGNMENTS : staff
  PROFILES ||--o{ CUSTOMER_STAFF_ASSIGNMENTS : customer
  PRODUCTS ||--o{ PRODUCT_VARIANTS : has
  PRODUCTS ||--o{ PLANS : defines
  PRODUCT_VARIANTS o|--o{ PLANS : optionally_priced_by
  PROFILES ||--o{ QUOTATIONS : customer
  PROFILES ||--o{ QUOTATIONS : created_by
  QUOTATIONS ||--|{ QUOTATION_ITEMS : contains
  PRODUCTS ||--o{ QUOTATION_ITEMS : snapshot_reference
  PRODUCT_VARIANTS o|--o{ QUOTATION_ITEMS : snapshot_reference
  PLANS o|--o{ QUOTATION_ITEMS : snapshot_reference
  PROFILES ||--o{ SUBSCRIPTIONS : owns
  QUOTATIONS o|--o| SUBSCRIPTIONS : converts_to
  SUBSCRIPTIONS ||--|{ SUBSCRIPTION_ITEMS : contains
  SUBSCRIPTIONS ||--o{ INVOICES : bills
  INVOICES ||--|{ INVOICE_ITEMS : contains
  INVOICES ||--o{ PAYMENTS : receives
  PROFILES ||--o{ PAYMENTS : makes
  SUBSCRIPTIONS ||--o{ SUBSCRIPTION_EVENTS : emits
  SUBSCRIPTIONS ||--o{ CANCELLATION_REQUESTS : has
  PROFILES ||--o{ CANCELLATION_REQUESTS : requests
  PROFILES ||--o{ ACTIVITY_LOGS : acts
  PROFILES ||--o{ NOTIFICATIONS : receives
```

`product`, `variant`, and `plan` references are useful traceability links, not the historical source of truth: item snapshot columns remain authoritative after catalogue changes. `invoices` has one unique period per subscription. Detailed cardinalities and constraints are in `DATABASE_DESIGN.md`.
