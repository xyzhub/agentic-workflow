---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: concurrent-missions — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide._

Converted from `docs/product/decisions/2026-11-19-concurrent-missions-brief.md`,
2026-11-19 (with its memos, journeys, metrics and counsel files of the same
date). Supersedes `.plans/write-sets.*` (its write-set field is task 5 here);
`parallel-waves` stays parked.

Goal: two different missions run at the same time on one machine, each in its
own worktree, and both land on the default branch with no conflict in
bookkeeping and no git or setup command typed by the owner.

**Parked** (LD-7). Nothing here is scheduled. Every line number below was
measured at `main` `5ba640e` (plugin 1.69.1) and is a hint beside a symbol
anchor; un-parking starts with a `replan` that re-measures them.

Estimate: **7 sessions** — phase 1 only (6 briefs + 1 checkpoint; owner cut 8 → 7 on
2026-11-19, PD-13). Phase 2 is
planned at **2 more** (1 brief + 1 checkpoint) and is added to `Estimate:` only
by the owner's dated decision when the phase 2 gate opens (PD-9, confirmed by
the plan-judge 2026-11-19) — 9 in all if it opens. No corrective is pre-booked.

| Phase | Sessions | Why this many |
|---|---|---|
| 1 — everything except agent-merge | S1–S6 + ckpt-p1 = 7 | Six deliverable groups, each 850–1,250 lines of reads against a 1,500 budget; no two fit one brief. One checkpoint (PD-13): S1's 4,300-line move is checked by re-running its proofs at S1's SHA, never read line by line; an orchestrator gate run after S3 catches S1–S3 defects early. Owner-accepted risk: one corrective pass covers six briefs |
| 2 — agent merges what the owner approves (gated) | S7 + ckpt-p2 = 2 | One security brief (guard value, identity check, approve-shape block, land mode) and its checkpoint |

## Tasks

AC-1..AC-17 are the brief's criteria, ids unchanged. AC-18..AC-22 are added by
the planner so LD-2, LD-4, LD-5, LD-1's phase 2 conditions and the memo's
contradiction list each have a criterion a reviewer can check.

1. **Central lists become folders** (S1) — the lint check array, the hook-test
   cases and the lint-test cases become one file per entry, discovered in
   sorted order.
   - AC-6 The central lists two missions are known to both append to are
     folders of entries, discovered automatically: `tools/lint.d/`,
     `tools/hook-test.d/`, `tools/lint-test.d/`; a self-check fails when a file
     in a folder was not picked up; the same checks and cases run before and
     after (the same check count as the baseline, identical `ok` lines, same
     lint-test case total).
2. **A worktree per mission, brought to life, under a cap** (S2).
   - AC-1 Starting a mission creates or reuses its own worktree and brings it
     to life from a §10 recipe; the owner never runs a git or setup command.
   - AC-3 The per-project cap holds (default 2): a mission beyond it does not
     start and says which missions hold the slots.
3. **Ledger by branch** (S2).
   - AC-4 Each mission's hooks follow its own ledger, never the other's
     (ledger chosen by branch, not newest mtime).
4. **Bookkeeping fragments** (S3; landing half in S5).
   - AC-5 No mission edits the version number, and the changelog and
     obligations are written one file per mission.
   - AC-8 The version is assigned and the changelog files combined at landing;
     two missions' bookkeeping lands with zero conflicts.
5. **Declared write sets and the pre-start overlap check** (S4).
   - AC-2 The new mission's declared files are compared with every running
     mission's before work starts; an overlap is shown in plain words with a
     choice (wait, or run and resolve at landing).
6. **Clash resolution** (S4 classifier and brief template; S5 wiring).
   - AC-11 A tiny clash is fixed by the orchestrator; any other is fixed by one
     one-shot existing builder; the combined tests pass before landing.
   - AC-12 Where the fix changed real code, the reviewer re-checks just that
     part before it lands.
