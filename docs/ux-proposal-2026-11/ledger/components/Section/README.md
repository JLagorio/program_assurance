# Section

A titled block of a record body: a heading, an optional count and one small action, then its content with no frame. Ledger part: `<Section>` (static rendition; the React part is not bundled).

**When to use.** A record body or a preview that holds several distinct collections or texts. A tab whose only content is a collection has no Section: the tab already names it.

**What you write.** `<section class="k-section">` > `k-section-head` (at least 28px: `<h2 class="k-section-title">` at 15/22 600, an optional `k-count`, then `k-section-actions` pushed to the end) and the body 8px under it.

**Do**
- Give a collection's create action as a small secondary in `k-section-actions`; the surface keeps its one primary elsewhere.
- Count rows with the section's `k-count`, never in a sentence.
- Put provenance, counts and derivation in a collapsed Details section.

**Don't**
- A section's description is an instruction or an authored definition, never a computed sentence.
- No second h1, no card around a section, no heading over a tab's only table.
