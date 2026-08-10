---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: compaction-continuity — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
before ending a session._

**OQ1, OQ4 and OQ6 RESOLVED 2026-08-03 by the human** — all three planner
recommendations accepted verbatim. **OQ2, OQ3, OQ5 and OQ7 stand on the planner's
recommendation** absent a ruling (the human was shown them and did not override);
any reviewer may challenge them at a checkpoint. **Execution is UNBLOCKED at S1.**

**▶ IN FLIGHT — execution started at S1 on 2026-08-10** (phase 1, branch
`mission/compaction-continuity-p1`). _(The 2026-08-03 "NOT STARTED / live thread
is `context-economy`" note expired: PR #31 merged 2026-08-03 and this mission is
now the active thread.)_

Gate policy: **batch** (L1, recorded at mission start) — each phase branch
`mission/compaction-continuity-p1…p4` merges into
**`mission/compaction-continuity-integration`** by the orchestrator on reviewer
APPROVE; **never the default branch**. The human merges the integration branch
**once**, at the end-of-mission confirmation. _The human may override to
`human-merge`._

**Surfacing under batch:** the human sees no merge prompts until the end.
Therefore **both `[STRICT]` verdicts (`ckpt-p1`, `ckpt-p2`) and any REQUEST
CHANGES must be pushed to the human the moment they land** — owner channel or
direct report — not held for the final PR.

