#!/usr/bin/env node
// browse.mjs — fast browser use: Jev (TypeSafe "System One") picks every step
// of a browser loop from a numbered element table in one ~200 ms request, so no
// model call runs per step. The calling agent hands over one short goal and
// gets back a verified result, a hand-off, or a proposed irreversible action.
// Snapshot/question ideas adapted from browser-use/jev-ultrafast (MIT).
//
//   node tools/browse.mjs run --goal <g> [--url <u>] [--cdp <url>]
//       [--until-url <re>] [--until-text <s>] [--allow-irreversible]
//       [--json] [--trace <file>] [--max-steps N]
//       The loop: settle → snapshot → ONE Jev request → gates → act, until
//       DONE (then an independent check) or a hand-off. Backend: --cdp /
//       BROWSE_CDP_URL attaches to a running Chromium (BrowserOS neo too, when
//       its debug port answers); otherwise launches Chrome headless with a
//       plugin-owned profile (never the default one).
//   node tools/browse.mjs step --goal <g> --state <file.json> [--history <file>]
//       Hand-back mode for surfaces this tool can't drive (Claude in Chrome,
//       computer use, MCP browsers): prints the next {op, index, label,
//       valueRef, gates}; the caller acts. Never resolves secrets.
//   node tools/browse.mjs snapshot [--url <u> | --cdp <url>] [--json]
//       Print the numbered element table: `[index] role label · value`.
//   node tools/browse.mjs doctor [--json]
//       Node, key (set/unset only), Chrome, CDP, BrowserOS neo, dirs. Exit 0.
//
// Goals: short, one page/form; quote literals ("Jane Doe" → {{goal:1}});
// secrets by reference {{secret:<user>.<field>}} (field password|login),
// resolved ONCE at `run` start from docs/AUTH.md Test users ($NAME → env).
//
// Exit codes: 0 done, verified · 1 usage/internal · 2 done, unverified (verify
// yourself) · 3 handed off (reason: low_confidence|stuck|bot|error|
// needs_secret|needs_value|max_steps) · 4 irreversible action pending
// (`proposed`) · 5 backend unavailable (no Chrome, CDP unreachable, Jev down
// after one retry, Node < 22) · 6 TYPESAFE_API_KEY not set.
//
// Env: TYPESAFE_API_KEY (required for run/step) · BROWSE_JEV_URL (default
// https://api.typesafe.ai/v1/systemone) · BROWSE_JEV_MODEL (default jev-latest)
// · BROWSE_CDP_URL (attach; doctor probes it, default http://127.0.0.1:9222)
// · BROWSE_MCP_URL (neo probe, default http://127.0.0.1:9200/mcp) ·
// BROWSE_CHROME (binary) · BROWSE_PROFILE_DIR (default
// ${XDG_DATA_HOME:-~/.local/share}/agentic-workflow/browse/profile) ·
// BROWSE_TRACE_DIR (default <git dir>/agentic-workflow/browse/traces, else
// ${XDG_STATE_HOME:-~/.local/state}/agentic-workflow/browse/traces; never
// inside the worktree).
// Test-only (refused unless BROWSE_JEV_URL is a 127.0.0.1 URL):
// `--backend fixture:<cases.json>#<name>` (recorded element tables; every act
// is appended to BROWSE_ACT_LOG) and BROWSE_FAKE_NODE (simulated Node major).
//
// Zero deps. Node >= 22 (global WebSocket and fetch).

import { spawn, spawnSync } from 'node:child_process';
import { appendFileSync, chmodSync, closeSync, existsSync, mkdirSync, openSync, readFileSync } from 'node:fs';
import net from 'node:net';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const IS_MAIN = Boolean(process.argv[1] && path.resolve(process.argv[1]) === SELF);
const FIXTURES = path.join(path.dirname(SELF), 'fixtures', 'browse');

// Node floor first (counsel #4). BROWSE_FAKE_NODE is honoured only when the Jev
// URL is loopback, i.e. only inside the test harness.
export const isLoopback = (u) => { try { return new URL(u).hostname === '127.0.0.1'; } catch { return false; } };
export function nodeMajor(env = process.env) {
  if (env.BROWSE_FAKE_NODE && isLoopback(env.BROWSE_JEV_URL)) return Number(env.BROWSE_FAKE_NODE);
  return Number(process.versions.node.split('.')[0]);
}
const NODE_OK = nodeMajor() >= 22;

export const GATES = Object.freeze({
  CONF: 0.70, DONE: 0.80, BOT: 0.70, BANNER: 0.80, IRREV: 0.50, ERROR: 0.80,
  MAX_STEPS: 30, MAX_ELEMENTS: 80, TEXT_CAP: 2000, HISTORY: 5, MAX_WAITS: 3, REPEAT: 3,
});
export const EXIT = Object.freeze({
  done: 0, error: 1, 'done-unverified': 2, 'handed-off': 3, 'irreversible-pending': 4, 'backend-unavailable': 5, 'no-key': 6,
});
export const exitFor = (status) => EXIT[status] ?? 1;
export const NO_KEY_LINE = 'TYPESAFE_API_KEY not set — verify with Bash-driven Playwright as before';
export const STEP_SECRET_LINE = 'secrets cannot be typed on a hand-back surface — use run or --cdp';
const OPS = ['CLICK', 'TYPE', 'SELECT', 'SCROLL_UP', 'SCROLL_DOWN', 'ENTER', 'WAIT', 'DONE', 'BLOCKED'];
const TARGET_OPS = new Set(['CLICK', 'TYPE', 'SELECT']);
const ACTING = new Set(['CLICK', 'TYPE', 'SELECT', 'ENTER']);

class Unavailable extends Error {}
class Usage extends Error {}

// ── goals, secrets, vault ────────────────────────────────────────────────
export function parseGoal(goal) {
  const menu = [];
  const seen = new Set();
  for (const m of String(goal).matchAll(/\{\{secret:([A-Za-z0-9_.@+-]+)\.(password|login)\}\}/g)) {
    const name = `{{secret:${m[1]}.${m[2]}}}`;
    if (!seen.has(name)) { seen.add(name); menu.push({ name, kind: 'secret', ref: `${m[1]}.${m[2]}` }); }
  }
  let n = 0;
  for (const m of String(goal).replace(/\{\{[^}]*\}\}/g, ' ').matchAll(/"([^"]+)"|'([^']+)'/g)) {
    n += 1;
    menu.push({ name: `{{goal:${n}}}`, kind: 'goal', ref: String(n), text: m[1] ?? m[2] });
  }
  return { goal: String(goal), menu };
}

const cellText = (c) => c.trim().replace(/^[_*]+|[_*]+$/g, '').replace(/^`|`$/g, '').trim();

