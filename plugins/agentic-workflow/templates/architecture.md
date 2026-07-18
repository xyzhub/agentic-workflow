# {{PROJECT_NAME}} — System Architecture

_What the `backend` and `frontend` implementers need to understand the system
they're building a slice of: the components, how data moves, and the invariants
they must not break. Owned by the `architect` — born at V1 as intent, hardened
at V2 as the skeleton goes in. **Holds only what code search can't recover**:
intent, invariants, and contracts. It points at the code index for structure and
at the decision memos for the "why" — it never re-describes the code (that's what
rots; the stale-doc rule §8 polices it). Keep it thin._

## Components
_The parts of the system and each one's single responsibility — a short list or
a sketch, not a file inventory. For "where does X live?", agents query the code
index (§10), not this doc._

- **_component_** — _what it's responsible for; what it must NOT own._

## Data flow
_How a representative request/event moves through the components — the path and
the boundaries it crosses. One or two core flows, not every endpoint._

## Data model
_The canonical entities, their relationships, and the **invariants** that must
always hold (e.g. "an order always has ≥1 line item"; "balances never go
negative"). This is the living result; the *decision* that produced it lives in
the architect's option memo (link it). Additive-only migrations by default._

→ _decision: `docs/product/decisions/<date>-data-model.md`_

## Invariants & cross-cutting rules
_The rules any implementer — especially two working in parallel — must preserve:
auth/authorization model, tenancy/isolation, idempotency expectations, error and
retry semantics, the fail-closed config guard. These are the things a slice can
silently violate; name them so it can't._

## Key decisions
_Pointers to the architect's option memos (`docs/product/decisions/`) for stack,
storage, sync strategy, and other shape-before-build choices — so the rationale
is one hop away without being copied (and going stale) here._

## The seams
_Where the system is deliberately cut for parallel work, and where the contract
between the two sides lives — see `docs/product/interface-contract.md`._

---
_The `architect` authors and maintains this; implementers read it before
building and honor its invariants; the `reviewer` checks changes against them.
Any session that catches this doc lying about the system fixes it in the same PR
(§8). It records intent and contracts — never a re-narration of the code._
