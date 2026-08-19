#!/usr/bin/env bash
# conform-check (SessionStart, matcher startup|resume) — does this project's docs
# structure conform to the INSTALLED plugin? Runs tools/conform.mjs --brief once
# per session and injects its ≤3-line advisory. The "recognize" half; /sync is
# the "conform" half — both read the same ladder in tools/conform.mjs.
#
# Why (owner, 2026-08-19): a project adopted on v1.43 kept running on v1.46 with
# ledgers that lacked the budget fields (so the overrun stop could not fire), no
# Staging/Issue-tracker rows, no catalog, no roadmap epic view, a hand-appended
# backlog — and nothing said so until someone ran /sync by hand.
#
# Contract:
#   - fires ONLY on startup|resume (never compact — compact-resume owns that beat);
#   - silent when the cwd is not an adopted project (no docs/WORKFLOW.md), when
#     the structure conforms, when node is missing, or when the plugin's
#     tools/conform.mjs is missing (a hook must never fail a session start);
#   - once per session — $TMPDIR marker keyed by the sanitized session_id
#     (obligations-due's pattern), written only when the advisory fires;
#   - filesystem-only (conform.mjs does no git/network); bounded to ≤3 lines;
#   - emits via hookSpecificOutput.additionalContext, jq-built (JSON-escaped);
#   - ALWAYS exit 0 on every path.
# stdin: the hook event JSON. cwd: the project.

INPUT=$(cat)

SOURCE=$(printf '%s' "$INPUT" | jq -r '.source // ""' 2>/dev/null)
case "$SOURCE" in startup|resume|"") ;; *) exit 0 ;; esac
[ -f docs/WORKFLOW.md ] || exit 0
command -v node >/dev/null 2>&1 || exit 0
[ -n "$CLAUDE_PLUGIN_ROOT" ] || exit 0
[ -f "$CLAUDE_PLUGIN_ROOT/tools/conform.mjs" ] || exit 0

SESSION_ID=$(printf '%s' "$INPUT" | jq -r '.session_id // ""' 2>/dev/null)
[ -n "$SESSION_ID" ] || exit 0

OUT=$(node "$CLAUDE_PLUGIN_ROOT/tools/conform.mjs" --brief --plugin "$CLAUDE_PLUGIN_ROOT" 2>/dev/null)
[ -n "$OUT" ] || exit 0   # conformant → silent

SID=$(printf '%s' "$SESSION_ID" | tr -c 'A-Za-z0-9._-' '_')
MARK="${TMPDIR:-/tmp}/conform-check-${SID}"
[ -e "$MARK" ] && exit 0
: > "$MARK" 2>/dev/null || true

jq -n --arg m "$OUT" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$m}}' 2>/dev/null
exit 0
