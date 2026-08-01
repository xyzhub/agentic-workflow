#!/usr/bin/env node
// Phase-0 measurement instrument for the context-economy mission: attributes an
// orchestrator session's context occupancy to named categories. Zero deps; Node >= 18.
//
//   node tools/context-attrib.mjs <transcript.jsonl>   # measure one session
//   node tools/context-attrib.mjs --selftest           # synthetic fixture, no real transcript
//
// Transcripts are 3-12 MB, so this NEVER reads one into memory (readline over a
// stream) and NEVER prints transcript content — labels and numbers only.
//
// ── The accounting model (read this before trusting a number) ────────────────
// TOTAL   = Σ prompt-delta over UNIQUE requestIds. A request's prompt size is
//           input + cache_creation + cache_read; the delta against the previous
//           request is what that turn ADDED to context. Summed, that is the
//           session's context occupancy — what it paid to accumulate.
// ratio   = Σ delta ÷ Σ chars-appended, DERIVED PER TRANSCRIPT (landmine 4). The
//           folk "4 chars/token" is ~2x wrong for this workload (measured ≈2.0),
//           so nothing here divides by a constant. The FIRST window is excluded
//           from calibration: prompt_0 carries the system prompt + tool defs +
//           CLAUDE.md, none of which appear in the transcript, so including it
//           would skew the ratio. Its tokens still count toward TOTAL and land,
//           correctly, in UNATTRIBUTED (reported separately as "preamble").
// category tokens = category chars ÷ ratio.
// UNATTRIBUTED    = TOTAL − Σ category tokens. Printed, never redistributed
//           (landmine 2). It holds the untranscribed preamble, unpersisted
//           thinking, and every char this taxonomy has no bucket for. A residual-
//           composition breakdown says WHAT is in it without smearing it.
//
// Other landmines handled: `usage` repeats verbatim on every JSONL line of one
// response — deduped by requestId (landmine 1; the naive per-line sum is printed
// beside TOTAL so the trap stays visible). `attachment` records are sized on the
// INJECTED field (stdout/content), never the whole record (landmine 4/taxonomy).
// The spawn tool is `Agent`, not `Task` — a `Task` block raises a warning rather
// than being silently mislabeled. `isSidechain` records are excluded: subagent
// internals cost the orchestrator nothing.
//
// D9: per-`subagent_type` attribution of Agent blocks is always emitted. A
// reviewer RETURN share above 3% reopens decision D7.

