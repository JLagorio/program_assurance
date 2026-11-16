# Menu

A list of commands or choices that opens from a trigger. Ledger part: `<DropdownMenu>` (static rendition, drawn open under its trigger; the React part is not bundled).

**When to use.** A record's Actions menu, a row's actions, a version chooser, the other ways to create a record. One or two actions are buttons, not a menu.

**What you write.** `<div class="k-menu">` (at least 200px, 4px padding, radius 10, `--ds-elevation-surface-overlay`, `--ds-elevation-shadow-overlay`) > `<a class="k-menu-item">` rows (28px, radius 6, an optional leading 16px icon). `is-hover` is the pointed or focused row (`--ds-color-background-neutral`). A `k-divider` separates groups. A destructive item is `c-danger` and comes last in its group. A radio row leads with a `k-radio` and may end in a small badge.

**Do**
- Order a record's menu: the edit first, the record's other commands, Inspect record last.
- Say the operation and its noun on each item: Edit risk, Assign owner, Unlink requirement.
- Name an icon trigger for what it opens: "Row actions for REQ-008".
- Let the menu be as wide as its longest label.

**Don't**
- No item that only navigates where a link already stands beside it.
- Don't hide the surface's primary in a menu, and don't nest menus more than one level.
- An item that cannot run keeps its place and says why; it does not vanish.
