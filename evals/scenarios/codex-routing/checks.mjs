// Deterministic assertions for codex-routing.
//
// The mission continues at S1, which is marked `runtime: codex`. The
// orchestrator MUST route it to tools/run-codex.mjs (Bash, background), read
// the distillate FILE, and own the ledger + commit itself — never the Agent
// tool (Task). The fake codex ships at fixture/bin/codex and is reached only
// through CODEX_BIN, which evals/run.mjs exports for this scenario.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

// Discover a codex distillate anywhere under the fixture: any *.json that parses
// with `status === "done"` and `runtime.name === "codex"` (the shape the
// adapter writes via --out, per mission.md §2). Deterministic — returns true if
// ANY such file exists, independent of walk order. The fixture brief steers the
// orchestrator to write it under `.plans/runs/`, but this finds it wherever in
// the repo it landed. Skips .git/node_modules for bound and speed.
function hasCodexDistillate(root) {
  const stack = [root];
  while (stack.length) {
    const d = stack.pop();
    let entries;
    try { entries = readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        if (e.name === '.git' || e.name === 'node_modules') continue;
        stack.push(p);
      } else if (e.name.endsWith('.json')) {
        try {
          const j = JSON.parse(readFileSync(p, 'utf8'));
          if (j && j.status === 'done' && j.runtime && j.runtime.name === 'codex') return true;
        } catch { /* not a distillate — ignore */ }
      }
    }
  }
  return false;
}

export default function checks({ dir, events }) {
  const failures = [];

  // Flatten every tool_use block, in order.
  const flat = [];
  for (const ev of events || [])
    for (const b of ev.message?.content ?? [])
      if (b.type === 'tool_use') flat.push(b);

  // The adapter run is the first run-codex.mjs invocation that CARRIES `--role`
  // — the real spawn. A bare `run-codex.mjs --help` probe (no --role) is not the
  // spawn and must not be mistaken for it.
  const isAdapter = (t) =>
    t.name === 'Bash' && /run-codex\.mjs/.test(t.input?.command || '')
    && /(^|\s)--role(\s|=)/.test(t.input?.command || '');
  const adapterIdx = flat.findIndex(isAdapter);

  if (adapterIdx < 0) {
    failures.push('run-codex.mjs was never invoked with --role — the codex brief was not routed to the adapter');
  } else {
    const cmd = flat[adapterIdx].input.command || '';
    for (const flag of ['--role', '--brief', '--out'])
      if (!cmd.includes(flag)) failures.push(`run-codex.mjs invoked without ${flag}`);

    // The Agent tool (Task) must not stand in for the adapter on this brief:
    // no Task before the adapter call (a post-build checkpoint reviewer is fine).
    if (flat.slice(0, adapterIdx).some((t) => t.name === 'Task'))
      failures.push('the Agent tool (Task) was used to execute the codex brief instead of the adapter');

    // …nor AFTER it: a Task whose subagent_type is the brief's own role is a
    // Claude re-run of the same codex brief, which defeats the routing. A
    // post-build reviewer (a DIFFERENT subagent_type) stays allowed.
    const role = (cmd.match(/(?:^|\s)--role(?:\s+|=)("[^"]+"|'[^']+'|\S+)/) || [])[1]?.replace(/^['"]|['"]$/g, '');
    if (role && flat.slice(adapterIdx + 1).some((t) => t.name === 'Task' && t.input?.subagent_type === role))
      failures.push(`a Task with subagent_type "${role}" ran after the adapter — the codex brief was re-run on Claude`);

    // The distillate FILE the adapter wrote must exist. Resolve robustly: the
    // recorded command string cannot expand a shell variable (`--out "$OUT"`),
    // so a token that is a variable/glob — or a literal path that does not
    // resolve to a file — falls back to DISCOVERING the codex distillate by its
    // shape anywhere under the fixture. The check never depends on the literal
    // --out token being a usable path.
    const m = cmd.match(/--out\s+("[^"]+"|'[^']+'|\S+)/);
    if (!m) {
      failures.push('could not find --out in the run-codex.mjs invocation');
    } else {
      const raw = m[1].replace(/^['"]|['"]$/g, '');
      const isLiteralPath = !/[$`~*?{}]/.test(raw); // not a shell var / glob
      const outPath = path.isAbsolute(raw) ? raw : path.join(dir, raw);
      const foundLiteral = isLiteralPath && existsSync(outPath);
      if (!foundLiteral && !hasCodexDistillate(dir))
        failures.push(`no codex distillate found — the --out token "${raw}" did not resolve to a file and no *.json under the fixture parses with status === "done" + runtime.name === "codex"`);
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
