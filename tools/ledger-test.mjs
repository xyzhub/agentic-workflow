#!/usr/bin/env node
// Behavior harness for plugins/agentic-workflow/tools/ledger.mjs (#132). Zero
// deps; Node >= 18. Each verb runs through the real CLI against a fixture
// ledger + register in a throwaway dir and the file is asserted afterwards —
// including the refusals, which must leave the file byte-identical. Run:
// node tools/ledger-test.mjs (0 = pass, 1 = fail). lint.mjs delegates here.
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PLUGIN = path.join(ROOT, 'plugins/agentic-workflow');
const TOOL = path.join(PLUGIN, 'tools/ledger.mjs');
const mod = await import(TOOL);

let passed = 0;
const fails = [];
const ok = (name, cond, detail) => {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { fails.push(name); console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
};

const LEDGER = `---
status: living
---

# Mission: demo — ledger

Estimate: 2 sessions
Sessions used: 1

## Checklist

- [x] S1 — build (branch \`mission/demo-p1\`)
- [~] Checkpoint p1 — reviewer
- [ ] S2 — build
- [ ] Checkpoint p2 — reviewer

## Closing

_OB grammar: \`- [ ] OB-<n> · added YYYY-MM-DD …\`. \`Closed:\` is written only once every row is \`[x]\`._

- [ ] version bumped + stamped · added 2026-10-11 (planner, pre-merge) — do: bump plugin.json — when: the diff carries it — probe: \`grep -c version plugin.json\`
- [ ] branch + worktree cleanup · added 2026-10-11 (planner, post-merge) — do: delete the
  phase branches — when: the PRs are merged and CI is green — probe: \`gh pr list --state merged\`
- [ ] live-verify after reinstall · added 2026-10-11 (planner, post-merge) — do: confirm the behavior fires live — when: the release is installed — probe: manual

## Deviations

(none)

## Handoff log (newest first)

_≤10 lines per entry. Newest on top._

- 2026-10-10 planner: trio authored.

Next up: S2
`;
const REGISTER = `# Obligations register

_Grammar: \`- [ ] OB-<n> · added YYYY-MM-DD (<source>) — do: … — when: … — probe: …\`_

- [ ] OB-1 · added 2026-08-11 (x) — do: a — when: b — probe: manual
- [x] OB-2 · added 2026-08-11 (y) — do: a — when: b — probe: manual · fired 2026-09-01 (done)
`;

function fresh() {
  const dir = mkdtempSync(path.join(tmpdir(), 'ledger-test-'));
  mkdirSync(path.join(dir, '.plans'));
  writeFileSync(path.join(dir, '.plans/demo.state.md'), LEDGER);
  writeFileSync(path.join(dir, '.plans/OBLIGATIONS.md'), REGISTER);
  return dir;
}
const run = (dir, ...args) => {
  const r = spawnSync('node', [TOOL, 'demo', ...args, '--date', '2026-10-11'], { cwd: dir, encoding: 'utf8' });
  const regPath = path.join(dir, '.plans/OBLIGATIONS.md');
  return { code: r.status, out: (r.stdout + r.stderr).trim(), ledger: readFileSync(path.join(dir, '.plans/demo.state.md'), 'utf8'), reg: existsSync(regPath) ? readFileSync(regPath, 'utf8') : '' };
};
const otherLinesUnchanged = (before, after, skipRe) => {
  const a = before.split('\n').filter((l) => !skipRe.test(l));
  const b = after.split('\n').filter((l) => !skipRe.test(l));
  return a.join('\n') === b.join('\n');
};

console.log('mark');
{
  const d = fresh();
  const r = run(d, 'mark', 'S2 — build', '[~]');
  ok('mark flips [ ] → [~] on the one matching row', r.code === 0 && /^- \[~\] S2 — build$/m.test(r.ledger) && /ledger: \[~\] S2/.test(r.out), r.out);
  ok('mark leaves every other line untouched', otherLinesUnchanged(LEDGER, r.ledger, /^- \[.\] S2 — build/));
  const amb = run(d, 'mark', 'Checkpoint', '[x]');
  ok('mark refuses an ambiguous prefix (exit 2) and names the candidates', amb.code === 2 && /2 rows start with/.test(amb.out) && /Checkpoint p1/.test(amb.out) && /Checkpoint p2/.test(amb.out), amb.out);
  ok('a refusal leaves the file byte-identical', amb.ledger === r.ledger);
  const none = run(d, 'mark', 'S9', '[x]');
  ok('mark refuses an unknown prefix (exit 2)', none.code === 2 && /no row starts with "S9"/.test(none.out), none.out);
  const bad = run(d, 'mark', 'S2', '[?]');
  ok('mark rejects a bad glyph as usage (exit 1)', bad.code === 1 && /glyph must be/.test(bad.out), bad.out);
  rmSync(d, { recursive: true, force: true });
}

console.log('fire');
{
  const d = fresh();
  const r = run(d, 'fire', 'version bumped', 'plugin.json 1.59.0 at abc1234');
  ok('fire ticks [x] and appends `· fired <date> (<evidence>)`',
    r.code === 0 && /^- \[x\] version bumped \+ stamped · added .* — probe: `grep -c version plugin.json` · fired 2026-10-11 \(plugin\.json 1\.59\.0 at abc1234\)$/m.test(r.ledger), r.ledger.split('\n').find((l) => /version bumped/.test(l)));
  ok('the fired row still parses under the Closing grammar', mod.OB_ROW.test(r.ledger.split('\n').find((l) => /^- \[x\] version bumped/.test(l))));
  const again = run(d, 'fire', 'version bumped', 'twice');
  ok('fire refuses a second fire (exit 2)', again.code === 2 && /already fired/.test(again.out) && again.ledger === r.ledger, again.out);
  const wrapped = run(d, 'fire', 'branch + worktree', 'PR #1 merged, CI green');
  ok('fire folds a wrapped row into one line and fires it', wrapped.code === 0 && /^- \[x\] branch \+ worktree cleanup · added 2026-10-11 \(planner, post-merge\) — do: delete the phase branches — when: .* · fired 2026-10-11 \(PR #1 merged, CI green\)$/m.test(wrapped.ledger), wrapped.out);
  const outside = run(d, 'fire', 'S2 — build', 'x');
  ok('fire looks inside `## Closing` only (a checklist row is refused)', outside.code === 2 && /no row starts with "S2 — build" in that section/.test(outside.out), outside.out);
  const noEv = run(d, 'fire', 'live-verify');
  ok('fire without evidence is a usage error (exit 1)', noEv.code === 1 && /evidence/.test(noEv.out), noEv.out);
  rmSync(d, { recursive: true, force: true });
}

console.log('promote');
{
  const d = fresh();
  const r = run(d, 'promote', 'live-verify after reinstall');
  const regRow = r.reg.split('\n').find((l) => /^- \[ \] OB-3 /.test(l)) || '';
  ok('promote flips the ledger row to [~] … → OB-3 (next unused integer after OB-2)', r.code === 0 && /^- \[~\] live-verify after reinstall · added .* — probe: manual → OB-3$/m.test(r.ledger), r.out);
  ok('promote appends the verbatim copy to the register as OB-3',
    regRow === '- [ ] OB-3 · added 2026-10-11 (promoted from `.plans/demo.state.md` `## Closing` row "live-verify after reinstall", planner, 2026-10-11) — do: confirm the behavior fires live — when: the release is installed — probe: manual', regRow);
  ok('the register row parses under the strict OB-<n> grammar', mod.OB_ROW.test(regRow) && /^OB-\d+$/.test(regRow.match(mod.OB_ROW)[2]));
  ok('the register row lands after the last existing row', r.reg.indexOf('OB-3') > r.reg.indexOf('OB-2'));
  const again = run(d, 'promote', 'live-verify');
  ok('promote refuses a second promotion (exit 2), files untouched', again.code === 2 && /already promoted/.test(again.out) && again.ledger === r.ledger && again.reg === r.reg, again.out);
  run(d, 'fire', 'version bumped', 'ok');
  const fired = run(d, 'promote', 'version bumped');
  ok('promote refuses a fired [x] row', fired.code === 2 && /fired \[x\] row is not promoted/.test(fired.out), fired.out);
  rmSync(path.join(d, '.plans/OBLIGATIONS.md'));
  const noReg = run(d, 'promote', 'branch + worktree');
  ok('promote without a register refuses and says where to copy the template from', noReg.code === 2 && /templates\/obligations\.md/.test(noReg.out), noReg.out);
  rmSync(d, { recursive: true, force: true });
}

console.log('handoff / next-up / sessions');
{
  const d = fresh();
  const r = run(d, 'handoff', 'orchestrator: S2 spawned on `mission/demo-p2`; `Sessions used: 2/2`.');
  const lines = r.ledger.split('\n');
  const i = lines.indexOf('- 2026-10-11 orchestrator: S2 spawned on `mission/demo-p2`; `Sessions used: 2/2`.');
  ok('handoff prepends a dated entry above the previous newest entry, blank-line separated',
    r.code === 0 && i > 0 && lines[i - 1] === '' && lines[i + 1] === '' && lines[i + 2] === '- 2026-10-10 planner: trio authored.', r.out);
  ok('handoff touches nothing else', otherLinesUnchanged(LEDGER, r.ledger, /^- 2026-10-11 orchestrator/) === false
    && otherLinesUnchanged(LEDGER, r.ledger.replace('- 2026-10-11 orchestrator: S2 spawned on `mission/demo-p2`; `Sessions used: 2/2`.\n\n', ''), /$^/));
  const n = run(d, 'next-up', 'Checkpoint p2');
  ok('next-up rewrites the single `Next up:` line', n.code === 0 && /^Next up: Checkpoint p2$/m.test(n.ledger) && n.ledger.split('\n').filter((l) => /^Next up:/.test(l)).length === 1, n.out);
  writeFileSync(path.join(d, '.plans/demo.state.md'), n.ledger + 'Next up: stale\n');
  const dup = run(d, 'next-up', 'x');
  ok('next-up refuses when two `Next up:` lines exist (LA-7)', dup.code === 2 && /2 `Next up:` lines/.test(dup.out), dup.out);
  writeFileSync(path.join(d, '.plans/demo.state.md'), n.ledger);
  const s = run(d, 'sessions', '+1');
  ok('sessions +1 increments the budget line and echoes the estimate', s.code === 0 && /^Sessions used: 2$/m.test(s.ledger) && /Sessions used: 2 \(Estimate 2 sessions\)/.test(s.out), s.out);
  const s2 = run(d, 'sessions', '=5');
  ok('sessions =N sets it', s2.code === 0 && /^Sessions used: 5$/m.test(s2.ledger), s2.out);
  const s3 = run(d, 'sessions', '5');
  ok('sessions without +/= is a usage error', s3.code === 1, s3.out);
  // a ledger with no handoff entries yet: the entry goes above `Next up:`
  writeFileSync(path.join(d, '.plans/demo.state.md'), LEDGER.replace('- 2026-10-10 planner: trio authored.\n\n', ''));
  const h0 = run(d, 'handoff', 'first entry');
  const l0 = h0.ledger.split('\n');
  ok('handoff with no entries yet lands above `Next up:`', h0.code === 0 && l0[l0.indexOf('- 2026-10-11 first entry') + 2] === 'Next up: S2', h0.out);
  rmSync(d, { recursive: true, force: true });
}

console.log('close');
{
  const d = fresh();
  const r0 = run(d, 'close');
  ok('close refuses while [ ] rows remain, naming each (exit 2)', r0.code === 2 && /REFUSED: 3 obligation\(s\) still open/.test(r0.out) && /live-verify/.test(r0.out) && r0.ledger === LEDGER, r0.out);
  run(d, 'fire', 'version bumped', 'ok');
  run(d, 'fire', 'branch + worktree', 'ok');
  run(d, 'mark', 'live-verify', '[~]');
  const r1 = run(d, 'close');
  ok('close refuses a [~] row lacking `→ OB-<n>`', r1.code === 2 && /1 obligation\(s\) still open/.test(r1.out), r1.out);
  run(d, 'mark', 'live-verify', '[ ]');
  run(d, 'promote', 'live-verify');
  const r2 = run(d, 'close');
  const lines = r2.ledger.split('\n');
  const stamp = lines.indexOf('Closed: 2026-10-11');
  ok('close stamps `Closed: <date>` at the end of the block, before `## Deviations`',
    r2.code === 0 && stamp > 0 && lines[stamp - 1] === '' && lines[stamp - 2].startsWith('- [~] live-verify') && lines[stamp + 1] === '' && lines[stamp + 2] === '## Deviations', r2.out);
  const r3 = run(d, 'close');
  ok('close refuses a second stamp', r3.code === 2 && /already stamped/.test(r3.out) && r3.ledger === r2.ledger, r3.out);
  rmSync(d, { recursive: true, force: true });
}

console.log('--commit');
{
  const d = fresh();
  const git = (...a) => spawnSync('git', a, { cwd: d, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } });
  git('init', '-q'); git('add', '-A'); git('commit', '-q', '-m', 'fixture');
  const r = spawnSync('node', [TOOL, 'demo', 'promote', 'live-verify', '--date', '2026-10-11', '--commit', '--no-push'], { cwd: d, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' } });
  const log = git('log', '-1', '--format=%s').stdout.trim();
  const status = git('status', '--porcelain').stdout.trim();
  ok('--commit stages the ledger AND the register and commits a conventional message', r.status === 0 && /committed [0-9a-f]{7}/.test(r.stdout) && /^plan\(demo\): promote — \[~\] live-verify/.test(log) && status === '', `${r.stdout}${r.stderr} log=${log} status=${status}`);
  ok('--no-push skips the push (no remote exists, and the run still succeeded)', r.status === 0 && !/pushed/.test(r.stdout));
  rmSync(d, { recursive: true, force: true });
}

console.log('usage');
{
  const d = fresh();
  const u = spawnSync('node', [TOOL], { cwd: d, encoding: 'utf8' });
  const v = spawnSync('node', [TOOL, 'demo', 'dance'], { cwd: d, encoding: 'utf8' });
  const h = spawnSync('node', [TOOL, '--help'], { cwd: d, encoding: 'utf8' });
  ok('no args → usage, exit 1', u.status === 1 && /usage:/.test(u.stderr));
  ok('unknown verb → usage naming the verbs, exit 1', v.status === 1 && /unknown verb "dance"/.test(v.stderr) && /mark, fire, promote/.test(v.stderr));
  ok('--help prints the verb table, exit 0', h.status === 0 && /mark "<row-prefix>"/.test(h.stdout));
  ok('the template ledger exposes every section the verbs need', (() => {
    const t = readFileSync(path.join(PLUGIN, 'templates/mission-state.md'), 'utf8').split('\n');
    return ['Checklist', 'Closing', 'Handoff log'].every((s) => mod.section(t, s)) && t.some((l) => /^Next up:/.test(l)) && t.some((l) => /^Sessions used: \d+/.test(l));
  })());
  rmSync(d, { recursive: true, force: true });
}

console.log('');
if (fails.length) {
  console.error(`ledger harness: ${fails.length} failure(s), ${passed} passed`);
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(`ledger harness: clean — ${passed} case(s)`);
