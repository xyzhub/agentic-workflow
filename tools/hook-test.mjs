#!/usr/bin/env node
// Tier-1.5 behavioral test for the agentic-workflow hooks. Zero deps; Node >= 18.
// Structural lint (tools/lint.mjs) proves the hook commands *parse*; this proves
// they *behave* — it pipes fixture stdin through each hooks.json command in a
// throwaway cwd and asserts exit code + emitted nudge. The 2026-07 beat-enforcer
// Stop-hook loop shipped green through lint because lint can't dispatch a hook;
// this harness closes that gap. Run: node tools/hook-test.mjs  (0 = pass, 1 = fail)
//
// The beat-enforcers key on the ledger's checkbox GLYPH, never the row's prose:
//   [ ] not started → may nudge   ·   [~] parked/in-flight/deferred → silent
//   [x] done → silent

import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, utimesSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ROOT, 'plugins/agentic-workflow');
const HOOKS = path.join(PLUGIN, 'hooks/hooks.json');

// Pull one hook command out of hooks.json by event, disambiguated by a substring
// of its authored `description` (the file gives every hook a descriptive one).
function hookCommand(event, descNeedle) {
  const spec = JSON.parse(readFileSync(HOOKS, 'utf8'));
  const cmds = (spec.hooks[event] || []).flatMap((g) => g.hooks);
  const hit = descNeedle
    ? cmds.find((h) => (h.description || '').includes(descNeedle))
    : cmds[0];
  if (!hit) throw new Error(`no ${event} hook matching "${descNeedle ?? '(first)'}"`);
  return hit.command;
}

