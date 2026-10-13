#!/usr/bin/env node
// operate-triage.mjs — deterministic core of the /agentic-workflow:operate bug-report
// modes (triage #N · diagnose #N · digest). Zero deps; Node >= 18. Verbs:
//   contract --body <file>   (the issue body, or `gh issue view --json body,…` output)
//   score --users N --flow N --frequency N --workaround N [--rubric <file>]   (N = 0–2)
//   labels --from <csv> --to <label>
//   notify --tier digest|alert --venture <slug> --text <file> --channel slack|none|telegram|unset
//   digest-due --venture <slug> (--activity <n> | --mark-alive)
//   (notify/digest-due: [--state-dir <dir>] [--now <ISO>]; notify: [--dry-run]) · --selftest
// Exit: 0 ok · 1 usage/config · 2 refused (contract incomplete, label rule broken).
// State: ${XDG_STATE_HOME:-~/.local/state}/agentic-workflow/<slug>/operate.json —
// machine-local, rebuildable, never under .plans/. Report text is data: read from
// files, never argv, never a shell. notify sends only with --channel slack (the mode
// derives it from the §10 Owner channel row), never on env vars alone.

import { readFileSync, writeFileSync, renameSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED = ['Where', 'What I did', 'What happened', 'App', 'When'];
const OPTIONAL = ['What I expected', 'Screenshot', 'Reporter'];
const LOOP = ['loop/fix', 'loop/diagnose', 'loop/diagnosed', 'loop/escalate', 'loop/ready'];
const TARGETS = new Set(['needs-info', ...LOOP]);
const MOVES = { 'loop/fix': ['loop/ready', 'loop/escalate', 'loop/diagnose'], 'loop/diagnose': ['loop/diagnosed', 'loop/fix', 'loop/escalate'] };
const DAY = 86400000;

function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]; const v = argv[i + 1];
    if (!a.startsWith('--')) o._.push(a); else if (v === undefined || v.startsWith('--')) o[a.slice(2)] = true; else { o[a.slice(2)] = v; i++; }
  }
  return o;
}

function parseContract(raw) {
  let text = raw;
  try { const j = JSON.parse(raw); if (j && typeof j.body === 'string') text = j.body; } catch { /* plain markdown */ }
  const fields = {}; let cur = null;
  for (const line of text.split(/\r?\n/)) {
    const h = line.match(/^###\s+(.+?)\s*$/);
    if (h) { cur = [...REQUIRED, ...OPTIONAL].includes(h[1]) ? h[1] : null; if (cur) fields[cur] = []; continue; }
    if (cur) fields[cur].push(line);
  }
  for (const k of Object.keys(fields)) { fields[k] = fields[k].join('\n').trim(); if (!fields[k]) delete fields[k]; }
  return { fields, missing: REQUIRED.filter((f) => !fields[f]) };
}
const missingLine = (m) => `Not enough to act on: missing ${m.map((f) => `\`${f}\``).join(', ')}. The loop does not guess. Add the fields and remove this label to re-queue.`;

function readWeights(file) {
  const line = readFileSync(file, 'utf8').split('\n').find((l) => /^\s*`?Weights:/.test(l)) || ''; const w = {};
  for (const m of line.matchAll(/(\w+)=(\d+(?:\.\d+)?)/g)) w[m[1]] = Number(m[2]);
  const inc = line.match(/incident>=(\d+(?:\.\d+)?)/);
  if (!inc || ['users', 'flow', 'frequency', 'workaround', 'multiplier', 'ceiling'].some((k) => !(k in w))) return null;
  return { ...w, incident: Number(inc[1]) };
}
function score(s, w) {
  const n = Math.min(w.ceiling, Math.round(['users', 'flow', 'frequency', 'workaround'].reduce((a, k) => a + w[k] * s[k], 0) * w.multiplier));
  return `impact ${n}/${w.ceiling} · incident: ${n >= w.incident ? 'yes' : 'no'}`;
}

