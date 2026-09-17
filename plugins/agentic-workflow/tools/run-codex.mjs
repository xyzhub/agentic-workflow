#!/usr/bin/env node
// run-codex.mjs — run one workflow role on the Codex CLI and return the
// distillate the orchestrator reads. Zero deps; Node >= 18; needs `codex` on
// PATH (or CODEX_BIN) and `git` for the tree-derived fields.
//
//   node run-codex.mjs --role <role> --brief <plan.md#S3 | text>
//                      --cwd <dir> --out <distillate.json>
//                      [--model <m>] [--effort low|medium|high]
//                      [--resume <thread-id>] [--note "<corrective>"] [--help]
//
// Exit codes (the orchestrator branches on these, never on stdout):
//   0  done     the distillate says done
//   3  blocked  the distillate says blocked — including "no codex binary" and
//               "not authenticated", which are owner problems, not retries
//   1  failed   the model returned something unusable, the run errored, or the
//               arguments were wrong
//
// The distillate file named by --out is the ONLY interface. Codex's own stdout
// is a JSONL event stream; it is saved beside --out (`.events.jsonl`) for
// debugging and never parsed for content — only for thread id and token usage.
//
// Why an adapter at all: Claude Code's Agent tool runs Claude models. To run a
// role on Codex we have to rebuild by hand what the Agent tool does for free —
// the role prompt, the project profile, the skills the prompt names, the brief,
// the return contract — and then put back the guardrails that are Claude hooks
// (they do not fire inside Codex): the sandbox mode comes from the role's
// declared tools, and the forbidden commands come from the project-layer
// execpolicy file (templates/codex.rules). This file must NEVER pass
// --ignore-rules: that flag switches those guardrails off.

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const SCHEMA_PATH = path.join(PLUGIN_ROOT, 'templates/distillate.schema.json');

// Roles that install things or read GitHub: the only ones that get network
// inside a workspace-write sandbox.
const NETWORK_ROLES = new Set(['backend', 'frontend', 'devops', 'security']);

const USAGE = `run-codex.mjs — run one workflow role on the Codex CLI.

  node run-codex.mjs --role <role> --brief <plan.md#S3 | "text">
                     --cwd <dir> --out <distillate.json>
                     [--model <model>] [--effort low|medium|high]
                     [--resume <thread-id>] [--note "<corrective text>"]

  --role    a role in the plugin's agents/ (backend, reviewer, …). Its
            frontmatter \`tools:\` decides the sandbox: no Write/Edit means
            -s read-only, Write/Edit means -s workspace-write, WebSearch/
            WebFetch adds --search. A \`.claude/agents/<role>.md\` override in
            --cwd wins, so prompt parity with a tuned Claude role holds.
  --brief   \`<file>#<anchor>\` pulls that heading's section out of the plan
            file (relative to --cwd), e.g. .plans/m.sessions.md#S3. A value
            that is not an existing file is used as the brief text itself.
  --cwd     the working directory of the run. Also the tree \`changed_paths\`
            is the delta vs a snapshot taken before the spawn. The
            orchestrator's own pre-spawn edits are not the run's changes.
  --out     where the distillate JSON is written. This is the interface.
  --model   default gpt-6-astra.       --effort  default medium.
  --resume  continue a persisted session (sessions are not --ephemeral).
            Resume is a narrower CLI shape: no -s/-C, the working directory
            comes from this process spawning the child with cwd.
  --note    corrective text appended last, for a retry.

Environment:
  CODEX_BIN   absolute path to the codex binary. Overrides PATH — this is what
              lets the test harness and the eval fixture point at a shim
              without touching PATH. Unset: \`codex\` is looked up on PATH.

Exit: 0 done · 3 blocked (incl. missing/unauthenticated binary) · 1 failed.`;

// ── argv ───────────────────────────────────────────────────────────────────
export function parseArgs(argv) {
  const known = new Set(['--role', '--brief', '--cwd', '--out', '--model', '--effort', '--resume', '--note']);
  const o = { model: 'gpt-6-astra', effort: 'medium', resume: null, note: null, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { o.help = true; continue; }
    if (!known.has(a)) return { error: `unknown argument "${a}"` };
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) return { error: `${a} needs a value` };
    o[a.slice(2)] = v;
    i++;
  }
  if (o.help) return o;
  for (const req of ['role', 'brief', 'cwd', 'out']) {
    if (!o[req]) return { error: `--${req} is required` };
  }
  if (!['low', 'medium', 'high'].includes(o.effort)) {
    return { error: `--effort must be low, medium or high (got "${o.effort}")` };
  }
  return o;
}

