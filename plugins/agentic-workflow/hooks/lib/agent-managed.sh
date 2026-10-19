#!/usr/bin/env bash
# agent-managed push exemption (v1.67.0) — called by the git/gh guardrails row
# with "$D" "$DEF" "$CMD". Exit 0 = this push may go to the default branch;
# anything else = no exemption (the default-branch push blocks apply as before).
# Threat model: accident and casual self-exemption, not an adversarial shell.
#
# A repo opts in by carrying `.agent-managed` on its REMOTE default branch,
# whose first line names the repo (`owner/name`). All must hold:
#   1. A fresh `git fetch origin <DEF>` succeeds and FETCH_HEAD:.agent-managed
#      exists — read from the remote, never a local ref an agent could move,
#      so the first marker can only arrive by a human push or web edit (the
#      push the guard itself blocks).
#   2. The marker's `owner/name` is the tail of the origin URL — a marker
#      copied into a fork or another repo's history exempts nothing.
#   3. Exactly one `git push` in CMD, whose args are only -u/-q/--quiet/
#      --set-upstream/origin/<DEF>/HEAD — no force, delete, mirror, other
#      remote, URL or refspec, so the exemption covers a fast-forward only.
# externals: git grep sed head tr
D=$1; DEF=$2; CMD=$3
[ -n "$D" ] && [ -n "$DEF" ] || exit 1
N=$(printf '%s\n' "$CMD" | grep -oE 'git( -C [^ ;&|]+)? push' | wc -l | tr -d ' ')
[ "$N" = 1 ] || exit 1
ARGS=$(printf '%s\n' "$CMD" | sed -n 's/.*git\( -C [^ ;&|]*\)\{0,1\} push\([^;&|]*\).*/\2/p')
for a in $ARGS; do
  case "$a" in -u|-q|--quiet|--set-upstream|origin|HEAD|"$DEF") ;; *) exit 1;; esac
done
git -C "$D" fetch -q origin "$DEF" 2>/dev/null || exit 1
MK=$(git -C "$D" show FETCH_HEAD:.agent-managed 2>/dev/null | head -n 1 | tr -d '[:space:]')
[ -n "$MK" ] || exit 1
printf '%s' "$MK" | grep -qE '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$' || exit 1
URL=$(git -C "$D" remote get-url origin 2>/dev/null)
case "$URL" in */"$MK"|*/"$MK".git|*:"$MK"|*:"$MK".git) exit 0;; esac
exit 1
