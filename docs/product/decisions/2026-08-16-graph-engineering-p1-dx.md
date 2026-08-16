# DX design — Graph-engineering P1 failure surface

**Date:** 2026-08-16
**Branch:** `feat/graph-engineering-p1`
**Companion to:** `docs/product/decisions/2026-08-16-graph-engineering-p1-brief.md`
**Status:** PROPOSAL — the human decides at the single approval gate
**Author:** designer (DX pillar). No UI exists in this mission; the failure
surface of the lint gate *is* the user experience.

---

## 0. Why this document exists

The three new checks are governance. Governance only works if the people and
agents it constrains believe it. A gate that fails without saying which file,
why it is protected, or how to proceed honestly gets routed around — an agent
deletes the check, a human adds `|| true`, and the instrument this mission
exists to build is gone within two missions.

So the messages are the feature. `checkFrozenFixtures()` is fifty lines of
hashing; the sentence it prints is what decides whether the freeze survives
contact with a Tuesday-afternoon refactor.

**Users of this surface**, in order of frequency:

| Who | Arrives how | Needs |
|---|---|---|
| An agent mid-mission | Ran `node tools/lint.mjs` after an edit | To self-correct in one turn without asking the human |
| A human doing a sweeping refactor | Renamed a command, touched 40 files | To tell instantly whether this is a real problem or collateral |
| An agent tempted to tune the fixture | An eval failed and the rubric looks "wrong" | To be stopped, and to understand that the stop is reasonable |
| A reviewer, later | Reading a PR diff | To judge an unfreeze in ten seconds |

The third row is the adversary. The first two are the population. **A message
tuned only for the adversary insults the population** — this is the central
craft constraint below.

---

## 1. The voice contract (extracted from `tools/lint.mjs`, 58 call sites)

These are not preferences; they are observed invariants, measured across every
`fail()` call site in the file. A new check that breaks one of them reads as a
foreign body.

