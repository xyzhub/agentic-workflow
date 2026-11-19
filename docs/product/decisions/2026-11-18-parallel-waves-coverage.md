# Parallel waves: measured coverage on past missions (2026-11-18)

Read-only measurement. Source: the 5 most recent `.plans/*.sessions.md` by
mtime (`ls -lt`, pulled 2026-11-18). Write sets are **inferred** from `Do:`
prose that was never written to declare them; plan-trio files excluded;
`Reads:`-only files not counted as writes.

## Headline

**0 of 13 briefs (0%) could have run in a wave of two or more.** Range with
undecidables excluded: also 0% (0 briefs were undecidable). Two independent
reasons, either sufficient:

1. **Structure.** 11 of 13 briefs are the only brief in their phase, so no
   wave is possible by construction. Only xyz-rebrand Phase 1 has 2 briefs.
2. **File collisions.** Even ignoring phase boundaries, every pair of briefs
   inside a mission shares at least one written file (table below).

## Missions chosen (mtime order)

| Mission | Lines | Briefs | Phases | Briefs in a multi-brief phase | Waveable |
|---|---|---|---|---|---|
| continuous-operation | 868 | 6 (S0-S5) | 6 | 0 | 0 (0%) |
| provider-adaptive | 446 | 2 | 2 | 0 | 0 (0%) |
| jev-browser | 369 | 1 | 1 | 0 | 0 (0%) |
| xyz-rebrand | 307 | 3 | 2 | 2 (S1, S2) | 0 (0%) |
| precompact-handoff | 304 | 1 | 1 | 0 | 0 (0%) |
| **Total** | 2,294 | 13 | 12 | 2 | **0 (0%)** |

owner-surfaces (392 lines) tied the 4th/5th mtime with xyz-rebrand and
precompact-handoff (all Oct 23 00:51); I took xyz-rebrand and precompact-handoff
by `ls -t` order. Not measured, so unknown for owner-surfaces.

## The only multi-brief phase: xyz-rebrand P1 (S1 vs S2)

Collide. S1 writes `rename.mjs`, `rename-test.mjs`, `tools/lint.mjs`,
`conform.mjs`, `hook-test.mjs`, `templates/WORKFLOW.md`, `sync.md`. S2 does
`git mv plugins/agentic-workflow plugins/xyz` and a repo-wide sweep (lint.mjs,
hook-test.mjs, hooks.json, README, CHANGELOG, every test), so it collides with
everything. S2 also runs S1's tool (`rename.mjs apply`): a data dependency no
file set captures.

## Ranked colliding files (briefs whose `Do:` names the file; 13 briefs)

Counts are mentions in `Do:` text, so a run-only mention (e.g. "node
tools/lint.mjs") inflates lint a little; treat as an upper bound.

| Rank | File | Briefs naming it | Notes |
|---|---|---|---|
| 1 | `tools/lint.mjs` (+ `lint-test.mjs`) | 11 of 13 (co: all 6; pa: 2; xr: 3 by mention, S1+S2 write it; jev, ph: 1 each) | Every mission adds a lint check/harness wiring |
| 2 | `templates/WORKFLOW.md` / `docs/WORKFLOW.md` | 9 (co S1,S2,S4,S5; pa S1,S2; jev; ph; xr S1) | doc-sync edits |
| 3 | `plugin.json` / `package.json` (version bump) | 5 (one release brief per mission, always the last) | |
| 4 | `CHANGELOG.md` | 5 (co S5; pa S2; jev; ph; xr S2,S3) | |
| 5 | `tools/hook-test.mjs` | 6 (co S0,S2,S4; pa S1; ph; xr S1,S3 by mention) | |
| 6 | `hooks/hooks.json` | 5 (co S2,S4; pa S1; ph; xr S2) | |
| 7 | `README.md`, `commands/doctor.md` | 4 and 3 | |
| - | `docs/product/catalog/features.md` | **0** | memo prediction not borne out |

Prediction test: `lint.mjs` and `CHANGELOG.md` confirmed as blockers;
`features.md` appears in **no** brief's `Do:` (the memo predicted wrongly or it
is updated by the orchestrator/elsewhere). `lint.mjs`, WORKFLOW, CHANGELOG and
version files are all plausible orchestrator-owned candidates.

## Would making shared files orchestrator-owned rescue coverage?

Mostly no. Removing lint, WORKFLOW, CHANGELOG, version files, hook-test:
- xyz-rebrand S1/S2: still collide (S2 moves the whole plugin dir).
- provider-adaptive S1/S2: still collide (`commands/*.md`, `agents/*.md`,
  `models.mjs` written by S1 and consumed/edited by S2).
- continuous-operation: briefs are a declared dependency chain; the one pair I
  could not rule out on files alone is S0 vs S3, but they sit in different
  phases (waves are intra-phase).
- jev-browser, precompact-handoff: single brief; nothing to pair.
I did not exhaustively check all 15 continuous-operation pairs; that is an
inference, not a measurement.

## Hand-marked parallel-safe flags

None marked parallel-safe. All five files say the opposite: "Not parallel"
(continuous-operation, provider-adaptive, jev-browser, precompact-handoff) and
"nothing is parallel-safe" (xyz-rebrand). The computed result **agrees**; no
disagreement found.

## Caveats (read before relying on the 0%)

- **Selection bias.** These briefs were written by a planner who knew only
  sequential execution existed, and grouped one session per phase. The 0% says
  "past plans were not wave-shaped", not "work cannot be split". It does tell
  you a wave feature would have found nothing to do on today's plans unless
  the planner also changes how it cuts briefs.
- Undecidable briefs: 0 of 13 (every brief names its files). The 0% therefore
  does not depend on the conservative rule.
- n = 5 missions from one repo, all plugin-internal tooling work (heavy shared
  `tools/` and `templates/`). Venture-product missions might differ; not
  measured.
- Write sets came from skimming `Do:` greps and reading xyz-rebrand in full; the
  other four were not read line by line.

## Read

Coverage is 0%, not high enough to justify the feature as designed. The value
question moves upstream: it would only pay if the planner is changed to cut
disjoint briefs within a phase, which no past mission did.
