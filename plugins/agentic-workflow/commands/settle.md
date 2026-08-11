---
description: Probe every deferred obligation, fire the condition-met safe class — branch + worktree reaping behind the deploy-green gate — surface the rest, and hold the mission-close gate.
allowed-tools: [Read, Edit, Bash, Grep, Glob]
---

Settle the repo's deferred obligations (Agentic Workflow §5): a promised action
with an observable `when:` is **fired when its probe proves the condition**,
**surfaced when it can't**, and never silently dropped. Safe to run in any repo
state: nothing destructive happens without its condition proven, and every skip
is named with its reason.

## 1. Inventory

Collect every open obligation — the repo register plus every mission ledger's
`## Closing` block:

```bash
grep -n '^- \[ \] OB-' .plans/OBLIGATIONS.md 2>/dev/null
for f in .plans/*.state.md; do
  awk -v F="$f" '/^## Closing$/{c=1;next} /^## /{c=0} c&&/^- \[ \]/{print F": "$0}' "$f"
done 2>/dev/null
```

No register and no `## Closing` blocks → report "nothing to settle" and stop.

## 2. Probe

For each `[ ]` row, run its `probe:` exactly as written:

- Probe succeeds and proves the `when:` condition → the row is **fireable**
  (step 3 for the reap class, step 4 to tick).
- `probe: manual` → onto the **surface list** — the human decides; never fire
  a manual row yourself.
- Probe fails, errors, or is ambiguous → surface it with the reason.
  **Fail closed**: an unproven condition is an unmet condition.

**Deploy-green ladder** (branch-reap conditions — "merged AND the deploy that
carried it concluded green"). The §10 profile rows (**Deploy + live-verify**,
**Test gate**, **Default branch**) decide which rung applies; the evidence line
must name the rung used:

1. **Deploy + CI in the profile** → checks green on the merge commit of the PR
   that carried the branch:
   `gh pr list --state merged --head <branch> --json number,mergeCommit` →
   `gh run list --commit <sha> --json status,conclusion`.
2. **CI but no separate deploy** (merging to the default branch IS the
   release) → CI green on the merge commit suffices.
3. **Neither CI nor deploy** → merged into the default branch alone satisfies
   the condition — the evidence line says so explicitly.
4. **`gh` missing, rate-limited, or ambiguous** → the branch is **surfaced,
   never deleted**. The gate degrades fail-closed; it never silently weakens.

## 3. Fire the safe class — the reap

Only after step 2, and **dry-run first, always**: print the full listing of
what would be deleted and why (branch → merge proof → condition rung → action),
confirm it, then act.

```bash
git fetch --prune
git branch --merged origin/<default> | grep -v '^\*'
git branch -r --merged origin/<default> | grep -v -e 'origin/<default>$' -e 'origin/HEAD'
git worktree list
```

Then, in order:

1. `git worktree prune` — clears registrations whose directories are gone;
   never touches a live worktree.
2. **Local `worktree-agent-*` branches**: `git branch -d <branch>` each one.
   Git's own merged check is the whole gate here — these are per-brief
   scaffolding and never carry deploys, so no deploy rung applies.
3. **Other merged local branches**: `git branch -d <branch>` — same rule.
4. **Remote branches**: `git push origin --delete <branch>` ONLY when the
   branch is (a) merged into the default branch AND (b) condition-green per
   the step-2 ladder AND (c) not in the protected set below.

A `-d` refusal means unmerged commits exist: **surface the branch, never
force it** — `-D` is never used, under any circumstances.

**The protected set — never delete, each skip explained:**

- the default branch;
- anything unmerged (a `-d` refusal is a stop, not an obstacle);
- integration branches (`mission/*-integration`) and any branch with an open
  PR;
- branches the §10 profile protects, or pre-existing branches that pre-date
  this workflow in the repo — when in doubt, surface.

Deletion here destroys nothing that is not already in the default branch —
that is what makes it delegable. The human-merge rule is untouched: merging is
the human's act; this command only cleans up after a human merge has concluded
green.

## 4. Write back

- Fired rows: tick `[x]` and append `· fired YYYY-MM-DD (<evidence>)` — the
  real date (`date +%F`), with the merge/condition proof and the ladder rung
  in the evidence. Rows are **never deleted**.
- Rows that could not fire stay `[ ]`, untouched.
- End the output with the **surface list**: every `probe: manual` row, every
  failed or ambiguous probe, and every skipped deletion with its reason.

## 5. The mission-close gate

When the active mission is finishing — the run that would report the mission
done (the session-close fall-through in `end.md`, the close step in
`mission.md`) — this command is the close step. Read the active ledger's
`## Closing` block:

- **Any unticked `[ ]` row → refuse.** Report verbatim, citing the rows:

  > REFUSED: mission `<name>` is NOT closed — `## Closing` has <n> unticked
  > `[ ]` obligation(s): <each row's id — do: <action>>. Fire each (`[x]` +
  > `· fired YYYY-MM-DD (<evidence>)`) or promote it (`[~] … → OB-<n>`, with
  > the verbatim copy landed in `.plans/OBLIGATIONS.md`), then write the
  > `Closed:` stamp. The checklist is the authority — "zero open PRs" is not
  > a completeness signal.

- **Every row `[x]` or `[~] … → OB-<n>`** → write `Closed: YYYY-MM-DD` at the
  end of the block. The lint backstop (check 13) enforces the same rule
  fail-closed on every push — the stamp with an open row fails the gate.
