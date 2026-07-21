---
description: Harvest a reusable first-party artifact into the portfolio commons — copy it into the registry repo, pin provenance, and write its index entry, all as delegable §13 bookkeeping.
argument-hint: [git-url-or-path] [--type code] [--refresh] [--registry <path|remote>]
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
local path), an optional `--type` (default `code`), an optional
`--registry <path|remote>` (step 1), and an optional `--refresh` (step 2). Every artifact lands
under `commons/<type>/<slug>/` — **`code/` is the only type this increment
ingests** — never lumped into one shared templates bucket. The first increment harvests
**own-venture (first-party) material only**: defer third-party code (carry the
`licence` field, but do not ingest unlicensed third-party work — that policy is
a later human call).

## 1. Resolve the target registry (first hit wins)

The commons is a **portfolio-level** resource, so ingest need not run inside an
adopted venture. Resolve the registry repo in this order — first hit wins:

1. **`--registry <path|remote>`** if passed — the explicit override; works from
   anywhere.
2. **The current directory is itself a registry repo** — a `registry.md` at the
   repo root (the §13 registry marker, the same signal `/agentic-workflow:operate`
   detects). Ingest into the local commons.
3. **The current venture's §10 Portfolio row** — a registry path/remote recorded
   there (the in-adopted-project path).
4. **A portfolio-global default** — a one-line path or remote in
   `~/.config/agentic-workflow/registry`, else the `$AGENTIC_WORKFLOW_REGISTRY`
   env var. This lets a bare `/agentic-workflow:ingest <source>` work anywhere
   once set.

If none resolve, **stop** and tell the human to pass `--registry <path|remote>`
or set the global default — do not guess a path. Confirm the resolved registry
is a git repo (`git -C <registry> rev-parse` via Bash); if it is a remote not
present locally, clone it to a working checkout first (never push its default
branch — step 6). When the registry resolved from `--registry` or §10 and no
global default file exists yet, **offer to save it** to
`~/.config/agentic-workflow/registry` so future ingests need no flag.

## 2. Derive the slug, then validate and guard collisions

Derive a `<slug>` (kebab-case: venture + what-it-is, e.g. `tend-landing-auth`).

**Validate the slug before it touches the filesystem.** It MUST match
`^[a-z0-9-]+$` (lowercase letters, digits, hyphens only). Reject anything else —
a slash, `..`, whitespace, or a shell metacharacter — and **stop**: the slug flows
straight into `mkdir`/`cp`/`git clone` paths, so an unvalidated slug is a path-
traversal / injection hole. Never sanitize-and-continue; a malformed slug is a
caller error to surface, not to silently rewrite.

**Guard collisions before writing.** Check whether `commons/code/<slug>/` already
exists OR `commons/index.md` already has an entry for that slug:

- **No collision** → proceed with a fresh harvest (step 2b).
- **Collision without `--refresh`** → **stop** and report the existing entry.
  Do NOT overwrite the directory and do NOT append a second index row — a
  duplicate slug corrupts the single-best-match (k=1) broker surface the commons
  depends on. Tell the caller to pass `--refresh` if an update is intended.
- **Collision with `--refresh`** → **update in place**: refresh the existing
  `commons/code/<slug>/` from source, re-pin provenance, and rewrite that one
  index entry (bumping `last-reviewed`) — never create a second directory or a
  second row. This refresh-on-source-advance path is curator-owned de-stale
  semantics (see the `curator` agent); `/agentic-workflow:ingest` is the mechanism.

**2b — copy the source in.** Create (or, under `--refresh`, reuse)
`commons/code/<slug>/` in the registry repo and copy the artifact in via Bash —
`git clone` (then strip `.git`, or copy the specific files out) for a remote URL,
`cp -R` for a local path. Copy only the reusable files, not a whole repo's
scaffolding. This is a **copy-and-adapt** exemplar, not a submodule.

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
auto-mutated — a fresh ingest only ever *writes today's date* for its own new
entry and never touches another entry; a deliberate `--refresh` (step 2)
re-dates exactly the one entry it re-harvests, nothing else.

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
