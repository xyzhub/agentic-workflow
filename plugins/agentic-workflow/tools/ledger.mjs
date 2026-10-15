#!/usr/bin/env node
// ledger.mjs — one-line ledger beats for the orchestrator (#132). Zero deps;
// Node >= 18. Every protocol-mandated write to `.plans/<mission>.state.md`
// (write-ahead, glyph flip, Closing fire, OB promotion, handoff entry,
// `Next up:`, the close stamp) used to be a hand-written heredoc + commit +
// push — eight per mission, one of which failed on a non-unique match. Each is
// now one command that refuses ambiguity instead of guessing.
//
//   node ledger.mjs <mission> mark "<row-prefix>" "[ ]"|"[~]"|"[x]"
//   node ledger.mjs <mission> fire "<row-prefix>" "<evidence>"
//   node ledger.mjs <mission> promote "<row-prefix>"
//   node ledger.mjs <mission> handoff "<text>"
//   node ledger.mjs <mission> next-up "<text>"
//   node ledger.mjs <mission> sessions +1 | =N
//   node ledger.mjs <mission> reviewer-runs +1 | =N
//   node ledger.mjs <mission> close
//   flags: --plans <dir> (default .plans) · --date YYYY-MM-DD (default today)
//          --commit (git add + conventional commit + push) · --no-push
//
// `<mission>` is the ledger's basename (`tune-presets` → `.plans/tune-presets.state.md`).
// `<row-prefix>` matches the row text AFTER the glyph (`Checkpoint p2`,
// `docs/record synced`); exactly one row may match, or the verb refuses and
// lists the candidates. `fire` / `promote` look inside `## Closing` only.
// `promote` lands the verbatim copy in `.plans/OBLIGATIONS.md` as the next
// `OB-<n>` and appends `→ OB-<n>` to the ledger row. `close` refuses while any
// row is `[ ]` or `[~]` without `→ OB-<n>` (the same rule lint check 13 enforces).
//
// Exit codes: 0 done · 2 refused (ambiguous row, open row on close, already
// fired/promoted/stamped) · 1 usage or I/O error. The file is rewritten only
// on success; a refusal leaves it byte-identical.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Same row grammar tools/lint.mjs checks 13/14 enforce — kept byte-identical so
// a row this tool writes is a row the gate accepts.
export const OB_DATE = '\\d{4}-\\d{2}-\\d{2}';
export const OB_ROW = new RegExp(
  `^- \\[([ x~])\\] ([^·]+?) · added ${OB_DATE} \\(([^)]+)\\) — do: (.+?) — when: (.+?) — probe: (.+)$`
);
export const GLYPHS = ['[ ]', '[~]', '[x]'];
export const VERBS = ['mark', 'fire', 'promote', 'handoff', 'next-up', 'sessions', 'reviewer-runs', 'close'];

export class Refusal extends Error { constructor(msg) { super(msg); this.exit = 2; } }
export class Usage extends Error { constructor(msg) { super(msg); this.exit = 1; } }

const today = () => new Date().toISOString().slice(0, 10);
const isDate = (d) => new RegExp(`^${OB_DATE}$`).test(d);

// ── pure helpers over an array of lines ───────────────────────────────────
// A checklist row = its `- [g] ` line plus any indented continuation lines.
export function rows(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^- \[[ x~]\] /.test(lines[i])) continue;
    let end = i;
    while (end + 1 < lines.length && /^\s+\S/.test(lines[end + 1])) end++;
    out.push({ start: i, end, text: [lines[i], ...lines.slice(i + 1, end + 1).map((l) => l.trim())].join(' ') });
  }
  return out;
}
// [start, end) line span of a `## <heading>` section (heading matched as a prefix).
export function section(lines, heading) {
  const start = lines.findIndex((l) => l.trim() === `## ${heading}` || l.trim().startsWith(`## ${heading}`));
  if (start === -1) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) if (/^## /.test(lines[i])) { end = i; break; }
  return { start, end };
}
function findRow(lines, prefix, within) {
  if (!prefix) throw new Usage('a <row-prefix> is required');
  const all = rows(lines).filter((r) => !within || (r.start > within.start && r.start < within.end));
  const hits = all.filter((r) => r.text.slice(6).startsWith(prefix));
  if (hits.length === 1) return hits[0];
  if (hits.length === 0) throw new Refusal(`no row starts with "${prefix}"${within ? ' in that section' : ''}`);
  throw new Refusal(`${hits.length} rows start with "${prefix}" — use a longer prefix:\n${hits.map((h) => `  ${h.text.slice(0, 100)}`).join('\n')}`);
}
function replaceRow(lines, row, text) { lines.splice(row.start, row.end - row.start + 1, text); }
function closing(lines) {
  const sec = section(lines, 'Closing');
  if (!sec) throw new Refusal('the ledger has no `## Closing` block');
  return sec;
}

