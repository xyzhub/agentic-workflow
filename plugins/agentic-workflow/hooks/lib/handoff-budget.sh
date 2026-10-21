#!/usr/bin/env bash
# handoff-budget nudge (UserPromptSubmit) — when the context crosses a band,
# nudge ONCE per band per session to write/refresh the session handoff before
# compaction takes the window.
#
# Why this exists: compaction is rare but catastrophic (the observed one
# collapsed 999,816 → 82,009 window tokens in a step), and OUTSIDE a mission
# there is no ledger to re-hydrate from — the handoff file is the only durable
# record. This hook is the advisory WRITE trigger for that record; at the urgent
# band handoff-gate.sh (PreToolUse) enforces it, pre-compact.sh snapshots it, and
# compact-resume.sh is the read side. It is a nudge, not a measurement instrument.
#
# Signal (precompact-handoff AC-4, v1.68.0) — hl_band in handoff-lib.sh:
#   - TOKENS when readable: the last non-sidechain assistant `usage` in the
#     transcript tail, against the auto-compact point (CLAUDE_CODE_AUTO_COMPACT_WINDOW
#     × CLAUDE_AUTOCOMPACT_PCT_OVERRIDE, else the lib's named defaults); advisory
#     ≥70 %, urgent ≥85 %. The token nudge names tokens and the percentage.
#   - BYTES otherwise (no jq, no usage line, shape drift): the byte bands below and
#     the two original nudge texts, byte-identical.
#
# Contract (OQ4 human-locked, OQ7):
#   - ADVISORY ONLY: a ≤3-line stdout nudge (UserPromptSubmit convention, like
#     the router and thread-keeper); NEVER blocks; ALWAYS exit 0 on every path,
#     including missing/empty transcript_path or session_id, an unreadable
#     transcript, and missing jq (the parse then yields "" and the guard exits).
#   - Exactly four silencers, all mechanical — a human must be able to predict
#     every firing. If it still nags, RAISE THE BANDS; never add conditions:
#       1. at most two bands (advisory, urgent); below advisory, silence;
#       2. one firing per band per session — a marker keyed by session_id in the
#          private state dir (inside the git dir, or the XDG dir outside a repo;
#          nothing to .gitignore);
#       3. silent when the handoff is FRESHER than the band crossing. Token path:
#          hl_fresh (this session's handoff-gate marker — written only by a
#          Write/Edit to the local handoff — within 10 % of the threshold).
#          Byte path: docs/product/session-handoff.md mtime newer than the
#          transcript's — the transcript's last append is the latest possible
#          moment the crossing happened, so `handoff -nt transcript` proves the
#          handoff postdates it; under-silencing (firing early) is the safe
#          direction for a capped one-shot advisory;
#       4. silent when an ACTIVE mission ledger exists (OQ7) — mission sessions
#          already have the mission-budget, beat-enforcer and compact-resume.
#          Selection is the mission-budget hook's predicate VERBATIM (newest-mtime
#          .plans/*.state.md with an open [ ]/[~] beat) so the two hooks can
#          never disagree about what "active" means.
#
# stdin: the hook event JSON. cwd: the project dir (reads .plans/ and
# docs/product/session-handoff.md relatively).

# Byte bands (the fallback) — taken VERBATIM from the mission ledger's
# `## 📊 S2 THRESHOLD BLOCK`
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
[ "${AGENTIC_WORKFLOW_CHILD:-0}" = 1 ] && exit 0 # a claude-p child (run-claude.mjs): silent

ADVISORY_BYTES=3700000  # 0.55 × 6,727,626 = 3,700,194 → floored (S2 block)
URGENT_BYTES=5380000    # 0.80 × 6,727,626 = 5,382,101 → floored (S2 block)

. "$(dirname "${BASH_SOURCE[0]}")/handoff-lib.sh"
HL_ADVISORY_BYTES=$ADVISORY_BYTES HL_URGENT_BYTES=$URGENT_BYTES

INPUT=$(cat)

