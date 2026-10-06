# Launch media — user journeys, states, and information architecture

**Date:** 2026-10-06 · **Author:** designer · **Feeds:** the launch-media brief
(`2026-10-06-launch-media-brief.md`), the architect's option memos, the PRD.
**Users:** the venture owner (reads, approves, sends by hand) and the
orchestrator + agents + hooks (drive the flows). Architecture is the
architect's; this doc fixes *what the owner sees and where it lives*.

Shared rules across all three capabilities:

- Every state is a row or a line the owner can read later, never only a
  console message. Nothing is "silently fine".
- Owner-channel messages follow §12 tiers: **Gate** when a human is blocked
  on, **Alert** when the owner would want to know now, otherwise nothing
  (the status page is the pull surface).
- Reports follow the plain-report rule (§6.0): define each id once, lead with
  the action.

---

## A. Demo video (after a PASSED production `/verify`)

### Journey

| # | Who | Does | Touches |
|---|---|---|---|
| A0 | planner / frontend (during the build) | Authors the step list for the golden path | `docs/product/launch/demo-flow.md` (new, from template) |
| A1 | orchestrator (`/verify` step 4, PASS only) | Checks `demo-flow.md` exists and `status: ready`; else records the empty state and finishes verify normally | `demo-flow.md` |
| A2 | orchestrator → recorder | **Discover**: dumps visible elements per screen in the flow | writes `docs/product/launch/demo/<release>.discovery.txt` |
| A3 | recorder | **Rehearse**: resolves every selector, no recording | on fail: `demo/<release>.rehearsal.txt` (dump), receipt row `REHEARSAL FAIL`, ledger finding |
| A4 | recorder | **Record**: headless 1280x720, cursor + subtitle overlay, human-speed typing, seeded credentials from `docs/AUTH.md` | raw capture in scratch |
| A5 | recorder | Encode mp4 + poster; sanity check (file exists, duration in bounds, sampled frame not blank) | `demo/<release>.mp4`, `demo/<release>.png` |
| A6 | writer (only if `narration:` names a script) | Script already drafted during the build; orchestrator checks the TTS key by NAME and the per-video ceiling in the flight plan | `demo-flow.md` frontmatter; `docs/product/flight-plan.md` Budget ceiling |
| A7 | orchestrator | Voices + mixes when key present AND ceiling set AND estimated cost ≤ ceiling; otherwise ships silent | receipt `narration:` and `spend:` columns |
| A8 | orchestrator | Appends the receipt row; references (never inlines) the mp4 from release notes; `/verify` report prints the Demo block | `demo/receipts.md`, release notes |
| A9 | marketing (next `/publish stage`) | May stage a post that *links* the mp4; nothing posts it | `publish-queue.md` |

Aha-moment: the owner opens the `/verify` report and finds a playable file path
they did not ask for. Friction before it: zero owner steps; the only owner-side
prerequisite is A0, done once per venture.

### States

| State | How it shows (truthfully) | Owner channel |
|---|---|---|
| Empty — no `demo-flow.md` | `/verify` report: "No demo recorded: `docs/product/launch/demo-flow.md` is missing. Author it from the template to get a video next release." Receipt row `result: skipped (no flow)`. | none |
| In progress | Ledger row `demo: discover → rehearse → record` with timestamps; no partial mp4 ever lands in `demo/` | none |
| Success, narrated | Receipt `result: ok`, `narration: voiced ($0.42)`; report shows path, duration, size | none (digest/status page) |
| Degraded — silent (no key, no ceiling, or over ceiling) | Receipt `narration: absent (no key)` / `absent (no ceiling)` / `absent (over ceiling: est $1.60 > $1.00)`; report says the mp4 is playable but silent and names the fix | none |
| Error — rehearsal fail | No mp4. Receipt `result: REHEARSAL FAIL`, points at `.rehearsal.txt` (step label, selector, visible elements). Ledger finding, not a crash; `/verify` still PASSES on its own criteria | Alert, one line, only when a channel is configured |
| Error — sanity check | Receipt `result: FAIL (duration 3s < 20s)` or `FAIL (blank frame)`; file kept under `demo/rejected/` for inspection | none |
| Error — seeded creds missing | Receipt `result: skipped (no AUTH.md row)`, names the row to add | none |

