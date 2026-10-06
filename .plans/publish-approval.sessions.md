---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: publish-approval — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the expensive
exploration happened once, here (2026-10-06)._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/publish-approval.md` · Ledger: `.plans/publish-approval.state.md`

Design sources (read the named ranges, never whole):
`docs/product/decisions/2026-10-06-launch-media-brief.md` (L1/L2, Mission 1),
`…-memos.md` (F2/F4/F5, Memo 3, Memo 10), `…-journeys.md` (section C),
`…-metrics.md` (1.C, §3), `docs/product/decision-log.md` (counsel findings).
Decisions are locked in the master plan; the sources are not re-litigated.

**Catalog**: none — this repo's §10 **Catalog** row is `none — markdown-only
plugin` (`docs/product/catalog/` does not exist; checked 2026-10-06). No catalog
reads, no catalog regeneration in Verify.

**Gates available in this repo** (§10):

| Gate | Command | Tier |
|---|---|---|
| Test / lint gate (CI runs it) | `node tools/lint.mjs` | 1 — the brief and the checkpoint |
| Hook behavior harness | `node tools/hook-test.mjs` | 1.5 — reached by lint; **baseline 123 `ok`, `hook-test: clean` (measured 2026-10-06)** |
| Gate-tool selftest (new) | `node plugins/agentic-workflow/tools/publish-gate.mjs --selftest` | 1.5 — reached by lint after S1 (row 10.8) |
| Staging verify (§10 Staging = none) | lint green on the phase branch + `claude --plugin-dir plugins/agentic-workflow` load | at the checkpoint |

**Facts already probed (do not re-probe):** `node` v24.12.0, `jq` at
`/usr/bin/jq`; no `package.json` anywhere, every tool is zero-dep; plugin tools
live in `plugins/agentic-workflow/tools/` (`catalog.mjs`, `ci-wait.mjs`,
`conform.mjs`, `run-codex.mjs`) and harnesses at the repo root `tools/`;
`hooks.json` row 78 ("publishing guardrail") resolves `$WF` through
`git -C "$D" rev-parse --show-toplevel` with NO fallback — in the harness temp
cwd `TOP` is empty, so the current hook always takes the human-only branch;
`tools/hook-test.mjs` selects a hook by a substring of its `description`
(`hookCommand(event, descNeedle)`, line 25) and stages arbitrary files via
`files: { 'rel/path': { content, mtime? } }` (line 56); existing publish-host
cases in the harness: **none**; §3 and §14 text is byte-identical between
`templates/WORKFLOW.md` and `docs/WORKFLOW.md` (offset: docs = template − 8 in
§3, − 14 in §14); the §3 table has NO row for the publishing guardrail today
(only the Codex row at template line 274 mentions §14); OB-17 in
`.plans/OBLIGATIONS.md` line 57 is the Codex publish-host parity gap (fix path
#81) — this mission narrows it (gate tool) but does not close it.

## Large-files table

| File | Lines |
|---|---|
| `tools/hook-test.mjs` | 1337 |
| `tools/lint.mjs` | 874 |
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 1260 |
| `docs/WORKFLOW.md` | 1255 |
| `CHANGELOG.md` | 1056 |
| `plugins/agentic-workflow/README.md` | 315 |
| `plugins/agentic-workflow/tools/catalog.mjs` | 333 |
| `docs/product/decisions/2026-10-06-launch-media-journeys.md` | 244 |
| `docs/product/decisions/2026-10-06-launch-media-memos.md` | 224 |
| `plugins/agentic-workflow/agents/reviewer.md` | 213 |
| `docs/product/decisions/2026-10-06-launch-media-brief.md` | 186 |
| `plugins/agentic-workflow/hooks/hooks.json` | 181 |
| `plugins/agentic-workflow/agents/marketing.md` | 145 |
| `plugins/agentic-workflow/tools/ci-wait.mjs` | 134 |
| `docs/product/decisions/2026-10-06-launch-media-metrics.md` | 127 |
| `plugins/agentic-workflow/commands/publish.md` | 74 |
| `docs/product/decision-log.md` | 67 |
| `README.md` | 64 |
| `plugins/agentic-workflow/agents/writer.md` | 59 |
| `plugins/agentic-workflow/hooks/lib/active-ledger.sh` | 58 |
| `plugins/agentic-workflow/hooks/lib/beat-enforcer-pretooluse.sh` | 49 |
| `plugins/agentic-workflow/templates/publish-queue.md` | 48 |
| `plugins/agentic-workflow/templates/publish-log.md` | 24 |
| `plugins/agentic-workflow/.claude-plugin/plugin.json` | 11 |

## Phase 1 — hash-pinned approval + claim token (branch: `mission/publish-approval`, cut from `feat/launch-media-plan`)

One brief, one checkpoint. Not parallel (single session).

### S1 — gate tool, lib hook, harness, surfaces, protocol text, record, n=1

Suits: **`security`** (fail-closed guard; a shell hook parsing untrusted command
text; a token that gates an irreversible act). `backend` is the fallback.
Runtime: claude (default — no `runtime:` field).

- **Reads** (≈ 960 lines; order matters — design first, then code shape, then
  edit sites):
  1. `docs/product/decisions/2026-10-06-launch-media-brief.md` 152–174
     (Locked decisions L1–L4 + "### Mission 1"); 105–116 ("### C." acceptance
     criteria C1–C5); 125–136 (Constraints — patterns only, never ECC code).
  2. `…-memos.md` 13–42 (F1–F8), 86–113 (Memo 3 — THE design), 198–207
     (Memo 10).
  3. `…-journeys.md` 174–236 (section C: journey C1–C8, states table, the
     12-column IA, the `/publish status` block).
  4. `…-metrics.md` 56–65 (1.C done signals + the REFUSED log line), 93–104
     (§3 paired metrics — the "Hash gate strictness" row).
  5. `docs/product/decision-log.md` 36–55 (convergent findings; 1, 4, 5 bind).
  6. `plugins/agentic-workflow/hooks/hooks.json` 72–82 (the row to replace:
     command at 77, description 78, timeout 79) and 94–104 (the beat-enforcer
     row — the `bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/…"` form to copy).
  7. `plugins/agentic-workflow/hooks/lib/beat-enforcer-pretooluse.sh` whole
     (49 — the lib-hook shape: header comment with contract, `INPUT=$(cat)`,
     jq extraction with `|| printf` fallback, exit discipline).
  8. `tools/hook-test.mjs` 1–100 (imports, `hookCommand`, `runHook` with
     `files:` staging, `check`), 1317–1337 (the close-keyword block = the
     block shape to copy, and the summary tail the new block goes above).
  9. `tools/lint.mjs` 437–453 (`checkCiWaitSelftest` — copy as row 10.8
     `checkPublishGateSelftest`), 864 (the check list to append to).
  10. `plugins/agentic-workflow/tools/ci-wait.mjs` 1–45 (header, argv
      helpers, zero-dep imports) and 88–112 (`selftest()` shape, `ok()` rows,
      `--selftest` dispatch in `main`).
  11. `plugins/agentic-workflow/commands/publish.md` whole (74).
  12. `plugins/agentic-workflow/templates/publish-queue.md` whole (48);
      `templates/publish-log.md` whole (24).
  13. `plugins/agentic-workflow/templates/WORKFLOW.md` 250–256 (§3 head +
      table header), 274 (Codex row, grep `| Foreign runtime (Codex)`),
      1205–1253 (§14 whole; anchors `**Prepare`, `**Fire`, `**Record`,
      `**Channels`, `**Mechanical backstop.`).
  14. `docs/WORKFLOW.md` 1–3 (protocol-master stamp), 242–248 and 266 (§3
      mirror), 1191–1239 (§14 mirror) — edit by applying the SAME diff.
  15. `plugins/agentic-workflow/agents/marketing.md` 128–145; `agents/writer.md`
      45–52 (the two prompts that stage rows).
  16. `README.md` 25–40 (tree; the `tools/` line); `plugins/agentic-workflow/README.md`
      158 (the `/publish` row) and 176–192 (the tree block).
  17. `plugins/agentic-workflow/.claude-plugin/plugin.json` whole (11);
      `CHANGELOG.md` 1–12 (`[Unreleased]` + the 1.51.2 entry shape).
  18. `plugins/agentic-workflow/templates/codex.rules` 30–40 (the comment
      naming the §14 gap — one sentence to add).
  19. `.plans/OBLIGATIONS.md` 57 (OB-17 — cite, do not edit).
