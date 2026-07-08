# Agentic Workflow

An **agentic operating protocol** that carries any project from a raw idea to
a launched, viable product — and keeps operating it after launch. Packaged as
a Claude Code plugin: 16 agents, 20 commands, guardrail hooks, a protocol
document every project carries, and an eval suite that tests the prompts
themselves.

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
| A raw idea | `/autopilot "<idea>"` | Drives V0→V5 hands-off; pauses only at the gates you must own |
| An existing project | `/adopt` | Bootstraps the profile, folds in your plans, hands you a gap report |
| Neither / lost | `/next` | Reads the repo, recommends exactly ONE next command |

Then the daily loop is just: `/start` → build → `/end` → PR → you merge.
`/fix` for small things, `/mission "<goal>"` for big ones, `/next` whenever
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
| `researcher` | V0 | Validates the idea — cited evidence for AND against, riskiest assumption, kill criteria; drafts `idea.md` | Decides go/no-go; writes product code |
| `designer` | V1–V2, V4 | Brand directions to choose from; user journeys + IA; design tokens + copy kit; V4 heuristic usability pass | Decides (the owner picks); ships production UI |
| `architect` | V1, missions | Shape-before-build option memos (stack, data model: 2–3 options, tradeoffs, reversal cost); digests technical open questions | Implements; sets scope; verifies |
| `business` | V1, V4–V5, V6 | Business model, pricing, executive summary — proposes with evidence and the case against | Sets live prices; spends; signs up for services |
| `planner` | Missions | Decomposes a decided mission into the `.plans/` trio; explores once so execution sessions never do | Decides scope; executes |
| `advisor` | Human gates | Decision red-team via `/counsel` — lens-partitioned (technical/market/financial/behavioral), argues the strongest case AGAINST | Decides; blocks; edits the artifacts it critiques |
| `marketing` | V5–V6 | Positioning, landing copy, per-channel announcements, content plan — every claim traces to shipped behavior | Publishes, posts, or sends anything |
| `ops` | V6 | Error/cost triage ranked by user impact, runbook truth, postmortems → ranked mission candidates | Mutates production (read-only against prod) |
| `analyst` | V3+ | Tracking plan; cited numbers for funnel/economics/audits; behavioral hypotheses with the cheapest test each | Invents a number (unmeasured stays "unmeasured"); edits code |
| `writer` | Optional | Copy kit/glossary owner; convened for copy-heavy slices (landing, UI strings, long-form) | Publishes; defines brand voice; owns positioning |
| `reviewer` | Checkpoints | Fresh-context review — four pillars + QA + architecture; APPROVE / REQUEST CHANGES + scorecard; re-runs all gates itself | Merges; pushes; edits code; trusts a handoff claim |
| `chronicler` | Session close | CHANGELOG, the JOURNEY narrative, the live owner status page | Touches product code; re-reads source "to verify" |
| `backend` | Build | Server-side slices — data integrity, idempotency, additive migrations | Self-approves; merges |
| `frontend` | Build | UI slices — owns the UX pillar; verifies in a real browser | Self-approves; introduces parallel styling systems |
| `security` | Hardening | Fail-closed config guards, auth, rate limits, secret handling, CI pinning — and proves each guard blocks | Marks its own work approved |
| `devops` | V2, V5 | CI/CD, deploy config, releases, rollback — prepares the path to production | Fires irreversible deploys or merges |

Model tiering: `chronicler`, `analyst`, and `writer` default to a mid-tier
model (the Efficiency pillar applied to the plugin itself); `/tune` overrides
any agent's model per project, reversibly.

## The commands

**Entry doors**

| Command | Does |
|---|---|
| `/bootstrap` | Detect the stack, write `docs/WORKFLOW.md` with a filled §10 profile, seed the records |
| `/adopt` | One-command adoption of an existing project: bootstrap + convert existing plans into mission trios (decisions arrive locked) + stage-gap report; portfolio registration always runs; `fill` also drafts missing product docs |
| `/autopilot` | Drive an idea (or an existing repo — it adopts first) to launch-ready from a one-page flight plan, pausing only at human gates |
| `/next` | Zero-knowledge router: reads the repo, returns exactly one copy-pasteable command with real values |

**Daily loop**

| Command | Does |
|---|---|
| `/start` | Open a session: name the stage, route the altitude, branch, load context |
| `/end` | Close cleanly: gates green, commit, chronicler updates the record, push, hand off |
| `/pr` | Run every gate (tests, lint, build, docs, live verification), then push and open the PR |
| `/fix` | Task-altitude fast path for a small isolated fix |
| `/check` | Traffic-light health check: branch, commits, ledger, stage, protocol drift |

**Scale & gates**

