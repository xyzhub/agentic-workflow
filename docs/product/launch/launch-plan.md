# Agentic Workflow — Launch Plan (V5 index)

The index of all launch deliverables under `docs/product/launch/`, drafted by
the `marketing` agent. Everything is publish-READY, not published — the human
owns every outward action.

> **Retroactive draft** (`/adopt fill`, 2026-07-08). The plugin is already
> public on a marketplace at **v1.30.0** and has never been announced. This is
> an **awareness launch of the v1.30 era**, not a first release — the frame in
> every asset is "this exists, it's mature, here's why it's different," not
> "we just shipped."

> **⚠ VOICE IS A BEST GUESS — NO FLIGHT PLAN EXISTS.** There is no
> `docs/product/flight-plan.md` "Channels & voice" section to inherit from.
> All drafts assume the owner's register is **plain, technical, first-person,
> no marketing-speak** — inferred from the README and idea.md. The owner
> should read every draft as a voice proposal, not a voice match, and correct
> freely before publishing.

## Deliverables

| File | Contents | Status |
|---|---|---|
| `positioning.md` | Positioning statement, ICP, messaging pillars (source of truth) | Draft |
| `landing-page.md` | Landing-page outline + copy (README-first; optional pages site) | Draft |
| `announcements/github.md` | v1.30.0 release notes + README badge/one-liner | Draft |
| `announcements/hacker-news.md` | Show HN title + text | Draft |
| `announcements/x.md` | X/Twitter thread | Draft |
| `announcements/dev-to.md` | Long-form post (dev.to / blog) | Draft |
| `content-plan.md` | Post-launch content cadence (V5 → V6 bridge) | Draft |

## Channel plan

Realistic for a team of one: one channel per day-slot, GitHub first so every
other link lands somewhere finished. **Owner** is the human for every row —
the agent drafts, the human publishes (safety boundary §11).

| Channel | Asset | Owner | When |
|---|---|---|---|
| GitHub (release notes + README badge) | `announcements/github.md` | human | Launch day, first — everything else links here |
| Hacker News (Show HN) | `announcements/hacker-news.md` | human | Launch day, morning US time |
| X/Twitter (thread) | `announcements/x.md` | human | Launch day, after the HN post is live |
| dev.to / blog (long-form) | `announcements/dev-to.md` | human | +2 days (rides or restarts the launch-day wave) |

## Launch metrics

The few numbers that say the awareness launch worked, and where to read them:

| Metric | Why it matters | Where to read it |
|---|---|---|
| Marketplace installs | Awareness converted to trial | Marketplace stats if exposed; else proxy via repo traffic (Insights → Traffic → clones/views) |
| GitHub stars | Reach + baseline interest, over the pre-launch baseline | Repo star count / star history |
| **Issues opened by non-owner users** | **The N>1 signal** — the idea.md kill criteria hinge on `/adopt` working on real external repos; a stranger filing an issue means a stranger actually ran it | GitHub Issues, filter out owner |

Record the pre-launch baseline for all three before publishing anything.
V6 (`/operate`) reviews the funnel against these numbers; non-owner issues
also feed the "generalization" assumption test directly.

---
_Exit: assets reviewed, human has published (or consciously deferred) each
channel row. V6 reviews the funnel against the metrics above._
