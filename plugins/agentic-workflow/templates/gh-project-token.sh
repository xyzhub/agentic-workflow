#!/usr/bin/env bash
set +x # never trace: the token passes through a variable below
# gh wrapper (agentic-workflow template) — install with
#   cp ${CLAUDE_PLUGIN_ROOT}/templates/gh-project-token.sh ~/.local/bin/gh && chmod +x ~/.local/bin/gh
# with ~/.local/bin ahead of the real gh on PATH. Inside a repo whose local
# credential.helper is git-identity, it runs gh with THAT repo's own token
# (`git-identity token`); everywhere else it is plain gh with your global login.
#
# The project token is NOT used (plain gh) when: GH_TOKEN, GITHUB_TOKEN or GH_REPO
# is set; the command is `gh auth …`; `-R/--repo` names a repo other than this
# one's origin (bundled short flags such as `-wR` count as "other"); the folder is
# not a git-identity repo; or the token cannot be read. It cannot see a different
# repo named positionally (`gh api repos/<other>/…`, a PR URL, `gh repo clone`) —
# those calls use this project's token and GitHub refuses them if it is scoped.

real=""
IFS=: read -r -a dirs <<< "$PATH"
for d in "${dirs[@]}"; do
  c="$d/gh"
  [ -x "$c" ] || continue
  [ "$c" -ef "$0" ] && continue                                   # this file, by any path or symlink
  head -c 512 "$c" 2>/dev/null | LC_ALL=C grep -qF 'gh wrapper (agentic-workflow template' \
    && continue                                                     # another copy (marker is in the head)
  real=$c; break
done
[ -n "$real" ] || { echo "gh wrapper: real gh not found on PATH" >&2; exit 127; }

use_repo_token=1
[ -n "${GH_TOKEN:-}${GITHUB_TOKEN:-}${GH_REPO:-}" ] && use_repo_token=0
[ "${1:-}" = auth ] && use_repo_token=0

if [ "$use_repo_token" = 1 ]; then
  origin=$(git config --get remote.origin.url 2>/dev/null \
    | sed -E 's#^(git@[^:]+:|ssh://git@[^/]+/|https://[^/]+/)##; s#\.git$##')
  prev=""
  for a in "$@"; do
    case "$prev" in -R|--repo) [ "$a" = "$origin" ] || use_repo_token=0 ;; esac
    case "$a" in
      --repo=*) [ "${a#--repo=}" = "$origin" ] || use_repo_token=0 ;;
      -R?*)     [ "${a#-R}" = "$origin" ] || use_repo_token=0 ;;
      -[!-]*R*) use_repo_token=0 ;;
    esac
    prev=$a
  done
fi

if [ "$use_repo_token" = 1 ] \
   && command -v git-identity >/dev/null 2>&1 \
   && git rev-parse --git-dir >/dev/null 2>&1 \
   && git config --local --get-all credential.helper 2>/dev/null | grep -q 'git-identity'; then
  tok=$(git-identity token 2>/dev/null) || tok=""
  if [ -n "$tok" ]; then
    GH_TOKEN=$tok exec "$real" "$@"
  fi
fi
exec "$real" "$@"
