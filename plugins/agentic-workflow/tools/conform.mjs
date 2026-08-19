#!/usr/bin/env node
// conform.mjs — does this project's docs structure conform to the INSTALLED plugin?
// Zero deps; Node >= 18; filesystem only (no git, no network) so it is safe in a hook.
//
//   node conform.mjs [--root <project>] [--plugin <pluginRoot>] [--json] [--brief] [--strict]
//
// Prints the gaps between the project's structure and the plugin version that is
// installed — each gap names the fix (usually "run /agentic-workflow:sync", which
// applies this same ladder). Exit 0 always (advisory) unless --strict (exit 1 on gaps).
// --brief prints ≤3 lines for the SessionStart hook; --json is for tooling.
//
// Why (owner, 2026-08-19): a project adopted on v1.43 kept working on v1.46 while
// its ledgers lacked `Estimate:`/`Sessions used:` (so the overrun stop never fired),
// its §10 had no Staging/Issue-tracker rows, it had no catalog, no roadmap epic view,
// and a hand-appended BACKLOG.md — and nothing said so. /sync only re-copied
// WORKFLOW.md, and only when a human remembered. This is the "recognize" half; /sync
// is the "conform" half; both read the SAME ladder below, so a project is either
// conformant or told exactly why not.
//
// The ladder: one entry per structural expectation, with the plugin version that
// introduced it (`since`). A project stamped at protocol-master vX is checked against
// every entry — a missing structure is a gap regardless of the stamp (the stamp only
// tells us HOW FAR BEHIND); a stale stamp with no structural gaps is one line.
// Keep entries deterministic and cheap: file exists / line matches / row present.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const ROOT = path.resolve(opt('--root', process.cwd()));
const PLUGIN = path.resolve(opt('--plugin', process.env.CLAUDE_PLUGIN_ROOT || path.join(HERE, '..')));

const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };
const at = (...p) => path.join(ROOT, ...p);
const semver = (v) => (v || '0.0.0').replace(/^v/, '').split('.').map((n) => parseInt(n, 10) || 0);
const cmp = (a, b) => { const x = semver(a), y = semver(b); for (let i = 0; i < 3; i++) { if (x[i] !== y[i]) return x[i] - y[i]; } return 0; };

// ── inputs ─────────────────────────────────────────────────────────────────
const workflow = read(at('docs/WORKFLOW.md'));
const pluginVersion = (() => { try { return JSON.parse(read(path.join(PLUGIN, '.claude-plugin/plugin.json'))).version; } catch { return null; } })();
const stamp = workflow ? (workflow.match(/<!--\s*protocol-master:\s*v?([\d.]+)\s*-->/) || [])[1] || null : null;

