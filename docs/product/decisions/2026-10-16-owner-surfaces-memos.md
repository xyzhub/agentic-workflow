---
status: frozen
owner-agent: architect
refresh-trigger: never
---

# Agentic Workflow — Decision memos: owner-surfaces (goal statement E2)

_Seven shape decisions (D1–D7) for `docs/product/decisions/2026-10-16-owner-surfaces-brief.md`
(ACs J1–J4), read together with the platform facts
(`2026-10-16-owner-surfaces-platform-facts.md`), the designer's journeys
(`2026-10-16-owner-surfaces-journeys.md`) and `2026-10-12-goal-statement.md` §E2.
Each claim is labelled **[fact]** (cited), **[inference]** or **[assumption]**.
The architect consults; the human decides. Each pick lands as a dated locked
decision in the master plan, pointing here._

## Measured ground (what every memo builds on)

| Measure | Value | Source |
|---|---|---|
| `templates/WORKFLOW.md` | 113,392 B of a 120,000 B ceiling → **6,608 B headroom** | [fact] `wc -c`; `tools/lint.mjs:978` |
| `commands/mission.md` | 22,727 B of 24,000 B → **1,273 B headroom** | [fact] `wc -c`; `tools/lint.mjs:976` |
| `commands/plan.md` / `next.md` / `operate.md` | 5,188 / 5,285 / 15,249 B of 24,000 B | [fact] `wc -c` |
| `agents/chronicler.md` | 9,087 B of 16,000 B | [fact] |
| `templates/overview.html` vs this repo's page | 13,264 B vs 44,415 B; 5 hand-edited `data:` regions (meta, stages, now, pillars, timeline); no `<script>` | [fact] `grep` on `docs/product/overview.html` |
| `.plans/pending-gates.md` | named in §12 rule 3, `operate.md:85`, `doctor.md:58`, README, and called a "public interface" by `agents-registry.schema.json`; **no template, no tool, no file has ever existed** | [fact] `grep -rn pending-gates` |
| `.plans/` | git-tracked (62 files); `tools/ledger.mjs --commit` adds, commits and pushes each beat | [fact] `git ls-files .plans`; `ledger.mjs:246` |
| Mission lease | no prior art anywhere in the repo | [fact] `grep -rni lease` (only "release") |
| Operating-loop state | `~/.local/state/agentic-workflow/<slug>/operate.json` = `{lastDigestAt, lastAlertAt, lastAliveAt, sendFailures, kept[]}`, machine-local; **absent on this machine** (the loop has never run here) | [fact] `operate-triage.mjs:11,81`; `ls ~/.local/state` |
| One-time-token precedent | `publish-gate.mjs`: body hash + epoch pin, 8-hex single-use claim, append-only `publish-claims.jsonl`, exported `norm`/`sha` | [fact] `publish-gate.mjs:1-30,52-53` |
| Missions contract | contract test asserts `plan`/`mission`/`bootstrap` keep `AskUserQuestion` in frontmatter, and that the plugin's `hooks.json` has **no** `PreToolUse` matcher on `AskUserQuestion` ("Missions must be the only thing deciding AskUserQuestion"); ledger keeps `Estimate:`, `Sessions used:`, `Next up:`; Missions shows `docs/product/overview.html` as "At a glance" | [fact] `missions-app/contract-tests/plugin-contract.test.ts:22-40`; `packages/runner/src/product-files.ts:32` |
| Missions vendor pin | 1.54.1 (engine 1.62.0) | [fact] `missions-app/vendor/VERSION` |

Two consequences shape everything below:

- **[inference]** "Never hook the question tool" is a live contract, not only a principle: Missions' own gate hook owns `AskUserQuestion`. The structured question therefore has to be written **beside** the chat question, never pulled out of it.
- **[inference]** WORKFLOW.md and mission.md are nearly full. New protocol text goes into **one new template** (`templates/owner-surfaces.md`) and the schema; WORKFLOW.md §12 changes in place (net ≤ +1.5 KB) and mission.md gets pointers only (≤ +600 B).

---

## D1 — The structured-question schema

**Question.** What one shape do gates, interview questions, digests and alerts leave the engine in, where does it live, how is it versioned, and how does `/plan`'s interview emit it without hooking `AskUserQuestion`? **Constrains:** the page, `state.mjs --json`, the page-answer check (D4), the Missions fixtures (D7).

