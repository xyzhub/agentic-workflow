#!/usr/bin/env node
// Tier-1.5 behavioral test for the unattended round runner
// (plugins/agentic-workflow/tools/runner.mjs) and its redaction module
// (tools/redact.mjs). Zero deps; Node >= 18.
// Run: node tools/runner-test.mjs (0 = pass, 1 = fail)
//
// Drives runner.mjs against a FAKE claude (CLAUDE_BIN) that writes canned
// stream-json; no API call is ever made. Every child process gets an env
// built from scratch (never the caller's): an inherited
// AGENTIC_WORKFLOW_UNATTENDED=1 would refuse begin/record, an inherited
// AGENTIC_WORKFLOW_CHILD=1 would silence mission-budget.sh and make parity
// vacuous, and an operator's `git-identity` on PATH would flip the AC-31 cases.
// Hermetic git: GIT_CONFIG_GLOBAL points at a temp file and
// GIT_CONFIG_NOSYSTEM=1, and each throwaway repo carries its own local signing
// config. (hook-test.mjs uses GIT_CONFIG_COUNT/KEY_n instead; here a
// GIT_CONFIG_KEY_n=user.signingkey env pair would make redact.mjs scrub the
// NAME `user.signingkey` out of the creds-missing line, by design.)

import {
  chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ROOT, 'plugins/agentic-workflow');
const RUNNER = path.join(PLUGIN, 'tools/runner.mjs');
const SCHEMA = JSON.parse(readFileSync(path.join(PLUGIN, 'templates/runner-contract.schema.json'), 'utf8'));
const TMP = mkdtempSync(path.join(tmpdir(), 'runner-test-'));
const BIN = path.join(TMP, 'bin'); // fake claude (+ optional fake git-identity)
mkdirSync(BIN);
const FAKE = path.join(BIN, 'claude');
const FAKE_LOG = path.join(TMP, 'fake-claude.log');
const GITCONFIG = path.join(TMP, 'gitconfig');
writeFileSync(GITCONFIG, '[user]\n\tname = runner test\n\temail = runner@test.invalid\n[init]\n\tdefaultBranch = main\n');
const GH_VALUE = 'gho_FAKEGHVALUE7777abcdef';
const SLACK_VALUE = 'xoxb-FAKE-ENV-0005-slack-value';
const CANARIES = ['sk-TESTSECRET0001', 'ghp_TESTSECRET0002', 'xoxb-TEST-SECRET-0003', 'Bearer TESTSECRET0004', SLACK_VALUE];
const NODE_DIR = path.dirname(process.execPath);
const BASE_ENV = {
  PATH: `${BIN}:${NODE_DIR}:/usr/bin:/bin`,
  HOME: path.join(TMP, 'home'),
  XDG_STATE_HOME: path.join(TMP, 'xdg'),
  GIT_CONFIG_GLOBAL: GITCONFIG,
  GIT_CONFIG_NOSYSTEM: '1',
  CLAUDE_BIN: FAKE,
  GH_TOKEN: GH_VALUE,
  FAKE_SLACK_BOT_TOKEN: SLACK_VALUE,
  FAKE_LOG,
  FAKE_RUNNER: RUNNER,
  // Planted so the child env can be proven clean of them:
  ANTHROPIC_API_KEY: 'sk-ant-FAKEKEY-must-not-reach-child',
  ANTHROPIC_AUTH_TOKEN: 'fake-auth-token-must-not-reach-child',
  AGENTIC_WORKFLOW_CHILD: '1',
  CLAUDECODE: '1',
  LANG: 'C',
};
mkdirSync(BASE_ENV.HOME);
// The in-process half of the harness (exported functions) sees the same env.
for (const k of Object.keys(process.env)) delete process.env[k];
Object.assign(process.env, BASE_ENV);

const R = await import(pathToFileURL(RUNNER).href);
const { redact } = await import(pathToFileURL(path.join(PLUGIN, 'tools/redact.mjs')).href);

let failures = 0;
let cases = 0;
const SEEN = []; // every stdout/stderr the runner produced, for the canary sweeps
const check = (name, ok, detail = '') => {
  cases++;
  if (ok) console.log(`ok   ${name}`);
  else { failures++; console.log(`FAIL ${name}${detail ? ` — ${String(detail).slice(0, 600)}` : ''}`); }
};

