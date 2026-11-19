---
status: counsel
feature: concurrent-missions
date: 2026-11-19
---

# Counsel brief — concurrent missions

Two lenses, each a fresh Fable advisor asked for the strongest case against.
Counsel advises; the owner decides.

## Financial lens — fund a named first slice

- **Strongest argument:** two missions at once roughly doubles spend per hour
  (estimated) **before any working meter exists**. The measurement plan's relative
  burn alert "cannot fire on day one", the only honest stop is an owner-set
  ceiling whose value is unknown, and whether spawns report token usage is
  unverified. That is the 2026-08-19 runaway condition at twice the rate.
- **Second:** the agent-merges half of the queue costs the most (agent GitHub
  identity, landing lock, wider merge guard) and replaces an owner click that
  clears in a **measured ~21-minute median**.
- **Recommendation:** phase 1 = everything except agent-merge (agent updates and
  re-tests each PR; owner still clicks), plus a burn meter with an owner-set
  ceiling. Phase 2 = "agent merges what I approve", written into the **same
  mission** as a gated phase so the owner's choice is not silently dropped.
- **Its deciding number:** combined tokens/hour with two missions ÷ single-mission
  baseline, on the first real pair; ≤ 2.2 → open phase 2.

## Technical/security lens — proceed with named changes

- **Failure most likely to ship:** once an agent GitHub identity authors PRs,
  the owner's stored `gh` login on the same Mac can post an approval. The memo's
  identity check probes only the ambient token, and the merge guardrail
  (`hooks.json:89`) inspects merge-shaped commands only — an approve call passes
  silently. Testable: `env -u GH_TOKEN gh pr review <n> --approve`, then the
  guarded merge.
- **Ranked attacks:** (1) the landing step's whole-file exemption for version and
  changelog files lets a dependency or install-script change merge unapproved in
  a venture; (2) the server-side approval is not bound to a commit once stale
  dismissal is off; (3) the landing lock has a 30-minute takeover and no
  heartbeat, so a long venture landing can be taken over mid-flight; (4) guard
  fail-open edges on other 403s and on hook timeouts.
- **Recommendation judged wrong:** pushing "main merged in plus version" onto an
  approved branch. Instead: **never push to an approved branch** — test the
  combined result on a scratch ref, merge exactly the approved commit, and set
  the version and changelog in a records-only follow-up. Server-side stale
  dismissal can then stay on.
- **Verdict:** worktrees, ledger-by-branch, fragments, folders and the overlap
  check proceed. Agent-merge is enabled only on a host with no owner login,
  detected by listing stored logins, not by probing the ambient token.

## Where the lenses agree

Both put agent-merge behind a gate — financial on a measured burn number,
technical on a bot-only host. Both leave everything else to proceed.
