# Agentic Workflow — Pricing Strategy

> **Retroactive (2026-07-08) — decisions pending the human.** Current price is
> free (MIT) by design; this document records that and holds the optional
> monetization backlog. **The human sets any live price.**

## Competitive anchor

Direct comparables charge nothing for the artifact: Superpowers, BMAD, Spec
Kit, Ralph loops are all free OSS (**fact**, idea.md landscape). Where money
changes hands in this space it is adjacent to the artifact — e.g. BMAD-style
Udemy courses and methodology consulting (**speculation**, flagged as such in
idea.md). A priced plugin would sit alone above a $0 field with no moat;
staying at $0 matches both the field and the internal-leverage model.

## Tiers

| Tier | Price | For whom | Includes | Excludes (and why) |
|---|---|---|---|---|
| Free (only tier) | $0 — MIT | Anyone; primarily the owner's portfolio | Entire plugin: agents, commands, hooks, templates, evals | Nothing — no paid tier exists or is planned |

Users bear their own Claude API/token costs; the plugin adds no charge on top.

## Rationale

The value metric is the owner's venture velocity, not user revenue
(business-model.md); charging would add friction to the one-command install
without funding anything the model needs (cost to serve ≈ $8.60/release,
measured). **Strongest argument against $0:** it forfeits any adoption-driven
income and any price signal about external willingness-to-pay, and unpaid
external users can still generate support burden. The model accepts this
because external adoption is optional, not load-bearing.

## Decision

**LOCKED 2026-07-08 (owner): monetization deferred.** Free, MIT, no
monetization — confirmed as the deliberate model, not an implicit default.
The backlog below is reference material, not a plan. Grandfathering stays
trivial: MIT is irrevocable for shipped versions — any future paid layer must
be additive, never a re-license of what exists.

_Revisit trigger: the N>1 signal (non-owner users filing issues / measurable
external adoption per `launch-plan.md` metrics) — until then, do not re-raise._

## Experiment backlog (V6) — deferred, reference only

Ranked candidates — **deferred per the 2026-07-08 lock**; each would be a
growth-mission candidate if the revisit trigger fires. All spending/publishing
sits with the human.

1. **Keep it free as top-of-funnel for the owner's ventures.**
   *Hypothesis:* the plugin's public quality earns attention that transfers to
   the ventures it governs. *Test:* add a JOURNEY/status-page footer linking
   the portfolio; watch referral traffic. *Metric:* clicks-through per install.
   *For:* zero friction, compounds with the internal-leverage model.
   *Against:* attribution is fuzzy; the funnel only works if ventures are
   public.
2. **GitHub Sponsors.**
   *Hypothesis:* a nonzero number of users will sponsor maintenance.
   *Test:* enable Sponsors, add a README badge — near-zero effort.
   *Metric:* sponsors after 60 days. *For:* costs nothing, first real
   willingness-to-pay signal. *Against:* N≈1 known user today; a $0 result is
   likely and tells us little at this traction level.
3. **Paid setup/support (fixed-fee `/adopt` of a client repo).**
   *Hypothesis:* teams will pay for hands-on adoption more than for the
   artifact. *Test:* one landing paragraph + a "book adoption" link; sell one
   engagement. *Metric:* one paid engagement in 90 days. *For:* matches where
   money actually flows in this space (services, per idea.md speculation);
   doubles as the cross-stack generalization test. *Against:* sells owner
   hours — the exact resource the model exists to save.
4. **Hosted registry / portfolio dashboard (paid SaaS layer).**
   *Hypothesis:* multi-venture operators would pay for a hosted §13 registry
   with live status pages. *Test:* a mock screenshot + waitlist before any
   build. *Metric:* waitlist signups from real operators. *For:* the only
   candidate with recurring-revenue shape; additive to the MIT core.
   *Against:* creates real cost-to-serve and an ops burden the current model
   deliberately avoids; premature at N≈1.
