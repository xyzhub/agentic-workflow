---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: owner-surfaces — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide. Planned 2026-10-16 on `plan/owner-surfaces` (base 66dc6af, plugin
v1.62.0). Scope = goal-statement **E2, part a** (brief L1); E2b is deferred
with a trigger (L1b)._

Source material (all under `docs/product/decisions/`, read-only):
`2026-10-16-owner-surfaces-brief.md` (J1–J4, NOT-in-v1, **L1–L4**),
`-platform-facts.md`, `-memos.md` (D1–D7), `-journeys.md` (states, copy, HIG
fixes), `-metrics.md` (runnable checks), `-counsel.md` (conditions, estimate).

Goal: every question the engine asks the owner leaves it as validated data in
one append-only log, one command prints mission state + pending questions as
versioned JSON, the status page is generated from that data with no hand
edits, and a real mission lease stops two sessions or machines from driving
one mission at once.

Estimate: **7 sessions** with `phases` — 4 builder briefs (S1–S4) + 3 one-shot
Fable checkpoints (ckpt-p1..p3). Correctives are counted when they fire, never
pre-booked. Justification per phase below (Locked decisions → Estimate).

## Tasks

1. **The question schema, its validator, and the plain gate-class words** (S1)
   - AC-1 New `plugins/agentic-workflow/templates/owner-surfaces.schema.json`
     (draft-07, the `distillate.schema.json` idiom) with `$defs` `question`,
     `event` and `state`; every emitted document carries `"schemaVersion": 1`
     (const). `question` requires all of: `schemaVersion`, `id`
     (pattern `^Q-[a-z0-9-]+-[0-9]+$`), `kind`
     (`gate|interview|scope|open-question`), `headline`, `changes`, `risk`
     `{level: low|medium|high, line}`, `estimate`, `recommended`, `options[]`
     (≥2; each `{id: ^opt-[a-z0-9-]+$, label, consequence}`), `evidence[]`
     (each `{label, url}`), `gateClass`, `instance`
     `{nonce: ^[0-9a-f]{8}$, bodySha, askedAt, expiresAt}`, `status`
     (`pending|recorded|picked-up|refused|expired|answered-in-chat`), `home`;
     `fireCommand` is required by `if/then` exactly when `gateClass` names an
     action class and forbidden otherwise; `additionalProperties: false`
     (strict emit). The schema's `description` states strict emit / tolerant
     read and the version rule (a removed, renamed or retyped field ⇒
     `schemaVersion` + 1, a minor plugin bump and a CHANGELOG line).
   - AC-2 A zero-dependency subset validator `validate(schema, doc) → string[]`
     exported from `tools/state.mjs`, supporting exactly the keywords the schema
     uses (`type`, `required`, `enum`, `const`, `properties`,
     `additionalProperties`, `items`, `minItems`, `maxLength`, `pattern`,
     `if`/`then`, `$ref` to `#/$defs/*`); an unsupported keyword in the schema
     throws (fail closed). Checks the schema cannot express run in code and
     are tested: `headline` ≤ 12 words, `recommended` ∈ option ids, option ids
     unique, `gateClass` ids exist in `gate-classes.md` (`+`-joined or `none`).
     The harness proves `if/then` on this validator (resolves D1's
     assumption).
   - AC-3 `templates/gate-classes.md` gains a `plain` column in both the
     change- and action-class tables (designer's wording, e.g.
     `schema-migrations` → "the database structure") plus one line for `none`
     ("Reversible — the workflow can undo this."); `readClasses()`
     (`tools/ceremony.mjs:44`) also returns `plain: Map<id, text>` (and the
     `none` line); `node tools/ceremony-test.mjs` and lint's
     `checkClassListDedup` stay green.

