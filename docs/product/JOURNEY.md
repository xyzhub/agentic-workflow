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