7. **The plugin's queue, "agent prepares, owner clicks"** (S5).
   - AC-7 The owner approves PRs in any order; the agent lands them one at a
     time, each first updated from main and re-tested on the combined result.
     _Phase 1 reading (PD-4): the owner's merge click is the approval; the
     agent prepares one PR at a time against current main._
   - AC-9 A PR whose combined tests fail goes back to its mission with a plain
     reason; the rest of the queue keeps moving.
   - AC-19 (LD-4) The combined result is tested on a scratch ref; no commit is
     pushed to a branch the owner has approved; the version and changelog are
     set in a follow-up after the merge, never on the feature branch.
8. **Burn meter and spend ceiling** (S6).
   - AC-18 (LD-2) Spend per hour is recorded per mission and combined; a second
     mission does not start unless §10 carries an owner-confirmed ceiling; above
     the ceiling new spawns pause and the owner is asked.
9. **Acceptance and record** (S6 fixture; real run as ledger rows).
   - AC-13 Two real missions run at once in separate worktrees and both land
     with no PR updated by hand.
   - AC-14 A deliberate overlap is flagged before the second mission starts.
   - AC-15 A deliberate clash is fixed automatically and the tests pass.
   - AC-16 Both missions change bookkeeping and both land clean.
   - AC-17 `node tools/lint.mjs` green; protocol text has one home
     (`checkRuleDedup`).
   - AC-22 Each contradiction C3–C14 in the memos (lines 749–769) is either
     reworded in its one home or recorded here as superseded (C5) or owner-open
     (C10, C12); new protocol text lives in `templates/concurrency.md`, with
     pointers elsewhere.
10. **Agent merges what the owner approves** (phase 2, S7, gated).
    - AC-10 The agent merges ONLY a PR the owner approved. The approval must be
      a signal the agent itself cannot produce.
    - AC-20 (LD-5) A per-PR landing lock with a heartbeat, re-checked before
      merging; the merge guard blocks approve-shaped commands; an unexpected
      403 or a hook timeout fails closed.
    - AC-21 (LD-1) Agent-merge is refused unless a listing of the host's stored
      GitHub logins shows no owner login AND the acting identity is not an
      approver.

## Value sourcing

