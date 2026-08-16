#!/usr/bin/env node
// Tier-1 deterministic lint for the agentic-workflow plugin.
// Zero dependencies; Node >= 18. Run: node tools/lint.mjs
// Exit 0 = clean, 1 = findings (printed as `file:line — message`).

import { readFileSync, readdirSync, existsSync, realpathSync } from 'node:fs';
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

// ── 6.6 Template frontmatter (SD2) ───────────────────────────────────────
// Every templates/*.md carries {status, owner-agent, refresh-trigger}. Two are
// exempt (OQ1): WORKFLOW.md (protocol master) and overview.html (HTML, skipped
// by the .md filter). Validate presence + enum membership, owner-agent against
// the agents set, and the fail-closed rule `frozen ⇒ refresh-trigger: never`.
function checkTemplateFrontmatter() {
  const STATUS = new Set(['living', 'semi-static', 'frozen']);
  const TRIGGER = new Set(['every-ship', 'stage-transition', 'release', 'event', 'never']);
  const agents = new Set(mdFiles(path.join(PLUGIN, 'agents')).map((f) => path.basename(f, '.md')));
  for (const file of mdFiles(path.join(PLUGIN, 'templates'))) {
    if (path.basename(file) === 'WORKFLOW.md') continue; // OQ1 exemption
    const fm = frontmatter(file);
    if (!fm) { fail(file, 1, 'missing template frontmatter (status/owner-agent/refresh-trigger)'); continue; }
    if (!fm.status) fail(file, 1, 'missing frontmatter "status"');
    else if (!STATUS.has(fm.status)) fail(file, 1, `status "${fm.status}" not in {living, semi-static, frozen}`);
    if (!fm['owner-agent']) fail(file, 1, 'missing frontmatter "owner-agent"');
    else if (!agents.has(fm['owner-agent'])) fail(file, 1, `owner-agent "${fm['owner-agent']}" is not a real agent stem`);
    if (!fm['refresh-trigger']) fail(file, 1, 'missing frontmatter "refresh-trigger"');
    else if (!TRIGGER.has(fm['refresh-trigger'])) fail(file, 1, `refresh-trigger "${fm['refresh-trigger']}" not in {every-ship, stage-transition, release, event, never}`);
    if (fm.status === 'frozen' && fm['refresh-trigger'] && fm['refresh-trigger'] !== 'never')
      fail(file, 1, `frozen template must have refresh-trigger: never (has "${fm['refresh-trigger']}")`);
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
  // Hook bodies extracted into hooks/lib/*.sh (invoked via ${CLAUDE_PLUGIN_ROOT})
  // aren't inside a `command` string, so syntax-check them directly too.
  const libDir = path.join(PLUGIN, 'hooks/lib');
  if (existsSync(libDir)) {
    for (const f of readdirSync(libDir)) {
      if (!f.endsWith('.sh')) continue;
      const abs = path.join(libDir, f);
      const res = spawnSync('bash', ['-n', abs], { encoding: 'utf8' });
      if (res.status !== 0)
        fail(abs, null, `hook script fails bash syntax check: ${res.stderr.trim().split('\n')[0]}`);
    }
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
  if (!existsSync(runner)) {
    fail(runner, null, 'hook behavior harness missing — tools/hook-test.mjs must exist so the gate covers hook behavior (do not silently drop the check)');
    return;
  }
  const res = spawnSync('node', [runner], { encoding: 'utf8' });
  if (res.status !== 0) {
    const detail = `${res.stdout ?? ''}${res.stderr ?? ''}`
      .split('\n').filter((l) => /FAIL|failure|Error/.test(l)).join(' | ');
    fail(runner, null, `hook behavior test failed — run \`node tools/hook-test.mjs\`: ${detail || '(no detail)'}`);
  }
}

// ── 8.5 Clock-guard behavior (tier-1.5) ──────────────────────────────────
// The structural checks prove a row PARSES; they cannot prove the L3 clock
// guard DECIDES correctly. It shipped three times as another `^`-anchored
// branch, each verified only against cases its author had in mind, and a
// five-lens review measured the result at 25/44 wrong on a corpus drawn from
// outside the implementer's head. Delegate to the case harness, fail-closed on
// a missing one — the same shape as checkHookBehavior.
function checkClockGuard() {
  const runner = path.join(ROOT, 'tools/lint-test.mjs');
  if (!existsSync(runner)) {
    fail(runner, null, 'clock-guard case harness missing — tools/lint-test.mjs must exist so the gate covers the L3 guard\'s verdicts, not just row syntax (do not silently drop the check)');
    return;
  }
  const res = spawnSync('node', [runner], { encoding: 'utf8' });
  if (res.status !== 0)
    fail(runner, null, `clock-guard cases failed — run \`node tools/lint-test.mjs\`: ${`${res.stdout ?? ''}${res.stderr ?? ''}`.split('\n').filter((l) => /FAIL|wrong/.test(l)).join(' | ') || '(no detail)'}`);
}

// ── 9. Marker-only mutation (tier-1.5, Phase-3 [STRICT]) ─────────────────
// The chronicler auto-writes the sales kit's `data:*` regions every ship. Lint
// proves those templates parse; it can't prove an auto-write STAYS inside the
// markers, appends rather than rewrites, and never authors a claim. Delegate to
// the fixture harness, which applies a simulated chronicler update and asserts
// the three invariants (chronicler.md Artifact 4). Fail-closed: a MISSING harness
// fails the gate (never a silent skip) — this is the guard the STRICT checkpoint
// hinges on.
function checkMarkerMutation() {
  const runner = path.join(ROOT, 'tools/marker-test.mjs');
  if (!existsSync(runner)) {
    fail(runner, null, 'marker-mutation harness missing — tools/marker-test.mjs must exist so the gate proves the chronicler auto-write stays marker-only, append-only, and claim-free (do not silently drop the check)');
    return;
  }
  const res = spawnSync('node', [runner], { encoding: 'utf8' });
  if (res.status !== 0) {
    const detail = `${res.stdout ?? ''}${res.stderr ?? ''}`
      .split('\n').filter((l) => /FAIL|failure|Error/.test(l)).join(' | ');
    fail(runner, null, `marker-mutation test failed — run \`node tools/marker-test.mjs\`: ${detail || '(no detail)'}`);
  }
}

// ── 10. Context-attribution instrument (tier-1.5, context-economy Phase 0) ──
// tools/context-attrib.mjs measures where a session's context goes, and the
// mission's decisions (the write firewall, D7's reviewer test) are argued from
// its numbers — so a silently-broken instrument would ship a false split. Lint
// can't check it against a transcript (CI has none, and they are 3-12 MB), so it
// delegates to the script's own synthetic-fixture selftest, which asserts the
// four measured landmines: usage deduped by requestId, categories + residual
// summing exactly, a DERIVED chars/token ratio (never `/4`), and attachments
// sized on the injected field. Fail-closed: a MISSING instrument fails the gate.
function checkContextAttrib() {
  const runner = path.join(ROOT, 'tools/context-attrib.mjs');
  if (!existsSync(runner)) {
    fail(runner, null, 'context-attribution harness missing — tools/context-attrib.mjs must exist so the gate proves the measurement instrument dedups usage, balances its residual, derives its chars/token ratio, and sizes attachments on the injected field (do not silently drop the check)');
    return;
  }
  // --selftest only: it builds its own throwaway fixture and must never need a
  // real transcript (CI has none).
  const res = spawnSync('node', [runner, '--selftest'], { encoding: 'utf8' });
  if (res.status !== 0) {
    const detail = `${res.stdout ?? ''}${res.stderr ?? ''}`
      .split('\n').filter((l) => /FAIL|failure|Error/.test(l)).join(' | ');
    fail(runner, null, `context-attribution selftest failed — run \`node tools/context-attrib.mjs --selftest\`: ${detail || '(no detail)'}`);
  }
}

// ── Mission-ledger helpers (checks 11 + 12) ─────────────────────────────────
// Both ledger checks read `.plans/*.state.md` — deployed ledgers, not templates.
// A repo with no `.plans/` (a fresh consumer) simply has nothing to check.
const stateLedgers = () => {
  const dir = path.join(ROOT, '.plans');
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.state.md')).map((f) => path.join(dir, f));
};
// Lines of the `## <name>` section, with their 1-based line numbers. Ends at the
// next `## ` heading (or EOF). Returns null when the section is absent.
function sectionLines(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (start === -1) return null;
  const out = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) break;
    out.push({ n: i + 1, text: lines[i] });
  }
  return out;
}

