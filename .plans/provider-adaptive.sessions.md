---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: provider-adaptive — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the
expensive exploration happened once, here (2026-10-25, main at 999db5f,
plugin v1.69.0)._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/provider-adaptive.md` · Ledger: `.plans/provider-adaptive.state.md`
Source brief: `docs/product/decisions/2026-10-25-provider-adaptive-brief.md` (132 lines — read whole; **L2's recorded probe result** is the one line S1 depends on).
Specs: `docs/product/decisions/2026-10-25-provider-adaptive-memos.md` (626 lines — ranged reads below; D0, D2 (ids), D4 A–D, D6, D7 steps 2–6 are NOT read: L1 struck them).
Copy: `docs/product/decisions/2026-10-25-provider-adaptive-journeys.md` (200 lines — ranged reads in S2; J4 and every probe/offline row are NOT read).

**Path convention.** `<plugin>/` = `plugins/agentic-workflow/` on 999db5f and
`plugins/xyz/` after the xyz-rebrand (L4); command prefix `/agentic-workflow:`
→ `/xyz:` likewise — write whatever prefix the tree carries at S1 start. The
ledger's `Next up:` gate (3) re-measures every anchor below before S1; a drift
> 5 lines on any file is logged as a deviation with the new range.

**Catalog**: none — this repo's §10 **Catalog** row is `none — markdown-only
plugin` (`docs/product/catalog/` does not exist). No catalog reads, no catalog
regeneration in Verify.

**Gates available in this repo** (§10):

| Gate | Command | When |
|---|---|---|
| Test / lint gate (CI `lint.yml`) | `node tools/lint.mjs` | end of S1, end of S2, at the checkpoint — clean on 999db5f apart from the standing `warn:` on WORKFLOW bytes; runs every `tools/*-test.mjs` harness it knows (`tools/lint.mjs:1402`) |
| Models harness (new) | `node tools/models-test.mjs` | after every `models.mjs` / `models.json` / `tune-presets.json` edit |
| Hook harness | `node tools/hook-test.mjs` | after the hooks.json / model-profile.sh edit |
| run-claude / lint-test harnesses | `node tools/run-claude-test.mjs` · `node tools/lint-test.mjs` | after the alias edits in S1 and the RULES edit in S2 |
| Staging verify (§10 Staging = none) | lint green + `claude --plugin-dir <plugin>` loads | at the checkpoint, before the PR is marked ready |

**Facts already probed (do not re-probe):** `node` v24.12. No z.ai key on this
machine; no `ANTHROPIC_BASE_URL` set — fixtures carry the env shapes. `git
rev-parse --git-common-dir` works here (`.git`). `tools/` is zero-dep (header
idiom in `headless.mjs:1–45`; main guard `if (process.argv[1] &&
path.resolve(process.argv[1]) === SELF)`). Base agents have no `model:` except
`analyst`/`chronicler`/`writer` (`model: sonnet`), so under `balanced` every
other role inherits the main session model and the orchestrator passes the
alias on the Agent tool call. `tune-presets.json` carries 135 Claude ids (18
fable, 42 opus, 65 sonnet, 10 haiku; `claude-p` hits are a runtime name) and
`tier_aliases` is read at `preset.mjs:67` and `run-claude.mjs:167,176` only.
Rule-dedup lint keys on the raw word "Fable" (`tools/lint.mjs:1159`).
`hooks.json` SessionStart has three groups (`compact` · `startup|resume` ×2);
the last closes at `:199`. `hook-test.mjs` `runHook({event, desc, input, files,
env, dir, git})` (`:57`) selects a hook by a substring of its `description`.
Budgets: agent 16,000 B · command 24,000 B · skill 6,000 B · WORKFLOW 120,000
B (`lint.mjs:1049–1072`; WORKFLOW is 115,770 B today). Next obligation ids:
**OB-35, OB-36** (`.plans/OBLIGATIONS.md:74` ends at OB-34). `docs/WORKFLOW.md`
is NOT synced in this mission.

Branch: `feat/provider-adaptive` (from `plan/provider-adaptive`, rebased onto
post-rebrand `main` — OQ-3). Two briefs in sequence on one branch, one Fable
checkpoint after S2, one PR to `main`; the human merges. Not parallel.

## Large-files table

| File | Lines | Notes |
|---|---|---|
| `tools/hook-test.mjs` | 2,522 | read 20–60 and 1313–1360 only |
| `CHANGELOG.md` | 1,776 | read 1–12 only |
| `<plugin>/templates/WORKFLOW.md` | 1,431 | 115,770 B; read 410–420, 445–456, 1043 only |
| `docs/WORKFLOW.md` | 1,420 | not read (not synced here) |
| `tools/lint.mjs` | 1,412 | read 519–556, 1073–1135, 1157–1165, 1400–1405 only |
| `docs/product/decisions/2026-10-25-provider-adaptive-memos.md` | 626 | ranged reads only (below) |
| `<plugin>/tools/run-codex.mjs` | 587 | not read |
| `<plugin>/tools/run-claude.mjs` | 458 | read 40–60, 150–200, 236–266 only |
| `tools/run-claude-test.mjs` | 376 | read 1–60 and 244–274 only |
| `<plugin>/README.md` | 363 | read 104–106 only |
| `<plugin>/commands/mission.md` | 350 | read 55–90, 140–160, 188–240 only |
| `tools/lint-test.mjs` | 310 | read 148–190 and 247–275 only |
| `<plugin>/commands/tune.md` | 289 | read 1–40, 80–113, 148–165, 211–275 |
| `<plugin>/commands/connect.md` | 261 | not read (not edited — planner lock) |
| `<plugin>/tools/conform.mjs` | 258 | not read (no rung — L1) |
| `tools/agents-test.mjs` | 252 | read 1–40 only |
| `<plugin>/tools/agents.mjs` | 230 | read 1–30 only |
| `<plugin>/agents/reviewer.md` | 220 | read 14–27, 145–175, 196–210 |
| `<plugin>/hooks/hooks.json` | 215 | read 186–200 only |
| `docs/product/decisions/2026-10-25-provider-adaptive-journeys.md` | 200 | read 1–50, 55–75, 118–135, 160–200 |
| `<plugin>/tools/preset.mjs` | 192 | read 1–130 |
| `<plugin>/commands/doctor.md` | 162 | read 1–5 and 48–62 only |
| `<plugin>/templates/tune-presets.json` | 139 | whole (S1); 1–6 (S2) |
| `docs/product/decisions/2026-10-25-provider-adaptive-brief.md` | 132 | whole |
| `<plugin>/hooks/lib/mission-budget.sh` | 118 | not read |
| `<plugin>/templates/distillate.schema.json` | 109 | not read (not edited — planner lock) |
| `<plugin>/templates/gate-classes.md` | 100 | read 24–39 only |
| `<plugin>/hooks/lib/handoff-lib.sh` | 328 | read 95–112 only (git-dir idiom) |
| `<plugin>/hooks/lib/conform-check.sh` | 45 | whole — the hook contract to copy |
| `docs/product/decisions/2026-10-25-provider-adaptive-metrics.md` | 39 | read 1–12 and 28–39 (S2 only) |
| `.plans/OBLIGATIONS.md` | 74 | read 1–12 and 74 |

## Phase 1 — resolver + data + tests (branch: `feat/provider-adaptive`)

### S1 — J2 snapshot, alias presets, `models.json`, `models.mjs`, SessionStart hook, harnesses

- **ACs**: AC-1, AC-2, AC-3, AC-4, AC-5
- **Suits**: `backend` (one zero-dep Node CLI, one shell hook, two data files,
  three test harness edits). Runtime: `claude` (default; §10 Tune preset is
  `balanced`, no role on codex).
- **Reads** (in this order, ≈ 1,350 lines):
  1. `docs/product/decisions/2026-10-25-provider-adaptive-brief.md` whole (132)
     — L1–L5 and **the L2 probe line** (it sets `zai.alias_remap`); then
     `.plans/provider-adaptive.md` Tasks 1–2 + Value sourcing + Locked
     decisions (≈ 200).
  2. Memos: 49–70 + 96–136 (D1 option A, schema, secrets — reduce per L1),
     200–252 (D2b), 255–275 (D3 signals + option A), 314–323 (where it runs;
     use only the hook + `resolve` parts), 584–602 (D4 note), 604–626
     (counsel) ≈ 215.
  3. `<plugin>/templates/tune-presets.json` whole (139) — the 135 ids to
     rewrite, `models`/`tier_aliases` at 5–6, `fallback` rows, `tick_budget`
     at 89.
  4. `<plugin>/tools/preset.mjs` 1–130 (`baseCell` 63–69, `cellDiffers`,
     `renderShadow` 75–85, `apply` 90–130).
  5. `<plugin>/tools/run-claude.mjs` 40–60 (imports, `DEFAULTS`), 150–200
     (`presetRow`, `resolveRun` 164–194), 236–266 (`--model` at 241,
     `childEnv`).
  6. `tools/lint.mjs` 1073–1135 (`tunePresetFindings` + `checkTunePresets`),
     519–556 (`checkHeadlessHarness`/`checkBrowseHarness` — copy for
     `checkModelsHarness`), 1400–1405 (the check array).
     `tools/lint-test.mjs` 247–275 (`PRESET_CASES` P0–P9).
  7. `<plugin>/hooks/lib/conform-check.sh` whole (45) — the contract to copy;
     `<plugin>/hooks/hooks.json` 186–200 (the group shape + where the new
     group goes); `<plugin>/hooks/lib/handoff-lib.sh` 95–112 (git-dir + XDG
     idiom).
  8. `tools/hook-test.mjs` 20–60 (`hookCommand`, `runHook` signature incl.
     `env`, `files`, `git`) and 1313–1360 (the conform-check block — copy its
     shape for the model-profile block).
  9. `tools/run-claude-test.mjs` 1–60 (shim, `ok`, `group`) and 244–274
     (`resolution` group — the alias cases change here); `tools/agents-test.mjs`
     1–40 (harness header style for `models-test.mjs`); `<plugin>/tools/agents.mjs`
     1–30 (registry shape `/doctor` Overrides will read).
  10. `ls <plugin>/agents/` (20 names — the `role_defaults` key set; never
      read the files).
- **Prior art**: `conform-check.sh` + `hooks.json:190–199` — the SessionStart
  advisory contract (startup|resume, child-silent, jq-built, exit 0);
  `handoff-lib.sh:96–111` — private state under the git dir, 0700/0600, never
  tracked; `preset.mjs`/`run-claude.mjs` — the only two readers of
  `tier_aliases`; `lint.mjs:1073–1135` — the data-file validator shape to copy
  for `checkModelsTable`. Permission gates: `tools/shell-wrappers.mjs`,
  `templates/codex.rules`, `hooks/hooks.json` — this brief adds NO `Bash(...)`
  rule and no execpolicy line (planner lock); the new hooks.json entry is an
  advisory, never a refusal.
- **Do** (commit order matters — AC-2):
  1. **Commit 1 — the J2 snapshot, from the UNCHANGED tree.** A one-off
     script (run from `/private/tmp/…/scratchpad`, not committed) reads
     `<plugin>/templates/tune-presets.json` and writes
     `<plugin>/tools/fixtures/model-resolution/anthropic-v1.json`:
     `{ "captured_from": "<git rev-parse HEAD>", "captured_at": "<date>",
     "presets": { "<preset>": { "<agent>": { "model", "effort", "runtime":
     "<row.runtime || 'claude'>", "maxTurns": <row.maxTurns ?? null>,
     "compact_window": <row.compact_window ?? null>, "fallback_model":
     "<row.fallback?.model ?? null>" } } } }` — 100 cells, keys sorted, 2-space
     JSON, trailing newline. Commit it alone:
     `test(models): J2 snapshot of Anthropic preset resolution before the alias change`.
  2. **`<plugin>/templates/models.json` (new)** per master plan AC-3.
     `zai.alias_remap` from the brief's L2 line (`{ "fable": "opus" }` unless
     the probe showed `fable` mapping). `updated` = today. Keep it ≤ 4 KB,
     keys sorted within each block, `role_defaults` listing all 20 roles in
     `ls agents/` order.
  3. **`<plugin>/templates/tune-presets.json`**: replace every
     `"claude-fable-5-1"`→`"fable"`, `"claude-opus-5-5"`→`"opus"`,
     `"claude-sonnet-5-5"`→`"sonnet"`, `"claude-haiku-5-5"`→`"haiku"` (135 +
     the `fallback.model` values); line 5 `"models"` → `"aliases":
     ["fable","opus","sonnet","haiku"]`; delete line 6 `tier_aliases`;
     description: "Rows per agent; model ALIASES (fable/opus/sonnet/haiku) —
     the provider resolves them (templates/models.json, tools/models.mjs). …
     The plan-judge runs on the top tier under every preset …". Grep
     `claude-` afterwards: the only hits are the 28 `claude-p` runtime tokens.
  4. **`<plugin>/tools/preset.mjs`**: `baseCell(baseText, balancedRow)` — drop
     the aliases parameter and the `/^claude-/` branch (base `model:` is an
     alias or `inherit`); update the one call at `:110`; header comment line
     13–14 says "model alias"; `show` (`:158`) unchanged. **`<plugin>/tools/run-claude.mjs`**:
     delete the `aliases` read (`:166–167`) and the mapping at `:176`; header
     `--model <id>` → `--model <alias|id>`; the Haiku 100k rule stays keyed on
     `compact_window` (data), not the model string. Nothing else moves.
  5. **`tools/lint.mjs`**: `PRESET_MODELS = new Set(['fable','opus','sonnet','haiku'])`,
     `PRESET_HAIKU = 'haiku'`, messages say "alias"; add
     `checkModelsTable()` (pure `modelsTableFindings(json, agentNames,
     presetsJson)` + gate wrapper) right after `checkTunePresets`: the AC-3
     rules incl. `anthropic.role_defaults[a] === presets.balanced.agents[a].model`
     for every agent; add `checkModelsHarness()` (copy of 537–551, runner
     `tools/models-test.mjs`, message "models harness"); wire both into the
     array at `:1402` (harness after `checkBrowseHarness`, table after
     `checkTunePresets`). Export `modelsTableFindings`.
     **`tools/lint-test.mjs`**: P1 (`:258–259`) mutates to `'claude-opus-9-9'`
     → keep the value but the expected finding text becomes `unknown model
     alias "claude-opus-9-9"`; add M-cases importing `modelsTableFindings`:
     M0 real file → 0; M1 drop `zai.role_defaults.curator` → names `curator`;
     M2 set `anthropic.role_defaults.reviewer = 'opus'` → names the balanced
     mismatch; M3 add an unknown alias → finding. Include them in the run loop
     and the total (`:298`, `:304`).
  6. **`<plugin>/tools/models.mjs` (new, ~350 lines)** per master plan AC-4.
     Exports: `detectProvider(env, table) → {provider, label, host, envNames,
     defaults:{fable,opus,sonnet,haiku}}`, `resolveAlias(alias, det, table) →
     {alias, model, source}`, `buildProfile(det, table) → profile`,
     `fingerprint(det, table)`, `profilePath({cwd, env}) → {path, inRepo}`,
     `writeProfileAtomic(path, profile)`, `report(prev, next, shadows) →
     string[]` (≤ 3 lines, exact copy in the master plan AC-4; empty array
     when nothing changed or anthropic first run), `tableFor(presetsJson,
     table, det, presetName)` (the J2 shape), `doctorBlock(profile, registry)`.
     Secrets rule in code: presence via `name in env`; VALUES read only for
     the four `ANTHROPIC_DEFAULT_*_MODEL` names (one constant array; a test
     asserts no other `env[...]` value is read by stubbing `env` with a Proxy
     that throws on any other key). `detect --brief` prints the report lines
     joined by `\n` or nothing; `--json` prints the profile. `--project <dir>`
     resolves the git common dir from there (the hook-test uses it). Shadows
     scan (for the "Kept your /tune overrides" clause): read
     `<project>/.claude/agents/*.md` frontmatter `model:`; a `/^claude-/`
     value on a non-anthropic provider is "not served". Exit 0 always for
     `detect`; `resolve` exits 2 on an unknown alias.
  7. **`<plugin>/hooks/lib/model-profile.sh` (new)** per AC-5 — header
     comment copies the conform-check contract wording; body:
     `INPUT=$(cat)`, source gate `startup|resume|""`, child gate, node + script
     present, `OUT=$(node "$CLAUDE_PLUGIN_ROOT/tools/models.mjs" detect --brief 2>/dev/null)`,
     empty → exit 0, else `jq -n --arg m "$OUT" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$m}}'`;
     exit 0 on every path. **`<plugin>/hooks/hooks.json`**: a fourth group
     after `:199` — `"matcher": "startup|resume"`, command `bash
     "${CLAUDE_PLUGIN_ROOT}/hooks/lib/model-profile.sh"`, `"timeout": 5`,
     description beginning `model-profile advisory (SessionStart, matcher
     startup|resume — never compact): env-only provider detection …` and
     naming: no network, names not values, git-common-dir path, 0600, silent
     when unchanged or on Anthropic's first run, child-silent, exit 0.
  8. **`tools/models-test.mjs` (new, ~220 lines, `agents-test.mjs` style)**:
     J2 — `tableFor` over the five presets under an anthropic env equals the
     snapshot byte-for-byte (`JSON.stringify` with sorted keys); flip one
     alias in a cloned presets object → inequality; `anthropic.role_defaults`
     ≡ balanced; zai env (`ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic`,
     `ANTHROPIC_AUTH_TOKEN=sk-test-SECRET-xyz`, `ANTHROPIC_DEFAULT_OPUS_MODEL=glm-x-build`,
     `…SONNET…=glm-x-mid`, `…HAIKU…=glm-x-floor`) → provider `zai`,
     `resolveAlias('fable')` → `{alias:'opus', model:'glm-x-build',
     source:'remap'}` (or per the L2 line), `same_model_review === true`,
     `skipped` has both knobs, `JSON.stringify(profile)` contains
     `ANTHROPIC_AUTH_TOKEN` and not `SECRET`; the Proxy-env case (no value
     read outside the four names); fingerprint stable across key-value change
     and changed on host change; `report()` for first-zai = 3 lines with `🧭`
     only on line 1, for anthropic-first = 0 lines, for switch = starts
     `🧭 Provider changed from Anthropic to z.ai (GLM)`, for unsupported host
     = the `not recognised` line; `writeProfileAtomic` into a `mkdtempSync`
     dir → mode 0600, dir 0700, no `.tmp-` leftover; a second `detect` with
     the same env → no write (mtime equal) and empty output; CLI smoke: `node
     models.mjs detect --json --project <tmp git repo>` exits 0 and the file
     lands under `<tmp>/.git/agentic-workflow/`. Print `models harness: clean
     — N case(s)` / exit 1 on failure, like the others.
     **`tools/hook-test.mjs`**: the `model-profile` block after `:1360` per
     master plan AC-5 (6 cases; `env` override carries the fixture vars; `git:
     true` so a `.git` exists; assert the profile path via `git rev-parse
     --git-common-dir` inside the temp dir).
     **`tools/run-claude-test.mjs`** `resolution` group (`:244–274`): the case
     that expected `tier_aliases` mapping now expects the alias passed through
     (`--model sonnet` stays `sonnet`); add one case: `--model fable` →
     `r.model === 'fable'`.
  9. Commit the rest as `feat(models): alias presets, provider profile,
     SessionStart report (S1)` ending with the §10 Attribution line. Do not
     touch `.plans/`, `docs/WORKFLOW.md`, any `commands/*.md`, `agents/*.md`
     or `templates/WORKFLOW.md` (S2 owns the surfaces). Never write the real
     repo's profile from a test; never read a key value.
- **Verify**:
  - `git log --oneline -3` shows the snapshot commit BEFORE the alias commit;
    `git show <snapshot sha> --stat` lists only the fixture.
  - `node tools/models-test.mjs` exits 0 — report the case count (≥ 25) and
    name the J2 byte-equality case and the Proxy-env (no-secret-read) case.
  - `node tools/hook-test.mjs` exits 0 — report the 6 model-profile case names
    and that `SECRET` appears in no output/profile.
  - `node tools/lint-test.mjs` and `node tools/run-claude-test.mjs` exit 0.
  - `node tools/lint.mjs` → `lint: clean` (WORKFLOW `warn:` allowed).
  - `grep -c 'claude-' <plugin>/templates/tune-presets.json` → 28, all
    `claude-p`; `grep -c '"fable"\|"opus"\|"sonnet"\|"haiku"' …` ≥ 135.
  - `node <plugin>/tools/models.mjs detect --brief` in this repo (anthropic,
    no base URL) prints nothing and writes
    `$(git rev-parse --git-common-dir)/agentic-workflow/model-profile.json`
    with mode 0600 and `"provider": "anthropic"`; a second run prints nothing
    and leaves the mtime; `git status --porcelain | grep -c model-profile` → 0.
  - `time node <plugin>/tools/models.mjs detect --brief` < 300 ms.
  - `ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic ANTHROPIC_AUTH_TOKEN=x
    ANTHROPIC_DEFAULT_OPUS_MODEL=glm-a node <plugin>/tools/models.mjs detect
    --brief --project <tmp repo>` prints exactly 3 lines, line 1 starts `🧭`.
  - Catalog: none, nothing to regenerate.
- **Read budget**: ≈ 1,350 lines (brief 132 · plan 200 · memos 215 · presets
  139 · preset.mjs 130 · run-claude 80 · lint 110 · lint-test 29 · hook
  contract 78 · hook-test 90 · run-claude-test 90 · agents-test 40 · agents.mjs
  30) — inside the 1,500-line budget. Order of work if time runs short:
  snapshot → presets + readers + lint green → `models.json` + `models.mjs` +
  `models-test` → hook + hook-test. If the hook cannot be made green inside the
  session, stop with `models.mjs` green and the hooks.json entry NOT added,
  report it, and let the orchestrator book a corrective — never a red harness.

## Phase 2 — surfaces + docs + release (branch: `feat/provider-adaptive`)

### S2 — same-model label + opt-in second pass, "Fable" → "top tier", `/doctor`, `/tune`, CHANGELOG + version, OB rows

- **ACs**: AC-6, AC-7, AC-8, AC-9, AC-10, AC-11
- **Suits**: `backend` (markdown surfaces over a CLI it did not write; one
  lint regex; release files). Runtime: `claude` (default).
- **Reads** (in this order, ≈ 950 lines):
  1. `docs/product/decisions/2026-10-25-provider-adaptive-brief.md` 1–60 +
     100–132 (problem, criteria, L1–L5) ≈ 90; `.plans/provider-adaptive.md`
     Tasks 3–4 + Value sourcing rows AC-6..AC-11 + Locked decisions ≈ 130.
  2. Journeys 1–50 (vocabulary, output rules), 55–75 (J1 rows — copy source),
     118–135 (J3 rows), 160–200 (`/doctor`, `/tune`, reviewer touchpoints) ≈
     130. Metrics 1–12 and 28–39 (the live-run fields for the OB rows) ≈ 25.
  3. Memos 410–452 (D5 — the line list and the same-model mechanics), 584–602
     (D4 note) ≈ 62.
  4. `node <plugin>/tools/models.mjs --help` output and `<plugin>/tools/models.mjs`
     1–60 (header: subcommands, flags, the exact report/doctor strings) ≈ 60;
     `node <plugin>/tools/models.mjs doctor` output in this repo (the block
     `/doctor` will print).
  5. `<plugin>/commands/mission.md` 55–90 (rules 5–7), 140–160 (step 2
     runtime routing), 188–240 (reviewer-tier paragraph, §3 checkpoint,
     reviewer spawn at 225) ≈ 110.
  6. `<plugin>/agents/reviewer.md` 14–27 (tier section), 145–175 (Output),
     196–210 (plan-judge checklist) ≈ 60; `<plugin>/agents/planner.md` 116–120.
  7. `<plugin>/commands/tune.md` 1–40 (frontmatter, table), 80–113 (`<model>`
     + codex sections), 148–165 (boundary-escalation — the verb to mirror),
     211–275 (preset section) ≈ 140.
  8. `<plugin>/commands/doctor.md` 1–5 (frontmatter) and 48–62 (Runtimes
     bullet — the new Models bullet goes directly after) ≈ 20.
  9. `<plugin>/templates/WORKFLOW.md` 410–420, 445–456, 1043 (Runtimes row)
     ≈ 25; `<plugin>/templates/gate-classes.md` 24–39 (table + the `top`
     sentence at 37–38) ≈ 16.
  10. `tools/lint.mjs` 1157–1165 (`RULES['fable-boundary']`);
      `tools/lint-test.mjs` 148–190 (pre-swap fixtures + RULE_CASES) ≈ 52.
  11. `<plugin>/templates/tune-presets.json` 1–6 (description); `CHANGELOG.md`
      1–12; `<plugin>/.claude-plugin/plugin.json` (11); `<plugin>/package.json`
      (12); `<plugin>/README.md` 104–106; `.plans/OBLIGATIONS.md` 1–12 and 74
      (row format); `<plugin>/hooks/hooks.json` the model-profile group (≈ 10,
      for the CHANGELOG wording) ≈ 60.
- **Prior art**: `tune.md:148–165` — the reviewer-only frontmatter switch
  (`boundary_escalation`) the second-pass verb mirrors; `doctor.md:48–62` —
  the Runtimes bullet shape; `lint.mjs:1157` — the dedup rule whose name regex
  must widen with the wording. Permission gates: none touched — no
  `Bash(...)` rule, no execpolicy line, no refusing hook (planner lock).
- **Do**:
  1. **Same-model review (AC-6)**. `commands/mission.md`: after `:225`
     ("Resolve `phase-reviewer`, then spawn…") insert one paragraph: compute
     `review_mode` via `node ${CLAUDE_PLUGIN_ROOT}/tools/models.mjs resolve
     fable --json` (the reviewer's alias, or the tune's) vs the builder's model
     (distillate `runtime.model` when a child ran; else `resolve <builder
     alias>`); equal → `review_mode: same-model` in the reviewer brief,
     `(same-model review)` on the ledger handoff line and the checkpoint row;
     with `same_model_second_pass: on` in `.claude/agents/reviewer.md` AND a
     `top`-tier class in the diff → one more fresh-context reviewer spawn
     framed "assume one defect exists; find it" before APPROVE counts (bump
     `Reviewer runs:` for it). Default off: label only. `agents/reviewer.md`
     Output (`:145–147`): add the first-line rule with the exact three strings
     from the master plan AC-6. `commands/tune.md`: new section after `:165`
     `## /agentic-workflow:tune reviewer second-pass on|off` (reviewer only;
     writes `same_model_second_pass: on|off`; banner kind `second-pass`;
     default off = L3; one sentence on cost); add it to `argument-hint` (`:3`)
     and the table (`:16–40`).
  2. **"Fable" → "the top tier" (AC-7)** at exactly: `mission.md:79–83`,
     `:196–201`; `reviewer.md:20–21`, `:205–206`; `planner.md:118`;
     `tune.md:93`, `:109`, `:153`; `templates/WORKFLOW.md:416`, `:450`;
     `gate-classes.md:37–38`; `tune-presets.json:3`. Wording per master plan
     AC-7; keep the `<!-- rule: fable-boundary -->` fence id. Leave
     `mission.md:61` and `WORKFLOW.md:520` (anecdotes). `tools/lint.mjs:1159`
     `name: /top tier|Fable/`; `tools/lint-test.mjs` add one RULE case: the
     rewritten canonical paragraph (paste it) → `ruleRestatement(...) === true`.
     `templates/WORKFLOW.md:1043` Runtimes row: append the one clause from
     the master plan (≤ 300 B); keep `${CLAUDE_PLUGIN_ROOT}` braced.
  3. **`/doctor` Models block (AC-8)**: `doctor.md` — argument-hint
     `[fix | --refresh]`; new §1 bullet after the Runtimes bullet (`:62`):
     "**Models** (model profile) — run `node ${CLAUDE_PLUGIN_ROOT}/tools/models.mjs
     doctor` and print its block verbatim …" with the 🟡/🔴 rules from the
     master plan and the `--refresh` path (`detect --refresh` first, then the
     block). Keep `doctor.md` ≤ 24,000 B.
  4. **`/tune` (AC-9)**: `tune.md:82–83` accept `fable`; add the profile line
     and the refusal rule (master plan AC-9 strings); `:213–215` "pinned ids"
     → "aliases (fable/opus/sonnet/haiku), resolved by the provider's model
     profile"; `:220–222` comparator sentence drops `tier_aliases`;
     `:240–241` "`model: <alias>`"; Apply step 5 gains the "now picks aliases"
     line. Keep `tune.md` ≤ 24,000 B.
  5. **README `:104–106`**: one sentence — "Aliases resolve through a local,
     untracked model profile (`tools/models.mjs`), so a z.ai (GLM) user needs
     no `/tune`; `/agentic-workflow:doctor` shows it."
  6. **Release (AC-10)**: version = `plugin.json` current + 0.1.0 (OQ-1:
     `2.1.0` post-rebrand) in `plugin.json` and `package.json`; CHANGELOG
     `## [<version>] — <date>` under `[Unreleased]` with the Added/Changed/
     Deferred bullets named in the master plan AC-10, plus the Bedrock/Vertex
     var-name check result (Value sourcing row) in one clause.
  7. `node tools/lint.mjs` clean; `node tools/lint-test.mjs` green.
  8. **Fire the pre-merge Closing rows** by evidence (the orchestrator ticks
     them): version bumped + stamped; docs/record synced; J2 snapshot
     committed first.
  9. **AC-11 → OB rows**: report these two row texts for the orchestrator to
     append (the builder never edits `.plans/`):
     `- [ ] OB-35 · added <date> (promoted from `.plans/provider-adaptive.state.md` `## Closing` row "live-verify GLM-only", planner, 2026-10-25) — do: on a machine whose Claude Code points at z.ai (`ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN`, no Claude login), after `/plugin update` + `/reload-plugins`, start a session (expect ≤ 3 `🧭` lines naming z.ai (GLM) and the mapped ids) and run one 1-session mission end to end; record: `/tune` calls (must be 0), Claude model ids requested in the transcript and `.claude/agents/` (must be 0), the session-start text, reviewer verdicts and whether each was labelled "same-model review", correctives per brief, sessions used vs estimate, tool-call success rate, wall time; grep the profile, ledger and transcript for the key value (must be 0 hits) — when: the provider-adaptive version is installed from `main` and a z.ai key exists — probe: manual`
     `- [ ] OB-36 · added <date> (promoted from `.plans/provider-adaptive.state.md` `## Closing` row "live-verify provider switch", planner, 2026-10-25) — do: on one machine switch Anthropic → z.ai → Anthropic across three session starts; confirm the J3 line fires exactly once per switch with the right labels, the profile under `$(git rev-parse --git-common-dir)/agentic-workflow/` is rewritten (mtime, fingerprint) and holds no key value, the no-change restart prints nothing, and `/agentic-workflow:doctor --refresh` prints `Models unchanged.` — when: the provider-adaptive version is installed from `main` and a z.ai key exists — probe: manual`
  10. Commit as `feat(models): same-model label, tier wording, doctor/tune
      surfaces, release <version> (S2)` with the §10 Attribution line; push;
      the orchestrator spawns `ckpt-s2`. Do not touch `.plans/` or
      `docs/WORKFLOW.md`.
- **Verify**:
  - `grep -rn "Fable" <plugin>/commands <plugin>/agents <plugin>/templates
    --include=*.md --include=*.json` → only `mission.md:61` and
    `templates/WORKFLOW.md:520` (anecdotes) and the `fable-boundary` fence id;
    `grep -c "top tier" <plugin>/templates/WORKFLOW.md` ≥ 2.
  - `node tools/lint.mjs` → `lint: clean` (the rule-dedup check still finds
    the canonical block: no `fable-boundary` finding); `node tools/lint-test.mjs`
    reports the new RULE case `ok`.
  - `wc -c` for `templates/WORKFLOW.md` (≤ 120,000), `commands/tune.md`,
    `commands/doctor.md` (≤ 24,000 each), `agents/reviewer.md` (≤ 16,000) —
    report the numbers.
  - `grep -n '"version"' <plugin>/.claude-plugin/plugin.json <plugin>/package.json`
    equal and matching the CHANGELOG heading.
  - `node <plugin>/tools/models.mjs doctor` in this repo prints the block the
    doctor bullet describes (provider Anthropic, Overrides: none, Keys: names
    only) — paste it in the hand-off.
  - `claude --plugin-dir <plugin>` loads; `/agentic-workflow:doctor` shows the
    Models block (or report skipped with the reason — never green when not run).
  - Catalog: none, nothing to regenerate.
- **Read budget**: ≈ 950 lines (brief/plan 220 · journeys/metrics 155 · memos
  62 · models.mjs 60 · mission 110 · reviewer/planner 65 · tune 140 · doctor
  20 · WORKFLOW/gate-classes 41 · lint/lint-test 52 · release files 60) —
  inside the budget. Order if time runs short: AC-6 + AC-7 (lint-sensitive)
  first, then doctor/tune, then README/CHANGELOG/version.

**Checkpoint ckpt-s2** — one-shot `reviewer` on **Fable** (boundary-class:
`hooks/` + `tools/` + `templates/` are `security-boundary`,
`templates/gate-classes.md:32`), fresh context, re-runs `node tools/lint.mjs`
(every harness) and reads `node <plugin>/tools/models.mjs doctor`,
diff-reviews `main..HEAD` against AC-1..AC-11 with this red-team list: any env
VALUE other than the four `ANTHROPIC_DEFAULT_*_MODEL` ids reaching the profile,
stdout, additionalContext or a test log (the fixture secret `SECRET` is the
canary); a profile path inside the work tree or a tracked file; a non-atomic
write or a leftover `.tmp-`; a hook path that can exit non-zero or print on an
unchanged fingerprint or on Anthropic's first run; any Claude model id left in
`tune-presets.json` or newly written into a shadow; a `.claude/agents/` shadow
rewritten (L1 forbids); the J2 snapshot commit not preceding the alias commit;
`anthropic.role_defaults` drifting from `balanced`; the rule-dedup lint no
longer finding the `fable-boundary` canonical block; a second pass that runs
when the switch is absent; any new `Bash(...)` rule; a `/tune` path that writes
after printing "Refused" — plus a plain-report read of every owner-facing string
(the 3-line reports, the doctor block, the tune lines). APPROVE → staging
verify (lint + `--plugin-dir` load) → PR to `main` marked ready; the human
merges (L5).

---
_Each session's outcome and any deviation lands in
`.plans/provider-adaptive.state.md`, never only in chat._
