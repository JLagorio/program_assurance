# ButtonGroup

Two or more buttons joined into one control, most often a create action and the labelled menu of its other paths. Ledger part: `<ButtonGroup>` (static rendition; the React part is not bundled).

**When to use.** A collection has a second way to create its record: Create system, then "More ways to create a system". A single path stays a plain button.

**What you write.** `<span class="k-btngroup">` holding `k-btn`s of one variant and one size. The group squares the inner corners and leaves a 1px seam between them. The menu half is `is-icon` with a `chevron-down` and an `aria-label` that says what it opens.

**Do**
- Keep both halves the same variant: primary in a register's toolbar, secondary among other collections under Section headings.
- Name the menu half for its menu: "More ways to create a gate criterion".

**Don't**
- Don't group unrelated actions, and don't use a group as a view switcher: that is a ToggleGroup.
- Don't mix heights inside one group.
