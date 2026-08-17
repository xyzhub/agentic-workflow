# Journey

This is the founder-facing record of the Agentic Workflow project — plain
language, dated, newest entries first. Nothing here is rewritten after the
fact; corrections show up as new entries, not edits to old ones.

What this project is: an agentic operating protocol, packaged as a Claude
Code plugin, that walks a project from a raw idea to a launched, viable
product and keeps operating it afterward. It ships as 20 specialist agents
(researcher, brainstormer, designer, architect, business, planner, advisor,
compass, intake, curator, marketing, ops, analyst, writer, reviewer,
chronicler, and four implementers — backend, frontend, devops, security),
roughly twenty slash commands, a set of guardrail hooks that stop the
machinery from doing dangerous things unsupervised, and an eval suite that
grades the protocol's own behavior the way a QA team would.

---

## 2026-08-17 — correction: two numbers in this file had drifted

The entry below says the clock-guard harness holds 55 cases. That was true
when written, but the same PR kept growing it — later review rounds and a
pre-merge fix list added cases, and at today's tip `node tools/lint-test.mjs`
reports 69. Per this file's own rule the original line stands and this entry
corrects it. Separately, the preamble above claimed 20 specialist agents while
naming only 16; `plugins/agentic-workflow/agents/` holds 20, and the preamble
— a standing description of the present, not a dated entry — is corrected in
place to name all of them (brainstormer, compass, intake, and curator were
missing). This entry is the dated record of that in-place edit.

---

## 2026-08-17 — the day a council took a mission apart, and the guard failed both ways

### Milestone: a review that deleted two thirds of its own mission

A session that began as "how do we take advantage of graph engineering?" ended
as a lesson in verification. The plan was three changes: freeze a held-out eval
set, add a paired counter-metric row, and give the obligations register
declared edges. A five-lens Opus council was convened before the merge, and the
premise lens went first — at the evidence, not the code.

Two of the three changes rested on claims that were false. The eval fixtures had
never been contaminated: `git log -- evals/scenarios/` stops at 2026-07-23, and
context-economy, which ran 2026-08-01→03, touched nothing under `evals/`. The
"−401.4k chars / −19% Goodhart" evidence was a misread of a token comparator
that was never optimised at all. Both changes were dropped. The third,
`depends-on:`, was built, reviewed, and reverted: five lenses found it inert in
every shape the repo's own documents tell an author to write — the mandatory
`· fired …` append pushed its end-anchored tail off `$`, and the indented
continuation form its own architecture memo had recommended was invisible to
every check.

### What actually shipped, and what it cost to learn

The L3 clock guard — `when:` must name an observable state, never a clock — had
grown three `^`-anchored branches, one per past incident, each verified against
the cases its author had in mind. Measured against a corpus built from the
reviewers' counterexamples instead, it scored **25 of 44 wrong**: it missed ten
real clocks while blocking fifteen honest conditions, including OB-11's own
`when:` one word away from its live text.

The rewrite then made the same mistake twice more, in miniature, and both were
caught by self-review rather than by a reviewer. The entry-point guard added to
make the linter importable silently disabled the entire gate under a symlink —
a check reporting success while checking nothing, shipped inside the fix for
exactly that. And an old-versus-new differential showed the rewrite had lost
three clock forms the previous guard caught; one had been documented, two were
unknown. A late lens then found the replacement rule reopened the original
smuggling hole for any condition with three or more clauses.

The durable output is not the regex. It is `tools/lint-test.mjs` — 55 cases,
most sourced from outside the implementer's head, mutation-proved in both
directions, wired into the gate fail-closed. Structural checks prove a row
parses; this proves the guard decides.

### The lesson, stated plainly

A test suite proves you did not break what you listed. Only a differential
proves you did not break what you forgot to list.

That covers half of what the councils found. The verification defects — a
guard measured against the cases its author had in mind, a command verified
against the wrong case, a differential skipped — all share that shape. The
other half were record defects, and they share a different one: asserting
something about an artifact without opening it. A probe that pointed at a file
that did not exist. A pointer to a §10 key that had never been added. A
precedent cited for a rule it did not contain. A register condition rewritten
in place against an append-only rule. Both halves are failures of checking, but
only one is a failure of testing, and the second kind survived three rounds
precisely because tests do not catch it.

---

