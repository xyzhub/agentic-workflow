# Journeys + naming IA — xyz-rebrand (2026-10-16)

Companion to `2026-10-16-xyz-rebrand-brief.md`. Personas are the two in the
brief, not invented: **the owner** (installs, merges, reads reports) and **the
agent session** (reads hooks, runs commands). No visual UI; the "screens" are
`/help`, hook output, the README, and the `/xyz:sync` report.

## Naming IA (one term per concept)

| Concept | Name the owner sees | Never |
|---|---|---|
| The product (prose, README, notices) | **The XYZ Protocol** (later: "the protocol") | "Agentic Workflow", "the XYZ plugin" |
| Plugin id / prefix | `xyz` — commands `/xyz:mission`, skills `xyz:protocol`, agents `xyz:reviewer` | `agentic-workflow:` outside history |
| Install id | `xyz@xyz` (plugin `xyz` from marketplace `xyz`) | `agentic-workflow@xyz` except in the move notice |
| `plugin.json` `displayName` | `The XYZ Protocol` | |
| README H1 | `# The XYZ Protocol` then one line: "Claude Code plugin `xyz` — install with `claude plugin install xyz@xyz`." | |
| `/help` rows | `/xyz:<command>  <description>`; descriptions say "the protocol", not the old name | |
| Hook message prefix | Keep the existing severity marker, then `xyz:` — e.g. `❌ xyz: BLOCKED — never push while on main…`, `⚠️ xyz: on main — create a feature branch…` | unprefixed messages |
| Old plugin, final release | Every line it prints starts `agentic-workflow (retired):` | |

The prefix is load-bearing for the error state below: when both plugins are
installed the owner can tell which plugin printed a line. **Architect
implication:** the env guard `AGENTIC_WORKFLOW_CHILD` and any `$TMPDIR` marker
names are identifiers too — rename them (e.g. `XYZ_CHILD`) in the same change,
and put them in the J2 grep, or a child session spawned by new tools will not
be recognised by hooks reading the old name.

## J1 — Fresh install

**Trigger:** owner runs `claude plugin install xyz@xyz` in a clean session.
**Aha-moment:** `/help` shows `/xyz:*` and the first `/xyz:start` works.
1. Install finishes → Claude Code's own success line names `xyz`.
2. `/help` lists 27 `/xyz:*` commands; no `agentic-workflow` row. *Verify:* count + grep of `/help`.
3. First prompt on `main` → `⚠️ xyz: on main — …` prints once. *Verify:* every hook in `hooks.json` fires (harness run).
4. `claude plugin validate` passes.

| State | What the owner sees |
|---|---|
| Nothing to migrate (no `docs/WORKFLOW.md`) | Normal; `/xyz:bootstrap` is the next step. |
| Old plugin also installed | See **E1** below. |
| Offline | Claude Code's marketplace fetch error. Not ours; README "Install" section says "needs network once, to fetch the marketplace". |

## J2 — This repo (dogfood)

