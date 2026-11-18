---
status: frozen
owner-agent: architect
refresh-trigger: never
feature: concurrent-missions
date: 2026-11-19
brief: docs/product/decisions/2026-11-19-concurrent-missions-brief.md
---

# agentic-workflow — Decision memos: concurrent missions (M1–M6)

_Six shape-before-build decisions for the agreed approach in the brief. The
brief's locked choices are **not** re-opened here: the agent merges what the
owner approves; a per-project cap (default 2); the plugin's OWN merge queue is
the default on every repo. Every claim is labelled **fact** (cited) /
**inference** / **assumption**. Facts `P1–P12`, `R1–R23` are reused from
`2026-11-18-parallel-waves-memos.md` (lines 35–86) and not re-derived; the
write-set grammar is that memo's D1 Option B (paths + small glob subset,
conservative overlap). The architect consults; the owner picks._

## New facts these memos stand on

| # | Fact | Source |
|---|---|---|
| F1 | Plugin manifest `hooks` takes "a `.json` file path, an inline hooks object … or an array mixing both", merged with `hooks/hooks.json`. Directories are **not** accepted for `hooks`. Plugin path variables "aren't present in the environment of commands Claude runs through the Bash tool" | `code.claude.com/docs/en/plugins-reference` (fetched 2026-11-19) |
| F2 | "Pull request authors cannot approve their own pull requests." | `docs.github.com/…/approving-a-pull-request-with-required-reviews` |
| F3 | Optional branch-protection settings: "the most recent reviewable push must be approved by someone other than the person who pushed it"; "dismiss stale approvals" — a new push dismisses the approval; approvals "can be dismissed if the merge base introduces new changes" | `docs.github.com/…/about-protected-branches` |
| F4 | Protected branches and "Required pull request reviewers" for **private** repos are listed under GitHub **Team** ("advanced tools … in private repositories"); Free-for-organizations private repos get "a limited feature set"; "repository rules" are listed under Enterprise | `docs.github.com/…/githubs-plans` |
| F5 | A PR review object carries `commit_id` (string or null), `submitted_at`, `user.login` | `docs.github.com/en/rest/pulls/reviews` |
| F6 | A GitHub App installation access token "will expire after 1 hour"; minted by POSTing an app JWT to `/app/installations/<id>/access_tokens` | `docs.github.com/…/generating-an-installation-access-token-for-a-github-app` |
| F7 | GitHub permits machine-user accounts "to automate activity" | `docs.github.com/…/types-of-github-accounts`. **Assumption:** ToS limits (one free machine account per human) and a paid seat on Team orgs — not on that page |
| F8 | GitHub's native merge queue needs Enterprise Cloud on private repos; this public org repo qualifies | brief lines 57–59 (checked 2026-11-18) |
| G1 | The lint check registry is ONE line holding 35 check names | `tools/lint.mjs:1402` |
| G2 | `hooks/hooks.json` is 215 lines, 18 entries across 6 event arrays | `wc`/`grep` 2026-11-19 |
| G3 | The version lives in TWO files — `plugins/agentic-workflow/.claude-plugin/plugin.json:4` and `plugins/agentic-workflow/package.json:3` (both `1.69.1`) — but §10 **Version pin** names only `plugin.json` | `docs/WORKFLOW.md:1040` |
| G4 | `CHANGELOG.md` already carries TWO `## [Unreleased]` headers (lines 7 and 852) — merge residue today | `grep -n` |
| G5 | OB ids are allocated as "the next unused integer" by `nextOb` from the register's lines, so two missions promoting at once allocate the SAME `OB-<n>` — an id collision, not just a text conflict | `plugins/agentic-workflow/tools/ledger.mjs:108–132` |
| G6 | Churn on main since 2026-09-01 (365 commits): CHANGELOG 44 · plugin.json 29 · hook-test.mjs 27 · templates/WORKFLOW.md 25 · docs/WORKFLOW.md 24 · overview.html 22 · lint.mjs 21 · mission.md 20 · JOURNEY.md 14 · hooks.json 13 · OBLIGATIONS.md 13 · package.json 12 · README 11 · lint-test.mjs 10 · session-handoff.md 10 | `git log --name-only` |
| G7 | `tools/hook-test.mjs` is 2589 lines with 276 test-call lines, cases appended in one file | `wc`/`grep` |
| G8 | The merge guard's stated threat model is "accident, not an adversarial agent" | `plugins/agentic-workflow/hooks/hooks.json:89` |
| G9 | `active-ledger.sh` already treats a `Closed:` stamp on the default/staging branch copy as authoritative over a worktree's copy | `hooks/lib/active-ledger.sh:38–60` |
| G10 | The mission-state template seeds a pre-merge Closing row `version bumped + stamped`; settle refuses an unversioned mission close | `templates/mission-state.md:126`; `commands/settle.md:227` |
| G11 | The merge guard parses command TEXT: while drafting this memo, a heredoc whose body merely mentioned the merge command was blocked ("the merge must stand alone…") | observed 2026-11-19 |

---

# M1 — Worktree lifecycle, bring-to-life, and ledger selection

## The question
Where does each mission's worktree live, who creates and reaps it, what shape
does the §10 bring-to-life recipe take, and how does every hook find *its*
mission's ledger? Constrains: every hook (R6, R8), the cap (AC-3), the lander
(M2), ventures' scratch databases, and `/settle`'s reap.

## Options (location — the mutually exclusive choice)

### Option A — `.claude/worktrees/<mission>`, created by the plugin, entered with `EnterWorktree`
- **How it works here** — `/mission <x> run|continue` runs a shipped
  `worktree.mjs up <x>`: `git worktree add .claude/worktrees/<x> -b mission/<x>-p1`
  (reuse if present), then the bring-to-life recipe, then the orchestrator calls
  `EnterWorktree path=.claude/worktrees/<x>`. **Inference:** no approval prompt,
  because P6/P12 prompt only for paths *outside* `.claude/worktrees/`. Once
  entered, P5 blocks writes into the main checkout for the session and every
  subagent — the mission cannot write the owner's checkout, by construction.
  The branch is ours (`mission/<x>-…`), not `worktree-<name>` (P3 covers only
  worktrees Claude creates). The orchestrator needs `EnterWorktree` in
  `commands/mission.md` `allowed-tools`; builders never need it (R17).
