# Session handoff — 2026-10-16 (refreshed mid-mission, configurable-attribution)

_A re-read manifest, not a summary (WORKFLOW.md §6.2). A fresh session reads
the files named here; it does not inherit this session's transcript._

## Goal

Make the Agentic Workflow XYZ's flagship asset and the front door to XYZ's
revenue, with Missions as its companion. The full statement and every decision
of 2026-10-12 are on `main` in this repo:
`docs/product/decisions/2026-10-12-goal-statement.md` (v9 + the amendment of
the same date) and `docs/product/north-star.md` (Purpose, worthy progress,
rollup). Read those two before anything else.

## Locked decisions (do not re-litigate)

- The plugin is the flagship; Missions follows it through its pin; the plugin
  never depends on Missions or the Missions server.
- Other industries are **forks** of the plugin, discipline files untouched; no
  multi-industry abstraction in the base.
- The control plane is **Missions**, built as an XYZ **distribution of
  Paperclip** (MIT): server in xyzhub/missions-server, runner and desktop stay
  in xyzhub/missions. Paperclip's own Claude Code adapter is never used (hooks
  do not load under it). Brakes become runtime-agnostic. Reasons and evidence:
  the goal statement's amendment and
  xyzhub/missions-server `docs/product/decisions/2026-10-12-missions-server-vision.md`.
- Orderly is the n=1 venture for the operate loop.
- The plugin's business-model lock of 2026-07-08 is amended: free and MIT;
  the paid layer is services, managed operations, paid industry adaptations,
  consulting and education.
- Naming closed: Missions keeps its name; Firm, Bureau, Works, Flow and others
  dropped (list in the amendment, decision 10).

## State

- **adaptive-ceremony (goal statement E1): CLOSED 2026-10-15**, v1.61.0 on
  `main` (PR #146, bookkeeping #148). Open: OB-29, OB-30, OB-31 in
  `.plans/OBLIGATIONS.md`; #147 (`/plan` judge skips the ceremony resolver);
  #143 (`ledger.mjs promote` paren names fail lint, hit twice).
- **configurable-attribution: IN FLIGHT** on branch
  `mission/configurable-attribution` (one session, estimate 1). Ledger:
  `.plans/configurable-attribution.state.md` — read its `Next up:` first.
  S1 built and green (v1.62.0: §10 **Attribution** row,
  `tools/attribution.mjs`, hook/commands/ledger read it, default
  `Generated with The XYZ Protocol`). The Fable checkpoint ckpt-s1 was
  spawned 2026-10-16; on APPROVE → open the PR to `main` for the owner's
  merge (human-merge), then one bookkeeping PR at close.
- Verify signal: `node tools/lint.mjs` clean; `cat .claude/settings.json`
  shows the XYZ Protocol attribution.

## Owner-only items still open

- Ratify or change the Assumed wording `Generated with The XYZ Protocol`
  (configurable-attribution L3).
- Confirm this repo's `proposed` ceremony profile (§10.2) — optional.

- Portfolio registry (xyzhub/registry, unreachable from cloud sessions):
  append a ledger pointer to the goal statement, the north star and
  missions-server.
- Install the plugin in the cloud environment used for missions-server
  sessions, then run `/agentic-workflow:sync` there (hand bootstrap check).
- Anthropic's written approval for hosted subscription use (Missions' cloud
  tier) has not been sent.

## Pointers

- This repo: `docs/product/north-star.md`,
  `docs/product/decisions/2026-10-12-goal-statement.md`,
  `.plans/operate-triage.{md,sessions.md,state.md}` (planned, 0 sessions),
  open issues #116/#117/#118 (Missions' asks), #90 (operate-fix, mission 2).
- xyzhub/missions-server: `README.md`, `docs/product/decisions/2026-10-12-missions-server-vision.md`,
  `docs/fork-bootstrap.md`, `docs/product/idea.md`, `docs/WORKFLOW.md` §10.
- xyzhub/missions: `docs/plan-missions.md`, `docs/product/roadmap.md`,
  `vendor/VERSION` (pins plugin 1.54.1 — bump due), `contract-tests/`.
- Paperclip evidence (external): paperclipai/paperclip issues 6483 and
  15417 (hooks under the adapter), pull request 9000 (white-label, closed
  unmerged), docs.paperclip.ing execution-policy, task-watchdogs, plugin SDK,
  administration/plugins (distribution catalog).
