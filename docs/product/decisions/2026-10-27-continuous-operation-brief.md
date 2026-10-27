# Continuous operation (24/7, managed or unattended) — feature brief

_Drafted 2026-10-27 by the orchestrator via `/agentic-workflow:plan`. Source: the
owner, in session: "we need to improve it so that it can run whether managed or
unattened but can take advantage of autocompaction and handoff to run without
any loss of fidility 24/7"._

## Problem

The workflow can already run in rounds (autopilot / mission loop mode, tick and
mission budgets, the unattended preset, the owner channel), and it already has
compaction machinery (handoff-budget token bands, the handoff gate, the
pre-compact snapshot, compact-resume — v1.68.0–1.69.1). It still cannot run
24/7 without a human:

- **Context accretes.** A `/loop` tick runs in the same session; ticks pile up
  in one transcript (`docs/WORKFLOW.md` §5 Loop mode, ~line 588). Genuine fresh
  context needs `/clear`, a new session, or a scripted `claude -p` — and today
  a human fires `/clear` (`commands/handoff.md`: "Only the human opens a new
  session").
- **The handoff gate assumes a human.** At the urgent band it blocks every tool
  but Read/Grep/Glob and the handoff write until the handoff is written
  (`hooks/lib/handoff-gate.sh`); it degrades to a nudge after 5 blocks. An
  unattended agent may stall or thrash there.
- **No supervisor.** Nothing restarts a crashed or ended round, schedules the
  next one, or keeps a project's workflow alive on a server.
- **No proof of fidelity.** No test shows that an agent after a compaction or a
  restart knows exactly what it knew before. The live auto-compaction check
  (OB-32) and the compaction-band re-measure (OB-1) are still open.
- **Gates need a reachable approver.** Merge, deploy, spend and publish gates go
  to one owner Slack DM today (§12); client projects need a per-client route.

## Goal (owner's words, 2026-10-27 — the yardstick for every decision)

"the idea of the 24/7 run is so i can run the agentic-workflow and trigger it
and then never have to worry about context rot or context filling up or
compaction degrading anything"

→ Trigger once, then hands-off. The workflow owns its context health: it acts
before quality degrades (context rot sets in well before the window is full),
never lets a window fill, and never relies on a lossy summary as its only
memory. Any design option that leaves the owner watching context, firing
`/clear`, or trusting compaction's paraphrase fails this goal.

**No special setup (owner, 2026-10-27, verbatim):** "like in the salla-agent, it
should be able to run ongoing without any special setup" — salla-agent is a
plain Claude Code session kept alive under Remote Control. So the baseline is:
start an ordinary Claude Code session (Remote Control or not) in the project,
fire one command, and it keeps going. Any installer, systemd unit or
supervisor is optional hardening on top, never a requirement to run.

**Early compaction (owner, 2026-10-27, verbatim):** "we can also trigger the
autocompaction to happen early to save on tokens" — the long-lived session
compacts well before the window is full (a smaller context per turn costs
fewer input tokens and rots less). Claude Code exposes this via
`CLAUDE_CODE_AUTO_COMPACT_WINDOW` / `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`, which the
handoff hooks already read (`hl_threshold`, `hooks/lib/handoff-lib.sh`), so the
handoff bands move with it.

**Source of truth (owner, 2026-10-27, verbatim):** "the source of truth is the
docs" → every round and every resumed session rebuilds its context from the
project's docs — `docs/product/` (decisions, brief, north star), the
`.plans/` ledgers and register, and the handoff — never from a transcript, a
compaction summary or an agent memory folder. Anything a round learns that the
next round needs is written to those docs before the round ends; what is not in
the docs does not exist for the next round.

**Docs vs code (owner-approved 2026-10-27, "yes, write it that way"):** a
mismatch is never resolved silently; it is reported, and who wins depends on
what the doc records:

- **Intent** — a locked decision, an acceptance criterion, a rule → the doc
  wins; the code is the bug. The agent fixes the code; if the code looks right
  instead, it opens a gate to the owner before the decision changes. Locked
  decisions change only with the owner's approval.
- **Description of current behaviour** — a path, a threshold, how a hook or
  tool works → the code wins; the doc is stale. The agent updates the doc.

## Owner interview (verbatim picks, 2026-10-27)

- **Fresh context:** "Both, by mode" — unattended: every round is a FRESH
  process that rebuilds context from the ledger + handoff (nothing to compact);
  managed: the owner keeps one session; auto-compaction fires and the
  pre-compact snapshot + handoff carry everything across.
- **Handoff with nobody at the keyboard:** "Agent writes it itself" — the gate
  tells the agent to write the handoff now; it does, the gate clears, work
  continues; never deadlocks waiting for a human. Same in managed mode, minus
  the "start a fresh session" ask.
- **Where it runs (owner's words):** "it will run on an lxc containers
  dedicated for client projects, each client project gets its own dedicated
  agentic-workflow running 24/7 to build, launch, grow and maintain their
  project."
- **Proof of no fidelity loss:** "Fidelity test" (automated: seed known
  decisions, open questions and a next step, force a compaction/restart, check
  the resumed agent states all of them exactly; runs in CI) + "24h live run"
  (one real unattended mission across ≥ 2 compactions/restarts, finishing
  without an owner correction about lost context) + "Close OB-32 first".
- **v1 container scope:** "Runner only" — the 24/7 runner that works inside any
  container the owner already made: install script, a supervisor (systemd)
  that runs rounds forever, restarts on crash, keeps context fresh.
- **Approvals (owner's words):** "it can be me or the client via a channel, or
  via a dedicated remote control claude agent session that relays the gates to
  me and relays my answers to them" → the approver route is configurable per
  project: owner channel, client channel, or a relay Claude session (Remote
  Control) that forwards gates to the owner and the owner's answers back.
- **Not in v1 (deferred, not denied):** container creation (Proxmox
  provisioning); fleet dashboard; cross-client sharing; per-client billing.
- **Priority:** "Next mission, strict" — ahead of the xyz-rebrand and
  provider-adaptive; checkpoint per phase + a security pass; the owner merges.

## Acceptance criteria

Journeys (the designer names them J1–J5):

- **J1 — unattended round.** The supervisor starts a fresh process per round;
  the round reads the ledger + handoff, does exactly one unit of work (brief,
  checkpoint or corrective), writes the ledger and the handoff, and exits. No
  round inherits a previous round's transcript. A crash mid-round loses
  nothing beyond that round's uncommitted work, and the next round resumes.
- **J2 — managed session crosses auto-compaction.** The owner keeps working;
  the handoff is written by the agent before the compaction point (no human
  step), auto-compaction fires, compact-resume re-reads the handoff verbatim,
  and the agent continues the same next step.
- **J3 — handoff gate unattended.** At the urgent band the agent writes the
  handoff itself and continues; the gate never blocks an unattended round
  waiting for a human; an agent that fails to write it is stopped cleanly
  (round ends, ledger records why), never loops.
- **J4 — gate decision away from the keyboard.** A merge/deploy/spend/publish
  gate goes to the project's configured approver (owner channel, client
  channel, or the relay session); the round that hit it ends; the answer is
  recorded and the next round acts on it. No gate is ever self-approved.
- **J5 — runner install on a client container.** One install script on an
  existing LXC container sets up the runner for one project (repo, auth, the
  approver route, budgets); `systemctl status` shows it; it survives a reboot.
- **Fidelity test** in CI: a seeded set of locked decisions, open questions,
  in-flight state and the exact next step survives (a) a forced compaction and
  (b) a fresh-process restart, compared field by field; red on a deliberately
  broken handoff, green on the real one.
- **24h live run** on one client container: ≥ 2 compactions/restarts, finished
  without an owner correction about lost context; results recorded.
- **OB-32 closed first** (live auto-compaction check on orderly-agents).
- **Budgets hold 24/7:** tick/mission budgets and the 1.5× overrun stop apply
  to every round; a budget stop ends the loop and notifies the approver — no
  silent continuation (the 2026-08 credit burn).
- **Secrets:** API keys, Slack tokens and git credentials live only in the
  container's environment/secret store; never in the ledger, handoff, logs or
  any committed file.
- `node tools/lint.mjs` clean; new tests red on the old tree, green on the fix.

## NOT in v1

Container creation (Proxmox provisioning); fleet dashboard; cross-client
sharing; per-client billing.

## Locked decisions

_Approved 2026-10-27 by the owner at the single approval moment, after the
architect memos (D1–D7, the 11 designer gaps, the borrowed EGM concepts) and two
Fable advisors (technical: proceed-with-changes, Est 6; financial:
proceed-smaller, Est 5). Counsel: `2026-10-27-continuous-operation-memos.md`
§ Counsel._

- **L1 — Scope: "Safe v1, 6 sessions".** One command (`/agentic-workflow:run`)
  in a plain Claude Code session (Remote Control optional); a thin parent that
  runs every unit of work in a fresh `claude -p` child; idle waiting by a
  background `runner.mjs wait` process — zero model turns while idle, no
  `*/5` CronCreate watchdog; the agent writes its own handoff (mode-aware gate;
  unattended ends the round cleanly, never kills a round because a builder
  subagent hit the band); compaction at 200k (`CLAUDE_CODE_AUTO_COMPACT_WINDOW`
  via project settings `env`, `hl_threshold` fixed to honour the effective
  window); daily cap + idle backoff + no-progress stop; every inline human ask
  in `commands/` converted to a gate under `-p`; fidelity test (structural in
  CI + the naive-reader check; model job on `workflow_dispatch` only); gates
  answered ONLY through a channel and verified at the source (`gate.mjs poll`
  reads the reply from the transport API: message id + allow-listed user id),
  owner or client channel per project; a 1-hour spike + P0 probes (OB-32 first,
  plugin-file reads in headless children, child-exit wake path, cron/prompt
  indistinguishability, `continue:false` under `-p`); the 24h run.
  **Deferred:** systemd/LXC install script, the relay Claude session, any
  in-session or local-file answer surface (self-approval risk).
- **L2 — Authority: "Decisions + staging only".** A verified channel "yes"
  may approve decisions and merges to staging. Production merge, deploy,
  spending and publishing stay fired by the owner personally.
- **L3 — Auth: a dedicated subscription per client** (owner, 2026-10-27,
  verbatim: "I will provide a dedicated subscription per client"; refines the
  approval-moment pick "Your subscription login"). Each client container logs
  in with that client's own claude.ai subscription; its children reuse that
  login (documented: non-bare `claude -p` uses the /login credential). Usage
  caps and cost are therefore per client, never shared with the owner's own
  sessions or other clients. Login expiry still stops progress → the round
  exits auth-expired and the approver is alerted. Tokens per round are logged
  from round 1. No account check (owner, 2026-10-27, verbatim: "no need to
  check which account the client runs on, because i might use any of my
  accounts for any of my clients") — the runner uses whatever login the
  container has.
- **L4 — Daily cap: 5M tokens/day per project** until the 24h run measures
  real numbers; hitting it stops the project for the day and alerts the
  approver.
- **L5 — Priority and gates:** next mission, ahead of xyz-rebrand and
  provider-adaptive; strict posture — a Fable checkpoint per phase + a security
  pass; the owner merges.
- **L6 — Planner open questions OQ-1..5: "Accept all"** (owner, 2026-10-27).
  OQ-1 an expired gate closes as `closed-expired` and a new gate opens — it
  never counts as yes or no; OQ-2 runner config in `.claude/runner.json` plus
  one §10 Runner row; OQ-3 runner state under the git common dir (never
  committed); OQ-4 the model fidelity job runs on `workflow_dispatch` only with
  a `CLAUDE_CODE_OAUTH_TOKEN` CI secret; OQ-5 `feat/continuous-operation`
  branches from `plan/continuous-operation`. Start: later — the owner fires S0.
