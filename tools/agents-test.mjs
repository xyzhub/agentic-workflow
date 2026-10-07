#!/usr/bin/env node
// Tier-1.5 behavioral test for the agent registry (agents.mjs). Zero deps;
// Node >= 18. Run: node tools/agents-test.mjs   (0 = pass, 1 = fail)
//
// Proves the registry BEHAVES, not just that it parses:
//   schema   templates/agents-registry.schema.json is strict-mode safe (every
//            object additionalProperties:false with every property required),
//            and every emitted agent validates against it.
//   registry all 20 plugin agents appear; a fixture project with four kinds of
//            shadow (new-banner model tune, old-banner tune, un-bannered body
//            edit, reviewer boundary/skills tune) yields the right effective
//            settings and override.kind — derived by comparison, so a hand edit
//            classifies too. base_sha is the banner's 12-hex stamp, or null.

import {
  readFileSync, writeFileSync, mkdirSync, mkdtempSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ROOT, 'plugins/agentic-workflow');
const AGENTS = path.join(PLUGIN, 'tools/agents.mjs');
const SCHEMA = path.join(PLUGIN, 'templates/agents-registry.schema.json');
const BASE_DIR = path.join(PLUGIN, 'agents');

let passed = 0;
const fails = [];
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { fails.push(name); console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
};
const group = (title) => console.log(`\n${title}`);

const TMP = mkdtempSync(path.join(tmpdir(), 'agents-test-'));

// Same bytes tune.md's `shasum -a 256 <file> | cut -c1-12` hashes.
const sha12 = (file) => createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 12);

// Build a shadow from the real plugin base: append frontmatter keys, optionally
// append body text, optionally prepend a banner line.
function shadow(name, { keys = {}, bodyExtra = '', banner = null } = {}) {
  const baseText = readFileSync(path.join(BASE_DIR, `${name}.md`), 'utf8');
  const m = baseText.match(/^---\n([\s\S]*?)\n---\n?/);
  const fm = m[1];
  const body = baseText.slice(m[0].length).replace(/^\n+/, '');
  const added = Object.entries(keys).map(([k, v]) => `${k}: ${v}`).join('\n');
  const fmOut = added ? `${fm}\n${added}` : fm;
  const head = banner ? `${banner}\n\n` : '';
  const tail = bodyExtra ? `${body}\n\n${bodyExtra}` : body;
  return `---\n${fmOut}\n---\n\n${head}${tail}`;
}

// ── schema: strict-mode invariant ──────────────────────────────────────────
function schemaGroup() {
  group('schema — templates/agents-registry.schema.json');
  let s;
  try { s = JSON.parse(readFileSync(SCHEMA, 'utf8')); }
  catch (e) { ok('schema parses as JSON', false, e.message); return null; }
  ok('schema parses as JSON', true);
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
  })(s, '(root)');
  ok('every object is strict (additionalProperties:false, all props required)',
    problems.length === 0, problems.join(' | '));
  return s;
}

// A generic validator identical in semantics to the adapter's (type arrays,
// required, additionalProperties, items) — reused rather than importing to
// keep this harness independent of the adapter module.
function validate(value, schema, where = '') {
  const errs = [];
  const types = [].concat(schema.type || []);
  const typeOf = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
  const t = typeOf(value);
  if (types.length && !types.includes(t)) {
    errs.push(`${where || '(root)'}: expected ${types.join('|')}, got ${t}`);
    return errs;
  }
  if (t === 'object' && schema.properties) {
    for (const k of schema.required || []) if (!(k in value)) errs.push(`${where}: missing "${k}"`);
    if (schema.additionalProperties === false) {
      for (const k of Object.keys(value)) if (!(k in schema.properties)) errs.push(`${where}: unexpected "${k}"`);
    }
    for (const [k, sub] of Object.entries(schema.properties)) {
      if (k in value) errs.push(...validate(value[k], sub, where ? `${where}.${k}` : k));
    }
  }
  if (t === 'array' && schema.items) value.forEach((v, i) => errs.push(...validate(v, schema.items, `${where}[${i}]`)));
  return errs;
}

