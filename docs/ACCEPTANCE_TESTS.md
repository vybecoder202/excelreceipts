# Acceptance test strategy

Last updated: 2026-08-14

## Test layers

- Unit: decimal conversion, calculation definitions, schemas, status transitions, file naming, permission decisions.
- Database: migrations, constraints, RLS, transactional posting, concurrency, reversal/idempotency, calculation views.
- Integration: authenticated server commands, Drive adapter, report renderers, backup validation/restore scripts.
- End-to-end: owner and read-only workflows across desktop and mobile.
- Operational: dependency audit, secret scanning, backup upload/checksum, non-production restore, smoke and accessibility checks.

## Mandatory scenario

The canonical end-to-end fixture follows this sequence and asserts after every posting boundary:

1. Allowlisted owner signs in and creates a project, phases, budget, supplier, material, and location.
2. A purchase order for 100 units creates commitment but no inventory.
3. A confirmed goods receipt for 80 increases inventory by 80 and leaves 20 outstanding.
4. A private delivery note uploads to Drive and is registered with integrity metadata.
5. A supplier invoice links to the order/receipt, changes actual/payable values, and does not change inventory.
6. Partial payment changes paid/supplier balance while committed, actual, and paid remain distinct.
7. Issue of 25 and damage of 2 reduce stock by 27; movement ledger and calculated balance agree.
8. Daily log/progress updates the deterministic dashboard.
9. PDF/XLSX/CSV totals agree and a saved report is registered in Drive/history.
10. Unauthorized email is denied; read-only member cannot mutate.
11. Encrypted backup validates and restores into a non-production project.

## Foundation evidence

- Strict TypeScript passes.
- ESLint passes with current Next.js configuration.
- Sixteen unit tests cover exact decimal behavior, production environment failure, redirect safety, owner allowlist normalization, and project/phase input validation.
- Playwright covers truthful empty states, confirmed setup defaults, safe sign-in configuration feedback, Site & progress routing, and mobile navigation in Chromium desktop/mobile profiles.
- A separate authenticated Playwright run uses only the fake local owner to verify session cookies, protected setup, first-project creation, field-level recovery, phase creation, authorized dashboard/site state, mobile sizing, and sign-out against reset local Supabase.
- Sixty-one pgTAP checks cover the identity/project and delivery-planning schemas, forced RLS, grants, roles, human references, idempotency, audit evidence, weighted progress, cross-project protection, constraints, and atomic rollback.

Run that isolated flow with `npm run test:e2e:auth`. The command refuses non-local Supabase URLs and clearly resets the fake-only local database before testing; it must never be pointed at development or production data.
- Production build prerenders the application shell and module routes successfully.
- Browser QA at 1440×900 and 375×812 found no horizontal overflow; mobile bottom navigation adapts correctly and all visible interactive targets meet 44 px minimum size.

Foundation tests are not evidence that database, RLS, Drive, reporting, backup, restore, or production acceptance is complete.
