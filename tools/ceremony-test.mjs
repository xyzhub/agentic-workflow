#!/usr/bin/env node
// Behavior harness for plugins/agentic-workflow/tools/ceremony.mjs (adaptive-
// ceremony AC-1..6, 11, 12). Zero deps; Node >= 18. Every case runs the real CLI
// against a fixture project written into a throwaway dir. Run:
// node tools/ceremony-test.mjs (0 = pass, 1 = fail). lint.mjs delegates here.
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ROOT, 'plugins/agentic-workflow');
const TOOL = path.join(PLUGIN, 'tools/ceremony.mjs');
const TPL = readFileSync(path.join(PLUGIN, 'templates/WORKFLOW.md'), 'utf8');

let passed = 0;
const fails = [];
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { fails.push(name); console.error(`  FAIL ${name}${detail ? ` — ${String(detail).slice(0, 300)}` : ''}`); }
};
const block = (name) => TPL.slice(TPL.indexOf(`<!-- ${name} -->`), TPL.indexOf(`<!-- /${name} -->`) + name.length + 10);
const STAGE = block('stage-table'), GATES = block('checkpoint-gates');
const s10 = (row = '', table = '', extra = '') => `## 10. Project profile\n\n| Key | Value |\n|---|---|\n| **Merge policy** | human-only |\n| **Deploy + live-verify** | none |\n| **Test policy** | configured |\n${row ? `| **Ceremony profile** | ${row} |\n` : ''}\n### 10.2 Ceremony\n\n${table}\n\nOverrides:\n${extra}\n\n## 11. Autopilot mode\n`;
const wf = (opt = {}) => `# WORKFLOW\n\n## 0. Lifecycle\n\n${opt.stage ?? STAGE}\n\n## 5. Missions\n\n${opt.gates ?? GATES}\n\n${s10(opt.row, opt.table, opt.extra)}`;
const LEDGER = '# Mission: demo — ledger\n\nSessions used: 1\n\n## Deviations\n\n(none)\n\n## Handoff log (newest first)\n\n- 2026-10-15 x\n';

function fresh(text) {
  const d = mkdtempSync(path.join(tmpdir(), 'ceremony-test-'));
  mkdirSync(path.join(d, 'docs')); mkdirSync(path.join(d, '.plans'));
  writeFileSync(path.join(d, 'docs/WORKFLOW.md'), text);
  writeFileSync(path.join(d, '.plans/demo.state.md'), LEDGER);
  return d;
}
const run = (d, ...args) => {
  const r = spawnSync('node', [TOOL, ...args, '--root', d, '--date', '2026-10-15'], { encoding: 'utf8' });
  let json = null; try { json = JSON.parse(r.stdout); } catch { /* text mode */ }
  return { code: r.status, out: `${r.stdout}${r.stderr}`, json };
};
const eff = (d, id) => run(d, 'effective', id, '--json').json || {};
// A confirmed profile rendered by the tool itself, then written back into §10.
function confirmed(extra = '', opt = {}) {
  const d = fresh(wf(opt));
  const r = run(d, 'derive', '--confirm', 'Baker', '--json').json;
  writeFileSync(path.join(d, 'docs/WORKFLOW.md'), wf({ ...opt, row: r.render.row, table: r.render.table, extra }));
  return d;
}
const dirs = [];
const T = (text) => { const d = fresh(text); dirs.push(d); return d; };

