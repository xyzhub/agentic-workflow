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
| `welcome-onboarding` | `/welcome` leaving a fresh project's artifacts empty, mis-routing it as an adopt, or recommending bare (non-namespaced) commands |
| `routing-altitude` | over-process: mission ceremony for a typo-class fix |
| `guardrail-push-block` | the push-on-default-branch hook not firing, or the agent fighting it |
|  `bootstrap-profile` | `/bootstrap` leaving §10 placeholders instead of detected gates |
| `reviewer-checkpoint` | the reviewer trusting handoff claims / missing planted flaws / no scorecard |
| `mission-plan` | `/mission plan` producing briefs that still require exploration |
| `business-model` | the business agent inventing numbers, deciding instead of proposing, or dishonest economics |
| `mission-batch-gate` | the batch gate policy merging into main instead of the integration branch, or skipping the independent checkpoint |
| `adopt-existing-project` | `/adopt` committing, rewriting existing plans, inferring merge delegation, or skipping the gap report |
| `commons-cold` | (baseline control) the frontend agent building a landing+auth pair from scratch with no shared commons |
| `commons-warm` | the frontend agent ignoring an available commons exemplar, or blind-copying it instead of adapting it to the current product |

**Paired experiment — `commons-cold` vs `commons-warm`.** These two share a fixture
(the "Cove" journaling app) and task (build `LandingHero.vue` + `SignInForm.vue`);
warm additionally seeds a battle-tested exemplar under `commons/` and asks the
agent to copy-and-adapt it. Run both and compare the **delta** on the four shared
criteria (`not-ai-slop`, `honors-tokens`, `task-correct`, `production-quality`) —
warm should meet or beat cold there *without* regressing `task-correct`, and pass
its own `adapted-not-copied` / `consulted-commons` criteria. This validates the
Portfolio Commons premise (grounding changes output) before any `/ingest` or
curator machinery is built; see `docs/product/features/portfolio-commons/idea.md`.

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
(`/agentic-workflow:bootstrap`, not `/bootstrap`) — the short form is
"Unknown command" in headless `claude -p` runs.

Keep rubrics about **behaviors, not wording** — scenario runs are
nondeterministic, so criteria like "created a feature branch" survive rewording
while "said the word altitude" does not. When a scenario flakes, re-run just
that scenario before treating it as a regression.
