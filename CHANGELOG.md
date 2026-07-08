# Changelog

All notable changes to the Agentic Workflow plugin marketplace are recorded
here, in [Keep a Changelog](https://keepachangelog.com/) format. This repo
has no tags — each version-stamped commit on `main` IS the release.

## [Unreleased]
### Added
- /plan — interview-driven feature planning in one command: the human
  answers batched questions with drafted options, the team (designer,
  architect, analyst, advisors, planner) produces the brief, journeys,
  option memos, metrics, counsel, and the mission trio; one consolidated
  approval; optional immediate /mission run.
### Docs
- Self-adoption: the repo now runs its own workflow — `docs/WORKFLOW.md`
  (§10 profile, stage V6), reconstructed CHANGELOG/JOURNEY, live status page,
  retroactive idea/business/launch docs, registered in the portfolio registry.
  Monetization locked-deferred (2026-07-08).

## [v1.30.0] - 2026-07-08
### Added
- Portfolio registry — one owner, many ventures. `/adopt` and `/operate` can
  now register a project as a row in a shared registry
  (`docs/product/registry.md` template), so one owner running several
  ventures gets a single roll-up instead of per-project silos. (PR #7)

## [v1.29.0] - 2026-07-07
### Fixed
- Owner-channel Slack flow: the DM composer step and emoji-reaction
  tap-to-decide path are corrected — gate decisions can be approved or
  rejected with a single emoji reaction instead of a full reply. (PR #6)

## [v1.28.2] - 2026-07-07
### Fixed
- `/connect` states its bootstrap precondition up front and its Slack scope
  list is corrected, so owner-channel setup fails fast with a clear message
  instead of silently at the first real gate. (PR #5)
- `/adopt` eval calibration and judge-retry hardening; manifest and fixture
  version stamps synced to 1.28.2. (PR #4)

## [v1.28.1] - 2026-07-07
### Fixed
- YAML-unsafe frontmatter values in agent/command files, plus a new tier-1
  lint rule that catches this class of error going forward. (PR #3)

### Docs
- README narrative gaps closed: loop mode, the protocol-upgrade story, and
  token-discipline guidance are now documented. (PR #2)

## [v1.28.0] - 2026-07-07
### Added
- Multi-project owner channel — a single Slack connection can now front
  notifications and gate decisions for more than one adopted project.

## [v1.27.0] - 2026-07-07
### Added
- `/connect` — interactive owner-channel setup with a round-trip test
  message, so a broken connection is caught at setup instead of at the
  first real gate.

## [v1.26.0] - 2026-07-07
### Added
- Owner channel: Slack notifications and remote gate decisions — the owner
  can approve or reject a gate without an open terminal session.

## [v1.25.0] - 2026-07-07
### Changed
- **Breaking:** command names shortened to single words, replacing the
  longer multi-word slash commands.

## [v1.24.0] - 2026-07-07
### Added
- `/tune` — per-project agent model upgrade/reset, so an operator can dial
  model tier per agent without hand-editing config.

## [v1.23.0] - 2026-07-07
### Added
- `/doctor` — machinery diagnosis with a fix mode.
### Fixed
- `/next` now always emits real values, never placeholder text.

## [v1.22.0] - 2026-07-07
### Added
- Loop mode, code-index integration, and token tiering — long-running
  sessions now discipline their own context and token usage.

## [v1.21.0] - 2026-07-07
### Added
- Optional `writer` agent, plus a project copy kit and glossary, for teams
  that want a dedicated prose/voice pass.

## [v1.20.0] - 2026-07-07
### Added
- Usability layer: `/next` router, a Quick Reference, and a Start-here
  README section — new operators can find the right command without
  reading the whole protocol first.
- Behavioral-design and gamification discipline as a standing rule: no dark
  patterns; rewards and progress indicators must map to real user progress.
- New agent roster (`architect`, `advisor`, `ops`, `analyst`) and new
  lifecycle commands, plus assorted command fixes.
- Guardrail hardening, a delegable merge policy, and autopilot brownfield
  support (autopilot can now adopt an existing project mid-run). (PR #1)

## [v1.16.0] - 2026-07-03
### Added
- Autopilot context discipline and continue mode — an autopilot run can now
  pause and resume without losing state.

## [v1.10.0 – v1.15.0] - 2026-07-03
Adoption and eval-suite foundation:
- `/adopt` — one-command adoption for existing projects, plus fill mode
  (drafts missing document deliverables). (v1.14.0, v1.15.0)
- Plan import and replan mode. (v1.13.0)
- `business` agent (model, pricing, executive summary + business docs) and
  its eval scenario. (v1.12.0, v1.12.1)
- Per-file launch deliverables and post-launch content plan. (v1.11.0)
- Tier-2 scenario evals (fixtures, rubrics, LLM judge, runner) and
  token-usage capture in eval results. (v1.10.0, v1.10.1)

## [v1.1.0 – v1.9.0] - 2026-07-03
Founding buildout — initial agent roster and execution machinery:
- Reviewer scorecard and high-stakes adversarial multi-vote review. (v1.9.0)
- `marketing` agent and GTM surface at V5/V6. (v1.8.0)
- Tier-1 deterministic lint + CI. (v1.7.0)
- Consistency pass and naming pass (plugin → agentic-workflow, skill →
  protocol, doc → WORKFLOW.md). (v1.6.0, v1.6.1)
- Altitude rename ("effort" → "mission"); `planner` agent and the mission
  command. (v1.5.0, v1.5.1, v1.5.2)
- `devops` agent and `/release` command. (v1.4.0)
- `designer` agent and autonomous mode. (v1.3.0)
- `researcher` agent for the V0 idea phase. (v1.2.0)
- Specialist implementer agents: backend, frontend, security. (v1.1.0)

## [v1.0.0] - 2026-07-03
### Added
- Initial release: Venture Workflow plugin — the founding V0–V6 lifecycle,
  the initial agent set, and the marketplace install path.