### Option A — One JSON Schema file, `schemaVersion` integer, tolerant readers
- **How it works here:** `templates/owner-surfaces.schema.json` (draft-07, like the two existing schemas [fact]) with `$defs`: `question`, `notice` (digest/alert), `state` (D2's JSON), `answer` (D4's page doc). Every emitted document starts with `"schemaVersion": 1` — the `tune-presets.json` precedent [fact]. The emitter (`tools/state.mjs`) validates strictly against its own schema (`additionalProperties: false`); consumers are told to ignore unknown fields.
- **Question fields** (the goal's eight + designer (a) + what D4 needs): `id` (`Q-<project>-<n>`, stable across re-asks; keeps §12's `G-<project>-…` per-project prefix rule), `kind` (`gate|interview|scope|open-question`), `headline` (≤ 12 words), `changes`, `risk` `{level: low|medium|high, line}`, `estimate`, `recommended` (an option id), `options[]` `{id, label, consequence}` (ids `opt-<slug>`, stable), `evidence[]` `{label, url}`, `gateClass` (a `gate-classes.md` id, `+`-joined, or `none`), `fireCommand` (required when `gateClass` holds an action class, forbidden otherwise), `instance` `{nonce, bodySha, askedAt, expiresAt}`, `status` (`pending|recorded|picked-up|refused|expired|answered-in-chat`), `home` (where the locked decision lands).
- **Fail-closed by shape:** all eight card fields are **required** on every kind. An interview question with no meaningful risk says `"risk": {"level": "low", "line": "n/a — only shapes the brief"}` — explicit, never absent. `if/then` in the schema makes `fireCommand` required exactly when an action class is present [inference: draft-07 supports `if/then`; verified in the spec's keyword list from memory — **assumption** until the builder's selftest proves it on the zero-dep validator].
- **Tradeoffs:** one file, one validator, the same idiom as `agents-registry.schema.json`. A zero-dependency validator must be written (the repo has no `ajv`) — a subset validator for the keywords used (`type`, `required`, `enum`, `properties`, `additionalProperties`, `items`, `if/then`, `maxLength`).
- **Operational cost:** ~150 lines of schema, ~120 lines of validator, shared by every reader.
- **Cost of reversal:** low. Additive fields keep `schemaVersion`; a removed, renamed or retyped field bumps it and ships as a minor plugin version with a CHANGELOG line (the agents-registry rule [fact]).

### Option B — Markdown grammar in the ledger (like Closing rows)
- **How it works here:** one line per question in `.plans/<mission>.state.md`, `## Open questions`, with `·`-separated cells, parsed like `ledger.mjs` rows.
- **Tradeoffs:** human-readable in the ledger, but options, evidence and consequences are nested lists; a one-line grammar cannot hold them without inventing escaping. The page and Missions would both need a parser.
- **Cost of reversal:** high — once ledger lines carry a grammar, `lint` checks 13/14 and Missions' reader depend on it.

### Option C — Per-runtime shapes (AskUserQuestion's own JSON as the format)
- **How it works here:** store the `AskUserQuestion` input object verbatim and add fields.
- **Tradeoffs:** couples the engine's public format to Claude Code's tool input, which the plugin does not control and which Codex lacks [fact: runtime-agnostic missions, memory]; the eight fields don't exist there.
- **Cost of reversal:** high — every reader learns a foreign shape.

### How the `/plan` interview emits it (applies to A)
1. Before each interview round, the session writes the round's questions as JSON and runs `node tools/state.mjs ask --file <q.json>` (validates, mints `instance`, appends an `asked` event — D2).
2. It then calls `AskUserQuestion` with the **same** headline and option labels, unchanged. Nothing about the tool call changes, so Missions' gate hook keeps relaying it [fact: contract test above].
3. The chat answer is recorded with `state.mjs answer <id> <opt-id> --via chat`. The engine never reads, wraps or hooks the tool.
- **[assumption]** The `AskUserQuestion` `header` chip is short (≈12 chars); the question id is **not** put there — the id travels in the JSON only, so the owner never sees `Q-…` noise in chat.

### Recommendation — A
One versioned schema file with strict emit / tolerant read. It is the repo's own idiom twice over, it can hold nested options, and it is cheap to evolve.
**Strongest case against:** a hand-written subset validator is a second place a bug can hide, and JSON Schema is overkill for ~5 shapes. A plain JS `assertQuestion()` would be shorter. Counter: the schema file is what Missions and any fork read as the contract. A JS function is not a contract a TypeScript consumer can generate types from.

