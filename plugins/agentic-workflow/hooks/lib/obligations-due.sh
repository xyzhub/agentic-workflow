#!/usr/bin/env bash
# obligations-due advisory (SessionStart, matcher `startup|resume`) — at the
# start of a session, surface how many deferred obligations are sitting
# unticked in the repo's parking places, so a due condition gets probed by a
# session that can actually act on it (`/agentic-workflow:settle`).
#
# Why this exists: an obligation with an observable condition and no trigger is
# lost the moment its mission closes — "zero open PRs" reads as done. The
# register (.plans/OBLIGATIONS.md) and each ledger's `## Closing` block are the
# durable parking places (OQ2); this hook is the beat that makes them visible
# (OQ3). Session start is where a due count changes behavior; UserPromptSubmit
# would be every-turn noise for a weekly-scale signal, and Stop needs a re-fire
# guard for no gain.
#
# Contract (OQ3, human-locked):
#   - Matcher `startup|resume` and NOTHING else — never `compact`:
#     compact-resume.sh owns that beat and its re-read directive must not
#     compete with an advisory.
#   - GREP-ONLY, NO NETWORK (L5): this script never runs `gh`, never probes a
#     row's condition, never touches anything but local files. It counts
#     unticked `- [ ] OB-` rows in .plans/OBLIGATIONS.md plus unticked `- [ ]`
#     rows inside any `.plans/*.state.md` `## Closing` section, and says so.
#     The real probes live in /settle, end.md, and check.md — command steps,
#     where a human-visible actor runs them.
#   - ADVISORY ONLY: ≤3 lines via hookSpecificOutput.additionalContext, built
#     with `jq -n --arg` so file text is JSON-escaped, never executed.
#   - Exactly four silencers, all mechanical (L13) — a human must be able to
#     predict every firing; if it nags, fix the rows, never add conditions:
#       1. no register AND no `## Closing` section in any ledger → silent
#          (repos that never adopted the grammar hear nothing);
#       2. zero unticked rows → silent (everything fired or promoted);
#       3. once per session — a marker file under $TMPDIR keyed by the
#          sanitized session_id (no repo state, nothing to .gitignore); the
#          marker is written only when the advisory actually fires;
#       4. always exit 0 on every path — missing files, missing jq (the
#          session_id parse yields "" and the guard exits), garbage stdin,
#          unwritable $TMPDIR (degrades to re-advising, never to a failure).
#   - Portability (L9): POSIX shell + grep/awk/tr/printf only — no `stat`
#     (-f/-c divergence), no `date -d`/`-j`; nothing here needs a timestamp.
#
# stdin: the hook event JSON. cwd: the project dir (reads .plans/ relatively).

INPUT=$(cat)

# session_id keys the once-per-session marker; without it (or without jq) we
# cannot dedupe, so fail SILENT and 0 — an advisory must never break a session.
SESSION_ID=$(printf '%s' "$INPUT" | jq -r '.session_id // ""' 2>/dev/null)
[ -n "$SESSION_ID" ] || exit 0

REGISTER=.plans/OBLIGATIONS.md

# Silencer 1 — neither parking place exists: no register file AND no ledger
# with a `## Closing` section. Pre-grammar repos stay silent by construction.
# Masked-mutation note (the compact-resume F2 precedent): REMOVING this guard
# is invisible to the harness because silencer 2 also silences the no-parking-
# place case (both counts are 0) — the layering is deliberate, an early exit
# that spares pre-grammar repos the counting pass; only its INVERSION is
# harness-killable. Don't judge this guard's coverage by removal-survival.
HAS_PLACE=0
[ -f "$REGISTER" ] && HAS_PLACE=1
if [ "$HAS_PLACE" -eq 0 ]; then
  for f in .plans/*.state.md; do
    [ -f "$f" ] || continue
    if grep -q '^## Closing' "$f" 2>/dev/null; then HAS_PLACE=1; break; fi
  done
fi
[ "$HAS_PLACE" -eq 1 ] || exit 0

# Register count: unticked OB rows only. `grep -c` prints 0 on no match; guard
# non-numeric output anyway (unreadable file yields "" under 2>/dev/null).
REG_COUNT=0
if [ -f "$REGISTER" ]; then
  REG_COUNT=$(grep -c '^- \[ \] OB-' "$REGISTER" 2>/dev/null)
  case "$REG_COUNT" in '' | *[!0-9]*) REG_COUNT=0 ;; esac
fi

# Closing count: unticked rows INSIDE a `## Closing` section only — any other
# `## ` heading closes the section, so checklist beats never count. [~] rows
# are promoted/parked (their copy lives in the register) and [x] rows fired;
# only `[ ]` is "due here".
CLO_COUNT=0
for f in .plans/*.state.md; do
  [ -f "$f" ] || continue
  n=$(awk '/^## /{c=($0 ~ /^## Closing[ \t]*$/)} c && /^- \[ \]/{n++} END{print n+0}' "$f" 2>/dev/null)
  case "$n" in '' | *[!0-9]*) n=0 ;; esac
  CLO_COUNT=$((CLO_COUNT + n))
done

# Silencer 2 — nothing unticked, nothing to say.
[ $((REG_COUNT + CLO_COUNT)) -gt 0 ] || exit 0

# The oldest unticked row: the register is append-only (rows are never
# deleted), so its first unticked row is the longest-waiting obligation; only
# when the register has none does the first unticked Closing row stand in.
OLDEST=""
if [ -f "$REGISTER" ]; then
  OLDEST=$(grep -m1 '^- \[ \] OB-' "$REGISTER" 2>/dev/null)
fi
if [ -z "$OLDEST" ]; then
  for f in .plans/*.state.md; do
    [ -f "$f" ] || continue
    OLDEST=$(awk '/^## /{c=($0 ~ /^## Closing[ \t]*$/)} c && /^- \[ \]/{print; exit}' "$f" 2>/dev/null)
    [ -n "$OLDEST" ] && break
  done
fi

# Silencer 3 — once per session. session_id lands in a path, so sanitize it
# (never trust stdin); marker creation failure degrades to re-advising, never
# to a non-zero exit. Written only here, after the content silencers, so a
# silent dispatch never burns the session's one advisory.
SID=$(printf '%s' "$SESSION_ID" | tr -c 'A-Za-z0-9._-' '_')
MARK="${TMPDIR:-/tmp}/obligations-due-${SID}"
[ -e "$MARK" ] && exit 0
: > "$MARK" 2>/dev/null || true

# The advisory: ≤3 lines (OQ3 cap). The oldest row is repo text — bounded to
# 140 CHARACTERS via jq's codepoint slicing (printf '%.140s' is bytes on both
# GNU and BSD and can split a multibyte char, leaving invalid UTF-8 in the
# JSON) and passed through `jq --arg` (JSON-escaped, never executed). jq is
# proven present by the session_id parse above; a failure here still degrades
# to an empty Oldest line, never a non-zero exit.
OLDEST_SHORT=$(printf '%s' "$OLDEST" | jq -Rr '.[0:140]' 2>/dev/null)
MSG="📌 Deferred obligations may be due — ${REG_COUNT} register row(s) in .plans/OBLIGATIONS.md + ${CLO_COUNT} mission-ledger \`## Closing\` row(s) still unticked.
Oldest: ${OLDEST_SHORT}
Grep-only advisory (no conditions were probed) — run /agentic-workflow:settle to probe each row and fire what's due."
jq -n --arg m "$MSG" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$m}}' 2>/dev/null
exit 0
