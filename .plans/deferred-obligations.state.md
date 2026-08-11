---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: deferred-obligations — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1):
a fresh agent resumes the mission from this file alone. Write-ahead — update it
before ending a session._

**▶ IN FLIGHT — Phase 3: S6 done 2026-08-11 on
`mission/deferred-obligations-p3`. Next up: ckpt-p3 — phase 3 diff-review +
gates + mirror discipline (no prose claim without a dispatched case).** PR #32 MERGED
2026-08-11T05:02Z (`main` = `a75b844`); the plan branch was rebased onto it and the
integration + p1 branches created off the plan branch (trio travels with the mission).
OQ1's hold is released. _(Prior gate note below.)_
**⛔ (RELEASED) — all seven OQs RESOLVED 2026-08-11 (human accepted every planner
recommendation, incl. OQ6 queue order: this mission runs BEFORE portfolio-learning).
The ONLY remaining gate was OQ1's hold: execution starts when PR #32 merges.**
_(Original planning note below.)_
(mirrored below with recommendations). Execution is blocked until they are
answered; OQ1 additionally holds the start on PR #32's merge.

Gate policy: **batch** (L1, recorded at planning) — each phase branch
`mission/deferred-obligations-p1…p4` merges into
**`mission/deferred-obligations-integration`** by the orchestrator on APPROVE;
**never the default branch**. The human merges the integration branch **once**,
at the end-of-mission confirmation. `ckpt-p2` is `[STRICT]` (deletion
machinery); its verdict and any REQUEST CHANGES are pushed to the human the
moment they land. _The human may override to `human-merge`._