// Run a hook command with the given stdin JSON, in a throwaway cwd optionally
// holding .plans ledgers ({ 'name.state.md': 'content', ... }), arbitrary
// staged files ({ 'rel/path.md': { content, mtime? } }), and/or a sized
// transcript ({ bytes } | { lines }) whose absolute path is injected into the
// stdin JSON as `transcript_path`. `command` (harness self-proof cases only)
// dispatches a raw probe command in place of a hooks.json lookup.
function runHook({ event, desc, command, input = {}, ledgers, files, transcript }) {
  const dir = mkdtempSync(path.join(tmpdir(), 'hooktest-'));
  try {
    if (ledgers) {
      mkdirSync(path.join(dir, '.plans'));
      // Write in insertion order and stamp strictly-increasing mtimes so the
      // hooks' `ls -t` (active = newest ledger) is deterministic regardless of
      // filesystem timestamp resolution — the LAST entry is always the newest.
      Object.entries(ledgers).forEach(([name, content], i) => {
        const p = path.join(dir, '.plans', name);
        writeFileSync(p, content);
        const t = 1_000_000_000 + i;
        utimesSync(p, t, t);
      });
    }
    if (files) {
      // Arbitrary staged files, for hooks that look beyond .plans/ (e.g. a
      // docs/product/session-handoff.md freshness check). Same deterministic-
      // mtime trick as the ledgers above: filesystem timestamp resolution is
      // too coarse for a hook comparing mtimes within one test run, so an
      // explicit epoch-seconds `mtime`, when given, is stamped via utimesSync.
      for (const [rel, spec] of Object.entries(files)) {
        const p = path.join(dir, rel);
        mkdirSync(path.dirname(p), { recursive: true });
        writeFileSync(p, spec.content);
        if (spec.mtime !== undefined) utimesSync(p, spec.mtime, spec.mtime);
      }
    }
    if (transcript) {
      // A throwaway file of the requested size, inside the temp cwd, passed to
      // the hook as `transcript_path`. Plain text by construction — NEVER a
      // *.jsonl fixture the hooks parse; only its SIZE is load-bearing.
      const tPath = path.join(dir, 'transcript.txt');
      writeFileSync(tPath, transcript.bytes !== undefined
        ? Buffer.alloc(transcript.bytes, 'x')
        : 'x\n'.repeat(transcript.lines));
      input = { ...input, transcript_path: tPath };
    }
    const r = spawnSync('bash', ['-c', command ?? hookCommand(event, desc)], {
      cwd: dir, input: JSON.stringify(input), encoding: 'utf8',
      // Claude Code exports CLAUDE_PLUGIN_ROOT to hook processes; mirror it so a
      // hook that invokes `${CLAUDE_PLUGIN_ROOT}/hooks/lib/*.sh` resolves here.
      env: { ...process.env, CLAUDE_PLUGIN_ROOT: PLUGIN },
    });
    return { code: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const failures = [];
function check(name, cond, detail) {
  if (cond) console.log(`  ok   ${name}`);
  else { console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); failures.push(name); }
}

// Both beat-enforcers surface a nudge containing this phrase (Stop wraps it in
// hookSpecificOutput.additionalContext JSON; PreToolUse echoes it to stdout).
const nudged = (r) => /Beat pending/.test(r.stdout);

const STOP = 'beat-enforcer backstop';
const PRE = 'beat-enforcer (D4, PreToolUse';
const commit = { tool_input: { command: 'git commit -m "wip"' } };
const ledger = (...rows) => ({ 'm.state.md': ['## Checklist', ...rows, ''].join('\n') });

// ── Ledger fixtures, keyed by glyph ──────────────────────────────────────
// A not-started checkpoint — the enforcer should nudge.
const NOT_STARTED = ledger('- [x] S1 — build', '- [ ] Checkpoint — Phase 2 review');
// A parked/in-flight checkpoint (plain [~], no prose markers) — the author's
// "hands off" signal. This is the exact case that used to slip the old prose
// matching; it must be silent purely on the glyph.
const PARKED = ledger('- [x] S1 — build', '- [~] Checkpoint — Phase 1 review (Fable)');
// A [~] row that also carries approved/awaiting-human prose — still silent, and
// the reason is the glyph, not the words.
const PARKED_WITH_PROSE = ledger('- [~] Checkpoint — phase 1 review **APPROVED**; **merge pending human**');
// A not-started [ ] row whose feature text merely mentions "approved" — prose is
// irrelevant, so it still nudges (guards against any prose-based silencing).
const APPROVED_IN_TEXT = ledger('- [ ] Checkpoint — reviewer to verify the approved-senders flow');
// A parked [~] row followed by a genuinely not-started [ ] row — nudges the [ ] one.
const MIXED = ledger('- [~] Checkpoint — phase 1 review **APPROVED**', '- [ ] Checkpoint — phase 2 review');
// Nothing not-started — every row parked or done. Silent.
const NONE_OPEN = ledger('- [x] S1 — build', '- [~] Checkpoint — phase 1 review');

// ── Due-ness fixtures (2026-08-03): a [ ] beat is not automatically DUE ──
// Work above the checkpoint is still not-started — the checkpoint isn't its turn.
const PENDING_ABOVE = ledger(
  '- [x] S1 — build', '- [ ] S2 — build', '- [ ] Checkpoint — phase 2 review');
// Sessions above are done, but an UNRELEASED blocking row sits between. The
// blocker carries [~] so this isolates the blocker rule from the PENDING_ABOVE one.
const BLOCKED_BY_DECISION = ledger(
  '- [x] S1 — build',
  '- [~] ⛔ **DECISION POINT** — awaiting the human',
  '- [ ] Checkpoint — phase 2 review');
// The beat row itself is explicitly HELD — the exact row that nagged ~20 turns.
const HELD_BEAT = ledger(
  '- [x] S1 — build', '- [ ] Checkpoint `ckpt-p1` — **HELD** — phase 1 review');
// A RELEASED blocker above ([x]) must NOT suppress — the preserved-nudge guard.
const RELEASED_BLOCKER = ledger(
  '- [x] S1 — build',
  '- [x] ⛔ **D1 HARD PAUSE — RELEASED 2026-08-02.** Human re-scoped',
  '- [ ] Checkpoint — phase 3 review');

// ── First-DUE scan fixtures (2026-08-03, S5b) ────────────────────────────
// A HELD checkpoint above a genuinely-due one. The enforcer used to evaluate
// ONLY the first [ ] candidate (`head -1`), so this HELD row silenced the
// backstop permanently — the defect reproduced on this repo's own ledger, where
// `ckpt-p1` is HELD while a later phase is authorized. Must nudge phase 2.
const HELD_BEAT_THEN_DUE = ledger(
  '- [x] S1 — build',
  '- [ ] Checkpoint `ckpt-p1` — **HELD** — phase 1 review',
  '- [x] S2 — build',
  '- [ ] Checkpoint — phase 2 review');
// The other half of the same property: the scan must NOT become "keep looking
// until something nudges". An unreleased ⛔ barrier above still silences EVERY
// candidate beneath it, skipped-over HELD rows included.
const BARRIER_THEN_HELD_THEN_DUE = ledger(
  '- [x] S1 — build',
  '- [~] ⛔ **DECISION POINT** — awaiting the human',
  '- [ ] Checkpoint `ckpt-p1` — **HELD** — phase 1 review',
  '- [ ] Checkpoint — phase 2 review');
// A `[~]` row carrying HELD is an unreleased blocker (rule ii) — still silent.
const PARKED_HELD_ABOVE = ledger(
  '- [x] S1 — build',
  '- [~] S2 — **HELD** — awaiting the owner',
  '- [ ] Checkpoint — phase 2 review');
// `HARD PAUSE` as the blocking marker, on an unreleased [~] row — matched by the
// rules but previously exercised by no case (only ⛔ and HELD were).
const HARD_PAUSE_PARKED = ledger(
  '- [x] S1 — build',
  '- [~] **HARD PAUSE** — awaiting the human’s re-scope',
  '- [ ] Checkpoint — phase 2 review');
// …and on an unreleased [ ] row. Rule (iii) steps over marker-carrying rows, so
// this is pinned by rule (ii)'s `[ ]` branch ALONE: drop that branch and an
// unreleased hard pause leaks through.
// A NON-CANDIDATE `- [ ]` row carrying HELD above a due checkpoint (F5, ckpt-p2):
// the exact class S5b re-scoped. Rule (ii) used to have a `[ ]`-carrying-HELD
// branch that walled off everything beneath; now (iii) filters marker-carrying
// rows, so a parked session is stepped over and the checkpoint below is DUE.
// This is the shape this repo's own ledger relies on (`- [ ] S4 — **HELD**` above
// `ckpt-p2`), and no case pinned it — restore the old branch and only this fails.
const HELD_SESSION_ABOVE = ledger(
  '- [x] S1 — build',
  '- [ ] S4 — **HELD** — parked pending the human',
  '- [ ] Checkpoint — phase 2 review');
const HARD_PAUSE_NOT_STARTED = ledger(
  '- [x] S1 — build',
  '- [ ] ⛔ **D1 HARD PAUSE** — awaiting the human',
  '- [x] S2 — build',
  '- [ ] Checkpoint — phase 2 review');

// ── Stop backstop (fires every turn-end) ─────────────────────────────────
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: NOT_STARTED });
  check('Stop: not-started [ ] checkpoint → nudges', r.code === 0 && nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: PARKED });
  check('Stop: parked [~] checkpoint → silent (glyph)', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: PARKED_WITH_PROSE });
  check('Stop: [~] with approved/human prose → silent (glyph, not prose)', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: APPROVED_IN_TEXT });
  check('Stop: [ ] with "approved" in feature text → still nudges (prose ignored)', r.code === 0 && nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: MIXED });
  check('Stop: parked [~] then not-started [ ] → nudges the [ ] one', r.code === 0 && nudged(r) && /phase 2/.test(r.stdout), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: NONE_OPEN });
  check('Stop: nothing not-started → silent', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{ // the v1.39.1 re-fire guard: a Stop re-fire stays silent even with an open beat.
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: true }, ledgers: NOT_STARTED });
  check('Stop: re-fire (stop_hook_active) → silent', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false } });
  check('Stop: no .plans/ → silent', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}

