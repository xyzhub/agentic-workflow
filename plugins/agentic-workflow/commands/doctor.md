---
description: Diagnose the workflow machinery — environment tools (codegraph, ripgrep, jq, gh), §10 profile truthfulness, record artifacts, orphaned ledgers, protocol version. `fix` mode also installs missing dev tools and repairs provably-wrong profile rows.
argument-hint: [fix]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, WebFetch]
---

Diagnose whether the workflow MACHINERY works in this project — complementing
`/check-workflow` (how is the work?) and `/next` (what do I do?). Default is
read-only diagnosis; `fix` also repairs what's mechanical, local, and free.
Report a 🟢/🟡/🔴 table; every red/yellow row carries exactly ONE fix (a
command, or "run `/doctor fix`").

## 1. Environment tools

- **git** — repo present; a remote configured (none is 🟡 at V0–V2, 🔴 later).
- **gh** — installed and authenticated (PR flow depends on it).
- **jq** — the guardrail hooks parse tool input with it (they degrade to
  raw-JSON matching without it).
- **ripgrep (`rg`)** — Bash-side searches (index fallbacks, scripts) should
  prefer it over grep; the harness's Grep tool already uses it internally.
- **Code index (codegraph)** — three levels: binary on PATH → index built
  (`.codegraph/` exists and non-stale) → recorded in §10 with a query method.
  Missing on a non-trivial repo is 🟡 (DX pillar: the repo legible to models).
- **Stack toolchain** — whatever §10's gates need (node/pnpm, cargo, etc.)
  actually on PATH.

## 2. Profile truthfulness (§10 rows must RESOLVE, not just exist)

The profile is load-bearing and written once — verify it still tells the truth:

- Gate commands exist in the package scripts (or stack equivalent); optionally
  run the fast ones to prove green. A renamed test script is exactly the rot
  this check exists for.
- Seed/reset path exists; deploy config file present; code-index CLI answers
  a version/status call; high-impact files exist at their recorded paths.
- Default branch row matches `git symbolic-ref`; Merge policy holds a valid
  value (`human-only` / `agent-may-merge (delegated <date>)`).
- Any `TBD — confirm` leftovers → 🟡 with the row named.

## 3. Records & plans

- CHANGELOG.md, docs/product/JOURNEY.md, docs/product/overview.html present;
  the status page has an `artifact-url` recorded.
- JOURNEY silent while `git log` shows heavy recent activity → 🟡 (the record
  is falling behind; spawnless fix: run `/end-work` properly next session).
- Orphaned ledgers: `.plans/*.state.md` referencing branches that no longer
  exist → recommend `/mission "<name>" replan`.
- Protocol stamp older than the installed plugin → recommend `/upgrade-workflow`.

## 4. `fix` mode (explicit opt-in — mechanical, local, free repairs only)

- **Install missing dev tools** via the platform's package manager (brew/apt/
  winget…) or the tool's documented installer — WebFetch the tool's README if
  the install command isn't obvious; never guess a curl-pipe from memory.
  Ripgrep and jq are one-liners; **codegraph**: install, then build the index
  (`codegraph init -i`), then update the §10 **Code index** row with the
  verified query method.
- **Correct provably-wrong §10 rows** with the verified value (e.g. the
  renamed test script) — edits stay uncommitted for HITL review.
- **Never**: paid services or anything credentialed (§11 spending boundary),
  system config beyond dev tools, engineering gaps (missing CI, no tests —
  those are `/mission` work), or force-anything. Not sure it's safe → report
  instead of fixing.
- Re-run the failed checks after fixing; report before → after per row.

## Output

The 🟢/🟡/🔴 table, fixes applied (in `fix` mode) with before/after, and the
single best next command. If everything is green, say so in one line and stop.
