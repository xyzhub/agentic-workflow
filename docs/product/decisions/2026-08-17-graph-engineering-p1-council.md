---
status: living
owner-agent: reviewer
refresh-trigger: event
---

# Council record — PR #38 (graph-engineering P1, v1.44.0)

_Three review rounds, ten lenses, one disposition table. This file exists
because the councils' own findings had nowhere durable to land: the PR that
argues a promise needs a trigger left its reviewers' findings in a transcript
that compacts (round-3 finding A). Every material finding below is recorded
with what it claimed, what happened to it, and where to verify._

**Namespace note.** Reviewers numbered findings independently, so a bare
`F<n>` is ambiguous across this session — `F1` names four different things.
Rows here are keyed `R<round>.<lens>.<n>`. The architect's and DX memos have
their own internal `F<n>` sequences unrelated to any of these.

## Rounds

| Round | Tip reviewed | Lenses | Verdicts |
|---|---|---|---|
| 1 | `ea4155a` | premise · silent-inertness · regression/consumer · docs coherence · record integrity | 4 REQUEST CHANGES, 1 HOLD |
| 2 | `936aad7` | record honesty (2 lenses died to host sleep; their scope was self-covered — see below) | PROCEED-WITH-CHANGES |
| 3 | `7ca5c1e` | register/consumer · record honesty (1 lens still running at time of writing) | REQUEST CHANGES, PROCEED-WITH-CHANGES |

**Self-covered after agent deaths (round 2).** Three lenses died mid-run when
the host slept. Their highest-risk items were executed directly rather than
relaunched: the invocation-form matrix (six forms), the harness mutation proof
(both directions), the carrying-commit topology matrix (seven topologies), and
the old-vs-new predicate differential. Two defects were found this way —
`c75fc31` and `495b903`. This is disclosed, not claimed as equivalent to
independent review: three lenses' full scope was never run.

## Material findings and dispositions

