# Owner surfaces — journeys, page IA and copy (designer, 2026-10-16)

Inputs: `2026-10-16-owner-surfaces-brief.md` (acceptance per journey),
`2026-10-16-owner-surfaces-platform-facts.md` (what the Artifact runtime can
do), goal statement §E2, current `docs/product/overview.html` (v20). Persona:
**the owner** (this repo's owner first, Orderly second) and **the client as
owner** (a paying client, never seen the workflow): from the brief's interview,
not researched. Gate classes come from `templates/gate-classes.md`; this file
names ids, never restates the list.

_Terms: a **question** is one decision the engine asks the owner (a gate, an
interview question). A **question instance** is one asking of it, carrying a
one-time **nonce** (a random token that makes each answer usable once). An
**answer** is the owner's pick, written to the page's database (`db`). A
**session** is a Claude Code run of the orchestrator; only a session reads
answers. **Picked up** means a session read the answer, checked it, and logged
it as a dated decision._

**Aha moment:** the owner taps an option on their phone and, next session, sees
"Picked up" with the decision in the journey. The friction budget before it:
open link, read card, tap option, tap Record. Four steps, no sign-in beyond
claude.ai, no confirmation dialog (undo instead, below).

## J1 — Decide on the page

**Trigger:** a session reaches a human gate (plan approval, counsel-backed
scope call, `/plan` interview question) and writes a question instance.

1. Session writes the question to `db` and republishes the page. The owner
   channel message keeps today's format and adds the page link.
2. Owner opens the page; "Asked of you" is the first card below the header.
3. Owner reads headline, what changes, risk, estimate, the recommended option.
4. Owner taps an option (the whole row is the target, ≥44×44pt), then
   **Record answer**. The page writes `{questionId, nonce, optionId,
   answeredBy: user.id(), at}` to an owner-only path.
5. Card turns to "Recorded" with a 10-minute **Change answer** link (undo
   beats confirm; a change writes a new answer for the same nonce, last one
   wins until pickup).
6. Next session reads answers first, checks them (below), logs a dated
   decision, marks the instance `picked-up`, republishes. Card moves to the
   journey as a decision entry.

**Checks at pickup (session side, all must pass):** nonce matches the live
instance; instance not expired or already picked up; `answeredBy` equals the
owner id pinned on the question; `optionId` is one of the instance's ids.
Anything else is refused, logged, and reported to the owner channel. Page data
is untrusted input; the db rule (owner-only write) is the first lock, the
session check is the second.

**Irreversible gate** (question carries an action class, e.g.
`merge-to-default`, `production-deploy`, `spend`): steps 1 to 6 are the same,
but the answer is a decision, not the act. After Record, the card shows "You
fire this yourself" with the exact command and a Copy button. The session
never fires it on the strength of a page answer.

## J2 — Page is generated

**Trigger:** any ledger beat, question write, answer pickup, or operating-loop
digest. A tool renders `overview.html` from structured data (mission state,
questions, journey entries, ops state) and the main session republishes. The
chronicler stops hand-editing every region the data covers; any region not yet
covered stays hand-edited and is labelled in source as such. Header always
shows "Updated <time> from <source>" so a stale page says it is stale.

## J3 — JSON for tools

**Trigger:** Missions, a script or a second session needs state. One command
prints mission state plus pending questions as JSON against a versioned schema
(`schemaVersion` first field). `/plan` interview questions use the same
question shape. Before driving a mission a session takes the **mission lease**
(a claim with holder and expiry); a second session or machine sees "held by
<host> until <time>" and stays read-only. The engine never hooks Claude Code's
question tool: the page and JSON are parallel channels, the chat question still
works.

## J4 — Client-ready

**Trigger:** the owner shares the page with a client (owner's act in the
claude.ai Share menu). Pass bar: a first-time reader says what is happening,
what is asked and what each option changes, from the page alone. Every
question card carries all eight fields; every id on the page has a plain name
beside it; no ledger shorthand (`OB-6`, `LD-21`) appears without its
definition.

## Data-model implications (for the architect)

- Question: `id`, `instance` (nonce, `askedAt`, `expiresAt`, `ownerId` pin),
  `headline`, `changes`, `risk` (`low|medium|high` + one line), `estimate`,
  `recommended` (option id), `options[]` (`id` stable across re-asks, `label`,
  `consequence`), `evidence[]` (label + URL), `gateClass` (gate-classes id or
  `none`), `fireCommand` (irreversible only), `status`.
- Owner id pin: `user.id()` is opaque and scope-local, so the session cannot
  know it in advance. Proposal: the first owner visit (`isOwner()` true)
  writes an owner-only `owner/id` row; the session pins it on every question.
  Architect to confirm.
- Plain label per class: add a `plain` column to `gate-classes.md` rows so the
  card's wording is generated, not restated (keeps `checkClassListDedup`
  green).
