# Provider-adaptive models — journeys and terminal text

_Designer, 2026-10-25. Companion to `2026-10-25-provider-adaptive-brief.md`
(owner picks locked there; nothing here reopens them). The "UI" is terminal text,
so the deliverable is the exact words per state._

## Vocabulary (one term per concept; use these everywhere)

| Term | Means | Never say |
|---|---|---|
| **provider** | who serves the models: Anthropic, z.ai (GLM), OpenAI (Codex) | backend, vendor, host |
| **tier** | a job size: `top` (hardest review/judging), `build` (everyday work), `floor` (cheap, fast, high-volume) | class, level |
| **model profile** | `.claude/model-profile.json`: the file mapping each tier to a real model id. Holds provider id + variable names, never keys | config, routing table |
| **override** | a `/tune` choice that beats the profile | pin |
| **same-model review** | the reviewer and the builder ran on the same model | self-review |

Model ids below (`glm-5.1`, `glm-4.7`, `glm-4.5-air`, `gpt-5.5`) are
**illustrative**; the shipped capability table supplies the real ones. Claude ids
are real (`claude-fable-5-1`, `claude-opus-5-5`, `claude-sonnet-5-5`,
`claude-haiku-5-5`).

## Output rules (all states)

- SessionStart output is **≤ 3 lines**, action first, one leading marker `🧭`
  on line 1 only (matches conform `--brief`, `mission-budget.sh`; the plugin's
  hooks use one marker, and plain-report forbids decoration beyond that).
- Line 1 = what happened or what to do. Line 2 = the detail. Line 3 = the
  command to act, only when the user can act.
- Nothing prints when nothing changed (J2, "unchanged" rows). Silence is the
  success state.
- `{...}` are filled at runtime. The key value is never printed; only variable
  names (`ANTHROPIC_AUTH_TOKEN`) and the provider id.
- Tier order in text is always top, build, floor.

---

## J1. First run, GLM only

