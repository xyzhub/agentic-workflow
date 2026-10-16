# Platform facts for owner-surfaces (orchestrator, 2026-10-16)

Read from the claude.ai Artifact runtime capability contract 0.2.81 in this
session (the authoritative source is the runtime's own type definitions;
subagents cannot read or call it, only the main session can).

- **Status page today** is a private claude.ai Artifact published by the main
  session from `docs/product/overview.html` (URL in its `artifact-url`
  comment), currently version 20. Subagents cannot publish.
- **`db` capability:** the page keeps documents outside its HTML — shared
  rows Claude seeds and reads back. Access `rules` per path with levels
  `view` < `interact` < `admin` (Editor) < `owner`; e.g. a path can be
  written by the owner only. Live updates via `onSnapshot`. Data a page
  writes is untrusted input to Claude.
- **`user` capability:** `isOwner()`, `canEdit()`, `id()` (opaque, stable
  within one scope). Store ids, never names. Signed-out / absent viewer →
  null.
- **Claude's side:** the main session reads and writes those documents with
  the `ArtifactData` tool (get / list / query / set / update / delete /
  batch) against the artifact URL. A hook, a shell script or a subagent
  cannot — so an on-page answer is picked up when an orchestrator session
  reads it (or another client with claude.ai access, e.g. Missions, reads
  it). There is no push into a running Claude Code session; the page cannot
  start a turn.
- **`artifact` capability:** a page can republish itself (the page is the
  record); concurrent saves reject with `conflict`.
- **`comments`:** comments sent to Claude reach a session that watches the
  artifact.
- Viewers who can only view never write `db`; the page should render
  read-only for them.
- Pages are private by default; sharing is the owner's act in the claude.ai
  Share menu.
