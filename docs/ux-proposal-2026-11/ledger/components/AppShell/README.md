# AppShell

The application frame every desktop screen sits in: a 48px top bar, a 228px side nav and Main. Ledger part: `<Shell>` with `Shell.TopNav`, `Shell.SideNav` and `Shell.Main` (static rendition; the React part is not bundled).

**When to use.** Once, as the root of a whole-screen mock. A part, a dialog or a strip does not draw it.

**What you write.** `<div class="lx k-app">` holding `<header class="k-topnav">` (`k-topnav-start` with `k-mark` and `k-app-name`, `k-topnav-middle` with `k-search`, `k-topnav-end`), `<nav class="k-sidenav">` (see SideNav) and `<main class="k-main">`. Main pads 16px 24px 32px and stacks its children 16px apart; `is-flush` removes both for a workspace or a split with a preview panel.

**Do**
- Start Main with one page header, then the body. Keep the six destinations in this order: Home, Programs, Registers, Business lines, Products, Library, with the account at the foot.
- Keep the top bar to the mark, "Program Assurance", Search or jump to… with ⌘K, help and the reader's avatar.
- Let Main be fluid: no pixel width on it or on its columns.

**Don't**
- Don't build a second root stack inside Main, and don't put a create button in the top bar.
- Don't recolour the regions: the side nav and the bar's start sit on `--ds-elevation-surface-sunken`, Main on `--ds-elevation-surface`, divided by `--ds-color-border`.

In this stylesheet the current destination is ink on `--ds-color-background-neutral` (the proposal's rule); shipped Ledger draws it with `--ds-color-background-selected`.
