---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: jev-browser — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the
expensive exploration happened once, here (2026-10-23, main at 495bcc2,
plugin v1.68.0)._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/jev-browser.md` · Ledger: `.plans/jev-browser.state.md`
Source brief: `docs/product/decisions/2026-10-23-jev-browser-brief.md` (144 lines — AC1–AC7, L1–L3; read whole).
Specs: `docs/product/decisions/2026-10-23-jev-browser-memos.md` (496 lines — ranged reads below; D6, D8 and the MCP half of D2 are NOT read).

**Catalog**: none — this repo's §10 **Catalog** row is `none — markdown-only
plugin` (`docs/product/catalog/` does not exist). No catalog reads, no catalog
regeneration in Verify.

**Gates available in this repo** (§10):

| Gate | Command | When |
|---|---|---|
| Test / lint gate (CI `lint.yml`) | `node tools/lint.mjs` | end of S1 and at the checkpoint — clean on 495bcc2 apart from the standing `warn:` on WORKFLOW bytes; runs every `tools/*-test.mjs` harness it knows (`tools/lint.mjs:1384`) |
| Browse harness (new) | `node tools/browse-test.mjs` | after every `browse.mjs` edit |
| Staging verify (§10 Staging = none) | lint green + `claude --plugin-dir plugins/agentic-workflow` loads | at the checkpoint, before the PR is marked ready |

**Facts already probed (do not re-probe):** `node` v24.12 (floor check is
`process.versions.node` major ≥ 22). `TYPESAFE_API_KEY` is NOT set on this
machine — recorded answers are synthetic (counsel #7 header). Chrome binaries:
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` exists; no
Chrome for Testing, no BrowserOS, nothing on PATH — launching it is OQ-1
(answer in the ledger). `tools/` is zero-dep (`headless.mjs` header:
"Zero deps, Node >= 18"); the main-guard idiom is
`if (process.argv[1] && path.resolve(process.argv[1]) === SELF)`
(`headless.mjs:35,288`) so a test can import pure functions. Lint has no
externals rule for `.mjs`; the only size rules are `checkObfuscation` (≤ 1,000
chars/line, `lint.mjs:316`) and `BUDGETS` (`lint.mjs:993–999`: agent 16,000 B,
command 24,000 B, skill 6,000 B, WORKFLOW 120,000 B — WORKFLOW is 115,329 B
today). `plugin.json` has no `skills` key — skills auto-discover from
`skills/<name>/SKILL.md` (`plain-report` precedent); lint cross-ref lists only
`skills/protocol/SKILL.md` (`lint.mjs:38`). A scoped `Bash(node
tools/browse.mjs:*)` rule is accepted by `unscopedReason`
(`shell-wrappers.mjs:79–80`) but only as a relative literal — the master
plan's lock explains why no marketing/business grant ships. Next obligation
id: **OB-34** (`.plans/OBLIGATIONS.md:73` ends at OB-33). This repo's
`docs/WORKFLOW.md` stamp is NOT synced in this mission.

Branch: `feat/jev-browser` (from `plan/jev-browser`, which sits on main
495bcc2 — OQ-2 locked 2026-10-23 so the brief and memos are on the build
branch). One brief, one checkpoint, one PR to `main`; the human merges. Not
parallel.

## Large-files table

| File | Lines | Notes |
|---|---|---|
| `tools/hook-test.mjs` | 2,522 | not read |
| `CHANGELOG.md` | 1,731 | read 1–14 only |
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 1,429 | 115,329 B; read 240–248 and 1040–1046 only |
| `docs/WORKFLOW.md` | 1,420 | not read (not synced here) |
| `tools/lint.mjs` | 1,394 | read 515–535 and 1380–1388 only |
| `plugins/agentic-workflow/tools/run-codex.mjs` | 587 | not read |
| `docs/product/decisions/2026-10-23-jev-browser-memos.md` | 496 | ranged reads only (below) |
| `plugins/agentic-workflow/tools/run-claude.mjs` | 458 | not read |
| `plugins/agentic-workflow/README.md` | 363 | read 95–100 only |
| `plugins/agentic-workflow/tools/headless.mjs` | 290 | read 1–45 and 284–290 only |
| `plugins/agentic-workflow/agents/reviewer.md` | 217 | read 54–66 only |
| `plugins/agentic-workflow/agents/marketing.md` | 148 | read 1–16 only |
| `docs/product/decisions/2026-10-23-jev-browser-brief.md` | 144 | whole |
| `plugins/agentic-workflow/agents/frontend.md` | 134 | read 118–134 only |
| `plugins/agentic-workflow/tools/ccp-ui.mjs` | 127 | read 10–20 only (XDG dir idiom) |
| `plugins/agentic-workflow/tools/shell-wrappers.mjs` | 101 | read 1–25 only |
| `plugins/agentic-workflow/hooks/lib/handoff-lib.sh` | ~230 | read 95–110 only (git-path dir idiom) |
| `tools/headless-test.mjs` | 83 | whole — the harness shape to copy |
| `.plans/OBLIGATIONS.md` | 73 | read 1–12 and 73 |
| `plugins/agentic-workflow/agents/business.md` | 67 | read 1–16 only |
| `plugins/agentic-workflow/templates/auth.md` | 65 | read 1–40 |
| `plugins/agentic-workflow/commands/verify.md` | ~110 | read 52–60 only |
| `plugins/agentic-workflow/agents/researcher.md` | 54 | whole |

## Phase 1 — fast, accurate browser use (branch: `feat/jev-browser`)

### S1 — `browse.mjs` loop + CDP backend + skill + prompts + fixtures/tests + release

- **ACs**: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9
- **Suits**: `backend` (a zero-dep Node CLI with a protocol client and a
  test harness; the prompt/doc edits are ≤ 40 lines together). Runtime:
  `claude` (default; the §10 Tune preset is `balanced`, no role on codex).
- **Reads** (in this order):
  1. `docs/product/decisions/2026-10-23-jev-browser-brief.md` whole (144)
     and `.plans/jev-browser.md` Tasks + Value sourcing + Locked decisions
     (≈170).
  2. Memos `docs/product/decisions/2026-10-23-jev-browser-memos.md`: 20–35
     (facts F1–F9), 46–62 + 100–103 (D1 option A + values), 118–145 +
     177–182 + 193–197 (D2 interface, CDP option, `step` fallback, values),
     206–262 (D3 whole), 265–304 (D4 whole), 308–352 (D5 whole), 378–414
     (D7 whole), 461–497 (counsel 1–9) ≈ 330. Skip D6, D8, D2 B/C.
  3. `plugins/agentic-workflow/tools/headless.mjs` 1–45 (header comment
     style, imports, `SELF`) and 284–290 (main guard);
     `tools/ccp-ui.mjs` 10–20 (`tuiDir` XDG idiom → copy for the profile
     dir); `hooks/lib/handoff-lib.sh` 95–110 (`git rev-parse --git-path
     agentic-workflow/…` + XDG fallback → the trace dir).
  4. `tools/headless-test.mjs` whole (83): `check`, `pathToFileURL` import
     of the tool, fake-binary pattern, `mkdtempSync` + `rmSync`, the final
     exit — copy this shape. `tools/lint.mjs` 515–535
     (`checkHeadlessHarness` — copy as `checkBrowseHarness`) and 1380–1388
     (the check array — add it after `checkHeadlessHarness`).
  5. `plugins/agentic-workflow/tools/shell-wrappers.mjs` 1–25 (why no
     allowlist row ships — do not add one).
  6. `plugins/agentic-workflow/templates/auth.md` 1–40 (Test users table
     columns at 27–30: `Role | Email / login | Password | …`; `$NAME` cells).
  7. `agents/frontend.md` 118–134, `agents/reviewer.md` 54–66,
     `agents/researcher.md` whole (54), `agents/marketing.md` 1–16,
     `agents/business.md` 1–16.
  8. `templates/WORKFLOW.md` 240–248 (§3 principle 3 "Bash-driven browser
     verification" + principle 5) and 1040–1046 (§10 rows: Tune preset,
     Test users — the new row goes directly after 1044);
     `commands/verify.md` 52–60; `README.md` 95–100.
  9. `CHANGELOG.md` 1–14; `plugins/agentic-workflow/.claude-plugin/plugin.json`
     (11); `plugins/agentic-workflow/package.json` (12);
     `.plans/OBLIGATIONS.md` 1–12 and 73 (row format);
     `plugins/agentic-workflow/skills/plain-report/SKILL.md` 1–8 (skill
     front matter shape).
- **Prior art**: `tools/headless.mjs` / `tools/ccp-ui.mjs` — CLI header
  contract, `parseArgs`, XDG dirs, zero-dep rule; `tools/headless-test.mjs`
  — harness shape; `hooks/lib/handoff-lib.sh` — private state under the git
  dir (0700/0600, never tracked) and its redaction-at-every-output rule.
  Permission gates: `tools/shell-wrappers.mjs` is the one scoper for
  `Bash(<pattern>)` rules (also `templates/codex.rules`, `hooks/hooks.json`)
  — this brief adds NO rule to any of them (planner lock, master plan).
- **Do**:
  1. **`plugins/agentic-workflow/tools/browse.mjs` (new, ~600 lines, zero
     deps, header in the `headless.mjs` style listing every subcommand, env
     var and exit code; attribute the snapshot ideas to browser-use/jev-ultrafast,
     MIT)**. First lines after imports: the Node floor —
     `major(process.versions.node) < 22` (or `BROWSE_FAKE_NODE` in tests) →
     stderr "browse: Node ≥ 22 required (global WebSocket); found <v>" exit 5.
     Export the pure functions the test imports: `parseGoal(goal) →
     {goal, menu:[{name, kind:'secret'|'goal', ref}]}`, `resolveSecret(ref,
     authMd, env)`, `makeVault(menu, authMd, env) → {typeInto(ref), redact(any),
     missing:[refs]}` (resolves every menu secret ONCE at `run` start into a
     closure; `redact` is built from it and matches raw, `encodeURIComponent`
     and HTML-escaped forms; nothing outside the closure ever holds a
     value), `tableFromElements(all,
     viewport, {max:80}) → {rows, hiddenBelow, hiddenAbove}`,
     `buildQuestions(state, menu)`, `decide(answers, questions, GATES) →
     {op, index, valueRef, handoff?, gates}`, `exitFor(status)`, the `GATES`
     constants (D3 values) and `EXIT` table. Subcommands:
     - `run --goal <g> [--url <u>] [--cdp <url>] [--until-url <re>]
       [--until-text <s>] [--allow-irreversible] [--json] [--trace <file>]
       [--max-steps N]`: key check first (missing → the exact exit-6 line);
       backend = `--cdp`/`BROWSE_CDP_URL` attach (`GET <url>/json/version`,
       then `/json/list` or `Target.createTarget`) else launch (Chrome
       discovery order in the plan; profile dir = `BROWSE_PROFILE_DIR` or
       `<XDG data>/agentic-workflow/browse/profile`; flags `--headless=new
       --user-data-dir=<profile> --remote-debugging-port=<free port from
       net.listen(0)> --no-first-run --no-default-browser-check
       --use-mock-keychain --password-store=basic --disable-extensions
       about:blank`; poll `/json/version` ≤ 10 s;
       kill on exit); global `WebSocket` to the page target; enable `Page`,
       `Runtime`, `DOM`; `Page.navigate` when `--url`. Loop per D3/D5: settle
       (≤ 1.5 s: poll a DOM digest every 150 ms until two equal, or the load
       event), snapshot (inject the table script via `Runtime.evaluate`,
       `returnByValue`), cap/page the table, build state (`page.text` ≤ 2000
       chars + "+N more below/above"), `redact()`, ONE Jev request, read
       only the chosen op's head, apply gates, act, append the trace line,
       repeat. Cookie-banner rule, irreversible → exit 4 with `proposed`,
       DONE → verification (deterministic when `--until-*`, else the second
       Jev noul with the D5 wording) → exit 0/2. Result JSON on stdout
       (`--json`; the human form is a ≤ 8-line summary), exit per `EXIT`.
     - `step --goal <g> --state <file.json> [--history <file>]`: redact the
       input, build questions, one Jev request, print `{op, index, label,
       valueRef, gates}`; exit 0 decided / 3 hand-off / 4 irreversible; no
       backend, no acts. **`step` never resolves secrets**: never builds a
       vault, never reads AUTH.md; a decision whose `valueRef` is
       `{{secret:*}}` → exit 3 `reason: needs_secret` and the stderr line
       "secrets cannot be typed on a hand-back surface — use run or --cdp".
     - `snapshot [--url <u>|--cdp <url>] [--json]`: print the numbered table
       (`[index] role label · value`), exit 0/5.
     - `doctor [--json]`: rows Node, key (set/unset, never the value), Chrome
       (resolved path or "none"), CDP `BROWSE_CDP_URL`/9222 (`/json/version`
       → Browser string or unreachable), BrowserOS neo (`/json/version` on
       9200; `POST http://127.0.0.1:9200/mcp` JSON-RPC `initialize` then
       `tools/list`, honouring `Mcp-Session-Id` and a `text/event-stream`
       body — print the tool names verbatim or the failure), trace dir,
       profile dir. Always exit 0. Each probe ≤ 2 s.
     - Jev client: `fetch(BROWSE_JEV_URL || 'https://api.typesafe.ai/v1/systemone')`,
       `Authorization: Bearer <key>`, `{model: BROWSE_JEV_MODEL || 'jev-latest',
       state, questions}`, `AbortSignal.timeout(3000)`; timeout/network/5xx →
       retry once → exit 5 `backend unavailable (jev)` with page state; 4xx
       matching `/token/i` → halve `MAX_ELEMENTS` for this step, retry once.
       `usage.input_tokens` and ms land in the trace line.
     - Secrets (D4 + counsel #3 + plan-judge): `parseGoal` → menu; at `run`
       start `makeVault` resolves every secret from `docs/AUTH.md` (cwd) Test
       users rows into a closure (`missing` → hand off `needs_secret` before
       the first step); `act()` calls `vault.typeInto(ref)` and passes the
       value straight to the backend; resolved values are never placed on
       `state`, a trace row, the result or any object that reaches
       `JSON.stringify`; `vault.redact()` wraps every `JSON.stringify` and
       every `process.stderr.write` (raw + URL-encoded + HTML-escaped);
       `type=password` rows never carry `value`; a row that received a
       secret is tainted (`value: ''`) for the run.
     - Trace: `$(git rev-parse --git-path agentic-workflow/browse)/traces/<utc>.jsonl`
       (mkdir 0700, file 0600) or the XDG state fallback; `BROWSE_TRACE_DIR`
       then `--trace` override; a `--trace` path whose `path.resolve` lies
       inside `git rev-parse --show-toplevel` is refused (exit 1, "trace
       must not live in the worktree"); path printed in the result. Element-table script: interactive =
       `a[href], button, input:not([type=hidden]), select, textarea,
       [role=button|link|checkbox|radio|tab|menuitem|option|combobox|textbox|switch],
       [contenteditable], [tabindex]:not([tabindex="-1"])`; skip invisible
       (zero rect, `display:none`, `visibility:hidden`, `aria-hidden`);
       label = aria-label → `<label>` text → placeholder → innerText (≤ 60) →
       title/alt/name; `ops` by role; `options` for `<select>` (≤ 20); each
       node tagged `data-browse-idx`; rect + `inViewport` returned for the cap
       (form controls in viewport → viewport → DOM order). Acts resolve the
       tag: CLICK = `scrollIntoView` + `Input.dispatchMouseEvent`
       pressed/released at the centre; TYPE = focus + select-all +
       `Input.insertText`; SELECT = set value + dispatch `input`/`change`;
       ENTER = `Input.dispatchKeyEvent`; SCROLL = `window.scrollBy(0, ±innerHeight)`;
       WAIT = settle only. `pageChanged` = URL or digest changed.
     - Test-only driver `--backend fixture:<case.json>` (documented in the
       header as test-only): elements come from `elements/<page>.json`, acts
       advance per the case's `transitions`; every `act(op, index, value)`
       is appended as a JSON line to `BROWSE_ACT_LOG` (tmp file the test
       owns — the only place a resolved value is written, by design, so the
       test can prove the secret reached the page); refuses to run unless
       `BROWSE_JEV_URL` points at `127.0.0.1`. `BROWSE_FAKE_NODE` is honoured
       under the same loopback condition only.
  2. **`plugins/agentic-workflow/tools/fixtures/browse/`**: the six HTML
     pages (`big.html` may be generated once and committed; ≥ 120 controls,
     the target control after the 100th), `cases.json`, `elements/*.json`
     (captured via `snapshot` when OQ-1 = yes, else hand-derived and the
     file's first key says `"source": "hand-derived"`), `answers/*.json`
     (one F1-shaped answer per step; synthetic — say so in `cases.json`
     `"answers": "synthetic (no key on the build machine, 2026-10-23)"`).
  3. **`tools/browse-test.mjs` (new, ~250 lines)**: the cases in the master
     plan Task 3 — pure functions via `pathToFileURL` import; loop cases by
     spawning `node browse.mjs run --backend fixture:… --json` with
     `TYPESAFE_API_KEY=test-key`, `BROWSE_JEV_URL=http://127.0.0.1:<port>`
     (a stub `http.createServer` that serves `answers/<case>.json` per
     request index, records every request body, and asserts no body contains
     the resolved secret `hunter2-fixture` in raw, URL-encoded or
     HTML-escaped form), `BROWSE_TRACE_DIR=<tmp>`, `BROWSE_ACT_LOG=<tmp>`;
     the login case sets the fixture AUTH.md Password cell to
     `$BROWSE_TEST_PW` and the env to `hunter2-fixture`; two-sided assert:
     the act log's TYPE row for the password field carries exactly
     `hunter2-fixture`, AND stdout/trace/stderr carry only
     `{{secret:alice.password}}`. `step --state elements/login.json --goal
     'sign in as {{secret:alice.password}}'` with the stub answering TYPE →
     exit 3, `reason: needs_secret`, the hand-back line, and no AUTH.md read
     (the fixture cwd has none). `--trace <worktree path>` → exit 1.
     Exit-code cases: 0, 2 (`--until-text` mismatch), 3 (`error.html`,
     `stuck`), 4 (`irreversible.html`), 5 (stub returns 503 twice;
     `BROWSE_FAKE_NODE=20` with loopback URL; the same with a non-loopback
     `BROWSE_JEV_URL` is ignored), 6 (no key, exact line).
     Big page: first decision offers `SCROLL_DOWN`, table ≤ 80 rows,
     `hiddenBelow ≥ 40`, the target is clicked after a scroll. Live smoke:
     only if `BROWSE_LIVE_SMOKE=1` AND a Chrome binary resolves (OQ-1
     answered yes → the builder sets it locally; CI never has Chrome):
     `BROWSE_PROFILE_DIR=$(mkdtempSync)`, `snapshot --url
     http://127.0.0.1:<port>/login.html` prints ≥ 3 rows, then `rmSync` the
     profile dir in `finally`; else print `skip` with the reason.
     Header: "recorded answers prove gate plumbing, not accuracy; the live
     numbers come from OB-34."
  4. **`tools/lint.mjs`**: `checkBrowseHarness` (copy of 519–533, name
     `browse harness`, runner `tools/browse-test.mjs`) + add it to the array
     at 1384 after `checkHeadlessHarness`.
  5. **`plugins/agentic-workflow/skills/browse/SKILL.md` (new, ≤ 6,000 B)**:
     front matter `name: browse`, `description:` (≤ 400 chars, says "fast
     browser use via Jev; only when TYPESAFE_API_KEY is set"); body: when,
     the four command lines, goal-writing rules (short, one page/form, quote
     literals, `{{secret:<user>.<field>}}` from `docs/AUTH.md`), exit-code
     table with the caller's move per code (2 → verify yourself with a
     snapshot/`--until-*`; 3 → read `reason`, supply a literal or act; 4 →
     do that one action yourself or re-run `--allow-irreversible`; 5/6 →
     Bash-driven Playwright as today; 3 `needs_secret` from `step` → the
     goal needs a secret, which a hand-back surface cannot type: use `run`
     or `--cdp`), surfaces (launch / `--cdp <url>` incl. BrowserOS neo when
     its debug port answers / `step` for Claude in Chrome, computer use and
     MCP browsers — `step` never types secrets), secrets rule (never paste a
     value; `run` resolves references once at start), trace location
     (never in the repo), `doctor`.
  6. **Prompts**: `agents/frontend.md` after line 127 and
     `agents/reviewer.md` after line 62: two lines — "If `TYPESAFE_API_KEY`
     is set, prefer `node ${CLAUDE_PLUGIN_ROOT}/tools/browse.mjs run …`
     (skill `browse`: one short goal per page/form, secrets by reference);
     exit 2 → verify yourself; exit 5/6 → the Playwright path above."
     `agents/researcher.md` after the "What to investigate" list: a 4-line
     "Browsing" paragraph (same rule; pricing toggles, onboarding walks; no
     secrets in goals). `agents/marketing.md` and `agents/business.md`
     after line 16: one line — "A browser walk (pricing toggle, signup
     flow) is the `researcher`'s job: ask the orchestrator to run it with
     the `browse` skill; you have no shell." Keep every file under 16,000 B.
  7. **Protocol/docs**: `templates/WORKFLOW.md` — new §10 row after 1044:
     `| **Browser verification** | _(how agents drive a real browser:
     \`node ${CLAUDE_PLUGIN_ROOT}/tools/browse.mjs\` (skill \`browse\`) when
     \`TYPESAFE_API_KEY\` is set — launched Chrome, \`--cdp <url>\` to a
     running Chromium incl. BrowserOS neo, or \`step\` hand-back for
     Claude-only surfaces; else Bash-driven Playwright. Secrets by
     reference from the Test users row)_ |`; §3 principle 5 (245–246) gains
     the clause "— via the `browse` skill when a Jev key is set, else
     Bash-driven Playwright"; `commands/verify.md:55` gains "(or the
     `browse` skill when `TYPESAFE_API_KEY` is set)"; `README.md:99`
     frontend row: "verifies in a real browser (Jev-fast when keyed)".
     Net WORKFLOW growth ≤ 1,200 B; keep `${CLAUDE_PLUGIN_ROOT}` braced.
  8. **Release** (AC-8): `plugin.json` + `package.json` `1.69.0`; CHANGELOG
     `## [1.69.0] — 2026-10-23` under `[Unreleased]` — Added: `tools/browse.mjs`
     (run/step/snapshot/doctor, Jev per-step policy, gates, secrets by
     reference, exit codes, private trace), skill `browse`, fixtures +
     `tools/browse-test.mjs` + lint wiring; Changed: frontend/reviewer/
     researcher/marketing/business prompts, WORKFLOW §10 row, verify.md,
     README. Deferred (L2) named in one line.
  9. **AC-9 → OB-34**: report this row text for the orchestrator to append
     (the builder never edits `.plans/`):
     `- [ ] OB-34 · added 2026-10-23 (promoted from `.plans/jev-browser.state.md` `## Closing` row "live-verify browse", planner, 2026-10-23) — do: on a machine with BrowserOS neo and `TYPESAFE_API_KEY`, after `/plugin update` + `/reload-plugins`, run `node ${CLAUDE_PLUGIN_ROOT}/tools/browse.mjs doctor` (paste neo's `tools/list` and whether its debug port answers) and one live `run` against a real login flow with `{{secret:…}}`; record per-step Jev ms (p50/max), hand-off rate, exit-2 rate, and whether any resolved secret appears in the trace (must be none); tune the D3 gates only with these numbers — when: v1.69.0 is installed from `main` — probe: manual`.
  Commit with the §10 Attribution line. Do not touch `.plans/` or
  `docs/WORKFLOW.md`. Never download a browser; never use the default Chrome
  profile; never write a trace inside the repo.
- **Verify**:
  - `node tools/browse-test.mjs` exits 0 — report the case count (≥ 30),
    the secret-never-leaves assertion name, and whether the live smoke ran
    or printed `skip` (and why).
  - `node tools/lint.mjs` → `lint: clean` (WORKFLOW `warn:` allowed; report
    `templates/WORKFLOW.md` bytes ≤ 120,000, `agents/reviewer.md` bytes,
    `skills/browse/SKILL.md` bytes ≤ 6,000).
  - `node plugins/agentic-workflow/tools/browse.mjs doctor` in this repo:
    prints Node ok, key unset, Chrome path (or none), CDP unreachable, neo
    unreachable, trace + profile dirs; exit 0.
  - `TYPESAFE_API_KEY= node plugins/agentic-workflow/tools/browse.mjs run --goal x --url http://127.0.0.1:1/` → exit 6 and the one fallback line.
  - `node tools/browse-test.mjs` output names the two-sided secret case (act
    log = value, trace = reference) and the `step needs_secret` case as `ok`.
  - `git status --porcelain | grep -c agentic-workflow/browse` → 0 (no trace
    tracked); `ls -ld "$(git rev-parse --git-path agentic-workflow/browse)"`
    → `drwx------` when a trace was written.
  - `claude --plugin-dir plugins/agentic-workflow` loads and `/agentic-workflow:doctor`
    lists the `browse` skill (or report skipped with the reason — never
    green when not run).
  - Catalog: none, nothing to regenerate.
- **Read budget**: ~1,100 lines (brief 144 · plan 170 · memos 330 ·
  headless/ccp-ui/handoff-lib 70 · headless-test 83 · lint 30 ·
  shell-wrappers 25 · auth 40 · agents 110 · WORKFLOW/verify/README 25 ·
  CHANGELOG/jsons/OBLIGATIONS/skill 45) — inside the 1,500-line budget.
  Order of work if time runs short: CLI + harness green first, then the
  skill, then prompts/WORKFLOW/CHANGELOG. If the CDP backend cannot be made
  green inside the session, stop at a green harness with the CDP path
  returning exit 5 "backend unavailable (cdp: <why>)", report what remains,
  and let the orchestrator book a corrective — never leave the harness red.

**Checkpoint ckpt-s1** — one-shot `reviewer` on **Fable** (boundary-class:
`tools/` + `templates/` are `security-boundary`, `templates/gate-classes.md:32`),
fresh context, re-runs `node tools/lint.mjs` + `node tools/browse-test.mjs`,
diff-reviews `main..HEAD` against AC-1..AC-9 with this red-team list: a
resolved secret reaching Jev / trace / stdout / stderr / `step` input (raw,
URL-encoded or HTML-escaped); any value held outside the vault closure; `step`
resolving a secret; an
off-operation head being read; acting below a gate; DONE trusted without the
second check; the default Chrome profile; a trace path inside the repo or a
shared scratch dir; a new `Bash(...)` rule anywhere; the exit-6 path changing
any behaviour without a key — plus a plain-report read of the owner-facing
strings (skill, doctor rows, exit lines). APPROVE → staging verify (lint +
`--plugin-dir` load) → PR to `main` marked ready; the human merges.

---
_Each session's outcome and any deviation lands in
`.plans/jev-browser.state.md`, never only in chat._
