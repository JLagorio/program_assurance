# Rows

The work row: one line that says the verb, the target, why, who it waits on and when. Proposed in the November 2026 UX proposal; not in the package.

Ledger parts it builds on: `Item`, the task row, `DataTable`.

**What it holds**
- **Work row** (`nx-band`, `nx-slab`, `nx-fold`): verb, target, why, who, when, one line.
- **People and seats** (`nx-person`, `nx-seat`, `nx-unowned`): who holds it, or No owner, dashed.
- **Time** (`nx-late`, `nx-soon`): late and soon by shape and tone.

**Do**
- Cut a long name with an ellipsis; it shows whole on hover and focus.
- Group rows by who they wait on.

**Don't**
- No second line in a row.
- No colour on a name.

The full-width card is the sheet as reviewed on the proposal's mocks canvas.
