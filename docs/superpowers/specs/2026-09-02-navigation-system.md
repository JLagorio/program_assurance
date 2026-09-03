# The navigation system

2026-09-02. The shell rebuilt as a navigation system on Atlassian's grammar, after Josef said the
design system will serve several internal products. The parts document themselves in Storybook
(Patterns/Shell); this records the decisions and what was left out.

## What changed the shape

- **Several products, one brand.** They share the token set and the behaviour. Each brings its own
  name and mark (`Shell.AppLogo`), never its own colours. Atlassian's per-product top nav theme is
  therefore not built.
- **Atlassian's grammar for the shell.** Josef's call. The frame is the one layer every product
  shares literally, so its names should be the ones other teams already read: Banner, TopNav with
  Start, Middle and End, SideNav with Header, Body and Footer, Main, Panel.
- **The Panel is an area, not a feature.** Josef's call: the preview is not part of the shell. The
  shell renders the area beside the page when the product mounts it; what goes in it is the
  product's. The shell is extensible by its slots, not by knowing what fills them.
- **The peek is a Sheet; the panel is the rail on demand.** Josef's clarification: the preview
  slides over the page and the nav to about half the screen and stays a Sheet. The panel is where
  a record's rail goes when the reader asks for it: every Inspector group, opened from a trigger in
  the record header, staying open across tabs. The `Panel` pattern is that surface.

## Decisions

1. **Root and areas.** `Shell` is a grid of named areas in a fixed order, which is also the keyboard,
   landmark and skip-link order. The banner and the top nav stick to the top; the side nav and the
   panel stick under them and scroll inside themselves; main uses the body scroll, as before. An
   area that is not rendered takes no column. Widths are CSS variables the root sets from its
   state, so the areas are pure CSS and nothing is measured.
2. **The expanded and collapsed pictures.** While the side nav is expanded, the top nav's start slot
   takes the side nav's width and surface, so the logo heads that column and the side nav reads
   full height; the toggle moves to the slot's end. Collapsed, the toggle comes first and the middle
   slot centres. These are Atlassian's two diagrams, produced by the slot's width alone.
3. **Side nav behaviour.** Collapse and expand from the toggle, from `useSideNav()` in product code,
   or from Ctrl+[ when `sideNavShortcut` is on at the root (off by default, ignored while a dialog
   is open). Flyout on hovering the toggle while collapsed. Resize from `SideNav.Splitter`, 200px to
   half the viewport, arrow keys 16px, double-click collapses, `onResizeEnd` for persistence, the
   width surviving a collapse. Below the large breakpoint it opens over the page behind a scrim,
   at most 90% wide, Escape or the scrim closes it.
4. **Top nav slots.** Start holds the toggle (a slot, as Atlassian's `sideNavToggleButton`), the app
   switcher and the logo; the logo's name and secondary name hide below the large breakpoint.
   Middle holds the search first, then the create action. End is a list; below the medium
   breakpoint it folds into one More button whose popover holds the same items.
5. **Banner.** An area and a component. The area is fixed height and pushes everything down while
   it is mounted. The component is one line, one at a time, never dismissible, with one action
   drawn in its own colour. Alert stays inline; Banner is the screen's.
6. **Tokens.** `dimension.layout.sidenav` (228) and `topnav` (48) replace `sidebar` and `topbar`,
   which are deprecated and still emitted; `banner` (48) and `panel` (320) are new. The build maps
   the height ones to `h-` utilities. The defaults are sign-off values.
7. **Deprecation ships in the package.** The old frame (`Shell` with `sidebar` and `topBar`,
   `Shell.Sidebar`, `TopBar`, `Brand`, `NavGroup`, `NavItem`, `User`) still renders, unchanged, from
   `src/shell/legacy.tsx`. `ledger/no-deprecated-name` names the replacement for each, alias-aware,
   and fixes the four one-to-one renames with their prop renames; it is an error in the package
   and a warning for consumers until the prototype's cutover, then an error. This is the policy for
   every rename from the second consumer on: the alias map in a consumer's own lint was the
   one-consumer shortcut.

## Left out, on purpose

- The flyout does not lock open while a popover inside it is open (Atlassian's does). Listed in
  `docs/next.md` under Kit.
- The middle slot does not centre in the viewport at the extra-large breakpoint.
- No `MainStickyHeader`: the ActionBar and the sticky rail already compute their offsets from the
  header (`--shell-top`), so a banner does not push a sticky part under the top nav.
- No flyout menu items or hover actions on side nav items; one level of expandable rows is
  enough for fourteen items in four groups. Atlassian's side nav items have moved to their own
  package and would be the model when a product needs more.
- No per-product theming of the top nav.

## The prototype's cutover

On Josef's go: `eslint --fix` on `src/components/app/shell.tsx` does the four renames; the sidebar
and the top bar are restructured by hand into `Shell.SideNav` and `Shell.TopNav` with the brand in
`TopNav.Start`; then `legacy.tsx` and the deprecated tokens go, and the lint rule becomes an error
for consumers. Moving a record page's rail into the panel on demand is a call per page; the
PreviewRail beside the index tables and the PreviewSheet stay as they are.
