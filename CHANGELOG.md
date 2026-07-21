# Changelog

All notable changes to the Agentic Workflow plugin marketplace are recorded
here, in [Keep a Changelog](https://keepachangelog.com/) format. This repo
has no tags — each version-stamped commit on `main` IS the release.

## [Unreleased]
### Added
- **`/agentic-workflow:ingest` runs from anywhere** — the commons is
  portfolio-global, so ingest resolves its target registry by `--registry
  <path|remote>` → the registry repo it is run inside (auto-detect, like
  `/agentic-workflow:operate`) → the current venture's §10 Portfolio row → a
  global default (`~/.config/agentic-workflow/registry`, else
  `$AGENTIC_WORKFLOW_REGISTRY`). Harvest a codebase without first adopting it
  as a portfolio project.
- **Portfolio Commons** — the §13 registry gains a writable, copy-holding
  **commons** surface (`commons/index.md` + per-type `commons/code/<slug>/`),
  so agents copy-and-adapt reusable first-party material across ventures and
  write improvements back — a library that compounds instead of every venture
  starting cold:
  - **`/agentic-workflow:ingest`** — harvests a reusable first-party artifact
    (code type first) into `commons/code/<slug>/`, pins provenance (source repo
    + commit), and writes its full §13 index entry, all as a delegable
    bookkeeping PR. First-party-only for now; a slug guard and a
    collision/refresh guard (`--refresh` re-harvests in place, else it stops
    rather than overwrite or duplicate) keep writes safe.
  - **`curator` agent** — owns the commons lifecycle: harvest, **single-best-
    match (k=1) brokering** (never a top-N dump), the freshness signal (stale on
    `last-reviewed` age OR source-advance, surfaced never auto-mutated), and
    write-back. Sole writer to the commons; does not decide product direction,
    ship product code, or merge.
  - **Frontend consults the commons** — inside its "orient first" beat, and only
    where a commons exists, the `frontend` agent reads the index, picks the
    single best match, copy-and-adapts (never blind-copies), and flags
    improvements for the curator to write back. Where no commons exists it
    proceeds exactly as before.
  - **Regression guard** — the paired `commons-warm` / `commons-cold` evals
    (auto-discovered by `evals/run.mjs`) become the feature's permanent guard:
    warm must consult-and-adapt, cold must not hallucinate a commons.
- Onboarding UX overhaul, from real test-user feedback (didn't know what to
  type, how to start, or why artifacts stayed empty):
  - **`/welcome`** — one guided front door: orients, detects where the project
    stands, then either walks the user through it (interview that *fills*
    idea.md/PRD/etc.) or drives it hands-off — ending with filled docs and the
    next step offered, not empty templates.
  - **Namespaced commands everywhere** — every command reference is now the
    resolvable `/agentic-workflow:<cmd>` form (the bare short form fails
    headless or when shadowed). A new lint rule **fails on any bare short-form**,
    so this can't regress.
  - **Recommenders offer to run the next step** — `/agentic-workflow:next`,
    `/welcome`, `/bootstrap`, and `/adopt` offer to invoke the recommended
    command (SlashCommand) so users don't type or namespace it by hand.
### Changed
- `tools/lint.mjs` parses the namespaced command form and enforces it.
### Added (earlier this cycle)
- Context firewall (§6.2) — protects the main agent from context-window bloat
  and the fidelity loss of auto-summarization. Two rules: **bounded returns**
  (a spawned agent hands back a ≤~15-line distillate — status/paths/signal/refs,
  not a transcript; wired into the `backend`/`frontend`/`security`/`devops`
  implementers and the `planner`) and the **fresh-self handoff** (new `/handoff`
  command + `session-handoff.md` re-read manifest: when a long interactive
  session's context fills, snapshot working state as pointers and continue in a
  fresh session that re-reads verbatim files — lossless where auto-summary is
  not). `/start` resumes from the manifest; a new advisory `Read` hook warns on
  large whole-file reads (prefer ranged reads / delegation). Generalizes the
  "ledger outlives the transcript" rule (§2) to interactive sessions.
- Publishing & distribution subsystem (§14) — the harness can now publish
  outward (socials, articles, mailing list, own-site/RSS) through a gated
  pipeline: `marketing`/`writer` **stage** posts into a publish queue
  (`publish-queue.md`), and `/publish run` **fires** them — human-fired by
  default, or a scheduled run within a scoped, dated, revocable `may-publish`
  §10 Publish policy. Every post lands in an audit log (`publish-log.md`) the
  `analyst` attributes funnel results against. New `/publish` command (connect ·
  stage · status · run), a fail-closed publishing guardrail hook (hard-blocks
  paid/ad-spend endpoints — never delegable — and gates organic posting), and a
  §11 amendment making **organic publishing the second delegable authority
  alongside merge** (paid and individual outreach stay never-delegable). Wired
  into `marketing`, `writer`, `analyst`, `/operate`, `/bootstrap`, `/connect`,
  and both READMEs.
- Definition-layer templates — the artifacts the builder roles need to
  understand WHAT and HOW to build, now first-class and evidence-grounded:
  `ux-brief.md` (the `designer`'s personas + journeys + IA, what `frontend`
  builds from), `architecture.md` and `interface-contract.md` (the `architect`'s
  living system docs — components/data-model/invariants and the frontend/backend
  boundary that keeps parallel slices from diverging). Both system docs hold
  intent and contracts only, pointing at the code index rather than re-narrating
  code (stale-doc rule, §8). Wired into `designer`, `architect`, `backend`,
  `frontend`, the PRD, WORKFLOW.md (§0/§6/§9), `/bootstrap`, and the READMEs.
- `brainstormer` agent + `/brainstorm` command — the workflow now owns the
  front edge of V0 (shaping a raw, fuzzy idea into 2–3 distinct framings for the
  human to choose between) instead of relying on an external brainstorming
  skill. Runs upstream of the `researcher`: brainstormer widens and frames, the
  human picks, the researcher validates the chosen frame. Wired into
  `/bootstrap`, `/next`, WORKFLOW.md (§0/§6/§9), and both READMEs.
- Execution-core templates — five deliverables the protocol named but never
  shipped as templates now do: the mission trio (`mission-plan.md`,
  `mission-sessions.md`, `mission-state.md`) authored by the `planner`, the V1
  `prd.md` (owned by `designer`/`architect`/`analyst`), and the architect's
  `decision-memo.md` option memo. Wired into WORKFLOW.md §9 and referenced by
  `planner`, `architect`, `designer`, and `/bootstrap` so agents start from a
  consistent shape instead of improvising. Lint validates every new reference.
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
