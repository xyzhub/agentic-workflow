---
description: Groom the queue — probe every open issue against the tree, close what shipped (with evidence), flag what went stale, re-size the rest, and regenerate the backlog view; --from imports a markdown backlog into the tracker once.
argument-hint: '[--from <BACKLOG.md>] [--dry-run] [label:<type/…|size/…|epic/…>]'
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
No tracker recorded → say so and offer to record one (`gh` is the default when
the remote is GitHub); with `--from` you may still import into it. With no
tracker at all, groom the markdown backlog **in place** (mark rows, never
delete) and recommend adopting one.

## 1. Inventory

Read the open queue: `gh issue list --state open --limit 500 --json
number,title,labels,body,updatedAt` (or the tracker's equivalent). Filter by the
optional `label:` argument. Note items missing the queue labels (`type/*`,
`size/*`) — they get labels in step 4.

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

## 5. `--from <file>` — one-time import of a markdown backlog

Parse the file's `- [ ] **Title** …` blocks (title = the bold run; body = the
whole block; keep the source line number). For each: skip if an open or closed
issue with the same title exists (`gh issue list --search "in:title <title>"
--state all`); otherwise `gh issue create --title "<title>" --body "<block>\n\n
_Imported from <file>:<line> by /agentic-workflow:groom on <date>_" --label
type/… --label size/…` (infer labels from the section headings and the block's
own words; default `type/debt size/S` and say so). Then run steps 2–4 over the
imported set too. Finally **rewrite the file as a generated view** (step 6) —
it must never be hand-appended again — and tell the owner in the report that
the source file is now generated (deleting it is their call).

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

Counts: probed · shipped (closed) · stale · re-sized · imported · needs owner.
Then the **top 5 open items by leverage/size** with their `/agentic-workflow:mission
"<title> (#N)"` or `/agentic-workflow:fix #N` line — the same shape
`/agentic-workflow:next` recommends from. Under `--dry-run`, the action list
instead of the counts.

Boundaries: bookkeeping only — no product code, no deletions of files, no
closing without quoted evidence, no rewriting the roadmap. Grooming is cheap and
deterministic; if it needs a big model to decide an item, that item is `needs
owner`, not a judgment call.
