---
description: Shape a raw, fuzzy idea into a chosen direction — a short interview, then the brainstormer drafts 2–3 genuinely distinct framings, you pick one, and it seeds docs/product/idea.md ready for the researcher to validate. The workflow's own front door for an unformed idea.
argument-hint: '"<a raw idea, problem, or itch>"'
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, AskUserQuestion]
---

Shape the raw idea in `$ARGUMENTS` into a direction worth validating (Agentic
Workflow §0 V0 — the `brainstormer` role). This is the step BEFORE the
`researcher`: it widens a fuzzy notion into distinct framings and converges on
one, so validation has something concrete to test. **No precondition** — this
runs before `/bootstrap`, in an empty repo or a full one; it writes only
`docs/product/idea.md` and a scratch framings note, never code. If an idea is
already well-formed and evidenced, say so and point at `/bootstrap` (fresh) or
the `researcher` directly — don't manufacture divergence that isn't needed.

## 1. The interview (light — the human may not know much yet)

Ask via AskUserQuestion — **batched, 2–4 questions, one round preferred**, every
question carrying candidate options drafted FROM the raw input (the human picks
or corrects; free-text always available). A raw idea means the human is still
discovering it, so keep it short:

- **The spark** — what observation or itch prompted this? Offer readings of the
  input, don't ask them to define it cold.
- **Who you picture** — the user or buyer you have in mind, if any (offer a few;
  "not sure" is a valid answer that widens the space).
- **What good looks like** — what would make this obviously worth it.
- **Constraints** — time, money, skills, or a hard "must / must-not" to honor.

Record the answers verbatim; they anchor the framings but do not become them.

## 2. Diverge (the brainstormer drafts)

Spawn the `brainstormer` with the raw input + interview answers. It returns
**2–3 genuinely distinct framings** (the bet, the problem, who serves/pays, core
value, riskiest assumption, and the case against each) — reframing the *premise*,
not just the solution. For a broad, open space, spawn 2–3 in parallel with
different divergence lenses (reframe the problem / attack from the user / the
10× angle) and merge to the distinct set; drop any two that collapse into one.
The drafts land in a scratch note (e.g. `docs/product/framings.md`).

## 3. ONE choice

Present the framings side by side (AskUserQuestion, pick-one; the owner-channel
gate when away, §12): each as its bet + riskiest assumption + the case against.
The human picks one, or picks-and-merges. This is the only decision — no
drip-feed. Record the choice and why.

## 4. Converge and hand off

Seed `docs/product/idea.md` from `${CLAUDE_PLUGIN_ROOT}/templates/idea.md` with
the chosen framing — problem, who pays, riskiest assumption, rough shape —
leaving the evidence fields for validation. Then report and route:

- **Fresh repo** → `/bootstrap` (it will offer the `researcher` to validate).
- **Already bootstrapped** → the `researcher` validates the framing next
  (evidence for AND against), then the human's go/no-go.

## Boundaries

The human is interviewed and chooses; the `brainstormer` never validates,
scopes, designs, or builds. This command shapes *what to validate* — the
go/no-go and everything downstream stay the human's. Not ambient: brainstorming
is convened for a raw idea, not volunteered at every step.
