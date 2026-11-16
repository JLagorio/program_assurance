# Tray

A counted group on a tinted ground: a heading that is the count, over one line a part, worst first. Ledger parts: `<Tray>` with `Stat.List` and `Stat.Row` (static rendition; the React parts are not bundled).

**When to use.** At the top of a record's Overview, to say where the record stands before it lists anything: open tasks by status, open operational issues by severity, open risks by status.

**What you write.** `<div class="k-tray">` (radius 12, `--ds-elevation-surface-tray`, 6px padding) > `k-tray-head` (15/22 at 600: the count and its noun, a link to the tab that holds them) and `k-statrow` lines (40px, `--ds-elevation-surface` inside a 1px `--ds-color-border`, radius 6: the label, then `<b>` the number).

**Do**
- The heading counts what the rows split: "43 open issues" over Critical 2, High 11, Moderate 23, Low 7.
- Tone a row only where the value itself is a problem (a blocked task, a critical or high issue). Mute a zero. The stylesheet has no class for either: this preview sets the number in `--ds-color-text-danger` and a zero row in `--ds-color-text-subtlest`.
- Make each line open the register asked for exactly those records; a zero opens nothing.
- Lay trays side by side in one grid that follows its own width.

**Don't**
- Never draw a zero because a count could not be read: the heading says Could not load.
- No prose in a tray, and no tray inside a card.
