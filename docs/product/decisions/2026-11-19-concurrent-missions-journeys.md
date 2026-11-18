---
status: draft
owner-agent: designer
feature: concurrent-missions
date: 2026-11-19
reads: 2026-11-19-concurrent-missions-brief.md (J1–J4, AC-1..AC-17)
---

# Concurrent missions — owner journeys and wording

There is no screen. The owner sees three things: what the orchestrator prints,
what the ledger records, and the pull requests (PRs) on GitHub. This file says
what each of those must show so the owner can tell, at a glance, **what is
running, what is waiting its turn, what has landed, and what is waiting on them**.

All wording obeys the plain-report rule (`docs/WORKFLOW.md` §6.0): action
first, every id explained, no internal shorthand.

## 0. Ground rules

### 0.1 One word per state — used everywhere

| State word | Meaning | Waits on the owner? |
|---|---|---|
| **running** | The mission is working in its own folder. | No |
| **not started — no free slot** | Asked to start, but the cap is full. It is not queued. | Yes: wait or stop one |
| **finished** | Its PR is open and checked. It has **not landed**. | **Yes: approve the PR** |
| **approved** | You approved. It waits its turn to land. It has **not landed**. | No |
| **landing** | It is being updated from main and tested on the combined result. | No |
| **landed** | Merged on main, version set. The only state that means "in". | No |
| **sent back** | It could not land. The reason is printed. | Sometimes (said each time) |

Two rules keep these honest:

- **"Queue" means the landing queue only.** A mission blocked by the cap is
  "not started", never "queued". Otherwise "waiting" means two different things.
- **Only observed events are printed** (carried over from the parallel-waves
  truth rule, `2026-11-18-parallel-waves-journeys.md` §0.2). No percentages, no
  "nearly done". "Running" means "started and not yet returned", nothing more.

### 0.2 Proposed here, not settled

| Proposed | Who decides |
|---|---|
| The state words above | planner |
| The view in §4 and a command name for it (`status` is a placeholder) | architect memo 2 |
| **How you approve** so the agent cannot fake it (Risk 1). Wording below says "approve the PR" and stays neutral about the mechanism. | architect memo 2 + owner |
| Which ledger copy is the true one (Risk 4) | architect memo 1 |

### 0.3 Questions for the architect (not resolved here)

1. **Does an approval survive a change?** If an automatic clash fix (AC-11) or
   the update from main changes real code after you approved, does your
   approval still count (AC-10, AC-12)? This file assumes: a reviewer re-check
   is printed, and if the fix changed code the reviewer flags, the PR goes back
   to **finished** and asks you again.
2. **Can you pull an approved PR out of the queue** before it lands? Assumed yes.
3. **What the view reads from**: the ledgers, GitHub, or both. It must not
   guess when they disagree; it prints both and says so.
4. **Does a finished or approved mission still hold a slot** until it lands?
   Assumed yes (its folder still exists); M4 and M16 are worded that way.

## 1. Journeys

Example missions used throughout: **Continuous operation** and **Release notes**.

### J1 — Start a second mission

1. Continuous operation is **running**. You run `/agentic-workflow:mission` for
   Release notes.
2. The orchestrator makes Release notes its own folder (a git worktree) and
   sets it up from the project's setup recipe. You run no git or setup
   command. **See:** M1 "set up". **Verify:** the view lists both. (AC-1)
3. It compares the files Release notes plans to change with the files
   Continuous operation plans to change. (AC-2)
   - **No overlap:** M2 prints; work starts.
   - **Overlap:** M3 names the shared files and gives two choices: wait until
     Continuous operation lands, or run now and fix the clash at landing. You
     pick one. Nothing starts until you do. (AC-2, AC-14)
4. **Cap full** (default 2, set per project): a third mission does not start.
   M4 names the two missions holding the slots and what each is waiting on.
   It is **not started**, not queued. (AC-3)
