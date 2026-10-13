---
status: frozen
owner-agent: architect
refresh-trigger: never
---

# agentic-workflow — Decision memos: adaptive-ceremony D1–D6 (2026-10-13)

_Shape-before-build memos for `docs/product/decisions/2026-10-13-adaptive-ceremony-brief.md` (goal §E1). Six decisions, one recommendation each; the human picks. The interview answers in the brief are locked inputs. Labels: **F** fact (cited) · **I** inference · **A** assumption. Facts were checked against the tree at `dc9bf34`._

Shared facts the six memos lean on:
- **F** `/sync` re-copies `templates/WORKFLOW.md` over `docs/WORKFLOW.md` and preserves only "§10 Project profile (the filled table)" and Local amendments; any other project edit is moved to Local amendments as `recovered from <section>` drift (`commands/sync.md:30-48`). Sync does not say whether §10.1 (Executors) counts as part of "the filled table".
- **F** §0's only table has three columns, `Stage | Produces | Exit gate`. Its seven rows list artifacts as prose, with some backticked paths, and gates as prose (`templates/WORKFLOW.md:79-87`). The gates that run on every change (plan-judge, phase-checkpoint reviewer, staging verify, counsel, multi-vote audit, chronicler, mission-close) live in §5, not in §0.
- **F** No file records the current stage: `/next` works it out from which artifacts exist (`commands/next.md:43`). §10 has no Stage row.
- **F** `tools/lint.mjs` `checkRuleDedup` covers the **plugin tree only**, never a venture's `docs/WORKFLOW.md` (`tools/lint.mjs:1084`, §5 line 457). Its `fable-boundary` detector matches `/Fable/` plus ≥2 of `auth, credential, tenancy, money, schema, migration, security boundary` in one paragraph (`tools/lint.mjs:1110`).
- **F** `tools/conform.mjs` (230 lines) reads only the filesystem, does no git or network work, and is safe to run in a hook. The SessionStart `conform-check.sh` runs it on startup and resume, as advice only, always exiting 0 (`hooks/hooks.json:172`).
- **F** `merge-guard.sh` reads only the §10 Merge policy cell and, under records-only, a fixed path allowlist. No hook knows about change classes (`hooks/lib/merge-guard.sh:1-17`).
- **F** Apart from agent rows, the tune presets carry only `note` (lean) and `tick_budget: 750000` (unattended) (`templates/tune-presets.json`). Presets choose *who* runs a role, never *whether* a gate runs.

---

## D1 — Where the ceremony table lives

**The question.** Where the per-artifact/per-gate table and its override lines are stored so that `/sync` keeps them, hooks and tools can parse them, and the owner can edit them in place (AC-1, AC-4, AC-11). Constrains: the sync preserve rule, D2's write target, D6's check input. Locked: the `Ceremony profile` **row** goes in §10.

### Option A — §10.2 sub-table inside §10, plus an override list
- **How it works here.** The §10 row `Ceremony profile` holds `proposed|confirmed (derived vX.Y.Z YYYY-MM-DD[, confirmed YYYY-MM-DD])`. Below §10.1 sits `### 10.2 Ceremony`, a table with columns `| id | kind | stage | class | derived | signal | effective |`. Under it is a `Overrides:` list, one line per override: `- YYYY-MM-DD · <id> · <from>→<to> · "<owner words>"`. Asked answers (AC-2) use the same grammar with `asked:` in place of the quote. The tool owns `derived`, `signal` and `effective`. The owner owns the override lines. `sync.md` §2 gains one line: preserve §10 **through the next `## ` heading**, which also settles the 10.1 ambiguity.
- **Tradeoffs.** One file holds the whole posture, and that file is the one every hook already reads `origin/<default>` from. Roughly 30–45 rows land in each venture's `docs/WORKFLOW.md` (the plugin template carries only a placeholder, so the template's 120 KB lint budget is untouched).
- **Operational cost.** One sync sentence and one bootstrap/adopt placeholder.
- **Cost of reversal.** Low: move the block into a file and leave a pointer row.

