# Agentic Workflow — Claude Code plugin marketplace

This repo is a [Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
hosting one plugin: **[agentic-workflow](./plugins/agentic-workflow)** — an
agentic operating protocol that takes any project from a raw idea to a launched,
viable product, with UX, DX, Security, and Efficiency enforced as gates.

## Install

```
/plugin marketplace add xyzhub/agentic-workflow
/plugin install agentic-workflow@xyz
```

(Replace `xyzhub/agentic-workflow` with wherever you host this repo.)

Then in any project: `/adopt` (existing project — bootstraps, converts plans,
reports gaps), `/bootstrap` (fresh start), or `/next` (unsure — recommends
the one best next command).

## What's here

```
.claude-plugin/marketplace.json      # the marketplace manifest
.github/workflows/lint.yml           # tier-1 lint on every push/PR
tools/lint.mjs                       # tier-1 deterministic lint
evals/                               # tier-2 scenario evals (see evals/README.md)
plugins/agentic-workflow/            # the plugin
  .claude-plugin/plugin.json         # plugin manifest
  agents/    brainstormer.md, researcher.md, designer.md, architect.md, business.md, planner.md, advisor.md, marketing.md, ops.md, analyst.md, writer.md, reviewer.md, chronicler.md, backend.md, frontend.md, security.md, devops.md
  commands/  brainstorm, bootstrap, adopt, autopilot, plan, mission, counsel, audit, release, verify, operate, publish, sync, next, doctor, tune, connect, start, check, pr, end, fix, retro, handoff
  hooks/     hooks.json               # guardrails
  skills/    protocol/                # the entry-point skill
  templates/ WORKFLOW.md, overview.html, idea.md, prd.md, ux-brief.md, architecture.md, interface-contract.md, flight-plan.md, decision-log.md, decision-memo.md, mission-*.md (plan, sessions, state), registry.md, launch-*.md (plan, positioning, landing-page, announcement, content-plan), publish-queue.md, publish-log.md, session-handoff.md, business-*.md (executive-summary, model, pricing)
  README.md
```

See the [plugin README](./plugins/agentic-workflow/README.md) for the full
description.

## Development — running the checks

```
node tools/lint.mjs      # tier 1: free, deterministic — CI runs it on every push
node evals/run.mjs       # tier 2: LLM-judged scenario evals — run before releases
```

Tier 1 (zero-dependency, Node ≥ 18) validates the manifests, agent/command
frontmatter, cross-references between agents/commands/docs, template
references, WORKFLOW.md § integrity, and hook command syntax. Tier 2 runs the
plugin's prompts through headless `claude -p` against fixture repos and judges
the transcripts — see [evals/README.md](./evals/README.md); it costs real
tokens, so it gates releases, not pushes.

## License

MIT.
