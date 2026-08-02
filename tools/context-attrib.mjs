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
// CHARS are the PRIMARY figure everywhere below: they are counted, not modelled.
//           Every TOKEN figure is an ESTIMATE and is printed as a BAND, never as a
//           bare point value (OQ6, resolved 2026-08-02: zero-dep, chars primary).
// churnRatio = Σ chars-appended ÷ Σ prompt-delta, derived per transcript, first
//           window excluded (prompt_0 carries the system prompt + tool defs +
//           CLAUDE.md, none of which appear in the transcript; its tokens still
//           count toward TOTAL and land, correctly, in UNATTRIBUTED as "preamble").
//           This is a DIAGNOSTIC ONLY and is NO LONGER a token converter. It is
//           depressed by however much prompt growth carries no persisted chars at
//           all — this repo's baseline derives ≈1.5, roughly 3x below any plausible
//           tokenizer — so converting category chars through it inflated every token
//           column ~3x (D1 re-scope memo M7). Retired as a converter by D10(b).
// ENVELOPE = the chars/token estimator that replaced it. Per unique request,
//           q = persisted assistant chars ÷ that request's output_tokens.
//           Unpersisted thinking spends output tokens WITHOUT producing chars, so
//           it can only DEPRESS q; it can never inflate it. Every q is therefore a
//           FLOOR on the true chars/token of persisted text, and the largest q is
//           the tightest measured floor. Reported as median / p90 / max with n.
//           BAND used for token columns = [p90 .. max] chars/token; p90 is the
//           tail-robust endpoint, max the tightest. Known bias: serialized
//           `tool_use` JSON is counted as assistant text and tokenizes differently
//           from prose, so q is a floor on a MIXED corpus, not on prose.
// category tokens = chars ÷ band = the RANGE [chars/max .. chars/p90]. Because both
//           endpoints are floors on the ratio, the whole range is an UPPER region:
//           the true token count is at or below the high end always, and at or
//           below the low end if the max-q request is trusted.
// char-free prompt growth = TOTAL − attributed tokens − residual-chars tokens −
//           preamble: prompt growth carrying NO persisted characters. QUANTIFIED
//           here, NOT explained (unpersisted thinking vs. cached system/tool-def
//           re-injection vs. something else are not distinguished by this
//           instrument). Tracked open item feeding the post-P0.5 re-decision.
// degenerate usage = a request whose prompt (input+creation+read) is 0 is NOT an
//           observation that context is empty — it is a request carrying no usable
//           usage data. It is skipped as a prompt observation (no window, no
//           `prevPrompt` overwrite) and counted in `degenerateUsage`, which is
//           always printed. See the guard's comment for the 24.4% it manufactured.
// collapses = every request where prompt < previous prompt. Ledgered (index, line,
//           before, after, drop) with Σ collapse mass, because TOTAL is Σ POSITIVE
//           deltas only: `TOTAL − Σ collapse mass = final prompt` exactly, and that
//           ratchet identity is printed with a PASS/FAIL as a model self-check.
// UNATTRIBUTED    = TOTAL − Σ category tokens. Printed, never redistributed
//           (landmine 2). It holds the untranscribed preamble, the char-free mass,
//           and every char this taxonomy has no bucket for. A residual-composition
//           breakdown says WHAT is in it without smearing it, and the books close
//           in integers: attributed + residual-chars + preamble + char-free = TOTAL
//           at EACH band endpoint.
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
  const collapses = [];                // { idx, line, before, after, drop, compactAdjacent }
  const outByReq = new Map();          // requestId -> { chars, out } for the envelope estimator

  let lines = 0, badJson = 0, sidechain = 0;
  let requests = 0, duplicateUsageLines = 0, naiveTotal = 0, outputTokens = 0;
  let attachFallbackSized = 0, attachFallbackChars = 0, taskBlocks = 0;
  let assistantChars = 0;              // persisted assistant-authored chars (output-side coverage)
  let degenerateUsage = 0;             // unique requests whose usage carried prompt = 0
  let compactSummaryRecords = 0;       // records with isCompactSummary === true (any type)
  let compactSincePrev = false;        // a compact summary sits between the last request and this one
  let prevPrompt = null, winChars = 0;
  const seen = new Set();

  const add = (cat, n) => { cats.set(cat, cats.get(cat) + n); winChars += n; };
  const res = (label, n) => { residual.set(label, (residual.get(label) || 0) + n); winChars += n; };
  // Per-request output-side ledger. Chars accumulate across EVERY line of a response
  // (content is not duplicated); `out` is set once, from the deduped usage block, and
  // only for a request that also carried a usable prompt — a degenerate (prompt = 0)
  // record is excluded here for the same reason it is excluded from TOTAL: its usage
  // block is not trustworthy data.
  const outRow = (rid) => {
    const k = rid || '(no-request-id)';
    if (!outByReq.has(k)) outByReq.set(k, { chars: 0, out: 0 });
    return outByReq.get(k);
  };
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
    const fellBack = injected == null;
    if (fellBack) { const { type, ...rest } = att; injected = rest; attachFallbackSized++; }
    const n = textSize(injected);
    // The field-picker order is an ASSUMPTION about the attachment schema; report the
    // MASS it mis-sizes, not just the count, so its blast radius is judgeable.
    if (fellBack) attachFallbackChars += n;
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
    // Adjacency only — NOT a model of why a collapse happened. Used solely to mark
    // collapses that have no compact summary in front of them as unexplained.
    if (rec.isCompactSummary === true) { compactSummaryRecords++; compactSincePrev = true; }

    // Attachment records (and attachments hung off any record).
    if (rec.type === 'attachment') countAttachment(rec.attachment || rec);
    for (const a of blocks(rec.attachments)) countAttachment(a.attachment || a);

    if (rec.type === 'assistant') {
      // Hoisted out of the usage branch: the content loop below needs it too, so the
      // envelope estimator can bill a response's chars to the request that emitted them
      // even on lines that carry no usage block.
      const rid = rec.requestId || rec.message?.id || null;
      const u = rec.message?.usage;
      if (u) {
        const p = promptOf(u);
        naiveTotal += p;
        if (rid && seen.has(rid)) {
          duplicateUsageLines++;             // Landmine 1: same request, later line — usage already counted.
        } else if (p === 0) {
          // FAIL CLOSED BY SHAPE. prompt = 0 is not "the context is empty"; it is a
          // usage block with no usable prompt data. Treating it as an observation
          // zeroes `prevPrompt`, so the ENTIRE resident context is re-billed as fresh
          // churn by the next real request: on this repo's baseline that manufactured
          // 513,634 tok = 24.4% of TOTAL (memo M2 row 5, 2026-08-02 D1 re-scope memo).
          // So: no window, no `prevPrompt` overwrite, and the open window's chars keep
          // accumulating into the next real request, which is the request that actually
          // paid for them. The rid IS marked seen, so a repeated line of the same
          // degenerate response counts as a duplicate, not as a second degenerate.
          if (rid) seen.add(rid);
          degenerateUsage++;
        } else {
          if (rid) seen.add(rid);
          requests++;
          outputTokens += u.output_tokens || 0;
          outRow(rid).out = u.output_tokens || 0;
          // TOTAL is Σ POSITIVE deltas: a shrinking prompt contributes 0, never a
          // negative. Ledger the shrink so the ratchet is auditable rather than silent.
          if (prevPrompt != null && p < prevPrompt) {
            collapses.push({
              idx: requests, line: lines, before: prevPrompt, after: p,
              drop: prevPrompt - p, compactAdjacent: compactSincePrev,
            });
          }
          // Close the window: chars appended since the previous request are what
          // this request's prompt delta paid for.
          windows.push({ delta: prevPrompt == null ? p : Math.max(0, p - prevPrompt), chars: winChars, first: prevPrompt == null });
          prevPrompt = p;
          winChars = 0;
          compactSincePrev = false;
        }
      }
      // Content is NOT duplicated across a request's lines — always count it.
      for (const b of blocks(rec.message?.content)) {
        if (b.type === 'text') {
          assistantChars += textSize(b.text); outRow(rid).chars += textSize(b.text);
          add('orchestrator prose', textSize(b.text));
        } else if (b.type === 'thinking' || b.type === 'redacted_thinking') {
          // Persisted thinking chars WERE emitted by the model and DID cost output
          // tokens, so they belong in the estimator's numerator (they tighten the
          // floor). They stay out of `assistantChars`, whose separate job is to
          // measure how much output text never reached the transcript at all.
          const n = textSize(b.thinking ?? b.data ?? '');
          outRow(rid).chars += n;
          res('thinking (when persisted)', n);
        }
        else if (b.type === 'tool_use') {
          let n = 0;
          try { n = JSON.stringify(b.input ?? {}).length; } catch { n = 0; }
          assistantChars += n;
          outRow(rid).chars += n;
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
  // The ratchet identity (memo M3). The prompt series starts at 0 and every step is
  // either a positive delta (billed into TOTAL) or a collapse (billed into
  // collapseMass), so this is EXACT by construction. A FAIL means the model drifted.
  const collapseMass = collapses.reduce((n, c) => n + c.drop, 0);
  const finalPrompt = prevPrompt == null ? 0 : prevPrompt;
  const ratchetOk = total - collapseMass === finalPrompt;
  const unexplainedCollapses = collapses.filter((c) => !c.compactAdjacent);
  const cal = windows.filter((w) => !w.first && w.chars > 0);
  const calDelta = cal.reduce((n, w) => n + w.delta, 0);
  const calChars = cal.reduce((n, w) => n + w.chars, 0);
  // chars PER TOKEN. DIAGNOSTIC ONLY since D10(b) — see the header: this is
  // prompt-growth chars per prompt-growth token, and prompt growth that carries no
  // characters at all drags it ~3x below any real tokenizer. Deriving it as
  // calDelta/calChars would yield tokens-per-char and, divided into chars, inflate
  // every category by 1/ratio^2 — invisible in a fixture whose ratio ≈ 1.
  const churnRatio = calChars > 0 && calDelta > 0 ? calChars / calDelta : null;

  // ── The output-side envelope estimator (D10b as amended by OQ6) ─────────
  // q = persisted assistant chars ÷ output_tokens, per unique request. Requests
  // below MIN_OUT output tokens are dropped: a denominator of a few tokens turns
  // rounding into an outlier, and the statistic we care about lives in the upper
  // tail. Requests with no persisted chars are dropped too — q = 0 carries no
  // information about chars/token, it only says the response was all thinking.
  const MIN_OUT = 20;
  const envSamples = [...outByReq.values()]
    .filter((x) => x.out >= MIN_OUT && x.chars > 0)
    .map((x) => x.chars / x.out)
    .sort((a, b) => a - b);
  // Type-7 (linear-interpolation) quantile — the same definition R and numpy use by
  // default. Nearest-rank would collapse p90 onto max for any n < 11 and hide a
  // p90/max mix-up behind a degenerate band.
  const quantile = (xs, p) => {
    if (!xs.length) return null;
    if (xs.length === 1) return xs[0];
    const h = (xs.length - 1) * p;
    const lo = Math.floor(h);
    return xs[lo] + (h - lo) * (xs[Math.min(lo + 1, xs.length - 1)] - xs[lo]);
  };
  const env = envSamples.length
    ? {
      n: envSamples.length,
      median: quantile(envSamples, 0.5),
      p90: quantile(envSamples, 0.9),
      max: envSamples[envSamples.length - 1],
      dropped: outByReq.size - envSamples.length,
    }
    : null;
  // The band, low ratio first. Both endpoints are FLOORS on chars/token, so
  // chars/bandLo is the LARGER token figure. Never a point value (OQ6).
  const bandLo = env ? env.p90 : null;   // tail-robust floor
  const bandHi = env ? env.max : null;   // tightest floor

  const residualChars = [...residual.values()].reduce((a, b) => a + b, 0);
  const charsSeen = [...cats.values()].reduce((a, b) => a + b, 0) + residualChars;
  const tokAt = (chars, r) => (r ? Math.round(chars / r) : null);
  const rows = CATS.map((name) => {
    const chars = cats.get(name);
    // tokHi rides bandLo and vice versa: dividing by the SMALLER ratio yields MORE
    // tokens. Naming them by the token they produce, not by the ratio they use.
    return { name, chars, tokLo: tokAt(chars, bandHi), tokHi: tokAt(chars, bandLo) };
  });
  const attributedLo = rows.reduce((n, r) => n + (r.tokLo || 0), 0);
  const attributedHi = rows.reduce((n, r) => n + (r.tokHi || 0), 0);
  // Residual CHARS are persisted too (thinking-when-persisted, tool_use JSON, compact
  // summaries...) — they are simply outside the named taxonomy. Converting them is
  // what lets the char-free line mean "no persisted characters" rather than "no
  // characters in a named bucket".
  const residualTokLo = tokAt(residualChars, bandHi);
  const residualTokHi = tokAt(residualChars, bandLo);
  // Char-free is the REMAINDER, so the books close in integers by construction at each
  // endpoint: attributed + residual-chars + preamble + char-free === TOTAL. Being a
  // remainder is exactly why it is a QUANTITY and not an EXPLANATION.
  const charFreeLo = env === null ? null : total - attributedHi - residualTokHi - preamble;
  const charFreeHi = env === null ? null : total - attributedLo - residualTokLo - preamble;
  // Exact by construction: rows + unattributed === total, in integers.
  const unattributedLo = env === null ? null : total - attributedHi;
  const unattributedHi = env === null ? null : total - attributedLo;

  return {
    file, lines, badJson, sidechain, requests, duplicateUsageLines, naiveTotal,
    outputTokens, assistantChars, attachFallbackSized, attachFallbackChars, taskBlocks,
    windows, total, preamble, calDelta, calChars, churnRatio, trailingChars: winChars,
    degenerateUsage, compactSummaryRecords, env, bandLo, bandHi, envSamples,
    collapses, collapseMass, finalPrompt, ratchetOk, unexplainedCollapses,
    charsSeen, residualChars, rows,
    attributedLo, attributedHi, residualTokLo, residualTokHi,
    charFreeLo, charFreeHi, unattributedLo, unattributedHi,
    cats, residual, attachKinds, agents,
  };
}

// ── Report ───────────────────────────────────────────────────────────────
const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (s, w) => String(s).padEnd(w);
const lpad = (s, w) => String(s).padStart(w);
const pct = (x, total) => (total > 0 ? `${((x / total) * 100).toFixed(1)}%` : '—');
// A token figure never appears as a bare point value (OQ6): it is always a range
// derived from the two ends of the chars/token band, or a dash when the band is
// unavailable. Chars, by contrast, are counted and print plainly.
const band = (lo, hi) => (lo == null || hi == null ? '—' : (lo === hi ? n0(lo) : `${n0(lo)}–${n0(hi)}`));
const bandPct = (lo, hi, total) => (lo == null || hi == null || total <= 0
  ? '—'
  : (lo === hi
    ? pct(lo, total)
    : `${((lo / total) * 100).toFixed(1)}–${((hi / total) * 100).toFixed(1)}%`));

function report(r) {
  const name = path.basename(r.file);
  console.log(`context-attrib: ${name}`);
  console.log('  [MEASURED] = counted from the transcript · [EST/BAND] = rides the chars/token band below');
  console.log(`  lines ${n0(r.lines)} · unparsable ${n0(r.badJson)} · sidechain excluded ${n0(r.sidechain)}`);
  console.log(`  requests ${n0(r.requests)} unique · ${n0(r.duplicateUsageLines)} duplicate usage line(s) deduped by requestId`);
  // Always printed, including the 0 case: a silently skipped record is the same
  // failure class as a suppressed verdict.
  console.log(`  degenerate usage records skipped ${n0(r.degenerateUsage)} (prompt = 0 → no usable prompt observation; not billed, does not reset the series)`);
  console.log(`  TOTAL context tokens (Σ prompt-delta) ${n0(r.total)} [MEASURED]   [naive per-line sum would report ${n0(r.naiveTotal)}${r.total > 0 ? ` — ${(r.naiveTotal / r.total).toFixed(1)}x` : ''}]`);
  console.log('');

  // ── chars/token band — the ONLY place a token conversion is licensed ───
  console.log('  chars/token — OUTPUT-SIDE ENVELOPE ESTIMATOR (zero-dep; no tokenizer is run)');
  if (!r.env) {
    console.log('    unavailable — no request carried both output tokens and persisted chars.');
    console.log('    Every token column below is suppressed. CHAR columns are unaffected.');
  } else {
    console.log(`    method: per unique request, q = persisted assistant chars ÷ that request's output_tokens.`);
    console.log('    Unpersisted thinking spends output tokens and produces no chars, so it can only');
    console.log('    DEPRESS q. Every q is therefore a FLOOR on the true chars/token, never a ceiling.');
    console.log(`    n = ${n0(r.env.n)} qualifying request(s) [MEASURED] · ${n0(r.env.dropped)} dropped (output_tokens < 20 or no persisted chars)`);
    console.log(`    median ${r.env.median.toFixed(2)} · p90 ${r.env.p90.toFixed(2)} · max ${r.env.max.toFixed(2)}  chars/token (each a floor)`);
    console.log(`    BAND USED BELOW: ${r.bandLo.toFixed(2)} – ${r.bandHi.toFixed(2)} chars/token (p90 … max)`);
    console.log('    Read it as: the true ratio is AT LEAST the low end, so every token figure below is');
    console.log('    an UPPER region — at or below its high end always, at or below its low end if the');
    console.log('    max-q request is trusted. THE BAND NARROWS, IT NEVER CLOSES: only a real tokenizer');
    console.log('    could put a ceiling on the ratio, and this instrument deliberately runs none.');
    console.log('    Known bias: serialized `tool_use` JSON is counted as assistant text and tokenizes');
    console.log('    differently from prose, so this is a floor on a MIXED corpus, not on prose.');
  }
  console.log(r.churnRatio
    // Print the derivation in the SAME order it is computed (chars ÷ tokens), so a
    // human re-deriving it by hand lands on this number and not on its reciprocal.
    ? `    prompt-side churn ratio ${r.churnRatio.toFixed(2)} chars/token — DERIVED (${n0(r.calChars)} chars ÷ ${n0(r.calDelta)} tokens, first window excluded) — DIAGNOSTIC ONLY, NOT a token converter: it is depressed by char-free growth (D10b, memo M7). The /4 rule is not used either.`
    : '    prompt-side churn ratio: unavailable (no usable window)');
  console.log('');

  // ── Collapse ledger + ratchet identity ────────────────────────────────
  console.log(`  collapse ledger — requests where prompt SHRANK (${n0(r.collapses.length)} collapse(s) · Σ collapse mass ${n0(r.collapseMass)} tok)`);
  console.log(`    ${pad('#', 4)}${lpad('req idx', 9)}${lpad('line', 9)}${lpad('before', 12)}${lpad('after', 12)}${lpad('drop', 12)}  compact summary before it?`);
  if (!r.collapses.length) console.log('    (none — the prompt series never shrank)');
  r.collapses.forEach((c, i) => {
    console.log(`    ${pad(i + 1, 4)}${lpad(n0(c.idx), 9)}${lpad(n0(c.line), 9)}${lpad(n0(c.before), 12)}${lpad(n0(c.after), 12)}${lpad(n0(c.drop), 12)}  ${c.compactAdjacent ? 'yes' : 'NO — unexplained'}`);
  });
  console.log('    (req idx = 1-based index over unique requests with usable usage; line = non-blank transcript line)');
  if (r.unexplainedCollapses.length) {
    // Reported, NOT modelled: root-causing one needs single-record schema inspection,
    // which is not measurement. Tracked as a non-blocking item in the mission ledger.
    console.log(`    note: ${n0(r.unexplainedCollapses.length)} collapse(s) have no compact-summary record between them and the previous request — UNEXPLAINED by this instrument, and deliberately not modelled here (tracked, non-blocking).`);
  }
  console.log(`    compact-summary records seen: ${n0(r.compactSummaryRecords)} (isCompactSummary === true; a grep for the bare string over-counts)`);
  console.log(`  ratchet identity: Σ positive deltas ${n0(r.total)} − Σ collapse mass ${n0(r.collapseMass)} = ${n0(r.total - r.collapseMass)} vs final prompt ${n0(r.finalPrompt)} — ${r.ratchetOk ? 'PASS' : 'FAIL (the accounting model has drifted — do not trust TOTAL)'}`);
  console.log(`  ratchet ${r.finalPrompt > 0 ? `${(r.total / r.finalPrompt).toFixed(3)}x` : 'n/a'} — TOTAL is CHURN (what accumulation cost), not occupancy (what sits in the window at the end)`);
  console.log('');

  // ── The split. CHARS FIRST: they are counted. Tokens ride the band. ────
  const W = 30;
  console.log('  CHARS are the primary column — counted, model-free, exact. TOKENS are an estimate');
  console.log('  and are shown as the range the chars/token band admits. There is no point value.');
  console.log(`  ${pad('Category', W)}${lpad('chars [MEAS]', 14)}${lpad('char %', 9)}${lpad('tokens [EST/BAND]', 21)}${lpad('tok % [BAND]', 14)}`);
  for (const row of r.rows) {
    console.log(`  ${pad(row.name, W)}${lpad(n0(row.chars), 14)}${lpad(pct(row.chars, r.charsSeen), 9)}${lpad(band(row.tokLo, row.tokHi), 21)}${lpad(bandPct(row.tokLo, row.tokHi, r.total), 14)}`);
  }
  console.log(`  ${pad('UNATTRIBUTED (residual)', W)}${lpad('—', 14)}${lpad('—', 9)}${lpad(band(r.unattributedLo, r.unattributedHi), 21)}${lpad(bandPct(r.unattributedLo, r.unattributedHi, r.total), 14)}`);
  console.log(`  ${pad('TOTAL', W)}${lpad(n0(r.charsSeen), 14)}${lpad(r.charsSeen > 0 ? '100.0%' : '—', 9)}${lpad(n0(r.total), 21)}${lpad(r.total > 0 ? '100.0%' : '—', 14)}`);
  console.log('  (residual is printed, never redistributed across categories. char % is of all appended');
  console.log('   chars; tok % is of TOTAL prompt growth — DIFFERENT denominators, do not mix them.)');
  console.log('');

  // ── The char-free mass, as its own line (D10b step 3) ─────────────────
  console.log('  char-free prompt growth — growth that carried NO persisted characters');
  if (r.charFreeLo == null) {
    console.log('    unavailable — the chars/token band could not be estimated.');
  } else {
    console.log(`    = TOTAL − attributed tokens − residual-char tokens − session preamble  [EST/BAND]`);
    console.log(`    ${band(r.charFreeLo, r.charFreeHi)} tok · ${bandPct(r.charFreeLo, r.charFreeHi, r.total)} of TOTAL`);
    console.log(`    books close in integers at EACH endpoint: ${n0(r.attributedHi)} + ${n0(r.residualTokHi)} + ${n0(r.preamble)} + ${n0(r.charFreeLo)} = ${n0(r.attributedHi + r.residualTokHi + r.preamble + r.charFreeLo)} = TOTAL (low end)`);
    console.log(`                                              ${n0(r.attributedLo)} + ${n0(r.residualTokLo)} + ${n0(r.preamble)} + ${n0(r.charFreeHi)} = ${n0(r.attributedLo + r.residualTokLo + r.preamble + r.charFreeHi)} = TOTAL (high end)`);
    if (r.charFreeLo < 0) {
      console.log('    WARN: the low end is NEGATIVE — at the band\'s low ratio this transcript over-attributes.');
      console.log('    That endpoint is not sustainable here; treat only the high end as informative, and');
      console.log('    suspect either a short transcript dominated by preamble or a bad p90 sample.');
    }
    console.log('    QUANTIFIED, NOT EXPLAINED. This line says HOW MUCH growth carried no characters. It');
    console.log('    does NOT say why. Unpersisted thinking, cached system/tool-def re-injection, and');
    console.log('    anything else are NOT distinguished by this instrument — it cannot see them. The');
    console.log('    explanation is a tracked open item feeding the post-P0.5 re-decision; do not read');
    console.log('    this number as a diagnosis, and do not size a lever off it.');
  }
  console.log('');

  console.log('  residual composition — known components inside UNATTRIBUTED. CHARS are exact; the');
  console.log('  token figures ride the band, so these need not sum to UNATTRIBUTED and can exceed it:');
  console.log(`    ${pad('session preamble (system prompt + tool defs, absent from transcript)', 62)}${lpad(n0(r.preamble), 10)} tok [MEASURED]`);
  const comp = [...r.residual.entries()].sort((a, b) => b[1] - a[1]);
  for (const [label, chars] of comp) {
    const tk = r.bandLo ? ` (${band(Math.round(chars / r.bandHi), Math.round(chars / r.bandLo))} tok)` : '';
    console.log(`    ${pad(label, 62)}${lpad(n0(chars), 10)} chars${tk}`);
  }
  if (!comp.length) console.log('    (no unbucketed chars seen)');
  if (r.trailingChars) console.log(`    ${pad('appended after the last request (never billed as a delta)', 62)}${lpad(n0(r.trailingChars), 10)} chars`);
  console.log('');

  if (r.bandHi && r.outputTokens > 0) {
    // Evaluated at the band's HIGH ratio (max q). That endpoint makes the line
    // well-defined by construction: chars_i / max ≤ out_i for every request, so
    // `persisted` can never exceed Σ output and the percentage can never go negative
    // — which is exactly what the retired churn ratio used to do here.
    const persisted = Math.round(r.assistantChars / r.bandHi);
    const missing = 1 - persisted / r.outputTokens;
    console.log(`  output-side coverage: Σ output ${n0(r.outputTokens)} tok [MEASURED] · persisted assistant text ≤ ${n0(persisted)} tok [EST, at ${r.bandHi.toFixed(2)} chars/token] · ≥${(missing * 100).toFixed(0)}% of output tokens produced NO persisted text`);
    // Both error terms push the same way, so the unpersisted % is a FLOOR, not a
    // measurement: `persisted` counts serialized tool_use JSON as assistant text
    // (over-stating it), and the band endpoint used here is itself a floor on the
    // ratio, so the persisted side is over-stated again.
    console.log('    (a FLOOR, not a measurement — hence ≥, matching the ledger: persisted includes serialized');
    console.log('     tool_use JSON, and rides a ratio that is itself a floor. Both inflate the persisted side.)');
    console.log('');
  }

  // ── D9 ────────────────────────────────────────────────────────────────
  console.log('  D9 — per-subagent_type attribution (Agent blocks)');
  const rowsA = [...r.agents.entries()].sort((a, b) => b[1].returnChars - a[1].returnChars);
  if (!rowsA.length) console.log('    (no Agent tool_use blocks in this transcript)');
  else {
    console.log(`    ${pad('subagent_type', 30)}${lpad('spawns', 8)}${lpad('spawn chars', 13)}${lpad('returns', 9)}${lpad('return chars', 14)}${lpad('return tok [BAND]', 21)}${lpad('share [BAND]', 14)}`);
    for (const [t, a] of rowsA) {
      const lo = r.bandHi ? Math.round(a.returnChars / r.bandHi) : null;
      const hi = r.bandLo ? Math.round(a.returnChars / r.bandLo) : null;
      console.log(`    ${pad(t, 30)}${lpad(n0(a.spawns), 8)}${lpad(n0(a.spawnChars), 13)}${lpad(n0(a.returns), 9)}${lpad(n0(a.returnChars), 14)}${lpad(band(lo, hi), 21)}${lpad(bandPct(lo, hi, r.total), 14)}`);
    }
  }
  // subagent_type is plugin-NAMESPACED in real transcripts (`agentic-workflow:reviewer`);
  // an exact 'reviewer' lookup silently reports "not exercised" and suppresses the D7
  // verdict. Match on the final segment, and aggregate every namespace that ends in it.
  const revChars = [...r.agents.entries()]
    .filter(([t]) => String(t).split(':').pop() === 'reviewer')
    .reduce((n, [, a]) => n + a.returnChars, 0);
  if (revChars === 0) console.log('    reviewer: no Agent blocks — D7 reopen test not exercised by this transcript');
  else if (!r.bandLo) console.log('    reviewer: chars/token band unavailable — D7 token-domain verdict SUPPRESSED (a char-domain share is not the trigger)');
  else {
    // The verdict keys off the band's HIGH-token end, i.e. the conservative one: if the
    // share COULD exceed 3% anywhere in the band, say so rather than quietly picking the
    // endpoint that keeps D7 shut. (D11 already ruled D7 stands; this line re-derives,
    // it does not re-decide. Naming the denominator formally is S0.5-3's task.)
    const tokLo = Math.round(revChars / r.bandHi);
    const tokHi = Math.round(revChars / r.bandLo);
    const shareLo = r.total > 0 ? (tokLo / r.total) * 100 : 0;
    const shareHi = r.total > 0 ? (tokHi / r.total) * 100 : 0;
    console.log(`    reviewer return share = ${shareLo.toFixed(2)}–${shareHi.toFixed(2)}% of TOTAL prompt growth (token domain, [EST/BAND]) — ${shareHi > 3
      ? 'the band REACHES ABOVE 3% → REOPENS decision D7 (reviewer untouched in v1)'
      : 'the whole band is at or under 3% → D7 stands (reviewer untouched in v1)'}`);
    console.log(`    (chars, for reference: ${n0(revChars)} = ${pct(revChars, r.charsSeen)} of all appended chars [MEASURED] — a CHAR share is NOT the D7 trigger)`);
  }
  if (r.taskBlocks) console.log(`  warn: ${n0(r.taskBlocks)} \`Task\` tool_use block(s) seen — the spawn tool is \`Agent\`; taxonomy may have drifted`);
  if (r.attachFallbackSized) {
    const share = pct(r.attachFallbackChars, r.charsSeen);
    console.log(`  warn: ${n0(r.attachFallbackSized)} attachment(s) had no stdout/content/text/output field — sized on the record minus \`type\`, affecting ${n0(r.attachFallbackChars)} chars (${share} of all appended chars)`);
    // Name the casualty: unknown kinds land in `attach: other`, so that row is the one
    // this failure invalidates. Sizing the whole record over-counts (ids/metadata the
    // model never sees), so the row is likely OVER-stated, not under.
    console.log('        → the field-order guess did not hold; `attach: other` (where unknown kinds land) is the category this invalidates, and it is likely OVER-stated. Dump one real record key set before acting on that row.');
  }
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
    // output_tokens = 800 is LOAD-BEARING for the envelope estimator: req-1 persists
    // ~2.4k chars across its two lines, so the old value of 50 asserted ~48 chars/token
    // — dimensionally impossible under any tokenizer, and undetected because nothing
    // tested the output side. 800 puts req-1's q ≈ 3.02, which is the fixture's max and
    // therefore the band's tight end. Changing it moves the band.
    A('req-1', [{ type: 'text', text: F.prose1 }, { type: 'tool_use', id: 't1', name: 'Bash', input: { command: F.bashCmd } }], usage(1200, 0, 0, 800)),
    U([{ type: 'tool_result', tool_use_id: 't1', content: F.toolResult1 }]),
    // Same requestId, later line of the SAME response: usage repeats verbatim. Its
    // CONTENT is not a duplicate and bills to req-1 on the output side.
    A('req-1', [{ type: 'tool_use', id: 't2', name: 'Write', input: { file_path: '/x/y.md', content: F.writeBody } }], usage(1200, 0, 0, 800)),
    U([{ type: 'tool_result', tool_use_id: 't2', content: 'File created' }]),
    // Attachments: each carries a large field that must NOT be counted.
    { type: 'attachment', attachment: { type: 'skill_listing', content: F.skills, junkMetadata: 'J'.repeat(4000) } },
    { type: 'attachment', attachment: { type: 'hook_success', stdout: F.hookOut, command: 'C'.repeat(5000), cwd: '/x' } },
    { type: 'attachment', attachment: { type: 'file_content', content: F.otherAtt } },
    A('req-2', [
      { type: 'thinking', thinking: F.think },
      { type: 'text', text: F.prose2 },
      // NAMESPACED, as real transcripts emit it — a bare 'reviewer' here would let a
      // namespace-blind D7 lookup pass the selftest while suppressing the real verdict.
      { type: 'tool_use', id: 't3', name: 'Agent', input: { subagent_type: 'agentic-workflow:reviewer', description: 'review', prompt: F.spawnPrompt } },
    ], usage(0, 800, 1200, 400)),
    U([{ type: 'tool_result', tool_use_id: 't3', content: [{ type: 'text', text: F.reviewReturn }] }]),
    U([{ type: 'tool_result', tool_use_id: 'orphan-id', content: F.toolResult2 }]),
    { type: 'assistant', isSidechain: true, requestId: 'side-1', message: { role: 'assistant', content: [{ type: 'text', text: 'X'.repeat(500) }], usage: usage(0, 0, 5000, 100) } },
    A('req-3', [{ type: 'text', text: F.prose3 }], usage(0, 600, 2000, 40)),
    // The prompt=0 trio. All three carry EMPTY content and sit back-to-back, so no
    // chars accumulate into their windows: the calibration ratio, every category and
    // TOTAL are untouched by their presence *when the guard holds*.
    //   req-4: a GENUINE collapse (2600 -> 1000, drop 1600) — the ledger must list it.
    //   req-5: the degenerate record (prompt = 0) — skipped, never ledgered.
    //   req-6: the next real request. WITH the guard it is billed against 1000 (delta 0,
    //          TOTAL stays 2600); WITHOUT it, against the poisoned 0 — re-billing the
    //          whole resident context and pushing TOTAL to 3600. That follow-on request
    //          is what makes this fixture able to fail; a degenerate record with nothing
    //          after it costs nothing and would prove nothing.
    // The trio's output_tokens are ALSO load-bearing, for the envelope's drop rule (S0.5-2):
    // req-4 carries out = 30 (≥ MIN_OUT) so it can only be dropped by the `chars > 0`
    // clause, and req-6 carries out = 10 so it trips both. req-5 never reaches the
    // estimator at all — its usage block is degenerate, so `out` is never recorded and its
    // (empty) content creates no row. That is by design, not an omission: see `outRow`.
    A('req-4', [], usage(1000, 0, 0, 30)),
    A('req-5', [], usage(0, 0, 0, 25)),
    A('req-6', [], usage(1000, 0, 0, 10)),
    // req-7 isolates the OTHER drop clause: persisted chars but an implausibly small
    // output_tokens (10 < MIN_OUT), i.e. exactly the rounding-driven outlier MIN_OUT
    // exists to reject — unfiltered its q is ~22 chars/token, 7x the fixture's true max,
    // and it would become the band's tight end single-handedly. Deliberately inert on the
    // prompt side: prompt = 1000 = prevPrompt, so its window is delta 0 / chars 0 (TOTAL,
    // calDelta, calChars, collapses, finalPrompt and preamble are all untouched), and its
    // own chars land after the last window closes, as trailing chars. `Grep` keeps them in
    // the residual map rather than perturbing a named category that other cases pin.
    A('req-7', [{ type: 'tool_use', id: 't4', name: 'Grep', input: { pattern: F.tinyOutBody } }], usage(1000, 0, 0, 10)),
    U(F.steer2),
    { type: 'summary', summary: 'a compacted summary record' },
  ];
  const body = recs.map((r) => JSON.stringify(r)).join('\n') + '\n{not json\n';
  writeFileSync(p, body);
  return p;
}

// Fixture payloads. TWO sizing constraints, both load-bearing:
//   (1) the true chars/token ratio is far from the folk 4.0, so a hardcoded `/4`
//       cannot reproduce these numbers;
//   (2) calChars ≈ 3 × calDelta (ratio ≈ 2.8, carried by `writeBody`). A ratio near
//       1 makes an inversion a near-no-op — which is exactly how the S2 fixture let
//       the tokens-per-char bug ship. At ≈2.8 an inverted ratio inflates attributed
//       tokens by ratio² ≈ 7.8× and drives the residual NEGATIVE, so the residual
//       guard below fails on its own, without leaning on the formula-mirror case.
// Changing `writeBody`'s size moves the ratio; keep it ≳2× and >1 away from 4.0.
const F = {
  steer1: 'S'.repeat(60),
  steer2: 'T'.repeat(40),
  prose1: 'P'.repeat(80),
  prose2: 'Q'.repeat(70),
  prose3: 'R'.repeat(30),
  bashCmd: 'B'.repeat(90),
  writeBody: 'W'.repeat(2200),   // sets the fixture ratio (see constraint 2 above)
  toolResult1: 'L'.repeat(300),
  toolResult2: 'M'.repeat(120),
  skills: 'K'.repeat(150),
  hookOut: 'H'.repeat(120),
  otherAtt: 'O'.repeat(80),
  think: 'I'.repeat(220),
  spawnPrompt: 'G'.repeat(100),
  tinyOutBody: 'Z'.repeat(200),  // req-7: chars with a sub-MIN_OUT denominator (see the fixture)
  reviewReturn: 'V'.repeat(250),
};

async function selftest() {
  const dir = mkdtempSync(path.join(tmpdir(), 'ctxattrib-'));
  try {
    const r = await analyze(buildFixture(dir));

    // 1. Landmine 1 — a repeated `usage` block is counted ONCE.
    check('dedup: duplicate requestId usage counted once',
      r.requests === 6 && r.duplicateUsageLines === 1 && r.total === 2600,
      `requests=${r.requests} dup=${r.duplicateUsageLines} total=${r.total} (expected 6/1/2600)`);
    check('dedup: the naive per-line sum is strictly larger (the trap is real)',
      r.naiveTotal === 10000 && r.naiveTotal > r.total,
      `naive=${r.naiveTotal} total=${r.total}`);

    // 1b. The `prompt = 0` phantom-churn guard (D10a). VERIFIED BY MUTATION 2026-08-02:
    // delete the `else if (p === 0)` branch in `analyze` and 7 cases FAIL — the four
    // below (TOTAL 3,600 vs 2,600 · degenerateUsage 0 · 2 collapses, one of them to 0 ·
    // 2 unexplained) plus the two pre-existing cases that pin `total === 2600`. Restore
    // it and all 22 pass. NOTE on the ratchet case: the identity itself
    // (`total − collapseMass === finalPrompt`) is exact by construction and holds in
    // BOTH states — 3,600 − 2,600 = 1,000 unguarded — so it is a model self-check, not
    // a guard; what makes that case mutation-sensitive is the `collapseMass === 1600`
    // constant beside it. Do not remove req-6 from the fixture: without a real request
    // after the degenerate one the poisoned `prevPrompt` has nothing to re-bill, and
    // the TOTAL case goes blind.
    check('prompt=0: a degenerate record does not manufacture churn (TOTAL unchanged)',
      r.total === 2600 && r.finalPrompt === 1000,
      `total=${r.total} finalPrompt=${r.finalPrompt} (expected 2600/1000; unguarded gives 3600)`);
    check('prompt=0: the skipped record is COUNTED and reported, never silently dropped',
      r.degenerateUsage === 1,
      `degenerateUsage=${r.degenerateUsage}`);
    check('prompt=0: the collapse ledger lists the genuine collapse and NOT the degenerate record',
      r.collapses.length === 1 && r.collapses[0].before === 2600 && r.collapses[0].after === 1000
      && r.collapses[0].drop === 1600 && !r.collapses.some((c) => c.after === 0),
      `collapses=${JSON.stringify(r.collapses.map((c) => [c.before, c.after]))}`);
    check('ratchet identity: Σ positive deltas − Σ collapse mass === final prompt',
      r.ratchetOk && r.collapseMass === 1600 && r.total - r.collapseMass === r.finalPrompt,
      `total=${r.total} collapseMass=${r.collapseMass} final=${r.finalPrompt}`);
    check('collapse with no adjacent compact summary is flagged unexplained (not modelled)',
      r.unexplainedCollapses.length === 1 && r.compactSummaryRecords === 0,
      `unexplained=${r.unexplainedCollapses.length} compactRecords=${r.compactSummaryRecords}`);

    // 2. Landmine 2 — the books balance EXACTLY at BOTH band endpoints.
    check('exact sum: Σ categories + UNATTRIBUTED === TOTAL, at both band endpoints',
      r.attributedLo + r.unattributedHi === r.total && r.attributedHi + r.unattributedLo === r.total,
      `lo ${r.attributedLo}+${r.unattributedHi} hi ${r.attributedHi}+${r.unattributedLo} vs ${r.total}`);
    check('residual is non-zero and not redistributed',
      r.unattributedLo !== 0 && r.unattributedHi !== 0 && r.preamble === 1200,
      `unattributed=${r.unattributedLo}..${r.unattributedHi} preamble=${r.preamble}`);

    // 3. Landmine 3 — the prompt-side ratio is DERIVED per transcript, never a /4
    // constant. It is now a DIAGNOSTIC (D10b retired it as a converter) and the cases
    // below still pin it, because a broken derivation would still mislead a reader.
    check('churn ratio: === Σcal-chars ÷ Σcal-delta (derived, CHARS per token)',
      r.churnRatio === r.calChars / r.calDelta && r.calDelta === 1400,
      `churnRatio=${r.churnRatio} calDelta=${r.calDelta} calChars=${r.calChars}`);
    check('churn ratio: fixture ratio is far from the folk 4.0',
      Math.abs(r.churnRatio - 4) > 1,
      `churnRatio=${r.churnRatio}`);
    // D10b/OQ6: the retired converter must not be silently reinstated. Category tokens
    // must NOT equal chars ÷ churnRatio at either endpoint.
    const bashRow = r.rows.find((x) => x.name === 'authored: Bash commands');
    check('D10b: the prompt-side churn ratio is NOT used as a token converter',
      bashRow.tokLo !== Math.round(bashRow.chars / r.churnRatio)
      && bashRow.tokHi !== Math.round(bashRow.chars / r.churnRatio),
      `tok=${bashRow.tokLo}..${bashRow.tokHi} churn-converted=${Math.round(bashRow.chars / r.churnRatio)}`);
    // Dimensional guard, INDEPENDENT of case 3. Case 3 pins the FORMULA (a mirror of
    // the implementation — self-consistent, and therefore blind to a mirrored bug);
    // this pins its CONSEQUENCE — attributed tokens can never exceed TOTAL. An
    // upside-down ratio (tokens per char) inflates every category by 1/ratio² and
    // drives the residual negative, which is how the real-transcript run surfaced the
    // defect. Verified by mutation (S3-fix): with ratio := calDelta/calChars this case
    // FAILS on its own — attributed 10,229 vs TOTAL 2,600, residual −7,629 — including
    // with case 3 neutered, because the fixture ratio is ≈2.8, not ≈1. Do not flatten
    // the fixture ratio: at ≈1 an inversion is a no-op and this guard goes blind.
    check('residual: attributed never exceeds TOTAL (negative residual = broken model)',
      r.unattributedLo >= 0 && r.attributedHi <= r.total,
      `attributed=${r.attributedLo}..${r.attributedHi} total=${r.total} unattributed=${r.unattributedLo}..${r.unattributedHi}`);
    check('band: category tokens use the envelope band, not /4',
      bashRow.tokLo === Math.round(bashRow.chars / r.bandHi)
      && bashRow.tokHi === Math.round(bashRow.chars / r.bandLo)
      && bashRow.tokLo !== Math.round(bashRow.chars / 4),
      `chars=${bashRow.chars} tokens=${bashRow.tokLo}..${bashRow.tokHi} /4=${Math.round(bashRow.chars / 4)}`);

    // 3b. The output-side envelope estimator (D10b as amended by OQ6 2026-08-02).
    // Expected q values are rebuilt HERE from the fixture's own declared payloads —
    // NOT read back out of `r` — so a case cannot agree with the implementation by
    // sharing its arithmetic. Two bugs already shipped through mirror-tests.
    const q1 = (F.prose1.length
      + JSON.stringify({ command: F.bashCmd }).length
      + JSON.stringify({ file_path: '/x/y.md', content: F.writeBody }).length) / 800;
    const q2 = (F.think.length + F.prose2.length
      + JSON.stringify({ subagent_type: 'agentic-workflow:reviewer', description: 'review', prompt: F.spawnPrompt }).length) / 400;
    const q3 = F.prose3.length / 40;
    const qs = [q1, q2, q3].sort((a, b) => a - b);
    // Type-7 quantile, written out longhand rather than reusing the implementation's
    // helper: p90 of 3 samples sits 80% of the way from the 2nd to the 3rd.
    const wantMedian = qs[1];
    const wantP90 = qs[1] + 0.8 * (qs[2] - qs[1]);
    const wantMax = qs[2];
    check('envelope: q = persisted assistant chars ÷ output_tokens, per unique request',
      r.env !== null && r.env.n === 3
      && Math.abs(r.env.median - wantMedian) < 1e-9
      && Math.abs(r.env.max - wantMax) < 1e-9,
      r.env ? `n=${r.env.n} median=${r.env.median} max=${r.env.max} (want 3/${wantMedian}/${wantMax})` : 'env=null');
    // Distinct from the case above: pins the QUANTILE definition. Nearest-rank would
    // return max here (collapsing the band); type-7 interpolates strictly below it.
    check('envelope: p90 is a type-7 quantile and lies strictly between median and max',
      Math.abs(r.env.p90 - wantP90) < 1e-9 && r.env.median < r.env.p90 && r.env.p90 < r.env.max,
      `p90=${r.env.p90} want=${wantP90} median=${r.env.median} max=${r.env.max}`);
    // Each clause of the drop rule is pinned by a request that trips ONLY that clause, so
    // deleting either one alone fails this case. (req-4: chars = 0, out = 30 → the
    // `chars > 0` clause. req-7: chars > 0, out = 10 → the MIN_OUT clause. req-6 trips
    // both.) VERIFIED BY MUTATION 2026-08-02, one clause at a time — see the ledger.
    check('envelope: requests with no persisted chars or < 20 output tokens are dropped',
      r.env.dropped === 3 && r.env.n === 3 && r.envSamples.every((q) => q > 0),
      `dropped=${r.env.dropped} n=${r.env.n} samples=${JSON.stringify(r.envSamples)} (want dropped 3 / n 3: req-4 chars=0 out=30 · req-6 chars=0 out=10 · req-7 chars>0 out=10)`);
    check('envelope: the band is [p90 .. max] and is a real interval, never a point',
      r.bandLo === r.env.p90 && r.bandHi === r.env.max && r.bandLo < r.bandHi,
      `band=${r.bandLo}..${r.bandHi}`);
    // The band's whole purpose: MORE chars per token means FEWER tokens. A swap here
    // is the failure that would silently restore point-like, over-stated token columns.
    const steerRow = r.rows.find((x) => x.name === 'human steers');
    check('band: the low-ratio end yields the HIGH token count (orientation not swapped)',
      steerRow.tokHi > steerRow.tokLo
      && steerRow.tokHi === Math.round(steerRow.chars / r.bandLo)
      && steerRow.tokLo === Math.round(steerRow.chars / r.bandHi),
      `chars=${steerRow.chars} tokLo=${steerRow.tokLo} tokHi=${steerRow.tokHi} band=${r.bandLo}..${r.bandHi}`);
    // 3c. The char-free mass (D10b step 3). Definition AND closure.
    check('char-free: = TOTAL − attributed − residual-char tokens − preamble, at each endpoint',
      r.charFreeHi === r.total - r.attributedLo - r.residualTokLo - r.preamble
      && r.charFreeLo === r.total - r.attributedHi - r.residualTokHi - r.preamble,
      `charFree=${r.charFreeLo}..${r.charFreeHi} attributed=${r.attributedLo}..${r.attributedHi} residualTok=${r.residualTokLo}..${r.residualTokHi} preamble=${r.preamble}`);
    check('char-free: the books close in INTEGERS at both endpoints',
      r.attributedLo + r.residualTokLo + r.preamble + r.charFreeHi === r.total
      && r.attributedHi + r.residualTokHi + r.preamble + r.charFreeLo === r.total
      && Number.isInteger(r.charFreeLo) && Number.isInteger(r.charFreeHi),
      `lo-end sum=${r.attributedHi + r.residualTokHi + r.preamble + r.charFreeLo} hi-end sum=${r.attributedLo + r.residualTokLo + r.preamble + r.charFreeHi} total=${r.total}`);
    // Residual CHARS must be converted too, or "char-free" would silently mean "not in
    // a named bucket" — a different and much larger quantity.
    check('char-free: unbucketed residual CHARS are converted, not treated as char-free',
      r.residualChars > 0 && r.residualTokLo === Math.round(r.residualChars / r.bandHi)
      && r.residualTokHi === Math.round(r.residualChars / r.bandLo),
      `residualChars=${r.residualChars} tok=${r.residualTokLo}..${r.residualTokHi}`);

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
    const rev = r.agents.get('agentic-workflow:reviewer');
    check('D9: Agent result attributed to its (namespaced) subagent_type',
      !!rev && rev.returnChars === F.reviewReturn.length && rev.spawns === 1 && rev.spawnChars > 0,
      rev ? `returnChars=${rev.returnChars} spawns=${rev.spawns}` : 'no reviewer row');
    // D7 gate: the verdict must resolve through the namespace, not report "not exercised".
    check('D9/D7: reviewer verdict resolves a namespaced subagent_type',
      [...r.agents.keys()].some((t) => String(t).split(':').pop() === 'reviewer'),
      `agent keys=${[...r.agents.keys()].join(',')}`);
    check('D9: the same bytes also form the `subagent returns` category',
      cat('subagent returns') === F.reviewReturn.length, `${cat('subagent returns')}`);

    // Hygiene: taxonomy boundaries that would silently corrupt a split.
    // Named, not size-inferred: the sidechain record's 500-char text block would land
    // in `orchestrator prose` if it leaked, and its 5,000 cache_read tokens in TOTAL.
    // (The old "no row ≥ 500 chars" proxy silently coupled this case to payload sizes.)
    check('sidechain records excluded (subagent internals cost the orchestrator nothing)',
      r.sidechain === 1
      && cat('orchestrator prose') === F.prose1.length + F.prose2.length + F.prose3.length
      && r.total === 2600,
      `sidechain=${r.sidechain} prose=${cat('orchestrator prose')} total=${r.total}`);
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
