#!/usr/bin/env node
// Tier-1 deterministic lint for the agentic-workflow plugin.
// Zero dependencies; Node >= 18. Run: node tools/lint.mjs
// Exit 0 = clean, 1 = findings (printed as `file:line — message`).

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ROOT, 'plugins/agentic-workflow');
const WORKFLOW = path.join(PLUGIN, 'templates/WORKFLOW.md');

const KNOWN_TOOLS = new Set([
  'Read', 'Write', 'Edit', 'MultiEdit', 'Bash', 'Grep', 'Glob',
  'WebSearch', 'WebFetch', 'Task', 'TodoWrite', 'NotebookEdit',
  'AskUserQuestion', 'SlashCommand', 'KillShell', 'BashOutput', 'Skill',
  'Artifact',
]);
// Slash commands that are Claude Code built-ins, not shipped by this plugin.
const EXTERNAL_COMMANDS = new Set(['plugin', 'loop', 'clear']);

const findings = [];
const rel = (p) => path.relative(ROOT, p);
const fail = (file, line, msg) =>
  findings.push(`${rel(file)}${line ? `:${line}` : ''} — ${msg}`);
const lineOf = (text, idx) => text.slice(0, idx).split('\n').length;
const read = (p) => readFileSync(p, 'utf8');
const mdFiles = (dir) =>
  readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => path.join(dir, f));

// All markdown that participates in cross-reference checks.
const allMd = [
  path.join(ROOT, 'README.md'),
  path.join(PLUGIN, 'README.md'),
  path.join(PLUGIN, 'skills/protocol/SKILL.md'),
  ...mdFiles(path.join(PLUGIN, 'agents')),
  ...mdFiles(path.join(PLUGIN, 'commands')),
  ...mdFiles(path.join(PLUGIN, 'templates')),
];

