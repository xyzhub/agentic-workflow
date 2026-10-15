#!/usr/bin/env node
// attribution.mjs — the ONE resolver for the §10 **Attribution** row. Zero deps;
// Node >= 18; filesystem only. The row says what credit the workflow adds to
// commits and PRs; Claude Code applies it through the project's
// `.claude/settings.json` `attribution` key, and every other writer (plugin
// tools, a non-Claude runtime) reads it here.
//
//   node attribution.mjs resolve [--json] [--root <dir>]   the resolved commit + PR text
//   node attribution.mjs apply   [--root <dir>]            mirror the row into .claude/settings.json
//   node attribution.mjs check   [--root <dir>]            is settings.json in sync with the row?
//   node attribution.mjs import  [--root <dir>]            the row cell an existing settings.json implies
//
// Cell grammar: `commit: <v> · pr: <v>` (either part may be left out — it reads
// `default`), where <v> is `default` | `none` | a backticked custom text (a
// literal `\n` inside the backticks is a newline); a bare `default` or `none`
// sets both. `default` = `Generated with The XYZ Protocol`; `none` = no line
// (an empty string in settings.json, which Claude Code reads as "hide"). An
// absent row or an unfilled `_(…)_` placeholder reads as `default`; a cell
// outside the grammar reads as `default` too (source `malformed`).
//
// `apply` sets `attribution.commit` / `attribution.pr` only — every other key,
// `attribution.sessionUrl` included, is preserved; it never writes `sessionUrl`.
// It writes only when a value changes (2-space JSON + trailing newline), so a
// second run is a no-op.
//
// Exit codes: 0 done / in sync · 1 drift or absent (check), usage or I/O error
// · 2 refused (existing settings.json is not a JSON object — left
// byte-identical; `import` on a text a §10 cell cannot carry).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_TEXT = 'Generated with The XYZ Protocol';
const SETTINGS = ['.claude', 'settings.json'];
const VALUE = '(default|none|`[^`]+`)';
const CELL = new RegExp(`^(?:commit:\\s*${VALUE})?\\s*(?:·\\s*)?(?:pr:\\s*${VALUE})?$`);

const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };

function section10(text) {
  // Same bounds as conform.mjs section10(); JS has no \Z, so end-of-input is (?![\s\S]).
  const m = (text || '').match(/^## 10\.[\s\S]*?(?=^## 11\.|^## Local amendments|(?![\s\S]))/m);
  return m ? m[0] : '';
}

const valueText = (v) => {
  if (!v || v === 'default') return DEFAULT_TEXT;
  if (v === 'none') return '';
  return v.slice(1, -1).replace(/\\n/g, '\n');
};

// → { commit, pr, source } — commit/pr are the literal texts ('' = no line).
export function parseAttribution(workflowText) {
  const row = section10(workflowText).match(/^\|\s*\*\*Attribution\*\*[^|]*\|(.*)\|\s*$/m);
  const cell = row ? row[1].trim() : '';
  const out = (c, p, source) => ({ commit: valueText(c), pr: valueText(p), source });
  if (!row || cell === '' || cell.startsWith('_(')) return out(null, null, 'absent');
  if (cell === 'default' || cell === 'none') return out(cell, cell, 'row');
  const m = cell.match(CELL);
  if (!m || (!m[1] && !m[2])) return out(null, null, 'malformed');
  return out(m[1], m[2], 'row');
}

export function resolveAttribution(root = process.cwd()) {
  return parseAttribution(read(path.join(root, 'docs', 'WORKFLOW.md')) || '');
}

// Sets attribution.commit / attribution.pr only; returns a NEW object.
export function mergeSettings(settingsJson, att) {
  const base = settingsJson && typeof settingsJson === 'object' && !Array.isArray(settingsJson) ? settingsJson : {};
  const prev = base.attribution && typeof base.attribution === 'object' && !Array.isArray(base.attribution) ? base.attribution : {};
  return { ...base, attribution: { ...prev, commit: att.commit, pr: att.pr } };
}

// Reads <root>/.claude/settings.json → { ok, json, text, exists }; ok=false when
// the file exists but is not a JSON object.
function readSettings(root) {
  const text = read(path.join(root, ...SETTINGS));
  if (text === null) return { ok: true, json: {}, text: null, exists: false };
  try {
    const json = JSON.parse(text);
    if (!json || typeof json !== 'object' || Array.isArray(json)) return { ok: false, text, exists: true };
    return { ok: true, json, text, exists: true };
  } catch { return { ok: false, text, exists: true }; }
}

// → [] when in sync; else findings, first one the most useful.
export function check(root = process.cwd()) {
  const att = resolveAttribution(root);
  const f = [];
  if (att.source === 'absent') f.push('§10 has no filled **Attribution** row (reads as default)');
  if (att.source === 'malformed') f.push('§10 **Attribution** cell is outside the grammar (reads as default)');
  const s = readSettings(root);
  if (!s.ok) { f.push('.claude/settings.json is not a JSON object'); return f; }
  if (!s.exists) { f.push('.claude/settings.json is absent (Claude Code is not applying the row)'); return f; }
  const a = s.json.attribution || {};
  for (const side of ['commit', 'pr']) {
    if (a[side] !== att[side]) f.push(`.claude/settings.json attribution.${side} is ${JSON.stringify(a[side] ?? null)}, the row resolves to ${JSON.stringify(att[side])}`);
  }
  return f;
}

export function apply(root = process.cwd()) {
  const att = resolveAttribution(root);
  const s = readSettings(root);
  if (!s.ok) return { code: 2, msg: `.claude/settings.json is not a JSON object — not touched; fix it by hand, then re-run apply` };
  const cur = s.json.attribution || {};
  if (s.exists && cur.commit === att.commit && cur.pr === att.pr) return { code: 0, msg: 'settings.json already in sync — nothing written' };
  const p = path.join(root, ...SETTINGS);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, `${JSON.stringify(mergeSettings(s.json, att), null, 2)}\n`);
  return { code: 0, msg: `${s.exists ? 'updated' : 'created'} .claude/settings.json attribution (takes effect next session)` };
}

