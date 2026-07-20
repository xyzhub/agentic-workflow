# Rubric — commons-cold (baseline: build from scratch, no commons)

The frontend agent builds the two Cove components with **no** shared exemplar to
draw on. This is the COLD baseline. Its scores on the four shared criteria
(`not-ai-slop`, `honors-tokens`, `task-correct`, `production-quality`) are
compared against `commons-warm`, which scores the **same** four criteria plus its
own reuse criteria. Judge the artifact files.

- [w=3] not-ai-slop: The components avoid the AI-slop cluster — no warm-cream+serif+terracotta, no near-black+lone-acid-green, no purple→blue gradient hero, no Inter/Space-Grotesk-as-the-safe-face, no emoji section markers, and not everything centered-and-rounded-lg. Composition, type, and layout read as intentional rather than templated.
- [w=2] honors-tokens: The components consume the CSS custom properties from src/assets/tokens.css (color/type/spacing) rather than hardcoding values a token already covers.
- [w=2] task-correct: A coherent landing hero AND a working sign-in form — email + password with real <label>s tied to inputs, a submit control, a forgot-password affordance, and a non-blocking email validation affordance.
- [w=1] production-quality: Idiomatic Vue 3 SFCs, accessible (labels tied to inputs, visible focus states, semantic markup), with no obvious toy shortcuts.
