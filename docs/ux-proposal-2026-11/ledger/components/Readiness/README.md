# Readiness

Readiness for a decision: the checks it needs, the seats that must sign and the signatures given. Proposed in the November 2026 UX proposal; not in the package.

Ledger parts it builds on: `Avatar`, `Absent`, `Checkbox`, `Kbd`.

**What it holds**
- **Seats** (`nx-seats`, `nx-seat`, `nx-seatdots`): one a role that must sign, filled once signed.
- **Empty seat** (`nx-unowned`): a role nobody holds, dashed and pressable.
- **Attestation and signature** (`nx-attest`, `nx-sign`, `nx-keycap`): the signer's statement, then Sign with its key.

**Do**
- Count readiness as checks met of checks owed.
- Name the person a seat waits on.

**Don't**
- No signature without the statement it signs.
- No seat drawn without its role.

The full-width card is the sheet as reviewed on the proposal's mocks canvas.
