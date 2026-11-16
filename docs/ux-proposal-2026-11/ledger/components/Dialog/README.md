# Dialog

A modal surface over a scrim for one create or edit task, and its smaller form for a decision that must be confirmed. Ledger parts: `<Dialog>` (`DialogContent`, `DialogBody`, `DialogFooter`) and `<AlertDialog>` (static rendition, drawn in place inside a frame; the React parts are not bundled).

**When to use.** Every create and edit form in the product, titled with the operation and the singular noun. A destructive or irreversible decision, a dirty dismissal and a route change away from a draft go through the confirmation.

**What you write.** `<div class="k-blanket">` (the scrim, `--ds-color-blanket`, filling its positioned parent) > `<div class="k-dialog">` (560px, `s-lg` 760px, radius 12, `--ds-elevation-surface-overlay`, `--ds-elevation-shadow-overlay`) > `k-dialog-head` with `k-dialog-title` (17/24 at 600), `k-dialog-body` (the one scrolling region, fields 16px apart) and `k-dialog-foot` (Cancel as a subtle button, then the one primary).

**Do**
- Trigger, title and primary say the same words: Create task. Create makes a record; Add or Link connects an existing one.
- Cancel before the primary, both at 32px. The primary of a destructive decision is `is-danger` and repeats the verb.
- Put a failed save in an Alert at the top of the body and keep the draft.
- Ask before a dirty close; the safe action is Keep editing.

**Don't**
- Never OK or Submit, never a pixel width of your own, never a sheet for a form.
- Don't stack a second independent workflow over a dialog; only a confirmation may open over it.
- Don't disable the primary to signal a missing field: validate on submit and mark the field.