- **Tradeoffs** — zero owner clicks; P5 isolation for free. **Risk:** Claude's
  periodic sweep (P4) — **assumption** that it touches only worktrees Claude
  created; unverified for a hand-made one. `.worktreeinclude` (P8) does not
  apply, so env copying is ours either way.
- **Operational cost** — one tool (`worktree.mjs`, zero deps, R14), a
  `.gitignore` line `.claude/worktrees/` written by `/bootstrap`/`/adopt`.
- **Cost of reversal** — low: the path is one constant in `worktree.mjs`.

### Option B — `.worktrees/<mission>` (today's convention)
- **How it works here** — same tool, path `.worktrees/<x>` (already named at
  `commands/mission.md:215`, `templates/WORKFLOW.md:1082`, live today, R11).
- **Tradeoffs** — known, documented. But `EnterWorktree` outside
  `.claude/worktrees/` **asks the owner every time** (fact P6) — one approval
  click per mission session, forever; `.worktrees/` is not gitignored today (R11).
- **Operational cost** — as A, plus a click per session.
- **Cost of reversal** — low.

### Option C — sibling `../<repo>--<mission>` (issue 44's wording)
- **How it works here** — outside the project directory.
- **Tradeoffs** — keeps the repo dir clean, but prompts like B, and the
  worktree tools vanish entirely under `blockWritesOutsideWorkingDirectories`
  (P7); `${CLAUDE_PROJECT_DIR}` points at the original checkout (P10), so any
  hook using it reads the wrong tree.
- **Cost of reversal** — low, but ventures' sandboxes may make it unusable.

## Sub-decision 1b — how hooks pick the ledger (same under A/B/C)

| Option | Mechanism | Verdict |
|---|---|---|
| **Branch (rec.)** | `active-ledger.sh` reads the hook input's `cwd` (P10 — never `${CLAUDE_PROJECT_DIR}`), takes `git -C "$cwd" branch --show-current`, and maps `mission/<name>-*` to `.plans/<name>.state.md` by the **longest existing prefix** (`write-sets-p1` → `write-sets`, not `write`) | Deterministic; zero new state; matches AC-4 literally |
| Worktree marker | `git config --worktree aw.mission <x>` (needs `extensions.worktreeConfig`) or an untracked marker file | Survives odd branch names, but is invisible state a clone loses |
| mtime (today) | newest-touched ledger | Wrong by construction in worktrees: all ledgers share the checkout mtime (fact R7) |

No branch match (main checkout on `main`, or an unrelated branch) → today's
mtime walk, unchanged. Hook-test cases: branch beats mtime; no match → mtime;
two worktrees → two different ledgers.

## Sub-decision 1c — which ledger copy is authoritative

Every worktree carries every `.plans/*` file. Rule (**inference**, extends G9):
**an open mission's ledger is authoritative on its own mission branch only; once
landed, the default branch's copy wins** (already true for `Closed:`). Other
missions' ledgers in your worktree are stale snapshots and are never written.
Make that unrepresentable, not disciplined: a mission's write-set (M5) contains
only `.plans/<own>.*`, and lint fails a `mission/<x>-*` branch whose diff against
its merge-base touches `.plans/<y>.*` for any `y ≠ x`. A reader who needs another
mission's live state reads it from that mission's branch
(`git show mission/<y>-…:.plans/<y>.state.md`), never from its own tree.

## Sub-decision 1d — bring-to-life recipe shape

One new §10 row, declarative, read by `worktree.mjs up|down`:

```
| **Worktree recipe** | install: `pnpm install --frozen-lockfile` · copy: `.env`, `.env.local` · generate: `pnpm prisma generate` · db: scratch via `$SCRATCH_PG_ADMIN_URL` (seed: `pnpm db:seed`; template: none) · port: 3100+ |
```

- `install` / `generate` — commands run in the worktree. (This repo: `none`.)
- `copy` — untracked files copied from the main checkout; secrets never enter
  §10 or git.
- `db` — `worktree.mjs` reads the **admin URL from the main checkout's untracked
  env** (never committed), creates `<repo>_<mission>` (sanitised to `[a-z0-9_]`,
  ≤ 63 bytes — **assumption** from PostgreSQL's NAMEDATALEN−1 identifier limit,
  verify in the brief), runs the venture's migrate-deploy + seed against it
  (default) or `CREATE DATABASE … TEMPLATE <tpl>` (optional; **assumption**: the
  template must have no other open connections), and writes only the per-mission
  `DATABASE_URL` into the worktree's `.env`. Orderly: its Tailscale Postgres host
  — no Neon, no local DB.
- `port` — base + slot index, written to the worktree's `.env` as `PORT`.
- `script:` escape hatch — a venture may name its own up/down script instead.
- `/doctor` warns when two worktrees share a `DATABASE_URL`.

**Who creates / reaps.** `/mission run|continue` → `worktree.mjs up` (idempotent;
re-running heals a half-built worktree). `/settle` → `worktree.mjs down` from the
existing `## Closing` worktree row, only after the merge is deploy-green:
drop the scratch DB (forcing connections closed), `git worktree remove`, delete
the local branch.

