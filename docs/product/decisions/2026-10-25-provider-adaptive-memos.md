---
status: frozen
owner-agent: architect
refresh-trigger: never
---

# agentic-workflow — Decision memos: provider-adaptive model assignment

_Seven shape decisions for the mission in
`docs/product/decisions/2026-10-25-provider-adaptive-brief.md` (owner picks
LOCKED there; not reopened here) and the journeys file
`docs/product/decisions/2026-10-25-provider-adaptive-journeys.md`. Every claim
is labelled **fact** (cited: repo path or URL), **inference**, or
**assumption**. Paths are relative to `plugins/agentic-workflow/` unless they
start with `docs/`. Plugin version at writing: 1.69.0 (`.claude-plugin/plugin.json`)._

## D0 (prerequisite, surfaced by the analysis) — how many tiers?

**The question.** The owner locked "presets name top/build/floor". Can three
tiers reproduce today's Anthropic resolution byte-for-byte (J2)?

- **Fact** (`templates/tune-presets.json`, summarised with node): the five
  presets use **four** distinct Claude models. `balanced` puts
  reviewer/advisor/planner on `claude-fable-5-1`, builders on `claude-opus-5-5`,
  research **and** record on `claude-sonnet-5-5`; `lean` uses opus / sonnet /
  `claude-haiku-5-5`. With three tiers, `top=fable, build=opus, floor=haiku`,
  no tier yields sonnet, so `balanced` research and record rows (the default
  preset; §10 of this repo is `balanced`) cannot round-trip. J2 then fails.
- **Inference.** The journeys file's J2 row ("floor → claude-haiku-5-5")
  silently assumes three tiers suffice; they don't.

**Options.** (A) **Four tiers: `top · build · mid · floor`**. Anthropic gives
fable / opus / sonnet / haiku. On GLM `mid` takes the best mid-class model, or
borrows `build` when there is none. (B) Three tiers plus a per-cell
`anthropic_model` escape hatch. That keeps two sources of truth, which the
"one source of truth" pick forbids. (C) Three tiers, with J2 relaxed to
"equivalent". That contradicts the locked done-when.

**Recommendation: A.** It is the smallest change that keeps every locked
pick. It is additive: the copy says "top, build, mid, floor", and `mid` can
be hidden in prints when it equals `build` or `floor`. **Strongest case
against:** the owner said three words, so a fourth tier needs a one-line
confirmation at the approval moment. The designer's copy also needs one more
line. **What would change it:** a decision to move `balanced` research/record
rows to opus or haiku. That changes Anthropic behaviour, which J2 forbids.

---

## D1 — Profile location and format

**The question.** Where does the generated model profile live, and what is
its schema? This constrains teammate isolation (gap 7), concurrency (gap 6),
and room for later hosts and cost routing.

### Option A — untracked, in the git common dir (`$(git rev-parse --git-common-dir)/agentic-workflow/model-profile.json`)
- **How it works here.** **Fact:** this pattern already exists.
  `hooks/lib/handoff-lib.sh` (lines ~99–105) puts the local handoff at
  `git rev-parse --git-path agentic-workflow/…` and falls back to
  `${XDG_STATE_HOME:-~/.local/state}` outside a repo. Use `--git-common-dir`
  so all worktrees on one machine share one profile. **Inference:** the
  provider is a property of the machine's env, not of a checkout.
- **Tradeoffs.** It cannot be committed, which is fail-closed by shape: a
  teammate on Claude never inherits GLM tiers. It is invisible in the file
  tree, so `/doctor` must print its path. It is lost on a fresh clone, but
  that is harmless because it regenerates at the next session start.
- **Operational cost.** Nil. Atomic write: temp file in the same dir, then
  `rename`. An unchanged fingerprint means no write, so concurrent sessions
  converge (gap 6).
- **Cost of reversal.** Trivial. It is a cache; move it and regenerate.

### Option B — `.claude/model-profile.json` + a `.gitignore` line (the journeys file's current wording)
- **Tradeoffs.** It is visible. But `.claude/` is partly tracked
  (`.claude/agents/` shadows are committed project files; **fact**,
  `tools/preset.mjs` writes them under `<project>/.claude/agents`). Isolation
  then rests on a gitignore line, and `git add -A` before `/sync` adds it
  defeats that. That is discipline, not shape.
- **Cost of reversal.** Low, but one leaked commit puts GLM tiers on every
  teammate.

