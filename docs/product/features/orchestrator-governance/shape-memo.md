# orchestrator-governance — Shape memo (S1 / P1)

_A shape-before-build decision memo, digested so the human chooses between
options instead of doing the analysis. Authored by the `architect` (WORKFLOW.md
§6) for mission `orchestrator-governance`. Answers every **(b)** technical open
question in `.plans/orchestrator-governance.md`; the human locks the choices as
dated **Locked decisions** in that master plan before P2 starts. This is NOT the
`decision-log.md` (choices already made) — it PRECEDES the choice._

Claims are labelled **fact** (cited) / **inference** / **assumption**. Platform
claims about hooks were verified against the current Claude Code hooks docs
(code.claude.com/docs/en/hooks, fetched 2026-07-23), not memory.

## The question

How do we shape the eight technical unknowns of a two-axis orchestrator
governance layer — the hook drift-signatures, the router's work-vs-chat
detection, the thread-keeper's ledger derivation, the beat-enforcer's placement,
the north-star artifact, the `intake`/`compass` agent shapes, `compass`
notification gating, and the `intake`↔`compass` coupling — so P2–P5 build from a
locked spec? What it constrains downstream: the exact `hooks.json` commands
(hard to change once the felt-validation gate has run against them), the agent
frontmatter and cross-ref wiring (lint-enforced in both READMEs + WORKFLOW §6),
and the north-star template's schema (a template, expensive to reshape per §8).

## Shared platform facts (ground truth for every option below)

- **fact** — `hooks.json` today has `UserPromptSubmit` (injects via stdout),
  two `PreToolUse`/`Bash` guardrails (read stdin via `INPUT=$(cat)` + `jq -r
  '.tool_input.command'`, `exit 2` to hard-block, `echo` on `exit 0` for
  advisories), a `PreToolUse`/`Read` large-read backstop, `PostToolUse`, and
  `SessionEnd`. **There is no `Stop` hook today.**
- **fact** — `tools/lint.mjs` `checkHooks` (L249–252) only runs `bash -n` on each
  hook command, so any hook EVENT name (including `Stop`) is expressible and
  passes lint; correctness is never checked by lint (only syntax).
- **fact** (docs) — `UserPromptSubmit`, `UserPromptExpansion`, `SessionStart` are
  the only events whose **exit-0 stdout is injected as context Claude sees**. For
  other events stdout goes to the debug log. `UserPromptSubmit` `exit 2` blocks
  the prompt AND **erases it** (never use it for the router).
- **fact** (docs) — `Stop` fires when Claude finishes responding: `exit 2` blocks
  the stop and feeds **stderr** back to Claude (hard "keep going"); `exit 0` with
  JSON `hookSpecificOutput.additionalContext` injects a **non-blocking** note.
- **fact** (docs) — `PreToolUse` matches on tool name (`Bash`, `Edit|Write`, …)
  and receives full `tool_input` plus `transcript_path` and `cwd` as stdin JSON.
- **fact** — the live ledger schema (`.plans/*.state.md`, per
  portfolio-commons.state.md): a `Gate policy:` line, a `## Checklist` of
  `[x]`/`[~]`/`[ ]` rows, and a trailing `Next up:` line.
- **fact** — §12 (WORKFLOW.md L625–673) is the owner channel: three outbound
  tiers **Gate / Alert / Digest** (never routine progress), `[project]`-prefixed,
  never carries secrets, best-effort (a send failure never blocks). `/connect`
  records the transport; the send is a §12 side effect.
- **assumption** — the plugin is dog-fooded on itself and on ~1 active mission at
  a time; there is rarely more than one non-complete `.plans/*.state.md`.

---

## Q1 — Hook drift-signatures (which drifts are shell-detectable)

**Constrains:** which of the five named drifts become hook commands vs. get
punted to `intake`/`compass` judgment.

Per-drift signal analysis (**inference** except where the signal is a direct file
fact):

