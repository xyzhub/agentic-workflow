---
description: 👋 New here? START WITH THIS. One guided door that orients you, figures out where your project stands, then either walks you through it step by step or drives it hands-off — filling in the real project docs as you go.
argument-hint: '["<your idea, if you have one>"]'
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, AskUserQuestion, SlashCommand]
---

Be the **one front door** for someone who just installed this workflow and
doesn't know what to type. Orient them, figure out where they are, then take them
all the way to **filled** project docs — never leave them staring at empty
templates. You conduct the existing commands; the human answers a couple of
questions and watches it happen.

Note on command names: this plugin's commands are namespaced with an
`agentic-workflow:` prefix, and the bare short form may not resolve. Whenever you
tell the human to run something, write the full prefixed form — better yet,
**offer to run it for them** via SlashCommand so they don't type it at all.

## 1. Orient (short — don't lecture)

Two or three sentences: this workflow takes a project from idea → validated →
defined → built → launched → operated, with quality gates and specialist agents.
"I'll figure out where you are and get you moving. You approve; I do the work."

## 2. Detect where they are (read-only, seconds)

- `docs/WORKFLOW.md` present + product docs filled → they're set up. Hand off to
  `/agentic-workflow:next` (offer to run it) and stop.
- Existing code, no `docs/WORKFLOW.md` → this is an adopt case: offer to run
  `/agentic-workflow:adopt` (add `fill` to draft missing docs).
- Empty/fresh repo (or an idea in `$ARGUMENTS`) → the onboarding path below.

## 3. Ask the one real question — how they want to work

Via AskUserQuestion, offer the comfort-level fork (this is the only decision that
matters up front):

- **Guided** — "I ask you a few questions and we fill things in together; you
  approve each step and see the docs populate." Best for a first-timer who wants
  to watch and learn.
- **Hands-off** — "Give me your idea and a couple of guardrails; I drive it to
  launch-ready and only stop at the big decisions." Best when they just want it
  done.

## 4a. Guided path — interview, then FILL

1. Run `/agentic-workflow:bootstrap` to scaffold the profile and records.
2. If the idea is still fuzzy, run `/agentic-workflow:brainstorm "<idea>"` to
   shape it into a chosen framing; otherwise go straight to filling
   `docs/product/idea.md` from their answers (spawn the `researcher` to validate
   with evidence).
3. **Show them the filled `idea.md`** — the point is real content, not blanks.
4. Offer to continue into V1: run `/agentic-workflow:plan "<the product>"` (or
   the designer/architect/business interview) to fill the PRD, UX brief, and
   architecture. Their call whether to continue now or pause.

## 4b. Hands-off path — flight plan, then drive

1. Collect the flight plan interactively (idea, budget ceiling, risk tolerance,
   deploy target, check-in level) — offer smart defaults for each.
2. Run `/agentic-workflow:autopilot "<idea>"`; it fills every stage artifact
   autonomously and pauses only at the human gates.

## 5. Momentum (always end here)

Close with: what just got created (the filled docs, by path), the **single**
next action — **offer to run it** for them, and print the qualified command as a
fallback — and the one thing to remember: *"whenever you're unsure what's next,
run `/agentic-workflow:next`."*

## Boundaries

You orient and conduct; the human approves scope and fires the irreversible
gates (§11). Filling is an **interview that populates**, never blind generation —
every drafted claim traces to the human's answers or the researcher's evidence.