### Option C — a §10 row in `docs/WORKFLOW.md`
- **Tradeoffs.** It is human-readable next to **Tune preset**
  (`docs/WORKFLOW.md` line 1029). But it is tracked, so it violates gap 7
  outright. `conform.mjs` is also "filesystem only, no git/network"
  (**fact**, its header), so it can't own a regenerating cache anyway.

**Recommendation: A.** Keep a §10 row only for the *policy* (none in v1). The
journeys copy "saved to .claude/model-profile.json" becomes "saved locally,
never committed"; `/doctor` prints the real path. **Strongest case against:**
a user who wants to inspect or hand-edit it has to know a hidden path. That is
mitigated by `/doctor` and by `/tune` being the sanctioned override (D4).
**What would change it:** a requirement to *share* a profile across a team
(e.g. a company-wide GLM gateway). Then it becomes a tracked
`docs/product/engineering/model-policy.md` *policy* that the local profile
reads, not the profile itself.

### Schema (v1). Additive keys only; readers ignore unknown keys.
```json
{
  "schema_version": 1,
  "detected_at": "2026-10-25T09:12:00Z",
  "fingerprint": "sha256:<12 hex>",
  "table_version": "<templates/models.json updated date>",
  "hosts": [
    { "id": "main", "harness": "claude-code", "provider": "zai",
      "base_url_host": "api.z.ai",
      "env_names": ["ANTHROPIC_BASE_URL", "ANTHROPIC_AUTH_TOKEN", "ANTHROPIC_DEFAULT_OPUS_MODEL"],
      "probe": "ok | failed | skipped" },
    { "id": "codex", "harness": "codex", "provider": "openai", "login": true, "probe": "skipped" }
  ],
  "tiers": {
    "top":   { "model": "glm-5.1", "host": "main", "borrowed": false, "source": "table | env | probe" },
    "build": { "model": "glm-4.7", "host": "main", "borrowed": false, "source": "env" },
    "mid":   { "model": "glm-4.7", "host": "main", "borrowed": true,  "source": "table" },
    "floor": { "model": "glm-4.5-air", "host": "main", "borrowed": false, "source": "env" }
  },
  "same_model_review": false,
  "skipped": ["effort", "autocompact-100k"],
  "unknown_ids": [],
  "routing": { "policy": "capability" }
}
```
- **Secrets.** It stores only variable **names**, the base-URL **host**, and
  a boolean codex login. The fingerprint is
  `sha256(provider ids + base_url hosts + sorted env names + ANTHROPIC_DEFAULT_*_MODEL values + codex login + table_version)`.
  **Open sub-choice for the owner:** whether a key *rotation* on the same host
  must trigger re-detection. If yes, add an HMAC of the key under a random
  per-machine salt stored beside the profile, truncated to 8 hex. That is
  never the key and never reversible. **Recommendation: leave it out of v1.**
  The env values already change when a plan changes the served models, and
  the brief's "never the key" is met without any derived-from-secret value.
- **Room for later.** Other Anthropic-compatible hosts become new
  `hosts[].provider` ids plus table entries, with no schema break.
  `hosts[].harness` admits `opencode` later. Cost routing becomes a new
  `routing.policy` value (`"cost"`) plus optional `cost` fields in the table
  that v1 ignores.

---

## D2 — Capability table (`templates/models.json`)

**The question.** What does the shipped table carry, how is it kept current,
and what happens for an unknown id?

### Option A — static shipped table, lint-validated (recommended)
Shape (illustrative):
```json
{ "schema_version": 1, "updated": "2026-10-25",
  "tiers": ["top", "build", "mid", "floor"],
  "providers": {
    "anthropic": { "harness": "claude-code", "match": { "base_url_hosts": ["api.anthropic.com"], "default_when_no_base_url": true },
      "knobs": { "effort": true, "autocompact_window": true },
      "aliases": { "fable": "top", "opus": "build", "sonnet": "mid", "haiku": "floor" },
      "safe_default": { "top": "claude-opus-5-5", "build": "claude-opus-5-5", "mid": "claude-sonnet-5-5", "floor": "claude-haiku-5-5" },
      "models": [
        { "id": "claude-fable-5-1", "line": "fable", "fit": { "top": 1 }, "context_window": 1000000, "effort": true, "thinking": true, "tool_use": "strong", "requires_entitlement": true },
        { "id": "claude-opus-5-5",  "line": "opus",  "fit": { "top": 2, "build": 1 }, "...": "..." } ] },
    "zai":    { "harness": "claude-code", "match": { "base_url_hosts": ["api.z.ai"] }, "knobs": { "effort": false, "autocompact_window": false }, "env_tier_hints": { "ANTHROPIC_DEFAULT_OPUS_MODEL": "build", "ANTHROPIC_DEFAULT_SONNET_MODEL": "mid", "ANTHROPIC_DEFAULT_HAIKU_MODEL": "floor" }, "models": [] },
    "openai": { "harness": "codex", "match": { "codex_login": true }, "knobs": { "effort": true, "autocompact_window": false }, "models": [] } } }
```
- **Fields per model.** `id`, `line`, `fit` (tier → rank, lower is better;
  absence means unfit), `context_window`, `effort` (bool), `thinking` (bool),
  `tool_use` (`strong|ok|weak`), and optional `requires_entitlement`. Optional
  `cost` exists but v1 ignores it.
