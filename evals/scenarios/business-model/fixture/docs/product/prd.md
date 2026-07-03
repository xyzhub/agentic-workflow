# linkbox — PRD (V1, MVP scope)

## In v1
- `lb add <url>` — capture with auto-tags (haiku-tier model, ~$0.001/link)
- `lb find <query>` — full-text + tag search, local index
- Git-repo sync (user's own repo; no hosted storage)
- Read-only web view generated as static HTML

## NOT in v1 (deferred ≠ denied)
- Team/shared collections
- Browser extension
- Hosted sync service
- Mobile

## User journey (acceptance criteria)
1. Install via npm → `lb add` works within 60s of install.
2. Adding 100 links costs the user nothing visible; auto-tags are editable.
3. `lb find rust async` returns the saved article in <200ms locally.

## Stack
Node CLI + SQLite index + user-provided git remote. AI tagging via
cheapest-adequate model tier, budget-capped per §0.2 Efficiency.