## 2026-08-11 — deferred-obligations: giving "we'll get to it" a home that doesn't forget

### Milestone: the thing that gets missed finally has somewhere to live

The owner named the pattern behind this project's own past misses in one
sentence: *everything done correctly had an immediate trigger; everything
missed was deferred with nothing to fire it.* A promise made mid-session — "do
this once X happens" — had nowhere durable to go. It lived in a transcript
that would eventually compact away, or in a person's memory, and either way
the thing that was supposed to happen later quietly didn't. This mission
built the four pieces that close that gap, in order, over three phases so far.

**A parking place with real grammar.** Every mission's working ledger now
carries a `## Closing` section, and the project gained a standing register
(`.plans/OBLIGATIONS.md`) for obligations that outlive any single mission.
Every row states what to do, what observable condition should trigger it, and
how to check that condition — deliberately never a bare clock. "Weekly" isn't
a condition; "a new compaction record exists in the corpus" is. Two new
automated checks enforce the grammar and refuse to let a mission claim itself
finished while an obligation sits unresolved.

**A prosecutor, exercised on real evidence.** A new `/agentic-workflow:settle`
command inventories every open obligation, checks each one against the
project's actual deploy signal, and — only for the class that's provably safe
— cleans it up itself. Rather than trusting the design on paper, the team ran
it live against this repo's own years of branch debris: **41 stale local
branches and 15 stale remote branches were deleted**, each one individually
proven merged and green before it went, with the full evidence trail written
down branch by branch. A strict audit checked every single deletion against
the actual git history afterward and found nothing wrong: no unmerged work
touched, nothing still in review, nothing protected. Three branches that were
already fully wrapped up but initially got caught by an over-cautious rule
were flagged rather than silently deleted — the human made the final call on
those, and the rule was corrected for next time.

**A reminder, not an interruption.** A small new background check now looks,
once per session, at whether anything in the register or a ledger's closing
list is overdue, and says so in three lines or less — silent the rest of the
time, never blocking anything.

**A refusal with teeth.** Perhaps the most important piece: a mission can no
longer report itself "done" just because its pull requests are all merged.
If its own closing list still has open rows, the closing step now stops and
runs the prosecutor first. That refusal is backed up two ways — by the
close-out procedure itself, and, as a backstop, by the same automated check
that would catch a human trying to skip the procedure and stamp the ledger
closed anyway. One clarification came out of a real conversation mid-mission:
a one-off request like "post updates every ten minutes" is not the kind of
thing this system is for — that's a live, in-session ask, not a promise that
needs to survive past the conversation, and the register was deliberately
built to leave those alone.

Three review gates cleared this work, including one held to the project's
strictest standard because it involved real, permanent deletions — all three
approved with zero rounds of correction needed. What's left: the fourth and
final phase, which is this record plus the paperwork for a single merge, and
then the human merges the finished work into the main line once.

## 2026-08-10 — compaction-continuity: a clean handoff instead of a silent one

### Milestone: the owner's own working style got a safety net

The owner doesn't end sessions the way the protocol assumes. He steers
interactively for weeks in one long-running thread, and every so often the
tool underneath silently summarizes that thread to keep it from running
forever — a mechanical necessity of the tool, not a project decision. Before
this mission, nothing warned him it was about to happen, and nothing spoke up
honestly about what had been lost once it did. This mission closes that gap
on both sides of the event, and it does it with a rule the team held itself
to throughout: **fidelity, not savings.** Nothing shipped claims to make
sessions cheaper; everything shipped is about making sure the record survives
the moment the window empties.

Three pieces shipped, in three phases, off the corpus of the project's own
past transcripts:

**Before it happens** — a new background nudge watches how much a working
session has accumulated and, once it crosses a threshold, tells the agent to
write down where things stand before the window fills. The threshold itself
came from measuring the project's own history: only one real compaction event
existed anywhere in the available transcripts to learn from, so the team
treated that single data point as a conservative floor rather than pretending
to a confidence the data didn't support, and said so plainly in the numbers
themselves. The nudge is deliberately quiet — it fires once per threshold, it
stays silent during already-managed multi-session work, and it never
interrupts anything.

