# Feature brief — adaptive-ceremony (2026-10-13)

Interviewee: Baker. Source: `docs/product/decisions/2026-10-12-goal-statement.md`
§E1. Everything below the interview block is drafted.

## Problem

The workflow applies a venture's full ceremony (V0–V6 stage gates, every stage
artifact, every checkpoint) to every project regardless of what it is. A
markdown plugin, an Electron companion app and a production venture taking
payments all owe the same artifacts and gates, so low-risk projects pay
sessions, owner prompts and reviewer spend that buy them nothing (goal metric
1). Meanwhile the "which changes are dangerous" knowledge is written three
times, in three shapes:

1. `templates/operate-triage.md` — 8 fixed **escalation classes** (schema/
   migrations, auth, payments, CI/deploy config, secrets, third-party
   contracts, not reproducible, size above S).
2. `templates/WORKFLOW.md` §5 LA-5 `<!-- rule: fable-boundary -->` — the
   reviewer-tier list (auth, session/entry credential, authorization/tenancy,
   money, schema/migrations, security boundary).
3. `agents/reviewer.md` description — "risky-change reviews (auth, schema,
   migrations, CI/CD, webhooks, payments)".

And the ceremony knobs are scattered: three altitudes (§1), four tune presets
(`templates/tune-presets.json`), autopilot's check-in level → gate policy
(§11), the intake classifier, `/next`. E1: **unify, do not duplicate.**

## Interview (owner's answers, verbatim choices)

- **What & who**: "Derived, then owner-edits" — a tool reads observable
  signals at bootstrap / adopt / sync, writes a ceremony profile into §10
  plus a per-stage/gate table; the owner can override any cell.
- **Taxonomy**: "Extract triage's 8 classes" — move the 8 escalation classes
  into one shared template; operate-triage, the ceremony profile, the
  reviewer's risky-change list and the merge guard all read it.
- **Ambiguous-signal fallback** (goal open question 6): "Ask the owner once"
  — derivation stops and asks per ambiguous signal at bootstrap/adopt time.
- **Priority / posture**: "Top, standard posture" — it IS the next mission;
  `human-merge` gate policy, reviewer checkpoint per phase.
- **NOT in v1**: "Auto re-derive" (profile is derived at bootstrap/adopt/sync
  only, not when signals change mid-project); "Missions app UI" (no profile
  editor/display in Missions; only its contract tests must stay green).
  → Autopilot rewiring and intake + `/next` rewiring are **IN** v1.
- **Edge cases IN**: "Owner override vs. class" (an owner skip on a gate
  carrying an irreversible class is refused); "Signal drift" (at least a
  doctor/sync warning); "Fork-rewritten stage table" (no hard-coded V0–V6);
  "Existing projects" (adopted repos get a profile via `/sync` with no
  behaviour change until the owner confirms).
- **Success**: "E1's own bar, 3 changes" — on 3 real changes across XYZ
  repos, low-ceremony projects show fewer sessions / owner prompts /
  reviewer spend vs. baseline, zero safety regressions, Missions contract
  tests green.
- **Measurement set**: "Orderly, Missions".

## Journeys and acceptance criteria (stable ids)

**J1 — a project gets a ceremony profile (bootstrap / adopt)**
- AC-1 A derivation tool reads observable signals (at minimum: current
  stage, deploy target present, auth/payments/schema surfaces present, test
  policy, publish policy, catalog row, merge policy) and writes a `Ceremony
  profile` row in §10 plus a ceremony table: one row per stage artifact and
  per gate, each tagged `required` / `optional` / `skipped`, with the signal
  that decided it.
- AC-2 A signal the tool cannot decide is asked of the owner **once**, as one
  batched question at bootstrap/adopt; the answer is recorded with its date.
  No answer → that cell is `required` (fail closed).
- AC-3 The tool reads the stage and gate table **from the protocol template**
  (`docs/WORKFLOW.md` §0), never a hard-coded V0–V6 list; a fixture with a
  rewritten table (different stage names/count) derives correctly.

**J2 — the owner edits the profile**
- AC-4 Any cell is owner-editable in place; an edit is a dated override line.
- AC-5 An override that marks `skipped` a gate carrying an irreversible class
  (payments, CI/deploy config, secrets, schema/migrations, auth) is refused
  by lint (and by the guard where a hook already checks that path) — the
  safety boundary cannot be edited away.

**J3 — a gate is skipped**
- AC-6 A skipped gate leaves exactly one deviation line in the record.
- AC-7 Lint fails on a `required` gate that some command path can skip
  silently (no deviation line, no class).

