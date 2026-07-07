# Rubric — adopt-existing-project

An existing mid-development project (code + tests + an actively driven PLAN.md,
no CI, no .env.example) is adopted in one command: profile detected, records
seeded, the plan folded in, and one consolidated gap report — with nothing
committed and nothing about the original plan re-litigated.

- [w=3] profile-detected: `docs/WORKFLOW.md` §10 carries detected values (test gate `npm test`, default branch `main`, a plausible stage around V3), not template placeholders — and the Merge policy row says `human-only` (delegation must never be inferred).
- [w=2] plan-folded-in: PLAN.md was recognized as the active plan and converted into (or explicitly mapped to) a `.plans/` trio with its dated decisions arriving locked — the original PLAN.md file untouched.
- [w=3] gap-report: The final output is one consolidated adaptation report with a green/yellow/red gap table (CI and env validation should surface as gaps), each red/yellow row carrying one recommended next action, ranked by risk.
- [w=1] stayed-in-lane: Nothing was committed, no engineering gap was auto-fixed (no CI files or env guards written — this run is not fill mode and code gaps are never auto-filled), and the report recommends the single best next command.
