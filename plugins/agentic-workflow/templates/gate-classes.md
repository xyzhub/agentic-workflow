---
status: semi-static
owner-agent: architect
refresh-trigger: event
---

# Gate classes — the one taxonomy every gate, review and triage reads

_Terms: a **change class** names what a diff touches; an **action class** names
what a gate authorizes a person to do; a **qualifier** describes a bug report,
never a gate. A gate's **firer** is `human`, `reviewer` or `record`. A class is
**irreversible** when getting it wrong cannot be undone by reverting a commit._

This file is the only list. Every other file links here and names a class by
its `id` verbatim; a restated list elsewhere in the plugin fails
`tools/lint.mjs` (`checkClassListDedup`). A fork adds a domain class as a row,
with no code change.

## Change classes

What a diff (or the files a report's fix would touch) reaches. The reviewer
tier and the triage loop read these rows.

| class | id | covers | irreversible | reviewer tier | triage |
|---|---|---|---|---|---|
| Schema and migrations | `schema-migrations` | the database schema, a migration, data backfills | yes | top | escalate |
| Auth | `auth` | sign-in, sessions, tokens, roles, permissions, authorization and tenancy, personal-data stores | yes | top | escalate |
| Payments | `payments` | charging, refunds, payouts, invoices, a payment provider, any money flow | yes | top | escalate |
| CI and deploy config | `ci-deploy` | `.github/**`, build, deploy or infrastructure config | yes | default | escalate |
| Secrets | `secrets` | credentials, keys, env values, anything that would need one rotated or read | yes | default | escalate |
| Third-party contracts | `third-party` | an external API's behaviour, a webhook from a provider, a vendor SDK | no | default | escalate |
| Security boundary | `security-boundary` | ingress sanitisation, CSP/CORS, sandboxing, webhook signature checks, and the discipline files: `hooks/`, `tools/`, `templates/`, `hooks.json`, `codex.rules`, `.claude/agents` | yes | top | escalate |
| Supply chain | `supply-chain` | a lockfile or manifest dependency add or bump, install scripts | yes | top | escalate |

`third-party` is the only change class that is not irreversible. Reviewer tier
`top` means the top model tier for that review, a two-line diff included; how
the tier is chosen lives in `templates/WORKFLOW.md` §5 LA-5.

## Action classes

What a gate authorizes. Every action class is irreversible and fired by a
human, so a gate carrying one is `human` and can never be `optional` or
`skipped`. Triage reads `n/a` for all of them: a bug report is never an action.

| class | id | covers | delegable | irreversible |
|---|---|---|---|---|
| Production deploy | `production-deploy` | ship, rollback, restart, scale, re-deploy | never | yes |
| Merge to default | `merge-to-default` | merging into the default branch | a reviewer-APPROVEd PR under §10 Merge policy; records-only is a third value scoped by path; a direct push is never sanctioned | yes |
| Publish outward | `publish-outward` | a post, announcement or listing in public | only approved + due + organic + `kind: post` within the hook's scope (§10 Publish policy); outreach never | yes |
| Spend | `spend` | any money leaving the venture, paid promotion included | never | yes |
| Commercial commitment | `commercial-commitment` | prices, proposals, terms offered to a customer | never | yes |
| Outbound contact | `outbound-contact` | a message to a real person on the owner's behalf | never | yes |
| Destructive data | `destructive-data` | delete, restore or overwrite production data; a datastore reset | never | yes |
| Release cut | `release-cut` | a tag push, a version cut that triggers a pipeline | never | yes |
| User experiment | `user-experiment` | a behavioural experiment on real users | never | yes |

## Qualifiers (triage only)

| qualifier | id | covers | triage |
|---|---|---|---|
| Not reproducible | `not-reproducible` | the reported code behaviour cannot be reproduced from the report's steps (code reports only) | escalate |
| Size above S | `size-above-s` | the fix would be `size/M` or larger (code reports only) | escalate |

A qualifier is never a gate's class.

## Gate-cell grammar

This is the single definition; the fenced tables in `templates/WORKFLOW.md`
(§0 `stage-table`, §5 `checkpoint-gates`) use it and never restate it.

```
<id> · human|reviewer|record · <class>[+<class>]*
<id> · human|reviewer|record · none
```

- Separators are U+00B7 (`·`) with exactly one space on each side. No other
  whitespace variant parses.
- `+` joins classes with no spaces (`production-deploy+release-cut`).
- A class is a change-class or action-class `id` from this file. An action
  class on a gate whose firer is not `human` fails `ceremony.mjs check`.
- One cell may hold several gates separated by `; `.
- A cell may end in a human-readable tail after ` — ` (space, U+2014, space).
  A reader splits on the FIRST ` — ` (the tail may itself contain `;`), then
  splits the grammar part on `; `.
- `none` on a decision gate (V0, V1) is fail-closed under AC-2: the gate still
  needs its answer. `none` never means "skippable without an answer".

## Readers

- `templates/operate-triage.md` — the `triage` column, change classes and
  qualifiers only.
- `templates/WORKFLOW.md` §5 LA-5 — the `reviewer tier` column.
- `agents/reviewer.md` — the `reviewer tier` column, for its own tiering.
- `tools/ceremony.mjs` — the class ids inside the fenced `Gate` cells, joined
  at read time; §10.2 stores no class column.
- `hooks/lib/merge-guard.sh` — the irreversible id list only, spelled in the
  script.

Left out on purpose: licensing, infra cost, prompts/evals. None is
irreversible, and adding them would start a second taxonomy.
