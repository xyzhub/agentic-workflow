#!/usr/bin/env bash
# active-ledger — the ONE definition of "the active mission ledger", sourced by
# mission-budget, handoff-budget, compact-resume and both beat-enforcers so no
# two hooks can disagree about what "active" means. Defines a function only;
# sourcing it has no side effects.
#
#   active_ledger   → prints the path of the active .plans/*.state.md, or
#                     nothing (callers treat empty as "no mission": silent).
#
# Ledgers are walked newest-mtime first; the newest-touched ledger is the
# current focus. Each one is classified:
#
#   SKIP (never started — look at the next-newest):
#     - `Sessions used: 0` — the orchestrator increments it write-ahead BEFORE
#       spawning the first brief, so a running mission is ≥1; 0 is a planned-only
#       trio (or one the owner said to stop after planning);
#     - `Status: planned`.
#   STOP (the focus is finished — there is NO active mission; older ledgers
#   that were never closed are abandoned, not resumed):
#     - a `Closed: YYYY-MM-DD` stamp — the canonical close marker /settle and
#       /mission write;
#     - any other `Status:` value but `active` (blocked | parked | closed …);
#     - the FIRST `Next up:` line says the mission is closed/complete (legacy
#       ledgers that predate the stamp);
#     - no open beat — an open beat is a `- [ ]` / `- [~]` row, EXCEPT a `[~]`
#       row handed to the register (`→ OB-<n>` or naming OBLIGATIONS.md): that
#       work left the mission, it is not a beat.
#   ACTIVE: anything else.
#
# Why (orderly, 2026-10, plugin v1.51.1): the old predicate was "newest ledger
# with any `[ ]`/`[~]` row". A closed ledger keeps its promoted obligation rows
# as `[~] … → promoted to .plans/OBLIGATIONS.md`, so a CLOSED mission stayed
# "active" forever and every prompt paid for its status line; a planned,
# never-started ledger (21 open `[ ]` beats) became "active" whenever its mtime
# was bumped; and skipping a closed ledger must not fall through to an older,
# abandoned one that was simply never stamped.
#
# Ledger text is only grepped, never executed.

active_ledger() {
  local f status next
  [ -d .plans ] || return 0
  ls -t .plans/*.state.md 2>/dev/null | while IFS= read -r f; do
    status=$(grep -m1 -E '^Status:' "$f" | sed -E 's/^Status:[[:space:]]*\**//' \
             | tr '[:upper:]' '[:lower:]')
    case "$status" in planned*) continue ;; esac
    grep -qE '^Sessions used:[[:space:]]*0+([^0-9]|$)' "$f" && continue
    grep -qE '^Closed:[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}' "$f" && break
    case "$status" in '' | active | active[!a-z]*) ;; *) break ;; esac
    next=$(grep -m1 -E '^Next up:' "$f")
    printf '%s' "$next" | grep -qiE 'mission (is )?(closed|complete)' && break
    if grep -E '^- \[( |~)\]' "$f" \
      | grep -vqE '^- \[~\].*(OBLIGATIONS\.md|→[[:space:]]*OB-[0-9])'; then
      printf '%s' "$f"
    fi
    break
  done
}
