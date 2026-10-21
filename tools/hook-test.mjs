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

import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync, utimesSync, chmodSync, symlinkSync, realpathSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ROOT, 'plugins/agentic-workflow');
const HOOKS = path.join(PLUGIN, 'hooks/hooks.json');
const GATE = path.join(PLUGIN, 'tools/publish-gate.mjs');

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
// staged files ({ 'rel/path.md': { content, mtime? } }), and/or a transcript
// ({ bytes } | { lines } | { content }) whose absolute path is injected into the
// stdin JSON as `transcript_path`. `dir` reuses a caller-owned cwd (the CALLER
// rmSync()s it) so a multi-call sequence shares one repo and transcript; `git:
// true` runs `git init -q -b main` in the cwd first (the handoff hooks resolve
// their local handoff through `git rev-parse --git-path`). `command` (harness self-proof cases only)
// dispatches a raw probe command in place of a hooks.json lookup. `bin`
// ({ gh: <script text> | false, jq: true | false }) runs the hook with PATH set
// to ONLY a temp bin/ of BIN_LIST symlinks (+ jq, + the gh stub) — how "gh
// missing" / "jq missing" are produced, and proof that a hook's `# externals:`
// line is complete.
const HARNESS_STATE = mkdtempSync(path.join(tmpdir(), 'hooktest-state-'));
const BIN_LIST = ['bash', 'sh', 'git', 'grep', 'sed', 'head', 'tr', 'cut', 'wc', 'cat', 'mkdir', 'dirname',
  'stat', 'tail', 'mv', 'rm', 'date', 'mktemp', 'chmod', 'pwd', 'sleep', 'ls'];
const whichBin = (name) => {
  const w = spawnSync('which', [name], { encoding: 'utf8' });
  return w.status === 0 ? w.stdout.trim().split('\n')[0] : '';
};
function runHook({ event, desc, command, input = {}, ledgers, files, transcript, bin, env: envOver, dir: keep, git }) {
  const dir = keep ?? mkdtempSync(path.join(tmpdir(), 'hooktest-'));
  try {
    if (git && !existsSync(path.join(dir, '.git'))) spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: dir });
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
      // A throwaway transcript inside the temp cwd, passed to the hook as
      // `transcript_path`. `bytes`/`lines` write plain `x` text — only its SIZE
      // is load-bearing, and it carries no `usage` line, so the handoff hooks
      // take the BYTE path on it. `content` writes the given text verbatim —
      // the JSONL fixtures (mkTranscript) that drive the TOKEN path.
      const tPath = path.join(dir, 'transcript.txt');
      writeFileSync(tPath, transcript.content !== undefined ? transcript.content
        : transcript.bytes !== undefined ? Buffer.alloc(transcript.bytes, 'x')
          : 'x\n'.repeat(transcript.lines));
      input = { ...input, transcript_path: tPath };
    }
    // Claude Code exports CLAUDE_PLUGIN_ROOT to hook processes; mirror it so a
    // hook that invokes `${CLAUDE_PLUGIN_ROOT}/hooks/lib/*.sh` resolves here.
    // XDG_STATE_HOME → a harness-owned root: outside a git repo the handoff hooks
    // keep their markers under it, never in the operator's real ~/.local/state.
    const env = { ...process.env, CLAUDE_PLUGIN_ROOT: PLUGIN, XDG_STATE_HOME: HARNESS_STATE, ...envOver };
    let shell = 'bash';
    if (bin) {
      const b = path.join(dir, 'bin');
      rmSync(b, { recursive: true, force: true }); // a reused `dir` re-stages bin/ per call
      mkdirSync(b);
      for (const name of [...BIN_LIST, ...(bin.jq === false ? [] : ['jq'])]) {
        const real = whichBin(name);
        if (real) symlinkSync(real, path.join(b, name));
      }
      if (typeof bin.gh === 'string') {
        writeFileSync(path.join(b, 'gh'), bin.gh);
        chmodSync(path.join(b, 'gh'), 0o755);
      }
      env.PATH = b; // ONLY the temp bin/ — no inherited PATH
      shell = path.join(b, 'bash');
    }
    const r = spawnSync(shell, ['-c', command ?? hookCommand(event, desc)], {
      cwd: dir, input: JSON.stringify(input), encoding: 'utf8', env,
    });
    return { code: r.status, stdout: r.stdout || '', stderr: r.stderr || '', dir };
  } finally {
    if (!keep) rmSync(dir, { recursive: true, force: true });
  }
}

// Run the shipped publish gate (tools/publish-gate.mjs) in a throwaway cwd with the
// same `files:` staging as runHook. Pass an existing `dir` to chain calls (claim →
// claim, gate → hook) in one cwd; the CALLER rmSync()s `dir` when done.
function runGate({ args, files, dir }) {
  dir ??= mkdtempSync(path.join(tmpdir(), 'gatetest-'));
  for (const [rel, spec] of Object.entries(files || {})) {
    const p = path.join(dir, rel);
    mkdirSync(path.dirname(p), { recursive: true });
    writeFileSync(p, spec.content);
  }
  const r = spawnSync(process.execPath, [GATE, ...args], { cwd: dir, encoding: 'utf8' });
  const read = (rel) => (existsSync(path.join(dir, rel)) ? readFileSync(path.join(dir, rel), 'utf8') : '');
  return { code: r.status, stdout: r.stdout || '', stderr: r.stderr || '', dir, read };
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

// ── Condition-aware fixtures (2026-10-11, #131) — a `when:` gate on another row ──
// The exact shape that nudged five stops in a row: the chronicler's Closing row
// names the checkpoint as its gate while the checkpoint is still in review ([~]).
const GATED_UNMET = ledger(
  '- [x] S2 — build',
  '- [~] Checkpoint p2 — Fable (effort high) reviewer: all harnesses + diff',
  '## Closing',
  '- [ ] docs/record synced · added 2026-10-11 (planner, pre-merge) — do: chronicler runs ONCE at mission close — when: checkpoint p2 APPROVED — probe: manual');
// Same row once the checkpoint is [x] → the chronicler beat IS due → nudge.
const GATED_MET = ledger(
  '- [x] S2 — build',
  '- [x] Checkpoint p2 — Fable (effort high) reviewer: all harnesses + diff',
  '## Closing',
  '- [ ] docs/record synced · added 2026-10-11 (planner, pre-merge) — do: chronicler runs ONCE at mission close — when: checkpoint p2 APPROVED — probe: manual');
// A gate id that matches no row → the old behavior is preserved (nudge).
const GATED_UNKNOWN = ledger(
  '- [x] S2 — build',
  '- [x] Checkpoint p2 — review',
  '## Closing',
  '- [ ] docs/record synced · added 2026-10-11 (planner, pre-merge) — do: chronicler — when: checkpoint p9 APPROVED — probe: manual');
// `when: S2 merged` against a parked S2, backticked id, `[x]` spelling, and the
// `when:` sitting on a WRAPPED continuation line (how real ledgers fold rows).
const GATED_MERGED = ledger(
  '- [~] S2 — build (PR open)',
  '## Closing',
  '- [ ] reviewer re-run · added 2026-10-11 (planner, post-merge) — do: one-shot reviewer',
  '  over the merge commit — when: `S2` merged — probe: manual');
const GATED_CKPT_X = ledger(
  '- [ ] Checkpoint `ckpt-p1` — **HELD** — phase 1 review',
  '## Closing',
  '- [ ] chronicler sweep · added 2026-10-11 (planner, pre-merge) — do: chronicler — when: `ckpt-p1` [x] — probe: manual');

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
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: GATED_UNMET });
  check('Stop (#131): [ ] row gated `when: checkpoint p2 APPROVED` while p2 is [~] → silent', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: GATED_MET });
  check('Stop (#131): same row once p2 is [x] → nudges', r.code === 0 && nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: GATED_UNKNOWN });
  check('Stop (#131): gate id matching no row → old behavior, nudges', r.code === 0 && nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: GATED_MERGED });
  check('Stop (#131): wrapped row `when: `S2` merged` while S2 is [~] → silent', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}
{
  const r = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: GATED_CKPT_X });
  check('Stop (#131): `when: `ckpt-p1` [x]` while ckpt-p1 is [ ] HELD → silent', r.code === 0 && !nudged(r), `stdout=${JSON.stringify(r.stdout)}`);
}