5. **Setup failed**: M5 says which step broke and the one thing to fix. The
   mission does not start and does not hold a slot.

### J2 — Both run

1. Each mission prints under its own name. Every line starts with the mission
   name, e.g. `[Release notes]`, so two streams never blend.
2. Each mission's budget, reminders and resume-after-compaction follow its own
   ledger, chosen by branch. **Verify:** the view shows each mission's own
   sessions used. (AC-4)
3. Neither mission touches the version number. Changelog and obligations notes
   go into one file per mission. **Verify:** neither PR edits
   `plugin.json` version or the shared `CHANGELOG.md`. (AC-5)
4. Where both add a lint check or a hook, each adds its own file to a folder;
   no shared line is edited. (AC-6)
5. One mission returns. M6 prints: **finished, not landed**, PR link, and
   "waits on you: approve". The other is still listed as **running**.

### J3 — Approve and land through the plugin's queue

1. Both PRs are **finished**. You approve them on GitHub in any order. (AC-7)
2. Each approval prints M7: **approved, not landed**, its place in the queue,
   and what is ahead of it.
3. The agent takes the first in line: updates it from main, runs the tests on
   the combined result (**landing**, M8). (AC-7)
4. Tests pass: the agent merges, sets the version, combines the changelog and
   obligations files. M9 prints **landed** with the new version. (AC-8, AC-16)
5. The next PR is updated from the new main and tested again; then M9 again.
   **Verify:** main has both, two version entries, no hand-edited PR. (AC-13)
6. **Combined tests fail:** M10 — the PR is **sent back** to its mission with the
   failing test named; the next PR in the queue keeps moving. (AC-9)
7. **No approval:** the agent never merges it. If you asked it to land
   something you have not approved, M11 tells you how to approve. (AC-10)

### J4 — A clash is fixed automatically

1. While **landing**, the second PR clashes with what the first just landed.
2. A tiny clash (e.g. two lines added side by side): the orchestrator fixes
   it. M12 prints the file and "fixed, re-testing". (AC-11)
3. Anything bigger: one existing builder is sent once, with both versions,
   both missions' goals and the tests. M13 prints that it started. (AC-11)
4. Tests pass. If the fix changed real code, the reviewer re-checks just that
   part (M14). (AC-12)
5. Then landing continues as J3 step 4. **Verify:** the clash file is in the
   landed result and the tests passed. (AC-15)
6. **Builder could not fix it:** M15 — **sent back**, the two files named, and
   the one decision you must make. The queue keeps moving.

## 2. States

| State | What the owner sees | What they do |
|---|---|---|
| **Empty — one mission only** | Exactly today's output. The view shows one row and "Free slots: 1 of 2". No new messages. | Nothing new |
| **In flight — two running** | Two rows, both **running**; every printed line carries its mission name. | Nothing |
| **Queued — approved, waiting its turn** | Row says **approved, not landed — 2nd in line, behind Continuous operation**. | Nothing; may pull it out |
| **Error: combined tests failed** | Row says **sent back**: test name, which PR it was combined with. | Nothing; its mission fixes it |
| **Error: clash the builder could not fix** | Row says **sent back**: the clashing files and one question. | Answer the question |
| **Error: approval missing** | Row says **finished — waits on you: approve**. The queue skips it. | Approve the PR |
| **Degraded: cap full** | M4; the extra mission is **not started**. Both slot holders named. | Wait, or stop one |
| **Degraded: worktree setup failed** | M5; the mission is **not started**; slot stays free. | Fix the named step |

A row never says "done" without saying "landed" or "not landed".

## 3. Wording

Names below in angle brackets are filled with the mission name or PR title,
never a bare id. Any id printed is explained the first time it appears.