// ── prompt assembly ────────────────────────────────────────────────────────
export const stripFrontmatter = (text) =>
  text.replace(/^---\n[\s\S]*?\n---\n?/, '').trimStart();

export function frontmatterValue(text, key) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const hit = m[1].split('\n').find((l) => l.startsWith(`${key}:`));
  return hit ? hit.slice(key.length + 1).trim() : null;
}

// A tune override in the project wins over the shipped role prompt.
export function roleFile(role, cwd) {
  const override = path.join(cwd, '.claude/agents', `${role}.md`);
  if (existsSync(override)) return override;
  const shipped = path.join(PLUGIN_ROOT, 'agents', `${role}.md`);
  return existsSync(shipped) ? shipped : null;
}

export const toolsOf = (roleText) =>
  (frontmatterValue(roleText, 'tools') || '')
    .replace(/^\[|\]$/g, '').split(',').map((t) => t.trim()).filter(Boolean);

// Section extraction, used for both WORKFLOW §10 and the brief: take the
// matching heading and everything under it until a heading of the same or a
// higher level.
export function section(text, headingRe) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => headingRe.test(l));
  if (start < 0) return null;
  const level = (lines[start].match(/^#+/) || ['#'])[0].length;
  const out = [lines[start]];
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#+)\s/);
    if (m && m[1].length <= level) break;
    out.push(lines[i]);
  }
  return out.join('\n').trimEnd();
}

export const workflowSection10 = (cwd) => {
  const f = path.join(cwd, 'docs/WORKFLOW.md');
  if (!existsSync(f)) return null;
  return section(readFileSync(f, 'utf8'), /^##\s+10\.\s/);
};

// Skills the role prompt names: a skill directory whose name appears in the
// body backticked or as "<name> skill". (The `impeccable` probe is left alone —
// it is a filesystem check the run does itself.)
export function namedSkills(roleText) {
  const dir = path.join(PLUGIN_ROOT, 'skills');
  if (!existsSync(dir)) return [];
  const names = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory()).map((d) => d.name);
  return names.filter((n) => new RegExp('`' + n + '`|\\b' + n + ' skill\\b').test(roleText));
}

export function briefText(brief, cwd) {
  const [maybeFile, anchor] = brief.split('#');
  const abs = path.isAbsolute(maybeFile) ? maybeFile : path.join(cwd, maybeFile);
  if (!maybeFile || !existsSync(abs)) return brief; // ad-hoc text
  const text = readFileSync(abs, 'utf8');
  if (!anchor) return text;
  const esc = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sec = section(text, new RegExp(`^#{2,4}\\s+${esc}\\b`));
  return sec || `(no section "${anchor}" in ${maybeFile} — read the file yourself)\n\n${text}`;
}

export const RETURN_CONTRACT = (schemaPath) => `Your FINAL message must be JSON and nothing else: no prose before it, no
code fence around it. It must validate against the distillate schema at
${schemaPath} — status, summary, changed_paths, gates, deviations, next,
blocked_reason, runtime, usage, high_impact_touched (send null, not an
omission, for the ones you have nothing for; the adapter fills in
changed_paths, runtime.thread_id, usage and high_impact_touched from the
tree and the event stream, so a rough value there is fine).

Standing rules for a delegated run, no exceptions:
- Never edit anything under .plans/ — the orchestrator owns the ledger.
- Never commit. Never push. Never merge. Never open or merge a pull request.
  The orchestrator commits from your distillate.
- Run the project's gates and report each one in \`gates\` with its real
  verdict. A gate you did not run is "skipped", never "green".
- Anything that needs an owner's decision — a destructive migration, a
  credential, a scope change — stop and return status "blocked" with
  blocked_reason naming the decision.
- If a command is refused by policy, do not work around it: end with
  status "blocked" naming the command.`;

