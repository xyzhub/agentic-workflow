---
status: frozen
owner-agent: architect
refresh-trigger: never
---

# agentic-workflow — Decision memos: launch-media shape

_Companion to `2026-10-06-launch-media-brief.md`. Five memos for the brief's shape
decisions plus five it missed (6–10). Each claim is **fact** (cited), **inference**,
or **assumption**. The architect consults; the human locks._

## Repo facts every memo leans on

- **F1** No `package.json` anywhere; every `tools/*.mjs` is zero-dep Node ≥ 18. The
  browser precedent is a throwaway `npx playwright` script (`agents/frontend.md:98`,
  `agents/reviewer.md:62`, `commands/verify.md:40`). The plugin ships no runtime deps.
- **F2** The §14 hook (`hooks/hooks.json` PreToolUse row "publishing guardrail")
  sees only the Bash **command text**: it regex-matches publish hosts and the literal
  `PAID_CONFIRMED_BY_HUMAN` token. It cannot see which queue item is firing.
- **F3** Codex adapter (`tools/run-codex.mjs:44,208`): sandbox is derived from the
  role's `tools:`; network is on only for `NETWORK_ROLES = backend, frontend, devops,
  security`. No WebSearch/WebFetch/MCP exist inside Codex. A new role needs a
  one-line `NETWORK_ROLES` edit to reach the web there.
- **F4** `tools/hook-test.mjs` runs each hooks.json command in a throwaway cwd with
  fixture ledgers/files/stdin and asserts exit code + nudge; `tools/lint.mjs`
  invokes it (`checkHookBehavior`), so hook cases are tier-1 CI.
- **F5** `templates/publish-queue.md` row columns: `id | channel | scheduled | state
  | paid | source asset | summary`; bodies live in `### P-001 — channel` sections.
- **F6** X API: pay-per-use only, "$0.005 per resource" read, "$0.015 per request"
  post, "$20 in free X API credits when you save your first eligible payment card",
  "capped at 3 million Post reads per monthly billing cycle" (docs.x.com pricing
  page, fetched 2026-10-06). Free tier discontinued (secondary sources: postproxy,
  outstand, xcrop; **not** stated on the official page). That recent search is
  included in pay-per-use is **inference** from secondary sources; verify by use.
- **F7** Playwright `recordVideo` writes WebM (VP8) and needs its own ffmpeg from
  `npx playwright install ffmpeg` (playwright.dev/docs/videos; qaskills guide).
  **Inference**: that bundled ffmpeg is a minimal build without an H.264 encoder, so
  an `.mp4` needs a system ffmpeg. Verify at n=1.
- **F8** ElevenLabs bills per character ($0.04–0.08 per 1,000 chars by model;
  elevenlabs.io/pricing/api via search). Cost is therefore computable **before**
  the call from script length.

---

## Memo 1 — Where prospecting lives

**Question.** Which role owns the release-time shortlist + drafts? Constrains tool
grants, codex sandbox, and the §11 outreach boundary's blast radius.

| Option | How it works here | Tradeoffs | Reversal |
|---|---|---|---|
| **A. New `prospector` agent** | `agents/prospector.md` with `Bash, Read, Write, Edit, Grep, Glob, WebFetch`; spawned by `/release` step 5; writes `launch/shortlist-<release>.md`, queue rows at `draft`, reads `contacted.md` | One more role (10), README/§6/§9 rows; but a prompt whose entire job is "find, quote, score, draft, never send" is small and auditable; codex network grant scoped to it alone (F3) | Cheap: fold the prompt into marketing later |
| **B. Mode of `marketing`** | New section in the 145-line marketing prompt; `marketing` gains `Bash` | Marketing has no Bash today and owns sales kit + launch assets; adding adapters widens its tool surface and its codex network grant to every V5/V6 run | Medium: untangling a mode from a prompt that already has three jobs |
| **C. Mode of `researcher`** | Reuse V0 evidence stance; gains queue-writing | Researcher's stance is disconfirmation at V0 and it never writes outreach; semantic mismatch; it already has Bash | Cheap |

**Recommendation: A.** Smallest blast radius for the one role that drafts messages
to real people; tool and sandbox grants stay least-privilege; the §11 "never
delegable" rule sits in one prompt. **Case against:** role sprawl — every agent costs
a tune file, a lint row, a roles-table row. Acceptable at +1.
**Changes the answer:** if the shortlist step turns out to be <40 lines of prompt.
**Files:** `agents/prospector.md`, `templates/WORKFLOW.md` §6/§9, `README.md`,
`commands/release.md`, `tools/run-codex.mjs` (NETWORK_ROLES), `templates/launch-shortlist.md`,
`templates/launch-contacted.md`.

