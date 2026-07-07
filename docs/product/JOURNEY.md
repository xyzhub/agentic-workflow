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
