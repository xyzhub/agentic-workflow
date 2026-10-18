#!/usr/bin/env node
// headless.mjs — drive the ORCHESTRATOR through `claude -p`, so it bills where
// `claude -p` bills (e.g. API / Agent SDK credit) once the subscription limit
// is reached. Pairs with `/agentic-workflow:tune preset isolated`, which moves
// every agent to `claude -p`; this moves the session that coordinates them.
//
//   node tools/headless.mjs chat [--session <id>] [--cwd <dir>]
//       Continue your last interactive session (same context, same history) as
//       a prompt loop: each line you type is one `claude -p --resume` turn.
//   node tools/headless.mjs run <mission> [--ticks N] [--cwd <dir>]
//       Unattended: one `/agentic-workflow:mission <mission> continue` tick per
//       fresh `claude -p`, until the ledger is Closed, a tick makes no progress
//       (waiting on the owner — answer via the §12 owner channel), or N ticks.
//   node tools/headless.mjs setup [--cwd <dir>] [--shell-alias]
//       Write .claude/headless.json and print the commands; --shell-alias also
//       adds a `ccp` function to ~/.zshrc (idempotent, marked block).
//   node tools/headless.mjs session [--cwd <dir>]
//       Print the session id `chat` would resume.
//
// Permission mode: .claude/headless.json `permission_mode` (default `auto` —
// the classifier, closest to an interactive auto-mode session), or
// --permission-mode. Never bypassPermissions. Zero deps, Node >= 18.

import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const MODES = new Set(['auto', 'acceptEdits', 'default', 'plan', 'dontAsk']);
const ALIAS_MARK = '# >>> agentic-workflow headless (ccp) >>>';

export function parseArgs(argv) {
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--shell-alias') o.shellAlias = true;
    else if (a.startsWith('--')) o[a.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = argv[++i];
    else o._.push(a);
  }
  return o;
}

// Claude Code keeps a project's sessions in ~/.claude/projects/<cwd with
// every non-alphanumeric char as `-`>/<session-id>.jsonl.
export const projectDir = (cwd, home = homedir()) =>
  path.join(process.env.CLAUDE_CONFIG_DIR || path.join(home, '.claude'), 'projects', path.resolve(cwd).replace(/[^A-Za-z0-9]/g, '-'));

// The newest session whose FIRST recorded entrypoint is `cli` — an interactive
// orchestrator session. Headless children (`sdk-*`) are skipped, so a mission's
// agent runs never get resumed by mistake. Resumed-headless turns keep the
// file's first entrypoint, so a session already continued via `chat` still matches.
export function latestInteractiveSession(cwd, home) {
  const dir = projectDir(cwd, home);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter((f) => f.endsWith('.jsonl'))
    .map((f) => ({ f, t: statSync(path.join(dir, f)).mtimeMs })).sort((a, b) => b.t - a.t);
  for (const { f } of files) {
    const m = readFileSync(path.join(dir, f), 'utf8').match(/"entrypoint":"([^"]+)"/);
    if (m && m[1] === 'cli') return f.replace(/\.jsonl$/, '');
  }
  return null;
}

export function readConfig(cwd) {
  try { return JSON.parse(readFileSync(path.join(cwd, '.claude', 'headless.json'), 'utf8')); } catch { return {}; }
}

export function permissionMode(o, cfg) {
  const m = o.permissionMode || cfg.permission_mode || 'auto';
  if (!MODES.has(m)) throw new Error(`permission mode "${m}" not one of ${[...MODES].join(', ')} (bypassPermissions is never used)`);
  return m;
}

export function claudeArgs({ prompt, session = null, mode, note = null }) {
  const a = ['-p'];
  if (session) a.push('--resume', session);
  if (note) a.push('--append-system-prompt', note);
  a.push('--permission-mode', mode, prompt);
  return a;
}

const bin = () => process.env.CLAUDE_BIN || 'claude';

function turn(args, cwd) {
  const r = spawnSync(bin(), args, { cwd, stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.error) throw new Error(`could not start ${bin()}: ${r.error.message}`);
  return r.status ?? 1;
}

// Ledger probe for `run`: Closed stamp and the single `Next up:` line.
export function ledgerState(cwd, mission) {
  const f = path.join(cwd, '.plans', `${mission}.state.md`);
  if (!existsSync(f)) return null;
  const t = readFileSync(f, 'utf8');
  return { closed: /^Closed: \d{4}-\d{2}-\d{2}/m.test(t), nextUp: (t.match(/^.*Next up:.*$/m) || [''])[0], sessions: (t.match(/Sessions used:\s*(\d+)/) || [])[1] };
}

async function chat(o, cwd, cfg) {
  const session = o.session || latestInteractiveSession(cwd);
  if (!session) throw new Error(`no interactive session found under ${projectDir(cwd)} — start one with \`claude\` first, or pass --session <id>`);
  const mode = permissionMode(o, cfg);
  console.error(`resuming ${session} headless (claude -p, permission mode ${mode}). Ctrl-D to quit.`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr, prompt: 'you> ' });
  rl.prompt();
  for await (const line of rl) {
    if (line.trim()) turn(claudeArgs({ prompt: line, session, mode }), cwd);
    rl.prompt();
  }
}

