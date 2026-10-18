# Changelog

All notable changes to the Agentic Workflow plugin marketplace are recorded
here, in [Keep a Changelog](https://keepachangelog.com/) format. This repo
has no tags — each version-stamped commit on `main` IS the release.

## [Unreleased]

_(empty)_

## [1.64.0] — 2026-10-18
### Added — `isolated` tune preset: every agent as a child `claude -p`
- **`/agentic-workflow:tune preset isolated`** — all 20 agents keep their
  `balanced` model and effort but run through `tools/run-claude.mjs` as a child
  `claude -p` (rows: `runtime: claude-p`, `compact_window` 200000, `maxTurns`
  40–150 by class, scoped `allowed_tools`, fallback = same model in-session).
  Use: spend `claude -p`-only credit (API / Agent SDK) instead of the
  subscription. Scoped Bash only (git read commands, gh view/list, and the
  `test`/`run` verbs of npm, pnpm, bun and yarn); `npx`, `bunx`, `make`,
  `node` and `python` run arbitrary code, so they are left out — widen a role with
  `tune <agent> tools`.
- **`tools/headless.mjs`** — the orchestrator side. `chat` resumes your last
  interactive session (newest transcript whose first entrypoint is `cli`, so
  agent children are never picked) as a `claude -p --resume` prompt loop;
  `run <mission>` drives fresh `claude -p` mission ticks until the ledger is
  Closed, a tick makes no progress (owner wait → exit 3) or `--ticks`;
  `setup [--shell-alias]` writes `.claude/headless.json` (permission mode
  `auto` by default, never bypass) and an idempotent `ccp` zsh function.
  `tune preset isolated` runs setup automatically and offers the alias.
- **`tools/ask.mjs` — the owner-question page** (lean E2a slice). A headless
  orchestrator gets an appended instruction instead of AskUserQuestion:
  `ask.mjs ask --headline … --option "Label::meaning" …` writes an `asked`
  event to `.plans/questions.jsonl` (E2a's log and id/option formats, a field
  subset; E2a's `state.mjs` supersedes it). `headless.mjs run` then opens a
  local page (127.0.0.1, per-run token, loopback Host check, no-store, CSP),
  waits until every question is answered (buttons or ≤280-char "something
  else"), and continues the mission. Also `answer`, `pending`, `serve`, `wait`
  verbs; port 4747 falls back to a free port.
- Lint: `isolated` joins the preset list; every `claude-p` row (not only
  Haiku) must carry maxTurns, read_budget, compact_window, scoped
  allowed_tools and a fallback.

## [1.63.0] — 2026-10-18
### Added — OpenCode V2 packaging: one directory, two runtimes
- **`plugins/agentic-workflow/` is now also an OpenCode V2 plugin** —
  `package.json` + root `index.js` (OpenCode loads a local package directory
  from its root `index.js`, not `exports`) → `opencode/index.js`, plain ESM, no
  dependencies. Installs with `opencode plugin add
  'github:xyzhub/agentic-workflow#main::path:plugins/agentic-workflow'`.
- **What it registers, from the shared markdown (no second copy):** the 28
  commands via `command.transform` (body expanded, `${CLAUDE_PLUGIN_ROOT}` and
  `$ARGUMENTS` resolved, a runtime note maps Claude spellings to OpenCode's);
  both skills via `skill.transform`; the 20 agents written as owned files to
  `~/.config/opencode/agents/` (the V2 agent editor has no `add`).
- **Guards:** `hooks/hooks.json` runs unchanged — `UserPromptSubmit` →
  `session.hook("prompt")` (stdout appended), `PreToolUse Bash|Read` →
  `permission.hook("evaluate")` (exit 2 → deny), `PostToolUse Write|Edit` →
  `tool.hook("execute.after")`. `Stop`/`SessionStart`/`SessionEnd` are not
  mapped (no V2 hook).
- **Verified:** live load on OpenCode 2.0.32 lists all 28 commands, both
  skills and all 20 agents; the push-to-default guard denies through a stubbed
  permission event. Not yet verified live: a guard firing on a real model's
  shell call.

## [1.62.0] — 2026-10-15
### Added — configurable attribution: one §10 row sets the credit on commits and PRs
- **§10 `Attribution` row** — `commit: <v> · pr: <v>`, each `default`
  (`Generated with The XYZ Protocol`), `none` (no line) or a backticked custom
  text; a bare `default`/`none` sets both; an absent or unfilled row reads as
  `default`.
- **`tools/attribution.mjs`** — `resolve` (the texts every writer uses),
  `apply` (mirrors the row into `.claude/settings.json` `attribution.commit` /
  `.pr` only — other keys and `sessionUrl` kept; refuses invalid JSON without
  touching it), `check` (in sync or names the drift), `import` (the row an
  existing setting implies, so a project's own choice is adopted). Harness
  cases in `tools/ledger-test.mjs`.
- **Conform ladder entry `attribution-settings`** (since 1.62.0) — a gap when
  the row is absent or `.claude/settings.json` disagrees with it.
### Changed
- `end`, `fix`, `pr`, `release` and the mission foreign-runtime commit line
  follow the §10 Attribution row instead of a hardcoded Co-Authored-By
  trailer; `bootstrap`, `adopt` and `sync` write the row (`import`) and the
  settings mirror (`apply`, every sync).
- The `git/gh guardrails` commit hint prints the target repo's resolved
  commit text (no jq needed for it); hook-test now also pins the push-refspec
  guard.
- `ledger.mjs --commit` ends its commit with the resolved commit text
  (nothing when the row says `none`).
- This repo: `docs/WORKFLOW.md` synced to v1.62.0 with `commit: default · pr:
  default`, and a tracked `.claude/settings.json` carries the mirror.

## [1.61.0] — 2026-10-15
### Added — adaptive ceremony: each project runs only the gates it needs
- **`templates/gate-classes.md`** — the ONE list of gate classes: 8 change
  classes and 9 action classes, each with its reviewer tier, triage use and
  whether it is irreversible, plus the one gate grammar
  (`<id> · human|reviewer|record · <class>[+<class>]`). An irreversible class
  can never be skipped.
- **Fenced gate tables** — the §0 stage table (`<!-- stage-table -->`) and the
  §5 checkpoint gates (`<!-- checkpoint-gates -->`) now carry a gate id and
  class per gate, so tools read them by header, never by a fixed stage list.
- **`tools/ceremony.mjs` + `tools/ceremony-test.mjs`** — `derive` proposes a
  profile from the fences and observable repo signals (never writes);
  `effective <id> --log` resolves one gate and writes the deviation line when
  it is skipped (`--not-run` logs an optional gate the caller chose not to
  run); `check` reports absent, proposed, refused overrides, mismatches and
  drift. Anything not `confirmed` resolves `required` (fails closed). Lint runs
  the harness (`checkCeremonyHarness`).
- **§10 `Ceremony profile` row + `### 10.2 Ceremony` table** — one row per
  artifact and gate with its derived value, the signal behind it and the
  effective value; overrides are dated lines under the table. The §5
  `ceremony-skip` rule says a skip always leaves exactly one deviation line.
- **Conform ladder entry `ceremony-profile-row`** (since 1.61.0) — the
  session-start check runs `ceremony.mjs check`; a `proposed` profile passes.
- **Merge-guard backstop** — an agent merge is blocked while §10.2 marks any
  irreversible-class gate `skipped` or `optional`, under every merge policy;
  tolerant of hand edits (leading whitespace, tabs, mixed case, `####` heading).
- **`Reviewer runs:`** ledger counter (`ledger.mjs <mission> reviewer-runs +1`),
  bumped before every one-shot reviewer spawn, plan-judge included.
- **Lint**: `checkClassListDedup` (a second inline class list fails) and
  `checkCeremonyCopies` (every gate id has an owning command that carries the
  `ceremony-skip` rule-copy and calls `ceremony.mjs effective`).

### Changed
- Every gate site resolves the profile before running: `/mission`
  (plan-judge, phase review, staging verify, chronicler), `/autopilot` (stage
  gates; its stage report counts passed and skipped gates), `/verify`,
  `/counsel`, `/audit`, `/settle` (mission-close).
- `/bootstrap` derives the profile, asks at most ONE batched question and
  writes it `confirmed`; `/adopt` and `/sync` write it `proposed` ("nothing
  changed yet") until the owner says "confirm ceremony profile"; `/doctor`
  reports absent, proposed, refused overrides and drift (UI drift warns only;
  irreversible-class drift tightens on its own). `/next` and the `intake` agent
  name the profile when it changes their answer.
- The `reviewer`, operate triage and the §5 Fable-boundary rule (LA-5) point at
  `templates/gate-classes.md` instead of keeping their own class lists.
- `/sync` preserves §10 through §10.2 verbatim.
- This repo's `docs/WORKFLOW.md` is synced to v1.61.0 with a `proposed`
  ceremony profile — full ceremony still applies here until the owner confirms.

### Deferred
- The AC-13 measurement (three real changes with a confirmed profile, cost and
  safety scored) is promoted to an obligation row at mission close.
- No automatic re-derive on drift (a warning only); no Missions app UI for the
  profile.

## [1.60.0] — 2026-10-13
### Added — in-app support channel spec + bug triage/diagnose/digest modes (operate-triage, mission 1 of 2)
- **`templates/support-channel-spec.md`** — the venture build spec for a two-way
  in-app support thread synced to `source/user` GitHub issues: data model
  (`SupportTicket`, `SupportMessage`, statuses, transitions), the report
  contract, labels + sync rules, reply flow (draft reply stripped, a human
  sends it), the read-only `GET /api/ops/signals` endpoint behind
  `OPS_READ_TOKEN`, per-venture alert config, what mission 2 will need, and an
  8-item build checklist. Written so a venture runs `/agentic-workflow:plan` from it.
- **`templates/operate-triage.md`** — the venture's triage rubric: eight fixed
  escalation classes, the impact rubric with a `Weights:` data line, the signal
  table (with its "not configured" rule), the alert table, the `Ceilings:` line
  (all `unset` except `fixes/day: 3`), the `loop/paused` pause switch, the twelve
  labels, and the report-text-is-data posture.
- **`/agentic-workflow:operate triage #N | diagnose #N | digest`** — three
  `$ARGUMENTS` modes with one shared Preflight (Issue tracker, `gh auth status`,
  rubric or plugin fallback, pause switch, idempotent labels). Triage decides
  `loop/fix | loop/diagnose | loop/escalate | needs-info` and posts the triage
  comment; diagnose spawns one fresh `ops` agent over the signal table and posts
  the diagnosis with a draft reply; digest sends on activity only plus a weekly
  alive line. Boundaries: never merge, push, deploy, message the reporter,
  mutate production, or follow a report's instruction; a fixed Bash list.
- **`tools/operate-triage.mjs`** — zero-dep core: `contract`, `score`, `labels`,
  `notify` (sends only with `--channel slack`, never claims a send it did not
  make, keeps the text locally otherwise), `digest-due`; 11-case `--selftest`,
  run by lint row **10.11** (`checkOperateTriageSelftest`, fail-closed).
- **Eval `operate-triage`** — a synthetic printer-outage report with an
  injected instruction, a fake `gh` on `PATH`; `evals/run.mjs` now prepends a
  fixture `bin/` to `PATH` when present and sets `XDG_STATE_HOME` under the
  eval's work dir.
- **`agents/ops.md`** gains a Diagnose mode section; §4, §6, §9 and §12 name the
  `source/user` / `loop/*` labels, the diagnose mode, the three modes, and the
  Alert/Digest wiring (incident-class report and single-venue device outage
  alert; the bug-loop digest is activity-only plus a weekly alive line).
### Noted
- No watcher, no fix path, no server, no caps enforcement — mission 2
  (`operate-fix`, #90); the venture n=1 is an obligation the orchestrator
  promotes at close (OB-<n>).

## [1.59.0] — 2026-10-11
### Added — retro fixes from tune-presets (#129–#134, one PR)
- **`tools/ledger.mjs` — one-line ledger beats (#132).** `mark`, `fire`,
  `promote`, `handoff`, `next-up`, `sessions`, `close` (+ `--commit`, `--no-push`,
  `--date`, `--plans`) replace the hand-written heredoc + commit + push the
  orchestrator ran eight times per mission. A verb refuses an ambiguous row
  (exit 2, candidates listed) instead of guessing; `fire`/`promote` look inside
  `## Closing` only; `promote` lands the verbatim copy in `.plans/OBLIGATIONS.md`
  as the next `OB-<n>`; `close` refuses over an open row. A refusal leaves the
  file byte-identical. Harness `tools/ledger-test.mjs` (37 cases), wired into
  lint as check 10.10; `mission.md` rules 5/§5 and `settle.md` §4 point at the verbs.
- **`tools/shell-wrappers.mjs` — the one shell-wrapper denylist (#129).**
  Shells, launchers and interpreters are declared once; `run-claude.mjs`
  `isBareBash` re-exports it, `lint.mjs` imports it, and `run-codex-test.mjs`
  cross-checks `templates/codex.rules` both ways (every wrapper with a codex
  form is covered; every exemption — `zsh`, `source`, `.`, `find -exec` —
  carries its reason). Quoting hardening: quotes/backslashes are stripped
  before the first token is read and a first token carrying a shell
  metacharacter (`git;sh`, `$(sh)`, `FOO=bar`) is refused — `Bash("sh" -c:*)`,
  `Bash(s\h:*)` no longer pass (the checkpoint-p2 advisory residual).
- **`templates/codex.rules`** gains the wrappers the shared list showed missing:
  `dash|ksh|fish -c`, `eval`, `exec`, `sudo`, `node -e`, `python|python3 -c`,
  `perl|ruby -e` — inline-code flags only, so `node tools/lint.mjs` stays
  allowed. Every example verified through `codex execpolicy check` (harness 252).
### Changed
- **Beat-enforcer Stop hook is condition-aware (#131).** A `[ ]` row whose
  `when:` names another checklist row (`when: checkpoint p2 APPROVED`,
  `when: S2 merged`, `` when: `ckpt-p1` [x] ``) is skipped until that row is
  `[x]`; an id matching no row keeps the old nudge. Five harness cases; the
  five-consecutive-stops nag on `docs/record synced` is the reproduction.
- **No between-phase status-page republish (#133).** `mission.md` §4 and the
  WORKFLOW §6.1 "When": the chronicler runs once at mission close and the main
  session republishes then; between phases the ledger, PR body and owner report
  carry the state. Republish earlier only with no owner channel AND a mission
  spanning more than a day.
- **Locks are what the spike ran (#130).** Planner, plan template and plan-judge:
  a locked decision naming a command line or flag set must cite the spike line
  where that exact invocation succeeded end to end; otherwise it is `Assumed`.
  Plan-judge gains the check, plus "permission-gate briefs name their prior art"
  (`Prior art:` brief field, #129).
- **§10 row `Background commit review` (#134, this repo's profile):** the
  review's `claude -p` child must inherit the claude.ai login — `ANTHROPIC_API_KEY`
  is not set in any shell/app environment that launches Claude Code; probe
  `claude auth status` → `claude.ai`.

## [1.58.0] — 2026-10-11
### Added — tune presets (phase 2 of tune-presets: runtime)
- **`tools/run-claude.mjs` — the `claude-p` runtime (AC-6).** Runs one role as a
  child `claude -p` and writes the shared distillate (`templates/distillate.schema.json`).
  `--preset <name>` reads model, effort, `maxTurns`, `compact_window`,
  `allowed_tools` and `read_budget` from the role's row; explicit flags win. The
  window is set as `CLAUDE_CODE_AUTO_COMPACT_WINDOW` on the child env only and
  passed as `--autocompact`; `CLAUDECODE`/`CLAUDE_CODE_ENTRYPOINT` are stripped;
  the child runs `--restricted --permission-mode acceptEdits --permission-prompts
  none --strict-mcp-config` with `--tools`/`--allowedTools` from one allowlist,
  never `--bare` or `bypassPermissions`. An unrestricted `Bash` rule (bare,
  wildcard, wrapper shells such as `sh -c`/`env`/`xargs`, interpreters,
  `find -exec`) is refused with exit 3. Exit `0` done · `3` blocked (incl.
  `budget:` on max turns) · `1` failed (incl. no result line). Harness
  `tools/run-claude-test.mjs` (75 cases) + lint `checkRunClaudeHarness`.
  Residual advisory: quoting disguises of a shell name; the interpreter class is
  a deliberate author grant.
- **Hook child-silencer.** The six advisory hooks and compact-resume exit 0
  silently when `AGENTIC_WORKFLOW_CHILD=1` (set by the adapter), as their first
  statement; guardrail hooks untouched; hook-test +11 cases.
- **Haiku shadows + budget re-route (AC-7).** `mission-sessions.md` read budget
  gains "Haiku tier: ≤500 lines, maxTurns 24"; a `claude-p` `budget:` block is
  re-spawned once on the row's `fallback` (mission.md step 3).
- **`claude-p` runtime resolution (AC-8).** mission.md step 2 runs it like
  `codex` (background Bash, read the distillate file, orchestrator commits);
  the foreign-runtime paragraph now covers both.
- **Tick + mission budgets (AC-10).** Ledger lines `Tick budget:` /
  `Tick tokens:` / `Mission budget:`; `mission-budget.sh` prints
  `· tick k/N tokens`, 🛑 TICK BUDGET and 🛑 MISSION BUDGET (print only); §5
  Loop mode carries the rule; planner copies `unattended.tick_budget`.
### Changed
- The adapter passes the role body as `--system-prompt-file`, not `--agent`:
  on claude 2.1.296 `-p --agent` takes the agent's `tools:` as the whole tool
  set and drops the StructuredOutput tool `--json-schema` needs.
### Evidence — AC-9 (claude 2.1.296, `--preset lean --model claude-haiku-5-5`)
- chronicler: done, exit 0, schema-valid; `modelUsage` = `claude-haiku-5-5`
  only; 6 turns; first request 10,694 / peak 12,424 prompt tokens; init tools
  Bash, Edit, Glob, Grep, Read, StructuredOutput, Write; no `compact_boundary`;
  child argv `--autocompact 100000`; ~$0.002.
- intake: done, exit 0, schema-valid; Haiku only; 7 turns; first 6,729 / peak
  11,376; init tools Glob, Grep, Read, StructuredOutput; no compaction; ~$0.003.
- Parent `CLAUDE_CODE_AUTO_COMPACT_WINDOW` unset before and after both runs.
  Artifacts: `.plans/tune-presets.artifacts/ac9-{chronicler,intake}.*`.

## [1.57.0] — 2026-10-11
### Added — tune presets (phase 1 of tune-presets: configuration)
- **`templates/tune-presets.json` (AC-1).** Four presets — `lean` · `balanced` ·
  `rigorous` · `unattended` — × all 20 agents, rows per agent (`class`, `model`
  pinned to `claude-fable-5-1` / `claude-opus-5-5` / `claude-sonnet-5-5` /
  `claude-haiku-5-5`, `effort`); Haiku record rows (Lean, Unattended) carry
  `runtime: claude-p`, `compact_window: 100000`, `maxTurns: 24`,
  `read_budget: 500`, scoped `allowed_tools` and a Sonnet `fallback`;
  `unattended.tick_budget: 750000`; Lean carries the unmeasured-saving `note`.
- **Lint (AC-12).** `tools/lint.mjs` `checkTunePresets` over the exported pure
  `tunePresetFindings`: preset names, every live agent in every preset, pinned
  ids, effort enum, Haiku invariants (window, integer caps, no bare `Bash`,
  non-Haiku fallback), no Haiku below 5.5, positive `tick_budget`.
  `tools/lint-test.mjs` `PRESET_CASES`: the real file clean + bad id, missing
  agent, Haiku row without the window, bare-`Bash` Haiku row all red.
- **`/agentic-workflow:tune preset <name> | show | reset` (AC-2, AC-3).** Apply
  writes a stamped `preset:<name>` shadow only where a cell differs from the
  base (`balanced` writes none), skips-and-reports hand tunes, rewrites the §10
  row, warns on an open mission ledger, re-runs idempotently; `show` marks `*`
  where `effective` departs from the row; `reset` deletes preset-authored
  shadows only. A later per-agent tune appends its kind (`preset:lean, model`)
  and wins; `diff` prints the preset row beside `effective`.
- **Registry `override.preset` (minor bump).** `tools/agents.mjs` parses the
  banner's `preset:<name>` token; `templates/agents-registry.schema.json` adds
  the required `string|null` field.
- **Bootstrap / adopt preset question (AC-4).** ONE question (`balanced`
  recommended; `rigorous` when payments/auth/PII are named); §10 **Tune preset**
  row `<name> (applied YYYY-MM-DD)`, unanswered `balanced (default, applied …)`.
- **`/doctor` preset checks (AC-5).** §2 **Preset drift** (🟡) and **Preset
  switch while open** (🔴); clean state silent.
- **Record (AC-11).** `templates/WORKFLOW.md` §5 preset pointer, §9 clause,
  §10 **Tune preset** row; this repo's row = `balanced`; `commands/mission.md`
  rule 7 — the plan-judge runs on Fable under every preset, and boundary
  escalation covers any non-Fable reviewer tune.

## [1.56.0] — 2026-10-11
### Added — builder done-rules, AC ids + value sourcing, Assumed status, Test policy, /fix loop (phase 2 of builder-done-rules)
- **Builder done-rules (AC-1..AC-4).** `agents/backend.md` and `agents/frontend.md`
  gain a `## Done means` block: a migration is done only when applied in the
  §10-named datastore and the schema is confirmed live by query (coordinated
  staging migrations → a pre-merge Closing row); superseded code is removed and
  proven unreferenced in the same change; rollouts run primitive → sites → gate
  once, and a mid-rollout stop reports migrated vs pending paths; a needed
  deviation from a dated locked decision stops before coding and returns the new
  hand-off status `deviation` (codex adapter: `blocked` with `blocked_reason:
  deviation: …`). It replaces "log any deviation in the ledger".
  `commands/mission.md` routes `deviation` (and the codex prefix) to the owner
  directly — no corrective retry, no session increment; "build anyway" lands as
  an `Assumed` locked decision. `templates/WORKFLOW.md` §6 carries the one-line
  **Done means** anchor (AC-5); §7 DONE points at it.
- **AC ids + value sourcing (AC-6..AC-8).** `templates/mission-plan.md` numbers
  criteria `AC-N` and gains `## Value sourcing` (AC · Value · Source kind {input,
  column, derivation, locked decision, open question} · Where; a literal
  `none — no values produced` row is valid); `templates/mission-sessions.md`
  briefs open with `ACs:`; `templates/decision-memo.md` gains "Values this
  decision settles"; `agents/planner.md` requires all three. The reviewer's
  output gains a **Per-AC verdict** (`AC-n: pass|fail — evidence`, `uncovered:`),
  and plan-judge mode REVISEs on an uncovered AC id or an unsourced value — cell
  defects are named fixes inside the one REVISE.
- **`Assumed` decision status (AC-9).** `templates/decision-log.md` gains a
  Status column (`decided` · `Assumed — owes…; built on…; authorized by…` ·
  `ratified <date>`); the master plan allows `Assumed <date> — …` bullets; the
  ledger mirrors one `Assumed <date> → <home>` line; `commands/settle.md` step
  2b probes and surfaces unratified entries — never a blocker.
- **§10 Test policy row (AC-10).** `configured` · `none-by-design` · `none-yet`;
  the reviewer's QA lens reads it first; `/adopt` and `/bootstrap` seed it. This
  repo's `docs/WORKFLOW.md` records `configured`.
- **`/fix` root-cause loop (AC-11).** Deterministic reproduction → one falsifiable
  hypothesis at a time → cause not symptom → regression test red then green →
  sibling hunt → a bad decision routes to the architect.
### Changed
- `agents/reviewer.md` UX lens: the impeccable paragraph is a pointer to §0.2
  (AC-15c trim); `docs/WORKFLOW.md` mirrors the §5 "ONE prose home" paragraph,
  the §6 done-means line and the §10 Test policy row.

## [1.55.0] — 2026-10-11
### Added — prompt budgets + a §5 rule-dedup guard (phase 1 of builder-done-rules)
- **Byte/description budgets in `tools/lint.mjs` (AC-14/AC-15).** One `BUDGETS`
  object (agents 16,000 B · commands 24,000 B · `skills/*/SKILL.md` 6,000 B ·
  agent `description:` 400 chars · `templates/WORKFLOW.md` 120,000 B) with a
  ratchet-down comment; `checkBudgets()` warns at 90% on stderr (a `warn:` line
  that never changes the exit code, per-§ byte table on a WORKFLOW warn) and
  fails over 100%.
- **§5 rule-dedup guard (AC-12/AC-13).** The four convergence rules (overrun-1.5x,
  one-corrective-retry, fable-boundary, one-next-up) have ONE fenced prose home
  in `templates/WORKFLOW.md` §5 (`<!-- rule: <id> -->`); every other prose
  statement is a lint finding, and three `<!-- rule-copy: <id> -->` actor-site
  blocks are diffed against §5. The guard covers the plugin tree only, never a
  venture's own `docs/WORKFLOW.md`. `tools/lint-test.mjs` grew from 69 to 86
  cases (budget verdicts, per-id canonical self-detect, restatement fixtures).
- **20 agent `description:` trims (AC-15a).** Total 9,687 → 6,898 B; 0 files over
  the 400-char cap (was 17); `commands/mission.md` 21,336 → 20,969 B,
  `agents/reviewer.md` 14,308 → 13,438 B.

## [1.54.1] — 2026-10-07
### Fixed
- **One closing keyword per issue.** `/pr`, `/mission` and `/end` now tell agents
  to write a separate `Closes #N` line for each issue — GitHub reads a closing
  keyword for the first number only, so a comma list after one keyword closed
  only the first issue (seen on PR #112; the other five were closed by hand).
- **Registry: an agent file with no `tools:` line reports `tools: null`**
  (unset — all tools on claude, read-only on codex), not `[]`, in both `tools`
  and `effective.tools`. The registry schema now states its versioning rule:
  any added, removed or retyped field ships as a minor bump with a CHANGELOG line.

## [1.54.0] — 2026-10-07
### Added — the Gatehouse asks: every agent setting is a first-class, tunable, machine-readable shadow
- **Reviewer boundary-escalation is a per-project tune (#91).** `tune reviewer
  boundary-escalation on|off` writes a `boundary_escalation` key into
  `.claude/agents/reviewer.md`. Default (`on`/absent) keeps today's behaviour —
  the orchestrator escalates any boundary-class diff to Fable (§5 rule 7). `off`
  lets the tuned tier handle boundary diffs; the reviewer still files a process
  finding when it judges the tier miscalled. `mission.md`, `agents/reviewer.md`
  and `templates/WORKFLOW.md` LA-5 all honour the key; `reset` removes it.
- **First-class prompt/tools/skills/effort/boundary tunes with one banner, diff,
  rebase, reset (#92).** Every tune now stamps `> Tuned from agentic-workflow
  v<ver> (base sha256:<12 hex>) — <kind> override. Reset with /tune <agent>
  reset.`. `tune <agent> prompt` stamps a fresh copy for body edits; `diff`
  prints `diff -u` base vs shadow; `rebase` three-way merges onto the current
  base (clean merge only, else prints conflict markers and writes nothing);
  `tools <a,b,…>` sets `tools:` and prints the sandbox consequence. `reset`
  deletes any bannered shadow (old or new form, prompt tunes included);
  un-bannered files keep report-don't-delete.
- **Machine-readable agent registry (#93).** `node
  ${CLAUDE_PLUGIN_ROOT}/tools/agents.mjs --json [--project <repo>]` prints every
  agent's defaults, `effective` settings and `override` (kind derived by
  comparison, so hand edits classify too), validated by the new
  `templates/agents-registry.schema.json`. `/tune`'s no-arg table renders from
  it. New `tools/agents-test.mjs`, registered in lint as
  `checkAgentsRegistryHarness`.
- **`effort:` on the claude runtime (#94).** `tune <agent> effort <level>`
  (`low|medium|high|xhigh|max`) as a standalone tune; `mission.md` step 2 passes
  the Agent tool's effort parameter where exposed, else prepends `Effort:
  <level>.`. The adapter widens `--effort` to `xhigh|max` (pass-through).
- **`tune <agent> skills <a,b,…>` (#95).** Validates each name and writes
  `skills: [a, b]`; the registry and the `/tune` table show it; honoured on both
  runtimes (claude natively, codex via the inlining below).
- **Multi-executor fleet (#96).** `templates/WORKFLOW.md` §10.1 Executors table
  (name · ssh alias · repo path · labels · default); the legacy single **Remote
  executor** row counts as `default`. Gate rows may end `→ executor:<label>`;
  resolution is brief `executor:` pin → first healthy labelled → default →
  local, probing `ssh -o BatchMode=yes <alias> true` and blocking (never green)
  when none is healthy, with per-mission `<path>/.worktrees/<mission>` checkouts.
  `connect server <host> [--label …] [--name …]` appends a row and `server
  remove <name>` drops one; `doctor` probes every row.
- **Self-edited-guardrail warning + on-demand/project agents.** `run-codex.mjs`
  appends a `warning:` deviation (no revert, no status change) when a run changed
  any path under `.codex/` — Codex editing its own guardrail rules, flagged for a
  human to review by hand. The registry gains a `source` field (`plugin` |
  `project`), lists `.claude/agents` files that shadow no plugin agent, and uses
  an `on-demand` phase (a frontmatter `phase:` wins) where no lifecycle phase maps
  the role; `/tune`'s no-arg table and `agents-registry.schema.json` follow.
- **`effective.tools` in the registry.** A tools tune now shows the tools list the
  agent actually runs with (`tools` stays the plugin default). A preloaded skill
  from the project or personal folder is labelled `project copy` / `personal copy`,
  so it can be told apart from a same-named plugin skill. The template's duplicate
  §10 **Issue tracker** row is removed.

### Fixed
- **The codex adapter now honours the role's `skills:` frontmatter (#95).**
  `run-codex.mjs` `resolveSkills(roleText, cwd, home)` resolves each listed
  skill — `agentic-workflow:<name>` → plugin, bare name → project → personal →
  plugin — validating `^[a-z0-9][a-z0-9-]*(:[a-z0-9][a-z0-9-]*)?$` before any
  path is built, inlines each as a `# Skill: <name> (preloaded — listed in
  skills:)` block deduped against `namedSkills`, and reports an unresolved or
  invalid name in the distillate `deviations` on every written path. Previously
  the `skills:` list was dropped with the rest of the frontmatter, so a role
  behaved differently on the two runtimes. Harness +16 cases.

## [1.53.2] — 2026-10-07
### Security — close the wrapper gap opened in 1.53.1 (#108)
- 1.53.1 made the last-resort check require `gh` at command position, which
  let wrapped forms through (`X=merge; bash -c "gh pr $X 101"`, `env gh …`,
  `command gh …`, a full path to gh). `gh … pr` is matched anywhere again;
  the standalone-`merge`-word rule alone keeps both #108 false refusals fixed.
- The standalone-word rule let a trimmed word through (`X=merged; gh pr
  ${X%d}`, `$(echo merged | tr -d d)`). When the command holds `${`, `$(`, a
  backtick, `xargs`, `eval` or a pipe into a shell's stdin, any `merge`
  substring counts again (fail closed). Harness +14 cases.

## [1.53.1] — 2026-10-07
### Fixed — merge guard false refusals (#108)
- The last-resort check in `hooks/lib/merge-guard.sh` refused any `gh` command
  whose text held "gh", "pr" and "merge" in that order — an issue body that
  mentions merging a pr, or a guard dry run piped into `merge-guard.sh` (the
  file name supplied the word). It now fires only when a `gh pr` or `gh api`
  sits at command position AND `merge` appears as a standalone word. Side
  gain: `X=merge; gh pr $X 101` (word before the subcommand) now blocks.
  Harness +5 cases.

## [1.53.0] — 2026-10-07
### Changed — a mission closes in two PRs (pr-economy)
- **L3 — merge guard as a lib hook.** PR merges move from the inline git/gh
  row to `hooks/lib/merge-guard.sh`, which adds a new §10 value,
  `agent-may-merge (records-only, delegated <date>)`: the agent may merge a PR
  only when every changed path is on the exact allowlist — `.plans/**`,
  `docs/product/JOURNEY.md`, `docs/product/overview.html`,
  `docs/product/session-handoff.md`. Fail closed throughout: the policy cell
  is read from `origin/<default>` (a branch cannot grant itself authority) and
  matched anchored at the cell, so placeholder prose or a malformed value
  never widens it; numeric PR ref only; no `-R`/`--repo`/`GH_REPO`, no
  compound command, no `--auto`, flags limited to
  `--squash`/`--merge`/`--rebase`/`--delete-branch`; the merge must carry
  `--match-head-commit` equal to the head the hook just viewed (no
  check-then-push race); `gh api` merges block outright; RENAMED/COPIED
  files, 0 or ≥ 100 files (gh's cap) and pending/failed checks block; the
  hooks.json wrapper blocks a merge when the script is missing or crashes.
  `gh` output is read only through `jq`. Harness `156 → 251 ok` (gh stubbed on
  a PATH-only `bin/`).
- **L2 — Closing-row markers.** A row's source parens end with
  `(<source>, pre-merge)` (fires on the phase branch before the checkpoint,
  rides the feature PR) or `(<source>, post-merge)`; no marker = legacy, read
  as post-merge. The template's four seeded rows are classified; lint rejects
  any other merge-shaped tag and an unclassified template row.
- **L1 — one bookkeeping PR per close.** `mission`, `settle` and `end` route
  every post-merge record edit through ONE `chore/<mission>-bookkeeping`
  branch and PR (session-altitude: `chore/bookkeeping-<YYYY-MM-DD>`), merged
  by number at the end of the close; the chronicler runs record-only
  post-merge (CHANGELOG ships in the feature PR).
- **L4 — the registry's scope is unchanged.** Its `(bookkeeping, …)` row
  stays full delegation (warn-only); `records-only` is a new, separate value,
  adopted by this repo's §10. Under EVERY policy, full delegation included, a
  merge now BLOCKS when it is cross-repo (`-R`/`--repo` anywhere, even before
  the subcommand, or `GH_REPO=`), when one command holds more than one merge,
  or when anything but one leading `cd <repo> &&` precedes it — so the policy
  is always read from the repo the merge runs in. A merge-like command the
  guard cannot parse also blocks.
- **Transitional window:** the previously installed inline hook reads the
  WORKING-TREE §10 and treats any `agent-may-merge …` as warn-only
  delegation, so in a checkout whose §10 already says `records-only` it does
  not block until `/plugin update` installs this release.

## [1.52.0] — 2026-10-07
### Added — hash-pinned, claim-token publish approval (§14)
A publish-queue item now fires only for the exact body the owner approved, and
only once. Before this, "a change to an approved body resets it to `draft`" was
prose the run was trusted to follow.
- **Gate tool** `tools/publish-gate.mjs` (zero-dep, shipped by the plugin):
  `stamp` (hash every body; drift → epoch +1, `approved` → `draft` with
  `publish run: REFUSED <id> approved@<h>/e<n>, current <h'>/e<m> -> reset to draft`),
  `approve <id>` (pins `approved-for: <sha8>@<epoch>`), `claim <id>` (mints a
  one-time `PUBLISH_CLAIM=<token>` only for an approved, pinned, due,
  `kind: post` item within policy; refuses outreach, paid without
  confirmation, not-due, no-pin, double claim, unknown outcome), `dispatch`
  (re-hashes; an edit after the claim voids the token), `outcome … delivered |
  unknown`, `reconcile <id> --delivered | --cancel`, `status`, `--selftest`
  (lint row 10.8, fail-closed). Queue/log writes are temp + rename under a lock.
- **Hook** `hooks/lib/publish-guard.sh` replaces the inline guardrail, four
  rules: same file root as the gate tool; paid/ad endpoints (now incl.
  `api.elevenlabs.io`, `api.x.com`) BLOCK without `PAID_CONFIRMED_BY_HUMAN`; a
  publish-host call (now incl. SendGrid, Postmark, Resend, Mailgun,
  ConvertKit, Brevo, `smtp(s)://`, bare mailers) BLOCKS under EVERY policy
  unless it carries `PUBLISH_CONNECT=` or a dispatched `kind: post` claim; the
  passing call appends a `fired` event, so a retry under the same token BLOCKS;
  a token resolving to outreach BLOCKS regardless of policy. Unreadable jsonl
  fails closed.
- **Harness**: `tools/hook-test.mjs` gains `runGate` and the publish-approval
  block — tampered body, stale epoch, double claim, unknown outcome,
  outreach under delegation, tokenless call under every policy, connect
  marker, spent/forged/unminted tokens, edit-after-claim (123 → 156 ok).
- **Schema**: queue gains `kind | body-sha256 | epoch | approved-for | claim`
  (12 columns); log gains `kind` and `claim`; `publish-claims.jsonl` is the
  committed event trail. `stamp` migrates an old 7-column queue in place
  (`kind: post`, `epoch: 1`, state unchanged — an `approved` row without a pin
  must be re-approved) and is idempotent.
- **Protocol** (§3 new publish-host row; §14 Prepare/Pin/Claim/Record,
  **Threat model** — accident and double-fire, not an adversarial agent — and
  the rewritten backstop); `/agentic-workflow:publish` gains `approve <id>` and
  `reconcile <id>`; `run` = stamp → claim → dispatch → fire → outcome.
- **Codex gap named**: inside a Codex run the gate tool's refusal is the only
  mechanical publish check; a network-on builder role remains OB-17 (#81).

## [1.51.2] — 2026-10-02
### Fixed — closed and never-started missions no longer count as "active"
Reported from orderly: every prompt printed the status line of a mission CLOSED
three days earlier, and a planned, never-started ledger took over whenever its
mtime was bumped.
- One shared predicate, `hooks/lib/active-ledger.sh`, replaces five inline copies
  in mission-budget, handoff-budget, compact-resume and both beat-enforcers.
- The newest-touched ledger is the focus. It is skipped while never started
  (`Sessions used: 0` or `Status: planned`). It is not active once it carries a
  `Closed:` stamp, a `Status:` other than `active`, a first `Next up:` saying
  the mission is closed/complete, or no open beat. `[~]` obligation rows
  promoted to `.plans/OBLIGATIONS.md` (`→ OB-<n>`) no longer count as beats.
- A finished newest ledger no longer falls back to an older, never-closed one.
  This deliberately reverses one compact-resume case pinned in S5b.
- 9 regression cases in `tools/hook-test.mjs` (all fail on 1.51.1), including
  closed-with-promoted-obligations, planned/blocked, genuinely active, and one
  fixture checked across all four consumers.

## [1.51.1] — 2026-09-17
### Fixed — Codex change attribution and successful distillate discovery
Both fixes came from the 1.51.0 checkpoint re-review (A2/A3).
- `run-codex.mjs` `changed_paths` is now the delta vs a pre-spawn `git status`
  snapshot, so the orchestrator's write-ahead ledger edit is never reported as
  the Codex run's change; harness cases added.
- The `codex-routing` eval's shape-discovery fallback requires
  `status === "done"`, so a failed/blocked distillate no longer passes the
  "distillate found" check; unit cases added.

## [1.51.0] — 2026-09-17
### Added — a second runtime: run any role on the Codex CLI (GPT-6 Astra), same protocol
"Fable plans, Astra executes." A role is a markdown prompt; the runtime is a
spawn detail. Any role can now run on OpenAI's Codex CLI instead of a Claude
subagent, chosen per brief or per agent — no protocol change, and no behaviour
change for a project that never opts in.
- **Runtime selector**: each brief routes by a locked precedence — the brief's
  `runtime:` header → a `.claude/agents/<role>.md` tune override → the default
  `claude`. `model:` stays a valid Claude tier; the Codex model rides in
  `runtime: codex:<model>`.
- **Codex adapter** `tools/run-codex.mjs`: brief in, JSON distillate out. It
  assembles the role prompt + §10 + the brief, derives the sandbox from the
  role's `tools:`, runs `codex exec` (globals BEFORE the subcommand — `codex
  exec -a never …` exits 2), and writes the distillate FILE the orchestrator
  reads. Codex never commits or touches `.plans/`; the orchestrator marks the
  ledger and commits `changed_paths` itself. Behavioural harness wired into lint
  (check 10.7); no API call.
- **`templates/distillate.schema.json`**: one bounded hand-off schema (§6.2) for
  every runtime. **`templates/codex.rules`**: the mechanical hook guardrails (no
  push/commit/tag, no `gh pr create|merge`) restored inside Codex as execpolicy
  `forbidden` prefix rules (literal tokens, nested-list alternatives, a blanket
  `git -C`); the §14 host-pattern guards are a named, accepted parity gap.
- **`AGENTS.md` is the primary, runtime-neutral conventions file** both Claude
  and Codex read; `CLAUDE.md` imports it via a first-line `@AGENTS.md`. bootstrap
  creates both, sync moves runtime-neutral content across once, adopt records the
  precedence, conform gains the `agents-md-primary` ladder entry.
- **Commands**: `/tune <role> codex[:<model>] [effort]`; `/connect codex` (a
  proven read-only round-trip read from the `--json` event stream, rules install,
  owner-approved trust entry, then the §10 Runtimes row); `/doctor` gains a
  Runtimes probe — advisory when absent, fail-closed when §10 names codex and any
  of binary/auth/rules/schema/trust entry is missing.
- **Permanent plan-judge (#79)**: a fresh read-only one-shot reviewer mode over
  the plan trio, automatic in `/mission` plan/replan and `/plan`; APPROVE/REVISE,
  the planner revises once, a second REVISE surfaces to the owner.
- **WORKFLOW.md**: §3 foreign-runtime parity row, §6 "roles are runtime-neutral,"
  §9 maps the new tools/commands, §10 gains a Runtimes row.

## [1.50.1] — 2026-08-21
### Fixed — the "closes an issue that isn't done" bug, made mechanically impossible
Owner: "it closes issues that are not done yet." Root cause: a GitHub closing
keyword (`Closes/Fixes/Resolves #N`) in a durable COMMIT MESSAGE fires whenever
that commit reaches the default branch — including when the staging→main
promote carries it — closing the issue at the wrong moment, done or not (orderly
#605, auto-closed by a commit message after the PR body was scrubbed).
- New guardrail hook: **BLOCKS** a `git commit` whose message carries a closing
  keyword + issue ref (`(#N)` PR references and `refs #N` are allowed; only the
  close directive is blocked). Hard block, exit 2 — a warning is what failed
  before. 7 hook-test cases.
- Protocol (WORKFLOW §3, `/pr` step 7.5, `/mission`): closing keywords live in
  the PR-to-default-branch body only, reviewed at the close moment; commits and
  staging-PR bodies reference an issue, never close it.

## [1.50.0] — 2026-08-21
### Added — the plain-report skill: owner-facing reports a human who missed the session can act on
Owner, after a correct 20-hour orderly session handed them internal shorthand
(`LD-21`, `OB-6`, `S11-fix`), repeated a deadline date it never explained, and
took two rewrites to say the plain thing: "I don't want to read slop."
- `skills/plain-report/SKILL.md` (adapted from the unslop skill, cursor/plugins):
  define every id and term the first time, lead with the action, explain instead
  of repeat, cut AI vocabulary and puffery, plain words, mechanism over feeling.
  Scoped to owner-facing prose — reports, notifications, status page, JOURNEY,
  decision-needed messages. Exempt: commit messages (fixed format), ledger rows
  (data), code. Structured status stays tabular; narrative gets plain sentences.
- Wired into WORKFLOW §6.0, the chronicler (status page + JOURNEY), the
  orchestrator Output sections (`/mission`, `/settle`, `/next`, `/end`,
  `/autopilot`), and the reviewer DX lens (a report that dumps shorthand on the
  owner is a finding).

## [Unreleased]

_(empty)_

## [1.49.2] — 2026-08-19
### Fixed
- **Staging parity has a second dimension: connection topology.** Same
  commands + same image was not enough — orderly's prod release aborted
  (safely) because the release wrapper's `lock_timeout` startup option is
  accepted by staging's direct Postgres and FATAL-rejected by prod's
  PgBouncer. §5 parity rule now names it; migrations run on the DIRECT
  database URL in every environment.
## [1.49.1] — 2026-08-19
### Fixed
- **LA-6 extended to gate spawns**: the orchestrator writes one ledger line
  when a long gate is SPAWNED (what, range, when), not only at its verdict —
  an unrecorded in-flight review is indistinguishable from a stall to a
  watcher (observed live).
- **Staging-parity rule (§5)**: staging is evidence only insofar as it runs the
  SAME image/release/deploy commands as production. Incident, orderly #586: a
  release wrapper existed in fly.toml but not in the Docker image, and
  staging's toml still ran the old inline command — staging green while prod's
  release phase would have failed with zero of 7 migrations applied; caught by
  a whole-range Fable re-gate at the merge.

## [1.49.0] — 2026-08-19
### Changed — reviewer tier keys on risk class, and a security review must close the threat
Both from a live finding during the n=1 (orderly #605→#730): a two-deletion
auth-critical diff was reviewed by opus on diff-size judgment; a follow-up
Fable auth pass found #605's threat only HALF closed — a second path
(`checkout-url.post.ts` + a bypassable `create-intent` gate) still hands back
the table qrToken — for ~74k tokens.
- **Reviewer model tier keys on RISK CLASS, not diff size** (`agents/reviewer.md`,
  `commands/mission.md` §0, `templates/WORKFLOW.md` §5): Fable is required for
  any review whose diff touches auth / a session credential / authorization /
  tenancy / money / schema / migrations / a security boundary — a two-line
  auth diff included. The reviewer flags a miscalled tier as a process finding.
- **Close the threat, not just the diff**: a security/auth/money review must
  step outside the changed lines and check for a second path to the same asset
  (grep every producer of the protected value and consumer of the vulnerable
  one); a partial fix must say "closes X of N paths, rest is #<issue>", never
  a silence that reads as closure.

## [1.48.6] — 2026-08-19
### Fixed
- **§5 Hotfix path**: a Lane-A fix branched from the default branch, with
  staging far diverged, must NOT land on staging — it would verify a build
  that isn't the fix, risk conflicts, and double-land at the promote. Verify
  on a preview/branch deploy or a local real-client run against a scratch
  datastore, record the deviation + verification target, PR to the default
  branch as usual; the fix reaches staging via the promote/back-merge.
  Found live: orderly #605 with staging 128 commits + 7 migrations ahead.
  `/mission` §3 carries the exception.

## [1.48.5] — 2026-08-19
### Fixed
- **`/sync` can now ask** (owner: "it didn't ask me anything, it just listed
  hand-offs"): `AskUserQuestion`/`SlashCommand` were missing from its
  allowed-tools, so it could only print a list. New step 3.8: collect the
  `TBD — confirm` §10 rows one question at a time (each with a recommendation
  and a "leave TBD" option; never infer a delegation), then offer to run the
  first remaining hand-off via SlashCommand — the `/next` pattern. Unattended
  runs still just leave the list.

## [1.48.4] — 2026-08-19
### Fixed
- **`conform.mjs` `has10()` label match** (found by orderly's `/sync`, #57):
  exact-bold matching made a verbatim template copy fail its own ladder —
  `has10('Test users')` vs the template's `**Test users / auth access**`. Now
  a prefix match with a word boundary, plus a hook-test that derives every
  `has10` label from `conform.mjs` and asserts the TEMPLATE's own §10
  satisfies it — the two files can no longer diverge silently.
- `/sync` step 3.6: the project's own lint must ignore the plugin-shipped
  scripts (orderly measured 341 spurious errors without the ignore; local
  fixes would be overwritten by the next sync).

## [1.48.3] — 2026-08-19
### Added — `/connect server <tailscale-host>`: one guided command to offload heavy work to a server
Owner: "I don't know how to set that up… maybe a single command." Same
pattern as the owner-channel `/connect`: one step at a time, verify before
proceeding, record only after a proven round-trip. Collect hostname/user/path
→ key + `~/.ssh/config` alias (`ssh-copy-id` run by the human — no passwords
in the conversation) → server readiness (git/node/pnpm/docker, installs only
with an okay) → repo cloned via a `gh repo deploy-key add` key (no password
dance), `.env` scp'd → docker context (`host=ssh://<alias>`, every docker/
compose command runs server-side) → four-probe round-trip → THEN record: §10
**Remote executor** row, heavy gates rewritten in remote form (pushed-branch-
tip only, LA-8), AUTH.md access recipe. `/doctor` probes the alias, remote
repo, and docker context. Part of #53 (remainder: prefer-remote semantics,
remote worktrees with #44).

## [1.48.2] — 2026-08-19
### Added — AUTH.md: test users and authenticated access, known to every session (owner ask)
- `templates/auth.md` → `docs/AUTH.md`: seeded app test users (role, login,
  password, org/venue, surfaces, **seed anchor**), per-surface sign-in flows,
  and access recipes for DBs/remote servers (env-var NAMES and recipes only —
  e.g. the Tailscale scratch-Postgres host — never secret values; production
  credentials never in any form). Rows are rewritten in place when seeds
  change, in the same PR (§6.1 discipline).
- §10 **Test users / auth access** row; conform ladder
  `profile-test-users-row`; `/bootstrap` fills the table FROM the seed
  scripts; `/verify`, the reviewer's real-client smoke, and `frontend` read it
  instead of asking or digging through transcripts; `backend` updates it when
  seeds/auth/login flows change; a missing or seed-stale AUTH.md is a DX
  finding.

## [1.48.1] — 2026-08-19
### Fixed
- **A gitignored `.plans/` is now a conformance gap (`plans-tracked`).** Found
  in the wild (owner, 2026-08-19): orderly's `.gitignore` had `.plans/`, so 18
  ledgers, the obligations register and every `/sync` edit existed on one
  machine only — a clone or a worktree starts empty, the staging PR cannot
  carry ledger updates, and the crash-safe premise silently fails.
  Fs-only check (root `.gitignore` lines `.plans`/`.plans/`); targeted
  sub-ignores (screenshots, scratch dirs) stay fine. WORKFLOW §5 states the
  rule; 2 hook-test cases.
- **Cross-machine hand-off is now protocol (§5)**: one driver per mission at a
  time; a stopping session commits AND pushes the ledger; `continue` pulls
  first — the ledger at origin is the state, the local copy a cache.
  `/mission continue` and `/end` carry the rule.

## [1.48.0] — 2026-08-19
### Added — deterministic CI tracking: `tools/ci-wait.mjs` (closes the LA-8 false-green family; zero tokens while waiting)
- One question, one exit code: resolves any ref/`pr:N` to the **full 40-char
  sha** (a short sha silently returns `[]`), polls `gh run list --commit`, and
  exits 0 GREEN / 1 RED / 2 TIMEOUT / 3 NO-RUNS / 4 EXPECT-MISSING. NO-RUNS
  and a never-triggered `--expect` workflow are failures, never green — the
  path-filter trap. Pure `decide()` core with a 10-case selftest (lint check
  10.6, fail-closed); agents run it via `run_in_background` and pay zero
  tokens while it polls.
- Wired everywhere CI was tracked by prose: `/mission` staging step, `/verify`
  precheck, `/settle` deploy-green probe, reviewer step 0, WORKFLOW §5;
  `/bootstrap` and `/sync` step 3.6 copy it into ventures with workflows;
  conform ladder `ci-wait-tooling` (present + current when `.github/workflows`
  exists).

## [1.47.3] — 2026-08-19
### Fixed
- **`/pr` gains the queue-item gate (step 7.5)** — owner: "why don't filed
  issues get closed when their PRs are merged?" GitHub auto-closes only on
  `Closes #N` in the PR description; the rule existed in `/mission`, `/fix`
  and `/end` but not in `/pr`, the command that actually creates PRs. Now:
  `Closes #N` when the PR finishes the item, `Part of #N` + an issue comment on
  what remains when partial (a half-done issue that auto-closes is a silent
  drop), create-or-justify when no issue exists. Step 7 also picks up the
  catalog check.

## [1.47.2] — 2026-08-19
### Added — the conventions file governs itself (owner: "make it happen automatically, or update the rules")
CLAUDE.md/AGENTS.md is injected into every session, so a stale line there
misleads at the highest leverage. Recognition is automatic through machinery
that already runs; the rules change at the moments that write conventions.
- **conform ladder `claude-md-anchors`**: every concrete anchor the conventions
  file names — backticked repo paths, `pnpm|npm run <script>` against
  package.json — is checked; dead ones surface in the session-start
  conform-check advisory and in `/sync`'s report. Globs, placeholders, URLs,
  absolute/`~` paths and route patterns are skipped; absence of the file is
  not a gap (that is `/doctor`'s business, #46).
- **WORKFLOW §6.1 rule**: conventions with anchors, never state (catalog),
  protocol (pointer), or queue (tracker); writers rewrite the superseded line
  in place — never append a second truth.
- **`/retro`**: facts land with an anchor, rewrite-in-place; a standing steer
  that proved durable graduates into the conventions file. **`/end`**: a
  session that renamed/deleted a named anchor rewrites the line now.
  **Reviewer DX lens**: a diff that kills a named anchor without updating the
  line is a finding — gated like a catalog row.
### Tests
- 2 conform-check hook cases (dead script + dead path → gap, with globs/URLs/
  placeholders skipped; resolving anchors → silent). Verified against orderly's
  real 19 KB CLAUDE.md: clean, no false positives.

## [1.47.1] — 2026-08-19
### Fixed
- **`/groom` detects hand-written backlog files itself** — `BACKLOG.md`,
  `docs/product/backlog.md`, `TODO.md` with checkbox items, an item-level
  `.plans/roadmap.md` (`R-NN` rows / SHIPPED·DEFERRED tables) — the same
  detection the conform ladder uses; `--from` only overrides the path. It asks
  once before creating issues when a human is present (`--dry-run` answers
  without asking), records the §10 Issue tracker row when the remote is GitHub,
  and treats an item-level roadmap's SHIPPED entries as no-op and DEFERRED ones
  as closed issues linking the decision doc. Owner: "why do I have to specify
  --from — shouldn't groom know?" It should; now it does.

## [1.47.0] — 2026-08-19
### Added — recognize and conform: a project on an older structure is told, and `/sync` fixes it
Owner ask: after #39/#40 a project adopted on v1.43 kept running on v1.46 with
ledgers lacking the budget fields (the overrun stop could not fire), no
Staging/Issue-tracker rows, no catalog, no roadmap epic view, a hand-appended
backlog — and nothing said so; `/sync` only re-copied WORKFLOW.md, and only when
a human remembered.
- **`tools/conform.mjs`** (ships in the plugin; filesystem-only, instant): a
  versioned ladder of structural expectations — protocol stamp vs installed
  plugin; §10 **Staging** / **Issue tracker** rows; active ledgers (open beat,
  not `Closed:`) carrying `Estimate:`/`Sessions used:` and exactly one `Next
  up:`; `docs/product/roadmap.md` without per-item status; a generated (not
  hand-written) backlog view; `tools/catalog.mjs` present and identical to the
  plugin's; the `docs/product/catalog/` files; the engineering folder. Each gap
  names its fix. `--brief` (≤3 lines), `--json`, `--strict`. New §10 **Catalog**
  row: `none — <why>` opts a repo with nothing to derive out of the catalog gaps.
- **conform-check hook** (`SessionStart` `startup|resume`, never `compact`):
  runs the ladder once per session and injects the ≤3-line advisory pointing at
  `/agentic-workflow:sync`; silent when not adopted, conformant, or node/the
  script is missing; always exit 0. 8 hook-test cases; the SessionStart matcher
  invariant now reads "compact alone; every other group `startup|resume`".
- **`/sync` applies the same ladder** (new step 0 measures, step 3.7 conforms,
  idempotent): appends missing §10 rows with detected values, adds ledger
  budget fields (`k` = done sessions, `N` = an honest floor) and dedups `Next
  up:` (renaming superseded lines), seeds the roadmap epic view, copies/refreshes
  `tools/catalog.mjs` + `features.md`, and hands off to `groom`/`adopt` for what
  needs the tracker or a seed; re-runs the ladder into its report. `/check`
  gains a conformance step.
- This repo conformed itself (Catalog: none; budget fields on the last open
  ledger); the ladder reads clean here.
### Fixed
- `conform.mjs`: JS has no `\Z` — the §10 section regex truncated at the first
  capital Z; end-of-input is `(?![\s\S])`. Caught by the "conformant → silent"
  hook case.

## [1.46.0] — 2026-08-19
### Added — one queue, the product catalog, catalog-driven marketing
Owner asks after v1.45.0, all found while trying to pick one feature in a
venture: the backlog was append-only and lied (123 KB, 119 open boxes, shipped
items still "open"); roadmap and backlog overlapped with no owner; nothing said
what the product IS (1,848-line CHANGELOG as the only inventory; 304 routes and
a 158 KB schema never derived), so sessions built on old knowledge; landing
copy was written from a noisy changelog. Nothing removed.
- **The queue (§4).** Every open item is an issue in the §10 **Issue tracker**
  (`type/*`, `size/*`, `epic/*`, `surface/*`); markdown backlogs are generated
  views; the roadmap (`templates/roadmap.md`, `docs/product/roadmap.md`) holds
  epics + owner ranking only. New **`/agentic-workflow:groom`**: probe every
  open issue against the tree (anchors, merged commit ancestor of the default
  branch, behavior), close shipped **with quoted evidence**, flag stale, re-size,
  regenerate the view; `--from BACKLOG.md` imports a markdown backlog once.
  `/next` recommends ONE queue item; `/operate` and `/retro` file issues;
  `/fix` and `/mission` take an issue (`Closes #N`); `/end` files unqueued work
  and commits scratchpad guardrails (LA-4); `/bootstrap` seeds labels + roadmap;
  `/adopt` recommends the import.
- **The catalog (§6.1) — what the product IS.** `tools/catalog.mjs` (shipped
  in the plugin, copied into ventures by `/bootstrap`/`/adopt`/`/sync`)
  derives `docs/product/catalog/api.md` (routes: method, path, auth class,
  handler — Nuxt/Nitro file convention) and `data-model.md` (Prisma models,
  fields, relations, enums) deterministically, so `git diff` is the API/model
  change log; `--check` fails when stale; `--verify` fails when a
  `features.md` anchor no longer resolves; `README.md` (≤40 lines) is the first
  read of any session. Curated `features.md` (`templates/catalog-features.md`):
  one row per capability, **rewritten in place** — `status · marketable ·
  audience · current behavior · anchors · last change · benefit`; the
  chronicler owns all but `benefit` (marketing's). Consumed by `/start`,
  `/next`, the compact-resume directive, the planner's briefs (rows whose
  anchors intersect the reads), the builders (read the row before touching the
  anchor), and gated by the **reviewer** (route/schema/anchor change without a
  catalog update → REQUEST CHANGES). Verified on orderly's tree: 304 routes,
  68 models, 28 enums in 0.1 s.
- **Marketing reads the catalog, not the changelog.** Landing page, launch
  assets, the sales kit's `data:capabilities` and "What's new" draw facts only
  from `features.md` rows with `marketable: yes` + `status: live`; the
  reviewer flags a claim with no backing row.
- Hooks: the docs-reminder names the catalog on route/schema edits when
  `tools/catalog.mjs` ships; compact-resume adds `catalog/README.md` as re-read
  item 3 when it exists (byte-for-byte otherwise). Both hook-tested.
### Tests
- `tools/lint.mjs` check 10.5 delegates to `catalog.mjs --selftest` (bundled
  fixture: 5 routes incl. `:id`/`*slug`/ANY, 2 models + enum, determinism,
  `--check` staleness, `--verify` failures, stub output without conventions).
- `hook-test.mjs`: 6 cases (docs-reminder × 4, compact-resume × 2).
- `evals/scenarios/reviewer-checkpoint`: fixture ships the catalog with row F-1
  anchored on `src/server.js`; the planted branch changes it without a catalog
  update → new `catalog-gate` criterion.
### Docs
- `templates/WORKFLOW.md` §4 (the queue), §6.1 (the catalog), §7 (DoD:
  catalog current), §3 (docs-reminder row), §10 (Issue tracker row), quick
  reference; repo `docs/WORKFLOW.md` re-synced to v1.46.0.

## [1.45.0] — 2026-08-19
### Changed — missions converge: one session by default, a hard overrun stop, staging → verify → PR
The owner disabled the plugin on 2026-08-19: missions ran 24–48 h, results
degraded, one mission took 38% of the weekly Fable quota. The causes were
measured in a venture's own retro (orderly `docs/WORKFLOW.md §12` LA-1..LA-9)
and each fix below names its incident. Nothing was removed; every change is a
mechanism the incidents lacked.
- **A mission is one session and one one-shot review by default.**
  `/agentic-workflow:mission` gains a `phases` opt-in; without it the planner
  writes one brief and `Estimate: 1 session`. `/plan`, `/start`, the planner
  and the mission templates follow.
- **Estimate + overrun stop (LA-1: 18 sessions planned, ~44 run over ~28 h, no
  choice offered).** The ledger header carries `Estimate: N sessions` and
  `Sessions used: k` (incremented write-ahead at every brief, corrective,
  `continue` and loop tick). New hook `hooks/lib/mission-budget.sh`
  (UserPromptSubmit) prints `Mission <name> — session k/N` every turn and, at
  **k ≥ 1.5 × N** (integer `2k ≥ 3N`), 🛑 OVERRUN on every prompt until the
  estimate is revised — a protocol STOP for the orchestrator (scope decision:
  subset / revised estimate / abort), never a hook block. Autopilot inherits it
  (flight plan `Estimate:`; `Sessions used:` incremented per stage step).
- **Exactly one `Next up:` (LA-7).** The hook reads the FIRST line (`head -1`)
  and warns loudly on duplicates. The thread-keeper (which read the LAST and
  fed the owner a checkpoint-stale status for a day) is superseded by
  mission-budget.
- **No standing agents (LA-5: six supervisor beats ≈ 1.08M tokens vs 70k for
  the one-shot review that found the real defects).** Reviews, counsel and
  audits are one-shot spawns at decision points; a resident agent needs an
  explicit `Standing agent authorized:` owner line, decisions-only beats, cost
  re-quoted every ~3 beats. The reviewer flags violations and checks the
  budget fields. Model tiering unchanged.
- **Write-ahead at every merge and gate (LA-6).** Ledger written at each merge
  to staging, verify result, review verdict, PR opened — never only at session
  end.
- **Staging → verify → PR to main (venture flow).** On APPROVE a phase merges
  into `staging` (created if absent; new §10 **Staging** row), the staging
  deploy is confirmed green on the diff-bearing commit (LA-8), `/verify` runs
  against the staging URL, and only then the PR to the default branch opens.
  `batch` accumulates on staging. `/verify` documents both moments;
  `/bootstrap` detects the row; `/doctor` checks it.
- **Impeccable as a checkpoint gate, not a per-turn feed** (orderly: the Stop
  "deep pass" fired 110× in one mission transcript inside a loop that worked
  every hint). Builders run the detector once at hand-off and do not loop;
  the reviewer runs it once per checkpoint and classifies findings
  blocking/advisory — only blocking may drive REQUEST CHANGES. Presence probe
  now recognises the skill install (`.claude/skills/impeccable/`) and the npm
  binary, not only `installed_plugins.json` (which is why the plugin's own
  wiring never fired in orderly). §0.2 tells ventures to quiet the Stop hook
  for autonomous runs; `/doctor` reports the cadence.
- **Hook hygiene.** Every hook in `hooks.json` now carries a `timeout` (5 s;
  30 s compact-resume).
### Tests
- `tools/hook-test.mjs`: 10 mission-budget cases (silence without a ledger,
  under/at/over the 1.5× boundary incl. 26/18 vs 27/18, N=1 fires at the 2nd
  session, duplicate `Next up:`, missing/garbage fields, newest-ledger wins).
### Docs
- `templates/WORKFLOW.md` §3 (mission-budget row), §4, §5 (convergence rules,
  gate policy after staging), §0.2 (probe + cadence), §10 (Staging row), §11
  (autopilot inherits); repo `docs/WORKFLOW.md` re-synced to v1.45.0.

## [1.44.0] — 2026-08-16
### Fixed
- **The L3 clock guard was 25/44 wrong on the corpus that exposed it; it is
  now 0 wrong on 69 cases — and the fix is a
  method, not a regex.** `when:` must name an observable state, never a clock.
  That rule had accreted three `^`-anchored branches, one per incident
  (ckpt-p1 `every 10 minutes`, ckpt-p2 `every day`, ckpt-p4 `after 2 weeks`),
  each verified only against the cases its author had in mind. Measured against
  a corpus built from outside the implementer's head, the result **missed 10
  real clocks** (`after two weeks`, `after three days`, `in three days`, and
  every trailing-clause form — `once CI is green, every day` sailed through)
  while **wrongly blocking 15 honest conditions** (`after the sprint review is
  signed off`; `after a second live-only defect reaches main`, which is OB-11's
  own condition one word away — `second` is an ordinal as well as a unit). One
  `clockLeak()` now decides every form: **any** clause that is exactly a bare
  time word is a finding, and the patterns are judged in every clause,
  end-anchored — the anchor is what keeps time-words-as-noun-modifiers out.
  Two narrower bare-word rules were tried and discarded first, each caught by a
  pre-merge lens: head-or-tail position let `once CI is green, weekly, and the
  PR merges` through, and a count-of-exactly-one let `weekly, monthly` through
  — a condition with no observable clause at all. The surviving rule carries
  one **accepted false positive**, stated in the code rather than hidden: a
  condition that *enumerates* the banned words is now rejected too, because
  nothing reliably separates mentioning a clock from stating one. A false
  positive argues with an author; a false negative parks a promise nothing will
  ever fire. The residual gaps are enumerated in the code
  rather than papered over: a trailing qualifier (`every day at 09:00`),
  weekday and quarter names, bare ISO dates, adverbial forms (`overnight`,
  `twice a week`), and clauses joined by `then`/`or`/`unless`. Those are
  measured decisions — the first is structural, the rest were judged not
  worth matching words that appear in honest conditions ("the Friday
  deploy", "the Q3 numbers"). Not every gap was a decision: a pre-merge
  review found three plain oversights — `each` absent beside `every` in the
  cadence branch, `fortnight` absent from the unit list while `fortnightly`
  was already a banned bare word, and `a couple of` absent while `couple of`
  was present — closed with harness cases in both directions; and postfix
  durations (`2 weeks from now`, `30 days out`) remain open as OB-16 rather
  than as a silent hole.
- **The settle ladder's carrying-commit command returned the wrong commit in
  the only case it exists for.** `git rev-list --ancestry-path --reverse` was
  verified against two branches that both had their own merged PRs — the
  ordinary rung-1/2 path — never against the no-PR absorbed-as-ancestry
  sub-case the recipe was written for. There it returns an intermediate
  feature-branch commit that never reached the default branch and has no CI
  run, so `gh run list --commit` returns `[]` and a green branch is surfaced
  forever. A first correction (`--merges --topo-order`) survived a synthetic
  seven-topology matrix but failed on this repo's own nested-merge history —
  phase merges land on a mission integration branch before a PR carries them
  to the default branch, so for real tip `b36003e` it returned `4262217` (a
  `merge(P1)` on the integration branch, zero CI runs) instead of `513e40a`
  (the PR #33 merge, CI green). The shipped recipe walks the default
  branch's **first-parent line** oldest-first and returns the first commit
  containing the tip, verified against three real absorbed tips, two real
  direct-merge PRs, and the tip-is-head case. The recipe's claim that empty
  output means "not an ancestor" was also false: it means the tip IS the
  head.
- **`checkClosing`'s promotion-ref guard accepted `→ OB-` with no integer**, so
  a `[~]` row could promote to nothing and still clear the close gate.

### Added
- **`tools/lint-test.mjs` — a behavior harness for the clock guard**, wired
  into the gate as `checkClockGuard` and fail-closed on a missing harness
  (`checkHookBehavior`'s shape). 69 cases. Most come from a reviewer's
  counterexample, the original author's anti-overreach comment, or a real
  `when:` value in this repo; the handful the implementer invented are marked
  `(self)`/`orchestrator` in the file, because those are the ones least likely
  to catch the next mistake. Structural checks prove a row *parses*; this
  proves the guard *decides*.
- **A `version bumped + stamped` row in the mission-state `## Closing`
  template**, so the close gate that already refuses any unticked `[ ]` row
  refuses an unversioned **mission**. Scope stated plainly in `settle.md` §5:
  session-altitude ships have no ledger and are not covered — that half is
  registered as OB-12.
- **A >140-**codepoint** case in `tools/hook-test.mjs`**, pinning why
  `obligations-due.sh` slices with `jq` rather than `printf '%.140s'` (bytes,
  which splits multibyte characters). Proven discriminating: byte-slicing the
  fixture yields invalid UTF-8 and the case fails.

### Notes
- **`depends-on: OB-<n>` was built, reviewed, and reverted before merge.** Five
  review lenses found it inert in every documented authoring shape: the tail
  was pushed off its `$` anchor by the mandatory `· fired …` append, and the
  indented-continuation form its own architecture memo recommended was
  invisible to both the row grammar and the raw scan. It returns as its own
  change, registered as OB-13, with the positive-capture test the DX memo asked
  for (the architecture memo recommends the shape; the capture rule is the DX
  memo's).
- **Deviation from the release convention, recorded rather than hidden.** The
  local amendment (2026-07-08) requires every `feat:`/`fix:` commit to bump
  `plugin.json` and stamp the version in its subject. The manifest is bumped once, at
  `936aad7`; the commits before it predate the bump and four `fix:` commits
  after it (`c75fc31`, `495b903`, `7ca5c1e`, `7ce7b41`) carry no stamp either. The branch is unmerged, so
  a rebase is technically available; the reason not to is stronger than
  convenience — five of its SHAs are cited as evidence inside the register's own
  fired rows, so rewriting them would invalidate the record this PR just
  repaired. The same amendment's second clause (bump the `mission-batch-gate`
  fixture's protocol stamp alongside) is also unmet: that stamp reads v1.32.0
  and is pre-existing debt, named here rather than left implied. Note the same convention was already missed by
  `75f5461` and `6fe8c4e`, which is what OB-12 exists to fix.

## [1.43.0] — 2026-08-11
### Added
- **Deferred obligations get a home, a prosecutor, and a refusal (v1.43.0,
  Phases 1–3).** The owner's diagnosis drove this mission: *everything done
  correctly had an immediate trigger; everything missed was deferred with
  nothing to fire it.* Four pieces, in order: (1) a `## Closing` block
  (mission-state ledger template) and `.plans/OBLIGATIONS.md` register
  (`templates/obligations.md`) hold deferred obligations in a fixed grammar —
  `do:` / `when:` (an observable condition, never a clock) / `probe:`
  (command or `manual`) — plus two mutation-proved lint checks (13
  `checkClosing`, 14 `checkObligationsRegister`, legacy-tolerant: the five
  pre-existing ledgers pass byte-unchanged). (2) `/agentic-workflow:settle` —
  a new command that inventories every open obligation, probes each against
  a four-rung deploy-green ladder (degrading fail-closed when a repo has no
  CI/deploy signal), fires the safe class (`git branch -d`, never `-D`;
  remote deletes only for branches merged to the default AND condition-green,
  dry-run listed and confirmed first), and writes back fired rows with
  `· fired <date> (<evidence>)` — rows are never deleted. Dogfooded live on
  this repo: **41 merged local + 15 merged remote branches reaped** (rung-2
  evidence — merge PR → merge commit → CI green — per branch) plus 2 stale
  worktree registrations pruned, with a `[STRICT]` checkpoint auditing every
  deletion against `git reflog` and `gh api` and confirming zero unmerged,
  protected, or open-PR branches were touched. (3) `hooks/lib/obligations-due.sh`
  — a new `SessionStart` (`startup|resume`, never `compact`) advisory hook
  that greps register + Closing-block unticked counts and names
  `/agentic-workflow:settle`; four silencers (no obligations, zero unticked,
  once per session, exit 0 always); no network, no probes. This repo's own
  governance-hook count goes five → six. (4) A close-gate refusal wired into
  `end.md`, `mission.md`, and `check.md`: a mission with unresolved `## Closing`
  rows may not be reported closed — "zero open PRs" is explicitly not treated
  as a completeness signal — enforced both procedurally (the command step)
  and structurally (the `Closed:`-stamp lint check vetoes a stamp written
  over any remaining `[ ]` row). A human ruling during the mission
  clarified the boundary: ephemeral, in-session cadence requests (e.g. "post
  updates every 10 minutes") are deliberately NOT parked — the register is
  for obligations that outlive a session, not a durable-obligation
  impersonation of a timer. Harness grew 64 → 73 cases; three checkpoints
  (`ckpt-p1`, `ckpt-p2` `[STRICT]`, `ckpt-p3`) all returned APPROVE with zero
  corrective sessions. (deferred-obligations mission, Phases 1–3, `4262217`
  / `5daf851` / `c90f1fa`)
- **Handoff-budget nudge — write the session handoff before compaction takes it
  (v1.42.0).** New `hooks/lib/handoff-budget.sh`, registered under
  `UserPromptSubmit`: watches cumulative transcript bytes (a loose proxy, not a
  token count) and nudges (≤3 lines) to write/refresh
  `docs/product/session-handoff.md` once they cross an advisory (3,700,000 B) or
  urgent (5,380,000 B) band — both derived from the one true compaction observed
  in this repo's own transcript corpus (n=1, the conservative floor; the caveat
  ships in the constants' comments). Four silencers keep it deterministic: fires
  at most once per band per session, silent while an active mission ledger
  exists, silent once the handoff is already newer than the crossing, and — like
  every hook here — it never blocks. This repo's own governance-hook count goes
  three → four; called out plainly because the mission's own prior audit
  (context-economy A5) found the machinery's own footprint already a bigger
  context cost than anything a savings lever could offset, so each addition is
  disclosed rather than assumed free. (compaction-continuity mission, Phase 1,
  `c2e4648`)
- **`compact-resume.sh` no longer goes silent with no ledger — it falls back to
  the handoff, then to a "the record is missing" directive (v1.42.0).**
  Previously the hook emitted nothing unless an active mission ledger existed.
  It now branches three ways: an active ledger still gets byte-for-byte the same
  directive as before; no ledger but `docs/product/session-handoff.md` exists
  gets a directive naming the handoff and stating its freshness (`CURRENT` only
  if provably newer than the transcript's last append, else `SUSPECT`, fail-closed
  on a missing/unreadable transcript) with an instruction to verify against
  `git log`/`git status` before trusting its Next; neither record exists gets a
  distinct directive naming `git log -5`, `git status`, and `.remember/now.md`,
  telling the agent to report the gap to the human rather than proceed on the
  compaction summary alone — never to author a handoff on the spot. The handoff
  template also gained a one-line `_Written: <ISO> · session <id> · branch <b>_`
  provenance stamp, preferred over file mtime when present. (compaction-continuity
  mission, Phase 2, `488b87a`)
- **`Read` advisory threshold named (`READ_ADVISORY_LINES = 800`), plus a §6.2
  paragraph on delegating large reads (v1.42.0).** The whole-file-read nudge's
  threshold was a bare `800`; it now carries a name and a comment citing its
  evidence base. Both WORKFLOW mirrors gain a **Delegated reads** paragraph
  stating the interactive case explicitly: prefer handing a large read to a
  subagent that returns a distillate over pulling the corpus into the window it
  is trying to preserve. No figure, no percentage, no gate — this lever is
  **unmeasured** in this repo (no corpus exists to confirm an effect size), and
  the text says so rather than implying one. (compaction-continuity mission,
  Phase 3, `a14615f`)
  - Harness coverage across the mission: `tools/hook-test.mjs` grew 33 → 64
    cases; every behavior above is mutation-proved with an anti-inert control;
    three checkpoints (`ckpt-p1` [STRICT], `ckpt-p2` [STRICT], `ckpt-p3`) all
    returned APPROVE with zero corrective sessions.
- **Standing steers + `Next up:` two-site drift guard (v1.42.0).** The
  mission-state ledger template gains a `## Standing steers` block — human
  decisions captured verbatim at checkpoints only (never mid-brief), retired
  by strikethrough, never deleted — plus a `mission.md` §3 append rule and a
  `checkStandingSteers()` lint check (validates only ledgers that already
  carry the block). A new `checkNextUpAgreement()` lint check fails the gate
  when a ledger's two `Next up:` sites (header banner + handoff-trailer) name
  different beats — closing a drift that had bitten this ledger three times.
  (context-economy mission, Phase 2, `68c6e26`; corrective `939c287`/
  `a4a4cd9`; `ckpt-p2` APPROVE, merged `e5b6326`)
- **Beat-enforcer `Stop` backstop scans for the first *due* beat, not just the
  first candidate (v1.42.0).** Previously any HELD or unreleased-blocker row
  above an open checkpoint/reviewer/chronicler beat silenced the nudge for
  every beat beneath it. The backstop now steps over parked (HELD/⛔/HARD
  PAUSE) rows and nudges the first genuinely due one; an unreleased ⛔/HARD
  PAUSE barrier still blocks every candidate beneath it. The `PreToolUse`
  closing-action enforcer does **not** yet carry this fix (tracked open item —
  it still nudges the first `[ ]` candidate regardless of due-ness).
  (context-economy mission, Phase 2/3, `d09090b`, `8e4618f`; `ckpt-p2` merged
  `e5b6326`, `ckpt-p3` [STRICT] merged `8a3b4c7`)
- **`SessionStart:compact` re-read directive (v1.42.0).** New
  `hooks/lib/compact-resume.sh`, matched only on `SessionStart` with matcher
  `compact`: after a mid-session compaction, it emits a short directive
  telling the agent to re-read the active `.plans/*.state.md` ledger and
  `docs/product/session-handoff.md` verbatim, and to honor the ledger's
  `## Standing steers`. **No longer silent with no active ledger** — since
  compaction-continuity Phase 2 it falls back to the handoff, then to a
  missing-record directive (see the three-branch entry above); never blocks. A
  correctness fix, not a cost lever — this repo's own governance-hook count
  goes from two to three (WORKFLOW §4 and both READMEs updated to match).
  (context-economy mission, Phase 3, `d09090b`; `ckpt-p3` [STRICT] APPROVE,
  merged `8a3b4c7`)
- **`tools/context-attrib.mjs` names four attachment kinds it previously
  collapsed into `attach: other`, and prints a mission-machinery footprint
  table (v1.42.0).** `deferred_tools_delta`, `agent_listing_delta`,
  `mcp_instructions_delta`, and `invoked_skills` are now their own reported
  categories (additive re-bucketing only — no sizing logic changed). A new
  per-attachment-kind table and a named `mission machinery footprint` line
  (`hook_success` + `hook_additional_context` + `task_reminder`) make the
  plugin's own hook output measurable for the first time. The reviewer-return
  trigger threshold is now a named constant (`D7_TRIGGER_PCT`) pinned by
  selftest cases in both directions, replacing a bare literal duplicated
  across three prose strings. `--selftest` case count: 44 → 54.
  (context-economy mission, Phase 4, `04df14a`)
- **Bounded-writes contract text (WORKFLOW §6.2), and a PR-body line in the
  `chronicler` contract (v1.42.0).** Both WORKFLOW mirrors now state
  explicitly: the orchestrator authors only the ledger and edits of ~15 lines
  or fewer; any longer document is authored by a subagent and returned as a
  path, not as content. `chronicler` now also authors PR bodies (`gh pr
  create --body-file`), closing a gap where that document previously
  transited the orchestrator's own context uncounted. No tool-list changes.
  (context-economy mission, Phase 4 — residue of the dropped Phase 1,
  `41f046a`)
- **`docs/product/engineering/context-economy-metrics.md`** — the
  engineering-economics record of what the `context-economy` mission actually
  measured against its own founding claim, including ten lettered findings
  from an independent audit. (context-economy mission, Phase 4, `2cec196`)
### Docs
- **The `context-economy` mission wraps at Phase 4; Phase 1 dropped, not
  shipped (v1.42.0).** The mission's founding premise — sized on orchestrator
  `Write`/`Edit` — was retracted once the measuring instrument was repaired
  (Phase 0.5); Phase 1 (a write firewall built on that premise) was dropped
  rather than built on a retracted number, and its only surviving residue is
  the discipline text listed above, which carries no savings claim. Full
  honest numbers, method, and caveats:
  `docs/product/engineering/context-economy-metrics.md`. (context-economy
  mission, D15 `4720f56`; Phase 4 measurement `de78e84`/`2cec196`)
### Fixed
- **Docs no longer claim a `/loop` tick gets fresh context.** The false claim that each
  tick of an unattended `/loop` run starts with a clean context window is corrected
  across the plugin protocol (`commands/mission.md`, `commands/autopilot.md`), this
  repo's synced `docs/WORKFLOW.md`, the plugin `README.md`, and unpublished launch copy
  (12 sites total, one consistent wording). The real mechanism: `/loop` is
  session-scoped — ticks accrete in one transcript; genuine fresh context requires
  `/clear`, a new session, or a scripted `claude -p`. What makes loop mode safe is that
  state lives in files, not that context resets. (context-economy mission, Phase 0 S1,
  `03dea55`)
### Added
- **`tools/context-attrib.mjs`** — a zero-dependency, streaming (`node:readline`)
  context-attribution measurer for session transcripts: reports a category-share
  breakdown (human steers, orchestrator prose, authored Write/Edit/Bash, tool results,
  subagent returns, attachment types, unattributed residual) plus a per-`subagent_type`
  return-share table, with a `--selftest` fixture and a fail-closed `checkContextAttrib()`
  gate wired into `tools/lint.mjs`. Operators: **three invocation forms** —
  `node tools/context-attrib.mjs <transcript.jsonl>`, `--selftest`, and
  `<transcript.jsonl> --context-total=<tokens>` (runs the 15% validity gate against a
  recorded `/context` TOTAL); the script never loads or prints transcript content.
  (context-economy mission, Phase 0 S2/S3-fix, `8fa357d`, `dca7072`; Phase 0.5 repair,
  `74f4507`, `c6f0218`, `4288280`)
  - **Phase 0.5 repaired the instrument, and the repair moved the headline numbers.**
    The Phase 0 baseline's "TOTAL 2,108,485 tok vs. a 5.59× divergence from 377.4k"
    finding is **RETRACTED** on two counts, both of which were measurement defects
    rather than findings about the sessions:
    - A single `prompt = 0` usage record zeroed the running prompt series, so the next
      real request re-billed the whole resident context as fresh churn. Guarded (the
      record is now skipped as a prompt observation, counted, and reported), churn
      falls to **1,707,036 tok** — the phantom was 401,449, not the 513,634 originally
      predicted, because 112,185 of that growth was genuine and is retained. (`74f4507`)
    - The 5.59× compared the prompt series against `/context`'s **`Messages`
      sub-total** (377.4k), which omits system prompt, tool definitions, memory and
      skills — quantities the prompt series does include. Against `/context`'s **TOTAL**
      (401,400) the correct comparison is occupancy, not churn. (`4288280`)
  - **Tokens are now an estimate with a stated band; characters are the primary
    figure.** A zero-dependency output-side envelope estimator derives a
    **1.99 – 3.24 chars/token** band (per-request `persisted assistant chars ÷
    output_tokens`, each sample a floor); every token column prints as a range tagged
    `[EST/BAND]`, never as a point value. Character counts (Σ 2,659,518 appended chars
    on the baseline corpus) are counted, model-free and exact. The band is measured on
    model-authored output and its transfer to input-side categories is disclosed in the
    report. (`c6f0218`)
  - **The sanity check is now an explicit gate, and it FAILS — reported, not tuned.**
    `--context-total=401400` compares occupancy against the recorded `/context` TOTAL:
    final prompt 513,634 tok = **+28.0%**, max prompt 999,816 tok = **+149.1%**, both
    outside ±15%. Published as an open validity finding: category **shares** remain the
    robust output; absolute token figures carry their band and the unresolved
    occupancy divergence. (`4288280`, baseline re-run `ab2ec04`)
- **Sales-enablement kit + living-document architecture (v1.41.0)** — a client-closing
  sales kit and the machinery to keep it current as the product ships (planned via
  `/agentic-workflow:plan` → a 6-phase mission; a 4-expert council + architect shaped it):
  - **The sales kit** (`docs/product/sales/`, 9 templates): a `feature-benefit-catalog`
    (the living substrate), a `playbook` — the "how to present the product" coaching doc
    (talk track, discovery questions, demo choreography, objection handling, tone) — a
    `sell-sheet` (client leave-behind), plus `objections-faq`, `battlecard`,
    `discovery-guide`, `demo-script`, `proof-points`, and a `sales-kit` index. `marketing`
    owns `sales/`; every claim traces to `positioning.md`, prices only reference
    `business/pricing.md`, and `proof-points` never invents a number.
  - **Living-doc mechanism (facts auto-flow, claims stay gated).** Docs carry
    `<!-- data:X -->` marker regions; the `chronicler` rewrites ONLY inside them every ship
    from CHANGELOG/ledger (facts, PR-cited, benefit column left `_unwritten_` — it never
    authors a claim); `marketing` fills the benefits at its evidence-gated beat. A new
    `tools/marker-test.mjs` fixture, wired into the lint gate, makes "wrote a claim" or
    "touched bytes outside a marker" a **failing test** — the client-facing sell-sheet can
    never ship a raw `_unwritten_` sentinel.
  - **Template frontmatter convention** — every template carries `{status, owner-agent,
    refresh-trigger}` (living / semi-static / frozen), enforced by a new
    `checkTemplateFrontmatter` lint (incl. the fail-closed `frozen ⇒ never` rule). Records
    (`idea.md`'s original bet, the decision log) stay **frozen** — never auto-rewritten.
  - **docs/ reorg + gap-fills** — engineering docs move to `docs/product/engineering/` via
    an **idempotent `/agentic-workflow:sync` migration** (reported + HITL-staged, silent
    no-op when already foldered); new `runbook` (V4) + `tracking-plan` (V3) templates fill
    protocol-named gaps; pricing/problem/claims are single-sourced (references, not
    restatements). Template *sources* stay flat-prefixed; the deployed folder tree comes
    from the writing agents' paths. `/agentic-workflow:adopt fill`, the stage-gap audit,
    and `/agentic-workflow:next` recognize the new deliverables (sales kit V3+, runbook
    V4+, tracking-plan V3+) so existing projects can discover and back-fill them.
### Fixed
- **Beat-enforcer no longer nudges about already-reviewed beats (v1.39.2).** Both
  beat-enforcers — the `Stop` backstop and the `PreToolUse` closing-action nudge —
  matched any unchecked `[ ]`/`[~]` checkpoint/reviewer/chronicler row, including a
  `[~]` checkpoint already marked **APPROVED** and only awaiting a human merge. That
  fired a spurious "spawn the reviewer" nudge every turn-end for work already done
  (the residual false-positive left after the v1.39.1 loop fix). Both now exclude
  beats whose row carries a **bold** approved / awaiting-human status marker
  (`**APPROVED**`, `**merge pending human**`, `**…wrap pending**`, …) — anchored to
  the bold form so ordinary feature text that merely mentions "approved" still
  nudges — so only a genuinely-unreviewed beat fires. Locked by the new hook
  harness below.
- **Beat-enforcer `Stop` hook no longer loops (v1.39.1).** The governance Stop
  hook emitted a soft "beat pending" nudge but lacked the `stop_hook_active`
  guard, so Claude Code re-fired it on every stop attempt — an infinite nudge
  loop on any project with an active `.plans/*.state.md` ledger holding an
  unchecked checkpoint/chronicler/reviewer row, until the stop-hook block cap.
  It now checks `stop_hook_active` first and exits silently on a re-fire, so it
  nudges once and lets the turn end (still never blocks — `exit 0` only).
### Added
- **Hook dispatch test harness (`tools/hook-test.mjs`) — tier-1.5.** Structural
  lint proves hook commands *parse* (`bash -n`); it can't prove they *behave* —
  the v1.39.1 Stop-loop shipped green past a syntax check. The harness pipes
  fixture stdin through each `hooks.json` command in a throwaway cwd and asserts
  its exit code + emitted nudge. Wired into `tools/lint.mjs`, so the single gate
  CI runs now covers hook behavior; regression cases lock the `stop_hook_active`
  re-fire guard and the approved-beat exclusion so neither bug can silently return.
- **Orchestrator governance** — a reflex layer plus two front-door agents that
  keep the orchestrator on protocol *and* on purpose:
  - **Three governance hooks** (advisory, never block): the **router** nudges an
    un-prefixed work request to route through the workflow (hand to `intake`);
    the **thread-keeper** surfaces the active ledger's phase + `Next up:` + first
    open beat each turn; the **beat-enforcer** nudges a required-but-unchecked
    ledger beat (`chronicler` at close, `reviewer` at a checkpoint) at the moment
    a session tries to close or advance.
  - **`intake` agent** — the front-door classifier for an un-invoked
    plain-language request: distinguishes work from chat, classifies altitude
    (mirroring `/agentic-workflow:next`), shapes the request, and returns the
    matching `/agentic-workflow:` route for the orchestrator to run. Reads and
    recommends only — never runs commands, spawns agents, builds, or merges.
  - **`compass` agent** — holds the venture's *direction*: owns
    `docs/product/north-star.md`, judges trajectory-vs-purpose at strategic beats,
    and on a concrete named strategic drift fires ONE gated **Alert-tier §12**
    owner notification (severity- and frequency-limited, secrets by name only,
    owner-only). It flags; it never decides, kills, builds, or merges.
  - **`templates/north-star.md`** — the Purpose (human-owned) + worthy-progress
    definition + live done-vs-roadmap rollup `compass` seeds and maintains.
- **`/agentic-workflow:ingest` runs from anywhere** — the commons is
  portfolio-global, so ingest resolves its target registry by `--registry
  <path|remote>` → the registry repo it is run inside (auto-detect, like
  `/agentic-workflow:operate`) → the current venture's §10 Portfolio row → a
  global default (`~/.config/agentic-workflow/registry`, else
  `$AGENTIC_WORKFLOW_REGISTRY`). Harvest a codebase without first adopting it
  as a portfolio project.
- **Portfolio Commons** — the §13 registry gains a writable, copy-holding
  **commons** surface (`commons/index.md` + per-type `commons/code/<slug>/`),
  so agents copy-and-adapt reusable first-party material across ventures and
  write improvements back — a library that compounds instead of every venture
  starting cold:
  - **`/agentic-workflow:ingest`** — harvests a reusable first-party artifact
    (code type first) into `commons/code/<slug>/`, pins provenance (source repo
    + commit), and writes its full §13 index entry, all as a delegable
    bookkeeping PR. First-party-only for now; a slug guard and a
    collision/refresh guard (`--refresh` re-harvests in place, else it stops
    rather than overwrite or duplicate) keep writes safe.
  - **`curator` agent** — owns the commons lifecycle: harvest, **single-best-
    match (k=1) brokering** (never a top-N dump), the freshness signal (stale on
    `last-reviewed` age OR source-advance, surfaced never auto-mutated), and
    write-back. Sole writer to the commons; does not decide product direction,
    ship product code, or merge.
  - **Frontend consults the commons** — inside its "orient first" beat, and only
    where a commons exists, the `frontend` agent reads the index, picks the
    single best match, copy-and-adapts (never blind-copies), and flags
    improvements for the curator to write back. Where no commons exists it
    proceeds exactly as before.
  - **Regression guard** — the paired `commons-warm` / `commons-cold` evals
    (auto-discovered by `evals/run.mjs`) become the feature's permanent guard:
    warm must consult-and-adapt, cold must not hallucinate a commons.
- Onboarding UX overhaul, from real test-user feedback (didn't know what to
  type, how to start, or why artifacts stayed empty):
  - **`/welcome`** — one guided front door: orients, detects where the project
    stands, then either walks the user through it (interview that *fills*
    idea.md/PRD/etc.) or drives it hands-off — ending with filled docs and the
    next step offered, not empty templates.
  - **Namespaced commands everywhere** — every command reference is now the
    resolvable `/agentic-workflow:<cmd>` form (the bare short form fails
    headless or when shadowed). A new lint rule **fails on any bare short-form**,
    so this can't regress.
  - **Recommenders offer to run the next step** — `/agentic-workflow:next`,
    `/welcome`, `/bootstrap`, and `/adopt` offer to invoke the recommended
    command (SlashCommand) so users don't type or namespace it by hand.
### Changed
- **Ledger `[~]` formalized as the "hands-off" state; beat-enforcers key on the
  glyph, not prose (v1.40.0).** Three explicit checklist states — `[ ]` not started,
  `[~]` in-flight / deferred / awaiting owner, `[x]` done — and both beat-enforcers
  now nudge ONLY on a not-started `[ ]` checkpoint/reviewer/chronicler row; `[~]`
  and `[x]` are silent. This retires the brittle bold-marker prose-matching
  (v1.39.2) in favor of an author-controlled glyph: change `[ ]`→`[~]` to park a
  beat and silence the nudge (the nudge text now says so). The `/agentic-workflow:mission`
  workflow auto-sets `[~]` when a review is in-flight and `[x]` on APPROVE, so it
  rarely needs a manual touch. Documented in WORKFLOW.md and the mission-state
  template; guarded by the hook harness (a plain `[~]`, which used to slip the
  prose-matching, is now silent).
- **Beat-enforcer hook bodies extracted to `hooks/lib/*.sh` (v1.39.3).** The two
  beat-enforcers (the `Stop` backstop and the `PreToolUse` closing-action nudge)
  moved from inline JSON one-liners into reviewable, commented scripts invoked via
  `bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/…"`. Behavior is byte-for-byte preserved —
  proven by the 11-case hook harness, which now dispatches the extracted scripts
  (it exports `CLAUDE_PLUGIN_ROOT`). `tools/lint.mjs` also syntax-checks
  `hooks/lib/*.sh`. First step of the "make the hook layer reviewable" hardening;
  the remaining hooks follow test-first, each with harness coverage before it moves.
- `tools/lint.mjs` parses the namespaced command form and enforces it.
### Added (earlier this cycle)
- Context firewall (§6.2) — protects the main agent from context-window bloat
  and the fidelity loss of auto-summarization. Two rules: **bounded returns**
  (a spawned agent hands back a ≤~15-line distillate — status/paths/signal/refs,
  not a transcript; wired into the `backend`/`frontend`/`security`/`devops`
  implementers and the `planner`) and the **fresh-self handoff** (new `/handoff`
  command + `session-handoff.md` re-read manifest: when a long interactive
  session's context fills, snapshot working state as pointers and continue in a
  fresh session that re-reads verbatim files — lossless where auto-summary is
  not). `/start` resumes from the manifest; a new advisory `Read` hook warns on
  large whole-file reads (prefer ranged reads / delegation). Generalizes the
  "ledger outlives the transcript" rule (§2) to interactive sessions.
- Publishing & distribution subsystem (§14) — the harness can now publish
  outward (socials, articles, mailing list, own-site/RSS) through a gated
  pipeline: `marketing`/`writer` **stage** posts into a publish queue
  (`publish-queue.md`), and `/publish run` **fires** them — human-fired by
  default, or a scheduled run within a scoped, dated, revocable `may-publish`
  §10 Publish policy. Every post lands in an audit log (`publish-log.md`) the
  `analyst` attributes funnel results against. New `/publish` command (connect ·
  stage · status · run), a fail-closed publishing guardrail hook (hard-blocks
  paid/ad-spend endpoints — never delegable — and gates organic posting), and a
  §11 amendment making **organic publishing the second delegable authority
  alongside merge** (paid and individual outreach stay never-delegable). Wired
  into `marketing`, `writer`, `analyst`, `/operate`, `/bootstrap`, `/connect`,
  and both READMEs.
- Definition-layer templates — the artifacts the builder roles need to
  understand WHAT and HOW to build, now first-class and evidence-grounded:
  `ux-brief.md` (the `designer`'s personas + journeys + IA, what `frontend`
  builds from), `architecture.md` and `interface-contract.md` (the `architect`'s
  living system docs — components/data-model/invariants and the frontend/backend
  boundary that keeps parallel slices from diverging). Both system docs hold
  intent and contracts only, pointing at the code index rather than re-narrating
  code (stale-doc rule, §8). Wired into `designer`, `architect`, `backend`,
  `frontend`, the PRD, WORKFLOW.md (§0/§6/§9), `/bootstrap`, and the READMEs.
- `brainstormer` agent + `/brainstorm` command — the workflow now owns the
  front edge of V0 (shaping a raw, fuzzy idea into 2–3 distinct framings for the
  human to choose between) instead of relying on an external brainstorming
  skill. Runs upstream of the `researcher`: brainstormer widens and frames, the
  human picks, the researcher validates the chosen frame. Wired into
  `/bootstrap`, `/next`, WORKFLOW.md (§0/§6/§9), and both READMEs.
- Execution-core templates — five deliverables the protocol named but never
  shipped as templates now do: the mission trio (`mission-plan.md`,
  `mission-sessions.md`, `mission-state.md`) authored by the `planner`, the V1
  `prd.md` (owned by `designer`/`architect`/`analyst`), and the architect's
  `decision-memo.md` option memo. Wired into WORKFLOW.md §9 and referenced by
  `planner`, `architect`, `designer`, and `/bootstrap` so agents start from a
  consistent shape instead of improvising. Lint validates every new reference.
- /plan — interview-driven feature planning in one command: the human
  answers batched questions with drafted options, the team (designer,
  architect, analyst, advisors, planner) produces the brief, journeys,
  option memos, metrics, counsel, and the mission trio; one consolidated
  approval; optional immediate /mission run.
### Docs
- Self-adoption: the repo now runs its own workflow — `docs/WORKFLOW.md`
  (§10 profile, stage V6), reconstructed CHANGELOG/JOURNEY, live status page,
  retroactive idea/business/launch docs, registered in the portfolio registry.
  Monetization locked-deferred (2026-07-08).

## [v1.30.0] - 2026-07-08
### Added
- Portfolio registry — one owner, many ventures. `/adopt` and `/operate` can
  now register a project as a row in a shared registry
  (`docs/product/registry.md` template), so one owner running several
  ventures gets a single roll-up instead of per-project silos. (PR #7)

## [v1.29.0] - 2026-07-07
### Fixed
- Owner-channel Slack flow: the DM composer step and emoji-reaction
  tap-to-decide path are corrected — gate decisions can be approved or
  rejected with a single emoji reaction instead of a full reply. (PR #6)

## [v1.28.2] - 2026-07-07
### Fixed
- `/connect` states its bootstrap precondition up front and its Slack scope
  list is corrected, so owner-channel setup fails fast with a clear message
  instead of silently at the first real gate. (PR #5)
- `/adopt` eval calibration and judge-retry hardening; manifest and fixture
  version stamps synced to 1.28.2. (PR #4)

## [v1.28.1] - 2026-07-07
### Fixed
- YAML-unsafe frontmatter values in agent/command files, plus a new tier-1
  lint rule that catches this class of error going forward. (PR #3)

### Docs
- README narrative gaps closed: loop mode, the protocol-upgrade story, and
  token-discipline guidance are now documented. (PR #2)

## [v1.28.0] - 2026-07-07
### Added
- Multi-project owner channel — a single Slack connection can now front
  notifications and gate decisions for more than one adopted project.

## [v1.27.0] - 2026-07-07
### Added
- `/connect` — interactive owner-channel setup with a round-trip test
  message, so a broken connection is caught at setup instead of at the
  first real gate.

## [v1.26.0] - 2026-07-07
### Added
- Owner channel: Slack notifications and remote gate decisions — the owner
  can approve or reject a gate without an open terminal session.

## [v1.25.0] - 2026-07-07
### Changed
- **Breaking:** command names shortened to single words, replacing the
  longer multi-word slash commands.

## [v1.24.0] - 2026-07-07
### Added
- `/tune` — per-project agent model upgrade/reset, so an operator can dial
  model tier per agent without hand-editing config.

## [v1.23.0] - 2026-07-07
### Added
- `/doctor` — machinery diagnosis with a fix mode.
### Fixed
- `/next` now always emits real values, never placeholder text.

## [v1.22.0] - 2026-07-07
### Added
- Loop mode, code-index integration, and token tiering — long-running
  sessions now discipline their own context and token usage.

## [v1.21.0] - 2026-07-07
### Added
- Optional `writer` agent, plus a project copy kit and glossary, for teams
  that want a dedicated prose/voice pass.

## [v1.20.0] - 2026-07-07
### Added
- Usability layer: `/next` router, a Quick Reference, and a Start-here
  README section — new operators can find the right command without
  reading the whole protocol first.
- Behavioral-design and gamification discipline as a standing rule: no dark
  patterns; rewards and progress indicators must map to real user progress.
- New agent roster (`architect`, `advisor`, `ops`, `analyst`) and new
  lifecycle commands, plus assorted command fixes.
- Guardrail hardening, a delegable merge policy, and autopilot brownfield
  support (autopilot can now adopt an existing project mid-run). (PR #1)

## [v1.16.0] - 2026-07-03
### Added
- Autopilot context discipline and continue mode — an autopilot run can now
  pause and resume without losing state.

## [v1.10.0 – v1.15.0] - 2026-07-03
Adoption and eval-suite foundation:
- `/adopt` — one-command adoption for existing projects, plus fill mode
  (drafts missing document deliverables). (v1.14.0, v1.15.0)
- Plan import and replan mode. (v1.13.0)
- `business` agent (model, pricing, executive summary + business docs) and
  its eval scenario. (v1.12.0, v1.12.1)
- Per-file launch deliverables and post-launch content plan. (v1.11.0)
- Tier-2 scenario evals (fixtures, rubrics, LLM judge, runner) and
  token-usage capture in eval results. (v1.10.0, v1.10.1)

## [v1.1.0 – v1.9.0] - 2026-07-03
Founding buildout — initial agent roster and execution machinery:
- Reviewer scorecard and high-stakes adversarial multi-vote review. (v1.9.0)
- `marketing` agent and GTM surface at V5/V6. (v1.8.0)
- Tier-1 deterministic lint + CI. (v1.7.0)
- Consistency pass and naming pass (plugin → agentic-workflow, skill →
  protocol, doc → WORKFLOW.md). (v1.6.0, v1.6.1)
- Altitude rename ("effort" → "mission"); `planner` agent and the mission
  command. (v1.5.0, v1.5.1, v1.5.2)
- `devops` agent and `/release` command. (v1.4.0)
- `designer` agent and autonomous mode. (v1.3.0)
- `researcher` agent for the V0 idea phase. (v1.2.0)
- Specialist implementer agents: backend, frontend, security. (v1.1.0)

## [v1.0.0] - 2026-07-03
### Added
- Initial release: Venture Workflow plugin — the founding V0–V6 lifecycle,
  the initial agent set, and the marketplace install path.
