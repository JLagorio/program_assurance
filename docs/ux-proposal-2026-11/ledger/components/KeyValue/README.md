# KeyValue

Labelled facts of a record, a label a row: state, owner, identifiers, dates. Ledger part: `<KeyValue.Group>` with `KeyValue` rows, as the `Inspector` group named Details draws them (static rendition; the React parts are not bundled).

**When to use.** The Details rail beside a record's body, and the facts of a preview panel. Long authored text is a labelled paragraph in the body, not a value here.

**What you write.** `<dl class="k-kv">` with `<dt>` and `<dd>` pairs: a 104px label column in `--ds-color-text-subtle`, the value beside it, 5px of padding above and below each. `is-wide` gives labels of about twenty characters 148px. Values are text, a Badge, an Indicator, a DateLabel or a link.

**Do**
- Label in the product's words: Owner (not Owner party), Due, Control status, Objectives mapped.
- Write a count as a number out of its whole: 12 of 26.
- Draw a missing value as the Absent mark: an em dash in `c-subtle` whose name says what is missing (Not recorded, No owner, No due date).

**Don't**
- Never a blank or a hand-typed "Unassigned" for a missing value, and never a zero for a number that could not be read.
- No pixel width of your own on the label column; pick default or wide.
- Don't repeat the record's name as a fact.
