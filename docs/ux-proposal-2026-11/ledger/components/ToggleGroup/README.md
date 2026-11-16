# ToggleGroup

A joined group of choices where one is pressed: the way a view is shown, or what a chart counts. Ledger part: `<ToggleGroup>` (static rendition; the React part is not bundled).

**When to use.** Two to four takes of the same records on one tab: Grid, Skyline or List; Families or List; a chart and its table. A different collection is a tab, and a filter is a FilterChip.

**What you write.** `<span class="k-toggle" role="group" aria-label="Show as">` > `<a class="k-toggle-item" aria-pressed="true|false">`. Items are 28px, 12/16 at 500 in `--ds-color-text-subtle`, inside one 1px `--ds-color-border-input` ring with radius 6. An item may lead with a 14px icon.

**Do**
- Name the group for what it chooses (Show as, Count, Columns) and keep each label to one or two words.
- Keep the choice in the address, so Back and a shared link return to it.
- Give a chart its table one toggle away.

**Don't**
- Not for navigation between pages, and not for more than about four choices.
- Never leave none pressed.

In this stylesheet the pressed item is ink on `--ds-color-background-neutral` with a `--ds-color-border-bold` ring (the proposal's rule); shipped Ledger draws it with `--ds-color-background-selected` and `--ds-color-text-selected`.
