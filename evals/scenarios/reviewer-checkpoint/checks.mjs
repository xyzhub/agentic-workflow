// Deterministic assertions for reviewer-checkpoint.
export default function checks({ events, resultText }) {
  const failures = [];
  const everything = JSON.stringify(events) + resultText;
  if (!/REQUEST[ _]CHANGES/i.test(everything))
    failures.push('reviewer did not return REQUEST CHANGES on a branch with two planted flaws');
  return failures;
}