### Information architecture

**`docs/product/launch/demo-flow.md`** (template `templates/launch-demo-flow.md`):

```yaml
---
status: ready | draft            # only ready is recorded
flow: guest ordering             # plain name, used as the video title
base-url-row: Deploy + live-verify   # which §10 row supplies the URL
credentials-row: guest           # row in docs/AUTH.md; seeded/demo only
viewport: 1280x720
duration-bounds: 20s-180s
narration: none | docs/product/launch/demo/<flow>-script.md
narration-ceiling-usd: 1.00      # absent = silent
---
```

| # | screen | action | selector | input | subtitle | wait |
|---|---|---|---|---|---|---|
| 1 | Menu | open | `/m/demo-table-4` | — | Scan the QR, see the menu | 3s |
| 2 | Menu | click | `button:has-text("Add")` | — | Add a dish | 2s |

**`docs/product/launch/demo/receipts.md`** (append-only, newest first):

| release | release SHA | recorded (UTC) | path | duration | sha256 | narration | spend | result |
|---|---|---|---|---|---|---|---|---|

Files: `demo/<release>.mp4`, `demo/<release>.png` (poster),
`demo/<release>.discovery.txt`, `demo/<release>.rehearsal.txt` (on fail).

### `/verify` report block (PASS)

```
Demo video
  Recorded the guest-ordering flow for v1.4.0: docs/product/launch/demo/v1.4.0.mp4 (48s, silent — no ELEVENLABS_API_KEY set).
  To narrate the next one: set the key by name and a per-video ceiling in demo-flow.md.
```

---

## B. Lead intelligence (every `/release`)

### Journey

| # | Who | Does | Touches |
|---|---|---|---|
| B1 | orchestrator (`/release` step 5) | Reads ICP + pain phrases; absent → empty state, release continues | `docs/product/launch/positioning.md` (ICP), `docs/product/idea.md` (pain language), flight plan Idea as fallback |
| B2 | prospector (agent or mode — architect decides) | Checks each source's key by NAME; records per-source status before querying | report "Sources" table |
| B3 | prospector | Queries Firecrawl web, Reddit/HN threads, GitHub (`gh`), X recent search; collects candidates with the matching statement | scratch only |
| B4 | prospector | Excludes anyone in `contacted.md`; drops candidates with no quotable statement | `contacted.md` (read) |
| B5 | prospector | Scores on the rubric; shortlist = top 20 at or above threshold | `prospect-rubric.md` |
| B6 | prospector | Tier stage: all `cold`, `warm-path: deferred` | report header |
| B7 | prospector | Voice profile from the owner's recent posts (X, if key) else `design/brand/copy-kit.md` | report "Voice" section |
| B8 | prospector | One draft per person, one channel in order email → X DM/reply → LinkedIn DM (paste) | `publish-queue.md` rows `kind: outreach`, state `draft` |
| B9 | orchestrator | Writes the prospect report; `/release` prints the Prospects block | `prospects/<release>.md` |
| B10 | owner | Reads report, edits/approves a draft, **sends by hand**, fills `date sent` | `contacted.md` |

Aha-moment: a named person, their own words, a link, and a message that sounds
like the owner. Default justified: every draft starts at `draft` and
`kind: outreach` because §11 says outreach is never delegable.

### States

