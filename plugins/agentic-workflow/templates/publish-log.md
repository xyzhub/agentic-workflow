# {{PROJECT_NAME}} — Publish Log

_The append-only audit trail of everything published outward (WORKFLOW.md §14) —
the same auditability §12 gives owner-channel decisions. `/agentic-workflow:publish run` appends
one row per successful post and edits the queue item to a receipt. Newest first.
Deploys to `docs/product/launch/publish-log.md`. Never rewritten — corrections
are new rows._

| posted (UTC) | channel | permalink | source asset | fired by | paid |
|---|---|---|---|---|---|
| _YYYY-MM-DD HH:MM_ | _x_ | _https://…_ | _`…/announcements/x.md`_ | _human \| may-publish (delegated)_ | _no_ |

---
_"fired by" records the authority: `human` (someone ran `/agentic-workflow:publish run`) or
`may-publish (delegated <date>)` (a scheduled run within §10 scope). Every paid
post is `fired by: human` by construction — paid never rides the delegation
(§11). This log is the record the owner audits and the `analyst` attributes
funnel results against._
