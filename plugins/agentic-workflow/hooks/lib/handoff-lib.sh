#!/usr/bin/env bash
# handoff-lib — the shared functions behind pre-compact.sh (PreCompact),
# handoff-gate.sh (PreToolUse), handoff-budget.sh (UserPromptSubmit) and
# compact-resume.sh (SessionStart:compact). Functions and constants only;
# sourcing it has no side effects (like active-ledger.sh).
#
# Contract (precompact-handoff, v1.68.0):
#   hl_paths              → sets HL_HANDOFF (canonical local handoff path), HL_DIR,
#                           HL_SNAPDIR and HL_GIT (1 = resolved inside a git work
#                           tree). Local handoff = `git rev-parse --git-path
#                           agentic-workflow/session-handoff.md`, canonicalised
#                           (`cd … && pwd -P`, never a string compare — --git-path
#                           is relative in the main worktree, absolute in linked
#                           ones). Outside a work tree (no repo, bare repo, removed
#                           worktree) → ${XDG_STATE_HOME:-$HOME/.local/state}/
#                           agentic-workflow/<cwd basename>/ with HL_GIT=0 (the
#                           hard gates never engage); all empty when neither works.
#   hl_canon PATH         → canonical absolute spelling (nearest existing ancestor
#                           resolved with pwd -P; missing tail components appended).
#   hl_tokens TRANSCRIPT  → context tokens in use: the LAST non-sidechain
#                           `assistant` line's .message.usage (input_tokens +
#                           cache_read_input_tokens + cache_creation_input_tokens)
#                           within the transcript's last 256 KiB; empty on ANY
#                           failure (no jq, no usage line, shape drift).
#   hl_threshold          → the auto-compact point in tokens:
#                           CLAUDE_CODE_AUTO_COMPACT_WINDOW (else HL_DEFAULT_WINDOW)
#                           × CLAUDE_AUTOCOMPACT_PCT_OVERRIDE (else HL_DEFAULT_PCT) / 100.
#   hl_unit_threshold U   → tokens: hl_threshold; bytes: HL_URGENT_BYTES × 100 / 85.
#   hl_band TRANSCRIPT    → "band size unit": band none|advisory|urgent; tokens
#                           when readable (advisory ≥ 70 %, urgent ≥ 85 % of the
#                           threshold), else bytes against the byte bands.
#   hl_fresh SID CUR UNIT → 0 when THIS session's `.handoff` marker exists (written
#                           ONLY by handoff-gate on a Write/Edit to HL_HANDOFF), the
#                           file exists with a `_Written:` line, and CUR − the
#                           recorded size ≤ 10 % of the threshold in the same unit.
#                           Never the transcript-mtime proxy (A1: writing the
#                           handoff appends to the transcript, so that proxy deadlocks).
#   hl_redact             → stdin → stdout with obvious secret shapes → [redacted].
#   hl_stamp_epoch FILE   → epoch of the first `_Written: <YYYY-MM-DDTHH:MM:SSZ>`
#                           line (jq fromdateiso8601), else empty.
#   hl_mtime FILE         → mtime epoch, GNU stat first (see compact-resume.sh).
#   hl_snapshot SID TRIGGER TRANSCRIPT → writes HL_SNAPDIR/<SID>.md (0600, tmp + mv),
#                           prints its path; facts only (worktrees, ledger, PRs,
#                           last 5 user requests, last assistant text), redacted.
#   Markers (per session, sanitised session_id; NONE when session_id is empty)
#   live in a private state dir, HL_STATE = $HL_DIR/state (per worktree inside
#   the git dir; the XDG dir outside a repo) — never the shared $TMPDIR.
#   hl_state_init makes it 0700 and refuses a symlinked or foreign-owned dir;
#   hl_mark refuses a symlinked or foreign-owned marker; hl_mput writes tmp + mv,
#   never `>` onto the final path:
#     <sid>.band          "band size_at_parse unit blocks size" — the band cache,
#                         rewritten on every re-parse;
#     <sid>.handoff       "handoff_epoch handoff_size unit" — the handoff
#                         evidence; a re-parse never writes it;
#     <sid>.budget-<band> handoff-budget's once-per-band marker.
#   hl_state_fast → the same state dir found WITHOUT spawning git (walks up for
#                   .git); used only to read the gate's cached band.
# externals: cat git grep sed head tail tr cut wc mkdir dirname stat mv rm date mktemp chmod pwd sleep ls jq gh
#
# Verified transcript shape (2026-10-20, Claude Code 2.1.x): assistant lines are
# {"type":"assistant","isSidechain":false,"message":{"usage":{"input_tokens":2,
# "cache_creation_input_tokens":1413,"cache_read_input_tokens":175583,…}}}; user
# lines are {"type":"user","message":{"content":<string>|[{"type":"text"|
# "tool_result",…}]}} — a tool_result array is a tool echo, not a request; isMeta
# lines are skipped. Any other shape → byte fallback, never an error.

