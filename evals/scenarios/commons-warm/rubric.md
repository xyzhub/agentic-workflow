# Rubric — commons-warm (consult the commons, copy-and-adapt)

The frontend agent has a battle-tested exemplar available under commons/
(harvested from the "Tend" venture) and must copy-and-adapt it to Cove. It is
scored on the **same four shared criteria** as commons-cold (compare the delta on
those) PLUS three reuse criteria. Judge the artifact files and the run.

- [w=3] not-ai-slop: The components avoid the AI-slop cluster — no warm-cream+serif+terracotta, no near-black+lone-acid-green, no purple→blue gradient hero, no Inter/Space-Grotesk-as-the-safe-face, no emoji section markers, and not everything centered-and-rounded-lg. Composition, type, and layout read as intentional rather than templated.
- [w=2] honors-tokens: The components consume the CSS custom properties from src/assets/tokens.css (color/type/spacing) rather than hardcoding values a token already covers.
- [w=2] task-correct: A coherent landing hero AND a working sign-in form — email + password with real <label>s tied to inputs, a submit control, a forgot-password affordance, and a non-blocking email validation affordance.
- [w=1] production-quality: Idiomatic Vue 3 SFCs, accessible (labels tied to inputs, visible focus states, semantic markup), with no obvious toy shortcuts.
- [w=3] consulted-commons: There is evidence the agent consulted the commons exemplar (read commons/index.md and/or commons/code/tend-landing-auth/) before building — e.g. its report describes reusing that pair.
- [w=3] adapted-not-copied: The output is adapted to Cove, not pasted — the exemplar's Tend/plant-care identity is gone (no "Tend", no "Start tending", no plant copy), replaced with Cove's journaling voice and a "Start writing" CTA, with routes updated. Reusing the exemplar's structure and craft is expected and good; carrying its copy is not.
- [w=1] write-back-noted: The agent flagged at least one concrete improvement worth contributing back to the commons (e.g. the README's known accent-hover token gap, or a real enhancement it made).