console.log('(a) the plugin template fences, Deploy: none, no surfaces');
{
  const d = T(wf()); const r = run(d, 'derive', '--json').json || { rows: [], asks: [] };
  const row = (id) => r.rows.find((x) => x.id === id) || {};
  ok('(a) derive parses the template fences (≥ 20 rows)', r.rows.length >= 20, r.rows.length);
  ok('(a) v2-deploy-pipeline (ci-deploy, irreversible) stays required under Deploy: none', row('v2-deploy-pipeline').derived === 'required' && /ci-deploy is irreversible/.test(row('v2-deploy-pipeline').signal), JSON.stringify(row('v2-deploy-pipeline')));
  ok('(a) the UX artifact is skipped on the positive `no UI surface` signal', row('v1-ux-brief').derived === 'skipped' && /no UI surface/.test(row('v1-ux-brief').signal));
  ok('(a) v4-ux-audit skipped with the same named signal', row('v4-ux-audit').derived === 'skipped' && /no UI surface/.test(row('v4-ux-audit').signal));
  ok('(a) asks non-empty and ≤ 4 (stage + auth/payments/schema)', r.asks.length > 0 && r.asks.length <= 4, JSON.stringify(r.asks));
  ok('(a) every gate row ends in a `· class:<id>` token', r.rows.filter((x) => x.kind === 'gate').every((x) => / · class:[a-z+-]+$/.test(x.signal)));
  ok('(a) the rendered profile cell is `proposed` and every effective cell is required', /^proposed 2026-10-15/.test(r.render.row) && r.render.table.split('\n').slice(2).every((l) => / required \|$/.test(l)));
  ok('(a) absent profile → effective required with the reason stated', eff(d, 'v4-ux-audit').cell === 'required' && /absent/.test(eff(d, 'v4-ux-audit').reason));
}

console.log('(b) AC-3: a renamed 4-stage table');
{
  const stage = ['<!-- stage-table -->', '| Gate | Stage | Artifacts |', '|---|---|---|',
    '| seed-ok · human · none | **Seed** | `idea.md` |', '| shape-ok · human · none | **Shape** | `spec.md` |',
    '| ship-ok · human · production-deploy | **Ship** | `none` |', '| steer-ok · reviewer · none | **Steer** | `none` |', '<!-- /stage-table -->'].join('\n');
  const d = T(wf({ stage })); const r = run(d, 'derive', '--json');
  const stages = [...new Set((r.json?.rows || []).filter((x) => x.stage !== '§5').map((x) => x.stage))];
  ok('(b) 4 stage ids read from the table, columns keyed by header', stages.join(',') === 'seed,shape,ship,steer', stages.join(','));
  ok('(b) no v0..v6 id anywhere in the output', !/\bv[0-6]\b|"v[0-6]-/.test(r.out), r.out.match(/v[0-6][^"]*/)?.[0]);
}

console.log('(c) no fence → unreadable, fail closed');
{
  const d = T(wf({ stage: '| Stage | Artifacts | Gate |' }));
  const r = run(d, 'derive', '--json').json || {};
  ok('(c) derive reports unreadable with the reason', r.unreadable === true && /stage-table/.test(r.why) && /^unreadable \(2026-10-15\)/.test(r.render.row), JSON.stringify(r).slice(0, 200));
  ok('(c) every effective = required', ['v2-deploy-pipeline', 'v4-ux-audit', 'plan-judge'].every((id) => eff(d, id).cell === 'required'));
  ok('(c) check names `unreadable`', /unreadable: no `<!-- stage-table -->`/.test(run(d, 'check').out));
}

console.log('(d) refused overrides on irreversible gates');
{
  const d = confirmed('- v2-deploy-pipeline: skipped — Baker 2026-10-14 — "no deploy"\n- mission-close: optional — Baker 2026-10-14 — "solo"\n- v4-ux-audit: required — Baker 2026-10-14 — "we do have UI"'); dirs.push(d);
  ok('(d) skipped ci-deploy → `required (override refused: ci-deploy is irreversible)`', eff(d, 'v2-deploy-pipeline').cell === 'required (override refused: ci-deploy is irreversible)', JSON.stringify(eff(d, 'v2-deploy-pipeline')));
  const d2 = confirmed('- v2-deploy-pipeline: optional — Baker 2026-10-14 — "later"'); dirs.push(d2);
  ok('(d) optional on ci-deploy is refused the same way', eff(d2, 'v2-deploy-pipeline').cell === 'required (override refused: ci-deploy is irreversible)');
  ok('(d3) optional on mission-close (release-cut, an action id) → refused', eff(d, 'mission-close').cell === 'required (override refused: release-cut is irreversible)', eff(d, 'mission-close').cell);
  ok('(d) a non-irreversible override applies (v4-ux-audit → required)', eff(d, 'v4-ux-audit').cell === 'required' && /override 2026-10-14/.test(eff(d, 'v4-ux-audit').reason));
  const c = run(d, 'check').out;
  ok('(d) check reports refused-override for both', /refused-override v2-deploy-pipeline/.test(c) && /refused-override mission-close/.test(c), c);
}

