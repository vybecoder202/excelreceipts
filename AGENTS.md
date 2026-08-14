# BuildLedger working conventions

## Product intent

BuildLedger is the working title for a personal residential construction-management application. It must remain understandable to a nontechnical owner, portable across hosting providers, secure by default, and usable on phones, tablets, and desktop computers.

The source brief is `C:\Users\user\Downloads\construction prompt.md`. When this file and the repository disagree, preserve implemented work and record the discrepancy in `docs/IMPLEMENTATION_STATUS.md` before changing behavior.

## Non-negotiable domain rules

- Use PostgreSQL `numeric`, never floating point, for money.
- Keep original budget, approved budget, committed cost, actual cost, paid cost, and forecast cost distinct.
- Inventory is derived from an append-only movement ledger. A purchase order or invoice never changes stock.
- Confirmed goods receipts increase stock. Issues, transfers, returns, damage, and approved adjustments create movements.
- Posted finance and inventory records are corrected by void/reversal and replacement, never silent edit or deletion.
- Critical writes are transactional, authorized on the server, validated, and auditable.
- Runtime AI is optional and disabled by default. AI output is advisory/draft-only.

## Architecture boundaries

- `src/app`: routing, layouts, route handlers, and server actions.
- `src/components`: reusable presentation and interaction components.
- `src/features`: feature-level UI, schemas, queries, commands, and tests.
- `src/lib`: cross-cutting infrastructure such as environment validation, Supabase clients, formatting, and errors.
- `src/server`: server-only authorization, services, integrations, and orchestration.
- `supabase/migrations`: schema, functions, triggers, indexes, grants, and RLS policies.
- `tests`: integration and end-to-end coverage; colocate focused unit tests with their modules where useful.

Browser code may use only publishable configuration and RLS-scoped clients. Service-role credentials, Google OAuth secrets, refresh tokens, encryption keys, and database URLs are server-only.

## Coding standards

- TypeScript strict mode; avoid `any` and unchecked type assertions.
- Prefer Server Components. Add `"use client"` only at a genuine interaction boundary.
- Validate external input with Zod at the server boundary even when the client also validates it.
- Keep calculations deterministic and test them with exact decimal expectations.
- Use UUIDs internally and database-generated human-readable references for documents.
- Add database constraints for rules that must hold regardless of interface behavior.
- Every mutation must perform an explicit authorization check; do not rely on a hidden button as security.
- Never log secrets, tokens, raw private documents, or sensitive database payloads.
- Keep dependencies maintained, pinned through the lockfile, and license-compatible.

## UI standards

- `design-system/buildledger/MASTER.md` is the visual source of truth. Page overrides live in its `pages` folder.
- Mobile-first at 375 px; verify 768, 1024, and 1440 px layouts.
- Meet WCAG AA contrast. Preserve visible focus indicators and logical keyboard order.
- Use Lucide SVG icons consistently; do not use emoji as structural icons.
- Interactive targets are at least 44 by 44 CSS pixels with visible hover, focus, pressed, loading, disabled, success, and error states.
- Respect `prefers-reduced-motion`; transitions normally last 150–300 ms and use opacity/transform.
- Wide records become cards on small screens rather than forcing horizontal page scrolling.
- Do not enable offline financial or inventory mutation until conflict resolution is designed and tested.

## Verification and documentation

Before declaring a phase complete:

1. Run the relevant typecheck, lint, unit, integration, build, and end-to-end checks.
2. Confirm no secrets or personal project data were added.
3. Update `docs/IMPLEMENTATION_STATUS.md` and `CHANGELOG.md`.
4. Record material technical choices in `docs/decisions/`.
5. Report unresolved risks honestly; do not label placeholders as production-ready.

Do not weaken RLS, authorization, validation, audit logging, or test assertions merely to make a check pass.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
