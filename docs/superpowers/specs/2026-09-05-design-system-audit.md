# The system against the pros

An audit of `@ledger/design-system` 0.5.0 against Atlassian, Carbon, Base Web, HubSpot's UI extensions and Apple's Human Interface Guidelines, read on 2026-09-05, with a plan to close the gaps. The maturity check of 2026-09-04 walked the pages part by part; this one walks the API, the grammar, the foundations, the guidance and the governance as a whole, and asks where a second product would be let down.

Sources. Atlassian through its machine-readable bundles (`atlassian.design/llms.txt` and the seven `llms-*.txt` files it lists), 35 server-rendered pages and the package READMEs on unpkg, including all 82 rules of `@atlaskit/eslint-plugin-design-system`. Carbon through the raw MDX of `carbon-website` (about 90 pages: every element, guideline and pattern page, the component overview, Button on all four tabs, contributing) and the React, themes, type, layout and motion packages. Base Web through `baseweb.design` and the `uber/baseweb` repository (89 component pages, the seven guides, the versioning policy, the theme and token sources); the design half at `base.uber.com` is a client-rendered ZeroHeight site behind an authenticated API and could not be read. HubSpot through the `.md` twin of every UI-components page (53 standard, 10 CRM data, 3 CRM action, 5 app-page components, the three pattern pages, the SDK actions) and the CRM knowledge-base pages on the record layout. Apple's HIG and the first-principles page: see section 8. Ledger through the package source, the tokens, the lint plugin, the ratchet, the CI workflow and the prototype's 180 importing files, every claim with a file and line.

## 1. Where the system stands

Three findings frame the rest.

**The foundations are ahead of two of the four references.** DTCG tokens with a build, a contrast test in CI, an axe gate over every matrix, a lint plugin of fifteen rules, a docs ratchet that only tightens, logical properties throughout, no hard-coded colour anywhere, dark mode from the tokens alone, Radix under every behaviour. Base Web has three lint rules and no accessibility page; HubSpot publishes no tokens at all; Carbon ships no lint plugin. On these, Ledger is between Atlassian and Carbon, and closer to Atlassian.

**The API grammar is where a second product would be let down.** The guide says "props are the grammar" and names six of them; the code speaks nine size scales, five words for emphasis, six for the line under a title, four shapes for the `action` slot, six for `empty`, four types for `icon`, five change-handler names, and puts `isSelected` beside `disabled` in the same props block. None of the references is fully consistent either (the extracts record their slips), but Atlassian has one rule and holds it, and that is the bar. This is the largest body of work and the only one that breaks consumers.

**The surface is closed where the pros are open, and open where they are closed.** Roughly eighty of the hundred-odd exported parts are closed prop objects: no `id`, no `data-*`, no `aria-*`, no `ref`, no `testId`, and a third take no `className`. Atlassian gives every part `testId` and `ref`; Carbon spreads `...rest` and documents `data-testid`; Base Web has neither but lets you reach every sub-part by name. Ledger has none of the three. Meanwhile `Calendar`'s public type is the whole of react-day-picker, eight `Command` parts are cmdk's types, `toast` is sonner's API verbatim, and nine TanStack state types sit at the package root. A consumer can target nothing by test id but is coupled to four third-party version lines.

The rest, in order of cost to a second product: no seam for strings (forty-plus English literals); `Tabs` promising the ARIA pattern and implementing none of it; motion, elevation and focus tokens thinner than every reference; no content, patterns, testing, accessibility-foundations or lifecycle pages; the package `private: true` after five releases with the install story never exercised; the ratchet blind to forty lowercase exports and to the shapes and shell.

Read as first principles (section 8), the grammar problem is a conflation problem: three words that all mean loudness with two other ideas hiding under them, one word (`size`) meaning a height, a type ramp and a density, `label` meaning both the text a person reads and the name a screen reader speaks. Of sixteen questions a system should be able to answer, Ledger answers five, half-answers eight, and is silent on three: the minimum hit target, undo, and where an action lives besides where it was found.

## 2. What Ledger already does better, so the plan stays proportionate

| Ledger has | Who lacks it |
| --- | --- |
| DTCG token source, Style Dictionary build, one utility per token, `token()` typed | HubSpot (no tokens), Base Web (theme object, not type-closed, four colour generations shipped at once) |
| A contrast test over every text/background pairing in both modes, in CI | Base Web, HubSpot; Carbon publishes a table, does not test it in the open |
| axe over every matrix story in CI | Base Web (runtime `Unstable_A11y` only), HubSpot |
| Fifteen lint rules incl. no-margin, no-arbitrary-value, no-dark-variant, deprecated-name autofix | Carbon (none shipped), Base Web (three), HubSpot (sandbox rules only) |
| A docs ratchet with a template of eleven headings that only tightens | Everyone; Atlassian's is editorial, Carbon's is a checklist |
| One page per part with a generated props table | Carbon keeps props in Storybook only; Base Web has no anatomy, no states, no do/don't |
| Zero physical margin/padding properties, RTL by construction | Base Web (a 25-line guide), HubSpot |
| Zero hard-coded colour, zero `dark:` | Atlassian and Carbon enforce the same; Base Web and HubSpot do not |
| Every overlay, choice control and menu on Radix | Base Web and HubSpot hand-roll; Carbon hand-rolls with Downshift and Floating UI |
| A changelog naming the story for each change | Base Web (GitHub releases), HubSpot (none) |

Nothing in the plan below replaces any of this.

## 3. The API grammar

Read against the four references' conventions. Atlassian: every boolean is `is*`, `should*` or `has*`; emphasis is `appearance`; density is `spacing`; the accessible name is `label`; handlers are `on<Thing><PastVerb>(event, analyticsEvent)`; `testId` on everything. Carbon: bare adjectives (`disabled`, `invalid`, `open`), `kind` for emphasis, `size` on `sm|md|lg`, `labelText`/`helperText`/`invalidText`, `id` required on form controls, `...rest` spread. Base Web: bare adjectives for state, `is*` for transient state, `KIND|SIZE|SHAPE` constants, `overrides` everywhere. HubSpot: bare adjectives, `variant` for everything, `show*` for visibility. Ledger's guide (`docs/guides/component-library.md:73`) promises `tone`, `size`, `isSelected`, `isActive`; the code is below.

### 3.1 Booleans: two conventions in one props block

| Prefixed (`is*`, `has*`, `should*`) | Bare |
| --- | --- |
| `isSelected` ×7, `isActive` ×8, `isLoading` ×2, `isRequired`, `isDecorative` ×2, `isFullWidth`, `isCollapsible`, `isGroup`, `isCurrent`, `isOpen` ×1, `isExpanded` ×1, `isStatic`, `isIconOnly`, `isTooltipDisabled`, `hasChildren` ×2, `shouldWrap` ×1 | `disabled` ×19, `loading` ×17, `open` ×15, `checked` ×3, `pressed`, `expanded` ×2, `selected` ×2, `pending` ×2, `sticky` ×3, `flush` ×2, `inset`, `numbered` ×2, `met`, `emphasis` |

