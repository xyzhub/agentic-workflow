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
  lifecycle, and the `.plans/` effort trio with independent checkpoint reviews.
- **Four pillar gates** checked at every checkpoint and audited before launch.
- **Two agents**: `reviewer` (fresh-context, five pillar lenses + QA +
  architecture) and `chronicler` (keeps CHANGELOG, a posterity JOURNEY, and the
  live owner status page).
- **Guardrail hooks**: blocks pushes to the default branch, reminds on commit
  format and gates, nudges doc updates on high-impact files.
- **Commands**: `/workflow-init`, `/start-work`, `/check-workflow`, `/pre-pr`,
  `/end-work`, `/quick-fix`, `/retro`.
- **A skill** that points every session at the project's protocol.

## Install

```
/plugin marketplace add baker/venture-workflow-plugin      # or your fork's repo
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

## Companion skills (optional)

The effort trio is authored and driven best with the `effort-plan`,
`effort-run`, and `effort-continue` skills if you have them; the workflow falls
back to driving efforts by hand when they're absent.

## License

MIT.