# Both fields are required; missing jq leaves them empty. Fail SILENT and 0 —
# a budget nudge must never be able to break a prompt.
TRANSCRIPT=$(printf '%s' "$INPUT" | jq -r '.transcript_path // ""' 2>/dev/null)
SESSION_ID=$(printf '%s' "$INPUT" | jq -r '.session_id // ""' 2>/dev/null)
[ -n "$TRANSCRIPT" ] || exit 0
[ -n "$SESSION_ID" ] || exit 0
[ -f "$TRANSCRIPT" ] && [ -r "$TRANSCRIPT" ] || exit 0

# The signal: tokens when readable, else cumulative transcript bytes (hl_band).
read -r BAND SIZE UNIT <<< "$(hl_band "$TRANSCRIPT")"
case "$SIZE" in '' | *[!0-9]*) exit 0 ;; esac
BYTES=$SIZE

# Silencer 1 — at most two bands; below advisory there is nothing to say.
case "$BAND" in urgent | advisory) ;; *) exit 0 ;; esac

# Silencer 4 — an active mission ledger exists (OQ7), per the shared predicate
# (active-ledger.sh) that mission-budget and the beat-enforcers also source.
if [ -d .plans ]; then
  . "$(dirname "${BASH_SOURCE[0]}")/active-ledger.sh"
  LEDGER=$(active_ledger)
  [ -n "$LEDGER" ] && exit 0
fi

# Silencer 3 — the handoff already postdates the band crossing (see header).
SID=$(printf '%s' "$SESSION_ID" | tr -c 'A-Za-z0-9._-' '_')
if [ "$UNIT" = tokens ]; then
  hl_paths && hl_state_init && hl_fresh "$SID" "$SIZE" tokens && exit 0
else
  HANDOFF=docs/product/session-handoff.md
  if [ -f "$HANDOFF" ] && [ "$HANDOFF" -nt "$TRANSCRIPT" ]; then exit 0; fi
fi

# Silencer 2 — one firing per band per session. session_id lands in a path, so
# sanitize it (never trust stdin); marker creation failure degrades to re-nudging,
# never to a non-zero exit.
# The marker lives in the private state dir (handoff-lib.sh: 0700, no symlink,
# owner-checked, tmp + mv) — never the shared $TMPDIR.
MARK=""
if [ -z "$HL_DIR" ]; then hl_paths; fi
if hl_state_init && MARK=$(hl_mark "$SID" "budget-$BAND"); then
  [ -e "$MARK" ] && exit 0
  hl_mput "$MARK" "" || true
fi

# The nudge: ≤3 lines per band (OQ4 cap), fixed text + numeric counts — no
# untrusted value is interpolated, and stdout here is context, never code.
if [ "$UNIT" = tokens ]; then
  THR=$(hl_threshold)
  if [ "$BAND" = urgent ]; then
    echo "🚨 Handoff budget URGENT — context at ${SIZE} tokens, past ${HL_URGENT_PCT}% of the ${THR}-token auto-compact point."
    echo "Run /agentic-workflow:handoff NOW — inside a git repo the handoff gate refuses other tool calls until this session writes it."
  else
    echo "📝 Handoff budget — context at ${SIZE} tokens, past ${HL_ADVISORY_PCT}% of the ${THR}-token auto-compact point."
    echo "Run /agentic-workflow:handoff soon, while the window still holds the intent."
  fi
elif [ "$BAND" = urgent ]; then
  echo "🚨 Handoff budget URGENT — transcript at ${BYTES} bytes, past ~80% of the one observed compaction point (n=1; bytes are a loose cumulative proxy, not tokens)."
  echo "Refresh docs/product/session-handoff.md NOW — state, next step, verify signal — before compaction takes the window."
else
  echo "📝 Handoff budget — transcript at ${BYTES} bytes, past ~55% of the one observed compaction point (n=1; bytes are a loose cumulative proxy, not tokens)."
  echo "Write or refresh docs/product/session-handoff.md soon, while the window still holds the intent."
fi
exit 0
