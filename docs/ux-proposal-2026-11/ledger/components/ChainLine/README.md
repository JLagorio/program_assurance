# ChainLine

A record's place on the assurance chain as one 36px line of six stations, each a count and a link to its register. Proposed in the November 2026 UX proposal; not in the package (shipped Ledger has the fuller `Trace` pattern).

**When to use.** On every record page, under the header facts and above the tabs. A record with no chain (a component) takes a StandingLine in its place.

**What you write.** `<nav class="nx-chain">` holding six `<a class="nx-chain__stop">`, always in this order: Controls, Requirements, Evidence, Findings, POA&M, Risks. Each is `<i></i>` (the dot), `<span>` the name, `<b>` the count, and optionally `<em>` one short fact or `<u>` the verb that closes a gap. States: `is-here` (the record's own station: ink, heavier, no count), `is-gap` (owed and missing: `--ds-color-text-warning`, a hollow dot, ends in its verb), `is-bad` (a danger dot and a red fact), `is-none` (nothing there and nothing owed: `--ds-color-text-subtlest`).

**Do**
- Keep all six stations on every record, in the same order, even when a count is 0.
- Let a gap carry its fix in the words of the operation: Add evidence.
- One fact a station at most: Not satisfied, 39d late, High.

**Don't**
- No seventh station, no icons, no second line.
- Don't mark more than one station `is-here`, and don't colour a station that has nothing wrong.
