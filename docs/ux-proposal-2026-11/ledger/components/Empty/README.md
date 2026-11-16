# Empty

What an empty region says: a mark, a title, one line and the action that fills it. Ledger part: `<Empty>` (static rendition; the React part is not bundled; the product's illustration is drawn here as an icon in a circle).

**When to use.** A collection with no rows, a filter with no result, a record that cannot be found. A missing single value is the Absent mark in its place, never an Empty.

**What you write.** `<div class="k-empty">`: centred, 32px 16px padding, 8px between its parts, text in `--ds-color-text-subtle`; `k-empty-icon` is a 32px circle on `--ds-color-background-neutral` holding a Lucide icon; then the title, one line, and one button. A small region uses a compact form: the title and the action alone.

**Do**
- Offer the same create action as the collection's toolbar, under the same role check.
- Tell empty data from an empty filter result: the second offers Clear filters.
- A missing record gets a clear title, an explanation and a route back.

**Don't**
- Never show an empty state while the rows load or after the load failed.
- Never invent example records to fill an empty workspace.
- No more than one action.