function section10() {
  if (!workflow) return '';
  // NB: JS has no \Z — an identity escape matches a literal 'Z' and truncated the
  // section at the first capital Z. End-of-input is (?![\s\S]).
  const m = workflow.match(/^## 10\.[\s\S]*?(?=^## 11\.|^## Local amendments|(?![\s\S]))/m);
  return m ? m[0] : '';
}
function activeLedgers() {
  const dir = at('.plans');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.state.md')).map((f) => ({ name: f, text: read(path.join(dir, f)) || '' }))
    // Open beat AND not closed: a mission with a `Closed: YYYY-MM-DD` stamp
    // may still carry a parked [~] row (a promoted obligation) — it needs no
    // budget fields any more.
    .filter((l) => /^- \[( |~)\]/m.test(l.text) && !/^Closed:\s*\d{4}-\d{2}-\d{2}/m.test(l.text));
}
// §10 opt-out for the catalog: `| **Catalog** | none — <why> |` (a markdown-only
// repo, a pure library with no routes/schema and no marketable surface). The
// row must SAY none; a missing row means the default (catalog expected).
const catalogOptOut = () => /^\|\s*\*\*Catalog\*\*\s*\|\s*none\b/mi.test(section10());
const has10 = (label) => new RegExp(`^\\|\\s*\\*\\*${label}\\*\\*`, 'm').test(section10());

// The conventions file (CLAUDE.md/AGENTS.md) is injected into EVERY session, so
// a dead anchor there misleads more than anywhere else. Check only tokens that
// are unambiguously concrete: backticked repo paths (contain '/', have an
// extension, no globs/placeholders/vars, not absolute/~/URL) and
// `pnpm|npm run <script>` names against package.json. Advisory like the rest.
function conventionsFile() {
  for (const f of ['CLAUDE.md', 'AGENTS.md']) if (existsSync(at(f))) return f;
  return null;
}
function deadClaudeMdAnchors() {
  const f = conventionsFile();
  if (!f) return [];   // absence is /doctor's business, not a broken anchor
  const text = read(at(f)) || '';
  const dead = [];
  const seen = new Set();
  for (const [, tok] of text.matchAll(/`([^`\n]+)`/g)) {
    const t = tok.trim();
    if (seen.has(t)) continue; seen.add(t);
    const run = t.match(/^(?:pnpm|npm)\s+run\s+([A-Za-z0-9:_-]+)$/);
    if (run) {
      try {
        const pkg = JSON.parse(read(at('package.json')) || '{}');
        if (pkg.scripts && !(run[1] in pkg.scripts)) dead.push(`${t} (no such package script)`);
      } catch { /* unparseable package.json → skip, not a CLAUDE.md problem */ }
      continue;
    }
    if (!t.includes('/')) continue;
    if (/[\s*<>{}$()\[\]|,]|^https?:|^~|^\//.test(t)) continue;
    if (!/\.[A-Za-z0-9]{1,6}$/.test(t)) continue;
    if (!existsSync(at(t))) dead.push(t);
  }
  return dead;
}

// ── the ladder ─────────────────────────────────────────────────────────────
// { id, since, check: () => true | string(gap detail), fix }
const LADDER = [
  { id: 'protocol-stamp', since: '1.0.0',
    check: () => (stamp && pluginVersion && cmp(stamp, pluginVersion) < 0) ? `docs/WORKFLOW.md is stamped v${stamp}; installed plugin is v${pluginVersion}` : true,
    fix: 'run /agentic-workflow:sync (re-copies the protocol master, preserves §10 + Local amendments, then applies this ladder)' },
  { id: 'engineering-folder', since: '1.36.0',
    check: () => (existsSync(at('docs/product/architecture.md')) || existsSync(at('docs/product/interface-contract.md'))) ? 'flat docs/product/architecture.md or interface-contract.md (belongs under docs/product/engineering/)' : true,
    fix: '/agentic-workflow:sync step 3.5 moves them (git mv, links rewritten, staged for review)' },
  { id: 'plans-tracked', since: '1.48.1',
    check: () => {
      // fs-only approximation (this runs in a hook: no git commands): the repo
      // gitignoring its own mission state means every ledger lives on one
      // machine only, a fresh clone/worktree starts empty, and the crash-safe
      // premise silently fails. Root .gitignore lines `.plans` / `.plans/`.
      if (!existsSync(at('.plans'))) return true;
      const gi = read(at('.gitignore')) || '';
      return gi.split('\n').some((l) => /^\.plans\/?\s*$/.test(l.trim()))
        ? '.plans/ is gitignored — ledgers, briefs and the obligations register exist on this machine only (a clone or a worktree starts empty; the staging PR cannot carry ledger updates)' : true;
    },
    fix: 'remove the `.plans/` line from .gitignore, re-ignore only the junk (screenshots, scratch dirs) with targeted patterns, and `git add .plans` — tracking starts now, history is not needed' },
  { id: 'profile-staging-row', since: '1.45.0',
    check: () => has10('Staging') ? true : '§10 has no **Staging** row (every mission phase lands on staging and is verified there before its PR)',
    fix: 'add the §10 **Staging** row — branch + URL, or `none` (the first mission creates `staging`); /agentic-workflow:sync appends it' },
  { id: 'ledger-budget-fields', since: '1.45.0',
    check: () => { const bad = activeLedgers().filter((l) => !/^Estimate:\s*\d+/m.test(l.text) || !/^Sessions used:\s*\d+/m.test(l.text)).map((l) => l.name); return bad.length ? `active ledger(s) without \`Estimate:\`/\`Sessions used:\` (the overrun stop cannot fire): ${bad.join(', ')}` : true; },
    fix: 'add `Estimate: N sessions` (the planner\'s honest count for what remains) and `Sessions used: k` to each active .plans/*.state.md header' },
  { id: 'ledger-single-next-up', since: '1.45.0',
    check: () => { const bad = activeLedgers().filter((l) => (l.text.match(/^Next up:/gm) || []).length !== 1).map((l) => `${l.name} (${(l.text.match(/^Next up:/gm) || []).length})`); return bad.length ? `active ledger(s) with ≠1 \`Next up:\` line: ${bad.join(', ')}` : true; },
    fix: 'keep exactly one `Next up:`; rename superseded ones `SUPERSEDED next-up (historical):` (LA-7)' },
  { id: 'profile-issue-tracker-row', since: '1.46.0',
    check: () => has10('Issue tracker') ? true : '§10 has no **Issue tracker** row (the queue\'s system of record, §4)',
    fix: 'add the §10 **Issue tracker** row (e.g. `GitHub Issues via gh`, or `none`); /agentic-workflow:sync appends it' },
  { id: 'roadmap-epic-view', since: '1.46.0',
    check: () => {
      const r = read(at('docs/product/roadmap.md'));
      if (!r) return 'no docs/product/roadmap.md (epic view)';
      // Item-level markers: per-entry status tables / R-NN rows / SHIPPED·DEFERRED
      // status words. Those duplicate the queue. Anything else (epics, a council
      // memo, a ranked list of themes) is fine — the ladder is not a style guide.
      return /^\|\s*\*\*R-\d+|Status · evidence|\b(SHIPPED|DEFERRED)\b.*\|/m.test(r)
        ? 'docs/product/roadmap.md carries per-item status (R-NN rows / SHIPPED·DEFERRED) — that duplicates the queue; keep epics + ranking here, items in the tracker' : true;
    },
    fix: 'copy templates/roadmap.md to docs/product/roadmap.md and move per-item status to the tracker (/agentic-workflow:groom)' },
  { id: 'backlog-is-generated-view', since: '1.46.0',
    check: () => { for (const f of ['BACKLOG.md', 'docs/product/backlog.md']) { const t = read(at(f)); if (t && !/generated view/i.test(t.split('\n').slice(0, 3).join('\n'))) return `${f} is hand-written (not a generated view of the tracker)`; } return true; },
    fix: 'run /agentic-workflow:groom (it detects the file, imports into the tracker, closes shipped with evidence, regenerates the file as a view)' },
  { id: 'catalog-tooling', since: '1.46.0',
    check: () => (catalogOptOut() || existsSync(at('tools/catalog.mjs'))) ? true : 'no tools/catalog.mjs (the derived API/data-model catalog cannot be generated or checked)',
    fix: 'copy the plugin\'s tools/catalog.mjs into tools/ and run it; /agentic-workflow:sync step 3.6 does this' },
  { id: 'catalog-files', since: '1.46.0',
    check: () => { if (catalogOptOut()) return true; const miss = ['README.md', 'api.md', 'data-model.md', 'features.md'].filter((f) => !existsSync(at('docs/product/catalog', f))); return miss.length ? `docs/product/catalog/ missing ${miss.join(', ')} (sessions build on old knowledge without it)` : true; },
    fix: 'run `node tools/catalog.mjs` and seed features.md from templates/catalog-features.md (/agentic-workflow:adopt\'s catalog step)' },
  { id: 'claude-md-anchors', since: '1.47.2',
    check: () => { const dead = deadClaudeMdAnchors(); return dead.length ? `${conventionsFile()} names ${dead.length} anchor(s) that no longer resolve (it is injected into every session): ${dead.slice(0, 5).join(', ')}${dead.length > 5 ? ', …' : ''}` : true; },
    fix: 'update or delete those lines — conventions carry anchors and are rewritten in place when the thing they name moves (§6.1); a diff that renames/deletes a named anchor updates the line in the same PR' },
  { id: 'ci-wait-tooling', since: '1.48.0',
    check: () => { if (!existsSync(at('.github/workflows'))) return true; const a = read(at('tools/ci-wait.mjs')), b = read(path.join(PLUGIN, 'tools/ci-wait.mjs')); if (!b) return true; if (!a) return 'no tools/ci-wait.mjs while .github/workflows exists (CI is tracked by prose — the LA-8 false-green family)'; return a === b ? true : 'tools/ci-wait.mjs differs from the installed plugin\'s copy'; },
    fix: 'copy the plugin\'s tools/ci-wait.mjs into tools/ (/agentic-workflow:sync step 3.6); agents wait on CI with `node tools/ci-wait.mjs <sha>` in the background — exit code is the verdict' },
  { id: 'catalog-tooling-current', since: '1.46.0',
    check: () => { const a = read(at('tools/catalog.mjs')), b = read(path.join(PLUGIN, 'tools/catalog.mjs')); if (!a || !b) return true; return a === b ? true : 'tools/catalog.mjs differs from the installed plugin\'s copy'; },
    fix: '/agentic-workflow:sync step 3.6 copies the newer script over and regenerates the derived files' },
];

