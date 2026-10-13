---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: adaptive-ceremony — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the expensive
exploration happened once, here (2026-10-13, tree at dc9bf34, plugin v1.60.0)._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/adaptive-ceremony.md` · Ledger: `.plans/adaptive-ceremony.state.md`

Design sources (read the named ranges, never whole):
`docs/product/decisions/2026-10-13-adaptive-ceremony-brief.md` (260 lines —
lines 56–114 ACs, 123–207 designer copy, 209–260 Locked decisions),
`…-memos.md` (251 — D1 22–47, D2 51–88, D3 92–137, D4 141–170, D5 174–206,
D6 210–236), `…-counsel.md` (72 — technical conditions 42–63),
`…-metrics.md` (61 — §3 25–38, §4 40–48). Decisions are locked in the master
plan; the sources are not re-litigated.

**Catalog**: none — this repo's §10 **Catalog** row is `none — markdown-only
plugin` (`docs/product/catalog/` does not exist; re-checked 2026-10-13). No
catalog reads, no catalog regeneration in Verify.

**Gates available in this repo** (§10):

| Gate | Command | When |
|---|---|---|
| Test / lint gate (CI `lint.yml` runs it) | `node tools/lint.mjs` | every brief, every checkpoint — clean on `main` 2026-10-13 apart from the standing `warn:` on WORKFLOW bytes |
| Lint unit harness | `node tools/lint-test.mjs` | after editing `tools/lint.mjs` or the dedup fixtures |
| Hook behaviour harness | `node tools/hook-test.mjs` | S2 (merge guard); reached by lint |
| Ledger harness | `node tools/ledger-test.mjs` | S2 (`reviewer-runs`); reached by lint |
| Ceremony harness (new, S2) | `node tools/ceremony-test.mjs` | S2, S3; reached by lint after S2 |
| Staging verify (§10 Staging = none) | lint green on the phase branch + `claude --plugin-dir plugins/agentic-workflow` loads | at each checkpoint, before the PR |

**Facts already probed (do not re-probe):** `node` v24, `jq` present; no
`package.json` at the root; plugin tools live in
`plugins/agentic-workflow/tools/`, harnesses at the repo root `tools/`; CI is
`.github/workflows/lint.yml` → `node tools/lint.mjs`. `templates/WORKFLOW.md`
is 108,821 B (ceiling 120,000; warn 108,000). Missions checkout:
`/Users/baker/Playground/missions-app` at 9aa612c, `vendor/VERSION` 1.54.1,
contract test `contract-tests/plugin-contract.test.ts` (46 lines), §10
parser `packages/runner/src/connections.ts:28-41` (bold-key rows only, to the
next `## `). `tools/operate-triage.mjs` encodes NO class names (the classes
are prose in the template only). `tune-presets.json` carries a `note` only
on `lean` (line 15).

