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
  awk -v F="$f" '/^## Closing$/{c=1;next} /^## /{c=0}
    c&&/^- \[ \]/{p=1; print F": "$0; next}
    c&&p&&/^[[:space:]]+[^[:space:]]/{print F": "$0; next}
    {p=0}' "$f"
done 2>/dev/null
```

(The awk prints a wrapped row's continuation lines too — ledger rows wrap at
house width, and a row truncated mid-sentence hides its `when:`/`probe:`.)

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
   `gh run list --commit <sha> --json status,conclusion` — `<sha>` must be the
   **full 40-char SHA**: `gh run list --commit` with a short SHA returns `[]`
   silently, which fail-closed surfaces a green branch instead of firing it.
2. **CI but no separate deploy** (merging to the default branch IS the
   release) → CI green on the merge commit suffices.

   **No-PR sub-case (rungs 1–2)**: a branch can reach the default branch
   without a PR of its own — absorbed as ancestry when later work built on
   it — so `gh pr list --state merged --head <branch>` returns empty and "the
   merge commit" is undefined. The recipe: prove ancestry
   (`git merge-base --is-ancestor <tip-sha> origin/<default>` exits 0), then
   CI green on the **tip commit itself** AND on the **carrying commit** (the
   default-branch commit whose history first contains the tip) — both via the
   full-SHA `gh run list --commit` form above. Ancestry without that CI
   evidence → surface, never delete.

   Derive the carrying commit — do not eyeball it from the log:

   ```bash
   git rev-list --first-parent --reverse <tip-sha>..origin/<default> |
   while read c; do git merge-base --is-ancestor <tip-sha> "$c" && echo "$c" && break; done
   ```

   Walk the default branch's own first-parent line, oldest first; the first
   commit on that line whose history contains the tip is the carrying commit.
   The first-parent constraint is load-bearing: an unconstrained
   `--ancestry-path --merges` walk returns the topologically first merge
   descending from the tip, and under nested-merge topology (phase merges
   landing on a mission integration branch that reaches the default branch by
   PR) that is a merge on the *integration branch*, which never landed on the
   default branch on its own and has no CI run — so `gh run list --commit`
   returns `[]` and a green branch is surfaced forever. Real case from this
   repo's history: tip `b36003e` gave `4262217` (`merge(P1)` on the
   integration branch, zero CI runs) where the carrying commit is `513e40a`
   (the PR #33 merge on the default branch, CI green). The filter reuses
   `merge-base --is-ancestor` — the same primitive as the ancestry gate — and
   `rev-list` prints the **full 40-char SHA** the `gh run list --commit` form
   demands.

   **Empty output is not the ancestry proof failing.** Given the ancestry gate
   passed, the default branch's head itself contains the tip, so this pipeline
   is empty only when the tip IS `origin/<default>`'s head — check CI on the
   **tip itself**. (A tip that reached the line by fast-forward yields the
   next commit on the line, which also contains it; the rung demands CI on
   both the tip and the carrying commit either way.) If `--is-ancestor` exits
   non-zero, the branch is unmerged and the protected set applies: surface it,
   never delete.
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
git branch --merged origin/<default> | grep -vE '^\* |^ *<default>$'
git branch -r --merged origin/<default> | grep -v -e 'origin/<default>$' -e 'origin/HEAD'
git worktree list
```

(The local listing excludes the current branch AND the default branch itself —
`git branch --merged` lists `<default>` as merged into its own upstream, and
only the protected set would catch it downstream.)

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
- any branch with an open PR;
- integration branches (`mission/*-integration`) of **open** missions — while
  the mission's integration PR is unmerged, or its ledger's `## Closing` block
  (where one exists) lacks the `Closed:` stamp, the branch is untouchable. A
  **concluded** integration — PR merged, deploy concluded green per the step-2
  ladder, and the ledger stamped `Closed:` where it carries the block (a
  pre-grammar ledger with no `## Closing` block is judged by the PR +
  deploy-green condition alone) — is NOT shielded: it falls through to the
  ordinary ladder (human ruling 2026-08-11, OB-3);
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

**The release rides the same gate — for missions only (OB-9).** The template's
seeded `version bumped + stamped` row means an unversioned **mission** cannot
close: if its CHANGELOG entry names a version, the row stays `[ ]` until the
manifest carries it, and the refusal above fires. A mission whose entry names
no version fires the row immediately with `no version named` as its evidence;
the row is never deleted to make it not apply. `/agentic-workflow:release` is
where the bump and the stamp actually happen, so the row is ticked there or at
the settle that follows it.

**State the limit plainly: this gate does not cover session-altitude work.** A
`/agentic-workflow:start` → `/agentic-workflow:end` ship has no ledger and no
`## Closing` block, so nothing refuses it — and every ship since v1.43.0 has
been that shape. The incident OB-9 records (three merged PRs each deferring the
bump to "a release session" that had no trigger, with OB-5/6/8's install
conditions silently depending on it) is therefore only half-addressed. The
session-altitude half is recorded as its own register row; do not read this
paragraph as a claim that an unversioned ship is impossible.
