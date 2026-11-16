# RegisterPage

The Register page type: a page header with the name alone, then one frameless table that fills the work area. Proposed in the November 2026 UX proposal; not in the package.

Drawn as WS-X90's Controls. Ledger parts: `PageHeader`, `Toolbar`, `DataTable`.

**What it holds**
- **Columns** (`nx-code`, `nx-claim`, `nx-det`, `nx-verif`): the control, what is claimed, the determination, the evidence verified.
- **Groups and totals** (`nx-group`, `nx-total`, `nx-folded`): a family as a folded group with its total.
- **Split** (`nx-split`, `nx-pair`): the table and the open record's preview side by side.

**Do**
- Search first in the toolbar, one small primary at its end.
- One line a row; names cut with an ellipsis.

**Don't**
- No sentence under the title.
- No create button in the page header.

The full-width card is the board as drawn on the proposal's mocks canvas.