// ── 11. Standing steers grammar (context-economy Phase 2) ───────────────────
// The ledger preserves decisions but loses taste, so `## Standing steers` holds
// the human's own words. Its whole value is that the words are VERBATIM and
// attributable — a paraphrase or an unattributed line is indistinguishable from
// an agent's own inference, which is the failure this block exists to prevent.
// So: mandatory grammar `- YYYY-MM-DD (ckpt <id>) — "<exact words>"`, and the
// <id> must name a checkpoint that actually exists in the file's `## Checklist`.
// OQ4: only ledgers that ALREADY carry the block are validated (legacy ledgers
// have none and must keep passing); the block itself is required only of the
// template, so every new mission inherits it.
function checkStandingSteers() {
  const HEADING = 'Standing steers';
  const GRAMMAR = /^- (?:~~)?(\d{4}-\d{2}-\d{2}) \(ckpt ([A-Za-z0-9][A-Za-z0-9.-]*)\) — "[^"]+"(?:~~)?$/;

  const tpl = path.join(PLUGIN, 'templates/mission-state.md');
  const tplText = read(tpl);
  if (!sectionLines(tplText, HEADING))
    fail(tpl, 1, `missing "## ${HEADING}" section — every mission ledger must inherit the standing-steers block (verbatim human steers, captured at checkpoints only)`);

  for (const file of stateLedgers()) {
    const text = read(file);
    const block = sectionLines(text, HEADING);
    if (!block) continue; // OQ4: legacy ledgers without the block are exempt
    const checklist = sectionLines(text, 'Checklist') ?? [];
    const checklistText = checklist.map((l) => l.text).join('\n');
    const ckptIds = new Set();
    for (const m of checklistText.matchAll(/\bckpt-([A-Za-z0-9][A-Za-z0-9.-]*)/g)) {
      ckptIds.add(m[1].toLowerCase());
      ckptIds.add(`ckpt-${m[1].toLowerCase()}`);
    }
    // Fold wrapped continuation lines into their bullet so a long verbatim quote
    // may wrap; report against the bullet's own first line.
    const bullets = [];
    for (const { n, text: line } of block) {
      if (/^- /.test(line)) bullets.push({ n, text: line });
      else if (bullets.length && /^\s+\S/.test(line) && !/^\s*$/.test(line))
        bullets[bullets.length - 1].text += ' ' + line.trim();
    }
    for (const b of bullets) {
      const m = b.text.match(GRAMMAR);
      if (!m) {
        fail(file, b.n, `standing steer does not match the mandatory grammar \`- YYYY-MM-DD (ckpt <id>) — "<exact words>"\` (verbatim, straight double quotes, em dash; retire by ~~strikethrough~~, never delete) — got: ${b.text.slice(0, 72)}`);
        continue;
      }
      const id = m[2].toLowerCase();
      if (ckptIds.size && !ckptIds.has(id) && !ckptIds.has(`ckpt-${id}`) && !new RegExp(`\\b${id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(checklistText))
        fail(file, b.n, `standing steer cites checkpoint "${id}", which is not in this ledger's \`## Checklist\` — a steer must be attributable to a real checkpoint`);
    }
  }
}

// ── 12. `Next up:` two-site agreement (context-economy Phase 2) ─────────────
// A ledger states "what to do next" in two places — a header note and a trailing
// block — and nothing used to enforce that they agree. This file drifted three
// times during the context-economy mission, caught every time by a human, never
// by a gate. Since the ledger's whole claim is "a fresh agent resumes from this
// file alone", a stale site sends a cold session to re-run committed work.
// Comparison rule: reduce each site to a BEAT KEY — the first session/checkpoint
// id in it (`S5`, `S0.5-1`, `ckpt-p2`), else the first non-stop word — and require
// every site to agree. Prose after the id is free to differ; exact string
// equality across two prose blocks would be pure noise. One site (or none) is
// fine — this checks disagreement, not the presence of two sites.
function checkNextUpAgreement() {
  const STOP = new Set(['the', 'a', 'an', 'then', 'next', 'is', 'now']);
  const beatKey = (raw) => {
    const plain = raw.replace(/[`*_~\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
    const id = plain.match(/\b(?:ckpt[-\s]?[A-Za-z0-9][A-Za-z0-9.-]*|S\d+(?:\.\d+)?[A-Za-z]*(?:-fix)?)\b/);
    if (id) return id[0].toLowerCase().replace(/^ckpt[-\s]?/, 'ckpt-').replace(/[.,;:]+$/, '');
    for (const w of plain.split(' ')) {
      const word = w.toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (word && !STOP.has(word)) return word;
    }
    return '';
  };

  for (const file of stateLedgers()) {
    const lines = read(file).split('\n');
    const sites = [];
    lines.forEach((line, i) => {
      // Split on backticks: even segments are outside inline code, so prose
      // *about* `Next up:` (always backticked in house style) is not a site.
      let offset = 0;
      line.split('`').forEach((seg, s) => {
        const at = s % 2 === 0 ? seg.indexOf('Next up:') : -1;
        if (at !== -1) {
          // Continuation: the rest of the paragraph (up to 2 more lines, stopping
          // at a blank line) — a wrapped `Next up:` states its beat on line 2.
          const cont = [];
          for (let j = i + 1; j < lines.length && cont.length < 2; j++) {
            if (!lines[j].trim()) break;
            cont.push(lines[j]);
          }
          sites.push({ n: i + 1, rest: line.slice(offset + at + 'Next up:'.length), cont });
        }
        offset += seg.length + 1;
      });
    });
    if (sites.length < 2) continue; // one site (or none) cannot disagree
    // FAIL CLOSED (ckpt-p2 F3): this used to `.filter((s) => s.key)` and skip the
    // file when fewer than 2 sites keyed — so a `Next up:` whose beat wrapped to
    // the next line keyed to '', was dropped, and a REAL disagreement went
    // unreported. A wrapped site is now keyed from its continuation lines, and a
    // site that still yields no beat is a finding, not a silent pass.
    const keyed = sites.map((s) => {
      let key = beatKey(s.rest);
      for (let k = 0; !key && k < s.cont.length; k++) key = beatKey(s.cont[k]);
      return { ...s, key };
    });
    for (const site of keyed.filter((s) => !s.key))
      fail(file, site.n, '`Next up:` names no session/checkpoint beat (nothing keyable on this line or the rest of its paragraph) — an unkeyable site cannot be checked for agreement, so it is a finding, not a pass');
    const [first, ...rest] = keyed.filter((s) => s.key);
    if (!first) continue;
    for (const site of rest) {
      if (site.key !== first.key)
        fail(file, site.n, `\`Next up:\` disagrees with the site at line ${first.n}: "${site.key}" vs "${first.key}" — every \`Next up:\` site must name the same next beat, or a resuming session re-runs committed work`);
    }
  }
}

