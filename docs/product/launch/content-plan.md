# Agentic Workflow — Post-Launch Content Plan (V5 → V6)

What gets published in the weeks AFTER launch day, so the launch is a ramp,
not a spike. Same rules as all marketing assets: claims trace to shipped
behavior or research, **the human publishes everything**. Voice remains a
best guess (no flight plan) — plain, technical, first-person.

> Retroactive draft (`/adopt fill`, 2026-07-08), sized for a team of one:
> one piece per week, most of them harvested from work that happens anyway.

## Content goals

Tied to the launch metrics in `launch-plan.md`:

1. **Keep installs fed** — each piece ends at the same single action
   (`/plugin install` → `/adopt`), so search and social traffic keeps
   converting after launch day.
2. **Provoke the N>1 signal** — content that invites strangers to run
   `/adopt` on their own repos and file issues; non-owner issues are the
   kill-criteria evidence the idea.md cares about.
3. **Compound the record** — the plugin's own artifacts (CHANGELOG, JOURNEY,
   evals, decision log) are the content mine; publishing them costs drafting
   time, not research time.

## Cadence

| Week | Piece | Channel | Goal | Notes |
|---|---|---|---|---|
| +1 | "What HN got right" — the best objections from launch, answered or conceded | dev.to + X thread | Installs; credibility with the ICP | Only if HN produced real discussion; else skip to +2 |
| +2 | "How the plugin governs its own repo" — dogfooding walkthrough (this launch was drafted by its own marketing agent) | dev.to + X thread | Installs; N>1 (ends with "/adopt yours") | All screenshots already exist in-repo |
| +3 | "8 evals, what they test, what they can't" — honest tour of `evals/scenarios/` | dev.to + X thread | Credibility; invites eval PRs (N>1) | Concede the compliance-vs-generalization gap explicitly |
| +4 | "/adopt field reports" — what the gap report said on N external repos | dev.to + X thread | N>1 directly | Needs volunteer repos; put the ask in weeks +1..+3 |
| ongoing | Release notes for each `/release`, with a one-post X summary | GitHub + X | Stars; keeps followers warm | Every `/release` is a content trigger — no extra work |

## Content sources

Without inventing work:

- **Each `/release`** — release notes are drafted anyway; the X one-liner is
  a two-minute repurpose.
- **Non-owner issues and questions** — every real question is a post seed,
  and answering in public does double duty (V6 feedback → messaging
  iteration: adopt the user's own words for the pain).
- **The record artifacts** — JOURNEY entries, locked decisions, and eval
  results are pre-researched material; the V0 landscape table alone is a
  standalone "map of the agent-methodology space" post.
- **Launch-day reactions** — objections worth a considered reply become the
  +1 piece.

## Repurposing

One long-form piece per week is the ceiling for a team of one, so each piece
fans out mechanically:

- dev.to post → 5–7 post X thread (the post's section headers ARE the
  thread) → one paragraph in the GitHub release notes if a release is near.
- Screenshots are shared across all variants — capture once per piece.
- No new channels until V6 review: if the funnel says HN/X/dev.to aren't
  converting to installs, propose channel experiments as ranked growth-
  mission candidates rather than adding cadence load.

---
_V6: review this table against the launch metrics each `/operate` pass;
retire pieces that don't move installs or non-owner issues._
