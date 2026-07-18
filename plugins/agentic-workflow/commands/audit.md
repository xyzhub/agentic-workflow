---
description: Run the adversarial multi-vote pillar audit on demand — lens-partitioned fresh reviewers, conservative merge, findings ranked and routed. The V4 audit as a standalone command, for any stage.
argument-hint: [ux | dx | security | efficiency | all]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task]
---

Run the pillar audit machinery (Agentic Workflow §5, adversarial multi-vote)
outside the V4 flow — typically because `/agentic-workflow:adopt`'s gap report flagged
hardening as unverified, before a risky launch-adjacent change, or on request.
`$ARGUMENTS` scopes it; default `all`.

## 1. Scope

- `all` — the full audit: 2–3 fresh `reviewer` instances, lens-partitioned per
  §5 (security + efficiency / UX + DX / QA + architecture), each producing a
  full scorecard for its lenses.
- A single pillar — one fresh `reviewer` briefed deep on that lens (for `ux`,
  include the `designer`'s heuristic usability questions — can a first-time
  user complete the core journey; does the IA match their mental model — plus
  the §0.2 manipulation checks, and where a game layer exists: rewards map to
  real progress, and the game layer is declinable).

Reviewers audit the repo and, where a deployed/running instance exists, the
live behavior (their Bash-driven Playwright path) — not just the code.

## 2. Merge conservatively

Any REQUEST CHANGES blocks a green result. Union the findings; the same
finding from two reviewers raises its confidence, never dedupes it away.
Assemble the combined scorecard (per-lens 0–3).

## 3. Route the fixes

Rank findings by severity. Each gets ONE recommended route: `security` for
hardening, the other specialists per domain, `/agentic-workflow:fix` for small items, a
`/agentic-workflow:mission` when the fixes are bigger than a sitting. Apply the
one-corrective-retry rule to any fix session; accepted-not-fixed findings need
the human's acceptance **in writing**.

## 4. Record

Write the audit report to `docs/product/audits/<date>-<scope>.md` (verdict,
scorecard, findings, routes, what was NOT examined). Spawn the `chronicler` to
update the status page's pillar-health panel from the scorecard.

## Output

Verdict (green / blocked), the scorecard, top findings with routes, and the
single best next command. An audit never merges or fixes anything itself.
