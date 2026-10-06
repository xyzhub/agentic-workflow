---
status: frozen
owner-agent: curator
refresh-trigger: never
---

# agentic-workflow — Decision Log

Every autonomous decision autopilot makes on the owner's behalf, newest first.
This is how a hands-off owner audits the run: each row says what was decided,
what else was considered, why, and — most importantly — how to undo it.

| Date | Decision | Options considered | Why | How to reverse |
|---|---|---|---|---|
| _(YYYY-MM-DD)_ | _(what was chosen)_ | _(the road not taken)_ | _(one line)_ | _(concrete steps, or "irreversible — was human-confirmed")_ |

## Counsel briefs

### 2026-10-06 — launch-media mission (brief: `decisions/2026-10-06-launch-media-brief.md`)

**Decision examined.** Approve one mission building (A) an automatic demo
video after a passed verify with capped paid narration, (B) per-release lead
intelligence (20-person shortlist, 20 drafts, never sends), (C) hash-pinned,
claim-token publish approval; architect's ten recommended options; top of
backlog; n=1 on Orderly. Lenses: technical, financial, behavioral (all Fable,
fresh context).

**Verdict spread (honest, not averaged).**

| Lens | Verdict | Core objection |
|---|---|---|
| Technical | proceed-with-changes | "Mechanically enforced" is overclaimed: the §3 publish regex has no email host, a tokenless call under `human-only` is only a reminder, MCP tools and the codex runtime bypass hooks entirely. The gate defends against accident, not a misbehaving agent. Three subsystems in one ledger is the August shape. Recorder is untestable in CI; a production recording of order → charge creates real charges. |
| Financial | proceed-with-changes, hold B as designed | ~30 files across 8 tools, a new agent, hook rewrite: 6–10 sessions plus Fable checkpoints, the spend shape that got the plugin disabled 2026-08-19. Recurring per-release agent tokens, X reads and TTS sit outside every mechanical guard; the flight-plan ceiling is a prose row nothing reads. Value side is zero-measured. |
| Behavioral | proceed-with-changes, hold on the n=1 definition | Restaurant operators are not on HN or GitHub; Reddit bans cold DMs; Reddit/HN-sourced people have no email or X handle without the deferred enrichment, so "20 drafts" is reachable only by padding. Quote-opened cold messages read as surveillance (personalization backfire, PMC12561546); the sender account and voice are the owner's. `contacted.md` is a personal-data store in git; UK/EU sole-trader restaurants fall under PECR consent rules. 20 hand-sends per release at 1–3% reply rate pushes the owner toward bulk-paste or abandonment, and memo 8 burns unsent candidates forever. |

**Convergent findings (two or more lenses independently).**
1. Split into three missions, order C → A → B, each one session with its own
   n=1. C closes the only real bug (prose-only enforcement) and is fully
   hook-harness testable. (all three)
2. A ships silent in v1; narration is build surface with unmeasured value and
   paid spend outside the §3 paid guard. (all three)
3. B is not ready to automate: run it once by hand on Orderly (no adapters, no
   X, 5 drafts), the owner sends by hand, measure replies, then decide. (financial, behavioral)
4. Paid hosts (ElevenLabs, api.x.com) must join the §3 paid guard before any
   adapter ships. (technical, financial)
5. State the threat model in the brief: hash/epoch/claim guards against
   accidental drift and double-fire, not against an adversarial agent. Extend
   the publish regex with email hosts; a tokenless publish-host call blocks
   under every policy, with a `PUBLISH_CONNECT=` marker for round-trips. (technical)
6. Resolve staging vs production for the recording; the AC says production,
   the interview says staging, and production means real orders. (technical)
7. Ledger hygiene: keep `contacted.md` out of the public tree, expire unsent
   drafts after one release instead of excluding forever, add a read-the-source
   confirmation before approve, state Orderly's jurisdiction. (behavioral)

**Cheapest evidence to resolve the biggest disagreement.**
- A 30-minute Playwright spike from the Orderly cwd against staging with the
  six-step flow, run on two consecutive deploys. Resolves recorder fragility,
  Playwright resolution and the ffmpeg H.264 inference.
- A 10-candidate dry run on the Orderly ICP with no drafts and no sends,
  showing where candidates come from and whether 5 of them have a deliverable
  channel. Resolves the source-audience question for B.
