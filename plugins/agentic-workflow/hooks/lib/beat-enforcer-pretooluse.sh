#!/usr/bin/env bash
# beat-enforcer (D4, PreToolUse/Bash) — soft-nudge at the closing action.
#
# Extracted (logic-preserving) from hooks.json so it is reviewable and diffable,
# and so tools/hook-test.mjs can dispatch it directly.
#
# Ledger state glyphs — the enforcer keys on the GLYPH, never the row's prose:
#   [ ]  not started        → the enforcer MAY nudge ("you forgot this")
#   [~]  acknowledged / in-flight / deferred / awaiting owner → SILENT
#   [x]  done               → SILENT
# To silence a nag, change [ ]→[~]. The mission workflow auto-sets [~] when a
# review is in-flight and [x] on APPROVE, so this rarely needs a manual touch.
#
# Contract:
#   - Only fire on a closing command: git commit / gh pr create / gh pr merge.
#   - If the active .plans/*.state.md ledger still holds a NOT-STARTED [ ]
#     Checkpoint/chronicler/reviewer row, echo an advisory to spawn it.
#   - Ledger text is only grepped and echoed, never executed.
#   - Silent when no .plans/ or no such row. ALWAYS exit 0 — never blocks (D4).
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

# Active ledger: newest-mtime .plans/*.state.md that still has a not-started [ ] beat.
LEDGER=$(ls -t .plans/*.state.md 2>/dev/null | while IFS= read -r f; do
  if grep -qE '^- \[ \]' "$f"; then printf '%s' "$f"; break; fi
done)
[ -n "$LEDGER" ] || exit 0

# First not-started checkpoint/chronicler/reviewer row. [~] (parked) and [x] (done)
# rows are the author's "hands off" signal and are never matched.
BEAT=$(grep -iE '^- \[ \].*(checkpoint|chronicler|reviewer|review)' "$LEDGER" | head -1)

if [ -n "$BEAT" ]; then
  echo "⏳ Beat pending — $LEDGER shows a not-started reviewer/chronicler beat for this phase/session; spawn it (or mark it [~] if it's in-flight/deferred/awaiting you) before you close/advance:"
  echo "  $BEAT"
fi
exit 0
