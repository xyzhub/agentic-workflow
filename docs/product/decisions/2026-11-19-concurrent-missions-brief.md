---
status: locked-on-approval
owner-agent: orchestrator
feature: concurrent-missions
date: 2026-11-19
supersedes: .plans/write-sets.* (folded in as deliverable 4)
---

# Feature brief — concurrent missions

_Authored from the owner's words in the 2026-11-18/19 `/agentic-workflow:plan`
session. The **Owner's words and choices** section is theirs; everything else is
drafted. Earlier research this reuses lives in
`2026-11-18-parallel-waves-*.md`; that design (several briefs of ONE mission at
once) stays **parked**._

## What the owner asked for

> "when i asked for the parallel waves, what i meant is that i want to be able to
> run two different missions at the same time without causing conflicts or any
> additional overhead."

The first plan solved a different problem (briefs inside one mission) because
the orchestrator dropped "two whole missions at once" into NOT-in-v1 after the
owner said they did not understand that question. This brief corrects that.

## What breaks today (verified 2026-11-18 in the code)

| Conflict | Where | Effect |
|---|---|---|
| One checkout knows one active mission | `hooks/lib/active-ledger.sh` — "the newest-touched ledger is the current focus" | Budget/overrun, beat nudges and compact-resume follow whichever mission was touched last |
| One checkout = one branch | git | Missions fight over the branch; continuous-operation only avoids it by a hand-made `.worktrees/continuous-op` |
| Shared bookkeeping files | `plugins/agentic-workflow/.claude-plugin/plugin.json` version, `CHANGELOG.md`, `.plans/OBLIGATIONS.md` | Every mission edits them, so the second to land always conflicts. Live example: continuous-operation claims 1.70.0 and write-sets takes "the next minor" |
| Central lists everyone appends to | e.g. the check array in `tools/lint.mjs` (both live missions edit the same line) | A guaranteed textual conflict for any two missions that each add a check |
| Per-mission setup overhead | issue 44 | Free in this markdown repo; in a venture each mission folder needs install, secrets file and its own database |

## The approach (agreed in conversation, owner: "i like this approach")

1. **One worktree per mission**, created and brought to life automatically
   (install, secrets file, a throwaway database from a §10 recipe). Owner: "is it
   going to use worktrees for each mission?" — yes.
2. **Bookkeeping never conflicts.** The version is set once, when a mission lands
   on main — missions do not bump it. The changelog and the obligations register
   become **one file per mission**, combined when the version is set.
3. **Central lists become folders.** Where every mission appends to one list
   (lint checks, hook entries and similar registries), each entry becomes its own
   file discovered automatically, so two missions add two files instead of
   editing one line.
4. **Each mission declares the files it will change** (the `write-sets` work,
   folded in), and a new mission is compared against the running ones **before
   it starts**; an overlap is flagged with a choice.
5. **A real clash is fixed without the owner.** The orchestrator spots it; a tiny
   clash it fixes itself; otherwise it spawns **one existing builder, once**, with
   both versions, both missions' intent and the tests — it reconciles, the tests
   pass, it ends. Not a new agent and not a standing one.
6. **The plugin runs its own merge queue**, on every repo (public or private, any
   GitHub plan). Owner: "replan with the plugin's own queue as default." GitHub's
   native merge queue needs Enterprise Cloud on private repos (GitHub docs,
   checked 2026-11-18), so it cannot be the default.

## Owner's words and choices (2026-11-19)

| Question | Answer |
|---|---|
| Who clicks merge under the plugin's queue? | **"Agent merges what I approve."** The owner approves; the agent updates, tests and merges in queue order. This replaces today's rule that the owner merges feature PRs. |
| How many missions at once? | **"Set per project"** — a project setting, **default 2**. |
| What proves it works? | **All four:** "Two missions run and land" · "Clash caught before start" · "Clash fixed automatically" · "Bookkeeping never clashes". |
| The parked one-mission parallel design? | **"Keep it parked."** |
| Earlier: GitHub merge queue availability | Checked: this repo (public, org-owned) qualifies; private repos such as Orderly need Enterprise Cloud; the `xyzhub` plan is not readable by this login. |

## Acceptance criteria

**J1 — start a second mission**
- **AC-1** Starting a mission creates or reuses its own worktree and brings it to
  life from a §10 recipe; the owner never runs a git or setup command.
- **AC-2** The new mission's declared files are compared with every running
  mission's before work starts; an overlap is shown in plain words with a choice
  (wait, or run and resolve at landing).
- **AC-3** The per-project cap holds (default 2): a mission beyond it does not
  start and says which missions hold the slots.

**J2 — both run**
- **AC-4** Each mission's hooks follow its own ledger, never the other's
  (ledger chosen by branch, not newest mtime).
- **AC-5** No mission edits the version number, and the changelog and
  obligations are written one file per mission.
- **AC-6** The central lists two missions are known to both append to are
  folders of entries, discovered automatically.

