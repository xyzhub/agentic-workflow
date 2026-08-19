# n=1 validation — the one-session mission core (v1.45.0–v1.48.6)

**Date**: 2026-08-19 · **Venture**: orderly · **Mission**: `guest-payment-status-authz` (#605, security fix) · **Verdict**: the refit holds; plugin stays enabled.

## Why this measurement exists

The owner disabled the plugin on 2026-08-19 after missions ran 24–48 h and consumed
38% of a weekly Fable quota (worst measured: 18 sessions planned → ~44 run, LA-1;
a standing supervisor at ~1.08M tokens for six beats, LA-5). One night of refit
(PRs #39–#61: one-session default, overrun stop, staging→verify→PR, queue+groom,
catalog, conformance, ci-wait, AUTH.md) was judged by running one real item end to
end under the new rules.

## The run

| Measure | Result |
|---|---|
| Estimate vs used | **1 / 1** — held exactly; write-ahead increments observed |
| Wall time | **~50 min**, planner → APPROVE → branch-deploy verify → PR #729 (stopped at the human gate, unmerged) |
| Review | one-shot Opus reviewer, APPROVE (Sec 3/3 Corr 3/3 QA 3/3 DX 2/3 UX 2/3 Arch 3/3); re-derived the failing control itself from a scratch checkout of origin/main (5 fail / 4 pass, exact match) |
| Gates | lint 0 · typecheck 0 · unit 3336 · integration 977 on scratch DB; the new integration file re-run alone (5/5) because the suite reporter can't prove a single file ran — LA-2 honored |
| Verification | §5 hotfix path (staging 128 commits ahead → v5 landing skipped, recorded): branch deploy of the exact SHA, ci-wait GREEN (full 40-char), parsed-body assertion that `qrToken` is absent from every response shape; **V3 parked, not ticked** — unsatisfiable on the main base; staging restored to v5 afterwards (probe-verified) |
| Spend (subagent floor) | mission: 294k Opus (planner 98k · builder 115k · reviewer 81k). Session-wide: one Fable one-shot (185k) found the #726 money blocker — the most valuable output of the session; 572k of Sonnet probes did the mechanical sweep. LA-5's shape, confirmed in data |
| Stops | exactly one, exactly where designed: the PR-to-main human gate |

## Also produced by the same machinery, same session

- Fable pre-promote gate: REQUEST CHANGES with a verified money blocker (#726) — the
  promote the owner distrusted was, in fact, unmergeable.
- Catalog seeding caught a silent feature regression (#727) the diff-review missed;
  owner ruled it intended and it became a decision doc instead of a bug.
- /settle reaped 7 branches on ci-wait evidence; /groom turned a 123 KB backlog into
  130 groomed issues + a 14 KB generated view.

## Caveats (what n=1 does not prove)

No plain-Claude twin run (comparison is against measured historical incidents, not a
control); #605 is smaller than the partial-payments class; the orchestrator's own
context spend is not in the subagent floor; n = 1.

## Follow-ups queued

Reopened partial-payments corrective (#726) through the same money gate; then
inventory-costing completion; plugin queue #44 #45 #46 #53 #56 #60 #62 #63, memory #42.