// The row cell an existing settings.json implies → { code, cell | msg }.
export function importCell(root = process.cwd()) {
  const s = readSettings(root);
  if (!s.ok) return { code: 2, msg: '.claude/settings.json is not a JSON object — cannot import' };
  const a = s.json.attribution;
  const side = (v) => {
    if (typeof v !== 'string' || v === DEFAULT_TEXT) return 'default';
    if (v === '') return 'none';
    if (/[`|]/.test(v)) return null; // a §10 cell cannot carry a backtick or a pipe
    return `\`${v.replace(/\n/g, '\\n')}\``;
  };
  let c = 'default', p = 'default';
  if (a && typeof a === 'object') { c = side(a.commit); p = side(a.pr); }
  else if (s.json.includeCoAuthoredBy === false) { c = 'none'; p = 'none'; }
  if (c === null || p === null) return { code: 2, msg: 'the existing attribution text contains ` or | — write the §10 Attribution row by hand' };
  return { code: 0, cell: `commit: ${c} · pr: ${p}` };
}

export function main(argv = process.argv.slice(2)) {
  const verb = argv[0];
  const i = argv.indexOf('--root');
  const root = path.resolve(i >= 0 && argv[i + 1] ? argv[i + 1] : process.cwd());
  const say = (code, msg) => { (code === 0 ? console.log : console.error)(`attribution: ${msg}`); return code; };
  if (verb === 'resolve') {
    const att = resolveAttribution(root);
    if (argv.includes('--json')) console.log(JSON.stringify(att));
    else console.log(`commit: ${JSON.stringify(att.commit)}\npr: ${JSON.stringify(att.pr)}\nsource: ${att.source}`);
    return 0;
  }
  if (verb === 'apply') { const r = apply(root); return say(r.code, r.msg); }
  if (verb === 'check') {
    const f = check(root);
    return f.length ? say(1, f.join('; ')) : say(0, 'in sync — .claude/settings.json matches the §10 Attribution row');
  }
  if (verb === 'import') { const r = importCell(root); if (r.code === 0) { console.log(r.cell); return 0; } return say(r.code, r.msg); }
  return say(1, 'usage: attribution.mjs resolve [--json] | apply | check | import  [--root <dir>]');
}

const isEntry = () => { try { return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } };
if (isEntry()) process.exit(main());
