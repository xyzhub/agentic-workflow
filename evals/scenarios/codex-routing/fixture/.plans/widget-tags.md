# Mission: widget-tags — master plan

## Goal

Give notes an optional `tags` field: `addNote` accepts tags and stores them,
and existing callers keep working unchanged.

## Phase 1 — tags (branch: `mission/widget-tags`)

| Task | Acceptance |
|---|---|
| Tags field on note creation | `addNote` accepts an optional `tags` array and stores it on the note; existing `addNote(notes, text)` callers are unaffected |

## Decisions locked (2026-09-17)

1. S1 runs on the **codex** runtime (owner put `backend` on codex for this
   mission); the orchestrator routes it to `tools/run-codex.mjs`, never the
   Agent tool.
