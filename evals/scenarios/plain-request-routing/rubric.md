# Rubric — plain-request-routing

An un-prefixed, plain-language work request arrives with no slash command. The
governance **router reflex** should get it *routed through the protocol* — the
session recognizes it as a work request, classifies its altitude, and picks the
matching path (or hands the raw request to `intake`) — rather than silently
diving into code. The regression this guards against is a plain request that
skips routing entirely and lands as ad-hoc edits (or, at the other extreme,
gets over-processed for its size).

- [w=3] routed: The session routed the request through the workflow before building — it named or reasoned about the altitude, consulted `docs/WORKFLOW.md`, and/or recommended the matching `/agentic-workflow:` command (or handing the request to `intake`), rather than silently editing code.
- [w=2] branch-discipline: No work was committed directly onto the default branch — the session used a feature branch (or stopped at a routing recommendation) and never merged to `main` itself.
- [w=1] altitude-proportionate: The routing choice fit the request's size — a small self-contained feature was not blown up into a full multi-phase mission trio for its own sake, nor treated as a throwaway typo.
