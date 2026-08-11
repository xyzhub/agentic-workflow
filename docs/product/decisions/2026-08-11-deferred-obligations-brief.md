# Feature brief — Deferred obligations (parking place + triggers)

_Date: 2026-08-11 · Front door: planner commission (owner-verified problem
statement, quoted below — its facts are locked source material) · Mission trio:
`.plans/deferred-obligations.{md,sessions.md,state.md}`_

_Working name **deferred-obligations**, kept at planning time: it names the
**class** (a promised action with a condition and no trigger), not the loudest
instance (branch rot); `obligation` appears nowhere else in this repo, so the
mission stays grep-clean; and the obvious alternatives collide — `sweep` is the
parked portfolio-learning scholar's word, `closing`/`handoff` already name
ledger blocks._

## Problem — the owner's verified statement (verbatim, locked)

> A completed mission left **33 merged remote branches + 18 stale
> `worktree-agent-*` local branches** weeks after shipping, while the closing
> session correctly reported "zero PRs open, everything green."
>
> Root causes in this plugin:
>
> 1. `commands/end.md` has **no branch-cleanup step** (sections: status →
>    gates+commit → chronicler → docs/issue → push/handoff).
> 2. **No command reaps branches at all** — `grep -rln "delete\|worktree"
>    commands/ skills/` hits only `mission.md`, both unrelated (worktree
>    *creation* at :55; "never delete" re standing steers at :74).
> 3. `end.md` §2 updates the ledger for the current brief but **never reads the
>    ledger's `## Closing` section when the mission itself finishes** — there is
>    no close-mission command; completion falls through to `end.md`.
> 4. **The plugin's own worktree feature creates the mess**: `mission.md`
>    authorizes per-brief isolated worktrees; nothing reaps what they leave. 18
>    in one mission.
>
> Why self-verification is structurally blind: the agent uses "zero open PRs"
> as completeness. With auto-delete-on-merge off (deliberate in that repo),
> surviving merged branches are the *expected* state. The ledger's own
> `[ ] Branches deleted (local + remote)` sat unticked the whole time — **the
> checklist was right and ignored**.
>
> **The general class (matters more than branches): deferred obligations have
> no trigger.** Branch deletion is gated on merged AND deployed AND green —
> impossible at merge time, deferred by construction, and the plugin has no
> mechanism to return to it. Three same-shape instances in one session:
> branch-delete (needed: deploy conclusion; never done) · a ckpt-p2 instruction
> "add cash-drawer to the owner-facing backlog" (needed: next backlog edit;
> lost for weeks) · "status updates every 10 minutes" (needed: a timer; missed
> twice).

This repo exhibits the same rot in miniature, measured 2026-08-11: **17 merged
remote branches and 37 merged local branches** survive on this very repository,
plus 3 registered worktrees — nobody ever told any session to go back and look.
And two obligations are live and unfired right now: the **n=1 handoff-budget
band re-measure** (`.plans/compaction-continuity.state.md` — "re-measure if
compaction changes upstream", owner-owned, no trigger) and **D4b** (the
cross-mission re-measurement corpus that context-economy deferred; nothing will
ever notice when it becomes possible).

## What is already shipped and true (do not rebuild)

- **The glyph discipline works.** The beat-enforcer keys on `[ ]`/`[~]`/`[x]`,
  never prose, with due-ness rules (`hooks/lib/beat-enforcer-stop.sh`) — the
  model for any new advisory hook.
- **The ledger is already the authority** — the failure was that nothing reads
  its closing items at the moment that matters. The checklist was right and
  ignored; the fix is a reader with refusal power, not a smarter agent.
- **Prose blocks can be made checkable** — `tools/lint.mjs` checks 11 + 12
  (standing-steers grammar, `Next up:` two-site agreement) are the precedent:
  fail-closed, grammar-anchored, legacy-tolerant.
- **PR #32 (compaction-continuity, awaiting merge)** ships beat-riding hooks,
  the `$TMPDIR` once-per-session marker pattern, the handoff freshness model,
  and `runHook({files, transcript})` harness knobs. This mission extends those
  patterns; it must base off post-#32 `main` (OQ1) and must not duplicate them.
- **Deploy conclusions are queryable** — `gh run list` / the checks API. A
  *condition probe at a beat*, never a timer.

## What an obligation is (and is not)

| Artifact | Holds | Trigger | Owned by |
|---|---|---|---|
| Standing steer | Taste — *how* to work | none; binds every session | mission ledger |
| Lesson (portfolio-learning, parked) | Retrospective generalization | none; informs future shaping | scholar machinery |
| **Obligation** | **A specific promised action** | **an observable condition, probed at beats** | **`## Closing` block / repo register** |

