# Continuous operation — journeys J1–J5 (UX brief for the brief)

_Drafted 2026-10-27 by the designer. Source: `2026-10-27-continuous-operation-brief.md`
(owner picks locked). Evidence is the brief's owner interview, `hooks/lib/*.sh`
voice (handoff-gate, handoff-budget, mission-budget, pre-compact) and
`skills/plain-report`. Every persona line is the owner's own words; nothing here
is invented research. All command, unit and file names marked (proposed) are
design choices the architect may rename; the TEXT shapes are the contract._

## Who touches this

| Person | What they do | Where they see it |
|---|---|---|
| Owner (Baker) | picks approvals, reads summaries, kills runaways | owner Slack DM, `journalctl`, terminal |
| Client approver (optional per project) | answers merge/deploy/spend/publish gates for their own project | client channel |
| Relay session (optional) | a Remote Control Claude session that forwards gates to the owner and the owner's answers back | one Claude session the owner already has open |
| The agent | runs the rounds; never approves its own gate | ledger, handoff, log |

## Voice rules for every line below

- Hook voice: one emoji marker at the start (🛑 stop, 🚨 urgent, 📝 note, 🧵 status,
  ⚠️ warning, ✅ done) then ` — ` and a plain sentence. Matches `handoff-gate.sh`,
  `mission-budget.sh`. The marker is the existing hook convention, not decoration.
- Action first. The first sentence says what happened or what to do; the why follows.
- Define an id once: "the checkpoint for phase 2 (CP-2)", then `CP-2`.
- No secrets, ever. Messages name the env var (`SLACK_BOT_TOKEN`), never its value,
  never a token prefix, never a credential URL. Remote URLs print with the userinfo
  stripped.
- Each round ends with ONE summary line in the log (the `round:` line, shape below).
  Same shape for every outcome so `grep '^round:'` is the whole timeline.

### The round summary line (log, one per round, written on exit)

```
round: <project> #<n> <UTC start> <outcome> unit=<what> tokens=<n>/<tick budget> next="<exact next step>" ledger=<path>
```

Outcomes (closed set): `done`, `budget-stop`, `overrun-stop`, `gate-pending`,
`handoff-failed`, `auth-expired`, `repo-conflict`, `channel-down`, `crashed`,
`killed`, `idle`.

## J1 — Unattended round

**Trigger.** systemd starts the runner; the runner starts a fresh `claude -p`
process per round; sleeps the configured gap; repeats. First round on a new
install, or the next timer tick.

**Aha moment.** The owner opens Slack in the morning and finds "Round 14 finished
phase 2 build; next is its checkpoint" with the PR link — without having touched
anything. Friction budget before it: zero steps after install (J5).

**Round contract (what the user can verify).** Reads ledger + handoff, does ONE
unit (brief, checkpoint or corrective), writes ledger + handoff, exits.

