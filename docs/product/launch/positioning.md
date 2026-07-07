# Agentic Workflow — Positioning (V5)

> **Retroactive draft** (`/adopt fill`, 2026-07-08). The product is already
> public at v1.30.0 and was never announced; this positions an *awareness*
> launch of the v1.30 era, not a first release. Every other launch asset
> derives from this file. Claims trace to `docs/product/idea.md` (V0 research)
> or to shipped behavior in `plugins/agentic-workflow/README.md`.

## Positioning statement

For **solo builders running Claude Code agents on real projects** who **get
speed without governance — no stage gates, no durable decision record, no
safety boundary on merge/deploy/spend/publish**, Agentic Workflow is a
**Claude Code plugin carrying a full venture-lifecycle protocol (V0 idea → V6
operate)** that **makes hands-off agent work safe: every stage has an exit
gate, guardrail hooks fail closed, and everything lands on a permanent
record**. Unlike **dev-loop methodologies (Superpowers, BMAD, Spec Kit) and
raw autonomous loops (Ralph)**, it **covers the whole venture — idea
validation, brand, business model, build, launch, operations — with enforced
human gates, an owner channel with tap-to-approve, loop mode, and portfolio
mode across many ventures**.

## Ideal customer profile (ICP)

From the V0 research, not aspiration:

- **Who**: solo builders and very small teams already running Claude Code —
  specifically the crowd experimenting with unattended agent loops
  (Ralph-style overnight runs) and methodology plugins (Superpowers, BMAD,
  Spec Kit). They have felt the trade the research names: stay hands-on and
  lose the speed, or go hands-off and accept ungoverned output.
- **Where they gather**: Hacker News, X/Twitter (the Claude Code / agentic
  coding community), `awesome-claude-code` and the plugin marketplaces
  (claudemarketplaces.com), dev.to and personal blogs about agent loops.
- **What they use today**: bare Claude Code, Ralph-style loop scripts,
  Superpowers/BMAD/Spec Kit for the dev loop. All free/OSS — so is this
  (MIT); the competition is for attention and adoption, not dollars.
- **Who pays**: nobody, by design. The value is the owner's venture velocity
  and option value across future ventures (idea.md, "Who pays").

## Messaging pillars

Three claims; everything else derives from these. Each traces to shipped
behavior (README v1.30.0) or the V0 research.

### 1. Governance at autonomy speed

The ecosystem's answer to "more autonomy" is raw loops — throughput with no
review gates (idea.md, landscape). This plugin is the missing layer: an exit
gate on every lifecycle stage, four pillar gates (UX/DX/Security/Efficiency)
at every checkpoint, and guardrail hooks that **fail closed** on pushes to
the default branch and unauthorized merges. Three rules cover 90% of safe
usage: agents never merge to main (unless the profile delegates it), never
deploy or spend, never publish outward — **they prepare, you fire**.

### 2. A venture lifecycle, not a dev loop

Superpowers, BMAD, and Spec Kit stop at code. This carries a project from
raw idea to operated product: V0 validation (`researcher`, cited evidence for
and against), V1 shape (`architect`, `designer`, `business`), V2–V4
build-and-harden with independent review, V5 launch (`marketing` — the human
publishes), V6 operate (`ops`, `analyst`, `/operate`). ~16 role agents that
propose while the human decides, plus a permanent record: CHANGELOG, JOURNEY,
live status page, decision log.

### 3. Built to run unattended — and still governed

Everything is loop-drivable: the ledger is the state, so `/loop /mission
continue` or `/loop /autopilot continue` executes one brief per tick in a
fresh context, crash-safe by construction. The owner channel
(Telegram/Slack) brings gates to your phone — tap-to-decide, nonce-bound,
identity-pinned, fail-closed — while action gates (merge/deploy/spend/
publish) always carry a link so the human fires them where they live.
Portfolio mode (§13) runs one owner across many ventures with a single
cross-venture `/operate` sweep.

## What we do NOT claim

Marketing inherits the research's honesty:

- No moat — "everything here is forkable prose" (idea.md). Say it plainly.
- The evals (8 LLM-judged scenarios) test protocol *compliance*, not
  cross-stack generalization on third-party repos — that assumption is only
  weakly tested. Do not claim "proven on external projects."
- No revenue, no monetization path, no promise of one.
- Cost/speed numbers (e.g. the "$50k MVP for ~$297" Ralph story) belong to
  the ecosystem citation, not to this product. Cite, don't appropriate.
