// shell-wrappers.mjs — the ONE denylist of commands that run some OTHER command
// (shells, launchers, interpreters) and so hide the real argv from any rule
// that inspects a command's first token. Zero deps; Node >= 18.
//
// Three consumers import it (retro #129 — the class was re-derived by hand in
// run-claude.mjs, missed on the first pass, and cost a corrective + re-review):
//   • tools/run-claude.mjs `isBareBash` — a claude-p child's Bash allowlist
//     rule whose command is a wrapper (`Bash(sh -c:*)`, `Bash(env:*)`,
//     `Bash(node -e:*)`) allows everything, so the adapter refuses to spawn;
//   • tools/lint.mjs `tunePresetFindings` — the same refusal over the shipped
//     Haiku rows in templates/tune-presets.json;
//   • tools/run-codex-test.mjs — cross-checks templates/codex.rules: every
//     wrapper with a `codex` form below has a rule whose `# covers:` names it,
//     and every exempt wrapper carries its reason here, so the two lists cannot
//     drift apart silently.
//
// Two threat models, one list. The claude-p allowlist refuses EVERY wrapper
// (a rule is a prefix grant, so `Bash(node:*)` grants `node -e <anything>`).
// Codex execpolicy matches literal argv prefixes AFTER unwrapping its own
// `zsh -lc`, so only the INLINE forms matter there (`sh -c '<cmd>'`,
// `node -e '<code>'`): `node tools/lint.mjs` is legitimate and stays allowed.
// `codex: null` + `why` records a deliberate exemption, never an oversight.

export const WRAPPER_RULES = [
  // ── shells ───────────────────────────────────────────────────────────────
  { name: 'sh', codex: ['sh', '-c'] },
  { name: 'bash', codex: ['bash', '-c'] },
  { name: 'zsh', codex: null, why: 'n=1 2026-09-17: Codex runs every command as `zsh -lc "<cmd>"` and unwraps it before matching; a zsh rule blocked everything and protected nothing (#81)' },
  { name: 'dash', codex: ['dash', '-c'] },
  { name: 'ksh', codex: ['ksh', '-c'] },
  { name: 'fish', codex: ['fish', '-c'] },
  // ── launchers / builtins that run their arguments ────────────────────────
  { name: 'env', codex: ['env'] },
  { name: 'eval', codex: ['eval'] },
  { name: 'exec', codex: ['exec'] },
  { name: 'command', codex: ['command'] },
  { name: 'source', codex: null, why: 'file form, same class as `sh script.sh` (allowed by design — the inline string is the bypass, not a script path); sandbox is the backstop' },
  { name: '.', codex: null, why: 'the POSIX spelling of `source` — same file-form exemption, same sandbox backstop' },
  { name: 'xargs', codex: ['xargs'] },
  { name: 'nohup', codex: ['nohup'] },
  { name: 'timeout', codex: ['timeout'] },
  { name: 'sudo', codex: ['sudo'] },
  // ── interpreters: inline-code flags only on the codex side ──────────────
  { name: 'node', codex: ['node', '-e'] },
  { name: 'python', codex: ['python', '-c'] },
  { name: 'python3', codex: ['python3', '-c'] },
  { name: 'perl', codex: ['perl', '-e'] },
  { name: 'ruby', codex: ['ruby', '-e'] },
];

// `find … -exec <cmd> {} ;` runs anything too; it is not a prefix form, so it
// is refused on the allowlist side only (codex: the sandbox is the backstop).
export const EXEC_FLAGS = ['-exec', '-execdir'];

export const WRAPPERS = new Set(WRAPPER_RULES.map((r) => r.name));

// A first token may name one literal executable and nothing else. Any shell
// metacharacter in it is a disguise or a compound (`git;sh`, `$(sh)`, `x|sh`,
// `FOO=bar` — an env assignment prefix runs whatever follows) — refused.
export const FIRST_TOKEN_META = /[;|&$<>`(){}=!#~]/;

// Quotes and backslashes never change which program runs — `"sh" -c`, `s\h`,
// `'env'` — so they are stripped BEFORE the first token is read (checkpoint p2
// advisory residual, 2026-10-11).
export const stripDisguise = (s) => String(s).replace(/["'\\]/g, '');

const basename = (p) => {
  const parts = p.split('/');
  return parts[parts.length - 1] || p;
};

// The command part of a `Bash(<cmd>)` rule → why it is unscoped, or null when
// it names one literal, non-wrapper executable first. Pure; case-insensitive.
export function unscopedReason(cmd) {
  const tokens = stripDisguise(cmd).trim().toLowerCase().split(/[\s:]+/);
  const first = tokens[0];
  if (first === '' || /[*?[\]{}]/.test(first)) return 'glob or empty first token';
  if (FIRST_TOKEN_META.test(first)) return `shell metacharacter in first token "${first}"`;
  if (WRAPPERS.has(basename(first)) || WRAPPERS.has(first)) return `wrapper/interpreter "${first}"`;
  if (tokens.some((t) => EXEC_FLAGS.includes(t))) return 'find -exec/-execdir';
  return null;
}

// A Bash permission rule (`Bash`, `Bash(git log:*)`, `bash(...)`) that lets the
// child run anything. Non-Bash rules are never bare.
export function isBareBash(rule) {
  const m = String(rule).trim().match(/^bash\s*(?:\(([\s\S]*)\))?$/i);
  if (!m) return false;
  return unscopedReason(m[1] ?? '') !== null;
}
