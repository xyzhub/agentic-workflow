---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: pr-economy — session briefs

_The execution view: one brief per session, each pre-resolved so an execution
session never explores. Authored by the `planner` (WORKFLOW.md §5); the expensive
exploration happened once, here (2026-10-07; revision 1 the same day after the
plan-judge's REVISE and the owner's L4 ruling)._

Protocol: see `docs/WORKFLOW.md` §5 (mission machinery — don't restate it here).
Master plan: `.plans/pr-economy.md` · Ledger: `.plans/pr-economy.state.md`

Decisions are locked in the master plan (L1–L4 + the planner's decomposition
decisions); the brief does not re-litigate them. No open question blocks S1.

**Catalog**: none — this repo's §10 **Catalog** row is `none — markdown-only
plugin` (`docs/product/catalog/` does not exist; checked 2026-10-07). No catalog
reads, no catalog regeneration in Verify.

**Gates available in this repo** (§10):

| Gate | Command | Tier |
|---|---|---|
| Test / lint gate (CI runs it) | `node tools/lint.mjs` | 1 — the brief and the checkpoint; **baseline `lint: clean` (2026-10-07)** |
| Hook behavior harness | `node tools/hook-test.mjs` | 1.5 — reached by lint; **baseline 156 `ok`, `hook-test: clean` (measured 2026-10-07)** |
| Clock-guard harness | `node tools/lint-test.mjs` | 1.5 — reached by lint; untouched by this mission |
| Staging verify (§10 Staging = none) | lint green on the phase branch + `claude --plugin-dir plugins/agentic-workflow` load | at the checkpoint |

**SAFETY RULE FOR THIS BRIEF (locked):** the installed 1.52.0 inline hook BLOCKS
any Bash command whose text contains the literal merge command (`gh pr merge`)
while this repo's §10 is `human-only` — and once you flip §10 on the branch it
turns warn-only, which is worse. So: **never run a merge command, and never put
that literal in a Bash command** — not in `grep`, `sed`, `echo`, a heredoc or a
`printf`. Write the hook, the harness and the markdown with the Write/Edit
tools (file CONTENTS may contain the literal). Grep for it with the pattern
`'gh pr merg[e]'`. The live dry-run recipe in the ledger builds the payload with
`printf '%s' … merg%s e` for the same reason.

**Facts already probed (do not re-probe):** `node` v24.12.0; `gh` 2.93.0 at
`/opt/homebrew/bin/gh`; `jq` at `/usr/bin/jq`; no `package.json`, every tool is
zero-dep; harnesses live at the repo root `tools/`, plugin tools in
`plugins/agentic-workflow/tools/`; CI = `.github/workflows/lint.yml` running
`node tools/lint.mjs`. `tools/hook-test.mjs` selects a hook by a substring of
its `description` (`hookCommand(event, descNeedle)`, line 25), stages files via
`files: { 'rel/path': { content, mtime? } }` (line 56) and sets the child env at
lines 92–96 (`{ ...process.env, CLAUDE_PLUGIN_ROOT: PLUGIN }`); the harness temp
cwd is NOT a git repo, so a lib hook's `git rev-parse --show-toplevel` fails
there and must fall back to the cwd (the `publish-guard.sh` 32–34 contract);
`runHook` `rmSync`s the temp dir in `finally`, so anything the stub writes to
disk is gone before the assertion — assert on the hook's **stderr** instead
(hence: the hook must NOT redirect `gh`'s stderr). **Existing harness cases for
the merge command: none.** The inline git/gh row is `hooks.json` 50–58 (command
line 55, description 56, timeout 57); its merge case is the `case "$CMD" in
*'gh pr merge'*) …;; esac` block near the end of line 55 (its allow text says
"(or §13 bookkeeping scope)" — keep that reminder text verbatim for the full
delegation branch; §13 is untouched by L4). The OB grammar lives in
`tools/lint.mjs` 648–652 (`OB_DATE`, `OB_ROW`, `OB_FIRED`); `checkObRow`
754–779 is called for the template with `placeholderOk: true` (798) and for
every ledger (804); the register (`checkObligationsRegister`, 841+) calls it
with `strictLabel: true` — **do not add the marker rule under `strictLabel`**
(register sources carry commas, OBLIGATIONS.md 53–55). The only legacy
mission-ledger source with a comma is `(planner, owner-locked)` in
`.plans/runtime-agnostic-codex.state.md` — it must stay valid. §3/§4/§5 text is
byte-identical between `templates/WORKFLOW.md` and `docs/WORKFLOW.md` (offset:
docs = template − 8 in §3–§5, − 12 at the §10 row, − 14 in §11); §10 differs by
design. `templates/WORKFLOW.md` 939 is the §10 Merge policy PLACEHOLDER row —
its cell is prose wrapped in `_( … )_`; after your edit it names the
records-only value as prose, and the harness feeds that exact row to the hook
expecting BLOCK. `templates/codex.rules` 88–184 already denies the merge
command in every costume — NOT touched. The registry repo is NOT touched (L4).
`plugins/agentic-workflow/.claude-plugin/plugin.json` is at `1.52.0`;
`CHANGELOG.md` 7–9 is `## [Unreleased]` / `_(empty)_`; `docs/WORKFLOW.md` line 3
is `<!-- protocol-master: v1.52.0 -->`. Real `gh pr view --json
state,files,statusCheckRollup` shape: `files[]` = `{ path, additions,
deletions, changeType }` with `changeType` ∈ `ADDED|MODIFIED|DELETED|RENAMED|
COPIED|CHANGED|UNKNOWN`, capped at 100 entries; `statusCheckRollup[]` mixes
CheckRun objects (`__typename: "CheckRun"`, `status`, `conclusion`, `name`) and
StatusContext objects (`__typename: "StatusContext"`, `state`, `context`).

