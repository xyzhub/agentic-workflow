#!/usr/bin/env node
// publish-gate.mjs — the §14 publish gate: hash-pinned approval + a one-time claim token.
// Zero deps; Node >= 18. The runtime-agnostic invariant every runtime obeys; the §3 hook
// (hooks/lib/publish-guard.sh) is the Claude-side backstop, and inside Codex this is the
// ONLY mechanical publish check.
//
//   node publish-gate.mjs stamp                      recompute hashes; drift → epoch+1, approved → draft
//   node publish-gate.mjs approve <id>               pin approved-for: <sha8>@<epoch> (prints the body)
//   node publish-gate.mjs claim <id> [--by human|"may-publish (delegated <date>)"] [--paid-confirmed-by-human]
//                                                    mint a one-time token; last stdout line PUBLISH_CLAIM=<token>
//   node publish-gate.mjs dispatch <token>           re-hash; claimed → dispatching (right before the network call)
//   node publish-gate.mjs outcome <token> delivered --permalink <url> | outcome <token> unknown
//   node publish-gate.mjs reconcile <id> --delivered <url> | --cancel     (claimed | dispatching | unknown)
//   node publish-gate.mjs status                     the "Needs you / Ready to fire / Drafts" block
//   node publish-gate.mjs --selftest
//
// Options: --queue --claims --workflow <path> (defaults docs/product/launch/publish-queue.md,
// docs/product/launch/publish-claims.jsonl, docs/WORKFLOW.md, resolved against the git
// toplevel with cwd as the fallback — the SAME contract as the hook, so the two read the same
// files); --now <ISO> (tests). Exit: 0 ok · 2 REFUSED (reason on stderr; a REFUSED/reset line
// also on stdout) · 4 queue unparseable (line number; nothing written) · 1 usage / missing file.
//
// Threat model (§14): ACCIDENT — a body edited after approval, a run that fires twice, a crash
// between post and record — not an adversarial agent. The queue is the human-reviewed truth for
// content; publish-claims.jsonl is the append-only machine truth for state. Queue/log writes are
// full-file temp + rename under an O_EXCL lock; the jsonl line is appended AFTER the queue write,
// so a crash leaves no open token the hook would honour. A row whose id cell is italic
// (`_P-001_`) is a template example: migrated with the table, never gated or listed.

import { readFileSync, writeFileSync, renameSync, appendFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, openSync, closeSync, unlinkSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const COLS = ['id', 'kind', 'channel', 'scheduled (UTC)', 'state', 'paid', 'body-sha256', 'epoch', 'approved-for', 'claim', 'source asset', 'summary'];
const OLD = ['id', 'channel', 'scheduled (UTC)', 'state', 'paid', 'source asset', 'summary'];
const LOG_COLS = ['posted (UTC)', 'kind', 'channel', 'permalink', 'source asset', 'fired by', 'paid', 'claim'];
const OLD_LOG = ['posted (UTC)', 'channel', 'permalink', 'source asset', 'fired by', 'paid'];
const [, KIND, CHANNEL, SCHED, STATE, PAID, SHA, EPOCH, PIN, CLAIM, SOURCE, SUMMARY] = COLS.keys();
const OPEN = ['claimed', 'dispatching', 'unknown'];
const RECEIPT = ['claimed', 'dispatching', 'delivered', 'unknown', 'posted'];
const DEF = { queue: 'docs/product/launch/publish-queue.md', claims: 'docs/product/launch/publish-claims.jsonl', workflow: 'docs/WORKFLOW.md' };
const USAGE = 'usage: publish-gate.mjs stamp | approve <id> | claim <id> [--by …] [--paid-confirmed-by-human] | dispatch <token> | outcome <token> delivered --permalink <url> | outcome <token> unknown | reconcile <id> --delivered <url> | reconcile <id> --cancel | status | --selftest';

class Exit extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const refuse = (msg) => { throw new Exit(2, msg); };
const low = (a) => a.map((s) => s.toLowerCase()).join('|');
const render = (c) => `| ${c.join(' | ')} |`;
const sepRow = (c) => `|${c.map(() => '---').join('|')}|`;

// ── hashing: CRLF→LF, each line right-trimmed, trailing blank lines dropped, no final newline
export const norm = (t) => t.replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd()).join('\n').replace(/\n+$/, '');
export const sha = (t) => createHash('sha256').update(norm(t)).digest('hex');

// ── parsing ───────────────────────────────────────────────────────────────
function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  const out = []; let cur = '';
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\' && s[i + 1] === '|') { cur += '\\|'; i++; } else if (s[i] === '|') { out.push(cur.trim()); cur = ''; } else cur += s[i];
  }
  out.push(cur.trim());
  return out;
}

