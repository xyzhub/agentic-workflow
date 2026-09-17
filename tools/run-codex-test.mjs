#!/usr/bin/env node
// Tier-1.5 behavioral test for the Codex adapter. Zero deps; Node >= 18.
// Run: node tools/run-codex-test.mjs   (0 = pass, 1 = fail)
//
// Structural lint proves the adapter parses; this proves it BEHAVES. It covers
// the three pieces of the runtime-agnostic machinery:
//
//   schema   templates/distillate.schema.json parses and stays strict-mode
//            safe (every object additionalProperties:false with every property
//            required) — the property Codex's --output-schema enforces, and the
//            one a hand edit quietly breaks.
//   rules    templates/codex.rules — structurally (every guarded command family
//            has a forbidden rule with a justification and worked examples, and
//            no rule leans on a glob or a host pattern, because execpolicy
//            prefix tokens are literal) and, when the codex binary is present,
//            by running every enumerated example through
//            `codex execpolicy check` for a real verdict.
//   adapter  tools/run-codex.mjs against a FAKE codex: a shim pointed at by
//            CODEX_BIN that records its argv and cwd and emits canned events.
//            No API call is ever made, here or in CI.
//
// The case that earns this file: `codex exec -a never …` exits 2 with
// "unexpected argument" because -a and --search are TOP-LEVEL options. Argv
// ORDER is asserted, not just argv membership. The other load-bearing assertion
// is that `--ignore-rules` never appears in ANY recorded invocation, including
// the resume path — that flag would switch the guardrail rules off.

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, chmodSync, realpathSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ROOT, 'plugins/agentic-workflow');
const ADAPTER = path.join(PLUGIN, 'tools/run-codex.mjs');
const SCHEMA = path.join(PLUGIN, 'templates/distillate.schema.json');
const RULES = path.join(PLUGIN, 'templates/codex.rules');

let passed = 0;
const fails = [];
const skipped = [];
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { fails.push(name); console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
};
const skip = (name, why) => { skipped.push(name); console.log(`  SKIP ${name} — ${why}`); };
const group = (title) => console.log(`\n${title}`);

// Every argv the fake codex ever saw, across every case. Checked once at the end.
const allInvocations = [];

// ── fixtures ───────────────────────────────────────────────────────────────
const TMP = mkdtempSync(path.join(tmpdir(), 'run-codex-test-'));

// The fake codex. Driven by a spec file (SHIM_SPEC) so one shim serves every
// case: it records argv + cwd, writes the canned last message to whatever file
// follows -o, prints canned JSONL events, and exits with the canned code.
const SHIM_SRC = `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const argv = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(process.env.SHIM_SPEC, 'utf8'));
fs.writeFileSync(spec.record, JSON.stringify({ argv, cwd: process.cwd() }));
const i = argv.indexOf('-o');
if (i >= 0 && argv[i + 1] && spec.lastMessage != null) fs.writeFileSync(argv[i + 1], spec.lastMessage);
if (spec.writes && typeof spec.writes === 'object') {
  for (const [rel, content] of Object.entries(spec.writes)) {
    fs.mkdirSync(path.dirname(rel), { recursive: true });
    fs.writeFileSync(rel, content);
  }
}
if (spec.events) process.stdout.write(spec.events);
if (spec.stderr) process.stderr.write(spec.stderr);
process.exit(spec.exit || 0);
`;
const SHIM = path.join(TMP, 'shim', 'codex');
mkdirSync(path.dirname(SHIM), { recursive: true });
writeFileSync(SHIM, SHIM_SRC);
chmodSync(SHIM, 0o755);

// A decoy `codex` for the CODEX_BIN-beats-PATH case: if PATH ever wins, it
// leaves a marker and fails the run loudly.
const DECOY_DIR = path.join(TMP, 'decoy');
mkdirSync(DECOY_DIR, { recursive: true });
const DECOY = path.join(DECOY_DIR, 'codex');
writeFileSync(DECOY, `#!/usr/bin/env node
require('node:fs').writeFileSync(process.env.DECOY_MARKER, 'the PATH codex ran');
process.exit(9);
`);
chmodSync(DECOY, 0o755);

const EVENTS = [
  '{"type":"thread.started","thread_id":"thr_abc123"}',
  '{"type":"item.completed","item":{"type":"reasoning"}}',
  'not json at all — the adapter must skip this line, not throw',
  '{"type":"turn.completed","usage":{"input_tokens":4321,"output_tokens":765}}',
].join('\n');

