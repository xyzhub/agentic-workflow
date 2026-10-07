---
status: living
owner-agent: marketing
refresh-trigger: every-ship
---

# agentic-workflow — Publish Queue

_The staging surface for outward publishing (WORKFLOW.md §14). The `marketing`
and `writer` agents fill this from the launch assets and content plan; **writing
a row here fires nothing.** Items are posted only by `/agentic-workflow:publish run` — the human
firing it, or, where §10 **Publish policy** delegates it, a scheduled run within
the granted scope. Deploys to `docs/product/launch/publish-queue.md`._

## Policy in force
_Mirror the §10 Publish policy row here so a fresh agent sees the boundary
without reading the profile: `human-only` (default — staged items wait for the
human to run `/agentic-workflow:publish run`) or `may-publish (delegated <YYYY-MM-DD>, channels:
…, rate: N/wk, organic-only)`. **Paid is never in this delegation** — a paid
item is always human-fired and budget-bounded (§11)._

Policy: **human-only**

## Queue

_One row per intended post or outreach message. `kind`: `post` (a run may fire
it) or `outreach` (one message to one person — **only you send it, by hand**; no
run and no policy ever fires it, §11). `state`:
`draft → approved → claimed → dispatching → delivered | unknown`. Only
`approved` + pinned + due `post` items can be claimed; `paid: yes` items never
auto-fire regardless of policy; `unknown` waits for you to run
`/agentic-workflow:publish reconcile <id>`. `delivered` rows are receipts, mirrored to
`publish-log.md`._

_Pins — written by `tools/publish-gate.mjs`, never by hand: `body-sha256` = the
full hex hash of the `### <id>` body; `epoch` = +1 on every body change;
`approved-for` = `<sha8>@<epoch>` (what you approved); `claim` =
`<token8> <state> <UTC>` (the one-time token a run fired under). Italic `_id_`
rows are examples — the gate ignores them; delete them once real rows exist._

| id | kind | channel | scheduled (UTC) | state | paid | body-sha256 | epoch | approved-for | claim | source asset | summary |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P-001 | post | devto | 2026-10-07 09:00 | draft | no | 9b735788be4d0c4da32fc26649f89d745c0177dec0ddbaff11c6a2b514a9ad42 | 2 |  |  | docs/product/launch/announcements/dev-to.md | 1.52.0 release note |

## Drafts (full bodies)

_The full text/thread/article body for each queued id, so `/agentic-workflow:publish run` posts
exactly what was reviewed — no re-drafting at fire time. Media/asset paths
referenced, not inlined. The body is everything under the `### <id>` heading up
to the next `### `, a `---` rule, or the end of the file._

### P-001 — devto
agentic-workflow 1.52.0: a publish-queue item now fires only for the exact body you approved — hash-pinned, epoch-bound, claimed twice.

---
_A change to an approved body is **DETECTED** by `publish-gate.mjs stamp` (run by
stage/approve/run): epoch +1, back to `draft`, re-approve to fire. Delivered
items move to `publish-log.md` with their permalink; the full event trail is
`publish-claims.jsonl`. The `analyst` reads the log to attribute funnel results
back to posts._
