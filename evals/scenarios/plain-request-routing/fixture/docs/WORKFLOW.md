# Agentic Workflow — project protocol (fixture excerpt)

This project follows the agentic workflow. Route every piece of work first, then
build on a branch. (Trimmed to the sections a routing decision needs.)

## 1. Three altitudes — route every piece of work first

- **Task** — a small, isolated change (typo, one-function fix). Branch → fix →
  verify → done. No plan.
- **Feature** — a user-visible capability that needs shaping: a brief, journeys,
  maybe a mission trio. Route through `/agentic-workflow:plan`.
- **Mission** — multi-session work decomposed into a `.plans/` trio and driven
  phase by phase with independent checkpoint reviews.

When unsure which altitude fits, ask `/agentic-workflow:next` (or hand the raw
request to the `intake` agent) — do not start editing code before it is routed.

## 4. Session lifecycle

**Open** — route the work (§1); create/checkout a branch (never the default
branch). **Work** — the smallest change meeting the acceptance criteria. **Close**
— gates green, commit on the branch, PR; never merge the default branch yourself.

## 10. Project profile

- Stack: Node.js CLI (no framework).
- Test: none yet.
- Merge policy: human-merge.
