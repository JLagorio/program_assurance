# ReviewWorkspace

The assessor's workspace: a plan's objectives judged one at a time by key, with the evidence beside them. Proposed in the November 2026 UX proposal; not in the package.

Ledger parts it builds on: `RadioGroup`, `Kbd`, `WorkPane`, `ActionBar`.

**What it holds**
- **Bench** (`nx-bench`, `nx-plan`, `nx-objstrip`): the objectives in order, the one open, its evidence beside it.
- **Decision keys** (`nx-keys`, `nx-keycap`): cards with a shortcut, in workspaces only, asleep inside a text field.
- **Foot bar** (`nx-footbar`): what is judged and what is left, and the one action.

**Do**
- One key a determination, the same on every objective.
- The assessor judges; the lead assessor publishes.

**Don't**
- No decision keys outside a workspace.
- No key that acts while a text field has focus.

The full-width card is the sheet as reviewed on the proposal's mocks canvas.