| Drift | Shell signal | Detectable in a stateless hook? |
|---|---|---|
| Front-door bare request | `UserPromptSubmit`, prompt does not start with `/` | **Partly** — "no slash" is trivial; "is it *work*" is the hard half → Q2 |
| Orch. edits/writes product source, no recent `Task` | `PreToolUse` `Edit\|Write` on a source path | **No, cleanly** — "no recent Task" is *history-dependent*; a single hook call can't see prior turns without scanning `transcript_path` (fragile/expensive) |
| Advances a `[~]` gate | commit / phase-advance (or `Edit` to `.state.md` flipping `[~]`→`[x]`) while a `[~]` checkpoint row exists | **Yes** — pure ledger grep |
| Reads source violating the 30% rule | `PreToolUse` `Read`, `wc -l` vs `limit`/offset span | **Yes** — a variant of the existing >800-line backstop |
| Forgotten chronicler/reviewer | `Stop` / commit while a required `[ ]`/`[~]` beat is unchecked | **Yes at the closing action** — ledger grep; pure turn-end omission needs the `Stop` hook (Q4) |

### Options (the overall detection *strategy*)

**Option A — Stateless tool+args+ledger grep only.** Hooks fire only on
signals readable from the current tool call + the ledger file. How it works here:
reuses the existing `INPUT=$(cat)` + `jq` + ledger-grep idioms verbatim.
Tradeoffs: crisp, fail-closed, can't-itself-drift; misses the two
history/semantic drifts. Operational cost: ~zero. Reversal: **low** (delete a
command).

**Option B — Add `transcript_path` scanning** for the history-dependent drifts
(e.g. grep the transcript jsonl for a recent `Task` before allowing an edit).
Tradeoffs: catches "edit with no recent Task", but couples a hook to an
undocumented transcript format, is slow on every edit, and is brittle (the
signal is a heuristic, not a fact). Reversal: **medium** (a felt dependency on
transcript shape). **inference** — high false-positive risk; violates
boring-first.

**Option C — Hooks catch the crisp signatures; the fuzzy ones are agent
judgment.** Hooks handle no-slash (→ Q2), `[~]`-while-advancing, unchecked-beat,
and large-read. "Is this edit off-protocol?" and "is this bare message really
work?" are explicitly delegated to `intake` (tactical judgment) and never
shell-guessed. Reversal: **low**.

### Recommendation — **Option C.**

Rationale: it matches the locked "hooks are the deterministic backbone; agents
are the judgment" decision and boring-first — hooks assert only what is a *fact*
(a file byte, a tool name), and everything requiring "was this legitimate?"
routes to `intake`. **Strongest case against:** the "edits source with no recent
Task" drift is a real observed failure and Option C leaves it uncaught by
reflexes — it relies on `intake`/`compass` and the thread-keeper's standing
context, not a hard signal. Accept that: a fragile transcript-scan (B) that cries
wolf would get muted, which is worse than not firing.

**What would change the answer:** if the felt test (P2) shows "silent off-protocol
edits" are the dominant drift and the thread-keeper doesn't curb them, revisit B
with a *narrow, logged, advisory-only* transcript scan.

**Reversal cost: low.**

---

## Q2 — Router: work-request-vs-conversation detection

**Constrains:** the router hook command; the false-positive rate that decides
whether the whole reflex premise survives the kill criterion
("command-ifies plain chat").

**Option A — Keyword/imperative heuristic in-hook.** Grep the prompt for
leading imperatives / work verbs (`add|build|implement|create|ship|fix|refactor
|feature`) AND no `/` prefix → inject "route this via the protocol / hand to
`intake`". Tradeoffs: fully deterministic, ~free; but a blunt keyword list both
misses ("could we get X?") and false-fires ("what does `add()` do?"). Reversal:
**low**.

**Option B — Always inject a soft standing directive, let the orchestrator
judge.** Every turn (or every non-slash turn), inject a one-line directive: "if
the user's message is a *work request* and unprefixed, route it through `intake`
rather than answering ad-hoc." The hook makes no work/chat call; the orchestrator
does. Tradeoffs: never command-ifies chat (the judge is the model, which *can*
tell chat from work); the cost is it leans on the orchestrator heeding — the very
thing P2 is testing. Reversal: **low**.

