# Mission: widget-tags — master plan

## Goal

Add tags to notes: set tags when adding a note, filter the list by tag, and
expose both through the existing CLI and HTTP surface.

## Phase 1 — tags (branch: `mission/widget-tags`)

| Task | Acceptance |
|---|---|
| Tags field on note creation | `addNote` accepts and stores tags; existing callers unaffected |
| Filter-by-tag | a filter path returns only notes carrying the tag |
| CLI + HTTP surface | both expose set-tags and filter-by-tag |

## Decisions locked (2026-09-17)

1. S1 runs on the **codex** runtime (owner put `backend` on codex for this
   mission); the orchestrator routes it to `tools/run-codex.mjs`, never the
   Agent tool.