HL_DEFAULT_WINDOW=1000000 # Assumed (fails toward NOT blocking); OB-32 confirms
HL_DEFAULT_PCT=95         # Assumed; OB-32 confirms
HL_ADVISORY_PCT=70
HL_URGENT_PCT=85
HL_ADVISORY_BYTES=3700000 # = handoff-budget.sh ADVISORY_BYTES (harness pins both)
HL_URGENT_BYTES=5380000   # = handoff-budget.sh URGENT_BYTES
HL_TAIL_BYTES=262144      # token parse reads at most the last 256 KiB
HL_REPARSE_BYTES=65536    # the gate re-parses only after ≥ 64 KiB of growth
HL_FAIL_OPEN=6            # the 6th consecutive block degrades to a nudge (5 blocks)

hl_num() { case "$1" in '' | *[!0-9]*) return 1 ;; esac; return 0; }

hl_canon() {
  local p=$1 rest="" d
  [ -n "$p" ] || return 1
  case "$p" in /*) ;; *) p="$PWD/$p" ;; esac
  while :; do
    d=$(dirname "$p")
    if [ -d "$d" ]; then
      d=$(cd "$d" 2>/dev/null && pwd -P) || return 1
      printf '%s/%s%s' "${d%/}" "${p##*/}" "$rest"
      return 0
    fi
    [ "$d" = "$p" ] && return 1
    rest="/${p##*/}$rest"
    p=$d
  done
}

hl_paths() {
  HL_HANDOFF="" HL_DIR="" HL_SNAPDIR="" HL_GIT=0
  local g base
  if [ "$(git rev-parse --is-inside-work-tree 2>/dev/null)" = true ] \
    && [ "$(git rev-parse --is-bare-repository 2>/dev/null)" = false ]; then
    g=$(git rev-parse --git-path agentic-workflow/session-handoff.md 2>/dev/null)
    if [ -n "$g" ] && HL_HANDOFF=$(hl_canon "$g"); then HL_GIT=1; else HL_HANDOFF=""; fi
  fi
  if [ -z "$HL_HANDOFF" ]; then
    base=${XDG_STATE_HOME:-${HOME:+$HOME/.local/state}}
    [ -n "$base" ] || return 1
    HL_HANDOFF="${base%/}/agentic-workflow/$(pwd -P | sed 's#.*/##; s#^$#root#')/session-handoff.md"
  fi
  HL_DIR=$(dirname "$HL_HANDOFF")
  HL_SNAPDIR="$HL_DIR/snapshots"
  return 0
}

hl_sid() { printf '%s' "$1" | tr -c 'A-Za-z0-9._-' '_'; }

hl_state_ok() { [ -d "$1" ] && [ ! -L "$1" ] && [ -O "$1" ]; }

hl_state_init() {
  HL_STATE=""
  [ -n "$HL_DIR" ] && [ ! -L "$HL_DIR" ] || return 1
  [ -L "$HL_DIR/state" ] && return 1
  (umask 077; mkdir -p "$HL_DIR/state") 2>/dev/null || return 1
  hl_state_ok "$HL_DIR/state" || return 1
  chmod 700 "$HL_DIR/state" 2>/dev/null || return 1
  HL_STATE="$HL_DIR/state"
}

