#!/usr/bin/env node
// Tier-2 scenario evals for the agentic-workflow plugin.
// Runs each scenario's prompt through headless `claude -p` in a throwaway
// fixture repo with the plugin loaded, applies the scenario's deterministic
// checks first, then has an LLM judge score the transcript against the rubric.
//
//   node evals/run.mjs [scenario ...]        # default: all scenarios
//
// Env: EVAL_MODEL (agent model override), EVAL_JUDGE_MODEL (default: sonnet),
//      EVAL_BUDGET_USD (per-scenario cap, overrides scenario.md).
// Zero dependencies; Node >= 18. Costs real tokens — pre-release smoke, not CI.

import { readFileSync, readdirSync, writeFileSync, mkdirSync, cpSync, existsSync, rmSync } from 'node:fs';
import { spawnSync, execSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const EVALS = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(EVALS, '..');
const PLUGIN = path.join(ROOT, 'plugins/agentic-workflow');
const SCENARIOS_DIR = path.join(EVALS, 'scenarios');
const JUDGE_PROMPT = readFileSync(path.join(EVALS, 'judge.md'), 'utf8');
const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL || 'sonnet';
const TIMEOUT_MS = 20 * 60 * 1000;

const requested = process.argv.slice(2);
const scenarios = (requested.length ? requested : readdirSync(SCENARIOS_DIR).sort())
  .filter((s) => existsSync(path.join(SCENARIOS_DIR, s, 'scenario.md')));
if (!scenarios.length) {
  console.error('no scenarios found' + (requested.length ? ` matching: ${requested.join(', ')}` : ''));
  process.exit(1);
}

// scenario.md = flat `key: value` frontmatter + the prompt as body.
function parseScenario(dir) {
  const text = readFileSync(path.join(dir, 'scenario.md'), 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const meta = {};
  for (const line of (m ? m[1] : '').split('\n')) {
    const kv = line.match(/^([a-z-]+):\s*(.*)$/);
    if (kv) meta[kv[1]] = kv[2].trim();
  }
  return { meta, prompt: (m ? m[2] : text).trim() };
}

function runClaude(args, opts) {
  const res = spawnSync('claude', args, { encoding: 'utf8', timeout: TIMEOUT_MS, maxBuffer: 64 * 1024 * 1024, ...opts });
  if (res.error) throw res.error;
  return res;
}

// Condense stream-json events into a judge-readable transcript.
function condense(events) {
  const lines = [];
  const clip = (s, n) => (s = String(s ?? ''), s.length > n ? s.slice(0, n) + ' …[truncated]' : s);
  for (const ev of events) {
    for (const block of ev.message?.content ?? []) {
      if (block.type === 'text') lines.push(`${ev.type.toUpperCase()}: ${clip(block.text, 1500)}`);
      else if (block.type === 'tool_use') lines.push(`TOOL ${block.name}: ${clip(JSON.stringify(block.input), 400)}`);
      else if (block.type === 'tool_result') {
        const body = typeof block.content === 'string' ? block.content : JSON.stringify(block.content);
        lines.push(`RESULT${block.is_error ? ' (error)' : ''}: ${clip(body, 600)}`);
      }
    }
    if (ev.type === 'result') lines.push(`FINAL: ${clip(ev.result, 3000)}`);
  }
  let out = lines.join('\n');
  if (out.length > 60000) out = out.slice(0, 30000) + '\n…[middle truncated]…\n' + out.slice(-30000);
  return out;
}

// `- [w=N] id: criterion` lines in rubric.md carry the weights.
const parseWeights = (rubric) =>
  [...rubric.matchAll(/^- \[w=(\d+)\] ([a-z0-9-]+): /gm)].map((m) => ({ id: m[2], weight: Number(m[1]) }));

function judge(rubric, transcript, artifacts) {
  const input = `${JUDGE_PROMPT}\n\n## Rubric\n${rubric}\n\n## Transcript\n${transcript}\n\n## Artifacts\n${artifacts || '(none)'}`;
  const res = runClaude(['-p', '--output-format', 'json', '--model', JUDGE_MODEL], { input, cwd: EVALS });
  const result = JSON.parse(res.stdout).result ?? '';
  const json = result.slice(result.indexOf('{'), result.lastIndexOf('}') + 1);
  return JSON.parse(json); // {criteria: [{id, score, evidence}]}
}

const runId = new Date().toISOString().replace(/[:.]/g, '-');
const resultsDir = path.join(EVALS, 'results', runId);
mkdirSync(resultsDir, { recursive: true });

const summary = [];
for (const name of scenarios) {
  const scenarioDir = path.join(SCENARIOS_DIR, name);
  const { meta, prompt } = parseScenario(scenarioDir);
  const passBar = Number(meta['pass-bar'] ?? 0.8);
  const budget = process.env.EVAL_BUDGET_USD || meta['budget-usd'] || '5';
  console.log(`\n▶ ${name} (budget $${budget}, pass bar ${passBar})`);

  // Fixture → throwaway git repo (hooks need real git state).
  const work = mkdtempSync(path.join(tmpdir(), `eval-${name}-`));
  const dir = path.join(work, 'repo');
  mkdirSync(dir);
  if (existsSync(path.join(scenarioDir, 'fixture'))) cpSync(path.join(scenarioDir, 'fixture'), dir, { recursive: true });
  const sh = (cmd, cwd = dir) => execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  sh('git init -q -b main && git config user.email eval@local && git config user.name eval');
  sh('git add -A && git commit -qm "fixture baseline" --no-verify');
  if (existsSync(path.join(scenarioDir, 'setup.sh'))) sh(`bash "${path.join(scenarioDir, 'setup.sh')}"`);

  // The agent run.
  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose',
    '--plugin-dir', PLUGIN, '--dangerously-skip-permissions', '--max-budget-usd', budget,
    '--model', process.env.EVAL_MODEL || 'sonnet'];
  const res = runClaude(args, { cwd: dir });
  const events = res.stdout.split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } });
  const final = events.find((e) => e.type === 'result') ?? {};
  const resultText = final.result ?? '';
  const cost = final.total_cost_usd ?? 0;
  const u = final.usage ?? {};
  const tokens = {
    input: u.input_tokens ?? 0,
    output: u.output_tokens ?? 0,
    cacheWrite: u.cache_creation_input_tokens ?? 0,
    cacheRead: u.cache_read_input_tokens ?? 0,
  };

  // 1) Deterministic checks (cheap, authoritative).
  let failures = [];
  const checksPath = path.join(scenarioDir, 'checks.mjs');
  if (existsSync(checksPath)) {
    const { default: checks } = await import(checksPath);
    try { failures = await checks({ dir, events, resultText, sh }); }
    catch (e) { failures = [`checks.mjs threw: ${e.message}`]; }
  }

  // 2) LLM judge against the rubric.
  const rubric = readFileSync(path.join(scenarioDir, 'rubric.md'), 'utf8');
  const weights = parseWeights(rubric);
  let score = null, criteria = [], judgeError = null;
  if (weights.length) {
    const artifacts = (meta['judge-files'] ?? '').split(',').map((f) => f.trim()).filter(Boolean)
      .map((f) => existsSync(path.join(dir, f))
        ? `### ${f}\n${readFileSync(path.join(dir, f), 'utf8').slice(0, 8000)}`
        : `### ${f}\n(missing)`)
      .join('\n\n');
    try {
      ({ criteria } = judge(rubric, condense(events), artifacts));
      const total = weights.reduce((s, w) => s + w.weight, 0);
      score = weights.reduce((s, w) => s + w.weight * (criteria.find((c) => c.id === w.id)?.score ?? 0), 0) / total;
    } catch (e) { judgeError = e.message; }
  }

  const passed = !failures.length && !judgeError && (score === null || score >= passBar);
  summary.push({ name, passed, failures, score, judgeError, cost });
  writeFileSync(path.join(resultsDir, `${name}.json`), JSON.stringify(
    { name, passed, failures, score, passBar, criteria, judgeError, cost, tokens, dir, transcript: condense(events) }, null, 2));
  const tokSummary = `${((tokens.input + tokens.cacheWrite + tokens.cacheRead) / 1000).toFixed(0)}k in (${(tokens.cacheRead / 1000).toFixed(0)}k cached) / ${(tokens.output / 1000).toFixed(1)}k out`;
  console.log(`  ${passed ? '✅ pass' : '❌ FAIL'}${score !== null ? ` — judge ${(score * 100).toFixed(0)}%` : ''} — $${cost.toFixed(2)} — ${tokSummary}`);
  for (const f of failures) console.log(`    ✗ ${f}`);
  if (judgeError) console.log(`    ✗ judge error: ${judgeError}`);
  if (passed) rmSync(work, { recursive: true, force: true });
  else console.log(`    fixture kept at ${dir}`);
}

const failed = summary.filter((s) => !s.passed);
const totalCost = summary.reduce((s, x) => s + x.cost, 0);
console.log(`\n${summary.length - failed.length}/${summary.length} scenarios passed — total $${totalCost.toFixed(2)}`);
console.log(`results: ${path.relative(process.cwd(), resultsDir)}`);
process.exit(failed.length ? 1 : 0);