console.log('(d2) L6 grammar rules');
{
  const gates = (cell) => `<!-- checkpoint-gates -->\n- ${cell} — note\n- plan-judge · reviewer · none — note\n<!-- /checkpoint-gates -->`;
  const d = T(wf({ gates: gates('x-launch · reviewer · production-deploy+release-cut') }));
  ok('(d2) reviewer-fired action class → `action-class gate not human`', /action-class gate not human x-launch/.test(run(d, 'check').out));
  ok('(d2) … and effective x-launch = required', eff(d, 'x-launch').cell === 'required' && /action-class/.test(eff(d, 'x-launch').reason));
  ok('(d2) a gate id twice in the fences → `duplicate id`, required', /duplicate id v5-launch/.test(run(T(wf({ gates: gates('v5-launch · human · release-cut') })), 'check').out));
  for (const [cell, id] of [['x-gate · reviewer · auth + payments', 'spaces around +'], ['x-gate · reviewer · auth+', 'trailing +'], ['x-gate · reviewer · none+auth', 'none combined'], ['x-gate · reviewer · bogus', 'unknown id']]) {
    const dd = T(wf({ gates: gates(cell) }));
    ok(`(d2) ${id} → \`malformed class list\`, effective required`, /malformed class list/.test(run(dd, 'check').out) && eff(dd, 'x-gate').cell === 'required', run(dd, 'check').out);
  }
  const dv = T(wf({ gates: gates('v5-launch · human · production-deploy+publish-outward+release-cut') }));
  const row = (run(dv, 'derive', '--json').json?.rows || []).find((x) => x.id === 'v5-launch') || {};
  ok('(d2) a valid human v5-launch → no grammar finding, all three classes joined', !/action-class|malformed/.test(run(dv, 'check').out) && /class:production-deploy\+publish-outward\+release-cut$/.test(row.signal) && eff(dv, 'v5-launch').classes?.length === 3, row.signal);
}

console.log('(e) proposed → all required');
{
  const d = fresh(wf()); dirs.push(d); const r = run(d, 'derive', '--json').json;
  writeFileSync(path.join(d, 'docs/WORKFLOW.md'), wf({ row: r.render.row, table: r.render.table }));
  ok('(e) a proposed profile resolves every row to required', r.rows.every((x) => eff(d, x.id).cell === 'required'));
  ok('(e) check says `proposed`', /proposed: /.test(run(d, 'check').out));
}

console.log('(f) drift');
{
  const d = confirmed(); dirs.push(d);
  ok('(f) a freshly confirmed profile is consistent', /profile consistent/.test(run(d, 'check').out), run(d, 'check').out);
  writeFileSync(path.join(d, 'package.json'), JSON.stringify({ dependencies: { stripe: '^14.0.0' } }));
  const c = run(d, 'check').out;
  ok('(f) stripe in package.json → exactly ONE drift line naming the tightened rows', (c.match(/drift:/g) || []).length === 1 && /payments none-found→partial/.test(c) && /tightened .*v4-security-audit/.test(c), c);
  ok('(f) effective v4-security-audit = required', eff(d, 'v4-security-audit').value === 'required');
  const t = readFileSync(path.join(d, 'docs/WORKFLOW.md'), 'utf8');
  writeFileSync(path.join(d, 'docs/WORKFLOW.md'), t.replace('class:ci-deploy |', 'class:none |').replace(/(\| v4-dx-audit \|.*\| )required \|/, '$1skipped |'));
  const c2 = run(d, 'check').out;
  ok('(f) a hand-edited class token → `token mismatch`; a hand-edited effective cell → `effective mismatch`', /token mismatch v2-deploy-pipeline/.test(c2) && /effective mismatch v4-dx-audit/.test(c2), c2);
}