**Cap (AC-3)** — derived, never counted by hand: slots held = worktrees in
`git worktree list` whose own-branch ledger is `active` per `active-ledger.sh`;
a parked/blocked/closed mission frees its slot; the refusal names the holders.
**Issue 116** — its `Driver:` lease line stays per mission ("which session drives
this mission now"); the cap is a separate derived count; the two never share a
counter.

## Recommendation
**Option A** (`.claude/worktrees/<mission>`) + ledger by branch + own-branch
authority + the declarative §10 recipe. It is the only location with zero owner
clicks AND platform-enforced isolation (P5) — fail-closed by shape.

**Strongest case against:** P4's sweep is unverified for a worktree we made by
hand; if Claude removes a clean, pushed mission worktree, the mission loses its
`.env` and port (the scratch DB survives by name). Mitigation in the brief: the
first session measures it (create, push, let a sweep pass, check), and `up` is
idempotent so `continue` rebuilds. If the sweep does reap, fall to B (one
constant).

**Values this decision settles:**
- worktree path `.claude/worktrees/<mission>`; branch `mission/<mission>-p<n>`
- scratch DB name `<repo>_<mission>`, sanitised, ≤ 63 bytes; admin URL only in the main checkout's untracked env
- ledger = longest-prefix match of the cwd's branch; mtime only as fallback
- slot = live worktree with an active own-branch ledger

## What would change the answer
- The sweep reaps hand-made worktrees under `.claude/worktrees/` → Option B.
- Issue 53 (remote machines) lands → the lease, not the worktree, becomes the
  slot holder.

---

# M2 — The plugin's merge queue, and the approval signal (security-boundary class)

## The question
Where does queue state live, how is landing order held across separate
orchestrator sessions, who runs the landing step, and — the heart — what
approval signal can the agent *not* produce, and how does the merge guard
change? Constrains: the §10 Merge policy, `hooks/lib/merge-guard.sh`, M3's
landing commit, M5's clash route, and every venture's GitHub setup.

## 2a — Queue mechanics

### Queue state: three locations

| Option | How | Safe under P5? | Conflict-free? | Reversal cost | Verdict |
|---|---|---|---|---|---|
| **A. GitHub is the queue (rec.)** | Queue = open PRs labelled `aw:queue` that carry a valid owner approval (2b); order = the approval's `submitted_at` (F5). The orchestrator adds the label when it opens the PR | yes — no local write | yes — no tracked file | low — delete two labels | Survives crashes, visible to the owner, needs no new store |
| B. Tracked queue file | `.plans/queue.md` on main or a branch | writes need a commit | **no** — a central list two missions append to, exactly what M4 removes | low | Rejected |
| C. Machine-local files | under `$(git rev-parse --git-common-dir)` | **risk** — P5 blocks writes resolving into the main checkout, and the common dir lives under it (**inference**) | yes | low | Invisible, single-machine, possibly blocked |

**Landing lock** (one lander at a time): a remote ref used as compare-and-swap —
push the lock commit to `refs/heads/aw/landing-lock` with `--force-with-lease`
and an empty expected value ("must not exist yet"; **assumption** from the
`git push` docs — the brief's first step verifies it). The lock commit's message
carries holder + start time; a lock older than 30 min may be taken over, logged.
Works under P5, across sessions, and later across machines (issue 53). Released
by deleting the ref.

### Who lands: two options

| Option | How | Failure mode | Reversal cost |
|---|---|---|---|
| Each orchestrator lands its own PR when at the head | simple ownership | **stalls**: if mission A's session is closed, B waits behind A forever | low |
| **First one in drains the queue (rec.)** | whichever orchestrator (or the owner via a `/agentic-workflow:land` entry) takes the lock lands every ready PR in approval order, in a dedicated landing worktree `.claude/worktrees/_land` with its own scratch DB `<repo>__land` | none of the above; still one-shot — it ends when the queue is empty (LA-5 holds: no standing lander) | low — narrow it to "own PR only" |

An orchestrator whose PR is open waits in the background for the approval (a
`ci-wait`-style poll), then runs the landing step.

**Assumption to measure (P5, the lander's own worktree):** an orchestrator
isolated in `.claude/worktrees/<x>` creating and writing `.claude/worktrees/_land`
may itself be blocked by P5 (that path sits under the main checkout). The first
session measures it. Fallback: the lander runs from a non-isolated session at the
main checkout (the owner's `/agentic-workflow:land`, or the orchestrator before it
enters its worktree) — losing P5's protection for the landing step only.

### Venture staging is the first meeting point (not landing)
In the venture flow every phase merges into the shared `staging` branch **before**
its PR opens and before any approval (§5 Staging → verify → PR). So for a venture:
- **The lock covers staging merges too.** The same `aw/landing-lock` is taken for
  every merge into `staging`, in arrival order; issue 44's migration rule rides on
  it (one migration-bearing staging merge at a time).
- **M5 fires first at the staging merge**, with the same tiny/real classes; the
  fix lands on the phase branch, then staging. Landing then usually meets no new
  conflict.
- **Evidence rule (fail closed):** at each staging verify the orchestrator records
  the staging SHA it verified. A PR's staging verify counts as evidence at landing
  only if every commit in that verified staging SHA is either already on the
  default branch or in this PR. If another mission was on staging at verify time
  and has not landed (still queued, or returned), the verify proved "A + B", not
  "B alone": the lander either waits for that mission to land first, or re-verifies
  B alone on a preview/branch deploy (the §5 Lane A escape hatch). This repo has
  no staging, so the rule is inert here.

### The landing step, per PR (in approval order)
1. Fetch; check out the PR head in `_land`. Re-check the approval (2b); call the
   approved SHA `A` (`review.commit_id`, F5).
2. Merge the default branch in — **a merge, never a rebase**, so `A` stays an
   ancestor and the guard can prove "A + main" mechanically.
3. Conflict → M5 (tiny: the orchestrator; else the one-shot builder). A
   non-mechanical resolution voids the approval (2b, "what the approval binds to").
4. Bookkeeping commit (M3): assign the version, fold the changelog fragment —
   Version-pin and changelog paths only.
5. **Combined test** = the §10 gates on `_land`. This repo: `node tools/lint.mjs`
   + the harnesses. A venture: install/generate, migrate-deploy on the `_land`
   scratch DB, the §10 test gates — plus the staging evidence rule below.
6. Push; `node tools/ci-wait.mjs <full-sha>` (LA-8 — only exit 0 is green).
7. The guarded merge, pinned to the pushed head (`--match-head-commit`), `--merge`.
8. Next PR. Release the lock when the queue is empty.

**On failure (AC-9):** the PR loses `aw:queue`, gains `aw:returned` and one PR
comment with the plain reason ("lint: checkFoo failed on the combined tree — the
other mission renamed X"); the lander moves to the next PR. The lander never
writes the other mission's ledger (M1 1c); that mission's orchestrator reads the
label/comment on its next `continue` and records it.

## 2b — The approval signal

### Threat model first (the contradiction this memo must surface)
The guard today defends against **accident, not an adversarial agent** (G8).
AC-10 asks for a signal "the agent itself cannot produce" — an *adversary* bar.
A PreToolUse/Bash hook alone can never meet it: any shell that can read the
owner's token has other routes to a merge (`curl` to the REST API, a script
file; G11 shows the guard reads command text, nothing deeper). So each option is
graded by **where it is enforced** and **which credential forges it — and
whether a shell on the agent's machine can read that credential**.

Today's baseline is worse than "forgeable": the agent opens PRs as the owner,
and GitHub forbids authors approving their own PRs (F2) — an owner review is
**impossible**, not merely fakeable. Any GitHub-review option therefore needs a
separate authoring identity.

| Option | Forging credential | Readable by a shell on the owner's Mac today? | Enforced where |
|---|---|---|---|
| A. Agent identity + owner's GitHub review | owner's GitHub token/session | **yes** (`gh auth token`) — unless the agent host is bot-only | hook + GitHub branch protection (where the plan has it) |
| B. Owner-channel reaction | owner's Slack user session | not via any token the plugin stores | hook only |
| C. Presence-bound signature | FIDO private key **+ physical touch** | no | hook only (the check itself is cryptographic) |

### Option A — Agent identity + the owner's GitHub review, bound to a SHA
- **How it works here** — agents act as a **GitHub App** (`<org>-agents[bot]`):
  it opens, updates and merges PRs; the owner approves with their own account
  in GitHub (web or phone). In agent sessions `GH_TOKEN` is the App's
  installation token (1 h, minted from the App's key by a small helper — F6).
  §10 gains `Approvers: <owner-login>`. Enforced in two places:
  1. **Hook** (new policy value, below) — accident-grade on its own.
  2. **Server**, where the plan has it (F4: public repos; Team/Enterprise for
     private): branch protection on the default branch requiring 1 approving
     review, the App without bypass. Then the App *cannot* merge without the
     owner's review — adversary-grade against the agent identity.
- **Credential reachability** — on the owner's Mac today the owner token is one
  command away, so A is adversary-grade only on an **agent host where only the
  App is logged in** (a separate OS user, or the remote agent host). The guard
  makes the weak configuration fail closed: if the acting identity is in
  `Approvers:`, an approval-based merge BLOCKS — on an owner-logged-in box the
  policy degrades to "owner merges", never to "agent self-approves".
- **Server-side caveat** — do **not** enable "dismiss stale approvals" or "most
  recent push must be approved by someone else" (F3): the lander's
  update-from-main push would void every approval. The hook does the SHA
  binding instead.
- **Server rule vs records-only bookkeeping PRs** — a branch rule requiring one
  approving review also stops the App merging the mission's records-only
  bookkeeping PR. Three ways out, owner's pick (Contradictions C12): (a) the owner
  approves bookkeeping PRs too — one more tap per mission (rec., where the server
  rule is on); (b) post-merge records ride the NEXT feature PR instead of their own
  PR; (c) no server rule — hook-only, accident-grade.
- **How the guard knows who it acts as** — `gh api user`: an App installation
  token cannot call the user endpoint (403 "Resource not accessible by
  integration" — **inference** from GitHub MCP server issue 1610 and community
  reports, verify in the brief); a user token returns its login. So: 403 →
  acting as the App → allowed; a login in `Approvers:` → BLOCK; any other login
  (a machine user) → allowed; any other error → BLOCK.
- **Operational cost** — one App per org (**assumption**: Apps need no paid
  seat, machine users do — F7), installed on each repo, its key on the agent
  host, a token helper. Free-plan private repos (F4) get hook-only enforcement —
  accident-grade, and §10 says so.
- **Cost of reversal** — moderate: uninstall the App, revert the policy value;
  PR history keeps the bot as author.

### Option B — Owner-channel reaction (§12 channel, e.g. Slack)
- **How it works here** — the agent posts "Approve PR #42 at `ab12cd3` —
  <title>?" to the owner channel; the owner reacts ✅; the guard reads the
  reactions with the bot token and requires reacting user id = the §10 owner id
  and the posted SHA = the approved head (binding rule below).
- **Credential reachability** — the bot token reacts only as the bot. The owner's
  Slack session lives in their desktop app (**inference**: reading it would be
  deliberate exfiltration, not accident).
- **Tradeoffs** — no GitHub identity change; works on every GitHub plan. But no
  server-side enforcement (the owner's account still holds merge rights the agent
  can use); every venture needs `/connect slack`; the SHA binding is by message
  text; a second system in the trust path.
- **Cost of reversal** — low.

### Option C — Presence-bound signature
- **How it works here** — the owner signs `repo#N@<sha>` with `ssh-keygen -Y sign`
  using a **touch-required** FIDO key (`ed25519-sk`) and posts it as a PR
  comment; the guard verifies with `ssh-keygen -Y verify` against an
  `allowed_signers` file read from `origin/<default>`.
- **Credential reachability** — not producible by any shell, even on the owner's
  Mac. A plain file key in an unlocked `ssh-agent` is forgeable — the option holds
  only with an `-sk` key.
- **Tradeoffs** — the strongest bar; but a hardware key, a terminal step per
  approval, no phone approvals — the overhead the owner said they do not want.
- **Cost of reversal** — low.

**Rejected:** the owner's typed chat line captured by a `UserPromptSubmit` hook —
the record it writes is agent-writable, and it works only while a session is open.

### What the approval binds to (all options)
The approval names one SHA `A`. The guard accepts merging head `H` only if
**(i)** `H = A`, or **(ii)** `H`'s tree equals `git merge-tree --write-tree
<default-at-landing> A` **except** for the bookkeeping allowlist (Version-pin
files, `CHANGELOG.md`, `changelog.d/**`) — "A plus main, merged by machine, plus
the version". Anything else (a clash fix, a hand edit) voids the approval → the
PR needs a fresh owner approval on the new head, after the reviewer's re-check
(AC-12). This is an owner choice — see Contradictions C2.

### The merge-guard change
A new §10 value, `agent-may-merge (owner-approved, delegated <date>)`, alongside
the existing full delegation, `records-only` (unchanged — bookkeeping PRs keep
it) and the registry's `bookkeeping` value (`templates/WORKFLOW.md:1320`,
untouched). It allows ONLY: everything
records-only already demands (single same-repo numeric merge, head pin equal to
the viewed head, no `-R`/`GH_REPO`/`--auto`, checks green, open PR) **plus** an
APPROVED review by a login in §10 `Approvers:` whose `commit_id` satisfies the
binding rule, **plus** acting identity ∉ `Approvers:`, **plus** the command sets
no `GH_TOKEN=`/`GITHUB_TOKEN=` and is not `gh auth …`. Everything else BLOCKS,
fail closed. The threat-model sentence at `hooks.json:89` changes to name the
grade: "accident-grade alone; adversary-grade only with server-side required
review and an agent identity that cannot approve".

## Recommendation
**2a:** GitHub-as-queue + remote-ref landing lock + "first one in drains the
queue" in a dedicated landing worktree; merge, never rebase; a returned PR never
blocks the rest.

**2b:** **Option A** — a GitHub App as the agents' identity, the owner's GitHub
review bound to a SHA, enforced by the hook everywhere and by branch protection
wherever the plan allows. It is the only option whose signal GitHub itself
checks at merge time; it works from the owner's phone and adds no second system.

**Strongest case against:** on the owner's own Mac, while `gh` is logged in as
the owner, A is accident-grade only — the agent could approve as the owner by
any route other than the guarded command. AC-10's bar is met only on an agent
host without the owner's credential; the guard's identity check makes the weak
configuration fail closed but cannot make it strong. If the owner wants
adversary-grade on the Mac itself, only C delivers it — at a hardware touch per
approval.

**Values this decision settles:**
- labels `aw:queue`, `aw:returned`; order = approval `submitted_at`
- lock ref `refs/heads/aw/landing-lock`, takeover after 30 min
- landing worktree `.claude/worktrees/_land`, DB `<repo>__land`
- update = merge (never rebase); approval binding rule (i)/(ii)
- §10 value `agent-may-merge (owner-approved, delegated <date>)` + an `Approvers:` row

## What would change the answer
- The owner keeps running agents on a box logged in as themselves AND wants
  AC-10 at adversary grade → C.
- A venture on a personal (non-org) repo cannot host an App cleanly → B there.
- More than ~5 PRs/day queue up (measured) → batch landings (test the stack
  once) — the native queue's model.

## Brief requirement (from G11)
The guard parses command text, so any brief that writes protocol text naming the
merge command via a shell heredoc will be blocked; briefs must use the file
tools for those edits, and hook-test must cover the new value's text shapes.

---

# M3 — Bookkeeping fragments

## The question
How do the changelog, the obligations register and the version stop
conflicting: fragment format and directory, who combines and when, and how
`/settle`, `/release`, the chronicler and the lint read them? Constrains M2
step 4, `ledger.mjs` promotion, the OB grammar, and settle's close gate (G10).

## Options

### Option A — Changelog fragments folded at landing; obligations as a permanent folder
- **How it works here** —
  - **Changelog:** each mission writes `changelog.d/<mission>.md`
    (chronicler-owned): first line `bump: minor|patch|major`, then
    Keep-a-Changelog subsections. At landing (M2 step 4) the lander reads the
    default branch's version, applies the bump, writes `## [x.y.z] — <date>` + the
    fragment body at the top of `CHANGELOG.md`, deletes the fragment, and sets the
    version in **every** Version-pin file (G3: `plugin.json` AND `package.json`) —
    one commit, bookkeeping paths only (what M2's binding rule (ii) admits).
    `[Unreleased]` is retired (also removing G4's duplicate header).
  - **Obligations:** `.plans/obligations/<mission>.md`, **never combined**. New
    ids are permanent and mission-scoped, `OB-<mission>-<k>`, so two missions
    can never allocate the same id (fixes G5). `.plans/OBLIGATIONS.md` stays as
    the legacy register (existing `OB-<n>` rows; only fires edit it). `/settle`,
    the obligations-due hook, `check.md` and the lint read `OBLIGATIONS.md` +
    `obligations/*.md`.
- **Tradeoffs** — one moment and one actor for the version; no renumbering, no
  back-reference rewriting. The OB grammar widens (`OB-<n>` | `OB-<slug>-<k>`).
- **Operational cost** — the lander fold (small), `nextOb` scoped per file, lint
  grammar + two invariants: on the default branch `changelog.d/` is empty and all
  Version-pin files equal the newest CHANGELOG heading; on a `mission/*` branch the
  Version-pin files and `CHANGELOG.md` are unchanged vs the merge-base.
- **Cost of reversal** — moderate: scoped ids persist in history.

### Option B — Fragments for both, folded into the single files at landing, integer ids renumbered
- **How it works here** — as A for the changelog; obligation fragments are
  appended to `OBLIGATIONS.md` at landing with fresh `OB-<n>` integers, and the
  lander rewrites every `→ OB-<provisional>` back-reference in the mission's
  ledger.
- **Tradeoffs** — keeps the familiar `OB-23` form and one register file; but the
  lander now edits a mission ledger (contradicts M1 1c), and any id quoted in
  chat or a PR before landing goes stale.
- **Cost of reversal** — low.

### Option C — No fragments: `.gitattributes merge=union` on `CHANGELOG.md` and `OBLIGATIONS.md`
- **How it works here** — git's built-in union driver keeps both sides' lines
  during the lander's local merge (M2 step 2). **Assumption** (gitattributes docs,
  not re-fetched): union keeps both sides' lines without markers; GitHub's own
  mergeability check does not run it, but the lander merges locally first.
- **Tradeoffs** — zero tooling. But union is unsafe on the register: two missions
  firing the same row keep **both** versions of the line; two promotions keep two
  `OB-34`s (G5). It does not solve the version.
- **Cost of reversal** — trivial.

## Recommendation
**Option A.** Ids that cannot collide beat ids repaired later, and it keeps the
lander out of mission ledgers.

**Departure from the agreed wording (owner must confirm — C13):** the brief's
approach item 2 says the changelog AND the obligations are "combined when the
version is set". This pick combines only the changelog; obligations stay a
folder for good. Option B is the literal reading of the brief.

**Strongest case against:** the owner and the memory files speak in integers
("OB-23"); `OB-concurrent-missions-3` is longer, and the register is no longer
one file to scan. Mitigation: `/settle` and the obligations-due hook already
render the list; nobody needs to open the files.

**How each reader changes:**
| Reader | Change |
|---|---|
| chronicler | writes `changelog.d/<mission>.md`, never `CHANGELOG.md` |
| lander (M2) | folds the fragment, sets the version in every pin file, deletes the fragment |
| `/release` (ventures) | reads `CHANGELOG.md` as today — fragments are already folded |
| `/settle` | reads the register + the folder; the `version bumped + stamped` Closing row (G10) becomes `landed as vX.Y.Z`, ticked from the lander's evidence |
| `ledger.mjs promote` | appends to `.plans/obligations/<mission>.md` with `OB-<mission>-<k>` |
| lint | widened OB grammar; the two invariants above |

**Values this decision settles:** directory `changelog.d/`; fragment first line
`bump: <level>`; folder `.plans/obligations/`; id form `OB-<mission>-<k>`; the
version set only by the lander; `[Unreleased]` retired.

## What would change the answer
- A venture whose release is a separate cut (not each landing) → fold at
  `/release` instead for that venture (its §10 Version pin row says which).
- The owner rejects non-integer ids → B.

---

# M4 — Central lists become folders

## The question
Which shared lists in this plugin do two missions both append to, which become
folders of one-file-per-entry, which stay (and at what cost), and what general
pattern do ventures follow?

## Inventory (measured 2026-11-19)
| List | Where | Churn (G6) | Conflict shape | Disposition |
|---|---|---|---|---|
| Changelog `[Unreleased]` | `CHANGELOG.md:7` (and a stray `:852`, G4) | 44 | every mission | **M3** fragments |
| Version | `plugin.json:4`, `package.json:3` (G3) | 29 / 12 | every mission | **M3** set at landing only |
| Obligations register | `.plans/OBLIGATIONS.md` + `nextOb` | 13 | text + **id collision** (G5) | **M3** folder |
| Lint check registry | `tools/lint.mjs:1402` — one line, 35 names (G1) | 21 | any two new checks = guaranteed conflict | **Convert** |
| Hook-test cases | `tools/hook-test.mjs` — 2589 lines, appended (G7) | 27 | appends at the same tail conflict | **Convert** |
| Lint-test cases | `tools/lint-test.mjs` (310 lines) | 10 | same | **Convert** (same pattern, cheap) |
| Hook entries | `hooks/hooks.json` event arrays (G2) | 13 | two hooks on the same event | **Leave** |
| Record pages | `docs/product/JOURNEY.md` (14), `overview.html` (22), `session-handoff.md` (10) | — | every mission's bookkeeping PR | **Leave the files; regenerate at landing** |
| README tables | `plugins/agentic-workflow/README.md` | 11 | adjacent rows | **Leave** |
| Prose (§5, commands) | `templates/WORKFLOW.md`, `commands/mission.md` | 25 / 20 | not a list | M5 overlap check, not a folder |

## Options

**The folder mechanism (used by A and B):** `tools/lint.d/<name>.mjs`, each
exporting a default `check(ctx)`; `lint.mjs` runs its built-ins, then every file
in `lint.d/` in sorted order. Same for `tools/hook-test.d/` and
`tools/lint-test.d/`. Shared helpers are exported from `lint.mjs` (its run guarded
by an `import.meta.url` main check) so a check file imports them. Existing
entries may stay in place; only **new** entries go in the folder — the one-line
array stops being edited. A self-check fails if a folder file exports no `check`
(nothing silently skipped). _Rejected variant:_ self-discovering `check*` exports
in the same file — two missions still append at the same file tail.

### Option A — Every list becomes a folder, hooks included
- **How it works here** — the folder mechanism for lint/hook-test/lint-test, and
  hooks split into per-entry `.json` files listed in `plugin.json`'s `hooks` array
  (F1 — the only way; no directories).
- **Tradeoffs** — no list left to clash; but `plugin.json` (the version's home)
  becomes a new shared list, and splitting hooks touches the merge guard's
  fail-closed wrapper wiring (security-boundary).
- **Cost of reversal** — moderate (hooks re-merged into one file, reviewed at the
  Fable tier).

### Option B — Folders for the test/lint registries; the rest left behind the M5 union (rec.)
- **How it works here** — the folder mechanism for `lint.mjs`'s registry,
  hook-test and lint-test; hooks, records and README stay single files, and their
  pure-addition clashes meet M5's tiny rule at landing.
- **Tradeoffs** — removes the guaranteed conflicts (G1, G7) where churn is high;
  leaves a low-churn list (hooks, 13/365) to an orchestrator merge step.
- **Cost of reversal** — trivial: inline the folder files back.

### Option C — Leave every list; the M5 tiny-clash rule unions them all
- **How it works here** — no restructuring; every pure-addition clash is unioned
  by the orchestrator at landing.
- **Tradeoffs** — zero build cost; every landing pays a merge step, and AC-6
  ("the central lists … are folders") is not met.
- **Cost of reversal** — none (nothing built).

**Why hooks stay (cost stated):** hook files can be split only through the
manifest's `hooks` array (F1 — no directories), which turns `plugin.json` — the
version's home — into a new shared list; a dispatcher per event would rewrite
the merge guard's fail-closed wrapper (security-boundary) for a list touched 13
times in 365 commits. Two missions adding hooks to the same event meet the M5
tiny-clash union (both pure additions to a JSON array; the result must parse and
pass `checkHooks` and hook-test).

**Why records stay:** they are the chronicler's derived pages. The bookkeeping
PR (records-only policy) takes the same landing lock and **regenerates** them
from the default branch after merging it, instead of merging text.

## Recommendation
**Option B** — folders for the lint registry, hook-test and lint-test; hooks,
records and README stay, behind the M5 tiny-clash union.

**Strongest case against:** a folder of check files splits one grep-able
1412-line file into two places; a reader must know to look in `lint.d/`.
Mitigation: lint's own output names the file each check came from.

**The venture pattern (one paragraph for templates):** _a list two missions both
append to becomes a directory of one-file-per-entry, discovered in sorted order
by code written once; a self-check proves every file was picked up. Where the
framework already does this (routes, migrations), use it._ Orderly examples
(**inference**): Nuxt `server/api/` routes and Prisma `migrations/` already are
folders; `schema.prisma` is the central list most likely to clash —
**assumption to verify**: Prisma's multi-file schema folder is GA in the
venture's Prisma version; locale JSON and navigation/menu arrays split per
feature.

**Values this decision settles:** `tools/lint.d/`, `tools/hook-test.d/`,
`tools/lint-test.d/`; discovery = sorted filename; hooks/records/README stay.

## What would change the answer
- `hooks.json` clashes ≥ 2 times in the first 10 concurrent landings → split
  hooks after all.
- A venture's linter/test runner already globs → that venture needs nothing.

---

# M5 — Pre-start overlap check and clash resolution

## The question
How is a new mission's declared file set compared with running missions before
it starts, what does the owner see, what is a "tiny" clash the orchestrator
fixes itself, and what exact brief does the one-shot builder get? AC-2 locks the
owner's choice ("wait, or run and resolve at landing"); the open part is the
comparison basis and the clash rules.

## Options (comparison basis)

| Option | Compares | Gap | Reversal cost |
|---|---|---|---|
| A. Declared only | the new mission's `Writes:` vs each running mission's `Writes:` | misses what a running mission actually touched beyond its declaration | trivial |
| **B. Declared ∪ actual (rec.)** | the new `Writes:` vs each running mission's `Writes:` **∪** its actual changes, `git diff --name-status --no-renames <merge-base>...<its branch>` (three-dot, no renames — R15, R16) | none known; one `git diff` per running mission | trivial — drop the diff term to get A |
| C. Actual at landing only | nothing before start | violates AC-14 | trivial |

The clash rules below are one design (the brief locks the route: orchestrator
for tiny, one builder once otherwise); their reversal cost is low — the tiny
predicate is one function, the builder brief one template.

Rules for B: grammar and the conservative overlap test are parallel-waves D1
Option B (an undecidable pair = overlap). Running missions' `Writes:` are read
**from their own branch** (`git show mission/<y>-…:.plans/<y>.md`), never from
the new mission's stale copy (M1 1c). Excluded from the comparison because they
are disjoint by construction: `.plans/<own>.*`, `changelog.d/<own>.md`,
`.plans/obligations/<own>.md`, and `lint.d/`/`hook-test.d/` files the two declare
under different names. The cap check (AC-3) runs first; overlap only if a slot
is free.

**What the owner sees (plain words):**
> Mission **write-sets** and the running mission **continuous-op** both plan to
> change `tools/lint.mjs` and `commands/mission.md`. Wait until continuous-op
> lands, or start now and let the queue reconcile them at landing?

The answer is a dated locked decision in the new mission's ledger.

## Clash classes (decided mechanically, at M2 step 3)
**Tiny — the orchestrator fixes it, no spawn.** Every conflict hunk satisfies
ALL of: the base side is empty (both sides only **added** lines); the union
(ours then theirs, both kept) parses for its file type (JSON parses; `.mjs`
passes `node --check`; a markdown table keeps its column count); and the combined
tests then pass. Plus any conflict confined to record/bookkeeping paths
(regenerated, M4). Nothing else is tiny — no judgment, no line-count threshold.

**Real — everything else** (both sides changed the same existing lines; a
delete-vs-modify; a tiny candidate whose union fails a test) → one existing
builder, once.

## The one-shot builder's brief (template)
```
Role: <backend | frontend | devops — the role owning the conflicted files>
Task: reconcile PR #<n> (mission <x>) with <default>, which now contains mission <y>.
Worktree: .claude/worktrees/_land — PR head with the merge of origin/<default> in progress.
Merge-base: <sha>. Theirs (<default>): <sha>. Ours (owner-approved): <A>.
Conflicted files, three versions each: <path> → base `git show :1:<path>`, ours `:2:`, theirs `:3:`.
Intent to preserve, verbatim:
  - mission <x>: <master-plan task + ACs touching these files>
  - mission <y>: <same, read from <default>'s .plans/<y>.md>
Writes: exactly the conflicted files, plus test files for them. Nothing else.
Done = no conflict markers · `<combined test command>` green · `git diff --name-only` ⊆ Writes.
Forbidden: behaviour neither mission asked for; deleting or weakening a test to pass.
If the two intents genuinely contradict: stop and return status `blocked` with the
exact contradiction in one paragraph. No retry follows.
Return: status, changed_paths, a one-paragraph rationale per file.
```
After it returns: the reviewer re-checks **only the resolution diff** (the
resolved tree vs the mechanical union), tier by risk class (Fable for a boundary
file — LA-5); then, per M2's binding rule, the owner re-approves the new head.
A `blocked` return or a failed test → the PR is returned (`aw:returned`) with the
contradiction, the queue moves on, the owner is told. "Once" is literal: the
one-corrective-retry rule does not apply (**inference** from the brief's "spawns
one existing builder, once").

## Recommendation
**B** (declared ∪ actual, read from the running mission's own branch) + the
mechanical tiny rule + the template above.

**Strongest case against:** whole-mission write-sets in this repo are broad
(nearly every mission touches `templates/WORKFLOW.md` — G6, R12), so the
pre-start check will warn on almost every pair here and the owner may learn to
click past it. Mitigation: the warning lists the files, and "run and resolve at
landing" is cheap when the tiny rule absorbs most of it — measure the ratio.

**Values this decision settles:** comparison = declared ∪ three-dot actual; tiny
= all hunks pure-addition + parses + tests pass; the builder brief template; the
reviewer re-checks the resolution diff only.

## What would change the answer
- More than half of pre-start warnings end "run anyway" with no real clash at
  landing → narrow the warning to actual overlap for high-churn prose files.
- Tiny-rule unions that pass tests but are later found wrong → narrow "tiny" to
  registries only.

---

# M6 — GitHub's native merge queue as an option

## The question
Support GitHub's native merge queue where it exists (public org repos,
Enterprise Cloud private — F8), or only the plugin's queue in v1?

## Options
### Option A — Plugin queue only in v1 (rec.)
- **How it works here** — M2 everywhere, one code path.
- **Tradeoffs** — this public repo forgoes a server-run queue it could have.
- **Cost of reversal** — low: B can be added later as an adapter; nothing in M2
  forecloses it.

### Option B — Opt-in adapter where available
- **How it works here** — §10 `Merge queue: github`; the lander enqueues the PR
  on a queue-protected branch instead of running steps 2–7.
- **Tradeoffs** — **decisive conflict with M3:** the native queue tests and merges
  the PR as GitHub composes it; there is no step in which the plugin writes the
  landing commit (version + changelog fold). The version would need a post-merge
  commit on the default branch — blocked by the push-block guardrail (§3) — or a
  second PR per landing. **Assumption** (GitHub docs, not re-fetched): CI
  workflows must also trigger on the `merge_group` event. The merge guard blocks
  `--auto` today, so it changes too.
- **Operational cost** — two landing paths to test; Orderly (private, not
  Enterprise) can never use it.
- **Cost of reversal** — moderate.

### Option C — Native by default where available, plugin queue elsewhere
- As B with the default inverted — the same M3 conflict, and it contradicts the
  locked "plugin's queue as the default on every repo".
- **Cost of reversal** — high: ventures on public repos would have their CI
  rewired for `merge_group` and their landing history in two shapes.

## Recommendation
**A.** The native queue cannot host the landing-time bookkeeping commit that
"version set once, at landing" requires, and the repos that matter most (private
ventures) cannot use it.

**Strongest case against:** the native queue runs CI on the combined stack
server-side with no agent tokens spent, and keeps landing while the agent host
is off. At high PR volume that is real money and latency saved.

**Values this decision settles:** no native-queue code path in v1.

## What would change the answer
- The version moves out of the repo (e.g. derived from tags at release) → B
  becomes cheap.
- Measured queue depth above ~5 PRs/day on a public repo → revisit B.

---

# Contradictions — protocol text this feature makes wrong

| # | Text today | File:line | Why it breaks | Owner must resolve? |
|---|---|---|---|---|
| C1 | Guard threat model "accident, not an adversarial agent" | `plugins/agentic-workflow/hooks/hooks.json:89` | AC-10 asks for an unforgeable signal; a hook alone is accident-grade | **Yes** — accept accident-grade while agents share the owner's `gh` login, or require a bot-only agent host (M2) |
| C2 | AC-12: the reviewer re-checks a clash fix "before it lands" | brief lines 103–104 | A clash fix is content the owner never approved; AC-10 says merge ONLY what the owner approved | **Yes** — owner re-approval after a non-mechanical fix (rec.), or reviewer-only |
| C3 | "The human merges that PR (or the agent under a delegated §10 Merge policy)"; "the feature PR stays the human's"; mission.md's "pause for the **human to merge**" | `plugins/agentic-workflow/templates/WORKFLOW.md:522`, `:535`; `docs/WORKFLOW.md:514`, `:527`; `plugins/agentic-workflow/commands/mission.md:266–272` | The owner's choice: the agent merges approved feature PRs | No (locked) — new `owner-approved` value |
| C4 | §10 Merge policy `agent-may-merge (records-only, delegated 2026-10-07)`; the template row's three values; the guard table row | `docs/WORKFLOW.md:1021`; `templates/WORKFLOW.md:1033`; `templates/WORKFLOW.md:268`; `docs/WORKFLOW.md:260` | A new `owner-approved` value + an `Approvers:` row (the registry's `bookkeeping` value, `templates/WORKFLOW.md:1320`, is untouched) | No |
| C5 | "one driver per mission at a time" | `templates/WORKFLOW.md:587`; `docs/WORKFLOW.md:579` | The lander pushes a merge-from-main + bookkeeping commit onto another mission's PR branch — a second writer; that mission must pull before continuing | No — add "the lander is the only other writer, landing step only" |
| C6 | "the newest-touched ledger is the current focus" | `hooks/lib/active-ledger.sh:10–11`; hook table `templates/WORKFLOW.md:274`, `docs/WORKFLOW.md:266` | Ledger by branch (AC-4) | No |
| C7 | `<path>/.worktrees/<mission>` | `commands/mission.md:215`; `templates/WORKFLOW.md:1082` | M1 recommends `.claude/worktrees/<mission>` | No (follows M1) |
| C8 | Closing row `version bumped + stamped` (pre-merge); settle refuses an unversioned close | `templates/mission-state.md:126`; `commands/settle.md:227` | Missions must not bump the version (AC-5) | No — becomes `landed as vX.Y.Z` |
| C9 | §10 Version pin names only `plugin.json` | `docs/WORKFLOW.md:1040` | `package.json:3` also carries the version (G3); the lander must set both | No |
| C10 | `batch` gate policy: HITL merges staging → default once | `templates/WORKFLOW.md:537`; `docs/WORKFLOW.md:529` | Does an owner approval also let the agent merge the batched staging → default PR? | **Yes** — extend `owner-approved` to batch, or keep batch human-merged |
| C11 | OB ids: "`<n>` is the next unused integer" | `.plans/OBLIGATIONS.md:18–22`; `plugins/agentic-workflow/tools/ledger.mjs:108` | Mission-scoped ids (M3) | No (follows M3) |
| C12 | Records-only bookkeeping PRs merged by the agent without an owner review | `templates/WORKFLOW.md:533–536` | A server-side required-review rule (M2 Option A) blocks them too | **Yes** — owner approves bookkeeping PRs too (rec.), records ride the next feature PR, or no server rule |
| C13 | Brief approach item 2: changelog AND obligations "combined when the version is set" | brief lines 42–44 | M3's pick never combines obligations (permanent folder, scoped ids) | **Yes** — accept the departure, or take M3 Option B |
| C14 | Staging → verify → PR: phases merge into `staging` before the PR, unlocked | `templates/WORKFLOW.md:505–522`; `docs/WORKFLOW.md:497–514` | Staging is a shared lane: it needs the landing lock, M5 fires there first, and a staging verify that included an unlanded mission is not evidence for a PR landing alone (M2 "Venture staging") | No — follows M2; the text gains the lock and the evidence rule |

_The architect consults; the **owner decides**. Each pick lands as a dated
locked decision in the mission master plan pointing at this file._
