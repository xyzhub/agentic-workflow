# Agentic Workflow

An **agentic operating protocol** that carries any project from a raw idea to
a launched, viable product — and keeps operating it after launch. Packaged as
a Claude Code plugin: 20 agents, 27 commands, guardrail hooks, a protocol
document every project carries, and an eval suite that tests the prompts
themselves.

**New here? Type `/agentic-workflow:welcome`** — one guided door that orients
you, figures out where your project stands, and takes you all the way to filled
project docs (guided step-by-step, or hands-off). Everything below is the map it
walks you through.

Not a dev-loop methodology: a full **venture lifecycle** with enforced gates,
role boundaries, a permanent record, an owner channel to your phone, and a
portfolio layer for running many ventures at once.

## Philosophy

1. **Gates, not aspirations.** UX, DX, Security, and Efficiency are checked at
   every checkpoint by a fresh-context reviewer and audited before launch —
   not listed in a values doc.
2. **Builders build, judges judge, the human fires.** No agent reviews its own
   work; no agent merges, deploys, spends, publishes, or destroys. Delegation
   exists (see below) but is always an explicit, dated, scoped human act —
   never inferred.
3. **The record is files.** Ledgers, decision logs, journey narratives, status
   pages — versioned, greppable, reviewable by PR. Any fresh agent resumes
   from files alone; losing a transcript never loses the venture. A database
   may only ever be an accelerator, never the record.
4. **Prose rules get mechanical backstops.** Anything an autonomous agent must
   obey under pressure is enforced by hooks, lint, or evals — not by hoping
   the prompt is read carefully. The hooks block pushes to the default branch
   (including refspec tricks) and undelegated PR merges, fail closed.
5. **Evidence over ceremony.** Review cost is spent deliberately: single
   reviewer at routine checkpoints, adversarial multi-vote only at the two
   highest-stakes gates. Work is routed to the smallest altitude that fits —
   a typo never gets a mission.
6. **Conclusions, not corpora.** Agents ingest distilled results, briefs
   pre-resolve reads, gates return signals not logs, exploration happens once
   in planning — token discipline as architecture, not as an afterthought.
7. **Persuasion through value, never manipulation.** The UX pillar bans dark
   patterns constitutionally: no fabricated scarcity, no confirm-shaming, no
   gambling-schedule rewards; behavioral experiments on real users are a
   human gate.
8. **The loop improves the loop.** Retros amend the protocol via PR like any
   code; field failures become fixes plus eval scenarios. This repo runs its
   own workflow — every rough edge documented here was found by dogfooding.

## Start here (three doors)

| You have | Run | What happens |
|---|---|---|
| A raw idea | `/agentic-workflow:autopilot "<idea>"` | Drives V0→V5 hands-off; pauses only at the gates you must own |
| An existing project | `/agentic-workflow:adopt` | Bootstraps the profile, folds in your plans, hands you a gap report |
| Neither / lost | `/agentic-workflow:next` | Reads the repo, recommends exactly ONE next command |

Then the daily loop is just: `/agentic-workflow:start` → build → `/agentic-workflow:end` → PR → you merge.
`/agentic-workflow:fix` for small things, `/agentic-workflow:mission "<goal>"` for big ones, `/agentic-workflow:next` whenever
you're unsure. Every adopted project carries a one-screen **Quick reference**
at the top of its `docs/WORKFLOW.md`.

## The lifecycle

**V0 validate** (evidence for AND against, human go/no-go) → **V1 define**
(PRD, journeys, stack memos, business model — human approves scope) →
**V2 foundation** (CI, deploy pipeline, fail-closed env guard — hello-world
live) → **V3 build** (feature by feature, checkpoint-reviewed) →
**V4 harden** (four pillar audits, adversarial multi-vote) → **V5 launch**
(verified on the deployed instance; the human publishes and deploys) →
**V6 operate** (the weekly loop: errors, funnel, costs, economics).

## The agents

Every agent carries a hard boundary — what it *never* does is as load-bearing
as what it does.

