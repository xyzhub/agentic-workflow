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

Replan 2026-09-11 — the owner judged 10 sessions too many for this feature and
approved a collapse to one phase (`Estimate:` 10 → 4, dated locked decision
below); the same pass folded issue #79 (the permanent plan-judge) into the
briefs. The plan-judge then returned REVISE, and on its over-full finding the
owner ruled "Split now, Estimate 5", giving the current shape: **one phase, four
briefs, one checkpoint**. No brief had started, so nothing is history yet: every
brief was re-resolved, not carried over.

Converted from `docs/product/engineering/runtime-agnostic-codex.md`, 2026-09-11
(owner-approved design memo; its §14 decisions are locked below verbatim in
substance, its §15 deferrals are parked as ledger `## Closing` rows, its §3 facts
are treated as verified inputs and were re-probed where free).

Goal: any plugin role can run on OpenAI Codex CLI (GPT-6 Astra) via a `runtime:`
selector with a shared JSON distillate, `AGENTS.md` as the primary conventions
file, execpolicy rules for guardrail parity, and proven setup/health probes —
while a Claude-only project behaves exactly as it does today.

Estimate: 5 sessions — ONE phase: 4 briefs + 1 checkpoint. Correctives are
counted only when they fire, never pre-booked. The ledger mirrors this as
`Estimate: 5 sessions`; a rise is a dated locked decision, never a silent edit.

Issue: #79 (plan-judge) rides with this mission — the PR to `main` closes it.

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
2. **Execpolicy rules** — `templates/codex.rules` forbidding `git push`,
   `git commit`, `git tag`, `gh pr create` and `gh pr merge`, each with a
   hook-shaped justification and `match` / `not_match` examples.
   Rules are expressed with **nested-list alternatives** (`["git", ["push",
   "commit", "tag"]]`, `["gh", "pr", ["create", "merge"]]`) plus a blanket
   forbidden `["git", "-C"]`, because `prefix_rule` tokens are literal and have no
   globs; the §14 paid-promotion/publish host rules are dropped as inexpressible
   (named gap, see Risks). Acceptance: `codex execpolicy check --rules <file>` is
   forbidden for `git push origin main`, `git commit -m x`, `gh pr create` and
   `git -C /tmp push`, and not for `git status`; the harness asserts these when
   the binary is present (skip-with-notice when it is not, e.g. CI), asserts the
   file's structure always, and asserts no rule relies on a glob or host pattern.
   The deployed copy is
   `<repo>/.codex/rules/agentic-workflow.rules`, committed in the consumer repo
   and written from this template by `/connect codex` (task 7) — one source, no
   user-level copy.
3. **Codex adapter** — `plugins/agentic-workflow/tools/run-codex.mjs` (memo §6,
   as corrected): prompt assembly in the six-block order, sandbox/network/search
   flags derived from the role's `tools:` frontmatter with **globals before the
   `exec` subcommand**, a separate narrower **resume** argv shape, a `CODEX_BIN`
   override ahead of PATH, persisted sessions,
   post-run distillate merge (`thread_id`, `usage`, `changed_paths` from
   `git status --porcelain`, `high_impact_touched` from §10), exit codes 0 /
   3 / 1. Acceptance: every assertion group in memo §13 "Unit" passes against a
   fake `codex` shim reached via `CODEX_BIN`; no test ever calls the real API;
   unit assertions pin the argv ORDER, both argv shapes (exec and resume),
   `CODEX_BIN` winning over PATH, and `--ignore-rules` appearing on no invocation
   (that flag would disable the guardrail parity file).
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
   table, and `/tune reviewer codex` prints the routine-only constraint (locked
   OQ3 answer); lint green.
7. **`/connect codex` + `/doctor` probe** — a new `connect` MODE (not a new
   command) with a proven round trip, and one `/doctor` probe group, advisory
   when the §10 **Runtimes** row is absent and a failure when the row names codex
   and any of binary / auth / rules file / trust entry / schema is missing (memo
   §10). Acceptance: the mode adds the `[projects."<abs repo path>"] trust_level
   = "trusted"` entry to `~/.codex/config.toml` only after an explicit owner okay
   (AskUserQuestion — never a silent user-config edit), writes
   `.codex/rules/agentic-workflow.rules` from the template, re-reads
   `~/.codex/config.toml` to confirm the trust table landed, and proves the round
   trip with one cheap read-only `codex exec` whose prompt asks the model to run a
   command the sandbox would otherwise ALLOW (`git commit --dry-run` or
   `gh pr create --help`, never a push — a push fails on network denial with or
   without trust), reading the rejection from the `--json` EVENT STREAM rather
   than the model's prose; the §10 row is written only after that proof.
   `/doctor` fails closed when the row names codex and either the rules file or
   the trust entry is missing, probing trust by reading the config file — never by
   `execpolicy check`, which returns forbidden in an untrusted repo.
