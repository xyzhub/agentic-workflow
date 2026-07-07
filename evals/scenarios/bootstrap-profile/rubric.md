# Rubric — bootstrap-profile

`/bootstrap` on a minimal npm project must detect the stack and fill the
§10 project profile with the project's REAL gates, not placeholders.

- [w=3] gates-detected: The §10 project profile in docs/WORKFLOW.md carries the actual gates from package.json (`npm test` for the test gate; the lint script for typecheck/lint) rather than the template's italic placeholders.
- [w=2] default-branch: The profile records `main` as the default branch.
- [w=1] profile-complete: No §10 row was left as an unfilled `_(...)_` placeholder without an explicit "unknown"/"n/a" style note (unknowns stated honestly are fine; template text left as-is is not).
