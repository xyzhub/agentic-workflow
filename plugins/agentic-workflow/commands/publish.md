---
description: Drive the publishing pipeline (§14) — connect channels, stage posts into the queue from launch assets, review what's due, and fire approved items. The human fires by default; a scheduled run fires only within a delegated §10 Publish policy. Paid is always human-fired.
argument-hint: '[connect | stage | status | approve <id> | run | reconcile <id>] [channel]'
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, AskUserQuestion, WebFetch]
---

Drive outward publishing for this project (Agentic Workflow §14). **Precondition**:
the project is bootstrapped (`docs/WORKFLOW.md` with a §10 profile) — else point
at `/agentic-workflow:adopt` or `/agentic-workflow:bootstrap` and stop. The subcommand is in `$ARGUMENTS`
(default `status`). Everything here is gated: staging is always safe, firing
obeys the §10 **Publish policy** (fail closed). Every state change goes through
the shipped gate tool — `node "${CLAUDE_PLUGIN_ROOT}/tools/publish-gate.mjs" <verb>`
(written `publish-gate.mjs` below) — never a hand edit of the pin columns: it
hash-pins what you approve and mints the one-time claim token a fire needs.

## `connect [channel]` — wire a channel (secret-rule, round-trip)

Set up credentials for a publishing target, following the §12 secret rule
exactly (never ask for or echo a token; it lives in the human's env or an
uncommitted `.env`; verify by USE, not by printing). One step at a time, verify
each, never proceed past a failure.

- Pick the channel (AskUserQuestion if not in `$ARGUMENTS`): X, LinkedIn,
  Mastodon, Bluesky, dev.to, Medium, Hashnode, mailing list
  (Buttondown/Mailchimp/ConvertKit), or own-site/RSS (PR-based, no secret).
- Walk the human through creating the API token/app; have them put it in their
  env under a clear NAME (e.g. `X_API_KEY`, `DEVTO_API_KEY`,
  `BUTTONDOWN_TOKEN`). **Round-trip test**: make a minimal authenticated call
  that proves send works without going public (a draft, a whoami, or a post to
  an owner-only test destination) — show only non-secret confirmation. Every
  round-trip call carries `PUBLISH_CONNECT=1` in the Bash command text: the §3
  hook allows a marked connect call and blocks a tokenless publish-host call
  under every policy. An **X** round-trip (`api.x.com`) ALSO carries
  `PAID_CONFIRMED_BY_HUMAN` — the paid rule runs before the connect marker is
  read and X is pay-per-use; the owner is at the keyboard for `connect`, so that
  token is theirs to type.
- Record only the var NAMES in `.env.example` and note the channel in the
  launch dir. Leave edits uncommitted for review.

## `stage` — fill the queue (safe; fires nothing)

Populate `docs/product/launch/publish-queue.md` (from
`${CLAUDE_PLUGIN_ROOT}/templates/publish-queue.md` if missing) from the launch
assets and content plan. Spawn the `marketing` agent for short-form posts and
the channel plan, and the `writer` agent for long-form articles — each writes
`draft` items with `kind: post`, channel, scheduled time, full body, and source
asset. Mirror the §10 Publish policy into the queue's header. Then run
`publish-gate.mjs stamp` and report its `stamp:` line (it fills `kind`,
`body-sha256` and `epoch`, migrates an old 7-column queue, and un-approves any
approved body that changed — the REFUSED/WARNING lines it prints go in the
report). Nothing is posted; items wait at `draft` until approved.

## `approve <id>` — pin exactly what you approve

Run `publish-gate.mjs stamp`, then show the `### <id>` body verbatim and ask
(AskUserQuestion) whether to approve THIS text. On yes, run
`publish-gate.mjs approve <id>`: it records `approved-for: <sha8>@<epoch>` and
an `approved` event in `docs/product/launch/publish-claims.jsonl`, and prints
the body it pinned. An edit after approval un-approves the item (epoch +1, back
to `draft`). Approving `kind: outreach` is the owner's go-ahead to send it **by
hand** — no run ever fires it.

## `status` — what's queued, approved, due, posted

Run `publish-gate.mjs status` and show its block verbatim: the policy in force,
**Needs you** (unknown / dispatching outcomes, approved rows with no pin, bodies
changed since approval), Ready to fire, Drafts (posts vs outreach), Posted this
week. Read-only.

## `run` — fire approved + due items (gated)

The fire step. Read the §10 **Publish policy** FIRST and obey it:

- **`human-only`** (default): only proceed when a human is running this. Show the
  approved + due items for explicit confirmation (AskUserQuestion), then post
  each via its channel connector.
- **`may-publish (delegated <date>, …)`**: post only `approved` + due +
  **organic** items **within the scope** (channels, rate limit). This is the
  path a scheduled `/agentic-workflow:publish run` takes.
- **`none` / unset**: nothing fires — report that publishing isn't configured
  and stop (fail closed).

Then `publish-gate.mjs stamp` (a body changed since approval is reset to
`draft` here, with its REFUSED line). Then, for each approved + due `post` item,
strictly in this order:

1. `publish-gate.mjs claim <id>` — add `--by "may-publish (delegated <date>)"`
   on a scheduled run, `--paid-confirmed-by-human` only when the human at the
   keyboard confirmed a paid item. Capture the `PUBLISH_CLAIM=<token>` last
   line. A refusal (exit 2) is reported with its line and the run moves to the
   next item — never retried, never worked around.
2. `publish-gate.mjs dispatch <token>`.
3. The connector call, with `PUBLISH_CLAIM=<token>` **literally in the same Bash
   command** (the §3 hook sees command text only: it blocks a publish-host call
   without a dispatched claim, and the passing call spends the token — a retry
   under it is blocked).
4. `publish-gate.mjs outcome <token> delivered --permalink <url>` — it appends
   the `publish-log.md` row and turns the queue row into a receipt — or, on ANY
   connector error, timeout or doubt, `publish-gate.mjs outcome <token> unknown`.
   An `unknown` is NEVER retried: it goes to the human (owner channel, Gate
   tier, once) to check the channel and reconcile.

**Paid items are never fired here autonomously**: a paid post/ad crosses the
money boundary (§11), needs explicit human confirmation within the budget
ceiling, and is logged as `fired by: human`. `kind: outreach` is never claimed —
the owner sends it by hand from the approved draft.

## `reconcile <id>` — resolve an unknown or dead run

For a `claimed`, `dispatching` or `unknown` row, after the human checked the
channel: `publish-gate.mjs reconcile <id> --delivered <permalink>` (it did post —
logged as `fired by: human`) or `publish-gate.mjs reconcile <id> --cancel` (it
did not — back to `draft`, pin and claim cleared; re-approve to fire).

## Boundaries

Staging and connecting are always safe; firing is the gated act. `/agentic-workflow:publish`
never crosses the safety boundary autonomously beyond what the §10 Publish
policy delegates (organic only, scoped, revocable), never spends on paid
promotion without a human, and never messages real users individually. The
mechanical backstop (§3 hook) blocks paid endpoints, blocks any publish-host
call without an open claim token under every policy, and blocks any token that
resolves to outreach — regardless of what this command is told.
