---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: jev-browser — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide. Planned 2026-10-23 on `plan/jev-browser` (main at 495bcc2, plugin
v1.68.0); the build branch is `feat/jev-browser` from `plan/jev-browser`
(OQ-2, locked 2026-10-23). Converted from
`docs/product/decisions/2026-10-23-jev-browser-brief.md` (2026-10-23) — its
AC1–AC7 and locked decisions L1–L3 are settled ground; the memos
`docs/product/decisions/2026-10-23-jev-browser-memos.md` D1, D3, D4, D5, D7 and
the CDP half of D2 are the specs; counsel fixes #3, #4, #5, #6, #8 are binding.
The AC-N ids below map 1:1 onto the brief's AC1–AC7; AC-8 and AC-9 are the
release and obligation criteria this plan adds._

Goal: an agent with `TYPESAFE_API_KEY` set hands a short browser goal to
`node tools/browse.mjs run` and the loop runs with one ~200 ms Jev request per
step and no model call per step; it never acts below a confidence gate, hands
control back (with page state) when unsure, blocked, at a bot check or before
an irreversible action; secrets travel by reference only; every other surface
gets a `step` hand-back; without the key every agent behaves exactly as today.

Estimate: 1 session — one brief (S1), one one-shot Fable checkpoint (`tools/`
is `security-boundary`, `templates/gate-classes.md:32`, reviewer tier `top`),
staging verify (this repo: lint + `--plugin-dir` load), one PR to `main`. No
`phases` (owner L1, 2026-10-23: "yes do the one session for now"). The work is
one new CLI (~600 lines), one test file (~250 lines), six fixture pages +
recorded answers, one skill doc, ~12 lines of prompt edits, one WORKFLOW row,
CHANGELOG + versions; pre-resolved reads total ~1,100 lines, inside the
1,500-line budget. A corrective is counted when it fires, never pre-booked.
What was cut to fit (per L2's spirit): see Locked decisions (planner cuts).

## Tasks

1. **`tools/browse.mjs` — the loop** (new, zero-dep, Node ≥ 22).
   - AC-1 Fast: `run --goal "…" --url <u> [--cdp <url>] [--until-url <re>|--until-text <s>] [--allow-irreversible] [--json] [--trace <file>]`
     snapshots the page, builds ONE Jev request per step (D3 question set:
     `operation` choice over the ops with ≥ 1 compatible element, one
     `<op>_target` head per offered op, `type_value` over the value menu,
     nouls `done`, `irreversible`, `bot_check`, `cookie_banner`, `error`),
     reads only the head of the chosen op, acts through the CDP backend, and
     loops to `MAX_STEPS = 30`. No model call anywhere in the loop. Jev via
     global `fetch` to `BROWSE_JEV_URL` (default
     `https://api.typesafe.ai/v1/systemone`), model `BROWSE_JEV_MODEL`
     (default `jev-latest`), `AbortSignal.timeout(3000)`, retry once on
     timeout/network/5xx, then exit 5 `backend unavailable (jev)` with page
     state (counsel #8); on a token-limit error halve the element budget and
     retry once (D3).
   - AC-2 Accurate: act only when `operation.confidence ≥ CONF_GATE (0.70)`
     AND the chosen target's confidence ≥ 0.70; `bot_check ≥ 0.70` →
     hand off `bot`; `cookie_banner ≥ 0.80` → one allowed CLICK on the
     banner head before the goal; `irreversible ≥ 0.50` → exit 4 with
     `proposed` unless `--allow-irreversible`; `error ≥ 0.80` → hand off
     `error`; consecutive WAIT ≤ 3; identical (op,index) 3× → hand off
     `stuck`. Settle wait ≤ 1.5 s (DOM-digest stable or load event) before
     every snapshot; SCROLL_DOWN offered whenever elements are hidden below
     the 80-row window, SCROLL_UP when `scrollY > 0` (counsel #6).
   - AC-3 DONE never trusted alone: `done ≥ 0.80` or `operation = DONE` →
     fresh snapshot → deterministic check when `--until-url`/`--until-text`
     is given, else a second Jev request with the D5 wording ("Does this page
     show that <goal> is complete?"); pass → exit 0, fail → exit 2
     `done-unverified` (the skill tells the caller to verify).
   - AC-4 Secrets by reference: the goal may carry `{{secret:<user>.<field>}}`
     (resolved at act time from `docs/AUTH.md` **Test users** rows: `<user>`
     matches the Role or login cell case-insensitively, `<field>` is
     `password` or `login`; a `$NAME` cell → `process.env[NAME]`, a seeded
     literal → itself; missing → hand off `needs_secret`) and quoted literals
     become `{{goal:<n>}}`; the `type_value` head chooses a menu NAME.
     Resolution timing: ALL menu secrets are resolved ONCE at `run` start
     into a closure (`makeVault(menu, authMd, env)` → `{typeInto(ref) ,
     redact}`); `redact()` is built from that closure and matches each
     value's raw, URL-encoded (`encodeURIComponent`) and HTML-escaped forms;
     `act()` reads the closure by reference; resolved values are never
     placed on `state`, a trace row, the result, or any object that reaches
     `JSON.stringify`. `redact()` runs on the state BEFORE the Jev request,
     on every trace line, on the result JSON and on every stderr line;
     `type=password` inputs never serialize a value; an element that
     received a secret is tainted and its `value` blanked for the rest of
     the run; `step --state` input is redacted too (counsel #3). **`step`
     never resolves secrets**: a decision whose `valueRef` is a
     `{{secret:*}}` exits 3 `needs_secret` with the line "secrets cannot be
     typed on a hand-back surface — use run or --cdp" (plan-judge
     2026-10-23).
   - AC-5 Surfaces: (a) attach to a running Chromium via `--cdp <url>` or
     `BROWSE_CDP_URL` (default `http://127.0.0.1:9222`) — BrowserOS neo is
     Chromium, so a reachable debug port attaches the same way; (b) launch
     Chrome for Testing / Google Chrome found via `BROWSE_CHROME` → PATH
     (`google-chrome`, `chromium`, `chrome`) → the macOS/Linux app paths,
     always with `--headless=new --user-data-dir=<BROWSE_PROFILE_DIR or XDG data>/agentic-workflow/browse/profile
     --use-mock-keychain --password-store=basic --disable-extensions`
     (never the default profile, memo F4); (c) `step --state <snapshot.json>
     --goal … [--history <file>]` for every surface the tool can't drive
     (Claude in Chrome, computer use, MCP browsers): returns the next
     `{op, index, label, valueRef}` and the caller acts. `doctor` reports
     Node ≥ 22, key present (name only), Chrome path, CDP probe at
     `BROWSE_CDP_URL`/9222 (`/json/version`), and a BrowserOS neo probe:
     `/json/version` on `127.0.0.1:9200` plus one JSON-RPC `initialize` +
     `tools/list` POST to `http://127.0.0.1:9200/mcp` whose tool names are
     printed verbatim (counsel #2) — print only, never driven (L2).
   - Exit codes (D5 + counsel #4/#8): 0 done-verified · 1 usage/internal ·
     2 done-unverified · 3 handed off (`low_confidence|stuck|bot|error|needs_secret|needs_value|max_steps`) ·
     4 irreversible-pending · 5 backend unavailable (no Chrome, CDP
     unreachable, Jev down after retry, Node < 22) · 6 no `TYPESAFE_API_KEY`
     (one stderr line: "TYPESAFE_API_KEY not set — verify with Bash-driven
     Playwright as before"). Result JSON on stdout: `{status, reason, steps,
     ms_total, ms_jev_median, page:{url,title}, elements:[≤80], proposed?,
     verify:{method, passed}, trace_path}`. Trace: one JSON line per step
     (`{step, url_before, url_after, op, role, label, index, valueRef,
     questions, answers, gates, ms_jev, ms_step}`) under
     `$(git rev-parse --git-path agentic-workflow/browse)/traces/<utc>.jsonl`
     (dir 0700, file 0600; outside a repo
     `${XDG_STATE_HOME:-~/.local/state}/agentic-workflow/browse/`;
     `BROWSE_TRACE_DIR` overrides), never in the repo, never in a shared
     scratch dir (counsel #3); a `--trace` path that resolves inside the
     worktree (`git rev-parse --show-toplevel`) is refused with exit 1.
   - `snapshot --url|--cdp` prints the numbered element table (the Jev-facing
     form `[index] role label · value`) — the agent's view and the fixture
     capture path.

2. **Skill + prompts + protocol row.**
   - AC-6 `skills/browse/SKILL.md` (≤ 6,000 B) tells an agent when (key set),
     how to write a goal (short, one page/form, quoted literals, secret
     references), the exit-code table and what the caller does on each
     (2 → verify yourself; 3 → read `reason`, act or re-run with a literal;
     4 → perform that one action yourself or re-run `--allow-irreversible`;
     5/6 → Bash-driven Playwright as today), the three surfaces, the secrets
     rule and where the trace is. `agents/frontend.md:121–128` and
     `agents/reviewer.md:56–63` gain two lines each ("if `TYPESAFE_API_KEY`
     is set, prefer `node ${CLAUDE_PLUGIN_ROOT}/tools/browse.mjs` (skill
     `browse`); exit 5/6 → the Playwright path below"); `agents/researcher.md`
     gains a short "Browsing" paragraph; `marketing.md`/`business.md` gain
     one line each: a browser goal is routed through `researcher` (counsel
     #5 — see the planner lock on why no allowlist row). Without the key the
     added lines are no-ops: behaviour is exactly today's.
   - `templates/WORKFLOW.md` §10 gains a **Browser verification** row after
     **Test users / auth access** (`:1044`), ≤ 600 B, naming the command, the
     key, the surfaces and the Playwright fallback; §3 principle 5 (`:245`)
     gains one clause; `commands/verify.md:55` gains one clause. README agent
     row `:99` gains four words. Net WORKFLOW growth ≤ 1,200 B (115,329 of
     120,000 today).

3. **Fixtures + tests + lint.**
   - AC-7 `tools/fixtures/browse/`: `login.html` (2 fields + button),
     `cookie-banner.html`, `wizard.html` (3 screens, one goal each),
     `big.html` (120+ interactive controls, the target below the fold),
     `irreversible.html` ("Delete account"), `error.html`; `cases.json`
     (`{name, fixture, goal, expected:[{op,label}], until}`), `elements/<name>.json`
     (the element tables the loop sees — captured with `snapshot` when a
     Chrome is allowed, OQ-1; else hand-derived from the HTML and labelled
     so), `answers/<name>.json` (Jev answers per step in the F1 shape —
     synthetic here, see Locked decisions: no key on this machine). The
     fixtures are served by a ≤ 20-line `http.createServer` inside the test
     and the CLI.
   - `tools/browse-test.mjs` (CI, no key, no Chrome): pure-function cases
     (element cap + viewport paging on the 120-element table incl. SCROLL
     offered; question builder offers only compatible ops/targets; value
     menu + `{{secret:*}}` parse; `redact()`; gate table; exit-code map; AUTH
     row resolution incl. `$NAME` env and missing → `needs_secret`); loop
     cases through the test-only `--backend fixture:<case>` driver against a
     local stub Jev server (`BROWSE_JEV_URL`) serving the recorded answers:
     login completes with the secret typed — two-sided AC-4 assertion: the
     fixture driver records every `act()` call to a tmp file and the test
     asserts the TYPE act received exactly the fixture secret, while the
     stub Jev server asserts no request body carries it (raw, URL-encoded
     or HTML-escaped) and the trace row / stdout carry only the
     `{{secret:…}}` reference; `step` with a secret `valueRef` → exit 3
     `needs_secret` and the hand-back line; cookie banner clicked first, wizard
     3 goals, big page scrolls then clicks, irreversible → exit 4 with
     `proposed`, error → exit 3, Jev 503 twice → exit 5, no key → exit 6 with
     the exact fallback line, Node-floor check (simulated via
     `BROWSE_FAKE_NODE=20` → exit 5; honoured only when `BROWSE_JEV_URL`
     is loopback, like the fixture driver). A live CDP smoke (launch Chrome
     with `BROWSE_PROFILE_DIR` = a `mkdtempSync` dir, `rmSync` after;
     `snapshot` on `login.html`, ≥ 3 elements) runs only when
     `BROWSE_LIVE_SMOKE=1` and a Chrome binary resolves, else prints
     `skip` and stays green. Header states (counsel #7): recorded answers
     prove gate plumbing, not accuracy.
   - `tools/lint.mjs` gains `checkBrowseHarness` (copy of
     `checkHeadlessHarness`, `:519–533`) wired into the check list (`:1384`).

4. **Release + obligation.**
   - AC-8 `plugin.json` + `package.json` → `1.69.0`; CHANGELOG `[1.69.0] —
     2026-10-23` (Added: fast browser loop, skill, fixtures/tests; Changed:
     frontend/reviewer/researcher prompts, WORKFLOW §10 row).
     `docs/WORKFLOW.md` is NOT re-synced in this mission (post-merge row,
     OB-33 pattern).
   - AC-9 L3 → `.plans/OBLIGATIONS.md` row **OB-34** (post-merge Closing row
     promotes it): the owner runs `browse.mjs doctor` against BrowserOS neo
     and one live `run` with the key; records per-step latency, hand-off
     rate, exit-2 rate, and pastes neo's `tools/list`.

## Value sourcing

| Value | AC | Kind | Where |
|---|---|---|---|
| Jev endpoint `https://api.typesafe.ai/v1/systemone`, body `{model,state,questions}` | AC-1 | locked decision | memos F1 + owner session 2026-10-22; env `BROWSE_JEV_URL` override |
| model `jev-latest` | AC-1 | locked decision | brief Evidence; `BROWSE_JEV_MODEL` override (counsel #8) |
| Jev timeout 3 s, retry once, then exit 5 | AC-1 | locked decision | counsel #8 |
| `CONF_GATE 0.70 · DONE_GATE 0.80 · BOT_GATE 0.70 · BANNER_GATE 0.80 · IRREV_GATE 0.50 · ERROR_GATE 0.80 · MAX_STEPS 30 · MAX_ELEMENTS 80 · TEXT_CAP 2000 · HISTORY 5` | AC-2 | locked decision | memo D3 "Values this decision settles" (field lore, not measured — OB-34) |
| operation set `CLICK TYPE SELECT SCROLL_UP SCROLL_DOWN ENTER WAIT DONE BLOCKED`; nouls `done irreversible bot_check cookie_banner error` | AC-2 | locked decision | memo D3 |
| settle wait ≤ 1.5 s | AC-2 | locked decision | counsel #6 |
| state = JSON object `{goal, page:{url,title,text}, elements[], recent_actions[5]}`; row form `[index] role label · value` | AC-1 | locked decision | memos D2/D3 |
| `confidence` ≈ top-1 − top-2 | AC-2 | assumption | brief Evidence (owner inference); gates read the field as returned |
| reference syntax `{{secret:<user>.<field>}}`, `{{goal:<n>}}` | AC-4 | locked decision | memo D4 |
| secret source | AC-4 | derivation | `docs/AUTH.md` Test users table (`templates/auth.md:27–30` columns) → `$NAME` → `process.env[NAME]` |
| exit codes 0/1/2/3/4/5/6 | AC-2, AC-3 | locked decision | memo D5 + counsel #4/#8 |
| result JSON keys, trace line schema | AC-1 | locked decision | memos D5/D6 (`url_before/url_after/role/label/valueRef` kept for a later export) |
| trace dir `<git dir>/agentic-workflow/browse/traces/` (0700/0600), XDG state fallback | AC-4 | derivation | `hooks/lib/handoff-lib.sh:101` idiom; counsel #3 "not in shared scratch" |
| Chrome profile `${XDG_DATA_HOME:-~/.local/share}/agentic-workflow/browse/profile` | AC-5 | locked decision | memo D2 values; `tools/ccp-ui.mjs:16` idiom |
| CDP default `http://127.0.0.1:9222`; neo probe `127.0.0.1:9200` + `/mcp` | AC-5 | locked decision | memo D2 values; brief L1 |
| Chrome discovery order `BROWSE_CHROME` → PATH → app paths | AC-5 | assumption | planner; `doctor` prints the resolved path |
| launch flags `--headless=new --use-mock-keychain --password-store=basic --disable-extensions` | AC-5 | assumption | plan-judge 2026-10-23 (no keychain prompt, no extension state in a headless smoke) |
| `BROWSE_PROFILE_DIR` (profile dir override; test uses a `mkdtempSync` dir) | AC-5, AC-7 | assumption | planner/plan-judge; default under XDG data |
| `BROWSE_TRACE_DIR` (trace dir override; never inside the worktree) | AC-4, AC-7 | assumption | planner; default under the git dir / XDG state |
| `BROWSE_FAKE_NODE` (simulated Node major for the floor test; loopback `BROWSE_JEV_URL` only) | AC-7 | assumption | planner; test-only |
| `BROWSE_LIVE_SMOKE` (`1` enables the Chrome smoke; CI never sets it) | AC-7 | assumption | planner; OQ-1 decides whether the builder sets it locally |
| secret vault = closure built once at `run` start; `step` never resolves | AC-4 | locked decision | plan-judge 2026-10-23 |
| Node floor 22 (`process.versions.node`) | AC-5 | locked decision | counsel #4, memo F5 |
| fixture list, cases shape, metrics names | AC-7 | locked decision | memo D7 |
| recorded answers = synthetic in the F1 shape | AC-7 | assumption | no `TYPESAFE_API_KEY` on this machine (probed 2026-10-23); test header says so |
| version 1.69.0 | AC-8 | locked decision | mission brief (orchestrator) |
| OB id OB-34 | AC-9 | derivation | `.plans/OBLIGATIONS.md:73` ends at OB-33 |

## Locked decisions

- 2026-10-23 (owner) — **L1** one session, no phases; scope as listed in the
  brief. **L2** deferred, never revisited in this mission: MCP-client
  backends (Playwright MCP, Chrome DevTools MCP, a neo MCP adapter), the live
  accuracy/latency report (`eval` subcommand), replayable scripts (D6), the
  NOT-in-v1 list. **L3** the post-release live check is an obligation.
  Gate: one Fable reviewer checkpoint, PR to main, human merges.
- 2026-10-23 (orchestrator) — specs: memos D1, D3, D4, D5, D7 and the CDP half
  of D2; counsel #3, #4, #5, #6, #8 binding. Version 1.68.0 → 1.69.0. Format
  of the trio: `.plans/precompact-handoff.*`.
- 2026-10-23 (orchestrator, resolves OQ-2) — **`feat/jev-browser` branches
  from `plan/jev-browser`** (not main), so the brief and memos are on the
  build branch.
- 2026-10-23 (plan-judge) — `step` never resolves secrets (exit 3
  `needs_secret`, hand-back line); secrets resolved once at `run` start into
  a closure that also builds `redact()` (raw + URL-encoded + HTML-escaped);
  the AC-4 test is two-sided (driver-recorded `act()` input = the secret,
  trace = the reference); live smoke uses `BROWSE_PROFILE_DIR` = tmp dir and
  the three extra launch flags; `--trace` inside the worktree refused;
  `BROWSE_FAKE_NODE` gated on a loopback `BROWSE_JEV_URL`.
- 2026-10-23 (planner, decomposition of counsel #5) — **no allowlist row for
  `marketing`/`business`; browser goals route through `researcher`.**
  Evidence: the only runtime that honours a `Bash(<pattern>)` rule is the
  `claude -p` path (`tools/run-claude.mjs:249`), and its scoper accepts an
  interpreter only with ONE literal *relative* script path
  (`tools/shell-wrappers.mjs:79–80`, `SCRIPT_PATH` refuses globs and
  leading `/`) — the installed plugin's tool lives at an absolute cache path,
  so `Bash(node tools/browse.mjs:*)` would match only inside this repo and
  `Bash(node */tools/browse.mjs:*)` is refused as bare. The in-process Agent
  tool takes base names in `tools:`; Codex execpolicy and OpenCode have no
  per-agent tool grant. So the "else" branch of counsel #5 applies.
- 2026-10-23 (planner, decomposition of D7 + L2) — CI tests drive the loop
  through a test-only `--backend fixture:<case.json>` driver and a stub Jev
  server; Chrome is never required in CI; the `eval` subcommand and
  `docs/product/engineering/browse-eval.md` are NOT built (L2 "live
  report"); the live numbers come from OB-34.
- 2026-10-23 (planner, cut to fit one session) — `snapshot` and `doctor`
  ship; `eval` does not. `doctor` probes neo and prints `tools/list` but the
  loop never speaks MCP. No `--text-model` flag (D4 B). No `--resume <trace>`
  (D5): after exit 4 the caller performs the one action or re-runs with
  `--allow-irreversible` from the current page — resume replayed nothing
  anyway. Marketing/business prompts get one routing line, not a grant.
- Assumed 2026-10-23 (planner) — the element-table builder is a page script
  injected via `Runtime.evaluate` that tags interactive nodes with
  `data-browse-idx` and returns the table; acts resolve the tag back to a
  node and use `Input.dispatchMouseEvent` (CLICK, at the element's centre
  after `scrollIntoView`), `Input.insertText` after focus (TYPE), a value
  set + `input`/`change` events (SELECT), `Input.dispatchKeyEvent` Enter
  (ENTER), `window.scrollBy` by one viewport (SCROLL_*). The spike ran none
  of these CDP calls; the builder may change internals as long as the
  Backend interface (memo D2) and the live smoke hold. Never cite as proven.
- Assumed 2026-10-23 (planner) — Jev's token-limit error is a 4xx whose
  message matches `/token/i`; anything else non-2xx is "down" (retry once,
  exit 5). OB-34 confirms.
- Ceremony: this repo's profile is `proposed` → every gate `required`:
  plan-judge, phase-reviewer (Fable, `security-boundary`), staging-verify,
  chronicler, mission-close.

## Risks

- **The snapshot/act layer is where accuracy lives** (memo D8 "highest") and
  the spike never ran CDP. → the Backend interface is fixed; the live smoke
  in the test (when a Chrome resolves) proves `snapshot` + CLICK + TYPE on
  `login.html`; everything else is proven on recorded answers; OB-34 is the
  real measure. If the builder cannot get the CDP layer green inside the
  session, it stops at a green harness with the CDP backend returning exit
  5 and reports — never a red harness, never a silent overrun.
- **Secret leak** — a resolved value reaching Jev, the trace, stdout or
  stderr. → one `redact()` at every boundary, password inputs never
  serialized, taint-and-blank, the stub-server byte assertion, the Fable
  checkpoint's red-team item.
- **Chrome ≥ 136 profile rule** (F4) — launching against the default profile
  silently refuses CDP. → always a plugin-owned `--user-data-dir`; `doctor`
  prints it.
- **Builder machine** — no key, no Chrome for Testing, Google Chrome present;
  the owner's rule "change nothing on the local Mac without being told". →
  OQ-1; the test never downloads anything; the profile dir lives under XDG
  data and is named in the report.
- **Budgets** — `templates/WORKFLOW.md` 115,329 / 120,000 B (≤ 1,200 B net);
  `agents/*.md` 16,000 B each (reviewer.md is the largest — report its
  size); skill 6,000 B.
- **One-session size** — the brief is large; the split line is in S1's read
  budget: CLI + tests first, docs second; prompts/WORKFLOW rows are ≤ 20
  lines and never the reason to overrun.

## Open questions

- **OQ-1 — may the builder launch the installed Google Chrome headless?**
  Needed to capture `elements/*.json` with `snapshot` and to run the live
  CDP smoke. It would run `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --headless=new --user-data-dir=<XDG data>/agentic-workflow/browse/profile --remote-debugging-port=<free>` —
  nothing installed, nothing downloaded, never the default profile.
  **Recommendation:** yes. If no: element tables are hand-derived from the
  fixture HTML (labelled so), the smoke prints `skip`, and the CDP backend is
  first exercised live at OB-34.
- OQ-2 (decision docs on the build branch) — **resolved 2026-10-23 at
  plan-judge**: `feat/jev-browser` branches from `plan/jev-browser`; see
  Locked decisions.

---
_The `.plans/jev-browser.sessions.md` briefs execute these tasks;
`.plans/jev-browser.state.md` tracks progress. Resolve every open question
before execution starts._
