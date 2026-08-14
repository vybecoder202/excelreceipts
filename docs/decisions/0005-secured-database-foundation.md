# ADR 0005: Secured database foundation

Date: 2026-08-14
Status: accepted

## Decision

The first database slice implements identity, owner admission, projects, settings, memberships, reference data, audit events, and idempotency before any business module stores records. Every exposed table has forced row-level security, direct mutation is revoked, and privileged operations are narrow database commands with explicit authorization and safe `search_path` settings.

The owner's email is injected only through private environment configuration. Migrations and the fake-only local seed contain no production identity or secret.

## Rationale

Authorization and audit behavior must be testable before financial, procurement, stock, or workforce records depend on it. Separating private admission data from the exposed schema also prevents accidental disclosure through ordinary application queries.

## Consequences

- New project-owned tables must use the membership helper and receive database-level authorization tests.
- Commands that change multiple related records must be transactional and idempotent.
- Generated database types are refreshed after every schema change and compiled into both Supabase client factories.
