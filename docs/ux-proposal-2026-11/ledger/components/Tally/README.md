# Tally

The parts of one whole as a thin segmented bar, a segment a status. Ledger part: `<Tally>` (static rendition; the React part is not bundled).

**When to use.** A record's or a row's split by status where the shape matters more than each number: a program's 560 controls by control status. One quantity toward a whole is a Progress.

**What you write.** `<div class="k-tally">` > one `<i>` a part, sized by `style="flex: N"` with N the count, filled by a status class: `st-other` (`--ds-color-chart-danger`), `st-part` (`--ds-color-chart-warning`), `st-sat` (`--ds-color-chart-success`), `st-na` (`--ds-color-chart-sequential-2`), `st-noev` (a hollow `--ds-color-chart-neutral` outline), `st-noreq` (`--ds-color-background-neutral`). The bar is 6px, fully rounded, segments 1px apart on `--ds-color-chart-track`.

**Do**
- Order the parts the same everywhere, trouble first: Other than satisfied, Partially satisfied, Satisfied, Not assessed, No evidence, No requirement.
- Give the bar a name that says every part and its count, and a key of the statuses with their counts nearby.
- Put the share as a number before the bar in a row: "31%".

**Don't**
- Never the only way to the records: the table of the same records is one step away.
- No new colour for a status, no labels inside the segments, no bar taller than 8px.
