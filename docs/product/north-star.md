---
status: living
owner-agent: compass
refresh-trigger: every-ship
---

# Agentic Workflow — North star

The one durable statement of **where this is going and why**, so work can be
judged on whether it *advances the end-goal* — not just whether it shipped. Thin
by design: this holds purpose + what counts as progress + a live done-vs-roadmap
rollup, and points at the detailed "what" rather than restating it. The `compass`
agent reads this at every strategic beat and maintains the rollup; the **human
owns the Purpose**.

## Purpose (human-owned)

_Written by the owner, 2026-10-12._

The Agentic Workflow is the engine that drives all of XYZ's development work
and is XYZ's most important asset. Its core is not development: it is an
**operating discipline for unattended agentic work** — missions with ledgers,
gates a human answers, a safety boundary that fails closed, budgets with an
overrun stop, one-shot reviews, an owner channel, an audit trail. Software
development is the first domain that discipline runs in. It exists so that
every XYZ build ships faster, with fewer owner prompts and no safety
regressions; so that outsiders can find it, learn it and adopt it; and so
that the same discipline carries into non-development domains — marketing and
social media, bookkeeping and accounting, lead generation and customer
acquisition, anything that can be automated with or without a human in the
loop — **by forking the plugin and modifying the fork for that industry**.
That brings XYZ revenue through development engagements run on the
workflow, **paid industry adaptations** (XYZ forks and tailors the workflow
to a client's industry and business, then runs it for them or hands it over
with training), managed operations where the loop runs a client's recurring
work and watches their users' reports, technical consulting on adopting
agentic operations, and paid education for individuals and teams. The plugin stays
open source: it is the proof of capability and the lead source. Missions
(xyzhub/missions), the app for non-technical people, is a companion in an
early stage: it inherits every engine improvement through its pinned version
and changes with the engine; it is not the driver.

## Definition of worthy progress

Progress is one of these, in order of weight. The owner weights the revenue
paths against each other; until then they count equally.

- Advances the goal when:
  1. **Engine outcomes on XYZ's own work improve** — per shipped change
     across the portfolio: fewer sessions, fewer owner prompts, less reviewer
     spend, fewer correctives, no safety regressions.
  2. **Revenue arrives through the plugin** — a development engagement won, a
     paid industry adaptation (a client's fork built and handed over or
     run for them), a managed-operations retainer signed (maintenance of a
     built app, or a recurring non-development loop such as a client's
     bookkeeping close or social calendar), a consulting engagement won, a
     paid course or workshop.
  3. **A second domain is proven** — one non-development loop running
     unattended under the same ledger, gate, budget and audit discipline, on
     real work, with its irreversible actions mechanically guarded. Counts
     once per domain, first time only.
  4. **Pipeline grows** — enquiries and proposals attributable to the
     plugin's public front, the wiki, a talk or a course module, fed into
     XYZ's existing enquiries and proposals pipeline.
  5. **Reach grows** — plugin installs, docs traffic, course sign-ups.
  6. **Missions stays healthy** — pinned to a current engine version,
     contract tests green, its pilot targets moving. Follows 1; never
     competes with it for effort.
