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
# DUE-NESS (added 2026-08-03) — the glyph says "hands off"; it does NOT say the
# beat is DUE. A checkpoint whose predecessors are unfinished, or which sits
# behind an unreleased blocker, is not overdue and must not be nudged. Observed
# defect: ~20 consecutive turns nudging a checkpoint that was marked HELD behind
# an unmade human decision, with three [ ] sessions still pending above it.
# Rules, applied to a candidate beat:
#   (i)   the beat row ITSELF carries HELD / ⛔ / HARD PAUSE → it is parked, so
#         SKIP it and keep scanning the LATER candidates. A parked row is not a
#         wall; missions routinely proceed around one (a phase held pending a
#         human decision while a later phase is authorized).
#   (ii)  an UNRELEASED BARRIER sits above it — a `- [ ]`/`- [~]` row carrying
#         ⛔ or HARD PAUSE (a mission-wide stop), or a `- [~]` row carrying HELD.
#         A barrier marked `[x]` is RELEASED and does NOT block.
#   (iii) unmarked unfinished work sits above it — any `- [ ]` row carrying none
#         of those markers (work above it is genuinely in progress → not its
#         turn). Rows carrying a marker are parked, not unfinished, so (iii)
#         steps over them; that is what makes (i)'s "keep scanning" reachable.
# (ii) and (iii) look only UPWARD, so once either fires no later candidate can be
# due either and the scan stops. Only (i) advances to the next candidate.
# This is the one place prose is read, and only for these blocking markers —
# every other decision stays glyph-only.
#
# 2026-08-03 (S5b) — this scan replaced a `head -1`: the enforcer used to evaluate
# ONLY the first [ ] candidate, so a single HELD checkpoint above an open one
# silenced the backstop permanently (dead, and silently so, for the rest of a
# mission). Rule (ii)'s `[ ]`-carrying-HELD branch went with it: a held row is
# now skipped over by (i)/(iii) rather than blocking everything beneath it.
#
# Contract:
#   - FIRST read stdin and exit 0 when .stop_hook_active is true — Claude Code's
#     re-fire guard; without it a Stop hook that emits feedback loops on every
#     stop attempt (the 2026-07 infinite-loop bug).
#   - Otherwise, if the active .plans/*.state.md ledger still has a DUE
#     NOT-STARTED [ ] Checkpoint/chronicler/reviewer row, inject a soft reminder via
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

# Every not-started checkpoint/chronicler/reviewer row, top-down, as `LINE:row`.
# [~] (parked) and [x] (done) rows are the author's "hands off" signal and are
# never candidates.
CANDIDATES=$(grep -inE '^- \[ \].*(checkpoint|chronicler|reviewer|review)' "$LEDGER")
[ -n "$CANDIDATES" ] || exit 0

# Scan for the first DUE candidate (see the DUE-NESS header). The here-string
# keeps the loop in THIS shell, so an `exit 0` inside it really ends the hook.
BEAT=
while IFS= read -r HIT; do
  [ -n "$HIT" ] || continue
  BEAT_LINE=${HIT%%:*}
  ROW=${HIT#*:}

  # (i) the row itself is parked by marker → not due; try the NEXT candidate.
  case "$ROW" in
    *HELD*|*⛔*|*"HARD PAUSE"*) continue ;;
  esac

  # Checklist rows ABOVE this candidate.
  ABOVE=$(head -n "$((BEAT_LINE - 1))" "$LEDGER" | grep -E '^- \[')
  # (ii) an unreleased barrier above it ([x] = released, passes).
  printf '%s\n' "$ABOVE" | grep -qE '^- \[[ ~]\].*(⛔|HARD PAUSE)|^- \[~\].*HELD' && exit 0
  # (iii) unmarked unfinished work above it → not its turn yet.
  printf '%s\n' "$ABOVE" | grep -E '^- \[ \]' | grep -qvE '⛔|HARD PAUSE|HELD' && exit 0

  BEAT=$ROW
  break
done <<<"$CANDIDATES"
[ -n "$BEAT" ] || exit 0

MSG="⏳ Beat pending — $LEDGER shows a not-started reviewer/chronicler beat for this phase/session; spawn it (or mark it [~] if it's in-flight/deferred/awaiting you) before you close/advance: $BEAT"
jq -n --arg m "$MSG" '{hookSpecificOutput:{hookEventName:"Stop",additionalContext:$m}}' 2>/dev/null
exit 0
