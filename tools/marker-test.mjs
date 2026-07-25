#!/usr/bin/env node
// Tier-1.5 behavioral test for the sales kit's chronicler-owned marker regions.
// Zero deps; Node >= 18. Sibling of tools/hook-test.mjs — same shape (fixture in a
// throwaway dir, the `check()` helper, non-zero exit on failure), different unit.
//
// Phase-3 [STRICT] wires the chronicler to auto-write the sales kit's fact regions
// every ship. Its write surface is EXACTLY: the catalog's `data:capabilities`
// (append-only fact rows, outcome `_unwritten_`) and the sell-sheet's
// `data:whats-new` (factual release/version lines only). The sell-sheet's
// `data:top-benefits` is MARKETING's — curated from filled catalog rows — and the
// chronicler must NEVER touch it. That auto-write is the risk: an agent editing a
// doc on disk could (a) touch bytes OUTSIDE the markers, (b) reword/drop an
// existing recorded fact instead of appending, (c) author a positioning CLAIM in
// the outcome column, (d) slip a benefit/claim line into `data:whats-new` (a
// client-facing leave-behind region that must stay factual), (e) reach into
// marketing's `data:top-benefits`, or (f) append a prose line into the fact table
// instead of a real row. Structural lint can't catch a bad edit; this harness does,
// by applying a *simulated* chronicler update to a fixture and asserting the full
// chronicler surface — then proving each guard actually fires with a self-contained
// negative check. Run: node tools/marker-test.mjs (0 = pass, 1 = fail).

