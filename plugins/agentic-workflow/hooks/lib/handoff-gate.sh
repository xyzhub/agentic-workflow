#!/usr/bin/env bash
# handoff gate (PreToolUse, every tool) — precompact-handoff AC-3/AC-4. At the
# urgent band (≥85 % of the auto-compact point, tokens; byte bands as fallback)
# with no fresh handoff from THIS session, refuse tool calls until the agent
# writes the local handoff — so a compaction can never leave only the summary.
#
# Contract (A1–A3, L1, L5):
#   - A Write/Edit/MultiEdit whose canonical target (hl_canon: pwd -P, never a
#     string compare) equals the local handoff writes the `.handoff` marker
#     (epoch, current size, unit) and resets the block counter — the ONLY way
#     a session proves freshness. Exit 0.
#   - Band cache: re-parse the transcript only when it grew ≥ 64 KiB since the
#     cached parse (`.band`); a re-parse never touches `.handoff`, so it can't
#     mint freshness. A cached below-urgent band is read via hl_state_fast before
#     hl_paths, so the common call spawns no git. Markers live in the private
#     per-worktree state dir (handoff-lib.sh), never $TMPDIR; none without a
#     session_id.
#   - Below urgent, or fresh (hl_fresh), or the handoff path not inside a git work
#     tree (A3) → exit 0 silent.
#   - Urgent + stale → allowlist (exit 0): Read, Grep, Glob, AskUserQuestion;
#     Skill `agentic-workflow:handoff` / SlashCommand `/agentic-workflow:handoff…`
#     (the skill/command field itself, never a substring of the whole input); a
#     Bash command (whitespace-trimmed) EXACTLY one of `date -u +%Y-%m-%dT%H:%M:%SZ`,
#     `git rev-parse [--path-format=absolute] --git-path
#     agentic-workflow/session-handoff.md`, `git branch --show-current`; a
#     Write/Edit to the handoff (above). Anything else → blocks+1; the first block
#     writes the mechanical snapshot (which creates the handoff dir); ≤5 stderr
#     lines carry the path, branch and UTC time so /agentic-workflow:handoff runs
#     without a blocked call; exit 2. The 6th consecutive block fails OPEN to a
#     one-line nudge (exit 0) — a safety net, never the compliance path.
#   - Silent, exit 0, inside a claude-p child (AGENTIC_WORKFLOW_CHILD=1) and on
#     any missing input (no session_id, no transcript, no jq).
# externals: cat git grep sed head tail tr cut wc mkdir dirname stat mv rm date mktemp chmod pwd sleep ls jq gh
# stdin: the hook event JSON. cwd: the project dir.

[ "${AGENTIC_WORKFLOW_CHILD:-0}" = 1 ] && exit 0 # a claude-p child (run-claude.mjs): silent

INPUT=$(cat)
field() { printf '%s' "$INPUT" | jq -r "$1 // \"\" | tostring" 2>/dev/null; }
SESSION_ID=$(field .session_id)
TRANSCRIPT=$(field .transcript_path)
[ -n "$SESSION_ID" ] && [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ] || exit 0
TOOL=$(field .tool_name)

. "$(dirname "${BASH_SOURCE[0]}")/handoff-lib.sh"
SID=$(hl_sid "$SESSION_ID")
[ -n "$SID" ] || exit 0
SIZE=$(wc -c < "$TRANSCRIPT" 2>/dev/null | tr -d '[:space:]')
hl_num "$SIZE" || exit 0

# Fast path — no git spawn: a cached below-urgent band that is still within the
# re-parse window exits here (most tool calls). Write/Edit always take the full
# path (they may be the handoff write).
case "$TOOL" in
  Write | Edit | MultiEdit) ;;
  *)
    if HL_STATE=$(hl_state_fast) && BANDF=$(hl_mark "$SID" band); then
      read -r BAND AT UNIT BLOCKS CUR 2>/dev/null < "$BANDF"
      if [ -n "$UNIT" ] && [ "$BAND" != urgent ] && hl_num "$AT" && [ "$SIZE" -ge "$AT" ] \
        && [ $((SIZE - AT)) -lt "$HL_REPARSE_BYTES" ]; then exit 0; fi
    fi ;;