// Multi-ledger: the newest ledger is fully parked ([~]/[x]); an older abandoned
// ledger still holds a not-started [ ]. The active ledger is the newest with ANY
// open/parked beat, so the parked current mission wins and stays silent — the
// enforcer must NOT reach back to nag about the abandoned one (regression: F1).
{
  const r = runHook({
    event: 'Stop', desc: STOP, input: { stop_hook_active: false },
    ledgers: {
      'old-abandoned.state.md': ['## Checklist', '- [ ] Checkpoint — phase 1 review', ''].join('\n'),
      'current.state.md': ['## Checklist', '- [x] S1 — build', '- [~] Checkpoint — phase 1 review', ''].join('\n'),
    },
  });
  check('Stop: newest ledger parked, older has [ ] → silent (active = newest)',
    r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}

// ── Stop backstop: due-ness (a [ ] beat behind unfinished/blocked rows) ───
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: PENDING_ABOVE });
  check('Stop: [ ] session still open above the checkpoint → silent (not due)', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: BLOCKED_BY_DECISION });
  check('Stop: unreleased ⛔ blocker above the checkpoint → silent', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: HELD_BEAT });
  check('Stop: beat row itself marked HELD → silent', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{ // preserved-nudge guard: a RELEASED [x] blocker must not silence a due beat.
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: RELEASED_BLOCKER });
  check('Stop: released [x] blocker above, all work done → still nudges', r.code === 0 && nudged(r) && /phase 3/.test(r.stdout), `stdout=${JSON.stringify(r.stdout)}`);
}

