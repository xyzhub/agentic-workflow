# Pre-compact handoff enforcement — feature brief

_Drafted 2026-10-20 by the orchestrator via `/agentic-workflow:plan`. Requested by the
owner through the orderly-next session; owner said "go" in this session._

## Problem

Any session must be safe to compact: if auto-compaction is set to fire at
~400k tokens, a compaction must never leave the session with only the
compaction summary. Today (v1.67.0):

- `hooks/lib/handoff-budget.sh` (UserPromptSubmit) only nudges, once per band,
  and its bands are transcript **bytes** anchored to one compaction of a 1M
  window (n=1) — meaningless for a 400k window.
- `compact-resume.sh` (SessionStart `compact`) is the read side and correctly
  flags a stale handoff SUSPECT, but by then nothing fresh exists.
- No PreCompact hook. The handoff lives in a TRACKED file
  (`docs/product/session-handoff.md`), so on a protected branch writing it needs
  a commit/PR; a peer session in a shared checkout dirties it.

Observed failure (orderly, 2026-10-20): handoff last written 2026-09-12; session
auto-compacted mid-mission; only the summary survived; the agent then wrote its
handoff into the memory dir, which the plugin never reads.

## Platform facts (Claude Code hooks docs, code.claude.com/docs/en/hooks, read 2026-10-20)

- PreCompact matchers `manual` | `auto`; input adds `trigger`, `custom_instructions`
  (manual: the `/compact` argument or null; auto: null) plus `session_id`,
  `transcript_path`, `cwd`.
- "Exit with code 2 to block compaction. For a manual `/compact`, the stderr
  message is shown to the user." Blocking auto: proactive → "skips it and the
  conversation continues uncompacted"; recovery from a context-limit error →
  "the underlying error surfaces and the current request fails."
- PreCompact stdout is NOT added to context. A PostCompact event exists (no
  decision control; gets `compact_summary`). Command-hook default timeout 600 s;
  hooks run synchronously.
- Threshold env: `CLAUDE_CODE_AUTO_COMPACT_WINDOW` (100000–1000000 tokens) and
  `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` (percent, can only lower).

## Interview answers (owner's picks, verbatim labels)

1. Canonical record: **"Local file, out of git (Recommended)"** — agents write the
   handoff to a file git never tracks; `docs/product/session-handoff.md` becomes
   optional for shared handoffs; the memory folder is never the handoff.
2. Stale case: **"Snapshot always, block /compact only (Recommended)"** — every
   compaction first gets an automatic snapshot; a manual `/compact` is refused
   until a real handoff exists; auto-compaction is never blocked.
3. Nudge: **"Hard requirement at urgent band (Recommended)"** — at the urgent band
   a stale handoff blocks further tool calls (except writing the handoff) until
   refreshed; bands retuned for a ~400k compaction point.
4. Done: **"No compaction without a record", "Resume says which record",
   "Live check at 400k", "Doctor row"** (all four).
5. Owner goal statement: "the goal of the pre-compact hook is so that we can
   safely compact any session, for example if we enable auto-compaction at 400k
   context window we do not lose integrity".

## Acceptance criteria

- AC1 — Every PreCompact (manual or auto) writes a mechanical snapshot for that
  session BEFORE returning: branch + HEAD (+ dirty count) for every worktree,
  active ledger path + its first `Next up:` line, the last 5 user requests from
  the transcript (each ≤300 chars, control chars stripped), open PRs authored by
  `@me` when `gh` answers within a bounded time (else "unavailable"), and a
  `_Written: <ISO> · session <id> · trigger <t>_` stamp. Snapshot failure never
  blocks an auto compaction.
