---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: context-economy — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a fresh
agent resumes the mission from this file alone. Write-ahead — update it before ending a
session._

Gate policy: **batch** (D3, recorded at mission start) — each phase branch
`mission/context-economy-p0…p4` merges into **`mission/context-economy-integration`**
by the orchestrator on reviewer APPROVE; **never the default branch**. The human merges
the integration branch **once**, at the end-of-mission confirmation.

**Surfacing under batch:** the human sees no merge prompts until the end. Therefore the
**`ckpt-p3` [STRICT] verdict must be pushed to the human the moment it lands** (owner
channel / direct report), not held for the final PR. Same for any REQUEST CHANGES and
for the D1 pause package.

**UNBLOCKED — OQ1–OQ5 all RESOLVED 2026-08-01** (human accepted every planner
recommendation; details in `## Open questions`). Execution may begin at S1.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]` done
(verified, not merely written). The beat-enforcer nudges only on a not-started `[ ]`
checkpoint/reviewer/chronicler row — set `[~]` the moment a beat is picked up or parked._

- [x] S1 — doc-defect sweep: kill "fresh context per tick" (branch `mission/context-economy-p0`)
- [x] S2 — build `tools/context-attrib.mjs` + `--selftest` + lint delegation (branch `mission/context-economy-p0`)
- [ ] S3 — run the baseline measurement, record split + D9 table + sanity check (branch `mission/context-economy-p0`)
- [ ] Checkpoint `ckpt-p0` — phase 0 review + merge into `mission/context-economy-integration`
- [ ] ⛔ **D1 HARD PAUSE — mission STOPS. Human re-scopes P1–P4 with the real numbers before any later phase is spawned. Do not proceed on agent judgment.**
- [ ] S4 — write firewall: extend the 30% rule to writes; no tool-list change anywhere, per D7 (branch `mission/context-economy-p1`)
- [ ] Checkpoint `ckpt-p1` — phase 1 review + merge into integration
- [ ] S5 — standing steers: ledger block + §3-only append + lint grammar check (branch `mission/context-economy-p2`)
- [ ] Checkpoint `ckpt-p2` — phase 2 review + merge into integration
- [ ] S6 — `SessionStart:compact` re-read directive + hook-test cases (branch `mission/context-economy-p3`)
- [ ] Checkpoint `ckpt-p3` **[STRICT]** — phase 3 review; **surface the verdict to the human immediately** (batch gating shows no merge prompt); merge into integration
- [ ] S7 — re-measure (D4a), `isCompactSummary` count, `docs/product/engineering/context-economy-metrics.md` (branch `mission/context-economy-p4`)
- [ ] S8 — chronicler + CHANGELOG + version bump + integration PR (branch `mission/context-economy-p4`)
- [ ] Checkpoint `ckpt-p4` — final review of `main..mission/context-economy-integration`; **human merges once**
- [~] D4b — cross-mission re-measurement on a later comparable mission (deferred, non-blocking, tracked)

## Open questions

_All RESOLVED 2026-08-01 — the human accepted every recommendation. Locked below._

- **OQ1 — RESOLVED (yes).** Fix this repo's own `docs/WORKFLOW.md` mirror sites
  (L19-21, L275-281, L645-648) in the same P0a commit; **do not touch the version stamp**.
- **OQ2 — RESOLVED (yes, in-repo only).** Correct the launch copy (`hacker-news.md:48`,
  `dev-to.md:72`, `positioning.md:70`). **No erratum and no re-publication** — verified
  2026-08-01 that `publish-log.md` is empty: this copy was never fired outward, so it is
  unpublished draft material and a plain correction is sufficient.
- **OQ3 — RESOLVED (add the contract).** PR bodies are NOT currently in `chronicler.md`'s
  contract — it names exactly three artifacts (D7's brief wording "already its contract"
  was factually wrong for PR bodies). P1 adds them as a **one-line contract addition**;
  **no tool-list change**. Use `gh pr create --body-file`.
- **OQ4 — RESOLVED.** The P2 lint grammar check validates **only ledgers that already
  carry a `## Standing steers` block** (three legacy ledgers have none and must not fail),
  and separately **requires the block in `templates/mission-state.md`**.
- **OQ5 — RESOLVED.** D4a reports the authored-Write **share (%)** delta with the
  comparability caveat stated explicitly (this mission is ~8 sessions of contract text vs.
  the 9-session baseline of template authoring); **D4b remains the real confirmation**.

## Standing steers

_Human steers captured **verbatim** at checkpoints only, never mid-brief. Grammar:_
`- YYYY-MM-DD (ckpt <id>) — "<exact words>"`. _Retire by ~~strikethrough~~, never delete.
(Convention ships in P2; usable here from mission start.)_

(none)

## Deviations

