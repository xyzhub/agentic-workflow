# adaptive-ceremony — metrics, baselines, acceptance (2026-10-13)

Source brief: `docs/product/decisions/2026-10-13-adaptive-ceremony-brief.md` (success: "E1's own bar, 3 changes", measured on Orderly and Missions). Goal metric 1: `2026-10-12-goal-statement.md` lines 33-37.
Labels: **measured** (source cited) / **estimated** (arithmetic shown) / **unmeasured**. Nothing below is invented; a blank is "unmeasured".

## 1. What is already recorded, per change (checked 2026-10-13 in `.plans/`)

| Sub-metric | Where it lives today | Status |
|---|---|---|
| Sessions | `Estimate:` and `Sessions used:` in `.plans/<m>.state.md`, bumped write-ahead via `tools/ledger.mjs` (e.g. operate-triage: 2 / 2) | measured, per mission |
| Owner prompts | not recorded anywhere (state.md, sessions.md, `.plans/runs/` hold none) | **unmeasured today** |
| Reviewer spend | not recorded; `.plans/runs/` holds only 8 codex-run files (`n1-codex-astra-*`), no token or cost fields in the ledgers | **unmeasured today** |
| Correctives | only implicit: an `S1-fix` brief appears in sessions.md and in the Handoff log; no counter | partly measured (grep by hand) |
| Safety | `## Deviations` and gate results in the Handoff log; lint and hook test exit codes | measured, per gate run |

Gap (finding): three of five sub-metrics have no capture. The mission must add them, or the success claim cannot be made. Cheapest fix, specified here and built via the normal machinery: a `## Ceremony cost` block per change in the ledger with five lines: `Sessions:`, `Owner prompts:`, `Reviewer runs:` (count plus subagent tokens as the orchestrator observed them), `Correctives:`, `Gates skipped:` (each with its deviation line).

## 2. Baseline source

- This repo: prior missions give **sessions** and hand-countable **correctives** only (n≈15 ledgers in `.plans/`). Owner prompts and reviewer spend: unmeasured here. A same-class reference point exists (chronicler ≈30-33k subagent tokens/run, n=3, tune-presets metrics B10) but it is not a reviewer figure.
- Orderly and Missions: **not available in this repo and not pulled.** Must be pulled by the human or by an agent with access to those repos (read-only): for each of the last 3 comparable shipped changes in each repo, record sessions (ledger), owner prompts (transcripts, if retained, else unmeasured), reviewer runs and tokens (transcripts or `.plans/runs`), correctives (ledger), and gates that ran. Pull date and commit/PR cited per row.
- "Comparable" = same size class (S or M by the triage size rule) and same gate-class set as the test change. If fewer than 3 comparable priors exist, say so in the baseline table; do not pad.
- If a baseline cell stays unmeasured, that sub-metric cannot be called "improved"; it is reported as "unmeasured, no claim".

## 3. What "done" means, per sub-metric

Applies to **low-ceremony** projects only (profile derives few `required` cells). High-ceremony projects are expected to show no change, and that is not a failure.

| Sub-metric | Done when (per changed project vs. its own baseline) |
|---|---|
| Sessions | measured `Sessions used` below the baseline median for comparable changes, on at least 2 of 3 changes, none above baseline max |
| Owner prompts | fewer than baseline median on at least 2 of 3; requires baseline captured, else "no claim" |
| Reviewer spend | fewer reviewer runs than baseline median on at least 2 of 3; tokens reported alongside, not required to compare if token baseline is unmeasured |
| Correctives | not higher than baseline on any of the 3 (this is a guard, an improvement is a bonus) |
| Safety | zero regressions on all 3 (section 4); one regression fails the whole success claim |
| Missions contract tests | green on every change that touches Missions (command and exit code cited) |

The thresholds ("median", "2 of 3") are this document's proposal, not the owner's locked numbers. The brief locks only "fewer ... vs. baseline, zero safety regressions". Owner to confirm or replace.

## 4. Safety regression: definition and check

A safety regression is any of: (a) a gate whose class is irreversible (payments, CI/deploy config, secrets, schema/migrations, auth, per `templates/gate-classes.md` once it exists) was skipped, downgraded, or lost its reviewer tier; (b) a skip with no deviation line (AC-6/AC-7); (c) a hook or lint guard that passed before now passes less (lint exit, `hook-test`, `agents-test`, `lint-test` case counts drop or go red); (d) a defect on the change that an omitted gate would have caught, found later by the owner or by operate.

Check, per change:
1. **Gate-class coverage on Orderly**: before profiling, list the gate-class set of the project's gates from its current §10/§0 (the full-ceremony table). After profiling, list the same. Pass only if every irreversible-class gate is still `required` and its reviewer tier is the same. Diff of the two lists cited. Orderly is the test because it carries payments/auth/schema surfaces.
2. Run `node tools/lint.mjs`, `lint-test`, `hook-test`, `agents-test` on the plugin; counts must be >= pre-change counts (record them before; not captured today).
3. Count `skipped` cells in the confirmed profile; each must have one deviation line (equal counts).
4. After the change ships, owner or operate reports any defect within the change's own window; (d) is judged by the owner, so it is observed, not computed.

## 5. Is 3 changes enough?

No, for any statistical claim. n=3 gives a direction, not an effect size: no variance, no significance, and three changes across two repos is at most 1-2 per repo. Session counts depend heavily on change size and one oversized change can swamp the rest. Safety "zero regressions in 3" is weak evidence: it excludes a high regression rate but cannot show the rate is low (estimated: 0 of 3 is consistent with a true rate up to 1 - 0.05^(1/3) = 63% at 95% confidence). Treat the result as "go / no-go for continued dogfooding", not proof. A sound claim needs the same capture to continue past 3 (the `## Ceremony cost` block makes it free) and a re-read at n>=10.

Also confounded: the same 3 changes cannot separate "adaptive ceremony" from "the owner is paying more attention because it is a new feature".

## 6. Unmeasured / open

- Owner prompts and reviewer spend baselines (everywhere); Orderly and Missions baselines of every kind.
- Whether Orderly/Missions transcripts are retained long enough to count prompts.
- Pre-change counts for lint-test, hook-test, agents-test (run and record at mission start).
- Owner confirmation of the section 3 thresholds.