| Key | Claim | Disposition | Where |
|---|---|---|---|
| R1.premise | The mission's founding evidence is false — the eval fixtures were never contaminated, and the "Goodhart" figure is a token comparator that was never optimized | **UPHELD.** Scope items 1 and 2 dropped; the mission was never built as briefed | brief `## Locked decisions` |
| R1.inert.1 | `depends-on:` cannot fire in the row shape `settle.md` instructs authors to write | **UPHELD.** Feature reverted entirely | `7ca5c1e`, OB-13 |
| R1.inert.2 | The indented-continuation form is invisible to both the row grammar and the raw scan | **UPHELD.** Recorded as the reason OB-13 must restate the design | OB-13 |
| R1.inert.3 | Ledger `## Closing` blocks got no edge validation at all | **MOOT** on revert; folded into OB-13's scope | OB-13 |
| R1.regress.H3 | The `after N <units>` branch false-positives on ordinals and noun modifiers (10 of 12 honest conditions rejected) | **UPHELD.** Guard rebuilt | `8b842ad` |
| R1.docs.F3 | OB-9's seeded probe errors (exit 2) — the path exists in no project | **UPHELD.** Now `probe: manual` | `936aad7` |
| R1.docs.F5 | The carrying-commit command returns the wrong commit in the no-PR case it exists for | **UPHELD.** `--merges --topo-order`, verified across 7 topologies | `936aad7` |
| R1.record.F1/F2 | OB-10's `when:` was rewritten in place, breaching the register's append-only rule, citing a precedent that does not support it | **UPHELD.** Restored verbatim; supersession appended | `936aad7` |
| R1.record.F4 | Four protocol record duties unmet (CHANGELOG, JOURNEY, overview.html, version stamp) | **UPHELD.** All four addressed | `936aad7`, `7ca5c1e` |
| R2.F1 | The promised `depends-on:` return had no register row | **UPHELD** → OB-13 | `7ca5c1e` |
| R2.F2 | The template pointed at a §10 key that did not exist | **UPHELD.** `Version pin` added to both profiles; row made self-sufficient | `7ca5c1e`, `7ce7b41` |
| R2.F3 | OB-9's evidence may have been false when written | **WITHDRAWN by the reviewer.** `git show 5821fcf:…/mission-state.md` shows the row at line 78, probe at 82 — the reviewer's sandbox snapshot had been mutated | verified |
| R2.F5 | The head/tail bare-word rule reopened smuggling for 3+ clause conditions | **UPHELD.** Replaced by a count rule — which then failed in turn (R3.reg.F1) | `7ca5c1e` |
| R2.F6 | OB-12 asserted a manifest version its own commit falsified | **UPHELD.** Reworded to as-observed | `7ca5c1e` |
| R2.F8 | JOURNEY and overview.html stale | **UPHELD.** Both written | `7ca5c1e` |
| R2.F10 | The OB-10 breach is disclosed only in the register, not the CHANGELOG | **RULED, not fixed.** The register is the right home for a register-integrity breach; the CHANGELOG covers consumer-visible change. Recorded here so the ruling is auditable | this file |
| R2.F11 | OB-10 is a knowingly-dead row whose re-conditioning has no trigger | **OPEN — the human's call.** See "Open for the owner" below | this file |
| R3.reg.F1 | The count rule opened a cheaper hole: `weekly, monthly` passes — a condition with no observable clause | **UPHELD.** Any bare clause now blocks, with one accepted false positive | `7ce7b41` |
| R3.reg.F2 | The new §10 row asserted a firing rule contradicting the row it points at | **UPHELD.** Reworded | `7ce7b41` |
| R3.reg.F5 | The positive-capture requirement was attributed to the architecture memo; it is the DX memo's, and was written against a capture the recommended design lacks | **UPHELD.** OB-13 and CHANGELOG corrected | `7ce7b41` |
| R3.rec.A | The council's findings have no durable home | **UPHELD.** This file | this file |
| R3.rec.B | The deviation note says commits "predate the bump"; four follow it, unstamped | **UPHELD** | see CHANGELOG |
| R3.rec.C | overview.html credits PR #36 to the v1.43.0 ship; it merged 09:02, an hour after the release at 07:57, and OB-12 depends on the opposite | **UPHELD** | verified via `gh pr view` |
| R3.rec.D | The count rule's inverse (≥2 bare words) passes | **ALREADY FIXED** by `7ce7b41` before the lens reported; verified `once ci is green, weekly, and nightly` → BLOCK | verified |
| R3.rec.E | `lint-test.mjs`'s header says "EVERY case … outside the implementer's head" and then that invented cases are marked | **UPHELD** | see harness header |
| R3.rec.G | OB-13 tells the next implementer to build the indented form without recording why it failed | **UPHELD** | OB-13 |
| R3.rec.H | The JOURNEY entry's "every defect has the same shape" excludes the record-integrity half | **UPHELD** | JOURNEY |

Nits folded without individual rows: prose/wording findings in R1.docs (F8, F9, F11–F14), R1.record (F5, F7–F9), R3.reg (F3, F4, F6–F8). All were either fixed in the commits above or are covered by the recommendations below.

## Open for the owner

1. **R2.F11 — OB-10 is knowingly dead.** Its condition names work that was
   falsified and dropped, so it can never fire, and nothing triggers
   re-conditioning. The `obligations-due` hook will count it as due
   permanently, degrading that signal. Options: leave it parked (honest,
   mildly noisy), or decide the eval baseline is happening and re-condition it
   by appending. Not decided by an agent.
2. **The version-stamp deviation.** Four `fix:` commits after `936aad7` carry
   no version stamp, against the 2026-07-08 local amendment. Rebasing is
   available but would invalidate five SHAs cited as evidence inside the
   register's own fired rows. Recorded rather than resolved.
3. **This PR has no mission ledger** despite the brief declaring
   `Class: mission`. That is the root cause of finding R3.rec.A — there was no
   `## Closing` block for the council's dispositions to land in, and the
   mission-close version gate this PR ships is a gate this PR itself cannot
   bind. Whether to author the trio retroactively or reclassify the work is
   the owner's call.