// ── verbs (each mutates `lines` in place and returns a one-line summary) ──
export function mark(lines, prefix, glyph) {
  if (!GLYPHS.includes(glyph)) throw new Usage(`glyph must be one of ${GLYPHS.map((g) => `"${g}"`).join(', ')} (got "${glyph ?? ''}")`);
  const r = findRow(lines, prefix);
  const text = r.text.replace(/^- \[[ x~]\]/, `- ${glyph}`);
  replaceRow(lines, r, text);
  return `${glyph} ${r.text.slice(6, 70)}`;
}

export function fire(lines, prefix, evidence, date) {
  if (!evidence) throw new Usage('fire needs "<evidence>" — a tick without evidence is a claim, not a fire');
  const r = findRow(lines, prefix, closing(lines));
  if (new RegExp(`· fired ${OB_DATE}`).test(r.text)) throw new Refusal(`row already fired: ${r.text.slice(0, 100)}`);
  if (/→ OB-\d+/.test(r.text)) throw new Refusal(`row was promoted — the obligation now lives in .plans/OBLIGATIONS.md; fire it there: ${r.text.slice(0, 100)}`);
  const text = `${r.text.replace(/^- \[[ x~]\]/, '- [x]')} · fired ${date} (${evidence})`;
  replaceRow(lines, r, text);
  return `[x] ${r.text.slice(6, 60)} · fired ${date}`;
}

export function nextOb(registerLines) {
  let max = 0;
  for (const l of registerLines) { const m = l.match(/^- \[[ x~]\] OB-(\d+)/); if (m) max = Math.max(max, +m[1]); }
  return max + 1;
}
export function promote(lines, prefix, registerLines, date, ledgerRel) {
  const r = findRow(lines, prefix, closing(lines));
  if (/→ OB-\d+/.test(r.text)) throw new Refusal(`row already promoted: ${r.text.slice(0, 100)}`);
  const m = r.text.match(OB_ROW);
  if (!m) throw new Refusal(`row does not parse as an obligation (lint check 13 grammar): ${r.text.slice(0, 100)}`);
  const [, glyph, name, src, doSeg, whenSeg, probeSeg] = m;
  if (glyph === 'x') throw new Refusal(`a fired [x] row is not promoted: ${r.text.slice(0, 100)}`);
  const n = nextOb(registerLines);
  const source = src.replace(/,\s*(?:pre|post)-merge\s*$/, '').trim();
  replaceRow(lines, r, `${r.text.replace(/^- \[[ x~]\]/, '- [~]')} → OB-${n}`);
  const reg = `- [ ] OB-${n} · added ${date} (promoted from \`${ledgerRel}\` \`## Closing\` row "${name.trim()}", ${source}, ${date}) — do: ${doSeg} — when: ${whenSeg} — probe: ${probeSeg}`;
  let last = -1;
  registerLines.forEach((l, i) => { if (/^- \[[ x~]\] OB-\d+/.test(l)) last = i; });
  if (last === -1) registerLines.push(reg);
  else {
    let end = last;
    while (end + 1 < registerLines.length && /^\s+\S/.test(registerLines[end + 1])) end++;
    registerLines.splice(end + 1, 0, reg);
  }
  return `[~] ${name.trim()} → OB-${n} (verbatim copy appended to the register)`;
}

