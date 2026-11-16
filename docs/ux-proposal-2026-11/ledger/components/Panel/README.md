# Panel

The preview panel beside a collection: an outer header of navigation only, then one inner record header and the record's facts. Ledger parts: `Shell.Panel` with the `PreviewNavigation` pattern (static rendition; the React parts are not bundled).

**When to use.** Opened by a row's eye, to inspect a record without leaving the register. The collection stays mounted, so filters, sort and selection survive.

**What you write.** `<aside class="k-panel">` (400px, a 1px `--ds-color-border` on its start edge, `--ds-elevation-surface`) > `k-panel-head` (44px: previous, next, the position, then at the end the open-in-new-tab link and Close, all `k-btn is-subtle is-icon s-xs`) and `k-panel-body` (16px padding, 16px gaps): the record's name as an h2 with its one small primary and an overflow menu, then a `k-kv` of facts and labelled text.

**Do**
- Name the panel "<Record type> preview" in sentence case; Close repeats it: Close Operational issue preview.
- Count the position against the whole result: 3 of 43 records.
- Keep the outer header to navigation; the name and the record's actions belong to the inner header.
- Offer the open-in-new-tab link only for a record that has a page of its own.

**Don't**
- No record name or record action in the outer header, no second action row in the body, no full-record link repeated at the bottom.
- Don't show every column: only the facts the reader asks for.