**J3 — both land (the plugin's queue)**
- **AC-7** The owner approves PRs in any order; the agent lands them one at a
  time, each first updated from main and re-tested on the combined result.
- **AC-8** The version is assigned and the changelog files combined at landing;
  two missions' bookkeeping lands with zero conflicts.
- **AC-9** A PR whose combined tests fail goes back to its mission with a plain
  reason; the rest of the queue keeps moving.
- **AC-10** The agent merges ONLY a PR the owner approved. The approval must be a
  signal the agent itself cannot produce (see Risk 1).

**J4 — a clash happens anyway**
- **AC-11** A tiny clash is fixed by the orchestrator; any other is fixed by one
  one-shot existing builder; the combined tests pass before landing.
- **AC-12** Where the fix changed real code, the reviewer re-checks just that
  part before it lands.

**Done (owner's four)**
- **AC-13** Two real missions run at once in separate worktrees and both land
  with no PR updated by hand.
- **AC-14** A deliberate overlap is flagged before the second mission starts.
- **AC-15** A deliberate clash is fixed automatically and the tests pass.
- **AC-16** Both missions change bookkeeping and both land clean.
- **AC-17** `node tools/lint.mjs` green; protocol text has one home (`checkRuleDedup`).

## Locked decisions (owner, 2026-11-19)

**LD-1 — Two phases in ONE mission.** _"Two phases (Recommended)."_ Phase 1:
worktree per mission, ledger by branch, bookkeeping fragments, central lists →
folders, pre-start overlap check, per-project cap (default 2), the one-shot clash
builder, a burn meter, and the plugin's queue in **"agent prepares, owner
clicks"** mode — the agent updates and re-tests every PR; the owner merges.
Phase 2 (same mission, gated): **"agent merges what I approve"**, enabled only
(a) on a host where no owner GitHub login is stored — detected by listing stored
logins, not by probing the ambient token — and (b) after the first real
two-mission run shows combined tokens/hour ≤ 2.2 × the single-mission baseline.
Phase 2 needs an agent GitHub identity (a GitHub App), which the owner creates.

**LD-2 — Measure first, then set the spend ceiling.** _"Measure first, then
set (Recommended)."_ The plugin measures normal single-mission runs, proposes a
tokens/hour ceiling, and the owner confirms it. **Two missions cannot run at once
until a confirmed ceiling exists**; above it, new spawns pause and the owner is
asked.

**LD-3 — A clash fix that changes approved code needs re-approval.** _"Ask me
again (Recommended)."_ Only when the fix changed what the owner approved.

**LD-4 — Never push to an approved branch** (counsel, technical lens; locked by
the orchestrator as a design fix, not put to the owner). The combined result is
tested on a scratch ref; the merge lands exactly the approved commit; the
version and changelog are set in a records-only follow-up. This removes the
whole-file exemption the security review attacked and lets GitHub's stale-
approval dismissal stay on.

**LD-5 — Counsel's named changes carried into the design.** A per-PR landing
lock with a heartbeat, re-checked before merging (not a 30-minute takeover on a
whole-queue lock); the merge guard also covers approve-shaped commands, and any
unexpected 403 or hook timeout fails **closed**; the worktree path's survival
against Claude Code's own cleanup is measured before any brief depends on it.

**LD-6 — The rest of the architect's picks stand as recommended** (memos M1,
M3–M6): `.claude/worktrees/<mission>` with `.worktrees/` as fallback; changelog
and obligations one file per mission with `OB-<mission>-<k>` ids; the lint
checks, `hook-test` and `lint-test` become folders while `hooks.json` and the
README stay single files with pure-addition clashes auto-merged; the overlap
check compares declared files plus each running mission's actual changes; no
GitHub native queue in v1.

**LD-7 — Planned and parked.** _"Planned and parked."_ Written and plan-judged
now; not scheduled. The `write-sets` plan is **superseded** by this one (its
write-set field is deliverable 4 here); `parallel-waves` stays parked.

## Risks the drafting must resolve

1. **Approval forgeability.** `gh` on this machine is logged in as the owner's
   own account (`masterde`). A GitHub review approval from that account is
   therefore something the agent could post itself. "Agent merges what I approve"
   needs an approval signal the agent cannot fake — this is a security-boundary
   question, and the merge guardrail hook (`hooks/hooks.json`, §10 records-only
   allowlist) must change with it.
2. **Merge-policy change.** §10 today: `agent-may-merge (records-only)`. The
   owner's choice widens it to approved feature PRs; the profile row, the merge
   guardrail and the gate policy text all move.
3. **Token burn.** Two missions at once roughly doubles spend per hour; the
   plugin was disabled once (2026-08-19) over runaway missions. The cap and each
   mission's own overrun stop must stay honest.
4. **`.plans/` is tracked** and each worktree carries every ledger; which copy is
   authoritative must be explicit (issue 44 point 4; `active-ledger.sh` already
   prefers the default branch's `Closed:` stamp).
5. **Issue 116 (mission lease)** — one machine drives a mission; overlapping
   remit with the cap.

## NOT in v1 (each line says what is lost — in this repo a cut is permanent)

| Left out | What is lost |
|---|---|
| Several briefs of ONE mission at once | Parked as `parallel-waves` (owner) |
| Missions spread across remote SSH machines (issue 53) | Concurrency stays on one machine |
| Codex-runtime parity | Claude only until Codex is re-subscribed (issue 122) |

## Open shape decisions (architect memos)

1. Worktree lifecycle + bring-to-life recipe (issue 44 points 1–3), and ledger
   selection by branch (point 4).
2. The plugin's merge queue: where the queue lives, how landing order is held,
   update-from-main + combined test, and the approval signal (Risk 1).
3. Bookkeeping fragments: changelog and obligations file format, when and who
   combines them, version assignment at landing.
4. Central lists → folders: the inventory of shared lists in this plugin and
   the pattern ventures follow.
5. Pre-start overlap check + clash resolution: how declared files are compared,
   and the one-shot builder's brief.
6. Whether to also support GitHub's native queue where available, or not.

## Priority

Planned and parked (LD-7).
