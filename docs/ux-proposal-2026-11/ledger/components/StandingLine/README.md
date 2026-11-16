# StandingLine

Determinations as one small bar: in a table cell with its N of M, or as one 36px line where a record has no chain line. Proposed in the November 2026 UX proposal; not in the package (shipped Ledger has `Tally`).

**When to use.** A product, a configuration or a component whose standing is a count of determinations: in a register's row, and under the header of a record that has no assurance chain of its own.

**What you write.**
- The bar: `<span class="nx-standbar">` (96px, `s-lg` 160px, 8px tall) > one `<i>` a determination, sized by `style="flex: N"`, filled by the `m-` marks, satisfied first: `m-sat`, `m-part`, `m-other`, `m-na`, then `m-noreq` for controls with no requirement.
- In a cell: `<span class="nx-stand">` > the bar, then `<b>161</b> <span class="of">of 223</span>`.
- As a line: `<div class="nx-standline">` > the total (`<b>54</b> controls`), an `s-lg` bar, each count as an `nx-det` (`<b>44</b> satisfied`), and `nx-standline__end` for who judged it and when.

**Do**
- Lead with the satisfied count out of the whole; the bar repeats it as marks.
- Keep the fills the same as every other mark in the product.

**Don't**
- Not beside a ChainLine: a surface has one or the other.
- No bar without its number in a cell, and no label inside the bar.