| Command | Does |
|---|---|
| `/plan` | Feature front door: interactive interview → the team drafts brief/journeys/memos/metrics → counsel → ONE approval → the planner's trio, ready to run |
| `/mission` | Plan + drive multi-session work: the planner authors a `.plans/` trio (master plan · session briefs · ledger), then phases execute with independent checkpoint reviews; `continue` resumes from the ledger, `replan` reconciles it with reality; loop-drivable |
| `/counsel` | Convene 2–3 lens-partitioned advisors on a pending decision → one-page brief in the decision log |
| `/audit` | The V4 adversarial multi-vote on demand: lens-partitioned fresh reviewers, conservative merge, findings ranked and routed |
| `/release` | Cut a version on a release branch: changelog, PR, and the post-merge tag commands — the human fires them |
| `/verify` | Post-deploy verification on the deployed instance: drive the real flow, confirm monitoring receives, record the result |
| `/operate` | The V6 loop: analyst numbers → ops/marketing/business reviews → one report with a ranked backlog; in a registry repo it sweeps the whole portfolio |
| `/retro` | Turn lessons into protocol amendments, eval scenarios, hook proposals — via PR like any change |

**Machinery**

| Command | Does |
|---|---|
| `/doctor` | Machinery diagnosis: environment tools (codegraph, ripgrep, jq, gh), §10 truthfulness (rows must RESOLVE), records, orphaned ledgers; `fix` installs missing dev tools and repairs provably-wrong rows |
| `/tune` | Upgrade an underperforming agent's model per project (shadow copy in `.claude/agents/`); `reset` restores the default |
| `/connect` | Interactive owner-channel setup (Telegram or Slack): guided steps, auto-discovered IDs, a proven round-trip test |
| `/sync` | Upgrade a project's protocol copy to the installed master — §10 and Local amendments preserved verbatim, new profile rows reconciled |

## What an adopted project carries

```
docs/WORKFLOW.md            # the protocol copy: Quick reference, §0–§13,
                            # YOUR §10 profile, Local amendments (survive /sync)
docs/product/               # idea.md · JOURNEY.md · overview.html (live status
                            # page) · business/ · launch/ · decisions/ (memos)
.plans/                     # one trio per mission + pending-gates
CHANGELOG.md                # Keep-a-Changelog, chronicler-maintained
.env.example                # var names for the owner channel etc. (never values)
```

## The owner channel

A private Telegram or Slack DM (set up in minutes with `/connect`):
**outbound** gate/alert/digest notifications — never routine progress;
**inbound** tap-to-decide — Telegram inline buttons or Slack emoji reactions
on the gate message, nonce-bound, identity-pinned, single-use, fail-closed.
Decision gates resolve by tap; **action** gates (merge, deploy, spend,
publish) always arrive as links you fire where they live. Every channel
decision lands in the decision log.

## The portfolio

One owner, many ventures (§13): a **registry repo** — files + git, never a
database — holds one row per venture, a portfolio ledger, cross-venture
precedent pointers, and a portfolio status page. `/operate` run there sweeps
every venture into one report with a single ranked backlog. Registry
bookkeeping merges are the ONE delegable merge scope (owner-granted, recorded,
hook-enforced); everything else stays human.

## Guardrails (hooks, always on)

Blocks pushes to or refspecs targeting the default branch; blocks PR merges
unless the target repo's §10 Merge policy delegates them (fail closed); warns
on tag pushes that may deploy; reminds on commit format, gates, and doc
updates for high-impact files. Checks evaluate in the command's **target
repo** and read pre-execution state.

## What the human always owns

Merges to the default branch (unless §10 delegates them — itself a human
act), production deploys, spending, outward publishing, behavioral
experiments on real users, anything destructive. **Agents prepare; you
fire.** Autopilot batches these into the fewest, best-informed confirmations.

## How it stays project-agnostic

The bundled protocol (`templates/WORKFLOW.md`) carries a **Project Profile
(§10)** placeholder — gates, deploy, HITL, merge policy, owner channel,
portfolio. `/bootstrap` fills it per project; the local copy wins over the
bundled master. The copy carries a version stamp; `/check` flags drift and
`/sync` upgrades it while preserving everything project-owned. Nothing about
any one stack is baked in.

## Loop-drivable by design

The ledger is the state, so long work runs as recurring fresh-context ticks:
`/loop /mission "<name>" continue`, `/loop /autopilot continue`, or a weekly
scheduled agent running `/operate`. One brief or stage boundary per tick — no
transcript bloat, crash-safe by construction, gates reaching your phone
instead of blocking silently.

## Install

```
/plugin marketplace add xyzhub/agentic-workflow      # or your fork's repo
/plugin install agentic-workflow@xyz
```

Then in any project: `/adopt` (existing), `/bootstrap` (fresh), or
`/autopilot "<idea>"` (hands-off). Try locally first:

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
