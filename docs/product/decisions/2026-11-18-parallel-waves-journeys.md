---
status: draft-for-approval
owner-agent: designer
feature: parallel-waves
date: 2026-11-18
companion-of: 2026-11-18-parallel-waves-brief.md
---

# User journeys and information architecture — parallel waves

_Authored by the `designer` from the locked feature brief
(`2026-11-18-parallel-waves-brief.md`). This file owns the **owner-facing
surface** of the feature: what the orchestrator prints, what the mission ledger
records, and what `/agentic-workflow:doctor` reports. It does not decide the
mechanism — the five architect memos do (brief, "Open shape decisions"). Every
reporting requirement below is written to hold whichever way those memos land._

**Section references.** A bare `§N` is a section of the protocol
(`templates/WORKFLOW.md`) — `§0.2` the pillars, `§5` the mission lifecycle,
`§6.0` the plain-report rule, `§6.1` the documentation of record, `§10` the
project profile, `§12` the owner channel. Sections of **this** file are always
written with their title, as "the wording table (§8 below)". Where this file's
own numbering could collide, the word "below" is attached.

**There is no graphical surface here.** The truthful-UI pillar (§0.2 — "the
product tells the truth and never dead-ends", "the UI never claims what the
backend doesn't confirm") is applied to a terminal transcript and two markdown
files. The question is never how it looks. It is whether the owner can tell, at
a glance and without reading code: **what is running, what landed, what did not,
and what is waiting on them.**

## Read this first — one id conflict in the brief

The brief groups its acceptance criteria into five journeys and labels
**J5 "the numbers are honest" (AC-14, AC-15, AC-16)**. The design task this file
answers labels **J5 "the profile row is absent, so everything runs serially"** —
which in the brief is **AC-2, under J1**.

Resolved here without renumbering anything, because the planner and the
plan-judge key on these ids:

- **J5 below is the serial walk-through** the design task asked for, and it
  carries **AC-2**.
- **J5b below is the brief's J5** — the honest-numbers requirements, carrying
  **AC-14, AC-15, AC-16**. Same journey number, explicit second half, no id
  moved or dropped.
- The acceptance-criterion map (§10 below) ties every one of AC-1 to AC-18 to a
  journey step, so the plan-judge can check coverage without reading prose.

The planner should keep the brief's grouping and treat "J5b" as a sub-label, not
a sixth journey.

---

## 0. The report surface — the rules every message obeys

### 0.1 Words every owner-facing message must define

This owner answered "I did not understand these choices" to one jargon-written
question in this very interview (brief, line 97). The feature's vocabulary is
all new, and WORKFLOW.md §6.0 (the plain-report rule) requires defining every id
and term on first use. These terms may **never** appear bare in a printed
message, and an **error** message must carry its own definitions even if the
manifest already printed them — an error can be read cold in the owner channel
(§12) hours later, with no manifest above it:

| Internal term | What a message says instead |
|---|---|
| wave | "several briefs at the same time" — and the word *wave* in quotes once, when the manifest first prints |
| declared write set | "the files it said it would change" |
| drift | "changed files it had not listed" |
| orchestrator-only hot file | "a file only the mission driver writes" |
| worktree | "its own copy of the repo" |
| integration | "merging each brief's branch into the phase branch, in a fixed order" |
| the cap | "the most briefs allowed to run at once (3 in this project)" |
| a bare brief id (`S3`) | "the lint-rules brief (S3)" — plain name first, id in parentheses, every time it appears in a message that could be read cold |

Ledger rows are **data, not prose** (§6.0 explicitly exempts them) and stay
terse. The expansion rule applies to the terminal, the owner channel (§12), and
any question put to the owner.

### 0.2 The in-flight truth rule

The orchestrator may print **only events it observed**. There are exactly six:

`started` · `returned` · `committed` · `checked` (the write-set comparison) ·
`merged` · `reviewed`

Everything between two of those is unobserved. No percentage, no "nearly done",
no "S4 is on its tests now", no spinner implying knowledge of a running brief's
internals. A line the orchestrator cannot source to one of the six is a
fabrication, and under concurrency it is the easiest fabrication to commit —
see the worst-risk section (§11 below).

Two consequences the wording must survive:

- **Return timing is undecided.** The isolation and spawn mechanism is architect
  memo 2. Returns may arrive one at a time over an hour, or all three at once at
  the end. Every in-flight line is therefore written to read correctly in both
  cases: the "still running" fact is printed as a list that may be empty
  ("Still running: none").
- **The ledger proves "started and not yet returned" — never "alive".** A
  `[~]` row with a `spawned` time and no `returned` time means exactly that the
  orchestrator recorded a spawn and recorded no return. It is not evidence the
  brief is working. The fresh-session rule (§9.4) is therefore: **inspect the
  branch and the copy of the repo; never assume either way.**

### 0.3 What is proposed here, and what is locked

Locked by the owner (brief, Interview answers): waves fire automatically up to
the cap with the §10 row as the consent; cap 3; drift blocks integration;
on a mid-wave failure the passing briefs integrate and the failed one takes its
one retry; working-copy preparation is in v1; one review per wave.

**Proposed by this file** (the architect or the owner may overrule; nothing below
is presented to the owner as settled):

| Proposed | Owner of the real decision |
|---|---|
| Ledger block name `## Wave log` and its row grammar (§9) | architect memo 5 / planner |
| §10 row name **Parallel waves**, value `on (cap 3, allowed YYYY-MM-DD)` / `off` | architect memo 5 |
| §10 row name **Working-copy recipe** | architect memo 5 |
| Brief header field `writes:` and the literal `writes: none (verification only)` | architect memo 1 (grammar + granularity) |
| `node tools/waves.mjs status <mission>` — a read-only printer of the running wave, for an owner who wants to check mid-silence | architect memo 2; **this is an addition to AC-5, not part of it** |
| Drift is measured against the **wave's base commit**, not the moving phase-branch head (§4.5) | architect memo 1 |
| `Sessions used:` counts briefs started, so a wave of three charges 3 (J5b, §6 below) | architect memo 4 |
| A "wave of one" is not a wave and keeps today's single phase checkpoint (§0.4) | architect memo 4 / planner |
| The generated catalog, the CHANGELOG and lockfiles become mission-driver-written for the duration of a wave (§11, finding 1) | architect memo 5 — this one needs a protocol decision, not just a report decision |

### 0.4 One reading that changes the review count — state it, do not bury it

AC-8 says "exactly one fresh independent reviewer runs per wave". Read
literally, with waves of one, a four-brief phase becomes four reviews where
today it is one — the opposite of the efficiency pillar, and it inflates
`Estimate:` (which counts briefs + checkpoints).

**The reading this file designs to:** a wave review **replaces** the phase
checkpoint review for the briefs it covers. A phase that runs as one wave has
one review, exactly as today. A phase that runs as two waves has two. A phase
with no concurrent group runs serially and keeps its single phase checkpoint —
a group of one is never announced or reviewed as a wave.

**The part-waved phase** (some briefs waved, the rest serial — degraded state D2,
and the case §3.1 walks) is the one that costs an extra review: the wave review
covers the briefs that ran together, and the **phase checkpoint still runs at the
end of the phase** over the serial remainder. Two reviews where today there is
one. That is the honest price of mixing, and it has two consequences the plan must
carry:

- `Estimate:` counts **one checkpoint per computed wave, plus the phase
  checkpoint whenever any brief in the phase runs serially.**
- The phase does **not** go to staging when the wave review approves. It goes to
  staging after the phase checkpoint, as always. A wave review is not a phase
  end — §3.1 shows this, and W8 is the sentence that stops the misreading.

Effect on the plan: `tools/waves.mjs` is deterministic over the sessions file
(AC-5), so the planner can run it at plan time and count the checkpoints exactly.
`Estimate:` stays honest without guessing.

---

## 1. Information architecture of the wave report

The smallest set of facts the owner needs, at each moment, in this order. Five
moments. Facts are named; nothing here prescribes layout beyond ordering and
the §6.0 rule that structured status stays tabular and narrative stays plain.

**Moment 1 — before anything runs (the wave manifest).** The owner's map. Printed
in full, once, and written to the ledger first (write-ahead, §5 LA-6).

1. What is about to happen, in one sentence, with the count.
2. Which briefs — plain name + id, one row each.
3. Why these may run together — the shared-file fact, stated positively ("none
   of them changes a file another one changes").
4. What each one is allowed to change — the declared files, summarised.
5. The merge order, and the sentence that stops the worst misreading:
   **finishing first does not mean landing first.**
6. What the cap excluded, if anything, and where the cap is recorded.
7. Where each brief's copy of the repo is, and whether preparation ran.
8. The silence contract: nothing prints until the first brief finishes; that is
   expected; here is the file that holds the live state.
9. What is needed from the owner: nothing.

**Moment 2 — a brief returns.** One block per return, in whatever order they
arrive. Four facts, no more:

1. Which brief (plain name + id) and its outcome in one word.
2. Where its work is — the branch and the commit, because "finished" with
   nothing committed is not finished (`commands/mission.md`: empty changes on
   `done` is suspicious).
3. The write-set check result, and against which baseline commit.
4. Its position in the merge order, said as "waiting, not landed", plus the
   still-running list (possibly empty).

**Moment 3 — integration.** Two lines per brief, in order: an **intent** line
before the merge and a **result** line after. The intent line is not ceremony —
it is the only thing that makes a crash between merge 1 and merge 2
reconstructible (§9.4). Then one closing fact: the integrated commit range, the
briefs inside it, and the briefs left out with the reason.

**Moment 4 — the wave review.** Spawn line first (LA-6: an unrecorded in-flight
review is indistinguishable from a stall): one reviewer, which commit range,
which briefs that range covers, and that nothing prints until it returns. Then
the verdict, naming the briefs it covered. Then — unless every brief in the phase
has landed — the sentence that the phase is **not** finished, and what is left:
a brief that failed out of the wave (W8), briefs that must still run one after
another (W32), or both.

**Moment 5 — a decision is needed.** One question at a time. The question
carries: what happened in plain words, which brief, the concrete paths or
reason, the choices with their consequence, what is still running, and whether
the answer stops the rest. When two briefs both need a ruling, ask in merge
order and say how many are waiting.

---

## 2. J1 — the owner turns waves on (AC-1, AC-3)

**Vantage at every step is stated in the step.**

1. **Owner runs `/agentic-workflow:bootstrap` on a new project, or
   `/agentic-workflow:adopt` on an existing one.** The owner sees the normal
   profile interview. One new question, in plain terms: whether briefs that
   change different files may run at the same time, and at most how many.
   Default if unanswered: **off** — fail-closed, matching the §10 Publish-policy
   pattern (AC-2).
2. **The command writes one §10 row** (proposed shape):
   `| **Parallel waves** | on (cap 3, allowed 2026-11-19) |`
   The owner sees the row quoted back in the command's closing report, with the
   sentence that this row **is** the consent — no mission will ask again.
3. **Owner runs `/agentic-workflow:doctor`.** The owner sees rows in doctor's
   existing table (doctor prints its own status glyph in the first column; the
   verdict words below are what each row means):

   | Verdict | Row the owner reads | The one fix |
   |---|---|---|
   | green | Parallel waves: on, at most 3 briefs at once (allowed 2026-11-19) | — |
   | green (advisory) | Parallel waves: off — briefs run one after another | — (an absent row is a setting, not a defect) |
   | yellow | Parallel waves: the row is still the unfilled example text, so it reads as off | edit the row in `docs/WORKFLOW.md` §10 |
   | yellow | Parallel waves: the limit reads `three`, which is not a number, so the row reads as off | edit the row in `docs/WORKFLOW.md` §10 |
   | yellow | Working-copy recipe: not recorded — briefs that need the app running or a database cannot run alongside others | fill the row in `docs/WORKFLOW.md` §10 |
   | green | Working-copy recipe: install, secrets file and throwaway database all recorded | — |

   Doctor precedent honoured: an absent row is green-advisory ("off" is a valid
   configuration, not rot); a malformed or placeholder row reads as absent and
   **says so**; every yellow row carries exactly one fix.

   **`/agentic-workflow:doctor fix` must never write either row, in any mode.**
   AC-1 gives doctor **read** access to the consent row, and the row *is* the
   owner's standing consent — a repair mode that fills it in, or guesses a cap
   from a malformed value, would manufacture the consent it is supposed to
   report. The working-copy recipe is the same shape of problem for a different
   reason: doctor cannot know this project's install command, which secrets file
   to copy, or how to make a throwaway database. Both fixes are therefore an
   owner edit (or a re-run of `/agentic-workflow:bootstrap` /
   `/agentic-workflow:adopt`, which ask), and doctor's job ends at naming the row
   and the file. This is the one place the feature deviates from doctor's "fix
   what is mechanical, local and free" default, and the reason is that neither
   row is mechanical.
4. **Owner changes the cap later.** The owner edits the §10 row. Nothing else
   changes; the next phase start reads the row fresh. Every message that mentions
   the cap names the row as the place to change it, so the owner never has to be
   told where it lives.

**States in J1.**

- *Empty:* no row → J5. Row present but `off` → J5, with the message naming the
  row's current value so the owner can see the switch is reachable.
- *In flight:* none. J1 has no concurrency.
- *Error:* malformed value → treated as off, reported as yellow with the fix.
  A cap of `0` or a negative number is malformed, not "off by another name" —
  say which it was.
- *Degraded:* the row says on, but the working-copy recipe is missing → waves
  still run for briefs whose checks need no services; see D4 in §7.

---

## 3. J2 — a wave runs clean (AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-16)

Setting: phase 2 of the `parallel-waves` mission has five briefs. Three change
nothing another changes. The cap is 3.

1. **Owner sees the phase start.** The orchestrator has already run the wave
   tool and already written the ledger. The manifest prints (Moment 1). The
   owner's takeaway is a map of three things and one promise of silence.
2. **Owner sees the preparation fact, inside the manifest.** One line per copy
   of the repo: install, secrets file, throwaway database — done or not done.
   The owner needs this because a brief that fails for an unprepared copy looks
   exactly like a brief that fails for its code.
3. **Owner sees nothing, possibly for an hour.** This is the designed state, not
   a gap. It was announced in step 1 and the live state is in the ledger. An
   owner who wants to check opens `.plans/parallel-waves.state.md` (or the
   proposed `node tools/waves.mjs status parallel-waves`, §0.3).
4. **Owner sees returns, in completion order, not plan order.** One block each
   (Moment 2). Every block says "waiting, not landed".
5. **Owner sees integration, in the recorded order** (Moment 3) — intent line,
   merge line, per brief, then the range.
6. **Owner sees one review spawn and one verdict** (Moment 4) — over the range,
   naming all three briefs. Not three reviews.
7. **Owner sees the two remaining briefs run one after another**, because they
   change files the waved three change. Phase 2 is not over when the wave review
   approves (§0.4, the part-waved phase).
8. **Owner sees the phase close as it always has** — the phase checkpoint, then
   staging, verify, pull request (WORKFLOW.md §5 venture flow). Waves change
   nothing after integration.

### 3.1 The literal printed timeline, with the ledger after each event

Phase 2 has five briefs; three of them change no shared file. Returns arrive out
of order. `>` lines are what the owner reads.

```
14:02  > Running three briefs at the same time (a "wave") in phase 2. None of
       > them changes a file another one changes, so they cannot overwrite each
       > other. Each builds in its own copy of the repo.
       >
       > | Brief                        | May change                              | Merge position |
       > |------------------------------|-----------------------------------------|----------------|
       > | the lint-rules brief (S3)    | tools/lint.mjs, tools/lint-test.mjs     | 1 of 3         |
       > | the wave-tool brief (S4)     | tools/waves.mjs                         | 2 of 3         |
       > | the profile-row brief (S5)   | templates/WORKFLOW.md §10, commands/doctor.md | 3 of 3   |
       >
       > I merge them into the phase branch in that fixed order when they
       > finish. Finishing first does not mean landing first.
       >
       > Two more briefs in phase 2 change files these three change, so they run
       > afterwards, one after another: the docs brief (S6), which also changes
       > tools/lint.mjs, and the changelog brief (S7), which also changes
       > templates/WORKFLOW.md. Phase 2 is not finished when these three are
       > reviewed.
       >
       > Each copy of the repo was prepared the way this project records:
       > install ran, the example secrets file was copied in, a throwaway
       > database was created. Copies are under .worktrees/p2-s3, -s4, -s5.
       >
       > Nothing will print until the first brief finishes, which can take a
       > while. That silence is expected, not a stall — the live state is in
       > .plans/parallel-waves.state.md under "Wave log". Nothing is needed
       > from you.

       ledger now: wave 2.1 block written with base abc1234, all three briefs
       "spawned 14:02", planned order S3 -> S4 -> S5, the two exclusions with
       their shared files, Sessions used: 6 -> 9, Next up: phase 2 wave 2.1 —
       S3, S4, S5 running

14:20  > The profile-row brief (S5) finished and committed to branch
       > mission/parallel-waves-p2-s5 (commit 5555eee). The files it changed
       > are the files it said it would change — checked against abc1234, the
       > phase branch as it stood when the wave started. It is position 3 of 3
       > in the merge order, so it is waiting, not landed.
       > Still running: the lint-rules brief (S3) and the wave-tool brief (S4).

       ledger now: S5 row gains "returned 14:20 done, commit 5555eee, check
       green, held"

14:41  > The lint-rules brief (S3) finished and committed to branch
       > mission/parallel-waves-p2-s3 (commit 1111aaa). The files it changed
       > are the files it said it would change. It is position 1 of 3, so it is
       > waiting, not landed.
       > Still running: the wave-tool brief (S4).

       ledger now: S3 row gains "returned 14:41 done, commit 1111aaa, check
       green, held"

15:08  > The wave-tool brief (S4) finished and committed to branch
       > mission/parallel-waves-p2-s4 (commit 3333ccc). The files it changed
       > are the files it said it would change. It is position 2 of 3.
       > Still running: none — all three are in.

       ledger now: S4 row gains "returned 15:08 done, commit 3333ccc, check
       green, held"; Next up: phase 2 wave 2.1 — merging in order S3, S4, S5

15:09  > Merging the lint-rules brief (S3) into the phase branch now —
       > position 1 of 3.
       > Merged. The phase branch carries the lint-rules brief (S3).

       ledger now: S3 row gains "merge intent 15:09" BEFORE the merge runs,
       then "merged 15:09 (2222bbb)"

15:10  > Merging the wave-tool brief (S4) — position 2 of 3.
       > Merged.
15:11  > Merging the profile-row brief (S5) — position 3 of 3.
       > Merged.
       >
       > All three briefs are on the phase branch mission/parallel-waves-p2
       > (abc1234..6666fff). One reviewer now checks the three together, not
       > one each.

       ledger now: "integrated range abc1234..6666fff, briefs in S3 S4 S5,
       briefs out none"; Next up: phase 2 wave 2.1 review

15:12  > One reviewer is now checking the three briefs of this wave together,
       > over abc1234..6666fff. This takes a while; nothing will print until it
       > returns.

       ledger now: "wave review spawned 15:12 over abc1234..6666fff covering
       S3, S4, S5" — LA-6: the spawn is recorded so a watcher sees an
       in-flight review rather than a stall

15:58  > The reviewer approved all three briefs that ran together: the
       > lint-rules brief (S3), the wave-tool brief (S4) and the profile-row
       > brief (S5).
       >
       > Phase 2 is not finished. Two briefs are still to run, one after
       > another, because they change files these three changed: the docs
       > brief (S6), then the changelog brief (S7). Phase 2 goes to staging
       > after those two and the phase check that follows them.
       >
       > Those three briefs together: 1 hour 9 minutes from start to all
       > merged, 412,000 tokens. Run one after another on 2026-11-18 the same
       > three took 2 hours 51 minutes and 381,000 tokens. That is 2.5 times
       > faster for 8 percent more tokens.

       ledger now: "wave review 15:58 APPROVE"; clock + tokens + baseline +
       speedup rows; checklist S3, S4, S5 -> [x]; Next up: S6 — docs brief

16:00  > Starting the docs brief (S6) on its own, on the phase branch. One
       > brief at a time from here; nothing in phase 2 can run alongside it.

       ledger now: wave 2.1 block closed; S6 row [~], Sessions used: 9 -> 10

...    (S6 and S7 run and land exactly as they do today, with no wave
        vocabulary anywhere)

18:40  > Phase 2 is finished: five briefs landed. The phase check now runs over
       > the two briefs that ran on their own, the docs brief (S6) and the
       > changelog brief (S7) — the other three were already reviewed together
       > at 15:58. Then phase 2 goes to staging and is verified there before
       > its pull request opens, as usual.

       ledger now: "phase 2 checkpoint spawned 18:40 over 6666fff..9999iii
       covering S6, S7"; Next up: phase 2 checkpoint — staging verify
```

Note the review count: **two** reviews in this phase — one over the three briefs
that ran together, one over the two that ran on their own. That is the part-waved
price §0.4 names, and it is why the manifest, the wave verdict and the phase end
all say which briefs a review covered.

**States in J2.** *Empty:* E1 to E4 in §7. *In flight:* the whole of 14:02 to
15:08 — covered by the manifest, the return blocks and the ledger. *Error:* J3
and §7 R1 to R5. *Degraded:* D2 fired here — two of five briefs could not run
alongside anything, and the manifest said so, by name, with the shared file. The
cap did not fire in this walk (three eligible, cap 3); W14 is its own example.
The difference between a degraded state handled and one hidden is exactly that
the exclusion is printed before the work starts, not discovered at the phase end.

---

## 4. J3 — a brief changed files it had not listed, and is not merged (AC-10, AC-11, AC-12)

1. **Owner sees the manifest** exactly as in J2. Nothing warns of drift; there
   is nothing to warn about yet.
2. **Owner sees a return block with a failed check, at the moment the brief
   returns.** This is the first difference, and it is the one block in the
   feature that must be unambiguous: the brief *succeeded* at its work and
   *failed* its promise. The message says both. It also says what the owner will
   be asked and **when** — because at this moment the other briefs may still be
   running, so nothing can yet be said about what merged. Wording row W30.
3. **The question comes later — when integration reaches that brief's
   position.** By then the other briefs' merge results are observed facts, so
   the question can name what landed without guessing. The sequence is therefore:
   check at return, notice at return, **question at integration**. A question
   printed at return would have to either omit the merge state or invent it.
4. **Owner sees the other briefs merge in the recorded order, as usual** —
   W3/W4 lines, unchanged. Locked: drift blocks the drifting brief; the owner's
   answer was "drift blocks", not "the wave aborts". **This is a design reading,
   labelled as one** (§0.3): holding only the drifting brief is consistent with
   the mid-wave-failure answer ("keep the good ones"). If the architect or owner
   prefers a whole-wave hold, only one wording row changes.
5. **Owner is asked, once, with three choices** (W9). Drift gets **no retry** —
   a retry re-runs the same brief against the same declaration and would drift
   again. It goes straight to the owner (mirroring the `deviation` route in
   `commands/mission.md` step 3, which also skips the corrective retry).
   Choices: allow the extra files (I re-check, then merge) · have the brief
   redone with those files listed · leave the brief out of this phase.
6. **The wave review waits for the answer.** It must: the review runs over the
   integrated range (AC-8), and the owner's answer decides what the range is.
   "Allow the extra files" merges the brief **before** the review spawns, so
   that brief is inside the one wave review and **no second reviewer is ever
   needed** — which is what keeps AC-8 true. "Redone" and "left out" both make
   the range what already landed, and the review spawns over that with the W8
   partial sentence attached. While the owner has not answered, the ledger holds
   the question as pending (§9.2) and `Next up:` names the ruling, not the
   review.
7. **Owner sees the hot-file case as a different message** (W10). A brief that
   changed a file only the mission driver writes — the three `.plans/` mission
   files first of all — is refused with the file **named** and the ownership
   **explained**, not merely asserted (AC-11). The reason the owner needs is
   *why* it is owned: it is what keeps the mission's own record readable while
   several briefs run. Same timing rule as drift: noticed at return, asked at
   integration.
8. **Owner may see the hot-file message earlier, at plan time** (W11). The tier-1
   lint refuses a brief that *lists* a mission-driver file (AC-4 grammar +
   AC-11). Catching it in the plan costs nothing; catching it after the brief
   ran costs a brief.
9. **Owner sees the drift test's output in a test log, not a terminal** (AC-12).
   The deliberate-drift test asserts the exact sentences of wording rows W9, W10
   and W30 — which makes the wording itself the thing under test, and stops it
   rotting.

### 4.5 One trap that would make drift lie

Drift must be measured against the **wave's base commit** — the phase-branch tip
recorded at wave start — not against the phase branch as it stands when the
check runs. By the time brief 2 is checked, brief 1 has merged; a diff taken
against the moving head contains brief 1's paths and reads as brief 2 having
written files it never touched. A **false drift block** is worse than no check,
because it teaches the owner to wave the guard through.

Whichever way architect memo 1 derives the diff, the reporting requirement
holds: **every check result names the commit it compared against** (both green
and blocked). That one named commit is what makes a false block diagnosable in
one line instead of a debugging session.

**States in J3.** *Empty:* a brief that declares nothing is never waved (E2), so
drift cannot fire on it. A brief that declares `none (verification only)` is
eligible for any group and then **any** change is drift — which is why the
grammar must distinguish "writes nothing" from "nobody filled this in" (E3).
*In flight:* the check runs at return, so the other briefs are usually still
running when the notice prints; the notice therefore carries the still-running
list and makes no claim about what merged (W30), and the question waits for
integration (W9). `Next up:` while one brief is blocked and two run:
`Next up: phase 2 wave 2.1 — S3 and S5 running; S4 blocked (changed files it had
not listed), your ruling needed when merging reaches it`.
*Error:* R1, R2, R4 in §7. *Degraded:* the wave integrated two of three, so the
phase is incomplete behind a passing review — see D5, the worst durable
misreading in the feature.

---

## 5. J4 — one brief in the wave fails (AC-13, AC-7, AC-8)

1. **Owner sees the manifest** as in J2.
2. **Owner sees a failure block the moment the failing brief returns.** It says
   the brief failed, what signal failed (its tests, its lint, its build), that a
   failure in one brief does not hold up the others, that the retry is starting —
   **its one retry** (WORKFLOW.md §5 one-corrective-retry), named as one so the
   owner knows the budget — and the still-running list. It makes **no claim about
   merges**, because at that moment none have been observed.
3. **Owner sees the passing briefs merge in the recorded order as they become
   ready.** Locked: "keep the good ones, retry the failure." The passing briefs
   do not wait for the retry, and each merge is reported by its own intent and
   result lines (W3, W4), never pre-announced inside the failure block.
4. **Owner sees the retry's return.** Either it passed and merges, or it failed
   twice and comes to the owner.
5. **If the retry passed: the merge order actually used is printed**, because it
   is no longer the planned one. The retried brief lands **last**, after the
   briefs that merged while it was re-running. Planned `S3 -> S4 -> S5`, actual
   `S3 -> S5 -> S4`. Both are in the ledger; the printed line names the actual.
6. **The review spawns only after the retry has resolved.** AC-8 (exactly one
   review per wave) and AC-13 (the review covers what landed) can only both hold
   if the retry finishes first. There is no second review for a retried brief
   that then landed — it is inside the one wave review's range.
7. **If the retry failed twice: the owner is asked, and only then does the review
   spawn** over what landed. The brief that never landed becomes its own later
   beat with its own review **after the owner rules** — not before. Until the
   ruling there is one wave and one pending review, not two.
8. **Owner sees the partial result stated as partial.** The review's APPROVE
   covers two briefs. The phase is **not** finished. This sentence is mandatory
   and it is the one most likely to be dropped — see the worst-risk section (§11 below).

**States in J4.** *Empty:* none specific. *In flight:* a failure arrives while two
briefs still run, so the failure block carries the still-running list. The retry
runs concurrently with whatever is left and **takes the slot the failed brief just
freed** — it returned, so it is no longer running — which means the cap is never
exceeded and never needs special handling. What the retry does change is **when
the wave ends**: it extends the wave's wall-clock, the review must wait for it
(step 6), and the clock row must measure the wave *including* the retry or the
printed speedup overstates the gain. *Error:* a retry that cannot start (its copy
of the repo is gone, or its branch is in a state the merge already consumed) is
reported as a retry that did not run, never as a second failure (W25). *Degraded:*
D5.

---

## 6. J5 — no consent row, so everything runs one after another (AC-2)

1. **Owner starts a mission in a project with no Parallel waves row** (or the row
   set `off`, or malformed). Vantage: the owner sees the mission begin exactly as
   it does today, plus one sentence, once, at mission start: briefs run one after
   another because the project has not recorded that several at once are allowed,
   and here is the row that would allow it.
2. **Owner sees each brief run and land as today.** No wave vocabulary appears
   anywhere. No manifest, no merge-order table, no wave review. A project that
   never turns this on should not be able to tell the feature shipped — except
   for step 3.
3. **Owner sees one message with teeth, at most once per mission:** at the first
   phase where the tool found a group that *could* have run together, the owner
   is told the count and the time it would likely have saved, with the row to add.
   This is the only place the feature advertises itself, and it only fires when
   the advertisement is true for this owner's own plan.
4. **No wave ever runs on an unrecorded consent.** Fail-closed, the §10
   Publish-policy pattern (AC-2). A row that cannot be parsed is not consent.

### J5b — the numbers stay honest under concurrency (AC-14, AC-15, AC-16)

The brief's own J5. These are reporting and ledger requirements, not a separate
owner walk-through:

1. **`Sessions used:` keeps measuring work, not elapsed time.** Proposed (architect
   memo 4 decides): it counts **briefs started**, so a wave of three increments it
   by 3, written **once at wave start, before any spawn** (write-ahead, WORKFLOW.md
   §5 LA-6). A corrective retry adds 1 when it fires, never pre-booked (LA-1).
   Effect: the overrun stop at `k >= 1.5 x N` keeps firing on real work, and waves
   cannot make a mission look cheaper than it is. The cost of this choice, stated
   plainly: `Sessions used:` stops approximating wall-clock, which is why (2)
   exists.
2. **Wall-clock and tokens are both recorded, per brief and per wave** in the
   ledger (§9.1) — per brief: spawned time, returned time, tokens; per wave: start
   to last merge, and the sum of its briefs' tokens plus the wave review's. Both
   numbers are printed beside the speedup (W28), because concurrency trades tokens
   for time: three briefs in their own copies of the repo each read their own
   context, so a wave can be faster **and** dearer, and a speedup quoted without
   its token cost is a half-truth. The comparison is always against a **measured**
   serial baseline (AC-15), printed only when both measurements exist — never
   estimated, never modelled, no "would have taken about".
3. **The measurements are also the honesty check on the cap.** If rate limits or
   model concurrency mean three briefs effectively ran one after another, the
   recorded per-brief times show it, and the printed speedup reports what
   happened. A wave that was a wave in name only must read as one — that is the
   truthful-UI pillar applied to the feature's own headline claim.
4. **AC-16's proof is the J2 walk end to end** — computed, isolated, integrated in
   order, check green, one wave review passed — with the ledger block in §9 as the
   evidence a fresh session can read.

---

## 7. Every state, in one table

Journey column says where it is walked. "What the owner sees" is the required
content, not the final sentence — the wording table (§8 below) holds the sentences.

### Empty

| Id | State | Journey | What the owner sees |
|---|---|---|---|
| E1 | No consent row recorded | J5 | One sentence at mission start: briefs run one after another, this is why, this row would change it. Never a warning; "off" is a valid setting |
| E2 | No brief in the phase lists its files | J2, J3 | The count of briefs with no list, that none can run alongside another, and that `replan` is what adds the lists. The tool's per-brief exclusion reason (AC-5) is in the ledger, not the terminal — one line per brief would bury the fact |
| E3 | A brief lists nothing because nobody filled it in | J3 | Refused at plan time by the lint. "Writes nothing" must be written as the literal `writes: none (verification only)`, so a forgotten field can never be read as a declaration of nothing. An empty-by-accident declaration would make a brief eligible for every wave and then block on its first real change |
| E4 | No two briefs in the phase are independent — the group is one brief | J2 | "No two briefs in this phase can run at the same time: X and Y both change `<path>`." Running one after another, as before. **Not** announced as a wave of one: that would claim concurrency machinery where none applies, and would multiply the review count (§0.4). The overlap reason goes in the ledger so nobody has to re-derive it |
| E5 | A wave produced an empty integrated range — every brief committed nothing | J2 | Treated as suspicious, not as success (`commands/mission.md`: empty changes on `done` is suspicious). Rows stay `[~]`, the review is not spawned as a pass, the owner is told which briefs reported done with nothing committed |

### In flight

| Id | State | Journey | What the owner sees / what the ledger holds |
|---|---|---|---|
| F1 | Three briefs running at once | J2 | **Terminal:** the manifest only — plus the silence contract. **Ledger:** one `Wave log` block with base commit, cap, planned order, and per brief: branch, copy-of-repo path, declared files, `spawned HH:MM`. That is what distinguishes work-in-progress from a stall (LA-6) |
| F2 | One brief returned, two still running | J2 | The return block, with "waiting, not landed", its position, and the still-running list. Ledger gains `returned HH:MM done, commit <sha>, check green, held` |
| F3 | All three returned at once (returns may batch) | J2 | Three return blocks in merge order, then integration. The still-running list reads "none — all three are in". The wording works in both timing shapes by construction (§0.2) |
| F4 | Returned and check-green but not yet merged | J2 | The four real brief states are running / finished-and-waiting / merged / blocked. The checklist has three glyphs, so `[~]` covers running, waiting, retrying **and** blocked-awaiting-owner. The glyph alone cannot tell them apart: the distinguishing word lives in the `Wave log` row, and the checklist row carries a short qualifier |
| F5 | A review is running over the wave | J2 | The spawn line, then silence, then the verdict. LA-6 names this case exactly: an unrecorded in-flight review is indistinguishable from a stall |
| F6 | A brief stopped to ask the owner (`deviation`) mid-wave | J4 | The question, prefixed with: this brief has not failed, it needs a ruling; the other briefs are still running and the answer does not stop them. Mirrored as one line in the ledger's existing `## Open questions` block the moment it is asked, write-ahead, so a crash mid-question does not lose it (§9.2). Two questions at once are asked in merge order with the count waiting |
| F7 | A brief started and never returned | J2 | The ledger proves `spawned HH:MM` and no return, which is **not** proof it is alive. The fresh-session rule is §9.4: inspect the branch and the copy of the repo, never assume |

### Error

| Id | State | Journey | What the owner sees |
|---|---|---|---|
| R1 | A brief changed files it had not listed | J3 | Twice: at return, a notice naming the brief, the offending paths, what it had listed, the baseline commit compared against, and the still-running list — no claim about merges yet (W30). At integration, the question naming what actually merged and three choices (W9). No retry. The wave review waits for the answer |
| R2 | A brief changed a file only the mission driver writes | J3 | Same two moments as R1. The file named, why it is the driver's (it is what keeps the mission record readable under concurrency), and the one next action (W10). Also refused at plan time when a brief *lists* one (W11) |
| R3 | A copy of the repo could not be created | J2 | The brief it was for, the concrete reason (a leftover copy at that path, no disk, the branch already checked out), that the group runs **smaller** rather than not at all, that this brief runs on its own afterwards, and one command if one clears it. Shrinking is legal — the cap is a maximum |
| R4 | A real merge conflict at integration | J3 | With disjoint lists and the check green, this **should be impossible**. When it happens it is a hole in the guard, not the owner's mistake, and the message says so: the two briefs, the file, that the earlier merges stay merged (verified work is never undone), the one legitimate cause (the phase branch moved under the wave from outside), and the choices. Auto-resolution is out of v1 by the owner's own choice |
| R5 | The wave tool itself failed or disagreed with the sessions file | J2 | No wave runs; briefs run one after another; the tool's error is quoted and the fix named. Fail-closed: an unreadable plan is never consent to run things concurrently |

### Degraded

| Id | State | Journey | What the owner sees |
|---|---|---|---|
| D1 | The cap is lower than the number of eligible briefs | J2 | Which briefs run now, which run in the next group, that the limit is 3, and the §10 row as the place to change it. Stated in the manifest, not as a warning |
| D2 | Only some briefs list their files | J2 | Both halves: the group that runs together, and the briefs excluded with the count and the one fix (`replan` adds the lists). A phase is never called parallelised without its exclusion count |
| D3 | The group effectively ran one after another anyway (rate limits, model concurrency) | J5b | The recorded per-brief times and tokens, and a speedup number that reports what happened. Never the claimed concurrency |
| D4 | No working-copy preparation recipe recorded | J1, J2 | Briefs whose checks need no services still wave; briefs that need the app running or a database are held out, by name, with the §10 row to fill. Fail-closed per brief, not for the whole phase. **The per-brief "needs a prepared copy" fact does not exist yet** — proposed, derived from the brief's verify step; architect memo 5 |
| D5 | One brief failed, the wave integrated partially, and the review approved | J4 | The approval is stated as covering **what landed**, and the phase is stated as **not finished**, with the brief that is out named. Without this sentence a passing review on a partial wave reads as a complete phase and the owner merges on it |
| D6 | The wave's integrated range is smaller than the phase's plan | J4 | The checklist shows the landed briefs `[x]` and the held brief `[~]` with its word, and `Next up:` names the held brief's resolution — not the next phase |

---

## 8. Wording — every new message the feature emits

Every sentence below is a **filled example**, because §6.0 can only be judged on
a filled sentence. Ids always carry their plain name. The action comes first.
Terms are expanded per the terms table (§0.1 above). These are the strings the
deliberate drift test asserts (AC-12), so they are specified, not suggested.

Rows are listed in the order the owner would **meet** them, not by id, so the ids
are not sequential — W30 sits between W8 and W9 because the return-time notice
comes before the integration-time question, and W31/W32 sit beside the rows they
are the alternative to. The ids are stable handles for the tests and the planner;
the order is for a reader.

| Id | Trigger | What is printed | What the owner does |
|---|---|---|---|
| W1 | A phase starts and the tool found 2+ briefs that change no shared file, with consent recorded | The manifest — see §3.1, 14:02 verbatim: the one-sentence lead, the three-column table, the fixed merge order with "Finishing first does not mean landing first", the excluded briefs by name, the preparation line, the copy-of-repo paths, the silence contract, "Nothing is needed from you." | Nothing. Read on, or open the ledger if the silence worries them |
| W2 | A brief returns, work committed, lists match | "The lint-rules brief (S3) finished and committed to branch `mission/parallel-waves-p2-s3` (commit 1111aaa). The files it changed are the files it said it would change — checked against abc1234, the phase branch as it stood when the wave started. It is position 1 of 3 in the merge order, so it is waiting, not landed. Still running: the wave-tool brief (S4)." | Nothing |
| W3 | Before each merge (intent) | "Merging the lint-rules brief (S3) into the phase branch now — position 1 of 3." | Nothing |
| W4 | After each merge (result) | "Merged. The phase branch carries the lint-rules brief (S3)." | Nothing |
| W5 | All merges done | "All three briefs are on the phase branch `mission/parallel-waves-p2` (abc1234..6666fff). One reviewer now checks the three together, not one each." | Nothing |
| W6 | The wave review is spawned (LA-6) | "One reviewer is now checking the three briefs that ran together, over abc1234..6666fff. This takes a while; nothing will print until it returns." | Nothing |
| W7 | The wave review approves, and no brief in the phase is left to run | "The reviewer approved all three briefs that ran together. Phase 2 now goes to staging and is verified there before its pull request opens, as usual." | Nothing until the pull request |
| W32 | The wave review approves, but briefs in the phase have still to run one after another (the part-waved phase, D2) | "The reviewer approved all three briefs that ran together: the lint-rules brief (S3), the wave-tool brief (S4) and the profile-row brief (S5). **Phase 2 is not finished.** Two briefs are still to run, one after another, because they change files these three changed: the docs brief (S6), then the changelog brief (S7). Phase 2 goes to staging after those two and the phase check that follows them." | Nothing |
| W8 | The wave review approves a partial wave (D5) | "The reviewer approved the two briefs that landed: the lint-rules brief (S3) and the profile-row brief (S5). **Phase 2 is not finished** — the wave-tool brief (S4) is still out, because it failed twice. Decide what happens to S4 before this phase can close." | Rule on the held brief |
| W30 | A brief returns having changed files it had not listed, or a mission-driver file — printed **at return**, while others may still be running (R1, R2) | "The wave-tool brief (S4) finished its work but will not be merged: it changed two files it had not listed — `tools/lint.mjs` and `hooks/hooks.json`. It said it would change only `tools/waves.mjs`. I compared against abc1234, the phase branch as it stood before any of these briefs started. I will ask you what to do about S4 when merging reaches its turn, so I can tell you what landed by then. Nothing you need to do yet. Still running: the lint-rules brief (S3) and the profile-row brief (S5)." | Nothing yet |
| W9 | Merging reaches the position of a brief that changed files it had not listed (R1) | "Decide what happens to the wave-tool brief (S4), which is not merged because it changed two files it had not listed — `tools/lint.mjs` and `hooks/hooks.json` — when it said it would change only `tools/waves.mjs`. I compared against abc1234, the phase branch as it stood before these briefs started. The other two briefs that ran alongside it are merged: the lint-rules brief (S3) and the profile-row brief (S5). Choose one: let those two extra files in (I check them again, then merge S4), have S4 done again with those files listed, or leave S4 out of phase 2. The reviewer waits for your answer, because your answer decides what it reviews." | Pick one of three. No retry happens on its own |
| W10 | Merging reaches the position of a brief that changed a mission-driver file (R2) | "Decide what happens to the profile-row brief (S5), which is not merged because it changed `.plans/parallel-waves.state.md` — a file only the mission driver writes. That file is the mission's own record, and keeping one writer is what stops briefs running at the same time from scribbling over each other's entries. The other two briefs that ran alongside it are merged: the lint-rules brief (S3) and the wave-tool brief (S4). Choose one: have S5 done again without touching that file (it reports what changed in its hand-off and I write the record), or leave S5 out of phase 2." | Pick one of two |
| W11 | A brief *lists* a mission-driver file, at plan time | "The profile-row brief (S5) lists `.plans/parallel-waves.state.md` among the files it will change. Only the mission driver writes that file. Remove it from the brief's list — the brief reports what changed in its hand-off and the driver writes the record." | Nothing; the planner revises and the plan-judge re-checks |
| W12 | A copy of the repo could not be created (R3) | "The wave-tool brief (S4) is not in this group: I could not give it its own copy of the repo, because a leftover copy from an earlier run is still at `.worktrees/p2-s4`. The other two briefs run together now and S4 runs on its own afterwards. To clear the leftover: `git worktree prune`." | Optionally run the one command |
| W13 | A real merge conflict at integration (R4) | "The wave-tool brief (S4) will not merge: it and the lint-rules brief (S3) both changed `templates/mission-sessions.md` in a way git cannot combine. S3 is merged and stays merged — I do not undo work that already passed its checks. This should not be able to happen: the two briefs listed different files and both passed the check that compares what they changed against what they listed. So either the phase branch moved underneath them while they were running, or their file lists are not specific enough to be trusted. Choose one: leave S4 out of phase 2 and let me report this as a defect in the machinery that runs briefs at the same time, or have S4 done again on top of what is now merged." | Pick one of two. This one is also a bug report |
| W14 | More eligible briefs than the cap (D1) | "Five briefs in phase 2 could run at the same time; this project allows at most 3 at once. Running the lint-rules brief (S3), the wave-tool brief (S4) and the profile-row brief (S5) now; the docs brief (S6) and the changelog brief (S7) run in the next group. The limit of 3 is the **Parallel waves** row in `docs/WORKFLOW.md` §10." | Nothing, unless they want to change the limit |
| W15 | Some briefs list no files (D2) | "Two of the five briefs in phase 2 do not list the files they will change, so they cannot run alongside anything: the docs brief (S6) and the changelog brief (S7). They run one after another, after the group of three. To include them next time the plan has to list their files — `/agentic-workflow:mission \"parallel-waves\" replan` rewrites the briefs." | Nothing now; `replan` later if they care |
| W16 | No brief lists its files (E2) | "None of the four briefs in phase 2 lists the files it will change, so none can run alongside another. Running them one after another, as before. To run several at once the plan has to list each brief's files — `/agentic-workflow:mission \"parallel-waves\" replan` rewrites the briefs." | Nothing, or `replan` |
| W17 | No two briefs are independent (E4) | "No two briefs in phase 2 can run at the same time: the lint-rules brief (S3) and the docs brief (S6) both change `tools/lint.mjs`. Running them one after another, as before. Nothing is needed from you." | Nothing |
| W18 | Mission start, consent row absent or off (J5) | "Briefs in this mission run one after another. This project has not recorded that several briefs may run at the same time, so none will. To allow it, add this row to `docs/WORKFLOW.md` §10 yourself — it is your standing permission, so nothing here will write it for you: `\| **Parallel waves** \| on (cap 3, allowed 2026-11-19) \|`. Nothing else changes until you do." | Nothing, or add the row |
| W19 | Consent row malformed (J1) | "Briefs in this mission run one after another. The **Parallel waves** row in `docs/WORKFLOW.md` §10 reads `on (cap three)`, and the limit has to be a number, so I am treating the row as not set. I will not guess the number for you: edit the row to read `on (cap 3, allowed 2026-11-19)`, or whatever limit you want." | Fix the row |
| W20 | First phase that *could* have waved, consent absent (J5, step 3) | "Phase 2 just ran three briefs one after another that could have run at the same time: they change no shared files. Those three took 2 hours 51 minutes. I have no measured comparison for running them together in this project, so I am not going to guess what it would have saved. To allow it, add to `docs/WORKFLOW.md` §10: `\| **Parallel waves** \| on (cap 3, allowed 2026-11-19) \|`. Said once per mission." | Nothing, or add the row |
| W21 | No working-copy recipe recorded (D4) | "This project has not recorded how to prepare a fresh copy of the repo — the install command, which secrets file to copy in, and how to make a throwaway database. Three of the four briefs in phase 2 only run tests and lint, so they run together as usual. The fourth, the live-check brief (S6), needs the app running, so it runs on its own. To let briefs like S6 run alongside others, fill the **Working-copy recipe** row in `docs/WORKFLOW.md` §10." | Nothing, or fill the row |
| W22 | A brief failed, printed at its return (J4) | "The wave-tool brief (S4) failed: `node tools/lint-test.mjs` reported 2 failing cases. A failure in one brief does not hold up the others — they merge in the recorded order as they become ready, and I report each merge as it happens. I am running S4 once more with a note about what failed; that is its one retry. If it fails again I come back to you. Still running: the profile-row brief (S5), and S4's retry." | Nothing |
| W23 | The retry passed (J4) | "The wave-tool brief (S4) passed on its second run and is merged. The merge order actually used was the lint-rules brief (S3), then the profile-row brief (S5), then S4 — S4 landed last because it was retried. Planned order was S3, S4, S5." | Nothing |
| W24 | The retry failed too (J4) | "The wave-tool brief (S4) failed twice, so it is not in phase 2: `node tools/lint-test.mjs` still reports 2 failing cases, now in `waves grouping`. Two briefs did land — the lint-rules brief (S3) and the profile-row brief (S5). Choose one: have me look at S4's failure as its own piece of work before this phase closes, drop S4 from this mission, or stop here and look at it yourself. The reviewer will check only what landed." | Pick one of three |
| W25 | A retry could not start (J4) | "The wave-tool brief (S4) failed and its retry did not run: its copy of the repo at `.worktrees/p2-s4` is gone. That is not a second failure — S4 has not used its retry. Choose one: give it a fresh copy and retry, or leave it out of phase 2." | Pick one of two |
| W26 | A brief stopped to ask (F6) | "The profile-row brief (S5) needs a ruling from you before it can continue — it has not failed. It found that `docs/WORKFLOW.md` §10 already records a **Parallel waves** row dated 2026-10-02, which the plan's locked decision of 2026-11-18 says should not exist. Keep the older row, or replace it? The other two briefs are still running and your answer does not stop them." | Answer the one question |
| W27 | A brief reports done with nothing committed (E5) | "The profile-row brief (S5) reports it finished but committed nothing to `mission/parallel-waves-p2-s5`. I am not recording that as done. Choose one: have the reviewer confirm nothing was needed, or have S5 done again." | Pick one of two |
| W28 | A wave completed and both measurements exist (AC-15) | "Those three briefs together: 1 hour 9 minutes from start to all merged, 412,000 tokens. Run one after another on 2026-11-18 the same three took 2 hours 51 minutes and 381,000 tokens. That is 2.5 times faster for 8 percent more tokens." | Nothing |
| W31 | A wave completed and no serial baseline has been measured in this project | "Those three briefs together: 1 hour 9 minutes from start to all merged, 412,000 tokens. Nothing has been measured for running these same briefs one after another, so there is no comparison to give you." | Nothing |
| W29 | The wave tool failed (R5) | "Briefs in phase 2 run one after another: the tool that works out which briefs may run together could not read `.plans/parallel-waves.sessions.md` — `unexpected 'writes:' at line 212`. Nothing runs concurrently until that parses. Fix: `/agentic-workflow:mission \"parallel-waves\" replan`, or correct line 212 by hand." | Fix the plan or replan |

---

## 9. The ledger record shape for a wave

Rows here are **data** and §6.0-exempt: terse, one fact per clause, append-only
within a wave block. Written **by the orchestrator alone** (AC-9); no brief may
declare any of the three `.plans/` mission files. The test of this shape is §9.4:
a fresh session reading **only** the ledger must know what happened and what to
do next, from any crash point.

### 9.1 A new `## Wave log` block (proposed)

Lives in `templates/mission-state.md` between `## Deviations` and
`## Handoff log`, newest first, one block per wave.

```
## Wave log (newest first)

_Written by the orchestrator only. One block per group of briefs that ran at the
same time. Data rows, not owner prose. Each row is appended as its fact is
observed, so the last fact present is where the mission stopped._

### wave 2.1 — phase 2 — started 2026-11-19 14:02
- base: mission/parallel-waves-p2 @ abc1234
- cap: 3 (§10 Parallel waves: on, cap 3, allowed 2026-11-19)
- tool: tools/waves.mjs @ 14:01 — grouped S3,S4,S5; excluded S6 (shares tools/lint.mjs with S3), S7 (shares templates/WORKFLOW.md with S5)
- order planned: S3 -> S4 -> S5
- order actual: S3 -> S4 -> S5
- prep: recipe from §10 Working-copy recipe ran in all 3 copies — install ok, secrets ok, scratch db ok
- S3 lint-rules · branch mission/parallel-waves-p2-s3 · copy .worktrees/p2-s3 · declares tools/lint.mjs, tools/lint-test.mjs · spawned 14:02 · returned 14:41 done · 118k tokens · commit 1111aaa · check green vs abc1234 · merge intent 15:09 · merged 15:09 (2222bbb)
- S4 wave-tool · branch mission/parallel-waves-p2-s4 · copy .worktrees/p2-s4 · declares tools/waves.mjs · spawned 14:02 · returned 15:08 done · 171k tokens · commit 3333ccc · check green vs abc1234 · merge intent 15:10 · merged 15:10 (4444ddd)
- S5 profile-row · branch mission/parallel-waves-p2-s5 · copy .worktrees/p2-s5 · declares templates/WORKFLOW.md, commands/doctor.md · spawned 14:02 · returned 14:20 done · 79k tokens · commit 5555eee · check green vs abc1234 · merge intent 15:11 · merged 15:11 (6666fff)
- integrated: abc1234..6666fff · in: S3, S4, S5 · out: none
- review spawned 15:12 over abc1234..6666fff covering S3, S4, S5
- review 15:58 APPROVE (reviewer, fresh, one-shot) · 44k tokens
- clock: 14:02->15:11 = 69 min · serial baseline 2026-11-18 = 171 min · 2.5x
- tokens: 412k (S3 118k + S4 171k + S5 79k + review 44k) · serial baseline 381k · +8%
- charged: +3 at 14:02 (3 briefs started)
- phase 2 remainder after this wave: S6, S7 serial, then the phase checkpoint
```

**The same block when a brief failed and was retried** (J4) — three rows differ,
and both orders are kept:

```
- order planned: S3 -> S4 -> S5
- order actual: S3 -> S5 -> S4 (S4 retried, landed last)
- S4 wave-tool · … · spawned 14:02 · returned 15:08 failed (lint-test, 2 cases) · retry spawned 15:10 · returned 15:38 done · 171k + 96k tokens · commit 3333ccc · check green vs abc1234 · merge intent 15:40 · merged 15:40 (4444ddd)
- charged: +3 at 14:02 (3 briefs started) · +1 at 15:10 (S4 corrective) = 4
```

### 9.2 What is written when

| Moment | Written, before the thing happens where marked |
|---|---|
| Wave start (**before any spawn**) | the whole block header: base commit, cap + its §10 source, the tool's grouping and every exclusion reason, planned order, prep result, and one row per brief with branch, copy path, declared files, `spawned HH:MM`. Plus `Sessions used:` +N, the checklist rows to `[~] running`, and `Next up:` rewritten wave-scoped |
| Each return | append to that brief's row: `returned HH:MM <done\|failed\|deviation>`, commit, check result **with the baseline commit**, and `held` / `blocked` / `retry spawned HH:MM` |
| **Before** each merge | append `merge intent HH:MM` — the intent line, not only the result. This is the only record that survives a crash between merge 1 and merge 2 |
| After each merge | append `merged HH:MM (<sha>)` |
| Integration done | the `integrated:` row — range, briefs in, briefs out with reasons |
| Review spawn (LA-6) | the `review spawned` row — what, over which range, covering which briefs, when |
| Review verdict | the `review` row; checklist rows to `[x]` for merged-and-approved briefs only; `Next up:` advanced — to the serial remainder, not past the phase, when the phase is part-waved |
| A question is put to the owner (drift, hot file, `deviation`, a failed retry) | one line in the ledger's existing `## Open questions` block, the moment it is asked, **before** waiting — e.g. `- S4 drift ruling — asked 2026-11-19 15:09 — extra files tools/lint.mjs, hooks/hooks.json — options: allow / redo / leave out`. Removed when answered, with the answer landing where the trio already puts decisions (a dated locked decision in the master plan). This is what stops a crash mid-question losing the question |
| Wave close | the `clock:`, `tokens:` and `charged:` rows (AC-14, AC-15) |
| Any degraded or error path | one `## Deviations` line, in the existing one-line style — e.g. `wave 2.1: S4 ran alone — no copy of the repo could be created (leftover at .worktrees/p2-s4)` |
| Wave close, worktrees | the existing `## Closing` branch + worktree cleanup row is extended to name **this wave's** copies and branches, since a wave multiplies both |

### 9.3 Three existing ledger rules under concurrency

- **Exactly one `Next up:` (LA-7).** A brief-scoped `Next up:` cannot describe
  three things. During a wave it is **wave-scoped**, one line, superseded in
  place: `Next up: phase 2 wave 2.1 — S3, S4, S5 running; then merge in order S3,
  S4, S5` becomes `Next up: phase 2 wave 2.1 — merging in order S3, S4, S5`
  becomes `Next up: phase 2 wave 2.1 review over abc1234..6666fff` becomes
  `Next up: S6 — docs brief`. Three concurrent briefs, still one line, and AC-9
  holds because only the orchestrator writes it. The blocked-brief form:
  `Next up: phase 2 wave 2.1 — S3 and S5 running; S4 blocked (changed files it
  had not listed), your ruling needed when merging reaches it`. Waves are
  numbered `<phase>.<n>` precisely so a `Next up:` line never collides with a
  wording-row id (`W9`) in a transcript.
- **Checklist glyphs.** `[ ]` not started · `[~]` running **or** finished-and-waiting
  **or** retrying **or** blocked-awaiting-owner · `[x]` merged **and** covered by a
  passing wave review. Four brief states, three glyphs: the glyph is not enough,
  so the `Wave log` row carries the word and the checklist row carries a short
  qualifier — `- [~] S4 — wave tool (retrying, 1 of 1)`.
- **Write-ahead (LA-6).** Every row above that says "before" exists because of
  this rule. The incident it cites is exactly this feature's failure mode at
  triple scale.

### 9.4 The crash-point walk — can the ledger alone give the next action?

| Crash point | What the ledger holds | A fresh session's next action |
|---|---|---|
| After wave start, before any return | three brief rows with `spawned`, no `returned`; branches and copy paths named; planned order; `Next up:` wave-scoped | For each brief: `git log <branch>` and check the copy exists. Commits present → treat as returned, run the check now. No commits → re-spawn. **Never** assume a `spawned` row is still alive and never assume it is dead |
| Between two returns | returned rows complete with commit + check + `held`; unreturned rows have only `spawned` | Same per-brief inspection for the unreturned; the returned ones need no rework |
| Between merge 1 and merge 2 | `merge intent HH:MM` on the brief being merged, with or without its `merged` row | Compare the phase branch log against the planned order. Intent with no result → check whether the merge commit exists; finish or redo exactly that one merge, then continue the order |
| After integration, before the review | `integrated:` row with base and head SHAs and the briefs in/out | Spawn the wave review over the recorded range. The range is recorded, so it is never re-derived |
| Review spawned, no verdict | `review spawned HH:MM over <range> covering <briefs>` | Re-spawn the review over the same range. A fresh one-shot review is idempotent; the recorded range is what makes re-spawning safe |
| After a brief was blocked, before the owner answered | the brief's row says `blocked` with the offending paths; the `## Open questions` row holds the question and its options; `Next up:` names the ruling | Re-ask the owner that question verbatim from the `## Open questions` row; do not retry, do not merge, do not spawn the review |
| After the owner answered, before the answer was acted on | the `## Open questions` row is gone and the answer is a dated locked decision in the master plan | Act on the recorded decision. The decision lives in the trio, not in the transcript, which is why it survives |

---

## 10. Every acceptance criterion, mapped to a journey step

| AC | Home in this file |
|---|---|
| AC-1 | J1 steps 2 and 3 (the §10 row written, then read by doctor) |
| AC-2 | J5 steps 1 and 4; wording W18, W19 |
| AC-3 | J2 step 1; degraded D1; wording W14 |
| AC-4 | J2 step 1; empty E2, E3; wording W15, W16, W11 |
| AC-5 | J2 step 1 (the grouping and every exclusion reason, terminal + ledger `tool:` row); E4; W17; R5/W29 |
| AC-6 | J2 step 2 (the preparation line); degraded D4; wording W21 |
| AC-7 | J2 steps 1 and 5 (order printed, intent + result per merge); J4 step 5 (actual order when it differs); ledger `order planned` / `order actual` |
| AC-8 | J2 step 6; §0.4 (the reading, the part-waved phase, and what both do to `Estimate:`); J3 step 6 (the review waits for a drift ruling); J4 steps 6 and 7 (the retry resolves first); wording W7, W32 |
| AC-9 | §9 throughout; §9.3 (one `Next up:` under concurrency); J3 steps 7 and 8 |
| AC-10 | J3 steps 2 to 5; §4.5 (the baseline that stops a false block); wording W30 (at return), W9 (at integration) |
| AC-11 | J3 steps 7 and 8; wording W10 (run time), W11 (plan time) |
| AC-12 | J3 step 9 — the test asserts the W9, W10 and W30 sentences, so the wording is under test |
| AC-13 | J4 in full; degraded D5, D6; wording W22, W23, W24, W25, W8 |
| AC-14 | J5b item 1; ledger `charged:` row |
| AC-15 | J5b items 2 and 3; ledger `clock:` and `tokens:` rows; wording W28 (both measurements exist), W31 (no baseline measured) |
| AC-16 | J2 end to end, with §3.1 as the expected transcript and §9.1's first block as the expected ledger block |
| AC-17 | No owner surface of its own; the lint's owner-facing firings are W11, W15, W16, W19, W29 |
| AC-18 | No owner surface. Pointer discipline only |

---

## 11. Findings the brief had not anticipated

1. **A shared catalog file can make a wave unformable, or guarantee a conflict.**
   WORKFLOW.md §6.1 requires a builder that touches a route, the schema or a
   catalogued anchor to rewrite the `features.md` row and keep
   `tools/catalog.mjs --check` green **in the same branch**, and §5's reviewer
   rejects such a diff without it. Two briefs in one wave that each touch a
   catalogued anchor therefore both write `docs/product/catalog/features.md`, and
   usually `api.md` or `data-model.md` too. Either they declare those paths — and
   then their declared sets overlap, so **those two briefs never share a wave** —
   or they do not declare them, and the check blocks both for changing files they
   had not listed. Lockfiles behave the same way when two briefs add
   dependencies. The CHANGELOG is **not** in this class: §6.1 gives it to the
   chronicler at session close, not to each brief.
   Scope, honestly: this bites only phases where **two or more briefs each touch
   a route, the schema or a catalogued anchor**, and not at all in a repo whose
   §10 **Catalog** row is `none` — which this plugin repo's row may well be; this
   file did not read it, so the claim is scoped rather than asserted.
   Proposed fix, and it needs a protocol decision rather than a report decision:
   the catalog files become mission-driver-written for the duration of a wave (the
   orchestrator regenerates the derived files once after the last merge and
   rewrites the rows from the briefs' hand-offs), while the briefs **name** their
   rows at hand-off instead of editing them. Route to the architect (memo 5, the
   hot-file list) and to the planner, because the affected briefs' `Do` and
   `Verify` lines change.
2. **A moving drift baseline turns a correct brief into a blocked one** (§4.5).
   The second brief's diff, taken after the first merged, contains the first
   brief's paths. A false block is worse than no guard.
3. **Four brief states, three ledger glyphs** (F4). "Finished and waiting to be
   merged" has no glyph and is the state most likely to be misread as landed.
4. **A declared-empty write set is indistinguishable from an unfilled field**
   (E3), and the two have opposite consequences: one brief is eligible for every
   wave, the other was never meant to be waved at all.
5. **The `deviation` route collides with concurrency** (F6). A brief may stop to
   ask the owner while two others run; two may ask at once. `commands/mission.md`
   routes a `deviation` straight to the owner with no retry and no session
   charge, which is right — but it assumes one brief at a time.
6. **A retry extends a wave rather than adding to it** (J4, states). The cap is
   never at risk — the failed brief has returned, so its retry takes the slot it
   just freed — but three things move that the brief does not mention: the wave's
   end time, the review (which must wait for the retry, or AC-8 and AC-13 cannot
   both hold), and the measured speedup, which must be computed over the wave
   **including** the retry or it overstates the gain.
7. **A retry that cannot start is not a second failure** (W25). Silently
   counting it as one would burn the brief's only retry on an infrastructure
   problem.
8. **An empty integrated range reads as a clean wave** (E5). `commands/mission.md`
   already calls empty changes on `done` suspicious; under concurrency three such
   returns produce a wave that reports success and shipped nothing.
9. **A genuine merge conflict is a defect report, not a routine state** (R4).
   With disjoint lists and a green check it should be unreachable, so its message
   must say that the machinery, not the owner, is at fault.
10. **`Estimate:` cannot be written without running the wave tool** (§0.4). It
    counts briefs + checkpoints, and the checkpoint count now depends on the
    computed wave count. The tool is deterministic, so the planner must run it at
    plan time.
11. **A part-waved phase costs an extra review, and a wave review is not a phase
    end** (§0.4, D2). The brief treats "one review per wave" as a saving; mixed
    with a serial remainder it is an addition — one wave review plus the phase
    checkpoint. The reporting consequence is sharper than the cost: the wave
    verdict must not read as the phase verdict, which is why W32 exists
    separately from W7.
12. **A drift ruling holds the wave review, so an unanswered question stalls the
    phase** (J3 step 6). The review's range depends on the answer, so it cannot
    spawn first. That makes the pending question a real blocker, which is why it
    is mirrored into the ledger's `## Open questions` block and named in
    `Next up:` rather than left in the transcript.

### The single worst truthfulness risk

**"Finished" read as "landed".** Three briefs return in completion order and
merge in a fixed order, and the terminal renders both into one scroll. The brief
that returns first is the one the owner remembers, and nothing about a return
block inherently says the work is not on the phase branch yet — or that it may
never get there, because the check can still block it, a conflict can still stop
it, or the owner may still rule it out. Collapsed into one narrative, "S5
finished at 14:20" becomes "S5 is in", and the owner acts on a phase they
believe is three-for-three when it is nought-for-three.

It is durable rather than self-correcting: the owner carries that belief into the
checkpoint, the pull request and the next mission's plan. And the obvious way to
make the silence feel better — printing progress between the only two events the
orchestrator actually observes — manufactures the same lie faster.

Five deliberate defences, all specified above: the merge order is printed
**before** anything runs, with the sentence "Finishing first does not mean
landing first" (W1); every return block ends "it is waiting, not landed" with its
position (W2); every merge gets its own intent and result line, so landing is
always its own observed event and never inferred from a return (W3, W4); a
brief's checklist row stays `[~]` with a word until it is both merged **and**
covered by a passing review (§9.3); and both "not finished" sentences are
mandatory — W8 when a brief failed out of the wave, W32 when briefs in the phase
have still to run.
