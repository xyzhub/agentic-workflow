---
status: semi-static
owner-agent: planner
refresh-trigger: event
---

# Mission: provider-adaptive — master plan

_The strategic view of one mission: what gets done, what's already decided, and
what still needs a human answer. Authored by the `planner` (WORKFLOW.md §5);
scope is settled before this file exists — the planner decomposes, it does not
re-decide. Planned 2026-10-25 on `plan/provider-adaptive` (main at 999db5f,
plugin v1.69.0). Converted from
`docs/product/decisions/2026-10-25-provider-adaptive-brief.md` (2026-10-25) —
its locked decisions **L1–L5** are settled ground and **L1 supersedes anything
bigger in the memos**; the memos
`docs/product/decisions/2026-10-25-provider-adaptive-memos.md` D1 (option A),
D2b (as aliases), D3 (option A — env only, no probe), D5 (line list + same-model
label), D7 step 1 (the snapshot) are the specs, the "Orchestrator note on D4" is
authoritative (the Agent tool's `model` is an alias enum), and § Counsel is
binding. The journeys file supplies the terminal copy, adjusted to L1 (no
model-id table, no network probe, no mixed). The AC-N ids below are this plan's;
the brief's per-journey criteria map onto them in the Tasks._

**Path convention.** `<plugin>/` = `plugins/agentic-workflow/` on today's tree.
L4 sequences this mission AFTER the xyz-rebrand (plan PR #152), which renames
the folder to `plugins/xyz/`, the command prefix to `/xyz:` and the version to
2.0.0. Every line number here was measured on 999db5f; the ledger's `Next up:`
gate (3) re-verifies anchors on the post-rebrand tree before S1 starts.

Goal: a user whose Claude Code points at z.ai (GLM) runs a mission with zero
`/tune` calls and no Claude model id requested anywhere; a Claude user sees no
change (every role resolves to exactly today's model, byte-compared); a
provider switch is noticed at the next session start and reported in one line;
a review that ran on the builder's model says so; rules name a tier, not a
model; keys never reach the profile, a ledger, a trace or a committed file.

Estimate: **2 sessions** (mode `phases`, owner-locked in L1 — "Estimate: 2
sessions"): S1 = resolver + data + tests (`backend`), S2 = surfaces + docs +
release (`backend`). The one Fable checkpoint (`ckpt-s2`, boundary class:
`hooks/` + `tools/` + `templates/` are `security-boundary`,
`templates/gate-classes.md:32`) rides S2's session, as jev-browser's did. Under
the planner's own counting rule (briefs + checkpoints) this would read 3; the
owner's lock says 2 and the checkpoint is a one-shot spawn inside S2, so 2
stands — see Locked decisions. A corrective is counted when it fires, never
pre-booked. No session in this mission needs a z.ai key: J1/J3 live runs are
obligations (OB-35, OB-36); fixtures carry the env shapes.

## Tasks

1. **Presets name aliases, Anthropic resolution byte-identical (S1).**
   - AC-1 `<plugin>/templates/tune-presets.json`: every `model` and
     `fallback.model` value is one of `fable | opus | sonnet | haiku` (today's
     135 Claude ids: `claude-fable-5-1`→`fable`, `claude-opus-5-5`→`opus`,
     `claude-sonnet-5-5`→`sonnet`, `claude-haiku-5-5`→`haiku`); the top-level
     `models` list becomes `"aliases": ["fable","opus","sonnet","haiku"]`;
     `tier_aliases` is removed (the alias→id map lives in `models.json`);
     `schema_version` stays 1 (planner lock below); the `description` says
     "aliases" and "the plan-judge runs on the top tier". `tools/lint.mjs`
     `tunePresetFindings` (`:1073–1135`) validates aliases (`PRESET_MODELS` →
     the alias set, `PRESET_HAIKU = 'haiku'`, the Haiku-row rules key on the
     alias) and `tools/lint-test.mjs` P1 (`:258–259`) mutates to an unknown
     alias. `<plugin>/tools/preset.mjs` `baseCell` (`:63–69`) compares alias to
     alias (base `model: sonnet` vs cell `sonnet`; `inherit`/absent → balanced
     cell) and drops the `tier_aliases` argument; `renderShadow` writes
     `model: <alias>`. `<plugin>/tools/run-claude.mjs` `resolveRun`
     (`:164–194`) drops the `tier_aliases` mapping and passes the alias to
     `claude -p --model` unchanged (the harness's `claude` resolves it under
     its own provider env). `/tune <agent> <model>` accepts `fable`.
   - AC-2 **J2 snapshot captured FIRST.** The first commit of S1 adds
     `<plugin>/tools/fixtures/model-resolution/anthropic-v1.json`, generated
     from the UNCHANGED `tune-presets.json` by a one-off script (not kept):
     `{ "captured_from": "<sha>", "presets": { <preset>: { <agent>: { "model":
     "<claude id>", "effort", "runtime", "maxTurns", "compact_window",
     "fallback_model" } } } }` — 5 presets × 20 agents = 100 cells. A new
     `tools/models-test.mjs` case resolves every alias cell through the
     anthropic block of `models.json` (fixture env: no `ANTHROPIC_BASE_URL`, no
     `ANTHROPIC_DEFAULT_*`) and asserts `JSON.stringify` equality with the
     snapshot — **red on the old tree is not possible (the resolver does not
     exist there), so the red proof is the snapshot's own check: a second case
     flips one alias in memory and asserts the comparison fails.** A third
     case asserts `anthropic.role_defaults` ≡ the balanced preset's alias
     cells (D2b, one truth).
2. **`templates/models.json` + `tools/models.mjs` + the SessionStart hook (S1).**
   - AC-3 `<plugin>/templates/models.json` (new, ≤ 4 KB):
     `{ "schema_version": 1, "updated": "YYYY-MM-DD", "aliases": [...4],
     "providers": { "anthropic": { "label": "Anthropic", "match": {
     "base_url_hosts": ["api.anthropic.com"], "default_when_no_base_url": true },
     "alias_ids": { "fable": "claude-fable-5-1", "opus": "claude-opus-5-5",
     "sonnet": "claude-sonnet-5-5", "haiku": "claude-haiku-5-5" },
     "alias_remap": {}, "knobs": { "effort": true, "autocompact_window": true },
     "role_defaults": { <20 roles>: "<alias>" } }, "zai": { "label": "z.ai (GLM)",
     "match": { "base_url_hosts": ["api.z.ai"] }, "alias_ids": {},
     "alias_remap": { "fable": "opus" }, "knobs": { "effort": false,
     "autocompact_window": false }, "env_alias_vars": {
     "ANTHROPIC_DEFAULT_OPUS_MODEL": "opus", "ANTHROPIC_DEFAULT_SONNET_MODEL":
     "sonnet", "ANTHROPIC_DEFAULT_HAIKU_MODEL": "haiku",
     "ANTHROPIC_DEFAULT_FABLE_MODEL": "fable" }, "role_defaults": { <20 roles>:
     "<alias>" } } } }`. `anthropic.role_defaults` = the balanced preset
     (reviewer/advisor/planner `fable`; architect/compass/backend/frontend/
     devops/security `opus`; researcher/brainstormer/designer/business/
     marketing/ops/analyst/chronicler/writer/curator/intake `sonnet`).
     `zai.role_defaults` = the same with `fable`→`opus` (the L2 probe may
     change `zai.alias_remap`; see OQ-2). `tools/lint.mjs` gains
     `checkModelsTable` next to `checkTunePresets`: ids unique, `aliases`
     exactly the four, every provider's `role_defaults` keys == the sorted
     `agents/*.md` names (no missing, no extra), every value ∈ `aliases`,
     `alias_remap` keys/values ∈ `aliases`, `anthropic.alias_ids` covers all
     four, and `anthropic.role_defaults` equals the balanced preset cells.
     Room for later without a schema break: new `providers.<id>` blocks,
     optional `cost`/`models` keys readers ignore.
   - AC-4 `<plugin>/tools/models.mjs` (new, ~350 lines, zero deps, Node ≥ 18,
     `headless.mjs` header style, pure functions exported for the test):
     `detect [--brief|--json] [--refresh] [--project <dir>]`,
     `resolve <alias> [--role <r>] [--preset <name>] [--json]`,
     `table [--preset <name>] [--json]` (the J2 comparison shape),
     `doctor [--json]` (the `/doctor` Models block). **Detection is env-only,
     no network, no secrets** (D3 option A per L1): provider = no
     `ANTHROPIC_BASE_URL` or host `api.anthropic.com` → `anthropic`; host
     `api.z.ai` → `zai`; `CLAUDE_CODE_USE_BEDROCK`/`CLAUDE_CODE_USE_VERTEX`
     set or any other host → `unsupported` (one line, nothing written).
     Signals: the base-URL **host**, which of `ANTHROPIC_BASE_URL`,
     `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY`,
     `ANTHROPIC_DEFAULT_{FABLE,OPUS,SONNET,HAIKU}_MODEL` are **present (names
     only)**, and the **values** of the four `ANTHROPIC_DEFAULT_*_MODEL` vars
     (model ids, not secrets). Resolution per alias: `alias_remap` first, then
     the env var's value when set, else `alias_ids[alias]`, else the bare alias
     with `resolved: null` (printed as `opus → (your provider's opus mapping)`).
     Fingerprint `sha256(provider · host · sorted present names · the four
     default-model values · models.json "updated")` → 12 hex. Profile at
     `$(git rev-parse --git-common-dir)/agentic-workflow/model-profile.json`
     (dir 0700, file 0600, write to `model-profile.json.tmp-<pid>` in the same
     dir then `renameSync`); outside a work tree
     `${XDG_STATE_HOME:-~/.local/state}/agentic-workflow/model-profile.json`.
     Schema v1: `{ "schema_version": 1, "detected_at", "fingerprint",
     "table_version", "provider", "label", "base_url_host", "env_names": [...],
     "aliases": { "<alias>": { "alias": "<after remap>", "model": "<id>|null",
     "source": "remap|env|table|unmapped" } }, "same_model_review": <bool:
     resolve(fable) == resolve(opus)>, "skipped": ["effort",
     "autocompact-100k"]|[], "routing": { "policy": "alias" } }`. Equal
     fingerprint → no write, no output. Changed or missing → write + the
     report. `--refresh` forces the rewrite and prints the J3 line or
     `Models unchanged.`. **Never printed or stored: any env var VALUE other
     than the four model-id vars.**
     The ≤ 3-line report (journeys, adjusted to L1 — aliases, not a tier
     table; `fable` shown as `top`, `opus` as `build`, `sonnet` as `mid`,
     `haiku` as `floor` in prose only): anthropic first detection → **prints
     nothing** (J2). zai first detection →
     `🧭 Models set up for z.ai (GLM): no tuning needed. Roles use your provider's opus/sonnet/haiku mapping.` /
     `top → {id|opus mapping} · build → {id} · mid → {id} · floor → {id}; reviews are "same-model review" when top and build share a model. Skipped on GLM: per-agent effort, the 100k Haiku compact window.` /
     `Change one with /agentic-workflow:tune; re-check with /agentic-workflow:doctor.` (saved locally under the git dir, never committed, no keys stored — said in the doctor block, not here).
     Switch →
     `🧭 Provider changed from {old label} to {new label}, so roles now resolve through {new label}: top → {id} · build → {id} · mid → {id} · floor → {id}.` /
     second line only when `same_model_review` flipped or a knob is skipped /
     `Nothing to do. Undo by switching the provider back; the next session remaps again.`
     Unsupported →
     `🧭 Provider not recognised: {host}. v1 supports Anthropic and z.ai (GLM), so no model profile was written.` /
     `Roles will ask for Claude aliases and may fail on your provider.` /
     `Point ANTHROPIC_BASE_URL at a supported provider, or run /agentic-workflow:tune to name models by hand.`
     Existing `.claude/agents/` shadows whose `model:` is a full `claude-` id
     on `zai` → one extra clause on line 2: `Kept your /tune overrides:
     {agent}={id}[, …] — {n} name a Claude id your provider doesn't serve
     (/agentic-workflow:tune {agent} reset).` (never rewrite a shadow — L1).
   - AC-5 `<plugin>/hooks/lib/model-profile.sh` (new, ≤ 45 lines, the
     `conform-check.sh` contract: `startup|resume` only, silent when
     `AGENTIC_WORKFLOW_CHILD=1`, when node or the script is missing, or when
     the cwd is not a git work tree AND no XDG home resolves; runs `node
     "$CLAUDE_PLUGIN_ROOT/tools/models.mjs" detect --brief`; empty output →
     silent; else jq-built `hookSpecificOutput.additionalContext`; ALWAYS exit
     0) + a fourth `startup|resume` group in `<plugin>/hooks/hooks.json`
     after the conform-check group (`:199`), `timeout: 5`, description in the
     file's style naming the contract. **No once-per-session marker**: the
     fingerprint already makes a repeat silent. `tools/hook-test.mjs` gains a
     `model-profile` block after the conform-check block (`:1313–1360`):
     anthropic env (no base URL) → exit 0, empty stdout, a profile file exists
     with mode 0600 and `"provider":"anthropic"`; zai env
     (`ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic`,
     `ANTHROPIC_AUTH_TOKEN=sk-test-SECRET-xyz`, the three
     `ANTHROPIC_DEFAULT_*_MODEL` = `glm-x-build`/`glm-x-mid`/`glm-x-floor`) →
     additionalContext has exactly 3 lines, line 1 starts `🧭`, names
     `z.ai (GLM)` and `glm-x-build`; the profile and stdout contain
     `ANTHROPIC_AUTH_TOKEN` and never `SECRET`; the same env again → empty
     stdout and the file's mtime unchanged; anthropic → zai with the file
     present → 1–3 lines starting `🧭 Provider changed from Anthropic to z.ai
     (GLM)`; `ANTHROPIC_BASE_URL=https://openrouter.ai/x` → the
     `not recognised` line and no file written; `AGENTIC_WORKFLOW_CHILD=1` →
     silent. The harness points the profile at a temp git dir via
     `--project`/a temp repo (never the real one). `tools/lint.mjs` gains
     `checkModelsHarness` (copy of `checkBrowseHarness`, `:537–551`) wired
     into the array at `:1402` after `checkBrowseHarness`.
3. **Surfaces: same-model label, tier wording, `/doctor`, `/tune` (S2).**
   - AC-6 **Same-model review, label now, second pass opt-in (L3).**
     `<plugin>/commands/mission.md` §3 (after `:225` "Resolve
     `phase-reviewer`…"): before spawning, run `node
     ${CLAUDE_PLUGIN_ROOT}/tools/models.mjs resolve <reviewer alias> --json`
     and the builder's alias (the distillate's `runtime.model` when a child
     ran, else the resolved alias of the builder role); equal ids (or the
     profile's `same_model_review: true` when ids are unmapped) → the reviewer
     brief carries `review_mode: same-model`, the ledger handoff line and the
     checkpoint row carry `(same-model review)`; when `.claude/agents/reviewer.md`
     carries `same_model_second_pass: on` AND the diff's class has reviewer
     tier `top` in `templates/gate-classes.md`, a second fresh-context
     reviewer pass runs with the framing "assume one defect exists; find it"
     before APPROVE counts; default (key absent/`off`) → no second pass, the
     label alone. `<plugin>/agents/reviewer.md` Output (`:145–147`): the first
     line of the verdict block is `Same-model review: this reviewer ran on
     {id}, the same model that built the work. It still read the change in a
     fresh context, but expect fewer independent catches.` when the brief says
     `review_mode: same-model`, else `Reviewer: {id}, different from the
     builder ({id}).` when the brief names both; the second pass heads
     `Second pass (adversarial, same model): {class}.` `<plugin>/commands/tune.md`
     gains `/agentic-workflow:tune reviewer second-pass on|off` (reviewer
     only, banner kind `second-pass`, mirrors `:148–165` boundary-escalation
     wording; `argument-hint` `:3` and the table at `:16–40` list it).
   - AC-7 **"Fable" → "the top tier"** (D5 list + two sites the memo missed;
     anecdotes stay): `<plugin>/commands/mission.md:79–83` (rule 7: "the
     plan-judge runs on the top tier under every preset — `fable` on
     Anthropic, the profile's top alias elsewhere"; "any reviewer tune below
     the top tier"), `:196–201` ("Reviewer tier survives…": "any reviewer tune
     below the top tier … spawn the Claude `reviewer` on the top tier");
     `<plugin>/agents/reviewer.md:20–21` and `:205–206`;
     `<plugin>/agents/planner.md:118`; `<plugin>/commands/tune.md:93`, `:109`,
     `:153`; `<plugin>/templates/WORKFLOW.md:416` and the `fable-boundary`
     rule body `:450` ("The top tier is required for any review whose diff
     touches a class whose reviewer tier is `top` …" — the fence id
     `fable-boundary` stays); `<plugin>/templates/gate-classes.md:37–38`
     ("`top` means the top model tier for that review as resolved by the model
     profile (`fable` on Anthropic)"); `tune-presets.json` description.
     `tools/lint.mjs` `RULES['fable-boundary'].name` (`:1157–1159`) becomes
     `/top tier|Fable/` so the canonical block is still found;
     `tools/lint-test.mjs` `:151–158` pre-swap fixtures and `:188` pointer case
     keep passing (they contain "Fable" — the regex keeps matching) and one new
     case asserts the rewritten canonical paragraph matches. `commands/mission.md:61`
     and `templates/WORKFLOW.md:520` are historical anecdotes — unchanged.
     `templates/WORKFLOW.md` §10 **Runtimes** row (`:1043`) gains one clause:
     "model aliases (`fable`/`opus`/`sonnet`/`haiku`) resolve through the
     local model profile — `node ${CLAUDE_PLUGIN_ROOT}/tools/models.mjs
     doctor` shows it". Net WORKFLOW growth ≤ 600 B (115,770 of 120,000).
   - AC-8 **`/doctor` Models block** (`<plugin>/commands/doctor.md`, new
     bullet in §1 after **Runtimes** `:48–62`): run `node
     ${CLAUDE_PLUGIN_ROOT}/tools/models.mjs doctor` and print its block
     verbatim — `Models (profile written {date}, provider: {label}, path:
     {path})`, one row per alias `alias · resolved id (source) · prose tier`,
     `Reviews: same-model review (top and build share {id}) | independent`,
     `Skipped on this provider: … | none`, `Overrides: {agent}={model}[, …] |
     none` (from `agents.mjs --json`; a `claude-` id on a non-anthropic
     provider → 🟡 with `/agentic-workflow:tune {agent} reset`),
     `Keys: {names present} (values never read into the profile)`,
     `Refresh: /agentic-workflow:doctor --refresh`; `--refresh` argument →
     `detect --refresh` first (argument-hint `:3` gains `[--refresh]`). Missing
     profile → 🟡 "no model profile yet — start a new session or run
     --refresh". `unsupported` → 🔴 with the journeys fix line.
   - AC-9 **`/tune` reports what the profile would choose**
     (`<plugin>/commands/tune.md` `:80–86`): accept `fable`; before writing,
     run `models.mjs resolve --role <agent>` and print `Set {agent} to {model}.
     The model profile would have used {id} ({alias}); your choice wins until
     you run /agentic-workflow:tune {agent} reset.` / `{agent} already gets
     {model} from the model profile; nothing to change.`; a full `claude-` id
     on a non-anthropic provider → `Not set: {label} doesn't serve {id}. The
     model profile uses {id2} for {agent}. Pick an alias (fable/opus/sonnet/haiku),
     or leave it. (Refused, not saved.)`. Preset section (`:211–219`,
     `:240–245`): "pinned ids" → "aliases"; Apply report line 5 gains
     `Preset "{name}" now picks aliases, resolved by your provider ({label}).`
4. **Release + obligations (S2).**
   - AC-10 `<plugin>/.claude-plugin/plugin.json` + `<plugin>/package.json`
     `version` → the next free minor on the tree at S2 (OQ-1: `2.1.0` after
     the rebrand's 2.0.0; `1.70.0` only if the rebrand did not land first);
     CHANGELOG `## [<version>] — <date>` (Added: `templates/models.json`,
     `tools/models.mjs`, `hooks/lib/model-profile.sh` + SessionStart entry,
     `tools/models-test.mjs`, the J2 snapshot fixture; Changed: presets name
     aliases, "Fable" → "the top tier" in rules, same-model review label +
     opt-in second pass, `/doctor` Models block, `/tune` profile line;
     Deferred per L1 in one line). README `:104–106` "Model tiering" paragraph
     gains one sentence (aliases resolve through the local model profile).
     `docs/WORKFLOW.md` is NOT re-synced in this mission (post-merge row,
     OB-33 pattern). `node tools/lint.mjs` clean.
   - AC-11 Two post-merge Closing rows promote to the register (highest today
     OB-34, `.plans/OBLIGATIONS.md:74`): **OB-35** GLM-only live mission
     (zero `/tune` calls, zero Claude ids requested, ≤ 3 start lines, the
     metrics file's "Record from the live GLM run" fields); **OB-36** a real
     anthropic → zai → anthropic switch on one machine (the J3 line fires
     once per switch, the profile rewrites, no key value in the profile or
     the transcript). Row text is in S2 Do 9; the orchestrator appends them
     (the builder never edits `.plans/`).

## Value sourcing

| Value | AC | Kind | Where |
|---|---|---|---|
| Alias vocabulary `fable · opus · sonnet · haiku` | AC-1, AC-3 | locked decision | brief L1; memos "Orchestrator note on D4" (Agent tool `model` enum verified in-session 2026-10-25) |
| id → alias map (`claude-fable-5-1`→`fable`, `claude-opus-5-5`→`opus`, `claude-sonnet-5-5`→`sonnet`, `claude-haiku-5-5`→`haiku`) | AC-1, AC-3 | derivation | `<plugin>/templates/tune-presets.json:5–6` (`models`, `tier_aliases`) |
| J2 snapshot shape (preset × agent → model, effort, runtime, maxTurns, compact_window, fallback_model) | AC-2 | locked decision | memos D7 step 1; metrics "J2 Claude unchanged" (100 cells) |
| `anthropic.role_defaults` = balanced preset cells | AC-3 | locked decision | memos D2b table + "guarded by shape" lint; owner lock "default models per role per provider" |
| `zai.role_defaults` = balanced with `fable`→`opus`; `zai.alias_remap {fable: opus}` | AC-3 | assumption | memos D4 note ("`fable` is never used on zai"); **confirmed or replaced by the L2 probe (OQ-2)** |
| Provider match: no base URL / `api.anthropic.com` → anthropic; `api.z.ai` → zai; other → unsupported | AC-4 | locked decision | memos D3 signals; brief L1 ("base URL host") |
| `CLAUDE_CODE_USE_BEDROCK` / `CLAUDE_CODE_USE_VERTEX` → unsupported | AC-4 | assumption | memos D3 (unverified item 7); the builder checks the names at `code.claude.com/docs/en/third-party-integrations` and records the result in the CHANGELOG line |
| Env names recorded: `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY`, `ANTHROPIC_DEFAULT_{FABLE,OPUS,SONNET,HAIKU}_MODEL`; values read only for the four model-id vars | AC-4 | locked decision | brief L1 ("key variable NAMES, `ANTHROPIC_DEFAULT_*_MODEL` values; no network, no secrets"); memos D3 ("all four exist", model-config page) |
| Fingerprint = `sha256(provider · host · sorted names · 4 default-model values · table "updated")`, 12 hex | AC-4 | locked decision | memos D1 Schema "Secrets" bullet (key rotation NOT in the fingerprint — recommended there, kept) |
| Profile path `$(git rev-parse --git-common-dir)/agentic-workflow/model-profile.json`, 0700/0600, tmp + rename; XDG state fallback | AC-4 | locked decision | memos D1 option A; idiom `<plugin>/hooks/lib/handoff-lib.sh:96–111` (`--git-path` there; `--git-common-dir` here so worktrees share one profile) |
| Profile schema v1 keys (`schema_version, detected_at, fingerprint, table_version, provider, label, base_url_host, env_names, aliases{alias,model,source}, same_model_review, skipped, routing`) | AC-4 | derivation | memos D1 schema, reduced to L1 (no `hosts[]`, no `tiers{}` with ids, no `probe`); `routing.policy: "alias"` leaves room for `cost` |
| `same_model_review` = resolve(`fable`) == resolve(`opus`) | AC-4, AC-6 | derivation | memos D5 option A (compare the reviewer's and builder's resolved models); the profile pre-computes the provider-level case |
| `skipped: ["effort", "autocompact-100k"]` on zai | AC-4 | locked decision | brief Problem ("Claude-only knobs"); journeys J1 "Degraded: skipped knob" |
| Session-start copy (≤ 3 lines, `🧭` on line 1 only, silence = unchanged, anthropic first run silent) | AC-4, AC-5 | locked decision | journeys "Output rules" + J1/J2/J3 rows, adjusted to L1 (aliases, no mixed, no probe/offline rows) |
| Hook contract (startup\|resume, child-silent, jq-built additionalContext, exit 0, timeout 5) | AC-5 | derivation | `<plugin>/hooks/lib/conform-check.sh:1–45`, `hooks.json:190–199` |
| Second pass default OFF; switch = `same_model_second_pass: on` in `.claude/agents/reviewer.md` via `/tune reviewer second-pass on\|off` | AC-6 | locked decision (default) / assumption (location) | brief L3 (off by default); location mirrors `boundary_escalation` (`tune.md:148–165`) — OQ-4 |
| Reviewer label text | AC-6 | locked decision | journeys "Touchpoint: reviewer report line" |
| "Fable" rewrite sites | AC-7 | derivation | memos D5 list + `grep -rni fable <plugin>/commands <plugin>/agents <plugin>/templates` (2026-10-25: adds `agents/planner.md:118`, `agents/reviewer.md:205–206`; excludes anecdotes `mission.md:61`, `WORKFLOW.md:520`) |
| `RULES['fable-boundary'].name` → `/top tier\|Fable/` | AC-7 | derivation | `tools/lint.mjs:1157–1163` keys the dedup lint on the raw word "Fable"; the rewrite would hide the canonical block without it |
| `/doctor` Models block rows | AC-8 | locked decision | journeys "Touchpoint: /doctor", adjusted (alias rows, path printed per memos D1 "doctor must print its path") |
| `/tune` copy (set / already / refused) | AC-9 | locked decision | journeys "Touchpoint: /tune (override)" |
| version = next free minor (`2.1.0` post-rebrand, else `1.70.0`) | AC-10 | open question | OQ-1 |
| OB ids OB-35, OB-36 | AC-11 | derivation | `.plans/OBLIGATIONS.md:74` ends at OB-34 |

## Locked decisions

- 2026-10-25 (owner, brief L1–L5) — **L1** scope "alias profile, 2 sessions":
  presets name aliases; per-role defaults as alias per role per provider;
  env-only local untracked profile; ≤ 3-line report; same-model label;
  "Fable" → "top tier". **Deferred, never revisited in this mission:** mixed
  + OpenAI/Codex routing, live probing at session start, a model-id
  capability table, other Anthropic-compatible hosts, cost routing, a
  non-Claude-Code harness. **L2** the z.ai alias probe is recorded in the
  brief before S1. **L3** second pass opt-in, off by default. **L4** after
  the xyz-rebrand (PR #152). **L5** human-merge; one Fable checkpoint before
  the PR.
- 2026-10-25 (orchestrator, memos "Orchestrator note on D4") — the Agent
  tool's `model` parameter is an alias enum (`sonnet | opus | haiku |
  fable`, verified from the tool schema in-session); the profile never
  writes `ANTHROPIC_DEFAULT_*_MODEL` or any settings file; it READS them.
- 2026-10-25 (architect memos, as far as L1 allows) — D1 option A (git
  common dir, atomic write, fingerprint, no write when unchanged); D2b
  (per-role defaults, anthropic ≡ balanced guarded by lint); D3 option A
  (env + table only — the counsel struck the probe); D5 line list +
  orchestrator-computed same-model label; D7 step 1 (snapshot first). D0's
  four tiers, D2's id table, D4-A/B, D6, D7 steps 2–6 are NOT built.
- 2026-10-25 (owner, L1) — **Estimate: 2 sessions**, S1 + S2; the one Fable
  checkpoint `ckpt-s2` is a one-shot spawn inside S2 (the jev-browser
  shape). A corrective `S<n>-fix` is counted when it fires.
- 2026-10-25 (planner, decomposition of L1) — `tune-presets.json`
  `schema_version` stays **1**: L1 forbids the schema-2 migration; the only
  change is the `model` vocabulary (ids → aliases), `models` → `aliases`,
  and the removal of `tier_aliases`; every reader is in-plugin and changes
  in the same commit; no shadow is rewritten and no conform rung is added.
- 2026-10-25 (planner, decomposition of L1 + D1) — the profile is a
  **cache keyed by fingerprint**; a stale profile is never an error: every
  reader (`models.mjs resolve`, `/tune`, `/doctor`) recomputes from env when
  the fingerprint differs and never writes outside `detect`.
- 2026-10-25 (planner, decomposition of D5) — the distillate schema does NOT
  gain `review_mode` in this mission (the label travels on the reviewer brief,
  the reviewer report, the handoff line and the checkpoint row; a schema
  change would touch `run-codex.mjs`/`run-claude.mjs` validation for no
  reader). `/connect` is not edited (`/doctor --refresh` covers the refresh).
- 2026-10-25 (planner) — **no new `Bash(...)` rule anywhere** (`tools/shell-wrappers.mjs`,
  `templates/codex.rules`, `hooks/hooks.json`): `models.mjs` is run by the
  hook and by the orchestrator's own Bash, never by a claude-p child.
- Assumed 2026-10-25 (planner) — `fable` is never served on zai, so
  `zai.alias_remap = { fable: opus }` (memos D4 note). **The L2 probe decides**:
  if `fable` lands on a GLM model under z.ai's env, the remap is dropped and
  `zai.role_defaults` keep `fable`; if `fable` fails, the remap stands. Either
  way the mission does not start until the brief records the result (OQ-2).
- Assumed 2026-10-25 (planner) — `claude -p --model <alias>` accepts `fable`
  the way it accepts `opus`/`sonnet`/`haiku` (model-config page lists the
  alias). Not spike-run; `run-claude-test.mjs` uses a shim, so this is only
  exercised live. Never cite as proven.
- Assumed 2026-10-25 (planner) — the Agent tool honours an alias under a
  z.ai main session by resolving it through `ANTHROPIC_DEFAULT_*_MODEL`
  (memos unverified item 2). The L2 probe is the only evidence; OB-35 is the
  live measure.
- Ceremony: this repo's profile is `proposed` → every gate `required`:
  plan-judge, phase-reviewer (Fable, `security-boundary`), staging-verify
  (lint + `claude --plugin-dir` load), chronicler, mission-close.

## Risks

- **The whole GLM path is unexercised in-mission** (counsel, financial): no
  z.ai key here. → fixtures carry the env shapes; the L2 probe is the one
  real datum before S1; OB-35/OB-36 are the measure. The mission ships
  Claude-safe by construction (J2 byte compare) even if GLM needs a fix later.
- **Rebrand drift (L4).** The folder, command prefix and version move under
  this plan. → `<plugin>/` convention; `Next up:` gate (3) re-verifies every
  anchor on the post-rebrand tree before S1; S2's CHANGELOG uses the tree's
  version.
- **Rule-dedup lint keys on the word "Fable"** (`lint.mjs:1159`). → AC-7
  changes the regex in the same commit as the wording; `lint-test.mjs`
  pre-swap fixtures keep "Fable" and keep passing.
- **Preset shadows already on disk carry Claude ids** (`model: claude-opus-5-5`).
  L1 forbids rewriting them. → on anthropic they keep working (Claude Code
  accepts full ids); on zai the switch line names them and offers `/tune
  <agent> reset`; `/doctor` flags them 🟡. A re-applied preset writes aliases.
- **Secret leak** — the hook handles an env that holds a key. → `models.mjs`
  never reads `ANTHROPIC_AUTH_TOKEN`/`ANTHROPIC_API_KEY` values (presence via
  `in process.env`), the hook-test asserts the fixture secret appears nowhere;
  the Fable checkpoint's red-team item.
- **Hook adds latency to every session start** (10 s budget already used by
  conform-check). → env-only, no git beyond `rev-parse`, `timeout: 5`,
  measured in S1 Verify (< 300 ms).
- **No review between S1 and S2.** → S1 ends only on `node tools/lint.mjs`
  clean (which runs every harness incl. the new one); S2 starts by reading
  `models.mjs --help` and the snapshot test, never by exploring.
- **Budgets** — `templates/WORKFLOW.md` 115,770 / 120,000 B (≤ 600 B net);
  `commands/tune.md` and `commands/doctor.md` ≤ 24,000 B each (report sizes);
  `agents/reviewer.md` ≤ 16,000 B.

## Open questions

- **OQ-1 — version.** After the rebrand (2.0.0) the next free minor is
  `2.1.0`; if this mission somehow runs first it is `1.70.0`.
  **Recommendation:** `2.1.0`, decided by the tree at S2 start (`plugin.json`
  version + 0.1.0); the CHANGELOG entry is authored in S2.
- **OQ-2 — L2 probe result (gating).** Which GLM id does each of
  `opus`/`sonnet`/`haiku`/`fable` land on when a subagent is spawned under
  z.ai's env? **Recommendation:** record the four results in the brief under
  L2; if `fable` fails or falls back to the main model, keep
  `zai.alias_remap {fable: opus}`; if it maps, drop the remap. S1 reads the
  brief's L2 line and sets `models.json` accordingly.
- **OQ-3 — build branch base.** `feat/provider-adaptive` from
  `plan/provider-adaptive` (rebased onto post-rebrand `main`) so the four
  decision docs ride the build branch, as jev-browser did (its OQ-2).
  **Recommendation:** yes.
- **OQ-4 — where the second-pass switch lives.** `same_model_second_pass:
  on|off` in `.claude/agents/reviewer.md` via `/tune reviewer second-pass`
  (mirrors `boundary_escalation`; committed, reviewable) vs a §10 row.
  **Recommendation:** the reviewer shadow key; `agents.mjs` ignores unknown
  frontmatter keys so the registry schema is untouched.

---
_The `.plans/provider-adaptive.sessions.md` briefs execute these tasks;
`.plans/provider-adaptive.state.md` tracks progress. Resolve every open
question before execution starts._
