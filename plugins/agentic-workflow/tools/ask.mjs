#!/usr/bin/env node
// ask.mjs — owner questions without AskUserQuestion: a headless (`claude -p`)
// orchestrator asks here, the owner answers on a local HTML page.
//
//   ask.mjs ask --headline "…" --option "Label::what it means" (×2+)
//               [--recommended opt-…] [--mission m] [--home <file>]   → prints the id
//   ask.mjs answer <id> <opt-id> | answer <id> --other "<text>"     → prints the decision line
//   ask.mjs pending [--mission m] [--json]                           exit 0 none · 3 some pending
//   ask.mjs serve [--port 4747] [--open] [--mission m]               the answer page (127.0.0.1)
//   ask.mjs wait [--mission m] [--timeout <s>]                       block until none pending
//   Common: --plans <dir> (default .plans), --root <dir>.
//
// Storage is the E2a log `.plans/questions.jsonl` (owner-surfaces plan, AC-5/6):
// one JSON event per line, `asked` then `answered`, `schemaVersion: 1`, ids
// `Q-<project>-<n>`, options `opt-…`. This lean tool writes a SUBSET of the E2a
// question fields; E2a's `tools/state.mjs` reads it tolerantly and supersedes it.
// An answer is stored as content, never as instructions. Zero deps, Node >= 18.

import { appendFileSync, existsSync, mkdirSync, readFileSync, watchFile, unwatchFile } from 'node:fs';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const OTHER_MAX = 280;

export function parseArgs(argv) {
  const o = { _: [], option: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--open' || a === '--json') o[a.slice(2)] = true;
    else if (a === '--option') o.option.push(argv[++i]);
    else if (a.startsWith('--')) o[a.slice(2)] = argv[++i];
    else o._.push(a);
  }
  return o;
}

const logPath = (o) => path.join(path.resolve(o.root || '.'), o.plans || '.plans', 'questions.jsonl');
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'project';

