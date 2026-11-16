# RecordPage

The Record page type: a trail, the name as h1, one action slot, the authored text, then what stands against it. Proposed in the November 2026 UX proposal; not in the package.

Drawn as AC Monitoring Requirement 008. Ledger parts: `PageHeader`, `Section`, `KeyValue`, `Inspector`.

**What it holds**
- **Record body** (`nx-record`, `nx-prose`): Statement, Covers, What is missing, Allocated to, Open against it.
- **Properties** (`nx-src`, `nx-code`): the record's facts in its Details.
- **Gaps** (`nx-check`, `nx-late`, `nx-unowned`): what is missing, said in words, each with its fix.

**Do**
- Name the gap and the step that closes it.
- Keep authored text as prose, never truncated.

**Don't**
- No status badge in place of the action slot.
- No back-chevron row above the title.

The full-width card is the board as drawn on the proposal's mocks canvas.