**Does `main` advancing on PR #32 matter?** To this plan commit: **no** — the
trio + brief are all-new files, zero overlap with #32's diff. To execution:
**yes, three ways** — S5 edits `hooks.json` and `tools/hook-test.mjs` (both
changed by #32), S4's seed rows cite `.plans/compaction-continuity.state.md`
(which reaches `main` only with #32), and S5 copies `handoff-budget.sh`'s
marker pattern (ditto). Hence OQ1's recommendation: base every phase off
post-#32 `main`; the ⚠-marked line counts in the sessions file get re-verified
at session start.

**Standing rules, inherited by every session:** never `Read`/`cat`/`head`/`tail`
a `*.jsonl` (L10); all new shell GNU/BSD-portable — CI is Ubuntu, local gates
macOS (L9); hook behavior is proven by `tools/hook-test.mjs` dispatch, never
claimed live; the S4 reap is the one live-exercised piece; deletion gates L4
verbatim, `git branch -d` never `-D`.

Plan: `.plans/deferred-obligations.md` · Briefs:
`.plans/deferred-obligations.sessions.md` · Brief:
`docs/product/decisions/2026-08-11-deferred-obligations-brief.md`

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner ·
`[x]` done (verified, not merely written)._

- [x] S1 — `## Closing` block + obligations register templates (branch
  `mission/deferred-obligations-p1`) — **Suits:** `writer` — committed
  `146667b`, gates green (settle-softening deviation logged below)
- [x] S2 — lint checks 13 + 14, mutation-proved, legacy-tolerant (branch
  `mission/deferred-obligations-p1`) — **Suits:** `backend` — 7 mutation
  classes fail new lint / pass stashed pre-change lint; controls pass both
- [x] Checkpoint `ckpt-p1` — **APPROVE** 2026-08-11 (Fable, routine). QA 2 · Architecture 3 · DX 3 · Security 3 · Efficiency 3. All 7 mutation fixtures + 3 controls re-derived; 5 adversarial fixtures of its own — **`when: every 10 minutes` PASSES the lint** (the owner's literal third instance; bare words caught, numeric periods not). **Folded into S3:** F1 numeric-period pattern (`^(?:every|in)\s+\d+`, medium) · F2 literal `YYYY-MM-DD` accepted in fired-evidence of real ledgers (minor) · F3 fenced-block `Closed:` false positive (minor, fail-closed direction). F4 note: promotion-ref cross-check belongs to `settle` (P2). Acceptance mapping: instances 1–2 have homes; instance 3's prose ban is real but the lint backstop leaked. Merged into integration.
  against the five pre-existing trios; merge to integration per L1
- [x] S3 — author `commands/settle.md` (probe ladder + reap algorithm +
  L4 gates) (branch `mission/deferred-obligations-p2`) — **Suits:** `backend` —
  5 sections incl. the close-gate refusal; slash forms restored; F1–F3 fixed,
  mutation-proved; gates green
- [x] S4 — dogfood reap on this repo + seed OB-1/OB-2 (branch
  `mission/deferred-obligations-p2`) — **Suits:** `devops` — live settle
  2026-08-11: 41 merged locals + 15 merged remotes reaped (`-d` / `push
  --delete`, per-branch rung evidence in "S4 reap evidence" below), 2 stale
  worktree registrations pruned, 0 `worktree-agent-*` present; register
  seeded OB-1/OB-2 (+ OB-3 parked); 3 concluded `mission/*-integration`
  branches KEPT per settle.md's protected set as written (deviation logged);
  gates green
- [x] Checkpoint `ckpt-p2` **[STRICT]** — **APPROVE 2026-08-11 (Fable): every deletion clean — 41/41 local + 15/15 remote + 2 prunes re-derived from evidence, zero unjustified; all 13 PR-backed remote deletions checked fully.** Security 3 · Architecture 3 · Efficiency 3 · QA 2 · DX 2. Refusal gate fires with shipped wording. **Folded to P3/S6:** settle.md findings #2 (no-PR ladder sub-case) + #3 (full 40-char SHA) are command-doc defects that MUST land before ckpt-p4; minor lint leak `when: every day` (digitless cadence). **OB-3 stays parked for the human** (are concluded `mission/*-integration` branches reapable?). Merged into integration. — audit every deletion against reflog +
  `gh` + the dry-run listing; verdict to the human immediately
- [x] S5 — `hooks/lib/obligations-due.sh` + registration + harness cases
  (branch `mission/deferred-obligations-p3`) — **Suits:** `backend` — 4
  silencers dispatched-proven both directions; 6 mutants: 5 killed, 1
  masked-by-design (noted in script); hook-test 64→73; live 3+3 counted
- [x] S6 — protocol integration: end/mission/check + both mirrors + README,
  atomic-ref (branch `mission/deferred-obligations-p3`) — **Suits:** `writer` —
  close gate wired into end/mission/check; obligations-due row + mission-close
  paragraph in both mirrors; README reflexes Five→Six (derived from
  hooks.json); settle.md findings #2–#5 fixed; OB-3 protected-set amendment
  landed (reap stays parked); digitless-cadence lint leak closed,
  mutation-proved; gates green
- [ ] Checkpoint `ckpt-p3` — phase 3 gates + mirror discipline; no prose claim
  without a dispatched case
- [ ] S7 — update the record: CHANGELOG + JOURNEY + status page (branch
  `mission/deferred-obligations-p4`) — **Suits:** `chronicler`
- [ ] S8 — integration PR body + close this ledger through its own gate
  (branch `mission/deferred-obligations-p4`) — **Suits:** `writer`
- [ ] Checkpoint `ckpt-p4` — final pass over `main..integration`; then the
  human merges PR `mission/deferred-obligations-integration → main` once

## Open questions

_Mirrored from the master plan with recommendations; empty once the human has
answered them all. Full argument for each: `.plans/deferred-obligations.md`._

- **OQ1** — start timing vs PR #32 → **hold until #32 merges; base off `main`**
  (early start = base off `mission/compaction-continuity-integration`,
  retarget after).
- **OQ2** — register location → **`.plans/OBLIGATIONS.md`** + template
  `templates/obligations.md`.
- **OQ3** — beats + silencers → **SessionStart `startup|resume` hook (grep-only,
  four silencers, ≤3 lines) + probes only in `/settle`, `end.md`, `check.md`**.
- **OQ4** — deploy-green probe without CI/deploys → **§10-profile ladder,
  degrading fail-closed**; `gh` missing/ambiguous → surface, never delete.
- **OQ5** — close refusal: step, lint, or both → **both**: the command step
  acts, the `Closed:`-stamp lint check catches (legacy-tolerant).
- **OQ6** — queue order vs portfolio-learning → **this mission first**: the
  parking place must exist before the scholar's sweep finds more instances to
  park; the register gives the scholar a write target, not the reverse.
- **OQ7** — deploy gate for `worktree-agent-*` → **no**: they never carry
  deploys; `git worktree prune` + `git branch -d` (git's merged check) is the
  gate; a `-d` refusal is surfaced, never forced.

## Standing steers

_Captured verbatim at checkpoints only; grammar
`- YYYY-MM-DD (ckpt <id>) — "<exact words>"`; retire by ~~strikethrough~~,
never delete._

(none)

## Closing

_This mission's own deferred obligations — the block S1 templatizes and S8
closes through the gate it builds (grammar enforcement arrives with S2; this
file is its first real consumer). `Closed:` stamp only when no `[ ]` row
remains; a `[~]` row must carry its `→ OB-<n>` promotion ref._

- [ ] OB-a · added 2026-08-11 (planner) — do: delete this mission's four phase
  branches + integration branch, local and remote — when: the integration PR
  is merged by the human AND CI concluded green on the merge commit — probe:
  `gh pr view <n> --json state,mergeCommit` + `gh run list --commit <sha>`
- [ ] OB-b · added 2026-08-11 (planner) — do: live-verify the obligations-due
  hook fires in a real session — when: the shipped version is installed
  (`/plugin update` + `/reload-plugins` post-merge) — probe: manual
- [ ] OB-c · added 2026-08-11 (planner) — do: confirm the five legacy trios
  still pass lint on the installed release — when: the release lands on
  `main` — probe: `node tools/lint.mjs` on a fresh checkout of `main`

## Deviations

- 2026-08-11 (S6) — **four notes, none silent.** (1) The launching prompt's
  "mirrors byte-identical" is unsatisfiable as literally stated: pre-existing
  protocol drift (the docs copy is stamped `v1.42.0`) diverges outside
  §10/Local-amendments — the §3 beat-enforcer row wording, the §4 reflex
  paragraph, the §5 ledger row, the §6 engineering-doc paths. Per the brief
  (which wins), the exact scope was recorded: **9 hunks** (banner + 4 drift
  hunks + 3 §10 hunks + Local amendments), the hunk count UNCHANGED by S6 —
  every S6 insertion landed byte-identically in both mirrors, and
  `docs/WORKFLOW.md:3` is untouched. Re-syncing the drift is `/sync`'s job,
  not this commit's. (2) settle.md findings #4/#5 (default-branch-in-inventory
  guard; awk wrap) included though the sessions brief is silent on them —
  one-line fail-closed recipe fixes in the same file, with no later session
  assigned to them; both recipes exercised live on this repo. (3) `end.md`
  §§3–5 renumbered to §§4–6 — the mechanical consequence of the brief's "new
  step between §2 and §3". (4) The protected-set amendment spells out a
  pre-grammar nuance the ruling's words didn't: legacy ledgers (no
  `## Closing` block) carry no `Closed:` stamp, so they are judged by
  PR-merged + deploy-green alone — otherwise OB-3's three branches would stay
  shielded forever, contradicting the ruling's intent. Also, the
  digitless-cadence unit set is bounded (sec/min/hour/day/week/month/quarter/
  year/morning/evening/night/weekend/sprint, optionally `other`-prefixed) per
  the S2 bounded-set precedent.

- 2026-08-11 (S5) — **none from the brief; three notes.** (1) The launching
  prompt floated a possible "in-flight mission session" silencer; OQ3's locked
  set (the brief) has no such condition — the brief's four silencers were built
  verbatim, and the brief wins. (2) Mutation M1b (silencer-1 removal) is MASKED
  by silencer 2 — with no parking place both counts are 0, so the zero-unticked
  guard also silences; recorded in the script per the compact-resume F2
  precedent (deliberate layering; only silencer 1's INVERSION is
  harness-killable — proven killed, 6 failures). (3) `printf '%.140s'`
  truncates BYTES and split a multibyte char during the live dispatch (U+FFFD
  in the JSON) — switched to jq codepoint slicing (`.[0:140]`) pre-commit.
- 2026-08-11 (S4, live dogfood) — **five places settle.md's text met reality;
  none silently patched, all followed as written:**
  1. **Protected-set blanket** — "integration branches (`mission/*-integration`)
     and any branch with an open PR" shields concluded integrations forever:
     the 3 whose PRs are merged + CI-green stayed, yet this ledger's own OB-a
     promises deleting THIS mission's integration branch post-merge — the
     command as written would refuse its own obligation. Kept all 3, parked
     OB-3; wording refinement ("unconcluded missions") belongs to S6/S8 + the
     human's ruling.
  2. **The ladder assumes a PR** — rung 1's recipe (`gh pr list --state merged
     --head <branch>`) returns empty for branches that reached `main` without
     one (`plan/interactive-handoff`, `plan/orchestrator-context-economy` —
     absorbed as ancestry when later missions built on them); "the merge
     commit" is undefined there. Fired on rung 2 with: tip is ancestor of
     `origin/main` (git proof) + `lint:success` on the tip commit itself + on
     the carrying merge commit `a75b844`. settle.md should name the no-PR
     sub-case.
  3. **`gh run list --commit` needs the full 40-char SHA** — a short SHA
     returns `[]` silently; with settle.md's bare `<sha>` placeholder that
     wrongly surfaces green branches (fail-closed, so safe, but the recipe
     should say full SHA).
  4. **The local inventory lists the default branch as a candidate** —
     `git branch --merged origin/<default> | grep -v '^\*'` includes `main`
     itself; only the protected set catches it downstream. Minor, fail-closed.
  5. **The §1 inventory awk shows only the first physical line of a wrapped
     `- [ ]` row** — ledger Closing rows wrap at house width; counting is
     correct, but the printed row is truncated mid-sentence. Cosmetic.

- 2026-08-11 (owner clarification, mid-S3) — **the "status updates every 10 minutes"
  instance was a temporary, in-session request — not a durable obligation class.** The
  register is for obligations that OUTLIVE a session; ephemeral cadence asks stay
  conversational and are deliberately NOT parked. This resolves the ckpt-p1 acceptance
  note ("instance 3's lint backstop leaked") the other way: the F1 numeric-period
  pattern is still correct — its job is now to keep clock-phrases OUT of the register
  entirely (they don't belong there), not to represent them. S4/ckpt-p2 must not treat
  timer-class surfacing as an acceptance gap.

- 2026-08-11 (S1, orchestrator gate-run) — S1's templates named `/agentic-workflow:settle`
  before `commands/settle.md` exists (S3 ships it); lint's unknown-command check
  correctly failed. Softened to prose ("the `settle` command") to keep the gate green.
  **S3 MUST restore the proper slash-command forms in both templates in the same commit
  that creates `commands/settle.md`** (atomic-ref). Also: `/reload-plugins` is a CLI
  built-in the checker doesn't know — left as prose; a checker allowlist for built-ins
  is a candidate lesson, not fixed here.

- 2026-08-11 (S3) — `settle.md` ships FIVE sections, not the sessions brief's
  four: `## 5 The mission-close gate` (the refusal + `Closed:` stamp rule) —
  per the feature brief's locked piece 1 and OQ5 (the command step is the
  actor) and the orchestrator's S3 instruction; no conflict with S6, which
  wires `end.md`/`mission.md` to invoke it. Also beyond "minimal list entry":
  plugin README command count corrected 26→27 (a stale count is a false
  claim); `docs/product/roadmap.md:42` still says 26 — left for S7.

- 2026-08-11 (S2) — the brief names no explicit forbidden `when:` time-word
  list; shipped a bounded set derived from L3 (hourly, daily, nightly, weekly,
  biweekly, fortnightly, monthly, quarterly, yearly, annually, soon, later,
  eventually, someday, sometime, periodically, regularly, asap, tomorrow,
  next week/month/quarter/sprint), matched only when it is the WHOLE `when:`
  value. Check 14 also validates `templates/obligations.md` when present
  (drift guard; the brief scoped it to `.plans/OBLIGATIONS.md`). Per the brief
  (which wins over the session prompt), `[~]` without `→ OB-` fails only when
  a `Closed:` stamp coexists — an in-flight `[~]` row is legal.

_Any departure from a brief — logged the moment it happens, with why.
Deviating is allowed; deviating silently is not (§4)._

## S4 reap evidence (dogfood, 2026-08-11)

_The live `/agentic-workflow:settle` run, steps executed by hand exactly as
S3 wrote them. Written ahead of execution (dry-run first), execution log
appended after. §10 profile of this repo: CI (lint on push), no separate
deploy — merge to `main` IS the release → **ladder rung 2**: CI green on the
merge commit. `origin/main` = `a75b844` at run time; zero open PRs
(`gh pr list --state open` → `[]`)._

**Inventory (measured 2026-08-11, planning figures were 17R/37L/3W):**
53 local branches (45 merged into `origin/main` incl. `main` itself, 8
unmerged) · 22 remote branches excl. HEAD (18 merged excl. `origin/main`, 3
unmerged + `origin/main`) · 3 worktrees (1 live + 2 prunable detached-HEAD
scratchpad registrations: `wt-p2` @ `939c287`, `wt-pre` @ `421bffa`) · 0
`worktree-agent-*` branches (planning predicted 0 here; the venture-repo
instance is out of scope).

### Dry-run — would-delete (remote, 15): rung-2 evidence per branch

| Remote branch | tip | merged-PR → merge commit | CI on merge commit | action |
|---|---|---|---|---|
| chore/ci-checkout-v5 | 7842cb8 | #22 → 3fcbe85 | lint:success | delete |
| chore/close-governance-ledger | 13af1f6 | #24 → 5be1c6a | lint:success | delete |
| docs/council-roadmap | 1e267db | #27 → 7f6f8c6 | lint:success | delete |
| docs/sync-workflow-v1.37.0 | bb57ded | #19 → ca7377e | lint:success | delete |
| docs/sync-workflow-v1.39.0 | fc37b2a | #23 → 5fcc7f4 | lint:success | delete |
| feat/beat-state-glyph | 7d7a32a | #29 → 98cb100 | lint:success | delete |
| feat/hook-dispatch-harness | 1a9cdc7 | #26 → 31bcc0b | lint:success | delete |
| feat/hooks-extract-sh | 3cffce2 | #28 → 4e4b7ac | lint:success | delete |
| feat/ingest-registry-resolution | 176860a | #20 → 7f82b51 | lint:success | delete |
| feat/orchestrator-governance | d55b36a | #21 → 4ae3320 | lint:success | delete |
| feat/template-ingestion | eacc24b | #16 → 7463a83 | lint:success | delete |
| fix/beat-enforcer-stop-hook-loop | 037a5a5 | #25 → 1ab65f8 | lint:success | delete |
| security/lint-guard | 8a9cb91 | #18 → 7a2c1ca | lint:success | delete |
| plan/interactive-handoff | bf74a58 | no PR — ancestor of `origin/main` | lint:success on tip `bf74a58` + on carrier `a75b844` | delete (rung-2, no-PR nuance → Deviations) |
| plan/orchestrator-context-economy | 037b36b | no PR — ancestor of `origin/main` | lint:success on tip `037b36b` + on carrier `a75b844` | delete (rung-2, no-PR nuance → Deviations) |

### Dry-run — would-delete (local, 41): `git branch -d` (git's merged check
is the gate; locals carry no deploys — every one verified in
`--merged origin/main`)

Tips (recovery breadcrumbs): chore/ci-checkout-v5 `7842cb8` ·
chore/close-governance-ledger `13af1f6` · docs/council-roadmap `1e267db` ·
docs/sync-workflow-v1.37.0 `bb57ded` · docs/sync-workflow-v1.39.0 `fc37b2a` ·
feat/beat-state-glyph `7d7a32a` · feat/hook-dispatch-harness `1a9cdc7` ·
feat/hooks-extract-sh `3cffce2` · feat/ingest-registry-resolution `176860a` ·
feat/orchestrator-governance `d55b36a` · feat/template-ingestion `eacc24b` ·
fix/beat-enforcer-stop-hook-loop `037a5a5` ·
mission/compaction-continuity-p1 `abec95b` · -p2 `344fcb0` · -p3 `4a98f8c` ·
-p4 `6379e69` · mission/context-economy-p0 `dca7072` · -p05 `931c7e5` ·
-p2 `bcaa935` · -p3 `d83823a` · -p4 `aadef40` ·
mission/orchestrator-governance-p1 `6d931df` · -p2 `b2a532b` · -p3 `ab0b2d6` ·
-p4 `bc300e7` · -p5 `d55b36a` · mission/portfolio-commons-p1 `527671d` ·
-p2 `c728e6d` · -p3 `46d0bb7` · -p4 `acc563d` · -p5 `ace0c2b` ·
mission/sales-doc-architecture-p0 `76aa414` · -p1 `2105ae9` · -p2 `c550aa2` ·
-p3 `1fb2667` · -p4 `31a92c6` · -p5 `a25e7bb` ·
plan/interactive-handoff `bf74a58` · plan/orchestrator-context-economy
`037b36b` · plan/sales-doc-architecture `6ebc409` · security/lint-guard
`8a9cb91`.

### Dry-run — would-keep, each with its reason

| Branch (L=local, R=remote) | Reason kept |
|---|---|
| main (L+R) | default branch — protected set |
| mission/deferred-obligations-integration (L) `4262217` | this mission, unmerged — protected set |
| mission/deferred-obligations-p1 (L) `b36003e` | this mission, unmerged |
| mission/deferred-obligations-p2 (L) `2669b9d` | this mission, current branch, unmerged |
| plan/deferred-obligations (L) `368bbfe` | this mission's plan branch, unmerged |
| plan/portfolio-learning (L) `9ab34b0` | unmerged plan branch — protected per mission prompt |
| feat/execution-core-templates (L+R) `2c66ed6` | unmerged into `origin/main` (pre-dates current workflow; likely squash-era) — surface, never delete |
| feat/plan-command (L+R) `4267522` | unmerged (pre-dates current workflow) — surface, never delete |
| security/purge-injection (L+R) `eafcc8f` | unmerged (2026-07 incident branch) — surface, never delete |
| mission/compaction-continuity-integration (L `9753715` + R) | merged + PR closed + CI green, BUT settle.md's protected set shields `mission/*-integration` unconditionally — kept as written; finding in Deviations; parked as OB-3 |
| mission/context-economy-integration (L `24646b5` + R) | same — protected-set literal; OB-3 |
| mission/sales-doc-architecture-integration (L `c5a810d` + R) | same — protected-set literal; OB-3 |

### Execution log (2026-08-11 — the dry-run above was written ahead)

- `git worktree prune` → the 2 stale registrations cleared (`wt-p2` `939c287`,
  `wt-pre` `421bffa`); `git worktree list` after = the main working tree only.
- `worktree-agent-*` locals: none existed (0, as planning predicted).
- Local: **41/41 `git branch -d` succeeded, zero refusals**; every
  `Deleted branch … (was <sha>)` line matched the breadcrumb tips above.
- Remote: **15/15 `git push origin --delete` succeeded.**
- Counts before → after: local branches **53 → 12** · remote (excl. HEAD)
  **22 → 7** · worktrees **3 → 1**.
- Residue: `git branch -r --merged origin/main` minus main/HEAD = exactly the
  3 protected integration branches. Local survivors: `main`, the 4
  this-mission branches + `plan/deferred-obligations`,
  `plan/portfolio-learning`, and 3 unmerged pre-workflow branches
  (`feat/execution-core-templates` `2c66ed6`, `feat/plan-command` `4267522`,
  `security/purge-injection` `eafcc8f`). Remote survivors: `origin/main`, the
  3 integrations, the same 3 unmerged.

### Obligations pass (settle.md steps 1–2 + 4, run over the real files)

- Inventory (commands verbatim from settle.md §1): 3 register rows
  (OB-1..OB-3) + 3 `## Closing` rows in this ledger (OB-a..OB-c); **no other
  ledger has a `## Closing` block** — the legacy-tolerant skip confirmed on
  all five pre-existing trios, live.
- Fired: **none** — nothing was fireable. OB-a condition unmet (no
  integration PR exists yet: `gh pr list --head
  mission/deferred-obligations-integration` → `[]`); OB-c condition unmet
  (the release is not on `main`). No row ticked; no row deleted.
- **Surface list**: OB-1 (manual) · OB-2 (manual) · OB-3 (manual) · OB-b
  (manual) · OB-a (condition not yet met) · OB-c (condition not yet met) ·
  kept-not-deleted: the 3 unmerged pre-workflow branches and the 3 concluded
  integration branches (protected-set literal, see Deviations).

## Handoff log (newest first)

_≤10 lines per entry: what the session did, the verify signal, the branch,
what the next session needs. Newest on top; crash-safe by write-ahead._

- 2026-08-11 S6 (writer): protocol integration, one commit. end.md new §3
  close fall-through (later sections →§4–6); mission.md §5 close subsection;
  check.md item 8 (grep-only due count). Both mirrors: §3 obligations-due row
  (dispatch-proven claims only), §4 fall-through + edge-hooks note, §5
  `## Closing` row mention + mission-close paragraph; README reflexes
  Five→Six (derived from hooks.json). settle.md #2–#5: no-PR ladder sub-case,
  full 40-char SHA, default-branch guard, awk wrap — recipes exercised live.
  OB-3 clause amended (shield = open missions only; reap parked for S8).
  Digitless cadence fails 13/14 (anti-inert; `every phase PR is merged`
  passes). Gates: lint clean · hook-test 73 · selftest 54. Next: ckpt-p3.
- 2026-08-11 S5 (backend): `hooks/lib/obligations-due.sh` + hooks.json
  registration (SessionStart `startup|resume` — never `compact`), one commit.
  Grep-only advisory (no network/gh/probes): register + Closing counts +
  oldest row (140-codepoint cap) + `/agentic-workflow:settle`; 4 silencers;
  exit 0 all paths. Harness 64→73; matcher pin extended to
  `["compact","startup|resume"]` (regex proven not to match `compact`).
  Mutants: 5 killed, M1b masked-by-design; each adds 0 failures under the
  stashed pre-change harness. Live: 3+3 counted, re-fire suppressed. Gates:
  lint clean · hook-test 73 · selftest 54. Next: S6.
- 2026-08-11 S4 (devops): live settle on this repo's rot, steps executed by
  hand per `commands/settle.md`. Reaped 41 merged locals (`-d`, zero
  refusals) + 15 merged remotes (rung-2 evidence per branch: merged PR →
  merge commit → `lint:success`; 2 no-PR plan branches via ancestry +
  CI-on-tip) + 2 stale worktree registrations; 0 `worktree-agent-*` existed.
  Counts: local 53→12, remote 22→7, worktrees 3→1; residue = protections
  only, each named in the evidence block. Register seeded: OB-1 (n=1 band
  re-measure), OB-2 (D4b corpus), OB-3 (concluded integrations, parked —
  protected-set literal). Obligations pass: nothing fireable; 6-row surface
  list. 5 settle.md text findings → Deviations. Gates: lint clean (check 14's
  first real register) · hook-test 64 · selftest 54. Next: ckpt-p2 [STRICT].
  probe (OQ4 §10 ladder, 4 rungs, fail-closed) · reap (dry-run first, `-d`
  never `-D`, protected set per L4) · write-back · mission-close gate with
  verbatim refusal wording (check 13 backstop). S1's softened refs restored to
  `/agentic-workflow:settle` in both templates, same commit; §9 mirrors +
  READMEs got minimal mentions. ckpt-p1 folds fixed in `tools/lint.mjs`: F1
  numeric-period · F2 placeholder-in-fired (real files only) · F3 fence-aware
  stamp scan — 4 mutations + 3 controls, all anti-inert vs stashed pre-change
  lint. Gates: lint clean · hook-test 64 · selftest 54. Inventory fragments
  exercised live (found OB-a/b/c). S4: dogfood reap + seed OB-1/OB-2.
- 2026-08-11 S2 (backend): lint checks 13 `checkClosing` + 14
  `checkObligationsRegister` added to `tools/lint.mjs` run-list (pure Node, no
  shelling out). Mutation matrix, each anti-inert vs the stashed pre-change
  lint: missing-`when:` row · `when: weekly` · stamp+`[ ]` · stamp+`[~]` sans
  `→ OB-` · register row sans `·` separator · non-integer id `OB-x` · `[x]`
  sans `· fired` — all fail new, pass old. Controls pass both: stamped fully
  fired/promoted ledger, in-flight unticked ledger, deployed register template
  + real rows; template placeholders and OB-a/b/c pass (repo-as-is green).
  Gates: lint clean · hook-test 64 · selftest 54. S3: `commands/settle.md`.
- 2026-08-11 S1 (writer): `## Closing` added to `templates/mission-state.md`
  (3 seeded rows: branch+worktree cleanup, docs/record synced, live-verify
  after reinstall) + new `templates/obligations.md` register template (OQ2).
  Grammar: `- [ ] OB-<n> · added YYYY-MM-DD (<source>) — do: <action> —
  when: <observable condition> — probe: <command | manual>`. Deviation: the
  brief assigns seeding `.plans/OBLIGATIONS.md` (OB-1/OB-2) to S4, not S1 —
  not created here. `node tools/lint.mjs`: pending orchestrator gate-run.
- 2026-08-11 planning: trio + brief authored on `plan/deferred-obligations`
  (off `main` = `2c8487f`, pre-#32 deliberately — zero file overlap with #32).
  `node tools/lint.mjs` green. Mission parked pending OQ1–OQ7 + the #32 merge.

Next up: ckpt-p3 — phase 3 diff-review + gates + mirror discipline (no prose
claim without a dispatched case).
