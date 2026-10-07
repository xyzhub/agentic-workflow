---
status: living
owner-agent: marketing
refresh-trigger: every-ship
---

# {{PROJECT_NAME}} — Publish Log

_The append-only audit trail of everything published outward (WORKFLOW.md §14) —
the same auditability §12 gives owner-channel decisions. `tools/publish-gate.mjs`
(via `/agentic-workflow:publish run` or `reconcile`) adds one row per delivered post and edits the
queue item to a receipt. Newest first. Deploys to
`docs/product/launch/publish-log.md`. Never rewritten — corrections are new rows._

| posted (UTC) | kind | channel | permalink | source asset | fired by | paid | claim |
|---|---|---|---|---|---|---|---|
| _YYYY-MM-DD HH:MM_ | _post_ | _x_ | _https://…_ | _`…/announcements/x.md`_ | _human \| may-publish (delegated)_ | _no_ | _a1b2c3d4_ |

---
_"fired by" records the authority: `human` (someone ran `/agentic-workflow:publish run`) or
`may-publish (delegated <date>)` (a scheduled run within §10 scope). Every paid
post is `fired by: human` by construction — paid never rides the delegation
(§11). `claim` is the token that fired it — one token, one post; the full event
trail is `publish-claims.jsonl`. This log is the record the owner audits and the
`analyst` attributes funnel results against._
