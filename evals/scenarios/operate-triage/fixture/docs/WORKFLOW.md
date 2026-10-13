# Agentic Workflow — project protocol (fixture excerpt)

This project follows the agentic workflow. Route every piece of work first, then
build on a branch. (Trimmed to the sections the bug-report modes need.)

## 1. Three altitudes — route every piece of work first

- **Task** — a small, isolated change (typo, one-function fix). Branch → fix →
  verify → done. No plan.
- **Feature** — a user-visible capability that needs shaping: a brief, journeys,
  maybe a mission trio. Route through `/agentic-workflow:plan`.
- **Mission** — multi-session work decomposed into a `.plans/` trio and driven
  phase by phase with independent checkpoint reviews.

## 4. Session lifecycle

**Open** — route the work (§1); create/checkout a branch (never the default
branch). **Work** — the smallest change meeting the acceptance criteria. **Close**
— gates green, commit on the branch, PR; never merge the default branch yourself.

The queue is GitHub Issues, labelled `type/{bug,feature,debt,ops}` and
`size/{XS,S,M}`. User reports from the in-app support channel carry
`source/user`.

## 10. Project profile

| Field | Value |
|---|---|
| **Stack** | Node.js web app + printer agents at each venue branch |
| **Issue tracker** | GitHub Issues via `gh` |
| **Owner channel** (§12) | none |
| **Staging** | none |
| **Default branch** | main |
| **Merge policy** | human-merge |
