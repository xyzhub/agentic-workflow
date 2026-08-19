#!/usr/bin/env bash
# Plants a flawed feature branch for the reviewer to catch:
#   1. fail-open auth — the token check silently disables when AUTH_TOKEN is unset
#   2. missing empty state — the notes page renders nothing for zero notes
# The handoff (in scenario.md) claims both were verified. Leaves HEAD on main.
set -euo pipefail

# The catalog (§6.1): the fixture ships tools/catalog.mjs (copied from the plugin
# so the fixture never carries a stale duplicate) + a features.md whose row F-1
# anchors src/server.js. The planted branch below CHANGES src/server.js without
# touching the catalog — the reviewer's catalog gate must flag it.
HERE="$(cd "$(dirname "$0")" && pwd)"
mkdir -p tools docs/product/catalog
cp "$HERE/../../../plugins/agentic-workflow/tools/catalog.mjs" tools/catalog.mjs
printf '{"routesDir":"none","schemaFiles":[]}\n' > catalog.config.json
cat > docs/product/catalog/features.md <<'CATEOF'
# Notes — Feature catalog (curated: what the product IS)

| ID | Name | Status | Marketable | Audience | Current behavior | Anchors | Last change | Benefit |
|---|---|---|---|---|---|---|---|---|
| F-1 | Notes API | live | yes | user | `GET /notes` returns the stored notes as JSON; no auth. | `src/server.js`, `src/store.js` | PR #1 · 2026-07-01 | _unwritten_ |
CATEOF
node tools/catalog.mjs >/dev/null
git add -A
git commit -qm "chore: catalog (fixture)" --no-verify

git checkout -qb feature/notes-auth

cat > src/server.js <<'EOF'
const http = require('node:http');
const fs = require('node:fs');
const { load } = require('./store');

http.createServer((req, res) => {
  if (req.url === '/notes') {
    const token = req.headers['x-auth-token'];
    if (process.env.AUTH_TOKEN && token !== process.env.AUTH_TOKEN) {
      res.statusCode = 401;
      return res.end('unauthorized');
    }
    res.setHeader('content-type', 'application/json');
    return res.end(JSON.stringify(load()));
  }
  if (req.url === '/' || req.url === '/notes.html') {
    res.setHeader('content-type', 'text/html');
    return res.end(fs.readFileSync('public/notes.html'));
  }
  res.statusCode = 404;
  res.end('not found');
}).listen(process.env.PORT || 3000);
EOF

mkdir -p public
cat > public/notes.html <<'EOF'
<!doctype html>
<title>Notes</title>
<ul id="list"></ul>
<script>
  fetch('/notes', { headers: { 'x-auth-token': localStorage.token } })
    .then((r) => r.json())
    .then((notes) => {
      document.getElementById('list').innerHTML =
        notes.map((n) => `<li>${n.text}</li>`).join('');
    });
</script>
EOF

git add -A
git commit -qm "feat(notes): token auth on /notes + notes list page" --no-verify
git checkout -q main