## Large-files table

| File | Lines |
|---|---|
| `tools/hook-test.mjs` | 1502 |
| `plugins/agentic-workflow/templates/WORKFLOW.md` | 1293 |
| `docs/WORKFLOW.md` | 1288 |
| `CHANGELOG.md` | 1096 |
| `tools/lint.mjs` | 892 |
| `plugins/agentic-workflow/README.md` | 316 |
| `plugins/agentic-workflow/commands/mission.md` | 280 |
| `plugins/agentic-workflow/templates/codex.rules` | 223 (cite only) |
| `plugins/agentic-workflow/agents/reviewer.md` | 213 (not read) |
| `plugins/agentic-workflow/commands/settle.md` | 202 |
| `plugins/agentic-workflow/hooks/hooks.json` | 181 |
| `plugins/agentic-workflow/agents/chronicler.md` | 151 |
| `plugins/agentic-workflow/agents/planner.md` | 133 |
| `plugins/agentic-workflow/templates/mission-state.md` | 124 |
| `plugins/agentic-workflow/hooks/lib/publish-guard.sh` | 109 |
| `plugins/agentic-workflow/commands/end.md` | 91 |
| `README.md` | 64 (not edited) |
| `.plans/OBLIGATIONS.md` | 62 (cite only) |
| `plugins/agentic-workflow/agents/security.md` | 53 |
| `plugins/agentic-workflow/.claude-plugin/plugin.json` | 11 |

## Phase 1 — two-PR close (branch: `mission/pr-economy`, cut from `main` at 49fb2e7)

One brief, one checkpoint. Not parallel (single session).

### S1 — merge-guard hook + harness, Closing-row markers, one bookkeeping PR, protocol text, record

Suits: **`security`** (a fail-closed guard with an exact allowlist over
untrusted command text and untrusted JSON from `gh`; merge authority is a
security boundary). `backend` is the fallback.
Runtime: claude (default — no `runtime:` field).

- **Reads** (≈ 700 lines; order matters — code shape first, then edit sites,
  then prose):
  1. `plugins/agentic-workflow/hooks/hooks.json` 50–58 (the inline git/gh row
     you edit: command 55, description 56) and 71–82 (the publish-guard row —
     the lib-hook row shape to copy: `bash "${CLAUDE_PLUGIN_ROOT}/hooks/lib/…"`,
     description starting with the harness needle, `timeout: 5`).
  2. `plugins/agentic-workflow/hooks/lib/publish-guard.sh` 1–45 (header
     contract comment; `INPUT=$(cat)` + jq extraction with `|| printf`
     fallback at 28–29; the `D`/`TOP`/`WF` resolution at 32–34 — reuse
     verbatim).
  3. `tools/hook-test.mjs` 1–121 (imports 13–18, `hookCommand` 25–33, `runHook`
     40–100 — the `files:` staging 56–67 and the env line 92–96 you extend —,
     `check` 109–112) and 1482–1502 (the close-guard block = the block shape to
     copy; the summary tail your new block goes above).
  4. `tools/lint.mjs` 637–660 (OB grammar constants and their comment) and
     746–800 (`checkObRow` 754–779, `checkClosing` 792–800 with the template
     call at 798).
  5. `plugins/agentic-workflow/templates/mission-state.md` 15–40 (header prose,
     for context only) and 73–105 (the `## Closing` block: prose 75–90, four
     seeded rows 91–105).
  6. `plugins/agentic-workflow/agents/planner.md` 56–59 (the ledger bullet the
     new section follows) and 83–88 (sizing section, for placement).
  7. `plugins/agentic-workflow/commands/settle.md` 157–164 (step 4 Write back)
     and 166–193 (step 5 close gate).
  8. `plugins/agentic-workflow/commands/end.md` 32–47 (step 3), 49–54 (step 4
     chronicler), 76–84 (step 6 push/hand off).
  9. `plugins/agentic-workflow/commands/mission.md` 55–64 (rule 5, for the
     ledger wording), 177–191 (§3 checkpoint spawn — the pre-merge pass goes
     immediately BEFORE "Spawn the **reviewer**"), 219–226 (the
     PR-to-default-branch step), 259–271 (§5 Close the mission).
  10. `plugins/agentic-workflow/templates/WORKFLOW.md` 262 (§3 merge row),
      295–302 (§4 Close paragraph), 469–476 (§5 Gate policy bullet), 500–518
      (§5 "Mission close & deferred obligations"), 939 (§10 Merge policy
      placeholder row), 1012–1016 (§11 safety boundary sentence). §13 is NOT
      read or edited.
  11. `docs/WORKFLOW.md` 1–3 (stamp), 254, 287–294, 461–468, 492–510, 927,
      998–1002 (the mirrors; apply the SAME diff; §10 row 927 gets this repo's
      value).
  12. `plugins/agentic-workflow/agents/chronicler.md` 55–62 (Artifact 1 —
      CHANGELOG paragraph; one sentence to add).
  13. `plugins/agentic-workflow/README.md` 225–234 (Guardrails paragraph).
  14. `CHANGELOG.md` 1–12 (`[Unreleased]` + the 1.52.0 entry head — the shape);
      `plugins/agentic-workflow/.claude-plugin/plugin.json` whole (11).
