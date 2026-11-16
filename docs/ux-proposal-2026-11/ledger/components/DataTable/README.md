# DataTable

A register's rows: a frameless table with a 32px header and one 40px line a record. Ledger parts: `<DataTable>` over `<Table>` (static rendition: the look of the rows only; sorting, paging, selection, the responsive fold and the column menus are behaviour of the React part, which is not bundled).

**When to use.** Every collection of records, standalone or inside a record body. A version list or an ordered definition list keeps the plain table without search or sort.

**What you write.** `<table class="k-table">`: `th` 32px, 12/16 at 500 in `--ds-color-text-subtle`; `td` 40px, one line, a `--ds-color-border` hairline under each row. `td.is-fill` is the name column: it takes the room that is left and cuts with an ellipsis. `is-num` right-aligns a number. `tr.is-hover` (`--ds-elevation-surface-hovered`) and `tr.is-selected` (`--ds-color-background-selected`) are the row states. `is-compact` makes rows 36px. Wrap it in `k-tablebox` so a narrow frame scrolls the table, not the page.

**Do**
- Lead with the record's name as a `k-name` link to its page; a row click goes where the name goes.
- One line a row, no second line in a cell, numbers as numbers. At most one badge a row; severity is an Indicator.
- Draw a missing value as the Absent mark (an em dash named No owner) and a date as a DateLabel; the value behind it stays empty, so it sorts and filters as empty.
- Page at 25 rows; say the range and the whole count under the table.

**Don't**
- No frame, zebra stripes, vertical rules or icons in rows.
- Never draw every row of a large register at once, and never join several values into one text cell.
- Don't colour or bold a name beyond `k-name`: a register's colour stays with its statuses.