Evidence of both in one block: `chip.tsx:11-12` (`isActive` then `disabled`), `tabs.tsx:35-37` (`isSelected` then `disabled`), `tree.tsx:57-63` (`hasChildren`, `expanded`, `isSelected`: three conventions for three concepts), `timeline.tsx:200-202` (`isActive` then `emphasis?: boolean`, a boolean wearing an enum's name). Four words for "this one is open": `open`, `isOpen` (`panel.tsx:95`), `expanded` (`tree.tsx:59`, `table.tsx:465`), `isExpanded`. Three for "in flight": `isLoading` (Button), `loading` (every chart), `pending` (Dialog, AlertDialog). `isRequired` exists once (Field) and `required` nowhere; `readOnly` exists only as a CSS hook (`controls.tsx:122`); invalidity is `aria-invalid` and never `isInvalid`.

**Rule to adopt:** Atlassian's. State booleans are `is*`; behaviour a consumer opts into is `should*`; a sub-part's presence is `has*`. Rename `disabled → isDisabled`, `open → isOpen`, `loading/pending → isLoading`, `checked → isChecked`, `pressed → isPressed`, `expanded → isExpanded`, `selected → isSelected`, `sticky → isSticky`, `flush → isFlush`, `inset → isInset`, `numbered → isNumbered`, `met → isMet`, `emphasis → isEmphasised` (or fold into a `weight`), with `defaultIsOpen`/`defaultIsChecked` for the uncontrolled half.

### 3.2 Emphasis: five prop names, six value vocabularies

| Prop | Parts and values |
| --- | --- |
| `variant` | Button `primary\|secondary\|subtle\|danger\|link`; IconButton `primary\|secondary\|subtle` (no danger, no link); Avatar/Person/Avatar.Stack `neutral\|tinted\|bold\|gradient` (a decorative axis) |
| `appearance` | Badge `subtle\|bold`; Count `default\|primary\|important\|added\|removed`; Spinner `subtle\|inverse\|inherit`; Chart.Sparkline `line\|area\|bars` (a mark type); Progress segment `solid\|hatched` |
| `tone` | The status vocabulary `neutral\|information\|success\|warning\|danger` on thirteen parts; Banner three of the five; AlertDialog `primary\|danger` (button emphasis); DropdownMenu.Item `"danger"` only; RowAction `default\|danger`; Table.Id and column meta `brand\|subtle` (link emphasis); ChartTone adds `brand` and seven categoricals |
| `kind` | ColumnKind (data kinds); chart mark kinds `columns\|bars\|line\|area\|dots\|tiles` (a third spelling of what Sparkline calls `appearance`) |
| `frame`, `layout` | Stat.Grid `card\|band`; Related `list\|cards`; DataTable `auto\|fixed` |

`tone` is the one that carries meaning and is the system's real asset (one `toneClasses` table feeds seven parts). The slips are `tone` used for button emphasis (AlertDialog) and link emphasis (Table.Id), `variant` used for a decorative axis (Avatar), and `appearance` used for a mark type (Sparkline).

**Rule to adopt:** three words, each with one job. `tone` = the status vocabulary and nothing else. `appearance` = emphasis of a single part (Button `primary|secondary|subtle|danger|link`, Badge `subtle|bold`, Spinner, Count, Avatar `neutral|tinted|bold|gradient`). Anything that is a kind of thing rather than a loudness (`Sparkline` line/area/bars, chart marks) is `kind`. `variant` retires. AlertDialog's `tone` becomes `appearance` on its confirm button; Table.Id's `tone` becomes `appearance`. This matches Atlassian's `appearance` and Carbon's `kind` while keeping the tone table.

### 3.3 Size: nine scales

| Scale | Parts |
| --- | --- |
| `xsmall\|small\|medium` | Button, Toggle |
| `small\|medium` | IconButton, Input, NativeSelect, Select, Combobox, DatePicker, ToggleGroup, TextLink, Avatar.Stack |
| `small\|medium\|large` | Spinner, Progress, Timeline, Chart |
| `xsmall\|small` | Badge (`small\|xsmall` reversed on Tree) |
| `xsmall\|small\|medium\|large\|xlarge` | Avatar |
| `default\|compact` | Item.Group, Related, Empty (a density word under `size`) |
| `large\|medium\|small\|xsmall` | Text, Heading (a type ramp; required on Heading, optional on Text) |
| `number` | Chart.Donut (`donut.tsx:52`), beside siblings on the word scale; ChartSize means 120/200/320px height on Bar and 24/32/40px cell height on Heatmap |

Carbon holds one ladder (`xs|sm|md|lg|xl|2xl`) with three canonical heights; Atlassian one (`xxsmall…xxlarge`). Ledger's word ladder is right (`xsmall|small|medium|large`, `component-library.md:74`); the problem is that parts pick disjoint windows of it, one part uses a number, and three use `default|compact`.

**Rule to adopt:** one ladder, `xsmall|small|medium|large|xlarge`, every part taking a contiguous window and documenting its pixel per step on the Style table. `default|compact` becomes `spacing="compact"` (Atlassian's word for density; the kit already has `Density` as a reader setting, so the prop is the author's override and the setting is the reader's). `Chart.Donut.size` becomes `ChartSize` with `height` as the pixel escape, like its siblings. `Tree`'s reversed union is a one-line fix.

### 3.4 Text slots: five words for the line under a title

`description` (11 parts), `meta` (10), `subtitle` (4), `hint` (4), `note` (1), with `Item` carrying both `description` and `meta` (`item.tsx:38,40`), `Stepper.Item.meta` documented as "helper text", `Sheet.subtitle` doing what `Dialog.description` does, and `Stat.Tile.note` doing what `Card.Header.description` does. `title` means content on 36 parts and a native tooltip string on two (`stepper.tsx:102`, `progress.tsx:83`). `name` means a person's name (Avatar), a product name (AppLogo), a form field name (Select, Checkbox), an accessible name (Chart.Donut) and a data key (Chart.Scatter). `id` means a DOM id (Eyebrow, Shell areas), a record identifier shown as content (Item, Glance, RecordHeader, WorkPane.Row, Table.Id) and an array (`Id.List.ids`).

**Rule to adopt:** `title` is the heading; `description` is the sentence under it; `meta` is the small secondary line in a row (time, count, owner); `hint` is a form field's helper text and nothing else; `subtitle` and `note` retire into `description`. `title` is never the native attribute; the two cases become `tooltip`. Record identifiers shown as content become `recordId` so `id` is always the DOM id (Carbon and Atlassian both reserve `id`). `name` on a chart becomes `label`.

### 3.5 Slots: one name, four types

- `icon` is `ReactElement` on IconButton, `ReactNode` on Badge/Empty/Panel, `ReactElement<{className}>` on Toggle/Timeline.Item, `ComponentType<{className}>` on Banner, `ComponentType<{className, strokeWidth}>` on the SideNav items. `<Banner icon={<Info/>}>` and `<Badge icon={Info}>` are both wrong, in opposite directions.
- `action` is `ReactNode` on seven parts, `ReactElement<{className}>` on Alert and Banner, an object on PickerSheet, an array of objects on ActionBar. A button cannot move between an Alert and a PickerSheet.
- `empty` is `ReactNode` (Item.Group, Combobox, WorkPane), `string` (Id.List), `string | EmptyProps` (Related), `{title, description, action}` (DataTable), and `emptyHint: string` (RecordPicker).
- `leading`/`trailing` on Item and InputGroup, `lead` on Related.Row in the same file that uses `leading` (`related.tsx:100,188`), `marker` on Timeline, `iconBefore`/`iconAfter` on Button only, `start`/`end` only as Shell sub-parts.
- The trigger is a prop on DropdownMenu (a node or a render function) and Popover (a node), and `children` on Tooltip and HoverCard.

Atlassian: `iconBefore`/`iconAfter` take component references everywhere they exist, `elemBefore`/`elemAfter` take nodes, `actions` is always an array of a typed shape, `trigger` is always a render prop on positioned surfaces. Carbon: `renderIcon` is always a component type. HubSpot: `overlay` binds a trigger to its Modal/Panel/Tooltip.

**Rule to adopt:** `icon` always takes a component reference (`ComponentType<IconProps>`) and the part sizes it; `iconBefore`/`iconAfter` where two slots exist; `leading`/`trailing` for arbitrary nodes at the ends of a row (and `Related.Row.lead` renamed); `action` is always a node, and where a part needs a typed action (ActionBar, PickerSheet) the prop is `actions: Action[]` with one exported `Action` type; `empty` is always `ReactNode | EmptyProps` with the part drawing a compact `Empty` from the object form (the Related shape is the right one); the trigger of every anchored overlay is `trigger`, taking a node or `(props) => node`.

### 3.6 Handlers and state contracts

Five change-handler names with no rule: `onChange` (Combobox, DatePicker, ToggleGroup, Editable), `onValueChange` (Select, RadioGroup, Accordion), `onCheckedChange` (Checkbox, Switch, Table.Selection), `onPressedChange` (Toggle), `onOpenChange` (Popover, Collapsible, Item, SideNav.Expandable); Toggle and ToggleGroup share a file and use two. `onSelect` means select a node (Tree), make a row a button (Item), activate (DropdownMenu.Item), and choose a datum with a payload (charts). Sixteen bespoke names (`onPick`, `onPreview`, `onBack`, `onSort`, `onToggle`, `onPageChange`, `onSearch`, `onClear`, `onConfirm`, `onRowClick`, `onCollapse/onExpand`, `onResizeStart/End`).

Overlay state has four contracts in one family: `Dialog`/`Sheet`/`Drawer`/`AlertDialog` require `open` and `onClose` and cannot be uncontrolled; `Popover` has `open`/`defaultOpen`/`onOpenChange`; `Tooltip`/`HoverCard`/`DropdownMenu` have `defaultOpen` only and cannot be controlled (`dropdown-menu.tsx:25`). `Combobox` requires `value` and `onChange` but has no `defaultValue`; `ToggleGroup`, `Pagination`, `Editable`, `Toolbar` are controlled-only; `Tabs` and `Tree` hold no state at all.

Carbon and Atlassian both give every stateful part the pair (`value/defaultValue`, `open/defaultOpen`, `selectedIndex/defaultSelectedIndex`). Base Web ships a `Stateful*` twin. Carbon's Modal is the one place the controlled-only contract is right and documented (`onRequestClose`: "the handler closes the modal by changing `open`"). Base Web's `onClose({closeSource})` is the best dismissal contract of the four.

**Rule to adopt:** every stateful part takes the pair and the change handler named for the state it reports: `value/defaultValue/onValueChange`, `isOpen/defaultIsOpen/onOpenChange`, `isChecked/defaultIsChecked/onCheckedChange`, `isPressed/…/onPressedChange`, `page/defaultPage/onPageChange`. `onChange` is reserved for text entry (Input, Textarea, Combobox's text). The blanketed overlays keep `isOpen` required (a dialog with no owner is a bug) and gain `onOpenChange(false, {reason: "close" | "escape" | "outside" | "back"})` beside `onClose`. `onSelect` is reserved for choosing a datum or item; a row that acts is `onPress`.

### 3.7 Widths, polymorphism, and the rest

- `width` is a pixel number on fourteen parts, `"medium" | "large"` on Dialog and Command.Dialog, `number | string` on Skeleton. Four bespoke widths (`idWidth` 72, `labelWidth` 104, `listWidth` 340, `defaultWidth`) and the defaults 420, 560, 640, 720, 760, 860, 880 are literals in components while `dimension.layout.*` tokens exist for 228, 272, 320, 340, 720. Atlassian's `EmptyState.width` is `narrow|wide`; Carbon's sizes are words with a published pixel. **Rule:** a word scale on the dimension tokens where the width is the part's (`width="narrow" | "default" | "wide"` on sheets, dialogs, menus, popovers), a number only where the layout owns it (table columns, `Skeleton`), and the four bespoke widths on a small named scale (`labelWidth="narrow" | "default" | "wide"`), which is the parked "pixel widths as props" decision in `docs/next.md`.
- `as` had four vocabularies at the time of the inventory: the five layout primitives on `LayoutElement`, `Heading` on `h1..h6|div|span`, `Text` on its own 12-tag union, `Eyebrow` on `div|span|p|h2|h3|h4|dt`, `Bleed` none. Atlassian whitelists per part and excludes `button` and `a` from `Box` so that `Pressable` and `Anchor` stay the interactive primitives. **Resolved in the primitives batch in flight (uncommitted, 2026-09-05):** `LayoutElement` on Box, Stack, Inline, Flex, Grid and Bleed (which now takes `as`), `TextElement` on Text and Eyebrow, `HeadingElement` on Heading, all exported from `primitives/_elements.ts`, `a` and `button` in none.
- `asChild` on seven parts, defaulting to `true` on `TextLink` alone (`text-link.tsx:8`), which throws Radix's "Slot failed to slot" on a string child. **Rule:** `asChild` defaults to `false` everywhere; TextLink takes `href` and renders `<a>` when no child element is given.
- `wrap` is an enum on Flex, a boolean on KeyValue and column meta, and `shouldWrap` on Inline. **Rule:** `shouldWrap` for the boolean, `wrap` for Flex's CSS enum.
- `style` is accepted by Box, Grid, Card, Skeleton, Avatar, Stepper and Id. Before the primitives batch it also came through the DOM rest props of Stack, Inline, Flex, Bleed, Text and Heading; the batch in flight refuses it there by design, and nineteen call sites (nine stories, ten prototype) moved a fixed width onto a Box. **Rule for the rest of the kit:** see section 4.

## 4. The surface: closed where it should be open, leaking where it should be closed

### 4.1 DOM passthrough, refs, test ids

Only 18 files extend a DOM element's props; about 80 exported parts are closed objects that silently drop `id`, `data-*`, `aria-*`, `onClick` and `style`. `Dialog` (`dialog.tsx:11-32`) cannot take a `data-testid` or an `id`. `forwardRef` is used nowhere and a `ref` prop is declared on 13 types (the eight primitives, Button, IconButton, three Table parts); `Item`, `Card`, `Select`, `Combobox`, `Tree.Item`, every overlay trigger and every pattern are ref-less. `testId` does not exist in the package.

Atlassian: `testId`, `ref` and `role` are "standard attributes" on every component and primitive; `className` is banned by lint. Carbon: `className` and `...rest` on everything, a "stable selectors" section, `data-testid` documented. Base Web: neither, and the documented test hook is `overrides.Part.props["data-testid"]`, which its own guide calls an escape hatch. HubSpot: `testId` on about fifteen parts.

**Rule to adopt:** every exported part takes `testId` (rendered as `data-testid` on its root), `id`, `ref` (React 19 ref-as-prop, so no `forwardRef` is needed) and the `aria-*` attributes that apply, through one shared `StandardProps` type; parts that are one element also spread `data-*`. `className` stays where it is today and is not added to the 32 parts that lack it: the lint's `no-non-token-class` already bounds what a class can say, and Atlassian's answer to "I need a class here" is a bounded `xcss`, which for Ledger is the token-utility allowlist. `style` is accepted only on the parts that take a computed dimension (Box, Grid, Skeleton, Avatar's hue, Table widths) and is documented as "runtime values only", Atlassian's rule.

### 4.2 Type leaks

| Leak | Where |
| --- | --- |
| `CalendarProps = ComponentProps<typeof DayPicker>`: the whole of react-day-picker is public API | `calendar.tsx:7` |
| Eight `Command.*` parts typed as cmdk's | `command.tsx:13,29,48,61,73,90,143` |
| `toast` re-exported from sonner verbatim; `Position` from sonner | `toaster.tsx:5,7` |
| Nine TanStack state types re-exported at the package root; the one `any` beside them | `data-table/index.ts:26-36`, `use-data-table.ts:30` |
| Checkbox, Switch, RadioGroup props extend Radix's (the docgen filter then hides those props) | `controls.tsx:258-268, 332-342, 408-421` |
| `Side`/`Align` on the three anchored overlays derived from Radix Content props | `tooltip.tsx:6`, `hover-card.tsx:7`, `popover.tsx:7` |
| Chart easing typed from recharts | `_shared.tsx:481` |

A minor bump of react-day-picker is a breaking change of `@ledger/design-system` with no way to see it. Carbon wraps Downshift behind `downshiftProps` marked "use with caution"; Atlassian re-exports nothing of react-select except through its own `Select` props; Base Web forbids overrides on the one part built on a third-party grid. **Rule:** the kit's public types name only the kit's props; third-party escape hatches, where kept, are one prop named for the library (`dayPickerProps`, `cmdkProps`) and documented as unstable.

### 4.3 Props types that do not generate

Eighteen exported components have inline object types and no exported `*Props` (Absent, Chart, CodeBlock, Command, DensityProvider, DensitySwitch, ModeProvider, ModeSwitch, Resizable and its two parts, ScrollArea, Textarea, Tiles, Toaster, TooltipProvider, and the drag helpers), plus every `Table` sub-part except Header and Cell. Their `<ArgTypes>` tables cannot render, which is why `Command.mdx` is 13 lines. `ThProps`/`TdProps` (`table.tsx:125,235`) break the guide's own "full words" rule; `PinnedProps` is composed into public types but not exported. Unions written as `keyof typeof …` on Badge, Count, Avatar, Command.Dialog, Text, Heading, Flex, Grid, Stack and Inline read as opaque. JSDoc coverage sampled: `disclosure.tsx` 2 of 14 props, `shell.tsx` 37 of 68 (`SideNav.Expandable` 0 of 6), `tabs.tsx` 3 of 10, against the guide's "every prop carries a JSDoc line". `argTypes` is set in 0 of 110 story files; `component` is missing on 14, including Command, Editable and Tabs.

Carbon's checklist: "Component has an interface with all props typed. Component interface is exported." Atlassian's Code tab is generated from the same. **Rule:** every exported part exports `<Part>Props`; sub-parts export `<Parent><Part>Props`; unions are written out; a lint rule (`ledger/props-documented`) fails a props member without a JSDoc line, run in the `package` preset only.

### 4.4 Deprecation has a mechanism for names and tokens, none for props

`ledger/no-deprecated-name` fixes renamed parts; `no-deprecated-token` fixes tokens. Five deprecated props ship with only a JSDoc tag: `RecordHeader.breadcrumb`/`back`, `ActionBar.breadcrumb`, `Stepper.Item.first`/`last` ("the flag does nothing"), and `Related.Row`. Carbon's `deprecate()` warns once per prop at runtime with a standard message and a codemod ships with every deprecation; Atlassian's `no-deprecated-apis` lints them. **Rule:** a `@deprecated` JSDoc on a prop is read by a new `ledger/no-deprecated-prop` rule (autofix when the tag names the replacement), the same way the ratchet already reads `@deprecated` on exports.

## 5. Behaviour and accessibility

### 5.1 Tabs

`tabs.tsx:24` sets `role="tablist"`, `:60` `role="tab"` and `aria-selected`; there is no `aria-controls`, no tabpanel part, no roving `tabIndex`, no `onKeyDown`. Every tab is a tab stop and the arrows do nothing, the opposite of the pattern the roles announce. The a11y gate does not catch it because axe cannot test keyboard behaviour. All three references implement the ARIA tabs pattern (Carbon and Atlassian with panels; Base Web with `Tabs (Motion)`). **Fix:** Radix Tabs underneath (`Tabs`, `Tabs.Tab`, `Tabs.Panel`), the link form keeping `asChild` on the trigger and a `role="navigation"` list instead of `tablist` when tabs are routes (Atlassian's `isNavigation` distinction on Breadcrumbs is the precedent).

### 5.2 The rest of the keyboard

Hand-written keyboard handling in seven places (`tree.tsx:89-152`, `shell.tsx:1018-1039`, `data-table.tsx:274,520,569`, `editable.tsx:98`, `selection-bar.tsx:35`, `chart/_shared.tsx:1027`); `tabIndex` rewritten imperatively in effects (`table.tsx:52`, `data-table.tsx:427-428,466`); no keyboard model on Stepper, Timeline, Item, ButtonGroup, Toolbar or Pagination. Carbon's text-toolbar pattern and Atlassian's Focusable both make a toolbar one tab stop with arrow keys inside; Carbon's progress indicator is one stop with arrows (the parked stepper decision). **Fix:** a `useRovingFocus` in lib used by Tree, Table, Toolbar, ButtonGroup, ToggleGroup and Stepper (the arrow model), so the six share one implementation and the effects go; a keyboard table on every page's Accessibility section, which the template has but the pages fill unevenly.

### 5.3 The accessible name

`label` is the visible text on sixteen parts, the required accessible name on nine, and an optional accessible name on twenty-one where passing it changes the role (`Progress`, `Dot`, `Avatar` and every chart become `img`/`progressbar` with it and `aria-hidden` without, `progress.tsx:28-30`, `badge.tsx:140`). `IconButton` takes `label` and omits `aria-label` from its DOM passthrough; `Toggle` takes `aria-label` and omits it too (`button.tsx:145`, `toggle.tsx:52`); `Select`, `Combobox`, `DatePicker`, `RadioGroup` re-declare the same three `aria-*` props inline four times (`AriaProps` exists at `controls.tsx:23` and is used once). Atlassian's rule is one word: `label` is the accessible name, rendered visually hidden, required on icon-only parts, and `VisuallyHidden` where phrasing matters; Carbon splits `label` (`aria-labelledby`) from `description` (`aria-describedby`) on Tooltip and names it. **Rule:** `label` is always the accessible name; visible text that happens to be the label is `children` or `title`; the semantic-toggling parts keep the behaviour but say it on the page under Accessibility and name the default ("decorative unless labelled"); `AriaProps` is composed, never re-declared.

### 5.4 Strings

Forty-plus English literals with no seam: "Close" ×5, "Cancel", "Confirm", "Loading", "Search" ×3, "Required.", "Choose a date", "Nothing matches.", "Nothing linked yet", "Nothing chosen yet", "Nothing here", "Nothing to show yet", "Actions", "More", "Skip to", "Collapse"/"Expand", "Download", "Resize column", "Preview row", "Reorder column", "Select all rows on this page", "From"/"To", "Show", "Details", "Preview", "Total", the whole `CommandKeys` footer, "Light"/"Dark"/"System", "Met"/"Not met", "Page N", "Previous page"/"Next page". About half are overridable through a prop default; half are literals. Atlassian makes every string a prop and has no catalogue; Carbon has `translateWithId` with stable ids ("changing an id is a breaking change") and function props on Pagination; Base Web has a `LocaleProvider` with thirteen per-component namespaces. Ledger serves several products in one language today, so the cheap, correct answer is Carbon's: **a `strings` object on one provider** (the Shell already mounts `TooltipProvider`; a `LedgerProvider` carrying mode, density, tooltips and strings is the natural home), every literal read through `useStrings()`, and the per-part prop where a caller needs a one-off. The string ids become part of the public API and the changelog.

### 5.5 What is already right and should be written down

Reduced motion is honoured in `motion.css`, `chart.css` and the chart hook; RTL is clean by construction (64 logical utilities, 0 physical); focus-visible is one utility on 33 files; ids come from `useId` in 18 places. None of this is on a page. Atlassian and Carbon both publish an accessibility foundations page (target, contrast rule, keyboard rule, testing matrix, what the system guarantees); Ledger's a11y is in the gate and in per-part sections but has no foundations page, no stated WCAG target, no testing matrix (screen readers, zoom, forced colours) and no RTL story.

## 6. Tokens and styles

- **A minted state matrix nothing reaches for.** A scan by token name, CSS variable and utility class across the package, the prototype, the tokens and the docs finds about 43 semantic tokens with no reference anywhere: `color.background.{danger,warning,success,information}.{hovered,pressed}` and their `.subtler.{hovered,pressed}`, `.bold.{hovered,pressed}` on three tones, `neutral.bold.{hovered,pressed}`, `brand.boldest` and its states, `brand.subtlest.{hovered,pressed}`, `selected.bold.{hovered,pressed}`, `inverse.subtle` and its states, `input.pressed`, `color.text.{danger,warning,success,information}.bolder`, `color.icon.warning.inverse`, `color.border.{inverse,information}`, and `elevation.surface.pressed`, `elevation.surface.overlay.{hovered,pressed}`. Atlassian mints the full matrix and uses it (a status background that hovers is a button); Ledger has no part that hovers on a status fill. Either the parts arrive (an `Alert` action on the tone's `subtler-hovered`, a selected `Badge`) or the tokens are pruned; minting without a consumer is what the maturity check called the ratchet's blind spot, at the token layer.
- **The negative space ramp is emitted and read by nothing.** `tokens.css` ships nine `--ds-space-negative-*` properties to every consumer; `theme.css` maps only the positive ramp, and `Bleed`'s generated `bleedTokens`/`bleedClasses` (`src/generated/space.ts`) are keyed by the positive names and emit Tailwind's `-m-*` negation. So `space.json`'s `negative` branch was dead CSS in the bundle, and seven of the nine names appeared nowhere. Atlassian's answer is the right one: negative tokens exist for code, and `Bleed` is preferred over them. **Resolved in the primitives batch in flight (uncommitted, 2026-09-05):** the build maps `space.negative.*` into the theme as `--spacing-negative-*`, Bleed's generated classes read them (`m-negative-200` is `margin: var(--spacing-negative-200)`) instead of negating the positive ramp, `bleedTokens` still names the positive token for the caller, and the Space sheet says the negatives are read by Bleed alone.
- **Fourteen draft palette steps alias nothing.** `color.neutral.1100`, `neutral.500A`, `darkNeutral.1100`, `darkNeutral.500A`, and five steps each of `teal` and `purple` (`100, 250, 300, 850, 1000`) have no semantic token pointing at them; `palette.json` marks them "draft ramp step, tune in step 1". Fourteen of 85 palette tokens is acknowledged draft weight, and the token sheet sign-off in `docs/next.md` is where it is settled.
- **Motion is thin.** Three durations (120/180/400) and one easing. Carbon: six durations and three easings in two styles, with a 20ms stagger rule and a 500ms ceiling; Atlassian: two duration bands, four named curves, semantic tokens that bundle duration + easing + property (`motion.popup.enter`), and a stagger primitive; Base Web: five easings with enter/exit assignments. **Adopt:** `motion.easing.{enter,exit,standard}` (Carbon's three, Atlassian's curves), `motion.duration.{fast,medium,slow,slower}` with the slow-02 band for dimming, and semantic bundles for the five things the kit animates (overlay enter/exit, sheet slide, collapse, fade, rise).
- **Elevation and focus have no written pairing rule.** Atlassian: "always pair `surface.raised` with `shadow.raised`", never sunken on raised, the focus ring 2px outside at radius + 2px, done by one primitive. Ledger has `elevation.surface.{raised,overlay,sunken}` and `elevation.shadow.{raised,overlay}` and a `outline-focused` composed utility, and no page says which goes with which or what the ring's geometry is. Write both on the Shape and Metrics token pages; add `border.width.selected` beside `focused` (Atlassian has both; Ledger draws selection with a fill and no border width token).
- **Icons have two sizes and no rule.** `dimension.icon` = 14 and 16. Atlassian: 16 in most cases, 12 sparingly for a closed list (chevrons, validation, tags); Carbon: 16 in components, 20 in expressive, 24/32 for larger, 44px targets. Ledger has no icon page at all (the maturity check scored Primitives, not icons). Write one: sizes, the stroke (`strokeWidth` appears in the SideNav slot type and nowhere else), pairing with type sizes, when an icon needs a label (all four references: "always pair icons with text").
- **The token files' roots.** `shape.json` has two roots (`radius`, `border`) and neither is `shape`; `elevation.json` has two (`elevation`, `utility`). 186 of 375 tokens carry `introduced: null`. One token is deprecated in the whole system, which is either very good or a sign the mechanism is unused.
- **A fifth of the chart palette is unauditable.** `color.chart.categorical.1…6` and their `.hovered`, `sequential.2…5`, the `diverging.*` set and the six tone `.hovered` tokens are reached only through `token(\`color.chart.${tone}\` as TokenName)` at `_shared.tsx:50,54,61,64`. The name-based scan reports them unused; they are used at runtime and nothing static can see it, which means `no-deprecated-token` cannot fix a chart token and the `.8 → .7` deprecation already made is invisible to the lint on the one file that matters. `ChartTone` should be a union of `TokenName` and the lookup a typed map.
- **Private CSS shipped as public.** Eight `shell-*` utilities in `layout.css` are read only by `shell.tsx`; `sticky-bar` has one reader; the lint allowlist marks them structural. Move them into the component's own stylesheet or prefix them `_`, so the public utility set is the token set.
- **Density.** Carbon's answer is `size` per part with "one size for all form controls on a page"; Atlassian's is `spacing="compact"` per part plus a theme axis; Ledger has both a reader setting (`Density`) and `default|compact` on three parts under the wrong prop. Section 3.3 covers the prop; the page should say which wins when both are set.

## 7. Docs, patterns, content and governance

### 7.1 Pages the references publish that Ledger does not

| Page | Atlassian | Carbon | Base Web | HubSpot | Ledger |
| --- | --- | --- | --- | --- | --- |
| Content: voice, casing, verbs, punctuation, errors, empty states | ✓ (six pages) | ✓ (three pages, 64 verbs) | – | scattered | Button and Empty pages only |
| A messaging decision matrix (which surface for which message) | ✓ | ✓ (seven types) | partial (System Banner's list) | – | Overlays "Which one" only |
| Patterns: common actions, dialogs, disclosure, empty, filtering, forms, loading, notifications, overflow/truncation, read-only, search, status indicators, disabled states | in component Usage | ✓ (17 pages) | – | 3 pages | Forms, Overlays, Pages overviews |
| Accessibility foundations: target, contrast, keyboard, testing matrix, what the system guarantees | ✓ | ✓ (four tabs + status per part) | – | – | per-part sections, no foundation |
| Testing: what to query, the test id, snapshot policy | lint rules | checklist (unit/VRT/AVT/manual) | – | testing utilities | – |
| Lifecycle: release phases, status per part, deprecation guarantee | ✓ | ✓ (PDLC, deprecations page) | inline banners | – | version policy paragraph |
| Changelog per part | ✓ tab | – | – | – | one file, story-linked |
| Icons page | ✓ | ✓ (library, usage, code) | 38 icons, one page | icon grid | – |
| Motion page with curves and durations | ✓ | ✓ | – | – | Motion tokens sheet (38 lines) |
| An AI/agent channel: llms.txt, CLI, MCP | ✓ (all three) | ✓ (MCP) | – | – | – |
| Playground with generated code | – | Storybook | ✓ Yard | – | Storybook controls |

### 7.2 The pages that exist and are thin

23 of 116 MDX pages are under 40 lines, all eight primitive pages among them (the parallel session is on these now: `git status` shows every primitive and its pages modified in the working tree, so this audit does not touch them). `Editable.mdx` 11 lines, `Command.mdx` 13, `Shapes.mdx` 14, `CodeBlock`, `Resizable`, `Toaster`, `ScrollArea` under 20. The 210 grandfathered gaps are 100% page headings across 21 families; the ratchet's `PAGE_FOLDERS` excludes `shapes/` and `shell/`, so the four shapes and the Shell are exempt from the template entirely.

### 7.3 Governance

- **Publishing.** `package.json` is `private: true` after five releases in four days; the guide's install story (the tarball, the registry) has never been exercised by a second repository. Base Web is the warning: a versioning contract the team stopped honouring. Ledger's policy ("until 1.0 a rename is a minor step, old name stays one version") is fine; what is missing is the act. Publish 0.6.0 to a registry (GitHub Packages is free for a private org) and add the consumer smoke test that already lives in the scratchpad to CI.
- **Status per part.** Atlassian's five phases with the no-silent-removal guarantee and Carbon's four PDLC statuses both surface on every page. Ledger has one changelog and `introduced` on half the tokens. Add `status` to each story's `parameters` (`stable | preview | deprecated`) and print it on the page and the sidebar.
- **The ratchet's blind spots.** It matches `^export (function|const) [A-Z]`, so about 40 lowercase exports (`useSort`, `usePage`, `toCsv`, `readView`, `applyMode`, `shellScriptFor`, `toneClasses`, `controlBase`…) are outside it, and 205 of 227 exported types are never named by the prototype. Extend it to hooks (a story or a Guidance page naming each) and prune the exports nothing uses (the `Chart*` flat set is exported from `chart/index.ts` but not the root while all eleven `*Props` are; `Tiles`; the drag internals).
- **Presets.** `cell-plain`, `id-not-blue` and `no-kit-shadow` do not run on the package's own code; `use-primitives` is a warning everywhere. Atlassian's `recommended` is the same for the system and its products.
- **Codemods.** Every rename so far has been applied by a script in a session scratchpad (`codemod.mjs`, `burndown.mjs`, `forms-required.mjs`, `rails-to-panel.mjs`). Atlassian ships `@atlaskit/codemod-cli` with `--since-ref`; Carbon ships `@carbon/upgrade`; Base Web ships codemods per major. A second product cannot take a rename without one. Add `packages/design-system/codemods/` with the transforms the lint cannot express, run from `npx ledger-upgrade`.
- **The agent channel.** Atlassian publishes `llms.txt` bundles ("you must only use tokens listed in this document"), a CLI and an MCP server; Carbon an MCP server. The package already has `docs.json` and generated utilities; emitting `llms.txt` from the build is a few hours and is how a second product's assistant learns the grammar.

### 7.4 The prototype as the tell

871 `className` overrides on kit parts, 87 of which fight the kit with padding, type or colour tokens; `Id` overridden ten times because it has no `appearance` prop (`coverage.tsx:102`, `composition.tsx:496` sets `text-brand` outside a link, the exact case `id-not-blue` exists for); `<dt>` rows drawn by hand at `width: 120` and `width: 104` beside `KeyValue` (`control-set-revisions.tsx:566`, `scope-tailoring.tsx:576`); 89 inline styles, almost all widths; 31 raw `<button>`s in six files. Each is a prop the kit lacks or a rule the lint does not hold. The plan's sweep items below name them.

## 8. First principles, and Apple's guidelines

### 8.1 The method, and what it says about the findings above

The first-principles article Josef sent tells the history as a method: Aristotle's advance was not a better answer to "what is everything made of" but an analysis of what the question meant, which showed that every earlier theory had conflated two kinds of principle (what things are made of and what makes them change); Descartes then failed by deducing three hundred principles from one foundation, and Newton succeeded with three that could be checked. Read that way, the grammar problems in section 3 are conflation problems, not naming problems. `variant`, `appearance` and `tone` are one word (loudness) spelled three ways, plus two other concepts (status, kind) hiding under them. `size` carries three ideas: a control's height, a type ramp, and density. `label` carries two: the text a person reads and the name a screen reader speaks. `title` carries two: a heading and a tooltip. `id` carries two: the DOM's handle and the record's number. `name` carries four. The fix in each case is the article's: define the term, split the categories, keep the generating set small (three emphasis words, one size ladder, one accessible-name prop), and make it checkable (the lint of sitting 1). Descartes' warning applies too: the plan's rules are few and enforced, not a taxonomy of hundreds; anything not in `Guidance/API grammar` is not a rule.

Apple's own principles as published today (Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, Delight) reduce, for a dense desktop product, to one sentence from the macOS page: "present more content in fewer nested levels and with less need for modality, while maintaining a comfortable information density." That is the WorkPane, the rail and the glance-peek-record ladder, and it argues against the Sheet as the answer to everything. Rams' "as little design as possible" and "thorough down to the last detail" are the two the system already lives by.

### 8.2 Sixteen questions a system should answer, against Ledger

| # | Question (from the HIG, Rams and the article) | Ledger | Where, or what is missing |
| --- | --- | --- | --- |
| 1 | What is the unit of hierarchy and how is it expressed? | partial | Type roles and weight on the Typography page; heading level decoupled from size (like Atlassian); no page says "hierarchy is weight and tone, never size" |
| 2 | What is the one signal for interactivity? | yes, scattered | "Blue means link, a bare id is never blue" (`id-not-blue`), hover surface for actions in place; in the guide's rules-in-the-head, not on a page |
| 3 | How many prominent buttons per view, distinguished how? | yes | "At most one primary per view"; style not size (one Button size per row is not written) |
| 4 | Is the list of text styles closed? | yes | `font.*` tokens and `no-arbitrary-value` |
| 5 | What is the spacing rhythm and its base? | yes | Space page, 8px base (the HIG publishes none for macOS) |
| 6 | What is the minimum hit target and why? | no | Controls are 24/28/32/36 and `pointer-coarse` reveals hover actions; no rule, no number, no padding rule (Apple: 28pt default, 20 minimum on macOS, 44 hit region, 12pt around bezelled controls) |
| 7 | What are the surface levels and what is each for? | partial | `elevation.surface.{raised,overlay,sunken}` exist; no pairing rule, no "which part sits at which level" |
| 8 | How is state shown without colour? | partial | Indicator is dot plus word, Gates speak, Dot takes a label; "never colour alone" is not written anywhere |
| 9 | What does every screen owe before content? | partial | PageSkeleton, Empty, Alert, DataTable's four states; not a rule that every view has loading, empty, partial and error |
| 10 | What is the modality ladder? | yes | The hover ladder and the Overlays "which one" page |
| 11 | Is destruction reversible; undo over confirmation? | no | AlertDialog for archive, delete, submit; no undo pattern, no toast with Undo |
| 12 | Where does every action live besides where it was found? | no | The palette exists; no rule that a toolbar or row action is reachable elsewhere |
| 13 | What is the keyboard contract? | partial | Kbd page, `Ctrl+[`, `⌘K`, the treegrid keys; no reserved-shortcut list, no product-wide table |
| 14 | Focus, selection and hover as three states; the focused row deleted? | partial | `outline-focused`, `selected` role, `hovered` tokens; one selection colour for focused and unfocused panes; nothing handles a deleted focused row |
| 15 | Narrowest and widest window, and the collapse order? | partial | The Shell overlays below 1024 and folds End below 768; no page-level breakpoints, no "inspector hides first" order |
| 16 | What must be true before a part ships? | partial | Story, matrix, template, axe, contrast; no keyboard test, no 200% zoom, no screen-reader pass, no glossary term |

Five answered, eight half-answered, three silent: the hit target, undo, and where actions live.

### 8.3 Apple's rules that Ledger contradicts or has not written

| Rule (page) | Ledger today | Do |
| --- | --- | --- |
| Pop-up is a value, pull-down is an action (pop-up-buttons) | Already split: Select/NativeSelect versus DropdownMenu | Write it on the Forms overview as the reason |
| Two selection colours: a selected row in an unfocused pane looks different (focus-and-selection) | One `color.background.selected` | `color.background.selected.subtle` for the inactive pane; WorkPane, Tree and DataTable draw it when focus is elsewhere |
| View options live in the view, not settings (settings) | Density is a setting beside the mode switch; columns are in the table's menu | Decision 17: density per table too (Carbon's `size` per table), the setting as the default |
| Avoid alerts for undoable actions; people only need to know when it fails; no timed dismissals (alerts, feedback, accessibility) | AlertDialog on archive/save/submit; success toasts; sonner auto-dismiss | Decision 16: a toast with Undo for reversible acts (Base Web: the button is undo or retry, never dismiss), AlertDialog only for irreversible, success toasts only when the result is off-screen, no timer on a toast that carries an action |
| Never OK; name the action (alerts; Carbon and Atlassian agree) | AlertDialog defaults `confirmLabel` to "Confirm" | Make it required |
| Don't give the primary role to a destructive button (buttons) | `danger` is a filled button; AlertDialog's confirm is filled red | Decision 13 |
| Style, not size, distinguishes the preferred button; one or two prominent per view | "One primary" written; sizes not | Write "one Button size per row" |
| Hide unavailable items in context menus; disable them in the menu bar | DropdownMenu.Item `disabled`, no rule | Row and kebab menus hide; page-level actions disable with the reason (ActionBar already does) |
| Ellipsis on a menu item that needs more input (menus) | No rule | Content page |
| Icons for all items in a group or none (menus) | No rule | Content page |
| Toolbar: at most three groups, text-labelled actions separate from icon-only ones | No rule on the Toolbar page | Toolbar page |
| Placeholder is not a label; match the field's width to the expected content (text-fields) | Field always has a label; "the width is the layout's" on the Input page | Decision 14 |
| Validate email on leaving the field, a password before leaving it (text-fields; Carbon: on blur) | Validation on submit only | Decision 15 |
| Errors: near the problem, say the fix, never "Invalid name", no "oops"; avoid "we" (writing) | Not written; Atlassian says use "we" | Decision 12 |
| Empty states carry next steps, never crucial information | Empty with action | Write the second half |
| Show something as soon as possible; avoid "loading" as a word | PageSkeleton; Spinner's default label "Loading" | Keep the label as the accessible name, say on the page that visible text names the task |
| Never a cascade of popovers; never a popover for a warning | No rule | Popover page |
| One sheet at a time; an alternative to Done | One AlertDialog over a Sheet is the allowed stack | Written already; add "never Cancel, Done and Back together" |
| No nested scroll in the same orientation | ScrollArea inside a scrolling page in the Inspector rail | Check the rail on a short viewport |
| Middle ellipsis keeps the beginning and end (lists-and-tables; Carbon's mid-line) | End truncation everywhere | Overflow pattern page: mid-line for paths and long names |
| Click a sorted heading to reverse; resizable columns; retain expansion state (outline-views) | Sort toggles; columns resize; views persist order, widths, pins; expansion not persisted | Persist Table.Tree expansion with the view |
| Column headings: nouns, no punctuation (Apple title-style; Carbon, Atlassian, HubSpot sentence case) | Sentence case | Decision 11 |
| Sidebar: at most two levels; a content list between sidebar and detail when deeper | The Shell page says no third level | Written already |
| Never hide the sidebar by default | Expanded by default, remembered | Written already |
| Highlight the current selection in each pane that leads to the detail | WorkPane rows carry `isActive` | Covered by the two-colour rule above |
| No scale on row hover; tint only | Tint | Written on the Table page? Confirm |
| Hide focus when the focused item disappears | Nothing | `useRovingFocus` moves focus to the neighbour, else the list |
| Selectable label text for ids, errors, addresses | `Id` has no copy affordance by decision | Confirm ids select as text (they are spans; they do) |
| No nested boxes (boxes; Carbon: no table in a table) | Card inside Card is possible | Rule on the Card page |
| Don't disable tabs; explain an empty section | `Tabs.Tab` has `disabled` | Tabs page: a tab with nothing shows an Empty, never disables |
| At most six tabs, five to seven segments; more than five options is a pop-up | No count rules | Tabs and ToggleGroup pages (Carbon: >5 options → select; HubSpot: >7 options gets a search) |
| Badges only for critical information | Counts in the side nav are grey | Written; keep |
| RTL: paragraphs align to their language, numbers never reversed, progress flips, logos and checkmarks do not | No RTL page, no RTL story | Accessibility page and a story per family (sitting 4) |
| Group a row for VoiceOver so it reads as one thing, not N cells | Item's link is the title alone; the "row's name" decision is parked | Apple's grouped example supports folding meta into the row's description (`aria-describedby`), not its name |
| Unique page titles; headings build the mental model | The Shell does not set `document.title` | A `title` on `Shell.Main` or the product's router; the rule on the Shell page |
| Don't override system shortcuts; keyboard-only work styles | `⌘K`, `Ctrl+[` | The keyboard contract page (question 13) |
| Hit region 44 on any input; 12pt around bezelled controls | `pointer-coarse` only | Metrics page: 24px minimum, 44 on coarse pointers, the gap rule |

### 8.4 Where the references disagree, so the choice is Josef's, not a rule

- **Capitalisation of column headings and menu items.** Apple: title-style. Carbon, Atlassian, HubSpot: sentence case everywhere ("UI elements are not proper nouns"). Ledger is sentence case. Keep it; record the choice on the Content page.
- **"We" in error messages.** Atlassian: "We couldn't load your page", to avoid blaming the reader. Apple: avoid "we" altogether, "Unable to load content". Carbon: second person, system as subject when passive reads better. All four agree on the rest: near the problem, say the fix, no please, no sorry, no oops.
- **Destructive as a filled primary.** Carbon has `danger` primary; Atlassian has `danger` appearance filled; Apple says never assign the primary role to a destructive action because people click primaries without reading. Ledger's AlertDialog confirm is the filled red.
- **Field width.** Apple and Atlassian: match the field to the expected content; Carbon: fluid to the column, single column; Ledger: the layout's.
- **Validation timing.** Apple and Carbon: on leaving the field; Atlassian: never disable submit, validate and instruct; HubSpot: `onInput` for validation. Ledger: on submit.
- **Success feedback.** Apple: only tell people when it fails; Carbon and Atlassian ship success toasts and flags with rules on timing; Ledger toasts on success.
- **Where density lives.** Apple: in the view; Carbon: per table; Atlassian: a theme axis plus `spacing` per part; Ledger: a reader setting.

## 9. The plan

Josef's cadence is one walk per sitting with a review between; the plan keeps that. Additive work first, breaking work with a lint fix and a codemod, the prototype swept only on a go. Nothing here touches the primitives layer until the parallel session's walk is committed.

### Sitting 0: the grammar, written before anything is renamed

A Guidance page, `Guidance/API grammar`, that states the rules of section 3 and 4 in one place, the way `Token grammar` does for tokens: booleans (`is`/`should`/`has`), the three emphasis words and their jobs, the one size ladder, the text slots, the slot names and their types, the handler names and the state pairs, `label` as the accessible name, `id`/`testId`/`ref` as standard props, `width` policy, `as` vocabularies, `asChild` default. Every later sitting cites it. Decisions in it are Josef's (section 10).

### Sitting 1: hold the grammar with lint, non-breaking

- `ledger/prop-grammar`: in the `package` preset, reports a boolean prop declared without a prefix, a `size` value outside the ladder, a `variant` prop, a change handler not in the named set, `title` typed as a string tooltip.
- `ledger/no-deprecated-prop`: reads `@deprecated` on a prop, autofixes when the tag names the replacement. Covers the five props shipping unpoliced today.
- `ledger/props-documented`: a props member without a JSDoc line fails, `package` preset.
- `cell-plain`, `id-not-blue`, `no-kit-shadow` into the `package` preset; `use-primitives` to error in the package, warning stays for products.
- The ratchet: lowercase exports need a story or a Guidance mention; `shapes/` and `shell/` join `PAGE_FOLDERS` (their headings grandfathered like the rest); `status` required in every story's parameters.

### Sitting 2: the standard props, additive

`StandardProps` (`testId`, `id`, `ref`, `aria-*` passthrough) on every exported part; `data-*` spread on single-element parts. Exported `<Part>Props` for the 18 inline types and the seven Table sub-parts; `ThProps`/`TdProps` become `TableHeaderProps`/`TableCellProps` with the old names deprecated; `PinnedProps` exported; unions written out; JSDoc to 100% under the new rule. `AriaProps` composed in the four places it is re-declared. `component` on the 14 story files. Wrap the leaks: `CalendarProps` becomes the kit's own with `dayPickerProps` as the marked escape; `Command.*` and `toast` likewise; TanStack types stop at `data-table/index.ts`.

### Sitting 3: the renames, one minor version, lint-fixed and codemodded

0.6.0. Booleans to `is*`; `variant` to `appearance`; `tone` back to the status vocabulary on AlertDialog and Table.Id; the size ladder with `spacing="compact"` replacing `default|compact`; `subtitle`/`note` to `description`; `lead` to `leading`; record `id` to `recordId`; the four `action`/`empty`/`icon`/`trigger` slot shapes unified; the handler names and the state pairs; `asChild` default false; `width` words on the dimension tokens. Each rename ships as a deprecation the lint fixes; the codemod package is born here with the transforms the lint cannot express, and the prototype is swept by it on a go. The changelog names every rename and its story.

### Sitting 4: behaviour

Tabs on Radix Tabs with `Tabs.Panel`; `useRovingFocus` under Tree, Table, Toolbar, ButtonGroup, ToggleGroup and Stepper, the imperative `tabIndex` effects removed, and focus moving to the neighbour when the focused row is removed; the overlays on one state contract with `onOpenChange(open, {reason})`; `LedgerProvider` with `strings` and `useStrings()`, every literal moved; `AlertDialog.confirmLabel` required; the inactive selection colour on WorkPane, Tree and DataTable if decision 18 says so; Table.Tree expansion persisted with the view; a `toast` with an Undo action if decision 16 says so. An RTL story per family with direction switched in the Storybook toolbar (Atlassian's Storybook addon does this).

### Sitting 5: the tokens' gaps

Motion durations and easings as section 6; semantic motion bundles; elevation pairing and focus geometry written on the token pages and held by a contrast-style test (surface.raised never without shadow.raised); `border.width.selected`; `dimension.width.{narrow,default,wide}` for the word widths; the icon page and `dimension.icon` with its rule; `introduced` filled on every token; chart tokens typed (`ChartTone` as a union of `TokenName`); the state matrix pruned to what a part reaches for or given the parts; `shell-*` and `sticky-bar` out of the public utilities; `shape.json`/`elevation.json` roots named for their files.

### Sitting 6: the pages

In order of what a second product reads first: `Guidance/Content` (voice; the capitalisation per element type in one table, sentence case throughout with decision 11 recorded; verb-first labels, the universal labels, no articles, no gerunds, no punctuation; the ellipsis on an item that needs more input; errors near the problem that say the fix, never OK, no please, sorry or oops, decision 12 on "we"; empty-state tone and "never crucial information"; truncation policy), `Guidance/Keyboard` (the reserved shortcuts never overridden, the product's own set, the roving-focus rule, what happens to focus when the focused row disappears), `Guidance/Messaging` (the matrix: Alert, Banner, Toast, Dialog, Empty, Gates against information/success/warning/danger), `Guidance/Accessibility` (WCAG 2.1 AA as the target, the 4.5:1/3:1 rule and the one exception already taken, keyboard, the testing matrix, what the gate covers and what it cannot), `Guidance/Testing` (`testId`, what to query, no snapshots), `Guidance/Lifecycle` (statuses, the deprecation guarantee, how a rename ships), then the pattern pages Carbon has and Ledger's screens already need: common actions (Cancel/Close/Delete tiers/Remove/Reset), disclosure, filtering, loading (skeleton vs spinner vs progress, with the delay), notifications (one banner, no timer for critical, one action per toast), overflow and truncation (the four-character rule, never on titles or labels), read-only versus disabled, search, status indicators (two of colour/shape/symbol; none when no action). The 23 stubs to the template, Shapes and Shell included. Changelog entries surfaced per part page from the one file.

### Sitting 7: shipping

`private: false`; publish 0.6.0 to the organisation's registry; the scratchpad consumer test into CI (`npm pack` → install → build → SSR render, already written); `llms.txt` emitted by the build from `docs.json` and the MDX; `status` printed on every page and in the sidebar. The RTL story and the a11y gate's keyboard cases (Playwright pressing arrows on Tabs, Tree, Toolbar) join CI.

### Prototype sweeps, each on a go

The codemod for the renames (sitting 3); `Id` overrides onto `Id appearance`; the two hand `<dt>` grids onto `KeyValue labelWidth`; the 31 raw buttons; inline widths onto the width words; the parked items in `docs/next.md` that this audit confirms (pixel widths as props, label-over-value grids, the dash by hand, exclusive chip sets).

### Verification

Each sitting ends with: `npm run lint` and `typecheck` in the package; `node scripts/ds-check.mjs` from the root with the allowlist no larger than before; `npm test` (contrast) and `npm run test:a11y` (axe over every matrix); the Storybook in both modes on the changed pages; for sitting 3, the prototype typechecks and lints after the codemod with zero `no-deprecated-*` findings; for sitting 7, the consumer smoke test green and `npm view @ledger/design-system` answering. No visual change is signed off without Josef's look at the rendered page.

## 10. Decisions waiting on Josef

1. **Boolean prefix.** Atlassian's `is`/`should`/`has` everywhere (recommended), or Carbon's bare adjectives everywhere. Either is defensible; mixing is not.
2. **The emphasis words.** `appearance` for a part's loudness, `tone` for status, `kind` for a kind of thing, `variant` retired (recommended); or keep `variant` on Button alone as the familiar word.
3. **`spacing="compact"` versus `size`.** The density prop's name (recommended `spacing`, Atlassian's), and whether the reader's `Density` setting or the author's prop wins when both are set.
4. **Standard props.** `testId`, `id`, `ref`, `aria-*` on everything (recommended); whether `className` is added to the 32 parts that lack it (recommended no) and whether `style` stays on the seven that have it (recommended yes, documented as runtime-only).
5. **Overlay dismissal.** `onOpenChange(open, {reason})` beside `onClose` (recommended), or Base Web's `onClose({closeSource})` alone.
6. **Strings.** A provider with a `strings` object (recommended) or props only (Atlassian's way, more surface, no catalogue).
7. **The state matrix.** Prune the 55 unused status-state utilities, or build the parts that use them.
8. **Widths.** A word scale on the dimension tokens (recommended) or numbers kept.
9. **Publishing.** Registry (recommended) or tarball only.
10. **The agent channel.** Emit `llms.txt` now or after the pages of sitting 6.
11. **Capitalisation of headings, menu items and segments.** Sentence case, as three of four references and the prototype (recommended), or Apple's title-style for column headings and menus.
12. **"We" in errors.** Atlassian's "we couldn't" or Apple's subjectless "Unable to load"; recommended Apple's, since the prototype's errors already name the object ("Required.", "Nothing matches.").
13. **The destructive confirm.** Keep the filled red confirm on AlertDialog (Carbon, Atlassian), or make it a secondary in the danger colour with the Cancel as the default button (Apple).
14. **Field width.** Keep "the width is the layout's" on Input, or adopt "match the field to the expected content" with a `width` on the word scale (short, medium, long) as Apple and Atlassian.
15. **Validation timing.** On submit only (today), or format errors on leaving the field and required-ness on submit (Apple, Carbon), with `useRequired` growing a `check` per field.
16. **Undo over confirm.** A `toast` with an Undo action for reversible acts (archive, remove from a list, status change), AlertDialog only for the irreversible, success toasts only when the result is off-screen, and no timer on a toast that carries an action; or keep confirmations everywhere.
17. **Where density lives.** The reader's setting only (today), or the setting as the default with `size` per DataTable as Carbon, and Apple's "view options belong in the view".
18. **An inactive selection colour.** `color.background.selected.subtle` for a selected row in a pane that does not have focus (Apple's two selection colours), drawn by WorkPane, Tree and DataTable; or one colour as today.

## 11. What not to copy

Base Web's `overrides` (every sub-part addressable by name is what the closed prop objects protect against, and its own guide calls it an escape hatch to be used with great caution); HubSpot's value aliasing (`xs | extra-small` doubles every union and produced `med`); Carbon's 143 components (Ledger builds against a named screen, which is the right rule); Atlassian's `appearance` stretched to shape and layout; Carbon's `id` required on form controls (Field generates them, Atlassian's way); a versioning contract not honoured (Base Web's `@next`); component radius switches in the theme (Base Web); `flush` in three grammatical roles (HubSpot).

## 12. Sources

The extracts behind this document are in the session scratchpad as `ref-atlassian.md`, `ref-carbon.md`, `ref-baseweb.md`, `ref-hubspot.md`, `ref-apple.md`; the package inventory with every file and line is the audit agent's report of 2026-09-05. Reference URLs: `atlassian.design/llms.txt` and `/foundations/*`, `/components/*`, `/release-phases`; `carbondesignsystem.com/elements/*`, `/guidelines/*`, `/patterns/*`, `/components/button/*`, `/contributing/*` via `raw.githubusercontent.com/carbon-design-system/carbon-website/main/src/pages/`; `baseweb.design/guides/*`, `/components/*`, `/discover-more/versioning-policy` and `github.com/uber/baseweb`; `developers.hubspot.com/docs/apps/developer-platform/add-features/ui-extensions/ui-components/*` as `.md`; `developer.apple.com/design/human-interface-guidelines/*`; `awiserworld.net/home/first-principles-a-brief-history/`.
