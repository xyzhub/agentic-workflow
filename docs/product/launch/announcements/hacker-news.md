# Announcement — Hacker News (Show HN)

**Channel**: news.ycombinator.com, Show HN.
**Voice**: plain, technical, first-person, self-critical — **best guess, no
flight plan exists**; owner corrects before publishing. HN punishes
marketing-speak; the honesty in `positioning.md` ("What we do NOT claim") is
the asset here.
**Format constraints**: title ≤ 80 chars, starts with "Show HN:"; text field
is plain text (no markdown rendering); first-person; be present in the
comments for the first hours.

## Draft (ready to paste)

**Title** (pick one, both ≤ 80 chars):

> Show HN: A venture lifecycle for Claude Code — human gates, agents propose

or

> Show HN: Agentic Workflow – idea-to-operations protocol for Claude Code

**URL**: https://github.com/xyzhub/agentic-workflow

**Text**:

I've been running coding agents on my own projects and kept hitting the same
trade: stay hands-on and lose the speed, or go hands-off and accept
ungoverned output. Ralph-style overnight loops ship real features, but
there's no review gate between the loop and main.

So I built the governance layer as a Claude Code plugin and have been
dogfooding it for 30 releases (it's at v1.30.0 — public for a while, never
announced). It carries a project through a venture lifecycle, V0 idea
validation to V6 operations, with an exit gate on every stage. ~16 role
agents (researcher, architect, designer, business, planner, reviewer, ops…)
propose; the human decides. Guardrail hooks fail closed: agents can't push
to main, merge, deploy, spend, or publish — they prepare, you fire.

The parts I think are actually novel versus Superpowers/BMAD/Spec Kit (which
are dev-loop methodologies — this sits above that layer):

- The lifecycle covers the venture, not the code: idea validation with cited
  evidence, business model, launch assets, post-launch operate loop.
- An owner channel (Telegram/Slack): gates come to your phone, tap-to-decide,
  nonce-bound and fail-closed. Action gates (merge/deploy/spend) always carry
  a link instead — you fire those where they live.
- Everything is loop-drivable: the ledger is the state, so a cron'd
  `/loop /mission continue` executes one brief per tick in a fresh context.
- Portfolio mode: one owner, many ventures, one cross-venture ops sweep.

Honest caveats: it's MIT and there is no moat — it's all forkable prose. The
eval suite (8 LLM-judged scenarios in the repo) tests protocol compliance,
not cross-stack generalization; whether one opinionated protocol survives
contact with *your* repo is exactly the assumption I'd like tested. `/adopt`
on an existing project and the gap report it produces is the fastest way to
find out — and issues from people who aren't me are the signal I care most
about.

## Notes for the publisher

- Post morning US time on a weekday (roughly 8–10am ET tends to do best);
  avoid weekends for Show HN.
- Don't post the X thread first — HN sometimes flags things that look
  coordinated. GitHub release first, then HN, then X.
- Expected pushback to prepare for: "this is just ceremony/waterfall for
  agents" (answer with the kill criteria — gate overhead is a tracked failure
  mode, and `/fix` is deliberately light), "why not just Superpowers"
  (different layer — dev loop vs venture lifecycle; they compose), and
  "LLM-judged evals are circular" (fair; they're compliance tests, say so).
- Reply fast and concede real points; the positioning file's "What we do NOT
  claim" section is the comment-thread playbook.
