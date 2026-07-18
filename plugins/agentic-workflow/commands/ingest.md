---
description: Harvest a reusable first-party artifact into the portfolio commons — copy it into the registry repo, pin provenance, and write its index entry, all as delegable §13 bookkeeping.
argument-hint: [git-url-or-path] [--type code]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

Ingest reusable material into the portfolio **commons** — the one writable,
copy-holding surface of the §13 registry repo (`registry.md`/`precedents.md`
stay pointers; the commons holds *copies* so a reusable exemplar survives
independent of the venture it came from). This is the write side of the
commons; the read side is a consumer picking the single best index match and
copy-adapting it. A later increment can route harvest through the curator
(the role that owns the commons lifecycle); for now this command does the copy
and the index-write itself.

**Type first, per-type placement.** `$ARGUMENTS` is a source (a git URL or a
local path) and an optional `--type` (default `code`). Every artifact lands
under `commons/<type>/<slug>/` — **`code/` is the only type this increment
ingests** — never lumped into one shared templates bucket. The first increment harvests
**own-venture (first-party) material only**: defer third-party code (carry the
`licence` field, but do not ingest unlicensed third-party work — that policy is
a later human call).

## 1. Resolve the registry repo

Read the venture's §10 **Portfolio** profile row for the registry repo path
(e.g. `/Users/baker/Playground/registry`). Confirm the directory exists and is
a git repo (`git -C <registry> rev-parse` via Bash). If §10 has no Portfolio
row, or the path does not resolve, **stop and tell the human** to set it (via
`/agentic-workflow:adopt`, which registers the venture) — do not guess a path.

## 2. Copy the source into the commons

Derive a `<slug>` (kebab-case: venture + what-it-is, e.g. `tend-landing-auth`).
Create `commons/code/<slug>/` in the registry repo and copy the artifact in via
Bash — `git clone` (then strip `.git`, or copy the specific files out) for a
remote URL, `cp -R` for a local path. Copy only the reusable files, not a whole
repo's scaffolding. This is a **copy-and-adapt** exemplar, not a submodule.

## 3. Capture provenance and derive metadata

Record where it came from so the freshness signal can work later: the **source
repo** and the **pinned commit** (`git -C <source> rev-parse HEAD`, or the URL's
resolved SHA). From the copied files, derive the **`stack`** (frameworks/langs
observed) and **`tags`** (searchable capability words). These feed both the
per-entry README and the index entry.

## 4. Write the per-entry README

Write `commons/code/<slug>/README.md`: what the artifact is, why it earns a
place in the commons, and **adaptation notes** — the concrete edits a consumer
must make when they copy it (rename product/copy/routes, remap design tokens,
close any flagged gaps). This is the copy-and-adapt guide, not a changelog.

## 5. Append the index entry

`Edit` `commons/index.md` to append one entry in the fixed §13 schema so a
consumer can choose without opening every artifact:

- **slug** · **path** (`commons/code/<slug>/`) · **type** (`code`)
- **stack** · **tags**
- **provenance** — venture · source repo · **pinned commit**
- **licence** (first-party owner licence; the field stays even when own-venture)
- **why-it's-good** — the taste/quality signal a consumer is matching on
- **reuse-match** — what kind of need this is a strong match for
- **`last-reviewed`** — today's date (the freshness anchor)

`provenance` and `last-reviewed` are load-bearing, not decorative: an entry is
**stale** when it ages past its `last-reviewed` threshold OR its source repo
advances past the pinned commit. Staleness is surfaced for review, never
auto-mutated — so an ingest only ever *writes today's date*, it does not
rewrite older entries.

## 6. Hand off as delegable bookkeeping

Commons writes (the copied artifact + its README + the index entry) are §13
**bookkeeping** — no runtime, no users, fully git-reversible. In the **registry
repo**, open them as a **PR**; merge it only under that repo's recorded
`agent-may-merge (bookkeeping)` delegation, otherwise leave the PR for the
human. **Never push the registry's default branch directly** — the PR preserves
the audit trail. Do NOT commit or merge anything in THIS plugin repo; that is
always the human's.

## Output

One short report: the `<slug>` and its `commons/code/<slug>/` path; the pinned
provenance (source repo + commit); the derived stack/tags; and the index entry
that was appended. State whether the registry PR was merged under a recorded
delegation or is waiting for the human, and name any files a reviewer should
open before it lands.
