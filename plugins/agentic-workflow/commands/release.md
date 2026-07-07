---
description: Cut a release — bump version, update the changelog, tag, and prepare the GitHub release. Prepares; the human triggers the production deploy.
argument-hint: [version e.g. v1.2.0 | major|minor|patch]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task]
---

Prepare a release (Agentic Workflow §7, V5). `$ARGUMENTS` is an explicit version
(`v1.2.0`) or a bump level (`major`/`minor`/`patch`). If omitted, propose one from
the unreleased changes. This command PREPARES the release; the human owns the
production deploy and the merge.

## 1. Preconditions

- On the default branch, clean tree, up to date (or on the release branch the
  project uses). Gates green (project test + typecheck/lint; build).
- If the project profile (§10) defines an **eval suite**, run it and report the
  scores alongside the gates — a release with failing evals needs the human's
  explicit accept.
- Confirm `CHANGELOG.md` has an `## [Unreleased]` section with the changes since
  the last tag. If thin, spawn the `chronicler` to reconcile it against
  `git log <last-tag>..HEAD` and merged PRs.

## 2. Version

- Determine the new version (explicit, or bump per semver from the last tag).
- Update it wherever the project pins version (package manifest, etc.).
- In `CHANGELOG.md`, move `## [Unreleased]` to `## [<version>] - <YYYY-MM-DD>` and
  open a fresh empty `## [Unreleased]`.

## 3. Tag & release notes

```bash
git commit -m "release: <version>"     # include the Co-Authored-By trailer
git tag -a <version> -m "<version>"
```

Draft the GitHub release notes from the changelog section. Do NOT push the tag or
publish the release yourself if that triggers a deploy — present it for the human
to run:

```bash
git push origin <default-branch> --follow-tags
gh release create <version> --notes-file <notes>
```

## 4. Verify the pipeline is ready

If tags trigger a release/deploy pipeline, confirm with the `devops` agent that
the workflow is sound (gates, SHA-pinned actions, scoped permissions) before the
tag is pushed.

## 5. Record & report

Update the status page (via the `chronicler`) with the release milestone. Report:
the version, the changelog delta, the tag created, and the exact commands the
human should run to publish/deploy — plus what will happen when they do (this is
the launch-boundary confirmation).

When the release IS the V5 launch (first production release), include the
`marketing` launch assets in the handoff: point at
`docs/product/launch/launch-plan.md` and list the channel-plan rows awaiting
the human's publish.
