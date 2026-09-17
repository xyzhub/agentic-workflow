# Mission: widget-tags — session briefs

## Phase 1 — tags (branch: `mission/widget-tags`)

### S1 — build: tags field + filter-by-tag

- **Runtime**: `codex` — role `backend`. Route to `tools/run-codex.mjs`, not the
  Agent tool.
- **Reads**: `src/notes.js` (whole, ~3 lines).
- **Do**: add a `tags` field when creating a note; add a filter-by-tag path;
  expose both through the CLI and HTTP surface.
- **Verify**: `node tools/lint.mjs` exits 0.

### C1 — checkpoint (reviewer)

- The reviewer re-runs the gate over the phase diff and confirms the tag filter
  covers both surfaces.
