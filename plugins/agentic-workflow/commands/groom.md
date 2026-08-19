---
description: Groom the queue — probe every open issue against the tree, close what shipped (with evidence), flag what went stale, re-size the rest, and regenerate the backlog view. Hand-written backlog files (BACKLOG.md, docs/product/backlog.md, TODO.md, an item-level .plans/roadmap.md) are detected and imported into the tracker automatically; --from only overrides the path.
argument-hint: '[--dry-run] [--from <file>] [label:<type/…|size/…|epic/…>]'
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, AskUserQuestion]
---

Keep the queue true (Agentic Workflow §4 "The queue"). An append-only backlog is
a write-only log dressed as a queue: it only knows how to grow, so it lies —
orderly's `BACKLOG.md` reached 123 KB / 119 open boxes with shipped items still
"open" in its *small effort* section, and its roadmap marked every entry
shipped or deferred while new ideas kept landing in the backlog. `/agentic-workflow:groom` is the
`/agentic-workflow:settle` discipline applied to the queue: **probe every row
against the tree, then act on evidence, never on the file's word.**

**Precondition**: the §10 **Issue tracker** row (e.g. `GitHub Issues via gh`).
No tracker recorded but the remote is GitHub → use `gh` and record the row
(`GitHub Issues via gh`) as part of this run — grooming without a tracker is
the exception, not a mode. With no tracker at all, groom the markdown backlog
**in place** (mark rows, never delete) and recommend adopting one.

## 1. Inventory — the tracker AND any hand-written backlog

Read the open queue: `gh issue list --state open --limit 500 --json
number,title,labels,body,updatedAt` (or the tracker's equivalent). Filter by the
optional `label:` argument. Note items missing the queue labels (`type/*`,
`size/*`) — they get labels in step 4.

Then **detect hand-written queue files** — you know where they live; the
owner should not have to say. Sweep the repo's markdown (`git ls-files '*.md'`
plus untracked docs — never `node_modules`) and take a file as a **queue
candidate** when either:

- it holds **≥3 unticked `- [ ]` items** (a checkbox list is a queue by
  shape), or
- its path or first heading matches `backlog|todo|roadmap|punchlist|triage|
  ideas|follow-?ups|deferred|wishlist|nits`, or it carries item-level `R-NN`
  entries (a roadmap with per-entry `SHIPPED`·`DEFERRED` status tables),

