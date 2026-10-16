---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: xyz-rebrand — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide. Planned 2026-10-16 on `plan/xyz-rebrand` (HEAD edaf73f; plugin
v1.62.0; no plugin or `tools/` change since the 1.62.0 merge 423e2e8)._

Source records (settled ground): `docs/product/decisions/2026-10-16-xyz-rebrand-brief.md`
(J1–J4, NOT-in-v1, **L1–L5**), `-memos.md` (D1–D6, measured inventory), `-journeys.md`
(states + owner-facing text), `-metrics.md` (baseline + checks C1–C14), `-counsel.md`.

Lines that must keep an old-name token on purpose carry the marker `legacy-name`
(L2) so the migrator and its check leave them alone — the same rule applies to
this trio.

Goal: the plugin is **The XYZ Protocol**, plugin id and command prefix `xyz`
(install `xyz@xyz`, folder `plugins/xyz/`, version 2.0.0); this repo carries
zero live old references outside the line-marked allowlist; `/xyz:sync`
migrates an adopted project's live files; the marketplace's `renames` entry
moves existing installs.

Estimate: **5 sessions** (mode `phases`) — 3 builder briefs + 2 one-shot Fable
checkpoints; correctives are counted when they fire, never pre-booked.

| Phase | Sessions | Why that many |
|---|---|---|
| P1 — migrator + dogfood rename (`xyz` 2.0.0) | S1 + S2 + ckpt-p1 = **3** | S1 builds a new fail-closed tool with ~15 fixture cases (~1,170 read lines). S2 is the sweep of 794 live occurrences in 104 files + `git mv` + read-both + every harness (~1,050 read lines). Together they would be ~2,200 read lines, over the 1,500 budget, and counsel measured overruns on every past mission of 4 or more sessions. So the split is the honest size, not padding. |
| P2 — transition (`renames`) + live checks | S3 + ckpt-p2 = **2** | The scratch-marketplace probe must pass before the `renames` entry is written (L2). J1 and J3 run on scratch copies. Few reads, but every step is a probe. |

The orchestrator's sketch was about 4. The extra session is S1/S2 split by read
budget. Overrun stop: k ≥ 8 (1.5 × 5, rounded up).

## Tasks

