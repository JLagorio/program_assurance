# FilterChip

A filter of a collection as a chip: dashed while it offers a column, solid once a value is applied. Ledger part: `<FilterChip>` (static rendition; the popover of values is behaviour of the React part, which is not bundled).

**When to use.** In a Toolbar, after the search and the saved views, one chip a column a reader filters by.

**What you write.** `<a class="k-chip">Status</a>`: 28px, radius 6, a 1px dashed `--ds-color-border-bold`, text in `--ds-color-text-subtle`. Applied it is `k-chip is-on` with the column, a colon and the value, and a 12px `x` icon that clears it.

**Do**
- Name the chip for its column in the product's words: Control status, Control family, Owner.
- Put Owner last; its values end with No owner and how many records nobody owns.
- Offer every value there is, not only the values on the page shown.

**Don't**
- No tab for what is a filter over one collection.
- Don't hide an applied filter: the applied count and Clear filters include every chip.

In this stylesheet an applied chip is ink on `--ds-color-background-neutral` with a `--ds-color-border-bold` edge (the proposal's rule); shipped Ledger draws it with `--ds-color-background-selected` and `--ds-color-border-selected`.
