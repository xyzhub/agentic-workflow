---
status: draft
owner-agent: analyst
refresh-trigger: event (the n=1 /release on Orderly completes, then once per later /release)
---

# Launch media — measurement spec

_Answers "how is success measured" for the brief
(`docs/product/decisions/2026-10-06-launch-media-brief.md`). Pulled 2026-10-06,
branch `feat/launch-media-plan`. Nothing here is built yet, so every baseline is
**unmeasured**; no number below is a prediction. Labels: **MEASURED** (command
cited), **PROPOSED** (design not yet locked), **UNMEASURED** (named, not
guessed). Paths and row shapes are PROPOSED until the architect locks them._

## 0. Baseline today

| Thing | State | Evidence |
|---|---|---|
| Demo videos produced | **0** | `docs/product/launch/` holds `announcements/`, `content-plan.md`, `landing-page.md`, `launch-plan.md`, `positioning.md`; no `demo/` dir (ls, 2026-10-06) |
| Contacted ledger | does not exist | no `docs/product/launch/contacted.md` |
| Publish log | does not exist in this repo | no `publish-log.md` |
| Outreach drafts ever staged | **0** | queue has no `kind` column (`templates/publish-queue.md`) |
| Queue rows carrying a body hash | **0** | template has no `body-sha256`/`epoch` columns |
| Reply rate, cost per video, narration spend, rehearsal-fail rate, no-quote drop rate | **unmeasured** | the instruments do not exist |

## 1. Done signals for the n=1 (Orderly, guest-ordering golden path, staging)

