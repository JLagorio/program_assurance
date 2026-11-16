# RadioGroup

One choice of a few, all visible at once. Ledger part: `<RadioGroup>` (static rendition; the React part is not bundled).

**When to use.** Two to five exclusive answers a reader should compare before choosing: Whole control or Chosen objectives; Adds or Removes. A long list of values is a select; a view switch is a ToggleGroup.

**What you write.** `<span class="k-radio">`: a 16px circle, `--ds-color-background-input` inside a 1px `--ds-color-border-input`. Chosen is `k-radio is-on`: a 5px ring of `--ds-color-background-selected-bold` around the input ground. The label follows 8px after; a hint for the group sits under it in `k-hint`.

**Do**
- Name the group with its field label (Objectives, Decision) and start with the answer most readers want already chosen.
- Lay two short answers on one line and longer ones down the page.

**Don't**
- Never leave a required group with nothing chosen and no reason.
- No radio for an on/off setting, and no more than about five answers.