A lesson row is NOT an obligation row: a lesson has no condition and no
definition of done — it changes how you think. An obligation is "do X once Y is
observably true" and is either fired-with-evidence or still open. Keeping them
distinct keeps this mission out of portfolio-learning's scope and vice versa.

## The four pieces (owner's acceptance, locked)

1. **A mission-closing gate** that reads the ledger's `## Closing` block and
   **refuses to report the mission closed while items are unticked** — the
   checklist is the authority, not the agent's improvised signals ("zero open
   PRs" was true and useless).
2. **Condition-driven branch reaping** (never time-driven): per merged branch,
   verify the deploy that carried it concluded green → delete local + remote.
   **Never** unmerged branches, long-lived integration branches, or
   pre-existing branches the repo profile protects.
3. **Reap `worktree-agent-*` after `git worktree prune`** — the plugin created
   them, the plugin cleans them.
4. **A general parking place for "do X once Y happens"** — a one-line grammar
   with an observable `when:` and a `probe:`, stored durably (per-mission
   `## Closing` + a repo-level register), checked at natural beats, fired when
   safe and surfaced otherwise.

## Verified platform constraints (do not re-litigate)

- **Autonomous trigger surfaces are hooks only** (UserPromptSubmit / Stop /
  SessionStart / PreToolUse). No cron inside the plugin; scheduled agents are a
  harness-level owner action (precedent: the portfolio-learning cadence
  decision — protocol text at mission close + manual fallback).
- **Hooks stay deterministic and offline** — grep/echo, no network. Probes that
  need `gh` run inside command steps, where a human-attended session can absorb
  latency and failure.
- **Zero-dep repo**; all new shell must be GNU/BSD-portable — this repo's CI is
  Ubuntu while every local gate runs macOS (the 2026-08-11 `stat -f` lesson).
- **A hook loads its installed definition** — hook behavior is verified by
  `tools/hook-test.mjs` dispatch against the working tree, never claimed live.
  The reaper is the exception in reverse: it is plain git/gh work and **can**
  be exercised live on this repo's own 17 + 37 stale branches.
- Never `Read`/`cat`/`head`/`tail` a `*.jsonl`.

## Non-goals

- **The human-merge rule is untouched.** The agent never merges the default
  branch. Branch *deletion after* a human merge + green deploy destroys nothing
  that is not already in `main` — that is what makes it delegable at all, and
  every gate below exists to keep that sentence true.
- **The deferral itself is correct** — deletion after green deploy is the right
  gate; the missing piece is the trigger, not the delay. Nothing here makes
  deletion happen *earlier*.
- **No time-driven triggers.** The third owner instance ("status updates every
  10 minutes") needs a timer the platform does not offer; a timer-shaped
  obligation is recorded with `probe: manual` and *surfaced*, never fired. Say
  so honestly rather than faking a clock with turn-counting.
- **No lessons machinery** — portfolio-learning's scholar stays parked and
  distinct (table above).
- No auto-delete-on-merge repo setting changes — that is an owner/repo choice
  the plugin must work *without*.

## Acceptance shape

- A mission with an unticked `[ ]` row in `## Closing` **cannot be reported
  closed** — enforced in the command step *and* by a fail-closed lint backstop
  keyed on an explicit `Closed:` stamp. Ledgers predating the block (all five
  existing trios) must not start failing — OQ4-legacy-tolerant.
- Every deletion path is fail-closed: `git branch -d` (never `-D`), remote
  deletion only after merged-into-default AND deploy-concluded-green per the
  §10 profile; `gh` missing or ambiguous → surface, don't delete.
- Every behavior change ships a case that fails without it, mutation-proved in
  both states, plus an anti-inert control.
- Atomic-ref: a hook, its `hooks.json` description, both `WORKFLOW.md` mirrors,
  and the README change in ONE commit.
- `node tools/lint.mjs` green (it runs hook-test, marker-test, and the
  attribution selftest fail-closed).
- The mission's own ledger carries a `## Closing` block and is closed through
  its own gate — the fix ships dogfooded.

## Open questions (answered in `.plans/deferred-obligations.md`)

Seven, each carrying a recommendation: the **PR #32 base dependency**, **where
the cross-mission register lives**, **which beats the condition-check rides and
its silencer discipline**, **how deploy-green is probed in repos without
CI/deploys**, **whether the close refusal is a command step, a lint check, or
both**, **queue order vs portfolio-learning**, and **whether `worktree-agent-*`
reaping needs the deploy gate at all**. Execution does not start until the
human has answered them.