**Option C — A cheap classifier (LLM call in the hook).** Rejected: adds latency
+ token cost to *every* prompt, is not "hooks-free", and puts a fallible model in
the always-on backbone that "must not itself drift". Reversal: medium. **inference**
— violates two locked constraints; out.

### Recommendation — **Hybrid A-gates-B.**

A cheap keyword/no-slash prefilter decides *whether to inject the soft directive
at all* (so a plain "what does this do?" turn injects nothing), and the injected
text is B's soft "if this is work, route it via `intake`" — the orchestrator
makes the final work/chat call. This honors "no new ceremony" (no gate, just a
conditional reminder) and keeps false-positives cheap: the worst case is an extra
advisory line, never a command forced onto chat. **Strongest case against:** two
layers of soft-ness means a genuine work request can still slip if the keyword
prefilter misses it AND the orchestrator ignores the directive — but that exact
failure is what the P2 felt test surfaces cheaply, and hardening (a broader
prefilter, or `exit 2`… no — `exit 2` erases the prompt, never for the router) is
a follow-up, not a P2 blocker.

**What would change the answer:** if P2 shows the soft directive is tuned out,
the fix is *placement/strength* (put it last in context, or make it terser), not
a classifier.

**Reversal cost: low.**

---

## Q3 — Thread-keeper: active-ledger selection + next-step/beat derivation

**Constrains:** the thread-keeper hook; correctness of the every-turn injected
"where you are" line.

### Active-ledger selection

**Option A — newest-mtime `.plans/*.state.md`** (`ls -t` / `git`), skipping any
whose content marks it complete (e.g. contains `ALL … COMPLETE` or has no
unchecked rows). Deterministic, no config. **Option B — branch-name match:**
current git branch `mission/<name>-pN` → `.plans/<name>.state.md`. Precise when
on a mission branch, silent off it. **Option C — an explicit `Active: yes`
marker** in the ledger. Extra ceremony to maintain (drift risk).

**Recommendation — A, tie-broken by B.** Pick the newest-modified non-complete
ledger; if the current branch encodes a mission name, prefer that ledger. Both
signals are facts (mtime, branch), no new field to keep current. If none
qualifies (no ledger, or all complete) → **silent** (the acceptance criterion).
Reversal: **low**.

### Next-step + required-beat derivation (**fact**: schema is fixed)

- **Next expected step** = the trailing `Next up:` line (grep last occurrence) —
  the human/chronicler-declared intent.
- **Required-but-unchecked beat** = the *first* `[ ]` or `[~]` row under
  `## Checklist` in file order — deterministic "next overdue beat". `[~]` =
  in-progress/checkpoint-pending (still counts as unchecked).