**After it happens** — the automatic re-orientation message that used to fire
only when a formal multi-session project ledger existed now also covers the
much more common case: an interactive session with no ledger at all. It looks
for the handoff note the first piece encouraged, tells the agent plainly
whether that note looks trustworthy or stale, and — worst case, when neither
a ledger nor a note exists — it says so outright and instructs the agent to
tell the human the record is missing, rather than quietly guessing from
whatever fragment of the old conversation survived the compaction. That
last case was the real bug this mission fixed: **going silent used to be the
default**, and the owner spends most of his time in exactly the kind of
session where that used to happen.

**In between** — a smaller, related fix: when an agent needs to read a large
file, the standing advice now points more clearly toward handing that read to
a helper that returns a short summary, rather than pulling the whole thing
into the working conversation. This one ships with an unusual kind of
honesty: the team explicitly declined to claim it saves anything, because no
before-and-after measurement exists for it in this project. It's included on
the merits of the practice, not on a number nobody can back up.

The engineering behind all three pieces went through two of the strictest
review gates the project uses, both cleared without a single round of
corrections — a signal that the team resisted the urge to overreach on a
mission that could easily have padded its claims. What went right: the team
caught itself twice trying to lean on numbers that wouldn't hold up — once
when the transcript history it planned to measure from had partly changed
underneath it since the mission was first scoped, and once when double-
checking whether the new nudge might fire during exactly the kind of
supervised, multi-session work that already has its own safety net (it
doesn't, by design). Both were resolved by remeasuring rather than assuming,
and both are on the written record rather than smoothed over.

One step remains before this reaches the owner: a single merge of the
finished work into the main line of the project, which only the human does.

## 2026-08-03 — Phases 2, 3 and 4: three small ships, and the mission's verdict on itself

The context-economy mission closed out in three more pieces of work, then
turned its own measuring instrument on itself one last time — and the
self-audit is the part worth remembering.

Phase 2 was small and mostly invisible to anyone outside the team: a place in
the project's working ledger for the human's own decisions to be recorded
word-for-word instead of paraphrased, and a check that catches the ledger
contradicting itself about what to do next. That second piece mattered more
than it sounds — the "what happens next" line lives in two places in the
ledger, and it had already drifted out of sync three times before anyone
built a check that would catch a fourth. A related fix made the system's own
background reminders smarter: previously, if a piece of work was on hold for
any reason, every reminder behind it went silent too, even work that had
nothing to do with the hold. The reminder system now skips over parked work
and finds the next thing that's actually due.

Phase 3 fixed a real correctness gap, not a cost problem. Long AI sessions
occasionally get automatically summarized to keep them from running forever
— a process that can shrink the working context by more than tenfold in one
step, as it did once during this very mission's own working session. Nothing
told the agent afterward that this had happened or what to re-read to get
back up to speed. Phase 3 adds a short automatic reminder that fires the
moment a summarization happens, pointing the agent back at the project's
working ledger. It is a safety net, not a savings feature, and it was framed
that way from the start.

Phase 4 was the reckoning. The mission re-ran its own measuring tool, this
time on the transcript of the very session doing the measuring, and then
brought in an independent reviewer with a mandate to overturn any earlier
verdict if the evidence warranted it. It did. The review found a mathematical
argument in the mission's own writeup — "the numbers are still roughly right
even though a validity check is failing" — that had been true before an
earlier repair and was quietly no longer true after it, because the repair
had changed what the numerator and denominator of that argument actually
measured. It found a safety threshold that looked like it was "too close to
call" only because of a particular statistical technicality, and that a plain
reading of the same data said it wasn't close at all. It found a threshold
number, meant to trigger a safety review, that was typed into the code in
three different places and never tested — and proved that by deliberately
breaking it: the tool kept reporting green tests while printing a
self-contradicting verdict about its own safety threshold. And it found that
the mission's own machinery — the very apparatus built to measure and manage
context — had grown noticeably heavier while the mission that built it was
running.

The most important finding was the simplest one. The mission had spent five
sessions chasing a lever worth, at best, a few percent of one narrow category
of context — and in the same measurement run, it surfaced a much bigger lever
sitting entirely outside the codebase: the vast majority of one large context
category turned out to be the project owner's own personal library of over a
hundred AI skills, installed on their machine and loaded into every session
regardless of what the session was about. Pruning that library is minutes of
settings work for the owner, not an engineering project, and it is worth more
than everything this five-week mission built combined. The team's own
document doesn't soften this: "a lever roughly one and a half times the size
of what this mission targeted, filed under 'do not act on.'"

Given all of that, the original plan for this mission — a fourth phase
building a "write firewall" to cap how much an AI agent could write directly
into its own context — was formally dropped, not merely postponed. Its
justification had already been retracted in Phase 0.5; Phase 4 confirmed
there was nothing left to rebuild it on. What survives is a page of
discipline text describing good practice (delegate long documents, keep the
main agent's own writes short) with no performance claim attached to it,
because the team had learned, twice now, not to publish a number it couldn't
stand behind. Every figure in the mission's final written record carries an
explicit caveat that it comes from a sample size of one — one transcript, one
session, one operator — and the record says so on every page rather than
once at the top where it could be missed.

The mission's own status page had also gone stale in an ordinary,
unglamorous way: nobody had touched its "what's deployed" line in a month,
even though four real releases had shipped underneath it. This pass fixed
that line. It deliberately did not repaint the rest of the page — the
stage-by-stage lifecycle summary and the quality-pillar scorecard are a
separate editorial job, logged and left for later rather than quietly
patched over.

What this phase leaves behind, honestly stated: a working measurement tool
with a safety gate that fails closed if it's ever removed; a fix for a real
correctness bug around AI session summarization; two small pieces of
process discipline that make the project's own paper trail harder to drift;
and a written record that says, in its own words, "the shipped code is good,
the analysis on top of it was not — and admits exactly where and why." The
team that built the instrument is not the team that gets to grade its own
homework, and this phase made sure someone else did.

---

## 2026-08-02 — Phase 0.5: the instrument got repaired, and the mission's own headline shrank with it

The previous entry left the context-economy mission stopped at a hard pause: a
measuring tool that disagreed with the product's own diagnostics by 5.59×, and
four questions sitting with a human before anyone could act on the numbers it
produced. The human's answer was not to pick an option from that list. It was
to authorize one more phase — Phase 0.5, instrument repair only — before any of
the four questions got answered at all, on the reasoning that deciding a
multi-month build plan from numbers nobody trusted would be building on sand.
Four sessions did the repair. A fifth, sent back once by review, wrote it up
honestly.

The single biggest fix explained most of the original 5.59× gap by itself. One
log record, mid-transcript, briefly reported the running context size as zero —
a known quirk of how the underlying tool reports usage after certain resets —
and the measuring script had been reading that as "the whole conversation just
restarted," re-billing every token that followed as if it had all been rebuilt
from nothing. Skipping that one phantom record dropped the mission's own
reported total by 19%, from just over 2.1 million tokens to about 1.7 million.
The fix was not applied with a heavy hand: some of the growth in that same
window was real, ongoing work, and the tool correctly left it in the count
rather than zeroing out everything downstream of the glitch.

The second fix replaced a guess with a measurement. Converting character counts
to token counts needs a conversion ratio, and the team had already ruled out
pulling in an external tokenizer library — a standing lesson from an unrelated
supply-chain scare earlier in the year, about not adding dependency surface to
a bare checkout. So they built their own zero-dependency estimator, deriving a
defensible range (roughly 2 to 3.2 characters per token) from what the model
itself had actually written in the same transcript, and made every downstream
token figure report as a range instead of a falsely precise point value. Doing
that honestly also surfaced something the cruder math had been quietly hiding:
somewhere between a third and three-fifths of all the context in the session —
more than any single thing the mission was designed to trim — cannot be
attributed to any category the tool knows how to name. That unattributed mass
is now visible only because the tool refuses to smear it across the categories
it can name; it remains unexplained, not undiscovered.

The third fix pointed the tool's built-in sanity check at the correct number in
the product's own diagnostics (it had been checking against the wrong
sub-total). The corrected check still failed: the repaired occupancy figure
runs 28% higher than what the product's own live display shows, for reasons
nobody has yet explained. That failure is reported as a live, unresolved
finding — not tuned away, not hidden behind a passing gate.

None of the four sessions went entirely smoothly. Three separate times, the
session doing the work died mid-implementation on an unrelated infrastructure
failure, unrelated to anything being measured. Each time, nothing was lost: a
fresh session picked up the unfinished changes and reviewed them against the
brief rather than trusting them, before continuing. That discipline caught two
things that would otherwise have shipped quietly. One earlier session's own
safety test turned out to be inert — it happened to exercise a scenario where
two different bug-catching rules both fired at once, so deleting either rule
alone still left the test green, hiding a guard that provided no protection at
all. And a piece of code abandoned mid-session by one of the failed runs was
quietly printing a management decision — "this reopens a settled question" —
into the measuring tool's own output. A tool reporting a number is not the same
thing as a tool making a call, and that line was rewritten to report the
measurement and name the human decision it feeds, not make it.

The reason this phase matters more than a routine bug-fix: repairing the
instrument didn't just shrink an error bar, it moved the mission's own central
argument, and not entirely in the direction anyone expected. The original case
for this work assumed one specific editing behavior consumed roughly a quarter
of a working session's context, worth realistically capturing 10–15% of it.
With the instrument repaired, that behavior measures at roughly 4.4–7.2% of
context addressed, worth capturing perhaps 1.8–4.3% — both still far below the
original pitch. But two of the numbers behind that figure moved up, not down,
once repaired: the smaller total (a 19% drop) and the corrected conversion
band both push the same category's *share* higher, even though the category's
absolute size didn't grow. Smaller correction and larger correction pulled in
opposite directions on the same line item, and the net still landed well below
where the mission started. Every number in this story comes from one
transcript, measured once; nothing has been confirmed on a second session, and
the team is reading all of it as directionally right, not as settled fact.

The first write-up of this work was sent back by review — not for a wrong
number, but for underselling how large the phantom-reset bug actually was, and
for a safety claim ("this guard works") that needed to be proven independently
rather than assumed. The second pass fixed both without moving a single
headline figure, and passed clean. The phase is done, reviewed APPROVE, and
merged. What the team does next — whether the smaller, now honestly-priced
version of the original idea is still worth building — is, once again, a call
that belongs to a human, not to the team that just finished proving its own
numbers wrong once already.

---

## 2026-08-01 to 2026-08-02 — The context-economy mission built a measuring instrument, then caught it lying

The team's own long working sessions had been quietly getting more expensive to
run: an orchestrator session accumulates context turn after turn, and nobody
had ever measured where those tokens actually go. A new mission,
"context-economy," set out to fix that — planned as five phases, deliberately
structured so the first phase does nothing but build the measuring instrument
and take one honest baseline reading, with a contractual requirement to STOP
after that reading. A human has to look at the real numbers and decide what
to do next, rather than the team improvising the next four phases on a guess.

Phase 0's first session corrected a factual error sitting in the product's
own documentation: a claim that each tick of "loop mode" (long, unattended
autonomous runs) starts with a fresh slate of context. It doesn't — a loop is
one continuous session, and every tick adds to the same transcript. What
actually keeps loop mode safe is that important state lives in files, not in
a model's memory, so even a very long session doesn't lose track of what it
is doing. That correction went out everywhere the wrong claim had been
written, including copy drafted for external use but never published.

The second session built the measuring tool itself — a script that reads a
session transcript and reports what share of its context came from where:
human instructions, the orchestrator's own writing, tool results, sub-agent
returns, and so on. The third session pointed it at an 11.6-megabyte real
transcript and got a number that should have been reassuring and instead was
a red flag: the tool's total didn't just differ from the number the product's
own `/context` display reports — it was 5.59 times larger. Per the mission's
own plan, a gap that size was defined in advance as a "this instrument cannot
be trusted for absolute numbers" verdict, not a "close enough" one.

What happened next is the part worth remembering. The team didn't wave the
discrepancy away. Review found two structural bugs in the days that
followed — not caught by the tool's own tests, but by a second, independent
read of the work: a calibration ratio had been computed upside down
(tokens-per-character where the code meant characters-per-token), which had
driven one internal number to a negative value the tool's own logic said was
impossible; and a safety check meant to catch exactly that class of bug
turned out to be inert, because the test data it ran against happened to sit
at the one ratio where the bug produces no visible effect. Both were fixed —
and, tellingly, fixing them changed nothing about the headline number. The
5.59× gap survived every correction, which is itself informative: the
discrepancy is not a bug in the new tool, it is a real disagreement about
what "how much context did this session use" even means. The leading theory,
left for a human to rule on: the tool counts every time context gets rebuilt
after a compaction, while the product's own context display shows only the
current moment — cumulative churn versus a single snapshot, two different
and both legitimate things to want to know.

Review scored the phase APPROVE (a clean pass on QA, security, efficiency,
architecture, and UX; one point held back on developer experience) once every
finding was addressed, and Phase 0 merged into the mission's integration
branch. But by the mission's own design, that is where it stops. Four
decisions now sit with the human at this pause: whether to accept the
"cumulative churn" theory before any before/after comparison is designed;
what to do about a finding that one specific sub-agent — the reviewer
itself — accounts for a larger share of context (4.0%) than the plan's own
3% threshold allowed for, reopening a decision the team had thought settled;
which of two ways of counting the "addressable" slice of context is the
right one to re-plan the remaining phases against; and whether a separate
wrong guess about how attachment data is structured (also caught by the run)
needs its own follow-up. Nothing further on this mission proceeds until those
calls are made.

The lesson the team is taking from this: a measuring tool that ships with a
documented reason to distrust its own headline number is a more honest
deliverable than one that ships confident and wrong. It is also a reminder
that green tests are not the same as a correct instrument — both bugs here
passed a clean self-test every time, and only surfaced because someone sat
down and asked "does this number make sense," rather than "does this number
match what the code already does."

---

### Milestone: The plugin adopted its own workflow — 2026-07-08

Today the repository that builds and ships the Agentic Workflow protocol
was itself brought under that protocol. `/adopt` ran against this repo,
filled a project profile (§10 of `docs/WORKFLOW.md`) recording who holds
merge authority, what the test and release gates are, and where this
project's own portfolio entry lives, and placed the repo at stage V6 —
Operate & evolve. In plain terms: the tool that tells other projects how to
run itself is now run by its own rules. There is no separate, informal
process for the plugin's own releases anymore; the same gates, the same
reviewer discipline, and the same chronicler record-keeping now apply here
too. It is a small act of eating your own cooking, and it means any gap in
the protocol will now be felt here first, before it reaches anyone else's
project.

## 2026-07-07 to 2026-07-08 — A single review session, sixteen versions

Over one continuous working session the project moved from v1.16.0 to
v1.30.0 — fifteen releases in a row. This wasn't fifteen separate pieces of
work so much as one focused push to close gaps found during a hard look at
the whole system: guardrails were tightened, the rule for who is allowed to
merge what became something a project can delegate rather than a fixed
default, and the agent roster grew to cover architecture decisions, red-team
advice, day-2 operations, and analytics — roles the original lineup didn't
have. Commands were renamed to single words to make them easier to reach
for. An owner channel was added so a human can approve or reject a gate
from Slack with a tap, instead of needing a terminal open — including a
"loop mode" for longer unattended runs and a portfolio registry so one
owner running several projects gets one place to look instead of many.

What went right: the session used the project's own eval suite to check its
work as it went, and it finished at 8 out of 8 passing scenarios — the
protocol grading itself and coming back clean. What was imperfect: several
of these fifteen versions were small follow-up fixes to the version just
before them (a YAML-formatting bug in frontmatter, a Slack scope list that
was wrong, an `/adopt` calibration issue) — a reminder that shipping fast
in a single sitting still produces a trail of small corrections, and that
the corrections are worth recording rather than squashing away. The lesson
carried forward: treat a big review session as a release train, not one
release, and let the changelog show the real shape of that work, warts
included.

## 2026-07-03 — Founding buildout

The project's first working day. Starting from a v1.0.0 "Venture Workflow
plugin," the core lifecycle took shape fast: specialist agents for backend,
frontend, and security work; a researcher agent for the earliest idea-
validation phase; a designer agent and an autonomous mode; a devops agent
and a `/release` command; a planner agent and the first version of mission-
level execution (originally called "effort," renamed to "mission" the same
day once the naming didn't sit right). By the end of the day the project
had tier-1 deterministic linting wired into CI, a marketing agent covering
go-to-market at the launch and operate stages, a reviewer scorecard with
adversarial multi-vote review for high-stakes decisions, a real tier-2 eval
suite driven by an LLM judge against fixture repos, a business agent for
pricing and unit economics, and `/adopt` — the command that lets an
existing project join the workflow instead of only greenfield ones. This is
also the day the project settled its own name (agentic-workflow, not
"plugin"; "protocol," not "skill") and did a consistency pass to make sure
the rulebook it was asking other projects to follow was internally
consistent itself.