**J4 — one gate-class taxonomy**
- AC-8 One template (e.g. `templates/gate-classes.md`) holds the classes,
  built from operate-triage's 8; `templates/operate-triage.md`, the LA-5
  `fable-boundary` rule, `agents/reviewer.md`, and the ceremony table all
  reference it instead of restating a list. Lint fails if a second inline
  class list reappears.
- AC-9 Every gate in the ceremony table carries its class (or `none`).

**J5 — the knobs read the profile (unify)**
- AC-10 Altitudes (§1), tune presets, autopilot check-in level / gate
  policy, the intake classifier and `/next` consult the ceremony profile
  rather than keeping a parallel notion of "how much ceremony"; where a knob
  stays, its relation to the profile is one stated line, not a second table.

**J6 — existing projects and drift**
- AC-11 `/sync` on an already-adopted repo writes a derived profile marked
  `proposed`; behaviour is unchanged (full ceremony) until the owner
  confirms.
- AC-12 `/doctor` (and `/sync`) warns when a current signal disagrees with
  the profile (e.g. payments appeared after profiling) — warning only, no
  auto re-derive.

**J7 — measured**
- AC-13 On 3 real changes across Orderly and Missions, low-ceremony
  projects show an improvement on goal metric 1 (sessions, owner prompts,
  reviewer spend, correctives) vs. baseline, with zero safety regressions;
  Missions' contract tests still pass.

States the truthful-record pillar must cover: profile absent (pre-sync),
`proposed`, confirmed, overridden, drifted, and a derivation that could not
read the stage table (fails closed, says so).

## NOT in v1 (deferred, not denied)

- Automatic re-derivation when signals change mid-project (warning only).
- Any Missions app UI for the profile.
- A generic multi-industry abstraction (anti-goal: industries are forks;
  only the stage-table read is generic).

## Journeys and IA (designer)

Draft wording for every owner-facing surface. The plain-report rule
(`skills/plain-report`) applies: action first, every term defined, no ids
without a meaning. Wording is a draft for the builder, not final copy.

**Terms (one word per concept, everywhere):** *ceremony* = the artifacts and
gates a project owes. *Gate* = a stop where a person or reviewer must pass the
work. *Artifact* = a document a stage produces. *Signal* = a fact the tool can
read in the repo (deploy config, a payments dependency, the §10 rows).
*Gate class* = one of the 8 risk classes in `templates/gate-classes.md`;
*irreversible class* = payments, CI/deploy config, secrets, schema/migrations,
auth. *Profile* = the §10 row plus the ceremony table. *Override* = an owner
edit to one cell. *Drift* = a signal that changed after the profile was made.
Avoid "mode", "level", "tier" or "policy" for the profile.

**§10 row — one row, six states** (status first, then why, then the action):

| State | `Ceremony profile` cell |
|---|---|
| absent | row missing; `/doctor`: "No ceremony profile. Every gate runs. Run `/agentic-workflow:sync` to propose one." |
| proposed | `proposed 2026-10-13 — full ceremony still applies until you confirm. Review the ceremony table below, then say "confirm ceremony profile".` |
| confirmed | `confirmed 2026-10-14 by Baker · derived 2026-10-13 from 7 signals · 0 overrides` |
| overridden | `confirmed 2026-10-14 by Baker · 2 overrides (see the lines under the table)` |
| drifted | confirmed cell + `· drift 2026-10-20: payments surface appeared (profile says none) — not re-derived; edit the table or run /sync` |
| derivation failed | `not derived 2026-10-13 — could not read the stage table in docs/WORKFLOW.md §0 (no table found under "## 0."). Every gate runs. Fix the table, then run /sync.` |

**Ceremony table** (example: a markdown plugin; rows come from the §0 table
the tool read, never a fixed V0–V6 list):

| Item | Tag | Class | Decided by |
|---|---|---|---|
| V0 idea.md (artifact) | required | none | default: every project states its problem |
| V0 go/no-go (gate) | optional | none | signal: repo had commits before adopt |
| V1 PRD + scope (artifact) | required | none | default |
| V1 UX brief (artifact) | skipped | none | signal: no UI surface found |
| V1 scope approval (gate) | required | none | default |
| V2 deploy pipeline (gate) | required | CI/deploy config | signal: `.github/workflows/` present |
| V3 checkpoint review (gate) | required | none | signal: Merge policy `human-only` |
| V4 security audit (gate) | skipped | none | signal: no auth, payments or schema found |
| V4 UX audit (gate) | skipped | none | signal: no UI surface found |
| V5 live verify (gate) | optional | none | owner answer 2026-10-13 (question 2) |

Overrides sit under the table, one dated line each:
`2026-10-14 Baker: V0 go/no-go optional → skipped (was: signal, repo had commits).`

