---
name: plain-report
description: Write owner-facing reports a human who was NOT in the session can act on — plain words, defined terms, the action first. Cuts AI slop from every report, hand-off, status page and notification the workflow sends a person. Adapted from the "unslop" skill (cursor/plugins, github.com/cursor/plugins pstack/skills/unslop).
---

# Plain report — write for the reader who wasn't in the session

The workflow's work is judged by what a person can DO with the report. Tonight's
lesson (orderly, 2026-08-20): a correct 20-hour session handed the owner internal
shorthand — `LD-21`, `OB-6`, `S11-fix` — repeated a deadline date without ever
saying what it was for, and took two full rewrites before it said the plain
thing. The work was right; the telling was slop. This skill fixes the telling.

## Where it applies

Every surface that talks to a PERSON: orchestrator reports (`/mission`,
`/autopilot`, `/settle`, `/next`, `/check`, `/end` output), owner-channel
notifications (§12), the status page and JOURNEY (chronicler), and any DECISION
NEEDED message. It does NOT apply to commit messages (they carry a required
format), ledger rows (data — terse is correct), or code.

## The three rules that matter most here

1. **Define every id and term the first time you use it.** `OB-6` means nothing
   to the owner. Write "the split-payment log check (OB-6)" once, then `OB-6`.
   Never send a report whose nouns only make sense to someone who read the ledger.
2. **Lead with what they'd act on.** The first line is the decision or the
   action, not the preamble. "Merge PR #756 — 3 files, no app code" beats three
   paragraphs of what led there.
3. **Explain, don't repeat.** If you find yourself saying the same date or id a
   third time, you haven't explained it once. Say what it IS, then you can name it.

## Adding a voice (so it doesn't read machine-made)

- React to the facts, don't neutrally list them. If a result is bad, say it's bad.
- Vary sentence length. Some short. Some carrying a fuller thought when it earns it.
- Be specific, not vague: "guests can't pay by card — the dialog renders zero
  buttons" beats "there is a payment concern".
- First person is fine ("I got this wrong", "I recommend").

## Cut these — content

- **Puffery**: pivotal moment, testament to, evolving landscape, setting the
  stage, indelible mark, deeply rooted.
- **AI vocabulary**: additionally, crucial, delve, enhance, foster, garner,
  interplay, intricate, landscape, pivotal, showcase, tapestry, testament,
  underscore, vibrant, seamless, robust. Use the plain word.
- **Promotional adjectives**: groundbreaking, renowned, stunning, vibrant — a
  report describes, it doesn't sell.
- **Vague attribution**: "experts believe", "reports suggest" — name the source
  (the reviewer, the CI run, the log) or delete it.
- **Wordy "is" forms**: "serves as / stands as / boasts / features" → "is / has".
- **"Not just X, but Y"**: state the point directly.
- **False ranges**: "from migrations to monitoring" → list what you mean.

## Cut these — filler and hedging

- "In order to" → "to". "Due to the fact that" → "because". "In the event that"
  → "if". Delete "it is important to note that".
- Collapse stacked hedges ("could potentially possibly") to one word ("may").
- No chatbot tails: "I hope this helps", "let me know if", "certainly!".
- No "great question" — answer the thing.
- Generic endings ("in conclusion, this was a productive session") → the next
  action or a fact.

## Plain speech over jargon-as-feeling

- Mechanism over vibe: not "keeps state close at hand" but "the ledger is a git
  file every session re-reads".
- Replace abstract-metaphor nouns with the concrete thing: substrate → base,
  north star → goal, flywheel/nexus/paradigm/harness/scaffolding/primitive →
  name the actual mechanism.
- Plain words: utilize → use, leverage → use, facilitate → help, numerous →
  many, prior to → before.
- Weak adverbs → a number or a stronger verb: "significantly faster" → "40%
  faster" or the measured delta.
- Active voice: "the compiler validates queries", not "queries are validated".

## Style (prefer, not forbid, in this repo)

The repo uses tables and short bold labels for STRUCTURED STATUS (gate results,
before/after) because a table reads faster than a paragraph there — keep those.
In NARRATIVE prose, prefer periods and commas over em dashes, sentence-case
headings, straight quotes, and no decorative emoji. One idea per sentence; split
a sentence carrying three.

## Self-check before sending

Read the first line: is it the action, or preamble? Read every id: is it defined?
Read it as the owner who slept through the session: is there a word they'd have
to ask about? If yes, you're not done.