**Base branch (OQ1, updated 2026-08-04):** every phase branches off **`main`**.
PR #31 merged 2026-08-03T19:51Z (`main` = `2c8487f`), so `hooks/lib/compact-resume.sh`
— the file this mission extends — is now on the default branch. Phases merge into
`mission/compaction-continuity-integration`; the final PR targets `main` directly,
with **no hold and no retarget**. _(Superseded: the original "base off
`mission/context-economy-integration`" existed only while #31 was open.)_

**Two standing rules, inherited by every session:** never `Read`/`cat`/`head`/`tail`
a `*.jsonl` (L10); nothing in this mission can be exercised live before merge +
reinstall (installed plugin cache `1.41.0`, repo `v1.42.0`) — the gate is
`tools/hook-test.mjs` dispatch against the working tree.

Plan: `.plans/compaction-continuity.md` · Briefs:
`.plans/compaction-continuity.sessions.md` · Brief:
`docs/product/decisions/2026-08-03-compaction-continuity-brief.md`

Next up: **S9** — phase-3 docs and the honest non-claim (branch
`mission/compaction-continuity-p3`, **Suits:** `writer`). S8 shipped the named
`Read` threshold, the §6.2 Delegated-reads paragraph, and the ckpt-p2 F1–F4
resolutions; harness 59 → 64.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [x] S1 — harness fixtures: arbitrary files + a sized transcript in `runHook()` (branch `mission/compaction-continuity-p1`) — **Suits:** `backend` — done 2026-08-10, 35 cases green, 3 mutations proved
- [x] S2 — derive the byte thresholds from real transcripts; measurement only, no source change (branch `mission/compaction-continuity-p1`) — **Suits:** `backend` — done 2026-08-10, n=1 compaction in the corpus, bands 3,700,000 / 5,380,000 B (see 📊 block), ledger-only diff, gates 35/54/lint green
- [x] S3 — `hooks/lib/handoff-budget.sh` + `UserPromptSubmit` registration, named constants, four silencers (branch `mission/compaction-continuity-p1`) — **Suits:** `backend` — done 2026-08-10 (completed after an infra failure killed the first attempt post-script-write), harness 35 → 47 green, 6 mutations proved w/ anti-inert control
- [x] S4 — atomic-ref docs for the trigger: §3 row, §4 reflexes, plugin README, `hooks.json` description (branch `mission/compaction-continuity-p1`) — **Suits:** `writer` — pending orchestrator gate-run + commit
- [x] Checkpoint `ckpt-p1` **[STRICT]** — **APPROVE** 2026-08-10 (Fable), no corrective needed. UX 3 · Security 3 · Efficiency 3 · Architecture 3 · DX 2 · QA 2. 18-path dispatch matrix all exit 0; 6 claimed + 6 adversarial mutations; **n=1 bands accepted on the merits** (owner owns the n=1 — re-measure if compaction changes upstream). Merged `c2e4648`. Folded forward into P2: **finding 1** (metachar-`session_id` harness case — the sanitizer currently has zero regression protection); **nit 3** (§3 "newer than the crossing" is OQ4's ideal; code implements the conservative newer-than-transcript proxy, disclosed). Drift-line ruling: leave, file-as-lesson for the portfolio-learning sweep. Verdict surfaced to the human immediately.
- [x] S5 — `compact-resume.sh` fallback: three branches, freshness stated in the directive (branch `mission/compaction-continuity-p2`) — **Suits:** `backend` — done 2026-08-10, harness 47 → 54 green, 5 mutations proved both-states w/ anti-inert control, ckpt-p1 finding 1 (metachar `session_id` case) shipped, `hooks.json` SessionStart description fixed in-commit (per S7's "S5's own commit or this one")
- [x] S6 — handoff provenance stamp, conditional on OQ3; collapses into S5 if OQ3 is "no format change" (branch `mission/compaction-continuity-p2`) — **Suits:** `writer` — done 2026-08-10 by `backend` (the brief's pair clause: the parse landed in the hook). Stamp line in the template + `/agentic-workflow:handoff` instruction + live handoff stamped; `compact-resume.sh` branch 2 prefers the stamp's ISO over mtime, mtime fallback byte-identical to S5 (pinned exact-string). Harness 54 → 59, 4 mutations both-states w/ anti-inert control, lint + selftest green
- [x] S7 — atomic-ref docs for the fallback, incl. the now-false `hooks.json` silence claim (branch `mission/compaction-continuity-p2`) — **Suits:** `writer` — pending orchestrator gate-run + commit
- [x] Checkpoint `ckpt-p2` **[STRICT]** — **APPROVE** 2026-08-10 (Fable), no corrective needed. Security 3 · Architecture 3 · DX 3 · QA 2 · UX 2. 33/33 dispatch paths; branch-1 byte-identical to the shipped hook; OQ6 verbatim; SUSPECT-wording probe clean. Merged `488b87a`. **Folded into P3/S8:** F1 clock-blind gap (add an old-mtime-transcript case — a `T_MTIME=$(date +%s)` mutation survives all 59 today); F2 note-only (stamp regex layer masked by jq/case guards); F3 the SUSPECT directive falsely asserts "OLDER than the transcript's last append" when SUSPECT came from a *missing* transcript — fix the wording per sub-path; F4 pin the "Re-read it VERBATIM" fragment. Verdict surfaced to the human immediately.
- [x] S8 — frequency lever: named `Read` advisory threshold + the §6.2 interactive paragraph, no savings claim (branch `mission/compaction-continuity-p3`) — **Suits:** `backend` — done 2026-08-10: `READ_ADVISORY_LINES=800` named in hooks.json (evidence + explicit non-claim in its description), §6.2 **Delegated reads** paragraph byte-identical in both mirrors (pre-existing drift unchanged, `docs/WORKFLOW.md:3` untouched), ckpt-p2 F1–F4 all resolved; harness 59 → 64, 6 mutations both-states w/ anti-inert control (F1's clock mutation leaves the pre-S8 59 green, fails 1/64 now), zero savings-claim grep hits in added prose
- [ ] S9 — phase-3 docs and the honest non-claim (branch `mission/compaction-continuity-p3`) — **Suits:** `writer`
- [ ] Checkpoint `ckpt-p3` — phase 3 review + merge per gate policy (routine, single-reviewer)
- [ ] S10 — the documentation-of-record pass: CHANGELOG, JOURNEY, status-page stamp (branch `mission/compaction-continuity-p4`) — **Suits:** `chronicler`
- [ ] S11 — the integration PR body; retarget per OQ1 (branch `mission/compaction-continuity-p4`) — **Suits:** `writer`
- [ ] Checkpoint `ckpt-p4` — end-of-mission review on the integration branch; human merges

## Open questions

_Mirrored from `.plans/compaction-continuity.md` with their recommendations.
**Execution does not start until all seven are answered.** Empty this section as
each is resolved, recording the answer and its date._

- **OQ1 — RESOLVED 2026-08-03, then SUPERSEDED 2026-08-04 by reality: base off `main`.**
  The original resolution (base off `mission/context-economy-integration`, hold the PR,
  retarget later) existed **only** because PR #31 was unmerged and `compact-resume.sh`
  was not on the default branch. **PR #31 MERGED 2026-08-03T19:51Z** (`main` = `2c8487f`;
  `compact-resume.sh` verified present). The dependency is gone: **every phase now
  branches off `main`, the integration branch is `mission/compaction-continuity-integration`,
  and the final PR targets `main` directly — no hold, no retarget.** The plan branch was
  rebased onto `main` and is a clean descendant. _Nothing about the decision's substance
  changed; its premise expired._
- **OQ2 — RESOLVED-by-measurement 2026-08-10 (S2).** Derived from the local corpus
  per the recommendation's method (`grep -nE '"isCompactSummary" *: *true'` +
  `awk 'NR<=n' | wc -c`): **exactly one** transcript in the corpus contains a true
  compaction record (`2fa752c7…`, record at line 2551 of 4,612), byte-point
  **6,727,626 B** through the record. **n = 1 — the spread cannot be assessed**, so
  the single observation IS the conservative floor and the two bands are cut from
  it, rounded **down**: **`ADVISORY_BYTES = 3,700,000`** (55.0% of the point) and
  **`URGENT_BYTES = 5,380,000`** (79.97%). Full derivation, commands and caveats in
  `## 📊 S2 THRESHOLD BLOCK`; S3 takes the constants verbatim and must restate the
  n=1 caveat in their comment. Any reviewer may still challenge at `ckpt-p1`.
- **OQ3 — Does `session-handoff.md`'s format change?** **Recommendation: one
  provenance line** (`_Written: <ISO> · session <id> · branch <b>_`), no
  restructuring. If "no", S6 collapses into S5 (log the collapse as a deviation).
- **OQ4 — RESOLVED 2026-08-03 (human): four mechanical silencers.** One firing per
  band per session (`$TMPDIR` state keyed by `session_id`), at most two bands, silent
  when the handoff is already fresher than the crossing, silent when an active mission
  ledger exists — plus a ≤3-line cap. **If it still nags, raise the bands; do NOT add
  conditions.** Deterministic by design: the human must be able to predict exactly when
  it fires. Planner recommendation accepted verbatim.
- **OQ5 — What does "keeping it current" mean with no checkpoints?**
  **Recommendation: currency against the transcript, never the clock.** A handoff
  is current if written after the most recent band crossing; otherwise the
  directive labels it suspect and tells the agent to verify against
  `git log`/`git status` before trusting its **Next**.
- **OQ6 — RESOLVED 2026-08-03 (human): inject a distinct ≤6-line directive.** When
  there is neither a ledger nor a handoff (this repo's literal state today), name
  `git log -5`, `git status`, `.remember/now.md`, and instruct the agent to **tell the
  human the record is missing** rather than proceed on the summary. **Silence is the
  current bug**, and this is the case the owner is in most of the time. It must **not**
  instruct the agent to author a handoff on the spot — immediately after losing context
  is the worst moment to write state. Planner recommendation accepted verbatim.
- **OQ7 — Does the trigger fire during missions too?** **Recommendation: no —
  only when there is no active ledger.** Mission sessions already have the
  thread-keeper, the beat-enforcer and a working compact-resume; firing there adds
  machinery to the population that doesn't need it (the A5 mistake) and lets the
  trigger and the fallback share one `active ledger?` predicate.

## 📊 S2 THRESHOLD BLOCK — 2026-08-10 (this is S3's only source; do not re-measure)

_Corpus stamped **2026-08-10T04:30:59Z**: `~/.claude/projects/-Users-baker-Playground-venture-workflow-plugin/`,
**48 `*.jsonl` files, Σ 21,793,788 bytes**. **No `*.jsonl` was ever `Read`/`cat`/`head`/`tail`-ed** —
only `wc -c`/`wc -l`, `grep -c`/`grep -l`/`grep -n | cut`, and `awk 'NR<=n' | wc -c` (L10).
Gates at run time, untouched: `node tools/lint.mjs` clean · `tools/hook-test.mjs` **35 ok** ·
`context-attrib --selftest` **54 ok**._

**Detection (the landmine, confirmed but not re-derived).** Bare
`grep -l isCompactSummary` over the corpus returns **11** files — transcripts that
*quote this mission's own docs* match the bare pattern. The authoritative form is
value-anchored: `grep -lE '"isCompactSummary" *: *true'` → **1 file**. Cross-checked
against two independent markers: `grep -l compact_boundary` → the **same 1 file**;
`grep -l compactMetadata` → the same 1 file. No transcript matches any escaped-quote,
spaced, or `:false` variant of the key. **Exactly one true compaction exists in the
corpus. n = 1.**

**The one compaction, measured** (`2fa752c7-9b89-4313-8729-ec63daee6496.jsonl` —
reproduces the S7b/brief anchor **exactly**: 12,211,203 B / 4,612 lines):

| quantity | value | command |
|---|---|---|
| true-record line | 2551 (of 4,612) | `grep -nE '"isCompactSummary" *: *true' F \| cut -d: -f1` |
| `compact_boundary` line | 2550 (adjacent — same event) | `grep -n compact_boundary F \| cut -d: -f1` |
| **byte-point through record** | **6,727,626 B** | `awk -v n=2551 'NR<=n' F \| wc -c` |
| byte-point before record | 6,710,768 B (summary record ≈16.9 KB) | `awk -v n=2551 'NR<n' F \| wc -c` |
| total file | 12,211,203 B / 4,612 lines | `wc -c F` · `wc -l F` |

Distribution across the corpus: **min = median = max = 6,727,626 B, n = 1.** There is
no spread to assess; per OQ2's conservative-floor rule the single observation is
treated as the floor, and the bands are cut from it **rounded down** (firing early is
the safe direction for a capped, silencer-guarded nudge; firing late is the failure
mode):

- **`ADVISORY_BYTES = 3,700,000`** — 0.55 × 6,727,626 = 3,700,194 → floor to 3,700,000 (54.997%)
- **`URGENT_BYTES = 5,380,000`** — 0.80 × 6,727,626 = 5,382,101 → floor to 5,380,000 (79.97%)

**Caveats S3 must carry into the constants' comments:**

1. **n = 1** — one compaction, one session, one operator, one model/window config. Not
   a distribution; a single anchor.
2. **Bytes are a loose cumulative proxy, not a token measurement.** The transcript
   accumulates tool results, JSON envelope and already-evicted content. At the observed
   compaction the session's window held 999,816 tokens (S7b §1) → effective ratio
   **≈6.73 transcript-bytes per window-token**, *not* the ~2 chars/token band (that band
   is for model-authored text only). Never present the constants as token math.
3. **The point is config-dependent**: a different context-window size, model, or
   auto-compact margin moves it. If compaction behavior changes upstream, re-measure —
   don't scale.
4. **Transcripts are append-only and live**: `b167727e…` grew 5,032,698 → during this
   very measurement (stamps 04:30:59Z vs 04:33:49Z); corpus totals are snapshots.
5. **One brief anchor did NOT reproduce**: the sessions brief (written 2026-08-03)
   claims `b167727e…` = 3,283,782 B / 1,501 lines with 1 true record; today the same
   file is 5,032,698 B / 2,394 lines with **0** true records by every literal form
   tested (exact, spaced, escaped, anchored regex), and the corpus shrank **87 → 48
   files**. An append-only file cannot lose a record, so either the 2026-08-03 count
   was itself a bare-grep artifact or the file was replaced during a cleanup that also
   removed ~39 files. Unresolvable without reading content (forbidden). The derivation
   above rests **only** on `2fa752c7…`, which reproduces byte-for-byte.
6. Percent-of-final-file is a curiosity, not an input: 6,727,626 / 12,211,203 = 55.1%,
   meaningless for thresholds because the file kept growing after compaction.

## Standing steers

_Human steers, captured **verbatim** at checkpoints only (never mid-brief), in
the grammar `- YYYY-MM-DD (ckpt <id>) — "<exact words>"`. Retire by
~~strikethrough~~, never delete._

_(none yet — no checkpoint has run.)_

## Deviations

_Any departure from a brief — logged here the moment it happens, with why.
Deviating is allowed; deviating silently is not (§4)._

- 2026-08-10 (S1) — the brief named **two** `runHook()` knobs (`files`,
  `transcript`); a third optional `command:` override (raw probe command in place
  of the hooks.json lookup, harness self-proof cases only) was added because the
  brief's own Verify section requires probe cases (`test -f`/`ls`, `wc -c` on
  `$transcript_path`) that no registered hook can dispatch. No hook behavior
  touched; the override is documented in `runHook()`'s header comment.
- 2026-08-10 (S1) — the anti-inert control was executed in its only applicable
  form: the mutated staging code does not exist in the pre-change harness, so
  each mutation cannot literally be "re-run against" it; instead, under each
  mutation the **33 pre-change cases stayed green** (diffed byte-for-byte),
  proving the pre-change suite is blind to all three mutations and only the new
  self-proof cases detect them.

- 2026-08-10 (S2) — the brief's corpus facts, measured 2026-08-03, no longer hold:
  87 → **48** files, and the `b167727e…` anchor ("true-records = 1") returns **0**
  today by every literal form (details: 📊 block, caveat 5). Measurement proceeded
  per the brief's method on what exists; the derivation rests solely on `2fa752c7…`,
  which reproduces exactly. Not a method deviation — an input-drift finding.
- 2026-08-10 (S2) — the dispatching prompt allowed a multi-project corpus ("e.g.
  `-Users-baker-Packages-orderly`"); the brief scopes S2 to this project's transcript
  dir only. Per the standing rule the brief wins: only
  `~/.claude/projects/-Users-baker-Playground-venture-workflow-plugin/` was measured.

- 2026-08-10 (S3) — the first S3 agent died on an API infrastructure error
  immediately after writing `hooks/lib/handoff-budget.sh` (untracked, unverified;
  nothing else landed — no registration, no cases, no ledger write). A completion
  session reviewed the inherited script line-by-line and dispatched it across
  every path: it matched the brief exactly, so it was kept **byte-for-byte
  unchanged**; the completion added the registration, 12 harness cases, the
  mutation proofs and this ledger write. Not a brief deviation — an
  infrastructure one, logged so the two-agent history is on the record.
- 2026-08-10 (S5) — the `hooks.json` SessionStart `description` rewrite (the
  now-false "silent when no `.plans/` or no active ledger" claim) was listed
  under S7's reads but executed in S5's commit — S7's brief explicitly allows
  "S5's own commit or this one". S7 verifies the description, not rewrites it.
- 2026-08-10 (S5) — S6 did NOT collapse: OQ3 stands on the planner's
  recommendation (one provenance line = a format change), so S5 implemented
  the mtime-only freshness path and left stamp-preference to S6. Logged
  because the dispatching prompt made the collapse conditional on OQ3.
- 2026-08-10 (S3) — the harness's once-per-band marker lives in the REAL
  `$TMPDIR` (`runHook()` does not override it, and the brief forbade harness-
  machinery changes), so the new cases mint a unique `session_id` per run to
  keep prior runs' markers from suppressing firings; empty uniquely-named
  markers are left to the OS tempdir cleanup. Documented in the case block.

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs. Newest on top; crash-safe by write-ahead._

- _2026-08-10 (S8, `backend`, branch `mission/compaction-continuity-p3`): named
  the Read advisory (`READ_ADVISORY_LINES=800`, rationale + explicit non-claim
  in its hooks.json description) and added the §6.2 **Delegated reads**
  paragraph to both mirrors, byte-identical, drift unchanged (no figure — L11).
  ckpt-p2: F1 old-mtime-transcript case shipped — `T_MTIME=$(date +%s)` now
  fails 1/64 while the pre-S8 59 stay green (gap reproduced, then closed);
  F2 masking note at the stamp regex; F3 SUSPECT split per sub-path (stale
  keeps OLDER-than; missing/unreadable transcript reads "SUSPECT — UNPROVABLE",
  both case-pinned); F4 "Re-read it VERBATIM" pinned. Harness 59 → 64, 6
  mutations both-states w/ anti-inert; lint + selftest 54 green. S9: docs._

- _2026-08-10 (S7, `writer`, branch `mission/compaction-continuity-p2`): killed
  the now-false "silent when no active mission" claim — §3 row + §4 reflex
  sentence now describe all three branches, wording matched to compact-resume.sh's
  shipped SUSPECT/CURRENT text; unified §6.2's fresh-self-handoff paragraph with
  the fallback; fixed README's clause. Mirrors diff-clean (known drift only).
  Two out-of-scope findings reported, not fixed: `hooks.json`'s description is
  stale re: S6's stamp preference; CHANGELOG.md's P3-era "Silent with no active
  ledger" line is the same false claim (S10's). Text-only. `ckpt-p2` next._

- _2026-08-10 (S6, `backend`, branch `mission/compaction-continuity-p2`): stamp
  shipped — `_Written: <ISO> · session <id> · branch <b>_` line in the template,
  `/agentic-workflow:handoff` instructed to refresh it every write, live handoff
  stamped with its HONEST original date (2026-08-04T00:00:00Z → reads SUSPECT,
  truthfully). `compact-resume.sh` branch 2 prefers the stamp (exact-shape gate +
  jq `fromdateiso8601`, shell-inert), mtime fallback byte-identical to S5.
  Harness 54 → 59; M1–M4 both-states; anti-inert: pre-S6 hook fails exactly the
  2 stamp cases. Lint + selftest green. S7 next: docs; stamp format per above._

- _2026-08-10 (S5, `backend`, branch `mission/compaction-continuity-p2`):
  `compact-resume.sh` now has THREE branches — active ledger → pre-P2 directive
  byte-for-byte (pinned by an exact-string case); no ledger + handoff → ≤6-line
  directive stating `Freshness: CURRENT` (handoff `-nt` transcript, the disclosed
  conservative proxy) or `Freshness: SUSPECT` (older, or missing/unreadable
  `transcript_path` — fail closed) with git log/git status verification ordered
  before trusting **Next**; neither → OQ6 directive (git log -5 / git status /
  .remember/now.md, tell the human, authoring-now forbidden). Harness 47 → 54;
  5 mutations proved (M1 branch, M2a/b freshness, M3 text pin, M4 OQ6, M5
  budget sanitizer); lint + selftest 54 green. S6 next: provenance stamp._

- _2026-08-10 (S4, `writer`, branch `mission/compaction-continuity-p1`): added
  the §3 guardrail row + §4 reflex paragraph (four → five reflexes) identically
  in both `docs/WORKFLOW.md` and `templates/WORKFLOW.md` (pre-existing
  "required-but-unchecked"/"not-started" mirror wording drift left untouched,
  out of scope — flagged, not fixed); updated the plugin README's count/sentence
  to five. `hooks.json`'s handoff-budget description (written by S3) already
  named all four silencers and both bands — verified, not rewritten. Text-only
  session; no gates run (orchestrator's job). ckpt-p1 next._

- _2026-08-10 (S3, `backend`, branch `mission/compaction-continuity-p1`): shipped
  `hooks/lib/handoff-budget.sh` + its `UserPromptSubmit` registration (completion
  session — see Deviations for the infra failure). Inherited script kept
  unchanged: line-review + full-path dispatch found constants, four silencers,
  ≤3-line nudges and exit-0 paths all per brief; nothing to fix. Harness 35 →
  **47 green** (12 cases: both bands both directions, once-per-band, per-band ≤2,
  active vs completed ledger, fresh vs stale handoff, three failure paths,
  registration shape); 6 mutations (M1 below-band, M2 `-ge`→`-gt`, M3 marker, M4a/b
  `-nt` removed/inverted, M5 ledger exit) each caught only by new cases, base-35
  green under every one. Gates: lint clean · selftest 54. S4 next: docs only._

- _2026-08-10 S2 (`backend`, branch `mission/compaction-continuity-p1`): measured
  the compaction byte-point from the local corpus (48 files / 21,793,788 B stamped
  2026-08-10T04:30:59Z). Exactly **one** true compaction exists (`2fa752c7…`, line
  2551, **6,727,626 B** through the record; cross-checked via `compact_boundary`).
  n = 1, so per OQ2 the single point is the conservative floor; bands floored from
  it: **`ADVISORY_BYTES = 3,700,000`**, **`URGENT_BYTES = 5,380,000`**. OQ2 resolved
  in place; two deviations logged (corpus drift 87→48 + a brief anchor that no
  longer reproduces; prompt-vs-brief corpus scope — brief won). Diff: this ledger
  only. Gates untouched and green: lint clean · hook-test 35 · selftest 54. S3
  takes the constants **verbatim from the 📊 block** and carries its caveats 1–3._

- _2026-08-10 (S1, `backend`, branch `mission/compaction-continuity-p1`): extended
  `tools/hook-test.mjs` `runHook()` with `files:` (arbitrary staged files, explicit
  epoch-second mtimes via the ledgers' deterministic-mtime trick) and
  `transcript: {bytes|lines}` (sized plain-text file, abs path injected as
  `transcript_path`), plus a `command:` probe override for the two self-proof
  cases (see Deviations). Harness 33 → **35 green**, baseline case list diffed
  byte-for-byte unchanged. Mutations M1 files-skip / M2 mtime-skip / M3
  transcript-skip each fail exactly one new case with all 33 pre-change cases
  still green. `node tools/lint.mjs` clean; `context-attrib --selftest` 54 ok.
  S2 needs nothing from this code — it is measurement-only, ledger-only diff._

- _2026-08-03 (planning, `planner`, branch `plan/interactive-handoff`): mission
  shaped and decomposed — feature brief
  (`docs/product/decisions/2026-08-03-compaction-continuity-brief.md`) plus this
  trio. Working name `interactive-handoff` renamed to `compaction-continuity`
  (only two of three pieces are a handoff, and `handoff` already names three other
  things in this repo). Four phases, eleven sessions, two `[STRICT]` checkpoints.
  Phasing enforces L2 — the fallback never ships before the trigger. Verified
  `node tools/lint.mjs` green. **Nothing executed; blocked on OQ1–OQ7.**_

Next up: **S9** — phase-3 docs and the honest non-claim (branch
`mission/compaction-continuity-p3`, **Suits:** `writer`).