## Memo 2 — Recorder implementation

**Question.** Who owns the browser-driving code? Constrains where bugs land and
how ventures drift.

| Option | How it works here | Tradeoffs | Reversal |
|---|---|---|---|
| **A. Plugin-shipped runner `tools/demo-record.mjs`** reading the venture's `docs/product/launch/demo-flow.md` | Zero-dep Node; resolves `playwright` from the **venture** cwd (`require.resolve`), spawns `npx playwright install chromium ffmpeg` if missing; tiny step vocabulary (`goto`, `click`, `type`, `wait`, `say`); discover → rehearse → record phases; selftest row in lint like `catalog.mjs` | One maintained copy, versioned with the plugin, lint-tested; but browser-automation bugs become plugin issues | Cheap: copy the runner into a venture (→ B) |
| **B. Skill writes a per-venture script** into the venture repo | Prompt-driven codegen each time | Twenty ventures, twenty drifting copies; not lint-testable here; per-run token cost | Medium |
| **C. Delegate to the venture's e2e suite** (`video: on`) | Tests already exist for most Orderly flows | Tests are not demos: no pacing, cursor, subtitles; 800x800 default scaling; coupling the demo to test flakiness | Cheap |

**Recommendation: A.** Keeps the "patterns only" rule honest (a runner written here,
reviewed here) and makes the rehearsal/sanity checks mechanical and CI-covered.
**Case against:** the plugin starts shipping a product-ish tool; keep it ≤300 lines,
declarative steps only, no plugin-side dependency. **Changes the answer:** if two
ventures need custom step types, move to B for those.
**Files:** `tools/demo-record.mjs`, `templates/launch-demo-flow.md`,
`commands/verify.md` (step 5), `agents/frontend.md` (authors demo-flow.md during the
build), `tools/lint.mjs` (selftest), `templates/launch-plan.md` (video row).

## Memo 3 — Hash / epoch / claim storage and enforcement point

**Question.** Where do the pin and the claim live, and what mechanically refuses a
tampered or double fire? Constrains the queue format and the §3 hook (F2).

| Option | How it works here | Tradeoffs | Reversal |
|---|---|---|---|
| **A. Columns in `publish-queue.md` only**, checked by `/publish run` prose | Add `kind`, `body-sha256`, `epoch`, `approved-for` columns | Human-readable, one file; but a claim needs an atomic append and in-place markdown edits are not that; enforcement stays prose | Cheap |
| **B. Sidecar `publish-claims.jsonl` only** | Append-only events: `approved`, `claimed`, `dispatching`, `delivered`, `unknown` | Mechanical, replayable; but the human reviews the queue in PRs and would not see approvals there | Cheap |
| **C. Both, with a gate tool** | Queue carries `kind`, `body-sha256`, `epoch` (truth for content, human-reviewed); `docs/product/launch/publish-claims.jsonl` carries approval snapshots + claims (append-only, machine truth for state). `tools/publish-gate.mjs` (zero-dep) has `stamp` (recompute hashes, bump epoch on drift, reset to draft), `approve <id>` (writes snapshot of hash+epoch), `claim <id>` (validates hash/epoch/kind/policy/due, appends `claimed`, prints a one-time `PUBLISH_CLAIM=<token>`), `outcome <token> delivered\|unknown`. The §3 hook, on a publish-host call, looks for `PUBLISH_CLAIM=` in the command text and verifies it in the jsonl | Two files, one derivation rule; misuse is unrepresentable: no token → no delegated fire; `kind: outreach` → gate never mints a token, and a token that resolves to outreach is blocked regardless of policy | Medium: the jsonl becomes the audit trail |

**Enforcement point:** both. The command logic (gate tool) is runtime-agnostic and
the only path in Codex; the hook is the fail-closed backstop in Claude. Hook rule:
under `may-publish` a publish-host call **without** a valid `claimed` token exits 2;
under `human-only` it stays a reminder (the hook cannot tell a `connect` round-trip
from a post, and the human is at the keyboard); a token resolving to `kind: outreach`
exits 2 under any policy. Move the inline hook to `hooks/lib/publish-guard.sh`
(precedent: every governance hook lives in lib).
Hash = sha256 over the `### <id>` body section, LF-normalised, trailing whitespace
trimmed. `unknown` is terminal until a human writes `delivered` or `failed`.