const DONE_MSG = JSON.stringify({
  status: 'done',
  summary: 'built the thing',
  changed_paths: ['the-model-claims-this.txt'],
  gates: [{ name: 'node tools/lint.mjs', result: 'green', first_error: null }],
  deviations: [],
  next: ['reviewer should check the sandbox derivation'],
  blocked_reason: null,
  runtime: { name: 'codex', model: 'gpt-6-astra', effort: 'medium', thread_id: null },
  usage: null,
  high_impact_touched: null,
});
const withStatus = (status, extra = {}) =>
  JSON.stringify({ ...JSON.parse(DONE_MSG), status, ...extra });

const git = (cwd, ...args) => spawnSync('git', args, { cwd, encoding: 'utf8' });

// A throwaway project: a git repo with a docs/WORKFLOW.md §10 (so the profile
// block and the high-impact row have something to read) and a plan file.
function makeRepo(name) {
  const dir = path.join(TMP, name);
  mkdirSync(path.join(dir, 'docs'), { recursive: true });
  mkdirSync(path.join(dir, 'tools'), { recursive: true });
  mkdirSync(path.join(dir, '.plans'), { recursive: true });
  writeFileSync(path.join(dir, 'docs/WORKFLOW.md'), [
    '## 9. Something else', '', 'not the profile', '',
    '## 10. Project profile', '', '| Key | Value |', '|---|---|',
    '| **Test gate** | `node tools/lint.mjs` |',
    '| **High-impact files** (docs-reminder targets) | `tools/lint.mjs`, `docs/WORKFLOW.md`, `agents/*` |',
    '', '## 11. After the profile', '', 'must not be in the §10 block', '',
  ].join('\n'));
  writeFileSync(path.join(dir, '.plans/demo.sessions.md'), [
    '## Phase 1', '', '### S2 — not this one', '', 'wrong brief', '',
    '### S3 — the brief under test', '', '- **Do**: build the thing', '',
    '### S4 — also not this one', '', 'wrong brief', '',
  ].join('\n'));
  writeFileSync(path.join(dir, 'tools/lint.mjs'), '// a high-impact file\n');
  writeFileSync(path.join(dir, 'notes.txt'), 'ordinary file\n');
  git(dir, 'init', '-q', '-b', 'main');
  git(dir, 'add', '-A');
  git(dir, '-c', 'user.email=t@t', '-c', 'user.name=t', '-c', 'commit.gpgsign=false',
    'commit', '-q', '--no-verify', '-m', 'fixture');
  return dir;
}

let caseN = 0;
// Run the adapter against the fake codex. Returns {status, out (distillate or
// null), record (the argv the shim saw), stderr}.
function runAdapter(args, { repo, spec = {}, env = {}, pathDecoy = false, noCodexBin = false } = {}) {
  caseN++;
  const record = path.join(TMP, `record-${caseN}.json`);
  const specFile = path.join(TMP, `spec-${caseN}.json`);
  const out = path.join(TMP, `out-${caseN}.json`);
  writeFileSync(specFile, JSON.stringify({
    record, events: EVENTS, lastMessage: DONE_MSG, exit: 0, stderr: '', ...spec,
  }));
  const childEnv = {
    ...process.env, SHIM_SPEC: specFile, CODEX_BIN: SHIM, ...env,
  };
  if (pathDecoy) {
    childEnv.PATH = `${DECOY_DIR}${path.delimiter}${process.env.PATH}`;
    childEnv.DECOY_MARKER = path.join(TMP, `decoy-${caseN}.txt`);
  }
  if (noCodexBin) delete childEnv.CODEX_BIN;
  const r = spawnSync(process.execPath, [ADAPTER, '--out', out, '--cwd', repo, ...args], {
    encoding: 'utf8', env: childEnv,
  });
  let rec = null;
  if (existsSync(record)) { rec = JSON.parse(readFileSync(record, 'utf8')); allInvocations.push(rec.argv); }
  return {
    status: r.status,
    stderr: r.stderr || '',
    outPath: out,
    out: existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : null,
    record: rec,
    decoyMarker: childEnv.DECOY_MARKER,
  };
}

