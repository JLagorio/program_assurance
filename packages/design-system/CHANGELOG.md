# Changelog

Semantic versions. A rename or a removed prop is a major step once the package reaches 1.0; until
then it is a minor step, and it ships with a deprecation the lint fixes (`ledger/no-deprecated-name`,
`ledger/no-deprecated-token`) wherever one is possible. Every entry names the story that shows it.

## Unreleased · audit implementation

- **Breaking: Tabs adopts shadcn's Base UI parts.** Use flat Tabs, TabsList, TabsTrigger and TabsContent exports with the tabsListVariants recipe. Replace count/trailing slots with children, label with aria-label and asChild with render; navigation triggers use nativeButton={false}. List owns activateOnFocus (manual by default) and loopFocus. Existing app strips explicitly retain line styling, counts and automatic activation; ShowPage preserves its route-controlled layout. Forward native props, refs, state callbacks, cancellation, orientation and locale direction. Remove the custom underline observers/measurement and package Radix Tabs dependency. Replace seven Tabs stories with four interaction examples. See [Tabs](src/stories/components/Tabs.mdx).

- Let `DataTable.Filters` include caller-owned fields through `additionalFilters`, with their active count and reset callback. Controls moves Scope into this panel and removes its separate dropdown row. See [Data table / Group by](src/stories/patterns/DataTable.mdx#group-by).

- **Breaking: Select adopts shadcn's Base UI parts.** Compose Select, Trigger, Value and Content; replace compound Item/Group/Separator with flat exports and an explicit SelectLabel. Move layout, refs, ARIA and size to Trigger (`default`/`sm`); move placeholder to Value and supply selected-value labels through Root's `items` or Value. Preserve generic single/multiple values, nullable clearing, object serialization/equality, cancellation and native form props. Content follows shadcn's selected-item alignment by default; migrated callers explicitly retain below-trigger placement and widths. Keep Field bindings and nested-dialog dismissal. Remove the package's Radix Select dependency and the unused Radix menu-motion recipe. Replace seven Select stories with four interaction examples. See [Select](src/stories/components/Select.mdx).

- Add `DataTable.GroupBy`, a toolbar dropdown with the active field, checked choices and None for ungrouped rows, and `DataTable.Filters`, a single popover for existing column filters with an active count and Clear all filters. Controls and task tables adopt these actions. Toolbar actions wrap on narrow screens. See [Data table / Group by](src/stories/patterns/DataTable.mdx#group-by).

- Add `DataTable.Metrics`, `.MetricsTrigger` and `.MetricsContent` for optional summaries below a table toolbar. Metrics start collapsed; the chart action exposes the summary without changing table filters or selection. The Controls board moves its existing stage cards into this section. See [Data table / Metrics](src/stories/patterns/DataTable.mdx#metrics).

- **Breaking: DropdownMenu adopts shadcn's Base UI Menu composition.** Replace configured triggers and compound parts with flat Trigger, Content, Group, Label, Item, CheckboxItem, RadioGroup/RadioItem, Sub/SubTrigger/SubContent, Separator and Shortcut exports. Actions use `onClick`; choices use native change callbacks; `closeOnClick` replaces `closeOnSelect`. Checkboxes and radios stay open by default; existing single-choice callers explicitly close. Content follows trigger width with a 128px minimum; current callers retain explicit widths and Ledger tokens. Add Base UI LinkItem for native/router navigation, remove children-as-close callbacks and the package's Radix Menu dependency. Preserve menu-to-dialog focus return and enclosed popup dismissal. DataTable's hidden row actions remain keyboard-reachable. Replace five presentation stories and an a11y exception with four interaction examples. See [DropdownMenu](src/stories/components/DropdownMenu.mdx).

- **Breaking: Tooltip adopts shadcn's Base UI composition.** Compose `Tooltip`, `TooltipTrigger`, `TooltipContent` and `TooltipProvider`; move the old `content` prop into Content children and the trigger into `render`. Content defaults to top/center with a 4px offset, a 320px maximum and a decorative arrow, retaining Ledger tokens. Provider defaults to zero delay; Shell and Storybook explicitly preserve 300ms delay and grouping. Remove the private fallback provider, duplicate IconButton tooltips and the package's Radix Tooltip dependency. Preserve native links, payloads, refs and cancellable state changes. Disabled-action wrappers expose their reason independently, and Escape dismisses an enclosed tooltip before its dialog. Consolidate five stories into three interaction examples. See [Tooltip](src/stories/components/Tooltip.mdx).
- Keep Base UI popups inside existing modal focus scopes through the shared Combobox/Popover portal lookup and nested Escape guard. DatePicker returns to its field after Clear, and dialog entry releases its transform so popups can extend past the rounded frame. Components/DatePicker's milestone dialog checks focus, dismissal and actual pointer targets.
- **Breaking: Popover adopts shadcn's Base UI composition.** Use the flat `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverHeader`, `PopoverTitle` and `PopoverDescription` parts, plus Base UI's `PopoverClose` for Done/Cancel actions. Replace the configured `trigger` and `Popover.Close` wrappers with `render`; move placement and `aria-label` to Content, and replace `width`/`matchTriggerWidth` with native `style` (`var(--anchor-width)` matches the trigger). Content defaults to 288px and bottom/center placement with 4px side offset; existing picker/filter widths and alignments remain explicit. Root exposes Base UI's controlled state, cancellation and modality, while Content exposes initial/final focus. Migrate chart detail cards' custom anchors and focus return to Base UI as well, removing the package's Radix Popover dependency. Ledger tokens remain. See [Components/Popover](src/stories/components/Popover.mdx).
- **Breaking: HoverCard adopts shadcn's Base UI composition.** Use `HoverCard`, `HoverCardTrigger` and `HoverCardContent` over Base UI PreviewCard. Move `content` into Content children, trigger elements into Trigger's `render`, and `delay`/`closeDelay` onto Trigger. Native popup `style` replaces the width shortcut. Use upstream 600/300ms trigger delays and bottom/center placement with 4px offsets; existing glance callers keep 300px width and start alignment. Preserve native links, refs, render/state callbacks, cancellable open changes and locale-aware positioning, with Ledger surface and motion tokens. Table.List explicitly closes its preview when its action opens the record. Remove the package's Radix HoverCard dependency. See [HoverCard](src/stories/components/HoverCard.mdx).
- **Breaking: Checkbox adopts shadcn's Base UI API.** Compose labels and descriptions outside the checkbox. Use boolean `checked` and a separate `indeterminate` prop, including on `Table.Selection`; mixed select-all controls keep `checked={false}` so activation selects all. Keep Ledger's check/minus indicators and Field binding while exposing native refs, input refs, form attributes, read-only state, render/state callbacks and cancellable `onCheckedChange`. Migrate app callers, TaskRow and DataTable filters/selection. Remove the package's Radix Checkbox dependency and the old choice-label helpers. See [Checkbox](src/stories/components/Checkbox.mdx) for migration and form examples.
- **Breaking: RadioGroup adopts shadcn's Base UI API.** Replace `RadioGroup.Item` with the flat `RadioGroupItem` export and compose labels/descriptions outside each item. Layout uses CSS instead of `orientation`; Base UI handles both arrow axes, wrapping, Space selection and locale-aware direction. Preserve generic values, cancellable `onValueChange`, Field group binding, native refs, input refs, form attributes, read-only state and render/state callbacks. Items use a filled brand circle and an inverse dot. Migrate the program wizard and story callers; remove the package's Radix RadioGroup dependency. See [RadioGroup](src/stories/components/RadioGroup.mdx) for migration and form examples.
- **Breaking: Switch adopts shadcn's Base UI API.** Move labels and descriptions outside the switch; the component owns its thumb. Use `size="default"` (32×20px) or `size="sm"` (24×16px), with Ledger colors, RTL motion and reduced-motion support. Native root props/ref, `inputRef`, `render`, state callbacks, `readOnly` and cancellable `onCheckedChange` are available. The default root is a span; `id` identifies the hidden checkbox unless `nativeButton` is set. Keep Field label/error binding and migrate existing app/story callers. Remove the package's Radix Switch dependency. See [Switch](src/stories/components/Switch.mdx) for composition and native form examples.
- **Breaking: Toggle and ToggleGroup adopt shadcn's Base UI API.** Use `ToggleGroupItem` children, array `value`/`defaultValue`, `onValueChange` and optional `multiple`. Both families use `default`/`outline` variants and `default`/`sm`/`lg` sizes; put icons, labels, counts and tooltips in children. Remove the scalar `items`/`onChange` wrapper and icon shortcut. Groups can clear selection; existing app and pattern callers keep their required-selection rule locally. Forward native props/refs, render and state callbacks, orientation and locale-aware keyboard direction. Remove the package's two Radix toggle dependencies. See [Toggle](src/stories/components/Toggle.mdx) and [ToggleGroup](src/stories/components/ToggleGroup.mdx) for migration examples.
- **Button and IconButton use Base UI action behavior.** IconButton delegates to Button; both retain Ledger's variants, sizes, loading, selected state and token styling. Add native `render`, state-based classes/styles and focusable disabled support. Remove `asChild`: navigation uses the shared `buttonVariants` recipe on a real anchor/router Link, preserving link semantics; rendered actions use `render`. Attachment.Trigger inherits the action contract. Consolidate the two families from 15 to 8 stories and shorten their pages while expanding form, loading, composition, focus and tooltip checks. See [Button](src/stories/components/Button.mdx) for migration examples. No release is implied.
- Kbd and KbdGroup accept native `kbd` attributes, events and refs, retaining cap geometry, `label` and the `Kbd.Group` alias. Explicit `aria-label` overrides the shorthand. Remove the prescriptive Don't gallery and shorten the [Kbd page](src/stories/components/Kbd.mdx); Matrix and Playground cover supported use, with interaction/accessibility checks on the Matrix.
- Extract packed-consumer SSR, TypeScript and Vite fixtures into ordinary files under `build/consumer-fixture/`. The same tarball install and integration checks remain, with Kbd coverage alongside existing families; new cases no longer require editing large escaped source strings.
- Migrate Skeleton to shadcn's native div contract. Native attributes, events and refs target the outer element; shapes, line counts, dimensions and style overrides retain their existing behavior. Add `data-slot="skeleton"` and preserve hidden/reduced-motion defaults. Supplied children or native HTML content replace generated multiline rows. Existing consumers need no edits. See [Components/Skeleton](src/stories/components/Skeleton.mdx) for usage and migration details; stories and packed-consumer checks cover native integration and loading layouts.
- **A tree no longer shifts its columns as rows open and close.** The disclosure column was as wide as the deepest row on screen asked, so folding a parent narrowed it and moved every header. It is now one narrow column (28px, the chevron centred) at every depth, and the nesting reads as an indent on the row's first value instead. `Table.Disclosure` loses `depth`; `Table.Id` takes `indent`. Josef, 2026-09-07. Patterns/Data table, Tree.
- **The preview eye takes no room and shows on hover.** It sits over the end of the row's first value cell rather than in its layout, on the row's own surface, revealed on hover and on focus and held on the row whose preview is open, so a column of ids reads as ids. The narrow columns are centred and tighter: the row's actions are 32px rather than 40, and the tree's chevron and the detail chevron sit in the middle of their column. Josef, 2026-09-07. Patterns/Data table; Components/Table.
- **The row's actions hold the table's trailing edge.** An `actions` column is pinned to the end and forced last in the reader's order, so the kebab sits at the edge of the visible table however far the columns scroll and whatever the reader reorders or pins; a stored view can no longer move it. `Table.Id`'s id grows and truncates so the preview eye keeps one position down the column instead of being pushed out by a longer id. Josef, 2026-09-07. Patterns/Data table, Pinned, resizable, reorderable.
- **Breaking: a tree's chevron is a leading column of its own.** `Table.Disclosure` holds the chevron and the indent, beside the checkbox, the drag handle and the detail chevron: always the first columns and always pinned, so the disclosure never moves when the reader reorders, hides or pins a column, and no data column changes shape in tree mode. The `tree.column` option is gone; a folded row's `hint` now sits after its first value. Josef, 2026-09-07: the collapsible was not always the leftmost column. Patterns/Data table, Tree; Components/Table, Tree.
- **A tree's rows can open into a detail as well.** A detail row keeps its own open set instead of TanStack's expansion, so a row opens its parts and its child table apart and neither closes the other; `initialState.expanded` still says which details start open. `detailColumn: false` leaves out the detail's own chevron column, and a `list` column with `opens: "detail"` opens the row instead, carrying the chevron on its line: in a treegrid two chevron columns read as twins. Josef, 2026-09-07. Patterns/Data table, Tree with detail rows.
- **`Table.List` and the `list` column kind.** Several values in one cell on one line: the first by name, the rest as a count, every one in a hover card with its meta line and one status, an `empty` for a row with none and a `note` under the card's list. The line is a button when the id column has a `preview`, so the click is the peek like the eye; it sorts and filters (contains) by the labels and exports them joined. Josef, 2026-09-07: the coverage view's Carried by cell wrapped three links and a flag. Patterns/Data table, List cells; Components/Table.
- **A tree keeps a matching row's ancestors** when it is filtered or searched (`filterFromLeafRows`), and the presets count nested rows, so a saved view over a tree reads the same as over a list. Patterns/Data table, Tree.
- **DataTable loses its frame.** Josef, 2026-09-07: the register sits on the page with no border and no radius. The toolbar slot sits above the header flush with the table's edge with `space.200` under and no rule; the table closes with a hairline under its last row; Pagination sits under that hairline with `space.100` above and no rule of its own; Empty and error draw under the header as before. Table itself is unchanged, it never had a frame. Patterns/Data table.
- Migrate Separator to the shadcn Base UI foundation. Add native props/refs, `render` and state-based classes/styles while preserving `orientation`, `isDecorative`, and the one-pixel Ledger border. Expose `data-slot="separator"` and Base UI's `data-orientation`; native role/ARIA props can override decorative defaults. Existing callers need no migration. See [Components/Separator](src/stories/components/Separator.mdx) for composition examples and interaction/accessibility checks; packed-consumer coverage includes types, SSR and CSS.
- Retire the Shapes Storybook section: remove its overview, four family pages and 13 demos. Keep all runtime exports and existing Block/Inspector integration examples. ActionBar and WorkPane remain covered by API compatibility checks without standalone stories; new component families still require story coverage.
- Simplify design-system maintenance: family pages retain executable story coverage without a fixed heading checklist. Consolidate Badge's playground and native-attribute examples and keep its migration guidance on one page; correct stale RecordHeader guidance. Supported component APIs and light/dark interaction/accessibility checks are preserved.
- Generate API audit reports on demand into ignored artifacts instead of committing them or gating CI on freshness. Retire exhaustive native-prop review prose. Keep a compact declaration baseline with fingerprints for exposed dependency contracts and consumer compatibility checks.

- **Badge uses shadcn Base UI as its foundation and keeps status options on the same component.** `Badge` and `badgeVariants` provide the six shadcn treatments alongside `tone`, `appearance`, `size` and `icon`. Native span attributes/refs and Base UI `render` compose actual links with merged props, refs and handlers. Status colors and 16px/20px densities use the same pill anatomy as other badges. Plain Badge uses the brand default; existing neutral labels explicitly choose `tone="neutral"`. Count, Dot, Indicator and the shared tone contracts remain. CVA is a package runtime dependency, and Ledger focus/danger outline tokens replace reference rings. See [Components/Badge](src/stories/components/Badge.mdx) for usage and migration examples. Shadcn is the starting point: useful product extensions belong on the component. No version bump or release is implied.
- **Breaking: Breadcrumb adopts the shadcn Base UI anatomy.** Import the seven flat parts: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator` and `BreadcrumbEllipsis`. Replace `Breadcrumb.Item` with an explicit `BreadcrumbItem` containing a link or page; move `asChild` composition to `BreadcrumbLink render`, replace `isCurrent` with `BreadcrumbPage`, and replace root `label` with `aria-label`. Add `BreadcrumbList` and separators explicitly. The list now wraps by default instead of automatically truncating every crumb, and the current page uses normal font weight instead of medium. Parts accept native attributes and refs on their own elements; a rendered link must forward merged props and its ref. Ledger token styling is retained. See Components/Breadcrumb for migration examples and interaction checks. This is the first family migrated to the standard-component policy; other families retain their contracts. No version bump or release is implied.

- Follow Storybook’s default testing model across the catalog: all stories run render, interaction and accessibility checks in light/dark modes. Remove custom contract tags, opt-in filters, mandatory contract-story checks and the duplicate hidden test catalog. Keep assertions on representative component examples, use callback spies instead of test controls, and name stories for their demonstrated behavior. See Guidance/Testing and review.
- Repair newly exercised playground labels and list semantics, token specimens, overlay comparisons and asynchronous examples. Scope documented accessibility exceptions to the rule an intentional anti-example demonstrates. Shell resize handles now announce their measured width and update it on keyboard and pointer resize; see Patterns/Shell, Frame.

- Move Combobox from Command/Popover to Base UI 1.7.0. Keep the options/value/onChange API with search directly in the main field and an options-only popup. Native refs/events now target HTMLInputElement; className/style target its input group. Clearing reports an empty string, and searchPlaceholder is deprecated in favor of placeholder. Preserve Field/form integration; add experimental generic Root and composable input, popup, list, groups, clear and multiple-selection chips. Search now uses locale-aware substring matching instead of cmdk fuzzy ranking. Add uncontrolled native form reset, dialog portal containment and nested Escape handling across Ledger overlays. See Components/Combobox for migration details and examples.
- Add experimental Attachment with composable media, metadata, actions, card triggers and scrollable groups. Include caller-owned upload states, native props/refs, three sizes, image previews, accessible independent controls and wrapping recovery copy. See Components/Attachment; interaction checks run on those examples.

- Move Avatar onto Base UI's Avatar primitive and add Avatar.Image, Avatar.Fallback and Avatar.Count with native props and refs; Avatar, Avatar.Stack and Person forward native span props and refs and carry `data-slot`. The `name`/`src` shorthand, the five sizes, `variant`, `hue`, `shape` and the stack's `names`/`max` are unchanged. A photo now waits behind the initials until it has loaded instead of leaving the circle empty, and Avatar.Fallback takes Base UI's `delay`. A stack also takes composed children: with `aria-label` the group is named and its circles are decorative; without, each circle is an image named by its person. In a stack a neutral circle and the +n are backed by `elevation.surface` under the neutral wash, which is translucent, so the circle before no longer shows through. Add Avatar.Badge: a mark on the circle's corner in a status `tone`, a dot below `medium` and an icon from `medium` up, ringed in the surface colour; the root no longer clips its overflow, the photo and the fallback carry the radius instead. See Components/Avatar.
- Add Alert.Title, Alert.Description and Alert.Action with native props/refs, rich content and wrapping actions. Preserve title/action shorthand and default tones/roles; allow explicit role/aria-live overrides and shorthand icon customization. Actions now keep caller styling instead of receiving cloned tone/underline classes; use a matching tone text token and underline explicitly where the previous link treatment is desired. See Components/Alert.
- Sort Storybook components alphabetically, removing the Overlays/Chart priority exceptions; use deterministic English alphabetical sorting in both Storybooks.

- The table at Josef's 2026-09-06 review. `DataTable.Presets` takes `variant="menu"`, one button that reads the current question and opens the list with counts, for a toolbar that also holds search and filters. `DataTable.Settings` is a gear beside `DataTable.Columns` for the rows' density and Reset view; the Columns menu is the columns alone. The checkbox, handle and detail columns are always first and always pinned; the pinned column that touches the middle keeps its hairline while the frame is scrolled (a pseudo-element, since a collapsed table border stays put under a sticky cell); a `Table.Group` heading sticks to the frame's leading edge while the rows scroll sideways. The preview eye sits at the end of the row's first value cell and is there at rest, muted; `Table.Id` draws its eye the same way. `custom` columns take `pin`, `hideable` and `resizable`. Patterns/Data table.
- `Editable.Select` shows the options and nothing else (the label is for the screen reader), and past eight options, or with `searchable`, it is a searched list of the values as words. Components/Editable.
- `Composer` takes `actions`, rendered before Cancel and the primary button: a second thing to do with the draft, the product's Task button. Patterns/Composer.
- `Timeline` takes `wrap`: titles wrap instead of truncating, for a feed whose sentences name a task or a file. Components/Timeline.
- `color.border.input` is `neutral.400` (dark `darkNeutral.500`) again, the lighter field border Josef asked for on 2026-09-04; the audit's contrast pair for it is a visibility floor, the focus and danger borders keep 3:1.

- Restore Accordion as a composable base component and separate independent Collapsible behavior. Add explicit Header/Trigger/Content parts, typed root selection, stable item IDs, native attributes/refs, slotted triggers and safely hidden retained content. Existing title/count layouts now compose these parts directly; there is no additional section pattern. See Components/Accordion and Components/Collapsible.
- Deliberate next-minor API migration: former title/count and Group APIs are available as deprecated LegacyCollapsible and LegacyAccordion through the next minor release. All current callers are migrated. See `docs/guides/disclosure-migration.md`; no release is implied.

- Record the initial 204-entry component API review; retained semantic notes are now optional audit context, while current component guidance lives in Storybook.
- Fix dropped Select styles, Combobox trigger width and popup naming, Drawer description association, Table.Selection pinning, DataTable/Shell naming, slotted Shell.AppLogo activation and read-only ModeSwitch ownership. Review the tagged contracts in the corresponding component stories.
- Fix Panel subheader-only composition, duplicate CommandPalette labels, and PickerSheet search naming. Add Text.htmlFor for label association, preserve Inline list semantics, and fix changing Spinner delay and Progress segment names; each has a regression story.
- Forward locale direction into direction-sensitive Radix controls while preserving explicit dir overrides.

- Add experimental `Composer` and `TaskRow` patterns with neutral package stories and interaction contracts. Composer supports caller-owned suggestion serialization, controlled/uncontrolled drafts, pending submission and failed-save recovery. TaskRow separates boolean completion from caller-rendered status, owner and due content.
- Keep Activity/Task product wrappers, event/task vocabulary and mention parsing in the application. Product/Workflows owns the business examples. Timeline.Item remains the shared feed item; Activity.Composer and Task now adapt the shared Composer and TaskRow.

- Fix package declarations and Node ESM consumption; add packed consumer validation.
- Fix DatePicker form values, composite focus/form integration, Field wrapper bindings, full-form validation, slotted activation, inline-save races, overlay focus return, tree navigation and keyboard table resizing. Review their interaction stories.
- Add LedgerProvider deterministic formatting and reduced-motion contracts (Tokens/Motion).
- Remove localization/Arabic and reference-workflow demos and the writing-direction toolbar. Keep keyboard resize and saved-view regressions under Patterns/Data table in English.
- Validate stored table layouts, isolate view names and restore author defaults.
- Add DTCG 2025.10 light/dark interchange exports while preserving ledger-css-v1 authoring compatibility. Strengthen pressed/selected colors and resting input boundaries; test 376 declared contrast pairs.
- Run Storybook checks in light/dark modes, selected narrow-screen workflows, compiler-resolved public coverage and non-growing exceptions.

Migration: custom controls inside Field must call `useFieldControl` or explicitly bind their native target using `controlId`; arbitrary component cloning is no longer the association mechanism. Slotted Button refs/events describe their actual HTMLElement target. Controlled form reset remains caller-owned. No release has been published.

## 0.6.0 · 2026-09-05

### Deprecated

- `RecordHeader` `facts`. The header is the trail, the title and the actions; the details are the
  rail's Inspector. The prop renders for one release. Story: Patterns/RecordHeader, Don't.

## 0.5.0 · 2026-09-04

### Breaking

- Row density is a table's setting, not the document's. `Table` takes `density` (`default` 40px,
  `compact` 36px) and sets `data-density` on its frame; `useDataTable` takes `density` as the
  author's default, and the reader's choice is Compact rows in the Columns menu, kept with the
  view under its name and put back by Reset view. The app-wide `DensityProvider`, `DensitySwitch`,
  `useDensity`, `densityScript` and the storage functions stay exported for one release as no-ops,
  and `ledger/no-deprecated-name` says where the setting went; the Storybook toolbar's density
  axis is gone. `Item.Group`'s `empty` string renders as a compact Empty, never a grey line.
  Components/Density, Components/Table, Patterns/Data table.
- `Editable.Text` takes `label`, as `Editable.Select` did: the field's name for a screen reader,
  read before the value ("Owner: Dana Whitfield") and on the input while editing. DataTable's
  `text` column passes its header; the prototype's ten call sites pass the row's label.
  `Command.Empty` and `Command.Loading` render after `Command.List`, not inside it: a listbox may
  hold only options and groups, and the a11y gate said so. The kit's Combobox, CommandPalette
  and RecordPicker moved theirs. Components/Editable, Components/Command.
- `Accordion` is `Collapsible.Group`: one part for a section that folds, alone or in a set. A
  Collapsible inside a Group takes the group's keyboard (Up and Down between the titles, Home and
  End, wrapping) and the group's open state, and is written the way it is written alone:
  `defaultOpen` says which start open, `value` names it when the title is not a string. A Group
  is `multiple` unless `type="single"` is said, where an Accordion was single. `Accordion` and
  `Accordion.Item` stay exported as deprecated aliases for one release; `ledger/no-deprecated-name`
  names the replacement and rewrites an item. The Inspector's groups are a Group. The Accordion
  page folds into Components/Collapsible: Grouped, One at a time, Matrix, Dont.
- `Tabs` is on Radix Tabs and is four parts. `Tabs` holds the selection (`value` and
  `onValueChange`, or `defaultValue`; `activation` automatic or manual), `Tabs.List` is the
  strip, `Tabs.Tab` takes `value` in place of `isSelected` and `onClick`, and `Tabs.Panel` is
  the view a tab shows, required for the selected tab. The strip is one tab stop with the arrows
  inside it, and one indicator slides to the selected tab in `motion.duration.medium`. `ShowPage`
  takes `tab` and `onTabChange` and is the root and the panel for a record page. The prototype's
  twenty-six strips pass `value` per tab and the handler once. Components/Tabs, Patterns/Pages.
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
- The layout primitives take `as` from the layout elements only: a container, a landmark, a list or
  a list part, never `a` or `button` (TextLink and Button carry the ring, the face
  and the name). `Flex` drops `row-reverse`, `column-reverse` and `wrap-reverse`:
  reading order and tab order stay one order. `Heading` `color` is `color.text`, `.inverse` or
  `.warning.inverse`, never a tone. `Bleed` takes the tokens that have a negative in the source,
  `space.025` to `space.400`, and takes `as`. `Text` takes `as` from `TextElement`, `Heading` from
  `HeadingElement`, `Eyebrow` from `TextElement` plus `h2` to `h4`: three named unions, exported.
  `style` is accepted by Box and Grid, the two layout primitives with a computed dimension, and
  refused by Stack, Inline, Flex, Bleed, Text and Heading: a fixed width sits in a Box. Twelve
  call sites moved their width onto a Box, three in the prototype. No prototype call site passed
  a reverse, a tone on a heading or an element outside the unions.
  Primitives/Box, Flex, Heading, Bleed, Text.

- A `DropdownMenu.Item` with `isSelected` is a menuitemcheckbox (Radix CheckboxItem) with
  `aria-checked`, drawn as Select draws its choice: selected text and a check at the end, no
  fill. Before it was a plain menuitem with a fill, so a screen reader heard nothing about the
  state of a toggle. Editable's status menu and the DataTable's Columns menu take the new face.
- `FilterChip` says `aria-pressed` when it stands alone and defers to a Popover's
  `aria-expanded` as its trigger; the plus shows only while the chip is off; `disabled` has a
  face (`color.border.disabled`, `color.text.disabled`). Components/FilterChip: InToolbar, Dont.
- A sortable header's chevron shows on keyboard focus as well as hover, because nothing else
  says a table sorts.
- Pagination's page buttons are named "Page 6" and the gap is hidden from a screen reader.
  Components/Pagination: Paged, Dont, Playground.
- The choice controls and the Forms overview are on the template. `Checkbox`,
  `Switch` and `RadioGroup` have typed, described props, so their tables generate; a choice's
  control and label top-align, so a label that wraps runs under its own first line. Said on the
  pages and not built: no state text beside a Switch, no small choice controls, no read-only choice.
  Components/Checkbox, Components/RadioGroup, Components/Switch, Components/Forms.
- `Select`, `Combobox` and `DatePicker` take `size`, and take `aria-invalid`, `aria-required` and
  `aria-describedby` from the Field, so a picker inside a Field is described by its hint and turns on
  its error the way an Input does; `DatePicker` accepts `aria-required` and does not render it, since a
  button may not carry it. `DatePicker`'s placeholder is "Choose a date". Components/Select,
  Components/Combobox, Components/DatePicker.
- The four pickers are on the template. Said on the pages
  and not built: no multi-select, no creatable option, no typed entry in the date field, no time, no
  month or year menus in the caption. Components/Calendar.
- `color.border.input` is lighter: `neutral.400` in light, `darkNeutral.500` in dark, below 3:1 by
  decision. The label, the fill and the focus and danger borders identify a field; the contrast test
  holds the rest border above a floor. Every field control, the Checkbox box and the RadioGroup dot
  take it. Components/Input.
- `Textarea`, `NativeSelect` and `InputGroup` are on the template. Said on the
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
- Alert, Banner, Progress, Stat and Gates are on the template. Every prop of the five
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
- Badge, Count and Indicator (with Dot) are on the template.
  Every prop of the four is described, so four generated tables fill. Said on the pages and not
  built: dismissible, selectable and operational tags (a FilterChip and a TextLink are those), a hue
  per category (a tone is a status, so a category is neutral), a large Badge, an outline or
  high-contrast appearance, a corner-placed Count, an icon per Indicator tone. Components/Badge,
  Components/Count, Components/Indicator.
- `Breadcrumb` is one line: a trail wider than its header truncates every crumb instead of
  wrapping to a second line. Components/Breadcrumb: Matrix.
- `Eyebrow`'s neutral colour is `color.text.subtle`, from `color.text.subtlest`: a label is
  secondary text, and the prototype had written forty-five eyebrows of its own in subtle against
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
- Stepper, Timeline and Tree are on the template; the Timeline follows Item's
  anatomy. Said on the
  pages and not built: a disabled step, a step skeleton, a step with a body; alternating or
  horizontal timelines, a folded "show more"; a checkbox tree, drag to reorder, a tree that owns
  its data. Components/Stepper, Components/Timeline, Components/Tree.
- Breadcrumb, Item, Avatar, Id, KeyValue, Fact and Typography are on the template.
  Every prop of the seven and their parts is described, so eleven generated
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

- Mode and Density are on the template: the walk's last two pages. Mode is the one setting that is
  the document's; Density is the table's, with the Register story showing Compact rows persisting
  and Reset view putting it back. 101 of 103 pages on the template; the two overviews carry the
  remaining grandfathered gaps.
- Every scroller stops at its edge, the page included: `overscroll-behavior: none` on the
  overflow utilities, the library viewports (ScrollArea, Select) and the root, from `base.css`.
  No rubber band inside a table frame, a ScrollArea, a code block, a menu list or a sheet's body,
  none at the end of the page, and no scroll chaining into the page behind them. A sideways swipe
  never becomes the browser's back gesture, over a wide table or over a rail that scrolls down
  alone: a scroller contains a gesture only in an axis it can scroll, so the root holds the rest.
  Components/ScrollArea, Components/Table.
- Editable, Command, CodeBlock, Resizable, ScrollArea and Toaster are on the template, each with
  a Matrix, a Dont and a Playground. Editable: the value sits flush on the text column with the
  tint reaching `space.050` past it, so an editable value lines up with the plain values beside
  it; an empty value is the kit's `Absent`; Enter and Escape return focus to the row, and Enter
  no longer reopens the field it just closed; a landed save is announced. Command: the cursor row
  tints as a menu's does, `color.background.neutral.subtle.hovered`, in place of the selected
  fill; `Command.Loading` for rows fetched as the reader types. CodeBlock: `copy` (a Copy that
  says Copied), `wrap`, `CodeBlockProps`. Resizable: `persist` keeps the reader's sizes in
  localStorage; `collapsible`, `id` and `onResize` on a Panel; `label` on a Handle, "Resize"
  unsaid; typed props. ScrollArea: `label` names the viewport a region, `bar="always"`, the thumb
  darkens under the pointer. Toaster: `toast` is the kit's, `error` staying eight seconds with a
  close; the loading mark is the Spinner; a toast moves in `motion.duration.moderate`, as the
  Motion page said; the close is styled; `closeButton` on the Toaster; `toastClasses` and
  `toastIcons` for the page's specimens. Ninety-nine pages on the template; 39 gaps grandfathered.
- `Collapsible` and `Accordion` take `headingLevel` (the title as an h2 to h6, so a rail's
  sections are in the page's outline) and `disabled`; the row tints under the pointer, the tint
  reaching `space.100` past a flush title. `AccordionItemProps`
  and `DisclosureHeading` are exported; a string `count` renders as given. Components/Collapsible,
  Components/Accordion.
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
  next shows the next tooltip at once. The Shell mounts it
  and the Storybook preview wraps every story in it; a Tooltip with no provider above makes its
  own, as before. Tooltip, HoverCard and Popover props are described, so their tables fill.
- `DropdownMenu.Item` takes `tone="danger"` (red, red-tinted highlight) for the verb that
  removes or closes something; the DataTable's row actions use it in place of a coloured span.
  `DropdownMenuItemProps` exported. Components/DropdownMenu: Kebab, Toggles, Dont, Playground.
- Pages on the template: Tooltip (IconButtons, Open, Dont, Playground), HoverCard (On an id,
  Dont, Playground), Popover (Task, Options, Dont, Playground), DropdownMenu. Twenty-four pages on
  the template; 681 gaps grandfathered.
- `Table` takes `label` (its accessible name) and a typed
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
- One page per part. Every part a product imports by name has its own story file and page;
  compound parts stay with their parent; Forms, Overlays,
  Pages, Shapes and Primitives keep an overview that says which part to reach for. The sidebar
  gains Patterns, Shapes and Shell sections. Input and Field are on the template after Button,
  IconButton and TextLink; the rest carry their prose and a generated props table until walked.
- `Input` has a read-only look (`readOnly`: the sunken surface, no hover), and the contrast test
  covers the field's borders against the input surface.
- `Alert` takes `action`: the one TextLink or link Button that resolves it, under the body.
  Components/Alert: Matrix,
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
- `Avatar` takes a four-step scale: `xsmall` 16px with one initial, `small` 24px (from 20) as the
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
  heading, semibold with a rule under it, which names the list to a screen reader.
  `size="compact"` tightens every row for a rail. A row takes
  `isCollapsible` with `defaultOpen`, `open` and `onOpenChange`: its children fold behind a chevron,
  and a nested `Item.Group` in them is a milestone and its tasks. The POA&M's three hand-drawn list
  headers are group titles. Components/Item: Matrix, Nested, Dont.
- `Stepper` takes `numbered`, the step's number in its marker, and `label`
  for the list's name. `Timeline` takes `link` for a row that is a router Link, `dateTime` for a
  machine-readable stamp that makes the time a `<time>`, and `label`. `Tree` takes
  `size="xsmall"` (24px rows) beside the 32px default, and the keyboard.
  `Eyebrow` takes `id`, so a list can be labelled by it. The wizard and the coverage header drop
  their `first`/`last` flags. Components/Stepper: Matrix, Paths; Components/Timeline: Matrix;
  Components/Tree: Matrix.
- `Timeline` takes `orientation="horizontal"`: events across a record header, oldest first, the
  time above each marker, on the Stepper's geometry; and `icon` on an item, passed bare, which
  makes the marker a disc in the tone with the icon on it, for a pipeline's check, cross and play.
  Josef's release, journey, activity-feed and pipeline patterns are the stories: a Badge in a title,
  an Avatar as the marker, a Collapsible under a row. Components/Timeline: Matrix, Runs.
- The Stepper's numbered marker centres its number with flex; on the current step's 2px ring the
  grid had set it a pixel low. Components/Stepper: Matrix.
- `Timeline` is pushed on review, against Josef's nine references. Down the page the list is one
  CSS grid the rows share (time · marker · body) and every row draws its own piece of the rail in
  the marker column, so the rail runs through the markers' centre by construction; it had sat 3.5px
  to the start. The list takes `size` (`small` a bare Dot at 16px, `medium` the ring at 20,
  `large` a `small` Avatar or a 24px disc for a feed of people), `timePosition` (`end` of the
  title's line, `above` it as a dated line, `below` first in the footer, `start` in a column
  before the rail, as wide as its widest stamp) and, across, `align` (`center` with the time
  above, or `start` with the time below and the text under the marker, for stages with a body).
  An item takes `description` (a wrapping sentence under the meta) and `footer` (Badges for the
  kind and the state, or the name, last). The group label sits on the title column. New stories:
  a feed of people with sentence titles, a menu on every row, an attachment from ButtonGroup, two
  buttons, a stack, a progress and a quote; a dated log; releases by month; a workflow across a
  scrolling area; the feed in a Sheet. Components/Timeline: Matrix, People, Log, Releases, Runs,
  In a sheet.
- A vertical `Stepper.Item` takes `children`: what a milestone carries under its label, with the
  rail running past it. The step's control is now its label stretched over the step, so a
  Collapsible or a button under it is a separate stop. Components/Stepper: Milestones.
- Toggle, ToggleGroup, ButtonGroup, Kbd, Separator, Skeleton and Spinner on the template.
  `Toggle` is on the Button's scale (`xsmall` 24, `small` 28
  the default, `medium` 32; the old `small`/`medium` were 24/28) with an `icon` slot and
  explicit props. `ToggleGroup` takes `size` (`small` 28, `medium` 32) and items take `icon`
  and `isIconOnly` (the label becomes the name and the tooltip). `ButtonGroup` takes `label`;
  `IconButton` takes `variant="primary"` for the chevron of a primary split. `Kbd` takes `label`
  for a glyph's spoken name and `Kbd.Group` holds a chord. `Separator` takes `isDecorative`.
  `Skeleton` takes `shape` (line, heading, circle, block), `width` and `height`, and its pulse
  stops under reduced motion. `Spinner` takes `large` (24px), `appearance` (subtle, inverse,
  inherit) and `delay`. Prototype: the two export buttons use `isLoading`; the record header's
  primary split chevron is an IconButton. Components/Toggle, ToggleGroup, ButtonGroup, Kbd,
  Separator, Skeleton, Spinner: Matrix, Dont.
- Pages, PageHeader, RecordHeader, Section, Card, Empty and PageSkeleton on the template.
  Every pattern has typed, described props. `Section` takes `count`;
  `Card` gains `Card.Body` for the standard inset; `Empty` takes `secondary` for a second way
  beside the action; `PageHeader`'s truncating line carries its full text as a tooltip;
  `RecordHeader`'s breadcrumb starts on the title's column beside the back chevron (it sat 4px
  off); `PageSkeleton` is drawn in the Skeleton's shapes. Patterns/Pages, PageHeader,
  RecordHeader, Section, Card, Empty, PageSkeleton: Matrix, Dont.
- `RecordHeader` on Josef's review is two lines: the trail, its parents (`crumbs`)
  and then the record's `id` as the current crumb, which is the way back; and the title's line,
  the name with the meta after it and the actions at the end. The back chevron is gone and the id
  has no line of its own; `back` and `breadcrumb` are deprecated. The space around the header
  tightens: the shell's Main pads `space.200` above at every width (was `space.300` and
  `space.400`), and the ShowPage puts `space.150` between the header and the tabs and
  `space.200` under them (were `space.200` and `space.300`). Prototype: the 22 record routes
  pass their parents as crumbs instead of a back link (a program's sub-pages: Programs, then the
  program). Patterns/RecordHeader, Pages: Matrix, Show.
- Related, Glance, Panel, PreviewRail, PreviewSheet, PreviewSplit, PickerSheet, RecordPicker and
  CommandPalette on the template. Every pattern has typed, described
  props. `Related` is a Card around an `Item.Group`: the rows are Items and link to their records,
  `size` is the group's (`compact` by default), and `Related.Row` is deprecated in Item's favour.
  `PreviewRail` draws the compact record header the PreviewSheet draws (`status` after the id,
  `subtitle` under the title), its close is an IconButton like the Sheet's, and it is an aside
  named "Preview" and the id, so two rails are two landmarks. `Panel` renders no heading when it
  has no title (an empty h2 before). `RecordPicker` and `CommandPalette` share a footer of Kbd
  keys. Patterns/Related, Glance, Panel, PreviewRail, PreviewSheet, PreviewSplit, PickerSheet,
  RecordPicker, CommandPalette: Matrix, Dont.
- `Related` on Josef's review is the card of linked records for a rail and for the body of a page:
  a header with the kind, the Count and the way to add one
  (`action`); `layout="list"` for a rail (Item rows) and `layout="cards"` for a page, a grid of
  `Related.Card` (a mark, the name as the link, the meta, one status, up to six properties, and
  the actions as icon buttons that show on hover and focus and always on a touch screen);
  `footer` for "See all"; and `empty` drawn as a compact Empty with a link icon, a title, a line
  and an action, never a line of grey text. `Item.Group` takes `labelledBy` for a heading drawn
  outside it and `flush` for rows inside a card: the hairlines and the hover fill span the card
  and the text sits at `space.200`. Patterns/Related: Matrix, A related table, Dont.
- `Empty` takes `size` (`default`, the framed block that replaces a table; `compact`, inside a
  card, a rail or a panel: the icon beside the text, no frame) and `icon`, a mark for what would
  be here in a neutral circle. Patterns/Empty: Matrix, Dont.
- `Command.Dialog` is a Radix Dialog of the kit's own, centred over the page near the top and at
  most `width` wide. Before, the width landed on the inner Command while the dialog's content
  spanned the viewport, so the palette and the record picker opened as a full-width white box
  with the list on the left. Components/Command: Dialog; Patterns/CommandPalette, RecordPicker:
  Matrix.
- The shapes on the template: Inspector, WorkPane, ActionBar and Block. Every shape has typed, described props. `Inspector`
  draws its rows as KeyValue, in both forms; the first group has no rule above in either.
  `WorkPane` takes `listWidth` for a short list, names its list landmark by `listLabel`, and its
  rows are Items: `WorkPane.Row` is an Item with a Dot and the id under the name, so the list is
  one Item.Group and the chosen row is the Item's active fill. `ActionBar` is the RecordHeader
  pinned: the trail ending in the id (`crumbs`; `breadcrumb` deprecated), the title with the
  context, the state axes as Facts (the first a Badge, the rest Indicators) and the actions, with
  every blocked action's reason written under the row instead of a native tooltip on a disabled
  button. `Block` shows a count of zero. Prototype: the wizard's scope list is a WorkPane at
  240px instead of its own grid; the control page's bar passes its parents as crumbs; two raw
  pencil buttons on Inspector groups are IconButtons. Shapes/Inspector, WorkPane, ActionBar,
  Block: Matrix, Dont.
- The Shell on the template. Every area, slot and item has a typed, described props type. `Shell.Profile`
  is a label without `onClick` and a button with it, no dead button. Closing the overlay side
  nav with Escape or the scrim returns focus to the toggle button. Shell: Matrix, Dont.
- The primitives on the template: Box, Stack, Inline, Flex, Grid, Bleed, Text and Heading, and the
  overview. A Box with a bold, bolder or
  boldest fill paints its text `color.text.inverse`, the warning bold `color.text.warning.inverse`,
  so a Text or a Heading inside needs no colour. The build emits
  `bleedTokens` and `BleedToken` from `space.negative.*`, and maps the negative ramp into the
  theme, so Bleed's classes (`m-negative-200`) read the negative token instead of negating the
  positive one; the nine `--ds-space-negative-*` properties were dead CSS in every bundle
  (the 2026-09-05 audit's finding). Every prop is described, so the tables
  say what each is for. A Matrix, a Dont and a Playground per family; the a11y gate runs over the
  eight matrices. Said on the pages and not built: margin, width and height props, a style prop,
  automatic layer stepping, a horizontal Stack, dividers, reverse, `alignSelf` and `order`, a column
  count per breakpoint, a page grid, a bold weight, italic, underline, truncate with a tooltip,
  hero heading sizes, a subtitle, an icon, a tone. Primitives/*: Matrix, Dont, Playground.
- Motion has one shape. Six durations by the size of the move (`micro` 70, `fast` 110,
  `medium` 150, `moderate` 240, `slow` 400, `slower` 700ms), three curves by whether the thing
  arrives, leaves or stays (`enter`, `exit`, `standard`), and a
  `motion.stagger` step of 20ms. `fast` was 120 and `medium` 180; `standard` was Ledger's own
  curve. Every entrance runs on the enter curve and every exit on the exit curve, a side panel
  leaving on standard because it stays nearby; the blanket dims in `slower` (`animate-dim-in`); a
  dialog arrives in `moderate` (`animate-dialog-in`); an Accordion or a Collapsible section
  animates its height to the size Radix measures (`animate-collapse-open`, `-close`), where it
  faded; the Shell's panel slides in below the large breakpoint and rises at it, the side nav's
  flyout slides in, and the panel's column transitions the page's grid; a Stat tile and a Related
  card rise, one `motion.stagger` step apart (`stagger-children`); a Switch thumb moves in
  `micro`; a tooltip fades in `fast`. Reduced motion collapses all of it. Tokens/Motion:
  Specimens.
- `color.background.input.pressed` is every field's fill on focus;
  the Banner's action takes `color.background.inverse.subtle.hovered` and `.pressed` under the
  pointer. The rest of the minted matrix, about forty tokens with no part yet, is accepted as open
  and listed on the Colour sheet with the part each waits for. Tokens/Color.
- Written rules: the surface and shadow pairing and the one shadow without a surface (Tokens/Color);
  the focus ring's geometry and how selection differs from focus (Tokens/Shape); an Icons page,
  the two sizes, Lucide's stroke, colour by the text beside it, names for icons that stand alone,
  and the pairing with type (Tokens/Icons).
- `Breadcrumb` takes `label`, "Breadcrumb" by default, so a second trail on a page, a chart's
  drill-down path, is a navigation landmark with a name of its own. Components/Breadcrumb.
- `Eyebrow` takes `as`: `h3` or `h4` when it heads a section, so the page's outline has it,
  `dt` when it labels a value. Fifty-four eyebrows the prototype drew by hand are `Eyebrow`,
  the section headings among them as headings. Components/Typography: Matrix, InRail.

### Chart
- `Chart.Frame`: the legend highlights a series on visible focus only, so the Expand dialog does not open with every series but the first legend item's dimmed; the dialog shows the title and the description once, not again in the Frame inside it.
- `Chart.Frame` takes `columns`: keys in the datum beyond the series, for the table twin and the CSV. A name beside the category (`place: "before"`), a total, a share, an owner after the series, each with its own `format`; numbers sit to the end. `ChartColumn` and `ChartValue` are exported.
- `Chart.Frame`'s drill-down path names its landmark "Chart path", now that Breadcrumb takes `label`; a page's own Breadcrumb and a drilled chart no longer share a name.

### Table

- `Table`: a frame that overflows, sideways or past `maxHeight`, is a tab stop with the focus ring on the keyboard, so the keyboard can scroll it: a landmark named "[the label], scrolls" when the table has a `label`, else a named group, since two landmarks cannot share a name. Axe's scrollable-region rule passes. Found through the chart's table twin.

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
- `Chart.Bar` takes `labels="end"`, a `target` key drawn as an ink mark across each bar (a
  bullet chart), a `line` series over the bars, and `[from, to]` values that float. Bars cap at 24px with
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
- Chart is on the template, checked with the data-visualization method's palette validator. Said on the page and not built:
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
  one lighter in dark. A hovered bar and a hovered slice take
  it in place of the 80% opacity. Tokens/Color: Chart.
- A series' own `format` (a fraction printed as a percentage in the tooltip, the card and the table), `delta` on Line and Area (each change from
  the point before, signed, in the tooltip and the card), and `summary` on the Frame (one sentence a
  screen reader hears as the figure's description). Components/Chart/Bar:
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

- The shell is a navigation system: `Shell` with `Banner`, `TopNav`
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
