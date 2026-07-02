# Venture Workflow

An agentic operating protocol that carries any project from a **raw idea to a
launched, viable product** — with **UX, DX, Security, and Efficiency enforced as
gates**, not aspirations. It gives Claude Code a consistent way to route, build,
review, ship, and document work, and gives the human owner a live status page and
a permanent record of the journey.

## What you get

- **A venture lifecycle** (V0 idea → V1 definition → V2 foundation → V3 build →
  V4 hardening → V5 launch → V6 operate) with an exit gate on every stage.
- **Execution machinery** — three altitudes (task / session / effort), a session
  lifecycle, and a self-contained `.plans/` effort loop (`planner` agent +
  `/effort` command) with independent checkpoint reviews.
- **Four pillar gates** checked at every checkpoint and audited before launch.
- **Agents**: `researcher` (V0 idea validation — cited evidence for and against),
  `designer` (V1–V2 brand/UX — surfaces distinct directions to choose from, then
  organizes the chosen one into a token system), `planner` (decomposes an effort
  into the `.plans/` trio, pre-resolving every brief), `reviewer` (fresh-context,
  five pillar lenses + QA + architecture), `chronicler` (keeps CHANGELOG, a
  posterity JOURNEY, and the live owner status page), and specialist implementers
  `backend`, `frontend`, `security`, `devops` (CI/CD, GitHub workflows, deploy,
  releases) — each carries its pillar bias and hands off to independent review.
- **Autonomous mode**: `/autonomous "<idea>"` drives the whole lifecycle
  (validate → define → design → build → harden → launch-prep) from a one-line
  idea and a short flight plan, pausing only at the gates a human must own.
- **Guardrail hooks**: blocks pushes to the default branch, reminds on commit
  format and gates, nudges doc updates on high-impact files.
- **Commands**: `/workflow-init`, `/autonomous`, `/effort`, `/release`,
  `/start-work`, `/check-workflow`, `/pre-pr`, `/end-work`, `/quick-fix`, `/retro`.
- **A skill** that points every session at the project's protocol.

## Install

```
/plugin marketplace add xyzhub/agentic-workflow      # or your fork's repo
/plugin install venture-workflow@venture-workflow-market
```

Then, in any project:

```
/workflow-init
```

It detects your stack (gates, deploy, default branch), writes
`docs/AGENT-SESSIONS.md` with a filled project profile, seeds the record
artifacts (CHANGELOG, JOURNEY, the status page), and — for a brand-new idea —
scaffolds `docs/product/idea.md` to validate before you build.

## Try it locally first

```
claude --plugin-dir ./plugins/venture-workflow
```

## How it stays project-agnostic

The bundled protocol (`templates/WORKFLOW.md`) carries a **Project Profile (§10)**
placeholder — gates, deploy, HITL, high-impact files. `/workflow-init` fills it
per project, producing a local `docs/AGENT-SESSIONS.md` that wins over the
bundled master. Nothing about any one project's stack is baked into the plugin.

## Self-contained effort loop

Multi-session efforts are fully handled in-plugin: the `planner` agent authors
the `.plans/` trio (exploring once so execution sessions never do), and the
`/effort` command drives it phase by phase with independent checkpoint reviews.
No external `effort-plan`/`effort-run` skill is required.

## License

MIT.
