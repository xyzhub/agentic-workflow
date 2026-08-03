# Feature brief — Compaction continuity (interactive sessions)

_Date: 2026-08-03 · Front door: `/agentic-workflow:plan` · Successor to
`2026-08-01-orchestrator-context-economy-brief.md` · Mission trio:
`.plans/compaction-continuity.{md,sessions.md,state.md}`_

_Working name at shaping time was **interactive-handoff**; renamed to
**compaction-continuity** because only two of the three pieces are a handoff,
and `handoff` is already three other things in this repo (`/agentic-workflow:handoff`,
`templates/session-handoff.md`, the ledger's `## Handoff log`)._

## Problem — in the owner's own framing

He **never ends sessions**. He steers interactively for weeks in one window. So
every efficiency the mission protocol buys — a durable ledger, session
boundaries, write-ahead state, `Next up:` — never applies to how he actually
works. Auto-compaction fires, and because there is no active mission ledger,
the agent resumes from a lossy summary with **nothing telling it to re-read
anything**. The loss is silent and compounding: each compaction paraphrases a
paraphrase, and no artifact ever gets the fidelity back.

The context-economy mission (v1.42.0) built the machinery for exactly this
moment and then aimed it at the wrong population.

## What is already shipped and true (do not rebuild)

- **`plugins/agentic-workflow/hooks/lib/compact-resume.sh`** (54 lines) fires on
  `SessionStart` matcher `compact` and injects a ≤6-line directive: re-read the
  active ledger and `docs/product/session-handoff.md` **verbatim**, honor
  `## Standing steers`. Built with `jq -n --arg`; always exits 0.
- **The gap:** it goes **silent** when there is no `.plans/`, an empty `.plans/`,
  or an **all-done ledger** — verified by dispatch in the `ckpt-p3` reviewer's
  hand matrix, and pinned by two harness cases (`tools/hook-test.mjs:286-293`).
  That silence *is* the owner's normal mode.
- **`templates/session-handoff.md`** exists (52 lines) and the directive already
  names its deploy path. It just never fires without a ledger. Note: in **this**
  repo `docs/product/session-handoff.md` has never actually been written — the
  path the directive names does not exist here. That is the same fact from the
  other side.
- **`/agentic-workflow:start` · `/agentic-workflow:end` · `/agentic-workflow:handoff`** are the manual
  interactive equivalents and they work. **Nothing ever prompts them**, so in
  practice they go unused. The gap is **triggers, not machinery**.
- **`tools/context-attrib.mjs`** (1,446 lines, 54 selftest cases, fail-closed CI
  gate) is the measuring instrument.

## The three pieces

1. **Fallback** — `compact-resume.sh` falls back to `session-handoff.md` when
   there is no active mission ledger, instead of going silent.
2. **Write trigger** — a **budget hook** using `wc -c "$transcript_path"`
   against a threshold, prompting a state-write **before** compaction. Advisory
   only; it cannot and must not block anything.
3. **Frequency levers** — independent of 1–2: reduce what refills the window,
   chiefly by delegating reads instead of the orchestrator pulling files in.
   Measured target: **`tool results` = 14.2% of appended chars (baseline),
   untouched by any phase of the context-economy mission**
   (`docs/product/engineering/context-economy-metrics.md:284-288`).

## The dependency, and why it dictates the phasing

**The fallback is DANGEROUS without the trigger.** A stale `session-handoff.md`
is **worse than no file at all**, because the directive says re-read it verbatim
and treat it as current: the agent would resume **confidently wrong** instead of
merely lossy. There is no version of "ship the fallback first and add the
trigger later" that is safe.

So the phasing runs **trigger → fallback → levers**, and the fallback ships with
a freshness statement in the same commit as the fallback itself.

## Verified platform constraints (do not re-litigate)

Carried forward from the context-economy mission, each already verified there:

- **No hook can end a session or clear the window.** A `Stop` hook exiting 2
  *blocks* stopping. There is no "expire" output. Killing the process is not a
  design.
- **No hook exposes context size or token count.** The only signal is
  `wc -c "$transcript_path"`. Bytes are a proxy (~2 chars/token measured).
- **`PostCompact` cannot inject.** The post-compaction injection point is
  `SessionStart` matcher `compact`.
- **Never block auto-compaction** — the window is already full; blocking wedges
  the session.
- **`/loop` is session-scoped** — ticks accrete in one transcript. Genuine fresh
  context needs `/clear`, a new session, or a scripted `claude -p`, and `/clear`
  is a built-in an agent cannot invoke.
- **Zero-dep repo** — no `package.json`, no lockfile, bare-checkout CI. (OQ6
  precedent: a tokenizer dependency was declined on these grounds.)
- **An agent (and a hook) loads its INSTALLED definition, not the working tree.**
  The installed plugin cache here is at `1.41.0`; the repo is at `v1.42.0`. A
  mission that edits a hook or an agent contract **cannot exercise that edit
  live** until merge + reinstall. All verification therefore runs through
  `tools/hook-test.mjs`, which dispatches against the working tree.

## Measured context (cite, do not re-derive)

From `docs/product/engineering/context-economy-metrics.md` and
`.plans/context-economy.state.md` — interactive session (M) vs baseline (B):

| term | B | M |
|---|---|---|
| human steers | 2.9% | **12.6%** |
| subagent returns | 15.1% | **3.9%** |
| orchestrator `Write`/`Edit` | 9.16% | 8.61% |
| machinery (`hook_success` + `hook_additional_context` + `task_reminder`) | 5.4% | **9.3%** |
| `tool results` | 14.2% | (unaddressed) |

Registry/definition injection ≈ **14%** of appended chars, and **≥ ~80% of that
is the owner's own `~/.claude/skills` + MCP config — an owner settings action,
explicitly OUT of scope here.** Roughly **23%** is the conversation itself and
is not reducible. **n = 1 per corpus throughout**; two n = 1 points are not a
trend.

**The uncomfortable one:** machinery went **5.4% → 9.3%** *during the mission
that measured it*. This mission adds another always-on hook. Every design choice
below (one-shot per band, ≤3 lines, silent when a ledger is active) exists to
keep piece 2 from being the next A5.

## Non-goals

- No savings claim. The cross-mission re-measurement corpus (D4b) does not
  exist; piece 3 ships as **discipline, honestly labelled**, not as a measured
  win.
- No attempt to read context size from a hook (not exposed).
- No blocking of auto-compaction, ever.
- No owner-settings work (`~/.claude/skills`, MCP pruning) — larger than
  everything here, and not this repo's.
- No `PreCompact` breadcrumb file (D8 Option A stands: `isCompactSummary`
  true-records = 1; promote only if a wrong-ledger resume is ever recorded).

## Acceptance shape

- The write trigger fires at a **derived, named, pinned-in-both-directions**
  byte threshold — never a bare literal (the A3 lesson: the D7 3% trigger was a
  bare literal pinned by zero cases).
- The fallback injects when there is no active ledger, states the handoff's
  freshness, and says something useful even when no handoff exists.
- Every behavior change ships with a case that **fails without it**,
  mutation-proved in both states, **plus an anti-inert control** (re-run the
  mutation against the pre-change checker to prove the new check causes the
  failure). Six bugs reached the last mission through tests that agreed with
  their own code.
- Doc claims about hook behavior are verified **by dispatch, not by reading**.
- Atomic-ref: a hook and every reference to it change in ONE commit; both
  `WORKFLOW.md` mirrors stay identical (never touch `docs/WORKFLOW.md` line 3's
  version stamp outside a release session).
- `node tools/lint.mjs` green (it runs `hook-test.mjs`, `marker-test.mjs` and
  the attribution selftest as fail-closed sub-gates).

## Open questions (answered in `.plans/compaction-continuity.md`)

Seven, each carrying a recommendation: the **PR #31 branch dependency**, the
**byte thresholds and their evidence**, whether **`session-handoff.md`'s format
must change**, **how the trigger avoids being nagware**, what **"keeping it
current" means with no checkpoints**, **what the fallback does when no handoff
exists at all**, and **whether the trigger fires during missions too**. Execution
does not start until the human has answered them.