8. **Orchestrator + planner routing** — `commands/mission.md` step 2 resolves
   the runtime and spawns either the Agent tool or the adapter in the
   background, step 3 marks the ledger row from the distillate, commits the
   changed paths itself, and retries once with `--resume <thread_id> --note`;
   `agents/planner.md` gains the optional brief header field `runtime:` (memo
   §11). Acceptance: both files state the rule that a codex run never touches
   `.plans/` or git history, and step 3 states that the orchestrator overrides a
   codex `reviewer` tune with Fable when the diff's risk class demands it (locked
   OQ3 answer), with a miscalled tier flagged by the reviewer as a process
   finding; lint green.
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
11. **Plan-judge, permanent** (issue #79) — a fresh, read-only, one-shot
    reviewer spawn over the trio between the planner writing it and the first
    brief spending a session: automatic in `/agentic-workflow:mission` §1 plan
    mode and on `replan`, and in `/agentic-workflow:plan`'s decompose step; a
    plan-judge MODE in `agents/reviewer.md` carrying the issue's checklist (done
    criteria a named gate verifies · reads pre-resolved with line ranges · no
    probe a doc lookup settles · decisions consistent with the source memo/issue ·
    size within budget · security-boundary flag set where the Fable tier applies ·
    `Estimate:` = briefs + checkpoints only); a `templates/WORKFLOW.md` §5
    paragraph. Returns APPROVE or REVISE with per-brief findings, ≤ one page; the
    planner revises once, a second REVISE surfaces to the owner. Acceptance: the
    three "one expected corrective per phase" sites (`agents/planner.md:68`,
    `templates/WORKFLOW.md:381`, `templates/mission-plan.md:22`) are rewritten to
    the new estimate rule; lint green.

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
- 2026-09-11 (owner, was OQ1 — resolved from the Codex sources
  `codex-rs/core/src/exec_policy.rs` and `config/src/loader/mod.rs`) — execpolicy
  rules load automatically from every config layer's `rules/` folder, and the
  Project layer is `$(git rev-parse --show-toplevel)/.codex/rules/*.rules`. The
  guardrail file therefore ships as `<repo>/.codex/rules/agentic-workflow.rules`,
  committed in the consumer repo and written from `templates/codex.rules`; there
  is **no user-level fallback copy** (one source). Project-layer rules are loaded
  but DISABLED until the project is trusted: a user-layer
  `[projects."<abs repo path>"] trust_level = "trusted"` entry in
  `~/.codex/config.toml`. This repo is not trusted today, so `/connect codex`
  adds the entry with an explicit owner okay (AskUserQuestion) and never edits the
  user config silently; `/doctor` fails closed when the §10 Runtimes row names
  codex and either the rules file or the trust entry is missing. The adapter must
  never pass `--ignore-rules` (asserted in the harness).
- 2026-09-11 (owner, was OQ2) — the n=1 first real Astra run happens AFTER the
  1.51.0 merge, as the `## Closing` row in the ledger; `Estimate:` unchanged by that answer (now 5 after the A3 split).
- 2026-09-11 (owner, was OQ3) — the `reviewer` role MAY run on codex in 1.51.0
  for ROUTINE checkpoints only. Security-boundary reviews (auth, session
  credential, authorization, tenancy, money, schema, migrations, any security
  boundary — including the rules file and the sandbox flag derivation) stay on
  Fable per §5 convergence rule 7; the orchestrator overrides a codex reviewer
  tune in those cases, `/tune reviewer codex` prints the constraint, and a
  miscalled tier is a reviewer process finding.
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
- 2026-09-11 (planner, safety — amended by the OQ1 answer) — no test, gate or
  brief step runs a real `codex exec` against the API. `codex --help`,
  `codex exec --help`, `codex execpolicy …` and `codex debug …` are free and
  allowed; the fake shim covers every unit case. The only real `codex exec` in the
  shipped machinery is `/connect codex`'s round-trip proof — one cheap read-only
  run, fired interactively by the owner, never from a test or a gate — and the
  post-merge n=1.
- 2026-09-11 (owner, replan) — **`Estimate:` 10 → 4.** Owner: _"isn't 10 sessions
  too much for such a small feature?"_ The mission collapses to ONE phase, three
  briefs and one checkpoint; the two pre-booked correctives are removed, and a
  corrective counts only when it fires. This supersedes the two-phase shape and
  the earlier per-phase justification.
- 2026-09-11 (owner, A3 ruling) — **`Estimate:` 4 → 5.** Owner: _"Split now,
  Estimate 5"_, on the plan-judge's finding that S3 was over-full. S3 splits at
  its documented split point into S3 (routing + plan-judge) and S4 (record +
  eval); S4 runs after S3 because it documents what S3 writes. The checkpoint
  stays one Fable review, now after S4.
