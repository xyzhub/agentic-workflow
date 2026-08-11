# Deferred obligations get a home, a prosecutor, and a refusal

**Base:** post-PR-#32 `main` · **Merges:** `mission/deferred-obligations-integration` → `main`
(batch gate, L1 — four phase branches merged into the integration branch by the
orchestrator on APPROVE; the human merges the integration branch once, here.)

## Why — the owner's diagnosis (verbatim, locked)

> A completed mission left **33 merged remote branches + 18 stale
> `worktree-agent-*` local branches** weeks after shipping, while the closing
> session correctly reported "zero PRs open, everything green."

The root cause, stated once and true everywhere this mission touched:
**everything done correctly had an immediate trigger; everything missed was
deferred with nothing to fire it.** Branch deletion is gated on merged AND
deployed AND green — impossible at merge time, deferred by construction — and
the plugin had no mechanism to return to it. The same shape recurred three
times in one session (branch-delete, a lost backlog note, a missed cadence
ask); this mission builds the general parking place, not a branch-specific
patch.

## What ships

Four pieces, each a real commit on `mission/deferred-obligations-integration`
(Phases 1–3: `4262217` / `5daf851` / `c90f1fa`):

1. **The parking place.** A `## Closing` section in the mission-state ledger
   template (`plugins/agentic-workflow/templates/mission-state.md`) and a new
   repo-level register, `.plans/OBLIGATIONS.md` (template:
   `templates/obligations.md`). Both use one grammar: `do:` / `when:` (an
   observable condition — never a clock) / `probe:` (a runnable command or the
   literal `manual`). Backed by two mutation-proved lint checks, `checkClosing`
   (13) and `checkObligationsRegister` (14) in `tools/lint.mjs`, both
   legacy-tolerant — the five pre-existing mission ledgers still pass, byte
   unchanged.
2. **`/agentic-workflow:settle`** — a new command
   (`plugins/agentic-workflow/commands/settle.md`) that (1) inventories every
   open obligation across the register and every ledger's `## Closing` block,
   (2) probes each against a four-rung, fail-closed deploy-green ladder
   (deploy+CI → CI-only-on-merge-commit → merged-suffices when a repo has
   neither → surface-never-delete when `gh` is unavailable), (3) fires the
   safe class — `git branch -d` (never `-D`; a refusal surfaces, it is never
   forced to `-D`), remote deletes only for branches merged to the default AND
   condition-green, dry-run listed and confirmed before any deletion — and (4)
   writes back fired rows with `· fired <date> (<evidence>)`; rows are never
   deleted. The L4 deletion gates it encodes verbatim: unmerged, open-PR,
   §10-protected, and default branches are untouchable.
3. **The beat.** `hooks/lib/obligations-due.sh`, registered on `SessionStart`
   (`startup|resume` — deliberately never `compact`, which
   `compact-resume.sh` already owns) — a grep-only advisory that counts
   unticked register + Closing rows and names `/agentic-workflow:settle` in
   ≤3 lines, with four silencers (no obligations anywhere, zero unticked,
   once per session, always exit 0) and no network/gh/probes. This repo's
   governance-hook count goes **five → six**.
4. **The close-gate refusal — root cause #3, fixed directly.** The owner's
   diagnosis named the exact gap: `end.md` never read the ledger's
   `## Closing` section when a mission itself finished; completion fell
   through to `end.md` with no close-mission command. `end.md` now carries a
   new step (§3, between status/gates and chronicler/handoff): if a session
   finishes a mission, read the ledger's `## Closing` block — any `[ ]` row
   blocks reporting the mission closed until `/agentic-workflow:settle` has
   run and every row is ticked or promoted (`[~] … → OB-<n>`). `mission.md`
   states the same gate from the orchestrator's side ("zero open PRs" is
   explicitly not treated as a completeness signal); `check.md` gained a
   grep-only due-obligation count (item 8). Both `WORKFLOW.md` mirrors and
   the README carry the same claims, dispatch-proven, atomic-ref with the
   hook and its `hooks.json` description.

## The live proof — dogfooded on this repo's own rot

