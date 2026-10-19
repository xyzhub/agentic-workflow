#!/usr/bin/env node
// Tier-1.5 behavioral test for the ccp launcher (tools/headless.mjs) and its
// renderer (tools/ccp-ui.mjs). Zero deps; Node >= 18.
// Run: node tools/headless-test.mjs (0 = pass, 1 = fail)
//
// Drives `headless.mjs chat` against a FAKE claude (CLAUDE_BIN) that prints
// canned stream-json events. No API call is ever made. Locks: the turn argv
// carries stream-json and never bypassPermissions; tool lines, ✗ on a failed
// tool and the cost footer render; terminal escapes, bidi and zero-width
// controls in model text, tool args and ledger lines never reach the terminal;
// a pi-tui renderer that throws falls back to plain instead of killing ccp;
// stdin EOF mid-turn exits 0.

import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOOLS = path.join(ROOT, 'plugins/agentic-workflow/tools');
const ui = await import(pathToFileURL(path.join(TOOLS, 'ccp-ui.mjs')).href);
const { claudeArgs } = await import(pathToFileURL(path.join(TOOLS, 'headless.mjs')).href);

let failures = 0;
const check = (name, ok, detail = '') => {
  if (ok) console.log(`ok   ${name}`);
  else { failures++; console.log(`FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
};
const ESC = /[\x1b\x07\x9b‮​]/;

// clean(): controls out, newline/tab and ordinary text kept.
check('clean strips ESC/BEL/C1/bidi/zero-width', !ESC.test(ui.clean('a\x1b]0;x\x07b\x9b2J‮c​d')));
check('clean keeps \\n, \\t and text', ui.clean('one\ttwo\nthree') === 'one\ttwo\nthree');

// claudeArgs: stream-json, permission mode, never bypass.
const a = claudeArgs({ prompt: 'hi', session: 's1', mode: 'auto' });
check('turn argv streams json', a.includes('stream-json') && a.includes('--verbose'), a.join(' '));
check('turn argv never bypasses permissions', !a.some((x) => /bypass/i.test(x)));

// onEvent through a captured plain renderer.
const sink = [];
const plain = ui.plainUi({ out: { write: (s) => sink.push(s), isTTY: false }, err: { write() {}, isTTY: false }, styled: false });
const st = { tools: 0 };
const ev = (o) => ui.onEvent(JSON.stringify(o), plain, st);
ev({ type: 'system', subtype: 'init', model: 'm\x1b[31m' });
ev({ type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'cat \x1b[2J f' } }] } });
ev({ type: 'user', message: { content: [{ type: 'tool_result', is_error: true }] } });
ev({ type: 'assistant', message: { content: [{ type: 'text', text: 'done \x1b]0;pwned\x07 ok' }] } });
ev({ type: 'result', total_cost_usd: 0.25, duration_ms: 2000 });
ui.onEvent('not json', plain, st);
const shown = sink.join('');
check('tool line rendered', /⏺ Bash\s+cat \[2J f/.test(shown), JSON.stringify(shown));
check('failed tool marked ✗', shown.includes('✗ tool error'));
check('no escapes reach the terminal', !ESC.test(shown) && !ESC.test(st.model));
check('result captured', st.cost === 0.25 && st.ms === 2000 && st.tools === 1);

// A throwing pi-tui Markdown falls back to plain.
const errs = [];
const pi = ui.piUi({ Markdown: class { render() { throw new Error('boom'); } } }, { out: { write: (s) => sink.push(s), isTTY: false }, err: { write: (s) => errs.push(s) }, styled: false });
let threw = false;
try { pi.text('**x**'); pi.text('y'); } catch { threw = true; }
check('pi-tui throw falls back to plain', !threw && errs.length === 1 && /plain output/.test(errs[0]), errs.join(''));

// End to end: chat loop against a fake claude, stdin closes mid-run.
const dir = mkdtempSync(path.join(tmpdir(), 'ccp-test-'));
try {
  const fake = path.join(dir, 'claude');
  const argvLog = path.join(dir, 'argv');
  writeFileSync(fake, `#!/bin/sh\nprintf '%s\\n' "$@" > "${argvLog}"\n`
    + `printf '%s\\n' '{"type":"assistant","message":{"content":[{"type":"text","text":"hello"}]}}' '{"type":"result","total_cost_usd":0.1,"duration_ms":1000}'\n`);
  chmodSync(fake, 0o755);
  mkdirSync(path.join(dir, 'cwd'));
  const r = spawnSync('node', [path.join(TOOLS, 'headless.mjs'), 'chat', '--session', 'abc', '--cwd', path.join(dir, 'cwd')],
    { input: 'hi\nagain\n', encoding: 'utf8', env: { ...process.env, CLAUDE_BIN: fake, NO_COLOR: '1' } });
  check('chat exits 0 on stdin EOF', r.status === 0, r.stderr);
  check('chat renders the reply and footer', /hello/.test(r.stdout) && /\$0\.10/.test(r.stdout), r.stdout);
  const argv = readFileSync(argvLog, 'utf8');
  check('chat resumes the session', /--resume\nabc\n/.test(argv), argv);
} finally { rmSync(dir, { recursive: true, force: true }); }

console.log(failures ? `\n${failures} failure(s)` : '\nall passed');
process.exit(failures ? 1 : 0);
