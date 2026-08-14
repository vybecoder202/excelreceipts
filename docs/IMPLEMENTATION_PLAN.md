# Implementation plan

Last updated: 2026-08-14

## Phase 0 — discovery and design

Deliver requirements, architecture, initial relational model, security model, UI system, cost assumptions, acceptance criteria, durable repository conventions, and decision records.

Acceptance: the major modules and authoritative business rules are documented; external-account dependencies and configurable owner decisions are explicit.

## Phase 1 — application foundation

Create the Next.js strict TypeScript project, Tailwind/shadcn-compatible design tokens, responsive application shell, PWA manifest/read caching baseline, environment validation, Supabase client boundaries, authentication shell, errors, Vitest, and Playwright.

Acceptance: install, lint, typecheck, unit tests, and production build succeed; the shell works at 375/768/1024/1440 px and does not expose server configuration.

## Phase 2 — database and security

Implement migrations, constraints, indexes, RLS, roles, owner admission, reference seeds, audit/idempotency, transaction functions, and database security tests.

Acceptance: a clean local database applies migrations; unauthorized/read-only tests fail closed; financial and inventory primitives are atomic and auditable.

## Phase 3 — core project and finance

Implement projects, phases, budgets, contacts, suppliers, expenses, invoices, payments, and deterministic dashboard read models.

Acceptance: original/approved/committed/actual/paid/forecast values remain distinct; partial payment, duplicate invoice, void/reversal, and rounding tests pass.

## Phase 4 — procurement and inventory

Implement materials, locations, quotes, purchase orders, partial deliveries, goods receipts, movement ledger, issues, transfers, returns, damage, and adjustments.

Acceptance: the 100 ordered/80 received/20 outstanding scenario passes; invoice creation does not affect stock; concurrent movements reconcile.

## Phase 5 — site and workforce

Implement tasks, dependencies, milestones, weighted progress, daily logs, workers, attendance, timesheets, and draft wage reporting.

Acceptance: progress constraints/weights, mobile daily capture, attendance, and both wage methods pass tests; payroll disclaimer is visible.

## Phase 6 — Drive and reporting

Implement separate Drive OAuth, token encryption, private folder/file operations, integrity registry, report query models, PDF/XLSX/CSV rendering, and report history.

Acceptance: revoked/expired authorization and upload failures recover clearly; formats agree on totals and respect filters; saved report is registered.

## Phase 7 — backup and recovery

Implement scheduled/manual logical export, validation, version manifest, checksum, public-key encryption, Drive upload, safe retention, status artifact, restore tooling, and guide.

Acceptance: a backup validates and restores into non-production without production overwrite capability; secrets are absent from logs/artifacts.

## Phase 8 — QA and security review

Run end-to-end workflow, RLS/adversarial checks, accessibility, mobile/landscape, slow network, large table, dependency, performance, and backup verification.

Acceptance: critical suites pass and no unresolved critical security finding remains.

## Phase 9 — deployment and handoff

Guide one free account at a time: GitHub, Vercel, Supabase, then Google Cloud. Configure development before production, deploy, smoke test, activate backups, verify restore, and finish owner/admin/maintenance documentation.

Acceptance: live system, service URLs, backup, restore evidence, guides, cost controls, and maintenance schedule are handed over without disclosing credentials.

## Dependencies and gates

- Local Phases 0–1 do not require external accounts.
- Phase 2 can be developed locally with Supabase CLI/Docker; hosted verification waits for a free Supabase account.
- Google sign-in/Drive production verification requires a Google Cloud project and consent configuration.
- Production deployment requires private GitHub and Vercel accounts.
- No paid feature, billing enablement, broad Drive permission, destructive production change, or production data operation proceeds without explicit approval.
