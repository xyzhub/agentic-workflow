# Announcement — dev.to / blog (long-form)

**Channel**: dev.to (cross-post to a personal blog if one exists; canonical
URL on whichever is home).
**Voice**: plain, technical, first-person, essay register — **best guess, no
flight plan exists**; owner corrects before publishing.
**Format constraints**: markdown; dev.to front matter (title, tags ≤ 4);
1,200–1,800 words reads best; code blocks and screenshots welcome. Publish
+2 days after launch day.

## Draft (ready to paste)

```markdown
---
title: Autonomy needs gates — a venture lifecycle for Claude Code
published: false
tags: ai, claudecode, agents, opensource
---

Coding agents got good enough to run unattended for hours. Ralph-style
overnight loops genuinely ship features — the famous example built a $50k
MVP for roughly $297 in API costs. What they don't have is a review gate
between the loop and your main branch, your deploy target, or your credit
card.

That's the trade every solo builder with an agent has felt: stay hands-on
and lose the speed, or go hands-off and accept ungoverned output. I got
tired of picking, so I built the governance layer as a Claude Code plugin.
It's been public for a while at v1.30.0 and governs its own repo; this post
is its first proper announcement.

## The gap: everything stops at code

The methodology space for agents is crowded — but it's crowded at one layer.
Superpowers gives you brainstorm → plan → TDD → worktrees. BMAD simulates an
agile team with a dozen agents. Spec Kit makes the spec the source of truth
for code. Ralph loops give you raw unattended throughput.

All of it is the dev loop. None of it answers: was this idea validated
before we built it? Who decided the pricing? What are the launch claims,
and do they trace to shipped behavior? Who's watching errors and costs
after launch? And above all — what is the agent *not allowed to do* without
a human?

## What Agentic Workflow does instead

It carries a project through a venture lifecycle — V0 idea → V1 definition
→ V2 foundation → V3 build → V4 hardening → V5 launch → V6 operate — with
an exit gate on every stage and four pillar gates (UX, DX, Security,
Efficiency) at every checkpoint.

Around sixteen role agents each own a slice: a `researcher` validates the
idea with cited evidence for AND against; an `architect` writes
stack-decision memos; a `business` agent proposes the model; a `marketing`
agent drafts launch assets; `ops` and `analyst` run the post-launch loop.
The constant across all of them: **agents propose, the human decides.**

Three rules cover 90% of safe usage, and hooks enforce them fail-closed:

1. Agents never merge to main (unless your project profile delegates it).
2. Agents never deploy or spend.
3. Agents never publish outward. They prepare; you fire.

This very post is an example — drafted by the marketing agent into the
repo, published by me, because publishing is on the safety boundary.

## Unattended, but governed

The part I use most: everything is loop-drivable. Missions decompose into a
`.plans/` trio where the planner explores once so execution sessions never
do; the ledger is the state, so a recurring `/loop /mission "<name>"
continue` executes one brief per tick in a fresh context. No transcript
bloat, crash-safe by construction.

And the gates don't block silently while you're away. A private
Telegram/Slack owner channel sends gate/alert/digest notifications out, and
takes decisions back in — inline buttons on Telegram, emoji reactions on
Slack — nonce-bound, identity-pinned, fail-closed, every decision landing in
the decision log. Action gates (merge, deploy, spend, publish) always carry
a link instead: you fire those where they live.

There's also a portfolio mode: one registry repo lists every venture, and
`/operate` run there sweeps all of them into one report with a single
cross-venture backlog.

## The honest part

It's MIT and there is no moat — the whole thing is forkable prose plus
opinionation plus a dogfooded eval suite. The 8 LLM-judged eval scenarios
in the repo test protocol *compliance* (does the agent route to the right
altitude, does the reviewer checkpoint fire, does the push-block hold), not
cross-stack generalization on repos I've never seen.

That generalization is the riskiest assumption, and I've written kill
criteria for it: if a `/fix`-sized change routinely costs more in gate
ceremony than the change itself, or `/adopt` on real external repos
consistently needs heavy profile surgery, the protocol gets slimmed or
stopped. So the most valuable thing a reader of this post can do is also
the cheapest:

```
/plugin marketplace add xyzhub/agentic-workflow
/plugin install agentic-workflow@xyz
/adopt
```

`/adopt` bootstraps the profile from your existing repo, converts whatever
plans you already have, audits the repo against its stage's gates, and
hands you one adaptation report ranked by risk. If the report is wrong for
your stack, open an issue — issues from people who aren't me are exactly
the signal this project needs.
```

## Notes for the publisher

- Set `published: true` and add the canonical URL before posting; verify
  the marketplace slug and repo link.
- Drop in two screenshots where they fit: the push-block hook firing, and a
  phone gate with tap-to-decide buttons.
- If the HN thread produced good objections, fold the best one into "The
  honest part" before publishing — the +2 day slot exists for that.
- The $50k/$297 figure is the ecosystem's citation (yuv.ai Ralph writeup),
  not ours — keep it attributed to Ralph, never to this plugin.