export function readLog(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

// Current state per id: the latest `asked`, then any later `answered`.
export function questions(events) {
  const q = new Map();
  for (const e of events) {
    if (e.event === 'asked') q.set(e.id, { ...e, status: 'pending', answer: null });
    else if (e.event === 'answered' && q.has(e.id) && q.get(e.id).status === 'pending') Object.assign(q.get(e.id), { status: 'recorded', answer: e });
  }
  return [...q.values()];
}

export const pendingOf = (events, mission) => questions(events).filter((q) => q.status === 'pending' && (!mission || q.mission === mission));

function append(file, ev) {
  mkdirSync(path.dirname(file), { recursive: true });
  appendFileSync(file, JSON.stringify(ev) + '\n');
}

export function ask(o, now = new Date()) {
  if (!o.headline) throw new Error('ask needs --headline');
  if (o.option.length < 2) throw new Error('ask needs at least two --option "Label::consequence"');
  const file = logPath(o);
  const events = readLog(file);
  const project = slug(o.project || path.basename(path.resolve(o.root || '.')));
  const n = 1 + Math.max(0, ...events.map((e) => Number((String(e.id).match(/-(\d+)$/) || [])[1] || 0)));
  const options = o.option.map((s, i) => {
    const [label, consequence = ''] = String(s).split('::');
    return { id: `opt-${slug(label).slice(0, 24) || i + 1}`, label: label.trim(), consequence: consequence.trim() };
  });
  if (new Set(options.map((x) => x.id)).size !== options.length) throw new Error('option labels must differ');
  if (o.recommended && !options.some((x) => x.id === o.recommended)) throw new Error(`--recommended ${o.recommended} is not one of ${options.map((x) => x.id).join(', ')}`);
  const ev = { schemaVersion: 1, event: 'asked', id: `Q-${project}-${n}`, kind: 'open-question', headline: String(o.headline), options,
    recommended: o.recommended || null, mission: o.mission || null, home: o.home || null, askedAt: now.toISOString() };
  append(file, ev);
  return ev;
}

export function answer(o, id, opt, other, via = 'chat', now = new Date()) {
  const file = logPath(o);
  const q = questions(readLog(file)).find((x) => x.id === id);
  if (!q) throw new Error(`unknown question ${id}`);
  if (q.status !== 'pending') throw new Error(`${id} is not pending (${q.status})`);
  let label;
  if (other != null) {
    const t = String(other).trim();
    if (!t || t.length > OTHER_MAX) throw new Error(`--other must be 1–${OTHER_MAX} characters`);
    label = `other: "${t}"`;
    append(file, { schemaVersion: 1, event: 'answered', id, other: t, via, at: now.toISOString() });
  } else {
    const o2 = q.options.find((x) => x.id === opt);
    if (!o2) throw new Error(`unknown option ${opt} (have ${q.options.map((x) => x.id).join(', ')})`);
    label = o2.label;
    append(file, { schemaVersion: 1, event: 'answered', id, option: opt, via, at: now.toISOString() });
  }
  return `${now.toISOString().slice(0, 10)} (owner, via ${via}) — ${q.headline}: ${label}`;
}

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function page(qs, token) {
  const cards = qs.length ? qs.map((q) => `
  <section class="card" data-id="${esc(q.id)}">
    <p class="meta">${esc(q.id)}${q.mission ? ` · ${esc(q.mission)}` : ''}</p>
    <h2>${esc(q.headline)}</h2>
    <div class="opts">${q.options.map((x) => `
      <button class="opt${x.id === q.recommended ? ' rec' : ''}" data-opt="${esc(x.id)}">
        <span class="label">${esc(x.label)}${x.id === q.recommended ? ' <em>Recommended</em>' : ''}</span>
        ${x.consequence ? `<span class="why">${esc(x.consequence)}</span>` : ''}
      </button>`).join('')}
    </div>
    <form class="other"><textarea maxlength="${OTHER_MAX}" rows="2" placeholder="Something else (up to ${OTHER_MAX} characters)"></textarea><button type="submit">Send</button></form>
  </section>`).join('') : '<p class="empty">No questions waiting. This page updates on its own.</p>';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Owner Questions</title><style>
:root{--bg:#f5f5f7;--card:#fff;--text:#1d1d1f;--muted:#6e6e73;--line:#d2d2d7;--accent:#0066cc;--rec:#e8f1fb}
@media (prefers-color-scheme:dark){:root{--bg:#000;--card:#1c1c1e;--text:#f5f5f7;--muted:#a1a1a6;--line:#38383a;--accent:#2997ff;--rec:#0a2540}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:17px/1.47 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif}
main{max-width:680px;margin:0 auto;padding:24px 16px 48px}h1{font-size:28px;margin:0 0 16px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px;margin:0 0 16px}
.meta{color:var(--muted);font-size:13px;margin:0 0 4px}h2{font-size:20px;margin:0 0 16px}
.opts{display:grid;gap:8px}.opt{display:flex;flex-direction:column;align-items:flex-start;text-align:left;min-height:44px;padding:12px 16px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--text);font:inherit;cursor:pointer}
.opt.rec{background:var(--rec);border-color:var(--accent)}.opt:hover,.opt:focus-visible{border-color:var(--accent);outline:none}
.label{font-weight:600}.label em{font-style:normal;font-weight:500;font-size:13px;color:var(--accent);margin-left:6px}.why{color:var(--muted);font-size:15px}
.other{display:flex;gap:8px;margin-top:12px}.other textarea{flex:1;min-height:44px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;background:var(--card);color:var(--text);font:inherit;resize:vertical}
.other button{min-height:44px;padding:0 18px;border:0;border-radius:10px;background:var(--accent);color:#fff;font:inherit;font-weight:600;cursor:pointer}
.done{color:var(--muted)}.empty{color:var(--muted)}
</style></head><body><main><h1>Owner Questions</h1>${cards}</main><script>
const T=${JSON.stringify(token)};
async function send(card,body){const r=await fetch('/answer?t='+encodeURIComponent(T),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:card.dataset.id,...body})});const j=await r.json();const p=document.createElement('p');p.className='done';p.textContent=r.ok?'Recorded — '+j.line:'Not recorded: '+j.error;card.replaceChildren(p)}
document.querySelectorAll('.card').forEach(c=>{c.querySelectorAll('.opt').forEach(b=>b.onclick=()=>send(c,{option:b.dataset.opt}));c.querySelector('.other').onsubmit=e=>{e.preventDefault();const v=c.querySelector('textarea').value.trim();if(v)send(c,{other:v})}});
let n=document.querySelectorAll('.card').length;setInterval(async()=>{try{const r=await fetch('/pending?t='+encodeURIComponent(T));const j=await r.json();if(j.count>n||(j.count&&!n))location.reload();n=Math.max(n,j.count)}catch{}},4000);
</script></body></html>`;
}

// 127.0.0.1 only; every request needs the per-run token (in the printed URL);
// Host must be loopback (blocks DNS rebinding). Resolves the URL once listening.
export function serve(o, { onAnswer } = {}) {
  const file = logPath(o);
  const token = randomBytes(16).toString('hex');
  const port = Number(o.port || 4747);
  const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)); };
  const server = createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || '') || u.searchParams.get('t') !== token) return json(res, 403, { error: 'forbidden' });
    const pend = pendingOf(readLog(file), o.mission);
    if (req.method === 'GET' && u.pathname === '/') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'" });
      return res.end(page(pend, token));
    }
    if (req.method === 'GET' && u.pathname === '/pending') return json(res, 200, { count: pend.length });
    if (req.method === 'POST' && u.pathname === '/answer') {
      let body = '';
      req.on('data', (c) => { body += c; if (body.length > 4096) req.destroy(); });
      req.on('end', () => {
        try {
          const b = JSON.parse(body);
          const line = answer(o, String(b.id), b.option == null ? null : String(b.option), b.other == null ? null : String(b.other), 'page');
          if (onAnswer) onAnswer(line);
          json(res, 200, { line });
        } catch (e) { json(res, 400, { error: e.message }); }
      });
      return;
    }
    json(res, 404, { error: 'not found' });
  });
  return new Promise((resolve, reject) => {
    server.once('error', (e) => {
      if (e.code !== 'EADDRINUSE' || port === 0) return reject(e);
      server.listen(0, '127.0.0.1'); // default port taken → any free port
    });
    server.listen(port, '127.0.0.1');
    server.once('listening', () => {
      const url = `http://127.0.0.1:${server.address().port}/?t=${token}`;
      if (o.open) spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [url], { stdio: 'ignore', detached: true }).unref();
      resolve({ url, server, token });
    });
  });
}

