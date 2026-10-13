# Counsel brief — adaptive-ceremony (2026-10-13)

Advisors: technical (Fable), financial (Fable). Inputs: the brief, the memos
(D1–D6), the metrics doc, the tree at dc9bf34.

## Verdicts

| Lens | Verdict |
|---|---|
| Technical | **Proceed with changes** — 3–4 build sessions; measurement moves to the obligations register |
| Financial | **Do not proceed at the memo scope; proceed with changes at a one-session scope** |

## Where they agree

- **One session is not honest for the memo scope.** Technical says 3–4 build
  sessions. Financial says 5–7 plus 1–2 to measure. The record backs this:
  operate-triage was smaller and took 2 sessions, and builder-done-rules was
  estimated at 4 and used 5.
- **AC-13 cannot pass inside the mission.** Owner prompts and reviewer spend
  are recorded nowhere. The Orderly and Missions baselines are not in this
  repo. Declare those sub-metrics "no claim" up front; the 3 real changes
  become an obligation-register row.
- **Refuse `optional` on irreversible-class gates** (agrees with the
  designer). `optional` has no defined runtime meaning; on an irreversible
  class it is a skip with cover.
- **The `Ceremony cost` block should record only what a tool can count.**
  Keep sessions and add a `Reviewer runs:` counter that `ledger.mjs` bumps.
  Drop owner prompts and token counts until the runtime exposes them.

## Where they disagree

- **D3, the 7th class `security-boundary`.** Technical: accept it, because
  it is the only variant that keeps today's LA-5 coverage. Financial: exactly
  8 classes with auth widened, so E0's shipped behaviour does not change.
- **Scope.** Technical keeps the D1–D6 shape and adds safety conditions.
  Financial cuts to: the shared class file, a hand-filled profile of the §5
  per-change gates only, `mission.md` reading it and writing the deviation
  line, and a `Reviewer runs:` counter. No derivation tool, no §0 fence, no
  owner asks, no drift check. It funds derivation only after 3 plugin
  missions show sessions saved.

## Technical conditions (if the full shape proceeds)

1. **Silent skip path (D6).** Only `ceremony.mjs effective --log` writes the
   deviation line, so the line proves the resolver ran. One anchored regex in
   `merge-guard.sh` blocks an agent merge while any §10.2 row is `skipped`
   with an irreversible class id. Fix the designer's J2 wording, which
   promises an edit-time refusal that D6 does not deliver.
2. **A probe that finds nothing is not proof.** A derived `skipped` needs a
   positive signal (for example `Deploy: none`). A probe that finds nothing,
   on a gate that would carry an irreversible class, becomes an owner ask and
   never a skip.
3. **Drift tightens.** When `check` finds an irreversible-class signal that
   appeared after profiling, it flips the affected rows' effective value to
   `required`. It only ever tightens, so it is not the deferred auto
   re-derive.
4. **One writer for class.** §10.2 does not store a class column; the class
   is joined at read time from the fenced tables.
5. **Missions-contract precondition.** Before any template edit, grep
   Missions' contract tests for the §10 and §0 shapes, and record the result
   in the plan.
6. **Budget.** Measure the bytes in `templates/WORKFLOW.md` first. The sync
   preserve change ("§10 through the next `## `") gets its own tested commit.

## What would change their minds

- Financial: a count of the sessions the gates consumed on this repo's last 5
  shipped changes. About 1 session per change attributable to skippable gates
  means the full build pays back in about 6 changes; under 0.5 means it never
  pays back.
- Technical: a harness run showing that an agent who edits §10.2 to skip an
  irreversible gate is stopped before the gate passes.
