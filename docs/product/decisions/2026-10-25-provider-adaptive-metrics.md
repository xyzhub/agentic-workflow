# Provider-adaptive model assignment: metrics

_2026-10-25, analyst. Brief: `2026-10-25-provider-adaptive-brief.md`. Classes: **measured** (command + date 2026-10-25), **derived** (arithmetic shown), **unmeasured**._

## Baseline today (tree at plan/provider-adaptive)

| Quantity | Value | Class / source |
|---|---|---|
| Claude model-id strings in `templates/tune-presets.json` | 135 `claude-(fable-5-1\|opus-5-5\|sonnet-5-5\|haiku-5-5)` hits: 18 fable, 42 opus, 65 sonnet, 10 haiku (a further 28 `claude-p` hits are the runtime name, not ids) | measured: `grep -oE 'claude-[a-z0-9.-]+' templates/tune-presets.json \| sort \| uniq -c` |
| Claude ids pinned in commands/agents/skills/hooks/tools | 0 | measured: `grep -rE 'claude-(fable\|opus\|sonnet\|haiku)-5' commands agents skills hooks tools templates -l` returns only tune-presets.json |
| Rules naming a model, not a capability | 14 "Fable" lines in commands/agents/gate-classes/skills, 4 in `docs/WORKFLOW.md`; `mission.md` rule 7 and ~l.79-83, 196-201 | measured: `grep -rniE fable` |
| Agents with a base `model:` pin | 3 (all `sonnet`) | measured: `grep -rE '^model:' agents` |
| `/tune` calls a GLM-only user needs for a clean mission | unmeasured; derived bound: 20 preset agents, each preset write emits a Claude id into a shadow, so `/tune preset` cannot help (it adds ids). Per-agent route = up to 20 calls (1 per agent) | derived from the preset table, not run |
| Whether the alias `fable` maps on z.ai | unknown (brief says unverified) | unmeasured |

## Done-criteria: measurement and pass number

| Criterion | Measured by | Pass |
|---|---|---|
| J1 GLM-only, zero `/tune` | live GLM mission (below); count `/tune` invocations in the session transcript and ledger | 0 `/tune` calls; 0 Claude ids requested; session-start output <= 3 lines; mission completes end to end |
| J2 Claude unchanged | new test dumps role -> model/effort for all 5 presets from the pre-change tree (capture BEFORE edits, commit as fixture) and diffs against the post-change resolver | 0 byte diff across 5 presets x 20 roles (100 cells); session-start extra lines = 0 |
| J3 provider switch | fixture test per provider (anthropic, z.ai, codex, mixed): start state A, change base URL/key/codex login, run session-start; assert profile rewritten and exactly 1 report line | 4/4 providers green; no-change restart rewrites 0 times |
| J4 mixed | fixture: several providers answer; assert each tier = best per capability table, reviewer model != build model when possible | tests green |
| Degradation visible | tests: same-model review prints "same-model review" and top-tier classes get a second pass; unsupported knob prints one "skipped" line | assertions green; silent-failure count 0 |
| Overrides win | test: existing shadow survives; `/tune` reports profile choice | green |
| Secrets | grep profile, ledgers, traces for the key value after the live run and fixtures | 0 hits; only var names + provider id |
| Hygiene | `node tools/lint.mjs`; new tests red on old tree (run against pre-change commit), green on fix | lint clean; red-then-green shown |

## Record from the live GLM run

Tool-call success rate (calls ok / total, by tool, from the transcript); reviewer verdicts (APPROVE/REJECT per checkpoint, and whether labelled "same-model review"); correctives per brief (compare to the Lean 0.6/brief figure only as context, n is tiny); sessions used vs the plan estimate; count of any Claude model id requested (**must be 0**, grep the transcript and `.claude/agents/`); `/tune` calls (must be 0); profile text printed at start; skipped-knob lines; wall time and token use if the z.ai console exposes them (otherwise unmeasured). Baseline for all of these on GLM is unmeasured: no GLM run exists yet.

## Deferred obligations (need the owner's z.ai key)

- OB-new-1: live GLM-only 1-session mission (J1 end to end, all fields above). Owner supplies key; no agent can run it.
- OB-new-2: verify whether `fable` (and opus/sonnet/haiku) aliases map on z.ai via `ANTHROPIC_DEFAULT_*_MODEL`; one probe call per alias.
- OB-new-3: real-provider switch (Anthropic <-> z.ai) once with the live key, to confirm the J3 fixtures match reality.
- Likewise for codex login if the plan lapse persists (`codex-runtime-unavailable`): the codex leg of J3 stays fixture-only until re-subscribed.
Fixture-only criteria (J2, J3 fixtures, J4, secrets, lint) need no key and must pass before the PR. Assign real OB numbers from the register (highest seen in docs: OB-31).
