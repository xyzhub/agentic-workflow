#!/usr/bin/env node
// Tier-1.5 behavioral test for the claude-p adapter (tools/run-claude.mjs).
// Zero deps; Node >= 18. Run: node tools/run-claude-test.mjs (0 = pass, 1 = fail)
//
// Drives the adapter against a FAKE claude: a shim pointed at by CLAUDE_BIN
// that records its argv, cwd and the env keys that matter, prints canned
// stream-json events, and exits with a canned code. No API call is ever made.
//
// What earns this file (the child-isolation lock, D4): the child argv carries
// the budget + permission flags and NEVER --bare / bypassPermissions; the
// compaction window lives on the CHILD env only (the parent's process.env is
// unchanged after a run); CLAUDECODE / CLAUDE_CODE_ENTRYPOINT are stripped;
// a bare `Bash` in the allowlist is refused before any spawn; and the EXIT map
// (0 done · 3 blocked incl. `budget:` · 1 failed incl. no result line).

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, chmodSync, rmSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ROOT, 'plugins/agentic-workflow');
const ADAPTER = path.join(PLUGIN, 'tools/run-claude.mjs');
const SCHEMA = JSON.parse(readFileSync(path.join(PLUGIN, 'templates/distillate.schema.json'), 'utf8'));
const mod = await import(ADAPTER);
const { validate } = await import(path.join(PLUGIN, 'tools/run-codex.mjs'));

let passed = 0;
const fails = [];
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { fails.push(name); console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
};
const group = (title) => console.log(`\n${title}`);
const allInvocations = [];

// ── fixtures ───────────────────────────────────────────────────────────────
const TMP = mkdtempSync(path.join(tmpdir(), 'run-claude-test-'));

