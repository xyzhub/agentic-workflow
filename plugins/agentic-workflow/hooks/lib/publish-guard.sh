#!/usr/bin/env bash
# publishing guardrail (§14, PreToolUse/Bash) — the Claude-side backstop for the publish gate.
#
# Extracted from hooks.json (v1.52.0) so it is reviewable, diffable and harness-dispatchable.
# The runtime-agnostic invariant is tools/publish-gate.mjs (the only check inside Codex); this
# hook sees the Bash COMMAND TEXT only. Threat model: accident and double-fire, not an
# adversarial agent (§14) — a token can be pasted; MCP/HTTP tools never pass through here.
#
# Contract (rules in order, on CMD = .tool_input.command):
#   1. TOP = git toplevel of the command's leading `cd <dir>` (else cwd), falling back to `.`
#      — the SAME contract as publish-gate.mjs, so the two can never read different files.
#   2. Paid/ad endpoint (now incl. api.elevenlabs.io, api.x.com) without the literal
#      PAID_CONFIRMED_BY_HUMAN → exit 2 (never delegable, §11).
#   3. Not a publish-host call (socials, article platforms, mailing-list + email APIs, a bare
#      mailer in command position) → exit 0, silent.
#   4. Publish-host call: PUBLISH_CONNECT= → exit 0 (connect round-trip reminder); no
#      PUBLISH_CLAIM=<8 hex> → exit 2 under EVERY policy; a token whose last event in
#      publish-claims.jsonl is not claimed|dispatching → exit 2; kind outreach (or anything but
#      post) → exit 2 regardless of policy (§11); still `claimed` (dispatch, which re-hashes the
#      body, was skipped) → exit 2; `dispatching` → append a `fired` event (the token is now
#      spent — a retry or a parallel call under it BLOCKS) and exit 0 + reminder.
#   - jsonl values are read only through `jq --arg`, character-whitelisted before printing,
#     and never eval'ed or interpolated into a command.
#   - Fail closed: no jq, or an unreadable/malformed jsonl → the token cannot be verified → exit 2.
#
# stdin: the hook event JSON. cwd: the project dir.

INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null || printf '%s' "$INPUT")

# 1. Files — the same root resolution as the gate tool.
D=$(printf '%s' "$CMD" | sed -n 's/^ *cd  *\([^;&|]*\).*/\1/p' | sed 's/"//g; s/ *$//'); D=${D:-.}
TOP=$(git -C "$D" rev-parse --show-toplevel 2>/dev/null); TOP=${TOP:-.}
WF="$TOP/docs/WORKFLOW.md"
CLAIMS="$TOP/docs/product/launch/publish-claims.jsonl"

# 2. Paid — the money boundary, before anything else.
if printf '%s' "$CMD" | grep -qiE 'ads-api\.|googleads|adaccounts|/act_[0-9]+/|/ads/|api\.elevenlabs\.io|api\.x\.com'; then
  if ! printf '%s' "$CMD" | grep -q 'PAID_CONFIRMED_BY_HUMAN'; then
    echo '❌ BLOCKED: paid endpoint crosses the money boundary (§11) — never delegable; human-fired within the budget ceiling, with PAID_CONFIRMED_BY_HUMAN in the command.' >&2
    exit 2
  fi
fi

# 3. Publish host? (a bare mailer counts only in command position — `echo mutton` does not)
HOSTS='api\.(x|twitter|linkedin|medium)\.com|dev\.to/api|buttondown|mailchimp|bsky\.social|hashnode|/api/v1/statuses|api\.sendgrid\.com|api\.postmarkapp\.com|api\.resend\.com|api\.mailgun\.net|api\.convertkit\.com|api\.brevo\.com|smtps?://'
MAILERS='(^|[;&|])[[:space:]]*([^[:space:];&|]*/)?(sendmail|msmtp|mailx|mutt)([[:space:]]|$)'
if ! printf '%s' "$CMD" | grep -qiE "$HOSTS" && ! printf '%s' "$CMD" | grep -qE "$MAILERS"; then
  exit 0
fi

# 4. Connect round-trip, then the claim token.
case "$CMD" in
  *PUBLISH_CONNECT=*)
    echo '📣 Connect round-trip (§14): owner-only test destination, nothing public, no queue item — record only the var NAME.'
    exit 0 ;;
esac

