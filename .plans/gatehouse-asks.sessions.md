---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: gatehouse-asks — session briefs

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/gatehouse-asks.md` · Ledger: `.plans/gatehouse-asks.state.md`

All paths below are relative to the repo root; `P` = `plugins/agentic-workflow`.

## Large-files table

| File | Lines |
|---|---|
| `P/commands/tune.md` | 79 |
| `P/commands/mission.md` | 304 |
| `P/commands/connect.md` | 242 |
| `P/commands/doctor.md` | 114 |
| `P/agents/reviewer.md` | 213 |
| `P/tools/run-codex.mjs` | 487 |
| `P/templates/WORKFLOW.md` | 1304 |
| `P/templates/distillate.schema.json` | ~80 |
| `P/README.md` | 319 |
| `tools/lint.mjs` | 904 |
| `tools/run-codex-test.mjs` | 592 |
| `CHANGELOG.md` | 1159 |
| `README.md` | ~60 |
| `.claude/agents/backend.md` (example tuned shadow) | ~230 |

## Phase 1 — Gatehouse asks #91–#96 (branch: `mission/gatehouse-asks`, already cut from main @ eaac7fe)

### S1 — all six asks + release (main-session / general-purpose builder, Opus 4.8)

Order of work: #95 → #93 → #92 → #94 → #91 → #96 → release hygiene. Commit
per issue (`feat(tune): … (#92)`, `fix(run-codex): … (#95)`, …).

- **Reads** (~620 lines; nothing else — do not explore):
  - `P/commands/tune.md` (79, whole).
  - `P/commands/mission.md` 75–82 (§0 rule 7), 124–176 (step 2 runtime
    resolution + "Reviewer tier survives the runtime switch"), 177–241 (step 3
    checkpoint — where gates run; anchor `## 3. Checkpoint`).
  - `P/agents/reviewer.md` 1–6 (frontmatter) and 16–30 (`## Model tier keys on
    RISK CLASS`).
  - `P/tools/run-codex.mjs` 39–60 (`PLUGIN_ROOT`, `NETWORK_ROLES`, USAGE),
    79–125 (`parseArgs`, `stripFrontmatter`, `frontmatterValue`, `roleFile`,
    `toolsOf`), 145–158 (`namedSkills`), 186–218 (`assemblePrompt`,
    `deriveFlags`), 365–400 (`EMPTY`, `writeOut`, `main` head), 440–480
    (distillate merge + `writeOut` on the done and failed paths).
  - `P/templates/distillate.schema.json` anchor `"deviations"` ±5 (array of
    strings — no schema change needed).
  - `tools/run-codex-test.mjs` 1–60 (header + fixture setup) and the first
    adapter case (grep `CODEX_BIN` / `function case` or the first `check(`;
    ~40 lines) — for test style and the fake-codex shim.
  - `tools/lint.mjs` 423–440 (`checkCatalogSelftest`, the self-test pattern),
    482–505 (`checkRunCodexHarness`), 894 (the check array — register the new
    check here), 167–177 (`checkTemplateRefs`: every `templates/<file>`
    mention must exist).
  - `P/commands/connect.md` 1–8 (frontmatter), 26–31 (server-mode dispatch),
    122–172 (`## Remote work server`).
  - `P/commands/doctor.md` 34–38 (Remote executor probe).
  - `P/templates/WORKFLOW.md` 410–425 (LA-5 + the Fable risk-class sentence),
    877–883 (§9 "Model tuning" bullet), 955–958 (§10 **Remote executor** +
    **Runtimes** rows), 865–877 (§9 role list — source for `phase` names).
  - `.claude/agents/backend.md` 1–11 (a real tuned shadow: frontmatter + the
    pre-1.54 banner the new regexes must still match).
  - `P/README.md` 100–116 and 167 (`/tune` row); `README.md` 30–46.
  - `CHANGELOG.md` 1–31 (header, `[Unreleased]`, the 1.53.2 entry for style);
    `P/.claude-plugin/plugin.json` (whole, 12 lines).
- **Catalog**: none (§10 Catalog row: markdown plugin, no catalog).
- **Do** (the master plan's tasks 1–7; locked decisions apply verbatim):
  0. **Plan-judge additions (2026-10-07):** in Do 4 also widen `commands/mission.md` ~line 138 `[--effort <low|medium|high>]` to `…|xhigh|max`; in the #95 tests add a DIRECT unit assertion that `resolveSkills` puts `../etc` and `Foo` under `missing` with `reason: 'invalid name'` and leaves `found` empty.
  1. **#95** in `run-codex.mjs`: add `parseSkillsList(roleText)` (inline
     `[a, b]`, `a, b`, YAML `- a` forms) and exported `resolveSkills(roleText,
     cwd, home = process.env.HOME)` → `{ found: [{name, file, origin:
     project|personal|plugin}], missing: [{name, reason: 'invalid name' |
     'not found'}] }`; regex check before any `path.join`; `agentic-workflow:`
     prefix → plugin dir only, other prefixes → invalid. In `assemblePrompt`
     push `# Skill: <name> (preloaded — listed in skills:)` blocks after the
     `namedSkills` loop, skipping names already inlined; stash
     `missing` on the returned value (make `assemblePrompt` return `{ prompt,
     missingSkills }` and update its two callers in `main`, or add a module-
     level collector — pick the former). In `main`, append `skill "<name>"
     listed in skills: not found (searched project, personal, plugin)` /
     `… invalid name` to `d.deviations` on BOTH `writeOut` paths. Widen
     `--effort` in `parseArgs`/USAGE to `low|medium|high|xhigh|max`
     (pass-through). Tests in `tools/run-codex-test.mjs` (same fixture style,
     set `HOME` to a tmp dir for the spawn): project skill inlined; personal
     fallback; `agentic-workflow:protocol` form; dedupe against a backticked
     `protocol`; `../etc` and `Foo` rejected → deviations, and no path outside
     the three skills dirs is ever stat'ed (assert via the resolved `file`
     list); missing name → deviation present in the written distillate.
  2. **#93** new `P/tools/agents.mjs` (zero deps, Node ≥ 18, `isEntryPoint`
     realpath pattern copied from `run-codex.mjs`): `--json [--project <repo>]`
     (default cwd), `--help`. Reads `${PLUGIN_ROOT}/agents/*.md` + plugin.json
     version; for each agent reads `<project>/.claude/agents/<name>.md` if
     present; banner regex `^> Tuned from agentic-workflow v(\S+?)(?: \(base
     sha256:([0-9a-f]{12})\))? —`; `kind[]` derived per the locked decision;
     exports `registry(projectDir)` for tests. New
     `P/templates/agents-registry.schema.json` (strict). New
     `tools/agents-test.mjs` (repo root): schema strict-mode check, 20 agents,
     fixture project in a tmp dir with (a) a new-banner model tune → `kind:
     ["model"]`, `base_sha` 12 hex; (b) the old-banner form → `base_sha: null`;
     (c) an un-bannered body edit → `kind` includes `prompt`, `override.path`
     set; (d) a reviewer shadow with `boundary_escalation: off` and `skills:
     [stripe-testing]` → `effective` reflects both; every output validates
     against the schema. Register `checkAgentsRegistryHarness` in `lint.mjs`
     (copy `checkRunCodexHarness`, lines 482–505) and add it to the array at
     line 894.
  3. **#92 + #94 + #91 + skills** rewrite `P/commands/tune.md`: frontmatter
     `argument-hint: [agent] [<model> | codex[:<model>] | effort <level> |
     tools <a,b,…> | skills <a,b,…> | prompt | boundary-escalation on|off |
     diff | rebase | reset]`; no-arg table = `node
     ${CLAUDE_PLUGIN_ROOT}/tools/agents.mjs --json --project .` rendered as
     agent · model · runtime · effort · skills · override kinds · base
     version (+ `/tune` one-liners); a "How every tune writes the shadow"
     section (fresh copy, compose rule, banner with `shasum -a 256
     ${CLAUDE_PLUGIN_ROOT}/agents/<agent>.md | cut -c1-12`, TUNED prefix
     `TUNED (<kind>: <value>) — `, decision-log line in autopilot); one short
     section per subcommand: model, runtime (keep today's text incl. the
     `reviewer codex` constraint, now ending "…unless `boundary_escalation:
     off` is tuned (#91)"), effort (both runtimes; claude passes the Agent
     tool's effort parameter where the harness exposes one, else a first-line
     `Effort: <level>.` instruction — report which), tools (sandbox note from
     `deriveFlags`), skills (regex, resolution report, both runtimes), prompt,
     boundary-escalation (reviewer only), diff (`diff -u`), rebase (locked
     recipe), reset (banner-matching files deleted, including prompt tunes;
     un-bannered → report). Replace the closing "Tuning changes the MODEL or
     the RUNTIME, never the prompt" bullet with the prompt-tune guidance
     (prefer a plugin PR for behaviour everyone needs; a prompt tune for
     project rules).
  4. **#91 + #94** in `mission.md`: §0 rule 7 — append "unless the project's
     `.claude/agents/reviewer.md` carries `boundary_escalation: off` (#91), in
     which case the tuned reviewer takes boundary diffs and flags a miscalled
     tier as a process finding"; step 2 `claude` bullet — the effort rule;
     "Reviewer tier survives…" paragraph — same `off` exception. In
     `agents/reviewer.md` 16–30 add two sentences: the key, and that `off`
     means the orchestrator's choice stands while the process-finding duty
     remains. In `templates/WORKFLOW.md` LA-5 paragraph (418–420) add one
     clause naming the per-project opt-out; §9 bullet 879–883 lists the new
     tune kinds in one sentence.
  5. **#96**: `templates/WORKFLOW.md` — after row 957 keep the Remote
     executor row, note "(legacy single form — equals a default executor
     named `default`)" and add, below the §10 table, `### 10.1 Executors
     (optional)` with the 5-column table template, the `→ executor:<label>`
     gate-row suffix, and the resolution order (brief `executor:` pin → first
     healthy labelled → default → local; probe `ssh -o BatchMode=yes <alias>
     true`; fallback logged in the ledger Deviations; none healthy → block;
     checkout `<path>/.worktrees/<mission>`; LA-8 pushed tip only).
     `mission.md` step 3 — a "Remote gates" paragraph with that order and the
     optional brief header `executor: <name>`. `connect.md` — server mode
     accepts `[--label a,b] [--name n]` and `server remove <name>`; step 7
     appends/migrates the 10.1 row instead of replacing; remove drops the row
     and prints the ssh-config/docker-context cleanup for the owner.
     `doctor.md` 34–38 — probe every 10.1 row (and the legacy row), one
     report line each, 🟡 per failing row.
  6. **Release**: `plugin.json` → `1.54.0`; CHANGELOG `## [1.54.0] —
     2026-10-07` with `### Added` (#91, #92, #93, #94, #96) and `### Fixed`
     (#95) bullets; README.md line ~42 and `P/README.md` row 167 + §100–116
     mention the new tune kinds, registry tool and fleet.
- **Verify**: `node tools/lint.mjs` green (runs run-codex-test + the new
  agents-test); `node tools/agents.mjs --json --project . | head` lists 20
  agents and the two existing shadows (`backend`, `devops`) as `override.kind:
  ["runtime","effort"]`-ish with `base_sha: null`; `node tools/run-codex.mjs
  --help` shows the widened effort; grep each issue's Proposal bullets
  against the diff (`gh issue view 9N`) and tick them in the handoff; no
  `docs/WORKFLOW.md` or `.plans/` edits. Handoff names the PR body lines
  `Closes #91, #92, #93, #94, #95, #96`.
- **Read budget**: ~620 lines reads (+ ~1,000 written). Suits: main-session /
  general-purpose builder (cross-cutting); `backend` if routed to a specialist.

**Checkpoint (Fable)** ends phase 1 — the independent `reviewer` on **Fable**
(locked: codex-adapter prompt assembly + path resolution, `tools:` → sandbox
contract, and the boundary-review rule itself change) re-runs `node
tools/lint.mjs`, diff-reviews `main..mission/gatehouse-asks`, and checks each
issue's Proposal bullets against the diff. Then staging verify per §10 (lint +
`claude --plugin-dir plugins/agentic-workflow` load) → PR to `main` for the
human.

---
_One brief by design (owner: conserve tokens). If S1 overruns, the split is
P1 = #91–#94 / P2 = #95–#96 — see the master plan's Estimate paragraph._
