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
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { clockLeak } from './lint.mjs';

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
if (bad) {
  console.error(`\nlint-test: ${bad} of ${CASES.length} wrong`);
  process.exit(1);
}
console.log(`lint-test: clean (${CASES.length} clock-guard cases)`);
}