export function handoff(lines, text, date) {
  if (!text) throw new Usage('handoff needs "<text>"');
  const sec = section(lines, 'Handoff log');
  if (!sec) throw new Refusal('the ledger has no `## Handoff log` section');
  const entry = `- ${date} ${text}`;
  for (let i = sec.start + 1; i < sec.end; i++) {
    if (/^- /.test(lines[i])) { lines.splice(i, 0, entry, ''); return `handoff entry inserted at line ${i + 1}`; }
  }
  for (let i = sec.start + 1; i < sec.end; i++) {
    if (/^Next up:/.test(lines[i])) { lines.splice(i, 0, entry, ''); return `handoff entry inserted at line ${i + 1}`; }
  }
  lines.splice(sec.end, 0, entry, '');
  return `handoff entry inserted at line ${sec.end + 1}`;
}

export function nextUp(lines, text) {
  if (!text) throw new Usage('next-up needs "<text>"');
  const idx = lines.map((l, i) => (/^Next up:/.test(l) ? i : -1)).filter((i) => i >= 0);
  if (idx.length === 0) throw new Refusal('the ledger has no `Next up:` line');
  if (idx.length > 1) throw new Refusal(`${idx.length} \`Next up:\` lines (LA-7 allows exactly one) at lines ${idx.map((i) => i + 1).join(', ')} — rename the stale one \`SUPERSEDED next-up (historical):\` first`);
  lines[idx[0]] = `Next up: ${text}`;
  return `Next up: ${text.slice(0, 70)}`;
}

export function sessions(lines, arg) {
  const i = lines.findIndex((l) => /^Sessions used:\s*\d+/.test(l));
  if (i === -1) throw new Refusal('the ledger has no `Sessions used: <int>` line');
  const cur = +lines[i].match(/\d+/)[0];
  let next;
  if (/^\+\d+$/.test(arg ?? '')) next = cur + +arg.slice(1);
  else if (/^=\d+$/.test(arg ?? '')) next = +arg.slice(1);
  else throw new Usage('sessions takes +N or =N');
  lines[i] = `Sessions used: ${next}`;
  const est = lines.find((l) => /^Estimate:\s*\d+/.test(l));
  return `Sessions used: ${next}${est ? ` (${est.replace(/^Estimate:\s*/, 'Estimate ')})` : ''}`;
}

// `Reviewer runs: <int>` sits under `Sessions used:`; bumped at every one-shot
// reviewer spawn, plan-judge included (adaptive-ceremony OQ-4, AC-13).
export function reviewerRuns(lines, arg) {
  const i = lines.findIndex((l) => /^Reviewer runs:\s*\d+/.test(l));
  if (i === -1) throw new Refusal('the ledger has no `Reviewer runs: <int>` line — add `Reviewer runs: 0` under `Sessions used:`');
  const cur = +lines[i].match(/\d+/)[0];
  let next;
  if (/^\+\d+$/.test(arg ?? '')) next = cur + +arg.slice(1);
  else if (/^=\d+$/.test(arg ?? '')) next = +arg.slice(1);
  else throw new Usage('reviewer-runs takes +N or =N');
  lines[i] = `Reviewer runs: ${next}`;
  return `Reviewer runs: ${next}`;
}

export function close(lines, date) {
  const sec = closing(lines);
  const open = rows(lines).filter((r) => r.start > sec.start && r.start < sec.end)
    .filter((r) => r.text[3] === ' ' || (r.text[3] === '~' && !/→ OB-\d+/.test(r.text)));
  if (open.length)
    throw new Refusal(`REFUSED: ${open.length} obligation(s) still open — fire (\`[x]\` + evidence) or promote (\`[~] … → OB-<n>\`) each:\n${open.map((r) => `  ${r.text.slice(0, 100)}`).join('\n')}`);
  if (lines.slice(sec.start, sec.end).some((l) => new RegExp(`^Closed: ${OB_DATE}`).test(l))) throw new Refusal('the `## Closing` block is already stamped `Closed:`');
  let end = sec.end;
  while (end > sec.start + 1 && lines[end - 1].trim() === '') end--;
  lines.splice(end, 0, '', `Closed: ${date}`);
  if (end + 2 >= lines.length) lines.push('');
  return `Closed: ${date}`;
}

