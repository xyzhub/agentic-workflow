# Agentic Workflow — Business Model

> **Retroactive (2026-07-08) — decisions pending the human.** Drafted post-build
> (v1.30.0, stage V6) to document the model the product already operates under,
> not to propose a new one. Evidence inherits from `docs/product/idea.md`.

## Value proposition

Governed autonomy for a solo builder running coding agents: a venture lifecycle
(V0→V6) with enforced human gates, a durable decision record, and a safety
boundary on merge/deploy/spend/publish — against the alternative of raw
autonomous loops (Ralph-style) that trade governance for throughput, or
dev-loop-only methodologies (Superpowers, BMAD, Spec Kit) that stop at code
(**fact:** landscape cited in idea.md). The buyer and the user are the same
person: the repo owner.

## Value metric

**The owner's venture velocity**, not revenue. Concretely: ventures governed
per unit of owner attention — each portfolio project registered in the §13
registry that runs the protocol with a live status page and a permanent
decision record (**inference**, from idea.md "Who pays"). Usage that scales
with value: number of registered ventures × stages traversed with gates intact.

## Revenue model

**Internal leverage (deliberately $0).** This is MIT OSS with no monetization
path by design — the plugin is the operating system for the owner's venture
portfolio, and its return is option value on every future venture, not income.
Alternatives considered and rejected for now:

- *Paid plugin / license* — kills the one-command install that makes it usable,
  and everything here is forkable prose (idea.md: "no moat beyond opinionation
  and dogfooded evals").
- *Hosted service* — nothing to host yet; the artifact is prompts + hooks that
  run in the user's own Claude Code.

Optional future monetization candidates live strictly as an **experiment
backlog in `pricing.md`** — enumerated, ranked, deferred.

_Decision status: **LOCKED 2026-07-08 (owner)** — free, MIT, monetization
deferred; the internal-leverage model IS the model. Revisit trigger: external
adoption signal (see `pricing.md`)._

## Cost to serve

| Cost | Amount | Basis |
|---|---|---|
| Repo hosting (GitHub, public) | ~$0 | **Fact** — free tier |
| Tier-1 lint CI | ~$0 | **Fact** — GitHub Actions free for public repos |
| Per-user API tokens | $0 to the owner | **Fact** — each user's Claude Code runs on their own key/plan |
| Tier-2 eval validation | **~$8.60 per release** (8 LLM-judged scenarios) | **Measured** — the only real cost of serving the public artifact |
| Owner maintenance time | Unmeasured | **Assumption** — the true dominant cost; paid in attention, not money |

## Unit economics

Revenue per user: $0. Marginal cost per additional user: ~$0 (users bear their
own token spend). The honest math is therefore not price − cost but
**leverage − maintenance**: the model works while the protocol saves the owner
more review/rework time across the portfolio than releases cost to maintain
(~$8.60 + owner hours per release). If gate ceremony ever costs more than it
saves on small changes, the model fails — that is the V0 kill criterion, not a
pricing problem.

## Assumptions to test

1. **Portfolio leverage is real** — the protocol measurably reduces owner
   review/rework across ≥2 registered ventures. Cheapest test: run `/adopt` on
   a second real venture and compare gate overhead to incidents avoided.
2. **N>1 adoption is optional, not load-bearing** — the model survives even if
   the owner stays the only user. Cheapest test: none needed; but if external
   users appear, GitHub stars/installs become a free signal for the pricing
   backlog.
3. **Maintenance stays sub-linear** — releases stay cheap (~$8.60 evals + small
   owner time) as the protocol grows. Cheapest test: track eval cost and
   release cadence over the next 3 releases.
