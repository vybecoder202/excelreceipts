# Implementation status

Last updated: 2026-08-14

## Current position

Phase 0 discovery/design and the Phase 1 application foundation are complete. The secured database foundation now includes identity, owner admission, projects, phases, tasks, dependencies, milestones, progress history, and deterministic weighted progress. SSR session refresh, protected server access, responsive owner/project setup, and the live Site & progress phase workflow are implemented. UI/UX Pro Max produced the persistent system under `design-system/construction-manager/`; its typography and primary-action treatment were refined for a nontechnical homeowner.

## Phase checklist

- [x] Read and baseline the owner brief.
- [x] Inspect the workspace and confirm no existing application files.
- [x] Generate the persistent UI design system.
- [x] Draft product requirements, architecture, database model, implementation plan, and project conventions.
- [x] Complete initial security and cost/limits documents.
- [x] Record initial Phase 0 architectural decisions.
- [x] Scaffold and verify the initial Phase 1 application foundation.
- [x] Implement the identity/project database foundation and baseline RLS.
- [x] Implement SSR session refresh, server-side access context, and owner project setup.
- [x] Implement the first project-delivery slice: phases, tasks, dependencies, milestones, progress, RLS, and phase UI.
- [ ] Extend migrations and RLS across the remaining business modules.
- [ ] Implement core business modules.
- [ ] Verify external accounts, integrations, deployment, backup, and restore.

## Verified technical baseline

Checked 2026-08-14 using official documentation and npm registry metadata:

- Node.js available locally: 24.15.0; npm: 11.12.1.
- Next.js: 16.3.1; React/React DOM: 19.2.8.
- Tailwind CSS and PostCSS adapter: 4.3.3.
- Supabase JS: 2.112.3; Supabase SSR: 0.12.4; Supabase CLI: 2.114.0.
- All planned baseline packages checked so far use MIT, ISC, Apache-2.0, or similarly compatible licenses.

## Confirmed owner decisions

- Application name: Construction Manager.
- Default currency: Zambian Kwacha (`ZMW`).
- Project timezone: Lusaka, Zambia (`Africa/Lusaka`).
- Tax calculations: excluded.
- Wage calculations: excluded; worker attendance and timesheets remain in scope.
- The owner Google email is stored only in the ignored `.env.local` file and is not committed.

## Risks and blockers

- No external account is required yet.
- Production authentication, hosted database, Drive, deployment, and backup verification will require account checkpoints later.
- Free-plan limits and dashboard labels are time-sensitive and must be re-verified from official sources immediately before instructions are finalized.
- The generated design system originally suggested highly technical heading typography. Plus Jakarta Sans is the recorded, implemented owner-friendly override.

## Foundation verification evidence

- `npm run typecheck`: passed.
- `npm run lint`: passed after pinning ESLint 9.39.5, the latest line compatible with the current Next.js React lint plugins.
- `npm test`: 6 files, 16 tests passed.
- `npm run build`: passed; 17 application routes generated.
- `npm run test:e2e`: 9 passed and 1 intentionally skipped by project targeting across desktop/mobile Chromium.
- `npm run test:e2e:auth`: 1 passed against reset local Supabase; verified fake-owner password session cookies, protected setup, transactional project creation, authorized dashboard state, and sign-out.
- Browser QA: 1440×900 and 375×812 both had no horizontal overflow; adaptive navigation behaved correctly; visible mobile interactive targets were at least 44 px.
- `npm install` audit: 0 known vulnerabilities reported.
- Clean local database reset: foundation migration and fake-only development seed applied successfully.
- `npm run db:test`: 2 files, 61 pgTAP database/RLS/atomicity tests passed.
- Generated database types are wired into both Supabase client factories.

## Next local work

- Add task creation and controlled task/progress status transitions to the Site & progress interface.
- Begin budget categories/lines and supplier/contact foundations, retaining deterministic calculation boundaries.
- Add authenticated integration coverage when the hosted development Supabase/Google provider account checkpoint is reached.
