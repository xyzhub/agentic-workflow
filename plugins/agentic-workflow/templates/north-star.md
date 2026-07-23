# {{PROJECT_NAME}} — North star

The one durable statement of **where this is going and why**, so work can be
judged on whether it *advances the end-goal* — not just whether it shipped. Thin
by design: this holds purpose + what counts as progress + a live done-vs-roadmap
rollup, and points at the detailed "what" rather than restating it. The `compass`
agent reads this at every strategic beat and maintains the rollup; the **human
owns the Purpose**.

## Purpose (human-owned)

_1–2 sentences, stable across missions: the worthy end-goal all work must serve.
Who is better off, and how, when this succeeds. Change this rarely and only
deliberately — `compass` judges trajectory against it but never edits it._

## Definition of worthy progress

_What "advancing the goal" actually means here — the criteria `compass` measures
trajectory against. Name the anti-goals too: work that looks like motion but does
not serve the Purpose (scope the venture deliberately refuses, detours that don't
compound, polish on a part users don't reach yet)._

- Advances the goal when: …
- Does **not** count (anti-goals): …

## Done vs roadmap (live rollup — `compass` maintains)

_The current trajectory at a glance. `compass` refreshes this at each strategic
beat from the ledger and roadmap; it is the baseline drift is measured against.
For the detailed "what", see `docs/product/idea.md` and the PRD — do not restate
them here._

- **Shipped** — what's live and serving the Purpose: …
- **In flight** — the mission/slice underway now: …
- **Next** — the nearest worthy step (not the full backlog): …
- **Cut / out of scope** — explicitly dropped or deferred, and why (so it isn't
  silently revived): …

---
_Purpose is the human's; the rollup is `compass`'s standing output. The "what"
lives in `docs/product/idea.md` / the PRD; tactical state lives in the ledger
(`.plans/*.state.md`). This doc holds only direction._