hl_state_fast() {
  [ -z "${GIT_DIR:-}" ] || return 1
  local d=$PWD g k
  while :; do
    if [ -d "$d/.git" ]; then g="$d/.git"; break
    elif [ -f "$d/.git" ]; then
      read -r k g 2>/dev/null < "$d/.git" || return 1
      [ "$k" = gitdir: ] && [ -n "$g" ] || return 1
      case "$g" in /*) ;; *) g="$d/$g" ;; esac
      break
    fi
    [ -n "$d" ] || return 1
    d=${d%/*}
  done
  g=$(cd "$g" 2>/dev/null && pwd -P) || return 1
  hl_state_ok "$g/agentic-workflow/state" || return 1
  printf '%s/agentic-workflow/state' "$g"
}

hl_mark() {
  local p
  [ -n "$1" ] && [ -n "$HL_STATE" ] || return 1
  p="$HL_STATE/$1.$2"
  [ -L "$p" ] && return 1
  [ -e "$p" ] && [ ! -O "$p" ] && return 1
  printf '%s' "$p"
}

hl_mput() {
  local tmp
  [ -n "$1" ] && [ -n "$HL_STATE" ] || return 1
  tmp=$(mktemp "$HL_STATE/.m.XXXXXX" 2>/dev/null) || return 1
  printf '%s\n' "$2" > "$tmp" 2>/dev/null && mv -f "$tmp" "$1" 2>/dev/null || { rm -f "$tmp" 2>/dev/null; return 1; }
}

hl_tokens() {
  [ -f "$1" ] && [ -r "$1" ] || return 0
  local t
  t=$(tail -c "$HL_TAIL_BYTES" "$1" 2>/dev/null | jq -Rr '
      fromjson? | select(type == "object" and .type == "assistant" and ((.isSidechain // false) | not))
      | .message.usage | select(type == "object" and (.input_tokens | type) == "number")
      | [.input_tokens, (.cache_read_input_tokens // 0), (.cache_creation_input_tokens // 0)]
      | map(if type == "number" then . else 0 end) | add | floor' 2>/dev/null | tail -1)
  hl_num "$t" && printf '%s' "$t"
}

hl_threshold() {
  local w=${CLAUDE_CODE_AUTO_COMPACT_WINDOW:-} p=${CLAUDE_AUTOCOMPACT_PCT_OVERRIDE:-}
  { hl_num "$w" && [ "$w" -gt 0 ]; } || w=$HL_DEFAULT_WINDOW
  { hl_num "$p" && [ "$p" -gt 0 ] && [ "$p" -le 100 ]; } || p=$HL_DEFAULT_PCT
  printf '%s' $((w * p / 100))
}

hl_unit_threshold() {
  if [ "$1" = tokens ]; then hl_threshold; else printf '%s' $((HL_URGENT_BYTES * 100 / 85)); fi
}

hl_band() {
  local tok thr b
  tok=$(hl_tokens "$1")
  if [ -n "$tok" ]; then
    thr=$(hl_threshold)
    if [ $((tok * 100)) -ge $((thr * HL_URGENT_PCT)) ]; then printf 'urgent %s tokens' "$tok"
    elif [ $((tok * 100)) -ge $((thr * HL_ADVISORY_PCT)) ]; then printf 'advisory %s tokens' "$tok"
    else printf 'none %s tokens' "$tok"
    fi
    return 0
  fi
  b=$(wc -c < "$1" 2>/dev/null | tr -d '[:space:]')
  hl_num "$b" || return 1
  if [ "$b" -ge "$HL_URGENT_BYTES" ]; then printf 'urgent %s bytes' "$b"
  elif [ "$b" -ge "$HL_ADVISORY_BYTES" ]; then printf 'advisory %s bytes' "$b"
  else printf 'none %s bytes' "$b"
  fi
}

hl_fresh() {
  local sid=$1 cur=$2 unit=$3 he hs hu thr m
  [ -n "$HL_HANDOFF" ] && [ -f "$HL_HANDOFF" ] || return 1
  grep -q '^_Written: ' "$HL_HANDOFF" 2>/dev/null || return 1
  m=$(hl_mark "$sid" handoff) || return 1
  read -r he hs hu 2>/dev/null < "$m" || return 1
  hl_num "$he" && hl_num "$hs" || return 1
  hl_num "$cur" || return 0 # no current measure to compare: the marker + file suffice
  # Unit drift (marker in tokens, now bytes, or back): the sizes are not
  # comparable — fail toward NOT blocking; the marker + stamped file suffice.
  [ "$hu" = "$unit" ] || return 0
  thr=$(hl_unit_threshold "$unit")
  [ $((cur - hs)) -le $((thr / 10)) ]
}

hl_redact() {
  sed -E \
    -e 's/(^|[^A-Za-z0-9_])sk-[A-Za-z0-9_-]{8,}/\1[redacted]/g' \
    -e 's/(^|[^A-Za-z0-9_])gh[pousr]_[A-Za-z0-9_]{8,}/\1[redacted]/g' \
    -e 's/github_pat_[A-Za-z0-9_]{8,}/[redacted]/g' \
    -e 's/AKIA[A-Z0-9]{16}/[redacted]/g' \
    -e 's/xox[abpr]-[A-Za-z0-9-]{8,}/[redacted]/g' \
    -e 's/[Bb][Ee][Aa][Rr][Ee][Rr] [^ ]+/[redacted]/g' \
    -e 's/-----BEGIN [A-Z0-9 ]*-----.*/[redacted]/'
}

hl_stamp_epoch() {
  local iso ep
  iso=$(grep -m1 '^_Written: ' "$1" 2>/dev/null | cut -d' ' -f2)
  printf '%s' "$iso" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$' || return 0
  ep=$(jq -rn --arg t "$iso" '$t | fromdateiso8601' 2>/dev/null)
  hl_num "$ep" && printf '%s' "$ep"
}

hl_mtime() {
  local m
  m=$(stat -c %Y "$1" 2>/dev/null || stat -f %m "$1" 2>/dev/null)
  hl_num "$m" && printf '%s' "$m"
}

