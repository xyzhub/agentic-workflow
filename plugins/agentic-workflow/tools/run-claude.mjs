#!/usr/bin/env node
// run-claude.mjs — run one workflow role as a child `claude -p` process (the
// `claude-p` runtime) and return the distillate the orchestrator reads. Zero
// deps; Node >= 18; needs `claude` on PATH (or CLAUDE_BIN) and `git` for the
// tree-derived fields.
//
//   node run-claude.mjs --role <role> --brief <plan.md#S3 | text>
//                       --cwd <dir> --out <distillate.json>
//                       [--preset <name>] [--model <id>] [--effort <level>]
//                       [--max-turns <n>] [--compact-window <tokens>]
//                       [--allowed-tools <list>] [--resume <session-id>]
//                       [--note "<corrective>"] [--help]
//
// Exit codes (the orchestrator branches on these, never on stdout):
//   0  done     the distillate says done
//   3  blocked  the distillate says blocked — including a budget stop
//               (`budget:` prefix: max turns / max budget reached), a bare
//               `Bash` in the allowlist, no claude binary, not logged in
//   1  failed   no usable result, the run errored, or the arguments were wrong
//
// Why a child process and not the Agent tool: a Haiku row must run inside its
// own 100K compaction window (CLAUDE_CODE_AUTO_COMPACT_WINDOW + --autocompact),
// and that knob is per process. The variable is set on the CHILD's env object
// only — the parent session's compaction setting is never touched.
//
// Isolation (locked, D4): CLAUDECODE / CLAUDE_CODE_ENTRYPOINT are stripped
// from the child env; AGENTIC_WORKFLOW_CHILD=1 silences the plugin's prompt
// hooks and beat-enforcers inside the child; --strict-mcp-config keeps the
// owner's MCP servers out; --permission-mode acceptEdits + --permission-prompts
// none + an explicit --tools/--allowedTools pair is the whole permission
// surface. This file must NEVER pass --bare (it skips .claude/agents/ and the
// subscription login) or bypassPermissions — main() refuses if either appears.

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, realpathSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PLUGIN_ROOT, SCHEMA_PATH, briefText, roleFile, stripFrontmatter, frontmatterValue, toolsOf, validate,
  statusSnapshot, changedPaths, highImpactPatterns, highImpactTouched,
} from './run-codex.mjs';

export const PRESETS_PATH = path.join(PLUGIN_ROOT, 'templates/tune-presets.json');
export const DEFAULTS = { compactWindow: 100000, maxTurns: 24, readBudget: 500, effort: 'low' };
const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
const ROLE_RE = /^[a-z][a-z0-9-]*$/;

const USAGE = `run-claude.mjs — run one workflow role as a child \`claude -p\` (runtime claude-p).

  node run-claude.mjs --role <role> --brief <plan.md#S3 | "text">
                      --cwd <dir> --out <distillate.json>
                      [--preset <name>] [--model <id>] [--effort <level>]
                      [--max-turns <n>] [--compact-window <tokens>]
                      [--allowed-tools "<A,B,Bash(git log:*)>"]
                      [--resume <session-id>] [--note "<corrective text>"]

  --role     a role in the plugin's agents/. A \`.claude/agents/<role>.md\`
             shadow in --cwd (tune or preset) wins. Its body becomes the
             child's --system-prompt-file (not --agent — see below).
  --brief    \`<file>#<anchor>\` pulls that heading's section out of the plan
             file (relative to --cwd). A value that is not an existing file is
             used as the brief text itself.
  --cwd      the working directory of the run; \`changed_paths\` is the git
             delta vs a snapshot taken before the spawn.
  --out      where the distillate JSON is written. This is the interface. The
             child's stream-json events are saved beside it (.events.jsonl).
  --preset   read model, effort, maxTurns, compact_window, allowed_tools and
             read_budget from templates/tune-presets.json for --role. Explicit
             flags win over the preset row.
  --model    default: the role file's \`model:\` (tier aliases mapped).
  --effort   default: the role file's \`effort:\`, else low.
  --max-turns       default 24 — the in-flight stop; overflow → blocked budget:.
  --compact-window  default 100000 — set as CLAUDE_CODE_AUTO_COMPACT_WINDOW on
                    the child env AND passed as --autocompact.
  --allowed-tools   comma list; default the role's \`tools:\`. A bare \`Bash\`
                    is refused (exit 3): scope it, e.g. \`Bash(git log:*)\`.
  --resume   continue a child session (the distillate's runtime.thread_id).
  --note     corrective text appended last, for a retry.

Environment:
  CLAUDE_BIN  absolute path to the claude binary. Overrides PATH — this is what
              lets the test harness point at a shim. Unset: \`claude\` on PATH.

Exit: 0 done · 3 blocked (incl. budget:, bare Bash, missing/unauthenticated binary) · 1 failed.`;