| AC | Value | Source kind | Where |
|---|---|---|---|
| AC-1 | Worktree path `.claude/worktrees/<mission>`, fallback `.worktrees/<mission>` | locked decision | 2026-11-19 LD-6 — memos `:165–166` (M1 values) |
| AC-1 | Branch `mission/<mission>-p<n>` | locked decision | 2026-11-19 LD-6 — memos `:166` |
| AC-1 | Scratch database name `<repo>_<mission>`, `[a-z0-9_]`, ≤ 63 bytes; admin URL only in the main checkout's untracked env | locked decision | 2026-11-19 LD-6 — memos `:167`; the 63-byte limit is the memo's assumption, verified in S2 |
| AC-1 | Recipe keys `install` · `copy` · `generate` · `db` · `port` · `script` | locked decision | 2026-11-19 LD-6 — memos `:119–135` |
| AC-3 | Cap default 2, a §10 row | locked decision | 2026-11-19 — brief `:67` ("Set per project", default 2) |
| AC-3 | Slot = a live worktree whose own-branch ledger is active | locked decision | 2026-11-19 LD-6 — memos `:169` |
| AC-4 | Ledger = longest existing prefix of the cwd branch after `mission/`; mtime only as fallback | locked decision | 2026-11-19 LD-6 — memos `:168` |
| AC-5 | `changelog.d/<mission>.md`, first line `bump: <level>`; `.plans/obligations/<mission>.md`; ids `OB-<mission>-<k>`; `[Unreleased]` retired | locked decision | 2026-11-19 LD-6 — memos `:493–495` |
| AC-5 | Version pin files (two) | derivation | `plugins/agentic-workflow/.claude-plugin/plugin.json:4`, `plugins/agentic-workflow/package.json:3` (memo fact G3) |
| AC-6 | Folders `tools/lint.d/`, `tools/hook-test.d/`, `tools/lint-test.d/`; discovery = sorted filename; `hooks.json` and the README stay single files | locked decision | 2026-11-19 LD-6 — memos `:592–593` |
| AC-2 | `Writes` field and entry forms: exact path · `dir/` · whole-segment `*` · `**` · final-segment `*`; undecidable = overlap | locked decision | 2026-11-18 (parallel-waves LD-4, carried by `.plans/write-sets.md:173–176`) |
| AC-2 | Comparison = declared ∪ three-dot actual changes of each running mission, read from its own branch | locked decision | 2026-11-19 LD-6 — memos `:686` |
| AC-11 | Tiny = every hunk pure addition + the union parses + combined tests pass; else real | locked decision | 2026-11-19 LD-6 — memos `:639–649`, `:686–687` |
| AC-11 | The builder brief template | locked decision | 2026-11-19 LD-6 — memos `:651–666` |
| AC-7 | Labels `aw:queue`, `aw:returned`; landing worktree `.claude/worktrees/_land`; "first one in drains the queue"; update by merge, never rebase | open question | OQ-6 — memo M2 values, under no lock (LD-6 names M1, M3–M6 only) |
| AC-7 | Label `aw:ready` (at most one PR at a time), carrying the default-branch commit it was tested against | open question | OQ-6 — the planner's addition for PD-4; not in any memo |
| AC-8 | Follow-up branch `chore/landed-<short sha of the default branch>`; one open follow-up at a time | derivation | PD-12 — LD-4 ("a records-only follow-up") gives no name; the one-at-a-time rule is what keeps AC-8 true |
| AC-2 | Flag `--overlap=run` recording the owner's "run now" choice | derivation | memos `:637` ("The answer is a dated locked decision in the new mission's ledger"); the flag name is Assumed |
| AC-1, AC-3 | §10 row names **Worktree recipe** and **Mission cap** | locked decision (recipe) · derivation (cap) | 2026-11-19 LD-6 — memos `:119–123`; the cap row name is the planner's, from brief `:67` |
| AC-19 | Version next = current pin raised by the largest `bump:` among the folded fragments | derivation | memos `:493–494` (`bump: <level>`) + `:487` (the version is set at landing); never a literal in this plan |
| AC-18 | Doubling line 2.2 × baseline; pause line 3.0 × | locked decision (2.2) · derivation (3.0) | LD-1 names 2.2; 3.0 is `metrics.md:76–81` (a proposal, judgement only) |
| AC-18 | Baseline = median tokens/hour of the first 3 single-mission runs | derivation | `metrics.md:39`, `:84–87` |
| AC-18 | Ceiling value | input | the owner, into the §10 `Spend ceiling` row (LD-2) |
| AC-18 | Event names `worktree.prepare`, `burn`, `queue.update`, `queue.test`, `queue.land`, `clash.spawn` | derivation | `metrics.md:95–96`, `:130–134` |
| AC-13, AC-14 | Event names `brief.start`, `brief.end`, `wait` | derivation | `metrics.md:21` (`brief.start`), `:39` (`wait`), `:41` (`brief.end`) |
| AC-12 | Event name `clash.review` and `land.mjs reviewed <pr> <sha>` | derivation | `metrics.md:20` check (d) and `:102` ("AC-12 reviewer run after a code-changing fix, yes/no"); names are the planner's, Assumed |
| AC-18 | Sidecar `.plans/<mission>.metrics.jsonl`, append-only, **tracked** | derivation | path `metrics.md:64`; tracked by PD-11 (§5: `.plans/` is tracked, never gitignored) |
| AC-18 | §10 row name **Spend ceiling** | derivation | LD-2 ("a confirmed ceiling"); the row name is the planner's |
| AC-20 | Per-PR lock ref name, heartbeat interval, stale threshold | open question | OQ-6 — LD-5 fixes the shape (per PR, heartbeat, re-checked), no numbers |
| AC-21 | Approver logins | input | the owner, into a §10 `Approvers` row |
| AC-10, AC-21 | §10 Merge policy value `agent-may-merge (owner-approved, delegated <date>)` and the row name **Approvers** | open question | OQ-6 — memos `:363`, `:399` (M2, under no lock) |
| AC-13 | State words and sentences M1–M16 | derivation | `journeys.md:23–31`, `:151–169`; the planner adds one phase 1 sentence (PD-4) |

## Locked decisions

Owner locks, carried from the brief with their date. Not re-litigated.

