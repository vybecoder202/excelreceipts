# ADR 0002: Ledgers and corrections

Date: 2026-08-14
Status: accepted

## Decision

Inventory quantity is derived from an append-only movement ledger. Posted financial and inventory transactions are corrected through explicit void, reversal, credit, and replacement records linked to their source. Multi-entry operations post atomically with idempotency protection.

## Rationale

A manually editable balance cannot reliably explain what is physically available or who changed it. Reversals preserve auditability, allow reconciliation, and prevent an invoice or ordinary expense from accidentally changing stock.

## Consequences

- The interface must provide understandable correction flows instead of edit/delete for posted records.
- Calculation views and reconciliation tests are required.
- Transfers and reversals create more rows but yield a complete history.
