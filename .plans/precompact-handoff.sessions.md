---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: precompact-handoff — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the
expensive exploration happened once, here (2026-10-20, tree at 92c886b,
plugin v1.67.0)._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/precompact-handoff.md` · Ledger: `.plans/precompact-handoff.state.md`
Source brief: `docs/product/decisions/2026-10-20-precompact-handoff-brief.md` (190 lines — the ACs, A1–A7, L1–L5; read whole, it IS the spec).

**Catalog**: none — this repo's §10 **Catalog** row is `none — markdown-only
plugin` (`docs/product/catalog/` does not exist). No catalog reads, no catalog
regeneration in Verify.

**Gates available in this repo** (§10):

| Gate | Command | When |
|---|---|---|
| Test / lint gate (CI `lint.yml`) | `node tools/lint.mjs` | end of S1 and at the checkpoint — clean on 92c886b apart from the standing `warn:` on WORKFLOW bytes; runs `bash -n` on every `hooks/lib/*.sh` (`tools/lint.mjs:298–309`) and the harnesses |
| Hook harness | `node tools/hook-test.mjs` | after every hook edit (235 `check(` calls today, all green) |
| Staging verify (§10 Staging = none) | lint green + `claude --plugin-dir plugins/agentic-workflow` loads | at the checkpoint, before the PR is marked ready |

**Facts already probed (do not re-probe):** `node` v24, `jq` present. No
`PreCompact` entry exists anywhere in `hooks.json` today; every PreToolUse
entry uses matcher `Bash` or `Read`. `hooks.json` timeouts: 5 everywhere
except merge-guard 10 and compact-resume 30. The lint has NO externals-line
rule — the only `# externals:` check is the merge-guard self-proof case at
`tools/hook-test.mjs:1746–1750`; copy it for each new script. The harness
`BIN_LIST` (`hook-test.mjs:47`) is `bash sh git grep sed head tr cut wc cat
mkdir dirname` (+ jq, + gh stub) — the new scripts need `stat tail mv date
mktemp chmod pwd sleep ls` added. `runHook`'s `transcript:` knob
(`hook-test.mjs:78–87`) writes plain bytes only and its comment forbids JSONL
fixtures — extend it with `content:` and rewrite the comment. Markers live
in the real `$TMPDIR` keyed by `session_id` (`handoff-budget.sh:88–92`); the
harness mints a unique `sid()` per case (`hook-test.mjs:956–957`). Real
transcript shape: see the master plan's Verified line. `templates/WORKFLOW.md`
= 113,406 B (ceiling 120,000); `commands/handoff.md` 3,278 B, `doctor.md`
10,332 B (ceiling 24,000). This repo's `docs/WORKFLOW.md` stamp is v1.62.0
and is NOT synced in this mission (OQ-3). Next obligation id: **OB-32**
(register ends at OB-31, `.plans/OBLIGATIONS.md:71`).

Branch: `feat/precompact-handoff` (already checked out from main 92c886b).
One brief, one checkpoint, one PR to `main`; the human merges. Not parallel.

## Large-files table

| File | Lines | Notes |
|---|---|---|
| `tools/hook-test.mjs` | 2,041 | ranged reads only |
| `CHANGELOG.md` | 1,690 | read 1–14 only |
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 1,421 | 113,406 B; ranged reads only |
| `tools/lint.mjs` | 1,394 | read 295–312 only (hook-lib `bash -n`) |
| `plugins/agentic-workflow/hooks/hooks.json` | 192 | descriptions are one-line strings up to ~1,900 chars; edit with care |
| `plugins/agentic-workflow/hooks/lib/compact-resume.sh` | 176 | |
| `plugins/agentic-workflow/hooks/lib/merge-guard.sh` | 176 | read 1–24 (header + externals line) and 135–140 (gh call) only |
| `plugins/agentic-workflow/commands/doctor.md` | 154 | read 116–134 only |
| `plugins/agentic-workflow/hooks/lib/handoff-budget.sh` | 104 | |
| `docs/product/session-handoff.md` | 78 | read 1–8 only (the repo handoff stays) |
| `.plans/OBLIGATIONS.md` | 71 | read 1–12 + 69–71 (row format) |
| `plugins/agentic-workflow/commands/handoff.md` | 59 | |
| `plugins/agentic-workflow/hooks/lib/active-ledger.sh` | 58 | source it; read 1–30 only |
| `plugins/agentic-workflow/templates/session-handoff.md` | 54 | |
| `plugins/agentic-workflow/hooks/lib/beat-enforcer-pretooluse.sh` | 51 | the PreToolUse lib exemplar |
| `plugins/agentic-workflow/README.md` | 337 | read 268–284 only |

## Phase 1 — pre-compact handoff enforcement (branch: `feat/precompact-handoff`)

### S1 — shared lib, PreCompact snapshot, PreToolUse gate, token bands, four-record resume, docs, tests, release

- **ACs**: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9
- **Suits**: `devops` (bash hooks + node harness; prose edits are small).
  Runtime: `claude` (default; the §10 Tune preset is `balanced`, no role on
  codex).
- **Reads** (in this order):
  1. `docs/product/decisions/2026-10-20-precompact-handoff-brief.md` whole
     (190) and `.plans/precompact-handoff.md` Tasks + Value sourcing + Locked
     decisions (≈150).
  2. `plugins/agentic-workflow/hooks/lib/handoff-budget.sh` whole (104):
     bands at 52–53, silencers 69–92 (silencer 4 = active ledger at 75–80,
     silencer 3 = mtime proxy at 83–85, marker at 88–92), nudge texts 94–101.
  3. `plugins/agentic-workflow/hooks/lib/compact-resume.sh` whole (176):
     `HANDOFF=` at 78, branch 1 at 90, branch 2 at 97 (stamp parse 109–143;
     GNU-first stat at 119–130 — reuse via the lib), CURRENT/stale/unprovable
     texts 145–164, branch 3 at 166, emit at 175.
  4. `plugins/agentic-workflow/hooks/lib/beat-enforcer-pretooluse.sh` whole
     (51) — the stdin/jq/child-silence/active-ledger idiom for a PreToolUse
     lib; `active-ledger.sh` 1–30 (contract of `active_ledger`).
  5. `plugins/agentic-workflow/hooks/lib/merge-guard.sh` 1–24 (header style,
     `# externals:` line, `block()` helper) and 135–140 (the `gh pr view`
     call — the new lib wraps gh the same way plus a watchdog).
  6. `plugins/agentic-workflow/hooks/hooks.json` 36–48 (handoff-budget
     entry: the shape to copy), 104–115 (beat-enforcer PreToolUse entry),
     143–152 (SessionStart compact entry; put the new `"PreCompact": [...]`
     key directly before `"SessionStart"`). Print a description string with
     `node -e 'console.log(require("./plugins/agentic-workflow/hooks/hooks.json").hooks.UserPromptSubmit[3].hooks[0].description)'`
     rather than reading the raw line.
  7. `tools/hook-test.mjs` 20–135 (`hookCommand`, `BIN_LIST`, `runHook`
     incl. the `transcript`/`files`/`bin`/`env` knobs, `check`), 140–149
     (`ledger`, `NOT_STARTED`, `PRE`, `STOP`), 582–600 (`COMPACT`, `ctx`, the
     byte-for-byte branch-1 pin), 615 (`HANDOFF_REL`), 710–760 (stamped
     fixtures, `isoNoMillis`, the mtime-vs-stamp cases — AC-6 must keep
     them green), 941–1000 (handoff-budget section: `ADVISORY`/`URGENT`
     literals, `sid()`, registration-shape case), 1746–1750 (externals
     self-proof), 2008–2041 (child-silencer table — add the two new hooks;
     final exit).
  8. `plugins/agentic-workflow/commands/handoff.md` whole (59);
     `templates/session-handoff.md` whole (54); `docs/product/session-handoff.md`
     1–8.
  9. `plugins/agentic-workflow/templates/WORKFLOW.md` 259–281 (hook table:
     Handoff-budget row 274, Compact-resume row 277 — add the two new rows
     after 277), 343–356 (§3 prose "All four are advisory" — now five hooks,
     two of which block), 892–902 (§6.2 handoff paragraph — local file,
     memory dir is never a handoff).
  10. `plugins/agentic-workflow/commands/doctor.md` 116–134 (§3 Records &
      plans — add the Handoff row after Agent-managed repos).
  11. `plugins/agentic-workflow/README.md` 268–284; `CHANGELOG.md` 1–14;
      `plugins/agentic-workflow/.claude-plugin/plugin.json` (11);
      `plugins/agentic-workflow/package.json` (12); `.plans/OBLIGATIONS.md`
      1–12 and 69–71; `tools/lint.mjs` 295–312.
- **Prior art**: `plugins/agentic-workflow/hooks/hooks.json` — refusing hooks
  are the `git/gh guardrails` row, `close-keyword guard`, `publish-guard.sh`
  and `merge-guard.sh` (exit 2 + stderr via `block()`; everything else exit
  0). `handoff-budget.sh` encodes the per-session `$TMPDIR` marker and
  sanitised `session_id`; `compact-resume.sh` encodes stamp parsing via `jq
  fromdateiso8601` and GNU-first `stat`. Extend those idioms; do not
  re-derive them.
- **Do**:
  1. **`hooks/lib/handoff-lib.sh` (new, ~200 lines, functions only — sourcing
     has no side effects, like `active-ledger.sh`)**: `hl_paths` (git-path
     resolve → canonical via `cd "$(dirname)" && pwd -P`; XDG fallback;
     empty when unresolvable), `hl_tokens TRANSCRIPT` (tail ≤ 256 KiB, last
     non-sidechain assistant `.message.usage` sum; empty on any failure),
     `hl_threshold` (`CLAUDE_CODE_AUTO_COMPACT_WINDOW` else
     `DEFAULT_WINDOW=1000000` — fails toward not blocking, Assumed, OB-32
     confirms — × `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` else `DEFAULT_PCT=95`;
     on the byte path the threshold is `URGENT_BYTES / 0.85`), `hl_band`
     (tokens → advisory ≥70% / urgent ≥85%; no tokens → `bytes` + the
     existing byte bands), markers in TWO files under `$TMPDIR`:
     `handoff-gate-<sid>.band` (`band size_at_parse unit blocks`, rewritten
     on every re-parse) and `handoff-gate-<sid>.handoff` (`handoff_epoch
     handoff_size unit`, written ONLY by a Write/Edit to the canonical path,
     never by a re-parse), `hl_fresh SID` (reads only the `.handoff` file
     AND requires the canonical file to exist with a `_Written:` line AND
     current − `handoff_size` ≤ 10% of threshold in the same unit),
     `hl_redact` (sed:
     `sk-[A-Za-z0-9_-]{8,}`, `ghp_…`, `github_pat_…`, `AKIA[A-Z0-9]{16}`,
     `Bearer [^ ]+`, PEM blocks → `[redacted]`), `hl_stamp_epoch FILE`
     (compact-resume's parse, lifted), `hl_snapshot SID TRIGGER TRANSCRIPT`
     (AC-1 content; gh via `( gh … > tmp ) & sleep-kill 3 s`,
     `GH_PROMPT_DISABLED=1`; `umask 077`, `mktemp` + `mv`). Header: contract,
     `# externals: cat git grep sed head tail tr cut wc mkdir dirname stat mv
     date mktemp chmod pwd sleep ls jq gh`, the Verified transcript shape.
  2. **`hooks/lib/pre-compact.sh` (new, ~60 lines)**: child-silent; parse
     `trigger`, `custom_instructions`, `session_id`, `transcript_path`;
     ALWAYS `hl_snapshot` first (failure → exit 0); if `trigger=manual` and
     not fresh and no override (`--force-compact` in custom_instructions or
     `AGENTIC_WORKFLOW_COMPACT_FORCE=1`) → ≤3 lines to stderr, exit 2; else
     exit 0. Never exit 2 on `auto`.
  3. **`hooks/lib/handoff-gate.sh` (new, ~90 lines, PreToolUse matcher
     `.*`)**: child-silent; on Write/Edit whose canonical `file_path` equals
     the handoff → write the `.handoff` marker (current size, unit) and
     reset `blocks=0` in `.band`, exit 0; compute band (cached: re-parse only
     when `wc -c` grew ≥ 64 KiB since `size_at_parse`; a re-parse touches
     `.band` only); below urgent or `hl_fresh` → exit 0 silent; urgent +
     stale → allowlist check (Read, Grep, Glob, AskUserQuestion,
     Skill/SlashCommand whose input contains `agentic-workflow:handoff`, Bash
     command exactly one of `date -u +%Y-%m-%dT%H:%M:%SZ` · `git rev-parse
     --git-path agentic-workflow/session-handoff.md` · `git branch
     --show-current`, Write/Edit to the canonical path) → exit 0; else
     blocks+1 in `.band`; blocks ≥ 6 → one-line nudge on stdout, exit 0
     (fail open — a safety net, never the compliance path); first block of
     the session also runs `hl_snapshot … gate` (which `mkdir -p`s the
     handoff dir); stderr ≤5 lines: why; `handoff=<canonical path>
     (directory exists)`; `branch=<git branch --show-current>`;
     `now=<ISO>`; `snapshot=<path> — subagents share this gate; run
     /agentic-workflow:handoff with these values`; exit 2.
  4. **`handoff-budget.sh`** (AC-4): source the lib; `BAND=$(hl_band)`;
     when the unit is tokens the nudge text names tokens and the threshold
     percentage (new text, ≤3 lines); when it is bytes the two existing
     texts (94–101) are emitted byte-identically; keep silencers 1, 2, 4
     verbatim; silencer 3 applies only on the byte path (on the token path,
     `hl_fresh` silences). Update the header comment and the hooks.json
     description (line 43) to the new signal; keep `ADVISORY_BYTES`/
     `URGENT_BYTES` literals in place (the harness pins them).
  5. **`compact-resume.sh`** (AC-6): after branch 1's ledger check, gather
     candidates — local handoff (`hl_paths`), repo handoff (`HANDOFF`), this
     session's snapshot — each with a stamp epoch (mtime fallback). Branch 1
     text unchanged except that an existing local handoff/snapshot adds
     lines 3–4 naming them (≤6 lines total; without them the text is
     byte-identical — pin at 593–600 holds). Branch 2 generalises to "the
     freshest record is `<path>` (<why: newest stamp | mtime>)"; when only
     the repo handoff exists the three existing texts are emitted
     byte-identically (pins at 716–726 and the SUSPECT cases hold). A
     snapshot as freshest is labelled "mechanical snapshot — re-read the agent
     handoff too: `<path>`". Branch 3 unchanged.
  6. **`hooks.json`**: new `"PreCompact": [{ "hooks": [{ "type": "command",
     "command": "bash \"${CLAUDE_PLUGIN_ROOT}/hooks/lib/pre-compact.sh\"",
     "description": "pre-compact snapshot + manual-compact gate (PreCompact, both triggers): …", "timeout": 15 }] }]`
     (no matcher = both triggers); new PreToolUse group `{ "matcher": ".*",
     "hooks": [{ … "handoff-gate.sh" …, "description": "handoff gate (PreToolUse, every tool): …", "timeout": 5 }] }`
     appended after the beat-enforcer group; rewrite the handoff-budget
     (43) and compact-resume (150) descriptions to the new contracts (same
     style: contract, silencers, `Body: hooks/lib/<file>`).
  7. **Docs** (AC-5): `commands/handoff.md` — "Default" writes the local
     canonical file (resolve with `git rev-parse --git-path
     agentic-workflow/session-handoff.md`, `mkdir -p` its dir; XDG fallback
     outside a repo) — with the rule "when the handoff gate's block message
     names the path, branch and time, use them verbatim; do not resolve or
     `mkdir` (the directory already exists)"; the only Bash the command may
     run is the three allowlisted lines; `docs/product/session-handoff.md`
     only when the human asks for a shared handoff; a new 3-line "Not the
     memory directory" paragraph; `resume` reads local first, then repo;
     stamp `session unknown` unless the gate/snapshot named the id (OQ-1,
     locked). `templates/session-handoff.md` lines 15–16 "Deploys to …" → the
     local path, repo file optional. `templates/WORKFLOW.md`: two hook-table
     rows after 277 (`Before a compaction | **Pre-compact snapshot** …` and
     `Tool call | **Handoff gate** …`, ≤ 900 B each), §3 prose 353–356 and
     §6.2 894–902 updated (local file canonical; memory dir never a handoff;
     two hooks block). `README.md` 272–280 sentence. `commands/doctor.md`
     §3 Handoff row (AC-7 doctor). Net WORKFLOW growth ≤ 2,500 B.
  8. **Harness** (AC-7): extend `runHook` `transcript:` with `content:`;
     extend `BIN_LIST`; a `mkTranscript({tokens, sidechain?, users?,
     assistantText?})` helper building JSONL in the Verified shape; mint
     `sid()` per case as the budget section does (markers live in the real
     `$TMPDIR`). Cases
     (≈25): PreCompact registration shape (key present, timeout ≤ 15);
     auto+stale → exit 0 + snapshot file exists with stamp/branch/`Next
     up:`/5 prompts/redacted token; manual+stale → exit 2, ≤3 stderr lines
     naming `/agentic-workflow:handoff` and `--force-compact`, snapshot
     still written; manual + `--force-compact` → 0; manual + env → 0; gh
     stub hanging > 3 s → snapshot says `unavailable` and returns < 15 s;
     the two counsel fixtures (urgent → Write to the canonical path → next
     Bash call exit 0; Write → manual `/compact` exit 0); the handoff
     command's FULL tool sequence at urgent — Bash(`git rev-parse --git-path
     …`), Bash(`git branch --show-current`), Bash(`date -u …`),
     Read(template), Write(canonical path), then Bash(`ls`) — produces zero
     exit-2 results with `blocks` never incremented (compliance never
     touches fail-open); urgent reached, then the transcript grows ≥ 64 KiB
     so the band re-parses, with NO Write to the canonical path → still
     blocked (band cache can't mint freshness); handoff file deleted after
     the marker was written → stale; allowlist: each of
     Read/Grep/Glob/AskUserQuestion/Skill(handoff)/the three Bash lines → 0,
     Bash(`ls`) → 2, Bash(`date -u +%s`) → 2, Write to
     `docs/x/session-handoff.md` → 2, Write to the canonical path via a
     relative/symlinked spelling → 0; block stderr names path, `branch=`,
     `now=`, "directory exists", "subagents share"; six consecutive blocks →
     the 6th exits 0 with a nudge; unresolvable path (non-git cwd) → never
     blocks; token bands at 70%/85% boundaries incl. env overrides and the
     two defaults (`DEFAULT_WINDOW=1000000`); byte-path freshness uses
     `URGENT_BYTES / 0.85`; no usage line → byte path texts byte-identical to the
     current fixtures; compact-resume: local-only → named as freshest,
     snapshot-only → "mechanical", both + repo → newest stamp wins; the
     three existing pins untouched; child silence for pre-compact and
     handoff-gate; externals ⊆ BIN_LIST + jq + gh for the three new scripts.
  9. **Release** (AC-9): `plugin.json` + `package.json` `1.68.0`; CHANGELOG
     `## [1.68.0] — 2026-10-20` under `[Unreleased]` (Added: PreCompact
     snapshot + manual gate, handoff gate, token bands, local canonical
     handoff, four-record resume; Changed: handoff-budget signal).
  10. **AC-8 → OB-32**: append to `.plans/OBLIGATIONS.md` in the OB-29 shape:
      `- [ ] OB-32 · added 2026-10-20 (promoted from .plans/precompact-handoff.state.md ## Closing row "live-verify at 400k", planner, 2026-10-20) — do: on orderly-agents, after /plugin update + /reload-plugins, run one real session with CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000 until it auto-compacts; confirm the snapshot exists under the git dir, compact-resume names it, the doctor row is green, and record the observed auto-compact point vs DEFAULT_WINDOW/DEFAULT_PCT — when: v1.68.0 is installed from main — probe: manual`.
      (The orchestrator owns `.plans/`; the builder reports the row text and
      the orchestrator appends it — do not edit `.plans/` from the brief.)
  Commit with the §10 Attribution line. Do not touch `.plans/` or
  `docs/WORKFLOW.md`.
- **Verify**:
  - `node tools/hook-test.mjs` exits 0 — report the new case count (≥ 260)
    and that the compact-resume pins at 593–600 / 716–726 passed unedited.
  - `node tools/lint.mjs` → `lint: clean` (WORKFLOW `warn:` allowed; report
    `templates/WORKFLOW.md` bytes ≤ 120,000).
  - `bash -n` on the three new scripts; `grep -c '^# externals:'` = 1 each.
  - Manual smoke in this repo: `printf '{"trigger":"auto","session_id":"smoke","transcript_path":"<a real jsonl>"}' | bash plugins/agentic-workflow/hooks/lib/pre-compact.sh; echo $?` → 0 and
    `.git/agentic-workflow/snapshots/smoke.md` exists, mode 0600, stamp
    present, no `Bearer`/`sk-` literal; `git status --porcelain | grep
    agentic-workflow` → empty (never tracked). Delete the smoke snapshot.
  - `claude --plugin-dir plugins/agentic-workflow` loads (or report skipped
    with the reason — never green when not run).
  - Catalog: none, nothing to regenerate.
- **Read budget**: ~1,250 lines (brief 190 · plan 150 · handoff-budget 104 ·
  compact-resume 176 · beat-enforcer 51 · active-ledger 30 · merge-guard 30 ·
  hooks.json 35 · hook-test 300 · handoff/template/repo-handoff 120 ·
  WORKFLOW 50 · doctor 20 · README/CHANGELOG/jsons/OBLIGATIONS/lint 60) —
  inside the 1,500-line budget. If AC-6 or the doc edits cannot land inside
  the session, stop at a green harness, report what remains, and let the
  orchestrator book a corrective — never leave the harness red.

**Checkpoint ckpt-s1** — one-shot `reviewer` on **Fable** (boundary-class:
`hooks/` + `tools/` are `security-boundary`, `templates/gate-classes.md:32`),
fresh context, re-runs `node tools/lint.mjs` + `node tools/hook-test.mjs`,
diff-reviews `main..HEAD` against AC-1..AC-9 with the red-team list from the
brief (deadlock, secret leak, gh latency, usage drift) and a plain-report
read of the owner-facing strings (block messages, doctor row, nudge texts).
APPROVE → staging verify (lint + `--plugin-dir` load) → PR to `main` marked
ready; the human merges.

---
_Each session's outcome and any deviation lands in
`.plans/precompact-handoff.state.md`, never only in chat._
