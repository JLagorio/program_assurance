# ShellIconRail

The shell with its side nav minimized to a 56px rail of destination icons and the account avatar. Ledger part: `<Shell collapsedSideNav="icons">` (static rendition; the React part is not bundled).

**When to use.** A workspace or a wide register that needs the room: the destinations stay one press away and the current one stays marked.

**What you write.** The AppShell markup with `is-rail` added to the root: `<div class="lx k-app is-rail">`. The rail hides the app name, the labels and the profile's text; every `k-nav-item` keeps its icon.

**Do**
- Give every top-level destination an icon, and keep the current one marked with `aria-current="page"`.
- Keep the app mark in place; the expand control appears over it.

**Don't**
- Don't remove destinations to make the rail shorter, and don't add labels under the icons.
- Don't use the rail on a phone: there the nav is an overlay (see PhoneFrame).