**Designer input (c) — confirmed.** Add a `plain` column to both tables in `templates/gate-classes.md` (e.g. `schema-migrations` → "the database structure"), plus one line for `none` ("Reversible — the workflow can undo this"). Card wording is generated from it by `readClasses()` (`ceremony.mjs`, already exported [fact]) extended to return `plain`. `checkClassListDedup` stays green: it scans `.md` files other than `gate-classes.md` [fact `lint.mjs:1262-1270`], and the HTML/JSON outputs restate nothing by hand.

**Values this decision settles:** `schemaVersion: 1`; id grammar `Q-<project>-<n>`, `opt-<slug>`; risk enum `low|medium|high`; headline ≤ 12 words; the `plain` column in gate-classes.md; strict emit / tolerant read; breaking change ⇒ schemaVersion+1 + minor bump.

**What would change the answer:** a second runtime that needs typed bindings (e.g. the Missions server in TypeScript generating from the schema) only strengthens A. If the validator subset grows past ~10 keywords, vendor a validator into `tools/` instead.

---

## D2 — Where structured state lives on disk, and the JSON command

**Question.** What is the authority for mission state and pending questions, and how does "mission state as JSON" get produced? **Constrains:** the lease (D5), the page build (D3), Missions' reader, multi-machine resume.

