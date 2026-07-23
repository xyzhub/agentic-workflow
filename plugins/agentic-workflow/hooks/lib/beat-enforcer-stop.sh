#!/usr/bin/env bash
# beat-enforcer backstop (D4, Stop) — on turn-end, nudge ONCE about a required
# but NOT-STARTED ledger beat, then allow the stop.
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
#   - FIRST read stdin and exit 0 when .stop_hook_active is true — Claude Code's
#     re-fire guard; without it a Stop hook that emits feedback loops on every
#     stop attempt (the 2026-07 infinite-loop bug).
#   - Otherwise, if the active .plans/*.state.md ledger still has a NOT-STARTED
#     [ ] Checkpoint/chronicler/reviewer row, inject a soft reminder via
#     hookSpecificOutput.additionalContext (jq-built, so ledger text is
#     JSON-escaped, never executed).
#   - Silent when no .plans/ or no such row. ALWAYS exit 0 — NEVER exit 2.
#
# stdin: the hook event JSON. cwd: the project dir (reads .plans/ relatively).

INPUT=$(cat)

# Re-fire guard: a Stop hook re-invoked because a prior stop was blocked must not
# emit again, or it loops.
if [ "$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)" = "true" ]; then
  exit 0
fi

[ -d .plans ] || exit 0

# Active ledger: newest-mtime .plans/*.state.md that still has an open [ ]/[~] beat
# (a parked [~] ledger is still the active mission, so it is picked over an older
# abandoned one — the nudge itself then keys on [ ] only, below).
LEDGER=$(ls -t .plans/*.state.md 2>/dev/null | while IFS= read -r f; do
  if grep -qE '^- \[( |~)\]' "$f"; then printf '%s' "$f"; break; fi
done)
[ -n "$LEDGER" ] || exit 0

# First not-started checkpoint/chronicler/reviewer row. [~] (parked) and [x] (done)
# rows are the author's "hands off" signal and are never matched.
BEAT=$(grep -iE '^- \[ \].*(checkpoint|chronicler|reviewer|review)' "$LEDGER" | head -1)
[ -n "$BEAT" ] || exit 0

MSG="⏳ Beat pending — $LEDGER shows a not-started reviewer/chronicler beat for this phase/session; spawn it (or mark it [~] if it's in-flight/deferred/awaiting you) before you close/advance: $BEAT"
jq -n --arg m "$MSG" '{hookSpecificOutput:{hookEventName:"Stop",additionalContext:$m}}' 2>/dev/null
exit 0