// ── argv ───────────────────────────────────────────────────────────────────
export function parseArgs(argv) {
  const known = new Map([
    ['--role', 'role'], ['--brief', 'brief'], ['--cwd', 'cwd'], ['--out', 'out'],
    ['--preset', 'preset'], ['--model', 'model'], ['--effort', 'effort'],
    ['--max-turns', 'maxTurns'], ['--compact-window', 'compactWindow'],
    ['--allowed-tools', 'allowedTools'], ['--resume', 'resume'], ['--note', 'note'],
  ]);
  const o = { help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { o.help = true; continue; }
    if (!known.has(a)) return { error: `unknown argument "${a}"` };
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) return { error: `${a} needs a value` };
    o[known.get(a)] = v;
    i++;
  }
  if (o.help) return o;
  for (const req of ['role', 'brief', 'cwd', 'out']) {
    if (!o[req]) return { error: `--${req} is required` };
  }
  if (!ROLE_RE.test(o.role)) return { error: `--role "${o.role}" is not a role name` };
  if (o.effort && !EFFORTS.includes(o.effort)) return { error: `--effort must be one of ${EFFORTS.join(', ')}` };
  for (const k of ['maxTurns', 'compactWindow']) {
    if (o[k] !== undefined && !/^[0-9]+$/.test(o[k])) return { error: `--${k === 'maxTurns' ? 'max-turns' : 'compact-window'} must be an integer` };
  }
  return o;
}

// Split a tool list on commas AND whitespace outside parentheses — claude
// reads --allowedTools as "comma or space-separated", so `Read Bash` is two
// rules (one of them bare), never one.
export function splitTools(list) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of String(list)) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if ((ch === ',' || /\s/.test(ch)) && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  out.push(cur);
  return out.map((t) => t.trim()).filter(Boolean);
}

// An unscoped Bash rule lets the child run anything (commit, push on a feature
// branch). Refused, never narrowed silently. Semantic, not a string match: any
// Bash rule whose command part is empty, or whose FIRST token is a glob
// (`Bash(*)`, `Bash(:*)`, `Bash(* *)`, `Bash(*:*)`, `Bash(?x *)`), matches
// every command and is as bare as `Bash`. A scoped rule names its command
// literally first: `Bash(git log:*)`. Case-insensitive on the tool name.
export function isBareBash(t) {
  const m = String(t).trim().match(/^bash\s*(?:\(([\s\S]*)\))?$/i);
  if (!m) return false;
  const cmd = (m[1] ?? '').trim();
  if (!cmd) return true;
  const first = cmd.split(/[\s:]+/)[0];
  return first === '' || /[*?[\]{}]/.test(first);
}

// ── resolution: flags > preset row > role file > defaults ─────────────────
export function presetRow(name, role, presetsPath = PRESETS_PATH) {
  const j = JSON.parse(readFileSync(presetsPath, 'utf8'));
  const p = j.presets && j.presets[name];
  if (!p) return { error: `unknown preset "${name}" (have: ${Object.keys(j.presets || {}).join(', ')})` };
  const row = p.agents && p.agents[role];
  if (!row) return { error: `preset "${name}" has no row for "${role}"` };
  return { row, aliases: j.tier_aliases || {} };
}

