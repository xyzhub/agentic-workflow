# The Workflow — one agentic protocol from idea to viable product

> **This is the bundled master protocol** shipped by the Venture Workflow plugin.
> When a project has its own `docs/AGENT-SESSIONS.md` (written by `/workflow-init`),
> THAT copy wins — it carries the project profile (§10) and any local amendments.
> This master is the fallback and the thing `/workflow-init` copies from.

One workflow that can take any project from a raw idea to a working, viable
product — and keep evolving it. Two halves:

- **The venture lifecycle (§0)** — the stages a product moves through, each with
  an exit gate and the four quality pillars (§0.2: UX, DX, Security, Efficiency)
  enforced as gates, not aspirations.
- **The execution machinery (§1–§8)** — how any individual piece of work gets
  done: altitudes, session lifecycle, effort trio, checkpoints, roles.

Authority order: explicit user instruction > this document > tool defaults.
The human owner (**HITL** — see §10) is the only merge/deploy authority for the
default branch.

## 0. The venture lifecycle — idea → viable product

Every project is at exactly one stage; name it before routing work. Stage exits
are GATES: human go/no-go where marked, reviewer-verified otherwise. Skipping a
gate is a logged deviation, not a shortcut.

| Stage | Produces | Exit gate |
|---|---|---|
| **V0 Idea & validation** | `docs/product/idea.md`: problem, who pays, why now, riskiest assumption, kill criteria, cheapest test of the assumption | **Human go/no-go.** No code before this exists — an unvalidated idea is cheapest to kill in prose |
| **V1 Definition** | PRD + MVP scope (what's deliberately OUT), user journeys with acceptance criteria, data-model sketch, stack decision with rationale | Stop-the-line: no implementation without acceptance criteria. **Human approves scope** |
| **V2 Foundation** | Deployable skeleton: repo + CI gates (test/typecheck), deploy pipeline + health/ready checks, validated env with a **fail-closed production guard**, auth decision wired, error-monitoring hook, seed/reset path, README quickstart | "Hello world" **deployed and live-verified**; CI green. Security and DX are laid here — retrofitting costs 10× |
| **V3 Build (MVP)** | The product, feature by feature, via the execution machinery (§1–§5). Every checkpoint applies the pillar lenses | All MVP acceptance criteria met; behavioral/eval suite exists for AI-driven products |
| **V4 Hardening** | Four explicit audits (§0.2): security review, UX pass, DX pass, efficiency pass — plus ops readiness (backups, monitoring, runbook, guard coverage) | Reviewer-verified production-readiness checklist; findings fixed or accepted in writing |
| **V5 Launch** | Production deploy, first-user onboarding, **live end-to-end verification on the deployed instance**, monitoring confirmed receiving events, rollback tested | First real user/business served. **Human owns the launch decision** |
| **V6 Operate & evolve** | Feedback → ranked feature ideas → user-reviewed → growth efforts (phased trio with locked decisions); ops review of errors/costs; retros that amend THIS document | Continuous — each growth effort re-cycles V3–V5 gates |

A stage may be revisited (a pivot reopens V0/V1; a big growth effort re-runs V4
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
  token/context budgets (§2.2), per-feature spend visibility.
- Agent efficiency: route to the smallest altitude that fits (§1); reuse
  existing engines before building new ones.

## 1. Three altitudes — route every piece of work first

| Altitude | Trigger | Process | Overhead |
|---|---|---|---|
| **Task** | Typo-class fix, config tweak, single-file bug with an obvious test | Branch → fix → verify → PR | Minutes |
| **Session** | One sitting of focused work: a feature slice, a bug hunt, a refactor | Session lifecycle (§4) | One branch, one PR |
| **Effort** | Too big for one sitting: multi-feature, migration, audit | Plan trio + phases + checkpoints (§5) | `.plans/` ledger, reviewer gates |

Name the stage (§0), then route. When unsure between Session and Effort: if you
cannot pre-resolve all file targets in one exploration pass, it's an Effort.
Escalating mid-flight is fine (log it); silently sprawling is not.

## 2. Principles

1. **The ledger outlives the transcript.** Durable state lives in files
   (`.plans/<effort>.state.md` for efforts; PRs/issues for sessions), never only
   in chat. Any fresh agent must resume from files alone.
2. **Ingest conclusions, not corpora.** Delegate high-volume reading to subagents
   that return distilled results. Budget ≤30% of the context window per session
   (~1,500 lines of reads); grep-first ranged reads for files >400 lines.
3. **Retrieval-first.** If a code index exists, use it before grep + whole-file
   reads for where/what/blast-radius questions.
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
| `git push` | Warns when tracked files are modified-but-uncommitted (untracked scratch dirs don't warn) |
| `gh pr create` | Reminder to have run the gates |
| `Write`/`Edit` | Reminder to update docs when high-impact files change |

Blockers exit 2 (hard stop); reminders exit 0. Guardrails catch autopilot
mistakes; they never replace judgment.

## 4. Session lifecycle (the default altitude)

**Open** — route the work (§1); create/checkout the branch (never the default
branch); if part of an effort, read the ledger → `Next up:` → that brief.

**Work** — smallest change meeting the acceptance criteria; follow repo
conventions (the project's conventions file is the engineering source of truth);
tests accompany behavior changes; deviations from a brief are allowed but MUST be
logged in the ledger.

**Close** — gates green (§10); live verification if there's a runtime surface
(§2.5); commit (`type(scope): description` — for effort sessions
`<effort>(S<n>): summary`); push the branch; PR with summary + test plan;
**update the record** (§6.1 — spawn the `chronicler` agent, then republish the
owner status page); **never merge the default branch yourself** — HITL merges
(merging often auto-deploys).

**Context discipline** — at ~25% usage, finish the current edit to a compiling
state, verify, write the handoff, end. A clean half-session beats a degraded full
one. Finished early (<15%)? Pull the next same-phase brief (checkpoints always
end a session).

## 5. Effort lifecycle (multi-session work)

The plan trio, written by a dedicated planning session:

| File | Job |
|---|---|
| `.plans/<effort>.md` | Master plan: numbered tasks with acceptance criteria, **locked decisions (dated)**, risks, open questions each with a recommendation |
| `.plans/<effort>.sessions.md` | One brief per session: pre-resolved reads (file → measured line count → anchors), do/verify steps, read budget; phases with named branches |
| `.plans/<effort>.state.md` | Ledger: checklist, deviations log, handoff log (≤10 lines each, newest first), `Next up:` |

Rules: briefs pre-resolve targets so execution sessions never explore; one branch
per phase (merged at checkpoint with HITL go-ahead); migrations and
CI/deploy-touching changes get extra checkpoint scrutiny; **one-corrective-retry**
— a failing session/agent is retried once with a corrective note, then escalated
to the human.

**Checkpoints** end every phase: the independent `reviewer` agent (fresh context)
re-runs all gates, diff-reviews `base..head`, performs deferred manual/live items,
checks claimed deviations against the actual diff, restores datastore state (§10),
and returns APPROVE / REQUEST CHANGES with concrete findings. Review fixes land as
their own ledger entries (`S<n>-fix`).

If the `effort-run`/`effort-continue`/`effort-plan` skills are installed, use
them to author and drive the trio; otherwise follow this section by hand.

## 6. Roles

| Role | Who | Duty |
|---|---|---|
| **Implementer** | The main session agent (or a per-brief subagent in orchestrated efforts) | Route, build, verify, document, hand off |
| **Reviewer** | The `reviewer` agent — always a fresh context | Checkpoint reviews; pre-merge review of risky changes; five pillar lenses + QA + architecture in one pass |
| **Chronicler** | The `chronicler` agent | Keeps the record (§6.1); documents, never touches product code |
| **HITL** | The human owner (§10) | Answers open questions, merges the default branch, owns deploys and anything irreversible |

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
the deployed instance** for anything user-facing. "Deployed and verified" is the
finish line, not "PR open".

## 8. Evolution: the loop that improves the loop

- **Retro** after significant efforts: what to keep/change lands as edits to THIS
  document or the guardrails — via PR like any other change.
- **Lessons become memory or docs**: project-derivable facts → repo docs;
  agent-behavioral lessons → auto-memory. Never both.
- **Stale-doc rule**: any session that catches docs lying about the code fixes it
  in the same PR.
- **Harness changes are code**: hooks, commands, agents, and this protocol are
  versioned and reviewed like source.

## 9. How this maps to the plugin

- Agents `reviewer` and `chronicler` ship with the plugin.
- Guardrail hooks (§3) install automatically.
- Commands: `/workflow-init` (bootstrap a project into this workflow),
  `/start-work`, `/check-workflow`, `/pre-pr`, `/end-work`, `/quick-fix`, `/retro`.
- The `venture-workflow` skill points every session at the project's
  `docs/AGENT-SESSIONS.md` (or this master if none exists yet).
- Templates for the status page, `idea.md`, and this protocol live under the
  plugin's `templates/`.

## 10. Project profile (filled by `/workflow-init`)

Until `/workflow-init` runs, these are unknown — discover them from the repo or
ask the human. A project's own `docs/AGENT-SESSIONS.md` replaces this block with
concrete values.

| Key | Value |
|---|---|
| **HITL (merge/deploy authority)** | _(the human owner's name)_ |
| **Default branch** | _(e.g. main)_ |
| **Test gate** | _(e.g. `npm test`)_ |
| **Typecheck/lint gate** | _(e.g. `npm run typecheck`)_ |
| **Build** | _(e.g. `npm run build`)_ |
| **Datastore seed/reset** | _(e.g. `npm run seed`)_ |
| **Deploy + live-verify** | _(how it ships and how you confirm on the deployed instance)_ |
| **High-impact files** (docs-reminder targets) | _(conventions file, schema, architecture docs…)_ |
| **Issue tracker** | _(e.g. GitHub Issues via `gh`)_ |