1. **The migrator `tools/rename.mjs`** (S1) — one fail-closed tool. `/xyz:sync`,
   the conform ladder and this repo's dogfood all use it.
   - AC-1 New `plugins/agentic-workflow/tools/rename.mjs` (it moves with the
     folder in S2). Zero deps, Node ≥ 18, importable (no top-level side
     effects), filesystem only. CLI: `check [--root d] [--json]` (exit 0 clean,
     1 old names found: lists each file with its count), `apply [--root d]
     [--paths f…] [--home d] [--json]`. It rewrites ONLY this enumerated
     pattern set:
     (a) the old prefix followed by `<name>`, with or without a leading `/`,
     where `<name>` is one of the command, skill or agent names read from the
     plugin root the tool runs from (28 / 2 / 20 today);
     (b) the install id `agentic-workflow@xyz` → `xyz@xyz`; <!-- legacy-name -->
     (c) the Codex rules path `.codex/rules/agentic-workflow.rules`; <!-- legacy-name -->
     (d) the tune banner head `> Tuned from agentic-workflow v`; <!-- legacy-name -->
     (e) `AGENTIC_WORKFLOW_CHILD` / `AGENTIC_WORKFLOW_REGISTRY` → `XYZ_*`; <!-- legacy-name -->
     (f) the cache-path segment `plugins/cache/xyz/agentic-workflow/` → `plugins/cache/xyz/xyz/`. <!-- legacy-name -->
     It never touches a bare `agentic-workflow`, never touches
     `xyzhub/agentic-workflow`, and skips any line containing `legacy-name`.
     The tool's own old-name lines carry that marker.
   - AC-2 Consumer scope (the default when `--paths` is absent):
     - rewritten: `docs/WORKFLOW.md`, `AGENTS.md`, `CLAUDE.md`,
       `.claude/agents/*.md`, `docs/product/engineering/*.md`, active ledgers
       (conform's `activeLedgers()` rule: an open `[ ]`/`[~]` row and no
       `Closed:` stamp) plus their master `.md`, and the open `- [ ]`/`- [~]`
       rows of `.plans/OBLIGATIONS.md` (Q3);
     - the old Codex rules file is replaced: re-copied from the plugin's
       `templates/codex.rules` as `.codex/rules/xyz.rules`, and the old file is
       deleted;
     - never touched: closed ledgers, `*.sessions.md`, `*.artifacts/`,
       `.plans/runs/`, `CHANGELOG.md`, `JOURNEY.md`, `docs/product/decisions/`,
       `decision-log.md`.

     `apply` leaves the working tree uncommitted, never commits, and is
     idempotent.
   - AC-3 Settings files `.claude/settings.json` and `.claude/settings.local.json`
     are parsed as JSON, never text-replaced:
     - an `enabledPlugins` or `pluginConfigs` key under the old id moves to
       `xyz@xyz` and keeps its value (`true` or `false`);
     - when both keys exist, the old key is deleted and the new value kept;
     - it never adds an enable that was not there;
     - `permissions.allow` entries naming the old plugin are **reported**
       (entry + file), never rewritten;
     - an unparseable file is skipped and left byte-identical, with the
       journeys E2 line;
     - the user scope (`<home>/.claude/settings.json`, `--home` for tests) is
       read-only: if the old id is still `true` there, the report names
       `claude plugin uninstall agentic-workflow@xyz` (journeys E1). <!-- legacy-name -->
   - AC-4 Tunes: the banner is rewritten to `> Tuned from xyz v<current>`. The
     `(base sha256:…)` stamp and the version are re-stamped to the current base
     **only** when the old stamp is that agent's entry in a frozen v1.62.0 hash
     table inside the tool. The table has 20 entries: `git show
     423e2e8:plugins/agentic-workflow/agents/<a>.md | shasum -a 256 | cut -c1-12`,
     which is identical to the installed 1.62.0 cache (verified 2026-10-16). Any
     other stamp is left alone and reported as "tune base unknown —
     `/xyz:tune <agent>` drift will show it".
   - AC-5 The report uses the journeys texts verbatim, adapted only where L1
     removed the old plugin:
     - J3 sync report: `-journeys.md` lines 75–92;
     - nothing to migrate: line 67;
     - E2 skip line: line 94.

     A second `apply` prints the nothing-to-migrate line and produces zero diff.
   - AC-6 New harness `tools/rename-test.mjs`, wired into `tools/lint.mjs` as
     `checkRenameHarness`, the same shape as `checkCeremonyHarness`
     (lint.mjs:540). The cases:
     - settings: single key `true`, single key `false`, both keys,
       `pluginConfigs`, a `permissions.allow` entry (reported and unchanged),
       an unparseable file (byte-identical), a user-scope report;
     - tunes: re-stamp on a table hit, untouched on a miss;
     - left alone: closed ledger, `*.sessions.md`, `CHANGELOG.md` and
       `docs/product/decisions/` stay hash-equal; `xyzhub/agentic-workflow`;
       a `legacy-name` line; the old prefix with a name that is not installed;
     - Codex rules: re-copied as `xyz.rules` and the old file removed;
     - idempotence: the second run has zero diff;
     - `check` exit codes.

2. **Ladder + sync step** (S1) — the new plugin's session-start check tells an
   old-named project to migrate (J4 as adapted by L1).
   - AC-7 `tools/conform.mjs` LADDER gains `{ id: 'plugin-renamed', since:
     '2.0.0' }`:
     - it calls `rename.mjs` `check` through a guarded import, like
       `attribution`;
     - detail: the count of old names and the files they are in;
     - fix: `run /xyz:sync — it renames the old command names in this
       project's live files (history is left alone)`.

     `tools/hook-test.mjs` conform-check cases:
     - an AGENTS.md naming an old-prefix command gives an advisory containing
       `plugin-renamed` and `/xyz:sync`. This is the adapted C14;
     - the `conformant` fixture stays silent;
     - `templates/WORKFLOW.md` §2 Conform-check row names the new item.
   - AC-8 `commands/sync.md` step 3.7 gains a **Plugin rename** bullet first in
     the list. It runs `node ${CLAUDE_PLUGIN_ROOT}/tools/rename.mjs apply` and
     pastes its report verbatim. The file stays under the 24,000 B command
     ceiling (11,478 B today).