// ── Shared OB-row grammar (checks 13 + 14, deferred-obligations Phase 1) ────
// One obligation = one foldable line:
//   `- [ ] OB-<n> · added YYYY-MM-DD (<source>) — do: <action> — when:
//   <observable condition> — probe: <command | manual>`
// A fired row ticks `[x]` and APPENDS `· fired YYYY-MM-DD (<evidence>)` — rows
// are never deleted. Template placeholders keep the literal `YYYY-MM-DD`, so
// the date alternation admits it (placeholder rows must still carry every
// segment — the template is checked too, and drift there ships to every
// consumer). L3 (owner lock): a `when:` names an observable state, NEVER a
// clock — a bare time word as the whole condition is a finding, because a
// clock-shaped row can neither be probed nor honestly fired.
const OB_DATE = '(?:\\d{4}-\\d{2}-\\d{2}|YYYY-MM-DD)';
const OB_ROW = new RegExp(
  `^- \\[([ x~])\\] ([^·]+?) · added ${OB_DATE} \\(([^)]+)\\) — do: (.+?) — when: (.+?) — probe: (.+)$`
);
const OB_FIRED = new RegExp(`· fired ${OB_DATE} \\(.+\\)`);
const BARE_TIME_WORDS = new Set([
  'hourly', 'daily', 'nightly', 'weekly', 'biweekly', 'fortnightly',
  'monthly', 'quarterly', 'yearly', 'annually', 'soon', 'later', 'eventually',
  'someday', 'sometime', 'periodically', 'regularly', 'asap', 'tomorrow',
  'next week', 'next month', 'next quarter', 'next sprint',
]);
const TIME_UNITS = '(?:sec(?:ond)?s?|min(?:ute)?s?|h(?:ou)?rs?|days?|weeks?|months?|quarters?|years?|mornings?|evenings?|nights?|weekends?|sprints?)';
// A quantity in front of a unit. Spelled numbers matter: this repo's own prose
// prefers them ("three branches", "two sessions"), so a digits-only lead-in
// misses the likelier authoring form.
const COUNT = '(?:\\d+(?:st|nd|rd|th)?|an?|the|this|next|one|two|three|four|five|six|seven|eight|nine|ten|a few|several|another|some|couple of)';
// Compact durations (`30d`, `2wk`, `6mo`) — a clock with the space removed.
// The shipped guard caught these by accident, via a bare `^(?:every|in)\s+\d+`
// with no unit requirement; end-anchoring the patterns lost them, so they are
// matched explicitly rather than regained by loosening the anchor.
const COMPACT = '\\d+\\s*(?:s|secs?|m|mins?|h|hrs?|d|w|wk|wks|mo|mos|q|y|yr|yrs)';
// A condition is split on ENUMERATION separators only. The em-dash is
// deliberately NOT one: this repo's prose uses em-dashed parentheticals
// heavily, so splitting on it flagged `… next working session — tomorrow — has
// installed the build`, whose condition is "has installed the build".
const CLAUSE_SPLIT = /\s*(?:,|;|\band\b)\s*/;
// Each pattern must consume its WHOLE clause. That end-anchor is what keeps a
// time word used as a noun modifier out: `after the sprint review is signed
// off` and `after a second live-only defect reaches main` name observable
// states, and an unanchored pattern rejected both (they were 2 of the 10
// honest conditions a review found this guard blocking).
const CLOCK_PATTERNS = [
  ['numeric period',        new RegExp(`^(?:every|in)\\s+${COUNT}\\s+${TIME_UNITS}\\s*$`)],
  ['cadence',               new RegExp(`^every\\s+(?:other\\s+)?${TIME_UNITS}\\s*$`)],
  ['elapsed-time deadline', new RegExp(`^(?:after|within)\\s+${COUNT}\\s+${TIME_UNITS}\\s*$`)],
  ['compact duration',      new RegExp(`^(?:every|in|after|within)\\s+${COMPACT}\\s*$`)],
];
// Does `when` smuggle a clock? Returns `{ clause, kind }`, else null.
//
// `when` arrives normalized by the caller: markdown glyphs stripped, trimmed,
// lowercased, trailing punctuation removed.
//
// Bare words are judged only in the HEAD or TAIL clause; the patterns are
// judged in EVERY clause. The asymmetry is deliberate — a clock is stated at
// one end of a condition (`weekly, once CI is green`), whereas a bare word in
// the middle is usually being *mentioned*: `the L3 doc lists hourly, daily,
// weekly, and nightly as banned` is a legitimate condition about the rule.
//
// Known limits, measured and stated rather than papered over. A sweep of 18
// alternate phrasings found these still evading: a clock with a trailing
// qualifier (`every day at 09:00`); weekday/quarter names (`by next Friday`,
// `end of Q3`); bare ISO dates; adverbs (`overnight`, `twice a week`); and
// clauses joined by `then`/`or`/`unless` rather than `,`/`;`/`and`. The first
// is structural — catching it means allowing trailing text, which is exactly
// what produced 15 false positives. The rest are judged not worth the
// false-positive risk of matching weekday and quarter words that appear in
// honest conditions ("the Friday deploy", "the Q3 numbers").
//
// The same sweep found 3 forms the PREVIOUS guard caught and this one lost;
// two were recovered with explicit ordinal and compact-duration patterns
// rather than by loosening the anchor. `tools/lint-test.mjs` pins all of it.
function clockLeak(when) {
  const clauses = when.split(CLAUSE_SPLIT).map((c) => c.trim());
  for (const end of [clauses[0], clauses[clauses.length - 1]])
    if (BARE_TIME_WORDS.has(end)) return { clause: end, kind: 'bare clock word' };
  for (const clause of clauses)
    for (const [kind, re] of CLOCK_PATTERNS)
      if (re.test(clause)) return { clause, kind };
  return null;
}
// Fold wrapped continuation lines into their bullet (the check-11 model);
// report against the bullet's own first line.
function obBullets(blockLines) {
  const bullets = [];
  for (const { n, text: line } of blockLines) {
    if (/^- /.test(line)) bullets.push({ n, text: line });
    else if (bullets.length && /^\s+\S/.test(line))
      bullets[bullets.length - 1].text += ' ' + line.trim();
  }
  return bullets;
}
// Validate one folded row. `strictLabel` (the register) additionally demands
// the `OB-<n>` integer id; mission-ledger Closing rows may use a short name
// (the template's seeded rows do) or any `OB-*` label. `placeholderOk`
// (templates only) admits the literal `YYYY-MM-DD` in fired-evidence — in a
// real ledger a fire is an event that happened, so its date is known
// (ckpt-p1 F2). The `added YYYY-MM-DD` placeholder stays admitted everywhere:
// a fresh ledger deployed from the template carries it until filled.
function checkObRow(file, b, { strictLabel = false, placeholderOk = false } = {}) {
  const m = b.text.match(OB_ROW);
  if (!m) {
    fail(file, b.n, 'obligation row does not match the grammar `- [ ] <id> · added YYYY-MM-DD (<source>) — do: … — when: … — probe: <command | manual>` (glyph, `·` separators, em-dashed segments in this order) — got: ' + b.text.slice(0, 72));
    return;
  }
  const [, glyph, , , , whenSeg, probeSeg] = m;
  if (strictLabel && !/^OB-\d+$/.test(m[2].trim()))
    fail(file, b.n, `register row id "${m[2].trim()}" must be \`OB-<n>\` with <n> the next unused integer — mission-local names stay in the mission ledger; the register is the durable namespace`);
  const fired = OB_FIRED.test(probeSeg);
  if (glyph === 'x' && !fired)
    fail(file, b.n, 'fired (`[x]`) obligation row must append `· fired YYYY-MM-DD (<evidence>)` — a tick without evidence is a claim, not a fire');
  if (glyph !== 'x' && fired)
    fail(file, b.n, 'row carries a `· fired …` suffix but is not ticked `[x]` — the tick and the evidence travel together');
  if (!placeholderOk && /· fired YYYY-MM-DD\b/.test(b.text))
    fail(file, b.n, 'fired-evidence carries the literal `YYYY-MM-DD` placeholder — a fire is an event that happened, so its date is known; the placeholder is template-only');
  const when = whenSeg.replace(/[_*`]/g, '').trim().toLowerCase().replace(/[.,;:!]+$/, '');
  // ckpt-p1 F1 (`every 10 minutes`), ckpt-p2 (`every day`) and ckpt-p4/OB-7
  // (`after 2 weeks`) each found the same clock in a new costume, and each was
  // patched as another `^`-anchored branch until a review measured the pile at
  // 13/20 wrong. One predicate now decides all of them, clause by clause, and
  // `tools/lint-test.mjs` pins the verdicts.
  const clock = clockLeak(when);
  if (clock)
    fail(file, b.n, `\`when: ${clock.clause}\` is a ${clock.kind} — a clock, not a condition (L3: condition-driven, never time-driven) — name the observable state you expect to exist by then, or keep the timing intent out of \`when:\` and use \`probe: manual\``);
}

// ── 13. `## Closing` grammar + close refusal (deferred-obligations Phase 1) ──
// A mission ledger's `## Closing` block is where "do X once Y happens" parks so
// it is never lost to "zero open PRs" as a false completeness signal. Two
// duties here: (a) every row in a block THAT EXISTS parses (a row the grammar
// can't parse is a row no probe can fire); (b) the refusal backstop — a
// `Closed: YYYY-MM-DD` stamp may not coexist with an open `[ ]` row, nor with
// a deferred `[~]` row lacking its `→ OB-<n>` promotion ref (L2: the checklist
// is the authority). Legacy-tolerant per the OQ4/check-11 precedent: ledgers
// without the block are exempt and must not start failing; in-flight missions
// (no stamp) do not fail on unticked rows — that is their normal state. The
// TEMPLATE must carry the block, so every new mission inherits it.
function checkClosing() {
  const HEADING = 'Closing';
  const tpl = path.join(PLUGIN, 'templates/mission-state.md');
  const tplBlock = sectionLines(read(tpl), HEADING);
  if (!tplBlock)
    fail(tpl, 1, `missing "## ${HEADING}" section — every mission ledger must inherit the closing block (deferred obligations with an observable \`when:\`; the close gate refuses while a \`[ ]\` row remains)`);
  else for (const b of obBullets(tplBlock)) checkObRow(tpl, b, { placeholderOk: true });

  for (const file of stateLedgers()) {
    const text = read(file);
    const block = sectionLines(text, HEADING);
    if (!block) continue; // legacy ledgers without the block are exempt
    const rows = obBullets(block);
    for (const b of rows) checkObRow(file, b);
    // The stamp is a REAL date outside inline code AND outside fenced blocks —
    // prose *about* the convention writes `Closed: YYYY-MM-DD` literally or
    // backticks it, and a handoff entry may paste command output (a settle
    // transcript quoting a stamp) into a ``` fence; none of those may trip the
    // refusal (ckpt-p1 F3).
    let stampLine = 0;
    let fenced = false;
    text.split('\n').forEach((line, i) => {
      if (/^\s*(?:```|~~~)/.test(line)) { fenced = !fenced; return; }
      if (fenced) return;
      line.split('`').forEach((seg, s) => {
        if (s % 2 === 0 && !stampLine && /\bClosed:\s*\d{4}-\d{2}-\d{2}\b/.test(seg)) stampLine = i + 1;
      });
    });
    if (!stampLine) continue;
    for (const b of rows) {
      const glyph = b.text.match(/^- \[([ x~])\]/)?.[1];
      if (glyph === ' ')
        fail(file, b.n, `unticked \`[ ]\` obligation coexists with the \`Closed:\` stamp at line ${stampLine} — a mission may not be reported closed while an obligation is open: fire it (\`[x]\` + \`· fired …\`) or promote it (\`[~] … → OB-<n>\`)`);
      // ckpt-p4 fold (OB-7): the ref must carry its integer. `→ OB-` alone
      // satisfied the old digitless pattern, so a row could promote to nothing
      // and still clear the close gate — the promise's destination is the
      // whole point of the ref.
      else if (glyph === '~' && !/→ OB-\d+/.test(b.text))
        fail(file, b.n, `deferred \`[~]\` obligation lacks its \`→ OB-<n>\` promotion ref, yet the ledger is stamped \`Closed:\` (line ${stampLine}) — a deferral survives its mission only as a verbatim copy in \`.plans/OBLIGATIONS.md\``);
    }
  }
}

// ── 14. Obligations register grammar (deferred-obligations Phase 1) ─────────
// `.plans/OBLIGATIONS.md` is the repo-level parking place a `[~]` ledger row
// promotes into. When present, every visible row must parse with the strict
// `OB-<n>` id; absence passes (a fresh consumer has no register yet). The
// template is validated too so a drifted example never deploys. HTML-commented
// lines (the template's example row ships commented) are not rows.
function checkObligationsRegister() {
  const files = [
    path.join(ROOT, '.plans/OBLIGATIONS.md'),
    path.join(PLUGIN, 'templates/obligations.md'),
  ].filter(existsSync);
  for (const file of files) {
    let inComment = false;
    const visible = [];
    read(file).split('\n').forEach((line, i) => {
      const open = line.includes('<!--');
      if (!inComment && !open) visible.push({ n: i + 1, text: line });
      if (open && !line.includes('-->')) inComment = true;
      else if (line.includes('-->')) inComment = false;
    });
    for (const b of obBullets(visible))
      checkObRow(file, b, { strictLabel: true, placeholderOk: file.includes(path.sep + 'templates' + path.sep) });
  }
}

// `clockLeak` is exported so `tools/lint-test.mjs` can decide it directly. The
// run below is guarded on being the entry point: importing this file for the
// harness must not execute the whole gate (and must not `process.exit`).
export { clockLeak };

// realpath BOTH sides: `import.meta.url` is already symlink-resolved, so a
// plain `path.resolve(argv[1])` comparison fails when this file is invoked
// through a symlink — and the failure mode is the gate printing nothing and
// exiting 0. A check that silently reports success is the exact defect this
// file exists to catch, so the comparison is made on resolved paths and any
// resolution error falls back to running (never to skipping).
const isEntryPoint = () => {
  if (!process.argv[1]) return false;
  const self = fileURLToPath(import.meta.url);
  try {
    return realpathSync(process.argv[1]) === realpathSync(self);
  } catch {
    return path.resolve(process.argv[1]) === self;
  }
};

if (isEntryPoint()) {
  for (const check of [checkManifests, checkAgents, checkCommands, checkCrossRefs, checkTemplateRefs, checkSections, checkFrontmatterYaml, checkTemplateFrontmatter, checkHooks, checkObfuscation, checkHookBehavior, checkClockGuard, checkMarkerMutation, checkContextAttrib, checkStandingSteers, checkNextUpAgreement, checkClosing, checkObligationsRegister]) {
    check();
  }

  if (findings.length) {
    console.error(`lint: ${findings.length} finding(s)\n`);
    for (const f of findings) console.error('  ' + f);
    process.exit(1);
  }
  console.log('lint: clean');
}
