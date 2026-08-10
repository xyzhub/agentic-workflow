#!/usr/bin/env bash
# post-compaction re-read directive (D8, SessionStart:compact) — after the
# context window is compacted, point the agent at the best surviving DURABLE
# record instead of letting it continue from a summary of a summary.
#
# Why this exists: measured on a real 596-request session, compaction fires
# rarely (once) but catastrophically — the window collapsed 999,816 → 82,009
# tokens in a single step (−91.8%). Nothing in the protocol tells the
# post-compaction agent to re-hydrate from the record, so it resumes from a
# lossy summary. This is a CORRECTNESS backstop, not a token lever.
#
# Contract:
#   - Registered in hooks.json under SessionStart with matcher `compact` and
#     NOTHING else — never `startup`, never `resume`.
#   - Defence in depth: also reads stdin and stays silent when `.source` is
#     present and is not `compact` (so a mis-dispatch can't nag on every new
#     session). A MISSING `.source` still fires — the matcher already gated it.
#   - THREE branches after a compaction — never silence (OQ6, human-locked:
#     silence WAS the bug this phase fixes):
#       1. ACTIVE LEDGER — newest-mtime .plans/*.state.md with an open [ ]/[~]
#          beat (predicate identical to beat-enforcer-stop.sh by design) →
#          the original re-read directive, byte-for-byte unchanged.
#       2. NO ledger, docs/product/session-handoff.md EXISTS → re-read it
#          VERBATIM, with freshness stated IN the directive (OQ5: currency is
#          judged against the transcript, never the clock). Freshness source,
#          in preference order (S6):
#            a. the handoff's `_Written: <ISO-8601> · session <id> · branch <b>_`
#               provenance stamp — CONTENT survives the file copies and
#               checkouts that perturb mtime, so a parseable stamp beats the
#               mtime proxy. CURRENT only when the stamp's timestamp (exact
#               shape YYYY-MM-DDTHH:MM:SSZ, converted by jq, never the shell)
#               is newer than the transcript's mtime.
#            b. no stamp, or a malformed/unparseable one → the S5 mtime proxy,
#               byte-identical: CURRENT only when the handoff's mtime is newer
#               than the transcript's — the last append is the latest possible
#               moment a budget-band crossing happened (the same conservative
#               proxy as handoff-budget.sh, disclosed at ckpt-p1).
#          Everything else — older stamp/handoff, missing or unreadable
#          `transcript_path` — reads SUSPECT: verify against git log/git status
#          before trusting its Next. The directive states WHY it is suspect
#          (F3, ckpt-p2): STALE (the transcript was readable and the signal is
#          older than its last append) vs UNPROVABLE (no readable transcript,
#          so no comparison was ever made — the directive must not assert one).
#          A stale handoff is NEVER presented as current; fail closed toward
#          suspect. A malformed stamp NEVER errors — it falls back, and every
#          path still exits 0.
#       3. NEITHER (OQ6, human-locked) → a distinct directive naming
#          `git log -5`, `git status`, `.remember/now.md`, telling the agent to
#          TELL THE HUMAN the record is missing — and NOT to author a handoff on
#          the spot (right after losing context is the worst moment to write
#          state).
#   - Every directive is ≤6 lines, emitted via
#     hookSpecificOutput.additionalContext, built with `jq -n --arg` so every
#     interpolated value is JSON-escaped, never executed. ALWAYS exit 0 —
#     NEVER exit 2.
#
# stdin: the hook event JSON. cwd: the project dir (reads .plans/ and
# docs/product/session-handoff.md relatively).

INPUT=$(cat)

# Only after a compaction. An absent `.source` is treated as compact because the
# hooks.json matcher already restricted us; a PRESENT non-compact source means we
# were dispatched wrongly, and a startup/resume/clear nag would be noise.
SOURCE=$(printf '%s' "$INPUT" | jq -r '.source // ""' 2>/dev/null)
if [ -n "$SOURCE" ] && [ "$SOURCE" != "compact" ]; then
  exit 0
fi