| State | How it shows | Owner channel |
|---|---|---|
| Empty — no ICP | Report: "No shortlist: `positioning.md` has no ICP section yet. Run the marketing V5 pass, then the next release prospects." Zero queue rows | none |
| Empty — no contacted ledger | Created from template on first run; report line "contacted ledger created, 0 rows" | none |
| In progress | Ledger row `prospecting: sources 2/4 · candidates 61 · shortlisted 0` | none |
| Success | Report: 20 rows, each with quote + link; queue +20 `draft`; `sends: 0` provable line | none |
| Degraded — one source down | Sources table `x: skipped (X_BEARER_TOKEN absent)`; shortlist drawn from the rest; report says which pool is thinner | none |
| Degraded — fewer than 20 | Report: "14 of 20 — 31 candidates dropped (no quote: 22, already contacted: 9)". Never padded | none |
| Degraded — cold-only tier | Header `warm-path: deferred (follower-graph pull not enabled)` on every run in v1 | none |
| Error — all sources down | Report: "No shortlist: every source failed closed (keys absent: …)". Release still completes | Alert |
| Error — content tried to steer | Candidate dropped; report row in "Flagged" with the verbatim text and link; never a target | none |

### Information architecture

**`docs/product/launch/prospects/<release>.md`** — frontmatter: `release`,
`date`, `icp-source`, `rubric-version`, `voice-source`, `warm-path: deferred`,
`sends: 0`. Sections: Sources (table `source | status | candidates`), Shortlist
(below), Dropped (counts by reason), Flagged, Voice (5 bullets).

| rank | person | role / org | said (≤140 chars, verbatim) | link | said on | score | tier | channel | draft |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Dana K. | owner, 2 taquerias | "we lose the table every time the card machine dies" | https://… | 2026-09-28 | 78 | cold | email | O-014 |

**`docs/product/launch/prospect-rubric.md`** (template
`templates/launch-prospect-rubric.md`; weights are data, editable per venture):

| signal | weight | 0 | 1 | 2 |
|---|---|---|---|---|
| role / title fits ICP | 25 | unrelated | adjacent | decision-maker |
| industry match | 20 | no | adjacent | exact |
| recency of the matching statement | 30 | >12 mo | 3–12 mo | <3 mo |
| audience size | 5 | — | — | — |
| location fits go-to-market | 10 | — | — | — |
| prior engagement with the owner | 10 | none | reacted | replied |

Score = Σ weight × (points/2); threshold 60. Recency carries the most weight
because the quote is the whole reason to write.

**`docs/product/launch/contacted.md`** (template `templates/launch-contacted.md`):

| person | profile link | source link | channel | draft id | date sent | follow-up due | outcome |
|---|---|---|---|---|---|---|---|

The owner fills `date sent`; an empty `date sent` still excludes the person
from the next shortlist (they were drafted for, not spammed twice).

### `/release` report block

```
Prospects (people publicly describing the problem this release addresses)
  20 found, 20 drafts staged as draft, 0 sent. Report: docs/product/launch/prospects/v1.4.0.md
  Sources: web ok · reddit/hn ok · github ok · x skipped (X_BEARER_TOKEN not set)
  Next: read the report; approve any draft with /agentic-workflow:publish approve O-014, then send it yourself and fill contacted.md.
```

---

## C. Hash-pinned approval (inside `/publish stage | approve | run`)

### Journey

| # | Who | Does | Touches |
|---|---|---|---|
| C1 | marketing / writer / prospector via `stage` | Writes body; the command stamps `body-sha256` and `epoch: 1` | `publish-queue.md` |
| C2 | owner | Runs `/publish approve <id>`: sees the exact body, confirms; command writes `state: approved`, `approved-for: <sha8>@<epoch>` | queue row |
| C3 | anyone edits a body | Next `stage`/`approve`/`run` recomputes the hash; mismatch → `epoch +1`, `state: draft`, `approved-for` cleared, reason line | queue row |
| C4 | owner (or scheduled run within §10 policy) | `/publish run`: for each approved + due item, re-hash, compare to `approved-for`; skip and report on mismatch | queue, report |
| C5 | run | Writes `claim: <token8> claimed <UTC>` **before** any network call; a row already claimed is skipped | queue row |
| C6 | run | `dispatching` → connector call → `delivered` (log row + receipt) or `unknown` | `publish-log.md`, queue |
| C7 | §3 hook | Blocks any `kind: outreach` from a non-interactive run regardless of policy; blocks paid as today | hook |
| C8 | owner | Resolves `unknown` by hand: `/publish reconcile <id> --delivered <permalink>` or `--cancel` | queue, log |