| State | Terminal / journal line (exact) | Round summary (log) | Notifies |
|---|---|---|---|
| First run (no ledger, no handoff) | `🧵 Round 1 — no ledger and no handoff for <project>; starting from docs/product/idea.md and the brief. Running /agentic-workflow:plan unit.` | `round: acme #1 2026-10-27T09:00Z done unit=plan tokens=41k/120k next="phase 1 brief: auth skeleton" ledger=.plans/acme.state.md` | no (first-round start posted once: "🧵 acme runner is live — round 1 started.") |
| Normal | `🧵 Round 14 — acme, brief 3 of 5 (est.), picking up from handoff written 09:41Z.` | `round: acme #14 2026-10-27T09:45Z done unit=brief-3 tokens=88k/120k next="checkpoint CP-1" ledger=...` | no (digest only, see J4) |
| Budget stop (tick budget hit) | `🛑 TICK BUDGET — 121k of 120k tick tokens spent. Not starting another brief: ledger and handoff written, round ending.` | `... budget-stop unit=brief-3 tokens=121k/120k next="brief 4" ...` | yes, approver: "🛑 acme stopped: this round used its 120k-token budget. Nothing is lost; the next round starts brief 4 on schedule. Reply `raise` to allow 180k next round, or ignore." |
| Overrun (≥1.5× estimate) | `🛑 OVERRUN — session 8 of 5 estimated (≥1.5×). Runner paused; no further round starts until the owner decides.` | `... overrun-stop ... next="WAITING: scope decision" ...` | yes, owner always: "🛑 acme is at 8 of 5 estimated sessions. Pick one: `ship-subset` (finish what exists), `continue 8` (new estimate), `abort`. The runner stays paused until you answer." |
| Gate pending | see J4 | `... gate-pending ... next="WAITING: merge PR #12 (asked 10:02Z)"` | yes (J4) |
| Gate answered | `🧵 Round 15 — gate answered: merge PR #12 approved by owner at 10:20Z. Acting on it first.` | `... done unit=merge-pr-12 ...` | no |
| Crash + restart | systemd: `⚠️ Round 15 died (exit 137, killed) after 00:22. Restarting in 30s (restart 2 of 5 this hour). Uncommitted work from that round is gone; the ledger and handoff are intact.` | next round writes `round: acme #15 ... crashed unit=brief-4 tokens=? next="redo brief 4 from last commit" ...` (the runner writes the crashed line itself, from the wrapper, since the dead process cannot) | after 3 crashes in an hour: "🛑 acme crashed 3 times in an hour (exit 137). Runner is backing off 30 min. Last log line: <redacted tail, 5 lines>." |
| Auth expired | `🛑 Round 16 not started — Claude login rejected (401). Re-run \`claude /login\` on this container, or set ANTHROPIC_API_KEY in /etc/agentic-workflow/acme.env. Runner is waiting; it will retry in 15 min.` | `... auth-expired ... tokens=0/120k next="unchanged"` | yes: "🛑 acme cannot run: its Claude login expired. On the container run `claude /login` (or fix ANTHROPIC_API_KEY in the env file). No work is lost. Runner retries every 15 min and starts by itself once it works." |
| Repo dirty / conflict | `🛑 Round 17 not started — the working tree has uncommitted changes from outside a round (3 files: src/a.ts, src/b.ts, package.json). Not touching them.` or `🛑 ... git pull hit a merge conflict in docs/x.md; rebase aborted, tree restored.` | `... repo-conflict ... next="WAITING: human resolves tree"` | yes: "🛑 acme is stuck: its checkout has changes I did not make (3 files). Nothing was overwritten. Reply `stash` to save them aside and continue, or fix it on the container. Runner waits." |
| Channel unreachable | `⚠️ Slack post failed (HTTP 503), 3 tries. Message saved to <state-dir>/outbox/0007.txt and will be sent when the channel is back. Round continues.` For a gate: `🛑 Gate asked but no approver is reachable — round ends; runner will not act on the gate.` | `... channel-down ...` only when a gate is waiting; otherwise the normal outcome | outbox flushes in order on recovery, prefixed "(delayed 2h10m)". |
| Kill switch | `🛑 Kill switch present (<state-dir>/STOP). Runner idle; no new round will start. Remove the file or run \`systemctl start ...\` to resume.` | `round: acme #18 ... killed unit=none tokens=0/120k next="unchanged"` | yes, once: "🛑 acme is stopped by the kill switch. Nothing runs until you remove it." |

**Decisions to justify.** Default gap between rounds: 5 min after `done`, 30 min
after any stop (a default decided for the user; setting is `ROUND_GAP_SECONDS`).
Default tick budget comes from the existing unattended preset, not a new number.
Kill switch (a file named `STOP`) works even when Slack and systemd tooling are
unreachable, and the in-flight round finishes its current tool call, writes the
handoff, and exits.

## J2 — Managed session crosses auto-compaction

**Trigger.** The owner is working in one live session; context climbs past the
advisory band.

**Aha.** The owner never notices the compaction. After it, the agent says the
same next step it said before. Friction: zero owner steps.

