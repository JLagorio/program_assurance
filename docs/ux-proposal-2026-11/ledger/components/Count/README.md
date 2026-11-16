# Count

How many rows a tab, a section or a nav destination holds, as a small neutral pill. Ledger part: `<Count>` (static rendition; the React part is not bundled).

**When to use.** Beside the name of the collection it counts. A count a reader acts on (43 open issues) is a Stat or a tray heading instead.

**What you write.** `<span class="k-count">368</span>`: 20px tall, at least 20px wide, 12/16 at weight 500, `--ds-color-background-neutral` with `--ds-color-text-subtle`. It sits after the label inside a `k-tab`, a `k-section-head` or a `k-nav-item`.

**Do**
- Show 0 once the rows are read, and no count while they load or after the load failed.
- Cap a row count at 9999 and write "9999+" past it.
- Write the number in the reader's locale: 1,791.

**Don't**
- Never show a zero because a count could not be read.
- Don't tone a count, and don't use it for a status.
