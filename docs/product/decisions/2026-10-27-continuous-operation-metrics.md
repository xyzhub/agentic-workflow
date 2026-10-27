# Continuous operation — metrics, pass numbers, baseline

_Analyst, 2026-10-27. Source brief: `2026-10-27-continuous-operation-brief.md`.
Labels: **measured** (cited) / **derived** (arithmetic shown) / **unmeasured**
(no number exists; stated plainly). Nothing below is invented; where the brief
gives no number, the pass number is a proposal marked **PROPOSE** for the owner
to ratify at the approval moment._

## 1. Done criteria: exact measure and pass number

| # | Criterion | Exact measure | Pass number |
|---|---|---|---|
| D1 | OB-32 closed first | The four OB-32 observations recorded in `.plans/OBLIGATIONS.md`: snapshot exists under git dir; compact-resume names it; doctor row green; observed auto-compact point vs `DEFAULT_WINDOW=1000000` / `DEFAULT_PCT=95` | 4 of 4 observed, row ticked with a `· fired` line, **before** any other phase starts. Any miss = the constants are corrected first (`/fix`) |
| D2 | Fidelity test in CI, compaction path | Seeded fixture (section 4) -> forced compaction -> resumed agent's restatement scored per field | 100% of seeded locked decisions, open questions, next step; 0 invented items |
| D3 | Fidelity test in CI, restart path | Same fixture -> fresh process | Same as D2 |
| D4 | Negative control | Same test on a deliberately broken handoff (one field removed) | Red. Real handoff: green. Both outcomes in one CI run, else the test is inert |
| D5 | 24h live run | One real unattended mission on one client container, wall clock >= 24h | >= 2 compactions/restarts (count of events in the round log, not of intentions); 0 owner corrections about lost context; mission reaches its planned checkpoint or a budget stop |
| D6 | Budgets hold 24/7 | Every round carries tick/mission budget; 1.5x overrun stop | Budget stops that were silently continued = 0; every stop produced an approver notification (count notified = count stopped); no round started with `Sessions used` >= 1.5 x `Estimate` |
| D7 | Gate never self-approved / never deadlocks | Gate events in the run log | Self-approvals = 0; unattended round blocked waiting on a human at the handoff gate = 0; handoff-gate failure ends the round with a ledger reason (J3), loops = 0 |
| D8 | Secrets | Scan of ledger, handoff, round logs, committed files for the container's key/token values | 0 matches |
| D9 | Lint | `node tools/lint.mjs` | clean; new tests red on old tree, green on fix |

## 2. What the 24h run records per round (one row per round, append-only)

round id · start/end UTC · wall seconds · unit done (brief/checkpoint/corrective id, or none) ·
tokens in/out (from the API usage, not estimated) · compactions in round · process restarts in
round (and cause: scheduled / crash / handoff-gate stop) · handoff writes (count, by whom: agent
or none) · handoff write latency from gate fire to file written · gate events (type, approver
route, **latency from request to recorded answer**) · budget stops (which budget, value at stop,
approver notified y/n) · owner corrections about lost context (**must be 0**; each owner message
reviewed and tagged by a human reader, since "lost context" is a judgment, not a counter) ·
fidelity probe result at each compaction/restart (section 4 fields, run against the live
handoff). Run summary: totals, rounds/hour, tokens/unit, median and max gate latency.
Wall time and gate latency have **no pass number**: record only; a PROPOSE threshold would be
invented, so set one after this run's data exists.

## 3. Baseline today