**Recommendation: C.** **Case against:** the harness must now stage a jsonl and a
queue per case (five cases in the brief); more fixture surface. Worth it: the brief's
"tampered approved body is refused" is only provable with a file the hook can read.
**Changes the answer:** none at this scale; if the queue outgrows markdown, B alone.
**Files:** `templates/publish-queue.md`, `tools/publish-gate.mjs`,
`hooks/lib/publish-guard.sh`, `hooks/hooks.json`, `tools/hook-test.mjs`,
`commands/publish.md`, `tools/lint.mjs`, `templates/WORKFLOW.md` §3/§14.

## Memo 4 — TTS abstraction and ceiling enforcement

**Question.** How is narration voiced, where does the per-video ceiling live, and
what logs the spend? Constrains the §11 money boundary.

| Option | How it works here | Tradeoffs | Reversal |
|---|---|---|---|
| **A. Prompt-only** (writer curls the provider) | Instructions in `agents/writer.md` | Ceiling by discipline; no pre-flight; the exact failure the brief names | Cheap |
| **B. `tools/tts.mjs` adapter, ceiling in the flight plan** | Provider table in the tool (ElevenLabs first; key NAME `ELEVENLABS_API_KEY`); ceiling read from `flight-plan.md` Guardrails row `TTS per-video ceiling: $1`; **pre-flight** `chars × rate ≥ ceiling → refuse` (F8), no network call made; absent key or absent ceiling → exit 0 with `narration: absent (no key\|no ceiling)`; on success appends a row to `docs/product/launch/spend-log.md` (release, chars, est $, provider) and to the video receipt | Bounded by shape before spend; one provider to start; rate table can drift (record actual chars from the response/usage header where the provider exposes one — **assumption**) | Cheap: adapter table, additive |
| **C. Ceiling in `.env`** (`TTS_VIDEO_CEILING_USD`) | Env read by the same tool | Not reviewed in PRs; a budget rule hiding in an uncommitted file | Cheap |

**Recommendation: B.** The ceiling is a reviewed document row, the check runs before
money moves, and the receipt is the proof. Mixing uses the system ffmpeg (Memo 6).
**Case against:** the plugin now carries a price table that goes stale; mitigate by
failing closed to silent when the provider's model name is not in the table.
**Changes the answer:** a second provider wanted → same table, no shape change.
**Files:** `tools/tts.mjs`, `templates/flight-plan.md`, `agents/writer.md` (script),
`.env.example`, `templates/launch-spend-log.md`, `tools/demo-record.mjs` (mix step).

## Memo 5 — Discovery adapters

**Question.** Scripts per source vs prompt instructions over MCP/HTTP, given Codex
has neither MCP nor WebSearch (F3).

| Option | How it works here | Tradeoffs | Reversal |
|---|---|---|---|
| **A. Prompt over MCP/WebSearch** | Prospector calls Firecrawl MCP + WebSearch | Claude-only; non-reproducible; fails the runtime-agnostic constraint outright | n/a |
| **B. One zero-dep script per source under `tools/discover/`** — `hn.mjs` (Algolia HN search, no key), `reddit.mjs` (public JSON, UA required; **assumption**: unauthenticated access survives at low volume), `github.mjs` (`gh search issues`, no new key), `x.mjs` (`GET /2/tweets/search/recent`, `X_BEARER_TOKEN`), `web.mjs` (Firecrawl HTTP search, `FIRECRAWL_API_KEY`) | Uniform JSONL output `{source,url,author,handle,quote,date}`; each exits 0 with `adapter <name>: skipped (no KEY)` when its key is absent; fixture-tested in lint; identical in both runtimes; the agent treats output as untrusted data | Cheap per adapter |
| **C. Hybrid** (scripts for keyed sources, MCP for Firecrawl in Claude) | Two code paths for one source | Divergent results between runtimes; harder to test | Cheap |

**Recommendation: B.** It is the only option that satisfies the constraint and is
testable. **Case against:** five small HTTP clients against drift-prone APIs (X
especially); mitigate with ≤60 lines each, a recorded fixture per adapter, and a
"schema-only" contract test (fields present), not a live call, in CI. The Firecrawl
MCP is already keyed; the HTTP path needs the same key NAME in `.env.example`.
**Changes the answer:** if Codex gains MCP parity, C becomes viable; still prefer B.
**Files:** `tools/discover/*.mjs`, `tools/discover/README.md` (contract),
`tools/lint.mjs` (fixture checks), `.env.example`, `agents/prospector.md`.

