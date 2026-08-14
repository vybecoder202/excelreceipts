# ADR 0009: Grid ordering and recoverable deletion

Date: 2026-08-14

## Status

Accepted.

## Context

The configurable Data workspace needs spreadsheet-style insertion, duplication, column movement, comments, and deletion. Record identity numbers cannot also represent user-controlled display order, and immediate physical deletion would conflict with the project's auditability requirements.

## Decision

- Records keep their immutable database identity number and gain a separate fractional numeric ordering key.
- Insert-above, insert-below, and duplicate commands calculate a midpoint ordering key inside one authorized database transaction.
- Field order remains explicit metadata and is replaced atomically only when the request contains every active field exactly once.
- The interface says “Delete,” while tables, fields, and records are archived and their mutations are audited.
- Destructive table and field commands refuse changes that would leave active lookup, formula, or linked-table dependencies invalid.
- Right-click menus are supplemented by visible ellipsis buttons so the same actions remain available to keyboard and touch users.

## Consequences

Repeated insertion between the same neighboring rows can eventually require position normalization; six decimal places provide ample room for the current local scale. Archived-item restoration needs a later management interface. Table deletion can require the owner to remove incoming linked fields first, which is safer than silently deleting related schema.
