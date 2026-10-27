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
#       /mission write — here OR on the default/integration branch's copy;
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
# Closed elsewhere (orderly, 2026-10, plugin v1.66.1): a feature worktree keeps
# its own copy of the ledger, so a mission stamped `Closed:` on the default or
# integration branch kept printing its stale `Next up:` from the worktree after
# it shipped. A `Closed:` stamp on the copy at the default branch (origin/HEAD,
# else main) or the §10 **Staging** branch — local or origin ref — is a STOP
# too: the integration branch's copy wins over a worktree's.
#
# Ledger text is only grepped, never executed.

ledger_closed_upstream() {
  local f=$1 def stg b r
  git rev-parse --git-dir >/dev/null 2>&1 || return 1
  def=$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')
  stg=$(grep -m1 -E '^\| \*\*Staging\*\* \|' docs/WORKFLOW.md 2>/dev/null \
        | sed -E 's/^\| \*\*Staging\*\* \|[[:space:]]*`?([A-Za-z0-9._/-]+).*/\1/')
  case "$stg" in none | '|'* | *'|'*) stg='' ;; esac
  for b in "${def:-main}" $stg; do
    git check-ref-format --branch "$b" >/dev/null 2>&1 || continue
    for r in "origin/$b" "$b"; do
      git show "$r:./$f" 2>/dev/null \
        | grep -qE '^Closed:[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}' && return 0
    done
  done
  return 1
}

active_ledger() {
  local f status next
  [ -d .plans ] || return 0
  ls -t .plans/*.state.md 2>/dev/null | while IFS= read -r f; do
    status=$(grep -m1 -E '^Status:' "$f" | sed -E 's/^Status:[[:space:]]*\**//' \
             | tr '[:upper:]' '[:lower:]')
    case "$status" in planned*) continue ;; esac
    grep -qE '^Sessions used:[[:space:]]*0+([^0-9]|$)' "$f" && continue
    grep -qE '^Closed:[[:space:]]*[0-9]{4}-[0-9]{2}-[0-9]{2}' "$f" && break
    ledger_closed_upstream "$f" && break
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
