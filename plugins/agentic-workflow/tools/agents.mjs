#!/usr/bin/env node
// agents.mjs — the machine-readable agent registry. Prints, per plugin agent,
// its defaults, effective settings and any project override, validated by
// templates/agents-registry.schema.json. Zero deps; Node >= 18.
//
//   node agents.mjs --json [--project <repo>]   # default --project is cwd
//   node agents.mjs --help
//
// A wrapper (e.g. the Missions app) reads this instead of parsing agent-file
// frontmatter and banner wording. /tune's no-arg table renders FROM this, so
// the two never drift. The JSON shape is a public interface.

import { readFileSync, existsSync, readdirSync, realpathSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const USAGE = `agents.mjs — the machine-readable agent registry.

  node agents.mjs --json [--project <repo>]   default --project is the cwd
  node agents.mjs --help

Prints { plugin_version, agents: [ { name, source, description, summary, phase,
model, tools, effective:{model, runtime, effort, boundary_escalation, skills, tools},
override: null | {path, kind[], base_version, base_sha} } ] }, validated by
templates/agents-registry.schema.json. source is 'plugin' or 'project' (a
.claude/agents file that shadows nothing); phase is on-demand when no lifecycle
phase maps the role.`;

// Lifecycle phase per role (locked 2026-10-07).
const PHASE = {
  intake: 'discover', brainstormer: 'discover', researcher: 'discover',
  designer: 'define', architect: 'define', business: 'define',
  planner: 'plan', advisor: 'plan',
  backend: 'build', frontend: 'build', security: 'build', devops: 'build',
  reviewer: 'review',
  chronicler: 'record', writer: 'record', curator: 'record',
  marketing: 'launch',
  ops: 'operate', analyst: 'operate', compass: 'operate',
};

// Allowed phase values (schema enum); an unknown frontmatter phase: falls back.
const PHASES = new Set([...Object.values(PHASE), 'on-demand']);
const validPhase = (v) => (PHASES.has(v) ? v : null);
// No `tools:` line means unset (all tools on claude, read-only on codex) — null, never [].
const toolsOrNull = (v) => (v ? toList(v) : null);

// The banner every /tune writes (old form has no `(base sha256:…)`).
const BANNER_RE = /^> Tuned from agentic-workflow v(\S+?)(?: \(base sha256:([0-9a-f]{12})\))? —/m;

const frontmatterBlock = (text) => {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : '';
};

// Single-line frontmatter value (null when absent).
function fmValue(text, key) {
  const hit = frontmatterBlock(text).split('\n').find((l) => l.startsWith(`${key}:`));
  return hit ? hit.slice(key.length + 1).trim() : null;
}

const toList = (v) => (v == null ? [] : v.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean));

