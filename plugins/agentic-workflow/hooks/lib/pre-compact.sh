#!/usr/bin/env bash
# pre-compact snapshot + manual-compact gate (PreCompact, both triggers) —
# precompact-handoff AC-1/AC-2. Any session must be safe to compact: a compaction
# must never leave it with only the summary.
#
# Contract:
#   1. ALWAYS first: write this session's mechanical snapshot
#      (<handoff-dir>/snapshots/<session>.md, hl_snapshot — facts only, redacted,
#      0600, tmp + mv). A snapshot failure is swallowed: it never blocks.
#   2. Drop the session's handoff-gate band cache (compaction shrinks the
#      context; the next tool call must re-parse, not act on a pre-compact band).
#   3. trigger=auto → exit 0, ALWAYS (blocking auto either skips it or fails the
#      request — never). trigger=manual → exit 2 with ≤3 stderr lines naming
#      /agentic-workflow:handoff and the override, unless: the handoff is fresh
#      (hl_fresh: this session's gate marker + the file with a `_Written:` line +
#      ≤10 % of the threshold of growth since), `--force-compact` appears in the
#      /compact argument, AGENTIC_WORKFLOW_COMPACT_FORCE=1, or the local handoff
#      path is not inside a git work tree (A3: the hard block never engages).
#   Silent and exit 0 inside a claude-p child (AGENTIC_WORKFLOW_CHILD=1).
# externals: cat git grep sed head tail tr cut wc mkdir dirname stat mv rm date mktemp chmod pwd sleep ls jq gh
# stdin: the hook event JSON (trigger, custom_instructions, session_id,
# transcript_path). cwd: the project dir.

[ "${AGENTIC_WORKFLOW_CHILD:-0}" = 1 ] && exit 0 # a claude-p child (run-claude.mjs): silent

INPUT=$(cat)
field() { printf '%s' "$INPUT" | jq -r "$1 // \"\" | tostring" 2>/dev/null; }
TRIGGER=$(field .trigger)
CUSTOM=$(field .custom_instructions)
SESSION_ID=$(field .session_id)
TRANSCRIPT=$(field .transcript_path)

. "$(dirname "${BASH_SOURCE[0]}")/handoff-lib.sh"
SID=$(hl_sid "${SESSION_ID:-unknown}")
case "$TRIGGER" in manual | auto) ;; *) TRIGGER=unknown ;; esac

hl_paths || exit 0
SNAP=$(hl_snapshot "$SID" "$TRIGGER" "$TRANSCRIPT")
: > "$(hl_mark "$SID" band)" 2>/dev/null

[ "$TRIGGER" = manual ] || exit 0
[ "$HL_GIT" = 1 ] || exit 0
case "$CUSTOM" in *--force-compact*) exit 0 ;; esac
[ "${AGENTIC_WORKFLOW_COMPACT_FORCE:-0}" = 1 ] && exit 0

CUR="" UNIT=""
if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
  read -r _ CUR UNIT <<< "$(hl_band "$TRANSCRIPT")"
fi
hl_fresh "$SID" "$CUR" "$UNIT" && exit 0

echo "🛑 /compact refused — this session has not written its agent handoff recently, so the summary alone would lose the working state${SNAP:+ (a mechanical snapshot was saved: $SNAP)}." >&2
echo "Run /agentic-workflow:handoff first (it writes $HL_HANDOFF), then /compact again." >&2
echo "Override: /compact --force-compact, or set AGENTIC_WORKFLOW_COMPACT_FORCE=1." >&2
exit 2
