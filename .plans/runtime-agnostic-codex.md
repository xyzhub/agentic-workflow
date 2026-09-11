---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: runtime-agnostic-codex — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide._

Converted from `docs/product/engineering/runtime-agnostic-codex.md`, 2026-09-11
(owner-approved design memo; its §14 decisions are locked below verbatim in
substance, its §15 deferrals are parked as ledger `## Closing` rows, its §3 facts
are treated as verified inputs and were re-probed where free).

Goal: any plugin role can run on OpenAI Codex CLI (GPT-6 Astra) via a `runtime:`
selector with a shared JSON distillate, `AGENTS.md` as the primary conventions
file, execpolicy rules for guardrail parity, and proven setup/health probes —
while a Claude-only project behaves exactly as it does today.

Estimate: 10 sessions — `phases` mode, two phases. P1 (mechanics) = 3 briefs +
1 checkpoint + 1 expected corrective = 5. P2 (commands, protocol, record) =
3 briefs + 1 checkpoint + 1 expected corrective = 5. The ledger mirrors this as
`Estimate: 10 sessions`; a rise is a dated locked decision, never a silent edit.

Target version: 1.51.0 (`plugins/agentic-workflow/.claude-plugin/plugin.json`,
the §10 **Version pin**).

## Tasks

1. **Distillate schema** — `plugins/agentic-workflow/templates/distillate.schema.json`,
   one shape for every runtime (memo §7). Acceptance: valid JSON Schema; every
   object level carries `"additionalProperties": false` and lists every property
   in `required` (optional fields modelled as nullable unions, never absent
   keys — OpenAI structured output is strict); a unit assertion in
   `tools/run-codex-test.mjs` proves the strictness invariant on the shipped
   file.
2. **Execpolicy rules + the load-path probe** — `templates/codex.rules` (memo
   §8) forbidding `git push` (all forms), `git commit`, `git tag` / `--tags`,
   `gh pr create`, `gh pr merge`, and the §14 paid-promotion/publish hosts, each
   with a hook-shaped justification and `match` / `not_match` examples.
   Acceptance: `codex execpolicy check --rules <file> git push origin main`
   returns a forbidden verdict and `… git status` does not; the harness asserts
   both when the binary is present and asserts the file's structure always; the
   project-vs-user load path is probed and its verdict recorded in the ledger.
3. **Codex adapter** — `plugins/agentic-workflow/tools/run-codex.mjs` (memo §6):
   prompt assembly in the six-block order, sandbox/network/search flags derived
   from the role's `tools:` frontmatter, always-flags, persisted sessions,
   post-run distillate merge (`thread_id`, `usage`, `changed_paths` from
   `git status --porcelain`, `high_impact_touched` from §10), exit codes 0 /
   3 / 1. Acceptance: every assertion group in memo §13 "Unit" passes against a
   fake `codex` shim; no test ever calls the real API.
4. **Adapter test harness + gate wiring** — `tools/run-codex-test.mjs` at the
   repo root plus a fail-closed tier-1.5 check in `tools/lint.mjs`. Acceptance:
   `node tools/lint.mjs` fails when the harness is missing or red, and is green
   with it passing.
5. **`AGENTS.md` primary** — `templates/agents-md.md`, `tools/conform.mjs`
   (`conventionsFile()` prefers `AGENTS.md`; new ladder entry
   `agents-md-primary`, `since: '1.51.0'`, three gap states), plus the
   bootstrap / sync / adopt wording, and this repo's own root `AGENTS.md` so it
   stays conformant against its own new ladder entry. Acceptance: `conform.mjs
   --json` reports `agents-md-primary` on each of three fixtures and no gap when
   conformant; `node tools/lint.mjs` green.
6. **Runtime selector in `/tune`** — `runtime` / `model` / `effort` override,
   banner, runtime column, alias validation, default effort by role (memo §5).
   Acceptance: the command file states the full precedence and the default-effort
   table; lint green.
7. **`/connect codex` + `/doctor` probe** — a new `connect` MODE (not a new
   command) with the five-step round-trip proof, and one `/doctor` probe group,
   advisory when the §10 **Runtimes** row is absent and a failure when the row
   names codex and any of binary / auth / rules / schema is missing (memo §10).
   Acceptance: the §10 row is written only after the round-trip; lint green.
