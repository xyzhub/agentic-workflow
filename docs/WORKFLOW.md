# The Workflow — one agentic protocol from idea to viable product

<!-- protocol-master: v1.30.0 -->

## Quick reference — humans start here

**Entry points**

| You have | Run |
|---|---|
| A raw idea | `/autopilot "<idea>"` — hands-off; or `/bootstrap` to go stage by stage |
| An existing project | `/adopt` (add `fill` to also draft missing docs) |
| No idea what's next | `/next` — always safe, recommends exactly one command |

**The daily loop**: `/start` → build → `/end` → PR → human merges.
Small isolated fix → `/fix`. Bigger than one sitting → `/mission "<goal>"`.
Long missions and autopilot are **loop-friendly**: drive them with a recurring
`/loop … continue` or a scheduled agent — each tick resumes from files with a
fresh context. Once live, schedule `/operate` weekly.

**Stages at a glance**: V0 validate → V1 define → V2 foundation → V3 build →
V4 harden → V5 launch → V6 operate.

**The right command for the moment**

| Moment | Command |
|---|---|
| Before a big human decision | `/counsel "<decision>"` |
| "Is this production-ready?" | `/audit` |
| Cutting a version | `/release` |
| Just deployed | `/verify` |
| Weekly, once live | `/operate` |
| Health check / feeling stuck | `/check`, then `/next` |
| Something feels broken (tools, profile, hooks) | `/doctor` — add `fix` to install missing tools |
| An agent keeps underperforming | `/tune <agent> opus` — back: `/tune <agent> reset` |
| Away from the terminal | gates ping your owner channel — tap Approve/Reject (§12; set up: `/connect`) |
| Several ventures, one owner | a registry repo; `/operate` run there sweeps them all (§13) |
| Protocol copy out of date | `/sync` |
| After a mission or incident | `/retro` |

**You (the human) always own**: merges to the default branch (unless §10
delegates them), production deploys, spending, outward publishing, user
experiments, anything destructive. Agents prepare; you fire.

---

One workflow that can take any project from a raw idea to a working, viable
product — and keep evolving it. Two halves:

- **The venture lifecycle (§0)** — the stages a product moves through, each with
  an exit gate and the four quality pillars (§0.2: UX, DX, Security, Efficiency)
  enforced as gates, not aspirations.
- **The execution machinery (§1–§8)** — how any individual piece of work gets
  done: altitudes, session lifecycle, mission trio, checkpoints, roles.

Authority order: explicit user instruction > this document > tool defaults.
The human owner (**HITL** — see §10) is the only merge/deploy authority for the
default branch.

## 0. The venture lifecycle — idea → viable product

Every project is at exactly one stage; name it before routing work. Stage exits
are GATES: human go/no-go where marked, reviewer-verified otherwise. Skipping a
gate is a logged deviation, not a shortcut.

