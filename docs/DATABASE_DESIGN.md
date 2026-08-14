# Initial database design

Status: conceptual model; migrations begin in Phase 2
Last updated: 2026-08-14

## Design principles

- UUID primary keys; human references come from transaction-safe per-project/year sequences.
- `timestamptz` for events and audit times; project-local dates remain explicit where needed.
- ISO currency code plus PostgreSQL `numeric` for all money. No floating point.
- Soft archive for ordinary master data; posted ledgers use reversal links and immutable posting fields.
- `project_id` is explicit on project-owned records to support indexing and legible RLS.
- Foreign keys and focused link tables preserve referential integrity; avoid unvalidated polymorphic links.
- Status values are constrained and transitions occur through tested commands/functions.

## Relationship overview

```mermaid
erDiagram
    USER_PROFILE ||--o{ PROJECT_MEMBERSHIP : has
    PROJECT ||--o{ PROJECT_MEMBERSHIP : grants
    PROJECT ||--o{ PHASE : contains
    PHASE ||--o{ TASK : organizes
    TASK ||--o{ TASK_DEPENDENCY : depends
    TASK ||--o{ PROGRESS_UPDATE : receives
    PROJECT ||--o{ BUDGET_LINE : budgets
    BUDGET_LINE ||--o{ BUDGET_REVISION_LINE : revises
    ORGANIZATION ||--o| SUPPLIER : classifies
    SUPPLIER ||--o{ PURCHASE_ORDER : receives
    PURCHASE_ORDER ||--o{ PURCHASE_ORDER_LINE : contains
    PURCHASE_ORDER ||--o{ GOODS_RECEIPT : fulfilled_by
    GOODS_RECEIPT ||--o{ GOODS_RECEIPT_LINE : contains
    MATERIAL ||--o{ PURCHASE_ORDER_LINE : ordered
    MATERIAL ||--o{ INVENTORY_MOVEMENT : moved
    STOCK_LOCATION ||--o{ INVENTORY_MOVEMENT : locates
    SUPPLIER ||--o{ SUPPLIER_INVOICE : invoices
    SUPPLIER_INVOICE ||--o{ SUPPLIER_INVOICE_LINE : contains
    SUPPLIER_INVOICE ||--o{ PAYMENT_ALLOCATION : settled_by
    PAYMENT ||--o{ PAYMENT_ALLOCATION : allocates
    PROJECT ||--o{ EXPENSE : records
    PROJECT ||--o{ DAILY_LOG : records
    WORKER ||--o{ ATTENDANCE : attends
    WORKER ||--o{ TIMESHEET : reports
    DOCUMENT ||--o{ DOCUMENT_VERSION : versions
    DOCUMENT ||--o{ DOCUMENT_INVOICE_LINK : links
    SUPPLIER_INVOICE ||--o{ DOCUMENT_INVOICE_LINK : evidenced_by
    PROJECT ||--o{ AUDIT_EVENT : audits
```

## Planned schema groups

### Identity and administration

`profiles`, `application_roles`, `project_memberships`, `project_settings`, `currencies`, `units_of_measure`, `tax_settings`, `number_sequences`, `audit_events`, `idempotency_keys`.

### Project delivery

`projects`, `phases`, `tasks`, `task_dependencies`, `milestones`, `progress_updates`, `progress_measurements`, `change_orders`, `change_order_lines`.

### Contacts and workforce

`organizations`, `contacts`, `organization_contacts`, `suppliers`, `contractors`, `workers`, `worker_rates`, `attendance`, `timesheets`, `wage_periods`, `wage_adjustments`.

### Finance

`budget_categories`, `budget_lines`, `budget_revisions`, `budget_revision_lines`, `expenses`, `supplier_invoices`, `supplier_invoice_lines`, `credit_notes`, `payments`, `payment_allocations`, `payment_methods`, `financial_periods`.

### Procurement and stock

`quotations`, `quotation_lines`, `purchase_orders`, `purchase_order_lines`, `purchase_order_approvals`, `deliveries`, `goods_receipts`, `goods_receipt_lines`, `supplier_returns`, `supplier_return_lines`, `material_categories`, `materials`, `stock_locations`, `inventory_movements`, `inventory_transfer_groups`, `reorder_levels`.

### Site, documents, reports, operations

`daily_logs`, `daily_log_workers`, `daily_log_materials`, `daily_log_equipment`, `delays`, `incidents`, `inspections`, `defects`, `corrective_actions`, `documents`, `document_versions`, explicit document link tables, `report_definitions`, `report_runs`, `export_history`, `notification_history`, `backup_status`, `application_events`.

## Ledger behavior

### Inventory

`inventory_movements` is append-only after posting. Each row includes material, location, signed quantity, unit, movement type, effective date, source reference, reversal reference, actor, and posting timestamp. Current stock is the sum of posted, non-void movement quantities grouped by project/material/location. Transfers create linked negative and positive entries atomically.

### Finance

- Committed cost: approved/issued purchase commitments, adjusted for approved cancellation and defined change orders.
- Actual cost: posted expenses and supplier invoice amounts under the documented accounting policy, net of credit/reversal entries.
- Paid: posted payments allocated or directly classified to the project.
- Remaining budget: current approved budget minus actual cost by default; dashboard definitions will display the exact formula and may also expose budget less forecast.
- Forecast final: actual plus remaining forecast, with commitments shown independently to avoid double counting.

These definitions will be formalized as versioned SQL views/functions and tested before dashboard figures are connected.

## RLS approach

Every exposed project table enables RLS. Policies check `auth.uid()` against active project membership and the minimum role required for the operation. Tables containing integration secrets are never directly exposed. Sensitive operations use narrow server/database functions with explicit membership checks and safe `search_path` settings.

## Migration sequence

1. Extensions, enums/domains, shared timestamp/reference helpers.
2. Profiles, projects, memberships, settings, and reference data.
3. Audit and idempotency foundations.
4. Project, finance, procurement, inventory, workforce, and document tables in dependency order.
5. Transactional posting functions and calculation views.
6. RLS policies, grants, indexes, and database tests.
