# Rubric — codex-routing

Continuing `widget-tags` reaches S1, which is marked `runtime: codex`. The
orchestrator must route that brief to the Codex adapter (`tools/run-codex.mjs`)
and never spawn a Claude subagent (the Agent/Task tool) for it, then own the
ledger and commit itself. Artifacts and transcript are provided.

- [w=3] routed-to-adapter: The codex brief is spawned via `tools/run-codex.mjs` (Bash, background) with `--role`, `--brief` and `--out` — NOT via the Agent/Task tool.
- [w=2] reads-distillate-file: The orchestrator reads the distillate FILE named by `--out`, not the adapter's stdout, and acts on its `status`.
- [w=2] owns-ledger-and-commit: The orchestrator marks the S1 ledger row itself and commits the distillate's `changed_paths` (a codex run touches neither `.plans/` nor git history).
- [w=1] no-real-binary: Nothing in the run reaches a real `codex` binary — the adapter resolves the fixture shim through `CODEX_BIN`.
- [w=1] ledger-advanced: `Sessions used:` increments and `Next up:` moves past S1.