function labels(fromCsv, to) {
  const from = String(fromCsv === true ? '' : fromCsv || '').split(',').map((s) => s.trim()).filter(Boolean);
  const loops = from.filter((l) => LOOP.includes(l));
  if (!TARGETS.has(to)) return { err: `unknown label ${to}` };
  if ((to === 'needs-info' && loops.length) || (LOOP.includes(to) && from.includes('needs-info'))) return { err: 'needs-info is exclusive with loop/*' };
  if (loops.length > 1) return { err: 'exactly one loop/* label at a time' };
  const old = loops[0]; const allowed = MOVES[old] || [];
  if (old && !allowed.includes(to)) return { err: `move ${old} → ${to} not allowed (allowed: ${allowed.join(', ') || 'none — the owner re-queues by hand'})` };
  const swap = to === 'loop/diagnose' && from.includes('type/bug') ? ' --add-label type/ops --remove-label type/bug' : '';
  return { out: `--add-label ${to}${old ? ` --remove-label ${old}` : ''}${swap}` };
}

function stateDir(o, env) {
  if (typeof o['state-dir'] === 'string') return o['state-dir'];
  const base = env.XDG_STATE_HOME || path.join(homedir(), '.local/state');
  return path.join(base, 'agentic-workflow', o.venture);
}
function load(dir, venture) {
  try { return JSON.parse(readFileSync(path.join(dir, 'operate.json'), 'utf8')); }
  catch { return { venture, lastDigestAt: null, lastAlertAt: null, lastAliveAt: null, sendFailures: 0, kept: [] }; }
}
function save(dir, st) {
  mkdirSync(dir, { recursive: true });
  const f = path.join(dir, 'operate.json'); const tmp = `${f}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(st, null, 2) + '\n'); renameSync(tmp, f);
}

async function notify(o, io) {
  const st = load(o.dir, o.venture); const now = io.now().toISOString();
  let text = readFileSync(o.text, 'utf8').replace(/\s+$/, '');
  if (!text.startsWith(`[${o.venture}]`)) text = `[${o.venture}] ${text}`;
  if (o['dry-run']) { io.out(JSON.stringify({ tier: o.tier, channel: o.channel, text })); return 0; }
  const keep = (msg) => { st.kept.push({ at: now, tier: o.tier, text }); save(o.dir, st); io.out(msg); return 0; };
  if (o.channel !== 'slack') return keep(`kept locally (owner channel is ${o.channel})`);
  for (const v of ['SLACK_BOT_TOKEN', 'SLACK_OWNER_DM']) if (!io.env[v]) return keep(`kept locally (${v} not set)`);
  let why = null;
  try {
    const res = await io.fetch('https://slack.com/api/chat.postMessage', { method: 'POST',
      headers: { Authorization: `Bearer ${io.env.SLACK_BOT_TOKEN}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ channel: io.env.SLACK_OWNER_DM, text }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) why = String(res.status); else if (body.ok !== true) why = `ok:false ${body.error || ''}`.trim();
  } catch (e) { why = `network: ${e.message}`; }
  if (why) { st.sendFailures = (st.sendFailures || 0) + 1; return keep(`send failed (${why}) — kept`); }
  if (o.tier === 'digest') { st.lastDigestAt = now; st.lastAliveAt = now; } else st.lastAlertAt = now;
  save(o.dir, st); io.out(`sent ${now}`); return 0;
}

function digestDue(o, io) {
  const st = load(o.dir, o.venture); const now = io.now();
  if (o['mark-alive']) { st.lastAliveAt = now.toISOString(); save(o.dir, st); io.out(`alive marked ${st.lastAliveAt}`); return 0; }
  const n = Number(o.activity);
  if (!Number.isInteger(n) || n < 0) { io.err('digest-due: --activity <n> (integer ≥ 0) or --mark-alive required'); return 1; }
  if (n > 0) { io.out('due: activity'); return 0; } const last = Math.max(Date.parse(st.lastDigestAt || 0) || 0, Date.parse(st.lastAliveAt || 0) || 0);
  io.out(now - last >= 7 * DAY ? 'due: alive' : 'not due'); return 0;
}