| Agent | When | Does | Never |
|---|---|---|---|
| `intake` | Front door | Classifies an un-invoked plain-language work request by altitude (raw idea / feature / small fix / unsure), shapes it, and returns the matching `/agentic-workflow:` route for the orchestrator to run | Runs commands; spawns agents; builds; merges |
| `brainstormer` | V0 (front) | Shapes a raw idea — 2–3 genuinely distinct framings (the bet, who pays, riskiest assumption, case against each) for the human to pick; seeds `idea.md` | Validates with evidence; decides; designs; builds |
| `researcher` | V0 | Validates the chosen framing — cited evidence for AND against, riskiest assumption, kill criteria; fills `idea.md` | Decides go/no-go; writes product code |
| `designer` | V1–V2, V4 | Brand directions to choose from; user journeys + IA; design tokens + copy kit; V4 heuristic usability pass | Decides (the owner picks); ships production UI |
| `architect` | V1, missions | Shape-before-build option memos (stack, data model: 2–3 options, tradeoffs, reversal cost); digests technical open questions | Implements; sets scope; verifies |
| `business` | V1, V4–V5, V6 | Business model, pricing, executive summary — proposes with evidence and the case against | Sets live prices; spends; signs up for services |
| `planner` | Missions | Decomposes a decided mission into the `.plans/` trio; explores once so execution sessions never do | Decides scope; executes |
| `advisor` | Human gates | Decision red-team via `/agentic-workflow:counsel` — lens-partitioned (technical/market/financial/behavioral), argues the strongest case AGAINST | Decides; blocks; edits the artifacts it critiques |
| `marketing` | V5–V6 | Positioning, landing copy, per-channel announcements, content plan — every claim traces to shipped behavior | Publishes, posts, or sends anything |
| `ops` | V6 | Error/cost triage ranked by user impact, runbook truth, postmortems → ranked mission candidates | Mutates production (read-only against prod) |
| `analyst` | V3+ | Tracking plan; cited numbers for funnel/economics/audits; behavioral hypotheses with the cheapest test each | Invents a number (unmeasured stays "unmeasured"); edits code |
| `compass` | Strategic beats | Owns `docs/product/north-star.md`; judges trajectory-vs-purpose; on a concrete named drift fires ONE gated Alert-tier §12 owner notification (severity + frequency limited) | Decides; kills/greenlights; builds; merges (purpose is the human's call) |
| `writer` | Optional | Copy kit/glossary owner; convened for copy-heavy slices (landing, UI strings, long-form) | Publishes; defines brand voice; owns positioning |
| `reviewer` | Checkpoints | Fresh-context review — four pillars + QA + architecture; APPROVE / REQUEST CHANGES + scorecard; re-runs all gates itself | Merges; pushes; edits code; trusts a handoff claim |
| `chronicler` | Session close, checkpoints | The catalog's `features.md` rows (rewritten in place) + derived files, then CHANGELOG, the JOURNEY narrative, the live owner status page | Touches product code; re-reads source "to verify"; writes a `benefit` (marketing's column) |
| `backend` | Build | Server-side slices — data integrity, idempotency, additive migrations | Self-approves; merges |
| `frontend` | Build | UI slices — owns the UX pillar; verifies in a real browser | Self-approves; introduces parallel styling systems |
| `security` | Hardening | Fail-closed config guards, auth, rate limits, secret handling, CI pinning — and proves each guard blocks | Marks its own work approved |
| `devops` | V2, V5 | CI/CD, deploy config, releases, rollback — prepares the path to production | Fires irreversible deploys or merges |
| `curator` | Portfolio (§13) | Owns the commons lifecycle — harvests reusable first-party material, brokers the single-best-match (k=1), keeps entries fresh, routes improvements back as delegable bookkeeping PRs | Decides product direction; ships product code into a venture; merges |

Model tiering: `chronicler`, `analyst`, and `writer` default to a mid-tier
model (the Efficiency pillar applied to the plugin itself); `/agentic-workflow:tune` overrides
any agent's model per project, reversibly.

Design-facing agents (`designer`, `frontend`, the reviewer's UX lens)
auto-detect **impeccable** — Paul Bakaus's design-quality plugin (Apache-2.0,
github.com/pbakaus/impeccable) — and apply its rules when it is installed
alongside the workflow; when it isn't, they proceed exactly as today.

## The commands

