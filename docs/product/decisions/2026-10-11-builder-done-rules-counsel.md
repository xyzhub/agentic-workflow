# Counsel brief — builder-done-rules (2026-10-11)

Two advisors (technical, financial), both on Fable. Both: **proceed-with-changes**. Neither contested the four items or the extras; both contested the one-session shape and specific wording.

## Convergent objections (both lenses)
1. **One session is not honest.** ~45 files (20 description trims, 13 `Next up:` files, 9 commands, 6 templates, 2 tools), three lint features with 8+ fixtures. Technical: 3 phases / Estimate 6. Financial: Estimate 3, two briefs. Precedent: gatehouse-asks Estimate 1→4 by the plan-judge; runtime-agnostic 10→4→5.
2. **Acceptance test (b) (a synthetic planner run) costs ~100–180k Fable tokens for evidence the mission's own trio gives free.** Use `.plans/builder-done-rules.md` as the fresh trio; move the negative control to an obligations-register row for the next real mission.

## Technical lens (file:line)
- AC-4 collides with `backend.md:50` / `frontend.md:105` ("log any deviation in the ledger") — replace, don't append. A subagent cannot "stop"; it returns, and `mission.md:168-173` maps a non-done return to blocked → retry → surface, burning a corrective. Fix: a distinct `deviation` hand-off status → owner directly, no retry.
- AC-1 names no environment; Orderly has no local DB. Fix: "applied in the §10-named datastore for the slice; the staging apply is a pre-merge OB row". Scope AC-2 to code, not schema (additive-only schema rule at `reviewer.md:159`, `backend.md:33`); reconcile AC-2 with AC-3's legitimate mid-rollout stop.
- D1 name-key misses two live paraphrases (`reviewer.md:210-212`, `mission.md:176-179`); numbered lists without blank lines defeat paragraph splitting. Fix: key on two mechanics tokens, split on blank lines AND list/table starts, seed both sites as fixtures. Lint guards the plugin only — venture `docs/WORKFLOW.md` copies are not checked; say so in AC-13.
- Pointers move the rule away from the actor at three sites (`mission.md:38-45`, `mission-state.md:21-25`, `reviewer.md:76`). Fix: allow one full `<!-- rule-copy: <id> -->` at each actor site, byte-diffed against §5 by lint; pointers everywhere else.
- D2 checks presence not provenance. Fix: a `derivation` row must cite file:line or an issue comment, else `Source kind = open question` (routed, not REVISEd); allow a literal `none — no values produced` row.

## Financial lens (numbers)
- Recurring prompt delta ≈ break-even (+700–1,500 vs −700–1,000 tokens per mission); the mission pays if it prevents ≥1 corrective per ~50 missions.
- New REVISE triggers are the real recurring cost (each REVISE ≈ 30–80k planner respawn). Fix: REVISE only on a substantive miss; an empty cell is a named fix inside the single REVISE.
- `reviewer.md` 14,308 + ~1,150 − ~400 ≈ 15,050 B — over D3's 14,400 warn on day one; AC-15c "< 14,308" needs a named trim (candidate: the ~1.9 KB impeccable paragraph at `reviewer.md:108-129` → pointer to §0.2) or relaxing to "≤ warn".

## Open to the owner
- `Assumed` home: wherever the mission's locked decisions live (master plan; decision-log under autopilot) — architect recommends yes.