### Option B — a separate file (`docs/product/engineering/ceremony.md`); §10 row points at it
- **How it works here.** Same table and override grammar in its own file, outside sync's re-copy path.
- **Tradeoffs.** Survives sync with no rule change, and keeps `docs/WORKFLOW.md` short. But the owner's locked answer puts the profile "into §10", so readers now take a two-file hop, and a deleted or missing file has to be specified to fail closed. `.plans/` is wrong because it is orchestrator-owned ledger space that the owner should not hand-edit (AGENTS.md).
- **Cost of reversal.** Low.

### Option C — `docs/ceremony.json` as the truth, with a rendered markdown view
- **How it works here.** The tool reads and writes JSON and renders §10.2.
- **Tradeoffs.** Machine-clean, but it breaks AC-4: the owner would edit JSON, or edit the view and lose the change on the next render. That brings back the drift problem §8 polices. Dated override lines in JSON are awkward to read.
- **Cost of reversal.** Medium, because the render step is the thing to unwind.

### Recommendation — **A.**
The posture belongs where the policy rows already live, and one sentence in sync makes it durable. **Strongest case against:** `docs/WORKFLOW.md` grows by a table that most sessions never need, and the whole §10 is read verbatim into every brief. Mitigation: briefs quote the `Ceremony profile` row only, and gate-running commands read §10.2 through `ceremony.mjs effective`.

**Values this decision settles:** row key `Ceremony profile`; heading `### 10.2 Ceremony`; columns as above; `kind ∈ {artifact, gate}`; cell values `required|optional|skipped`; override grammar `- YYYY-MM-DD · <id> · <from>→<to> · "<words>"`; sync preserves `## 10.` up to the next `## `.

**What would change the answer.** If the §10 verbatim quote in briefs costs more than ~2K tokens per brief (measured at AC-13), move to B and keep a one-row pointer.

---

## D2 — Derivation engine

**The question.** What turns observable signals into the table, batches the ambiguous signals into one owner question, and checks drift. Constrains: AC-1/2/3/11/12, the fixtures, and the bootstrap/adopt/sync/doctor prose.

