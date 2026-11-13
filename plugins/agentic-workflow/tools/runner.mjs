#!/usr/bin/env node
// runner.mjs — the unattended round runner: every unit of work runs in ONE
// fresh `claude -p` child; the parent session (or a supervisor that runs the
// turn itself) only reads exit codes and one `round:` line. Zero deps; Node >= 18.
//
//   node runner.mjs next [--json] [--auth login|external]
//       Preflight, no model: lock → STOP → login present (skipped under
//       `auth: external`) → per-project credentials (commit signing + a GitHub
//       token) → daily cap → ledger tick/mission/overrun budget (the
//       mission-budget.sh arithmetic) → crash / no-progress / idle backoff →
//       gate poll (tools/gate.mjs, when present) → unit pick. Prints ONE line:
//       `unit: <prompt>` or `stop: <code> <reason>`; exits that code (0 = unit).
//   node runner.mjs round [--unit "<prompt>"]
//       begin → spawn one `claude -p` child (its own process group) → classify →
//       record. Refuses `auth: external` (exit 1): the runner's own child always
//       uses the container's login.
//   The same round, split for a supervisor that runs the turn itself
//   (shapes: templates/runner-contract.schema.json, contract_version 1):
//   node runner.mjs begin [--json] [--unit "<prompt>"] [--holder <id> --lease <s>] [--pid <n>] [--auth …]
//       Takes the lock (a pid lock — the caller's pid, or --pid — is stale when
//       the pid is dead; a --holder lock needs --lease and is stale when the
//       lease has passed), allots the round number, snapshots the ledger's
//       `Next up:` / `Sessions used:` and the open-gate count into
//       rounds/<n>.begin.json, and prints {contract_version, round, unit,
//       prompt, env, events_path, state_digest}. `env` = the variables the
//       caller adds to the child env (it also deletes CLAUDECODE,
//       CLAUDE_CODE_ENTRYPOINT, AGENTIC_WORKFLOW_CHILD and both Anthropic key
//       variables). Keep `state_digest` in memory: it is never written to disk.
//   node runner.mjs classify --round <n> --events <file> [--exit <code>] [--stderr <file>] [--json]
//       Pure — no lock, no spawn: maps a finished turn to the exit contract.
//       Prints {contract_version, round, code, outcome, reason, tokens, session_id}.
//   node runner.mjs record --round <n> --from <classify.json> --digest <state_digest> [--json]
//       The one update under the lock: re-hashes the protected set FIRST (a
//       mismatch → no progress written, STOP, exit 30 state-tampered), then the
//       `round:` line, daily.json, backoff.json; releases the lock; exits the
//       round's code.
//   node runner.mjs wait [--max <s>]      block, zero model turns, until the next
//                                         round is due (0) or STOP appears (40)
//   node runner.mjs stop [--reason <r>]   write STOP (reason + UTC)
//   node runner.mjs pause                 write STOP with reason `human`
//   node runner.mjs resume                remove STOP + reset the backoff (a human
//                                         act at the shell; refuses while a round
//                                         holds the lock)
//   node runner.mjs status [--json]       lock holder, last 5 `round:` lines,
//                                         today's tokens vs cap, pending gates, stop
//
// Exit codes: 0 progressed (or: unit picked) · 10 idle / not due · 20 waiting
// on a gate · 21 handoff gate ended the child without a handoff · 22 no
// progress (incl. `no-record`: a round that wrote neither ledger nor handoff)
// · 30 budget / daily-cap / overrun / crash-loop / no-progress /
// state-tampered stop · 40 STOP file / busy lock · 75 login failed, expired or
// absent, or credentials missing · 1 crashed or usage error.
//
// State: $(git rev-parse --git-common-dir)/agentic-workflow/runner/ (0700,
// never tracked): lock, STOP, rounds.log, rounds/<n>.begin.json,
// rounds/<n>.events.jsonl + .stderr.log (0600, raw — never printed),
// daily.json { "<UTC date>": tokens }, backoff.json { codes, at }, alerts.log.
// Config: <project>/.claude/runner.json (templates/runner-config.json).
// Integrity (AC-42): PROTECTED is hashed at begin and re-hashed before record;
// owner-side writes to it (resume here; gate.mjs poll, /connect approver
// later) refuse while roundHeld(cwd). begin and record refuse when
// AGENTIC_WORKFLOW_UNATTENDED=1 is in their own environment.
// Everything printed or logged passes through tools/redact.mjs.

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFileSync, chmodSync, closeSync, existsSync, mkdirSync, openSync, readFileSync, readdirSync,
  realpathSync, renameSync, rmSync, statSync, writeFileSync, writeSync, accessSync, constants as FS,
} from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { redact } from './redact.mjs';
import { FORBIDDEN, parseStream } from './run-claude.mjs';
import { HEADLESS_ASK_NOTE } from './ask.mjs';

const SELF = fileURLToPath(import.meta.url);
export const PLUGIN_ROOT = path.resolve(path.dirname(SELF), '..');
export const CONFIG_TEMPLATE = path.join(PLUGIN_ROOT, 'templates/runner-config.json');
const GATE_TOOL = path.join(PLUGIN_ROOT, 'tools/gate.mjs');
export const CONTRACT_VERSION = 1;
export const OUTCOMES = ['done', 'budget-stop', 'overrun-stop', 'gate-pending', 'handoff-failed', 'auth-expired',
  'repo-conflict', 'channel-down', 'crashed', 'killed', 'idle', 'no-progress', 'daily-cap', 'creds-missing', 'state-tampered'];
export const AUTH_RE = /401|Login expired|not logged in|please run \/login|invalid api key|authentication/i;
const MODES = new Set(['auto', 'acceptEdits', 'default', 'plan', 'dontAsk']);
// The protected set (AC-42). S4 / S4b append { root: 'state', rel: 'answers.jsonl' } etc.
export const PROTECTED = [
  { root: 'project', rel: '.claude/runner.json' },
  { root: 'state', rel: 'daily.json' },
  { root: 'state', rel: 'backoff.json' },
  { root: 'state', rel: 'rounds.log' },
];

