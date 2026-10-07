#!/usr/bin/env bash
# merge guardrail (§10, PreToolUse/Bash) — extracted from the inline git/gh row (v1.53.0,
# pr-economy). Threat model: accident, not an adversarial agent. Rules in order, on CMD:
#   1. API merge (`gh api …pulls/<x>/merge`, `gh api … mergePullRequest|enablePullRequestAutoMerge`) → 2.
#   2. Not merge-shaped (`gh pr`, any flags, `merge`; quotes stripped) → exit 0, silent.
#   3. Under EVERY policy: jq missing, -R/--repo/GH_REPO=, ≠ 1 merge, or anything before it but
#      ONE leading `cd <dir> &&` → 2. Policy = the §10 Merge policy row of docs/WORKFLOW.md AS
#      COMMITTED on origin/<default> of that dir (else the session cwd); working tree only
#      outside a git tree (the publish-guard contract). Anchored records-only value → 4; other
#      `agent-may-merge…` without `records-only` → reminder, exit 0, gh not run; else → 2.
#   4. Records-only, first failure BLOCKS: gh missing; --auto; non-canonical spacing;
#      ; & | newline after the merge; a flag beyond
#      --squash/--merge/--rebase/--delete-branch/--match-head-commit; not one numeric ref; gh pr
#      view fails; not OPEN; 0 or ≥ 100 files; changeType not ADDED|MODIFIED|DELETED; a path outside .plans/** + three
#      record files; a check not SUCCESS|SKIPPED|NEUTRAL, or none while CI exists;
#      --match-head-commit absent or ≠ the viewed headRefOid (TOCTOU). Pass → exit 0.
#   gh output passes only through jq (@tsv) — never eval'ed or interpolated. No set -e.
# externals: cat git grep sed head tr cut wc jq gh
# stdin: the hook event JSON. cwd: the project dir.

INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null || printf '%s' "$INPUT")
M='gh pr merge'
RO='❌ BLOCKED (records-only scope):'
block() { echo "$1" >&2; exit 2; }

# 1. API merges never pass.
if printf '%s' "$CMD" | grep -qE 'pulls/[^/[:space:]]+/merge|gh[[:space:]]+api.*(mergePullRequest|enablePullRequestAutoMerge)'; then
  block "❌ BLOCKED: merging through the API bypasses the merge guard — use the $M form or hand it to the human."
fi

# 2. Not a merge → silent. Merge-shaped = `gh pr`, any flags (e.g. -R x/y), then `merge`, quotes stripped.
BARE=$(printf '%s' "$CMD" | tr -d "\"'\\\\")
MRX='gh[[:space:]]+pr([[:space:]]+-[^[:space:]]*([[:space:]]+[^-[:space:]][^[:space:]]*)?)*[[:space:]]+merge([[:space:];&|()<>]|$)'
if ! printf '%s' "$BARE" | grep -qE "$MRX"; then
  # Last resort: `gh … pr` anywhere (wrappers like bash -c / env / command included) plus `merge`
  # as a standalone word (#108) — `merging` and `… | bash …/merge-guard.sh` are not merges. With
  # ${ $( a backtick, xargs, eval or a pipe into a shell's stdin present, any `merge` counts:
  # ${X%d} / tr can trim `merged` down to `merge`.
  printf '%s' "$BARE" | grep -qE '(^|[^[:alnum:]_])gh[^[:alnum:]_](.*[^[:alnum:]_])?pr[^[:alnum:]_]' || exit 0
  if ! printf '%s' "$BARE" | grep -qE '(^|[^[:alnum:]_.])merge([^[:alnum:]_.-]|$)'; then
    EXP='\$\{|\$\(|`|(^|[^[:alnum:]_])(xargs|eval)([^[:alnum:]_]|$)|\|[[:space:]]*(ba|z|da|k)?sh([[:space:]]+-[^[:space:]]*)*[[:space:]]*($|[;&|)<])'
    printf '%s' "$BARE" | grep -qE "$EXP" && printf '%s' "$BARE" | grep -q 'merge' || exit 0
  fi
  # Coarse fallback: every `gh pr` is a known non-merge subcommand (a title may say "merge") → pass.
  NPR=$(printf '%s' "$BARE" | grep -oE 'gh[[:space:]]+pr' | wc -l | tr -d ' ')
  NOK=$(printf '%s' "$BARE" | grep -oE 'gh[[:space:]]+pr[[:space:]]+(view|create|list|status|checks|diff|checkout|comment|edit|review|close|reopen|ready)([[:space:]]|$)' | wc -l | tr -d ' ')
  [ "$NPR" -gt 0 ] && [ "$NPR" = "$NOK" ] && exit 0
  block "❌ BLOCKED: unrecognized merge shape (fail closed) — write it as cd <repo> && $M <number> …, or hand it to the human."