**Entry doors**

| Command | Does |
|---|---|
| `/agentic-workflow:welcome` | 👋 **Start here.** One guided door: orients you, detects where the project stands, then walks you through it or drives it hands-off — filling the real docs as you go |
| `/agentic-workflow:brainstorm` | Shape a raw, fuzzy idea into a chosen direction: light interview → the brainstormer drafts distinct framings → you pick one → seeds `idea.md` for the researcher to validate |
| `/agentic-workflow:bootstrap` | Detect the stack, write `docs/WORKFLOW.md` with a filled §10 profile, seed the records |
| `/agentic-workflow:adopt` | One-command adoption of an existing project: bootstrap + convert existing plans into mission trios (decisions arrive locked) + stage-gap report; portfolio registration always runs; `fill` also drafts missing product docs |
| `/agentic-workflow:autopilot` | Drive an idea (or an existing repo — it adopts first) to launch-ready from a one-page flight plan, pausing only at human gates |
| `/agentic-workflow:next` | Zero-knowledge router: reads the repo, returns exactly one copy-pasteable command with real values |

**Daily loop**

| Command | Does |
|---|---|
| `/agentic-workflow:start` | Open a session: name the stage, route the altitude, branch, load context |
| `/agentic-workflow:end` | Close cleanly: gates green, commit, chronicler updates the record, push, hand off |
| `/agentic-workflow:pr` | Run every gate (tests, lint, build, docs, live verification), then push and open the PR |
| `/agentic-workflow:fix` | Task-altitude fast path for a small isolated fix |
| `/agentic-workflow:check` | Traffic-light health check: branch, commits, ledger, stage, protocol drift |
| `/agentic-workflow:handoff` | Snapshot the live session's working state to a re-read manifest so a fresh agent continues without the diluting auto-summary (§6.2) — mid-session, git-independent, pointers not corpora |

**Scale & gates**