import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const failures = [];
function check(name, cond, detail) {
  if (cond) console.log(`  ok   ${name}`);
  else { console.error(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`); failures.push(name); }
}

// ── The unit under test: marker mechanics ────────────────────────────────
// A data region is the text strictly between `<!-- data:X -->` and
// `<!-- /data:X -->`. Backreference \1 keeps open/close names paired.
const MARKER = /<!-- data:([\w-]+) -->\n([\s\S]*?)\n<!-- \/data:\1 -->/g;

// The "outside skeleton": the whole doc with every region's INTERIOR masked to a
// fixed sentinel, while the marker frame lines and all non-region bytes stay
// verbatim. Two docs with byte-identical skeletons differ ONLY inside markers.
function outsideSkeleton(doc) {
  return doc.replace(MARKER, (_m, name) => `<!-- data:${name} -->\n\x00\n<!-- /data:${name} -->`);
}

// Interior lines of a named region (empty array if absent).
function regionLines(doc, region) {
  for (const m of doc.matchAll(MARKER)) if (m[1] === region) return m[2].split('\n');
  return [];
}

// True when a named region's interior is byte-for-byte unchanged between two docs.
const regionUnchanged = (before, after, region) =>
  regionLines(before, region).join('\n') === regionLines(after, region).join('\n');

// A markdown table row → trimmed cells (drops the leading/trailing `|` empties).
const isRow = (l) => /^\s*\|/.test(l);
const cells = (row) => row.split('|').slice(1, -1).map((c) => c.trim());
const OUTCOME_COL = 2; // Capability | Shipped-ref | Client outcome | Proof | Demo | Since

// The chronicler's forbidden signature: a benefit / "so you can…" positioning
// line. It may appear in an existing catalog row's outcome cell (marketing wrote
// it) but must NEVER be authored by the chronicler into `data:whats-new`.
const isClaim = (l) => /so you can/i.test(l);

// ── The invariants (chronicler.md Artifact 4 — the full write surface) ────
// (a) bytes OUTSIDE every data:* marker pair are byte-identical.
const outsideIdentical = (before, after) => outsideSkeleton(before) === outsideSkeleton(after);

// (b) data:capabilities only GAINS rows: the old interior is an exact prefix of
// the new one (no existing line removed, reordered, or rewritten).
function appendOnly(before, after) {
  const b = regionLines(before, 'capabilities');
  const a = regionLines(after, 'capabilities');
  if (a.length < b.length) return false;
  return b.every((line, i) => a[i] === line);
}

// The interior lines appended to data:capabilities past the old prefix (all of
// them, unfiltered — so a smuggled non-row line is visible, not silently dropped).
function appendedInterior(before, after) {
  const b = regionLines(before, 'capabilities');
  const a = regionLines(after, 'capabilities');
  return a.slice(b.length);
}
// …of which the ones that are actually table rows.
const appendedRows = (before, after) => appendedInterior(before, after).filter(isRow);

// (c) no positioning claim / benefit is introduced: every appended row's outcome
// cell is the literal `_unwritten_` sentinel — never prose the chronicler wrote.
function noClaimIntroduced(before, after) {
  return appendedRows(before, after).every((row) => cells(row)[OUTCOME_COL] === '_unwritten_');
}

// (d, F5) every line the chronicler appended into data:capabilities is a real
// table row — prose has no place in the append-only fact table.
function capabilitiesRowsOnly(before, after) {
  const app = appendedInterior(before, after);
  return app.length > 0 && app.every(isRow);
}

// (e) data:whats-new carries facts only: no benefit / "so you can…" claim line.
const whatsNewFactsOnly = (after) => regionLines(after, 'whats-new').every((l) => !isClaim(l));

// ── Fixture: models the catalog's data:capabilities + the sell-sheet's two
// regions (data:top-benefits = marketing, data:whats-new = chronicler), with
// positioning prose OUTSIDE every marker. ────────────────────────────────
const FIXTURE = `# Fixture — feature→benefit catalog + sell-sheet regions (marker-test)

This prose lives OUTSIDE every data:* marker and MUST be byte-identical after a
chronicler update. Positioning and claims live out here; the chronicler may never
touch these bytes.

## Capabilities (catalog — chronicler appends fact rows, outcome _unwritten_)

<!-- data:capabilities -->
| Capability | Shipped-ref | Client outcome ("so you can…") | Proof | Demo-moment | Since-version |
|---|---|---|---|---|---|
| One-command bootstrap | PR #12 | so you can ship before the coffee's cold | Green CI | Run it live | v0.2.0 |
| Auto status page | PR #31 | _unwritten_ | Page self-updates | Refresh, watch it move | v0.4.0 |
<!-- /data:capabilities -->

## Top benefits (sell-sheet — MARKETING-owned; curated from FILLED catalog rows)

<!-- data:top-benefits -->
1. **Ship before the coffee's cold** — green CI on the seeded skeleton
<!-- /data:top-benefits -->

## What's new (sell-sheet — CHRONICLER-owned facts; release/version lines only)

<!-- data:whats-new -->
_(this release's newest shipped capability — one factual, PR-cited line)_
<!-- /data:whats-new -->

Closing prose, also outside the markers — a positioning line only marketing may author.
`;

// The fixture CHANGELOG the simulated chronicler reads: PR-cited facts, no claims.
const CHANGELOG = [
  { cap: 'Fail-closed marker gate', ref: 'PR #42', proof: 'marker-test in lint', demo: 'Mutate a byte, watch it FAIL', since: 'v1.40.0' },
  { cap: 'Staleness stamp', ref: 'PR #42', proof: 'Last-refreshed on semi-static docs', demo: 'Show the stamp', since: 'v1.40.0' },
];

const capRow = (c) => `| ${c.cap} | ${c.ref} | _unwritten_ | ${c.proof} | ${c.demo} | ${c.since} |`;
// The factual whats-new line: release/version fact only, PR-cited, no benefit prose.
const whatsNewFact = (c) => `Shipped ${c.cap} (${c.ref}) in ${c.since}.`;

// ── The deterministic "simulated chronicler update" ──────────────────────
// Mirrors chronicler.md Artifact 4: the FULL every-ship write surface and nothing
// more. Appends ONE row per changelog entry INSIDE data:capabilities (outcome
// literally `_unwritten_`), refreshes data:whats-new with the newest release fact,
// and leaves data:top-benefits (marketing's) and all outside-marker bytes alone.
function simulatedChroniclerUpdate(doc, changelog) {
  const newest = changelog[changelog.length - 1];
  return doc.replace(MARKER, (m, name, interior) => {
    if (name === 'capabilities')
      return `<!-- data:${name} -->\n${interior}\n${changelog.map(capRow).join('\n')}\n<!-- /data:${name} -->`;
    if (name === 'whats-new')
      return `<!-- data:${name} -->\n${whatsNewFact(newest)}\n<!-- /data:${name} -->`;
    return m; // data:top-benefits and anything else: never the chronicler's to touch
  });
}

// ── Rogue updates modelling the forbidden paths (each proves one guard) ───
// (c) the chronicler authors a benefit claim in the outcome column.
function rogueClaimUpdate(doc) {
  return doc.replace(MARKER, (m, name, interior) => {
    if (name !== 'capabilities') return m;
    const row = '| Rogue capability | PR #99 | so you can 10x your revenue overnight | — | — | v1.40.0 |';
    return `<!-- data:${name} -->\n${interior}\n${row}\n<!-- /data:${name} -->`;
  });
}
// (F5) the chronicler appends a prose line (not a row) into the fact table.
function rogueProseInCapabilities(doc, changelog) {
  return doc.replace(MARKER, (m, name, interior) => {
    if (name !== 'capabilities') return m;
    const rows = changelog.map(capRow).join('\n');
    const prose = 'And honestly this one basically sells itself — a total game-changer.';
    return `<!-- data:${name} -->\n${interior}\n${rows}\n${prose}\n<!-- /data:${name} -->`;
  });
}
// (whats-new) the chronicler slips a benefit claim into the facts-only region.
function rogueWhatsNewClaim(doc) {
  return doc.replace(MARKER, (m, name) => {
    if (name !== 'whats-new') return m;
    const claim = 'A total game-changer — so you can 10x your pipeline overnight.';
    return `<!-- data:${name} -->\n${claim}\n<!-- /data:${name} -->`;
  });
}
// (top-benefits) the chronicler reaches into marketing's curated benefits region.
function rogueTopBenefitsTouch(doc) {
  return doc.replace(MARKER, (m, name, interior) => {
    if (name !== 'top-benefits') return m;
    return `<!-- data:${name} -->\n${interior}\n2. **A chronicler-authored benefit** — out of scope\n<!-- /data:${name} -->`;
  });
}

// ── Run: apply the update on disk (a real file round-trip, like the agent) ──
const dir = mkdtempSync(path.join(tmpdir(), 'markertest-'));
try {
  const fp = path.join(dir, 'feature-benefit-catalog.md');
  writeFileSync(fp, FIXTURE);
  const before = readFileSync(fp, 'utf8');

  // Positive: a well-behaved chronicler update satisfies every invariant.
  writeFileSync(fp, simulatedChroniclerUpdate(before, CHANGELOG));
  const after = readFileSync(fp, 'utf8');

  check('(a) bytes outside every data:* marker are byte-identical',
    outsideIdentical(before, after),
    'the chronicler update changed bytes outside a marker pair');
  check('(b) data:capabilities only gained rows (append-only)',
    appendOnly(before, after) && appendedRows(before, after).length === CHANGELOG.length,
    `appended ${appendedRows(before, after).length} row(s), expected ${CHANGELOG.length}, prefix intact=${appendOnly(before, after)}`);
  check('(c) no positioning claim introduced (appended outcome = _unwritten_)',
    noClaimIntroduced(before, after),
    'an appended row carried a prose outcome instead of the _unwritten_ sentinel');
  check('(d) data:capabilities appended lines are ALL table rows (F5, no prose in the fact table)',
    capabilitiesRowsOnly(before, after),
    'the chronicler appended a non-row prose line into the append-only fact table');
  check('(e) data:whats-new refreshed with facts only (no benefit/claim prose)',
    !regionUnchanged(before, after, 'whats-new') && whatsNewFactsOnly(after),
    'whats-new was not refreshed, or a benefit/claim line was introduced into it');
  check('(f) data:top-benefits untouched (marketing-owned, never the chronicler)',
    regionUnchanged(before, after, 'top-benefits'),
    'the chronicler edited data:top-benefits, which belongs to marketing');

  // ── Negatives: prove each guard actually fires (not just the happy path) ──
  // (a) an edit to prose OUTSIDE the markers must be caught.
  const outsideMutated = after.replace('Closing prose', 'Closing PROSE-tampered');
  check('neg(a) an edit outside the markers is caught',
    !outsideIdentical(before, outsideMutated),
    'outside-marker tamper slipped past invariant (a)');

  // (b) rewording/removing an existing recorded row must be caught.
  const rowRewritten = after.replace('One-command bootstrap', 'One-command bootstrap (reworded)');
  check('neg(b) rewriting an existing capability row is caught',
    !appendOnly(before, rowRewritten),
    'an in-place row rewrite slipped past the append-only invariant (b)');
  const rowRemoved = after.replace('| Auto status page | PR #31 | _unwritten_ | Page self-updates | Refresh, watch it move | v0.4.0 |\n', '');
  check('neg(b) removing an existing capability row is caught',
    !appendOnly(before, rowRemoved),
    'a row removal slipped past the append-only invariant (b)');

  // (c) a chronicler-authored benefit claim in the outcome column must be caught.
  const rogue = rogueClaimUpdate(before);
  check('neg(c) a chronicler-authored claim in the outcome column is caught',
    !noClaimIntroduced(before, rogue),
    'a prose benefit in the outcome column slipped past the no-claim invariant (c)');

  // (d/F5) a non-row prose line appended into data:capabilities must be caught.
  const proseInCaps = rogueProseInCapabilities(before, CHANGELOG);
  check('neg(d/F5) a prose line inside the fact table is caught',
    !capabilitiesRowsOnly(before, proseInCaps),
    'a non-row prose line in data:capabilities slipped past the rows-only invariant (d)');

  // (e) a benefit/claim line smuggled into the facts-only whats-new must be caught.
  const whatsNewClaim = rogueWhatsNewClaim(before);
  check('neg(e) a chronicler-authored claim in data:whats-new is caught',
    !whatsNewFactsOnly(whatsNewClaim),
    'a benefit/claim line in data:whats-new slipped past the facts-only invariant (e)');

  // (f) any chronicler edit to marketing's data:top-benefits must be caught.
  const topBenefitsTouched = rogueTopBenefitsTouch(before);
  check('neg(f) a chronicler edit to data:top-benefits is caught',
    !regionUnchanged(before, topBenefitsTouched, 'top-benefits'),
    'an edit to marketing-owned data:top-benefits slipped past invariant (f)');
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (failures.length) {
  console.error(`\nmarker-test: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('marker-test: clean');
