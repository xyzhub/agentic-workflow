// Deterministic assertions for codex-routing.
//
// The mission continues at S1, which is marked `runtime: codex`. The
// orchestrator MUST route it to tools/run-codex.mjs (Bash, background), read
// the distillate FILE, and own the ledger + commit itself — never the Agent
// tool (Task). The fake codex ships at fixture/bin/codex and is reached only
// through CODEX_BIN, which evals/run.mjs exports for this scenario.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export default function checks({ dir, events }) {
  const failures = [];

  // Flatten every tool_use block, in order.
  const flat = [];
  for (const ev of events || [])
    for (const b of ev.message?.content ?? [])
      if (b.type === 'tool_use') flat.push(b);

  const isAdapter = (t) =>
    t.name === 'Bash' && /run-codex\.mjs/.test(t.input?.command || '');
  const adapterIdx = flat.findIndex(isAdapter);

  if (adapterIdx < 0) {
    failures.push('run-codex.mjs was never invoked — the codex brief was not routed to the adapter');
  } else {
    const cmd = flat[adapterIdx].input.command || '';
    for (const flag of ['--role', '--brief', '--out'])
      if (!cmd.includes(flag)) failures.push(`run-codex.mjs invoked without ${flag}`);

    // The Agent tool (Task) must not stand in for the adapter on this brief:
    // no Task before the adapter call (a post-build checkpoint reviewer is fine).
    if (flat.slice(0, adapterIdx).some((t) => t.name === 'Task'))
      failures.push('the Agent tool (Task) was used to execute the codex brief instead of the adapter');

    // The distillate FILE named by --out must exist.
    const m = cmd.match(/--out\s+("[^"]+"|'[^']+'|\S+)/);
    if (!m) {
      failures.push('could not find --out in the run-codex.mjs invocation');
    } else {
      const raw = m[1].replace(/^['"]|['"]$/g, '');
      const outPath = path.isAbsolute(raw) ? raw : path.join(dir, raw);
      if (!existsSync(outPath)) failures.push(`distillate --out file not found at ${raw}`);
    }
  }

  // The ledger advanced: S1 marked [x], Sessions used past 0.
  const state = path.join(dir, '.plans', 'widget-tags.state.md');
  if (!existsSync(state)) {
    failures.push('.plans/widget-tags.state.md is missing');
  } else {
    const led = readFileSync(state, 'utf8');
    const used = led.match(/^Sessions used:\s*(\d+)/m);
    if (!used || Number(used[1]) < 1) failures.push('Sessions used: did not advance past 0');
    if (!/^- \[x\][^\n]*\bS1\b/mi.test(led)) failures.push('the S1 ledger row was not marked [x]');
  }

  return failures;
}
