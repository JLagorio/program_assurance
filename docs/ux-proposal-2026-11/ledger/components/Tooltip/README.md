# Tooltip

A short label that appears on hover and on keyboard focus: the name of an icon button, the whole of a cut name, the reason a control cannot run. Ledger part: `<Tooltip>` (static rendition, drawn open under its trigger; the React part is not bundled).

**When to use.** Only for words the control already carries for assistive technology: an icon button's name, a truncated value, a `disabledReason`.

**What you write.** `<span class="k-tooltip">`: 12/16 text in `--ds-color-text-inverse` on `--ds-color-background-neutral-bold`, 4px 8px padding, radius 6, placed 4px from its trigger.

**Do**
- Repeat the control's accessible name exactly: Close Operational issue preview.
- Keep it to one short line; a shortcut may follow the label.
- Show the whole of a name that a cell cuts with an ellipsis.

**Don't**
- Never the only place a fact lives: a touch screen has no hover.
- No tooltip on text that is not cut, and no interactive content inside one.
