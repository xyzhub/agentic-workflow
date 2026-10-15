#!/usr/bin/env node
// ceremony.mjs — the ceremony profile (§10 `Ceremony profile` row + §10.2) as a
// deterministic tool (adaptive-ceremony, memos D2/D6, locks L3/L5/L6). Zero
// deps; Node >= 18; filesystem only, so conform.mjs may import it in a hook.
//
//   node ceremony.mjs derive [--confirm "<who>"] [--json]
//   node ceremony.mjs effective <id> [--log --mission <name> [--not-run]] [--json]
//   node ceremony.mjs check [--brief] [--strict] [--json]
//   flags: --root <dir> (default cwd) · --fences <file> (default <root>/docs/WORKFLOW.md)
//          --plugin <dir> (gate-classes.md; default this tool's plugin) · --plans <dir>
//          (default <root>/.plans) · --date YYYY-MM-DD (default today)
//
// `derive` reads the §0 `stage-table` and §5 `checkpoint-gates` fences (by header
// name, never a fixed V0–V6 list) plus observable signals, and prints the rows,
// the owner asks and the rendered §10 cell + §10.2 table. It never writes.
// `effective` resolves one id: overrides and owner answers apply, an irreversible
// class refuses `skipped`/`optional`, drift on an irreversible signal tightens,
// and anything not `confirmed` (absent, proposed, unreadable) is `required`.
// `--log` needs `--mission <name>` (`.plans/<name>.state.md`) and appends ONE
// `## Deviations` line per id — `- YYYY-MM-DD — gate <id> skipped — ceremony
// (<signal|override YYYY-MM-DD>)` — only when the cell is `skipped`. `--not-run`
// is the caller saying it will NOT run an `optional` gate: it logs `gate <id>
// optional, not run — ceremony (…)` (one per id); on a `required` gate it is
// refused (exit 2 — run the gate). `--mission JOURNEY` prints the line instead.
// Override and owner-answer lines in §10.2 (an answer's <who> is `asked`):
//   - <id>: <required|optional|skipped> — <who> YYYY-MM-DD — "<why | no answer>"
// Exit codes: 0 done · 1 usage or I/O error · 2 refused (ledger has no
// `## Deviations`, or `--not-run` on a required gate) or `check --strict` with
// findings. `check` is otherwise advisory.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };
const today = () => new Date().toISOString().slice(0, 10);
const cells = (l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const VALUES = ['required', 'optional', 'skipped'];
export class Usage extends Error { constructor(m) { super(m); this.exit = 1; } }
export class Refusal extends Error { constructor(m) { super(m); this.exit = 2; } }

// ── gate-classes.md: the id sets, parsed by the `id` column (never hard-coded) ──
export function readClasses(text) {
  const out = { change: [], action: [], irreversible: new Set() }; if (!text) return null;
  for (const [h, key] of [['## Change classes', 'change'], ['## Action classes', 'action']]) {
    const lines = text.split('\n'), s = lines.findIndex((l) => l.startsWith(h)); if (s < 0) return null;
    const tbl = []; for (let i = s + 1; i < lines.length && !/^## /.test(lines[i]); i++) if (/^\|/.test(lines[i])) tbl.push(cells(lines[i]));
    const hd = tbl[0] || [], ci = hd.indexOf('id'), ii = hd.indexOf('irreversible'); if (ci < 0 || ii < 0) return null;
    for (const r of tbl.slice(2)) { const id = r[ci].replace(/`/g, ''); out[key].push(id); if (r[ii] === 'yes') out.irreversible.add(id); }
  }
  return out;
}

// ── fences: stages, artifacts, gates ─────────────────────────────────────────
const slug = (s) => s.toLowerCase().replace(/\/$/, '').split('/').pop().replace(/\.[a-z]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function fence(text, name) {
  const a = text.indexOf(`<!-- ${name} -->`), b = text.indexOf(`<!-- /${name} -->`);
  return a < 0 || b < a ? null : text.slice(a + name.length + 9, b).split('\n').filter((l) => l.trim());
}
// One gate grammar `<id> · human|reviewer|record · <class>[+<class>]*|none` (gate-classes.md).
export function parseGate(g, stage, cls, findings) {
  const m = g.trim().match(/^([a-z0-9][a-z0-9-]*) · (human|reviewer|record) · (\S.*)$/);
  if (!m) { findings.push(`malformed class list: gate cell "${g.trim().slice(0, 60)}" does not parse — fails closed`); return null; }
  const [, id, firer, list] = m; const known = [...cls.change, ...cls.action];
  const gate = { id, kind: 'gate', stage, firer, classes: [], bad: null };
  if (list === 'none') return gate; const parts = list.split('+');
  if (!/^[a-z0-9-]+(\+[a-z0-9-]+)*$/.test(list) || parts.some((p) => p === 'none' || !known.includes(p))) {
    gate.bad = `malformed class list ${id}: "${list}" — fails closed (required)`; findings.push(gate.bad); return gate;
  }
  gate.classes = parts;
  if (firer !== 'human' && parts.some((p) => cls.action.includes(p))) { gate.bad = `action-class gate not human ${id}: ${firer} fires ${list} — an action class is human-fired (required)`; findings.push(gate.bad); }
  return gate;
}
export function readFences(text, cls) {
  if (!cls) return { unreadable: true, why: 'templates/gate-classes.md is missing or has no id/irreversible columns' };
  if (!text) return { unreadable: true, why: 'docs/WORKFLOW.md not found' };
  const st = fence(text, 'stage-table');
  if (!st) return { unreadable: true, why: 'no `<!-- stage-table -->` fence found under "## 0."' };
  const hd = cells(st[0]); const [si, ai, gi] = ['Stage', 'Artifacts', 'Gate'].map((h) => hd.indexOf(h));
  if (si < 0 || ai < 0 || gi < 0) return { unreadable: true, why: 'the stage table lacks a Stage, Artifacts or Gate header' };
  const findings = [], stages = [], items = [];
  for (const l of st.slice(2)) {
    const r = cells(l); const name = r[si].replace(/\*/g, '').trim(); const id = slug(name.split(/\s+/)[0]);
    const arts = [...r[ai].matchAll(/`([^`]+)`/g)].map((x) => x[1]);
    if (!arts.length) return { unreadable: true, why: `stage ${name}: the Artifacts cell has no backticked paths (use \`none\`)` };
    const paths = arts.length === 1 && arts[0] === 'none' ? [] : arts;
    stages.push({ id, name, paths });
    for (const p of paths) { let aid = `${id}-${slug(p)}`; if (items.some((x) => x.id === aid)) aid += '-artifact'; items.push({ id: aid, kind: 'artifact', stage: id, path: p, classes: [] }); }
    for (const g of r[gi].split(' — ')[0].split('; ')) { const x = parseGate(g, id, cls, findings); if (x) items.push(x); }
  }
  const cg = fence(text, 'checkpoint-gates');
  if (!cg) return { unreadable: true, why: 'no `<!-- checkpoint-gates -->` fence found in §5' };
  for (const l of cg) { const x = parseGate(l.replace(/^- /, '').split(' — ')[0], '§5', cls, findings); if (x) items.push(x); }
  for (const x of items) if (items.filter((y) => y.id === x.id).length > 1 && !x.bad) { x.bad = `duplicate id ${x.id} in the fences — fails closed (required)`; findings.push(x.bad); }
  return { stages, items, findings };
}
export const classOf = (fences, id) => (fences.items || []).find((x) => x.id === id)?.classes ?? null;

// ── §10 profile: row state, §10.2 rows, override / answer lines ──────────────
export function readProfile(text) {
  const s10 = (text || '').match(/^## 10\.[\s\S]*?(?=^## 11\.|^## Local amendments|(?![\s\S]))/m)?.[0] || '';
  const row = s10.split('\n').find((l) => /^\|\s*\*\*Ceremony profile\*\*/.test(l));
  const cell = row ? cells(row)[1] : '';
  const state = !row || cell.startsWith('_(') || /^absent\b/.test(cell) ? 'absent'
    : /^confirmed\b/.test(cell) ? 'confirmed' : /^proposed\b/.test(cell) ? 'proposed' : 'unreadable';
  const blk = (s10.split(/^### 10\.2 /m)[1] || '').split(/^##+ /m)[0].split('\n');
  const tl = blk.filter((l) => /^\|/.test(l)); const hd = tl.length ? cells(tl[0]) : [];
  const rows = tl.slice(2).map((l) => { const r = cells(l); return Object.fromEntries(hd.map((h, i) => [h, r[i] ?? ''])); }).filter((r) => r.id);
  const lines = blk.map((l) => l.match(/^- ([a-z0-9][a-z0-9-]*): (required|optional|skipped) — (.+?) (\d{4}-\d{2}-\d{2}) — "(.*)"\s*$/))
    .filter(Boolean).map(([, id, value, who, date, why]) => ({ id, value, who, date, why }));
  return { state, cell, rows, overrides: lines.filter((o) => o.who !== 'asked'), answers: lines.filter((o) => o.who === 'asked') };
}

// ── signals (memos D2) ──────────────────────────────────────────────────────
const SKIP_DIRS = new Set(['node_modules', 'docs', 'vendor', 'dist', 'build', 'coverage']);
function walk(root, depth = 3, rel = '', out = []) { // ≤ depth 3, dot-dirs and SKIP_DIRS pruned
  let ents = []; try { ents = readdirSync(path.join(root, rel), { withFileTypes: true }); } catch { return out; }
  for (const e of ents.filter((x) => !x.name.startsWith('.') && !SKIP_DIRS.has(x.name))) {
    const p = rel ? `${rel}/${e.name}` : e.name; out.push({ p, dir: e.isDirectory() }); if (e.isDirectory() && depth > 1) walk(root, depth - 1, p, out);
  }
  return out;
}
const SURFACES = {
  auth: { cls: 'auth', path: ['auth', 'login', 'session', 'sessions', 'signin'], dep: ['auth', 'passport', 'lucia', 'clerk', 'jsonwebtoken', 'devise'] },
  payments: { cls: 'payments', path: ['billing', 'payment', 'payments', 'stripe'], dep: ['stripe', 'paddle', 'lemonsqueezy', 'braintree', 'paypal', 'chargebee', 'recurly'] },
  schema: { cls: 'schema-migrations', path: ['prisma', 'migrations', 'migration', 'schema'], dep: ['prisma', 'drizzle', 'typeorm', 'sequelize', 'knex', 'mongoose', 'alembic', 'sqlalchemy', 'activerecord', 'migrate'] },
};
function deps(root) {
  const names = [];
  try { const j = JSON.parse(read(path.join(root, 'package.json'))); for (const k of ['dependencies', 'devDependencies', 'peerDependencies']) names.push(...Object.keys(j[k] || {})); } catch { /* absent */ }
  for (const f of ['pyproject.toml', 'Gemfile', 'go.mod']) for (const m of (read(path.join(root, f)) || '').matchAll(/["']([A-Za-z0-9_.@/-]+)|^\s*(?:require\s+)?([\w.-]+\/[\w./-]+)\s+v\d/gm)) names.push(m[1] || m[2]);
  return names.map((n) => n.toLowerCase());
}
const s10cell = (wf, key) => ((wf || '').split('\n').find((l) => new RegExp(`^\\|\\s*\\*\\*${key}\\*\\*`).test(l)) || '').split('|')[2]?.trim() || '';
export function signals(root, fences, wf) {
  const files = walk(root), dl = deps(root), sig = {};
  for (const [k, s] of Object.entries(SURFACES)) {
    const ph = files.filter((f) => path.basename(f.p).toLowerCase().split(/[._-]/).some((x) => s.path.includes(x))).map((f) => f.p).slice(0, 3);
    const dh = dl.filter((n) => s.dep.some((d) => n.includes(d))).slice(0, 3);
    const state = ph.length && dh.length ? 'present' : ph.length || dh.length ? 'partial' : 'none-found';
    sig[k] = { state, detail: [...ph.map((p) => `path ${p}`), ...dh.map((d) => `dep ${d}`)].join(', ') };
  }
  const ui = files.filter((f) => /\.(tsx|vue|svelte)$/.test(f.p) || (f.dir && path.basename(f.p) === 'app')).map((f) => f.p);
  sig.ui = { state: ui.length ? 'present' : 'none', detail: ui.slice(0, 3).join(', ') };
  const dep = s10cell(wf, 'Deploy \\+ live-verify'); sig.deploy = { state: !dep || dep.startsWith('_(') ? 'unknown' : /^none\b/.test(dep) ? 'none' : 'set', detail: dep.slice(0, 60) };
  const git = path.join(root, '.git'); const heads = path.join(git, 'refs/heads');
  sig.commits = { state: existsSync(path.join(git, 'packed-refs')) || (existsSync(heads) && readdirSync(heads).length > 0) ? 'yes' : 'no' };
  for (const [k, key] of [['test', 'Test policy'], ['publish', 'Publish policy'], ['merge', 'Merge policy'], ['catalog', 'Catalog']]) sig[k] = { state: (s10cell(wf, key).split(/[\s(]/)[0] || 'absent').replace(/`/g, '') };
  let stage = null, tie = false;
  for (const st of fences.stages || []) {
    if (!st.paths.length) continue; const n = st.paths.filter((p) => existsSync(path.join(root, p))).length;
    if (n === st.paths.length) { stage = st.id; tie = false; } else if (n > 0) tie = true;
  }
  sig.stage = { state: stage && !tie ? stage : 'unknown', detail: tie ? 'a later stage is partly present' : stage ? '' : 'no stage has every artifact' };
  return sig;
}
const tok = (sig, k) => `${k}: ${sig[k].state}`;

// ── derive: one row per artifact and gate (defaults required; a skip needs a positive signal) ──
export function derive({ root, fencesText, wf, cls, date = today() }) {
  const fences = readFences(fencesText, cls);
  if (fences.unreadable) return { unreadable: true, why: fences.why, rows: [], asks: [], signals: {}, findings: [], render: { row: `unreadable (${date}) — could not read the stage table (${fences.why}). Every gate runs. Fix the table, then run /agentic-workflow:sync.`, table: '' } };
  const sig = signals(root, fences, wf), asks = [], rows = [];
  const first = (fences.stages || [])[0]?.id;
  if (sig.stage.state === 'unknown') asks.push({ key: 'stage', question: `Which stage is this project at? (${sig.stage.detail})` });
  for (const it of fences.items) {
    const irr = it.classes.filter((c) => cls.irreversible.has(c)); let d = 'required', why = 'default';
    if (it.bad) why = it.bad.split(':')[0] + ' — fails closed';
    else if (irr.length) {
      const surf = Object.keys(SURFACES).filter((k) => irr.includes(SURFACES[k].cls) || irr.includes('security-boundary'));
      why = [...(irr.includes('ci-deploy') ? [tok(sig, 'deploy')] : []), ...surf.map((k) => tok(sig, k)), ...(irr.some((c) => cls.action.includes(c)) ? ['action class: human-fired'] : [])].join(' · ') || 'irreversible';
      why += ` — ${irr[0]} is irreversible, never skipped`;
    } else if (/(^|-)ux(-|$)/.test(it.id) && sig.ui.state === 'none') { d = 'skipped'; why = 'ui: none — no UI surface: no *.tsx/*.vue/*.svelte, no app/ dir'; }
    else if (it.kind === 'gate' && /(^|-)(staging|deploy|verify)(-|$)/.test(it.id) && sig.deploy.state === 'none') { d = 'skipped'; why = 'deploy: none — Deploy: none'; }
    else if (it.kind === 'gate' && it.stage === first && sig.commits.state === 'yes') { d = 'optional'; why = 'repo had commits before adopt'; }
    rows.push({ id: it.id, kind: it.kind, stage: it.stage, derived: d, signal: why + (it.kind === 'gate' ? ` · class:${it.classes.join('+') || 'none'}` : '') });
  }
  for (const k of Object.keys(SURFACES)) {
    const hit = fences.items.some((it) => it.classes.some((c) => c === SURFACES[k].cls || c === 'security-boundary'));
    if (sig[k].state === 'partial' || (sig[k].state === 'none-found' && hit)) asks.push({ key: k, question: `Does this project have any ${k} surface? (probe: ${sig[k].state}${sig[k].detail ? ` — ${sig[k].detail}` : ''})` });
  }
  return { rows, asks, signals: sig, findings: fences.findings, fences };
}

// ── effective: overrides → refusals → drift (tighten-only) ───────────────────
const DRIFT_KEYS = ['deploy', 'auth', 'payments', 'schema', 'ui'], IRR_KEYS = ['deploy', 'auth', 'payments', 'schema'];
const recorded = (signal, k) => (signal.match(new RegExp(`(?:^|· )${k}: (\\S+)`)) || [])[1];
export function resolve(id, { fences, profile, cls, fresh, state = profile.state }) {
  const it = fences.items?.find((x) => x.id === id); const row = profile.rows.find((r) => r.id === id);
  const out = (value, cell, reason) => ({ id, value, cell: cell || value, reason, kind: it?.kind, classes: it?.classes ?? [] });
  if (fences.unreadable) return out('required', null, `stage table unreadable: ${fences.why}`);
  if (!it) return out('required', null, 'not a gate or artifact in the §0/§5 fences — fails closed');
  if (it.bad) return out('required', null, it.bad);
  if (state !== 'confirmed') return out('required', null, `profile ${state} — full ceremony until confirmed`);
  if (!row) return out('required', null, 'no §10.2 row — a gate with no row runs');
  let v = VALUES.includes(row.derived) ? row.derived : 'required', src = row.signal.replace(/ · class:\S+$/, ''), how = 'derived';
  const ans = profile.answers.filter((a) => a.id === id).pop(), ov = profile.overrides.filter((o) => o.id === id).pop();
  if (ans) { v = ans.why === 'no answer' ? 'required' : ans.value; src = `owner answer ${ans.date}`; how = 'answer'; }
  if (ov) { v = ov.value; src = `override ${ov.date}`; how = 'override'; }
  const irr = (it?.classes ?? []).find((c) => cls.irreversible.has(c));
  if (irr && v !== 'required') return out('required', `required (override refused: ${irr} is irreversible)`, `${how} ${v} refused`);
  const fr = fresh?.rows.find((r) => r.id === id);
  const moved = fr ? IRR_KEYS.filter((k) => recorded(row.signal, k) && recorded(row.signal, k) !== fresh.signals[k]?.state) : [];
  if (moved.length && v !== 'required') return out('required', `required (drift: ${moved.join(', ')} — tightened)`, 'irreversible-class signal drifted');
  return out(v, null, src);
}
function driftLine(profile, fresh) {
  const ids = [], moved = new Set(), tight = [];
  for (const r of profile.rows) for (const k of DRIFT_KEYS) {
    const was = recorded(r.signal, k); if (!was || was === fresh.signals[k]?.state) continue;
    if (!ids.includes(r.id)) ids.push(r.id); moved.add(`${k} ${was}→${fresh.signals[k]?.state}`);
    if (IRR_KEYS.includes(k) && !tight.includes(r.id)) tight.push(r.id);
  }
  return ids.length ? `drift: ${ids.length} row(s) — ${[...moved].join(', ')} — ${ids.join(', ')}${tight.length ? ` · irreversible-class signal: tightened ${tight.join(', ')} to required` : ''} — not re-derived; edit §10.2 or run /agentic-workflow:sync` : null;
}

// ── check (AC-12, L5, L6) ───────────────────────────────────────────────────
export function check(o = {}) {
  const c = ctx(o), f = [];
  if (c.profile.state === 'absent') f.push('absent: No ceremony profile. Every gate runs. Run `/agentic-workflow:sync` to propose one.');
  if (c.profile.state === 'proposed') f.push('proposed: the ceremony profile is proposed — full ceremony still applies until you confirm it in §10.');
  if (c.profile.state === 'unreadable') f.push(`unreadable: the §10 Ceremony profile cell "${c.profile.cell.slice(0, 60)}" is not absent/proposed/confirmed — every gate runs`);
  if (c.fences.unreadable) f.push(`unreadable: ${c.fences.why} — every gate runs`);
  else f.push(...c.fences.findings);
  if (c.profile.state === 'confirmed' && !c.fences.unreadable) {
    for (const r of c.profile.rows) {
      const e = resolve(r.id, c);
      if (/override refused/.test(e.cell)) f.push(`refused-override ${r.id}: ${e.cell.replace(/^required \(override refused: |\)$/g, '')}`);
      const it = c.fences.items.find((x) => x.id === r.id);
      if (it?.kind === 'gate' && !it.bad && (r.signal.match(/class:(\S+)\s*$/) || [])[1] !== (it.classes.join('+') || 'none')) f.push(`token mismatch ${r.id}: signal says "${(r.signal.match(/class:\S+/) || ['no class token'])[0]}", the fence says class:${it.classes.join('+') || 'none'}`);
      if (r.effective.split(' ')[0] !== e.value && !/drift/.test(e.cell)) f.push(`effective mismatch ${r.id}: the cell says "${r.effective}", resolution gives "${e.cell}" — only ceremony.mjs writes that column`);
    }
    const d = driftLine(c.profile, c.fresh); if (d) f.push(d);
  }
  return f;
}

// ── CLI ─────────────────────────────────────────────────────────────────────
export function ctx(o) {
  const root = path.resolve(o.root || process.cwd()), date = o.date || today();
  const wf = read(path.join(root, 'docs/WORKFLOW.md')), fencesText = o.fences ? read(path.resolve(o.fences)) : wf;
  const cls = readClasses(read(path.join(o.plugin || path.join(HERE, '..'), 'templates/gate-classes.md')));
  const fresh = derive({ root, fencesText, wf, cls, date });
  return { root, date, wf, cls, fresh, fences: fresh.unreadable ? { unreadable: true, why: fresh.why } : fresh.fences, profile: readProfile(wf) };
}
export function render(c, confirm) {
  if (c.fresh.unreadable) return c.fresh.render;
  const state = confirm || c.profile.state === 'confirmed' ? 'confirmed' : 'proposed', n = Object.keys(c.fresh.signals).length;
  const profile = { ...c.profile, rows: c.fresh.rows };
  const row = state === 'proposed' ? `proposed ${c.date} — full ceremony still applies until you confirm. Review the ceremony table below, then say "confirm ceremony profile".`
    : `confirmed ${c.date} by ${confirm || (c.profile.cell.match(/ by (.+?) ·/) || [, 'owner'])[1]} · derived ${c.date} from ${n} signals · ${c.profile.overrides.length} overrides`;
  const body = c.fresh.rows.map((r) => `| ${r.id} | ${r.kind} | ${r.stage} | ${r.derived} | ${r.signal} | ${resolve(r.id, { ...c, profile, state }).cell} |`);
  return { row, table: ['| id | kind | stage | derived | signal | effective |', '|---|---|---|---|---|---|', ...body].join('\n') };
}
function logLine(o, e, c) {
  if (!o.mission) throw new Usage('--log requires --mission <name> (the ledger is named, never guessed; --mission JOURNEY prints the line)');
  if (o['not-run'] && e.value === 'required') throw new Refusal(`${e.id} is ${e.cell} — run the gate; --not-run applies only to an optional gate, nothing logged`);
  const what = e.value === 'skipped' ? 'skipped' : e.value === 'optional' && o['not-run'] ? 'optional, not run' : null;
  if (!what || e.kind !== 'gate') return `${e.id}: ${e.cell} — the gate runs; nothing logged`;
  const line = `- ${c.date} — gate ${e.id} ${what} — ceremony (${e.reason})`;
  if (o.mission === 'JOURNEY') return line;
  const p = path.join(o.plans || path.join(c.root, '.plans'), `${o.mission}.state.md`), t = read(p);
  if (t === null) throw new Usage(`no ledger at ${p}`);
  const L = t.split('\n'), s = L.findIndex((l) => /^## Deviations/.test(l));
  if (s < 0) throw new Refusal(`${p} has no \`## Deviations\` section`);
  let end = L.findIndex((l, i) => i > s && /^## /.test(l)); if (end < 0) end = L.length;
  if (L.slice(s, end).some((l) => l.includes(`gate ${e.id} ${what} — ceremony (`))) return `already logged: gate ${e.id} ${what} (one line per id per ledger)`;
  const none = L.findIndex((l, i) => i > s && i < end && l.trim() === '(none)');
  if (none >= 0) L[none] = line; else { let at = end; while (at > s + 1 && !L[at - 1].trim()) at--; L.splice(at, 0, line); }
  writeFileSync(p, L.join('\n')); return `logged in ${path.relative(c.root, p) || p}: ${line}`;
}
export function main(argv = process.argv.slice(2)) {
  const o = { pos: [] };
  try {
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i], val = () => { if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Usage(`${a} needs a value`); return argv[++i]; };
      if (['--root', '--fences', '--plugin', '--plans', '--date', '--mission', '--confirm'].includes(a)) o[a.slice(2)] = val();
      else if (['--json', '--log', '--brief', '--strict', '--not-run'].includes(a)) o[a.slice(2)] = true;
      else if (a === '--help' || a === '-h') o.help = true;
      else if (a.startsWith('--')) throw new Usage(`unknown flag ${a}`); else o.pos.push(a);
    }
    if (o.help) { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 29).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); return 0; }
    const [verb, id] = o.pos;
    if (o.date && !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) throw new Usage('--date needs YYYY-MM-DD');
    if (verb === 'derive') {
      const c = ctx(o), r = render(c, o.confirm), d = c.fresh;
      console.log(o.json ? JSON.stringify({ unreadable: !!d.unreadable, why: d.why, signals: d.signals, rows: d.rows, asks: d.asks, findings: d.findings, render: r }, null, 2) : `Ceremony profile: ${r.row}\n\n${r.table}\n\nasks (${d.asks.length}):${d.asks.map((a) => `\n  - ${a.question}`).join('') || ' none'}`); return 0;
    }
    if (verb === 'effective') {
      if (!id) throw new Usage('usage: ceremony.mjs effective <id> [--log --mission <name> [--not-run]]');
      if (o['not-run'] && !o.log) throw new Usage('--not-run needs --log (it records the decision not to run an optional gate)');
      const c = ctx(o), e = resolve(id, c), msg = o.log ? logLine(o, e, c) : null;
      console.log(o.json ? JSON.stringify({ ...e, logged: msg }, null, 2) : msg ?? `${e.id}: ${e.cell} — ${e.reason}`); return 0;
    }
    if (verb === 'check') {
      const f = check(o);
      console.log(o.json ? JSON.stringify({ findings: f }, null, 2) : !f.length ? 'ceremony: profile consistent'
        : o.brief ? `ceremony: ${f.length} finding(s) — ${f[0]}` : `ceremony: ${f.length} finding(s)\n${f.map((x) => `  - ${x}`).join('\n')}`);
      return o.strict && f.length ? 2 : 0;
    }
    throw new Usage('usage: ceremony.mjs derive | effective <id> | check  (--help for flags)');
  } catch (e) { console.error(`ceremony: ${e.message}`); return e.exit ?? 1; }
}
const isEntry = () => { try { return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } };
if (isEntry()) process.exit(main());
