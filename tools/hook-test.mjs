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
// The emitted directive text, or null when the hook was silent / non-JSON.
const ctx = (r) => { try { return JSON.parse(r.stdout).hookSpecificOutput.additionalContext; } catch { return null; } };
{
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' }, ledgers: NOT_STARTED });
  check('SessionStart(compact): injects the re-read directive naming the active ledger',
    r.code === 0 && reReadDirective(r) && /m\.state\.md/.test(r.stdout), `stdout=${JSON.stringify(r.stdout)}`);
}
{ // S5 (P2): the active-ledger branch is pinned BYTE-FOR-BYTE — ckpt-p2 diffs
  // this output against the pre-phase hook, so "a directive fired" is not enough.
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' }, ledgers: NOT_STARTED });
  const expected = [
    '♻️ Context was just COMPACTED — what you hold now is a summary, not the record.',
    'Before anything else, re-read these VERBATIM (do not resume from the summary):',
    '  1. .plans/m.state.md — phase, `Next up:`, open beats, Deviations, and `## Standing steers` (honor them).',
    '  2. docs/product/session-handoff.md — the last session handoff, if it exists.',
    "Then re-state the current brief's remaining Do/Verify items before continuing.",
  ].join('\n');
  check('SessionStart(compact): active-ledger directive is byte-for-byte the pre-P2 text',
    r.code === 0 && ctx(r) === expected, `got=${JSON.stringify(ctx(r))}`);
}
{
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'startup' }, ledgers: NOT_STARTED });
  check('SessionStart(startup): silent', r.code === 0 && !reReadDirective(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'resume' }, ledgers: NOT_STARTED });
  check('SessionStart(resume): silent', r.code === 0 && !reReadDirective(r), `stdout=${JSON.stringify(r.stdout)}`);
}
// ── S5 (P2): the fallback branches. The two former "→ silent" pins below were
// REWRITTEN deliberately, not deleted: with neither a ledger nor a handoff,
// silence WAS the bug (OQ6, human-locked — the case the owner is in most often).
const HANDOFF_REL = 'docs/product/session-handoff.md';
// Branch-3 (OQ6) directive: names the ground truth, tells the human the record
// is missing, and pins the PROHIBITION on authoring a handoff on the spot.
const oq6Directive = (m) => typeof m === 'string'
  && /git log -5/.test(m) && /git status/.test(m) && /\.remember\/now\.md/.test(m)
  && /Tell the human the record is missing/.test(m)
  && /do NOT author a handoff now/.test(m) // must forbid, never instruct, authoring
  && !/[Ww]rite or refresh/.test(m)
  && m.split('\n').length <= 6;
{ // formerly "no .plans/ → silent" — now the OQ6 missing-record directive.
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' } });
  check('SessionStart(compact): no ledger, no handoff → OQ6 directive (git log -5 / git status / .remember/now.md, tell the human, no author-now, ≤6 lines)',
    r.code === 0 && oq6Directive(ctx(r)), `stdout=${JSON.stringify(r.stdout)}`);
}
{ // formerly "no active ledger → silent" — a fully-[x] ledger is not active, so
  // with no handoff staged this also falls through to the OQ6 directive.
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' }, ledgers: ledger('- [x] S1 — build') });
  check('SessionStart(compact): fully-[x] ledger (not active), no handoff → OQ6 directive, exit 0',
    r.code === 0 && oq6Directive(ctx(r)), `stdout=${JSON.stringify(r.stdout)}`);
}
{ // Branch 2, FRESH: handoff staged NEWER than the transcript → the directive
  // states CURRENT (OQ5: currency against the transcript, never the clock) and
  // carries no suspect wording. ≤6-line cap asserted per branch.
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' },
    transcript: { bytes: 2048 },
    files: { [HANDOFF_REL]: { content: '# Session handoff\n', mtime: Math.floor(Date.now() / 1000) + 86_400 } } });
  const m = ctx(r) || '';
  check('SessionStart(compact): no ledger, handoff NEWER than transcript → CURRENT directive naming the handoff (≤6 lines, no SUSPECT wording)',
    r.code === 0 && /Freshness: CURRENT/.test(m) && !/SUSPECT/.test(m)
      && m.includes(HANDOFF_REL) && /VERBATIM/.test(m) && /\*\*Next\*\*/.test(m)
      && m.split('\n').length <= 6,
    `stdout=${JSON.stringify(r.stdout)}`);
}
{ // Branch 2, STALE: handoff OLDER than the transcript's last append → SUSPECT,
  // instructing git log/git status verification BEFORE trusting its Next.
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' },
    transcript: { bytes: 2048 },
    files: { [HANDOFF_REL]: { content: '# Session handoff\n', mtime: 1_000_000_000 } } });
  const m = ctx(r) || '';
  // F3+F4 (ckpt-p2): the STALE sub-path's reason ("OLDER than the transcript's
  // last append") is only honest when a readable transcript was actually
  // compared — pin that phrase HERE (where the comparison happened), pin that
  // the UNPROVABLE reason does NOT appear, and pin the "Re-read it VERBATIM"
  // operative fragment (previously unpinned — droppable without a failure).
  check('SessionStart(compact): no ledger, handoff OLDER than transcript → SUSPECT stating the STALE reason (OLDER-than phrase, no UNPROVABLE, re-read VERBATIM, verify before Next, ≤6 lines, no CURRENT)',
    r.code === 0 && /Freshness: SUSPECT/.test(m) && !/CURRENT/.test(m)
      && /it is OLDER than the transcript's last append/.test(m) && !/UNPROVABLE/.test(m)
      && /Re-read it VERBATIM/.test(m)
      && /git log/.test(m) && /git status/.test(m) && /do NOT trust its \*\*Next\*\*/.test(m)
      && m.includes(HANDOFF_REL) && m.split('\n').length <= 6,
    `stdout=${JSON.stringify(r.stdout)}`);
}
{ // Branch 2, freshness UNPROVABLE: no transcript_path at all. Even a handoff
  // with a future mtime must read SUSPECT — fail closed, never current. F3
  // (ckpt-p2): with NO readable transcript no age comparison was ever made, so
  // the directive must state the honest reason (UNPROVABLE — transcript
  // missing/unreadable) and must NOT assert the stale sub-path's "OLDER than"
  // claim. Same operative instruction as the stale text (F4 fragment pinned).
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' },
    files: { [HANDOFF_REL]: { content: '# Session handoff\n', mtime: Math.floor(Date.now() / 1000) + 86_400 } } });
  const m = ctx(r) || '';
  check('SessionStart(compact): handoff present but no transcript_path → SUSPECT stating the UNPROVABLE reason (no false OLDER-than claim, re-read VERBATIM, fail closed, ≤6 lines)',
    r.code === 0 && /Freshness: SUSPECT/.test(m) && !/CURRENT/.test(m)
      && /UNPROVABLE/.test(m) && /missing or unreadable/.test(m) && !/OLDER than/.test(m)
      && /Re-read it VERBATIM/.test(m) && /do NOT trust its \*\*Next\*\*/.test(m)
      && m.split('\n').length <= 6,
    `stdout=${JSON.stringify(r.stdout)}`);
}
{ // The source guard precedes the branching: startup/resume stay silent in the
  // fallback branches too, not just when a ledger exists.
  const codes = ['startup', 'resume'].map((source) => runHook({
    event: 'SessionStart', desc: COMPACT, input: { source },
    transcript: { bytes: 2048 },
    files: { [HANDOFF_REL]: { content: '# Session handoff\n' } } }));
  check('SessionStart(startup/resume): silent in the fallback branches too (handoff staged, no ledger)',
    codes.every((r) => r.code === 0 && r.stdout === ''),
    `outs=${JSON.stringify(codes.map((r) => r.stdout))}`);
}
{ // Injection probe: shell metacharacters in transcript_path (stdin-controlled)
  // and in the handoff CONTENT are inert — values only pass through quoted
  // tests and `jq -n --arg`, never a shell eval. Unreadable path ⇒ SUSPECT.
  const evil = '/nope; touch HACK; $(touch HACK2) `touch HACK3` "d" \'s\'';
  const r = runHook({ event: 'SessionStart', desc: COMPACT,
    input: { source: 'compact', transcript_path: evil },
    files: { [HANDOFF_REL]: { content: '$(touch HACK4) `touch HACK5`; rm -rf x\n', mtime: 1_000_000_000 } } });
  const m = ctx(r);
  check('SessionStart(compact): metachar transcript_path + handoff content → inert (valid JSON, SUSPECT with the UNPROVABLE reason — unreadable path, no OLDER-than claim — exit 0, empty stderr)',
    r.code === 0 && typeof m === 'string' && /Freshness: SUSPECT/.test(m)
      && /UNPROVABLE/.test(m) && !/OLDER than/.test(m) && r.stderr === '',
    `code=${r.code} stderr=${JSON.stringify(r.stderr)} stdout=${JSON.stringify(r.stdout)}`);
}
// ── S6 (P2): the `_Written:` provenance stamp beats the mtime proxy ───────
// Format (defined in templates/session-handoff.md + commands/handoff.md):
//   _Written: <ISO-8601 UTC, YYYY-MM-DDTHH:MM:SSZ> · session <id> · branch <b>_
// The stamp is CONTENT, so it survives the copies/checkouts that perturb mtime;
// when present and parseable it is the freshness source, and each stamped case
// below stages the handoff MTIME pointing the OTHER way — so the case fails if
// the hook consults mtime instead of the stamp. Absent/malformed stamps fall
// back to the S5 mtime proxy, byte-identical, never an error.
const isoNoMillis = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
const stamped = (iso) => `_Written: ${iso} · session s6-case · branch mission/x_\n\n# Session handoff\n`;
{ // no-stamp CURRENT directive pinned BYTE-FOR-BYTE — the "S5 behavior is
  // unchanged when no stamp exists" guarantee, stronger than the regex pins.
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' },
    transcript: { bytes: 2048 },
    files: { [HANDOFF_REL]: { content: '# Session handoff\n', mtime: Math.floor(Date.now() / 1000) + 86_400 } } });
  const expected = [
    '♻️ Context was just COMPACTED — what you hold now is a summary, not the record.',
    'No active mission ledger; the durable record is docs/product/session-handoff.md.',
    'Freshness: CURRENT — written after the transcript\'s last append, so it postdates any budget-band crossing (currency is judged against the transcript, never the clock).',
    'Re-read it VERBATIM (do not resume from the summary), then continue from its **Next** line.',
  ].join('\n');
  check('SessionStart(compact): no stamp → mtime path, CURRENT directive byte-for-byte the S5 text',
    r.code === 0 && ctx(r) === expected, `got=${JSON.stringify(ctx(r))}`);
}
{ // stamp FRESH (future ISO) while the handoff MTIME is ancient: the mtime
  // proxy would say SUSPECT — CURRENT proves the stamp is preferred.
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' },
    transcript: { bytes: 2048 },
    files: { [HANDOFF_REL]: { content: stamped(isoNoMillis(Date.now() + 86_400_000)), mtime: 1_000_000_000 } } });
  const m = ctx(r) || '';
  check('SessionStart(compact): fresh `_Written:` stamp + STALE mtime → CURRENT (stamp beats mtime, ≤6 lines)',
    r.code === 0 && /Freshness: CURRENT/.test(m) && !/SUSPECT/.test(m) && m.split('\n').length <= 6,
    `stdout=${JSON.stringify(r.stdout)}`);
}
{ // stamp STALE (epoch 1e9) while the handoff MTIME is in the future: the
  // mtime proxy would say CURRENT — SUSPECT proves the stamp wins both ways.
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' },
    transcript: { bytes: 2048 },
    files: { [HANDOFF_REL]: { content: stamped('2001-09-09T01:46:40Z'), mtime: Math.floor(Date.now() / 1000) + 86_400 } } });
  const m = ctx(r) || '';
  check('SessionStart(compact): stale `_Written:` stamp + FRESH mtime → SUSPECT (stamp beats mtime, fail closed)',
    r.code === 0 && /Freshness: SUSPECT/.test(m) && !/CURRENT/.test(m) && m.split('\n').length <= 6,
    `stdout=${JSON.stringify(r.stdout)}`);
}
{ // F1 (ckpt-p2): the clock-blind gap. Every earlier stamp case staged its
  // transcript seconds before dispatch (mtime≈now), so mutating the hook to
  // compare the stamp against the WALL CLOCK (T_MTIME=$(date +%s)) survived
  // all 59 pre-S8 cases. Here the TRANSCRIPT itself carries an OLD mtime
  // (2001) — staged via the `files` knob, which has explicit-mtime staging the
  // `transcript` knob lacks; a relative transcript_path resolves against the
  // temp cwd, and the hook only ever tests/stats it — and the stamp (2015)
  // sits BETWEEN that mtime and now. Correct comparison (stamp vs transcript
  // mtime) ⇒ CURRENT; the clock mutation ⇒ SUSPECT and this case fails. The
  // handoff's own mtime is staged OLDER than the transcript so the mtime
  // fallback cannot rescue a broken stamp path.
  const r = runHook({ event: 'SessionStart', desc: COMPACT,
    input: { source: 'compact', transcript_path: 'transcript-old.txt' },
    files: {
      'transcript-old.txt': { content: 'x'.repeat(2048), mtime: 1_000_000_000 },
      [HANDOFF_REL]: { content: stamped('2015-01-01T00:00:00Z'), mtime: 999_999_000 },
    } });
  const m = ctx(r) || '';
  check('SessionStart(compact): OLD-mtime transcript, stamp newer than it but older than NOW → CURRENT (freshness judged against the transcript, never the clock)',
    r.code === 0 && /Freshness: CURRENT/.test(m) && !/SUSPECT/.test(m) && m.split('\n').length <= 6,
    `stdout=${JSON.stringify(r.stdout)}`);
}
{ // malformed stamp → the mtime FALLBACK decides, in BOTH directions (a broken
  // stamp must never fail closed to permanent-SUSPECT, and never error).
  const fresh = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' },
    transcript: { bytes: 2048 },
    files: { [HANDOFF_REL]: { content: stamped('not-a-date'), mtime: Math.floor(Date.now() / 1000) + 86_400 } } });
  const stale = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' },
    transcript: { bytes: 2048 },
    files: { [HANDOFF_REL]: { content: stamped('not-a-date'), mtime: 1_000_000_000 } } });
  check('SessionStart(compact): malformed `_Written:` stamp → mtime fallback decides (fresh mtime CURRENT, stale mtime SUSPECT, exit 0)',
    fresh.code === 0 && /Freshness: CURRENT/.test(ctx(fresh) || '')
      && stale.code === 0 && /Freshness: SUSPECT/.test(ctx(stale) || ''),
    `fresh=${JSON.stringify(fresh.stdout)} stale=${JSON.stringify(stale.stdout)}`);
}
{ // injection probe: metachar/garbage stamp content is inert — the stamp only
  // passes through grep/cut and `jq --arg`, never a shell eval. Falls back to
  // the (fresh) mtime, emits valid JSON, exit 0, empty stderr.
  const evil = '_Written: $(touch HACK6) `touch HACK7`; rm -rf x · session $(id) · branch `pwd`_\n# h\n';
  const r = runHook({ event: 'SessionStart', desc: COMPACT, input: { source: 'compact' },
    transcript: { bytes: 2048 },
    files: { [HANDOFF_REL]: { content: evil, mtime: Math.floor(Date.now() / 1000) + 86_400 } } });
  const m = ctx(r);
  check('SessionStart(compact): metachar `_Written:` stamp → inert (mtime fallback CURRENT, valid JSON, exit 0, empty stderr)',
    r.code === 0 && typeof m === 'string' && /Freshness: CURRENT/.test(m) && r.stderr === '',
    `code=${r.code} stderr=${JSON.stringify(r.stderr)} stdout=${JSON.stringify(r.stdout)}`);
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

// ── PreToolUse Read advisory (S8): the named READ_ADVISORY_LINES threshold ─
// The threshold is PINNED as a literal here on purpose (the A3 lesson, same as
// the budget bands below): moving the constant in hooks.json must consciously
// move it here too. These cases pin BEHAVIOR only (fires/silent at the
// boundary) — no effect-size claim rides on this advisory (L11).
const READ_DESC = 'context-discipline backstop';
const READ_LINES = 800; // mirrors READ_ADVISORY_LINES in hooks.json
const readNudge = (r) => /Large whole-file read/.test(r.stdout);
{ // the S8 deliverable is the NAME: the comparison must go through the named
  // constant, not a bare literal (which zero cases pinned pre-S8).
  const cmd = hookCommand('PreToolUse', READ_DESC);
  check('PreToolUse(read): threshold is the NAMED constant READ_ADVISORY_LINES=800, compared by name (no bare literal in the test)',
    cmd.includes(`READ_ADVISORY_LINES=${READ_LINES};`) && cmd.includes('-gt "$READ_ADVISORY_LINES"'),
    `cmd=${JSON.stringify(cmd)}`);
}
{ // one line OVER the threshold, whole-file read (no limit) → the advisory
  // fires, names the observed line count AND the threshold, exit 0.
  const r = runHook({ event: 'PreToolUse', desc: READ_DESC,
    input: { tool_input: { file_path: 'big.txt' } },
    files: { 'big.txt': { content: 'x\n'.repeat(READ_LINES + 1) } } });
  check('PreToolUse(read): whole-file Read one line OVER the threshold → advisory fires (names count + threshold), exit 0',
    r.code === 0 && readNudge(r)
      && new RegExp(`\\b${READ_LINES + 1} lines\\b`).test(r.stdout)
      && r.stdout.includes(String(READ_LINES)),
    `code=${r.code} stdout=${JSON.stringify(r.stdout)}`);
}
{ // exactly AT the threshold → silent: the boundary is strictly-greater.
  const r = runHook({ event: 'PreToolUse', desc: READ_DESC,
    input: { tool_input: { file_path: 'big.txt' } },
    files: { 'big.txt': { content: 'x\n'.repeat(READ_LINES) } } });
  check('PreToolUse(read): whole-file Read exactly AT the threshold → silent (strictly-greater boundary)',
    r.code === 0 && r.stdout === '', `stdout=${JSON.stringify(r.stdout)}`);
}
{ // a RANGED read (limit present) of the same over-threshold file → silent:
  // the advisory targets whole-file pulls, not the discipline it recommends.
  const r = runHook({ event: 'PreToolUse', desc: READ_DESC,
    input: { tool_input: { file_path: 'big.txt', limit: 100 } },
    files: { 'big.txt': { content: 'x\n'.repeat(READ_LINES + 200) } } });
  check('PreToolUse(read): ranged read (limit set) of an over-threshold file → silent',
    r.code === 0 && r.stdout === '', `stdout=${JSON.stringify(r.stdout)}`);
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

// ── UserPromptSubmit handoff-budget nudge (S3) ────────────────────────────
// The bands are PINNED as literals on purpose (the A3 lesson: the D7 3% trigger
// was a bare literal pinned by zero cases) — moving a constant in the hook must
// consciously move it here too. Values verbatim from the S2 THRESHOLD BLOCK.
const ADVISORY = 3_700_000;
const URGENT = 5_380_000;
const BUDGET = 'handoff-budget';
const budgetNudge = (r) => /Handoff budget/.test(r.stdout);
const urgent = (r) => /URGENT/.test(r.stdout);
const le3Lines = (r) => r.stdout.trim().split('\n').length <= 3;
// The hook's once-per-band marker lives in the REAL $TMPDIR keyed by session_id
// (runHook does not override TMPDIR), so every case mints a unique session id —
// a marker left by a previous harness run can never suppress this run's firings.
// Cases that assert the once-per-band silencer reuse ONE minted id deliberately.
// Leftover markers are empty, uniquely named, and OS-cleaned with the tempdir.
let sidSeq = 0;
const sid = (tag) => `hb-${tag}-${process.pid}-${Date.now()}-${sidSeq++}`;

{ // registration shape: same structural discipline as the SessionStart matcher case.
  const spec = JSON.parse(readFileSync(HOOKS, 'utf8'));
  const group = (spec.hooks.UserPromptSubmit || [])
    .find((g) => g.hooks.some((h) => (h.command || '').includes('handoff-budget.sh')));
  check('UserPromptSubmit(budget): registered with matcher .* and quoted ${CLAUDE_PLUGIN_ROOT} lib call',
    !!group && group.matcher === '.*'
      && group.hooks[0].command === 'bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/handoff-budget.sh"',
    `group=${JSON.stringify(group)}`);
}
{ // silencer 1, below-band direction: one byte under advisory says nothing.
  const r = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: sid('below') }, transcript: { bytes: ADVISORY - 1 } });
  check('UserPromptSubmit(budget): one byte below ADVISORY_BYTES → silent, exit 0',
    r.code === 0 && r.stdout === '', `code=${r.code} stdout=${JSON.stringify(r.stdout)}`);
}
{ // advisory boundary (≥, not >) + the ≤3-line cap + names the handoff file.
  const r = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: sid('adv') }, transcript: { bytes: ADVISORY } });
  check('UserPromptSubmit(budget): at exactly ADVISORY_BYTES → advisory nudge (≤3 lines, names the handoff, not URGENT)',
    r.code === 0 && budgetNudge(r) && !urgent(r) && le3Lines(r)
      && /docs\/product\/session-handoff\.md/.test(r.stdout),
    `code=${r.code} stdout=${JSON.stringify(r.stdout)}`);
}
{ // silencer 2: same band, same session → the second crossing is silent.
  const s = sid('once');
  const first = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: s }, transcript: { bytes: ADVISORY } });
  const again = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: s }, transcript: { bytes: ADVISORY + 1000 } });
  check('UserPromptSubmit(budget): advisory fires ONCE per session — second dispatch same session_id → silent',
    first.code === 0 && budgetNudge(first) && again.code === 0 && again.stdout === '',
    `first=${JSON.stringify(first.stdout)} again=${JSON.stringify(again.stdout)}`);
}
{ // urgent boundary, both directions: one under stays in the advisory band…
  const r = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: sid('subu') }, transcript: { bytes: URGENT - 1 } });
  check('UserPromptSubmit(budget): one byte below URGENT_BYTES → advisory band, not urgent',
    r.code === 0 && budgetNudge(r) && !urgent(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{ // …and at the constant the urgent band fires, still ≤3 lines.
  const r = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: sid('urg') }, transcript: { bytes: URGENT } });
  check('UserPromptSubmit(budget): at exactly URGENT_BYTES → URGENT nudge (≤3 lines)',
    r.code === 0 && budgetNudge(r) && urgent(r) && le3Lines(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{ // the marker is PER BAND (OQ4: "one firing per band", ≤2 total): an advisory
  // firing must not consume the urgent band, and urgent then re-fires never.
  const s = sid('bands');
  const adv = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: s }, transcript: { bytes: ADVISORY } });
  const urg = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: s }, transcript: { bytes: URGENT } });
  const urg2 = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: s }, transcript: { bytes: URGENT + 1000 } });
  check('UserPromptSubmit(budget): advisory then urgent in one session → both fire once each, third dispatch silent (≤2 total)',
    adv.code === 0 && budgetNudge(adv) && !urgent(adv)
      && urg.code === 0 && urgent(urg)
      && urg2.code === 0 && urg2.stdout === '',
    `adv=${JSON.stringify(adv.stdout)} urg=${JSON.stringify(urg.stdout)} urg2=${JSON.stringify(urg2.stdout)}`);
}
{ // silencer 4 (OQ7): an ACTIVE mission ledger silences even an urgent crossing.
  const r = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: sid('ledger') }, transcript: { bytes: URGENT }, ledgers: NOT_STARTED });
  check('UserPromptSubmit(budget): active ledger (open [ ] beat) → silent even past URGENT_BYTES',
    r.code === 0 && r.stdout === '', `stdout=${JSON.stringify(r.stdout)}`);
}
{ // …but "active" means an OPEN beat, not mere .plans/ existence — a fully-done
  // ledger must NOT silence (the thread-keeper predicate, both directions).
  const r = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: sid('done') }, transcript: { bytes: ADVISORY },
    ledgers: ledger('- [x] S1 — build') });
  check('UserPromptSubmit(budget): fully-[x] ledger is not active → still nudges',
    r.code === 0 && budgetNudge(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{ // silencer 3, silent direction: a handoff FRESHER than the transcript (staged
  // mtime in the future vs the just-written transcript) already postdates the
  // band crossing — nothing to nudge.
  const r = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: sid('fresh') }, transcript: { bytes: URGENT },
    files: { 'docs/product/session-handoff.md': {
      content: '# Session handoff\n', mtime: Math.floor(Date.now() / 1000) + 86_400 } } });
  check('UserPromptSubmit(budget): session-handoff.md newer than the transcript → silent',
    r.code === 0 && r.stdout === '', `stdout=${JSON.stringify(r.stdout)}`);
}
{ // silencer 3, firing direction: a STALE handoff (ancient mtime) does not silence.
  const r = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: sid('stale') }, transcript: { bytes: ADVISORY },
    files: { 'docs/product/session-handoff.md': {
      content: '# Session handoff\n', mtime: 1_000_000_000 } } });
  check('UserPromptSubmit(budget): stale session-handoff.md (older than the transcript) → still nudges',
    r.code === 0 && budgetNudge(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{ // failure paths — silent AND exit 0 on every one (L3): no transcript_path at
  // all, a transcript_path that does not exist, and a missing session_id.
  const none = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: sid('none') } });
  const gone = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: sid('gone'), transcript_path: '/nonexistent/hooktest/transcript.txt' } });
  const nosid = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: {}, transcript: { bytes: URGENT } });
  check('UserPromptSubmit(budget): missing/unreadable transcript_path or missing session_id → silent, exit 0',
    none.code === 0 && none.stdout === '' && gone.code === 0 && gone.stdout === ''
      && nosid.code === 0 && nosid.stdout === '',
    `codes=${JSON.stringify([none.code, gone.code, nosid.code])} out=${JSON.stringify([none.stdout, gone.stdout, nosid.stdout])}`);
}
{ // ckpt-p1 finding 1 (folded into P2): the session_id sanitizer
  // (tr -c 'A-Za-z0-9._-' '_') had ZERO regression protection. A metachar sid
  // must stay inert AND still land a valid marker — the once-per-band assertion
  // is the pin: drop the sanitizer and the '/'-laden sid below makes marker
  // creation fail silently, so the second dispatch nudges AGAIN and this fails.
  const s = `${sid('meta')}/../nope; $(touch HACK) \`touch HACK2\` "d" 's'`;
  const first = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: s }, transcript: { bytes: ADVISORY } });
  const again = runHook({ event: 'UserPromptSubmit', desc: BUDGET,
    input: { session_id: s }, transcript: { bytes: ADVISORY + 500 } });
  check('UserPromptSubmit(budget): metachar session_id → sanitized (nudges once, second dispatch silent, exit 0, empty stderr)',
    first.code === 0 && budgetNudge(first) && first.stderr === ''
      && again.code === 0 && again.stdout === '',
    `first=${JSON.stringify(first.stdout)} again=${JSON.stringify(again.stdout)} stderr=${JSON.stringify(first.stderr)}`);
}

if (failures.length) {
  console.error(`\nhook-test: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('hook-test: clean');