TOK=$(printf '%s' "$CMD" | grep -oE 'PUBLISH_CLAIM=[0-9a-f]{8}' | head -1 | cut -d= -f2)
if [ -z "$TOK" ]; then
  echo '❌ BLOCKED: publish-host call without a claim token (§14) — under EVERY policy. Mint one: publish-gate.mjs claim <id> (approved, pinned, due), then put PUBLISH_CLAIM=<token> in this same command; a connect round-trip is marked PUBLISH_CONNECT=1.' >&2
  exit 2
fi
[ -f "$CLAIMS" ] || { echo "❌ BLOCKED: PUBLISH_CLAIM=$TOK — no publish-claims.jsonl at $CLAIMS" >&2; exit 2; }

# Last event for this token. jq failing on ANY line (malformed jsonl, jq missing) fails closed.
# One check-and-spend at a time (parallel Bash calls under one token); a stale lock fails closed.
LOCK="$CLAIMS.hook-lock"
mkdir "$LOCK" 2>/dev/null || { echo "❌ BLOCKED: another publish-host call is being checked ($LOCK) — one call per token; if none is running, remove the lock." >&2; exit 2; }
trap 'rmdir "$LOCK" 2>/dev/null' EXIT
LAST=$(jq -r --arg t "$TOK" 'select(.token==$t) | "\(.event) \(.kind) \(.id) \(.run) \(.sha8) \(.epoch)"' "$CLAIMS" 2>/dev/null) || LAST='unreadable-claims-file'
LAST=$(printf '%s\n' "$LAST" | tail -1)
read -r EV KIND ID RUN SHA8 EPOCH _ <<EOF
$LAST
EOF
EV=$(printf '%s' "$EV" | tr -cd 'a-z-'); KIND=$(printf '%s' "$KIND" | tr -cd 'a-z'); ID=$(printf '%s' "$ID" | tr -cd 'A-Za-z0-9._-')
RUN=$(printf '%s' "$RUN" | tr -cd 'a-z0-9-'); SHA8=$(printf '%s' "$SHA8" | tr -cd '0-9a-f'); EPOCH=$(printf '%s' "$EPOCH" | tr -cd '0-9')

case "$EV" in
  claimed|dispatching) ;;
  *) echo "❌ BLOCKED: PUBLISH_CLAIM=$TOK is not an open claim (last event: ${EV:-none}) — a token fires once; claim again or reconcile." >&2
     exit 2 ;;
esac
if [ "$KIND" = outreach ]; then
  echo "❌ BLOCKED: $ID is outreach — individual outreach is never delegable (§11); send it by hand, regardless of Publish policy." >&2
  exit 2
fi
if [ "$KIND" != post ]; then
  echo "❌ BLOCKED: PUBLISH_CLAIM=$TOK resolves to kind '${KIND:-none}' — only a kind: post claim ever fires." >&2
  exit 2
fi
if [ "$EV" = claimed ]; then
  echo "❌ BLOCKED: PUBLISH_CLAIM=$TOK is claimed but not dispatched — run publish-gate.mjs dispatch $TOK first (it re-checks the approved hash), then fire." >&2
  exit 2
fi

# Spend the token BEFORE the call: the next call under it sees `fired` and blocks. Built by jq --arg.
FIRED=$(jq -nc --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" --arg id "$ID" --arg s "$SHA8" --arg e "$EPOCH" --arg t "$TOK" --arg r "$RUN" \
  '{ts:$ts,event:"fired",id:$id,kind:"post",sha8:(if $s=="" then null else $s end),epoch:(if $e=="" then null else ($e|tonumber) end),token:$t,run:(if $r=="" then null else $r end),by:"publish-guard hook",note:"publish-host call passed the §3 hook; token spent"}' 2>/dev/null)
if [ -z "$FIRED" ] || ! printf '%s\n' "$FIRED" >> "$CLAIMS" 2>/dev/null; then
  echo "❌ BLOCKED: PUBLISH_CLAIM=$TOK — could not record the fire in $CLAIMS, so the token cannot be spent; refusing." >&2
  exit 2
fi

POLICY=unset
if grep -qiE '\*\*Publish policy\*\* *\| *_?may-publish' "$WF" 2>/dev/null; then POLICY=may-publish
elif grep -qiE '\*\*Publish policy\*\* *\| *_?human-only' "$WF" 2>/dev/null; then POLICY=human-only; fi
echo "📣 Firing $ID under claim $TOK (§14, policy: $POLICY) — record the outcome right after: publish-gate.mjs outcome $TOK delivered --permalink <url> | unknown."
exit 0
