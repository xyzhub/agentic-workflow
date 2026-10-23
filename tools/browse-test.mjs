#!/usr/bin/env node
// Tier-1.5 behavioral test for tools/browse.mjs (fast browser use via Jev).
// Zero deps; Node >= 22. Run: node tools/browse-test.mjs (0 = pass, 1 = fail)
//
// Recorded answers prove gate plumbing, not accuracy; the live numbers come
// from OB-34. The answers in tools/fixtures/browse/answers/ are synthetic (no
// TYPESAFE_API_KEY on the build machine); the element tables were captured
// from headless Chrome. No real Jev call and no Chrome are needed here: loop
// cases run `browse.mjs run --backend fixture:…` against a local stub Jev
// server that serves the recorded answers and records every request body.
// The live CDP smoke runs only with BROWSE_LIVE_SMOKE=1 and a resolvable
// Chrome (temp profile, removed afterwards); otherwise it prints `skip`.

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOOL = path.join(ROOT, 'plugins/agentic-workflow/tools/browse.mjs');
const FIX = path.join(ROOT, 'plugins/agentic-workflow/tools/fixtures/browse');
const B = await import(pathToFileURL(TOOL).href);

let failures = 0; let count = 0;
const check = (name, ok, detail = '') => {
  count++;
  if (ok) console.log(`ok   ${name}`);
  else { failures++; console.log(`FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
};
const json = (f) => JSON.parse(readFileSync(f, 'utf8'));
const elements = (n) => json(path.join(FIX, 'elements', `${n}.json`));
const SECRET = 'hunter2-fixture';
const LOGIN = 'alice@demo.test';
const forms = (v) => [v, encodeURIComponent(v), v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')];
const leaks = (s, v) => forms(v).some((f) => String(s).includes(f));
const AUTH = `# AUTH\n\n## Test users\n\n| Role | Email / login | Password | Org / venue | Surfaces | Seed anchor |\n|---|---|---|---|---|---|\n| alice | ${LOGIN} | $BROWSE_TEST_PW | Demo | /login | \`seed.ts\` |\n| Admin | admin@demo.test | demo1234 (seeded) | Demo | /admin | \`seed.ts\` |\n\n## How to sign in\n`;

// ── pure functions ───────────────────────────────────────────────────────
const g = B.parseGoal('sign in as {{secret:alice.password}} and type "Jane Doe" then \'x\' {{secret:alice.password}}');
check('parseGoal: secret ref + quoted literals → menu', g.menu.length === 3 && g.menu[0].name === '{{secret:alice.password}}' && g.menu[1].name === '{{goal:1}}' && g.menu[1].text === 'Jane Doe' && g.menu[2].text === 'x', JSON.stringify(g.menu));
check('resolveSecret: $NAME cell → env value', B.resolveSecret('alice.password', AUTH, { BROWSE_TEST_PW: SECRET }) === SECRET);
check('resolveSecret: login cell, role case-insensitive, seeded literal', B.resolveSecret('ALICE.login', AUTH, {}) === LOGIN && B.resolveSecret('admin.password', AUTH, {}) === 'demo1234');
check('resolveSecret: login local part matches', B.resolveSecret('admin.login', AUTH, {}) === 'admin@demo.test');
check('resolveSecret: unset env / unknown user → null', B.resolveSecret('alice.password', AUTH, {}) === null && B.resolveSecret('bob.password', AUTH, {}) === null);
const tricky = 'p&ss<w>rd "q" /?x=1';
const v = B.makeVault(B.parseGoal('{{secret:alice.password}} and {{secret:bob.password}}').menu, AUTH.replace('$BROWSE_TEST_PW', '$TEST_T'), { TEST_T: tricky });
check('makeVault: missing secrets listed', v.missing.length === 1 && v.missing[0] === 'bob.password', JSON.stringify(v.missing));
const red = JSON.stringify(v.redact({ a: `raw ${tricky}`, b: [`url ${encodeURIComponent(tricky)}`], c: { d: `html ${forms(tricky)[2]}` } }));
check('redact: raw, URL-encoded and HTML-escaped forms → reference', !leaks(red, tricky) && (red.match(/\{\{secret:alice\.password\}\}/g) || []).length === 3, red);
let sunk = null;
v.typeInto('{{secret:alice.password}}', (x) => { sunk = x; });
check('vault: typeInto hands the value only to the sink; the vault serializes empty', sunk === tricky && !leaks(JSON.stringify(v), tricky));

const big = elements('big'); const bigS = elements('big-scrolled');
const tb = B.tableFromElements(big.elements, big.viewport);
check('table: 130-control page capped at 80 rows', big.elements.length >= 120 && tb.rows.length === 80, `${big.elements.length}/${tb.rows.length}`);
check('table: hiddenBelow ≥ 40, target (101st) not in the first window', tb.hiddenBelow >= 40 && !tb.rows.some((e) => e.label === 'Save notification settings'), String(tb.hiddenBelow));
const ts = B.tableFromElements(bigS.elements, bigS.viewport);
check('table: after one scroll the target is in the window and rows are hidden above', ts.rows.some((e) => e.label === 'Save notification settings') && ts.hiddenAbove > 0);
const sb = B.buildState('g', big, tb, []);
const qb = B.buildQuestions(sb, []);
const opsB = qb.find((q) => q.id === 'operation').options;
check('questions: SCROLL_DOWN offered when rows are hidden below; no SCROLL_UP at top', opsB.includes('SCROLL_DOWN') && !opsB.includes('SCROLL_UP'), opsB.join(','));
check('state: page.text says "+N more below"', /\+50 more below/.test(sb.page.text), sb.page.text.slice(-40));
const login = elements('login');
const ql = B.buildQuestions(B.buildState('g', login, B.tableFromElements(login.elements, login.viewport), []), []);
const opsL = ql.find((q) => q.id === 'operation').options;
check('questions: only ops with a compatible element; targets list compatible rows only', !opsL.includes('SELECT') && !opsL.includes('SCROLL_DOWN') && ql.find((q) => q.id === 'type_target').options.every((o) => /textbox/.test(o)) && ql.find((q) => q.id === 'click_target').options.length === 1, opsL.join(','));
check('questions: the five nouls are asked', ['done', 'irreversible', 'bot_check', 'cookie_banner', 'error'].every((id) => ql.some((q) => q.id === id && q.type === 'noul')));
const pw = { index: 1, role: 'textbox', label: 'Password', password: true, value: SECRET, ops: ['TYPE'] };
check('jevElement: password rows never carry a value; tainted rows blank', !('value' in B.jevElement(pw)) && !('value' in B.jevElement({ ...pw, password: false }, true)));
check('state: page.text capped at 2000 chars', B.buildState('g', { text: 'x'.repeat(5000) }, { rows: [], hiddenBelow: 0, hiddenAbove: 0 }, []).page.text.length <= 2001);

const ans = json(path.join(FIX, 'answers', 'login.json'));
const touched = new Set();
const spy = new Proxy(ans[0].answers, { get: (t, k) => { touched.add(k); return t[k]; } });
const d1 = B.decide(spy, ql, B.GATES);
check('decide: reads only the chosen op\'s target head (confident decoy on click_target ignored)', d1.op === 'TYPE' && d1.index === 0 && !touched.has('click_target') && !touched.has('select_target'), [...touched].join(','));
const mk = (o) => ({ ...ans[2].answers, ...o });
check('decide: operation confidence 0.69 → low_confidence', B.decide(mk({ operation: { choice: 'CLICK', confidence: 0.69 } }), ql).handoff === 'low_confidence');
check('decide: target confidence 0.69 → low_confidence', B.decide(mk({ click_target: { choice: '[2] button Sign in', confidence: 0.69 } }), ql).handoff === 'low_confidence');
check('decide: a choice not offered is never acted on', B.decide(mk({ click_target: { choice: '[9] button Pay', confidence: 0.99 } }), ql).handoff === 'low_confidence');
check('decide: bot_check 0.70 → bot', B.decide(mk({ bot_check: { probability: 0.7 } }), ql).handoff === 'bot');
check('decide: error 0.80 → error', B.decide(mk({ error: { probability: 0.8 } }), ql).handoff === 'error');
const irr = mk({ irreversible: { probability: 0.5 } });
check('decide: irreversible 0.50 → proposed, unless --allow-irreversible', B.decide(irr, ql).handoff === 'irreversible' && B.decide(irr, ql).index === 2 && !B.decide(irr, ql, B.GATES, { allowIrreversible: true }).handoff);
check('decide: done ≥ 0.80 → DONE (verification follows)', B.decide(mk({ done: { probability: 0.8 } }), ql).op === 'DONE');
const ban = mk({ cookie_banner: { probability: 0.9 }, banner_target: { choice: '[2] button Sign in', confidence: 0.9 } });
check('decide: cookie banner gets one CLICK, then is ignored', B.decide(ban, ql).banner === true && !B.decide(ban, ql, B.GATES, { bannerDone: true }).banner);
check('exitFor: 0 done · 2 unverified · 3 handed off · 4 irreversible · 5 unavailable · 6 no key · 1 else', [B.exitFor('done'), B.exitFor('done-unverified'), B.exitFor('handed-off'), B.exitFor('irreversible-pending'), B.exitFor('backend-unavailable'), B.exitFor('no-key'), B.exitFor('???')].join() === '0,2,3,4,5,6,1');
check('GATES: D3 values', B.GATES.CONF === 0.7 && B.GATES.DONE === 0.8 && B.GATES.BOT === 0.7 && B.GATES.BANNER === 0.8 && B.GATES.IRREV === 0.5 && B.GATES.ERROR === 0.8 && B.GATES.MAX_STEPS === 30 && B.GATES.MAX_ELEMENTS === 80 && B.GATES.TEXT_CAP === 2000 && B.GATES.HISTORY === 5);

// S1-fix: gate order, banner refusal, secret binding, env refusal, redaction edges.
const qBan = B.buildQuestions(B.buildState('g', { url: 'http://a.test/' }, { rows: [{ index: 0, role: 'button', label: 'Confirm order', ops: ['CLICK'] }, { index: 1, role: 'button', label: 'Accept all', ops: ['CLICK'] }], hiddenBelow: 0, hiddenAbove: 0 }, []), []);
const banA = (t, o = {}) => ({ operation: { choice: 'CLICK', confidence: 0.9 }, click_target: { choice: '[1] button Accept all', confidence: 0.9 }, banner_target: { choice: t, confidence: 0.95 }, cookie_banner: { probability: 0.9 }, bot_check: { probability: 0.01 }, error: { probability: 0.01 }, irreversible: { probability: 0.01 }, done: { probability: 0.01 }, ...o });
const dRef = B.decide(banA('[0] button Confirm order'), qBan);
check('banner: a target labelled like an action (Confirm order) is refused → low_confidence, no click', dRef.handoff === 'low_confidence' && !dRef.banner && /action/.test(dRef.detail), JSON.stringify(dRef));
check('banner: a consent button is still clicked once', B.decide(banA('[1] button Accept all'), qBan).banner === true);
check('banner: error gate runs before the banner branch', B.decide(banA('[1] button Accept all', { error: { probability: 0.9 } }), qBan).handoff === 'error');
check('banner: irreversible signal blocks the banner click, even with --allow-irreversible', B.decide(banA('[1] button Accept all', { irreversible: { probability: 0.99 } }), qBan, B.GATES, { allowIrreversible: true }).handoff === 'low_confidence');
check('noulP: no numeric field → null', B.noulP({ verdict: 'no' }) === null && B.noulP(undefined) === null && B.noulP({ probability: 0.2 }) === 0.2);
check('decide: unknown shape on bot_check/error/irreversible fails closed (error, "Jev answer shape unknown")', ['bot_check', 'error', 'irreversible'].every((id) => { const d = B.decide(banA('[1] button Accept all', { [id]: { verdict: 'no' } }), qBan); return d.handoff === 'error' && d.detail === 'Jev answer shape unknown'; }));
const pwEl = { role: 'textbox', label: 'Password', password: true }; const txEl = { role: 'textbox', label: 'Email' };
check('secretBinding: password ref → password field on the run origin is allowed', B.secretBinding('{{secret:alice.password}}', pwEl, 'http://a.test', 'http://a.test/login') === null && B.secretBinding('{{secret:alice.login}}', txEl, 'http://a.test', 'http://a.test/x') === null);
check('secretBinding: password ref into a plain textbox refused', /password field/.test(B.secretBinding('{{secret:alice.password}}', txEl, 'http://a.test', 'http://a.test/login') ?? ''));
check('secretBinding: login ref into a password field or a button refused', /plain text field/.test(B.secretBinding('{{secret:alice.login}}', pwEl, 'http://a.test', 'http://a.test/') ?? '') && /plain text field/.test(B.secretBinding('{{secret:alice.login}}', { role: 'button', label: 'x' }, 'http://a.test', 'http://a.test/') ?? ''));
check('secretBinding: another origin refused; goal literals are never bound', /origin/.test(B.secretBinding('{{secret:alice.password}}', pwEl, 'http://a.test', 'http://evil.test/login') ?? '') && B.secretBinding('{{goal:1}}', { role: 'button' }, null, 'x') === null);
const refAuth = AUTH.replace('$BROWSE_TEST_PW', '$TYPESAFE_API_KEY');
const rv = B.makeVault(B.parseGoal('{{secret:alice.password}}').menu, refAuth, { TYPESAFE_API_KEY: 'sk-real-key-123' });
check('AUTH.md $TYPESAFE_API_KEY refused (needs_secret, plain line, no value)', B.resolveSecretInfo('alice.password', refAuth, { TYPESAFE_API_KEY: 'sk-real-key-123' }).refused === '$TYPESAFE_API_KEY' && rv.missing.length === 1 && rv.problems[0].startsWith(B.REFUSED_LINE) && !rv.problems.join().includes('sk-real'));
check('AUTH.md env allowlist: DB_PASSWORD, STRIPE_SECRET, GH_TOKEN refused; TEST_ALICE_PW, BROWSE_TEST_PW, ADMIN_TEST_PASSWORD allowed', ['DB_PASSWORD', 'STRIPE_SECRET', 'GH_TOKEN', 'TYPESAFE_API_KEY', 'TEST_', 'test_alice'].every((n) => !B.ALLOWED_ENV.test(n)) && ['TEST_ALICE_PW', 'BROWSE_TEST_PW', 'ADMIN_TEST_PASSWORD'].every((n) => B.ALLOWED_ENV.test(n)));
check('resolveSecretInfo: $DB_PASSWORD and $STRIPE_SECRET refused, $TEST_ALICE_PW resolves', ['DB_PASSWORD', 'STRIPE_SECRET'].every((n) => B.resolveSecretInfo('alice.password', AUTH.replace('$BROWSE_TEST_PW', `$${n}`), { [n]: 'real-value-1' }).refused === `$${n}`) && B.resolveSecretInfo('alice.password', AUTH.replace('$BROWSE_TEST_PW', '$TEST_ALICE_PW'), { TEST_ALICE_PW: 'pw-123456' }).value === 'pw-123456');
// pageGuard runs in the page; here it gets a fake document/location.
const fakeEl = (o) => { const e = { tagName: 'INPUT', type: 'password', isConnected: true, focused: false, scrollIntoView() {}, focus() { e.focused = true; fakeDoc.activeElement = e; }, select() {}, ...o }; return e; };
const fakeDoc = { activeElement: null, el: null, querySelector() { return this.el; }, execCommand() {} };
const guardRun = (el, origin, kind, at = 'https://app.test') => { fakeDoc.el = el; fakeDoc.activeElement = null; return B.pageGuard(fakeDoc, { origin: at }, '[x]', origin, kind); };
const swapped = fakeEl({ isConnected: false });
check('pageGuard: DOM swap (node gone or detached) → refused before focus, so no insertText', guardRun(null, 'https://app.test', 'password').why === 'the field changed after the snapshot' && guardRun(swapped, 'https://app.test', 'password').why && !swapped.focused);
const pwIn = fakeEl({}); const txIn = fakeEl({ type: 'text' });
check('pageGuard: password into type=password on the origin → focused ok', guardRun(pwIn, 'https://app.test', 'password').ok === true && pwIn.focused);
check('pageGuard: password into a text input / login into a password input / other origin → refused, no focus', /password field/.test(guardRun(fakeEl({ type: 'text' }), 'https://app.test', 'password').why) && /plain text/.test(guardRun(fakeEl({}), 'https://app.test', 'login').why) && /origin/.test(guardRun(fakeEl({}), 'https://app.test', 'password', 'https://evil.test').why) && guardRun(txIn, 'https://app.test', 'login').ok === true);
const sv = B.makeVault(B.parseGoal('{{secret:alice.password}}').menu, AUTH, { BROWSE_TEST_PW: 'ab12x' });
check('makeVault: a secret under 6 chars is refused (needs_secret, plain line)', sv.missing[0] === 'alice.password' && /shorter than 6/.test(sv.problems[0]));
const STR = 'straddle-secret-XYZ';
const stv = B.makeVault(B.parseGoal('{{secret:alice.password}}').menu, AUTH, { BROWSE_TEST_PW: STR });
const stSnap = { url: 'http://a.test/', text: `${'a'.repeat(1995)}${STR} tail` };
const empty = { rows: [], hiddenBelow: 0, hiddenAbove: 0 };
const capRaw = B.buildState('g', stSnap, empty, [], new Set(), stv.maskTail).page.text;
const capRed = B.buildState('g', stv.redact(stSnap), empty, [], new Set(), stv.maskTail).page.text;
check('cap: a secret straddling the 2000-char cap leaks no prefix (masked tail, and redacted before the cap)', !capRaw.includes('strad') && !capRed.includes('strad'), capRaw.slice(-12));
const wsv = B.makeVault(B.parseGoal('{{secret:alice.password}}').menu, AUTH, { BROWSE_TEST_PW: 'two  spaced   words' });
check('redact: the whitespace-collapsed form of a secret is redacted too', !JSON.stringify(wsv.redact(B.buildState('g', { text: 'x two  spaced   words y' }, empty, []))).includes('two spaced words'));

// ── loop cases: CLI × fixture backend × stub Jev ─────────────────────────
// browse.mjs refuses Node < 22 by design (exit 5); on such a runner the CLI
// cases print `skip` instead of failing, and the pure cases above still run.
if (Number(process.versions.node.split('.')[0]) < 22) {
  console.log(`skip CLI and loop cases — Node ${process.versions.node} < 22 (browse.mjs needs the global WebSocket)`);
  console.log(failures ? `\n${failures} failure(s) of ${count}` : `\nall ${count} passed`);
  process.exit(failures ? 1 : 0);
}
let stub = { answers: [], i: 0, bodies: [] };
const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    stub.bodies.push(body);
    const a = stub.answers[stub.i++];
    if (!a) { res.writeHead(500); res.end('no more answers'); return; }
    if (a.http) { res.writeHead(a.http, { 'content-type': 'application/json' }); res.end(a.body ?? '{}'); return; }
    setTimeout(() => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(a)); }, a.delay ?? 0);
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const JEV = `http://127.0.0.1:${server.address().port}/v1/systemone`;

const runCli = (args, { env = {}, cwd = ROOT } = {}) => new Promise((resolve) => {
  const base = { PATH: process.env.PATH, HOME: process.env.HOME };
  const p = spawn('node', [TOOL, ...args], { cwd, env: { ...base, ...env } });
  let stdout = ''; let stderr = '';
  p.stdout.on('data', (c) => { stdout += c; });
  p.stderr.on('data', (c) => { stderr += c; });
  p.on('close', (status) => resolve({ status, stdout, stderr }));
});

const tmp = mkdtempSync(path.join(tmpdir(), 'browse-test-'));
try {
  const work = path.join(tmp, 'work'); mkdirSync(path.join(work, 'docs'), { recursive: true });
  writeFileSync(path.join(work, 'docs', 'AUTH.md'), AUTH);
  const traces = path.join(tmp, 'traces');
  const cases = json(path.join(FIX, 'cases.json')).cases;
  const results = {};
  for (const c of cases) {
    stub = { answers: json(path.join(FIX, 'answers', `${c.name}.json`)), i: 0, bodies: [] };
    const actLog = path.join(tmp, `${c.name}.acts.jsonl`);
    const traceDir = path.join(traces, c.name);
    const r = await runCli(['run', '--backend', `fixture:${path.join(FIX, 'cases.json')}#${c.name}`, '--goal', c.goal, '--json', ...c.args],
      { cwd: work, env: { TYPESAFE_API_KEY: 'test-key', BROWSE_JEV_URL: JEV, BROWSE_TRACE_DIR: traceDir, BROWSE_ACT_LOG: actLog, BROWSE_TEST_PW: SECRET } });
    const acts = existsSync(actLog) ? readFileSync(actLog, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
    let out = null; try { out = JSON.parse(r.stdout); } catch {}
    const traceText = existsSync(traceDir) ? readdirSync(traceDir).map((f) => readFileSync(path.join(traceDir, f), 'utf8')).join('') : '';
    results[c.name] = { r, acts, out, bodies: stub.bodies, traceText, traceDir };
    const want = c.expected.map((e) => `${e.op}:${e.label}`).join(' ');
    const got = acts.map((a) => `${a.op}:${a.label}`).join(' ');
    check(`loop ${c.name}: exit ${c.exit}${c.reason ? ` (${c.reason})` : ''}, acts = expected`, r.status === c.exit && (!c.reason || out?.reason === c.reason) && got === want, `exit ${r.status} reason ${out?.reason} acts [${got}] want [${want}] ${r.stderr.trim()}`);
  }
  const all = Object.values(results);
  const sent = all.flatMap((x) => x.bodies).join('\n');
  check('stub Jev: no request body carries a resolved secret (raw, URL-encoded, HTML-escaped)', !leaks(sent, SECRET) && !leaks(sent, LOGIN) && sent.includes('{{secret:alice.password}}'));

  const L = results.login;
  const typed = L.acts.find((a) => a.op === 'TYPE' && a.label === 'Password');
  const outBytes = all.map((x) => x.r.stdout + x.r.stderr + x.traceText).join('\n');
  check('secret two-sided: act log TYPE Password = the secret; stdout/stderr/trace carry only {{secret:alice.password}}',
    typed?.value === SECRET && L.acts.find((a) => a.label === 'Email')?.value === LOGIN && !leaks(outBytes, SECRET) && !leaks(outBytes, LOGIN) && L.traceText.includes('{{secret:alice.password}}'), JSON.stringify(typed));
  check('login: verified by --until-text; trace path in the result', L.out?.verify?.method === 'until-text' && L.out?.verify?.passed === true && L.out?.trace_path?.startsWith(L.traceDir));
  const tf = L.out?.trace_path && existsSync(L.out.trace_path) ? L.out.trace_path : null;
  check('trace: file 0600, dir 0700, one JSON line per step', tf && (statSync(tf).mode & 0o777) === 0o600 && (statSync(path.dirname(tf)).mode & 0o777) === 0o700 && L.traceText.trim().split('\n').length === 4);
  check('login-jev: DONE verified by a second Jev request with the D5 wording', results['login-jev'].out?.verify?.method === 'jev' && /Does this page show that .* is complete\?/.test(results['login-jev'].bodies.at(-1)));
  const c1 = results.cookie.bodies[0] && JSON.parse(results.cookie.bodies[0]);
  check('cookie: banner clicked before the goal (confident Subscribe ignored on step 1)', results.cookie.acts[0]?.label === 'Accept all' && c1?.questions?.some((q) => q.id === 'banner_target'));
  check('wizard: literal typed and option selected from the goal', results['wizard-name'].acts[0]?.value === 'Jane Doe' && results['wizard-plan'].acts[0]?.value === 'Annual');
  const b0 = JSON.parse(results.big.bodies[0]);
  check('big: first request offers SCROLL_DOWN, ≤ 80 rows, ≥ 40 hidden below; target clicked after the scroll',
    b0.questions[0].options.includes('SCROLL_DOWN') && b0.state.elements.length <= 80 && b0.state.scroll.below >= 40 && results.big.acts.map((a) => a.op).join() === 'SCROLL_DOWN,CLICK');
  check('irreversible: nothing executed, proposed returned', results.irreversible.acts.length === 0 && results.irreversible.out?.proposed?.label === 'Delete account');
  check('jev down: 503 twice → one retry then exit 5', results['jev-down'].bodies.length === 2 && /backend unavailable \(jev/.test(results['jev-down'].r.stderr));
  const tk = results['token-limit'].bodies.map((x) => JSON.parse(x));
  check('token limit: element budget halved and retried once', tk.length === 2 && tk[0].state.elements.length === 80 && tk[1].state.elements.length === 40);
  check('stuck: identical (op,index) a 3rd time hands off without acting', results.stuck.acts.length === 2);

  // needs_secret before any request (user missing from AUTH.md).
  stub = { answers: [], i: 0, bodies: [] };
  const ns = await runCli(['run', '--backend', `fixture:${path.join(FIX, 'cases.json')}#login`, '--goal', 'sign in with {{secret:bob.password}}', '--json'],
    { cwd: work, env: { TYPESAFE_API_KEY: 'test-key', BROWSE_JEV_URL: JEV, BROWSE_TRACE_DIR: path.join(traces, 'ns') } });
  check('run: unresolvable secret → exit 3 needs_secret before the first Jev request', ns.status === 3 && JSON.parse(ns.stdout).reason === 'needs_secret' && stub.bodies.length === 0, ns.stdout + ns.stderr);

  // A goal with a secret needs an operator-given origin.
  stub = { answers: [], i: 0, bodies: [] };
  const no = await runCli(['run', '--backend', `fixture:${path.join(FIX, 'cases.json')}#login`, '--goal', 'sign in with {{secret:alice.password}}', '--json'],
    { cwd: work, env: { TYPESAFE_API_KEY: 'test-key', BROWSE_JEV_URL: JEV, BROWSE_TRACE_DIR: path.join(traces, 'no'), BROWSE_TEST_PW: SECRET } });
  check('run: secret goal without --url/--origin → exit 3 needs_secret "secrets need --url or --origin", no request', no.status === 3 && JSON.parse(no.stdout).detail === B.SECRET_ORIGIN_LINE && no.stderr.includes(B.SECRET_ORIGIN_LINE) && stub.bodies.length === 0, no.stdout + no.stderr);

  // AUTH.md naming a real credential: refused before any Jev request.
  const refWork = path.join(tmp, 'refused'); mkdirSync(path.join(refWork, 'docs'), { recursive: true });
  writeFileSync(path.join(refWork, 'docs', 'AUTH.md'), refAuth);
  stub = { answers: [], i: 0, bodies: [] };
  const rf = await runCli(['run', '--backend', `fixture:${path.join(FIX, 'cases.json')}#login`, '--goal', 'sign in with {{secret:alice.password}}', '--json'],
    { cwd: refWork, env: { TYPESAFE_API_KEY: 'test-key-refused', BROWSE_JEV_URL: JEV, BROWSE_TRACE_DIR: path.join(traces, 'rf') } });
  check('run: AUTH.md $TYPESAFE_API_KEY → exit 3 needs_secret, the refusal line, no request, key never printed', rf.status === 3 && JSON.parse(rf.stdout).reason === 'needs_secret' && rf.stderr.includes(B.REFUSED_LINE) && stub.bodies.length === 0 && !(rf.stdout + rf.stderr).includes('test-key-refused'), rf.stdout + rf.stderr);
  check('loop secret binding: cross-origin page and password-into-textbox both hand off with no act', results['secret-cross-origin'].acts.length === 0 && /origin/.test(results['secret-cross-origin'].out?.detail ?? '') && results['secret-wrong-field'].acts.length === 0 && /password field/.test(results['secret-wrong-field'].out?.detail ?? ''));
  check('loop banner + irreversible: no click', results['banner-irreversible'].acts.length === 0);

  // step: hand-back surface never resolves secrets.
  const stepCwd = path.join(tmp, 'stepcwd'); mkdirSync(stepCwd);
  stub = { answers: [json(path.join(FIX, 'answers', 'login.json'))[1]], i: 0, bodies: [] };
  const st = await runCli(['step', '--state', path.join(FIX, 'elements', 'login.json'), '--goal', 'sign in as {{secret:alice.password}}'],
    { cwd: stepCwd, env: { TYPESAFE_API_KEY: 'test-key', BROWSE_JEV_URL: JEV, BROWSE_TEST_PW: SECRET } });
  let so = null; try { so = JSON.parse(st.stdout); } catch {}
  check('step needs_secret: secret valueRef → exit 3, hand-back line, no value anywhere', st.status === 3 && so?.reason === 'needs_secret' && so?.valueRef === '{{secret:alice.password}}' && st.stderr.includes(B.STEP_SECRET_LINE) && !leaks(st.stdout + st.stderr, SECRET) && !existsSync(path.join(stepCwd, 'docs')), st.stdout + st.stderr);
  stub = { answers: [json(path.join(FIX, 'answers', 'wizard-name.json'))[0]], i: 0, bodies: [] };
  const st2 = await runCli(['step', '--state', path.join(FIX, 'elements', 'wizard-1.json'), '--goal', 'enter the name "Jane Doe" and continue'], { cwd: stepCwd, env: { TYPESAFE_API_KEY: 'test-key', BROWSE_JEV_URL: JEV } });
  let so2 = null; try { so2 = JSON.parse(st2.stdout); } catch {}
  check('step: decided → exit 0 with {op, index, label, valueRef}', st2.status === 0 && so2?.op === 'TYPE' && so2?.index === 0 && so2?.label === 'Full name' && so2?.valueRef === '{{goal:1}}', st2.stdout + st2.stderr);
  stub = { answers: [json(path.join(FIX, 'answers', 'irreversible.json'))[0]], i: 0, bodies: [] };
  const st3 = await runCli(['step', '--state', path.join(FIX, 'elements', 'irreversible.json'), '--goal', 'delete my account'], { cwd: stepCwd, env: { TYPESAFE_API_KEY: 'test-key', BROWSE_JEV_URL: JEV } });
  check('step: irreversible → exit 4', st3.status === 4, st3.stdout + st3.stderr);

  // Exit 6, Node floor, test-only gates, trace in the worktree.
  const nk = await runCli(['run', '--goal', 'x', '--url', 'http://127.0.0.1:1/'], { cwd: work });
  check('no key: run → exit 6 with the exact fallback line, nothing on stdout', nk.status === 6 && nk.stderr === `${B.NO_KEY_LINE}\n` && nk.stdout === '', JSON.stringify(nk));
  const nk2 = await runCli(['step', '--goal', 'x', '--state', path.join(FIX, 'elements', 'login.json')], { cwd: work });
  check('no key: step → exit 6 with the same line', nk2.status === 6 && nk2.stderr === `${B.NO_KEY_LINE}\n`);
  const fn = await runCli(['run', '--goal', 'x'], { cwd: work, env: { BROWSE_FAKE_NODE: '20', BROWSE_JEV_URL: JEV, TYPESAFE_API_KEY: 'test-key' } });
  check('Node floor: BROWSE_FAKE_NODE=20 with a loopback Jev URL → exit 5 and the line', fn.status === 5 && /Node ≥ 22 required \(global WebSocket\); found 20/.test(fn.stderr), fn.stderr);
  const fn2 = await runCli(['run', '--goal', 'x'], { cwd: work, env: { BROWSE_FAKE_NODE: '20', BROWSE_JEV_URL: 'https://example.invalid/v1' } });
  check('Node floor: BROWSE_FAKE_NODE ignored with a non-loopback Jev URL', fn2.status === 6, String(fn2.status));
  const fx = await runCli(['run', '--goal', 'x', '--backend', `fixture:${path.join(FIX, 'cases.json')}#login`], { cwd: work, env: { TYPESAFE_API_KEY: 'test-key', BROWSE_JEV_URL: 'https://example.invalid/v1', BROWSE_TRACE_DIR: path.join(traces, 'fx') } });
  check('fixture backend refused unless the Jev URL is loopback', fx.status === 1 && /test-only/.test(fx.stderr), fx.stderr);
  const wt = path.join(ROOT, 'browse-trace-should-not-exist.jsonl');
  const tw = await runCli(['run', '--goal', 'x', '--trace', wt, '--backend', `fixture:${path.join(FIX, 'cases.json')}#login`], { cwd: ROOT, env: { TYPESAFE_API_KEY: 'test-key', BROWSE_JEV_URL: JEV } });
  check('--trace inside the worktree → exit 1, nothing written', tw.status === 1 && /trace must not live in the worktree/.test(tw.stderr) && !existsSync(wt), tw.stderr);
  const dr = await runCli(['doctor', '--json'], { cwd: work, env: { BROWSE_CDP_URL: 'http://127.0.0.1:1', BROWSE_MCP_URL: 'http://127.0.0.1:1/mcp', TYPESAFE_API_KEY: 'sk-should-not-print' } });
  check('doctor: exit 0, key reported as set without its value', dr.status === 0 && /TYPESAFE_API_KEY set/.test(dr.stdout) && !dr.stdout.includes('sk-should-not-print'), dr.stdout);

  // Live CDP smoke (opt-in; never in CI).
  const chrome = B.findChrome(process.env);
  if (process.env.BROWSE_LIVE_SMOKE !== '1' || !chrome) {
    console.log(`skip live CDP smoke — ${process.env.BROWSE_LIVE_SMOKE !== '1' ? 'BROWSE_LIVE_SMOKE is not 1' : 'no Chrome binary resolves'}`);
  } else {
    const site = http.createServer((req, res) => {
      const f = path.join(FIX, path.basename(new URL(req.url, 'http://x').pathname));
      if (!f.endsWith('.html') || !existsSync(f)) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': 'text/html' }); res.end(readFileSync(f));
    });
    await new Promise((r) => site.listen(0, '127.0.0.1', r));
    const profile = mkdtempSync(path.join(tmpdir(), 'browse-profile-'));
    try {
      const sm = await runCli(['snapshot', '--url', `http://127.0.0.1:${site.address().port}/login.html`], { cwd: work, env: { BROWSE_PROFILE_DIR: profile, BROWSE_CHROME: chrome } });
      const rows = sm.stdout.split('\n').filter((l) => /^\[\d+\] /.test(l));
      check('live CDP smoke: snapshot of login.html prints ≥ 3 rows', sm.status === 0 && rows.length >= 3, sm.stdout + sm.stderr);
      const swapAns = json(path.join(FIX, 'answers', 'login.json'))[1];
      stub = { answers: [{ ...swapAns, delay: 1500 }], i: 0, bodies: [] };
      const sw = await runCli(['run', '--json', '--url', `http://127.0.0.1:${site.address().port}/swap.html`, '--goal', 'sign in with {{secret:alice.password}}'],
        { cwd: work, env: { BROWSE_PROFILE_DIR: profile, BROWSE_CHROME: chrome, TYPESAFE_API_KEY: 'test-key', BROWSE_JEV_URL: JEV, BROWSE_TRACE_DIR: path.join(traces, 'swap'), BROWSE_TEST_PW: SECRET } });
      let swo = null; try { swo = JSON.parse(sw.stdout); } catch {}
      check('live DOM swap between snapshot and act → needs_secret, the in-page guard refused before insertText', sw.status === 3 && swo?.reason === 'needs_secret' && swo?.detail === 'the field changed after the snapshot' && stub.bodies.length === 1 && !leaks(sw.stdout + sw.stderr, SECRET), sw.stdout + sw.stderr);
    } finally {
      site.close();
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    }
  }
} finally {
  server.close();
  rmSync(tmp, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} failure(s) of ${count}` : `\nall ${count} passed`);
process.exit(failures ? 1 : 0);
