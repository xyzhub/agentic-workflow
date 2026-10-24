# Provider-adaptive model assignment — feature brief

_Drafted 2026-10-25 by the orchestrator via `/agentic-workflow:plan`. Source: the
owner, in session ("what if someone does not have access to Claude and only has
GLM"; "the agentic-workflow should know which model to assign to based on the
model capability and available provider and should create a profile that
handles all that so the user does not have to tune individual models just to
get the agentic-workflow to work"). Supersedes the narrower `glm-runtime` idea
(a per-agent `/tune <agent> glm` runtime), which becomes this mission's
`mixed` case._

## Problem

The workflow assumes Claude models exist. A user with only a z.ai (GLM) key, or
only an OpenAI/Codex plan, can start Claude Code against their provider but the
workflow then asks for models their provider does not serve:

- `templates/tune-presets.json` pins exact Claude ids per agent per preset
  (`models`: claude-fable-5-1 / opus-5-5 / sonnet-5-5 / haiku-5-5; ~135 refs);
  any preset write puts a Claude id into a `.claude/agents/` shadow.
- Rules name a model, not a capability: "the plan-judge runs on Fable"
  (`commands/mission.md` rule 7 and ~line 79), "Fable for boundary-class
  reviews", `templates/gate-classes.md` reviewer tier `top` (= Fable today).
- The orchestrator spawns agents with Claude Code's `model` aliases
  (opus/sonnet/haiku/fable). z.ai maps opus/sonnet/haiku through
  `ANTHROPIC_DEFAULT_{OPUS,SONNET,HAIKU}_MODEL`; whether `fable` maps is
  unverified.
- Claude-only knobs (per-agent `effort`, Haiku's 100k autocompact window in
  `tools/run-claude.mjs`) have no meaning, or a different one, elsewhere.

What already works: Claude Code runs against z.ai's Anthropic-compatible
endpoint (`ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic`,
`ANTHROPIC_AUTH_TOKEN`; docs.z.ai/devpack/tool/claude); the handoff hooks read
`CLAUDE_CODE_AUTO_COMPACT_WINDOW`; `tools/run-claude.mjs` and
`tools/run-codex.mjs` already run a role as a child process with its own env.

## Owner interview (verbatim picks, 2026-10-25)

- **Locked direction:** "the agentic-workflow should know which model to assign
  to based on the model capability and available provider and should create a
  profile that handles all that so the user does not have to tune individual
  models just to get the agentic-workflow to work." `/tune` stays for optional
  overrides only.
- **Launch providers:** Anthropic (Claude), z.ai GLM, OpenAI via Codex, Mixed per
  tier.
- **Same-model review:** "Label + extra pass" — review still runs in a fresh
  context; the report says "same-model review"; risky change classes get a
  second adversarial pass. No owner action needed.
- **Presets:** "Tiers only" — presets name top/build/floor; the provider profile
  turns tiers into real model ids. One source of truth.
- **Detection:** "Auto at session start" — if the profile is missing or the
  provider changed (base URL / key), probe and rewrite it; `/doctor` and
  `/connect` can refresh it on demand.
- **Per-role provider defaults (owner, 2026-10-25, verbatim):** "each provider
  should have default models set for each of our named agent roles to serve as
  the fallback." → the shipped table carries, per provider, a default model for
  every named agent role (reviewer, planner, architect, frontend, backend, …);
  when detection or capability resolution can't decide, the role's provider
  default is used.
- **Not in v1 (deferred, not denied):** other Anthropic-compatible hosts
  (OpenRouter, Bedrock, Vertex, Kimi, DeepSeek); cost-aware routing; live
  benchmark scoring; a non-Claude-Code harness (OpenCode etc.) on GLM.
- **Done when:** GLM-only live mission; provider-switch test; Claude unchanged.
- **Priority:** next mission, standard posture (one Fable checkpoint before the
  PR; the owner merges).

## Acceptance criteria

Per journey (the designer's journeys file names them J1–J4):

- **J1 — first run on a GLM-only machine.** With only `ANTHROPIC_BASE_URL` +
  `ANTHROPIC_AUTH_TOKEN` for z.ai set, the first session start writes the
  project model profile with every tier resolved to a GLM model, prints ≤ 3
  lines saying so (provider, tier → model, any degradations), and a 1-session
  mission then runs end to end with **zero `/tune` calls** and no Claude model
  id requested anywhere.
- **J2 — Claude user, nothing changes.** On Anthropic, every role resolves to
  exactly the model it gets today under each preset (byte-compared against the
  pre-change resolution table); no new output on session start beyond what
  conform already prints.
- **J3 — provider switch.** Changing the base URL or key (or the codex login)
  is detected at the next session start; the profile is rewritten and the
  change is reported in one line. Tests cover all four providers with fixtures.
- **J4 — mixed.** When several providers answer, each tier takes the best
  available model per the capability table; the reviewer tier prefers a model
  different from the build tier's when one is available.
- **Degradation is visible.** Same-model review → the reviewer's report says
  "same-model review" and top-tier change classes get a second adversarial
  pass; an unsupported knob (effort, 100k autocompact) prints one "skipped"
  line, never fails silently.
- **Overrides still win.** An existing `/tune` shadow or preset is honoured on
  top of the profile; `/tune` reports what the profile would have chosen.
- **Secrets.** Keys are never written to the profile, a ledger, a trace or a
  committed file — only the variable names and the provider id.
- `node tools/lint.mjs` clean; new tests red on the old tree, green on the fix.

## NOT in v1

Other Anthropic-compatible hosts; cost-aware routing; live benchmark scoring;
non-Claude-Code harnesses on GLM. The profile format must leave room for the
first two without a schema break.

## Locked decisions

_Approved 2026-10-25 by the owner at the single approval moment, after the
architect memos (D0–D7 + the orchestrator's verified D4 note) and two Fable
advisors (technical: proceed-with-changes; financial: proceed-smaller). Counsel
is in `2026-10-25-provider-adaptive-memos.md` § Counsel._

- **L1 — Scope: "Alias profile, 2 sessions".** Presets name tiers that map to
  Claude Code aliases (`fable`/`opus`/`sonnet`/`haiku`) — no model ids in
  presets, no schema-2 / four-tier id migration, no shadow rewriting, no
  conform rung that fires for Claude users. The owner's per-role defaults ship
  as an **alias per role per provider** (e.g. reviewer = `fable` on anthropic,
  `opus` on zai). A local, untracked profile is derived from the environment
  only (base URL host, key variable NAMES, `ANTHROPIC_DEFAULT_*_MODEL` values;
  no network, no secrets); a ≤ 3-line session-start report; the same-model
  label; "Fable" → "top tier" in rules. Anthropic resolution byte-identical to
  today (J2). **Deferred:** mixed + OpenAI/Codex routing, live probing at
  session start, a model-id capability table. Estimate: 2 sessions.
- **L2 — Probe first.** Before session 1 the owner provides a z.ai key (trial
  is fine) and the orchestrator runs a ~5-minute probe: subagents spawned as
  `opus`/`sonnet`/`haiku`/`fable` under z.ai's env — which GLM id each lands on.
  The mission does not start until the probe result is recorded here.
- **L3 — Same-model review: label now, second pass opt-in.** Every same-model
  review is labelled "same-model review"; the second adversarial pass is a
  switch, off by default, until one GLM run measures its cost. (Supersedes the
  interview's "label + extra pass".)
- **L4 — Sequence: after the xyz-rebrand mission** (plan PR #152), so the
  "Fable" lines are edited once.
- **L5 — Gate policy:** human-merge; one Fable checkpoint before the PR (the
  interview's "next mission, standard" posture, now queued after the rebrand).
