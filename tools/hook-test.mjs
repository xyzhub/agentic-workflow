#!/usr/bin/env node
// Tier-1.5 behavioral test for the agentic-workflow hooks. Zero deps; Node >= 18.
// Structural lint (tools/lint.mjs) proves the hook commands *parse*; this proves
// they *behave* — it pipes fixture stdin through each hooks.json command in a
// throwaway cwd and asserts exit code + emitted nudge. The 2026-07 beat-enforcer
// Stop-hook loop shipped green through lint because lint can't dispatch a hook;
// this harness closes that gap. Run: node tools/hook-test.mjs  (0 = pass, 1 = fail)

import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOOKS = path.join(ROOT, 'plugins/agentic-workflow/hooks/hooks.json');

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
// holding .plans ledgers ({ 'name.state.md': 'content', ... }).
function runHook({ event, desc, input = {}, ledgers }) {
  const dir = mkdtempSync(path.join(tmpdir(), 'hooktest-'));
  try {
    if (ledgers) {
      mkdirSync(path.join(dir, '.plans'));
      for (const [name, content] of Object.entries(ledgers))
        writeFileSync(path.join(dir, '.plans', name), content);
    }
    const r = spawnSync('bash', ['-c', hookCommand(event, desc)], {
      cwd: dir, input: JSON.stringify(input), encoding: 'utf8',
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

const BEAT_ENFORCER_STOP = 'beat-enforcer backstop';

// A checkpoint that has already been reviewed (APPROVED) and is only waiting on a
// human merge — the recurring 2026-07 false-positive. The review is done; the
// beat is a human gate, not a forgotten agent spawn, so it must NOT nudge.
const APPROVED_MERGE_PENDING = [
  '## Checklist',
  '- [x] S1 — shape memo',
  '- [~] Checkpoint — phase 1 review **APPROVED** + shape locked; **merge pending human**',
  '',
].join('\n');

// RED: approved / merge-pending checkpoint → the beat-enforcer stays silent.
{
  const r = runHook({
    event: 'Stop', desc: BEAT_ENFORCER_STOP,
    input: { stop_hook_active: false },
    ledgers: { 'm.state.md': APPROVED_MERGE_PENDING },
  });
  check('Stop: approved/merge-pending checkpoint → silent',
    r.code === 0 && !nudged(r),
    `code=${r.code} stdout=${JSON.stringify(r.stdout)}`);
}

// A genuinely-unreviewed checkpoint — the beat-enforcer SHOULD still nudge here,
// proving the exclusion filter didn't neuter the hook.
const PENDING_REVIEW = [
  '## Checklist',
  '- [x] S1 — build the thing',
  '- [ ] Checkpoint — phase 2 review',
  '',
].join('\n');

// Control: a real unreviewed checkpoint still nudges at turn-end.
{
  const r = runHook({
    event: 'Stop', desc: BEAT_ENFORCER_STOP,
    input: { stop_hook_active: false },
    ledgers: { 'm.state.md': PENDING_REVIEW },
  });
  check('Stop: genuinely-pending review → nudges', r.code === 0 && nudged(r),
    `code=${r.code} stdout=${JSON.stringify(r.stdout)}`);
}

// Regression: the re-fire guard — a Stop re-fire (stop_hook_active) stays silent
// even with a pending beat. This is the 2026-07 infinite-loop guard (v1.39.1).
{
  const r = runHook({
    event: 'Stop', desc: BEAT_ENFORCER_STOP,
    input: { stop_hook_active: true },
    ledgers: { 'm.state.md': PENDING_REVIEW },
  });
  check('Stop: re-fire (stop_hook_active) → silent', r.code === 0 && !nudged(r),
    `code=${r.code} stdout=${JSON.stringify(r.stdout)}`);
}

// Regression: no .plans/ at all → silent (nothing to enforce).
{
  const r = runHook({ event: 'Stop', desc: BEAT_ENFORCER_STOP, input: { stop_hook_active: false } });
  check('Stop: no .plans/ → silent', r.code === 0 && !nudged(r),
    `code=${r.code} stdout=${JSON.stringify(r.stdout)}`);
}

// The PreToolUse beat-enforcer (fires on the closing action: commit / PR create|
// merge) carries the identical bug and must get the identical exclusion.
const BEAT_ENFORCER_PRE = 'beat-enforcer (D4, PreToolUse';
const commit = { tool_input: { command: 'git commit -m "wip"' } };

// RED: approved/merge-pending checkpoint → PreToolUse enforcer stays silent.
{
  const r = runHook({
    event: 'PreToolUse', desc: BEAT_ENFORCER_PRE, input: commit,
    ledgers: { 'm.state.md': APPROVED_MERGE_PENDING },
  });
  check('PreToolUse: approved/merge-pending checkpoint → silent',
    r.code === 0 && !nudged(r),
    `code=${r.code} stdout=${JSON.stringify(r.stdout)}`);
}

// Control: a real unreviewed checkpoint still nudges at the closing action.
{
  const r = runHook({
    event: 'PreToolUse', desc: BEAT_ENFORCER_PRE, input: commit,
    ledgers: { 'm.state.md': PENDING_REVIEW },
  });
  check('PreToolUse: genuinely-pending review → nudges', r.code === 0 && nudged(r),
    `code=${r.code} stdout=${JSON.stringify(r.stdout)}`);
}

// Regression: a non-closing command (not commit/PR) never nudges, pending or not.
{
  const r = runHook({
    event: 'PreToolUse', desc: BEAT_ENFORCER_PRE,
    input: { tool_input: { command: 'ls -la' } },
    ledgers: { 'm.state.md': PENDING_REVIEW },
  });
  check('PreToolUse: non-closing command → silent', r.code === 0 && !nudged(r),
    `code=${r.code} stdout=${JSON.stringify(r.stdout)}`);
}

if (failures.length) {
  console.error(`\nhook-test: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('hook-test: clean');
