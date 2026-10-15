# Counsel brief — xyz-rebrand (2026-10-16)

Advisors: technical (Fable), financial (Fable). Inputs: the brief, memos
(D1–D6), journeys, metrics, the goal statement, past ledgers.

## Verdicts

| Lens | Verdict |
|---|---|
| Technical | **Proceed with changes** |
| Financial | **Proceed with changes** (P1 only; native `renames` instead of the frozen old build) |

## Where they agree

- **Default to the native `renames` map (D2-A)** unless installs exist on
  machines the owner does not control. The frozen-old-build plan (D2-C) only
  serves a "keeps working until you move" promise the owner never asked for,
  and its parts (git-subdir self-reference, tag push, renames + listed name)
  are untested.
- **The estimate is low.** Past record: missions of ≥ 4 sessions overran.
  Honest size is 4–5 sessions including the follow-on Orderly and Missions
  migrations; record those as obligations with estimates.
- **Missions breaks on move day** (it reads the plugin from the old cache
  path); its change list must exist before the owner installs `xyz`.

## Technical conditions

1. If D2-C survives: cut the frozen build before P1 and land the rename and
   the dual marketplace entry in one PR — never a `main` with no entry for old
   installs; the frozen build's sync/tune/bootstrap refuse when `xyz` is on.
2. New hooks read `XYZ_CHILD || AGENTIC_WORKFLOW_CHILD` during overlap.
3. `rename.mjs` also rewrites `pluginConfigs` and reports (never rewrites)
   `permissions.allow` rules that name the old plugin.
4. Line-level `legacy-name` allowlist markers, not whole-file exemptions.
5. Drop the new `xyz:` hook-message prefix from this mission (behaviour change).
6. Two scratch-marketplace probes (git-subdir install; renames + listed name)
   before D2 is final.

## Financial points

- The rebrand moves none of the goal statement's metric 1; its payoff is
  reach, which has no public front until E3.
- The goal statement (amendment, decision 10) left open "The XYZ Protocol as
  public name with the `agentic-workflow` slug unchanged" — the cheapest
  option; the brief records no reason it lost.
- Keeping the GitHub repo slug leaves two names at a different seam; either
  rename the repo in the same PR (GitHub redirects) or record the rename as
  knowingly partial.

## What would change their minds

- Evidence of installs outside owner-controlled machines → D2-C earns its keep.
- A dated E3 publish target within ~6 weeks → the reach payoff is near enough.