// ── mission-budget (D3, UserPromptSubmit) — status line, single Next up:, overrun STOP ──
// Orderly §12 LA-1 (no estimate/overrun mechanism → 44 sessions on an 18-session
// plan) and LA-7 (thread-keeper's `tail -1` fed the owner the stalest `Next up:`
// for a day). The hook reads `Estimate: N sessions` / `Sessions used: k` and fires
// the STOP at 2k ≥ 3N; `Next up:` is head -1 with a loud warning on duplicates.
{
  const MB = 'mission-budget (D3';
  const led = (...lines) => ({ 'pay.state.md': [...lines, ''].join('\n') });
  const status = (r) => /🧵 Mission pay — /.test(r.stdout);
  const overrun = (r) => /🛑 OVERRUN/.test(r.stdout);
  const dupWarn = (r) => /`Next up:` lines in the ledger/.test(r.stdout);
  const noEst = (r) => /No `Estimate:/.test(r.stdout);
  const nextLine = (r) => (r.stdout.split('\n').find((l) => l.trim().startsWith('Next up:')) || '').trim();

  // 1. No .plans/ at all → silent, exit 0.
  {
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: { prompt: 'hi' } });
    check('mission-budget: no .plans/ → silent, exit 0', r.code === 0 && r.stdout === '', `stdout=${JSON.stringify(r.stdout)}`);
  }
  // 2. Ledger fully done (no open beat) → not active → silent.
  {
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Estimate: 1 session', 'Sessions used: 5', '- [x] S1 — build', 'Next up: done') });
    check('mission-budget: no open [ ]/[~] beat → not active → silent', r.code === 0 && r.stdout === '', `stdout=${JSON.stringify(r.stdout)}`);
  }
  // 3. Under estimate → status line + Next up, no overrun.
  {
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Estimate: 4 sessions', 'Sessions used: 2', '- [x] S1 — build', '- [ ] S2 — build', 'Next up: S2') });
    check('mission-budget: k<1.5N → status "session 2/4 (est.)" + first Next up, no STOP',
      r.code === 0 && status(r) && /session 2\/4 \(est\.\)/.test(r.stdout) && nextLine(r) === 'Next up: S2' && !overrun(r) && !dupWarn(r) && !noEst(r),
      `stdout=${JSON.stringify(r.stdout)}`);
  }
  // 4. Exactly at 1.5× (N=2, k=3) → OVERRUN text, still exit 0.
  {
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Estimate: 2 sessions', 'Sessions used: 3', '- [ ] S3 — build', 'Next up: S3') });
    check('mission-budget: k=1.5N (3/2) → 🛑 OVERRUN scope-decision text, exit 0 (never blocks)',
      r.code === 0 && overrun(r) && /session 3 of 2 estimated/.test(r.stdout) && /ship a defined subset/.test(r.stdout),
      `code=${r.code} stdout=${JSON.stringify(r.stdout)}`);
  }
  // 5. Default one-session mission: N=1, k=2 → overrun (the one-session default has teeth).
  {
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Estimate: 1 session', 'Sessions used: 2', '- [ ] S1 — build', 'Next up: S1') });
    check('mission-budget: N=1, k=2 → OVERRUN (one-session default fires on the 2nd session)', r.code === 0 && overrun(r), `stdout=${JSON.stringify(r.stdout)}`);
  }
  // 6. Just under: N=18, k=26 → silent on overrun; k=27 → fires (integer 2k≥3N boundary).
  {
    const a = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Estimate: 18 sessions', 'Sessions used: 26', '- [ ] S27', 'Next up: S27') });
    const b = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Estimate: 18 sessions', 'Sessions used: 27', '- [ ] S28', 'Next up: S28') });
    check('mission-budget: boundary 26/18 silent, 27/18 fires (2k≥3N exact)', a.code === 0 && !overrun(a) && b.code === 0 && overrun(b),
      `a=${JSON.stringify(a.stdout)} b=${JSON.stringify(b.stdout)}`);
  }
  // 7. Two Next up: lines → FIRST wins and the duplicate is called out (LA-7).
  {
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Estimate: 3 sessions', 'Sessions used: 1', '- [ ] Checkpoint C', 'Next up: ckpt-C', '(kept for the record)', 'Next up: S2') });
    check('mission-budget: two Next up: lines → the FIRST is shown (head -1) + duplicate warning',
      r.code === 0 && nextLine(r) === 'Next up: ckpt-C' && dupWarn(r) && /2 `Next up:` lines/.test(r.stdout),
      `stdout=${JSON.stringify(r.stdout)}`);
  }
  // 8. Estimate: missing → reminder line, no overrun math, exit 0.
  {
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Sessions used: 9', '- [ ] S1 — build', 'Next up: S1') });
    check('mission-budget: no Estimate: → 📐 reminder, no OVERRUN, exit 0', r.code === 0 && status(r) && noEst(r) && !overrun(r), `stdout=${JSON.stringify(r.stdout)}`);
  }
  // 9. Sessions used: missing → treated as 0; garbage Estimate → treated as missing; garbage stdin → still exit 0.
  {
    const a = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Estimate: 2 sessions', '- [ ] S1', 'Next up: S1') });
    const b = runHook({ event: 'UserPromptSubmit', command: `printf 'not json' | bash "${PLUGIN}/hooks/lib/mission-budget.sh"`,
      ledgers: led('Estimate: lots', 'Sessions used: many', '- [ ] S1', 'Next up: S1') });
    check('mission-budget: missing Sessions used → 0/2; non-numeric fields + garbage stdin → reminder path, exit 0',
      a.code === 0 && /session 0\/2/.test(a.stdout) && !overrun(a) && b.code === 0 && noEst(b) && !overrun(b),
      `a=${JSON.stringify(a.stdout)} b=${JSON.stringify(b.stdout)}`);
  }
  // 10. Newest-mtime active ledger wins over an older active one (shared predicate).
  {
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: { 'old.state.md': 'Estimate: 1 session\n- [ ] S1\nNext up: S1\n', 'pay.state.md': 'Estimate: 3 sessions\nSessions used: 1\n- [ ] S1\nNext up: S1\n' } });
    check('mission-budget: newest-mtime active ledger is the one reported', r.code === 0 && status(r) && /session 1\/3/.test(r.stdout), `stdout=${JSON.stringify(r.stdout)}`);
  }

  // ── active-ledger predicate (orderly, 2026-10, v1.51.1) ──────────────────
  // A closed ledger kept "active" by its promoted `[~] … → OBLIGATIONS.md` rows,
  // and a planned never-started ledger, each printed a status line on EVERY
  // prompt. Fixtures mirror orderly's real ledgers (kitchen-ticket-printing,
  // track2-device-agent).
  const PROMOTED = [
    '- [~] OB-3 · added 2026-09-28 (planner) — do: drop column → promoted to .plans/OBLIGATIONS.md 2026-09-29 (OB-3)',
    '- [~] OB-4 · added 2026-09-28 — do: J1 on paper (owner) → OB-4',
  ];
  // 11. Closed via `Next up:` only (no stamp), promoted [~] rows → silent.
  {
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Estimate: 15 sessions', 'Sessions used: 15', '- [x] S1 — build', ...PROMOTED, 'Next up: none — mission CLOSED 2026-09-29') });
    check('mission-budget: closed ledger (Next up: mission CLOSED) with promoted [~] obligation rows → silent',
      r.code === 0 && r.stdout === '', `stdout=${JSON.stringify(r.stdout)}`);
  }
  // 12. `Closed:` stamp wins over a stale `Next up:` and a leftover [ ] row.
  {
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Estimate: 7 sessions', 'Sessions used: 4', 'Closed: 2026-08-24', '- [ ] Checkpoint p2', 'Next up: checkpoint p2') });
    check('mission-budget: `Closed: YYYY-MM-DD` stamp → silent even with a stale Next up and an open row',
      r.code === 0 && r.stdout === '', `stdout=${JSON.stringify(r.stdout)}`);
  }
  // 13. Promoted rows alone are not open beats (no closed marker at all) → silent.
  {
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Estimate: 2 sessions', 'Sessions used: 2', '- [x] S1 — build', ...PROMOTED, 'Next up: owner rows') });
    check('mission-budget: only promoted [~] → OB rows left → not active → silent',
      r.code === 0 && r.stdout === '', `stdout=${JSON.stringify(r.stdout)}`);
  }
  // 14. Planned, never started (`Sessions used: 0`, owner said stop) → silent.
  {
    const beats = Array.from({ length: 21 }, (_, i) => `- [ ] S${i + 1} — build`);
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Estimate: 20 sessions', 'Sessions used: 0', '> **⏸ STATUS: PLANNED — NOT STARTED.** owner: stop after planning', ...beats, 'Next up: S1 (blocked on OQ-1)') });
    check('mission-budget: planned/blocked ledger (Sessions used: 0, 21 open [ ]) → silent',
      r.code === 0 && r.stdout === '', `stdout=${JSON.stringify(r.stdout)}`);
  }
  // 15. Genuinely active: a promoted row does not hide a real open beat.
  {
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Status: active', 'Estimate: 4 sessions', 'Sessions used: 2', '- [x] S1 — build', ...PROMOTED, '- [ ] S2 — build', 'Next up: S2') });
    check('mission-budget: genuinely active ledger (open [ ] beat beside promoted rows) → status line',
      r.code === 0 && status(r) && /session 2\/4/.test(r.stdout) && nextLine(r) === 'Next up: S2', `stdout=${JSON.stringify(r.stdout)}`);
  }
  // 16. Explicit `Status:` — anything but active silences; `planned` is skipped.
  {
    const blocked = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Status: blocked', 'Estimate: 4 sessions', 'Sessions used: 2', '- [ ] S3', 'Next up: S3') });
    const planned = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: led('Status: planned', 'Estimate: 4 sessions', '- [ ] S1', 'Next up: S1') });
    check('mission-budget: `Status: blocked` → silent; `Status: planned` → silent',
      blocked.code === 0 && blocked.stdout === '' && planned.code === 0 && planned.stdout === '',
      `blocked=${JSON.stringify(blocked.stdout)} planned=${JSON.stringify(planned.stdout)}`);
  }
  // 17. Newest is CLOSED, an older ledger was never closed → silent (no fall-through
  //     to an abandoned mission — orderly surfaced a stale 7/13 ledger this way).
  {
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: {
        'stale.state.md': 'Estimate: 13 sessions\nSessions used: 7\n- [ ] S5\nNext up: P3 rendered gate\n',
        'pay.state.md': ['Estimate: 15 sessions', 'Sessions used: 15', ...PROMOTED, 'Next up: none — mission CLOSED 2026-09-29', ''].join('\n'),
      } });
    check('mission-budget: newest closed + older never-closed open ledger → silent (no fall-through)',
      r.code === 0 && r.stdout === '', `stdout=${JSON.stringify(r.stdout)}`);
  }
  // 18. Newest is planned-only, an older mission is running → the running one is
  //     reported (planning mission B must not hide mission A).
  {
    const r = runHook({ event: 'UserPromptSubmit', desc: MB, input: {},
      ledgers: {
        'pay.state.md': 'Estimate: 3 sessions\nSessions used: 2\n- [ ] S3\nNext up: S3\n',
        'next-mission.state.md': 'Estimate: 5 sessions\nSessions used: 0\n- [ ] S1\nNext up: S1\n',
      } });
    check('mission-budget: newest planned-only (Sessions used: 0) is skipped → the running older mission is reported',
      r.code === 0 && status(r) && /session 2\/3/.test(r.stdout) && !/next-mission/.test(r.stdout), `stdout=${JSON.stringify(r.stdout)}`);
  }
  // 19. ONE predicate: the same closed ledger (with a leftover not-started
  //     checkpoint row) is inactive for every consumer — Stop + PreToolUse
  //     enforcers stay silent, compact-resume names no ledger, and the
  //     handoff-budget is NOT silenced by it.
  {
    const closed = { 'pay.state.md': ['Closed: 2026-09-29', '## Checklist', '- [ ] Checkpoint — phase 2 review', ...PROMOTED, ''].join('\n') };
    const stop = runHook({ event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: closed });
    const pre = runHook({ event: 'PreToolUse', desc: PRE, input: { tool_input: { command: 'git commit -m x' } }, ledgers: closed });
    const cmp = runHook({ event: 'SessionStart', desc: 'compact-resume directive', input: { source: 'compact' }, ledgers: closed });
    const hb = runHook({ event: 'UserPromptSubmit', desc: 'handoff-budget',
      input: { session_id: `hb-closed-${process.pid}-${Date.now()}` }, transcript: { bytes: 3_700_000 }, ledgers: closed });
    check('active-ledger: a closed ledger is inactive for ALL consumers (enforcers silent, compact names none, handoff-budget nudges)',
      stop.code === 0 && !nudged(stop) && pre.code === 0 && !nudged(pre)
        && cmp.code === 0 && !/pay\.state\.md/.test(cmp.stdout)
        && hb.code === 0 && /Handoff budget/.test(hb.stdout),
      `stop=${JSON.stringify(stop.stdout)} pre=${JSON.stringify(pre.stdout)} cmp=${JSON.stringify(cmp.stdout)} hb=${JSON.stringify(hb.stdout)}`);
  }
}

// ── SessionStart:compact re-read directive ───────────────────────────────
// Matcher discipline is structural (the harness dispatches commands directly and
// does not apply matchers), so assert the registered matcher set itself.
// Extended for S5 (P3): compact-resume stays pinned to `compact` and nothing
// else — never `startup`, never `resume` — and obligations-due rides exactly
// `startup|resume`, a regex that must NOT match the string `compact` (the two
// beats may never compete on a post-compaction session start).
{
  const spec = JSON.parse(readFileSync(HOOKS, 'utf8'));
  const matchers = (spec.hooks.SessionStart || []).map((g) => g.matcher);
  // v1.47.0: a third SessionStart group (conform-check) shares the
  // `startup|resume` matcher — the invariant is "compact is alone on its
  // matcher and no other group can fire on compact", not a fixed count.
  check('SessionStart: matchers are ["compact", then only "startup|resume" groups] — none of the others matches "compact"',
    matchers.length >= 2 && matchers[0] === 'compact'
      && matchers.slice(1).every((m) => m === 'startup|resume' && !new RegExp(m).test('compact')),
    `matchers=${JSON.stringify(matchers)}`);
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
{ // the other half of `ls -t`: a newest ledger that is fully [x] is COMPLETE —
  // the focus finished, so there is NO active mission. The scan must NOT fall
  // through to an older ledger that was simply never closed (that is an
  // abandoned mission; orderly 2026-10 surfaced a stale 7/13 ledger this way).
  const r = runHook({
    event: 'SessionStart', desc: COMPACT, input: { source: 'compact' },
    ledgers: {
      'never-closed.state.md': ['## Checklist', '- [ ] Checkpoint — phase 1 review', ''].join('\n'),
      'finished.state.md': ['## Checklist', '- [x] S1 — build', '- [x] Checkpoint — phase 1 review', ''].join('\n'),
    },
  });
  check('SessionStart(compact): newest ledger complete → no active ledger (no fall-through to an older open one)',
    r.code === 0 && reReadDirective(r) && !/never-closed/.test(r.stdout) && !/finished\.state/.test(r.stdout),
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
  // One shared cwd: the marker lives in that cwd's private state dir (v1.68.0).
  const s = sid('once');
  const dir = mkdtempSync(path.join(tmpdir(), 'hooktest-'));
  const first = runHook({ event: 'UserPromptSubmit', desc: BUDGET, dir,
    input: { session_id: s }, transcript: { bytes: ADVISORY } });
  const again = runHook({ event: 'UserPromptSubmit', desc: BUDGET, dir,
    input: { session_id: s }, transcript: { bytes: ADVISORY + 1000 } });
  rmSync(dir, { recursive: true, force: true });
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
  const dir = mkdtempSync(path.join(tmpdir(), 'hooktest-'));
  const adv = runHook({ event: 'UserPromptSubmit', desc: BUDGET, dir,
    input: { session_id: s }, transcript: { bytes: ADVISORY } });
  const urg = runHook({ event: 'UserPromptSubmit', desc: BUDGET, dir,
    input: { session_id: s }, transcript: { bytes: URGENT } });
  const urg2 = runHook({ event: 'UserPromptSubmit', desc: BUDGET, dir,
    input: { session_id: s }, transcript: { bytes: URGENT + 1000 } });
  rmSync(dir, { recursive: true, force: true });
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
  const dir = mkdtempSync(path.join(tmpdir(), 'hooktest-')); // one cwd: per-cwd state dir (v1.68.0)
  const first = runHook({ event: 'UserPromptSubmit', desc: BUDGET, dir,
    input: { session_id: s }, transcript: { bytes: ADVISORY } });
  const again = runHook({ event: 'UserPromptSubmit', desc: BUDGET, dir,
    input: { session_id: s }, transcript: { bytes: ADVISORY + 500 } });
  rmSync(dir, { recursive: true, force: true });
  check('UserPromptSubmit(budget): metachar session_id → sanitized (nudges once, second dispatch silent, exit 0, empty stderr)',
    first.code === 0 && budgetNudge(first) && first.stderr === ''
      && again.code === 0 && again.stdout === '',
    `first=${JSON.stringify(first.stdout)} again=${JSON.stringify(again.stdout)} stderr=${JSON.stringify(first.stderr)}`);
}

// ── SessionStart:startup|resume obligations-due advisory (S5, P3) ────────
// Grep-only, no network (L5): the hook counts unticked `- [ ] OB-` rows in
// .plans/OBLIGATIONS.md plus unticked `- [ ]` rows inside any ledger's
// `## Closing` section, names both counts + the oldest row + /settle, and is
// otherwise silent. Four silencers exactly (OQ3, L13); every case below pins
// one of them in a direction, or a failure path's exit-0.
const OBLIG = 'obligations-due advisory';
const obFired = (r) => /Deferred obligations may be due/.test(r.stdout);
const REG_REL = '.plans/OBLIGATIONS.md';
// Register fixture: two unticked, one fired — count must be 2 and the OLDEST
// must be the FIRST unticked row (the register is append-only, so first =
// longest-waiting), not merely any unticked row.
const REG_2DUE = [
  '# Obligations register',
  '- [ ] OB-1 · added 2026-08-01 (planner) — do: re-measure the bands — when: the corpus gains 3 new records — probe: manual',
  '- [x] OB-2 · added 2026-08-02 (planner) — do: sync the docs — when: the PR is merged — probe: manual · fired 2026-08-10 (PR #9)',
  '- [ ] OB-3 · added 2026-08-03 (planner) — do: reap the phase branches — when: the integration PR is merged — probe: manual',
  '',
].join('\n');
const REG_ALL_FIRED = [
  '# Obligations register',
  '- [x] OB-1 · added 2026-08-01 (planner) — do: re-measure the bands — when: the corpus gains 3 new records — probe: manual · fired 2026-08-10 (corpus at 4)',
  '',
].join('\n');
// Ledger fixture: ONE unticked Closing row. The unticked checklist beat above
// the section and the stray `- [ ]` row after the next `## ` heading must NOT
// count — any other heading closes the section (the scoping pin).
const CLOSING_ONE_DUE = {
  'm.state.md': [
    '## Checklist',
    '- [x] S1 — build',
    '- [ ] S2 — polish (an open beat, NOT an obligation)',
    '',
    '## Closing',
    '- [ ] OB-a · added 2026-08-01 (planner) — do: reap the phase branches — when: the integration PR is merged AND CI is green on its merge commit — probe: manual',
    '- [~] OB-b · added 2026-08-01 (planner) — do: live-verify the hook — when: the shipped version is installed — probe: manual → OB-9',
    '- [x] OB-c · added 2026-08-01 (planner) — do: republish the status page — when: the release is on main — probe: manual · fired 2026-08-10 (commit abc)',
    '',
    '## Handoff log',
    '- [ ] a stray unticked row after the section closed — never an obligation',
    '',
  ].join('\n'),
};
const CLOSING_NONE_DUE = {
  'm.state.md': [
    '## Checklist',
    '- [ ] S2 — polish',
    '',
    '## Closing',
    '- [x] OB-a · added 2026-08-01 (planner) — do: reap the phase branches — when: the integration PR is merged — probe: manual · fired 2026-08-10 (PR #7)',
    '',
  ].join('\n'),
};
{ // fires: register + Closing together — both counts named, oldest = OB-1 (the
  // register's FIRST unticked row wins over OB-3 and the ledger), /settle
  // named, ≤3 lines, exit 0, valid additionalContext JSON.
  const r = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'startup', session_id: sid('ob-both') },
    ledgers: CLOSING_ONE_DUE, files: { [REG_REL]: { content: REG_2DUE } } });
  const m = ctx(r) || '';
  check('SessionStart(startup): register 2-due + Closing 1-due → advisory naming both counts, the oldest register row (OB-1), and /agentic-workflow:settle (≤3 lines)',
    r.code === 0 && obFired(r)
      && /2 register row\(s\)/.test(m) && /1 mission-ledger/.test(m)
      && /Oldest: - \[ \] OB-1/.test(m) && !/OB-3/.test(m)
      && /\/agentic-workflow:settle/.test(m) && /Grep-only advisory/.test(m)
      && m.split('\n').length <= 3,
    `stdout=${JSON.stringify(r.stdout)}`);
}
{ // fires: Closing rows alone (no register) — and the scoping pin: exactly ONE
  // row counts despite two other unticked `- [ ]` lines outside the section.
  const r = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'resume', session_id: sid('ob-clo') }, ledgers: CLOSING_ONE_DUE });
  const m = ctx(r) || '';
  check('SessionStart(resume): no register, Closing 1-due → advisory with 0 register + 1 Closing (checklist beats and post-section rows never count), oldest = the OB-a row',
    r.code === 0 && obFired(r)
      && /0 register row\(s\)/.test(m) && /1 mission-ledger/.test(m)
      && /Oldest: - \[ \] OB-a/.test(m) && m.split('\n').length <= 3,
    `stdout=${JSON.stringify(r.stdout)}`);
}
{ // silencer 1, silent direction: no register AND no `## Closing` anywhere —
  // an active ledger full of open beats is not a parking place. Plus the
  // bare-repo variant: no .plans/ at all.
  const led = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'startup', session_id: sid('ob-noplace') }, ledgers: NOT_STARTED });
  const bare = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'startup', session_id: sid('ob-bare') } });
  check('SessionStart(startup): no register and no ## Closing section (open-beat ledger; and bare cwd) → silent, exit 0',
    led.code === 0 && led.stdout === '' && bare.code === 0 && bare.stdout === '',
    `led=${JSON.stringify(led.stdout)} bare=${JSON.stringify(bare.stdout)}`);
}
{ // silencer 2, silent direction: both parking places exist but every row is
  // fired [x] or promoted [~] — zero unticked, nothing to say. (The firing
  // direction is the two cases above.)
  const r = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'startup', session_id: sid('ob-allfired') },
    ledgers: CLOSING_NONE_DUE, files: { [REG_REL]: { content: REG_ALL_FIRED } } });
  check('SessionStart(startup): register + Closing present but zero unticked ([x]/[~] only) → silent, exit 0',
    r.code === 0 && r.stdout === '', `stdout=${JSON.stringify(r.stdout)}`);
}
{ // silencer 3: once per session — same session_id fires once, second dispatch
  // silent; a DIFFERENT session_id still fires (the marker is per-session, not
  // global).
  const s = sid('ob-once');
  const first = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'startup', session_id: s }, files: { [REG_REL]: { content: REG_2DUE } } });
  const again = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'resume', session_id: s }, files: { [REG_REL]: { content: REG_2DUE } } });
  const other = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'startup', session_id: sid('ob-other') }, files: { [REG_REL]: { content: REG_2DUE } } });
  check('SessionStart(startup/resume): advisory fires ONCE per session — second dispatch same session_id silent, a different session_id still fires',
    first.code === 0 && obFired(first) && again.code === 0 && again.stdout === ''
      && other.code === 0 && obFired(other),
    `first=${JSON.stringify(first.stdout)} again=${JSON.stringify(again.stdout)}`);
}
{ // silencer 3, the write-only-on-fire pin: a SILENT dispatch (zero due) must
  // not burn the session's one advisory — the same session_id still fires once
  // rows become due.
  const s = sid('ob-noburn');
  const quiet = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'startup', session_id: s }, files: { [REG_REL]: { content: REG_ALL_FIRED } } });
  const later = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'resume', session_id: s }, files: { [REG_REL]: { content: REG_2DUE } } });
  check('SessionStart(startup/resume): a silent zero-due dispatch does not consume the marker — the same session still gets its one advisory when rows are due',
    quiet.code === 0 && quiet.stdout === '' && later.code === 0 && obFired(later),
    `quiet=${JSON.stringify(quiet.stdout)} later=${JSON.stringify(later.stdout)}`);
}
{ // metachar session_id: sanitized into the marker path (the handoff-budget
  // sanitizer pin, mirrored) — inert, fires once, second dispatch silent,
  // empty stderr, exit 0.
  const s = `${sid('ob-meta')}/../nope; $(touch HACK) \`touch HACK2\` "d" 's'`;
  const first = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'startup', session_id: s }, files: { [REG_REL]: { content: REG_2DUE } } });
  const again = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'startup', session_id: s }, files: { [REG_REL]: { content: REG_2DUE } } });
  check('SessionStart(startup): metachar session_id → sanitized (fires once, second dispatch silent, exit 0, empty stderr)',
    first.code === 0 && obFired(first) && first.stderr === ''
      && again.code === 0 && again.stdout === '',
    `first=${JSON.stringify(first.stdout)} again=${JSON.stringify(again.stdout)} stderr=${JSON.stringify(first.stderr)}`);
}
{ // failure paths, all silent AND exit 0 (silencer 4): missing session_id with
  // due rows staged, and garbage stdin (a bare JSON string — jq's .session_id
  // lookup fails, the guard exits).
  const nosid = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'startup' }, files: { [REG_REL]: { content: REG_2DUE } } });
  const garbage = runHook({ event: 'SessionStart', desc: OBLIG,
    input: 'not json {{{ definitely-not-an-object' });
  check('SessionStart(startup): missing session_id or garbage stdin → silent, exit 0',
    nosid.code === 0 && nosid.stdout === '' && garbage.code === 0 && garbage.stdout === '',
    `codes=${JSON.stringify([nosid.code, garbage.code])} out=${JSON.stringify([nosid.stdout, garbage.stdout])}`);
}
{ // injection probe: a register row full of shell metacharacters passes only
  // through grep + `jq -n --arg` — the advisory is valid JSON carrying the text
  // inert, never executing it; empty stderr, exit 0.
  const evil = [
    '# Obligations register',
    '- [ ] OB-1 · added 2026-08-01 (planner) — do: $(touch HACK) `touch HACK2`; rm -rf x — when: "d" \'s\' $HOME — probe: manual',
    '',
  ].join('\n');
  const r = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'startup', session_id: sid('ob-evil') }, files: { [REG_REL]: { content: evil } } });
  const m = ctx(r);
  check('SessionStart(startup): metachar register row → inert (valid JSON advisory carrying the text, exit 0, empty stderr)',
    r.code === 0 && typeof m === 'string' && /Deferred obligations may be due/.test(m)
      && /\$\(touch HACK\)/.test(m) && r.stderr === '',
    `code=${r.code} stderr=${JSON.stringify(r.stderr)} stdout=${JSON.stringify(r.stdout)}`);
}

{ // ckpt-p4 fold (OB-7): the oldest row is capped at 140 CODEPOINTS, not bytes.
  // `printf '%.140s'` is bytes on both GNU and BSD and can split a multibyte
  // char, leaving invalid UTF-8 in the JSON — obligations-due.sh:122 uses jq's
  // `.[0:140]` for exactly that reason, and nothing pinned it. The row below is
  // padded with em-dashes (3 bytes each) so that byte 140 lands INSIDE a
  // character: under a bytes implementation this case yields a lone
  // continuation byte, under codepoint slicing it yields 140 clean codepoints.
  // That divergence is the whole point — a shorter or ASCII-only row would pass
  // under either and prove nothing.
  const LONG_ROW = '- [ ] OB-1 · added 2026-08-01 (planner) — do: '
    + '—'.repeat(120) + ' — when: the corpus grows — probe: manual';
  const cps = [...LONG_ROW];
  const r = runHook({ event: 'SessionStart', desc: OBLIG,
    input: { source: 'startup', session_id: sid('ob-long') },
    files: { [REG_REL]: { content: `# Obligations register\n${LONG_ROW}\n` } } });
  const m = ctx(r) || '';
  const oldest = (m.split('\n').find((l) => l.startsWith('Oldest: ')) || '').slice(8);
  check('SessionStart(startup): >140-codepoint register row → Oldest truncated to exactly 140 CODEPOINTS (multibyte-safe: byte 140 falls mid-char), still ≤3 lines, exit 0',
    r.code === 0 && cps.length > 140 && Buffer.byteLength(LONG_ROW.slice(0, 140), 'utf8') !== 140
      && [...oldest].length === 140 && oldest === cps.slice(0, 140).join('')
      && !oldest.includes('�') && m.split('\n').length <= 3,
    `cps=${cps.length} oldestCps=${[...oldest].length} oldest=${JSON.stringify(oldest.slice(-12))}`);
}

// ── Catalog wiring (§6.1, 2026-08-19): docs-reminder names the catalog on
// route/schema edits when tools/catalog.mjs ships; compact-resume adds the
// catalog README as re-read item 3 when it exists (byte-for-byte otherwise).
{
  const DOCS = 'Docs reminder when high-impact';
  const edit = (fp) => ({ tool_input: { file_path: fp } });
  const a = runHook({ event: 'PostToolUse', desc: DOCS, input: edit('/repo/server/api/orders/index.get.ts') });
  check('docs-reminder: route edit, no tools/catalog.mjs → plain stale-doc reminder', a.code === 0 && /High-impact file changed/.test(a.stdout) && !/catalog/.test(a.stdout), a.stdout);
  const b = runHook({ event: 'PostToolUse', desc: DOCS, input: edit('/repo/server/api/orders/index.get.ts'), files: { 'tools/catalog.mjs': { content: '// stub' } } });
  check('docs-reminder: route edit with tools/catalog.mjs → names the catalog + features.md row', b.code === 0 && /node tools\/catalog\.mjs/.test(b.stdout) && /features\.md/.test(b.stdout), b.stdout);
  const c = runHook({ event: 'PostToolUse', desc: DOCS, input: edit('/repo/prisma/schema.prisma'), files: { 'tools/catalog.mjs': { content: '// stub' } } });
  check('docs-reminder: schema edit with catalog → names the catalog', c.code === 0 && /catalog/.test(c.stdout), c.stdout);
  const d = runHook({ event: 'PostToolUse', desc: DOCS, input: edit('/repo/app/pages/x.vue'), files: { 'tools/catalog.mjs': { content: '// stub' } } });
  check('docs-reminder: ordinary file → silent', d.code === 0 && d.stdout.trim() === '', d.stdout);

  const COMPACT_D = 'compact-resume directive';
  const led = { 'm.state.md': '- [ ] S1 — build\nNext up: S1\n' };
  const e = runHook({ event: 'SessionStart', desc: COMPACT_D, input: { source: 'compact' }, ledgers: led });
  const f = runHook({ event: 'SessionStart', desc: COMPACT_D, input: { source: 'compact' }, ledgers: led, files: { 'docs/product/catalog/README.md': { content: '# Product catalog\n' } } });
  const lines = (r) => { try { return JSON.parse(r.stdout).hookSpecificOutput.additionalContext.split('\n'); } catch { return []; } };
  check('compact-resume: no catalog → directive unchanged (no item 3)', e.code === 0 && !lines(e).some((l) => /catalog\/README/.test(l)) && lines(e).length <= 6, JSON.stringify(e.stdout));
  check('compact-resume: catalog README present → item 3 names it, still ≤6 lines', f.code === 0 && lines(f).some((l) => /3\. docs\/product\/catalog\/README\.md/.test(l)) && lines(f).length <= 6, JSON.stringify(f.stdout));
}

