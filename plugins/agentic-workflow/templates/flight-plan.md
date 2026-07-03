# {{PROJECT_NAME}} — Flight Plan (autopilot standing authorization)

The one upfront ask before `/autopilot` flies. Every field accepts "you decide";
anything not covered here comes back to the human. See Agentic Workflow §11.

## Idea
_The one-liner, expanded just enough to be unambiguous about who it serves and
what it does._

## Guardrails
- **Budget ceiling**: _(max spend on paid services before checking in, e.g. "$20/mo")_
- **Risk tolerance**: _(conservative / balanced / aggressive — governs how much
  validation before building)_

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

## Channels & voice
_Where the owner talks to users (site, social, mailing list, communities) and in
what register — the `marketing` agent drafts the V5 launch assets in this voice.
Leave blank to decide at V5._

---
_Standing authorization: within these bounds autopilot proceeds without asking.
The safety boundary (§11) is never crossed autonomously regardless of what this
file says: default-branch merges, production deploys, spending beyond the
ceiling, publishing outward, and destructive actions always need an explicit
human confirmation._
