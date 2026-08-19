---
status: living
owner-agent: backend
refresh-trigger: every-ship
---

# {{PROJECT_NAME}} — AUTH.md (test users & authenticated access)

_So every session and agent knows how to sign in — app test users, databases,
remote servers — without asking or digging through transcripts. Deploys to `docs/AUTH.md`; the §10 **Test users**
row points here. Read by `/agentic-workflow:verify`, the reviewer's real-client
smoke, and the `frontend`/`backend` live-verify steps._

## The safety rule (read before adding a row)

- **Only seeded dev/staging credentials belong here** — users a seed script
  creates, whose passwords are therefore ALREADY in the repo. Every row must
  be re-derivable from the seed (its anchor); if a row's user is not in a seed
  script, it does not belong in this file.
- **Anything real is an env-var NAME, never a value** (`$STAGING_ADMIN_PW`),
  same rule as the §12 owner-channel row. **Production credentials never
  appear here in any form.**
- Rewrite rows in place when seeds change (§6.1 conventions discipline — the
  seed anchor makes staleness checkable); a session that changes a seed
  updates this file in the same PR.

## Test users

| Role | Email / login | Password | Org / venue | Surfaces | Seed anchor |
|---|---|---|---|---|---|
| _e.g. TENANT_ADMIN_ | _admin@demo.test_ | _demo1234 (seeded)_ | _Demo Org / Downtown_ | _/manager, /admin_ | _`prisma/seed.demo.ts`_ |

## How to sign in, per surface

_The non-obvious part an agent otherwise burns a session discovering: which
login page serves which role, PIN/QR flows, org/venue pickers after login,
how to mint a guest token, OAuth test accounts (by env NAME)._

- _e.g. Staff POS: `/auth/login` → email+password → venue picker; kitchen
  displays pair via …_

## Environments

| Env | URL | Users above valid? | Notes |
|---|---|---|---|
| dev (scratch DB) | _http://localhost:PORT_ | yes — run the §10 seed | _per-worktree DB, see §10_ |
| staging | _(§10 Staging row URL)_ | _yes / seeded subset_ | _re-seeded when?_ |
| production | — | **never** — no test users, no credentials here | |

## Databases & remote access

_Everything a session must authenticate to that is not the app itself — the
recipe and the env-var NAMES, never a secret value. The values live in the
uncommitted `.env` (names mirrored in `.env.example`) or the machine's own
agent (Tailscale login, SSH keys)._

| What | How to reach it | Credentials (names/recipe only) |
|---|---|---|
| _dev/scratch Postgres_ | _`postgres://$DEV_PG_HOST/<repo>_<mission>` over Tailscale_ | _`$DEV_PG_USER` / `$DEV_PG_PASSWORD` in `.env`; create/drop recipe in §10 Datastore row_ |
| _staging DB_ | _via `$STAGING_DATABASE_URL` — migrations coordinated (§5), never ad-hoc writes_ | _env name only_ |
| _staging server / deploy target_ | _e.g. `fly ssh console -a <app>` (auth = `fly auth login`, machine-level)_ | _no values here_ |

## Regenerate

_The §10 seed command that (re)creates these users, verbatim._
