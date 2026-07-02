# Venture Workflow — Claude Code plugin marketplace

This repo is a [Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces)
hosting one plugin: **[venture-workflow](./plugins/venture-workflow)** — an
agentic operating protocol that takes any project from a raw idea to a launched,
viable product, with UX, DX, Security, and Efficiency enforced as gates.

## Install

```
/plugin marketplace add xyzhub/agentic-workflow
/plugin install venture-workflow@venture-workflow-market
```

(Replace `xyzhub/agentic-workflow` with wherever you host this repo.)

Then in any project: `/workflow-init`.

## What's here

```
.claude-plugin/marketplace.json      # the marketplace manifest
plugins/venture-workflow/            # the plugin
  .claude-plugin/plugin.json         # plugin manifest
  agents/    reviewer.md, chronicler.md, backend.md, frontend.md, security.md
  commands/  workflow-init, start-work, check-workflow, pre-pr, end-work, quick-fix, retro
  hooks/     hooks.json               # guardrails
  skills/    venture-workflow/        # the entry-point skill
  templates/ WORKFLOW.md, overview.html, idea.md
  README.md
```

See the [plugin README](./plugins/venture-workflow/README.md) for the full
description.

## License

MIT.
