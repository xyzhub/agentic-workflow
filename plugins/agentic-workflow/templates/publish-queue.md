---
status: living
owner-agent: marketing
refresh-trigger: every-ship
---

# {{PROJECT_NAME}} — Publish Queue

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
| _P-001_ | _post_ | _x / linkedin / devto / mailing / site_ | _YYYY-MM-DD HH:MM_ | _draft_ | _no_ |  |  |  |  | _`docs/product/launch/announcements/x.md`_ | _one line_ |
| _O-001_ | _outreach_ | _email / x-dm / x-reply / linkedin-dm_ | _YYYY-MM-DD HH:MM_ | _draft_ | _no_ |  |  |  |  | _`docs/product/launch/announcements/x.md`_ | _person + the one ask_ |

## Drafts (full bodies)

_The full text/thread/article body for each queued id, so `/agentic-workflow:publish run` posts
exactly what was reviewed — no re-drafting at fire time. Media/asset paths
referenced, not inlined. The body is everything under the `### <id>` heading up
to the next `### `, a `---` rule, or the end of the file._

### P-001 — _channel_
_The exact body to post. For a thread, number the parts. For an article, link
the source file and the target platform's canonical-URL setting._

### O-001 — _email_
to: _name <address> / @handle_
subject: _one line (email only)_

_The exact message you will paste and send yourself._

---
_A change to an approved body is **DETECTED** by `publish-gate.mjs stamp` (run by
stage/approve/run): epoch +1, back to `draft`, re-approve to fire. Delivered
items move to `publish-log.md` with their permalink; the full event trail is
`publish-claims.jsonl`. The `analyst` reads the log to attribute funnel results
back to posts._
