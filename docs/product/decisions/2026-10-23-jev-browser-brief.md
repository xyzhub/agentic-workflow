# Fast, accurate browser use (Jev) — feature brief

_Drafted 2026-10-23 by the orchestrator via `/agentic-workflow:plan`. Source: a brief
relayed from the owner's "TypeSafe Jev API test" session (evidence measured
2026-10-22). Owner delegated every shape decision to the orchestrator; owner
approves once._

## Problem

- `frontend` and `reviewer` verify UI with throwaway `npx playwright` scripts the
  model writes step by step, at model latency (`agents/frontend.md:122`,
  `agents/reviewer.md:56`, WORKFLOW "Bash-driven browser verification").
- `designer`, `marketing`, `researcher`, `business` only have WebSearch/WebFetch:
  they can't click a pricing toggle or walk an onboarding flow.
- LLM-driven browser loops take seconds per step.

Jev (TypeSafe) is a "System One" decision model: given a text state and typed
questions it returns probabilities (no text) in ~200 ms. As the per-step policy
of a browser loop it picks the next operation and target from a numbered element
table; a model is only needed to write text, recover and verify.

## Evidence (owner's session, model jev-1.14.0, 2026-10-22)

- Endpoint `POST https://api.typesafe.ai/v1/systemone`, `Authorization: Bearer
  $TYPESAFE_API_KEY`, body `{model:"jev-latest", state, questions}`. Question types:
  `noul` (yes-probability), `choice` (choice, confidence, per-option
  probabilities), `score`.
- One request with an `operation` choice (CLICK/TYPE/ENTER/WAIT/DONE/BLOCKED),
  per-operation target choices and done/error/irreversible nouls, on a login page:
  username filled → TYPE 0.99 into password 1.00 with the secret value 1.00;
  password filled → CLICK 1.00 "Sign in" 1.00. 5 runs: median 201 ms, max 237 ms,
  identical answers, ~1.1k input tokens.
- `confidence` ≈ top-1 minus top-2 probability (inferred, not documented).
- Heads for the operation NOT chosen still return confident answers — read only
  the head matching the chosen operation.
- Not measured: 100+ element pages, multi-page tasks, recovery.

## Prior art

- browser-use/jev-ultrafast (Python, MIT): one Jev request per step; operation
  choice over CLICK, TYPE_TEXT, SELECT, SCROLL_UP, SCROLL_DOWN, WAIT, DONE,
  BLOCKED plus target choices listing only compatible elements; a small text
  model only for typed text; Chrome via CDP. Claims a 7.1 s Google Flights search
  (unverified).
- Field reports (2026-10): ~0.7 confidence gate; cookie-banner, stop-condition
  (>0.8) and bot-check (>0.7) nouls in the same request. Failure modes: cookie
  banners; iframes and file uploads invisible; false DONE; only last ~5 actions
  remembered (keep goals short, one per page/form); bot checks on big sites.
- Browser surfaces: CDP (any Chromium with remote debugging); local MCP servers
  (BrowserOS neo at `http://127.0.0.1:9200/mcp`, Playwright MCP, Chrome DevTools
  MCP); surfaces only Claude itself can call (Claude in Chrome, computer use).
  Recent Chrome refuses remote debugging on the default profile (~v136).

## Repo constraints

- Ships to Claude Code, Codex and OpenCode; spawned agents reach external tools
  via Bash. `tools/run-claude.mjs` runs children with `--strict-mcp-config`.
- `tools/` are standalone `.mjs` files; the plugin has no runtime dependencies
  (the one precedent: `ccp-tui`, an optional lockfile-pinned install into a
  ccp-owned dir, never bundled — v1.66.x).
- Credentials come from the §10 Test users file (`docs/AUTH.md`); secret values
  must never pass through a model's context.
- Must degrade gracefully without `TYPESAFE_API_KEY`.

## Owner's words (verbatim, in order — relayed)

1. "does that mean we can make a skill that makes browser use ultrafast ?"
2. "i want this to work with browserOS neo"
3. "or better yet, i want it to work with any browser that claude can control"
4. "lets say I want my agentic-workflow to be able to use the browser very fast
   and perform browser actions very accurately"
