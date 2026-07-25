---
status: semi-static
owner-agent: marketing
refresh-trigger: release
---

# {{PROJECT_NAME}} — Sales kit (index)

The index of the client-closing collateral under `docs/product/sales/`,
maintained by the `marketing` agent. Every doc here derives its **claims** from
`positioning.md` (the single source) and its **facts** from the feature → benefit
catalog (the living substrate). Nothing here is fired outward — the human owns
every client-facing action.

Docs are listed by their **deployed name** under `docs/product/sales/`.

## Kit contents

| Doc | What it's for | Tier |
|---|---|---|
| `sell-sheet.md` | One-page leave-behind: value prop → top-3 benefits → proof → price → CTA | living |
| `playbook.md` | Coaching doc: how a rep presents the product and closes | semi-static |
| `feature-benefit-catalog.md` | The living substrate: capability → client outcome, with proof + demo-moment | living |
| `objections-faq.md` | Catalogued objections and evidence-backed responses | semi-static |
| `battlecard.md` | Head-to-head vs. alternatives, including the status quo | semi-static |
| `discovery-guide.md` | Questions that surface the problem, its cost, and who decides | semi-static |
| `demo-script.md` | The choreographed live demo path, re-validated each release | semi-static |
| `proof-points.md` | The measured numbers (from the `analyst`); unmeasured stays unmeasured | semi-static |

_All kit docs now exist. Ownership matches each doc's `owner-agent` frontmatter: the
two **`living`** docs (`feature-benefit-catalog.md`, `sell-sheet.md`) are
**`chronicler`**-refreshed inside their `data:*` markers, with `marketing` filling
the benefit language; `proof-points.md` is the **`analyst`**'s (the measured
numbers); every other doc is the **`marketing`** agent's._

## How the kit fits together

- **Facts flow one way:** they enter in `feature-benefit-catalog.md` (chronicler,
  every ship) and nowhere else restates them. `sell-sheet.md` and `playbook.md`
  read the catalog; they don't re-record capabilities.
- **Claims trace to `positioning.md`.** Every benefit, every differentiator lifts
  from the messaging pillars there — the kit never invents a claim.
- **Prices trace to `business/pricing.md`.** Sales docs reference the live figure,
  never restate it.
- **Numbers trace to `proof-points.md`.** Only measured values, sourced from the
  `analyst`; an unmeasured claim stays unmeasured.

---
_Index only. The `marketing` agent authors and maintains the kit; claims come
from `positioning.md`, facts from the catalog, prices from `business/pricing.md`.
Deployed under `docs/product/sales/`._
