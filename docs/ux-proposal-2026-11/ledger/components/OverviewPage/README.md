# OverviewPage

The Overview page type: where a record stands first, in counted tiles, then what to fix next. Proposed in the November 2026 UX proposal; not in the package.

Drawn as WS-X90 Sentinel Mission System's Overview. Ledger parts: `PageHeader`, `Tray`, `Stat`, `TileMap`.

**What it holds**
- **Tiles** (`nx-tiles`, `nx-tile`): each heading is a count that opens what it counts.
- **Families** (`nx-famrows`): controls by family, one row a family with its marks.
- **Action slot and facts** (`nx-slot`, `nx-facts`): the record's one next step and its facts.

**Do**
- Worst first; a zero is muted.
- Every number opens the register asked for exactly those records.

**Don't**
- No sentence of prose where a count would do.
- No tile that cannot be opened.

The full-width card is the board as drawn on the proposal's mocks canvas.