// ── the fake claude ────────────────────────────────────────────────────────
// Scenario from FAKE_SCENARIO; side effects aimed by FAKE_LEDGER / FAKE_HANDOFF /
// FAKE_TAMPER_FILE. Records each model invocation (not --version / auth) to FAKE_LOG.
writeFileSync(FAKE, `#!/usr/bin/env node
const fs = require('fs');
const a = process.argv.slice(2);
if (a[0] === '--version') { console.log('2.1.999 (Claude Code)'); process.exit(0); }
if (a[0] === 'auth') process.exit(process.env.FAKE_LOGIN === '0' ? 1 : 0);
const e = process.env;
fs.appendFileSync(e.FAKE_LOG, JSON.stringify({ argv: a, unattended: e.AGENTIC_WORKFLOW_UNATTENDED ?? null,
  child: 'AGENTIC_WORKFLOW_CHILD' in e, apiKey: 'ANTHROPIC_API_KEY' in e, authToken: 'ANTHROPIC_AUTH_TOKEN' in e,
  claudecode: 'CLAUDECODE' in e, window: e.CLAUDE_CODE_AUTO_COMPACT_WINDOW ?? null }) + '\\n');
const sc = e.FAKE_SCENARIO || 'done';
const out = (o) => process.stdout.write(JSON.stringify(o) + '\\n');
const usage = { input_tokens: 1000, output_tokens: 200, cache_creation_input_tokens: 300, cache_read_input_tokens: 500 };
const big = { input_tokens: 2600000, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
const advance = (text) => { if (!e.FAKE_LEDGER) return; const t = fs.readFileSync(e.FAKE_LEDGER, 'utf8'); fs.writeFileSync(e.FAKE_LEDGER, t.replace(/^Next up:.*$/m, 'Next up: ' + (text || 'S2 advanced'))); };
const ok = (extra = {}, u = usage) => out({ type: 'result', subtype: 'success', is_error: false, result: 'round done', session_id: 'sess-1', usage: u, ...extra });
out({ type: 'system', subtype: 'init', session_id: 'sess-1', model: 'fake' });
out({ type: 'assistant', message: { content: [{ type: 'text', text: 'EVENTS-ONLY-MARKER working' }] } });
switch (sc) {
  case 'done': advance(); ok(); break;
  case 'big': advance(e.FAKE_NEXT || 'S2 big'); ok({}, big); break;
  case 'nousage': advance(); out({ type: 'result', subtype: 'success', result: 'x', session_id: 'sess-1' }); break;
  case 'noprog': ok(); break;
  case 'handoff-only': ok(); break;
  case 'touch-handoff': fs.mkdirSync(require('path').dirname(e.FAKE_HANDOFF), { recursive: true }); fs.writeFileSync(e.FAKE_HANDOFF, 'next: x\\n'); ok(); break;
  case 'stale-mtime': advance(); fs.utimesSync(e.FAKE_LEDGER, 1000000000, 1000000000); ok(); break;
  case 'crash': process.stderr.write('boom\\n'); process.exit(1);
  case 'canary-crash': advance('S2 ' + ${JSON.stringify(CANARIES.slice(0, 4).join(' '))} + ' ' + e.FAKE_SLACK_BOT_TOKEN + ' ' + e.GH_TOKEN);
    process.stderr.write(${JSON.stringify(CANARIES.slice(0, 4).join(' '))} + ' ' + e.FAKE_SLACK_BOT_TOKEN + '\\n');
    out({ type: 'assistant', message: { content: [{ type: 'text', text: ${JSON.stringify(CANARIES.join(' '))} }] } });
    process.exit(1);
  case 'login': process.stderr.write('Login expired · Please run /login\\n'); out({ type: 'result', subtype: 'error_during_execution', is_error: true, result: 'Login expired', session_id: 'sess-1' }); process.exit(1);
  case 'apikey': out({ type: 'result', subtype: 'error_during_execution', is_error: true, result: 'Invalid API key · Fix external API key', session_id: 'sess-1' }); process.exit(1);
  case 'auth-neg': advance(); ok({ result: 'fixed the 401 authentication bug; not logged in path covered' }); break;
  case 'hook': advance(); ok({ terminal_reason: 'hook_stopped' }); break;
  case 'gate': fs.appendFileSync(require('path').join(process.cwd(), '.plans/pending-gates.md'), '- [ ] G-1 merge PR #12 — open\\n'); ok(); break;
  case 'budget': advance(); out({ type: 'result', subtype: 'error_max_budget_usd', is_error: true, session_id: 'sess-1', usage }); break;
  case 'forge': (async () => { // an in-round record with a self-computed digest, UNATTENDED unset
    advance();
    const R = await import(require('url').pathToFileURL(e.FAKE_RUNNER).href);
    const sd = R.stateDir(process.cwd());
    const n = Number(fs.readFileSync(sd + '/lock', 'utf8').split(' ')[2]);
    const f = sd + '/forged.json';
    fs.writeFileSync(f, JSON.stringify({ contract_version: 1, round: n, code: 0, outcome: 'done', reason: 'forged', tokens: 0, session_id: null }));
    const env = { ...e }; delete env.AGENTIC_WORKFLOW_UNATTENDED;
    const r = require('child_process').spawnSync('node', [e.FAKE_RUNNER, 'record', '--round', String(n), '--from', f, '--digest', R.snapshotProtected(process.cwd(), sd, n).digest], { env, encoding: 'utf8' });
    fs.writeFileSync(sd + '/forge-result.txt', String(r.status));
    ok();
  })(); break;
  case 'tamper': advance(); fs.writeFileSync(e.FAKE_TAMPER_FILE, e.FAKE_TAMPER_TEXT || '{}'); ok(); break;
  default: ok();
}
`);
chmodSync(FAKE, 0o755);
const fakeCalls = () => (existsSync(FAKE_LOG) ? readFileSync(FAKE_LOG, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);

// ── fixtures ───────────────────────────────────────────────────────────────
const LEDGER = (o = {}) => [
  '# demo', '', 'Status: active', `Estimate: ${o.est ?? 4} sessions`, `Sessions used: ${o.used ?? 1}`,
  ...(o.tb != null ? [`Tick budget: ${o.tb}`] : []), ...(o.tt != null ? [`Tick tokens: ${o.tt}`] : []), ...(o.mb != null ? [`Mission budget: ${o.mb}`] : []),
  `Next up: ${o.next ?? 'S1 build the thing'}`, '', '- [ ] S1 — build', '- [ ] S2 — review', '',
].join('\n');
let repoN = 0;
function mkRepo({ ledger = LEDGER(), signing = true, config = { project: 'demo' } } = {}) {
  const dir = path.join(TMP, `repo-${++repoN}`);
  mkdirSync(dir);
  spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, env: BASE_ENV });
  if (signing) {
    spawnSync('git', ['config', 'commit.gpgsign', 'true'], { cwd: dir, env: BASE_ENV });
    spawnSync('git', ['config', 'user.signingkey', 'test-signing-key-id'], { cwd: dir, env: BASE_ENV });
  }
  if (ledger) {
    mkdirSync(path.join(dir, '.plans'));
    writeFileSync(path.join(dir, '.plans/demo.state.md'), ledger);
    utimesSync(path.join(dir, '.plans/demo.state.md'), 1_000_000_000, 1_000_000_000);
  }
  if (config) { mkdirSync(path.join(dir, '.claude')); writeFileSync(path.join(dir, '.claude/runner.json'), `${JSON.stringify(config)}\n`); }
  return dir;
}
const SD = (dir) => path.join(dir, '.git/agentic-workflow/runner');
const ledgerOf = (dir) => path.join(dir, '.plans/demo.state.md');
function run(dir, args, env = {}, input) {
  const r = spawnSync('node', [RUNNER, ...args], { cwd: dir, encoding: 'utf8', input, env: { ...BASE_ENV, FAKE_LEDGER: ledgerOf(dir), FAKE_HANDOFF: path.join(dir, '.git/agentic-workflow/session-handoff.md'), ...env } });
  SEEN.push(r.stdout, r.stderr);
  return { code: r.status, out: r.stdout.trim(), err: r.stderr.trim() };
}
const age = (dir) => { // pretend the backoff delay has elapsed
  const p = path.join(SD(dir), 'backoff.json');
  if (existsSync(p)) { const b = JSON.parse(readFileSync(p, 'utf8')); b.at = '1970-01-01T00:00:00.000Z'; writeFileSync(p, JSON.stringify(b)); }
};
const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };
const roundsLog = (dir) => read(path.join(SD(dir), 'rounds.log')) || '';
const lastLine = (dir) => roundsLog(dir).trim().split('\n').pop() || '';

