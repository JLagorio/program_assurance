# Changelog

Semantic versions. A rename or a removed prop is a major step once the package reaches 1.0; until
then it is a minor step, and it ships with a deprecation the lint fixes (`ledger/no-deprecated-name`,
`ledger/no-deprecated-token`) wherever one is possible. Every entry names the story that shows it.

## 0.5.0 · 2026-09-04

### Breaking

- `size` on `Input` and `NativeSelect` is the kit's height, `small` (28px) or `medium` (32px),
  in place of the HTML attribute. A toolbar's select that took `h-control-small` by class, which on
  NativeSelect landed on the wrapper and never sized the select, passes `size="small"`.
  Components/Input, Components/NativeSelect.
- `Field` renders a `div` holding a `label` (the label text and the control) and, outside the
  label, the hint or the error. The hint or error is the control's description (`aria-describedby`),
  not part of its name; `isRequired` sets `aria-required` on the control. Styling that reached into
  the old single `label` changes. Components/Field, Components/Input.

### Changed

- `color.border.input` is lighter: `neutral.400` in light, `darkNeutral.500` in dark, below 3:1 by
  decision. The label, the fill and the focus and danger borders identify a field; the contrast test
  holds the rest border above a floor. Every field control, the Checkbox box and the RadioGroup dot
  take it. Components/Input.
- `Textarea`, `NativeSelect` and `InputGroup` are on the template, walked against Carbon's Text input
  and Select, Base Web's Textarea, Select and Input, and Atlassian's Textarea and Select. Said on the
  pages and not built: no character counter, no borderless or multiple select, no read-only select,
  no clear button, no button inside a field, no attached segment.
- The record's rail is the ShowPage's again. `rail` on `ShowPage` renders it beside the body, under
  the tab strip, on the overview tab; every other tab runs full width. The shell's Panel area holds
  the detail of a selected row and the panels a reader opens, never the rail. Patterns/Pages "Show",
  Shell "Record rail".
- Disclosure's trigger row: the title sits flush with the body under it, semibold so it reads as a
  section, the count after it, the chevron at the end, down while closed and up while open. In a
  rail the title lines up with the labels beneath it. Components/Collapsible, Components/Accordion.
- `grid-cols-main-rail` gives the rail column `dimension.layout.rail` plus the inset its rule takes,
  so the rail's content is the token wide, the width the panel gave it.

### Fixed

- An InputGroup's leading icon was painted over by a NativeSelect inside it; the ends render after
  the control. Components/InputGroup.
- `controlBase` no longer carries a height; `controlHeight[size]` does, so the Select, Combobox and
  DatePicker triggers say `medium` and a Textarea no longer overrides a height it never wanted.
- `KeyValue` had lost its label column to a codemod (`px minmax(0, 1fr)`), so every rail row stacked
  its label over its value. The label column is `labelWidth` again. Shapes/Inspector "Inspector
  groups".
- `font-medium` and `font-semibold` beside a type utility never applied: `font-body` and the
  heading utilities set the `font` shorthand and landed after the weight utilities, so a Section
  title, a tab or a disclosure header written `font-body font-medium` rendered regular. The
  generated type utilities now repeat the weight as a longhand read through Tailwind's
  `--tw-font-weight`, so a weight utility beside them wins in either order; the 46 `font-medium`
  in the kit and the prototype's show as written. Tokens/Typography.

### Added

- `InputGroup` has typed props with descriptions. Its ends are hidden from screen readers, so the
  label or the hint carries the unit in words. `Input` hides the browser's clear control on
  `type="search"`; Escape clears. Components/InputGroup.
- One page per part. Every part a product imports by name has its own story file and page, the way
  Atlassian, Carbon and Base Web document; compound parts stay with their parent; Forms, Overlays,
  Pages, Shapes and Primitives keep an overview that says which part to reach for. The sidebar
  gains Patterns, Shapes and Shell sections. Input and Field are on the template after Button,
  IconButton and TextLink; the rest carry their prose and a generated props table until walked.
- `Input` has a read-only look (`readOnly`: the sunken surface, no hover), and the contrast test
  covers the field's borders against the input surface.

## 0.4.0 · 2026-09-04

### Added

- `DataTable` (Patterns/Data table): TanStack Table 9 through `useDataTable`, columns by kind through
  `defineColumns` (`id`, `text`, `number`, `date`, `status`, `person`, `custom`, `actions`, `group`),
  sorting, search, pagination and the empty, loading and error states. `DataTable.SelectionBar`
  with select-all-pages, `.Filter` chips from a column's facet or range, `.Search`, `.Presets` with
  counts, `.Columns`. Pinned, resizable, reorderable and hideable columns and column groups; the
  reader's order, widths, visibility and pins persist per `view` in localStorage with Reset view.
  Tree mode with the treegrid keyboard, detail rows, groups, pinned rows, footer totals and row
  reordering by handle; virtual scroll, server mode, `toRows` and `toCsv`; text and status cells
  that edit in place. The spec and its calls: `docs/superpowers/specs/2026-09-03-data-table.md`.
- Density (Components/Mode switch): `DensityProvider`, `DensitySwitch`, `useDensity`,
  `densityScript` and `readDensity`/`writeDensity`. Default and compact row density, stored, applied
  before the first paint like the colour mode.
- Dependencies: `@tanstack/react-table`, `@tanstack/react-virtual`, `@dnd-kit/core`, `sortable`,
  `modifiers` and `utilities`.

### Notes

- The Data table page is not yet on the page template; its eleven sections are grandfathered in
  `scripts/ds-check.allow` and the family joins the maturity walk.
- This version rejoins two lines of work made in parallel from 0.1.0: the navigation system, the
  panel and the Button walk on one, the data table on the other. Where both implemented the same
  feature, the first line's version stands.

## 0.3.0 · 2026-09-04

### Breaking

- Button has no `warning` variant. An action that needs attention but is recoverable is `secondary`
  or `primary`; the warning is said in the dialog's text.
- IconButton takes its icon as `icon`; its children are only the `asChild` element. An element
  carrying `size-icon-*` inside a Button or an IconButton is a lint error (`ledger/button-icon-slot`);
  the icon goes in `iconBefore`, `iconAfter` or `icon`, passed bare, and the button sizes it.
- IconButton carries the kit's Tooltip itself. A Tooltip wrapped around one shows twice;
  `isTooltipDisabled` turns the built-in one off where the label is visible beside it.
  Components/IconButton.

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
