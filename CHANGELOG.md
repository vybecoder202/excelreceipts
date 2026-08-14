# Changelog

All notable project changes are recorded here.

## Unreleased

### Added

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

- Confirmed Construction Manager as the final application name, ZMW as the default currency, and Africa/Lusaka as the project timezone.
- Removed tax and wage calculations from scope while retaining worker attendance and timesheets.