// key: value frontmatter between the leading `---` fences (flat, no nesting).
function frontmatter(file) {
  const text = read(file);
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([A-Za-z-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return fm;
}
const toolList = (value) =>
  value.replace(/^\[|\]$/g, '').split(',').map((t) => t.trim()).filter(Boolean);

// ── 1. Manifests ─────────────────────────────────────────────────────────
function checkManifests() {
  const pluginJson = path.join(PLUGIN, '.claude-plugin/plugin.json');
  const marketJson = path.join(ROOT, '.claude-plugin/marketplace.json');
  for (const [file, required] of [
    [pluginJson, ['name', 'version', 'description']],
    [marketJson, ['name', 'plugins']],
  ]) {
    let data;
    try {
      data = JSON.parse(read(file));
    } catch (e) {
      fail(file, null, `invalid JSON: ${e.message}`);
      continue;
    }
    for (const key of required)
      if (!data[key]) fail(file, null, `missing required field "${key}"`);
    if (data.version && file === pluginJson && !/^\d+\.\d+\.\d+$/.test(data.version))
      fail(file, null, `version "${data.version}" is not semver (X.Y.Z)`);
    for (const p of data.plugins ?? []) {
      if (!p.name || !p.source) fail(file, null, 'marketplace plugin entry needs name + source');
      else if (!existsSync(path.join(ROOT, p.source)))
        fail(file, null, `plugin source "${p.source}" does not exist`);
    }
  }
}

// ── 2 + 3. Agent & command frontmatter ───────────────────────────────────
function checkAgents() {
  const seen = new Set();
  for (const file of mdFiles(path.join(PLUGIN, 'agents'))) {
    const fm = frontmatter(file);
    if (!fm) { fail(file, 1, 'missing frontmatter'); continue; }
    const stem = path.basename(file, '.md');
    if (fm.name !== stem) fail(file, 2, `frontmatter name "${fm.name}" ≠ filename "${stem}"`);
    if (seen.has(fm.name)) fail(file, 2, `duplicate agent name "${fm.name}"`);
    seen.add(fm.name);
    if (!fm.description) fail(file, 1, 'missing description');
    if (!fm.tools) fail(file, 1, 'missing tools');
    else for (const t of toolList(fm.tools))
      if (!KNOWN_TOOLS.has(t)) fail(file, 1, `unknown tool "${t}"`);
  }
}

function checkCommands() {
  for (const file of mdFiles(path.join(PLUGIN, 'commands'))) {
    const fm = frontmatter(file);
    if (!fm) { fail(file, 1, 'missing frontmatter'); continue; }
    if (!fm.description) fail(file, 1, 'missing description');
    if (fm['allowed-tools'])
      for (const t of toolList(fm['allowed-tools']))
        if (!KNOWN_TOOLS.has(t)) fail(file, 1, `unknown tool "${t}"`);
    // A command that instructs agent spawning must be allowed the Task tool —
    // otherwise headless runs (claude -p, evals, autopilot) are denied at the
    // permission layer. "it spawns" (describing another command) doesn't count.
    const text = read(file);
    const body = text.replace(/^---\n[\s\S]*?\n---/, (s) => ' '.repeat(s.length));
    const allowed = fm['allowed-tools'] ? toolList(fm['allowed-tools']) : [];
    const m = body.match(/(?<!\bit )\bspawn(?:s|ing|ed)?\b/i);
    if (m && !allowed.includes('Task'))
      fail(file, lineOf(text, m.index), 'instructs agent spawning but allowed-tools lacks "Task"');
    // Same class of bug for artifact publishing: a command that instructs
    // "via the Artifact tool" must be allowed to call it.
    const a = body.match(/\bArtifact tool\b/);
    if (a && !allowed.includes('Artifact'))
      fail(file, lineOf(text, a.index), 'instructs artifact publishing but allowed-tools lacks "Artifact"');
  }
}

// ── 4. Cross-references (dictionary-based, both directions) ──────────────
function checkCrossRefs() {
  const agents = new Set(mdFiles(path.join(PLUGIN, 'agents')).map((f) => path.basename(f, '.md')));
  const commands = new Set(mdFiles(path.join(PLUGIN, 'commands')).map((f) => path.basename(f, '.md')));

  // Forward: an agent-shaped mention (`x` agent / spawn `x`) must be a real agent;
  // a backticked /command must be a real command (or a known built-in), AND our
  // own commands must use the namespaced `/agentic-workflow:<cmd>` form — the
  // bare short form may not resolve (headless, or when another plugin/built-in
  // shadows the name). Matches args forms too (no closing backtick required).
  const agentMention = /(?:the )?`([a-z][a-z-]*)` agent\b|spawn(?:s|ed|ing)? (?:the )?`([a-z][a-z-]*)`/g;
  const commandMention = /`\/(agentic-workflow:)?([a-z][a-z-]*)(?=[`\s]|$)/g;
  for (const file of allMd) {
    const text = read(file);
    for (const m of text.matchAll(agentMention)) {
      const name = m[1] ?? m[2];
      if (!agents.has(name))
        fail(file, lineOf(text, m.index), `mentions unknown agent "${name}"`);
    }
    for (const m of text.matchAll(commandMention)) {
      const qualified = Boolean(m[1]);
      const name = m[2];
      if (!commands.has(name) && !EXTERNAL_COMMANDS.has(name))
        fail(file, lineOf(text, m.index), `mentions unknown command "/${name}"`);
      else if (commands.has(name) && !qualified)
        fail(file, lineOf(text, m.index), `bare short-form "/${name}" — use the namespaced "/agentic-workflow:${name}" (the short form may not resolve)`);
    }
  }

  // Reverse: every shipped agent/command is mentioned in both READMEs and WORKFLOW.md.
  for (const doc of [path.join(ROOT, 'README.md'), path.join(PLUGIN, 'README.md'), WORKFLOW]) {
    const text = read(doc);
    for (const a of agents)
      if (!new RegExp(`\\b${a}\\b`).test(text)) fail(doc, null, `never mentions agent "${a}"`);
    for (const c of commands)
      if (!text.includes(c)) fail(doc, null, `never mentions command "/${c}"`);
  }
}

// ── 5. Template references resolve ───────────────────────────────────────
function checkTemplateRefs() {
  const templateRef = /(?:\$\{CLAUDE_PLUGIN_ROOT\}\/)?templates\/([A-Za-z0-9._-]+\.[a-z]+)/g;
  for (const file of allMd) {
    const text = read(file);
    for (const m of text.matchAll(templateRef)) {
      if (!existsSync(path.join(PLUGIN, 'templates', m[1])))
        fail(file, lineOf(text, m.index), `references missing template "templates/${m[1]}"`);
    }
  }
}