| Command | Does |
|---|---|
| `/agentic-workflow:plan` | Feature front door: interactive interview → the team drafts brief/journeys/memos/metrics → counsel → ONE approval → the planner's trio, ready to run |
| `/agentic-workflow:mission` | Plan + drive a mission — **one session and one one-shot review by default**; `phases` opts into a multi-phase trio (master plan · session briefs · ledger) with an honest `Estimate:` and a hard 1.5× overrun stop; every phase lands via **staging → verify → PR to main**; `continue` resumes from the ledger, `replan` reconciles it with reality; loop-drivable |
| `/agentic-workflow:counsel` | Convene 2–3 lens-partitioned advisors on a pending decision → one-page brief in the decision log |
| `/agentic-workflow:audit` | The V4 adversarial multi-vote on demand: lens-partitioned fresh reviewers, conservative merge, findings ranked and routed |
| `/agentic-workflow:release` | Cut a version on a release branch: changelog, PR, and the post-merge tag commands — the human fires them |
| `/agentic-workflow:verify` | Post-deploy verification on the deployed instance: drive the real flow, confirm monitoring receives, record the result |
| `/agentic-workflow:settle` | Probe every deferred obligation (`.plans/OBLIGATIONS.md` + mission ledgers' `## Closing`), fire the condition-met safe class — merged-branch and worktree reaping behind the deploy-green gate, never `-D` — surface what a probe can't prove, and refuse to close a mission while `[ ]` rows remain |
| `/agentic-workflow:operate` | The V6 loop: analyst numbers → ops/marketing/business reviews → one report with a ranked backlog; in a registry repo it sweeps the whole portfolio |
| `/agentic-workflow:publish` | The §14 publishing pipeline: connect channels, stage posts into the queue (marketing/writer), then fire — human-fired by default, or a scheduled run within a scoped, revocable `may-publish` delegation; paid always human-fired |
| `/agentic-workflow:groom` | Keep the queue true: probe every open issue against the tree, close what shipped (quoted evidence), flag stale, re-size, regenerate the backlog view; sweeps the repo for hand-written queue files (≥3 unticked checkboxes, or named backlog/todo/roadmap/punchlist/triage/ideas — ledgers, the obligations register and records excluded), confirms per file, and imports them into the tracker once — `--from` only overrides the path |
| `/agentic-workflow:retro` | Turn lessons into protocol amendments, eval scenarios, hook proposals — filed as issues in the queue — via PR like any change |

**Machinery**

| Command | Does |
|---|---|
| `/agentic-workflow:doctor` | Machinery diagnosis: environment tools (codegraph, ripgrep, jq, gh), §10 truthfulness (rows must RESOLVE), records, orphaned ledgers; `fix` installs missing dev tools and repairs provably-wrong rows |
| `/agentic-workflow:tune` | Upgrade an underperforming agent's model per project (shadow copy in `.claude/agents/`); `reset` restores the default |
| `/agentic-workflow:connect` | Interactive owner-channel setup (Telegram or Slack): guided steps, auto-discovered IDs, a proven round-trip test |
| `/agentic-workflow:sync` | Conform a project to the installed plugin: re-copy the protocol master (§10 + Local amendments preserved verbatim) and apply the structure ladder (`tools/conform.mjs`) — missing §10 rows, ledger budget fields, roadmap epic view, catalog tooling/files; hands off to `groom`/`adopt` for what needs the tracker or a seed |
| `/agentic-workflow:ingest` | Harvest a reusable first-party artifact into the §13 portfolio **commons**: copy it into the registry repo under `commons/code/<slug>/`, pin provenance, write its index entry — a delegable bookkeeping PR |

## What an adopted project carries

```
docs/WORKFLOW.md            # the protocol copy: Quick reference, §0–§13,
                            # YOUR §10 profile, Local amendments (survive /sync)
docs/product/               # idea.md · prd.md · ux-brief.md · architecture.md ·
                            # interface-contract.md · JOURNEY.md · overview.html
                            # (live status page) · business/ · launch/
                            # (assets · publish-queue.md · publish-log.md) ·
                            # decisions/ (memos) · roadmap.md (epic view only)
docs/product/catalog/       # WHAT THE PRODUCT IS (state, not history — §6.1):
                            # api.md + data-model.md derived by tools/catalog.mjs
                            # (git diff = the API/model change log), features.md
                            # curated + rewritten in place (marketable rows are
                            # the landing-page/sales fact source), README.md ≤40 lines
tools/catalog.mjs           # shipped by the plugin: generate · --check · --verify
.plans/                     # one trio per mission + pending-gates
CHANGELOG.md                # Keep-a-Changelog, chronicler-maintained (history)
.env.example                # var names for the owner channel etc. (never values)
```

**The queue** lives in the §10 issue tracker (GitHub Issues via `gh`), labelled
`type/*` `size/*` `epic/*`; markdown backlogs are generated views
(`/agentic-workflow:groom`), the roadmap holds epics only. **The catalog** is what
every fresh session reads before it builds: `/agentic-workflow:start`, the planner's
briefs, the builders and the compact-resume directive all point at it; the
reviewer REQUEST CHANGES a route/schema/anchor change that leaves it stale;
marketing writes landing and launch copy from its `marketable: yes` rows — never
from the CHANGELOG.

## The owner channel

A private Telegram or Slack DM (set up in minutes with `/agentic-workflow:connect`):
**outbound** gate/alert/digest notifications — never routine progress;
**inbound** tap-to-decide — Telegram inline buttons or Slack emoji reactions
on the gate message, nonce-bound, identity-pinned, single-use, fail-closed.
Decision gates resolve by tap; **action** gates (merge, deploy, spend,
publish) always arrive as links you fire where they live. Every channel
decision lands in the decision log.

## The portfolio

One owner, many ventures (§13): a **registry repo** — files + git, never a
database — holds one row per venture, a portfolio ledger, cross-venture
precedent pointers, and a portfolio status page. `/agentic-workflow:operate` run there sweeps
every venture into one report with a single ranked backlog. Registry
bookkeeping merges are the ONE delegable merge scope (owner-granted, recorded,
hook-enforced); everything else stays human.

## Guardrails (hooks, always on)

Blocks pushes to or refspecs targeting the default branch; blocks PR merges
unless the target repo's §10 Merge policy delegates them (fail closed); warns
on tag pushes that may deploy; reminds on commit format, gates, and doc
updates for high-impact files; nudges toward a ranged read or a delegating
subagent when a whole-file read targets a large file — a discipline line,
not a measured one, since this repo has no corpus to confirm an effect size.
Checks evaluate in the command's **target repo** and read pre-execution
state.

Seven **governance reflexes** (advisory, never block) keep a session on the
protocol without it being read: the **router** nudges an un-prefixed work request
to route through the workflow (hand to `intake`); the **mission-budget** hook
(supersedes the thread-keeper) surfaces the active ledger's `session k/N` +
its first `Next up:` each turn and becomes the 🛑 OVERRUN stop once sessions
reach 1.5× the planner's estimate — the orchestrator must give the owner a
scope decision before building on (§5); the
**conform-check** tells a session, once, when the project's structure is behind
the installed plugin (stale stamp, missing §10 rows, ledgers without budget
fields, no roadmap/catalog, hand-written backlog) and points at
`/agentic-workflow:sync`, which applies the same ladder; the
**beat-enforcer** nudges a not-started ledger beat (`chronicler` at
close, `reviewer` at a checkpoint) at the moment you try to close or advance —
stepping over beats that aren't due (held, or behind unfinished work or an
unreleased blocker) to reach the first one that is; **compact-resume** fires after a
context compaction and is never silent: with an active ledger it re-reads the
ledger verbatim; otherwise it falls back to `docs/product/session-handoff.md`,
stating its freshness, or — with neither record — names `git log`, `git status`
and `.remember/now.md` and flags the gap to the human; **handoff-budget**
nudges once cumulative transcript bytes — a loose proxy, never a token
measurement — cross an advisory or urgent band, telling the session to
write/refresh `docs/product/session-handoff.md` before compaction takes the
window; and **obligations-due** surfaces, once per session at session start
(never after a compaction — compact-resume owns that beat), how many deferred
obligations sit unticked in `.plans/OBLIGATIONS.md` and mission-ledger
`## Closing` blocks, naming the oldest row and `/agentic-workflow:settle` —
grep-only, no network, no conditions probed.

