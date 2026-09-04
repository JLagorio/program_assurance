# Changelog

Semantic versions. A rename or a removed prop is a major step once the package reaches 1.0; until
then it is a minor step, and it ships with a deprecation the lint fixes (`ledger/no-deprecated-name`,
`ledger/no-deprecated-token`) wherever one is possible. Every entry names the story that shows it.

## 0.3.0 · 2026-09-04

### Breaking

- Button has no `warning` variant. An action that needs attention but is recoverable is `secondary`
  or `primary`; the warning is said in the dialog's text.
- IconButton takes its icon as `icon`; its children are only the `asChild` element. An element
  carrying `size-icon-*` inside a Button or an IconButton is a lint error (`ledger/button-icon-slot`);
  the icon goes in `iconBefore`, `iconAfter` or `icon`, passed bare, and the button sizes it.
- IconButton carries the kit's Tooltip itself. A Tooltip wrapped around one shows twice;
  `isTooltipDisabled` turns the built-in one off where the label is visible beside it.
  Components/Button "Icon buttons".

### Added

- Button `iconBefore`, `iconAfter`, `isLoading` (the spinner takes the icon's place, the label
  stays, clicks are ignored, focus is kept, `aria-busy`) and `isFullWidth`; IconButton `isLoading`.
  AlertDialog's confirm button is on `isLoading`. Components/Button "Icons", "Loading", "Full width".
- The page template. Every family page carries Anatomy, Variants, Sizes, States, Modifiers,
  Content, Style, Accessibility, Props, Related and Don't; `scripts/ds-check.mjs` lists the headings
  a page is missing and the families not yet walked are grandfathered in `scripts/ds-check.allow`.
  Components/Button is the first page on it; `Pair` in the stories library lays out a do beside a
  don't.
- Props tables come from the types: `react-docgen-typescript` in the Storybook config, so a union
  is a select, a JSDoc line is the description and a default is read from the signature. Button,
  IconButton, TextLink and ButtonGroup carry `<ArgTypes>`; every file comment is a JSDoc block.
- Tokens pages: Color (with elevation and opacity), Typography, Space, Shape, Metrics, Motion, in
  place of the four guides under `docs/guides`. Guidance/Lint rules lists every rule.
- The accessibility gate: `npm run test:a11y` runs axe on every `*Matrix` story in a headless
  Chromium (`@storybook/addon-vitest`) and fails on a violation; CI runs it after the package tests.
- `Popover` takes `label`, the dialog's accessible name. `Progress` takes `label`; without one the
  bar is decorative and hidden, the number beside it carries the value. `CodeBlock` takes `label`.

### Fixed

What the gate found on its first run: `KeyValue` is its own definition list, so it is valid wherever
it sits (the Inspector's wrappers are plain containers); `Command.Separator` is presentational, since
a listbox may not contain a separator; the days inside a Calendar range read in the default text
colour; a Stepper's marker button carries the step's name; `CodeBlock` and `ScrollArea` scroll
regions take keyboard focus; `PageSkeleton` is a status region.

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
