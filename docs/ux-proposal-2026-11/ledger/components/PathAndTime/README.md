# PathAndTime

The dated path of a program and time on one line: a stage list, a due rail and clocks that say late, soon or on time. Proposed in the November 2026 UX proposal; not in the package.

Ledger parts it builds on: `Stepper`, `Timeline`, `Chart`, `DateLabel`.

**What it holds**
- **Path** (`nx-path`, `nx-stage`, `nx-stop`): vertical, dated or laddered, one stage open.
- **Due rail** (`nx-late`, `nx-soon`): dated items as dots on one axis above their table, today ruled across.
- **Checklist and meter** (`nx-checklist`, `nx-check`, `nx-meter`): what a stage needs before it can close, counted.

**Do**
- Late is told by shape as well as colour.
- Every dot on the rail is also a row of the table under it.

**Don't**
- No filled button inside the path.
- No path as the only way to a date: the table holds them all.

The full-width card is the sheet as reviewed on the proposal's mocks canvas.
