# ADR 0003: UI direction

Date: 2026-08-14
Status: accepted with typography refinement pending

## Decision

Adopt a calm, light-first operational dashboard with deep blue primary actions, restrained amber attention cues, neutral surfaces, compact but readable data cards, and accessible semantic status colors. Use Lucide SVG icons, an 8-point spacing rhythm, 44 px minimum targets, responsive sidebar/bottom navigation, mobile record cards, visible focus, and reduced-motion support.

The persistent source is `design-system/buildledger/MASTER.md`. The skill-proposed Fira Code heading face is considered too technical for the nontechnical owner persona; Phase 1 will select a calmer heading/body pairing and document it as a master override.

## Rationale

The application is operational and information-rich, but it is used by one homeowner rather than an enterprise finance team. Strong hierarchy and predictable actions are more important than decorative branding or maximum density.

## Consequences

- Desktop tables cannot be the only representation of records.
- Charts require text summaries and table alternatives.
- Every feature must include empty/loading/error/disconnected states as part of its normal design.