## What the human always owns

Merges to the default branch (unless §10 delegates them — itself a human
act), production deploys, spending, outward publishing, behavioral
experiments on real users, anything destructive. **Agents prepare; you
fire.** Autopilot batches these into the fewest, best-informed confirmations.

## How it stays project-agnostic

The bundled protocol (`templates/WORKFLOW.md`) carries a **Project Profile
(§10)** placeholder — gates, deploy, HITL, merge policy, owner channel,
portfolio. `/agentic-workflow:bootstrap` fills it per project; the local copy wins over the
bundled master. The copy carries a version stamp; `/agentic-workflow:check` flags drift and
`/agentic-workflow:sync` upgrades it while preserving everything project-owned. Nothing about
any one stack is baked in.

## Loop-drivable by design

The ledger is the state, so long work runs as recurring ticks:
`/loop /mission "<name>" continue`, `/loop /autopilot continue`, or a weekly
scheduled agent running `/agentic-workflow:operate`. One brief or stage boundary per tick —
crash-safe by construction, gates reaching your phone instead of blocking
silently. A `/loop` tick does *not* reset the context window: `/loop` is
session-scoped, and ticks accrete in the same transcript; genuine fresh
context requires `/clear`, a new session, or a scripted `claude -p`. What
makes loop mode safe is that state lives in files — any tick can be run from
a fresh context without losing anything.

## Install

```
/plugin marketplace add xyzhub/agentic-workflow      # or your fork's repo
/plugin install agentic-workflow@xyz
```

Then in any project: `/agentic-workflow:adopt` (existing), `/agentic-workflow:bootstrap` (fresh), or
`/agentic-workflow:autopilot "<idea>"` (hands-off). Try locally first:

```
claude --plugin-dir ./plugins/agentic-workflow
```

## Development

Two test tiers: `node tools/lint.mjs` (free, deterministic — manifests,
frontmatter YAML safety, cross-references, § integrity, hook syntax; CI runs
it every push) and `node evals/run.mjs` (LLM-judged scenario evals against
fixture repos — costs real tokens, gates releases). See `evals/README.md`.
Merging to `main` IS the release; every version-stamped commit is one.

## License

MIT.
