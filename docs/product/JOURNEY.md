# Journey

This is the founder-facing record of the Agentic Workflow project — plain
language, dated, newest entries first. Nothing here is rewritten after the
fact; corrections show up as new entries, not edits to old ones.

What this project is: an agentic operating protocol, packaged as a Claude
Code plugin, that walks a project from a raw idea to a launched, viable
product and keeps operating it afterward. It ships as 16 specialist agents
(researcher, designer, architect, business, planner, advisor, marketing,
ops, analyst, writer, reviewer, chronicler, and four implementers), roughly
twenty slash commands, a set of guardrail hooks that stop the machinery from
doing dangerous things unsupervised, and an eval suite that grades the
protocol's own behavior the way a QA team would.

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