---

## Memo 6 — Browser and ffmpeg on a consumer machine (missed by the brief)

The plugin ships no dependency (F1), so the runner **preflights**: (1) `playwright`
resolvable from the venture cwd — it is a devDependency of most front-ends; if not,
the runner prints `npm i -D playwright` as the venture-side fix and exits non-zero
(the venture owns its deps); (2) `npx playwright install chromium ffmpeg` when the
browser cache is empty; (3) an H.264-capable `ffmpeg` on PATH for the mp4 and the
narration mix. **Options:** (a) require system ffmpeg, fail closed to the raw
`.webm` with receipt `format: webm (no ffmpeg)`; (b) always ship webm. **Recommend
(a)**: the AC says mp4 and `brew install ffmpeg` is a one-time owner act; the webm
fallback means a missing binary never blocks a verify. Add the check to
`/agentic-workflow:doctor`. **Blocker to confirm at n=1:** F7's bundled-ffmpeg
inference.

## Memo 7 — `demo-flow.md` absent at verify time

Options: (a) FAIL the verify; (b) skip with a recorded finding; (c) derive a flow
from `sales-demo-script.md`. **Recommend (b)**: verify records `DEMO SKIPPED: no
docs/product/launch/demo-flow.md` as a finding (same shape as REHEARSAL FAIL), names
the template, and the orchestrator files a backlog row owned by `frontend`. A verify
PASS must stay about the deploy; (c) is prose, not selectors, and would invent
steps.

## Memo 8 — Contacted-ledger dedupe across releases

Key = **normalised profile URL** (lowercase host, no query, trailing slash
stripped), one row per person-channel, with a `handle` alias column; the quote URL
is evidence, not identity. Exclusion rule for the next shortlist: drop a candidate
whose key matches `contacted.md` **or** an open `kind: outreach` queue item (drafted
but unsent carries forward; it is not re-drafted). Ledger is append-only; the human
fills `date sent`. Alternative (name match) rejected: collisions and homonyms.
**Files:** `templates/launch-contacted.md`, `agents/prospector.md`.

## Memo 9 — X recent search tier

Facts in F6. Implication: there is no free path for new developers; the owner must
save a card (receives $20 credit) and pays ≈$0.005 per post read. A 20-person
shortlist at ~5 queries × 100 results ≈ 500 reads ≈ **$2.50 per release**
(inference). Decision for the human: ship `x.mjs` (fail-closed without
`X_BEARER_TOKEN`) and leave enabling it to the owner at `/publish connect x`. No
mission dependency on X; HN/Reddit/GitHub/Firecrawl cover n=1.

## Memo 10 — Codex parity for the new pieces

Prospector into `NETWORK_ROLES` (one line, F3); every adapter and the gate tool are
Node scripts so both runtimes run the same code; the §3 hook does not fire in Codex
(already a named gap in §3), so the gate tool's refusal is the only mechanical check
there. An execpolicy `prefix_rule` cannot help: rules match command text, not roles,
so it could not forbid `publish-gate.mjs outcome delivered` for agents while allowing
it for the human. Carry as a mission Risk row like the existing paid-host gap.

---

## Summary table

| # | Decision | Recommended |
|---|---|---|
| 1 | Prospecting home | New `prospector` agent |
| 2 | Recorder | Plugin runner `tools/demo-record.mjs` + venture `demo-flow.md` |
| 3 | Pin/claim | Queue columns + `publish-claims.jsonl`; gate tool and hook both enforce |
| 4 | TTS | `tools/tts.mjs`, ceiling row in flight plan, pre-flight cost refusal |
| 5 | Adapters | Zero-dep scripts per source, JSONL contract, fail closed per key |
| 6 | Browser/ffmpeg | Venture-resolved Playwright; system ffmpeg, webm fallback |
| 7 | No demo-flow | Skip + finding + backlog row |
| 8 | Ledger key | Normalised profile URL; open outreach drafts also exclude |
| 9 | X tier | Pay-per-use only; adapter shipped, owner opts in |
| 10 | Codex | NETWORK_ROLES edit; gate tool is the only check there (Risk row) |

_The human locks; choices land in the mission master plan pointing here._
