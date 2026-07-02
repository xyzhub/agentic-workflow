---
description: Bootstrap this project into the Venture Workflow — detect the stack, write docs/AGENT-SESSIONS.md with a filled project profile, and seed the record artifacts.
argument-hint: [stage e.g. V0|V2|V6]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

Bootstrap the current repository into the Venture Workflow. Idempotent — if an
artifact already exists, update rather than overwrite, and confirm before
replacing anything non-trivial.

## 1. Detect the project profile

Inspect the repo and determine each value (ask the human only for what you can't
infer):

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
- **Issue tracker** — GitHub Issues (`gh`), Linear, none.
- **HITL** — the human owner's name (ask if unknown).
- **Current stage** — infer V0–V6 from repo maturity (no code → V0; skeleton +
  CI → V2; shipping features → V3; deployed with real users → V5/V6). Use the
  `$ARGUMENTS` value if the user passed one.

## 2. Write docs/AGENT-SESSIONS.md

Copy the bundled master from `${CLAUDE_PLUGIN_ROOT}/templates/WORKFLOW.md` into
`docs/AGENT-SESSIONS.md`, then **replace §10 (Project profile)** with the concrete
values from step 1. Drop the "this is the bundled master" banner at the top. This
project-local copy now wins over the bundled one.

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
  `${CLAUDE_PLUGIN_ROOT}/templates/idea.md`, and offer to spawn the `researcher`
  agent to validate the problem, size the market, map competitors, and
  pressure-test the riskiest assumption (evidence for AND against) before the
  human's go/no-go. No product code until that gate passes.

## 4. Point the project's memory at the workflow

If `AGENTS.md` or `CLAUDE.md` exists, add a short pointer near the top:
"This project runs the Venture Workflow — see docs/AGENT-SESSIONS.md." Don't
duplicate the protocol into it.

## 5. Report

Summarize: detected stage, the filled profile (gates, deploy, HITL), the files
created/updated, the status-page URL, and the recommended next action for the
current stage (e.g. at V0: fill idea.md and get a go/no-go; at V3: `/start-work`;
at V6: plan a growth mission).

Do NOT commit — leave the changes staged-and-visible for the human to review,
per the workflow's HITL rule.