const SHIM_SRC = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const argv = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(process.env.SHIM_SPEC, 'utf8'));
const keys = ['CLAUDE_CODE_AUTO_COMPACT_WINDOW', 'AGENTIC_WORKFLOW_CHILD', 'CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT'];
const env = {};
for (const k of keys) env[k] = k in process.env ? process.env[k] : null;
fs.writeFileSync(spec.record, JSON.stringify({ argv, cwd: process.cwd(), env }));
for (const [rel, content] of Object.entries(spec.writes || {})) {
  fs.mkdirSync(path.dirname(rel), { recursive: true });
  fs.writeFileSync(rel, content);
}
if (spec.events) process.stdout.write(spec.events);
if (spec.stderr) process.stderr.write(spec.stderr);
process.exit(spec.exit || 0);
`;
const SHIM = path.join(TMP, 'shim', 'claude');
mkdirSync(path.dirname(SHIM), { recursive: true });
writeFileSync(SHIM, SHIM_SRC);
chmodSync(SHIM, 0o755);

const DECOY_DIR = path.join(TMP, 'decoy');
mkdirSync(DECOY_DIR, { recursive: true });
writeFileSync(path.join(DECOY_DIR, 'claude'), `#!/usr/bin/env node
require('node:fs').writeFileSync(process.env.DECOY_MARKER, 'the PATH claude ran');
process.exit(9);
`);
chmodSync(path.join(DECOY_DIR, 'claude'), 0o755);

const DONE = {
  status: 'done',
  summary: 'recorded the run',
  changed_paths: ['the-model-claims-this.txt'],
  gates: [],
  deviations: [],
  next: [],
  blocked_reason: null,
  runtime: { name: 'claude', model: 'x', effort: 'low', thread_id: null },
  usage: null,
  high_impact_touched: null,
};
const line = (o) => JSON.stringify(o);
const INIT = line({ type: 'system', subtype: 'init', session_id: 'sess-1', tools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'], model: 'claude-haiku-5-5' });
const ASSIST = (inTok, cr, cc) => line({ type: 'assistant', message: { usage: { input_tokens: inTok, cache_read_input_tokens: cr, cache_creation_input_tokens: cc, output_tokens: 5 } } });
const RESULT = (extra = {}) => line({
  type: 'result', subtype: 'success', is_error: false, num_turns: 3, session_id: 'sess-1',
  usage: { input_tokens: 10, cache_read_input_tokens: 2000, cache_creation_input_tokens: 9000, output_tokens: 400 },
  modelUsage: { 'claude-haiku-5-5': { inputTokens: 10 } },
  permission_denials: [],
  structured_output: DONE,
  ...extra,
});
const stream = (...ls) => `${ls.join('\n')}\n`;
const OK_EVENTS = stream(INIT, ASSIST(5, 0, 9887), 'not json — skipped, never a throw', ASSIST(5, 9887, 3000), RESULT());

const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });
function makeRepo(name) {
  const dir = path.join(TMP, name);
  mkdirSync(path.join(dir, 'docs'), { recursive: true });
  mkdirSync(path.join(dir, '.plans'), { recursive: true });
  writeFileSync(path.join(dir, 'docs/WORKFLOW.md'), [
    '## 10. Project profile', '', '| Key | Value |', '|---|---|',
    '| **High-impact files** | `CHANGELOG.md` |', '',
  ].join('\n'));
  writeFileSync(path.join(dir, '.plans/demo.sessions.md'), [
    '### S2 — not this one', '', 'wrong brief', '',
    '### S3 — the brief under test', '', '- **Do**: append one line', '',
    '### S4 — also not', '', 'wrong brief', '',
  ].join('\n'));
  writeFileSync(path.join(dir, 'CHANGELOG.md'), '# Changelog\n');
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'add', '-A');
  git(dir, '-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', 'commit', '-q', '--no-verify', '-m', 'fixture');
  return dir;
}

let caseN = 0;
function runAdapter(args, { repo, spec = {}, env = {}, pathDecoy = false, noBin = false } = {}) {
  caseN++;
  const record = path.join(TMP, `record-${caseN}.json`);
  const specFile = path.join(TMP, `spec-${caseN}.json`);
  const out = path.join(TMP, `out-${caseN}`, 'd.json');
  writeFileSync(specFile, JSON.stringify({ record, events: OK_EVENTS, exit: 0, ...spec }));
  const childEnv = {
    ...process.env, SHIM_SPEC: specFile, CLAUDE_BIN: SHIM,
    CLAUDECODE: '1', CLAUDE_CODE_ENTRYPOINT: 'cli', SECRET_TOKEN: 'sk-should-never-be-logged', ...env,
  };
  delete childEnv.CLAUDE_CODE_AUTO_COMPACT_WINDOW;
  if (pathDecoy) {
    childEnv.PATH = `${DECOY_DIR}${path.delimiter}${process.env.PATH}`;
    childEnv.DECOY_MARKER = path.join(TMP, `decoy-${caseN}.txt`);
  }
  if (noBin) delete childEnv.CLAUDE_BIN;
  const r = spawnSync(process.execPath, [ADAPTER, '--out', out, '--cwd', repo, ...args], { encoding: 'utf8', env: childEnv });
  let rec = null;
  if (existsSync(record)) { rec = JSON.parse(readFileSync(record, 'utf8')); allInvocations.push(rec.argv); }
  return {
    status: r.status,
    stderr: r.stderr || '',
    outPath: out,
    out: existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : null,
    events: existsSync(`${out}.events.jsonl`) ? readFileSync(`${out}.events.jsonl`, 'utf8') : null,
    record: rec,
    decoyMarker: childEnv.DECOY_MARKER,
  };
}
const flagVal = (argv, f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
const LEAN = ['--role', 'chronicler', '--brief', '.plans/demo.sessions.md#S3', '--preset', 'lean'];

// ── cases ──────────────────────────────────────────────────────────────────
const repo = makeRepo('proj');

group('help');
{
  const r = spawnSync(process.execPath, [ADAPTER, '--help'], { encoding: 'utf8' });
  ok('--help exits 0 and names CLAUDE_BIN', r.status === 0 && /CLAUDE_BIN/.test(r.stdout), r.stdout.slice(0, 80));
  const bad = spawnSync(process.execPath, [ADAPTER, '--role', 'x'], { encoding: 'utf8' });
  ok('missing required flags → exit 1', bad.status === 1);
}

group('argv (preset lean, chronicler, no shadow)');
const base = runAdapter(LEAN, { repo });
{
  const a = base.record.argv;
  ok('exit 0 on a done distillate', base.status === 0 && base.out.status === 'done', `exit ${base.status} ${base.stderr}`);
  ok('-p is the first argument', a[0] === '-p');
  ok('--agent agentic-workflow:chronicler when no project shadow exists', flagVal(a, '--agent') === 'agentic-workflow:chronicler', flagVal(a, '--agent'));
  ok('--model claude-haiku-5-5 from the preset row', flagVal(a, '--model') === 'claude-haiku-5-5');
  ok('--max-turns 24 from the preset row', flagVal(a, '--max-turns') === '24');
  ok('--autocompact 100000 (the per-process window)', flagVal(a, '--autocompact') === '100000');
  ok('--effort low from the preset row', flagVal(a, '--effort') === 'low');
  ok('--permission-mode acceptEdits', flagVal(a, '--permission-mode') === 'acceptEdits');
  ok('--permission-prompts none', flagVal(a, '--permission-prompts') === 'none');
  ok('--strict-mcp-config present', a.includes('--strict-mcp-config'));
  ok('--output-format stream-json + --verbose', flagVal(a, '--output-format') === 'stream-json' && a.includes('--verbose'));
  let schemaOk = false;
  try { schemaOk = JSON.parse(flagVal(a, '--json-schema')).title === SCHEMA.title; } catch { /* no */ }
  ok('--json-schema carries the distillate schema', schemaOk);
  ok('--tools = the base names of the allowlist', flagVal(a, '--tools') === 'Read,Write,Edit,Bash,Grep,Glob', flagVal(a, '--tools'));
  ok('--allowedTools carries the scoped Bash rules, no bare Bash',
    flagVal(a, '--allowedTools').includes('Bash(git log:*)') && !mod.splitTools(flagVal(a, '--allowedTools')).some(mod.isBareBash), flagVal(a, '--allowedTools'));
  ok('flag order pinned: -p --agent --model --max-turns --autocompact --effort --permission-mode',
    ['-p', '--agent', '--model', '--max-turns', '--autocompact', '--effort', '--permission-mode'].map((f) => a.indexOf(f)).every((v, i, arr) => v >= 0 && (i === 0 || v > arr[i - 1])));
  const prompt = a[a.length - 1];
  ok('prompt (last arg) carries the S3 section only + a # Budget block naming 500 lines and 24 turns',
    prompt.includes('the brief under test') && !prompt.includes('wrong brief') && /# Budget[\s\S]*500 lines[\s\S]*24 turns/.test(prompt));
  ok('no --bare and no bypassPermissions', !a.includes('--bare') && !a.some((x) => /bypassPermissions/.test(x)));
}

group('child env');
{
  const e = base.record.env;
  ok('child env: CLAUDE_CODE_AUTO_COMPACT_WINDOW=100000', e.CLAUDE_CODE_AUTO_COMPACT_WINDOW === '100000');
  ok('child env: AGENTIC_WORKFLOW_CHILD=1', e.AGENTIC_WORKFLOW_CHILD === '1');
  ok('child env: CLAUDECODE and CLAUDE_CODE_ENTRYPOINT stripped', e.CLAUDECODE === null && e.CLAUDE_CODE_ENTRYPOINT === null, JSON.stringify(e));
  ok('child cwd = --cwd', base.record.cwd.endsWith('proj'));
  // In-process: main() must leave process.env exactly as it found it.
  const specFile = path.join(TMP, 'spec-inproc.json');
  writeFileSync(specFile, JSON.stringify({ record: path.join(TMP, 'rec-inproc.json'), events: OK_EVENTS, exit: 0 }));
  process.env.SHIM_SPEC = specFile;
  process.env.CLAUDE_BIN = SHIM;
  delete process.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW;
  const snap = JSON.stringify(process.env);
  const code = mod.main(['--out', path.join(TMP, 'inproc.json'), '--cwd', repo, ...LEAN]);
  const after = JSON.stringify(process.env);
  ok('parent process.env unchanged after an in-process run (no window var leaks up)',
    code === 0 && snap === after && process.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW === undefined && process.env.AGENTIC_WORKFLOW_CHILD === undefined);
  const inproc = JSON.parse(readFileSync(path.join(TMP, 'inproc.json'), 'utf8'));
  ok('distillate next[] records the parent window as unset', inproc.next.includes('parent CLAUDE_CODE_AUTO_COMPACT_WINDOW=unset'), JSON.stringify(inproc.next));
}

group('events file');
{
  const ev = base.events || '';
  const first = JSON.parse(ev.split('\n')[0]);
  ok('events file written beside --out, first line = adapter record with the child argv',
    first.type === 'adapter' && first.argv.includes('--autocompact') && first.argv[first.argv.indexOf('--autocompact') + 1] === '100000');
  ok('events record carries the child env keys and the parent window (null)',
    first.child_env.CLAUDE_CODE_AUTO_COMPACT_WINDOW === '100000' && first.child_env.CLAUDECODE === null && first.parent_window === null);
  ok('no other env value is ever written (secret stays out)', !ev.includes('sk-should-never-be-logged'));
  ok('the child stream follows the record', ev.includes('"subtype":"init"'));
}

group('distillate');
{
  const d = base.out;
  ok('distillate validates against the schema', validate(d, SCHEMA).length === 0, validate(d, SCHEMA).join('; '));
  ok('runtime.name claude-p, model from modelUsage, thread_id = session_id',
    d.runtime.name === 'claude-p' && d.runtime.model === 'claude-haiku-5-5' && d.runtime.thread_id === 'sess-1' && d.runtime.effort === 'low', JSON.stringify(d.runtime));
  ok('usage = input + cache_read + cache_creation; output', d.usage.input_tokens === 11010 && d.usage.output_tokens === 400, JSON.stringify(d.usage));
  ok('peak + first request recorded as a deviation line',
    d.deviations.some((x) => /peak context ≈ 12892 tokens \(first request 9892\); window 100000/.test(x)), JSON.stringify(d.deviations));
  ok('changed_paths is the tree (model claim discarded)', d.changed_paths.length === 0, JSON.stringify(d.changed_paths));
}

group('resolution');
{
  mkdirSync(path.join(repo, '.claude/agents'), { recursive: true });
  writeFileSync(path.join(repo, '.claude/agents/chronicler.md'), '---\nname: chronicler\ntools: Read, Write, Edit, Bash, Grep, Glob\nmodel: claude-haiku-5-5\neffort: low\nruntime: claude-p\nmaxTurns: 24\n---\nshadow body\n');
  const r = runAdapter(LEAN, { repo });
  ok('--agent chronicler when .claude/agents/chronicler.md exists (project shadow wins)', flagVal(r.record.argv, '--agent') === 'chronicler');
  rmSync(path.join(repo, '.claude'), { recursive: true, force: true });
  const w = runAdapter([...LEAN, '--max-turns', '40', '--compact-window', '200000', '--model', 'claude-sonnet-5-5'], { repo });
  ok('explicit flags win over the preset row (turns, window on argv AND env, model)',
    flagVal(w.record.argv, '--max-turns') === '40' && flagVal(w.record.argv, '--autocompact') === '200000'
    && w.record.env.CLAUDE_CODE_AUTO_COMPACT_WINDOW === '200000' && flagVal(w.record.argv, '--model') === 'claude-sonnet-5-5');
  const intake = runAdapter(['--role', 'intake', '--brief', 'classify this', '--preset', 'lean'], { repo });
  ok('intake under lean: --tools Read,Grep,Glob (no Write/Edit/Bash exist in the child)',
    flagVal(intake.record.argv, '--tools') === 'Read,Grep,Glob', flagVal(intake.record.argv, '--tools'));
  const noModel = runAdapter(['--role', 'intake', '--brief', 'x'], { repo });
  ok('no model resolvable (no --model, no --preset, no model: in the role) → exit 1, nothing spawned', noModel.status === 1 && noModel.record === null);
  const badPreset = runAdapter(['--role', 'intake', '--brief', 'x', '--preset', 'nope'], { repo });
  ok('unknown preset → exit 1', badPreset.status === 1 && badPreset.record === null);
  const lowWin = runAdapter([...LEAN, '--compact-window', '5000'], { repo });
  ok('window below 100000 → exit 1 (outside the --autocompact range)', lowWin.status === 1 && lowWin.record === null);
  const res = runAdapter([...LEAN, '--resume', 'sess-1', '--note', 'fix the date'], { repo });
  ok('--resume passes --resume <id>; the note lands in the prompt',
    flagVal(res.record.argv, '--resume') === 'sess-1' && res.record.argv[res.record.argv.length - 1].includes('fix the date'));
}

group('bare Bash refusal (exit 3, nothing spawned)');
for (const [label, args] of [
  ['--allowed-tools Read,Bash', ['--role', 'chronicler', '--brief', 'x', '--model', 'claude-haiku-5-5', '--allowed-tools', 'Read,Bash']],
  ['--allowed-tools Bash(*)', ['--role', 'chronicler', '--brief', 'x', '--model', 'claude-haiku-5-5', '--allowed-tools', 'Read,Bash(*)']],
  ['--allowed-tools Bash(:*)', ['--role', 'chronicler', '--brief', 'x', '--model', 'claude-haiku-5-5', '--allowed-tools', 'Read,Bash(:*)']],
  ['--allowed-tools Bash(* *)', ['--role', 'chronicler', '--brief', 'x', '--model', 'claude-haiku-5-5', '--allowed-tools', 'Read,Bash(* *)']],
  ['--allowed-tools Bash(*:*)', ['--role', 'chronicler', '--brief', 'x', '--model', 'claude-haiku-5-5', '--allowed-tools', 'Bash(*:*)']],
  ['--allowed-tools Bash()', ['--role', 'chronicler', '--brief', 'x', '--model', 'claude-haiku-5-5', '--allowed-tools', 'Bash()']],
  ['--allowed-tools "Read Bash" (space-separated)', ['--role', 'chronicler', '--brief', 'x', '--model', 'claude-haiku-5-5', '--allowed-tools', 'Read Bash']],
  ['--allowed-tools bash (lowercase)', ['--role', 'chronicler', '--brief', 'x', '--model', 'claude-haiku-5-5', '--allowed-tools', 'Read,bash']],
  ['role tools: with bare Bash and no allowlist', ['--role', 'chronicler', '--brief', 'x', '--model', 'claude-haiku-5-5']],
]) {
  const r = runAdapter(args, { repo });
  ok(`${label} → blocked, exit 3, shim never ran`,
    r.status === 3 && r.record === null && r.out.status === 'blocked' && /bare/.test(r.out.blocked_reason) && validate(r.out, SCHEMA).length === 0,
    `exit ${r.status} ${JSON.stringify(r.out)}`);
}

ok('isBareBash is semantic: empty or glob-first command parts are bare; literal-first rules are scoped',
  ['Bash', 'Bash()', 'Bash(*)', 'Bash(:*)', 'Bash(* *)', 'Bash(*:*)', 'Bash( * )', 'Bash(?it *)', 'bash'].every(mod.isBareBash)
  && !['Bash(git log:*)', 'Bash(gh pr list:*)', 'Read', 'Grep'].some(mod.isBareBash));

group('EXIT map');
{
  const blk = runAdapter(LEAN, { repo, spec: { events: stream(INIT, RESULT({ structured_output: { ...DONE, status: 'blocked', blocked_reason: 'needs owner' } })) } });
  ok('success + distillate blocked → exit 3', blk.status === 3 && blk.out.status === 'blocked');
  const mt = runAdapter(LEAN, { repo, spec: { events: stream(INIT, ASSIST(5, 0, 90000), RESULT({ subtype: 'error_max_turns', num_turns: 24, structured_output: undefined })) } });
  ok('error_max_turns → blocked, exit 3, blocked_reason starts "budget:"',
    mt.status === 3 && mt.out.status === 'blocked' && /^budget: maxTurns 24 reached after 24 turns/.test(mt.out.blocked_reason) && validate(mt.out, SCHEMA).length === 0, JSON.stringify(mt.out && mt.out.blocked_reason));
  const mb = runAdapter(LEAN, { repo, spec: { events: stream(INIT, RESULT({ subtype: 'error_max_budget_usd', structured_output: undefined })) } });
  ok('error_max_budget_usd → blocked budget:, exit 3', mb.status === 3 && /^budget:/.test(mb.out.blocked_reason));
  const ex = runAdapter(LEAN, { repo, spec: { events: stream(INIT, RESULT({ subtype: 'error_during_execution', structured_output: undefined })), exit: 1 } });
  ok('error_during_execution → failed, exit 1', ex.status === 1 && ex.out.status === 'failed' && validate(ex.out, SCHEMA).length === 0);
  const nores = runAdapter(LEAN, { repo, spec: { events: stream(INIT, ASSIST(1, 0, 100)), exit: 0 } });
  ok('child exit 0 with no result line → failed, exit 1', nores.status === 1 && nores.out.status === 'failed' && /no result line/.test(nores.out.summary));
  const bad = runAdapter(LEAN, { repo, spec: { events: stream(INIT, RESULT({ structured_output: { status: 'done' } })) } });
  ok('success with a schema-invalid structured_output → failed, exit 1, red schema gate',
    bad.status === 1 && bad.out.gates[0].name === 'distillate schema' && bad.out.gates[0].result === 'red');
  const txt = runAdapter(LEAN, { repo, spec: { events: stream(INIT, RESULT({ structured_output: undefined, result: JSON.stringify(DONE) })) } });
  ok('success with the distillate as result text (no structured_output) → parsed, exit 0', txt.status === 0 && txt.out.status === 'done');
  const login = runAdapter(LEAN, { repo, spec: { events: '', stderr: 'Not logged in · Please run /login\n', exit: 1 } });
  ok('not logged in → blocked, exit 3', login.status === 3 && login.out.status === 'blocked' && /not logged in/.test(login.out.blocked_reason));
  const enoent = runAdapter(LEAN, { repo, env: { CLAUDE_BIN: path.join(TMP, 'no-such-claude') } });
  ok('binary ENOENT → blocked, exit 3', enoent.status === 3 && enoent.out.status === 'blocked' && /not found/.test(enoent.out.blocked_reason));
  const comp = runAdapter(LEAN, { repo, spec: { events: stream(INIT, ASSIST(1, 0, 101000), line({ type: 'system', subtype: 'compact_boundary' }), RESULT()) } });
  ok('a compact_boundary event → deviation "budget: compaction fired at 100000", not a block',
    comp.status === 0 && comp.out.deviations.includes('budget: compaction fired at 100000'));
  const tree = runAdapter(LEAN, { repo, spec: { writes: { 'CHANGELOG.md': '# Changelog\n- ran\n' } } });
  ok('changed_paths + high_impact_touched come from the tree', JSON.stringify(tree.out.changed_paths) === '["CHANGELOG.md"]'
    && JSON.stringify(tree.out.high_impact_touched) === '["CHANGELOG.md"]', JSON.stringify(tree.out.changed_paths));
  git(repo, 'checkout', '--', 'CHANGELOG.md');
  writeFileSync(path.join(repo, '.gitignore'), '*.log\n');
  git(repo, 'add', '.gitignore');
  git(repo, '-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false', 'commit', '-q', '--no-verify', '-m', 'ignore');
  const ign = runAdapter(LEAN, { repo, spec: { writes: { 'secret.log': 'x' } } });
  ok('a NEW git-ignored write is reported as a deviation (changed_paths cannot see it)',
    ign.out.deviations.some((x) => /wrote git-ignored secret\.log/.test(x)) && ign.out.changed_paths.length === 0, JSON.stringify(ign.out.deviations));
}

group('CLAUDE_BIN beats PATH');
{
  const r = runAdapter(LEAN, { repo, pathDecoy: true });
  ok('CLAUDE_BIN wins over a claude on PATH', r.status === 0 && !existsSync(r.decoyMarker));
}

group('every invocation');
ok(`no recorded invocation (${allInvocations.length}) carried --bare or bypassPermissions`,
  allInvocations.length > 10 && allInvocations.every((a) => !a.some((x) => mod.FORBIDDEN.includes(x) || /bypassPermissions/.test(x))));
ok('FORBIDDEN names --bare and bypassPermissions', mod.FORBIDDEN.includes('--bare') && mod.FORBIDDEN.includes('bypassPermissions'));

rmSync(TMP, { recursive: true, force: true });
console.log('');
if (fails.length) {
  console.error(`run-claude harness: ${fails.length} failure(s), ${passed} passed`);
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`run-claude harness: clean — ${passed} case(s)`);
process.exit(0);