- 2026-11-19 — **LD-1** Two phases in ONE mission. Phase 1: worktree per
  mission, ledger by branch, bookkeeping fragments, central lists → folders,
  pre-start overlap check, per-project cap (default 2), the one-shot clash
  builder, a burn meter, and the plugin's queue in "agent prepares, owner
  clicks" mode. Phase 2 (gated): "agent merges what I approve", enabled only
  (a) on a host where no owner GitHub login is stored — detected by listing
  stored logins, not by probing the ambient token — and (b) after the first
  real two-mission run shows combined tokens/hour ≤ 2.2 × the single-mission
  baseline. Phase 2 needs an agent GitHub identity the owner creates; a token
  issued on the owner's own account does not satisfy it.
- 2026-11-19 — **LD-2** Measure first, then set the spend ceiling. Two missions
  cannot run at once until an owner-confirmed ceiling exists; above it new
  spawns pause and the owner is asked.
- 2026-11-19 — **LD-3** A clash fix that changes approved code needs
  re-approval; only when the fix changed what the owner approved.
- 2026-11-19 — **LD-4** Never push to an approved branch. The combined result
  is tested on a scratch ref; the merge lands exactly the approved commit; the
  version and changelog are set in a records-only follow-up.
- 2026-11-19 — **LD-5** A per-PR landing lock with a heartbeat, re-checked
  before merging; the merge guard also covers approve-shaped commands; any
  unexpected 403 or hook timeout fails closed; the worktree path's survival
  against Claude Code's own cleanup is measured before any brief depends on it.
- 2026-11-19 — **LD-6** Architect picks M1, M3–M6 stand: `.claude/worktrees/<mission>`
  with `.worktrees/` as fallback; changelog and obligations one file per
  mission with `OB-<mission>-<k>` ids; lint checks, `hook-test` and `lint-test`
  become folders while `hooks.json` and the README stay single files with
  pure-addition clashes auto-merged; the overlap check compares declared files
  plus each running mission's actual changes; no GitHub native queue in v1.
- 2026-11-19 — **LD-7** Planned and parked. `write-sets` is superseded;
  `parallel-waves` stays parked.

**Memo text the locks supersede — not lifted as values:** M2 landing steps 4
and 6 (bookkeeping commit and push onto the PR branch, memos `:247–248`, `:252`), the
approval binding rule (ii) (`:355–358`), C5's "the lander pushes onto another
mission's PR branch" (`:757`), and M3's "the lander folds on the branch" — all
by LD-4. M2's whole-queue lock with a 30-minute takeover (`:197–203`) — by LD-5.
The metrics check AC-13(c) "every update-from-main commit is the agent's"
(`metrics.md:20`) — by LD-4; S6 checks "no owner-authored commit and no push
after approval" instead. M2's acting-identity probe — by LD-1 (listing).

Planner decisions (decomposition, 2026-11-19):

- **PD-1** One branch and one feature PR per phase: `mission/concurrent-missions-p1`,
  `mission/concurrent-missions-p2`.
- **PD-2** `tools/lint.mjs`'s check-array line is edited in exactly one brief
  (S1), which deletes it; every later check in this mission is a new file in
  `tools/lint.d/`. S1 is its own commit, containing nothing else (R-1).
- **PD-3** New protocol text lives in a new `plugins/agentic-workflow/templates/concurrency.md`;
  `templates/WORKFLOW.md` (4,134 B of headroom) and `commands/mission.md`
  (1,193 B) take pointers only, under the per-brief byte budgets in the
  sessions file (R-3).
- **PD-4** Phase 1 has no approval step. A PR's author cannot approve it
  (memo fact F2) and every PR here is authored by the owner's account, so in
  phase 1 the queue is every open mission PR carrying `aw:queue`, prepared one
  at a time against current main, and the owner's merge click is the approval.
  One sentence is added to the journeys table for it: `<PR title> is tested
  with everything landed. It has not landed. Click merge: <PR link>.` Open as
  OQ-5.