| State | Exact text |
|---|---|
| Advisory band (existing, unchanged) | `📝 Handoff budget — context at 612000 tokens, past 60% of the 1000000-token auto-compact point.` + `Run /agentic-workflow:handoff soon, while the window still holds the intent.` In managed mode the agent now acts on this itself instead of waiting: it replies in one line, `📝 Writing my handoff now (context at 612k); keep going, I'll pick the work back up.` and runs the handoff skill. |
| Urgent band | `🚨 Handoff budget URGENT — ...` (existing). Managed mode: agent writes the handoff before its next work call. The gate (J3) is the backstop. |
| Handoff written | `✅ Handoff written (docs/... local path), covers: 2 locked decisions, 1 open question, next step "write the fidelity test fixtures".` |
| Compaction fires | no owner message from the system. Compact-resume (existing) injects the re-read directive; the agent's first reply after it: `🧵 Context was compacted. I re-read my handoff (written 14:02Z, current) and the ledger. Continuing: write the fidelity test fixtures.` |
| Handoff stale or missing at compaction | existing `pre-compact.sh` text: `🛑 /compact refused — this session has not written its agent handoff recently...` Managed addition: agent self-runs the handoff then retries; owner is told only if it fails twice: `⚠️ I could not write my handoff (disk full). Compaction would lose state. Free space or tell me to proceed anyway.` |
| Resume finds stale handoff | existing SUSPECT directive; agent says: `⚠️ My handoff is older than this session's last activity, so I checked git log and git status first. I believe the next step is X; confirm or correct.` |
| Dispatch auth / channel / kill switch | not applicable in a live session; the owner is present. A kill switch file, if present, is ignored by a live session (the owner is the kill switch). |

Ledger summary line in managed mode (one per compaction, ledger-adjacent log):
`round: acme #m1 2026-10-27T14:02Z compacted unit=session tokens=612k/1000k next="write the fidelity test fixtures" ledger=...` (outcome `compacted` is added to the closed set for managed sessions).

## J3 — Handoff gate, unattended

**Trigger.** An unattended round reaches the urgent band with no fresh handoff.
Today the gate blocks and then fails open after 5 blocks; the humane text
"run /agentic-workflow:handoff" assumes someone reads it.

**Aha.** None visible to the owner; success is a round that never stalls. The
only owner-visible output is the summary line.

| State | Exact text |
|---|---|
| Gate blocks (agent-addressed, existing voice, one change: says what to do, not what to ask) | `🛑 Handoff gate — context at 850000 tokens, ≥85% of the 1000000-token auto-compact point, and this session has not written its handoff. Write it NOW: only Read/Grep/Glob and the handoff write run until you do (block 1 of 5).` then existing `handoff=`, `branch=`, `now=`, `snapshot=` lines, then new last line: `unattended=1 — no human will do this for you; run /agentic-workflow:handoff, then continue your unit or end the round.` |
| Agent writes it | gate clears silently; agent continues. Log: `🧵 Handoff written at 850k tokens (block 1). Gate cleared.` |
| Agent fails (5 blocks) | UNATTENDED CHANGE: no fail-open. `🛑 Handoff gate — 5 blocks, no handoff written. Ending this round cleanly: the mechanical snapshot is saved at <snapshot>.` Runner then writes the ledger row itself from the snapshot: `handoff-failed: agent did not write handoff at 850k tokens; snapshot <path>`. |
| Round summary | `round: acme #19 ... handoff-failed unit=brief-4 tokens=850k/1000k next="from snapshot <path>: redo brief 4" ledger=...` |
| Notifies | After 1: nothing. After 2 in a row: "⚠️ acme's agent failed twice to write its handoff, so rounds end early. Work resumes from a mechanical snapshot. Likely a prompt or tool problem; look at round #19 and #20 in the log." After 3: runner pauses (treated like an overrun). |
| Mid-round crash during the write | handoff is written temp-then-rename (existing `hl_mput`), so a half-written handoff never exists; next round sees the old handoff plus the snapshot and says so: `⚠️ Round 21 — handoff is older than the snapshot; resuming from the snapshot (mechanical), unit may repeat.` |
| Other states (auth, channel, kill switch, dirty repo) | as J1; the gate only governs context size. |

## J4 — Gate decision away from the keyboard

**Trigger.** A round reaches a merge, deploy, spend or publish gate. The round
ends; nothing proceeds until a human answers. No gate is self-approved, ever.

**Aha.** The approver answers in under 10 seconds from a phone with one word,
and the next round acts on it.

**Approver message (what they see).** Identical structure on every route.

```
🛑 acme needs your OK: merge PR #12 into main.
What it does: adds password reset; 6 files, 214 lines, tests green, reviewer approved.
If you say yes: I merge it and start brief 4 (rate limits).
If you say no: I leave it open and ask you what to change.
Reply:  yes   |   no <reason>   |   hold
Gate ID 7f3a (expires in 24h, then I ask again; I never merge on silence).
```

