# {{PROJECT_NAME}} — Flight Plan (autopilot standing authorization)

The one upfront ask before `/agentic-workflow:autopilot` flies. Every field accepts "you decide";
anything not covered here comes back to the human. See Agentic Workflow §11.

## Idea
_The one-liner, expanded just enough to be unambiguous about who it serves and
what it does._

## Guardrails
- **Budget ceiling**: _(max spend on paid services before checking in, e.g. "$20/mo")_
- **Risk tolerance**: _(conservative / balanced / aggressive — governs how much
  validation before building)_
- **Merge authority**: _(`human-only` — the default — or `agent-may-merge`:
  agents may merge reviewer-APPROVEd PRs themselves. Only an explicit answer
  here delegates it; "you decide" keeps `human-only`. Recorded in
  `docs/WORKFLOW.md` §10 as the Merge policy.)_

## Brand
_A preference ("clinical and calm", "playful"), a reference, or "you choose" —
the `designer` surfaces directions either way._

## Deploy target
_Where it ships (e.g. Fly.io, Vercel), and whether credentials already exist._

## Check-in level
_"only stop at hard gates" (default) or "check in each stage". Hard-gates-only
also authorizes the `batch` mission gate policy — phases merge into a mission
integration branch and the human merges once at launch; check-in-each-stage
keeps `human-merge` per phase._

## Owner channel
_Where the workflow may message YOU — a private Telegram bot chat or Slack DM
(§12): transport, the env-var NAMES holding the token/webhook + chat id, and
your user id for inbound verification. Gate notifications arrive here with
Approve/Reject buttons; decisions you tap are nonce-bound and recorded. Leave
blank → harness push notifications where available, else the status page only._

## Channels & voice
_Where the owner talks to users (site, social, mailing list, communities) and in
what register — the `marketing` agent drafts the V5 launch assets in this voice.
Leave blank to decide at V5._

---
_Standing authorization: within these bounds autopilot proceeds without asking.
The safety boundary (§11) is never crossed autonomously regardless of what this
file says: default-branch merges (unless Merge authority above delegates them —
and then only reviewer-APPROVEd PRs), production deploys, spending beyond the
ceiling, publishing outward, launching behavioral experiments on real users,
and destructive actions always need an explicit human confirmation. Merge
authority is the one delegable item._
