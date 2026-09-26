# Cross-cutting findings

Part of the [Ledger audit, 24 September 2026](README.md).

These four passes cut across families: the API, accessibility, the documentation, and performance and packaging. Four issues turned up in two passes and are written up once under both ids: API-3 with DOC-2, API-4 with A11-16, API-5 with DOC-12, and API-10 with DOC-5.

## API consistency

Ledger's API tooling is solid: a public-API baseline, axis-policy notes, type tests and deprecation fixers. The real gaps are in the overlays and the docs: Dialog and Sheet have no body part or width preset, PageHeader.Title cannot change its level, and Inspector has no page. Four misuses already ship and are cheap to stop with a lint rule or a default: `Button render={<Link/>}`, tone-only Badges, English strings in patterns, and parts that drop native props, refs or data-slot. Several naming complaints (`appearance`, `onClose`, family-relative sizes, `is*` booleans) are choices that axis-policy.json or the Atlassian and shadcn heritage records on purpose, and they need written rules per layer, not blanket renames.

**API-3, DOC-2 · Dialog and Sheet have no body part and no width preset** (high)

[dialog.tsx:62](../../../packages/design-system/src/components/dialog.tsx#L62), [Dialog.mdx:36](../../../packages/design-system/src/stories/components/Dialog.mdx#L36), [Sheet.mdx:31](../../../packages/design-system/src/stories/components/Sheet.mdx#L31), [picker-sheet.tsx:136](../../../packages/design-system/src/patterns/picker-sheet.tsx#L136), [create-task-dialog.tsx:265-272](../../../src/components/prototype/create-task-dialog.tsx#L265-L272)

DialogContent fixes `max-w-[520px]` with no width preset and no body part, and Dialog.mdx and Sheet.mdx tell callers to set the width through `style`, which lint does not read. So 20 of the 22 DialogContent and SheetContent in the product set an inline maxWidth at 12 pixel values from 480 to 1120, and 19 hand-built scroll regions use three padding recipes, only some with `overscroll-none`; PickerSheet, PreviewSheet and RecordBrowser repeat the region inside the kit. Widths drift in 40px steps with no rule, and every dialog re-implements the footer-outside-the-scroll rule, 16 of them also the pending rule (`showCloseButton={!busy}`).

Fix:

- Add DialogBody and SheetBody (the scroll region, padding, `overscroll-none`, `min-h-0`) and use them in the three kit patterns.
- Add a `width` preset (small, medium, large, xlarge, fullscreen; for example 400/520/760/960 on dimension tokens) to DialogContent and SheetContent, named as in axis-policy and Atlassian Modal, and align AlertDialog's size with it. Rewrite the two pages and migrate call sites by task, not by number; Popover and HoverCard widths stay runtime style.
- Handle pending dismissal with the app's [use-draft-guard.tsx](../../../src/components/app/use-draft-guard.tsx), not with a kit `isPending`.

**API-1 · Button accepts `render={<Link/>}`, and nothing enforces the buttonVariants rule** (medium)

[button.tsx:116](../../../packages/design-system/src/components/button.tsx#L116), [Button.mdx:50](../../../packages/design-system/src/stories/components/Button.mdx#L50), [work-common.tsx:153](../../../src/components/prototype/work-common.tsx#L153), [shell.tsx:269](../../../src/components/app/shell.tsx#L269), [schema-shell.tsx:64](../../../src/components/app/schema-shell.tsx#L64), [\_\_root.tsx:94](../../../src/routes/__root.tsx#L94)

Button passes `render` to Base UI's button with `nativeButton` left on, so a router Link rendered through it type-checks, logs Base UI's `expected a native <button>` error in dev and gets `type="button"` on the anchor (Space does not navigate). Button.mdx:50 says a button-styled link is `buttonVariants` on a real Link, but nothing enforces it, and four product sites use `render` instead. One is the missing-record state every record route reaches, where `/tasks/<missing id>` logs the error twice.

Fix:

- Add a lint rule, modelled on `ledger/text-link-navigation`, that rejects a Button or IconButton `render` of an anchor or router Link and points at `buttonVariants`. Migrate the four sites.
- Optional follow-up: a render-based LinkButton after Atlassian's (useRender plus buttonVariants, no Base UI button hook, no `isLoading` or `disabled`).

**API-2 · A tone-only Badge renders bold** (medium)

[badge.tsx:52-59](../../../packages/design-system/src/components/badge.tsx#L52-L59), [control-detail.tsx:63](../../../src/components/app/profile-tailoring/control-detail.tsx#L63), [components.tsx:50-52](../../../src/routes/components.tsx#L50-L52)

The default variant is brand and bold, and `tone` changes only the palette, so `<Badge tone="warning">` compiles and renders a loud bold pill. Badge.mdx says to add `variant="secondary"`, and the prototype does in 28 places. Four sites still use tone alone: the Withdrawn control state and the product's own Design system page.

Fix: Change the four sites to `variant="secondary"`. Then either warn in lint on `tone` without `variant`, or make that case resolve to `appearance="subtle"`, and document the choice on Badge.mdx and in axis-policy. Keep `variant`: the shadcn variant axis is a recorded decision.

**API-4, A11-16 · PageHeader.Title is always an h1, so previews copy it onto a raw h2** (medium)

[page-header.tsx:40-47](../../../packages/design-system/src/layout/page-header.tsx#L40-L47), [record-preview.tsx:196](../../../src/components/prototype/record-preview.tsx#L196), [preview-sheet.tsx:119-124](../../../packages/design-system/src/patterns/preview-sheet.tsx#L119-L124), [record-browser.tsx:311](../../../packages/design-system/src/patterns/record-browser.tsx#L311), [inspector.tsx:74](../../../packages/design-system/src/patterns/inspector.tsx#L74)

PageHeader.Title is a fixed h1 with no `render`, while the contract makes the preview's inner record title an h2. So record-preview.tsx renders a raw `<h2>` with PageHeader.Title's classes, PreviewSheet and RecordBrowser copy them too, and a change to the title never reaches previews. Across the kit the level is set five ways (`render`, `as`, a CardTitle div around a child h2, and a hard-coded h3 in Item.Group, Related and Inspector.Group), so the Details rail jumps from the page h1 straight to h3.

Fix:

- Add `render` (default h1) to PageHeader.Title and CardTitle, and replace the raw h2 and the two kit copies. Until then, record-preview uses `Heading size="small"` and the Shell story follows it.
- Let Inspector.Group, Item.Group and Related take a heading-level `render` or `headingLevel`. This follows heading-order practice; it is not a 1.3.1 failure.

**API-5, DOC-12 · Three size vocabularies: the same 28px control is `small` on Input and `sm` on Select** (medium)

[select.tsx:37](../../../packages/design-system/src/components/select.tsx#L37), [switch.tsx:7](../../../packages/design-system/src/components/switch.tsx#L7), [input-group.tsx:20](../../../packages/design-system/src/components/input-group.tsx#L20), [input-group.tsx:70](../../../packages/design-system/src/components/input-group.tsx#L70), [component-library.md:110-113](../component-library.md#L110-L113), [Toolbar.mdx:43](../../../packages/design-system/src/stories/patterns/Toolbar.mdx#L43)

component-library.md names the sizes xsmall, small, medium and large, but SelectTrigger and Switch take `sm | default` (SelectTrigger maps `sm` to the same 28px as Input's `small`). Toggle, AlertDialog and Card also use shadcn spellings and InputGroupButton takes `xs | sm | icon-xs | icon-sm`, so Toolbar.mdx has to explain that a Button says `size="small"` and a SelectTrigger `size="sm"`. The data attributes differ too, so InputGroup's `has-[[data-size=small]]` rule misses a Select, and `icon-xs` makes an icon-only button without the name IconButton requires.

Fix:

- Document each family's axis values in one table now, and add the missing families to axis-policy.json.
- Accept ControlSize on SelectTrigger and Switch. Move the other shadcn spellings to Ledger's full words with `@deprecated` aliases and a `ledger/no-deprecated-name` fixer, and give InputGroupButton an icon form with a required `label`.
- Keep AlertDialog's size as a width preset aligned with API-3. Do not merge Card, Empty, Item and Table density into one prop: axis-policy's size axis rejects that.

**API-8 · Compound parts are not exported by name, so their props never reach the docs** (medium)

[attachment.tsx:43-151](../../../packages/design-system/src/components/attachment.tsx#L43-L151), [related.tsx:158](../../../packages/design-system/src/patterns/related.tsx#L158), [kbd.tsx:31](../../../packages/design-system/src/components/kbd.tsx#L31), [kbd.tsx:41](../../../packages/design-system/src/components/kbd.tsx#L41)

AGENTS.md says to export parts by name or docgen loses them, yet Attachment's eight parts are module-private, and Related.Card, Inspector.Group, WorkPane.Row and Editable.Text and Select are reachable only through their namespace. MCP docs-show therefore lists root props only (nothing for Attachment.Media's `variant`), so the rule that a prop exists when ArgTypes shows it fails for dozens of parts and agents read source instead. Kbd's group is also exported twice, as Kbd.Group and as KbdGroup.

Fix:

- Export every namespace member's function by name (AttachmentMedia, RelatedCard, InspectorGroup and so on), and keep the namespace.
- Make ds-check fail when a namespace member has no named export. Leave the Kbd pair as it is, or mark one `@deprecated`.

**API-9 · About half the parts do not forward native props, refs or data-slot** (medium)

[id.tsx:5-11](../../../packages/design-system/src/components/id.tsx#L5-L11), [typography.tsx:40](../../../packages/design-system/src/components/typography.tsx#L40), [typography.tsx:64-78](../../../packages/design-system/src/components/typography.tsx#L64-L78), [timeline.tsx:194-234](../../../packages/design-system/src/components/timeline.tsx#L194-L234), [badge.tsx:248-277](../../../packages/design-system/src/components/badge.tsx#L248-L277), [card.tsx:14-22](../../../packages/design-system/src/components/card.tsx#L14-L22), [alert.tsx:16-27](../../../packages/design-system/src/components/alert.tsx#L16-L27)

component-library.md promises native props, refs and a data-slot spread last, but Id takes only children, className and style, Fact, Absent, CodeBlock, Eyebrow, Prose and Inspector are closed, Timeline.Item has no className, and Count and Indicator cannot take a ref. Ten families (Tree, Timeline, Stepper, Stat, KeyValue, Id, Typography, DatePicker, CodeBlock and DataTable) set no data-slot, and Card and Alert spread props after it, so a consumer can override the part's identity. A product cannot give an Id, a timeline row or a count a test id, a tooltip or a focus ref.

Fix:

- Type each rendered part as `ComponentProps<el> & Own`, spread the rest on the root, and put data-slot last.
- Add a package test that renders each export with a ref, a data-testid and a className and asserts that all three reach the root.

**API-10, DOC-5 · Inspector, the Details rail in 21 product files, has no page** (medium)

[inspector.tsx:59-94](../../../packages/design-system/src/patterns/inspector.tsx#L59-L94), [ds-check.mjs:18-20](../../../scripts/ds-check.mjs#L18-L20), [ds-check.mjs:101-107](../../../scripts/ds-check.mjs#L101-L107)

product-patterns puts every record's Details in an Inspector group, 21 product files render Inspector.Group 36 times, and Choosing and Recipes point at it, yet Inspector has no story and no page. Each rail therefore copies its props, heading level and sticky behaviour from a neighbour. ds-check passes because the Shell stories render Inspector.Group and it checks pages per story file, not per export, and the same gap leaves ActionBar and WorkPane with no page and no deprecation.

Fix:

- Add Patterns/Inspector with ArgTypes for Inspector and Inspector.Group and a Do/Don't, and give Group a className and native props.
- Make ds-check require a page for every exported catalog family, and fix its stale comment about the removed Block.
- Deprecate ActionBar and WorkPane, or give them pages. WorkPane first needs the two profile-tailoring pickers migrated.

**API-14 · Pattern strings bypass LedgerProvider messages** (medium)

[picker-sheet.tsx:76-80](../../../packages/design-system/src/patterns/picker-sheet.tsx#L76-L80), [record-browser.tsx:254-304](../../../packages/design-system/src/patterns/record-browser.tsx#L254-L304), [command-palette.tsx:81](../../../packages/design-system/src/patterns/command-palette.tsx#L81), [composer.tsx:92](../../../packages/design-system/src/patterns/composer.tsx#L92), [command.tsx:192](../../../packages/design-system/src/components/command.tsx#L192), [editable.tsx:261-262](../../../packages/design-system/src/patterns/editable.tsx#L261-L262)

PickerSheet builds "N chosen of M", "Back" and "Search" in English, and neighbouring parts use `useLedgerLocale().t`. The same goes for RecordBrowser's labels, CommandPalette's, Composer's Cancel, CommandDialog's description and Editable's multiline hint. A product with a translated LedgerProvider gets mixed-language pickers and screen-reader text, and PickerSheet's counts ignore plural forms.

Fix: Move the strings into defaultMessages with PluralForms. Add a package test that fails on a literal aria-label, placeholder or label inside patterns.

| Id     | Finding                                                                                                                                                                                                                                             | Where                                                                                                                                                                                                                                                                             | Fix                                                                                                                                                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API-6  | Destructive is `danger` on Button and RowAction and `destructive` on DropdownMenuItem, Alert and Badge, so a Delete button and the menu item beside it disagree.                                                                                    | [dropdown-menu.tsx:127](../../../packages/design-system/src/components/dropdown-menu.tsx#L127), [alert.tsx:6-13](../../../packages/design-system/src/components/alert.tsx#L6-L13)                                                                                                       | Accept `danger` as an alias on DropdownMenuItem and Alert with a fixer (as Carbon's `kind="danger"`), or document the split. Leave `appearance` as axis-policy records it.                                                                              |
| API-7  | Kit overlays close through `onClose: () => void`, so PickerSheet cannot tell Escape from an outside press. DatePicker and Editable `onChange` receive a value. Disclosure is `open`/`onToggle`, `expanded`/`onToggle` or `open`/`onOpenChange`.                          | [picker-sheet.tsx:24-27](../../../packages/design-system/src/patterns/picker-sheet.tsx#L24-L27), [date-picker.tsx:14-18](../../../packages/design-system/src/components/date-picker.tsx#L14-L18), [table.tsx:607-608](../../../packages/design-system/src/components/table.tsx#L607-L608) | Pass Base UI's eventDetails as an optional second argument to `onClose`, and keep `onClose`. Add `onValueChange` to DatePicker and Editable and deprecate `onChange`. Use `expanded`/`onExpandedChange` on Table.Group, Table.Tree and Tree.Item.       |
| API-11 | Toolbar.mdx lists DataTable.Search as a toolbar part, while DataTable.mdx says not to use it there. The Layout/Pages register builds its toolbar from an Inline, DataTable.Search and `ml-auto`, inside a Section.                                                        | [Pages.stories.tsx:308-324](../../../packages/design-system/src/stories/layout/Pages.stories.tsx#L308-L324), [Toolbar.mdx:112](../../../packages/design-system/src/stories/patterns/Toolbar.mdx#L112), [DataTable.mdx:20](../../../packages/design-system/src/stories/patterns/DataTable.mdx#L20) | Make Toolbar.mdx match DataTable.mdx. Rebuild the Pages register on Toolbar, with no Section around the only table. A `Toolbar table={table}` binding is optional.                                                                               |
| API-12 | Loading is `status` on Chart.Frame, `state` on DataTable, `loading` on plots and `isLoading` on Button. `status` is also a badge slot on PreviewSheet, Related.Card, TaskRow and Glance, and only charts have `refreshing`.                                               | [frame.tsx:172](../../../packages/design-system/src/patterns/chart/frame.tsx#L172), [data-table.tsx:72](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L72), [preview-sheet.tsx:37](../../../packages/design-system/src/patterns/preview-sheet.tsx#L37)            | When DataTable next changes, add `refreshing` to its state and give Chart.Frame a `state` alias for `status`. Keep `status` for the badge slot. No urgent rename.                                                                                  |
| API-13 | Boolean names mix `is*` and bare adjectives within one type: Tree.Item has `expanded` beside `isSelected`, and TaskRow has `completionDisabled` beside `isTooltipDisabled`.                                                                         | [tree.tsx:175-179](../../../packages/design-system/src/components/tree.tsx#L175-L179), [task-row.tsx:21](../../../packages/design-system/src/patterns/task-row.tsx#L21)                                                                                                                  | Write the rule by heritage in component-library's Naming section: Base UI-backed parts keep Base UI's bare names, and Ledger-authored parts use Atlassian's `is*` and `should*`. Fix only the mixed-within-one-type cases, with deprecated aliases. |
| API-15 | DataTable defaults to `responsive=false`, which every product table overrides under an app-only lint rule.                                                                                                                                          | [data-table.tsx:1013](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1013)                                                                                                                                                                                  | Consider making `responsive` the default (opt out with `responsive={false}`), and keep `ledger/product-responsive-table` until that ships. Keep the TabsList default.                                                                                 |
| API-16 | Item.Group spreads `aria-labelledby` onto a div with no role, while its own `labelledBy` names the list.                                                                                                                                             | [item.tsx:289-297](../../../packages/design-system/src/components/item.tsx#L289-L297)                                                                                                                                                                                                | Route `aria-label` and `aria-labelledby` to the `<ol>`, and deprecate `labelledBy`. Renaming Item's display `id` is optional: axis-policy's id axis permits it.                                                                                     |
| API-17 | Public optional props lack `\| undefined` (Count's `max` and `appearance`, RecordBrowser's `filters`, PreviewNavigation's `openLink`, LedgerLocaleOptions), so they fail to typecheck under exactOptionalPropertyTypes. The deprecated Profile `role` gets no warning. | [badge.tsx:245-247](../../../packages/design-system/src/components/badge.tsx#L245-L247), [locale-format.ts:172-178](../../../packages/design-system/src/lib/locale-format.ts#L172-L178), [top-nav.tsx:216](../../../packages/design-system/src/layout/shell/top-nav.tsx#L216), [index.js:274-321](../../../packages/design-system/eslint-plugin/index.js#L274-L321) | Add a package test that flags optional props without `undefined`. Extend deprecatedNames with prop entries, for example `{ "Shell.Profile": { props: { role: "description" }, fix: true } }`.                                                        |
| API-18 | The Dialog and Sheet close buttons, PickerSheet's Back and the DataTable pagination arrows are icon buttons hand-built from Button with an aria-label.                                                                                                          | [dialog.tsx:67-78](../../../packages/design-system/src/components/dialog.tsx#L67-L78), [sheet.tsx:117-126](../../../packages/design-system/src/components/sheet.tsx#L117-L126), [pagination.tsx:84-85](../../../packages/design-system/src/patterns/data-table/pagination.tsx#L84-L85)     | Use IconButton, with `isTooltipDisabled` where a tooltip is unwanted. This is maintainability only; touch targets are [responsive-2026-09-24](../responsive-audit-2026-09-24.md) #10.                                                                     |
| API-19 | component-library.md keeps ActionBar "for existing application consumers", but no product file uses it. The same page puts the Activity and Task stories in an application Storybook that does not exist, and the rail token's description names parts that have been removed.                                  | [component-library.md:29](../component-library.md#L29), [component-library.md:35-37](../component-library.md#L35-L37), [dimension.json:103](../../../packages/design-system/tokens/dimension.json#L103)                                                                                   | Deprecate ActionBar or give it a page, and fix the two paragraphs. Fix the description in tokens/dimension.json and regenerate.                                                                                                                         |

Already tracked:

- API-20, Stat has no consumer while the home page and the program workspace hand-build metric tiles: [docs/next.md](../../next.md) 'The dashboard's headline numbers' and 'Tinted count boxes' (2026-09-04).
- API-8, empty props tables for the Table and Tabs parts: docs/next.md 'Part props tables render nothing' (2026-09-05). Attachment, Related.Card, Inspector.Group and the doubled Kbd name are new, and are written up above.
- API-10, Inspector's root and Group as two unrelated APIs (the root renders nothing around Group children): docs/next.md 'Inspector's two forms' (2026-09-05).
- API-4, several h1s from PageHeader.Title in embedded collections: [design-consistency-audit-2026-09-16](../design-consistency-audit-2026-09-16.md).

## Systemic accessibility

The structure holds: skip links, named landmarks, one h1 per route, reduced motion, sticky-safe focus, and the kit Dialog's focus trap and return. Visual state is the weak layer: the record name link in every register with a preview loses its focus ring to the truncating cell, and menu highlight, toggle pressed and tree selection are faint tints that vanish in forced colours. In the app, create and edit dialogs drop focus to body, desktop route changes and preview opens leave focus behind, and DataTable result changes are never announced, because the kit has no shared announcer. Fix A11-1 and A11-2 first, then A11-4 and A11-5.

A11-16, PageHeader.Title's fixed heading level, is written up with API-4.

**A11-1 · The register's name link has no visible keyboard focus** (high)

[data-table.tsx:611](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L611), [text-link.tsx:43](../../../packages/design-system/src/components/text-link.tsx#L43), [utilities.css:986-989](../../../packages/design-system/src/generated/utilities.css#L986-L989), [tabs.tsx:112](../../../packages/design-system/src/components/tabs.tsx#L112)

A preview cell wraps the name in a `truncate` span and TextLink draws a 2px ring at a 2px offset, so the span clips the ring: on /campaigns at 1280px a truncated name shows no ring at all, and one that fits shows only a 2px bar on its right edge. The same holds on /findings, /risks, /evidence, /programs, /vendors, /profiles and /register, and at touch widths the always-visible eye no longer hints at focus either, so a keyboard user cannot see which record name has focus (2.4.7). Line Tabs also lose the top and bottom of their ring to the ScrollArea viewport, which is minor on its own.

Fix:

- Draw an inset ring on TextLink inside a DataTable cell, using the `outline-field-focused` geometry under a non-field name (Atlassian Focusable's `isInset` is the precedent). Or, as a progressive fix, use `overflow: clip` with `overflow-clip-margin` on the span. The no-margin rule rules out padding plus a negative margin.
- For line Tabs, inset the trigger ring or give the viewport block padding.
- Add a DataTable story with a TextLink in the preview column, with a play check that no overflow ancestor clips the focused ring's box.

**A11-2 · Keyboard highlight, pressed and selected states are faint tints that vanish in forced colours** (high)

[menu.ts:13](../../../packages/design-system/src/components/menu.ts#L13), [command.tsx:134](../../../packages/design-system/src/components/command.tsx#L134), [toggle.tsx:7](../../../packages/design-system/src/components/toggle.tsx#L7), [tree.tsx:294](../../../packages/design-system/src/components/tree.tsx#L294), [forced-colors.css:3](../../../packages/design-system/src/styles/forced-colors.css#L3)

Menu, Select, Combobox and Command items mark the keyboard highlight only with a 6% neutral tint (1.12:1, no outline), a pressed Toggle uses the same tint, and a selected Tree row is blue-100 at 1.10:1 with no other mark; forced-colors.css covers only Switch, RadioGroup, Tabs and Progress, so all three measure 1.00:1 in forced colours. In the app's Columns menu four rows look identical while one has focus, and the shell's mode switch shows its pressed state only as a barely tinted square (1.4.11, and 2.4.7 in forced colours). Table and DataTable selection is not affected, because the row checkbox carries it.

Fix:

- Give the keyboard-highlighted item an inset 2px outline in the focus token, as Atlassian and Carbon menus do. Give a selected Tree row a start-edge mark in `color.border.selected`, and a pressed toggle a border or icon change.
- Add forced-colours rules for `[data-highlighted]`, `[aria-selected=true]`, `[data-pressed]` and `[aria-current]`, extending [design-system-deep-audit-2026-09-18](../design-system-deep-audit-2026-09-18.md) #4, and run the forced-colours project over every family.

**A11-4 · The app's create and edit dialogs drop focus to body on close** (high)

[create-task-dialog.tsx:256-257](../../../src/components/prototype/create-task-dialog.tsx#L256-L257), [work-table.tsx:122-129](../../../src/components/prototype/work-table.tsx#L122-L129), [product-record-dialog.tsx:105-106](../../../src/components/prototype/product-record-dialog.tsx#L105-L106), [assessment-browser.tsx:110-130](../../../src/components/prototype/assessment-browser.tsx#L110-L130), [Dialog.mdx:26](../../../packages/design-system/src/stories/components/Dialog.mdx#L26)

When a dialog closes, Base UI returns focus to whatever had it before the dialog opened, but the app disables that opener while the form is open (assessment-browser's `disabled={!!form}`) or unmounts it, and only 3 of the 17 `<Dialog open` sites pass `finalFocus`. On /work, pressing Escape in Create task leaves focus on body, and so does typing, Escape and Discard; /campaigns behaves the same. After every create or edit, keyboard and screen-reader users start again from the top of the page (2.4.3).

Fix:

- Keep openers enabled and mounted, and guard repeat opens in the handler. Render a dialog beside the preview it came from, as [record-summary-preview.tsx](../../../src/components/prototype/record-summary-preview.tsx) does. Mounting the dialog itself conditionally is fine.
- Where the opener has to go, pass `finalFocus` to a stable element such as the eye or the panel, as Dialog.mdx:26 says. Add a test:patterns check that focus returns after Cancel, Escape and Discard.

**A11-5 · DataTable result and loading changes are never announced** (high)

[data-table.tsx:1266-1300](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1266-L1300), [toolbar.tsx](../../../packages/design-system/src/patterns/toolbar.tsx), [pagination.tsx](../../../packages/design-system/src/patterns/data-table/pagination.tsx)

DataTable, Toolbar and pagination have no aria-live, `role="status"` or aria-busy, and loading shows aria-hidden skeleton rows with no busy state. In the Register story, and on /profiles in the app, a live-region log stayed empty for a search that took the range from "1–8 of 24" to "1–3 of 3", for a search that ended in "Nothing matches" and for Next page. This is the example in Understanding 4.1.3, on the app's most-used pattern; the app's loading state already announces through QueryState.

Fix:

- Add one debounced polite status inside DataTable ("8 of 24 tasks", "No matching tasks") after search, filter, saved-view and page changes, routed through the announcer in A11-6.
- Set `aria-busy` on the table region while `state` is loading.

**A11-6 · No shared live-region strategy** (medium)

[field.tsx:173](../../../packages/design-system/src/components/field.tsx#L173), [preview-navigation.tsx:51-55](../../../packages/design-system/src/patterns/preview-navigation.tsx#L51-L55), [shell.tsx:286](../../../src/components/app/shell.tsx#L286), [program-wizard.tsx:260](../../../src/components/app/program-wizard.tsx#L260)

The kit has no announcer and no VisuallyHidden part, and FieldError renders `role="alert"` per field, so several invalid fields would fire several assertive alerts at once. PreviewNavigation announces "2 of 6 records" but not the record's name, and Editable, CodeBlock and RecordBrowser each keep their own status. The app hand-rolls 53 alert and 15 status elements, mostly inserted with their content already inside, which screen readers announce inconsistently, so what gets announced depends on the screen.

Fix:

- Add `announce(message, { politeness })`, backed by persistent polite and assertive regions that Shell or LedgerProvider mounts once (React Aria's LiveAnnouncer model). Use it for A11-5, A11-7 and PreviewNavigation's record title.
- Make FieldError polite and tie it to its control. On submit, focus the first invalid field and announce one summary. Document the rule on a Guidance page.

**A11-7 · Desktop route changes leave focus on body and announce nothing** (medium)

[shell.tsx:295-307](../../../src/components/app/shell.tsx#L295-L307), [Shell.mdx](../../../packages/design-system/src/stories/layout/Shell.mdx)

RouteNavigation moves focus to Main only below 64rem. At 1280px, following a campaign link changes the page and the title, but focus falls to body and nothing is announced. Screen-reader users are not told a new page loaded, and Shell's docs say nothing about route changes.

Fix: Add a router-agnostic Shell helper. It takes a location key, focuses the route's h1 (tabIndex -1) or Main, and announces document.title through the A11-6 announcer, so Shell stays free of application routing.

**A11-8 · On desktop, opening a preview leaves focus on the eye** (medium)

[panel.tsx:96-110](../../../packages/design-system/src/layout/shell/panel.tsx#L96-L110), [record-preview.tsx:133-137](../../../src/components/prototype/record-preview.tsx#L133-L137)

PanelSurface moves focus into the panel only at compact widths, so at 1280px pressing Enter on a row's eye opens the preview and leaves focus on the eye. On /campaigns it took 19 Tab presses through six rows to reach the panel, which would be about 75 for a 25-row page. A screen reader hears only "Preview row, toggle button, pressed".

Fix: When the eye is activated from the keyboard, move focus to the panel (the aside, or its inner h2) at every width, as compact and nested frames already do. Keep the return to the eye, which [test-preview-frames.mjs:136](../../../scripts/test-preview-frames.mjs#L136) asserts. Pointer activation can leave focus on the eye.

**A11-9 · DataTable headers add four tab stops per column, with names that repeat** (medium)

[reorder.tsx:165](../../../packages/design-system/src/patterns/data-table/reorder.tsx#L165), [table.tsx:314-345](../../../packages/design-system/src/components/table.tsx#L314-L345), [table.tsx:443](../../../packages/design-system/src/components/table.tsx#L443)

Each header has four tab stops: sort, "Reorder column", "{Column} column menu" and "Resize column". On /campaigns, six columns took 22 Tab presses before the first row. The grip and resize names are the same for every column, every eye is "Preview row", and the resize separator falls back to the browser's 1px ring.

Fix:

- Name each control after its column or row ("Resize Campaign column", "Preview WS-X90 …"), and give the resize handle `outline-focused`.
- Consider taking the grip and the handle out of the tab order, since the column menu already has Move left and Move right. The other option is a roving tabindex across a header's controls.

**A11-10 · In dark mode, a link inside a sentence differs from the text only by colour, at 2.0:1** (medium)

[text-link.tsx:43](../../../packages/design-system/src/components/text-link.tsx#L43)

TextLink underlines only on hover, even inside a sentence (`data-in-text`). Link against text is 3.40:1 in light mode, which with the hover and focus cues meets G183. In dark mode it is 2.04:1, so readers with low vision or colour-vision deficiency cannot find links in dark prose (1.4.1, F73).

Fix: Underline `data-in-text` links at rest, as Atlassian and Carbon do, or raise dark link-to-text contrast to 3:1 and add the pair to contrast.test.mjs.

**A11-11 · RTL: the table and navigation hard-code `text-left`, and nothing tests RTL** (medium)

[table.tsx:106](../../../packages/design-system/src/components/table.tsx#L106), [data-table.tsx:153](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L153), [side-nav.tsx:251](../../../packages/design-system/src/layout/shell/side-nav.tsx#L251), [top-nav.tsx:172](../../../packages/design-system/src/layout/shell/top-nav.tsx#L172), [preview.tsx:98-134](../../../packages/design-system/.storybook/preview.tsx#L98-L134), [vitest.config.ts:83-96](../../../packages/design-system/vitest.config.ts#L83-L96)

The table's `text-left` holds in RTL, so in the Moving columns RTL table the title sits at the cell's end edge while ID and Owner align right. DataTable maps `align="end"` to `text-right`, and the side nav, top nav, Item, Stepper, Timeline, Editable and Toast use physical classes too. Storybook has no direction global and vitest no RTL project, so about 20 hand-written stories are the only coverage.

Fix:

- Use `text-start`, `text-end` and logical insets. Sheet's `data-[side=right]:right-0` stays physical, because `side` names a physical edge.
- Add a lint rule against physical direction utilities in the package, a Direction toolbar global, and an RTL vitest project, without axe at first.

**A11-12 · The automated gate misses target size, narrow layouts, most forced-colour and RTL cases, and the app** (medium)

[vitest.config.ts:89-92](../../../packages/design-system/vitest.config.ts#L89-L92), [vitest.config.ts:107](../../../packages/design-system/vitest.config.ts#L107), [preview.tsx:78](../../../packages/design-system/.storybook/preview.tsx#L78)

Axe runs its default rules, which in axe-core 4.13 leave target-size (2.5.8) off, and the narrow layout projects run without axe by the choice made for [responsive-2026-09-24](../responsive-audit-2026-09-24.md) #3, so phone-only UI (the Toolbar's More, the compact panel, More fields) is never checked. The forced-colours project covers four families and asserts no states, there is no RTL project, and no app suite runs axe. Nothing asserts ring visibility, or focus return after a create or edit Dialog, so A11-1, A11-2 and A11-4 pass every suite.

Fix:

- Enable target-size globally, and run axe (or at least target-size) in the narrow project, alongside responsive-2026-09-24 #10.
- Widen the forced-colours project with state-visibility plays. Add `@axe-core/playwright` to test:patterns for each screen family, and add focus-return and ring-not-clipped checks to the dialog and table flows.

**A11-13 · Type and control sizes are in px, so the browser's text-size setting does nothing** (medium)

[tokens.css:300](../../../packages/design-system/src/generated/tokens.css#L300), [tokens.css:351](../../../packages/design-system/src/generated/tokens.css#L351), [tokens.css:357](../../../packages/design-system/src/generated/tokens.css#L357)

font.body is 13px, font.body.small 12px and dimension.control.medium 32px, while the breakpoints are in rem. Raising the browser's default font size therefore moves the breakpoints and leaves the text at 13px. Zoom still meets 1.4.4, but readers who enlarge the default font see no change; Atlassian's and Carbon's type tokens are in rem.

Fix: Express font sizes, line heights and control heights in rem (13px is 0.8125rem).

| Id     | Finding                                                                                                                                                                              | Where                                                                                                                                                                                                                                                                                      | Fix                                                                                                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A11-14 | A truncated cell reveals its full value only through `title`, and only on string preview cells and plain headers.                                                                    | [data-table.tsx:604](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L604), [table.tsx:286](../../../packages/design-system/src/components/table.tsx#L286), [table.tsx:300](../../../packages/design-system/src/components/table.tsx#L300)                                 | When a cell overflows, give it a reveal that works from the keyboard and on touch, such as a Tooltip on focus, or let readers choose to wrap a column. This is an enhancement, not a 1.4.12 failure.                                    |
| A11-15 | Dialog pins its header and footer at every height. At 320×256 (400% zoom) Create task leaves about 64px of form, and the first label is already scrolled away when it opens.         | [dialog.tsx:62](../../../packages/design-system/src/components/dialog.tsx#L62), [dialog.tsx:89-97](../../../packages/design-system/src/components/dialog.tsx#L89-L97)                                                                                                                          | Below a height threshold, let the header scroll with the body, or make the dialog full screen and keep only the footer sticky, as Carbon and Atlassian modals do.                                                           |
| A11-17 | Rows reorder only by dragging or through the grip's keyboard sensor, with no Move up or Move down. dnd-kit announces the row's uuid, and the splitters take only drag or arrow keys. The app reorders columns, not rows, today. | [reorder.tsx:85-100](../../../packages/design-system/src/patterns/data-table/reorder.tsx#L85-L100), [table.tsx:800-833](../../../packages/design-system/src/components/table.tsx#L800-L833), [columns-menu.tsx:50-87](../../../packages/design-system/src/patterns/data-table/columns-menu.tsx#L50-L87) | Add Move up and Move down to the row actions when `reorderRows` is set. Announce a row label (a `getRowLabel` option) and the column's header text. Consider width presets for the splitters.                            |

Already tracked:

- A11-3, the checkbox and radio borders are 1.9:1 against their surface (`color.border.bold` would give 3.94:1), which fails 1.4.11 for the control's boundary: [docs/next.md](../../next.md) 'The choice controls on the lighter border', and [design-system-audit-2026-09-18](../design-system-audit-2026-09-18.md) P3, the resting-border contract. The decision is still open.

## Documentation and guidance

The Guidance layer is strong: pages are organised by need, llms.txt is drift-tested, and Overlays.mdx already answers which overlay to use. The biggest defect has one configuration cause: the Storybook propFilter drops every prop declared under node_modules, so the Base UI families show no generated props in ArgTypes or MCP, which makes AGENTS.md's promise false. The MCP snippets also import story-only helpers, and the app never mounts LedgerProvider, so c.date formats in UTC. The rest is low: drifted token, lint and README pages, stale Getting started text, and pages that contradict each other or the contract.

DOC-2 (overlay width guidance) is written up with API-3, DOC-5 (no Inspector page) with API-10, and DOC-12 (size vocabulary) with API-5.

**DOC-1 · The Base UI families have no generated props, though the agent contract says every part does** (medium)

[main.ts:19](../../../packages/design-system/.storybook/main.ts#L19), [AGENTS.md:9](../../../packages/design-system/AGENTS.md#L9), [Agents.mdx:28](../../../packages/design-system/src/stories/docs/Agents.mdx#L28), [Dialog.mdx:28-30](../../../packages/design-system/src/stories/components/Dialog.mdx#L28-L30), [Tabs.mdx:64-66](../../../packages/design-system/src/stories/components/Tabs.mdx#L64-L66)

The propFilter drops every prop declared under node_modules, which removes Base UI's props along with React's HTML attributes, so about 20 Base UI family pages have no ArgTypes: MCP docs-show returns no props for Dialog, and only className, render and style for Tabs. AGENTS.md:9 says every part has generated props, and Agents.mdx:28 says a prop the docs do not show does not exist. An agent following that workflow either stops or infers props from shadcn or Base UI, which the kit forbids; the .d.ts files remain a fallback.

Fix:

- Keep the props from `node_modules/@base-ui/` and still drop `@types/react`, for example `prop.parent ? !/node_modules\/(?!@base-ui\/)/.test(prop.parent.fileName) : true`.
- Add `<ArgTypes of={...}>` for the Root, Trigger and Content parts on the 20 pages, then make AGENTS.md:9 true or reword it. Do not re-declare Base UI's interfaces by hand.

Related: [docs/next.md](../../next.md) 'Part props tables render nothing' covers the Object.assign parts (API-8).

**DOC-3 · The form recipe points at a Dialog story that is not a form** (medium)

[Recipes.mdx:43-51](../../../packages/design-system/src/stories/docs/Recipes.mdx#L43-L51), [Dialog.stories.tsx:34-50](../../../packages/design-system/src/stories/components/Dialog.stories.tsx#L34-L50), [Dialog.stories.tsx:101](../../../packages/design-system/src/stories/components/Dialog.stories.tsx#L101)

Recipes describes the create and edit Dialog (Field groups, first-field focus, validation on submit, a footer submit through `form`, an AlertDialog on dirty dismissal) and cites the Dialog Form story. That story has no `<form>`, no Field or label (its one input is named by aria-label), no submit and no validation, its body is a raw `<div className="p-250">`, and its PendingForm primary says "Save". MCP returns this story first for Dialog, and Patterns/Forms has no Dialog, so agents copy the opposite of the app's default create surface.

Fix: Replace it with a real form: a labelled Field, `form=` on the footer submit, errors shown on submit, pending protection, an AlertDialog on dirty dismissal, primitives instead of raw divs, and an operation label. Cite it from Recipes.

**DOC-4 · MCP snippets import story-only helpers from the package root** (medium)

[matrix.tsx](../../../packages/design-system/src/stories/_lib/matrix.tsx), [pair.tsx](../../../packages/design-system/src/stories/_lib/pair.tsx)

docs-show for Button shows `import { Button, Inline, Specimens, Stack, Text } from "@ledger/design-system"`, and Tabs does the same. Specimens, Matrix and Pair are story helpers, not exports: 75 story files import them, and matrix stories are often among the first three stories docs-show returns. Snippets also use undefined locals (popupRef and fieldRef in Dialog Form), so a copied example fails to compile, or an agent hand-rolls a Specimens wrapper in product code.

Fix:

- Make every family's first story a plain usage example with no `_lib` helpers.
- Give the matrix and Pair stories a `parameters.docs.source` override, or tag them out of the manifest.

**DOC-6 · LedgerProvider is undocumented and the app never mounts it, so dates format in UTC** (medium)

[locale.tsx:49](../../../packages/design-system/src/lib/locale.tsx#L49), [locale-format.ts:188](../../../packages/design-system/src/lib/locale-format.ts#L188), [columns.tsx:132-139](../../../packages/design-system/src/patterns/data-table/columns.tsx#L132-L139), [Shell.mdx:20](../../../packages/design-system/src/stories/layout/Shell.mdx#L20), [create-task-dialog.tsx:410](../../../src/components/prototype/create-task-dialog.tsx#L410), [work-table.tsx:104](../../../src/components/prototype/work-table.tsx#L104)

No page documents LedgerProvider, createLedgerLocale or the messages; only the README shows the provider, and Shell.mdx:20 names a LedgerLocaleProvider that does not exist. The formatter defaults to `timeZone = "UTC"`, c.date uses it, and the app never mounts the provider. Create task collects the due date in the reader's local time ("Uses your local timezone"), so an evening due time entered in a US time zone likely shows in My work as the next day.

Fix:

- Mount LedgerProvider in `__root.tsx` with the reader's Intl time zone. Rows load through the browser-only client, so date cells render client-side and cause no hydration mismatch. The other option is to store the zone on the account.
- Add a provider page (locale, timeZone, direction, messages, SSR parity) and a setup block in Getting started. Fix Shell.mdx:20, and stop showing `timeZone="UTC"` as the README's example value.

**DOC-7 · The PreviewNavigation page puts the record's name in the panel title** (medium)

[PreviewNavigation.mdx:8](../../../packages/design-system/src/stories/patterns/PreviewNavigation.mdx#L8), [PreviewNavigation.mdx:18](../../../packages/design-system/src/stories/patterns/PreviewNavigation.mdx#L18), [Shell.mdx:29](../../../packages/design-system/src/stories/layout/Shell.mdx#L29), [Recipes.mdx:36-37](../../../packages/design-system/src/stories/docs/Recipes.mdx#L36-L37)

PreviewNavigation.mdx:8 says the panel title is the record's name, while Shell.mdx:29, Recipes and product-patterns keep the outer bar to navigation and put the name in the inner header's h2. Line 18 says focus stays on the control, but the contract moves it to the remaining enabled control at an endpoint. The stories float the control in the centre, never in a panel, so the page for the part that builds preview headers teaches the layout the contract forbids.

Fix: Rewrite the intro to match Shell.mdx:29. Add an in-context story: Shell.Panel with PreviewNavigation in Panel.Actions, Panel.Close and an inner PageHeader. Document the endpoint focus rule.

| Id     | Finding                                                                                                                                                                                                                                  | Where                                                                                                                                                                                                                                                                                                                                             | Fix                                                                                                                                                                                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOC-8  | Choosing, Recipes and Tabs contradict product-patterns and each other: a short list is a Table, linked records are Related, counts in tabs are a Badge, and density is "never a prop".                                                 | [Choosing.mdx:86](../../../packages/design-system/src/stories/docs/Choosing.mdx#L86), [Tabs.mdx:88](../../../packages/design-system/src/stories/components/Tabs.mdx#L88), [DataTable.mdx:112](../../../packages/design-system/src/stories/patterns/DataTable.mdx#L112)                                                                                  | Point Tabs.mdx:88 at Count. Reword Choosing.mdx:86 around the task (ordered lineage, version selection), not the list's length. Change DataTable.mdx:112 to "not a DataTable prop; a useDataTable option or the reader's setting". Recipes may name DataTable as the other option; the kit need not adopt the app's rule. |
| DOC-9  | Pages document props and files that do not exist: `returnFocusRef` and `pending` on overlays, a TopNav.End that never folds (it has `overflow`), `multiSort` (the option is `enableMultiSort`), an app `useTableSearch`, and Box `background` (the prop is `backgroundColor`).                             | [Overlays.mdx:74](../../../packages/design-system/src/stories/components/Overlays.mdx#L74), [Shell.mdx:16](../../../packages/design-system/src/stories/layout/Shell.mdx#L16), [DataTable.mdx:131](../../../packages/design-system/src/stories/patterns/DataTable.mdx#L131), [DataTable.mdx:150](../../../packages/design-system/src/stories/patterns/DataTable.mdx#L150), [WhichToken.mdx:7](../../../packages/design-system/src/stories/docs/WhichToken.mdx#L7) | Fix each line, drop the reference to an app file, and regenerate llms.txt. Optionally, test the backticked `prop=` tokens in MDX against each part's declared props.                                                                                                  |
| DOC-10 | Token pages contradict the tokens. `--ds-shape-radius-medium` is really `--ds-radius-medium`, "rows 36" is really 40 (36 compact), 8px is called a quarter-rem, radius uses per part are wrong, and heading.medium is called "the only semibold".                                        | [Grammar.mdx:27](../../../packages/design-system/src/stories/docs/Grammar.mdx#L27), [Grammar.mdx:45-47](../../../packages/design-system/src/stories/docs/Grammar.mdx#L45-L47), [WhichToken.mdx:94](../../../packages/design-system/src/stories/docs/WhichToken.mdx#L94), [WhichToken.mdx:123-129](../../../packages/design-system/src/stories/docs/WhichToken.mdx#L123-L129), [shape.json](../../../packages/design-system/tokens/shape.json) | Fix Grammar and WhichToken against tokens.css. Keep Shape.mdx as the one radius-use table, link to it from the other pages, and correct the shape.json `$description` values.                                                                                                             |
| DOC-11 | Lint.mdx omits `no-native-confirm`, `text-link-navigation` and `dialog-footer-order`, and component-library.md omits `no-alpha-token`.                                                                                                     | [Lint.mdx:9-25](../../../packages/design-system/src/stories/docs/Lint.mdx#L9-L25), [component-library.md:120-138](../component-library.md#L120-L138), [index.js:760-813](../../../packages/design-system/eslint-plugin/index.js#L760-L813)                                                                                                                | Generate one table from the rules' meta and preset membership, including the app-only rules, and link to it from the other page.                                                                                                                                     |
| DOC-13 | llms.txt's list of "every value exported" holds 281 components out of 342 value exports. defineColumns, useDataTable, buttonVariants, toast and cn are among those missing.                                                                        | [llms.mjs:136-146](../../../packages/design-system/build/llms.mjs#L136-L146)                                                                                                                                                                                                                                                                          | Build the list from api/public-api.json (values and types, grouped by layer), or retitle the section "Components".                                                                                                                                                  |
| DOC-14 | Stories.mdx:40 says every family page has a Do/Don't, but 49 of 102 family story files have none. Migrated pages lead with provenance and app history, and skip when to use the part and how to word it.                                                               | [Stories.mdx:40](../../../packages/design-system/src/stories/docs/Stories.mdx#L40), [Dialog.mdx:8](../../../packages/design-system/src/stories/components/Dialog.mdx#L8), [Tooltip.mdx:44](../../../packages/design-system/src/stories/components/Tooltip.mdx#L44), [Typography.mdx:62](../../../packages/design-system/src/stories/components/Typography.mdx#L62)                   | Link every overlay page to Overlays.mdx. Add a Do/Don't Pair and content rules (title and verb, Cancel first) to Dialog, Sheet and the other migrated families. Move migration notes to a migration guide, and either enforce the Pair claim in ds-check or reword it.                              |
| DOC-15 | The repo guides describe an app Storybook and a `src/features/` folder that do not exist, link Pages.mdx at the wrong path, and keep stale README map rows.                                                                                           | [component-library.md:23](../component-library.md#L23), [component-library.md:37](../component-library.md#L37), [component-library.md:164](../component-library.md#L164), [README.md:51](../../../packages/design-system/README.md#L51)                                                                                                                    | Delete the app-Storybook sentences, fix the layer table and the link, and refresh the README's map rows.                                                                                                                                                          |
| DOC-16 | Choosing has no row for a date and time, a file upload, Scroller versus ScrollArea, or locale setup. FromShadcn's "Not in Ledger" omits Slider, Input OTP and time or date-range pickers.                                                                           | [Choosing.mdx:33-68](../../../packages/design-system/src/stories/docs/Choosing.mdx#L33-L68), [FromShadcn.mdx:50](../../../packages/design-system/src/stories/docs/FromShadcn.mdx#L50)                                                                                                                                                                 | Add rows that name the current answer: `Input type="datetime-local"`, `Input type="file"` with Attachment, Scroller versus ScrollArea, and LedgerProvider. Extend the list. Related: docs/next.md 'Typed date entry'.                                                         |
| DOC-17 | The Introduction skips Layout and Patterns and does not link Choosing or Recipes, and Choosing sorts fifth. MCP names Density "Table", Typography "Eyebrow" and the icon rail "Iconrail".                                                                   | [Introduction.mdx:17-22](../../../packages/design-system/src/stories/docs/Introduction.mdx#L17-L22), [preview.tsx:83-86](../../../packages/design-system/.storybook/preview.tsx#L83-L86)                                                                                                                                                              | Add Layout and Patterns with links to Choosing and Recipes. Order Guidance as Getting started, Choosing, Recipes, Which token and the rest. Set a component or title on the three metas.                                                                                                          |
| DOC-18 | Getting started says Breadcrumb is the first migrated family, declares an `Empty()` that shadows the kit's, and leaves the providers out of setup. Stories.mdx says Storybook 9, but 10.6.0 is installed.                                                                 | [GettingStarted.mdx:35-48](../../../packages/design-system/src/stories/docs/GettingStarted.mdx#L35-L48), [Stories.mdx:7](../../../packages/design-system/src/stories/docs/Stories.mdx#L7)                                                                                                                                                            | State the current export rule, rename the example, add a minimal root-setup block, and fix the version.                                                                                                                                                                 |
| DOC-19 | No part carries a lifecycle status, and ActionBar and WorkPane are exported without deprecation. Unreleased runs about 190 lines, including breaking migrations since 0.6.0.                                                                                      | [README.md:118](../../../packages/design-system/README.md#L118), [CHANGELOG.md:7-195](../../../packages/design-system/CHANGELOG.md#L7-L195)                                                                                                                                                                                                            | Render a status tag (experimental, stable, deprecated) on each page, as Atlassian and Carbon do. Cut 0.7.0 with a migration list, and deprecate ActionBar and WorkPane.                                                                                                       |

Already tracked:

- DOC-10, the radius.xlarge "Dialogs, sheets" drift: [docs/next.md](../../next.md) 'Four drifts the token pages found'. The rest of DOC-10 is new.
- DOC-14, overlay canvases that show only their trigger: docs/next.md 'Staged overlays in the docs'.

## Performance and packaging

Packaging is sound: dist is per-file ESM, only CSS is marked as a side effect, the production build carries no recharts or react-day-picker, and dnd-kit in the shared chunk is justified by the ten registers that reorder columns. The real defect is the DataTable render path: BodyRow's memo never bails out, and every responsive table re-renders on every pixel its container changes, so each preview open, side-nav toggle and splitter drag redraws the whole register every frame. Fix the memo (including a stable `onRowClick`), re-fit only when the fitted columns change, then virtualize the 1,196-row Change control baseline picker; the doubled workspace load happens only under dev StrictMode.

**PRF-1 · DataTable's row memo never takes effect** (high)

[data-table.tsx:698](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L698), [data-table.tsx:727](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L727), [data-table.tsx:1019-1024](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1019-L1024), [data-table.tsx:1056-1075](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1056-L1075), [data-table.tsx:1149](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1149), [DataTable.mdx:207](../../../packages/design-system/src/stories/patterns/DataTable.mdx#L207)

BodyRow is memoized and DataTable.mdx:207 promises that one checkbox redraws one row, but every render hands rows a new `leading` object, a new `layout` context value (which BodyRow and HeaderCell read), a new treeKeys handler for trees, and the inline `onRowClick` every product register passes. In Thousand rows one checkbox click re-rendered all 20 mounted rows, 160 cells and 27 menu and tooltip subtrees, and one keystroke on the 25-row WS-X90 Requirements tab rendered 1,786 components. Every selection, expand, active-row, search or page change redraws every visible row, which makes PRF-2, PRF-3 and PRF-5 worse.

Fix:

- Wrap `onRowClick` in a stable latest-ref callback, so consumers need no useCallback. Memoize `leading` on its four booleans, key the layout context value by its content, and wrap treeKeys in useCallback on `[table, direction]`.
- Add a story test that counts BodyRow renders with a React Profiler and asserts one row per checkbox click. Rows also need stable `data` and columns from the consumer (PRF-3).

**PRF-2 · A responsive DataTable re-renders on every pixel of container resize** (high)

[data-table.tsx:1048-1075](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1048-L1075), [responsive.ts:18-20](../../../packages/design-system/src/patterns/data-table/responsive.ts#L18-L20), [responsive.ts:45-47](../../../packages/design-system/src/patterns/data-table/responsive.ts#L45-L47), [shell.css:38](../../../packages/design-system/src/styles/shell.css#L38), [shell.css:228](../../../packages/design-system/src/styles/shell.css#L228)

The ResizeObserver stores the container width on every change and fitColumns gives all the slack to the identity column, so the layout changes at every pixel even when no column folds, while the Shell animates the panel's grid columns for 240ms and the side nav's width. On the WS-X90 Requirements tab at 1440px, opening the preview took 32 commits and 17,953 component renders with long tasks up to 160ms, a side-nav toggle gave 125ms long tasks, and ten splitter steps took 40,242 component renders (render counts do not depend on the dev build). The preview is the main collection workflow, and it opens with visible jank, as do side-nav toggles and splitter drags.

Fix:

- Leave the identity column unsized so CSS takes up the slack. Pins after it still need its width for their sticky offsets, so write that width as a CSS variable through a ref, not as React state.
- Fit inside the observer, and set state only when the result (ids, collapsed, the other widths, the released pin key) changes. Optionally re-fit on transitionend and throttle with rAF.

**PRF-3 · The Change control baseline dialog mounts all 1,196 controls, and each tick takes about 300ms in production** (medium)

[system-baseline.tsx:632-671](../../../src/components/prototype/system-baseline.tsx#L632-L671), [system-baseline.tsx:853-855](../../../src/components/prototype/system-baseline.tsx#L853-L855), [DataTable.mdx:91](../../../packages/design-system/src/stories/patterns/DataTable.mdx#L91)

The picker rebuilds its filtered rows, its columns and `rowSelection` on every render and uses useDataTable with no pageSize and no virtualize, so the NIST SP 800-53 Rev 5 Privacy baseline mounts 1,196 rows and about 14,100 DOM nodes in a 320px frame. In the production build each Space toggle took 296–344ms and each Tab 256–280ms (about 0.8s in dev, 32ms once a search left 4 rows), and tailoring a baseline means ticking many controls. DataTable.mdx:91 says to virtualize a thousand rows, but neither product guide mentions paging or virtualizing.

Fix:

- Set `virtualize: true` with the existing maxHeight. useMemo `catalogControls` and `shown`, and apply the search once (globalFilter or `shown`, not both).
- Derive the Selection cell from `row.getIsSelected()` and a memoized `base` set, and memoize the columns on `base` alone.
- Add a product-patterns rule: a collection that can exceed about 200 rows sets pageSize or virtualize.

**PRF-7 · The app over-fetches: about 4.3MB of JSON for the Requirements tab** (medium)

[models.ts:97-127](../../../src/lib/models.ts#L97-L127), [workspace.tsx:51-89](../../../src/components/app/workspace.tsx#L51-L89), [database.ts:68](../../../src/lib/database.ts#L68), [shell.tsx:109-111](../../../src/components/app/shell.tsx#L109-L111)

useRows requests `select=*` and pages whole tables into the client 1,000 rows at a time, one request after another, so a Requirements tab load made 41 calls totalling 4,367KB, led by controls, requirement_revisions and requirement_allocations. rpc/app_schema (379KB) is needed only by the schema inspector but loads on every route, and the shell loads all programs, risks and assessment findings for a command palette that is closed; the second copy of the workspace calls is dev-only StrictMode. Every first view waits on megabytes of unused rows and columns, and the cost grows with the tenant.

Fix:

- Select only the columns a screen uses, scope by program on the server, and use DataTable's manual (server) mode for large registers.
- Load app_schema only in /schema and /records, and load palette data with `{ enabled: searchOpen }`.

| Id     | Finding                                                                                                                                                                                              | Where                                                                                                                                                                                                                                                                                                                                                          | Fix                                                                                                                                                                                                                                 |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRF-4  | The locale formatters build a new Intl object on every call, once per date or number cell per render (88µs against 0.7µs with a cached formatter).                                                     | [locale-format.ts:192-213](../../../packages/design-system/src/lib/locale-format.ts#L192-L213), [columns.tsx:121-140](../../../packages/design-system/src/patterns/data-table/columns.tsx#L121-L140), [table.tsx:873-885](../../../packages/design-system/src/components/table.tsx#L873-L885)                                                                         | Cache formatters in createLedgerLocale in a Map keyed on `JSON.stringify(options)`, with the time zone included. Keep one PluralRules per locale.                                                                                 |
| PRF-5  | Every row mounts its own DropdownMenu, Tooltip and HoverCard roots, even while they are closed. One keystroke on the 25-row Requirements tab rendered 50 PreviewCard and 31 Tooltip roots.                                   | [data-table.tsx:516-531](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L516-L531), [data-table.tsx:569-592](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L569-L592), [button.tsx:283-295](../../../packages/design-system/src/components/button.tsx#L283-L295), [table.tsx:915](../../../packages/design-system/src/components/table.tsx#L915) | Share one row-actions Menu and one glance PreviewCard per table through Base UI's createHandle and trigger payload; the wrappers already forward them. Consider having LedgerProvider supply one DirectionProvider instead of one per popup. |
| PRF-6  | Toolbar tears down its ResizeObserver and re-measures synchronously on every parent render, because its effect depends on ReactNodes and the inline `onSearch`. One keystroke forced 4 layouts.                   | [toolbar.tsx:135-222](../../../packages/design-system/src/patterns/toolbar.tsx#L135-L222), [toolbar.tsx:67-94](../../../packages/design-system/src/patterns/toolbar.tsx#L67-L94), [product-collection.tsx:57-60](../../../src/components/prototype/product-collection.tsx#L57-L60)                                                                                   | Create the observer once and read the props from refs. Re-measure only on a real size change or when a cheap content key changes, and cache the views' natural width. Coordinate with the [responsive-2026-09-24](../responsive-audit-2026-09-24.md) #5 Toolbar change.                       |
| PRF-8  | A splitter drag writes localStorage, restyles the document and re-renders every Shell consumer on each pointermove: 10 moves gave 8 writes and 136 SideNavItem renders.                                    | [root.tsx:96-113](../../../packages/design-system/src/layout/shell/root.tsx#L96-L113), [root.tsx:237-276](../../../packages/design-system/src/layout/shell/root.tsx#L237-L276), [splitter.tsx:87-101](../../../packages/design-system/src/layout/shell/splitter.tsx#L87-L101), [storage.ts:46-63](../../../packages/design-system/src/layout/storage.ts#L46-L63)        | Persist on onResizeEnd, or debounce the write, and skip applyShell while dragging. Splitting the widths out of the context is optional; fixing PRF-2 is what removes the visible jank.                                                       |
| PRF-9  | DataTable.Presets counts every preset over every row on every render, whether or not the menu is open. On Requirements that is 4 presets over 640 requirements per keystroke.                                             | [filter.tsx:354-365](../../../packages/design-system/src/patterns/data-table/filter.tsx#L354-L365), [filter.tsx:386-433](../../../packages/design-system/src/patterns/data-table/filter.tsx#L386-L433)                                                                                                                                                              | Memoize the counts on `[table.getPreFilteredRowModel(), presets]`, and render the menu's list in a child that mounts only while the menu is open.                                                                                         |
| PRF-11 | Sparkline is documented for table cells but runs a full Recharts chart with a 400ms mount animation per instance. This is not measured, because the app has no charts yet.                                                  | [sparkline.tsx:57-170](../../../packages/design-system/src/patterns/chart/sparkline.tsx#L57-L170), [\_shared.tsx:546-559](../../../packages/design-system/src/patterns/chart/_shared.tsx#L546-L559)                                                                                                                                                              | Keep the ResponsiveContainer (responsive-2026-09-24 #11). Turn off the mount animation in dense contexts, or offer a lightweight SVG-path sparkline for cells.                                                                          |
| PRF-13 | The app's stylesheet carries about 7KB raw (about 1KB gzip) of rules that only stories use, because the package's `@source "../"` also scans the stories folder.                                               | [ledger.css:11](../../../packages/design-system/src/styles/ledger.css#L11)                                                                                                                                                                                                                                                                                        | Add `@source not "../packages/design-system/src/stories"` to src/styles.css. Or put the exclusion in ledger.css and add `@source "../stories"` to storybook.css. Leave the primitive class maps as they are.                                    |
| PRF-14 | useFillWindow re-measures, forcing a layout, on every animationend anywhere in the document.                                                                                                        | [use-fill-window.ts:40](../../../packages/design-system/src/lib/use-fill-window.ts#L40)                                                                                                                                                                                                                                                                           | Filter on the event's target containing the element, or remove the listener after the first entrance animation.                                                                                                                  |