- 2026-09-11 (planner, plan-judge REVISE — the binary overrules the memo) — five
  memo claims are wrong and the memo is corrected in S3 as part of the record:
  (a) §3 row 31 / §6 flag table — `-a/--ask-for-approval` and `--search` are
  TOP-LEVEL options, so globals precede the `exec` subcommand (`codex exec -a
  never …` exits 2); (b) §6 — `codex exec resume <id>` takes no `-s`, `-C` or
  `-a`, so resume is a separate argv shape with the cwd set on the child process;
  (c) §8 — `prefix_rule` tokens are literal with no globs, so "every form" and the
  §14 host-pattern rules are inexpressible: rules use nested-list alternatives
  plus a blanket forbidden `["git","-C"]`, and the host-pattern guards are a named
  gap; (d) §5 — `model:` in `.claude/agents/<role>.md` must stay a Claude tier
  (that file is also a Claude Code project agent; a foreign model id would break
  the Claude spawn of the same role, including the Fable security override), so
  the Codex model rides in `runtime: codex:<model>`; (e) `execpolicy check` is a
  syntax/decision check on the file and never consults the trust layer.
- 2026-09-11 (planner, plan-judge REVISE) — the adapter resolves its binary from
  `CODEX_BIN` before PATH, documented in `--help`. `evals/run.mjs` spawns `claude`
  with the inherited env, so "a shim on PATH" was not a mechanism the eval had:
  the runner sets `CODEX_BIN=<fixture>/bin/codex` when the fixture provides one.
  Without this the `codex-routing` scenario would call the real binary and break
  the no-real-run decision.
- 2026-09-11 (owner) — _"yes make the plan-judge permanent"_: issue #79 lands with
  this mission (task 11), so the trio review that caught this mission's own
  padded estimate and settled-by-docs probe becomes a standing step, not a
  one-off manual pass.
- 2026-09-11 (planner, branches — replaces the two-branch plan) — one phase
  branch, `mission/runtime-agnostic-codex`, cut from the existing
  `feat/runtime-agnostic-codex` so the design memo and this trio travel with the
  implementation; one staging landing, one PR to `main`.
- 2026-09-11 (planner, §10 Staging = none) — "staging verify" for this markdown
  plugin is `node tools/lint.mjs` green on the phase branch plus a
  `claude --plugin-dir` load in a consumer session; the eval suite is tier 2 and
  runs at the checkpoint (never in CI, ~$1–5 per scenario).
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
- **Trust gate on project rules.** The load path is settled (locked decision
  above), but a project-layer rules file is loaded and DISABLED until the repo is
  trusted in the user layer. An untrusted repo therefore looks parity-protected
  while every forbidden command is actually permitted — the worst failure shape in
  this mission. Mitigations: `/connect codex` adds the trust entry as an explicit,
  owner-approved step and refuses to write the §10 Runtimes row without it;
  `/doctor` fails closed on a missing rules file or trust entry; the adapter never
  passes `--ignore-rules` and the harness asserts it.
- **No hooks inside a foreign runtime.** The rules file plus sandbox mode is the
  whole mechanical guard; the docs-reminder is replaced by
  `high_impact_touched`. A rule that fails to parse is a silent parity hole —
  hence the binary-backed verdict assertions at ckpt-p1.
- **Host-pattern guards are NOT replicated (accepted gap).** `prefix_rule` tokens
  are literal, so the §14 paid-promotion/publish host rules cannot be expressed
  at all. Read-only roles are covered by the network-off sandbox; a builder role
  running with `network_access=true` has no publish-host guard inside Codex. The
  gap is stated in the WORKFLOW §3 row, carried as a `## Closing` row for the
  obligations register, and bounded for now by the fact that publishing is a
  human-fired command, not something a brief asks a builder to do.
- **Shell-wrapper bypass (unsettled).** Whether `zsh -lc "git push"` defeats the
  prefix rules is not verified; the checkpoint reviewer settles it with the real
  binary, and a negative result is a blocking finding, not a footnote.
- **32 KiB `AGENTS.md` cap.** The template is a pointer file; `/sync`'s one-time
  move carries runtime-neutral content only and reports line by line, never
  silently.
- **Ordering.** `templates/…` paths named in markdown must already exist or
  lint's template-reference check fails, so S1 creates the schema and rules files
  and S2 creates `agents-md.md` before S2/S3 name them in command and protocol
  prose. The briefs are strictly sequential for this reason.
- **One heavy brief.** S1 (~540 read / ~830 written) still sits near the
  one-session ceiling and names its split point; S3's over-full load was resolved
  by the owner's split into S3 + S4 (~560/~320 and ~420/~250). A split that fires
  anyway is logged as a deviation rather than absorbed silently — that, not a
  pre-booked corrective, is how an underestimate surfaces.

## Open questions

(none — the owner answered all three on 2026-09-11; OQ1 (rules path + trust
entry), OQ2 (n=1 after the merge) and OQ3 (reviewer on codex for routine
checkpoints only) are now dated locked decisions above.)

---
_The `.plans/runtime-agnostic-codex.sessions.md` briefs execute these tasks;
`.plans/runtime-agnostic-codex.state.md` tracks progress. Every open question is
answered — execution may start at S1._
