---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: precompact-handoff — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide. Planned 2026-10-20 on `feat/precompact-handoff` (from main 92c886b,
plugin v1.67.0). Converted from
`docs/product/decisions/2026-10-20-precompact-handoff-brief.md` (2026-10-20) —
its AC1–AC8, counsel amendments A1–A7 and locked decisions L1–L5 are settled
ground; the AC-N ids below map 1:1 onto the brief's AC1–AC8._

Goal: any session is safe to compact. Every compaction first gets a mechanical
snapshot; a manual `/compact` is refused until a real handoff exists; at the
urgent band a stale handoff blocks tool calls until it is refreshed; the
handoff lives in a local, never-tracked file; compact-resume names which of
four records is freshest. Target: `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000`
without losing integrity.

Estimate: 1 session — one brief (S1), one one-shot Fable checkpoint (hooks are
`security-boundary`, `templates/gate-classes.md:32`, reviewer tier `top`),
staging verify (this repo: lint + `--plugin-dir` load), one PR to `main`. No
`phases`. The work is three new shell files (~450 lines together), two edited
hooks, ~25 harness cases and doc rows; pre-resolved reads total ~1,250 lines,
inside the 1,500-line budget. It is the largest single brief this repo has run
(risk: see Risks) — a corrective is counted when it fires, never pre-booked.

## Tasks

