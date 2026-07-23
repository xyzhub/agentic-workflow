# Roadmap

_Source: a four-lens **Fable advisor council** convened 2026-07-23
(product-strategy · systems-architecture · ecosystem-adoption · skeptic/red-team),
triggered by the governance beat-enforcer Stop-hook loop. All four lenses
converged, independently, on one diagnosis and one near-term priority._

## The diagnosis

**Velocity is outrunning verification and validation.** The Stop-hook loop was
the shared exhibit: the plugin ships hook *behavior* while CI only checked hook
*structure* (`bash -n`), on an **n=1 validation loop** — the only user is this
repo, so evals measure protocol *compliance*, not that the protocol helps anyone.
The sharpest framing (skeptic): reviews validated prose and structure but never
executed a hook against a payload, and the feature kill-criteria (commons
"measurably better output", governance "nudges get heeded") were **never run**.

The through-line: **freeze net-new features; verify what the hook layer does, and
validate what's already shipped, before building more.**

## NOW — verify before building

| Item | Status |
|---|---|
| **Hook dispatch test harness** (`tools/hook-test.mjs`, wired into `tools/lint.mjs`) — pipe fixture stdin through each `hooks.json` command, assert exit code + nudge | ✅ shipped v1.39.2 (PR #26) |
| **Beat-enforcer skips approved / awaiting-human beats** (anchored to bold status markers) | ✅ shipped v1.39.2 (PR #26) |
| **Extract inline-JSON hooks → tested `.sh` files** — the 2,900-char one-line shell programs are unreviewable/undiffable | ⬜ |
| **Demote `compass` live §12 alert → shadow / on-demand** — it was rated riskiest and prescribed shadow-mode-first, but shipped live; measure its false-alarm rate before it interrupts | ⬜ |

## NEXT — validate what exists

- **External-repo validation sprint** — run `/agentic-workflow:adopt` on 2–3 real
  third-party repos; score ceremony-vs-value against the kill criteria; log every
  §10 profile surgery. This is the core bet's untested n=1 assumption.
- **Second-user smoke test, gating releases** — fresh install → `/agentic-workflow:welcome`
  → first session on a fixture repo the author didn't shape. The loop bug was a
  first-run-for-others failure; this catches that class.
- **Measure the governance felt-test** — record the nudge heed-vs-ignore rate over
  real use; dedupe the thread-keeper banner when unchanged if it reads as wallpaper.
- **Consolidation release + surface-area freeze** — cut the Unreleased block into
  versioned releases; no net-new agent/command without retiring one (currently
  ~20 agents / 26 commands); measure command usage and prune the unused.
- **Modularize `WORKFLOW.md`** — core ≤ 400 lines; §11–§14 (autopilot / owner-channel
  / portfolio / publishing) as referenced opt-in sub-files.

## LATER — strategic

- **Run the real kill-criteria that were never executed** — the commons de-slop
  before/after quality test (on sonnet), or freeze commons expansion.
- **Decide explicitly: personal tool vs. public product** (record it in the
  decision log). If public, the defensible wedge is **"the only plugin that tests
  its prompts"** — the evals + the new hook harness — not lifecycle breadth, which
  Superpowers / BMAD / Anthropic's own Founder's Playbook already cover. If
  personal, stop paying the onboarding/marketplace tax.

---

_This roadmap is advisory counsel, not a commitment. The human owns what gets
built and in what order._
