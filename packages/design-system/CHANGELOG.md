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
- `Progress.Stacked` takes `size` (`small` 4px, `medium` 6px, `large` 8px, the default) in place
  of `height` in pixels; `Progress` takes the same scale with `medium` as its default. The ten
  prototype bars that passed 4 or 6 pass `small` or `medium`. Components/Progress: Matrix.
- `Tiles` is `Stat.Grid`; the old name stays exported and `ledger/no-deprecated-name` says so.
  Components/Stat.

- A `DropdownMenu.Item` with `isSelected` is a menuitemcheckbox (Radix CheckboxItem) with
  `aria-checked`, drawn as Select draws its choice: selected text and a check at the end, no
  fill. Before it was a plain menuitem with a fill, so a screen reader heard nothing about the
  state of a toggle. Editable's status menu and the DataTable's Columns menu take the new face.
- `FilterChip` says `aria-pressed` when it stands alone and defers to a Popover's
  `aria-expanded` as its trigger; the plus shows only while the chip is off; `disabled` has a
  face (`color.border.disabled`, `color.text.disabled`). Components/FilterChip: InToolbar, Dont.
- A sortable header's chevron shows on keyboard focus as well as hover, per Carbon's note that
  nothing else says a table sorts.
- Pagination's page buttons are named "Page 6" and the gap is hidden from a screen reader.
  Components/Pagination: Paged, Dont, Playground.
- The choice controls and the Forms overview are on the template, walked against Carbon's Checkbox,
  Radio button, Toggle and Forms pattern and Base Web's Checkbox, Radio and FormControl. `Checkbox`,
  `Switch` and `RadioGroup` have typed, described props, so their tables generate; a choice's
  control and label top-align, so a label that wraps runs under its own first line. Said on the
  pages and not built: no state text beside a Switch, no small choice controls, no read-only choice.
  Components/Checkbox, Components/RadioGroup, Components/Switch, Components/Forms.
- `Select`, `Combobox` and `DatePicker` take `size`, and take `aria-invalid`, `aria-required` and
  `aria-describedby` from the Field, so a picker inside a Field is described by its hint and turns on
  its error the way an Input does; `DatePicker` accepts `aria-required` and does not render it, since a
  button may not carry it. `DatePicker`'s placeholder is "Choose a date". Components/Select,
  Components/Combobox, Components/DatePicker.
- The four pickers are on the template, walked against Carbon's Dropdown and Date picker, Base Web's
  Select and Datepicker, and what Atlassian publishes of Select and DateTime picker. Said on the pages
  and not built: no multi-select, no creatable option, no typed entry in the date field, no time, no
  month or year menus in the caption. Components/Calendar.
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
- `Alert` draws its action in its own text colour, underlined, as the Banner does. The first run
  of the gate on the new matrix found a brand-blue link on the neutral fill at 4.49:1. Components/Alert.
- `Progress.Stacked` speaks: with `label` it is an image named by its segments' titles, or a group
  of buttons when the segments click; a clickable segment is named by its title. Without a label it
  stays hidden and the counts beside it carry the values. Components/Progress: Stacked.
- `Gates.Item` says "Met" or "Not met" before its label to a screen reader; the check and the Dot
  are hidden, so nothing is said twice. Components/Gates.
- Alert, Banner, Progress, Stat and Gates are on the template, walked against Carbon's Notification
  and Progress bar (usage, style, accessibility), Base Web's Banner, Notification, Toast and
  ProgressBar, and Atlassian's Banner, SectionMessage and ProgressBar as known. Every prop of the five
  is typed and described, so five more generated tables fill, and the compound parts (`Stat.Tile`,
  `Stat.Grid`, `Progress.Stacked`, `Gates.Item`) have their own. Said on the pages and not built:
  a dismiss on an Alert, an icon per tone, a success or neutral Banner, high and low contrast, an
  indeterminate bar, a stepped bar, a label above and helper text below a bar, a status icon, a trend
  on a Stat, a tinted tile. Components/Alert, Components/Banner, Components/Progress, Components/Stat,
  Components/Gates.
- A zero Stat reads muted whether it is the number 0 or the string "0"; the prototype's template
  literals were slipping past. Components/Stat: Matrix.

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

