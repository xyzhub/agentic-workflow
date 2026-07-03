#!/usr/bin/env bash
# Runs in the fixture repo after `git init -b main` + baseline commit.
# Creates a local bare origin so `git push` has somewhere to go, points
# origin/HEAD at main (the hook derives the default branch from it), and
# leaves an uncommitted change for the agent — while checked out on main.
set -euo pipefail

git init -q --bare ../origin.git
git remote add origin ../origin.git
git push -qu origin main
git remote set-head origin main
git rev-parse main > ../baseline-sha

printf '\n## Unreleased\n- docs: clarify usage\n' >> CHANGELOG.md