function findTable(lines, first, file) {
  const h = lines.findIndex((l) => l.trim().startsWith('|') && splitRow(l)[0].toLowerCase() === first);
  if (h < 0) return null;
  const sep = lines[h + 1] ?? '';
  if (!/^\s*\|?[\s:|-]+\|?\s*$/.test(sep) || !sep.includes('-')) throw new Exit(4, `${file}:${h + 2}: table header is not followed by a |---| separator`);
  const rows = [];
  for (let i = h + 2; i < lines.length && lines[i].trim().startsWith('|'); i++) rows.push(i);
  return { h, rows };
}

export function parseQueue(text, file) {
  const lines = text.split('\n').map((l) => l.replace(/\r$/, ''));
  const t = findTable(lines, 'id', file);
  if (!t) throw new Exit(4, `${file}: no queue table (a header starting "| id |")`);
  const head = low(splitRow(lines[t.h]));
  const old = head === low(OLD);
  if (!old && head !== low(COLS)) throw new Exit(4, `${file}:${t.h + 1}: unrecognised queue header — want ${render(COLS)}`);
  const want = old ? OLD.length : COLS.length;
  const rows = t.rows.map((ln) => {
    const c = splitRow(lines[ln]);
    if (c.length !== want) throw new Exit(4, `${file}:${ln + 1}: row has ${c.length} cells, expected ${want}`);
    const cells = old ? [c[0], '', c[1], c[2], c[3], c[4], '', '', '', '', c[5], c[6]] : c;
    return { ln, cells, id: c[0], example: /^[_*].*[_*]$/.test(c[0]), dirty: old };
  });
  const bodies = new Map();
  for (let i = 0; i < lines.length; i++) {
    const m = /^### +([A-Za-z0-9][\w.-]*)/.exec(lines[i]);
    if (!m) continue;
    let j = i + 1;
    while (j < lines.length && !lines[j].startsWith('### ') && lines[j].trim() !== '---') j++;
    if (bodies.has(m[1])) throw new Exit(4, `${file}:${i + 1}: duplicate body section ### ${m[1]}`);
    bodies.set(m[1], { heading: lines[i], text: lines.slice(i + 1, j).join('\n') });
  }
  const seen = new Set();
  for (const r of rows.filter((x) => !x.example)) {
    const where = `${file}:${r.ln + 1}`;
    if (seen.has(r.id)) throw new Exit(4, `${where}: duplicate id ${r.id}`);
    seen.add(r.id);
    if (!bodies.has(r.id)) throw new Exit(4, `${where}: ${r.id} has no "### ${r.id}" body section`);
    if (!/^(\d+)?$/.test(r.cells[EPOCH])) throw new Exit(4, `${where}: epoch '${r.cells[EPOCH]}' is not a number`);
    if (!/^([0-9a-f]{64})?$/.test(r.cells[SHA])) throw new Exit(4, `${where}: body-sha256 '${r.cells[SHA]}' is not 64 hex`);
  }
  return { file, text, lines, h: t.h, old, rows, bodies };
}