Gate kinds change line 1 and "What it does": `deploy acme to production`,
`spend up to $40 on <service>`, `publish the launch post to <channel>`.
The reply grammar is fixed: `yes`, `no <reason>`, `hold`. Anything else gets:
`I did not understand "ok sure thing". Reply exactly: yes, no <reason>, or hold. (Gate 7f3a is still open.)`
A reply counts only from an allow-listed approver id configured at install (J5);
a reply from anyone else gets nothing back and is logged `ignored reply from unlisted user`.

| Route | How the approver sees it | How they answer |
|---|---|---|
| Owner channel | Slack DM from the project's bot, as above | reply in the thread |
| Client channel | same message in the client's channel; wording drops internal ids and says "your project" | client replies in thread; owner gets a one-line copy: `🧵 acme: client answered yes to merge PR #12 (7f3a).` Spend and deploy gates may be configured owner-only even on a client route (default: spend is owner-only; a default decided on the client's behalf, stated at install) |
| Relay session | The relay Claude session shows: `🛑 [acme] merge PR #12 into main? (gate 7f3a) — forwarding to Baker.` and posts the full message to the owner | the owner answers inside the relay session or Slack; the relay writes the answer to the gate file for the project, and replies `✅ Sent "yes" for gate 7f3a to acme.` The relay never answers for the owner; with no owner reply the gate stays open. |

| State | Exact text |
|---|---|
| Gate pending | log: `🛑 Gate 7f3a asked to owner (Slack DM) at 10:02Z: merge PR #12. Round ending; waiting.` Summary: `round: acme #15 ... gate-pending unit=brief-3 tokens=77k/120k next="WAITING: merge PR #12 (gate 7f3a, asked 10:02Z)"` |
| Waiting rounds | runner does NOT start new work rounds while a blocking gate is open; it runs a cheap check round (no model call) every 5 min: `🧵 Gate 7f3a still open (18 min). Not starting work.` Independent work that does not depend on the gate is not attempted in v1 (see missed states). |
| Reminder | at 4h and 20h: `⏰ acme is still waiting on you: merge PR #12 (gate 7f3a). Reply yes, no <reason>, or hold.` (no marker emoji precedent exists; ⏰ is new, used only here) |
| Gate answered yes | `🧵 Gate 7f3a answered: yes by baker at 10:20Z (Slack). Recorded in the ledger.` Next round's first line acts on it (J1). |
| Answered no | agent reads the reason, replies in channel: `Understood: not merging PR #12. I will <change from your reason> and ask again.` |
| Answered hold | `🧵 Gate 7f3a on hold by baker. Runner stays paused for this project until you reply \`resume 7f3a\` or \`no\`.` |
| Expired | `🛑 Gate 7f3a expired after 24h with no answer. Nothing happened. Asking again at 10:02Z tomorrow; reply any time.` Never auto-approve, never auto-reject-and-proceed. |
| Channel unreachable | see J1; message queued in outbox; gate stays open; local fallback: `systemctl status` shows `waiting on gate 7f3a`, and `agentic-workflow-runner gate answer 7f3a yes` (proposed) works on the container with a logged "answered locally by <os user>". |
| Reply recorded wrong / double reply | first valid reply wins; later ones: `Gate 7f3a is already answered (yes at 10:20Z). Nothing to do.` |
| Auth expired, dirty repo, crash, kill switch | the gate stays open and recorded; ledger is the source of truth; after recovery, the next round reads the answer. A kill switch pauses actions but still accepts and records answers. |

## J5 — Runner install on a client container

**Trigger.** The owner has an existing LXC container and one project to run in it.

**Aha.** `systemctl status` shows `active (running)` and the first Slack message
arrives: "acme runner is live". Friction budget: one script, one prompt per
setting, no hand-editing unit files.

```
$ sudo ./install-runner.sh
agentic-workflow runner install (one project per container)
Project repo URL: git@github.com:client/acme.git
Branch to work on [main]: staging
Approver route (owner / client / relay) [owner]: owner
Owner Slack user id: U0XXXXXXX
Round budget in tokens [120000]:
Gap between rounds in minutes [5]:
Secrets are read from /etc/agentic-workflow/acme.env (mode 0600, owner root).
Missing there: ANTHROPIC_API_KEY, SLACK_BOT_TOKEN, GIT_DEPLOY_KEY_PATH
```