export function resolveRun(o, roleText, presetsPath = PRESETS_PATH) {
  let row = {};
  let aliases = {};
  try { aliases = JSON.parse(readFileSync(presetsPath, 'utf8')).tier_aliases || {}; } catch { /* no aliases */ }
  if (o.preset) {
    const r = presetRow(o.preset, o.role, presetsPath);
    if (r.error) return { error: r.error };
    row = r.row;
  }
  const fm = (k) => frontmatterValue(roleText, k);
  let model = o.model || row.model || fm('model');
  if (model && aliases[model] && /^claude-/.test(aliases[model])) model = aliases[model];
  if (!model || model === 'inherit') return { error: `no model for "${o.role}" — pass --model or --preset` };
  const effort = o.effort || row.effort || fm('effort') || DEFAULTS.effort;
  if (!EFFORTS.includes(effort)) return { error: `effort "${effort}" is not one of ${EFFORTS.join(', ')}` };
  const maxTurns = Number(o.maxTurns || row.maxTurns || fm('maxTurns') || DEFAULTS.maxTurns);
  const compactWindow = Number(o.compactWindow || row.compact_window || DEFAULTS.compactWindow);
  if (compactWindow < 100000 || compactWindow > 1000000) return { error: `compact window ${compactWindow} outside 100000–1000000 (claude --autocompact range)` };
  const readBudget = Number(row.read_budget || DEFAULTS.readBudget);
  const allowed = o.allowedTools ? splitTools(o.allowedTools)
    : Array.isArray(row.allowed_tools) ? row.allowed_tools.map(String)
      : toolsOf(roleText);
  return { model, effort, maxTurns, compactWindow, readBudget, allowed };
}