8. **Orchestrator + planner routing** — `commands/mission.md` step 2 resolves
   the runtime and spawns either the Agent tool or the adapter in the
   background, step 3 marks the ledger row from the distillate, commits the
   changed paths itself, and retries once with `--resume <thread_id> --note`;
   `agents/planner.md` gains the optional brief header field `runtime:` (memo
   §11). Acceptance: both files state the rule that a codex run never touches
   `.plans/` or git history; lint green.
9. **Protocol text** — `templates/WORKFLOW.md` §3 (hook parity inside a foreign
   runtime is the rules file), §6 (roles are runtime-neutral), §9 (the new
   tools/templates/modes), §10 (the **Runtimes** profile row); this repo's
   `docs/WORKFLOW.md` §10 gains its own Runtimes row. Acceptance: lint's section
   and cross-reference checks green.
10. **Record + eval** — CHANGELOG 1.51.0, version bump, both READMEs, and one
    eval scenario (`evals/scenarios/codex-routing/`) where the orchestrator must
    route a brief marked `runtime: codex` to the adapter and never call the Agent
    tool. Acceptance: `node tools/lint.mjs` green; the scenario's `checks.mjs`
    asserts adapter-invoked and Agent-tool-absent.

## Locked decisions

- 2026-09-11 (owner, memo §14.1) — Codex never commits; the orchestrator commits
  from the distillate, which keeps the commit-format reminder and the
  close-keyword guard in force.
- 2026-09-11 (owner, memo §14.2) — shell env inherited in full for local runs
  (`-c shell_environment_policy.inherit=all`); the sandbox still bounds effects.
- 2026-09-11 (owner, memo §14.3) — setup is a `/connect codex` mode with a
  round-trip proof, never a `/doctor fix` side effect.
- 2026-09-11 (owner, memo §14.4) — `AGENTS.md` is the primary conventions file;
  `CLAUDE.md` imports it with `@AGENTS.md` as its first non-blank line.
- 2026-09-11 (owner, memo §14.5) — no automatic vendor fallback: a missing or
  unauthenticated binary is `blocked`, surfaced to the owner.
- 2026-09-11 (owner, mission scope) — opt-in: a project that never sets a
  `runtime:` behaves exactly as today, and the only change it sees is one import
  hop in its conventions file.
- 2026-09-11 (planner, repo convention) — the adapter's tests live at the repo
  root as `tools/run-codex-test.mjs` (the house naming: `hook-test.mjs`,
  `lint-test.mjs`, `marker-test.mjs`) and are reached by a fail-closed tier-1.5
  check in `tools/lint.mjs`, the same shape as `checkHookBehavior` /
  `checkCiWaitSelftest`. This supersedes the memo §13 filename
  `tools/run-codex.test.mjs`; nothing else about §13 changes.
- 2026-09-11 (planner, CI reality) — GitHub Actions runs only
  `node tools/lint.mjs` and has no `codex` binary, so rules assertions are
  structural always and binary-backed (`codex execpolicy check`) only when
  `codex` is on PATH, printing an explicit `SKIP (no codex binary)` line —
  never a silent skip. The binary-backed pass is part of the ckpt-p1 reviewer's
  local gate run. This also replaces memo §13's "run by the hook-test harness":
  `tools/hook-test.mjs` dispatches hooks from `hooks.json` and rules are not
  hooks.
- 2026-09-11 (planner, safety) — no test, gate or brief step runs a real
  `codex exec` against the API. `codex --help`, `codex exec --help`,
  `codex execpolicy …` and `codex debug …` are free and allowed; the fake shim
  covers the rest; the single real run is the owner-fired n=1.
- 2026-09-11 (planner, branches) — P1 branches `mission/runtime-agnostic-codex-p1`
  from the existing `feat/runtime-agnostic-codex` so the design memo travels with
  the implementation; P2 branches `mission/runtime-agnostic-codex-p2` from
  `staging` after P1 lands there.
