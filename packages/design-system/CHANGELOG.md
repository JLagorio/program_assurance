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
- `Indicator` truncates its word when the column is narrower than it, and never shrinks its Dot;
  the prototype had wrapped it by hand with `truncate` spans. Components/Indicator: Truncation.
- Badge, Count and Indicator (with Dot) are on the template, walked against Carbon's Tag (usage,
  style, accessibility), Base Web's Tag and Badge, and Atlassian's Lozenge and Badge as known.
  Every prop of the four is described, so four generated tables fill. Said on the pages and not
  built: dismissible, selectable and operational tags (a FilterChip and a TextLink are those), a hue
  per category (a tone is a status, so a category is neutral), a large Badge, an outline or
  high-contrast appearance, a corner-placed Count, an icon per Indicator tone. Components/Badge,
  Components/Count, Components/Indicator.
- `Breadcrumb` is one line: a trail wider than its header truncates every crumb instead of
  wrapping to a second line, which Carbon rules out. Components/Breadcrumb: Matrix.
- `Eyebrow`'s neutral colour is `color.text.subtle`, from `color.text.subtlest`: Carbon's label is
  its secondary text, and the prototype had written forty-five eyebrows of its own in subtle against
  eight in subtlest. The Shell's section headings and the Preview eyebrow take the step.
  Components/Typography: Matrix.
- `KeyValue` gives a truncated string value its full text as the title, as a plain-string cell
  has. Components/KeyValue: Matrix.
- `Item` is rebuilt on one grid. A group is a six-column CSS grid and every row a subgrid of it, so
  the marks, the ids and the dates make columns whatever each row carries, and what a row shows
  under itself starts under its title instead of at the row's edge. The row's link or button is
  the title, stretched over the row by a pseudo-element; the actions and the toggle sit beside it,
  so no button is nested in a link or a button. The leading slot is a 20px mark centred on the
  title's line; the trailing value, the actions and the mark share that line. The `meta` truncates
  instead of pushing the trailing value off the row. Components/Item: Matrix, Lists.
- `Stepper` is one button per step, marker and text together, where it had been up to four
  elements a step with two hidden per orientation. The list now knows each step's place and its
  neighbour's state, so the rail is bold (`color.border.selected`) behind every completed step and a
  hairline ahead, and the first and last steps stop it themselves: `first` and `last` on
  `Stepper.Item` are deprecated no-ops. The state is spoken before the label and the current step
  carries `aria-current="step"`. Components/Stepper: Matrix.
- `Timeline` takes Item's anatomy: a row that opens is its title stretched over the row, the
  trailing slot beside it, so nothing interactive sits inside a button. The group label is an
  Eyebrow (so `color.text.subtle`, from subtlest) that labels the group's list.
  Components/Timeline: Matrix, Activity.
- `Tree` follows the ARIA tree pattern: the row is the tree item and the tab stop, the selected
  row (or the first) is tabbable and the rest are reached with the arrows, which move, open and
  close; Enter or Space selects; the chevron is for the mouse and hidden from the keyboard. It had
  been two buttons inside a tree item. Components/Tree: Matrix, Families.
- Stepper, Timeline and Tree are on the template, walked against Carbon's Progress indicator and
  Tree view, Base Web's ProgressSteps and TreeView, and Atlassian's Progress tracker and Tree as
  known; no reference has a timeline, so its page says whose conventions it follows. Said on the
  pages and not built: a disabled step, a step skeleton, a step with a body; alternating or
  horizontal timelines, a folded "show more"; a checkbox tree, drag to reorder, a tree that owns
  its data. Components/Stepper, Components/Timeline, Components/Tree.
- Breadcrumb, Item, Avatar, Id, KeyValue, Fact and Typography are on the template, walked against
  Carbon's Breadcrumb (usage, style, accessibility), Contained list and Structured list, Base Web's
  Breadcrumbs, Avatar, List, Typography and Heading, and Atlassian's Breadcrumbs, Avatar and
  AvatarGroup as known. Every prop of the seven and their parts is described, so eleven generated
  tables fill. Said on the pages and not built: an overflow menu and a medium size on the
  breadcrumb, a slash separator; a list header with a search, row heights, a disclosed list, nesting;
  photos, presence marks, a square avatar, a menu behind the +n, sizes past 20px; a monospace face
  and a copy button on an Id; a KeyValue group and a label-over-value grid; a stacked Fact; an
  eyebrow with an icon or a count. Components/Breadcrumb, Components/Item, Components/Avatar,
  Components/Id, Components/KeyValue, Components/Fact, Components/Typography.

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
- `Dot` takes `label`: a Dot with no text beside it becomes an image named by the label, so a
  status column of dots is no longer silent to a screen reader. Without one it stays hidden and the
  text beside it carries the status. Two lone Dots in the prototype say their names; twelve rows
  that drew a Dot and a word by hand are `Indicator`. Components/Indicator: Matrix, Dont.
