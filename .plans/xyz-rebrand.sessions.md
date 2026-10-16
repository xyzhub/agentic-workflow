---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: xyz-rebrand — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5). The
exploration happened once, here: 2026-10-16, tree at edaf73f, plugin v1.62.0,
no plugin or `tools/` diff since 423e2e8._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery; not restated here).
Master plan: `.plans/xyz-rebrand.md` · Ledger: `.plans/xyz-rebrand.state.md`

**Queued:** none of these briefs is runnable until goal-statement **E2** closes
(L4). Q1–Q3 are settled (master plan, Settled 2026-10-16).

**Catalog**: none. This repo's §10 **Catalog** row is `none — markdown-only
plugin` (`docs/product/catalog/` does not exist), so there are no catalog reads
and no catalog regeneration in Verify.

**Gates available in this repo** (§10):

| Gate | Command | When |
|---|---|---|
| Tier-1 lint (CI `lint.yml` runs it; it runs every harness and selftest) | `node tools/lint.mjs` | end of every brief and at each checkpoint |
| Single harnesses | `node tools/{hook,lint,ledger,ceremony,agents,run-codex,run-claude,marker,rename}-test.mjs` | after the edit that touches each one |
| Manifest validation | `claude plugin validate ./plugins/<dir>` | S2, S3 |
| Staging verify (§10 Staging = none) | lint green on the branch + `claude --plugin-dir ./plugins/xyz` loads | at each checkpoint |

**Facts already probed (do not re-probe):**
- Environment: `node` v24, `jq` present, `claude` 2.1.301.
- The installed 1.62.0 cache `agents/*.md` are hash-identical to the tree.
- Live old-name baseline: 794 occurrences in 104 tracked files (prefix plus
  bare id), plus 51 title-case "Agentic Workflow" (`git grep -io`).
- Counts: commands 28, skills 2 (`plain-report`, `protocol`), agents 20.
- `.github/workflows/lint.yml` has 0 hits.
- `.claude/settings.json` = attribution only (no `enabledPlugins`);
  `.claude/agents/` is absent; `.codex/rules/agentic-workflow.rules` <!-- legacy-name -->
  equals `templates/codex.rules` below its 3-line header.
- `~/.config/agentic-workflow/registry` exists on this Mac. <!-- legacy-name -->
  `~/.local/state/agentic-workflow/` does not.
- `tools/context-attrib.mjs:597-601` already matches the reviewer by its last
  `:` segment, so only its fixture literals (874, 1107, 1243) change.
- In zsh an unquoted `$LIVE` does not word-split; run multi-path `git grep`
  under `bash -c` or use an array.

Branch: **`mission/xyz-rebrand`** (cut from `plan/xyz-rebrand`, rebased on
`origin/main` at start). Both phases go on it, in sequence; nothing is
parallel-safe. Each phase ends in a one-shot Fable checkpoint, and ONE feature
PR opens after ckpt-p2 (Q1).

## Large-files table

| File (pre-rename path; S2 moves `plugins/agentic-workflow/` → `plugins/xyz/`) | Lines | Notes |
|---|---|---|
| `tools/hook-test.mjs` | 1,969 | ranged reads only |
| `tools/context-attrib.mjs` | 1,446 | fixture literals 874, 1107, 1243 only |
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 1,421 | 113,392 B / 120,000 B; grep-first |
| `docs/WORKFLOW.md` | 1,420 | §10 at ~1005–1040; Local amendments near the end |
| `tools/lint.mjs` | 1,371 | 130–160 commandMention; 501–560 harness wiring pattern |
| `CHANGELOG.md` | 1,538 | read 1–12 only |
| `tools/run-codex-test.mjs` | 748 | 260–272 rules filename; 450–475 |
| `plugins/agentic-workflow/tools/run-codex.mjs` | 577 | 185–210 only |
| `plugins/agentic-workflow/tools/run-claude.mjs` | 458 | 20–35, 258–272, 380–392 |
| `tools/run-claude-test.mjs` | 372 | 40–52, 198–218 |
| `plugins/agentic-workflow/README.md` | 338 | 1–30, 300–338 |
| `tools/ledger-test.mjs` | 335 | 1–60 (harness pattern) |
| `tools/lint-test.mjs` | 310 | 150–175 |
| `plugins/agentic-workflow/tools/ceremony.mjs` | 306 | no read |
| `plugins/agentic-workflow/templates/codex.rules` | 294 | 1–15 header |
| `plugins/agentic-workflow/commands/tune.md` | 277 | 50–75, 185–200 |
| `plugins/agentic-workflow/tools/conform.mjs` | 258 | 26–62, 145–258 |
| `tools/agents-test.mjs` | 252 | grep `Tuned from` |
| `plugins/agentic-workflow/tools/agents.mjs` | 224 | 45–95 |
| `plugins/agentic-workflow/tools/operate-triage.mjs` | 220 | 1–15, 70–85 |
| `plugins/agentic-workflow/commands/sync.md` | 193 | 11,478 B / 24,000 B; 1–60, 99–167 |
| `plugins/agentic-workflow/hooks/hooks.json` | 192 | lines 9 and 20 (child silencers) are single long lines |
| `evals/run.mjs` | 189 | line 22 |
| `plugins/agentic-workflow/tools/attribution.mjs` | 155 | whole (the check/apply pattern) |
| `plugins/agentic-workflow/commands/ingest.md` | 132 | 30–55 |
| `README.md` | 71 | whole |
| `docs/product/decisions/2026-10-16-xyz-rebrand-memos.md` | 503 | ranged: D4 57–138, D3 309–403, D5 405–458, D2 192–235, facts 23–55 |
| `docs/product/decisions/2026-10-16-xyz-rebrand-journeys.md` | 119 | 8–25, 51–95 |
| `docs/product/decisions/2026-10-16-xyz-rebrand-metrics.md` | 123 | 35–108 |

## Phase 1 — migrator + dogfood rename (branch: `mission/xyz-rebrand`)

### S1 — `tools/rename.mjs` + harness, `plugin-renamed` ladder item, sync step

- **ACs**: AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8
- **Suits**: `devops` (a new tool, harness, hook-test cases; small prose).
- **Reads** (in this order, ≈1,170 lines):
  1. `.plans/xyz-rebrand.md`: Tasks 1–2, Value sourcing, Locked decisions (≈190).
  2. memos D3 309–403 (95) and the D4 table 57–138 (82).
  3. journeys 51–95 (45): the J3 states and the exact report text.
  4. `P/tools/attribution.mjs` whole (155): copy its check/apply/`--root`,
     exit-code and unparseable-JSON shape.
  5. `P/tools/conform.mjs` 26–62 and 145–258 (≈150): `activeLedgers()` 54–62,
     the guarded `attribution` import, LADDER 148–230.
  6. `P/commands/sync.md` 1–60, 99–167 (≈130).
  7. `P/tools/agents.mjs` 45–95 (50): the banner regex and `bodyMinusBanner`.
     The re-stamp must produce what `BANNER_RE` parses.
  8. `P/commands/tune.md` 50–75 (25): the banner grammar and the
     `shasum … | cut -c1-12` rule.
  9. `tools/hook-test.mjs` 1295–1365 (70): the conform-check fixture and cases.
  10. `tools/ledger-test.mjs` 1–60 (60) and `tools/lint.mjs` 540–560 (20):
      harness and lint-wiring pattern.
  (`P` = `plugins/agentic-workflow`.)
- **Do**:
  1. Freeze the hash table **first**, before anything renames an agent:
     `for a in plugins/agentic-workflow/agents/*.md; do git show 423e2e8:"$a" | <!-- legacy-name -->
     shasum -a 256 | cut -c1-12; done`. That gives 20 entries keyed by agent
     name, one per line.
  2. Write `P/tools/rename.mjs` per AC-1 to AC-5:
     - the name set comes from `readdirSync` of the plugin root's
       `commands/`, `skills/` and `agents/`;
     - the plugin root is `--plugin`, else `$CLAUDE_PLUGIN_ROOT`, else
       `HERE/..` (the conform.mjs pattern);
     - export `check(root, opts)` and `apply(root, opts)` for conform;
     - every old-name literal line carries `// legacy-name`.
  3. Write `tools/rename-test.mjs` with every AC-6 case (temp dirs via
     `mkdtempSync`, `--home` for user scope), and wire `checkRenameHarness`
     into `tools/lint.mjs` next to `checkCeremonyHarness`.
  4. Conform LADDER `plugin-renamed` (AC-7), placed after
     `attribution-settings`. Add the hook-test conform-check gap case and keep
     `conformant` silent. Add the `templates/WORKFLOW.md` §2 Conform-check row
     mention.
  5. `sync.md` step 3.7: put the **Plugin rename** bullet first (AC-8).
  6. Do **not** rename anything else yet; S2 owns the sweep. S1's tests run
     against `plugins/agentic-workflow/`. <!-- legacy-name -->
- **Verify**:
  - `node tools/rename-test.mjs` green, with the case count recorded;
  - `node tools/hook-test.mjs` green (the new gap case plus the silent
    `conformant` case);
  - `node tools/lint.mjs` clean;
  - `node P/tools/rename.mjs check --root .` runs and lists this repo's
    current hits. That is expected here: S2 clears them.
  - Return the hash table's first two entries and the case counts.
- **Read budget**: ≈1,170 lines.

### S2 — the dogfood rename: `git mv`, read-both, every live reference, lint guard, sync, CHANGELOG, Missions change list

- **ACs**: AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17
- **Suits**: `devops` (hooks, Codex rules, harness paths; the prose sweep is
  mechanical).
- **Precondition**: the orchestrator has already run Q3's
  `Closed: 2026-08-03` step on `.plans/context-economy.state.md`.
- **Prior art**:
  - child silencer and refusal hooks: `hooks/hooks.json` lines 9 and 20, and
    the 5 `hooks/lib/*.sh` silencers (grep `_CHILD`);
  - Codex execpolicy: `templates/codex.rules` (header 1–15) and
    `tools/shell-wrappers.mjs` (unchanged; lint imports it by path);
  - extend these files; never re-derive the rules (#129).
- **Reads** (≈1,050 lines; read only after `git mv`, at the new paths):
  1. `.plans/xyz-rebrand.md` Task 3 (≈110). Memos D4 table 64–87 (24), D5
     405–458 (54). Journeys Naming IA 8–25 (18).
  2. Identifier sites:
     - `hooks/hooks.json` 1–40;
     - `run-claude.mjs` 20–35, 258–272, 380–392;
     - `run-codex.mjs` 185–210;
     - `operate-triage.mjs` 1–15, 70–85;
     - `ingest.md` 30–55;
     - `agents.mjs` 45–95;
     - `tune.md` 50–75.

     ≈270 in all.
  3. Tests:
     - `hook-test.mjs` 1136–1146, 1352–1358, 1755–1795, 1868–1876,
       1935–1969;
     - `run-codex-test.mjs` 260–272, 450–475;
     - `run-claude-test.mjs` 40–52, 198–218;
     - `context-attrib.mjs` 870–878, 1100–1110, 1240–1246;
     - `lint-test.mjs` 150–175.

     ≈230 in all.
  4. `tools/lint.mjs` 1–20, 130–160, and the S1-added harness block (≈70).
  5. `README.md` whole (71); plugin README 1–30, 300–338 (68).
  6. `docs/WORKFLOW.md` §10 rows (grep `^| \*\*`, read ±20) and the template
     H1 (≈60). `CHANGELOG.md` 1–12.
  7. Missions: **grep output only** (no file reads), read-only. Run in `bash
     -c`: `git -C /Users/baker/Playground/missions-app grep -c
     agentic-workflow -- ':(glob)apps/**' ':(glob)packages/**' scripts
     ':!vendor'`, plus `-n` greps for `cache/`, the install id, `_CHILD` and
     `Tuned from` (≈80 lines).
- **Do**:
  1. Run `git mv plugins/agentic-workflow plugins/xyz` and `git mv <old Codex rules
     path> .codex/rules/xyz.rules`. Then update the manifests (AC-10) and
     every `PLUGIN =` / import / `setup.sh` / `evals/run.mjs` path.
  2. Record each harness's case count **before** any edit (run them once at
     the new path after only the path fixes).
  3. Do the read-both edits (AC-9), with `legacy-name` on each old-name line.
     In `hooks.json`, start each silencer with `: legacy-name;` and use
     `[ "${XYZ_CHILD:-${AGENTIC_WORKFLOW_CHILD:-0}}" = 1 ] && exit 0;`. <!-- legacy-name -->
  4. Run the sweep:
     `node plugins/xyz/tools/rename.mjs apply --root . --paths $(git ls-files
     -- <LIVE>)` (bash). Then hand-edit the residue from `git grep -nI -e
     agentic-workflow -e AGENTIC_WORKFLOW -e 'Agentic Workflow' -- <LIVE>`
     until only the slug and marked lines remain. That covers bare ids, XDG
     paths, the lint `commandMention` regex and message, `tune.md` write form,
     the `codex.rules` header, and D5 prose and H1s.
  5. Add `checkLegacyName` in lint plus its `lint-test` cases (AC-12).
  6. Sync this repo the `/sync` way (AC-13). Run
     `rename.mjs apply --root .` **excluding `.plans/`**: builders never edit
     ledgers, and the orchestrator does `.plans/` after S2.
  7. docs/product living docs per Q2 (AC-14).
  8. Write the `CHANGELOG.md` `[2.0.0]` entry and stamp it (AC-16). Bump
     `plugin.json` to 2.0.0 (already in step 1).
  9. Write the Missions change list (AC-17). If S2 runs long, AC-17 moves to
     S3 as a logged ledger deviation. It must still land before ckpt-p2, and
     before the owner installs `xyz`.
- **Verify**:
  - `node tools/lint.mjs` clean, including `checkLegacyName`;
  - every harness's case count is ≥ its step-2 count;
  - `claude plugin validate ./plugins/xyz` exits 0;
  - `ls plugins/xyz/{commands,skills,agents} | wc -l` gives 28 / 2 / 20;
  - `node plugins/xyz/tools/conform.mjs` reports no gaps except a
    `plugin-renamed` gap that lists only `.plans/` files (the orchestrator's
    step);
  - the history-diff command in AC-15 prints nothing;
  - `git ls-files | grep agentic-workflow` lists only history paths (C2);
  - `node -p "require('./plugins/xyz/.claude-plugin/plugin.json').name"` and
    the marketplace equivalent both print `xyz` (C2b).
  - Return: the before and after case counts, and the residue grep (expected:
    marked lines and slug only).
- **Read budget**: ≈1,050 lines.

**Checkpoint ckpt-p1** ends phase 1: a one-shot `reviewer` on **Fable**
(boundary-class: `hooks.json`, `tools/`, `templates/codex.rules`) over
`main..HEAD`. It verdicts AC-1 to AC-17, re-runs lint, the history-diff check
and C1/C2. It also reads the owner-facing strings (sync report, conform fix
text) against the plain-report skill. An APPROVE advances to P2; there is no PR
yet (Q1).

## Phase 2 — transition + live checks (branch: `mission/xyz-rebrand`, continued)

### S3 — `renames` probe → marketplace entry, J1 fresh install, J3 scratch migration, owner release notes

- **ACs**: AC-18, AC-19, AC-20, AC-21, AC-22
- **Suits**: `devops` (CLI probes in isolated config dirs).
- **Reads** (≈380 lines):
  1. `.plans/xyz-rebrand.md` Task 4 plus the Assumed probe-mechanics line
     (≈70).
  2. Memos platform facts F1–F6 23–55 (33) and D2 192–235 (44).
  3. Metrics 35–108 (74): C1–C14.
  4. Journeys 51–95 (45): J3 states.
  5. `.claude-plugin/marketplace.json` (17); `README.md` (post-S2, ~75);
     `CHANGELOG.md` `[2.0.0]` entry (≈30).
- **Do**:
  1. Snapshot first: `shasum ~/.claude/settings.json` plus its
     `enabledPlugins` block. Re-check at the end; it must be identical.
  2. Probe mechanics, in order, recording each exact command and its result
     line in the handoff:
     - `CLAUDE_CONFIG_DIR=$s/cfg claude plugin list` works isolated (else
       `HOME=$s/home`);
     - `claude plugin marketplace add <dir>` accepts a local directory.

     Either failing is a `deviation` stop.
  3. AC-18:
     - `git worktree add $s/old main`, then point a scratch marketplace dir at
       the v1.62.0 tree, install the old plugin and enable it in the scratch
       user scope and in a scratch project's `.claude/settings.json`;
     - swap in the branch tree plus `renames`, then update the marketplace;
     - assert both `enabledPlugins` keys moved, that `plugin list` shows the
       rename, and that `install xyz@xyz` succeeds.

     Then remove the worktree.
  4. Only on a pass: AC-19, then `claude plugin validate .`.
  5. AC-20, the fresh config from the branch-tree marketplace:
     - the command listing via `claude -p`;
     - `node tools/hook-test.mjs`;
     - the on-main warning in a scratch repo on `main`.
  6. AC-21:
     - `git clone /Users/baker/Playground/missions-app $s/p`, then seed the
       old-id `enabledPlugins` and one tune whose stamp is in the frozen
       table;
     - hash the history set, run `conform.mjs --brief --root $s/p`, then
       `rename.mjs apply --root $s/p` twice;
     - run checks C8–C12;
     - attempt one `claude --plugin-dir ./plugins/xyz -p "/xyz:sync"` and
       record the outcome.
  7. AC-22: the README section and the CHANGELOG Migration line, with markers
     on the old-id lines.
- **Verify**:
  - every AC-18, AC-20 and AC-21 assertion is recorded with its command;
  - `node tools/lint.mjs` clean;
  - `claude plugin validate .` and `claude plugin validate ./plugins/xyz`
    exit 0;
  - the owner's `~/.claude/settings.json` hash is unchanged;
  - scratch dirs removed.
  - Return the probe transcript lines. They ratify the Assumed line.
- **Read budget**: ≈380 lines (the session is probe-heavy, not read-heavy).

**Checkpoint ckpt-p2** ends phase 2: a one-shot `reviewer` on **Fable** over
`main..HEAD`.
- It verdicts AC-18 to AC-22 and re-runs lint, `claude plugin validate .` and
  the `--plugin-dir` load.
- It reads the README move section against the plain-report skill.
- On APPROVE: the staging verify, then the single PR to `main` is marked
  ready; the human merges.

---
_Size every brief to its read budget; split any that can't fit and note the
split. Each session's outcome and any deviation lands in
`.plans/xyz-rebrand.state.md`, never only in chat._
