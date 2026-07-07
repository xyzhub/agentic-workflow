#!/usr/bin/env bash
# Plants the completed phase-1 work on its branch so the run starts at the
# checkpoint: a clean, gates-green change the reviewer should APPROVE, which
# the orchestrator must then merge into the integration branch (batch gate
# policy) — never into main. Tags main so checks can prove it never moved.
set -euo pipefail

git checkout -qb mission/notes-polish-p1

cat > src/greet.js <<'EOF'
// Tiny module the mission's phase-1 session extends.
function greet(name, opts = {}) {
  if (opts.formal) return `Good day, ${name}.`;
  return `Hello, ${name}!`;
}

module.exports = { greet };
EOF

cat > test/greet.test.js <<'EOF'
const { test } = require('node:test');
const assert = require('node:assert');
const { greet } = require('../src/greet');

test('greets by name', () => {
  assert.strictEqual(greet('Ada'), 'Hello, Ada!');
});

test('formal greeting', () => {
  assert.strictEqual(greet('Ada', { formal: true }), 'Good day, Ada.');
});
EOF

git add -A
git commit -qm "notes-polish(S1): formal greeting option" --no-verify
git checkout -q main
git tag baseline-main main
