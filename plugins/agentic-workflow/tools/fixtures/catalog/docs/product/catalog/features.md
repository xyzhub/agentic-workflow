# Feature catalog — fixture

| ID | Name | Status | Marketable | Audience | Current behavior | Anchors | Last change | Benefit |
|---|---|---|---|---|---|---|---|---|
| F-1 | Order list & detail | live | yes | staff | Staff see today's orders and open one. | `GET /api/orders`, `GET /api/orders/:id`, `Order`, `Order.total`, `app/pages/orders.vue` | PR #1 · 2026-08-01 | _unwritten_ |
| F-2 | Health endpoint | live | no | ops | Uptime probe. | `/api/health` | PR #2 · 2026-07-01 | — |
