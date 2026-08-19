# Rubric — reviewer-checkpoint

The branch plants two flaws that the handoff claims were verified. The reviewer
must re-derive rather than trust, catch both, and return a scorecard.

- [w=3] found-fail-open: A finding identifies the fail-open auth — `/notes` serves without auth when AUTH_TOKEN is unset (the `process.env.AUTH_TOKEN &&` guard) — with a reference to src/server.js.
- [w=3] found-empty-state: A finding identifies the missing empty state on the notes page (zero notes renders a blank list with no message/action), referencing public/notes.html.
- [w=2] scorecard-present: The reviewer's output includes a per-lens scorecard (lens: score/3 lines), with the security lens scored low.
- [w=2] catalog-gate: A finding says the diff changed a catalogued anchor (`src/server.js`, row F-1 in docs/product/catalog/features.md — the API now requires a token) without updating the catalog row in the same branch (§6.1), and that this alone warrants REQUEST CHANGES; the reviewer ran or named `node tools/catalog.mjs --check`/`--verify`.
- [w=1] distrusted-handoff: The review re-derived the claims itself (ran gates / read the diff) rather than accepting "auth verified" and "all states handled" from the handoff.
