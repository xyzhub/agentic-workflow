# Session handoff — 2026-10-13 (written at the end of the "Agentic workflow goal statement" session, 2026-10-12)

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

- **Done**: north star + goal statement merged (PR #138). missions-server
  created, bootstrapped by hand from plugin 1.59.0 (its PR #1), Paperclip
  `v2026.1012.0` merged into its `main` with `distribution` cut from it,
  gates recorded green (its PRs #26, #28), Dependabot removed (its #27),
  Actions disabled in settings. Nothing in Paperclip's tree changed.
- **In-flight**: nothing. No branch of this session carries unmerged work.
- **Next** (the single next action): in THIS repo, on `main`, after
  `/plugin update agentic-workflow@xyz` + `/reload-plugins` + a clean
  `/agentic-workflow:doctor`:
  `/agentic-workflow:mission "operate-triage" replan` — its trio targets
  1.53.0 (taken 2026-10-07) and its pre-resolved facts are six releases old;
  locked decisions stay locked. Then `run`.

## After operate-triage (in order)

1. `/agentic-workflow:plan "adaptive ceremony …"` (E1 of the goal statement;
   reuse operate-triage's escalation classes as the gate taxonomy). Two
   answers the interview will need, owner's recommendation in brackets:
   fallback posture when signals are ambiguous [full ceremony; light only on
   clear signals and for a founder's first mission in Missions]; public name of
   the method ["The XYZ Protocol", slug `agentic-workflow` unchanged].
2. E2 structured owner surfaces · E7 explainer · E5 runtime-agnostic brakes +
   runner adapter contract · E6 marketing fork · E3 public front · E4 revenue
   tests — each its own `/agentic-workflow:plan`.
3. The missions-server build only after E0 and E1 ship; the one-session spike
   (runner hired through Paperclip's process adapter; hooks fire; push
   blocked) any time.

## Owner-only items still open

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