**Option — trust `Next up:` alone** (simple, but goes stale if not updated) vs.
**derive from the first unchecked row alone** (always fresh, but loses the
human's phrasing) vs. **both**. **Recommendation — both:** inject `Next up:`
verbatim for intent AND the first `[ ]`/`[~]` row as the concrete beat; if they
disagree, that disagreement is itself signal the operator should see. Reversal:
**low**.

**Strongest case against the whole approach:** newest-mtime can select the wrong
ledger if an old mission's file is touched incidentally — mitigated by the
complete-marker skip and branch tie-break, and the failure is a wrong advisory
line, not a block.

**Reversal cost: low.**

---

## Q4 — Beat-enforcer placement (`Stop` vs `PreToolUse` vs both)

**Constrains:** which hook events S3 adds; whether the enforcer nudges softly
(locked "steer/correct") or hard-blocks.

**Key facts (docs):** on `PreToolUse` the repo idiom is an `echo` advisory on
`exit 0` at the closing *action* (commit/phase-advance). On `Stop`, a *soft*
non-blocking note is `exit 0` + JSON `additionalContext` — but the turn is
already ending, so a non-blocking Stop note is only read on the *next* turn;
the only way `Stop` forces action now is `exit 2` (blocks the stop, stderr to
Claude) — which is a **hard** intervention, not a soft nudge, and risks a
nag-loop if the beat stays unchecked.

**Option A — `Stop` only.** Catches the pure omission (turn ends, no closing
action taken). But effective enforcement needs `exit 2` (blocking) → heavier than
the locked "soft nudge", new event surface, loop risk. Reversal: **medium**.

**Option B — `PreToolUse` on commit/phase-advance only.** Catches the
*downstream finalizing action* — the operator tries to commit/close while a
required beat is `[ ]`/`[~]` → soft `echo` advisory, exactly the existing idiom
and the locked "steer/correct". Misses the case where the operator just stops
without committing. Reversal: **low**.

**Option C — Both, soft-first.** `PreToolUse`/`Bash` on commit + phase-advance
as the primary soft nudge (repo idiom, `exit 0` echo), PLUS a `Stop` hook using
**non-blocking `additionalContext`** (`exit 0`) as a backstop for the
no-closing-action omission — explicitly NOT `exit 2` blocking. Reversal:
**low–medium** (`Stop` is new but additive; removing = delete the block).

### Recommendation — **Option C, soft-first.**

`PreToolUse`-on-commit is the workhorse (matches idiom + the locked soft-nudge
decision); the non-blocking `Stop` backstop covers the omission `PreToolUse`
can't see, without introducing a hard block. **Strongest case against:** a
non-blocking `Stop` note lands only on the *next* turn, so a truly forgotten
chronicler at a genuine session end may still be missed until the operator next
speaks — if the P2 felt test proves that gap real, *then* promote the `Stop`
hook to `exit 2` blocking (a deliberate, later escalation past "no new
ceremony", not the default).

**What would change the answer:** P2 felt evidence that soft nudges are ignored
at close → escalate `Stop` to blocking; evidence that `PreToolUse` alone catches
everything → drop the `Stop` backstop.

**Reversal cost: low–medium.**

---

## Q5 — North-star / charter artifact

**Constrains:** the `templates/north-star.md` S5 creates; what `compass` reads
and keeps current; duplication against `idea.md`/PRD.

**Option A — a per-project doc `docs/product/north-star.md`, seeded from a new
`templates/north-star.md`.** How it works here: matches the plugin's every
durable doc = template + instance pattern (S5 already plans the template); lint's
`checkTemplateRefs` resolves the `templates/north-star.md` reference. Tradeoffs:
one more standing doc to keep fresh, but a *thin* one. Reversal: **low** (a doc).

**Option B — fold into `idea.md`/PRD** as a new section. Tradeoffs: no new file;
but `idea.md` is a *point-in-time validation* doc (problem, riskiest assumption,
kill criteria) and the PRD is the *definition* — neither is the live
purpose-vs-progress surface, and overloading them re-narrates and rots (§8
polices exactly this). Reversal: **low** but the coupling is the cost.

**Option C — no artifact; `compass` re-derives purpose from `idea.md` each run.**
Rejected: makes "worthy progress" un-anchored and un-auditable; `compass` can't
show done-vs-roadmap drift without a durable baseline.

### Recommendation — **Option A**, schema:

- **Purpose** — 1–2 sentences, **human-owned**, stable; the end-goal work must
  serve.
- **Definition of worthy progress** — what *counts* as advancing (the criteria
  `compass` judges trajectory against).
- **Done vs roadmap** — a live rollup: shipped / in-flight / not-yet /
  **explicitly out-of-scope** (anti-goals).
- Points at `idea.md`/PRD for the "what" and the ledger for tactical state — it
  holds only purpose + worthy-progress criteria + the done-vs-roadmap rollup, so
  it does not duplicate them.

**Ownership:** the **human owns Purpose**; **`compass` maintains the
done-vs-roadmap rollup** (its output each strategic beat). **Strongest case
against:** any standing doc rots — mitigated by keeping it thin and making its
upkeep `compass`'s explicit job (the rollup is a `compass` output, not manual
bookkeeping).

**Reversal cost: low.**

---

## Q6 — `intake`: new agent vs extend `/next` | `/welcome`

**Constrains:** S4's deliverable; the lint cross-ref surface (a new agent must be
named in both READMEs + WORKFLOW §6).

