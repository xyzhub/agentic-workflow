---
description: What should I do next? Reads the project state and recommends exactly ONE next command, with a one-line why. The zero-knowledge entry point.
allowed-tools: [Read, Bash, Grep, Glob]
---

Answer one question: **what is the single best next action in this project?**
Inspect fast, decide, recommend — total output under 12 lines. No lectures;
`/check-workflow` exists for full diagnostics.

## Inspect (read-only, seconds not minutes)

- `docs/WORKFLOW.md` present? No → the answer is `/adopt` (repo has code) or
  `/init-workflow` / `/autopilot "<idea>"` (fresh). Stop inspecting.
- Stage signals: `docs/product/idea.md`, PRD, CI config, deploy config,
  `docs/product/launch/`, `docs/product/business/`.
- In-flight work: `.plans/*.state.md` → `Next up:`; git branch, uncommitted
  changes, unpushed commits; open PRs (`gh`, if available).
- Red flags: protocol stamp older than the plugin, ledger contradicting git.

## Decide (priority order — first match wins)

1. **Unfinished beats new**: uncommitted work → `/end-work`; an open mission
   ledger → `/mission "<name>" continue`; an unmerged approved PR → tell the
   human to merge; a drifted ledger → `/mission "<name>" replan`.
2. **Unmet gate for the current stage** → the command that meets it
   (no idea.md at V0 → fill it; no CI at V2+ → `/mission "foundation"`; no
   audit at V4 → `/audit`; deployed but unverified → `/verify`).
3. **Nothing in flight** → the stage's natural move: V0 go/no-go → V1 define →
   V2 `/start-work` on the skeleton → V3 `/start-work` or `/mission` → V4
   `/audit` → V5 `/release` → V6 `/operate`.

## Output (exactly this shape)

- **Where you are** — stage + one-line state.
- **Do this** — ONE copy-pasteable command, **real values filled in** (the
  actual mission name from the ledger, the actual version, the actual URL —
  never `<placeholders>`; if a value is genuinely unknowable, that unknown IS
  the next action: say what to decide).
- **Why** — one line.
- *(optional)* **Runner-up** — one alternative, one line.