# Open PRs by @me, bounded: gh runs as a background job killed after
# HL_GH_WAIT seconds (default 3; no timeout(1) on macOS), prompts disabled.
hl_prs() {
  local out pid i=0 lim=$((${HL_GH_WAIT:-3} * 10))
  command -v gh >/dev/null 2>&1 && [ "$HL_GIT" = 1 ] || { echo "- unavailable"; return 0; }
  out=$(mktemp "${TMPDIR:-/tmp}/hl-gh.XXXXXX" 2>/dev/null) || { echo "- unavailable"; return 0; }
  GH_PROMPT_DISABLED=1 GH_NO_UPDATE_NOTIFIER=1 \
    gh pr list --author @me --state open --json number,title,headRefName > "$out" 2>/dev/null < /dev/null &
  pid=$!
  while kill -0 "$pid" 2>/dev/null && [ "$i" -lt "$lim" ]; do sleep 0.1; i=$((i + 1)); done
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; echo "- unavailable (gh did not answer within ${HL_GH_WAIT:-3} s)"
  elif wait "$pid" && jq -e 'type == "array"' "$out" >/dev/null 2>&1; then
    jq -r 'if length == 0 then "- none open" else .[:20][] | "- #\(.number) \(.title) (\(.headRefName))" end' "$out" 2>/dev/null
  else
    echo "- unavailable"
  fi
  rm -f "$out" 2>/dev/null
  return 0
}

hl_snapshot() {
  local sid=$1 trig=$2 tr=$3 now tmp dst ledger wt
  [ -n "$HL_SNAPDIR" ] || return 1
  (umask 077; mkdir -p "$HL_SNAPDIR") 2>/dev/null || return 1
  now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  dst="$HL_SNAPDIR/$sid.md"
  tmp=$(umask 077; mktemp "$HL_SNAPDIR/.snap.XXXXXX" 2>/dev/null) || return 1
  {
    echo "# Pre-compact snapshot — mechanical, not an agent handoff"
    echo
    echo "_Written: ${now} · session ${sid} · trigger ${trig}_"
    echo
    echo "_Facts gathered by a hook without the model. Re-read the agent handoff too: ${HL_HANDOFF}._"
    echo
    echo "## Worktrees"
    echo "- cwd branch: $(git branch --show-current 2>/dev/null || echo unknown)"
    git worktree list --porcelain 2>/dev/null | while read -r k v; do
      case "$k" in
        worktree) wt=$v ;;
        HEAD) h=${v:0:12} ;;
        branch | detached)
          [ "$k" = detached ] && v=detached
          echo "- ${wt} · branch ${v#refs/heads/} · HEAD ${h:-?} · dirty $(git -C "$wt" status --porcelain 2>/dev/null | wc -l | tr -d '[:space:]')" ;;
      esac
    done | head -20
    echo
    echo "## Active ledger"
    ledger=""
    if [ -d .plans ]; then
      . "$(dirname "${BASH_SOURCE[0]}")/active-ledger.sh"
      ledger=$(active_ledger)
    fi
    if [ -n "$ledger" ]; then
      echo "- ${ledger}"
      echo "- $(grep -m1 'Next up:' "$ledger" 2>/dev/null | cut -c1-300)"
      echo "- open beat: $(grep -m1 -E '^- \[( |~)\]' "$ledger" 2>/dev/null | cut -c1-300)"
    else
      echo "- none — Next up: (no active ledger)"
    fi
    echo
    echo "## Open PRs (@me)"
    hl_prs
    echo
    echo "## Last 5 user requests"
    if [ -f "$tr" ]; then
      tail -c 2097152 "$tr" 2>/dev/null | jq -Rr '
          fromjson? | select(type == "object" and .type == "user" and ((.isMeta // false) | not) and ((.isSidechain // false) | not))
          | .message.content
          | if type == "string" then . elif type == "array" then (map(select(.type == "text") | .text) | join(" ")) else "" end
          | gsub("[[:cntrl:]]"; " ") | select(test("\\S")) | .[0:300]' 2>/dev/null | tail -5 | sed 's/^/- /'
    fi
    echo
    echo "## Last assistant text"
    if [ -f "$tr" ]; then
      tail -c 2097152 "$tr" 2>/dev/null | jq -Rr '
          fromjson? | select(type == "object" and .type == "assistant" and ((.isSidechain // false) | not))
          | .message.content | select(type == "array") | map(select(.type == "text") | .text) | join(" ")
          | gsub("[[:cntrl:]]"; " ") | select(test("\\S")) | .[0:600]' 2>/dev/null | tail -1 | sed 's/^/> /'
    fi
  } 2>/dev/null | hl_redact > "$tmp"
  chmod 600 "$tmp" 2>/dev/null
  mv -f "$tmp" "$dst" 2>/dev/null || { rm -f "$tmp" 2>/dev/null; return 1; }
  printf '%s' "$dst"
}
