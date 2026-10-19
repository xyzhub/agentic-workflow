#!/usr/bin/env bash
# agent-managed push exemption (v1.67.0) — called by the git/gh guardrails row
# with "$D" "$DEF" "$CMD", only when the push would otherwise be blocked.
# Exit 0 = this push may go to the default branch; anything else = no
# exemption (the default-branch push blocks apply as before).
# Threat model: accident and casual self-exemption, not an adversarial shell.
#
# A repo opts in by carrying `.agent-managed` on its REMOTE default branch,
# whose first line names the repo (`owner/name`). All must hold:
#   1. CMD is exactly `[cd <dir> && ]git push [args]` or `git -C <dir> push
#      [args]` — one simple command, no other command, no ; & | ` $( or
#      newline, never cd plus -C — so the repo
#      checked here ($D) is the repo pushed. Args only -u/-q/--quiet/
#      --set-upstream/origin/<DEF>/HEAD, `origin` required: no force, delete,
#      refspec, URL, and no remote.origin.push/mirror or push.default=matching
#      config that would widen or rewrite what the push sends.
#   2. origin has ONE push URL, equal to its fetch URL (no pushurl /
#      pushInsteadOf redirect), whose tail is the marker's `owner/name`.
#   3. A fresh `git fetch origin <DEF>` (≤ 3 s, no prompts) succeeds and
#      FETCH_HEAD:.agent-managed names that repo — read from the remote, never
#      a local ref an agent could move, so the first marker can only arrive by
#      a human push or web edit (the push the guard itself blocks).
# externals: git grep sed head tr wc sleep kill
D=$1; DEF=$2; CMD=$3
[ -n "$D" ] && [ -n "$DEF" ] || exit 1
[ "$(printf '%s' "$CMD" | wc -l | tr -d ' ')" = 0 ] || exit 1
case "$CMD" in *';'*|*'|'*|*'`'*|*'$('*) exit 1;; esac
REST=$(printf '%s' "$CMD" | sed -n 's/^ *cd  *[^&]*[^ &] *&& *//p')
if [ -n "$REST" ]; then
  case "$REST" in *'git -C'*) exit 1;; esac   # cd X && git -C Y push: X checked, Y pushed
else
  REST=$(printf '%s' "$CMD" | sed 's/^ *git  *-C  *[^ ]*  *push/git push/')  # lone git -C D push: D is the hook's target
fi
case "$REST" in *'&'*) exit 1;; esac
printf '%s' "$REST" | grep -qE '^ *git +push( +[^ ]+)* *$' || exit 1
# Positional order as git reads it: 1st = remote (must be origin, so
# pushRemote / pushDefault can't redirect), 2nd = HEAD or <DEF>, no 3rd.
# noglob: the words checked here are the words git receives.
set -f
POS=0
for a in $(printf '%s' "$REST" | sed 's/^ *git  *push//'); do
  case "$a" in
    -u|-q|--quiet|--set-upstream) ;;
    -*) exit 1;;
    *) POS=$((POS + 1))
       case "$POS:$a" in 1:origin|2:HEAD|2:"$DEF") ;; *) exit 1;; esac;;
  esac
done
set +f
[ "$POS" -ge 1 ] || exit 1
# No config that widens or rewrites what `git push origin [..]` sends.
git -C "$D" config --get-regexp '^remote\.origin\.(push|mirror)$' >/dev/null 2>&1 && exit 1
case "$(git -C "$D" config --get push.default 2>/dev/null)" in ''|simple|current|upstream) ;; *) exit 1;; esac
FURL=$(git -C "$D" remote get-url origin 2>/dev/null)
PURLS=$(git -C "$D" remote get-url --push --all origin 2>/dev/null)
[ -n "$FURL" ] && [ "$PURLS" = "$FURL" ] || exit 1
# Bounded fetch: the hook's own timeout must never be what decides.
GIT_TERMINAL_PROMPT=0 GIT_SSH_COMMAND='ssh -o BatchMode=yes -o ConnectTimeout=2' \
  git -C "$D" fetch -q origin "$DEF" 2>/dev/null & FP=$!
( sleep 3; kill "$FP" 2>/dev/null ) </dev/null >/dev/null 2>&1 & WP=$!  # detached: never holds the hook's pipes
wait "$FP"; FRC=$?
kill "$WP" 2>/dev/null
[ "$FRC" = 0 ] || exit 1
MK=$(git -C "$D" show FETCH_HEAD:.agent-managed 2>/dev/null | head -n 1 | tr -d '[:space:]')
printf '%s' "$MK" | grep -qE '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$' || exit 1
case "$FURL" in */"$MK"|*/"$MK".git|*:"$MK"|*:"$MK".git) exit 0;; esac
exit 1