// ── group 1: the distillate schema ─────────────────────────────────────────
function schemaGroup() {
  group('schema — templates/distillate.schema.json');
  if (!existsSync(SCHEMA)) { ok('schema file exists', false, SCHEMA); return; }
  let s;
  try { s = JSON.parse(readFileSync(SCHEMA, 'utf8')); }
  catch (e) { ok('schema parses as JSON', false, e.message); return; }
  ok('schema parses as JSON', true);

  // Strict-mode invariant, walked over every object node in the schema.
  const problems = [];
  (function walk(node, where) {
    if (!node || typeof node !== 'object') return;
    if (node.properties) {
      if (node.additionalProperties !== false) problems.push(`${where}: additionalProperties is not false`);
      const req = new Set(node.required || []);
      for (const k of Object.keys(node.properties)) {
        if (!req.has(k)) problems.push(`${where}: "${k}" is not in required`);
      }
      for (const [k, v] of Object.entries(node.properties)) walk(v, `${where}.${k}`);
    }
    if (node.items) walk(node.items, `${where}[]`);
  }(s, '(root)'));
  ok('every object is strict (additionalProperties:false + every property required)',
    problems.length === 0, problems.slice(0, 3).join(' | '));

  const props = s.properties || {};
  const want = ['status', 'summary', 'changed_paths', 'gates', 'deviations', 'next',
    'blocked_reason', 'runtime', 'usage', 'high_impact_touched'];
  ok('memo §7 field set present', want.every((k) => k in props),
    want.filter((k) => !(k in props)).join(', '));
  ok('status is the three-value enum',
    JSON.stringify(props.status?.enum) === JSON.stringify(['done', 'blocked', 'failed']));
  ok('gates[] carries name/result/first_error with the green/red/skipped enum',
    ['name', 'result', 'first_error'].every((k) => k in (props.gates?.items?.properties || {}))
    && JSON.stringify(props.gates?.items?.properties?.result?.enum) === JSON.stringify(['green', 'red', 'skipped']));
  ok('runtime carries name/model/effort/thread_id',
    ['name', 'model', 'effort', 'thread_id'].every((k) => k in (props.runtime?.properties || {})));
  ok('usage carries input_tokens/output_tokens',
    ['input_tokens', 'output_tokens'].every((k) => k in (props.usage?.properties || {})));
  const nullable = (t) => Array.isArray(t) && t.includes('null');
  ok('optional fields are nullable unions, not omissions',
    nullable(props.blocked_reason?.type) && nullable(props.usage?.type)
    && nullable(props.high_impact_touched?.type)
    && nullable(props.runtime?.properties?.thread_id?.type)
    && nullable(props.gates?.items?.properties?.first_error?.type));
}