// Zero-dep validator (tools/agents-test.mjs:84–104) + integer, enum and $ref.
function validate(value, schema, where = '') {
  if (schema.$ref) schema = SCHEMA.definitions[schema.$ref.split('/').pop()];
  const errs = [];
  const types = [].concat(schema.type || []);
  const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  let t = typeOf(value);
  if (t === 'number' && Number.isInteger(value) && types.includes('integer')) t = 'integer';
  if (types.length && !types.includes(t)) { errs.push(`${where || '(root)'}: expected ${types.join('|')}, got ${t}`); return errs; }
  if (schema.enum && value !== null && !schema.enum.includes(value)) errs.push(`${where}: ${JSON.stringify(value)} not in enum`);
  if (t === 'object' && schema.properties) {
    for (const k of schema.required || []) if (!(k in value)) errs.push(`${where}: missing "${k}"`);
    if (schema.additionalProperties === false) for (const k of Object.keys(value)) if (!(k in schema.properties)) errs.push(`${where}: unexpected "${k}"`);
    for (const [k, sub] of Object.entries(schema.properties)) if (k in value) errs.push(...validate(value[k], sub, where ? `${where}.${k}` : k));
  }
  if (t === 'array' && schema.items) value.forEach((v, i) => errs.push(...validate(v, schema.items, `${where}[${i}]`)));
  return errs;
}
const shapeOk = (name, json, def) => { let v; try { v = JSON.parse(json); } catch (e) { check(name, false, `not JSON: ${json}`); return null; } const errs = validate(v, SCHEMA.definitions[def]); check(name, errs.length === 0, errs.join('; ')); return v; };
const mask = (l) => l.replace(/#\d+ \S+Z /, '#N T ');

try {
  // ── AC-4 exit-code table, one fixture per row ────────────────────────────
  const rows = [
    ['done', 0, 'done'], ['noprog', 22, 'no-progress'], ['crash', 1, 'crashed'], ['login', 75, 'auth-expired'],
    ['hook', 21, 'handoff-failed'], ['gate', 20, 'gate-pending'], ['budget', 30, 'budget-stop'],
  ];
  for (const [sc, code, outcome] of rows) {
    const d = mkRepo();
    const r = run(d, ['round'], { FAKE_SCENARIO: sc });
    check(`exit table: ${sc} round → ${code} ${outcome}`, r.code === code && lastLine(d).includes(` ${outcome} `), `${r.code} ${r.out} ${r.err} | ${lastLine(d)}`);
  }
  {
    const d = mkRepo();
    run(d, ['round'], { FAKE_SCENARIO: 'login' });
    const al = read(path.join(SD(d), 'alerts.log')) || '';
    check('75 on a fake `Login expired` result alerts the approver once (J1 text, no key clause)', /auth-expired/.test(lastLine(d)) && /run `claude \/login`\. No work is lost/.test(al) && !/API/.test(al), al);
    const d2 = mkRepo();
    run(d2, ['next'], { FAKE_LOGIN: '0' }); run(d2, ['next'], { FAKE_LOGIN: '0' });
    check('no login at next → one auth-expired alert per day', (read(path.join(SD(d2), 'alerts.log')) || '').split('\n').filter((l) => l.includes('auth-expired')).length === 1);
    check('--help prints the header and exits 0', (() => { const h = run(d2, ['--help']); return h.code === 0 && /Exit codes/.test(h.out); })());
    check('roundPrompt(unit, cfg) works with the brief\'s two arguments', R.roundPrompt('/agentic-workflow:operate', R.readConfig(d2)).includes('/agentic-workflow:operate'));
  }
  {
    const d = mkRepo({ ledger: null });
    const r = run(d, ['next']);
    check('exit table: nothing to run → next 10 idle', r.code === 10 && /^stop: 10 idle/.test(r.out), r.out);
    const s = run(d, ['status']);
    check('status prints `no rounds yet` on a fresh state dir', /no rounds yet/.test(s.out) && (statSync(SD(d)).mode & 0o777) === 0o700, s.out);
  }
  {
    const d = mkRepo();
    run(d, ['pause']);
    const r = run(d, ['next']);
    check('exit table: STOP (pause) → next 40 killed', r.code === 40 && /^stop: 40 killed human/.test(r.out), r.out);
    const r2 = run(d, ['round']);
    check('exit table: round under STOP → 40, no spawn', r2.code === 40, r2.out);
    run(d, ['resume']);
    check('resume clears STOP → next picks the mission', run(d, ['next']).out === 'unit: /agentic-workflow:mission demo continue');
  }
  {
    const d = mkRepo({ ledger: LEDGER({ est: 4, used: 6 }) });
    const r = run(d, ['next']);
    check('exit table: overrun ledger → next 30 overrun-stop', r.code === 30 && /overrun-stop/.test(r.out), r.out);
  }

  // ── child env + argv (AC-8 / AC-9) ───────────────────────────────────────
  {
    const d = mkRepo();
    const before = fakeCalls().length;
    run(d, ['round'], { FAKE_SCENARIO: 'done' });
    const c = fakeCalls().slice(before)[0] || {};
    check('child env: AGENTIC_WORKFLOW_UNATTENDED=1, compact window from config', c.unattended === '1' && c.window === '200000', JSON.stringify(c));
    check('child env: no AGENTIC_WORKFLOW_CHILD, no Anthropic key variables, no CLAUDECODE', !c.child && !c.apiKey && !c.authToken && !c.claudecode, JSON.stringify(c));
    const argv = c.argv || [];
    check('child argv: -p stream-json --verbose acceptEdits, prompts none, max-turns', argv[0] === '-p' && argv.includes('stream-json') && argv.includes('--verbose')
      && argv[argv.indexOf('--permission-mode') + 1] === 'acceptEdits' && argv[argv.indexOf('--permission-prompts') + 1] === 'none' && argv.includes('--max-turns'), argv.join(' '));
    check('child argv: the unit slash command is the prompt (last), the round rules via --append-system-prompt',
      argv[argv.length - 1] === '/agentic-workflow:mission demo continue' && /^Rebuild your context ONLY from/.test(argv[argv.indexOf('--append-system-prompt') + 1] || ''), argv.slice(-3).join(' | '));
    const { FORBIDDEN } = await import(pathToFileURL(path.join(PLUGIN, 'tools/run-claude.mjs')).href);
    check('child argv: nothing in FORBIDDEN, no --restricted, no --tools, no --max-budget-usd by default',
      !argv.some((x) => FORBIDDEN.includes(x) || x === '--restricted' || x === '--tools' || x === '--max-budget-usd'), argv.join(' '));
    const withUsd = R.childArgv('p', { ...R.readConfig(d), budgets: { round_usd: 2 } });
    check('child argv: --max-budget-usd <n> only when budgets.round_usd is set', withUsd[withUsd.indexOf('--max-budget-usd') + 1] === '2');
    let threw = false;
    try { R.childArgv('p', { permission_mode: 'bypassPermissions', budgets: {} }); } catch { threw = true; }
    check('child argv: a bypassPermissions mode is refused', threw);
    const out = run(d, ['status']).out;
    check('the events log never reaches stdout/status (raw file is 0600)', !SEEN.join('').includes('EVENTS-ONLY-MARKER') && !out.includes('EVENTS-ONLY-MARKER')
      && (statSync(path.join(SD(d), 'rounds/1.events.jsonl')).mode & 0o777) === 0o600);
  }

  // ── round prompt: sources rule (AC-6) ────────────────────────────────────
  {
    const d = mkRepo();
    const b = JSON.parse(run(d, ['begin', '--json', '--pid', String(process.pid)]).out);
    const p = b.append_system_prompt;
    const sources = p.split(' — never')[0];
    check('round prompt: the turn is the slash command alone (it opens the prompt); the rules ride --append-system-prompt', b.prompt === '/agentic-workflow:mission demo continue', b.prompt);
    check('round note opens with the sources rule naming docs/product/, .plans/, OBLIGATIONS.md and the handoff path',
      p.startsWith('Rebuild your context ONLY from') && sources.includes('docs/product/') && sources.includes('.plans/') && sources.includes('.plans/OBLIGATIONS.md')
      && sources.includes(path.join('.git', 'agentic-workflow', 'session-handoff.md')), sources);
    check('round prompt: the sources segment names no transcript/summary/memory, nowhere `.remember`',
      !/transcript|summary|memory|\.remember/i.test(sources) && !p.includes('.remember') && /never a transcript, a compaction summary or a memory folder/.test(p));
    check('round prompt carries Docs vs code, the gh rule and the unit', /Docs vs code: a mismatch is never resolved silently/.test(p)
      && p.includes('GH_TOKEN="$(git identity token)" gh') && p.includes('AskUserQuestion is unavailable'));
    check('begin leaves no lock temp file (the lock is linked into place whole)', !require0(SD(d)).some((f) => f.startsWith('lock.tmp.')) && /^\d+ \S+ 1 - -$/.test(read(path.join(SD(d), 'lock')).trim()));
  }

  // ── lock: busy, stale reclaim, holder lease ──────────────────────────────
  {
    const d = mkRepo();
    const a = run(d, ['begin', '--json', '--pid', String(process.pid)]);
    const b2 = run(d, ['begin', '--json', '--pid', String(process.pid)]);
    check('lock: a second begin while a live pid holds it → 40 busy', a.code === 0 && b2.code === 40 && /busy/.test(b2.out), `${a.code} ${b2.out}`);
    check('lock: next while held → 40 busy', run(d, ['next']).code === 40);
    const r = run(d, ['round']);
    check('lock: round while held → 40 busy (no spawn)', r.code === 40, r.out);
  }
  {
    const d = mkRepo();
    run(d, ['next']); // creates the state dir
    writeFileSync(path.join(SD(d), 'lock'), `999999 2026-01-01T00:00:00Z 7 - -\n`);
    const r = run(d, ['begin', '--json', '--pid', String(process.pid)]);
    check('lock: a dead-pid lock is reclaimed, the lost round logged crashed, the crash backoff applies', r.code === 10 && /due in 30s/.test(r.out) && / #7 .* crashed /.test(roundsLog(d)) && !existsSync(path.join(SD(d), 'lock')), `${r.code} ${r.out} | ${roundsLog(d)}`);
    age(d);
    const r2 = run(d, ['begin', '--json', '--pid', String(process.pid)]);
    check('lock: after the backoff the next begin takes the free lock', r2.code === 0 && JSON.parse(r2.out).round === 1, r2.out);
  }
  {
    const d = mkRepo();
    const a = run(d, ['begin', '--json', '--holder', 'sup-1', '--lease', '1']);
    const b2 = run(d, ['begin', '--json', '--holder', 'sup-2', '--lease', '30']);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1300);
    run(d, ['next']); // lease passed: reclaimable, not busy
    const c0 = run(d, ['begin', '--json', '--holder', 'sup-2', '--lease', '30']); // reclaims (lost round → crash backoff)
    age(d);
    const c = run(d, ['begin', '--json', '--holder', 'sup-2', '--lease', '30']);
    check('lock: a --holder lock blocks a second begin until its lease passes', a.code === 0 && b2.code === 40 && c0.code === 10 && c.code === 0, `${a.code} ${b2.code} ${c0.code} ${c.code} ${c.out}`);
    check('lock: --holder without --lease is a usage error', run(d, ['begin', '--holder', 'x']).code === 1);
  }

  // ── daily cap (AC-5 i) ───────────────────────────────────────────────────
  {
    const d = mkRepo();
    const r1 = run(d, ['round'], { FAKE_SCENARIO: 'big', FAKE_NEXT: 'S2 one' });
    age(d);
    const r2 = run(d, ['round'], { FAKE_SCENARIO: 'big', FAKE_NEXT: 'S3 two' });
    age(d);
    const n = run(d, ['next']);
    check('daily cap: two rounds of 2.6M → next 30 daily-cap', r1.code === 0 && r2.code === 0 && n.code === 30 && /daily-cap 5200000\/5000000/.test(n.out), `${r1.code} ${r2.code} ${n.out}`);
    check('daily cap: crossing it alerts once', (read(path.join(SD(d), 'alerts.log')) || '').split('\n').filter((l) => l.includes('daily-cap')).length === 1);
    const cfg = R.readConfig(d);
    const tomorrow = Date.now() + 86400000;
    const p = await R.preflight(d, cfg, { now: tomorrow });
    check('daily cap: the UTC rollover resets it', p.code === 0 && p.today_tokens === 0, p.line);
    check('dailyTotal reads only the UTC date', R.dailyTotal({ daily: { '2026-01-01': 7, '2026-01-02': 3 } }, Date.parse('2026-01-02T23:59:00Z')) === 3);
  }
  {
    const d = mkRepo();
    run(d, ['round'], { FAKE_SCENARIO: 'nousage' });
    check('daily: a round with no usage line is charged the tick budget', / tokens=750000\/750000 /.test(lastLine(d)), lastLine(d));
  }

  // ── backoff ladder, crash loop, no progress (AC-5 iii–v) ─────────────────
  {
    const cfg = { idle: { backoff_min: [5, 15, 60] } };
    const bo = (c) => R.backoffFor(c, cfg);
    check('backoff: idle ladder 5 → 15 → 60 min, capped', bo([10]).delay_s === 300 && bo([10, 22]).delay_s === 900 && bo([10, 10, 20]).delay_s === 3600 && bo([10, 10, 10, 10]).delay_s === 3600);
    check('backoff: reset on 0', bo([10, 10, 0]).delay_s === 0 && bo([]).delay_s === 0);
    check('backoff: crash 30 s → 2 min, 3rd consecutive → crash-loop', bo([1]).delay_s === 30 && bo([0, 1, 1]).delay_s === 120 && bo([1, 1, 1]).stop === 'crash-loop' && bo([1, 0, 1, 1]).stop === null);
    check('backoff: 2 consecutive 22 → no-progress', bo([22, 22]).stop === 'no-progress' && bo([22]).stop === null);
    const d = mkRepo();
    run(d, ['round'], { FAKE_SCENARIO: 'noprog' });
    const n = run(d, ['next']);
    check('backoff: next is not due right after an idle round (10 with due_in)', n.code === 10 && /due in/.test(n.out), n.out);
  }
  {
    const d = mkRepo();
    const codes = [];
    for (let i = 0; i < 3; i++) { codes.push(run(d, ['round'], { FAKE_SCENARIO: 'crash' }).code); age(d); }
    const n = run(d, ['next']);
    check('crash loop: 3 × 1 → 30 crash-loop + STOP + alert', codes.join() === '1,1,30' && n.code === 30 && /crash-loop/.test(n.out)
      && /crash-loop/.test(read(path.join(SD(d), 'alerts.log')) || ''), `${codes} ${n.out}`);
  }
  {
    const d = mkRepo();
    const c1 = run(d, ['round'], { FAKE_SCENARIO: 'noprog' }).code; age(d);
    const c2 = run(d, ['round'], { FAKE_SCENARIO: 'noprog' }).code; age(d);
    const n = run(d, ['next']);
    check('no progress: 2 × 22 → 30 no-progress + STOP', c1 === 22 && c2 === 30 && n.code === 30 && /no-progress/.test(n.out), `${c1} ${c2} ${n.out}`);
  }

  // ── 22 no-record (AC-6 docs check) ───────────────────────────────────────
  {
    const d = mkRepo();
    const r = run(d, ['round'], { FAKE_SCENARIO: 'stale-mtime' });
    check('22 no-record: ledger fields change but neither ledger nor handoff was written this round', r.code === 22 && /no-progress/.test(lastLine(d)), `${r.code} ${lastLine(d)}`);
    const d2 = mkRepo({ ledger: null });
    const r2 = run(d2, ['round', '--unit', '/agentic-workflow:operate'], { FAKE_SCENARIO: 'handoff-only' });
    const c = R.classify(d2, { round: 1, eventsPath: path.join(SD(d2), 'rounds/1.events.jsonl') });
    check('22 no-record: a successful operate round that touched no doc', r2.code === 22 && /no-record/.test(c.reason), `${r2.code} ${c.reason}`);
    const d3 = mkRepo({ ledger: null });
    const r3 = run(d3, ['round', '--unit', '/agentic-workflow:operate'], { FAKE_SCENARIO: 'touch-handoff' });
    check('docs check: a round that wrote the handoff → 0', r3.code === 0, `${r3.code} ${r3.out}`);
  }

  // ── auth (AC-8 / AC-30) ──────────────────────────────────────────────────
  {
    const d = mkRepo();
    const r = run(d, ['next'], { FAKE_LOGIN: '0' });
    check('auth: no login → next 75 auth-expired', r.code === 75 && /auth-expired/.test(r.out), r.out);
    const t0 = Date.now();
    const wa = run(d, ['wait', '--max', '1']);
    check('auth: a preflight 75 sets the 15-min retry, so wait blocks instead of reporting due', wa.code === 0 && Date.now() - t0 >= 900 && /max reached/.test(wa.out), `${wa.out} ${Date.now() - t0}ms`);
    age(d);
    const e = run(d, ['next', '--auth', 'external'], { FAKE_LOGIN: '0' });
    check('auth: next --auth external passes with no login', e.code === 0 && /^unit: /.test(e.out), e.out);
    const rr = run(d, ['round', '--auth', 'external']);
    check('auth: round --auth external → usage error exit 1', rr.code === 1 && /external/.test(rr.err), rr.err);
    const d2 = mkRepo({ config: { project: 'demo', auth: 'external' } });
    const before = fakeCalls().length;
    const r2 = run(d2, ['round']);
    check('auth: round under runner.json auth: external → exit 1, nothing spawned', r2.code === 1 && fakeCalls().length === before, r2.err);
    const d3 = mkRepo();
    const r3 = run(d3, ['round'], { FAKE_SCENARIO: 'auth-neg' });
    check('auth negative: a success result saying "fixed the 401 authentication bug" → 0, not 75', r3.code === 0, `${r3.code} ${lastLine(d3)}`);
  }

  // ── split path (AC-29) ───────────────────────────────────────────────────
  {
    const d = mkRepo();
    const nx = shapeOk('schema: next --json validates', run(d, ['next', '--json']).out, 'next');
    const bOut = run(d, ['begin', '--json', '--pid', String(process.pid)]);
    const b = shapeOk('schema: begin --json validates (incl. state_digest)', bOut.out, 'begin');
    check('begin: digest never written to disk', b && !readFileSync(path.join(SD(d), 'rounds/1.begin.json'), 'utf8').includes(b.state_digest)
      && !(read(path.join(SD(d), 'lock')) || '').includes(b.state_digest));
    // The supervisor runs the turn itself.
    const env = { ...BASE_ENV, FAKE_LEDGER: ledgerOf(d), FAKE_SCENARIO: 'done', ...b.env };
    delete env.ANTHROPIC_API_KEY; delete env.ANTHROPIC_AUTH_TOKEN; delete env.AGENTIC_WORKFLOW_CHILD; delete env.CLAUDECODE;
    const t = spawnSync(FAKE, ['-p', '--output-format', 'stream-json', '--verbose', '--append-system-prompt', b.append_system_prompt, b.prompt], { cwd: d, env, encoding: 'utf8' });
    writeFileSync(b.events_path, t.stdout);
    const calls = fakeCalls().length;
    const cOut = run(d, ['classify', '--round', String(b.round), '--events', b.events_path, '--exit', String(t.status), '--json']);
    check('classify takes no lock and spawns nothing (fake claude: zero invocations)', fakeCalls().length === calls && (read(path.join(SD(d), 'lock')) || '').split(' ')[2] === String(b.round));
    const c = shapeOk('schema: classify --json validates', cOut.out, 'classify');
    writeFileSync(path.join(TMP, 'c1.json'), cOut.out);
    const rec = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'c1.json'), '--digest', b.state_digest, '--json']);
    const rj = shapeOk('schema: record --json validates', rec.out, 'record');
    shapeOk('schema: status --json validates', run(d, ['status', '--json']).out, 'status');
    check('split path: record exits the round code and releases the lock', rec.code === 0 && c && c.code === 0 && !existsSync(path.join(SD(d), 'lock')), `${rec.code} ${rec.out}`);
    // Same fixture through `round`.
    const d2 = mkRepo();
    run(d2, ['round'], { FAKE_SCENARIO: 'done' });
    check('round equals the split path: begin → turn → classify → record write the same round: line', rj && mask(lastLine(d)) === mask(lastLine(d2)) && lastLine(d).startsWith('round: demo #'), `${lastLine(d)} | ${lastLine(d2)}`);
    check('round: line shape — outcome, unit, tokens/tick, next, ledger, v=', /^round: demo #1 \d{4}-\d\d-\d\dT\d\d:\d\dZ done unit=mission:demo tokens=2000\/750000 next="S2 advanced" ledger=\.plans\/demo\.state\.md v=[\d.]+\/2\.1\.999$/.test(lastLine(d2)), lastLine(d2));
    const stopShape = run(mkRepo({ ledger: null }), ['begin', '--json', '--pid', String(process.pid)]);
    shapeOk('schema: a begin that cannot start prints the next shape', stopShape.out, 'next');
    check('schema: next carries the ACTIVE ledger and budget fields', nx && nx.ledger === '.plans/demo.state.md' && nx.budget.sessions_used === 1);
  }
  {
    const d = mkRepo();
    const b = JSON.parse(run(d, ['begin', '--json', '--pid', String(process.pid)]).out);
    writeFileSync(b.events_path, `${JSON.stringify({ type: 'result', subtype: 'error_during_execution', result: 'Invalid API key · Fix external API key' })}\n`);
    const c = JSON.parse(run(d, ['classify', '--round', String(b.round), '--events', b.events_path, '--json']).out);
    check('classify → 75 on a fake `invalid api key` result', c.code === 75 && c.outcome === 'auth-expired', JSON.stringify(c));
    const ok = R.classify(d, { round: b.round, eventsPath: writeEv(d, { type: 'result', subtype: 'success', result: 'Invalid API key handling fixed', usage: { input_tokens: 1 } }) });
    check('classify: the same text on a succeeded turn is never 75', ok.code !== 75, JSON.stringify(ok));
    const hs = R.classify(d, { round: b.round, eventsPath: writeEv(d, { type: 'result', subtype: 'success' }, { type: 'result', subtype: 'error_during_execution', terminal_reason: 'hook_stopped' }) });
    check('classify: the handoff stop keys on the LAST result terminal_reason, not subtype (non-success + hook_stopped → 21)', hs.code === 21, JSON.stringify(hs));
  }

  // ── credentials preflight (AC-31) ────────────────────────────────────────
  {
    const d = mkRepo({ signing: false });
    spawnSync('git', ['config', 'commit.gpgsign', 'true'], { cwd: d, env: BASE_ENV });
    const r = run(d, ['next']);
    check('creds: no signing key → stop: 75 creds-missing naming user.signingkey', r.code === 75 && r.out === 'stop: 75 creds-missing user.signingkey', r.out);
    const d2 = mkRepo();
    const r2 = run(d2, ['next'], { GH_TOKEN: '' });
    check('creds: no token → stop: 75 creds-missing naming GH_TOKEN', r2.code === 75 && r2.out === 'stop: 75 creds-missing GH_TOKEN', r2.out);
    const gi = path.join(TMP, 'gi-bin'); mkdirSync(gi);
    writeFileSync(path.join(gi, 'git-identity'), `#!/bin/sh\n[ "$1" = token ] && { echo ${GH_VALUE}; exit \${FAKE_GI_RC:-0}; }\nexit 0\n`); chmodSync(path.join(gi, 'git-identity'), 0o755);
    age(d2);
    const r3 = run(d2, ['next'], { GH_TOKEN: '', PATH: `${gi}:${BASE_ENV.PATH}` });
    check('creds: `git identity token` on PATH succeeding → unit (GH_TOKEN not needed)', r3.code === 0, r3.out);
    const r4 = run(d2, ['next'], { GH_TOKEN: '', PATH: `${gi}:${BASE_ENV.PATH}`, FAKE_GI_RC: '1' });
    check('creds: `git identity token` failing → names it', r4.code === 75 && /creds-missing git identity token/.test(r4.out), r4.out);
  }

  // ── integrity (AC-42): writes on no shape list ───────────────────────────
  {
    const d = mkRepo();
    run(d, ['round'], { FAKE_SCENARIO: 'done' }); age(d);
    const dailyBefore = read(path.join(SD(d), 'daily.json'));
    const r = run(d, ['round'], { FAKE_SCENARIO: 'tamper', FAKE_TAMPER_FILE: path.join(SD(d), 'daily.json'), FAKE_TAMPER_TEXT: '{}' });
    check('state-tampered: a child fs.writeFileSync on daily.json → 30, contents restored, day total unchanged',
      r.code === 30 && /state-tampered daily\.json/.test(r.out) && read(path.join(SD(d), 'daily.json')) === dailyBefore && /state-tampered/.test(read(path.join(SD(d), 'STOP'))), `${r.code} ${r.out}`);
    check('state-tampered: no round: line counted as progress', roundsLog(d).trim().split('\n').length === 1);
    const d2 = mkRepo();
    const cfgBefore = read(path.join(d2, '.claude/runner.json'));
    const r2 = run(d2, ['round'], { FAKE_SCENARIO: 'tamper', FAKE_TAMPER_FILE: path.join(d2, '.claude/runner.json'), FAKE_TAMPER_TEXT: '{"project":"demo","budgets":{"daily_tokens":999999999}}' });
    check('state-tampered: the same on .claude/runner.json → 30, file restored', r2.code === 30 && /runner\.json/.test(r2.out) && read(path.join(d2, '.claude/runner.json')) === cfgBefore, `${r2.code} ${r2.out}`);
    check('state-tampered: next stays stopped (30) until resume', run(d2, ['next']).code === 30);
    const d3 = mkRepo();
    const r3 = run(d3, ['round'], { FAKE_SCENARIO: 'tamper', FAKE_TAMPER_FILE: path.join(SD(d3), 'rounds/1.begin.json'), FAKE_TAMPER_TEXT: '{"round":1,"start_ms":0,"ledger":null,"gates":99}' });
    check('state-tampered: a child rewriting rounds/<n>.begin.json → 30, the snapshot restored', r3.code === 30 && /begin\.json/.test(r3.out) && JSON.parse(read(path.join(SD(d3), 'rounds/1.begin.json'))).gates === 0, `${r3.code} ${r3.out}`);
    const d4 = mkRepo();
    const r4 = run(d4, ['round'], { FAKE_SCENARIO: 'forge' });
    check('state-tampered: an in-round record with a self-computed digest and UNATTENDED unset → the round still ends 30',
      r4.code === 30 && /state-tampered/.test(r4.out) && read(path.join(SD(d4), 'forge-result.txt')) === '0', `${r4.code} ${r4.out} forge=${read(path.join(SD(d4), 'forge-result.txt'))}`);
  }
  {
    const d = mkRepo();
    const b = JSON.parse(run(d, ['begin', '--json', '--pid', String(process.pid)]).out);
    const daily0 = read(path.join(SD(d), 'daily.json'));
    writeFileSync(path.join(TMP, 'neg.json'), JSON.stringify({ contract_version: 1, round: b.round, code: 0, outcome: 'done', reason: 'x', tokens: -5000000, session_id: null }));
    const neg = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'neg.json'), '--digest', b.state_digest]);
    check('record: negative tokens refused (1), daily total untouched', neg.code === 1 && /non-negative/.test(neg.err) && read(path.join(SD(d), 'daily.json')) === daily0, neg.err);
    writeFileSync(path.join(TMP, 'mis.json'), JSON.stringify({ contract_version: 1, round: b.round, code: 0, outcome: 'crashed', reason: 'x', tokens: 5, session_id: null }));
    const mis = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'mis.json'), '--digest', b.state_digest]);
    check('record: a code that does not match its outcome is refused (1)', mis.code === 1 && /does not match/.test(mis.err), mis.err);
  }
  {
    const d = mkRepo();
    const b = JSON.parse(run(d, ['begin', '--json', '--pid', String(process.pid)]).out);
    writeFileSync(b.events_path, `${JSON.stringify({ type: 'result', subtype: 'success', usage: { input_tokens: 5 } })}\n`);
    writeFileSync(path.join(TMP, 'c2.json'), run(d, ['classify', '--round', String(b.round), '--events', b.events_path, '--json']).out);
    const snap = () => [read(path.join(SD(d), 'rounds.log')), read(path.join(SD(d), 'daily.json')), read(path.join(SD(d), 'backoff.json'))].join('|');
    const s0 = snap();
    const miss = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'c2.json')]);
    check('record without --digest → refused (1), nothing written', miss.code === 1 && snap() === s0 && existsSync(path.join(SD(d), 'lock')), miss.err);
    const wrong = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'c2.json'), '--digest', 'f'.repeat(64)]);
    check('record with a wrong --digest → refused (30 state-tampered), no progress written, the day forfeited', wrong.code === 30 && /state-tampered/.test(wrong.out)
      && (read(path.join(SD(d), 'rounds.log')) ?? '') === s0.split('|')[0] && (read(path.join(SD(d), 'backoff.json')) ?? '') === s0.split('|')[2]
      && R.dailyTotal({ daily: JSON.parse(read(path.join(SD(d), 'daily.json'))) }) >= 5000000, wrong.out);
  }
  {
    // B1: split path — the re-hash runs before the lock check.
    const d = mkRepo();
    run(d, ['round'], { FAKE_SCENARIO: 'done' }); age(d);
    const daily0 = read(path.join(SD(d), 'daily.json'));
    const b = JSON.parse(run(d, ['begin', '--json', '--holder', 'sup-1', '--lease', '300']).out);
    writeFileSync(path.join(SD(d), 'daily.json'), '{}');
    rmSync(path.join(SD(d), 'lock'));
    writeFileSync(b.events_path, `${JSON.stringify({ type: 'result', subtype: 'success', usage: { input_tokens: 5 } })}\n`);
    writeFileSync(path.join(TMP, 'b1.json'), run(d, ['classify', '--round', String(b.round), '--events', b.events_path, '--json']).out);
    const r = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'b1.json'), '--digest', b.state_digest]);
    check('split path: daily.json overwritten + lock removed → record 30 state-tampered (not a plain refusal), STOP + alert',
      r.code === 30 && /daily\.json/.test(r.out) && /lock/.test(r.out) && /state-tampered/.test(read(path.join(SD(d), 'STOP')) || '') && /state-tampered/.test(read(path.join(SD(d), 'alerts.log')) || ''), `${r.code} ${r.out} ${r.err}`);
    check('split path: the tampered cap is never counted as progress and the day is forfeited (total ≥ cap)', daily0 !== null && roundsLog(d).trim().split('\n').length === 1
      && R.dailyTotal({ daily: JSON.parse(read(path.join(SD(d), 'daily.json'))) }) >= 5000000);
  }
  {
    // A forged in-round record (UNATTENDED unset, self-computed digest) on the split path.
    const d = mkRepo();
    run(d, ['round'], { FAKE_SCENARIO: 'done' }); age(d);
    const b = JSON.parse(run(d, ['begin', '--json', '--pid', String(process.pid)]).out);
    writeFileSync(path.join(TMP, 'forged.json'), JSON.stringify({ contract_version: 1, round: b.round, code: 0, outcome: 'done', reason: 'forged', tokens: 0, session_id: null }));
    const self = R.snapshotProtected(d, SD(d), b.round).digest;
    const f = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'forged.json'), '--digest', self]);
    writeFileSync(b.events_path, `${JSON.stringify({ type: 'result', subtype: 'success', usage: { input_tokens: 5000 } })}\n`);
    writeFileSync(path.join(TMP, 'real.json'), run(d, ['classify', '--round', String(b.round), '--events', b.events_path, '--json']).out);
    const r = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'real.json'), '--digest', b.state_digest]);
    const al = read(path.join(SD(d), 'alerts.log')) || '';
    check('split path: a forged in-round record ends the round 30 (not "already recorded"), STOP, the day forfeited, the alert says the counters are not trustworthy',
      f.code === 0 && r.code === 30 && /state-tampered/.test(read(path.join(SD(d), 'STOP')) || '') && /not trustworthy/.test(al)
      && R.dailyTotal({ daily: JSON.parse(read(path.join(SD(d), 'daily.json'))) }) >= 5000000 && !existsSync(path.join(SD(d), 'lock')), `${f.code} ${r.code} ${r.out}`);
  }
  {
    // N1: a lease that expired and was reclaimed is still loud (the digest changed).
    const d = mkRepo();
    const b = JSON.parse(run(d, ['begin', '--json', '--holder', 'sup-1', '--lease', '1']).out);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1300);
    run(d, ['begin', '--json', '--holder', 'sup-2', '--lease', '30']); // reclaims round 1 → crashed
    writeFileSync(b.events_path, `${JSON.stringify({ type: 'result', subtype: 'success', usage: { input_tokens: 5 } })}\n`);
    writeFileSync(path.join(TMP, 'b3.json'), run(d, ['classify', '--round', String(b.round), '--events', b.events_path, '--json']).out);
    const r = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'b3.json'), '--digest', b.state_digest]);
    check('split path: a record after its lease was reclaimed → 30 + STOP + alert naming lock.lost.<n> (never silent)',
      r.code === 30 && /lock\.lost\.1/.test(r.out) && existsSync(path.join(SD(d), 'STOP')) && /lock\.lost\.1/.test(read(path.join(SD(d), 'alerts.log')) || ''), `${r.code} ${r.out} ${r.err}`);
  }
  {
    // N1: a forged lock.lost.<n> + a changed counter cannot buy a quiet exit.
    const d = mkRepo();
    run(d, ['round'], { FAKE_SCENARIO: 'big', FAKE_NEXT: 'S2 one' }); age(d);
    const b = JSON.parse(run(d, ['begin', '--json', '--holder', 'sup-1', '--lease', '300']).out);
    writeFileSync(path.join(SD(d), 'daily.json'), '{}');
    rmSync(path.join(SD(d), 'lock'));
    writeFileSync(path.join(SD(d), `lock.lost.${b.round}`), '');
    writeFileSync(b.events_path, `${JSON.stringify({ type: 'result', subtype: 'success', usage: { input_tokens: 5 } })}\n`);
    writeFileSync(path.join(TMP, 'n1.json'), run(d, ['classify', '--round', String(b.round), '--events', b.events_path, '--json']).out);
    const r = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'n1.json'), '--digest', b.state_digest]);
    check('split path: forged lock.lost.<n> + a zeroed daily.json → 30 + STOP + alert, the cap not wiped (day forfeited)',
      r.code === 30 && /daily\.json/.test(r.out) && existsSync(path.join(SD(d), 'STOP')) && /state-tampered/.test(read(path.join(SD(d), 'alerts.log')) || '')
      && R.dailyTotal({ daily: JSON.parse(read(path.join(SD(d), 'daily.json'))) }) >= 5000000, `${r.code} ${r.out} ${r.err}`);
  }
  {
    // N2: a planted journal is ignored; the split-path tamper forfeits the day.
    const d = mkRepo();
    run(d, ['round'], { FAKE_SCENARIO: 'big', FAKE_NEXT: 'S2 one' }); age(d);
    const b = JSON.parse(run(d, ['begin', '--json', '--holder', 'sup-1', '--lease', '300']).out);
    const today = new Date().toISOString().slice(0, 10);
    writeFileSync(path.join(SD(d), `rounds/${b.round}.record.json`), JSON.stringify({ line: 'x', tokens: 4900000, code: 0, date: today }));
    rmSync(path.join(SD(d), 'lock'));
    writeFileSync(b.events_path, `${JSON.stringify({ type: 'result', subtype: 'success', usage: { input_tokens: 5 } })}\n`);
    writeFileSync(path.join(TMP, 'n2.json'), run(d, ['classify', '--round', String(b.round), '--events', b.events_path, '--json']).out);
    const r = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'n2.json'), '--digest', b.state_digest]);
    const total = R.dailyTotal({ daily: JSON.parse(read(path.join(SD(d), 'daily.json'))) });
    check('split path: a planted rounds/<n>.record.json is ignored; the tamper leaves today ≥ the cap', r.code === 30 && total >= 5000000 && /not trustworthy/.test(read(path.join(SD(d), 'alerts.log')) || ''), `${r.code} ${r.out} total=${total}`);
  }
  {
    // N3: a supervisor retrying the identical record gets "already recorded".
    const d = mkRepo();
    const b = JSON.parse(run(d, ['begin', '--json', '--pid', String(process.pid)]).out);
    writeFileSync(b.events_path, `${JSON.stringify({ type: 'result', subtype: 'success', usage: { input_tokens: 5 } })}\n`);
    writeFileSync(path.join(TMP, 'n3.json'), run(d, ['classify', '--round', String(b.round), '--events', b.events_path, '--json']).out);
    const r1 = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'n3.json'), '--digest', b.state_digest, '--json']);
    const s1 = [roundsLog(d), read(path.join(SD(d), 'daily.json')), read(path.join(SD(d), 'backoff.json'))].join('|');
    const r2 = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'n3.json'), '--digest', b.state_digest, '--json']);
    const s2 = [roundsLog(d), read(path.join(SD(d), 'daily.json')), read(path.join(SD(d), 'backoff.json'))].join('|');
    const j2 = shapeOk('schema: a retried record --json still validates', r2.out, 'record');
    check('retried record: plain "already recorded", exit 0, nothing written, the genuine record kept, no STOP',
      r1.code === 22 && r2.code === 0 && j2 && /^already recorded: round: /.test(j2.line) && j2.code === 22 && s1 === s2 && !existsSync(path.join(SD(d), 'STOP')), `${r1.code} ${r2.code} ${r2.out}`);
    writeFileSync(path.join(TMP, 'n3b.json'), JSON.stringify({ ...JSON.parse(read(path.join(TMP, 'n3.json'))), tokens: 1 }));
    const r3 = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'n3b.json'), '--digest', b.state_digest]);
    check('retried record with a different classify result is not a retry → 30 state-tampered', r3.code === 30, `${r3.code} ${r3.out}`);
  }
  {
    // B2: classify's budget-stop is sticky.
    const d = mkRepo();
    const r = run(d, ['round'], { FAKE_SCENARIO: 'budget' });
    age(d);
    const n = run(d, ['next']);
    check('budget-stop from classify writes STOP: the next begin does not start (30 budget-stop until resume)', r.code === 30 && /budget-stop/.test(read(path.join(SD(d), 'STOP')) || '') && n.code === 30 && /budget-stop/.test(n.out), `${r.code} ${n.out}`);
    // B4: a string code is refused.
    const b = JSON.parse(run(mkRepo(), ['begin', '--json', '--pid', String(process.pid)]).out);
    const d4 = path.dirname(path.dirname(path.dirname(path.dirname(path.dirname(b.events_path)))));
    writeFileSync(path.join(TMP, 'str.json'), JSON.stringify({ contract_version: 1, round: b.round, code: '1', outcome: 'crashed', reason: 'x', tokens: 5, session_id: null }));
    const s = run(d4, ['record', '--round', String(b.round), '--from', path.join(TMP, 'str.json'), '--digest', b.state_digest]);
    check('record: a string code ("1") is refused (1), nothing lands in backoff.json', s.code === 1 && /integer/.test(s.err) && !existsSync(path.join(SD(d4), 'backoff.json')), `${s.code} ${s.err}`);
  }
  {
    // B3: the brakes work with an unreadable runner.json.
    const d = mkRepo();
    writeFileSync(path.join(d, '.claude/runner.json'), '{broken');
    const p = run(d, ['pause']);
    const s = run(d, ['stop', '--reason', 'x']);
    const n = run(d, ['next']);
    const rs = run(d, ['resume']);
    check('pause / stop / resume work when .claude/runner.json is `{broken` (next fails closed: 1)', p.code === 0 && s.code === 0 && rs.code === 0 && n.code === 1 && !existsSync(path.join(SD(d), 'STOP')), `${p.code} ${s.code} ${n.code} ${rs.code} ${p.err}`);
  }
  {
    const d = mkRepo();
    const u = run(d, ['begin', '--json'], { AGENTIC_WORKFLOW_UNATTENDED: '1' });
    check('begin with AGENTIC_WORKFLOW_UNATTENDED=1 → exit 1', u.code === 1 && /unattended/.test(u.err), u.err);
    const b = JSON.parse(run(d, ['begin', '--json', '--pid', String(process.pid)]).out);
    writeFileSync(path.join(TMP, 'c3.json'), JSON.stringify({ contract_version: 1, round: b.round, code: 0, outcome: 'done', reason: 'forged', tokens: 0, session_id: null }));
    const v = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'c3.json'), '--digest', b.state_digest], { AGENTIC_WORKFLOW_UNATTENDED: '1' });
    check('record with AGENTIC_WORKFLOW_UNATTENDED=1 → exit 1 (a round cannot record a forged file)', v.code === 1 && !roundsLog(d).includes('#1'), v.err);
  }
  {
    // Amendment 1: an owner-side write during a held lock is refused, not a digest trip.
    const d = mkRepo();
    const b = JSON.parse(run(d, ['begin', '--json', '--pid', String(process.pid)]).out);
    const boBefore = read(path.join(SD(d), 'backoff.json'));
    const res = run(d, ['resume']);
    const ow = R.ownerWrite(d, path.join(d, '.claude/runner.json'), '{"project":"demo","approver":{"route":"client"}}');
    check('owner-side write while a round holds the lock is refused (resume → 40, ownerWrite refused, files unchanged)',
      res.code === 40 && /busy/.test(res.out) && !ow.ok && read(path.join(SD(d), 'backoff.json')) === boBefore && !/client/.test(read(path.join(d, '.claude/runner.json'))), `${res.out} ${ow.reason}`);
    check('roundHeld reports the holding round', R.roundHeld(d)?.round === b.round);
    writeFileSync(b.events_path, `${JSON.stringify({ type: 'result', subtype: 'success', usage: { input_tokens: 5 } })}\n`);
    writeFileSync(path.join(TMP, 'c4.json'), run(d, ['classify', '--round', String(b.round), '--events', b.events_path, '--json']).out);
    const rec = run(d, ['record', '--round', String(b.round), '--from', path.join(TMP, 'c4.json'), '--digest', b.state_digest]);
    check('…and the round then records without tripping the digest (not 30)', rec.code !== 30 && /^round: /.test(rec.out), rec.out);
    check('owner-side write after the round lands', R.ownerWrite(d, path.join(d, '.claude/runner.json'), '{"project":"demo"}\n').ok);
  }

  // ── ask.mjs is never a gate answer ───────────────────────────────────────
  {
    const d = mkRepo();
    writeFileSync(path.join(d, '.plans/questions.jsonl'), [
      { schemaVersion: 1, event: 'asked', id: 'Q-demo-1', headline: 'merge?', options: [{ id: 'opt-yes' }], mission: 'demo' },
      { schemaVersion: 1, event: 'answered', id: 'Q-demo-1', option: 'opt-yes', via: 'chat' },
    ].map((x) => JSON.stringify(x)).join('\n'));
    const p = JSON.parse(run(d, ['next', '--json']).out);
    check('an ask.mjs answer / questions.jsonl event is never read as a gate answer', p.unit === '/agentic-workflow:mission demo continue' && p.pending_gates === 0, JSON.stringify(p));
  }

  // ── unit pick order (pure) ───────────────────────────────────────────────
  {
    const base = { lock: null, stop: null, login: true, creds: [], daily: { total: 0, cap: 5 }, budget: null, backoff: { stop: null, due_in_s: 0 }, pending_gates: 0, gate_answer: null, ledger: null, venture: null, operate: { count: 0, per_day: 4, last_empty: false } };
    const P = (o) => R.pickUnit({ ...base, ...o });
    check('pick: gate pending pauses every unit (20)', P({ pending_gates: 1, ledger: { name: 'm' } }).code === 20);
    check('pick: mission before autopilot', P({ ledger: { name: 'm' }, venture: 'below-v6' }).unit === '/agentic-workflow:mission m continue');
    check('pick: venture below V6 → autopilot', P({ venture: 'below-v6' }).unit === '/agentic-workflow:autopilot continue');
    check('pick: V6 → operate, ≤ operate_per_day/day, none after an empty one', P({ venture: 'v6' }).unit === '/agentic-workflow:operate'
      && P({ venture: 'v6', operate: { count: 4, per_day: 4, last_empty: false } }).code === 10 && P({ venture: 'v6', operate: { count: 1, per_day: 4, last_empty: true } }).code === 10);
    check('pick: stop order lock → STOP → login → creds → daily', P({ lock: { round: 1 }, stop: { reason: 'x', at: '' } }).code === 40
      && P({ login: false, creds: ['GH_TOKEN'] }).code === 75 && /auth-expired/.test(P({ login: false, creds: ['GH_TOKEN'] }).reason) && P({ daily: { total: 5, cap: 5 } }).code === 30);
  }

  // ── parity with mission-budget.sh (AC-5 ii) ──────────────────────────────
  {
    const runHook = (ledger) => { // copy of hook-test.mjs runHook's ledger + git path
      const dir = mkdtempSync(path.join(TMP, 'hook-'));
      spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir, env: BASE_ENV });
      mkdirSync(path.join(dir, '.plans'));
      writeFileSync(path.join(dir, '.plans/demo.state.md'), ledger);
      const env = { ...BASE_ENV, CLAUDE_PLUGIN_ROOT: PLUGIN }; delete env.AGENTIC_WORKFLOW_CHILD;
      const r = spawnSync('bash', [path.join(PLUGIN, 'hooks/lib/mission-budget.sh')], { cwd: dir, env, input: '{}', encoding: 'utf8' });
      return { out: r.stdout, dir };
    };
    const FIX = [
      ['silent', { used: 1, est: 4, tb: 750000, tt: 100000, mb: 100000 }],
      ['OVERRUN', { used: 6, est: 4, tb: 750000, tt: 100000, mb: 100000 }],
      ['OVERRUN N=1 k=2', { used: 2, est: 1 }],
      ['TICK', { used: 1, est: 4, tb: 750000, tt: 750000, mb: 750000 }],
      ['MISSION', { used: 2, est: 4, tb: 750000, tt: 0, mb: 1500000 }],
      ['MISSION odd N', { used: 2, est: 5, tb: 750000, tt: 0, mb: 2249999 }],
      ['all three', { used: 9, est: 5, tb: 750000, tt: 800000, mb: 2250000 }],
      ['no Tick budget', { used: 1, est: 4, tt: 999999999, mb: 999999999 }],
      ['Tick budget 0', { used: 1, est: 4, tb: 0, tt: 5, mb: 5 }],
      ['Tick budget 00', { used: 1, est: 4, tb: '00', tt: 5, mb: 5 }],
    ];
    const bad = [];
    for (const [name, f] of FIX) {
      const text = LEDGER(f);
      const h = runHook(text);
      const hook = { overrun: /OVERRUN —/.test(h.out), tick: /TICK BUDGET —/.test(h.out), mission: /MISSION BUDGET —/.test(h.out) };
      const v = R.budgetVerdict(R.ledgerBudget(text));
      if (!/Mission demo/.test(h.out)) bad.push(`${name}: hook silent (fixture not active?)`);
      if (hook.overrun !== v.overrun || hook.tick !== v.tick || hook.mission !== v.mission) bad.push(`${name}: hook ${JSON.stringify(hook)} runner ${JSON.stringify(v)}`);
      if (R.activeLedger(h.dir) !== '.plans/demo.state.md') bad.push(`${name}: activeLedger disagrees`);
    }
    check(`parity: ${FIX.length} shared ledger fixtures {k,N,TB,TT,MB} × {silent, OVERRUN, TICK, MISSION} → mission-budget.sh and budgetVerdict agree`, bad.length === 0, bad.join('; '));
    const closed = runHook(`${LEDGER()}\nClosed: 2026-01-01\n`);
    check('parity: a Closed: ledger is inactive for both', closed.out.trim() === '' && R.activeLedger(closed.dir) === null, closed.out);
    const zero = runHook(LEDGER({ used: 0 }));
    check('parity: Sessions used: 0 is never-started for both', zero.out.trim() === '' && R.activeLedger(zero.dir) === null, zero.out);
  }

  // ── redact parity + five-canary negative (AC-7) ──────────────────────────
  {
    const corpus = [
      'key sk-abcdefgh1234 and xsk-notatoken12345', 'ghp_ABCDEFGH12345 gho_zzzzzzzz9 ghx_nope12345678', 'pat github_pat_11ABCDEFG_xyz',
      'aws AKIAABCDEFGHIJKLMNOP end', 'slack xoxb-1234-5678-abcd xoxp-short', 'Authorization: Bearer abc.def-ghi rest', 'bearer lower case',
      '-----BEGIN OPENSSH PRIVATE KEY----- AAAA', 'plain line, no secret', 'sk-aaaaaaaa sk-bbbbbbbb back to back', '\ttab sk-12345678\t', '',
      CANARIES.slice(0, 4).join(' | '),
    ].join('\n');
    const bash = spawnSync('bash', ['-c', `source "${path.join(PLUGIN, 'hooks/lib/handoff-lib.sh')}"; hl_redact`], { input: corpus, encoding: 'utf8', env: BASE_ENV });
    const js = redact(corpus, {});
    check('redact parity: redact.mjs shapes == hl_redact over the corpus', bash.status === 0 && bash.stdout.replace(/\n$/, '') === js && js !== corpus, `bash=${JSON.stringify(bash.stdout)} js=${JSON.stringify(js)}`);
    check('redact: exact-value scrub of secret-named env values ≥ 8 chars, longest first', redact('a SUPERSECRETVALUE b short1', { MY_SECRET: 'SUPERSECRETVALUE', MY_TOKEN: 'short1', API_KEY: 'SUPERSECRET' }) === 'a [redacted] b short1');
    const d = mkRepo();
    const codes = [];
    for (let i = 0; i < 3; i++) { codes.push(run(d, ['round'], { FAKE_SCENARIO: 'canary-crash' }).code); age(d); }
    const status = run(d, ['status']).out + run(d, ['status', '--json']).out;
    const surfaces = { 'summary line': SEEN.slice(-10).join(''), 'rounds.log': roundsLog(d), 'alert body': read(path.join(SD(d), 'alerts.log')) || '', status };
    const leaks = [];
    for (const [where, text] of Object.entries(surfaces)) for (const c of [...CANARIES, GH_VALUE]) if (text.includes(c)) leaks.push(`${c} in ${where}`);
    check('five canaries: none survives in the summary line, rounds.log, the alert body or status', codes.join() === '1,1,30' && surfaces['alert body'].includes('crash-loop') && /\[redacted\]/.test(roundsLog(d)) && leaks.length === 0, `${codes} ${leaks.join('; ')}`);
    check('five canaries: the raw events log keeps the bytes (0600, never surfaced)', (read(path.join(SD(d), 'rounds/1.events.jsonl')) || '').includes('sk-TESTSECRET0001') && (statSync(path.join(SD(d), 'rounds/1.events.jsonl')).mode & 0o777) === 0o600);
  }

  // ── wait / stop ──────────────────────────────────────────────────────────
  {
    const d = mkRepo();
    check('wait: due now → 0 at once', run(d, ['wait', '--max', '5']).code === 0);
    run(d, ['stop', '--reason', 'owner-kill']);
    const w = run(d, ['wait', '--max', '5']);
    check('wait: STOP → 40 stopped', w.code === 40 && /owner-kill/.test(w.out), w.out);
    run(d, ['resume']);
    run(d, ['round'], { FAKE_SCENARIO: 'noprog' });
    const t0 = Date.now();
    const w2 = run(d, ['wait', '--max', '1']);
    const di = mkRepo({ ledger: null });
    run(di, ['next']);
    const t1 = Date.now();
    const wi = run(di, ['wait', '--max', '2']);
    check('wait: idle (nothing to run) blocks until --max instead of waking at once', wi.code === 0 && Date.now() - t1 >= 1800 && /max reached/.test(wi.out), `${wi.out} ${Date.now() - t1}ms`);
    const dg = mkRepo();
    writeFileSync(path.join(dg, '.plans/pending-gates.md'), '- [ ] G-1 decide — open\n');
    const t2 = Date.now();
    const wg = run(dg, ['wait', '--max', '1']);
    check('wait: an open gate keeps it waiting', wg.code === 0 && Date.now() - t2 >= 900 && /gate-pending/.test(wg.out), wg.out);
    check('wait: not due → blocks, then returns 0 at --max', w2.code === 0 && Date.now() - t0 >= 900, `${w2.code} ${Date.now() - t0}ms`);
  }

  // ── the GH_TOKEN value never appears anywhere ────────────────────────────
  check('credentials: the fake GH_TOKEN value never appears in any runner output', !SEEN.join('').includes(GH_VALUE));
} finally {
  rmSync(TMP, { recursive: true, force: true });
}

function require0(dir) { return readdirSync(dir); }
function writeEv(d, ...events) {
  const p = path.join(TMP, `ev-${Math.random().toString(36).slice(2)}.jsonl`);
  writeFileSync(p, events.map((e) => JSON.stringify(e)).join('\n'));
  return p;
}

console.log(failures ? `\n${failures} failure(s) of ${cases}` : `\nrunner harness: clean — ${cases} case(s)`);
process.exit(failures ? 1 : 0);