// Test users rows of docs/AUTH.md: `<user>` matches the Role cell, the login
// cell, or the login's local part (case-insensitive); `$NAME` → env[NAME].
export function resolveSecret(ref, authMd, env = process.env) {
  const m = /^(.+)\.(password|login)$/.exec(String(ref));
  if (!m || !authMd) return null;
  const [, user, field] = m;
  const lines = String(authMd).split('\n');
  const start = lines.findIndex((l) => /^##\s+Test users/i.test(l));
  if (start < 0) return null;
  let header = null;
  for (let i = start + 1; i < lines.length && !/^##\s/.test(lines[i]); i++) {
    const l = lines[i].trim();
    if (!l.startsWith('|')) continue;
    const cells = l.replace(/^\||\|$/g, '').split('|').map(cellText);
    if (!header) { header = cells.map((h) => h.toLowerCase()); continue; }
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    const role = cells[header.findIndex((h) => h.startsWith('role'))] ?? '';
    const login = cells[header.findIndex((h) => h.includes('login') || h.includes('email'))] ?? '';
    const u = user.toLowerCase();
    if (![role.toLowerCase(), login.toLowerCase(), login.toLowerCase().split('@')[0]].includes(u)) continue;
    let v = field === 'login' ? login : cells[header.findIndex((h) => h.startsWith('password'))] ?? '';
    v = v.replace(/\s*\(seeded\)$/i, '').trim();
    const env1 = /^\$([A-Za-z_][A-Za-z0-9_]*)$/.exec(v);
    if (env1) v = env[env1[1]] ?? '';
    return v ? v : null;
  }
  return null;
}

const htmlEscape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Resolves every menu secret ONCE into this closure. Nothing outside it holds a
// value: typeInto hands the value to the sink (the backend act) and returns the
// sink's result; redact maps raw, URL-encoded and HTML-escaped forms back to
// the reference.
export function makeVault(menu, authMd, env = process.env) {
  const values = new Map();
  const missing = [];
  for (const m of menu) {
    if (m.kind === 'goal') values.set(m.name, m.text);
    else {
      const v = resolveSecret(m.ref, authMd, env);
      if (v == null) missing.push(m.ref); else values.set(m.name, v);
    }
  }
  const pairs = [];
  for (const m of menu) {
    if (m.kind !== 'secret' || !values.has(m.name)) continue;
    const v = values.get(m.name);
    for (const f of new Set([v, encodeURIComponent(v), htmlEscape(v)])) pairs.push([f, m.name]);
  }
  pairs.sort((a, b) => b[0].length - a[0].length);
  const redactStr = (s) => { let o = s; for (const [f, name] of pairs) o = o.split(f).join(name); return o; };
  const redact = (x) => {
    if (typeof x === 'string') return redactStr(x);
    if (Array.isArray(x)) return x.map(redact);
    if (x && typeof x === 'object') { const o = {}; for (const [k, v] of Object.entries(x)) o[redactStr(k)] = redact(v); return o; }
    return x;
  };
  return {
    missing,
    has: (ref) => values.has(ref),
    typeInto: (ref, sink) => { if (!values.has(ref)) throw new Error(`no value for ${ref}`); return sink(values.get(ref)); },
    redact,
  };
}
const NO_VAULT = { missing: [], has: () => false, typeInto: () => { throw new Error('no vault'); }, redact: (x) => x };

// ── element table, state, questions, decision ────────────────────────────
// Cap: form controls in the viewport → other viewport elements → DOM order.
export function tableFromElements(all, viewport = {}, { max = GATES.MAX_ELEMENTS } = {}) {
  const h = viewport.h ?? viewport.height ?? Infinity;
  const pos = (e) => {
    if (e.inViewport !== undefined) {
      if (e.inViewport) return 'in';
      if (e.rect && e.rect.y + e.rect.h <= 0) return 'above';
      return 'below';
    }
    if (!e.rect) return 'in';
    if (e.rect.y + e.rect.h <= 0) return 'above';
    if (e.rect.y >= h) return 'below';
    return 'in';
  };
  const ranked = all.map((e, i) => ({ e, i, p: pos(e) }));
  const rank = (r) => (r.p === 'in' ? (r.e.formControl ? 0 : 1) : 2);
  const keep = new Set([...ranked].sort((a, b) => rank(a) - rank(b) || a.i - b.i).slice(0, max).map((r) => r.i));
  const rows = ranked.filter((r) => keep.has(r.i)).map((r) => r.e);
  const dropped = ranked.filter((r) => !keep.has(r.i));
  return {
    rows,
    hiddenBelow: dropped.filter((r) => r.p !== 'above').length,
    hiddenAbove: dropped.filter((r) => r.p === 'above').length,
  };
}

// The Jev-facing element: password values never serialize; tainted rows blank.
export function jevElement(e, tainted = false) {
  const o = { index: e.index, role: e.role, label: e.label ?? '' };
  if (e.value !== undefined && e.value !== '' && e.value !== null && !e.password && !tainted) o.value = String(e.value);
  if (e.checked !== undefined) o.checked = e.checked;
  if (e.expanded !== undefined) o.expanded = e.expanded;
  o.ops = e.ops ?? [];
  if (e.options) o.options = e.options.slice(0, 20).map((x) => ({ index: x.index, label: x.label }));
  return o;
}
export const rowText = (e) => `[${e.index}] ${e.role} ${e.label}${e.value ? ` · ${e.value}` : ''}`;

export function buildState(goal, snap, table, history, tainted = new Set()) {
  let text = String(snap.text ?? '').replace(/\s+/g, ' ').trim();
  if (text.length > GATES.TEXT_CAP) text = `${text.slice(0, GATES.TEXT_CAP)}…`;
  const more = [];
  if (table.hiddenBelow) more.push(`+${table.hiddenBelow} more below`);
  if (table.hiddenAbove) more.push(`+${table.hiddenAbove} more above`);
  if (more.length) text = `${text} (${more.join(', ')})`;
  return {
    goal,
    page: { url: snap.url ?? '', title: snap.title ?? '', text },
    elements: table.rows.map((e) => jevElement(e, tainted.has(taintKey(snap, e)))),
    recent_actions: history.slice(-GATES.HISTORY),
    scroll: { y: snap.scrollY ?? 0, above: table.hiddenAbove, below: table.hiddenBelow },
  };
}
export const taintKey = (snap, e) => `${snap.url}|${e.role}|${e.label}`;

export function buildQuestions(state, menu) {
  const els = state.elements ?? [];
  const has = (op) => els.some((e) => (e.ops ?? []).includes(op));
  const ops = [];
  for (const op of OPS) {
    if (TARGET_OPS.has(op) && !has(op)) continue;
    if (op === 'ENTER' && !has('TYPE')) continue;
    if (op === 'SCROLL_DOWN' && !(state.scroll?.below > 0)) continue;
    if (op === 'SCROLL_UP' && !(state.scroll?.above > 0 || state.scroll?.y > 0)) continue;
    ops.push(op);
  }
  const q = [{ id: 'operation', type: 'choice', question: `Which operation moves the browser closest to completing the goal: ${state.goal}`, options: ops }];
  for (const op of ['CLICK', 'TYPE', 'SELECT']) {
    if (!ops.includes(op)) continue;
    q.push({ id: `${op.toLowerCase()}_target`, type: 'choice', question: `If the operation is ${op}, which element should receive it?`, options: els.filter((e) => e.ops.includes(op)).map(rowText) });
  }
  if (ops.includes('TYPE') || ops.includes('SELECT')) {
    const lits = menu.filter((m) => m.kind === 'goal').map((m) => `${m.name} is "${m.text}"`).join('; ');
    q.push({ id: 'type_value', type: 'choice', question: `Which value from the goal should be typed or selected? ${lits ? `(${lits}) ` : ''}Answer none if the goal gives no value for this field.`, options: [...menu.map((m) => m.name), 'none'] });
  }
  if (ops.includes('CLICK')) {
    q.push({ id: 'banner_target', type: 'choice', question: 'If a cookie or consent banner is showing, which element accepts or dismisses it?', options: els.filter((e) => e.ops.includes('CLICK')).map(rowText) });
  }
  q.push(
    { id: 'done', type: 'noul', question: `Is every requirement of the goal visibly satisfied on this page: ${state.goal}` },
    { id: 'irreversible', type: 'noul', question: 'Would the next action pay, delete, send, or submit something that cannot be undone?' },
    { id: 'bot_check', type: 'noul', question: 'Is the page showing a bot check, CAPTCHA, or human-verification challenge?' },
    { id: 'cookie_banner', type: 'noul', question: 'Is a cookie or consent banner covering or blocking the page?' },
    { id: 'error', type: 'noul', question: 'Does the page show an error or failed state?' },
  );
  return q;
}

// Normalises a Jev response to {id: answer}. Accepts `answers`/`results` as an
// object keyed by id or an array aligned with the questions (or carrying id).
export function normalizeAnswers(resp, questions) {
  const raw = resp?.answers ?? resp?.results ?? {};
  if (!Array.isArray(raw)) return raw;
  const out = {};
  raw.forEach((a, i) => { const id = a?.id ?? questions[i]?.id; if (id) out[id] = a; });
  return out;
}
export function noulP(a) {
  if (typeof a === 'number') return a;
  if (!a || typeof a !== 'object') return 0;
  for (const k of ['probability', 'yes', 'p_yes', 'p', 'score']) if (typeof a[k] === 'number') return a[k];
  return 0;
}
// A choice head: the option it names must be one we offered.
export function choiceOf(a, q) {
  if (!a || !q) return { option: null, index: null, conf: 0 };
  let option = typeof a.choice === 'number' ? q.options[a.choice] : a.choice;
  if (typeof option === 'string' && !q.options.includes(option)) {
    const n = /^\s*\[(\d+)\]/.exec(option);
    option = n ? q.options.find((o) => o.startsWith(`[${n[1]}] `)) ?? null : null;
  }
  if (typeof option !== 'string') return { option: null, index: null, conf: 0 };
  let conf = a.confidence;
  if (typeof conf !== 'number' && a.probabilities) {
    const ps = Object.values(a.probabilities).filter((x) => typeof x === 'number').sort((x, y) => y - x);
    conf = (ps[0] ?? 0) - (ps[1] ?? 0);
  }
  const n = /^\[(\d+)\]/.exec(option);
  return { option, index: n ? Number(n[1]) : null, conf: typeof conf === 'number' ? conf : 0 };
}

// Reads only the heads the decision needs: never an off-operation target.
export function decide(answers, questions, G = GATES, ctx = {}) {
  const gates = {};
  const byId = new Map(questions.map((q) => [q.id, q]));
  const p = (id) => (byId.has(id) ? noulP(answers[id]) : 0);
  const gate = (name, value, limit, passIfBelow = false) => { const pass = passIfBelow ? value < limit : value >= limit; gates[name] = { value: +value.toFixed(3), gate: limit, pass }; return pass; };
  const hand = (reason, extra = {}) => ({ op: null, index: null, valueRef: null, handoff: reason, gates, ...extra });

  if (!gate('bot_check', p('bot_check'), G.BOT, true)) return hand('bot');
  if (!ctx.bannerDone && byId.has('banner_target') && p('cookie_banner') >= G.BANNER) {
    gate('cookie_banner', p('cookie_banner'), G.BANNER);
    const t = choiceOf(answers.banner_target, byId.get('banner_target'));
    if (!gate('banner_target', t.conf, G.CONF) || t.index == null) return hand('low_confidence');
    return { op: 'CLICK', index: t.index, option: t.option, valueRef: null, banner: true, gates };
  }
  if (!gate('error', p('error'), G.ERROR, true)) return hand('error');
  if (gate('done', p('done'), G.DONE)) return { op: 'DONE', index: null, valueRef: null, gates };
  const o = choiceOf(answers.operation, byId.get('operation'));
  if (!gate('operation', o.conf, G.CONF) || !o.option) return hand('low_confidence');
  const op = o.option;
  if (op === 'DONE') return { op: 'DONE', index: null, valueRef: null, gates };
  if (op === 'BLOCKED') return hand('error', { detail: 'jev chose BLOCKED' });
  let index = null; let option = null; let valueRef = null;
  if (TARGET_OPS.has(op)) {
    const head = `${op.toLowerCase()}_target`;
    const t = choiceOf(answers[head], byId.get(head));
    if (!gate('target', t.conf, G.CONF) || t.index == null) return hand('low_confidence', { op });
    ({ index, option } = t);
    if (op !== 'CLICK') {
      const v = choiceOf(answers.type_value, byId.get('type_value'));
      if (!v.option || v.option === 'none') { gates.type_value = { value: v.conf, gate: G.CONF, pass: false }; return hand('needs_value', { op, index }); }
      if (!gate('type_value', v.conf, G.CONF)) return hand('low_confidence', { op, index });
      valueRef = v.option;
    }
  }
  if (ACTING.has(op)) {
    const irr = p('irreversible');
    gate('irreversible', irr, G.IRREV, true);
    if (irr >= G.IRREV && !ctx.allowIrreversible) return { op, index, option, valueRef, handoff: 'irreversible', gates };
  }
  return { op, index, option, valueRef, gates };
}

// ── Jev client ───────────────────────────────────────────────────────────
async function jevRequest(env, state, questions) {
  const url = env.BROWSE_JEV_URL || 'https://api.typesafe.ai/v1/systemone';
  const body = JSON.stringify({ model: env.BROWSE_JEV_MODEL || 'jev-latest', state, questions });
  const t0 = Date.now();
  let res;
  try {
    res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${env.TYPESAFE_API_KEY}` }, body, signal: AbortSignal.timeout(3000) });
  } catch (e) { return { kind: 'down', why: e.name === 'TimeoutError' ? 'timeout' : 'network', ms: Date.now() - t0 }; }
  const text = await res.text().catch(() => '');
  const ms = Date.now() - t0;
  if (res.ok) { try { return { kind: 'ok', json: JSON.parse(text), ms }; } catch { return { kind: 'down', why: 'bad json', ms }; } }
  if (res.status >= 400 && res.status < 500 && /token/i.test(text)) return { kind: 'tokens', ms };
  return { kind: 'down', why: `http ${res.status}`, ms };
}

// One decision request: retry once when down; on a token-limit error, halve the
// element budget (rebuild) and retry once.
async function askJev(env, build) {
  let max = GATES.MAX_ELEMENTS; let ms = 0; let tokenRetry = false; let downRetry = false;
  for (;;) {
    const { state, questions } = build(max);
    const r = await jevRequest(env, state, questions);
    ms += r.ms;
    if (r.kind === 'ok') return { state, questions, json: r.json, ms };
    if (r.kind === 'tokens' && !tokenRetry) { tokenRetry = true; max = Math.floor(max / 2); continue; }
    if (r.kind === 'down' && !downRetry) { downRetry = true; continue; }
    throw new Unavailable(`jev${r.why ? `: ${r.why}` : ''}`);
  }
}

// ── page script (element table) ──────────────────────────────────────────
const PAGE_SCRIPT = String.raw`(() => {
  const SEL = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=link], [role=checkbox], [role=radio], [role=tab], [role=menuitem], [role=option], [role=combobox], [role=textbox], [role=switch], [contenteditable]:not([contenteditable=false]), [tabindex]:not([tabindex="-1"])';
  document.querySelectorAll('[data-browse-idx]').forEach((n) => n.removeAttribute('data-browse-idx'));
  const W = innerWidth, H = innerHeight, out = [];
  const clip = (s, n) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const roleOf = (el) => {
    const r = el.getAttribute('role'); if (r) return r;
    const t = el.tagName.toLowerCase(), ty = (el.getAttribute('type') || 'text').toLowerCase();
    if (t === 'a') return 'link'; if (t === 'button') return 'button'; if (t === 'select') return 'combobox'; if (t === 'textarea') return 'textbox';
    if (t === 'input') { if (ty === 'checkbox' || ty === 'radio') return ty; if (['submit', 'button', 'reset', 'image'].includes(ty)) return 'button'; if (ty === 'range') return 'slider'; return 'textbox'; }
    if (el.isContentEditable) return 'textbox';
    return 'generic';
  };
  const labelOf = (el) => {
    const a = el.getAttribute('aria-label'); if (a && a.trim()) return clip(a, 60);
    const lb = el.getAttribute('aria-labelledby');
    if (lb) { const t = lb.split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean).map((n) => n.innerText).join(' '); if (t.trim()) return clip(t, 60); }
    if (el.labels && el.labels.length) { const t = Array.from(el.labels).map((l) => l.innerText).join(' '); if (t.trim()) return clip(t, 60); }
    if (el.getAttribute('placeholder')) return clip(el.getAttribute('placeholder'), 60);
    if (el.tagName === 'INPUT' && ['submit', 'button', 'reset'].includes(el.type) && el.value) return clip(el.value, 60);
    const it = clip(el.innerText, 60); if (it) return it;
    return clip(el.getAttribute('title') || el.getAttribute('alt') || el.getAttribute('name') || '', 60);
  };
  let i = 0;
  for (const el of document.querySelectorAll(SEL)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[aria-hidden=true]') || el.disabled) continue;
    const role = roleOf(el), t = el.tagName.toLowerCase();
    const ops = role === 'textbox' || role === 'searchbox' ? ['TYPE'] : role === 'combobox' && t === 'select' ? ['SELECT'] : role === 'combobox' ? ['CLICK', 'TYPE'] : ['CLICK'];
    const e = { index: i, role, label: labelOf(el), ops, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
    e.inViewport = r.bottom > 0 && r.top < H && r.right > 0 && r.left < W;
    e.formControl = ['input', 'select', 'textarea'].includes(t);
    if (t === 'input' && el.type === 'password') e.password = true;
    if (t === 'input' && (el.type === 'checkbox' || el.type === 'radio')) e.checked = el.checked;
    else if (t === 'select') { e.value = el.selectedOptions[0] ? clip(el.selectedOptions[0].label, 60) : ''; e.options = Array.from(el.options).slice(0, 20).map((o, k) => ({ index: k, label: clip(o.label, 60), value: o.value })); }
    else if (t === 'input' || t === 'textarea') { if (!e.password) e.value = clip(el.value, 200); }
    if (el.hasAttribute('aria-expanded')) e.expanded = el.getAttribute('aria-expanded') === 'true';
    el.setAttribute('data-browse-idx', String(i));
    out.push(e); i++;
  }
  return { url: location.href, title: document.title, text: (document.body ? document.body.innerText : '').replace(/\s+/g, ' ').trim(), viewport: { w: W, h: H }, scrollY: Math.round(scrollY), elements: out };
})()`;
const DIGEST = '(() => location.href + "|" + document.readyState + "|" + Math.round(scrollY) + ":" + (document.body ? document.body.innerHTML.length + ":" + document.body.innerText.length : 0))()';

// ── CDP backend ──────────────────────────────────────────────────────────
class Cdp {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.waiters = [];
    ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString()); } catch { return; }
      if (m.id && this.pending.has(m.id)) {
        const p = this.pending.get(m.id); this.pending.delete(m.id);
        if (m.error) p.reject(new Error(m.error.message)); else p.resolve(m.result);
      } else if (m.method) this.waiters = this.waiters.filter((w) => (w.method === m.method ? (w.resolve(m.params), false) : true));
    };
    ws.onclose = () => { for (const p of this.pending.values()) p.reject(new Error('socket closed')); this.pending.clear(); };
  }
  static connect(url, ms = 5000) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      const t = setTimeout(() => { try { ws.close(); } catch {} reject(new Error('connect timeout')); }, ms);
      ws.onopen = () => { clearTimeout(t); resolve(new Cdp(ws)); };
      ws.onerror = () => { clearTimeout(t); reject(new Error('connect failed')); };
    });
  }
  send(method, params = {}, ms = 10000) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { this.pending.delete(id); reject(new Error(`${method} timeout`)); }, ms);
      this.pending.set(id, { resolve: (v) => { clearTimeout(t); resolve(v); }, reject: (e) => { clearTimeout(t); reject(e); } });
      try { this.ws.send(JSON.stringify({ id, method, params })); } catch (e) { this.pending.delete(id); clearTimeout(t); reject(e); }
    });
  }
  event(method, ms) {
    return new Promise((resolve) => {
      const w = { method, resolve };
      this.waiters.push(w);
      setTimeout(() => { this.waiters = this.waiters.filter((x) => x !== w); resolve(null); }, ms);
    });
  }
  close() { try { this.ws.close(); } catch {} }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url, init = {}, ms = 2000) {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`http ${r.status}`);
  return r.json();
}
export const profileDir = (env = process.env) => env.BROWSE_PROFILE_DIR || path.join(env.XDG_DATA_HOME || path.join(homedir(), '.local', 'share'), 'agentic-workflow', 'browse', 'profile');

export function findChrome(env = process.env) {
  if (env.BROWSE_CHROME) return existsSync(env.BROWSE_CHROME) ? env.BROWSE_CHROME : null;
  for (const name of ['google-chrome', 'chromium', 'chrome']) {
    for (const dir of (env.PATH || '').split(path.delimiter)) {
      if (dir && existsSync(path.join(dir, name))) return path.join(dir, name);
    }
  }
  const apps = process.platform === 'darwin'
    ? ['/Applications/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium']
    : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/snap/bin/chromium'];
  return apps.find((p) => existsSync(p)) ?? null;
}

const freePort = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.once('error', reject);
  s.listen(0, '127.0.0.1', () => { const { port } = s.address(); s.close(() => resolve(port)); });
});

async function launchChrome(env) {
  const bin = findChrome(env);
  if (!bin) throw new Unavailable('chrome: none found — set BROWSE_CHROME or attach with --cdp <url>');
  const profile = profileDir(env);
  mkdirSync(profile, { recursive: true, mode: 0o700 });
  const port = await freePort();
  const child = spawn(bin, ['--headless=new', `--user-data-dir=${profile}`, `--remote-debugging-port=${port}`, '--no-first-run', '--no-default-browser-check', '--use-mock-keychain', '--password-store=basic', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
  let failed = null;
  child.once('error', (e) => { failed = e; });
  const kill = () => { try { child.kill('SIGKILL'); } catch {} };
  process.once('exit', kill);
  const base = `http://127.0.0.1:${port}`;
  const t0 = Date.now();
  while (Date.now() - t0 < 10000) {
    if (failed || child.exitCode !== null) break;
    try { await getJson(`${base}/json/version`, {}, 1000); return { base, child }; } catch { await sleep(100); }
  }
  await stopChild(child);
  throw new Unavailable(`chrome: debug port did not answer within 10 s${failed ? ` (${failed.message})` : ''}`);
}
async function stopChild(child) {
  if (!child || child.exitCode !== null) return;
  const gone = new Promise((r) => child.once('exit', r));
  try { child.kill('SIGTERM'); } catch {}
  if (await Promise.race([gone.then(() => true), sleep(3000).then(() => false)])) return;
  try { child.kill('SIGKILL'); } catch {}
  await Promise.race([gone, sleep(2000)]);
}

async function cdpBackend({ cdpUrl, env, url }) {
  let base; let child = null;
  if (cdpUrl) {
    base = cdpUrl.replace(/\/+$/, '');
    try { await getJson(`${base}/json/version`); } catch (e) { throw new Unavailable(`cdp: ${base} unreachable (${e.message})`); }
  } else ({ base, child } = await launchChrome(env));
  let cdp;
  try {
    let target = null;
    if (!cdpUrl || !url) target = (await getJson(`${base}/json/list`)).find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
    if (!target) target = await getJson(`${base}/json/new?about:blank`, { method: 'PUT' });
    cdp = await Cdp.connect(target.webSocketDebuggerUrl);
    await Promise.all([cdp.send('Page.enable'), cdp.send('Runtime.enable'), cdp.send('DOM.enable')]);
  } catch (e) {
    await stopChild(child);
    throw e instanceof Unavailable ? e : new Unavailable(`cdp: ${e.message}`);
  }
  const evaluate = async (expression) => {
    const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description?.split('\n')[0] || r.exceptionDetails.text);
    return r.result.value;
  };
  const digest = async () => { try { return await evaluate(DIGEST); } catch { return null; } };
  const settle = async () => {
    const t0 = Date.now(); let prev = await digest();
    while (Date.now() - t0 < 1500) {
      await sleep(150);
      const d = await digest();
      if (d && d === prev && d.includes('|complete|')) return;
      prev = d;
    }
  };
  const center = async (index) => evaluate(`(() => { const el = document.querySelector('[data-browse-idx="${Number(index)}"]'); if (!el) return null; el.scrollIntoView({ block: 'center', inline: 'center' }); const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  return {
    async open(u) {
      if (!u) return;
      const load = cdp.event('Page.loadEventFired', 10000);
      const r = await cdp.send('Page.navigate', { url: u });
      if (r.errorText) throw new Unavailable(`cdp: navigate failed (${r.errorText})`);
      await load;
    },
    async snapshot() { await settle(); return evaluate(PAGE_SCRIPT); },
    async act(op, index, value) {
      const before = await digest();
      if (op === 'CLICK') {
        const c = await center(index);
        if (!c) throw new Error(`element ${index} is gone`);
        for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await cdp.send('Input.dispatchMouseEvent', { type, x: c.x, y: c.y, button: 'left', clickCount: type === 'mouseMoved' ? 0 : 1 });
      } else if (op === 'TYPE') {
        const ok = await evaluate(`(() => { const el = document.querySelector('[data-browse-idx="${Number(index)}"]'); if (!el) return false; el.scrollIntoView({ block: 'center' }); el.focus(); if (typeof el.select === 'function') el.select(); else document.execCommand('selectAll'); return true; })()`);
        if (!ok) throw new Error(`element ${index} is gone`);
        await cdp.send('Input.insertText', { text: value });
      } else if (op === 'SELECT') {
        const ok = await evaluate(`((v) => { const el = document.querySelector('[data-browse-idx="${Number(index)}"]'); if (!el || !el.options) return false; const w = String(v).toLowerCase(); const o = Array.from(el.options).find((x) => x.label.toLowerCase() === w || x.value.toLowerCase() === w); if (!o) return false; el.value = o.value; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })(${JSON.stringify(String(value))})`);
        if (!ok) return { pageChanged: false, noOption: true };
      } else if (op === 'ENTER') {
        for (const type of ['keyDown', 'keyUp']) await cdp.send('Input.dispatchKeyEvent', { type, key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, ...(type === 'keyDown' ? { text: '\r' } : {}) });
      } else if (op === 'SCROLL_DOWN' || op === 'SCROLL_UP') {
        await evaluate(`window.scrollBy(0, ${op === 'SCROLL_DOWN' ? '' : '-'}innerHeight)`);
      }
      await sleep(100);
      await settle();
      return { pageChanged: (await digest()) !== before };
    },
    async close() { cdp.close(); await stopChild(child); },
  };
}

// Test-only: recorded element tables, transitions per the case.
function fixtureBackend(spec, env) {
  if (!isLoopback(env.BROWSE_JEV_URL)) throw new Usage('--backend fixture: is test-only (needs a 127.0.0.1 BROWSE_JEV_URL)');
  const [file, name] = spec.split('#');
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  const c = doc.cases ? doc.cases.find((x) => x.name === name) : doc;
  if (!c) throw new Usage(`fixture case not found: ${name}`);
  const dir = path.join(path.dirname(path.resolve(file)), 'elements');
  const load = (page) => JSON.parse(readFileSync(path.join(dir, `${page}.json`), 'utf8'));
  let page = load(c.start);
  return {
    async open() {},
    async snapshot() { return structuredClone(page); },
    async act(op, index, value) {
      const el = page.elements.find((e) => e.index === index);
      if (env.BROWSE_ACT_LOG) appendFileSync(env.BROWSE_ACT_LOG, `${JSON.stringify({ op, index, label: el?.label ?? null, ...(value !== undefined ? { value } : {}) })}\n`);
      if (op === 'TYPE' && el) el.value = value;
      if (op === 'SELECT' && el) el.value = value;
      if (op === 'CLICK' && el && (el.role === 'checkbox' || el.role === 'radio')) el.checked = !el.checked;
      const t = (c.transitions ?? []).find((x) => x.op === op && (!x.label || x.label === el?.label));
      if (t) { page = load(t.to); return { pageChanged: true }; }
      return { pageChanged: op === 'TYPE' || op === 'SELECT' };
    },
    async close() {},
  };
}

// ── trace ────────────────────────────────────────────────────────────────
const git = (...a) => { const r = spawnSync('git', a, { encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null; };
export function traceDir(env = process.env) {
  if (env.BROWSE_TRACE_DIR) return path.resolve(env.BROWSE_TRACE_DIR);
  if (git('rev-parse', '--is-inside-work-tree') === 'true') {
    const g = git('rev-parse', '--git-path', 'agentic-workflow/browse');
    if (g) return path.join(path.resolve(g), 'traces');
  }
  return path.join(env.XDG_STATE_HOME || path.join(homedir(), '.local', 'state'), 'agentic-workflow', 'browse', 'traces');
}
// A trace path inside the worktree (outside its git dir) is refused.
export function traceInWorktree(p) {
  const top = git('rev-parse', '--show-toplevel');
  if (!top) return false;
  const abs = path.resolve(p);
  const inside = (root) => abs === root || abs.startsWith(root + path.sep);
  const gd = git('rev-parse', '--absolute-git-dir');
  return inside(path.resolve(top)) && !(gd && inside(path.resolve(gd)));
}
function openTrace(file) {
  const dir = path.dirname(file);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  try { chmodSync(dir, 0o700); if (path.basename(dir) === 'traces') chmodSync(path.dirname(dir), 0o700); } catch {}
  closeSync(openSync(file, 'a', 0o600));
  try { chmodSync(file, 0o600); } catch {}
  return (line) => appendFileSync(file, `${line}\n`);
}

// ── commands ─────────────────────────────────────────────────────────────
export function parseArgs(argv) {
  const o = { _: [] };
  const flags = new Set(['json', 'allow-irreversible']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) { o._.push(a); continue; }
    const k = a.slice(2);
    const key = k.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
    if (flags.has(k)) o[key] = true;
    else { if (i + 1 >= argv.length) throw new Usage(`${a} needs a value`); o[key] = argv[++i]; }
  }
  return o;
}

const median = (xs) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); const m = s.length >> 1; return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2); };

function makeIO(vault) {
  return {
    out: (s) => process.stdout.write(`${vault.redact(s)}\n`),
    err: (s) => process.stderr.write(`${vault.redact(`browse: ${s}`)}\n`),
  };
}

function summary(r) {
  const lines = [`browse: ${r.status}${r.reason ? ` (${r.reason})` : ''} — ${r.steps} step(s), ${r.ms_total} ms, Jev median ${r.ms_jev_median} ms`];
  lines.push(`page: ${r.page?.title ?? ''} <${r.page?.url ?? ''}>`);
  if (r.verify) lines.push(`verify: ${r.verify.method} → ${r.verify.passed ? 'passed' : 'failed'}`);
  if (r.proposed) lines.push(`proposed: ${r.proposed.op} [${r.proposed.index}] ${r.proposed.label ?? ''}${r.proposed.valueRef ? ` ← ${r.proposed.valueRef}` : ''}`);
  if (r.detail) lines.push(`detail: ${r.detail}`);
  if (r.trace_path) lines.push(`trace: ${r.trace_path}`);
  return lines.join('\n');
}

async function cmdRun(o, env) {
  if (!o.goal) throw new Usage('run needs --goal');
  if (!env.TYPESAFE_API_KEY) { process.stderr.write(`${NO_KEY_LINE}\n`); return EXIT['no-key']; }
  const { goal, menu } = parseGoal(o.goal);
  const t0 = Date.now();
  const tracePath = o.trace ? path.resolve(o.trace) : path.join(traceDir(env), `${new Date().toISOString().replace(/[:.]/g, '-')}.jsonl`);
  if (traceInWorktree(tracePath)) { process.stderr.write('browse: trace must not live in the worktree\n'); return EXIT.error; }
  const authPath = path.resolve('docs/AUTH.md');
  const authMd = menu.some((m) => m.kind === 'secret') && existsSync(authPath) ? readFileSync(authPath, 'utf8') : '';
  const vault = makeVault(menu, authMd, env);
  const io = makeIO(vault);
  const jevMs = []; let steps = 0; let snap = null; let table = { rows: [] };
  const history = []; const tainted = new Set();
  const finish = (status, extra = {}) => {
    const r = vault.redact({
      status, reason: extra.reason ?? null, steps, ms_total: Date.now() - t0, ms_jev_median: median(jevMs),
      page: { url: snap?.url ?? '', title: snap?.title ?? '' }, elements: table.rows.map((e) => rowText(jevElement(e, tainted.has(taintKey(snap, e))))),
      ...(extra.proposed ? { proposed: extra.proposed } : {}), ...(extra.detail ? { detail: extra.detail } : {}),
      verify: extra.verify ?? { method: 'none', passed: false }, trace_path: steps ? tracePath : null,
    });
    io.out(o.json ? JSON.stringify(r) : summary(r));
    return exitFor(status);
  };
  if (vault.missing.length) return finish('handed-off', { reason: 'needs_secret', detail: `no value for ${vault.missing.map((m) => `{{secret:${m}}}`).join(', ')} in docs/AUTH.md Test users` });
  if (o.untilUrl) { try { new RegExp(o.untilUrl); } catch { throw new Usage('--until-url is not a valid regex'); } }

  let backend;
  try {
    backend = o.backend?.startsWith('fixture:') ? fixtureBackend(o.backend.slice(8), env) : await cdpBackend({ cdpUrl: o.cdp || env.BROWSE_CDP_URL, env, url: o.url });
  } catch (e) {
    if (e instanceof Unavailable) { io.err(`backend unavailable (${e.message})`); return finish('backend-unavailable', { reason: 'backend', detail: e.message }); }
    throw e;
  }
  let write = null;
  const trace = (row) => { write ??= openTrace(tracePath); write(JSON.stringify(vault.redact(row))); };
  const ctx = { bannerDone: false, allowIrreversible: Boolean(o.allowIrreversible) };
  const maxSteps = Math.min(Number(o.maxSteps) || GATES.MAX_STEPS, 100);
  let waits = 0; let repeat = { key: null, n: 0 };
  try {
    await backend.open(o.url);
    for (;;) {
      if (steps >= maxSteps) return finish('handed-off', { reason: 'max_steps' });
      const tStep = Date.now();
      snap = await backend.snapshot();
      const build = (max) => {
        table = tableFromElements(snap.elements, snap.viewport, { max });
        const state = vault.redact(buildState(goal, snap, table, history, tainted));
        return { state, questions: buildQuestions(state, menu) };
      };
      let ask;
      try { ask = await askJev(env, build); } catch (e) {
        if (e instanceof Unavailable) { io.err(`backend unavailable (${e.message})`); return finish('backend-unavailable', { reason: 'jev', detail: e.message }); }
        throw e;
      }
      steps += 1; jevMs.push(ask.ms);
      const answers = normalizeAnswers(ask.json, ask.questions);
      const d = decide(answers, ask.questions, GATES, ctx);
      const el = d.index != null ? table.rows.find((e) => e.index === d.index) : null;
      const row = { step: steps, url_before: snap.url, url_after: snap.url, op: d.op, role: el?.role ?? null, label: el?.label ?? null, index: d.index, valueRef: d.valueRef, handoff: d.handoff ?? null, questions: ask.questions, answers, gates: d.gates, ms_jev: ask.ms, input_tokens: ask.json?.usage?.input_tokens ?? null };
      const proposed = d.op ? { op: d.op, index: d.index, label: el?.label ?? null, valueRef: d.valueRef } : undefined;
      // Loop guards: WAIT run, identical (op,index) run.
      if (!d.handoff && d.op === 'WAIT') waits += 1; else waits = 0;
      const key = `${d.op}:${d.index}`;
      repeat = repeat.key === key ? { key, n: repeat.n + 1 } : { key, n: 1 };
      let handoff = d.handoff;
      if (!handoff && (waits > GATES.MAX_WAITS || (d.op !== 'DONE' && repeat.n >= GATES.REPEAT))) handoff = 'stuck';
      if (!handoff && d.valueRef && !vault.has(d.valueRef)) handoff = 'needs_value';
      if (handoff) {
        trace({ ...row, handoff, ms_step: Date.now() - tStep });
        if (handoff === 'irreversible') return finish('irreversible-pending', { reason: 'irreversible', proposed });
        return finish('handed-off', { reason: handoff, proposed, detail: d.detail });
      }
      if (d.op === 'DONE') {
        trace({ ...row, ms_step: Date.now() - tStep });
        snap = await backend.snapshot();
        table = tableFromElements(snap.elements, snap.viewport);
        let verify;
        if (o.untilUrl || o.untilText) {
          const okUrl = o.untilUrl ? new RegExp(o.untilUrl).test(snap.url) : true;
          const okText = o.untilText ? String(snap.text ?? '').includes(o.untilText) : true;
          verify = { method: o.untilUrl && o.untilText ? 'until-url+until-text' : o.untilUrl ? 'until-url' : 'until-text', passed: okUrl && okText };
        } else {
          const vq = [{ id: 'goal_complete', type: 'noul', question: `Does this page show that ${goal} is complete?` }];
          let vr;
          try {
            vr = await askJev(env, () => ({ state: vault.redact(buildState(goal, snap, table, history, tainted)), questions: vq }));
          } catch (e) {
            if (e instanceof Unavailable) { io.err(`backend unavailable (${e.message})`); return finish('backend-unavailable', { reason: 'jev', detail: e.message }); }
            throw e;
          }
          jevMs.push(vr.ms);
          const pv = noulP(normalizeAnswers(vr.json, vq).goal_complete);
          verify = { method: 'jev', passed: pv >= GATES.DONE, value: pv };
        }
        return finish(verify.passed ? 'done' : 'done-unverified', { reason: verify.passed ? null : 'done-unverified', verify });
      }
      let r;
      if (d.valueRef) {
        r = await vault.typeInto(d.valueRef, (v) => backend.act(d.op, d.index, v));
        if (d.valueRef.startsWith('{{secret:') && el) tainted.add(taintKey(snap, el));
      } else r = await backend.act(d.op, d.index);
      if (r?.noOption) { trace({ ...row, handoff: 'needs_value', ms_step: Date.now() - tStep }); return finish('handed-off', { reason: 'needs_value', proposed, detail: 'no option matches the chosen value' }); }
      if (d.banner) ctx.bannerDone = true;
      if (d.op.startsWith('SCROLL') && r?.pageChanged) repeat = { key: null, n: 0 };
      history.push({ step: steps, op: d.op, index: d.index, label: el?.label ?? null, valueRef: d.valueRef, changed: Boolean(r?.pageChanged) });
      trace({ ...row, url_after: snap.url, page_changed: Boolean(r?.pageChanged), ms_step: Date.now() - tStep });
    }
  } catch (e) {
    if (e instanceof Unavailable) { io.err(`backend unavailable (${e.message})`); return finish('backend-unavailable', { reason: 'backend', detail: e.message }); }
    if (e instanceof Usage) throw e;
    io.err(e.message);
    return finish('error', { reason: 'internal', detail: e.message });
  } finally { await backend.close().catch(() => {}); }
}

// `step` never builds a vault and never reads AUTH.md: its input redaction is
// structural (password rows lose their value).
async function cmdStep(o, env) {
  if (!o.goal || !o.state) throw new Usage('step needs --goal and --state <file.json>');
  if (!env.TYPESAFE_API_KEY) { process.stderr.write(`${NO_KEY_LINE}\n`); return EXIT['no-key']; }
  const { goal, menu } = parseGoal(o.goal);
  const raw = JSON.parse(readFileSync(o.state, 'utf8'));
  const page = raw.page ?? { url: raw.url, title: raw.title, text: raw.text };
  const snap = { url: page.url ?? '', title: page.title ?? '', text: page.text ?? '', viewport: raw.viewport, scrollY: raw.scrollY ?? raw.scroll?.y ?? 0, elements: raw.elements ?? [] };
  let history = [];
  if (o.history && existsSync(o.history)) {
    const h = readFileSync(o.history, 'utf8').trim();
    history = h.startsWith('[') ? JSON.parse(h) : h.split('\n').filter(Boolean).map((l) => JSON.parse(l));
  }
  const ctx = { bannerDone: history.some((h) => h.banner) };
  let res;
  try {
    res = await askJev(env, (max) => {
      const table = tableFromElements(snap.elements, snap.viewport, { max });
      const state = buildState(goal, snap, table, history.map(({ step, op, index, label, valueRef }) => ({ step, op, index, label, valueRef })));
      return { state, questions: buildQuestions(state, menu), table };
    });
  } catch (e) {
    if (e instanceof Unavailable) { process.stderr.write(`browse: backend unavailable (${e.message})\n`); return EXIT['backend-unavailable']; }
    throw e;
  }
  const d = decide(normalizeAnswers(res.json, res.questions), res.questions, GATES, ctx);
  const el = d.index != null ? snap.elements.find((e) => e.index === d.index) : null;
  const lit = menu.find((m) => m.name === d.valueRef && m.kind === 'goal');
  const out = { op: d.op, index: d.index, label: el?.label ?? null, valueRef: d.valueRef, ...(lit ? { value: lit.text } : {}), ...(d.banner ? { banner: true } : {}), gates: d.gates, ms_jev: res.ms };
  if (d.op === 'DONE') out.note = 'DONE is unverified: check the page against the goal yourself';
  let code = EXIT.done;
  if (d.handoff === 'irreversible') { out.handoff = 'irreversible'; code = EXIT['irreversible-pending']; }
  else if (d.handoff) { out.handoff = d.handoff; out.reason = d.handoff; code = EXIT['handed-off']; }
  else if (d.valueRef?.startsWith('{{secret:')) { out.handoff = 'needs_secret'; out.reason = 'needs_secret'; code = EXIT['handed-off']; process.stderr.write(`browse: ${STEP_SECRET_LINE}\n`); }
  process.stdout.write(`${JSON.stringify(out)}\n`);
  return code;
}

async function cmdSnapshot(o, env) {
  let backend;
  try { backend = await cdpBackend({ cdpUrl: o.cdp || env.BROWSE_CDP_URL || (o.url ? null : 'http://127.0.0.1:9222'), env, url: o.url }); } catch (e) {
    if (e instanceof Unavailable) { process.stderr.write(`browse: backend unavailable (${e.message})\n`); return EXIT['backend-unavailable']; }
    throw e;
  }
  try {
    await backend.open(o.url);
    const s = await backend.snapshot();
    for (const e of s.elements) if (e.password) delete e.value;
    if (o.json) process.stdout.write(`${JSON.stringify(s)}\n`);
    else {
      const t = tableFromElements(s.elements, s.viewport);
      process.stdout.write(`${s.title} <${s.url}>\n`);
      for (const e of t.rows) process.stdout.write(`${rowText(jevElement(e))}\n`);
      if (t.hiddenBelow || t.hiddenAbove) process.stdout.write(`(+${t.hiddenBelow} more below, +${t.hiddenAbove} more above)\n`);
    }
    return EXIT.done;
  } catch (e) {
    process.stderr.write(`browse: backend unavailable (cdp: ${e.message})\n`);
    return EXIT['backend-unavailable'];
  } finally { await backend.close().catch(() => {}); }
}

async function readMcp(res) {
  const text = await res.text();
  if ((res.headers.get('content-type') || '').includes('text/event-stream')) {
    const msgs = text.split('\n').filter((l) => l.startsWith('data:')).map((l) => { try { return JSON.parse(l.slice(5).trim()); } catch { return null; } }).filter(Boolean);
    return msgs.find((m) => m.id !== undefined) ?? msgs[0] ?? null;
  }
  return JSON.parse(text);
}

async function probeNeoMcp(url) {
  const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream' };
  const post = (body, h = headers) => fetch(url, { method: 'POST', headers: h, body: JSON.stringify(body), signal: AbortSignal.timeout(2000) });
  const init = await post({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'agentic-workflow-browse', version: '1' } } });
  if (!init.ok) throw new Error(`initialize http ${init.status}`);
  await readMcp(init);
  const sid = init.headers.get('mcp-session-id');
  const h = sid ? { ...headers, 'mcp-session-id': sid } : headers;
  await post({ jsonrpc: '2.0', method: 'notifications/initialized' }, h).then((r) => r.text()).catch(() => {});
  const list = await post({ jsonrpc: '2.0', id: 2, method: 'tools/list' }, h);
  if (!list.ok) throw new Error(`tools/list http ${list.status}`);
  const m = await readMcp(list);
  if (m?.error) throw new Error(`tools/list: ${m.error.message}`);
  return (m?.result?.tools ?? []).map((t) => t.name);
}

async function cmdDoctor(o, env) {
  const rows = [];
  const add = (name, value, ok) => rows.push({ name, value, ok });
  const major = nodeMajor(env);
  add('Node', `${process.versions.node}${major >= 22 ? ' (ok, ≥ 22)' : ' — need ≥ 22 for the global WebSocket'}`, major >= 22);
  add('Key', `TYPESAFE_API_KEY ${env.TYPESAFE_API_KEY ? 'set' : 'unset — run/step exit 6; use Bash-driven Playwright'}`, Boolean(env.TYPESAFE_API_KEY));
  const chrome = findChrome(env);
  add('Chrome', chrome ?? 'none — set BROWSE_CHROME or attach with --cdp <url>', Boolean(chrome));
  const cdpUrl = (env.BROWSE_CDP_URL || 'http://127.0.0.1:9222').replace(/\/+$/, '');
  try { const v = await getJson(`${cdpUrl}/json/version`); add('CDP', `${cdpUrl} → ${v.Browser ?? 'answered'}`, true); } catch (e) { add('CDP', `${cdpUrl} unreachable (${e.message})`, false); }
  const mcpUrl = env.BROWSE_MCP_URL || 'http://127.0.0.1:9200/mcp';
  const neoBase = new URL(mcpUrl).origin;
  try { const v = await getJson(`${neoBase}/json/version`); add('neo CDP', `${neoBase} → ${v.Browser ?? 'answered'} (run --cdp ${neoBase})`, true); } catch (e) { add('neo CDP', `${neoBase} unreachable (${e.message})`, false); }
  try { const names = await probeNeoMcp(mcpUrl); add('neo MCP', `${mcpUrl} tools: ${names.join(', ') || '(none listed)'}`, true); } catch (e) { add('neo MCP', `${mcpUrl} unreachable (${e.message})`, false); }
  add('Trace dir', traceDir(env), true);
  add('Profile', profileDir(env), true);
  if (o.json) process.stdout.write(`${JSON.stringify(rows)}\n`);
  else for (const r of rows) process.stdout.write(`${r.name.padEnd(10)} ${r.value}\n`);
  return 0;
}

const USAGE = 'usage: browse.mjs run --goal <g> [--url <u>] [--cdp <url>] [--until-url <re>] [--until-text <s>] [--allow-irreversible] [--json] [--trace <file>] [--max-steps N]\n       browse.mjs step --goal <g> --state <file.json> [--history <file>]\n       browse.mjs snapshot [--url <u> | --cdp <url>] [--json]\n       browse.mjs doctor [--json]';

async function main(argv = process.argv.slice(2), env = process.env) {
  const [cmd, ...rest] = argv;
  if (cmd !== 'doctor' && !NODE_OK) {
    process.stderr.write(`browse: Node ≥ 22 required (global WebSocket); found ${env.BROWSE_FAKE_NODE && isLoopback(env.BROWSE_JEV_URL) ? env.BROWSE_FAKE_NODE : process.versions.node}\n`);
    return EXIT['backend-unavailable'];
  }
  try {
    const o = parseArgs(rest);
    if (cmd === 'run') return await cmdRun(o, env);
    if (cmd === 'step') return await cmdStep(o, env);
    if (cmd === 'snapshot') return await cmdSnapshot(o, env);
    if (cmd === 'doctor') return await cmdDoctor(o, env);
    process.stderr.write(`${USAGE}\n`);
    return EXIT.error;
  } catch (e) {
    if (e instanceof Usage) { process.stderr.write(`browse: ${e.message}\n${USAGE}\n`); return EXIT.error; }
    throw e;
  }
}

if (IS_MAIN) {
  main().then((c) => process.exit(c), (e) => { process.stderr.write(`browse: ${e.message}\n`); process.exit(1); });
}
