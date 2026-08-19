---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# {{PROJECT_NAME}} — Roadmap (epic view)

_The strategic view and nothing else: which themes matter now, in the owner's
order, and where their items live. **Per-item status does not live here** — the
queue does (§10 **Issue tracker**; `/agentic-workflow:groom` keeps it true and
regenerates the backlog view). A roadmap that carries item status duplicates the
tracker and goes stale the day after it is reconciled. Deploys to
`docs/product/roadmap.md`._

## Owner ranking (dated)

_The order the owner wants epics worked, with the date they said so. Re-rank by
editing this list — the history of rankings is `git log` on this file._

1. `E-1` — _epic name_ — _(YYYY-MM-DD)_

## Epics

_One block per epic. An epic is a label in the tracker (`epic/E-n`); its items
are found by that label, never listed here. Keep each block ≤8 lines._

### E-1 — _epic name_
- **Outcome**: _the user-visible result when this epic is done — one sentence._
- **Why now**: _the evidence (owner request, `/agentic-workflow:operate` finding, decision doc)._
- **Items**: `gh issue list --label epic/E-1` _(or the tracker's equivalent)._
- **Decisions**: _links to `docs/product/decisions/*` that shaped or deferred it._
- **Status**: _active · parked (owner, date) · done (date)_ — the only status word
  this file carries, and it is about the epic, not its items.

## Deferred (owner decisions)

_An epic the owner parked: one line, the date, and the decision doc. Its items
are closed in the tracker with a comment pointing here — never left open._

- _(none)_