// ── io ────────────────────────────────────────────────────────────────────
function atomicWrite(file, text) {
  const tmp = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.tmp`);
  writeFileSync(tmp, text);
  renameSync(tmp, file);
}

function saveQueue(q) {
  if (q.old) { q.lines[q.h] = render(COLS); q.lines[q.h + 1] = sepRow(COLS); }
  for (const r of q.rows) if (r.dirty) q.lines[r.ln] = render(r.cells);
  atomicWrite(q.file, q.lines.join('\n'));
}

function readClaims(ctx) {
  if (!existsSync(ctx.claims)) return [];
  return readFileSync(ctx.claims, 'utf8').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
}

function writeEvent(ctx, e) {
  const rec = { ts: ctx.iso, event: e.event, id: e.id, kind: e.kind || null, sha8: e.sha8 || null, epoch: e.epoch ?? null, token: e.token || null, run: e.run || null, by: e.by || ctx.by, note: e.note || null };
  mkdirSync(path.dirname(ctx.claims), { recursive: true });
  appendFileSync(ctx.claims, JSON.stringify(rec) + '\n');
}

// Load under a lock, run fn; a REFUSED (exit 2) still persists the stamp/reset it made.
function mutate(ctx, fn) {
  if (!existsSync(ctx.queue)) throw new Exit(1, `no queue at ${ctx.queue} — run /agentic-workflow:publish stage`);
  const lock = `${ctx.queue}.lock`;
  let fd;
  try { fd = openSync(lock, 'wx'); } catch (e) {
    if (e.code === 'EEXIST') refuse(`queue is locked by another publish-gate run (${lock}) — if no run is live, delete the lock and retry`);
    throw e;
  }
  try {
    const q = parseQueue(readFileSync(ctx.queue, 'utf8'), ctx.queue);
    let thrown;
    try { fn(q); } catch (e) { if (!(e instanceof Exit) || e.code !== 2) throw e; thrown = e; }
    if (q.old || q.rows.some((r) => r.dirty)) saveQueue(q);
    for (const e of ctx.events) writeEvent(ctx, e);
    if (thrown) throw thrown;
  } finally { closeSync(fd); try { unlinkSync(lock); } catch { /* already gone */ } }
}

// ── row logic ─────────────────────────────────────────────────────────────
const pinOf = (c) => { const m = /^([0-9a-f]{8})@(\d+)$/.exec(c[PIN]); return m ? [m[1], +m[2]] : null; };
const setter = (r) => (i, v) => { if (r.cells[i] !== v) { r.cells[i] = v; r.dirty = true; } };
const runOf = (ctx, tok) => readClaims(ctx).filter((e) => tok && e.token === tok && e.run).pop()?.run;
const ev = (r, extra) => ({ id: r.id, kind: r.cells[KIND], sha8: r.cells[SHA].slice(0, 8), epoch: +r.cells[EPOCH] || null, ...extra });

// Returns the REFUSED line when the stamp reset an approved row (hash drift), else null.
function stampRow(ctx, q, r) {
  const c = r.cells, set = setter(r);
  if (!c[KIND]) set(KIND, 'post');
  const cur = sha(q.bodies.get(r.id).text), ep = +c[EPOCH] || 0;
  if (!c[SHA]) { set(SHA, cur); set(EPOCH, String(ep || 1)); return null; }
  if (c[SHA] === cur) { if (!ep) set(EPOCH, '1'); return null; }
  const [a8, an] = pinOf(c) ?? [c[SHA].slice(0, 8), ep || 1];
  const ne = (ep || 1) + 1;
  set(SHA, cur); set(EPOCH, String(ne));
  if (c[STATE] === 'approved') {
    set(STATE, 'draft'); set(PIN, '');
    const line = `publish run: REFUSED ${r.id} approved@${a8}/e${an}, current ${cur.slice(0, 8)}/e${ne} -> reset to draft`;
    ctx.out.push(line);
    ctx.events.push(ev(r, { event: 'reset', note: `body changed after approval (approved@${a8}/e${an})` }));
    return line;
  }
  if (RECEIPT.includes(c[STATE])) ctx.out.push(`WARNING ${r.id}: body changed while ${c[STATE]} — reconcile by hand`);
  return null;
}

const rowById = (q, id) => q.rows.find((x) => !x.example && x.id === id);
function rowByToken(q, tok) {
  if (!/^[0-9a-f]{8}$/.test(tok ?? '')) throw new Exit(1, 'a claim token is 8 lowercase hex');
  return q.rows.find((x) => !x.example && x.cells[CLAIM].split(/\s+/)[0] === tok) ?? refuse(`no queue row holds claim ${tok} — a token fires once`);
}

function policy(ctx, q) {
  let m;
  if (existsSync(ctx.workflow)) m = /^\|\s*\*\*Publish policy\*\*\s*\|([^|\n]*)\|/m.exec(readFileSync(ctx.workflow, 'utf8'));
  else m = /^Policy:(.*)$/m.exec(q?.text ?? '');
  const raw = (m ? m[1] : '').replace(/[*`]/g, '').replace(/^\s*_|_\s*$/g, '').trim();
  return { raw: raw || 'none', kind: /^may-publish\b/i.test(raw) ? 'may-publish' : /^human-only\b/i.test(raw) ? 'human-only' : 'none' };
}