// ── SessionStart:startup|resume conform-check advisory (v1.47.0) ─────────
// The "recognize" half of conformance: tools/conform.mjs --brief through the
// hook. Fixtures build a project at various distances from the installed plugin.
{
  const CONF = 'conform-check advisory';
  const pv = JSON.parse(readFileSync(path.join(PLUGIN, '.claude-plugin/plugin.json'), 'utf8')).version;
  const ctxOf = (r) => { try { return JSON.parse(r.stdout).hookSpecificOutput.additionalContext; } catch { return ''; } };
  const wf = (stamp, rows) => `# The Workflow\n\n<!-- protocol-master: v${stamp} -->\n\n## 10. Project profile\n\n| Key | Value |\n|---|---|\n${rows.map((r) => `| **${r}** | x |`).join('\n')}\n\n## 11. Autopilot mode\n`;
  const FULL10 = ['Default branch', 'Staging', 'Issue tracker', 'Test users'];
  const conformant = {
    'docs/WORKFLOW.md': { content: wf(pv, FULL10) },
    'AGENTS.md': { content: '# Agent conventions\n\nThis project runs the Agentic Workflow — read `docs/WORKFLOW.md` §10 first.\n' },
    'docs/product/roadmap.md': { content: '# Roadmap (epic view)\n\n## Epics\n' },
    'tools/catalog.mjs': { content: readFileSync(path.join(PLUGIN, 'tools/catalog.mjs'), 'utf8') },
    'docs/product/catalog/README.md': { content: '# Product catalog\n' },
    'docs/product/catalog/api.md': { content: '# API\n' },
    'docs/product/catalog/data-model.md': { content: '# Data model\n' },
    'docs/product/catalog/features.md': { content: '# Features\n' },
  };
  // v1.61.0 ceremony-profile-row: a conformant project carries a CONFIRMED,
  // consistent §10.2 — rendered by ceremony.mjs itself from the template fences
  // against a copy of the fixture tree, so the hook's re-check finds no drift.
  {
    const tpl = readFileSync(path.join(PLUGIN, 'templates/WORKFLOW.md'), 'utf8');
    const fence = (n) => tpl.slice(tpl.indexOf(`<!-- ${n} -->`), tpl.indexOf(`<!-- /${n} -->`) + n.length + 10);
    const body = (cell, table) => wf(pv, FULL10).replace('## 10. Project profile', `## 0. Lifecycle\n\n${fence('stage-table')}\n\n## 5. Missions\n\n${fence('checkpoint-gates')}\n\n## 10. Project profile`)
      .replace('\n\n## 11. Autopilot mode', `${cell ? `\n| **Ceremony profile** | ${cell} |` : ''}\n\n### 10.2 Ceremony\n\n${table}\n\n## 11. Autopilot mode`);
    const d = mkdtempSync(path.join(tmpdir(), 'hooktest-cer-'));
    for (const [f, { content }] of Object.entries({ ...conformant, 'docs/WORKFLOW.md': { content: body('', '') } })) { mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); writeFileSync(path.join(d, f), content); }
    const r = spawnSync('node', [path.join(PLUGIN, 'tools/ceremony.mjs'), 'derive', '--confirm', 'Owner', '--json', '--root', d], { encoding: 'utf8' });
    rmSync(d, { recursive: true, force: true });
    let ren = { row: '', table: '' }; try { ren = JSON.parse(r.stdout).render; } catch { /* the conformant case then fails loudly */ }
    conformant['docs/WORKFLOW.md'] = { content: body(ren.row, ren.table) };
  }
  // v1.62.0 attribution-settings: the §10 Attribution row + its matching
  // .claude/settings.json mirror (what attribution.mjs apply writes).
  conformant['docs/WORKFLOW.md'].content = conformant['docs/WORKFLOW.md'].content.replace('| **Default branch** | x |\n', '| **Default branch** | x |\n| **Attribution** | commit: default · pr: default |\n');
  conformant['.claude/settings.json'] = { content: `${JSON.stringify({ attribution: { commit: 'Generated with The XYZ Protocol', pr: 'Generated with The XYZ Protocol' } }, null, 2)}\n` };
  const sid = (t) => `conf-${t}-${process.pid}-${Date.now()}`;

  { const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('a') } });
    check('conform-check: not an adopted project (no docs/WORKFLOW.md) → silent', r.code === 0 && r.stdout === '', r.stdout); }
  { const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('b') }, files: conformant });
    check('conform-check: fully conformant project → silent', r.code === 0 && r.stdout === '', r.stdout); }
  { const files = { ...conformant, 'docs/WORKFLOW.md': { content: conformant['docs/WORKFLOW.md'].content.replace(/^\| \*\*Ceremony profile\*\* .*\n/m, '') } };
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('cer') }, files });
    check('conform-check: no Ceremony profile row → ceremony-profile-row gap with ceremony.mjs check\'s first finding', /ceremony-profile-row/.test(ctxOf(r)) && /No ceremony profile/.test(ctxOf(r)), JSON.stringify(ctxOf(r))); }
  { const files = { ...conformant, 'docs/WORKFLOW.md': { content: conformant['docs/WORKFLOW.md'].content.replace(/^(\| \*\*Ceremony profile\*\* \| ).*\|$/m, '$1proposed 2026-10-15 — full ceremony still applies until you confirm. |') } };
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('cerp') }, files });
    check('conform-check: a `proposed` ceremony profile is conformant (confirming is the owner\'s call) → silent', r.code === 0 && r.stdout === '' && /proposed 2026-10-15/.test(files['docs/WORKFLOW.md'].content), r.stdout); }
  { const files = { ...conformant, 'docs/WORKFLOW.md': { content: conformant['docs/WORKFLOW.md'].content.replace(/^\| \*\*Attribution\*\* .*\n/m, '') } };
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('att') }, files });
    check('conform-check: no §10 Attribution row → attribution-settings gap', /attribution-settings/.test(ctxOf(r)) && /no \*\*Attribution\*\* row/.test(ctxOf(r)), JSON.stringify(ctxOf(r))); }
  { const files = { ...conformant, '.claude/settings.json': { content: '{"attribution":{"commit":"Co-Authored-By: Someone <x@y>","pr":"Generated with The XYZ Protocol"}}\n' } };
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('atd') }, files });
    check('conform-check: settings.json drifted from the row → attribution-settings gap naming the side', /attribution-settings/.test(ctxOf(r)) && /attribution\.commit/.test(ctxOf(r)), JSON.stringify(ctxOf(r))); }
  { const files = { ...conformant, 'docs/WORKFLOW.md': { content: wf('1.43.0', ['Default branch']) } };
    delete files['tools/catalog.mjs']; delete files['docs/product/roadmap.md'];
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('c') }, files });
    const m = ctxOf(r);
    check('conform-check: v1.43 project (no Staging/Issue-tracker rows, no roadmap, no catalog tooling) → ≤3-line advisory naming gaps + /sync',
      r.code === 0 && /behind the installed plugin/.test(m) && /v1\.43\.0 < plugin v/.test(m) && /profile-staging-row/.test(m) && /agentic-workflow:sync/.test(m) && m.split('\n').length <= 3, JSON.stringify(m)); }
  { const files = { ...conformant };
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('d') }, files,
      ledgers: { 'm.state.md': '- [ ] S1\nNext up: S1\nNext up: S2\n' } });
    const m = ctxOf(r);
    check('conform-check: active ledger without budget fields and with two Next up: → advisory names ledger gaps',
      r.code === 0 && /ledger-budget-fields/.test(m) && /ledger-single-next-up/.test(m), JSON.stringify(m)); }
  { const files = { ...conformant, 'BACKLOG.md': { content: '# Backlog\n- [ ] **thing** foo\n' } };
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'resume', session_id: sid('e') }, files });
    check('conform-check: hand-written BACKLOG.md → backlog-is-generated-view gap (fires on resume too)', r.code === 0 && /backlog-is-generated-view/.test(ctxOf(r)), JSON.stringify(ctxOf(r))); }
  { const files = { ...conformant, 'BACKLOG.md': { content: '# Backlog — generated view (do not edit)\n' } };
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('f') }, files });
    check('conform-check: generated-view BACKLOG.md → silent', r.code === 0 && r.stdout === '', r.stdout); }
  { const files = { ...conformant, 'docs/WORKFLOW.md': { content: wf('1.43.0', FULL10) } };
    const id = sid('g');
    const a = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: id }, files });
    const b = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: id }, files });
    check('conform-check: stale stamp only → one-line-ish advisory once per session (second dispatch silent)', a.code === 0 && /protocol-stamp/.test(ctxOf(a)) && b.code === 0 && b.stdout === '', `a=${JSON.stringify(ctxOf(a))} b=${JSON.stringify(b.stdout)}`); }
  // ladder/template label consistency (v1.48.4): every has10('<label>') in
  // conform.mjs must be satisfied by the TEMPLATE's own §10 — the two files
  // diverged once ('Test users' vs '**Test users / auth access**') and a
  // verbatim template copy failed its own ladder forever.
  { const conformSrc = readFileSync(path.join(PLUGIN, 'tools/conform.mjs'), 'utf8');
    const labels = [...conformSrc.matchAll(/has10\('([^']+)'\)/g)].map((m) => m[1]);
    const tpl = readFileSync(path.join(PLUGIN, 'templates/WORKFLOW.md'), 'utf8');
    const s10 = (tpl.match(/^## 10\.[\s\S]*?(?=^## 11\.)/m) || [''])[0];
    const missing = labels.filter((l) => !new RegExp(`^\\|\\s*\\*\\*${l}\\b`, 'm').test(s10));
    check(`conform/template consistency: every has10 label (${labels.join(', ')}) matches a template §10 row`,
      labels.length >= 3 && missing.length === 0, `missing=${JSON.stringify(missing)}`); }

  // plans-tracked (v1.48.1): a gitignored .plans/ is a gap; targeted ignores are not.
  { const files = { ...conformant, '.gitignore': { content: 'node_modules\n.plans/\n' } };
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('k') }, ledgers: { 'm.state.md': 'Estimate: 1 session\nSessions used: 0\n- [ ] S1\nNext up: S1\n' }, files });
    check('conform-check: .plans/ gitignored → plans-tracked gap', r.code === 0 && /plans-tracked/.test(ctxOf(r)), JSON.stringify(ctxOf(r))); }
  { const files = { ...conformant, '.gitignore': { content: 'node_modules\n.plans/screenshots/\n.plans/*.png\n' } };
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('l') }, ledgers: { 'm.state.md': 'Estimate: 1 session\nSessions used: 0\n- [ ] S1\nNext up: S1\n' }, files });
    check('conform-check: only targeted .plans sub-ignores → silent', r.code === 0 && r.stdout === '', r.stdout); }

  // claude-md-anchors (v1.47.2): dead anchors in the conventions file are a gap;
  // resolving anchors, globs/placeholders/URLs, and a missing file are not. The
  // conventions file is now AGENTS.md (v1.51.0 — conventionsFile() prefers it),
  // so the anchors live there; the pointer to docs/WORKFLOW.md keeps
  // agents-md-primary satisfied.
  { const files = { ...conformant,
      'AGENTS.md': { content: 'See `docs/WORKFLOW.md`. Run `pnpm run lint`; read `src/gone.ts`; skip `docs/*plan*`, `<x/y.md>`, `https://a.com/b.md`.\n' },
      'package.json': { content: '{"scripts":{"test":"x"}}' } };
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('i') }, files });
    const m = ctxOf(r);
    check('conform-check: AGENTS.md dead script + dead path → claude-md-anchors gap (globs/URLs/placeholders skipped)',
      r.code === 0 && /claude-md-anchors/.test(m), JSON.stringify(m)); }
  { const files = { ...conformant,
      'AGENTS.md': { content: 'Read `docs/WORKFLOW.md` and run `pnpm run test`; routes like `/api/x/*` are fine.\n' },
      'package.json': { content: '{"scripts":{"test":"x"}}' } };
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('j') }, files });
    check('conform-check: AGENTS.md with resolving anchors only → silent', r.code === 0 && r.stdout === '', r.stdout); }

  // agents-md-primary (v1.51.0): the conventions ladder. AGENTS.md is the
  // primary, runtime-neutral file both Claude and Codex read; CLAUDE.md imports
  // it via `@AGENTS.md`. Three gap states plus the conformant baseline — these
  // are ADDED alongside the existing conform-check cases, not a move.
  { // baseline: conformant fixture (AGENTS.md carries the docs/WORKFLOW.md pointer,
    // no CLAUDE.md) → agents-md-primary satisfied, no advisory.
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('am0') }, files: conformant });
    check('conform-check(agents-md-primary): conformant AGENTS.md with pointer → silent (no gap)',
      r.code === 0 && r.stdout === '' && !/agents-md-primary/.test(ctxOf(r)), JSON.stringify(ctxOf(r))); }
  { // gap 1: no AGENTS.md at all.
    const files = { ...conformant }; delete files['AGENTS.md'];
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('am1') }, files });
    check('conform-check(agents-md-primary): no AGENTS.md → agents-md-primary gap',
      r.code === 0 && /agents-md-primary/.test(ctxOf(r)), JSON.stringify(ctxOf(r))); }
  { // gap 2: AGENTS.md present + a CLAUDE.md whose first non-blank line is not `@AGENTS.md`.
    const files = { ...conformant, 'CLAUDE.md': { content: '# Claude-only notes\n\nsome project notes\n' } };
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('am2') }, files });
    check('conform-check(agents-md-primary): CLAUDE.md without the `@AGENTS.md` import → agents-md-primary gap',
      r.code === 0 && /agents-md-primary/.test(ctxOf(r)), JSON.stringify(ctxOf(r))); }
  { // gap 3: AGENTS.md present but lacking the docs/WORKFLOW.md pointer block.
    const files = { ...conformant, 'AGENTS.md': { content: '# Agent conventions\n\nRun the workflow.\n' } };
    const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'startup', session_id: sid('am3') }, files });
    check('conform-check(agents-md-primary): AGENTS.md lacking the docs/WORKFLOW.md pointer → agents-md-primary gap',
      r.code === 0 && /agents-md-primary/.test(ctxOf(r)), JSON.stringify(ctxOf(r))); }

  { const r = runHook({ event: 'SessionStart', desc: CONF, input: { source: 'compact', session_id: sid('h') }, files: { ...conformant, 'docs/WORKFLOW.md': { content: wf('1.43.0', ['Default branch']) } } });
    check('conform-check: source=compact → silent (compact-resume owns that beat)', r.code === 0 && r.stdout === '', r.stdout); }
}