// --tools takes base names (the tools that EXIST in the child); --allowedTools
// keeps the scoped rules (what runs without a prompt). Both derive from one list.
export const baseTools = (allowed) => [...new Set(allowed.map((t) => t.replace(/\(.*$/, '').trim()))];

// Transport (memos §D4 fallback, applied at AC-9 2026-10-11): NOT `--agent`.
// On claude 2.1.296 a `-p --agent <role>` session takes the agent file's
// `tools:` as its whole tool set — it overrides --tools AND drops the
// StructuredOutput tool --json-schema needs, so no distillate comes back.
// The role body (roleFile(): project shadow wins, else the plugin's agent) is
// passed as --system-prompt-file; --tools/--model carry what --agent did.

// ── prompt ─────────────────────────────────────────────────────────────────
export const CONTRACT = `Your result is captured as structured output that must validate against the
distillate schema (status, summary, changed_paths, gates, deviations, next,
blocked_reason, runtime, usage, high_impact_touched — null, never omitted, for
what you have nothing for; the adapter overwrites changed_paths, runtime,
usage and high_impact_touched from the tree and the event stream).

Standing rules for a delegated run, no exceptions:
- Never edit anything under .plans/ unless the brief names the file.
- Never commit. Never push. Never merge. Never open or merge a pull request.
  The orchestrator commits from your distillate.
- Report each gate you ran in \`gates\` with its real verdict; one you did not
  run is "skipped", never "green".
- Anything that needs an owner's decision → status "blocked", blocked_reason
  naming it. A command refused by permissions is not worked around: end
  "blocked" naming the command.`;

export function buildPrompt(o, r) {
  const blocks = [
    `# Your brief\n\n${briefText(o.brief, o.cwd)}`,
    `# Budget\n\nRead budget: ${r.readBudget} lines in total — ranged reads (offset/limit) for any file longer than that. Turn cap: ${r.maxTurns} turns; at the cap the run stops and returns blocked \`budget:\`, so plan to finish well inside it.`,
    `# Return contract\n\n${CONTRACT}`,
  ];
  if (o.note) blocks.push(`# Correction from the orchestrator (this overrides the brief where they conflict)\n\n${o.note}`);
  return blocks.join('\n\n---\n\n');
}

// ── argv + env ─────────────────────────────────────────────────────────────
export function buildArgv({ systemPromptFile, r, schemaText, prompt, resume = null }) {
  const a = ['-p'];
  if (resume) a.push('--resume', resume);
  a.push(
    '--system-prompt-file', systemPromptFile,
    '--model', r.model,
    '--max-turns', String(r.maxTurns),
    '--autocompact', String(r.compactWindow),
    '--effort', r.effort,
    '--permission-mode', 'acceptEdits',
    '--permission-prompts', 'none',
    '--tools', baseTools(r.allowed).join(','),
    '--allowedTools', r.allowed.join(','),
    '--strict-mcp-config',
    '--output-format', 'stream-json',
    '--verbose',
    '--json-schema', schemaText,
    prompt,
  );
  return a;
}

// A copy of the parent env: never a mutation of process.env.
export function childEnv(parent, compactWindow) {
  const env = { ...parent };
  delete env.CLAUDECODE;
  delete env.CLAUDE_CODE_ENTRYPOINT;
  env.CLAUDE_CODE_AUTO_COMPACT_WINDOW = String(compactWindow);
  env.AGENTIC_WORKFLOW_CHILD = '1';
  return env;
}

export const FORBIDDEN = ['--bare', 'bypassPermissions', '--dangerously-skip-permissions', '--allow-dangerously-skip-permissions'];

export const resolveBin = (env = process.env) => env.CLAUDE_BIN || 'claude';

// Git-ignored entries (`!!` lines; ignored directories stay collapsed, so this
// is cheap). changed_paths cannot see an ignored write, so a NEW ignored entry
// is reported as a deviation for a human to read. Accepted residue: a write
// inside an already-ignored directory is not seen. Writes outside --cwd are not
// in the tree at all — acceptEdits auto-approves edits only inside the working
// directory, and --permission-prompts none denies the rest.
export function ignoredSnapshot(cwd) {
  const r = spawnSync('git', ['status', '--porcelain', '--ignored'], { cwd, encoding: 'utf8' });
  if (r.status !== 0) return new Set();
  return new Set((r.stdout || '').split('\n').filter((l) => l.startsWith('!! ')).map((l) => l.slice(3).trim()));
}

// ── stream-json mining (tolerant: bad lines skipped, never a throw) ────────
export function parseStream(text) {
  const s = { init: null, result: null, firstPrompt: null, peakPrompt: 0, compacted: false };
  for (const line of String(text || '').split('\n')) {
    const t = line.trim();
    if (!t.startsWith('{')) continue;
    let e;
    try { e = JSON.parse(t); } catch { continue; }
    if (e.type === 'system' && e.subtype === 'init') s.init = e;
    if (e.type === 'system' && e.subtype === 'compact_boundary') s.compacted = true;
    if (e.type === 'assistant' && e.message && e.message.usage) {
      const u = e.message.usage;
      const p = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
      if (s.firstPrompt === null) s.firstPrompt = p;
      if (p > s.peakPrompt) s.peakPrompt = p;
    }
    if (e.type === 'result') s.result = e;
  }
  return s;
}

// ── distillate assembly ────────────────────────────────────────────────────
const EXIT = { done: 0, failed: 1, blocked: 3 };

const runtimeOf = (r, model, threadId) => ({ name: 'claude-p', model, effort: r ? r.effort : '', thread_id: threadId || null });

const EMPTY = (o, r, status, summary, extra = {}) => ({
  status,
  summary,
  changed_paths: [],
  gates: [],
  deviations: [],
  next: [],
  blocked_reason: status === 'blocked' ? summary : null,
  runtime: runtimeOf(r, (r && r.model) || o.model || '', o.resume),
  usage: null,
  high_impact_touched: null,
  ...extra,
});

function writeOut(outPath, d) {
  mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(d, null, 2)}\n`);
}

const usageOf = (u) => (u && typeof u.output_tokens === 'number'
  ? { input_tokens: (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0), output_tokens: u.output_tokens }
  : null);

// ── main ───────────────────────────────────────────────────────────────────
export function main(argv = process.argv.slice(2), env = process.env) {
  const o = parseArgs(argv);
  if (o.help) { console.log(USAGE); return 0; }
  if (o.error) { console.error(`run-claude: ${o.error}\n\n${USAGE}`); return 1; }
  if (!existsSync(o.cwd)) { console.error(`run-claude: --cwd "${o.cwd}" does not exist`); return 1; }
  const rf = roleFile(o.role, o.cwd);
  if (!rf) { console.error(`run-claude: no role prompt for "${o.role}"`); return 1; }
  const r = resolveRun(o, readFileSync(rf, 'utf8'));
  if (r.error) { console.error(`run-claude: ${r.error}`); return 1; }

  const parentWindow = env.CLAUDE_CODE_AUTO_COMPACT_WINDOW;
  const parentNote = `parent CLAUDE_CODE_AUTO_COMPACT_WINDOW=${parentWindow === undefined ? 'unset' : parentWindow}`;

  const bare = r.allowed.filter(isBareBash);
  if (bare.length) {
    writeOut(o.out, EMPTY(o, r, 'blocked', `allowlist carries bare "${bare[0]}" — scope it (e.g. Bash(git log:*)); refusing to spawn an unscoped shell`));
    return EXIT.blocked;
  }

  const prompt = buildPrompt(o, r);
  const schemaText = JSON.stringify(JSON.parse(readFileSync(SCHEMA_PATH, 'utf8')));
  const tmp = mkdtempSync(path.join(tmpdir(), 'run-claude-'));
  const systemPromptFile = path.join(tmp, `${o.role}.md`);
  writeFileSync(systemPromptFile, stripFrontmatter(readFileSync(rf, 'utf8')));
  const args = buildArgv({ systemPromptFile, r, schemaText, prompt, resume: o.resume || null });
  if (args.some((a) => FORBIDDEN.includes(a))) {
    console.error(`run-claude: refusing to run — ${FORBIDDEN.join(' / ')} must never be passed`);
    return 1;
  }
  const cenv = childEnv(env, r.compactWindow);

  mkdirSync(path.dirname(path.resolve(o.out)), { recursive: true });
  const before = statusSnapshot(o.cwd);
  const ignoredBefore = ignoredSnapshot(o.cwd);
  const bin = resolveBin(env);
  const res = spawnSync(bin, args, {
    cwd: o.cwd, env: cenv, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'],
  });
  rmSync(tmp, { recursive: true, force: true });
  const events = res.stdout || '';
  const stderr = res.stderr || '';
  if (stderr) process.stderr.write(stderr);
  // The first line is the adapter's own record: the argv the child saw and the
  // two env keys it set — the AC-9 witness. The prompt and schema are elided;
  // no other env value is ever written (secrets stay out of the file).
  const record = {
    type: 'adapter',
    bin,
    role_file: rf,
    argv: args.slice(0, -1).map((a) => (a === schemaText ? '<distillate.schema.json>' : a)).concat('<prompt>'),
    child_env: { CLAUDE_CODE_AUTO_COMPACT_WINDOW: cenv.CLAUDE_CODE_AUTO_COMPACT_WINDOW, AGENTIC_WORKFLOW_CHILD: cenv.AGENTIC_WORKFLOW_CHILD, CLAUDECODE: cenv.CLAUDECODE ?? null, CLAUDE_CODE_ENTRYPOINT: cenv.CLAUDE_CODE_ENTRYPOINT ?? null },
    parent_window: parentWindow ?? null,
    exit: res.status,
  };
  try { writeFileSync(`${o.out}.events.jsonl`, `${JSON.stringify(record)}\n${events}`); } catch { /* best effort */ }

  if (res.error && res.error.code === 'ENOENT') {
    writeOut(o.out, EMPTY(o, r, 'blocked', `claude binary not found ("${bin}") — install Claude Code or set CLAUDE_BIN; the orchestrator re-routes to the row's fallback.`));
    return EXIT.blocked;
  }
  const s = parseStream(events);
  const resultText = s.result && typeof s.result.result === 'string' ? s.result.result : '';
  if ((!s.result || s.result.subtype !== 'success') && /not logged in|please run \/login|invalid api key/i.test(`${stderr}\n${resultText}`)) {
    writeOut(o.out, EMPTY(o, r, 'blocked', 'claude is not logged in — run `claude` and /login; this needs the owner.'));
    return EXIT.blocked;
  }

  const paths = changedPaths(o.cwd, before);
  const hi = highImpactTouched(paths, highImpactPatterns(o.cwd));
  const modelUsed = (s.result && s.result.modelUsage && Object.keys(s.result.modelUsage)[0]) || r.model;
  const threadId = (s.result && s.result.session_id) || (s.init && s.init.session_id) || o.resume || null;
  const evidence = [...ignoredSnapshot(o.cwd)].filter((p) => !ignoredBefore.has(p))
    .map((p) => `warning: the run wrote git-ignored ${p} — not in changed_paths; review it by hand`);
  if (s.peakPrompt) evidence.push(`peak context ≈ ${s.peakPrompt} tokens (first request ${s.firstPrompt}); window ${r.compactWindow}`);
  if (s.compacted) evidence.push(`budget: compaction fired at ${r.compactWindow}`);
  const denials = (s.result && Array.isArray(s.result.permission_denials)) ? s.result.permission_denials : [];
  if (denials.length) evidence.push(`permission denials: ${denials.map((d) => d.tool_name || '?').join(', ')}`);
  const finish = (d) => {
    d.changed_paths = paths;                       // the tree wins
    d.high_impact_touched = hi;
    d.deviations = [...(Array.isArray(d.deviations) ? d.deviations : []), ...evidence];
    d.next = [...(Array.isArray(d.next) ? d.next : []), parentNote];
    d.runtime = runtimeOf(r, modelUsed, threadId);
    d.usage = usageOf(s.result && s.result.usage) || d.usage || null;
    writeOut(o.out, d);
    return EXIT[d.status] ?? EXIT.failed;
  };

  if (!s.result) {
    return finish(EMPTY(o, r, 'failed', `claude exited ${res.status} with no result line — see ${o.out}.events.jsonl`));
  }
  const sub = s.result.subtype;
  if (sub === 'error_max_turns' || sub === 'error_max_budget_usd') {
    const why = sub === 'error_max_turns'
      ? `budget: maxTurns ${r.maxTurns} reached after ${s.result.num_turns ?? '?'} turns`
      : 'budget: max budget reached';
    return finish(EMPTY(o, r, 'blocked', why));
  }
  if (sub !== 'success') {
    return finish(EMPTY(o, r, 'failed', `claude run ended ${sub || 'without a subtype'}`));
  }

  let parsed = s.result.structured_output ?? null;
  if (parsed === null) { try { parsed = JSON.parse(resultText.trim()); } catch { parsed = null; } }
  const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
  const errs = parsed === null || typeof parsed !== 'object' ? ['not JSON'] : validate(parsed, schema);
  if (errs.length) {
    try { writeFileSync(`${o.out}.raw.txt`, resultText); } catch { /* best effort */ }
    const d = EMPTY(o, r, 'failed', `distillate did not match the schema: ${errs.slice(0, 3).join('; ')}`);
    d.gates = [{ name: 'distillate schema', result: 'red', first_error: errs[0] }];
    return finish(d);
  }
  return finish({ ...parsed });
}

// realpath BOTH sides: reached through $CLAUDE_PLUGIN_ROOT, commonly a symlink.
const isEntryPoint = () => {
  if (!process.argv[1]) return false;
  const self = fileURLToPath(import.meta.url);
  try { return realpathSync(process.argv[1]) === realpathSync(self); }
  catch { return path.resolve(process.argv[1]) === self; }
};
if (isEntryPoint()) process.exit(main());