function appendLog(ctx, cells) {
  const fresh = `---\nstatus: living\nowner-agent: marketing\nrefresh-trigger: every-ship\n---\n\n# Publish Log\n\n_Append-only audit trail of everything published outward (WORKFLOW.md §14), newest first; written by tools/publish-gate.mjs. Corrections are new rows; the full event trail is publish-claims.jsonl._\n\n${render(LOG_COLS)}\n${sepRow(LOG_COLS)}\n`;
  const lines = (existsSync(ctx.log) ? readFileSync(ctx.log, 'utf8') : fresh).split('\n');
  const t = findTable(lines, 'posted (utc)', ctx.log) ?? refuse(`${ctx.log}: no log table (a header starting "| posted (UTC) |")`);
  const head = low(splitRow(lines[t.h]));
  if (head === low(OLD_LOG)) {
    lines[t.h] = render(LOG_COLS); lines[t.h + 1] = sepRow(LOG_COLS);
    for (const i of t.rows) { const c = splitRow(lines[i]); if (c.length === 6) lines[i] = render([c[0], 'post', ...c.slice(1), '']); }
  } else if (head !== low(LOG_COLS)) throw new Exit(4, `${ctx.log}:${t.h + 1}: unrecognised log header — want ${render(LOG_COLS)}`);
  lines.splice(t.h + 2, 0, render(cells));
  mkdirSync(path.dirname(ctx.log), { recursive: true });
  atomicWrite(ctx.log, lines.join('\n'));
}

function deliver(ctx, r, url, by) {
  if (!/^https?:\/\/[^\s|]+$/.test(url ?? '')) throw new Exit(1, 'a permalink is one http(s) URL with no spaces or |');
  const c = r.cells, tok = c[CLAIM].split(/\s+/)[0], run = runOf(ctx, tok);
  appendLog(ctx, [ctx.utc, c[KIND], c[CHANNEL], url, c[SOURCE], by, c[PAID], tok]);
  setter(r)(STATE, 'delivered'); setter(r)(CLAIM, `${tok} delivered ${ctx.utc}`);
  ctx.events.push(ev(r, { event: 'delivered', token: tok, run, by, note: url }));
  ctx.out.push(`delivered ${r.id} — ${url} logged to publish-log.md (fired by ${by})`);
}

// ── verbs ─────────────────────────────────────────────────────────────────
function claim(ctx, q, id) {
  const r = rowById(q, id);
  if (r) { const reset = stampRow(ctx, q, r); if (reset) refuse(reset); }
  if (!r) refuse(`${id} not in queue`);
  const c = r.cells, st = c[STATE], [tok, , day, hm] = c[CLAIM].split(/\s+/);
  if (c[KIND] === 'outreach') refuse(`${id} is outreach — only you can send it, by hand`);
  if (c[KIND] !== 'post') refuse(`${id} has kind '${c[KIND]}' — only kind: post is ever claimed`);
  if (st === 'unknown' || st === 'dispatching') refuse(`${id} not fired: outcome unknown since ${[day, hm].filter(Boolean).join(' ') || '?'} (run ${runOf(ctx, tok) ?? '?'}). Check the channel, then reconcile it.`);
  if (st === 'claimed' || (c[CLAIM] && !['delivered', 'posted'].includes(st))) refuse(`${id} not fired: already claimed ${hm ?? '??:??'} (run ${runOf(ctx, tok) ?? '?'}). If that run died, reconcile it.`);
  if (st === 'approved' && !c[PIN]) refuse(`${id} says approved but has no pinned hash — run publish approve ${id}`);
  if (st !== 'approved') refuse(`${id} is ${st || '(no state)'}, not approved`);
  const c8 = c[SHA].slice(0, 8), m = +c[EPOCH];
  if (c[PIN] !== `${c8}@${m}`) {
    const [a8, an] = pinOf(c) ?? [c[PIN], '?'];
    setter(r)(STATE, 'draft'); setter(r)(PIN, '');
    ctx.events.push(ev(r, { event: 'reset', note: `stale pin ${c[PIN]}` }));
    const line = `publish run: REFUSED ${id} approved@${a8}/e${an}, current ${c8}/e${m} -> reset to draft`;
    const why = [a8 !== c8 && `body changed after approval (hash ${a8} → ${c8})`, an !== m && `epoch ${an} approved, now ${m}`].filter(Boolean).join('; ');
    ctx.out.push(line);
    refuse(`${line}\n${id} not fired: ${why}. Reset to draft. Re-approve to fire.`);
  }
  const when = /^(\d{4}-\d\d-\d\d)(?:[ T](\d\d:\d\d))?/.exec(c[SCHED]);
  const due = when ? Date.parse(`${when[1]}T${when[2] ?? '00:00'}:00Z`) : NaN;
  if (Number.isNaN(due)) refuse(`${id} has no valid scheduled (UTC) time — want YYYY-MM-DD HH:MM`);
  if (due > ctx.now.getTime()) refuse(`${id} not due until ${c[SCHED]}`);
  if (!/^no$/i.test(c[PAID]) && !ctx.flags.has('--paid-confirmed-by-human')) refuse(`${id} is paid — human-fired only (§11); re-run with --paid-confirmed-by-human`);
  const pol = policy(ctx, q);
  if (pol.kind === 'none') refuse('publishing not configured (Publish policy: none)');
  if (ctx.by !== 'human' && pol.kind === 'human-only') refuse('policy is human-only — a scheduled run cannot fire');
  const used = new Set(readClaims(ctx).map((e) => e.token));
  let token;
  do token = randomBytes(4).toString('hex'); while (used.has(token));
  const run = `r-${randomBytes(2).toString('hex')}`;
  setter(r)(STATE, 'claimed'); setter(r)(CLAIM, `${token} claimed ${ctx.utc}`);
  ctx.events.push(ev(r, { event: 'claimed', token, run, by: ctx.by }));
  ctx.out.push(`claimed ${id} (run ${run}, policy: ${pol.raw}) — next: dispatch ${token}, then the connector call with PUBLISH_CLAIM=${token} in the SAME command, then outcome ${token} delivered --permalink <url> | unknown`);
  ctx.out.push(`PUBLISH_CLAIM=${token}`);
}