### J1 — bootstrap / adopt derives a profile
1. Owner runs `/bootstrap` or `/adopt`. The tool reads the §0 stage table, then the signals.
2. If any signal is unclear, the owner gets **one** numbered message; each item says what happens on no answer:
   > **Answer 2 questions so I can set how much ceremony this project needs** (or skip — unanswered items stay `required`).
   > 1. `src/billing/` exists but I found no payment provider. Does this project take payments? (yes / no)
   > 2. No deploy target in §10. Does this ship to users? (yes / no / later)
3. Answers land in Decided by as `owner answer <date> (question N)`. No answer → `required`, decided by `no answer <date> (fails closed)`.
4. The bootstrap/adopt report ends: "Ceremony profile written: 6 required, 2 optional, 2 skipped. It is in force now — edit any row in §10 to change it."
5. Stage table unreadable → no table written, §10 shows the *derivation failed* cell, and the report says so on its first line.

### J2 — the owner edits a cell
1. Owner edits a tag in the table; a dated override line is added under it.
2. Lint checks it. Accepted → silent. Refused (irreversible class):
   > **Override refused: "V2 deploy pipeline" cannot be skipped.** It carries the gate class CI/deploy config, one of the five irreversible classes (payments, CI/deploy config, secrets, schema/migrations, auth). Set it back to `required`. If this repo truly has no deploy config, remove `.github/workflows/` and run `/sync` — the signal, not an override, removes the gate.
3. The merge guard repeats the refusal at merge time where it already checks that path.

Open question for the planner: should `optional` on an irreversible-class gate also be refused? I recommend yes — `optional` is a skip with one more step.

### J3 — a gate is skipped
- One deviation line, in the mission ledger's deviations log (JOURNEY when there is no ledger):
  `2026-10-15 skipped V4 UX audit — ceremony profile says skipped (signal: no UI surface found; class none).`
- Lint failure for a silent skip (AC-7):
  > **Lint: "V3 checkpoint review" is `required`, but `/autopilot` at check-in level `none` can pass it with no deviation line.** Make that path write the line, or tag the gate `optional` in the profile.

### J4 — one class list
- The Class column, reviewer findings and triage escalations use the exact names in `templates/gate-classes.md`. Reviewer phrasing: "Risky change — class: schema/migrations (gate-classes.md)."
- Lint on a second list: "Found an inline list of gate classes in `agents/reviewer.md` line 4. Link `templates/gate-classes.md` instead."

### J5 — the knobs read the profile
- Each knob states its relation in one line, e.g. the `Tune preset` row: "lean — sets model strength; which gates run comes from the ceremony profile."
- `/next` and intake name the profile when it changed their answer: "Next: `/agentic-workflow:release` — the V4 audits are skipped by this project's ceremony profile."
- Autopilot check-in report: "Passed 3 gates, skipped 2 (ceremony profile; each logged as a deviation)."

### J6 — existing projects and drift
1. `/sync` on an adopted repo writes the table and the *proposed* cell, then says:
   > **Ceremony profile proposed — nothing changed yet.** Every gate still runs. Review the table in §10 and say "confirm ceremony profile" to apply it; until then this repo keeps full ceremony.
2. `/doctor` (and `/sync`) on drift — a warning only, never a re-derive:
   > **Ceremony profile is out of date: payments surface found (`stripe` in package.json) but the profile was made with none.** The V4 security audit is still `skipped`. Edit that row to `required`, or run `/sync` to propose a fresh profile.
3. Several drifts → one warning with a count and the list, never one warning per signal.

## Locked decisions (owner, 2026-10-13 — the single approval moment)

Inputs: the memos (`2026-10-13-adaptive-ceremony-memos.md`), the counsel
brief (`2026-10-13-adaptive-ceremony-counsel.md`; technical: proceed with
changes; financial: do not proceed at memo scope).

- **L1 Scope — full shape, phased, 3–4 sessions.** Architect recommendations
  stand: D1-A (§10 `Ceremony profile` row + §10.2 table; `/sync` preserves §10
  through the next `## ` heading, in its own tested commit), D2-A (new
  `tools/ceremony.mjs` derive / effective / check + one conform ladder entry;
  the command batches the owner asks), D4-B (§0 table fenced, with `Artifacts`
  and `Gate` columns; fenced §5 `checkpoint-gates` list; no fence → all
  `required`, says why), D5-B (mission, autopilot, intake and `/next` read the
  effective cells; altitudes, §11 gate policy and presets each get one
  relation line), D6-A (refusal at resolution, `ceremony-skip` rule with
  byte-identical copies, lint on missing copies). Runs as `/mission phases`.
- **L2 Taxonomy — triage's classes + `security-boundary`.** Credential and
  tenancy fold into auth, money into payments, webhooks into third-party.
  "Not reproducible" and "size above S" are triage-only report qualifiers.
  Irreversible = every gate class except third-party. One file:
  `templates/gate-classes.md`, with one column per reader.