_Any departure from a brief — logged here the moment it happens, with why. Deviating is
allowed; deviating silently is not (§4)._

- 2026-08-01 (S2) — D9 is emitted **unconditionally**, not behind "one flag on the script"
  (brief L107). It is a required Phase-0 output, so a flag only adds a way for S3 to forget
  it. No other CLI form exists beyond `<transcript.jsonl>` and `--selftest`.
- 2026-08-01 (S2) — three modeling choices the brief left open, all printed by the tool so
  S3/the reviewer can re-derive them: (a) TOTAL = Σ prompt-delta over unique requestIds
  (context *occupancy*), not Σ per-line usage; (b) the **first** window is excluded from the
  chars/token calibration — prompt_0 is system prompt + tool defs + CLAUDE.md, which never
  appear in the transcript; its tokens still count in TOTAL and land in UNATTRIBUTED, broken
  out as "session preamble"; (c) tool inputs that are neither Write/Edit nor Bash (Read,
  Grep, **Agent spawn prompts**) are left in UNATTRIBUTED rather than smeared into a named
  category — the residual-composition breakdown names them, and the D9 table sizes the Agent
  slice separately (so D9 spawn chars are a cross-cut, not a tenth category).

- 2026-08-01 (S1) — routed to `backend` rather than the brief's "main session / writer":
  the session's own verify gate needs Bash (`node tools/lint.mjs`), which the `writer`
  agent does not have. No change to the work itself.

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and what the
next session needs. Newest on top; crash-safe by write-ahead._

- _2026-08-01 S2 (`backend`, branch `mission/context-economy-p0`): built
  `tools/context-attrib.mjs` — zero-dep, `readline`-streamed (never loads or prints
  transcript content) — plus a 15-case `--selftest` over a synthetic fixture in a throwaway
  tmpdir, and fail-closed `checkContextAttrib()` in `tools/lint.mjs` (shape of
  `checkMarkerMutation`; `--selftest` only, never a real transcript). All four landmines
  covered (usage deduped by `requestId`; UNATTRIBUTED printed, never redistributed;
  chars/token DERIVED per transcript, no `/4`; attachments sized on the injected field) and
  the D9 per-`subagent_type` table is always emitted with a reviewer >3% → reopen-D7 callout.
  Verified: `--selftest` exit 0 (15 ok); `node tools/lint.mjs` clean; NEGATIVE CHECK — script
  moved away ⇒ lint FAILS "context-attribution harness missing", restored ⇒ clean. S3: run
  `node tools/context-attrib.mjs <transcript.jsonl>` (only two invocation forms exist, that
  and `--selftest`; D9 needs no flag) and read the printed table — never the transcript._

- _2026-08-01 S1 (`backend`, branch `mission/context-economy-p0`): corrected the false
  "fresh context per tick" claim at all 12 sites with one consistent wording — `/loop` is
  session-scoped, ticks accrete in the same transcript, genuine fresh context needs
  `/clear` / new session / scripted `claude -p`; what makes loop mode safe is that state
  lives in files. Sites: `commands/mission.md`, `commands/autopilot.md`, plugin `README.md`,
  `templates/WORKFLOW.md` ×3, `docs/WORKFLOW.md` ×3 (OQ1, version stamp untouched), launch
  copy ×3 (OQ2, plain correction). One extra site fixed beyond the brief:
  `docs/product/features/orchestrator-governance/idea.md:45` ("fresh context each turn" →
  "re-injected every turn"), covered by the brief's turn-end exit criterion. Verified:
  `node tools/lint.mjs` clean + full `fresh context` grep sweep — every surviving hit is a
  reviewer/subagent reference or the new corrective text. Next: S2 builds
  `tools/context-attrib.mjs` on the same branch._

- _2026-08-01 planning: trio authored on `plan/orchestrator-context-economy` from the
  2026-08-01 brief (D1–D9 locked, not re-opened). 8 sessions / 5 phases / 5 checkpoints.
  Baseline transcript identified and field-verified by grep (never read). Uncommitted,
  awaiting HITL review of OQ1–OQ5._

Next up: **S3 — run the baseline measurement, record split + D9 table + sanity check**
(same branch `mission/context-economy-p0`). The instrument is built and gated; S3 only runs
`node tools/context-attrib.mjs <transcript.jsonl>` and records the numbers — it must NEVER
`Read` the transcript itself. OQ1–OQ5 are all
RESOLVED; execution is unblocked. Resume with `/agentic-workflow:mission "context-economy" continue`
in a FRESH session (deliberate: starting a context-economy mission inside a 400k-token
session is the anti-pattern it exists to fix). Phase 0 ends
at `ckpt-p0` and then **STOPS at the D1 HARD PAUSE** — S4 and everything after it are not
authorized until the human re-scopes with the measured numbers in hand.