| Quantity | Value | Label | Source |
|---|---|---|---|
| Auto-compact point observed live | none; OB-32 open (`when: v1.68.0 installed`) | **unmeasured** | `.plans/OBLIGATIONS.md` OB-32 |
| Assumed auto-compact point | `DEFAULT_WINDOW=1000000`, `DEFAULT_PCT=95` | assumption (OQ-2, "Assumed, fails toward not blocking") | `.plans/precompact-handoff.state.md` OQ-2 |
| True compactions ever observed | 1 (n=1), file `2fa752c7...`, at 6,727,626 B | **measured** | `.plans/compaction-continuity.state.md` S2 block, corpus stamped 2026-08-10 |
| Bytes per window-token at that compaction | ~6.73 (6,727,626 B over 999,816 tokens) | **derived**, n=1, config-dependent | same; OB-1 open (re-measure at >= 3 new true-compaction records) |
| Byte bands (advisory / urgent) | 3,700,000 / 5,380,000 B | derived (0.55 / 0.80 x anchor, floored) | same |
| Handoff after a compaction: fidelity | no test exists; no number | **unmeasured** | brief "No proof of fidelity" |
| Compactions crossed without owner correction | no count recorded | **unmeasured** | none |
| Unattended hours achieved without a human | no record | **unmeasured** | none |
| Handoff gate degrade point | nudge after 5 blocks | code fact | `hooks/lib/handoff-gate.sh` (per brief) |
| Sessions used vs estimate, 13 closed/near-closed missions with both fields | 49 used / 46 estimated = 1.07 | **derived** | `.plans/*.state.md` `Estimate:` / `Sessions used:` read 2026-10-27 |
| Missions over estimate | 3 of 13: adaptive-ceremony 8/6 (1.33), builder-done-rules 5/4 (1.25), runtime-agnostic-codex 6/5 (1.20); none reached 1.5x | **derived** | same |
| 2026-08 credit burn ("48h missions") | no token or dollar figure in the files read | **unmeasured** | memory index only, not a ledger number |

Caveat: sessions-vs-estimate counts sessions, not hours or tokens; it says nothing about
24h cost. Ledgers without the two fields (compaction-continuity, deferred-obligations,
orchestrator-governance, portfolio-commons, sales-doc-architecture) and 0-used planned
ones are excluded. The run's own tokens/round is the first real cost number.

## 4. Fidelity scoring

Seed (fixed fixture, committed): N locked decisions (each with a unique id and a
distinctive reason), M open questions, in-flight state (branch, files, last gate result),
exact next step, plus 2 decoys (a retired decision, a closed question) that must NOT
resurface as live. Resumed agent is prompted identically after (a) forced compaction and
(b) fresh process, and answers in the handoff template's headings
(`templates/session-handoff.md`: Goal, Locked decisions, Done/In-flight/Next, Pointers, Open questions).

| Field | Match | Why |
|---|---|---|
| Decision ids, branch name, file paths, PR number, gate command, ledger path | **exact** string match | identifiers; a near-miss is a wrong pointer |
| Next step: the verb-phrase action and target id | **exact** on id and target; wording free | executable instruction |
| Last gate result (green/red) | **exact** enum | binary fact |
| Decision reasons, open-question text, goal | **semantic**, scored by a rubric of required claims per item (each claim present/absent); judge model pinned and its verdict stored | wording shifts after summarization |
| Decoys | must be absent from "live" lists (exact id check) | resurrection of retired decisions is a fidelity loss |
| Invented items | any item with an id not in the seed = fail | no fabrication |

Score per field class and overall; pass = every exact field correct AND every semantic
rubric claim present. Any semantic-judge flake rerun once; two disagreeing runs = fail.
The CI semantic judge needs a model call (key); keep exact checks as the always-on gate and
the semantic pass as a separate job, or the test turns flaky.

## 5. Items that become OB rows (need the owner's container or keys)

| Proposed row | Needs | Probe |
|---|---|---|
| OB-32 (exists) | orderly-agents session, `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000` | manual |
| 24h live run | a client LXC container, repo access, API key, approver route (Slack token or relay session), budgets set | manual: round log meets D5-D8 |
| Runner install on a client container (J5) | container shell, systemd, `systemctl status`, reboot survival | manual |
| Approver route live test (J4) | Slack token / client channel / relay session, an actual gate request answered | manual |
| CI semantic-judge job | model API key as CI secret | `gh run` result |
| Re-measure bands after the run | the run's compaction records join the corpus; fold into OB-1 (open, probe manual) | manual |

Not OB rows: the fixture, scoring script, round log schema, and unit tests (plain repo work, CI-checked).