| Rule | Evidence |
|---|---|
| **Lowercase first word, no trailing period** | 58/58 messages — 0 capitalized, 0 terminal periods |
| **No second person, ever** — no "you", "your", "please" | 0 occurrences in the file |
| **No emoji, no capitals-as-shouting** | `hooks.json` uses `❌ BLOCKED:` and emoji; `fail()` never does. Two surfaces, two voices |
| **One sentence**, compounded with `—`, `;`, `:` | Longest literal is **265 chars** (`checkContextAttrib`'s missing-harness message); none is two sentences |
| **Diagnosis — consequence: fix.** The em dash separates what is wrong from what it costs; the colon introduces the route out | `line is 1204 chars — suspiciously long single line (…); split it, or raise MAX …` |
| **Quote the offending value back** in `"straight double quotes"`; use `` `backticks` `` for literal syntax, paths, commands | `unknown tool "Foo"`, `` frozen template must have `refresh-trigger: never` `` |
| **`— got: <72 chars>` tail** on grammar failures | checks 11, 13, 14 |
| **The "why" is one aphorism, never a lecture** | "a tick without evidence is a claim, not a fire" · "the tick and the evidence travel together" · "a fire is an event that happened, so its date is known" |
| **The escape hatch comes second and conditional** | `split it, or raise MAX in checkObfuscation if genuinely intentional` |
| **Never name the file the finding is reported against** — the `file:line` prefix already carries it. Other files are named freely | No message repeats its own path except inside a runnable command (`run \`node tools/hook-test.mjs\``) |
| **Cross-reference by line number** when a second site is involved | `` coexists with the `Closed:` stamp at line 412 `` |
| **`fail(file, null, …)`** for whole-file findings; `1` only for frontmatter | 16 call sites pass `null`; 15 pass `1` |
| **Missing-harness messages are fail-closed and say so** | `` … must exist so the gate proves … (do not silently drop the check) `` |

Every message below was drafted against this table. Where I deviate, I say so —
and I do deviate on one axis, length, at exactly one message (§2.7).

---

## 2. Journey 1 — FROZEN FIXTURE VIOLATED

### 2.1 The mechanism the messages assume

The message quality is not mechanism-independent, so I have to state what the
messages need. **This is a DX requirement handed to the architect, not a
usurpation of open shape decision #1** — the architect may satisfy it another
way.

A manifest at **`evals/FROZEN.md`**, markdown, one append-only row per frozen
path, mirroring the existing OB-row grammar so nobody learns a fourth format:

```
- evals/scenarios/routing-altitude/rubric.md · frozen 2026-08-16 (graph-engineering-p1) — holds: the mission-vs-fix routing boundary — blob 4f2a1c9e8b3d5a7f0c2e4b6d8a1f3c5e7b9d0a2c
```

Three properties the failure messages depend on:

1. **Per-row `holds:` prose.** The message must say *why this fixture is
   frozen*. Hardcoding that in JavaScript produces one generic lecture repeated
   four times. Authoring it per row makes the "why" **data**, and lint simply
   repeats what the person who froze it wrote. This is the single highest-value
   structural choice in the document.
2. **A hash lint prints back.** The mismatch is the evidence; without it the
   message asserts "this changed" and cannot prove it.
3. **Markdown, not JSON.** The unfreeze reason is prose that must read well in
   a diff. JSON has no comments, arrays of objects diff badly, and the repo
   already keeps every other governance grammar (`OBLIGATIONS.md`, `## Closing`,
   `## Standing steers`) as append-only markdown rows.

**Hash choice — recommend `git hash-object`, i.e. the git blob id.** There is
no `.gitattributes` in this repo, so a contributor with `core.autocrlf=true`
gets different working-tree bytes for every text fixture and a sha256 of those
bytes fails on a clean checkout. The blob id is normalization-consistent, and —
decisively for DX — **the author can reproduce the expected value with one
stock command the message can name**: `git hash-object <path>`. sha1's academic
weakness is irrelevant to a threat model of "an agent tuned a rubric", and git
already stores exactly this id. Architect's call; recorded so the trade is
explicit.

### 2.2 State 1a — a frozen fixture's content changed *(the main path)*

Reported against **the fixture**, not the manifest, `line = null`. The author is
looking at the file they edited; the `file:` prefix must open that file. The
*fix* lives in the manifest, so the manifest is named in the body.

```
frozen fixture edited — expected blob 4f2a1c9 (evals/FROZEN.md, frozen 2026-08-16), got 8b30de1; this fixture holds "the mission-vs-fix routing boundary", and a fixture tuned to the system it measures can no longer measure it — restore it with `git checkout -- evals/scenarios/routing-altitude/rubric.md`, or unfreeze it in evals/FROZEN.md with a dated reason if the edit is deliberate
```

**Rationale:** names which fixture (the prefix), proves it changed (two hashes),
states why it is frozen in the freezer's own words, makes the honest case in one
aphorism, and gives the revert as a paste-ready command while the hatch gets a
destination and a requirement.

Four deliberate craft decisions inside that one line:

- **The revert is paste-ready; the hatch is not.** The revert is a complete
  command. The hatch names a file and a requirement ("with a dated reason") and
  no copy-pasteable form. That asymmetry — not difficulty, not scolding — is
  the entire mechanism keeping the hatch off the default path. Nothing is
  hidden; one route is simply one keystroke and the other is a paragraph of
  writing.
- **The honest case is six words** — "a fixture tuned to the system it measures
  can no longer measure it" — and it is a statement about fixtures, not about
  the reader. It reads identically to an innocent refactorer and to a cheating
  agent. No motive is imputed, so the population is never insulted and the
  adversary is never given a grievance to route around.
- **"if the edit is deliberate"** mirrors `checkObfuscation`'s "if genuinely
  intentional" exactly. The repo already has a precedent for a hard gate with a
  named, conditional exit; using its words makes this check feel like the same
  institution rather than a new one.
- **Hash provenance is in the message.** `(evals/FROZEN.md, frozen 2026-08-16)`
  becomes `(evals/FROZEN.md, unfrozen 2026-09-02)` once the row carries an
  unfreeze chain, so the message always points at *the manifest line the
  expectation came from*. One code path, no intent-guessing branch, and the
  author never has to work out which of four lines they must edit.

**Short hashes (7 chars), not full.** The full value is 40 chars and would
double the message. The author who needs the full value runs
`git hash-object <path>`. This is also, deliberately, why the hatch stays a
command away.

### 2.3 State 1b — a frozen fixture is gone (deleted or renamed)

A naive implementation throws `ENOENT` or `existsSync`-skips. The skip is the
dangerous one: **deleting a frozen fixture would then be the cheapest way to
stop it failing.** Fail closed, reported against **the manifest** (the file
that still makes the claim), at the row's line.

```
frozen fixture is not tracked — evals/scenarios/routing-altitude/rubric.md is listed here but `git ls-files` does not return it; a held-out set that quietly shrinks measures less every time it runs — restore the file, or retire this row by ~~strikethrough~~ with a dated reason if the removal is deliberate (rows are never deleted)
```

**Rationale:** the retirement route reuses the standing-steers convention
verbatim (`retire by ~~strikethrough~~, never delete`), so the append-only
property holds across all four of the repo's row grammars and a reader who
knows one knows this.

### 2.4 State 1c — a file appears *inside* a frozen scenario

Freezing at file granularity leaves an evasion: `evals/scenarios/<s>/fixture/`
is copied wholesale by the runner, so **adding** a file there changes what the
scenario runs while every frozen row still hashes clean.

The DX requirement, whichever mechanism the architect picks: **the message must
name which path appeared, not just report that a tree hash differs.** A bare
tree-hash design cannot produce an actionable message and should be rejected on
those grounds.

```
frozen fixture tree changed — evals/scenarios/routing-altitude/fixture/ gained `notes.md` against evals/FROZEN.md; a scenario runs its whole fixture tree, so a file added beside a frozen one changes the measurement as surely as editing it — remove the addition, or unfreeze the tree in evals/FROZEN.md with a dated reason if it is deliberate
```

Scope note: if this is deferred to v2, say so in the manifest header rather than
leaving the gap unrecorded. An unrecorded gap in a measurement instrument is
the exact failure this mission was chartered to end.

### 2.5 State 1d — a manifest row does not parse

```
frozen-fixture row does not match the grammar `- <path> · frozen YYYY-MM-DD (<source>) — holds: <what it measures> — blob <40-hex>` (`·` separators, em-dashed segments in this order) — got: <first 72 chars>
```

**Rationale:** clone of `checkObRow`'s grammar message, including the `— got:`
tail. Note the truncation is nearly useless here — 72 chars of a row starting
with `evals/scenarios/routing-altitude/rubric.md` shows only the path. Where a
single segment is identifiably missing, prefer naming it
(``frozen-fixture row has no `holds:` segment — …``) and fall back to the
`— got:` echo only when the row is unparseable. Small improvement over the
existing checks; adopting it here does not obligate retrofitting them.

### 2.6 State 1e — the manifest is missing or empty *(fail-closed)*

```
frozen-fixture manifest missing — evals/FROZEN.md must exist so the gate proves the held-out eval set is intact; without it every before/after claim this repo makes is unfalsifiable (do not silently drop the check)
```

```
frozen-fixture manifest lists no fixtures — an empty held-out set passes every comparison it is asked to judge, which is indistinguishable from having no instrument; freeze at least one scenario, or remove the manifest and the check in one reviewable commit
```

**Rationale:** verbatim shape-match to `checkMarkerMutation` /
`checkContextAttrib`, down to the "(do not silently drop the check)"
parenthetical. Naming removal-in-one-commit as a route is deliberate: the
`checkObfuscation` precedent proves this house prefers a visible, reviewable
exit to a pretended-impossible one.

**Scoping — a naive implementation ships a bug here.** `evals/` exists only in
*this* repo; the plugin ships to consumer repos that have no eval set. Guard on
`evals/scenarios/` existing (the `stateLedgers()` / `checkObligationsRegister`
precedent), so a consumer repo skips the check entirely rather than failing
every push with "manifest missing".

### 2.7 The one place I break my own voice contract — length

Measured, not estimated. The longest existing message in `tools/lint.mjs` is
**265 chars**. State 1a as specified is **385**. That is a 45% overrun on the
house ceiling, and I am flagging it rather than hoping nobody measures.

| Variant | Chars | What it gives up |
|---|---|---|
| **A** — as specified in §2.2 | 385 | nothing |
| **B** — provenance folded into one parenthetical | 371 | nothing material; slightly denser |
| **C** — `` `git checkout --` this path `` instead of the interpolated path | 336 | the paste-ready revert, which is the asymmetry that keeps the hatch off the default path |

**I recommend A and accept the overrun.** This message does four jobs no other
message in the file does at once — identify, prove, justify, and route two
ways — and it is the one message whose failure mode is a deleted check. The
other messages in this document all land at or under the ceiling (1b: 331 is
the only other overrun; 3b: 260; 4b: 279).

Two consequences worth acting on:

- **The length is partly author-controlled.** `holds:` prose is interpolated,
  so a verbose entry blows the budget. Advise in the manifest header:
  **`holds:` is one clause, ≤ 60 chars** — it names what the fixture measures,
  not why measurement matters.
- If the human prefers the ceiling held, take **C** and accept that the revert
  becomes a two-step. Do not take a fourth option that drops the `holds:` quote
  — that clause is the whole reason this message persuades rather than scolds.

---

## 3. Journey 2 — THE UNFREEZE CEREMONY

### 3.1 What the author does

Four steps, of which lint enforces three:

1. Edit the fixture.
2. Run `node tools/lint.mjs` → state 1a fires, printing the new short hash.
3. Append **one line** under the row in `evals/FROZEN.md`:
   ```
     · unfrozen 2026-09-02 (graph-engineering-p2, S3) — `/mission plan` was renamed to `/mission shape`; the prompt referenced the old name and the scenario could no longer run — now blob 8b30de1a4c7f2e9b0d3a5c8e1f4b7d0a2c6e9f31
   ```
4. Commit the fixture edit and the manifest line together.

The **live** hash of a row is: its `frozen` blob if no chain exists, otherwise
the newest `· unfrozen` line's `now blob`. The `frozen` line is never edited.
That is what makes step 3 an **append**, and an append is what makes the diff
readable.

### 3.2 What lint says on the way through

**State 2b — the unfreeze line does not parse.**

```
`· unfrozen` line does not match the grammar `· unfrozen YYYY-MM-DD (<source>) — <reason> — now blob <40-hex>` (append under the row; an earlier line is never edited or deleted) — got: <first 72 chars>
```

**State 2c — placeholder date.**

```
`· unfrozen` line carries the literal `YYYY-MM-DD` placeholder — an unfreeze is an event that happened, so its date is known; the placeholder is template-only
```

*Rationale:* near-verbatim reuse of the ckpt-p1 F2 fired-evidence message. Same
rule, same words, zero new vocabulary — and free to implement.

**State 2d — no reason.**

```
`· unfrozen` line states no reason — the reason is what a reviewer weighs against the fixture diff; without it the row records that the measuring stick moved and not why
```

*Rationale:* this is the state that decides whether the hatch has teeth. A
reason-free bump is a rename of the problem, not a solution to it.

**State 2e — a no-op unfreeze.**

```
`· unfrozen` line records the blob it replaces — an unfreeze that changes nothing is a reason with no edit under it; drop the line, or make the change it describes
```

**State 2f — reason written, hash not updated.** Handled by state 1a with no
extra branch: once the row carries a chain, 1a's provenance clause reads
`(evals/FROZEN.md, unfrozen 2026-09-02)`, which points the author at the exact
line whose `now blob` is stale. I considered a dedicated "mid-ceremony" variant
and rejected it — it cannot be distinguished deterministically from a *later*
violation of an already-unfrozen fixture, and a message that guesses intent
wrong is worse than one that simply says which line it read.

### 3.3 What the reviewer sees

```diff
  - evals/scenarios/routing-altitude/rubric.md · frozen 2026-08-16 (graph-engineering-p1) — holds: the mission-vs-fix routing boundary — blob 4f2a1c9e…
+   · unfrozen 2026-09-02 (graph-engineering-p2, S3) — `/mission plan` was renamed to `/mission shape`; the prompt referenced the old name and the scenario could no longer run — now blob 8b30de1a…
```

**One added line, next to the fixture diff, in the same commit.** The review
question collapses to: *does that sentence justify that diff?* — answerable in
ten seconds by someone with no context. This is the acceptance test for the
ceremony's design; if a proposed mechanism cannot produce a diff this legible,
it is the wrong mechanism.

Two properties worth naming:

- **The chain accumulates.** A fixture with four unfreeze lines is a fixture
  that is no longer held out, and the manifest says so on its face without
  anyone computing anything. The audit value is not "did it change" but "how
  often, and why" — and only an append-only chain answers that.
- **A silent bump is a *modified* line, not an added one**, on a row whose
  `frozen` date says it was sealed months earlier. Git diff and `git blame`
  make that permanent and obvious. That is the design's real teeth.

### 3.4 The honest ceiling

**Lint cannot detect a manifest bumped silently in the same commit as the
fixture edit.** Anyone who can edit the fixture can edit the manifest, and lint
has no memory of the manifest's prior state. Say this plainly in
`evals/FROZEN.md`'s header rather than letting the freeze be mistaken for a
lock:

> The freeze is a tripwire, not a lock. Lint enforces the ceremony's shape; the
> diff enforces its honesty. Neither stops a determined editor — both make the
> edit impossible to make quietly.

Overclaiming here would be its own instance of measurement decay: a gate
believed to be stronger than it is, is a green dashboard.

*(Optional complement, out of scope: a review requirement on `evals/FROZEN.md`
via CODEOWNERS. One line of config, no code. Noted, not recommended — this repo
has no CODEOWNERS today and adding one is a governance change, not a DX one.)*

### 3.5 Same-commit enforcement — recommend against

Requiring the fixture edit and manifest line in one commit is technically
possible and would break the normal loop (edit → run lint → fix manifest →
commit). Lint checks the working tree; at pre-push they land together anyway.
Adding the constraint buys nothing and taxes every honest author.

---

## 4. Journey 3 — MISSING COUNTER-METRIC

### 4.1 Vocabulary lock

Three names for one concept is how an IA rots. Locking:

| Layer | Term |
|---|---|
| Ledger section heading | `## Paired metrics` |
| The field inside a row | `counter:` |
| Prose, docs, `settle.md` | "the paired counter-metric" |

The block is the *pair*; the field is the *counter*. Nothing anywhere says
"counter-metric row" as a heading, "paired metric" as a field, or invents
"guard metric".

### 4.2 Caught where — and *when*

Caught by lint, in `plugins/agentic-workflow/templates/mission-state.md` (the
template must carry the block) and in deployed `.plans/*.state.md`.

**Legacy tolerance follows the OQ4 / check-11 precedent exactly:** the template
is required to carry it; a deployed ledger is validated only if it already
carries the section. I verified the alternative before recommending this —
3 of 6 existing ledgers carry `## Standing steers`, so any "new-generation
ledger" heuristic keyed on that would retroactively fail three closed missions
and violate the brief's explicit deferral of retrofitting.

**Timing is the real UX decision, and it is a fork.** Enforcing a filled row
from the moment a ledger is deployed blocks session 1 of every mission on a
number the author cannot yet know — friction before value, charged to every
mission forever, to catch a failure that only matters at the end.

**Recommendation: validate shape always, completeness only at the `Closed:`
stamp.** This is exactly `checkClosing`'s existing design ("in-flight missions
(no stamp) do not fail on unticked rows — that is their normal state") and it
reuses machinery already in the file: the `placeholderOk` option object and the
fence-and-backtick-aware `stampLine` detection from ckpt-p1 F3. Implementation
cost is near zero:

```
checkPairedMetrics(file, { placeholderOk: !stamped })
```

A mission may *start* without knowing its counter-metric. It may not *close*
without one. Flagged as a decision for the gate because the brief's wording
("authored without … is caught") could also be read as catch-at-authoring.

### 4.3 The template block

Placed after `## Open questions`, before `## Standing steers` — it is part of
the mission's setup contract, judged at close.

```markdown
## Paired metrics

_Every optimization target names the thing it could degrade (§0.2 Efficiency —
the Goodhart guard). Declared in prose by the mission author; no tooling
computes these numbers. Grammar, one line each:_ `- target: <what this mission
drives up or down> — counter: <what that could degrade> — floor: <the
observation that would retract the win>` _where `floor:` is written **before**
the work, not after — a counter-metric with no stated floor cannot fail. A
mission that optimizes nothing measurable writes_ `(none) — <why>`_; an
unexplained_ `(none)` _is the opt-out this block exists to prevent._

- target: _what this mission drives up or down_ — counter: _what that could degrade_ — floor: _the observation that would retract the win_

<!-- Worked example — the mission this block exists because of:
- target: total context chars per session ↓ — counter: reviewer-caught defects per phase — floor: any phase where the reviewer asks for context an earlier brief carried
-->
```

**Rationale for the example being the repo's own scar.** Context-economy
optimized character count, had no paired counter, and was retracted. An example
drawn from that failure teaches the failure mode, not just the syntax — and it
is honest, which a fabricated example would not be. It ships **commented** so a
fresh mission does not inherit a false claim; the live row uses italic
placeholders, matching the file's existing convention at the `docs/record
synced` obligation row.

**`floor:` is the segment that would have caught the actual documented
failure.** Target and counter alone reproduce context-economy exactly: a −19%
win, a vaguely-gestured "output quality", and no one having said in advance
what worse would look like. Recommended as required-but-prose-valued.

### 4.4 Messages

**State 3a — template missing the block.**

```
missing "## Paired metrics" section — every mission ledger must inherit the paired-metrics block (an optimization target and the thing it could degrade, named before the work rather than after)
```

**State 3b — a row with no `counter:`** *(the headline message the brief asks
for)*

```
paired-metric row has no `counter:` segment — an optimization target with no named counterweight can only go up: write `- target: … — counter: … — floor: …` (a target of `context chars per session ↓` pairs with a counter of `reviewer-caught defects per phase`) — got: <first 72 chars>
```

*Rationale:* the exemplar is inline and short because an agent editing a
deployed ledger does not have the template open. The full worked example stays
in the template, where an author authoring a ledger is already reading.

**State 3c — a row with no `floor:`.**

```
paired-metric row has no `floor:` segment — a counter with no floor cannot fail, and an unfailable counter is decoration: name the observation that would retract the win (`floor: any phase where the reviewer asks for context an earlier brief carried`)
```

**State 3d — placeholder survives the close.**

```
paired-metric row still carries its `_italic placeholder_` while the ledger is stamped `Closed:` (line 412) — a mission may not be reported closed on an unnamed counter-metric: fill the row, or write `(none) — <why this mission optimized nothing measurable>`
```

*Rationale:* deliberate echo of check 13's "a mission may not be reported closed
while an obligation is open", including the `(line N)` cross-reference.

**State 3e — bare `(none)`.**

```
`(none)` in "## Paired metrics" states no reason — the opt-out is allowed and must be written: `(none) — <why this mission optimizes nothing measurable>`; an unexplained opt-out is indistinguishable from a forgotten row
```

*Rationale:* converts a silent opt-out into a written claim a reviewer can
dispute. Same pattern the repo already uses for `probe: manual` — the
unautomatable case is legal, and stating it is the price.

### 4.5 Limitation, stated honestly

This check enforces **shape, not honesty**. A row reading
`target: X — counter: X-but-phrased-differently — floor: nothing` parses
cleanly. Deleting the section entirely also passes under legacy tolerance.
Both are caught by the checkpoint reviewer, not by lint, and that division of
labour should be written into the template's prose so nobody mistakes a green
gate for a judged metric. Same known hole as checks 11 and 13; accepting it
here is consistency, not oversight.

---

## 5. Journey 4 — DANGLING `depends-on:`

### 5.1 Grammar placement

`depends-on:` is an **optional final segment, after `probe:`**:

```
- [ ] OB-12 · added 2026-08-16 (planner) — do: … — when: … — probe: manual — depends-on: OB-9
```

Placing it *before* `probe:` folds it into the lazy `when:` capture, which
corrupts the segment every clock-leak check reads. Placing it after is correct
**only if `probe:`'s capture is changed from greedy `(.+)` to lazy `(.+?)`** —
see §7, break #1. Values are register ids only: `OB-<n>`, resolved against
`.plans/OBLIGATIONS.md`, from a mission ledger's `## Closing` block as well as
from the register itself. `OB-<n>` is by definition the durable namespace, so a
ledger row declaring an edge declares it into the register.

### 5.2 Typo vs never-written — how the messages tell them apart

The register is append-only and its ids are dense `1..N`. So the high-water
mark is the discriminator, and it yields two genuinely different diagnoses:

**State 4a — above the high-water mark ⇒ never written.**

```
`depends-on: OB-99` resolves to no row — .plans/OBLIGATIONS.md runs to OB-11, so OB-99 was never written: promote the obligation this row waits on into the register first, or drop the field (an edge into an empty slot is not an edge)
```

**State 4b — below the high-water mark ⇒ typo, or a deleted row.**

```
`depends-on: OB-4` resolves to no row, though .plans/OBLIGATIONS.md runs to OB-11 (nearest existing: OB-3, OB-5) — either the id is a typo, or a row was deleted and register rows are never deleted, which is a finding in itself: fix the id, or restore the missing row from history
```

*Rationale:* the `(nearest existing: …)` tail is a factual "did you mean"
rendered as data, in the style of `— got:`. It never asks a question — the
house voice states, it does not enquire — and it makes the typo case a
one-character fix without the author opening the register.

**State 4c — self-reference.**

```
`depends-on: OB-7` on row OB-7 — a row cannot wait on itself; name the row whose output this row's `when:` waits on, or drop the field
```

**State 4d — malformed value.**

```
`depends-on: "<value>"` must name exactly one register id in the form `OB-<n>` — mission-local row names stay in their ledger; an edge is declared into the durable namespace or not at all
```

*Rationale:* second clause is a deliberate echo of the existing strictLabel
message ("mission-local names stay in the mission ledger; the register is the
durable namespace").

**State 4e — register absent.**

```
row declares `depends-on: OB-9` but .plans/OBLIGATIONS.md does not exist — an edge can only resolve against the register: create it from `templates/obligations.md` and promote the row this one waits on
```

*Rationale:* fail closed. The natural instinct is to copy
`checkObligationsRegister`'s "absence passes" (correct *there* — a fresh
consumer has no register). Copied here it makes every declared edge in a
register-less repo a silent pass, which is the same class of bug as the
check-12 `FAIL CLOSED (ckpt-p2 F3)` fix already in this file.

### 5.3 State 4f — fired ahead of its dependency *(proposed addition)*

Beyond the brief. Flagged for accept/decline at the gate.

```
row is fired `[x]` but `depends-on: OB-9` is still open — a row may not fire ahead of the row it declares it waits on: either the edge is wrong or the fire was premature
```

**Why it is worth the ten lines:** this is OB-9's own failure, caught. Three
merged PRs deferred the version bump while *"OB-5/6/8's install conditions
silently depended on it"* — rows firing on conditions their prerequisite had
not met. Resolution-only checking documents that edge; this check *enforces*
it. One hop, no traversal, so it does not touch the brief's deferral of
transitive cycle detection.

### 5.4 Deliberate non-finding — and the inert-field risk

`depends-on:` pointing at a **fired `[x]`** row is not an error. It is,
however, the single most useful moment the field creates: the dependency is
satisfied, so this row's `when:` may now be live.

**A declared edge that nothing ever reads is documentation, not machinery.** If
v1 ships resolution-only, the field costs authors keystrokes and returns
nothing — the definition of an inert governance artifact, and a candidate for
quiet abandonment. The minimum that makes it a real edge is one advisory line
at settle's probe step:

```
OB-12 · depends-on OB-9 (fired 2026-08-16) — dependency satisfied; probe this row's `when:` now
```

Recommended as in-scope. Decision for the gate.

---

## 6. Journey 5 — THE CLEAN PATH

### Position: affirm, with exactly one number, on the same line.

```
lint: clean (4 frozen fixtures verified)
```

**The argument.**

This mission's chartering failure mode is *measurement decay — the sensor
drifts while the dashboard stays green*. The contaminated-fixture incident
happened while `lint: clean` printed on every push. A gate that reports only
absence-of-failure is a dashboard; a gate that reports **what it checked** is
an instrument. That distinction is the whole mission, and it costs eleven
characters.

Concretely, silence fails in a way nothing else catches: if the manifest empties
during a sloppy unfreeze, a glob stops matching, or someone comments out the
check, **every other check still passes and the output is byte-identical to a
healthy run.** The count is the only signal whose disappearance is visible.
Everything else this mission builds is self-announcing — a dangling edge fails
loudly; a missing counter-metric fails loudly; a missing *freeze* fails
silently, because there is nothing left to check.

**Why one number and not a report.** The counter-argument is real: the repo
prizes a one-line gate, and every gate that adds chatter trains people to skim
it. Seventeen `ok <check>` lines would be a regression. So: same line, one
parenthetical, no new lines. Scan cost is unchanged.

**Why the other two checks get no affirmation.** Asymmetry is the point, not an
oversight. Dangling edges and missing counter-metrics are claims someone made —
if unmade, nothing was lost. A frozen set is a claim about *the instrument
itself*, and its absence is indistinguishable from health. Only the
undetectable-when-absent thing needs affirming.

**Three supporting properties:**

1. **Prefix-compatible.** Every historical `lint: clean` quoted as evidence in
   `.plans/` stays a prefix of the new line. I confirmed nothing in the repo
   parses this string — CI runs `node tools/lint.mjs` and checks the exit code;
   only `checkHookBehavior` parses a *delegated* harness's stdout, never lint's
   own.
2. **It upgrades the audit trail for free.** OB-6's fired evidence literally
   reads `` `lint: clean` · `hook-test: clean` ``. Under this change, that same
   paste records *how large the held-out set was at that moment* — turning a
   liveness claim into a measurement claim, at zero authoring cost.
3. **It is falsifiable.** A number that goes to zero, or a clause that vanishes,
   is a visible event in a CI log and in a pasted evidence line. `clean` alone
   can never be wrong, which is precisely what makes it uninformative.

### The load-bearing pairing

The affirmation is only honest if **zero is a finding, not a number**. If the
manifest can empty and the gate prints `lint: clean (0 frozen fixtures
verified)`, the affirmation becomes the very thing it was built to prevent: a
green dashboard over a dead sensor. State 1e (§2.6) is not an optional
companion to this decision — it is the half that makes it true.

### And the parenthetical must be conditional

In a consumer repo with no `evals/`, the line stays exactly `lint: clean`.
Hardcoding the parenthetical prints `(0 frozen fixtures verified)` in every
consumer repo — a false affirmation, shipped. See §7, break #6.

### Variant offered, not recommended

`lint: clean (4 of 12 scenarios held out, verified)` exposes the held-out
*fraction*, which decays silently as scenarios are added. Richer, and a real
Goodhart signal — but it conflates file-granular rows with scenario counts and
needs a second definition to stay truthful. Offered for the gate; I recommend
the simple count.

---

## 7. Where a naive implementation breaks the existing voice or the check itself

Ordered by damage.

**1. `probe:`'s greedy capture silently swallows `depends-on:` — the check
never runs.** `OB_ROW` ends `— probe: (.+)$`. Appending `— depends-on: OB-9`
lands *inside* the probe segment; the row still parses, lint still passes,
`OB_FIRED` still matches, and the edge is never validated. The register would
be full of edges that look declared while nothing checks any of them — a
silently-inert governance check, which is this mission's own thesis failing
inside its own implementation. Fix: `probe: (.+?)(?: — depends-on: (OB-\d+))?$`.
The lazy quantifier is load-bearing; with a greedy `(.+)` the optional group
can never match. **Any test for this feature must include a passing row that
carries a valid `depends-on:` and assert the captured group is non-empty** —
asserting only that bad rows fail cannot distinguish "working" from "inert".

**2. Building the id set with a file-wide `/OB-(\d+)/g`.** The resolver must
collect ids from *parsed row labels only*. Two live counterexamples in this
repo today: OB-9's own prose contains the string `OB-5/6/8`, and
`templates/obligations.md` ships its example row `OB-1` **inside an HTML
comment** — which `checkObligationsRegister` already deliberately skips. A
regex scan harvests phantom ids from both, so `depends-on: OB-1` would
"resolve" in a fresh consumer repo whose register is the untouched template.

**3. Hook voice bleeding into `fail()`.** `hooks/hooks.json` shouts
`❌ BLOCKED: never push while checked out on main` — emoji, capitals, second
person, trailing period. A frozen-fixture violation *feels* like a block, so
the pull toward `❌ FROZEN FIXTURE: You may not edit held-out evals!` is strong.
It would break the voice of all 60 existing messages at once. Two surfaces, two
voices: hooks interrupt a live agent mid-action and may raise their hand;
`fail()` is a compiler-style diagnostic and never does.

**4. Preaching.** The frozen message is the one place in this codebase where a
lecture is tempting, because the check exists to stop a specific dishonesty.
The house never lectures and never imputes motive — "a fixture tuned to the
system it measures can no longer measure it" is a statement about fixtures. Any
message that addresses the reader's intentions ("if you are trying to make a
test pass…") insults four honest refactorers to inconvenience one cheat.

**5. Copying "absence passes" into the depends-on resolver.**
`checkObligationsRegister` skips when the register is missing — correct there,
wrong here. See §5.2, state 4e.

**6. Unscoped frozen check / unconditional affirmation.** `evals/` exists only
in this repo. Both the missing-manifest finding and the clean-line parenthetical
must be gated on `evals/scenarios/` existing, or every consumer repo gets a
false failure and a false affirmation respectively.

**7. Reporting journey 1 against the manifest.** The `file:line` prefix is a
navigation affordance. A content mismatch is evidence *in the fixture* and must
report there; a malformed or orphaned manifest row is evidence *in the manifest*
and must report there. Same check, two report targets, deliberately. Getting it
backwards makes every violation open the wrong file.

**8. `fail(file, 1, …)` for whole-file findings.** Convention is `null` for
"about the file", `1` only for frontmatter. A content-hash mismatch is not a
line-1 problem.

**9. Printing full 40- or 64-char hashes.** Two of them plus the prose doubles
the message. Short (7) in the diagnosis; the full value is one
`git hash-object <path>` away, and keeping it a command away is the same
asymmetry that keeps the hatch off the default path.

**10. Repeating the reported file's path in the message body.** No existing
message does, except inside a runnable command — which is exactly the exception
journey 1's `git checkout --` clause relies on. Keep the exception; do not
generalise it.

**11. Four near-identical 370-char findings on one sweeping refactor.** If a
command rename touches all four frozen scenarios, the author gets four long,
near-identical messages. Per-occurrence reporting is the existing convention
(`checkObfuscation` reports per line) and each finding here does carry a
distinct path, `holds:` text and hash pair — so I recommend keeping it, with
the message kept as tight as drafted. Flagged honestly as a real ergonomic cost
of the design, not hidden.

**12. A `depends-on:` example added to the grammar prose that starts a line
with `- `.** `obBullets()` matches `^- `, so a wrapped grammar illustration
beginning a line with `- ` becomes a parsed row. The existing grammar prose in
`obligations.md` and `mission-state.md` avoids this by accident of wrapping;
extending it needs the same care.

---

## 8. Open decisions for the human at the gate

| # | Decision | My recommendation |
|---|---|---|
| D1 | Manifest format — `evals/FROZEN.md` (markdown rows) vs JSON | Markdown. The diff is the product, and it is the repo's fourth append-only row grammar rather than a new format |
| D2 | Hash — `git hash-object` blob id vs sha256 of file bytes | Blob id. No `.gitattributes` in this repo, so sha256 of working-tree bytes breaks on CRLF checkouts; and the author reproduces the blob id with one command the message can name |
| D3 | Counter-metric timing — enforced at authoring, or at the `Closed:` stamp | At the stamp. Reuses `checkClosing`'s exact precedent and machinery; a mission may start without knowing its counter, not close without one |
| D4 | `floor:` — required third segment, or target+counter only | Required, prose-valued. It is the segment that would have caught context-economy |
| D5 | Clean line — silent, or `lint: clean (4 frozen fixtures verified)` | Affirm (§6) |
| D6 | State 4f (fired-ahead-of-dependency) — in v1 or deferred | In v1. It is OB-9's own failure, one hop, ~10 lines |
| D7 | Settle-time advisory on a satisfied dependency | In v1. Without a reader, the edge is documentation, not machinery |
| D8 | Fixture-tree granularity (state 1c) — v1 or v2 | Human's call. If deferred, record the gap in the manifest header rather than leaving it unwritten |
| D9 | State 1a length — variant A (385 chars, 45% over the house ceiling) vs C (336) | A. §2.7 shows the measurement and what C gives up |

---

## 9. Boundaries

I propose; the human decides at the approval gate; the implementing agent
writes the code. This document specifies **message text, states, journeys and
grammar** — not the hashing implementation, not the manifest parser, and not
open shape decisions #1–#3 from the brief, which remain the architect's. Where
a DX requirement constrains the mechanism (§2.1, §2.4) I have said so explicitly
and stated the requirement rather than the implementation.

Independence note: I designed this surface. Whoever evaluates it at the
checkpoint should not be me.