- **Catalog**: none.
- **Order rule (fit, one session without phases)**: steps 1–4 (tool, hook,
  harness, lint row) must be green — `node tools/lint.mjs` clean — before any
  prose step starts. If the session runs long, step 7 (agent prompts) and the
  `codex.rules` sentence in step 8 are the FIRST to be left for an `S1-fix`,
  logged as a deviation, never silently dropped. Commit per numbered step so a
  corrective can resume, format `publish-approval(S1): <summary>` (§4).
  **Cut list (already applied below, do not re-add)**: no
  `outcome <token> failed` verb — a connector error calls `outcome <token>
  unknown` and the human reconciles; no `status --json`; no "claimed older
  than 1 h" dead-run clock in `reconcile` — it accepts `claimed | dispatching |
  unknown` plainly.
- **Do**:

  **1. `plugins/agentic-workflow/tools/publish-gate.mjs`** (new, zero-dep,
  ≤ 320 lines, `#!/usr/bin/env node`, header comment with usage). Options:
  `--queue <path>`, `--claims <path>`, `--workflow <path>` — defaults
  `docs/product/launch/publish-queue.md`, `docs/product/launch/publish-claims.jsonl`,
  `docs/WORKFLOW.md`, each resolved against `ROOT = git rev-parse
  --show-toplevel` with `process.cwd()` as the fallback when not in a git tree
  (the SAME contract as the hook's `TOP=${TOP:-.}`, so the two can never read
  different files); `--now <ISO>` (tests), `--by <authority>` (default
  `human`), `--selftest`. Exit codes:
  0 ok · 2 REFUSED (the reason on stderr; the REFUSED/reset line also on
  stdout so the command can report it) · 4 queue unparseable (line number) ·
  1 usage/missing file.
  - **Parsing**: the queue table is the first markdown table whose header
    starts `| id |`; cells are split on unescaped `|`; body sections are
    `### <id>` headings up to the next `### `, a `---` rule, or EOF (heading
    line excluded). Any row with ≠ 12 cells (after migration) or an id without
    a body section → exit 4, nothing written. Old 7-column header
    `| id | channel | scheduled (UTC) | state | paid | source asset | summary |`
    is recognised and migrated by `stamp` (below). Writes: full-file
    temp + `renameSync`; the jsonl is `appendFileSync` of one line.
  - **Hash**: `sha256(body)` where body = section text with `\r\n`→`\n`, each
    line right-trimmed, trailing blank lines removed, no trailing newline.
    `sha8` = first 8 hex. `approved-for` = `<sha8>@<epoch>`.
  - **Claims events** (one JSON object per line, keys in this order):
    `{"ts":"<UTC ISO>","event":"approved|claimed|dispatching|delivered|unknown|cancelled|reset","id":"P-001","kind":"post|outreach","sha8":"…","epoch":2,"token":"<8 hex>|null","run":"r-<4 hex>|null","by":"human|may-publish (delegated <date>)","note":"<free text|null>"}`.
    The `claimed` event MUST carry `kind` and `id` (the hook reads only the
    jsonl, never the queue).
  - **`stamp`**: migrate header if old; for every row: `kind` empty → `post`;
    hash empty → fill, `epoch` = 1 (or keep a present numeric epoch), state
    unchanged; hash present and ≠ current → `body-sha256` updated, `epoch`+1,
    and if state ∈ {`approved`} → state `draft`, `approved-for` cleared, event
    `reset`, print `publish run: REFUSED <id> approved@<old8>/e<n>, current <new8>/e<n+1> -> reset to draft`;
    if state ∈ {`claimed`,`dispatching`,`delivered`,`unknown`,`posted`} and the
    hash moved → do NOT change state or claim; print
    `WARNING <id>: body changed while <state> — reconcile by hand` (a receipt is
    never silently re-approved). Idempotent: a second run changes nothing and
    prints `stamp: N rows, 0 changes`.
  - **`approve <id>`**: stamp that row first; state must be `draft` or
    `approved` (else exit 2 `<id> is <state> — reconcile first`); writes state
    `approved`, `approved-for: <sha8>@<epoch>`, event `approved`; prints the
    body section verbatim ABOVE the result line so the command's transcript
    shows what was pinned. Any `kind` may be approved (outreach approval = the
    owner's go-ahead to send by hand).
  - **`claim <id>`**: stamp that row first — if that stamp RESET the row
    (hash drift), `claim` short-circuits right there: exit 2 with the REFUSED
    line as the SOLE message, no fall-through to the checks below. Otherwise,
    in this order, each exit 2 with the exact text:
    1. unknown id → `<id> not in queue`;
    2. `kind: outreach` → `<id> is outreach — only you can send it, by hand` (never mints);
    3. state `unknown` or `dispatching` → `<id> not fired: outcome unknown since <UTC> (run <run>). Check the channel, then reconcile it.`;
    4. `claim` cell non-empty (state `claimed`) → `<id> not fired: already claimed <HH:MM> (run <run>). If that run died, reconcile it.`;
    5. state `approved` but `approved-for` empty → `<id> says approved but has no pinned hash — run publish approve <id>`;
    6. state ≠ `approved` → `<id> is <state>, not approved`;
    7. `approved-for` ≠ `<sha8>@<epoch>` (hash drift was already applied by the
       stamp step, so this is the stale-epoch / revert-after-edit case) →
       `publish run: REFUSED <id> approved@<a8>/e<n>, current <c8>/e<m> -> reset to draft` +
       the journeys line `epoch <n> approved, now <m>`; row → `draft`,
       `approved-for` cleared, event `reset`;
    8. `scheduled` > now → `<id> not due until <scheduled>`;
    9. `paid: yes` without `--paid-confirmed-by-human` → `<id> is paid — human-fired only (§11); re-run with --paid-confirmed-by-human`;
    10. policy: the §10 row in `--workflow` when the file exists, else the
        queue's `Policy:` line; `none`/unset → `publishing not configured (Publish policy: none)`;
        `may-publish` + `--by human` is fine; `--by may-publish…` while the
        policy is `human-only` → `policy is human-only — a scheduled run cannot fire`.
    Success: `token` = 8 hex from `crypto.randomBytes(4)`, `run` = `r-` + 4
    hex; row `state: claimed`, `claim: <token> claimed <UTC HH:MM>`; event
    `claimed` (with kind, id, sha8, epoch, token, run, by); stdout ends with
    the line `PUBLISH_CLAIM=<token>`; exit 0.
  - **`dispatch <token>`**: row by token, state must be `claimed` → state
    `dispatching`, claim cell `<token> dispatching <UTC>`, event `dispatching`.
  - **`outcome <token> delivered --permalink <url> | unknown`**: state
    must be `claimed` or `dispatching`. `delivered` → state `delivered`, claim
    cell `<token> delivered <UTC>`, append a `publish-log.md` row
    `| <UTC> | <kind> | <channel> | <permalink> | <source asset> | <by> | <paid> | <token> |`
    (create the log from `templates/publish-log.md` text if missing — the tool
    embeds the header, no template read), event `delivered`; `unknown` →
    state `unknown`, claim cell `<token> unknown <UTC>`, event `unknown`,
    stderr `<id> may or may not have posted. Check the channel, then reconcile.`
    A connector ERROR (non-2xx, timeout, exception) is reported as `unknown`
    too — there is no `failed` verb; the human reconciles. Nothing retries by
    itself.
  - **`reconcile <id> --delivered <url> | --cancel`**: state must be
    `claimed`, `dispatching` or `unknown` (plainly — no age clock; a dead run
    is whatever the human says it is). `--delivered` → as `outcome delivered`
    with `by: human`; `--cancel` → state `draft`, `approved-for` and `claim`
    cleared, event `cancelled` (locked: `draft`, fail-closed).
  - **`status`**: the journeys block —
    `Publish queue — policy: <policy>` / `Needs you (n)` (unknown + dispatching
    rows, each with the journeys sentence) / `Ready to fire (n)` (approved +
    pinned, with due time) / `Drafts (n): k posts, m outreach — outreach is sent by you, by hand, never by a run`
    / `Posted this week (n)` (counts `delivered` rows AND legacy `posted` rows
    from pre-1.52.0 queues, by their log/`scheduled` date); rows that say `approved` with no pin are listed
    under Needs you with `says approved but has no pinned hash — run publish approve <id>`.
    Empty queue → `Nothing queued. Run /agentic-workflow:publish stage after a release.`
  - **`--selftest`** (in-memory, `mkdtempSync`, no fixture files; ends
    `publish-gate selftest: clean` / `publish-gate selftest: N failure(s)`,
    exit 0/1): (a) the digest of the fixed body `hello\nworld` equals
    `26c60a61d01db5836ca70fefd44a6a016620413c8ef5f259a6c5612d4f79d3b8`
    (sha256 of `"hello\nworld"`, no trailing newline — measured 2026-10-06
    with `printf 'hello\nworld' | shasum -a 256`); (b) the CRLF + trailing-space copy hashes identically;
    (c) old 7-column queue → `stamp` migrates to 12 columns, `kind: post`,
    `epoch: 1`, `state` unchanged (`approved` stays `approved`, `posted` stays
    `posted`); (d) second `stamp` = 0 changes; (e) `approve` then edit then
    `claim` → exit 2, the REFUSED line, row `draft`/`epoch 2`/`approved-for`
    empty, jsonl has `approved` + `reset`; (f) a short row (11 cells) → exit 4
    and the file is byte-identical afterwards; (g) `claim` on outreach → exit
    2, jsonl has NO `claimed` event.

  **2. `plugins/agentic-workflow/hooks/lib/publish-guard.sh`** (new, ≤ 90
  lines, header contract like `beat-enforcer-pretooluse.sh`) and the
  `hooks.json` row 71–80: command → `bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/publish-guard.sh"`;
  description → starts with `publishing guardrail (§14, PreToolUse/Bash):` then
  states the four rules below and `Body: hooks/lib/publish-guard.sh`; timeout 5.
  Rules, in order, on `CMD` = `.tool_input.command`:
  1. Keep the existing `D=` line from hooks.json:77 verbatim (the leading
     `cd <dir>` prefix derivation), then
     `TOP=$(git -C "$D" rev-parse --show-toplevel 2>/dev/null); TOP=${TOP:-.}`
     (the fallback is the harness contract); `WF="$TOP/docs/WORKFLOW.md"`;
     `CLAIMS="$TOP/docs/product/launch/publish-claims.jsonl"`.
  2. Paid: `grep -qiE 'ads-api\.|googleads|adaccounts|/act_[0-9]+/|/ads/|api\.elevenlabs\.io|api\.x\.com'`
     without the literal `PAID_CONFIRMED_BY_HUMAN` → stderr
     `❌ BLOCKED: paid endpoint crosses the money boundary (§11) — never delegable; human-fired within the budget ceiling, with PAID_CONFIRMED_BY_HUMAN in the command.`
     exit 2. (Keep the existing text's first clause so old evals still match
     `BLOCKED: paid`.)
  3. Publish host: `grep -qiE 'api\.(x|twitter|linkedin|medium)\.com|dev\.to/api|buttondown|mailchimp|bsky\.social|hashnode|/api/v1/statuses|api\.sendgrid\.com|api\.postmarkapp\.com|api\.resend\.com|api\.mailgun\.net|api\.convertkit\.com|api\.brevo\.com|smtps?://'`
     OR `grep -qE '(^|[;&|][[:space:]]*)(sendmail|msmtp|mailx|mutt)([[:space:]]|$)'`.
     No match → exit 0 silently.
  4. On a match: `PUBLISH_CONNECT=` in `CMD` → stdout
     `📣 Connect round-trip (§14): owner-only test destination, nothing public, no queue item — record only the var NAME.`
     exit 0. Else `TOK=$(printf '%s' "$CMD" | grep -oE 'PUBLISH_CLAIM=[0-9a-f]{8}' | head -1 | cut -d= -f2)`;
     empty → stderr
     `❌ BLOCKED: publish-host call without a claim token (§14) — under EVERY policy. Mint one: publish-gate.mjs claim <id> (approved, pinned, due), then put PUBLISH_CLAIM=<token> in this same command; a connect round-trip is marked PUBLISH_CONNECT=1.`
     exit 2. Token present: `[ -f "$CLAIMS" ] || { stderr "❌ BLOCKED: PUBLISH_CLAIM=$TOK — no publish-claims.jsonl at $CLAIMS"; exit 2; }`;
     `LAST=$(jq -r --arg t "$TOK" 'select(.token==$t) | "\(.event) \(.kind) \(.id)"' "$CLAIMS" 2>/dev/null | tail -1)`;
     event not `claimed`/`dispatching` → stderr
     `❌ BLOCKED: PUBLISH_CLAIM=$TOK is not an open claim (last event: <event|none>) — a token fires once; claim again or reconcile.`
     exit 2; kind `outreach` → stderr
     `❌ BLOCKED: <id> is outreach — individual outreach is never delegable (§11); send it by hand, regardless of Publish policy.`
     exit 2; otherwise stdout
     `📣 Firing <id> under claim $TOK (§14, policy: <human-only|may-publish|unset>) — record the outcome right after: publish-gate.mjs outcome $TOK delivered --permalink <url> | unknown.`
     exit 0 (policy read from `$WF` with the existing `may-publish` grep; it
     changes only the reminder text).
  Every value from the jsonl goes through `jq --arg`; nothing from the queue
  or jsonl is ever `eval`ed or interpolated into a command.

  **3. `tools/hook-test.mjs`**: add a `GATE` constant
  (`path.join(PLUGIN, 'tools/publish-gate.mjs')`) and a `runGate({ args, files,
  dir })` helper — same `mkdtempSync` + `files:` staging as `runHook`, spawns
  `process.execPath` with `[GATE, ...args]`, `cwd: dir`, returns
  `{ code, stdout, stderr, dir, read(rel) }`; accept an existing `dir` so a
  chain (gate → hook, or claim → claim) shares one cwd, and let the caller
  `rmSync` it. Then ONE block `// ── publish-approval (v1.52.0) ──` above
  the close-keyword block with a fixture builder
  `queue({ id, kind, state, approvedFor, epoch, scheduled, paid, body })`
  producing a 12-column queue + body section, and `wfPolicy(policy)` producing
  a minimal `docs/WORKFLOW.md` with the §10 row
  `| **Publish policy** | <policy> |` (named `wfPolicy`, NOT `wf` — a
  block-scoped `wf` already exists at hook-test.mjs:1209). The seven named cases (exit + text both
  asserted), with siblings:
  1. `publish-gate: tampered body → claim REFUSED (exit 2), row reset to draft, epoch+1, REFUSED line` —
     stage P-001 `approved`, `approved-for: <sha8(original)>@1`, body edited;
     `claim P-001 --now 2026-10-06T12:00:00Z` → code 2; stdout matches
     `/^publish run: REFUSED P-001 approved@[0-9a-f]{8}\/e1, current [0-9a-f]{8}\/e2 -> reset to draft$/m`;
     queue re-read: row state `draft`, `epoch` `2`, `approved-for` empty; jsonl
     last event `reset`.
  2. `publish-gate: stale epoch (body reverted, pin from epoch 1) → claim REFUSED (exit 2), "epoch 1 approved, now 2"` —
     body matches its recorded hash but row `epoch: 2` and `approved-for:
     <sha8>@1` → code 2, stderr contains `epoch 1 approved, now 2`, row
     `draft`.
  3. `publish-gate: double claim → first mints PUBLISH_CLAIM, second REFUSED (exit 2) "already claimed"` —
     first `claim` code 0 and stdout's last line matches
     `/^PUBLISH_CLAIM=[0-9a-f]{8}$/`; second `claim` in the same dir → code 2,
     stderr matches `/already claimed \d\d:\d\d \(run r-[0-9a-f]{4}\)\. If that run died, reconcile it\./`.
  4. `publish-gate: unknown outcome → row unknown, status "Needs you", re-claim REFUSED, reconcile --delivered writes the log row` —
     `claim` → `outcome <tok> unknown` code 0 and stderr contains
     `may or may not have posted`; `status` stdout has `Needs you (1)` and
     `reconcile P-001`; `claim P-001` → code 2 stderr contains `outcome unknown`;
     `reconcile P-001 --delivered https://dev.to/x/1` → code 0, queue row
     `delivered`, `docs/product/launch/publish-log.md` exists with a row
     containing `https://dev.to/x/1` and `human`.
  5. `publish-guard: outreach under delegation → gate never mints; hook BLOCKS a forged token (exit 2) regardless of policy` —
     (a) `claim O-001` (`kind: outreach`, approved+pinned) → code 2, stderr
     `O-001 is outreach — only you can send it, by hand`, jsonl has no
     `claimed` line; (b) hook `runHook({ event:'PreToolUse', desc:'publishing guardrail', input:{ tool_input:{ command:'PUBLISH_CLAIM=deadbeef curl -X POST https://api.linkedin.com/v2/messages -d @dm.json' } }, files:{ 'docs/WORKFLOW.md': wfPolicy('may-publish (delegated 2026-10-01, channels: linkedin, rate: 5/wk, organic-only)'), 'docs/product/launch/publish-claims.jsonl': { content: '{"ts":"…","event":"claimed","id":"O-001","kind":"outreach","token":"deadbeef",…}\n' } } })`
     → code 2, stderr contains `O-001 is outreach — individual outreach is never delegable`
     (LinkedIn on purpose: `api.x.com` is in the paid regex, which would trip
     rule 2 first and make the case about paid, not outreach).
  6. `publish-guard: tokenless publish-host call → BLOCK (exit 2) under human-only, under may-publish, and for an email host` —
     three runs: `curl -X POST https://api.linkedin.com/v2/ugcPosts` with
     `wfPolicy('human-only')` → code 2 stderr contains
     `publish-host call without a claim token`; same command with the
     may-publish row → code 2; `curl https://api.resend.com/emails -d @body.json`
     with human-only → code 2. Sibling (silence): `git commit -m "mail merge
     copy"` and `echo mutton` → code 0, empty stdout/stderr.
  7. `publish-guard: PUBLISH_CONNECT= marker → connect round-trip allowed (exit 0, reminder)` —
     `PUBLISH_CONNECT=1 curl https://api.linkedin.com/v2/me` → code 0, stdout
     contains `Connect round-trip`.
  Preserved-behaviour siblings (same block): `publish-guard: ads endpoint
  without PAID_CONFIRMED_BY_HUMAN → BLOCK` (`curl https://ads-api.twitter.com/…`
  → code 2, stderr `BLOCKED: paid`); `… with PAID_CONFIRMED_BY_HUMAN → paid
  rule passes` (then falls to the tokenless rule → still code 2 but the text
  is the claim text, not the paid text — assert that order); `publish-guard:
  api.elevenlabs.io joins the paid guard → BLOCK`; `publish-guard: valid open
  claim (kind post) → exit 0 with the 📣 Firing reminder`; `publish-guard:
  token whose last event is delivered → BLOCK (spent token)`; `publish-guard:
  token with no publish-claims.jsonl → BLOCK`; `publish-guard: non-publish
  command → silent`. Expected total ≥ 136 `ok` and `hook-test: clean`.

  **4. `tools/lint.mjs`**: row `// ── 10.8 publish-gate selftest (tier-1.5)`
  = `checkPublishGateSelftest`, a copy of `checkCiWaitSelftest` (437–453) with
  the runner `plugins/agentic-workflow/tools/publish-gate.mjs` and the
  fail-closed "script missing" message; append it after `checkCiWaitSelftest`
  in the list at line 864.

  **5. Templates**: `templates/publish-queue.md` → the 12-column header from
  journeys C (`| id | kind | channel | scheduled (UTC) | state | paid | body-sha256 | epoch | approved-for | claim | source asset | summary |`),
  example rows `P-001` (`post`) and `O-001` (`outreach`, channel `email`,
  summary "person + the one ask"), state legend
  `draft → approved → claimed → dispatching → delivered | unknown`, the pin
  legend (full hex / `<sha8>@<epoch>` / `<token8> <state> <UTC>`), outreach
  channels `email | x-dm | x-reply | linkedin-dm` with `to:`/`subject:` lines
  at the top of an `### O-nnn` body, the footer rewritten: "a change to an
  approved body is DETECTED by `publish-gate.mjs stamp` (run by stage/approve/
  run): epoch +1, back to `draft`, re-approve to fire"; the Policy paragraph
  unchanged. `templates/publish-log.md` → header
  `| posted (UTC) | kind | channel | permalink | source asset | fired by | paid | claim |`
  and one example row; footer adds "`claim` is the token that fired it — one
  token, one post; the full event trail is `publish-claims.jsonl`".

  **6. `commands/publish.md`**: `argument-hint: '[connect | stage | status | approve <id> | run | reconcile <id>] [channel]'`;
  `connect` — every round-trip call carries `PUBLISH_CONNECT=1` in the Bash
  command text (the hook allows it; a tokenless call is blocked under every
  policy); an **X** round-trip (`api.x.com`) ALSO carries
  `PAID_CONFIRMED_BY_HUMAN`, because rule 2 (paid) runs before rule 4 reaches
  the connect marker and X is pay-per-use — the owner is at the keyboard for
  `connect`, so the token is theirs to type; `stage` — after the agents write, run
  `node "${CLAUDE_PLUGIN_ROOT}/tools/publish-gate.mjs" stamp` and report
  `stamp:` output; new `## approve <id>` — run `stamp`, show the `### <id>`
  body verbatim, AskUserQuestion to confirm THIS text, then
  `publish-gate.mjs approve <id>`; `status` — run `publish-gate.mjs status`;
  `run` — policy first (unchanged), then `stamp`, then per approved+due item:
  `claim <id> [--by …] [--paid-confirmed-by-human]` → capture the
  `PUBLISH_CLAIM=` line → `dispatch <token>` → the connector call with
  `PUBLISH_CLAIM=<token>` LITERALLY in the same Bash command (the hook sees
  command text only) → `outcome <token> delivered --permalink <url>` or
  `outcome <token> unknown`; a REFUSED claim is reported with its line and
  the run continues to the next item; an `unknown` is NEVER retried — it goes
  to the human (owner channel Gate tier, once); new `## reconcile <id>` —
  `--delivered <permalink>` / `--cancel`; Boundaries — add "the §3 hook blocks
  any publish-host call without an open claim token under every policy, and
  any token that resolves to outreach". Keep `allowed-tools` as is.

  **7. Agents**: `agents/marketing.md` 132–135 — rows are `kind: post`,
  `stage` stamps the hash, "an edit after approval un-approves — that is the
  design, not a bug"; `agents/writer.md` 48–51 — same one clause. No other
  agent changes (`prospector` is mission B).

  **8. Protocol text, `templates/WORKFLOW.md`** then the identical diff in
  `docs/WORKFLOW.md` (+ stamp line 3 → `v1.52.0`):
  - §3 table: new row after the `gh pr create` row —
    `| publish-host call (socials, article platforms, mailing-list AND email APIs, bare mailers) | **BLOCKS** under EVERY Publish policy unless the command carries an open claim token \`PUBLISH_CLAIM=<token>\` minted by \`tools/publish-gate.mjs claim\` (approved, hash-pinned, epoch-bound, due, \`kind: post\`); a token resolving to \`kind: outreach\` **BLOCKS** regardless of policy (§11); \`PUBLISH_CONNECT=\` marks a \`/agentic-workflow:publish connect\` round-trip (allowed, reminder); paid/ad endpoints — now including \`api.elevenlabs.io\` and \`api.x.com\` — **BLOCK** without the literal \`PAID_CONFIRMED_BY_HUMAN\`. Threat model: accident and double-fire, not an adversarial agent (§14) |`
  - §3 Codex row (template 274): replace the "NOT replicated" clause's last
    sentence with: "…so inside a Codex run the §14 gate tool's refusal
    (`tools/publish-gate.mjs claim`) is the ONLY mechanical publish check; a
    builder role with network on remains a named gap (OB-17, #81)".
  - §14 **Prepare**: state list `draft → approved → claimed → dispatching →
    delivered | unknown`; "Each item carries `kind` (`post` | `outreach`), its
    channel, scheduled time, full body, source asset, and — written by
    `tools/publish-gate.mjs stamp`, never by hand — `body-sha256` and `epoch`."
  - §14 **Fire**: replace "A change to an approved body resets it to `draft`
    — re-approval before it can fire." with: "**Pin.** `approve <id>` records
    `approved-for: <sha8>@<epoch>`; `run` re-hashes first and REFUSES any item
    whose hash or epoch moved (`publish run: REFUSED <id> approved@<h>/e<n>,
    current <h'>/e<m> -> reset to draft`), resetting it to `draft`. **Claim.**
    Firing takes a one-time token minted by `claim` before any network call;
    the row moves `claimed → dispatching → delivered | unknown`; a claimed row
    cannot be claimed again; `unknown` is terminal until a human runs
    `reconcile <id>`. Nothing retries by itself." Add "`kind: outreach` is
    never claimable — no policy delegates individual outreach (§11); the
    owner sends it by hand from the approved draft."
  - §14 **Record**: log gains `kind` and `claim`; "`docs/product/launch/publish-claims.jsonl`
    is the append-only event trail (approved, claimed, dispatching, delivered,
    unknown, cancelled, reset) — committed, PR-reviewed, the machine
    truth for state; the queue stays the human-reviewed truth for content."
  - §14 new paragraph **Threat model.** "The pin, epoch and claim guard
    against ACCIDENT — a body edited after approval, a run that fires twice, a
    crash between post and record — not against an adversarial agent: the hook
    sees command text, a token can be pasted, MCP/HTTP tools and the Codex
    runtime never pass through the hook. The gate tool is the invariant every
    runtime obeys; the hook is the Claude-side backstop; the committed jsonl is
    the review surface."
  - §14 **Mechanical backstop** rewritten to the four rules in Do step 2
    (tokenless blocks under EVERY policy including `human-only`; the human
    mints a token interactively; `PUBLISH_CONNECT=`; email hosts; outreach;
    paid list). Replace "Interactive human-fired … is allowed" with "An
    interactive `/agentic-workflow:publish run` is allowed because it mints
    the token; the hook cannot tell who typed, so it checks the token, not
    the policy."
  - §14 **Channels**: add "email APIs (SendGrid, Postmark, Resend, Mailgun,
    Brevo) and bare mailers count as publish hosts".
  - `templates/codex.rules` 34–39 comment: one sentence "The §14 gate tool
    (`tools/publish-gate.mjs`) is the only mechanical publish check inside a
    Codex run."

  **9. Record**: `plugin.json` → `1.52.0`; `CHANGELOG.md` `[Unreleased]` →
  `## [1.52.0] — <today>` / `### Added — hash-pinned, claim-token publish
  approval (§14)` with bullets: gate tool + verbs, lib hook + four rules +
  hosts, harness count (`123 → N ok`), queue/log schema + migration rule,
  threat model, Codex gap named; put a fresh `## [Unreleased]` / `_(empty)_`
  above it. `README.md` tree `tools/` line → add `publish-gate.mjs`; plugin
  README row 158 → add "`approve <id>` pins the body hash + epoch, `run` fires
  only with a one-time claim token, `reconcile <id>` resolves an unknown
  outcome", tree block → add `tools/publish-gate.mjs # shipped by the plugin:
  stamp · approve · claim · outcome · reconcile · status` next to `ci-wait.mjs`.

  **10. n=1 in this repo** (last, after lint is green): create
  `docs/product/launch/publish-queue.md` from the new template (Policy
  `human-only`, project name agentic-workflow) with ONE row `P-001 | post |
  devto | 2026-10-07 09:00 | draft | no | | | | | docs/product/launch/announcements/dev-to.md | 1.52.0 release note`
  and the `### P-001 — devto` body = exactly this one line:
  `agentic-workflow 1.52.0: a publish-queue item now fires only for the exact body you approved — hash-pinned, epoch-bound, claimed once.`;
  run `stamp` → `approve P-001` → change `once` to `twice` in the body →
  `claim P-001`; record the exact REFUSED line, the row (`draft`,
  `epoch 2`, `approved-for` empty) and `wc -l publish-claims.jsonl` (= 2) in
  the handoff; leave P-001 at `draft`; commit queue + jsonl (locked decision,
  master plan).
- **Verify**: `node tools/lint.mjs` green (includes hook-test ≥ 136 ok + the
  new 10.8 selftest); `node tools/hook-test.mjs` ends `hook-test: clean`;
  `node plugins/agentic-workflow/tools/publish-gate.mjs --selftest` ends
  `publish-gate selftest: clean`; `bash -n` on the new lib hook; `diff <(sed -n
  '250,290p' plugins/agentic-workflow/templates/WORKFLOW.md) <(sed -n '242,282p'
  docs/WORKFLOW.md)` and the §14 equivalent are empty (recompute the offsets
  after the edit — grep the headings); `git grep -n 'publishing guardrail'
  plugins/agentic-workflow/hooks/hooks.json` finds the needle at the start of
  the description; the n=1 REFUSED line is quoted verbatim in the handoff log;
  no file under `ecc-src/` or any ECC text enters the tree; `claude
  --plugin-dir plugins/agentic-workflow` loads without a hook error (the
  staging verify). Catalog: none.
- **Read budget**: ≈ 960 lines (under 1,500). Suits: `security`.

**Checkpoint ckpt-p1** ends phase 1 — ONE fresh `reviewer` on **Fable**
(security boundary: a fail-closed hook over untrusted command text, a token
that gates an irreversible outward act, a tool that rewrites a human-reviewed
file). Re-runs `node tools/lint.mjs`, diff-reviews
`feat/launch-media-plan..mission/publish-approval`, and checks specifically:
every refusal path exits 2 with the brief's text; no `eval`/interpolation of
queue or jsonl text in the hook; writes are temp + rename; the old 7-column
migration is idempotent; §3/§14 are identical across both copies; the n=1
REFUSED line in the handoff matches the metrics-doc shape; nothing from ECC.
Then staging verify (lint + `claude --plugin-dir` load) → one PR to `main`
(`feat(publish): 1.52.0 — hash-pinned approval + claim token (§14)`), human
merges.

---
_Size every brief to its read budget; split any that can't fit and note the
split. Each session's outcome and any deviation lands in
`.plans/publish-approval.state.md`, never only in chat._
