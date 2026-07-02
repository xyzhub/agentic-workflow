---
name: protocol
description: The project's agentic operating protocol — how to route, build, review, ship, and document work from idea to viable product. Use at the start of ANY substantive work session, when routing a new request (fix vs. feature vs. mission), when unsure how this project wants work done, or when the user mentions the workflow, the lifecycle, a checkpoint, a session, or a mission. Establishes the venture stages and the four quality-pillar gates (UX, DX, Security, Efficiency).
---

# Agentic Workflow — operating protocol

This project uses the Agentic Workflow: one agentic protocol that carries work
from a raw idea to a launched, viable product, with UX, DX, Security, and
Efficiency enforced as gates.

## Read the protocol first

1. If the project has **`docs/WORKFLOW.md`**, that is the authoritative
   protocol (it carries the project profile and any local amendments). Read it.
2. Otherwise read the bundled master at
   `${CLAUDE_PLUGIN_ROOT}/templates/WORKFLOW.md` — and if this looks like a fresh
   or unbootstrapped project, offer to run **`/init-workflow`**, which detects the
   stack and writes the project's own `docs/WORKFLOW.md`, status page,
   CHANGELOG, JOURNEY, and (at V0) an idea template.

## The three things to do every time

1. **Name the stage, then route the work.** Venture stages V0–V6 (idea →
   definition → foundation → build → hardening → launch → operate) say what the
   *project* needs next; the altitudes (task / session / mission) say how to do the
   *piece in front of you*. Bigger-than-one-sitting work becomes a mission trio
   under `.plans/` — author and drive it with the bundled `/mission` command
   (which spawns the `planner` agent).
2. **Treat the four pillars as gates**, checked at every checkpoint by the
   `reviewer` agent (fresh context) and audited before launch. Never let the UI
   claim what the backend can't confirm; fail closed on missing security config;
   keep the repo cloneable-and-shippable same-day; measure before you optimize.
3. **Keep the record at session close.** Spawn the `chronicler` agent to update
   CHANGELOG.md, docs/product/JOURNEY.md, and the live owner status page
   (docs/product/overview.html), then republish the status artifact.

## Guardrails already active

Hooks block pushing to the default branch, remind about commit format and gates,
and nudge docs updates on high-impact files. The human owner is the only
merge/deploy authority — never merge the default branch yourself.

For anything not covered here, the full protocol (altitudes, session lifecycle,
mission checkpoints, roles, definition of done) is in the project's
`docs/WORKFLOW.md` or the bundled `templates/WORKFLOW.md`.