1. **Shared lib + PreCompact snapshot** (`hooks/lib/handoff-lib.sh`,
   `hooks/lib/pre-compact.sh`, `hooks/hooks.json` PreCompact entry).
   - AC-1 Every PreCompact (`manual` or `auto`) writes
     `<handoff-dir>/snapshots/<session>.md` BEFORE returning: branch + HEAD
     (+ dirty count) for every worktree (`git worktree list --porcelain`),
     the active ledger path (`active_ledger`) + its first `Next up:` line +
     its open beat row (first `- [ ]`/`- [~]`), the last 5 user requests from
     the transcript (≤300 chars each, control chars stripped), the last
     assistant text (≤600 chars), open PRs by `@me` when `gh` answers within
     3 s (else `unavailable`), and a stamp
     `_Written: <ISO> · session <id> · trigger <t>_`. Redacted (A5), 0600,
     tmp + `mv`. Snapshot failure never blocks an auto compaction (exit 0).
   - AC-2 Manual `/compact` with a stale handoff exits 2 with ≤3 stderr lines
     naming `/agentic-workflow:handoff` and the override (`/compact
     --force-compact` or `AGENTIC_WORKFLOW_COMPACT_FORCE=1`); auto is never
     blocked; the snapshot is written in both cases and before the decision.
     Fresh (A1, revised at plan-judge) = the marker's `handoff_epoch` /
     `handoff_size` fields are set (only a Write/Edit to the canonical path
     sets them; the band cache never does) AND the canonical file exists
     with a `_Written:` line AND current size − `handoff_size` ≤ 10% of the
     threshold in the same unit (tokens; on the byte path the threshold is
     `URGENT_BYTES / 0.85`).
     Fresh (A1) = this session's marker exists AND its recorded size is within
     10% of the threshold of the current size (never the mtime proxy).
   - AC-4 Size signal = tokens from the transcript tail (≤256 KiB; last
     non-sidechain `assistant` line's `.message.usage`: `input_tokens +
     cache_read_input_tokens + cache_creation_input_tokens`) against
     threshold = `CLAUDE_CODE_AUTO_COMPACT_WINDOW` (else `DEFAULT_WINDOW`) ×
     `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` (else `DEFAULT_PCT`) / 100; advisory
     70%, urgent 85%. Tokens unreadable → the existing byte bands, texts
     byte-identical. Band cached in the marker; re-parsed only when the
     transcript grew ≥ 64 KiB since the cached parse.

2. **Hard requirement at the urgent band** (`hooks/lib/handoff-gate.sh`,
   PreToolUse matcher `.*`).
   - AC-3 At urgent + stale: exit 2 for every tool except Read, Grep, Glob,
     AskUserQuestion, Skill/SlashCommand whose input names
     `agentic-workflow:handoff`, Write/Edit whose canonical target (`pwd -P`
     of dirname + basename) equals the canonical handoff path, and a Bash
     command that is exactly one of `date -u +%Y-%m-%dT%H:%M:%SZ`,
     `git rev-parse --git-path agentic-workflow/session-handoff.md`,
     `git branch --show-current`. On the first block of a session it writes
     the snapshot (which creates the handoff dir) and names it; the block
     message (≤5 lines) carries the canonical handoff path, `branch=<b>`,
     `now=<ISO>`, states that the directory already exists, and notes that
     subagents share this gate — so the handoff command's full tool
     sequence runs with zero blocks and compliance never depends on
     fail-open. Fail open to a nudge after 5 consecutive blocks (counter in
     the marker; a fresh handoff resets it). Fresh → nothing blocked,
     silent. Advisory band → nudge once (via handoff-budget, unchanged).
     Silent when `AGENTIC_WORKFLOW_CHILD=1`; never engages when the handoff
     path can't be resolved (A3). The marker has two field groups: the band
     cache (`band size_at_parse unit blocks`, rewritten on every re-parse)
     and the handoff evidence (`handoff_epoch handoff_size`, empty until a
     Write/Edit to the canonical path, written only then) — a band re-parse
     can never make a stale handoff look fresh.

3. **Canonical local file + docs** (`commands/handoff.md`,
   `templates/session-handoff.md`, `templates/WORKFLOW.md`,
   `commands/doctor.md`, README).
   - AC-5 `/agentic-workflow:handoff` writes
     `$(git rev-parse --git-path agentic-workflow/session-handoff.md)` (A3:
     canonicalise; outside a repo → `${XDG_STATE_HOME:-~/.local/state}/agentic-workflow/<basename-of-cwd>/session-handoff.md`);
     `docs/product/session-handoff.md` is optional for shared handoffs and is
     still read when present; both the command and WORKFLOW §3/§6.2 say the
     memory dir is never a handoff. Template stamp gains `· trigger`-free
     shape unchanged; `{{SESSION_ID}}` may be `unknown` (OQ-1).
   - AC-7 (doctor) `commands/doctor.md` §3 gains a **Handoff** row: PreCompact
     registered in the installed `hooks.json`, resolved local handoff path
     printed and `git ls-files --error-unmatch` fails for it (never tracked),
     freshness of the local file vs the last snapshot, and the disclosure
     that snapshots hold prompt excerpts (never tracked, 0600).

4. **Read side** (`hooks/lib/compact-resume.sh`).
   - AC-6 Considers four records — active ledger, local handoff, repo
     handoff, this session's snapshot — names the freshest and why
     (ledger always first when active; among the rest, the newest stamp wins,
     mtime fallback) and labels a snapshot "mechanical — re-read the agent
     handoff too". The three existing branch texts stay byte-identical when
     their inputs are unchanged (no local handoff, no snapshot): the
     hook-test pins at `tools/hook-test.mjs:593–600`, `716–726` and the
     SUSPECT/OQ6 cases must pass without edits.

5. **Tests, lint, release**.
   - AC-7 (tests) `tools/hook-test.mjs` cases for AC-1…AC-6 incl. counsel's
     two deadlock fixtures (cross urgent → Write handoff → next tool call NOT
     blocked; Write handoff → manual `/compact` exits 0 without the override),
     `--force-compact` and env override, auto never blocked, snapshot content
     + redaction + 0600, allowlist (each allowed tool passes; a non-allowed
     tool exits 2; Write to a same-basename path elsewhere exits 2), fail-open
     after 5, byte fallback texts byte-identical, child silence for the two
     new hooks, `# externals:` ⊆ BIN_LIST + jq + gh for all three new scripts,
     PreCompact registration shape (matcher absent/`.*`, timeout ≤ 15). `node
     tools/lint.mjs` clean (bash -n runs on every `hooks/lib/*.sh`).
   - AC-9 Release: `plugin.json` + `package.json` → `1.68.0`; CHANGELOG
     `[1.68.0] — 2026-10-20`; `docs/WORKFLOW.md` NOT re-synced here (stamp
     stays v1.62.0 — `/sync` is a separate beat, OQ-3).
   - AC-8 Live check → `.plans/OBLIGATIONS.md` row OB-32 (post-merge Closing
     row promotes it): a real session on orderly-agents with
     `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000` compacts and resumes from the
     snapshot; also confirms `DEFAULT_WINDOW`/`DEFAULT_PCT`.

## Value sourcing

| Value | AC | Kind | Where |
|---|---|---|---|
| handoff path | AC-3, AC-5 | derivation | `git rev-parse --git-path agentic-workflow/session-handoff.md`, canonicalised; XDG fallback |
| snapshot path | AC-1 | derivation | `<handoff-dir>/snapshots/<sanitised session_id>.md` |
| tokens | AC-4 | derivation | transcript tail, last `assistant` `.message.usage` sum |
| threshold (env set) | AC-4 | env | `CLAUDE_CODE_AUTO_COMPACT_WINDOW` × `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` / 100 |
| threshold defaults `DEFAULT_WINDOW=1000000`, `DEFAULT_PCT=95` | AC-4 | assumption | `handoff-lib.sh` named constants; Assumed line below; confirmed at OB-32 |
| byte threshold (fallback) | AC-2, AC-3 | derivation | `URGENT_BYTES / 0.85` — the 10% freshness window on the byte path |
| bands 70% / 85% | AC-4 | locked decision | L3 |
| byte bands 3,700,000 / 5,380,000 | AC-4 fallback | existing constant | `handoff-budget.sh:52–53`, pinned at `hook-test.mjs:945–946` |
| fresh-within 10% | AC-2, AC-3 | locked decision | L1/A1 |
| fail-open count 5 | AC-3 | locked decision | L1/A2 |
| gh watchdog 3 s | AC-1 | locked decision | brief "Risks" + A7 |
| PreCompact timeout 15 | AC-1 | locked decision | A7 |
| override strings | AC-2 | locked decision | L4 |
| stamp | AC-1 | derivation | `date -u +%Y-%m-%dT%H:%M:%SZ`, `session_id`, `trigger` from stdin |
| open PRs | AC-1 | external (gh) | `gh pr list --author @me --state open --json number,title,headRefName` or `unavailable` |
| version 1.68.0 | AC-9 | locked decision | mission brief (orchestrator) |

## Locked decisions

- 2026-10-20 (owner) — **L1**: counsel A1–A7 approved in full, incl. fail-open
  after 5 consecutive blocks. **L2** (D1): handoff inside the git dir at
  `<git-path>/agentic-workflow/session-handoff.md`, snapshots at
  `…/snapshots/<session>.md`, `$XDG_STATE_HOME` fallback outside a repo.
  **L3** (D2): real tokens from transcript `usage`; advisory 70% / urgent 85%
  of window × pct; byte bands as fallback. **L4** (D3): override `/compact
  --force-compact` or `AGENTIC_WORKFLOW_COMPACT_FORCE=1`; snapshot written
  regardless. **L5** (D4): PreToolUse hard block with the A2 allowlist. Gate
  policy: one session, one Fable checkpoint before the PR.
- 2026-10-20 (orchestrator) — branch `feat/precompact-handoff` (from main
  92c886b); version 1.67.0 → 1.68.0.
- 2026-10-20 (planner, decomposition of A1/A6) — the per-session marker
  written by the PreToolUse hook on a Write/Edit to the canonical handoff path
  is THE proof that this session wrote the handoff (keyed by `session_id`
  under `$TMPDIR`, like `handoff-budget-<sid>.<band>`); the stamp's `session`
  field is informational. A marker from another session can't exist for this
  `session_id`, so A6 holds by construction. See OQ-1.
- 2026-10-20 (planner, decomposition of AC-3) — the hard gate is NOT silenced
  by an active mission ledger (the observed failure was mid-mission; the
  ledger alone did not survive). handoff-budget's four silencers stay as
  they are for the advisory nudge; its silencer 3 (mtime proxy) applies only
  on the byte-fallback path — the token path uses the marker.
- 2026-10-20 (planner, decomposition of A2; plan-judge revision) — the
  allowlist also admits a Bash command exactly equal to one of `date -u
  +%Y-%m-%dT%H:%M:%SZ`, `git rev-parse --git-path
  agentic-workflow/session-handoff.md`, `git branch --show-current`; the block
  message carries path, branch, UTC time and "dir exists"; the handoff
  command uses the gate-named values instead of resolving them. A fixture
  runs the handoff command's full tool sequence at urgent and asserts zero
  blocks — compliance never depends on fail-open.
- 2026-10-20 (plan-judge) — marker fields split: handoff evidence
  (`handoff_epoch handoff_size`) is written only by a Write/Edit to the
  canonical path; the band cache is separate; `hl_fresh` reads only the
  handoff fields and requires the file to exist with a `_Written:` line.
  Byte-path freshness unit: `URGENT_BYTES / 0.85` as the byte threshold.
- 2026-10-20 (plan-judge, locks OQ-1 and OQ-3) — the hook-written marker is
  the session-identity proof; `/handoff` writes `session unknown` when the id
  is not known; no hook relies on the stamp's id. This repo's
  `docs/WORKFLOW.md` is not synced in this mission (post-merge Closing row).
- Assumed 2026-10-20 (planner; revised at plan-judge to fail toward NOT
  blocking) — `DEFAULT_WINDOW=1000000`, `DEFAULT_PCT=95` when the env vars
  are unset (named constants in `handoff-lib.sh`, pinned by one harness case
  each). The spike ran no Claude Code session that confirms the built-in
  auto-compact point; AC-8 (OB-32) confirms or corrects both. Never cite them
  as measured.
- Verified 2026-10-20 (planner, one real transcript tail in
  `~/.claude/projects/-Users-baker-Playground-venture-workflow-plugin/`,
  Claude Code 2.1.x) — assistant lines are `{"type":"assistant",
  "isSidechain":false,"message":{"usage":{"input_tokens":2,
  "cache_creation_input_tokens":1413,"cache_read_input_tokens":175583,…}}}`
  (sum = context in use); user lines are `{"type":"user","message":
  {"content":<string> | [{"type":"text"|"tool_result",…}]}}` — a `tool_result`
  array is a tool echo, NOT a user request; AC-1 takes only string content or
  `text` items, skipping `isMeta` lines. Any other shape → byte fallback,
  never an error.
- Ceremony: this repo's profile is `proposed` → every gate `required`:
  plan-judge, phase-reviewer (Fable, `security-boundary`), staging-verify,
  chronicler, mission-close.

## Risks

- **Deadlock in the hard gate** — the allowlist or path identity wrong and
  the agent can't comply. → marker-based freshness (A1), canonical-path
  compare, `date` + the self-contained block message, fail-open after 5
  (A2), the two counsel fixtures + an allowlist case per tool.
- **Per-tool-call cost** — `handoff-gate.sh` runs on every tool call and
  reads a transcript tail. → size-delta cache (64 KiB) in the marker; the
  hook does nothing beyond a `wc -c` + marker read on most calls; timeout 5.
- **Harness transcript fixture** — `runHook`'s `transcript:` knob writes
  plain `x` bytes and its comment forbids JSONL fixtures
  (`hook-test.mjs:81–84`). → extend the knob with `content:` (JSONL text) and
  rewrite that comment; the byte-only cases stay as the fallback proof.
- **BIN_LIST** (`hook-test.mjs:47`) lacks `stat tail mv date mktemp chmod pwd
  sleep ls` which the new scripts need. → add them to BIN_LIST (symlinked
  from PATH) and declare them on each script's `# externals:` line; the
  externals self-proof case covers the three new scripts.
- **Secrets in snapshots** — prompt excerpts land on disk. → A5 redaction,
  0600, git-dir only, doctor discloses it; a redaction fixture per pattern.
- **`timeout(1)` absent on macOS** — gh watchdog via background job +
  `kill` after 3 s (A7), `GH_PROMPT_DISABLED=1 GH_NO_UPDATE_NOTIFIER=1`.
- **GNU/BSD stat** — GNU-first (`stat -c %Y … || stat -f %m …`), the
  `compact-resume.sh:119–130` lesson.
- **Byte budgets** — `templates/WORKFLOW.md` 113,406 / 120,000 B: the two new
  hook-table rows + prose edits must stay ≤ 2,500 B net; `commands/*.md`
  ceiling 24,000 B (handoff.md 3,278, doctor.md 10,332 — ample).
- **One-session size** — the brief is large; if the builder reports it can't
  land AC-6 or the doc rows in budget, the orchestrator splits a corrective
  rather than letting the session overrun silently.

## Open questions

- OQ-1 (session id in the stamp) and OQ-3 (repo WORKFLOW sync) — **locked
  2026-10-20 at plan-judge** as recommended; see Locked decisions.
- **OQ-2 — default auto-compact point.** `DEFAULT_WINDOW=1000000`,
  `DEFAULT_PCT=95` are Assumed (fail toward not blocking). **Recommendation:**
  ship as named constants, confirm at OB-32, bump in a `/fix` if wrong. Not
  blocking execution.

---
_The `.plans/precompact-handoff.sessions.md` briefs execute these tasks;
`.plans/precompact-handoff.state.md` tracks progress. Resolve every open
question before execution starts._
