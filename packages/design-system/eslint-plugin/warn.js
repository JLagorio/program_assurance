// A setting the lint cannot use is said once on stderr, never silently ignored: silence is the
// worst failure mode for a tool that enforces. From @shadcn/lint's project/warn.ts.

const said = new Set();
const stderr = (line) => process.stderr.write(`${line}\n`);
let sink = stderr;

/** Writes `[ledger] message` once per key per process. */
export function warnOnce(key, message) {
  if (said.has(key)) return;
  said.add(key);
  sink(`[ledger] ${message}`);
}

/** Sends warnings to `write` instead of stderr (tests), or back to stderr without one. Clears the
    record of what was said, so each test starts fresh. */
export function setWarningSink(write) {
  sink = write ?? stderr;
  said.clear();
}