- Count Orderly `/release` runs in the last 60 days. At one a month or fewer
  the recurring-spend objection shrinks to a nuisance.

Advisors' full briefs are in the session transcript; findings above are the
union. The human decides; this brief does not block the gate.

### 2026-10-06 — operate-bugfix mission (brief: `decisions/2026-10-06-operate-bugfix-brief.md`)

**Decision examined.** Approve an unattended cron loop on the owner's Tailscale
server that polls a venture's GitHub Issues for user bug reports, triages
(fix / diagnose / escalate / needs-info), fixes small code bugs on a branch via
bounded headless `claude -p`, verifies on staging, opens a PR the owner merges,
posts read-only diagnoses for operational reports, daily Slack digest, max 3
fixes/day; architect's 13 memos (notably: on Orderly, staging is the `v5`
branch, so "verified on staging" means the loop merges into `v5`); n=1 on
Orderly. Lenses: technical, financial, behavioral (all Fable, fresh context).

**Verdict spread.**

| Lens | Verdict | Core objection |
|---|---|---|
| Technical | HOLD (short: four decisions) | The tool allowlist is the real boundary and it is wider than the prose: `Bash(git *)` can push to `v5`, which the §3 push guard does not name; `Bash(curl *)` on a box holding five tokens is one injected issue body from exfiltration. Memo 4A turns a "PR-only" loop into one that merges into an auto-deploying branch and ships the whole integration branch to land one fix, against §5 Lane A. A future `claude` update defaulting `-p` to `--bare` silently drops every hook. Orderly's tracked ledgers would hijack the loop's hooks. One session is not an estimate. |
| Financial | HOLD fix/cron; proceed on a reduced v0 | Subscription terms for a 24/7 cron are unsettled, and the real risk is the loop draining the owner's weekly allowance unseen (the 2026-08-19 failure). Triage and diagnose runs are uncapped; the daily cap covers fixes only. `--max-budget-usd` is a client-side estimate, not a bill. No reports exist until the widget ships. Anthropic's scheduled **routines** (Pro/Max, hourly minimum, draw subscription usage like interactive sessions, documented "backlog maintenance" use case) are the sanctioned unattended path and cost zero build. |
| Behavioral | proceed-with-changes | The queue is empty by construction (widget out of v1), so the owner gets "0 reports, loop healthy" daily until the channel is muted. Merge-to-`v5` builds rubber-stamping in. A single-venue printer outage sits exactly on the Alert threshold: either the owner is paged for every one or the venue's service-time incident becomes tomorrow's digest line. Diagnosis-only is the part worth shipping first, but it is worthless without the printer read path. |

**Convergent findings (two or more lenses).**
1. No report source exists in v1; the consumer is being built before the
   producer. Name who files the first five reports, or build the widget first. (financial, behavioral)
2. Split: slice 1 = triage + diagnose + digest, no fix path; the fix path
   ships only after real reports and five clean hand-merged fixes. (all three)
3. The model never pushes or merges: the deterministic watcher does `git push`
   and `gh pr create`; drop `Bash(git *)`, `Bash(curl *)`, slot `--steal`. (technical, behavioral)
4. Staging on Orderly: memo 4B (PR-first, owner merges into `v5`, loop verifies
   after), not 4A; restore "the loop never merges" verbatim. (technical, behavioral)
5. A ceiling across ALL model steps per day and per week, plus a per-day cap on
   triage/diagnose runs; subscription-terms or API-key decision before any cron. (all three)
6. Registry: the owner's 2026-08-19 decision not to register Orderly must be
   reversed in writing or the n=1 criterion dropped. (all three)
7. Estimate: not one session; the Orderly-side work (labels, read endpoint,
   Slack channel, tokens, server) is a separate Orderly mission. (technical, financial)
8. Digest only on activity; liveness by a dead-man ping; pin the server CLI
   version and preflight that hooks fire; single-venue printer outage needs an
   explicit "page me: yes/no". (behavioral, technical)

**Cheapest evidence to resolve the biggest disagreement.** Run triage and
diagnose as prompt modes under a scheduled Claude routine (hourly) against
Orderly for 30 days or 10 reports, with the owner filing the first reports by
hand through the contract. That answers subscription consumption, report
volume, and whether diagnoses get relayed, before any watcher, server, or fix
mode is built.

Full advisor briefs are in the session transcript. The human decides; counsel
does not block the gate.
