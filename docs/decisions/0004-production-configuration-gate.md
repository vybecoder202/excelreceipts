# ADR 0004: Production configuration gate

Date: 2026-08-14
Status: accepted

## Decision

The local application may run in explicit development/foundation mode with external services absent. When `APP_ENV=production`, startup fails unless all authentication, database, owner allowlist, Google OAuth/token-encryption, currency, and timezone variables are present and correctly formatted.

No error includes secret values. The UI reports only non-sensitive readiness booleans.

## Rationale

Local foundation work should not be blocked by accounts the owner does not have yet, while a production deployment must never appear healthy with missing security-critical configuration or invented business defaults.

## Consequences

- Deployment instructions must set `APP_ENV=production` deliberately.
- Preview deployments use a separate `preview` environment and development data.
- Startup validation will expand as later integrations add mandatory production settings.
