# Rubric — mission-plan

`/mission ... plan` must produce the `.plans/` trio with pre-resolved briefs so
execution sessions never explore. Artifacts are provided; judge their content.
(If the trio landed under a different mission name than `tagging`, judge from
the transcript evidence instead of penalizing the name.)

- [w=3] pre-resolved-reads: Session briefs pre-resolve their targets — concrete file paths with measured line counts and/or anchors, not "explore the codebase".
- [w=2] decisions-and-questions: The master plan contains dated locked decisions and/or open questions, each open question carrying a recommendation.
- [w=2] ledger-ready: The state ledger has a checklist matching the briefs and a `Next up:` pointer set to the first session.
- [w=1] phased-branches: Sessions are grouped into phases with named branches.
- [w=1] acceptance-criteria: Master-plan tasks carry acceptance criteria, not just descriptions.
