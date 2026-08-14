# ADR 0001: Stack and application boundaries

Date: 2026-08-14
Status: accepted for foundation

## Decision

Use Next.js 16 App Router with strict TypeScript, React Server Components by default, Tailwind CSS 4, shadcn-compatible owned components, Supabase PostgreSQL/Auth with `@supabase/ssr`, Google Drive behind a server-only adapter, Vitest, and Playwright.

Routine authenticated reads may use RLS-scoped Supabase clients. Privileged and multi-record writes use explicit server commands and focused transactional database functions. Provider integrations and reporting remain behind interfaces so the application can leave Vercel, Supabase, or Google Drive with bounded rewriting.

## Rationale

This matches the required stack, keeps secrets out of the browser, gives PostgreSQL authority over financial/inventory consistency, and retains a standard Node deployment path. Owning component source through the shadcn model reduces runtime coupling while preserving accessibility customization.

## Consequences

- More database functions and authorization tests are required than in a client-only CRUD design.
- Preview/production environment separation must fail closed.
- Server/client module boundaries must be enforced in code review and tests.
- Database behavior remains portable SQL but Supabase Auth/RLS integration still requires a migration plan if the provider changes.
