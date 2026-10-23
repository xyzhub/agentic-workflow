---
status: frozen
owner-agent: architect
refresh-trigger: never
---

# agentic-workflow — Decision memos: jev-browser (D1–D8)

_Shape-before-build analysis for the feature brief
`docs/product/decisions/2026-10-23-jev-browser-brief.md`. Authored by the
`architect` 2026-10-23. Eight decisions in one file because they constrain each
other (packaging fixes the backend interface; the question set fixes the state
format; the hand-off shape fixes the eval). Every claim is labelled **fact**
(cited) / **inference** / **assumption**. The owner delegated the choice; each
memo therefore ends with a firm recommendation the orchestrator can lock as a
dated decision pointing here._

## Verified facts the memos lean on

| # | Fact | Source |
|---|---|---|
| F1 | Jev request: `POST /v1/systemone`, body `{model, state, questions}`; `state` may be a string, object or array; question types `noul`, `choice`, `score`; choice answers carry `choice`, `probabilities`, `confidence`; `usage.input_tokens` is returned. All questions in one request are evaluated in parallel, so hundreds of questions cost about the same latency as one. Oversized state → token-limit error (split and retry). | docs.rs/typesafe-jev (mirrors TypeSafe API reference field for field); docs.litellm.ai typesafe pass-through example; owner session 2026-10-22 |
| F2 | Jev "reads questions literally"; split multi-factor judgments into separate questions. | promptfoo.dev/docs/providers/typesafe |
| F3 | browser-use/jev-ultrafast (MIT, Python): `state = {page:{url,title,text}, elements:[{index,label,role,value,checked,selected,expanded,operations,options?}], recent_actions:[last 10]}`; questions = one `operation` choice (CLICK / TYPE_TEXT / SELECT / plus page-specific controls / DONE / BLOCKED) + one `<op>_target` choice per operation listing only compatible elements; typed text from a small LLM returning `{"text": ...}` or `{"text": null}`; `MAX_STEPS = 60`; **no confidence gate in `choose()`** (it only validates the chosen head). | github.com/browser-use/jev-ultrafast `jev_ultrafast/model.py`, `questions.py` (read 2026-10-23) |
| F4 | Chrome ≥ 136 ignores `--remote-debugging-port`/`--remote-debugging-pipe` on the default user-data-dir; a non-default `--user-data-dir` is required; Chrome for Testing keeps the old behaviour. | developer.chrome.com/blog/remote-debugging-port |
| F5 | Node 22 ships a global `WebSocket` **client** with no flag (server side still needs `ws`). This repo runs Node 24.12 locally; `tools/lint.mjs` declares Node ≥ 18, `ccp setup --tui` needs ≥ 22.19. | nodejs.org v22 release announcement + third-party coverage; repo `tools/lint.mjs`, `tools/headless.mjs:257` |
| F6 | BrowserOS neo exposes ONE local MCP server at `http://127.0.0.1:9200/mcp`, transport **Streamable HTTP**, no auth header documented. Its **tool names are not published** on the docs pages fetched. | docs.browseros.com/neo/mcp, /neo/mcp/manual |
| F7 | Playwright MCP: `browser_snapshot` (accessibility snapshot) + `browser_click` / `browser_type` / `browser_select_option` / `browser_navigate` taking a `target` ref "from the page snapshot"; `--cdp-endpoint` attaches to a running browser; `--port` serves HTTP (docs inconsistent on SSE vs streamable). | github.com/microsoft/playwright-mcp README |
| F8 | Chrome DevTools MCP: `take_snapshot(pageId)` returns elements with `uid`; `click(pageId, uid)`, `fill(pageId, uid, value)`, `fill_form`, `press_key`, `navigate_page`; no `select` tool (`fill` handles `<select>`). | github.com/ChromeDevTools/chrome-devtools-mcp docs/tool-reference.md |
| F9 | Repo reality: `tools/*.mjs` are zero-dependency; `run-claude.mjs` passes `--strict-mcp-config` and a fixed `--tools`/`--allowedTools` list; `frontend`, `reviewer`, `designer`, `researcher`, `architect` have Bash; **`marketing` and `business` have no Bash** (agents/*.md front matter); tests are `tools/*-test.mjs` run by `node`, CI is `.github/workflows/lint.yml` → `node tools/lint.mjs`. | repo read 2026-10-23 |

**Not verified** (treated as assumptions below): BrowserOS neo's tool names and
snapshot format (F6); whether Jev's `confidence` is exactly top-1 − top-2
(owner inference); Jev pricing per input Mtok; Playwright MCP HTTP transport
variant; jev-ultrafast's 7.1 s Google Flights claim.

---

## D1 — Packaging

### The question
Where does the fast-browser loop live and how do the three runtimes reach it?
Constrains: dependency policy, how `--strict-mcp-config` children call it, how
Codex/OpenCode call it, and the eval harness location.

### Option A — `tools/browse.mjs` (zero-dep Node CLI) + a `browse` skill
- **How it works here** — one standalone file like `ledger.mjs`/`headless.mjs`:
  `node tools/browse.mjs run --goal "…" --url … [--backend auto|cdp|mcp:<url>|pw] [--json]`.
  A `skills/browse/SKILL.md` tells agents when and how to call it and what the
  result JSON means; `frontend.md:122` and `reviewer.md:56` add one line: "if
  `TYPESAFE_API_KEY` is set, prefer `node tools/browse.mjs`". Reached via Bash
  in all three runtimes, inside `--strict-mcp-config` children, with no MCP
  registration.
- **Tradeoffs** — fits every repo convention (F9); testable with
  `tools/browse-test.mjs` offline; the loop is deterministic code, not prompt.
  Bad at: anything needing Playwright's locator engine (iframes, shadow DOM
  deep-dives) — out of v1 scope anyway.
- **Operational cost** — one file + one skill + eval fixtures; no install step
  for the CDP backend; Playwright backend reuses the `npx playwright` the roles
  already use.
- **Cost of reversal** — low: a CLI can later be wrapped as an MCP server
  (Option B) without changing the loop.

### Option B — an MCP server (`tools/browse-mcp.mjs`, stdio)
- **How it works here** — same loop behind MCP tools (`browse_run`, `browse_step`).
  Must be registered in `.mcp.json`/OpenCode/Codex configs; `run-claude.mjs`
  children are launched with `--strict-mcp-config`, so it would also need to be
  injected via `--mcp-config` per child (`run-claude.mjs:250`).
- **Tradeoffs** — nicer tool-call ergonomics; but a stdio MCP server in plain
  Node means hand-writing JSON-RPC framing (the plugin has no `@modelcontextprotocol/sdk`),
  and Codex/OpenCode registration differs per runtime.
- **Operational cost** — three runtime configs + child injection; a second
  surface to keep in parity (#81-style hook-parity work recurs).
- **Cost of reversal** — medium: configs and agent prompts reference tool names.

### Option C — depend on `browser-use/jev-ultrafast` (Python, `uv`)
- **How it works here** — an optional install (ccp-tui precedent) into a
  plugin-owned dir, invoked via Bash. The plugin would wrap it for secrets,
  gating and result JSON.
- **Tradeoffs** — proven loop and snapshot script (F3); but Python + `uv` on
  every owner machine, the upstream loop has **no confidence gate, no
  irreversible gate and no secret references** (F3) — the exact AC2/AC4 rules
  would live in a fork; Chrome only via its harness.
- **Operational cost** — a second toolchain and an upstream fork to track.
- **Cost of reversal** — medium-high: the fork accumulates the differentiating logic.

### Recommendation — **Option A**
The loop is ~300 lines of fetch + JSON; the value is in the question set and the
gates, which must be ours anyway (Option C lacks them). A CLI is the only shape
all three runtimes and `--strict-mcp-config` children reach without config.
Port `snapshot.js` ideas from jev-ultrafast (MIT, attribute it) rather than the
package. **Strongest case against:** a CLI returns one blob per run; an MCP
server could stream per-step state to the calling agent. Mitigated by
`--json` + `--trace <file>` and a `step` subcommand (D5).
Note for the plan: `marketing`/`business` lack Bash (F9) — AC6 "research roles"
needs either Bash added to those two agents' tool lists or routing through
`researcher`. Recommend adding Bash to both (one-line front-matter change,
same trust level as `researcher`).

**Values this decision settles:**
- Entry point `node tools/browse.mjs` (subcommands `run`, `step`, `snapshot`, `doctor`, `eval`).
- Skill name `browse` at `skills/browse/SKILL.md`.
- No runtime dependency added to the plugin; Playwright reached only via `npx playwright` as today.

### What would change the answer
If an owner runtime stops exposing Bash to subagents, or if the per-step
streaming need (Option B) is measured as the blocker for AC2 hand-offs.

---

## D2 — Browser backends and the adapter interface

### The question
How does `browse.mjs` drive "any browser Claude can control", and what is the
single interface the loop sees? Constrains the element-table format (D3), the
eval harness (D7) and what "BrowserOS neo" support means (AC5).

### The adapter interface (locked regardless of backend)
```
interface Backend {
  open(url?)                      -> void
  snapshot()                      -> { url, title, text, elements: Element[] }
  act(op, target?, value?)        -> { pageChanged: boolean }   // op: CLICK|TYPE|SELECT|SCROLL_UP|SCROLL_DOWN|ENTER|WAIT
  close()
}
Element = { index, role, label, value?, checked?, selected?, expanded?, ops: ('CLICK'|'TYPE'|'SELECT')[], options?: [{index,label,value}], ref }
```
`ref` is backend-private (a CDP backendNodeId, a Playwright MCP ref, a
DevTools-MCP uid); the loop and Jev only ever see `index`. All three MCP servers
(F7, F8, assumption for F6) and CDP's accessibility tree can produce this shape.

### Option A — raw CDP in Node (zero deps)
- **How it works here** — `fetch(http://127.0.0.1:9222/json)` + global `WebSocket` (F5)
  → `Accessibility.getFullAXTree` / `DOM` + `Runtime.evaluate` of a bundled
  `snapshot.js` (ported from jev-ultrafast) returning the element table;
  `Input.dispatchMouseEvent`/`insertText` for acts. The tool can also **launch**
  Chrome/Chrome for Testing with `--user-data-dir=<plugin dir>` (F4: required on
  Chrome ≥ 136). BrowserOS neo is Chromium; **inference**: it accepts a
  remote-debugging flag like any Chromium, but that is not documented (F6).
- **Tradeoffs** — fastest (no subprocess), zero deps, works in CI with a
  headless Chrome for Testing. Bad at: writing a correct snapshot/act layer is
  the bulk of the work; cross-origin iframes out (scoped out).
- **Operational cost** — own `snapshot.js` to maintain.
- **Cost of reversal** — low: it is one adapter behind the interface.

### Option B — Playwright via `npx playwright` subprocess
- **How it works here** — spawn a tiny Playwright script that reads JSON commands
  on stdin (`snapshot`/`act`) and writes JSON back; `page.locator` + ARIA
  snapshot build the table. Reuses what `frontend`/`reviewer` already run.
- **Tradeoffs** — mature locator/actionability waits, headless in CI, built-in
  Chromium download. Costs a `npx` cold start (seconds) per run, and
  Playwright's own browser, not "the owner's browser" (connectOverCDP exists but
  re-adds the F4 constraint).
- **Operational cost** — none beyond today's `npx playwright` reliance.
- **Cost of reversal** — low (adapter).

### Option C — MCP client to a local browser MCP server (BrowserOS neo, Playwright MCP, Chrome DevTools MCP)
- **How it works here** — a minimal Streamable-HTTP MCP client in plain Node:
  `POST <url>` with JSON-RPC `initialize` → `tools/list` → `tools/call`,
  honouring the `Mcp-Session-Id` header and `text/event-stream` responses
  (parse SSE lines; ~80 lines, no SDK). Map tools per server: Playwright MCP
  `browser_snapshot`/`browser_click`/`browser_type`/`browser_select_option`
  (F7); DevTools MCP `take_snapshot`/`click`/`fill`/`press_key` with `uid`
  (F8); BrowserOS neo **discovered at runtime from `tools/list` and matched by
  name pattern** (snapshot|click|type|fill|navigate) because its names are
  unpublished (F6) — a `doctor` subcommand prints the match so a mismatch is a
  finding, not a silent failure.
- **Tradeoffs** — the only path that drives the owner's real BrowserOS neo
  session (logged-in state, extensions) without the F4 flag problem; also makes
  "any MCP browser" true by construction. Bad at: per-step latency includes the
  server's snapshot cost (unmeasured; Playwright MCP snapshots of big pages are
  slow — assumption), and snapshot text formats differ per server, so the
  table parser needs per-server adapters.
- **Operational cost** — three small tool maps; one needs live BrowserOS to finish.
- **Cost of reversal** — low (adapter).

### Fallback for surfaces only Claude can call (Claude in Chrome, computer use)
`browse.mjs step --state <snapshot.json> --goal …` accepts a snapshot the
**calling agent** produced (it pastes the page's numbered element list in the
loop's JSON shape) and returns the next decision `{op, index, valueRef}`; the
agent performs the act with its own surface and calls `step` again. Jev still
decides (fast); only execution is agent-driven. Secrets stay by reference (D4).

### Recommendation — **A + C in v1, B deferred; `--backend auto` order: `mcp:` URL if given → BrowserOS neo at 9200 if it answers `initialize` → CDP at `BROWSE_CDP_URL`/9222 → launch Chrome for Testing/Chrome with a plugin-owned profile; plus the `step` fallback.**
A satisfies "fast" and CI; C satisfies "BrowserOS neo" and "any browser Claude
can control" literally (every browser MCP server) and avoids the Chrome ≥ 136
profile restriction. B adds nothing A+C do not, and its cold start fights AC1.
**Strongest case against:** two adapters in one session is a lot; A's
`snapshot.js` is the riskiest code. Mitigation: build C-Playwright-MCP first
(F7 is documented, `npx @playwright/mcp --port` runs locally for the eval),
then A, then C-BrowserOS when the owner can run `doctor` against neo.

**Values this decision settles:**
- Adapter interface above; element row text format `[index] role label · value` (the Jev-facing form).
- Default CDP port 9222; BrowserOS neo URL `http://127.0.0.1:9200/mcp`; env `BROWSE_CDP_URL`, `BROWSE_MCP_URL`.
- Chrome launched by the tool always uses `--user-data-dir` under the plugin's data dir (XDG, as `ccp-ui.mjs` does), never the default profile.

### What would change the answer
BrowserOS neo publishing a documented CDP port (A then covers it and C can
shrink to Playwright/DevTools MCP) or measured MCP snapshot latency > 1 s on
the 100-element fixture (then A becomes the only "fast" path and C the
"reach" path).

---

## D3 — Jev question set, thresholds, state serialization

### The question
Which questions go in the single per-step request, what gates act on them, and
how big may the state get? Constrains eval metrics (D7) and the trace (D5).

### Option A — jev-ultrafast's set verbatim (operation + per-op targets, no nouls, no gate)
- Proven (F3) but violates AC2 (no gate), AC3 (DONE trusted), and the field
  reports (cookie-banner/bot-check). Not an option on its own.

### Option B — operation + per-op targets + five nouls, one request, fixed gates
- **How it works here** — questions per step:
  `operation` (choice: CLICK, TYPE, SELECT, SCROLL_UP, SCROLL_DOWN, ENTER, WAIT, DONE, BLOCKED — only ops with ≥1 compatible element are offered, as F3 does);
  `click_target`, `type_target`, `select_target` (choice over compatible elements only; read **only** the head for the chosen op — F3's rule, owner-verified);
  `type_value` (choice over `{{secret:*}}` references available for this run + `{{goal:<n>}}` literals extracted from the goal — see D4);
  nouls: `done` ("every requirement visibly satisfied"), `irreversible` ("the next action pays, deletes, sends, or submits something that cannot be undone"), `bot_check`, `cookie_banner`, `error` ("the page shows an error or failed state").
  Jev evaluates all in parallel (F1), so the noul set is free in latency.
- **Gates** — act only if `operation.confidence ≥ 0.70` AND chosen-target
  `confidence ≥ 0.70`; `bot_check ≥ 0.70` → return BLOCKED(bot); `cookie_banner ≥ 0.80`
  → one allowed CLICK on the banner's accept/reject element (its own target
  head) before the goal; `irreversible ≥ 0.50` → stop and hand off (D5)
  unless `--allow-irreversible`; `done ≥ 0.80` **or** `operation = DONE` → run
  the D5 verification; `error ≥ 0.80` → hand off with state; `MAX_STEPS = 30`
  (goals are short per field report), consecutive `WAIT` ≤ 3, identical
  (op,index) repeated 3× → hand off as `stuck`.
- **State serialization** — JSON object (F1 allows it): `{goal, page:{url,title,text≤2000 chars}, elements[], recent_actions[last 5]}`.
  Elements cap **80 rows** per request: keep all form controls on screen,
  then viewport-visible, then by DOM order; if > 80 interactive elements,
  **page by viewport**: SCROLL_* is offered and the hidden count is stated in
  `page.text` ("+47 more below"). On Jev token-limit error (F1) halve the
  element budget and retry once.
- **Tradeoffs** — fixed thresholds are easy to eval and to explain in a trace;
  the irreversible noul will false-positive on ordinary "Submit" (expected —
  it hands off rather than acts, which is the safe side).
- **Operational cost** — thresholds live as named constants in `browse.mjs`
  and in the eval report so they can be tuned with evidence.
- **Cost of reversal** — low: thresholds are constants; questions are strings.

### Option C — two-request step (nouls first, then operation only if clear)
- Halves exposure of the operation head to banner/bot pages, but doubles latency
  (≈400 ms/step) for no measured accuracy gain; F1 says parallel questions are
  free. Rejected unless B's eval shows noul/operation interference.

### Recommendation — **Option B**
Single request, read only the chosen head, five nouls, thresholds above, 80-row
cap with viewport paging. **Strongest case against:** the thresholds are field
lore, not measured here; `confidence` semantics are inferred (owner). The eval
(D7) exists to replace lore with numbers before the thresholds are considered final.

**Values this decision settles:**
- Operation set and noul names as listed; `CONF_GATE = 0.70`, `DONE_GATE = 0.80`, `BOT_GATE = 0.70`, `BANNER_GATE = 0.80`, `IRREV_GATE = 0.50`, `ERROR_GATE = 0.80`, `MAX_STEPS = 30`, `MAX_ELEMENTS = 80`, `TEXT_CAP = 2000`, `HISTORY = 5`.
- State is a JSON object, not prose.

### What would change the answer
Eval showing per-step accuracy < 90% at 0.70 (raise gate) or > 20% needless
hand-offs on fixtures (lower it); token-limit errors at 80 rows (lower cap).

---

## D4 — Typed text and secrets

### The question
Where do typed values come from, and how do secrets never touch a model or Jev?

### Option A — references only (`{{secret:name}}` + goal literals), no model call
- **How it works here** — before the loop, `browse.mjs` parses the goal for
  quoted literals and `{{secret:…}}` tokens and builds a **value menu**:
  `goal:1 = "Jane Doe"`, `secret:alice.password`. The `type_value` head is a Jev
  choice over menu *names* plus `none`. Secrets resolve at act time from
  `docs/AUTH.md` §Test users rows (which store env **names**, template
  `auth.md`) → `process.env[NAME]`; the value goes straight to the backend
  `act()`. The Jev request, the trace and the JSON result only ever contain
  `{{secret:alice.password}}`. Missing env name → hand off `needs_secret`.
- **Tradeoffs** — unrepresentable leak (the value has no path to a prompt);
  no model latency; but cannot invent text (a search query not in the goal
  fails). Mitigation: the hand-off tells the calling agent "no value for
  field X" and the agent re-runs with a literal — the agent IS the text model.
- **Operational cost** — none beyond AUTH.md reading.
- **Cost of reversal** — low.

### Option B — A plus an optional small-model call for free text
- jev-ultrafast's shape (F3): a `{"text": …}` helper via an OpenAI-compatible
  endpoint. Needs a second API key/provider config and a prompt that must be
  proven secret-free; adds ~1 s per TYPE.
- **Cost of reversal** — low, but it is a second credential surface to govern.

### Recommendation — **Option A in v1; B only as a later flag `--text-model <url>`**
The calling agent already holds the goal and can supply literals; a run that
needs invented text is a short goal done wrong (field report: one goal per
page/form). **Strongest case against:** research roles walking unknown forms
will hit `needs_secret`/`needs_value` hand-offs more often. Acceptable: the
hand-off is one re-run away and keeps AC4 structural.

**Values this decision settles:**
- Reference syntax `{{secret:<user>.<field>}}` resolved from AUTH.md Test users → env name → value; `{{goal:<n>}}` for quoted literals.
- Secret values are redacted to the reference in trace, result JSON and any log line (a single `redact()` applied at every output boundary, tested).

### What would change the answer
Eval evidence that > 25% of research-role goals need invented text.

---

## D5 — DONE verification, irreversible gating, hand-off shape

### The question
How does a run end, and what does the calling agent get back?

### Option A — Jev-only verification (second `done` noul on the final snapshot with the goal as stop condition)
- Fast, independent of the step that claimed DONE (fresh snapshot, different
  question wording: "Does this page show that <goal> is complete?" plus a
  `stop_condition` noul when `--until "<text>"` is given). Cheap; still Jev.

### Option B — A plus a deterministic check when the caller supplies one
- `--until-url <regex>` / `--until-text "<string>"` / `--until-selector` are
  checked by code on the final snapshot; the Jev noul is the fallback when none
  is given. The calling agent (frontend/reviewer) usually knows the expected URL
  or text.

### Option C — model-based verification (the calling agent judges a screenshot)
- Most trustworthy, but breaks AC1 and returns to today's latency; keep as the
  caller's job after the hand-off, not inside the tool.

### Recommendation — **Option B**, with the hand-off shape below
- **Exit codes:** `0` done-and-verified; `2` done-unverified (Jev said DONE,
  check failed — caller must verify); `3` handed off (low confidence / stuck /
  bot / error / needs_secret / needs_value); `4` irreversible-pending (the
  proposed action is returned, nothing executed); `5` backend unavailable;
  `6` no `TYPESAFE_API_KEY` (prints the exact "do it the old way" line so AC6
  holds); `1` usage/internal error.
- **Result JSON (stdout, `--json`):** `{status, reason, steps, ms_total, ms_jev_median, page:{url,title}, elements:[…≤80 rows], proposed?:{op,index,label,valueRef}, verify:{method, passed}, trace_path}`.
- **Trace (`--trace <file>`, default under the scratch dir):** one JSON line
  per step: snapshot digest, questions sent (with element labels), full answer
  probabilities, chosen op/target, gate outcomes, ms; secrets redacted by
  reference (D4). Never written into the repo.
- **Irreversible:** the step that trips `IRREV_GATE` returns exit 4 with
  `proposed`; the caller re-runs with `--allow-irreversible --resume <trace>`
  or performs that one action itself. Resume replays nothing; it re-snapshots.

**Strongest case against:** seven exit codes is more surface than
`ledger.mjs`-style tools carry; but the calling agents branch on them in a
skill, and a single "failed" code would push the branching into prose.

**Values this decision settles:** exit-code table; result JSON keys; trace
line schema; `--until-*` flags.

### What would change the answer
If Jev's `done` noul proves ≥ 98% precise on the eval, exit 2 can collapse into 0.

---

## D6 — Replayable scripts from verified runs

### Option A — ship in v1: `browse.mjs replay <trace>` re-executes recorded (op, label) pairs by label match, no Jev
### Option B — v1 records enough (the trace already has op, role, label, valueRef per step); `replay` is a later ~80-line addition
### Option C — emit a Playwright script from the trace (`browse.mjs export-playwright`), so verified flows become repo tests

### Recommendation — **Option B now; C is the better v2 than A**
The trace schema (D5) is designed so both A and C are derivable later; neither
has a measured need in the session that must also land D2's adapters and D7's
eval. C is the one with lasting value (a verified flow becomes a committed
`npx playwright` test the project's gates run without a key) and is cheap to
leave out now. **Strongest case against:** owner asked for "very fast";
replay-without-Jev is the fastest path for repeated verification — but
Playwright export gives the same without inventing a second runner.

**Values this decision settles:** trace rows carry `{op, role, label, valueRef, url_before, url_after}` so export is possible later.

### What would change the answer
A mission where reviewer re-verifies the same flow > 3 times (then build C first).

---

## D7 — Eval design

### The question
How is "accurate" measured, and what runs in CI without a key?

### Option A — local fixture pages + `browse.mjs eval` report, key-gated; offline unit tests in CI
- **How it works here** — `tools/fixtures/browse/*.html` served by a 20-line
  `http.createServer` in the eval: `login.html` (2 fields + button),
  `cookie-banner.html`, `wizard.html` (3 pages, one goal each), `big.html`
  (120+ interactive elements: a settings grid; the target is below the fold so
  paging is exercised), `irreversible.html` (a "Delete account" button that
  must trip exit 4), `error.html`. Each fixture ships `cases.json`:
  `{goal, expected: [{op, label}], until}`. The eval runs each case N times
  (default 3) through the Playwright-MCP or CDP backend against Chrome for
  Testing, and reports per-step accuracy (expected op+label hit), hand-off
  rate, false-DONE rate, p50/p95 Jev ms, p50 step ms, input tokens; writes
  `docs/product/engineering/browse-eval.md` only when run by hand (never CI).
  **CI** (`tools/browse-test.mjs`, no key): element-table builder from a
  fixture DOM string, gate logic against **recorded Jev answers** (JSON
  fixtures captured once with the key, secrets already references), redaction,
  exit codes, MCP client framing against a stub server. `lint.yml` picks it up
  like the other `*-test.mjs`.
### Option B — hosted sites (Google Flights-style) in the eval
- Realistic but non-deterministic, bot-checked (field report), and leaks
  nothing but wastes credits; keep one optional `--live <url>` case for manual runs only.

### Recommendation — **Option A**, with recorded-answer fixtures making the gate logic CI-testable.
**Strongest case against:** fixtures are easier than real pages; the accuracy
number will flatter. State that in the report header; the owner's real signal
is frontend/reviewer usage in the next venture mission (file as an OB).

**Values this decision settles:** fixture list above; report metrics list;
eval runs only with `TYPESAFE_API_KEY`; CI never needs the key.

### What would change the answer
Credits/price per run become material (then N=1 and fewer cases).

---

## D8 — Phasing and session estimate

Honest sizing, by piece (one builder session ≈ what `ledger.mjs` or the
precompact-handoff mission landed):

| Piece | Size | Risk |
|---|---|---|
| Jev client + question builder + gates + redaction + exit codes (D3–D5) | 1 session | low; owner's session already proved the request |
| Playwright-MCP backend via plain-Node streamable-HTTP client + `step` fallback (D2 C) | 0.5–1 session | medium (SSE framing, ref format undocumented in README — read from a live `browser_snapshot`) |
| CDP backend + ported `snapshot.js` (D2 A) | 1–1.5 sessions | **highest** — the snapshot script is where accuracy lives |
| BrowserOS neo adapter (D2 C) | 0.5 session, **blocked on owner's machine** (`doctor` against 9200) | unknown tool names (F6) |
| Fixtures + eval + CI tests + skill + agent prompt lines (D7, D1) | 1 session | low |
| Docs: WORKFLOW "Bash-driven browser verification" pointer, AUTH.md note, catalog | 0.25 | low |

### Recommendation — **two phases, three sessions, not one**
- **Phase 1 (2 sessions, ships a usable v1):** D1 CLI + D3–D5 loop + Playwright-MCP
  backend + `step` fallback + fixtures/eval/CI + skill + prompt lines. AC1–AC4,
  AC6, AC7 met; AC5 met for "more than one surface" via Playwright MCP + `step`,
  with BrowserOS neo **named and auto-probed** but verified only by `doctor`.
- **Phase 2 (1 session):** CDP backend (fast path, Chrome for Testing launch)
  and the BrowserOS neo tool map, after the owner runs
  `node tools/browse.mjs doctor` on a machine with neo and pastes the
  `tools/list` output into the plan (the one fact this memo could not fetch).
- One session is not honest: the snapshot layer plus two transports plus an
  eval is three distinct bodies of code, and the owner's rule "what a plugin
  mission leaves out is never revisited" argues for scoping Phase 2 **inside
  this mission** rather than deferring it to a later one.

**Strongest case against:** Phase 1 without CDP leans on `npx @playwright/mcp`
cold start, so the first measured "fast" number will be MCP-bound, not Jev-bound.
Report both `ms_jev` and `ms_step` so the gap is visible and motivates Phase 2.

**Values this decision settles:** Estimate 3 sessions; Phase 2's blocker is the
owner's `doctor` output.

### What would change the answer
If `doctor` against BrowserOS neo shows a documented CDP endpoint, Phase 2
shrinks to the CDP backend alone (then 2.5 sessions).

---
_The architect consults; the **orchestrator locks** (owner delegated). Each D
above lands as a dated locked decision in the mission master plan pointing at
this file. The `advisor` may argue against any of them at its gate._

## Counsel (technical lens)

_Advisor (Fable), 2026-10-23. Verdict: **proceed-with-changes** — lock D1, D3–D7 as
written; amend D2/D8; tighten the secret boundary and the research-role grant.
Pasted by the orchestrator (the advisor role has no write tool)._

1. **Phase order (should).** Phase 1 must ship the raw-CDP backend (Chrome for
   Testing, plugin-owned profile) + `step` fallback, so the first deliverable proves
   "fast"; Playwright-MCP and BrowserOS neo move to Phase 2.
2. **BrowserOS neo unverified (blocker for Phase-2 scoping).** docs.browseros.com
   confirms only `http://127.0.0.1:9200/mcp` — no transport, auth or tool names.
   `doctor` (initialize + tools/list + print) ships in Phase 1; the neo adapter is
   estimated only after the owner pastes its `tools/list`. If never run, nothing
   ships for neo and AC5 is met by CDP + Playwright-MCP + `step`.
3. **Secret leak paths (should).** Never serialize `value` of password/credential
   inputs; taint and blank any element that received a `{{secret:*}}`; `redact()`
   the state BEFORE the Jev request, not only on output; `step --state`/`--resume`
   JSON redacted too; trace not in shared scratch; eval asserts no resolved secret
   appears in any byte sent or written.
4. **Node floor (should).** Global `WebSocket` needs Node ≥ 22; `browse.mjs` checks
   `process.versions.node` and exits 5 with a clear line.
5. **Research-role access (should).** Don't grant `marketing`/`business` full Bash:
   use a scoped `Bash(node */tools/browse.mjs *)` allow pattern where the runtime
   honours it, else route browser goals through `researcher`.
6. **Accuracy.** Skill says exit 2 = unverified DONE, caller verifies; SCROLL offered
   when hidden elements exist, tested on the 120-element page; bounded settle wait
   (≤1.5 s DOM-stable/network-idle) before each snapshot.
7. **Eval honesty.** Recorded-answer CI tests prove gate plumbing, not accuracy; the
   report says so; only the key-gated live eval gives accuracy. File an obligation
   to measure hand-off and exit-2 rates on the first venture mission that uses it.
8. **Vendor.** Cost negligible (~$0.042/M input tokens, secondary sources). Jev
   5xx/timeout (3 s) → retry once, then exit 5 "backend unavailable (jev)" with page
   state. Pin `jev-1.14.0` in the eval report; `BROWSE_JEV_MODEL` override.
9. **Scope statement.** "Any browser Claude can control" = any MCP browser server +
   Chrome via CDP + a hand-the-next-action-back fallback for Claude-only surfaces
   (Claude in Chrome, computer use). State this to the owner at approval.