- **PD-5** Brief `Writes` lines never name `.plans/` (the write-sets grammar
  rejects it; agents never edit the ledgers). A mission's own trio, its
  `changelog.d/<mission>.md` and its `.plans/obligations/<mission>.md` are
  implicit and excluded from the overlap comparison (memos `:627–629`).
- **PD-6** The "parallel-safe" soft rule (`agents/planner.md:70`,
  `templates/mission-sessions.md:28`, `commands/mission.md:184`) is left alone:
  retiring it belonged to the parked parallel-waves half of `write-sets`.
- **PD-7** Sentences M1–M16 and the state words are copied once, verbatim, into
  `plugins/agentic-workflow/tools/words.mjs` (S2); every other tool imports them.
- **PD-8** No `tracking-plan.md` exists in this repo (R-8). The event table has
  one home, `templates/concurrency.md`; no tracking-plan file is created.
- **PD-13** (owner, 2026-11-19) One phase-1 checkpoint, not two: the former
  mid-phase review (ckpt-p1a, after S1–S3) is folded into ckpt-p1. Keeps the
  burn meter (S6). Preset stays balanced. If ckpt-p1's diff outgrows one
  reviewer, the reviewer says so and the corrective is a split review, not a
  skipped lens. An orchestrator gate run after S3 (no session) stands in for
  the folded review's early catch.
- **PD-9** `Estimate:` covers phase 1. Opening the phase 2 gate is a dated
  owner decision that raises it by 2 (to 9) in the same edit. Confirmed by the
  plan-judge 2026-11-19; OQ-12 is closed.
- **PD-10** Owner actions are never brief steps: creating the agent identity,
  the `Approvers` row, changing the §10 Merge policy, confirming the ceiling.
  They are gate or Closing rows in the ledger.
- **PD-11** The metrics sidecar `.plans/<mission>.metrics.jsonl` is tracked
  and committed with the ledger. It must outlive its worktree, because the
  baseline reads past missions' sidecars; each mission writes only its own,
  so two missions never touch the same file.
- **PD-12** One open version follow-up at a time, and at most one PR marked
  ready at a time. A follow-up still open when another mission lands is
  closed and replaced by one that folds both; a second PR is tested only on
  a default branch that already holds the first. Without these the
  bookkeeping conflict would only have moved to the follow-ups (AC-8, AC-16).

