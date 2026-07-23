#!/usr/bin/env bash
# beat-enforcer backstop (D4, Stop) — on turn-end, nudge ONCE about a
# required-but-unchecked ledger beat, then allow the stop.
#
# Extracted verbatim (logic-preserving) from hooks.json so it is reviewable and
# diffable, and so tools/hook-test.mjs can dispatch it directly. Behavior is
# unchanged; the harness's Stop cases are the regression guard.
#
# Contract:
#   - FIRST read stdin and exit 0 when .stop_hook_active is true — Claude Code's
#     re-fire guard; without it a Stop hook that emits feedback loops on every
#     stop attempt (the 2026-07 infinite-loop bug).
#   - Otherwise, if the active .plans/*.state.md ledger still has an unchecked
#     [ ]/[~] Checkpoint/chronicler/reviewer row — EXCLUDING rows bearing a bold
#     approved/awaiting-human status marker (**APPROVED**, **merge pending
#     human**, …), which are done or human-gated, not a forgotten spawn — inject a
#     soft reminder via hookSpecificOutput.additionalContext (jq-built, so ledger
#     text is JSON-escaped, never executed).
#   - Silent when no .plans/ or no active ledger. ALWAYS exit 0 — NEVER exit 2.
#
# stdin: the hook event JSON. cwd: the project dir (reads .plans/ relatively).

INPUT=$(cat)

# Re-fire guard: a Stop hook re-invoked because a prior stop was blocked must not
# emit again, or it loops.
if [ "$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)" = "true" ]; then
  exit 0
fi

[ -d .plans ] || exit 0

# Active ledger: newest-mtime .plans/*.state.md that still has an open [ ]/[~] beat.
LEDGER=$(ls -t .plans/*.state.md 2>/dev/null | while IFS= read -r f; do
  if grep -qE '^- \[( |~)\]' "$f"; then printf '%s' "$f"; break; fi
done)
[ -n "$LEDGER" ] || exit 0

# First unchecked checkpoint/chronicler/reviewer row, minus already-approved /
# awaiting-human rows (excluded by their bold status marker).
BEAT=$(grep -iE '^- \[( |~)\].*(checkpoint|chronicler|reviewer|review)' "$LEDGER" \
  | grep -viE '\*\*[^*]*(approved|pending human|merge pending|human merge|wrap pending)|human locks' \
  | head -1)
[ -n "$BEAT" ] || exit 0

MSG="⏳ Beat pending — $LEDGER shows an unchecked reviewer/chronicler beat for this phase/session; spawn it before you close/advance: $BEAT"
jq -n --arg m "$MSG" '{hookSpecificOutput:{hookEventName:"Stop",additionalContext:$m}}' 2>/dev/null
exit 0
