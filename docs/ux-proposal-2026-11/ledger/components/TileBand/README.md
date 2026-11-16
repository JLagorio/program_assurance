# TileBand

An Overview's band of up to five tiles, each one number of the chain with a thin meter and the part to look at first. Proposed in the November 2026 UX proposal; not in the package (shipped Ledger has `Stat.Grid` and `Stat.Tile`).

**When to use.** Once, on an Overview page, under the header facts. The tiles run in chain order and each whole tile is the link to its register.

**What you write.** `<div class="nx-tiles">` > `<a class="nx-tile">` (a 1px `--ds-color-border`, radius 10; `is-hover` is its pointed state) holding `nx-tile__label` (the name and a trailing `chevron-right`), `nx-tile__figure` (24/30 at 600; `.of` is the quiet "of 560"), `nx-tile__meter` (a 4px bar: the figure's share first, then the sub-count's, then `<b>` the rest, sized by `style="flex: N"`) and `nx-tile__sub` (the part to look at first: a label and `<b>` its number; `t-warning` or `t-danger` when it is trouble). Meter fills are the `m-` marks: `m-ink` (a claim), `m-sat`, `m-part`, `m-other`, `m-crit`, `m-na`, `m-noev`.

**Do**
- N of M when the gap is the work: 174 of 560. A lone count when there is no whole: 43.
- Keep the same marks as every other count on the page: green is a published judgment, ink is a claim.

**Don't**
- No more than five tiles, no icon a tile, no percentage beside the figure.
- Don't tone the sub-line unless its number is itself the problem.
