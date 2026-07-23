#!/usr/bin/env bash
# beat-enforcer (D4, PreToolUse/Bash) — soft-nudge at the closing action.
#
# Extracted verbatim (logic-preserving) from hooks.json so it is reviewable and
# diffable, and so tools/hook-test.mjs can dispatch it directly. Behavior is
# unchanged; the harness's PreToolUse cases are the regression guard.
#
# Contract:
#   - Only fire on a closing command: git commit / gh pr create / gh pr merge.
#   - If the active .plans/*.state.md ledger still holds a required-but-unchecked
#     beat (a [ ]/[~] Checkpoint or chronicler/reviewer row — EXCLUDING rows
#     bearing a bold approved/awaiting-human status marker, which are done or
#     human-gated), echo an advisory to spawn it before closing/advancing.
#   - Ledger text is only grepped and echoed, never executed.
#   - Silent when no .plans/ or no active ledger. ALWAYS exit 0 — never blocks (D4).
#
# stdin: the hook event JSON. cwd: the project dir (reads .plans/ relatively).

INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null || printf '%s' "$INPUT")

# Only fire on the closing actions.
case "$CMD" in
  *'git commit'*|*'gh pr create'*|*'gh pr merge'*) ;;
  *) exit 0 ;;
esac

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

if [ -n "$BEAT" ]; then
  echo "⏳ Beat pending — $LEDGER shows an unchecked reviewer/chronicler beat for this phase/session; spawn it before you close/advance:"
  echo "  $BEAT"
fi
exit 0
