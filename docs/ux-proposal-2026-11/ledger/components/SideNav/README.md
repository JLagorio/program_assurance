# SideNav

The side navigation's own parts: a destination, the current one, a count, a section heading, a sub-item and the account at the foot. Ledger part: `Shell.SideNav` with its items, sections and footer (static rendition; the React part is not bundled).

**When to use.** Inside AppShell, for the top-level destinations and the reader's account. A view inside a record is a tab, never a nav item.

**What you write.** `<nav class="k-sidenav">` > `k-nav-body` > `k-nav-section` > `<a class="k-nav-item">` with a 16px Lucide icon and the label; `aria-current="page"` marks the current one; a trailing `k-count` is pushed to the end; `k-nav-heading` names a section; `k-nav-sub` indents an item under the one above. The foot is `k-nav-footer` > `k-profile` (a `k-avatar`, the name, the role).

**Do**
- One icon a destination, labels in sentence case, 28px rows, 2px apart.
- A count only for work that waits on the reader; at most three counts in the nav.
- Put Sign out last in the account menu, never in the list.

**Don't**
- Don't mark more than one item current, and don't use a hue for the current item.
- Don't list a diagnostic tool (the schema inspector) as a destination.

In this stylesheet the current item is ink on `--ds-color-background-neutral` (the proposal's rule); shipped Ledger draws it with `--ds-color-background-selected` and `--ds-color-text-selected`.