`/agentic-workflow:settle`'s steps were run by hand, exactly as written, on
this repository (S4). Dry-run listing was written and committed to the
ledger *before* any deletion executed.

**Remote (15 reaped) — rung-2 evidence per branch** (§10 profile: no
separate deploy here, merge to `main` IS the release, so the gate is CI green
on the merge commit):

| Remote branch | tip | merged-PR → merge commit | CI on merge commit |
|---|---|---|---|
| chore/ci-checkout-v5 | `7842cb8` | #22 → `3fcbe85` | lint:success |
| chore/close-governance-ledger | `13af1f6` | #24 → `5be1c6a` | lint:success |
| docs/council-roadmap | `1e267db` | #27 → `7f6f8c6` | lint:success |
| docs/sync-workflow-v1.37.0 | `bb57ded` | #19 → `ca7377e` | lint:success |
| docs/sync-workflow-v1.39.0 | `fc37b2a` | #23 → `5fcc7f4` | lint:success |
| feat/beat-state-glyph | `7d7a32a` | #29 → `98cb100` | lint:success |
| feat/hook-dispatch-harness | `1a9cdc7` | #26 → `31bcc0b` | lint:success |
| feat/hooks-extract-sh | `3cffce2` | #28 → `4e4b7ac` | lint:success |
| feat/ingest-registry-resolution | `176860a` | #20 → `7f82b51` | lint:success |
| feat/orchestrator-governance | `d55b36a` | #21 → `4ae3320` | lint:success |
| feat/template-ingestion | `eacc24b` | #16 → `7463a83` | lint:success |
| fix/beat-enforcer-stop-hook-loop | `037a5a5` | #25 → `1ab65f8` | lint:success |
| security/lint-guard | `8a9cb91` | #18 → `7a2c1ca` | lint:success |
| plan/interactive-handoff | `bf74a58` | no PR — ancestor of `origin/main` | lint:success on tip + carrier `a75b844` |
| plan/orchestrator-context-economy | `037b36b` | no PR — ancestor of `origin/main` | lint:success on tip + carrier `a75b844` |

**Local (41 reaped)** — `git branch -d` (git's own merged-into check is the
gate; locals carry no deploys), zero refusals; every `Deleted branch …`
output line matched the pre-committed breadcrumb tips (full 41-tip list in
`.plans/deferred-obligations.state.md`, "S4 reap evidence"). Plus 2 stale
worktree registrations cleared via `git worktree prune`; 0 `worktree-agent-*`
existed on this repo. Counts: local branches 53 → 12, remote (excl. HEAD)
22 → 7, worktrees 3 → 1.

**`ckpt-p2` `[STRICT]` verdict, verbatim** (Fable, deletion-machinery
checkpoint, re-deriving every deletion independently against `git reflog`,
`gh api`, and the pre-committed dry-run listing):

> every deletion clean — 41/41 local + 15/15 remote + 2 prunes re-derived
> from evidence, zero unjustified; all 13 PR-backed remote deletions checked
> fully.

**The register is live**, seeded with three rows, one of which lived its
whole lifecycle inside this mission:

- **OB-1** — n=1 handoff-budget band re-measure (`when:` upstream compaction
  behavior changes OR the local corpus gains ≥3 new compaction records).