| Stage | Produces | Exit gate |
|---|---|---|
| **V0 Idea & validation** | `docs/product/idea.md`: problem, who pays, why now, riskiest assumption, kill criteria, cheapest test of the assumption — informed by the `researcher` agent (evidence for AND against) | **Human go/no-go.** No code before this exists — an unvalidated idea is cheapest to kill in prose |
| **V1 Definition** | PRD + MVP scope (what's deliberately OUT); user journeys with acceptance criteria and brand/UX directions from the `designer` agent (it owns journeys and IA as well as brand) for the owner to choose; data-model sketch + stack decision as option memos from the `architect` agent (`docs/product/decisions/`); business model + pricing proposal from the `business` agent (`docs/product/business/`) — the model shapes scope and the data model | Stop-the-line: no implementation without acceptance criteria. **Human approves scope** (with the business model and the brand direction; `/counsel` convenes the advisor red-team on the approval first) |
| **V2 Foundation** | Deployable skeleton (`devops` lays CI + deploy): repo + CI gates (test/typecheck), deploy pipeline + health/ready checks, validated env with a **fail-closed production guard**, auth decision wired, error-monitoring hook, seed/reset path, README quickstart, chosen design system as tokens | "Hello world" **deployed and live-verified**; CI green. Security and DX are laid here — retrofitting costs 10× |
| **V3 Build (MVP)** | The product, feature by feature, via the execution machinery (§1–§5). Every checkpoint applies the pillar lenses | All MVP acceptance criteria met; behavioral/eval suite exists for AI-driven products |
| **V4 Hardening** | Four explicit audits (§0.2): security review, UX pass (incl. the `designer`'s heuristic usability evaluation), DX pass, efficiency pass — plus ops readiness (backups, monitoring, runbook, guard coverage). Audits run as an **adversarial multi-vote** (§5): lens-partitioned parallel reviewers, conservative merge — standalone via `/audit` at any stage | Reviewer-verified production-readiness checklist (full six-lens scorecard); findings fixed or accepted in writing |
| **V5 Launch** | Production deploy (`devops` prepares, `/release` cuts the version), first-user onboarding, **live end-to-end verification on the deployed instance**, monitoring confirmed receiving events, rollback tested; launch assets from the `marketing` agent under `docs/product/launch/` (one file per deliverable: positioning, landing copy, per-channel announcements, post-launch content plan, indexed by `launch-plan.md` with the channel plan) — **the human publishes**; pricing finalized against measured costs and the executive summary refreshed (`business`) | Pre-launch **multi-vote review** (§5) green; first real user/business served. **Human owns the launch decision** |
| **V6 Operate & evolve** | Growth is *users and features*: the `/operate` loop — measured numbers from the `analyst`, error/cost triage from `ops`, funnel/channel review against the launch metrics (`marketing`), economics drift (`business`) — beside feedback → ranked feature ideas → user-reviewed → growth missions (phased trio with locked decisions); retros that amend THIS document | Continuous — each growth mission re-cycles V3–V5 gates |

A stage may be revisited (a pivot reopens V0/V1; a big growth mission re-runs V4
before its launch). The stages sequence the *product*; the altitudes (§1)
sequence the *work inside a stage*.

### 0.2 The four pillars — enforced, not aspirational

Standing rules (checked at every checkpoint by the reviewer) plus a dedicated
audit each at V4. When a pillar conflicts with speed, the pillar wins at V4/V5
and speed wins at V0–V2 prototyping — say which mode you're in.

**UX** — *the product tells the truth and never dead-ends.*
- Every view handles empty / loading / error states; empty states point at the
  primary action.
- The UI never claims what the backend doesn't confirm (no "Synced" while
  disconnected; status derives from the same source the backend trusts).
- No mock/scaffold data reachable in production builds; no dead controls.
- Verified in a **real client** (real browser for web — clean console,
  hydration-safe SSR with no locale/timezone formatting in server HTML;
  keyboard + label + contrast basics).
- Copy is in the user's language and register.
- **Persuasion only through value clarity — never manipulation**: no fabricated
  scarcity or urgency, no confirm-shaming, no dark defaults, cancellation no
  harder than sign-up; retention comes from delivered value, not exit friction.
  Rewards and progress indicators map to REAL user progress (a reward that maps
  to nothing is manipulation, not motivation); variable-ratio reward mechanics
  — the gambling schedule — are excluded by default, and including them is an
  explicit human decision.

**DX** — *a stranger clones the repo and ships a fix the same day.*
- README quickstart with few commands incl. a one-command dev datastore;
  `.env.example` that works as-is.
- Gates are fast and local (unit tests need no live services); the conventions
  file and docs index kept truthful — the stale-doc rule (§8) is enforced.
- Useful scripts documented; a CONTRIBUTING that states the CI gates and footguns.
- Agent-DX counts too: pre-resolved briefs, a code index if available,
  reusable test patterns — the repo is legible to humans and models alike.

**Security** — *fail closed, least privilege, independently reviewed.*
- Misconfiguration must refuse to serve, not silently degrade (a production
  guard that validates required config at boot; signature/token checks fail
  closed; route/authorization classification is exact).
- Least privilege: scoped CI permissions, pinned third-party actions touching
  secrets, hashed credentials, secrets encrypted at rest with a rotation story,
  additive-only migrations by default.
- Rate-limit every public/credential surface; close self-serve sign-up unless
  the product needs it; audit trail on privileged state changes.
- Independent security lens at every checkpoint; full review at V4 and for any
  auth/payment/webhook/CI-touching change.

**Efficiency** — *measure first; spend where users feel it; don't overbuild.*
- MVP scope discipline: a written "NOT in this version" list (deferred ≠ denied);
  simple infra until scale is a measured problem.
- Perf budgets on hot paths; no N+1s on list endpoints; caching only with an
  invalidation story.
- Cost awareness for AI products: model tiering (cheap router → strong executor),
  token/context budgets (§2, principle 2), per-feature spend visibility.
- Agent efficiency: route to the smallest altitude that fits (§1); reuse
  existing engines before building new ones.

## 1. Three altitudes — route every piece of work first

| Altitude | Trigger | Process | Overhead |
|---|---|---|---|
| **Task** | Typo-class fix, config tweak, single-file bug with an obvious test | Branch → fix → verify → PR | Minutes |
| **Session** | One sitting of focused work: a feature slice, a bug hunt, a refactor | Session lifecycle (§4) | One branch, one PR |
| **Mission** | Too big for one sitting: multi-feature, migration, audit | Plan trio + phases + checkpoints (§5) | `.plans/` ledger, reviewer gates |

Name the stage (§0), then route. When unsure between Session and Mission: if you
cannot pre-resolve all file targets in one exploration pass, it's a Mission.
Escalating mid-flight is fine (log it); silently sprawling is not.

## 2. Principles

1. **The ledger outlives the transcript.** Durable state lives in files
   (`.plans/<mission>.state.md` for missions; PRs/issues for sessions), never only
   in chat. Any fresh agent must resume from files alone.
2. **Ingest conclusions, not corpora.** Delegate high-volume reading to subagents
   that return distilled results. Budget ≤30% of the context window per session
   (~1,500 lines of reads); grep-first ranged reads for files >400 lines
   (Bash-side searches prefer `rg` when present — `/doctor fix` installs it).
3. **Retrieval-first.** If a code index exists (§10 records how to query it),
   use it before grep + whole-file reads for where/what/blast-radius questions.
   Agents whose toolset lacks the index's MCP tools use its CLI via Bash — the
   same pattern as Bash-driven browser verification.
4. **Gates, not logs.** Verification returns a signal (green/red + first error),
   never pasted build output. The project's gates are in §10.
5. **Verify live, in a real client.** Anything with a runtime surface gets
   exercised end-to-end — for web UI a real browser, not a status-code ping.
6. **Independence at the gates.** Work is reviewed by an agent that did not write
   it (fresh context) at every checkpoint and before any risky merge. Self-review
   only for Task-altitude changes, labeled "Self-QA (non-independent)".
7. **Evidence where reviewers look.** Decisions, deviations, verification results
   go on the PR/issue/ledger — the system of record.
8. **Crash-safe by write-ahead.** State updates are written before ending a
   session, so interruption never loses or doubles work.

## 3. Guardrails (mechanical, always on)

Shipped by this plugin as hooks. Advisory except where marked:

| Event | Behavior |
|---|---|
| Prompt submit | Reminder when the working tree is on the default branch |
| `git commit` | Conventional-format reminder |
| `git push` | **BLOCKS** any push while on the default branch (feature branches only) |
| `git push` | **BLOCKS** any refspec targeting the default branch (`HEAD:main`, `feature:main`, `:main`) — never sanctioned, even with delegated merge authority |
| `git push --tags` / `--follow-tags` | Warns that tag pushes may fire a release/deploy pipeline — per `/release`, the human runs them |
| `git push` | Warns when tracked files are modified-but-uncommitted (untracked scratch dirs don't warn) |
| `gh pr merge` | **BLOCKS** unless the §10 **Merge policy** is `agent-may-merge` (fail closed when unset/absent); when delegated, reminds: merge only on a reviewer APPROVE |
| `gh pr create` | Reminder to have run the gates |
| `Write`/`Edit` | Reminder to update docs when high-impact files change |

Blockers exit 2 (hard stop); reminders exit 0. Guardrails catch autopilot
mistakes; they never replace judgment.

## 4. Session lifecycle (the default altitude)

**Open** — route the work (§1); create/checkout the branch (never the default
branch); if part of a mission, read the ledger → `Next up:` → that brief.

**Work** — smallest change meeting the acceptance criteria; follow repo
conventions (the project's conventions file is the engineering source of truth);
tests accompany behavior changes; deviations from a brief are allowed but MUST be
logged in the ledger.

**Close** — gates green (§10); live verification if there's a runtime surface
(§2, principle 5); commit (`type(scope): description` — for mission sessions
`<mission>(S<n>): summary`); push the branch; PR with summary + test plan;
**update the record** (§6.1 — spawn the `chronicler` agent, then republish the
owner status page); **never merge the default branch yourself** — HITL merges
(merging often auto-deploys).

**Context discipline** — at ~25% usage, finish the current edit to a compiling
state, verify, write the handoff, end. A clean half-session beats a degraded full
one. Finished early (<15%)? Pull the next same-phase brief (checkpoints always
end a session).

## 5. Mission lifecycle (multi-session work)

The plan trio, written by a dedicated planning session:

| File | Job |
|---|---|
| `.plans/<mission>.md` | Master plan: numbered tasks with acceptance criteria, **locked decisions (dated)**, risks, open questions each with a recommendation |
| `.plans/<mission>.sessions.md` | One brief per session: pre-resolved reads (file → measured line count → anchors), do/verify steps, read budget; phases with named branches |
| `.plans/<mission>.state.md` | Ledger: checklist, deviations log, handoff log (≤10 lines each, newest first), `Next up:` |

Rules: briefs pre-resolve targets so execution sessions never explore; one branch
per phase, merged at checkpoint per the **gate policy** below; migrations and
CI/deploy-touching changes get extra checkpoint scrutiny; **one-corrective-retry**
— a failing session/agent is retried once with a corrective note, then escalated
to the human.

**Gate policy** (chosen at mission start; default `human-merge`):
- `human-merge` — on APPROVE, pause for HITL to merge each phase branch. Where
  the §10 **Merge policy** is `agent-may-merge`, the orchestrator may merge the
  reviewer-APPROVEd phase PR itself (logged in the ledger) instead of pausing —
  the delegation covers *who clicks merge*, never *skipping the review*.
- `batch` — on APPROVE, the orchestrator merges the phase branch into a
  long-lived `mission/<name>-integration` branch — **never the default branch**,
  so the push-block guardrail (§3) and the merge authority (§11 safety boundary)
  stay intact — and HITL merges the integration branch once, at the batched
  end-of-mission (or launch) confirmation. Used by `/autopilot` when the flight
  plan says "only stop at hard gates".

**Checkpoints** end every phase: the independent `reviewer` agent (fresh context)
re-runs all gates, diff-reviews `base..head`, performs deferred manual/live items,
checks claimed deviations against the actual diff, restores datastore state (§10),
and returns APPROVE / REQUEST CHANGES with concrete findings plus a **scorecard**
(per-lens 0–3; at routine checkpoints only the lenses the diff touched — the
binary verdict stays the gate signal, scores are diagnostics for the pillar-health
panel). Review fixes land as their own ledger entries (`S<n>-fix`).

**Adversarial multi-vote — high-stakes gates only.** At exactly two lifecycle
points — the V4 audit and the pre-launch (V5) review — the orchestrator spawns
2–3 fresh `reviewer` instances, lens-partitioned (security + efficiency /
UX + DX / QA + architecture), instead of one. Merge conservatively: any
REQUEST CHANGES blocks; findings are unioned; the same finding from two
reviewers raises its confidence. Routine checkpoints stay single-reviewer —
this is where review cost is spent deliberately, not everywhere.

**Loop mode.** The ledger makes missions loop-drivable: a recurring
`/loop /mission "<name>" continue` (or a scheduled agent) gives every tick a
FRESH context that reads the ledger, executes exactly one brief or checkpoint,
writes the handoff, and ends. Context never bloats across phases, a crashed
tick loses nothing, and the human can stop the loop at any gate. The same
applies to `/autopilot continue` at venture scale (§11).

The trio is authored by the `planner` agent and driven by the bundled `/mission`
command (plan · run · continue · replan). Technical open questions may be routed
through the `architect` for an options memo before they reach the human — the
human still decides. The `planner` explores once and
pre-resolves every brief's targets; `/mission` orchestrates execution phase by
phase, spawning specialist implementers per brief and the `reviewer` at each
checkpoint. The planner can also **convert an existing plan document** into the
trio (its decisions arrive locked, not re-litigated), and **replan** re-evaluates
a trio against current reality — ledger reconciled with git, pending briefs
re-resolved, invalidated locked decisions surfaced to the human rather than
silently changed.

## 6. Roles

| Role | Who | Duty |
|---|---|---|
| **Implementer** | The main session agent, or a **specialist implementer** subagent (`backend`, `frontend`, `security`, `devops`) — used for a domain slice or to run slices in parallel in a mission | Route, build to convention, verify, document, hand off |
| **Reviewer** | The `reviewer` agent — always a fresh context | Checkpoint reviews; pre-merge review of risky changes; four pillar lenses + QA + architecture in one pass |
| **Chronicler** | The `chronicler` agent | Keeps the record (§6.1); documents, never touches product code |
| **HITL** | The human owner (§10) | Answers open questions, merges the default branch, owns deploys and anything irreversible |

**Specialist implementers** carry their domain's pillar bias — `backend`
(data integrity, idempotency, migrations, efficiency), `frontend` (the UX pillar,
real-client verification), `security` (fail-closed hardening, least privilege),
`devops` (CI/CD pipelines, deploy config, releases, rollback).
They compose with, and never replace, independent review: a specialist BUILDS,
the fresh-context `reviewer` VERIFIES. No specialist self-approves, merges, or
pushes the default branch. Reach for them when a session has a clear single-domain
slice, or when a mission has parallel slices that can run at once; a plain session
on the main agent is fine for small or cross-cutting work.

**Researcher** (`researcher`) works upstream of code, in V0: it validates the
problem, sizes the market, maps competitors, and pressure-tests the riskiest
assumption with cited evidence for AND against, drafting `docs/product/idea.md`.
Like the reviewer, its value is independence — it hunts disconfirming evidence
rather than selling the idea. It informs the human's go/no-go; it never decides.

**Planner** (`planner`) decomposes an already-decided mission into the `.plans/`
trio, doing the expensive exploration once so execution sessions never do. It
pre-resolves every brief's targets and sizes them to the context budget; it does
tactical decomposition, not strategic scope (main session + HITL own that). Driven
by `/mission`.

**Architect** (`architect`) is the technical consultant for shape-before-build
decisions. At V1 it authors the stack decision and data-model sketch as option
memos — 2–3 options, tradeoffs, reversal cost, a recommendation — under
`docs/product/decisions/`; during missions it digests technical open questions
into decision-ready memos. It consults; the human decides (dated locked
decisions), implementers build, the reviewer verifies — it does none of those.

**Advisor** (`advisor`) is the decision red-team: the reviewer's counterpart
for judgment instead of code. Convened at the human gates via `/counsel` — 2–3
fresh instances, lens-partitioned (technical / market / financial, plus
behavioral for engagement-critical decisions) — each
argues the strongest case AGAINST the pending recommendation with cited
evidence and returns counsel (proceed / proceed-with-changes / hold), merged
into a one-page brief recorded in the decision log. It never decides, never
blocks, never edits the artifacts it critiques — and it is bound to the gates,
never ambient.

**Designer** (`designer`) works at V1–V2 and for redesigns: it surfaces several
distinct brand/UX directions for the owner to choose from, then organizes the
chosen one into a design-token system the `frontend` agent implements. It also
owns the PRD's user journeys and information architecture at V1, and runs the
heuristic usability evaluation in the V4 UX audit (flagging its own
independence caveat). It proposes and organizes; the owner picks; frontend
builds.

**Marketing** (`marketing`) works at V5–V6: it turns the V0 evidence and the PRD
into launch assets under `docs/product/launch/`, one file per deliverable —
positioning (statement, ICP, pillars), landing-page copy, per-channel
announcement drafts in the owner's voice, a post-launch content plan, and a
`launch-plan.md` index carrying the channel plan and launch metrics. At V6 it
reviews the funnel, keeps the content plan current, and proposes channel
experiments as growth-mission candidates. Its copy is product-truthful (claims
trace to evidence or shipped behavior). It drafts; the **human publishes** —
outward publishing sits on the safety boundary (§11).

**Business** (`business`) owns the venture's viability math and business
documents (`docs/product/business/`): the business model (value metric, revenue
model, cost to serve, unit economics), the pricing strategy, and a one-page
executive summary refreshed at every stage transition. It proposes at V1
(model + pricing hypothesis with the PRD), finalizes against measured costs at
V4–V5, and proposes pricing experiments at V6. It proposes with evidence from
the V0 research; the **human decides** model and prices — and it never spends
or charges (§11 safety boundary).

**DevOps** (`devops`) owns the delivery pipeline as a first-class artifact —
CI/CD, GitHub Actions workflows, deploy config, environments, releases, rollback.
It lays the pipeline at V2 and prepares the launch at V5, co-owning CI security
posture with `security`. It prepares deploys/releases; the human fires the
irreversible ones (see §11).

**Ops** (`ops`) owns V6 operations: error/monitoring triage ranked by user
impact, runbook truthfulness, postmortem drafts, and infra-cost review against
the business model — each finding converted into a ranked, runnable mission or
session candidate. It is read-only against production; restarts, rollbacks, and
deploys are the human's to fire. Usually convened via `/operate`.

**Writer** (`writer`) is the optional copy & content craft specialist —
convened when a slice is copy-heavy (landing-page pass, UI-string sweep,
articles/docs, terminology audit), never a mandatory stop. It owns the **copy
kit/glossary** (`design/brand/copy-kit.md`, seeded by the `designer`): voice
rules, one-term-per-concept glossary, and string patterns applied per surface —
UI, marketing, docs. Every agent writes to the kit; the writer is the
specialist who maintains it and does the heavy drafting. It never publishes
(§11), never invents claims, and never owns positioning (`marketing`) or the
brand voice itself (`designer`).

**Analyst** (`analyst`) is the venture's measurement engine. It owns the
tracking plan (every event, and the question it answers), reads the numbers,
and hands cited conclusions to `marketing` (funnel), `business` (unit
economics), `ops` (trends), and the efficiency audits — so the venture runs on
one set of measurements instead of three improvised estimates. It specifies
instrumentation (implementers wire it, with review) and never invents a
number: unmeasured stays "unmeasured".

### 6.1 Documentation of record (Chronicler)

Three artifacts kept current so the project's story survives any single session:

- **`CHANGELOG.md`** — technical, Keep-a-Changelog format, PR-referenced.
- **`docs/product/JOURNEY.md`** — posterity, plain-language narrative, append-only.
- **`docs/product/overview.html`** — the owner's **live status page**: current
  stage, work in flight, owner action items, pillar health, timeline. Self-
  contained HTML published as a Claude Artifact to a stable URL (recorded in the
  file's `artifact-url` comment) the owner keeps bookmarked.

**When**: at session close, at every checkpoint, and at stage transitions. The
implementer spawns the chronicler with a summary (PRs, deviations, incidents, any
stage change); the chronicler edits the three files, then the **main session
republishes** `overview.html` via the Artifact tool to its recorded URL
(subagents cannot publish artifacts). Task-altitude changes update CHANGELOG only.

## 7. Fulfilment: definition of done

DONE = gates green → live verification passed (real client for UI) → docs updated
when behavior/config changed → PR merged by HITL → **post-deploy verification on
the deployed instance** for anything user-facing (`/verify` is the vehicle:
drive the real flow, confirm monitoring is receiving, record the result).
"Deployed and verified" is the finish line, not "PR open".

## 8. Evolution: the loop that improves the loop

- **Retro** after significant missions: what to keep/change lands as edits to THIS
  document or the guardrails — via PR like any other change.
- **Lessons become memory or docs**: project-derivable facts → repo docs;
  agent-behavioral lessons → auto-memory. Never both.
- **Stale-doc rule**: any session that catches docs lying about the code fixes it
  in the same PR.
- **Harness changes are code**: hooks, commands, agents, and this protocol are
  versioned and reviewed like source.

## 9. How this maps to the plugin

- Agents ship with the plugin: `researcher` (V0 validation), `designer`
  (V1–V2 brand/UX, journeys/IA, V4 usability pass), `architect` (V1
  shape-before-build option memos), `business` (V1/V5/V6 model, pricing,
  business documents), `planner` (mission decomposition), `advisor` (decision
  red-team at the human gates, via `/counsel`), `marketing` (V5–V6
  go-to-market), `ops` (V6 operations), `analyst` (measurement engine),
  `writer` (optional copy craft — owns the copy kit/glossary), `reviewer`,
  `chronicler`, and the specialist implementers `backend`, `frontend`,
  `security`, `devops` (CI/CD, deploy, releases).
- **Model tuning**: `/tune <agent> <model>` shadows a plugin agent with a
  project-level copy (`.claude/agents/`) whose only change is the model —
  upgrade an underperformer, `/tune <agent> reset` to restore the default.
  When a `TUNED`-prefixed variant of an agent exists, orchestrators spawn
  THAT one. Tunes are files: committed and reviewed like any harness change
  (§8).
- Guardrail hooks (§3) install automatically.
- Commands: `/bootstrap` (bootstrap a project into this workflow),
  `/adopt` (one-command adoption for an existing project: bootstrap + convert
  existing plans + stage-gap report; `fill` mode also drafts the missing
  document deliverables, decisions pending), `/autopilot` (drive an idea to
  launch-ready, §11), `/mission` (plan + drive a multi-session mission),
  `/counsel` (advisor red-team on a pending decision), `/audit` (on-demand
  adversarial pillar audit), `/release` (cut a version), `/verify` (post-deploy
  verification, §7), `/operate` (the V6 loop), `/sync` (bring
  docs/WORKFLOW.md up to the installed protocol master), `/next` (recommends
  the single best next command from the project state), `/doctor` (machinery
  diagnosis — environment tools, §10 truthfulness; `fix` installs missing dev
  tools like codegraph and ripgrep), `/tune` (per-project agent model
  upgrade/reset), `/connect` (interactive owner-channel setup with a
  round-trip test), `/start`,
  `/check`, `/pr`, `/end`, `/fix`, `/retro`.
- The `protocol` skill points every session at the project's
  `docs/WORKFLOW.md` (or this master if none exists yet).
- Templates for the status page, `idea.md`, `flight-plan.md`, `decision-log.md`,
  the launch asset set (`launch-plan.md`, `launch-positioning.md`,
  `launch-landing-page.md`, `launch-announcement.md`, `launch-content-plan.md`),
  the business set (`business-executive-summary.md`, `business-model.md`,
  `business-pricing.md`), and this protocol live under the plugin's `templates/`.

## 10. Project profile (filled by `/adopt`, 2026-07-08)

| Key | Value |
|---|---|
| **HITL (merge/deploy authority)** | Baker |
| **Merge policy** | human-only |
| **Default branch** | main |
| **Test gate** | `node tools/lint.mjs` (tier 1 — deterministic; CI runs it on every push/PR) |
| **Typecheck/lint gate** | covered by the test gate — `tools/lint.mjs` IS the lint |
| **Build** | none (markdown plugin — nothing compiles) |
| **Datastore seed/reset** | none |
| **Deploy + live-verify** | merge to `main` IS the release (marketplace installs from main; no tags). Live-verify: `/plugin update` + `/reload-plugins` in a consumer session — plugin loads clean — then `/doctor` in an adopted project |
| **Eval suite** (behavioral) | `node evals/run.mjs` — tier 2, before releases, never CI (~$1–5/scenario); flaky scenario → re-run it alone before calling regression |
| **High-impact files** (docs-reminder targets) | `plugins/agentic-workflow/templates/WORKFLOW.md`, `hooks/hooks.json`, `tools/lint.mjs`, `agents/*`, `commands/*` |
| **Code index** | none — markdown-only repo; `rg` + the tier-1 lint's cross-reference checks suffice |
| **Memory/recall store** (optional) | none |
| **Owner channel** (§12) | Slack, **shared DM** (reused app `agentic_operating_pro`, workspace XYZ — connected & round-trip-verified 2026-07-08). Send: `chat.postMessage` with `$SLACK_BOT_TOKEN` → `$SLACK_OWNER_DM`, every message prefixed `[venture-workflow-plugin]`. Inbound: emoji-reaction decisions (✅/❌/✋ via `reactions.get` polling, verified against `$SLACK_OWNER_ID`) + typed `approve <id>` fallback. Env names in `.env.example`; values in the uncommitted `.env` |
| **Portfolio** (§13) | `/Users/baker/Playground/registry` (github.com/xyzhub/registry) — registered as row 1 |
| **Issue tracker** | GitHub Issues via `gh` |

## 11. Autopilot mode

`/autopilot "<idea>"` drives the whole lifecycle (V0→V5, then a V6 handoff) with
the bare-minimum human input — validation, definition, design choice, foundation,
build, hardening, and launch-prep — pausing only at the gates a human must own.
It's the same workflow, orchestrated end-to-end instead of session-by-session.
On an **existing project**, autopilot first runs the `/adopt` procedure
(profile, plan conversion, stage-gap audit), then resumes at the first stage
whose exit gate isn't met — the gap report's findings become its first work
items; existing artifacts are settled history, not gates to re-run.
Autopilot does not run V6 operations; at the launch gate it hands the owner a V6
operating brief (feedback channels, ranked growth backlog, retro cadence) and ends.

**The only upfront ask is a flight plan** (`docs/product/flight-plan.md`, from the
bundled template): the idea, a budget ceiling, risk tolerance, a brand preference
(or "you choose"), the deploy target, and how often to check in. That is the
standing authorization; anything outside it returns to the human. The check-in
level also selects the mission **gate policy** (§5): "check in each stage" keeps
the default `human-merge` at every phase; "only hard gates" authorizes `batch` —
phases merge autonomously into a mission integration branch (never the default
branch) and the human merges once, at the consolidated launch confirmation.

**What runs autonomously**: the reviewer-verified stage gates. The `researcher`
validates (and can auto-stop on kill criteria); the `designer` picks a direction
if pre-authorized and drafts the journeys/IA; the `architect` shapes stack and
data model as option memos; the `business` agent proposes model and pricing (V1)
for the human to approve with scope; `devops` lays the pipeline (V2) and stages
the release (V5); `marketing` drafts the launch assets (V5) for the human to
publish; `backend`/`frontend`/`security` build with a `reviewer` checkpoint per
phase (one corrective retry, then surface); the `chronicler` keeps the status
page live as the owner's window; a `decision-log.md` records every autonomous
choice and how to reverse it. At the human gates, `/counsel` convenes the
`advisor` red-team so each pause arrives with the case against in hand.

**The safety boundary is never crossed autonomously** — even here, these need an
explicit human confirmation each time (pre-authorization lets you *prepare*, not
*fire*): merging the default branch (unless the §10 **Merge policy** delegates it
— the delegation itself is a human decision, and even then only reviewer-APPROVEd
PRs, never direct pushes), deploying to production / going live, spending beyond
the flight-plan ceiling, publishing outward or messaging on the owner's behalf,
launching behavioral experiments on real users (propose the hypothesis and
measurement plan; the human launches), and destructive/irreversible actions.
Merge authority is the ONE delegable item; the rest are never delegable. These are **batched**: at
the launch boundary the human gets ONE consolidated "ready to launch" summary to
confirm, not a stream of interruptions.

Autopilot mode is therefore *autonomous up to the reversible boundary*, with the
irreducible human decisions collapsed to the fewest, best-informed touchpoints.

Autopilot is also **crash-safe and context-disciplined** like every other part
of the machinery (§2): its durable state is files (flight plan, decision log,
stage artifacts, status page), it ends cleanly at a stage boundary when its
context fills, and `/autopilot continue` re-derives the current stage from
those files and resumes — locked decisions stay decided. That makes autopilot
**loop-drivable**: a recurring `/loop /autopilot continue` (or a scheduled
agent) advances the venture one clean stage boundary per tick, each tick a
fresh context. Human confirmations may arrive through the verified **owner
channel** (§12) — another input device for the same human; the boundary list
above is unchanged.

## 12. Owner channel — notifications & remote gate decisions

An indefinitely-operating project needs a push channel to its owner; gates
must not block invisibly. The owner channel is a **private, owner-configured
DM** (Telegram bot chat, Slack DM), recorded in §10 — set up interactively
with `/connect` (guided steps, auto-discovered IDs, round-trip test). Direction is the
boundary: messaging THE OWNER is telemetry; any audience beyond the owner
makes it publishing (§11, human-gated). Sends are best-effort side effects —
a notification failure is logged and never blocks work.

**Outbound — three tiers, never routine progress** (the status page stays the
pull surface):

| Tier | When | Examples |
|---|---|---|
| **Gate** | Work is blocked on the human | approval ready, kill-stop, escalation after one-corrective-retry |
| **Alert** | The owner would want to know now | `/verify` FAIL, user-impacting incident, budget ceiling near |
| **Digest** | Rhythm | one message per `/operate` cycle: ≤3 lines + status-page link |

Messages carry summaries and links (PR, status page) — never secrets.

**Inbound — remote gate decisions, fail closed:**

1. **Interactive where daemon-free**: Telegram gate notifications carry
   buttons (Approve / Reject / Hold) whose callback payload is the gate
   nonce — callbacks arrive via the same `getUpdates` polling as messages.
   Slack's daemon-free equivalent is **emoji reactions** on the gate message
   (✅ approve / ❌ reject / ✋ hold, read via `reactions.get` polling) —
   structurally bound to the gate because the reaction sits ON the message,
   and carrying the reactor's id. Typed replies (`approve <id>`) are the
   universal fallback and carry reject reasons; Slack Block Kit buttons need
   an interactivity endpoint, which most solo setups don't have.
2. **Identity pinned**: only the §10 owner id counts; verify the transport's
   signature/secret where offered. Unverifiable input is ignored AND reported
   (alert tier — someone knocked).
3. **Nonce-bound, single-use, expiring**: the pending gate is written to
   `.plans/pending-gates.md` (id, what it decides, TTL) BEFORE the
   notification goes out; a decision must carry that id, is consumed once,
   then the message is edited into a receipt ("Approved 14:02", buttons
   removed). Expired gates get their buttons removed too.
4. **Decision gates only**: buttons resolve decisions the agents then act on
   (scope/brand/model approval, open questions, kill-stop, hold/continue).
   Irreversible ACTIONS — merge, deploy, spend, publish — are never fired
   from a chat tap: the notification carries the link and the human fires
   them where they live (unless §10 delegates merges, where the normal
   reviewer-APPROVE path applies). Free text (a reject reason) is recorded
   as content, never executed as instructions.
5. **Recorded**: every channel decision lands in the decision log with the
   message reference — the same auditability as a terminal approval.

**Multi-project, one owner.** Several projects on one machine can share the
owner — with transport-specific rules:

- **Slack shares cleanly**: one app/token machine-wide. `conversations.history`
  is a NON-consuming read — every project polls independently with its own
  local read cursor, nobody steals messages. A shared DM works for a few
  projects; a private channel per project (bot invited, that channel id as
  this project's `SLACK_OWNER_DM` in its `.env`) gives a named stream per
  venture.
- **Telegram: one bot per project**. `getUpdates` has a single CONSUMING
  offset per bot — two projects polling the same bot race each other and
  steal updates (including button taps). A fresh BotFather bot per project
  (token in the project's `.env`) avoids the race and yields per-project
  chats.
- **Attribution rules regardless of transport**: every message starts with a
  `[<project>]` prefix; gate nonces embed the project slug
  (`G-<project>-7f3a`); a project matches ONLY its own pending ids when
  polling a shared channel.

## 13. Portfolio — one owner, many ventures

When one owner runs several ventures, portfolio awareness lives in a
**registry repo** — files + git, like every other record. Never a database:
a DB may exist only as the §10 memory *accelerator*; the registry is the
record. Structure:

- **`registry.md`** — one row per venture: name · local path · git remote ·
  stage · status-page URL · owner channel · last `/operate`.
- **`ledger.md`** — portfolio-level decisions and handoffs (same rules as
  mission ledgers: dated, append-biased, crash-safe).
- **`precedents.md`** — POINTERS to citable decisions across ventures
  (repo + file + one-line summary), never copies — each venture stays its
  own system of record.
- **`overview.html`** — the portfolio status page: every venture's stage
  rail in one view (the first portfolio `/operate` seeds it).

Pointers run both ways: the registry points at ventures via paths/remotes
(co-location under one folder is tidy *convention*, never a requirement),
and a venture's §10 **Portfolio** row points back so agents working inside
it can find and cite cross-venture precedent.

Awareness is **command-time and daemon-free**, like everything else:
`/operate` run in the registry repo sweeps every registered venture — one
reader per venture ingesting its existing *conclusions* (status-page data
regions, ledger `Next up:`, track record), never its corpora — and rolls up
to one report: every stage, blocked gates, and ONE ranked cross-portfolio
backlog (this week's mission goes where?). Registration is a single
`registry.md` row, offered by `/adopt`. Ventures without a local checkout
are read via their remotes (`gh`) — slower, same record.

## Local amendments

- **Release convention (2026-07-08)**: no git tags — merging to `main` IS the
  release; every `feat:`/`fix:` commit bumps `plugin.json` and stamps the
  version in the subject; the `mission-batch-gate` fixture's protocol stamp is
  bumped alongside. Evals run pre-release locally, never in CI (decided
  2026-07-07; do not re-raise).
- **This repo ships the protocol it runs**: `templates/WORKFLOW.md` is the
  master; THIS file is a stamped copy. Protocol changes are edits to the
  master via PR — never to this copy (except §10 and this section).

_(Further project-specific rules land here. `/check`'s upgrade procedure
preserves this section and §10 verbatim when re-copying a newer protocol
master, so amendments survive upgrades — anything edited elsewhere in the
document will be flagged as drift instead.)_
