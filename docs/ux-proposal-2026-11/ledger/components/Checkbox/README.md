# Checkbox

A box that chooses one thing among several, or a row of a table. Ledger parts: `<Checkbox>` and `<CheckboxGroup>` (static rendition; the React parts are not bundled).

**When to use.** Several choices at once from a short list the reader should see whole, and row selection in a register or a picker. One choice of a few is a RadioGroup.

**What you write.** `<span class="k-check">`: 16px, radius 3, `--ds-color-background-input` inside a 1px `--ds-color-border-input`. Chosen is `k-check is-on` with a 12px `check` icon inside, filled `--ds-color-background-selected-bold` with the mark in `--ds-color-text-inverse`; a header whose page is partly chosen holds a `minus`. The label follows 8px after, as body text.

**Do**
- Label each box with the thing it chooses, in the source's own words.
- In a table the checkbox alone chooses the row; the name still opens the record.
- Name a row's box for its record: "Select Risk arising from REQ-008".

**Don't**
- No checkbox for a setting that applies at once: that is a switch.
- No box without a label, and no `disabled` attribute in a mock.