// ── publish-approval (v1.52.0): the §14 gate tool (hash pin, epoch, one-time claim
// token) and the lib hook hooks/lib/publish-guard.sh. Every case asserts exit code AND
// text. The gate is the runtime-agnostic invariant; the hook is the Claude-side backstop
// that sees command text only (threat model: accident and double-fire, not an adversary).
{
  const PG = 'publishing guardrail';
  const QP = 'docs/product/launch/publish-queue.md', CP = 'docs/product/launch/publish-claims.jsonl', LP = 'docs/product/launch/publish-log.md';
  const NOW = ['--now', '2026-10-06T12:00:00Z'];
  const sha = (t) => createHash('sha256').update(t).digest('hex');
  const H = sha('hello world'), H8 = H.slice(0, 8);
  const queue = ({ id = 'P-001', kind = 'post', state = 'approved', approvedFor, epoch = 1, scheduled = '2026-10-06 09:00', paid = 'no', body = 'hello world', bodySha } = {}) => {
    const h = bodySha ?? sha(body);
    const pin = approvedFor ?? (state === 'approved' ? `${h.slice(0, 8)}@${epoch}` : '');
    return { content: ['Policy: **human-only**', '',
      '| id | kind | channel | scheduled (UTC) | state | paid | body-sha256 | epoch | approved-for | claim | source asset | summary |',
      '|---|---|---|---|---|---|---|---|---|---|---|---|',
      `| ${id} | ${kind} | devto | ${scheduled} | ${state} | ${paid} | ${h} | ${epoch} | ${pin} |  | a.md | one |`,
      '', `### ${id} — devto`, body, '', '---', ''].join('\n') };
  };
  const wfPolicy = (policy) => ({ content: `# WORKFLOW\n\n| Field | Value |\n|---|---|\n| **Publish policy** | ${policy} |\n` });
  const MAY = 'may-publish (delegated 2026-10-01, channels: linkedin, rate: 5/wk, organic-only)';
  const gate = (args, files, dir) => runGate({ args: [...args, ...NOW], files, dir });
  const row = (g, id = 'P-001') => {
    const c = (g.read(QP).split('\n').find((l) => l.startsWith(`| ${id} |`)) || '').split('|').slice(1, -1).map((s) => s.trim());
    return { state: c[4], epoch: c[7], pin: c[8], claim: c[9] };
  };
  const events = (g) => g.read(CP).trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const done = (g) => rmSync(g.dir, { recursive: true, force: true });
  const fire = (cmd, files) => runHook({ event: 'PreToolUse', desc: PG, input: { tool_input: { command: cmd } }, files });
  const claimLine = (tok, event, kind = 'post', id = 'P-001') => JSON.stringify({ ts: '2026-10-06T12:00:00Z', event, id, kind, sha8: H8, epoch: 1, token: tok, run: 'r-0001', by: 'human', note: null }) + '\n';

  { const g = gate(['claim', 'P-001'], { [QP]: queue({ body: 'hello world, edited', bodySha: H, approvedFor: `${H8}@1` }), 'docs/WORKFLOW.md': wfPolicy('human-only') });
    const r = row(g), ev = events(g);
    check('publish-gate: tampered body → claim REFUSED (exit 2), row reset to draft, epoch+1, REFUSED line',
      g.code === 2 && /^publish run: REFUSED P-001 approved@[0-9a-f]{8}\/e1, current [0-9a-f]{8}\/e2 -> reset to draft$/m.test(g.stdout) &&
      r.state === 'draft' && r.epoch === '2' && r.pin === '' && ev.at(-1)?.event === 'reset', `code=${g.code} ${g.stdout}${g.stderr} ${JSON.stringify(r)}`); done(g); }
  { const g = gate(['claim', 'P-001'], { [QP]: queue({ epoch: 2, approvedFor: `${H8}@1` }), 'docs/WORKFLOW.md': wfPolicy('human-only') });
    check('publish-gate: stale epoch (body reverted, pin from epoch 1) → claim REFUSED (exit 2), "epoch 1 approved, now 2"',
      g.code === 2 && g.stderr.includes('epoch 1 approved, now 2') && row(g).state === 'draft', `code=${g.code} ${g.stderr}`); done(g); }
  { const a = gate(['claim', 'P-001'], { [QP]: queue(), 'docs/WORKFLOW.md': wfPolicy('human-only') });
    const b = gate(['claim', 'P-001'], undefined, a.dir);
    check('publish-gate: double claim → first mints PUBLISH_CLAIM, second REFUSED (exit 2) "already claimed"',
      a.code === 0 && /^PUBLISH_CLAIM=[0-9a-f]{8}$/.test(a.stdout.trim().split('\n').at(-1)) &&
      b.code === 2 && /already claimed \d\d:\d\d \(run r-[0-9a-f]{4}\)\. If that run died, reconcile it\./.test(b.stderr), `${a.code} ${a.stdout} | ${b.code} ${b.stderr}`);
    const c = events(a).filter((e) => e.event === 'claimed');
    check('publish-gate: the claimed event carries kind + id + token (the hook reads only the jsonl)',
      c.length === 1 && c[0].kind === 'post' && c[0].id === 'P-001' && /^[0-9a-f]{8}$/.test(c[0].token) && row(a).claim.startsWith(`${c[0].token} claimed `), JSON.stringify(c)); done(a); }
  { const a = gate(['claim', 'P-001'], { [QP]: queue(), 'docs/WORKFLOW.md': wfPolicy('human-only') });
    const tok = a.stdout.trim().split('\n').at(-1).split('=')[1];
    const u = gate(['outcome', tok, 'unknown'], undefined, a.dir);
    const s = gate(['status'], undefined, a.dir);
    const again = gate(['claim', 'P-001'], undefined, a.dir);
    const rec = gate(['reconcile', 'P-001', '--delivered', 'https://dev.to/x/1'], undefined, a.dir);
    const log = rec.read(LP).split('\n').find((l) => l.includes('https://dev.to/x/1')) || '';
    check('publish-gate: unknown outcome → row unknown, status "Needs you", re-claim REFUSED, reconcile --delivered writes the log row',
      u.code === 0 && u.stderr.includes('may or may not have posted') && /Needs you \(1\)/.test(s.stdout) && s.stdout.includes('reconcile P-001') &&
      again.code === 2 && again.stderr.includes('outcome unknown') && rec.code === 0 && row(rec).state === 'delivered' && / human /.test(log),
      `${u.code}/${s.stdout}/${again.code} ${again.stderr}/${rec.code} ${rec.stderr} log=${log}`); done(a); }
  { const g = gate(['claim', 'O-001'], { [QP]: queue({ id: 'O-001', kind: 'outreach' }), 'docs/WORKFLOW.md': wfPolicy(MAY) });
    const gateOk = g.code === 2 && g.stderr.includes('O-001 is outreach — only you can send it, by hand') && !events(g).some((e) => e.event === 'claimed');
    const h = fire('PUBLISH_CLAIM=deadbeef curl -X POST https://api.linkedin.com/v2/messages -d @dm.json',
      { 'docs/WORKFLOW.md': wfPolicy(MAY), [CP]: { content: claimLine('deadbeef', 'claimed', 'outreach', 'O-001') } });
    check('publish-guard: outreach under delegation → gate never mints; hook BLOCKS a forged token (exit 2) regardless of policy',
      gateOk && h.code === 2 && h.stderr.includes('O-001 is outreach — individual outreach is never delegable'), `${g.code} ${g.stderr} | ${h.code} ${h.stderr}`); done(g); }
  { const post = 'curl -X POST https://api.linkedin.com/v2/ugcPosts';
    const blocked = (r) => r.code === 2 && r.stderr.includes('publish-host call without a claim token');
    const a = fire(post, { 'docs/WORKFLOW.md': wfPolicy('human-only') }), b = fire(post, { 'docs/WORKFLOW.md': wfPolicy(MAY) });
    const c = fire('curl https://api.resend.com/emails -d @body.json', { 'docs/WORKFLOW.md': wfPolicy('human-only') });
    check('publish-guard: tokenless publish-host call → BLOCK (exit 2) under human-only, under may-publish, and for an email host',
      blocked(a) && blocked(b) && blocked(c), `${a.code} ${b.code} ${c.code} ${c.stderr}`);
    const quiet = [fire('git commit -m "mail merge copy"'), fire('echo mutton')];
    check('publish-guard: "mail merge" prose and `echo mutton` → silent (a mailer counts only in command position)',
      quiet.every((r) => r.code === 0 && r.stdout === '' && r.stderr === ''), JSON.stringify(quiet));
    const m = [fire('cat note.txt | sendmail owner@example.com'), fire('/usr/sbin/sendmail -t < msg')];
    check('publish-guard: bare mailer after a pipe or by absolute path, no token → BLOCK', m.every(blocked), JSON.stringify(m.map((r) => r.code))); }
  { const r = fire('PUBLISH_CONNECT=1 curl https://api.linkedin.com/v2/me');
    check('publish-guard: PUBLISH_CONNECT= marker → connect round-trip allowed (exit 0, reminder)', r.code === 0 && r.stdout.includes('Connect round-trip'), `${r.code} ${r.stderr}`); }
  // Preserved behaviour + fail-closed siblings.
  { const r = fire('curl -X POST https://ads-api.twitter.com/12/accounts/abc/campaigns');
    check('publish-guard: ads endpoint without PAID_CONFIRMED_BY_HUMAN → BLOCK', r.code === 2 && r.stderr.includes('BLOCKED: paid'), r.stderr);
    const p = fire('PAID_CONFIRMED_BY_HUMAN=1 curl -X POST https://ads-api.twitter.com/12/accounts/abc/campaigns');
    check('publish-guard: … with PAID_CONFIRMED_BY_HUMAN → paid rule passes, then the tokenless rule BLOCKS (claim text, not paid text)',
      p.code === 2 && p.stderr.includes('without a claim token') && !p.stderr.includes('BLOCKED: paid'), p.stderr);
    const e = fire('curl -X POST https://api.elevenlabs.io/v1/text-to-speech/abc -d @script.json');
    check('publish-guard: api.elevenlabs.io joins the paid guard → BLOCK', e.code === 2 && e.stderr.includes('BLOCKED: paid'), e.stderr);
    const x = fire('PUBLISH_CLAIM=deadbeef curl -X POST https://api.x.com/2/tweets -d @t.json', { [CP]: { content: claimLine('deadbeef', 'claimed') } });
    check('publish-guard: api.x.com joins the paid guard → BLOCK even with an open claim', x.code === 2 && x.stderr.includes('BLOCKED: paid'), x.stderr); }
  { // Gate → hook chain in ONE cwd (runHook with a raw command whose cwd is the gate's dir).
    const a = gate(['claim', 'P-001'], { [QP]: queue(), 'docs/WORKFLOW.md': wfPolicy('human-only') });
    const tok = a.stdout.trim().split('\n').at(-1).split('=')[1];
    const hookIn = (cmd) => spawnSync('bash', [path.join(PLUGIN, 'hooks/lib/publish-guard.sh')], { cwd: a.dir, input: JSON.stringify({ tool_input: { command: cmd } }), encoding: 'utf8' });
    const call = `PUBLISH_CLAIM=${tok} curl -X POST https://dev.to/api/articles -d @a.json`;
    const early = hookIn(call);
    check('publish-guard: claimed but not dispatched → BLOCK (dispatch, which re-hashes the body, cannot be skipped)',
      early.status === 2 && early.stderr.includes('claimed but not dispatched'), `${early.status} ${early.stderr}`);
    const d = gate(['dispatch', tok], undefined, a.dir), r = hookIn(call), again = hookIn(call);
    check('publish-guard: valid open claim (kind post, dispatched) → exit 0 with the 📣 Firing reminder',
      d.code === 0 && r.status === 0 && r.stdout.includes(`📣 Firing P-001 under claim ${tok}`) && r.stdout.includes('policy: human-only'), `${d.code} ${r.status} ${r.stdout}${r.stderr}`);
    check('publish-guard: the same token a second time → BLOCK (last event: fired — a token fires once)',
      again.status === 2 && again.stderr.includes('not an open claim (last event: fired)') && events(a).at(-1)?.event === 'fired' && events(a).at(-1)?.by === 'publish-guard hook', `${again.status} ${again.stderr}`);
    const o = gate(['outcome', tok, 'delivered', '--permalink', 'https://dev.to/x/2'], undefined, a.dir);
    check('publish-gate: outcome delivered after the hook spent the token → exit 0, row delivered', o.code === 0 && row(o).state === 'delivered', `${o.code} ${o.stderr}`); done(a); }
  { const a = gate(['claim', 'P-001'], { [QP]: queue(), 'docs/WORKFLOW.md': wfPolicy('human-only') });
    const tok = a.stdout.trim().split('\n').at(-1).split('=')[1];
    writeFileSync(path.join(a.dir, QP), a.read(QP).replace('\nhello world\n', '\nhello world, edited after claim\n'));
    const d = gate(['dispatch', tok], undefined, a.dir);
    const h = spawnSync('bash', [path.join(PLUGIN, 'hooks/lib/publish-guard.sh')], { cwd: a.dir, input: JSON.stringify({ tool_input: { command: `PUBLISH_CLAIM=${tok} curl -X POST https://dev.to/api/articles` } }), encoding: 'utf8' });
    check('publish-gate: edit between claim and dispatch → dispatch REFUSED (exit 2), row draft, token void; the hook then BLOCKS it',
      d.code === 2 && /REFUSED P-001 approved@[0-9a-f]{8}\/e1, current [0-9a-f]{8}\/e2/.test(d.stdout) && row(d).state === 'draft' && row(d).claim === '' &&
      h.status === 2 && h.stderr.includes('last event: reset'), `${d.code} ${d.stderr} | ${h.status} ${h.stderr}`); done(a); }
  if (process.getuid?.() !== 0) { // fail closed: a claim whose event cannot be recorded hands out no token
    const g = gate(['status'], { [QP]: queue(), 'docs/WORKFLOW.md': wfPolicy('human-only'), [CP]: { content: '' } });
    chmodSync(path.join(g.dir, CP), 0o444);
    const c = gate(['claim', 'P-001'], undefined, g.dir);
    check('publish-gate: claims log not writable → claim exits non-zero and prints NO PUBLISH_CLAIM line',
      c.code !== 0 && !c.stdout.includes('PUBLISH_CLAIM='), `${c.code} ${c.stdout}`); done(g); }
  { const r = fire('PUBLISH_CLAIM=deadbeef curl -X POST https://dev.to/api/articles', { [CP]: { content: claimLine('deadbeef', 'claimed') + claimLine('deadbeef', 'delivered') } });
    check('publish-guard: token whose last event is delivered → BLOCK (spent token)', r.code === 2 && r.stderr.includes('not an open claim (last event: delivered)'), r.stderr);
    const n = fire('PUBLISH_CLAIM=deadbeef curl -X POST https://dev.to/api/articles');
    check('publish-guard: token with no publish-claims.jsonl → BLOCK', n.code === 2 && n.stderr.includes('no publish-claims.jsonl'), n.stderr);
    const u = fire('PUBLISH_CLAIM=cafef00d curl -X POST https://dev.to/api/articles', { [CP]: { content: claimLine('deadbeef', 'claimed') } });
    check('publish-guard: token never minted → BLOCK (last event: none)', u.code === 2 && u.stderr.includes('last event: none'), u.stderr);
    const m = fire('PUBLISH_CLAIM=deadbeef curl -X POST https://dev.to/api/articles', { [CP]: { content: claimLine('deadbeef', 'claimed') + '{not json\n' } });
    check('publish-guard: malformed publish-claims.jsonl → BLOCK (fail closed, never trusts a partial read)', m.code === 2 && m.stderr.includes('not an open claim'), m.stderr);
    const s = fire('ls -la docs/product/launch');
    check('publish-guard: non-publish command → silent', s.code === 0 && s.stdout === '' && s.stderr === '', s.stdout + s.stderr); }
  // Gate refusal matrix — each refusal exits 2 with its reason and mints nothing.
  { const cases = [
      ['paid without --paid-confirmed-by-human', { paid: 'yes' }, 'human-only', 'is paid — human-fired only (§11)'],
      ['not due', { scheduled: '2026-10-07 09:00' }, 'human-only', 'not due until 2026-10-07 09:00'],
      ['approved by hand, no pin', { approvedFor: '' }, 'human-only', 'says approved but has no pinned hash — run publish approve P-001'],
      ['draft', { state: 'draft' }, 'human-only', 'P-001 is draft, not approved'],
      ['policy none', {}, 'none', 'publishing not configured (Publish policy: none)'],
    ];
    for (const [name, opts, pol, text] of cases) {
      const g = gate(['claim', 'P-001'], { [QP]: queue(opts), 'docs/WORKFLOW.md': wfPolicy(pol) });
      check(`publish-gate: claim refuses ${name} (exit 2) and mints no token`, g.code === 2 && g.stderr.includes(text) && !g.stdout.includes('PUBLISH_CLAIM='), `${g.code} ${g.stderr}`); done(g);
    }
    const s = gate(['claim', 'P-001', '--by', 'may-publish (delegated 2026-10-01)'], { [QP]: queue(), 'docs/WORKFLOW.md': wfPolicy('human-only') });
    check('publish-gate: a scheduled run (--by may-publish) under human-only → REFUSED', s.code === 2 && s.stderr.includes('policy is human-only — a scheduled run cannot fire'), s.stderr); done(s);
    const p = gate(['claim', 'P-001', '--paid-confirmed-by-human'], { [QP]: queue({ paid: 'yes' }), 'docs/WORKFLOW.md': wfPolicy('human-only') });
    check('publish-gate: paid + --paid-confirmed-by-human (a human at the keyboard) → claim mints', p.code === 0 && /PUBLISH_CLAIM=[0-9a-f]{8}$/.test(p.stdout.trim()), p.stderr); done(p); }
  { const g = gate(['claim', 'P-001'], { [QP]: { content: queue().content.replace('| a.md | one |', '| a.md |') }, 'docs/WORKFLOW.md': wfPolicy('human-only') });
    const before = queue().content.replace('| a.md | one |', '| a.md |');
    check('publish-gate: unparseable queue (11-cell row) → exit 4 with the line number, nothing written',
      g.code === 4 && /:5: row has 11 cells/.test(g.stderr) && g.read(QP) === before && g.read(CP) === '', g.stderr); done(g); }
}

// ── close-keyword guard (v1.50.1): a commit message must not carry a GitHub
// closing keyword — it fires auto-close when the commit reaches the default
// branch (orderly #605). A bare (#N) PR ref or refs #N is allowed.
{
  const GUARD = 'close-keyword guard';
  const c = (cmd) => runHook({ event: 'PreToolUse', desc: GUARD, input: { tool_input: { command: cmd } } });
  const blocks = (r) => r.code === 2 && /closing keyword/i.test(r.stderr);
  check('close-guard: git commit with "Closes #605" in message → BLOCK (exit 2)', blocks(c('git commit -m "fix: leak\n\nCloses #605"')), '');
  check('close-guard: "fixes #42" → BLOCK', blocks(c('git commit -m "feat: thing, fixes #42"')), '');
  check('close-guard: owner/repo#N form → BLOCK', blocks(c('git commit -m "chore: closes xyzhub/orderly#12"')), '');
  { const r = c('git commit -m "fix(security): stop the leak (#605)"'); check('close-guard: bare (#605) PR ref → allowed (exit 0)', r.code === 0, `code=${r.code}`); }
  { const r = c('git commit -m "docs: describe how fixes propagate downstream"'); check('close-guard: prose mentioning "fixes" with no #ref → allowed', r.code === 0, `code=${r.code}`); }
  { const r = c('git commit -m "chore: refs #605 — partial, does not close"'); check('close-guard: "refs #605" → allowed', r.code === 0, `code=${r.code}`); }
  { const r = c('git status'); check('close-guard: non-commit command → allowed', r.code === 0, `code=${r.code}`); }
}

