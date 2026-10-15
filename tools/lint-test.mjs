#!/usr/bin/env node
// Behavior harness for lint.mjs's owner-locked L3 clock guard.
//
// WHY THIS EXISTS: the guard shipped in `be2f994`/`cc38924` was verified only
// against cases its author had in mind while writing it. a five-lens review estimated it 13/20 wrong on its own 20-case probe; measured
// against the 44-case corpus built from those lenses' counterexamples it was
// 25/44 wrong — 10 real clocks missed, 15 honest conditions blocked. The structural checks in lint.mjs prove a row PARSES;
// nothing proved the guard DECIDES correctly. This is that proof, in the shape
// `checkHookBehavior` already established for hooks.
//
// MOST cases are sourced from outside the implementer's head — a reviewer's
// counterexample (`regex lens`, `regression lens`, `council`, `re-review`), the
// pre-existing anti-overreach comment (`pre-existing`), a real `when:` value in
// this repo (`real row`), or an adversarial sweep run against a shipped version
// (`adversarial sweep`, `old-vs-new diff`). The few the implementer invented are
// marked `(self)`/`orchestrator` and are a minority on purpose: they are the
// ones least likely to catch the next mistake. The `source` column is the
// provenance claim — keep it honest when adding cases.
import path from 'node:path';
import { readFileSync, readdirSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { clockLeak, budgetVerdict, descriptionOver, ruleRestatement, RULES, tunePresetFindings, classListRestatement } from './lint.mjs';
import { spawnSync } from 'node:child_process';

// must: 'block' — a clock in some costume; the L3 rule rejects it.
//       'pass'  — an observable state a probe can check.
export const CASES = [
  // ── bare words (pre-existing behavior, must not regress) ──────────────
  ['block', 'weekly',                                              'pre-existing'],
  ['block', 'someday',                                             'pre-existing'],
  ['block', 'next sprint',                                         'pre-existing'],
  // ── suffix smuggling: the hole be2f994 set out to close ───────────────
  ['block', 'weekly, once ci is green',                            'orchestrator'],
  ['block', 'once ci is green, weekly',                            'orchestrator'],
  // ── trailing-clause evasion: the half-closed gap (regex lens) ─────────
  ['block', 'once ci is green, every 10 minutes',                  'regex lens'],
  ['block', 'once ci is green, every day',                         'regex lens'],
  ['block', 'once ci is green, after 2 weeks',                     'regex lens'],
  ['block', 'every 10 minutes, once ci is green',                  'regex lens'],
  // ── elapsed deadlines the shipped `after` branch MISSED (regex lens) ──
  ['block', 'after two weeks',                                     'regex lens F8'],
  ['block', 'after three days',                                    'regex lens F8'],
  ['block', 'after a few days',                                    'regex lens F8'],
  ['block', 'after several weeks',                                 'regex lens F8'],
  ['block', 'after another week',                                  'regex lens F8'],
  ['block', 'after some months',                                   'regex lens F8'],
  ['block', 'after 2 weeks',                                       'regex lens'],
  ['block', 'after a week',                                        'orchestrator'],
  ['block', 'in three days',                                       'regex lens'],
  ['block', 'every day',                                           'pre-existing'],
  ['block', 'every other week',                                    'pre-existing'],
  // ── honest conditions the shipped `after` branch WRONGLY BLOCKED ──────
  ['pass',  'after the sprint review is signed off',               'regex lens F7'],
  ['pass',  'after the quarter close is booked in the ledger',     'regex lens F7'],
  ['pass',  'after the day-one launch checklist is signed',        'regex lens F7'],
  ['pass',  'after a night-shift handoff is recorded',             'regex lens F7'],
  ['pass',  'after the second review is merged',                   'regex lens F7'],
  ['pass',  'after a second opinion is recorded',                  'regex lens F7'],
  ['pass',  'after the year-end audit passes',                     'regex lens F7'],
  ['pass',  'after the month-end close is booked',                 'regex lens F7'],
  ['pass',  'after the weekend release is tagged',                 'regex lens F7'],
  ['pass',  'after a morning standup logs the decision',           'regex lens F7'],
  ['pass',  'after a second live-only defect reaches main',        'regression lens H3'],
  ['pass',  'after the second live-only defect reaches main',      'regression lens H3'],
  // ── false positives from the em-dash / enumeration split ──────────────
  // ACCEPTED FALSE POSITIVE, flipped deliberately and not quietly. A reviewer
  // first flagged this as a false positive of the em-dash splitter; removing
  // the em-dash fixed the parenthetical case genuinely, but every rule that
  // also let this enumeration through let a dead obligation through with it
  // (`weekly, monthly`). Rejecting it is the cost of closing that class. The
  // reword is trivial: "the L3 documentation enumerates the banned cadence
  // words". Kept as a case so the trade stays visible instead of vanishing.
  ['block', 'the l3 doc lists hourly, daily, weekly, and nightly as banned', 'regex lens F6 → accepted FP'],
  // ── clock-only conditions with no observable clause (council F1) ──────
  ['block', 'weekly, monthly',                                     'council F1'],
  ['block', 'soon, eventually',                                    'council F1'],
  ['block', 'next week, next month',                               'council F1'],
  ['block', 'soon, eventually, once ci is green',                  'council F1'],
  ['block', 'nightly, weekly, and the corpus grows',               'council F1'],
  ['pass',  "the owner's next working session — tomorrow — has installed the build", 'regex lens F6'],
  // ── anti-overreach cases the ORIGINAL author's comment named ──────────
  ['pass',  'every phase pr is merged',                            'pre-existing comment'],
  ['pass',  'after 3 phases are merged',                           'pre-existing comment'],
  ['pass',  'after 3 missions ship',                               'pre-existing comment'],
  ['pass',  'every 3 phase prs are merged',                        'regex lens (pre-existing overreach)'],
  // ── conditions that merely OPEN with a time word ──────────────────────
  ['pass',  'daily active users exceed 1000',                      'orchestrator'],
  ['pass',  'monthly invoice count exceeds 50',                    'self'],
  // ── 3+ clause smuggling: the head/tail rule's own hole (re-review F5) ──
  ['block', 'once ci is green, weekly, and the pr merges',         're-review F5'],
  ['block', 'the corpus grows, and the build is green, and monthly', 're-review F5'],
  // ── forms the SHIPPED guard caught and the first rewrite lost ─────────
  // Found by comparing old against new on 18 alternate phrasings; the rewrite
  // regressed 3 of them by end-anchoring. Two are recovered by explicit
  // patterns (ordinals, compact durations) rather than by loosening the
  // anchor, which is what caused the false positives in the first place.
  ['block', 'every 2nd week',                                      'old-vs-new diff'],
  ['block', 'in 30d',                                              'old-vs-new diff'],
  ['block', 'within 2 weeks',                                      'adversarial sweep'],
  ['block', 'after 6mo',                                           'self (compact form)'],
  // ── honest conditions built from time words, adversarial sweep ────────
  ['pass',  'the weekly digest job reports zero failures',         'adversarial sweep'],
  ['pass',  'the nightly build turns green',                       'adversarial sweep'],
  ['pass',  'the second reviewer approves',                        'adversarial sweep'],
  ['pass',  'monthly churn drops below 3%',                        'adversarial sweep'],
  ['pass',  'the sprint board shows zero open beats',              'adversarial sweep'],
  // ── gaps a pre-merge fix list closed: each / fortnight / a couple of ──
  // `each` was absent from the cadence alternation; `fortnight` from
  // TIME_UNITS (while `fortnightly` was already a banned bare word — an
  // internal inconsistency, not a judgment call); `a couple of` from COUNT
  // (which had only the article-less `couple of`).
  ['block', 'each week',                                           'pre-merge fix list'],
  ['block', 'each morning',                                        'pre-merge fix list'],
  ['block', 'every fortnight',                                     'pre-merge fix list'],
  ['block', 'in two fortnights',                                   'pre-merge fix list'],
  ['block', 'in a couple of weeks',                                'pre-merge fix list'],
  ['block', 'after a couple of days',                              'pre-merge fix list'],
  ['pass',  'each phase pr is merged',                             'pre-merge fix list'],
  ['pass',  'the fortnightly digest job reports zero failures',    'pre-merge fix list'],
  ['pass',  'after a couple of reviewers approve',                 'pre-merge fix list'],
  // ── real `when:` values from this repo's own register ─────────────────
  ['pass',  'a second live-only defect reaches main (the v1.39.1 stop-hook loop is the first)', 'real row OB-11'],
  ['pass',  'impeccable is installed alongside a ui-surface venture session', 'real row OB-8'],
  ['pass',  'upstream compaction behavior changes or the local transcript corpus gains ≥3 new true-compaction records', 'real row OB-1'],
  ['pass',  '≥2 further missions\' transcripts exist post-v1.43',  'real row OB-2'],
];

// ── Budget verdicts (AC-14) — the pure functions the gate uses, decided
// directly (planner "Fixture mechanics" 2026-10-11: no temp-tree copy). Each
// row is [label, got, want]; F0 is the real `node tools/lint.mjs` run asserted
// by the Verify step, not here.
export const BUDGET_CASES = [
  ['F1 description 401 chars → over', descriptionOver('x'.repeat(401)), true],
  ['F1b description 400 chars → boundary passes', descriptionOver('x'.repeat(400)), false],
  ['F3 agent ceiling + 1 B → fail', budgetVerdict(16001, 16000), 'fail'],
  ['F4 91% of ceiling → warn', budgetVerdict(Math.round(16000 * 0.91), 16000), 'warn'],
  ['F5 exactly 100% → not a fail', budgetVerdict(16000, 16000) !== 'fail', true],
];

// ── Rule restatement (AC-12/AC-13). The §5 LA-1 mechanics as prose must read
// as a restatement; a one-line pointer and a backticked mention must not; the
// two live paraphrase sites (pre-swap text) must fail. A hooks/-style message
// IS a restatement to the detector — it is let through only because the scan
// excludes hooks/ (scope, not detector).
const OVERRUN_PROSE = `At **k ≥ 1.5 × N** the hook prints 🛑 OVERRUN on every prompt and the
orchestrator MUST NOT start another brief: it gives the owner the scope
decision — ship a defined subset now / continue at a revised estimate / abort —
with the remaining phases and what each buys, records the answer as a dated
locked decision, and only then revises \`Estimate:\`.`;

const REVIEWER_210_PRESWAP = `- **Security-boundary flag set where the Fable tier applies** — any brief whose
  diff touches auth / a session credential / authorization / tenancy / money /
  schema / migrations / a security boundary marks its checkpoint Fable.`;

const MISSION_176_PRESWAP = `**Reviewer tier survives the runtime switch.** A codex reviewer tune covers
ROUTINE checkpoints only. When the diff's risk class demands Fable — auth, a
session/entry credential, authorization, tenancy, money, schema, migrations, or
any security boundary — you override the tune and spawn the Claude reviewer on Fable.`;

const HOOKS_STYLE_MSG = `🛑 OVERRUN — Sessions used ≥ 1.5× Estimate; the orchestrator must stop and give the owner the scope decision (ship a defined subset / revised estimate / abort).`;

// Per-id invariant: each §5 canonical block, read from the real template, must
// read as a restatement of its own rule — else the rule is undetectable and the
// guard is a no-op (the one-next-up regression ckpt p1 caught).
const WORKFLOW = path.join(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'),
  'plugins/agentic-workflow/templates/WORKFLOW.md',
);
const CANON = {};
for (const m of readFileSync(WORKFLOW, 'utf8').matchAll(/<!-- rule: (\S+) -->([\s\S]*?)<!-- \/rule -->/g))
  CANON[m[1]] = m[2];
export const CANON_CASES = Object.keys(RULES).map((id) => [
  `§5 canonical block "${id}" self-detects`, ruleRestatement(CANON[id] ?? '', RULES[id]), true,
]);

export const RULE_CASES = [
  ['F2 §5 LA-1 mechanics as prose → restatement', ruleRestatement(OVERRUN_PROSE, RULES['overrun-1.5x']), true],
  ['F2b overrun pointer → pass', ruleRestatement('the overrun STOP applies (§5 LA-1)', RULES['overrun-1.5x']), false],
  ['reviewer.md:210-212 pre-swap → restatement', ruleRestatement(REVIEWER_210_PRESWAP, RULES['fable-boundary']), true],
  ['mission.md:176-179 pre-swap → restatement', ruleRestatement(MISSION_176_PRESWAP, RULES['fable-boundary']), true],
  ['backticked mention → pass', ruleRestatement('prose about `1.5× the estimate` and the `scope decision` and `subset`', RULES['overrun-1.5x']), false],
  ['hooks-style message (excluded by scan scope, not by the detector)', ruleRestatement(HOOKS_STYLE_MSG, RULES['overrun-1.5x']), true],
  // backticked `Next up:` two-sentence restatement → caught (name tests raw).
  ['backticked `Next up:` restatement → restatement', ruleRestatement('Keep exactly one `Next up:` line. The hook reads the first and warns on duplicates.', RULES['one-next-up']), true],
  // reviewer's fresh one-corrective paraphrase (no literal term) → caught.
  ['one-corrective paraphrase → restatement', ruleRestatement('A failed session is re-spawned once with a corrective note; a second failure escalates to the human.', RULES['one-corrective-retry']), true],
  // post-swap pointer (adaptive-ceremony S1): names the file, the tier column, no class words.
  ['gate-classes pointer → pass', ruleRestatement('Fable for boundary-class reviews — the set lives in `templates/gate-classes.md` (§5 LA-5).', RULES['fable-boundary']), false],
];

// ── Class-list dedup (adaptive-ceremony S1, AC-8) — classListRestatement over
// the old triage list, a reworded restatement, and the two real paragraphs
// that must pass (§11's action list and the §10 Merge-policy row, read live).
const TRIAGE_OLD_LIST = `1. **schema/migrations** — the cause or the fix touches the database schema, a
   migration, or data backfills.
2. **auth** — sign-in, sessions, tokens, roles, permissions.
3. **payments** — charging, refunds, payouts, invoices, a payment provider.
4. **CI/deploy config** — \`.github/**\`, build, deploy or infrastructure config.
5. **secrets** — credentials, keys, env values, anything that would need one
   rotated or read.
6. **third-party contracts** — an external API's behaviour, a webhook from a
   provider, a vendor SDK.
7. **not reproducible** — the reported code behaviour cannot be reproduced
   from the report's steps.
8. **size above S** — the change would be \`size/M\` or larger.`;
const WF_TEXT = readFileSync(WORKFLOW, 'utf8');
const paraStarting = (text, head) => {
  const i = text.indexOf(head);
  if (i === -1) return '';
  const end = text.indexOf('\n\n', i);
  return text.slice(i, end === -1 ? text.length : end);
};
const SAFETY_PARA = paraStarting(WF_TEXT, '**The safety boundary is never crossed autonomously**');
const MERGE_ROW = paraStarting(WF_TEXT, '| **Merge policy** |').split('\n')[0];
export const CLASS_LIST_CASES = [
  ['old triage 8-item list → fail', classListRestatement(TRIAGE_OLD_LIST), true],
  ['reworded 4-key change-class list → fail', classListRestatement('Escalate anything near payments, auth, a secret, or a supply chain bump.'), true],
  ['§11 safety-boundary action paragraph (live) → pass', SAFETY_PARA.length > 500 ? classListRestatement(SAFETY_PARA) : 'paragraph not found', false],
  ['§10 Merge-policy row prose (live) → pass', MERGE_ROW.length > 200 ? classListRestatement(MERGE_ROW) : 'row not found', false],
  ['3-key paragraph → pass', classListRestatement('Touches auth, payments and secrets only.'), false],
];

// ── /sync preserve (adaptive-ceremony S1, D1-A) — the exact awk commands/sync.md
// §2 runs keeps §10, §10.1 and §10.2 and stops at the next \`## \` heading.
// Read from commands/sync.md itself, so the test runs the command's exact awk.
const SYNC_AWK = (readFileSync(path.join(path.dirname(WORKFLOW), '../commands/sync.md'), 'utf8')
  .match(/`awk '([^']+)' docs\/WORKFLOW\.md`/) ?? [])[1] ?? 'BEGIN{exit 1}';
const SYNC_FIXTURE = ['# W', '', '## 9. Map', 'x', '', '## 10. Project profile', '| Key | Value |', '|---|---|', '| **Default branch** | main |', '', '### 10.1 Executors', '| name | ssh alias |', '', '### 10.2 Ceremony', '', '| id | kind | stage | derived | signal | effective |', '|---|---|---|---|---|---|', '| v0-go-no-go | gate | V0 | required | none | required |', '', '## 11. Autopilot mode', 'y', ''].join('\n');
const syncOut = spawnSync('awk', [SYNC_AWK], { input: SYNC_FIXTURE, encoding: 'utf8' });
const syncText = (syncOut.stdout ?? '').trimEnd();
export const SYNC_CASES = [
  ['sync §2 awk keeps §10 through 10.2 and stops before ## 11.', syncOut.status === 0
    && syncText.startsWith('## 10. Project profile') && syncText.includes('### 10.1 Executors')
    && syncText.endsWith('| v0-go-no-go | gate | V0 | required | none | required |') && !syncText.includes('## 11.'), true],
];

// ── Tune presets (AC-12) — tunePresetFindings decided directly on the real
// file and on mutated copies (planner "Lint fixture mechanics": no tree copy).
// Each row is [label, got, want]; `got` is true when the findings match.
const PLUGIN_DIR = path.join(path.dirname(WORKFLOW), '..');
const PRESETS = JSON.parse(readFileSync(path.join(PLUGIN_DIR, 'templates/tune-presets.json'), 'utf8'));
const AGENT_NAMES = readdirSync(path.join(PLUGIN_DIR, 'agents'))
  .filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')).sort();
const mutate = (fn) => { const j = structuredClone(PRESETS); fn(j); return tunePresetFindings(j, AGENT_NAMES); };
const names = (found, needle) => found.some((m) => m.includes(needle));
export const PRESET_CASES = [
  ['P0 real tune-presets.json → 0 findings [planner]', tunePresetFindings(PRESETS, AGENT_NAMES).length, 0],
  ['P1 bad model id → finding naming the id [brief AC-12]',
    names(mutate((j) => { j.presets.rigorous.agents.backend.model = 'claude-opus-9-9'; }), 'claude-opus-9-9'), true],
  ['P2 agent missing from one preset → finding naming the agent [brief AC-12]',
    names(mutate((j) => { delete j.presets.balanced.agents.compass; }), '"compass" missing'), true],
  ['P3 Haiku row without compact_window → finding [brief AC-12]',
    names(mutate((j) => { delete j.presets.lean.agents.chronicler.compact_window; }), 'lean.chronicler: Haiku row needs compact_window'), true],
  ['P4 Haiku row with bare Bash → finding [planner]',
    names(mutate((j) => { j.presets.unattended.agents.intake.allowed_tools.push('Bash'); }), 'bare Bash'), true],
  ['P4c Haiku row with wrapper shell Bash(sh -c:*) → finding (same semantic rule as run-claude.mjs)',
    names(mutate((j) => { j.presets.lean.agents.writer.allowed_tools.push('Bash(sh -c:*)'); }), 'bare Bash'), true],
  ['P4b Haiku row with glob-first Bash(*) → finding (same semantic rule as run-claude.mjs)',
    names(mutate((j) => { j.presets.lean.agents.curator.allowed_tools.push('Bash(*)'); }), 'bare Bash'), true],
  ['P4d Haiku row with a quoted wrapper Bash("sh" -c:*) → finding (shared denylist, #129)',
    names(mutate((j) => { j.presets.lean.agents.writer.allowed_tools.push('Bash("sh" -c:*)'); }), 'bare Bash'), true],
  ['P4e Haiku row with a metacharacter first token Bash(git;sh:*) → finding (shared denylist, #129)',
    names(mutate((j) => { j.presets.lean.agents.writer.allowed_tools.push('Bash(git;sh:*)'); }), 'bare Bash'), true],
];

// Guarded on being the entry point, so importing CASES (to score an older
// implementation against the same corpus, say) does not run the suite.
// realpath both sides — see the same guard in lint.mjs: a plain resolve()
// comparison makes a symlinked invocation silently skip the suite.
const isEntryPoint = () => {
  if (!process.argv[1]) return false;
  const self = fileURLToPath(import.meta.url);
  try { return realpathSync(process.argv[1]) === realpathSync(self); }
  catch { return path.resolve(process.argv[1]) === self; }
};
if (isEntryPoint()) run();

function run() {
let bad = 0;
for (const [must, when, source] of CASES) {
  const hit = clockLeak(when);
  const got = hit ? 'block' : 'pass';
  if (got !== must) {
    bad++;
    console.error(`  FAIL  want=${must} got=${got}${hit ? ` (matched "${hit.clause}" as ${hit.kind})` : ''}  [${source}]\n        when: ${when}`);
  }
}
for (const [label, got, want] of [...BUDGET_CASES, ...CANON_CASES, ...RULE_CASES, ...CLASS_LIST_CASES, ...SYNC_CASES, ...PRESET_CASES]) {
  if (got !== want) {
    bad++;
    console.error(`  FAIL  want=${JSON.stringify(want)} got=${JSON.stringify(got)}  [${label}]`);
  }
}
const total = CASES.length + BUDGET_CASES.length + CANON_CASES.length + RULE_CASES.length + CLASS_LIST_CASES.length + SYNC_CASES.length + PRESET_CASES.length;
if (bad) {
  console.error(`\nlint-test: ${bad} of ${total} wrong`);
  process.exit(1);
}
console.log(`lint-test: clean (${total} cases)`);
}