import { createReadStream, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { tmpdir } from 'node:os';
import path from 'node:path';

// ── Taxonomy ─────────────────────────────────────────────────────────────
const CATS = [
  'human steers',
  'orchestrator prose',
  'authored: Write/Edit inputs',
  'authored: Bash commands',
  'tool results',
  'subagent returns',
  'attach: skill_listing',
  'attach: hook_success',
  'attach: other',
];
const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit']);
const SPAWN_TOOLS = new Set(['Agent']); // per the taxonomy: NOT `Task`

// Size of an injected payload in characters. Strings by length; block arrays by
// their text; anything else by its serialized form (the shape actually injected).
function textSize(v) {
  if (v == null) return 0;
  if (typeof v === 'string') return v.length;
  if (Array.isArray(v)) return v.reduce((n, x) => n + textSize(x), 0);
  if (typeof v === 'object') {
    if (typeof v.text === 'string') return v.text.length;
    if (typeof v.thinking === 'string') return v.thinking.length;
    try { return JSON.stringify(v).length; } catch { return 0; }
  }
  return String(v).length;
}
const blocks = (c) => (Array.isArray(c) ? c : []);
const promptOf = (u) =>
  (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);

// ── The pass ─────────────────────────────────────────────────────────────
export async function analyze(file) {
  const cats = new Map(CATS.map((c) => [c, 0]));
  const residual = new Map();          // label -> chars seen but in no named bucket
  const attachKinds = new Map();       // attachment.type -> chars (diagnostic)
  const toolById = new Map();          // tool_use_id -> { name, subagent_type }
  const agents = new Map();            // subagent_type -> { spawns, spawnChars, returns, returnChars }
  const windows = [];                  // { delta, chars, first }

  let lines = 0, badJson = 0, sidechain = 0;
  let requests = 0, duplicateUsageLines = 0, naiveTotal = 0, outputTokens = 0;
  let attachFallbackSized = 0, taskBlocks = 0;
  let assistantChars = 0;              // persisted assistant-authored chars (output-side coverage)
  let prevPrompt = null, winChars = 0;
  const seen = new Set();

  const add = (cat, n) => { cats.set(cat, cats.get(cat) + n); winChars += n; };
  const res = (label, n) => { residual.set(label, (residual.get(label) || 0) + n); winChars += n; };
  const agentRow = (t) => {
    const k = t || '(unnamed)';
    if (!agents.has(k)) agents.set(k, { spawns: 0, spawnChars: 0, returns: 0, returnChars: 0 });
    return agents.get(k);
  };

  function countAttachment(att) {
    if (!att || typeof att !== 'object') return;
    const kind = typeof att.type === 'string' ? att.type : 'other';
    // Landmine 4: size the INJECTED field, not the record.
    let injected = null;
    for (const k of ['stdout', 'content', 'text', 'output']) {
      if (att[k] != null) { injected = att[k]; break; }
    }
    if (injected == null) { const { type, ...rest } = att; injected = rest; attachFallbackSized++; }
    const n = textSize(injected);
    add(kind === 'skill_listing' ? 'attach: skill_listing'
      : kind === 'hook_success' ? 'attach: hook_success'
        : 'attach: other', n);
    attachKinds.set(kind, (attachKinds.get(kind) || 0) + n);
  }

  function userText(rec, s) {
    const n = s.length;
    if (rec.isCompactSummary) return res('compact summary', n);
    if (rec.isMeta) return res('user:meta', n);
    if (/^\s*<(command-name|command-message|command-args|local-command)/.test(s)) {
      return res('user:slash-command expansion', n);
    }
    add('human steers', n);
  }

  const rl = createInterface({ input: createReadStream(file, 'utf8'), crlfDelay: Infinity });
  for await (const raw of rl) {
    const line = raw.trim();
    if (!line) continue;
    lines++;
    let rec;
    try { rec = JSON.parse(line); } catch { badJson++; continue; }
    if (!rec || typeof rec !== 'object') { badJson++; continue; }
    if (rec.isSidechain === true) { sidechain++; continue; }

    // Attachment records (and attachments hung off any record).
    if (rec.type === 'attachment') countAttachment(rec.attachment || rec);
    for (const a of blocks(rec.attachments)) countAttachment(a.attachment || a);

    if (rec.type === 'assistant') {
      const u = rec.message?.usage;
      if (u) {
        const p = promptOf(u);
        naiveTotal += p;
        const rid = rec.requestId || rec.message?.id || null;
        if (rid && seen.has(rid)) {
          duplicateUsageLines++;             // Landmine 1: same request, later line — usage already counted.
        } else {
          if (rid) seen.add(rid);
          requests++;
          outputTokens += u.output_tokens || 0;
          // Close the window: chars appended since the previous request are what
          // this request's prompt delta paid for.
          windows.push({ delta: prevPrompt == null ? p : Math.max(0, p - prevPrompt), chars: winChars, first: prevPrompt == null });
          prevPrompt = p;
          winChars = 0;
        }
      }
      // Content is NOT duplicated across a request's lines — always count it.
      for (const b of blocks(rec.message?.content)) {
        if (b.type === 'text') { assistantChars += textSize(b.text); add('orchestrator prose', textSize(b.text)); }
        else if (b.type === 'thinking' || b.type === 'redacted_thinking') res('thinking (when persisted)', textSize(b.thinking ?? b.data ?? ''));
        else if (b.type === 'tool_use') {
          let n = 0;
          try { n = JSON.stringify(b.input ?? {}).length; } catch { n = 0; }
          assistantChars += n;
          const name = b.name || '(unnamed)';
          if (b.name === 'Task') taskBlocks++;
          toolById.set(b.id, { name, subagent_type: b.input?.subagent_type });
          if (WRITE_TOOLS.has(name)) add('authored: Write/Edit inputs', n);
          else if (name === 'Bash') add('authored: Bash commands', n);
          else if (SPAWN_TOOLS.has(name)) {
            const row = agentRow(b.input?.subagent_type);
            row.spawns++; row.spawnChars += n;
            res('tool_use:Agent prompts (see D9)', n);
          } else res(`tool_use:${name}`, n);
        }
      }
      continue;
    }

    if (rec.type === 'user') {
      const c = rec.message?.content;
      if (typeof c === 'string') { userText(rec, c); continue; }
      for (const b of blocks(c)) {
        if (b.type === 'text') userText(rec, String(b.text ?? ''));
        else if (b.type === 'tool_result') {
          const n = textSize(b.content);
          const t = toolById.get(b.tool_use_id);
          if (t && SPAWN_TOOLS.has(t.name)) {
            add('subagent returns', n);
            const row = agentRow(t.subagent_type);
            row.returns++; row.returnChars += n;
          } else add('tool results', n);
        } else if (b.type === 'image') res('image block', textSize(b.source?.data ?? ''));
        else res(`user block:${b.type || '?'}`, textSize(b));
      }
      continue;
    }

    if (rec.type === 'system') res('system record', textSize(rec.content ?? rec.text ?? ''));
    else if (rec.type === 'summary') res('summary record', textSize(rec.summary ?? ''));
  }

  // ── Derive, don't assume (landmine 3/4) ────────────────────────────────
  const total = windows.reduce((n, w) => n + w.delta, 0);
  const preamble = windows.length && windows[0].first ? windows[0].delta : 0;
  const cal = windows.filter((w) => !w.first && w.chars > 0);
  const calDelta = cal.reduce((n, w) => n + w.delta, 0);
  const calChars = cal.reduce((n, w) => n + w.chars, 0);
  const ratio = calChars > 0 && calDelta > 0 ? calDelta / calChars : null;

  const charsSeen = [...cats.values()].reduce((a, b) => a + b, 0)
    + [...residual.values()].reduce((a, b) => a + b, 0);
  const rows = CATS.map((name) => {
    const chars = cats.get(name);
    return { name, chars, tokens: ratio ? Math.round(chars / ratio) : null };
  });
  const attributed = rows.reduce((n, r) => n + (r.tokens || 0), 0);
  // Exact by construction: rows + unattributed === total, in integers.
  const unattributed = total - attributed;

  return {
    file, lines, badJson, sidechain, requests, duplicateUsageLines, naiveTotal,
    outputTokens, assistantChars, attachFallbackSized, taskBlocks,
    windows, total, preamble, calDelta, calChars, ratio, trailingChars: winChars,
    charsSeen, rows, attributed, unattributed,
    cats, residual, attachKinds, agents,
  };
}

// ── Report ───────────────────────────────────────────────────────────────
const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (s, w) => String(s).padEnd(w);
const lpad = (s, w) => String(s).padStart(w);
const pct = (x, total) => (total > 0 ? `${((x / total) * 100).toFixed(1)}%` : '—');

function report(r) {
  const name = path.basename(r.file);
  console.log(`context-attrib: ${name}`);
  console.log(`  lines ${n0(r.lines)} · unparsable ${n0(r.badJson)} · sidechain excluded ${n0(r.sidechain)}`);
  console.log(`  requests ${n0(r.requests)} unique · ${n0(r.duplicateUsageLines)} duplicate usage line(s) deduped by requestId`);
  console.log(`  TOTAL context tokens (Σ prompt-delta) ${n0(r.total)}   [naive per-line sum would report ${n0(r.naiveTotal)}${r.total > 0 ? ` — ${(r.naiveTotal / r.total).toFixed(1)}x` : ''}]`);
  console.log(r.ratio
    ? `  calibration ${r.ratio.toFixed(2)} chars/token — DERIVED (${n0(r.calDelta)} tokens ÷ ${n0(r.calChars)} chars, first window excluded); the /4 rule is not used`
    : '  calibration: unavailable (no usable window) — token columns suppressed');
  console.log('');

  const W = 30;
  console.log(`  ${pad('Category', W)}${lpad('chars', 12)}${lpad('tokens', 12)}${lpad('share', 9)}`);
  for (const row of r.rows) {
    console.log(`  ${pad(row.name, W)}${lpad(n0(row.chars), 12)}${lpad(row.tokens == null ? '—' : n0(row.tokens), 12)}${lpad(pct(row.tokens || 0, r.total), 9)}`);
  }
  console.log(`  ${pad('UNATTRIBUTED (residual)', W)}${lpad('—', 12)}${lpad(n0(r.unattributed), 12)}${lpad(pct(r.unattributed, r.total), 9)}`);
  console.log(`  ${pad('TOTAL', W)}${lpad(n0(r.charsSeen), 12)}${lpad(n0(r.total), 12)}${lpad(r.total > 0 ? '100.0%' : '—', 9)}`);
  console.log('  (residual is printed, never redistributed across categories)');
  console.log('');

  console.log('  residual composition — known components inside UNATTRIBUTED (indicative: calibration');
  console.log('  slack is the remainder, so these need not sum to it, and can exceed it):');
  console.log(`    ${pad('session preamble (system prompt + tool defs, absent from transcript)', 62)}${lpad(n0(r.preamble), 10)} tok`);
  const comp = [...r.residual.entries()].sort((a, b) => b[1] - a[1]);
  for (const [label, chars] of comp) {
    console.log(`    ${pad(label, 62)}${lpad(n0(chars), 10)} chars${r.ratio ? ` (~${n0(Math.round(chars / r.ratio))} tok)` : ''}`);
  }
  if (!comp.length) console.log('    (no unbucketed chars seen)');
  if (r.trailingChars) console.log(`    ${pad('appended after the last request (never billed as a delta)', 62)}${lpad(n0(r.trailingChars), 10)} chars`);
  console.log('');

  if (r.ratio && r.outputTokens > 0) {
    const persisted = Math.round(r.assistantChars / r.ratio);
    const missing = 1 - persisted / r.outputTokens;
    console.log(`  output-side coverage: Σ output ${n0(r.outputTokens)} tok · persisted assistant text ≈ ${n0(persisted)} tok · ${missing > 0
      ? `~${(missing * 100).toFixed(0)}% has no persisted text (thinking is not written to the transcript)`
      : 'n/a — attributed text exceeds output tokens (calibration slack; treat this line as unusable for this transcript)'}`);
    console.log('');
  }

  // ── D9 ────────────────────────────────────────────────────────────────
  console.log('  D9 — per-subagent_type attribution (Agent blocks)');
  const rowsA = [...r.agents.entries()].sort((a, b) => b[1].returnChars - a[1].returnChars);
  if (!rowsA.length) console.log('    (no Agent tool_use blocks in this transcript)');
  else {
    console.log(`    ${pad('subagent_type', 20)}${lpad('spawns', 8)}${lpad('spawn chars', 13)}${lpad('returns', 9)}${lpad('return chars', 14)}${lpad('return tok', 12)}${lpad('share', 8)}`);
    for (const [t, a] of rowsA) {
      const tok = r.ratio ? Math.round(a.returnChars / r.ratio) : null;
      console.log(`    ${pad(t, 20)}${lpad(n0(a.spawns), 8)}${lpad(n0(a.spawnChars), 13)}${lpad(n0(a.returns), 9)}${lpad(n0(a.returnChars), 14)}${lpad(tok == null ? '—' : n0(tok), 12)}${lpad(pct(tok || 0, r.total), 8)}`);
    }
  }
  const rev = r.agents.get('reviewer');
  if (!rev) console.log('    reviewer: no Agent blocks — D7 reopen test not exercised by this transcript');
  else {
    const tok = r.ratio ? Math.round(rev.returnChars / r.ratio) : 0;
    const share = r.total > 0 ? (tok / r.total) * 100 : 0;
    console.log(`    reviewer return share = ${share.toFixed(1)}% — ${share > 3
      ? 'EXCEEDS 3% → REOPENS decision D7 (reviewer untouched in v1)'
      : 'at or under 3% → D7 stands (reviewer untouched in v1)'}`);
  }
  if (r.taskBlocks) console.log(`  warn: ${n0(r.taskBlocks)} \`Task\` tool_use block(s) seen — the spawn tool is \`Agent\`; taxonomy may have drifted`);
  if (r.attachFallbackSized) console.log(`  warn: ${n0(r.attachFallbackSized)} attachment(s) had no stdout/content/text/output field — sized on the record minus \`type\``);
}

// ── Selftest ─────────────────────────────────────────────────────────────
const failures = [];
function check(name, cond, detail) {
  if (cond) console.log(`  ok   ${name}`);
  else { console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); failures.push(name); }
}

