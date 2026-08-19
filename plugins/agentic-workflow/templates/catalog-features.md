---
status: living
owner-agent: chronicler
refresh-trigger: every-ship
---

# {{PROJECT_NAME}} — Feature catalog (curated: what the product IS)

_One row per capability, **rewritten in place** when it changes — never appended.
History belongs to CHANGELOG/JOURNEY; this file is current state. Deploys to
`docs/product/catalog/features.md` next to the derived `api.md` /
`data-model.md` / `README.md` (`node tools/catalog.mjs`). WORKFLOW.md §6.1._

## The contract

- **Two hands.** The `chronicler` writes every column except **Benefit** — at
  checkpoints and `/agentic-workflow:end`, from the merged diff, PR-cited. The
  `marketing` agent fills **Benefit** (evidence-gated "so you can…" language,
  framed from `positioning.md`) and nothing else; `_unwritten_` is the hand-off
  sentinel between the two beats. Neither hand ever writes a claim into
  "Current behavior" — that column states what the code does today.
- **Rewrite, don't append.** A changed capability gets its row edited: `Status`
  → `changed` until the next release note lands, then `live`; `Last change` →
  the new PR + date; behavior text replaced. A removed capability keeps its row
  with `Status: removed` and the removing PR — so nothing that once existed
  silently vanishes — and drops `Marketable` to `no`.
- **Anchors must resolve.** Every row names the code that implements it, in
  backticks: `GET /api/…` or `/api/…` (routes in `api.md`), `Model` /
  `Model.field` (in `data-model.md`), and file paths (`app/…`, `server/…`).
  `node tools/catalog.mjs --verify` fails on any anchor that no longer
  resolves — the reviewer and `/agentic-workflow:groom` run it. A row with no
  anchors is a claim, not a catalog entry.
- **Marketable rows are the marketing source.** Landing page, launch assets,
  the sales kit's `data:capabilities` and "What's new" draw facts **only** from
  rows with `Marketable: yes` and `Status: live` (What's new = rows whose
  `Last change` falls in the release window). Bug fixes, internals and ops
  capabilities are `Marketable: no` and never reach the page.
- **Read before you build.** A brief that touches an anchor names the row; a
  builder reads it first; the reviewer REQUEST CHANGES a diff that changes a
  route, the schema, or a catalogued anchor without touching this file in the
  same PR.

## Catalog

| ID | Name | Status | Marketable | Audience | Current behavior | Anchors | Last change | Benefit |
|---|---|---|---|---|---|---|---|---|
| F-1 | _capability name_ | live | yes | _who uses it (guest / staff / manager / admin / ops)_ | _one sentence: what it does today — no adjectives_ | `GET /api/…`, `Model.field`, `app/pages/…` | PR #_n_ · YYYY-MM-DD | _unwritten_ |

_IDs are stable and never reused. Keep rows ≤1 line each in the source; wrap
nothing. Add a row per capability the moment it ships; edit it the moment it
changes; mark it removed the moment it goes._
