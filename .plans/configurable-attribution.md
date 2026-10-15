---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: configurable-attribution — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide. Planned 2026-10-15 on `mission/configurable-attribution` (from
origin/main f2f2edb, plugin v1.61.0)._

Goal: every project sets, in one §10 row, the attribution the workflow adds to
its commits and PRs (`default` = The XYZ Protocol, `none`, or custom text), and
every writer — Claude Code's native setting, the four commands, the commit
hook, `ledger.mjs --commit`, the foreign-runtime commit — follows that row.

Estimate: 1 session — one brief (S1), one one-shot Fable checkpoint, staging
verify (this repo: lint + `--plugin-dir` load), one PR to `main`. No `phases`.
The work is many small, mechanical edits around one new ~150-line tool; the
pre-resolved reads total ~950 lines, inside the 1,500-line budget.

## Tasks

1. **The §10 row and its resolver** — one row is the source of truth; one tool
   reads it and mirrors it into Claude Code's settings.
   - AC-1 `templates/WORKFLOW.md` §10 carries a `| **Attribution** |` row
     (placed directly after **Version pin**) stating: the cell grammar
     `commit: <v> · pr: <v>` where `<v>` is `default` | `none` | a backticked
     custom text (a literal `\n` inside the backticks is a newline); a bare
     `default` or `none` sets both; `default` = `Generated with The XYZ
     Protocol` for both; an absent row or an unfilled `_(…)_` placeholder reads
     as `default`; Claude Code applies it through the project's
     `.claude/settings.json` `attribution` key (written by bootstrap/adopt/sync,
     `none` → empty strings); every other writer (plugin tools, a non-Claude
     runtime) reads the row via `tools/attribution.mjs resolve`. The row stays
     ≤ 900 B and the whole template stays under the 120,000 B lint ceiling.
   - AC-2 New `plugins/agentic-workflow/tools/attribution.mjs` (zero deps,
     Node ≥ 18, importable — no top-level side effects when imported) exports
     `parseAttribution(workflowText)` → `{ commit, pr, source }` (`source`:
     `row` | `absent` | `malformed`; malformed reads as default),
     `resolveAttribution(root)` (reads `<root>/docs/WORKFLOW.md`), and
     `mergeSettings(settingsJson, att)` (sets `attribution.commit` /
     `attribution.pr` only; every other key — including
     `attribution.sessionUrl` — preserved). CLI: `resolve [--json] [--root d]`,
     `apply [--root d]` (creates `.claude/settings.json` if absent; idempotent;
     unparseable existing JSON → exit 2, file byte-identical, never
     clobbered), `check [--root d]` (exit 0 in sync, 1 drift/absent, naming
     which), `import [--root d]` (prints the row cell a project's existing
     `.claude/settings.json` implies: `attribution` present → custom/none;
     legacy `includeCoAuthoredBy: false` → `none`; nothing → `default`).
   - AC-3 Harness cases in `tools/ledger-test.mjs` (a new `attribution`
     section — the existing harness, lint already runs it): parse of each
     value form (default, none, custom with `\n`, bare shorthand, placeholder,
     absent, malformed); `apply` preserves unrelated keys and `sessionUrl`;
     `apply` refuses unparseable JSON byte-identically; `apply` twice is a
     no-op; `import` maps each of the three source shapes.

