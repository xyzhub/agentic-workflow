---
description: Bootstrap this project into the Agentic Workflow — detect the stack, write docs/WORKFLOW.md with a filled project profile, and seed the record artifacts.
argument-hint: [stage e.g. V0|V2|V6]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, Artifact, AskUserQuestion, SlashCommand]
---

Bootstrap the current repository into the Agentic Workflow. Idempotent — if an
artifact already exists, update rather than overwrite, and confirm before
replacing anything non-trivial.

## 1. Detect the project profile

Inspect the repo and determine each value. **Never block the bootstrap on an
unknown**: fill what you can't infer as `TBD — confirm` and continue — the
human reviews everything before committing (step 5) and can correct any row
then. Ask questions only when a human is actually present to answer them.

- **Default branch** — `git symbolic-ref --short refs/remotes/origin/HEAD` or the
  current branch.
- **Staging** — a `staging` branch (`git branch -r`) and its deploy URL (a
  staging app in `fly.toml`/Vercel/CI env, or the preview-deploy pattern);
  `none` when absent — the first mission creates the branch and records it
  (§5: every phase lands on staging and is verified there before its PR to
  the default branch).
- **Package manager / gates** — from `package.json` scripts (test, typecheck/lint,
  build), or the equivalent for the stack (Cargo, Go, Poetry, etc.). Prefer the
  scripts that CI runs.
- **Test policy** — `configured` when a test command exists; `none-yet` when
  none does; `none-by-design` ONLY from an explicit human answer — never
  inferred (the reviewer's QA lens keys on this row).
- **Tune preset** — ONE question when a human is present: which posture,
  `lean` · `balanced` (recommended) · `rigorous` · `unattended`
  (`templates/tune-presets.json`)? Recommend `rigorous` instead when the
  interview names payments, auth or PII (the auth-surface signal that seeds
  AUTH.md, step 3). Unanswered → `balanced`, marked `default`.
- **Datastore seed/reset** — a `seed`/`db:reset` script, a migrations dir, or
  none.
- **Deploy + live-verify** — CI deploy workflow, `fly.toml`, Dockerfile, Vercel,
  etc.; and how one confirms on the deployed instance.
- **High-impact files** — the conventions file (CLAUDE.md/AGENTS.md), schema,
  architecture docs.
- **Code index** — a `.codegraph/` dir, an index MCP server in the project's
  MCP config, or an index CLI on PATH. Record HOW to query it (the CLI
  command agents run via Bash, and/or MCP tool names). None and the repo is
  beyond trivial size → recommend one in the report (DX pillar: the repo
  legible to models); `none` in the profile until then.
- **Version pin** — where this project pins its version: a `version` key in
  `package.json`/`plugin.json`, `project.version` in `pyproject.toml`, a
  `VERSION` file. Read it from the same manifest that yielded the gates.
  `none` when the project is unversioned — that is a real answer, not a gap.
- **Memory/recall store** — optional; only record one that already exists.
- **Owner channel** — cannot be inferred; leave `none` and recommend
  `/agentic-workflow:connect` in the report (it guides the setup and proves the round-trip).
- **Issue tracker** — GitHub Issues (`gh`), Linear, none. This is the queue's
  system of record (§4): when it is GitHub, ensure the queue labels exist
  (`gh label create type/bug type/feature type/debt type/ops size/XS size/S
  size/M stale needs-owner` — idempotent, skip existing) and mention
  `/agentic-workflow:groom` in the report; if the repo carries a hand-written
  `BACKLOG.md`, recommend `/agentic-workflow:groom` (it detects and imports it).
- **HITL** — the human owner's name (from git config/repo ownership if
  plausible; otherwise `TBD — confirm`).
- **Merge policy** — always default `human-only`. Write `agent-may-merge
  (delegated <date>)` ONLY from an explicit human answer (or the flight plan's
  Merge authority field) — never infer delegation from the repo, even if its
  history shows bot merges.
- **Publish policy** — always default `human-only` (§14, fail closed). Write
  `may-publish (delegated <date>, …)` ONLY from an explicit human answer; never
  infer it. `none` if no publishing channels are set up (`/agentic-workflow:publish connect`
  configures them later).
- **Current stage** — infer V0–V6 from repo maturity (no code → V0; skeleton +
  CI → V2; shipping features → V3; deployed with real users → V5/V6). Use the
  `$ARGUMENTS` value if the user passed one.

## 2. Write docs/WORKFLOW.md

