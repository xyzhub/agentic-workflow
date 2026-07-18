# {{PROJECT_NAME}} — Session Handoff

_A **re-read manifest**, not a summary. Written by `/agentic-workflow:handoff` when the main
agent's context is filling, so a FRESH session continues by reading the same
verbatim files — never a diluted auto-summary of the old transcript (WORKFLOW.md
§2, principle 1; §6.2). Pointers, not corpora: name the artifacts, don't paste
them. Deploys to `docs/product/session-handoff.md`. Overwritten each handoff;
the durable record lives in the artifacts this points at._

## Goal
_What this session is trying to achieve — one or two sentences. The fresh agent
reads this first to know what it's here for._

## Locked decisions (do not re-litigate)
_Choices already made, each with a one-line why, so the fresh agent doesn't
reopen them. Dated where it matters._

- _the decision — why._

## State — done / in-flight / next
_The working checklist. `next` is the single most important line: it's where the
fresh agent starts._

- **Done**: _what's finished and verified._
- **In-flight**: _what's mid-edit and to what state (compiling? tests green?)._
- **Next**: _the exact next action._

## Pointers to the real thing (read on demand)
_Where the verbatim detail lives, so the fresh agent pulls it into a clean read
budget instead of inheriting a paraphrase. Paths and ranges, not contents._

- **Branch / PRs**: _`feat/…`; PR #…_
- **Plan / ledger**: _`.plans/<mission>.md` · `docs/…` · the plan file._
- **Files in play**: _`path:line-range` — what's being changed there._
- **Verify**: _the gate command + last signal (green/red)._

## Open questions for the human
_Anything blocking that needs an answer — with a recommendation, so the resume
starts from a decision, not a blank._

---
_Resume: a fresh session reads THIS file (and only follows its pointers as
needed), then continues from **Next**. No transcript replay — the files are the
memory. When a mission is active, its `.plans/<mission>.state.md` ledger is the
richer record; prefer it and keep this as the lightweight interactive-session
snapshot._
