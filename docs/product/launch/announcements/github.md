# Announcement — GitHub (release notes + README badge)

**Channel**: GitHub — the v1.30.0 release page and the README top screen.
Published first: every other channel links here.
**Voice**: plain, technical, first-person — **best guess, no flight plan
exists**; owner corrects before publishing.
**Format constraints**: release notes render as the GitHub Release body;
README changes are a normal PR through the repo's own gates.

## Draft (ready to paste)

### 1. Release notes — v1.30.0 "the awareness release"

```markdown
## v1.30.0

Agentic Workflow has been public for a while and announced never — this
release marks the point where that changes. Nothing about the protocol is
new today; the announcement is.

**What this is**: a Claude Code plugin carrying a full venture lifecycle
(V0 idea → V6 operate) with an exit gate on every stage, ~16 role agents
that propose while the human decides, guardrail hooks that fail closed on
merge/deploy/spend/publish, and a permanent record (CHANGELOG, JOURNEY,
status page, decision log).

**What it is not**: another dev-loop methodology. Superpowers, BMAD, and
Spec Kit cover brainstorm→plan→code; Ralph loops cover unattended
throughput. This covers the venture — idea validation to operations — and
makes the unattended part safe: loop mode drives missions one brief per
tick, and the owner channel brings gates to your phone with tap-to-decide.

**Start here**:

/plugin marketplace add xyzhub/agentic-workflow
/plugin install agentic-workflow@xyz

Then `/adopt` in an existing project, `/autopilot "<idea>"` for a new one,
or `/next` if you're not sure. MIT.
```

### 2. README badge / one-liner (top of README, below the title)

```markdown
[![marketplace](https://img.shields.io/badge/claude--code-plugin-blue)](https://github.com/xyzhub/agentic-workflow)
[![version](https://img.shields.io/badge/v1.30.0-stable-green)](CHANGELOG.md)
[![license](https://img.shields.io/badge/license-MIT-lightgrey)](LICENSE)

> Autonomous agents. Human gates. Nothing ships without you.
```

## Notes for the publisher

- Publish this BEFORE the HN/X/dev.to posts — they all link the repo, and
  the release should be the newest thing visitors see.
- Verify the marketplace slug (`xyzhub/agentic-workflow` per the README) and
  badge URLs before merging; the badge links are placeholders in style, not
  verified shields.io renders.
- Record baseline stars/traffic/issues (see `launch-plan.md` metrics) before
  pushing this.