- `Avatar` takes Atlassian's scale: `xsmall` 16px with one initial, `small` 24px (from 20) as the
  default, `medium` 32px, `large` 40px and `xlarge` 64px; at 16 and 20 two initials ran into each
  other and the border. It takes `src` for a photo, with the initials back if it fails to load;
  `variant` `tinted`, `bold` or `gradient`, a hue drawn from the name and stable per person, or
  pinned with `hue`; and `shape` `square` for a thing. Alone it is an image named by the full name;
  in a `Person` it is hidden and the name is read once (`isDecorative`); an `Avatar.Stack` is a
  group named by every name, takes `size` and `variant`, accepts a photo per person and rings each
  circle 2px in the surface colour. The prototype's timeline avatars take `xsmall`; the shell and
  the persona switch step to 24px. Components/Avatar: Matrix, People.
- The accent colours: `color.background.accent.{blue,teal,green,orange,red,purple}.subtler` and
  `.bolder`, and `color.text.accent.{hue}`. Colour that carries no meaning, for an avatar's tint,
  fill or gradient and, later, a tag. `subtler` is the 200 step under the hue's 900 text; `bolder`
  the 800 step under `color.text.inverse`; dark mode mirrors to 900 and 400. Every pair passes
  4.5:1 for 11px initials in both modes. Teal and purple now reach the accent family as well as the
  chart. Tokens/Color: Background, Text.
- `Item.Group` takes a `title`, a `count` and a `trailing` read-out or button: the list's own
  heading, semibold with a rule under it, which names the list to a screen reader. Carbon's
  contained list has the same header. `size="compact"` tightens every row for a rail. A row takes
  `isCollapsible` with `defaultOpen`, `open` and `onOpenChange`: its children fold behind a chevron,
  and a nested `Item.Group` in them is a milestone and its tasks. The POA&M's three hand-drawn list
  headers are group titles. Components/Item: Matrix, Nested, Dont.
