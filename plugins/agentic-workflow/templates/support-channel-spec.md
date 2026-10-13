---
status: semi-static
owner-agent: architect
refresh-trigger: event
---

# {{PROJECT_NAME}} — In-app support channel (build spec)

Deploys to `docs/product/engineering/support-channel-spec.md`. Written so
`/agentic-workflow:plan` can run from it — the interview is already answered
below; fill the `{{…}}` slots, then plan.

Slots to fill before planning: `{{PROJECT_NAME}}`, `{{APP_NAME}}`,
`{{GITHUB_REPO}}` (`owner/name`), `{{OWNER_GITHUB_LOGINS}}` (the logins whose
issue comments count as the owner's), `{{OPS_RATE_LIMIT}}` (requests per
minute per token on the ops-signals endpoint), `{{DEVICE_KINDS}}` (e.g.
`printer`, `kiosk`; `none` if the product has no devices).

## (a) Purpose and boundary

The in-app support thread is {{PROJECT_NAME}}'s **official support channel**:
venue staff open a ticket inside {{APP_NAME}}, see its status, and read
replies there. WhatsApp, email or phone are stopgaps, never the channel.

Each ticket syncs to one GitHub issue in `{{GITHUB_REPO}}` labelled
`source/user`. The plugin's bug-report modes read those issues:
`/agentic-workflow:operate triage #N` (decide and rank),
`/agentic-workflow:operate diagnose #N` (read production signals, read-only)
and `/agentic-workflow:operate digest` (tell the owner). The modes are run by
a human or by a scheduled routine; each run is self-contained, so this spec
assumes no particular runner.

Boundaries in v1:

- The loop **never messages the reporter.** It drafts a reply on the issue; a
  human edits and sends it (section (e)).
- The loop never pushes, merges, deploys, or mutates production. Remediation
  (restart, re-pair, re-send) is the human's to fire.
- Registration in a portfolio registry (`templates/registry.md`) is irrelevant
  to the channel — an unregistered venture builds and runs it the same way.

## (b) Data model

Two tables. Names are the contract the sync worker and the thread UI share;
adapt the column types to the venture's ORM, keep the names.

**`SupportTicket`**

