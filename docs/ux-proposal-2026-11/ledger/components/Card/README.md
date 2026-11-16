# Card

A bordered surface for one self-contained thing among its peers: a control family, a configuration, a short related list. Ledger part: `<Card>` (static rendition; the React part is not bundled).

**When to use.** A grid of like things a reader compares, or a short list beside a record. A page's sections are not cards: a Section has no frame.

**What you write.** `<div class="k-card">`: a 1px `--ds-color-border`, radius 10, `--ds-elevation-surface`, 16px padding, children 16px apart. `s-sm` pads 12 with 12px gaps. `is-flush` removes the padding and clips, for rows and `k-divider` hairlines that run edge to edge.

**Do**
- Title a card with the thing's name as a link when it opens somewhere.
- Lay cards in a grid that follows its own width, 16px apart.
- Numbers before prose: "24 / 52 satisfied", then the marks.

**Don't**
- No card inside a card, no shadow at rest, no coloured edge or accent stripe.
- Don't wrap a page's only table in a card.
