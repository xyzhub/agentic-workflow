# Counsel brief — tune-presets (2026-10-11)

Two advisors (technical, financial), both Fable. Both **proceed-with-changes**. The decisive uncertainty (can a Haiku child be spawned from a session) was then tested live — see Spike.

## Spike (orchestrator, 2026-10-11, claude 2.1.296, ~$0.004)
`CLAUDE_CODE_AUTO_COMPACT_WINDOW=100000 claude -p --agent agentic-workflow:chronicler --model claude-haiku-5-5 --max-turns 2 --strict-mcp-config --output-format json` from the Bash tool, `CLAUDECODE=1` inherited: `subtype: success`, result `SPIKE-OK Haiku 5.5`, `num_turns: 1`, `modelUsage` = {`claude-haiku-5-5`} only, first-request prompt 9,887 tokens (cache_create), parent env var unset before and after. No nesting refusal. The window's effect is unobservable in a short run (financial #4) — a deliberate overflow probe is the only witness.

## Financial lens (numbers; $ = API-equivalent proxy for quota weight)
1. **Haiku adapter is half the ACs for ≤$0.14/mission.** Per-mission cost at the pr-economy shape: Balanced $7.11 · Rigorous $7.38 · Lean $2.88 · Unattended $6.53. Of Lean's $4.23 saving, 86 % is Fable→Opus on gate/planner cells, 10 % the Sonnet builder, 3 % Haiku. A 150K Haiku run ($0.09) still costs less than the Sonnet row ($0.15). Recommends demoting AC-6/8/9 to an obligation; owner's "A and B" lock noted.
2. **Lean's Sonnet builder breaks even at 0.29–0.58 extra correctives/brief; measured baseline with top-tier builders is 0.6/brief** (3 correctives / 5 briefs). **Unattended is the worst-shaped row** (Sonnet builder, Fable gates, nobody watching): → Opus 5.5 builders; Lean keeps Sonnet with an "unmeasured until 3 Lean briefs" note.
3. **tick_budget 400K is sized on single-subagent figures**; a brief+gate tick is 357K measured with zero correctives. Define tick = brief + gate + ≤1 corrective; default **750,000**; add cumulative `Mission budget:` (Σ tick tokens) — the only ceiling that would have stopped orderly LA-1.
4. **AC-9 can't witness the window in the pass case** (by construction the run stays <100K); needs a deliberate ~120K overflow probe (~$0.07). **Balanced must not write 20 "same as default" shadows** — write a shadow only where the cell differs from the agent's base; this repo = §10 row only.
5. Estimate: 3 briefs + 3 checkpoints = 6 planned, 8 likely at 0.6 correctives/brief; stop at 9. Two-phase cut (Estimate 4) only if the adapter is demoted.

## Technical lens (file:line)
1. D4 transport unproven, proof scheduled last → **resolved by the spike**; keep `env -u`-style strip of `CLAUDECODE`/`CLAUDE_CODE_ENTRYPOINT` as a defensive default and `exit 0 + no result line → failed`.
2. **Plugin hooks and the owner's MCP servers run inside the child**: router hook (hooks.json:20) and mission-budget STOP text inject into a chronicler brief; MCP tool schemas bloat the first request. → adapter passes `--strict-mcp-config`, sets `AGENTIC_WORKFLOW_CHILD=1`; the four UserPromptSubmit hooks + beat-enforcer exit 0 when set (hook-test fixture); AC-9 records `system/init` tool list + first-request tokens.
3. **Bare `Bash` in chronicler.md:4 lets the child commit/push on a feature branch** (push guard blocks only the default branch). → Haiku rows carry explicit `allowed_tools`; lint rejects bare `Bash` on a Haiku row; adapter refuses to spawn with one.
4. **D1 "preset-authored" by banner token collides with agents.mjs:103-115 (kind derived by comparison)**; apply over backend.md would overwrite the hand tune. → preset-authored := banner `preset:<name>` AND `effective == JSON row`; apply skips-and-reports any shadow lacking a `preset:` banner; both cases in acceptance test (a).
5. **D3 safety claim false** (the 779K run was one brief; hook is UserPromptSubmit-only; `Last tick tokens:` written after the tick stops nothing in flight). → orchestrator checks running tokens before each brief within a tick, writes `Tick tokens:` after every brief, resets at tick start; the only in-flight stop is the child's `--max-turns`.
6. **Lean's plan-judge on Opus has no escalation path** (rule 7 is diff-based; a plan has no diff). → plan-judge Fable in all four presets; Lean's Opus applies to the checkpoint reviewer only, with mission.md's escalation paragraph widened from "codex reviewer tune" to "any non-Fable reviewer tune".
7. No estimate, byte budgets unmeasured (tune.md/mission.md gain sections under the 90 % warn band). → `wc -c` baselines into metrics; 3 phases, Estimate 6: P1 JSON+lint+schema+tune verbs · P2 spike→adapter→Haiku shadows→AC-9 (second, so a failure reshapes P3) · P3 bootstrap/adopt/doctor + tick + hook + docs.
D2 minor: JOURNEY.md is 744 lines — a whole-file read breaks a 500-line budget; put `read_budget`/`maxTurns` per role in the JSON; AC-9 runs chronicler + intake.

## Architect's owner questions (from the memos)
Q1 `reset` keeps-and-reports a preset+hand-tuned shadow · Q2 maxTurns 24 / 500 lines as AC-7 starting values · Q3 400K default + two ledger header lines · Q4 pre-approve a `--system-prompt-file` fallback transport (moot after the spike).