export function assemblePrompt(o) {
  const rf = roleFile(o.role, o.cwd);
  if (!rf) throw new Error(`no role prompt for "${o.role}" (looked in ${o.cwd}/.claude/agents and ${PLUGIN_ROOT}/agents)`);
  const roleText = readFileSync(rf, 'utf8');
  const blocks = [];
  blocks.push(`# Your role: ${o.role}\n\n${stripFrontmatter(roleText)}`);
  const s10 = workflowSection10(o.cwd);
  blocks.push(`# Project profile — docs/WORKFLOW.md §10 (verbatim)\n\n${s10 || '(no docs/WORKFLOW.md §10 in this project — ask before assuming a gate, a branch policy or a deploy step.)'}`);
  for (const skill of namedSkills(roleText)) {
    const f = path.join(PLUGIN_ROOT, 'skills', skill, 'SKILL.md');
    if (existsSync(f)) blocks.push(`# Skill: ${skill} (inlined — your role prompt names it)\n\n${stripFrontmatter(readFileSync(f, 'utf8'))}`);
  }
  blocks.push(`# Your brief\n\n${briefText(o.brief, o.cwd)}`);
  blocks.push(`# Return contract\n\n${RETURN_CONTRACT(SCHEMA_PATH)}`);
  if (o.note) blocks.push(`# Correction from the orchestrator (this overrides the brief where they conflict)\n\n${o.note}`);
  return blocks.join('\n\n---\n\n');
}

// ── flag derivation + argv ─────────────────────────────────────────────────
export function deriveFlags({ role, tools }) {
  const has = (t) => tools.includes(t);
  return {
    sandbox: has('Write') || has('Edit') ? 'workspace-write' : 'read-only',
    network: NETWORK_ROLES.has(role),
    search: has('WebSearch') || has('WebFetch'),
  };
}

// Global options come BEFORE the subcommand. `codex exec -a never …` exits 2
// with "unexpected argument"; `codex -a never exec …` parses. Same for
// --search. The harness pins this order.
function globals(flags) {
  const g = ['-a', 'never'];
  if (flags.search) g.push('--search');
  return g;
}

export function buildExecArgv({ flags, cwd, model, effort, lastMessageFile, schemaPath, prompt }) {
  const a = [
    ...globals(flags),
    'exec',
    '-s', flags.sandbox,
    '-C', cwd,
    '-m', model,
    '--json',
    '-o', lastMessageFile,
    '--output-schema', schemaPath,
    '-c', `model_reasoning_effort=${effort}`,
    '-c', 'shell_environment_policy.inherit=all',
  ];
  if (flags.network) a.push('-c', 'sandbox_workspace_write.network_access=true');
  a.push(prompt);
  return a;
}

// `exec resume <id>` accepts -c, -m, --json, -o, --output-schema and NOTHING
// else: no -s, no -C, no -a on the subcommand. The sandbox is inherited from
// the persisted session and the working directory comes from the child
// process's own cwd, which main() passes to spawnSync.
export function buildResumeArgv({ flags, threadId, model, effort, lastMessageFile, schemaPath, prompt }) {
  const a = [
    ...globals(flags),
    'exec', 'resume', threadId,
    '-m', model,
    '--json',
    '-o', lastMessageFile,
    '--output-schema', schemaPath,
    '-c', `model_reasoning_effort=${effort}`,
    '-c', 'shell_environment_policy.inherit=all',
  ];
  a.push(prompt);
  return a;
}

export const resolveBin = (env = process.env) => env.CODEX_BIN || 'codex';

// ── schema validation (the subset the distillate schema uses) ──────────────
export function validate(value, schema, where = '') {
  const errs = [];
  const types = [].concat(schema.type || []);
  const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  const t = typeOf(value);
  const want = types.map((x) => (x === 'integer' ? 'number' : x));
  if (want.length && !want.includes(t)) {
    errs.push(`${where || '(root)'}: expected ${want.join('|')}, got ${t}`);
    return errs;
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errs.push(`${where}: "${value}" not one of ${schema.enum.join('|')}`);
  }
  if (t === 'object' && schema.properties) {
    for (const k of schema.required || []) {
      if (!(k in value)) errs.push(`${where || '(root)'}: missing required "${k}"`);
    }
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(value)) {
        if (!(k in schema.properties)) errs.push(`${where || '(root)'}: unexpected property "${k}"`);
      }
    }
    for (const [k, sub] of Object.entries(schema.properties)) {
      if (k in value) errs.push(...validate(value[k], sub, where ? `${where}.${k}` : k));
    }
  }
  if (t === 'array' && schema.items) {
    value.forEach((v, i) => errs.push(...validate(v, schema.items, `${where}[${i}]`)));
  }
  return errs;
}