// ── git/gh guardrails (v1.62.0): the commit hint prints the TARGET repo's §10
// Attribution commit text (POSIX, no jq for this part, exit 0 always), plus
// regression pins for the push guard, which had no coverage before.
{
  const GR = 'git/gh guardrails';
  const row = (cell) => ({ content: `# W\n\n## 10. Project profile\n\n| Key | Value |\n|---|---|\n| **Attribution** | ${cell} |\n` });
  const g = (cmd, files, bin) => runHook({ event: 'PreToolUse', desc: GR, input: { tool_input: { command: cmd } }, files, bin });
  { const r = g('git commit -m "feat: x"');
    check('guardrails: commit, no docs/WORKFLOW.md → the default attribution text, exit 0', r.code === 0 && /Attribution line: Generated with The XYZ Protocol$/m.test(r.stdout) && !/Co-Authored-By/.test(r.stdout), r.stdout + r.stderr); }
  { const r = g('git commit -m "feat: x"', { 'docs/WORKFLOW.md': row('_(`commit: <v> · pr: <v>` — placeholder)_') });
    check('guardrails: commit, unfilled placeholder row → the default text', r.code === 0 && /Attribution line: Generated with The XYZ Protocol$/m.test(r.stdout), r.stdout); }
  { const r = g('git commit -m "feat: x"', { 'docs/WORKFLOW.md': row('none') });
    check('guardrails: commit, §10 Attribution `none` → "no attribution line", exit 0', r.code === 0 && /no attribution line \(§10 Attribution: none\)/.test(r.stdout) && !/Generated with/.test(r.stdout), r.stdout); }
  { const r = g('git commit -m "feat: x"', { 'docs/WORKFLOW.md': row('commit: none · pr: default') });
    check('guardrails: commit, `commit: none · pr: default` → no attribution line', r.code === 0 && /no attribution line/.test(r.stdout), r.stdout); }
  { const r = g('git commit -m "feat: x"', { 'docs/WORKFLOW.md': row("commit: `Built by O'Brien $HOME \"q\"\\nsecond line` · pr: none") });
    check('guardrails: custom text with \' $ " is printed literally (first line only), exit 0', r.code === 0 && r.stdout.includes('Attribution line: Built by O\'Brien $HOME "q"\n') && !/second line/.test(r.stdout), r.stdout + r.stderr); }
  { const r = g('cd sub && git commit -m "feat: x"', { 'docs/WORKFLOW.md': row('none'), 'sub/docs/WORKFLOW.md': row('commit: `Sub repo credit` · pr: none') });
    check('guardrails: `cd sub && git commit` reads the TARGET repo\'s row (sub/docs/WORKFLOW.md)', r.code === 0 && /Attribution line: Sub repo credit$/m.test(r.stdout), r.stdout); }
  { const r = g('git commit -m "feat: x"', { 'docs/WORKFLOW.md': row('commit: `Custom, no jq` · pr: none') }, { jq: false });
    check('guardrails: jq missing → the attribution lookup still works (grep/sed/head only), exit 0', r.code === 0 && /Attribution line: Custom, no jq$/m.test(r.stdout), r.stdout + r.stderr); }
  { const r = g('git commit -m "feat: x"', { 'docs/WORKFLOW.md': row('none') }, { jq: false });
    check('guardrails: jq missing + `none` → no attribution line', r.code === 0 && /no attribution line/.test(r.stdout), r.stdout + r.stderr); }
  { const r = g(['git', 'push', 'origin', 'HEAD:main'].join(' '));
    check('guardrails: push refspec HEAD:main → BLOCK (exit 2, "refspec targets main")', r.code === 2 && /refspec targets main/.test(r.stderr), `code=${r.code} ${r.stderr}`); }
  // agent-managed exemption (v1.67.0): real repos, a local bare "remote" named
  // <tmp>/xyzhub/<name>.git; the fixture seeds the marker with plain git (the
  // human step), then the hook decides the agent's push.
  {
    const root = mkdtempSync(path.join(tmpdir(), 'agentmanaged-'));
    const git = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...a], { cwd, encoding: 'utf8' });
    const repo = (name, marker, local = false) => {
      const bare = path.join(root, 'xyzhub', `${name}.git`);
      mkdirSync(bare, { recursive: true });
      git(bare, 'init', '-q', '--bare', '-b', 'main');
      const seed = path.join(root, `${name}-seed`);
      git(root, 'clone', '-q', bare, seed);
      git(seed, 'checkout', '-q', '-b', 'main');
      writeFileSync(path.join(seed, 'note.md'), 'n\n');
      if (marker && !local) writeFileSync(path.join(seed, '.agent-managed'), `${marker}\n`);
      git(seed, 'add', '-A'); git(seed, 'commit', '-qm', 'seed'); git(seed, 'push', '-q', 'origin', 'main');
      const clone = path.join(root, name);
      git(root, 'clone', '-q', bare, clone);
      if (marker && local) { writeFileSync(path.join(clone, '.agent-managed'), `${marker}\n`); git(clone, 'add', '-A'); git(clone, 'commit', '-qm', 'self-exempt'); }
      writeFileSync(path.join(clone, 'note2.md'), 'm\n'); git(clone, 'add', '-A'); git(clone, 'commit', '-qm', 'note');
      return clone;
    };
    const push = (dir, args) => g(['cd', dir, '&&', 'git', 'push', ...args].join(' '));
    try {
      const ok = repo('memory', 'xyzhub/memory');
      { const r = push(ok, ['origin']);
        check('agent-managed: marker on remote main names the repo → `git push origin` from main allowed (exit 0, ✅ note)', r.code === 0 && /agent-managed repo/.test(r.stdout), `code=${r.code} ${r.stdout} ${r.stderr}`); }
      { const r = push(ok, ['-u', 'origin', 'main']);
        check('agent-managed: `-u origin main` allowed', r.code === 0, `code=${r.code} ${r.stderr}`); }
      { const r = push(ok, ['--force']);
        check('agent-managed: --force → still BLOCKED', r.code === 2 && /never push while checked out/.test(r.stderr), `code=${r.code} ${r.stderr}`); }
      { const r = push(ok, ['origin', ['HEAD', 'main'].join(':')]);
        check('agent-managed: explicit refspec → still BLOCKED', r.code === 2, `code=${r.code} ${r.stderr}`); }
      { const r = push(ok, ['https://example.com/x.git', 'main']);
        check('agent-managed: push to another URL → still BLOCKED', r.code === 2, `code=${r.code} ${r.stderr}`); }
      { const r = push(ok, ['&&', 'git', 'push', 'origin', 'main']);
        check('agent-managed: two pushes in one command → still BLOCKED', r.code === 2, `code=${r.code} ${r.stderr}`); }
      { const r = g(['git', '-C', ok, 'push', 'origin', 'main'].join(' '));
        check('agent-managed: lone `git -C <exempt> push origin main` allowed', r.code === 0 && /agent-managed repo/.test(r.stdout), `code=${r.code} ${r.stderr}`); }
      const other = repo('plain', null);
      { const r = g(['cd', ok, '&&', 'git', '-C', other, 'push'].join(' '));
        check('agent-managed: `cd <exempt> && git -C <other> push` → BLOCKED (checked repo must be the pushed repo)', r.code === 2, `code=${r.code} ${r.stderr}`); }
      { const r = g(['cd', ok, '&&', 'git', 'push', ';', 'cd', other, '&&', 'git', 'push'].join(' '));
        check('agent-managed: chained `; cd <other> && git push` → BLOCKED', r.code === 2, `code=${r.code} ${r.stderr}`); }
      { const r = push(ok, ['main', 'origin']);
        check('agent-managed: `git push main origin` (remote is `main`, not origin) → BLOCKED', r.code === 2, `code=${r.code} ${r.stderr}`); }
      { const r = push(ok, ['origin', 'main', 'HEAD']);
        check('agent-managed: a third positional arg → BLOCKED', r.code === 2, `code=${r.code} ${r.stderr}`); }
      { const r = push(ok, []);
        check('agent-managed: bare `git push` (remote chosen by config) → BLOCKED', r.code === 2, `code=${r.code} ${r.stderr}`); }
      git(ok, 'config', 'remote.origin.push', '+refs/heads/*:refs/heads/*');
      { const r = push(ok, ['origin']);
        check('agent-managed: remote.origin.push refspec config → BLOCKED', r.code === 2, `code=${r.code} ${r.stderr}`); }
      git(ok, 'config', '--unset', 'remote.origin.push');
      git(ok, 'config', 'push.default', 'matching');
      { const r = push(ok, ['origin']);
        check('agent-managed: push.default=matching → BLOCKED', r.code === 2, `code=${r.code} ${r.stderr}`); }
      git(ok, 'config', '--unset', 'push.default');
      git(ok, 'remote', 'set-url', '--push', 'origin', path.join(root, 'xyzhub', 'plain.git'));
      { const r = push(ok, ['origin']);
        check('agent-managed: origin push URL ≠ fetch URL (pushurl redirect) → BLOCKED', r.code === 2, `code=${r.code} ${r.stderr}`); }
      git(ok, 'config', '--unset', 'remote.origin.pushurl');
      const self = repo('selfexempt', 'xyzhub/selfexempt', true);
      { const r = push(self, ['origin']);
        check('agent-managed: marker committed only locally (agent self-exemption) → BLOCKED', r.code === 2 && /never push while checked out/.test(r.stderr), `code=${r.code} ${r.stderr}`); }
      const fork = repo('fork', 'xyzhub/memory');
      { const r = push(fork, ['origin']);
        check('agent-managed: marker names a different repo than origin → BLOCKED', r.code === 2, `code=${r.code} ${r.stderr}`); }
      { const r = runHook({ event: 'PreToolUse', desc: GR, input: { tool_input: { command: ['cd', ok, '&&', 'git', 'push'].join(' ') } }, env: { CLAUDE_PLUGIN_ROOT: '' } });
        check('agent-managed: CLAUDE_PLUGIN_ROOT unset (script unreachable) → no exemption, BLOCKED', r.code === 2, `code=${r.code} ${r.stderr}`); }
    } finally { rmSync(root, { recursive: true, force: true }); }
  }
  { const r = g('git status');
    check('guardrails: git status → exit 0, no commit hint', r.code === 0 && !/Commit format/.test(r.stdout), `code=${r.code}`); }
}