// A ~20-line synthetic transcript in a throwaway dir. No real transcript is ever
// touched here — this is the ONLY fixture the harness knows.
function buildFixture(dir) {
  const p = path.join(dir, 'fixture.jsonl');
  const usage = (input, cc, cr, out) => ({
    input_tokens: input, cache_creation_input_tokens: cc, cache_read_input_tokens: cr, output_tokens: out,
  });
  const A = (requestId, content, u) => ({ type: 'assistant', isSidechain: false, requestId, message: { role: 'assistant', content, usage: u } });
  const U = (content, extra = {}) => ({ type: 'user', isSidechain: false, message: { role: 'user', content }, ...extra });

  const recs = [
    U(F.steer1),                                                                    // human steer
    A('req-1', [{ type: 'text', text: F.prose1 }, { type: 'tool_use', id: 't1', name: 'Bash', input: { command: F.bashCmd } }], usage(1200, 0, 0, 50)),
    U([{ type: 'tool_result', tool_use_id: 't1', content: F.toolResult1 }]),
    // Same requestId, later line of the SAME response: usage repeats verbatim.
    A('req-1', [{ type: 'tool_use', id: 't2', name: 'Write', input: { file_path: '/x/y.md', content: F.writeBody } }], usage(1200, 0, 0, 50)),
    U([{ type: 'tool_result', tool_use_id: 't2', content: 'File created' }]),
    // Attachments: each carries a large field that must NOT be counted.
    { type: 'attachment', attachment: { type: 'skill_listing', content: F.skills, junkMetadata: 'J'.repeat(4000) } },
    { type: 'attachment', attachment: { type: 'hook_success', stdout: F.hookOut, command: 'C'.repeat(5000), cwd: '/x' } },
    { type: 'attachment', attachment: { type: 'file_content', content: F.otherAtt } },
    A('req-2', [
      { type: 'thinking', thinking: F.think },
      { type: 'text', text: F.prose2 },
      { type: 'tool_use', id: 't3', name: 'Agent', input: { subagent_type: 'reviewer', description: 'review', prompt: F.spawnPrompt } },
    ], usage(0, 800, 1200, 400)),
    U([{ type: 'tool_result', tool_use_id: 't3', content: [{ type: 'text', text: F.reviewReturn }] }]),
    U([{ type: 'tool_result', tool_use_id: 'orphan-id', content: F.toolResult2 }]),
    { type: 'assistant', isSidechain: true, requestId: 'side-1', message: { role: 'assistant', content: [{ type: 'text', text: 'X'.repeat(500) }], usage: usage(0, 0, 5000, 100) } },
    A('req-3', [{ type: 'text', text: F.prose3 }], usage(0, 600, 2000, 40)),
    U(F.steer2),
    { type: 'summary', summary: 'a compacted summary record' },
  ];
  const body = recs.map((r) => JSON.stringify(r)).join('\n') + '\n{not json\n';
  writeFileSync(p, body);
  return p;
}