Assumed (no spike ran any of these; #130 — none is a lock):

- Assumed 2026-11-19 — owes a first real run; built on the tool names and
  flags `worktree.mjs up|down|slots`, `fragments.mjs fold|check`,
  `write-sets.mjs --check|--against|classify`, `land.mjs status|prepare|stamp`,
  `burn.mjs record|rate|baseline|gate`, `ledger.mjs <mission> event`;
  authorized by the planner. A builder that must rename one returns `deviation`.
- Assumed 2026-11-19 — owes probe 1 (orchestrator, before S1); built on a hand-made worktree under
  `.claude/worktrees/` surviving Claude Code's cleanup; fallback `.worktrees/`
  (LD-6); authorized by LD-5.
- Assumed 2026-11-19 — owes probe 2 (orchestrator, before S1); built on a create-only push
  (`--force-with-lease=<ref>:` with an empty expected value) refusing a second
  taker; fallback: `git push` of a new ref without force, which a remote
  rejects when the ref exists; authorized by the planner.
- Assumed 2026-11-19 — owes probe 3 (orchestrator, before S1); built on an isolated session being
  able to create and write `.claude/worktrees/_land`; fallback: the landing
  step runs from the main checkout (memos `:215–220`); authorized by the planner.
- Assumed 2026-11-19 — owes probe 4 (orchestrator, before S1); built on a
  spawn's result exposing token usage; fallback: the transcript's `usage`
  figures; if neither, see OQ-10; authorized by the planner.
- Assumed 2026-11-19 — owes S5's harness; built on `git merge-tree --write-tree`
  (git 2.56.0 here; a venture host's git is unmeasured); authorized by the planner.
- Assumed 2026-11-19 — owes probe 5 (orchestrator, before S1 — not S7's
  harness); built on `gh auth status` listing every stored login on the host;
  authorized by the planner. If it lists only the active login, GATE-P2's
  condition (a) has no probe and the owner is told before S1.
- Assumed 2026-11-19 — owes S2's harness; built on `psql` being on PATH on a
  venture host for the scratch database; fallback: the recipe's `script:` key;
  authorized by the planner.

## Risks

- **R-1 `tools/lint.mjs` is contended.** `feat/continuous-op` (`8ba8bf6`)
  changes 20 lines of it (19 added, 1 removed), the array line (`:1402`) among them; S1 deletes that
  line. Containment: (1) recommended order — un-park after continuous-operation
  lands (OQ-1), so S1 converts its check too; (2) the line is edited by one
  brief, in one commit, by a scripted split that can be re-run; (3) every later
  check is a new file; (4) before each checkpoint the orchestrator merges
  `main` into the phase branch — if the array line conflicts, the rule is
  fixed: keep it deleted and move each new name into its own `lint.d` file;
  (5) if this lands first, continuous-operation's rebase meets the same one-line
  conflict with the same rule, and its orchestrator is told in the handoff.
- **R-2 The burn meter may have nothing to read.** Whether a spawn reports
  token usage is unverified (`metrics.md:41`, `:110–112`). Probe 4 settles it;
  without any source LD-2 cannot be met and two missions never run (OQ-10).
- **R-3 Byte ceilings.** `templates/WORKFLOW.md` 115,866 of 120,000 B;
  `commands/mission.md` 22,807 of 24,000 B (`tools/lint.mjs:1010–1014`). A new
  command must be named in both READMEs and `WORKFLOW.md` (`tools/lint.mjs:157`).
  PD-3 and the byte budgets bound it; a brief that cannot fit returns `deviation`.
  The budgets spend 2,600 of the 4,134 B left in `WORKFLOW.md` and 900 of the
  1,193 B left in `mission.md`; both headrooms are re-measured at un-park.
- **R-4 The version lags the merge.** Under LD-4 `main` carries a landed
  mission under the old version until the follow-up merges, while §10 says
  merging to `main` IS the release and the plugin cache is keyed by version.
  The follow-up is opened in the same turn as the merge is seen; who merges it
  is OQ-2.
- **R-5 The phase 2 gate chain is long.** Instrumentation ships → three
  single-mission runs give a baseline → the owner confirms a ceiling → a first
  real pair runs → its ratio is read → a bot-only host and an agent identity
  exist. Phase 2 may wait a long time or never open; the ledger treats that as
  a blocked row, not a failure. **If it never opens**, the owner writes a dated
  decision "phase 2 not opened" on the GATE-P2 row; the gate, S7 and ckpt-p2
  rows become `[~]`, one Closing row carrying both conditions is promoted to
  the register, and the mission closes on phase 1 with `Estimate:` unchanged.
  Phase 2 would then return as its own mission, drawn from S7. While blocked
  the ledger must not silence other missions' hooks (S2's rule).
- **R-6 A textual clash cannot land "exactly the approved commit".** GitHub
  will not merge a conflicting branch, so any clash fix is a new head. In
  phase 1 nothing is approved before the merge click, so the fix is pushed and
  re-tested. In phase 2 it collides with LD-3 and LD-6 (OQ-4).
- **R-7 The pre-start warning may cry wolf.** Nearly every mission here touches
  `templates/WORKFLOW.md` (memos `:679–684`); the message lists the files and
  S6 records flags against real clashes so the ratio is visible.
- **R-8 Missing file.** `metrics.md:130` names
  `docs/product/engineering/tracking-plan.md`; it does not exist (PD-8).
- **R-9 Venture work cannot be proven here.** Install, secrets and scratch
  database per worktree are exercised only by a harness with stub binaries;
  the first venture run is a Closing row. The tools reach a venture through
  `${CLAUDE_PLUGIN_ROOT}/tools/…` (nothing is copied in) and every rule a
  venture must obey lives in a plugin tool, not in this repo's root lint.
- **R-10 S1 moves about 4,300 lines by script.** Equivalence is proven by
  identical outputs, not by reading; a moved case that silently stops running
  is what the self-check (AC-6) exists to catch.
- **R-11 The merge guard reads command text** (memo fact G11): a shell heredoc
  that merely mentions the merge command is blocked. Briefs that write such
  text use the file tools.

## Open questions

- **OQ-1 When to un-park relative to continuous-operation.** **Recommendation:**
  after it lands — S1 then converts its check with the rest and R-1 disappears.
- **OQ-2 Who merges the version follow-up.** It changes the version pin files
  and `CHANGELOG.md`; the guard's records-only allowlist is `.plans/**` plus
  three record files (`hooks/lib/merge-guard.sh:150–153`), so today only the
  owner can merge it. **Recommendation:** the owner merges it in phase 1 (one
  more click per landing, no guard change before the gate); phase 2 adds a
  narrow guard shape that checks the diff is one version line per pin file.
- **OQ-3 How this mission's own phases get their version.** **Recommendation:**
  by the path it builds — a `changelog.d/concurrent-missions.md` fragment, no
  version edit on the branch, `land.mjs stamp` after the merge. The alternative
  is one last old-style bump on the branch.
- **OQ-4 A tiny clash after approval (phase 2).** LD-6 auto-merges
  pure-addition clashes and LD-3 asks again only when approved code changed;
  LD-4 lands exactly the approved commit, which a conflicting branch cannot
  be. **Recommendation:** decide at the gate; the planner would take the strict
  reading — any new head needs a fresh approval, one extra click per clash.
- **OQ-5 Phase 1 has no approval step, and never updates a PR branch (PD-4).**
  LD-1 says that in phase 1 "the agent updates and re-tests every PR". The
  plan reads "updates" as "brings it up to date for the test": the PR is
  merged with current main on a scratch ref and tested there, and the PR
  branch itself is left alone (LD-4), except when a clash fix needs a new
  commit. The literal alternative is to push a merge from main onto every
  open PR branch, which phase 1 permits (nothing is approved yet) but which
  re-runs CI on each push and has to be unlearned in phase 2.
  **Recommendation:** accept both — the merge click is the approval, and the
  test happens beside the branch, not on it.
- **OQ-6 M2's remaining values are under no lock** — the labels, the `_land`
  worktree, "first one in drains the queue", merge-never-rebase, and the lock's
  ref name and heartbeat numbers. **Recommendation:** accept them as the memo
  recommends; lock ref `refs/heads/aw/land-<pr>`, heartbeat numbers set in S5
  and reported.
- **OQ-7 C10 and C12 (phase 2).** Does an approval let the agent merge a
  batched staging → default PR; must the owner approve bookkeeping PRs where a
  server-side review rule is on. **Recommendation:** keep `batch` human-merged;
  take the memo's pick for C12 (the owner approves them where the rule is on).
- **OQ-8 What counts as the acceptance run.** AC-13 needs two real missions and
  LD-2 forbids a pair before a ceiling exists, so it cannot be shown on the
  phase 1 branch. **Recommendation:** the scripted fixture proves the mechanics
  before the merge; the first real pair the owner schedules is the acceptance
  run and the phase 2 measurement, as ledger rows.
- **OQ-9 "No additional overhead".** The analyst defined it as owner minutes,
  setup time and tokens per mission (`metrics.md:30–41`, `:125–126`) and asks the owner to
  confirm. **Recommendation:** confirm.
- **OQ-10 If token usage cannot be read at all.** **Recommendation:** two
  missions stay off (the cap behaves as 1) and the owner is told why.
- **OQ-11 App or machine account.** LD-1 says a GitHub App; the orchestrator's
  note allows a separate machine account. **Recommendation:** either — the check
  is "acting login is not an approver and no owner login is stored".
- **OQ-12 — closed 2026-11-19.** Estimate treatment: 8 now (7 since PD-13), +2 at the gate
  (PD-9), confirmed by the plan-judge.
- **OQ-13 Two journey assumptions** (`journeys.md:57`, `:60–61`): an approved PR can be
  pulled out of the queue; a finished or approved mission holds its slot until
  it lands. **Recommendation:** yes to both — built that way.

---
_The `.plans/concurrent-missions.sessions.md` briefs execute these tasks;
`.plans/concurrent-missions.state.md` tracks progress. Resolve every open
question before execution starts._
