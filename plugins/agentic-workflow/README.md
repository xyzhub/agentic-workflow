# Agentic Workflow

An agentic operating protocol that carries any project from a **raw idea to a
launched, viable product** — with **UX, DX, Security, and Efficiency enforced as
gates**, not aspirations. It gives Claude Code a consistent way to route, build,
review, ship, and document work, and gives the human owner a live status page and
a permanent record of the journey.

## Start here (three doors)

| You have | Run | What happens |
|---|---|---|
| A raw idea | `/autopilot "<idea>"` | Drives V0→V5 hands-off; pauses only at the gates you must own |
| An existing project | `/adopt` | Bootstraps the profile, folds in your plans, hands you a gap report |
| Neither / lost | `/next` | Reads the repo, recommends exactly ONE next command |

Then the daily loop is just: `/start-work` → build → `/end-work` → PR → you
merge. `/quick-fix` for small things, `/mission "<goal>"` for big ones, `/next`
whenever you're unsure. Every bootstrapped project carries a one-screen **Quick
reference** at the top of its `docs/WORKFLOW.md`.

Three rules cover 90% of safe usage: agents never merge to main (unless you
delegate it in the project profile), never deploy or spend, and never publish
outward — they prepare, you fire.

## What you get

- **A venture lifecycle** (V0 idea → V1 definition → V2 foundation → V3 build →
  V4 hardening → V5 launch → V6 operate) with an exit gate on every stage.
- **Execution machinery** — three altitudes (task / session / mission), a session
  lifecycle, and a self-contained `.plans/` mission loop (`planner` agent +
  `/mission` command) with independent checkpoint reviews.
- **Four pillar gates** checked at every checkpoint and audited before launch.
- **Agents**: `researcher` (V0 idea validation — cited evidence for and against),
  `designer` (V1–V2 brand/UX — surfaces distinct directions to choose from, then
  organizes the chosen one into a token system; also owns user journeys/IA and
  the V4 heuristic usability pass), `architect` (V1 shape-before-build — stack
  and data-model decisions as option memos; the human decides), `business`
  (V1/V5/V6 — business model, pricing strategy, executive summary and business
  documents under `docs/product/business/`; proposes, the human decides),
  `planner` (decomposes a mission into the `.plans/` trio, pre-resolving every
  brief), `advisor` (decision red-team convened at the human gates via
  `/counsel` — argues the strongest case against, never decides), `marketing`
  (V5–V6 go-to-market — one file per deliverable under `docs/product/launch/`:
  positioning, landing copy, per-channel announcements, channel plan,
  post-launch content plan; the human publishes), `ops` (V6 operations —
  error/cost triage, runbooks, postmortems; read-only against production),
  `analyst` (measurement engine — tracking plan and cited numbers for funnel,
  economics, and audits), `writer` (optional copy craft, convened when a slice
  is copy-heavy — owns the copy kit/glossary every surface writes to),
  `reviewer` (fresh-context, four pillar lenses + QA +
  architecture), `chronicler` (keeps CHANGELOG, a posterity JOURNEY, and the
  live owner status page), and specialist implementers `backend`, `frontend`,
  `security`, `devops` (CI/CD, GitHub workflows, deploy, releases) — each
  carries its pillar bias and hands off to independent review. `chronicler`,
  `analyst`, and `writer` default to a mid-tier model (the Efficiency pillar
  applied to the plugin itself — override in the agent file if you want more).
- **Autopilot mode**: `/autopilot "<idea>"` drives the whole lifecycle
  (validate → define → design → build → harden → launch-prep) from a one-line
  idea and a short flight plan, pausing only at the gates a human must own.
- **Guardrail hooks**: blocks pushes to (or refspecs targeting) the default
  branch and `gh pr merge` unless the project's Merge policy delegates it
  (fail closed), warns on tag pushes that may deploy, reminds on commit format
  and gates, nudges doc updates on high-impact files.
- **Commands**: `/init-workflow`, `/adopt` (one-command adoption of an existing
  project — bootstrap, convert existing plans, stage-gap report; `/adopt fill`
  also drafts the missing document deliverables), `/autopilot`, `/mission`,
  `/counsel` (advisor red-team on a pending decision), `/audit` (on-demand
  adversarial pillar audit), `/release`, `/verify` (post-deploy verification on
  the deployed instance), `/operate` (the V6 loop — errors, funnel, costs,
  economics in one pass), `/upgrade-workflow` (bring a project's protocol copy
  up to the installed master), `/next` (the zero-knowledge entry point —
  recommends the single best next command), `/doctor` (machinery diagnosis;
  `fix` mode installs missing dev tools — codegraph, ripgrep, jq), `/tune`
  (upgrade an underperforming agent's model per-project; `reset` restores the
  default), `/start-work`, `/check-workflow`, `/pre-pr`, `/end-work`,
  `/quick-fix`, `/retro`.
- **A skill** that points every session at the project's protocol.

## Install

```
/plugin marketplace add xyzhub/agentic-workflow      # or your fork's repo
/plugin install agentic-workflow@xyz
```

Then, in an existing project:

```
/adopt
```

It bootstraps the profile and records, folds in whatever process artifacts the
project already has (existing plans convert into the mission trio, decisions
locked), audits the repo against its stage's gates, and hands you one
adaptation report ranked by risk. For a fresh start, `/init-workflow` does the
bootstrap alone: it detects your stack (gates, deploy, default branch), writes
`docs/WORKFLOW.md` with a filled project profile, seeds the record artifacts
(CHANGELOG, JOURNEY, the status page), and — for a brand-new idea — scaffolds
`docs/product/idea.md` to validate before you build.

## Try it locally first

```
claude --plugin-dir ./plugins/agentic-workflow
```

## How it stays project-agnostic

The bundled protocol (`templates/WORKFLOW.md`) carries a **Project Profile (§10)**
placeholder — gates, deploy, HITL, high-impact files. `/init-workflow` fills it
per project, producing a local `docs/WORKFLOW.md` that wins over the
bundled master. Nothing about any one project's stack is baked into the plugin.

## The mission loop

Multi-session missions are fully handled in-plugin: the `planner` agent authors
the `.plans/` trio (exploring once so execution sessions never do), and the
`/mission` command drives it phase by phase with independent checkpoint reviews.

## License

MIT.