2. **Every writer reads the row** — no hardcoded trailer anywhere.
   - AC-4 `commands/end.md`, `fix.md`, `pr.md`, `release.md` no longer say
     "Co-Authored-By"; each commit step says "end with the §10 **Attribution**
     commit text (`none` → no attribution line)", and each PR-creating step
     says the body ends with the §10 **Attribution** PR text; `pr.md` step 6
     (commit hygiene) checks the row's commit text instead of the trailer.
     `grep -rn "Co-Authored-By" plugins/` returns nothing.
   - AC-5 The `git/gh guardrails` PreToolUse hook (`hooks/hooks.json`, the
     `*'git commit'*` echo) prints the resolved commit text from the TARGET
     repo's `docs/WORKFLOW.md` (`$D`, already computed by the hook): row
     absent/placeholder → the default text; `none` → "no attribution line (§10
     Attribution: none)"; custom → the custom text (first line is enough).
     POSIX sh, no jq dependency for this part, exit 0 always; every existing
     push/refspec/tag/dirty-tree behaviour unchanged. `tools/hook-test.mjs`
     gains cases: absent, `none`, custom, `cd <dir> && git commit` reads the
     target repo's row, and the same with `bin: { jq: false }`.
   - AC-6 `tools/ledger.mjs` `commit()` appends the resolved commit text as a
     second message paragraph (`git commit -m <msg> -m <text>`) and adds
     nothing when the row says `none`; resolution reads `<cwd>/docs/WORKFLOW.md`.
     `tools/ledger-test.mjs` `--commit` asserts the body (`%b`) for default
     (fixture without WORKFLOW.md), `none`, and custom; the existing subject
     assertion stays.
   - AC-7 Foreign-runtime path: `commands/mission.md` "Foreign runtimes … commit
     its `changed_paths` yourself" line names the §10 Attribution commit text
     (one clause, ≤ 80 B — the file is at 22,681 / 24,000 B). The adapter keeps
     forbidding commits (`run-codex.mjs` RETURN_CONTRACT unchanged; the
     orchestrator's commit is the only commit on that path), and
     `node tools/run-codex-test.mjs` stays green.

3. **Adoption writes and keeps it** — bootstrap, adopt, sync and the ladder.
   - AC-8 `commands/bootstrap.md` step 2 writes the **Attribution** row
     (`node …/attribution.mjs import` → its cell, so an existing native setting
     is adopted, never overwritten) and then runs `attribution.mjs apply`,
     reporting one line ("Commits and PRs credit The XYZ Protocol — set §10
     Attribution to `none` or your own text to change it; takes effect next
     session."). `commands/adopt.md` step 1 adds the row "if absent" the same
     way. `commands/sync.md` step 3.7 **§10 rows** appends a missing
     Attribution row via `import` (never `TBD — confirm`) and runs `apply`
     every sync, so a hand-edited row reaches settings.json; an existing row
     value is never touched. The §10 preserve awk (sync step 2) already keeps
     the row — no change there.
   - AC-9 `tools/conform.mjs` LADDER gains `{ id: 'attribution-settings',
     since: '1.62.0' }`: gap when the §10 row is absent, or when
     `.claude/settings.json` `attribution.commit`/`.pr` differ from the
     resolved row (fs-only, imports `attribution.mjs` guarded like
     `ceremony`); fix text names `/agentic-workflow:sync`. `tools/hook-test.mjs`
     conform-check `conformant` fixture gains the row + a matching
     `.claude/settings.json` (else the conformant case breaks) plus one case
     per gap detail. The `templates/WORKFLOW.md` §2 Conform-check row (line 278)
     names the new ladder item.

4. **Dogfood and release**
   - AC-10 This repo is synced the `/sync` way: `docs/WORKFLOW.md` re-copied
     from the template with §10–§10.2 + Local amendments preserved, stamp
     `v1.62.0`, §10 **Attribution** = `commit: default · pr: default`; a new
     tracked `.claude/settings.json` holds exactly
     `{"attribution":{"commit":"Generated with The XYZ Protocol","pr":"Generated with The XYZ Protocol"}}`
     (`settings.local.json` untouched); `node
     plugins/agentic-workflow/tools/conform.mjs` reports no
     `attribution-settings` gap; `attribution.mjs check` exits 0.
   - AC-11 `plugins/agentic-workflow/.claude-plugin/plugin.json` → `1.62.0`;
     `CHANGELOG.md` `## [1.62.0] — 2026-10-15` entry (Added: the row + tool +
     ladder item; Changed: commands/hook/ledger read the row); the README
     "What an adopted project carries" tree gains a `.claude/settings.json`
     line; `node tools/lint.mjs` clean (it runs every harness) and `claude
     --plugin-dir plugins/agentic-workflow` loads.

## Value sourcing

| AC | Value | Source kind | Where |
|---|---|---|---|
| AC-1, AC-10 | `default` commit text `Generated with The XYZ Protocol` | locked decision | L2 + L3 (Assumed) below, 2026-10-15, owner |
| AC-1, AC-10 | `default` PR text `Generated with The XYZ Protocol` | locked decision | L2 + L3 (Assumed) below, 2026-10-15, owner |
| AC-2, AC-10 | settings key shape `attribution.commit` / `attribution.pr` (strings), `""` hides | locked decision | Verified 2026-10-15 below — Claude Code 2.1.301 settings schema |
| AC-1, AC-2 | custom commit / PR text | input | the project's §10 **Attribution** cell (backticked) |
| AC-1, AC-5, AC-6 | absent row or placeholder → `default` | derivation | `default` is the owner's named default (L2); `parseAttribution` source `absent` |
| AC-2, AC-8 | cell for a project that already set attribution natively | input | existing `.claude/settings.json` `attribution` / `includeCoAuthoredBy` → `attribution.mjs import` |
| AC-5 | hook hint wording | derivation | resolved commit text from `$D/docs/WORKFLOW.md` §10 row |
| AC-9 | ladder `since` = `1.62.0` | locked decision | L1 (release as v1.62.0) |
| AC-11 | version `1.62.0` | locked decision | L1 |

## Locked decisions

- 2026-10-15 (owner, L1 — "yes, start the mission") — one new §10 row
  **Attribution** in `templates/WORKFLOW.md` (values `default` | `none` |
  custom text, separate commit and PR values); `/bootstrap`, `/adopt` and
  `/sync` (incl. the `tools/conform.mjs` structure ladder) write it into the
  project's `.claude/settings.json` `attribution` key (merge, never clobber
  other keys); `end`/`fix`/`pr`/`release` and the commit hook read the row
  instead of hardcoding the trailer; `ledger.mjs --commit` honours the same
  row; the Codex adapter path (`run-codex.mjs` / the orchestrator's
  foreign-runtime commit) follows the same policy; tests in the existing
  harnesses; release v1.62.0 (CHANGELOG + manifest); this repo's own §10 row
  is applied with the default (dogfood).
- 2026-10-15 (owner, L2 — "set the default to The XYZ Protocol") — `default`
  credits **The XYZ Protocol** (it replaces Claude Code's built-in
  Co-Authored-By trailer wherever settings.json is written).
- Assumed 2026-10-15 (L3) — owes the exact default wording; built on commit
  default `Generated with The XYZ Protocol` and PR default `Generated with The
  XYZ Protocol`, plain lines, no invented email address and no URL;
  authorized by the owner via the orchestrator's mission brief. Ratify or
  reverse by editing this line in place to `ratified <date>`.
- Verified 2026-10-15 (planner, evidence not a command lock) — Claude Code
  2.1.301 (the installed binary, `strings` of
  `~/.local/share/claude/versions/2.1.301`) declares `attribution: { commit:
  string? "Attribution text for git commits, including any trailers. Empty
  string hides attribution.", pr: string? "…pull request descriptions. Empty
  string hides attribution.", sessionUrl: boolean? }` and marks
  `includeCoAuthoredBy` "Deprecated: Use attribution instead". The docs site
  fetch returned a JS shell, so the binary is the source. The plugin writes
  `commit` and `pr` only and never touches `sessionUrl`.
- 2026-10-15 (planner, decomposition of L1's Codex clause) — Codex never
  commits (`run-codex.mjs:242`, execpolicy rules); the orchestrator commits a
  codex distillate's `changed_paths` as Claude, so the policy lands on that
  commit line in `mission.md` and on the §10 row text (a Codex top-level
  session reads §10 through AGENTS.md). No adapter code or distillate schema
  change.
- Ceremony (2026-10-15, `tools/ceremony.mjs effective`): this repo's profile is
  `proposed` → every gate `required`: plan-judge, phase-reviewer (Fable — the
  diff touches `hooks.json` and `tools/`, `security-boundary` class in
  `templates/gate-classes.md:32`), staging-verify, chronicler, mission-close.
  counsel / multi-vote-audit fire only from `/counsel` / `/audit` and are not
  planned.

## Risks

- **Claude Code guards writes to `.claude/settings.json`** — a Bash `node
  attribution.mjs apply` may raise a permission prompt. → apply is an explicit,
  reported step in bootstrap/adopt/sync (a human is present); unattended runs
  report "settings not written" instead of failing, and the conform ladder keeps
  naming the drift.
- **Settings take effect next session** — Claude Code reads settings at start.
  → the one-line report says so.
- **The guardrail hook also blocks pushes** — an edit there can break a safety
  check. → only the `git commit` echo changes; every existing guardrail case in
  `hook-test.mjs` must stay green; Fable checkpoint.
- **Byte budgets** — `templates/WORKFLOW.md` 112,701 / 120,000 B (already in
  the 90% warn band), `commands/mission.md` 22,681 / 24,000 B. → row ≤ 900 B,
  mission.md clause ≤ 80 B; lint fails over the ceiling.
- **Conform fixture** — the hook-test `conformant` fixture breaks the moment
  the ladder item exists unless it gains the row + settings file. → in AC-9.
- **Projects that already set `attribution` natively** — a blind write would
  clobber the owner's choice. → `import` adopts it as the row's value first.
- **GitHub co-author display** — the default drops Claude's `Co-Authored-By`
  trailer, so GitHub stops listing Claude as co-author. Owner's call (L2); a
  custom value can keep both.
- **Long lines** — lint's `checkObfuscation` fails any tracked `.mjs` line
  over 1,000 chars; keep test fixtures split.

## Open questions

- L3 default wording is **Assumed**, not blocking — **Recommendation:** ratify
  as written (plain `Generated with The XYZ Protocol` for both); `/settle`
  surfaces it until edited in place.

---
_The `.plans/configurable-attribution.sessions.md` briefs execute these tasks;
`.plans/configurable-attribution.state.md` tracks progress. Resolve every open
question before execution starts._
