# Changelog

All notable project changes are recorded here.

## Unreleased

### Added

- General Data/Interfaces/Forms workspace architecture with an Airtable-style responsive shell.
- Configurable tables, 14 field types, typed scalar cells, records, validated linked records, lookups, constrained formulas, grid/list/gallery views, record search, and archive protection.
- Configurable form definitions whose submissions write to the same Data records.
- Configurable interface definitions with live record counts, exact currency summaries, averages, and recent-record lists.
- Construction starter that installs eight related tables, ten views, two forms, two lookup fields, and a live overview interface without inserting fake records.
- Seventy-nine workspace-specific pgTAP tests; the complete database suite now contains 199 passing tests.
- Persistent empty-table column headers and responsive inline record creation.
- Working URL-based Filter, Group, and Sort controls for configurable data views.
- Record context menus for edit, insert above/below, duplicate, comment, and recoverable delete, with matching visible ellipsis controls.
- Field drag reordering, move-left/right actions, inline field creation entry points, protected field deletion, and table context-menu deletion.
- Audited record comments, fractional row ordering, dependency-aware table/field archives, and 34 additional pgTAP interaction tests.

- Initial product requirements, architecture, database design, implementation plan, and durable project conventions.
- Architecture decision records for the stack, ledger correction model, and UI direction.
- Persistent UI/UX Pro Max design system for Construction Manager.
- Next.js 16 strict TypeScript foundation with responsive application shell, mobile navigation, module routes, setup and sign-in boundaries, PWA manifest/offline shell, and security headers.
- Validated environment boundaries, Supabase browser/server factories, exact decimal money helpers, Vitest and Playwright test foundations.
- Initial security, cost/limits, acceptance test, and production configuration-gate documentation.
- Local Supabase project configuration, identity/project migrations, valid fake-only Auth development seed, generated database types, and 23 pgTAP authorization/atomicity tests.
- Supabase SSR cookie refresh through Next.js Proxy, signed-claim access context, safe sign-out, redirect validation, and protected application layouts.
- Responsive owner-only project setup with validated server action, idempotent database command, loading/error feedback, and authorized dashboard identity state.
- Project delivery schema for phases, tasks, dependencies, milestones, progress history, per-project references, and a deterministic weighted-progress view.
- Responsive Site & progress screen with authorized project summaries, truthful empty/error states, phase creation, inline validation, loading feedback, and read-only behavior.
- Sixty-one passing database tests and an authenticated mobile browser workflow covering project and phase creation.

### Changed

- Replaced the construction-module-first primary navigation with Data, Interfaces, and Forms. Earlier module screens remain available during migration.

- Confirmed Construction Manager as the final application name, ZMW as the default currency, and Africa/Lusaka as the project timezone.
- Removed tax and wage calculations from scope while retaining worker attendance and timesheets.
