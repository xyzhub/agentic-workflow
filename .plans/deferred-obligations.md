---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: deferred-obligations — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope was settled before this file existed — the owner's verified problem
statement is locked source material, quoted in the brief._

_Shaped 2026-08-11 · brief:
`docs/product/decisions/2026-08-11-deferred-obligations-brief.md` · ledger:
`.plans/deferred-obligations.state.md` · briefs:
`.plans/deferred-obligations.sessions.md`_

Goal: give deferred obligations a **parking place and a trigger** — a checkable
one-line grammar ("do X — when Y — probe Z") in per-mission `## Closing` blocks
and a repo-level register, a mission-close gate that **refuses to report a
mission closed while Closing items are unticked**, a condition-driven
branch/worktree reaper, and an advisory beat that surfaces what is due.

## Tasks

1. **Obligation grammar + templates.** `templates/mission-state.md` gains a
   `## Closing` block (grammar documented in-place, standard seeded rows:
   branch reap, docs sync, live-verify/reinstall); a new
   `templates/obligations.md` defines the repo-level register. Acceptance: one
   row = one line matching
   `- [ ] OB-<n> · added YYYY-MM-DD (<source>) — do: <action> — when:
   <observable condition> — probe: <command | manual>`; fired rows keep the
   line and append `· fired YYYY-MM-DD (<evidence>)` — never deleted (the
   standing-steers retire-don't-delete precedent); `checkTemplateFrontmatter`
   still passes.

2. **Lint enforcement, fail-closed and legacy-tolerant.** Two new checks in
   `tools/lint.mjs` (following checks 11 + 12 in structure): (13) `## Closing`
   grammar in every `.plans/*.state.md` that HAS the block — plus the refusal
   backstop: a `Closed:` stamp coexisting with a `[ ]` Closing row, or with a
   `[~]` row lacking a `→ OB-<n>` promotion ref, fails the gate; ledgers
   without the block pass untouched (all five existing trios must not start
   failing). (14) register grammar for `.plans/OBLIGATIONS.md` when present;
   absence passes (fresh consumer). Acceptance: mutation-proved in both
   directions with an anti-inert control each.

3. **`/agentic-workflow:settle` — the probe-and-fire command.** New
   `commands/settle.md`: inventory every obligation (register + all ledgers'
   `## Closing`), run each `probe:` (git/gh allowed — probes live in command
   steps, never hooks), **fire the safe class** (the reaper, task 4), tick
   fired rows with evidence, surface everything else. Acceptance: every
   deletion gate from L4 appears verbatim; every shell fragment is
   GNU/BSD-portable (L9); probe degradation follows the §10 profile (OQ4).

4. **The reaper, inside `/settle`.** Condition-driven, never time-driven:
   `git fetch --prune` → `git worktree prune` → local `worktree-agent-*` and
   merged locals via `git branch -d` (never `-D` — git's own merged check IS
   the gate, OQ7) → remote branches only when merged into the default branch
   AND the deploy that carried them concluded green (probe per §10; no CI →
   merged suffices; no `gh` / ambiguous → surface, don't delete). Protections:
   the default branch, anything unmerged, integration branches with an open PR,
   §10-listed protected branches. Acceptance: a dry-run listing precedes any
   deletion; the live dogfood run (task 5) deletes this repo's own rot and
   demonstrably spares the protected set.

5. **Dogfood + seed.** Run the reaper live on this repository (measured
   2026-08-11: 17 merged remote branches, 37 merged local, 3 worktrees) and
   seed `.plans/OBLIGATIONS.md` with the two live unfired obligations: **OB-1**
   the n=1 handoff-budget band re-measure
   (`.plans/compaction-continuity.state.md:75` / `:176`) and **OB-2** D4b's
   cross-mission re-measurement corpus (`.plans/compaction-continuity.md:142`).
   Acceptance: post-run, `git branch -r --merged origin/main` residue is
   protections only; an evidence table (branch → gate result → action) lands in
   the ledger; both seed rows parse under check 14.

6. **The advisory beat — `hooks/lib/obligations-due.sh`.** SessionStart
   (matcher `startup|resume` — never `compact`, which compact-resume owns):
   grep-only, offline, counts unticked register rows + unticked `## Closing`
   rows, injects ≤3 lines pointing at `/agentic-workflow:settle`. Four
   silencers (L13). Acceptance: registered + described in `hooks.json` in the
   same commit; harness cases pin firing, every silencer, and the matcher
   shape (the existing pinned case "SessionStart matcher is exactly
   [compact]" in `tools/hook-test.mjs` must be updated deliberately, not
   deleted); mutation-proved with anti-inert control.

7. **Protocol integration, atomic-ref.** `end.md` gains the close-mission
   fall-through step (read `## Closing`, refuse, point at `/settle`);
   `mission.md` gains a "Close the mission" section (the refusal + promotion
   semantics, L2); `check.md` reports the due-obligation count; both
   `WORKFLOW.md` mirrors (§3 guardrail row, §4 close step, §5 Closing block)
   and the README reflexes paragraph change in the same commits as what they
   describe. Acceptance: mirrors byte-identical outside `docs/WORKFLOW.md`
   line 3; every behavioral claim about the hook is one a harness case
   dispatches.

8. **Record and ship.** CHANGELOG, JOURNEY, status page, integration PR body
   (authored to `.plans/deferred-obligations.artifacts/`). Acceptance: the PR
   body states what was proven live (the reap, on this repo) vs by dispatch
   only (the hook) vs by lint fixture (the refusal); this mission's own ledger
   closes through its own `## Closing` gate.

## Locked decisions

- **2026-08-11 — L1. Gate policy: `batch`.** Phase branches
  `mission/deferred-obligations-p1…p4` merge into
  `mission/deferred-obligations-integration` on APPROVE; never the default
  branch; the human merges the integration branch once. `[STRICT]` verdicts
  and any REQUEST CHANGES are pushed to the human the moment they land.
- **2026-08-11 — L2. The checklist is the authority (owner acceptance 1).** A
  mission with any `[ ]` row in `## Closing` cannot be reported closed.
  Promotion semantics: a row whose condition cannot fire yet is set `[~]` with
  an explicit `→ OB-<n>` ref after its verbatim copy lands in the repo
  register — the obligation survives the mission; the mission may then close.
  `[~]` without a promotion ref blocks closing too.
- **2026-08-11 — L3. Condition-driven, never time-driven (owner lock).** The
  deferral itself is correct — deletion after green deploy is the right gate;
  this mission adds the trigger, not an earlier deletion. A `when:` names an
  observable state, never a clock; timer-shaped obligations get
  `probe: manual` and are surfaced, honestly, not fired.
- **2026-08-11 — L4. Fail-closed deletion gates (owner lock).** Never delete:
  unmerged branches, integration branches with an open PR, §10-protected
  branches, the default branch. Local deletion is `git branch -d` only —
  never `-D`. Remote deletion requires merged-into-default AND
  deploy-concluded-green per the §10 profile. `gh` absent or the probe
  ambiguous → surface, don't delete.
- **2026-08-11 — L5. Probes run in command steps; hooks stay offline.** The
  only autonomous surfaces are hooks (platform lock), and hooks here are
  grep/echo, deterministic, no network, always exit 0. `gh run list` /
  checks-API probes run only inside `/settle` and the close step.
- **2026-08-11 — L6. A lesson is not an obligation.** Portfolio-learning's
  scholar machinery (parked) holds retrospective generalizations with no
  trigger and no done-definition; obligations are specific actions with an
  observable condition. The two stores stay separate; the scholar may WRITE
  obligation rows it discovers, later — it does not own the register.
- **2026-08-11 — L7. Mutation-proof + anti-inert, everywhere.** Every new
  check and every hook behavior ships a case that fails without it, proved in
  both states, with the mutation re-run against the pre-change checker.
  Doc claims about hook behavior are verified by dispatch, not by reading.
- **2026-08-11 — L8. Atomic-ref.** A hook, its `hooks.json` description, both
  `WORKFLOW.md` mirrors, and the plugin README change in ONE commit. Never
  touch `docs/WORKFLOW.md` line 3's version stamp outside a release session.
- **2026-08-11 — L9. Zero-dep; GNU/BSD-portable shell.** This repo's CI is
  Ubuntu; every local gate is macOS. No `stat -f`-shaped divergence (the
  2026-08-11 CI-fix lesson): any flag not in both BSD and GNU coreutils is
  banned from new shell.
- **2026-08-11 — L10. Never `Read`/`cat`/`head`/`tail` a `*.jsonl`.**
- **2026-08-11 — L11. Prefer more, smaller sessions.** Eight sessions where
  five would fit, deliberately.
- **2026-08-11 — L12. The human-merge rule is untouched (owner lock).**
  Deletion is not merging: it destroys nothing not already in `main` once
  L4's gates hold — that is the entire safety argument, and why reaping is
  delegable while merging never is.
- **2026-08-11 — L13. Silencer discipline (OQ4 philosophy, inherited).** The
  due-beat has exactly four silencers: (a) silent when no register and no
  `## Closing` block exists anywhere in `.plans/`; (b) silent when zero
  unticked rows; (c) once per session (`$TMPDIR` marker keyed by
  `session_id` — the handoff-budget pattern); (d) ≤3 lines, always exit 0.
  If it nags in practice, drop surfaced classes or raise the bar — never add
  conditions.

## Risks

- **A wrong deletion is the one near-irreversible act in the mission.** →
  L4's gates, `-d` never `-D`, dry-run listing before any deletion, ckpt-p2
  is `[STRICT]` and audits the deletion log against reflog + `gh`, and the
  dogfood run happens on THIS repo where the owner can inspect everything.
- **The register becomes a write-only junk drawer.** → every row needs an
  observable `when:` and a `probe:` to parse at all (check 14); `/settle`
  surfaces rows whose probe has been `manual` for two consecutive runs as
  "needs an owner decision", and the due-beat keeps the count visible.
- **Another always-on hook is more A5 machinery** (machinery grew 5.4% → 9.3%
  during the mission that measured it). → one hook, SessionStart only, four
  silencers, ≤3 lines, and the firing population is sessions in repos that
  actually carry obligations.
- **The close-refusal wedges missions whose conditions cannot fire for
  weeks.** → L2's promotion semantics: the obligation moves to the register,
  the mission closes, the trigger survives.
- **PR #32 is unmerged and carries files this mission edits**
  (`hooks.json`, `tools/hook-test.mjs`, the compaction ledger the seeds
  cite, the `$TMPDIR` marker pattern S6 reuses). → OQ1: execution holds for
  the merge; the plan trio itself overlaps #32 by zero files.
- **Mirror conflicts across phases** — P3 edits both `WORKFLOW.md` mirrors. →
  phases sequential, none parallel-safe; doc sessions re-verify mirror
  offsets at their own start.
- **Beat-enforcer false matches on new ledger prose** (it greps
  checkpoint/reviewer/chronicler in `[ ]` rows; precedent: the 2026-08 S4
  rewording). → session-row prose in the new ledger avoids those words;
  checkpoint rows match intentionally.

## Open questions

_Each carries the planner's recommendation; these go to the human **before**
`/agentic-workflow:mission` drives execution._

- **OQ1 — When does execution start, relative to PR #32?**
  **Recommendation: hold execution until #32 merges, then base every phase off
  `main`.** S6 edits `hooks.json` and `tools/hook-test.mjs` — both changed by
  #32; S5's seeds cite `.plans/compaction-continuity.state.md`, which only
  reaches `main` with #32; S6 reuses handoff-budget's marker pattern, ditto.
  Basing off `mission/compaction-continuity-integration` instead (the
  compaction OQ1 precedent) works if the owner wants to start sooner, at the
  cost of a retarget. The plan branch itself (`plan/deferred-obligations`)
  adds only new files and conflicts with nothing.

- **OQ2 — Where does the cross-mission register live?**
  **Recommendation: `.plans/OBLIGATIONS.md`** (template
  `templates/obligations.md`). The hooks' cwd-relative predicates already
  scan `.plans/`; the uppercase name cannot collide with the `*.state.md`
  ledger glob or the `*.sessions.md` briefs; and obligations are
  execution-state, which is what `.plans/` holds — `docs/product/` is the
  owner-facing record, wrong register for machine-probed rows. Rejected:
  `.remember/` (session-recall store, not durable protocol state) and a
  per-mission-only design (the owner's instances outlive their missions by
  construction).

- **OQ3 — Which beats does the condition-check ride, with what silencer
  discipline?**
  **Recommendation: one new hook + three command steps.** The hook:
  SessionStart matcher `startup|resume`, advisory, grep-only, four silencers
  (L13) — session start is where a due count changes behavior (the session
  can actually run `/settle`), and it fires at most once per session by
  construction. The command steps carry the real probes: `/settle` (the
  actor), the `end.md` close fall-through, and a `check.md` due-count row.
  Rejected: UserPromptSubmit (every-turn noise for a weekly-scale signal —
  the A5 lesson), Stop (the re-fire failure mode needs a guard for no gain —
  nothing about "due" is turn-end-shaped), and probing from any hook (L5).

- **OQ4 — How is deploy-green probed in repos without CI or deploys?**
  **Recommendation: the §10 profile row decides, degrading fail-closed.**
  Profile has deploy + CI → checks API green on the merge commit of the PR
  that carried the branch (`gh pr list --state merged` →
  `gh run list --commit <sha>`). CI but no deploy (this repo: merge to main
  IS the release) → CI green on the merge commit. Neither → merged-into-
  default alone satisfies the condition, and the reap says so in its
  evidence line. `gh` missing, rate-limited, or ambiguous → the branch is
  surfaced, never deleted. The gate never silently weakens: which rule
  applied is part of the evidence row.

- **OQ5 — Is the close refusal a command step, a lint check, or both?**
  **Recommendation: both, split by role.** The command step (in `mission.md`
  close + the `end.md` fall-through) is the actor: it reads `## Closing`,
  refuses, and drives promotion — commands can talk to the human. The lint
  check is the mechanical backstop that survives an agent ignoring the step
  (this failure's exact shape: the checklist was right and ignored): a
  `Closed: YYYY-MM-DD` stamp coexisting with an unticked row fails the gate,
  fail-closed, and CI runs lint on every push. Legacy-tolerant: no stamp and
  no block → no check. A command step alone re-trusts agent discipline; a
  lint check alone can only complain after the fact — together the step acts
  and the gate catches.

- **OQ6 — Queue order vs portfolio-learning?**
  **Recommendation: deferred-obligations first.** (a) The class is bleeding
  now: two live unfired obligations, 17+37 stale branches on this repo, 33+18
  in the venture repo. (b) The scholar's Orderly sweep would indeed *find
  more instances* of this class — which is precisely the argument for
  building the parking place first: instances found with nowhere checkable to
  put them get re-lost (the ckpt-p2 backlog instruction was "found" once
  already, and lost). Sequenced this way, the sweep's findings land as
  register rows on arrival. (c) The dependency is one-directional: lessons
  machinery gains a write target from this mission; this mission needs
  nothing from the scholar. The honest counter — scholar-first would surface
  more instances before the row grammar freezes — is weak because the grammar
  is one extensible line and three same-shape instances already pin it.

- **OQ7 — Does `worktree-agent-*` reaping need the deploy gate?**
  **Recommendation: no.** Those branches never carry deploys — they are
  per-brief scaffolding whose commits, if they matter, were merged into a
  phase branch that carries its own deploy gate; the deploy condition is
  therefore vacuous for them and demanding it would park scaffolding forever
  (the 18-branch mess is exactly this shape). Their gate is git's own merged
  check: `git worktree prune` first, then `git branch -d` (which refuses
  unmerged work) — and a `-d` refusal means unmerged commits exist, so the
  branch is surfaced to the human, never force-deleted.

---
_The `.plans/deferred-obligations.sessions.md` briefs execute these tasks;
`.plans/deferred-obligations.state.md` tracks progress. Resolve every open
question before execution starts._
