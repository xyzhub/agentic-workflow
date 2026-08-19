#!/usr/bin/env bash
# handoff-budget nudge (UserPromptSubmit) — when the transcript's byte count
# crosses a band, nudge ONCE per band per session to write/refresh
# docs/product/session-handoff.md before compaction takes the window.
#
# Why this exists: compaction is rare but catastrophic (the observed one
# collapsed 999,816 → 82,009 window tokens in a step), and OUTSIDE a mission
# there is no ledger to re-hydrate from — the handoff file is the only durable
# record. This hook is the WRITE trigger for that record; compact-resume.sh is
# the read side. It is a nudge to an agent, not a measurement instrument.
#
# Contract (OQ4 human-locked, OQ7):
#   - ADVISORY ONLY: a ≤3-line stdout nudge (UserPromptSubmit convention, like
#     the router and thread-keeper); NEVER blocks; ALWAYS exit 0 on every path,
#     including missing/empty transcript_path or session_id, an unreadable
#     transcript, and missing jq (the parse then yields "" and the guard exits).
#   - Exactly four silencers, all mechanical — a human must be able to predict
#     every firing. If it still nags, RAISE THE BANDS; never add conditions:
#       1. at most two bands (advisory, urgent); below ADVISORY_BYTES, silence;
#       2. one firing per band per session — a marker file under $TMPDIR keyed
#          by session_id (no repo state, nothing to .gitignore);
#       3. silent when docs/product/session-handoff.md is FRESHER than the band
#          crossing — proxied as handoff mtime newer than the transcript's: the
#          transcript's last append is the latest possible moment the crossing
#          happened, so `handoff -nt transcript` proves the handoff postdates
#          it. An older handoff still gets the nudge; under-silencing (firing
#          early) is the safe direction for a capped one-shot advisory;
#       4. silent when an ACTIVE mission ledger exists (OQ7) — mission sessions
#          already have the mission-budget, beat-enforcer and compact-resume.
#          Selection is the mission-budget hook's predicate VERBATIM (newest-mtime
#          .plans/*.state.md with an open [ ]/[~] beat) so the two hooks can
#          never disagree about what "active" means.
#
# stdin: the hook event JSON. cwd: the project dir (reads .plans/ and
# docs/product/session-handoff.md relatively).

# Bands — taken VERBATIM from the mission ledger's `## 📊 S2 THRESHOLD BLOCK`
# (.plans/compaction-continuity.state.md, 2026-08-10): the corpus held exactly
# ONE observed compaction (transcript 2fa752c7…, record at 6,727,626 bytes into
# the file); bands are 55% / 80% of that point, floored. Caveats that ride with
# the numbers, not just beside them:
#   - n = 1 — one compaction, one session, one operator, one model/window
#     config. A single anchor, NOT a distribution.
#   - transcript BYTES are a loose CUMULATIVE proxy, not a token measurement:
#     the file accumulates tool results, JSON envelope and already-evicted
#     content (≈6.73 transcript-bytes per window-token at the anchor — never
#     present these as token math).
#   - the point is window/model/config-dependent: if compaction behavior
#     changes upstream, RE-MEASURE from a fresh corpus — do not scale.
ADVISORY_BYTES=3700000  # 0.55 × 6,727,626 = 3,700,194 → floored (S2 block)
URGENT_BYTES=5380000    # 0.80 × 6,727,626 = 5,382,101 → floored (S2 block)

INPUT=$(cat)

# Both fields are required; missing jq leaves them empty. Fail SILENT and 0 —
# a budget nudge must never be able to break a prompt.
TRANSCRIPT=$(printf '%s' "$INPUT" | jq -r '.transcript_path // ""' 2>/dev/null)
SESSION_ID=$(printf '%s' "$INPUT" | jq -r '.session_id // ""' 2>/dev/null)
[ -n "$TRANSCRIPT" ] || exit 0
[ -n "$SESSION_ID" ] || exit 0
[ -f "$TRANSCRIPT" ] && [ -r "$TRANSCRIPT" ] || exit 0

# The ONLY signal: cumulative transcript size. Guard non-numeric output.
BYTES=$(wc -c < "$TRANSCRIPT" 2>/dev/null | tr -d '[:space:]')
case "$BYTES" in '' | *[!0-9]*) exit 0 ;; esac

# Silencer 1 — at most two bands; below advisory there is nothing to say.
if [ "$BYTES" -ge "$URGENT_BYTES" ]; then BAND=urgent
elif [ "$BYTES" -ge "$ADVISORY_BYTES" ]; then BAND=advisory
else exit 0
fi

# Silencer 4 — an active mission ledger exists (OQ7). Mission-budget (ex thread-keeper) predicate
# verbatim: newest-mtime .plans/*.state.md that still has an open [ ]/[~] beat.
if [ -d .plans ]; then
  LEDGER=$(ls -t .plans/*.state.md 2>/dev/null | while IFS= read -r f; do
    if grep -qE '^- \[( |~)\]' "$f"; then printf '%s' "$f"; break; fi
  done)
  [ -n "$LEDGER" ] && exit 0
fi

# Silencer 3 — the handoff already postdates the band crossing (see header).
HANDOFF=docs/product/session-handoff.md
if [ -f "$HANDOFF" ] && [ "$HANDOFF" -nt "$TRANSCRIPT" ]; then exit 0; fi

# Silencer 2 — one firing per band per session. session_id lands in a path, so
# sanitize it (never trust stdin); marker creation failure degrades to re-nudging,
# never to a non-zero exit.
SID=$(printf '%s' "$SESSION_ID" | tr -c 'A-Za-z0-9._-' '_')
MARK="${TMPDIR:-/tmp}/handoff-budget-${SID}.${BAND}"
[ -e "$MARK" ] && exit 0
: > "$MARK" 2>/dev/null || true

# The nudge: ≤3 lines per band (OQ4 cap), fixed text + a numeric byte count —
# no untrusted value is interpolated, and stdout here is context, never code.
if [ "$BAND" = urgent ]; then
  echo "🚨 Handoff budget URGENT — transcript at ${BYTES} bytes, past ~80% of the one observed compaction point (n=1; bytes are a loose cumulative proxy, not tokens)."
  echo "Refresh docs/product/session-handoff.md NOW — state, next step, verify signal — before compaction takes the window."
else
  echo "📝 Handoff budget — transcript at ${BYTES} bytes, past ~55% of the one observed compaction point (n=1; bytes are a loose cumulative proxy, not tokens)."
  echo "Write or refresh docs/product/session-handoff.md soon, while the window still holds the intent."
fi
exit 0
