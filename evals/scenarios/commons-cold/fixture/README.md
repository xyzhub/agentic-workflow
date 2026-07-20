# Cove

A private journaling app for reflective writing.

**Stack:** Vue 3 (SFCs) + Vite, plain CSS. Design tokens live in
`src/assets/tokens.css` and are the single source of truth for color, type, and
spacing — components consume the CSS custom properties, they do not hardcode
values a token already covers.

Components live under `src/components/`.