### Option A — Ledger stays the authority; one repo-level append-only question log; JSON derived on demand
- **How it works here:** `.plans/<mission>.state.md` stays the single source for mission state (unchanged grammar plus D5's `Lease:` line). Questions live in **`.plans/questions.jsonl`**: one line per event (`asked`, `answered`, `refused`, `expired`, `consumed`, `owner-pinned`), git-tracked, written only by `tools/state.mjs` (temp + rename under an `O_EXCL` lock — the publish-gate pattern [fact]). `.plans/pending-gates.md` (never built [fact]) is **replaced** by it: §12 rule 3, `operate.md:85` and `doctor.md:58` are repointed, and §12's Telegram nonce reuses the same `instance.nonce`. `node tools/state.mjs json [--mission <name>]` reads the ledger(s), questions.jsonl, JOURNEY headings, OBLIGATIONS open rows and `operate.json` (if present), and prints one `state` document. It writes nothing.
- **Tradeoffs:** nothing new to keep in sync — the JSON is a pure function of committed files. Append-only gives the audit trail J1 asks for. One repo-level log (not per mission) because interview and scope questions exist before any mission ledger does [inference: `/plan` asks before the planner writes the trio].
- **Operational cost:** one new tool (~350 lines + test), one lint harness (`checkStateHarness`, the `checkLedgerHarness` pattern).
- **Cost of reversal:** low — the JSON is derived, so the shape can move without touching any stored file.

### Option B — Generated `.plans/<mission>.json` committed next to the ledger
- **How it works here:** every ledger beat also rewrites a JSON twin.
- **Tradeoffs:** two committed copies of one truth. Any hand edit or merge on the `.md` silently drifts. Missions would read the twin and trust it.
- **Cost of reversal:** medium — consumers bind to a file path, not a command.

### Option C — The Artifact `db` as the store
- **How it works here:** questions and state live as page documents.
- **Tradeoffs:** only the main session can read or write them [fact: platform facts]. Hooks, subagents, Codex, CI and Missions-without-claude.ai lose access, and there is no git audit trail. Violates "durable state outlives any transcript" (§2 principle 1).
- **Cost of reversal:** high — the data leaves the repo.

### Recommendation — A
The ledger stays the authority, `.plans/questions.jsonl` becomes the question log (the long-promised `pending-gates` made real), and `tools/state.mjs` is the one JSON door. Verbs: `json`, `ask`, `answer` (chat), `accept` (page, D4), `expire`, `page` (D3).
**Strongest case against:** a third `.plans` file kind, and JSONL is less pleasant to read than markdown for a human auditing by hand. Mitigation: `state.mjs json --pending` prints the readable view, and lint rejects a malformed line, like publish-claims.

**Values this decision settles:** the path `.plans/questions.jsonl`; event names; `pending-gates.md` retired (the doctor check and §12 text repointed in the same PR); `state.mjs` verbs; JSON is never committed.

**What would change the answer:** if Missions needs push (not poll) updates, emit from the same tool to a socket later. The storage does not change.

---

## D3 — Page generation

**Question.** How is the status page built from the data, and what does the chronicler still own? **Constrains:** J2, the Missions "At a glance" view, test strategy.

### Option A — Node render into the existing `data:` regions + an embedded JSON island; the main session publishes
- **How it works here:** `node tools/state.mjs page` reads `state json` and rewrites the `data:` regions of `docs/product/overview.html` from `templates/overview.html` partials (string templates, zero deps). It also writes a `<script type="application/json" id="aw-state">` island and a small inline script that only (1) overlays live `db` question/answer status (D4) and (2) shows the viewer badge from `user.isOwner()`/`canEdit()`. The main session then publishes the file to its `artifact-url` (today's flow [fact: platform facts]).
- **Tradeoffs:** the static HTML is complete without JS, so Missions' "At a glance" (reads the file [fact]) and a viewer without db access both see the real state. Fully testable in Node: render → schema-valid island → regions byte-stable. Each change needs a republish (one Artifact call, as today).
- **Operational cost:** ~250 lines of renderer, template grows ~13 → ~22 KB [inference].
- **Cost of reversal:** low — the island already carries the data a db-rendered page would need.

### Option B — Static shell that renders everything from `db` docs seeded by the session
- **How it works here:** the HTML never changes. Each beat, the main session runs `ArtifactData batch` to update `state/*` docs, and the page renders live via `onSnapshot`.
- **Tradeoffs:** live without republish, but every beat costs a main-session tool batch (tokens). Subagents can't do it [fact], the repo copy of the page shows nothing, Missions' file view goes blank, and rendering is testable only in a browser.
- **Cost of reversal:** medium — state lives off-repo between beats.

### Option C — Keep the chronicler, fed a JSON brief
- **Tradeoffs:** keeps hand-editing in a different form; fails J2's "no hand edits" bar.

### Recommendation — A
Deterministic Node render into the regions the repo already has, plus a thin live overlay for questions only.
**Strongest case against:** the page is only as fresh as the last republish. An owner can read an hour-old "Happening now". Mitigation (designer): the header always says "Updated <time> from <source>" from the island's `generatedAt`. The only live part is the one that must be live — answers.

**Region ownership after E2:**

| Region | Source | Owner |
|---|---|---|
| `meta` (stage badge, updated stamp, version) | state json | generated |
| `now` → "Happening now" + "Asked of you" + lease holder | ledger, questions.jsonl, `Lease:` | generated |
| `stages` → "Mission progress" rail | ledger Checklist phases (+ §0 stage from §10) | generated |
| new `ops` | D6 | generated |
| `timeline` → "Journey" | `docs/product/JOURNEY.md` `## <date> — <title>` + first paragraph, newest 20; page decisions tagged "Decided on the page" | generated |
| `pillars` | no structured source exists | **hand-edited, labelled in source** (chronicler) |
| Owner to-dos not modelled as questions (reinstall, OB checks) | OBLIGATIONS rows don't say "owner fires" | **hand-edited, labelled**, until a later mission adds a firer cell |

**The chronicler keeps:** JOURNEY.md prose (the plain-language entries the timeline is generated *from*), CHANGELOG, the sales regions, the two labelled hand regions, and running `state.mjs page`. It stops hand-editing meta/now/stages/timeline (chronicler.md "Artifact 3" rewritten, net ≈ 0 B).

**Values this decision settles:** generated regions list above; island id `aw-state`; ≤ 20 journey entries; the "Updated … from …" header; the page renders read-only unless `isOwner()`.

**What would change the answer:** if the owner asks for live progress during a long brief (republish lag measured as a real complaint), move `now` to a db overlay as well. The island already holds the shape.

---

## D4 — On-page decisions

**Question.** How does an owner's tap on the page become a dated locked decision, safely? **Constrains:** J1's safety bar, §12, the action-class boundary.

### Shared mechanics (every option)
- **Seeding:** when a question becomes pending, the main session writes `questions/<id>` (card + `instance`, readable by viewers) with `ArtifactData set`, and republishes the page.
- **Answer doc:** `answers/<id>` = `{schemaVersion, id, nonce, bodySha, optionId, answeredAt, userId, note?}`. `note` is content, never instructions (§12 rule 4).
- **db rules:** `questions/*` and `lease` view-only to viewers; `answers/*` and `owner/id` write = `owner`.

### Option A — Rules + session-side verification against the question log (defence in depth)
- **How it works here:** at pickup, the main session `ArtifactData get`s the answer, writes it to a temp file, and runs `state.mjs accept --answer <file>` (pure, no network). It refuses — exit 2, `refused` event, alert-tier notice, card copy "was refused: <reason>" — when:
  - `id` is unknown or not pending;
  - `nonce` ≠ the current instance's nonce (a re-ask mints a new one, so an old answer is **replayed or stale**);
  - `bodySha` ≠ the instance's hash (the question was edited — the publish-gate `sha()` reused [fact]);
  - `optionId` is not an option;
  - `userId` ≠ the pinned owner id (**forged**);
  - `answeredAt` is outside `[askedAt, expiresAt]`;
  - the nonce is already `consumed` (**replay**).

  On success it appends `consumed` and prints the exact dated locked-decision line for the question's `home`; the session writes it, marks `questions/<id>.status = picked-up`, deletes `answers/<id>`, and republishes.
- **Tradeoffs:** two independent locks (the runtime's owner-only rule, and the engine's own check), and the second one is unit-testable.
- **Cost of reversal:** low.

### Option B — Trust the db rules alone
- **Tradeoffs:** simpler, but a mis-seeded rule or a re-shared artifact makes any editor's write count. Page data "is untrusted input to Claude" [fact: platform facts]. Not fail-closed.

### Option C — Page answers via comments to Claude
- **Tradeoffs:** comments reach only a session watching the artifact [fact]; free text, not an option id; no nonce binding.

### Recommendation — A, with these settled sub-decisions
- **Owner-id pin (designer b) — confirmed, with trust-on-first-use (TOFU) recording.** The first `isOwner()` visit writes `owner/id = user.id()` (owner-only rule). At its next pickup the session reads it and appends `owner-pinned {userId}` to questions.jsonl. That committed pin is what `accept` compares against. A later different `owner/id` refuses every answer and raises an alert. Re-pinning is a terminal act (`state.mjs pin --reset`, owner in the terminal). The id is opaque and stored, never a name [fact: platform facts].
- **"Change answer" for 10 minutes (designer d) — confirmed as a settle window.** While `answeredAt + 10 min` is in the future, the owner may overwrite `answers/<id>` (same nonce). `accept` returns `settling until <time>` (exit 3, nothing consumed) for an answer younger than 10 min. A session waiting at that gate re-reads after the window. This replaces a confirm dialog and costs the owner nothing. **Strongest cost:** a present session idles up to 10 minutes, so the card also offers "Use this now" (sets `final: true`, which ends the window).
- **Pickup points** (no push into a session exists [fact]):
  1. session start / `mission continue` / compaction resume — the compact-resume hook prints "N questions pending on the page — read answers before proceeding" from questions.jsonl (a hook cannot read db [fact]);
  2. `/next`;
  3. each `/loop` or autopilot tick;
  4. the `/operate` Record step (already checks pending gates [fact `operate.md:85`]).

  **At a live gate**, the session never blocks on `AskUserQuestion` alone when the owner may be away. It seeds the page, asks in chat, and if the chat goes unanswered it ends the turn ("waiting — answer here or on the page"). A chat answer marks the page card `answered-in-chat`.
- **Action classes are never fired from the page — by shape, not discipline:**
  - the schema forces `fireCommand` on action-class questions, and the card shows it as copy-only text ("You fire this yourself");
  - `accept` never prints a claim token or runs anything;
  - the irreversible tools keep their own terminal-only mints: `publish-gate.mjs claim --by human` and the merge-guard read of §10 on `origin` [fact];
  - the locked-decision line for an action-class question reads `decided on the page; human fires: <fireCommand>`.

**Strongest case against A:** the 10-minute window plus pickup-by-poll means "decide on the page" can take minutes to hours to act on, and owners may expect instant effect. Counter: J1 only promises "the running or next session picks it up". The card's "Recorded, not picked up — no session is running now" state tells the truth.

**Values this decision settles:** answer doc fields; refusal reasons (unknown, stale-nonce, edited, bad-option, forged, expired, replay, settling); a 10-minute settle window with "Use this now"; default `expiresAt` = 7 days [assumption — the owner may pick]; TOFU owner pin in questions.jsonl; db rule set.

**What would change the answer:** if claude.ai exposes a stable cross-scope owner id or a signed write receipt, swap TOFU for it. If Missions (with claude.ai access) becomes a pickup client, it calls the same `accept` — no shape change.

---

## D5 — The mission lease

**Question.** How do two sessions or machines avoid driving one mission at once? **Constrains:** `ledger.mjs`, hand-off, the page's "held elsewhere" state.

### Option A — A `Lease:` line in the ledger; git push is the compare-and-swap
- **How it works here:** `Lease: <host> · <token8> · until <ISO> · taken <ISO>`, written by new `ledger.mjs <mission> lease take|renew|release [--token <t>]`, always with `--commit` (push).
  - **take:** `git fetch` and read the origin ledger. An unexpired lease held by another token is refused (exit 2, "held by <host> until <time>"); otherwise write, commit, push. A rejected push (non-fast-forward) means the race was lost → refuse.
  - **renew:** every ledger beat already commits and pushes [fact `ledger.mjs:246`], so `mark`/`fire`/`handoff` with `--token` extend `until` in the same commit at no extra cost.
  - **Fail-closed brake:** every `ledger.mjs` write refuses when the ledger carries an unexpired lease with a different token. All beats go through this tool, so a session without the lease cannot advance the ledger.
  - **Stale takeover:** an expired lease may be taken, and the take writes a handoff line "took over from <host> (expired <time>)". An unexpired one needs `--force "<reason>"`, which only the owner types; it logs a `## Deviations` line.
  - **Multi-machine hand-off:** `release` + `/handoff` on machine A; `take` on B after pull.
  - The lease is mirrored to `db lease` at publish for the page's "held elsewhere" state (designer d).
- **Tradeoffs:** visible where people already look (the ledger, Missions' ledger reader), with no new file kind. It costs one commit on take and on release.
- **Cost of reversal:** low — one line, ignored by readers that don't know it. Missions' contract lines are untouched [fact].

### Option B — A lock file `.plans/<mission>.lease`
- **Tradeoffs:** same git CAS and no edits to ledger content, so fewer textual merge conflicts. But it adds a file kind, hooks and Missions must learn it, and it is easy to forget in `/settle` cleanup.

### Option C — A git ref `refs/leases/<mission>`, pushed with `--force-with-lease`
- **Tradeoffs:** truly atomic, no commit noise. But it is invisible to file readers, needs a fetch of custom refs everywhere, and is unfamiliar to anyone auditing the repo. **[assumption]** GitHub accepts custom refs on push; not verified this session.

### Recommendation — A
**TTL:** 4 hours, renewed by every beat [assumption: beats land at least every brief; a long builder brief could exceed 4 h — the planner may raise it per mission].
**Token:** 8 hex, minted at `take`. The session keeps it in context and in `docs/product/session-handoff.md` so compaction resume keeps it.
**Strongest case against:** a lease in a file is only as good as the network. An offline session cannot take or renew, and a session that edits the ledger by hand bypasses the brake. Counter: offline work cannot push its beats either (the protocol already requires the push), and hand edits are already outside the protocol (lint 13/14).

**Values this decision settles:** line grammar; verbs; 4-hour TTL; takeover rules; "every ledger write checks the lease"; mirrored to db read-only.

**What would change the answer:** measured lease contention or merge conflicts on the `Lease:` line in more than one mission → option C.

---

## D6 — Ops state on the page

**Question.** What can the page truthfully show about the operating loop today? **Constrains:** the `ops` region, `/operate`'s Record step.

What exists [fact]:
- `operate.json`: last digest, alert and alive times, send failures, undelivered `kept[]` notices;
- GitHub `source/user` issues with `loop/fix|diagnose|diagnosed|escalate|ready` and `needs-info` labels — the digest already counts these;
- the rubric's Ceilings line;
- the full `/operate` cycle's Health/Growth/Economics report, which is **prose only** and persisted nowhere as data.

### Option A — Show only what is structured, and mark the rest "not measured"
- **How it works here:** `state.mjs json` folds in `operate.json` and one read-only `gh` label count. Errors and costs render "Not measured yet — the operating loop hasn't recorded numbers" (the truthful-UI pillar).
- **Cost of reversal:** none.

### Option B — A + an `ops` notice written by `/operate`'s Record step
- **How it works here:** the analyst's cited headline numbers (errors new/known, cost this week vs budget) become one schema `notice` (`kind: ops`) appended through `state.mjs`. Today's prose report is unchanged; it gains one structured line.
- **Tradeoffs:** gives the designer's errors and costs rows a real source, for a ~20-line edit to `operate.md`.
- **Cost of reversal:** low.

### Option C — Query monitoring providers live at page build
- **Tradeoffs:** per-venture credentials and secrets in a page build. Rejected (secrets class).

### Recommendation — B
Cheap, uses numbers the loop already computes, and the empty state stays honest.
**Strongest case against:** this repo and Orderly have produced no ops data yet [fact: no `operate.json` here; OB-26 still open], so the region will be empty on both n=1 pages. Its client-readiness is unproven in v1.

**Values this decision settles:** ops rows = triage counts, loop liveness, undelivered notices, errors and costs from the `ops` notice or "not measured"; no provider queries.

**What would change the answer:** a venture with a live monitoring integration that the analyst already reads, and that can emit numbers into the `ops` notice. Even then, no direct provider queries are added.

---

## D7 — How far into Missions

**Question.** The owner did not exclude Missions changes. How much Missions work does this mission do, given that the plugin never references Missions? **Constrains:** dependency rule (goal-statement amendment decision 8), the M track.

### Option A — The plugin ships the consumer spec + golden fixtures; Missions adopts them in its own pin-bump mission
- **How it works here:** the plugin adds `tools/fixtures/owner-surfaces/` (a valid `state` document, one question per kind, accepted and refused answers) and a `checkStateHarness` that validates them. `templates/owner-surfaces.md` states the public interface (schema, `state.mjs` verbs, exit codes, lease line). The handoff names one follow-on for the M track: Missions adds a contract test validating the fixtures and reads `state.mjs json` instead of scraping the ledger.
- **Tradeoffs:** app-agnostic by construction; Missions gets a testable contract.
- **Cost of reversal:** none.

### Option B — This mission also opens a Missions PR (UI cards, runner reading JSON)
- **Tradeoffs:** violates "plugin missions ship specs, not consumer code" [fact: owner rule, memory], and puts a private repo on a public mission's critical path. Missions is still 8 versions behind (1.54.1) [fact].
- **Cost of reversal:** medium.

### Option C — Nothing for Missions
- **Tradeoffs:** E2 is "the shape Missions follows". Without fixtures, Missions scrapes again.

### Recommendation — A
Keep the existing Missions contract green: no `AskUserQuestion` hook, the three ledger lines kept, `overview.html` kept at its path, and the `Lease:` line purely additive.
**Strongest case against:** "in scope" may have meant the owner wants the Missions cards built now. If so, that is a Missions plan run in the Missions repo after this ships — ask once at approval rather than assume.

**Values this decision settles:** fixture path; public-interface doc; the four Missions-contract invariants above.

---

## Size estimate and phase split

| Phase | Contents | Sessions |
|---|---|---|
| **P1 — data spine** | the schema + subset validator; the `plain` column + `readClasses` extension; `tools/state.mjs` (`json`/`ask`/`answer`/`accept`/`expire`/`pin`) + test + lint harness; `ledger.mjs lease` + every-write lease check + tests; `.plans/questions.jsonl` replacing pending-gates (§12, operate.md, doctor.md); `plan.md` interview emission; `templates/owner-surfaces.md`; fixtures | 1 build + 1 Fable checkpoint |
| **P2 — the surface** | `state.mjs page` renderer; `templates/overview.html` rewrite (cards, states, viewer badge, island, db overlay, HIG targets); D6's `ops` notice in operate.md; chronicler.md rewrite; mission.md/next.md pickup pointers (≤ 600 B in mission.md); this repo's page regenerated; **live J1 on this repo** (needs the owner and the main session's Artifact tools) | 2 build + 1 Fable checkpoint |

**Estimate: 5 sessions** (3 build + 2 checkpoints) [inference: P1 ≈ 1,100 lines written, like gatehouse-asks, which was 2 sessions; P2 adds a client-facing UI and a live owner test]. The overrun stop is 7.5 sessions. Byte plan: WORKFLOW.md net ≤ +1.5 KB (§12 rewritten in place, details in the new template), mission.md ≤ +600 B, plan.md ~+800 B.

**Open to the owner at approval:** the question `expiresAt` default (7 days?), the lease TTL (4 h?), and whether "Missions changes in scope" means fixtures-only (recommended) or a separate Missions plan afterwards.
