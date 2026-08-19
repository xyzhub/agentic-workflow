---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: {{MISSION_NAME}} — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the expensive
exploration happens once, here. Deploys to `.plans/{{MISSION_NAME}}.sessions.md`._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/{{MISSION_NAME}}.md` · Ledger: `.plans/{{MISSION_NAME}}.state.md`

## Large-files table

_Every file a brief touches, with its measured line count (`wc -l`), so read
budgets are real. Grep-first ranged reads for anything over ~400 lines._

| File | Lines |
|---|---|
| _src/…_ | _NN_ |

## Phase 1 — {{PHASE_NAME}} (branch: `mission/{{MISSION_NAME}}-p1`)

_One branch per phase, merged at its checkpoint per the ledger's gate policy.
Mark a phase **parallel-safe** if its sessions touch disjoint files and can run
at once._

### S1 — _session name_

- **Reads**: _file (NN lines, whole | anchor `<symbol>` ±30–50), …_ — the exact
  targets, so execution follows without discovery.
- **Catalog**: _`features.md` rows + `api.md` / `data-model.md` sections whose
  anchors this brief touches (e.g. `F-12`, `api.md /api/staff/orders/**`,
  `data-model.md#Payment`) — read these BEFORE the code reads; they are the
  current state (§6.1). `none` only when the brief touches no catalogued anchor._
- **Do**: _the smallest change meeting the acceptance criteria for its task(s)._
- **Verify**: _the gate signal — e.g. `npm test` green (cases X, Y asserted);
  live-verify in a real client if there's a runtime surface (§2); when a route,
  the schema, or a catalogued anchor changed: `node tools/catalog.mjs --check`
  green and the `features.md` row(s) rewritten in the same branch (§6.1)._
- **Read budget**: _NN lines (≤30% of context, ~1,500). Suits: `backend` |
  `frontend` | `security` | `devops`._

**Checkpoint** ends phase 1 — the independent `reviewer` (fresh context) re-runs
the gates and diff-reviews `base..head`, per the gate policy in the ledger.

---
_Size every brief to its read budget; split any that can't fit and note the
split. Each session's outcome and any deviation lands in
`.plans/{{MISSION_NAME}}.state.md`, never only in chat._
