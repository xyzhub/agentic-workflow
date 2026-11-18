---
status: frozen
owner-agent: architect
refresh-trigger: never
---

# agentic-workflow — Decision memos: parallel waves

_Five shape decisions (D1–D5) for the feature in
`docs/product/decisions/2026-11-18-parallel-waves-brief.md`. The owner's picks in
that brief are LOCKED and are not reopened here: waves fire automatically up to
the cap (the profile row IS the consent) · cap 3 default, drift BLOCKS
integration · per-brief working-copy preparation is in v1 · on a mid-wave
failure keep the passing briefs and retry the failed one once._

_Every claim below is labelled **fact** (with a repo path, a line, or a URL),
**inference**, or **assumption**. Paths relative to `plugins/agentic-workflow/`
unless they start with `docs/`, `tools/`, `.plans/` or `.claude/` (repo root).
Plugin version at writing: 1.69.1. Platform claims were verified against
`code.claude.com` docs on 2026-11-18, not from memory._

## How the five picks couple

The owner makes all five at one approval, so each recommendation names what it
assumes elsewhere.

| Pick | Depends on | Consequence if the other pick changes |
|---|---|---|
| D1 write-set grammar | D2 (prevention is directory-level, so path-level is detection only) | A coarser D2 makes D1's glob precision cosmetic |
| D2 isolation | D5 (the prep recipe must copy secrets itself unless Claude Code makes the worktree) | D2-A would move the prep recipe into `.worktreeinclude` and drop two fields |
| D3 issue-44 boundary | D2 (orchestrator-made worktrees are 44's own primitive, used per-brief) | Picking D2-A leaves 44's worktree code unbuilt and unreused |
| D4 accounting | D5 (the cap is what makes the planner's wave count computable) | A per-mission cap instead of a profile cap makes `Estimate:` unknowable at plan time |
| D5 profile surface | D1 (the hot-file set is the only thing a brief may never declare) | A project-extensible hot set turns D1's static lint check into a per-project parse |

## Verified facts the memos stand on

**Platform (Claude Code / Agent tool)**

| # | Fact | Source |
|---|---|---|
| P1 | `isolation` is a documented subagent **frontmatter** field — "Set to `worktree` to run the subagent in a temporary git worktree, giving it an isolated copy of the repository **branched by default from your default branch rather than the parent session's `HEAD`**". It can also be passed on the Agent call itself (the sub-agents page mentions "the call … passes `isolation` on the call itself"), but the call-level form is not specified in the docs | `code.claude.com/docs/en/sub-agents` |
| P2 | Base branch is settings-level, not per-call: `worktree.baseRef` takes only `"fresh"` (default, the remote default branch) or `"head"`. "You can't set `worktree.baseRef` to a branch name." | `code.claude.com/docs/en/worktrees` |
| P3 | Claude-Code-created worktrees live under `.claude/worktrees/<name>/` on a branch named `worktree-<name>`; the path and branch are not caller-chosen | same |
| P4 | A subagent worktree "is automatically cleaned up if the subagent makes no changes"; one **with** changes survives until a periodic sweep, and the sweep "leaves a worktree in place" when it holds changes, untracked files or unpushed commits | same |
| P5 | While a session is isolated, Claude Code **blocks** edits/writes targeting the main checkout, Bash commands whose working directory resolves to the main checkout, git redirects into it, and commands whose git target it cannot verify from the text. "The same enforcement covers every subagent Claude spawns from the isolated session." | same |
| P6 | `EnterWorktree` moves a session into an existing worktree. For a path **outside** `.claude/worktrees/`, Claude Code "asks for your approval first… only `bypassPermissions` mode skips it" — and `bypassPermissions` is on the plugin's own forbidden list (`tools/run-claude.mjs` `FORBIDDEN`) | same + repo |
| P7 | The worktree tools disappear entirely when `permissions.blockWritesOutsideWorkingDirectories` is on: "Claude Code removes both worktree tools or refuses calls to them" | same |
| P8 | `.worktreeinclude` copies gitignored files (e.g. `.env`) into **"every worktree Claude Code creates with git"** — not into one made by hand with `git worktree add` | same |
| P9 | A worktree shares the main repository's `.git` directory; plugins installed at project scope load in worktrees of the same repository without reinstalling | same |
| P10 | Hook paths do not follow a worktree: `${CLAUDE_PROJECT_DIR}` stays at the session's start directory, while the hook input's `cwd` field is the worktree root | same |
| P11 | Third-party trackers carry open reports that parallel subagents' worktree isolation leaks (git working directory and HEAD modifications). **Not reproduced here** — treat as a reason not to make platform isolation the only barrier, not as a verified defect | `claudeissues.com` issues 62122, 55708 |
| P12 | `EnterWorktree` "creates an isolated git worktree and switches into it. Given a `path`, it switches into an existing worktree instead of creating a new one." A path outside `.claude/worktrees/` "prompts for your approval before entering, **since it moves the session's working directory and write access to that location**". It is an allowlisted tool (`tools:` lists are allowlists) and vanishes under `permissions.blockWritesOutsideWorkingDirectories` | `code.claude.com/docs/en/tools-reference#enterworktree-tool-behavior` |

**Repo**

| # | Fact | Source |
|---|---|---|
| R1 | Both foreign-runtime adapters take a **required** `--cwd` and derive `changed_paths` from the git tree at that directory | `tools/run-claude.mjs:68,111`; `tools/run-codex.mjs:62,92` |
| R2 | `--restricted` already "confines the file tools to `--cwd`", witnessed: "a Write outside `--cwd` was denied, one inside…". This is existing, proven write confinement at **directory** granularity | `tools/run-claude.mjs:29–31,276–278` |
| R3 | The actual-write measurement already exists: `statusSnapshot()` + `changedPaths()` run `git status --porcelain` at a cwd and diff a before/after snapshot. On a rename they keep **only the new path** | `tools/run-codex.mjs:408–425` (imported by `run-claude.mjs:44`) |
| R4 | The orchestrator is already the committer for runs it did not drive: "you own the ledger and git… commit its `changed_paths` yourself"; `changed_paths` empty on `done` is suspicious → `[~]` | `commands/mission.md:187–194` |
| R5 | `ledger.mjs sessions +N` accepts any N, and a `Reviewer runs:` line already exists, "bumped at every one-shot reviewer spawn, plan-judge included" — both wave-ready with no tool change | `tools/ledger.mjs:159–184` |
| R6 | `active-ledger.sh` is "the ONE definition of the active mission ledger", shared by five hooks, and walks `.plans/*.state.md` **newest-mtime first** | `hooks/lib/active-ledger.sh` header |
| R7 | In a linked worktree every ledger carries the same checkout mtime (measured: all 22 files at `Nov 9 18:49:56 2026` in `.worktrees/continuous-op/.plans/`), so `ls -t` order there differs from the main checkout's and ties break by name, not recency | measured 2026-11-18 |
| R8 | The five `active_ledger` consumers bind to `UserPromptSubmit` (mission-budget, handoff-budget), `PreToolUse/Bash` (beat-enforcer), `Stop` (beat-enforcer-stop) and `SessionStart:compact` (compact-resume) | `hooks/hooks.json` |
| R9 | The beat-enforcer "ALWAYS exit 0 — never blocks"; the mission-budget hook only prints | `hooks/lib/beat-enforcer-pretooluse.sh:19`; `hooks/lib/mission-budget.sh:94–107` |
| R10 | `AGENTIC_WORKFLOW_CHILD=1` (set by both adapters) silences every plugin hook | `tools/run-claude.mjs` `childEnv`; `hooks/lib/beat-enforcer-pretooluse.sh:23` |
| R11 | `.worktrees/<mission>` is the existing convention and is **live** (`.worktrees/continuous-op` on `feat/continuous-op`), but `.worktrees/` is **not** gitignored — it shows as `?? .worktrees/` in the main checkout | `commands/mission.md:215`; `git worktree list`, `git status --porcelain`, `.gitignore` |
| R12 | This repo's `High-impact files` row is `templates/WORKFLOW.md`, `hooks/hooks.json`, `tools/lint.mjs`, `agents/*`, `commands/*` — exactly the files this feature's own briefs must write (AC-18) | `docs/WORKFLOW.md` §10 |
| R13 | Two tool homes exist: repo-root `tools/` holds this repo's own tier-1 lint, which **ventures never run**; `plugins/agentic-workflow/tools/` is what ships. `ci-wait.mjs` is kept byte-identical in both | `ls -l` both trees |
| R14 | Shipped tools are "Zero deps; Node >= 18" — no glob library is available | `tools/ledger.mjs:2` |
| R15 | Measured: `git diff --name-only` with default rename detection reports **only the new path** for a rename (`b/g.txt`), hiding that `a/f.txt` left the tree. `--name-status --no-renames` reports both (`D a/f.txt`, `A b/g.txt`) | measured 2026-11-18 |
| R16 | Measured: two-dot `phase..brief` against a **moving** phase tip reports the orchestrator's own ledger write (`M .plans/m.state.md`) and a sibling brief's integrated file (`D src/c.js`) as the brief's changes. Three-dot `phase...brief` and a pinned fork SHA both report exactly `A src/b.js` | measured 2026-11-18 |
| R17 | **No builder role lists `EnterWorktree`.** Every implementer role's allowlist is `tools: Read, Write, Edit, Bash, Grep, Glob` (`backend`, `frontend`, `devops`, `security`, `ops`, `analyst`, `chronicler`, `curator`) | `grep '^tools:' agents/*.md`, measured |
| R18 | Measured: `git add -- <path that does not exist>` is **fatal** (`pathspec … did not match any files`, exit 128), and a git pathspec's `*` **crosses `/`** (`git add -- 'docs/*'` staged `docs/a/created.md`). So declared entries can never be handed to `git add` directly | measured 2026-11-18 |
| R19 | Measured: `git status --porcelain` collapses an untracked directory to `deep/`, while `--untracked-files=all` names `deep/nest/f.txt`. The existing `statusSnapshot()` uses the collapsing form | measured 2026-11-18; `tools/run-codex.mjs:408` |
| R21 | Measured: a path the **builder** staged but did not commit **rides along** in the orchestrator's commit — `git add -- dec/declared.md && git commit` committed `und/undeclared.md` too. A pathspec commit (`git commit -m … -- dec/declared.md`) committed only the declared path and left the other staged, where the residue read catches it | measured 2026-11-18 |
| R22 | The adapter refuses a bare `Bash` allowlist entry ("scope it (e.g. `Bash(git log:*)`); refusing to spawn an unscoped shell") — so Bash is allowlisted **by command prefix, not by path**, and no sandbox flag is passed. `--restricted`'s witnessed denial covers the **file tools** | `tools/run-claude.mjs:248,350`; argv at `:236–257` |
| R23 | The adapter's distillate path is the caller's (`path.resolve(o.out)` against the orchestrator's process cwd) and it writes `.events.jsonl` / `.raw.txt` siblings. `.gitignore` ignores those siblings under `.plans/runs/` but **keeps the `.json` distillate** | `tools/run-claude.mjs:367,390,443`; `.gitignore` |
| R20 | `run-claude.mjs` declares its whole tool surface explicitly (`--tools` + `--allowedTools` + `--permission-mode acceptEdits` + `--permission-prompts none`), and exists because "a Haiku row must run inside its own 100K compaction window… that knob is per process". It is proven for **record** roles, not builders (§10 Runtimes: "Haiku record roles; proven 2026-10-11") | `tools/run-claude.mjs:21–34,236–257`; `docs/WORKFLOW.md` §10 |

---

# D1 — Write-set grammar and drift measurement

## The question

How does a brief declare the paths it may write, and how is "what it actually
wrote" measured, so that `waves.mjs` can group briefs without touching the
filesystem and the integration check can block a brief that broke its promise?

**What it constrains downstream:** everything. The declaration is the one new
fact in the feature (brief, "Problem"); the wave computation, the hot-file
refusal, the drift block, the staging allowlist and the lint rule all read it. A
grammar that cannot be compared without the filesystem makes AC-5's determinism
impossible; a measurement that misses a path makes AC-10 a claim rather than a
gate.

## Prevention versus detection — the frame

Two different mechanisms are available and they do not have the same reach
(**fact** R2 / **fact** P5):

- **Prevention is directory-level.** `--restricted` confines file tools to
  `--cwd`; Claude Code's isolation checks block writes into the main checkout.
  Neither can express "only `tools/waves.mjs`". So a brief is *prevented* from
  leaving its **working copy**, and only *detected* when it leaves its
  **declared paths** inside that copy.
- **Detection is path-level** and runs in the orchestrator, after the brief
  returns, before the merge.

Consequence to accept explicitly: path-level drift is always found after the
fact. The owner's "drift blocks integration" lock is therefore the right posture
— there is no option where a path-level violation is impossible, only options
where it cannot be merged. One prevention layer *is* available at path level and
costs nothing: stage only the declared set (below).

## Options

### Option A — exact paths only

- **How it works here** — a brief's `Writes:` field lists complete
  repo-relative paths: `plugins/agentic-workflow/templates/WORKFLOW.md ·
  plugins/agentic-workflow/tools/waves.mjs · tools/waves-test.mjs`. Overlap is
  set intersection — ten lines, no matcher, no ambiguity (**fact** R14: no glob
  library is available).
- **Tradeoffs** — maximal parallelism (two briefs in one directory can wave) and
  a perfectly decidable overlap test. But a brief cannot honestly declare
  work whose file names it does not yet know: a generated catalog page, a second
  test fixture, a migration whose timestamp is minted at run time. Every such
  brief either over-declares by listing guesses (which then show as
  declared-but-unwritten) or drifts on its first create.
- **Operational cost** — near zero to build; recurring cost is planner
  precision: the planner must name every created file exactly, and a wrong guess
  is a blocked integration rather than a warning.
- **Cost of reversal** — low. Exact paths are a strict subset of any glob
  grammar, so moving to Option B later leaves every existing declaration valid.

### Option B — paths plus a small, decidable glob subset

- **How it works here** — entries are repo-relative and may be: an exact path ·
  a directory with a trailing slash (`docs/product/catalog/` = that directory
  and everything under it) · `*` as a whole segment · `**` for any depth · `*`
  inside the **final** segment only (`plugins/agentic-workflow/tools/waves*.mjs`).
  No `?`, no character classes, no braces, no absolute paths, no `..`. Overlap is
  computed from the static prefix plus the final-segment pattern, and is
  **conservative: when overlap cannot be decided, the tool declares overlap**, so
  the failure mode is a smaller wave, never a collision. ~40 lines of matcher,
  fully unit-testable (AC-17 wires it into `tools/lint-test.mjs`).
- **Tradeoffs** — expresses creates and generated output honestly, which is what
  the repo's real briefs need (this feature's own briefs write
  `plugins/agentic-workflow/tools/waves.mjs` **and** a test file **and** rewrite
  three protocol files). Costs a hand-rolled matcher and one genuinely subtle
  invariant (conservative overlap) that must be covered by tests or it rots into
  a false "disjoint".
- **Operational cost** — one matcher to own, shipped in the plugin so ventures
  get it (**fact** R13). A planner who writes `**` too broadly silently loses
  parallelism, which `waves.mjs` must report as the exclusion reason (AC-5) or
  nobody will notice.
- **Cost of reversal** — low to tighten (ban a pattern form, lint fails loudly),
  moderate to widen (a richer grammar changes the overlap test, and every stored
  declaration has to be re-read under new semantics).

### Option C — directory prefixes only

- **How it works here** — a brief claims directories: `plugins/agentic-workflow/tools/ ·
  docs/product/decisions/`. Overlap is prefix comparison — five lines.
- **Tradeoffs** — simplest to build and impossible to get subtly wrong, and
  creates are free (any new file inside a claimed directory is declared). But in
  **this** repo it waves almost nothing: the whole plugin lives in five
  directories (`agents/`, `commands/`, `templates/`, `tools/`, `hooks/`), and
  §10's own High-impact row is that same list (**fact** R12). Two briefs that
  each touch one agent file would collide on `agents/` and run serially — the
  feature would ship and then measure a speedup of 1.0.
- **Operational cost** — lowest to build, highest to live with: planners would
  start inventing directories to win parallelism, which is a worse outcome than
  no waves.
- **Cost of reversal** — low mechanically, but the first real measurement (AC-15)
  would already have been taken against a crippled grouping, so the evidence the
  feature is judged on is spent.

## Recommendation

**Option B — paths plus the small glob subset, with conservative overlap.**

Rationale. The deciding evidence is this repo's own shape: with Option C nothing
in the plugin tree can wave (**fact** R12), and with Option A no brief that
creates a file can declare itself honestly — and AC-16 requires one real mission
phase to run 2+ briefs concurrently, in this repo, as the proof. Option B is the
only one that both groups real briefs and keeps the overlap test decidable
without a dependency (**fact** R14). The conservative rule is what makes it
fail-closed by shape: an undecidable comparison costs a wave, never a collision.

**Strongest case against:** the matcher is new code with a subtle invariant, in a
repo whose entire premise is that markdown and small deterministic tools beat
clever machinery. If the matcher has a false-disjoint bug, two briefs write the
same file in two worktrees and the conflict surfaces at integration as a merge
conflict — recoverable, but it is exactly the failure the feature exists to
prevent. Mitigation is cheap and must be in the brief: a property test that the
overlap test is symmetric, and a test that every undecidable pair returns
"overlap".

### The rest of D1, decided

**Creates and generated output.** No separate syntax. A path a brief will create
is declared like any other path; a declared path that is never written is **not
drift** (below), so declaring a create costs nothing. Generated/derived output is
declared explicitly — the worked example is the catalog (**fact**,
`agents/planner.md:66`): a brief that touches a route must rewrite its
`features.md` row in the same branch, so a route-touching brief declares
`docs/product/catalog/features.md`, and **two route-touching briefs therefore
overlap and cannot wave**. That is correct, not a defect: they both edit one
file. Gitignored output (`node_modules/`, `.env`, a build directory) is outside
the measurement by construction and is never declared.

**How the actual diff is derived — three reads, not one.**

1. **The brief's branch range:** `git diff --name-status --no-renames
   <fork-sha>..<brief-head>`, where `<fork-sha>` is the phase-branch tip pinned
   and written to the ledger at spawn (write-ahead, LA-6). Two decisions here are
   evidence-backed, not taste:
   - `--name-status --no-renames`, not `--name-only`: measured, `--name-only`
     reports only a rename's new path and hides that the old path left the tree
     (**fact** R15), so a brief could `git mv` a file out of its declared set and
     pass. `--no-renames` reports `D old` + `A new`, and the A/M/D letter makes
     the drift message concrete ("created", "deleted").
   - a **pinned fork SHA**, not two-dot against the live phase tip: measured,
     two-dot against a moving tip attributes the orchestrator's own ledger write
     and an already-integrated sibling brief's files to this brief (**fact**
     R16). Three-dot (`phase...brief`) gives the same answer as the pinned SHA
     today and is the fallback when no SHA was recorded, but the pinned SHA is
     recorded, auditable, and does not move if a brief ever merges anything.
2. **Residue in the brief's own worktree:** `git status --porcelain
   --untracked-files=all` there, compared against a **post-preparation
   snapshot** — not against empty. Two corrections the measurements force:
   - *Not empty*: D5's preparation step legitimately leaves changes behind in a
     real venture (a refreshed lockfile, generated clients, a seeded fixture).
     The baseline is the snapshot taken after preparation and before the brief
     spawns, which is exactly the before/after shape `changedPaths()` already
     implements (**fact** R3).
   - *`--untracked-files=all`*: the default porcelain form collapses an untracked
     directory to `deep/` (**measured**, R19), so a drift reason would name a
     directory instead of the file that broke the promise. The existing
     `statusSnapshot()` uses the collapsing form and needs the flag added.
3. **The orchestrator's checkout is unchanged:** its `git status --porcelain
   --untracked-files=all` is snapshotted before the wave and re-read after each
   brief. **Under D2 Option B this read is not a belt on a belt — it is the only
   cover for Bash.** `--restricted`'s witnessed denial is about the *file* tools;
   Bash is allowlisted by command prefix, not by path, and no sandbox flag is
   passed (**fact** R22), so a `cp`, a shell redirect or a `git -C` into the main
   checkout from a waved brief is not refused by anything. (Under A or C the
   platform refuses the git redirect but still not the `cp` — **fact** P5 is
   explicit that no check tracks which files a shell command writes.) Without
   read 3, such a write reaches no branch and is never seen.
   Two paths are expected to change in the orchestrator's own checkout and must be
   excluded by name rather than by habit: the ledger (its own write) and the
   adapter's distillate plus its log siblings, whose location the orchestrator
   chooses and whose `.json` is deliberately not gitignored (**fact** R23). Pass
   `--out` under `.plans/runs/` and exclude `.plans/` from read 3; anything else
   in the main checkout is drift.

**Where the check runs.** In the orchestrator, in the main checkout, via `git -C
<worktree>`, **before** the merge — and one prevention layer sits in front of it:
the orchestrator stages **only the changed paths that match the declared set**.
The mechanics matter, because the obvious implementation is broken (both
measured, R18):

- `git add -- <declared entries…>` is **fatal** on any declared path that was not
  written (`pathspec … did not match any files`, exit 128) — and declared-but-
  unwritten paths are legal under this memo, so this would break the commit of
  every honest over-declaration.
- A git pathspec's `*` **crosses `/`**: `git add -- 'docs/*'` stages
  `docs/a/created.md`. Handing the declared entries to git would therefore stage
  more than the grammar permits, and under two different matchers.

So: list the changed paths (read 1 + read 2), filter them through the **one**
matcher that `waves.mjs` uses, and stage that list literally. One matcher decides
grouping, drift and staging — if they ever disagree, the declaration means
different things in different places.

And **commit with an explicit pathspec**, because staging an allowlist is not
enough: measured, a path the *builder* staged (a `git add` or `git mv` it ran
itself) rides along in the orchestrator's next commit, while
`git commit -m … -- <filtered paths>` commits only those and leaves the rest
staged, where read 2 catches them (**fact** R21). Equivalently, reset the index
first; the pathspec form is one command and does not discard the builder's work.
With that, an undeclared write cannot enter the commit at all — it can only
appear as residue, which blocks. This makes the declared set the staging
allowlist, the same shape the repo already uses for the records-only merge
delegation (**fact**, §5 gate policy: "the hook enforces the allowlist from the
PR's file list").

**Declared-but-unwritten is not drift.** The brief's own words are "the paths it
may write" — an upper bound. Blocking on an unused declaration would punish
honest over-declaration and reward under-declaration, which is the actual hazard.
It is recorded instead: one ledger line per brief ("declared N, wrote M, unused:
…"), and `waves.mjs` names over-declaration when it is the reason a brief was
excluded from a wave. The existing rule already covers the degenerate case — a
brief that wrote **nothing** on `done` is suspicious and takes `[~]` plus
reviewer confirmation (**fact** R4).

**Static validation — yes, in two homes.** A lint can check the grammar
(a `Writes:` field is present on every brief; every entry is repo-relative with
no `..`, no leading `/`, no banned pattern form), that no brief declares an
orchestrator-only hot path (D5), and that a brief marked parallel-safe declares
something. It cannot check that a path will be written. Because **ventures never
run this repo's root lint** (**fact** R13), the grammar validator must ship
inside the plugin — `plugins/agentic-workflow/tools/waves.mjs --check`, wired
into `conform.mjs` — while the repo-root `tools/lint.mjs` covers the plugin's own
template text and rule dedup (AC-17/AC-18). This also resolves AC-5's ambiguous
`tools/waves.mjs`: it ships at `plugins/agentic-workflow/tools/waves.mjs`, with a
byte-identical root copy only if the repo keeps its `ci-wait.mjs` mirroring
convention.

**Values this decision settles:**
- Field name and separator: `- **Writes**: <entry> · <entry>` in
  `templates/mission-sessions.md`, beside `Reads:`/`Catalog:`.
- Allowed entry forms: exact path · `dir/` · whole-segment `*` · `**` ·
  final-segment `*`. Everything else is a lint failure.
- Overlap rule: conservative — undecidable ⇒ overlap.
- Drift measurement: `git diff --name-status --no-renames <pinned-fork-sha>..<head>`
  plus worktree residue (`--untracked-files=all`, against the post-prep snapshot)
  plus main-checkout unchanged.
- One matcher only: the same function decides wave grouping, drift and what gets
  staged; git pathspecs are never fed the declared entries (**measured**, R18).
- Drift verdict: a path outside the declared set (or a hot path) blocks; a
  declared path not written is a ledger note.

**What would change the answer.** If a venture's briefs regularly need patterns
this subset cannot express (character classes, brace sets) the grammar widens —
the trigger is two separate missions whose planner had to over-declare a whole
directory to express a real write set. If a dependency ever becomes acceptable in
the shipped tools, the hand-rolled matcher is replaced by a library matcher and
the conservative rule can be relaxed to real glob intersection. If measurement
shows blocked integrations are dominated by *rename* drift, promote renames to a
first-class declaration (`moves: old → new`).

---

# D2 — Isolation mechanism

## The question

Does each brief in a wave get its working copy from Claude Code's own subagent
worktree isolation, or from an orchestrator-run `git worktree add` that the
orchestrator also reaps and commits in?

**What it constrains downstream:** who owns the branch name and the base commit
(and therefore whether AC-7's "defined, recorded order" is expressible), whether
a brief carrying `runtime: codex` can ever be waved, whether the working-copy
prep recipe (D5) has to copy secrets itself, and whether the whole mechanism
works under `claude -p`.

## Options

### Option A — let Claude Code make the worktrees (`isolation: worktree`)

- **How it works here** — the plugin's builder role prompts (`agents/backend.md`
  and friends) gain `isolation: worktree` in frontmatter, or the orchestrator
  passes `isolation` on the Agent call (**fact** P1; the call-level form is
  mentioned in the docs but not specified, so building on it is an
  **assumption**). Claude Code creates the worktree, picks the path
  (`.claude/worktrees/<name>`) and the branch (`worktree-<name>`) (**fact** P3),
  enforces isolation itself (**fact** P5), and cleans up only if the subagent
  made no changes (**fact** P4).
- **Tradeoffs** — zero worktree code to write, and the strongest available
  prevention: writes and git redirects into the main checkout are refused by the
  platform. But four facts cut against it:
  1. **Wrong base branch.** A subagent worktree is branched "by default from
     your default branch rather than the parent session's `HEAD`" (**fact** P1),
     and the only alternative is the settings-level `worktree.baseRef: "head"`,
     which "can't be set to a branch name" (**fact** P2). A wave's briefs must
     start from the **phase branch tip**. So either every waved brief builds on
     `main` (wrong — it would not contain the phase's earlier briefs), or the
     project sets `baseRef: "head"` globally, which changes behaviour for every
     unrelated worktree in that project.
  2. **No caller-chosen branch name** (**fact** P3). AC-7 wants a recorded
     integration order and the ledger wants per-brief branch rows; under A the
     orchestrator has to discover `worktree-<name>` after the fact.
  3. **Per-role, not per-brief.** Frontmatter isolation applies to *every* spawn
     of that role in every project — serial briefs and single-brief missions
     included. That is a global behaviour change smuggled in by a feature that is
     supposed to be gated on a profile row (AC-2).
  4. **Claude-only.** It cannot cover a brief carrying `runtime: codex` or a
     preset routing to `claude -p` (**fact** R1: those adapters take `--cwd` and
     nothing else).
- **Operational cost** — low to build, awkward to operate: a changed worktree
  survives until a sweep governed by `cleanupPeriodDays` (**fact** P4), so
  reaping is not the orchestrator's to schedule, and `.claude/worktrees/` is a
  namespace the plugin does not control.
- **Cost of reversal** — **high.** Branch names, paths and lifecycle all belong
  to the platform, so the ledger rows, the integration order and the drift check
  are all written against artifacts the plugin did not name. Moving to B/C later
  re-plumbs all of them.

### Option B — orchestrator makes the worktree; every waved brief runs as a child process

- **How it works here** — `git worktree add <path> -b mission/<mission>-p<N>-<Sn>
  <phase-tip-sha>`, then every waved brief is spawned via the existing adapters
  with `--cwd <path>` (**fact** R1), confined by `--restricted` (**fact** R2).
  The orchestrator commits the brief's declared set with `git -C`, merges in
  order, and removes the worktree.
- **Tradeoffs** — one mechanism for all three runtimes, our branch names, our
  base SHA (which D1 needs pinned anyway), prevention already witnessed in this
  repo, and `changed_paths` already produced by the adapter. Against it: every
  waved brief becomes a headless `claude -p` child, while serial briefs stay
  in-session Agent-tool builders. That is two builder paths with different model
  defaults and limits (`DEFAULTS` in `run-claude.mjs` are tuned for record roles:
  `maxTurns 24`, `readBudget 500`), hooks silenced inside the child (**fact**
  R10), and no mid-brief course correction. It also confounds AC-15: a measured
  "wave vs serial" speedup would be measuring two different runners as well as
  two different arrangements.
- **Operational cost** — a preset row with builder-sized limits must exist before
  the first wave, or waved briefs are quietly more constrained than serial ones.
- **Cost of reversal** — **low.** Everything durable (paths, branches, pinned
  base, drift check, reaping) is the orchestrator's; only the spawn line changes.

### Option C — orchestrator makes the worktree; the brief stays in-session and steps into it

- **How it works here** — same `git worktree add`, but the path must be
  `.claude/worktrees/<mission>-<Sn>` and the brief's first instruction is to call
  `EnterWorktree` on it. `.claude/worktrees/` is forced by the platform: a path
  outside it "prompts for your approval before entering, since it **moves the
  session's working directory and write access** to that location", and no
  permission rule suppresses the prompt (**facts** P6, P12) — fatal for automatic
  waves. Once inside, the platform's four isolation checks apply (**fact** P5).
  Briefs carrying `runtime: codex` / `claude-p` take Option B's `--cwd` path
  regardless.
- **Tradeoffs** — it would keep one builder machinery per runtime, so AC-15 would
  measure the arrangement and not the runner, and keep Opus in-session builders
  (LA-5) with no preset work. **But a measured fact blocks it: no builder role
  lists `EnterWorktree`** — every implementer allowlist is `Read, Write, Edit,
  Bash, Grep, Glob` (**fact** R17), and `tools:` lists are allowlists (**fact**
  P12). Enabling C means adding a session-moving tool to eight role files, which
  grants it in every project and in every serial mission too — the same
  global-behaviour objection that disqualifies Option A. The tool also vanishes
  under `permissions.blockWritesOutsideWorkingDirectories` (**fact** P7), and the
  first step stays discipline-guarded: a builder that never calls `EnterWorktree`
  edits the main checkout and nothing refuses it.
- **Operational cost** — eight role-file edits, plus a pre-flight probe per wave
  (does this builder have `EnterWorktree`?) with a fail-closed fallback to
  serial, plus a doctor row so the absence is visible before a mission rather
  than during one.
- **Cost of reversal** — low for the orchestration step (symmetric with B), but
  the role-file grants are the sticky part: a tool added to an allowlist to
  enable waves stays granted for every non-wave spawn until someone removes it.

## Recommendation

**Option B — the orchestrator creates one worktree per brief under
`.worktrees/<mission>-<Sn>` from the pinned phase-tip SHA, and every waved brief
is spawned through the existing adapter with `--cwd <that path>`.**

Rationale, in the order the evidence lands.

1. **Option A is disqualified on facts, not preference.** It cannot branch a
   brief from the phase tip without a project-wide settings change (**facts** P1,
   P2), cannot name the branch the ledger must record (**fact** P3), and cannot
   cover a `runtime: codex` brief at all (**fact** R1).
2. **Option C is blocked today.** No builder role can call `EnterWorktree`
   (**fact** R17) and `tools:` lists are allowlists (**fact** P12), so C is not
   "pick C" — it is "pick C plus grant a session-moving tool to eight roles in
   every project, including serial missions". That is the same global-behaviour
   cost that killed A, paid for a mechanism whose first step is still discipline.
3. **B's confinement is the only prevention this repo has already witnessed**:
   `--restricted` confines **file** tools to `--cwd`, with the denial recorded in
   the runner's own header (**fact** R2), so an `Edit`/`Write` outside the
   worktree is refused at the tool boundary rather than detected at integration.
   State the limit plainly: **Bash is not path-confined** — the adapter
   allowlists it by command prefix (and refuses a bare `Bash` entry) and passes
   no sandbox flag (**fact** R22), so a Bash-driven write into the main checkout
   is caught by D1's third read, not prevented. That is strictly better than A
   and C, where the platform refuses git redirects but explicitly does not track
   what a shell command writes (**fact** P5) — and it is not total under any
   option.
4. **B is uniform across runtimes.** Both adapters already require `--cwd` and
   already derive `changed_paths` from the tree there (**fact** R1), so one
   mechanism covers `claude -p` and `codex` and needs no second code path when
   Codex parity returns (issue 122).

**Strongest case against:** B makes the waved builder a different kind of builder
from the serial one — a headless `claude -p` child with a preset's limits, hooks
silenced inside it (**fact** R10), no mid-brief course correction, and a runner
the repo has proven for **record** roles only (**fact** R20). Two consequences the
brief must carry rather than discover:

- **A builder preset row is a prerequisite, not a detail.** `DEFAULTS` are
  record-sized (`maxTurns 24`, `readBudget 500`); a waved brief needs its own row
  with builder model/turn/read limits, proven on one real brief before the first
  wave.
- **The budget fallback currently escapes the worktree.** A `claude-p` brief
  blocked with `budget:` is re-spawned once "on its preset row's `fallback` **via
  the Agent tool**" (**fact**, `commands/mission.md:174–176`) — and an Agent-tool
  spawn takes no `--cwd`, so under B that corrective retry would run in the
  orchestrator's checkout and write the brief's files into the main tree. The
  rule must become: a waved brief's budget fallback is re-spawned **through the
  same adapter with the same `--cwd`**; if its fallback row is not an adapter
  row, the brief leaves the wave and runs serially after the wave integrates.
- **AC-15 must control for the runner.** Measure the serial baseline through the
  **same adapter** (serial `--cwd` main checkout), so the stated speedup is the
  arrangement and not the spawn path. Otherwise the number the feature is judged
  on mixes two variables.

Note for the owner: **A versus (B or C) is the expensive decision; B versus C is
cheap to flip** — one orchestration step, no change to branch names, bases, drift
checks or reaping. If `EnterWorktree` ever lands in the builder allowlists for
another reason, revisit C for the cleaner measurement.

**Who creates, who reaps, who commits — decided either way.**
- **Creates:** the orchestrator, before the wave spawns, one `git worktree add`
  per brief from the pinned phase-tip SHA, then the D5 prep recipe.
- **Reaps:** the orchestrator, after the brief's branch is merged and the drift
  check is green — and because a reap can be missed, worktree + branch cleanup
  lands as a `(…, post-merge)` Closing row, which is already the template's
  seeded shape (**fact**, `agents/planner.md:89–91`).
- **Commits:** the orchestrator, never the brief — `AGENTS.md` forbids spawned
  agents from committing, and this is already the rule for runs the orchestrator
  did not drive (**fact** R4). It stages the matcher-filtered declared set (D1)
  and commits with `git -C <worktree>` from the main checkout. Under Option B
  this is unobstructed (the brief ran in a separate process); under A or C it
  still holds, because the blocked direction is a redirect *into* the main
  checkout **from** an isolated session (**inference** from **fact** P5).
- **Housekeeping the brief must include:** a targeted gitignore entry for the
  brief-worktree root. `.worktrees/` is untracked and un-ignored today (**fact**
  R11) and the platform docs recommend ignoring the worktree directory; §5
  already permits targeted sub-ignores for junk while `.plans/` stays tracked.
  Without it, a `git add -A` anywhere near the main checkout can stage another
  brief's entire tree.

**Values this decision settles:**
- Brief worktree path: `.worktrees/<mission>-<Sn>` — a sibling of the existing
  `.worktrees/<mission>` convention (**fact** R11), not a second home. Under
  Option B nothing forces `.claude/worktrees/`, because no `EnterWorktree` call
  is involved.
- Brief branch name: `mission/<mission>-p<N>-<Sn>`, created from the recorded
  phase-tip SHA.
- Entry mechanism: `--cwd <worktree>` for every waved brief, every runtime.
- Prerequisite: a builder preset row, proven on one real brief.
- Reap owner: orchestrator, with a post-merge Closing row as the backstop.
- Commit owner: orchestrator, staging only the matcher-filtered declared set (D1).

**What would change the answer.** Three triggers. (1) A per-call `isolation`
parameter that accepts a base ref **and** a branch name would remove A's two
disqualifiers — re-read the docs then. (2) `EnterWorktree` appearing in the
builder allowlists for an unrelated reason makes C free, and C measures AC-15
more cleanly. (3) If a waved brief repeatedly hits the preset's turn/read limits
where a serial in-session builder would not, that is evidence the child-process
path is the wrong shape for builders and C (or an Agent-tool call-level
`isolation`) should be re-examined.

---

# D3 — Issue-44 absorption boundary

## The question

How much of issue 44 ("one working copy per mission", ledger picked by branch,
`Sessions used:` derived from rows, per-worktree scratch database, staging
migration serialisation) must this feature carry?

**What it constrains downstream:** the mission's size, and which hooks it has to
touch. Issue 44's helper changes `active-ledger.sh`, which five hooks share
(**fact** R6) — the highest-blast-radius file in the repo after
`templates/WORKFLOW.md`.

## First, test the premise

The brief says a hand-incremented `Sessions used:` "cannot survive parallel
briefs". **That premise is false under this feature's own AC-9.** Briefs never
write the ledger (part 4: orchestrator-only hot files); the orchestrator is the
sole writer and it writes in the main checkout, serially, before the wave spawns
— `ledger.mjs sessions +3` already accepts any N with no tool change (**fact**
R5). Issue 44's "two writers → conflicts" is about two **missions or two
drivers**, which is explicitly out of v1. So a derived counter is **not** a
correctness prerequisite here.

The second worry is real but smaller than it looks. In a linked worktree every
ledger file carries the same checkout mtime (**measured**, R7), so
`active_ledger`'s newest-mtime walk has no meaningful order there and ties break
by name. But of the five consumers (**fact** R8), only `PreToolUse/Bash` can fire
inside a builder's context at all — `UserPromptSubmit`, `Stop` and `SessionStart`
belong to the main session (**inference**, from the hook event model; subagent
stops raise `SubagentStop`, which the plugin does not bind) — and that one
consumer **always exits 0 and never blocks** (**fact** R9). Under the adapters it
is silenced outright (**fact** R10). So the worst case in a brief's worktree is
one advisory echo naming the wrong mission, or silence. **Cosmetic, not
load-bearing.**

## Options

### Option A — absorb only what per-brief waves strictly need

- **How it works here** — carry exactly two things: (i) the orchestrator-only
  hot-file rule and sole-writer discipline (already parts 4 and 9 of the
  feature); (ii) the targeted gitignore for the brief-worktree root (D2). That is
  the whole correctness set. Nothing else in issue 44 is load-bearing for
  per-brief waves, per the premise test above — and under D2's recommended
  Option B the mtime concern disappears entirely rather than being mitigated,
  because every waved brief is an adapter child that sets
  `AGENTIC_WORKFLOW_CHILD=1` and therefore **fires no plugin hook at all**
  (**fact** R10). No hook runs in a brief worktree, so no hook can read the wrong
  ledger there. The per-brief prep recipe (D5) is written so issue 44 can reuse
  it verbatim at mission scope.
- **Tradeoffs** — smallest mission that satisfies AC-1..AC-18, and it leaves
  issue 44 a coherent remit rather than a hollowed-out one. Against it: the repo
  rule is that what a mission leaves out is not revisited, so anything deferred
  here depends on issue 44 actually shipping.
- **Operational cost** — none beyond the feature itself: no hook lib touched, no
  change to the budget hook contract.
- **Cost of reversal** — low: nothing in A has to be unbuilt for issue 44 to
  proceed; issue 44 inherits the prep recipe instead of competing with it.

### Option B — absorb issue 44 whole and close it

- **How it works here** — mission worktrees with bring-to-life, ledger-by-branch
  across all five consumers, derived `Sessions used:`, per-worktree scratch
  database on the Tailscale Postgres, staging migration serialisation, and the
  free-dev-port step — on top of the seven parts already in scope.
- **Tradeoffs** — one approval, one review, one closed issue, and the per-brief
  and per-mission worktree stories become one story instead of two. Against it:
  it roughly doubles the mission and moves its centre of gravity from "compute
  waves" to "rewrite the hook ledger contract"; the scratch-database and
  migration-serialisation halves are infrastructure this markdown repo cannot
  verify at all (no datastore — **fact**, §10 `Datastore seed/reset: none`), so
  they would ship as unexercised prose, which is the exact failure the brief
  indicts in its Problem table.
- **Operational cost** — high and ongoing: every future hook change must respect
  a ledger-selection contract that no test in this repo can exercise end to end.
- **Cost of reversal** — high. A changed `active_ledger` contract is depended on
  by five hooks and the Missions app's expectations; unwinding it later is a
  protocol change, not a refactor.

### Option C — ship issue 44 first, build per-brief waves on top

- **How it works here** — issue 44 lands mission worktrees, ledger-by-branch and
  the derived counter; this feature then adds only write sets, the wave tool, the
  drift check and the profile row.
- **Tradeoffs** — cleanest layering and the smallest wave mission of the three.
  Against it: the owner's locked "include working-copy preparation" is 44's
  bring-to-life step, so C means waves wait on a mission nobody has scheduled —
  and this feature is itself "planned and parked", so the queue would now hold
  two parked items with a hard order between them. It also spends the derived
  counter and the branch-aware ledger on a premise this memo just showed to be
  false.
- **Operational cost** — zero now, deferred later.
- **Cost of reversal** — low mechanically, but the sequencing promise is the
  thing that rots: if 44 slips, waves slip with it.

## What breaks if issue 44 never ships

| Capability | Under A | Under B | Under C |
|---|---|---|---|
| Two missions in parallel | stays out (already NOT in v1) | shipped | shipped |
| Hooks inside a brief's worktree | silent — adapter children fire no plugin hook (**fact** R10), so the mtime picker is never consulted there | correct (and the picker is fixed for the main session too) | correct |
| `Sessions used:` honesty | correct — the orchestrator is the sole writer | correct + derived cross-check | correct |
| Per-worktree scratch database | per **brief** only, from the D5 recipe | per brief and per mission | per brief and per mission |
| Staging migration serialisation | absent — a venture running waves that touch migrations must keep them in one brief | present | present |
| Remote/SSH waves (issue 53) | unaffected either way | unaffected | unaffected |

## Recommendation

**Option A — the hot-file rule, the sole-writer discipline and the gitignore
entry; nothing else from issue 44, and no hook lib touched.**

Rationale. The load-bearing claim that pushed toward absorbing 44 does not
survive inspection: with the orchestrator as sole ledger writer the counter is
safe (**fact** R5 + AC-9), the mtime picker cannot block anything even if it is
consulted (**facts** R7–R9), and under D2's recommended Option B it is never
consulted in a brief worktree at all, because adapter children fire no plugin
hook (**fact** R10). So the honest absorption is **zero** lines of issue 44 —
which is also the cheapest thing to be right about. Everything genuinely
expensive in 44 (scratch databases,
migration serialisation, mission-level worktrees) is either unverifiable in this
repo or belongs to the cross-mission remit the brief already placed out of scope.

**Strongest case against:** issue 44 is open, unscheduled, and tagged
`epic/concurrency` alongside issue 53. If it never ships, a venture that wants
waves across briefs that touch migrations has no serialisation and must keep
every migration in one brief — a real constraint that this memo is choosing to
accept silently unless the brief writes it down. It must be written down, in the
NOT-in-v1 table, in those words.

**Values this decision settles:**
- The feature does not change `Sessions used:` from hand-incremented to derived.
- **No hook lib is touched.** `active-ledger.sh` and its newest-mtime walk are
  left exactly as they are: under D2-B no hook fires inside a brief worktree
  (**fact** R10), so the walk is only ever evaluated in the orchestrator's
  checkout, where it is already correct. If the owner picks D2 Option A or C
  instead, hooks *do* fire in brief worktrees and the branch-aware tie-break
  comes back into scope as a cosmetic add-on (~20 lines in the one shared
  function, **fact** R6).
- Migration serialisation under waves is a documented v1 limitation: migrations
  belonging to one phase live in one brief.
- The D5 prep recipe is authored so issue 44 reuses it unchanged at mission
  scope.

**What would change the answer.** If the owner schedules issue 44 next anyway,
Option C becomes free and should be taken. If a venture hits a real conflict
between two concurrent briefs' migrations, serialisation stops being deferrable
and 44's migration half gets pulled forward on evidence.

---

# D4 — Accounting under concurrency

## The question

What do `Estimate:`, `Sessions used:` and a loop-mode tick count when three
briefs run at once, so that §5's overrun stop (k ≥ 1.5 × N) keeps measuring
something real?

**What it constrains downstream:** the only automatic stop that protects the
owner from a 44-session mission (§5 LA-1's incident). Get it wrong and waves
either trip the stop spuriously or hide spend from it.

## The correction that sets the arithmetic

Reviews today are **per phase**, not per brief (**fact**,
`templates/mission-sessions.md:53` and §5 "Checkpoints end every phase"). So one
review per wave is not a saving against a per-brief baseline — it is **W reviews
where a phase previously had one**. Since LA-1 counts briefs + checkpoints,
waves change `Estimate:` itself: a 5-brief phase at cap 3 becomes 5 briefs + 2
wave reviews = 7, against 5 + 1 = 6 serial. A single-wave phase is unchanged
(briefs + 1), because the last wave's review **is** the phase checkpoint.

The planner can compute this at plan time: `waves.mjs` is deterministic (AC-5),
its inputs are the declared sets and the cap, and the cap is recorded in §10
(D5) — so the planner runs the same tool the orchestrator will run and records
the wave plan in the sessions file, which also makes the run auditable against
the plan.

**First, define "wave" so AC-8 stays true: a wave is two or more briefs built
concurrently.** A lone brief is not a one-brief wave — it is a serial brief, and
serial briefs end at the phase checkpoint exactly as they do today. Without that
definition, a phase whose briefs all overlap decomposes into five "waves" and
AC-8's "exactly one reviewer per wave" would charge five reviews where today the
phase charges one: a cost increase with no concurrency to pay for it. With it,
AC-8 is unchanged and the count is computable at plan time:

> reviews in a phase = (number of waves) + (1 if any brief in the phase ran
> serially after the last wave), floored at 1. The final review of a phase **is**
> its checkpoint; serial briefs accumulate into it.

Worked: 5 overlapping briefs (no wave at all) → 1 review, identical to today · 5
briefs at cap 3 (waves 3+2) → 2 · a wave of 3 then two serial briefs → 2. This
also removes the incentive to split a phase to buy reviews.

## Options

### Option A — a session stays one brief (count cost, not time)

- **How it works here** — `Estimate: briefs + reviews`, with reviews counted by
  the rule above (one per wave, plus the phase checkpoint when serial briefs
  follow the last wave, floored at 1). `Sessions used:` is
  incremented write-ahead by the **number of briefs in the wave**, in one ledger
  write before the first spawn (`ledger.mjs sessions +3`, **fact** R5). A
  corrective still counts when it fires. The hook keeps parsing two integers and
  needs no change (**fact**, `hooks/lib/mission-budget.sh:73–76`).
- **Tradeoffs** — the counter keeps meaning exactly what it means in all 22
  existing ledgers, so the 1.5× line stays comparable across missions and the
  incident it was built from stays detectable. It does not record the wall-clock
  win — AC-15 does that, once, as a measurement.
- **Operational cost** — zero new machinery.
- **Cost of reversal** — low; it is the status quo plus an explicit +N rule.

### Option B — a session becomes a wave

- **How it works here** — `Estimate:` counts waves + reviews; `Sessions used:`
  increments once per wave.
- **Tradeoffs** — reads naturally for a loop driver ("one tick, one unit"), and
  makes `Sessions used:` track ticks. But a 3-brief wave that burns three
  builders' tokens counts as 1, so the stop stops measuring spend — exactly the
  thing the overrun rule exists to catch — and the number means something
  different depending on whether a mission waved, so no two ledgers compare.
- **Operational cost** — low to build, high to interpret.
- **Cost of reversal** — high: every ledger written under it is incomparable with
  every ledger written before or after.

### Option C — two counters (cost and ticks)

- **How it works here** — `Sessions used:` as in A, plus a new `Wave ticks:`
  line, with the overrun stop on the first and the tick budget on the second.
- **Tradeoffs** — most informative; also a new header line to lint, parse, keep
  in agreement and teach the Missions profile parser, to buy reporting that
  AC-15's one-off measurement already covers.
- **Operational cost** — one more field in the lint's budget checks and in
  `ledger.mjs`.
- **Cost of reversal** — moderate: removing a header line later means touching
  every ledger that has one.

## Recommendation

**Option A — a session stays one brief; `Sessions used:` += the wave's brief
count, written once before the first spawn.**

Rationale. The overrun stop exists to catch cost blowups, not slow phases
(**fact**, §5 LA-1's incident: 18 planned, ~44 run). Counting briefs keeps it
measuring spend, keeps every existing ledger comparable, and needs no tool or
hook change (**facts** R5, mission-budget.sh). `Reviewer runs:` already exists
and is "bumped at every one-shot reviewer spawn, **plan-judge included**"
(**fact** R5), so the extra review cost waves introduce is instrumented without a
new field. Note what it is and is not: because it also counts plan-judge and
correctives, it is an **upper-bound cross-check** on AC-8 (`Reviewer runs:` −
plan-judge spawns ≥ waves + phase checkpoints), never an equality. AC-8's actual
evidence is the per-wave ledger entry naming the reviewed range.

**Strongest case against:** under A a loop tick no longer corresponds to one
increment, so a watcher reading `Sessions used:` cannot tell how many ticks ran.
That is a real loss of a diagnostic, and Option C buys it back for the price of
one header line. If the owner expects to run waves mostly unattended, C is
defensible.

### The rest of D4, decided

**The overrun stop is evaluated on post-spawn k, and the wave is truncated.**
Compose the wave, then admit briefs one at a time while `k + admitted < 1.5 × N`;
if `k ≥ 1.5 × N` already, admit none and take the owner the scope decision. This
closes the hole where a 3-wide wave jumps the line in one step and only reports
it afterwards — fail-closed by shape, since the admission test is what builds the
wave rather than something checked after it.

**A loop-mode tick becomes: one wave + its one review + ≤1 corrective per failed
brief — or, when nothing waves, one brief + its gate + ≤1 corrective, exactly as
today.** The tick definition has two arms because a phase can have both; the
owner's locked mid-wave rule supplies the corrective shape for the wave arm (keep
the passing briefs, retry the failed one once). `Tick tokens:` is the Σ of the wave's
children, which cannot be known until they return — so the budget is checked
**before** the wave (no brief starts if the remaining tick headroom is below one
brief's share) and again after, and a wave that overshoots its tick budget writes
one Deviations line. For v1 the accepted residue is an overshoot of up to
`cap − 1` briefs' worth within a single tick, stated in §5 rather than engineered
away.

**The mission-budget hook's tick heuristic becomes more lenient — leave it,
record it.** It derives 🛑 MISSION BUDGET from `M ≥ N × ceil(Estimate / 2)`
because "a tick = brief + gate + ≤1 corrective, so ticks ≈ Estimate / 2"
(**fact**, `hooks/lib/mission-budget.sh:43–44`). Under waves a tick covers up to
`cap` briefs, so real ticks are fewer than `ceil(Estimate / 2)` and the stop
fires later than intended. Recommendation: do not re-derive the heuristic in v1 —
it is a backstop behind the overrun stop, which is exact — but say so in the
comment and in §5 so the slack is known rather than discovered.

**Values this decision settles:**
- `Estimate:` = briefs + reviews, where reviews = (waves with ≥2 briefs) + (1 if
  the last wave is a singleton), floored at 1; the planner records the computed
  wave plan in the sessions file.
- `Sessions used:` += the wave's brief count, one ledger write before the first
  spawn; correctives counted when they fire (unchanged).
- Overrun admission test: admit while `k + admitted < 1.5 × N`.
- Wave = two or more concurrent briefs; a lone brief is serial, not a wave.
- Tick definition, two arms: one wave + its one review + ≤1 corrective per
  failed brief, or (no wave) one brief + its gate + ≤1 corrective.
- `Reviewer runs:` is an upper-bound cross-check on AC-8, not its proof; no new
  counter is added.

**What would change the answer.** If unattended wave runs start tripping the tick
budget mid-wave often enough to matter, the `Tick tokens:` check moves from
"before/after the wave" to a per-brief projection, which needs a measured median
brief cost — the trigger is three recorded overshoots. If ledgers start being
read mainly by the Missions app rather than by humans, Option C's second counter
gets cheap and should be revisited.

---

# D5 — Profile surface

## The question

Three coupled shapes in §10: the row that records standing consent and the
concurrency cap; where the orchestrator-only hot-file list lives and is enforced;
and where a project records how to prepare a fresh working copy.

**What it constrains downstream:** whether a wave can ever run on unrecorded
consent (AC-2), whether a brief can be refused *before* it writes a ledger
(AC-11), and whether waves are usable by a venture with a database (the owner's
"include it" lock) rather than only by this markdown repo.

## Part 1 — the consent and cap row

### Options

- **Option A — one row, `Wave policy`, with the cap in the delegation
  parenthetical.** Cell grammar: `serial (default, fail-closed — no wave consent
  recorded; §5)` or `waves-allowed (cap <N>, delegated YYYY-MM-DD)`. This is
  byte-for-byte the pattern the two existing authority rows already use (**fact**,
  §10: `Merge policy | agent-may-merge (records-only, delegated 2026-10-07)`,
  `Publish policy | human-only (default, fail-closed …)`). One row, one parse,
  one thing for `doctor` to read. The first column must be **bold** — the
  Missions app's profile parser keys on bold cells (**fact**, §10.2 preamble).
- **Option B — two rows (`Wave policy` + `Concurrency cap`).** More explicit; two
  parses, two things to disagree, and a cap row with no policy row is a state the
  grammar should not be able to express.
- **Option C — a §10.2 ceremony row.** Ceremony cells are
  `required|optional|skipped` for gates and artifacts (**fact**, §10.2) — consent
  plus an integer does not fit, and §10.2 is derived by `ceremony.mjs` from the
  §0/§5 fences, so a hand-written row there would be overwritten.

### Recommendation

**Option A.** It reuses a pattern the owner already reads fluently, fails closed
on absence by the same mechanism as Publish policy, and carries the delegation
date so the consent is auditable.

Two fail-closed details that matter more than the row name:

1. **`cap 3` is the cap once consent exists, not a consent default.**
   `/bootstrap` and `/adopt` write the **serial** cell (AC-2); turning waves on
   is an owner action that writes `waves-allowed (cap 3, delegated <date>)`. No
   command may write an "on" row nobody approved.
2. **A malformed cell is serial, not 3.** `waves-allowed` with no parsable
   `cap <int>` is refused with a plain reason and the mission runs serially —
   the default lives in the command that writes the row, never in the parser that
   reads it. `cap 1` is a legal, explicit serial.

**Strongest case against Option A:** one cell carrying two different kinds of
value (an authority and a number) is exactly where a parser gets sloppy — the
Merge policy row already proves it, since its parenthetical carries both a scope
(`records-only`) and a date and needs a hook to interpret it. Two rows (Option B)
would make the cap impossible to mis-parse. The answer is the fail-closed reading
above: an unparsable cap is serial, so a sloppy parse costs parallelism rather
than safety.

**Cost of reversal (all three):** low. A row is markdown; splitting Option A into
Option B's two rows later is a `/sync` edit plus one parser change, and no
artifact built on it (worktrees, branches, ledgers) encodes the row's shape.
Option C is the exception and is the one to avoid: a hand-written row inside the
derived §10.2 table would be overwritten by `ceremony.mjs`, so the reversal is
silent data loss rather than an edit.

## Part 2 — the orchestrator-only hot files

### Options

- **Option A — a new §10 row listing them.** Project-extensible; one more row to
  keep in sync, and a venture that edits it can hand itself a foot-gun.
- **Option B — derive them from the existing `High-impact files` row.**
  Disqualified by this repo's own data: that row is
  `templates/WORKFLOW.md, hooks/hooks.json, tools/lint.mjs, agents/*, commands/*`
  (**fact** R12) — precisely the files this feature's own briefs must write
  (AC-18). Deriving hot files from it would refuse every plugin brief. The two
  rows mean opposite things: one says "remind me", the other says "nobody may
  touch this".
- **Option C — a fixed protocol-level set, no row.** The set is the plan trio and
  the obligations register: `.plans/<mission>.md`, `.plans/<mission>.sessions.md`,
  `.plans/<mission>.state.md`, `.plans/OBLIGATIONS.md`. No parse, no per-project
  drift, nothing a project can weaken.

### Recommendation

**Option C — fixed, protocol-level, enforced at three points** (plus one cheap
fourth):

1. **Statically, in the lint:** a brief may not *declare* a hot path (AC-11's
   static half, and the shipped validator home from D1).
2. **In the wave tool:** a brief whose declared set intersects the hot set is
   excluded with a plain reason naming the file and its owner (AC-5, AC-11).
3. **In the drift check:** a hot path in the actual diff **blocks** integration
   (AC-11's dynamic half) — this is the one that catches a brief that never
   declared it.
4. **Cheap and worth including:** a `PreToolUse/Bash` guard refusing a commit of
   `.plans/` from inside a brief worktree. The repo already ships two guards of
   exactly this shape (`merge-guard.sh`, `publish-guard.sh`), so it is a
   known-good pattern rather than new machinery, and it makes the violation
   unrepresentable instead of detected.

**Strongest case against:** a venture with a genuinely shared derived file (an
`openapi.json`, a generated schema) cannot reserve it and must instead give it to
exactly one brief per phase — which works, but is a discipline the fixed set
cannot enforce. If that recurs, Option A's row gets added **additively** (the
fixed set is the floor, the row can only extend it, never shrink it).

**Cost of reversal:** Option C is the cheapest to leave — the set lives in one
constant plus one §5 paragraph, and widening it later is additive by
construction. Option A is moderate: once projects have edited their row, the
fixed floor can no longer be tightened without auditing every venture's cell.
Option B is the expensive one to leave, because `High-impact files` would have
acquired a second meaning (reminder **and** refusal) that every future reader and
every tool touching that row inherits.

## Part 3 — the working-copy preparation recipe

The owner locked this in ("include it") even though this repo needs none of it, so
the test is how gracefully it degrades to nothing here.

### Options

- **Option A — a new §10 row, `Working copy prep`, with four labelled fields.**
  `install: <cmd | none> · secrets: <file list | none> · datastore: <cmd |
  none> · verify: <cmd | none>`. This repo's cell: `none — markdown plugin,
  nothing to install; no secrets needed in a worktree; no datastore`. Degrades to
  a literal no-op: the orchestrator reads `none`, creates the worktree, and
  spawns.
- **Option B — derive it from existing rows.** `Build`, `Test gate` and
  `Datastore seed/reset` already record adjacent facts (**fact**, §10), but none
  records *which files to copy into a fresh checkout*, and `Datastore
  seed/reset: none` here means "there is no datastore", not "no throwaway
  database is needed" — a different claim. Partial fit, and the ambiguity lands
  on the one step that touches real data.
- **Option C — a tracked script or a `WorktreeCreate` hook.** The platform
  supports replacing worktree creation with a hook (**fact**, `code.claude.com`
  worktrees), and `.worktreeinclude` already copies gitignored files into
  worktrees **Claude Code creates** (**fact** P8). But under D2's recommendation
  the orchestrator creates the worktree with plain `git worktree add`, so
  `.worktreeinclude` does not apply, and a per-project shell script is code this
  markdown repo cannot verify.

### Recommendation

**Option A — the four-field row.** It records exactly the three things the owner
named (install, secrets file, throwaway database) plus a one-command sanity check,
it is one bold-keyed row the Missions parser and `doctor` can read, and `none`
makes it free in this repo. The dependency on D2 is explicit: because the
orchestrator creates the worktree by hand, the `secrets:` field is **load-bearing**
— nothing copies `.env` for us (**fact** P8). If the owner picks D2 Option A
instead, the `secrets:` field collapses into a `.worktreeinclude` file and this
row loses a field.

One fail-closed detail: a `datastore:` command that **creates** a throwaway
database must be paired with a teardown, and the teardown is written as a
`(…, post-merge)` Closing row at wave start, not promised in prose — otherwise a
waved mission leaks a scratch database per brief. This mirrors the worktree-reap
obligation from D2 and reuses the register the close gate already enforces
(**fact**, §5 mission close).

**Strongest case against Option A:** in this repo every field reads `none`, so
the row ships **unexercised** — the precise failure the brief's own Problem table
indicts ("every part of the claim is unverified prose"). A four-field recipe that
no mission here can run is a claim about ventures, validated by nobody. Two
mitigations belong in the brief, or Option B's "derive from what already exists"
is the honest pick: the wave tool must *print* the resolved recipe it would run
(so even a `none` cell is observably read, not assumed), and the first venture
adoption of waves must be recorded as the row's live verification — an obligation
row, not a hope.

**Cost of reversal:** Option A is cheap to leave — four labelled fields in one
row; dropping to Option B means deleting a row and reading three others, with no
built artifact depending on it. Option C is the expensive one: once projects ship
a `worktree-prep.sh` (or a `WorktreeCreate` hook), the prep contract is code in N
repositories and the plugin can no longer change the steps' order or inputs
without touching each one.

**Values this decision settles:**
- Row 1: `| **Wave policy** | serial (default, fail-closed — no wave consent
  recorded; §5) |`, turning on to `waves-allowed (cap <N>, delegated YYYY-MM-DD)`.
- Bootstrap/adopt write the serial cell; only an owner action writes
  `waves-allowed`.
- Malformed or capless `waves-allowed` ⇒ serial + a plain reason.
- Hot files: fixed protocol set (plan trio + `OBLIGATIONS.md`), enforced in lint,
  wave tool, drift check, and a commit guard; extensible only additively.
- Row 2: `| **Working copy prep** | install: … · secrets: … · datastore: … ·
  verify: … |`, `none` per field; `none` overall is a no-op.
- Every created scratch database and every created worktree gets a post-merge
  Closing row at wave start.

**What would change the answer.** If a second project needs to reserve files
beyond the plan trio, add the additive hot-file row (trigger: one real request).
If ventures start needing multi-step preparation that does not fit four fields,
the row becomes a pointer to a tracked script and Option C wins (trigger: a
recipe that cannot be written as four commands). If the owner ever wants waves
across SSH executors (issue 53), the cap must become per-host and this row gains
a per-executor form — out of v1 by the brief's own table.

---

# Contradictions in existing protocol text that this feature must reword

Each line is text that is currently true and becomes false (or ambiguous) the
moment waves run. AC-18 already requires one prose home, so these are the
rewordings that home must absorb.

| Where | What it says | Why waves break it | Minimum reword |
|---|---|---|---|
| `templates/WORKFLOW.md:587–589` (§5 hand-off) | "**one driver per mission at a time** — hand off by pushing, never by running the same mission from two places (the budget fields would double-count and the header lines conflict)" | Waves run one orchestrator and up to `cap` builders. The rule's *rationale* still holds (one ledger writer), but its wording reads as forbidding exactly what waves do | Distinguish **driver** (the sole ledger + git writer) from **builders**: "one driver per mission at a time; a driver may run up to the §10 cap of isolated builders, which never write the ledger or git history" |
| `templates/WORKFLOW.md:429–430` (LA-1) | "`Sessions used: k` … incremented **write-ahead** at every brief" | Reads as one increment per event; a 3-brief wave needs +3 in one write before the first spawn | "+1 per brief, written in one ledger commit before the wave's first spawn" (D4) |
| `templates/WORKFLOW.md:464–470` (LA-6) | write-ahead at every merge, gate result and gate **spawn** | A wave spawns three briefs at once: three spawn lines, one commit; and the pinned fork SHA per brief must be written there or D1's drift measurement has no base | Add: a wave writes one ledger entry naming every brief, its branch, and its pinned base SHA, before the first spawn |
| `templates/WORKFLOW.md:599` (loop mode) | "A tick = one brief + its gate + ≤1 corrective" | A wave tick is several briefs and one review; a phase can hold both kinds | "A tick = one wave + its one review + ≤1 corrective per failed brief, or — when nothing waves — one brief + its gate + ≤1 corrective" (D4) |
| `templates/WORKFLOW.md:606–607` (loop mode) | "a crashed tick loses nothing" | Mid-wave work sits uncommitted in per-brief worktrees, which no ledger entry describes until the orchestrator commits | Either commit each brief's declared set as it returns (recommended — it is already D1's staging step) or qualify the claim |
| `templates/WORKFLOW.md:544` + `:402` (§5) | "Checkpoints end every phase"; "one branch per phase, merged at checkpoint" | A waved phase has one review per wave and one branch per brief inside the phase branch | "one branch per phase, plus one branch per brief in a wave, merged into the phase branch in the recorded order; a review ends every wave, and the last wave's review is the phase checkpoint" |
| `commands/mission.md:169–172` (step 3) | "confirm gates are green and **the ledger was updated** (the row marked `[x]` … handoff entry, `Next up:` advanced)" | Reads as the builder having updated the ledger; AC-9 forbids that. Only the orchestrator writes it | "confirm gates are green, then write the row, the handoff entry and `Next up:` yourself" |
| `commands/mission.md:174–176` (budget fallback) | a `claude-p` brief blocked with `budget:` is re-spawned once on its preset row's `fallback` "via the Agent tool — that IS the corrective retry" | An Agent-tool spawn takes no `--cwd`, so under D2-B the retry of a waved brief runs in the orchestrator's checkout and writes the brief's files into the main tree | "…re-spawned once on its fallback **through the same adapter and the same `--cwd`**; a waved brief whose fallback is not an adapter row leaves the wave and runs serially after integration" |
| `commands/mission.md:181–183` (step 4, merge rule) | "if a brief finished well under budget and the next brief is in the same phase, **the same agent may take it**" | Under waves that agent is inside brief 1's worktree with brief 1's write set | Restrict the merge rule to serial phases, or to a next brief whose declared set is a subset of the current worktree's |
| `commands/mission.md:184` | "Parallel-safe phases may run their briefs concurrently (isolated worktrees) — **only with explicit human okay**" | Replaced outright by the §10 row (owner's lock; AC-18 already schedules this line to become a pointer) | Pointer to §5's wave machinery |
| `commands/mission.md:215` | "Each mission checks out its own `<path>/.worktrees/<mission>`" | True of a mission's remote-gate checkout; silent about per-brief worktrees, which D2 puts beside it as `.worktrees/<mission>-<Sn>` | Extend the sentence to name both levels and say who reaps each. (Had D2 Option C won, brief worktrees would have had to live under `.claude/worktrees/` — **fact** P6 — and this row would have been a real clash) |
| `templates/mission-sessions.md:28` | "Mark a phase **parallel-safe** if its sessions touch disjoint files and can run at once" | The mark becomes computed, not asserted (AC-18 already schedules this as a pointer) | Pointer; add the `Writes:` field to the brief field list |
| `agents/planner.md:70` | "mark parallel-safe phases" | Same | Pointer; plus the planner now records the computed wave plan and counts reviews per wave in `Estimate:` (D4) |
| `hooks/lib/mission-budget.sh:43–44` | "a tick = brief + gate + ≤1 corrective, so ticks ≈ `Estimate / 2`" | Under waves a tick covers up to `cap` briefs, so the mission-budget stop fires later than intended | D4 recommends leaving the arithmetic and recording the slack in the comment and in §5 |
| `docs/WORKFLOW.md` §10 `High-impact files` | the row lists `agents/*`, `commands/*`, `templates/WORKFLOW.md` | Not a contradiction, but the reason D5 rejects deriving hot files from it — the two rows mean opposite things and must not be conflated in the text | State in §5 that the hot-file set is fixed and unrelated to `High-impact files` |

**One non-text item that behaves like a contradiction:** `.plans/` is tracked and
"never gitignored" (§5), while `.worktrees/` is untracked and un-ignored
(**fact** R11), so a `git add -A` can stage a sibling brief's whole tree. §5
already permits targeted sub-ignores for junk; the brief should add one for the
brief-worktree root (D2).

**One gap no existing text contradicts, which the owner should see before
approving:** a disjoint **write** set is not order independence. A brief's
`Reads:` may name a file that a sibling in the same wave is rewriting, so both
briefs can keep their promises while one of them builds against a stale version
of the other's file — and the drift check, which only ever compares writes,
reports green. The feature as scoped does not address this, and three responses
are available at very different prices: (a) accept it, and rely on the wave's one
integrated review to catch a stale assumption — the cheapest, and consistent with
"a genuine conflict always stops and asks"; (b) have `waves.mjs` also refuse a
pairing where one brief's `Reads:` intersects another's `Writes:`, which is a
few lines in the same matcher but will visibly shrink waves (in this repo nearly
every brief reads `templates/WORKFLOW.md`); (c) warn only, and name the read/write
pair in the wave's recorded reason so the reviewer knows where to look. **(c) is
the recommendation** — it costs one line of output, keeps waves wide, and puts the
fact in front of the one human-ish gate that can judge it. This is flagged, not
folded in: it is the owner's call whether it enters v1 at all.

---
_The architect consults; the **human decides**. Each pick lands as a dated locked
decision in the master plan pointing at this memo. The `advisor` may argue
against any of them at its gate — this memo is the advisor's input, not its
rival._