// ── 6. WORKFLOW.md § integrity ───────────────────────────────────────────
function checkSections() {
  const text = read(WORKFLOW);
  const headings = new Set();
  let prev = -1;
  for (const m of text.matchAll(/^##+ (\d+(?:\.\d+)?)[.\s]/gm)) {
    headings.add(m[1]);
    if (!m[1].includes('.')) {
      const n = Number(m[1]);
      if (n <= prev)
        fail(WORKFLOW, lineOf(text, m.index), `top-level section ${n} out of order (after ${prev})`);
      prev = n;
    }
  }
  for (const file of allMd) {
    const body = read(file);
    for (const m of body.matchAll(/§(\d+(?:\.\d+)?)/g)) {
      if (!headings.has(m[1]))
        fail(file, lineOf(body, m.index), `§${m[1]} does not exist as a WORKFLOW.md heading`);
    }
  }
}

// ── 6.5 Frontmatter YAML safety ──────────────────────────────────────────
// The harness parses frontmatter as real YAML; the regex parser above does
// not. Two classes break strict parsers: an unquoted value containing ": "
// (parsed as a nested mapping) and a quoted value with content outside the
// quotes.
function checkFrontmatterYaml() {
  const files = [
    ...mdFiles(path.join(PLUGIN, 'agents')),
    ...mdFiles(path.join(PLUGIN, 'commands')),
    path.join(PLUGIN, 'skills/protocol/SKILL.md'),
  ];
  for (const file of files) {
    const m = read(file).match(/^---\n([\s\S]*?)\n---/);
    if (!m) continue;
    let line = 1;
    for (const raw of m[1].split('\n')) {
      line++;
      const kv = raw.match(/^([A-Za-z-]+):\s*(.*)$/);
      if (!kv) continue;
      const val = kv[2];
      if (/^["']/.test(val)) {
        const q = val[0];
        if (!(val.length > 1 && val.endsWith(q) && val.split(q).length === 3))
          fail(file, line, `frontmatter "${kv[1]}" has content outside its quotes (YAML error)`);
      } else if (val.includes(': ')) {
        fail(file, line, `frontmatter "${kv[1]}" contains unquoted ": " (YAML parses a nested mapping) — quote the value or reword`);
      }
    }
  }
}

// ── 7. hooks.json ────────────────────────────────────────────────────────
function checkHooks() {
  const file = path.join(PLUGIN, 'hooks/hooks.json');
  let data;
  try {
    data = JSON.parse(read(file));
  } catch (e) {
    return fail(file, null, `invalid JSON: ${e.message}`);
  }
  const commands = [];
  (function walk(node) {
    if (Array.isArray(node)) node.forEach(walk);
    else if (node && typeof node === 'object') {
      if (typeof node.command === 'string') commands.push(node.command);
      Object.values(node).forEach(walk);
    }
  })(data);
  for (const cmd of commands) {
    const res = spawnSync('bash', ['-n', '-c', cmd], { encoding: 'utf8' });
    if (res.status !== 0)
      fail(file, null, `hook command fails bash syntax check: ${res.stderr.trim().split('\n')[0]}`);
  }
}

// Reject suspiciously long single lines in tracked source — the signature of a
// minified/obfuscated payload. A 2026-07 supply-chain injection appended a
// ~6.7KB obfuscated loader to eval fixtures, hidden past a run of whitespace on
// an otherwise-normal line; this makes that class of attack fail tier-1 lint.
function checkObfuscation() {
  const MAX = 1000; // legit source in this repo stays well under 200 chars/line
  const exts = /\.(js|mjs|cjs|ts|jsx|tsx)$/;
  const tracked = spawnSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8' });
  if (tracked.status !== 0) return; // not a git working tree — skip
  for (const f of tracked.stdout.split('\0')) {
    if (!f || !exts.test(f)) continue;
    const abs = path.join(ROOT, f);
    if (!existsSync(abs)) continue;
    read(abs).split('\n').forEach((ln, i) => {
      if (ln.length > MAX)
        fail(abs, i + 1, `line is ${ln.length} chars — suspiciously long single line (possible minified/obfuscated code injection); split it, or raise MAX in checkObfuscation if genuinely intentional`);
    });
  }
}

// ── 8. Hook behavior (tier-1.5) ──────────────────────────────────────────
// The structural checks above prove hook commands *parse* (bash -n); they can't
// prove they *behave* — the 2026-07 beat-enforcer Stop-hook loop shipped green
// past a syntax check. Delegate to the dispatch harness, which pipes fixture
// stdin through each hook and asserts its exit code + emitted nudge, so the one
// `node tools/lint.mjs` gate CI runs also covers hook behavior.
function checkHookBehavior() {
  const runner = path.join(ROOT, 'tools/hook-test.mjs');
  if (!existsSync(runner)) return;
  const res = spawnSync('node', [runner], { encoding: 'utf8' });
  if (res.status !== 0) {
    const detail = `${res.stdout ?? ''}${res.stderr ?? ''}`
      .split('\n').filter((l) => /FAIL|failure|Error/.test(l)).join(' | ');
    fail(runner, null, `hook behavior test failed — run \`node tools/hook-test.mjs\`: ${detail || '(no detail)'}`);
  }
}

for (const check of [checkManifests, checkAgents, checkCommands, checkCrossRefs, checkTemplateRefs, checkSections, checkFrontmatterYaml, checkHooks, checkObfuscation, checkHookBehavior]) {
  check();
}

if (findings.length) {
  console.error(`lint: ${findings.length} finding(s)\n`);
  for (const f of findings) console.error('  ' + f);
  process.exit(1);
}
console.log('lint: clean');