fi

command -v jq >/dev/null 2>&1 || block "❌ BLOCKED: gh and jq are required by the merge guard (jq is missing, so the command cannot be parsed) — fail closed"

# 3. Target shape, under EVERY policy — so the policy is read from the repo the merge runs in.
printf '%s' "$BARE" | grep -qE '(^|[[:space:]])(-[A-Za-z]*R|--repo)|GH_REPO=' && block "❌ BLOCKED: cross-repo merge (-R/--repo/GH_REPO) is never delegated — run it as cd <repo> && $M … in the target repo (fail closed)."
NM=$(printf '%s' "$BARE" | grep -oE "$MRX" | wc -l | tr -d ' ')
[ "$NM" = 1 ] || block "❌ BLOCKED: more than one merge in a single command — one merge per command, so the guard checks the repo each runs in (fail closed)."
ALONE="❌ BLOCKED: the merge must stand alone or follow exactly one leading cd <repo> && — the guard reads the policy from the repo the merge runs in (fail closed)."
FIRST=${BARE%%$'\n'*}
printf '%s' "$FIRST" | grep -qE "$MRX" || block "$ALONE"
PRE=$(printf '%s' "$FIRST" | sed -E "s/${MRX}.*//")
D=.
if [ -n "$PRE" ]; then
  printf '%s' "$PRE" | grep -qE '^ *cd +[^;&|]+&& *$' || block "$ALONE"
  D=$(printf '%s' "$PRE" | sed -E 's/^ *cd +//; s/ *&& *$//')
fi
BASE=$(printf '%s' "$INPUT" | jq -r '.cwd // ""' 2>/dev/null)
if [ -n "$BASE" ]; then
  cd "$BASE" 2>/dev/null || block "❌ BLOCKED: the session cwd ($BASE) is not a directory — the merge guard cannot locate the target repo (fail closed)."
fi
TOP=$(git -C "$D" rev-parse --show-toplevel 2>/dev/null)
DEF=$(git -C "$D" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||'); DEF=${DEF:-main}
ROWRX='^\| *\*\*Merge policy\*\* *\|'
if [ -n "$TOP" ]; then
  ROW=$(git -C "$TOP" show "origin/$DEF:docs/WORKFLOW.md" 2>/dev/null | grep -E "$ROWRX" | head -1)
else
  ROW=$(grep -E "$ROWRX" "$D/docs/WORKFLOW.md" 2>/dev/null | head -1)
fi
HITL="❌ BLOCKED: the human (HITL) merges PRs. Delegating needs Merge policy = agent-may-merge in the TARGET repo docs/WORKFLOW.md §10 as committed on origin/$DEF (an unset origin/HEAD on a non-main default also lands here — git remote set-head origin -a) — run as cd <repo> && $M … (fail closed)."
[ -n "$ROW" ] || block "$HITL"
RECRX='^\| *\*\*Merge policy\*\* *\| *agent-may-merge \(records-only, delegated [0-9]{4}-[0-9]{2}-[0-9]{2}\) *\|'
if ! printf '%s' "$ROW" | grep -qE "$RECRX"; then
  if printf '%s' "$ROW" | grep -qE '\| *\*\*Merge policy\*\* *\| *agent-may-merge' && ! printf '%s' "$ROW" | grep -q 'records-only'; then
    echo '⚠️ Delegated merge authority (§10 Merge policy) — merge only on a reviewer APPROVE (or §13 bookkeeping scope) and log it in the ledger.'
    exit 0
  fi
  block "$HITL"
fi

# 4. Records-only scope.
{ command -v gh && command -v jq; } >/dev/null 2>&1 || block "$RO gh and jq are required to read the PR's file list — fail closed"
printf '%s' "$BARE" | grep -q -- '--auto' && block "$RO --auto defers the merge past this check"
case "$CMD" in *"$M"*) ;; *) block "$RO write the merge as \`$M\` with single spaces";; esac
PRE=${CMD%%"$M"*}; SEG=${CMD#"$PRE"}
case "$SEG" in *$'\n'*|*';'*|*'&'*|*'|'*) block "$RO the merge must be the last command in the line — no ; && || | or newline after it";; esac
N=; GOT=; POS=0; SHA=; WANT=0; set -f
badflag() { block "$RO flag $1 is not allowed (allowed: --squash --merge --rebase --delete-branch --match-head-commit <sha>)"; }
for T in ${SEG#"$M"}; do
  T=${T//[\"\'\\]/}
  if [ "$WANT" = 1 ]; then SHA=$T; WANT=0; continue; fi
  case "$T" in
    '') ;;
    --squash|--merge|--rebase|--delete-branch|--) ;;
    --match-head-commit) WANT=1;;
    --match-head-commit=*) SHA=${T#*=};;
    --*|-) badflag "$T";;
    -*) case "${T#-}" in *[!smrd]*) badflag "$T";; esac;;
    *) POS=$((POS + 1)); N=$T; GOT="$GOT $T";;
  esac
