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
//       installs `ccp` (a POSIX sh executable in ~/.local/bin, any shell) and
//       puts ~/.local/bin on PATH in your shell's startup file if needed.
//   node tools/headless.mjs setup --tui
//       Optional prettier output: install pi-tui (pinned, no install scripts)
//       into ~/.local/share/ccp — never bundled with the plugin (tools/ccp-ui.mjs).
//   node tools/headless.mjs session [--cwd <dir>]
//       Print the session id `chat` would resume.
//
// Permission mode: .claude/headless.json `permission_mode` (default `auto` —
// the classifier, closest to an interactive auto-mode session), or
// --permission-mode. Never bypassPermissions. Zero deps, Node >= 18.

import { spawn } from 'node:child_process';
import { appendFileSync, chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
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
    else if (a === '--tui') o.tui = true;
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
  a.push('--output-format', 'stream-json', '--verbose', '--permission-mode', mode, prompt);
  return a;
}

const bin = () => process.env.CLAUDE_BIN || 'claude';

let current = null; // the running turn's child, so Ctrl-C stops the turn, not ccp

// One `claude -p` turn, rendered through tools/ccp-ui.mjs; resolves the exit code.
async function turn(args, cwd, ui, totals = {}) {
  const { onEvent } = await import('./ccp-ui.mjs');
  const st = { tools: 0 };
  const t0 = Date.now();
  ui.spinner();
  const child = spawn(bin(), args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] });
  current = child;
  const lines = readline.createInterface({ input: child.stdout });
  lines.on('line', (l) => onEvent(l, ui, st));
  const rc = await new Promise((res, rej) => {
    child.on('error', (e) => rej(new Error(`could not start ${bin()}: ${e.message}`)));
    child.on('close', (code, sig) => res(sig ? 130 : code ?? 1));
  }).finally(() => { current = null; ui.stopSpin(); });
  if (st.cost != null) totals.cost = (totals.cost || 0) + st.cost;
  if (!totals.model && st.model) totals.model = st.model;
  ui.footer({ secs: Math.round((st.ms ?? Date.now() - t0) / 1000), tools: st.tools, cost: st.cost, total: totals.cost });
  return rc;
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
  const ui = await (await import('./ccp-ui.mjs')).makeUi();
  ui.header({ session, mode, model: cfg.model });
  const totals = {};
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr, prompt: ui.promptText() });
  let open = true;
  rl.on('close', () => { open = false; });
  rl.on('SIGINT', () => (current ? current.kill('SIGINT') : rl.close()));
  rl.prompt();
  for await (const line of rl) {
    if (line.trim()) await turn(claudeArgs({ prompt: line, session, mode }), cwd, ui, totals);
    if (open) rl.prompt();
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
  const ui = await (await import('./ccp-ui.mjs')).makeUi();
  const totals = {};
  for (let i = 1; i <= ticks; i++) {
    const before = ledgerState(cwd, mission);
    if (!before) throw new Error(`no ledger .plans/${mission}.state.md`);
    if (before.closed) { console.error(`mission ${mission} is closed — done.`); return 0; }
    if (await answerPending(cwd, mission, cfg)) continue; // answers in → next tick reads them
    console.error(`tick ${i}/${ticks}: ${before.nextUp.trim()}`);
    const rc = await turn(claudeArgs({ prompt: `/agentic-workflow:mission ${mission} continue`, mode, note: HEADLESS_ASK_NOTE }), cwd, ui, totals);
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

// `ccp` is a POSIX sh executable in ~/.local/bin — the same in zsh, bash,
// fish, sh, cron and scripts; no shell function, no shell-specific syntax.
export function ccpScript(self = SELF) {
  return `#!/bin/sh
# ccp — continue your last Claude Code session headless via claude -p (bills
# where claude -p bills). ccp run <mission> drives a mission unattended;
# ccp preset apply|reset|show manages tune presets with no session needed.
# Written by agentic-workflow tools/headless.mjs setup; re-run setup to refresh.
list=$(ls -d "$HOME"/.claude/plugins/cache/*/agentic-workflow/*/tools/headless.mjs 2>/dev/null)
t=$(printf '%s\\n' "$list" | sort -V 2>/dev/null | tail -n 1)
[ -n "$t" ] || t=$(printf '%s\\n' "$list" | tail -n 1)
[ -n "$t" ] || t=${shQuote(self)}
if [ ! -f "$t" ]; then echo "ccp: agentic-workflow plugin not found (reinstall it, then re-run setup)" >&2; exit 1; fi
command -v node >/dev/null 2>&1 || { echo "ccp: node is not on PATH" >&2; exit 1; }
case "$1" in
  run) exec node "$t" "$@" ;;
  preset) shift; exec node "$(dirname "$t")/preset.mjs" "$@" ;;
  *) exec node "$t" chat "$@" ;;
esac
`;
}

const shQuote = (s) => `'${String(s).replaceAll("'", `'\\''`)}'`;
const PATH_MARK = '# >>> agentic-workflow ccp PATH >>>';
const PATH_END = '# <<< agentic-workflow ccp PATH <<<';

// Shell startup files that should put ~/.local/bin on PATH, by login shell.
export function rcFiles(home, shell = process.env.SHELL || '') {
  const name = path.basename(shell);
  if (name === 'fish') return [{ file: path.join(home, '.config/fish/conf.d/ccp.fish'), line: 'fish_add_path -g $HOME/.local/bin' }];
  const line = 'case ":$PATH:" in *":$HOME/.local/bin:"*) ;; *) export PATH="$HOME/.local/bin:$PATH" ;; esac';
  if (name === 'bash') return [path.join(home, '.bashrc'), path.join(home, '.bash_profile')].map((file) => ({ file, line }));
  if (name === 'zsh') return [{ file: path.join(home, '.zshrc'), line }];
  return [{ file: path.join(home, '.profile'), line }];
}

const stripBlock = (text, a, b) => text.replace(new RegExp(`\\n?${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n?`, 'g'), '\n');

export function installCcp(home = homedir(), { shell = process.env.SHELL, pathEnv = process.env.PATH || '', log = console.log } = {}) {
  const bin = path.join(home, '.local', 'bin');
  const target = path.join(bin, 'ccp');
  mkdirSync(bin, { recursive: true });
  writeFileSync(target, ccpScript());
  chmodSync(target, 0o755);
  log(`installed ${target}`);
  // The old zsh-only function would shadow the executable — remove it.
  const zshrc = path.join(home, '.zshrc');
  if (existsSync(zshrc) && readFileSync(zshrc, 'utf8').includes(ALIAS_MARK)) {
    writeFileSync(zshrc, stripBlock(readFileSync(zshrc, 'utf8'), ALIAS_MARK, '# <<< agentic-workflow headless (ccp) <<<'));
    log('removed the old ccp function from ~/.zshrc (the executable replaces it)');
  }
  if (pathEnv.split(':').includes(bin)) return target;
  for (const { file, line } of rcFiles(home, shell)) {
    const text = existsSync(file) ? readFileSync(file, 'utf8') : '';
    if (text.includes(PATH_MARK)) continue;
    mkdirSync(path.dirname(file), { recursive: true });
    appendFileSync(file, `\n${PATH_MARK}\n${line}\n${PATH_END}\n`);
    log(`added ~/.local/bin to PATH in ${file.replace(home, '~')}`);
  }
  log('open a new terminal (or re-source that file) so `ccp` is found');
  return target;
}

// `setup --tui`: pi-tui into ccp's own folder, exact version, no install scripts.
async function installTui() {
  const { PI_TUI, PI_TUI_VERSION, tuiDir, loadPiTui } = await import('./ccp-ui.mjs');
  const dir = tuiDir();
  mkdirSync(dir, { recursive: true });
  if (!existsSync(path.join(dir, 'package.json'))) writeFileSync(path.join(dir, 'package.json'), '{"private":true}\n');
  const r = await new Promise((res) => spawn('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--save-exact', `${PI_TUI}@${PI_TUI_VERSION}`], { cwd: dir, stdio: 'inherit' }).on('close', res).on('error', () => res(1)));
  const ok = r === 0 && (await loadPiTui(dir));
  console.log(ok ? `pi-tui ${PI_TUI_VERSION} ready in ${dir} — ccp now renders markdown` : `pi-tui install failed (needs Node >= 22.19); ccp keeps the plain renderer`);
  return ok ? 0 : 1;
}

function setup(o, cwd, cfg) {
  if (o.tui) return installTui();
  const file = path.join(cwd, '.claude', 'headless.json');
  const next = { permission_mode: cfg.permission_mode || 'auto', ticks: cfg.ticks || 10, preset: 'isolated' };
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
  console.log(`wrote ${path.relative(cwd, file)} (permission_mode ${next.permission_mode}, ticks ${next.ticks})`);
  if (o.shellAlias) installCcp();
  console.log(`\nWhen the subscription limit hits:\n  ccp                 # same session, headless, you keep typing\n  ccp run <mission>   # unattended mission ticks\n  ccp preset show     # tune presets, no session needed\n(without ccp: node ${SELF} chat | run <mission>)`);
  return 0;
}

export async function main(argv = process.argv.slice(2)) {
  const o = parseArgs(argv);
  const cwd = path.resolve(o.cwd || process.cwd());
  const cfg = readConfig(cwd);
  switch (o._[0]) {
    case 'chat': await chat(o, cwd, cfg); return 0;
    case 'run': return await run(o, cwd, cfg);
    case 'setup': return await setup(o, cwd, cfg);
    case 'session': console.log(latestInteractiveSession(cwd) || ''); return 0;
    default:
      console.error('usage: headless.mjs chat [--session id] | run <mission> [--ticks N] | setup [--shell-alias] [--tui] | session   [--cwd dir] [--permission-mode m]');
      return 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === SELF) {
  main().then((c) => process.exit(c), (e) => { console.error(`headless: ${e.message}`); process.exit(1); });
}
