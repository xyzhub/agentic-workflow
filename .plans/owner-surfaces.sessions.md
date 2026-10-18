---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: owner-surfaces — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the
expensive exploration happened once, here (2026-10-16, tree at 0933304 on
`plan/owner-surfaces`, plugin v1.62.0)._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/owner-surfaces.md` · Ledger: `.plans/owner-surfaces.state.md`

**Catalog**: none — this repo's §10 **Catalog** row is `none — markdown-only
plugin` (`docs/product/catalog/` does not exist). No catalog reads, no catalog
regeneration in Verify.

**Gates available in this repo** (§10):

| Gate | Command | When |
|---|---|---|
| Lint (CI `lint.yml` runs it; it runs every harness) | `node tools/lint.mjs` | end of every brief and at each checkpoint — clean today apart from the standing `warn:` on WORKFLOW bytes |
| State harness (new, S1) | `node tools/state-test.mjs` | S1 onward |
| Ledger harness | `node tools/ledger-test.mjs` | S4 (lease); must stay green throughout |
| Hook harness | `node tools/hook-test.mjs` | S4 (`--force` guard); must stay green throughout |
| Ceremony harness | `node tools/ceremony-test.mjs` | S1 (`readClasses` change) |
| Staging verify (§10 Staging = none) | lint green on the branch + `claude --plugin-dir plugins/agentic-workflow` loads | at ckpt-p3, before the PR is marked ready |
| Live surface check (main session only) | `node plugins/agentic-workflow/tools/state.mjs page` then the Artifact tool publish to the `artifact-url` | once, after ckpt-p3 APPROVE (subagents cannot publish) |

**Facts already probed (do not re-probe):** `node` v24, `jq` present; repo
harnesses in `tools/`, plugin tools in `plugins/agentic-workflow/tools/`. No
JSON-schema library in the repo (zero deps — write the validator). No mission
lease and no `pending-gates.md` exist anywhere (memos "Measured ground").
`operate.json` is absent on this machine. Lint fails any tracked `.mjs` line
> 1,000 chars (`checkObfuscation`). BUDGETS at `tools/lint.mjs:975–978`
(command 24,000 B, workflow 120,000 B). `readClasses()` locates columns by
header name (`ceremony.mjs:48`), so adding a `plain` column is safe for it;
`tools/ceremony-test.mjs` does not parse `gate-classes.md` itself.
`codex.rules` `prefix_rule` tokens are literal — no wildcard for a mission name
(`templates/codex.rules:32`).

**Branch**: `mission/owner-surfaces`, cut from `plan/owner-surfaces` (which
carries the decision records + this trio). All three phases on it; each phase
ends in a one-shot Fable checkpoint; one feature PR to `main` (draft after
ckpt-p1, ready after ckpt-p3); the human merges. Phases are sequential — not
parallel-safe (S2 and S3 consume S1's tool; S4 edits files S2/S3 touched).

**Byte plan** (master plan, Locked decisions): every brief reports
`wc -c plugins/agentic-workflow/templates/WORKFLOW.md
plugins/agentic-workflow/commands/mission.md` in its return, against its own
cap. Over its cap → move the text into `templates/owner-surfaces.md`.

## Large-files table

| File | Lines | Notes |
|---|---|---|
| `tools/hook-test.mjs` | 1,969 | ranged reads only (20–135 harness, 1605–1630 git/gh guardrails block) |
| `CHANGELOG.md` | 1,538 | read 1–12 only |
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 1,421 | 113,392 B; §5 hand-off 576–586, §10 1015–1049, §12 1175–1243 |
| `docs/WORKFLOW.md` | 1,420 | this repo's copy, stamp v1.62.0 (line 3); §10 from 1007 |
| `tools/lint.mjs` | 1,371 | read only the named ranges |
| `plugins/agentic-workflow/tools/publish-gate.mjs` | 445 | read 1–60 and 100–160 (sha/norm, temp + rename, O_EXCL lock) |
| `plugins/agentic-workflow/commands/mission.md` | 350 | 22,727 B; ranged reads only |
| `plugins/agentic-workflow/README.md` | 338 | read 186–212 only |
| `tools/ledger-test.mjs` | 335 | |
| `tools/lint-test.mjs` | 310 | no read |
| `plugins/agentic-workflow/tools/ceremony.mjs` | 306 | read 40–56 and 240–245 only |
| `docs/product/decisions/2026-10-16-owner-surfaces-memos.md` | 303 | ranged per brief |
| `plugins/agentic-workflow/templates/codex.rules` | 294 | read 25–45 only |
| `plugins/agentic-workflow/tools/ledger.mjs` | 277 | |
| `docs/product/overview.html` | 256 | 44,415 B (long lines); regions 147–249 |
| `plugins/agentic-workflow/commands/operate.md` | 255 | read 78–90 only |
| `plugins/agentic-workflow/tools/operate-triage.mjs` | 220 | read 1–15 and 70–85 only |
| `plugins/agentic-workflow/templates/overview.html` | 215 | 13,264 B; rewritten whole in S3 |
| `plugins/agentic-workflow/hooks/hooks.json` | 192 | the guardrails command is ONE long line (56–57) |
| `docs/product/decisions/2026-10-16-owner-surfaces-journeys.md` | 170 | |
| `plugins/agentic-workflow/agents/chronicler.md` | 154 | read 81–100 only |
| `plugins/agentic-workflow/commands/doctor.md` | 149 | read 52–62 only |
| `plugins/agentic-workflow/templates/distillate.schema.json` | 109 | read 1–40 (draft-07 idiom) |
| `plugins/agentic-workflow/templates/gate-classes.md` | 100 | |
| `plugins/agentic-workflow/commands/plan.md` | 93 | |

---

## Phase 1 — the data spine (branch: `mission/owner-surfaces`)

### S1 — schema + validator + `plain` column + `tools/state.mjs` (json · ask · answer · expire · check) + harness

- **ACs**: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9
- **Suits**: `backend` (a new zero-dep Node tool, a schema, a harness).
  Runtime: `claude` (no tune puts backend on codex).
- **Reads** (in this order):
  1. `.plans/owner-surfaces.md` Tasks 1–2 + Value sourcing + Locked decisions
     (≈ 170 lines) — the ACs are the spec.
  2. `docs/product/decisions/2026-10-16-owner-surfaces-memos.md` 41–107 (D1,
     D2) and 17–32 (measured ground).
  3. `plugins/agentic-workflow/templates/distillate.schema.json` 1–40 (the
     repo's draft-07 idiom).
  4. `plugins/agentic-workflow/templates/gate-classes.md` 1–100 (whole; both
     tables at 24–33 and 45–55).
  5. `plugins/agentic-workflow/tools/ceremony.mjs` 40–56 (`readClasses`,
     `cells`) and 240–245 (how `ctx` loads gate-classes).
  6. `plugins/agentic-workflow/tools/publish-gate.mjs` 1–60 (header style,
     `norm`/`sha` exports at 52–53) and 100–160 (temp + rename, the `'wx'`
     lock at 144).
  7. `plugins/agentic-workflow/tools/ledger.mjs` 1–90 (header block, row
     grammar, `rows`/`section` helpers to import for ledger parsing) and
     270–277 (`isEntry`).
  8. `plugins/agentic-workflow/tools/operate-triage.mjs` 1–15 and 70–85 (the
     `operate.json` path rule and shape).
  9. `tools/ledger-test.mjs` 1–30 (harness shape: `ok`, `fails`, exit code)
     and `tools/lint.mjs` 515–540 (`checkLedgerHarness`) + 1355–1365 (the
     check list to append `checkStateHarness` to).
  10. A real ledger for the AC-8 fixture: `.plans/adaptive-ceremony.state.md`
      1–80 (header lines + Checklist), and `docs/product/JOURNEY.md` 1–35.
- **Do**:
  1. **Schema (AC-1)** — `templates/owner-surfaces.schema.json`, `$defs`
     `question`, `event` (`asked` carries the full question; `answered`
     carries `optionId` or `other`, `via: "chat"`; `expired`), `state`
     (top-level keys: `schemaVersion`, `generatedAt`, `project`, `missions[]`
     (name, status, estimate, sessionsUsed, reviewerRuns, nextUp,
     checklist[{glyph, text}], lease|null), `questions[]`, `journey[]`,
     `obligations[]`, `ops` {loop|null, triage|null, errors: null, costs:
     null}). Strict (`additionalProperties: false`) everywhere.
  2. **Validator (AC-2)** — `validate()` + the code-side checks
     (`checkQuestion(q, classes)`), exported; unsupported keyword → throw.
  3. **`plain` column (AC-3)** — add the column to both tables and the `none`
     line (designer wording: `-journeys.md` "Gate class in plain words" and
     memos 73); extend `readClasses` to return `plain` (and `plainNone`).
  4. **`tools/state.mjs` (AC-4..AC-9)** — header usage in the `ledger.mjs`
     style; `ask` / `answer` / `expire` append under an `O_EXCL` lock on
     `.plans/questions.jsonl.lock`; `json` imports `rows`/`section` from
     `ledger.mjs` and parses the optional `Lease:` line with the AC-18
     grammar (no writer yet); `--gh` is accepted and ignored until S3
     (document it as reserved).
  5. **Harness** — `tools/state-test.mjs` (temp dirs; `--now` for expiry;
     every refusal leaves the log byte-identical; `json` writes nothing; the
     adaptive-ceremony ledger copied into a temp `.plans/` validates; the
     Missions-contract assertions on `hooks.json` and the three command
     frontmatters; a field containing `</script>` survives `json` intact for
     S3). `checkStateHarness` in `tools/lint.mjs`.
  Do not touch `.plans/` ledgers (the orchestrator owns them). Commit on the
  branch with the §10 Attribution line.
- **Verify**:
  - `node tools/state-test.mjs` exit 0 (name the case count);
    `node tools/ceremony-test.mjs` exit 0; `node tools/lint.mjs` → clean.
  - `node plugins/agentic-workflow/tools/state.mjs json --mission adaptive-ceremony | node -e 'JSON.parse(require("fs").readFileSync(0,"utf8"))'` exit 0.
  - `grep -c '| plain |\|plain' plugins/agentic-workflow/templates/gate-classes.md` shows the column in both tables.
  - Catalog: none, nothing to regenerate.
- **Read budget**: ~880 lines (plan 170 · memos 85 · distillate 40 ·
  gate-classes 100 · ceremony 25 · publish-gate 120 · ledger.mjs 100 ·
  operate-triage 30 · ledger-test 30 · lint 40 · adaptive-ceremony ledger 80
  · JOURNEY 35) — inside 1,500. Writes are large (~900 lines); keep reads to
  this list.

### S2 — protocol wiring: §12 + repoints, `/plan` interview emission, public interface, fixtures

- **ACs**: AC-10, AC-11, AC-12, AC-13, AC-25 (the OB-30 extension)
- **Suits**: `devops` (protocol prose across templates/commands + fixtures;
  no new code beyond fixture JSON). Runtime: `claude`.
- **Reads** (in this order):
  1. `.plans/owner-surfaces.md` Tasks 3 + 6 (AC-25) + the byte plan (≈ 60
     lines).
  2. `plugins/agentic-workflow/tools/state.mjs` header usage block only
     (≈ 40 lines, built in S1) — the verbs and exit codes the prose names.
  3. `plugins/agentic-workflow/templates/WORKFLOW.md` 1175–1243 (§12, 4,446 B;
     rule 3 at 1209–1214).
  4. `plugins/agentic-workflow/commands/plan.md` 1–93 (whole; §1 at 19–37, §3
     at 55–63).
  5. `plugins/agentic-workflow/commands/mission.md` 120–132 (§1 open
     questions, "ask via AskUserQuestion where available" at 128).
  6. `plugins/agentic-workflow/commands/operate.md` 78–90;
     `commands/doctor.md` 52–62; `plugins/agentic-workflow/README.md`
     205–212; `templates/agents-registry.schema.json` 1–6.
  7. `docs/product/decisions/2026-10-16-owner-surfaces-memos.md` 63–67 (how
     `/plan` emits) and 270–291 (D7 — the four Missions invariants).
  8. `.plans/OBLIGATIONS.md` line 70 (OB-30) and `templates/obligations.md`
     1–30 (row grammar).
  9. `plugins/agentic-workflow/templates/session-handoff.md` 1–10 (frontmatter
     shape to copy for the new template).
- **Do**:
  1. **§12 (AC-10)** — rewrite rule 3 in place; add ≤ one pointer paragraph
     to `templates/owner-surfaces.md`. Report the §12 byte delta (cap
     +700 B).
  2. **Repoints (AC-10)** — operate.md:85 (`state.mjs json --pending` vs the
     channel; consume via `answer`), doctor.md:58 (stale = expired, never
     answered), README:211 (`.plans/` line names `questions.jsonl`),
     registry schema description. `grep -rn pending-gates plugins/` → none.
  3. **Interview emission (AC-11)** — plan.md §1 and §3: the three-step rule
     (write JSON → `ask` → unchanged `AskUserQuestion` → `answer --via
     chat`), cap +900 B. mission.md §1: one sentence, cap +250 B. Do not
     touch any `allowed-tools` line.
  4. **Public interface (AC-12)** — `templates/owner-surfaces.md`
     (frontmatter `status: semi-static`, `owner-agent: planner`,
     `refresh-trigger: release`): schema + version rule, verbs/flags/exit
     codes, event grammar, the four Missions invariants, fixtures path;
     leave `## Generated regions` and `## Mission lease` headings with a
     one-line "filled by …" placeholder for S3/S4. Link
     `templates/gate-classes.md`; never list classes.
  5. **Fixtures (AC-13)** — `tools/fixtures/owner-surfaces/` (state.json,
     `question-gate.json` (action class, `fireCommand`),
     `question-interview.json`, `question-scope.json`,
     `question-open-question.json`, `questions.jsonl`); add the fixture
     validation cases to `tools/state-test.mjs`.
  6. **OB-30 (AC-25)** — extend OB-30's `do:` in place with the fixtures
     adoption and "≈ 1 Missions session"; keep it lint-valid (check 13/14).
