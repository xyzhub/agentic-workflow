# Agentic Workflow — Idea & Validation (V0)

> **Retroactive** — evidence gathered post-build (2026-07-08); this documents the
> idea the product already embodies (v1.30.0, stage V6), not pre-build validation.

## The problem

Solo builders using coding agents get speed without governance: no stage gates,
no durable record of decisions, no safety boundary on merge/deploy/spend/publish
— and quality erodes exactly as autonomy grows. **Fact:** the ecosystem's answer
to "more autonomy" is raw loops — Ralph-style overnight runs ship real features
but rely on "filesystem as memory" and exit heuristics, not review gates
([ralph-claude-code](https://github.com/frankbria/ralph-claude-code),
[Huntley's $50k MVP for ~$297 in API costs](https://yuv.ai/blog/ralph-claude-code)).
**Inference:** the coping strategies today are (a) stay hands-on and lose the
speed, or (b) go hands-off and accept ungoverned output. The pain is paid in the
owner's review time and in rework/incidents, not in money.

## Who pays

Nobody, directly — MIT OSS with no monetization path. The "payment" is the
owner's own venture velocity: one person running a portfolio of ventures
(§13 portfolio mode) with a consistent protocol, a live status page, and a
permanent decision record across all of them. **Inference:** the buyer and the
user are the same person (the repo owner); value is option value on future
ventures, not revenue. **Speculation:** if it ever monetized, comparables are
consulting/courses around methodologies (e.g. BMAD Udemy courses), not the
artifact itself.

## Why now

**Fact:** Anthropic shipped the Claude Code plugin marketplace in late 2025 and
the ecosystem exploded — thousands of skills/plugins, multiple curated
marketplaces ([awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code),
[claudemarketplaces.com](https://claudemarketplaces.com/)). **Fact:** agents are
now good enough to run unattended for hours (Sonnet-class loops ~ $10/hr metered,
cheaper on Max plans — [claudefa.st](https://claudefa.st/blog/guide/mechanics/autonomous-agent-loops)).
**Inference:** capability outran governance; the missing layer is a lifecycle
protocol that makes hands-off safe, which only became worth building once
plugins + hooks + subagents made it installable in one command.

## Landscape (retroactive competitive check)

| System | Covers | Gap this plugin fills |
|---|---|---|
| [Superpowers](https://github.com/obra/superpowers) (obra) | Dev methodology: brainstorm → plan → TDD → worktrees | Dev-loop only; no venture lifecycle (idea→launch→operate), no business/GTM agents, no owner channel |
| [BMAD-METHOD](https://medium.com/@reenbit/bmad-vs-spec-kit-vs-openspec-choosing-your-spec-driven-ai-framework-in-2026-a6996b3ebb8d) | Simulated agile team, 12+ agents, versioned artifacts | Planning-heavy, enterprise-leaning; no guardrail hooks, no post-launch V6 operate loop |
| [Spec Kit / OpenSpec](https://medium.com/@tim_wang/spec-kit-bmad-and-agent-os-e8536f6bf8a4) | Spec-as-source-of-truth for code | Spec→code only; no gates, record, or portfolio mode |
| [Ralph loops](https://github.com/snarktank/ralph) | Unattended autonomous execution | Pure throughput, no governance — the failure mode this plugin exists to fix |

**Inference:** the crowded space is dev-loop methodology; the sparse space is
*venture* lifecycle with enforced human gates. That is the positioning. No moat
beyond opinionation and dogfooded evals — everything here is forkable prose.

## The riskiest assumption

That one opinionated protocol generalizes across projects and stacks without
becoming ceremony — i.e. that the §10 project profile + local amendments are
enough adaptation, and the gate overhead pays for itself even on small projects.
If false, the plugin degrades into paperwork the agent routes around.

## Cheapest test of that assumption

Already effectively run: (1) the tier-2 eval suite — 8 LLM-judged scenarios
(`evals/scenarios/`: routing-altitude, reviewer-checkpoint, guardrail-push-block,
mission-plan, mission-batch-gate, bootstrap-profile, business-model,
adopt-existing-project) exercising the protocol against fixture repos; (2)
dogfooding — the plugin governs its own repo (this document is `/adopt fill`
output). **Fact:** both exist in-repo. **Inference:** they test protocol
*compliance*, not cross-stack generalization on third-party projects — that
part of the assumption remains only weakly tested.

## Kill criteria

- Overhead-to-value stays poor on small projects: if a `/fix`-sized change
  routinely costs more in gate/record ceremony than the change itself, stop or
  slim the protocol.
- Evals show the protocol *degrades* agent behavior (agent skips or games gates,
  quality of output falls versus a bare-agent baseline).
- `/adopt` on real external repos consistently needs heavy §10 surgery —
  generalization assumption false.

## Rough shape (one paragraph, no detail)

A Claude Code plugin (marketplace + one plugin) carrying a venture lifecycle
V0→V6 with an exit gate per stage; ~16 role agents that propose while the human
decides; guardrail hooks that fail closed on merge/deploy/spend/publish; a
records layer (CHANGELOG, JOURNEY, status page, decision log); and loop-drivable
commands so autonomy scales without losing the gates. This is what was built.

---
_Exit V0 → V1 when the human gives an explicit go, informed by the test result._
_(Retroactive note: the go was implicit — the product shipped and is at V6.)_