// ── Stop backstop: the scan reaches the first DUE beat (S5b) ──────────────
{ // the [Med] from ckpt-p3: a HELD beat must be stepped over, not treated as a wall.
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: HELD_BEAT_THEN_DUE });
  check('Stop: HELD checkpoint above a due one → nudges the DUE one (not head -1)',
    r.code === 0 && nudged(r) && /phase 2/.test(r.stdout) && !/ckpt-p1/.test(r.stdout), `stdout=${JSON.stringify(r.stdout)}`);
}
{ // …and the scan must not degrade into "keep looking until something nudges".
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: BARRIER_THEN_HELD_THEN_DUE });
  check('Stop: unreleased ⛔ barrier above → silent for EVERY candidate beneath it',
    r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: PARKED_HELD_ABOVE });
  check('Stop: unreleased [~] HELD row above → silent', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: HARD_PAUSE_PARKED });
  check('Stop: unreleased [~] HARD PAUSE row above → silent', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{ // F5: a parked NON-CANDIDATE [ ] HELD row is stepped over, not a barrier.
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: HELD_SESSION_ABOVE });
  check('Stop: [ ] HELD session above (non-candidate) → still nudges the due checkpoint',
    r.code === 0 && nudged(r) && /phase 2/.test(r.stdout), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: HARD_PAUSE_NOT_STARTED });
  check('Stop: unreleased [ ] HARD PAUSE row above → silent', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}