- `Dialog` takes `eyebrow` (the record's id and status above the title, as Sheet has) and
  `pending` (holds the dialog while the caller saves: Escape, the blanket and the close do
  nothing and the close is disabled, as AlertDialog already did). Every prop of Dialog, Sheet,
  Drawer and AlertDialog is described, so their generated tables fill.
- Pages on the template: Dialog, Sheet, Drawer and AlertDialog, each with a Matrix of states one
  click away (an open overlay covers the page), an Open story held open for the a11y gate and
  the screenshots, a Dont of button pairs, and a Playground. The Overlays overview is rewritten:
  which one, the anatomy the eight share, focus and closing, stacking, where each opens from;
  a Stacked story shows the one stack allowed, an AlertDialog over a Sheet. Twenty-eight pages
  on the template; 641 gaps grandfathered.
- `TooltipProvider`: one provider for a product, so moving from one tooltipped control to the
  next shows the next tooltip at once (Carbon's and Atlassian's behaviour). The Shell mounts it
  and the Storybook preview wraps every story in it; a Tooltip with no provider above makes its
  own, as before. Tooltip, HoverCard and Popover props are described, so their tables fill.
- `DropdownMenu.Item` takes `tone="danger"` (red, red-tinted highlight) for the verb that
  removes or closes something; the DataTable's row actions use it in place of a coloured span.
  `DropdownMenuItemProps` exported. Components/DropdownMenu: Kebab, Toggles, Dont, Playground.
- Pages on the template: Tooltip (IconButtons, Open, Dont, Playground), HoverCard (On an id,
  Dont, Playground), Popover (Task, Options, Dont, Playground), DropdownMenu. Twenty-four pages on
  the template; 681 gaps grandfathered.
- `Table` takes `label` (its accessible name, which Carbon asks of every table) and a typed
  `role`; `TableProps` and `TdProps` are exported, so the generated props tables fill. A cell
  whose child is a plain string carries it as its `title`, so truncated text shows whole on hover,
  as the data-table spec promised. Components/Table: Frame, Dont and Playground stories.
- `ToolbarProps`, typed and described; the search field is `type="search"` at `size="small"`
  and named by its placeholder through `aria-label`. Components/Toolbar: Live, Dont, Playground.
- Pages on the template: Table, Pagination, Toolbar, FilterChip and Data table (its prose kept
  under the eleven headings; the Kinds table is Content, the hook's options are Modifiers).
  Twenty pages on the template; 721 gaps grandfathered.
- `Field` takes `isGroup`: a fieldset with the label as its legend over a RadioGroup or several
  Checkboxes, the hint or the error describing the group, and a RadioGroup inside taking
  `aria-invalid` and `aria-required`. `Checkbox`, `Switch` and `RadioGroup.Item` take
  `description`, a second line under the label read as the control's description; the wizard's
  hand-built two-line labels moved onto it. `RadioGroup` takes `orientation`. Components/Field,
  Components/Checkbox, Components/RadioGroup.
- `DatePicker` has Today and Clear under the month, so an optional date can be emptied; before, the
  only way was a second click on the chosen day. `Combobox` and `DatePicker` take `defaultOpen`.
  `Popover` takes `matchTriggerWidth`, and a Combobox's list is as wide as its field instead of 280px.
  `Select.Item` and `Select.Group` have typed, described props. Components/DatePicker,
  Components/Combobox, Components/Popover.
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
- `Alert` takes `action`: the one TextLink or link Button that resolves it, under the body, as
  Carbon's actionable notification and Atlassian's section message have. Components/Alert: Matrix,
  Placement, Dont.
- `Progress` takes `showValue` and `valueText`: the number after the bar in small subtle text at a
  fixed minimum width, so a column of bars lines up; `valueText` says "41 of 80" or "64% complete"
  and is the bar's `aria-valuetext`. Six prototype read-outs drawn by hand moved onto it.
  Components/Progress: WithValue.
- The prototype's five Stat grids drawn by hand (a Grid with a two-pixel neutral gutter) are
  `Stat.Grid` with its hairline gutters; the revision's submit gates are `Gates`; the CM-3 finding
  box and a package's gap note are `Alert`.
- `scripts/ds-check.mjs` covers a compound's exported parts by their compound name in a story
  (`Stat.Grid`) and skips exports marked `@deprecated`, so parts can be exported for their props
  tables without growing the allow list.

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