- **Maintenance.** Hand-edited in plugin releases. A new
  `tools/lint.mjs` check sits next to the AC-12 presets check (**fact**,
  `tools/lint.mjs` ~line 1073): every tier has at least one fitting model per
  provider, ids are unique, `aliases` cover the four tiers, and `safe_default`
  ids exist in `models`. A J2 test pins the Anthropic block.
- **Unknown id** (served by the provider or set in an env var, but absent
  from the table): it is never auto-assigned. It goes into `unknown_ids` and
  prints the journeys "Unknown model id" line. It stays usable through an
  explicit `/tune <agent> <id>`. One exception: an id the user put in
  `ANTHROPIC_DEFAULT_<X>_MODEL` is honoured for that alias's tier with
  `source: "env"` and `tool_use` treated as `ok`. **Inference:** the user's
  own env is a stronger signal than our table.
- **Cost of reversal.** Low. It is a data file behind one resolver.

### Option B — probe-derived only
Anthropic's `GET /v1/models` returns `capabilities.effort`, `thinking`,
`max_input_tokens` and `line` (**fact**,
https://platform.claude.com/docs/en/api/models/list). z.ai documents no such
capabilities on its Anthropic endpoint (**fact, by absence**, on
https://docs.z.ai/devpack/tool/claude). Coverage would be uneven, a probe
would be needed on every change, and there would be no tier *fitness* (an API
cannot say "good reviewer"). **Rejected as the base.** It is used as a
supplement on Anthropic only (D3).

### Option C — table plus a project overlay file
Same as A plus `.claude/models.local.json` to add ids. It costs a second
merge path. **Deferred.** `/tune` already covers "use this id anyway".

**Recommendation: A.** **Strongest case against:** a static table goes stale
when providers ship new models, and GLM ids move fast. The journeys file uses
glm-5.1/4.7/4.5-air; z.ai's current Claude page shows `glm-5.3[1m]` and
`glm-5.3-flash[1m]`. The env-hint path cushions this, because z.ai's own
setup writes the ids into `ANTHROPIC_DEFAULT_*_MODEL`. **What would change
it:** more than two table-staleness bugs per quarter justifies option B's
probe as primary where an API exposes capabilities.

### D2b — Per-role fallback defaults (owner lock 2026-10-25)

The owner locked this verbatim: "each provider should have default models set
for each of our named agent roles to serve as the fallback." This D2b section
decides how that lock relates to tiers.

- **Shape.** Each provider block gains
  `"role_defaults": { "<agent>": { "model": "<id>", "effort": "<lvl>|null" } }`.
  It has one key per file in `agents/`, which today is 20 roles: advisor,
  analyst, architect, backend, brainstormer, business, chronicler, compass,
  curator, designer, devops, frontend, intake, marketing, ops, planner,
  researcher, reviewer, security, writer (**fact**, `ls agents/`).
  Lint fails if a role is missing or extra, or if an id is absent from that
  provider's `models` list.
- **Resolution order** for a role (the first rule that decides wins):
  1. A hand-tuned or composed `/tune` shadow.
  2. The active preset's cell tier, mapped to `profile.tiers[tier].model`,
     when the profile is fresh and that tier is resolved without
     `borrowed`-by-failure.
  3. **`role_defaults[role]` of the detected provider.** This is the
     fallback whenever detection, the probe, or capability resolution can't
     decide: no profile (gap 4), stale profile in a non-interactive child
     (gap 5), an unresolved tier, or an unknown id.
  4. If the provider itself is unknown, print the "unsupported" line and
     fall back to the main session's model (today's `inherit`).
- **What this replaces.** It supersedes the per-tier `safe_default` sketched
  in D2 and D3. The fallback is per role, as locked, not per tier.
- **J2.** The `anthropic.role_defaults` must equal today's
  **balanced-preset** resolution exactly, per `templates/tune-presets.json`
  (**fact**):

  | Roles | Model | Effort |
  |---|---|---|
  | reviewer, advisor, planner | `claude-fable-5-1` | high |
  | architect, compass, backend, frontend, devops, security | `claude-opus-5-5` | medium |
  | researcher, brainstormer, designer, business, marketing, ops, analyst | `claude-sonnet-5-5` | medium |
  | chronicler, writer, curator, intake | `claude-sonnet-5-5` | low |

  This is also consistent with the `model: sonnet` frontmatter on
  analyst/chronicler/writer.
- **Two copies of one truth: guarded by shape.** A lint and test asserts
  `anthropic.role_defaults ≡ resolve(presets.balanced, anthropic tier map)`
  byte-for-byte. The same J2 snapshot fixture (D7 step 1) is the oracle, so
  the two cannot drift silently.
- **zai and openai `role_defaults`.** These are hand-picked from the verified
  GLM and OpenAI ids (unverified item 3). For openai, the role defaults apply
  only to roles routed through `run-codex.mjs` (D6), because the main session
  can't be OpenAI.
- **Strongest case against.** It is a second per-role matrix beside the
  presets, which risks the "one source of truth" pick. The equivalence lint
  makes it a *derived* check for Anthropic. For the other providers it is
  the only per-role data, which is exactly the owner's intent.

---

## D3 — Detection

**The question.** How does session start know the provider? Should it probe
live? How does it detect a change?

**Signals** (cheap, no network):
- `ANTHROPIC_BASE_URL` host: absent means Anthropic; `api.z.ai` means zai;
  any other host means `unsupported` (gap 1).
- `CLAUDE_CODE_USE_BEDROCK` / `CLAUDE_CODE_USE_VERTEX` mean `unsupported` in
  v1. **Assumption:** these variable names stand; verify against
  https://code.claude.com/docs/en/third-party-integrations at build.
- Whether `ANTHROPIC_AUTH_TOKEN` or `ANTHROPIC_API_KEY` is present. The name
  is recorded, never the value.
- The `ANTHROPIC_DEFAULT_{FABLE,OPUS,SONNET,HAIKU}_MODEL` values. **Fact:**
  all four exist (https://code.claude.com/docs/en/model-config).
- Codex: `codex` on PATH plus login state. **Unverified:** the exact
  read-only command (e.g. `codex login status`). Today `tools/run-codex.mjs`
  only discovers "not logged in" reactively from stderr (**fact**,
  lines ~529–531).

### Option A — table and env only, no probe
Fast (well under 1 s) and deterministic. It can't tell whether a Claude plan
serves Fable (gap 2).

### Option B — always probe `/v1/models` (and z.ai's list endpoint)
- Anthropic's list endpoint is documented (**fact**, URL above). Claude.ai
  subscription sessions have no `ANTHROPIC_API_KEY`: the OAuth token lives in
  Claude Code's keychain, and **inference:** a hook cannot reach it. So the
  probe is impossible for the most common Claude user.
- z.ai: a models list exists only on the OpenAI-compatible
  `/api/coding/paas/v4/models` (**unverified**, third-party source:
  https://pypi.org/project/glm-launch/2026.8.1/).
- The SessionStart budget is tight: the existing hooks use a 10 s timeout
  (`hooks/hooks.json`, conform-check), and session start is serial UX.

### Option C — table and env first, bounded opportunistic probe (recommended)
1. Compute the fingerprint from the signals. If it equals the profile's
   fingerprint, exit silently.
2. Otherwise resolve from the table plus env hints.
3. Only when a key variable is present, probe once (`/v1/models` on
   Anthropic; z.ai's list endpoint once verified) with a **3 s hard cap**.
   Use the result to confirm entitlement-gated models (Fable, gap 2) and to
   catch unknown ids.
4. Write the profile atomically and print the journeys lines. A J2 Anthropic
   first run with no change prints nothing.

The other gaps:
- **Probe failed with no profile (gap 4):** use the provider's
  per-role `role_defaults` (D2b) in memory, write **nothing**, print the "Detection failed"
  line, and retry next session.
- **Probe failed with a stale profile present:** keep the table result,
  marked `probe: failed`.
- **Fable on a subscription with no key:** the table assumes it is entitled,
  so J2 stays unchanged. The "Fable not served" line fires only when a probe
  says so, or after a recorded spawn failure. **Inference:** Claude Code
  falls back on a blocked subagent model rather than failing
  (model-config page, availableModels section). A silent downgrade is
  therefore possible and is only caught by the distillate's
  `runtime.model`.
- **Where it runs:** a new `hooks/lib/model-profile.sh` (SessionStart,
  `startup|resume`, timeout 10, silent when `AGENTIC_WORKFLOW_CHILD=1`) calls
  `node tools/models.mjs detect`. `/doctor` and `/connect` call
  `models.mjs detect --refresh`.
- **Non-interactive runs** (`tools/run-claude.mjs`, autopilot children; gap
  5): no SessionStart fires. Every reader goes through
  `models.mjs resolve <tier>`. The resolver recomputes the fingerprint
  without network. On a mismatch or a missing profile, it resolves from the
  table plus env in memory, never writes, and stamps
  `runtime.profile: "stale"` into the distillate.

**Recommendation: C.** **Strongest case against:** a hook that touches the
network at all can stall session start, and it handles a key variable. The
3 s cap and "probe only on fingerprint change" bound it; the key lives only
in the child process's env and is never logged. **What would change it:** if
the probe adds more than 1 s at p95 in the n=1, drop to A plus a reactive
Fable check.

---

## D4 — How the resolution reaches spawns

**The question.** The orchestrator spawns with the Agent tool's `model`
(today an alias or a preset shadow's pinned id). How does a resolved tier
become the model a subagent actually runs on, and how do `/tune` shadows
still win?

Facts (https://code.claude.com/docs/en/sub-agents):
- Subagent model precedence: per-invocation `model` parameter > frontmatter
  `model` > `CLAUDE_CODE_SUBAGENT_MODEL` > the main conversation's model.
- Frontmatter accepts `sonnet|opus|haiku|fable`, a full model ID, or
  `inherit`.
- **The per-invocation parameter's accepted values are not documented**:
  only that family aliases are accepted. Full ids there are **unverified**.
- A family alias resolves to the *main conversation's* model when the main
  model belongs to that family. **Unverified** for GLM ids under
  `ANTHROPIC_DEFAULT_*`.
- The `fable` alias exists, with `ANTHROPIC_DEFAULT_FABLE_MODEL`; unset, it
  means Fable 5.1 (model-config page).
- z.ai's setup sets only OPUS/SONNET/HAIKU (**fact**,
  https://docs.z.ai/devpack/tool/claude). **Inference:** a bare `fable` alias
  on z.ai requests a Claude id from z.ai and fails or falls back. That breaks
  J1.

### Option A — per-spawn id from the profile (recommended, behind a spike)
The orchestrator's spawn rule becomes: `model = shadow.model ??
profile.tiers[presetTier(agent)].model`. On Anthropic, the profile's ids are
exactly today's pinned ids, so J2 holds by construction.
- **Spike first:** confirm the Agent tool's `model` parameter takes a full id
  (`glm-4.7`, `claude-fable-5-1`). It takes about 5 minutes.
- **Tradeoffs.** One source of truth. Nothing is written into tracked files,
  and it works mid-session after a refresh.
- **Reversal.** Cheap.

### Option B — tier → alias, with aliases pinned through env in `.claude/settings.local.json`
The profile writer sets `ANTHROPIC_DEFAULT_{FABLE,OPUS,SONNET,HAIKU}_MODEL`
to the tier ids. Spawns keep passing aliases.
- **Tradeoffs.** It uses documented knobs only.
- **Problems.** It takes effect only at the next session start
  (**inference:** the env is read at launch). It rewrites a user-owned file
  and clobbers the user's own alias mapping.
- **Assumption to verify:** whether `settings.local.json` is git-ignored by
  default.
- **Use:** the **fallback if the A spike fails**, limited to setting the
  FABLE variable only when it is absent.

### Option C — generated `.claude/agents/` shadows carrying `model: <id>`
- **Tradeoffs.** Documented to work. But shadows are tracked, so a teammate
  inherits GLM (gap 7). They also collide with hand tunes, and this repeats
  the exact preset-shadow mess that D7 removes. **Rejected.**

### Option D — `tools/run-claude.mjs` child per role
- **Tradeoffs.** A full env per role is possible. But it costs a process per
  spawn and loses the in-session Agent tool. Keep it for roles already on
  `runtime: claude-p` only.
- **Required change:** `run-claude.mjs` must resolve via the profile. Today
  it maps an alias only when the target starts with `claude-` (**fact**, line
  ~175) and defaults the 100k window (line 49). Both become profile-driven,
  and an unsupported knob prints one "skipped" line.

**Overrides.** A hand or composed `/tune` shadow's `model:` wins (it is
honoured as-is). `/tune` prints "profile would choose: <id> (<tier>)".
- **Gap 3:** if the shadow names an id the current provider doesn't serve
  (an id in another provider's table block, or a `claude-` id on zai), keep
  it, print one line at detection, and offer `/tune <agent> reset`.
- **Effort:** honoured only when the model's table entry has
  `effort: true`; otherwise it is skipped with one line.

**Recommendation: A, with B as a scoped fallback.** **Strongest case
against:** A hinges on undocumented Agent-tool behaviour. A Claude Code
release could narrow the parameter to aliases. The spike plus a contract
test (the distillate's `runtime.model` must equal the profile's tier id)
catches that regression.

---

## D5 — Rules that name Fable become tiers

**Sites (facts, grep):**
- `commands/mission.md` lines 61, 79–83 (rule 7) and 196–203 ("Reviewer
  tier survives…").
- `agents/reviewer.md` lines 20–21 and 205–206.
- `commands/tune.md` lines 93, 109 and 153.
- `templates/WORKFLOW.md` line 416 and the `fable-boundary` rule at 449–450
  (§5 LA-5).
- The `templates/tune-presets.json` description.

`templates/gate-classes.md` already says reviewer tier `top` (lines 26–37).
Only its definition sentence gains "as resolved by the model profile". The
rewrite is mechanical: "Fable" becomes "the top tier"; "non-Fable reviewer
tune" becomes "a reviewer tune below the top tier"; the plan-judge "runs on
the top tier under every preset". The `boundary_escalation: off` escape is
unchanged.

**Same-model review: implementation options.**
- **(A) Orchestrator-computed (recommended).** At each checkpoint the
  orchestrator compares the reviewer's resolved model with the model(s) that
  built the slice. It reads the builders' distillate `runtime.model` (it
  already prints this; **fact**, `templates/distillate.schema.json` line 73),
  so a `/tune` or `mixed` case is judged on what actually ran, not on the
  profile alone. When they are equal:
  - the reviewer brief carries `review_mode: same-model`;
  - the reviewer prints `Same-model review` as the first line of its report;
  - the orchestrator echoes it on the handoff line and in the ledger beat.
  - If the diff's change class has reviewer tier `top` in
    `templates/gate-classes.md`, a **second fresh-context reviewer pass**
    runs with an adversarial framing ("assume one defect exists; find it")
    before the checkpoint can pass.
  - Add a nullable `review_mode` to the distillate schema (an additive
    property; strict mode means also adding it to `required` as nullable).
- **(B) Reviewer self-detects.** Models do not reliably know their own id,
  so this is unreliable. **Rejected.**
- **(C) A hook stamps it.** Hooks can't see which model a subagent ran.
  **Rejected.**

**Strongest case against A:** it adds a step to a hot path. It costs one
string compare, and the second pass fires only on top-class diffs on
degraded providers.

---

## D6 — Mixed, and OpenAI via Codex

- **How a tier maps to Codex.** When `profile.tiers[t].host` is a `codex`
  host, the orchestrator runs the role through `tools/run-codex.mjs --model
  <id> --effort <cell effort>` instead of the Agent tool. **Fact:** that
  adapter path exists today for `runtime: codex` tunes (`commands/mission.md`
  ~190–203). Its hard default `gpt-6-astra` (**fact**, `run-codex.mjs` line
  ~81) becomes "the profile's id for the role's tier". The J4 rule "reviewer
  prefers a model different from build's" is a tie-break in the resolver:
  among top-fit models within one rank of the best, prefer a different host
  or line than `build`'s.
- **Can the main session be non-Claude?** The main session is Claude Code,
  so it needs an Anthropic-compatible endpoint (Anthropic or z.ai in v1).
  **Inference:** an OpenAI-only user cannot start the main session at all
  under Claude Code, and non-Claude harnesses are NOT in v1 (brief).
- **What v1 does:** OpenAI via Codex is supported as a **tier provider**
  (mixed) beside an Anthropic or z.ai main session. If detection finds only
  a codex login and no usable main provider, it prints one line: "OpenAI-only
  isn't supported as the main session in v1. Roles can run on Codex once a
  Claude or z.ai main session exists." It writes nothing.
- **Owner flag:** "Launch providers: OpenAI via Codex" is therefore delivered
  as *mixed*, not *OpenAI-only*. The approval package should say this
  plainly.
- **Strongest case against:** a user reading "OpenAI supported" will try
  OpenAI-only. The fix is to state it in the copy, not to stretch the scope.

---

## D7 — Migration

1. **J2 snapshot first.** Before any edit, generate
   `tools/fixtures/model-resolution/anthropic-v1.json` from the current
   `tune-presets.json`: preset × agent → {model id, effort, runtime,
   maxTurns, compact_window}. This is the red-on-old / green-on-new oracle.
   The same fixture's `balanced` slice is the oracle for
   `models.json` `anthropic.role_defaults` (D2b).
2. **`tune-presets.json` schema_version 2.**
   - Cells carry `tier` in place of `model`.
   - The top-level `models` and `tier_aliases` move into
     `templates/models.json`'s anthropic block.
   - `effort`, `runtime`, maxTurns and the like stay.
   - A test resolves every cell through an Anthropic profile and
     byte-compares it with the snapshot. Mapping: fable→top, opus→build,
     sonnet→mid, haiku→floor (needs D0's four tiers).
3. **Preset shadows stop pinning models.**
   - `tools/preset.mjs` writes a shadow only for non-model differences
     (effort, runtime, maxTurns).
   - Model choice for a preset agent comes from `§10 Tune preset` →
     cell tier → profile, at spawn (D4-A).
   - Existing preset-only shadows (banner `preset:<name>`, base sha via
     `sha12`; **fact**, `tools/preset.mjs` lines 33 and 83) are rewritten by
     `/sync`: drop `model:`, keep the rest, re-stamp the banner with the
     current base hash, and delete the file if nothing differs from the base.
   - **Hand and composed shadows are never touched.** They are reported per
     D4 gap 3.
4. **Conform ladder rung.** Add `{ id: 'preset-tier-only', since: '1.70.0' }`
   to `tools/conform.mjs`. It flags any `.claude/agents/*.md` whose banner
   names a `preset:` *and* whose frontmatter pins `model:`, with the fix "run
   /agentic-workflow:sync". It stays filesystem-only, as conform must. The
   profile itself is not a rung, because it is a local cache owned by the
   hook.
5. **`/sync`** applies step 3 and re-copies the protocol master (the
   §5 LA-5 tier wording).
6. **`tools/agents.mjs`** `overrideKind` keeps treating `model` as an
   override kind (**fact**, line ~110). After step 3, preset shadows no
   longer register as `model` overrides, which is correct.

**Reversal cost:** moderate. Schema v2 is a one-way data change, but the
snapshot fixture makes a revert verifiable.

---

## Files the build will touch

- **New**
  - `templates/models.json`
  - `tools/models.mjs` (detect / resolve / fingerprint / atomic write)
  - `hooks/lib/model-profile.sh`
  - `tools/fixtures/model-resolution/` (the J2 snapshot plus four provider
    env fixtures for J3, and a mixed fixture for J4)
  - the tests next to the existing `tools/*.test.mjs` pattern (**assumption**
    on test location; check `tools/lint.mjs` and its test runner)
- **Edit**
  - `hooks/hooks.json` (SessionStart entry)
  - `templates/tune-presets.json` (schema 2)
  - `tools/preset.mjs`
  - `tools/run-claude.mjs` (resolve via profile; knob skip lines)
  - `tools/run-codex.mjs` (default model from profile)
  - `tools/conform.mjs` (rung)
  - `tools/lint.mjs` (models.json check; presets check updated to tiers)
  - `tools/agents.mjs` (if override reporting needs "profile would choose")
  - `templates/distillate.schema.json` (`review_mode`)
  - `commands/mission.md`
  - `commands/tune.md`
  - `commands/doctor.md`
  - `commands/connect.md`
  - `commands/sync.md`
  - `agents/reviewer.md`
  - `templates/gate-classes.md`
  - `templates/WORKFLOW.md` (§5 LA-5, the `fable-boundary` rule, the §10
    Runtimes text)
  - `docs/WORKFLOW.md` (via `/sync`)
  - `docs/product/decisions/2026-10-25-provider-adaptive-journeys.md`
    (profile path wording; the `mid` tier)
  - the plugin version bump files

## Unverified facts (resolve during build)

1. Whether the Agent tool's per-invocation `model` parameter accepts full
   model ids, which D4-A rests on. The docs only confirm family aliases.
2. How a family alias resolves when the main session runs a GLM id via
   `ANTHROPIC_DEFAULT_*` ("same family → main model" rule).
3. Current GLM model ids and tiers: z.ai's page shows `glm-5.3[1m]` /
   `glm-5.3-flash[1m]`, and the journeys file uses glm-5.1/4.7/4.5-air. The
   page's two config blocks also conflict with each other.
4. z.ai's models-list endpoint and auth: third-party claim only.
5. A read-only codex login-status command.
6. That a hook cannot reach a Claude.ai subscription's OAuth token, so no
   probe is possible for subscription users.
7. Bedrock/Vertex env var names, used here only for the "unsupported" line.
8. Whether `.claude/settings.local.json` is git-ignored by default (D4-B
   fallback only).

Sources: https://code.claude.com/docs/en/model-config ·
https://code.claude.com/docs/en/sub-agents ·
https://docs.z.ai/devpack/tool/claude ·
https://platform.claude.com/docs/en/api/models/list ·
https://pypi.org/project/glm-launch/2026.8.1/

## Orchestrator note on D4 (2026-10-25) — verified, supersedes D4's primary option

The Agent tool's `model` parameter is an enum of aliases only — `sonnet | opus |
haiku | fable` (verified from the orchestrator's own Agent tool schema in this
session). Full model ids cannot be passed per call, so D4's primary option
fails. Proposed replacement, which needs no write to any settings file:

- The profile maps each tier to an **alias per provider**: anthropic top=`fable`,
  build=`opus`, mid=`sonnet`, floor=`haiku`; zai top=`opus`, build=`opus`,
  mid=`sonnet`, floor=`haiku` (z.ai's setup maps only opus/sonnet/haiku via
  `ANTHROPIC_DEFAULT_*_MODEL`, so `fable` is never used on zai).
- The provider's own env mapping turns the alias into the real model; the
  profile READS `ANTHROPIC_DEFAULT_{OPUS,SONNET,HAIKU,FABLE}_MODEL` to record
  the resolved id (for the same-model check and the session-start line), and
  never writes it.
- `run-claude.mjs` / `run-codex.mjs` children (D6, mixed) can still take full
  ids, because they set the child's own env and flags.
- The D4 fallback (writing `ANTHROPIC_DEFAULT_FABLE_MODEL` into
  `.claude/settings.local.json`) is dropped: the plugin does not edit settings.

## Counsel (2026-10-25) — two Fable advisors, both "proceed smaller"

- **Technical — proceed-with-changes.** After the D4 fact (Agent `model` is an
  alias enum), the profile cannot pick a model id per spawn on z.ai: the user's
  `ANTHROPIC_DEFAULT_*_MODEL` env decides. A full-id capability table and
  per-role id defaults are inert there; per-role defaults survive only as
  aliases. The schema-2 / four-tier / shadow-rewrite / conform-rung migration
  buys Claude users nothing and adds session-start output (breaks J2); presets
  can name aliases instead (~135 strings, no schema bump). Probe the z.ai
  aliases with a real key before building. No network probe in SessionStart
  (env fingerprint only; probe in `/doctor --refresh`). Defer mixed/Codex
  (plan lapsed; reviewer on run-codex is unexercised). Keep the same-model
  label; make the second pass opt-in until one GLM run measures its cost.
  Estimate: full shape 7+, alias cut 3–4.
- **Financial — proceed-smaller.** No GLM-only user exists and the owner has no
  z.ai key, so J1 is untestable in-mission; the static id table is stale before
  the first commit (planning docs already disagree on GLM ids); the second
  pass doubles review cost on GLM; the "Fable" string edits overlap the
  xyz-rebrand (Estimate 5, PR #152). Cheapest version: presets name tiers that
  map to aliases + a one-line session-start notice. Estimate: full 5 (+1 live),
  cheap 1, sequenced after the rebrand.
- **What would change both minds:** a 5-minute probe with a z.ai key showing
  subagents spawned as `opus`/`sonnet`/`haiku`/`fable` run on the mapped GLM ids.