// ── SessionStart:compact re-read directive ───────────────────────────────
// Matcher discipline is structural (the harness dispatches commands directly and
// does not apply matchers), so assert the registered matcher set itself: `compact`
// and nothing else — never `startup`, never `resume`.
{
  const spec = JSON.parse(readFileSync(HOOKS, 'utf8'));
  const matchers = (spec.hooks.SessionStart || []).map((g) => g.matcher);
  check('SessionStart: matcher is exactly ["compact"]',
    matchers.length === 1 && matchers[0] === 'compact', `matchers=${JSON.stringify(matchers)}`);
}
const COMPACT = 'compact-resume directive';
const reReadDirective = (r) => /just COMPACTED/.test(r.stdout);
{
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' }, ledgers: NOT_STARTED });
  check('SessionStart(compact): injects the re-read directive naming the active ledger',
    r.code === 0 && reReadDirective(r) && /m\.state\.md/.test(r.stdout), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'startup' }, ledgers: NOT_STARTED });
  check('SessionStart(startup): silent', r.code === 0 && !reReadDirective(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'resume' }, ledgers: NOT_STARTED });
  check('SessionStart(resume): silent', r.code === 0 && !reReadDirective(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' } });
  check('SessionStart(compact): no .plans/ → silent, exit 0', r.code === 0 && !reReadDirective(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{ // a fully-done ledger has no active mission — nothing to re-read.
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' }, ledgers: ledger('- [x] S1 — build') });
  check('SessionStart(compact): no active ledger → silent, exit 0', r.code === 0 && !reReadDirective(r), `stdout=${JSON.stringify(r.stdout)}`);
}
// Multi-ledger: compact-resume must name the SAME active ledger the beat-enforcer
// picks (newest-mtime with any open [ ]/[~] beat) — pointing a post-compaction
// session at an abandoned mission is the whole failure this hook exists to avoid.
{
  const r = runHook({
    event: 'SessionStart', desc: COMPACT, input: { source: 'compact' },
    ledgers: {
      'old-abandoned.state.md': ['## Checklist', '- [ ] Checkpoint — phase 1 review', ''].join('\n'),
      'current.state.md': ['## Checklist', '- [x] S1 — build', '- [~] Checkpoint — phase 1 review', ''].join('\n'),
    },
  });
  check('SessionStart(compact): names the NEWEST ledger with an open beat, not the older one',
    r.code === 0 && reReadDirective(r) && /current\.state\.md/.test(r.stdout) && !/old-abandoned/.test(r.stdout),
    `stdout=${JSON.stringify(r.stdout)}`);
}
{ // the other half of `ls -t`: a newest ledger that is fully [x] is COMPLETE, so
  // the scan falls through to the older ledger that still has an open beat.
  const r = runHook({
    event: 'SessionStart', desc: COMPACT, input: { source: 'compact' },
    ledgers: {
      'still-running.state.md': ['## Checklist', '- [ ] Checkpoint — phase 1 review', ''].join('\n'),
      'finished.state.md': ['## Checklist', '- [x] S1 — build', '- [x] Checkpoint — phase 1 review', ''].join('\n'),
    },
  });
  check('SessionStart(compact): newest ledger complete → falls through to the older open one',
    r.code === 0 && reReadDirective(r) && /still-running\.state\.md/.test(r.stdout) && !/finished/.test(r.stdout),
    `stdout=${JSON.stringify(r.stdout)}`);
}
{ // the directive the human contracted for is ≤6 lines.
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' }, ledgers: NOT_STARTED });
  let lines = -1;
  try { lines = JSON.parse(r.stdout).hookSpecificOutput.additionalContext.split('\n').length; } catch { /* reported below */ }
  check('SessionStart(compact): directive is ≤6 lines', lines > 0 && lines <= 6, `lines=${lines}`);
}
{ // never exits 2 — a SessionStart hook must never be able to block a session.
  const codes = ['compact', 'startup', 'resume', 'clear'].map(
    (source) => runHook({ event: 'SessionStart', desc: COMPACT, input: { source }, ledgers: NOT_STARTED }).code);
  check('SessionStart: exit 0 on every source (never 2)', codes.every((c) => c === 0), `codes=${JSON.stringify(codes)}`);
}

// ── PreToolUse enforcer (fires only at the closing action) ────────────────
{
  const r = runHook({ event: 'PreToolUse', desc: PRE, input: commit, ledgers: NOT_STARTED });
  check('PreToolUse: not-started [ ] checkpoint → nudges', r.code === 0 && nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'PreToolUse', desc: PRE, input: commit, ledgers: PARKED });
  check('PreToolUse: parked [~] checkpoint → silent (glyph)', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'PreToolUse', desc: PRE, input: { tool_input: { command: 'ls -la' } }, ledgers: NOT_STARTED });
  check('PreToolUse: non-closing command → silent', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{ // F2 (ckpt-p2): this enforcer has NO due-ness scan — it reports the FIRST
  // not-started beat, held or not, where the Stop backstop steps over it. The
  // §3 doc rows are split to say exactly that; this case pins the divergence so
  // the split stays honest. When due-ness is ported here (own session), this
  // case flips to the Stop expectation AND the PreToolUse doc row must change
  // with it — that coupling is the point.
  const r = runHook({ event: 'PreToolUse', desc: PRE, input: commit, ledgers: HELD_BEAT_THEN_DUE });
  check('PreToolUse: HELD beat above a due one → names the HELD one (no due-ness scan yet)',
    r.code === 0 && nudged(r) && /ckpt-p1/.test(r.stdout) && !/phase 2/.test(r.stdout), `stdout=${JSON.stringify(r.stdout)}`);
}

// ── Harness self-proof (S1): the staging knobs are real, not inert ────────
// Raw probe commands (`command:` override) OBSERVE the staged artifacts from
// inside the throwaway cwd — the anti-inert control for the harness itself.
// Without these, a no-op `files`/`transcript` knob would leave every later
// case that stages such fixtures vacuously green.
{ // `files`: content lands at the nested path AND the explicit mtime sticks.
  // The handoff is staged strictly OLDER than the ledger (1e9 − 100), so the
  // `-nt` probe fails if utimesSync were skipped (a freshly-written file would
  // be newer than the 1e9-stamped ledger, not older).
  const r = runHook({
    command: 'test -f docs/product/session-handoff.md'
      + ' && [ .plans/m.state.md -nt docs/product/session-handoff.md ]'
      + ' && ls docs/product/session-handoff.md',
    ledgers: NOT_STARTED, // staged at mtime 1_000_000_000 by the ledger path
    files: { 'docs/product/session-handoff.md': { content: '# Session handoff\n', mtime: 999_999_900 } },
  });
  check('harness: staged `files` entry is visible to the dispatched command (test -f + mtime + ls)',
    r.code === 0 && r.stdout.trim() === 'docs/product/session-handoff.md',
    `code=${r.code} stdout=${JSON.stringify(r.stdout)}`);
}
{ // `transcript`: the dispatched command sees `transcript_path` in its stdin
  // JSON and `wc` observes exactly the requested size — both variants.
  const bytes = runHook({
    command: 'wc -c < "$(jq -r .transcript_path)"',
    transcript: { bytes: 4321 },
  });
  const lines = runHook({
    command: 'wc -l < "$(jq -r .transcript_path)"',
    transcript: { lines: 57 },
  });
  check('harness: staged transcript size observable via wc on `$transcript_path` (bytes + lines)',
    bytes.code === 0 && bytes.stdout.trim() === '4321'
      && lines.code === 0 && lines.stdout.trim() === '57',
    `bytes=${JSON.stringify(bytes.stdout)} lines=${JSON.stringify(lines.stdout)}`);
}

if (failures.length) {
  console.error(`\nhook-test: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('hook-test: clean');