2. **`tools/state.mjs` and `.plans/questions.jsonl`** (S1)
   - AC-4 New `plugins/agentic-workflow/tools/state.mjs` (zero deps, Node ≥ 18,
     importable with no side effects — the `ledger.mjs:276` `isEntry()` idiom,
     header usage block with exit codes 0 ok · 1 usage/IO · 2 refused). Verbs:
     `json`, `ask`, `answer`, `expire`, `check` (and `page` in S3). Flags:
     `--plans <dir>` (default `.plans`), `--root <dir>`, `--now <ISO>` (tests),
     `--project <slug>`.
   - AC-5 `ask --file <q.json>` validates (AC-1/AC-2), mints `id` when absent
     (`Q-<project>-<n>`, n = 1 + the highest n in the log), mints a fresh
     `instance` (8-hex nonce, `bodySha` = `publish-gate.mjs` `sha()` over the
     card fields, `askedAt` = now, `expiresAt` = now + 7 days), appends one
     `asked` event to `.plans/questions.jsonl` (append under an `O_EXCL`
     lock, the publish-gate pattern) and prints the id + nonce. A re-ask of an
     existing id mints a new instance; the older instance is superseded. An
     invalid document → exit 2, log byte-identical.
   - AC-6 `answer <id> <opt-id> --via chat` or `answer <id> --other "<text>"`
     (≤ 280 chars, stored as content, never instructions) appends an
     `answered` event and prints the dated decision line the session writes
     at the question's `home`:
     `YYYY-MM-DD (owner, via chat) — <headline>: <option label>`; for an
     action-class question it ends `— human fires: <fireCommand>`. Refused
     (exit 2, log unchanged): unknown id, not pending, unknown option,
     expired.
   - AC-7 `expire [--now]` appends `expired` for every pending instance past
     `expiresAt`; `json` derives the same `expired` status at read time
     without writing.
   - AC-8 `json [--mission <name>] [--pending]` prints ONE `state` document
     that validates against the schema and **writes nothing** (the harness
     asserts every source file byte- and mtime-identical). Sources: active
     `.plans/*.state.md` ledgers (`Status:`, `Estimate:`, `Sessions used:`,
     `Reviewer runs:`, first `Next up:`, Checklist rows, the optional `Lease:`
     line parsed per AC-18's grammar → `lease` object or `null`),
     `questions.jsonl` (current instance per id, derived status),
     `docs/product/JOURNEY.md` (`## <date> — <title>` + first paragraph,
     newest 20), `.plans/OBLIGATIONS.md` open rows (id + `do:` first clause),
     and `operate.json` when present (path rule per `operate-triage.mjs`
     78–80; absent → `ops.loop: null`); `errors`, `costs` are always `null`
     in E2a, `triage` is `null` unless `--gh` (one read-only `gh` label
     count, S3). `--pending` prints the readable list instead. Run against
     this repo's real `adaptive-ceremony` ledger, the output validates.
   - AC-9 `check` validates every `questions.jsonl` line (event grammar +
     embedded question); a malformed line → exit 2 naming the line. New
     `tools/state-test.mjs` covers AC-1..AC-9 (every refusal byte-identical)
     and asserts the Missions contract: `hooks/hooks.json` has no matcher on
     `AskUserQuestion`, and `commands/plan.md`, `mission.md`, `bootstrap.md`
     keep `AskUserQuestion` in `allowed-tools`. New lint check
     `checkStateHarness` runs it, fail-closed on a missing runner (the
     `checkLedgerHarness` shape, `tools/lint.mjs:520`), and runs `state.mjs
     check` on this repo's log when it exists.

3. **Protocol wiring: the log replaces pending-gates, the interview emits data, the public interface** (S2)
   - AC-10 `templates/WORKFLOW.md` §12 inbound rule 3 is rewritten in place:
     the pending gate is appended to `.plans/questions.jsonl` with
     `tools/state.mjs ask` BEFORE the notification goes out; the decision
     carries the instance nonce (`G-<project>-…` per-project rule kept). §12
     gains at most one short paragraph pointing at
     `templates/owner-surfaces.md` (structured questions, JSON, the generated
     page). `.plans/pending-gates.md` is repointed everywhere it is named:
     `commands/operate.md:85`, `commands/doctor.md:58` (stale = expired and
     never answered, from `state.mjs json`), `README.md:211`,
     `templates/agents-registry.schema.json:4`. `grep -rn pending-gates
     plugins/` returns nothing. S2's WORKFLOW.md net delta ≤ +700 B.
   - AC-11 `commands/plan.md` §1 (interview) and §3 (approval): for each
     round, write the questions as JSON → `state.mjs ask --file` → the
     **unchanged** `AskUserQuestion` call with the same headline and option
     labels (the id is never put in the chip) → `state.mjs answer … --via
     chat` (or `--other`). Interview answers still land verbatim in the
     brief. `commands/mission.md` §1 (open questions) gets the same one-line
     rule (≤ +250 B). `AskUserQuestion` stays in every `allowed-tools`;
     nothing hooks it.
   - AC-12 New `templates/owner-surfaces.md` (valid template frontmatter,
     `owner-agent: planner`) — the public interface: schema path and version
     rule; `state.mjs` verbs, flags, exit codes; the `questions.jsonl` event
     grammar; the four Missions-contract invariants (no `AskUserQuestion`
     hook; `Estimate:` / `Sessions used:` / `Next up:` kept; `overview.html`
     kept at its path; `Lease:` purely additive); the fixtures path. S3 adds
     the generated-regions table, S4 the lease section. Never restates the
     gate-class list (lint `checkClassListDedup`).
   - AC-13 Golden fixtures `plugins/agentic-workflow/tools/fixtures/owner-surfaces/`:
     `state.json`, one question per `kind` (one an action-class gate carrying
     `fireCommand`), and a `questions.jsonl` with `asked` / `answered` /
     `expired` events — each validated by `state-test.mjs`.

4. **The generated status page** (S3)
   - AC-14 `state.mjs page [--out <file>] [--check] [--gh]` rewrites, from the
     `state` document, the regions `data:meta` (stage badge, "Updated <time>
     from <source>", version), `data:now` ("Happening now" + "Asked of you" +
     lease holder), `data:stages` ("Mission progress" rail from the ledger
     Checklist), a new `data:ops`, and `data:timeline` ("Journey", ≤ 20), plus
     a `<script type="application/json" id="aw-state">` island holding the
     state document. `data:pillars` and a `data:owner-todos` region are left
     untouched and labelled `<!-- hand-edited: chronicler -->` in source. No
     executable script is emitted. Every data string is HTML-escaped (`<`,
     `&`, quotes; `</script` inside the island is neutralised). Output is a
     pure function of the state document; `--check` re-renders using the
     island's own `generatedAt` and exits 0 iff the generated regions match
     the file, else 1 naming the region.
   - AC-15 `templates/overview.html` rewritten: region + island markers in the
     D3 order (header, Happening now, Asked of you, Mission progress, Ops,
     Journey); the question card shows the eight fields plus the gate class
     in plain words (from AC-3's `plain` column: `none` → "Reversible…";
     change class → "Touches <plain>; a reviewer checks it before it lands.";
     action class → "You fire this yourself — the page records your
     decision; nothing ships from here."); E2a state copy (no pending,
     pending → "Answer this in your Claude Code session, where it was asked.",
     expired, answered in chat) from the journeys file; ops errors/costs and
     un-fetched triage render "Not measured yet — the operating loop hasn't
     recorded numbers." HIG/contrast fixes: `--ink-faint` → `#8a8dab`; every
     label ≥ 12px and client-read labels 13px; body/card text 15–17px; risk
     and status carry a word + shape, never colour only;
     `prefers-reduced-motion` stops the pulse. File ≤ 24,000 B.
   - AC-16 J4 mechanical proxy in `state-test.mjs`: every rendered question
     card carries the eight fields + a gate-class line, and the deny-set
     (`OB-\d`, `LD-\d`, `AC-\d`, `ckpt`, `HITL`, `S\d+-fix`) never appears in
     rendered text outside evidence `href`s. (The proxy is not a
     client-readiness claim — L4.)
   - AC-17 This repo's `docs/product/overview.html` is migrated once (the new
     regions/island/labels/CSS, `artifact-url` comment kept) and regenerated
     with `state.mjs page`; `node plugins/agentic-workflow/tools/state.mjs
     page --check` exits 0. `agents/chronicler.md` "Artifact 3" is rewritten:
     the chronicler runs `state.mjs page`, owns only the labelled hand
     regions and the JOURNEY prose the timeline is generated from, and never
     hand-edits a generated region (net ≤ +200 B). `commands/mission.md` §4's
     republish line names `state.mjs page` (≤ +60 B).
     `templates/owner-surfaces.md` gains the region-ownership table.