Definition of done per the interview: one `/release` yields all of A, B, C
below, plus tier-1 lint and hook tests green (§7 also requires post-deploy
verification; the video is that verify's last step).

### A. Demo video

| | |
|---|---|
| Done when | a playable mp4 exists for the release, with a receipt row, produced only after a PASSED production `/verify` |
| Artifact | `docs/product/launch/demo/<release>.mp4` plus a poster frame |
| Receipt row | `\| release SHA \| path \| duration-s \| sha256 \| narration: present(<provider>, $<spend>) \| absent(<reason>) \| rehearsal: pass \|` (PROPOSED location: the release notes or a `demo/receipts.md`) |
| Proof of "playable" | the step's own sanity check (file present, duration in bounds, sampled frame not blank) plus `ffprobe` duration equals receipt duration; the human opens it once |
| Failure shape | `REHEARSAL FAIL: <selector>` finding in the ledger, no mp4 written; this is a recorded result, not a crash |
| Baseline | 0 videos; unmeasured |

### B. Lead intelligence

| | |
|---|---|
| Done when | 20 candidates, each with a quoted source link; 20 drafts at `state: draft`, `kind: outreach`; zero sends |
| Artifacts | the shortlist (PROPOSED: `docs/product/launch/shortlist/<release>.md`, one row per person: rank, score by rubric term, source, quote, link, tier); 20 rows in `publish-queue.md`; `contacted.md` |
| Shortlist row | `\| rank \| person \| source (web/reddit/hn/github/x) \| quote \| link \| score \| tier \| warm-path: deferred \|` |
| Contacted row | `\| person \| source link \| channel \| date sent (human fills) \| follow-up due \| reply (human fills: none/replied/positive) \|`. The reply column is my addition; without it reply rate is incomputable |
| Zero-sends proof | `grep -c 'state: posted' ` on kind outreach rows = 0 and the publish log has no outreach entry; every `date sent` cell is blank until the human fills it |
| Quote check | every link resolves and the quote string appears in it (spot-check by the analyst, sample size stated when run) |
| Baseline | 0 shortlists; unmeasured |

### C. Hash-pinned approval

| | |
|---|---|
| Done when | an approved item whose body was edited afterward is refused and reset to `draft`, with the reason reported |
| Artifacts | queue rows carry `body-sha256` and `epoch`; approval records the hash and epoch it was granted for; claim states `claimed → dispatching → delivered \| unknown` |
| Log line (PROPOSED) | `publish run: REFUSED P-0NN approved@<hash8>/e<n>, current <hash8>/e<m> -> reset to draft` |
| Test evidence | `node tools/hook-test.mjs` ends `hook-test: clean` with new cases for tampered body, stale epoch, double claim, unknown outcome, outreach-under-delegation. Baseline from the 2026-08-16 memo: 73 `ok` (stale; re-run before the change and record the new baseline, then require count above it) |
| n=1 proof | the human or the verifier tampers one approved Orderly draft on purpose and `/publish run` refuses it |
| Baseline | enforcement is prose-only today (§14 "resets it to draft"); refusal rate unmeasured |

## 2. Recorded per release (what the V6 loop consumes)

One row per `/release`, appended by the analyst to
`docs/product/launch/media-metrics.md` (PROPOSED), sourced from the receipts,
queue and ledger above. Each cell states its source and pull date.

| Metric | Definition | Source | Baseline |
|---|---|---|---|
| Cost per video | narration spend + any paid-tool spend, USD, per mp4 | receipt row + flight-plan budget log | unmeasured |
| Narration spend vs ceiling | spend / per-video ceiling; count of fail-closed-to-silent events | flight-plan budget log | unmeasured (ceiling "e.g. $1" in the brief is an example, not a locked value) |
| Rehearsal-fail rate | releases with REHEARSAL FAIL / releases that reached the recorder | ledger findings | unmeasured |
| Shortlist yield | candidates surfaced, dropped for no quote, final count (target 20) | prospecting report | unmeasured |
| No-quote drop rate | dropped-for-no-quote / candidates considered, per source | prospecting report | unmeasured |
| Sends | rows with `date sent` filled | `contacted.md` | 0 |
| Reply rate per source | replies / sends, grouped by `source` | `contacted.md` | unmeasured |
| Reply rate per channel | replies / sends, grouped by `channel` (email, X DM, public reply, LinkedIn paste) | `contacted.md` | unmeasured |
| Signups attributed | signups joined to publish-log rows and demo-video links | publish log + analytics | unmeasured; the venture's tracking plan must carry a source tag for this |
| Hash refusals | refused approvals; unknown-outcome claims | publish log | 0 (mechanism absent) |

**Reading rule.** Reply rate is judged only once sends exist, and with the
denominator printed next to it ("2 of 7"). With 20 candidates per release, one
release gives n of at most 20 per channel mix; any rate below roughly 5 sends
in a cell is reported as a count, not a percentage. Per-source comparison needs
several releases before it means anything; until then the V6 verdict is
"insufficient data", stated plainly.

## 3. Paired metrics (house rule)

| Optimization | Counter-metric it could degrade | How observed |
|---|---|---|
| Shortlist reaches 20 | evidence quality: quote relevance and recency | analyst samples a fixed 5 per release against the rubric; a short, high-quality list beats a padded 20. Report count and sampled quality together |
| Fewer no-quote drops | quote validity: quote absent from or misread from the link | quote-in-link spot-check above; a falling drop rate with falling spot-check pass is a regression |
| Higher reply rate per source | audience fit and drafts reading as the owner | human flags drafts rewritten before send; track edit-before-send count |
| Faster pacing in the video | watchable duration and legibility (subtitle readable, step visible) | duration vs bounds; human playback verdict recorded in the receipt |
| Lower cost per video | narration present or silent ratio; poster/frame quality | share of videos shipping silent, reported next to cost |
| Fewer rehearsal fails | rehearsal strictness: selectors loosened until they cannot fail | selector count per flow and any rehearsal-step edits recorded in the diff |
| Hash gate strictness | false refusals (benign edit resets an approval) | refusal log reviewed for refusals where the human changed nothing material |

## 4. Deferred measurement (register row proposed)

Reply rate cannot be read at n=1 (sends are human, later). Proposed
`.plans/OBLIGATIONS.md` row, for the orchestrator to add (I do not edit
ledgers); the id is the next unused integer at add time:

```
- [ ] OB-<n> · added 2026-10-06 (analyst, launch-media metrics) — do: read reply rate per source and per channel from contacted.md and write the first row of media-metrics.md — when: contacted.md holds at least 5 rows with a filled date-sent — probe: `grep -c '^| .* | 20[0-9][0-9]-' docs/product/launch/contacted.md`
```

## 5. Most gameable, and what is not known

- **Reply rate**: the denominator is human-chosen (who gets sent, who gets
  marked replied). Cherry-picking sends inflates it. Mitigation: always print
  sends of N drafted.
- **Shortlist of 20 with a quote each**: easy to hit by loosening what counts as
  a quote or by keeping weak candidates. Mitigation: the sampled quality check
  and the quote-in-link spot-check.
- **Unknown**: reply-rate norms for this audience, a sensible per-video ceiling,
  and how many releases the venture will produce for a per-source comparison to
  mean anything. None is invented here.
- **Untested**: rubric weights are in a template that does not exist yet; this
  memo cannot validate them.
