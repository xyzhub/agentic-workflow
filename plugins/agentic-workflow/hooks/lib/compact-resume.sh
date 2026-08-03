#!/usr/bin/env bash
# post-compaction re-read directive (D8, SessionStart:compact) — after the
# context window is compacted, tell the agent to re-read the ledger VERBATIM
# instead of continuing from a summary of a summary.
#
# Why this exists: measured on a real 596-request session, compaction fires
# rarely (once) but catastrophically — the window collapsed 999,816 → 82,009
# tokens in a single step (−91.8%). Nothing in the protocol currently tells the
# post-compaction agent to re-hydrate from the record, so it resumes from a
# lossy summary. This is a CORRECTNESS backstop, not a token lever.
#
# Contract:
#   - Registered in hooks.json under SessionStart with matcher `compact` and
#     NOTHING else — never `startup`, never `resume`.
#   - Defence in depth: also reads stdin and stays silent when `.source` is
#     present and is not `compact` (so a mis-dispatch can't nag on every new
#     session). A MISSING `.source` still fires — the matcher already gated it.
#   - Names the active .plans/*.state.md ledger, selected by the same newest-mtime
#     rule as hooks/lib/beat-enforcer-stop.sh (kept verbatim so the two hooks
#     can never disagree about which mission is active).
#   - Emits a ≤6-line directive via hookSpecificOutput.additionalContext, built
#     with `jq -n --arg` so the ledger path is JSON-escaped, never executed.
#   - Silent when no .plans/ or no active ledger. ALWAYS exit 0 — NEVER exit 2.
#
# stdin: the hook event JSON. cwd: the project dir (reads .plans/ relatively).

INPUT=$(cat)

# Only after a compaction. An absent `.source` is treated as compact because the
# hooks.json matcher already restricted us; a PRESENT non-compact source means we
# were dispatched wrongly, and a startup/resume/clear nag would be noise.
SOURCE=$(printf '%s' "$INPUT" | jq -r '.source // ""' 2>/dev/null)
if [ -n "$SOURCE" ] && [ "$SOURCE" != "compact" ]; then
  exit 0
fi

[ -d .plans ] || exit 0

# Active ledger: newest-mtime .plans/*.state.md that still has an open [ ]/[~] beat
# (a parked [~] ledger is still the active mission, so it is picked over an older
# abandoned one). Identical to beat-enforcer-stop.sh by design.
LEDGER=$(ls -t .plans/*.state.md 2>/dev/null | while IFS= read -r f; do
  if grep -qE '^- \[( |~)\]' "$f"; then printf '%s' "$f"; break; fi
done)
[ -n "$LEDGER" ] || exit 0

MSG="♻️ Context was just COMPACTED — what you hold now is a summary, not the record.
Before anything else, re-read these VERBATIM (do not resume from the summary):
  1. $LEDGER — phase, \`Next up:\`, open beats, Deviations, and \`## Standing steers\` (honor them).
  2. docs/product/session-handoff.md — the last session handoff, if it exists.
Then re-state the current brief's remaining Do/Verify items before continuing."

jq -n --arg m "$MSG" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$m}}' 2>/dev/null
exit 0