- Does **not** count (anti-goals):
  - Missions features not forced by an engine change or by its own pilot.
  - Protocol work with no measured effect on engine outcomes (1).
  - A course or a services page before a public front and a proof point exist.
  - A second taxonomy where one already exists (gate classes and the operate
    loop's escalation classes are one list, in one template).
  - A second interactive gate layer inside the plugin — Missions renders
    gates; the plugin emits them as structured data.
  - A generic multi-industry abstraction in the base (packs, domain
    switches). Another industry is a **fork** of the plugin, modified for
    that industry; the base stays a development plugin. A fork never edits
    the discipline files (hooks, ledger and mission tools, owner-channel and
    publish-gate mechanics), so it can merge every base release.
  - A fork that reimplements skills the ecosystem already ships — the
    discipline is the product; the skills are commodities.
  - A hand-drawn diagram of the workflow. The engine must be understandable
    and explainable — its organisation and roles, the typed relationships
    between agents (who reports to whom, who supervises whom, who briefs,
    advises or owns what, with the physical spawn path shown separately
    from the logical reporting lines), message pathways, stages, gates,
    guardrails and live state — through maps **generated** from the
    agent registry, the command and hook sources and the ledgers; a drawing
    that is not generated drifts the week after it is made.
  - A non-development loop whose irreversible actions are guarded only by
    prose. Today the guard hooks match Bash, Write and Edit; MCP and HTTP
    tool calls never pass through them. A fork is proven only with the
    base's MCP-aware, fail-closed guard reading its irreversible-action list.
  - Anything that reopens the compliance frame (unmodified Claude Code, the
    user's own subscription, no credential handling) or the safety boundary
    (merge, deploy, spend, publish stay human-gated).
  - Monetizing the plugin itself: it stays free and MIT. (Amends the
    business-model lock of 2026-07-08, "$0, monetization deferred until an
    external-adoption signal" — the paid layer is the services and education
    around it, started now, because the public front is how the adoption
    signal gets produced. Owner, 2026-10-12.)

## Done vs roadmap (live rollup — `compass` maintains)

_Seeded by the owner 2026-10-12 from the goal statement and the ledgers;
`compass` refreshes from here. The detailed "what" is in
`docs/product/business/executive-summary.md` and the mission trios under
`.plans/`; do not restate them here._

- **Shipped** — v1.59.0 on `main` (2026-10-11): the V0→V6 protocol with
  enforced gates; 20 role agents; 28 commands; guardrail hooks that fail
  closed on merge, push, spend and publish; two runtimes (Claude, Codex) and
  the `claude -p` adapter; four tune presets; one-line ledger beats; the
  records layer (CHANGELOG, JOURNEY, status page, decision log, obligations
  register). Every closed mission since July has been a protocol improvement
  from its own retros.
- **In flight** — none. The last two missions (`builder-done-rules`,
  `tune-presets`) closed 2026-10-11; their live-verify obligations (OB-23,
  OB-25) wait on the owner's reinstall.
- **Next** — `operate-triage`, replanned (its trio targets 1.53.0, taken on
  2026-10-07; the engine is at 1.59.0): the support-channel spec and the
  triage, diagnose and digest modes — the first half of the unattended V6
  loop and the engine behind the maintenance-retainer offer. **Orderly is the
  n=1 venture**: it builds its in-app support channel from the spec, and
  mission 2 (`operate-fix`, issue #90) starts once ten real reports have
  flowed through it. After that, in order: the engine adapts its own
  ceremony (one gate-class taxonomy shared with the loop; the stage table
  read from the protocol template so a fork that rewrites it inherits the
  mechanism); structured and interactive owner surfaces (the client
  experience, also what Missions renders); the **explainer** — generated
  maps of the organisation chart, message pathways, lifecycle and gates,
  guardrails, a live view and a trace, from the registry and the sources,
  one truth shared by the README, the wiki, the status page and Missions'
  roster; what the base owes its forks (an MCP-aware fail-closed guard, an
  irreversible-action row in the project profile, the fork file map as one
  view of the explainer); **fork one: marketing**, run
  on XYZ's own launch; the public front (landing, services page, generated
  wiki, demo), produced by that fork's loop; then the revenue tests (two
  priced proposals, the Orderly retainer priced against measured founder
  minutes, one client's marketing loop, two consulting conversations, one
  free course module with a paid follow-on). Bookkeeping and lead-generation
  forks are V0 ideas each gated on a paying client. Full statement:
  `docs/product/decisions/2026-10-12-goal-statement.md` (pointer row in the
  portfolio registry's ledger, xyzhub/registry).
- **New venture, gated (owner, 2026-10-12 amendment)** — the **Missions
  server**: a distribution of Paperclip (MIT; upstream core untouched, XYZ
  additions as Paperclip plugins through its distribution catalog, branding
  limited to a listed file set) in its own repository. It absorbs the current
  Missions service; the **Missions runner** (the existing runner package,
  shipped standalone) is hired into it as an agent and is the only place
  that launches unmodified Claude Code with the plugin and hooks; the
  **Missions desktop** app becomes the founder's client of the server.
  Brakes become runtime-agnostic (approvals and execution policy at the
  ticket layer, a sandbox per run, scoped credentials, gate tools), with
  Claude hooks as an extra layer. Industry forks of the plugin are
  departments hired into the server. V0 idea doc any time; build after
  operate-triage and adaptive ceremony ship. The plugin never depends on it.
  Reasons and evidence: the goal statement's amendment.
- **Cut / out of scope** — Missions as the driver or as a build track
  (follows the engine: pin bump + contract tests after each release, nothing
  more; today pinned at 1.54.1). A control plane built from scratch, or a
  deep fork of Paperclip's core (the distribution rebases on upstream).
  Running the workflow through Paperclip's own Claude Code adapter (its
  hooks do not load there). A new product name (Firm, Bureau, Works, Flow and
  others were considered and dropped; Missions keeps its name). Plan A for
  Missions (tmux-driven hosted containers; kept for comparison only in that
  repo). Interactive gate cards inside the plugin (Missions' job). Paid
  promotion fired by the workflow (human-only by protocol). Monetizing the
  plugin binary or marketplace listing (free, MIT).

---
_Purpose is the human's; the rollup is `compass`'s standing output. The "what"
lives in `docs/product/business/executive-summary.md`, the mission trios and
the PRD-equivalent `plugins/agentic-workflow/README.md`; tactical state lives
in the ledgers (`.plans/*.state.md`). This doc holds only direction._