// ── event-stream mining (tolerant: absent fields become null, never a throw) ─
export function parseEvents(text) {
  let threadId = null;
  let usage = null;
  const visit = (node, depth = 0) => {
    if (!node || typeof node !== 'object' || depth > 12) return;
    if (Array.isArray(node)) { node.forEach((v) => visit(v, depth + 1)); return; }
    for (const key of ['thread_id', 'threadId', 'session_id', 'sessionId', 'conversation_id', 'conversationId']) {
      if (threadId === null && typeof node[key] === 'string' && node[key]) threadId = node[key];
    }
    const i = node.input_tokens ?? node.inputTokens;
    const out = node.output_tokens ?? node.outputTokens;
    if (typeof i === 'number' && typeof out === 'number') usage = { input_tokens: i, output_tokens: out };
    for (const v of Object.values(node)) visit(v, depth + 1);
  };
  for (const line of String(text || '').split('\n')) {
    const s = line.trim();
    if (!s.startsWith('{')) continue;
    let obj;
    try { obj = JSON.parse(s); } catch { continue; }
    visit(obj);
  }
  return { thread_id: threadId, usage };
}

// ── the tree, not the model's claim ────────────────────────────────────────
export function statusSnapshot(cwd) {
  const r = spawnSync('git', ['status', '--porcelain'], { cwd, encoding: 'utf8' });
  if (r.status !== 0) return new Map();
  const out = new Map();
  for (const line of (r.stdout || '').split('\n')) {
    if (!line.trim()) continue;
    let p = line.slice(3).trim();
    const arrow = p.indexOf(' -> ');
    if (arrow >= 0) p = p.slice(arrow + 4).trim();     // rename: keep the new path
    if (p.startsWith('"') && p.endsWith('"')) p = p.slice(1, -1);
    if (p) out.set(p, line.slice(0, 2));
  }
  return out;
}

// Compare porcelain statuses against the snapshot taken before the spawn.
// Accepted residue: a path already dirty that Codex edits again with the
// same status is not reported, even if its content changed.
// A path reverted to clean is also not reported: it is absent from after.
// With no snapshot supplied, retain whole-tree reporting behavior.
export function changedPaths(cwd, before = new Map()) {
  const after = statusSnapshot(cwd);
  return [...after.keys()].filter((p) => !before.has(p) || before.get(p) !== after.get(p)).sort();
}

// The §10 "High-impact files" row, turned into matchers. `*` is a segment
// wildcard here (the row is prose for humans, not an execpolicy pattern).
export function highImpactPatterns(cwd) {
  const f = path.join(cwd, 'docs/WORKFLOW.md');
  if (!existsSync(f)) return null;
  const row = readFileSync(f, 'utf8').split('\n').find((l) => /High-impact files/.test(l));
  if (!row) return null;
  const pats = [...row.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim()).filter(Boolean);
  return pats.length ? pats : null;
}

export function highImpactTouched(paths, patterns) {
  if (!patterns) return null;
  const res = patterns.map((p) => new RegExp(`(^|/)${p.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*')}$`));
  return paths.filter((p) => res.some((re) => re.test(p)));
}

// ── distillate assembly ────────────────────────────────────────────────────
const EMPTY = (o, status, summary, extra = {}) => ({
  status,
  summary,
  changed_paths: [],
  gates: [],
  deviations: [],
  next: [],
  blocked_reason: status === 'blocked' ? summary : null,
  runtime: { name: 'codex', model: o.model, effort: o.effort, thread_id: o.resume || null },
  usage: null,
  high_impact_touched: null,
  ...extra,
});

