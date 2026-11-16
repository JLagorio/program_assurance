# Kbd

A key or a shortcut, drawn as a small keycap. Ledger part: `<Kbd>` (static rendition; the React part is not bundled).

**When to use.** Beside the control a shortcut drives: ⌘K in the top bar's search, Esc in a hint.

**What you write.** `<span class="k-kbd">K</span>`, one element a key, 4px apart in a `row g-050`. A cap is 16px tall, at least 20px wide, 11/14 at weight 500, on `--ds-elevation-surface-sunken` inside a 1px `--ds-color-border`, text in `--ds-color-text-subtle`. The top bar's search is `k-search`: 340px wide, 32px tall, the placeholder, then the caps.

**Do**
- Use the platform's glyphs: ⌘, ⇧, ↵, Esc.
- Show only shortcuts that work on the surface the reader is on.

**Don't**
- Don't write a shortcut as plain text in a sentence, and don't use a cap as a button.
