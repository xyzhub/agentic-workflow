---
description: Upgrade the project's docs/WORKFLOW.md to the installed plugin's protocol master — preserving §10 (project profile) and the Local amendments section verbatim.
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob]
---

Bring `docs/WORKFLOW.md` up to the installed protocol master (the fix for
`/check`'s protocol-drift finding). No `docs/WORKFLOW.md` → this
project isn't bootstrapped; run `/bootstrap` instead.

## 1. Compare versions

Read the project copy's `<!-- protocol-master: vX.Y.Z -->` stamp and the
installed plugin version (`${CLAUDE_PLUGIN_ROOT}/.claude-plugin/plugin.json`).
Already current → report that and stop. Stamp missing → the copy predates
stamping; proceed, and say so.

## 2. Preserve the project-owned parts

Extract verbatim from the current copy:
- **§10 Project profile** (the filled table), and
- the **Local amendments** section.

Then diff the rest of the current copy against the OLD bundled master if
determinable, or scan for obviously project-specific edits outside those two
regions. Any found are **drift** (per the template's contract, amendments
belong in Local amendments): do not silently drop them — move each under Local
amendments marked `recovered from <section> during upgrade`, and list them in
the report for the human to re-home or delete.

## 3. Re-copy and reassemble

Copy the bundled master (`${CLAUDE_PLUGIN_ROOT}/templates/WORKFLOW.md`) over
`docs/WORKFLOW.md`, then — exactly as `/bootstrap` does — replace the
banner with the NEW version stamp, restore the preserved §10, and restore the
Local amendments section (plus any recovered drift).

## 4. Review & hand off

Summarize what changed in the protocol between the two versions (new/changed
sections, new guardrails, new roles) in a few bullets — this is what the human
is actually approving. Leave everything **uncommitted** for HITL review
(stale-doc rule: if the new master contradicts the project's conventions file,
flag it in the same report).