- **OB-2** — the D4b cross-mission token corpus (`when:` ≥2 further
  post-v1.43 missions' transcripts exist).
- **OB-3** — reap the three *concluded* `mission/*-integration` branches
  (compaction-continuity, context-economy, sales-doc-architecture): **parked**
  at S4 because `settle.md`'s protected set as first written shielded every
  `mission/*-integration` branch unconditionally, including ones whose PRs
  were merged and CI-green weeks ago. **Human-ruled** the same day: the
  shield applies only while a mission is open (unmerged integration PR, or a
  `## Closing` block without the `Closed:` stamp). **Amendment shipped** at
  S6: `commands/settle.md`'s protected-set clause now encodes exactly that
  distinction, so concluded integrations fall through to the step-2 ladder.
  The reap itself stayed parked for the *next* `/agentic-workflow:settle`
  run — which is **this mission's own close**, executed after this body was
  written.

## Verification

- **Proven live**: the S4 dogfood reap above — plain git/gh operations on
  this repo's own branches, the one piece of this mission exercised for
  real rather than dispatched. `git branch -r --merged origin/main` residue
  after the reap = protections only, each named with its reason in the
  ledger.
- **Proven by dispatch**: everything hook-shaped. `tools/hook-test.mjs` grew
  **64 → 73** cases; every behavior change is mutation-proved in both
  directions with an anti-inert control (the mutation re-run against the
  pre-change checker to prove the new case, not a coincidence, is what
  catches it) — `obligations-due.sh`'s four silencers, the marker re-fire
  suppression, and the pinned `SessionStart` matcher case (extended, never
  deleted) all fall in this bucket. A hook loads its *installed* definition,
  not the working tree — none of this has fired live yet; that is OB-b below.
- **Proven by fixture**: the close-gate refusal. `checkClosing`'s
  `Closed:`-stamp-over-`[ ]`-row veto is proved with a temp fixture that
  stamps a ledger with an unticked row and shows lint fail, then removes the
  mutation and shows lint pass — the same anti-inert discipline (the
  mutation fails on new lint, passes on stashed pre-change lint).
- **Checkpoints**: `ckpt-p1` (routine, APPROVE) · `ckpt-p2` (**STRICT**,
  APPROVE, quoted above) · `ckpt-p3` (routine, APPROVE). All three APPROVE,
  **zero corrective sessions** across the mission.
- **Timer-class clarification** (owner ruling, mid-S3): the "post status
  updates every 10 minutes" instance from the owner's own diagnosis is an
  ephemeral, in-session request, not a durable obligation — the register is
  for promises that outlive a session, and cadence asks stay conversational
  by design. The lint's digitless-cadence pattern exists to keep clock
  phrases *out* of the register, not to represent them.

## The close — this mission passed its own gate before this PR opened

This PR was not opened until the mission's own ledger
(`.plans/deferred-obligations.state.md`) cleared the exact gate it built:
`/agentic-workflow:settle` run for real, the `## Closing` block's rows ticked
or promoted, and only then the `Closed: YYYY-MM-DD` stamp written — which
`checkClosing` (13) would veto if any `[ ]` row remained. That veto holding
is part of this mission's own acceptance criteria, not a formality.

**Obligations this PR does not close — carried forward by OB id, live in
`.plans/OBLIGATIONS.md`:**

- **OB-a** — delete this mission's four phase branches + the integration
  branch, local and remote — `when:` this integration PR is merged AND CI
  concluded green on the merge commit. Fires at the *next*
  `/agentic-workflow:settle` run after that merge — by design, not omission
  (this mission cannot reap the very branch that is carrying it).
- **OB-b** — live-verify `obligations-due.sh` fires in a real session —
  `when:` the shipped version is installed (`/plugin update` +
  `/reload-plugins` post-merge). Everything hook-shaped in this PR is
  dispatch-proven only until then.
- **OB-c** — confirm the five legacy mission trios still pass lint on the
  installed release — `when:` this release lands on `main` — `probe: node
  tools/lint.mjs` on a fresh checkout.

## What was NOT done

- **No time-driven triggers.** The platform offers no cron/timer surface
  inside the plugin; a timer-shaped ask is recorded `probe: manual` and
  surfaced, never faked as fired. Confirmed by the timer-class clarification
  above.
- **No auto-merge changes.** `/settle` deletes branches, never merges them;
  nothing here touches the merge path.
- **Human-merge untouched.** The agent never merges the default branch in
  any phase of this mission; deletion happens strictly *after* a human merge
  plus green deploy, which is what makes it delegable at all.

## What doesn't change

- No version bump in this PR — that is a release session's job.
- `main` is untouched throughout every phase; everything landed only on
  `mission/deferred-obligations-p1…p4` and merges here, into
  `mission/deferred-obligations-integration`.
- The human merges this once, per the mission's batch gate policy.