// ── group 2: the execpolicy guardrails ─────────────────────────────────────
// Parse the rules file into blocks. The `# covers:` / `# match:` / `# not_match:`
// comment lines are a contract with this harness, not decoration.
function parseRules(text) {
  const rules = [];
  let pending = { covers: [], match: [], not_match: [] };
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let m;
    if ((m = l.match(/^#\s*covers:\s*(.+)$/))) pending.covers = m[1].split(',').map((s) => s.trim()).filter(Boolean);
    else if ((m = l.match(/^#\s*match:\s*(.+)$/))) pending.match.push(m[1].trim());
    else if ((m = l.match(/^#\s*not_match:\s*(.+)$/))) pending.not_match.push(m[1].trim());
    else if (/^prefix_rule\(/.test(l)) {
      const body = [];
      for (let j = i; j < lines.length; j++) { body.push(lines[j]); if (/^\)/.test(lines[j])) { i = j; break; } }
      const src = body.join('\n');
      rules.push({
        ...pending,
        src,
        pattern: (src.match(/pattern\s*=\s*(\[[\s\S]*?\])\s*,\s*\n/) || [])[1] || '',
        decision: (src.match(/decision\s*=\s*"([^"]+)"/) || [])[1] || '',
        justification: (src.match(/justification\s*=\s*"([\s\S]*?)",?\s*\n/) || [])[1] || '',
      });
      pending = { covers: [], match: [], not_match: [] };
    }
  }
  return rules;
}

function rulesGroup() {
  group('rules — templates/codex.rules (structure)');
  if (!existsSync(RULES)) { ok('rules file exists', false, RULES); return; }
  const text = readFileSync(RULES, 'utf8');
  const rules = parseRules(text);
  ok('rules file has prefix_rule entries', rules.length > 0);

  ok('header names the deploy path, the config layer and the trust gate',
    /\.codex\/rules\/agentic-workflow\.rules/.test(text)
    && /Project/.test(text)
    && /trust_level\s*=\s*"trusted"/.test(text)
    && /~\/\.codex\/config\.toml/.test(text));
  ok('header warns that --ignore-rules switches the file off', /--ignore-rules/.test(text));

  const FAMILIES = ['git push', 'git commit', 'git tag', 'gh pr create', 'gh pr merge', 'git -C'];
  const covered = new Set(rules.flatMap((r) => r.covers));
  ok('every guarded command family has a rule', FAMILIES.every((f) => covered.has(f)),
    FAMILIES.filter((f) => !covered.has(f)).join(', '));

  for (const r of rules) {
    const label = r.covers.join(' / ') || r.pattern.replace(/\s+/g, ' ').slice(0, 40);
    ok(`rule [${label}] is forbidden with a real justification and worked examples`,
      r.decision === 'forbidden' && r.justification.length > 40
      && r.match.length >= 1 && r.not_match.length >= 1,
      `decision=${r.decision} justification=${r.justification.length}ch match=${r.match.length} not_match=${r.not_match.length}`);
    // Prefix tokens are literal: a `*` matches a literal asterisk and a host
    // pattern cannot be expressed at all. A rule that looks like it relies on
    // either is a rule that does not fire.
    ok(`rule [${label}] uses no glob and no host pattern`,
      !/\*/.test(r.pattern) && !/:\/\/|\.(com|net|org|io|dev)\b/.test(r.pattern), r.pattern);
  }

  group('rules — verdicts from the codex binary');
  const probe = spawnSync('codex', ['--version'], { encoding: 'utf8' });
  if (probe.error || probe.status !== 0) {
    skip('execpolicy verdicts for every enumerated example',
      'no codex binary on PATH (install the Codex CLI to run this group for real)');
    return;
  }
  const decide = (cmd) => {
    const r = spawnSync('codex', ['execpolicy', 'check', '--rules', RULES, ...cmd.split(/\s+/)], { encoding: 'utf8' });
    if (r.status !== 0) return { error: (r.stderr || '').trim().split('\n')[0] };
    try { return JSON.parse(r.stdout); } catch { return { error: `unparsable: ${r.stdout}` }; }
  };
  ok('the rules file loads (a syntax error here fails every verdict below)',
    !decide('git push origin main').error);
  for (const r of rules) {
    for (const cmd of r.match) {
      const v = decide(cmd);
      ok(`forbidden: ${cmd}`, v.decision === 'forbidden', v.error || `decision=${v.decision ?? 'none'}`);
    }
    for (const cmd of r.not_match) {
      const v = decide(cmd);
      ok(`allowed:   ${cmd}`, !v.error && v.decision !== 'forbidden', v.error || `decision=${v.decision}`);
    }
  }
}

// ── group 3: the adapter ───────────────────────────────────────────────────
async function adapterGroup() {
  group('adapter — flag derivation and argv shape');
  const mod = await import(`file://${ADAPTER}`);
  const { deriveFlags, buildExecArgv, buildResumeArgv, parseEvents, highImpactTouched, resolveBin, statusSnapshot, changedPaths } = mod;

  const readOnly = deriveFlags({ role: 'reviewer', tools: ['Read', 'Bash', 'Grep', 'Glob'] });
  ok('no Write/Edit → -s read-only, no network, no --search',
    readOnly.sandbox === 'read-only' && !readOnly.network && !readOnly.search, JSON.stringify(readOnly));
  const write = deriveFlags({ role: 'backend', tools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'] });
  ok('Write/Edit → -s workspace-write, and backend gets network access',
    write.sandbox === 'workspace-write' && write.network && !write.search, JSON.stringify(write));
  const web = deriveFlags({ role: 'architect', tools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob', 'WebSearch', 'WebFetch'] });
  ok('WebSearch/WebFetch → --search (and architect gets no network -c)',
    web.search && web.sandbox === 'workspace-write' && !web.network, JSON.stringify(web));

  const argv = buildExecArgv({
    flags: web, cwd: '/w', model: 'gpt-6-astra', effort: 'high',
    lastMessageFile: '/tmp/last.txt', schemaPath: '/s.json', prompt: 'PROMPT',
  });
  const iExec = argv.indexOf('exec');
  const before = argv.slice(0, iExec);
  const after = argv.slice(iExec + 1);
  ok('globals come BEFORE exec (-a never, --search) — the exit-2 "unexpected argument" bug',
    iExec > 0 && before.join(' ') === '-a never --search', argv.join(' '));
  ok('exec-only flags come after exec, in order, prompt last',
    after.join(' ') === '-s workspace-write -C /w -m gpt-6-astra --json -o /tmp/last.txt '
      + '--output-schema /s.json -c model_reasoning_effort=high -c shell_environment_policy.inherit=all PROMPT',
    after.join(' '));
  const net = buildExecArgv({
    flags: write, cwd: '/w', model: 'm', effort: 'low', lastMessageFile: '/l', schemaPath: '/s', prompt: 'P',
  });
  ok('network role adds -c sandbox_workspace_write.network_access=true',
    net.includes('sandbox_workspace_write.network_access=true') && !net.includes('--search'));
  ok('no --ephemeral anywhere (sessions must persist for resume)',
    !net.includes('--ephemeral') && !argv.includes('--ephemeral'));

  const res = buildResumeArgv({
    flags: write, threadId: 'thr_x', model: 'm', effort: 'low',
    lastMessageFile: '/l', schemaPath: '/s', prompt: 'P',
  });
  const afterExec = res.slice(res.indexOf('exec'));
  ok('resume shape: `exec resume <id>` with no -s, no -C, no -a on the subcommand',
    afterExec[0] === 'exec' && afterExec[1] === 'resume' && afterExec[2] === 'thr_x'
    && !afterExec.includes('-s') && !afterExec.includes('-C') && !afterExec.includes('-a'),
    res.join(' '));
  ok('resume still carries -m, --json, -o, --output-schema and the -c overrides',
    ['-m', '--json', '-o', '--output-schema', '-c'].every((f) => afterExec.includes(f)), res.join(' '));

  const ev = parseEvents(EVENTS);
  ok('event stream yields thread_id and usage, skipping unparsable lines',
    ev.thread_id === 'thr_abc123' && ev.usage.input_tokens === 4321 && ev.usage.output_tokens === 765,
    JSON.stringify(ev));
  const empty = parseEvents('garbage\n{"type":"x"}\n');
  ok('absent event fields become null, never a throw',
    empty.thread_id === null && empty.usage === null, JSON.stringify(empty));
  ok('high_impact_touched is null when the profile has no row',
    highImpactTouched(['a.txt'], null) === null);
  ok('CODEX_BIN is the binary when set, `codex` otherwise',
    resolveBin({ CODEX_BIN: '/x/codex' }) === '/x/codex' && resolveBin({}) === 'codex');

  const delta = makeRepo('delta');
  writeFileSync(path.join(delta, 'notes.txt'), 'dirty before the run\n');
  const deltaBefore = statusSnapshot(delta);
  writeFileSync(path.join(delta, 'tools/lint.mjs'), '// edited by the run\n');
  ok('changedPaths with a snapshot reports only the delta',
    JSON.stringify(changedPaths(delta, deltaBefore)) === JSON.stringify(['tools/lint.mjs']));
  ok('changedPaths without a snapshot retains whole-tree reporting',
    JSON.stringify(changedPaths(delta)) === JSON.stringify(['notes.txt', 'tools/lint.mjs']));
  ok('statusSnapshot captures raw two-character status', deltaBefore.get('notes.txt') === ' M');
  ok('statusSnapshot omits clean tracked files', !deltaBefore.has('tools/lint.mjs'));
  const dirtyBefore = statusSnapshot(delta);
  writeFileSync(path.join(delta, 'notes.txt'), 'edited again with the same status\n');
  ok('an already dirty path edited with the same status is not reported',
    changedPaths(delta, dirtyBefore).length === 0);
  writeFileSync(path.join(delta, 'notes.txt'), 'ordinary file\n');
  ok('a path reverted to clean is not reported', changedPaths(delta, dirtyBefore).length === 0);
  git(delta, 'add', 'tools/lint.mjs');
  ok('a previously dirty path with a changed status is reported',
    JSON.stringify(changedPaths(delta, dirtyBefore)) === JSON.stringify(['tools/lint.mjs']));
  writeFileSync(path.join(delta, 'new.txt'), 'new file\n');
  ok('statusSnapshot captures untracked files with their raw status',
    statusSnapshot(delta).get('new.txt') === '??');
  const missingSnapshot = statusSnapshot(path.join(TMP, 'missing-repo'));
  ok('a failed git status returns an empty Map',
    missingSnapshot instanceof Map && missingSnapshot.size === 0);

  group('adapter — end to end against the fake codex');
  const repo = makeRepo('proj');
  // Simulate the orchestrator's write-ahead edit before the spawn.
  writeFileSync(path.join(repo, 'notes.txt'), 'edited by the orchestrator\n');

  const done = runAdapter(['--role', 'backend', '--brief', '.plans/demo.sessions.md#S3'], {
    repo, spec: { writes: {
      'tools/lint.mjs': '// edited by the run\n',
      'made-by-run.txt': 'made by the run\n',
    } },
  });
  ok('status done → exit 0', done.status === 0, `exit ${done.status} ${done.stderr}`);
  ok('the distillate file is the interface (written to --out)', done.out !== null);
  ok('changed_paths is the delta vs the pre-spawn snapshot',
    JSON.stringify(done.out?.changed_paths) === JSON.stringify(['made-by-run.txt', 'tools/lint.mjs']),
    JSON.stringify(done.out?.changed_paths));
  ok("a file dirty before the spawn is not reported as the run's change",
    Array.isArray(done.out?.changed_paths) && !done.out.changed_paths.includes('notes.txt'));
  ok('high_impact_touched is the intersection with the §10 row',
    JSON.stringify(done.out?.high_impact_touched) === JSON.stringify(['tools/lint.mjs']),
    JSON.stringify(done.out?.high_impact_touched));
  ok('thread_id and usage are attached from the event stream',
    done.out?.runtime.thread_id === 'thr_abc123' && done.out?.usage.input_tokens === 4321,
    JSON.stringify(done.out?.runtime));
  ok('runtime records name/model/effort',
    done.out?.runtime.name === 'codex' && done.out?.runtime.model === 'gpt-6-astra'
    && done.out?.runtime.effort === 'medium');
  ok('backend (Write/Edit) really ran with -s workspace-write and network on',
    done.record?.argv.includes('workspace-write')
    && done.record?.argv.includes('sandbox_workspace_write.network_access=true'));
  ok('the child ran in --cwd', done.record?.cwd && existsSync(done.record.cwd));

  // Prompt assembly: the shim records the prompt as the last argv element.
  const prompt = done.record.argv[done.record.argv.length - 1];
  const at = (needle) => prompt.indexOf(needle);
  ok('prompt blocks are in memo §6 order: role → §10 → brief → return contract',
    at('# Your role: backend') === 0
    && at('# Project profile') > 0
    && at('# Your brief') > at('# Project profile')
    && at('# Return contract') > at('# Your brief'),
    `role=${at('# Your role: backend')} profile=${at('# Project profile')} brief=${at('# Your brief')} contract=${at('# Return contract')}`);
  ok('role frontmatter is stripped from the prompt', !/^---\nname:/.test(prompt));
  ok('§10 is verbatim and stops at §11',
    prompt.includes('## 10. Project profile') && prompt.includes('High-impact files')
    && !prompt.includes('must not be in the §10 block'));
  ok('the brief is the named section only, not the whole plan file',
    prompt.includes('### S3 — the brief under test') && !prompt.includes('### S2 — not this one')
    && !prompt.includes('### S4 — also not this one'));
  ok('the return contract states the standing rules (no .plans, no commit/push/merge, blocked)',
    /never edit anything under \.plans\//i.test(prompt) && /Never commit\. Never push\. Never merge\./.test(prompt)
    && /status "blocked"/.test(prompt) && prompt.includes('distillate.schema.json'));

  const noted = runAdapter(['--role', 'backend', '--brief', 'just do the thing', '--note', 'return only the JSON distillate'], { repo });
  const notedPrompt = noted.record.argv[noted.record.argv.length - 1];
  ok('--note is appended last, after the return contract',
    notedPrompt.indexOf('# Correction') > notedPrompt.indexOf('# Return contract')
    && notedPrompt.includes('return only the JSON distillate'));
  ok('a --brief that is not a file is used as the brief text',
    notedPrompt.includes('just do the thing'));

  const chron = runAdapter(['--role', 'chronicler', '--brief', 'write the log'], { repo });
  const chronPrompt = chron.record.argv[chron.record.argv.length - 1];
  ok('a skill the role prompt names is inlined (chronicler → plain-report)',
    chronPrompt.includes('# Skill: plain-report')
    && chronPrompt.includes('write for the reader who wasn\'t in the session'));
  ok('the inlined skill sits between the profile and the brief',
    chronPrompt.indexOf('# Skill: plain-report') > chronPrompt.indexOf('# Project profile')
    && chronPrompt.indexOf('# Skill: plain-report') < chronPrompt.indexOf('# Your brief'));
  const rev = runAdapter(['--role', 'reviewer', '--brief', 'review it'], { repo });
  ok('a read-only role runs with -s read-only and no network -c',
    rev.record?.argv.includes('read-only')
    && !rev.record?.argv.includes('sandbox_workspace_write.network_access=true'));

  // A tune override in the project wins — body AND the tools that derive the
  // sandbox. Its own repo, so no other case sees it.
  const tuned = makeRepo('tuned');
  mkdirSync(path.join(tuned, '.claude/agents'), { recursive: true });
  writeFileSync(path.join(tuned, '.claude/agents/backend.md'),
    '---\nname: backend\ntools: Read, Grep, Glob\n---\n\nTUNED BACKEND BODY.\n');
  const ov = runAdapter(['--role', 'backend', '--brief', 'x'], { repo: tuned });
  const ovPrompt = ov.record.argv[ov.record.argv.length - 1];
  ok('.claude/agents override supplies the prompt body', ovPrompt.includes('TUNED BACKEND BODY.'));
  ok('.claude/agents override also decides the sandbox (read-only here)',
    ov.record.argv.includes('read-only') && !ov.record.argv.includes('workspace-write'));

  group('adapter — resume, binary resolution, exit codes');
  const resumed = runAdapter(['--role', 'backend', '--brief', 'x', '--resume', 'thr_prev'], { repo });
  const rargv = resumed.record.argv;
  const rAfter = rargv.slice(rargv.indexOf('exec'));
  ok('resume invokes `exec resume <thread-id>` with no -s/-C/-a after exec',
    rAfter[1] === 'resume' && rAfter[2] === 'thr_prev'
    && !rAfter.includes('-s') && !rAfter.includes('-C') && !rAfter.includes('-a'), rargv.join(' '));
  ok('resume passes the working directory as the child process cwd',
    realpathSync(resumed.record.cwd) === realpathSync(repo), `${resumed.record.cwd} vs ${repo}`);

  // Two halves of one claim. First: with no CODEX_BIN the adapter really does
  // take `codex` off PATH — so the decoy is reachable and the next case is not
  // vacuous. Then: with CODEX_BIN set, the decoy stays untouched.
  const viaPath = runAdapter(['--role', 'backend', '--brief', 'x'], { repo, pathDecoy: true, noCodexBin: true });
  ok('without CODEX_BIN the adapter uses `codex` from PATH (the decoy ran)',
    existsSync(viaPath.decoyMarker), `exit ${viaPath.status}`);
  const decoyed = runAdapter(['--role', 'backend', '--brief', 'x'], { repo, pathDecoy: true });
  ok('CODEX_BIN beats a `codex` that is also on PATH',
    decoyed.status === 0 && decoyed.record !== null && !existsSync(decoyed.decoyMarker),
    `exit ${decoyed.status}`);

  const blocked = runAdapter(['--role', 'backend', '--brief', 'x'],
    { repo, spec: { lastMessage: withStatus('blocked', { blocked_reason: 'needs an owner decision' }) } });
  ok('status blocked → exit 3', blocked.status === 3 && blocked.out.status === 'blocked', `exit ${blocked.status}`);

  const failed = runAdapter(['--role', 'backend', '--brief', 'x'],
    { repo, spec: { lastMessage: 'Sure! Here is the summary: I built the thing.',
      writes: { 'failed-run.txt': 'made by the failed run\n' } } });
  ok('a non-JSON last message → exit 1, status failed, "distillate not valid JSON"',
    failed.status === 1 && failed.out.status === 'failed'
    && failed.out.gates[0].first_error === 'distillate not valid JSON', `exit ${failed.status}`);
  ok('the raw last message is saved beside the distillate',
    existsSync(`${failed.outPath}.raw.txt`)
    && readFileSync(`${failed.outPath}.raw.txt`, 'utf8').includes('Sure!'));
  ok('the failed distillate still carries the tree-derived delta',
    JSON.stringify(failed.out.changed_paths) === JSON.stringify(['failed-run.txt'])
    && failed.out.runtime.thread_id === 'thr_abc123');

  const invalid = runAdapter(['--role', 'backend', '--brief', 'x'],
    { repo, spec: { lastMessage: JSON.stringify({ status: 'done', summary: 'x' }) } });
  ok('JSON that does not match the schema → exit 1, status failed',
    invalid.status === 1 && invalid.out.status === 'failed'
    && /schema/.test(invalid.out.summary), `exit ${invalid.status} ${invalid.out?.summary}`);

  const noBin = runAdapter(['--role', 'backend', '--brief', 'x'],
    { repo, env: { CODEX_BIN: path.join(TMP, 'no-such-codex') } });
  ok('missing codex binary → exit 3, status blocked with a reason (never a Claude fallback)',
    noBin.status === 3 && noBin.out.status === 'blocked' && /codex binary not found/.test(noBin.out.blocked_reason),
    `exit ${noBin.status}`);

  const badArg = spawnSync(process.execPath, [ADAPTER, '--role', 'backend'], { encoding: 'utf8' });
  ok('missing required args → exit 1 with usage', badArg.status === 1 && /--brief is required/.test(badArg.stderr));
  const help = spawnSync(process.execPath, [ADAPTER, '--help'], { encoding: 'utf8' });
  ok('--help prints usage including the CODEX_BIN override',
    help.status === 0 && /CODEX_BIN/.test(help.stdout) && /--resume/.test(help.stdout));

  group('adapter — the guardrail flag never appears');
  ok(`--ignore-rules absent from all ${allInvocations.length} recorded invocations (resume included)`,
    allInvocations.length > 5 && allInvocations.every((a) => !a.includes('--ignore-rules')));
  ok('--ephemeral absent from all recorded invocations',
    allInvocations.every((a) => !a.includes('--ephemeral')));
  ok('every recorded invocation put -a never before exec',
    allInvocations.every((a) => a.indexOf('-a') === 0 && a[1] === 'never' && a.indexOf('exec') > 1));
}

async function checksGroup() {
  group('codex-routing checks — distillate discovery');
  const { default: checks } = await import(`file://${path.join(ROOT, 'evals/scenarios/codex-routing/checks.mjs')}`);
  const fx = path.join(TMP, 'checks-fx');
  mkdirSync(path.join(fx, '.plans/runs'), { recursive: true });
  writeFileSync(path.join(fx, '.plans/widget-tags.state.md'), 'Sessions used: 1\n- [x] S1 — thing\n');
  const events = [{ message: { content: [{
    type: 'tool_use', name: 'Bash',
    input: { command: 'node /p/tools/run-codex.mjs --role backend --brief .plans/x.sessions.md#S1 --cwd "$PWD" --out "$OUT"' },
  }] } }];
  const out = path.join(fx, '.plans/runs/r.json');
  writeFileSync(out, JSON.stringify({ status: 'failed', runtime: { name: 'codex' } }));
  const failed = await checks({ dir: fx, events });
  ok('a failed codex distillate does not satisfy shape discovery',
    failed.some((f) => /no codex distillate found/.test(f)));
  writeFileSync(out, JSON.stringify({ status: 'done', runtime: { name: 'codex' } }));
  const done = await checks({ dir: fx, events });
  ok('a done codex distillate satisfies shape discovery', done.length === 0, JSON.stringify(done));
  writeFileSync(out, JSON.stringify({ status: 'blocked', runtime: { name: 'codex' } }));
  const blocked = await checks({ dir: fx, events });
  ok('a blocked distillate does not satisfy shape discovery',
    blocked.some((f) => /no codex distillate found/.test(f)));
}

// ── run ────────────────────────────────────────────────────────────────────
schemaGroup();
rulesGroup();
await adapterGroup();
await checksGroup();

console.log('');
if (fails.length) {
  console.error(`run-codex harness: ${fails.length} failure(s), ${passed} passed`);
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`run-codex harness: clean — ${passed} case(s)${skipped.length ? `, ${skipped.length} skipped` : ''}`);
if (skipped.length) console.log('  (skipped: ' + skipped.join('; ') + ')');
process.exit(0);