and its first three lines do NOT say `generated view`. **Excluded by
role, never imported**: `.plans/*.state.md` (mission ledgers — their open
rows are beats, not queue items), `.plans/OBLIGATIONS.md` (the obligations
register — `/agentic-workflow:settle`'s domain), `docs/WORKFLOW.md`,
`CHANGELOG.md`, `docs/product/JOURNEY.md`, `docs/product/session-handoff.md`,
`.plans/*.sessions.md`/`*.md` master plans, decision memos under
`docs/product/decisions/`, and anything under `docs/archive/`. Everything else
that matched is listed with its unticked count and the sentence that made it
match. `--from <file>` adds or overrides a path — it is never required.

Present the candidate list **once**, per file: import / skip / it is a note,
not a queue (AskUserQuestion when the human is present; `--dry-run` prints
the list and stops; unattended runs import only the canonical names —
`BACKLOG.md`, `docs/product/backlog.md`, `TODO.md`, item-level
`.plans/roadmap.md` — and report the rest as candidates). Skipped files are
remembered in the generated view's header (`skipped: <path> — <owner's
word>`) so the next groom does not ask again.

## 2. Probe each item against the tree (evidence, not memory)

For every issue, gather the cheapest deterministic evidence, in this order,
stopping at the first decisive signal:

- **Anchors named in the body** — file paths, symbols, routes, models, settings
  keys: `test -f`, `rg -n <symbol>`, route file present under `server/api/**`,
  model in the schema. If the project has a catalog (`docs/product/catalog/`,
  §6.1), check `api.md` / `data-model.md` / `features.md` first — they are the
  current inventory.
- **Merged work referencing it** — `gh pr list --state merged --search "<#N>|<title
  words>"`, `git log --grep "<#N>|<title words>" --oneline`.
- **The behavior itself** when a gate can prove it (a test named in the item
  exists and is green; a route answers in a real client).

Spawn a specialist (`backend`/`frontend`) only for an item whose evidence needs
code reading beyond a grep — and brief it with the exact anchors. Never conclude
"shipped" from a commit *message* alone; the diff-bearing commit must be an
ancestor of the default branch (`git merge-base --is-ancestor <sha> <default>`).

## 3. Classify

- **shipped** — evidence in the tree (anchor present + merged commit, or the
  behavior proven). Quote the evidence.
- **stale** — the anchors no longer exist / the described surface was replaced /
  a decision doc supersedes it, but the outcome was not shipped as written.
- **open** — still true; re-check the `size/*` label against what the probe saw
  (an XS that touches four files is an S).
- **needs owner** — you cannot decide from evidence (a scope question). Ask
  once via AskUserQuestion when the human is present; otherwise label
  `needs-owner` and move on.

## 4. Act (bookkeeping scope — never product code)

- **shipped** → `gh issue close <N> --comment "Shipped: <evidence — file:line /
  PR #x merged as <sha> on <default>>"`. Closing an issue is a bookkeeping act
  under §13's delegated scope; it needs no human gate **because the evidence is
  quoted** — an unevidenced close is a lie the next session builds on.
- **stale** → label `stale`, comment why (what replaced it, or which decision
  doc), do **not** close — the owner decides whether the intent survives.
- **open** → ensure `type/{bug,feature,debt,ops}` and `size/{XS,S,M}` labels;
  add `surface/<name>` and `epic/<id>` when the roadmap names them.
- **needs owner** → label `needs-owner` + one-line question in a comment.
- `--dry-run` prints every intended action and touches nothing.

## 5. Import the detected backlog files (one-time per file; `--from` adds a path)

For each file confirmed in step 1 (plus any `--from`), parse its `- [ ] **Title**
…` blocks (a checkbox line without a bold run: title = the line's first
sentence, ≤80 chars; the surrounding paragraph and any nested bullets are the
body) (title = the bold run, else the first sentence; body = the whole
block; keep the source line number) — for an item-level roadmap, each `R-NN`
entry is a block whose title is its heading and whose status line decides
whether it imports as open or is skipped as already shipped/deferred (a
`SHIPPED` entry with evidence needs no issue; a `DEFERRED` one gets a *closed*
issue linking the decision doc, per §4). For each: skip if an open or closed
issue with the same title exists (`gh issue list --search "in:title <title>"
--state all`); otherwise `gh issue create --title "<title>" --body "<block>\n\n
_Imported from <file>:<line> by /agentic-workflow:groom on <date>_" --label
type/… --label size/…` (infer labels from the section headings and the block's
own words; default `type/debt size/S` and say so). Then run steps 2–4 over the
imported set too. Finally **rewrite the file as a generated view** (step 6) —
it must never be hand-appended again — and tell the owner in the report that
the source file is now generated (deleting it is their call). An item-level
roadmap is not rewritten: report that its items are now in the tracker and
that `docs/product/roadmap.md` (epic view) is where the owner's ranking lives.

**Creating issues is outward-facing.** When the human is present, show the
detected files + counts and ask once before creating (AskUserQuestion, default
yes); a `--dry-run` answers the same question without asking.

## 6. Regenerate the view

If the project keeps `BACKLOG.md` (or `docs/product/backlog.md`), overwrite it:

```
# Backlog — generated view (do not edit; run /agentic-workflow:groom)
_Generated <date> from <tracker>. Roadmap epics: docs/product/roadmap.md._

## Open (<n>) — by size, then updated
- [ ] #N · type/feature · size/S · <title> · <epic if any>
…
## Stale (<n>) — owner decision pending
- [ ] #N · <title> — <why stale>
```

The roadmap (`docs/product/roadmap.md`, from `templates/roadmap.md`) is **not**
touched by grooming: it holds epics, the owner's ranking and pointers — never
per-item status. If the repo has an older item-level roadmap (per-entry status
tables), report that it duplicates the queue and recommend collapsing it to
epics — do not rewrite it unasked.

## Output

Counts: probed · shipped (closed) · stale · re-sized · imported (per source file) · needs owner.
Then the **top 5 open items by leverage/size** with their `/agentic-workflow:mission
"<title> (#N)"` or `/agentic-workflow:fix #N` line — the same shape
`/agentic-workflow:next` recommends from. Under `--dry-run`, the action list
instead of the counts.

Boundaries: bookkeeping only — no product code, no deletions of files, no
closing without quoted evidence, no rewriting the roadmap. Grooming is cheap and
deterministic; if it needs a big model to decide an item, that item is `needs
owner`, not a judgment call.