5. **The real mission lease (L2)** (S4)
   - AC-18 `ledger.mjs <mission> lease take|renew|release [--force "<reason>"]
     [--now <ISO>]`. Authority: the remote branch `lease/<mission>` on
     `origin`, one file `LEASE` holding the line; compare-and-swap = a
     fast-forward push of a commit built with `git commit-tree -p <fetched
     origin tip>` (no parent only when the ref is absent on origin), pushed
     with a plain `git push` — never `--force` — so every renew/take after the
     first is a fast-forward (the working tree and HEAD are never touched). Token: 8 hex minted at `take`, kept at
     `$(git rev-parse --git-dir)/aw-lease/<mission>` (per worktree, never
     committed). The ledger carries a mirror line, written and committed only
     after a successful push:
     `Lease: <host> · <key8> · until <ISO> · taken <ISO>` (`key8` = first 8
     hex of sha256(token); the token itself never leaves the machine). TTL
     4 h.
   - AC-19 Lease verbs refuse `--no-push` (exit 2) and always fetch, commit
     and push. A lost race (push rejected) resets the local `lease/<mission>`
     ref to the fetched origin tip, leaves HEAD, the working tree and the
     ledger byte-identical, and exits 2 "lost the lease race to <host>".
   - AC-20 Every `ledger.mjs` write verb refuses (exit 2, file byte-identical)
     when the lease ref holds an unexpired lease whose key ≠ this worktree's
     token key: with `--commit` the ref is fetched first, and a fetch failure
     while the ledger carries a `Lease:` line refuses ("cannot verify the
     lease"); without `--commit` the last-fetched ref is read. No lease ref and
     no `Lease:` line → today's behaviour (legacy missions untouched). A
     holder's `--commit` beat renews when less than half the TTL remains.
   - AC-21 Takeover: an expired lease is taken and the take writes the
     handoff line "took over from <host> (expired <time>)". An unexpired one
     needs `--force "<reason>"`, accepted only when stdin is a TTY (else exit
     2 "lease --force is owner-only: run it in your own terminal"), and logs a
     `## Deviations` line + a handoff line. The `git/gh guardrails`
     PreToolUse hook blocks (exit 2) an agent Bash command containing
     `ledger.mjs`, `lease` and `--force`; `templates/codex.rules` "WHAT IS NOT
     HERE" names the TTY check as the Codex-side mechanism (prefix tokens
     cannot match a variable mission name). `release` by the holder deletes
     the ref with `--force-with-lease=<ref>:<expected-sha>`; by a non-holder
     it refuses.
   - AC-22 Two-clone race selftest in `tools/ledger-test.mjs` (a temp bare
     origin + clones A and B, no network): 5 rounds of parallel `take`, the
     lease cleared between rounds (the winner `release`s, or the next round
     runs with `--now` past `expiresAt`) — each round exactly one exits 0 and
     keeps the lease, the loser exits 2 with
     HEAD + working tree unchanged and its local lease ref = origin's; held
     → refused "held by <host> until <time>"; expired → takeover + handoff
     line; a non-holder `mark --commit` refused; `--no-push` refused;
     `--force` without a TTY refused; release by holder / non-holder.
     `tools/hook-test.mjs` gains the `--force` guard cases (blocked; a plain
     `lease take` passes).
   - AC-23 `templates/WORKFLOW.md` §5 "Hand-off across machines and sessions"
     replaces "one driver per mission at a time — hand off by pushing" with
     the lease rule (take at start/`continue`, a refusal means read-only,
     release at hand-off and close) — ≤ +400 B. `commands/mission.md` §4 /
     §5: `continue`/`run` takes the lease, a refusal reports "held by …" and
     stops driving; close releases (≤ +290 B). `templates/owner-surfaces.md`
     gains the lease section. `state.mjs json` + the page show the holder.

