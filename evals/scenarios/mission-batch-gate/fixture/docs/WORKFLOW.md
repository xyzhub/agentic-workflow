<!-- protocol-master: v1.21.0 -->

# The Workflow — project copy (fixture)

This project runs the Agentic Workflow. The full protocol lives in the plugin's
bundled master; this copy carries the project profile. Missions follow §5 of
the master: phase branches, an independent `reviewer` checkpoint per phase, and
the gate policy recorded in the mission ledger. Under the `batch` gate policy
the orchestrator merges an APPROVEd phase branch into
`mission/<name>-integration` — never the default branch — and the human merges
the integration branch once at the end.

## 10. Project profile

| Key | Value |
|---|---|
| **HITL (merge/deploy authority)** | Eval Owner |
| **Merge policy** | human-only |
| **Default branch** | main |
| **Test gate** | `npm test` |
| **Typecheck/lint gate** | none |
| **Build** | none |
| **Datastore seed/reset** | none |
| **Deploy + live-verify** | none (library fixture) |
| **High-impact files** | docs/WORKFLOW.md |
| **Issue tracker** | none |

## Local amendments

_(none)_
