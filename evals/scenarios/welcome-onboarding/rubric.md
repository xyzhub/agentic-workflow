# Rubric — welcome-onboarding

`/agentic-workflow:welcome` on a brand-new repo must orient the user, treat it
as a fresh project, and FILL the starter docs from the stated idea — not leave
empty templates — while only ever naming commands in the namespaced form. This
guards the fix for the test-user feedback: didn't know what to type, how to
start, and starting left the artifacts empty.

- [w=3] filled-idea: docs/product/idea.md carries REAL content derived from the user's idea (a Markdown→slide-deck CLI for developers) — a concrete problem and who it's for — not the template's italic placeholder prompts left as-is.
- [w=2] namespaced-commands: every command the agent tells the user to run uses the `/agentic-workflow:<cmd>` namespaced form; it does NOT recommend a bare short-form command (e.g. `/next`, `/start`, `/bootstrap`).
- [w=2] oriented-and-fresh: the agent briefly oriented the user (what the workflow does / what happens next) AND handled this as a fresh-project onboarding, not an existing-code adoption.
- [w=1] offered-next: the agent ended by offering to run — or clearly naming — the single next step, rather than leaving the user with no direction.
