# Scenario evals (tier 2)

Behavioral smoke tests for the plugin's prompts. Each scenario copies a fixture
mini-repo to a temp dir, runs a prompt through headless `claude -p` with the
plugin loaded, applies **deterministic checks first** (files exist, branches,
hook blocks observed), then has an LLM judge score the transcript against a
weighted rubric (pass bar per scenario, default ≥ 75%).

**Costs real tokens (rough order: $1–5 per scenario) — run before releases,
never in CI.** Tier 1 (`node tools/lint.mjs`) is the free every-push gate.

## Run

```
node evals/run.mjs                    # all scenarios
node evals/run.mjs guardrail-push-block routing-altitude
```

Env:

- `EVAL_MODEL` — agent model (default `sonnet`: cheaper, and the conservative
  test — prompts that work mid-tier work above it)
- `EVAL_JUDGE_MODEL` — judge model (default `sonnet`)
- `EVAL_BUDGET_USD` — per-scenario spend cap, overrides `scenario.md`

Results land in `evals/results/<timestamp>/<scenario>.json` (gitignored).
Failing scenarios keep their temp fixture dir for inspection; the summary
prints its path.

## Scenarios

| Scenario | Guards against |
|---|---|
| `routing-altitude` | over-process: mission ceremony for a typo-class fix |
| `guardrail-push-block` | the push-on-default-branch hook not firing, or the agent fighting it |
| `init-workflow-bootstrap` | `/init-workflow` leaving §10 placeholders instead of detected gates |
| `reviewer-checkpoint` | the reviewer trusting handoff claims / missing planted flaws / no scorecard |
| `mission-plan` | `/mission plan` producing briefs that still require exploration |
| `business-model` | the business agent inventing numbers, deciding instead of proposing, or dishonest economics |

## Anatomy of a scenario

```
scenarios/<name>/
  scenario.md   # flat frontmatter (budget-usd, pass-bar, judge-files) + the prompt
  rubric.md     # `- [w=N] id: criterion` lines; the judge scores each 0/1
  checks.mjs    # optional; export default ({dir, events, resultText, sh}) => failures[]
  fixture/      # mini-repo copied to the temp dir (git init + baseline commit added)
  setup.sh      # optional; runs in the repo after the baseline commit (branches, remotes)
```

Gotcha: slash commands in scenario prompts must use the plugin-namespaced form
(`/agentic-workflow:init-workflow`, not `/init-workflow`) — the short form is
"Unknown command" in headless `claude -p` runs.

Keep rubrics about **behaviors, not wording** — scenario runs are
nondeterministic, so criteria like "created a feature branch" survive rewording
while "said the word altitude" does not. When a scenario flakes, re-run just
that scenario before treating it as a regression.