// ── CLI ────────────────────────────────────────────────────────────────────
export function parseArgs(argv) {
  const o = { plans: '.plans', date: today(), commit: false, push: true, positional: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--plans') o.plans = argv[++i];
    else if (a === '--date') o.date = argv[++i];
    else if (a === '--commit') o.commit = true;
    else if (a === '--no-push') o.push = false;
    else if (a === '--help' || a === '-h') o.help = true;
    else if (a.startsWith('--')) throw new Usage(`unknown flag ${a}`);
    else o.positional.push(a);
  }
  if (o.help) return o;
  const [mission, verb] = o.positional;
  if (!mission || !verb) throw new Usage('usage: ledger.mjs <mission> <verb> …');
  if (!VERBS.includes(verb)) throw new Usage(`unknown verb "${verb}" (verbs: ${VERBS.join(', ')})`);
  if (!o.plans || !o.date || !isDate(o.date)) throw new Usage('--plans needs a dir and --date needs YYYY-MM-DD');
  return o;
}

export function apply(o) {
  const [mission, verb, ...args] = o.positional;
  const ledgerPath = mission.endsWith('.state.md') ? mission : path.join(o.plans, `${mission}.state.md`);
  if (!existsSync(ledgerPath)) throw new Usage(`no ledger at ${ledgerPath}`);
  const registerPath = path.join(path.dirname(ledgerPath), 'OBLIGATIONS.md');
  const lines = readFileSync(ledgerPath, 'utf8').split('\n');
  const touched = [ledgerPath];
  let summary;
  if (verb === 'mark') summary = mark(lines, args[0], args[1]);
  else if (verb === 'fire') summary = fire(lines, args[0], args[1], o.date);
  else if (verb === 'promote') {
    if (!existsSync(registerPath)) throw new Refusal(`no register at ${registerPath} — copy templates/obligations.md there first`);
    const reg = readFileSync(registerPath, 'utf8').split('\n');
    summary = promote(lines, args[0], reg, o.date, path.relative(process.cwd(), ledgerPath) || ledgerPath);
    writeFileSync(registerPath, reg.join('\n'));
    touched.push(registerPath);
  } else if (verb === 'handoff') summary = handoff(lines, args[0], o.date);
  else if (verb === 'next-up') summary = nextUp(lines, args[0]);
  else if (verb === 'sessions') summary = sessions(lines, args[0]);
  else if (verb === 'reviewer-runs') summary = reviewerRuns(lines, args[0]);
  else if (verb === 'close') summary = close(lines, o.date);
  writeFileSync(ledgerPath, lines.join('\n'));
  return { touched, summary, message: `plan(${path.basename(ledgerPath, '.state.md')}): ${verb} — ${summary.replace(/\s+/g, ' ').slice(0, 60)}` };
}

export function commit({ touched, message }, push = true, cwd = process.cwd()) {
  const git = (...a) => {
    const r = spawnSync('git', a, { cwd, encoding: 'utf8' });
    if (r.status !== 0) throw new Usage(`git ${a[0]} failed: ${(r.stderr || r.stdout || '').trim()}`);
    return r.stdout;
  };
  git('add', '--', ...touched);
  git('commit', '-q', '-m', message);
  if (push) git('push', '-q');
  return git('rev-parse', '--short', 'HEAD').trim();
}

export function main(argv = process.argv.slice(2)) {
  try {
    const o = parseArgs(argv);
    if (o.help) { console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 28).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); return 0; }
    const res = apply(o);
    let line = `ledger: ${res.summary}`;
    if (o.commit) line += ` · committed ${commit(res, o.push)}${o.push ? ' + pushed' : ''}`;
    console.log(line);
    return 0;
  } catch (e) {
    console.error(`ledger: ${e.message}`);
    return e.exit ?? 1;
  }
}

const isEntry = () => { try { return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); } catch { return false; } };
if (isEntry()) process.exit(main());