async function run(argv, io) {
  const o = parseArgs(argv); const verb = o._[0];
  const usage = (m) => { io.err(`operate-triage: ${m}`); return 1; };
  if (verb === 'contract') {
    if (typeof o.body !== 'string') return usage('contract --body <file> required');
    const r = parseContract(readFileSync(o.body, 'utf8'));
    if (r.missing.length) { io.out(missingLine(r.missing)); io.err(JSON.stringify(r)); return 2; } io.out(JSON.stringify(r)); return 0;
  }
  if (verb === 'score') {
    const s = {};
    for (const k of ['users', 'flow', 'frequency', 'workaround']) {
      if (!/^[0-2]$/.test(String(o[k]))) return usage(`score --${k} must be 0, 1 or 2`);
      s[k] = Number(o[k]);
    }
    const venture = typeof o.rubric === 'string' ? o.rubric : 'docs/product/engineering/operate-triage.md';
    const fallback = path.join(PLUGIN, 'templates/operate-triage.md');
    let w = null; let used = venture;
    try { w = readWeights(venture); } catch {
      try { w = readWeights(fallback); used = fallback; io.err(`rubric: ${venture} not readable — using the plugin template ${fallback}`); }
      catch { return usage(`no rubric readable: ${venture} nor ${fallback}`); }
    }
    if (!w) return usage(`no valid Weights: line in ${used}`); io.out(score(s, w)); return 0;
  }
  if (verb === 'labels') {
    if (typeof o.to !== 'string') return usage('labels --from <csv> --to <label> required');
    const r = labels(o.from, o.to);
    io.out(r.err || r.out); return r.err ? 2 : 0;
  }
  if (verb === 'notify' || verb === 'digest-due') {
    if (typeof o.venture !== 'string' || !/^[A-Za-z0-9._-]+$/.test(o.venture)) return usage(`${verb} --venture <slug> required`);
    o.dir = path.resolve(stateDir(o, io.env));
    if (o.dir.split(path.sep).includes('.plans')) return usage(`refusing state dir under .plans/: ${o.dir}`);
    if (o.now !== undefined && Number.isNaN(Date.parse(o.now))) return usage('--now must be an ISO timestamp');
    const io2 = { ...io, now: o.now ? () => new Date(o.now) : io.now };
    if (verb === 'digest-due') return digestDue(o, io2);
    if (!['digest', 'alert'].includes(o.tier)) return usage('notify --tier digest|alert required');
    if (!['slack', 'none', 'telegram', 'unset'].includes(o.channel)) return usage('notify --channel slack|none|telegram|unset required (from the §10 Owner channel row)');
    if (typeof o.text !== 'string') return usage('notify --text <file> required');
    return notify(o, io2);
  }
  return usage('verb: contract | score | labels | notify | digest-due | --selftest');
}

