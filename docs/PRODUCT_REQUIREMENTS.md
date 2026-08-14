# Product requirements

Status: initial baseline
Last updated: 2026-08-14

## Product summary

BuildLedger is a private, responsive web application for one owner managing a residential house build. It brings budgets, supplier obligations, purchases, deliveries, inventory, site work, workforce records, documents, reports, and recovery operations into one auditable system.

The first production release must work without paid infrastructure and without runtime AI. The working name, locale, and business defaults remain configurable until the owner supplies production values.

## Users and access

Initial roles:

- Owner: full project administration and approval authority.
- Editor: may create and update permitted operational records, but cannot administer access or sensitive integrations.
- Read-only: may view authorized projects and reports but cannot mutate data.
- System: narrowly scoped server processes for integrations, reports, and backup metadata.

Production access initially requires Google sign-in plus an explicit owner email allowlist. A valid Google account alone never creates access. Project membership and RLS remain authoritative when the interface is bypassed.

## Primary outcomes

The owner can:

1. See the financial, procurement, inventory, schedule, document, and backup health of the build from one dashboard.
2. Trace approved budget, commitments, invoices/expenses, payments, and forecast without conflating them.
3. Order materials, record partial deliveries, and reconcile physical stock through an append-only ledger.
4. Capture expenses, invoices, deliveries, photos, and daily logs easily from a phone.
5. Track phases, tasks, milestones, progress, workers, attendance, and draft wages.
6. Generate reproducible PDF, XLSX, and CSV reports whose totals come from deterministic database logic.
7. Store private documents in a dedicated Google Drive structure and detect missing or inaccessible files.
8. Audit critical changes and recover the system from encrypted, independently restorable backups.

## Functional scope

### Administration and projects

- Projects, project settings, memberships, roles, currencies, units, tax configuration, numbering sequences, and audit events.
- Configurable working name, currency, timezone, tax behavior, and wage methods.

### Finance

- Budget categories and lines, original and approved revisions, commitments, expenses, supplier invoices, credit notes, payments, and allocations.
- Partial payments and supplier balances.
- Duplicate supplier invoice detection within a supplier.
- Void/reversal workflows for posted records.

### Procurement and inventory

- Suppliers, quotations, purchase orders, approvals, partial deliveries, goods-received notes, supplier returns, stock locations, reorder levels, and outstanding quantities.
- Append-only stock movements for receipt, issue, transfer, return, damage/waste, adjustment, and reversal.
- Concurrent posting protection and ledger-to-balance reconciliation.

### Site and workforce

- Phases, tasks, dependencies, milestones, weighted progress, daily logs, delays, incidents, inspections, defects, photos, workers, rates, attendance, timesheets, wage periods, adjustments, and draft wage reports.
- Wage outputs are project-management records, not legally authoritative payroll.

### Documents and reports

- Private Google Drive file metadata, explicit entity links, versions/replacements, integrity checks, and reconnection handling.
- Filter-aware PDF, XLSX, and CSV reporting with project, parameters, date range, generation time, and report history.

### Backup and recovery

- Nightly and manual logical backups through GitHub Actions.
- Roles, schema, and data exports; version manifest; validation; SHA-256 checksum; public-key encryption; Drive upload; safe retention; restore scripts and drills.

## Critical business acceptance rules

- Creating an expense or supplier invoice does not change inventory.
- Ordering 100 and receiving 80 increases inventory by exactly 80 and leaves 20 outstanding.
- Payments change paid/cash totals but not invoice amount or inventory.
- A transfer creates balanced outbound and inbound movements in one transaction.
- Posted financial and stock corrections remain traceable to the original entry.
- Project progress is constrained to 0–100 and calculated using documented weights.
- Dashboard and report values share versioned deterministic calculation definitions.

## Experience requirements

- Installable, mobile-first PWA with responsive desktop layouts.
- Keyboard accessible, screen-reader understandable, touch friendly, and WCAG AA oriented.
- Persistent global search and quick actions for expense, delivery, daily log, and invoice upload.
- Filtering, saved filters, sorting, grouping, pagination, column visibility, and mobile card alternatives.
- Explicit empty, loading, slow-network, error, unauthorized, disconnected-integration, and success states.
- Read caching is allowed; offline finance and inventory mutations are not.

## Non-functional requirements

- Type-safe strict TypeScript and validated configuration.
- RLS on every exposed table, least privilege, server-only secrets, secure cookies, safe file handling, authorization on every write, and security headers.
- Exact decimal money behavior, transactional multi-record writes, and audited critical mutations.
- Portable source, SQL migrations, scripts, tests, and documentation committed to a private Git repository.
- No required paid service and no paid or broadly scoped external action without explicit owner approval.

## Deferred from the first release

- Runtime AI, OCR, natural-language analytics, or paid inference.
- Legally authoritative payroll/tax filing.
- Offline mutation of financial or inventory records.
- Broad Google Drive access beyond the least-privilege application-created/selected files unless explicitly approved.

## Production acceptance summary

Production is accepted only after the application builds, migrations and RLS tests pass, core workflows work end-to-end, Google sign-in and Drive uploads are verified, reports generate correctly, financial/inventory tests pass, encrypted backup and non-production restore are tested, mobile/accessibility checks pass, deployment smoke tests pass, documentation is complete, and no critical security finding remains.