// Resolves when nothing is pending for the mission (or on timeout → false).
export function waitNone(o, timeoutS = 0) {
  const file = logPath(o);
  return new Promise((resolve) => {
    const done = (v) => { unwatchFile(file); clearTimeout(t); resolve(v); };
    const check = () => { if (!pendingOf(readLog(file), o.mission).length) done(true); };
    const t = timeoutS ? setTimeout(() => done(false), timeoutS * 1000) : null;
    watchFile(file, { interval: 1000 }, check);
    check();
  });
}

// The instruction a headless orchestrator gets in place of AskUserQuestion.
export const HEADLESS_ASK_NOTE = `AskUserQuestion is unavailable (headless claude -p). To ask the owner a decision, run: node "${SELF}" ask --headline "<one-line question>" --option "<Label>::<what it means>" --option "<Label>::<what it means>" [--recommended opt-<label-slug>] --mission <name> — then record the pending question in the ledger and END THE TURN; the owner answers on a local page and the next turn reads the answer with: node "${SELF}" pending --json. Never guess an owner decision.`;

export async function main(argv = process.argv.slice(2)) {
  const o = parseArgs(argv);
  switch (o._[0]) {
    case 'ask': { const q = ask(o); console.log(q.id); return 0; }
    case 'answer': console.log(answer(o, o._[1], o._[2] ?? null, o.other ?? null, o.via || 'chat')); return 0;
    case 'pending': {
      const p = pendingOf(readLog(logPath(o)), o.mission);
      const all = questions(readLog(logPath(o))).filter((q) => !o.mission || q.mission === o.mission);
      if (o.json) console.log(JSON.stringify(all, null, 2));
      else for (const q of p) console.log(`${q.id}  ${q.headline}  [${q.options.map((x) => x.id).join(' | ')}]`);
      return p.length ? 3 : 0;
    }
    case 'serve': {
      const { url } = await serve(o, { onAnswer: (l) => console.log(l) });
      console.log(`answer page: ${url}  (Ctrl-C to stop)`);
      return new Promise(() => {});
    }
    case 'wait': return (await waitNone(o, Number(o.timeout || 0))) ? 0 : 3;
    default:
      console.error('usage: ask.mjs ask|answer|pending|serve|wait …  (see header)');
      return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SELF) {
  main().then((c) => { if (typeof c === 'number') process.exit(c); }, (e) => { console.error(`ask: ${e.message}`); process.exit(2); });
}