**Trigger.** SessionStart; `.claude/model-profile.json` missing;
`ANTHROPIC_BASE_URL` host is `api.z.ai`, `ANTHROPIC_AUTH_TOKEN` set, no Claude or
Codex login found.
**Aha moment.** The first mission runs with zero `/tune` calls. Friction budget
before it: zero typed commands. One printed notice, nothing to confirm.
**Default justified.** Auto-write the profile (owner pick: "auto at session
start"). Undo = delete the file; the next session re-detects. No confirmation
prompt, forgiveness over asking.

| State | Terminal text (exact) |
|---|---|
| **First detection, all tiers fit** | `🧭 Models set up for z.ai (GLM): no tuning needed. A "tier" is a job size; each now has a model.`<br>`top → glm-5.1 · build → glm-4.7 · floor → glm-4.5-air (saved to .claude/model-profile.json, no keys stored).`<br>`Change one with /agentic-workflow:tune; re-check with /agentic-workflow:doctor.` |
| **Unchanged (every later session)** | _(prints nothing)_ |
| **Degraded: same-model review** (GLM has one model good enough for top and build) | `🧭 Models set up for z.ai (GLM): no tuning needed. A "tier" is a job size; each now has a model.`<br>`top and build both use glm-5.1, so reviews run on the same model that built the work ("same-model review"). Risky changes get a second review pass to make up for it.`<br>`Nothing to do. /agentic-workflow:doctor shows the full list.` |
| **Degraded: skipped knob** | `🧭 Models set up for z.ai (GLM) ...` (as above, line 1)<br>`top → glm-5.1 · build → glm-4.7 · floor → glm-4.5-air. Skipped: per-agent effort and the 100k Haiku compact window (Claude-only).`<br>`Nothing to do. This is expected on GLM.` |
| **Degraded: a tier has no fitting model** (e.g. no floor-class model served) | `🧭 Models set up for z.ai (GLM), but the floor tier has no cheap model there, so it borrows build's glm-4.7.`<br>`top → glm-5.1 · build → glm-4.7 · floor → glm-4.7 (borrowed). Cheap jobs will cost more than on Claude.`<br>`Nothing to do. /agentic-workflow:doctor explains the borrow.` |
| **Detection failed / offline** (probe timed out, no network) | `🧭 Could not check which models your provider serves (no connection), so I used the safe defaults for z.ai (GLM): glm-4.7 for every tier.`<br>`Nothing is saved; I will check again next session.`<br>`To retry now: /agentic-workflow:doctor` |
| **Detection failed, provider unrecognised** (base URL is not one of the four) | `🧭 Provider not recognised: {host}. v1 supports Anthropic, z.ai (GLM), and OpenAI via Codex, so no model profile was written.`<br>`Roles will ask for Claude models and may fail on your provider.`<br>`Point ANTHROPIC_BASE_URL at a supported provider, or run /agentic-workflow:tune to name models by hand.` |
| **Unknown model id** (provider serves an id the table doesn't know) | `🧭 Your provider serves {id}, which the capability table doesn't know yet. I left it out and kept {id2} for the {tier} tier.`<br>`Nothing to do. To use {id} anyway: /agentic-workflow:tune {agent} {id}.`<br>`(omit line 3 when no alternative was needed)` |

**Data-model note (architect).** The profile needs a `provider`, per-tier
`model`, per-tier `borrowed: true|false`, `skipped: []`, `detected_at`, and a
fingerprint of (base URL host, variable names present, codex login present),
never values; the fingerprint is what J3 compares. Leave room for cost and
benchmark fields without a schema break (brief).

---

## J2. Claude user, nothing changes

**Trigger.** SessionStart on Anthropic (default URL, Claude login or
`ANTHROPIC_API_KEY`).
**Aha moment.** There is none to add; the feature is invisible. Friction: zero.

| State | Terminal text (exact) |
|---|---|
| **First detection** | _(prints nothing.)_ Profile is written silently: top → `claude-fable-5-1`, build → `claude-opus-5-5`, floor → `claude-haiku-5-5`, resolving to the same ids every preset gets today (byte-compared in tests). |
| **Unchanged** | _(prints nothing)_ |
| **Degraded: detection offline** | _(prints nothing.)_ Claude is the default; falling back to the current table changes nothing. The profile is not rewritten. |
| **Degraded: Fable not served on this plan** | `🧭 Your Claude plan doesn't serve claude-fable-5-1, so the top tier uses claude-opus-5-5. Reviews of risky changes get a second pass.`<br>`Nothing to do.` _(Only case in J2 that prints; it is a real change from today.)_ |
| **Unknown model id** | _(prints nothing; the known Claude ids are used.)_ Surfaced only in `/doctor`. |

Rule: if J2 ever prints a line other than the row above, that is a test failure
(brief: "no new output beyond what conform prints").

---

## J3. Provider switch

**Trigger.** SessionStart; profile exists, but the fingerprint differs (base URL
host, key variable name, or Codex login changed).
**Aha moment.** The user switches providers and the next mission just works.
Friction: zero; one line tells them what moved.
**Default justified.** Rewrite automatically (owner pick). An existing `/tune`
override is kept and named so it is not silently lost.

| State | Terminal text (exact) |
|---|---|
| **Changed: Claude → GLM** | `🧭 Provider changed from Anthropic to z.ai (GLM), so I remapped the tiers: top → glm-5.1 · build → glm-4.7 · floor → glm-4.5-air.`<br>`Skipped on GLM: per-agent effort and the 100k Haiku compact window.`<br>`Nothing to do. Undo by switching the provider back; the next session remaps again.` |
| **Changed: GLM → Claude** | `🧭 Provider changed from z.ai (GLM) to Anthropic, so I remapped the tiers: top → claude-fable-5-1 · build → claude-opus-5-5 · floor → claude-haiku-5-5.`<br>`Nothing to do.` |
| **Changed, overrides present** | line 1 as above<br>`Kept your /tune overrides: {agent}={id}[, ...]. {n} of them name a model your new provider doesn't serve.`<br>`Fix with /agentic-workflow:tune {agent} --reset (back to the profile).` _(omit "{n} of them" clause when 0; then line 3 is `Nothing to do.`)_ |
| **Unchanged** | _(prints nothing)_ |
| **Degraded: same-model review after switch** | line 1 as above<br>`top and build now share {id}: reviews are "same-model review", and risky changes get a second pass.`<br>`Nothing to do.` |
| **Degraded: detection failed / offline at switch** | `🧭 Your provider changed to {host}, but I couldn't check which models it serves (no connection). Keeping the old model profile, which may ask for models {host} doesn't have.`<br>`I will retry next session.`<br>`To retry now: /agentic-workflow:doctor` |
| **Degraded: skipped knob** | covered by the "Skipped on GLM" line above; on a switch to Codex: `Skipped on OpenAI (Codex): the 100k Haiku compact window.` |
| **Degraded: no fitting model for a tier / unknown id** | same text as J1 rows (single wording, one place in code). |

Same state also fires from `/agentic-workflow:connect` and `/doctor --refresh`
with identical wording, prefixed by the command's own header (not the hook).

---

## J4. Mixed (several providers answer)

**Trigger.** SessionStart (or `/connect`) finds more than one provider usable,
e.g. z.ai URL set plus a Codex login, or Claude plus a GLM key.
**Aha moment.** The reviewer is a different model family from the builder
without the user choosing it. Friction: zero.
**Default justified.** Per tier, take the best available model from the
capability table; prefer a reviewer model different from build's. A user who
doesn't like it uses `/tune` (override).

| State | Terminal text (exact) |
|---|---|
| **First detection** | `🧭 Found two providers (z.ai GLM and OpenAI Codex), so each tier uses the best model available: top → gpt-5.5 · build → glm-4.7 · floor → glm-4.5-air.`<br>`Reviews run on a different model than the one that built the work.`<br>`Change one with /agentic-workflow:tune; see why in /agentic-workflow:doctor.` |
| **Unchanged** | _(prints nothing)_ |
| **Changed (a provider added or lost)** | `🧭 Providers changed ({old} → {new}), so I remapped: top → {id} · build → {id} · floor → {id}.`<br>`{Reviews now run on a different model. \| Reviews are same-model review now; risky changes get a second pass.}`<br>`Nothing to do.` |
| **Degraded: same-model review** | as J1 same-model row, but line 2 ends: `Add another provider to get an independent reviewer.` |
| **Degraded: one provider's probe failed** | `🧭 Found z.ai (GLM) but could not check OpenAI Codex (not logged in or offline), so I mapped every tier to GLM only.`<br>`top → glm-5.1 · build → glm-4.7 · floor → glm-4.5-air. Reviews are same-model review for now.`<br>`Log in to Codex, then /agentic-workflow:doctor --refresh.` |
| **Degraded: skipped knob / no fitting model / unknown id** | same wording as J1 rows; skipped knobs are listed per provider that lacks them. |

---

## Touchpoint: `/doctor`

Adds a **Models** block to the existing doctor report (owner-readable, so a
table is fine). Always shows the whole truth, including the quiet J2 cases.

```
Models (profile written {date}, provider: z.ai GLM)
  tier    model         why
  top     glm-5.1       strongest GLM in the capability table
  build   glm-4.7       best build-class GLM
  floor   glm-4.5-air   cheapest fast GLM
Reviews: same-model review (top and build share glm-5.1) — risky changes get a second pass.
Skipped on this provider: per-agent effort; 100k Haiku compact window.
Overrides: none.   Keys: ANTHROPIC_AUTH_TOKEN is set (value never read into the profile).
Refresh: /agentic-workflow:doctor --refresh
```

Failure lines: `Provider check: failed (no connection). Using the saved
profile from {date}.` and `Unknown model id in profile: {id}. Run --refresh.`
`--refresh` prints the same one-liner a J3 change would, or `Models unchanged.`

## Touchpoint: `/tune` (override)

`/tune` becomes optional. Before writing, it states what the profile would
have chosen, then the override takes effect and wins.

| State | Terminal text (exact) |
|---|---|
| **Override set** | `Set {agent} to {id}. The model profile would have used {profile-id} (tier {tier}); your choice wins until you run /agentic-workflow:tune {agent} --reset.` |
| **Override matches profile** | `{agent} already gets {id} from the model profile; nothing to change.` |
| **Override names a model the provider doesn't serve** | `Not set: {provider} doesn't serve {id}. The model profile uses {profile-id} for {agent}.`<br>`Pick from: {served list}, or leave it. (Refused, not saved.)` |
| **Override went stale after a switch** | surfaced by the J3 "overrides present" line. |
| **Preset applied** | `Preset "{name}" now picks tiers, not model names: {n} agents map to top/build/floor, resolved by your provider.` |

## Touchpoint: reviewer report line (same-model review)

First line of the reviewer's verdict block (reports are read by the owner, so
define it in place):

`Same-model review: this reviewer ran on {id}, the same model that built the work. It still read the change in a fresh context, but expect fewer independent catches. Risky change classes get a second adversarial pass (below).`

When the second pass runs, its heading: `Second pass (adversarial, same model): {class}.`
When models differ: `Reviewer: {id}, different from the builder ({id}).`
Never omit the line on same-model; its absence must mean "independent".

---

## Gaps the brief missed

1. **Unrecognised provider** (e.g. OpenRouter URL): v1 supports four; the user
   needs a clear "not supported, here is what to do", not a silent Claude-id
   failure. Wording above (J1).
2. **Claude plan without Fable**: J2 stays "unchanged" only if every plan serves
   Fable; it may not. One printed row above, and a test fixture.
3. **Stale overrides after a switch**: `/tune` shadows with Claude ids become
   errors on GLM. Brief says overrides win; it doesn't say what happens when
   they can't. Proposal: keep, report, offer `--reset` (J3).
4. **Detection failure with no profile at all**: safe default (build model for
   every tier), write nothing, retry next session. Needs the architect to pick
   the default per provider.
5. **Subagent/background runs** (`run-claude.mjs`, autopilot ticks) have no
   SessionStart; they read the profile but never print. Needs a stale-profile
   rule (profile older than N days or fingerprint mismatch → warn once at the
   next interactive start).
6. **Concurrent sessions/worktrees**: two sessions racing to write the profile.
   Atomic write; last writer wins; fingerprint makes it idempotent.
7. **Committed vs local profile**: profile is machine-specific (keyed to the
   user's provider) and must be gitignored, or a teammate on Claude inherits
   GLM tiers. The brief says "project model profile"; recommend local-only.