- **Catalog**: none.
- **Order rule (fit, one session without phases)**: steps 1–4 (hook, hooks.json
  row, harness, lint marker rule) must be green — `node tools/lint.mjs` clean
  — before any prose step starts. If the session runs long, step 9 (chronicler
  sentence) and step 10 (plugin README paragraph) are the FIRST to be left for
  an `S1-fix`, logged as a deviation, never silently dropped. Commit per
  numbered step so a corrective can resume, format `pr-economy(S1): <summary>`
  (§4). **Cut list (already applied, do not re-add)**: numeric refs only (no
  URL, no branch name); no `--auto`; no cross-repo (`-R`/`--repo`); no `paths:`
  grammar on the §10 row; no codex.rules, §13, registry-repo,
  `/agentic-workflow:pr`, `release.md`, `check.md`/`sync.md` edits; no eval
  fixture stamp.
- **Do**:

  **1. `plugins/agentic-workflow/hooks/lib/merge-guard.sh`** (new, ≤ 130 lines,
  `#!/usr/bin/env bash`, header contract comment in the `publish-guard.sh`
  shape, plus one line `# externals: git grep sed head tr cut wc jq gh` — keep
  it exact; the harness mirrors it). Use only those externals + bash builtins.
  Contract, in order, on `CMD = .tool_input.command`:
  - `gh api` merge: `printf '%s' "$CMD" | grep -qE 'pulls/[0-9]+/merge'` →
    exit 2 `❌ BLOCKED: merging through the API bypasses the merge guard — use the gh pr merge form or hand it to the human.`
  - Not a merge command (`case "$CMD" in *'gh pr merge'*)` false) → exit 0,
    silent.
  - `D` = leading `cd <dir>` or `git -C <dir>` else `.` (the inline hook's two
    `sed` forms, verbatim); `TOP` = `git -C "$D" rev-parse --show-toplevel`;
    `DEF` = `git -C "$D" symbolic-ref --short refs/remotes/origin/HEAD` stripped
    of `origin/`, fallback `main`.
  - **Policy cell** (locked: read from the human-merged copy): if `TOP` is
    non-empty, `ROW=$(git -C "$TOP" show "origin/$DEF:docs/WORKFLOW.md"
    2>/dev/null | grep -E '^\| *\*\*Merge policy\*\* *\|' | head -1)`; if `TOP`
    is empty (not a git tree — the harness), read `"$D/docs/WORKFLOW.md"`.
    Empty `ROW` → exit 2:
    `❌ BLOCKED: the human (HITL) merges PRs. Delegating needs Merge policy = agent-may-merge in the TARGET repo docs/WORKFLOW.md §10 as committed on origin/<default> (an unset origin/HEAD on a non-main default also lands here — git remote set-head origin -a) — run as cd <repo> && gh pr merge … (fail closed).`
  - `ROW` matches the **anchored** regex
    `^\| *\*\*Merge policy\*\* *\| *agent-may-merge \(records-only, delegated [0-9]{4}-[0-9]{2}-[0-9]{2}\) *\|`
    → **records-only scope** (rules below). Else `ROW` matches
    `\| *\*\*Merge policy\*\* *\| *agent-may-merge` → echo today's reminder
    verbatim `⚠️ Delegated merge authority (§10 Merge policy) — merge only on a reviewer APPROVE (or §13 bookkeeping scope) and log it in the ledger.`,
    exit 0 (gh is NOT run — full delegation, the registry's row included).
    Anything else (`human-only`, the template placeholder prose) → the BLOCK
    text above, exit 2.
  - Records-only scope, each a BLOCK (exit 2, stderr, first failing rule wins,
    text starts `❌ BLOCKED (records-only scope):`):
    1. `command -v gh` or `command -v jq` fails → `gh and jq are required to read the PR's file list — fail closed`.
    2. `-R` or `--repo` as a token anywhere (`grep -qE '(^|[[:space:]])(-R|--repo)([[:space:]=]|$)'`) → `cross-repo merge (-R/--repo) is never delegated`.
    3. `--auto` anywhere → `--auto defers the merge past this check`.
    4. Occurrences: `grep -o 'gh pr merge' <<< "$CMD" | wc -l` ≠ 1 → `more than one merge in a single command`.
    5. `SEG` = text from the first `gh pr merge` to the end; `printf '%s' "$SEG" | tr -d '\n' | grep -qE ';|&&|\|\||\|'` or `SEG` contains a newline → `the merge must be the last command in the line — no ; && || | or newline after it`.
    6. PR ref = first token of `SEG` after `gh pr merge` that does not start
       with `-` (split on whitespace, strip quotes). Accept `^[0-9]+$` → `N`
       only; anything else (missing, URL, branch name, `.`) → `PR ref must be a plain number (got: <token|none>) — URLs, branch names and the current-branch form are ambiguous`.
    7. `JSON=$(cd "${TOP:-$D}" && gh pr view "$N" --json state,files,statusCheckRollup)`
       — **do not redirect gh's stderr** (the harness asserts on it); empty or
       `! jq -e . <<< "$JSON"` → `could not read PR #N via gh pr view`.
    8. `.state != "OPEN"` → `PR #N is <state>, not OPEN`.
    9. `COUNT=$(jq '.files | length')`: 0 → `PR #N changes no files`; ≥ 100 →
       `PR #N lists <COUNT> files — gh caps the file list at 100, so the full set cannot be verified`.
    10. Every file via `jq -r '.files[] | "\(.changeType // "UNKNOWN")\t\(.path)"'`,
        fail on the first miss, naming it: `changeType` not in
        `ADDED|MODIFIED|DELETED` → `<path> is <changeType> — renames and copies cannot be verified against the allowlist`;
        path through this `case`:
        `*..*) BAD;; .plans/?*) ok;; docs/product/JOURNEY.md|docs/product/overview.html|docs/product/session-handoff.md) ok;; *) BAD;; esac`
        → `<path> is not a record path (allowed: .plans/**, docs/product/JOURNEY.md, docs/product/overview.html, docs/product/session-handoff.md) — the human merges this PR`.
    11. Checks: `jq -r '(.statusCheckRollup // [])[] | "\(.conclusion // .state // "NONE")\t\(.name // .context // "?")"'`;
        any value not in `SUCCESS|SKIPPED|NEUTRAL` → `check <name> is <value>, not green — wait for CI (node tools/ci-wait.mjs) or hand the merge to the human`.
        Rollup empty: `[ -d "${TOP:-$D}/.github/workflows" ]` → `no checks registered yet for PR #N — wait for CI`; else pass with the note `(no CI configured in the target repo)`.
    12. Pass → stdout `✅ records-only scope (§10): PR #N — <COUNT> record path(s), checks green — merging; log it in the ledger.`, exit 0.
  - Values from `gh` pass through `jq -r` only — never `eval`, never
    interpolated into a command. No `set -e` (every branch exits explicitly).

  **2. `hooks.json`**: (a) delete the `case "$CMD" in *'gh pr merge'*) … esac;`
  block from line 55 (keep the `gh pr create` reminder and `exit 0`); edit
  description 56: replace `policy-aware gh pr merge block;` with `(PR merges →
  hooks/lib/merge-guard.sh);`. (b) Add a new PreToolUse/Bash row right after the
  publish-guard row (after line 82): command `bash
  "${CLAUDE_PLUGIN_ROOT}/hooks/lib/merge-guard.sh"`, description starting
  **`merge guardrail (§10, PreToolUse/Bash):`** followed by the contract in one
  paragraph (policy cell read from origin/<default>, anchored match;
  human-only/placeholder BLOCKS; full delegation reminds; records-only scope =
  gh/jq present, no -R/--repo, single trailing merge, numeric ref, no --auto, PR
  OPEN, 1–99 files all ADDED/MODIFIED/DELETED and in the four-path allowlist,
  every check green or no CI configured; gh api pulls/N/merge BLOCKS;
  everything else BLOCKS fail-closed; gh JSON read via jq only; `Body:
  hooks/lib/merge-guard.sh`), `timeout: 10`. `bash -n` must pass on both (lint
  `checkHooks`). Write both with the Edit tool (the literal lives in the file).

  **3. `tools/hook-test.mjs`**: (a) `runHook` gains a `bin` option:
  `bin: { gh: <script text> | false, jq: true | false }` → inside the temp
  `dir`, create `bin/`, symlink **exactly** `BIN_LIST = ['bash', 'sh', 'git',
  'grep', 'sed', 'head', 'tr', 'cut', 'wc', 'cat', 'mkdir', 'dirname']`
  (resolve each with `spawnSync('which', [name])`, skip misses) and `jq` when
  `jq !== false`, write `bin/gh` from the script text with `chmodSync(…,
  0o755)` when `gh` is a string, and spawn with `env.PATH = path.join(dir,
  'bin')` (ONLY that dir — this is how "gh missing" and "jq missing" are
  produced, and it proves the hook's `# externals:` line is complete). Without
  `bin`, behaviour is unchanged. (b) New block above the summary tail, header
  `// ── pr-economy (v1.53.0): the §10 records-only merge scope — path-enforced,
  fail closed ──`, needle `const GUARD = 'merge guardrail'`. Helpers:
  `wfMerge(cell)` → a minimal `docs/WORKFLOW.md` with `## 10. Project profile`,
  `| Key | Value |`, `|---|---|`, and the row `| **Merge policy** | ${cell} |`;
  `prJson({ state = 'OPEN', files, checks })` → `{ state, files: files.map(f =>
  typeof f === 'string' ? { path: f, changeType: 'MODIFIED' } : f),
  statusCheckRollup: checks }` where a check is either `{ __typename:
  'CheckRun', status: 'COMPLETED', conclusion: 'SUCCESS', name: 'lint' }` or
  `{ __typename: 'StatusContext', state: 'SUCCESS', context: 'ci' }`;
  `ghStub(json, { exit = 0 } = {})` → a bash script: `echo "gh-stub-called $*"
  >&2`, then when `$*` contains `pr view`: `printf '%s' '<json>'; exit <exit>`,
  else `exit 1`. Constants: `REC = 'agent-may-merge (records-only, delegated
  2026-10-07)'`; `TPL_CELL` = the `templates/WORKFLOW.md` 939 cell text
  verbatim as it reads AFTER your edit (read it back from the file with
  `readFileSync` + a regex on `**Merge policy**`, so the case cannot drift);
  `FOUR = ['.plans/pr-economy.state.md', '.plans/OBLIGATIONS.md',
  'docs/product/JOURNEY.md', 'docs/product/overview.html',
  'docs/product/session-handoff.md']`; `GREEN = [CheckRun SUCCESS, CheckRun
  SKIPPED, StatusContext SUCCESS]`; `M = 'gh pr merge'` (build command strings
  from it — the literal stays inside the file). Cases (assert exit code AND the
  named text; stderr carries the stub marker):
  - allow: `${M} 101 --squash --delete-branch`, REC, FOUR + GREEN → 0, stdout
    has `records-only scope`, stderr has `gh-stub-called pr view 101`;
  - allow: flags before ref `${M} --squash 7` → 0, stub saw `pr view 7`;
  - allow: leading `cd . && ${M} 101` → 0 (a leading `&&` is fine);
  - allow: empty rollup, no `.github/workflows` staged → 0, stdout has `no CI configured`;
  - allow: DELETED + ADDED changeTypes on record paths → 0;
  - regression: `agent-may-merge (delegated 2026-01-01)` (full) → 0, stdout has
    `reviewer APPROVE`, stderr LACKS `gh-stub-called`;
  - regression: `agent-may-merge (bookkeeping, delegated 2026-07-08)` (the
    registry's live row, L4) → 0, `reviewer APPROVE`, gh NOT called;
  - regression: `gh pr view 1` (not a merge) → 0, silent; `git status` → 0;
  - block: `human-only` → 2, `human (HITL) merges`; block: no `docs/WORKFLOW.md`
    staged → 2; block: `TPL_CELL` (the placeholder prose, verbatim) → 2,
    `human (HITL) merges`, gh NOT called;
  - block: `${M} 101 -R xyzhub/other` → 2, `cross-repo`; block: `${M} --repo
    xyzhub/other 101` → 2;
  - block: `${M} https://github.com/xyzhub/agentic-workflow/pull/7` → 2, `plain
    number`; block: `${M} --squash` (no ref) → 2; block: `${M}
    chore/x-bookkeeping` → 2;
  - block: `${M} 101 && git push` → 2, `last command`; block: `${M} 101 | cat`
    → 2; block: `${M} 101; ${M} 102` → 2, `more than one merge`; block:
    `${M} 101\ngit push` → 2;
  - block: `${M} 101 --auto` → 2, `--auto`; block: `gh api -X PUT
    repos/xyzhub/agentic-workflow/pulls/101/merge` → 2, `bypasses`;
  - block: files FOUR + `docs/product/decisions/2026-10-06-launch-media-brief.md`
    → 2, stderr names that path; block: `docs/WORKFLOW.md` → 2; block:
    `CHANGELOG.md` → 2; block: `plugins/agentic-workflow/hooks/hooks.json` → 2;
    block: `docs/product/roadmap.md` → 2;
  - block: `.plans/../CHANGELOG.md` → 2; block: `docs/product/JOURNEY.md.bak`
    → 2; block: `.plansx/a.md` → 2; block: `.plans/` (bare) → 2;
  - block: `{ path: '.plans/x.md', changeType: 'RENAMED' }` → 2, `renames and
    copies`; block: `COPIED` → 2; block: 100 files all `.plans/f<i>.md` → 2,
    `caps the file list`;
  - block: zero files → 2, `changes no files`; block: `state: 'MERGED'` → 2;
  - block: CheckRun `status: 'IN_PROGRESS', conclusion: null` → 2, `not green`;
    block: CheckRun FAILURE → 2; block: StatusContext `state: 'PENDING'` → 2;
    block: empty rollup WITH `.github/workflows/lint.yml` staged → 2, `wait for CI`;
  - block: `bin: { gh: false }` → 2, `gh and jq`; block: `bin: { gh: stub, jq:
    false }` → 2; block: stub `exit: 1` → 2, `could not read PR`.
  Expect ≥ 42 new `ok` lines (156 → ≥ 198); `hook-test: clean`.

  **4. `tools/lint.mjs` `checkObRow`** (≈ 12 lines after the `strictLabel`
  check): `const src = m[3].trim(); const mk = src.match(/,\s*([^,]+)$/);
  const tag = mk?.[1].trim();` — if `!strictLabel && tag && /merge$/i.test(tag)
  && tag !== 'pre-merge' && tag !== 'post-merge'` → fail
  `Closing-row marker "<tag>" must be exactly \`pre-merge\` or \`post-merge\` (written as \`(<source>, pre-merge)\`); a row with no marker is read as post-merge`;
  if `placeholderOk && !(tag === 'pre-merge' || tag === 'post-merge')` → fail
  `template Closing row must be classified \`(<source>, pre-merge)\` or \`(<source>, post-merge)\` — every new ledger inherits the classification`.
  Update the grammar comment at 637–647 with the marker sentence. Proof: `node
  tools/lint.mjs` clean with every existing ledger untouched.

  **5. `templates/mission-state.md`** Closing block: in the prose (75–90) add,
  after the grammar sentence: "Every row is classified in its source parens:
  `(<source>, pre-merge)` — no dependency on the merge, a deploy or a reinstall;
  fires on the phase branch BEFORE the checkpoint and rides the feature PR — or
  `(<source>, post-merge)` — fires at a later `/agentic-workflow:settle` from
  the mission's ONE bookkeeping branch `chore/<mission>-bookkeeping` and its
  ONE PR, which the agent may merge under the §10 `records-only` scope. A row
  with no marker is legacy and read as post-merge. A mission closes in two
  PRs." Rows 91–105: `branch + worktree cleanup` → `(planner, post-merge)`;
  `docs/record synced` → `(planner, pre-merge)`; `live-verify after reinstall`
  → `(planner, post-merge)`; `version bumped + stamped` → `(planner,
  pre-merge)`.

  **6. `agents/planner.md`**: new section `## Classify every Closing row` after
  line 59 (before "## Estimate honestly"): the marker rule; pre-merge = its
  `when:` is observable on the branch (a grep, a diff, a gate) — never the
  merge, a deploy or a reinstall; the template's seeded split; the two-PR
  shape (feature PR the human merges + one bookkeeping PR the agent may merge
  under the §10 `records-only` scope) — the planner writes the Closing block so
  the close needs no third PR.

  **7. Commands** (L1 + L2):
  - `commands/mission.md`: (a) at 177–179, immediately before "Spawn the
    **reviewer**", insert the **pre-merge Closing pass**: probe every `##
    Closing` row marked `(…, pre-merge)`, tick it (`[x]` + `· fired YYYY-MM-DD
    (<evidence>)`) on the phase branch, write the ledger; the reviewer
    re-verifies them; a pre-merge row whose probe fails is surfaced as a
    REQUEST CHANGES-class finding, never silently reclassified. (b) 219–226:
    after "unless the project's §10 Merge policy is `agent-may-merge`", add
    "(fully, or `records-only` — then only a PR whose every file is a record
    path, which the hook checks from the PR's file list)". (c) §5 259–271:
    append the L1 flow — `git fetch origin`; reuse `chore/<mission>-bookkeeping`
    if `gh pr list --head chore/<mission>-bookkeeping --state open --json
    number` returns a PR, else `git switch -c chore/<mission>-bookkeeping
    origin/<default>`; all post-merge record edits (settle fire-back,
    promotions, `Closed:` stamp, chronicler JOURNEY/overview, handoff) commit
    there; ONE PR `chore(<mission>): post-merge bookkeeping`; when the ledger is
    stamped (or the session ends): `node tools/ci-wait.mjs <sha>` green → merge
    it with `--squash --delete-branch` by its NUMBER (the hook re-reads the
    file list; a BLOCK means leave it open and report it); never a PR per step;
    `Sessions used:` does not increment for the close.
  - `commands/settle.md`: step 4 (157–164) — new paragraph "**Where the
    write-back lands (L1)**": post-merge (feature PR merged / default branch
    checked out) → the bookkeeping branch + PR above, never a settle-only PR;
    merging is the close step's single act. Step 5 (166–193) — after the
    refusal bullet: "Rows marked `(…, pre-merge)` fire on the phase branch
    before the checkpoint (mission.md §3); one still `[ ]` here is a planning
    defect — refuse as usual and name it `pre-merge missed` in the surface
    list."
  - `commands/end.md`: step 4 (49–54) — "Post-merge (the feature PR already
    merged): brief the chronicler record-only — JOURNEY + overview; CHANGELOG.md
    is not a record path and shipped in the feature PR." Step 6 (76–84) — "On
    the default branch with only record paths changed (`.plans/**`,
    `docs/product/JOURNEY.md`, `docs/product/overview.html`,
    `docs/product/session-handoff.md`): never commit there — use the active
    mission's `chore/<mission>-bookkeeping` (reuse its open PR) or
    `chore/bookkeeping-<YYYY-MM-DD>`; commit, push, open-or-reuse ONE PR; then,
    under `agent-may-merge (records-only, …)`, `node tools/ci-wait.mjs <sha>` →
    merge by number with `--squash --delete-branch` (hook BLOCK → leave it,
    report)." Replace "**Never merge the default branch** — that's the human
    owner's act" with "**Never merge beyond the §10 scope** — a feature PR is
    the human owner's act."
  - `agents/chronicler.md` 55–62: one sentence — "Invoked post-merge for a
    mission whose entry already shipped in the feature PR, leave CHANGELOG.md
    alone (it is not a record path) and update JOURNEY + the status page only."

  **8. Protocol text — `templates/WORKFLOW.md`, then the same diff in
  `docs/WORKFLOW.md`** (recompute offsets by grepping the headings after each
  edit; use the Edit tool — the §3 row contains the literal):
  - §3 row 262: `| \`gh pr merge\` | **BLOCKS** unless the §10 **Merge policy**
    cell — read from the committed copy on `origin/<default>`, matched at the
    table cell — delegates it: `agent-may-merge (delegated <date>)` → reminder,
    merge on a reviewer APPROVE; `agent-may-merge (records-only, delegated
    <date>)` → allowed ONLY for a single, numeric-ref, same-repo merge whose
    PR (`gh pr view --json state,files,statusCheckRollup`) is OPEN with 1–99
    files, every one ADDED/MODIFIED/DELETED on a record path — `.plans/**`,
    `docs/product/JOURNEY.md`, `docs/product/overview.html`,
    `docs/product/session-handoff.md`, exact paths — and every check green;
    gh/jq missing, `-R`/`--repo`, a compound command, a URL or branch ref,
    `--auto`, renames/copies, pending/failed checks, any other path, and
    `gh api …/pulls/N/merge` → BLOCK (fail closed). Body:
    `hooks/lib/merge-guard.sh` |`
  - §4 Close 295–302: after "(§5)." add "Post-merge record edits ride ONE
    `chore/<mission>-bookkeeping` branch and PR per mission close (`end`
    reuses an open one); the agent may merge it under the §10 `records-only`
    scope — so a mission needs at most two PRs."
  - §5 Gate policy 469–476: after "never *skipping the review or the staging
    verify*." add "Under `agent-may-merge (records-only, delegated <date>)` the
    delegation covers ONLY a PR whose every file is a record path — the hook
    enforces the allowlist from the PR's file list; the feature PR stays the
    human's."
  - §5 "Mission close & deferred obligations" 500–518: after the grammar
    sentence add the marker rule (pre-merge / post-merge, legacy = post-merge,
    pre-merge rows fire on the phase branch before the checkpoint and ride the
    feature PR; post-merge rows fire from the one bookkeeping PR).
  - §10 row 939: extend the placeholder prose with the third value: "or
    `agent-may-merge (records-only, delegated <date>)` — the agent may merge a
    PR ONLY when every changed path is a record path (`.plans/**`,
    `docs/product/JOURNEY.md`, `docs/product/overview.html`,
    `docs/product/session-handoff.md` — exact paths; CHANGELOG, code, hooks,
    tools, templates and `docs/WORKFLOW.md` are not) and CI is green; the hook
    enforces it from the PR's file list, fail closed. The placeholder prose in
    this row never enables any scope — only the exact value does".
  - §11 1012–1016: "PRs or §13 registry bookkeeping" → "PRs, §13 registry
    bookkeeping, or record-only PRs under the §10 `records-only` scope
    (hook-enforced path allowlist, §3)".
  - `docs/WORKFLOW.md`: the same edits at 254, 287–294, 461–468, 492–510,
    998–1002; §10 row 927 → `| **Merge policy** | agent-may-merge (records-only,
    delegated 2026-10-07) |`; line 3 → `<!-- protocol-master: v1.53.0 -->`.
    **Do this step last among the prose steps** — from this edit on, the
    installed inline hook is warn-only in this checkout (it reads the working
    tree); you run no merge command anyway.

  **9. Record**: `plugin.json` → `1.53.0`; `CHANGELOG.md` `[Unreleased]` →
  `## [1.53.0] — <today>` / `### Changed — a mission closes in two PRs
  (pr-economy)` with bullets: L3 merge-guard lib hook + the exact allowlist +
  the fail-closed rules (anchored cell match, origin/<default> policy source,
  numeric ref, no cross-repo/compound/--auto/api, changeType, 100-file cap, CI)
  + harness `156 → N ok`; L2 Closing-row marker `(<source>, pre-merge|post-merge)`
  with legacy = post-merge, template rows classified, lint marker rule; L1 one
  `chore/<mission>-bookkeeping` PR per close in `mission`/`settle`/`end`,
  chronicler record-only post-merge; L4 — the registry's `(bookkeeping, …)` row
  stays full delegation, `records-only` is a new value; the transitional window
  (the 1.52.0 inline hook is warn-only in a checkout whose working-tree §10
  says `agent-may-merge …` until `/plugin update`); put a fresh `##
  [Unreleased]` / `_(empty)_` above. Plugin README 227–229: "blocks PR merges
  unless the target repo's §10 Merge policy delegates them — fully, or
  `records-only`, where the hook allows a merge solely when every changed path
  is `.plans/**` or one of the three record files and CI is green (fail
  closed)".

  **10. Pre-merge Closing rows of THIS mission** (last, after lint is green):
  run the two pre-merge probes in `.plans/pr-economy.state.md` and report the
  evidence lines in your hand-off — the **orchestrator** ticks the rows (the
  builder never edits the ledger): `grep -c 1.53.0 plugins/agentic-workflow/.claude-plugin/plugin.json CHANGELOG.md docs/WORKFLOW.md`
  (= 1 each) and the section diffs between the two WORKFLOW copies (empty).
- **Verify**: `node tools/lint.mjs` ends `lint: clean` (includes hook-test ≥
  198 ok and the marker rule, with every pre-existing ledger untouched);
  `node tools/hook-test.mjs` ends `hook-test: clean`; `bash -n
  plugins/agentic-workflow/hooks/lib/merge-guard.sh`; `git grep -n 'merge
  guardrail' plugins/agentic-workflow/hooks/hooks.json` finds the needle at the
  start of the new description; `git grep -c 'gh pr merg[e]'
  plugins/agentic-workflow/hooks/hooks.json` = 0 for line 55's command (the
  literal now lives only in the new row's description and the lib hook —
  **never type the un-bracketed literal in a Bash command**); for each shared
  section, `diff <(sed -n 'A,Bp' plugins/agentic-workflow/templates/WORKFLOW.md)
  <(sed -n 'C,Dp' docs/WORKFLOW.md)` is empty (§3 row, §4 Close, §5 Gate
  policy, §5 Closing paragraph, §11 sentence — grep the headings for offsets);
  `docs/WORKFLOW.md` §10 row 927 carries the new value and line 3 the new
  stamp; `templates/codex.rules` and §13 unchanged (`git diff --stat` lists
  neither codex.rules nor a §13 hunk); no file outside the 16 named here
  changed; `claude --plugin-dir plugins/agentic-workflow` loads without a hook
  error (the staging verify; leave to the checkpoint if no live session).
  Catalog: none.
- **Read budget**: ≈ 700 lines (under 1,500). Suits: `security`.

**Checkpoint ckpt-p1** ends phase 1 — ONE fresh `reviewer` on **Fable**
(security boundary: a hook that grants merge authority from untrusted command
text and untrusted `gh` JSON; an exact allowlist; the policy source). Before
spawning it the orchestrator runs the **pre-merge Closing pass** (ticks
`version bumped + stamped` and `docs/record synced` on `mission/pr-economy`
from S1's evidence). The reviewer re-runs `node tools/lint.mjs`, diff-reviews
`49fb2e7..mission/pr-economy`, and checks specifically: every block path exits
2 and the allow path needs ALL of policy + shape + ref + OPEN + 1–99 files +
changeType + allowlist + checks; the policy match is the anchored cell regex
and the template placeholder row is a harness BLOCK case; no
`eval`/interpolation of `gh` output; the policy row is read from
`origin/<default>` when in a git tree; the allowlist is exact (no
`docs/product/` prefix, `..` rejected); the harness `BIN_LIST` matches the
hook's `# externals:` line; `(planner, owner-locked)` still lints; the two
WORKFLOW copies match in every shared section; §13, codex.rules and the
registry are untouched; the two pre-merge rows carry real evidence; the
reviewer itself runs no merge command. Then staging verify (lint + `claude
--plugin-dir` load) → one PR to `main` (`feat(close): 1.53.0 — a mission
closes in two PRs (pr-economy)`), human merges. **After the merge** the
orchestrator closes by the new L1 flow BY HAND (the installed plugin is still
1.52.0 until the owner reinstalls — and merges nothing before that): `git
fetch`, `git switch -c chore/pr-economy-bookkeeping origin/main`, run
`/agentic-workflow:settle` (branch reap), fire the post-merge rows, chronicler
record-only, `Closed:` stamp, handoff — one PR `chore(pr-economy): post-merge
bookkeeping`; after the owner's `/plugin update` + `/reload-plugins`, the
`live-verify after reinstall` row's dry invocation and 999999 BLOCK run first,
then the bookkeeping PR is merged by number under the new hook.

---
_Size every brief to its read budget; split any that can't fit and note the
split. Each session's outcome and any deviation lands in
`.plans/pr-economy.state.md`, never only in chat._
