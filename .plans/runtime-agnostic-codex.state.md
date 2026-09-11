---
status: living
owner-agent: planner
refresh-trigger: every-ship
---

# Mission: runtime-agnostic-codex — ledger

_The durable state that outlives any transcript (WORKFLOW.md §2, principle 1): a
fresh agent resumes the mission from this file alone. Write-ahead — update it
**at every merge and every gate result**, not only before ending a session (the
orchestrator has no session boundary to force a write; a compaction erases
everything since the last one — §12 LA-6)._

Issue: #79 (plan-judge — the PR to `main` closes it)

Estimate: 4 sessions
Sessions used: 0

_The two budget lines above are read by the mission-budget hook every turn. The
planner writes `Estimate:` (4 = 3 briefs + 1 checkpoint; a corrective counts only
when it fires, never pre-booked — owner replan 2026-09-11, 10 → 4). The
orchestrator increments `Sessions used:` the moment it starts a brief, a
corrective `S<n>-fix`, or a `continue`/loop tick — write-ahead, before spawning.
When `Sessions used` reaches 1.5× the estimate (6) the hook prints 🛑 OVERRUN on
every prompt and the orchestrator must stop and give the owner the scope decision
(subset / revised estimate / abort) — recorded below as a dated locked decision
that revises `Estimate:`. Never edit `Estimate:` to silence the hook without that
decision._

Gate policy: **human-merge** — after APPROVE the phase lands on `staging`, is
verified there (this repo's §10 **Staging** is `none`, so verify is
`node tools/lint.mjs` green on the phase branch plus a `claude --plugin-dir` load
in a consumer session), and the human merges the PR to `main`. Recorded at
mission start, 2026-09-11.

Standing agent authorized: _(none — every review/counsel is a one-shot spawn at a
decision point, §12 LA-5.)_

Branch: one phase branch, `mission/runtime-agnostic-codex`, cut from
`feat/runtime-agnostic-codex` (which carries the design memo and this trio); one
staging landing, one PR to `main`.

## Checklist

_Glyphs: `[ ]` not started · `[~]` in-flight / deferred / awaiting owner · `[x]`
done (verified, not merely written)._

