# Counting

The counting forms: bars, rungs and marks that show where a baseline stands, always beside the number they draw. Proposed in the November 2026 UX proposal; not in the package.

Ledger parts it builds on: `Tally`, `Ladder`, `Progress`, `TileMap`, `Table`.

**What it holds**
- **Meter** (`nx-meter`): a neutral bar beside "N of M".
- **Climb** (`nx-ladder`, `nx-rungs`): the baseline's four rungs with the gaps to scale, three pixels at least a segment.
- **Marks and objective cells** (`nx-strip`, `nx-mark`, `nx-objs`, `nx-cell`, `nx-famrows`): a mark a control or an objective, in status tones.

**Do**
- Every form has a table twin one toggle away.
- A zero is quiet: a dot, never a coloured zero.

**Don't**
- No form without its number.
- Objective cells are not links at this size.

The full-width card is the sheet as reviewed on the proposal's mocks canvas.
