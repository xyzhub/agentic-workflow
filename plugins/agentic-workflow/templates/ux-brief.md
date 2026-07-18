# {{PROJECT_NAME}} — UX Brief (V1)

_What a designer (and the `frontend` implementer) needs to build the RIGHT
experience: who the user is, the job they're hiring the product for, the path
they take, and how it's all structured. Owned by the `designer` at V1; the PRD
references this instead of inlining journeys. **Evidence-grounded, not invented**
— every persona and pain traces to a `researcher` finding (cite it) or is
labelled `assumption` so the load-bearing guesses are visible. No empathy maps,
no emotion curves — this workflow builds from evidence, not UX ceremony._

## Personas
_The 1–3 archetypes the MVP actually serves — no more than the scope needs. Each
grounded in V0 research; a persona backed by nothing is a guess wearing a face._

### Persona: _name / role_
- **Who** — _context, environment, tech comfort — the situation they're in when
  they reach for this._
- **The job to be done** — _what they hire the product for (the motivation
  behind the journey), phrased as their goal, not our feature._
- **Pain today** — _how they cope now and what it costs them (time/money/risk)._
  _(→ evidence: `docs/product/idea.md` / research brief, or `assumption`)_
- **Success for them** — _what "this worked" feels like from their side._

## User journeys
_Each core journey as steps a first-time user actually takes, in THEIR
vocabulary. Kept as small as the MVP scope — a journey for a deferred feature is
scope creep in costume. Name each journey's **aha-moment** and keep the friction
before it paying rent._

### Journey: _name_ — _(persona)_
_Steps the user takes, first to value._
- **Acceptance criteria** — _what the user sees, does, and can verify happened
  (this is the PRD's stop-the-line hook — no build without it)._
- **States** — empty (_points at the primary action_) · loading · error
  (_what broke + what to do_) · degraded.
- **Aha-moment** — _the step where value lands._

## Information architecture
_The product's structure: the screens/sections, how they nest, and the
navigation between them — named in the user's words (the IA vocabulary the copy
kit and glossary reuse). A sitemap sketch or an indented list, whichever is
clearer._

## Anti-manipulation guard
_The UX pillar (§0.2) is a design constraint here, not just a V4 audit item:
persuasion through value clarity only — no fabricated scarcity/urgency, no
confirm-shaming, no dark defaults, cancellation no harder than sign-up. Where a
progression/game layer exists, every reward maps to REAL user progress and the
layer is declinable. Note any mechanic that needs an explicit human decision._

---
_The `designer` proposes and organizes; the **owner** approves the scope this
serves (V1 gate) and picks the brand direction separately. The `frontend`
implementer builds against this brief; deferred-feature journeys stay out until
their scope is approved._
