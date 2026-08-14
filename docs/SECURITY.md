# Security model

Status: initial threat model with session, owner admission, and database foundation controls
Last updated: 2026-08-14

## Protected assets

- Project financial, supplier, workforce, progress, incident, and document metadata.
- Google Drive documents and OAuth refresh tokens.
- Supabase service credentials, direct database credentials, and token-encryption keys.
- Integrity of posted financial and inventory ledgers, audit history, reports, and backups.

## Trust boundaries

- The browser is untrusted and receives only publishable configuration plus data allowed by RLS.
- Next.js server code verifies session, allowlist, role, project, input, status transition, and idempotency before a command.
- PostgreSQL constraints, RLS, and transactional functions remain authoritative if interface checks are bypassed.
- Google Drive and GitHub Actions are external systems; tokens and backup credentials are scoped and server/workflow-only.

## Initial threat model

| Threat | Primary controls |
|---|---|
| Unauthorized Google account signs in | Owner email allowlist, explicit membership, default-deny admission, RLS |
| User accesses another project/object by ID | Project-scoped RLS plus server authorization and project-qualified queries |
| Client changes price, quantity, role, or status | Zod validation, database types/constraints, allowed-transition functions |
| Partial multi-table write corrupts totals | PostgreSQL transaction, row locks where needed, idempotency key, atomic audit append |
| Posted record is hidden by edit/delete | Append-only/reversal model, restricted grants, audit events |
| Browser bundle or logs disclose secrets | server-only modules/variables, environment classification, secret-redaction tests, safe errors |
| Uploaded file is unsafe or public | MIME/extension allowlist, size limits, normalized name, checksum, private `drive.file` scope, no public link |
| OAuth refresh token is stolen from database | authenticated encryption with a versioned server-only key and rotation procedure |
| Request is forged or replayed | secure SameSite cookies, origin/CSRF validation where applicable, idempotency, short-lived session checks |
| Sensitive endpoint is abused | per-account/IP rate limits using a portable store and generic public error responses |
| Backup leaks database contents | logical export validation, public-key encryption before upload, private key held offline |

## Foundation controls already present

- Environment variables are classified in `.env.example`; production startup fails when mandatory values/defaults are missing and does not log their values.
- Security response headers disable MIME sniffing and framing, restrict referrer data, and deny unneeded powerful features.
- Supabase browser/server client factories use only the publishable URL/key; privileged credentials have no browser import path.
- Google sign-in starts only when public Supabase configuration exists; callback destinations are restricted to local absolute paths.
- Next.js 16 Proxy refreshes Supabase cookies and applies private/no-store response headers; protected server layouts validate signed JWT claims with `getClaims()`.
- Server-rendered access context reads only the signed-in profile, active membership, authorized project, and project settings permitted by RLS.
- Project creation revalidates the session and private owner allowlist, validates input, and invokes one transactional idempotent database command. Public errors never include private rows or credentials.
- Offline service-worker logic caches only the offline shell and immutable same-origin assets. It excludes APIs and authentication and never queues mutations.
- Exact money helpers reject silent rounding.
- UI actions disclose foundation state instead of pretending a write succeeded.

## Phase 2 database controls

Every exposed foundation table has forced RLS before grants. Policies use `auth.uid()` and active project membership. Read-only roles receive no mutation grants or policies. The private owner allowlist is outside the exposed schema. Future business tables must follow the same default-deny pattern before application wiring.

Critical database functions will:

1. Use the minimum necessary `SECURITY DEFINER` privilege only when caller-scoped SQL cannot implement the transaction.
2. Set `search_path` to trusted schemas explicitly.
3. Verify authenticated subject, active project membership, role, and source-record state.
4. Lock affected rows consistently and validate idempotency.
5. Append audit references within the same transaction.
6. Return stable domain errors without private row contents.

Automated tests will prove unauthenticated, non-member, wrong-project, and read-only requests fail for reads/writes as appropriate.

## File handling baseline

Initial allowlist: PDF, JPEG, PNG, WebP, and explicitly reviewed office/drawing formats. The server will inspect claimed MIME type, safe extension, size, sanitized base name, and checksum. File IDs—not broadly shareable URLs—are stored. Replacement creates a new document version and preserves the prior file reference.

## Secret placement

- Browser-safe: only `NEXT_PUBLIC_APP_URL`, Supabase URL, and Supabase publishable key.
- Vercel server secrets: service-role key, OAuth client secret, token-encryption key, database connection if required by server jobs.
- GitHub Actions secrets: backup database URL and backup Drive token. The age public recipient is not secret.
- Offline: age private recovery key. It does not enter GitHub, Vercel, Supabase, Drive alongside backups, or chat.

No real secret belongs in the repository, ordinary chat, screenshots, issue text, or logs.

## Open security work

- Verify Google authentication and owner admission against hosted development Supabase at the account checkpoint.
- Extend RLS, grants, transactional functions, audit/idempotency, and adversarial tests across every business module.
- Finalize CSP after report/Drive dependencies are selected.
- Implement encrypted token storage and key rotation.
- Implement safe upload inspection and rate limiting.
- Add dependency audit and secret scanning to CI.
- Complete restore threat model and quarterly access review.
