# Agentic Workflow — Executive Summary

> **Retroactive (2026-07-08) — decisions pending the human.** Written post-build
> to make the venture legible as it IS.

**Stage**: V6 (operate) · **Last refreshed**: 2026-07-08

## The problem

Solo builders using coding agents get speed without governance: no stage gates,
no durable decision record, no safety boundary on merge/deploy/spend/publish.
The ecosystem's answer to more autonomy is raw loops (Ralph-style overnight
runs) — real output, no review gates. The pain is paid in owner review time and
rework, not money (idea.md, V0 evidence).

## The solution

A Claude Code plugin marketplace hosting one plugin: a venture operating
protocol, V0→V6, with an exit gate per stage; ~16 role agents that propose
while the human decides; guardrail hooks that fail closed on
merge/deploy/spend/publish; a records layer (CHANGELOG, JOURNEY, status page,
decision log); and loop-drivable commands so autonomy scales without losing
the gates. Shipped at v1.30.0; installable in one command.

## Market & timing

The Claude Code plugin marketplace shipped late 2025 and the ecosystem exploded
(thousands of skills/plugins, multiple curated marketplaces — idea.md, cited).
The crowded space is dev-loop methodology (Superpowers, BMAD, Spec Kit); the
sparse space this occupies is *venture* lifecycle with enforced human gates.

## Business model

**Internal leverage, deliberately $0**: MIT OSS whose return is the owner's
venture velocity across a §13 portfolio, not revenue. Cost to serve ≈ nil plus
~$8.60/release in eval validation (measured). Details in `business-model.md`.

## Pricing

Free (MIT). **Monetization deferred — locked 2026-07-08 (owner)**; future
candidates exist only as a reference backlog in `pricing.md`, revisited only
on an external-adoption signal.

## Traction & status

Honest count: **N≈1 known user — the owner.** Published as a public marketplace
plugin; governs its own repo (dogfooded); tier-1 lint in CI, tier-2 eval suite
(8 scenarios) gating releases. No revenue, by design. No external adoption
signal yet measured.

## Risks & open questions

1. **Ceremony risk** — gate overhead may exceed value on small projects (the V0
   kill criterion). Plan: watch `/fix`-sized changes; slim the protocol if
   ceremony dominates.
2. **Generalization untested** — evals test compliance, not cross-stack use on
   third-party repos. Plan: `/adopt` on real external repos; heavy §10 surgery
   falsifies the assumption.
3. **Bus-factor / maintenance** — one owner, forkable prose, no moat. Plan:
   accept it; the model doesn't depend on defensibility, only on owner leverage.