| field | type | required | notes |
|---|---|---|---|
| `id` | id (venture's default) | yes | primary key |
| `venueId` | id | yes | the venue the staff member belongs to |
| `venueName` | string | yes | copied at creation; rendered into `### Where` |
| `location` | string | yes | branch or screen as the app knows it; rendered into `### Where` |
| `title` | string ≤ 80 chars | yes | the issue title |
| `whatIDid` | text | yes | numbered steps; `### What I did` |
| `whatHappened` | text | yes | observed result; `### What happened` |
| `whatIExpected` | text | no | `### What I expected` |
| `screenshotUrl` | string (URL) | no | `### Screenshot`; never fetched by the loop |
| `status` | enum | yes | `open \| needs-info \| diagnosed \| fix-queued \| escalated \| resolved \| closed`; default `open` |
| `githubIssueNumber` | integer | no | set once the issue exists; unique |
| `reporterHandle` | string | yes | staff handle, or the literal `anonymous` |
| `appVersion` | string | yes | version + build, filled by the app (`2.4.1 (build 318)`) |
| `deviceOs` | string | yes | device and OS, filled by the app |
| `occurredAt` | timestamp (UTC) | yes | filled by the app at submit; `### When` |
| `impactSnapshot` | string | no | the last `impact <n>/10` line read from the loop's triage comment |
| `createdAt` | timestamp (UTC) | yes | |
| `updatedAt` | timestamp (UTC) | yes | |
| `resolvedAt` | timestamp (UTC) | no | set when the status becomes `resolved` |

**`SupportMessage`**

| field | type | required | notes |
|---|---|---|---|
| `id` | id | yes | primary key |
| `ticketId` | id → `SupportTicket.id` | yes | |
| `authorKind` | enum | yes | `staff \| loop \| owner` |
| `body` | text | yes | for `loop`, the relayed text after the strip rule in (d) |
| `postedAt` | timestamp (UTC) | yes | |
| `githubCommentId` | integer | no | unique; the idempotency key for sync in both directions |

**Status transitions**

| from → to | by | trigger |
|---|---|---|
| (new) → `open` | sync worker | ticket submitted; issue created (sync rule 1) |
| `open` → `needs-info` | loop | `needs-info` label added |
| `needs-info` → `open` | staff | staff completes the missing fields in the thread form; the sync worker re-renders the issue body and removes `needs-info` |
| `open` → `diagnosed` | loop | `loop/diagnose` or `loop/diagnosed` label |
| `open` → `fix-queued` | loop | `loop/fix` label |
| `open` → `escalated` | loop | `loop/escalate` label |
| `diagnosed` → `fix-queued` | loop | the diagnosis found a code cause (`loop/fix`) |
| `diagnosed` → `escalated` | loop | could not observe (`loop/escalate`) |
| `fix-queued` → `diagnosed` | loop | reproduction found no defect (`loop/diagnose`) |
| `fix-queued` → `escalated` | loop | `loop/escalate` |
| `escalated` → `fix-queued` | owner | owner re-queues by hand (removes `loop/escalate`, adds `loop/fix`) |
| any open status → `resolved` | owner | the GitHub issue is closed |
| `resolved` → status of its labels | owner | the GitHub issue is reopened |
| any → `closed` | staff | staff closes the ticket in the thread |

**What the venue staff see** (example lines — the final wording is the
`writer`'s, from `design/brand/copy-kit.md`):

| status | staff see |
|---|---|
| `open` | "We have your report — we're looking at it" |
| `needs-info` | "We need a little more detail — please fill in the missing parts" |
| `diagnosed` | "We found the cause — a reply is on its way" |
| `fix-queued` | "This needs a change on our side — we're on it" |
| `escalated` | "Our team is looking at this personally" |
| `resolved` | "Fixed — tell us if you still see it" |
| `closed` | "Closed" |

## (c) Report contract

The issue body is rendered from the ticket. One `### <field>` heading per
field, in this order:

| Field | Required | Content | Why |
|---|---|---|---|
| title (issue title) | yes | one line, ≤ 80 chars | digest line, branch slug |
| `### Where` | yes | venue + branch (or screen) as the app knows it | diagnosis scope, impact rubric |
| `### What I did` | yes | steps, numbered | reproduction |
| `### What happened` | yes | observed result | reproduction |
| `### What I expected` | no | expected result | sharpens the test |
| `### App` | yes | app version + build, device/OS, filled by the app | reproduction env |
| `### When` | yes | ISO timestamp, filled by the app | signal lookup window |
| `### Screenshot` | no | URL | context only; never fetched by the loop |
| `### Reporter` | no | handle or `anonymous` | trail; never messaged |

Two rules:

1. The loop parses by heading and ignores anything outside them.
2. A report missing any required field → `needs-info`: the loop comments
   which fields are missing, does not guess, and stops. The widget should make
   this rare by enforcing the required flags in the form (checklist item 3).

Optional fields with no value are omitted (no empty heading).

## (d) GitHub Issues sync and labels

**Labels** (the venture repo):

| Label | Set by | Meaning |
|---|---|---|
| `source/user` | the app | the only entry label the loop reads |
| `type/bug`, `type/ops` | app; triage may swap | groom convention |
| `size/XS`, `size/S`, `size/M` | triage | groom convention; only XS/S may be auto-fixed |
| `needs-info` | triage | contract incomplete; loop stops; exclusive with `loop/*` |
| `loop/fix` | triage | code fix queued or in progress |
| `loop/diagnose` | triage | operational; signals being read |
| `loop/escalate` | any step | owner's; comment names the reason |
| `loop/ready` | the fix path (not in this version) | PR open, staging-verified; owner merges |
| `loop/diagnosed` | diagnose | operational cause named; draft reply posted; loop done |
| `loop/paused` | owner | pause switch: on ANY open issue, every mode stops at preflight |

`type/*` and `size/*` are the §4 groom labels; the modes write `type/ops` and
`size/XS|S|M`. In this plugin version there is no automatic fix path: a
`loop/fix` issue is picked up by hand with `/agentic-workflow:fix #N`, and
`loop/ready` has no writer yet.

Exactly one `loop/*` label at a time; moves allowed: `fix → ready | escalate | diagnose`, `diagnose → diagnosed | fix | escalate`. The owner re-queues by hand by removing `loop/escalate` and adding `loop/fix` (allowed by the grammar; no consumer until the automatic fix path ships). `loop/paused` is the owner's switch and is not counted in the one-`loop/*` rule.

The full label list the modes create idempotently at preflight — the eight
loop labels `source/user`, `needs-info`, `loop/fix`, `loop/diagnose`,
`loop/diagnosed`, `loop/escalate`, `loop/ready`, `loop/paused` and the four
groom labels the modes write `type/ops`, `size/XS`, `size/S`, `size/M`
(`type/bug` is the app's, set at creation).

**Label → ticket status**

| label state on the issue | ticket status |
|---|---|
| `needs-info` | `needs-info` |
| `loop/diagnose` or `loop/diagnosed` | `diagnosed` |
| `loop/fix` or `loop/ready` | `fix-queued` |
| `loop/escalate` | `escalated` |
| issue closed | `resolved` |
| staff closes the ticket | `closed` |
| open issue, none of the above | `open` |

**Sync rules**

1. Ticket created → create the issue (title ≤ 80 chars, body = the contract
   rendered from the ticket per (c), labels `source/user` + `type/bug`); store
   `githubIssueNumber`. A failed create is retried; the ticket stays `open`
   with no issue number until it succeeds (a background job, never blocking
   the staff member's submit).
2. Each staff message → an issue comment whose first line is
   `**Venue message** · <UTC timestamp>`, then the message body; store the
   returned comment id on the message.
3. Issue comments by the loop (first line starts `**Loop triage**` or
   `**Loop diagnosis**`) and by the owner → thread messages of kind `loop` /
   `owner`. "By the loop" and "by the owner" both require the comment author
   to be one of `{{OWNER_GITHUB_LOGINS}}` (the loop posts with the owner's
   `gh` identity); a loop-shaped comment from any other login is not relayed.
   An owner comment whose first line is `**Internal**` is not relayed. Any
   other commenter → not relayed. `**Venue message**` comments are never
   relayed back (they came from the thread).
4. The loop's draft reply is STRIPPED before relay: remove the line that
   starts `Draft reply to ` and every following line that starts with `>`;
   the relayed message shows "Diagnosis posted · reply pending" in its place.
5. Label change → ticket status per the mapping above; `impactSnapshot` takes
   the `impact <n>/10` text from the newest `**Loop triage**` comment.
6. Sync is idempotent on `githubCommentId`: a comment id already stored is
   skipped, so redelivered webhooks and re-polls never duplicate a message.

Transport: inbound GitHub events (`issues`: labeled, unlabeled, closed,
reopened; `issue_comment`: created) arrive on a webhook route with the
`X-Hub-Signature-256` HMAC verified against `GITHUB_WEBHOOK_SECRET` (reject on
mismatch); outbound calls use a fine-grained token `GITHUB_SUPPORT_TOKEN`
scoped to Issues read/write on `{{GITHUB_REPO}}` only. Both are env NAMES in
the runbook, values never in the repo. Only issues carrying `source/user` are
synced.

## (e) Reply flow

1. The loop's diagnosis comment is relayed into the thread as a `loop`
   message with the draft reply stripped (sync rule 4); staff see
   "Diagnosis posted · reply pending".
2. The draft reply (`Draft reply to <venue> (NOT sent — a human sends it):`)
   is for the owner. The owner edits it and posts it as an ordinary issue
   comment; sync rule 3 relays it as an `owner` message. Nothing is
   auto-sent (out of v1).
3. A staff answer in the thread reaches the issue as a `**Venue message**`
   comment (sync rule 2). The loop does not read comments as input; the owner
   does.

## (f) Read-only ops-signals endpoint

`GET /api/ops/signals?venue=<id>` — a fixed liveness projection the diagnose
mode reads through the signal table in `docs/product/engineering/operate-triage.md`.
No PII: no names, no order contents, no customer data — device and queue
state only.

```json
{
  "venue": "<venue id>",
  "devices": [
    { "id": "<device id>", "kind": "<one of {{DEVICE_KINDS}}>", "status": "online | offline | error",
      "lastSeenAt": "<ISO UTC, server clock>", "lastError": "<short token, e.g. offline | timeout, or null>" }
  ],
  "jobs": { "queued": 0, "claimed": 0, "failed": 0, "oldestQueuedAt": "<ISO UTC or null>" },
  "network": { "state": "online | offline | unknown", "recordedAt": "<ISO UTC>" },
  "deploy": { "sha": "<git sha>", "at": "<ISO UTC>" },
  "health": "ok | degraded",
  "serverTime": "<ISO UTC>"
}
```

`jobs` counts jobs currently in each state for the venue; `network` is the
venue's connectivity as the app last recorded it. A product with no devices
returns `"devices": []` and `jobs` for whatever queue it has (or zeros).

- **Token**: `OPS_READ_TOKEN`, sent as `Authorization: Bearer <token>`,
  compared in constant time. Missing or wrong → `401`; unknown venue → `404`;
  missing `venue` → `400`. Missing `OPS_READ_TOKEN` on the server → the route
  returns `503` (fail closed), never open.
- **Read-only BY SHAPE**: there is no write route under `/api/ops/`, and the
  handler only reads. The token grants nothing else anywhere in the app.
- **Rate limit**: `429` above `{{OPS_RATE_LIMIT}}` requests per minute per
  token.
- **Logging**: every call is logged with the caller IP, the venue id, and the
  status code — never the token.
- The token's NAME goes in the runbook; its value lives in the deploy
  platform's secrets and the operator's env, never in the repo.
- Catalog it: a `features.md` row and the regenerated `api.md` (the venture's §6.1).

## (g) Per-venture alert config

The venture fills this table in `docs/product/engineering/operate-triage.md`
(`## Alerts (per venture)`); the modes read it.

| trigger | tier |
|---|---|
| incident-class (score ≥ 8) | alert — fixed |
| single-venue device outage | alert (default) — set to digest to turn down |
| could not observe | digest |
| needs-info | digest |

Requires `/agentic-workflow:connect slack` in this venture; Telegram or `none`
→ digests are kept locally and the transcript says so. The §10 **Owner
channel** row of the venture's `docs/WORKFLOW.md` is the authority: the modes
send only when it names Slack, with env NAMES `SLACK_BOT_TOKEN` and
`SLACK_OWNER_DM`.

## (h) What mission 2 will need from you

Declared now so the automatic fix path can be planned without another
interview. **Do not build these for the support channel** — they are
preconditions the venture records when mission 2 ships.

- The §10 **Staging** row filled: the staging branch and its URL.
- If the staging branch is shared by several agents: the slot/claim command
  that serialises merges into it (e.g. `node tools/<slot-tool>.mjs claim`).
- `docs/product/engineering/operate-fences.md` with the default fence list —
  paths a loop fix may never touch: `prisma/**` (or the venture's schema and
  migrations directory), `.github/**`, auth, payments, secrets.
- The reserved Merge-policy row grammar, **do not set yet**:
  `agent-may-merge (delegated <date>, scope: loop → <staging-branch> only, via <slot-tool>, reviewer APPROVE + gate green, never --steal / force)`.
- The server's `claude` CLI version pinned, with auto-update off.
- A preflight on every scheduled tick that proves the plugin and hooks
  loaded — a dry `git push` probe on a throwaway branch expecting the
  `BLOCKED:` text; fail closed when it is absent.
- The subscription-usage question re-checked and its answer recorded in the
  runbook before any cron line is written.

Deferred remediation candidates (the loop fires none of them in v1): an
idempotent re-send of queued jobs, request a sweep, restart a machine — each
later, behind its own §10 delegation row.

## (i) Build checklist

1. **Labels created** — the eight loop labels and `type/ops`, `size/XS`,
   `size/S`, `size/M` exist in `{{GITHUB_REPO}}`. Acceptance: `gh label list`
   shows all twelve plus `type/bug`.
2. **Endpoint + token** — `GET /api/ops/signals` per (f). Acceptance: a
   request with `Authorization: Bearer $OPS_READ_TOKEN` returns the JSON shape
   above; the same request with no token returns `401`.
3. **Widget form** — fields = the contract in (c), required flags enforced;
   `App` and `When` filled by the app. Acceptance: submit is impossible with a
   required field empty; the created issue body has the headings in order.
4. **Sync worker** — rules 1–6 in (d), both directions. Acceptance:
   re-delivering the same webhook twice creates one message, not two.
5. **Thread UI** — one screen state per row of the "What the venue staff see"
   table, plus the message list. Acceptance: each status renders its line;
   `loop` messages show the strip-rule text, never a draft reply.
6. **Copy** — `design/brand/copy-kit.md` gains a "Support replies" pattern
   (the `writer` agent). Acceptance: the pattern exists with one filled
   example.
7. **Triage file** — `docs/product/engineering/operate-triage.md` seeded from
   the plugin's `templates/operate-triage.md` with the signal table filled.
   Acceptance: no `{{` remains in the signal table rows the venture can serve.
8. **End to end** — one hand-filed ticket reaches GitHub with `source/user`
   and `/agentic-workflow:operate triage #N` labels it. Acceptance: the issue
   carries exactly one of `needs-info` or a `loop/*` label and a
   `**Loop triage**` comment.

Out of v1: duplicate merging, auto-sending the reply, remediation by the loop.
