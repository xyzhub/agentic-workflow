---
description: The V6 operating loop — errors, costs, funnel, and unit economics in one pass, ending in a ranked growth backlog and owner action items. Run weekly, or on a schedule.
argument-hint: [focus e.g. errors|funnel|costs]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, Artifact]
---

Run one cycle of V6 (Agentic Workflow §0, V6 row). Requires a launched product
(V5 gate passed) — if the project isn't there yet, say which stage it IS at and
stop. `$ARGUMENTS` optionally narrows the focus; default is the full loop.

**Portfolio mode (§13)** — when run inside a registry repo (a `registry.md`
with venture rows), sweep instead of single-venture: one reader per
registered venture ingesting its existing conclusions (status-page data
regions, ledger `Next up:`, track record — local checkout at the recorded
path, else its remote via `gh`; never its corpora). Roll up to ONE report:
each venture's stage and health, blocked gates across the portfolio, and a
single cross-venture ranked backlog — this week's mission goes where? Update
the registry rows (`last /operate`, stage), the portfolio ledger, and the
portfolio status page (seed `overview.html` on the first run), then send the
digest (§12). A venture needing its own deep cycle gets a one-line route:
run `/operate` there.
Each run is self-contained and compares against the previous cycle's report —
the natural setup is a **scheduled agent (weekly)** invoking this command, so
the owner reads reports instead of remembering to ask for them.

## 1. Numbers first

Spawn the `analyst`: funnel vs. the launch metrics (from `marketing`'s launch
plan), cost per user / per feature, error and performance trends since the last
cycle. Every number cited; unmeasured reported as unmeasured — the rest of the
loop consumes these conclusions, so nothing downstream may improvise its own.
Funnel findings arrive with ranked behavioral hypotheses and the cheapest
experiment for each — experiments are proposed to the human, never launched
(§11).

## 2. The three reviews (parallel, consuming the analyst's numbers)

- **`ops`** — error/monitoring triage ranked by user impact, runbook
  truthfulness, infra-cost drift.
- **`marketing`** — funnel review against the launch metrics, content-plan
  currency, channel-experiment candidates.
- **`business`** — unit-economics drift, pricing-experiment candidates,
  executive-summary refresh if the picture changed.

## 3. Merge into ONE operating report

- **Health**: incidents and errors (new vs. known, ranked by user impact),
  monitoring/runbook status.
- **Growth**: funnel vs. launch metrics, what moved and why we think so.
- **Economics**: cost and margin drift against the business model.
- **Ranked backlog**: every finding shaped as a runnable next step — a
  `/mission "<name>"` for big items, a session, or `/fix` — with
  acceptance criteria sketched. Rank by user impact and risk across ALL
  categories, not per-category.
- **Owner action items**: the human-only moves (merges, spend, publishing).

## 4. Record

Spawn the `chronicler` (JOURNEY entry + status page data regions), then
republish the status page via the Artifact tool to its recorded URL. The
next `/operate` compares against this cycle — the report is the baseline.
When an owner channel is configured (§12): send the **digest** (≤3 lines +
status-page link), and a separate **alert** for any user-impacting incident —
also check `.plans/pending-gates.md` against the channel for decisions taken
since the last cycle (verify sender + nonce, consume, log — matching only
THIS project's `G-<project>-…` ids on a shared channel, §12).

Nothing here fires production changes: diagnose, rank, prepare. Growth missions
re-cycle the V3–V5 gates like any other work (§0, V6 row).