Branches: one per phase, `mission/adaptive-ceremony-p1|p2|p3`, each cut from
`main` after the previous phase's PR merged (gate policy `human-merge`). If
the owner has not merged yet when the next session starts, cut from the
previous phase branch's head and log a deviation naming the base. Every phase
PR targets `main`; the human merges. Not parallel-safe (P2 reads P1's fences,
P3 reads P2's tool).

## Large-files table

| File | Lines | Notes |
|---|---|---|
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 1372 | §0 73–92 · §1 213–224 · §3 hook table 262–275 · §5 357–470 (rule fences 379, 406, 424, 447) · §9 901–983 · §10 984–1016 · §10.1 1017–1041 · §11 1042–1125 |
| `docs/WORKFLOW.md` (this repo's copy) | 1345 | stamp line 3; §10 filled rows ≈ 960–1010 (grep `^## 10\.`) |
| `tools/lint.mjs` | 1233 | `checkSections` 199 · `checkLedgerHarness` 520 · `checkOperateTriageSelftest` 560 · BUDGETS 955 · `printSectionBytes` 983 · `RULES` 1085–1106 · `ruleRestatement` 1116 · `checkRuleDedup` 1136 · exports 1203 · check list 1225 |
| `tools/hook-test.mjs` | 1872 | merge-guard block 1575–1660 (`wfMerge` 1596, `mg` 1602, `blocks` 1608) |
| `tools/lint-test.mjs` | 251 | budget cases 134 · `CANON_CASES` 171 · dedup cases 176–181 |
| `tools/ledger-test.mjs` | 233 | fixture `LEDGER` 27+, `ok()` 20 |
| `plugins/agentic-workflow/tools/ledger.mjs` | 256 | usage header 1–30 · `VERBS` 45 · `sessions()` 155–167 · `apply()` 204–230 |
| `plugins/agentic-workflow/tools/conform.mjs` | 230 | `has10` 71 · LADDER 135–209 (`profile-staging-row` 156) |
| `plugins/agentic-workflow/hooks/lib/merge-guard.sh` | 156 | header contract 1–17 · §10 fetch 72–77 · `RECRX` 81 · records-only 85+ |
| `plugins/agentic-workflow/commands/mission.md` | 331 | rules 49–99 · plan-judge 99 · checkpoint 195–262 · counters 267–281 |
| `plugins/agentic-workflow/commands/autopilot.md` | 203 | check-in level 50–52 · lifecycle 98–140 |
| `plugins/agentic-workflow/commands/tune.md` | 276 | preset section 211–240 |
| `plugins/agentic-workflow/commands/settle.md` | 228 | close gate 188–200 |
| `plugins/agentic-workflow/agents/reviewer.md` | 214 | description line 3 · tier section 14–24 · plan-judge checklist 190–214 |
| `plugins/agentic-workflow/commands/bootstrap.md` | 181 | preset ask 31–34 · §2 write §10 74–92 · report/offer 160–181 |
| `plugins/agentic-workflow/commands/sync.md` | 165 | §2 preserve 30–41 · §3 43–56 · §3.7 ladder 97–139 · §3.8 140–158 |
| `plugins/agentic-workflow/templates/operate-triage.md` | 145 | Escalation classes 16–34 |
| `plugins/agentic-workflow/commands/adopt.md` | 135 | §1 bootstrap 14–31 · §5 report 121–135 |
| `plugins/agentic-workflow/commands/doctor.md` | 126 | §2 profile truthfulness 62–92 · Output 123–126 |
| `plugins/agentic-workflow/templates/tune-presets.json` | 113 | `lean.note` 15 · `unattended.tick_budget` 88 |
| `plugins/agentic-workflow/commands/next.md` | 78 | Inspect 11–34 · Decide 38–55 · Output 57–66 |
| `plugins/agentic-workflow/agents/intake.md` | 65 | Classify 25–40 · Return 48–65 |
| `plugins/agentic-workflow/commands/verify.md` | 61 | whole |
| `plugins/agentic-workflow/commands/counsel.md` | 48 | whole |
| `plugins/agentic-workflow/commands/audit.md` | 49 | whole |
| `plugins/agentic-workflow/templates/mission-state.md` | 145 | header lines 15–30 |
| `plugins/agentic-workflow/README.md` | 335 | sync row 184 · tools listing 200–210 |
| `README.md` (root) | 71 | tools/templates lines 36–37 |
| `CHANGELOG.md` | 1456 | head 1–12 (`[Unreleased]` empty) |
| `plugins/agentic-workflow/hooks/hooks.json` | 192 | git/gh guardrail 51–60 · merge-guard entry 84–90 · conform-check 165–175 |

## Phase 1 — one taxonomy + protocol data (branch: `mission/adaptive-ceremony-p1`, cut from `main`)

### S1 — gate-classes template, fenced §0/§5 tables, §10 row + 10.2 placeholder, relation lines, dedup lints, sync preserve commit

- **ACs**: AC-8, AC-9 (the join-at-read contract: the `Gate` cell carries the
  class, §10.2 does not), AC-3 (the data shape the tool will read; the
  fixture test lands in S2), AC-10 (the three relation lines; the read
  points land in S3), AC-13 (plumbing only: the `Reviewer runs:` line and
  verb, step 9). Preconditions first: the Missions-contract grep and the
  WORKFLOW byte measurement.
- **Reads** (≈ 980 lines):
  - brief 209–260 (Locked decisions) · memos 92–170 (D3, D4) · memos 174–206
    (D5) · counsel 42–63.
  - `/Users/baker/Playground/missions-app/contract-tests/plugin-contract.test.ts`
    (46, whole) · `…/packages/runner/src/connections.ts` 24–60 (`profileRows`,
    `executorRows`).
  - `templates/WORKFLOW.md` 73–92 (§0 table) · 213–224 (§1) · 357–470 (§5
    through the rule fences) · 984–1041 (§10 + 10.1) · 1042–1070 (§11 first
    four paragraphs).
  - `tools/lint.mjs` 955–1000 (BUDGETS + `printSectionBytes`) · 1080–1200
    (`RULES`, `ruleRestatement`, `checkRuleDedup`) · 1225–1233 (check list).
  - `tools/lint-test.mjs` 160–200 (`CANON`, `CANON_CASES`, dedup cases).
  - `templates/operate-triage.md` 14–36 · `agents/reviewer.md` 1–24 ·
    `commands/sync.md` 30–56 · `templates/tune-presets.json` 10–20 ·
    `commands/tune.md` 211–226.
- **Catalog**: none.
- **Do** (order rule: measure → taxonomy → fences → row → lint → sync commit):
  1. **Preconditions, recorded in the handoff.** (a) Run in the Missions
     checkout, scoped to the two contract files + the real §10 consumer:
     `grep -n "## 10\|§10\|Project profile\|## 0\.\|Merge policy\|WORKFLOW" contract-tests/plugin-contract.test.ts packages/runner/src/plugin-contract.ts`
     (expect no hit), `grep -n "profileRows\|^##" packages/runner/src/connections.ts`
     (the parser's regexes), and `sed -n 20,40p packages/runner/test/connections.test.ts`
     — line 28 asserts `profileRows(TEMPLATE)` still contains `Owner
     channel`, `Remote executor`, `Runtimes`, `Publish policy`: adding
     `Ceremony profile` is safe, renaming any of those four is not. Quote
     all three in the ledger handoff; `contract-tests/fixtures/t01` stream
     hits are noise — ignore them. If the local checkout is missing or
     stale, verify via `gh api repos/xyzhub/missions/contents/<path> --jq .content | base64 -d | grep -n …`
     for each of the three files.
     (b) `wc -c plugins/agentic-workflow/templates/WORKFLOW.md` and the
     per-section awk (`awk '/^## /{if(h)printf "%7d B  %s\n", n, h; h=$0; n=0} {n+=length($0)+1} END{printf "%7d B  %s\n", n, h}'`)
     — quote total + §0/§5/§10/§11 before and after.
  2. **`templates/gate-classes.md`** (new, ≤ 110 lines; L6 2026-10-14 is the
     spec — brief lines 267–311): frontmatter (`status: semi-static`,
     `owner-agent: architect`, `refresh-trigger: event`), the terms line, then:
     - `## Change classes` — `| class | id | covers | irreversible | reviewer
       tier | triage |`, eight rows: `schema-migrations`; `auth` (covers
       sign-in, sessions, tokens, roles, permissions, authorization/tenancy,
       **personal-data stores**); `payments` (incl. money flows); `ci-deploy`;
       `secrets`; `third-party` (external API behaviour, webhooks, vendor
       SDKs — irreversible `no`, the only one); `security-boundary` (ingress
       sanitisation, CSP/CORS, sandboxing, webhook signature checks, **and
       the discipline files: `hooks/`, `tools/`, `templates/`, `hooks.json`,
       `codex.rules`, `.claude/agents`**); `supply-chain` (a lockfile or
       manifest dependency add or bump, install scripts — top tier, triage
       escalates). Tier `top` = schema-migrations, auth, payments,
       security-boundary, supply-chain; triage `escalate` on all eight.
     - `## Action classes` — `| class | id | covers | delegable | irreversible |`,
       nine rows, all irreversible `yes`, triage `n/a` stated in the section
       lead: `production-deploy` (ship, rollback, restart, scale, re-deploy;
       never), `merge-to-default` (a reviewer-APPROVEd PR under §10 Merge
       policy; records-only by path; a direct push is never sanctioned),
       `publish-outward` (only approved + due + organic + `kind: post` under
       the hook's scope; outreach never), `spend` (never),
       `commercial-commitment` (prices, proposals), `outbound-contact` (a
       message to a real person), `destructive-data` (delete/restore/
       overwrite production data; datastore reset), `release-cut` (tag push,
       a version cut that triggers a pipeline), `user-experiment` (never).
       Lead sentence: a gate carrying an action class is `human`-fired and
       can never be `optional` or `skipped`.
     - `## Qualifiers (triage only)` — `not-reproducible`, `size-above-s`,
       `triage: escalate`; never a gate's class.
     - `## Gate-cell grammar` — the SINGLE definition:
       `<id> · human|reviewer|record · <class>[+<class>]*` or `… · none`,
       U+00B7 separators with one space each side, no whitespace variants;
       `+` joins classes with no spaces; `none` on a decision gate (V0/V1)
       is fail-closed under AC-2, never "skippable without an answer".
     - `## Readers` — operate-triage (triage column, change classes only),
       §5 LA-5 reviewer tier, `agents/reviewer.md`, `ceremony.mjs` via the
       fenced `Gate` cells, `hooks/lib/merge-guard.sh` (the irreversible id
       list only, spelled in the script), and "left out on purpose:
       licensing, infra cost, prompts/evals".
     **The file never contains the word `Fable`** — say "top tier".
  3. **Three consumers point at it.** `templates/operate-triage.md` 16–34:
     keep the heading, replace the 8-item list with "the eight change classes
     and two qualifiers in `templates/gate-classes.md` (column `triage`;
     action classes are `n/a` for triage);
     matching any → `loop/escalate`, naming the class id verbatim" + the
     existing code-vs-operational paragraph. `agents/reviewer.md` line 3:
     "risky-change reviews (the classes whose reviewer tier is `top` in
     `templates/gate-classes.md`)"; lines 17–20 point at the file for the
     set. `templates/WORKFLOW.md` 424–428 `fable-boundary` block becomes:
     "Fable is required for any review whose diff touches a class whose
     reviewer tier is `top` in `templates/gate-classes.md` — a two-line diff
     included." Then `tools/lint.mjs` `RULES['fable-boundary'].mechanics` →
     `[/gate-classes/, /reviewer[- ]tier/, /two-line/]` and update
     `tools/lint-test.mjs` fixtures 176–181 so `CANON_CASES` still
     self-detects and the two pre-swap fixtures still read as restatements
     (keep them; add one `gate-classes pointer → pass` case).
  4. **`checkClassListDedup`** in `tools/lint.mjs` (new, after
     `checkRuleDedup`): over `agents/`, `commands/`, `skills/`, `templates/`
     (minus `gate-classes.md`), fail any paragraph (blank-line delimited,
     HTML comments + backticks stripped like `stripInline`) that matches ≥ 4
     of the **change-class** keys `[/schema\/migrations|schema-migrations/i,
     /\bauth\b/i, /\bpayments?\b/i, /ci\/deploy|ci-deploy/i, /\bsecrets?\b/i,
     /third-party/i, /security[- ]boundary/i, /supply[- ]chain/i]` — **action
     names (`deploy`, `merge`, `publish`, `spend`, `release`, …) are never
     keys** (L6: §11's safety-boundary paragraph legitimately names all nine
     actions). Message per J4: "Found an inline list of gate classes in
     `<file>` line N. Link `templates/gate-classes.md` instead." Export the
     pure predicate; add 5 lint-test cases (triage's old 8-item list → fail;
     a restated 4-key change-class list with new wording → fail; §11's
     action list paragraph (WORKFLOW ≈ 1088–1105, verbatim) → pass; the §10
     Merge-policy prose → pass; a 3-key paragraph → pass). Add it to the check list. Run lint;
     fix every hit it finds in the tree (expect: the old reviewer line, the
     old triage list — both already rewritten in step 3; the brief/memos are
     under `docs/` and are not scanned).
  5. **§0 fence + columns** (WORKFLOW 79–87): wrap the table in
     `<!-- stage-table -->` / `<!-- /stage-table -->`; header becomes
     `| Stage | Produces | Artifacts | Gate |` (keep `Produces` prose; the
     old `Exit gate` prose moves into `Gate`'s human-readable tail after the
     grammar cell). `Artifacts` = comma-separated backticked ids/paths (V0
     `docs/product/idea.md`; V1 `docs/product/prd.md, docs/product/ux-brief.md,
     docs/product/decisions/, docs/product/business/`; V2 `.github/workflows/,
     README.md`; V3 `none`; V4 `docs/product/engineering/runbook.md`; V5
     `docs/product/launch/launch-plan.md`; V6 `none`). `Gate` cell starts
     with the grammar `gate-classes.md` defines (`<id> · human|reviewer|record
     · <class>[+<class>]*`, never restated here — the fence comment points at
     the file and adds: "`none` on a decision gate is fail-closed (AC-2), not
     skippable"): `v0-go-no-go · human · none`, `v1-scope-approval · human ·
     none`, `v2-deploy-pipeline · reviewer · ci-deploy`, `v3-mvp-criteria ·
     reviewer · none`, `v4-security-audit · reviewer · security-boundary;
     v4-ux-audit · reviewer · none; v4-dx-audit · reviewer · none;
     v4-efficiency-audit · reviewer · none`, **`v5-launch · human ·
     production-deploy+publish-outward+release-cut`** (L6), `v6-operate ·
     reviewer · none`. Forks rename freely; the parser keys on headers.
  6. **§5 `checkpoint-gates` fence** (insert after the trio table, before
     "Rules:" at 376): a 7-line list in the same grammar for `plan-judge ·
     reviewer · none`, `phase-reviewer · reviewer · none` (note: tier
     escalates by diff class, LA-5), `staging-verify · reviewer · none`,
     `counsel · human · none`, `multi-vote-audit · reviewer ·
     security-boundary`, `chronicler · record · none` (a record beat, not a
     review), **`mission-close · human · release-cut`** (L6).
     Then the new canonical rule, after the `one-next-up`
     block (451): `<!-- rule: ceremony-skip -->` "a gate whose effective
     §10.2 cell is `skipped` writes exactly one ledger Deviations line `gate
     <id> skipped — ceremony (<signal|override YYYY-MM-DD>)` via
     `ceremony.mjs effective <id> --log`; any other cell runs the gate; a
     gate with no §10.2 row runs" `<!-- /rule -->`. Add `'ceremony-skip'` to
     `RULES` with `name: /ceremony-skip|effective .*cell/i`, mechanics
     `[/exactly one/i, /Deviations line/i, /any other cell runs/i, /no §?10\.2 row runs/i]`;
     update the §5 sentence at 453 ("These four rules" → "These five rules").
     Add the canonical self-detect to `CANON_CASES` (automatic — it maps
     `Object.keys(RULES)`; just make sure `CANON` extraction finds it).
  7. **§10 row + 10.2 placeholder** (after the `Issue tracker` row, 1015):
     `| **Ceremony profile** | _(\`absent\` until \`/agentic-workflow:sync\`
     proposes one · \`proposed YYYY-MM-DD\` · \`confirmed YYYY-MM-DD by
     <who> · derived YYYY-MM-DD from N signals · N overrides\` · \`unreadable
     (YYYY-MM-DD)\`; drift appends \`· drift YYYY-MM-DD: <signal> — not
     re-derived\`. Written by \`tools/ceremony.mjs\`; see §10.2)_ |`. After
     §10.1 (before `## 11.`): `### 10.2 Ceremony` + two sentences (derived by
     `ceremony.mjs`, one row per artifact and gate from the §0 `stage-table`
     and §5 `checkpoint-gates` fences; **first-column cells are never bold**
     — Missions' profile parser keys on bold cells) + the empty table header
     `| id | kind | stage | derived | signal | effective |` + `Overrides:`
     list placeholder with the grammar line. Add the three **relation
     lines**: §1 after line 222; §11 after the check-in paragraph (1058);
     `tune-presets.json` top-level `"note"` (a key next to `"presets"`;
     `tunePresetFindings` at `tools/lint.mjs:1027` checks only
     `schema_version`/`classes`/`presets`, so an extra key is tolerated) and
     the same sentence in `commands/tune.md` 213.
  8. **Byte check**: re-measure; quote. Over 116,000 B → trim §6 prose by
     the overage in the same commit, deviation logged.
  9. **`Reviewer runs:` counter** (moved here so it exists before ckpt-p1):
     `templates/mission-state.md` header gains `Reviewer runs: 0` under
     `Sessions used: 0` with one sentence (bumped by the orchestrator at
     every one-shot reviewer spawn, plan-judge included — OQ-4; read at the
     AC-13 obligation). `plugins/agentic-workflow/tools/ledger.mjs` (256;
     usage header 1–30, `VERBS` 45, `sessions()` 155–167, `apply()`
     204–230): verb `reviewer-runs +1 | =N` in `sessions`'s shape, added to
     `VERBS` and the usage header, refusing when the line is absent with
     "add `Reviewer runs: 0` under `Sessions used:`". `tools/ledger-test.mjs`
     (fixture `LEDGER` 27+): add the line + 3 cases (`+1`, `=N`, absent →
     refusal with the file byte-identical). `commands/mission.md` 267–281:
     one sentence naming the bump at every reviewer spawn (≤ 200 B — the
     file is at 21,595 of 24,000 B). Missions' contract regexes
     (`Estimate:` / `Sessions used:` / `Next up:`) are untouched. Add this
     ledger's own `Reviewer runs: 0` line and bump it at ckpt-p1. Commit
     `feat(ledger): Reviewer runs counter`.
  10. **Sync preserve — its own commit, last.** `commands/sync.md` §2 (30–41):
     "**§10 Project profile through the next `## ` heading** — §10, §10.1 and
     §10.2 verbatim, extracted with `awk '/^## 10\. /{p=1} p && /^## / &&
     !/^## 10\. /{p=0} p' docs/WORKFLOW.md`" and the description line 2 →
     "(preserving §10 through 10.2 + Local amendments)". `tools/lint-test.mjs`:
     one case running that exact awk (via `spawnSync('awk', …)`) over a
     fixture string containing `## 10.`, `### 10.1`, `### 10.2`, `## 11.` and
     asserting the output ends with the 10.2 table and excludes `## 11.`.
     Commit message `feat(sync): preserve §10 through the next ## heading`.
  Commit the rest as `feat(ceremony): gate-classes taxonomy, fenced stage/gate
  tables, §10 ceremony row, class-list lint`.
- **Verify**: `node tools/lint.mjs` clean (the WORKFLOW `warn:` line is
  expected; a `fail` is not); `node tools/lint-test.mjs` and
  `node tools/ledger-test.mjs` green with the new cases named in the
  handoff; `grep -c '<!-- rule: ' plugins/agentic-workflow/templates/WORKFLOW.md` = **6**
  (5 today: four fences + the prose mention `<!-- rule: <id> -->` at line
  454; the plain `rule: ` grep counts 6 today and is not the check) and
  `grep -c '^<!-- rule: \|^  <!-- rule: ' …` = 5 fences;
  `grep -n "Fable" templates/gate-classes.md` empty; the Missions grep output
  and both byte measurements quoted in the ledger handoff; `claude
  --plugin-dir plugins/agentic-workflow` loads (staging verify for this
  repo). Pre-merge Closing rows are not yet due (version/record fire in S3).
- **Read budget**: ≈ 980 lines + ≈ 110 lines for the counter
  (`ledger.mjs` whole, `ledger-test.mjs` 1–60 + the `sessions` cases,
  `mission-state.md` 1–35) + brief 261–311 (L5/L6, 50 lines) + WORKFLOW
  1085–1110 (§11 action paragraph, the dedup pass fixture) ≈ 1,165 lines
  read + ≈ 340 lines written (gate-classes.md grew to ≤ 110 under L6).
  Suits: `backend` (markdown + lint/ledger JS; no runtime surface).

**Checkpoint ckpt-p1** ends phase 1 — one-shot `reviewer` on **Fable**
(boundary-class: it rewrites the §5 `fable-boundary` canonical rule and its
detector, adds a §5 rule, and changes the reviewer's own tiering text). It
re-runs lint + lint-test, diff-reviews `main..mission/adaptive-ceremony-p1`,
checks every table/row against the Value sourcing rows (ids, grammar, plain
10.2 cells), and confirms no second class list survives (`node tools/lint.mjs`
+ a manual grep for `auth, schema` phrases). APPROVE → PR to `main`
(`human-merge`); REQUEST CHANGES → one `S1-fix`, then surface.

## Phase 2 — the engine + the guards (branch: `mission/adaptive-ceremony-p2`, cut from `main` after PR p1)

### S2 — `tools/ceremony.mjs` + harness, conform ladder entry, merge-guard regex, `Reviewer runs:` counter

- **ACs**: AC-1, AC-2, AC-3 (fixture), AC-4, AC-5 (resolution + backstop),
  AC-6 (`--log --mission` writer), AC-11, AC-12.
- **Reads** (≈ 1,040 lines; the `ledger.mjs` / `ledger-test.mjs` /
  `mission-state.md` reads moved to S1):
  - memos 51–88 (D2) · 210–236 (D6) · brief 139–167 (six states + table
    example) · brief 229–239 (L3).
  - `templates/WORKFLOW.md` (post-P1): §0 fence (grep `stage-table`, ±5
    lines), §5 fence + `ceremony-skip` rule (grep), §10 row + §10.2 (grep
    `### 10.2`, read to `## 11.`).
  - `templates/gate-classes.md` (whole, ≤ 70).
  - `docs/WORKFLOW.md` §10 of this repo (grep `^## 10\.`, read ≈ 45 rows) —
    the derive dogfood input.
  - `plugins/agentic-workflow/tools/ledger.mjs` whole (256) ·
    `tools/ledger-test.mjs` 1–60 + the `sessions` cases (grep `sessions`).
  - `plugins/agentic-workflow/tools/conform.mjs` 1–80 · 135–160 · 210–230.
  - `plugins/agentic-workflow/hooks/lib/merge-guard.sh` 1–17 · 60–100.
  - `tools/hook-test.mjs` 1575–1660.
  - `tools/lint.mjs` 520–541 (`checkLedgerHarness` as the shape) ·
    1225–1233.
  - `templates/mission-state.md` 1–35 · `commands/mission.md` 267–281.
- **Catalog**: none.
- **Prior art**: `hooks/lib/merge-guard.sh` (`RECRX`, line 81 — an anchored
  §10 row regex on the committed copy) and its hook-test block
  (`tools/hook-test.mjs:1575`) — extend that pattern; `hooks/hooks.json`
  84–90 (the merge-guard entry) is unchanged.
- **Do**:
  1. **`plugins/agentic-workflow/tools/ceremony.mjs`** (new, ≤ 300 lines,
     zero deps, Node ≥ 18, fs only, header comment in `ledger.mjs`'s style):
     - parse: `readFences(workflowText)` → stages/artifacts/gates from the
       `stage-table` (header-keyed: `Stage`, `Artifacts`, `Gate`; `;`-split
       gate cells; grammar `<id> · human|reviewer · <class|none>`) and the
       `checkpoint-gates` list; missing fence/header → `{ unreadable: true,
       why }`. `readProfile(text)` → row state + 10.2 rows + override/ask
       lines. `classOf(id)` joins from the fences (never from 10.2).
     - `derive --root <dir> [--json]` → `{ rows, asks, signals }`: signals
       per D2 (stage = highest stage whose every artifact exists, ask on a
       tie or nothing; deploy = §10 `Deploy + live-verify` ≠ `none`; auth /
       payments / schema probes: paths `auth|login|session|billing|payment|
       stripe|prisma|migrations|schema` under the root ≤ depth 3 + dependency
       names in `package.json`/`pyproject.toml`/`Gemfile`/`go.mod` when
       present — a full hit decides, a partial hit asks, no hit on an
       irreversible-class gate asks (L3), no hit elsewhere → positive
       `none-found` signal only when the gate class is `none`; test/publish/
       merge policy + catalog = §10 cells). Defaults: every artifact and
       gate `required` unless a positive signal says otherwise; a skip needs
       a named positive signal (`Deploy: none`, `no UI surface: no
       *.tsx/*.vue/*.svelte, no app/ dir`, `repo had commits before adopt`).
     - `effective <id> [--log --mission <name>] [--json]` → the cell after
       overrides, asks, refusals and drift tightening;
       `proposed`/`absent`/`unreadable` → `required` (reason stated);
       refusal text per the lock; `--log` REQUIRES `--mission <name>`
       (`ledger.mjs`'s shape: `.plans/<name>.state.md`, `--plans <dir>`
       honoured) and appends the one Deviations line there — idempotent per
       `<id>` per ledger; `--log` without `--mission` is a usage error (exit
       1), never a guess at "the active ledger"; with no ledger the caller
       passes `--mission JOURNEY` to get the line printed for
       `docs/product/JOURNEY.md`.
     - `check [--json] [--brief]` → findings: `absent`, `proposed`,
       `unreadable`, `refused-override <id>`, `drift` (ONE line, count +
       list; irreversible-class drift names the rows it tightened), `token
       mismatch` (the `· class:<id>[+<id>]*` token in `signal` ≠ fence — L5),
       and the two L6 grammar rules — **`action-class gate not human`** (a
       gate cell carrying any of the nine action ids whose firer is
       `reviewer` or `record` → finding, and `effective` = `required`) and
       **`malformed class list`** (a `+` with spaces, a leading/trailing `+`,
       an unknown id, `none` combined with a class → finding; the whole
       table is then treated as `unreadable` for that gate: `required`).
       The id sets come from `gate-classes.md`'s two tables, parsed by the
       `id` column (never hard-coded). Exit 0 always unless `--strict`.
     - rendering: the §10 row cells and the 10.2 table, **plain first-column
       cells**, `signal` ending `· class:<id>` for gate rows (OQ-2 — owner
       ACCEPTED 2026-10-13, lock L5; counsel condition 4 amended). Never
       drop step 4's merge-guard regex (lock L3) and never invent another
       carrier.
     - `--selftest` is NOT the test; the harness is.
  2. **`tools/ceremony-test.mjs`** (new, ≤ 200 lines, `ledger-test.mjs`
     shape): fixtures written into a temp dir — (a) the plugin's own
     template §0/§5 fences + a §10 with `Deploy: none`, no auth/payments/
     schema paths → expect V2 deploy gate `required` (ci-deploy is
     irreversible: no-hit → ask, never skip), UX artifacts `skipped` with the
     positive `no UI surface` signal, `asks` non-empty and ≤ 4; (b) the AC-3
     fixture: a 4-stage table with renamed stages (`Seed, Shape, Ship, Steer`)
     → 4 stage rows, ids from the table, no `v0`..`v6` anywhere; (c) no fence
     → `unreadable`, every `effective` = `required`; (d) an override line
     skipping an irreversible gate → `effective` renders `required (override
     refused: ci-deploy is irreversible)`, and the same for `optional`; (d2)
     L6 grammar: a fence with `v5-launch · reviewer ·
     production-deploy+release-cut` → `check` finding `action-class gate not
     human`, `effective v5-launch` = `required`; a cell `auth + payments`
     (spaces) and a cell `auth+` → finding `malformed class list`, `required`;
     a valid `v5-launch · human · production-deploy+publish-outward+release-cut`
     → no finding and `classOf` returns all three; (d3) an override skipping
     `mission-close` (`release-cut`, an action id) → refused; (e)
     `proposed` row → all `required`; (f) drift: fixture repo gains
     `stripe` in `package.json` after the profile → `check` prints ONE drift
     line and `effective v4-security-audit` = `required`; (g) `--log` writes
     exactly one line, twice-run still one. Wire `checkCeremonyHarness` into
     `tools/lint.mjs` after `checkLedgerHarness`, fail-closed on a missing
     runner, added to the check list.
  3. **Conform ladder**: `tools/conform.mjs` LADDER gains `{ id:
     'ceremony-profile-row', since: '1.61.0', check: … , fix: 'run
     /agentic-workflow:sync — it proposes a ceremony profile; confirm it in §10' }`
     — per OQ-1's recommendation the check imports `check()` from
     `ceremony.mjs` (dynamic `import()` guarded by `existsSync`, fs only) and
     returns the first finding's text, else `true`; if the owner chose
     row-presence only, use `has10('Ceremony profile')`. Keep the hook's
     silence contract (`conform-check.sh` is unchanged).
  4. **Merge-guard backstop** (`hooks/lib/merge-guard.sh`): after the `ROW`
     fetch (72–77) and before the policy branch (81), read the same
     committed text once more into `CER=$(… | sed -n '/^### 10\.2 /,/^## /p')`
     (**sed, not awk** — `tools/hook-test.mjs:47` `BIN_LIST` is `bash sh git
     grep sed head tr cut wc cat mkdir dirname`; awk is absent and the
     `# externals:` line must stay a subset) and `block` when it matches the
     L5/L6 regex — **all 16 irreversible ids spelled inline, change and
     action alike**: `CERRX='^\| *[^|]+ *\| *gate *\|[^|]*\|[^|]*\|[^|]*class:([a-z-]+\+)*(schema-migrations|auth|payments|ci-deploy|secrets|security-boundary|supply-chain|production-deploy|merge-to-default|publish-outward|spend|commercial-commitment|outbound-contact|destructive-data|release-cut|user-experiment)(\+[a-z-]+)*[^|]*\| *(skipped|optional) *\|'`
     (`third-party` alone is the only class that passes); message: "❌
     BLOCKED: §10.2 Ceremony marks an irreversible-class gate `<id>` as
     <cell> — set it back to `required` (an override cannot remove the
     safety boundary; `/agentic-workflow:doctor` explains)". Update the
     header contract comment (rule 3a); `# externals:` unchanged. **If the
     list cannot be made to match in this session, stop and surface (L6) —
     never ship a shorter list.** `tools/hook-test.mjs`: extend
     `wfMerge(cell, ceremony = '')` to append a 10.2 block; add cases —
     skipped `ci-deploy` → BLOCK and gh NOT run; optional `auth` → BLOCK;
     skipped **`supply-chain`** → BLOCK; skipped **`v5-launch` with
     `class:production-deploy+publish-outward+release-cut`** → BLOCK (an
     action id inside a `+` list); optional **`release-cut`** on
     `mission-close` → BLOCK; skipped `third-party` → allowed (records-only
     path continues); a `required (override refused: …)` cell → allowed;
     `class:third-party+auth` skipped → BLOCK (the id anywhere in the list);
     no 10.2 → every existing case unchanged (run the whole block).
  5. Dogfood derive on this repo read-only: `node plugins/agentic-workflow/tools/ceremony.mjs derive --root . --json`
     — quote the row count, the asks, and the signals in the handoff (do
     NOT write to `docs/WORKFLOW.md` here; S3 does the `/sync` write).
  (The `Reviewer runs:` counter moved to S1 step 9 so it exists before
  ckpt-p1.)
  Commits: `feat(ceremony): derive/effective/check tool + harness`,
  `feat(conform): ceremony-profile-row ladder entry`, `feat(merge-guard):
  block an agent merge while §10.2 skips an irreversible-class gate`.
- **Verify**: `node tools/ceremony-test.mjs` green (cases a–g named in the
  handoff); `node tools/hook-test.mjs` green with the merge-guard case count
  before/after quoted (baseline at dc9bf34: **35** `check('merge-guard:`
  lines; expect ≥ 39); `node tools/lint.mjs` clean; the derive dogfood
  output quoted; `claude --plugin-dir plugins/agentic-workflow` loads.
- **Read budget**: ≈ 1,040 lines read (the ledger reads moved to S1) +
  ≈ 500 lines written (tool, harness, guard). The largest brief; if the
  session runs long, step 3 (the conform ladder entry) is the FIRST to leave
  for an `S2-fix`, logged as a deviation — never step 4 (the backstop is an
  L3 condition). Suits: `security`
  (fail-closed resolver + guard regex) with `backend` skills.

**Checkpoint ckpt-p2** ends phase 2 — one-shot `reviewer` on **Fable**
(boundary-class: `merge-guard.sh` and the fail-closed resolver). It re-runs
all four harnesses + lint, diff-reviews `main..mission/adaptive-ceremony-p2`,
and performs the counsel's "what would change their minds" probe by hand: edit
a temp fixture's §10.2 to skip `v2-deploy-pipeline`, confirm `effective`
renders the refusal AND the guard blocks `gh pr merge` via the hook-test
helper. Close the threat, not the diff: look for a second write path to the
`effective` column (hand edit → `check` catches it; the guard reads the
committed copy). APPROVE → PR to `main` (`human-merge`).

## Phase 3 — the readers, the dogfood, the record (branch: `mission/adaptive-ceremony-p3`, cut from `main` after PR p2)

### S3 — commands + agents read the profile; `/sync` on this repo; `checkCeremonyCopies`; CHANGELOG + bump

- **ACs**: AC-7, AC-10 (read points), AC-2 (the batched ask in the
  commands), AC-11 + AC-12 (the `/sync` and `/doctor` prose and the live run
  here), AC-6 (every gate site carries the rule-copy), AC-13 (the obligation
  row is specified in the ledger — not filed into `.plans/OBLIGATIONS.md`
  until close).
- **Reads** (≈ 1,050 lines):
  - brief 169–207 (J1–J6 copy; apply the L3 correction to J2) · memos
    174–206 (D5) · metrics 25–48.
  - `plugins/agentic-workflow/tools/ceremony.mjs` 1–40 (header contract
    only) · `templates/WORKFLOW.md` §5 `ceremony-skip` fence (grep, ±3) ·
    §3 262–275 · §9 901–983 (skim for the tools/hook inventory rows).
  - `commands/bootstrap.md` 25–60 · 74–92 · 160–181 · `commands/adopt.md`
    14–31 · 121–135 · `commands/sync.md` 12–60 · 97–158 · `commands/doctor.md`
    62–92 · 123–126.
  - `commands/mission.md` 95–110 (plan-judge) · 140–215 · 262–290 ·
    `commands/autopilot.md` 45–55 · 98–140 · `commands/verify.md` whole ·
    `commands/counsel.md` whole · `commands/audit.md` whole ·
    `commands/next.md` 11–66 · `agents/intake.md` 25–65 · `commands/tune.md`
    211–226 (only if S1 parked the preset line here).
  - `tools/lint.mjs` 1136–1200 (for the fence/copy scan helpers) ·
    `README.md` (plugin) 180–210 · root `README.md` 30–40 · `CHANGELOG.md`
    1–12 · `docs/WORKFLOW.md` 1–5 + §10 (grep).
- **Catalog**: none.
- **Do**:
  1. **Gate sites carry the rule-copy and call the resolver.** In
     `mission.md` (checkpoint step ≈ 195–215 and the staging/verify step,
     plus plan-judge at 99), `autopilot.md` (V3/V4/V5 bullets 122–140),
     `verify.md`, `counsel.md`, `audit.md`: before running the gate, `node
     ${CLAUDE_PLUGIN_ROOT}/tools/ceremony.mjs effective <gate-id> --log`;
     `skipped` → the line is written, the gate is not run, the report says
     "skipped by the ceremony profile (deviation logged)"; anything else →
     run. One byte-identical `<!-- rule-copy: ceremony-skip -->` block per
     file (copy from §5 verbatim; lint compares after leading-whitespace
     strip). Autopilot's check-in report line per J5. Also `settle.md`
     188–200: `mission-close` is a §5 gate id — carries the copy, resolves
     before the close gate.
  2. **`checkCeremonyCopies`** in `tools/lint.mjs`: collect gate ids from
     both fences in `templates/WORKFLOW.md`; map each to its owning command
     (`plan-judge, phase-reviewer, staging-verify → mission.md`;
     `counsel → counsel.md`; `multi-vote-audit → audit.md`; `chronicler →
     mission.md`; `mission-close → settle.md`; stage gates `→ autopilot.md`)
     — the map is a constant in lint with a comment; fail when an owning
     file lacks the `ceremony-skip` rule-copy or when a fence id has no
     owner (J3 lint copy: "`<id>` is `required`, but `<command>` can pass it
     with no deviation line"). Plus: fail when `tools/ceremony-test.mjs`
     fixture (d) does not render the refusal (import the harness's exported
     expectation or re-run the harness — simplest: assert the string in the
     harness and let `checkCeremonyHarness` carry it; document that in the
     check comment). 2 lint-test cases on the pure owner-map predicate.
  3. **`/next` and intake read points.** `next.md` Decide step 2: "Unmet
     gate for the current stage — a gate or artifact whose §10.2 effective
     cell is `skipped` is not unmet; when the profile changed the answer,
     say so (J5 line)". Inspect step: `node ${CLAUDE_PLUGIN_ROOT}/tools/ceremony.mjs check --brief`
     is one of the fast reads. `intake.md` Classify: the route line names the
     profile's effective gates for the chosen altitude (one line; no table).
  4. **Bootstrap / adopt / sync / doctor prose.** `bootstrap.md` §2: after
     writing §10, run `derive --json`; `asks` → ONE AskUserQuestion per J1
     step 2 (each item states its no-answer outcome); write the row as
     `confirmed <date> by <owner>` at bootstrap (a fresh project; the owner
     just answered) with the table; report line J1 step 4; unreadable →
     J1 step 5. `adopt.md` §1: same, but the row is written `proposed`
     (existing repo; AC-11) and the report carries the J6 "nothing changed
     yet" paragraph; "confirm ceremony profile" flips `proposed` →
     `confirmed <date> by <who>` (the owner's words in chat; the command
     edits the cell — say so). `sync.md`: §3.7 ladder step for
     `ceremony-profile-row` (derive, write `proposed`, J6 wording; an
     existing `confirmed` row is never rewritten — `check` runs instead and
     its drift line goes in the report); the sync report quotes `check`.
     `doctor.md` §2: a `Ceremony profile` bullet — `check` findings as 🟡
     (absent → J6 absent copy; proposed → "full ceremony still applies";
     refused override → J2 corrected copy: "**Override refused: `<id>` is
     `required`.** It carries the gate class `<class>`, an irreversible
     class in `templates/gate-classes.md` — the override has no effect at
     resolution and the merge guard blocks an agent merge while the row
     stands. Set it back to `required`; if the signal is wrong, fix the repo
     and run `/sync`." — **never list the irreversible classes inline**
     (≥ 4 class names in one paragraph trips `checkClassListDedup`; the
     brief's J2 draft does exactly that and must not be copied); drift → J6
     step 2/3 copy, one warning with a count). `fix` mode: no auto re-derive
     (NOT in v1).
  4b. **`commands/mission.md` byte line**: 21,595 of 24,000 B at dc9bf34
     (lint `BUDGETS.command`). Steps 1 and S1's counter sentence together
     must net ≤ 2,000 B; measure with `wc -c` after step 1 and quote it.
     Above 23,000 B, trim the staging/verify step's repeated §12 LA-8
     wording (≈ 235–248) by the overage in the same commit and log a
     deviation. Ceilings never rise.
  5. **Inventories + protocol text.** WORKFLOW §3 hook table row 273
     (conform-check now also names the ceremony row), §9 one sentence
     naming `tools/ceremony.mjs` beside `conform.mjs`; plugin `README.md`
     tools listing (≈ 200–210) + sync row 184; root `README.md` line 36–37
     (`ceremony.mjs`, `gate-classes.md`). Re-measure WORKFLOW bytes; quote.
  5b. **Class-naming copy rule (L6).** Every owner- or agent-facing string
     S3 writes that mentions a class — the doctor refusal, the J4 reviewer
     finding phrasing ("Risky change — class: `<id>` (`gate-classes.md`)"),
     triage escalation comments, the autopilot safety-boundary paragraph
     (§11 ≈ 1088–1105 already names the nine actions in prose: leave it, add
     one pointer "(the action classes in `templates/gate-classes.md`)"), the
     `/next` and intake lines — names at most ONE class id and points at
     `templates/gate-classes.md`; never a list. Run `node tools/lint.mjs`
     after each file; `checkClassListDedup` is the backstop, not the rule.
  6. **Dogfood (OQ-3).** Run the `/agentic-workflow:sync` procedure on this
     repo by hand per the new prose: `docs/WORKFLOW.md` gets the re-copied
     master (stamp → `v1.61.0`), §10 preserved via the awk line, the
     `Ceremony profile` row written `proposed 2026-10-XX` and the 10.2 table
     from `derive`; run `check --brief` and `node plugins/agentic-workflow/tools/conform.mjs`
     → quote both. Confirm `effective plan-judge` = `required (profile
     proposed)`.
  7. **Record.** `CHANGELOG.md` `[1.61.0] — <date>` (Added: gate-classes,
     ceremony tool + harness, §10 row/10.2, fences, conform entry,
     merge-guard backstop, Reviewer runs; Changed: triage/reviewer/LA-5
     point at the taxonomy, sync preserve rule, read points; Deferred:
     AC-13 → OB row, auto re-derive, Missions UI); `plugin.json` → 1.61.0;
     `docs/WORKFLOW.md` line 3 stamp (done by step 6). Fire the pre-merge
     Closing rows with `node plugins/agentic-workflow/tools/ledger.mjs adaptive-ceremony fire "…" "<evidence>"`.
  Commits: `feat(ceremony): gate sites resolve the profile; next/intake read
  points; checkCeremonyCopies`, `feat(ceremony): bootstrap/adopt/sync/doctor
  derive, ask once, propose, warn on drift`, `chore(release): 1.61.0 + sync
  dogfood on this repo`.
- **Verify**: `node tools/lint.mjs` clean (new check live: temporarily
  delete one rule-copy, see it fail, restore); all harnesses green;
  `grep -c "rule-copy: ceremony-skip" plugins/agentic-workflow/commands/*.md`
  = 6 (mission, autopilot, verify, counsel, audit, settle); `docs/WORKFLOW.md`
  §10 shows the `proposed` row and 10.2 table, stamp `v1.61.0`,
  `conform.mjs` reports "matches plugin v1.61.0"; CHANGELOG names 1.61.0;
  `claude --plugin-dir plugins/agentic-workflow` loads; pre-merge Closing rows
  fired on the branch.
- **Read budget**: ≈ 1,050 lines read + ≈ 300 lines of prose edits. Suits:
  `backend` (prose + one lint check + the release chore).

**Checkpoint ckpt-p3** ends phase 3 — one-shot `reviewer` on **Fable**
(boundary-class per the plan-judge: it edits the resolver-call prose at every
gate site, i.e. the paths through which a gate can be skipped). It re-runs lint +
harnesses, diff-reviews `main..mission/adaptive-ceremony-p3`, re-verifies the
pre-merge Closing rows, reads the dogfood `docs/WORKFLOW.md` §10 as a venture
agent would (is "proposed, full ceremony still applies" unambiguous?), and
checks every owner-facing string against the plain-report rule (§6.0).
APPROVE → PR to `main` (`human-merge`); the mission's post-merge rows wait
for `/agentic-workflow:settle` from `chore/adaptive-ceremony-bookkeeping`.

---
_Size every brief to its read budget; split any that can't fit and note the
split. Each session's outcome and any deviation lands in
`.plans/adaptive-ceremony.state.md`, never only in chat._