# Active ledger: newest-mtime .plans/*.state.md that still has an open [ ]/[~] beat
# (a parked [~] ledger is still the active mission, so it is picked over an older
# abandoned one). Identical to beat-enforcer-stop.sh by design. A missing .plans/
# just yields no ledger — the fallback branches below take over.
LEDGER=$(ls -t .plans/*.state.md 2>/dev/null | while IFS= read -r f; do
  if grep -qE '^- \[( |~)\]' "$f"; then printf '%s' "$f"; break; fi
done)

HANDOFF=docs/product/session-handoff.md

if [ -n "$LEDGER" ]; then
  # Branch 1 — active mission: the ledger is the richer record. Byte-for-byte
  # the pre-P2 directive; ckpt-p2 diff-checks this against the pre-phase hook.
  MSG="♻️ Context was just COMPACTED — what you hold now is a summary, not the record.
Before anything else, re-read these VERBATIM (do not resume from the summary):
  1. $LEDGER — phase, \`Next up:\`, open beats, Deviations, and \`## Standing steers\` (honor them).
  2. docs/product/session-handoff.md — the last session handoff, if it exists.
Then re-state the current brief's remaining Do/Verify items before continuing."
elif [ -f "$HANDOFF" ]; then
  # Branch 2 — no mission, but a handoff exists. State its freshness in the
  # directive itself (OQ5): current ONLY when provably newer than the
  # transcript's last append; otherwise suspect — never silently trusted.
  TRANSCRIPT=$(printf '%s' "$INPUT" | jq -r '.transcript_path // ""' 2>/dev/null)
  FRESH=suspect
  # WHY the suspicion (F3, ckpt-p2): `unprovable` until a readable transcript
  # exists to compare against — only then can SUSPECT honestly mean `stale`
  # (older than the transcript's last append). The two directives below state
  # the matching reason; the operative instruction is identical in both.
  SUSPECT_WHY=unprovable
  if [ -n "$TRANSCRIPT" ] && [ -f "$TRANSCRIPT" ]; then
    SUSPECT_WHY=stale
    # Preferred source (S6): the `_Written:` provenance stamp. Defensive parse —
    # first `_Written: ` line, second field only, accepted ONLY in the exact
    # YYYY-MM-DDTHH:MM:SSZ shape, converted to epoch by jq (`fromdateiso8601`),
    # never evaluated by the shell. Anything else (absent line, garbage,
    # metacharacters, jq failure) leaves STAMP_EPOCH empty and falls through to
    # the S5 mtime proxy — malformed stamps fall back, they never error.
    STAMP_EPOCH=""
    STAMP_ISO=$(grep -m1 '^_Written: ' "$HANDOFF" 2>/dev/null | cut -d' ' -f2)
    # F2 (ckpt-p2, note-only): mutations to this shape-gate regex are MASKED downstream — jq's `fromdateiso8601` and the numeric `case` guard reject what a loosened regex lets through; all three layers are deliberate, so don't judge the regex's coverage by mutation survival alone.
    if printf '%s' "$STAMP_ISO" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$'; then
      STAMP_EPOCH=$(jq -rn --arg t "$STAMP_ISO" '$t | fromdateiso8601' 2>/dev/null)
      case "$STAMP_EPOCH" in ''|*[!0-9]*) STAMP_EPOCH="" ;; esac
    fi
    T_MTIME=""
    if [ -n "$STAMP_EPOCH" ]; then
      # BSD stat first (macOS), GNU stat second; a machine where both fail
      # leaves T_MTIME empty and drops to the mtime proxy below.
      T_MTIME=$(stat -f %m "$TRANSCRIPT" 2>/dev/null || stat -c %Y "$TRANSCRIPT" 2>/dev/null)
      case "$T_MTIME" in ''|*[!0-9]*) T_MTIME="" ;; esac
    fi
    if [ -n "$STAMP_EPOCH" ] && [ -n "$T_MTIME" ]; then
      # Stamp path: the stamp beats mtime because copies/checkouts perturb
      # mtime but not content. Strictly newer than the transcript's last
      # append ⇒ the handoff postdates any budget-band crossing.
      if [ "$STAMP_EPOCH" -gt "$T_MTIME" ]; then FRESH=current; fi
    elif [ "$HANDOFF" -nt "$TRANSCRIPT" ]; then
      # Fallback: the S5 mtime proxy, behavior byte-identical to pre-S6.
      FRESH=current
    fi
  fi
  if [ "$FRESH" = current ]; then
    MSG="♻️ Context was just COMPACTED — what you hold now is a summary, not the record.
No active mission ledger; the durable record is docs/product/session-handoff.md.
Freshness: CURRENT — written after the transcript's last append, so it postdates any budget-band crossing (currency is judged against the transcript, never the clock).
Re-read it VERBATIM (do not resume from the summary), then continue from its **Next** line."
  elif [ "$SUSPECT_WHY" = stale ]; then
    # SUSPECT because PROVEN stale: the transcript was readable and the chosen
    # freshness signal is older than its last append.
    MSG="♻️ Context was just COMPACTED — what you hold now is a summary, not the record.
No active mission ledger; the last durable record is docs/product/session-handoff.md.
Freshness: SUSPECT — it is OLDER than the transcript's last append, so it may predate the last compaction/band crossing; work may have happened after it was written.
Re-read it VERBATIM, but do NOT trust its **Next** yet: verify against \`git log\` and \`git status\` first — treat the handoff as a lead, not the truth."
  else
    # SUSPECT because UNPROVABLE (F3): no readable transcript, so no age
    # comparison was ever made — asserting "older" here would be a false claim.
    # Same operative instruction as the stale text; only the reason differs.
    MSG="♻️ Context was just COMPACTED — what you hold now is a summary, not the record.
No active mission ledger; the last durable record is docs/product/session-handoff.md.
Freshness: SUSPECT — UNPROVABLE: the transcript is missing or unreadable, so the handoff's age could not be judged against its last append; assume work may have happened after it was written.
Re-read it VERBATIM, but do NOT trust its **Next** yet: verify against \`git log\` and \`git status\` first — treat the handoff as a lead, not the truth."
  fi
else
  # Branch 3 — neither record exists (OQ6, human-locked): name the ground
  # truth, surface the gap to the human, and forbid authoring state right now.
  MSG="♻️ Context was just COMPACTED — what you hold now is a summary, not the record.
No mission ledger and no docs/product/session-handoff.md — there is NO durable record to re-hydrate from.
Reconstruct from ground truth only: \`git log -5\`, \`git status\`, and \`.remember/now.md\` (if present).
Tell the human the record is missing before continuing — do NOT proceed on the compaction summary alone, and do NOT author a handoff now (right after losing context is the worst moment to write state)."
fi

jq -n --arg m "$MSG" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$m}}' 2>/dev/null
exit 0
