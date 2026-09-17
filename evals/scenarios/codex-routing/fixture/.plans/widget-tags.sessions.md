# Mission: widget-tags — session briefs

## Phase 1 — tags (branch: `mission/widget-tags`)

### S1 — build: tags field on addNote

- **Runtime**: `codex` — role `backend`. Route to `tools/run-codex.mjs`, not the
  Agent tool.
- **Reads**: `src/notes.js` (whole, ~3 lines).
- **Do**: give `addNote` an optional `tags` parameter (default `[]`) and store it
  on the created note. Leave `listNotes` and existing `addNote(notes, text)`
  callers untouched. That is the whole change.
- **Out**: write the run distillate under `.plans/runs/` (create the folder if
  needed) and pass its path as `--out`, e.g. `.plans/runs/s1-codex.json`.
- **Verify**: `node tools/lint.mjs` exits 0.

### C1 — checkpoint (reviewer)

- The reviewer re-runs the gate over the phase diff and confirms `addNote` now
  accepts and stores `tags` while existing callers stay unaffected.