function status(ctx) {
  const empty = 'Nothing queued. Run /agentic-workflow:publish stage after a release.';
  if (!existsSync(ctx.queue)) { ctx.out.push(`Publish queue — policy: ${policy(ctx, null).raw}`, empty); return; }
  const q = parseQueue(readFileSync(ctx.queue, 'utf8'), ctx.queue);
  ctx.out.push(`Publish queue — policy: ${policy(ctx, q).raw}`);
  const rows = q.rows.filter((r) => !r.example);
  if (!rows.length) { ctx.out.push(empty); return; }
  const needs = [], ready = [], inflight = [], drafts = { post: 0, outreach: 0 }, week = ctx.now.getTime() - 7 * 864e5;
  let posted = 0;
  for (const r of rows) {
    const c = r.cells, label = `${r.id} (${c[SUMMARY] || c[CHANNEL]})`, [tok, , day, hm] = c[CLAIM].split(/\s+/), since = [day, hm].filter(Boolean).join(' ') || '?';
    const cur = sha(q.bodies.get(r.id).text);
    if (c[STATE] === 'unknown') needs.push(`${label}: may or may not have posted (outcome unknown since ${since}). Check ${c[CHANNEL]}, then run publish reconcile ${r.id}.`);
    else if (c[STATE] === 'dispatching') needs.push(`${label}: dispatching since ${since} — outcome unknown. Check ${c[CHANNEL]}, then run publish reconcile ${r.id}.`);
    else if (c[STATE] === 'claimed') inflight.push(`${r.id} (since ${since}, run ${runOf(ctx, tok) ?? '?'})`);
    else if (c[STATE] === 'approved' && !c[PIN]) needs.push(`${r.id} says approved but has no pinned hash — run publish approve ${r.id}`);
    else if (c[STATE] === 'approved' && (c[SHA] !== cur || c[PIN] !== `${cur.slice(0, 8)}@${c[EPOCH]}`)) needs.push(`${label}: body changed since approval — a run will refuse it and reset it to draft; review, then publish approve ${r.id}`);
    else if (c[STATE] === 'approved') ready.push(`${r.id} (${c[SUMMARY] || c[CHANNEL]}, due ${c[SCHED]})`);
    else if (c[STATE] === 'draft') drafts[c[KIND] === 'outreach' ? 'outreach' : 'post']++;
    else if (c[STATE] === 'delivered' || c[STATE] === 'posted') {
      const d = Date.parse(`${(c[STATE] === 'delivered' ? day : c[SCHED].slice(0, 10)) || 'x'}T00:00:00Z`);
      if (d >= week - 864e5 && d <= ctx.now.getTime()) posted++;
    }
  }
  ctx.out.push(`Needs you (${needs.length})`, ...needs.map((l) => `  ${l}`));
  if (inflight.length) ctx.out.push(`Claimed, in flight (${inflight.length}): ${inflight.join(', ')} — if that run died, reconcile it`);
  ctx.out.push(`Ready to fire (${ready.length})${ready.length ? `: ${ready.join(', ')}` : ''}`);
  ctx.out.push(`Drafts (${drafts.post + drafts.outreach}): ${drafts.post} posts, ${drafts.outreach} outreach — outreach is sent by you, by hand, never by a run`);
  ctx.out.push(`Posted this week (${posted})`);
}

function root() {
  const r = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  return (r.status === 0 && r.stdout.trim()) || process.cwd();
}

