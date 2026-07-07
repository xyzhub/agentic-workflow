# Mission: notes-polish — session briefs

Protocol: see `docs/WORKFLOW.md` (mission machinery per the plugin master §5).

## Large-files table

| File | Lines |
|---|---|
| src/greet.js | 6 |
| test/greet.test.js | 8 |

## Phase 1 — formal greeting (branch: `mission/notes-polish-p1`)

### S1 — add the formal option

- **Reads**: src/greet.js (6 lines, whole), test/greet.test.js (8 lines, whole)
- **Do**: extend `greet` with an options argument; `{ formal: true }` →
  `"Good day, <name>."`; default behavior unchanged.
- **Verify**: `npm test` green (both cases asserted).
- **Read budget**: 50 lines. Suits: `backend`.

**Checkpoint** ends phase 1 (independent reviewer, per the gate policy in the
ledger).
