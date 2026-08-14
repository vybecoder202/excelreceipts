# Implementation status

Last updated: 2026-08-14

## Current position

The product has pivoted from fixed construction-module navigation to a general configurable workspace organized as Data, Interfaces, and Forms. The metadata engine, responsive workspace shell, construction starter, linked records, lookups, constrained formulas, typed records, forms, and live interface blocks are implemented locally. The Data grid now keeps fields visible when empty and supports inline record creation, working filter/group/sort controls, record/table/field menus, insert-above/below, duplication, comments, field reordering, and recoverable deletion. Earlier construction module screens and their dedicated schema remain available during the transition.

This differs from the original source brief, which assumed construction-specific modules would be the primary application structure. The owner explicitly requested the general builder on 2026-08-14; ADR 0008 records the decision and the boundary that authoritative accounting and inventory posting still require dedicated ledgers.

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
- [x] Implement the first usable finance, supplier, inventory catalogue, workforce, attendance, and daily-log entry slice.
- [x] Implement configurable tables, typed fields/cells, linked records, lookups, formulas, views, forms, interfaces, and a construction starter.
- [x] Add the first Airtable-style grid interaction slice: inline rows, filters, groups, sorts, context menus, comments, deletion, and field ordering.
- [ ] Add remaining builder schema editing: rename tables and fields, restore archived items, and reciprocal links.
- [ ] Add persistent filtering, sorting, grouping, field visibility, CSV import/export, and attachments.
- [ ] Add interface block editing, form field layout controls, and automations.
- [ ] Reconcile configurable construction tables with dedicated authoritative finance/inventory ledgers.
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

## Verification evidence

- `npm run typecheck`: passed.
- `npm run lint`: passed after pinning ESLint 9.39.5, the latest line compatible with the current Next.js React lint plugins.
- `npm test`: 11 files, 31 tests passed, including view filtering/sorting/grouping, linked lookup, and exact-decimal formula materialization.
- `npm run build`: passed; 20 application routes generated, including dynamic Data, Forms, and Interfaces routes.
- Pre-pivot browser coverage for the earlier module shell passed. Its authenticated scenario now needs replacement with a builder-focused scenario; the owner has chosen to perform current visual/feature testing, so that browser rewrite is not a completion claim for this phase.
- `npm install` audit: 0 known vulnerabilities reported.
- Clean local database reset: foundation migration and fake-only development seed applied successfully.
- `npm run db:test`: 5 files, 199 pgTAP database/RLS/atomicity tests passed; 79 cover the configurable workspace and grid interactions.
- Generated database types are wired into both Supabase client factories.

## Current local testing boundary

The owner will perform visual and feature testing. Authentication expansion is intentionally deprioritized; local demo mode remains the entry point. No current external account is needed.

## Next local work

- Add table/field rename and archived-item restoration.
- Add persisted view filters, sorts, groups, and column visibility.
- Add form layout editing and interface block/layout editing.
- Add reciprocal linked fields, rollups, safe richer formulas, CSV import/export, and local attachments metadata.
