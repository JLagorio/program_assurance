# Field

A labelled control in a form: the label, the box, and a hint or an error under it. Ledger parts: `<Field>` around `<Input>`, `<Textarea>`, `<Select>`, `<Combobox>`, `<DatePicker>` and `<SearchField>` (static rendition: boxes drawn with their values, no input behaviour; the React parts are not bundled).

**When to use.** Every control in a create or edit dialog, and the search of a toolbar.

**What you write.** A `col g-050` holding `<span class="k-label">` (12/16 at 500), `<span class="k-field">` and an optional `<span class="k-hint">` (12/16, `--ds-color-text-subtle`). The box is 28px (`s-md` 32px in a form), radius 6, `--ds-color-background-input` inside a 1px `--ds-color-border-input`; `is-area` is a text area at least 72px tall; `is-search` is 220px with a leading `search` icon. A select, a combobox or a date ends in a 14px `chevron-down` or `calendar-days` icon. A placeholder is `c-subtle`.

**Do**
- Label with the product's noun: Owner, Due date, Rationale. A day is a date picker, never free text.
- Say why a choice waits on another answer in its hint ("Choose a system first.") and keep it reachable.
- Show a value the context fixes as labelled text instead of a field.
- Count characters under a long text, and say what fixes an error under its field.

**Don't**
- No placeholder that says "optional", no placeholder in place of a label.
- No `<input>` in a mock, and no `disabled` field without its reason.
- Don't cut a paste at a length limit without a word.