export function gate(argv) {
  const out = [], err = [];
  try {
    const o = { _: [], flags: new Set() }, valued = ['--queue', '--claims', '--workflow', '--now', '--by', '--permalink', '--delivered'];
    for (let i = 0; i < argv.length; i++) {
      if (valued.includes(argv[i])) { if (i + 1 >= argv.length) throw new Exit(1, `${argv[i]} needs a value`); o[argv[i].slice(2)] = argv[++i]; }
      else if (['--cancel', '--paid-confirmed-by-human'].includes(argv[i])) o.flags.add(argv[i]);
      else if (argv[i].startsWith('--')) throw new Exit(1, `unknown option ${argv[i]}\n${USAGE}`);
      else o._.push(argv[i]);
    }
    const now = o.now ? new Date(o.now) : new Date();
    if (Number.isNaN(now.getTime())) throw new Exit(1, '--now must be an ISO date');
    const by = o.by ?? 'human';
    if (by !== 'human' && !/^may-publish\b/.test(by)) throw new Exit(1, '--by is human or "may-publish (delegated <date>)"');
    const R = root();
    const ctx = { out, err, by, now, events: [], flags: o.flags, iso: now.toISOString().replace(/\.\d{3}Z$/, 'Z'), utc: now.toISOString().slice(0, 16).replace('T', ' ') };
    for (const k of Object.keys(DEF)) ctx[k] = path.resolve(R, o[k] ?? DEF[k]);
    ctx.log = path.join(path.dirname(ctx.queue), 'publish-log.md');
    const [verb, arg, arg2] = o._;
    const need = (v) => v ?? (() => { throw new Exit(1, USAGE); })();
    if (verb === 'stamp') mutate(ctx, (q) => {
      const rows = q.rows.filter((r) => !r.example);
      for (const r of rows) stampRow(ctx, q, r);
      out.push(`stamp: ${rows.length} rows, ${q.rows.filter((r) => r.dirty).length + (q.old ? 1 : 0)} changes`);
    });
    else if (verb === 'approve') mutate(ctx, (q) => {
      const r = rowById(q, need(arg));
      if (r) stampRow(ctx, q, r);
      if (!r) refuse(`${arg} not in queue`);
      if (!['draft', 'approved'].includes(r.cells[STATE])) refuse(`${arg} is ${r.cells[STATE]} — reconcile first`);
      const pin = `${r.cells[SHA].slice(0, 8)}@${r.cells[EPOCH]}`, b = q.bodies.get(arg);
      setter(r)(STATE, 'approved'); setter(r)(PIN, pin);
      ctx.events.push(ev(r, { event: 'approved', by }));
      out.push(b.heading, norm(b.text), '', `approve: ${arg} approved-for ${pin} (${r.cells[KIND]}${r.cells[KIND] === 'outreach' ? ' — you send it by hand; no run fires outreach' : ''})`);
    });
    else if (verb === 'claim') mutate(ctx, (q) => claim(ctx, q, need(arg)));
    else if (verb === 'dispatch') mutate(ctx, (q) => {
      const r = rowByToken(q, arg), tok = arg, c = r.cells, set = setter(r);
      if (c[STATE] !== 'claimed') refuse(`${r.id} is ${c[STATE]}, not claimed — a token fires once`);
      // Re-hash right before the network call: an edit between claim and dispatch voids the token.
      const cur = sha(q.bodies.get(r.id).text), c8 = cur.slice(0, 8);
      if (c[SHA] !== cur || c[PIN] !== `${c8}@${c[EPOCH]}`) {
        const [a8, an] = pinOf(c) ?? [c[PIN] || '?', '?'], ne = c[SHA] !== cur ? (+c[EPOCH] || 1) + 1 : +c[EPOCH];
        set(SHA, cur); set(EPOCH, String(ne)); set(STATE, 'draft'); set(PIN, ''); set(CLAIM, '');
        ctx.events.push(ev(r, { event: 'reset', token: tok, run: runOf(ctx, tok), note: 'body changed between claim and dispatch — token void' }));
        const line = `publish run: REFUSED ${r.id} approved@${a8}/e${an}, current ${c8}/e${ne} -> reset to draft`;
        out.push(line);
        refuse(`${line}\n${r.id} not fired: body changed after it was claimed; token ${tok} is void. Reset to draft. Re-approve to fire.`);
      }
      set(STATE, 'dispatching'); setter(r)(CLAIM, `${tok} dispatching ${ctx.utc}`);
      ctx.events.push(ev(r, { event: 'dispatching', token: tok, run: runOf(ctx, tok) }));
      out.push(`dispatching ${r.id} under claim ${tok}`);
    });
    else if (verb === 'outcome') mutate(ctx, (q) => {
      const r = rowByToken(q, arg), tok = arg;
      if (!['claimed', 'dispatching'].includes(r.cells[STATE])) refuse(`${r.id} is ${r.cells[STATE]} — its outcome is already recorded; reconcile by hand`);
      const claimedBy = readClaims(ctx).filter((e) => e.token === tok && e.event === 'claimed').pop()?.by ?? by;
      if (arg2 === 'delivered') deliver(ctx, r, o.permalink, claimedBy);
      else if (arg2 === 'unknown') {
        setter(r)(STATE, 'unknown'); setter(r)(CLAIM, `${tok} unknown ${ctx.utc}`);
        ctx.events.push(ev(r, { event: 'unknown', token: tok, run: runOf(ctx, tok), by: claimedBy }));
        err.push(`${r.id} may or may not have posted. Check the channel, then reconcile.`);
      } else throw new Exit(1, USAGE);
    });
    else if (verb === 'reconcile') mutate(ctx, (q) => {
      const r = rowById(q, need(arg)) ?? refuse(`${arg} not in queue`);
      if (!OPEN.includes(r.cells[STATE])) refuse(`${arg} is ${r.cells[STATE]} — reconcile takes a claimed, dispatching or unknown row`);
      if (!!o.delivered === o.flags.has('--cancel')) throw new Exit(1, USAGE);
      if (o.delivered) return deliver(ctx, r, o.delivered, 'human');
      const tok = r.cells[CLAIM].split(/\s+/)[0];
      ['approved-for', 'claim'].forEach((k) => setter(r)(COLS.indexOf(k), ''));
      setter(r)(STATE, 'draft');
      ctx.events.push(ev(r, { event: 'cancelled', token: tok, run: runOf(ctx, tok), by: 'human' }));
      out.push(`cancelled ${arg} — back to draft; re-approve to fire`);
    });
    else if (verb === 'status' || verb === undefined) status(ctx);
    else throw new Exit(1, USAGE);
    return { code: 0, out, err };
  } catch (e) {
    // Fail closed: a non-zero exit never hands out a token, even if one was minted before the error.
    const kept = out.filter((l) => !l.startsWith('PUBLISH_CLAIM=') && !l.startsWith('claimed '));
    if (!(e instanceof Exit)) { err.push(`publish-gate: ${e.message}`); return { code: 1, out: kept, err }; }
    if (e.message) err.push(e.message);
    return { code: e.code, out: kept, err };
  }
}