5. "just send a plan to the agentic-workflow agent and don't force any choices,
   it will know what's best"

Interview: skipped per (5); the orchestrator records its picks as proposals and
the owner approves them once (§3).

## Acceptance criteria (draft, from the source brief)

- AC1 Fast: with `TYPESAFE_API_KEY` set, an agent hands a short goal to one
  command and the loop runs with no model call per step; each decision is one
  Jev request.
- AC2 Accurate: never acts below a confidence gate, never reads an off-operation
  target, and returns control to the calling agent (with page state) when unsure,
  blocked, at a bot check, or before an irreversible action.
- AC3 DONE is never trusted alone: an independent check of the final page
  against the stop condition.
- AC4 Secrets passed by reference and resolved by the tool; no secret in any
  prompt, Jev request log or trace. (Note: Jev itself must not receive secret
  values either — the `type_value` head chooses a secret REFERENCE.)
- AC5 More than one browser surface, BrowserOS neo named; a defined fallback for
  surfaces the tool can't drive.
- AC6 frontend/reviewer live verification and the research roles can use it;
  without a key, behavior is exactly today's.
- AC7 Measured: an eval set of local fixture pages reporting per-step accuracy and
  latency, including a page with 100+ interactive elements.

## NOT in v1 (proposed)

Live-streaming parallel-flows UI; Firefox/Safari; iframes, file uploads, canvas
apps; voice input.

## Open shape decisions (for the architect)

Packaging, browser backend(s) and dependencies, question set and thresholds,
typed-text generation, DONE verification, irreversible-action gating,
escalation/hand-off shape, replayable scripts from verified runs, eval design,
phasing.

## Locked decisions (owner, 2026-10-23)

Owner exchange before the lock: asked "how fast will this make agent browser
compared to normal browser, and also how much token saving" (orchestrator
estimate, unmeasured: ~5–10× faster per task, ~90–95% fewer Claude tokens), then
"does it need 3 sessions? or can we make it leaner ?", then **"yes do the one
session for now"**.

- **L1 — One session, no phases.** Scope:
  - `tools/browse.mjs`, zero-dep Node CLI (memo D1), with `run`, `step`, `doctor`.
  - Raw-CDP backend only: Chrome for Testing / any Chromium with a plugin-owned
    `--user-data-dir`, or attach to an existing debug port (memo D2 A).
  - `step` hand-back mode for every surface the tool can't drive (Claude in Chrome,
    computer use, MCP browsers): it returns the next action for the calling agent.
  - `doctor`: Node ≥ 22 check, key present, Chrome found, and a BrowserOS neo probe
    (is a CDP port reachable? if yes, `run --cdp <url>` attaches to it).
  - Jev question set and gates per memo D3; secrets per D4 + counsel #3 (redact
    BEFORE the Jev request, blank tainted/password values, eval assertion); hand-off
    and exit codes per D5 + counsel #8 (Jev error → retry once, exit 5); settle wait
    and SCROLL-when-hidden per counsel #6.
  - Tests on local fixture pages with recorded Jev answers, no key needed in CI
    (memo D7 minus the live report); includes the 120-element page and the
    secret-never-leaves assertion.
  - Skill doc + `frontend`/`reviewer`/`researcher` prompts point at it when the
    key is set; `marketing`/`business` get a scoped `Bash(node */tools/browse.mjs *)`
    only where the runtime honours it, else route via `researcher` (counsel #5).
  - Without `TYPESAFE_API_KEY`, behaviour is exactly today's.
- **L2 — Deferred (NOT in this mission):** MCP-client backends (Playwright MCP,
  Chrome DevTools MCP, a neo MCP adapter), the live accuracy/latency report,
  replayable scripts (D6), plus the brief's NOT-in-v1 list.
- **L3 — Obligation:** after release, the owner runs `browse.mjs doctor` against neo
  and one live run with the key; record per-step latency, hand-off rate, exit-2
  rate. (Planner files it as the next OB.)
- Priority: next mission. Gate: one Fable reviewer checkpoint (tools + secrets =
  boundary class), PR to main, human merges.