- [ ] S1 — mechanics: `tools/run-codex.mjs`, distillate schema, `codex.rules`, `tools/run-codex-test.mjs` + lint wiring (branch `mission/runtime-agnostic-codex`)
- [ ] S2 — conventions + commands: `AGENTS.md` primary, conform ladder entry, bootstrap/sync/adopt, `/tune` runtime, `/connect codex`, `/doctor` probe
- [ ] S3 — routing + record: `mission.md` step 2/3, planner `runtime:` field, WORKFLOW §3/§6/§9/§10, CHANGELOG 1.51.0 + version + READMEs + `codex-routing` eval, and the permanent plan-judge (#79)
- [ ] Checkpoint ckpt-p1 — ONE fresh reviewer over the whole diff (**Fable required**: execpolicy rules + sandbox flag derivation are a security boundary), then staging → verify → one PR to `main` closing #79

## Open questions

_Mirrored from the master plan with their recommendations; the human answers
before execution starts._

(none — the owner answered all three on 2026-09-11. OQ1: rules ship at
`<repo>/.codex/rules/agentic-workflow.rules` (Codex Project config layer), inert
until a user-layer `trust_level = "trusted"` entry exists, which
`/agentic-workflow:connect codex` adds with an explicit owner okay; no user-level
fallback copy; the adapter never passes `--ignore-rules`. OQ2: n=1 happens after
the 1.51.0 merge as the `## Closing` row below; `Estimate:` stays 10. OQ3: the
`reviewer` role may run on codex for ROUTINE checkpoints only — security-boundary
reviews stay on Fable and the orchestrator overrides the tune. All three are dated
locked decisions in the master plan; execution may start at S1.)

## Standing steers

_File state preserves **decisions** but loses **taste** — how the human wants the
work done. Captured **verbatim** at checkpoints only, never mid-brief, never from
an agent's own inference. Quote exactly; a paraphrase is not a steer. Grammar, one
line each:_ `- YYYY-MM-DD (ckpt <id>) — "<exact words>"` _where `<id>` is the
checkpoint id from the `## Checklist` (`p1` or `ckpt-p1` — this mission has one).
Retire by ~~strikethrough~~, **never delete**. Every session re-reads this block
before it starts._

(none)

## Closing

_A promised action with an observable condition and no trigger yet — never lost,
never left to "zero open PRs" as a false completeness signal (WORKFLOW.md §5).
Rows are never deleted: a fired row keeps its line and appends `· fired
YYYY-MM-DD (<evidence>)`. A `[~]` row defers past this mission's close and MUST
carry `→ OB-<n>`, the ref for the verbatim copy landed in
`.plans/OBLIGATIONS.md`. The `Closed:` stamp is written only once every row is
`[x]` or `[~] … → OB-<n>`; `/agentic-workflow:settle` enforces that before the
mission may be reported done. The last three rows are the design memo's §15
deferrals._

- [ ] branch + worktree cleanup · added 2026-09-11 (planner) — do: delete this mission's phase branch (local and remote) and prune its stale worktrees — when: the PR to `main` is merged and the lint run on its merge commit concluded green — probe: `gh pr list --state merged` + `gh run list`
- [ ] docs/record synced · added 2026-09-11 (planner) — do: confirm CHANGELOG 1.51.0, both READMEs, the protocol §3/§5/§6/§9/§10 edits and this repo's §10 Runtimes row all describe the shipped behaviour, plan-judge included — when: S3 is `[x]` and the ckpt-p1 reviewer returned APPROVE — probe: manual
- [ ] version bumped + stamped · added 2026-09-11 (planner) — do: bump `plugins/agentic-workflow/.claude-plugin/plugin.json` to 1.51.0 (the §10 Version pin) and stamp this mission's CHANGELOG entry with it — when: this mission's CHANGELOG entry names a version — probe: manual
- [ ] memo fact table corrected · added 2026-09-11 (planner) — do: replace the memo's §3 "Project-level load path: probe during implementation" row with the settled fact (every config layer's `rules/` folder; Project layer is `$(git rev-parse --show-toplevel)/.codex/rules/*.rules`, inert until the repo is trusted) — when: S1 is `[x]` — probe: manual
- [ ] live-verify after reinstall · added 2026-09-11 (planner) — do: confirm in a real session that `/agentic-workflow:connect codex`, the `/agentic-workflow:doctor` runtime probe and the `agents-md-primary` ladder entry fire as written — when: the PR to `main` is merged and the plugin is reinstalled (`/plugin update` + `/reload-plugins`) — probe: manual
- [ ] n=1 real Astra run · added 2026-09-11 (planner, owner-locked) — do: the owner fires one real brief on `codex:gpt-6-astra` in this repo, a Claude reviewer verifies the result, and tokens for both vendors are recorded in this ledger — when: the 1.51.0 PR to `main` is merged, the plugin is reinstalled, and `/agentic-workflow:connect codex` has written the §10 Runtimes row — probe: manual
- [ ] codex on the remote executor · added 2026-09-11 (planner) — do: extend the adapter to run codex on the §10 remote executor (memo §15) — when: a §10 Remote executor row names a host and the codex binary answers `--version` there — probe: `ssh <alias> codex --version`
- [ ] second foreign runtime · added 2026-09-11 (planner) — do: add a Gemini CLI adapter to prove the runtime boundary generalises (memo §15) — when: this mission's n=1 result is recorded in this ledger — probe: manual
- [ ] one distillate shape everywhere · added 2026-09-11 (planner) — do: have Claude subagents return the JSON distillate too, so the orchestrator parses one shape for every runtime (memo §15) — when: `plugins/agentic-workflow/templates/distillate.schema.json` is present on `main` — probe: manual

## Deviations

_Any departure from a brief — logged here the moment it happens, with why.
Deviating is allowed; deviating silently is not (§4)._

(none)

## Handoff log (newest first)

_≤10 lines per entry: what this session did, the verify signal, the branch, and
what the next session needs. Newest on top; crash-safe by write-ahead._

- 2026-09-11 planner (replan): owner ruled 10 sessions too many — _"isn't 10
  sessions too much for such a small feature?"_ — and approved one phase, three
  briefs, one checkpoint. `Estimate:` 10 → 4 (correctives counted only when they
  fire); old S1+S2 → S1, old S3+S4 → S2, old S5+S6 + issue #79 → S3; one branch
  `mission/runtime-agnostic-codex`, one PR to `main` closing #79. Owner also
  ruled _"yes make the plan-judge permanent"_, so #79 ships in S3 and the
  "one expected corrective per phase" rule is rewritten at its three sites. No
  brief had started, so nothing was rewritten as history; `Sessions used:` stays
  0. S1 and S3 are the heavy briefs — both inside budget, each with a stated
  split point if they run long.
- 2026-09-11 planner (amendment): owner answered all three open questions.
  Execpolicy path settled from the Codex sources → S1 drops the load-path probe;
  the rules file ships at `<repo>/.codex/rules/agentic-workflow.rules` and is inert
  until a user-layer trust entry exists, so `/connect codex` (now S2) gains an
  owner-approved trust step and a real read-only round-trip, `/doctor` fails closed
  on a missing rules file or trust entry, and the adapter must never pass
  `--ignore-rules` (S2 asserts it). n=1 stays post-merge; codex reviewers cover
  routine checkpoints only. `Estimate:` unchanged at 10; no brief started.
- 2026-09-11 planner: trio authored from the owner-approved memo
  `docs/product/engineering/runtime-agnostic-codex.md` (its §14 decisions locked,
  §15 deferrals parked above). Codex CLI 0.146.0 flags re-probed free of charge;
  `--ignore-rules` proves project-level `.rules` files are loaded, so OQ1 is
  narrowed to the directory. Three open questions await the owner before S1.

Next up: S1
