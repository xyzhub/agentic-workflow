#!/usr/bin/env bash
# Tags the baseline so checks can prove /adopt committed nothing, and that
# PLAN.md survived conversion untouched.
set -euo pipefail

git tag baseline
