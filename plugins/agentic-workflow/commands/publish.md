---
description: Drive the publishing pipeline (§14) — connect channels, stage posts into the queue from launch assets, review what's due, and fire approved items. The human fires by default; a scheduled run fires only within a delegated §10 Publish policy. Paid is always human-fired.
argument-hint: '[connect | stage | status | run] [channel]'
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, AskUserQuestion, WebFetch]
---

Drive outward publishing for this project (Agentic Workflow §14). **Precondition**:
the project is bootstrapped (`docs/WORKFLOW.md` with a §10 profile) — else point
at `/agentic-workflow:adopt` or `/agentic-workflow:bootstrap` and stop. The subcommand is in `$ARGUMENTS`
(default `status`). Everything here is gated: staging is always safe, firing
obeys the §10 **Publish policy** (fail closed).

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
  an owner-only test destination) — show only non-secret confirmation.
- Record only the var NAMES in `.env.example` and note the channel in the
  launch dir. Leave edits uncommitted for review.

## `stage` — fill the queue (safe; fires nothing)

Populate `docs/product/launch/publish-queue.md` (from
`${CLAUDE_PLUGIN_ROOT}/templates/publish-queue.md` if missing) from the launch
assets and content plan. Spawn the `marketing` agent for short-form posts and
the channel plan, and the `writer` agent for long-form articles — each writes
`draft` items with channel, scheduled time, full body, and source asset. Mirror
the §10 Publish policy into the queue's header. Nothing is posted; items wait at
`draft` until a human (or the delegation scope) marks them `approved`.

## `status` — what's queued, approved, due, posted

Read the queue and `publish-log.md`: show `draft`/`approved` counts, what's due
now, what posted recently, and the Publish policy in force. Read-only.

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

For each posted item: append a row to `docs/product/launch/publish-log.md`
(from `${CLAUDE_PLUGIN_ROOT}/templates/publish-log.md` if missing) with the
permalink and firing authority, and edit the queue item to a receipt. A body
changed since approval reverts to `draft` — never fire it. **Paid items are
never fired here autonomously**: a paid post/ad crosses the money boundary
(§11), needs explicit human confirmation within the budget ceiling, and is
logged as `fired by: human`.

## Boundaries

Staging and connecting are always safe; firing is the gated act. `/agentic-workflow:publish`
never crosses the safety boundary autonomously beyond what the §10 Publish
policy delegates (organic only, scoped, revocable), never spends on paid
promotion without a human, and never messages real users individually. The
mechanical backstop (§3 hook) blocks paid endpoints and reminds on organic ones
regardless of what this command is told.
