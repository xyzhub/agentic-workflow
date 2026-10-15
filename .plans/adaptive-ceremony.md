---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: adaptive-ceremony — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide._

Converted from `docs/product/decisions/2026-10-13-adaptive-ceremony-brief.md`
(ACs AC-1..AC-13, designer journeys J1–J6, and the "Locked decisions" block
L1–L4 + plan conditions + brief corrections), 2026-10-13. Detail sources:
`…-memos.md` (D1–D6 and each memo's "Values this decision settles"),
`…-metrics.md` (§3 thresholds, §4 safety-regression definition),
`…-counsel.md` (technical conditions 1–6). The source files are untouched.
**Where a locked decision contradicts an acceptance criterion, the lock wins**
(brief "Brief corrections accepted").

Goal: every adopted project carries a derived, owner-editable **ceremony
profile** (a `Ceremony profile` row in §10 plus a `### 10.2 Ceremony` table of
stage artifacts and gates tagged `required | optional | skipped`), read by one
tool (`tools/ceremony.mjs`) from one gate-class taxonomy
(`templates/gate-classes.md`), consumed by mission, autopilot, `/next` and
intake — so low-ceremony projects stop paying for gates that buy them nothing,
while irreversible-class gates can never be skipped and every skip leaves one
deviation line.

Estimate: **6 sessions** = 3 builder briefs (S1, S2, S3) + 3 one-shot reviewer
checkpoints (ckpt-p1..p3), counted per WORKFLOW §5 LA-1 ("briefs +
checkpoints only"; a loop tick that runs a checkpoint bumps `Sessions used:`,
`commands/mission.md` 282–283). The owner's "3–4 sessions" (L1) meant
**builder** sessions — 3 briefs, with room for one corrective. A corrective
`S<n>-fix` is counted when it fires, never pre-booked. The overrun stop fires
at k ≥ 9 (1.5 × 6). Per phase (brief + checkpoint = 2 each):

| Phase | Sessions | Why one brief is honest |
|---|---|---|
| P1 — taxonomy + protocol data + counter | S1 + ckpt-p1 | prose + one data file + two lint checks + one ledger verb + one sync edit; no resolver code |
| P2 — the engine + guards | S2 + ckpt-p2 | one ≈250-line zero-dep tool + its harness, one ladder line, one anchored regex |
| P3 — the readers + dogfood + record | S3 + ckpt-p3 | prose rewiring in 10 command/agent files, one lint check, the `/sync` run on this repo, CHANGELOG + bump |

Target version: **1.61.0** (`plugins/agentic-workflow/.claude-plugin/plugin.json`
is at 1.60.0 on `main` at dc9bf34 — the §10 Version pin; the
`docs/WORKFLOW.md` line 3 stamp follows). If another release merges first,
S3 takes the next free minor and logs a deviation.

Missions pin: the Missions app (`xyzhub/missions`, local checkout
`/Users/baker/Playground/missions-app` at 9aa612c) vendors the plugin at
`vendor/agentic-workflow` with `vendor/VERSION` = **1.54.1**; its contract test
(`contract-tests/plugin-contract.test.ts`, 46 lines) and runtime check
(`packages/runner/src/plugin-contract.ts`) run against that vendored copy
only. This mission changes nothing Missions asserts (see Locked decisions,
"Missions-contract precondition"); the pin bump to ≥ 1.61.0 is Missions' own
change and is a post-merge Closing row here, not plugin work.

## Tasks

1. **One gate-class taxonomy** (J4) — `templates/gate-classes.md` replaces the
   three inline lists.
   - AC-8 One template holds the classes, built from operate-triage's 8;
     `templates/operate-triage.md`, the §5 LA-5 `fable-boundary` rule,
     `agents/reviewer.md` and the ceremony table reference it instead of
     restating a list. `tools/lint.mjs` fails if a second inline class list
     reappears (a paragraph outside `gate-classes.md` naming ≥ 4 class keys).
   - AC-9 Every gate in the ceremony table carries its class (or `none`) —
     **joined at read time** from the fenced `Gate` cells, never stored in
     §10.2 (counsel condition 4).

2. **Protocol data the tool can read** (J1 precondition, AC-3's shape) — §0
   and §5 of `templates/WORKFLOW.md` become fenced, column-explicit data; §10
   gains the row + the 10.2 placeholder; `/sync` preserves §10 through the
   next `## ` heading in its own tested commit; §1, §11 and the preset note
   each carry one relation line.
   - AC-3 The tool reads the stage and gate table from the protocol copy
     (`docs/WORKFLOW.md` §0 `stage-table` fence + §5 `checkpoint-gates`
     fence), never a hard-coded V0–V6 list; a fixture with a rewritten table
     (4 stages, renamed) derives correctly; a missing fence/header → every
     cell `required`, profile row `unreadable (YYYY-MM-DD)`.
   - AC-10 Altitudes (§1), tune presets (`tune-presets.json` note + `/tune`),
     autopilot check-in level / gate policy (§11), the intake classifier and
     `/next` consult the profile rather than a parallel notion of ceremony;
     where a knob stays, its relation is ONE stated line (D5-B), not a table.

3. **The derivation engine** (J1, J2, J6) — `tools/ceremony.mjs`
   `derive | effective | check`, zero deps, filesystem only, fixture-tested.
   - AC-1 `derive` reads observable signals (stage from §0 artifact presence;
     deploy from the §10 Deploy row; auth / payments / schema from path +
     dependency probes; test policy, publish policy, merge policy, catalog
     from the §10 cells verbatim) and the command writes the `Ceremony
     profile` row plus `### 10.2 Ceremony` — one row per stage artifact and
     per gate, each `required | optional | skipped`, with the signal that
     decided it.
   - AC-2 A signal the tool cannot decide lands in `asks`; the command turns
     them into ONE batched AskUserQuestion; the answer is recorded dated
     (`asked: YYYY-MM-DD · <answer>`); no answer → `required`, `asked:
     YYYY-MM-DD · no answer`. An ask is never repeated once it has a dated
     answer. Only the stage and the three surface signals may ask.
   - AC-4 Any cell is owner-editable in place as a dated override line under
     the table (`- YYYY-MM-DD · <id> · <from>→<to> · "<words>"`).
   - AC-5 An override (or a derived cell) that marks `skipped` **or
     `optional`** a gate whose class is irreversible resolves to `required
     (override refused: <class> is irreversible)`; `check` reports it from
     `/doctor`, `/sync` and the SessionStart conform advisory; the merge
     guard backstop (task 4) blocks an agent merge while such a row stands.
     Plugin lint never reads a venture's copy (brief correction 1).
   - AC-11 `/sync` on an adopted repo writes the table and a `proposed`
     cell; `effective` returns `required` for every cell until the row says
     `confirmed`.
   - AC-12 `check` reports drift (re-derived signal ≠ recorded `signal`
     column) as ONE warning with a count and list; never re-derives; drift
     on an irreversible-class signal flips the affected rows' effective value
     to `required` (tighten-only, L3).

4. **Enforcement** (J2, J3) — fail closed by shape, one guard regex, one rule.
   - AC-6 A skipped gate leaves exactly one ledger Deviations line, written
     only by `ceremony.mjs effective <id> --log` in the grammar `gate <id>
     skipped — ceremony (<signal|override YYYY-MM-DD>)`.
   - AC-7 `tools/lint.mjs` fails when a gate id in the `checkpoint-gates` /
     `stage-table` fences has no owning command carrying the byte-identical
     `<!-- rule-copy: ceremony-skip -->`, and when a harness fixture's
     refused override does not render as refused.
   - AC-5 (backstop) `hooks/lib/merge-guard.sh` blocks an agent merge with
     one anchored regex while any §10.2 row of the committed
     `docs/WORKFLOW.md` is `skipped` or `optional` on an irreversible class
     id — it reads only §10.2, never the taxonomy file (brief correction 4).

5. **Measurement plumbing** (J7, L4) — `Reviewer runs:` counter.
   - AC-13 (deferred to an obligation row, L4): on 3 real changes, the
     **low-ceremony project (Missions)** shows fewer sessions and fewer
     reviewer runs vs. baseline (metrics §3 thresholds: below median on ≥ 2
     of 3, none above max) and **Orderly is scored on safety only** (metrics
     §4: zero regressions); Missions contract tests green. Inside this
     mission the plumbing ships (S1): `templates/mission-state.md` gains
     `Reviewer runs: 0`; `ledger.mjs` gains `reviewer-runs +1`; `mission.md`
     bumps it at every one-shot reviewer spawn. Owner prompts and token spend
     are "no claim".

6. **Record** — CHANGELOG 1.61.0, version bump + stamp, READMEs, §3/§9
   inventories, the `/sync` dogfood on this repo (AC-11 live: a `proposed`
   profile in this repo's `docs/WORKFLOW.md`, full ceremony unchanged).

## Value sourcing

| AC | Value | Source kind | Where |
|---|---|---|---|
| AC-8 | change-class ids `schema-migrations, auth, payments, ci-deploy, secrets, third-party, security-boundary, supply-chain`; action-class ids `production-deploy, merge-to-default, publish-outward, spend, commercial-commitment, outbound-contact, destructive-data, release-cut, user-experiment`; qualifier ids `not-reproducible, size-above-s` | locked decision | 2026-10-14 L6 (amends 2026-10-13 L2 + memos D3) |
| AC-8 | taxonomy file path `plugins/agentic-workflow/templates/gate-classes.md`; columns `class · matches · irreversible · reviewer tier · triage` | locked decision | 2026-10-13 L2 ("one column per reader") + D3 |
| AC-5 | irreversible = every change class except `third-party` + every action class (16 ids) | locked decision | 2026-10-14 L6 |
| AC-8 | reviewer tier `top` = schema-migrations, auth, payments, security-boundary, supply-chain; action classes carry no reviewer tier (`n/a` — human-fired) | locked decision | memos D3 + L6 |
| AC-8 | triage `escalate` = all 8 change classes + both qualifiers; action rows `n/a` | locked decision | memos D3 + L6 |
| AC-8 | gate-classes.md layout: `## Change classes` table `| class | id | covers | irreversible | reviewer tier | triage |` · `## Action classes` table `| class | id | covers | delegable | irreversible |` · `## Qualifiers (triage only)` · `## Gate-cell grammar` (the single definition) · `## Readers` | derivation | L6 "one column per reader" (L2) + the `n/a` rule; planner layout |
| AC-8 | `fable-boundary` detector keys `[/gate-classes/, /reviewer[- ]tier/, /two-line/]`; `gate-classes.md` never contains the word `Fable` | locked decision | memos D3 "Consumption" |
| AC-8 | class-list dedup threshold: ≥ 4 **change-class** keys in one paragraph outside `gate-classes.md`; action-class names are never keys | locked decision | memos D3 (`checkClassListDedup`) + L6 |
| AC-1 | §10 row key `Ceremony profile`; heading `### 10.2 Ceremony`; columns `id · kind · stage · derived · signal · effective` (no class column) | locked decision | 2026-10-13 L1 (D1-A) + counsel condition 4; D1 column list minus `class` |
| AC-1 | `kind ∈ {artifact, gate}`; cell values `required | optional | skipped` | locked decision | memos D1 |
| AC-1 | row states: `proposed YYYY-MM-DD` · `confirmed YYYY-MM-DD by <who> · derived YYYY-MM-DD from N signals · N overrides` · `unreadable (YYYY-MM-DD)` · drift suffix `· drift YYYY-MM-DD: <signal> — not re-derived` | locked decision | memos D1/D4 values + brief designer table (six states) |
| AC-4 | override grammar `- YYYY-MM-DD · <id> · <from>→<to> · "<words>"`; ask grammar same with `asked: YYYY-MM-DD · <answer|no answer>` | locked decision | memos D1/D2 |
| AC-1 | sync preserves `## 10.` up to the next `## ` heading | locked decision | 2026-10-13 L1 + memos D1 |
| AC-1 | tool path `plugins/agentic-workflow/tools/ceremony.mjs`; subcommands `derive | effective | check`; flags `--root <dir>`, `--json`, `--log --mission <name>` (effective only; the ledger is named, never guessed — `ledger.mjs`'s shape) | locked decision | memos D2 + L3 (`effective --log`); `--mission` per plan-judge 2026-10-13 |
| AC-1 | signal sources (stage ← §0 artifact presence; deploy ← §10 Deploy row ≠ `none`; auth/payments/schema ← path + dependency probes; test/publish/merge policy + catalog ← §10 cells) | locked decision | memos D2 |
| AC-2 | askable signals: stage, auth, payments, schema only; everything else decided by a §10 row or file presence | locked decision | memos D2 "Mitigation" |
| AC-1 | a derived `skipped` needs a positive signal; a nothing-found probe on an irreversible-class gate becomes an ask | locked decision | 2026-10-13 L3 |
| AC-3 | fences `<!-- stage-table -->` (§0) and `<!-- checkpoint-gates -->` (§5); required headers `Stage`, `Artifacts`, `Gate`; gate cell grammar `<id> · human|reviewer|record · <class>[+<class>]*` (or `none`), no whitespace variants; `;`-separated list of gates per cell | locked decision | 2026-10-13 L1 (D4-B) + memos D4 + 2026-10-14 L6 |
| AC-3 | §0 gate cells: `v0-go-no-go · human · none`, `v1-scope-approval · human · none`, `v2-deploy-pipeline · reviewer · ci-deploy`, `v3-mvp-criteria · reviewer · none`, `v4-security-audit · reviewer · security-boundary`, `v4-ux-audit · reviewer · none`, `v4-dx-audit · reviewer · none`, `v4-efficiency-audit · reviewer · none`, `v5-launch · human · production-deploy+publish-outward+release-cut`, `v6-operate · reviewer · none`; §5: `plan-judge · reviewer · none`, `phase-reviewer · reviewer · none`, `staging-verify · reviewer · none`, `counsel · human · none`, `multi-vote-audit · reviewer · security-boundary`, `chronicler · record · none`, `mission-close · human · release-cut` | locked decision | L6 for v5-launch + mission-close; memos D4 + planner for the rest |
| AC-3 | §5 checkpoint gate ids: `plan-judge, phase-reviewer, staging-verify, counsel, multi-vote-audit, chronicler, mission-close` | locked decision | memos D4 |
| AC-3 | the AC-3 fixture = a 4-stage table with renamed stages | locked decision | memos D4 |
| AC-3 | unreadable table → all cells `required`, row `unreadable (YYYY-MM-DD)` | locked decision | memos D4 |
| AC-5 | refusal text `required (override refused: <class> is irreversible)`; refusal covers `optional` too | locked decision | memos D6 + L3 bullet 1 + counsel |
| AC-6 | deviation grammar `gate <id> skipped — ceremony (<signal|override YYYY-MM-DD>)`; rule id `ceremony-skip` | locked decision | memos D6 |
| AC-7 | lint check name `checkCeremonyCopies` (gate ids ↔ rule-copies) and `checkCeremonyHarness` (runs `tools/ceremony-test.mjs`) | derivation | planner naming, following `tools/lint.mjs:520` (`checkLedgerHarness`) and `:1136` (`checkRuleDedup`) |
| AC-5 | merge-guard regex: one `grep -E` over the `### 10.2` block of the committed copy — a `gate` row whose `signal` cell carries `class:` followed by ANY of the 16 irreversible ids (`schema-migrations|auth|payments|ci-deploy|secrets|security-boundary|supply-chain|production-deploy|merge-to-default|publish-outward|spend|commercial-commitment|outbound-contact|destructive-data|release-cut|user-experiment`, matched as a `+`-separated token with word boundaries) and whose `effective` cell is `skipped` or `optional` | locked decision | 2026-10-13 L5 (token) + 2026-10-14 L6 (every irreversible id, change and action alike) |
| AC-10 | relation lines (verbatim seeds): §1 "altitude sizes the work; §10.2 decides which gates inside it run" · presets "a preset picks who runs a gate, never whether" · §11 "check-in level sets WHEN the human merges; §10.2 sets WHICH gates exist; a skipped gate is never re-enabled by check-in level, a required one never removed by it" | locked decision | memos D5 |
| AC-10 | read points: `commands/mission.md`, `commands/autopilot.md`, `commands/next.md`, `agents/intake.md`; no new scalar | locked decision | memos D5 |
| AC-11 | `/sync` writes `proposed`; `effective` = `required` everywhere until `confirmed` | locked decision | memos D2 + brief AC-11 |
| AC-12 | drift on an irreversible-class signal → affected rows effective `required` (tighten-only) | locked decision | 2026-10-13 L3 |
| AC-13 | ledger line `Reviewer runs: <int>`; verb `ledger.mjs <mission> reviewer-runs +1`; bumped at every one-shot reviewer spawn (plan-judge included) | derivation | L4 names the counter and `ledger.mjs`; verb name + bump points are planner choices mirroring `sessions +1` (`tools/ledger.mjs:14`) |
| AC-13 | thresholds: sessions + reviewer runs below baseline median on ≥ 2 of 3, none above max; correctives not higher on any; safety per metrics §4 | locked decision | 2026-10-13 L4 ("the analyst's thresholds are confirmed") + metrics §3 |
| 6 | target version 1.61.0 | derivation | `plugin.json` 1.60.0 on `main` dc9bf34 + next minor |
| 6 | conform ladder entry id `ceremony-profile-row`, `since: '1.61.0'` | derivation | planner naming, following `tools/conform.mjs:156` (`profile-staging-row`) |
| all | owner-facing copy (J1 report line, J2 refusal, J3 lint message, J5 lines, J6 proposed/drift messages) | locked decision | brief "Journeys and IA (designer)" — drafts; J2 wording corrected per L3 (no edit-time refusal promised) |

## Locked decisions

- 2026-10-13 — **L1 scope: full shape, phased, 3 briefs (6 counted sessions).** D1-A, D2-A, D4-B,
  D5-B, D6-A as recorded in the brief's Locked decisions; runs as
  `/agentic-workflow:mission "adaptive-ceremony" phases`.
- 2026-10-13 — **L2 taxonomy**: triage's classes + `security-boundary`;
  credential/tenancy → auth, money → payments, webhooks → third-party;
  `not reproducible` and `size above S` are triage-only qualifiers;
  irreversible = every class except third-party; one file, one column per
  reader. **Amended by L6 below (2026-10-14).**
- 2026-10-13 — **L5 class tag allowed** (owner, after the plan-judge; brief
  lines 261–266): each §10.2 gate row may carry a `· class:<id>` token in its
  `signal` cell, written by `ceremony.mjs`, `check` fails any mismatch with
  the fenced tables; counsel condition 4 is amended. OQ-2 is closed.
- 2026-10-14 — **L6 taxonomy amended: 8 change classes + 9 action classes**
  (owner, "Yes, lock it"; brief lines 267–311). Change classes (reviewer
  tier + triage read these): `schema-migrations`, `auth` (widened to
  personal-data stores), `payments`, `ci-deploy`, `secrets`, `third-party`
  (the only non-irreversible class), `security-boundary` (widened to the
  discipline files: `hooks/`, `tools/`, `templates/`, `hooks.json`,
  `codex.rules`, `.claude/agents`), `supply-chain` (new: lockfile/manifest
  dependency add or bump, install scripts; top tier; triage escalates).
  Action classes (what a gate authorizes; all irreversible, all
  human-fired — a gate carrying one is `human` and can never be `optional`
  or `skipped`): `production-deploy`, `merge-to-default`, `publish-outward`,
  `spend`, `commercial-commitment`, `outbound-contact`, `destructive-data`,
  `release-cut`, `user-experiment`. Rules: gate-cell grammar defined once —
  `<id> · human|reviewer|record · <class>[+<class>]*`, no whitespace
  variants; `check` fails an action class on a non-`human` firer and a
  malformed `+`; triage column = change classes only, action rows read
  `n/a`, the dedup lint never matches action names; `v5-launch` =
  `production-deploy+publish-outward+release-cut`; `mission-close` carries
  `release-cut`; `none` on the V0/V1 decision gates is still fail-closed
  (AC-2; the fence comment says so); the merge-guard regex lists EVERY
  irreversible id, change and action alike — if it cannot be extended in
  the same session, stop and surface. Left out on purpose: licensing, infra
  cost, prompts/evals.
- 2026-10-13 — **L3 safety (all four)**: irreversible-class gates neither
  `skipped` nor `optional`; only `ceremony.mjs effective --log` writes the
  deviation line; one anchored regex in `merge-guard.sh`; the J2 copy is
  corrected; a derived `skipped` needs a positive signal; drift tightens only.
- 2026-10-13 — **L4 measurement**: the mission passes on the mechanical ACs;
  AC-13 is an obligation row (see the ledger's Closing block), scored on
  sessions + `Reviewer runs:`; owner prompts and token spend are "no claim".
- 2026-10-13 — **Plan conditions (counsel, technical)**: one writer for
  class (no class column in §10.2); Missions-contract precondition before any
  template edit; measure `templates/WORKFLOW.md` bytes first; the sync
  preserve change is its own tested commit.
- 2026-10-13 — **Brief corrections accepted**: AC-5 is enforced at resolution
  + the merge-guard backstop, not by lint over a venture copy; per-change
  gates come from §5; "current stage" may need an owner ask; the guard reads
  only the §10.2 regex.
- 2026-10-13 — **Priority top; gate policy `human-merge`**; reviewer checkpoint
  per phase; **Fable** on all three checkpoints — P1 rewrites a §5 fenced
  rule + the dedup detector + adds a §5 rule; P2 touches `merge-guard.sh`
  and the fail-closed resolver; P3 edits the resolver-call prose at every
  gate site (plan-judge 2026-10-13).
- 2026-10-13 (plan-judge) — **`commands/mission.md` is 21,595 B of its
  24,000 B ceiling** (`tools/lint.mjs` BUDGETS.command). S3's edits there
  (rule-copy + resolver calls + the `Reviewer runs:` sentence lands in S1)
  must stay ≤ 2,000 B net; above 23,000 B S3 trims the mission.md prose it
  touches (the staging/verify step's repeated §12 LA-8 wording is the
  pre-planned cut) in the same commit and logs a deviation. Ceilings never
  rise.
- 2026-10-13 (plan-judge) — **Missions consumer that pins §10 keys**:
  `packages/runner/test/connections.test.ts:28` asserts
  `profileRows(TEMPLATE)` still contains `Owner channel`, `Remote executor`,
  `Runtimes`, `Publish policy`. Adding `Ceremony profile` is safe; renaming
  any of those four is not. S1 quotes that test line in its handoff.
- 2026-10-13 (planner, from exploration) — **Missions-contract precondition
  result, to be re-run and quoted by S1**: `grep -rn "## 10\|§10\|Project
  profile\|## 0\.\|Merge policy\|WORKFLOW.md" contract-tests` in
  `/Users/baker/Playground/missions-app` (9aa612c) returns **no hit** — the
  contract test asserts only: the five commands exist, `AskUserQuestion` in
  the frontmatter of bootstrap/plan/mission, `Estimate:` / `Sessions used:` /
  `Next up:` in `templates/mission-state.md`, `gh pr merge` + `BLOCKED` in
  `hooks/hooks.json`, no `AskUserQuestion` PreToolUse matcher, and
  `plugin.json` version = `vendor/VERSION`. The runtime does parse §10:
  `packages/runner/src/connections.ts:28-41` `profileRows()` reads from
  `## 10.` to the next `^## ` heading (a `###` does NOT end it) and keys only
  rows shaped `| **Key** | value |` (first wins). **Consequence (binding on
  S1/S2):** the `### 10.2 Ceremony` table uses PLAIN first-column cells
  (never bold), so no 10.2 row becomes a bogus profile key; the `Ceremony
  profile` row is an additional key, harmless. `executorRows()`
  (`connections.ts:51-55`) ends 10.1 at the next `##`/`###` heading, so
  `### 10.2` placed after 10.1 terminates it cleanly.
- 2026-10-13 (planner, measured) — **`templates/WORKFLOW.md` = 108,821 B of
  the 120,000 B lint ceiling (90.7 % — lint already prints the 90 % `warn:`
  line; the fail line is 120,000)**. Per-section: §0 12,042 B · §5 16,241 B ·
  §10 8,202 B · §11 5,708 B · §1 761 B. Room for this mission: ≤ 6,000 B
  across the §0 columns + fence, §5 `checkpoint-gates` list + `ceremony-skip`
  rule, §10 row + 10.2 placeholder, and three relation lines. S1 measures
  after its edits and quotes the number in its handoff; above 116,000 B it
  trims §6 prose in the same commit and logs a deviation. Ceilings never
  rise. **Re-checked for L6 (2026-10-14):** L6 adds ≈ 60 B to the §0 fence
  (the `v5-launch` cell) and ≈ 12 B to §5 (`mission-close · human ·
  release-cut`); the gate-cell grammar lives ONCE in `gate-classes.md`, not
  in WORKFLOW, so the 6,000 B room stands. `gate-classes.md` has no lint
  ceiling (templates other than WORKFLOW are unbudgeted; `BUDGETS` at
  `tools/lint.mjs:955`). `commands/mission.md` (21,595 / 24,000 B) is
  unaffected by L6. `agents/reviewer.md` is 13,609 of 16,000 B — S1's edit
  there (shorter description + one pointer sentence) fits with 2,391 B to
  spare; `templates/operate-triage.md` (7,142 B) is unbudgeted. Measure
  both with `wc -c`, quote.
- 2026-10-13 (planner) — **Harness shape**: `tools/ceremony-test.mjs` follows
  `tools/ledger-test.mjs` (fixtures in a `mkdtempSync` dir, real CLI runs,
  exit 0/1), reached by lint through `checkCeremonyHarness` in the shape of
  `checkLedgerHarness` (`tools/lint.mjs:520-532`), fail-closed on a missing
  runner.
- 2026-10-13 (planner) — **The sync preserve change is mechanical**:
  `commands/sync.md` §2 quotes one extraction (`awk '/^## 10\. /{p=1} p &&
  /^## / && !/^## 10\. /{p=0} p'`) that keeps §10, §10.1 and §10.2 verbatim,
  and `tools/lint-test.mjs` pins it with a fixture containing a 10.2 table
  (case `sync §10 extraction keeps 10.2`); that edit + that case are ONE
  commit, `feat(sync): preserve §10 through the next ## heading`.
- Assumed 2026-10-13 — owes the exact `AskUserQuestion` batching shape; built
  on the brief's J1 copy (one numbered message, each item stating the
  no-answer outcome); authorized by the brief's designer section — no spike
  ran it. The command prose instructs; no tool invokes AskUserQuestion.

## Risks

- WORKFLOW byte budget (90.7 % used) → measured per the locked decision; S1
  prefers adding columns to adding prose; a trim of §6 is the pre-planned
  escape, logged as a deviation.
- Retuning the `fable-boundary` detector could stop the canonical §5 block
  from self-detecting → `tools/lint-test.mjs` `CANON_CASES` (line 171) runs
  every canonical block against its own detector; S1 updates the three
  pre-swap fixtures (`REVIEWER_210_PRESWAP`, `MISSION_176_PRESWAP`) rather
  than deleting them.
- `merge-guard.sh` is an audited fail-closed script → the §10.2 regex is one
  additional `grep -E` on the same `git show origin/<default>:docs/WORKFLOW.md`
  text already fetched at line 75, placed before the records-only branch;
  hook-test gains ≥ 4 cases (skipped irreversible → BLOCK; optional
  irreversible → BLOCK; skipped third-party → allowed; no 10.2 table →
  unchanged behaviour). `# externals:` line unchanged (grep/sed only).
- `/sync` is agent-executed prose → the one-line awk extraction makes the
  preserve step mechanical; the hook-test/lint-test fixture pins it.
- Fuzzy signals on real repos → only four signals may ask; a nothing-found
  probe on an irreversible-class gate asks rather than skips (L3).
- `checkSections` (`tools/lint.mjs:199`) requires every `§10.2` mention to
  match a heading `### 10.2 …` → the heading text is `### 10.2 Ceremony`,
  exactly.
- Missions runtime parses §10 → plain cells in 10.2 (locked above); S3's
  Closing row asks Missions to bump its pin and run `pnpm test` there.

## Open questions

- **OQ-1 — Does the conform ladder run `ceremony.mjs check`, or only test for
  the row?** D2 says "one ladder entry: row present"; D6's mitigation says
  "`check` runs at every session start through the existing conform hook".
  **Recommendation:** the ladder entry `ceremony-profile-row` imports the
  tool's pure `check()` (filesystem only, no git, ≤ 50 ms on a 1,400-line
  file) and reports the first finding (absent / proposed / refused override /
  drift count) as the gap detail — one entry, both memos satisfied, and the
  SessionStart hook's 10 s timeout is untouched.
- **OQ-2 — How does the bash merge guard know a §10.2 row's class when §10.2
  stores no class column (counsel condition 4) and the guard must not read
  the taxonomy (brief correction 4)?** The two locks collide unless the row
  itself carries a machine-readable irreversibility marker. **Status
  (plan-judge 2026-10-13): keep the `· class:<id>` token in the `signal`
  cell — it honours L3 and correction 4 but bends the one-writer intent of
  condition 4. **Owner ACCEPTED 2026-10-13** ("Yes, allow the tag"):
  condition 4 is amended to allow this tool-written, `check`-verified
  token. The merge-guard regex is never dropped (L3).**
  **Recommendation:** the `signal` cell of every gate row written by
  `ceremony.mjs` ends with the literal token `· class:<id>` (the class is
  still joined at read time by the tool — the token is a rendering, not a
  second writer; `check` fails a row whose token disagrees with the fence),
  and the guard's regex is `^\| *[^|]+ *\| *gate *\|[^|]*\|[^|]*\|[^|]*class:([a-z-]+\+)*(<16 irreversible ids, |-joined>)(\+[a-z-]+)*[^|]*\| *(skipped|optional) *\|$`
  — every irreversible id, change and action alike (L6 2026-10-14; the
  list is in the Value sourcing AC-5 row), spelled in the guard on one line
  like `RECRX` at `merge-guard.sh:81`, which is "reads only the §10.2
  regex". Closed; kept for the record.
- **OQ-3 — Dogfood on this repo in S3: write the `proposed` profile into this
  repo's `docs/WORKFLOW.md`?** **Recommendation:** yes — it is AC-11 live on a
  real adopted repo, it changes no behaviour (full ceremony until the owner
  says "confirm ceremony profile"), and it rides the P3 feature PR. The
  confirmation itself is the owner's later act, not mission scope.
- **OQ-4 — Where does `Reviewer runs:` get bumped for the plan-judge?**
  **Recommendation:** every one-shot `reviewer` spawn, plan-judge included
  (`mission.md` §1 plan mode and the checkpoint step) — the metric is
  "reviewer spend", and the judge is reviewer spend.

---
_The `.plans/adaptive-ceremony.sessions.md` briefs execute these tasks;
`.plans/adaptive-ceremony.state.md` tracks progress. Resolve every open
question before execution starts._
