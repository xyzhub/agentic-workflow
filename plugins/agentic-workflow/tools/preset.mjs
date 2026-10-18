#!/usr/bin/env node
// preset.mjs — apply a tune preset with no model involved, so it works when the
// subscription is out (the `/agentic-workflow:tune preset` command needs a
// live session). Same rules as commands/tune.md "Apply" / "Reset":
//
//   node tools/preset.mjs apply <lean|balanced|rigorous|unattended|isolated> [--project <repo>] [--shell-alias]
//   node tools/preset.mjs reset  [--project <repo>]
//   node tools/preset.mjs show   [--project <repo>]
//
// apply: per plugin agent — a hand-tuned shadow (banner without `preset:`) or a
// composed one (`preset:x, model` …) is SKIPPED (the hand tune wins); a cell
// equal to the base deletes a preset-only shadow; a differing cell writes a
// fresh copy of the base with model/effort (and runtime/maxTurns on a claude-p
// row), the tune banner and a `TUNED (preset: <name>) — ` description. Then
// the §10 **Tune preset** row becomes `<name> (applied YYYY-MM-DD)`. For
// `isolated` it also runs `headless.mjs setup` (and `--shell-alias` adds ccp).
// Exit 0 ok · 1 usage/IO · 2 refused. Zero deps, Node >= 18.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.dirname(path.dirname(SELF));
const PRESETS = path.join(ROOT, 'templates/tune-presets.json');
const BANNER_RE = /^> Tuned from agentic-workflow v[^\n]*$/m;
const PRESET_KIND_RE = /^> Tuned from agentic-workflow v[^\n]*? — ([^\n]*?) override/m;

const read = (p) => readFileSync(p, 'utf8');
const version = () => JSON.parse(read(path.join(ROOT, '.claude-plugin/plugin.json'))).version;
const sha12 = (text) => createHash('sha256').update(text).digest('hex').slice(0, 12);

export function splitFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return m ? { fm: m[1], body: m[2] } : { fm: '', body: text };
}
export const fmGet = (fm, key) => {
  const l = fm.split('\n').find((x) => x.startsWith(`${key}:`));
  return l ? l.slice(key.length + 1).trim() : null;
};
export function fmSet(fm, key, value) {
  const lines = fm.split('\n');
  const i = lines.findIndex((x) => x.startsWith(`${key}:`));
  if (value == null) { if (i >= 0) lines.splice(i, 1); }
  else if (i >= 0) lines[i] = `${key}: ${value}`;
  else lines.push(`${key}: ${value}`);
  return lines.join('\n');
}

// What a shadow's banner says it is: null (no shadow / unbannered), 'hand',
// 'composed', or the preset name of a preset-only shadow.
export function shadowKind(text) {
  if (!BANNER_RE.test(text)) return 'hand';
  const kinds = ((text.match(PRESET_KIND_RE) || [])[1] || '').split(',').map((s) => s.trim()).filter(Boolean);
  const presets = kinds.filter((k) => k.startsWith('preset:'));
  if (!presets.length) return 'hand';
  return kinds.length > 1 ? 'composed' : presets[0].slice('preset:'.length);
}

// The base's effective cell: tier aliases → pinned ids; inherit/absent → balanced.
export function baseCell(baseText, aliases, balancedRow) {
  const { fm } = splitFrontmatter(baseText);
  let model = fmGet(fm, 'model');
  if (!model || model === 'inherit') model = balancedRow.model;
  else if (aliases[model] && /^claude-/.test(aliases[model])) model = aliases[model];
  return { model, effort: fmGet(fm, 'effort') || balancedRow.effort, runtime: fmGet(fm, 'runtime') || 'claude', maxTurns: fmGet(fm, 'maxTurns') };
}

export const cellDiffers = (row, base) =>
  row.model !== base.model || row.effort !== base.effort || (row.runtime || 'claude') !== base.runtime
  || (row.runtime === 'claude-p' && String(row.maxTurns) !== String(base.maxTurns));

export function renderShadow(agent, baseText, row, name, ver) {
  const { fm, body } = splitFrontmatter(baseText);
  let f = fmSet(fm, 'model', row.model);
  f = fmSet(f, 'effort', row.effort);
  if (row.runtime === 'claude-p') { f = fmSet(f, 'runtime', 'claude-p'); f = fmSet(f, 'maxTurns', String(row.maxTurns)); }
  const desc = (fmGet(f, 'description') || '').replace(/^TUNED \([^)]*\) — /, '');
  f = fmSet(f, 'description', `TUNED (preset: ${name}) — ${desc}`);
  const details = [`model: ${row.model}`, `effort: ${row.effort}`, ...(row.runtime === 'claude-p' ? [`runtime: claude-p`, `maxTurns: ${row.maxTurns}`] : [])].join(', ');
  const banner = `> Tuned from agentic-workflow v${ver} (base sha256:${sha12(baseText)}) — preset:${name} override (${details}). Reset with /tune ${agent} reset.`;
  return `---\n${f}\n---\n\n${banner}\n\n${body.replace(/^\n+/, '')}`;
}

const PROFILE_ROW = /^\| \*\*Tune preset\*\* \|[^\n]*\|[ \t]*$/m;

