---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: publish-approval — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide._

Converted from `docs/product/decisions/2026-10-06-launch-media-brief.md`
("## Locked decisions" L1/L2 and "### Mission 1"), 2026-10-06. Design source:
`docs/product/decisions/2026-10-06-launch-media-memos.md` Memo 3 (+ facts F2,
F4, F5, Memo 10); journeys section C; metrics section 1.C and §3; counsel brief
in `docs/product/decision-log.md` (convergent findings 1, 4 and 5 are binding
amendments). The source files are untouched.

Goal: a queue item fires only for the exact body a human approved — hash-pinned,
epoch-bound, claimed once — enforced by a zero-dep gate tool in both runtimes and
by a fail-closed Bash hook in Claude; a tampered approved body is refused with
the log line the metrics doc specifies.

Estimate: 1 session — ONE brief (S1) + ONE one-shot Fable review at the
checkpoint, staging → verify → PR. No `phases`. A corrective `S1-fix` is counted
only when it fires, never pre-booked. The ledger mirrors this as
`Estimate: 1 session`; a rise is a dated locked decision, never a silent edit.
Fit note: S1 is at the upper bound of one brief (19 files — 3 new + 16 edited,
~400 new lines of code, 13 new harness rows); it is still one surface with one
reviewer, and L1 locks "each one session", so it is not split. To keep one
session honest the brief carries an explicit **cut list** (no `outcome …
failed` verb — a connector error is `unknown` and the human reconciles; no
`status --json`; no dead-run age clock in `reconcile`) and an **order rule**:
steps 1–4 (tool, hook, harness, lint row) green before any prose; the agent
prompts (step 7) and the `codex.rules` sentence are the first to land in an
`S1-fix` if the session runs long.

Target version: 1.52.0 (`plugins/agentic-workflow/.claude-plugin/plugin.json`,
the §10 Version pin; protocol-master stamp in `docs/WORKFLOW.md` line 3).

Paired metric (house rule, metrics doc §3): **hash-gate strictness** is paired
with **false refusals** — a benign edit (whitespace, a typo fix the owner did not
mean as a content change) that resets an approval. Observed from the `reset`
events in `docs/product/launch/publish-claims.jsonl`, reviewed at each
`/agentic-workflow:operate` for refusals where the human changed nothing material.
Baseline: 0 refusals (mechanism absent; metrics doc §0).

## Tasks

1. **Gate tool `plugins/agentic-workflow/tools/publish-gate.mjs`** — zero-dep
   Node ≥ 18, the runtime-agnostic enforcement point (Memo 3 option C). Verbs:
   `stamp`, `approve <id>`, `claim <id>`, `dispatch <token>`,
   `outcome <token> delivered|unknown`, `reconcile <id> --delivered <url>
   | --cancel`, `status`, `--selftest`. Paths (`--queue`, `--claims`,
   `--workflow`) default relative to `git rev-parse --show-toplevel` with cwd
   fallback — the same contract as the hook. Acceptance: (a) hash = sha256 of
   the `### <id>` body section with the heading excluded, CRLF→LF, trailing
   whitespace per line and trailing blank lines trimmed — the selftest asserts a
   precomputed digest for a fixed body and that a CRLF copy hashes identically;
   (b) `stamp` on a queue in the OLD 7-column shape rewrites the header to the
   12 columns, fills `kind: post`, `body-sha256`, `epoch: 1`, leaves `state`
   unchanged, and is idempotent (second run = no diff); (c) `claim` refuses
   tampered body, stale epoch, double claim, outreach, paid-without-confirm,
   not-due, no-pin, unknown-outcome rows — each with exit 2 and the reason text
   in the sessions brief, and the tampered/stale cases reset the row to `draft`,
   bump `epoch`, clear `approved-for`, append a `reset` event, and print
   `publish run: REFUSED <id> approved@<hash8>/e<n>, current <hash8>/e<m> -> reset to draft`;
   (d) a successful `claim` writes `claim: <token8> claimed <UTC>`, state
   `claimed`, appends a `claimed` event carrying `kind` and `id`, and prints
   `PUBLISH_CLAIM=<token8>` as the LAST stdout line; (e) `unknown` is terminal
   until `reconcile`; (f) every write is temp-file + rename, and an unparseable
   queue exits 4 with the line number, writing nothing; (g) `node … --selftest`
   ends `publish-gate selftest: clean` and `tools/lint.mjs` row 10.8 runs it
   fail-closed (same shape as `checkCiWaitSelftest`).
