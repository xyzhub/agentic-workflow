# Feature brief — owner-surfaces (goal statement E2), 2026-10-16

## Problem

In an engagement the client is the owner: they watch the status page, answer
the gates, read the plain-language journey, and receive the loop's digest and
alerts. Today all of these leave the engine as prose — chat questions, ledger
text, a status page the chronicler hand-edits — so nothing can be rendered,
answered or audited as data, the page cannot take a decision, and Missions
has to scrape text. Source: `docs/product/decisions/2026-10-12-goal-statement.md`
§E2 (its "Done when" is the acceptance bar).

## Interview answers (owner's words, 2026-10-16)

- **Who:** "You, then a client" — the owner uses the generated page and
  on-page decisions on this repo and Orderly first; it must be good enough to
  hand to a paying client with no explanation.
- **Not in v1:** "Telegram/Slack buttons, Multi-user / client logins,
  Generated maps (E7)". (Missions app changes were offered and **not**
  excluded.)
- **Priority & posture:** "Next mission, careful" — E2 is next in the
  goal-statement order; Fable checkpoints; the human merges to `main`.
- **Success:** "Decide on the page, Page is generated, JSON for tools,
  Client-ready".

## Acceptance criteria, per journey

**J1 — decide on the page.** A real gate (e.g. a plan approval or a
counsel-backed scope decision) appears on the status page as a structured
question; the owner picks an option there; the running or next session picks
the answer up and proceeds, logging it as a dated decision. The answer is
identity-pinned (only the owner's identity counts) and nonce-bound (one
answer per question instance; a replayed, stale or forged answer is refused
and reported). Irreversible actions (gate-classes action classes: deploy,
merge-to-default, publish, spend, …) are never fired from the page — the page
can record the owner's decision, the human still fires the act.

**J2 — page is generated.** The status page Artifact is rebuilt from the
engine's structured data (mission state, pending questions, journey, the
operating loop's ops state — errors, costs, triage) with no hand edits; the
chronicler stops hand-editing overview.html regions that the data covers.

**J3 — JSON for tools.** One command prints mission state and pending
questions as JSON against a documented, versioned schema; the `/plan`
interview ships its questions in the same structure; the mission lease lands
so two sessions/machines cannot drive the same mission at once. The engine
never hooks Claude Code's question tool.

**J4 — client-ready.** A reader who has never seen the workflow reads the
page and can say what is happening, what is being asked, and what each
option changes — headline, what changes for the user, risk, estimate,
recommended option, stable option ids, evidence links, gate class on every
question.

## NOT in v1 (deferred, not denied)

- Telegram/Slack owner-channel buttons (messages keep today's format).
- Multi-user / client logins — only the owner decides on the page.
- Generated maps of the workflow (E7).

## Locked decisions (owner, 2026-10-16, at the single approval)

- **L1 Scope — "Split: E2a now, E2b later".** This mission is **E2a**: the
  question schema and validator (memo D1, incl. the `plain` column in
  `gate-classes.md`), the append-only question log `.plans/questions.jsonl`
  replacing the never-built `pending-gates.md` and the on-demand JSON
  (`state.mjs`, D2), the `/plan` interview emitting structured questions
  beside the unchanged `AskUserQuestion` call, the generated status page
  (D3, static data island; no on-page answering), the HIG/contrast fixes the
  designer found, ops rows as "Not measured yet" where no source exists
  (D6-A), and the lease (L2).
- **L1b E2b — deferred, dated, with a trigger** (an explicit owner exception
  to "what a mission leaves out is never revisited"): deciding on the page
  (D4 — owner pin, nonce, settle window, live round trip, with every
  technical counsel condition 1–4), the `/operate` structured ops notice
  (D6-B), and client-ready polish. **Trigger:** a client demo or engagement is
  booked. Recorded as an obligation row at close.
- **L2 Lease — "Real lease, re-specified"** (in E2a): the loser of a race
  undoes its own local commit; lease verbs refuse `--no-push`; the lease
  binds the mission, not a branch; `--force` takeover of an unexpired lease is
  owner-only and logged; a two-clone race selftest proves exactly one side
  keeps the lease. TTL 4 h (memo D5).
- **L3 Settings — "7 days; Missions = sample data".** Unanswered questions
  expire after 7 days. Missions: fixtures plus a public-interface doc only,
  no Missions code (D7); Missions adopts them in its own session.
- **L4 Client — "No date yet".** Client-facing outcomes (J4 read by an
  outsider) stay "no claim" until a demo exists; that is E2b's trigger.
- **Posture (interview):** next mission, careful — Fable plan-judge and
  checkpoints; the human merges to `main`. Byte deltas for WORKFLOW.md and
  mission.md are computed in the plan (counsel condition 5).
- **L5 Estimate (owner, 2026-10-16) — "Accept 7":** 4 builds + 3 Fable
  checkpoints; overrun stop at 11. Fallback subsets: P1+P2 (5) without the
  lease; P1 alone (3).
- **L6 Lease shape (owner, 2026-10-16) — "Approve":** OQ-1 ratified — the
  lease authority is the shared remote branch `lease/<mission>`; the token
  stays on the machine; the ledger shows only `key8`.
- **Start:** "Later" — the plan lands on `main` first; `/agentic-workflow:next`
  points at it.