**fact** — `/next` and `/welcome` are **orchestrator-run commands** that already
route (both carry `SlashCommand` + `Task`); a **subagent cannot run slash
commands or spawn agents**. `intake`'s trigger is a *bare request arriving in
normal chat* where no command was invoked.

**Option A — new `agents/intake.md`** (mirrors `advisor`/`brainstormer`:
`tools: Read, Grep, Glob`, third-person description, hard NEVER = routes+shapes,
never runs/merges/builds). It classifies altitude and *returns the route*; the
orchestrator drives. Tradeoffs: right shape for the mid-chat trigger; costs +1
agent surface (cross-refs). Reversal: **medium** (wired into two READMEs +
WORKFLOW §6; removing means unwiring).

**Option B — extend `/next`/`/welcome`.** Tradeoffs: reuses the existing routing
decision tree; but a command is invoked *deliberately* by the operator, whereas
the drift is precisely that the operator DIDN'T invoke anything — a bare message
just got an ad-hoc answer. Extending a command doesn't cover the un-invoked path
the router hook feeds. Reversal: **low**.

**Option C — new thin agent that reuses `/next`'s decision tree as its logic.**
Best of both: `intake` is a distinct role (invoked by the orchestrator when the
router fires) but its classification logic mirrors `/next`'s tree
(idea→`/brainstorm`; feature→`/plan`→`/mission`; small→`/fix`) rather than
reinventing it.

### Recommendation — **Option C (a new agent, logic borrowed from `/next`).**

The trigger (un-invoked bare request → router → orchestrator spawns `intake`)
demands a subagent, not a command; but `intake` should not re-decide the routing
taxonomy `/next` already owns — it mirrors it. This is also already the locked
build order (S4 authors the agent). **Strongest case against:** +1 agent is real
surface and another thing to keep cross-ref-green mid-mission — mitigated by S4
adding only the *minimal* mentions (full role paragraph is S6).

**Reversal cost: medium.**

---

## Q7 — `compass`: standalone agent vs extend `/operate`; notification gating

**Constrains:** S5's deliverable; the §12 notify wiring; the shadow-mode path.

**fact** — `/operate` is **V6-gated** (requires a launched product) and runs
weekly. But `compass`'s strategic beats — a new `intake` request, phase-ends, a
periodic sweep — occur **pre-launch too**. Folding `compass` into `/operate`
would blind it before V5.

**Option A — standalone `agents/compass.md`** (`tools: Read, Grep, Glob` in
shadow mode — no send yet), invokable at any strategic beat; `/operate` may also
call it in its cycle. Tradeoffs: works at every stage; +1 agent surface.
Reversal: **medium**.

**Option B — fold strategic-alignment into `/operate`.** Tradeoffs: no new
agent, but misses all pre-launch drift and conflates strategic judgment with the
V6 metrics loop (`operate` already owns errors/costs/funnel). Reversal: **low**.

**Option C — new agent that `/operate` also invokes** (= A with an explicit
`/operate` call site). Effectively the recommendation.

### Recommendation — **Option A/C: standalone agent, `/operate` also calls it.**

A standalone `compass` runs at intake-request / phase-end / periodic / on-demand
beats and is *additionally* invoked inside `/operate` at V6 — one role, many call
sites. It stays **distinct from `advisor`** (argues one pending decision on
demand) and **`analyst`** (measures numbers). **Strongest case against:** another
strategic agent risks overlap with `advisor`/`analyst`/`operate` — mitigated by
the hard boundary (holds direction + flags; never decides/kills/builds/measures).