2. **Hook `hooks/lib/publish-guard.sh` + `hooks.json` row** — the §3 inline
   "publishing guardrail" command moves to lib (PR #87 precedent) with the L2
   amendments. Acceptance: paid regex keeps `ads-api\.|googleads|adaccounts|/act_[0-9]+/|/ads/`
   and adds `api\.elevenlabs\.io|api\.x\.com`, blocked (exit 2) without the
   literal `PAID_CONFIRMED_BY_HUMAN`; publish-host regex keeps the current hosts
   and adds the email hosts `api\.sendgrid\.com|api\.postmarkapp\.com|api\.resend\.com|api\.mailgun\.net|api\.convertkit\.com|api\.brevo\.com|smtps?://`
   and the bare mailer binaries `sendmail|msmtp|mailx|mutt` (command-start or
   after `;&|`, never inside a word); on a publish-host match: `PUBLISH_CONNECT=`
   present → exit 0 with a connect reminder; no `PUBLISH_CLAIM=<8 hex>` →
   **exit 2 under EVERY policy**; token present → resolved in
   `docs/product/launch/publish-claims.jsonl` (git toplevel, falling back to
   cwd): last event for that token must be `claimed` or `dispatching`
   (else exit 2), and `kind: outreach` → exit 2 regardless of policy; valid →
   exit 0 with a 📣 reminder to record the outcome. jq-only, like every lib
   hook; ledger/queue text is grepped and `--arg`-passed, never executed.
   `hooks.json` description keeps the needle `publishing guardrail` first.
3. **Harness coverage in `tools/hook-test.mjs`** — a `runGate({ args, files })`
   helper (same mkdtemp + `files:` staging as `runHook`, spawns `node` on the
   plugin's `publish-gate.mjs` with `cwd = dir`) and the seven named cases plus
   their siblings listed in the sessions brief. Acceptance: every case asserts
   the exit code AND the nudge/log text; `node tools/hook-test.mjs` ends
   `hook-test: clean` with ≥ 136 `ok` rows (baseline measured 2026-10-06: 123).
4. **Queue, log and command surfaces** — `templates/publish-queue.md` (12
   columns, `kind`, state list, `O-nnn` outreach rows with `to:`/`subject:`
   lines, the pin/claim legend), `templates/publish-log.md` (+ `kind`, `claim`
   columns), `commands/publish.md` (`approve <id>` and `reconcile <id>` verbs;
   `stage` ends with `stamp`; `run` = `stamp` → per item `claim` → `dispatch` →
   connector call with `PUBLISH_CLAIM=<token>` literally in the SAME Bash
   command → `outcome`; `unknown` never auto-retried; `status` prints the
   journeys block). Acceptance: `node tools/lint.mjs` green (frontmatter,
   cross-refs, template refs); `argument-hint` lists the six verbs; `marketing`
   and `writer` prompts say rows are `kind: post` and that `stage` stamps them.
5. **Protocol text, both copies** — `templates/WORKFLOW.md` §3 (new
   publish-host row; Codex row names the gate tool as the only check there) and
   §14 (state list, pin + claim, threat model = accident not adversary, email
   hosts, tokenless-blocks-under-every-policy, `PUBLISH_CONNECT=`, the claims
   jsonl as audit trail, `approve`/`reconcile`), mirrored verbatim into
   `docs/WORKFLOW.md` with the protocol-master stamp → v1.52.0. Acceptance:
   `diff` of §3 and §14 between the two copies is empty; `node tools/lint.mjs`
   section-integrity check green.
6. **Record + n=1 in this repo** — `plugin.json` 1.52.0, CHANGELOG `[1.52.0]`
   entry, both READMEs (root `tools/` line and plugin README `/publish` row +
   tree), and the n=1: `docs/product/launch/publish-queue.md` created from the
   new template with one `kind: post` row (P-001, channel `devto`, source
   `announcements/dev-to.md`), `stamp` → `approve P-001` → one word edited in
   the body → `claim P-001` is REFUSED with the metrics-doc log line, the row
   is back at `draft` with `epoch: 2`, and `publish-claims.jsonl` holds the
   `approved` + `reset` events. Acceptance: the handoff log quotes the REFUSED
   line verbatim; the queue and jsonl are committed (OQ2).

## Locked decisions

- 2026-10-06 (brief L1) — Three missions C → A → B, each ONE session with its
  own n=1. This is mission 1 (`publish-approval`, capability C); it merges
  alone. Not re-litigated here.
- 2026-10-06 (brief L2, Memo 3 option C) — Storage is BOTH: queue columns
  `kind | body-sha256 | epoch | approved-for | claim` are the human-reviewed
  truth for content; `docs/product/launch/publish-claims.jsonl` (append-only
  events `approved | claimed | dispatching | delivered | unknown |
  cancelled | reset`) is the machine truth for state and the audit trail, and
  is committed. Enforcement is BOTH: `tools/publish-gate.mjs` (runtime-agnostic,
  the only check in Codex) and `hooks/lib/publish-guard.sh` (fail-closed
  backstop in Claude).
- 2026-10-06 (counsel technical finding 5, binding) — Threat model: the pin,
  epoch and claim guard against ACCIDENTAL drift and double-fire, not against
  an adversarial agent; written into §14. Email hosts join the publish regex.
  A tokenless publish-host call blocks under EVERY policy (`human-only`
  included — the memo's "reminder under human-only" is superseded);
  `PUBLISH_CONNECT=` marks `/publish connect` round-trips.
- 2026-10-06 (counsel finding 4, brief L2) — `api.elevenlabs.io` and
  `api.x.com` join the §3 paid guard now, in this mission (the hook is being
  rewritten anyway). Consequence stated: an X post needs
  `PAID_CONFIRMED_BY_HUMAN` in the command even under `may-publish`, because X
  posting is pay-per-use (memo F6) — see OQ1.
- 2026-10-06 (journeys C, open question 1 → resolved by the brief's Mission 1
  scope) — `approve` and `reconcile` are `/agentic-workflow:publish`
  subcommands; the pin is stamped by the tool, never by hand. A hand-written
  `approved` with no `approved-for` is treated as `draft` with the journeys'
  message.
- 2026-10-06 (Memo 3) — Hash = sha256 over the `### <id>` body section,
  heading excluded, LF-normalised, trailing whitespace trimmed; `approved-for`
  = first 8 hex + `@` + epoch; `claim` = `<token8> <state> <UTC>`.
- 2026-10-06 (planner, migration) — Existing queue rows with no `body-sha256`
  (old 7-column tables in adopted ventures): `stamp` rewrites the header,
  inserts `kind: post`, fills the hash, sets `epoch: 1`, leaves `state`
  unchanged; an old `approved` row has no pin and cannot be claimed until
  `approve <id>` runs; an old `posted` row is a receipt and is never claimed.
- 2026-10-06 (planner, routing) — Builder: `security` (fail-closed guard +
  a shell hook that parses untrusted command text); reviewer: independent
  `reviewer` on **Fable** at the checkpoint; human merges. Staging verify for
  this repo (§10 Staging = none): `node tools/lint.mjs` green on the branch +
  `claude --plugin-dir plugins/agentic-workflow` load.
- 2026-10-06 (planner, branch) — One phase branch `mission/publish-approval`
  cut from `feat/launch-media-plan` (which carries the decision docs and this
  trio); one PR to `main`. Gate policy human-merge.
- 2026-10-06 (planner, lib hook contract) — The hook resolves the repo root
  via `git rev-parse --show-toplevel` and falls back to `.` when not in a git
  tree, so `tools/hook-test.mjs` can stage `docs/WORKFLOW.md` and the claims
  jsonl with `files:` (the current inline hook has no fallback and silently
  takes the human-only branch in the harness). The gate tool resolves its
  default paths by the SAME rule, so hook and tool can never read different
  files.
- 2026-10-06 (planner) — `api.x.com` stays in the paid guard. Consequence of
  L2, not a new choice: X posting is pay-per-use (F6: $0.015/request), so it
  IS spend and §11 never delegates spend; an X post needs
  `PAID_CONFIRMED_BY_HUMAN` in the command even under `may-publish`, and so
  does an X `connect` round-trip. Reversible by one regex edit.
- 2026-10-06 (planner) — The n=1 artifacts are committed in this repo:
  `docs/product/launch/publish-queue.md` (one `kind: post` row, P-001, left at
  `draft` after the tamper) and `docs/product/launch/publish-claims.jsonl`
  (`approved` + `reset`). The jsonl IS the audit trail the reviewer verifies.
- 2026-10-06 (planner) — `reconcile <id> --cancel` lands the row at `draft`
  (`approved-for` and `claim` cleared, event `cancelled`) — fail-closed, since
  the body may have been edited during the incident; re-approval is required.
- 2026-10-06 (planner) — The gate tool is plugin-resident
  (`${CLAUDE_PLUGIN_ROOT}/tools/publish-gate.mjs`, like `ci-wait.mjs`; not
  copied into ventures like `catalog.mjs`). A Codex session reaches it by the
  absolute plugin path the adapter already knows; §14 says so. No code for
  that in this mission — `/publish` is a Claude command and a Codex builder
  never fires it.

## Open questions

(none — the four candidates were settled by the planner above; the owner's
standing rule is not to escalate what the plan can settle.)

## Open questions (historical, superseded 2026-10-06)

- OQ1–OQ4 were X-in-paid-guard, commit-the-n=1-artifacts, `--cancel` target
  state, and gate-tool residency. All four are now locked decisions above with
  the planner's recommendation taken.

## Risks

| Risk | Bound / mitigation |
|---|---|
| **Codex runtime has no hooks** (Memo 10, §3 Codex row): inside a `codex` run nothing blocks a publish-host call; the gate tool's refusal is the only mechanical check, and an agent could call `outcome <tok> delivered` itself. | Accepted gap, threat model = accident. Named in §14 text; carried by OB-17 and the #81 hooks-parity follow-up (Codex PreToolUse hooks see the full command string). `## Closing` row in the ledger. |
| **MCP/HTTP tools bypass the Bash hook** (counsel technical): a browser or HTTP MCP tool is not a Bash command. | Same class; stated in §14. The gate tool is the invariant the command obeys regardless of transport. |
| **Hook sees command text only** (F2): `PUBLISH_CLAIM=` can be spoofed if an agent also appends a forged `claimed` line to the jsonl; and `PUBLISH_CONNECT=` is a pure text-level bypass of the publish-host rule — any command carrying it passes with a reminder, no file check at all. | Accident-not-adversary, named here and in §14; the jsonl is committed and PR-reviewed; the token must be 8 hex and resolve to an open `claimed|dispatching` event of `kind: post`; `PUBLISH_CONNECT=` is reserved to `/agentic-workflow:publish connect` (owner at the keyboard) and the paid rule still runs first, so a marked X call also needs `PAID_CONFIRMED_BY_HUMAN`. |
| **Email-host regex false positives** (`mail` inside unrelated commands). | Match URL/host forms and bare mailer binaries at command start or after `;&|` only; harness sibling case: `git commit -m "mail merge"` and `echo mutton` stay silent. |
| **In-place markdown table rewrite mangles a hand-edited queue** (escaped pipes, short rows). | `stamp` parses the whole table first; any row with the wrong cell count or an unmatched `### <id>` section → exit 4 "queue unparseable at line N", no write; writes are temp + rename. Selftest covers a short row. |
| **One-session fit at the upper bound** (19 files, ~400 LOC, 13 harness rows). | Brief is pre-resolved to the line; cut list applied (no `failed` verb, no `--json`, no age clock); order rule: steps 1–4 green before prose, step 7 + the `codex.rules` sentence first into an `S1-fix` if long; a corrective is counted when it fires. Reviewer on Fable. |
| **Old 7-column queues in adopted ventures** break on the new tool. | Migration rule (locked above); `stamp` is idempotent and the selftest asserts the old→new rewrite. |
| **`api.x.com` in the paid guard makes delegated X posting impossible.** | By construction and by L2; OQ1 asks the owner to confirm the consequence; reversible by one regex edit. |
| **Harness needle drift**: `hook-test.mjs` selects the hook by the description substring `publishing guardrail`. | The brief fixes the description to start with that needle. |
| **Eval fixture stamp** (`evals/scenarios/mission-batch-gate/fixture/docs/WORKFLOW.md` is at v1.32.0 — the local amendment says bump alongside, but no release since has). | Out of scope; not touched. Noted so the reviewer does not flag it as a miss. |

---
_The `.plans/publish-approval.sessions.md` brief executes these tasks;
`.plans/publish-approval.state.md` tracks progress. No open question blocks
execution._
