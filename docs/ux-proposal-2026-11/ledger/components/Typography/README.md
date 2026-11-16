# Typography

The type classes of the stylesheet: one figure, four heading sizes, body, small, extra small, the caps label and code, all in Geist. Ledger parts: `<Heading>` (sizes `page`, `overlay`, `section`) and `<Text>` (static rendition as CSS classes; the React parts are not bundled).

**When to use.** Any text a part does not already set. A part's own title (PageHeader, Section, Dialog) comes sized: do not restyle it.

**What you write.** Everything under `.lx` is body, 13/18 at 400 with tabular numerals. Classes: `t-figure` 32/40 600 (the one loud fact of a surface; `.of` inside it is the quiet "of 560"), `k-title` or `t-page` 24/30 600, `t-small-h` 20/26 500, `t-overlay` 17/24 600, `t-section` 15/22 600, `t-body-l` 15/22, `t-small` 12/16, `t-xsmall` 11/14, `t-label` 11/14 500 caps in `--ds-color-text-subtle`, `t-code` or `mono` 12px Geist Mono. Weights `w-400` `w-500` `w-600`. Colour: `c-text`, `c-subtle`, `c-subtlest`, `c-danger`, `c-warning`, `c-success`, `c-info`, `c-brand`.

**Do**
- Sentence case everywhere; the caps label is the one exception and is set by its class.
- One `t-figure` a surface. Numbers before prose: "174 of 560", never "31% satisfied (174 of 560)".
- Secondary text is `c-subtle` (`--ds-color-text-subtle`); `c-subtlest` is for marks and placeholders, not for sentences.

**Don't**
- No font size outside this ramp, no letter-spacing of your own, no italics for emphasis.
- Don't use a status colour for text that states no status.
