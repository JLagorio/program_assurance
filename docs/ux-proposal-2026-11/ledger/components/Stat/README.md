# Stat

A band of up to four numbers that say what needs attention, each a link to the register it counts. Ledger parts: `<Stat.Grid frame="band">` of `<Stat.Tile>` (static rendition; the React parts are not bundled).

**When to use.** Under a dashboard's or a focused view's header, before anything is listed. A record's Overview uses trays instead.

**What you write.** `<div class="k-statband">` > `k-stat` tiles in equal columns, divided by 1px `--ds-color-border` rules: `k-stat-label` (12/16 at 500, subtle), `k-stat-value` (22/28 at 600) and `k-stat-note` (12/16, subtle). A linked tile is an `<a class="k-stat">` and holds no other control.

**Do**
- Count one thing a reader acts on, and let the note name the part to look at first: "41 without an owner", "22 high or critical".
- Open the register on the tile's own question, so the 60 it counts are the 60 listed.
- Mute a zero. A count that cannot be read is the Absent mark (an em dash) over the note "Could not load".

**Don't**
- Never a zero because the read failed, never a percentage without its whole, never more than four tiles.
- No icon, sparkline or trend arrow in a tile, and no filler numbers.
