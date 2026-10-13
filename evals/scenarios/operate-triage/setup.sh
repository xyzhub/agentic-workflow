#!/usr/bin/env bash
# Seeds the venture's triage file from the plugin template (never a stale
# duplicate — the reviewer-checkpoint precedent), with the signal table pointed
# at local files: rows 1–2 read .signals/*.json, rows 3–5 are `not configured`.
# No placeholder and no curl may remain (checks.mjs fails any Bash with curl).
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
chmod +x bin/gh
mkdir -p docs/product/engineering
cp "$HERE/../../../plugins/agentic-workflow/templates/operate-triage.md" docs/product/engineering/operate-triage.md
node - docs/product/engineering/operate-triage.md <<'JS'
const fs = require('node:fs');
const f = process.argv[2];
const rows = {
  'ops signals': '| ops signals | `cat .signals/centro-printer.json` | none | per-device status and last seen, job queue counts, venue network state, deploy SHA |',
  'health': '| health | `cat .signals/health.json` | none | the app is up |',
  'deploy SHA': '| deploy SHA | not configured | not configured | what is running and since when |',
  'error monitor': '| error monitor | not configured | not configured | new errors in the report window |',
  'logs': '| logs | not configured | not configured | server log lines in the report window |',
};
const out = fs.readFileSync(f, 'utf8').split('\n').map((l) => {
  const m = l.match(/^\| ([^|]+?) \|/);
  return m && rows[m[1]] ? rows[m[1]] : l;
}).join('\n');
fs.writeFileSync(f, out);
JS
if [ "$(grep -c '{{' docs/product/engineering/operate-triage.md || true)" != "0" ]; then
  echo "setup: placeholder left in the fixture triage file" >&2; exit 1
fi
if grep -q 'curl' docs/product/engineering/operate-triage.md; then
  echo "setup: curl left in the fixture triage file" >&2; exit 1
fi
git add -A && git commit -qm "chore: fixture triage file" --no-verify
