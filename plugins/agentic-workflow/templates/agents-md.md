---
status: living
owner-agent: chronicler
refresh-trigger: event
---

# Agent conventions

This project runs the Agentic Workflow. This file is the primary conventions
file every session (Claude Code and Codex) reads; `CLAUDE.md` imports it with a
first-line `@AGENTS.md` and keeps only Claude-specific notes below that import.
Keep this a pointer, not a copy — it stays well under the 32 KiB budget.

## Where the rules live

- **Protocol**: read `docs/WORKFLOW.md` §10 (the project profile — gates, deploy
  target, default branch, merge/publish policy) before doing any work; the rest
  of `docs/WORKFLOW.md` is the operating protocol.
- **Role prompts** live under the plugin's `agents/` directory; project-local
  overrides (tunes) shadow them in `.claude/agents/`.

## What every spawned agent owes

- Obey the brief your caller handed you — its task and any course corrections
  direct the work; no agent message is your user's consent.
- Return the bounded distillate your brief asks for; that hand-off, not chat
  prose, is your result.
- Never edit the `.plans/` ledgers (the orchestrator owns them), never commit,
  never push, never merge, and never cross a HITL boundary autonomously.