3. **Dogfood rename of this repo** (S2) — the J2 sweep is the migrator's first
   real run.
   - AC-9 Read-both where old data outlives the code (D4-B). Every old-name
     line added here carries `legacy-name`:
     - `agents.mjs` `BANNER_RE` / `PRESET_RE` / `bodyMinusBanner` accept both
       banner forms;
     - the `run-codex.mjs:203` skill-prefix gate accepts `xyz` and the old
       prefix, and rejects anything else;
     - `operate-triage.mjs` state path: `~/.local/state/xyz/<slug>/` with a
       read fallback to the old dir (it writes the new one);
     - `commands/ingest.md` registry: `~/.config/xyz/registry`, falling back
       to the old dir (which exists on this Mac, fact 2026-10-16), then
       `$XYZ_REGISTRY`, then the old env var;
     - every hook child silencer reads `XYZ_CHILD`, falling back to the legacy
       var (L2 condition 2). Inline `hooks.json` commands carry the marker as a
       no-op `: legacy-name;`;
     - `run-claude.mjs` sets **both** vars.

     Harness cases: `agents-test` (both banners), `run-codex-test` (both
     prefixes accepted, a third rejected), `hook-test` child silencer (either
     var set → silent), `run-claude-test` (both set), operate-triage selftest
     (fallback read).
   - AC-10 Names and paths:
     - `git mv plugins/agentic-workflow plugins/xyz` and
       `git mv .codex/rules/{agentic-workflow,xyz}.rules`;
     - `plugin.json`: `name: xyz`, `displayName: "The XYZ Protocol"`,
       `version: 2.0.0`, description `An agentic workflow from idea to viable
       product: …` (D5);
     - `marketplace.json` `plugins[0]`: `name: xyz`, `source: ./plugins/xyz`.
       There is **no** `renames` entry yet: that is S3, after the probe;
     - every `PLUGIN =` constant (7 harnesses + `evals/run.mjs`), the lint
       import of `shell-wrappers.mjs`, and both eval `setup.sh` paths.
   - AC-11 Every live reference is rewritten:
     - first `rename.mjs apply --paths <every tracked LIVE file>`;
     - then hand edits for the rest: bare ids, the XDG paths, the lint
       `commandMention` regex and message → `xyz:`, `tune.md`'s banner write
       form, `templates/codex.rules` header, and D5 prose (51 title-case
       occurrences);
     - README H1 `# The XYZ Protocol — Claude Code plugin marketplace` and the
       journeys line 16 install line; `templates/WORKFLOW.md` H1 `# The XYZ
       Protocol — one agentic protocol from idea to viable product`;
       mid-sentence "the XYZ Protocol";
     - hook messages say `/xyz:<cmd>`, with **no** new `xyz:` message prefix
       (L2);
     - `xyzhub/agentic-workflow` stays (L3).
   - AC-12 The J2 guard is permanent: `tools/lint.mjs` gains `checkLegacyName`.
     It fails:
     - any line of a tracked file under LIVE = `plugins tools .github
       .claude-plugin .claude .codex README.md AGENTS.md CLAUDE.md
       docs/WORKFLOW.md evals` that still matches
       `agentic-workflow|AGENTIC_WORKFLOW|Agentic Workflow` after
       `xyzhub/agentic-workflow` is stripped, unless the line contains
       `legacy-name`;
     - any tracked LIVE path containing `agentic-workflow`.

     `tools/lint-test.mjs` gains cases: a hit fails, the slug passes, a marked
     line passes, an old-named path fails. This is C1 + C2 adapted: the
     allowlist is the line marker plus the slug, with no allowlist file (L2
     overrides the metrics' `rebrand-allowlist.txt`). The `Agentic Workflow`
     term stays **case-sensitive** (planner, 2026-10-16). D5 keeps the
     lowercase descriptor "an agentic workflow" (the `plugin.json`
     description, `keywords: agentic`), so a case-insensitive match would fail
     on intended prose. The known residue is lowercase "agentic workflow" used
     as a descriptor, and it is allowed.
   - AC-13 This repo is synced the `/sync` way:
     - `docs/WORKFLOW.md` is re-copied from the renamed template, with §10,
       §10.1, §10.2 and Local amendments preserved and stamp `v2.0.0`;
     - the §10 **Version pin** and **High-impact files** rows name
       `plugins/xyz/…`;
     - `node plugins/xyz/tools/conform.mjs` reports no gaps;
     - `node plugins/xyz/tools/rename.mjs check --root .` exits 0 once the
       orchestrator's ledger step runs (Q3);
     - `.claude/settings.json` is unchanged (it has no `enabledPlugins`), and
       there are no tunes (`.claude/agents/` is absent).
   - AC-14 docs/product living docs: the launch kit, `roadmap.md`,
     `north-star.md`, `overview.html` and `engineering/` get the new install
     id, prefix and product name (D4 row 18, scoped per Q2).
     `docs/product/features/`, `session-handoff.md`, `decisions/`, `JOURNEY.md`
     and `decision-log.md` stay history.
   - AC-15 Every suite is green:
     - `node tools/lint.mjs` is clean. It runs hook, lint, marker, ledger,
       ceremony, agents, run-codex, run-claude and rename harnesses, plus the
       context-attrib, catalog, ci-wait, publish-gate and operate-triage
       selftests;
     - `claude plugin validate ./plugins/xyz` exits 0 (C4);
     - commands / skills / agents still count **28 / 2 / 20** (the baseline
       measured 2026-10-16);
     - `claude --plugin-dir ./plugins/xyz` loads;
     - history is untouched: `git diff main -U0 -- CHANGELOG.md .plans
       docs/product/decisions docs/product/JOURNEY.md
       docs/product/decision-log.md | grep '^-[^-]'` prints nothing.
   - AC-16 `CHANGELOG.md` gets `## [2.0.0] — <date>`: "Rename only; the
     protocol is unchanged." Changed: name, prefix, folder, env vars, rules
     file, state paths. Added: `rename.mjs`, the `plugin-renamed` ladder item,
     the lint guard. Migration: a pointer to the README section that S3 writes.
   - AC-17 The Missions change list is
     `docs/product/decisions/2026-10-16-xyz-rebrand-missions-change-list.md`
     (read-only on `/Users/baker/Playground/missions-app`).
     - Baseline, measured 2026-10-16: 579 occurrences in 98 tracked files
       outside `vendor/`, 30 of them source files.
     - Each coupling class with its files: plugin cache path, install id,
       subagent and skill prefix parsing, the child env var, the
       `vendor/agentic-workflow` dir and `scripts/verify-vendor.mjs`, the tune
       banner reader, UI strings, fixtures, and
       `apps/desktop/electron-builder.config.cjs`.
     - Ordering: before the owner installs `xyz` on the Mac Missions runs on
       (counsel: Missions breaks on move day).
     - How Missions proves the move: `pnpm test` and `verify-vendor`.

4. **Transition + live checks** (S3) — the `renames` entry moves existing
   installs; fresh and migrated installs are proven on scratch copies.
   - AC-18 Scratch-marketplace probe, in an isolated Claude config dir, never
     the owner's real config:
     1. Add a local marketplace that serves the v1.62.0 tree (`git worktree`
        of `main`). Install the old plugin, which leaves the old id enabled in
        the scratch user settings and in a scratch project's
        `.claude/settings.json`.
     2. Switch the marketplace to the branch tree plus `"renames":
        {"agentic-workflow": "xyz"}` and run marketplace update.
     3. Pass: `enabledPlugins` now holds `xyz@xyz` in both scopes, and the old
        key is gone; `claude plugin list` shows the rename; `claude plugin
        install xyz@xyz` succeeds. This is C13 adapted to L1.

     A failure is a `deviation` stop. The marketplace change does not ship, and
     the owner picks D2-B or D2-C (memo D2).
   - AC-19 Only after AC-18 passes, `.claude-plugin/marketplace.json` gains the
     top-level `"renames": {"agentic-workflow": "xyz"}` and lists only `xyz`;
     `claude plugin validate .` exits 0.
   - AC-20 J1, a fresh install from the scratch marketplace (branch tree) in a
     clean config:
     - `claude plugin list` names `xyz`;
     - a `claude -p` slash-command listing shows 28 `/xyz:*` commands and the
       2 skills, with no old-prefix row (C5);
     - `node tools/hook-test.mjs` is green (C6);
     - in a scratch repo on `main`, the on-main warning hook prints (the hook
       fires).
   - AC-21 J3, on a scratch `git clone` of `/Users/baker/Playground/missions-app`
     (an adopted project at stamp v1.54.0, tracked files only, never the real
     repo). It is seeded with a project `.claude/settings.json` that enables the
     old id and one stamped tune. The checks:
     - `conform.mjs --brief` names `plugin-renamed` and `/xyz:sync` (C14
       adapted);
     - `rename.mjs apply`: C8 (no old names in live files), C9
       (`enabledPlugins` is `xyz@xyz` only), C10 (history hash identical), C11
       (no `plugin-renamed` gap), C12 (a second run has zero diff and prints
       the nothing-to-migrate line).

     One `claude --plugin-dir ./plugins/xyz -p "/xyz:sync"` run in the copy is
     attempted and its outcome recorded, best effort. The real-project J3 is
     the Orderly Closing row.
   - AC-22 Owner release notes. The README gets a section "Moving from
     agentic-workflow" in plain language (plain-report skill):
     1. run `/plugin marketplace update xyz` and see Claude Code's `Renamed to
        "xyz"`;
     2. run `/plugin install xyz@xyz` once per machine;
     3. in each project, start a session; the start-up check says to run
        `/xyz:sync`; run it, then review with `git diff` and commit;
     4. if both plugins show up, run the uninstall line.

     The CHANGELOG 2.0.0 Migration line links to it. README lines that must
     name the old id (the heading, the uninstall line) carry an HTML-comment
     `legacy-name` marker, so AC-12 still passes.

## Value sourcing

| AC | Value | Source kind | Where |
|---|---|---|---|
| AC-1, AC-10, AC-11 | plugin id and prefix `xyz`, install id `xyz@xyz` | locked decision | L2, 2026-10-16 — brief; memo D4 "Values this decision settles" |
| AC-9, AC-11 | `XYZ_CHILD`, `XYZ_REGISTRY`, `.codex/rules/xyz.rules`, `> Tuned from xyz v`, `~/.config/xyz/`, `~/.local/state/xyz/` | locked decision | L2 → memo D4 (`-memos.md` 126–131) |
| AC-9 | `$TMPDIR` marker names unchanged | locked decision | L2 → memo D4 row 12 |
| AC-1, AC-11, AC-12 | `xyzhub/agentic-workflow` slug kept, exempt from the guard | locked decision | L3, 2026-10-16 |
| AC-10 | source dir `plugins/xyz/`, marketplace `source` `./plugins/xyz` | locked decision | L2 → memo D1 (`-memos.md` 183–184) |
| AC-7, AC-8, AC-1–AC-4 | ladder id `plugin-renamed` since `2.0.0`; the pattern set; live and history scopes; the settings rule (move key, keep value, never add); the re-stamp rule (exact v1.62.0 hit only) | locked decision | L2 → memo D3 (`-memos.md` 393–398) |
| AC-3 | `pluginConfigs` rewritten; `permissions.allow` reported only | locked decision | L2 (counsel technical condition 3) |
| AC-4 | the frozen v1.62.0 base-hash table | derivation | `shasum -a 256` of each `agents/*.md` at 423e2e8 (equal to the installed cache, checked 2026-10-16) |
| AC-10, AC-11 | `displayName` "The XYZ Protocol"; the README and WORKFLOW H1 strings; "the protocol" as the short form | locked decision | L2 → memo D5 (`-memos.md` 451–453) |
| AC-10, AC-16 | version `2.0.0` | locked decision | L2 → memo D6 (`-memos.md` 487) — no `agentic-workflow` 1.63.0 (L1 drops the frozen build) |
| AC-19 | `"renames": {"agentic-workflow": "xyz"}` | locked decision | L1 → memo D2-A (`-memos.md` 213–216) |
| AC-5 | sync report, nothing-to-migrate line, E2 skip line | derivation | `-journeys.md` 75–92, 67, 94 (verbatim; the old-plugin-notice lines are dropped per L1) |
| AC-7 | conform fix text | derivation | the journeys J3 trigger + the D3 bootstrapping answer (`-memos.md` 316–324) |
| AC-12 | marker token `legacy-name` | locked decision | L2 (line-level markers) |
| AC-12 | `checkLegacyName` regex and the LIVE path list | derivation | `-metrics.md` 35–36 (LIVE set + C1 grep), narrowed by L2/L3 (marker + slug strip). Title case only, see AC-12 |
| AC-16 | CHANGELOG line "Rename only; the protocol is unchanged." | derivation | planner, from L2 → memo D6's counter (`-memos.md` 481–485) |
| AC-22 | README move-section copy | derivation | `-journeys.md` 107–115, adapted by L1: the uninstall-first order is dropped, `/plugin marketplace update xyz` and Claude Code's rename line are added, and the uninstall line is kept only for the both-installed case |
| AC-15, AC-20 | command / skill / agent counts 28 / 2 / 20 | derivation | `ls plugins/agentic-workflow/{commands,skills,agents} \| wc -l`, 2026-10-16 (the journeys' "27" is stale) |
| AC-17 | Missions coupling counts (579 / 98 / 30) | derivation | `git grep` in missions-app outside `vendor/`, 2026-10-16 |
| AC-14 | which docs/product files are living | open question | Q2 |
| AC-2 | `OBLIGATIONS.md` open rows in scope | open question | Q3 |

## Locked decisions

- 2026-10-16 (owner, **L1** Old installs — "Yes, all mine"):
  - every install is on an owner-controlled machine, so the plan uses
    Claude Code's native `renames` marketplace entry (memo D2-A);
  - no frozen old build, and no session-start notice from the old plugin;
  - J4 becomes: after `renames` moves the setting, the owner reinstalls once
    per machine and the new plugin's conform check tells the project to run
    `/xyz:sync`;
  - the frozen-build design stays in the memo as the fallback.
- 2026-10-16 (owner, **L2** Scope — "Full rename to xyz"):
  - D1 (`plugins/xyz/`), D3 (the migrator in `/xyz:sync`), D4-B (every
    identifier renamed, read-both where data outlives code), D5 (The XYZ
    Protocol), D6 (2.0.0);
  - new hooks read `XYZ_CHILD || AGENTIC_WORKFLOW_CHILD`; <!-- legacy-name -->
  - `rename.mjs` rewrites `enabledPlugins` + `pluginConfigs` and reports,
    never rewrites, `permissions.allow`;
  - line-level `legacy-name` markers;
  - no new `xyz:` hook-message prefix;
  - the Missions change list is a P1 deliverable;
  - one scratch-marketplace probe proves that `renames` validates and moves
    the setting before the marketplace change ships.
- 2026-10-16 (owner, **L3** Repo name — "Keep it out, note it"):
  `xyzhub/agentic-workflow` keeps its name. The rename is knowingly partial;
  the slug is exempt from the J2 guard.
- 2026-10-16 (owner, **L4** Timing — "Queue behind current goal item"):
  - normal queue, careful posture: Fable plan-judge and checkpoints, human
    merges to `main`;
  - the current goal item is goal-statement **E2 — Interactive and
    structured owner surfaces** (`2026-10-12-goal-statement.md` §"Workstreams,
    in execution order"; E0 operate-triage closed 2026-10-13, E1
    adaptive-ceremony closed 2026-10-15). This mission starts after E2
    closes;
  - the Orderly and Missions moves are Closing rows with estimates.
- 2026-10-16 (owner, **L5**): superseded by L1. There is no old-plugin notice.
- 2026-10-16 (planner, decomposition): **one branch `mission/xyz-rebrand`**
  carries both phases, cut from `plan/xyz-rebrand`, which carries these
  records. Each phase ends in its own one-shot Fable checkpoint. The feature
  PR to `main` is marked ready after ckpt-p2, and there is **one** feature PR
  plus one `chore/xyz-rebrand-bookkeeping` PR (pr-economy).
  - Why: a `main` carrying P1 alone would list `xyz` with no `renames`, and
    every installed old id would lose its marketplace entry (the spirit of
    counsel condition 1: never a `main` with no path for old installs).
  - The owner confirms this as Q1.
- 2026-10-16 (planner): the J2 allowlist is the `legacy-name` line marker plus
  the stripped slug, enforced by a permanent lint check (AC-12). The metrics'
  `tools/rebrand-allowlist.txt` is not created: L2's line-level rule supersedes
  that file-level list.
- 2026-10-16 (planner): the "open ledger" rule for J3 is conform's existing
  `activeLedgers()` (`conform.mjs:54-62`: an open `[ ]`/`[~]` row and no
  `Closed:` stamp). This settles the metrics' C8 "unknown".
- 2026-10-16 (planner): the J3 scratch project is a `git clone` of missions-app
  (adopted, on this Mac). Orderly is not on this Mac (no checkout found under
  `~/Playground`), so the live Orderly J3 is a post-merge Closing row.
- Ceremony (2026-10-16, `ceremony.mjs effective`, plugin 1.62.0): this repo's
  profile is `proposed`, so every gate is `required`: plan-judge,
  phase-reviewer, staging-verify, chronicler, mission-close and counsel
  (counsel already ran). Both checkpoints run on **Fable**: the diff touches
  `hooks.json`, `tools/`, `templates/codex.rules` and `templates/`, which is
  boundary-class (`security-boundary`, `templates/gate-classes.md`).
- Verified 2026-10-15 (evidence, not a command lock): `claude plugin validate`
  on the plugin dir passed in configurable-attribution S1
  (`.plans/configurable-attribution.state.md` handoff, "plugin validate
  passed"). The same form against `./plugins/xyz` is expected to hold.
- Assumed 2026-10-16 — the probe mechanics: an isolated config dir via
  `CLAUDE_CONFIG_DIR=<scratch>` (fallback `HOME=<scratch>`), a local-directory
  marketplace (`claude plugin marketplace add <dir>`), and `claude plugin
  validate .` accepting a top-level `renames` map. None of these invocations
  has run end to end. S3 runs each one first and records its exact transcript
  line; a failure is a `deviation` stop, not an improvisation. Authorized by
  the planner per #130; ratify by S3's evidence.

## Risks

- **A missed `PLUGIN =` constant makes a harness test nothing** (memo D1).
  → AC-15 counts each harness's cases before and after (S2 records both); lint
  fails on a missing runner.
- **The `renames` behaviour is documented, not probed** (F4: "not cached"
  until install; local vs git-hosted may differ). → AC-18 runs before AC-19; a
  failure stops the marketplace change, and the owner picks D2-B or D2-C.
- **The probe touches real config.** → An isolated config dir only. The
  owner's `~/.claude/settings.json` is never written, and S3 checks its
  enabledPlugins block is byte-identical before and after.
- **Missions breaks on move day** (counsel). → AC-17 lands in P1. The
  live-verify-after-reinstall row runs only after the owner has the change
  list, and the Missions row says "before installing `xyz` on that Mac".
- **Byte ceilings** (`templates/WORKFLOW.md` 113,392 / 120,000 B). → The rename
  shrinks every mention (`xyz:` is 13 B shorter), and the new text is the sync
  bullet plus one conform row (each under 400 B).
- **History edits by accident** (the sweep is broad). → `--paths` takes only
  LIVE files, and AC-15's history-diff check runs at S2 and at both
  checkpoints.
- **This trio itself is an active ledger** while the mission runs. → Its
  literal old tokens carry `legacy-name`. Builders never edit `.plans/`, so the
  orchestrator runs `rename.mjs apply` for `.plans` after S2 (Q3) and logs it.
- **Lint's long-line guard** (`checkObfuscation`, over 1,000 chars per `.mjs`
  line). → Keep the hash table and fixtures one entry per line.

## Open questions

(none — all three were settled 2026-10-16. The plan-judge (Fable) ruled that
none is an owner call; they are recorded below under Settled.)

### Settled 2026-10-16 (plan-judge APPROVE, coordinator)

- **Q1 — one feature PR after ckpt-p2.** Planner decision (memo F4 +
  pr-economy). A P1-only `main` would list `xyz` with no `renames` path for
  installed old ids.
- **Q2 — AC-14 scope.** Rewrite the living docs/product files: `launch/`,
  `roadmap.md`, `north-star.md`, `overview.html`, `engineering/` (memo D4 row
  18). `features/*/idea.md`, `session-handoff.md`, `decisions/`, `JOURNEY.md`
  and `decision-log.md` stay history. AC-15's history-diff check covers
  `decisions/`, `JOURNEY.md`, `decision-log.md`, `CHANGELOG.md` and `.plans/`.
- **Q3 — stale active ledger + open obligations.**
  - The orchestrator stamps `Closed: 2026-08-03` (PR #31 merge, 2c8487f) on
    `.plans/context-economy.state.md` before S2. Verified: lint stays clean,
    because that ledger has no `## Closing` block, so `checkClosing`'s close
    refusal cannot fire.
  - `rename.mjs` rewrites command mentions on open `.plans/OBLIGATIONS.md`
    rows only.
  - After S2, the orchestrator runs `rename.mjs apply` on `.plans/`, logged
    as a ledger deviation.

---
_The `.plans/xyz-rebrand.sessions.md` briefs execute these tasks;
`.plans/xyz-rebrand.state.md` tracks progress. Resolve every open question
before execution starts._