- **Verify**:
  - `node tools/lint.mjs` clean (`checkClassListDedup`, template
    frontmatter, cross-refs, Closing/OB grammar); `node tools/state-test.mjs`
    exit 0.
  - `grep -rn "pending-gates" plugins/` → no output.
  - `grep -c AskUserQuestion plugins/agentic-workflow/commands/{plan,mission,bootstrap}.md` unchanged or higher; `hooks.json` has no AskUserQuestion matcher (state-test asserts).
  - Byte report: WORKFLOW.md and mission.md vs their S2 caps.
- **Read budget**: ~470 lines — light by design (the prose is the work; the
  fixtures need S1's schema in context).

**Checkpoint ckpt-p1** ends phase 1 — one-shot `reviewer` on **Fable**
(boundary-class: new `tools/state.mjs`, `templates/*.schema.json`,
`templates/gate-classes.md`, §12 — `security-boundary`,
`templates/gate-classes.md:32`) over `plan/owner-surfaces..HEAD`, re-running
the gates against AC-1..AC-13 + AC-25, incl. the Missions-contract invariants
and the validator's fail-closed behaviour. APPROVE → open the draft feature PR
to `main`; next phase on the same branch.

---

## Phase 2 — the generated surface (branch: `mission/owner-surfaces`)

### S3 — `state.mjs page` + `templates/overview.html` rewrite + this repo's page + chronicler

- **ACs**: AC-14, AC-15, AC-16, AC-17
- **Suits**: `frontend` (a client-facing HTML/CSS surface rendered from
  Node; HIG applies — load the `hig` skill; the template's design system is
  the contract). Runtime: `claude`.
- **Reads** (in this order):
  1. `.plans/owner-surfaces.md` Task 4 + Value sourcing rows for AC-14..16
     (≈ 70 lines).
  2. `docs/product/decisions/2026-10-16-owner-surfaces-journeys.md` 88–170
     (page IA, card fields, gate class in plain words, copy per state, HIG
     notes) — use only the E2a states (no pending, pending read-only,
     expired, answered in chat); the on-page states are E2b.
  3. `docs/product/decisions/2026-10-16-owner-surfaces-memos.md` 111–149 (D3,
     region ownership) and 238–266 (D6, option A only).
  4. `plugins/agentic-workflow/templates/overview.html` 1–215 (whole —
     rewritten).
  5. `docs/product/overview.html` 1–20 and 140–256 (artifact-url comment,
     existing regions; lines are long — use `sed -n` ranges, not a whole
     Read).
  6. `plugins/agentic-workflow/tools/state.mjs` header + `json` builder (as
     built in S1/S2; ≈ 120 lines).
  7. `plugins/agentic-workflow/agents/chronicler.md` 81–100;
     `commands/mission.md` 282–290 (§4 republish line);
     `templates/owner-surfaces.md` (S2's, ≈ 100 lines).
  8. `plugins/agentic-workflow/tools/ceremony.mjs` 44–56 (`readClasses` →
     `plain`).
- **Do**:
  1. **Renderer (AC-14)** — `page` verb: region replace between markers,
     escape helper, island writer, `--check`, `--gh` (one `gh issue list
     --label … --json number` count per loop label; failure → triage `null`
     → "Not measured yet"). A missing marker in the target file → exit 2
     naming it (never insert silently).
  2. **Template (AC-15)** — rewrite `templates/overview.html` per D3 order,
     card layout and copy, HIG fixes; keep the CSP-safe, no-external-request
     rule; the island is the only `<script>` and it is
     `type="application/json"`.
  3. **J4 proxy (AC-16)** — cases in `tools/state-test.mjs` over a rendered
     fixture page (all four question fixtures pending) + the injection case
     (`</script>` and `<img onerror>` in a headline).
  4. **This repo's page (AC-17)** — migrate `docs/product/overview.html`
     once to the new template's structure (keep line 1 `artifact-url` and
     the re-mint comment, the pillars content as a labelled hand region),
     then `state.mjs page`; commit the regenerated file.
  5. **Chronicler + mission.md (AC-17)** — rewrite chronicler "Artifact 3"
     (cap +200 B); mission.md §4 republish line (cap +60 B); fill
     `owner-surfaces.md` `## Generated regions`.
- **Verify**:
  - `node tools/state-test.mjs` exit 0; `node tools/lint.mjs` clean.
  - `node plugins/agentic-workflow/tools/state.mjs page --check` exit 0 on
    this repo; `wc -c plugins/agentic-workflow/templates/overview.html`
    ≤ 24,000.
  - `grep -c '<script' docs/product/overview.html` = 1 and it is the
    `application/json` island.
  - Report contrast of `#8a8dab` on the panel and background colours
    (computed, with the formula's numbers).
- **Read budget**: ~900 lines (plan 70 · journeys 85 · memos 70 · template
  215 · repo page ~140 (long lines) · state.mjs 120 · chronicler 20 ·
  mission 10 · owner-surfaces 100 · ceremony 15).

**Checkpoint ckpt-p2** ends phase 2 — one-shot `reviewer` on **Fable**
(`tools/` + `templates/` — `security-boundary`) over the phase-2 commits,
against AC-14..AC-17: the escaping/injection cases, `--check` determinism,
the J4 proxy, and a **plain-report read plus the designer's V4 heuristic
pass** of the rendered page (journeys' independence note: routed through this
checkpoint, never self-certified). APPROVE → next phase on the same branch.

---

## Phase 3 — the lease and the release (branch: `mission/owner-surfaces`)

### S4 — `ledger.mjs lease` + every-write brake + race selftest + `--force` guard + §5/mission.md + release

- **ACs**: AC-18, AC-19, AC-20, AC-21, AC-22, AC-23, AC-24
- **Suits**: `devops` (git CAS, hooks, harness, release chores) — with
  security weight; the checkpoint is Fable. Runtime: `claude`.
- **Prior art**: `plugins/agentic-workflow/hooks/hooks.json` — the `git/gh
  guardrails` PreToolUse command (line 56–57) is the refusing hook to extend
  with the `ledger.mjs … lease … --force` case (exit 2), in place; do not
  reorder its push/refspec/tag/commit logic. `templates/codex.rules` 25–45
  ("WHAT IS NOT HERE") is where the Codex-side gap is named. The tool-level
  owner check follows `publish-gate.mjs`'s "the human fires it" boundary.
- **Reads** (in this order):
  1. `.plans/owner-surfaces.md` Tasks 5–6 + Locked decisions (Assumed lease
     lines) + the byte plan (≈ 110 lines).
  2. `docs/product/decisions/2026-10-16-owner-surfaces-memos.md` 206–235 (D5)
     and `-counsel.md` 20–33 (why the original lease failed).
  3. `plugins/agentic-workflow/tools/ledger.mjs` 1–277 (whole — every write
     verb gets the brake; `parseArgs`, `apply`, `commit`).
  4. `tools/ledger-test.mjs` 1–90 and 207–231 (fixture + the `--commit`
     case's git env).
  5. `plugins/agentic-workflow/hooks/hooks.json` line 56–57 — print the
     command with `node -e 'const h=require("./plugins/agentic-workflow/hooks/hooks.json").hooks.PreToolUse[0].hooks[0]; console.log(h.description.slice(0,40)); console.log(h.command)'`.
  6. `tools/hook-test.mjs` 20–135 (`hookCommand`, `runHook`, `check`) and
     1605–1630 (the guardrails block to extend).
  7. `plugins/agentic-workflow/templates/codex.rules` 25–45.
  8. `plugins/agentic-workflow/templates/WORKFLOW.md` 576–586 (§5 hand-off)
     and `commands/mission.md` 282–297 (§4) + 310–325 (§5 close).
  9. `templates/owner-surfaces.md` (≈ 120 lines) and
     `plugins/agentic-workflow/tools/state.mjs` lease parse (≈ 20 lines).
  10. Release: `CHANGELOG.md` 1–12; `plugins/agentic-workflow/.claude-plugin/plugin.json`;
      `README.md` 186–212; `docs/WORKFLOW.md` 1–5 and 1007–1060 (§10, for the
      sync); `plugins/agentic-workflow/commands/sync.md` 28–58 (the preserve
      awk).
- **Do**:
  1. **Confirm (not a gate)** — via the Bash tool run
     `node -e 'console.log(!!process.stdin.isTTY)'`; the plan-judge verified
     `false` 2026-10-16. Report the value.
  2. **Lease verbs (AC-18, AC-19)** — `lease take|renew|release` in
     `ledger.mjs` (git `fetch origin lease/<m>`, `hash-object`/`mktree`/
     `commit-tree -p <fetched origin tip>` — no `-p` only when the ref is
     absent —, plain `git push origin <sha>:refs/heads/lease/<m>`, never
     `--force`; reject → reset
     the local ref, exit 2); token file in `git rev-parse --git-dir`; the
     ledger mirror line + commit only after the push succeeds. Refuse
     `--no-push` for lease verbs.
  3. **Brake (AC-20)** — one `leaseGuard()` called by `apply()` before any
     write; renewal on holder beats with < 2 h left.
  4. **Takeover + `--force` (AC-21)** — expired takeover handoff line; TTY
     check; Deviations + handoff lines; hook case in the guardrails command;
     codex.rules note.
  5. **Selftest (AC-22)** — `lease` section in `tools/ledger-test.mjs` (temp
     bare origin, two clones, parallel `take` × 5 via `spawn`, clearing the
     lease between rounds (winner `release`, or `--now` past `expiresAt`),
     every sequential case); hook-test cases for the guard.
  6. **Prose (AC-23)** — §5 hand-off (cap +400 B), mission.md §4/§5 (cap
     +290 B), `owner-surfaces.md` `## Mission lease`.
  7. **Release (AC-24)** — plugin.json 1.63.0; CHANGELOG `[1.63.0]`; README
     tools list (`tools/state.mjs  # json · ask · answer · expire · check ·
     page`); sync `docs/WORKFLOW.md` from the template at stamp
     `<!-- protocol-master: v1.63.0 -->` with §10–§10.2 + Local amendments
     preserved (the sync.md step-2 awk); fire nothing in `.plans/` (the
     orchestrator fires the pre-merge Closing rows).
- **Verify**:
  - `node tools/ledger-test.mjs`, `node tools/hook-test.mjs`,
    `node tools/state-test.mjs` each exit 0 (name the new case counts; the
    race section runs 5 rounds with exactly one winner each).
  - `node tools/lint.mjs` clean; byte report: `templates/WORKFLOW.md`
    ≤ 114,492 B, `commands/mission.md` ≤ 23,327 B.
  - `diff <(sed '/^## 10\./,/^## 11\./d;/^## Local amendments/,$d' plugins/agentic-workflow/templates/WORKFLOW.md) <(sed '/^## 10\./,/^## 11\./d;/^## Local amendments/,$d' docs/WORKFLOW.md)` → only the stamp line differs (or nothing).
  - `grep '"version"' plugins/agentic-workflow/.claude-plugin/plugin.json` → 1.63.0.
  - `claude --plugin-dir plugins/agentic-workflow` loads (or report it as
    skipped with the reason — never green when not run).
- **Read budget**: ~1,000 lines (plan 110 · memos/counsel 45 · ledger.mjs
  277 · ledger-test 115 · hooks 1 line · hook-test 140 · codex.rules 20 ·
  WORKFLOW 10 · mission 30 · owner-surfaces 120 · state 20 · release ≈ 120).

**Checkpoint ckpt-p3** ends phase 3 — one-shot `reviewer` on **Fable**
(`hooks.json`, `tools/ledger.mjs` — the ledger write path every beat uses —
and `templates/`: `security-boundary`) over the WHOLE mission diff
`origin/main..HEAD`, against AC-1..AC-25: the race selftest (exactly one
winner), the brake's legacy-ledger behaviour, the `--force` guard, the
Missions-contract invariants, the byte plan, and a plain-report read of every
owner-facing string. APPROVE → staging verify (lint + `--plugin-dir` load) →
the **main session** runs `state.mjs page` and publishes
`docs/product/overview.html` to its `artifact-url` once (the live surface
check) → mark the PR ready; the human merges.

---
_Each session's outcome and any deviation lands in
`.plans/owner-surfaces.state.md`, never only in chat._