- **L3 Safety conditions (all four):**
  - irreversible-class gates can be neither `skipped` nor `optional`;
  - only `ceremony.mjs effective --log` writes the deviation line; one
    anchored regex in `merge-guard.sh` blocks an agent merge while any §10.2
    row skips an irreversible class id; the designer's J2 copy is corrected
    (no edit-time refusal is promised);
  - a derived `skipped` needs a positive signal; a probe that finds nothing,
    on a gate whose class would be irreversible, becomes an owner ask;
  - drift on an irreversible-class signal flips the affected rows' effective
    value to `required` (tighten-only; the deferred auto re-derive stays out).
- **L4 Measurement — obligation row, honest.** The mission passes on the
  mechanical ACs. AC-13 (3 real changes on Orderly + Missions) becomes an
  obligation-register row, scored on sessions + a new `Reviewer runs:`
  counter bumped by `ledger.mjs`. Owner prompts and token spend are "no
  claim". Orderly is the safety-unchanged check. The analyst's thresholds are
  confirmed.
- **Carried as plan conditions (from counsel, technical):**
  - one writer for class: §10.2 stores no class column; the class is joined
    at read time;
  - Missions-contract precondition: grep Missions' contract tests for the
    §10/§0 shapes before any template edit, and record the result;
  - measure the bytes in `templates/WORKFLOW.md` against the lint ceiling
    first.
- **Brief corrections accepted (architect):**
  - AC-5 is enforced at resolution plus the merge-guard backstop, not by lint
    reading a venture's WORKFLOW.md;
  - the per-change gates come from §5, not §0;
  - "current stage" may need an owner ask;
  - the merge guard reads only the §10.2 regex, not the taxonomy file.
- **Priority:** top. It is the next mission. Gate policy: `human-merge`,
  reviewer checkpoint per phase (Fable on boundary-class diffs).
- **L5 (owner, 2026-10-13, after the plan-judge): class tag allowed.**
  "Yes, allow the tag." Counsel condition 4 is amended: each §10.2 gate row
  may carry a `· class:<id>` token in its signal cell. The token is written
  by `ceremony.mjs`, and `check` fails any mismatch with the fenced tables.
  This is the only way the merge-guard regex (L3) can see a row's class.
  Start: later. The ledger's `Next up:` is S1.
- **L6 (owner, 2026-10-14): taxonomy amended. 8 change classes + 9 action
  classes.** "Yes, lock it." Amends L2 after a Fable completeness review
  (counsel brief, addendum).
  - **Change classes** (what a diff touches; reviewer tier and triage read
    these): schema-migrations, auth (widened to personal-data stores),
    payments, ci-deploy, secrets, third-party (the only class that is not
    irreversible), security-boundary (widened to the discipline files:
    hooks/, tools/, templates/, hooks.json, codex.rules, .claude/agents),
    supply-chain (new: a lockfile or manifest dependency add or bump, install
    scripts; top tier, triage escalates).
  - **Action classes** (what a gate authorizes doing; all irreversible, all
    fired by a human, so a gate carrying one is `human` and can never be
    `optional` or `skipped`):
    - production-deploy (ship, rollback, restart, scale, re-deploy; never
      delegable);
    - merge-to-default (delegation covers merging a reviewer-APPROVEd PR
      only; records-only is a third value scoped by path; a direct push to
      the default branch is never sanctioned);
    - publish-outward (delegable only within the hook's scope: approved +
      due + organic + `kind: post`; outreach never);
    - spend (never delegable);
    - commercial-commitment (prices, proposals);
    - outbound-contact (a message to a real person);
    - destructive-data (delete, restore or overwrite production data;
      datastore reset);
    - release-cut (tag push, a version cut that triggers a pipeline);
    - user-experiment (a behavioural experiment on real users; never
      delegable).
  - **Rules:**
    - Gate-cell grammar is defined once:
      `<id> · human|reviewer|record · <class>[+<class>]*`, with no
      whitespace variants. `check` fails an action class on a gate whose
      firer is not `human`.
    - The triage column covers change classes only; action classes read
      `n/a`, and the dedup lint must not match action names.
    - `v5-launch` = production-deploy+publish-outward+release-cut; the
      mission-close gate carries release-cut.
    - `none` on the V0/V1 decision gates never means "skippable without an
      answer". The AC-2 fail-closed rule still applies, and the fence comment
      says so.
    - The merge-guard regex lists every irreversible id, change and action
      classes alike. If it cannot be extended in the same session, stop and
      surface.
  - Left out on purpose (not irreversible, and adding them would make a
    second taxonomy): licensing, infra cost, prompts/evals.
