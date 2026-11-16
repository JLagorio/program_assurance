# Sheet

A panel docked to the end edge over a scrim, for choosing records while the page stays behind it. Ledger parts: `<Sheet>` and the `PickerSheet` pattern built on it (static rendition, drawn in place inside a frame; the React parts are not bundled).

**When to use.** Choosing existing records to link, map or allocate: Map a requirement, Allocate requirements, Add to assessment campaign. Any other create or edit form is a Dialog, never a Sheet.

**What you write.** `<div class="k-blanket is-end">` > `<div class="k-sheet">` (520px, `s-lg` 720px, the full height of its frame, `--ds-elevation-surface-overlay`, `--ds-elevation-shadow-overlay`). Inside, reuse the dialog's parts: `k-dialog-head` with `k-dialog-title`, then a `k-toolbar`, a `k-table` of candidates with a `k-check` column, any one shared field, and `k-dialog-foot` with the count chosen, Cancel and the one primary.

**Do**
- Say what the choice applies in the primary, with its number: Map 2 requirements.
- Mark a row that cannot be chosen with a small badge that says why (Maps AC-2) and leave it unchoosable.
- Count what is chosen against the whole in the footer; past one page, offer Select all N there.
- Apply the whole choice in one request: all of it or none.

**Don't**
- A candidate's name is plain text inside a sheet: no preview can open beside the task.
- Don't say there is nothing to choose from while the candidates load or after they fail.
- Don't open a second sheet over a sheet.
