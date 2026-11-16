# Toolbar

The one row over a collection: search first, saved views, filters, the collection's tools, and one small create action at the end. Ledger part: `<Toolbar>` (static rendition; the fold into More on a narrow frame is behaviour of the React part, which is not bundled).

**When to use.** Above every DataTable that a reader searches or filters. A read-only review table inside a dialog keeps search alone.

**What you write.** `<div class="k-toolbar">` (at least 32px, 8px gaps) holding, in order: `<span class="k-field is-search">` with a `search` icon and the placeholder; a saved-view trigger; `k-chip` filters (`is-on` once applied); `<span class="grow"></span>`; subtle icon buttons for Sort, Columns and the Collection actions overflow; then the one `k-btn`.

**Do**
- The search says Find and the collection: Find risks, Find assessment findings.
- A register, or a tab whose only content is a collection, creates through a small primary. A collection beside others under Section headings creates through a small secondary.
- Put Export and other optional commands in the labelled Collection actions overflow.
- Leave out a capability the collection or the reader's role has no use for.

**Don't**
- No second visible toolbar action beside the create, and no create button in the page header.
- Don't rebuild the row with a second wrapper, and don't let the search or the primary fold away.