class UsageError extends Error {}
const bin = () => process.env.CLAUDE_BIN || 'claude';
const utcDate = (ms) => new Date(ms).toISOString().slice(0, 10);
const utcMin = (ms) => `${new Date(ms).toISOString().slice(0, 16)}Z`;
const utcSec = (ms) => `${new Date(ms).toISOString().slice(0, 19)}Z`;
const say = (line, env = process.env) => console.log(redact(line, env));

export function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') o.json = true;
    else if (a.startsWith('--')) {
      const k = a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) throw new UsageError(`${a} needs a value`);
      o[k] = argv[++i];
    } else o._.push(a);
  }
  return o;
}

// ── files ──────────────────────────────────────────────────────────────────
function readJson(p, fallback) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch (e) {
    if (e.code === 'ENOENT') return fallback;
    throw new UsageError(`unreadable ${path.basename(p)}: ${e.message}`);
  }
}
function write0600(p, text) { writeFileSync(p, text, { mode: 0o600 }); chmodSync(p, 0o600); }
function append0600(p, text) { appendFileSync(p, text, { mode: 0o600 }); chmodSync(p, 0o600); }
const git = (cwd, args) => spawnSync('git', args, { cwd, encoding: 'utf8' });

export function stateDir(cwd) {
  const r = git(cwd, ['rev-parse', '--git-common-dir']);
  let base;
  if (r.status === 0 && r.stdout.trim()) base = path.join(path.resolve(cwd, r.stdout.trim()), 'agentic-workflow', 'runner');
  else {
    const xdg = process.env.XDG_STATE_HOME || path.join(homedir(), '.local/state');
    base = path.join(xdg, 'agentic-workflow', path.basename(path.resolve(cwd)) || 'root', 'runner');
  }
  mkdirSync(path.join(base, 'rounds'), { recursive: true, mode: 0o700 });
  chmodSync(base, 0o700);
  chmodSync(path.join(base, 'rounds'), 0o700);
  return base;
}

export function handoffPath(cwd) {
  const r = git(cwd, ['rev-parse', '--git-path', 'agentic-workflow/session-handoff.md']);
  if (r.status === 0 && r.stdout.trim()) return path.resolve(cwd, r.stdout.trim());
  const xdg = process.env.XDG_STATE_HOME || path.join(homedir(), '.local/state');
  return path.join(xdg, 'agentic-workflow', path.basename(path.resolve(cwd)) || 'root', 'session-handoff.md');
}

export function readConfig(cwd) {
  const t = JSON.parse(readFileSync(CONFIG_TEMPLATE, 'utf8'));
  const own = readJson(path.join(cwd, '.claude/runner.json'), {});
  if (typeof own !== 'object' || own === null || Array.isArray(own)) throw new UsageError('.claude/runner.json must be a JSON object');
  const top = git(cwd, ['rev-parse', '--show-toplevel']);
  const cfg = {
    ...t, ...own,
    budgets: { ...t.budgets, ...(own.budgets || {}) },
    idle: { ...t.idle, ...(own.idle || {}) },
    approver: { ...t.approver, ...(own.approver || {}) },
  };
  delete cfg.$comment;
  if (!own.project) cfg.project = path.basename(top.status === 0 ? top.stdout.trim() : path.resolve(cwd));
  if (!['login', 'external'].includes(cfg.auth)) throw new UsageError(`runner.json auth must be login or external, got ${cfg.auth}`);
  if (cfg.permission_mode && !MODES.has(cfg.permission_mode)) throw new UsageError(`runner.json permission_mode ${cfg.permission_mode} is not allowed`);
  return cfg;
}

const pluginVersion = () => { try { return JSON.parse(readFileSync(path.join(PLUGIN_ROOT, '.claude-plugin/plugin.json'), 'utf8')).version; } catch { return '?'; } };