// Fixture payloads, sized so the true chars/token ratio is deliberately ≈1, far
// from the folk 4.0 — a hardcoded `/4` cannot reproduce these numbers.
const F = {
  steer1: 'S'.repeat(60),
  steer2: 'T'.repeat(40),
  prose1: 'P'.repeat(80),
  prose2: 'Q'.repeat(70),
  prose3: 'R'.repeat(30),
  bashCmd: 'B'.repeat(90),
  writeBody: 'W'.repeat(200),
  toolResult1: 'L'.repeat(300),
  toolResult2: 'M'.repeat(120),
  skills: 'K'.repeat(150),
  hookOut: 'H'.repeat(120),
  otherAtt: 'O'.repeat(80),
  think: 'I'.repeat(220),
  spawnPrompt: 'G'.repeat(100),
  reviewReturn: 'V'.repeat(250),
};

async function selftest() {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxattrib-'));
  try {
    const r = await analyze(buildFixture(dir));

    // 1. Landmine 1 — a repeated `usage` block is counted ONCE.
    check('dedup: duplicate requestId usage counted once',
      r.requests === 3 && r.duplicateUsageLines === 1 && r.total === 2600,
      `requests=${r.requests} dup=${r.duplicateUsageLines} total=${r.total} (expected 3/1/2600)`);
    check('dedup: the naive per-line sum is strictly larger (the trap is real)',
      r.naiveTotal === 7000 && r.naiveTotal > r.total,
      `naive=${r.naiveTotal} total=${r.total}`);

    // 2. Landmine 2 — the books balance EXACTLY, with the residual printed.
    const sum = r.rows.reduce((n, x) => n + x.tokens, 0);
    check('exact sum: Σ categories + UNATTRIBUTED === TOTAL',
      sum + r.unattributed === r.total,
      `${sum} + ${r.unattributed} !== ${r.total}`);
    check('residual is non-zero and not redistributed',
      r.unattributed !== 0 && r.preamble === 1200,
      `unattributed=${r.unattributed} preamble=${r.preamble}`);

    // 3. Landmine 3 — the ratio is DERIVED per transcript, never hardcoded /4.
    check('calibration: ratio === Σcal-delta ÷ Σcal-chars (derived)',
      r.ratio === r.calDelta / r.calChars && r.calDelta === 1400,
      `ratio=${r.ratio} calDelta=${r.calDelta} calChars=${r.calChars}`);
    check('calibration: fixture ratio is far from the folk 4.0',
      Math.abs(r.ratio - 4) > 1,
      `ratio=${r.ratio}`);
    const bash = r.rows.find((x) => x.name === 'authored: Bash commands');
    check('calibration: category tokens use the derived ratio, not /4',
      bash.tokens === Math.round(bash.chars / r.ratio) && bash.tokens !== Math.round(bash.chars / 4),
      `chars=${bash.chars} tokens=${bash.tokens} /4=${Math.round(bash.chars / 4)}`);

    // 4. Landmine 4 — attachments sized on the INJECTED field, not the record.
    const cat = (n) => r.rows.find((x) => x.name === n).chars;
    check('attachment: hook_success sized on stdout, not the record',
      cat('attach: hook_success') === F.hookOut.length,
      `${cat('attach: hook_success')} !== ${F.hookOut.length} (record carries 5k of junk)`);
    check('attachment: skill_listing sized on content, not the record',
      cat('attach: skill_listing') === F.skills.length,
      `${cat('attach: skill_listing')} !== ${F.skills.length} (record carries 4k of junk)`);
    check('attachment: unknown kind lands in attach: other',
      cat('attach: other') === F.otherAtt.length, `${cat('attach: other')}`);

    // 5. D9 — an Agent result lands under its subagent_type (spawn tool = Agent).
    const rev = r.agents.get('reviewer');
    check('D9: Agent result attributed to its subagent_type',
      !!rev && rev.returnChars === F.reviewReturn.length && rev.spawns === 1 && rev.spawnChars > 0,
      rev ? `returnChars=${rev.returnChars} spawns=${rev.spawns}` : 'no reviewer row');
    check('D9: the same bytes also form the `subagent returns` category',
      cat('subagent returns') === F.reviewReturn.length, `${cat('subagent returns')}`);

    // Hygiene: taxonomy boundaries that would silently corrupt a split.
    check('sidechain records excluded (subagent internals cost the orchestrator nothing)',
      r.sidechain === 1 && !r.rows.some((x) => x.chars >= 500), `sidechain=${r.sidechain}`);
    check('human steers counted; unparsable lines counted, not fatal',
      cat('human steers') === F.steer1.length + F.steer2.length && r.badJson === 1,
      `steers=${cat('human steers')} badJson=${r.badJson}`);
    check('tool results exclude subagent returns',
      cat('tool results') === F.toolResult1.length + 'File created'.length + F.toolResult2.length,
      `${cat('tool results')}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  if (failures.length) {
    console.error(`\ncontext-attrib selftest: ${failures.length} failure(s)`);
    process.exit(1);
  }
  console.log('context-attrib selftest: clean');
}

// ── CLI ──────────────────────────────────────────────────────────────────
const arg = process.argv[2];
if (arg === '--selftest') {
  await selftest();
} else if (!arg || arg === '-h' || arg === '--help') {
  console.error('usage: node tools/context-attrib.mjs <transcript.jsonl> | --selftest');
  process.exit(arg ? 0 : 1);
} else {
  report(await analyze(path.resolve(arg)));
}
