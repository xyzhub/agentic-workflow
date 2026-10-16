---
status: frozen
owner-agent: architect
refresh-trigger: never
---

# The XYZ Protocol — Decision memos: xyz-rebrand (D1–D6)

_Six shape decisions exposed by `2026-10-16-xyz-rebrand-brief.md`, read with
`2026-10-16-xyz-rebrand-journeys.md`. Labels: **fact** (cited: file:line, grep
count, or Claude Code docs URL) · **inference** · **assumption**. Counts measured
2026-10-16 on `plan/xyz-rebrand` with `git grep` (tracked files only)._

**Scopes used for counting.**
- **Live** = `plugins/` `tools/` `evals/` `README.md` `AGENTS.md` `CLAUDE.md`
  `docs/WORKFLOW.md` `.claude-plugin/` `.codex/` `.github/`.
- **docs/product live** = launch kit, roadmap, north-star, overview, engineering
  docs (anything under `docs/product/` except `decisions/`, `JOURNEY.md`,
  `decision-log.md`).
- **History** = `.plans/`, `CHANGELOG.md`, `docs/product/decisions/`,
  `JOURNEY.md`, `decision-log.md`.

**Platform facts every memo relies on** (Claude Code docs, fetched 2026-10-16).
Local client is `claude` 2.1.301.
- **F1.** The install id is `<entry-name>@<marketplace>`. That id is the key
  written under `enabledPlugins`. The manifest `name` is the prefix on commands
  and skills. The two names must match.
  ([create-marketplace](https://code.claude.com/docs/en/plugin-marketplaces))
- **F2.** One marketplace can list many plugins. Each entry is validated on its
  own. Duplicate names are an error.
  ([marketplace-reference](https://code.claude.com/docs/en/plugins/marketplace-reference))
- **F3.** `git-subdir` plugin sources take `url` (which may be `owner/repo`),
  `path`, `ref` and `sha`. When both `ref` and `sha` are set, `sha` wins. (same
  page)
- **F4.** A top-level `renames` map (`{"old": "new" | null}`) makes Claude Code
  rewrite `enabledPlugins` and `pluginConfigs` keys in the user, project and
  local scopes. It shows `Renamed to "<new>"` once, in `claude plugin list` and
  `/plugin`. For a git-hosted marketplace the plugin then reports `Plugin "<new>"
  not cached` until the user runs `/plugin install <new>@<mkt>` once. A rename
  chain must end at a name listed in `plugins` or at `null`. There is **no
  deprecation state**. The documented substitute is remove + `renames → null`.
  ([host-marketplace](https://code.claude.com/docs/en/plugins/host-marketplace))
- **F5.** Users get a new copy only when the computed version changes, and
  `plugin.json` `version` wins. Auto-update is off by default, so users who don't
  run `/plugin marketplace update` stay on their cached copy. (same page)
- **F6.** `${CLAUDE_PLUGIN_ROOT}` expands to the cache path
  `~/.claude/plugins/cache/<marketplace>/<plugin-name>/<version>`. That path
  comes from the manifest name, not the source directory. Observed directly:
  this session's agent prompt resolves to
  `~/.claude/plugins/cache/xyz/agentic-workflow/1.62.0/…` while the source
  directory is `plugins/agentic-workflow`. (fact for the name segment;
  **inference** that the source-dir name never appears, since every directory is
  named after its plugin today)

---

## D4 — Identifier scope: the inventory (read this first; the others depend on it)

### The question
Which strings carry the old name as an identifier, which are prose, and which
must survive because they name something out of scope (the GitHub repo)? This
sets what the migrator rewrites and what J2's grep allowlists.

### Measured inventory (live scope unless noted)

| # | Category | Pattern | Live occ / files | Rename? | Notes |
|---|---|---|---|---|---|
| 1 | Command/skill/agent prefix | `agentic-workflow:` | **689 / 86** | → `xyz:` | plugin: commands 208, templates 200, README 59, agents 39 (all forms of the id). 30 distinct suffixes, the most frequent being `operate` 51, `tune` 48, `mission` 48, `sync` 44. Includes `subagent_type`/skill refs (`agentic-workflow:reviewer`, `:protocol`). |
| 2 | Plugin dir path | `plugins/agentic-workflow` | **36 / 17** | see D1 | `tools/*-test.mjs` `PLUGIN=` constants (7), `tools/lint.mjs` (≈10, incl. import of `shell-wrappers.mjs`), `evals/run.mjs`, 2 eval `setup.sh`, README, CLAUDE.md, WORKFLOW §10 rows. **`.github/workflows/lint.yml` has 0** (fact). |
| 3 | Manifest + marketplace | `"name": "agentic-workflow"`, `source` | 3 / 2 | → `xyz` | `plugin.json:2`, `marketplace.json:10-11`. |
| 4 | Install id | `agentic-workflow@xyz` | 2 / 2 (+4 in docs/product/launch) | → `xyz@xyz` | README:12, plugin README:318. Consumer `.claude/settings.json` carries it as an `enabledPlugins` key (see D3). |
| 5 | Env vars | `AGENTIC_WORKFLOW_CHILD`, `AGENTIC_WORKFLOW_REGISTRY` | **23 / 12** | → `XYZ_CHILD`, `XYZ_REGISTRY` | CHILD: `hooks.json` (2 commands), 5 hook libs, `run-claude.mjs` (sets it, 3), WORKFLOW §, tests. If the hooks check a name the adapter doesn't set, child `claude -p` sessions fire every hook (the coordinator's point (1)). REGISTRY: `commands/ingest.md`. |
| 6 | Codex rules file | `.codex/rules/agentic-workflow.rules` | **23 / 11** + the file itself + `templates/codex.rules` header | → `.codex/rules/xyz.rules` | `connect`, `bootstrap`, `doctor`, `mission`, `tune` commands. The test `run-codex-test.mjs:268,456-470` asserts the filename. Codex loads every `*.rules` in the dir (**assumption**, not re-verified), so a stale old file keeps working. That is harmless but a duplicate. |
| 7 | Tune banner | `> Tuned from agentic-workflow v` | 11 / 4 | write `xyz`, **read both** | `agents.mjs:50,53,90` regexes (`BANNER_RE`, `PRESET_RE`, strip), `commands/tune.md:56,206`, tests. Consumer tunes in `.claude/agents/` carry the old banner. If the regex only matches the new form, every existing tune becomes "untuned", which is a silent data loss. |
| 8 | Codex skill-prefix gate | `prefix !== 'agentic-workflow'` | 1 (+3 test) | accept both on read | `run-codex.mjs:203`. Anything else is still rejected (fail-closed). |
| 9 | XDG machine state | `~/.config/agentic-workflow/registry`, `~/.local/state/agentic-workflow/<slug>/operate.json` | 6 / 4 | new path + legacy read-fallback | `operate-triage.mjs:11,79`, `operate.md:225`, `ingest.md:38,48`, WORKFLOW. Lives outside any repo, so `/sync` can't fix it. |
| 10 | Lint keyed on the name | `commandMention` regex | 3 lines | → `xyz:` | `lint.mjs:135-153`. Forces the namespaced form, so after the rename it will *enforce* `/xyz:`. That makes it the J2 regression guard for free. |
| 11 | Cache paths in command text | `cache/xyz/agentic-workflow/<ver>` | **0 live in plugin** (1 test literal `hook-test.mjs:1872`, 2 history) | test literal only | Commands use `${CLAUDE_PLUGIN_ROOT}` (92 occ in plugin). The path changes automatically per F6. |
| 12 | `$TMPDIR` markers | `conform-check-$SID`, `handoff-budget-$SID.$BAND`, `obligations-due-$SID` | 3 | **no change needed** | Fact: the names carry **no** plugin name. Side effect, an **inference**: if both plugins' hooks run in one session, these three advisories dedupe on the shared marker. Namespacing them would *break* that dedupe. Leave them. |
| 13 | Merge guard | message text only | 1 (`merge-guard.sh:99`) | → `/xyz:` | No logic is keyed on the name (fact: grep). |
| 14 | Session-start/intake hooks | message text | `hooks.json:20`, `obligations-due.sh:5,125`, `conform.mjs` ×15 fix strings | → `/xyz:` | `hook-test.mjs:1144,1356` assert `/agentic-workflow:settle` and `:sync` in output. |
| 15 | Transcript analytics | `subagent_type` `agentic-workflow:reviewer` | 4 | → `xyz:`, read both | `context-attrib.mjs:597+`. Old transcripts will still say the old name. |
| 16 | **GitHub repo slug — KEEP** | `xyzhub/agentic-workflow` | 8 / 6 | **allowlist** | The repo rename is out of scope (brief). `marketplace add xyzhub/agentic-workflow` stays valid. Also `distillate.schema.json` `$id`, issue links in `codex.rules:79`, `hook-test.mjs:1760,1777`. |
| 17 | Prose "Agentic Workflow" | case-insensitive `agentic workflow` | 51 / 44 | see D5 | `README.md:1`, plugin README:1, `templates/WORKFLOW.md:3`, `AGENTS.md:9`, schema titles. |
| 18 | docs/product live | all forms | 41 occ in ~15 files | rewrite | Launch kit (announcements, landing page, positioning), `roadmap.md`, `north-star.md`, `overview.html`, `engineering/*`. |
| — | **History** | all forms | ≈940 (`.plans/` + CHANGELOG + decisions) | **never** | Repo-wide total: **1,775 occ / 204 files**. 794 / 104 of those are in live scope. |

### Options

**A — Hard rename, everything.** Every row except #16 switches to the new
name, with no read-fallbacks.
- How it works here: one sweep.
- Tradeoffs: it is the cleanest J2 grep. But it breaks rows 7, 9 and 15 on
  existing data: tunes go untuned, operate state is lost, and old transcripts
  no longer attribute.
- Operational cost: zero ongoing.
- Cost of reversal: a re-sweep, but the lost state can't be undone.

**B — Rename identifiers; read-both where data outlives the code (recommended).**
All writes use the new name. Readers also accept the old form on rows 7, 8 and
15. Row 9 reads the new path and falls back to the legacy path, then writes the
new one. Row 5: `run-claude.mjs` sets **both** `XYZ_CHILD=1` and
`AGENTIC_WORKFLOW_CHILD=1`, so an old plugin's hooks left enabled in the same
child session stay silent too. Hooks check only `XYZ_CHILD`.
- Tradeoffs: about 6 small, tested legacy branches. Each one is a read-path
  widening, not an alias.
- Operational cost: about 6 lines of legacy code, which can be deleted later.
- Cost of reversal: low.

**C — Keep internal identifiers; rename only the user-facing ones.** Only
rows 1, 3, 4, 13, 14 and 17 change.
- Tradeoffs: the smallest diff, but it fails J2 as written ("zero live old
  references": env vars, rules file and banner). It also leaves two names inside
  the code forever.
- Cost of reversal: low, but J2 would have to be renegotiated.

### Recommendation
**B.** It meets J2 with a small, explicit allowlist and preserves every byte of
consumer state.
- **Strongest case against:** the legacy read branches are themselves
  "old-name" strings in live code, so they need allowlist entries and could be
  read as the alias the brief excludes.
- **Counter:** they are widenings of a reader, not a second plugin. Each one
  sits beside the migration code that J2 already allowlists.

**Values this decision settles:**
- the new identifiers `xyz:`, `xyz@xyz`, `XYZ_CHILD`, `XYZ_REGISTRY`,
  `.codex/rules/xyz.rules`, `> Tuned from xyz v`, `~/.config/xyz/`,
  `~/.local/state/xyz/`;
- the `$TMPDIR` markers stay as they are;
- the `xyzhub/agentic-workflow` slug stays and is allowlisted.

### What would change the answer
If there are no consumers besides this repo and Orderly, and neither has tunes
or operate state, A is fine. Measure that by running `ls .claude/agents/` and
the state dirs on Orderly.

---

## D1 — Directory layout

### The question
Keep `plugins/agentic-workflow/` and change only the manifest `name`, or
`git mv` it to `plugins/xyz/`? This constrains tool paths, tests, `--plugin-dir`
dev instructions, and where the D2 old-name artifact can live.

### Options

**A — Keep the path; rename only the manifest.**
- How it works here: 0 path edits. Per F6 the consumer cache path follows the
  manifest name anyway, so consumers never see the source directory.
- Tradeoffs:
  - 36 live `plugins/agentic-workflow` occurrences stay. They need a J2
    allowlist entry ("source path"), which is the exact class of
    exception-by-discipline the brief wants to avoid.
  - Contributors read `plugins/agentic-workflow/commands/` and then type
    `/xyz:`, which is a permanent mismatch.
  - The directory can't host the D2 stub.
- Cost of reversal: trivial.

**B — `git mv plugins/agentic-workflow plugins/xyz` (recommended).**
- How it works here: a 36-occurrence / 17-file mechanical edit. The largest
  pieces are the `PLUGIN=` constants in 7 test harnesses, lint, `evals/run.mjs`,
  2 eval `setup.sh` files, README and CLAUDE.md. CI is untouched (`lint.yml`
  has no path, fact).
- Tradeoffs:
  - History follows the rename (`git log --follow`, rename detection with `-M`).
  - In-flight branches that touch plugin files will conflict. **Inference:**
    there are none besides this plan branch today.
  - The README `--plugin-dir ./plugins/xyz` line changes.
- Operational cost: none ongoing.
- Cost of reversal: one more `git mv` plus the same 36 edits.

### Recommendation
**B.** Zero exceptions in J2 for paths. It also frees
`plugins/agentic-workflow/` for the D2 option-B fallback if that is ever needed.
- **Strongest case against:** it is the one change that touches every test
  harness. A missed `PLUGIN=` constant makes a suite silently test nothing.
- **Mitigation:** each harness already fails loudly on a missing plugin file
  (**inference** from the lint "script missing" checks at `lint.mjs:427-590`).
  Running the full test list is the gate.

**Values this decision settles:** the plugin source dir is `plugins/xyz/`, and
the marketplace `source` is `./plugins/xyz`.

### What would change the answer
Long-lived parallel branches touching plugin files at merge time. Then use A
for this release and rename the directory in a follow-up.

---

## D2 — Marketplace transition and the J4 move notice

### The question
How does someone with `agentic-workflow@xyz` installed learn to move? How is
that final release built and published? And how do we avoid double-firing hooks
when both plugins end up enabled?

### Constraints
- **C1 (F4 + F2):** `renames` can't coexist with a listed old entry. A chain
  must end at a listed name or `null`; a listed name *is* that end.
  **Inference** that listing a name and also mapping it is rejected; this was
  not tested.
- **C2 (F5):** without auto-update, users jump straight to whatever main
  serves. A "final old release" that ships *before* the rename lands reaches
  almost nobody (**inference**).
- **C3:** the journeys doc wants "until you move, everything keeps working"
  plus a silence guard. The push-to-main block must not vanish because a notice
  was ignored.

### Options

**A — `renames` map only; no final old release.**
- How it works here: `marketplace.json` gets
  `"renames": {"agentic-workflow": "xyz"}` and lists only `xyz`. Claude Code
  rewrites `agentic-workflow@xyz` to `xyz@xyz` in the user, project and local
  `enabledPlugins` (F4), so double-enablement can't happen.
- Tradeoffs:
  - The user sees Claude Code's own `Renamed to "xyz"` once, in
    `/plugin`/`plugin list`.
  - The plugin then reports **not cached** until `/plugin install xyz@xyz`
    (F4). Until then the old copy no longer loads: no hooks, no commands.
  - The notice is not ours, is not at session start, and doesn't say
    `/xyz:sync`. The new plugin's conform hook says that only after install.
  - It **fails J4 as written** and leaves a window with no guardrails.
- Operational cost: zero. One map entry, kept forever (append-only, F4).
- Cost of reversal: the map is append-only, but harmless.

**B — In-tree notice-only stub.**
- How it works here: `plugins/agentic-workflow/` (freed by D1-B) holds just
  `plugin.json` (v1.63.0), a `hooks.json` with one SessionStart notice hook,
  and the notice script. The marketplace lists both entries with relative
  paths, so `claude plugin validate` covers both in CI.
- Tradeoffs:
  - It is the simplest artifact, and double-firing is impossible by shape: the
    stub has no guard hooks.
  - The cost is C3: anyone who updates but doesn't move loses the push-to-main
    block and all commands until they do.
- Operational cost: 3 tiny files in tree, allowlisted.
- Cost of reversal: delete the stub and add `renames → null`.

**C — Frozen full build, pinned by `git-subdir`, plus a silence guard
(recommended; this is the designer's proposal).**
- How it works here:
  - **Build:** cut a branch from the v1.62.0 commit (`66dc6af` / current main).
    Add the J4 notice hook (full text once per machine, then one line per
    session). Add one guard prefix to every `hooks.json` command:
    `xyz_on && exit 0`. Set `version` to `1.63.0`, commit, and tag
    `agentic-workflow--v1.63.0` (the `<plugin>--v<version>` convention from
    F3/dependencies).
  - **Publish:** the main marketplace lists `xyz` → `./plugins/xyz`, and
    `agentic-workflow` → `{"source":"git-subdir","url":"xyzhub/agentic-workflow","path":"plugins/agentic-workflow","ref":"agentic-workflow--v1.63.0","sha":"<40-hex>"}`.
    Because `sha` is pinned (F3), the tag is never trusted alone and the
    artifact is immutable.
  - **Guard:** `xyz_on` is true when `jq` finds `.enabledPlugins["xyz@xyz"] == true`
    in `~/.claude/settings.json`, `./.claude/settings.json` or
    `./.claude/settings.local.json`. A missing or unparseable file counts as
    "not on" (fail-open to running guards).
  - The notice hook itself never exits on the guard. It keeps nagging until
    the old plugin is uninstalled, which is the desired E3 behaviour.
- Tradeoffs:
  - Laggards keep full guardrails and commands (C3 met). Movers get exactly one
    set of hooks.
  - The cost is a side branch + tag + sha pin, and a `git-subdir`
    self-reference into a (possibly private) repo that has **not been verified
    live**. Access is the same as the marketplace clone, so this is an
    **inference** that it works.
  - Double-firing residue: a session where both are enabled and the guard
    misreads (managed settings, unparseable file) runs both sets. Guard hooks
    blocking twice is harmless. Three advisories dedupe on shared markers (D4
    #12). The intake/beat/mission-budget nudges would print twice. That is
    cosmetic.
  - Tag push and branch creation are a HITL step for the owner (repo rule: no
    agent push to non-mission refs without ask). **Assumption** about the
    current policy; check §10.
- Operational cost: none after publish. The frozen artifact is never touched
  again.
- Cost of reversal: replace the entry with `renames: {"agentic-workflow": "xyz"}`
  (this is option A) at any time. It is a one-line change, so C degrades
  gracefully into A.

### Recommendation
**C, with B as the named fallback** if the live J4 check shows the
`git-subdir` self-reference fails to install. C is the only option that meets
J4 *and* C3. Its end state (switch to `renames`) is a one-line edit that needs
no further mission.
- **Strongest case against:** it adds the most moving parts for an audience of
  about two installs (this machine plus Orderly's), and an untested source type
  sits on the critical path.
- **Counter:** the frozen build is the same 1.62.0 tree the owner already runs.
  Only about 12 lines are new: a notice script plus one prefix per hook entry.

**Values this decision settles:**
- the final old release is `agentic-workflow` **1.63.0** at tag
  `agentic-workflow--v1.63.0`, pinned by sha;
- the notice text is the journeys doc's;
- the notice cadence is "full text once per machine, then one line per
  session", a deviation from the brief's "one-time" that the owner must ratify;
- the guard reads exactly the three settings files and treats any failure as
  "absent".

### What would change the answer
- If the live install of a `git-subdir` self-reference fails, use B.
- If the owner confirms the only old installs are on machines they control,
  use A (just reinstall) and skip J4.

---

## D3 — Consumer migration in `/xyz:sync` + `tools/conform.mjs`

### The question
How does an adopted project's live text move from the old name to the new one,
idempotently and fail-closed, given that the **old** plugin can't run the
**new** `/sync`?

### The bootstrapping answer (fact + inference)
The project is migrated by the **new** plugin running on old-named files.
- `conform.mjs` detects an adopted project by `docs/WORKFLOW.md` existing, not
  by name (fact: `conform.mjs` "Not an adopted project" branch).
- So after `xyz@xyz` is installed, its SessionStart conform-check hook fires in
  the old-named project, reports the new `plugin-renamed` gap, and says "run
  `/xyz:sync`".
- The old plugin's only job is the J4 notice. Order: install xyz → open
  project → hook says sync → `/xyz:sync`.

### Live vs history (consumer side)

| Live (rewrite) | History (never touch) |
|---|---|
| `docs/WORKFLOW.md` (re-copied by sync anyway; §10 + Local amendments get the token rewrite) · `AGENTS.md` · `CLAUDE.md` · `.claude/settings.json` + `.claude/settings.local.json` (`enabledPlugins` key only) · `.claude/agents/*.md` (tunes: banner + body) · `.codex/rules/agentic-workflow.rules` (re-copy as `xyz.rules`, delete old) · **active** ledgers (`.plans/*.state.md` + their master `.md`, using conform's existing `activeLedgers()`, `conform.mjs:54`) · `docs/product/engineering/*.md` · `tools/catalog.mjs` / `ci-wait.mjs` (re-copied by step 3.6) | closed ledgers · `*.sessions.md` · `*.artifacts/` · `.plans/runs/` · `CHANGELOG.md` · `JOURNEY.md` · `docs/product/decisions/` · `decision-log.md` · retros · git history |

### Options

**A — Token-exact rewriter tool + ladder entry (recommended).**
- A new `tools/rename.mjs check|apply [--root]` follows the
  `attribution.mjs check/apply` pattern (fact: `attribution.mjs:9-10,89,104`).
  A ladder entry `{id:'plugin-renamed', since:'2.0.0'}` calls `check`, and sync
  step 3.7 calls `apply`.
- **Fail-closed by shape:** it rewrites only an enumerated pattern set, never a
  bare `agentic-workflow`:
  - `/agentic-workflow:<name>` and `agentic-workflow:<name>`, where `<name>` is
    in the set of command, skill and agent names *read from the installed
    plugin's directories*;
  - the exact JSON key `"agentic-workflow@xyz"`;
  - `.codex/rules/agentic-workflow.rules`;
  - `> Tuned from agentic-workflow v`;
  - `AGENTIC_WORKFLOW_(CHILD|REGISTRY)`.
  So `xyzhub/agentic-workflow` (the repo, out of scope) is untouchable.
- **Settings:** parse JSON. If it doesn't parse, skip that file with the
  journeys doc's E2 line (as `attribution.mjs:107` does). If both
  `agentic-workflow@xyz` and `xyz@xyz` are present, delete the old key and
  keep the new value. Otherwise move the key and keep its value (`true` or
  `false`). It never adds an enable the user didn't have.
- **Tunes:**
  - Rewrite the banner and the body tokens.
  - Then re-stamp `base sha256` to the new base **only if** the old stamp equals
    `sha12(rewrite(old base))`. The old base is not on disk, so compute this
    equivalently: the tune's stamped hash matches the hash list of v1.62.0 bases
    shipped as a frozen table in `rename.mjs`.
  - Otherwise leave the stamp and let `/tune` drift reporting surface it.
  - **Inference:** without this, every tune of an agent whose prompt mentions
    the prefix (39 occurrences in agents) shows false drift after the upgrade.
- **Idempotent:** the patterns match only the old form, so a second run is a
  no-op and `check` returns clean.
- **Reviewable:** `apply` stages, never commits, and prints a per-file count
  (the step 3.5 precedent).
- **Dogfood:** the same tool run on this repo *is* the J2 sweep, so the J3
  migrator gets its first real test on 794 live occurrences before Orderly.
- Cost: about 1 session including fixtures. Reversal: the tool can be run with
  the mapping swapped.

**B — Prose instruction in `sync.md` (the agent does it with sed/grep).**
- There's no new tool and it is flexible, but it is discipline-guarded. A
  careless model will rewrite `xyzhub/agentic-workflow` or touch history.
  `conform.mjs` can't detect "done", so the SessionStart nag has no
  deterministic check. It also fails the "Fail-closed by shape" rule.

**C — Rely on `renames` for settings + re-copy for WORKFLOW.md; leave the rest.**
- Claude Code handles `enabledPlugins` (F4, only if D2 eventually uses
  `renames`), and sync re-copies WORKFLOW.md. AGENTS/CLAUDE.md, tunes and
  ledgers keep `/agentic-workflow:` mentions, so the next session's agent reads
  dead command names. This fails J3 ("no manual edits").

### Recommendation
**A.**
- **Strongest case against:** a frozen v1.62 base-hash table is a small piece
  of version-specific code. The re-stamp rule is subtle, and a wrong re-stamp
  would hide a real drift.
- **Mitigation:** re-stamp only on an exact table hit, and leave every other
  case as reported drift. That way the failure mode is a false alarm, never a
  silent hide.

**Values this decision settles:**
- the ladder id `plugin-renamed`, `since: 2.0.0`;
- the pattern set above, with `<name>` derived from installed dirs;
- the live/history table above;
- the settings rule (move key, keep value, never add);
- the tune re-stamp rule (exact v1.62.0 base-hash hit only).

### What would change the answer
If the projects that receive this have no tunes, drop the re-stamp table.

---

## D5 — Product name in prose

### The question
What does prose call the product, and what are the README and WORKFLOW.md
titles?

### Options

**A — "The XYZ Protocol" as the name; "agentic workflow" survives only as a
lowercase descriptor (recommended).**
- How it works here:
  - It matches the shipped attribution (`attribution.mjs:34`
    `Generated with The XYZ Protocol`, fact).
  - It matches the journeys IA: first mention "The XYZ Protocol", then "the
    protocol".
  - It matches existing vocabulary: WORKFLOW.md already calls itself "the
    bundled master protocol" (`templates/WORKFLOW.md:3`), and the skill is
    already named `protocol` (so `/xyz:protocol` reads well).
- Concrete changes:
  - `plugin.json` gets `displayName: "The XYZ Protocol"`. The description
    becomes "An agentic workflow from idea to viable product: …".
  - README title: `# The XYZ Protocol — Claude Code plugin marketplace`.
  - WORKFLOW.md H1 becomes `# The XYZ Protocol — one agentic protocol from
    idea to viable product`. The current H1 is "The Workflow — …" (fact,
    `docs/WORKFLOW.md:1`).
  - Keep `"agentic"` in keywords.
- Tradeoffs: 51 live title-case occurrences to rewrite. The article "The" is
  awkward mid-sentence ("install The XYZ Protocol").
- Cost of reversal: a prose sweep.

**B — "XYZ Protocol" (no article).** It reads better mid-sentence, but it
splits from the already-shipped attribution string. Changing the attribution
default would itself be a behaviour change for every consumer's commits.

**C — Keep "Agentic Workflow" as the product subtitle ("The XYZ Protocol —
Agentic Workflow").** It preserves recognition. But it keeps two names for one
thing, which is the brief's stated problem.

### Recommendation
**A.** Capitalise "The" only at the start of a sentence and in titles;
mid-sentence write "the XYZ Protocol".
- **Strongest case against:** title-case product names with an article are
  awkward in the CLI (`/plugin` list shows the displayName).
- **Counter:** the id `xyz` is what users type. The display name is shown,
  not typed.

**Values this decision settles:** `displayName` is "The XYZ Protocol"; the H1
strings above; "the protocol" as the short form.

### What would change the answer
If marketing wants the article dropped, choose B and change the attribution
default in the same release.

---

## D6 — Version

### The question
Should this release be 2.0.0 or 1.63.0?

### Options

**A — `xyz` 2.0.0; the old-name final build is `agentic-workflow` 1.63.0
(recommended).**
- The command prefix, install id, env vars, rules filename and state paths all
  change. That is a breaking change by semver.
- Lint accepts any `X.Y.Z` (`lint.mjs:76`, fact), and `conform.mjs` `cmp`
  handles a major bump (fact: numeric compare, `conform.mjs:40`).
- The old line's 1.63.0 is greater than 1.62.0, so updaters receive it (F5).
- Reversal: n/a.

**B — `xyz` 1.63.0.** This continues the series. But it hides a breaking change
behind a minor bump, and it collides with the old line's final 1.63.0. That
would leave two different artifacts with the same version under two names,
which is confusing in CHANGELOG and in the `protocol-master` stamp.

### Recommendation
**A.**
- **Strongest case against:** the protocol stamp jumps from v1.62.0 to v2.0.0.
  A reader may assume the protocol content changed wholesale.
- **Counter:** the CHANGELOG 2.0.0 entry says "rename only; protocol unchanged".

**Values this decision settles:** `xyz` 2.0.0; `agentic-workflow` 1.63.0
(final); ladder `since: '2.0.0'`.

---

## Size estimate and phasing

**Inference, from the counts above:** about **3 sessions**, in one mission
with **2 phases** (2 PRs, pr-economy).

| Phase | Work | Sessions |
|---|---|---|
| **P1 — migrator + dogfood rename (`xyz` 2.0.0)** | `tools/rename.mjs` check/apply + fixtures (settings both-keys / unparseable / tune re-stamp / history untouched / `xyzhub/` untouched / idempotent second run) · ladder entry + sync step · D4-B read-both branches (6) · run the migrator on this repo (794 live occ) + `git mv` (D1-B, 36 path edits) + env/rules/XDG renames · D5 prose (51 + 41 docs/product) · all test suites + `claude plugin validate` · J2 grep with allowlist | ~2 |
| **P2 — transition (`agentic-workflow` 1.63.0 final)** | side branch from v1.62.0 + notice hook + guard prefix + tag/sha (HITL for tag push) · marketplace dual entry · live checks J1 (fresh install), J4 (old install updates, sees notice, guard silences when `xyz` is enabled) · J3 on Orderly, run as a live check or filed as an obligation if Orderly can't be touched this session · Missions-app change list into OB-30 | ~1 |

The biggest risk to the estimate is the D2-C `git-subdir` self-reference. If it
fails live, the fallback is D2-B, which adds about 0.25 session.