function writeOut(outPath, distillate) {
  mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(distillate, null, 2)}\n`);
}

const EXIT = { done: 0, failed: 1, blocked: 3 };

// ── main ───────────────────────────────────────────────────────────────────
export function main(argv = process.argv.slice(2)) {
  const o = parseArgs(argv);
  if (o.help) { console.log(USAGE); return 0; }
  if (o.error) { console.error(`run-codex: ${o.error}\n\n${USAGE}`); return 1; }
  if (!existsSync(o.cwd)) { console.error(`run-codex: --cwd "${o.cwd}" does not exist`); return 1; }

  const rf = roleFile(o.role, o.cwd);
  if (!rf) { console.error(`run-codex: no role prompt for "${o.role}"`); return 1; }
  const flags = deriveFlags({ role: o.role, tools: toolsOf(readFileSync(rf, 'utf8')) });

  let prompt;
  try { prompt = assemblePrompt(o); } catch (e) { console.error(`run-codex: ${e.message}`); return 1; }

  const tmp = mkdtempSync(path.join(tmpdir(), 'run-codex-'));
  const lastMessageFile = path.join(tmp, 'last-message.txt');
  const common = {
    flags, model: o.model, effort: o.effort, lastMessageFile, schemaPath: SCHEMA_PATH, prompt,
  };
  const args = o.resume
    ? buildResumeArgv({ ...common, threadId: o.resume })
    : buildExecArgv({ ...common, cwd: o.cwd });

  // Belt and braces: --ignore-rules would disable the project-layer guardrail
  // file, which is the entire parity mechanism. It is never built above; this
  // refuses to run if it ever appears.
  if (args.includes('--ignore-rules') || args.includes('--ephemeral')) {
    console.error('run-codex: refusing to run — --ignore-rules/--ephemeral must never be passed');
    return 1;
  }

  const before = statusSnapshot(o.cwd);
  const bin = resolveBin();
  const r = spawnSync(bin, args, {
    cwd: o.cwd, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const events = r.stdout || '';
  const stderr = r.stderr || '';
  if (stderr) process.stderr.write(stderr);
  try { writeFileSync(`${o.out}.events.jsonl`, events); } catch { /* best effort */ }

  if (r.error && r.error.code === 'ENOENT') {
    writeOut(o.out, EMPTY(o, 'blocked', `codex binary not found ("${bin}") — install the Codex CLI or set CODEX_BIN; no fallback to Claude.`));
    return EXIT.blocked;
  }
  if (/not logged in|unauthorized|authentication|401/i.test(stderr) && r.status !== 0) {
    writeOut(o.out, EMPTY(o, 'blocked', 'codex is not authenticated — run `codex login`; this needs the owner.'));
    return EXIT.blocked;
  }

  const { thread_id, usage } = parseEvents(events);
  const raw = existsSync(lastMessageFile) ? readFileSync(lastMessageFile, 'utf8') : '';
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));

  let parsed = null;
  try { parsed = JSON.parse(raw.trim()); } catch { parsed = null; }
  let errs = parsed === null ? ['not JSON'] : validate(parsed, schema);

  const paths = changedPaths(o.cwd, before);
  const hi = highImpactTouched(paths, highImpactPatterns(o.cwd));

  if (parsed === null || errs.length) {
    try { writeFileSync(`${o.out}.raw.txt`, raw); } catch { /* best effort */ }
    const d = EMPTY(o, 'failed', parsed === null
      ? 'distillate not valid JSON'
      : `distillate did not match the schema: ${errs.slice(0, 3).join('; ')}`);
    d.changed_paths = paths;
    d.high_impact_touched = hi;
    d.runtime.thread_id = thread_id || o.resume || null;
    d.usage = usage;
    d.gates = [{ name: 'distillate schema', result: 'red', first_error: parsed === null ? 'distillate not valid JSON' : errs[0] }];
    d.next = [`raw last message saved at ${o.out}.raw.txt; retry once with --note "return only the JSON distillate"`];
    writeOut(o.out, d);
    return EXIT.failed;
  }

  const d = { ...parsed };
  d.changed_paths = paths;                       // the tree wins
  d.high_impact_touched = hi;
  d.runtime = {
    name: 'codex',
    model: (d.runtime && d.runtime.model) || o.model,
    effort: (d.runtime && d.runtime.effort) || o.effort,
    thread_id: thread_id || (d.runtime && d.runtime.thread_id) || o.resume || null,
  };
  d.usage = usage || d.usage || null;
  writeOut(o.out, d);
  return EXIT[d.status] ?? EXIT.failed;
}

// realpath BOTH sides: this file is reached through $CLAUDE_PLUGIN_ROOT, which
// is commonly a symlink. A plain resolve() comparison would then be false and
// the tool would exit 0 having done nothing.
const isEntryPoint = () => {
  if (!process.argv[1]) return false;
  const self = fileURLToPath(import.meta.url);
  try { return realpathSync(process.argv[1]) === realpathSync(self); }
  catch { return path.resolve(process.argv[1]) === self; }
};
if (isEntryPoint()) process.exit(main());
