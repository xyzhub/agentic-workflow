# linkbox — Idea & Validation (V0)

## The problem
Developers and researchers hoard hundreds of browser bookmarks that become
unfindable. Existing complaints: r/datacurator threads on bookmark rot
(recurring, 200+ upvotes), Hacker News "what do you use for bookmarks"
threads resurface quarterly. Current coping: browser folders (unsearchable at
scale), Notion databases (manual, slow capture).

## Who pays
Individual professionals (the user IS the buyer). Evidence of willingness to
pay in this category:
- Raindrop.io Pro: **$8/user/mo** (annual) — cited as the polished incumbent.
- Pinboard-style one-time/archival services: ~**$12/yr** historically, users
  publicly lament its decline and ask for a successor.
- Self-hosted Linkding managed hosting sells at ~**$6/mo** — people pay to NOT
  self-host even when the software is free.
Terminal-first developers are underserved: none of the above has a first-class
CLI capture flow.

## Why now
CLI-first tooling renaissance (gh, fzf ecosystems); AI tagging makes
auto-organization cheap (~$0.001/link at current haiku-tier pricing).

## The riskiest assumption
Developers will pay for bookmark management at all when free browser sync
exists — the willingness-to-pay evidence above is from adjacent segments, not
CLI-first developers specifically.

## Cheapest test of that assumption
Landing page with a $5/mo waitlist pre-order against the CLI demo GIF; 30
sign-ups from 1k targeted visitors = proceed.

## Kill criteria
<1% pre-order conversion from qualified traffic, or discovery interviews show
capture friction (not retrieval) is the real pain.

## Rough shape (one paragraph, no detail)
A CLI-first link saver: `lb add <url>` auto-tags with a cheap model, `lb find
<query>` searches full-text; web view read-only in v1. Sync via the user's own
git repo (differentiator: no lock-in, from the Linkding-hosting evidence).

---
_Exit V0 → V1: human GO given 2026-06-28 after pre-order test hit 3.4%._