| State | Exact text |
|---|---|
| Success | `✅ Installed. Unit: agentic-workflow-runner@acme.service (enabled, started). Check: systemctl status agentic-workflow-runner@acme. Logs: journalctl -u agentic-workflow-runner@acme -f. Stop: touch /var/lib/agentic-workflow/acme/STOP.` Then `systemctl status` shows `Active: active (running)`; the `Description=` line reads `agentic-workflow runner for acme (round 1)`. |
| Secrets missing | `🛑 Not started — /etc/agentic-workflow/acme.env is missing: ANTHROPIC_API_KEY, SLACK_BOT_TOKEN. Put them there (mode 0600), then run: sudo ./install-runner.sh --resume acme. Nothing else was changed.` The script never accepts a secret as a command-line argument (it would land in shell history and \`ps\`). |
| Re-run (idempotent) | `📝 acme is already installed; updated the unit and settings, kept your env file and state. No restart needed.` |
| Repo unreachable / bad key | `🛑 Could not clone git@github.com:client/acme.git (permission denied). Check the deploy key at the path in GIT_DEPLOY_KEY_PATH, then re-run with --resume acme.` URLs with credentials are printed with the userinfo removed. |
| Auth check | installer runs one zero-cost auth probe: `✅ Claude login works.` or the J1 auth-expired line. |
| Channel check | posts "🧵 acme runner is live (installed, not yet working)" to the approver; failure: `🛑 Slack rejected the token (invalid_auth). Fix SLACK_BOT_TOKEN and re-run.` |
| Reboot | systemd `WantedBy=multi-user.target`, `Restart=on-failure`. After reboot the first round line: `🧵 Round 23 — runner restarted after container reboot (down 3 min). Resuming from handoff.` and Slack: "🧵 acme runner back after a reboot." |
| Crash, budget, gate, conflict, kill switch | as J1/J4; install adds nothing. |
| Uninstall | `./install-runner.sh --remove acme` stops and disables the unit and keeps `/var/lib/agentic-workflow/acme` and the env file; prints their paths and says "delete them yourself if you want secrets gone". |

## Daily digest (not a journey, but the J1 summaries need a reader)

Once a day to the owner (not the client): `🧵 acme, last 24h: 41 rounds, 33 done, 3 budget stops, 1 gate (answered in 18 min), 0 crashes. Next: checkpoint CP-2. Tokens: 3.1M.` One line; the per-round `round:` lines stay in the log.

## States the brief missed

1. **Blocked on a gate with independent work available.** Brief: "the round that hit it ends". Needs a rule: v1 pauses all work rounds (simple, safe) or continues non-dependent units (more throughput, harder to reason). I specced pause; the owner should confirm.
2. **Gate expiry and reminders.** The brief has no timeout; "never self-approve" plus silence means a runner idle for days. Specced 24h re-ask, no auto-action.
3. **Unattended fail-open of the handoff gate.** Today it fails open after 5 blocks; unattended that contradicts J3's "stopped cleanly". Needs a behavior change in `handoff-gate.sh` (architect).
4. **Hold / answer grammar and who may answer.** Allow-list of approver ids, double replies, unintelligible replies, client-route gates that should stay owner-only (spend, deploy).
5. **Channel outage queue.** Outbox and local `gate answer` fallback so a Slack outage does not strand the project.
6. **Crash loop and restart storm.** Backoff and a crash cap (restart 5/hour), plus the wrapper writing the `crashed` summary line since a dead process cannot.
7. **Auth expiry on a headless container.** Claude login or API key rotation; no human present to `/login`. Needs the retry-and-notify loop and a documented key path.
8. **Dirty tree not made by a round / manual edits on the container** (a human SSHes in mid-project).
9. **Disk full, clock skew, and the ledger being edited by two writers** (runner plus a human session on the same container): needs one-writer lock; second writer gets `🛑 Another session holds the ledger lock (pid, since 09:40Z).`
10. **Remove / pause / upgrade of the runner and plugin version drift between rounds** (a round started on v1.69 and a plugin update mid-loop).
11. **Secrets leaking through summaries.** Tail excerpts in crash alerts must be redacted; the redaction rule needs a test (the brief's secrets criterion has no negative test).
12. **Relay session offline** (laptop closed): the gate waits; owner should also get the Slack copy, so a relay is a convenience path and never the only path.
13. **Compaction during a round in managed mode while an unattended runner shares the same project** (two modes on one repo): the lock in 9 covers it.