- Lease: holder, host, `expiresAt`, renewal; lives in the ledger, mirrored to
  `db` read-only.

## Page IA (order is priority)

1. **Header**: project name, one-line purpose, "Updated <time> from <source>",
   viewer badge (Owner / View only / Signed out).
2. **Happening now**: mission name in plain words, the step in flight, who is
   running it, sessions used vs estimate, lease holder.
3. **Asked of you**: question cards, oldest first; count in the heading
   ("2 decisions waiting").
4. **Mission progress**: phases as a rail with done/now/next; each phase one
   plain sentence.
5. **Ops state**: from the operating loop — errors (count, newest, trend),
   costs (this week vs budget), triage (reports waiting, auto-fixed,
   escalated). Each with "what this means" in one line.
6. **Journey**: dated entries, newest first; decisions from the page appear
   here with "Decided on the page".

### Question card (top to bottom)

| Field | Shown as |
|---|---|
| Headline | The decision as a question, ≤ 12 words: "Approve the owner-surfaces plan?" |
| What changes for you | One or two sentences, user-visible effect |
| Risk | Chip `Low / Medium / High` with a word, never colour only, + one line |
| Estimate | "About 3 sessions" or "About $40" |
| Recommended | Option marked "Recommended" + one-line reason |
| Options | Rows: label, consequence line; id in small mono (`opt-approve`) |
| Evidence | Links with plain labels: "The plan (12 steps)", "Reviewer verdict" |
| Gate class | Plain words, below |

**Gate class in plain words:** `none` → "Reversible — the workflow can undo
this." Change class → "Touches <plain name>; a reviewer checks it before it
lands." Action class → "You fire this yourself — the page records your
decision; nothing ships from here."

### Copy per state

| State | What the reader sees |
|---|---|
| No pending questions | "Nothing needs you right now. The next decision will appear here and in your messages." |
| Loading | Skeleton cards + "Loading the latest state…"; after 8 s: "Still loading. The page below may be up to <age> old." |
| Recorded, not picked up | "Recorded: <option label>. The next session on this project reads it — no session is running now." · link "Change answer" (10 min) |
| Recorded, session running | "Recorded: <option label>. The running session reads it at its next step." |
| Picked up | "Picked up <time>. Logged as a decision on <date>." Card moves to Journey. |
| Stale / expired | "This question expired at <time> — the plan changed since it was asked. A fresh version is above, if one is still needed." Options disabled. |
| Answer refused (replay, forged, wrong id) | Owner sees: "An answer to '<headline>' was refused: <reason in plain words, e.g. it was for an older version of this question>. Nothing changed. Pick again if you still want to." Also sent to the owner channel. |
| Viewer is not the owner | Badge "View only". Options shown, not selectable. "Only the project owner can answer. You can follow progress here." |
| Signed out | "Sign in to claude.ai to answer. You can read everything below." State renders read-only. |
| `db` unavailable | Banner: "Answers are offline right now — the page shows the last published state from <time>. Try again in a few minutes or answer in your terminal: `<command>`." State renders from the HTML snapshot. |
| Irreversible gate, recorded | "Decision recorded: <option>. You fire this yourself:" + code block (`gh pr merge 152 --merge`) + **Copy command**. "The workflow will not run it for you." |
| Lease held elsewhere | "Another session (<host>) is driving this mission until <time>. Answers still record; that session picks them up." |

## HIG and accessibility notes on the current page

- `--ink-faint` `#6a6d8c` is 3.49:1 on panels and 3.79:1 on the background:
  fails AA 4.5:1 for the small text it carries (dates, labels, footer). Use
  `#8a8dab` (5.41:1 on panel). HIG asks 7:1 for custom dark colours: body ink
  passes (14.4:1), `--ink-dim` 6.5:1 is close.
- Labels at 10–11px mono uppercase (`.tag`, `.chip`, `.kv .k`) sit at or below
  HIG's 11pt floor; raise to 12px minimum and 13px for any label a client
  must read. Body and card text to 15–17px (HIG Subhead/Body).
- Option rows, Record, Change answer, Copy command: ≥44×44pt targets, ≥8pt
  apart. Risk and status never colour-only (word + shape).
- Respect `prefers-reduced-motion`; the only motion is the card's state
  change (150 ms fade). Live updates via `onSnapshot` announce in an
  `aria-live="polite"` region.

Independence note: this designer specified the surface; the frontend builds
it and the V4 heuristic pass (by me) must route through the normal Fable
checkpoint, not self-certify.