Copy the bundled master from `${CLAUDE_PLUGIN_ROOT}/templates/WORKFLOW.md` into
`docs/WORKFLOW.md`, then **replace §10 (Project profile)** with the concrete
values from step 1. Replace the "this is the bundled master" banner at the top
with a version stamp — `<!-- protocol-master: vX.Y.Z -->`, where X.Y.Z is the
plugin version from `${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json` —
`/agentic-workflow:check` uses it to detect protocol drift. Write the **Tune
preset** row as `<name> (applied YYYY-MM-DD)` — unanswered →
`balanced (default, applied YYYY-MM-DD)`; readers take the first token as the
name — and apply it per `/agentic-workflow:tune preset <name>` (`balanced`
writes no files). Keep the empty **Local
amendments** section at the end. This project-local copy now wins over the
bundled one.

**Ceremony profile (§10 row + §10.2).** After §10 is written, run `node
${CLAUDE_PLUGIN_ROOT}/tools/ceremony.mjs derive --json` in the project root. It
never writes; you do:

1. **`asks` non-empty and a human is present** → ONE AskUserQuestion message,
   numbered, headed "Answer N questions so I can set how much ceremony this
   project needs (or skip — unanswered items stay `required`)." Each item is
   the ask's `question` plus what happens on no answer. Never one question per
   ask. A stage answer fills the **Current stage** row. Any other answer that
   changes a row goes under §10.2 `Overrides:` as `- <id>: <value> — asked
   YYYY-MM-DD — "question N: <answer>"`; no answer → the row stays `required`
   (`"no answer"`). An answer on a row whose class is irreversible changes
   nothing — that row stays `required` — and the report says so.
2. Run `derive --confirm "<owner>" --json` and write `render.row` into the
   **Ceremony profile** row and `render.table` under `### 10.2 Ceremony` (keep
   the `Overrides:` lines). Bootstrap writes `confirmed`: this is a fresh
   project and the owner just answered. Unattended (no human) → run `derive
   --json` instead and write the `proposed` row and table — never confirm on
   the owner's behalf.
3. `unreadable: true` → write `render.row` (the "could not read the stage
   table" cell), no table, and make that the report's first line.

Then `ceremony.mjs check` must print "profile consistent" (a `proposed`
profile: only its `proposed` finding).

**Attribution (§10 row + `.claude/settings.json`).** Run `node
${CLAUDE_PLUGIN_ROOT}/tools/attribution.mjs import` in the project root and
write its output as the **Attribution** row's cell — an attribution the
project already set in `.claude/settings.json` is adopted, never overwritten;
nothing set → `commit: default · pr: default`. Then run `attribution.mjs
apply`: it writes only the `attribution` key of `.claude/settings.json`
(creating the file if absent; every other key kept). Exit 2 (the file is not
valid JSON) or a refused permission prompt → leave the file alone and report
"settings not written" — never report the step done. Report line: "Commits
and PRs credit The XYZ Protocol — set §10 Attribution to `none` or your own
text to change it; takes effect next session." (for a non-default row, name
its value instead of The XYZ Protocol).

## 3. Seed the record artifacts (§6.1)

- `CHANGELOG.md` — Keep-a-Changelog skeleton with an `## [Unreleased]` section;
  if the repo has history, have the `chronicler` agent reconstruct prior entries
  from `git log` + merged PRs.
- `docs/product/JOURNEY.md` — a dated first entry describing the project's current
  state in plain language.
- **AUTH.md (auth-surface ventures)** — when the repo has an auth surface and
  seed scripts, copy `${CLAUDE_PLUGIN_ROOT}/templates/auth.md` to
  `docs/AUTH.md` and fill the users table FROM the seed scripts (seeded
  credentials only — the safety rule is in the template); record the §10
  **Test users** row. No auth → row = `none`.
- **CI tracking** — when `.github/workflows` exists, copy
  `${CLAUDE_PLUGIN_ROOT}/tools/ci-wait.mjs` to `tools/ci-wait.mjs`: agents
  wait on CI/deploys with `node tools/ci-wait.mjs <sha>` in the background
  (exit code = verdict, zero tokens while polling; §12 LA-8).
- **The catalog (§6.1)** — copy `${CLAUDE_PLUGIN_ROOT}/tools/catalog.mjs` to
  `tools/catalog.mjs` (create `catalog.config.json` only if the project's
  routes/schema are not at the Nuxt/Prisma defaults — `routesDir`,
  `schemaFiles`, `authPatterns`), run `node tools/catalog.mjs` (writes
  `docs/product/catalog/{api,data-model,README}.md`), and copy
  `${CLAUDE_PLUGIN_ROOT}/templates/catalog-features.md` to
  `docs/product/catalog/features.md`. Seed `features.md` when the repo already
  ships capabilities: spawn the `chronicler` with the PRD + CHANGELOG + the
  generated `api.md` to draft one row per capability (`status: live`, anchors
  resolving under `--verify`, `marketable` proposed, `benefit: _unwritten_`),
  and put the `marketable` column in the step-5 report for the human to confirm
  — the catalog is what every later session builds on, so its first version
  is reviewed, not assumed.
