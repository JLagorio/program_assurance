# TileMap

Every member of a set as one small square, coloured by its status, under a key that counts each status. Ledger part: `<TileMap>` with `TileMap.Key` (static rendition; the React part, where a mark is a button that opens its control, is not bundled).

**When to use.** A baseline's controls by family, when a reader should see where the gaps sit, not only how many there are. A split with no need of the members is a Tally.

**What you write.** `<div class="k-marks">` > one `<i class="k-mark-sq st-sat">` a member: 12px squares, radius 2, 3px apart, wrapping. The six control statuses: `st-other`, `st-part`, `st-sat`, `st-na`, `st-noev` (hollow), `st-noreq` (faint). The key is a wrapping row of a mark, the status and its count.

**Do**
- Keep the members in a fixed order (the catalog's), so a mark keeps its place between views.
- Count each status in the key, and make a count open the list at that status.
- Group by family in cards, the family's name a link, with "24 / 52 satisfied" beside it.

**Don't**
- A map never stands without the table of the same records one toggle away.
- No hue outside the status marks, and no second meaning for a colour.
- Don't let a mark be the only way to a control.
