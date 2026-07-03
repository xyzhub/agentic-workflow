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

Then in any project: `/init-workflow`.

## What's here

```
.claude-plugin/marketplace.json      # the marketplace manifest
plugins/agentic-workflow/            # the plugin
  .claude-plugin/plugin.json         # plugin manifest
  agents/    researcher.md, designer.md, planner.md, reviewer.md, chronicler.md, backend.md, frontend.md, security.md, devops.md
  commands/  init-workflow, autopilot, mission, release, start-work, check-workflow, pre-pr, end-work, quick-fix, retro
  hooks/     hooks.json               # guardrails
  skills/    protocol/                # the entry-point skill
  templates/ WORKFLOW.md, overview.html, idea.md, flight-plan.md, decision-log.md
  README.md
```

See the [plugin README](./plugins/agentic-workflow/README.md) for the full
description.

## Development — running the checks

```
node tools/lint.mjs
```

Zero-dependency deterministic lint (Node ≥ 18), also run by CI on every push:
validates the manifests, agent/command frontmatter, cross-references between
agents/commands/docs, template references, WORKFLOW.md § integrity, and hook
command syntax.

## License

MIT.
