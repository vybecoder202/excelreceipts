# ADR 0006: Session and access boundary

Date: 2026-08-14
Status: accepted

## Decision

Supabase Auth sessions use `@supabase/ssr` cookies. Next.js 16 Proxy refreshes tokens by calling `getClaims()` early and forwards both refreshed cookies and private/no-store response headers. Proxy is an optimistic session boundary only: protected server layouts, data-access functions, and every Server Action independently validate signed claims and authorization.

An unconfigured local environment may render the truthful foundation preview. Once public Supabase configuration exists, application routes require a verified session. Google identity alone grants no project data; active membership controls reads, while the first-project command additionally requires the private owner allowlists.

## Rationale

Cookie refresh must happen before Server Components read data, but route interception cannot be the only authorization layer. Keeping access decisions close to RLS-scoped queries and mutations prevents alternate entry points from bypassing checks and preserves a useful account-free local preview.

## Consequences

- Server code uses `getClaims()`, never an unverified `getSession()` user, for access decisions.
- Server Actions are treated as public endpoints and validate both input and authorization.
- Auth responses are private and non-cacheable when session cookies change.
- Hosted Google sign-in remains an account-checkpoint verification item; local tests cover the boundary and database authorization independently.