// ── selftest (in-memory fixtures in a mkdtemp dir; no fixture files in the tree) ──
function selftest() {
  const fails = [];
  const ok = (name, cond, detail) => { if (cond) console.log(`  ok   ${name}`); else { console.error(`  FAIL ${name}${detail ? ' — ' + detail : ''}`); fails.push(name); } };
  const dir = mkdtempSync(path.join(tmpdir(), 'publish-gate-'));
  const Q = path.join(dir, 'q.md'), C = path.join(dir, 'c.jsonl'), W = path.join(dir, 'wf.md');
  const g = (...a) => gate([...a, '--queue', Q, '--claims', C, '--workflow', W, '--now', '2026-10-06T12:00:00Z']);
  const row = (id) => { const r = parseQueue(readFileSync(Q, 'utf8'), Q).rows.find((x) => x.id === id); return Object.fromEntries(COLS.map((k, i) => [k, r.cells[i]])); };
  const events = () => (existsSync(C) ? readFileSync(C, 'utf8').trim().split('\n').map((l) => JSON.parse(l).event) : []);
  const txt = (r) => `${r.out.join('\n')}\n${r.err.join('\n')}`;
  try {
    ok('(a) sha256 of "hello\\nworld" is the measured digest', sha('hello\nworld') === '26c60a61d01db5836ca70fefd44a6a016620413c8ef5f259a6c5612d4f79d3b8');
    ok('(b) CRLF + trailing-space copy hashes identically', sha('hello  \r\nworld\t\r\n\r\n') === sha('hello\nworld'));
    const body = ['', '### P-001 — devto', 'hello', '', '### P-002 — x', 'world', '', '---', 'footer', ''];
    writeFileSync(Q, ['Policy: **human-only**', '', render(OLD), sepRow(OLD), '| P-001 | devto | 2026-10-01 09:00 | approved | no | a.md | one |', '| P-002 | x | 2026-10-01 09:00 | posted | no | b.md | two |', ...body].join('\n'));
    let r = g('stamp');
    const p1 = row('P-001'), p2 = row('P-002');
    ok('(c) old 7-column queue → stamp migrates to 12 columns, kind post, epoch 1, state unchanged',
      r.code === 0 && readFileSync(Q, 'utf8').includes(render(COLS)) && p1.kind === 'post' && p1.epoch === '1' && p1.state === 'approved' && p1['body-sha256'] === sha('hello') && p2.state === 'posted' && p2.epoch === '1', txt(r));
    const before = readFileSync(Q, 'utf8');
    r = g('stamp');
    ok('(d) second stamp → "stamp: 2 rows, 0 changes", file byte-identical', r.code === 0 && r.out.includes('stamp: 2 rows, 0 changes') && readFileSync(Q, 'utf8') === before, txt(r));
    r = g('approve', 'P-001');
    writeFileSync(Q, readFileSync(Q, 'utf8').replace('### P-001 — devto\nhello\n', '### P-001 — devto\nhello, edited\n'));
    r = g('claim', 'P-001');
    const e1 = row('P-001');
    ok('(e) approve → edit → claim: exit 2, REFUSED line, row draft/epoch 2/approved-for empty, jsonl approved+reset',
      r.code === 2 && /^publish run: REFUSED P-001 approved@[0-9a-f]{8}\/e1, current [0-9a-f]{8}\/e2 -> reset to draft$/m.test(r.out.join('\n')) &&
      e1.state === 'draft' && e1.epoch === '2' && e1['approved-for'] === '' && events().join(',') === 'approved,reset', `${txt(r)} ${JSON.stringify(e1)} ${events()}`);
    writeFileSync(Q, [render(COLS), sepRow(COLS), '| P-001 | post | devto | 2026-10-01 09:00 | draft | no | | | | | a.md |', ...body].join('\n'));
    const short = readFileSync(Q, 'utf8');
    r = g('stamp');
    ok('(f) a short row (11 cells) → exit 4 with the line number, file byte-identical', r.code === 4 && /:3: row has 11 cells/.test(txt(r)) && readFileSync(Q, 'utf8') === short, txt(r));
    rmSync(C, { force: true });
    writeFileSync(W, '| **Publish policy** | may-publish (delegated 2026-10-01, channels: email) |\n');
    const h = sha('to: a@b.c\nhi');
    writeFileSync(Q, [render(COLS), sepRow(COLS), `| O-001 | outreach | email | 2026-10-01 09:00 | approved | no | ${h} | 1 | ${h.slice(0, 8)}@1 | | a.md | person + ask |`, '', '### O-001 — email', 'to: a@b.c', 'hi', ''].join('\n'));
    r = g('claim', 'O-001');
    ok('(g) claim on outreach → exit 2 "only you can send it, by hand", no claimed event', r.code === 2 && txt(r).includes('O-001 is outreach — only you can send it, by hand') && !events().includes('claimed'), txt(r));
    writeFileSync(W, '| **Publish policy** | human-only |\n');
    writeFileSync(Q, [render(COLS), sepRow(COLS), `| P-001 | post | devto | 2026-10-01 09:00 | approved | no | ${sha('hello')} | 1 | ${sha('hello').slice(0, 8)}@1 | | a.md | one |`, ...body].join('\n'));
    const tok = g('claim', 'P-001').out.at(-1).split('=')[1];
    writeFileSync(Q, readFileSync(Q, 'utf8').replace('### P-001 — devto\nhello\n', '### P-001 — devto\nhello, edited after claim\n'));
    r = g('dispatch', tok);
    const h1 = row('P-001');
    ok('(h) claim → edit → dispatch: exit 2, REFUSED, row draft with pin + claim cleared, token void (last event reset)',
      r.code === 2 && /REFUSED P-001 approved@[0-9a-f]{8}\/e1, current [0-9a-f]{8}\/e2/.test(r.out.join('\n')) && h1.state === 'draft' && h1.claim === '' && h1['approved-for'] === '' &&
      JSON.parse(readFileSync(C, 'utf8').trim().split('\n').at(-1)).event === 'reset', `${txt(r)} ${JSON.stringify(h1)}`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
  if (fails.length) { console.error(`publish-gate selftest: ${fails.length} failure(s)`); return 1; }
  console.log('publish-gate selftest: clean');
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--selftest')) process.exit(selftest());
  const res = gate(process.argv.slice(2));
  if (res.out.length) process.stdout.write(res.out.join('\n') + '\n');
  if (res.err.length) process.stderr.write(res.err.join('\n') + '\n');
  process.exit(res.code);
}
