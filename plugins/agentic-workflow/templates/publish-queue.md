# {{PROJECT_NAME}} — Publish Queue

_The staging surface for outward publishing (WORKFLOW.md §14). The `marketing`
and `writer` agents fill this from the launch assets and content plan; **writing
a row here fires nothing.** Items are posted only by `/publish run` — the human
firing it, or, where §10 **Publish policy** delegates it, a scheduled run within
the granted scope. Deploys to `docs/product/launch/publish-queue.md`._

## Policy in force
_Mirror the §10 Publish policy row here so a fresh agent sees the boundary
without reading the profile: `human-only` (default — staged items wait for the
human to run `/publish run`) or `may-publish (delegated <YYYY-MM-DD>, channels:
…, rate: N/wk, organic-only)`. **Paid is never in this delegation** — a paid
item is always human-fired and budget-bounded (§11)._

Policy: **human-only**

## Queue

_One row per intended post. `state`: `draft` → `approved` (a human, or the
delegation scope, has cleared it to post) → `posted` (moved to the log below the
line). Only `approved` + due items are eligible to fire. `paid: yes` items never
auto-fire regardless of policy._

| id | channel | scheduled (UTC) | state | paid | source asset | summary |
|---|---|---|---|---|---|---|
| _P-001_ | _x / linkedin / devto / mailing / site_ | _YYYY-MM-DD HH:MM_ | _draft_ | _no_ | _`docs/product/launch/announcements/x.md`_ | _one line_ |

## Drafts (full bodies)

_The full text/thread/article body for each queued id, so `/publish run` posts
exactly what was reviewed — no re-drafting at fire time. Media/asset paths
referenced, not inlined._

### P-001 — _channel_
_The exact body to post. For a thread, number the parts. For an article, link
the source file and the target platform's canonical-URL setting._

---
_A change to an approved body **resets it to `draft`** — re-approval is required
before it can fire. Posted items move to `publish-log.md` with their permalink.
The `analyst` reads the log to attribute funnel results back to posts._
