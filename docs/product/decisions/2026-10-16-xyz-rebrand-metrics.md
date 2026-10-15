# xyz-rebrand — success metrics (2026-10-16)

Brief: `2026-10-16-xyz-rebrand-brief.md`. Author: analyst. Every check below is a runnable command; "done" is the stated exit/output, never a judgment. Anything not measured is marked **unknown**.

## 1. Baseline (measured)

Source: `git grep -Io 'agentic-workflow'` (tracked files only, case-sensitive, binary skipped), repo `venture-workflow-plugin`, branch `plan/xyz-rebrand` at HEAD `66dc6af` (+ the untracked brief), pulled 2026-10-16. Counts are occurrences (not lines); "files" = files with at least one hit.

### The two sets, by path

- **LIVE** (what a user or agent executes or obeys): `plugins/`, `tools/`, `.github/`, `.claude-plugin/`, `.claude/`, `.codex/`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/WORKFLOW.md`.
- **LIVE-TEST** (fixtures that drive the plugin; must change with it but are not shipped): `evals/` (excluding `evals/results/`, which is gitignored).
- **HISTORY** (records of what was true then; the brief says leave alone): `CHANGELOG.md`, `.plans/`, `docs/product/` (decisions, JOURNEY, decision-log, launch, features, etc.).

| Set | Occurrences | Files |
|---|---|---|
| LIVE | 771 | 86 |
| of which `plugins/agentic-workflow/**` | 551 | n/m |
| of which `docs/WORKFLOW.md` | 142 | 1 |
| of which `tools/*.mjs` | 54 | 9 |
| of which `README.md` / `CLAUDE.md` / `.codex/rules` / `.claude-plugin/marketplace.json` | 15 / 4 / 3 / 2 | 4 |
| LIVE-TEST (`evals/`) | 23 | 18 |
| HISTORY: `.plans/` (tracked) | 835 | 57 |
| HISTORY: `docs/product/` | 121 | 42 |
| HISTORY: `CHANGELOG.md` | 25 | 1 |
| **Whole repo (tracked)** | **1,775** | **204** |

- Reconciliation: 771 + 23 + 835 + 121 + 25 = 1,775 (matches the whole-repo count; no residue).
- Of the 771 LIVE hits, 674 are the `agentic-workflow:` command prefix; 97 are the bare id (paths, `agentic-workflow@xyz`, plugin name, `${...}` cache paths).
- The brief's "1,027 mentions" is the `agentic-workflow:` prefix alone, repo-wide (re-measured: 1,027, same command shape `git grep -Io 'agentic-workflow:'`). The 1,775 figure counts every form. Both are correct; they measure different things.
- Not counted by content grep, but also carrying the old name (path names): directory `plugins/agentic-workflow/`, file `.codex/rules/agentic-workflow.rules`, plugin `name` in `plugins/agentic-workflow/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`. Check C2 covers them.
- `.plans/` working tree (incl. untracked/ignored files) reads 865 occurrences in 60 files vs 835 in 57 tracked; HISTORY is not checked for zero, so this gap does not affect any check.
- Caveats: the untracked brief itself holds 6 occurrences (HISTORY by definition once committed). Occurrences inside the `xyz` upstream cache or in other projects (Orderly) are **unknown** — not measured here.

## 2. Done-checks, one per success definition

Let `LIVE` = `plugins tools .github .claude-plugin .claude .codex README.md AGENTS.md CLAUDE.md docs/WORKFLOW.md evals`, and `ALLOW` = the migration code + its tests + the final-notice text (exact paths fixed by the plan; they must be listed in the allowlist file `tools/rebrand-allowlist.txt`, one pathspec per line, reviewed at checkpoint). The allowlist path and contents do not exist yet: **unknown** until planned. Allowlist may never contain a whole directory such as `plugins/`.

### J2 — zero live old references (this repo)

```
# C1: content. Done = no output, exit 1.
git grep -nI 'agentic-workflow' -- $LIVE $(sed 's/^/:!/' tools/rebrand-allowlist.txt)

# C2: names. Done = no output (no tracked path still carries the old name).
git ls-files | grep 'agentic-workflow' | grep -v -F -f tools/rebrand-allowlist.txt

# C2b: manifests. Done = prints "xyz" for both.
node -p "require('./plugins/xyz/.claude-plugin/plugin.json').name"
node -p "require('./.claude-plugin/marketplace.json').plugins[0].name"

# C3: suites. Done = all exit 0.
node tools/lint.mjs && for t in tools/*-test.mjs; do node "$t" || exit 1; done
```

C1 is also the pass/fail gate for HISTORY leakage in reverse: `git diff main --stat -- CHANGELOG.md .plans docs/product` must show only additive lines for this mission's own records (no edits to existing history lines): `git diff main -U0 -- CHANGELOG.md .plans docs/product | grep '^-[^-]'` must print nothing.

### J1 — fresh install works

```
# C4: validate. Done = exit 0.
claude plugin validate ./plugins/xyz

# C5: install-and-list in a clean dir. Done = output lists >= the baseline command count under /xyz: and none under /agentic-workflow:.
d=$(mktemp -d) && cd "$d" && claude --plugin-dir /abs/path/plugins/xyz -p "list every available slash command and skill by exact name" 
# also: claude plugin install xyz@xyz (from the published marketplace) is only checkable AFTER release; before release use --plugin-dir.

# C6: hooks fire. Done = exit 0.
node tools/hook-test.mjs
```

Baseline for "baseline command count": commands = `ls plugins/agentic-workflow/commands | wc -l` and skills = `ls plugins/agentic-workflow/skills | wc -l`; compute at implementation start and record here (not recorded in this doc — **unmeasured**). Done requires the post-rename counts equal the pre-rename counts.

### J3 — existing project migrates

Scratch copy of an adopted project, never the real one:

```
# C7: build the fixture once (copy a real adopted project OR the repo's eval fixture adopt-existing-project), strip .git remotes.
s=$(mktemp -d) && cp -R <adopted-project> "$s/p" && git -C "$s/p" remote remove origin 2>/dev/null
# freeze HISTORY hash before:
(cd "$s/p" && git ls-files .plans docs/product CHANGELOG.md | xargs shasum | shasum) > "$s/hist.before"

# run /xyz:sync in the scratch copy (claude --plugin-dir ... -p "/xyz:sync", answer prompts non-interactively or script via the migrator tool)

# C8: live refs gone in the copy. Done = no output.
(cd "$s/p" && git grep -nI 'agentic-workflow' -- docs/WORKFLOW.md AGENTS.md CLAUDE.md .claude .codex $(ls .plans/*.md 2>/dev/null | grep -v closed))   # open ledgers only; see note
# C9: enabledPlugins. Done = prints a line containing xyz@xyz and none containing agentic-workflow.
grep -n 'enabledPlugins' -A5 "$s/p/.claude/settings.json"
# C10: history untouched. Done = identical hashes.
(cd "$s/p" && git ls-files .plans docs/product CHANGELOG.md | xargs shasum | shasum) | diff - "$s/hist.before"   # exclude files the sync legitimately rewrites; closed ledgers must match
# C11: next session works. Done = lint/conform clean in the copy and a session starts with no error.
(cd "$s/p" && node "$(dirname <plugin>)/tools/conform.mjs")   # zero gaps
# C12: idempotent. Done = second /xyz:sync reports "conformant", zero diff.
```

Note: "open ledger" vs "closed history" needs a machine-readable rule (e.g. ledger `Status:` field); the plan must define it. Until then C8's filter is illustrative: **unknown** whether the existing ledger format supports it.

### J4 — old install told how to move

```
# C13: final old-name release. Done = in the old-name plugin's SessionStart output, the three steps appear verbatim once.
echo '{}' | node plugins/agentic-workflow/hooks/<notice-hook> | grep -c -e 'uninstall' -e 'agentic-workflow@xyz' -e 'xyz@xyz' -e '/xyz:sync'   # expect 4
# C14: one-time. Done = second invocation in the same project prints nothing (marker file written).
```

Hook path/name **unknown** (to be built). Where the final old-name release lives (a branch/tag of this repo vs. this PR) is an open design point for the plan; C13 runs against whichever it is.

## 3. "No claim" inside this mission

Nothing here asserts the following; each becomes an obligation row (`.plans/OBLIGATIONS.md`) if the plan doesn't already own it:

| Not claimed | Why | Route |
|---|---|---|
| Orderly (or any real adopted project) actually migrated | Real migration happens after release, in its own session; C7–C12 prove only the scratch copy | Obligation row, owner: whoever runs `/xyz:sync` in Orderly; its own check = C8–C12 in that repo |
| Installed-from-marketplace path (`claude plugin install xyz@xyz`) | Needs the published release; pre-merge only `--plugin-dir` works | Obligation row: post-release smoke of C5 via marketplace |
| Old installs in the wild see the notice | Depends on users updating the final old-name release; adoption count is **unknown** and unmeasurable from this repo | No metric; state as unknown |
| Missions app works with `xyz` | Out of v1 (brief); folds into OB-30 | Existing OB-30 |
| GitHub repo / URL references (`xyzhub/agentic-workflow`) | Deferred (brief). C1 allowlist must carve these out explicitly, else C1 will fail on them | Allowlist entry + obligation |
| Zero old references outside this repo (other projects' settings, user caches, `~/.claude/projects` memory) | Not measurable here | **unknown** |
| Quality of the notice wording or user comprehension | No users measured | **unknown** |

One tension to settle in the plan: the brief says "zero live old references" but the GitHub repo URL and the migration code legitimately keep the old name. C1 only means "zero" modulo the reviewed allowlist; the allowlist is the contract.