// Questions the headless orchestrator asked (tools/ask.mjs): open the answer
// page, wait until every one is answered, then let the loop continue.
async function answerPending(cwd, mission, cfg) {
  const ask = await import('./ask.mjs');
  const o = { root: cwd, mission, port: cfg.ask_port || 0, open: cfg.open_page !== false };
  const pend = ask.pendingOf(ask.readLog(path.join(cwd, '.plans', 'questions.jsonl')), mission);
  if (!pend.length) return false;
  const { url, server } = await ask.serve(o, { onAnswer: (l) => console.error(`  ${l}`) });
  console.error(`${pend.length} question(s) waiting — answer here: ${url}`);
  await ask.waitNone(o);
  server.close();
  return true;
}

async function run(o, cwd, cfg) {
  const mission = o._[1];
  if (!mission) throw new Error('usage: headless.mjs run <mission> [--ticks N]');
  const ticks = Number(o.ticks || cfg.ticks || 10);
  const mode = permissionMode(o, cfg);
  const { HEADLESS_ASK_NOTE } = await import('./ask.mjs');
  for (let i = 1; i <= ticks; i++) {
    const before = ledgerState(cwd, mission);
    if (!before) throw new Error(`no ledger .plans/${mission}.state.md`);
    if (before.closed) { console.error(`mission ${mission} is closed — done.`); return 0; }
    if (await answerPending(cwd, mission, cfg)) continue; // answers in → next tick reads them
    console.error(`tick ${i}/${ticks}: ${before.nextUp.trim()}`);
    const rc = turn(claudeArgs({ prompt: `/agentic-workflow:mission ${mission} continue`, mode, note: HEADLESS_ASK_NOTE }), cwd);
    const after = ledgerState(cwd, mission);
    if (rc !== 0) { console.error(`tick ${i} exited ${rc} — stopping.`); return rc; }
    if (after.closed) { console.error(`mission ${mission} closed.`); return 0; }
    if (await answerPending(cwd, mission, cfg)) continue;
    if (after.nextUp === before.nextUp && after.sessions === before.sessions) {
      console.error('no progress and no question asked — the mission is waiting on something else (check the ledger / owner channel). Stopping.');
      return 3;
    }
  }
  console.error(`reached ${ticks} ticks — re-run to continue.`);
  return 0;
}

export function aliasBlock(self = SELF) {
  return `${ALIAS_MARK}
# ccp — continue your last Claude Code session headless (bills where claude -p bills).
# ccp run <mission> — drive a mission unattended. ccp preset apply|reset|show — tune presets, no session needed.
# Written by headless.mjs setup.
ccp() {
  # newest installed copy (zsh: N = no error when none, n = numeric version sort)
  local c; c=( "$HOME"/.claude/plugins/cache/*/agentic-workflow/*/tools/headless.mjs(Nn) )
  local t=\${c[-1]:-${JSON.stringify(self)}}
  case "$1" in
    run) node "$t" "$@" ;;
    preset) shift; node "$(dirname "$t")/preset.mjs" "$@" ;;
    *) node "$t" chat "$@" ;;
  esac
}
# <<< agentic-workflow headless (ccp) <<<
`;
}

function setup(o, cwd, cfg) {
  const file = path.join(cwd, '.claude', 'headless.json');
  const next = { permission_mode: cfg.permission_mode || 'auto', ticks: cfg.ticks || 10, preset: 'isolated' };
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
  console.log(`wrote ${path.relative(cwd, file)} (permission_mode ${next.permission_mode}, ticks ${next.ticks})`);
  if (o.shellAlias) {
    const rc = path.join(homedir(), '.zshrc');
    const has = existsSync(rc) && readFileSync(rc, 'utf8').includes(ALIAS_MARK);
    if (!has) appendFileSync(rc, `\n${aliasBlock()}`);
    console.log(has ? '~/.zshrc already has ccp' : 'added ccp to ~/.zshrc — open a new terminal or `source ~/.zshrc`');
  }
  console.log(`\nWhen the subscription limit hits:\n  ccp                 # same session, headless, you keep typing\n  ccp run <mission>   # unattended mission ticks\n(without the alias: node ${SELF} chat | run <mission>)`);
  return 0;
}

export async function main(argv = process.argv.slice(2)) {
  const o = parseArgs(argv);
  const cwd = path.resolve(o.cwd || process.cwd());
  const cfg = readConfig(cwd);
  switch (o._[0]) {
    case 'chat': await chat(o, cwd, cfg); return 0;
    case 'run': return await run(o, cwd, cfg);
    case 'setup': return setup(o, cwd, cfg);
    case 'session': console.log(latestInteractiveSession(cwd) || ''); return 0;
    default:
      console.error('usage: headless.mjs chat [--session id] | run <mission> [--ticks N] | setup [--shell-alias] | session   [--cwd dir] [--permission-mode m]');
      return 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SELF) {
  main().then((c) => process.exit(c), (e) => { console.error(`headless: ${e.message}`); process.exit(1); });
}