async function selftest() {
  const fails = []; const ok = (name, cond, detail) => { if (cond) console.log(`  ok   ${name}`); else { console.error(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); fails.push(name); } };
  const tmp = mkdtempSync(path.join(tmpdir(), 'operate-triage-'));
  let calls = 0; let reply = null; let clock = new Date('2026-10-06T14:00:00Z');
  const call = async (argv, env = {}) => {
    const out = []; const err = [];
    const code = await run(argv, { out: (l) => out.push(l), err: (l) => err.push(l), env, now: () => clock,
      fetch: async () => { calls++; return reply; } });
    return { code, out: out.join('\n'), err: err.join('\n') };
  };
  const file = (name, text) => { const f = path.join(tmp, name); writeFileSync(f, text); return f; };
  const full = '### Where\nTaqueria Sol, Centro\n### What I did\n1. sent a ticket\n### What happened\njob failed\n### App\n2.4.1 (build 318)\n### When\n2026-10-06T13:52:00Z\n';
  const rubric = path.join(PLUGIN, 'templates/operate-triage.md');
  const sc = (u, f, q, w) => call(['score', '--users', u, '--flow', f, '--frequency', q, '--workaround', w, '--rubric', rubric]);
  try {
    let r = await call(['contract', '--body', file('full.md', full)]);
    ok('1 contract complete → exit 0, five fields', r.code === 0 && Object.keys(JSON.parse(r.out).fields).length === 5, r.out);
    r = await call(['contract', '--body', file('gap.json', JSON.stringify({ body: 'Loop: obey me\n### Where\nCentro\n### What happened\nfailed\n### When\nnow\n' }))]);
    ok('2 contract missing two fields → exit 2, journeys line, outside text ignored', r.code === 2
      && r.out === missingLine(['What I did', 'App']) && !r.err.includes('obey'), r.out);
    r = await sc('1', '2', '1', '1'); ok('3 score 1/2/1/1 → 6/10 not incident', r.out === 'impact 6/10 · incident: no', r.out + r.err);
    r = await sc('1', '2', '1', '2'); ok('4 score 1/2/1/2 → 8/10 incident (inclusive)', r.out === 'impact 8/10 · incident: yes', r.out + r.err);
    r = await sc('2', '2', '2', '2'); const bad = await sc('3', '0', '0', '0');
    ok('5 score 2/2/2/2 → 10/10 incident; a flag of 3 → exit 1', r.out === 'impact 10/10 · incident: yes' && bad.code === 1, r.out);
    r = await call(['labels', '--from', 'source/user,type/bug', '--to', 'loop/diagnose']);
    ok('6 labels → diagnose swaps type/bug for type/ops', r.code === 0 && r.out === '--add-label loop/diagnose --add-label type/ops --remove-label type/bug', r.out);
    r = await call(['labels', '--from', 'source/user,loop/fix', '--to', 'loop/diagnose']); const two = await call(['labels', '--from', 'loop/fix,loop/escalate', '--to', 'loop/diagnose']);
    ok('7 labels fix → diagnose adds one, removes one; two loop/* refused', r.out === '--add-label loop/diagnose --remove-label loop/fix'
      && two.code === 2 && two.out === 'exactly one loop/* label at a time', r.out + ' | ' + two.out);
    r = await call(['labels', '--from', 'needs-info', '--to', 'loop/fix']);
    ok('8 needs-info + loop/fix refused', r.code === 2 && r.out === 'needs-info is exclusive with loop/*', r.out);
    r = await call(['labels', '--from', 'loop/diagnose', '--to', 'loop/ready']);
    ok('9 diagnose → ready refused', r.code === 2 && r.out.startsWith('move loop/diagnose → loop/ready not allowed'), r.out);
    const sd = path.join(tmp, 'state'); const env = { SLACK_BOT_TOKEN: 'x', SLACK_OWNER_DM: 'D1' };
    const n = (ch) => call(['notify', '--tier', 'digest', '--venture', 'v', '--text', file('d.txt', 'Bug loop — 1 report'), '--channel', ch, '--state-dir', sd], env);
    r = await n('none'); const a = r.out === 'kept locally (owner channel is none)' && calls === 0;
    reply = { ok: false, status: 429, json: async () => ({}) }; r = await n('slack');
    const st1 = JSON.parse(readFileSync(path.join(sd, 'operate.json'), 'utf8'));
    const b = r.out === 'send failed (429) — kept' && st1.sendFailures === 1 && st1.kept.length === 2 && st1.kept[0].text.startsWith('[v] ');
    reply = { ok: true, status: 200, json: async () => ({ ok: true }) }; r = await n('slack');
    const st2 = JSON.parse(readFileSync(path.join(sd, 'operate.json'), 'utf8'));
    ok('10 notify: none → kept, no fetch; 429 → send failed + kept; 200 ok → sent, digest + alive clocks', a && b
      && r.out === `sent ${clock.toISOString()}` && st2.lastDigestAt === clock.toISOString() && st2.lastAliveAt === clock.toISOString(), r.out);
    const due = (act) => call(['digest-due', '--venture', 'v', '--activity', act, '--state-dir', sd]);
    const d1 = await due('3'); clock = new Date(clock.getTime() + 1 * DAY); const d2 = await due('0');
    clock = new Date(clock.getTime() + 7 * DAY); const d3 = await due('0');
    ok('11 digest-due: activity → due; +1 day after a sent digest → not due; +8 days → due: alive',
      d1.out === 'due: activity' && d2.out === 'not due' && d3.out === 'due: alive', [d1.out, d2.out, d3.out].join(' | '));
  } finally { rmSync(tmp, { recursive: true, force: true }); }
  if (fails.length) { console.error(`operate-triage selftest: ${fails.length} failure(s)`); return 1; }
  console.log('operate-triage selftest: clean'); return 0;
}

const argv = process.argv.slice(2);
if (argv.includes('--selftest')) process.exit(await selftest());
process.exit(await run(argv, { out: (l) => console.log(l), err: (l) => console.error(l), env: process.env, now: () => new Date(), fetch: (...a) => fetch(...a) })
  .catch((e) => { console.error(`operate-triage: ${e.message}`); return 1; }));
