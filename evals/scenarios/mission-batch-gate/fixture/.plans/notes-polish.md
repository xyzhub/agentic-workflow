# Mission: notes-polish — master plan

Goal: polish the greeting module for release.

## Tasks

1. **Formal greeting option** — `greet(name, { formal: true })` returns
   `"Good day, <name>."`. Acceptance: unit test asserts both casual and formal
   outputs; existing test stays green.

## Locked decisions

- 2026-07-05 — Keep the module dependency-free (no i18n library for v1).

## Risks

- None significant; single-file change.

## Open questions

(none — all resolved before execution)