- AC2 — Manual `/compact` with a stale agent handoff (not newer than the
  transcript's last append) exits 2 with a ≤3-line stderr telling the human to
  run `/agentic-workflow:handoff` first, and names the override. Auto is never blocked.
  The snapshot is written in both cases.
- AC3 — At the urgent band with a stale handoff, PreToolUse blocks tool calls
  except Read/Grep/Glob and a Write/Edit whose target is the local handoff file
  (and `/agentic-workflow:handoff` itself); once the handoff is fresh, nothing is
  blocked. Advisory band stays a nudge. Silent inside a claude-p child.
- AC4 — The size signal is real context tokens where available (latest
  assistant `usage` in the transcript) against the effective auto-compact
  threshold; falls back to the byte bands when tokens can't be read.
- AC5 — `/agentic-workflow:handoff` writes the local canonical file; the repo
  `docs/product/session-handoff.md` is still read when present. The memory dir
  is explicitly not a handoff (WORKFLOW + handoff command say so).
- AC6 — compact-resume considers ledger, local handoff, repo handoff, and this
  session's snapshot; names the freshest and why; a snapshot is presented as
  mechanical (re-read the agent handoff too). Existing branch texts stay
  byte-identical where their inputs are unchanged.
- AC7 — Tests in `tools/hook-test.mjs` for every AC above; lint clean;
  `/agentic-workflow:doctor` row: PreCompact registered, local handoff path not
  tracked, freshness.
- AC8 — Live check (post-release obligation): a real session on orderly-agents
  with `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000` compacts and resumes from the
  snapshot; logged in `.plans/OBLIGATIONS.md`.

## NOT in v1

- Background-task listing in the snapshot (hooks can't see the task list).
- Writing a model-authored handoff from the hook (hooks can't call the model;
  PreCompact stdout doesn't reach context).
- PostCompact use (SessionStart `compact` already covers the read side).
- Syncing local handoffs across machines.

## Shape decisions (option memos)

### D1 — Where the local canonical handoff lives
- **A. Inside the git dir: `$(git rev-parse --git-path agentic-workflow/session-handoff.md)`**,
  snapshots at `…/agentic-workflow/snapshots/<session>.md`. Never tracked, no
  `.gitignore` edit, per-worktree automatically (each worktree has its own git
  dir). Invisible to casual browsing; lost if `.git` is deleted. Reversal: cheap.
- B. `docs/product/session-handoff.local.md` + a `.gitignore` line. Visible next
  to the old file, but needs a tracked `.gitignore` change per project (a PR on
  protected branches — the problem we're removing) and one file per checkout,
  shared across worktrees badly.
- C. Outside the repo (`$XDG_STATE_HOME/agentic-workflow/<repo-hash>/`). Never
  touches the repo; hard for humans and peers to find; hash scheme to maintain.
- **Recommendation: A.**

### D2 — Size signal for the bands
- **A. Real tokens**: last assistant `usage` (input + cache_read +
  cache_creation) from the transcript tail; threshold = window
  (`CLAUDE_CODE_AUTO_COMPACT_WINDOW`, else a named default) × pct
  (`CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`, else named default); advisory at 70%,
  urgent at 85% of the threshold. Byte bands kept as fallback. Accurate for any
  window; depends on transcript field shape (fallback covers drift).
- B. Keep bytes, rescale per window. Simple; known to be a loose proxy (≈6.7
  bytes/token at n=1) — rescaling compounds the error.
- **Recommendation: A.**

### D3 — Override for the manual `/compact` block
- **A. `/compact` argument containing `--force-compact`**, or env
  `AGENTIC_WORKFLOW_COMPACT_FORCE=1`. Human-typed, visible, no file edits.
- B. No override (must write a handoff). Strictest; traps a human who just wants
  to compact.
- **Recommendation: A.**

### D4 — Hard-requirement mechanism (AC3)
- **A. PreToolUse block (exit 2) with an allowlist** (Read/Grep/Glob, Write/Edit
  to the handoff path). Agent can always comply; human prompts never blocked.
- B. UserPromptSubmit block. Blocks the human's own message — wrong target.
- **Recommendation: A.**

## Risks to red-team

- A hard PreToolUse block that can deadlock (allowlist wrong, path mismatch
  between worktrees, stamp parse).
- Snapshot leaks secrets from user prompts — mitigated: written only inside the
  git dir, never tracked; disclosed in the doctor row.
- `gh` latency in PreCompact delaying compaction — bounded watchdog (≤3 s).
- Transcript `usage` shape drift — byte fallback.

## Counsel (technical lens, Fable, 2026-10-20) — verdict: proceed-with-changes

Folded as amendments (the planner treats these as part of the ACs):

- **A1 (blocker) — freshness is NOT the transcript-mtime proxy for enforcement.**
  Writing the handoff appends to the transcript, so `handoff -nt transcript` is
  never true at the next tool call (deadlock), and `/compact` is always appended
  before PreCompact runs. For AC2/AC3: fresh = the handoff's stamp names THIS
  session AND it was written after the band crossing / within the last 10% of
  threshold growth. The hook records the token count when it sees a Write/Edit to
  the handoff path (per-session marker under $TMPDIR, carrying epoch + tokens).
  The mtime proxy stays only on the SessionStart read side (already SUSPECT-labelled).
  Required fixtures: cross urgent → write handoff → next tool call NOT blocked;
  write handoff → manual /compact exits 0 without `--force-compact`.
- **A2 (blocker) — the agent must always be able to comply.** When the urgent band
  first fires, the hook writes the mechanical snapshot itself and names it in the
  block message. Allowlist by tool name: Read, Grep, Glob, AskUserQuestion,
  Skill/SlashCommand for `/agentic-workflow:handoff`, Write/Edit whose canonical path
  equals the handoff's. Fail open (degrade to a nudge) after 5 consecutive blocks
  in a session.
- **A3 — path identity.** Compare canonicalised paths (`pwd -P`), never strings;
  `--git-path` is relative in the main worktree, absolute in linked ones. If the
  path can't be resolved (non-git cwd, bare repo, removed worktree), the hard block
  never engages and the snapshot falls back to `$XDG_STATE_HOME/agentic-workflow/`.
  Doctor prints the resolved path.
- **A4 — token parsing.** Read only the transcript tail (≤256 KiB), last
  non-sidechain `assistant` line's `.message.usage`; cache the band in the marker.
  The default threshold is an assumption, confirmed by AC8. Snapshot also carries
  the last assistant text (≤600 chars) and the active ledger's open beat row.
- **A5 — secrets.** Redact obvious token shapes (`sk-`, `ghp_`, `github_pat_`,
  `AKIA`, `Bearer …`, PEM blocks) before writing; files 0600; write tmp + `mv`.
- **A6 — one session per worktree** is the supported shape; a stamp from another
  session never counts as fresh for this one; snapshots are per session.
- **A7 (nit)** — `gh` bounded by background job + kill (no `timeout(1)` on macOS),
  `GH_PROMPT_DISABLED=1`; set an explicit PreCompact `timeout` (≤15 s) in hooks.json.

## Locked decisions (owner, 2026-10-20)

- **L1** — Counsel amendments A1–A7 approved in full ("Approve all fixes"),
  including fail-open after 5 consecutive blocks.
- **L2 (D1)** — Local handoff inside the git dir:
  `<git-path>/agentic-workflow/session-handoff.md`, per-session snapshots at
  `<git-path>/agentic-workflow/snapshots/<session>.md`; `$XDG_STATE_HOME`
  fallback outside a repo.
- **L3 (D2)** — Real tokens from transcript `usage`; advisory 70%, urgent 85% of
  the auto-compact point (`CLAUDE_CODE_AUTO_COMPACT_WINDOW` × pct); byte bands
  as fallback.
- **L4 (D3)** — Override: `/compact --force-compact` or
  `AGENTIC_WORKFLOW_COMPACT_FORCE=1`; snapshot written regardless.
- **L5 (D4)** — PreToolUse hard block with the A2 allowlist.
- Priority: top of backlog. Gate policy: one session, one Fable reviewer
  checkpoint before the PR (hooks are a `top`-tier risk class).
