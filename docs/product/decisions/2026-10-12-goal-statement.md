<!-- Goal statement — owner-authored with the orchestrator, 2026-10-12. Umbrella for the missions it names; each workstream is its own /agentic-workflow:plan then mission. The north star (docs/product/north-star.md) carries the Purpose and the rollup; this file holds the full statement. Pointer row to be added to the portfolio registry ledger (xyzhub/registry). Revision history: v1–v9 drafted in session; this is v9. -->

# Goal: make the Agentic Workflow XYZ's flagship asset — the operating discipline behind every XYZ build and, through forks, behind any automatable work; understandable and explainable to anyone; publicly marketable; the front door to XYZ's revenue through engagements, managed operations, consulting and education — with Missions as its non-technical companion that follows it

## Purpose (owner-owned; goes into the plugin's north star)

The Agentic Workflow is the engine that drives all of XYZ's development work
and is XYZ's most important asset. Its core is not development: it is an
**operating discipline for unattended agentic work** — missions with
ledgers, gates a human answers, a safety boundary that fails closed, budgets
with an overrun stop, one-shot reviews, an owner channel, an audit trail.
Software development is the first domain that discipline runs in. The goal
is to make the engine measurably better at XYZ's own work, make it a
tangible public asset outsiders can find, learn and adopt, carry the same
discipline into non-development domains **by forking the plugin and
modifying the fork for that industry** (marketing and social media,
bookkeeping and accounting, lead generation and customer acquisition, and
anything else that can be automated with or without a human in the loop),
and turn that adoption into revenue: development engagements run on the
workflow, **paid industry adaptations** (XYZ forks and tailors the workflow
to a client's industry and business, then runs it for them or hands it over
with training), managed operations where the loop runs a client's recurring
work and watches their users' reports, technical consulting on adopting
agentic operations, and paid education. The engine must be **understandable, comprehensible and explainable**: its
agents' organisation and roles, the pathways messages travel, the stages
and gates, the guardrails, and what is happening right now in a project
are visible on generated maps, never hand-drawn ones. The plugin stays open
source; it is the proof of capability and the lead source. Missions, the
app for non-technical people, is a companion in an early stage: it inherits every
engine improvement through its pinned version and changes with the engine;
it is not the driver.

## What counts as progress (in order of weight)

1. **Engine outcomes on XYZ's own work.** Per shipped change across the
   portfolio: fewer sessions, fewer owner prompts, less reviewer spend,
   fewer correctives, no safety regressions.
2. **Revenue through the plugin or a fork.** A development engagement won,
   a paid industry adaptation (a client's fork built, then handed over or
   run for them), a managed-operations retainer signed (maintenance of a
   built app, or a recurring non-development loop), a consulting engagement
   won, a paid course or workshop. The owner weights them (open question 1).
3. **A second domain proven.** One industry fork running an unattended loop
   under the same ledger, gate, budget and audit discipline, on real work,
   with its irreversible actions mechanically guarded. Counts once per
   fork, first time only.
4. **Pipeline.** Enquiries and proposals attributable to the public front,
   the wiki, a talk, a course module, fed into XYZ's existing pipeline.
5. **Reach.** Plugin installs, docs traffic, course sign-ups.
6. **Missions health.** Pinned to a current engine version, contract tests
   green, pilot targets moving. Follows 1; never competes with it.

**Anti-goals.** Missions features not forced by an engine change or its
pilot; protocol work with no measured effect on 1; a course or a services
page before there is a public front and a proof point; a second taxonomy
where one already exists; **a generic multi-industry abstraction in the
base** (packs, plugin-in-plugin, domain switches) — industries are forks; a
fork that reimplements skills the ecosystem already ships (the discipline is
the product, the skills are commodities); a fork that edits the base's
safety hooks or ledger tools (that is how a fork stops being able to take
base improvements); a non-development loop whose irreversible actions are
guarded only by prose; hand-drawn diagrams of the workflow (a drawing that
is not generated from the agent registry, the command and hook sources and
the ledgers drifts the week after it is made); any work that reopens the
compliance frame or the safety boundary.

