---
description: Conform the project to the installed plugin — re-copy docs/WORKFLOW.md (preserving §10 + Local amendments) AND apply the structure ladder (tools/conform.mjs) so a project adopted on an older version gains the rows, ledger fields, roadmap, catalog and queue view the current plugin expects.
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

Bring the project up to the installed plugin — the protocol copy AND the
structure around it (the fix for `/agentic-workflow:check`'s protocol-drift
finding and for the session-start **conform-check** advisory). No
`docs/WORKFLOW.md` → this project isn't bootstrapped; run
`/agentic-workflow:bootstrap` instead.

## 0. Measure the gap (the ladder)

Run `node "${CLAUDE_PLUGIN_ROOT}/tools/conform.mjs"` in the project root. It
prints every structural gap between this project and the installed plugin,
each with its fix — a stale protocol stamp, missing §10 rows, active ledgers
without the budget fields or with more than one `Next up:`, no roadmap epic
view, a hand-written backlog, missing or stale catalog tooling/files. This is
the same ladder the `SessionStart` conform-check hook reads, so what it names
here is exactly what the owner was told at session start. Zero gaps and a
current stamp → report "conformant" and stop.

## 1. Compare versions

Read the project copy's `<!-- protocol-master: vX.Y.Z -->` stamp and the
installed plugin version (`${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`).
Stamp current but the ladder found structural gaps → skip to step 3.7. Stamp
missing → the copy predates stamping; proceed, and say so.

## 2. Preserve the project-owned parts

Extract verbatim from the current copy:
- **§10 Project profile** (the filled table), and
- the **Local amendments** section.

Then diff the rest of the current copy against the OLD bundled master if
determinable, or scan for obviously project-specific edits outside those two
regions. Any found are **drift** (per the template's contract, amendments
belong in Local amendments): do not silently drop them — move each under Local
amendments marked `recovered from <section> during upgrade`, and list them in
the report for the human to re-home or delete.

## 3. Re-copy and reassemble

Copy the bundled master (`${CLAUDE_PLUGIN_ROOT}/templates/WORKFLOW.md`) over
`docs/WORKFLOW.md`, then — exactly as `/agentic-workflow:bootstrap` does — replace the
banner with the NEW version stamp, restore the preserved §10, and restore the
Local amendments section (plus any recovered drift).

**Reconcile new §10 rows**: diff the preserved profile's row keys against the
new master's §10 template — keys the newer master introduced (e.g. Merge
policy, Owner channel, Portfolio) are APPENDED with detected values where
cheaply detectable, else `TBD — confirm`; existing values are never touched.
If the new master has §13 and the machine has a registry repo, offer
registration (the `/agentic-workflow:adopt` 1.5 procedure) rather than leaving the Portfolio
row `TBD`.

## 3.5 Reconcile the docs layout (engineering/ folder)

A small, idempotent docs-layout reconciliation — at most 2 files/repo. The
deployed venture docs are already foldered (`business/`, `launch/`,
`decisions/`); only `architecture.md` + `interface-contract.md` may still sit
flat under `docs/product/` from a pre-`engineering/` adoption.

- **Detect**: check for a flat `docs/product/architecture.md` and/or
  `docs/product/interface-contract.md`.
- **Already foldered** (both live under `docs/product/engineering/`, or neither
  file exists) → **skip silently**: this step is a no-op, emit nothing.
- **Flat copies found** → for each, `git mv docs/product/<file>
  docs/product/engineering/<file>` (create `docs/product/engineering/` first;
  filenames do NOT change), then fix intra-doc links — rewrite any in-repo
  reference to the old flat path (`docs/product/architecture.md`,
  `docs/product/interface-contract.md`) to its `docs/product/engineering/…`
  equivalent, including the cross-link inside `architecture.md` itself.
- **Report the move explicitly and stage for HITL** — never move silently: list
  each `git mv` and every link rewrite in the step-4 report, and leave the moves
  **staged and uncommitted** for the human to review and commit.

Because the already-foldered case is a no-op, re-running `/agentic-workflow:sync`
after the move changes nothing (idempotent).

## 3.6 Refresh the shipped tooling (catalog.mjs)

If the plugin's `${CLAUDE_PLUGIN_ROOT}/tools/catalog.mjs` differs from the
project's `tools/catalog.mjs` (or the project has none but has
`docs/product/catalog/`), copy the newer one over (it is generated tooling,
never project-edited — a project-side change belongs in `catalog.config.json`),
run `node tools/catalog.mjs` and stage the regenerated derived files with the
move. Report it in step 4. No catalog dir and no script → say so and point at
`/agentic-workflow:adopt`'s catalog step; do not create it silently.

## 3.7 Apply the structure ladder (idempotent — every step skips when already done)

Work through the gaps §0 listed, in this order; each is a small mechanical
edit, never a rewrite of project prose:

- **§10 rows** — append any missing row the new master's §10 template
  carries (`Staging`, `Issue tracker`, …) with a detected value where cheap
  (`git branch -r` for `staging`; `gh repo view` → `GitHub Issues via gh`),
  else `TBD — confirm`. Existing values are never touched.
- **Active ledgers** (`.plans/*.state.md` with an open `[ ]`/`[~]` beat) —
  add `Estimate: N sessions` and `Sessions used: k` to the header when
  missing: `k` = the count of `[x]` session rows so far; `N` = `k` + the open
  session rows + open checkpoints (an honest floor — the planner may raise it
  as a dated decision, never silently). Reduce `Next up:` to exactly one line
  by renaming every earlier one `SUPERSEDED next-up (historical):` (the LAST
  one is the newest by the old convention; keep that). Log each edit as a
  ledger deviation line: `sync: budget fields added / next-up deduplicated`.
- **Roadmap** — no `docs/product/roadmap.md` → copy `templates/roadmap.md`
  and, if an item-level roadmap exists (e.g. `.plans/roadmap.md` with per-entry
  status tables), leave it in place and report that `/agentic-workflow:groom`
  should absorb its items into the tracker; do not delete it.
- **Backlog** — a hand-written `BACKLOG.md` is NOT rewritten here (that needs
  the tracker import): report `/agentic-workflow:groom --from BACKLOG.md` as
  the next step.
- **Catalog** — copy the plugin's `tools/catalog.mjs` when missing or
  different (step 3.6), run it, and copy `templates/catalog-features.md` to
  `docs/product/catalog/features.md` when absent (seeding rows is
  `/agentic-workflow:adopt`'s catalog step — report it as the next step when
  the repo already ships capabilities).
- **Engineering folder** — step 3.5 above.

Re-run `node "${CLAUDE_PLUGIN_ROOT}/tools/conform.mjs"` and paste its output
into the report: it must read "matches plugin vX" or list only the gaps whose
fix is another command (`groom`, `adopt`) — those are the hand-off.

## 4. Review & hand off

Summarize what changed in the protocol between the two versions (new/changed
sections, new guardrails, new roles) in a few bullets — this is what the human
is actually approving. Leave everything **uncommitted** for HITL review
(stale-doc rule: if the new master contradicts the project's conventions file,
flag it in the same report).
