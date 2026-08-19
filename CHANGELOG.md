# Changelog

All notable changes to the Agentic Workflow plugin marketplace are recorded
here, in [Keep a Changelog](https://keepachangelog.com/) format. This repo
has no tags — each version-stamped commit on `main` IS the release.

## [Unreleased]

_(empty)_

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
