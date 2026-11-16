# RecordHeader

The record header the proposal puts on every record: the name as the h1, its standing in one line, and one action slot. Proposed in the November 2026 UX proposal; not in the package.

Ledger parts it builds on: `PageHeader`, `PageHeader.Actions`, `ActionBar`, `Button`. The sheet is the spec.

**What it holds**
- **Standing headline** (`nx-standing`, `nx-state`): one line of two beats on an Overview, one beat on a phone. The name stays the h1.
- **Action slot** (`nx-slot`, `nx-wait`): four forms and no others: advance, sign, waiting on a name with Remind, none.
- **Sign button** (`nx-sign`): ink, 36px, the signer's name on it. Command and Enter, never a bare Enter.
- **Empty seat** (`nx-unowned`): No owner, drawn dashed and pressable.

**Do**
- One slot a record; the slot says why it waits in `nx-slot__why`.
- A status word in the header uses `nx-state` in its tone, never a coloured title.

**Don't**
- No second action row and no sentence under the title.
- No filled button in the slot when the record waits on someone else.

The full-width card is the sheet as reviewed on the proposal's mocks canvas.
