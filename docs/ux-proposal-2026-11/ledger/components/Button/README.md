# Button

A press that acts: the operation in a verb and its noun, in five variants and four heights. Ledger parts: `<Button>` and `<IconButton>` (static rendition; the React parts are not bundled).

**When to use.** For an action. Navigation is a TextLink, or a link drawn with the same classes when it must look like a button.

**What you write.** `<a class="k-btn is-primary">` (or `<button>`), with `is-primary`, `is-secondary`, `is-subtle`, `is-danger`, `is-danger-subtle` or `is-link`; heights `s-xs` 24, default 28, `s-md` 32, `s-lg` 36; `is-icon` for a square icon button, which needs an `aria-label`; a leading or trailing 16px Lucide icon inside. Disabled is `aria-disabled="true"`, never the `disabled` attribute.

**Do**
- One filled primary a surface: the page header's, a dialog footer's or a preview's record header's. A collection beside others creates through a secondary.
- Say the operation: Create task, Link requirement, Publish assessment results. Create makes a record; Add or Link connects an existing one.
- Keep a primary that cannot run in its place and say why beside it in a few words.

**Don't**
- Never OK, Submit or Save alone. No label on two lines.
- Don't use `is-danger` for anything but a destructive decision, and confirm it first.
- Don't put a button inside a link.

Primary is `--ds-color-background-brand-bold` with `--ds-color-text-inverse`; secondary is `--ds-elevation-surface-raised` inside a 1px `--ds-color-border-input` ring; disabled is `--ds-color-background-disabled` with `--ds-color-text-subtlest`, a real pair that sits under 4.5:1 by design.
