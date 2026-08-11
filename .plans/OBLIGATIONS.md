---
status: living
owner-agent: planner
refresh-trigger: event
---

# Obligations register

_The repo-level parking place for deferred obligations that outlive a single
mission (WORKFLOW.md §5) — a promised action with an observable condition and
no trigger yet, probed at beats (`/agentic-workflow:settle`, the
`obligations-due` hook, `check.md`) instead of being lost the moment a
mission's own `## Closing` block closes. Deploys to `.plans/OBLIGATIONS.md`. A
`[~]` row in any mission ledger's `## Closing` block promotes here with a
verbatim copy and a `→ OB-<n>` back-reference — this file is where that
promise survives its mission._

_Grammar, one line each:_ `- [ ] OB-<n> · added YYYY-MM-DD (<source>) — do:
<action> — when: <observable condition> — probe: <command | manual>` _where
`<n>` is the next unused integer, `<source>` names who added the row (a
mission-ledger path or an agent name), and `<observable condition>` is a state
a probe can check — **never a clock** ("weekly" is not a condition; "a new
compaction record exists in the corpus" is). `probe:` is either a runnable
command (backticked) or the literal word `manual` when no command can decide
it. Rows are **never deleted**: a fired row keeps its line and appends
`· fired YYYY-MM-DD (<evidence>)`._

- [ ] OB-1 · added 2026-08-11 (.plans/compaction-continuity.state.md:75) — do: re-measure the handoff-budget n=1 compaction bands (the ≈6.73 bytes/token anchor and the trigger threshold are single-observation, config-dependent figures) — when: upstream compaction behavior changes OR the local transcript corpus gains ≥3 new true-compaction records — probe: manual
- [ ] OB-2 · added 2026-08-11 (.plans/compaction-continuity.md:142) — do: run the D4b cross-mission token re-measurement so quoted figures outgrow n=1 per corpus — when: ≥2 further missions' transcripts exist post-v1.43 — probe: manual
- [x] OB-3 · added 2026-08-11 (.plans/deferred-obligations.state.md S4) — do: reap the three concluded integration branches (mission/compaction-continuity-integration, mission/context-economy-integration, mission/sales-doc-architecture-integration), local and remote — their merge PRs are closed and CI was green on each merge commit, but the protected set in commands/settle.md shields all mission/*-integration branches unconditionally — when: the human rules the concluded-integration class reapable (or the protected-set clause is refined to shield only unconcluded missions) — probe: manual
  · condition MET 2026-08-11: human ruled **reapable once concluded** — the shield applies only while a mission is open (no `Closed:` stamp / unmerged PR); S6 amends `commands/settle.md`'s protected-set clause accordingly, and the three branches reap at the next settle run
  · fired 2026-08-11 (settle close, deferred-obligations S8): all three reaped local+remote — compaction-continuity-integration (was 9753715, PR #32 merge a75b844… lint:success) · context-economy-integration (was 24646b5, PR #31 merge 2c8487f… lint:success) · sales-doc-architecture-integration (was c5a810d, PR #30 merge 7e56f2e… lint:success). Probe lesson logged: the ladder's full-SHA warning is real — a fabricated tail 422s; derive SHAs from `gh pr view --json mergeCommit`, never by hand.
  · clause amended 2026-08-11 (S6, `commands/settle.md` protected set): a `mission/*-integration` branch is shielded only while its mission is open — an unmerged integration PR, or a `## Closing` block lacking the `Closed:` stamp; concluded integrations (pre-grammar ledgers judged by PR + deploy-green alone) fall through to the step-2 ladder. The reap itself stays parked for the next `/agentic-workflow:settle` run

- [x] OB-4 · added 2026-08-11 (deferred-obligations `## Closing` OB-a, promoted at the S8 settle close) — do: delete the deferred-obligations mission's four phase branches + integration branch, local and remote — when: the integration PR is merged by the human AND CI concluded green on the merge commit — probe: `gh pr view <n> --json state,mergeCommit` + `gh api repos/<owner>/<repo>/commits/<full-sha>/check-runs`
  · fired 2026-08-11 (post-#33 settle): PR #33 MERGED, merge `513e40a` lint:success; reaped local+remote — p1 (was b36003e) · p2 (was 56bc882) · p3 (was f669a86) · p4 (was 9d00c3f) · integration (was f090bda) · plan/deferred-obligations (was 368bbfe). Remote heads now: main + 3 protected pre-workflow keeps only.
- [ ] OB-5 · added 2026-08-11 (deferred-obligations `## Closing` OB-b, promoted at the S8 settle close) — do: live-verify the obligations-due hook fires in a real session — when: the shipped version is installed (plugin update + reload, post-merge) — probe: manual
- [x] OB-6 · added 2026-08-11 (deferred-obligations `## Closing` OB-c, promoted at the S8 settle close) — do: confirm the five legacy trios still pass lint on the installed release — when: the release lands on the default branch — probe: `node tools/lint.mjs` on a fresh checkout
  · fired 2026-08-11 (settle run, post-#35): fresh `--depth 1` clone of `main` @ `8d2e15d` (v1.43.0) — `lint: clean` · `hook-test: clean` · `context-attrib selftest: clean`. All five legacy trios pass on the released code.
- [ ] OB-7 · added 2026-08-11 (ckpt-p4 finding 1 — ckpt-p3's folds F1/F2 were dropped with no disposition, plus two low lint leaks it found) — do: add the >140-char-row harness case (hook-test) · add a carrying-commit command to settle.md recipe #2 · close the digitless `→ OB-` promotion-ref lint leak · extend the clock-leak pattern to `after N <units>` — when: the next session that edits tools/hook-test.mjs, tools/lint.mjs, or commands/settle.md is briefed (fold these in) — probe: manual
- [ ] OB-8 · added 2026-08-11 (backend, feat/impeccable-integration) — do: live-verify the impeccable peer-plugin integration (design-facing agents load + cite its actual rules, the doctor environment row fires, and the absence path stays citation-free; v2 surface, appended feat/impeccable-v2: the detect gate exercised fail-open (frontend + reviewer run the detector CLI, severities in the return, a CLI failure reported-and-continued), the DESIGN.md round-trip (designer authors the brand system in impeccable's spec-compliant DESIGN.md with PRODUCT.md cross-referencing the PRD), and the stage-map vocabulary appearing in briefings) — when: impeccable is installed alongside a UI-surface venture session — probe: manual
- [ ] OB-9 · added 2026-08-11 (release/v1.43.0 — three merged PRs deferred the version bump to a release session that had no trigger; OB-5/6/8's install conditions silently depended on it) — do: give the release a trigger — the `## Closing` template gains a row "version bumped + stamped, if the mission's CHANGELOG entry names a version", so settle's close gate refuses an unversioned ship — when: the next session editing templates/mission-state.md or commands/settle.md — probe: manual
