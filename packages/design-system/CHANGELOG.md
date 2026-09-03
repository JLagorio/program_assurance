# Changelog

Semantic versions. A rename or a removed prop is a major step once the package reaches 1.0; until
then it is a minor step, and it ships with a deprecation the lint fixes (`ledger/no-deprecated-name`,
`ledger/no-deprecated-token`) wherever one is possible. Every entry names the story that shows it.

## 0.2.0 · 2026-09-03

### Breaking

- The shell is a navigation system on Atlassian's grammar: `Shell` with `Banner`, `TopNav`
  (`Start`, `Middle`, `End`), `SideNav` (`Header`, `Body`, `Footer`, `Section`, `Item`,
  `Expandable`, `ToggleButton`, `Splitter`), `Main`, `Panel` (`Splitter`); `AppLogo`,
  `AppSwitcher`, `Profile`; `useSideNav`. `Shell.Sidebar`, `TopBar`, `Brand`, `NavGroup`,
  `NavItem` and `User` are gone; the lint names each replacement and fixes the one-to-one renames.
  Patterns/Shell.
- `ShowPage` no longer takes `rail` or `showRail`: the rail is `Shell.Panel` with `Panel flush`
  inside, rendered by the route. Patterns/Pages, Patterns/Shell "Record rail".
- Layout tokens: `dimension.layout.sidenav`, `topnav`, `banner`, `panel` replace `sidebar` and
  `topbar`.
- The shell's `PanelProps` type is `ShellPanelProps`.

### Added

- `Banner` (Components/Status). `Panel` and `Panel.Trigger` (Patterns/Pages). `PreviewSplit`,
  `CommandPalette` with `useCommandPalette`, `RecordPicker` (Patterns/Pages). `useRequired`
  (Components/Controls "Required on submit"). `useSort` and `usePage` (Components/Table "Sorted
  and paged"). `Inspector` reads the panel it is in; `Accordion.Item` and `Collapsible` take
  `inset`.
- The shell remembers itself: `persist` on the root, `shellScript` for the document head.
- `ledger/cell-plain`, `ledger/id-not-blue` and `ledger/no-kit-shadow` in the `recommended`
  preset, moved in from the first consumer's own config.

## 0.1.0 · 2026-09-02

The package: tokens, primitives, components, patterns, shapes, the first shell, the mode switch,
the lint plugin, the story ratchet and the publishable build.
