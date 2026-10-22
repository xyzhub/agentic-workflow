---
name: browse
description: Fast browser use via Jev — one command walks a short goal through a real browser (sign in, fill a form, flip a pricing toggle) with no model call per step, and hands back to you when unsure. Use only when TYPESAFE_API_KEY is set; otherwise verify with Bash-driven Playwright as before.
---

# Browse — fast browser use via Jev

`tools/browse.mjs` runs a browser loop where Jev (TypeSafe's decision model,
~200 ms per step) picks each click or keystroke from a numbered element list.
It acts only above a confidence gate, never trusts its own "done" alone, and
hands control back with the page state whenever it is unsure.

## When

- `TYPESAFE_API_KEY` is set → use it for live checks and browser walks.
- Not set → the command exits 6 with one line; do exactly what you did before
  (Bash-driven Playwright). Nothing else changes.

## Commands

```bash
node ${CLAUDE_PLUGIN_ROOT}/tools/browse.mjs run --goal "<goal>" --url <url> [--until-text "<text>" | --until-url <regex>] --json
node ${CLAUDE_PLUGIN_ROOT}/tools/browse.mjs step --goal "<goal>" --state <snapshot.json> [--history <file>]
node ${CLAUDE_PLUGIN_ROOT}/tools/browse.mjs snapshot --url <url> [--json]
node ${CLAUDE_PLUGIN_ROOT}/tools/browse.mjs doctor
```

Other `run` flags: `--cdp <url>` (attach), `--allow-irreversible`,
`--trace <file>`, `--max-steps N` (default 30).

## Writing a goal

- Short: one page or one form per run. Chain runs for a longer flow.
- Quote every literal the page needs: `enter the name "Jane Doe" and continue`.
  The tool can only type what the goal quotes.
- Secrets by reference, never by value: `sign in as {{secret:admin.login}} with
  {{secret:admin.password}}`. `<user>` is a Role or login from the `docs/AUTH.md`
  Test users table; `<field>` is `login` or `password`.
- Give a stop condition when you know one (`--until-text "Welcome back"` or
  `--until-url "/dashboard$"`): it is checked by code, not by Jev.

## Exit codes — what you do next

| Exit | Meaning | Your move |
|---|---|---|
| 0 | Done and verified | Use the result (`page`, `elements`, `verify`) |
| 2 | Jev says done, the check failed or could not confirm | Verify yourself: `snapshot`, or re-run with `--until-*` |
| 3 | Handed off; read `reason` | `low_confidence`/`stuck`: act yourself or re-run with a sharper goal · `needs_value`: re-run with the literal quoted · `needs_secret`: add the AUTH.md row or fix the reference · `bot`/`error`: a person or your own tools take over · `max_steps`: split the goal |
| 4 | Irreversible action pending (`proposed`); nothing was executed | Do that one action yourself, or re-run with `--allow-irreversible` if the goal really means it |
| 5 | Backend unavailable (no Chrome, CDP unreachable, Jev down, Node < 22) | Bash-driven Playwright as before |
| 6 | No `TYPESAFE_API_KEY` | Bash-driven Playwright as before |
| 1 | Usage or internal error | Fix the command line |

`step` exits 3 with `reason: needs_secret` when the next action would type a
secret: a hand-back surface cannot type secrets — use `run` or `--cdp`.

## Surfaces

- **Launched Chrome** (default): headless, with a plugin-owned profile
  (`BROWSE_PROFILE_DIR`, else `~/.local/share/agentic-workflow/browse/profile`),
  never your everyday Chrome profile.
- **`--cdp <url>`**: attach to any running Chromium with a debug port,
  including BrowserOS neo when its debug port answers (`doctor` tells you).
- **`step`**: for surfaces only you can drive (Claude in Chrome, computer use,
  MCP browsers). Paste the page as a snapshot JSON (`{page:{url,title,text},
  elements:[{index, role, label, value?, ops}]}`), get back `{op, index, label,
  valueRef}`, act yourself, repeat. Jev still decides; `step` never types
  secrets.

## Secrets rule

Never paste a secret value into a goal, a state file or a prompt. `run`
resolves every `{{secret:…}}` once at start from `docs/AUTH.md` (`$NAME` cells
read the env var), types it straight into the page, and writes only the
reference to Jev, the trace, stdout and stderr.

## Trace

One JSON line per step under `.git/agentic-workflow/browse/traces/` (outside a
repo: `~/.local/state/agentic-workflow/browse/traces/`; `BROWSE_TRACE_DIR`
overrides). Never in the worktree: a `--trace` path inside it is refused. The
path is in the result as `trace_path`.

## doctor

`doctor` prints Node, whether the key is set (never its value), the Chrome it
would launch, the CDP port, a BrowserOS neo probe (debug port and its MCP
`tools/list`), and the trace and profile folders. Always exits 0.