// ── pr-economy (v1.53.0): the §10 records-only merge scope — path-enforced, fail closed ──
// hooks/lib/merge-guard.sh runs with PATH = a temp bin/ (BIN_LIST + jq + a gh stub), so every
// case also proves the hook's `# externals:` line. The stub never touches the network: it
// echoes `gh-stub-called <args>` to stderr (the temp dir is gone before the assertion, so the
// marker is the proof gh ran) and prints the canned `gh pr view --json` payload.
{
  const GUARD = 'merge guardrail';
  const M = 'gh pr merge';
  const REC = 'agent-may-merge (records-only, delegated 2026-10-07)';
  const HEAD = '0123456789abcdef0123456789abcdef01234567';
  const MH = `--match-head-commit ${HEAD}`;
  const OK101 = `${M} 101 --squash ${MH}`;
  const TPL_ROW = readFileSync(path.join(PLUGIN, 'templates/WORKFLOW.md'), 'utf8')
    .split('\n').find((l) => /^\| \*\*Merge policy\*\* \| /.test(l)) || '';
  const TPL_CELL = TPL_ROW.replace(/^\| \*\*Merge policy\*\* \| /, '').replace(/ \|$/, '');
  const FOUR = ['.plans/pr-economy.state.md', '.plans/OBLIGATIONS.md', 'docs/product/JOURNEY.md',
    'docs/product/overview.html', 'docs/product/session-handoff.md'];
  const run = (conclusion) => ({ __typename: 'CheckRun', status: 'COMPLETED', conclusion, name: 'lint' });
  const ctx = (state) => ({ __typename: 'StatusContext', state, context: 'ci' });
  const GREEN = [run('SUCCESS'), run('SKIPPED'), ctx('SUCCESS')];
  const wfMerge = (cell, ceremony = '') => `## 10. Project profile\n\n| Key | Value |\n|---|---|\n| **Merge policy** | ${cell} |\n${ceremony ? `\n### 10.2 Ceremony\n\n| id | kind | stage | derived | signal | effective |\n|---|---|---|---|---|---|\n${ceremony}\n\n## 11. Autopilot mode\n` : ''}`;
  const prJson = ({ state = 'OPEN', files = FOUR, checks = GREEN, head = HEAD } = {}) => ({
    state, statusCheckRollup: checks, headRefOid: head,
    files: files.map((f) => (typeof f === 'string' ? { path: f, changeType: 'MODIFIED' } : f)),
  });
  const shq = (s) => `'${s.replace(/'/g, `'\\''`)}'`;
  const ghStub = (json, { exit = 0 } = {}) => ['#!/bin/bash', 'echo "gh-stub-called $*" >&2',
    `case "$*" in *"pr view"*) printf '%s' ${shq(JSON.stringify(json))}; exit ${exit};; esac`, 'exit 1', ''].join('\n');
  const mg = (cmd, { cell = REC, wf = true, pr = {}, exit = 0, gh, jq = true, files = {}, input = {}, env, ceremony = '' } = {}) =>
    runHook({
      event: 'PreToolUse', desc: GUARD, input: { tool_input: { command: cmd }, ...input },
      files: { ...(wf ? { 'docs/WORKFLOW.md': { content: wfMerge(cell, ceremony) } } : {}), ...files },
      bin: { gh: gh === undefined ? ghStub(prJson(pr), { exit }) : gh, jq }, env,
    });
  const blocks = (r, text) => r.code === 2 && r.stderr.includes(text);
  const sawView = (r, n) => r.stderr.includes(`gh-stub-called pr view ${n} `);
  const ghRan = (r) => r.stderr.includes('gh-stub-called');
  const why = (r) => `code=${r.code} out=${r.stdout.trim()} err=${r.stderr.trim()}`.slice(0, 400);

  // Harness self-proof: the hook's declared externals are exactly what the PATH-only bin/ holds.
  {
    const src = readFileSync(path.join(PLUGIN, 'hooks/lib/merge-guard.sh'), 'utf8');
    const ext = (src.match(/^# externals: (.+)$/m) || [, ''])[1].trim().split(/\s+/).filter(Boolean);
    const missing = ext.filter((e) => !BIN_LIST.includes(e) && e !== 'jq' && e !== 'gh');
    check('merge-guard: `# externals:` line present and ⊆ BIN_LIST + jq + gh', ext.length > 0 && missing.length === 0, missing.join(' '));
    check('merge-guard: the template §10 Merge policy row was found (TPL_CELL is not empty)', TPL_CELL.length > 20, TPL_ROW);
  }

  // allow
  { const r = mg(`${M} 101 --squash --delete-branch ${MH}`);
    check('merge-guard: records-only, FOUR record paths + green checks → allowed (exit 0) after gh pr view',
      r.code === 0 && r.stdout.includes('records-only scope') && sawView(r, 101), why(r)); }
  { const r = mg(`${M} --squash ${MH} 7`); check('merge-guard: flags before the ref → allowed, gh viewed PR 7', r.code === 0 && sawView(r, 7), why(r)); }
  { const r = mg(`cd . && ${M} 101 --match-head-commit=${HEAD}`); check('merge-guard: one leading `cd <repo> &&` → allowed', r.code === 0 && sawView(r, 101), why(r)); }
  { const r = mg(`${M} 101 -sd ${MH}`); check('merge-guard: short boolean cluster -sd → allowed', r.code === 0, why(r)); }
  { const r = mg(OK101, { pr: { checks: [] } });
    check('merge-guard: empty rollup, no .github/workflows → allowed with the no-CI note', r.code === 0 && r.stdout.includes('no CI configured'), why(r)); }
  { const r = mg(OK101, { pr: { files: [{ path: '.plans/old.md', changeType: 'DELETED' }, { path: '.plans/new.md', changeType: 'ADDED' }] } });
    check('merge-guard: DELETED + ADDED on record paths → allowed', r.code === 0, why(r)); }
  { const r = mg(OK101, { pr: { checks: [run('NEUTRAL'), ctx('SUCCESS')] } });
    check('merge-guard: NEUTRAL CheckRun + SUCCESS StatusContext → allowed', r.code === 0, why(r)); }

  // regression — full delegation and non-merges
  { const r = mg(OK101, { cell: 'agent-may-merge (delegated 2026-01-01)' });
    check('merge-guard: full delegation → reminder (exit 0), gh NOT run', r.code === 0 && r.stdout.includes('reviewer APPROVE') && !ghRan(r), why(r)); }
  { const r = mg(`${M} chore/x --admin`, { cell: 'agent-may-merge (bookkeeping, delegated 2026-07-08)' });
    check("merge-guard: the registry's (bookkeeping, …) row stays FULL delegation (L4) → reminder, gh NOT run",
      r.code === 0 && r.stdout.includes('reviewer APPROVE') && !ghRan(r), why(r)); }
  { const r = mg('gh pr view 1'); check('merge-guard: gh pr view (not a merge) → silent exit 0', r.code === 0 && !r.stdout && !r.stderr, why(r)); }
  { const r = mg('git status'); check('merge-guard: git status → silent exit 0', r.code === 0 && !r.stdout && !r.stderr, why(r)); }

  // block — policy
  { const r = mg(OK101, { cell: 'human-only' }); check('merge-guard: human-only → BLOCK', blocks(r, 'human (HITL) merges') && !ghRan(r), why(r)); }
  { const r = mg(OK101, { wf: false }); check('merge-guard: no docs/WORKFLOW.md → BLOCK (fail closed)', blocks(r, 'human (HITL) merges'), why(r)); }
  { const r = mg(OK101, { cell: TPL_CELL });
    check('merge-guard: the template placeholder prose, verbatim → BLOCK, gh NOT run', blocks(r, 'human (HITL) merges') && !ghRan(r), why(r)); }
  { const r = mg(OK101, { cell: 'agent-may-merge (records-only, delegated 2026-10)' });
    check('merge-guard: a malformed records-only value never widens to full delegation → BLOCK', blocks(r, 'human (HITL) merges'), why(r)); }
  { const r = mg(OK101, { cell: `x ${REC}` }); check('merge-guard: records-only not at the start of the cell → BLOCK', blocks(r, 'human (HITL) merges'), why(r)); }
  { const r = mg(OK101, { input: { cwd: '/nonexistent-merge-guard-dir' } });
    check('merge-guard: a session cwd that is not a directory → BLOCK', blocks(r, 'not a directory'), why(r)); }

  // §10.2 ceremony backstop (L3/L5/L6) — every irreversible id, change and action alike
  {
    const gr = (id, sig, eff) => `| ${id} | gate | v2 | required | ${sig} | ${eff} |`;
    const CB = 'irreversible-class gate';
    const cer = [
      ['skipped ci-deploy', gr('v2-deploy-pipeline', 'deploy: none · class:ci-deploy', 'skipped'), 'v2-deploy-pipeline'],
      ['optional auth', gr('x-auth', 'auth: none-found · class:auth', 'optional'), 'x-auth'],
      ['skipped supply-chain', gr('x-deps', 'default · class:supply-chain', 'skipped'), 'x-deps'],
      ['skipped v5-launch with an action id inside a + list', gr('v5-launch', 'action class · class:production-deploy+publish-outward+release-cut', 'skipped'), 'v5-launch'],
      ['optional release-cut on mission-close', gr('mission-close', 'default · class:release-cut', 'optional'), 'mission-close'],
      ['class:third-party+auth skipped (the id anywhere in the list)', gr('x-hook', 'default · class:third-party+auth', 'skipped'), 'x-hook'],
      ['a hand-edited `skipped (x)` cell', gr('x-sec', 'default · class:secrets', 'skipped (hand edit)'), 'x-sec'],
      // ckpt-p2 A1: hand-edit shapes the first regex missed
      ['a row with leading spaces', `   ${gr('x-lead', 'default · class:auth', 'skipped')}`, 'x-lead'],
      ['a row with a leading tab and tab-padded cells', `\t${gr('x-tab', 'default · class:payments', 'skipped')}`.replace(/ \| /g, '\t|\t'), 'x-tab'],
      ['a mis-cased `Skipped` cell', gr('x-case', 'default · class:secrets', 'Skipped'), 'x-case'],
      ['a mis-cased `Optional` cell and `Gate` kind', gr('x-case2', 'default · class:ci-deploy', 'Optional').replace('| gate |', '| Gate |'), 'x-case2'],
    ];
    for (const [name, row, id] of cer) {
      const r = mg(OK101, { ceremony: `${gr('v4-ux-audit', 'ui: none · class:none', 'skipped')}\n${row}` });
      check(`merge-guard: §10.2 ${name} → BLOCK naming \`${id}\`, gh NOT run`, blocks(r, CB) && r.stderr.includes(`\`${id}\``) && !ghRan(r), why(r));
    }
    for (const [name, head] of [['a `#### 10.2` heading', '#### 10.2 Ceremony'], ['a tab after `### 10.2`', '###\t10.2\tCeremony'], ['a bare `### 10.2` heading', '### 10.2']]) {
      const content = `${wfMerge(REC, gr('x-head', 'default · class:auth', 'skipped'))}`.replace('### 10.2 Ceremony', head);
      const r = mg(OK101, { files: { 'docs/WORKFLOW.md': { content } } });
      check(`merge-guard: §10.2 under ${name} → BLOCK naming \`x-head\``, content.includes(head) && blocks(r, CB) && r.stderr.includes('`x-head`') && !ghRan(r), why(r));
    }
    { const r = mg(OK101, { cell: 'agent-may-merge (delegated 2026-01-01)', ceremony: gr('x-auth', 'class:auth', 'skipped') });
      check('merge-guard: §10.2 backstop holds under full delegation too → BLOCK', blocks(r, CB), why(r)); }
    { const r = mg(OK101, { ceremony: gr('x-vendor', 'default · class:third-party', 'skipped') });
      check('merge-guard: §10.2 skipped third-party (the one reversible class) → allowed, records-only path continues', r.code === 0 && sawView(r, 101), why(r)); }
    { const r = mg(OK101, { ceremony: gr('v2-deploy-pipeline', 'deploy: none · class:ci-deploy', 'required (override refused: ci-deploy is irreversible)') });
      check('merge-guard: §10.2 `required (override refused: …)` cell → allowed', r.code === 0 && sawView(r, 101), why(r)); }
    { const r = mg(OK101, { ceremony: `${gr('v4-ux-audit', 'ui: none · class:none', 'skipped')}\n${gr('x-auth', 'class:auth', 'required')}` });
      check('merge-guard: §10.2 with only class:none skipped and irreversible rows required → allowed', r.code === 0 && sawView(r, 101), why(r)); }
  }

  // block — command shape
  const shape = [
    [`${M} 101 -R xyzhub/other`, 'cross-repo', '-R'],
    [`${M} --repo xyzhub/other 101`, 'cross-repo', '--repo'],
    [`${M} 101 "-Rxyzhub/other"`, 'cross-repo', 'quoted attached -R'],
    [`${M} 101 -sR xyzhub/other`, 'cross-repo', '-R inside a short cluster'],
    [`GH_REPO=xyzhub/other ${M} 101`, 'cross-repo', 'GH_REPO='],
    [`${M} https://github.com/xyzhub/agentic-workflow/pull/7`, 'plain number', 'URL ref'],
    [`${M} --squash`, 'plain number', 'no ref (current-branch form)'],
    [`${M} chore/x-bookkeeping`, 'plain number', 'branch ref'],
    [`${M} 101 7`, 'plain number', 'two positional refs'],
    [`${M} --body 5 101`, 'not allowed', 'a value flag that would shift the ref'],
    [`${M} -b 5`, 'not allowed', 'short value flag'],
    [`${M} 101 --admin`, 'not allowed', '--admin'],
    [`${M} 101 && git push`, 'last command', '&& after'],
    [`${M} 101 | cat`, 'last command', '| after'],
    [`${M} 101 & echo x`, 'last command', '& after'],
    [`${M} 101; ${M} 102`, 'more than one merge', 'two merges'],
    [`${M} 101\ngit push`, 'last command', 'newline after'],
    [`gh  pr merge 101`, 'single spaces', 'double space'],
    [`${M} 101 --auto`, '--auto', '--auto'],
    [`cd docs/..; cd . && ${M} 101`, 'stand alone', 'two cds before'],
    [`git -C docs/.. status && ${M} 101`, 'stand alone', 'git -C before'],
    [`${M} 101 --body=x git -C docs/..`, 'not allowed', 'a git -C target after the merge (never a policy source)'],
    ['gh api -X PUT repos/xyzhub/agentic-workflow/pulls/101/merge', 'bypasses', 'gh api pulls/N/merge'],
    ['gh api graphql -f query="mutation { mergePullRequest(input: {}) { clientMutationId } }"', 'bypasses', 'GraphQL mergePullRequest'],
  ];
  for (const [cmd, text, name] of shape) {
    const r = mg(cmd);
    check(`merge-guard: ${name} → BLOCK (${text})`, blocks(r, text) && !ghRan(r), why(r));
  }

  // block — the PR's file list
  const filesCases = [
    [[...FOUR, 'docs/product/decisions/2026-10-06-launch-media-brief.md'], 'docs/product/decisions/2026-10-06-launch-media-brief.md'],
    [['docs/WORKFLOW.md'], 'docs/WORKFLOW.md is not a record path'],
    [['CHANGELOG.md'], 'CHANGELOG.md is not a record path'],
    [['plugins/agentic-workflow/hooks/hooks.json'], 'hooks.json is not a record path'],
    [['docs/product/roadmap.md'], 'roadmap.md is not a record path'],
    [['.plans/../CHANGELOG.md'], 'is not a record path'],
    [['docs/product/JOURNEY.md.bak'], 'is not a record path'],
    [['.plansx/a.md'], 'is not a record path'],
    [['.plans/'], 'is not a record path'],
    [['/.plans/x.md'], 'is not a record path'],
    [['hooks/hooks.json'], 'hooks/hooks.json is not a record path'],
    [['docs/product/decisions/x.md'], 'docs/product/decisions/x.md is not a record path'],
    [[{ path: '.plans/x.md', changeType: 'RENAMED' }], 'renames and copies'],
    [[{ path: '.plans/x.md', changeType: 'COPIED' }], 'renames and copies'],
    [[{ path: '.plans/x.md' }], 'is UNKNOWN'],
    [Array.from({ length: 100 }, (_, i) => `.plans/f${i}.md`), 'caps the file list'],
    [[], 'changes no files'],
  ];
  for (const [files, text] of filesCases) {
    const label = files.length > 3 ? `${files.length} files` : JSON.stringify(files);
    const r = mg(OK101, { pr: { files } });
    check(`merge-guard: files ${label.slice(0, 90)} → BLOCK`, blocks(r, text) && sawView(r, 101), why(r));
  }
  { const r = mg(OK101, { pr: { state: 'MERGED' } }); check('merge-guard: PR state MERGED → BLOCK', blocks(r, 'is MERGED, not OPEN'), why(r)); }

  // block — checks
  { const r = mg(OK101, { pr: { checks: [...GREEN, { __typename: 'CheckRun', status: 'IN_PROGRESS', conclusion: null, name: 'lint' }] } });
    check('merge-guard: CheckRun IN_PROGRESS (no conclusion) → BLOCK', blocks(r, 'not green'), why(r)); }
  { const r = mg(OK101, { pr: { checks: [{ __typename: 'CheckRun', status: 'IN_PROGRESS', conclusion: '', name: 'lint' }] } });
    check('merge-guard: CheckRun with empty-string conclusion (gh in-progress shape) → BLOCK', blocks(r, 'not green'), why(r)); }
  { const r = mg(OK101, { pr: { checks: [run('FAILURE')] } }); check('merge-guard: CheckRun FAILURE → BLOCK', blocks(r, 'lint is FAILURE'), why(r)); }
  { const r = mg(OK101, { pr: { checks: [ctx('PENDING')] } }); check('merge-guard: StatusContext PENDING → BLOCK', blocks(r, 'ci is PENDING'), why(r)); }
  { const r = mg(OK101, { pr: { checks: [] }, files: { '.github/workflows/lint.yml': { content: 'on: push\n' } } });
    check('merge-guard: empty rollup WITH .github/workflows → BLOCK (wait for CI)', blocks(r, 'wait for CI'), why(r)); }

  // block — TOCTOU: the merge must pin the head the hook just viewed
  { const r = mg(`${M} 101 --squash`); check('merge-guard: no --match-head-commit → BLOCK (names the head to pin)',
      blocks(r, `add --match-head-commit ${HEAD}`) && sawView(r, 101), why(r)); }
  { const r = mg(`${M} 101 --squash --match-head-commit ${'f'.repeat(40)}`);
    check('merge-guard: --match-head-commit ≠ the viewed headRefOid → BLOCK', blocks(r, 'does not match PR #101'), why(r)); }
  { const r = mg(`${M} 101 --match-head-commit`); check('merge-guard: --match-head-commit with no value → BLOCK', blocks(r, 'add --match-head-commit'), why(r)); }
  { const r = mg(OK101, { pr: { head: 'not-a-sha' } }); check('merge-guard: headRefOid missing/malformed in gh JSON → BLOCK', blocks(r, 'could not read PR #101'), why(r)); }
  { const r = mg(OK101); check('merge-guard: --match-head-commit = the viewed headRefOid → allowed', r.code === 0 && r.stdout.includes('records-only scope'), why(r)); }

  // block — the hooks.json wrapper fails closed when the lib script cannot run
  { const gone = path.join(tmpdir(), 'no-such-plugin-root-merge-guard');
    const r = mg(OK101, { env: { CLAUDE_PLUGIN_ROOT: gone } });
    check('merge-guard wrapper: lib script absent → merge BLOCKS', blocks(r, 'merge guard is unavailable'), why(r));
    const q = mg('git status', { env: { CLAUDE_PLUGIN_ROOT: gone } });
    check('merge-guard wrapper: lib script absent → a non-merge command still passes', q.code === 0, why(q));
    const u = mg(OK101, { env: { CLAUDE_PLUGIN_ROOT: '' } });
    check('merge-guard wrapper: CLAUDE_PLUGIN_ROOT unset/empty → merge BLOCKS', blocks(u, 'merge guard is unavailable'), why(u));
    const a = mg('gh api -X PUT repos/o/r/pulls/1/merge', { env: { CLAUDE_PLUGIN_ROOT: gone } });
    check('merge-guard wrapper: lib script absent → gh api merge BLOCKS', blocks(a, 'merge guard is unavailable'), why(a)); }
  { const fake = mkdtempSync(path.join(tmpdir(), 'fakeroot-'));
    mkdirSync(path.join(fake, 'hooks/lib'), { recursive: true });
    writeFileSync(path.join(fake, 'hooks/lib/merge-guard.sh'), 'exit 1\n');
    const r = mg(OK101, { env: { CLAUDE_PLUGIN_ROOT: fake } });
    rmSync(fake, { recursive: true, force: true });
    check('merge-guard wrapper: lib script crashes (exit 1) → merge BLOCKS', blocks(r, 'exit 1'), why(r)); }

  // S1-fix (ckpt-p1): detection + target shape apply under EVERY policy
  const FULL = 'agent-may-merge (delegated 2026-01-01)';
  const BOOK = 'agent-may-merge (bookkeeping, delegated 2026-07-08)';
  const everyPolicy = [
    ['A1', 'gh pr -R other/repo merge 101 --squash', 'human-only', 'cross-repo'],
    ['A2', 'gh pr --repo=other/repo merge 101 --squash', FULL, 'cross-repo'],
    ['B1', `git -C docs/.. status && ${M} 101 --admin`, BOOK, 'stand alone'],
    ['B2', `cd docs/.. && cd . && ${M} 101`, BOOK, 'stand alone'],
    ['B3', `cd docs/..; cd .; ${M} 101`, FULL, 'stand alone'],
    ['B4', `cd docs/.. && GH_REPO=xyzhub/registry ${M} 101`, FULL, 'cross-repo'],
    ['C1', `${M};echo`, REC, 'last command'],
    ['C2', 'gh pr $(echo merge) 101', FULL, 'unrecognized merge shape'],
  ];
  for (const [id, cmd, cell, text] of everyPolicy) {
    const r = mg(cmd, { cell });
    check(`merge-guard ${id}: ${cmd.slice(0, 60)} under ${cell.slice(0, 28)} → BLOCK (${text})`, blocks(r, text) && !ghRan(r), why(r));
  }
  for (const cmd of [`${M} 101`, `cd docs/.. && ${M} 101 --admin`]) {
    const r = mg(cmd, { cell: BOOK });
    check(`merge-guard: registry (bookkeeping) row stays warn-only for \`${cmd.slice(0, 40)}\``, r.code === 0 && r.stdout.includes('reviewer APPROVE'), why(r));
  }
  // #108: the last-resort check no longer refuses a non-pr gh subcommand or a guard dry run
  for (const cmd of ['gh issue create --title "guard false refusal" --body "any gh pr text that mentions merging is refused"',
    'gh issue comment 108 --body "the gh pr is merged; the follow-up pr is merging"',
    `printf '{"tool_input":{"command":"gh pr merg%s 107 --squash"}}' e | bash "$HOME/.claude/plugins/cache/xyz/agentic-workflow/1.53.0/hooks/lib/merge-guard.sh"`]) {
    const r = mg(cmd, { cell: 'human-only' });
    check(`merge-guard #108: \`${cmd.slice(0, 50)}\` → silent exit 0`, r.code === 0 && !r.stderr, why(r));
  }
  for (const cmd of ['X=merge; gh pr $X 101', 'gh issue list && gh pr `echo merge` 101',
    'X=merge; bash -c "gh pr $X 101"', 'X=merge; command gh pr $X 101', 'X=merge; env gh pr $X 101',
    'X=merge; /usr/local/bin/gh pr $X 101', 'gh pr-merge 101',
    'X=merged; gh pr ${X%d} 101', 'X=merge_; gh pr ${X%_} 101', 'X=.merge; gh pr ${X#.} 101',
    'gh pr $(echo merged | tr -d d) 101', 'gh pr `echo merger | tr -d r` 101',
    'gh pr view 1; echo merged | tr -d d | xargs -I{} gh pr {} 101', 'echo "gh pr merged 101" | tr -d d | bash',
    'echo "gh pr merged 101" | tr -d d | sh -s', 'eval gh pr merged']) {
    const r = mg(cmd, { cell: FULL });
    check(`merge-guard #108: \`${cmd.slice(0, 40)}\` still → BLOCK (unrecognized merge shape)`, blocks(r, 'unrecognized merge shape') && !ghRan(r), why(r));
  }
  for (const cmd of ['gh pr view 5', 'gh pr create --title "merge guard: S1-fix" --body x', 'gh pr list --state open']) {
    const r = mg(cmd, { cell: 'human-only' });
    check(`merge-guard: non-merge \`${cmd.slice(0, 40)}\` → silent exit 0`, r.code === 0 && !r.stderr, why(r));
  }
  // origin/<default> is the policy source inside a real git tree (bare origin; working tree disagrees)
  { const root = mkdtempSync(path.join(tmpdir(), 'mg-git-'));
    const g = (cwd, ...a) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'init.defaultBranch=main', ...a], { cwd, encoding: 'utf8' });
    const wt = path.join(root, 'wt'); const wfp = path.join(wt, 'docs/WORKFLOW.md');
    g(root, 'init', '-q', '--bare', path.join(root, 'origin.git')); g(root, 'init', '-q', wt);
    mkdirSync(path.join(wt, 'docs')); writeFileSync(wfp, wfMerge(REC));
    g(wt, 'add', '.'); g(wt, 'commit', '-qm', 'rec'); g(wt, 'remote', 'add', 'origin', path.join(root, 'origin.git'));
    g(wt, 'push', '-q', 'origin', 'HEAD:main'); g(wt, 'remote', 'set-head', 'origin', 'main');
    writeFileSync(wfp, wfMerge('human-only'));
    const allow = mg(OK101, { input: { cwd: wt }, wf: false });
    g(wt, 'commit', '-qam', 'human'); g(wt, 'push', '-q', 'origin', 'HEAD:main');
    writeFileSync(wfp, wfMerge(REC));
    const deny = mg(OK101, { input: { cwd: wt }, wf: false });
    rmSync(root, { recursive: true, force: true });
    check('merge-guard: git tree — policy read from origin/main, not the working tree (records-only on origin → allowed; working-tree-only → BLOCK)',
      allow.code === 0 && allow.stdout.includes('records-only scope') && blocks(deny, 'human (HITL) merges'), `${why(allow)} || ${why(deny)}`); }

  // block — tools and gh failures
  { const r = mg(OK101, { gh: false }); check('merge-guard: gh missing → BLOCK', blocks(r, 'gh and jq'), why(r)); }
  { const r = mg(OK101, { jq: false }); check('merge-guard: jq missing → BLOCK', blocks(r, 'gh and jq') && !ghRan(r), why(r)); }
  { const r = mg(OK101, { exit: 1 }); check('merge-guard: gh pr view exits 1 → BLOCK', blocks(r, 'could not read PR #101') && sawView(r, 101), why(r)); }
  { const r = mg(OK101, { gh: '#!/bin/bash\necho "gh-stub-called $*" >&2\nprintf "not json"\n' });
    check('merge-guard: gh prints non-JSON → BLOCK', blocks(r, 'could not read PR #101'), why(r)); }
  { const r = mg(OK101, { gh: `#!/bin/bash\nprintf '%s' '{"state":"OPEN","files":"x","statusCheckRollup":[]}'\n` });
    check('merge-guard: files is not an array → BLOCK', blocks(r, 'could not read PR #101'), why(r)); }
}

// ── Tick + mission token budgets (tune-presets D3, AC-10): print only, exit 0.
{
  const MB = 'mission-budget (D3';
  const led = (...extra) => ({ 'pay.state.md': ['Estimate: 4 sessions', 'Sessions used: 2', ...extra, '- [x] S1 — build', '- [ ] S2 — build', 'Next up: S2', ''].join('\n') });
  const run = (...extra) => runHook({ event: 'UserPromptSubmit', desc: MB, input: {}, ledgers: led(...extra) });
  const absent = run();
  check('tick budget: fields absent → output byte-identical to the pre-D3 shape (no tick text, no stop)',
    absent.code === 0 && absent.stdout === '🧵 Mission pay — session 2/4 (est.) — .plans/pay.state.md\n  Next up: S2\n', JSON.stringify(absent.stdout));
  const under = run('Tick budget: 750000', 'Tick tokens: 212000', 'Mission budget: 400000');
  check('tick budget: under → status line carries "· tick 212000/750000 tokens", no 🛑',
    under.code === 0 && /session 2\/4 \(est\.\) · tick 212000\/750000 tokens — /.test(under.stdout) && !/🛑/.test(under.stdout), JSON.stringify(under.stdout));
  const tick = run('Tick budget: 750000', 'Tick tokens: 750000');
  check('tick budget: k ≥ N → 🛑 TICK BUDGET (no new brief, ledger, owner channel), exit 0',
    tick.code === 0 && /🛑 TICK BUDGET — 750000 of 750000/.test(tick.stdout) && /owner channel/.test(tick.stdout) && !/MISSION BUDGET/.test(tick.stdout), JSON.stringify(tick.stdout));
  const mission = run('Tick budget: 750000', 'Tick tokens: 10', 'Mission budget: 1500000');
  const below = run('Tick budget: 750000', 'Tick tokens: 10', 'Mission budget: 1499999');
  check('mission budget: Σ ≥ Tick budget × ceil(Estimate/2) → 🛑 MISSION BUDGET; one token under → silent',
    mission.code === 0 && /🛑 MISSION BUDGET — 1500000 tokens spent ≥ 750000 × ceil\(4\/2\)/.test(mission.stdout) && !/TICK BUDGET/.test(mission.stdout)
      && below.code === 0 && !/🛑/.test(below.stdout), JSON.stringify(mission.stdout));
}