**Decision this goal records.** The plugin's business model (locked
2026-07-08: "$0, monetization deferred until an external-adoption signal")
is amended: the plugin stays free and MIT; revenue is the services and
education layer around it, started now, because the public front is how
the adoption signal gets produced.

## The fork model this goal commits to

- **The base stays a development plugin.** No domain field, no pack files,
  no industry switches. Its stage model is V0–V6, its builders are backend,
  frontend, devops and security, its gates are test, typecheck, staging,
  live-verify, its irreversible actions are merge, push, deploy, spend,
  publish.
- **An industry fork** copies the plugin, keeps its name lineage, and
  modifies what the industry needs: the stage model and exit gates, the
  specialist agents, the verification gates, the templates, the done rules,
  the irreversible-action list. It installs from its own marketplace repo,
  which the README already anticipates.
- **What a fork must not touch**: the hooks, the ledger and mission tools,
  the mission and settle commands, the owner-channel and publish-gate
  mechanics. These are the discipline. Keeping them byte-identical is what
  lets a fork merge each base release with no conflicts, the same way
  Missions takes base releases through its pin and contract tests.
- **What the base owes its forks** (small, kernel-side work, no abstraction):
  1. An **MCP-aware guard**: a PreToolUse hook that matches tool names and
     fails closed for any action on a project's irreversible-action list
     (read from the project profile) without a claim token or a dated
     delegation row, exactly as the publish gate does for Bash today. Today
     the guards match Bash, Write and Edit only; MCP and HTTP calls never
     pass through them, and in a non-development loop nearly every action
     is an MCP call. Without this, a fork has no safety boundary.
  2. A **fork file map and merge procedure**: one page naming which files
     are discipline (unchanged in forks) and which are domain (expected to
     change), and the upstream-merge steps; a lint check a fork can run that
     fails when a discipline file differs from the pinned base version. The
     map is one view of the explainer (E7), generated, not written.
  3. The **irreversible-action list as a project-profile row**, not a
     hard-coded set, so a fork declares its own (post, send, pay, CRM
     write) and the guard reads it.
- **Marketing is fork one**, built by XYZ and run on XYZ's own launch (E3):
  the marketing and writer agents, the launch templates and the publish
  pipeline already exist in the base, so the fork's delta is the stage
  model, the gates and the action list. Bookkeeping and lead generation are
  later forks, each a V0 idea gated on a paying client.
- **The cost, stated.** Every base improvement is one merge per fork. At one
  to three forks that is cheap; this flips if forks exceed three or start
  diverging in discipline files, and the owner revisits the split then.

## Workstreams, in execution order

### E0. operate-triage: replan and ship (first, one session, already approved)

The queued mission `operate-triage` is the first half of the unattended V6
loop (support-channel spec; triage, diagnose and digest modes; the triage
tool; one eval scenario). Approved by the plan-judge 2026-10-06, never
started. It goes first: it is the capability behind the managed-operations
retainer; it has the longest calendar lead (`operate-fix`, mission 2, waits
on ten real reports through a channel Orderly must first build from this
spec); and it is one approved session. It needs a **`replan`**, not a run:
the trio targets 1.53.0, taken on 2026-10-07; the engine is at 1.59.0 and
the brief's pre-resolved facts are six releases old. Locked decisions stay
locked. **Orderly is the n=1 venture.** The loop's watch–triage–act–digest
shape is what a fork reuses for its own queue; keep the queue source and
the action set as the only development-specific parts.

### E1. The engine adapts its own ceremony (second)

The workflow decides, per project, which stages, artifacts and gates are
required, optional or unneeded, instead of applying a venture's full
ceremony to everything. **Unify, do not duplicate**: the three altitudes,
the four tune presets, autopilot's check-in level and gate policy, the
intake classifier, `/next`, and the escalation classes E0 ships. One
gate-class taxonomy in one template, read by the loop and the ceremony
profile. The ceremony mechanism reads the stage and gate table from the
protocol template rather than hard-coding V0–V6, so a fork that rewrites
the table gets adaptive ceremony for free; nothing else is generic.