Forgiveness over confirmation: a hand edit never breaks anything, it just
un-approves. The only confirmation kept is C2, because approval is the
consequential act.

### States

| State | How it shows | Owner channel |
|---|---|---|
| Empty queue | `status`: "Nothing queued. Run `/agentic-workflow:publish stage` after a release." | none |
| Approved, pinned | row `approved · a1b2c3d4@2`; `status` lists it under "Ready to fire" | none |
| Approved by hand, no pin | treated as draft; `status`: "P-003 says approved but has no pinned hash — run `publish approve P-003`" | none |
| Tampered body | run refuses: `P-003 not fired: body changed after approval (hash a1b2c3d4 → 9e8f7a6b). Reset to draft, epoch 3. Re-approve to fire.` | Alert only on a scheduled run |
| Stale epoch | same message, "epoch 2 approved, now 3" | as above |
| Double claim | `P-003 not fired: already claimed 14:02 (run r-7f3a). If that run died, reconcile it.` | none |
| Dispatching (crash mid-run) | `status` shows `dispatching since 14:02 — outcome unknown`; never auto-retried | Gate: "P-003 may or may not have posted. Check the channel, then reconcile." |
| Unknown | row `unknown`; `status` top section "Needs you" | Gate, once |
| Delivered | log row with permalink + `fired by`; queue row becomes receipt `delivered · a1b2c3d4@2 · r-7f3a` | none |
| Outreach under delegation | hook blocks; `status`: "O-014 is outreach — only you can send it, by hand" | none |

### Information architecture — `publish-queue.md` columns (changed)

| id | kind | channel | scheduled (UTC) | state | paid | body-sha256 | epoch | approved-for | claim | source asset | summary |
|---|---|---|---|---|---|---|---|---|---|---|---|

- `id`: `P-nnn` posts, `O-nnn` outreach. `kind`: `post | outreach`.
- `state`: `draft → approved → claimed → dispatching → delivered | unknown`;
  `delivered` rows are receipts, mirrored to the log.
- `body-sha256`: full hex of the body under `### <id>` (heading excluded,
  trailing whitespace trimmed, LF line endings). `approved-for`: first 8 hex
  + `@` + epoch. `claim`: `<token8> <state> <UTC>`; empty when none.
- Outreach channels: `email | x-dm | x-reply | linkedin-dm`; summary holds the
  person and the one ask; the body section carries `to:` and `subject:` lines
  before the text so the owner can paste.
- `publish-log.md` gains `kind` and `claim` columns, `fired by` unchanged.

### `/publish status` report

```
Publish queue — policy: human-only
Needs you (1)
  P-003 (the launch thread for X): posted at 14:02 but no confirmation came back. Check X, then run publish reconcile P-003.
Ready to fire (2): P-001 (X announcement, due today 16:00), P-002 (mailing list, due tomorrow)
Drafts (23): 3 posts, 20 outreach — outreach is sent by you, by hand, never by a run
Posted this week (0)
```

---

## Open questions for the approval moment

1. `approve` and `reconcile` as new `/publish` subcommands (my recommendation,
   so the pin is stamped by a tool, not by hand) vs. hand-edit + run-time pin.
2. Rubric default weights above vs. the owner's own — editable either way.
3. REHEARSAL FAIL: Alert-tier message or ledger-only?
4. Should `/verify` PASS still be reported as PASS when the demo step fails?
   (This doc says yes: the demo is a product of verify, not a criterion.)
