# Plan — v0.3 persistence (in progress)

Status: actively driven — next up is task 2.

## Decisions

- 2026-06-20: persistence will be a JSON file (`data/todos.json`), not SQLite —
  keep the library dependency-free.
- 2026-06-24: IDs stay numeric and sequential; no UUIDs for v0.x.

## Tasks

- [x] 1. Extract the store behind `add`/`complete`/`list` (done, tested)
- [ ] 2. JSON-file persistence with load-on-require and save-on-mutation
- [ ] 3. Corrupt-file recovery: back up the bad file, start empty, warn