async function registryGroup(schema) {
  group('registry — defaults, effective and overrides');
  const { registry } = await import(`file://${AGENTS}`);

  // A clean project (no shadows): 20 agents, every override null.
  const clean = registry(path.join(TMP, 'no-such-project'));
  ok('plugin_version is a non-empty string', typeof clean.plugin_version === 'string' && clean.plugin_version.length > 0);
  ok('lists all 20 plugin agents', clean.agents.length === 20, `got ${clean.agents.length}`);
  ok('a reviewer with no shadow defaults to boundary_escalation on',
    clean.agents.find((a) => a.name === 'reviewer').effective.boundary_escalation === 'on');
  ok('a non-reviewer has boundary_escalation null',
    clean.agents.find((a) => a.name === 'backend').effective.boundary_escalation === null);
  ok('every clean agent override is null', clean.agents.every((a) => a.override === null));
  ok('phase is set for every agent', clean.agents.every((a) => a.phase && a.phase !== 'unknown'));
  ok('summary is the description up to the first . or —',
    clean.agents.every((a) => a.summary.length > 0 && a.summary.length <= a.description.length));

  // A fixture project with four shadow kinds.
  const proj = path.join(TMP, 'proj');
  const ad = path.join(proj, '.claude/agents');
  mkdirSync(ad, { recursive: true });

  // (a) new-banner model tune on backend → kind ["model"], base_sha 12 hex.
  const backendSha = sha12(path.join(BASE_DIR, 'backend.md'));
  const version = clean.plugin_version;
  writeFileSync(path.join(ad, 'backend.md'), shadow('backend', {
    keys: { model: 'claude-opus-4-8' },
    banner: `> Tuned from agentic-workflow v${version} (base sha256:${backendSha}) — model override. Reset with /tune backend reset.`,
  }));
  // (b) old-banner tune on frontend → base_sha null, base_version from banner.
  writeFileSync(path.join(ad, 'frontend.md'), shadow('frontend', {
    keys: { model: 'claude-opus-4-8' },
    banner: '> Tuned from agentic-workflow v1.50.0 — model override only. Reset with /tune frontend reset.',
  }));
  // (c) un-bannered body edit on security → kind includes prompt, path set.
  writeFileSync(path.join(ad, 'security.md'), shadow('security', {
    bodyExtra: 'PROJECT RULE: this org requires a threat model on every PR.',
  }));
  // (d) reviewer boundary/skills tune → effective reflects both.
  writeFileSync(path.join(ad, 'reviewer.md'), shadow('reviewer', {
    keys: { boundary_escalation: 'off', skills: '[stripe-testing]' },
    banner: `> Tuned from agentic-workflow v${version} (base sha256:${sha12(path.join(BASE_DIR, 'reviewer.md'))}) — boundary-escalation override (off). Reset with /tune reviewer reset.`,
  }));

  // (h) bannered tools tune on designer → kind is exactly ["tools"].
  writeFileSync(path.join(ad, 'designer.md'), shadow('designer', {
    banner: `> Tuned from agentic-workflow v${version} (base sha256:${sha12(path.join(BASE_DIR, 'designer.md'))}) — tools override. Reset with /tune designer reset.`,
  }).replace(/^tools: .*$/m, 'tools: Read, Grep, Glob'));

  // Project-only agents: .claude/agents files that shadow no plugin agent.
  // (e) carries its own phase: ; (f) has none → on-demand.
  writeFileSync(path.join(ad, 'scout.md'),
    '---\nname: scout\ndescription: Recon agent for the repo. Runs ad hoc.\nmodel: claude-opus-4-8\ntools: Read, Grep\nruntime: codex\neffort: high\nphase: discover\nskills: [plain-report]\n---\n\nScout body.\n');
  writeFileSync(path.join(ad, 'tinker.md'),
    '---\nname: tinker\ndescription: On-demand helper.\n---\n\nTinker body.\n');
  writeFileSync(path.join(ad, 'zed.md'),
    '---\nname: zed\ndescription: Bad phase.\nphase: bogus\n---\n\nZed body.\n');

  const reg = registry(proj);
  const byName = Object.fromEntries(reg.agents.map((a) => [a.name, a]));

  const be = byName.backend;
  ok('(a) new-banner model tune → override.kind is exactly ["model"]',
    JSON.stringify(be.override.kind) === JSON.stringify(['model']), JSON.stringify(be.override));
  ok('(a) base_sha is a 12-hex stamp and base_version is the plugin version',
    /^[0-9a-f]{12}$/.test(be.override.base_sha) && be.override.base_version === version, JSON.stringify(be.override));
  ok('(a) override.path points at the shadow', be.override.path === '.claude/agents/backend.md');

  const fe = byName.frontend;
  ok('(b) old-banner tune → base_sha null, base_version from the banner',
    fe.override.base_sha === null && fe.override.base_version === '1.50.0', JSON.stringify(fe.override));

  const se = byName.security;
  ok('(c) un-bannered body edit → kind includes prompt, base_version null',
    se.override.kind.includes('prompt') && se.override.base_version === null, JSON.stringify(se.override));
  ok('(c) override.path is set for a hand-edited shadow', se.override.path === '.claude/agents/security.md');

  const rv = byName.reviewer;
  ok('(d) effective reflects boundary_escalation off', rv.effective.boundary_escalation === 'off');
  ok('(d) effective reflects the tuned skills', JSON.stringify(rv.effective.skills) === JSON.stringify(['stripe-testing']));
  ok('(d) override.kind includes boundary_escalation and skills',
    rv.override.kind.includes('boundary_escalation') && rv.override.kind.includes('skills'), JSON.stringify(rv.override));

  const dz = byName.designer;
  ok('(h) a tools tune → kind ["tools"], effective.tools is the tuned list, tools stays the default',
    JSON.stringify(dz.override?.kind) === JSON.stringify(['tools'])
    && JSON.stringify(dz.effective.tools) === JSON.stringify(['Read', 'Grep', 'Glob'])
    && dz.tools.includes('Write'), JSON.stringify(dz));

  ok('every plugin agent carries source "plugin"',
    clean.agents.every((a) => a.source === 'plugin'));
  const sc = byName.scout;
  ok('(e) a project-only agent is listed with source "project" and override null',
    sc && sc.source === 'project' && sc.override === null, JSON.stringify(sc));
  ok('(e) a project-only agent keeps its own frontmatter phase',
    sc && sc.phase === 'discover' && sc.effective.runtime === 'codex' && sc.effective.effort === 'high',
    JSON.stringify(sc));
  const tk = byName.tinker;
  ok('(f) a project-only agent with no phase falls back to on-demand',
    tk && tk.source === 'project' && tk.phase === 'on-demand', JSON.stringify(tk));
  ok('(g) an unknown frontmatter phase falls back to on-demand (schema enum holds)',
    byName.zed && byName.zed.phase === 'on-demand', JSON.stringify(byName.zed));
  ok('a plugin agent shadowed by a project file is not duplicated as project-only',
    reg.agents.filter((a) => a.name === 'backend').length === 1
    && byName.backend.source === 'plugin');

  // Every emitted agent (clean and tuned) validates against the schema.
  const allErrs = [];
  for (const out of [clean, reg]) allErrs.push(...validate(out, schema));
  ok('every registry output validates against the schema', allErrs.length === 0, allErrs.slice(0, 3).join(' | '));
}

// ── run ────────────────────────────────────────────────────────────────────
const schema = schemaGroup();
if (schema) await registryGroup(schema);

console.log('');
if (fails.length) {
  console.error(`agents-registry harness: ${fails.length} failure(s), ${passed} passed`);
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`agents-registry harness: clean — ${passed} case(s)`);
process.exit(0);
