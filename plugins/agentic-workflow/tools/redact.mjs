#!/usr/bin/env node
// redact.mjs — scrub secrets from any text the runner prints, logs or alerts.
// Zero deps; Node >= 18. Two layers:
//   1. the seven `hl_redact` shapes (hooks/lib/handoff-lib.sh), transliterated
//      line by line so the output is byte-identical to the bash filter (a
//      parity test in tools/runner-test.mjs pins it);
//   2. an exact-value scrub: every env var whose NAME matches SECRET_NAME_RE
//      and whose value is >= 8 chars is replaced, longest value first, by
//      `[redacted]` wherever it appears.
//
//   import { redact } from './redact.mjs';  redact(text, env = process.env)

export const SECRET_NAME_RE = /(TOKEN|SECRET|KEY|PASSWORD|CREDENTIAL)/i;

// sed -E rules from hl_redact, in order; `g` where sed has it. sed is
// line-oriented, so each rule runs per line (^ = start of the line).
const SHAPES = [
  [/(^|[^A-Za-z0-9_])sk-[A-Za-z0-9_-]{8,}/g, '$1[redacted]'],
  [/(^|[^A-Za-z0-9_])gh[pousr]_[A-Za-z0-9_]{8,}/g, '$1[redacted]'],
  [/github_pat_[A-Za-z0-9_]{8,}/g, '[redacted]'],
  [/AKIA[A-Z0-9]{16}/g, '[redacted]'],
  [/xox[abpr]-[A-Za-z0-9-]{8,}/g, '[redacted]'],
  [/[Bb][Ee][Aa][Rr][Ee][Rr] [^ ]+/g, '[redacted]'],
  [/-----BEGIN [A-Z0-9 ]*-----.*/, '[redacted]'],
];

// sed's global replace resumes after each match, so a `(^|[^…])` prefix that a
// previous match consumed cannot be reused — JS replace behaves the same way.
export function redactShapes(text) {
  return String(text).split('\n').map((line) => SHAPES.reduce((l, [re, to]) => l.replace(re, to), line)).join('\n');
}

export function secretValues(env = process.env) {
  return Object.entries(env || {})
    .filter(([k, v]) => SECRET_NAME_RE.test(k) && typeof v === 'string' && v.length >= 8)
    .map(([, v]) => v)
    .sort((a, b) => b.length - a.length);
}

export function redact(text, env = process.env) {
  let out = redactShapes(text == null ? '' : text);
  for (const v of secretValues(env)) out = out.split(v).join('[redacted]');
  return out;
}