6. **Release and records** (S4)
   - AC-24 `plugins/agentic-workflow/.claude-plugin/plugin.json` → `1.63.0`;
     `CHANGELOG.md` `## [1.63.0] — <date>` (Added: schema, `state.mjs`,
     question log, generated page, lease; Changed: §12 rule 3, §5 hand-off,
     plan interview, chronicler; Removed: `pending-gates.md`); README tools
     list gains `tools/state.mjs` and the `.plans/` tree line names
     `questions.jsonl`; `docs/WORKFLOW.md` re-synced from the template the
     `/sync` way at stamp `v1.63.0` (§10–§10.2 + Local amendments preserved,
     diff outside them empty). `node tools/lint.mjs` clean;
     `templates/WORKFLOW.md` ≤ 114,492 B and `commands/mission.md` ≤ 23,327 B
     (byte plan below); `claude --plugin-dir plugins/agentic-workflow` loads.
   - AC-25 `.plans/OBLIGATIONS.md` OB-30 is extended in place with the
     Missions adoption of the fixtures (contract test validating
     `tools/fixtures/owner-surfaces/*` against the schema + reading
     `state.mjs json` instead of scraping the ledger; estimate ≈ 1 Missions
     session) — the row's grammar stays lint-valid; the E2b obligation sits
     in this ledger's `## Closing` for promotion at close.