| # | Trigger | Exact sentence | Owner does |
|---|---|---|---|
| M1 | Worktree created and set up | `[<mission>] Set up in its own folder. Started.` | Nothing |
| M2 | Overlap check clear | `[<mission>] Checked against <other mission>: no shared files.` | Nothing |
| M3 | Overlap found | `<mission> and <other mission> both plan to change <file>, <file>. Pick one: wait until <other mission> lands, or run now and fix the clash when they land.` | Choose |
| M4 | Cap full | `<mission> did not start. Both slots are in use: <A> (running) and <B> (finished, waits on your approval). Approve or stop one, then start it again.` | Wait, approve, or stop one |
| M5 | Setup failed | `<mission> did not start. Setup broke at <step>: <plain reason>. Fix: <one action>. No slot is used.` | Fix the named step |
| M6 | Mission returns, PR open | `<mission> is finished. It has not landed. Approve its PR to put it in line: <PR link>.` | Approve |
| M7 | Owner approved | `<PR title> is approved, not landed. It is <n> in line, behind <PR title>.` | Nothing |
| M8 | Landing begins | `Landing <PR title>: updating it from main and testing it with everything already landed.` | Nothing |
| M9 | Merged | `<PR title> has landed on main as version <x.y.z>. Next in line: <PR title or "none">.` | Nothing |
| M10 | Combined tests failed | `<PR title> did not land. <test> fails when combined with <landed PR title>. Sent back to <mission> to fix. The next PR keeps moving.` | Nothing |
| M11 | Land asked, no approval | `<PR title> is not approved, so it will not land. Approve it on GitHub first: <PR link>.` | Approve |
| M12 | Tiny clash fixed | `<PR title> clashed with <landed PR title> in <file>. Fixed it; testing again.` | Nothing |
| M13 | Builder sent for a clash | `<PR title> clashed with <landed PR title> in <file>. One builder is fixing it, once.` | Nothing |
| M14 | Reviewer re-check | `The clash fix changed code in <file>. The reviewer is checking that part before it lands.` | Nothing |
| M14b | Re-check finds a problem | `The clash fix in <PR title> changed what you approved. Please look again and approve: <PR link>.` | Re-approve |
| M15 | Builder could not fix | `<PR title> did not land. Its clash with <landed PR title> in <file> needs your choice: <one question>. The queue keeps moving.` | Answer |
| M16 | Slot freed | `<mission> landed. One slot is free. <not-started mission> can start now.` | Start it, if wanted |

Every "finished" and "approved" message says **not landed**. Only M9 says
**landed**.

## 4. Where the owner looks

One view (placeholder `status`) printed on demand and at the top of every
orchestrator report while two or more missions exist. It answers two
questions and nothing else.

```
Missions — 2 of 2 slots used

Waits on you:
  Release notes — finished, not landed. Approve PR "Release notes in the changelog".

Everything else:
  Continuous operation  running        started 09:40, 3 of 8 sessions used
  Release notes         finished       PR "Release notes in the changelog"
Landing queue: empty
Landed today: none
```

Rules for the view:

- **"Waits on you" comes first** and says "nothing" when empty. It lists only
  things the owner must do: approve, answer a clash question, choose on an
  overlap, fix a setup step.
- **One row per mission**, one state word from §0.1, PR title not number.
- **Landing queue** lists approved PRs in order, each marked "not landed".
- **Landed** lists merges seen on main with their version. A PR is listed here
  only after the merge was observed, never because it was approved or finished.
- On GitHub, each PR carries a label matching its state word, so the PR list
  says the same thing the terminal does.
- With one mission, the view is one row; no queue line until something is approved.

## 5. Biggest misreading risk

**"Approved" read as "landed".** Today the owner's approval and the merge are
the same act (the owner clicks merge). Under "agent merges what I approve" they
split: the owner approves, then walks away believing the work is in. A failed
combined test, a clash or a re-approval can still stop it, and the owner
carries the wrong belief into the next mission's plan.

Defences: every approval message says **not landed** and its place in line
(M7); landing is its own printed event (M9) and its own section in the view;
a sent-back PR moves back to "waits on you" when it needs the owner; the GitHub
label changes from `approved` to `landed` only on the observed merge.
