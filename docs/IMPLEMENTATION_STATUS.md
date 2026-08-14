# Implementation status

Last updated: 2026-08-14

## Current position

Phase 0 initial discovery/design is complete and the safe local portion of Phase 1 is implemented. The workspace was initially empty and was not a Git repository. UI/UX Pro Max produced the persistent system under `design-system/buildledger/`; its typography and primary-action treatment were refined for a nontechnical homeowner.

## Phase checklist

- [x] Read and baseline the owner brief.
- [x] Inspect the workspace and confirm no existing application files.
- [x] Generate the persistent UI design system.
- [x] Draft product requirements, architecture, database model, implementation plan, and project conventions.
- [x] Complete initial security and cost/limits documents.
- [x] Record initial Phase 0 architectural decisions.
- [x] Scaffold and verify the initial Phase 1 application foundation.
- [ ] Implement database migrations and RLS.
- [ ] Implement core business modules.
- [ ] Verify external accounts, integrations, deployment, backup, and restore.

## Verified technical baseline

Checked 2026-08-14 using official documentation and npm registry metadata:

- Node.js available locally: 24.15.0; npm: 11.12.1.
- Next.js: 16.3.1; React/React DOM: 19.2.8.
- Tailwind CSS and PostCSS adapter: 4.3.3.
- Supabase JS: 2.112.3; Supabase SSR: 0.12.4.
- All planned baseline packages checked so far use MIT, ISC, Apache-2.0, or similarly compatible licenses.

## Configurable production decisions

Safe placeholders will remain until the owner supplies:

- Final application name (working title: BuildLedger).
- Default currency (no production default assumed).
- Project timezone (local development currently follows Europe/Moscow, but production is unset).
- Google email for the production owner allowlist (must go into secure configuration, not documentation).
- Whether tax is enabled and whether prices are tax-exclusive or tax-inclusive by default.
- Whether worker rates use hourly, daily, or both methods.

## Risks and blockers

- No external account is required yet.
- Production authentication, hosted database, Drive, deployment, and backup verification will require account checkpoints later.
- Free-plan limits and dashboard labels are time-sensitive and must be re-verified from official sources immediately before instructions are finalized.
- The generated design system suggested highly technical heading typography. The implementation may use a calmer, more owner-friendly heading face while preserving its spacing, color, and accessibility rules; any override will be recorded.

## Foundation verification evidence

- `npm run typecheck`: passed.
- `npm run lint`: passed after pinning ESLint 9.39.5, the latest line compatible with the current Next.js React lint plugins.
- `npm test`: 2 files, 6 tests passed.
- `npm run build`: passed; 17 application routes generated.
- `npm run test:e2e`: 3 passed and 1 intentionally skipped by project targeting across desktop/mobile Chromium.
- Browser QA: 1440×900 and 375×812 both had no horizontal overflow; adaptive navigation behaved correctly; visible mobile interactive targets were at least 44 px.
- `npm install` audit: 0 known vulnerabilities reported.

## Next local work

- Add Supabase CLI project configuration and the first Phase 2 migrations.
- Implement profiles, projects, memberships, owner admission, reference data, audit/idempotency, and baseline RLS tests.
- Add authenticated session refresh/proxy behavior only alongside those policies so the shell cannot imply access before authorization exists.
