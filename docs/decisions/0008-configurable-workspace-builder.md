# ADR 0008: Configurable workspace builder before fixed construction modules

Status: accepted

Date: 2026-08-14

## Context

The initial brief described a fixed residential construction application. After testing the first module-oriented screens, the owner requested an Airtable-style general application organized as Data, Interfaces, and Forms, with construction implemented as a system built using that general layer.

## Decision

- Treat each project as one configurable base for the current local product.
- Store table and field definitions separately from typed record values.
- Store cross-table links in a validated relationship table, not inside unvalidated JSON.
- Provide constrained lookup and formula definitions; never execute arbitrary user SQL or JavaScript.
- Render Forms and Interfaces from the same records rather than copying submissions or dashboard data.
- Supply construction as an installable starter configuration with eight linked tables, views, forms, and interface blocks.
- Retain the earlier domain-specific construction schema during transition. Authoritative finance and inventory posting will continue to use dedicated transactional tables and ledgers.

## Consequences

The product can evolve as a general local database tool and the owner can model new workflows without code. The metadata engine adds complexity around validation, dependency resolution, and future schema changes. Some Airtable-class capabilities—field/table reordering, persisted filters and grouping, reciprocal links, automations, attachments, collaborative editing, and full interface layout editing—remain future builder phases and must not be represented as complete.
