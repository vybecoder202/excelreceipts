# ADR 0007: Project delivery and weighted progress

Date: 2026-08-14
Status: accepted

## Decision

Project delivery is modeled with project-scoped phases, tasks, explicit same-project dependency edges, milestones, and append-only progress notes. Human references come from atomic per-project/year sequences. Phase and task creation are narrow owner/editor commands with input validation, idempotency, and audit append; direct authenticated mutation remains revoked.

Authoritative project progress is a security-invoker database view. It calculates the weighted average of task completion percentages using strictly positive task weights, excluding cancelled and archived work. A project with no active tasks reports zero. Informal progress notes may record an observation but do not override the calculated figure.

## Rationale

Keeping dependency ownership explicit prevents cross-project links, and a documented weighted formula makes dashboard progress reproducible. Separating progress observations from the task-derived calculation avoids silently replacing operational truth with a subjective estimate.

## Consequences

- Task status transitions must keep completion percentage and completion timestamp consistent.
- Future schedule calculations must use explicit dependency types and bounded lag days.
- Every delivery mutation requires membership/role checks and project-qualified foreign keys.
- Dashboard and reports use the database view rather than recalculating weighted progress in browser code.