esac

hl_paths || exit 0
hl_state_init || exit 0
BANDF=$(hl_mark "$SID" band) || exit 0
HOF=$(hl_mark "$SID" handoff) || exit 0

# Band, cached: re-parse only on ≥ 64 KiB of growth (or a shrink / no cache).
BAND="" AT="" UNIT="" BLOCKS="" CUR=""
read -r BAND AT UNIT BLOCKS CUR 2>/dev/null < "$BANDF"
hl_num "$BLOCKS" || BLOCKS=0
if ! hl_num "$AT" || [ "$SIZE" -lt "$AT" ] || [ $((SIZE - AT)) -ge "$HL_REPARSE_BYTES" ] || [ -z "$UNIT" ]; then
  read -r BAND CUR UNIT <<< "$(hl_band "$TRANSCRIPT")"
  [ -n "$UNIT" ] || exit 0
  AT=$SIZE
  hl_mput "$BANDF" "$BAND $AT $UNIT $BLOCKS $CUR"
fi

# The handoff write itself — the one thing that proves this session's freshness.
case "$TOOL" in
  Write | Edit | MultiEdit)
    FP=$(field .tool_input.file_path)
    if [ -n "$FP" ] && [ "$(hl_canon "$FP")" = "$HL_HANDOFF" ]; then
      hl_mput "$HOF" "$(date +%s) $CUR $UNIT"
      hl_mput "$BANDF" "$BAND $AT $UNIT 0 $CUR"
      exit 0
    fi
    ;;
esac

[ "$HL_GIT" = 1 ] || exit 0
[ "$BAND" = urgent ] || exit 0
hl_fresh "$SID" "$CUR" "$UNIT" && exit 0

case "$TOOL" in
  Read | Grep | Glob | AskUserQuestion) exit 0 ;;
  Skill)
    [ "$(field .tool_input.skill)" = agentic-workflow:handoff ] && exit 0 ;;
  SlashCommand)
    case "$(field .tool_input.command)" in '/agentic-workflow:handoff' | '/agentic-workflow:handoff '*) exit 0 ;; esac ;;
  Bash)
    CMD=$(field .tool_input.command)
    CMD=${CMD#"${CMD%%[![:space:]]*}"}
    CMD=${CMD%"${CMD##*[![:space:]]}"}
    case "$CMD" in
      'date -u +%Y-%m-%dT%H:%M:%SZ' | 'git rev-parse --git-path agentic-workflow/session-handoff.md' \
        | 'git rev-parse --path-format=absolute --git-path agentic-workflow/session-handoff.md' | 'git branch --show-current') exit 0 ;;
    esac ;;
esac

BLOCKS=$((BLOCKS + 1))
hl_mput "$BANDF" "$BAND $AT $UNIT $BLOCKS $CUR"
if [ "$BLOCKS" -ge "$HL_FAIL_OPEN" ]; then
  echo "⚠️ Handoff gate failed open after $((HL_FAIL_OPEN - 1)) blocks — context is past the urgent band and no handoff was written; run /agentic-workflow:handoff (writes $HL_HANDOFF) before anything else."
  exit 0
fi

mkdir -p "$HL_DIR" 2>/dev/null
SNAP="$HL_SNAPDIR/$SID.md"
if [ "$BLOCKS" = 1 ]; then
  SNAP=$(HL_GH_WAIT=2 hl_snapshot "$SID" gate "$TRANSCRIPT") || SNAP="(snapshot failed)"
fi
if [ "$UNIT" = tokens ]; then WHY="context at $CUR tokens, ≥${HL_URGENT_PCT}% of the $(hl_threshold)-token auto-compact point"
else WHY="transcript at $CUR bytes, past the urgent byte band"; fi
echo "🛑 Handoff gate — $WHY, and this session has not written its handoff; only Read/Grep/Glob and the handoff write run until it does (block $BLOCKS of $((HL_FAIL_OPEN - 1)))." >&2
echo "handoff=$HL_HANDOFF (directory exists)" >&2
echo "branch=$(git branch --show-current 2>/dev/null)" >&2
echo "now=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >&2
echo "snapshot=$SNAP — subagents share this gate; run /agentic-workflow:handoff with these values" >&2
exit 2