**Notification gating (so it doesn't cry wolf):**

- Map to §12 tiers: strategic drift is **Alert** at most, **never Digest-routine**
  (routine goes to the status page).
- **Severity gate:** notify only on "trajectory diverges from Purpose", never on
  a minor detour or a normal phase transition.
- **Frequency gate:** dedupe — one alert per *distinct* drift per phase; don't
  re-alert a standing, already-flagged drift.
- **Shadow-mode-first (locked):** `compass` **FLAGS drift in its return and does
  NOT fire §12** this mission. Promotion to live §12 send is a **separate human
  go** (out of scope). Promotion criterion (**recommendation** to record): N
  strategic beats where the human agreed with the flag. The documented live path
  reuses `/connect`'s §12 send, `[project]` prefix, no secrets.

**Reversal cost: medium** for the agent; **low** for shadow→live (flip a flag,
but gated on a human go).

---

## Q8 — `intake` ↔ `compass` coupling

**Constrains:** whether `compass` sits in the critical path of every routed
request.

**fact (sequencing)** — `intake` ships in **P3 (S4)**; `compass` in **P4 (S5)**.
`intake` therefore *cannot* depend on `compass` at build time — a hard coupling
is impossible this mission.

**Option A — `compass` gates `intake`** (purpose-fit check before the
orchestrator drives any request). Tradeoffs: catches "we're about to build
something off-purpose" early; but it (1) adds a strategic gate to *every* request
= new ceremony, (2) puts the riskiest, least-trusted, shadow-mode agent in the
critical path before it has earned trust — violating build order and
shadow-mode-first, and (3) is impossible given P3-before-P4 sequencing. Reversal:
**medium**.

**Option B — fully independent.** `intake` routes on altitude; `compass` runs on
its own beats (and a new `intake` request is *itself* one of those beats, reacted
to in parallel, non-blocking). Tradeoffs: simplest, honors sequencing + shadow
mode; a genuinely off-purpose request still gets routed and only *flagged*
afterward. Reversal: **low**.

**Option C — `intake` optionally surfaces a `compass` purpose-fit flag**
(advisory, non-gating) — a later evolution once `compass` is trusted.

### Recommendation — **Option B now, evolving to C later; never A.**

They run **independently** this mission (forced by sequencing and required by
shadow-mode-first). A new `intake` request is a `compass` beat, so `compass`
reacts to it in parallel and flags — it does not block the route. Once `compass`
has earned its interrupt-privilege (Q7 promotion), `intake` may *surface* a
non-gating purpose-fit flag (C). A hard gate (A) is never adopted — it makes the
least-trusted agent a chokepoint and adds per-request ceremony. **Strongest case
against B:** an off-purpose request gets built-then-flagged instead of
stopped-first — accepted, because stopping-first requires trusting `compass` to
interrupt, which it hasn't earned; the human still owns the kill call.

**Reversal cost: low** (coupling is additive later).

---

## Summary — the eight recommendations

| # | Question | Recommendation | Reversal |
|---|---|---|---|
| 1 | Drift-signatures | Hooks catch the crisp signatures (no-slash, `[~]`-while-advancing, unchecked-beat, large-read); history/semantic drift → `intake` judgment, not shell | low |
| 2 | Router work-vs-chat | Hybrid: cheap keyword/no-slash prefilter gates a *soft* "route via `intake` if this is work" directive; orchestrator judges (never `exit 2`) | low |
| 3 | Thread-keeper derivation | Active = newest-mtime non-complete ledger, branch tie-break; inject `Next up:` + first `[ ]`/`[~]` row; silent if none | low |
| 4 | Beat-enforcer placement | Both, soft-first: `PreToolUse`-on-commit echo (primary) + non-blocking `Stop` `additionalContext` backstop; blocking only if the felt test demands | low–med |
| 5 | North-star artifact | `docs/product/north-star.md` from a new `templates/north-star.md`; schema = Purpose (human-owned) + worthy-progress + done-vs-roadmap; `compass` keeps the rollup | low |
| 6 | `intake` shape | New `agents/intake.md`, logic mirrored from `/next`'s decision tree (the trigger is un-invoked chat → needs a subagent, not a command) | med |
| 7 | `compass` shape + gating | Standalone agent `/operate` also calls; Alert-tier only, severity+frequency gated; shadow-mode-first (flags, no §12) until a human promotion go | med (low for shadow→live) |
| 8 | `intake`↔`compass` coupling | Independent now (sequencing + shadow mode force it), evolving to an advisory non-gating flag later; never a hard gate | low |

---
_The architect consults; the **human decides**. These land as dated **Locked
decisions** in `.plans/orchestrator-governance.md` before P2 starts. The
`advisor` may argue against any of them at its gate — this memo is that input,
not its rival._