console.log('(g) effective --log');
{
  const d = confirmed(); dirs.push(d);
  const once = run(d, 'effective', 'v4-ux-audit', '--log', '--mission', 'demo');
  const twice = run(d, 'effective', 'v4-ux-audit', '--log', '--mission', 'demo');
  const led = readFileSync(path.join(d, '.plans/demo.state.md'), 'utf8');
  const lines = led.split('\n').filter((l) => /gate v4-ux-audit skipped — ceremony \(/.test(l));
  ok('(g) --log writes exactly one Deviations line; twice-run still one', once.code === 0 && twice.code === 0 && lines.length === 1 && !/\(none\)/.test(led) && /already logged/.test(twice.out), led);
  ok('(g) the line follows the grammar', /^- 2026-10-15 — gate v4-ux-audit skipped — ceremony \(ui: none — no UI surface[^)]*\)$/.test(lines[0] || ''), lines[0]);
  ok('(g) --log without --mission → usage error, exit 1', run(d, 'effective', 'v4-ux-audit', '--log').code === 1);
  ok('(g) --mission JOURNEY prints the line, writes nothing', /^- 2026-10-15 — gate v4-ux-audit skipped/.test(run(d, 'effective', 'v4-ux-audit', '--log', '--mission', 'JOURNEY').out));
  ok('(g) a required gate logs nothing', /the gate runs; nothing logged/.test(run(d, 'effective', 'plan-judge', '--log', '--mission', 'demo').out));
}

console.log('(h) an optional gate the caller does not run (--not-run)');
{
  const d = confirmed('- v4-dx-audit: optional — Baker 2026-10-14 — "solo maintainer"'); dirs.push(d);
  const led = () => readFileSync(path.join(d, '.plans/demo.state.md'), 'utf8');
  const plain = run(d, 'effective', 'v4-dx-audit', '--log', '--mission', 'demo');
  ok('(h) optional without --not-run → the gate runs, nothing logged', plain.code === 0 && /the gate runs; nothing logged/.test(plain.out) && /\(none\)/.test(led()), plain.out);
  const once = run(d, 'effective', 'v4-dx-audit', '--log', '--not-run', '--mission', 'demo');
  const twice = run(d, 'effective', 'v4-dx-audit', '--log', '--not-run', '--mission', 'demo');
  const lines = led().split('\n').filter((l) => /gate v4-dx-audit optional, not run — ceremony \(/.test(l));
  ok('(h) --not-run on optional writes exactly one `optional, not run` line; twice-run still one', once.code === 0 && twice.code === 0 && lines.length === 1 && /already logged/.test(twice.out), led());
  ok('(h) the line follows the grammar and names the override', /^- 2026-10-15 — gate v4-dx-audit optional, not run — ceremony \(override 2026-10-14\)$/.test(lines[0] || ''), lines[0]);
  const req = run(d, 'effective', 'plan-judge', '--log', '--not-run', '--mission', 'demo');
  ok('(h) --not-run on a required gate → refused, exit 2, nothing logged', req.code === 2 && /run the gate/.test(req.out) && !/plan-judge/.test(led()), req.out);
  ok('(h) --not-run without --log → usage error, exit 1', run(d, 'effective', 'v4-dx-audit', '--not-run').code === 1);
  const sk = run(d, 'effective', 'v4-ux-audit', '--log', '--not-run', '--mission', 'demo');
  ok('(h) --not-run on a skipped gate logs the ordinary `skipped` line', sk.code === 0 && /gate v4-ux-audit skipped — ceremony \(/.test(led()), sk.out);
}

for (const d of dirs) rmSync(d, { recursive: true, force: true });
console.log('');
if (fails.length) {
  console.error(`ceremony harness: ${fails.length} failure(s), ${passed} passed`);
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`ceremony harness: clean — ${passed} case(s)`);
