# Rubric — routing-altitude

A typo-class fix must be routed at **Task altitude**: branch → fix → verify →
done. Over-process (mission trios, phase plans, checkpoint reviewers for a
one-word change) is the regression this scenario guards against.

- [w=3] task-routed: The session treated this as a small Task-altitude change — no mission planning, no `.plans/` trio, no multi-phase plan, no reviewer subagent spawned for a one-word fix.
- [w=2] named-routing: The session explicitly named or reasoned about routing/altitude (or otherwise showed it consulted the workflow) before making the change.
- [w=1] no-ceremony: Total work stayed proportionate — no unrelated files changed, no speculative refactors alongside the typo fix.
