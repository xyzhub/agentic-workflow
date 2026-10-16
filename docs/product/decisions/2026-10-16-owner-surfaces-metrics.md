# Owner-surfaces (goal-statement E2): metrics, 2026-10-16

Analyst. Pulled 2026-10-16 from repo HEAD (branch `plan/owner-surfaces`, base
66dc6af). Every figure: measured (command given), estimated (arithmetic
shown) or unknown (said so). Source of the success definitions:
`2026-10-16-owner-surfaces-brief.md` (J1-J4); acceptance bar: goal statement
section E2, "Done when".

## Baselines and checks, per success definition

| Success | Baseline now | Runnable check for "done" | No claim inside this mission |
|---|---|---|---|
| **J1 Decide on the page** | **Measured:** 0 owner answers stored as structured data. No tool, schema or store for questions or answers exists (`grep -rnE "schemaVersion\|question schema"` over `plugins/agentic-workflow` finds nothing). `AskUserQuestion` is named in 12 of the command files (`grep -c AskUserQuestion plugins/agentic-workflow/commands/*.md`: adopt 2, autopilot 2, bootstrap 3, brainstorm 3, connect 4, groom 3, mission 4, next 2, plan 3, publish 4, sync 3, welcome 2), as instruction prose only. 4 briefs carry an "Interview answers" section (graph-engineering-p1, launch-media, operate-bugfix, this one), each transcribed prose. **Unknown:** the chat-vs-structured ratio of past questions. No ledger field records the channel, so a count would be invented. After this mission the field exists and the ratio becomes measurable going forward. | Harness cases (fixture, no network): (a) valid owner answer for a pending nonce is accepted and logged as a dated decision; (b) replayed nonce, stale nonce, wrong identity, unknown option id are each refused and reported; (c) a gate whose class is irreversible (deploy, merge-to-default, publish, spend) records the decision but triggers no act; (d) `hooks/hooks.json` has no `AskUserQuestion` matcher (the engine never hooks the question tool). | That the page widget works in the live claude.ai Artifact runtime: subagents cannot publish or call `ArtifactData` (platform facts). Live round trip = main-session check, one obligation row. That the owner actually answers on the page rather than in chat (adoption). Metric 1 effect (fewer owner prompts) is not claimed; one mission is n=1 and the effect needs E1's three-change measurement style. |
| **J2 Page is generated** | **Measured:** `docs/product/overview.html` is 256 lines and has no generator; every change is a hand edit. 33 commits have ever touched it; 19 of them since 2026-10-01. Last 8 passes (each a chronicler or bookkeeping commit): lines added/deleted 5/4, 6/4, 3/2, 6/5, 7/6, 4/3, 1/1, 6/5 = **38 added, 30 deleted, 8 of 8 passes hand-edited** (`git log -8 --numstat -- docs/product/overview.html`). Lines are an indicator only: single HTML lines are long, so byte volume is larger than the line counts suggest. | `node <generator> --check` (name set by the plan) rebuilds the page from the fixture data and exits 0 only if the output equals the committed `overview.html` outside the declared hand regions. Plus: next 3 chronicler passes after merge leave a diff of 0 lines in data-covered regions (`git log -3 -p -- docs/product/overview.html` shows only generated-region changes from the generator). Agent file for chronicler no longer instructs hand edits of those regions. | That the three post-merge passes happen inside this mission: they occur after it, so they are an obligation row, not a mission claim. Republishing the Artifact (main session only, version 20 today) is not claimed by subagent work. Ops state in the page (errors, costs, triage) is claimed only for fixture-fed data, not for a live Orderly feed. |
| **J3 JSON for tools + lease** | **Measured:** JSON output exists for `agents.mjs --json` (registry, plugin_version 1.62.0) and `ceremony.mjs derive/effective/check --json`. **No JSON mission-state command**: `tools/ledger.mjs` has no `--json` verb, and no versioned schema file exists. `.plans/` holds 55 files, all markdown, 0 JSON. **No mission lease**: a whole-word search for "lease" in the plugin finds no mission lease (hits are the word "release" in other files). Two sessions can drive one mission today; no mechanism stops it. | (a) `node tools/<state-cmd> <mission> --json` against a real ledger (this repo's `adaptive-ceremony`) emits output that validates against the committed, versioned schema (a test does the validation; the schema has a `version` field). (b) The `/plan` interview fixture emits questions with the same schema (headline, what-changes, risk, estimate, recommended option, stable option ids, evidence links, gate class all present; test fails if any is missing). (c) Lease test: second acquire on a live lease is refused; an expired lease can be taken; release works. (d) Gates: lint, plugin tool tests, hook-test, eval suite green. | Cross-machine lease safety: a file lease inside one clone proves two local sessions conflict; two machines need a shared store, which is not in v1 unless the plan says so (state it in the plan, do not claim it). Missions pin bump and contract tests: M track, runs after release. |
| **J4 Client-ready** | **Unknown, by design:** no outsider read has happened. Nothing measured; "presentable to a paying client without explanation" has no baseline. | Mechanical proxy only: a lint or test asserts every rendered question carries the seven required fields and a gate class, and that no unexplained internal jargon token from a listed deny-set (for example `OB-`, `ckpt`, `HITL`, raw ledger ids) appears in the generated page outside evidence links. Plus the human step: one outsider reads the page and answers the three brief questions (what is happening, what is asked, what each option changes). | **The proxy passing does not claim client-readiness.** A real outsider or paying client reading the page is an obligation row (same style as E7's "one outsider before E3 publishes"), owed to the owner. The jargon deny-set is a heuristic and misses unlisted jargon. |

## Statements about the goal statement's "progress" metrics

- **Metric 1 (engine outcomes: fewer sessions, fewer owner prompts, less reviewer spend, fewer correctives, no safety regressions): no claim.** This mission adds capability. It is a single mission with no before/after pair, so any effect on owner prompts would be an invention. What it does claim: the safety boundary is unchanged, evidenced by the J1 check (c) and hook-test staying green.
- **Metric 2 (revenue) and 4 (pipeline): no claim.** A client-ready page is an enabler; nothing here is attributable to a sale or enquiry.
- **Metric 6 (Missions health): no claim.** The Missions app changes were offered and not excluded, but no pin or contract-test result is claimed unless the plan includes it.

## Suggested obligation rows (for the plan to register)

1. Live round trip of one on-page decision in the real Artifact runtime (main session; owner identity).
2. One outsider reads the page; record their three answers verbatim.
3. Three chronicler passes after merge with zero hand edits in data-covered regions.
4. Lease behaviour on two machines, if a shared store is not built in v1.
5. Re-measure the chat-vs-structured ratio after the first N missions with the channel field (N set by the owner; unknown now).

## Source commands (all read-only)

- `git log --format='%h %ad %s' --date=short -- docs/product/overview.html` (33 commits total; `--since=2026-10-01`: 19)
- `git log -8 --numstat -- docs/product/overview.html`
- `grep -c AskUserQuestion plugins/agentic-workflow/commands/*.md`
- `grep -l "Interview answers" docs/product/decisions/*.md` (4 files)
- `node plugins/agentic-workflow/tools/agents.mjs --json`; `grep -n json plugins/agentic-workflow/tools/{ceremony,ledger}.mjs`
- `ls .plans | wc -l` (55)
