---
description: Bootstrap this project into the Agentic Workflow — detect the stack, write docs/WORKFLOW.md with a filled project profile, and seed the record artifacts.
argument-hint: [stage e.g. V0|V2|V6]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, Artifact]
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
- **Package manager / gates** — from `package.json` scripts (test, typecheck/lint,
  build), or the equivalent for the stack (Cargo, Go, Poetry, etc.). Prefer the
  scripts that CI runs.
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
- **Memory/recall store** — optional; only record one that already exists.
- **Owner channel** — cannot be inferred; leave `none` and recommend
  `/connect` in the report (it guides the setup and proves the round-trip).
- **Issue tracker** — GitHub Issues (`gh`), Linear, none.
- **HITL** — the human owner's name (from git config/repo ownership if
  plausible; otherwise `TBD — confirm`).
- **Merge policy** — always default `human-only`. Write `agent-may-merge
  (delegated <date>)` ONLY from an explicit human answer (or the flight plan's
  Merge authority field) — never infer delegation from the repo, even if its
  history shows bot merges.
- **Publish policy** — always default `human-only` (§14, fail closed). Write
  `may-publish (delegated <date>, …)` ONLY from an explicit human answer; never
  infer it. `none` if no publishing channels are set up (`/publish connect`
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
`/check` uses it to detect protocol drift. Keep the empty **Local
amendments** section at the end. This project-local copy now wins over the
bundled one.

## 3. Seed the record artifacts (§6.1)

- `CHANGELOG.md` — Keep-a-Changelog skeleton with an `## [Unreleased]` section;
  if the repo has history, have the `chronicler` agent reconstruct prior entries
  from `git log` + merged PRs.
- `docs/product/JOURNEY.md` — a dated first entry describing the project's current
  state in plain language.
- `docs/product/overview.html` — copy `${CLAUDE_PLUGIN_ROOT}/templates/overview.html`,
  fill the project name, the stage rail to the detected stage, and an initial
  timeline; then publish it via the Artifact tool and record the returned URL in
  the file's `artifact-url` comment.
- If stage is **V0**, also seed `docs/product/idea.md` from
  `${CLAUDE_PLUGIN_ROOT}/templates/idea.md`. If the idea is still raw or
  unformed (no clear problem/who-pays yet), point at `/brainstorm` first — the
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
  `docs/product/architecture.md` (`${CLAUDE_PLUGIN_ROOT}/templates/architecture.md`)
  and `docs/product/interface-contract.md`
  (`${CLAUDE_PLUGIN_ROOT}/templates/interface-contract.md`). The
  `designer`/`architect`/`analyst` fill them; adoption `fill` mode drafts them.

## 4. Point the project's memory at the workflow

If `AGENTS.md` or `CLAUDE.md` exists, add a short pointer near the top:
"This project runs the Agentic Workflow — see docs/WORKFLOW.md." Don't
duplicate the protocol into it.

## 5. Report

Summarize: detected stage, the filled profile (gates, deploy, HITL), the files
created/updated, the status-page URL, and the recommended next action for the
current stage (e.g. at V0: fill idea.md and get a go/no-go; at V3: `/start`;
at V6: plan a growth mission). Close with: "`/next` answers this question any
time; the Quick reference at the top of docs/WORKFLOW.md has the full map."

Do NOT commit — leave the changes staged-and-visible for the human to review,
per the workflow's HITL rule.