done
set +f
if [ "$POS" != 1 ] || ! [[ $N =~ ^[0-9]+$ ]]; then
  GOT=${GOT# }
  block "$RO PR ref must be a plain number (got: ${GOT:-none}) — URLs, branch names and the current-branch form are ambiguous"
fi
RT=${TOP:-$D}
JSON=$(cd "$RT" && gh pr view "$N" --json state,files,statusCheckRollup,headRefOid); RC=$?
UNREAD="$RO could not read PR #$N via gh pr view"
[ "$RC" = 0 ] && [ -n "$JSON" ] && printf '%s' "$JSON" | jq -e . >/dev/null 2>&1 || block "$UNREAD"
ST=$(printf '%s' "$JSON" | jq -r '.state // "UNKNOWN" | tostring' 2>/dev/null)
[ "$ST" = OPEN ] || block "$RO PR #$N is ${ST:-UNKNOWN}, not OPEN"
COUNT=$(printf '%s' "$JSON" | jq -r 'if (.files | type) == "array" then (.files | length) else -1 end' 2>/dev/null)
case "$COUNT" in ''|-1) block "$UNREAD";; esac
[ "$COUNT" -eq 0 ] && block "$RO PR #$N changes no files"
[ "$COUNT" -ge 100 ] && block "$RO PR #$N lists $COUNT files — gh caps the file list at 100, so the full set cannot be verified"
FILES=$(printf '%s' "$JSON" | jq -r '.files[] | [(.changeType // "UNKNOWN"), (.path // "")] | @tsv' 2>/dev/null) || block "$UNREAD"
while IFS=$'\t' read -r CT P; do
  case "$CT" in ADDED|MODIFIED|DELETED) ;; *) block "$RO $P is $CT — renames and copies cannot be verified against the allowlist";; esac
  OK=0; case "$P" in
    *..*|/*) OK=0;;
    .plans/?*) OK=1;;
    docs/product/JOURNEY.md|docs/product/overview.html|docs/product/session-handoff.md) OK=1;;
    *) OK=0;;
  esac
  [ "$OK" = 1 ] || block "$RO $P is not a record path (allowed: .plans/**, docs/product/JOURNEY.md, docs/product/overview.html, docs/product/session-handoff.md) — the human merges this PR"
done <<< "$FILES"
NCHK=$(printf '%s' "$JSON" | jq -r '(.statusCheckRollup // []) as $r | if ($r | type) == "array" then ($r | length) else -1 end' 2>/dev/null)
case "$NCHK" in ''|-1) block "$UNREAD";; esac
NOTE=; if [ "$NCHK" -eq 0 ]; then
  if [ -n "$TOP" ]; then HASCI=$(git -C "$TOP" ls-tree --name-only "origin/$DEF" .github/workflows 2>/dev/null)
  elif [ -d "$D/.github/workflows" ]; then HASCI=1; fi
  [ -z "$HASCI" ] || block "$RO no checks registered yet for PR #$N — wait for CI"
  NOTE=' (no CI configured in the target repo)'
else
  CHK=$(printf '%s' "$JSON" | jq -r '.statusCheckRollup[] | [(.conclusion // .state // "NONE"), (.name // .context // "?")] | @tsv' 2>/dev/null) || block "$UNREAD"
  while IFS=$'\t' read -r V NAME; do
    case "$V" in SUCCESS|SKIPPED|NEUTRAL) ;; *) block "$RO check $NAME is ${V:-EMPTY}, not green — wait for CI (node tools/ci-wait.mjs) or hand the merge to the human";; esac
  done <<< "$CHK"
fi
# TOCTOU: the checks above read one snapshot; --match-head-commit makes gh refuse if the head moved.
OID=$(printf '%s' "$JSON" | jq -r '.headRefOid // "" | tostring' 2>/dev/null); HEXRX='^[0-9a-f]{40}([0-9a-f]{24})?$'
[[ $OID =~ $HEXRX ]] || block "$UNREAD"
[ -n "$SHA" ] || block "$RO add --match-head-commit $OID — gh then refuses the merge if PR #$N's head moves after this check"
[ "$SHA" = "$OID" ] || block "$RO --match-head-commit $SHA does not match PR #$N's head $OID — the PR moved; re-check it"
echo "✅ records-only scope (§10): PR #$N — $COUNT record path(s), checks green$NOTE — merging; log it in the ledger."
exit 0