- 2026-09-11 (planner, §10 Staging = none) — "staging verify" for this markdown
  plugin is `node tools/lint.mjs` green on the phase branch plus a
  `claude --plugin-dir` load in a consumer session; the eval suite is tier 2 and
  runs in P2 only (never in CI, ~$1–5 per scenario).
- 2026-09-11 (planner, surface) — codex is a `/connect` MODE and a `/tune`
  argument; no new command or agent file ships, so lint's reverse
  cross-reference duty (every command/agent named in both READMEs and
  WORKFLOW.md) gains no new obligations beyond the prose in task 9/10.

## Risks

- **Strict output schema.** `codex exec --output-schema` feeds OpenAI structured
  output, which rejects optional keys. Memo §7 marks `blocked_reason?`,
  `usage?`, `high_impact_touched?` optional → they ship as nullable unions
  listed in `required`, with a unit assertion pinning the invariant (task 1).
- **The `--json` event shape is unverified.** `thread_id` and `usage` are read
  from the JSONL stream; a shape change would silently null them. Mitigation:
  the adapter tolerates missing fields (distillate still valid, `thread_id`
  null), the shim pins the shape we expect, and the real shape is confirmed by
  the owner-fired n=1 — not by a test.
- **Execpolicy load path.** Confirmed free of charge: `codex exec --ignore-rules`
  documents itself as "Do not load user or project execpolicy `.rules` files",
  so project-level rules ARE loaded automatically; the concrete directory is the
  open question OQ1 and the first step of S1. If it cannot be proven without an
  API call, the user-level fallback ships and the parity gap is recorded.
- **No hooks inside a foreign runtime.** The rules file plus sandbox mode is the
  whole mechanical guard; the docs-reminder is replaced by
  `high_impact_touched`. A rule that fails to parse is a silent parity hole —
  hence the binary-backed verdict assertions at ckpt-p1.
- **32 KiB `AGENTS.md` cap.** The template is a pointer file; `/sync`'s one-time
  move carries runtime-neutral content only and reports line by line, never
  silently.
- **Ordering.** `templates/…` paths named in markdown must already exist or
  lint's template-reference check fails, so S1/S3 create the files before
  S4/S5/S6 name them.

## Open questions

- **OQ1 — where does the execpolicy rules file get installed, and what is the
  fallback?** The memo's stated fallback ("pass the rules file explicitly") is
  not available: `codex exec` has no `--rules` flag in 0.146.0 (only
  `--ignore-rules`), and no config key for rule paths is exposed.
  **Recommendation:** S1 probes `<project>/.codex/rules/*.rules` first (the
  binary ships project-level `.codex/config.toml` and `.codex/skills` strings,
  so the analogue is likely); if it loads, `/connect codex` writes the rules
  there and the §10 Runtimes row records the path. If it cannot be proven
  without a paid run, fall back to the confirmed user-level
  `~/.codex/rules/agentic-workflow.rules` installed by `/connect codex`,
  recorded in the §10 row as machine-local, verified by `/doctor` with
  `codex execpolicy check --rules`, and the portability gap parked as a
  `## Closing` row.
- **OQ2 — is the n=1 real Astra run inside this mission or after the merge?**
  **Recommendation:** after the merge, as the `## Closing` row already written
  (owner-fired, keeps `Estimate:` at 10 and keeps spend out of the mission's
  own budget). Answering "inside" makes it a seventh brief and `Estimate: 11`.
- **OQ3 — may the `reviewer` role run on codex in 1.51.0?** Memo §5 implies yes
  (it sets reviewer's default effort to `high`), but independent review is where
  the Fable-required security-boundary rule lives (§5 convergence rule 7), and
  that rule is a Claude tier.
  **Recommendation:** allow it mechanically, and have `/tune` print a warning
  plus `mission.md` step 3 state the constraint: a checkpoint whose diff touches
  a security boundary keeps its reviewer on Fable (Claude); codex reviewers are
  for non-boundary diffs. If the owner prefers, the stricter answer — reviewer
  stays Claude-only in 1.51.0 — is a one-line validation change in S4.

---
_The `.plans/runtime-agnostic-codex.sessions.md` briefs execute these tasks;
`.plans/runtime-agnostic-codex.state.md` tracks progress. Resolve every open
question before execution starts._
