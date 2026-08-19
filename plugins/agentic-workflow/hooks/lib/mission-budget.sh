#!/usr/bin/env bash
# mission-budget (UserPromptSubmit) — the active mission's status line, its
# session budget, and the overrun STOP. Supersedes the thread-keeper (D3).
#
# Why this exists (orderly, 2026-08 — WORKFLOW.md §12 LA-1 and LA-7):
#   - LA-1: multi-venue-manager was planned at 18 sessions and ran ~44 over
#     ~28 hours. Every phase was justified; the owner was never offered a
#     choice about the overrun and learned the total at the end. The plugin had
#     NO estimate-vs-actual mechanism at all — only byte/line advisories.
#   - LA-7: the thread-keeper read `Next up:` with `tail -1`, so a ledger that
#     kept superseded `Next up:` blocks "for the record" fed the owner the most
#     STALE one, prefixed to every message, for a day.
#
# Contract:
#   - ADVISORY on the status line; the OVERRUN text is a protocol STOP — the
#     orchestrator (mission/autopilot) MUST NOT start another brief until the
#     owner has made the scope decision — but the hook itself never blocks:
#     ALWAYS exit 0 on every path (no .plans/, no active ledger, missing
#     fields, garbage stdin). stdout-inject only, like the router.
#   - Active ledger = the thread-keeper predicate VERBATIM (newest-mtime
#     .plans/*.state.md that still has an open [ ]/[~] beat), shared with
#     handoff-budget.sh and the beat-enforcers so no two hooks can disagree
#     about what "active" means.
#   - `Next up:` is read with `head -1` (the FIRST line wins) and a second
#     matching line is called out loudly — the ledger must carry exactly one.
#   - Budget lines, both optional, both `^Key: <int>`:
#       Estimate: N sessions      (written by the planner; default 1)
#       Sessions used: k          (incremented by the orchestrator at every
#                                  session/brief start, incl. autopilot phases)
#     No `Estimate:` → a one-line reminder that the planner must write it.
#     Overrun fires when k ≥ 1.5 × N, i.e. 2k ≥ 3N in integer math (N=1 → k=2,
#     N=2 → k=3, N=18 → k=27). It fires on EVERY prompt until the ledger's
#     Estimate is revised (a dated locked decision) — an overrun is a standing
#     condition, not a one-shot nudge, and the owner must be able to predict
#     every firing.
#   - Ledger text is only grepped/echoed, never executed; the numbers are
#     validated as digits before arithmetic.
#
# stdin: the hook event JSON (unused beyond being drained). cwd: the project.

INPUT=$(cat) # drain stdin; nothing in the event is load-bearing here
: "$INPUT"

[ -d .plans ] || exit 0

LEDGER=$(ls -t .plans/*.state.md 2>/dev/null | while IFS= read -r f; do
  if grep -qE '^- \[( |~)\]' "$f"; then printf '%s' "$f"; break; fi
done)
[ -n "$LEDGER" ] || exit 0

NAME=$(basename "$LEDGER" .state.md)

# ── Next up: FIRST line wins; count the rest (LA-7) ────────────────────────
NEXT_COUNT=$(grep -cE '^Next up:' "$LEDGER" 2>/dev/null | tr -d '[:space:]')
case "$NEXT_COUNT" in '' | *[!0-9]*) NEXT_COUNT=0 ;; esac
NEXT=$(grep -E '^Next up:' "$LEDGER" 2>/dev/null | head -1)

# ── Budget fields ──────────────────────────────────────────────────────────
EST=$(grep -E '^Estimate:[[:space:]]*[0-9]+' "$LEDGER" 2>/dev/null | head -1 \
      | sed -E 's/^Estimate:[[:space:]]*([0-9]+).*/\1/')
USED=$(grep -E '^Sessions used:[[:space:]]*[0-9]+' "$LEDGER" 2>/dev/null | head -1 \
      | sed -E 's/^Sessions used:[[:space:]]*([0-9]+).*/\1/')
case "$EST" in *[!0-9]*) EST='' ;; esac
case "$USED" in '' | *[!0-9]*) USED=0 ;; esac

# ── Status line (≤1 line + Next up) ────────────────────────────────────────
if [ -n "$EST" ]; then
  echo "🧵 Mission ${NAME} — session ${USED}/${EST} (est.) — ${LEDGER}"
else
  echo "🧵 Mission ${NAME} — no Estimate: line — ${LEDGER}"
fi
[ -n "$NEXT" ] && echo "  $NEXT"

# ── LA-7: exactly one Next up: ─────────────────────────────────────────────
if [ "$NEXT_COUNT" -gt 1 ]; then
  echo "  ⚠️ ${NEXT_COUNT} \`Next up:\` lines in the ledger — only the FIRST is read. Rename superseded ones \`SUPERSEDED next-up (historical):\` so the state has one answer (§12 LA-7)."
fi

# ── LA-1: estimate missing, or overrun ─────────────────────────────────────
if [ -z "$EST" ]; then
  echo "  📐 No \`Estimate: N sessions\` in the ledger — the planner writes it before execution (default 1); the orchestrator increments \`Sessions used:\` at every session start."
elif [ $((2 * USED)) -ge $((3 * EST)) ]; then
  echo "  🛑 OVERRUN — session ${USED} of ${EST} estimated (≥1.5×). STOP before starting any further brief: give the owner the scope decision — (a) ship a defined subset now, (b) continue at a revised estimate, or (c) abort — with the remaining phases and what each buys. Record the answer as a dated locked decision and update \`Estimate:\`. Continuing silently is not a neutral default (§5, LA-1)."
fi

exit 0