### Option A — new `tools/ceremony.mjs` (derive · effective · check), plus one conform ladder entry
- **How it works here.** Zero dependencies, filesystem only (conform's contract). It has three subcommands.
  - `derive --root` prints JSON `{ rows, asks }`. `asks` lists the cells it could not decide.
  - `effective <id>` returns the cell after overrides and refusals.
  - `check` reports refused overrides, drift (re-derived signals versus the recorded `signal` column), a missing or unreadable stage table, and a profile that is absent or still `proposed`.
  - The tool is non-interactive. The **command** (bootstrap/adopt/sync) turns `asks` into one batched AskUserQuestion. An unanswered ask is written as `required` with `asked: <date> · no answer`.
  - `conform.mjs` gains one ladder entry, "`Ceremony profile` row present", so the existing SessionStart hook and `/sync` flag profile-less repos without new code paths. `/doctor` and `/sync` call `check` for AC-12.
- **Tradeoffs.** The derivation is deterministic and fixture-testable: AC-3's rewritten-table fixture becomes a harness test like `run-claude-test.mjs`. It is the only option where "observable" can be proven.
- **Operational cost.** About 250 lines plus a test harness, and one more `check*Harness` in lint.
- **Cost of reversal.** Low: delete the file and the ladder line.

### Option B — extend `tools/conform.mjs`
- **How it works here.** Add derive/check modes to the conform ladder script.
- **Tradeoffs.** Reuses the argv and section helpers. But conform's job is "structure matches the installed plugin", deliberately cheap ("file exists / line matches / row present", `conform.mjs:24`). Signal heuristics such as dependency greps and migration-dir probes, plus override resolution, would roughly double it and slow a SessionStart hook.
- **Cost of reversal.** Medium, because the two jobs would need untangling.

### Option C — prose only in `commands/bootstrap|adopt|sync.md`
- **How it works here.** The agent reads the repo and fills the table by judgment.
- **Tradeoffs.** No code. But two runs on the same repo can disagree, AC-3's fixture cannot be tested, and drift (AC-12) cannot be computed. "Observable" turns into "plausible".
- **Cost of reversal.** None, but it fails three ACs.

### Recommendation — **A.**
A pure tool plus a one-line ladder hook reuses the recognize/conform split that already exists. **Strongest case against:** some signals are inherently fuzzy. "Auth surface present" can be a dependency with no routes, and the current stage is never recorded (F, above). A tool that asks on everything it cannot be sure of could land on an AskUserQuestion of 6+ items. Mitigation: only the stage and the three surface signals may ask; every other signal is read from an existing §10 row or decided by file presence.

**Values this decision settles:**
- File: `plugins/agentic-workflow/tools/ceremony.mjs`; subcommands `derive | effective | check`; `--json`.
- Signal sources:
  - stage: §0 artifact presence (ask if two stages tie);
  - deploy: §10 Deploy row ≠ `none`;
  - auth / payments / schema: path and dependency probes (ask on a partial hit);
  - test policy, publish policy, merge policy, catalog: the §10 cells verbatim.
- An ask is never repeated once it has a dated answer. `/sync` writes `proposed`, and the effective value stays `required` everywhere until the row says `confirmed` (AC-11).

**What would change the answer.** If the asks average more than 3 per adopt across Orderly and Missions, add a §10 `Stage` row so the stage stops being inferred.

---

## D3 — Gate-class taxonomy shape

**The question.** How the three lists collapse into one template that triage, LA-5, the reviewer and the ceremony table all read (AC-8/9), and which classes are irreversible (AC-5). Locked: triage's 8 are the base.

The three lists today: triage has schema/migrations · auth · payments · CI/deploy config · secrets · third-party contracts · not reproducible · size above S. LA-5 adds session/entry credential · authorization/tenancy · money · security boundary. The reviewer adds webhooks.

### Option A — 6 change classes + 1 added class + 2 triage-only qualifiers, attributes as columns
- **How it works here.** `templates/gate-classes.md` holds one table: `| class | matches (paths/concepts) | irreversible | reviewer tier | triage |`.
  - **Change classes** (these describe what a diff touches and are the only values a gate may carry):
    1. schema/migrations;
    2. auth, which absorbs session/entry credential and authorization/tenancy (triage's own text already says "sessions, tokens, roles, permissions");
    3. payments, which absorbs "money";
    4. CI/deploy config;
    5. secrets;
    6. third-party contracts, which absorbs the reviewer's "webhooks" (triage's text already says "a webhook from a provider").
  - **New class 7, security boundary.** This covers trust-boundary code that is not auth, such as input sanitisation at an ingress, CSP/CORS, sandboxing, and webhook signature checks.
  - **Qualifiers**: `not reproducible` and `size above S` describe a *report*, not a diff. They stay in the file under their own heading with `triage: escalate`, and a gate can never carry them (AC-9's `class` column only accepts 1–7 or `none`).
  - Attributes:
    - irreversible = 1, 2, 3, 4, 5, 7;
    - reviewer tier `top` = 1, 2, 3, 7, which is exactly today's Fable set;
    - triage `escalate` = all 7 plus both qualifiers.
- **Consumption.**
  - The §5 `fable-boundary` fenced block is rewritten to: "the top reviewer tier is required for any review whose diff touches a class whose reviewer-tier is `top` in `templates/gate-classes.md` — a two-line diff included".
  - `checkRuleDedup`'s mechanics keys for that rule become `[/gate-classes/, /reviewer[- ]tier/, /two-line/]`. Otherwise the canonical block stops matching its own detector.
  - `gate-classes.md` must not contain the word `Fable`; it says "top tier", so the dedup lint does not flag the table as a restatement.
  - A new lint check, `checkClassListDedup`, fails any paragraph outside `gate-classes.md` that names ≥4 of the class keys.
  - `operate-triage.md` keeps its heading and points at the file.
  - The reviewer description changes to "risky-change reviews (the classes in `templates/gate-classes.md`)".
- **Tradeoffs.** No triage behaviour change for classes 1–6. Class 7 makes the loop escalate *more*, which is the fail-closed direction. The irreversible set matches AC-5 plus security boundary.
- **Cost of reversal.** Low, since this is one data file.

### Option B — strictly the 8, nothing added
- **How it works here.** Security boundary folds into auth; the qualifiers stay in the same list.
- **Tradeoffs.** Fewest moving parts. But a sandbox, CSP or ingress-validation diff loses the top-tier review it gets today. That is a **safety regression** against LA-5, which E1 forbids. Also, gates would be allowed to carry `size above S`, which is meaningless for a gate.
- **Cost of reversal.** Low.

### Option C — union of all three lists (≈12 classes)
- **Tradeoffs.** No term is lost, but it keeps the near-synonyms (auth/credential/tenancy, payments/money) that the unification exists to remove, and triage's comment grammar ("names the class verbatim") grows a dozen labels.
- **Cost of reversal.** Low.

### Recommendation — **A.**
It loses no current protection and turns three prose lists into one table with a column per consumer. **Strongest case against:** a new class is a change to E0's shipped escalation behaviour, decided in a different mission. If the owner reads "8 classes are the base" as "exactly 8", Option B with "security boundary" written into auth's `matches` text is the retreat. Under that retreat the top-tier review survives, because tier keys on auth.

**Values this decision settles:** file `plugins/agentic-workflow/templates/gate-classes.md`; class ids `schema-migrations, auth, payments, ci-deploy, secrets, third-party, security-boundary`; qualifier ids `not-reproducible, size-above-s`; irreversible = all but `third-party`; the `boundary_escalation: off` tune (#91) keeps working because it keys on the tier column. The merge guard does **not** read this file in v1 (see D6).

**What would change the answer.** If a fork needs a domain class (for example `clinical-data`), the table takes a row and no code change, which still fits A. If the owner rejects class 7, use B with the auth widening.

---

## D4 — Reading the stage/gate table from the protocol template

**The question.** How `ceremony.mjs` enumerates stages, artifacts and gates from `docs/WORKFLOW.md` §0 with no hard-coded V0–V6, so that a fork's rewritten table works (AC-3). Constrains: the §0 table shape, the fork contract, and fixtures.

**F** As written, §0 does not enumerate artifacts: they are prose in `Produces`. §0 also holds none of the per-change §5 gates. So "parse §0" alone cannot produce AC-1's "one row per stage artifact and per gate", nor the gates that drive metric 1.

### Option A — header-keyed parse of the existing §0 table
- **How it works here.** Find the first table under `## 0.` whose header contains `Stage` and `Exit gate`. Rows are stages, and artifacts are the backticked paths in `Produces`.
- **Tradeoffs.** No template edit. But V2, V3 and V4 have almost no backticked paths, so the artifact rows come out empty or wrong, and the §5 gates are missing entirely. The result is fragile to any prose edit.
- **Cost of reversal.** None.

### Option B — a marked, column-explicit block: §0's table gets two columns and a fence, plus a §5 checkpoint-gate list
- **How it works here.**
  - Wrap §0's table in `<!-- stage-table -->…<!-- /stage-table -->` and add two columns: `Artifacts` (backticked ids or paths, comma-separated) and `Gate` (`<gate-id> · human|reviewer · <class|none>`). It stays one human-readable table, not a second copy.
  - §5 gains a short fenced list `<!-- checkpoint-gates -->` with plan-judge, phase-reviewer, staging-verify, counsel, multi-vote-audit, chronicler and mission-close, each with its class default.
  - The parser reads columns **by header name** inside the fences, so a fork can rename stages, change their count, or reorder columns. It cannot drop the fence or the two headers.
  - Missing fence or header → `check` reports "stage table unreadable" and every cell is `required`. That covers the brief's "could not read the stage table" state.
- **Tradeoffs.** The §0 table gets wider, and lint must check the fence's grammar in the plugin template. In exchange, artifacts and gates become data, and the gates that actually cost sessions become profilable.
- **Cost of reversal.** Low: remove the fences and columns.

### Option C — a separate `templates/stages.json` read by the tool
- **Tradeoffs.** Easiest to parse, but §0 and the JSON become two sources of truth for one table, the "duplicate" E1 forbids. A fork would have to edit both.
- **Cost of reversal.** Low.

### Recommendation — **B.**
It is the only option that yields real artifact and gate rows while keeping one table. **Strongest case against:** forks and older copies that predate the fence get no adaptive ceremony. That is the fail-closed outcome, and `/sync` brings the fence into any project that re-syncs. Note that a *venture* rewriting its own §0 is undone by `/sync` (drift goes to Local amendments). Only a plugin **fork's** template edit survives, which matches E1's "a fork that rewrites the table".

**Values this decision settles:** fences `stage-table` (§0) and `checkpoint-gates` (§5); required headers `Stage`, `Artifacts`, `Gate`; gate cell grammar `<id> · human|reviewer · <class|none>`; an unreadable table means all cells `required` and the profile row reads `unreadable (YYYY-MM-DD)`. The AC-3 fixture is a 4-stage table with renamed stages.

**What would change the answer.** If a second fork wants per-stage gates beyond one exit gate, let the `Gate` cell hold a `;`-separated list. That is a grammar extension, not a new shape.

---

## D5 — Unify scope: how the knobs relate to the profile

**The question.** What is the minimum that satisfies "unify, do not duplicate" (AC-10) without rewriting every command. Locked: autopilot and intake + `/next` rewiring are IN.

### Option A — every knob reads the profile
- **How it works here.** Altitudes, presets, the autopilot check-in level, intake and `/next` all compute their behaviour from §10.2.
- **Tradeoffs.** Maximal unification, but it couples orthogonal axes. Presets choose model/effort per role, and altitudes size one piece of work. Neither is "how much ceremony a project needs". Rewriting them means touching ~8 commands and risks the 16 KB/24 KB budgets.
- **Cost of reversal.** High.

### Option B — readers where ceremony is decided; one relation line where the knob is orthogonal
- **How it works here.**
  - **Read the profile** (via `ceremony.mjs effective`):
    - `mission.md` and `autopilot.md` at every gate they run;
    - `/next` excludes skipped stage artifacts from "unmet gate for the current stage";
    - `intake` names the profile's effective gates in its route line.
  - **One relation line each:**
    - §1 altitudes: "altitude sizes the work; §10.2 decides which gates inside it run";
    - `tune-presets.json` note and `/tune`: "a preset picks who runs a gate, never whether";
    - §11: "check-in level sets *when* the human merges (gate policy); §10.2 sets *which* gates exist; a skipped gate is never re-enabled by check-in level, a required one never removed by it".
  - The relation lines are prose pointers, so they cannot drift into a second table.
- **Tradeoffs.** Four read points and three sentences. Owners keep presets and gate policy as separate dials, which they are.
- **Cost of reversal.** Low.

### Option C — a single `ceremony level` scalar (light/standard/full) that sets presets, gate policy and the table
- **Tradeoffs.** One knob for the owner, but it is a second, coarser notion of ceremony beside the table. That is the duplication AC-10 forbids, and it hides per-gate overrides.
- **Cost of reversal.** Medium.

### Recommendation — **B.**
It puts the profile where gates are actually run or recommended, and states the orthogonality instead of faking a merge. **Strongest case against:** the owner may hear "unify" as "fewer dials", and B leaves four (preset, gate policy, altitude, profile). The answer is that only the profile governs *whether*. The other three govern who, when and how big, and the relation lines say so.

**Values this decision settles:** read points are mission.md, autopilot.md, next.md and agents/intake.md; relation lines go in §1, §11 and the `tune-presets.json` note; no new scalar.

**What would change the answer.** If AC-13 shows owners consistently pair one preset with one profile shape (for example lean with mostly-skipped), offer a bootstrap default pairing. It would be a default, never a coupling.

---

## D6 — Enforcement: irreversible-skip refusal and silent-skip detection

**The question.** What mechanically refuses an owner skip on an irreversible-class gate (AC-5) and fails a silently skippable required gate (AC-7). **F** Plugin lint never reads a venture's `docs/WORKFLOW.md`, so "refused by lint" cannot mean plugin lint for a venture's override. **F** No hook checks this path today, so AC-5's "guard where a hook already checks" is empty in v1.

### Option A — refusal at resolution + `check` advisories + plugin lint over the plugin's own gate sites
- **How it works here.**
  - *Fail closed by shape.* `ceremony.mjs` writes `effective` as `required (override refused: <class> is irreversible)` for any skip on a gate whose class is irreversible. The refused override line stays visible but has no effect, so an eye-reader sees `required` too.
  - `check` reports it from `/doctor`, `/sync` and the SessionStart conform advisory.
  - *Silent skip.* A new §5 fenced rule `<!-- rule: ceremony-skip -->`: "a gate whose effective cell is `skipped` writes exactly one ledger Deviations line `gate <id> skipped — ceremony (<signal|override date>)`; any other cell runs the gate". Each gate-running command (mission, autopilot, verify, counsel, audit) carries a byte-identical `rule-copy`.
  - A new plugin lint check fails when a gate id in the `checkpoint-gates`/`stage-table` fences has no owning command carrying the copy, and when a fixture profile has a refused override that does not render as refused.
- **Tradeoffs.** No new hook, and the illegal state cannot take effect. The cost is that a hand-edited `effective` cell is trusted until the next `check`.
- **Cost of reversal.** Low.

### Option B — A + a PreToolUse hook on Edit/Write of `docs/WORKFLOW.md` that blocks an irreversible skip
- **Tradeoffs.** It stops the edit itself, but it is bypassable via Bash `sed`, it parses markdown on every edit of a 1,400-line file, and it adds a blocking hook (exit 2) for a state that A already makes inert.
- **Cost of reversal.** Medium, since hooks are High-impact files.

### Option C — teach `merge-guard.sh` the classes: block an agent merge whose diff touches an irreversible class with a skipped gate
- **Tradeoffs.** It catches the moment of harm, but the guard is bash and would need to parse a markdown taxonomy plus path globs. That widens an audited fail-closed script for a case that `records-only` already excludes and `human-only` already blocks.
- **Cost of reversal.** Medium.

### Recommendation — **A.**
Making the skip inert at resolution is stronger than blocking the edit, and it needs no new hook. **Strongest case against:** an agent that reads §10.2 by eye and hand-writes `effective: skipped` bypasses resolution until `check` runs. The mitigation is that only `ceremony.mjs` writes that column, and `check` runs at every session start through the existing conform hook.

**Values this decision settles:** rule id `ceremony-skip` (§5 fence + rule-copies, under checkRuleDedup); deviation grammar `gate <id> skipped — ceremony (<signal|override YYYY-MM-DD>)`; refusal text `required (override refused: <class> is irreversible)`; no new hook in v1; the merge guard is unchanged.

**What would change the answer.** If AC-13 or a later retro shows a gate skipped on an irreversible class despite A, take B, the edit-time hook.

---

## Brief corrections (for the planner)
1. AC-5 "refused by lint": plugin lint cannot see venture copies. Refusal is at resolution (`ceremony.mjs`), reported by `check`, and plugin lint covers only fixtures and the plugin's own gate sites (D6).
2. AC-3 "read the stage and gate table from §0": §0 enumerates neither artifacts nor the per-change §5 gates. A fenced, column-explicit table plus a `checkpoint-gates` list is required (D4). Without the §5 gates, metric 1 cannot move for a project living in V6, such as this repo.
3. AC-1 "current stage" is not an observable recorded signal: it is inferred from artifacts (`next.md:43`) and may need to be asked (D2).
4. The interview's "merge guard reads the taxonomy" has no AC and is not recommended for v1 (D6 C).

## Questions only the owner can settle
1. D3: may the taxonomy add a 7th change class, `security-boundary` (needed to keep today's LA-5 coverage), or must it stay at exactly 8 with auth widened?
2. D4: accept widening §0's table with `Artifacts` and `Gate` columns inside a fence?
3. D6: accept "refused at resolution, reported by check, no new hook" as meeting AC-5?

_The architect consults; the **human decides**. Each choice lands as a dated locked decision in the master plan pointing at this file._
