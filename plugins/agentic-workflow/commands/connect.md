---
description: Interactive owner-channel setup — pick Telegram or Slack, get walked through each step, have IDs discovered automatically, and end with a proven round-trip test. Writes the §10 row only after the test passes.
argument-hint: [telegram | slack]
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion, WebFetch]
---

Set up the owner channel (§12) interactively. **Precondition**: the project is
bootstrapped — no `docs/WORKFLOW.md` means there is no §10 row to record the
channel in and nothing in the machinery would ever find it; say so and point
at `/adopt` (existing project) or `/bootstrap` (fresh) first, then stop.

One step at a time: tell the
human exactly what to do, wait for their "done", VERIFY it worked, then move
on. Never proceed past a failed verification — diagnose and retry (twice,
then stop with the exact manual fix).

**The secret rule (absolute)**: never ask for a token in the conversation and
never echo one. Tokens go into the human's env (shell profile export, or an
uncommitted `.env`); you verify by USING the var in a call, not by printing
it. If the human pastes a token into the chat anyway: tell them it's now in a
transcript — rotate it — and continue with the rotated one.

## 0. Pick the transport (AskUserQuestion, unless `$ARGUMENTS` says)

- **Telegram (recommended)** — tap-to-decide buttons work daemon-free
  (callbacks arrive via `getUpdates` polling).
- **Slack** — full outbound + typed approvals (`approve <id>`); buttons need
  a public interactivity endpoint, which most solo setups don't have. Say
  this tradeoff when asking.

## 0.5 Second project on this machine? Reuse what exists

Before guiding any creation, check for machine-level credentials (the §12 env
names in the environment, or another project's setup):

- **Slack token found** → offer reuse: verify with `auth.test`, then ask —
  shared DM, or a private per-project channel? (The HUMAN creates the channel
  and invites the bot — no create scope needed; private channels require the
  app to have `groups:read` + `groups:history`. That channel id becomes THIS
  project's `SLACK_OWNER_DM`, in the project `.env`.) Then
  skip straight to the round-trip test.
- **Telegram token found** → do NOT silently reuse: a shared bot races on
  `getUpdates` polling across projects (§12 — updates and button taps get
  stolen). Recommend a fresh bot for this project (token under a per-project
  env name in the project `.env`); reuse only if the human accepts the
  single-poller caveat.

Reuse skips setup, never proof — the round-trip test always runs.

## 1. Telegram path

1. **Bot**: "Open Telegram → `@BotFather` → send it /newbot → name it. Put the
   token in your env as `TELEGRAM_BOT_TOKEN` (shell profile or uncommitted
   `.env`) — don't paste it here. Say done."
   → Verify: `getMe` returns the bot's username (call it, show only the
   username).
2. **Chat discovery (no typing IDs)**: "Open a chat with @<botname> and send
   it any message." → Poll `getUpdates`, read `chat.id` + `from.id` from
   their message, confirm back: "Got you — @<username>, chat <id>. You?"
3. **Round-trip test**: send a message with one inline-keyboard button
   ("It works 👍", callback data `CONNECT-TEST`). "Tap it." → Poll
   `getUpdates` for the callback, verify `from.id` matches step 2 →
   **inbound verified**, tell them so.

## 2. Slack path

1. **App**: "api.slack.com/apps → Create New App → From scratch → your
   workspace. OAuth & Permissions → Bot Token Scopes: `chat:write`,
   `im:write` (required by `conversations.open` in step 2), `im:read`,
   `im:history` — add `groups:read` + `groups:history` ONLY if you'll use a
   private per-project channel instead of the DM (§12 multi-project). No
   channel-create scope: you create channels and invite the bot. Install to
   Workspace. Put the Bot User OAuth
   Token (`xoxb-…`) in your env as `SLACK_BOT_TOKEN`. Say done."
   → Verify: `auth.test` succeeds (show only the bot name/workspace).
2. **IDs**: ask for their member ID (profile → ⋯ → Copy member ID — it's
   not a secret) → `conversations.open` with it → derive the DM channel id
   automatically. Export both as `SLACK_OWNER_ID` / `SLACK_OWNER_DM`.
3. **Round-trip test**: `chat.postMessage` a test line, then: "Reply
   `approve CONNECT-TEST` in that DM." → Poll `conversations.history`,
   verify the reply's `user` matches `SLACK_OWNER_ID` → **inbound verified**
   (typed protocol — remind them buttons need an interactivity endpoint).

## 3. Record (only after the round-trip passed)

- Fill the §10 **Owner channel** row in `docs/WORKFLOW.md`: transport, send
  template, env var NAMES, owner id, inbound method (Telegram: polling with
  buttons; Slack: polling, text protocol).
- Add the var NAMES to `.env.example` (values never).
- If a flight plan exists, fill its Owner channel field.
- Leave the edits uncommitted for review; suggest `/doctor` as the ongoing
  health check for the channel.

## Output

What was configured, what the round-trip proved (send ✅ / inbound ✅ with
which identity), the files touched, and — if anything failed — exactly where
in the step-by-step it stopped and the manual fix.