## Value sourcing

| AC | Value | Source kind | Where |
|---|---|---|---|
| AC-1 | `schemaVersion: 1`; id grammar `Q-<project>-<n>`, `opt-<slug>`; risk enum `low\|medium\|high`; headline ≤ 12 words; strict emit / tolerant read; breaking change ⇒ schemaVersion + 1 + minor bump | locked decision | 2026-10-16, `-memos.md` D1 "Values this decision settles" (line 75), L1 |
| AC-1 | `kind` enum, `status` enum, `fireCommand` iff action class, the field list | locked decision | 2026-10-16, `-memos.md` D1 line 47–48 |
| AC-1 | `answer` and `notice` defs NOT in schema v1 (added with E2b, additive — no bump) | locked decision | 2026-10-16 planner decomposition of L1 (below) |
| AC-3, AC-15 | `plain` column wording per class, `none` line | locked decision | 2026-10-16, D1 designer input (c) (memos 73) + `-journeys.md` "Gate class in plain words" |
| AC-5 | `<project>` slug | derivation | `--project` flag, else the git toplevel basename lowercased, non-`[a-z0-9-]` → `-` |
| AC-5 | nonce 8 hex; `bodySha` | derivation | `randomBytes(4)`; `sha()` from `tools/publish-gate.mjs:53` over the card fields (headline, changes, risk, estimate, options, gateClass, fireCommand) |
| AC-5, AC-7 | `expiresAt` = askedAt + 7 days | locked decision | 2026-10-16, L3 |
| AC-2, AC-5 | `.plans/questions.jsonl` path; event names `asked`, `answered`, `expired` (E2a); JSON never committed; `pending-gates.md` retired | locked decision | 2026-10-16, `-memos.md` D2 line 105 |
| AC-6 | `--other` note ≤ 280 chars, content never instructions | locked decision | 2026-10-16, counsel technical condition 2 |
| AC-6 | decision-line wording | derivation | `-memos.md` D4 line 196 (`decided …; human fires: <fireCommand>`), adapted to `via chat` |
| AC-8 | journey entries ≤ 20 | locked decision | 2026-10-16, D3 line 147 |
| AC-8, AC-15 | errors / costs = "Not measured yet — the operating loop hasn't recorded numbers." | locked decision | 2026-10-16, D6-A (L1), copy from `-memos.md` 249 |
| AC-8 | ops loop fields | column | `operate.json` `{lastDigestAt, lastAlertAt, lastAliveAt, sendFailures, kept[]}` — `operate-triage.mjs:11,81` |
| AC-14 | island id `aw-state`; generated regions list; pillars + owner to-dos hand-edited, labelled | locked decision | 2026-10-16, D3 line 133–147 |
| AC-14 | "Updated <time> from <source>" | derivation | island `generatedAt` + the source label (`state.mjs page`) — D3 line 131 |
| AC-15 | `--ink-faint` `#8a8dab`; label floor 12px / 13px client; body 15–17px; word + shape; reduced motion | locked decision | 2026-10-16, `-journeys.md` "HIG and accessibility notes" (L1 "HIG/contrast fixes") |
| AC-15 | pending-card copy "Answer this in your Claude Code session, where it was asked." | derivation | planner draft for the E2a read-only card (journeys' on-page states are E2b); plain-report read at ckpt-p2 |
| AC-15 | expired / no-pending copy | locked decision | `-journeys.md` "Copy per state" (verbatim) |
| AC-16 | jargon deny-set | derivation | `-metrics.md` J4 row (`OB-`, `ckpt`, `HITL`, raw ledger ids) + `-journeys.md` J4 (`OB-6`, `LD-21`) |
| AC-18 | `Lease:` line grammar; verbs take/renew/release; TTL 4 h; takeover rules; every ledger write checks the lease | locked decision | 2026-10-16, `-memos.md` D5 line 232 + L2 |
| AC-18 | authority ref `lease/<mission>`, token stored in the git dir, `key8` in the line | locked decision | 2026-10-16 planner decomposition of L2 (Assumed, OQ-1) |
| AC-20 | renew when < half the TTL (2 h) remains | derivation | TTL 4 h (L2) ÷ 2 — keeps one extra push per ~2 h, not per beat |
| AC-15 | "answered in chat" card copy "Answered in chat <time>: <option label>. Logged as a decision on <date>." | derivation | planner draft (journeys' copy table has no chat state; modelled on its "Picked up" row); plain-report read at ckpt-p2 |
| AC-15 | `templates/overview.html` ≤ 24,000 B | derivation | D3 estimate "template grows ~13 → ~22 KB" (`-memos.md` 118) + ~2 KB margin; equals the command BUDGET (`tools/lint.mjs:976`) |
| AC-21 | `--force` refusal text "lease --force is owner-only: run it in your own terminal" | derivation | planner draft from L2 "owner-only"; plain-report read at ckpt-p3 |
| AC-22 | 5 race rounds | derivation | planner choice: enough repeats to catch a non-deterministic double-win cheaply (each round ≈ 2 git pushes to a local bare repo) |
| AC-24 | version `1.63.0` | derivation | next minor after 1.62.0 (`plugin.json`); the rebrand mission ships 2.0.0 and needs no 1.63.0 (`plan/xyz-rebrand` L1) |
| AC-24 | byte ceilings 120,000 / 24,000 | column | `tools/lint.mjs:975–978` BUDGETS |

## Locked decisions

- 2026-10-16 (owner, **L1** — "Split: E2a now, E2b later") — this mission is
  E2a: D1 schema + validator + `plain` column; D2 `.plans/questions.jsonl`
  replacing `pending-gates.md` and `state.mjs` JSON; the `/plan` interview
  emitting structured questions beside the unchanged `AskUserQuestion`; the
  generated status page (D3, static data island, no on-page answering); the
  designer's HIG/contrast fixes; ops rows "Not measured yet" (D6-A); the
  lease (L2). Brief lines 63–72.
- 2026-10-16 (owner, **L1b**) — E2b deferred, dated, with a trigger: deciding
  on the page (D4 with counsel conditions 1–4), the `/operate` ops notice
  (D6-B), client-ready polish. Trigger: a client demo or engagement is
  booked. Recorded as a `## Closing` row promoted at close.
- 2026-10-16 (owner, **L2** — "Real lease, re-specified") — loser undoes its
  own local commit; lease verbs refuse `--no-push`; the lease binds the
  mission, not a branch; `--force` takeover of an unexpired lease is
  owner-only and logged; a two-clone race selftest proves exactly one side
  keeps it; TTL 4 h (D5).
- 2026-10-16 (owner, **L3** — "7 days; Missions = sample data") — questions
  expire after 7 days; Missions gets fixtures + a public-interface doc only,
  no Missions code (D7); Missions adopts them in its own session.
- 2026-10-16 (owner, **L4** — "No date yet") — client-facing outcomes stay "no
  claim" until a demo exists.
- 2026-10-16 (owner, posture) — next mission, careful: Fable plan-judge and
  Fable checkpoints; the human merges to `main`; byte deltas computed in the
  plan (counsel condition 5 — below).
- 2026-10-16 (planner, decomposition of L1 "static data island") — no
  executable script ships in E2a: the viewer badge (`user.isOwner()`) and
  the `db` overlay belong to on-page answering and land with E2b. The
  schema's `answer` and `notice` defs land with E2b too (additive, no
  `schemaVersion` bump); the E2a `event` def carries `asked`, `answered`,
  `expired`.
- Assumed 2026-10-16, ratified 2026-10-16 (owner: "Approve") — OQ-1 (lease shape); built on: authority =
  remote branch `lease/<mission>` (one ref per mission, so two sessions on
  different branches still collide — the only reading of "binds the mission,
  not a branch" that a git push can enforce); token kept in the worktree's
  git dir, the ledger/ref show only `key8` (D5's "token in
  session-handoff.md" would hand the token to any machine that pulls,
  defeating the lease); authorized by the orchestrator's mission brief.
  Ratify or reverse by editing this line in place to `ratified <date>`.
- Verified 2026-10-16 (plan-judge, Fable) — Claude Code's Bash tool runs
  commands with a non-TTY stdin, so the `--force` TTY check separates the
  owner's terminal from an agent. S4 step 1 re-confirms it (not a gate).
- 2026-10-16 (planner, branches) — **one branch `mission/owner-surfaces`**,
  cut from `plan/owner-surfaces` (which carries the decision records and
  this trio), carries all three phases; each phase ends in its own one-shot
  Fable checkpoint on that branch (an APPROVE advances, it opens no PR); one
  feature PR to `main` opens as a draft after ckpt-p1 and is marked ready
  after ckpt-p3; the human merges. Plus ONE `chore/owner-surfaces-bookkeeping`
  PR for the post-merge Closing rows (agent may merge, §10 `records-only`).
  Target version **1.63.0**.
- 2026-10-16 (planner, **Estimate: 7**) — P1 = S1 + S2 + ckpt-p1 (3): S1 is
  ~900 lines of new code (schema ~150, validator ~120, `state.mjs` ~350,
  harness ~280) — the counsel's corrected gatehouse-asks anchor (4 sessions
  for ~1,100 lines) says it does not also fit the protocol prose, so S2
  carries the prose, the public interface and the fixtures. P2 = S3 +
  ckpt-p2 (2): renderer + template rewrite + this repo's page. P3 = S4 +
  ckpt-p3 (2): the lease (counsel's "+1") + release. Counsel: "E2a ≈ 3 + ~1"
  builder sessions = 4 briefs; checkpoints count per §5 LA-1. Overrun stop at
  k ≥ 11 (1.5 × 7). Subset fallbacks in value order: P1 + P2 (5) ship the
  data spine and the generated page without the lease (L2 unmet — owner's
  call at the stop); P1 alone (3) ships the schema, the log, the JSON and the
  interview emission.
- 2026-10-16 (planner, **byte plan** — counsel condition 5). Measured
  2026-10-16: `templates/WORKFLOW.md` 113,392 B / 120,000 (headroom 6,608);
  `commands/mission.md` 22,727 B / 24,000 (headroom 1,273); §12 today =
  4,446 B (lines 1175–1243).

  | File | Now (B) | S2 | S3 | S4 | Cap after | Headroom left |
  |---|---|---|---|---|---|---|
  | `templates/WORKFLOW.md` | 113,392 | ≤ +700 (§12) | 0 | ≤ +400 (§5) | ≤ 114,492 | ≥ 5,508 (95.4%, warn band as today) |
  | `commands/mission.md` | 22,727 | ≤ +250 (§1) | ≤ +60 (§4) | ≤ +290 (§4/§5) | ≤ 23,327 | ≥ 673 (97.2%) |
  | `commands/plan.md` | 5,188 | ≤ +900 | — | — | ≤ 6,088 | ≥ 17,912 |
  | `agents/chronicler.md` | 9,087 | — | ≤ +200 | — | ≤ 9,287 | ≥ 6,713 |
  | `commands/operate.md` / `doctor.md` | 15,249 / 9,944 | ≤ +100 each | — | — | — | ≥ 8,651 / ≥ 13,956 |

  Detail lives in `templates/owner-surfaces.md` (no ceiling beyond lint's
  template rules), never in WORKFLOW.md or mission.md.
- Ceremony (2026-10-16, `ceremony.mjs effective` from the installed 1.62.0):
  this repo's profile is `proposed` → plan-judge, phase-reviewer,
  staging-verify, chronicler, mission-close all `required`. Every checkpoint
  is **Fable**: each phase diff touches `tools/` / `templates/` (and P3
  `hooks.json`) — `security-boundary` in `templates/gate-classes.md:32` — and
  the ledger write path.

## Risks

- **Lease false refusals block every beat** (AC-20 is a brake on the one tool
  all beats use). → no lease ref + no `Lease:` line = today's behaviour; the
  refusal names the holder and expiry; expired leases are takeable; the
  race selftest and the legacy-ledger cases run in lint.
- **Network per beat** — `--commit` beats already push; the lease adds one
  fetch, and a renewal push at most every ~2 h. Offline → refused only when a
  `Lease:` line exists (offline work cannot push its beats either — D5).
- **Two sessions in one worktree share the token file** — the lease binds a
  worktree/clone, not a process. Stated in `owner-surfaces.md`; two sessions
  in one worktree already trample each other's files and are outside §5.
- **`lease/<mission>` remote branches pile up** if a mission never releases.
  → close releases (AC-23); the `branch + worktree cleanup` Closing row
  probes `git ls-remote origin 'refs/heads/lease/*'`.
- **Missions contract** — Missions' contract test pins `AskUserQuestion` in
  frontmatter and no hook on it, the three ledger lines, and
  `overview.html`'s path (`-memos.md` line 31). → AC-9 asserts all of them in
  this repo's gate; `Lease:` is additive.
- **Byte budgets** — mission.md ends ≤ 673 B from its ceiling. → the byte
  plan above is per brief; lint fails over the ceiling; prose detail goes to
  `templates/owner-surfaces.md`.
- **Page republish lag** — the page is only as fresh as the last
  `state.mjs page` + publish. → "Updated <time> from <source>" header (D3).
- **HTML injection through data** — ledger text, journey prose and question
  fields are rendered into the page. → AC-14 escaping + a harness case with
  `<script>`/`</script` in a field.
- **Codex `--force` gap** — `prefix_rule` cannot match a variable mission
  name and Codex may run commands under a PTY; Codex is not live on this
  repo (memory: codex runtime unavailable). → named in `codex.rules`; the
  hook guards Claude.
- **The rebrand plan** (`plan/xyz-rebrand`, PR #152) was written when no
  1.63.0 existed; it ships 2.0.0 after this mission, so its replan only
  rebases on 1.63.0.
- **Long lines** — lint `checkObfuscation` fails a tracked `.mjs` line over
  1,000 chars; keep fixtures and template strings split.

## Open questions

- **OQ-1 (non-blocking — Assumed above)** — the lease's shape where L2 left it
  open: authority on a remote branch `lease/<mission>` + token kept on the
  machine (only a short key in the ledger), instead of D5's "token in the
  ledger/handoff". **Recommendation: ratify** — it is the only form in which
  two sessions on different branches or machines collide, and a pulled
  handoff never carries a usable token. Reverse → the lease becomes
  branch-scoped (counsel's weaker "same-branch rule").

---
_The `.plans/owner-surfaces.sessions.md` briefs execute these tasks;
`.plans/owner-surfaces.state.md` tracks progress. Resolve every open question
before execution starts._
