---
description: What should I do next? Reads the project state and recommends exactly ONE next command, with a one-line why, then offers to run it. The zero-knowledge entry point.
allowed-tools: [Read, Bash, Grep, Glob, AskUserQuestion, SlashCommand]
---

Answer one question: **what is the single best next action in this project?**
Inspect fast, decide, recommend — total output under 12 lines. No lectures;
`/agentic-workflow:check` exists for full diagnostics.

## Inspect (read-only, seconds not minutes)

- `docs/WORKFLOW.md` present? No → the answer is `/agentic-workflow:adopt` (repo has code) or
  `/agentic-workflow:bootstrap` / `/agentic-workflow:autopilot "<idea>"` (fresh). Stop inspecting.
- Stage signals: `docs/product/idea.md`, PRD, CI config, deploy config,
  `docs/product/launch/`, `docs/product/business/`, `docs/product/sales/`,
  `docs/product/engineering/{tracking-plan,runbook}.md`.
- In-flight work: `.plans/*.state.md` → `Next up:`; git branch, uncommitted
  changes, unpushed commits; open PRs (`gh`, if available).
- Sales fill queue: `grep -rn '_unwritten_' docs/product/sales/` (if that folder
  exists) — every `_unwritten_` is a capability the chronicler recorded whose
  benefit language marketing hasn't filled yet. A non-empty count is a pending
  `marketing` fill beat; surface it as the recommended move when nothing higher
  in the priority order is in flight.
- `docs/product/catalog/README.md` (≤40 lines) when it exists — the current
  shape of the product; `node tools/catalog.mjs --check` red → the derived
  files are stale, which is itself a candidate next action (`/agentic-workflow:end`
  did not regenerate them).
- **The queue** (§4): if §10 records an **Issue tracker**, `gh issue list
  --state open --label size/XS,size/S --json number,title,labels,updatedAt
  --limit 30` (or the tracker's equivalent) — the groomed queue is where "what
  next" comes from when nothing is in flight. If the queue looks ungroomed
  (items with no `type/`/`size/` labels, or the backlog view's generated stamp is
  older than the last 20 commits), the recommendation is
  `/agentic-workflow:groom` first. A markdown `BACKLOG.md` with no tracker →
  recommend `/agentic-workflow:groom --from BACKLOG.md`.
- Red flags: protocol stamp older than the plugin, ledger contradicting git.

## Decide (priority order — first match wins)

1. **Unfinished beats new**: uncommitted work → `/agentic-workflow:end`; an open mission
   ledger → `/agentic-workflow:mission "<name>" continue`; an unmerged approved PR → tell the
   human to merge; a drifted ledger → `/agentic-workflow:mission "<name>" replan`.
2. **Unmet gate for the current stage** → the command that meets it
   (no idea.md at V0 → `/agentic-workflow:brainstorm "<idea>"` if it's still a raw notion, else
   fill idea.md and validate; no CI at V2+ → `/agentic-workflow:mission "foundation"`; no
   audit at V4 → `/agentic-workflow:audit`; deployed but unverified → `/agentic-workflow:verify`).
3. **Nothing in flight, queue has items** → ONE item from the groomed queue,
   highest leverage per size: `size/XS` bug → `/agentic-workflow:fix #N`;
   `size/S`/`M` → `/agentic-workflow:mission "<title> (#N)"` (one session by
   default; the planner says if it honestly needs `phases`). Prefer the owner's
   epic ranking in `docs/product/roadmap.md` when several qualify.
4. **Nothing in flight, queue empty or absent** → the stage's natural move: V0
   go/no-go → V1 define → V2 `/agentic-workflow:start` on the skeleton → V3
   `/agentic-workflow:start` or `/agentic-workflow:mission` → V4
   `/agentic-workflow:audit` → V5 `/agentic-workflow:release` → V6
   `/agentic-workflow:operate`.

## Output (exactly this shape)

- **Where you are** — stage + one-line state.
- **Do this** — ONE command carrying the **`agentic-workflow:` prefix**, real
  values filled in (the actual mission name from the ledger, the actual version,
  the actual URL, never `<placeholders>`; if a value is genuinely unknowable,
  that unknown IS the next action: say what to decide). The prefix matters — the
  bare short form may not resolve.
- **Why** — one line.
- *(optional)* **Runner-up** — one alternative, one line.

## Then offer to run it

Unless the next action is a human-only gate (a merge, a deploy, a spend, a
publish — those the human fires where they live), **offer to run the recommended
command for them** (AskUserQuestion, default yes) and, on yes, invoke it via
SlashCommand — so they never have to type or namespace it correctly. A no leaves
them the printed command. This is what makes `/agentic-workflow:next` the one
button worth remembering.
