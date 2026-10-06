# Feature brief — Launch media (demo video, lead intelligence, hash-pinned publish approval)

**Date:** 2026-10-06
**Branch:** `feat/launch-media-plan`
**Class:** three missions, each one session (locked 2026-10-06, see below)
**Status:** APPROVED 2026-10-06 — decisions locked; mission 1 (`publish-approval`) planned first; counsel brief in `docs/product/decision-log.md`
**Origin:** owner review of github.com/affaan-m/ECC (273k stars, MIT). Three of
its skills (`ui-demo`, `lead-intelligence`, `operator-approval-loop`) describe
patterns worth having. **Patterns only, never their code** — the 2026-07
supply-chain incident rule and `checkObfuscation()` in `tools/lint.mjs` stand.
Source notes (untrusted reference data, not shipped): session scratchpad
`ecc-src/`.

## Problem

When a venture ships, the workflow's launch kit stops at announcement copy.
Nothing produces a demo of the thing that was built, and nothing finds the
people who would care about it. The owner does both by hand or not at all,
so releases go out with no video and the publish queue holds broadcast posts
only. The §14 pipeline is also enforced by prose ("a change to an approved
body resets it to draft") rather than by a check, so a body edited after
approval can still fire.

Three capabilities close this, all inside the existing §14 shape (prepare is
automated, firing is gated):

- **A. Demo video after verify.** A silent-by-default screen recording of the
  shipped golden path, produced by the orchestrator as the last step of a
  PASSED production `/agentic-workflow:verify`, with optional capped narration.
- **B. Lead intelligence.** Every `/agentic-workflow:release` refreshes a
  20-person shortlist of people publicly describing the pain the venture
  solves, each with a quoted source link, scored on a fixed rubric, and one
  draft message per person staged into the publish queue at `draft`. Never
  sends. A contacted ledger blocks re-contact.
- **C. Hash-pinned approval.** Each queue item stores a sha256 of its body and
  an edit epoch. An approval is valid only for that hash and epoch. Firing
  takes a claim token so an item cannot fire twice, and an unknown outcome
  blocks automatic retry.

## Interview answers (the owner's words, verbatim)

| Question | Answer |
|---|---|
| Who triggers each capability, and when? | **Release-driven, all three.** Demo video: orchestrator records it as the last step of a PASSED production /verify. Prospecting: every /release is a content trigger, the marketing agent (or a new prospector) refreshes a 20-person shortlist + drafts into the publish queue. Hash-pin: baked into /publish stage\|run, no new trigger. |
| Which stay OUT of v1? | **Apollo / Clay / ZoomInfo enrichment**; **Warm-path via X follower graph**. (Narration/TTS/title cards and LinkedIn were left IN at round one; see round two.) |
| Priority and risk posture? | **Top of backlog, standard gates.** Runs before the parked portfolio-learning mission and the open #81/#82 follow-ups. Reviewer on each phase (Fable); human merge. |
| What observable result means done? | **n=1 on a real venture.** One /release yields: a playable mp4 under docs/product/launch/, a 20-person shortlist each with a quoted source link, 20 drafts at state draft, zero sends, and a tampered approved body is refused by the hash gate. Plus tier-1 lint + hook tests green here. |
| Narration: how is the voice track produced? | **Paid TTS, capped.** ElevenLabs or equivalent from a script the writer agent drafts. Key by NAME per the secret rule, fail closed to a silent mp4 when absent, per-video cost ceiling (e.g. $1) enforced by the flight-plan budget. |
| LinkedIn posture? | **Defer it.** v1 drafts LinkedIn DMs as text the owner pastes by hand. No automated LinkedIn reads or writes. |
| Which venture and flow for n=1? | **Orderly, guest ordering golden path** (QR → menu → order → charge) on staging; prospecting targets restaurant operators. |
| Which public sources feed people-finding? | **Web search via Firecrawl (already connected); Reddit and Hacker News threads; GitHub issues and repos (gh, no new key); X recent search (needs X bearer token).** |

## Acceptance criteria per journey

### A. Demo video
1. After a production `/verify` PASS on an adopted venture, the orchestrator
   runs the recorder against the venture's `docs/product/launch/demo-flow.md`
   (step list authored during the build; the planner/frontend owns it).
2. **Discover → rehearse → record, never straight to record.** Rehearsal
   dry-runs every selector; any failure aborts with a dump of visible elements
   and no video is produced. The ledger records REHEARSAL FAIL as a finding,
   not a crash.
3. Recording: headless browser, 1280x720, injected cursor overlay and a
   subtitle bar re-injected after every navigation, fixed pacing constants,
   typed input at human speed, seeded/demo credentials only.
4. Output: `docs/product/launch/demo/<release>.mp4` (ffmpeg from the raw
   capture), a poster frame, and a receipt row (path, duration, sha256,
   release SHA). A sanity check fails the step if the file is missing, the
   duration is outside bounds, or a sampled frame is blank.
5. Narration: when the named TTS key is present AND the per-video ceiling is
   set, the writer's script is voiced and mixed; otherwise the mp4 ships
   silent and the receipt says `narration: absent (no key)`. Spend is logged
   against the flight-plan budget; exceeding the ceiling fails closed to
   silent.
6. The video is referenced (not inlined) from release notes and from any
   publish-queue item the marketing agent stages. Nothing posts it.

### B. Lead intelligence
1. On `/release`, a prospecting step reads the venture's ICP and pain phrases
   from the flight plan / idea doc and queries the four sources. Each source
   adapter fails closed when its key is absent and says so in the report.
2. **Signal scoring** on a fixed, documented rubric (role/title, industry,
   recency of the matching statement, audience size, location, prior
   engagement with the owner) with weights in the template, not in prose.
3. **Mutual ranking + warm-path discovery** exists as a stage with the tier
   rule (warm intro ask / conditional intro / cold); with graph pulls deferred
   it assigns every candidate the cold tier and records `warm-path: deferred`.
4. **Enrichment**: one specific, recent, quoted thing the person said or
   built, with its link. No quote → candidate dropped. Fetched content is
   untrusted data; a target is never chosen by the content's instructions.
5. **Voice profile**: before drafting, build a short profile from the owner's
   own recent posts (or the design voice guide when none), so drafts read as
   the owner.
6. **Drafts**: one per person, one primary channel in the order email, X DM
   or public reply, LinkedIn DM (paste-by-hand). Opens from the quote, one
   low-friction ask, no "love to connect", no merge fields, no copy reused
   across people. Staged in `publish-queue.md` at `draft` with
   `kind: outreach`, which no Publish policy delegation can ever fire (§11:
   individual outreach is never delegable).
7. **Contacted ledger** `docs/product/launch/contacted.md`: person, source
   link, channel, date sent (human fills on send), follow-up due. A candidate
   already in the ledger is excluded from the next shortlist.
8. Zero sends by any agent, provable from the queue log and the ledger.

### C. Hash-pinned approval
1. Every queue item carries `body-sha256` and `epoch` (incremented on any body
   edit). `approved` is recorded with the hash and epoch it was granted for.
2. `/publish run` refuses to fire an item whose current body hash or epoch
   differs from the approval, resets it to `draft`, and reports why.
3. Firing takes a claim token: states `claimed → dispatching → delivered |
   unknown`. A second run cannot fire an item already claimed. `unknown`
   never auto-retries; it surfaces to the human.
4. The §3 fail-closed hook keeps its existing behaviour and additionally
   blocks any `kind: outreach` item from a scheduled run regardless of policy.
5. Tests: the hook harness covers tampered body, stale epoch, double claim,
   unknown outcome, and outreach-under-delegation.

## NOT in v1 (deferred, not denied)
- Apollo / Clay / ZoomInfo enrichment.
- Warm-path discovery via the X follower/following graph (paid tier). The
  stage ships; the pull is a later toggle.
- Automated LinkedIn reads or writes (cookie or API). Drafts only.
- Delegated firing of outreach drafts. Not deferred: never, by §11.

## Constraints
- Patterns only. No ECC code, scripts, or packages enter the tree (2026-07
  incident; `checkObfuscation()` lint).
- §11 boundary unchanged: individual outreach to real users is never
  delegable; paid spend is human-confirmed and budget-bounded.
- §12 secret rule: key NAMES only in the profile and `.env.example`; verified
  by use; never echoed.
- Reviewers run on Fable; builders on the default tier (owner's standing
  tiering rule).
- Runtime-agnostic: Firecrawl is an MCP tool in the Claude runtime only; the
  codex runtime needs a CLI or HTTP path for the same source. Adapters must
  not assume MCP.

## Shape decisions for the architect (memos, 2–3 options each)
1. **Where prospecting lives**: new `prospector` agent vs a mode of
   `marketing` vs a mode of `researcher`.
2. **Recorder implementation**: a plugin-shipped runner under `tools/` reading
   a per-venture `demo-flow.md`, vs a skill that writes a per-venture script
   into the venture repo, vs delegating to the venture's own e2e suite.
3. **Hash/epoch/claim storage and enforcement point**: columns in
   `publish-queue.md` vs a sidecar `publish-claims.jsonl` vs both; checked in
   the `/publish run` command logic vs the §3 hook vs both.
4. **TTS abstraction and ceiling enforcement**: provider adapter shape, where
   the per-video ceiling lives, how spend is logged against the flight plan.
5. **Discovery adapters**: shell/CLI scripts per source vs agent-prompt
   instructions over MCP/HTTP, given the codex runtime constraint.

## Locked decisions

Dated, the owner's picks at the single approval moment (2026-10-06), with the
counsel brief (`docs/product/decision-log.md`, same date) in hand. Companion
drafts: `-journeys.md` (designer), `-memos.md` (architect), `-metrics.md`
(analyst).

| # | Decision | Locked (2026-10-06) |
|---|---|---|
| L1 | Shape | **Three missions, C → A → B, each one session with its own n=1.** Mission 1 `publish-approval` (C) now, merges alone. Mission 2 `demo-video` (A) after a 30-minute Playwright spike on Orderly staging. B starts as a one-off hand-run trial (5 drafts, no adapters, no X); the owner sends by hand; replies measured; automation decided after. Issues #81/#82 stay ahead of automated B. |
| L2 | Architect memos | **All ten recommended options, with counsel's amendments:** threat model stated as accident-not-adversary; email hosts added to the §3 publish regex; a tokenless publish-host call blocks under EVERY policy, `PUBLISH_CONNECT=` marks connect round-trips; `api.elevenlabs.io` and `api.x.com` join the paid guard; unsent outreach drafts expire after one release (memo 8 amended); `contacted.md` kept out of the public tree. |
| L3 | Demo video | **Staging, silent in v1.** Records after the staging verify passes, seeded demo data, no real charge. Narration deferred; receipt carries `narration: absent`. Reverses the round-two TTS answer on counsel's advice. AC A1 and A5 read accordingly. |
| L4 | Lead-intelligence rules | **All four amendments accepted:** cap 5 drafts and a `/prospect` command (not a `/release` step); per-venture source list, HN and GitHub dropped for non-developer ICPs (Orderly: Reddit for finding only, web search); read-the-source confirmation at approve and "where I found this" stated in every draft; `contacted.md` gitignored, 12-month purge, Orderly's jurisdiction stated in positioning. AC B1, B6, B7 and interview rows "Release-driven" and "20-person" are superseded for B. |

### Mission 1 — `publish-approval` (C), planned now
Scope: memo 3 (queue columns + `publish-claims.jsonl` + `tools/publish-gate.mjs`),
the §3 hook moved to `hooks/lib/publish-guard.sh` with the L2 amendments, hook
harness cases (tampered body, stale epoch, double claim, unknown outcome,
outreach under delegation, tokenless call under human-only, connect marker),
`/publish approve|reconcile` verbs per the journeys doc, template and
WORKFLOW §14 text. n=1: in this repo's own queue plus the harness; a tampered
approved body is refused with the log line the metrics doc specifies.

### Mission 2 — `demo-video` (A), planned after mission 1 merges
Precondition: the Playwright spike on Orderly staging (resolution from the
venture cwd, ffmpeg H.264 inference F7, selector survival across two deploys).
Scope: memos 2, 6, 7; `demo-flow.md` template; receipts; `/doctor` check;
`/verify` wiring on staging. Silent only.

### B — hand-run trial, then decide
A `prospector` prompt run once on Orderly with no adapters: 5 candidates from
the per-venture sources, each with a quoted link and a deliverable channel,
5 drafts staged at `draft` with `kind: outreach`, gitignored ledger. Owner
sends by hand. The reply-rate OB row from the metrics doc gates automation
(memos 1, 5, 8, 9, 10).
