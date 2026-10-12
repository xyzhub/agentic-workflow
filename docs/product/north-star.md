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
and is XYZ's most important asset. It exists so that every XYZ build ships
faster, with fewer owner prompts and no safety regressions, and so that
outsiders can find it, learn it and adopt it — bringing XYZ revenue through
development engagements run on the workflow, maintenance retainers where the
operate loop watches a client's users' bug reports, technical consulting on
adopting agentic development, and paid education for individuals and teams.
The plugin stays open source: it is the proof of capability and the lead
source. Missions (xyzhub/missions), the app for non-technical people, is a
companion in an early stage: it inherits every engine improvement through its
pinned version and changes with the engine; it is not the driver.

## Definition of worthy progress

Progress is one of these, in order of weight. The owner weights the revenue
paths against each other; until then they count equally.

- Advances the goal when:
  1. **Engine outcomes on XYZ's own work improve** — per shipped change
     across the portfolio: fewer sessions, fewer owner prompts, less reviewer
     spend, fewer correctives, no safety regressions.
  2. **Revenue arrives through the plugin** — a development engagement won, a
     maintenance retainer signed, a consulting engagement won, a paid course
     or workshop.
  3. **Pipeline grows** — enquiries and proposals attributable to the
     plugin's public front, the wiki, a talk or a course module, fed into
     XYZ's existing enquiries and proposals pipeline.
  4. **Reach grows** — plugin installs, docs traffic, course sign-ups.
  5. **Missions stays healthy** — pinned to a current engine version,
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
  ceremony (one gate-class taxonomy shared with the loop); structured and
  interactive owner surfaces (the client experience, also what Missions
  renders); the public front (landing, services page, generated wiki, demo);
  then the revenue tests (two priced proposals, the Orderly retainer priced
  against measured founder minutes, two consulting conversations, one free
  course module with a paid follow-on). Full statement: the owner's goal
  document of 2026-10-12 (to be recorded in the portfolio registry).
- **Cut / out of scope** — Missions as the driver or as a build track
  (follows the engine: pin bump + contract tests after each release, nothing
  more; today pinned at 1.54.1). Plan A for Missions (tmux-driven hosted
  containers; kept for comparison only in that repo). Interactive gate cards
  inside the plugin (Missions' job). Paid promotion fired by the workflow
  (human-only by protocol). Monetizing the plugin binary or marketplace
  listing (free, MIT).

---
_Purpose is the human's; the rollup is `compass`'s standing output. The "what"
lives in `docs/product/business/executive-summary.md`, the mission trios and
the PRD-equivalent `plugins/agentic-workflow/README.md`; tactical state lives
in the ledgers (`.plans/*.state.md`). This doc holds only direction._