// The `skills:` value, inline or YAML block form (mirrors run-codex.mjs).
function skillsList(text) {
  const block = frontmatterBlock(text);
  const lines = block.split('\n');
  const idx = lines.findIndex((l) => /^skills:/.test(l));
  if (idx < 0) return [];
  const rest = lines[idx].slice('skills:'.length).trim();
  if (rest) return toList(rest);
  const out = [];
  for (let i = idx + 1; i < lines.length; i++) {
    const t = lines[i].match(/^\s*-\s+(.+?)\s*$/);
    if (t) { out.push(t[1].trim().replace(/^['"]|['"]$/g, '')); continue; }
    if (lines[i].trim() === '') continue;
    break;
  }
  return out;
}

// Body with frontmatter and a leading tuned banner line removed, trimmed — the
// text that a `prompt` override would differ on.
function bodyMinusBanner(text) {
  const body = text.replace(/^---\n[\s\S]*?\n---\n?/, '');
  return body.replace(/^\s*> Tuned from agentic-workflow v[^\n]*\n?/, '').trim();
}

const summaryOf = (description) => {
  const cuts = ['. ', ' — '].map((s) => description.indexOf(s)).filter((i) => i >= 0);
  return cuts.length ? description.slice(0, Math.min(...cuts)) : description;
};

const pluginVersion = () =>
  JSON.parse(readFileSync(path.join(PLUGIN_ROOT, '.claude-plugin/plugin.json'), 'utf8')).version;

function agentNames() {
  const dir = path.join(PLUGIN_ROOT, 'agents');
  return readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')).sort();
}

// What the shadow changes vs the current base, by comparison (so a hand edit
// classifies too), not by parsing the banner.
function overrideKind(baseText, shadowText) {
  const kind = [];
  const diff = (key) => fmValue(baseText, key) !== fmValue(shadowText, key);
  if (diff('model')) kind.push('model');
  if (diff('runtime')) kind.push('runtime');
  if (diff('effort')) kind.push('effort');
  if (diff('boundary_escalation')) kind.push('boundary_escalation');
  if (toList(fmValue(baseText, 'tools')).join(',') !== toList(fmValue(shadowText, 'tools')).join(',')) kind.push('tools');
  if (skillsList(baseText).join(',') !== skillsList(shadowText).join(',')) kind.push('skills');
  if (bodyMinusBanner(baseText) !== bodyMinusBanner(shadowText)) kind.push('prompt');
  return kind;
}

export function registry(projectDir = process.cwd()) {
  const version = pluginVersion();
  const agents = agentNames().map((name) => {
    const baseText = readFileSync(path.join(PLUGIN_ROOT, 'agents', `${name}.md`), 'utf8');
    const baseModel = fmValue(baseText, 'model') || 'inherit';
    const baseDescription = fmValue(baseText, 'description') || '';
    const baseTools = toList(fmValue(baseText, 'tools'));

    const shadowPath = path.join(projectDir, '.claude/agents', `${name}.md`);
    const hasShadow = existsSync(shadowPath);
    const shadowText = hasShadow ? readFileSync(shadowPath, 'utf8') : null;
    const src = hasShadow ? shadowText : baseText;

    const effective = {
      model: fmValue(src, 'model') || 'inherit',
      runtime: fmValue(src, 'runtime') || 'claude',
      effort: fmValue(src, 'effort'),
      boundary_escalation: name === 'reviewer' ? (fmValue(src, 'boundary_escalation') || 'on') : null,
      skills: skillsList(src),
      tools: hasShadow ? toolsOrNull(fmValue(src, 'tools')) : baseTools,
    };

    let override = null;
    if (hasShadow) {
      const banner = shadowText.match(BANNER_RE);
      override = {
        path: path.join('.claude/agents', `${name}.md`),
        kind: overrideKind(baseText, shadowText),
        base_version: banner ? banner[1] : null,
        base_sha: banner && banner[2] ? banner[2] : null,
      };
    }

    return {
      name,
      source: 'plugin',
      description: baseDescription,
      summary: summaryOf(baseDescription),
      // A frontmatter `phase:` (base or shadow) wins; else the fixed map; else
      // on-demand (a role no lifecycle phase spawns on a schedule).
      phase: validPhase(fmValue(src, 'phase')) || PHASE[name] || 'on-demand',
      model: baseModel,
      tools: baseTools,
      effective,
      override,
    };
  });

  // Project-only agents: .claude/agents/*.md files that do NOT shadow a plugin
  // agent. Their fields come straight from their own frontmatter; no override.
  const pluginNames = new Set(agents.map((a) => a.name));
  const projAgentsDir = path.join(projectDir, '.claude/agents');
  if (existsSync(projAgentsDir)) {
    for (const file of readdirSync(projAgentsDir).filter((f) => f.endsWith('.md')).sort()) {
      const name = file.replace(/\.md$/, '');
      if (pluginNames.has(name)) continue;
      const text = readFileSync(path.join(projAgentsDir, file), 'utf8');
      const description = fmValue(text, 'description') || '';
      agents.push({
        name,
        source: 'project',
        description,
        summary: summaryOf(description),
        phase: validPhase(fmValue(text, 'phase')) || 'on-demand',
        model: fmValue(text, 'model') || 'inherit',
        tools: toolsOrNull(fmValue(text, 'tools')),
        effective: {
          model: fmValue(text, 'model') || 'inherit',
          runtime: fmValue(text, 'runtime') || 'claude',
          effort: fmValue(text, 'effort'),
          boundary_escalation: name === 'reviewer' ? (fmValue(text, 'boundary_escalation') || 'on') : null,
          skills: skillsList(text),
          tools: toolsOrNull(fmValue(text, 'tools')),
        },
        override: null,
      });
    }
  }

  return { plugin_version: version, agents };
}

export function main(argv = process.argv.slice(2)) {
  if (argv.includes('--help') || argv.includes('-h')) { console.log(USAGE); return 0; }
  let project = process.cwd();
  const pi = argv.indexOf('--project');
  if (pi >= 0) {
    const v = argv[pi + 1];
    if (!v || v.startsWith('--')) { console.error('agents: --project needs a value'); return 1; }
    project = v;
  }
  if (!argv.includes('--json')) { console.error(`agents: pass --json\n\n${USAGE}`); return 1; }
  console.log(JSON.stringify(registry(project), null, 2));
  return 0;
}

const isEntryPoint = () => {
  if (!process.argv[1]) return false;
  const self = fileURLToPath(import.meta.url);
  try { return realpathSync(process.argv[1]) === realpathSync(self); }
  catch { return path.resolve(process.argv[1]) === self; }
};
if (isEntryPoint()) process.exit(main());
