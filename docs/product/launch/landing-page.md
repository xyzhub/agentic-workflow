# Agentic Workflow — Landing Page (V5)

> **Retroactive draft.** For an MIT OSS plugin, the GitHub README **is** the
> landing page — most of this copy exists to sharpen the README's top screen.
> The outline below also works as a single-page GitHub Pages site if the owner
> ever wants one; hand it to `frontend` with the brand tokens then. Copy
> inherits `positioning.md`; nothing promised here that v1.30.0 doesn't ship.
> Voice is a best guess (no flight plan) — plain, technical, first-person.

## Hero

**Headline** (pillar 1, sharpest form):

> Autonomous agents. Human gates. Nothing ships without you.

**Subline**:

> Agentic Workflow is a Claude Code plugin that carries a project from raw
> idea to operated product — V0→V6, an exit gate on every stage, guardrail
> hooks that fail closed, and a permanent record of every decision. Agents
> prepare; you fire.

**Primary action**:

```
/plugin marketplace add xyzhub/agentic-workflow
/plugin install agentic-workflow@xyz
```

Then: `/adopt` in an existing project, `/autopilot "<idea>"` for a new one,
`/next` if you're lost.

## Proof

Evidence, not adjectives:

- **It governs itself.** This repo runs on its own protocol — the idea doc,
  this launch plan, the CHANGELOG/JOURNEY/status page are all its own output.
  Link the repo's `docs/` as the live specimen.
- **Evals in the open.** 8 LLM-judged scenarios (`evals/scenarios/`) exercise
  the protocol against fixture repos: gate routing, reviewer checkpoints,
  guardrail push-blocking, mission planning, adoption. State plainly what
  they test (protocol compliance) and what they don't (third-party repos).
- **Concrete machinery, not vibes.** Screenshot or paste: the guardrail hook
  blocking a push to main; the owner-channel gate arriving on a phone with
  tap-to-decide buttons; a `.plans/` mission ledger mid-loop.
- **v1.30.0, 30 releases in.** Not a launch-day prototype — link the
  CHANGELOG.

## Objections answered

Honestly, per the positioning's "what we do NOT claim":

1. **"Isn't this just ceremony? I have a Ralph loop that ships."**
   Ralph-style loops ship real features — that's in our own research. The
   question is what happens at merge, deploy, spend, and publish. If a
   `/fix`-sized change ever costs more in gate ceremony than the change
   itself, that's our own kill criterion — the protocol is meant to be
   slimmed, not worshipped. `/fix` and `/start`→`/end` are deliberately
   lightweight.
2. **"How is this different from Superpowers / BMAD / Spec Kit?"**
   Those are dev-loop methodologies — brainstorm→plan→TDD, spec→code. This is
   a venture lifecycle: idea validation, brand, business model, launch, and
   V6 operations are stages with agents and gates, not afterthoughts. Use
   both if you like; they solve different layers.
3. **"What's the catch? What's the moat?"**
   None and none. MIT, no monetization path, and everything here is forkable
   prose — the value is the opinionation and the dogfooded evals. If you fork
   it and keep the gates, it worked.

## Final call to action

Same action as the hero, no competing asks:

> Install it, run `/adopt` on a repo you already have, and read the gap
> report it hands you. That's the whole pitch.
