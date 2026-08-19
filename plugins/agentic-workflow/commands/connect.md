---
description: Interactive setup with a proven round-trip before anything is recorded — the owner channel (telegram | slack), or a remote work server (server <tailscale-host>) so heavy work (Docker, integration suites, builds) runs off the local machine. Writes the §10 rows only after the tests pass.
argument-hint: '[telegram | slack | server <tailscale-hostname>]'
allowed-tools: [Read, Write, Edit, Bash, Grep, Glob, AskUserQuestion, WebFetch]
---

Set up the owner channel (§12) interactively — the private DM the workflow uses
to message YOU. (For **outward publishing** channels — X, LinkedIn, dev.to,
mailing list — use `/agentic-workflow:publish connect` instead; that's the §14 pipeline, a
different boundary.) **Precondition**: the project is
bootstrapped — no `docs/WORKFLOW.md` means there is no §10 row to record the
channel in and nothing in the machinery would ever find it; say so and point
at `/agentic-workflow:adopt` (existing project) or `/agentic-workflow:bootstrap` (fresh) first, then stop.

One step at a time: tell the
human exactly what to do, wait for their "done", VERIFY it worked, then move
on. Never proceed past a failed verification — diagnose and retry (twice,
then stop with the exact manual fix).

**The secret rule (absolute)**: never ask for a token in the conversation and
never echo one. Tokens go into the human's env (shell profile export, or an
uncommitted `.env`); you verify by USING the var in a call, not by printing
it. If the human pastes a token into the chat anyway: tell them it's now in a
transcript — rotate it — and continue with the rotated one.

**`server` mode** — `$ARGUMENTS` starts with `server` → skip the owner-channel
flow entirely and run the **remote work server** setup at the end of this file.

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
   `im:write` (required by `conversations.open` in step 3), `im:read`,
   `im:history`, `reactions:read` (tap-to-decide via emoji reactions) — add
   `groups:read` + `groups:history` ONLY if you'll use a
   private per-project channel instead of the DM (§12 multi-project). No
   channel-create scope: you create channels and invite the bot. Install to
   Workspace. Put the Bot User OAuth
   Token (`xoxb-…`) in your env as `SLACK_BOT_TOKEN`. Say done."
   → Verify: `auth.test` succeeds (show only the bot name/workspace).
2. **Enable the DM composer** — Slack disables it by default; without this
   the human cannot write back at all: "App settings → **App Home → Show
   Tabs** → enable **Messages Tab** AND check **'Allow users to send Slash
   commands and messages from the messages tab'**. Reload your Slack client.
   Say done."
3. **IDs**: ask for their member ID (profile → ⋯ → Copy member ID — it's
   not a secret) → `conversations.open` with it → derive the DM channel id
   automatically. Export both as `SLACK_OWNER_ID` / `SLACK_OWNER_DM`.
4. **Round-trip test**: `chat.postMessage` a test line, then: "React to that
   message with ✅." → Poll the message's reactions (`reactions.get` on its
   `ts`), verify a reaction from `SLACK_OWNER_ID` → **inbound verified**.
   Reactions are Slack's daemon-free tap-to-decide (§12): they sit ON the
   gate message — structurally bound like Telegram's buttons — and carry the
   reactor's id. Typed replies (`approve <id>`) remain the fallback and the
   way to attach a reject reason; true Block Kit buttons still need an
   interactivity endpoint.

## 3. Record (only after the round-trip passed)

- Fill the §10 **Owner channel** row in `docs/WORKFLOW.md`: transport, send
  template, env var NAMES, owner id, inbound method (Telegram: polling with
  buttons; Slack: polling with emoji-reaction decisions + typed fallback).
- Add the var NAMES to `.env.example` (values never).
- If a flight plan exists, fill its Owner channel field.
- Leave the edits uncommitted for review; suggest `/agentic-workflow:doctor` as the ongoing
  health check for the channel.

## Output

What was configured, what the round-trip proved (send ✅ / inbound ✅ with
which identity), the files touched, and — if anything failed — exactly where
in the step-by-step it stopped and the manual fix.


---

## Remote work server — `/agentic-workflow:connect server <tailscale-hostname>`

Goal: heavy work (Docker, integration suites, builds, dev servers) runs on the
server while the session stays local (§10 **Remote executor**). The owner
provides only the Tailscale hostname (and answers prompts); every step is
verified before the next; nothing is recorded until the round-trip proves out.
The secret rule holds: no passwords in the conversation — the one step that
may need one (`ssh-copy-id`) is run BY THE HUMAN (`! ssh-copy-id …`), never by
you.

1. **Collect** (AskUserQuestion where missing): Tailscale hostname (from
   `$ARGUMENTS`), SSH user on the server, repo path there (default
   `~/apps/<repo>`). Sanity: `tailscale status 2>/dev/null | grep <host>` when
   the CLI exists — absent is fine, Tailscale MagicDNS still resolves.
2. **Key + alias.** No `~/.ssh/id_ed25519*`? → `ssh-keygen -t ed25519 -N ""`.
   Test `ssh -o BatchMode=yes <user>@<host> true`; on failure tell the human
   to run `! ssh-copy-id <user>@<host>` (they type the password, once) and
   re-test. Then append a `Host <repo>-server` block (HostName, User) to
   `~/.ssh/config` — the alias is what every later command and §10 row uses.
3. **Server readiness.** Over SSH check `git`, `node >= 18`, `pnpm`, `docker`
   (+ compose). Report what's missing with the exact install commands for the
   server's distro; run them only with the owner's explicit okay.
4. **Repo on the server, no password dance**: generate a key ON the server if
   none (`ssh <alias> ssh-keygen …`), register it from here with
   `gh repo deploy-key add` (read-only is enough for gates; read-write if
   remote worktrees will push), then `ssh <alias> git clone git@github.com:…
   <path>` and copy the untracked env: `scp .env <alias>:<path>/` (values
   never transit the conversation). Seed per §10.
5. **Docker context**: `docker context create <repo>-server --docker
   "host=ssh://<alias>"`; verify `docker --context <repo>-server ps`. Tell the
   owner: `docker context use <repo>-server` makes every docker/compose
   command run server-side; per-project direnv (`DOCKER_HOST`) if they prefer
   scoping.
6. **Round-trip proof (all four, else stop and diagnose)**: `ssh <alias> true`
   exits 0 · remote `node --version` ≥ 18 · `ssh <alias> 'cd <path> && git
   fetch -q && git rev-parse origin/<default>'` equals the local
   `git rev-parse origin/<default>` · `docker --context <repo>-server ps`
   exits 0.
7. **Record — only now**: §10 **Remote executor** row (`ssh <repo>-server ·
   repo at <path> · sync: push + fetch (pushed-branch-tip only, LA-8)`);
   rewrite the heavy §10 gate rows in remote form with the owner's okay
   (`ssh <repo>-server 'cd <path> && git fetch -q && git checkout -q <branch>
   && <gate>'` — integration first: it runs next to the Tailscale Postgres);
   document the alias + docker context in `docs/AUTH.md` §"Databases & remote
   access" (names and recipes, no values). Report: what runs remotely now,
   what stayed local, and the one command that undoes it (`docker context use
   default`, remove the §10 row).
