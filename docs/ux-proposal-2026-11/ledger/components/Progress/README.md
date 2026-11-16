# Progress

How far along one thing is: a labelled 4px bar with its count beside the label. Ledger part: `<Progress>` (static rendition; the React part is not bundled).

**When to use.** One quantity moving toward a known whole: gates completed, controls determined, bytes of an upload. Several parts of one whole are a Tally.

**What you write.** A `col g-075` holding the label row (`k-label` and the count in `c-subtle`) and `<div class="k-progress"><i style="width: 73.7%"></i></div>`. The track is `--ds-color-background-neutral`, the fill `--ds-color-background-brand-bold`, both fully rounded.

**Do**
- Always label the bar and say the count in words beside it: "Gates completed", "14 of 19".
- Use the measured share for the width; an empty bar is a real zero.

**Don't**
- No bar without its number, no percentage alone, no tone on the fill.
- Not for a status: a bar says how much, a Badge says what.