- `docs/product/roadmap.md` — copy `${CLAUDE_PLUGIN_ROOT}/templates/roadmap.md`
  (epic view: owner ranking + epics + deferred; never per-item status — items
  live in the tracker). If the repo already has an item-level roadmap
  (per-entry status tables), keep it and note in the report that it duplicates
  the queue and should collapse to epics via `/agentic-workflow:groom`'s
  recommendation.
- `docs/product/overview.html` — copy `${CLAUDE_PLUGIN_ROOT}/templates/overview.html`,
  fill the project name, the stage rail to the detected stage, and an initial
  timeline; then publish it via the Artifact tool and record the returned URL in
  the file's `artifact-url` comment.
- If stage is **V0**, also seed `docs/product/idea.md` from
  `${CLAUDE_PLUGIN_ROOT}/templates/idea.md`. If the idea is still raw or
  unformed (no clear problem/who-pays yet), point at `/agentic-workflow:brainstorm` first — the
  `brainstormer` shapes it into framings to choose from before validation.
  Once the framing is set, offer to spawn the `researcher`
  agent to validate the problem, size the market, map competitors, and
  pressure-test the riskiest assumption (evidence for AND against) before the
  human's go/no-go. No product code until that gate passes.
- If stage is **V1 or later**, seed the V1 definition set (only those that don't
  already exist) from templates: `docs/product/prd.md`
  (`${CLAUDE_PLUGIN_ROOT}/templates/prd.md` — scope, in-scope journeys +
  acceptance criteria, memo pointers, success metrics), the `designer`'s
  `docs/product/ux-brief.md` (`${CLAUDE_PLUGIN_ROOT}/templates/ux-brief.md` —
  personas, journeys, IA), and the `architect`'s
  `docs/product/engineering/architecture.md` (`${CLAUDE_PLUGIN_ROOT}/templates/architecture.md`)
  and `docs/product/engineering/interface-contract.md`
  (`${CLAUDE_PLUGIN_ROOT}/templates/interface-contract.md`). The
  `designer`/`architect`/`analyst` fill them; adoption `fill` mode drafts them.

## 4. Point the project's memory at the workflow

`AGENTS.md` is the primary conventions file (runtime-neutral — both Claude and
Codex read it); `CLAUDE.md` imports it and holds only Claude-specific notes.

- No `AGENTS.md` → create it from `${CLAUDE_PLUGIN_ROOT}/templates/agents-md.md`
  (a pointer, not a copy of the protocol).
- `CLAUDE.md` — create or patch it so its **first non-blank line is `@AGENTS.md`**;
  keep any existing Claude-only notes below that import, never duplicate the
  protocol into it.
- When §10 already records a codex runtime (the **Runtimes** row names codex),
  also write `.codex/rules/agentic-workflow.rules` from
  `${CLAUDE_PLUGIN_ROOT}/templates/codex.rules`. The trust entry in
  `~/.codex/config.toml` and the round-trip proof stay `/agentic-workflow:connect codex`'s
  job — a user-config edit is never a bootstrap side effect.

## 5. Report

Summarize: detected stage, the filled profile (gates, deploy, HITL), the files
created/updated, the ceremony line — "Ceremony profile written: <n> required,
<n> optional, <n> skipped. It is in force now — edit any row in §10.2 to change
it." (counted from the `effective` column; a `proposed` profile says "proposed —
every gate still runs until you say "confirm ceremony profile"" instead) — the
attribution line from step 2 — the
status-page URL, and the recommended next action for the
current stage (e.g. at V0: fill idea.md and get a go/no-go; at V3: `/agentic-workflow:start`;
at V6: plan a growth mission). Then **offer to run that next command** for them
(AskUserQuestion → SlashCommand), unless it's a human-only gate (merge/deploy/
spend/publish). Close with: "`/agentic-workflow:next` answers this question any
time; the Quick reference at the top of docs/WORKFLOW.md has the full map."

For a venture with a UI surface, when the impeccable toolset is present —
probe (§0.2), any of: `grep -qsi impeccable ~/.claude/plugins/installed_plugins.json`
exits 0, `.claude/skills/impeccable/` exists, or `node_modules/.bin/impeccable`
exists — also recommend `.impeccable/` scaffolding as a next step: name
impeccable's `init` (the human or the main session runs it; subagents cannot
invoke slash commands). When it is not installed, omit any impeccable mention.

Do NOT commit — leave the changes staged-and-visible for the human to review,
per the workflow's HITL rule.