export function apply(project, name, { today = new Date().toISOString().slice(0, 10), log = console.log } = {}) {
  const j = JSON.parse(read(PRESETS));
  const preset = j.presets[name];
  if (!preset) { log(`unknown preset "${name}" (have: ${Object.keys(j.presets).join(', ')})`); return 2; }
  const wf = path.join(project, 'docs/WORKFLOW.md');
  const plans = path.join(project, '.plans');
  if (existsSync(plans)) {
    for (const f of readdirSync(plans).filter((x) => x.endsWith('.state.md'))) {
      const t = read(path.join(plans, f));
      if (!/^Closed: /m.test(t) && Number((t.match(/Sessions used:\s*(\d+)/) || [])[1] || 0) > 0)
        log(`warning: ${f} is an open mission — switching presets mid-mission is out of v1 (doctor flags it); continuing`);
    }
  }
  const dir = path.join(project, '.claude/agents');
  const ver = version();
  const out = { written: [], removed: [], skipped: [] };
  for (const [agent, row] of Object.entries(preset.agents)) {
    const basePath = path.join(ROOT, 'agents', `${agent}.md`);
    if (!existsSync(basePath)) { out.skipped.push(`${agent} (no base file)`); continue; }
    const baseText = read(basePath);
    const shadowPath = path.join(dir, `${agent}.md`);
    if (existsSync(shadowPath)) {
      const kind = shadowKind(read(shadowPath));
      if (kind === 'hand') { out.skipped.push(`${agent} (hand tune wins)`); continue; }
      if (kind === 'composed') { out.skipped.push(`${agent} (composed tune — /tune ${agent} reset first)`); continue; }
    }
    const base = baseCell(baseText, j.tier_aliases || {}, j.presets.balanced.agents[agent]);
    if (!cellDiffers(row, base)) {
      if (existsSync(shadowPath)) { unlinkSync(shadowPath); out.removed.push(agent); }
      continue;
    }
    mkdirSync(dir, { recursive: true });
    writeFileSync(shadowPath, renderShadow(agent, baseText, row, name, ver));
    out.written.push(agent);
  }
  if (existsSync(wf)) {
    const t = read(wf);
    const row = `| **Tune preset** | ${name} (applied ${today}) |`;
    if (PROFILE_ROW.test(t)) writeFileSync(wf, t.replace(PROFILE_ROW, row));
    else log('note: docs/WORKFLOW.md has no §10 **Tune preset** row — not recorded (run /agentic-workflow:sync)');
  } else log('note: no docs/WORKFLOW.md — preset not recorded in §10');
  log(`preset ${name}: wrote ${out.written.length} [${out.written.join(', ')}] · removed ${out.removed.length} [${out.removed.join(', ')}] · skipped ${out.skipped.length}${out.skipped.length ? ` [${out.skipped.join('; ')}]` : ''}`);
  log('commit .claude/agents/ with docs/WORKFLOW.md');
  return 0;
}

export function reset(project, { today = new Date().toISOString().slice(0, 10), log = console.log } = {}) {
  const dir = path.join(project, '.claude/agents');
  const removed = [], kept = [];
  if (existsSync(dir)) for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const kind = shadowKind(read(path.join(dir, f)));
    if (kind !== 'hand' && kind !== 'composed') { unlinkSync(path.join(dir, f)); removed.push(f.replace(/\.md$/, '')); }
    else kept.push(f.replace(/\.md$/, ''));
  }
  const wf = path.join(project, 'docs/WORKFLOW.md');
  if (existsSync(wf) && PROFILE_ROW.test(read(wf))) writeFileSync(wf, read(wf).replace(PROFILE_ROW, `| **Tune preset** | balanced (applied ${today}) |`));
  log(`reset: removed ${removed.length} preset shadow(s) [${removed.join(', ')}] · kept ${kept.length} [${kept.join(', ')}]`);
  return 0;
}

export function show(project, { log = console.log } = {}) {
  const wf = path.join(project, 'docs/WORKFLOW.md');
  const row = existsSync(wf) ? (read(wf).match(PROFILE_ROW) || [''])[0] : '';
  log(`§10 Tune preset: ${row.replace(/^\| \*\*Tune preset\*\* \| | \|\s*$/g, '') || 'balanced (no row)'}`);
  const dir = path.join(project, '.claude/agents');
  for (const a of Object.keys(JSON.parse(read(PRESETS)).presets.balanced.agents)) {
    const p = path.join(dir, `${a}.md`);
    if (!existsSync(p)) { log(`  ${a.padEnd(13)} plugin default`); continue; }
    const t = read(p); const { fm } = splitFrontmatter(t);
    log(`  ${a.padEnd(13)} ${shadowKind(t).padEnd(10)} ${fmGet(fm, 'model') || 'inherit'} · ${fmGet(fm, 'effort') || '-'} · ${fmGet(fm, 'runtime') || 'claude'}`);
  }
  return 0;
}

export async function main(argv = process.argv.slice(2)) {
  const pi = argv.indexOf('--project');
  const project = path.resolve(pi >= 0 ? argv[pi + 1] : process.cwd());
  const [verb, name] = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--project');
  if (verb === 'apply' && name) {
    const rc = apply(project, name);
    if (rc === 0 && name === 'isolated') {
      const { main: headless } = await import('./headless.mjs');
      await headless(['setup', '--cwd', project, ...(argv.includes('--shell-alias') ? ['--shell-alias'] : [])]);
    }
    return rc;
  }
  if (verb === 'reset') return reset(project);
  if (verb === 'show') return show(project);
  console.error('usage: preset.mjs apply <name> [--shell-alias] | reset | show   [--project <repo>]');
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === SELF) {
  main().then((c) => process.exit(c), (e) => { console.error(`preset: ${e.message}`); process.exit(1); });
}