// ── ledger (ports of hooks/lib/active-ledger.sh and mission-budget.sh) ─────
const SP = '[ \\t\\r\\f\\v]*'; // grep's [[:space:]] inside one line
function closedUpstream(cwd, rel) {
  if (git(cwd, ['rev-parse', '--git-dir']).status !== 0) return false;
  const h = git(cwd, ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD']);
  const def = h.status === 0 ? h.stdout.trim().replace(/^origin\//, '') : '';
  let stg = '';
  try {
    const row = readFileSync(path.join(cwd, 'docs/WORKFLOW.md'), 'utf8').split('\n').find((l) => /^\| \*\*Staging\*\* \|/.test(l));
    const m = row && row.match(/^\| \*\*Staging\*\* \|[ \t]*`?([A-Za-z0-9._/-]+)/);
    stg = m ? m[1] : '';
  } catch { /* no profile */ }
  if (stg === 'none') stg = '';
  for (const b of [def || 'main', stg].filter(Boolean)) {
    if (git(cwd, ['check-ref-format', '--branch', b]).status !== 0) continue;
    for (const r of [`origin/${b}`, b]) {
      const s = git(cwd, ['show', `${r}:./${rel}`]);
      if (s.status === 0 && new RegExp(`^Closed:${SP}[0-9]{4}-[0-9]{2}-[0-9]{2}`, 'm').test(s.stdout)) return true;
    }
  }
  return false;
}

export function activeLedger(cwd) {
  const dir = path.join(cwd, '.plans');
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith('.state.md')).sort()
    .map((f) => ({ rel: `.plans/${f}`, m: statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  for (const { rel } of files) {
    const t = readFileSync(path.join(cwd, rel), 'utf8');
    const sl = t.split('\n').find((l) => l.startsWith('Status:'));
    const status = sl ? sl.replace(new RegExp(`^Status:${SP}\\**`), '').toLowerCase() : '';
    if (status.startsWith('planned')) continue;
    if (new RegExp(`^Sessions used:${SP}0+([^0-9]|$)`, 'm').test(t)) continue;
    if (new RegExp(`^Closed:${SP}[0-9]{4}-[0-9]{2}-[0-9]{2}`, 'm').test(t)) return null;
    if (closedUpstream(cwd, rel)) return null;
    if (!(status === '' || status === 'active' || /^active[^a-z]/.test(status))) return null;
    const next = t.split('\n').find((l) => l.startsWith('Next up:')) || '';
    if (/mission (is )?(closed|complete)/i.test(next)) return null;
    const open = t.split('\n').filter((l) => /^- \[( |~)\]/.test(l))
      .some((l) => !/^- \[~\].*(OBLIGATIONS\.md|→[ \t\r\f\v]*OB-[0-9])/.test(l));
    return open ? rel : null;
  }
  return null;
}

export function ledgerProbe(cwd, rel) {
  if (!rel) return null;
  let t;
  try { t = readFileSync(path.join(cwd, rel), 'utf8'); } catch { return null; }
  const next = t.split('\n').find((l) => l.startsWith('Next up:')) || '';
  const s = t.match(new RegExp(`^Sessions used:${SP}([0-9]+)`, 'm'));
  return { path: rel, name: path.basename(rel, '.state.md'), next_up: next, sessions: s ? s[1] : null };
}

// The five fields with mission-budget.sh's regexes (first matching line wins).
export function ledgerBudget(text) {
  const field = (key) => { const m = String(text).match(new RegExp(`^${key}:${SP}([0-9]+)`, 'm')); return m ? m[1] : ''; };
  const est = field('Estimate'); const used = field('Sessions used');
  const tb = field('Tick budget'); const tt = field('Tick tokens'); const mb = field('Mission budget');
  return {
    estimate: est === '' ? null : Number(est),
    sessions_used: used === '' ? 0 : Number(used),
    tick_budget: tb === '' || Number(tb) === 0 ? null : Number(tb),
    tick_tokens: tt === '' ? 0 : Number(tt),
    mission_budget: mb === '' ? null : Number(mb),
  };
}

export function budgetVerdict(f) {
  const overrun = f.estimate != null && 2 * f.sessions_used >= 3 * f.estimate;
  const tick = f.tick_budget != null && f.tick_tokens >= f.tick_budget;
  const mission = f.tick_budget != null && f.mission_budget != null && f.estimate != null
    && f.mission_budget >= f.tick_budget * Math.floor((f.estimate + 1) / 2);
  const stop = overrun ? 'overrun-stop' : (tick || mission) ? 'budget-stop' : null;
  return { overrun, tick, mission, stop };
}

// Open gates in .plans/pending-gates.md — a stand-in S4 replaces with gate.mjs.
export function openGates(cwd) {
  try {
    return readFileSync(path.join(cwd, '.plans/pending-gates.md'), 'utf8').split('\n')
      .filter((l) => /^- \[ \]/.test(l) || /^\|.*\|[ \t]*(open|pending)[ \t]*\|/i.test(l)).length;
  } catch { return 0; }
}

// ── counters ───────────────────────────────────────────────────────────────
export function dailyTotal(state, now = Date.now()) { return Number((state.daily || {})[utcDate(now)] || 0); }

// backoff.json `codes` = the recorded round codes, newest last.
export function backoffFor(history, cfg = { idle: { backoff_min: [5, 15, 60] } }) {
  const codes = Array.isArray(history) ? history : [];
  const last = codes[codes.length - 1];
  const run = (pred) => { let n = 0; for (let i = codes.length - 1; i >= 0 && pred(codes[i]); i--) n++; return n; };
  if (last === undefined || last === 0 || last === 21) return { delay_s: 0, stop: null };
  if (last === 1) {
    const n = run((c) => c === 1);
    return n >= 3 ? { delay_s: 0, stop: 'crash-loop' } : { delay_s: [30, 120, 480, 900][n - 1], stop: null };
  }
  if (last === 22 && run((c) => c === 22) >= 2) return { delay_s: 0, stop: 'no-progress' };
  if (last === 10 || last === 20 || last === 22) {
    const ladder = cfg.idle.backoff_min; const n = run((c) => c === 10 || c === 20 || c === 22);
    return { delay_s: ladder[Math.min(n, ladder.length) - 1] * 60, stop: null };
  }
  if (last === 75) return { delay_s: 900, stop: null };
  return { delay_s: 0, stop: null };
}

function roundsLog(sd) { try { return readFileSync(path.join(sd, 'rounds.log'), 'utf8').split('\n').filter((l) => l.startsWith('round: ')); } catch { return []; } }
function operateToday(sd, now) {
  const today = roundsLog(sd).filter((l) => l.split(' ')[3]?.startsWith(utcDate(now)) && / unit=operate /.test(l));
  const last = today[today.length - 1];
  return { count: today.length, last_empty: !!last && / (idle|no-progress) /.test(last) };
}

// ── lock ───────────────────────────────────────────────────────────────────
// `<pid> <start UTC> <round> <holder|-> <lease_until_ms|->`
export function readLock(sd) {
  let t;
  try { t = readFileSync(path.join(sd, 'lock'), 'utf8').trim(); } catch { return null; }
  const [pid, start, round, holder, lease] = t.split(/\s+/);
  return { pid: Number(pid), start: start || '', round: Number(round) || 0, holder: holder && holder !== '-' ? holder : null, lease_until: lease && lease !== '-' ? Number(lease) : null, raw: t };
}
const pidAlive = (pid) => { if (!(pid > 0)) return false; try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
export function lockStale(l, now = Date.now()) { return l.holder ? !(l.lease_until > now) : !pidAlive(l.pid); }
// The one lock check every owner-side writer of the protected set calls.
export function roundHeld(cwd, now = Date.now()) {
  const l = readLock(stateDir(cwd));
  return l && !lockStale(l, now) ? l : null;
}
// An owner-side write to a protected file: refused while a round holds the lock.
export function ownerWrite(cwd, file, content) {
  const l = roundHeld(cwd);
  if (l) return { ok: false, reason: `busy: round #${l.round} holds the lock — retry after it records` };
  writeFileSync(file, content);
  return { ok: true, reason: null };
}

function releaseLock(sd, round) {
  const l = readLock(sd);
  if (l && l.round === round) rmSync(path.join(sd, 'lock'), { force: true });
}

// ── integrity ──────────────────────────────────────────────────────────────
function protectedFiles(cwd, sd) {
  return PROTECTED.map((p) => ({ name: p.rel, file: path.join(p.root === 'project' ? cwd : sd, p.rel) }));
}
export function snapshotProtected(cwd, sd) {
  const h = createHash('sha256');
  const held = protectedFiles(cwd, sd).map(({ name, file }) => {
    let buf = null;
    try { buf = readFileSync(file); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    h.update(`${name}\0`);
    if (buf) { h.update(`F${buf.length}\0`); h.update(buf); } else h.update('ABSENT\0');
    return { name, file, buf };
  });
  return { digest: h.digest('hex'), held };
}
const hintsOf = (held) => held.map(({ name, file, buf }) => {
  let m = null; try { m = statSync(file).mtimeMs; } catch { /* absent */ }
  return { name, size: buf ? buf.length : -1, mtime_ms: m };
});

// ── stop / alerts ──────────────────────────────────────────────────────────
export function readStop(sd) {
  try {
    const t = readFileSync(path.join(sd, 'STOP'), 'utf8').trim();
    const i = t.lastIndexOf(' ');
    return { reason: i > 0 ? t.slice(0, i) : t, at: i > 0 ? t.slice(i + 1) : '' };
  } catch { return null; }
}
function writeStop(sd, reason, now = Date.now()) { write0600(path.join(sd, 'STOP'), `${String(reason).replace(/\s+/g, '-')} ${utcSec(now)}\n`); }
function alert(sd, body, now = Date.now()) { append0600(path.join(sd, 'alerts.log'), `${redact(`alert: ${utcSec(now)} ${body}`)}\n`); }
function alertedToday(sd, word, now) {
  try { return readFileSync(path.join(sd, 'alerts.log'), 'utf8').split('\n').some((l) => l.startsWith(`alert: ${utcDate(now)}`) && l.includes(word)); } catch { return false; }
}

// ── credentials / login ────────────────────────────────────────────────────
function onPath(name, env = process.env) {
  for (const d of String(env.PATH || '').split(path.delimiter).filter(Boolean)) {
    try { accessSync(path.join(d, name), FS.X_OK); return true; } catch { /* next */ }
  }
  return false;
}
export function credsMissing(cwd, env = process.env) {
  const missing = [];
  const get = (k) => { const r = spawnSync('git', ['config', '--get', k], { cwd, encoding: 'utf8', env }); return r.status === 0 ? r.stdout.trim() : ''; };
  if (get('commit.gpgsign') !== 'true') missing.push('commit.gpgsign');
  if (!get('user.signingkey')) missing.push('user.signingkey');
  if (onPath('git-identity', env)) {
    // The token goes nowhere: stdio ignored, only the exit status is read.
    const r = spawnSync('git', ['identity', 'token'], { cwd, env, stdio: 'ignore', timeout: 20000 });
    if (r.status !== 0) missing.push('git identity token');
  } else if (!env.GH_TOKEN) missing.push('GH_TOKEN');
  return missing;
}
function loginPresent(cwd, cfg) {
  const r = spawnSync(bin(), ['auth', 'status'], { cwd, env: childEnv(process.env, cfg), stdio: 'ignore', timeout: 30000 });
  return r.status === 0;
}

// ── the child ──────────────────────────────────────────────────────────────
export function childEnvAdditions(cfg) {
  return { AGENTIC_WORKFLOW_UNATTENDED: '1', CLAUDE_CODE_AUTO_COMPACT_WINDOW: String(cfg.compact_window) };
}
// A copy of the parent env, never a mutation of process.env.
export function childEnv(parent, cfg) {
  const env = { ...parent };
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_ENTRYPOINT;
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_AUTH_TOKEN;
  delete env.AGENTIC_WORKFLOW_CHILD;
  Object.assign(env, childEnvAdditions(cfg));
  if ('AGENTIC_WORKFLOW_CHILD' in env) throw new Error('child env carries AGENTIC_WORKFLOW_CHILD');
  return env;
}
export function childArgv(prompt, cfg) {
  const a = ['-p', '--output-format', 'stream-json', '--verbose', '--permission-mode', cfg.permission_mode || 'acceptEdits',
    '--permission-prompts', 'none', '--max-turns', String(cfg.max_turns || 150)];
  if (cfg.budgets && cfg.budgets.round_usd != null) a.push('--max-budget-usd', String(cfg.budgets.round_usd));
  a.push(prompt);
  const bad = a.slice(0, -1).filter((x) => FORBIDDEN.includes(x) || x === '--restricted' || x === '--tools');
  if (bad.length) throw new Error(`refusing child argv: ${bad.join(' ')}`);
  return a;
}

export const SOURCES_RULE = (handoff) => `Rebuild your context ONLY from \`docs/product/\`, the \`.plans/\` ledgers and \`.plans/OBLIGATIONS.md\`, and the handoff at \`${handoff}\` — never a transcript, a compaction summary or a memory folder. Before you end, write what the next round needs into those files. Docs vs code: a mismatch is never resolved silently — report it as a \`## Deviations\` line; intent (a locked decision, an AC, a rule) → the doc wins, fix the code or open a decision gate before the decision changes; a description of current behaviour (a path, a threshold, how a hook/tool works) → the code wins, update the doc.`;
export const GH_RULE = 'Run `gh` as `GH_TOKEN="$(git identity token)" gh …` when the `git identity` tool exists, else with the `GH_TOKEN` already in the environment.';

export function roundPrompt(unit, cfg, { handoff }) {
  return [SOURCES_RULE(handoff), GH_RULE, `This round's unit — run it now as the slash command:\n${unit}`, HEADLESS_ASK_NOTE].join('\n\n');
}

const unitTag = (unit) => {
  const m = String(unit || '').match(/^\/agentic-workflow:(\S+)(?:\s+(\S+))?/);
  if (!m) return unit ? 'custom' : 'none';
  return m[1] === 'mission' && m[2] ? `mission:${m[2]}` : m[1];
};
const nextText = (s) => String(s || '').replace(/^Next up:[ \t]*/, '').replace(/[\r\n]+/g, ' ').replace(/"/g, "'").trim().slice(0, 160) || 'unchanged';

export function roundLine(f) {
  return `round: ${f.project} #${f.round} ${utcMin(f.start_ms)} ${f.outcome} unit=${unitTag(f.unit)} tokens=${f.tokens}/${f.tick_budget} next="${nextText(f.next)}" ledger=${f.ledger || 'none'} v=${f.version}`;
}

// ── preflight + unit pick ──────────────────────────────────────────────────
// STOP reasons the runner writes itself (exit 30); any other reason is a kill/pause (40).
const COUNTER_STOPS = ['crash-loop', 'no-progress', 'state-tampered'];
// Pure: first match wins.
export function pickUnit(s) {
  const stop = (code, reason) => ({ code, unit: null, reason });
  if (s.lock) return stop(40, `busy round #${s.lock.round} holds the lock`);
  if (s.stop) {
    const counter = COUNTER_STOPS.some((c) => s.stop.reason === c || s.stop.reason.startsWith(`${c}-`));
    return counter ? stop(30, `${s.stop.reason} since ${s.stop.at}`) : stop(40, `killed ${s.stop.reason} since ${s.stop.at}`);
  }
  if (s.login === false) return stop(75, 'auth-expired claude is not logged in — run `claude /login` on this machine');
  if (s.creds && s.creds.length) return stop(75, `creds-missing ${s.creds.join(', ')}`);
  if (s.daily && s.daily.total >= s.daily.cap) return stop(30, `daily-cap ${s.daily.total}/${s.daily.cap} tokens today (UTC)`);
  if (s.budget && s.budget.stop) return stop(30, s.budget.stop);
  if (s.backoff && s.backoff.stop) return stop(30, s.backoff.stop);
  if (s.backoff && s.backoff.due_in_s > 0) return stop(10, `idle next round due in ${s.backoff.due_in_s}s`);
  if (s.pending_gates > 0) return stop(20, `gate-pending ${s.pending_gates} open gate(s)`);
  if (s.unit_override) return { code: 0, unit: s.unit_override, reason: null };
  if (s.gate_answer) return { code: 0, unit: s.gate_answer.unit, reason: null };
  if (s.ledger) return { code: 0, unit: `/agentic-workflow:mission ${s.ledger.name} continue`, reason: null };
  if (s.venture === 'below-v6') return { code: 0, unit: '/agentic-workflow:autopilot continue', reason: null };
  if (s.venture === 'v6' && s.operate && s.operate.count < s.operate.per_day && !s.operate.last_empty) {
    return { code: 0, unit: '/agentic-workflow:operate', reason: null };
  }
  return stop(10, 'idle nothing to run');
}

async function pollGates(cwd) {
  if (!existsSync(GATE_TOOL)) return null; // S4 adds gate.mjs; a no-op until then
  const m = await import(pathToFileURL(GATE_TOOL).href);
  return typeof m.poll === 'function' ? m.poll({ cwd }) : null;
}

export async function preflight(cwd, cfg, { auth = null, unit = null, now = Date.now() } = {}) {
  const sd = stateDir(cwd);
  const mode = auth || cfg.auth;
  if (!['login', 'external'].includes(mode)) throw new UsageError(`--auth must be login or external, got ${mode}`);
  const l = readLock(sd);
  const s = { lock: l && !lockStale(l, now) ? l : null, stop: readStop(sd) };
  const rel = activeLedger(cwd);
  const lt = rel ? readFileSync(path.join(cwd, rel), 'utf8') : '';
  const fields = rel ? ledgerBudget(lt) : null;
  const bo = readJson(path.join(sd, 'backoff.json'), { codes: [], at: null });
  const b = backoffFor(bo.codes, cfg);
  const due = bo.at ? Math.max(0, Math.ceil((Date.parse(bo.at) + b.delay_s * 1000 - now) / 1000)) : 0;
  Object.assign(s, {
    login: s.lock || s.stop || mode === 'external' ? null : loginPresent(cwd, cfg),
    creds: s.lock || s.stop ? [] : credsMissing(cwd),
    daily: { total: dailyTotal({ daily: readJson(path.join(sd, 'daily.json'), {}) }, now), cap: cfg.budgets.daily_tokens },
    budget: fields ? budgetVerdict(fields) : null,
    backoff: { stop: b.stop, due_in_s: due },
    pending_gates: openGates(cwd),
    gate_answer: null,
    unit_override: unit,
    ledger: rel ? ledgerProbe(cwd, rel) : null,
    venture: cfg.stage || null,
    operate: { ...operateToday(sd, now), per_day: cfg.idle.operate_per_day },
  });
  // Gate hook point: a no-op until S4 ships gate.mjs (and fills s.gate_answer).
  if (pickUnit(s).code === 0) await pollGates(cwd);
  const p = pickUnit(s);
  const line = p.code === 0 ? `unit: ${p.unit}` : `stop: ${p.code} ${p.reason}`;
  return {
    contract_version: CONTRACT_VERSION, line, code: p.code, unit: p.unit, reason: p.reason,
    ledger: rel, auth: mode, today_tokens: s.daily.total, daily_cap: s.daily.cap,
    budget: fields, stop: s.stop, lock: s.lock ? lockView(s.lock) : null,
    pending_gates: s.pending_gates, due_in_s: due,
  };
}
const lockView = (l) => ({ pid: l.pid, start: l.start, round: l.round, holder: l.holder, lease_until: l.lease_until });

// ── begin / classify / record ──────────────────────────────────────────────
function refuseUnattended(verb) {
  if (process.env.AGENTIC_WORKFLOW_UNATTENDED === '1') throw new UsageError(`${verb} refuses inside an unattended round (AGENTIC_WORKFLOW_UNATTENDED=1)`);
}
function nextRound(sd) {
  let n = 0;
  for (const f of readdirSync(path.join(sd, 'rounds'))) { const m = f.match(/^(\d+)\.begin\.json$/); if (m) n = Math.max(n, Number(m[1])); }
  return n + 1;
}
// A dead holder's round: logged `crashed`, charged the tick budget (no usage line).
function reclaimStale(cwd, sd, cfg, now) {
  const mutex = path.join(sd, 'lock.reclaim');
  try { if (now - statSync(mutex).mtimeMs > 60000) rmSync(mutex, { force: true }); } catch { /* none */ }
  let fd;
  try { fd = openSync(mutex, 'wx', 0o600); } catch { return false; }
  try {
    const l = readLock(sd);
    if (!l || !lockStale(l, now)) return !l;
    const b = readJson(path.join(sd, 'rounds', `${l.round}.begin.json`), null);
    const tokens = cfg.budgets.tick_tokens;
    commitCounters(cwd, sd, cfg, {
      line: roundLine({ project: cfg.project, round: l.round, start_ms: b ? b.start_ms : now, outcome: 'crashed', unit: b ? b.unit : '', tokens, tick_budget: tokens, next: 'redo the lost round from the last commit', ledger: b && b.ledger ? b.ledger.path : null, version: `${pluginVersion()}/${b ? b.cli_version : '?'}` }),
      tokens, code: 1, now,
    });
    renameSync(path.join(sd, 'lock'), path.join(sd, `lock.lost.${l.round}`));
    return true;
  } finally { closeSync(fd); rmSync(mutex, { force: true }); }
}

export async function begin(cwd, cfg, { holder = null, lease = null, pid = process.ppid, unit = null, auth = null, now = Date.now() } = {}) {
  refuseUnattended('begin');
  if ((holder == null) !== (lease == null)) throw new UsageError('--holder and --lease go together (a holder lock must expire)');
  const leaseS = lease == null ? null : Number(lease);
  if (lease != null && !(leaseS > 0)) throw new UsageError('--lease must be a positive number of seconds');
  if (holder != null && !/^[A-Za-z0-9._:-]{1,64}$/.test(holder)) throw new UsageError('--holder must be 1-64 chars of [A-Za-z0-9._:-]');
  const sd = stateDir(cwd);
  const l0 = readLock(sd);
  if (l0 && lockStale(l0, now)) reclaimStale(cwd, sd, cfg, now);
  const pf = await preflight(cwd, cfg, { auth, unit, now });
  if (pf.code !== 0) return { stop: pf };
  let fd;
  try { fd = openSync(path.join(sd, 'lock'), 'wx', 0o600); } catch (e) {
    if (e.code !== 'EEXIST') throw e;
    const l = readLock(sd);
    return { stop: { ...pf, code: 40, unit: null, reason: `busy round #${l ? l.round : '?'} holds the lock`, line: `stop: 40 busy round #${l ? l.round : '?'} holds the lock` } };
  }
  const n = nextRound(sd);
  writeSync(fd, `${holder ? process.pid : pid} ${utcSec(now)} ${n} ${holder || '-'} ${leaseS ? now + leaseS * 1000 : '-'}\n`);
  closeSync(fd);
  const u = unit || pf.unit;
  const ledger = ledgerProbe(cwd, activeLedger(cwd));
  const cv = spawnSync(bin(), ['--version'], { encoding: 'utf8', timeout: 15000, env: childEnv(process.env, cfg) });
  const cliVersion = cv.status === 0 ? (cv.stdout.trim().split(/\s+/)[0] || '?') : '?';
  const snap = snapshotProtected(cwd, sd);
  const rec = { round: n, unit: u, start_ms: now, ledger, gates: openGates(cwd), cli_version: cliVersion, handoff: handoffPath(cwd), hints: hintsOf(snap.held) };
  write0600(path.join(sd, 'rounds', `${n}.begin.json`), `${JSON.stringify(rec, null, 2)}\n`);
  const out = {
    contract_version: CONTRACT_VERSION, round: n, unit: u, prompt: roundPrompt(u, cfg, { handoff: rec.handoff }),
    env: childEnvAdditions(cfg), events_path: path.join(sd, 'rounds', `${n}.events.jsonl`), state_digest: snap.digest,
  };
  return { out, held: snap.held };
}

const mtimeAfter = (p, ms) => { try { return statSync(p).mtimeMs > ms; } catch { return false; } };
const usageSum = (u) => (u ? ['input_tokens', 'output_tokens', 'cache_creation_input_tokens', 'cache_read_input_tokens'].reduce((a, k) => a + (Number(u[k]) || 0), 0) : null);

export function classify(cwd, { round, eventsPath, exitCode = null, stderrPath = null }) {
  const sd = stateDir(cwd);
  const cfg = readConfig(cwd);
  const n = Number(round);
  const b = readJson(path.join(sd, 'rounds', `${n}.begin.json`), null);
  if (!b) throw new UsageError(`no rounds/${n}.begin.json — run begin first`);
  let text = '';
  try { text = readFileSync(eventsPath, 'utf8'); } catch { /* no events */ }
  const errP = stderrPath || String(eventsPath).replace(/\.events\.jsonl$/, '.stderr.log');
  let stderr = '';
  try { if (errP !== eventsPath) stderr = readFileSync(errP, 'utf8'); } catch { /* none */ }
  const s = parseStream(text);
  const r = s.result;
  const used = usageSum(r && r.usage);
  const tokens = used == null ? cfg.budgets.tick_tokens : used;
  const sessionId = (r && r.session_id) || (s.init && s.init.session_id) || null;
  const out = (code, outcome, reason) => ({ contract_version: CONTRACT_VERSION, round: n, code, outcome, reason, tokens, session_id: sessionId });
  const resultText = r && typeof r.result === 'string' ? r.result : '';
  // The one place classify reads subtype: 75 only when the turn did not succeed.
  if ((!r || r.subtype !== 'success') && AUTH_RE.test(`${stderr}\n${resultText}`)) return out(75, 'auth-expired', 'the child could not authenticate — run `claude /login`');
  if (!r) return out(1, 'crashed', `no result event (exit ${exitCode ?? '?'})`);
  if (r.subtype === 'error_max_budget_usd' || r.subtype === 'error_max_turns') return out(30, 'budget-stop', r.subtype);
  if (r.subtype !== 'success') return out(1, 'crashed', `result ${r.subtype || 'without a subtype'}`);
  if (r.terminal_reason === 'hook_stopped') return out(21, 'handoff-failed', 'a hook stopped the child (terminal_reason hook_stopped)');
  if (openGates(cwd) > (b.gates || 0)) return out(20, 'gate-pending', 'the round opened a gate');
  const after = b.ledger ? ledgerProbe(cwd, b.ledger.path) : null;
  if (b.ledger && after && after.next_up === b.ledger.next_up && after.sessions === b.ledger.sessions) {
    return out(22, 'no-progress', 'ledger Next up and Sessions used unchanged');
  }
  const touched = (b.ledger && mtimeAfter(path.join(cwd, b.ledger.path), b.start_ms)) || mtimeAfter(b.handoff || handoffPath(cwd), b.start_ms);
  if (!touched) return out(22, 'no-progress', 'no-record: neither the ledger nor the handoff was written');
  return out(0, 'done', 'progressed');
}

// The counters, written only after the digest check passed.
function commitCounters(cwd, sd, cfg, { line, tokens, code, now }) {
  append0600(path.join(sd, 'rounds.log'), `${redact(line)}\n`);
  const dp = path.join(sd, 'daily.json');
  const daily = readJson(dp, {});
  const today = utcDate(now);
  daily[today] = Number(daily[today] || 0) + Number(tokens || 0);
  for (const k of Object.keys(daily)) if (k < utcDate(now - 31 * 86400000)) delete daily[k];
  write0600(dp, `${JSON.stringify(daily)}\n`);
  const bp = path.join(sd, 'backoff.json');
  const bo = readJson(bp, { codes: [], at: null });
  const codes = [...(bo.codes || []), code].slice(-20);
  write0600(bp, `${JSON.stringify({ codes, at: new Date(now).toISOString() })}\n`);
  return { today: daily[today], backoff: backoffFor(codes, cfg) };
}

export function record(cwd, { round, classified, digest, held = null, inProcess = false, now = Date.now() }) {
  refuseUnattended('record');
  if (!digest) throw new UsageError('record needs --digest <state_digest> (the value begin printed)');
  const n = Number(round);
  if (!classified || Number(classified.round) !== n) throw new UsageError(`the classify result is not for round ${n}`);
  if (!Number.isInteger(classified.code) || !OUTCOMES.includes(classified.outcome) || !Number.isFinite(classified.tokens)) throw new UsageError('the classify result has no valid code/outcome');
  const sd = stateDir(cwd);
  const l = readLock(sd);
  if (!inProcess && (!l || l.round !== n)) throw new UsageError(`round ${n} does not hold the lock`);
  const cfg = readConfig(cwd);
  const b = readJson(path.join(sd, 'rounds', `${n}.begin.json`), null);
  if (!b) throw new UsageError(`no rounds/${n}.begin.json`);
  // Recompute BEFORE any write.
  const snap = snapshotProtected(cwd, sd);
  if (snap.digest !== digest) {
    let changed;
    if (held) {
      changed = held.filter((h, i) => !(h.buf ? snap.held[i].buf && h.buf.equals(snap.held[i].buf) : !snap.held[i].buf)).map((h) => h.name);
      for (const h of held) { if (h.buf) writeFileSync(h.file, h.buf); else rmSync(h.file, { force: true }); }
    } else {
      const now2 = hintsOf(snap.held);
      changed = (b.hints || []).filter((h, i) => now2[i] && (h.size !== now2[i].size || h.mtime_ms !== now2[i].mtime_ms)).map((h) => h.name);
    }
    const what = changed.length ? changed.join(',') : 'a-protected-file';
    writeStop(sd, `state-tampered ${what}`, now);
    alert(sd, `🛑 ${cfg.project} stopped: round #${n} changed ${what} (state-tampered). Nothing was recorded as progress; the runner stays stopped until \`runner.mjs resume\`.`, now);
    releaseLock(sd, n);
    return { contract_version: CONTRACT_VERSION, round: n, code: 30, outcome: 'state-tampered', line: `stop: 30 state-tampered ${what}`, today_tokens: dailyTotal({ daily: readJson(path.join(sd, 'daily.json'), {}) }, now), stop: `state-tampered ${what}` };
  }
  const after = b.ledger ? ledgerProbe(cwd, b.ledger.path) : null;
  const tick = cfg.budgets.tick_tokens;
  const line = redact(roundLine({
    project: cfg.project, round: n, start_ms: b.start_ms, outcome: classified.outcome, unit: b.unit,
    tokens: classified.tokens, tick_budget: tick, next: after ? after.next_up : classified.reason,
    ledger: b.ledger ? b.ledger.path : null, version: `${pluginVersion()}/${b.cli_version}`,
  }));
  const c = commitCounters(cwd, sd, cfg, { line, tokens: classified.tokens, code: classified.code, now });
  let stop = null;
  if (c.backoff.stop) {
    stop = c.backoff.stop;
    writeStop(sd, stop, now);
    alert(sd, `🛑 ${cfg.project} stopped: ${stop === 'crash-loop' ? '3 crashed rounds in a row' : '2 rounds in a row made no progress'} (${stop}). Last round: ${line}`, now);
  }
  if (c.today >= cfg.budgets.daily_tokens && !alertedToday(sd, 'daily-cap', now)) {
    alert(sd, `🛑 ${cfg.project} stopped for today: ${c.today} of ${cfg.budgets.daily_tokens} tokens used (daily-cap). Nothing is lost; rounds start again after 00:00 UTC.`, now);
  }
  releaseLock(sd, n);
  return { contract_version: CONTRACT_VERSION, round: n, code: stop ? 30 : classified.code, outcome: classified.outcome, line, today_tokens: c.today, stop };
}

// ── round = begin → spawn → classify → record ──────────────────────────────
export async function roundOnce(cwd, cfg, deps = {}) {
  if ((deps.auth || cfg.auth) === 'external') throw new UsageError('round refuses auth: external — the runner\'s own child uses the container login; drive begin/classify/record instead');
  const b = await begin(cwd, cfg, { unit: deps.unit || null, pid: process.pid, now: (deps.now || Date.now)() });
  if (b.stop) return { code: b.stop.code, line: b.stop.line };
  const { out, held } = b;
  const errPath = out.events_path.replace(/\.events\.jsonl$/, '.stderr.log');
  const ev = openSync(out.events_path, 'w', 0o600);
  const er = openSync(errPath, 'w', 0o600);
  chmodSync(out.events_path, 0o600); chmodSync(errPath, 0o600);
  let exitCode;
  let child;
  try {
    child = spawn(bin(), childArgv(out.prompt, cfg), { cwd, env: childEnv(process.env, cfg), detached: true, stdio: ['ignore', ev, er] });
    exitCode = await new Promise((res) => {
      child.on('error', () => res(127));
      child.on('close', (code, sig) => res(sig ? 128 : code ?? 1));
    });
  } finally { closeSync(ev); closeSync(er); }
  // End the child's whole process group before re-hashing the protected set.
  if (child && child.pid) { try { process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ } }
  const c = classify(cwd, { round: out.round, eventsPath: out.events_path, exitCode, stderrPath: errPath });
  const r = record(cwd, { round: out.round, classified: c, digest: out.state_digest, held, inProcess: true, now: (deps.now || Date.now)() });
  return { code: r.code, line: r.line, record: r };
}

export async function wait(cwd, cfg, { maxS = Infinity, tickS = 60, sleep = (s) => new Promise((r) => setTimeout(r, s * 1000)), now = Date.now } = {}) {
  const sd = stateDir(cwd);
  const t0 = now();
  for (;;) {
    const st = readStop(sd);
    if (st) return { code: 40, line: `stop: 40 killed ${st.reason} since ${st.at}` };
    await pollGates(cwd);
    const bo = readJson(path.join(sd, 'backoff.json'), { codes: [], at: null });
    const b = backoffFor(bo.codes, cfg);
    if (b.stop) return { code: 40, line: `stop: 40 ${b.stop}` };
    const due = bo.at ? Math.ceil((Date.parse(bo.at) + b.delay_s * 1000 - now()) / 1000) : 0;
    const left = maxS - (now() - t0) / 1000;
    if (due <= 0 || left <= 0) return { code: 0, line: 'wait: due' };
    await sleep(Math.max(1, Math.min(tickS, due, left)));
  }
}

export function status(cwd, cfg, { now = Date.now() } = {}) {
  const sd = stateDir(cwd);
  const l = readLock(sd);
  return {
    contract_version: CONTRACT_VERSION,
    lock: l ? { ...lockView(l), stale: lockStale(l, now) } : null,
    rounds: roundsLog(sd).slice(-5).map((x) => redact(x)),
    today_tokens: dailyTotal({ daily: readJson(path.join(sd, 'daily.json'), {}) }, now),
    daily_cap: cfg.budgets.daily_tokens,
    stop: readStop(sd),
    pending_gates: openGates(cwd),
  };
}

function statusText(s) {
  const out = [
    s.lock ? `lock: round #${s.lock.round} since ${s.lock.start}${s.lock.holder ? ` holder ${s.lock.holder}` : ` pid ${s.lock.pid}`}${s.lock.stale ? ' (stale)' : ''}` : 'lock: free',
    s.stop ? `stop: ${s.stop.reason} since ${s.stop.at}` : 'stop: none',
    `today: ${s.today_tokens}/${s.daily_cap} tokens (UTC)`,
    `pending gates: ${s.pending_gates}`,
  ];
  return [...out, ...(s.rounds.length ? s.rounds : ['no rounds yet'])];
}

// ── CLI ────────────────────────────────────────────────────────────────────
const emit = (o, obj, line) => say(o.json ? JSON.stringify(obj) : line);

export async function main(argv = process.argv.slice(2)) {
  const o = parseArgs(argv);
  const cwd = path.resolve(o.cwd || process.cwd());
  const cfg = readConfig(cwd);
  const sd = stateDir(cwd);
  switch (o._[0]) {
    case 'next': { const p = await preflight(cwd, cfg, { auth: o.auth || null }); emit(o, p, p.line); return p.code; }
    case 'begin': {
      const b = await begin(cwd, cfg, { holder: o.holder ?? null, lease: o.lease ?? null, pid: o.pid ? Number(o.pid) : process.ppid, unit: o.unit || null, auth: o.auth || null });
      if (b.stop) { emit(o, b.stop, b.stop.line); return b.stop.code; }
      emit(o, b.out, `begin: round #${b.out.round} unit=${b.out.unit} events=${b.out.events_path} digest=${b.out.state_digest}`);
      return 0;
    }
    case 'classify': {
      if (!o.round || !o.events) throw new UsageError('usage: classify --round <n> --events <file> [--exit <code>] [--stderr <file>] [--json]');
      const c = classify(cwd, { round: o.round, eventsPath: path.resolve(cwd, o.events), exitCode: o.exit != null ? Number(o.exit) : null, stderrPath: o.stderr ? path.resolve(cwd, o.stderr) : null });
      emit(o, c, `classify: round #${c.round} ${c.code} ${c.outcome} tokens=${c.tokens}`);
      return 0;
    }
    case 'record': {
      if (!o.round || !o.from) throw new UsageError('usage: record --round <n> --from <classify.json> --digest <state_digest> [--json]');
      const classified = readJson(path.resolve(cwd, o.from), null);
      const r = record(cwd, { round: o.round, classified, digest: o.digest || null });
      emit(o, r, r.line);
      return r.code;
    }
    case 'round': { const r = await roundOnce(cwd, cfg, { unit: o.unit || null, auth: o.auth || null }); say(r.line); return r.code; }
    case 'wait': { const w = await wait(cwd, cfg, { maxS: o.max ? Number(o.max) : Infinity }); say(w.line); return w.code; }
    case 'stop': case 'pause': {
      const reason = o._[0] === 'pause' ? 'human' : (o.reason || 'stopped');
      writeStop(sd, reason);
      say(`🛑 — STOP written (${reason}); no new round starts until \`runner.mjs resume\`.`);
      return 0;
    }
    case 'resume': {
      const l = roundHeld(cwd);
      if (l) { say(`stop: 40 busy round #${l.round} holds the lock — resume after it records`); return 40; }
      rmSync(path.join(sd, 'STOP'), { force: true });
      write0600(path.join(sd, 'backoff.json'), `${JSON.stringify({ codes: [], at: null })}\n`);
      say('✅ — STOP removed and the backoff reset; the next `runner.mjs next` may start a round.');
      return 0;
    }
    case 'status': { const s = status(cwd, cfg); if (o.json) say(JSON.stringify(s)); else for (const l of statusText(s)) say(l); return 0; }
    default:
      console.error('usage: runner.mjs next|round|begin|classify|record|wait|stop|pause|resume|status … (see the header)');
      return 1;
  }
}

const isEntryPoint = () => {
  if (!process.argv[1]) return false;
  try { return realpathSync(process.argv[1]) === realpathSync(SELF); } catch { return path.resolve(process.argv[1]) === SELF; }
};
if (isEntryPoint()) {
  main().then((c) => process.exit(c), (e) => { console.error(redact(`runner: ${e.message}`)); process.exit(1); });
}