- `Stepper` takes `numbered`, the step's number in its marker (Carbon, Base Web), and `label`
  for the list's name. `Timeline` takes `link` for a row that is a router Link, `dateTime` for a
  machine-readable stamp that makes the time a `<time>`, and `label`. `Tree` takes
  `size="xsmall"` (24px rows, Carbon's extra small) beside the 32px default, and the keyboard.
  `Eyebrow` takes `id`, so a list can be labelled by it. The wizard and the coverage header drop
  their `first`/`last` flags. Components/Stepper: Matrix, Paths; Components/Timeline: Matrix;
  Components/Tree: Matrix.
- `Eyebrow` takes `as`: `h3` or `h4` when it heads a section, so the page's outline has it,
  `dt` when it labels a value. Fifty-four eyebrows the prototype drew by hand are `Eyebrow`,
  the section headings among them as headings. Components/Typography: Matrix, InRail.

### Chart

- The chart tokens are re-cut and validated. `color.chart.categorical.1` to `.6` are blue, orange,
  teal, red, purple and green, in that order: of every order of the six hues it is one whose
  neighbouring pairs all clear the colour-vision floor (deutan and protan under Machado 2009,
  worst pair ΔE 12.7 against a floor of 8) and the normal-vision floor (22.8 against 15) in both
  modes, and whose first three clear every pairing. `.7` is Other, grey, the fold for a seventh
  category; `.8` is deprecated to `.7` and `ledger/no-deprecated-token` fixes it. Dark mode takes
  the same 600 steps as light for every series (the 400 steps sat above the lightness band and the
  red–green pair fell to ΔE 4.8), and `color.chart.neutral` in dark steps up to `darkNeutral.600`
  so a context series clears 3:1. New: `color.chart.sequential.1` to `.5` (blue, near zero to the
  most, for how much) and `color.chart.diverging.negative.bold`, `.negative`, `.midpoint`,
  `.positive`, `.positive.bold` (red against blue around grey, for above and below). Tokens/Color:
  Chart.
- `Chart` is the Frame: `title` (the figure's name and the plot's), `description`, `series` for
  the legend and the table, `legend` position and `swatch`, `actions`, `status` (`loading` holds
  the plot's height with a Skeleton; `empty` and `error` say so in it), `data` and `x` for the
  Table toggle that lays the same numbers out, and `format` and `formatX`, inherited by the plot
  inside. The legend in a Frame is a row of toggle buttons: hover dims the other series to
  `opacity.disabled`, click isolates one, and a hidden series' swatch hollows. Components/Chart:
  Framed, States.
- `Chart.Bar` takes `labels="end"`, a `target` key drawn as an ink mark across each bar (Carbon's
  bullet), a `line` series over the bars, and `[from, to]` values that float. Bars cap at 24px with
  a 2px rounded data end and a square baseline; stacked segments part by a 2px surface gap,
  grouped bars by 2px. Components/Chart: Bars, Stacked, Horizontal, Targets, Windows.
- `Chart.Line` and `Chart.Area` take `curve`, `dots`, `labels="end"` (the last values after the
  lines, pushed apart when they would collide), `baseline="auto"`, `bands`, `reference` (a target,
  a limit, a milestone: dashed and labelled at its end) and `connectNulls`. Lines are 2px with
  round joins and an 8px marker ringed in the surface on hover; the wash is the hue at 12%.
  Components/Chart: Lines, Burndown, Areas, Emphasis.
- `Chart.Donut` takes `caption`, `arc="half"` (a gauge, the number at its base), `name` and
  `onSelect`; slices part by a 2px surface gap. `Chart.Sparkline` takes `appearance` (`line`,
  `area`, `bars`), `endDot`, `reference` and `label`. Components/Chart: Donuts, Sparklines.
- New parts: `Chart.Scatter` (points on two value axes, `groups` of a tone up to three so any two
  stay apart, `z` for a bubble, a hit area three times the point, quadrants from `reference`),
  `Chart.Treemap` (tiles by value with a hierarchy, each system a hue, a name on a surface chip when
  it fits), `Chart.Heatmap` (a table of rows by columns painted on the `sequential`, `diverging` or
  a status scale; status cells are the Badge's fill and text with the value printed) and
  `Chart.Scale` (the key for a colour scale). Components/Chart: Scatter, Treemap, Heatmaps.
- Every plot takes `size` (`small` 120px, `medium` 200px, `large` 320px, the axis band included),
  `format`, `formatX`, `label` and `onSelect`. A named plot is a focusable group whose arrow keys
  move the tooltip; an unnamed one is decoration, hidden and not focusable. Ticks thin evenly, a
  long category is cut with its whole as a title, and the tooltip leads with the value and keys
  each series with the mark's swatch. Components/Chart: Selection.
- Chart is on the template, walked against Carbon's data-visualization guidance and its 26 chart
  types, Atlassian's data-visualization colour, Base's Charts and HubSpot's chart components, and
  checked with the data-visualization method's palette validator. Said on the page and not built:
  a pie, a second value axis, a needle gauge, radar, boxplot, histogram, lollipop, alluvial, word
  cloud, circle pack, maps, zoom, brush, an export toolbar, animation. The axe gate runs the matrix
  in both modes; the eleven `page:Chart#*` entries leave the allowlist. Components/Chart.
- Breaking, with no prototype consumer: `Chart` was a plain object of parts and is now the Frame
  with the parts hung off it (`Chart.Frame` is the same function); `ChartTone` no longer has
  `categorical.8`; `Chart.Donut`'s accessible name is `name`, since `label` is the number in the
  middle; a Sparkline with no `label` is hidden from a screen reader.
- The family is nine parts in `src/components/chart/`, one file each, and nine pages: Overview
  (the Frame), Bar, Line, Area, Donut, Sparkline, Scatter, Treemap and Heatmap, each on the template
  with its own Matrix in the axe gate. The `Chart.*` spelling is unchanged. Components/Chart.
- Choosing a mark. Every part takes `onSelect` (a click on a bar, a slice, a point, a tile, a cell;
  a click in a point's column on a Line or an Area) and `details`, which opens a card on the chosen
  mark: a Popover anchored to it with the kit's head (the swatch, the name, the category, the value,
  or every series at a category) and the caller's facts and link under it. The other marks dim while
  it is open; Escape or a click outside closes it and focus returns to the plot. `onSelect` now
  receives one selection object per part (`{ datum, series?, index }` on the cartesian parts,
  `{ slice, share, index }`, `{ datum, group, index }`, `{ name, value, group }`, `{ row, column,
  value }`) in place of positional arguments. Components/Chart/Overview: Details, Filtering; each
  part's Details.
- The keyboard chooses too. A named plot's tab stop is recharts' svg; the arrow keys move the
  tooltip across the categories and Enter chooses the one under it, opening its card. The focus
  ring is the kit's, on the keyboard only: a click focuses the plot without one, whatever the
  browser's heuristic (`src/styles/chart.css`, `data-focus` on the plot).
- Drill-down. The Frame takes `path`, the levels so far as a Breadcrumb under the description,
  every crumb but the last a way back; a click on a bar or a tile redraws the same plot one level
  down, and the marks move to their new places. Components/Chart/Overview: Drilldown;
  Components/Chart/Treemap: Drilldown.
- Motion. Marks arrive over the new `motion.duration.slow` (400ms) on the standard curve, a change
  of data moves them, the tooltip follows over `motion.duration.fast`, and a legend hover fades the
  other series over the same; under `prefers-reduced-motion` the marks draw in place. Tokens/Motion;
  Components/Chart/Overview: Motion.
- Loading. `status="loading"` on the Frame, or `loading` on a part, draws the plot's own silhouette
  in `color.skeleton` at its height: columns, bars, a line, a wash, dots, tiles, a ring, a grid of
  cells. `status="refreshing"` keeps the last plot at `opacity.loading` with a Spinner beside the
  title. Components/Chart/Overview: States.
- Bars and lines take `xLabel` and `yLabel` (axis titles); a reference's label on a vertical line
  sits above the plot rather than inside it; a stacked tooltip prints its total; a hovered slice
  grows 2px; a chosen point is ringed on every line; a Heatmap's `showValues` on a colour scale
  prints the number on a surface chip, so text never sits on a chart colour. Components/Chart/Bar:
  Windows, Combo; Components/Chart/Heatmap.
- `scripts/ds-check.mjs`: a file named `_x.tsx` under a layer is the folder's shared furniture and
  not an export; a family's Matrix may mention a part by its compound name (`Chart.Bar`).
- A value axis that pins and reaches below zero. Bar, Line and Area take `domain` (`[0, "auto"]`
  when unsaid) so charts side by side share a scale; a value below zero extends the axis through
  zero, draws the zero line in `color.border.bold`, and hangs the bar from it with its rounded end
  and its label at the data end. Components/Chart/Bar: Negatives; Components/Chart/Overview: Linked.
- A time axis. `scale="time"` on Line and Area reads `x` as dates (a Date, an ISO string or epoch
  milliseconds), spaces the points by time, and picks at most eight ticks by the span: hours, days,
  months (the year on January when the span crosses one) or years, each at a unit's start, in the
  reader's locale. A `reference` and a `band` take dates; `bands` also take `fromX` and `toX` on a
  category axis, an assessment window labelled above its middle. The Frame's table and CSV format a
  date as "4 Sep 2026". Components/Chart/Line: Dates.
- Linked charts. `syncId` on the Frame or a part shares the hover across charts, which with a shared
  `domain` makes small multiples: the method's answer to a dual axis and to more than six series.
  Components/Chart/Overview: Linked.
- Download and Expand. The Frame's `download` (`["csv", "png"]`) puts a Download menu beside the
  Table toggle: the table twin as CSV (categories formatted, values raw), or the plot as a PNG at
  twice the pixel density with every token resolved and the surface colour behind it. `expandable`
  adds an Expand button that opens the same Frame at `large` in a Dialog. Both are disabled while
  the plot is loading, empty or failed. Components/Chart/Overview: Downloads.
- The header wraps. The title block keeps 200px; below that the legend and the tools drop under it,
  so a Frame in a 320px rail keeps its plot's height and loses nothing. Components/Chart/Overview:
  Narrow.
- Textures. `texture` on the Frame, or on Bar, Area or Donut, gives every series a pattern in its own
  colour (the colour at 30% under 1.5px marks, 8px across) in a fixed order the legend, the tooltip
  and the card repeat: solid, hatch, back-hatch, dots, cross, lines, columns. For print, colour-vision
  loss and forced colours; a line's stroke stays solid. Components/Chart/Overview: Textured;
  Components/Chart/Bar, Area, Donut: Textured.
- `color.chart.<tone>.hovered` for every series tone and categorical step: one step darker in light,
  one lighter in dark, as Atlassian's chart hovered tokens. A hovered bar and a hovered slice take
  it in place of the 80% opacity. Tokens/Color: Chart.
- A series' own `format` (a fraction printed as a percentage in the tooltip, the card and the table), `delta` on Line and Area (each change from
  the point before, signed, in the tooltip and the card), and `summary` on the Frame (one sentence a
  screen reader hears as the figure's description, Carbon's chart description). Components/Chart/Bar:
  Rates; Components/Chart/Line: Deltas.

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
