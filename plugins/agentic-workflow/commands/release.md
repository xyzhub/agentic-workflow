---
description: Cut a release — bump version, update the changelog, tag, and prepare the GitHub release. Prepares; the human triggers the production deploy.
argument-hint: [version e.g. v1.2.0 | major|minor|patch]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, Task, Artifact]
---

Prepare a release (Agentic Workflow §7, V5). `$ARGUMENTS` is an explicit version
(`v1.2.0`) or a bump level (`major`/`minor`/`patch`). If omitted, propose one from
the unreleased changes. This command PREPARES the release; the human owns the
merge, the tag push, and the production deploy. Like all work, the release
commit lands on a branch — **never commit on the default branch**.

## 1. Preconditions

- Start from a clean, up-to-date default branch (fetch/pull if a remote
  exists), then branch: `git checkout -b release/<version>`. Gates green
  (project test + typecheck/lint; build).
- If the project profile (§10) defines an **eval suite**, run it and report the
  scores alongside the gates — a release with failing evals needs the human's
  explicit accept.
- Confirm `CHANGELOG.md` has an `## [Unreleased]` section with the changes since
  the last tag. If thin, spawn the `chronicler` to reconcile it against
  `git log <last-tag>..HEAD` and merged PRs.

## 2. Version (on the release branch)

- Determine the new version (explicit, or bump per semver from the last tag).
- Update it wherever the project pins version (package manifest, etc.).
- In `CHANGELOG.md`, move `## [Unreleased]` to `## [<version>] - <YYYY-MM-DD>` and
  open a fresh empty `## [Unreleased]`.

## 3. PR & release notes

```bash
git commit -m "release: <version>"     # include the Co-Authored-By trailer
git push -u origin release/<version>
gh pr create --fill
```

Draft the GitHub release notes from the changelog section. The tag is created
AFTER the human merges — on the merge commit, not on the unmerged branch —
so present these as the human's post-merge steps (tag pushes often trigger
deploy pipelines; that firing is theirs, per §11):

```bash
git checkout <default> && git pull
git tag -a <version> -m "<version>"
git push origin --follow-tags
gh release create <version> --notes-file <notes>
```

## 4. Verify the pipeline is ready

If tags trigger a release/deploy pipeline, confirm with the `devops` agent that
the workflow is sound (gates, SHA-pinned actions, scoped permissions) before the
tag is pushed.

## 5. Record & report

Spawn the `chronicler` to record the release milestone, then republish the
status page via the Artifact tool. Report: the version, the changelog delta,
the release PR, and the exact post-merge commands the human runs to tag,
publish, and deploy — plus what will happen when they do (this is the
launch-boundary confirmation). After the deploy, `/agentic-workflow:verify` confirms it on the
deployed instance.

When the release IS the V5 launch (first production release), include the
`marketing` launch assets in the handoff: point at
`docs/product/launch/launch-plan.md` and list the channel-plan rows awaiting
the human's publish.