// ── run ────────────────────────────────────────────────────────────────────
if (!workflow) {
  // Not an adopted project — nothing to conform. Silent by design (the hook must
  // never nag a random repo); --json says so explicitly.
  if (flag('--json')) console.log(JSON.stringify({ adopted: false, gaps: [] }));
  process.exit(0);
}
const gaps = [];
for (const e of LADDER) {
  let r; try { r = e.check(); } catch (err) { r = `check errored: ${err.message}`; }
  if (r !== true) gaps.push({ id: e.id, since: e.since, detail: r, fix: e.fix });
}
const behind = stamp && pluginVersion && cmp(stamp, pluginVersion) < 0;

if (flag('--json')) { console.log(JSON.stringify({ adopted: true, stamp, pluginVersion, behind: !!behind, gaps }, null, 2)); process.exit(flag('--strict') && gaps.length ? 1 : 0); }
if (!gaps.length) { if (!flag('--brief')) console.log(`conform: project structure matches plugin v${pluginVersion} (stamp v${stamp})`); process.exit(0); }
if (flag('--brief')) {
  const ids = gaps.map((g) => g.id);
  console.log(`🧭 Project structure is behind the installed plugin${behind ? ` (docs/WORKFLOW.md v${stamp} < plugin v${pluginVersion})` : ''}: ${gaps.length} gap(s) — ${ids.slice(0, 5).join(', ')}${ids.length > 5 ? ', …' : ''}.`);
  console.log(`First: ${gaps[0].detail}`);
  console.log('Run /agentic-workflow:sync — it applies the same ladder (idempotent) and reports each fix; `node ${CLAUDE_PLUGIN_ROOT}/tools/conform.mjs` lists all gaps.'.replace('${CLAUDE_PLUGIN_ROOT}', '$CLAUDE_PLUGIN_ROOT'));
  process.exit(0);
}
console.log(`conform: ${gaps.length} gap(s) vs plugin v${pluginVersion}${stamp ? ` (project stamp v${stamp})` : ' (no protocol stamp)'}`);
for (const g of gaps) console.log(`  - [${g.id} · since v${g.since}] ${g.detail}\n      fix: ${g.fix}`);
process.exit(flag('--strict') ? 1 : 0);