// ── precompact-handoff (v1.68.0): PreCompact snapshot + manual gate, PreToolUse
// handoff gate, token bands, four-record resume. The handoff hooks resolve the
// local handoff via `git rev-parse --git-path`, so these cases run in a `git:
// true` cwd; multi-call sequences share one caller-owned `dir`. Markers live in
// a private 0700 state dir inside the git dir (never $TMPDIR), keyed by session_id.
{
  const GATE_D = 'handoff gate (PreToolUse';
  const PC_D = 'pre-compact snapshot';
  const LIB = readFileSync(path.join(PLUGIN, 'hooks/lib/handoff-lib.sh'), 'utf8');
  const BUDGET_SRC = readFileSync(path.join(PLUGIN, 'hooks/lib/handoff-budget.sh'), 'utf8');
  // Env isolation: a harness run inside a session that sets these must not skew the bands.
  const ENV0 = { CLAUDE_CODE_AUTO_COMPACT_WINDOW: '', CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: '', AGENTIC_WORKFLOW_COMPACT_FORCE: '' };
  const THR = 950_000; // DEFAULT_WINDOW 1,000,000 × DEFAULT_PCT 95 / 100
  const URG_T = THR * 85 / 100; // 807,500
  const ADV_T = THR * 70 / 100; // 665,000
  // A JSONL transcript in the Verified shape (master plan): user lines carry string
  // or text-item content; a tool_result array is a tool echo; the LAST
  // non-sidechain assistant line's usage sum is the context in use.
  const asst = (tokens, { sidechain = false, text = 'working on it' } = {}) => JSON.stringify({
    type: 'assistant', isSidechain: sidechain,
    message: { content: [{ type: 'text', text }], usage: { input_tokens: 2, cache_creation_input_tokens: 1000, cache_read_input_tokens: tokens - 1002 } },
  });
  function mkTranscript({ tokens, sidechain, users = [], assistantText, pad = 0, meta } = {}) {
    const l = users.map((u) => JSON.stringify({ type: 'user', message: { content: u } }));
    if (meta) l.push(JSON.stringify({ type: 'user', isMeta: true, message: { content: meta } }));
    if (pad) l.push(JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', content: 'p'.repeat(pad) }] } }));
    if (tokens !== undefined) l.push(asst(tokens, { text: assistantText }));
    if (sidechain !== undefined) l.push(asst(sidechain, { sidechain: true }));
    return l.join('\n') + '\n';
  }
  // git-init up front: a fixture that stages .git/agentic-workflow/ before the
  // first runHook would otherwise make runHook's `git:` knob skip the init.
  const mkDir = (git = true) => {
    const d = mkdtempSync(path.join(tmpdir(), 'hooktest-hg-'));
    if (git) spawnSync('git', ['init', '-q', '-b', 'main'], { cwd: d });
    return d;
  };
  const canonOf = (dir) => path.join(realpathSync(dir), '.git/agentic-workflow/session-handoff.md');
  const stampLine = (iso) => `_Written: ${iso} · session unknown · branch main_\n\n# Session handoff\n`;
  const putHandoff = (dir, iso = isoNoMillis(Date.now())) => {
    mkdirSync(path.dirname(canonOf(dir)), { recursive: true });
    writeFileSync(canonOf(dir), stampLine(iso));
  };
  const stateOf = (dir) => path.join(realpathSync(dir), '.git/agentic-workflow/state');
  const mark = (dir, s, ext) => path.join(stateOf(dir), `${s}.${ext}`);
  const blocksOf = (dir, s) => (existsSync(mark(dir, s, 'band')) ? Number(readFileSync(mark(dir, s, 'band'), 'utf8').trim().split(/\s+/)[3] || 0) : 0);
  const hsid = (tag) => sid(`hg-${tag}`);
  const gate = (dir, s, tool, tool_input, content, env = {}) => runHook({ event: 'PreToolUse', desc: GATE_D, dir, git: true,
    input: { session_id: s, tool_name: tool, tool_input }, transcript: { content }, env: { ...ENV0, ...env } });
  const compact = (dir, s, trigger, content, { ci = null, env = {}, bin, ledgers, files } = {}) => runHook({ event: 'PreCompact', desc: PC_D,
    dir, git: true, input: { session_id: s, trigger, custom_instructions: ci, hook_event_name: 'PreCompact' },
    transcript: { content }, env: { ...ENV0, ...env }, bin, ledgers, files });
  const snapOf = (dir, s) => path.join(realpathSync(dir), '.git/agentic-workflow/snapshots', `${s}.md`);
  const why = (r) => `code=${r.code} out=${JSON.stringify(r.stdout.slice(0, 200))} err=${JSON.stringify(r.stderr.slice(0, 400))}`;
  const URGENT_T = mkTranscript({ tokens: URG_T });
  const withDir = (fn) => { const d = mkDir(); try { fn(d); } finally { rmSync(d, { recursive: true, force: true }); } };

  { // registration shapes
    const spec = JSON.parse(readFileSync(HOOKS, 'utf8'));
    const pc = spec.hooks.PreCompact || [];
    check('PreCompact: registered (no matcher = both triggers), quoted lib call, timeout ≤ 15',
      pc.length === 1 && (pc[0].matcher === undefined || pc[0].matcher === '.*')
        && pc[0].hooks[0].command === 'bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/pre-compact.sh"'
        && pc[0].hooks[0].timeout > 0 && pc[0].hooks[0].timeout <= 15, JSON.stringify(pc));
    const keys = Object.keys(spec.hooks);
    check('PreCompact: key sits directly before SessionStart', keys.indexOf('PreCompact') === keys.indexOf('SessionStart') - 1, keys.join(','));
    const g = (spec.hooks.PreToolUse || []).find((x) => x.hooks.some((h) => (h.command || '').includes('handoff-gate.sh')));
    check('PreToolUse(handoff gate): matcher .* (every tool), quoted lib call, timeout 5',
      !!g && g.matcher === '.*' && g.hooks[0].command === 'bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/handoff-gate.sh"' && g.hooks[0].timeout === 5, JSON.stringify(g));
  }
  { // named constants pinned (Assumed defaults + the shared byte bands + fail-open count)
    const c = (n) => (LIB.match(new RegExp(`^${n}=(\\d+)`, 'm')) || [])[1];
    check('handoff-lib: DEFAULT_WINDOW=1000000 and DEFAULT_PCT=95 (Assumed; OB-32 confirms)',
      c('HL_DEFAULT_WINDOW') === '1000000' && c('HL_DEFAULT_PCT') === '95', `${c('HL_DEFAULT_WINDOW')} ${c('HL_DEFAULT_PCT')}`);
    check('handoff-lib: byte bands equal handoff-budget.sh literals; bands 70/85; fail-open at the 6th block',
      Number(c('HL_ADVISORY_BYTES')) === ADVISORY && Number(c('HL_URGENT_BYTES')) === URGENT
        && /^ADVISORY_BYTES=3700000/m.test(BUDGET_SRC) && /^URGENT_BYTES=5380000/m.test(BUDGET_SRC)
        && c('HL_ADVISORY_PCT') === '70' && c('HL_URGENT_PCT') === '85' && c('HL_FAIL_OPEN') === '6');
  }
  for (const f of ['handoff-lib.sh', 'pre-compact.sh', 'handoff-gate.sh']) { // externals self-proof
    const src = readFileSync(path.join(PLUGIN, 'hooks/lib', f), 'utf8');
    const lines = src.match(/^# externals: .+$/gm) || [];
    const ext = (lines[0] || '').replace('# externals: ', '').trim().split(/\s+/).filter(Boolean);
    const missing = ext.filter((e) => !BIN_LIST.includes(e) && e !== 'jq' && e !== 'gh');
    check(`${f}: exactly one \`# externals:\` line, ⊆ BIN_LIST + jq + gh`, lines.length === 1 && ext.length > 0 && missing.length === 0, missing.join(' '));
  }

  // ── AC-1 snapshot content ──
  withDir((d) => {
    const s = hsid('snap');
    const users = ['oldest request, dropped', 'second oldest, dropped',
      'deploy with sk-ABCDEFGH12345678 please', 'token ghp_ABCDEFGHIJKLMNOP and github_pat_ABCDEFGH1234',
      'aws AKIAABCDEFGHIJKLMNOP now, slack xoxb-1234567890-abcdefgh', 'curl -H "Authorization: Bearer xyz.secret.value"',
      `bell\u0007and\nnewline -----BEGIN RSA PRIVATE KEY----- MIIEabc -----END RSA PRIVATE KEY----- ${'z'.repeat(400)}`];
    const tc = mkTranscript({ tokens: 1000, users, assistantText: 'A'.repeat(700), meta: 'META-LINE' })
      + JSON.stringify({ type: 'user', message: { content: [{ type: 'tool_result', content: 'TOOL-ECHO' }] } }) + '\n';
    const ledgers = { 'pay.state.md': ['Estimate: 2 sessions', 'Sessions used: 1', '- [x] S1 — build', '- [ ] Checkpoint — phase 1 review', 'Next up: Checkpoint review of pay', ''].join('\n') };
    const r = compact(d, s, 'auto', tc, { ledgers });
    const p = snapOf(d, s);
    const body = existsSync(p) ? readFileSync(p, 'utf8') : '';
    const prompts = (body.split('## Last 5 user requests')[1] || '').split('##')[0].trim().split('\n').filter((x) => x.startsWith('- '));
    const last = (body.split('## Last assistant text')[1] || '').trim();
    check('PreCompact(auto, stale): exit 0 and the snapshot exists with stamp, branch, ledger `Next up:` and open beat',
      r.code === 0 && /^_Written: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z · session \S+ · trigger auto_$/m.test(body)
        && /branch main/.test(body) && /Next up: Checkpoint review of pay/.test(body) && /open beat: - \[ \] Checkpoint/.test(body), why(r) + body.slice(0, 300));
    check('PreCompact snapshot: exactly the last 5 user requests (no tool_result echo, no isMeta), each ≤300 chars, control chars stripped',
      prompts.length === 5 && !/oldest/.test(body) && !/TOOL-ECHO|META-LINE/.test(body)
        && prompts.every((x) => x.length <= 302) && !/\u0007/.test(body), JSON.stringify(prompts));
    check('PreCompact snapshot: secrets redacted (sk-, ghp_, github_pat_, AKIA, xox?-, Bearer, PEM)',
      !/sk-ABC|ghp_|github_pat_|AKIA|xoxb|Bearer|BEGIN RSA|MIIEabc/.test(body) && (body.match(/\[redacted\]/g) || []).length >= 7, body);
    check('PreCompact snapshot: last assistant text ≤600 chars; file mode 0600; open PRs line present',
      /^> A{600}$/m.test(last) && !/A{601}/.test(last) && (statSync(p).mode & 0o777) === 0o600 && /## Open PRs \(@me\)\n- /.test(body),
      `mode=${existsSync(p) ? (statSync(p).mode & 0o777).toString(8) : 'none'}`);
    const git = spawnSync('git', ['status', '--porcelain', '--ignored'], { cwd: d, encoding: 'utf8' }).stdout;
    check('PreCompact snapshot: lives inside the git dir — never tracked, never in git status', !/agentic-workflow/.test(git), git);
  });
  withDir((d) => { // snapshot failure never blocks auto: the snapshots dir is a FILE
    const s = hsid('snapfail');
    mkdirSync(path.join(d, '.git/agentic-workflow'), { recursive: true });
    const r0 = compact(d, s, 'auto', URGENT_T, { files: { '.git/agentic-workflow/snapshots': { content: 'not a dir' } } });
    check('PreCompact(auto): snapshot write failure → still exit 0 (never blocks auto)', r0.code === 0, why(r0));
  });

  // ── AC-2 manual /compact gate ──
  withDir((d) => {
    const s = hsid('man');
    const r = compact(d, s, 'manual', URGENT_T);
    const lines = r.stderr.trim().split('\n');
    check('PreCompact(manual, stale): exit 2, ≤3 stderr lines naming /agentic-workflow:handoff and --force-compact, snapshot still written',
      r.code === 2 && lines.length <= 3 && /\/agentic-workflow:handoff/.test(r.stderr) && /--force-compact/.test(r.stderr)
        && /AGENTIC_WORKFLOW_COMPACT_FORCE=1/.test(r.stderr) && existsSync(snapOf(d, s)), why(r));
    const f = compact(d, hsid('man-f'), 'manual', URGENT_T, { ci: 'keep the API notes --force-compact' });
    check('PreCompact(manual) + `--force-compact` in the /compact argument → exit 0', f.code === 0, why(f));
    const e = compact(d, hsid('man-e'), 'manual', URGENT_T, { env: { AGENTIC_WORKFLOW_COMPACT_FORCE: '1' } });
    check('PreCompact(manual) + AGENTIC_WORKFLOW_COMPACT_FORCE=1 → exit 0', e.code === 0, why(e));
    const a = compact(d, hsid('man-a'), 'auto', URGENT_T);
    check('PreCompact(auto) at urgent with no handoff → exit 0 (auto is never blocked)', a.code === 0 && a.stderr === '', why(a));
  });
  { // non-git cwd: the manual block never engages (A3); snapshot falls back to XDG
    const xdg = mkDir(false);
    const r = runHook({ event: 'PreCompact', desc: PC_D, input: { session_id: hsid('nogit'), trigger: 'manual' },
      transcript: { content: URGENT_T }, env: { ...ENV0, XDG_STATE_HOME: xdg } });
    const found = spawnSync('find', [xdg, '-name', '*.md', '-path', '*snapshots*'], { encoding: 'utf8' }).stdout.trim();
    check('PreCompact(manual) outside a git work tree → exit 0; snapshot lands under $XDG_STATE_HOME/agentic-workflow/',
      r.code === 0 && found !== '', why(r) + ` found=${found}`);
    rmSync(xdg, { recursive: true, force: true });
  }
  withDir((d) => { // gh bounded: a hanging gh stub is killed at 3 s → `unavailable`, well under 15 s
    const s = hsid('ghhang');
    const t0 = Date.now();
    const r = compact(d, s, 'auto', URGENT_T, { bin: { gh: '#!/bin/sh\nexec sleep 10\n' } });
    const ms = Date.now() - t0;
    const body = existsSync(snapOf(d, s)) ? readFileSync(snapOf(d, s), 'utf8') : '';
    check('PreCompact: hanging gh → snapshot says `unavailable`, returns < 15 s (PATH = BIN_LIST only: externals complete)',
      r.code === 0 && /## Open PRs \(@me\)\n- unavailable/.test(body) && ms < 15_000, `${ms}ms ${why(r)}`);
    const s2 = hsid('ghok');
    const ok = compact(d, s2, 'auto', URGENT_T, { bin: { gh: '#!/bin/sh\necho \'[{"number":7,"title":"feat: x","headRefName":"feat/x"}]\'\n' } });
    const b2 = existsSync(snapOf(d, s2)) ? readFileSync(snapOf(d, s2), 'utf8') : '';
    check('PreCompact: answering gh → snapshot lists the open PR', ok.code === 0 && /- #7 feat: x \(feat\/x\)/.test(b2), b2.slice(0, 400));
  });

  // ── AC-3 handoff gate ──
  withDir((d) => { // counsel fixture 1: cross urgent → write the handoff → next tool call NOT blocked
    const s = hsid('c1');
    const b = gate(d, s, 'Bash', { command: 'ls' }, URGENT_T);
    const w = gate(d, s, 'Write', { file_path: canonOf(d) }, URGENT_T);
    putHandoff(d);
    const n = gate(d, s, 'Bash', { command: 'ls' }, URGENT_T);
    check('handoff gate (counsel A1 fixture 1): urgent → Bash blocked; Write to the handoff → 0; next Bash → 0',
      b.code === 2 && w.code === 0 && n.code === 0 && n.stderr === '', `${why(b)} | ${why(w)} | ${why(n)}`);
  });
  withDir((d) => { // counsel fixture 2: write the handoff → manual /compact exits 0 without the override
    const s = hsid('c2');
    gate(d, s, 'Write', { file_path: canonOf(d) }, URGENT_T);
    putHandoff(d);
    const r = compact(d, s, 'manual', URGENT_T);
    check('PreCompact (counsel A1 fixture 2): handoff written this session → manual /compact exit 0, no override', r.code === 0, why(r));
  });
  withDir((d) => { // the handoff command's FULL tool sequence at urgent: zero blocks, counter never moves
    const s = hsid('seq');
    const seq = [
      ['Bash', { command: 'git rev-parse --git-path agentic-workflow/session-handoff.md' }],
      ['Bash', { command: 'git branch --show-current' }],
      ['Bash', { command: 'date -u +%Y-%m-%dT%H:%M:%SZ' }],
      ['Read', { file_path: path.join(PLUGIN, 'templates/session-handoff.md') }],
      ['Write', { file_path: canonOf(d) }],
      ['Bash', { command: 'ls' }],
    ];
    const codes = [];
    let maxBlocks = 0;
    for (const [tool, ti] of seq) {
      const r = gate(d, s, tool, ti, URGENT_T);
      codes.push(r.code);
      maxBlocks = Math.max(maxBlocks, blocksOf(d, s));
      if (tool === 'Write') putHandoff(d);
    }
    check('handoff gate: /agentic-workflow:handoff\'s full sequence at urgent → zero exit-2, blocks never incremented (compliance never touches fail-open)',
      codes.every((c) => c === 0) && maxBlocks === 0, `codes=${codes} blocks=${maxBlocks}`);
  });
  withDir((d) => { // the band cache cannot mint freshness
    const s = hsid('cache');
    const a = gate(d, s, 'Bash', { command: 'ls' }, URGENT_T);
    const grown = mkTranscript({ tokens: URG_T, pad: 70_000 });
    const b = gate(d, s, 'Bash', { command: 'ls' }, grown);
    check('handoff gate: urgent, transcript grows ≥ 64 KiB (re-parse) with NO handoff write → still blocked, no `.handoff` marker',
      a.code === 2 && b.code === 2 && !existsSync(mark(d, s, 'handoff')), `${why(a)} | ${why(b)}`);
  });
  withDir((d) => { // marker written, then the file deleted → stale again
    const s = hsid('del');
    gate(d, s, 'Write', { file_path: canonOf(d) }, URGENT_T);
    putHandoff(d);
    const ok = gate(d, s, 'Bash', { command: 'ls' }, URGENT_T);
    rmSync(canonOf(d));
    const r = gate(d, s, 'Bash', { command: 'ls' }, URGENT_T);
    check('handoff gate: handoff deleted after its marker was written → stale, blocked', ok.code === 0 && r.code === 2, `${why(ok)} | ${why(r)}`);
  });
  withDir((d) => { // allowlist, one fresh session per probe so the block counter never interferes
    const allow = [
      ['Read', { file_path: '/etc/hosts' }], ['Grep', { pattern: 'x' }], ['Glob', { pattern: '*' }],
      ['AskUserQuestion', { questions: [] }], ['Skill', { skill: 'agentic-workflow:handoff' }],
      ['SlashCommand', { command: '/agentic-workflow:handoff' }],
      ['Bash', { command: 'date -u +%Y-%m-%dT%H:%M:%SZ' }],
      ['Bash', { command: 'git rev-parse --git-path agentic-workflow/session-handoff.md' }],
      ['Bash', { command: 'git branch --show-current' }],
      ['Bash', { command: '  git branch --show-current \n' }],
      ['Bash', { command: 'git rev-parse --path-format=absolute --git-path agentic-workflow/session-handoff.md' }],
      ['SlashCommand', { command: '/agentic-workflow:handoff resume' }],
    ];
    const deny = [
      ['Bash', { command: 'ls' }], ['Bash', { command: 'date -u +%s' }],
      ['Bash', { command: 'git branch --show-current; rm -rf x' }],
      ['Write', { file_path: path.join(d, 'docs/x/session-handoff.md') }],
      ['Edit', { file_path: path.join(d, 'session-handoff.md') }],
      ['Skill', { skill: 'agentic-workflow:plan' }], ['Task', { prompt: 'do it' }],
      ['Skill', { skill: 'commit', args: 'then run agentic-workflow:handoff' }],
      ['SlashCommand', { command: '/commit agentic-workflow:handoff' }], ['SlashCommand', { command: '/agentic-workflow:handoffx' }],
    ];
    const bad = [];
    for (const [t, ti] of allow) { const r = gate(d, hsid('al'), t, ti, URGENT_T); if (r.code !== 0) bad.push(`allow ${t} ${JSON.stringify(ti)} → ${r.code}`); }
    for (const [t, ti] of deny) { const r = gate(d, hsid('dn'), t, ti, URGENT_T); if (r.code !== 2) bad.push(`deny ${t} ${JSON.stringify(ti)} → ${r.code}`); }
    check('handoff gate allowlist: Read/Grep/Glob/AskUserQuestion/Skill+SlashCommand(handoff, by field)/the Bash lines (trimmed, incl. --path-format=absolute) → 0; ls, `date -u +%s`, a compound, a same-basename Write elsewhere, other Skill (even with args naming the handoff), Task → 2',
      bad.length === 0, bad.join('; '));
  });
  withDir((d) => { // path identity: relative and symlinked spellings canonicalise to the handoff
    const s = hsid('rel');
    const r = gate(d, s, 'Write', { file_path: '.git/agentic-workflow/session-handoff.md' }, URGENT_T);
    const relMarked = existsSync(mark(d, s, 'handoff'));
    const s2 = hsid('sym');
    mkdirSync(path.join(d, '.git/agentic-workflow'), { recursive: true });
    symlinkSync(path.join(d, '.git/agentic-workflow'), path.join(d, 'hlink'));
    const r2 = gate(d, s2, 'Write', { file_path: path.join(d, 'hlink/session-handoff.md') }, URGENT_T);
    putHandoff(d);
    const after = gate(d, s2, 'Bash', { command: 'ls' }, URGENT_T);
    check('handoff gate: Write via a relative or a symlinked spelling of the handoff path → 0, marker written, then fresh',
      r.code === 0 && relMarked && r2.code === 0 && existsSync(mark(d, s2, 'handoff')) && after.code === 0, `${why(r)} | ${why(r2)} | ${why(after)}`);
  });
  withDir((d) => { // block message content + the first block writes the snapshot (and so the dir)
    const s = hsid('msg');
    const r = gate(d, s, 'Bash', { command: 'ls' }, URGENT_T);
    const lines = r.stderr.trim().split('\n');
    check('handoff gate block: ≤5 stderr lines naming the canonical path + "directory exists", branch=, now=<ISO>, snapshot, "subagents share"',
      r.code === 2 && lines.length <= 5 && r.stderr.includes(`handoff=${canonOf(d)} (directory exists)`) && /^branch=main$/m.test(r.stderr)
        && /^now=\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/m.test(r.stderr) && /subagents share this gate/.test(r.stderr)
        && r.stderr.includes(`snapshot=${snapOf(d, s)}`) && existsSync(snapOf(d, s)) && existsSync(path.dirname(canonOf(d))), why(r));
  });
  withDir((d) => { // fail open: five blocks, then the 6th is a nudge
    const s = hsid('open');
    const codes = [];
    let last;
    for (let i = 0; i < 6; i++) { last = gate(d, s, 'Bash', { command: 'ls' }, URGENT_T); codes.push(last.code); }
    check('handoff gate: five consecutive blocks exit 2, the 6th exits 0 with a one-line nudge (fail open)',
      codes.slice(0, 5).every((c) => c === 2) && codes[5] === 0 && /failed open/.test(last.stdout) && last.stdout.trim().split('\n').length === 1,
      `codes=${codes} out=${JSON.stringify(last.stdout)}`);
  });
  { // unresolvable path (non-git cwd) → never blocks
    const r = runHook({ event: 'PreToolUse', desc: GATE_D, input: { session_id: hsid('ng'), tool_name: 'Bash', tool_input: { command: 'ls' } },
      transcript: { content: URGENT_T }, env: ENV0 });
    check('handoff gate: non-git cwd at urgent → exit 0, silent (A3: never engages)', r.code === 0 && r.stderr === '' && r.stdout === '', why(r));
  }
  withDir((d) => { // compaction drops the band cache: post-compact low context is not blocked by a stale urgent cache
    const s = hsid('post');
    const b = gate(d, s, 'Bash', { command: 'ls' }, URGENT_T);
    compact(d, s, 'auto', URGENT_T);
    const after = URGENT_T + asst(90_000) + '\n';
    const r = gate(d, s, 'Bash', { command: 'ls' }, after);
    check('handoff gate: after PreCompact, the next call re-parses (cache dropped) — 90k tokens → not blocked', b.code === 2 && r.code === 0, `${why(b)} | ${why(r)}`);
  });

  // ── AC-4 token bands ──
  withDir((d) => {
    const at = (tokens, env, extra = {}) => gate(d, hsid('band'), 'Bash', { command: 'ls' }, mkTranscript({ tokens, ...extra }), env).code;
    const res = {
      dflt: [at(URG_T), at(URG_T - 1)],
      w400: [at(323_000, { CLAUDE_CODE_AUTO_COMPACT_WINDOW: '400000' }), at(322_999, { CLAUDE_CODE_AUTO_COMPACT_WINDOW: '400000' })],
      pct: [at(170_000, { CLAUDE_CODE_AUTO_COMPACT_WINDOW: '400000', CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: '50' }),
        at(169_999, { CLAUDE_CODE_AUTO_COMPACT_WINDOW: '400000', CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: '50' })],
      side: at(1000, {}, { sidechain: 990_000 }),
    };
    check('token bands (gate): urgent at exactly 85% — defaults 807,500/807,499; window 400k 323,000/322,999; pct 50 170,000/169,999; a sidechain line is ignored',
      JSON.stringify(res) === JSON.stringify({ dflt: [2, 0], w400: [2, 0], pct: [2, 0], side: 0 }), JSON.stringify(res));
  });
  { // handoff-budget token path: advisory at 70%, text names tokens + the percentage; below is silent
    const bud = (tokens, env = {}) => runHook({ event: 'UserPromptSubmit', desc: BUDGET, input: { session_id: hsid('bt') },
      transcript: { content: mkTranscript({ tokens }) }, env: { ...ENV0, ...env } });
    const adv = bud(ADV_T);
    const below = bud(ADV_T - 1);
    const urg = bud(URG_T);
    const w = bud(266_000, { CLAUDE_CODE_AUTO_COMPACT_WINDOW: '400000' });
    check('handoff-budget token path: 665,000 → advisory naming tokens + 70% (≤3 lines); 664,999 → silent; 807,500 → URGENT naming 85%',
      adv.code === 0 && /Handoff budget — context at 665000 tokens, past 70% of the 950000-token auto-compact point/.test(adv.stdout) && !urgent(adv) && le3Lines(adv)
        && below.code === 0 && below.stdout === '' && urgent(urg) && /807500 tokens, past 85%/.test(urg.stdout) && le3Lines(urg)
        && /266000 tokens, past 70% of the 380000-token/.test(w.stdout), `${adv.stdout}|${below.stdout}|${urg.stdout}|${w.stdout}`);
  }
  withDir((d) => { // handoff-budget silencer 3 on the token path = the gate's marker, not mtime
    const s = hsid('bsil');
    gate(d, s, 'Write', { file_path: canonOf(d) }, URGENT_T);
    putHandoff(d);
    const r = runHook({ event: 'UserPromptSubmit', desc: BUDGET, dir: d, git: true, input: { session_id: s }, transcript: { content: URGENT_T }, env: ENV0 });
    check('handoff-budget token path: a fresh handoff marker from this session → silent', r.code === 0 && r.stdout === '', JSON.stringify(r.stdout));
  });
  { // no usage line → the byte path, texts byte-identical to the pre-v1.68.0 hook
    const adv = runHook({ event: 'UserPromptSubmit', desc: BUDGET, input: { session_id: hsid('bya') }, transcript: { bytes: ADVISORY } });
    const urg = runHook({ event: 'UserPromptSubmit', desc: BUDGET, input: { session_id: hsid('byu') }, transcript: { bytes: URGENT } });
    const A = `📝 Handoff budget — transcript at ${ADVISORY} bytes, past ~55% of the one observed compaction point (n=1; bytes are a loose cumulative proxy, not tokens).\nWrite or refresh docs/product/session-handoff.md soon, while the window still holds the intent.\n`;
    const U = `🚨 Handoff budget URGENT — transcript at ${URGENT} bytes, past ~80% of the one observed compaction point (n=1; bytes are a loose cumulative proxy, not tokens).\nRefresh docs/product/session-handoff.md NOW — state, next step, verify signal — before compaction takes the window.\n`;
    check('handoff-budget byte path (no usage line): advisory and urgent texts byte-identical to the pre-v1.68.0 fixtures',
      adv.stdout === A && urg.stdout === U, `${JSON.stringify(adv.stdout)} ${JSON.stringify(urg.stdout)}`);
  }
  withDir((d) => { // byte-path freshness: 10% of URGENT_BYTES / 0.85 = 632,941 bytes of growth
    const win = Math.floor(Math.floor(URGENT * 100 / 85) / 10);
    const bytesT = (n) => 'x'.repeat(n);
    // Two sessions: the gate re-parses only after ≥ 64 KiB of growth, so each
    // probe writes its marker at URGENT and then jumps straight to the probe size.
    const probe = (tag, extra) => {
      const s = hsid(tag);
      gate(d, s, 'Write', { file_path: canonOf(d) }, bytesT(URGENT));
      putHandoff(d);
      return gate(d, s, 'Bash', { command: 'ls' }, bytesT(URGENT + extra));
    };
    const inWin = probe('bytef-in', win);
    const past = probe('bytef-past', win + 1);
    check('handoff gate byte path: fresh within URGENT_BYTES/0.85 × 10% (632,941 B) of growth, stale one byte past it',
      win === 632_941 && inWin.code === 0 && past.code === 2, `${why(inWin)} | ${why(past)}`);
  });

  // ── AC-6 compact-resume, four records ──
  const cr = (d, s, files, ledgers) => runHook({ event: 'SessionStart', desc: COMPACT, dir: d, git: true,
    input: { source: 'compact', session_id: s }, transcript: { bytes: 2048 }, files, ledgers });
  withDir((d) => {
    const s = hsid('cr1');
    putHandoff(d, isoNoMillis(Date.now() + 86_400_000));
    const m = ctx(cr(d, s)) || '';
    check('compact-resume: local handoff only → named as the freshest record, CURRENT, ≤6 lines',
      m.includes(`the freshest record is ${canonOf(d)} (the only record found)`) && /Freshness: CURRENT/.test(m) && m.split('\n').length <= 6, m);
  });
  withDir((d) => {
    const s = hsid('cr2');
    compact(d, s, 'auto', URGENT_T);
    const m = ctx(cr(d, s)) || '';
    check('compact-resume: snapshot only → labelled mechanical, says the agent handoff is missing, ≤6 lines',
      m.includes(`the freshest record is ${snapOf(d, s)}`) && /a mechanical snapshot — re-read the agent handoff too: none was written/.test(m) && m.split('\n').length <= 6, m);
  });
  withDir((d) => {
    const s = hsid('cr3');
    putHandoff(d, '2015-01-01T00:00:00Z');
    mkdirSync(path.join(d, '.git/agentic-workflow/snapshots'), { recursive: true });
    writeFileSync(snapOf(d, s), stampLine('2010-01-01T00:00:00Z'));
    const repoNewest = ctx(cr(d, s, { [HANDOFF_REL]: { content: stampLine('2020-01-01T00:00:00Z') } })) || '';
    putHandoff(d, '2025-01-01T00:00:00Z');
    const localNewest = ctx(cr(d, s)) || '';
    writeFileSync(snapOf(d, s), stampLine('2030-01-01T00:00:00Z'));
    const snapNewest = ctx(cr(d, s)) || '';
    check('compact-resume: local + repo + snapshot → the newest `_Written:` stamp wins (repo, then local, then snapshot→mechanical naming the local handoff)',
      repoNewest.includes(`the freshest record is ${HANDOFF_REL} (newest \`_Written:\` stamp)`) && repoNewest.includes(canonOf(d))
        && localNewest.includes(`the freshest record is ${canonOf(d)} (newest`)
        && snapNewest.includes(`mechanical snapshot — re-read the agent handoff too: ${canonOf(d)}`)
        && [repoNewest, localNewest, snapNewest].every((x) => x.split('\n').length <= 6), `${repoNewest}\n--\n${localNewest}\n--\n${snapNewest}`);
  });
  withDir((d) => {
    const s = hsid('cr4');
    putHandoff(d);
    compact(d, s, 'auto', URGENT_T);
    const m = ctx(cr(d, s, undefined, NOT_STARTED)) || '';
    check('compact-resume branch 1: active ledger + local handoff + snapshot → item 2 names both, still ≤6 lines',
      /1\. \.plans\/m\.state\.md/.test(m) && m.includes(`2. ${canonOf(d)} — the last agent handoff (local)`) && m.includes(snapOf(d, s)) && m.split('\n').length <= 6, m);
  });

  // ── marker hardening (ckpt-s1 advisories) ──
  withDir((d) => { // markers live in a private 0700 state dir inside the git dir, never $TMPDIR
    const s = hsid('priv');
    gate(d, s, 'Bash', { command: 'ls' }, URGENT_T);
    check('handoff markers: state dir is 0700 inside the git dir; no marker in $TMPDIR',
      existsSync(mark(d, s, 'band')) && (statSync(stateOf(d)).mode & 0o777) === 0o700
        && !existsSync(path.join(tmpdir(), `handoff-gate-${s}.band`)), `mode=${existsSync(stateOf(d)) ? (statSync(stateOf(d)).mode & 0o777).toString(8) : 'none'}`);
  });
  withDir((d) => { // a pre-created symlink at the marker path is never followed
    const s = hsid('sym-m');
    const victim = path.join(d, 'victim.txt');
    writeFileSync(victim, 'keep');
    mkdirSync(stateOf(d), { recursive: true, mode: 0o700 });
    symlinkSync(victim, mark(d, s, 'band'));
    symlinkSync(victim, mark(d, s, 'handoff'));
    const g = gate(d, s, 'Bash', { command: 'ls' }, URGENT_T);
    const w = gate(d, s, 'Write', { file_path: canonOf(d) }, URGENT_T);
    const sb = hsid('sym-b');
    symlinkSync(victim, path.join(stateOf(d), `${sb}.budget-urgent`));
    const b = runHook({ event: 'UserPromptSubmit', desc: BUDGET, dir: d, git: true, input: { session_id: sb }, transcript: { content: URGENT_T }, env: ENV0 });
    check('handoff markers: symlinks pre-planted at the gate and budget marker paths are not followed (target unchanged, hooks fail open)',
      readFileSync(victim, 'utf8') === 'keep' && g.code === 0 && w.code === 0 && b.code === 0, `${why(g)} | ${why(w)} | ${why(b)}`);
  });
  withDir((d) => { // a symlinked state dir is refused outright
    const s = hsid('sym-d');
    const elsewhere = mkDir(false);
    mkdirSync(path.join(d, '.git/agentic-workflow'), { recursive: true });
    symlinkSync(elsewhere, stateOf(d));
    const g = gate(d, s, 'Bash', { command: 'ls' }, URGENT_T);
    const leaked = spawnSync('ls', ['-A', elsewhere], { encoding: 'utf8' }).stdout.trim();
    check('handoff markers: a symlinked state dir is refused — nothing written through it, gate fails open', g.code === 0 && leaked === '', `${why(g)} leaked=${leaked}`);
    rmSync(elsewhere, { recursive: true, force: true });
  });
  withDir((d) => { // no session_id → no marker (no shared constant id)
    const g = gate(d, '', 'Bash', { command: 'ls' }, URGENT_T);
    const c = compact(d, '', 'auto', URGENT_T);
    const st = existsSync(stateOf(d)) ? spawnSync('ls', ['-A', stateOf(d)], { encoding: 'utf8' }).stdout.trim() : '';
    const snaps = spawnSync('ls', [path.join(realpathSync(d), '.git/agentic-workflow/snapshots')], { encoding: 'utf8' }).stdout;
    check('handoff markers: empty session_id → gate exits 0, PreCompact still snapshots (nosession-<epoch>), no marker written',
      g.code === 0 && c.code === 0 && st === '' && /^nosession-\d+\.md$/m.test(snaps) && !/unknown/.test(snaps), `state=${st} snaps=${snaps}`);
  });
  withDir((d) => { // unit drift: marker recorded in tokens, now the byte path → fail toward NOT blocking
    const s = hsid('unit');
    gate(d, s, 'Write', { file_path: canonOf(d) }, URGENT_T);
    putHandoff(d);
    const r = gate(d, s, 'Bash', { command: 'ls' }, 'x'.repeat(URGENT + 70_000));
    const m = compact(d, s, 'manual', 'x'.repeat(URGENT + 70_000));
    check('hl_fresh: marker unit (tokens) ≠ current unit (bytes) with the stamped file present → fresh: gate 0, manual /compact 0',
      r.code === 0 && m.code === 0, `${why(r)} | ${why(m)}`);
  });
  withDir((d) => { // fast path: a cached below-urgent band exits without spawning git
    const s = hsid('fast');
    const low = mkTranscript({ tokens: 1000 });
    gate(d, s, 'Bash', { command: 'ls' }, low);
    const trace = path.join(d, 'git-trace.log');
    const r = gate(d, s, 'Bash', { command: 'ls' }, low, { GIT_TRACE: trace });
    check('handoff gate: cached below-urgent band → exit 0 with zero git spawns (GIT_TRACE empty)',
      r.code === 0 && (!existsSync(trace) || readFileSync(trace, 'utf8').trim() === ''), existsSync(trace) ? readFileSync(trace, 'utf8').slice(0, 200) : '');
  });

  // ── child silence for the two new hooks (control proves the setup speaks) ──
  withDir((d) => {
    const CH = { AGENTIC_WORKFLOW_CHILD: '1' };
    const gc = gate(d, hsid('chg'), 'Bash', { command: 'ls' }, URGENT_T, CH);
    const gctl = gate(d, hsid('chg2'), 'Bash', { command: 'ls' }, URGENT_T);
    const pc = compact(d, hsid('chp'), 'manual', URGENT_T, { env: CH });
    const pctl = compact(d, hsid('chp2'), 'manual', URGENT_T);
    check('child silencer: handoff gate — AGENTIC_WORKFLOW_CHILD=1 → exit 0, no output (control exits 2)',
      gc.code === 0 && gc.stdout === '' && gc.stderr === '' && gctl.code === 2, `${why(gc)} | ${why(gctl)}`);
    check('child silencer: pre-compact — AGENTIC_WORKFLOW_CHILD=1 → exit 0, no output (control exits 2)',
      pc.code === 0 && pc.stdout === '' && pc.stderr === '' && pctl.code === 2, `${why(pc)} | ${why(pctl)}`);
  });

}

// ── Child silencer (tune-presets D4): inside a claude-p child spawned by
// tools/run-claude.mjs (AGENTIC_WORKFLOW_CHILD=1) the four UserPromptSubmit
// hooks and both beat-enforcers exit 0 silently. Each case first proves the
// same setup DOES print without the variable, so silence means the silencer.
{
  const CHILD = { AGENTIC_WORKFLOW_CHILD: '1' };
  const activeLedger = { 'pay.state.md': ['Estimate: 2 sessions', 'Sessions used: 1', '- [x] S1 — build', '- [ ] Checkpoint — phase 1 review', 'Next up: Checkpoint', ''].join('\n') };
  const branchCmd = `git init -q -b main >/dev/null 2>&1; ${hookCommand('UserPromptSubmit', 'feature branch')}`;
  const cases = [
    ['branch warning', { event: 'UserPromptSubmit', command: branchCmd, input: {} }],
    ['router', { event: 'UserPromptSubmit', desc: 'Router (D2)', input: { prompt: 'add a login feature' }, ledgers: activeLedger }],
    ['mission-budget', { event: 'UserPromptSubmit', desc: 'mission-budget (D3', input: {}, ledgers: activeLedger }],
    ['handoff-budget', { event: 'UserPromptSubmit', desc: BUDGET, transcript: { bytes: ADVISORY } }],
    ['beat-enforcer PreToolUse', { event: 'PreToolUse', desc: PRE, input: { tool_input: { command: 'git commit -m x' } }, ledgers: NOT_STARTED }],
    ['beat-enforcer Stop', { event: 'Stop', desc: STOP, input: { stop_hook_active: false }, ledgers: NOT_STARTED }],
    ['compact-resume', { event: 'SessionStart', desc: 'compact-resume directive', input: { source: 'compact' }, ledgers: NOT_STARTED }],
  ];
  for (const [name, spec] of cases) {
    const fresh = (tag) => (spec.transcript ? { ...spec, input: { session_id: sid(tag) } } : spec);
    const child = runHook({ ...fresh('child'), env: CHILD });
    const control = runHook(fresh('control'));
    check(`child silencer: ${name} — AGENTIC_WORKFLOW_CHILD=1 → stdout '' and exit 0 (control prints)`,
      child.code === 0 && child.stdout === '' && control.code === 0 && control.stdout.trim() !== '',
      `child=${JSON.stringify(child.stdout)} control=${JSON.stringify(control.stdout.slice(0, 80))}`);
  }
}

rmSync(HARNESS_STATE, { recursive: true, force: true });
if (failures.length) {
  console.error(`\nhook-test: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('hook-test: clean');