**Trigger:** the rebrand mission's build. **Seen by:** agent sessions + reviewer.
1. Rename `plugins/agentic-workflow/` → `plugins/xyz/`; marketplace entry `name: xyz`.
2. Rewrite every live reference (brief's list + the env-guard names above).
3. Run the J2 grep with an explicit allowlist file (history records, the migration code, the old plugin's final release). *Verify:* zero hits outside it; every test suite green.
4. Run `/xyz:sync` on this repo — it is the first J3 run (`.claude/settings.json`, `.codex/rules`, AGENTS.md/CLAUDE.md).

States: same as J3; this repo's `.claude/agents/` is empty, so "tunes: nothing to migrate" is the expected line.

## J3 — Existing adopted project migrates (`/xyz:sync`)

**Trigger:** owner followed the move notice, or `/xyz:check` reports old
references. **Aha-moment:** the next session runs `/xyz:next` with no hand edits.
1. `/xyz:sync` scans: `docs/WORKFLOW.md`, AGENTS.md/CLAUDE.md, **open** `.plans/*.state.md` ledgers (closed ones skipped), `.claude/settings.json` `enabledPlugins`, `.claude/agents/*` tunes, `.codex/rules`.
2. Rewrites `agentic-workflow:` → `xyz:`, `agentic-workflow@xyz` → `xyz@xyz`, old cache paths → new. Leaves the working-tree changes uncommitted for the owner's normal flow.
3. Prints the sync report (below). *Verify:* a re-run reports "already migrated"; the grep returns nothing in live files.

Default justified: sync **rewrites without asking**, because every change is a
plain-text edit in git — forgiveness is `git diff` / `git checkout -- <file>`,
which the report names. No confirmation step.

| State | Behaviour |
|---|---|
| Nothing to migrate | One line: "No old names found — this project already uses The XYZ Protocol names." |
| Already migrated / re-run after an interrupted run | Idempotent: each rewrite is find-and-replace that finds nothing the second time; report lists only what it changed now. |
| Partial (some files done, one failed) | Report the done files, then the failed one with its fix; re-running finishes it. |
| **E1 both plugins enabled** — every hook fires twice | Detect `agentic-workflow@xyz` still `true` in any settings scope. Project scope: sync flips it. User scope (`~/.claude/settings.json`): sync does not touch the owner's global file; it tells the owner the uninstall command. |
| **E2 `settings.json` unparseable** | Never rewrite it. Skip that file, finish the rest, report the parse error line and the exact edit to make. |
| **E3 old plugin still enabled after sync** | Same text as E1; also printed by the old plugin's notice. |
| Offline / no `gh` | No effect: sync is local file edits only and needs neither. The report does not mention them. |

**Sync report — exact text (filled example):**

```
Done: this project now uses The XYZ Protocol names. Review the changes with `git diff`, then commit them as usual.

Changed 9 files (old name `agentic-workflow:` → new name `xyz:`):
- docs/WORKFLOW.md — 41 command mentions
- AGENTS.md, CLAUDE.md — 6 mentions
- .plans/goal-statement.state.md — 3 mentions (open plan file; closed ones are history and were left alone)
- .claude/settings.json — enabled plugin switched from agentic-workflow@xyz to xyz@xyz
- .claude/agents/backend.md — 2 mentions (a tune: your local override of a protocol agent)

One thing for you to do: the old plugin is still turned on for your whole machine, so every reminder prints twice. Run:
  claude plugin uninstall agentic-workflow@xyz
Then start a new session.

To undo any change: git checkout -- <file>
```

E2 line, when it applies: `Skipped .claude/settings.json — it is not valid JSON (line 14: unexpected "}"). Fix that line, then run /xyz:sync again; everything else is done.`

## J4 — Old install sees the move notice

**Trigger:** session start with the final `agentic-workflow` release installed.
1. `SessionStart` (startup) prints the full notice below **once per machine** (marker in the plugin's data dir).
2. Every later session start prints one line until the old plugin is gone: `agentic-workflow (retired): this plugin was renamed. Run: claude plugin uninstall agentic-workflow@xyz && claude plugin install xyz@xyz, then /xyz:sync.`
   *Deviation from the brief's "one-time" — flagged for owner ratification:* a single notice missed during a busy start is lost forever; one line costs little.
3. **Double-firing guard (architect):** if `xyz@xyz` is enabled in any settings scope, every old hook exits silently (only the one-line notice remains). If `xyz` is absent, old hooks keep running — the push-to-main block must not vanish because the owner ignored a notice.

**Move notice — exact text:**

```
agentic-workflow (retired): this plugin is now called The XYZ Protocol, plugin id `xyz`. This version gets no more updates.

Move in three steps (about a minute):
1. claude plugin uninstall agentic-workflow@xyz
2. claude plugin install xyz@xyz
3. In each project that uses it, start a new session and run /xyz:sync — it renames the old command names in that project's files (for example /agentic-workflow:mission becomes /xyz:mission). Your history files are left as they are.

Until you move, everything here keeps working under the old names.
```

States: offline → notice still prints (local); install step 2 then needs
network. `settings.json` unparseable → the guard can't read it, so treat `xyz`
as absent (old hooks keep running; safe direction).