**Done when:** a ceremony profile is derived from observable signals,
written into the project profile, owner-editable; every stage artifact and
gate is tagged required / optional / skipped; a skipped gate leaves one
deviation line and the lint fails on a silently skippable required gate;
every gate carries its class; measured on three real changes across XYZ's
own repos, metric 1 improves for low-ceremony projects with the safety
boundary unchanged; Missions' contract tests still pass.

### E2. Interactive and structured owner surfaces — the client experience (third)

In an engagement the client is the owner: they watch the status page,
answer the gates, read the plain-language journey, receive the loop's
digest and alerts. **Done when:** gates, interview questions, mission state
and the loop's digest and alert leave the engine as structured data
(headline, what changes for the user, risk, estimate, recommended option,
stable option ids, evidence links, gate class); the status page Artifact is
generated from that data, shows the loop's ops state, and lets the owner
record a decision on the page, identity-pinned and nonce-bound, with
irreversible actions never fired from a page; presentable to a paying
client without explanation; the `/plan` interview ships its questions in
the same structure; mission state is readable as JSON and the mission lease
lands; the engine never hooks the question tool.

### E7. The explainer: generated maps of the workflow (fourth)

**Outcome.** Anyone — a prospect, a client, a course learner, a fork
author, a new XYZ session — can see how the workflow is organised and what
it is doing, without reading the protocol document. Every view is
**generated from source** so it is always current: the agent registry
(`tools/agents.mjs --json`, which already carries name, phase, summary,
tools, model and the project's tune), the command and agent files, the
hooks, the protocol template, the distillate schema, and the ledgers.

**The views:**
1. **Organisation chart, with relationships.** The human at the top with
   what only they do (go/no-go, scope, merge, deploy, spend, publish); the
   orchestrator; the roles grouped by the classes the tune presets already
   define (gates, shape, builders, research, record), each with when it
   runs, what it does, what it never does, and its model, runtime and
   effort as tuned for this project. Between agents, **typed
   relationships**, declared in agent frontmatter and carried by the
   registry, drawn as distinct edges:
   - `reports_to` — whose brief this agent works from and who receives its
     distillate (a reporting line; a tree, no cycles);
   - `supervises` — whose output this agent reviews or gates, and with what
     verdict contract (reviewer over builders at a checkpoint; the
     plan-judge over the planner; compass over trajectory);
   - `briefs` — whom this agent hands work to (marketing briefs the writer
     for long-form; mission briefs the planner);
   - `advises` — whom this agent counsels without authority (advisors to
     the human gate; architect memos to the planner);
   - `owns` — the artifacts this agent is the sole writer of (compass owns
     the north star; chronicler owns the catalog rows and the status page;
     analyst owns the tracking plan).
   A fork may declare deeper structures (a marketing lead that briefs and
   supervises a writer and a designer and reports to the orchestrator) and
   the chart renders them as a hierarchy. **The chart is honest about the
   runtime**: today a subagent cannot spawn another, so every reporting
   line is relayed by the orchestrator, which is the only physical spawner.
   Logical lines (who reports to whom) and the physical path (who actually
   spawns whom) are two overlays of the same chart, never conflated.
2. **Message pathways.** Who spawns whom (commands to agents, agents to
   agents: mission to planner to plan-judge; counsel to advisors; checkpoint
   to reviewer), what travels on each edge (a brief with its read budget
   in; a distillate with status, summary, changed paths, gates, deviations
   and next out), the ledger as the shared memory written at every beat,
   the owner channel's three tiers and the decisions that come back, the
   publish gate. The spawn graph is read from a declared `spawns:` field in
   command and agent frontmatter, lint-checked against the prose, not
   inferred from it.
3. **Lifecycle and gates.** The stage table with what each stage produces,
   its exit gate, who verifies it and where the human decides; the three
   altitudes; the mission loop (plan, judge, brief, checkpoint, staging, PR)
   with where each one-shot review fires.
4. **Guardrails.** Each hook: what it matches, what it blocks, which project
   profile row can widen it. This view is also the fork file map (E5).
5. **Live view.** For this project, from the active ledger: the mission,
   the brief in flight, the agent running it, sessions used against the
   estimate, gates pending on the human, the last beat. "What is happening
   now and why."
6. **Trace.** For a mission, an agent or a gate: the brief that asked for
   it, the locked decision behind it, the verdict, the deviation if any.
   `/agentic-workflow:explain <mission | agent | gate>` in the terminal.

**Done when:**
- A tool (`tools/explain.mjs`) renders views 1 to 5 as one HTML page with
  inline SVG from the sources above; the plugin ships no hand-drawn
  diagram.
- The README's agent table and Missions' role roster are generated from, or
  tested against, the registry, so there is one truth for when/does/never
  (today Missions hand-maintains that list and its comment says the plugin
  ships no registry, which has been false since 1.54.0).
- The lint fails when a declared spawn edge has no prose mention or a
  prose mention has no declared edge; when `reports_to` has a cycle; when a
  `supervises` edge names no verdict contract; when an `owns` artifact has
  two owners.
- The page is embedded in the wiki (E3) and the organisation chart plus the
  live view are regions of the project status page (E2).
- A reader who has never seen the protocol answers, from the page alone:
  who does what, who decides, what can never happen, and what is running
  now. Tested with one outsider before E3 publishes it.

### E5. The base owes its forks: MCP-aware guard, fork map, action-list row (fifth, one mission)

The three kernel items above, nothing more. **Done when:** a PreToolUse
hook blocks a listed MCP action without a token or delegation row, with a
harness case per rule; the project profile carries an irreversible-action
row defaulting to the development set; the fork page exists and its lint
check runs; the development behaviour is byte-identical before and after;
hook tests and the eval suite stay green.

### E6. Fork one: marketing, run on XYZ's own launch (sixth)

Fork the plugin as XYZ's marketing workflow. Modify: the stage model
(brief, draft, review, schedule, publish, measure), the specialist agents
(marketing, writer, analyst stay; builders go), the verification gates
(voice check, claim-to-catalog trace, link check), the irreversible-action
list (publish, send, paid spend, CRM write), the templates. Leave the
discipline files untouched. **Done when:** one real cycle of XYZ's launch
marketing runs end to end under the fork — items drafted, gated, fired by
the owner under the publish policy, measured, digested, every beat in the
ledger; the fork's lint check confirms discipline files match the base; one
base release is merged into the fork without conflict.

### E3. The plugin's public front: landing, services, wiki (seventh)

Produced by the E6 loop. A landing page and marketing pages from the base's
launch templates; the explainer (E7) as the "how it works" page and the
"your AI team" visual on the services page; a **services page** with six offers (development
engagement; **industry adaptation**: XYZ forks the workflow for your
industry and business, with the marketing fork as the worked example;
managed operations for a built app; a managed non-development loop,
starting with marketing; technical consulting on adopting agentic
operations; training), each with an enquiry path into XYZ's existing
pipeline; a wiki generated from the protocol sources with a drift check; a
recorded demo. Blocker first: derive a curated feature catalog or record a
dated amendment that the README stands in.

### E4. The revenue layer (eighth, V0 first)

Six offers, one idea doc each, cheapest test before any full build; the
owner sets every price. Development engagements: two priced proposals.
Industry adaptation: one priced proposal to a prospect in an industry XYZ
has not forked yet, scoped as fork + one running loop + hand-over, with the
marketing fork as proof; it is the highest-ticket offer and the one the
fork model exists to sell. Managed operations: the Orderly loop for one month, priced against measured
founder minutes. Managed marketing loop: one client's calendar for one
month on the marketing fork. Consulting: two priced conversations.
Education: one free module then a paid follow-on. Riskiest assumption for
all: prospects pay XYZ rather than just install the free plugin.

### M. Missions follows the engine (continuous, small)

Not a build track. After each engine release: bump the vendor pin, run the
contract tests, fix what the engine change forced, nothing else. When E7
ships, Missions' Agents screen reads the registry and drops its
hand-maintained roster. Today
Missions pins 1.54.1 against an engine at 1.59.0. Missions' non-technical
operator is exactly the user of an industry fork; pointing Missions at a
fork instead of the base is a later Missions plan, not this goal's work.

## Ordering and dependencies

E0 first: one session, approved, longest lead time. E1 second. E2 third;
E1 and E2 ship as engine versions Missions then pins. E7 fourth: the
explainer, which a fork author needs before forking and E3 needs to
publish. E5 fifth: kernel work every fork needs, byte-identical development
behaviour. E6 sixth: the first fork, proven on XYZ's own launch work. E3
seventh, produced by E6 and carrying E7. E4's tests
start as soon as E3 is up; services proposals can go out earlier if a
prospect appears. `operate-fix` is scheduled by its own precondition.

This flips if a paying client for a non-development loop appears before
E1: then do E5 immediately (it needs nothing from E1 or E2) and fork for
that client's industry first.

## Constraints that bind every workstream

- The plugin is open source and stays so; the paid layer is services,
  managed operations and education.
- The safety boundary generalises but never weakens: every project names
  its irreversible actions, and every one is human-fired or covered by a
  dated, scoped delegation row, with a mechanical fail-closed guard. The
  compliance frame is untouched.
- Publishing outward, every proposal and every price are human-fired.
- A fork never edits discipline files; base improvements flow fork-ward by
  merge, never the other way except as a PR to the base.
- Each workstream is its own `/agentic-workflow:plan` then mission with its
  own estimate and overrun stop. This document is the umbrella, recorded in
  the portfolio registry and as the plugin's north-star Purpose.
- Locked decisions in an existing trio stay locked through a replan.
- Engine changes never break Missions' contract; each engine release ends
  with the Missions pin bump.

## Open questions for the owner before starting

1. **Which revenue path leads**, with a number and a date.
2. **Who sells**, and how many engagements XYZ can serve at once.
3. **Fork one.** Marketing on XYZ's own launch (recommended), or a paying
   client's industry if one is in hand?
4. **Delegation defaults per fork.** Bookkeeping: approve every entry until
   delegated? Marketing: organic posts delegable, paid never (as today)?
5. **Course shape and host.**
6. **E1 fallback posture** when signals are ambiguous: full ceremony or lean?
7. **Catalog**: derive one for the plugin, or amend the landing-template rule?

---

## Amendment, 2026-10-12 (owner, same day): the control plane is Missions, built as a Paperclip distribution

Recorded after a comparison with Paperclip (paperclipai/paperclip, MIT), the
open-source company-of-agents control plane: org chart with reporting lines,
heartbeats, per-agent budgets, runtime-enforced review and approval stages,
task watchdogs, a plugin SDK, and a distribution catalog for shipping
prebuilt plugins inside a custom image. These decisions supersede E5–E7's
"fork obligations" framing and the Missions track above where they conflict.

### Decisions

1. **No control plane from scratch, and no multi-industry abstraction in the
   plugin.** The company layer is a fork of Paperclip kept as a
   **distribution**: upstream core untouched; XYZ additions shipped as
   Paperclip plugins through its distribution catalog; branding limited to a
   small, listed file set (logo, title, design tokens, the server-side
   branding seam); rebased on each Paperclip release. Paperclip's maintainers
   do not accept rebranding upstream (their review on a downstream fork says
   so), and no theming switch exists upstream (the white-label pull request,
   number 9000, closed unmerged on 2026-09-22), so branding is fork work by
   their own rule. Renaming every internal string is an anti-goal; brand the
   shell only.
2. **The product keeps the Missions name and becomes two layers plus a
   client.**
   - **Missions server** — the Paperclip distribution, in a **new
     repository**: companies, agents, missions (Paperclip's issues, renamed
     in the UI layer only; Paperclip's own "mission", a company goal,
     becomes "goal"), approvals, budgets, the web UI, and the accounts and
     machine list the current Missions service holds today, which it
     absorbs.
   - **Missions runner** — the existing `packages/runner` in the Missions
     monorepo, shipped **standalone** (CLI or background service, no
     Electron; Windows and Linux land here). It is the only place that
     launches unmodified Claude Code with the plugin directory and the gate
     hook attached, so it is where the compliance frame and the safety
     boundary live. The server hires it through Paperclip's process or HTTP
     adapter, never through Paperclip's Claude Code adapter.
   - **Missions desktop** — the founder's client of the server: gate cards,
     plain-language translation, the composer, Release. It migrates to the
     server when the server can serve gate cards; the pilot is not stopped
     for this. Runner and desktop are one Electron package today, so the
     split costs no code now.
3. **Why not Paperclip's own Claude Code adapter.** Under it, Claude Code
   hooks do not run: user settings are skipped (paperclip issue 6483), and on
   a managed AI connection a per-run temporary home loads no user or project
   settings and a settings override is refused (issue 15417, filed against
   Paperclip 2026.1001.0). Paperclip governs at the ticket layer; it does
   not watch tool calls. If a hooks pass-through lands upstream, this
   decision is revisited.
4. **Brakes become runtime-agnostic**, because Paperclip supports many
   runtimes and a Claude-only hook is not a brake there. The safety boundary
   is expressed as: Paperclip approvals and execution policy at the ticket
   layer; a sandbox per run; scoped credentials so an agent cannot push to
   main or post without a token it does not hold; gate tools that mint a
   one-time claim before any irreversible action (the publish gate's design,
   finished). Claude hooks stay as an extra layer when the runtime is
   Claude. This replaces E5's "MCP-aware guard" item.
5. **Industry forks of the plugin are departments hired into the server.**
   The fork rule (discipline files untouched) stands; the multi-department
   layer is Paperclip's, so the plugin never builds one.
6. **The explainer splits.** The generated map (organisation, typed
   relationships, pathways, gates, guardrails, live view, trace) stays in the
   plugin for terminal users. The richer org chart renders as a Missions
   server plugin reading the same registry.
7. **Three ideas borrowed into the plugin regardless:** refuse to mark a
   checkpoint row done without a recorded reviewer verdict (a block, not a
   nag); a consecutive agent-to-agent review-round cap with human escalation
   at every checkpoint; a decision record per verdict with actor, outcome and
   run id, in Paperclip's shape so the ledger and a Missions company agree.
8. **Dependency rule, unchanged and now binding three repos.** The Missions
   server and runner depend on the plugin at a pinned version through the
   runner's vendor pin and contract tests. The plugin never references,
   imports or assumes either. Orderly and every other venture see no change
   unless they later choose to run through the server.
9. **Timing.** The server repository's V0 idea doc can be written any time
   (riskiest assumption: a Paperclip user will pay XYZ for a configured
   distribution rather than configure Paperclip themselves; cheapest test:
   XYZ's own departments on it, then one outside prospect). The build starts
   after `operate-triage` and adaptive ceremony (E0, E1) ship, so it does not
   compete with them for the owner's sessions.
10. **Naming closed.** Missions keeps its name across server, runner and
    desktop. Candidates considered and dropped, with the reason: Firm
    (viable, superseded by reusing Missions), Bureau, Flow and Mission Flow
    (collide with "Agentic Workflow" and with the mission noun), Works
    (Thoughtworks' Agent/works, June 2026, same category), Vector, Tether,
    Synapse, Core, Infrastruxure (Schneider Electric trademark), Isotope,
    Nodal, Truss (all taken in or next to this category), Affine (AFFiNE,
    same audience), Pipeline (CI and sales meanings), Protocol (the method's
    own word). Open: whether the method takes "The XYZ Protocol" as its
    public name with the `agentic-workflow` slug unchanged.

### Effect on the workstreams above

- E5 becomes: runtime-agnostic brakes (decision 4) + the runner's adapter
  contract and standalone build. The fork file map stays as an explainer
  view.
- E6 (the marketing fork) is hired into the Missions server as a department.
- E7 keeps the plugin's generated map; the org-chart UI moves to a server
  plugin.
- The Missions track gains the server repository as its own venture with its
  own V0, gated as in decision 9.
