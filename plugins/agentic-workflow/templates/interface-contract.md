# {{PROJECT_NAME}} — Interface Contract

_The boundary the `backend` and `frontend` both honor — the one artifact that
lets their slices proceed **in parallel** without diverging. Small on purpose: a
frontend brief can pre-resolve a read of just this file without pulling in the
whole architecture doc (§2 — ingest conclusions, not corpora). Owned jointly by
the `architect` and `backend`; the `frontend` builds against it before the
backend exists. Born at V1 as the agreed shape, hardened at V2._

## Scope
_Which boundary this covers (e.g. the HTTP API between the web client and the
server; the contract between a worker and the queue). One contract per real
seam; link others if there are several._

## Conventions
_The rules that hold across every endpoint/message so they aren't repeated:
transport and format (REST/JSON, RPC, events), auth (how a caller proves
identity), error shape (the ONE envelope errors come back in), pagination,
idempotency, versioning. Get these right once here._

## Endpoints / messages
_Each operation as a contract both sides can build against independently._

### `_METHOD /path_` — _what it does_
- **Request** — _params / body shape; required vs optional; validation rules._
- **Response** — _success shape + status; the states the client must render
  (the UX pillar's empty/loading/error map to these)._
- **Errors** — _the failure cases and their codes (in the common error shape)._
- **Idempotency / auth** — _if it deviates from the conventions above._

## Shared types
_The named shapes referenced above (the entities as they cross the wire), so
"a `User`" means the same thing on both sides. The source of truth for the shape;
the data model (`architecture.md`) owns the persisted invariants._

---
_A change to this contract is a change to BOTH sides — treat it as a coordinated
edit, not a one-sided tweak, and flag it at the checkpoint. The `reviewer`
verifies both slices against this file; drift between the contract and either
side is a finding. Additive changes preferred; a breaking change needs the
versioning story above._
