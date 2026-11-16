# ChainRail

The assurance chain as a rail of seven fixed stations, from controls to remediation, where a gap breaks the line. Proposed in the November 2026 UX proposal; not in the package.

Ledger part it builds on: `Trace`.

**What it holds**
- **Rail** (`nx-rail`): Controls, Requirements, Evidence, Assessment findings, Operational issues, Risks, Remediation, in that order.
- **Counts at a station** (`nx-pips`, `nx-late`, `nx-risk`): what stands there, worst first.

**Do**
- A station the record does not reach says so in words.
- The record itself is the current station.

**Don't**
- No reordering or dropping stations.
- Known: a count on a dot reads 3.9:1 in dark; raise it before it ships.

The full-width card is the sheet as reviewed on the proposal's mocks canvas.
