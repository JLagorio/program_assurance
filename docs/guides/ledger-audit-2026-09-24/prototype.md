# Prototype conformance

Part of the [Ledger audit, 24 September 2026](README.md).

Six units read every file under `src/components` and `src/routes` against the [product pattern contract](../product-patterns.md) and checked what they found in the running app. The structure holds. Every register and embedded collection goes through ProductCollection onto a `responsive` DataTable with a priority-0 RecordLink name and an eye, and previews take RecordPreviewActions fed by `useDisplayedRecords`. Record pages keep the two-line header, the Details rail on Overview and MissingRecord for a missing record; every TabsList is a named `line` strip; route files are thin and set the contract's browser titles; and every form guards dirty, pending and route-change states through useConfirmation, useBlocker and `beforeunload`. The drift is in what the reader meets inside that structure: raw enums, UUIDs, ISO timestamps and two spellings of a missing value; form errors in one sentence at the bottom of a dialog, tied to no field; flat heading outlines; dialogs that each pick their own width; tabs with no panels or no retained state; and hand-rolled alerts, empties, tiles and feeds. A few behaviours are dead ends: Publish makes an immutable version in one unconfirmed click, allocations and mappings cannot be removed, the task's Create comment dialog leads with seven pickers that can only fail the save, and a scope toggle vanishes in the one state that needs it. Most of the fixes are app work the kit already supports (Section.Title `render`, FieldError, Button `isSelected`, RadioGroup, DropdownMenuLinkItem, ButtonGroup, `keepMounted`, Timeline, Stat.Grid, QueryState, Alert). Several of the reference files the contract tells agents to copy carry the drift themselves: the task record, CreateTaskDialog, the requirements table and ProgramSystemsTree.

## Kit gaps the prototype works around

Each finding here needs a kit change. The app fix that can land first is named beside it.

**PA1-2 · The wizard's Systems & components tree hides the system name and scrolls the page sideways at 390px** (high)\
[elements.tsx:296-329](../../../src/components/app/program-wizard/elements.tsx#L296-L329), [:387-420](../../../src/components/app/program-wizard/elements.tsx#L387-L420); kit: [tree.tsx:334-337](../../../packages/design-system/src/components/tree.tsx#L334-L337)

Each Tree.Item's trailing slot holds a Badge, a profile or library summary with an inline `maxWidth` of 360 or 240, and the row menu, and the kit wraps trailing in a `shrink-0` span. At 390px the label measured 0px and the document 449px, so the row reads "System · NIST SP 800-53 Rev 5 High baseline · 5.2.0 · 370 controls ⋯" with no name or code, and the whole wizard, top nav included, pans sideways. The 24 September sweep missed it because it needs draft state in step 3.

Fix:
- Kit: let trailing shrink (`min-w-0`, its text truncating) while the label keeps a minimum share; only the actions stay `shrink-0`. If a secondary line is added, make it a part, not a prop.
- App: drop the inline `maxWidth` styles and move the profile, library or product summary out of trailing, to a secondary line or the element Sheet.

**PA4-2, PA2-20, PA1-6 · DataTable picks the wrong empty state when the narrowing is not its own filter** (high)\
Kit: [data-table.tsx:1203-1230](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1203-L1230); app: [system-requirements.tsx:242-267](../../../src/components/prototype/system-requirements.tsx#L242-L267), [system-evidence.tsx:330-351](../../../src/components/prototype/system-evidence.tsx#L330-L351), [work-table.tsx:118](../../../src/components/prototype/work-table.tsx#L118), [library-component-picker.tsx:24-32](../../../src/components/app/library-component-picker.tsx#L24-L32), [product-configuration-picker.tsx:22-30](../../../src/components/app/product-configuration-picker.tsx#L22-L30)

DataTable counts a table as narrowed only when its own column or global filter is set. On a system record, "Include everything inside" changes the data source, so with nothing allocated directly the bare empty drops the toolbar and the toggle with it: the WS-X90 boundary says "No requirements allocated here" while its preview counts "0 allocated · 640 including children" (PA4-2). My work opens on the "Assigned to you" column filter and greets a reader with no assignments with "Nothing matches / Clear the search or a filter" (PA2-20), and the wizard's two pickers, which filter their own items, answer a search miss with "Nothing published to add… Publish a product version" and no Clear search (PA1-6).

Fix:
- Kit: choose the bare empty from the pre-filtered row model, whatever filters are active, and let the caller declare narrowing or keep a scope control in the empty state (`empty.narrowed`, or a Toolbar scope slot). Change PickerSheet's doc comment ("the caller filters the rows") to recommend binding its search to the table's global filter.
- App: pass the scope toggle as `empty.secondary` while it is off and rewrite that empty's copy to match Allocate requirements; pass `empty.filtered` for Assigned to you ("Nothing is assigned to you", action All tasks); bind PickerSheet `search` to `table.state.globalFilter`, with unfiltered items and `total={table.getRowCount()}`, as the PickerSheet story does.

**PA2-10, PA3-14, PA5-10, PA1-13 · Every dialog sets its own width inline and rebuilds its scrolling body** (medium)\
Kit: [dialog.tsx:62](../../../packages/design-system/src/components/dialog.tsx#L62), [sheet.tsx:98-102](../../../packages/design-system/src/components/sheet.tsx#L98-L102); for example [create-task-dialog.tsx:265](../../../src/components/prototype/create-task-dialog.tsx#L265), [:272](../../../src/components/prototype/create-task-dialog.tsx#L272), [requirement-allocations.tsx:364](../../../src/components/prototype/requirement-allocations.tsx#L364), [:382](../../../src/components/prototype/requirement-allocations.tsx#L382), [library-products.tsx:974](../../../src/components/prototype/library-products.tsx#L974), [:990-994](../../../src/components/prototype/library-products.tsx#L990-L994), [control-picker.tsx:111](../../../src/components/app/profile-tailoring/control-picker.tsx#L111), [:121](../../../src/components/app/profile-tailoring/control-picker.tsx#L121)

DialogContent is fixed at `max-w-[520px]`, Sheet at 420px, neither has a body part, and Dialog.mdx tells callers to set width through `style`. Across `src/`, 16 dialogs use 11 inline widths from 480px to 1120px and 90vw, outside the token lint, and each copies `min-h-0 flex-1 overflow-y-auto` with one of three paddings to keep the footer outside the scroll. A dialog that forgets the wrapper clips its fields on a phone, as the [17 September audit](../pattern-audit-2026-09-17.md) saw.

Fix:
- Kit: add DialogBody and SheetBody parts that own the scroll region, padding and overscroll. Reopen the width decision for a small size scale on layout tokens (no free `size` value): the composition-only rule is not holding.
- App: move the dialogs onto the parts and drop the inline styles; use FieldSet for the pending lock instead of a raw `<fieldset>` behind an eslint-disable; share one labelled Combobox field instead of the duplicated TaskChoice and EvidenceChoice.

**PA1-8, PA2-6, PA3-15, PA4-10, PA5-6 · Heading outlines are flat inside previews, sheets and dialogs** (medium)\
Kit: [section.tsx:95-104](../../../packages/design-system/src/layout/section.tsx#L95-L104), [page-header.tsx:40-47](../../../packages/design-system/src/layout/page-header.tsx#L40-L47); app: [record-preview.tsx:194-202](../../../src/components/prototype/record-preview.tsx#L194-L202), [ssp-assembly.tsx:701-831](../../../src/components/prototype/ssp-assembly.tsx#L701-L831), [product-structure.tsx:550](../../../src/components/prototype/product-structure.tsx#L550), [editor.tsx:286](../../../src/components/app/profile-tailoring/editor.tsx#L286), [:420](../../../src/components/app/profile-tailoring/editor.tsx#L420), [system-assurance-details.tsx:311-320](../../../src/components/prototype/system-assurance-details.tsx#L311-L320)

Section.Title is always h2 and PageHeader.Title always h1, with no `render` on Title, so RecordPreviewPanel copies Title's class list onto a raw h2 that the no-kit-shadow rule cannot see. Every Section under a preview, sheet or dialog title then sits level with that title: the SSP control preview reads seven h2s, with "Contributing systems" and its child "Provisioning Workstation" at one level; the wizard's Tailored out, Tailored in and Effective control set are h2 siblings of the section that contains them; EvidenceFile hard-codes an h2 wherever it mounts. The system preview and program Overview also show authored descriptions as Section headings, where the contract wants labelled properties.

Fix:
- Kit: give PageHeader.Title `render` (useRender, like Lead and Section.Title), and add a heading-level context that Dialog, Sheet, PreviewSheet, Shell.Panel and Section raise and Section's `title` sugar reads. Prefer it to a `level` prop.
- App now: `Section.Title render={<h3 />}` under dialog, sheet and preview titles and in nested Sections (Eyebrow for item labels); `PageHeader.Title render={<h2 />}` in RecordPreviewPanel once Title takes it; a level for EvidenceFile; descriptions as labelled properties (Prose or KeyValue), updating the 17 September entry in [next.md:45](../../next.md#L45) that chose sections.

**PA5-12, PRT-8 · Dates are formatted three ways in two time zones** (medium)\
[work-format.ts:3-10](../../../src/components/prototype/work-format.ts#L3-L10), [record-tools.tsx:291-296](../../../src/components/prototype/record-tools.tsx#L291-L296), [requirement-record.tsx:327-329](../../../src/components/prototype/requirement-record.tsx#L327-L329), [tasks.$taskId.tsx:204](../../../src/routes/tasks.$taskId.tsx#L204), [:236](../../../src/routes/tasks.$taskId.tsx#L236), [index.tsx:195](../../../src/routes/index.tsx#L195); kit: [locale-format.ts:185-195](../../../packages/design-system/src/lib/locale-format.ts#L185-L195)

`c.date` cells format through useLedgerLocale, which is en-US in UTC because the app mounts no LedgerProvider. Previews and rails use `displayDate` (browser locale and zone), and edit history, ModelFacts and Portfolio use `toLocaleString` with seconds. West of UTC, a task due at 23:30 reads "Sep 13" in My work and "Sep 12" on its own record, and for a reader in the Americas an evidence version collected late in the evening UTC shows one day in the Collected column and the previous day in the preview.

Fix:
- App: mount LedgerProvider at the root with the reader's zone and locale, supplied once the client is ready or from a stored preference, so server and client agree ([README.md:90-98](../../../packages/design-system/README.md#L90-L98)). Route `displayDate`, `displayFact` and the timeline times through `useLedgerLocale().formatDate`, returning Absent for null.
- Kit (optional): export the internal LocalizedDate from `columns.tsx` as a small date part that renders `<time dateTime>`, so cells and properties share one implementation.

**PA2-11, PRT-7 · Missing values and enums render several ways, sometimes in one rail** (medium)\
[work-format.ts:3-11](../../../src/components/prototype/work-format.ts#L3-L11), [record-tools.tsx:290-318](../../../src/components/prototype/record-tools.tsx#L290-L318), [profiles.$profileId.tsx:340-341](../../../src/routes/profiles.$profileId.tsx#L340-L341), [:377](../../../src/routes/profiles.$profileId.tsx#L377), [programs.$programId_.export.tsx:102-105](../../../src/routes/programs.$programId_.export.tsx#L102-L105); kit: [typography.tsx:40-42](../../../packages/design-system/src/components/typography.tsx#L40-L42)

`displayDate` and `displayValue` return the string "Not recorded" while ModelTable and `c.date` render Absent ("—"): one /work row reads "Due — … Priority Not recorded", and the Suppliers preview shows "Not recorded" for an email its row shows as "—". Statuses switch between Badges and database tokens ("Status active", "State draft", "Severity low"), and timestamps appear raw ("Resolved at 2026-09-12T18:01:20.519+00:00"). Absent is a bare em dash, so a screen reader hears nothing or "em dash".

Fix:
- Kit: give Absent visually hidden text from the locale ("Not recorded").
- App: render Absent in ModelFacts and `displayFact` for null and route status keys through StatusBadge there. `displayValue` lives in `src/lib`, which may not import the kit, so it stays a string helper. Enums go through `labelFor`, dates as in PA5-12.

**PA4-11, PRT-5 · The program Overview and Portfolio hand-build Stat tiles** (medium)\
[program-workspace.tsx:250-295](../../../src/components/prototype/program-workspace.tsx#L250-L295), [:301-348](../../../src/components/prototype/program-workspace.tsx#L301-L348), [index.tsx:47-69](../../../src/routes/index.tsx#L47-L69), [:85-107](../../../src/routes/index.tsx#L85-L107); kit: [stat.tsx:33-61](../../../packages/design-system/src/components/stat.tsx#L33-L61)

The Overview's queue counts are raw bordered buttons with an ArrowUpRight glyph for an in-page tab switch, an unmuted zero and "…" while loading. Portfolio copies Stat.Grid's band and Stat.Tile's type tokens with Boxes and paragraphs: at 390px the first cell sits flush and the one below it indented, with no column divider, and loading writes "Loading…" into the value. Neither copy will pick up the Stat.Grid container fix ([responsive audit #1](../responsive-audit-2026-09-24.md)). The Overview also embeds the whole task register under "Program work › Tasks", duplicating the Schedule tab, with "Open schedule" twice.

Fix:
- Kit: an interactive Stat.Tile (`href` or `onClick`), and a loading and unavailable state for Stat.
- App: `<Stat.Grid frame="band" cols={4}>` with Stat.Tile on Portfolio and tiles on Stat.Grid on the Overview; replace the embedded WorkTable with a short Related list of next tasks or drop it; keep one Open schedule; render System boundaries as Related/Item, like the preview's Contains.

**PA5-8 · RequirementForm sniffs Editable's input events to know it has a draft** (medium)\
[requirement-form.tsx:164-194](../../../src/components/prototype/requirement-form.tsx#L164-L194); kit: [editable.tsx:32-43](../../../packages/design-system/src/patterns/editable.tsx#L32-L43)

Editable reports nothing until commit, but the host must know an uncommitted draft exists so useBlocker can confirm a route change. RequirementForm wraps each Editable.Text in a div that listens for native input and Escape events, so a change to Editable's DOM silently breaks the draft guard, and Editable.Select drafts are not tracked at all.

Fix:
- Kit: add `onEditingChange(editing, draft)` or `onDraftChange(draft | null)` to Editable.Text. A `readOnly` mode is optional.
- App: drive `track` from it, delete the wrapper div, and render read-only values with Absent.

**PA5-11 · Linking evidence forks a 90vw lookalike Dialog because RecordBrowser has no empty state** (medium)\
[requirement-evidence.tsx:239-318](../../../src/components/prototype/requirement-evidence.tsx#L239-L318); kit: [record-browser.tsx:246-249](../../../packages/design-system/src/patterns/record-browser.tsx#L246-L249)

RecordBrowser's only empty is a hard-coded "No matching records". When nothing is eligible, the screen opens its own near-fullscreen Dialog (`width: 90vw`, `height: 90dvh`) with a hand-bordered context box, raw notes and a lone Close, and it already differs from the browser it imitates.

Fix:
- Kit: give RecordBrowser an `empty` prop (illustration, title, description, action) separate from the filtered empty.
- App: pass the draft and publication guidance and Create evidence artifact through it.

**PA1-9 · Global search: ⌘K is not wired, and loading or failure reads as "No commands match"** (medium)\
[shell.tsx:112](../../../src/components/app/shell.tsx#L112), [:120-139](../../../src/components/app/shell.tsx#L120-L139), [:238-250](../../../src/components/app/shell.tsx#L238-L250); kit: [command-palette.tsx:31-38](../../../packages/design-system/src/patterns/command-palette.tsx#L31-L38), [:74-108](../../../packages/design-system/src/patterns/command-palette.tsx#L74-L108)

The shell keeps its own open state instead of useCommandPalette, so ⌘K and Ctrl+K open nothing, and Help and shortcuts lists no shortcuts. While programs, risks and findings load, the palette says "No commands match."; on failure the app's `<p role="alert">` renders behind the modal, outside its focus scope. The palette is titled "Command palette" under a trigger that says "Search programs, risks, and findings", and its "Findings" group holds assessment findings.

Fix:
- Kit: give CommandPalette `title`, `loading`, `error` (with retry) and `emptyMessage`.
- App: use useCommandPalette with a Kbd hint on the search button, list the real shortcuts in Help, render the error inside the palette, and name the group "Assessment findings".

**PA4-12 · The Lifecycle timeline wraps the kit Timeline in a second scroller and overrides its items** (medium)\
[program-timeline.tsx:56-121](../../../src/components/prototype/program-timeline.tsx#L56-L121), [:137-147](../../../src/components/prototype/program-timeline.tsx#L137-L147); kit: [timeline.tsx:124-147](../../../packages/design-system/src/components/timeline.tsx#L124-L147)

The horizontal Timeline already scrolls inside a Scroller with edge arrows. GateRail adds an outer focusable region with its own always-enabled arrows, forces item widths with `*:w-layout-rail *:shrink-0` and wraps titles itself, so at 390px one gate shows two sets of arrows and two consecutive tab stops. The no-gates state is a bordered Box with grey text.

Fix:
- Kit: a horizontal item width and title wrap (`wrap` applies only to vertical today).
- App: drop the outer region and arrows, and use Empty `size="compact"` with a one-line explanation and Set up program work.

**PA3-17 · A single-choice picker shows checkboxes and a select-all** (medium)\
[add-from-library.tsx:312-326](../../../src/components/prototype/add-from-library.tsx#L312-L326), [:767-807](../../../src/components/prototype/add-from-library.tsx#L767-L807); kit: [locale-format.ts:51](../../../packages/design-system/src/lib/locale-format.ts#L51)

With `enableMultiRowSelection: false`, the Add from library picker still draws a checkbox column and a header select-all, and select-all quietly keeps only the first row. Screen readers announce multi-select for a one-of-N choice, and each row checkbox is named "Select row" plus the row's UUID.

Fix: Kit: when multi-row selection is off, drop select-all and render radio semantics (or `aria-selected` rows) with one group name, document it on PickerSheet, and name row checkboxes by the row, as PickerSheet.mdx promises.

**PA5-13, PA1-17 · New-tab links carry no warning, and raw anchors pass the link rule** (medium)\
[evidence-version-details.tsx:61-72](../../../src/components/prototype/evidence-version-details.tsx#L61-L72), [evidence-browser.tsx:497-500](../../../src/components/prototype/evidence-browser.tsx#L497-L500), [catalog.tsx:174-188](../../../src/components/app/program-wizard/catalog.tsx#L174-L188), [:223-266](../../../src/components/app/program-wizard/catalog.tsx#L223-L266), [elements.tsx:570-581](../../../src/components/app/program-wizard/elements.tsx#L570-L581); lint: [index.js:430-444](../../../packages/design-system/eslint-plugin/index.js#L430-L444)

External evidence references are `<a target="_blank" className="underline">`, which passes `ledger/prefer-text-link` because the rule only matches `text-brand` or `hover:underline`. The wizard's Open catalog, Open profile and product links are TextLinks with `target=_blank` and no icon or hidden text, since TextLink has no new-tab option, and each profile's version and control count is not attached to its checkbox. The evidence version details also bypass QueryState (reviews fail with no Retry), Empty and labelled properties, and render reviews differently from evidence-browser.

Fix:
- Kit: a TextLink `newTab` (or `external`) option with an icon and visually hidden "opens in a new tab"; extend `prefer-text-link` to catch raw anchors with any class.
- App: use it; attach the meta line with `aria-describedby`; use QueryState, compact Empty, a labelled Description and one reviews list shared by both files.

Smaller kit changes are named in other groups:

- a compact size for DataTable's empty, for embedded collections (PA1-5, PA2-5);
- a Presets trigger whose name contains its visible label, and a pager that hides on one page (PRT-12);
- BreadcrumbLink dropping a router Link's `aria-current` on ancestors (PA4-3);
- a Toolbar.mdx line on where a boolean filter and a scope Select go (PA3-6; PA4-6, PA2-7);
- a title or full-text fallback on a truncated KeyValue label (PRT-15);
- icon, secondary-line and badge options for name cells (PA3-20);
- a file-select control beside Attachment (PA1-20), and a download helper beside `toCsv` (PRT-15);
- a container-responsive Stepper orientation (PA1-14).

## Contract violations

### Registers

**PRT-12, PA3-8, PA2-16 · Registers without saved views show a one-option "All records" menu named "Saved questions"** (high)\
Kit: [filter.tsx:403](../../../packages/design-system/src/patterns/data-table/filter.tsx#L403), [:442](../../../packages/design-system/src/patterns/data-table/filter.tsx#L442); app: [product-collection.tsx:61-74](../../../src/components/prototype/product-collection.tsx#L61-L74)

When a caller passes no `views`, ProductCollection injects DataTable.Presets with a single "All records" preset and always adds Columns and Settings, against "omit a capability the collection has no use for". The trigger's `aria-label` defaults to "Saved questions", so a speech user who says "click All records" misses it (WCAG 2.5.3, Level A) on Suppliers, both Portfolio tables, CCIs, the task's Assignments and embedded collections. On an issue record each one-row collection shows search, "All records 1", Columns, Settings, Create and a "1–1 of 1 · 20 per page" pager, and the Take version review and Add from library confirm dialogs offer column management for a read-only list.

Fix:
- Kit: drop the `aria-label` override so the visible label and count name the trigger, and put "Saved questions" on the popup or its radio group; hide the pager when the rows fit one page. Hiding a one-preset menu is optional.
- App: remove ProductCollection's single-preset fallback so collections without saved views omit `views` (or confirm with Josef that the count-bearing "All records" is intended), and give it a compact mode for dialog review tables (search only), written into the contract as an exception. The phone rows this costs are [responsive audit #5](../responsive-audit-2026-09-24.md).

**PA1-5 · The tailoring editor fills a table inside a page that already scrolls** (medium)\
[editor.tsx:259-299](../../../src/components/app/profile-tailoring/editor.tsx#L259-L299), [:420-427](../../../src/components/app/profile-tailoring/editor.tsx#L420-L427), [:567-570](../../../src/components/app/profile-tailoring/editor.tsx#L567-L570), [catalog.tsx:128-136](../../../src/components/app/program-wizard/catalog.tsx#L128-L136); rule: [DataTable.mdx:152](../../../packages/design-system/src/stories/patterns/DataTable.mdx#L152)

`fill` is set on the effective control set, the tab's third collection, and on the parameter table, below two illustrated empties of about 310px ("Nothing tailored out", "Nothing tailored in"). At 1440×900 the real content starts about 975px down, the table shows 5 of 50 rows in an inner scroller that fights the page's, the wizard's Continue sits at y=1350, and Done and Continue are both primaries. The Section count reads "99+" while the tab and pager say 370; the profile record's Tailoring tab nests the same way.

Fix: drop `fill` on embedded collections; pass the count as a string (a section total is not an unread badge); make Done subtle. The embedded empties need the kit's compact size.

**PA4-6, PA2-7 · Details sections sit under fill tables, and the SSP revision picker folds away** (medium)\
[system-baseline.tsx:486-534](../../../src/components/prototype/system-baseline.tsx#L486-L534), [ssp-assembly.tsx:93-113](../../../src/components/prototype/ssp-assembly.tsx#L93-L113), [:565-585](../../../src/components/prototype/ssp-assembly.tsx#L565-L585), [:604-626](../../../src/components/prototype/ssp-assembly.tsx#L604-L626)

On the system Controls tab, "Baseline details" follows a `fill` register: its trigger sits at y=884 in a 900px window, cut off, and the page scrolls 44px behind a table that should own the scroll. The SSP controls tab does the same with "SSP details". Its SSP revision Select, which decides what the whole table shows, is passed in `filters`, the first slot to fold, so it disappears behind More as soon as the preview opens.

Fix: move the provenance above the table as the collapsed Details section, or into the Overview rail, so the fill table stays the last block; put the revision Select in `views` with `size="sm"`, or above the toolbar as the tab's context control; add a Toolbar.mdx line saying a dataset or scope Select belongs in `views`.

**PA3-12 · Embedded record collections are stacks of Inspector groups instead of a DataTable** (medium)\
[library-components.tsx:885-928](../../../src/components/prototype/library-components.tsx#L885-L928), [library-controls.tsx:327-350](../../../src/components/prototype/library-controls.tsx#L327-L350)

ComponentTraceability renders each linked requirement revision and evidence version as a collapsible Inspector.Group (an h3 directly under the page h1) with a raw statement paragraph: no search, no link to the record and no preview. Past a few links the tab becomes a long accordion.

Fix: make the Requirements and Evidence tabs ProductCollections with RecordLink names and an eye, like the component's Programs tab. Parameters inside the ControlInspector preview can stay grouped.

**PA5-4 · Related-record names link to the inspector's join-row page, not the record they name** (medium)\
[requirement-allocations.tsx:105-109](../../../src/components/prototype/requirement-allocations.tsx#L105-L109), [requirements-table.tsx:127-131](../../../src/components/prototype/requirements-table.tsx#L127-L131), [requirement-control-mappings.tsx:208-212](../../../src/components/prototype/requirement-control-mappings.tsx#L208-L212), [evidence-browser.tsx:639-655](../../../src/components/prototype/evidence-browser.tsx#L639-L655)

The allocation name "CN-109101 · Mission Computer" is a RecordLink to `requirement_allocations`, so it and the row click land on a UUID page in the diagnostic inspector, although the system has a program page; control mappings do the same. In the evidence version's Supports table every link reads "Open requirement" or "Open observation", beside a column that repeats "Requirement". The missing evidence record page is [pattern audit](../pattern-audit-2026-09-17.md) §5.

Fix:
- Contract: when a join row's visible name is another record with a page, the name links to that record and the eye previews the join row. Apply it to allocations (`recordDestination("systems", { id, program_id })`), and to mappings once controls have a product destination.
- Supports: render the related record's code and name as the link text, link requirements through engineering_requirements, and drop the Relationship column or group by it.

**PA1-10 · The parameter overrides table shows a UUID as its ID, and its row action forgets the row** (medium)\
[editor.tsx:515-533](../../../src/components/app/profile-tailoring/editor.tsx#L515-L533), [:548-555](../../../src/components/app/profile-tailoring/editor.tsx#L548-L555), [parameter-picker.tsx:58](../../../src/components/app/profile-tailoring/parameter-picker.tsx#L58)

Rows use `id: override.parameterId` under `c.id`, so the ID column shows a truncated database UUID beside the real identifier. "Set parameter values" on a row opens a 767-item list with nothing selected, and decision rows' edit action reuses the toolbar's "Tailor controls" label.

Fix: use the control code or `source_id` for the ID column (keep the UUID as `getRowId`), pass an `initialParameterId`, and label the row actions "Edit decision" and "Edit override".

**PA4-13 · The system tree's primary "Create system" is a menu trigger, often of one item** (medium)\
[program-systems-tree.tsx:341-362](../../../src/components/prototype/program-systems-tree.tsx#L341-L362), [:377-379](../../../src/components/prototype/program-systems-tree.tsx#L377-L379)

The primary Button opens a menu of "Create system" and, only at the program root, "Add system from product"; on an element record the menu's one item repeats its trigger. "Add" names an operation that creates an identity, and the empty copy says "Add the first system". This file is the contract's reference for the system register, so the pattern spreads.

Fix: make Create system a direct primary. Where the second path exists, compose ButtonGroup with the primary and an IconButton menu trigger holding "Create system from product" (ButtonGroup's Composition story), or put it in Collection actions; make the empty copy "Create the first system".

**PRT-6 · Portfolio embeds two full registers, and its severity filter has no data** (medium)\
[index.tsx:114-178](../../../src/routes/index.tsx#L114-L178), [record-tools.tsx:55-67](../../../src/components/prototype/record-tools.tsx#L55-L67), [:81-88](../../../src/components/prototype/record-tools.tsx#L81-L88), [:198-208](../../../src/components/prototype/record-tools.tsx#L198-L208)

"Risk posture" shows five risks with search, views, two filter chips, Columns, Settings and a "1–5 of 5 · 20 per page" pager, and "Programs" repeats the /programs register with its Create program. The "Latest severity" chip and sort read a `severity` key that lives on risk_revisions, so they never match. Program and Owner cells each resolve through RelationName, one query per distinct related id with a full Alert and Retry inside the cell on failure, and "1 adopted scope baselines" shows on the seeded workspace.

Fix: add a summary mode to the app adapter (a DataTable with no toolbar and no page size already works) with a See all TextLink in the Section action; give ModelTable's DisplayColumn a `value` accessor (PRT-14); resolve names from one lookup; use `formatPlural`.

**PRT-14, PA2-17 · Derived columns sort and filter on keys the rows do not have** (medium)\
[vendors.tsx:53-58](../../../src/routes/vendors.tsx#L53-L58), [record-tools.tsx:209](../../../src/components/prototype/record-tools.tsx#L209), [package-views.tsx:86-95](../../../src/components/prototype/package-views.tsx#L86-L95), [assessment-browser.tsx:209-227](../../../src/components/prototype/assessment-browser.tsx#L209-L227)

Suppliers' "Supplied components" renders a count from a `components` key the party rows lack, so clicking its header sets `aria-sort` and the order never changes, and search and CSV export see nothing. The Packages register's "Latest version" and "Version state" read keys that exist only on package_revisions, so they neither sort nor feed their State filter. On Campaigns the "Events" column is a link button in 90px that truncates to "Show 0 even" on every row, including rows with no events.

Fix: give ModelTable's DisplayColumn a `value` accessor, as ProgramCollection's columns have, and derive the values into the rows (supplied components as `c.number`, latest version and state on packages); make Events a `c.number` count with a filter link only above 0.

**PA5-14 · Edit history repeats the tab's name and calls statement edits "Overview"** (medium)\
[requirement-record.tsx:259-266](../../../src/components/prototype/requirement-record.tsx#L259-L266), [:295-297](../../../src/components/prototype/requirement-record.tsx#L295-L297), [:320-329](../../../src/components/prototype/requirement-record.tsx#L320-L329)

`changeLabels` maps `statement` to "Overview", so a statement change reads "Edited Overview", and an entry whose values did not change reads "Edited ". The tab wraps its only content in a Section "Edit history" with a count, over an EmptyMessage with no illustration or explanation. Each actor name is its own query, rendering a danger Alert and Retry inside a timeline row on failure, and the Verification tab omits the `fill` its siblings pass.

Fix: label it "Statement"; drop the Section; use Empty with an illustration and one line ("Changes to the statement, criteria and owner appear here"); resolve actors in the projection; pass `fill` to Verification.

### Collection previews

**PA2-1, PA5-2 · RecordSummaryPreview without `fields` dumps every column** (high)\
[record-summary-preview.tsx:74-89](../../../src/components/prototype/record-summary-preview.tsx#L74-L89), [assessment-table.tsx:214-224](../../../src/components/prototype/assessment-table.tsx#L214-L224), [assessment-browser.tsx:154-229](../../../src/components/prototype/assessment-browser.tsx#L154-L229), [requirement-allocations.tsx:161-168](../../../src/components/prototype/requirement-allocations.tsx#L161-L168)

With no `fields`, the preview lists every non-object key through `displayValue`. The Assessment campaigns preview, the main global register for assessments, shows "ID 04d121f4-…", "Program ID", "Scope ID", "Status active" and four raw ISO timestamps, and drops Owner because null is `typeof "object"`. The allocation preview shows the join row's UUIDs, "Created at 2026-09-12T18:01:21.982404+00:00" and "TargetType Hardware" instead of what was allocated to what and why.

Fix: make `fields` required and render each by the table's kind (status badge, formatted date, relation by name, never a raw `*_id`); give the campaign preview Status, Program, Owner, Starts, Ends and a labelled Description, and the allocation preview its target as a link, its type and its rationale.

**PA4-16 · The generic linked-record preview lists every schema column and appends unheaded collections** (medium)\
[program-shared.tsx:218-248](../../../src/components/prototype/program-shared.tsx#L218-L248), [:570-735](../../../src/components/prototype/program-shared.tsx#L570-L735)

ProgramRecordDialogSurface turns every column but a few into KeyValues, so revision, timestamps and foreign keys appear. ProgramLinkedRecords then appends a full ProgramCollection with no heading for scopes, SSP revisions, risks, POA&M, gates and more, so a gate preview opened from the Overview timeline shows a criteria table under its facts with nothing saying what it is.

Fix: a curated field list per table (status, owner, dates, identifiers); `section` with an h3 heading on every linked collection in a panel.

### Record pages

**PA4-4 · Focused program views are a dead end behind an Actions menu of onClick items** (medium)\
[program-workspace.tsx:187-219](../../../src/components/prototype/program-workspace.tsx#L187-L219), [:689-822](../../../src/components/prototype/program-workspace.tsx#L689-L822)

Each focused view marks a host tab selected (Baseline selects System), and clicking that tab does nothing because Base UI fires no change for the current value. The nine view entries are DropdownMenuItems with `onClick={navigate}`, rendered as divs with no href, so they cannot open in a new tab or be bookmarked; "Program dashboard" redirects to the Overview; "Cyber T&E phases" and "Residual risk" duplicate the Assessment campaigns and Risk tabs. The program crumb is not a link either (PA4-3).

Fix: render the entries as DropdownMenuLinkItem `render={<Link …/>}` ([index.ts:252](../../../packages/design-system/src/components/index.ts#L252)), which keeps modified clicks; remove Program dashboard; give a focused view no selected tab, or a link back to the host tab; link the program crumb; fold the duplicate views into their tabs. The twelve-tab count stays the open decision in [docs/next.md](../../next.md).

**PA2-5 · The campaign Execution tab repeats the header and stacks five hero empties with unexplained disabled Creates** (medium)\
[assessment-campaign.tsx:105-128](../../../src/components/prototype/assessment-campaign.tsx#L105-L128), [:152-164](../../../src/components/prototype/assessment-campaign.tsx#L152-L164), [:165-381](../../../src/components/prototype/assessment-campaign.tsx#L165-L381)

Execution opens with a "Campaign" section that repeats the Overview description and an Actions menu (Edit assessment campaign, Inspect record) duplicating the header's primary. Below it, five DataTables show default empties of about 290px reading "Create a record to start this collection.", and four have a disabled Create because no assessment plan revision (or no draft one) exists, with nothing saying so: a 2000px page of empties.

Fix: drop the repeated description and the body Actions menu (a campaign-details block may stay as an inventory exception) and move Inspect record into the header menu; give each empty a one-line explanation, and where the plan revision is missing say so and point at Create assessment plan revision; remove `add()`'s unused label parameter. Compact embedded empties need a size on DataTable's empty.

**PRT-2 · The reference task record and Portfolio hand-build feeds instead of Timeline** (medium)\
[tasks.$taskId.tsx:196-209](../../../src/routes/tasks.$taskId.tsx#L196-L209), [:229-240](../../../src/routes/tasks.$taskId.tsx#L229-L240), [index.tsx:184-199](../../../src/routes/index.tsx#L184-L199)

Comments, Activity and Portfolio's Assurance activity are Boxes with a bottom border holding raw paragraphs: no list semantics and no `<time>`, and on Portfolio every row starts with "Updated" and a timestamp with seconds. The requirement record already uses `<Timeline label="Edit history" size="small" wrap>`, and since `tasks.$taskId.tsx` is the contract's record reference, the bespoke list is what gets copied.

Fix: render the feeds as a vertical Timeline (the author as marker or meta, the time through `dateTime`, the text as the item body, a sentence title instead of "Updated"), and change the reference file first.

**PRT-10 · The profile record's Overview is a placeholder sentence, and its revision selector exists only there** (medium)\
[profiles.$profileId.tsx:257-263](../../../src/routes/profiles.$profileId.tsx#L257-L263), [:476-520](../../../src/routes/profiles.$profileId.tsx#L476-L520)

Overview is one Section saying "Review this revision's source, resolved controls, and tailoring in the tabs above." The only control that picks the revision is in the Shell.Aside, which renders only on Overview, so on Derivation, Controls or Tailoring the reader can neither see nor change the revision every tab depends on. The rail shows "Catalog: Not resolved" beside "Controls: 589", and a truncated "OSCAL docum…" label beside a raw UUID.

Fix: give Overview the revision's substance (kind, catalog, control count, derivation chain, provenance in a collapsed Details); show the selected revision on every tab, in the trail or header, or move the selector into PageHeader.Actions as a version menu.

**PRT-15 · The Program export view truncates its labels and under-reports what it exports** (medium)\
[programs.$programId_.export.tsx:40-62](../../../src/routes/programs.$programId_.export.tsx#L40-L62), [:108-121](../../../src/routes/programs.$programId_.export.tsx#L108-L121), [programs.tsx:129-137](../../../src/routes/programs.tsx#L129-L137), [record-tools.tsx:465-473](../../../src/components/prototype/record-tools.tsx#L465-L473)

At 1440 the counts read "Requirement id…", "Security plan re…" and "Evidence artifa…", and they cover four collections while the JSON also holds assessments, risks and tasks. The download has no confirmation, and export.tsx and programs.tsx each hand-build an anchor download that revokes the object URL synchronously, while record-tools defers the revoke by 10s.

Fix: show the counts as a Stat.Grid covering all seven collections, or KeyValue with `labelWidth` about 180 (`wrap` will not do it); keep one download helper (the kit could ship it beside `toCsv`) and toast on success. The kit gap: a truncated KeyValue label has no title or full-text fallback.

### Tabs

**PA2-3, PA4-15 · Findings & assets, the POA&M & risk register and the risk record have tabs without panels** (medium)\
[findings-views.tsx:47-106](../../../src/components/prototype/findings-views.tsx#L47-L106), [assurance-views.tsx:193-203](../../../src/components/prototype/assurance-views.tsx#L193-L203), [:302-349](../../../src/components/prototype/assurance-views.tsx#L302-L349), [:407-414](../../../src/components/prototype/assurance-views.tsx#L407-L414)

These Tabs hold only a TabsList, and the content renders after `</Tabs>` from local state. On /findings there is no tabpanel and every tab's `aria-controls` is null, so screen readers hear tabs that control nothing; Back and reload return to the first tab, and no panel entrance plays. The risk record's Evidence tab repeats the observations its Responses tab already shows.

Fix: render each body in TabsContent (with `keepMounted` where state must survive, PA2-4); keep the tab in route search as `campaigns.$campaignId.tsx` does; remove or rename the duplicate observations tab.

**PA2-4 · Switching tabs resets search, filters, sort and page** (medium)\
[tabs.tsx:121-163](../../../packages/design-system/src/components/tabs.tsx#L121-L163), [assessment-browser.tsx:153-396](../../../src/components/prototype/assessment-browser.tsx#L153-L396), [assessment-campaign.tsx:150-508](../../../src/components/prototype/assessment-campaign.tsx#L150-L508)

TabsContent passes through to Base UI's panel, whose `keepMounted` defaults to false, and no product tab set passes it. On /campaigns, typing "WS" in Find campaigns, switching to Events and back leaves the search empty, although the contract says retained panel state survives selection.

Fix: keep the kit default and pass `keepMounted` on register tabs whose reader state must survive (/campaigns, /findings, the campaign's Execution), or lift search and filters into the table view state. Say in the contract's Tabs section that retained state means `keepMounted`, so the rule is checkable.

**PA3-10, PRT-11 · Library, catalog and profile tabs use `display: contents` and keep the tab out of the URL** (medium)\
[library-components.tsx:379](../../../src/components/prototype/library-components.tsx#L379), [:618](../../../src/components/prototype/library-components.tsx#L618), [:640](../../../src/components/prototype/library-components.tsx#L640), [library-products.tsx:422](../../../src/components/prototype/library-products.tsx#L422), [:530](../../../src/components/prototype/library-products.tsx#L530), [library-requirements.tsx:208](../../../src/components/prototype/library-requirements.tsx#L208), [catalog.tsx:111-127](../../../src/routes/catalog.tsx#L111-L127), [profiles.$profileId.tsx:216-235](../../../src/routes/profiles.$profileId.tsx#L216-L235)

`<Tabs className="contents">` and `<TabsContent className="contents">` leave the panel with no box, so the kit's fade-and-rise entrance cannot play, and Tab from the selected tab skips the panel stop to the rail. The tab lives in `useState`, and the library routes accept `?version=` but never write it back, so reload, Back and shared links lose the tab and the version.

Fix: remove `className="contents"` at every call site ([program-workspace.tsx:228](../../../src/components/prototype/program-workspace.tsx#L228) shows fill content works in a normal panel). Then add `tab` to `validateSearch` on /catalog, /profiles/$profileId and the library component and product routes, navigating with `replace`; the URL is lower priority, since the contract does not require it.

### Forms and confirmations

**PRT-1 · The task's Create comment dialog puts seven relationship pickers before Body** (high)\
[tasks.$taskId.tsx:84-98](../../../src/routes/tasks.$taskId.tsx#L84-L98), [product-records.ts:75](../../../src/lib/product-records.ts#L75); schema: [20260912020000_workflow_schema.sql:1018](../../../supabase/migrations/20260912020000_workflow_schema.sql#L1018)

The comment action opens the generic ProductRecordDialog: read-only Task and Author cards, then empty pickers for Program, Issue, Risk, POA&M item, Assessment campaign, Evidence artifact and Package, then Body, the one required field. Focus lands on Program and Body is 14 tab stops away; at 1440×900 the footer covers Body even once focused, and at 390px it cannot be reached. The comments table requires exactly one target, so any picker can only turn a valid comment into a failed save. MOD-2 covers the non-scrolling fieldset that lets the footer cover the field.

Fix: in the shared product form, rank `body` first in `leadingFields` and hide the other members of a polymorphic target group once context sets one, through a per-table target-group map beside `productRecordNoun` (the schema catalog does not expose check constraints). An inline Composer under Comments, Josef's earlier direction, first needs an entry in the contract's closed list of surfaces.

**PA3-2 · Publishing an immutable version is one unconfirmed click, and a first requirement version saves placeholder text** (high)\
[library-requirements.tsx:291-321](../../../src/components/prototype/library-requirements.tsx#L291-L321), [:369-388](../../../src/components/prototype/library-requirements.tsx#L369-L388), [library-components.tsx:244-270](../../../src/components/prototype/library-components.tsx#L244-L270), [:305-318](../../../src/components/prototype/library-components.tsx#L305-L318), [library-products.tsx:260-300](../../../src/components/prototype/library-products.tsx#L260-L300), [:333-349](../../../src/components/prototype/library-products.tsx#L333-L349)

"Publish version" in the Actions menu publishes on one Enter: the reproduction saw the PATCH to `state: "published"` go out with no dialog and no toast, and published revisions cannot be updated or deleted. When Publish is unavailable it is only disabled, with no reason. "Create requirement version" with no base inserts `statement: "State what the system shall do."` and `acceptance_criteria: "State how it is verified."` without opening a dialog, and that version can be published at once and adopted by programs. The three libraries' Create version also differ: a component gets a blank revision, a product a copy, a requirement a copy or the placeholder.

Fix: put Publish behind useConfirmation (default variant) saying published versions cannot be changed, toast on success, and say why it is unavailable (no elements, no active configuration); make Create requirement version open the version Dialog pre-filled from the current version, with empty required fields when there is none.

**PA1-3 · The wizard disables Continue and Create program instead of validating on submit** (medium)\
[program-wizard.tsx:199-201](../../../src/components/app/program-wizard.tsx#L199-L201), [:400-431](../../../src/components/app/program-wizard.tsx#L400-L431)

Continue is disabled from load, with the reason ("Enter a code.") in a `title` and a grey span beside Cancel; no field is marked and nothing moves focus, and Enter in a field does nothing. On step 3 at 390px the footer reads "System 1: Enter a code." while the only row says "Unnamed" and its Code field is inside a closed Sheet; step 2's hint is a raw schema message, "Choose an existing record." A screen reader reading the footer does get the reason, one message at a time.

Fix: keep both buttons enabled; on press, validate the step, mark each invalid field (`data-invalid`, `aria-invalid`, FieldError) and focus the first, opening the element Sheet when the error belongs to a system or element; list step 3's errors in an Alert with buttons that open the row.

**PA1-7, PA2-9, PA3-1, PA4-8, PA5-9 · Form errors are one sentence at the bottom of the scroll body, tied to no field** (medium)\
[fields.tsx:22-64](../../../src/components/app/fields.tsx#L22-L64), [create-task-dialog.tsx:202-230](../../../src/components/prototype/create-task-dialog.tsx#L202-L230), [record-browser.tsx:634-679](../../../src/components/app/record-browser.tsx#L634-L679), [library-products.tsx:924-926](../../../src/components/prototype/library-products.tsx#L924-L926), [system-element-dialog.tsx:210-237](../../../src/components/prototype/system-element-dialog.tsx#L210-L237), [add-requirement-details-dialog.tsx:112-124](../../../src/components/prototype/add-requirement-details-dialog.tsx#L112-L124)

Every product form, including the reference CreateTaskDialog and the RecordEditor behind ProductRecordDialog, validates on submit and then shows one `<p role="alert">` after the last field. No field gets `aria-invalid`, `data-invalid` or a FieldError (FieldError is used nowhere under `src/`), and focus stays on the submit button: at 390px, an empty Create task says "Choose a program." at the bottom while the Program field at the top looks fine, and adds "Retrying the same request will not create a duplicate" though nothing was sent. SystemElementDialog, BaselineDialog and AddRequirementDetailsDialog set native `required` without `noValidate`, so browser bubbles fire first; required Rationale fields are unmarked; RecordEditor's plain-text asterisk is read as "star".

Fix:
- Once, in `fields.tsx`: an `error` prop on TextField, ChoiceField and PartyField that sets `data-invalid` on the Field, renders FieldError and wires `aria-invalid` and `aria-describedby`, plus a submit helper that validates every field and focuses the first invalid one. Move CreateTaskDialog onto it first, then the rest.
- Use `noValidate` everywhere, mark required fields with an aria-hidden asterisk and `aria-required`, keep a summary only for server errors where it is visible, and show the retry sentence only after a server failure. No kit part is needed; do not reintroduce FormField.

**PA1-4 · Links and rows in the wizard's tailoring tables leave the draft** (medium)\
[editor.tsx:160-170](../../../src/components/app/profile-tailoring/editor.tsx#L160-L170), [:390-400](../../../src/components/app/profile-tailoring/editor.tsx#L390-L400), [:534-544](../../../src/components/app/profile-tailoring/editor.tsx#L534-L544)

In the editable tailoring editor, control and parameter names are RecordLinks to the schema inspector with no target, and every row click navigates too. Clicking "Policy and Procedures" opens "Discard changes? / Discard this unsaved program setup?" with the red Discard as the dominant button, so reading a control while tailoring puts four steps of entry one click from loss.

Fix: write a closed exception into product-patterns.md for collections embedded in a draft: the name opens the record in a new tab with a new-tab cue (a RecordLink `newTab` option) and the row click opens the eye preview or does nothing. The read-only profile page keeps same-tab links.

**PA1-11 · Tailoring removals happen at once, and "Cancel" does not cancel** (medium)\
[editor.tsx:404-407](../../../src/components/app/profile-tailoring/editor.tsx#L404-L407), [:550-553](../../../src/components/app/profile-tailoring/editor.tsx#L550-L553), [control-picker.tsx:184-193](../../../src/components/app/profile-tailoring/control-picker.tsx#L184-L193), [:279-291](../../../src/components/app/profile-tailoring/control-picker.tsx#L279-L291), [confirmation.tsx:60](../../../src/components/app/confirmation.tsx#L60), [:71-76](../../../src/components/app/confirmation.tsx#L71-L76)

"Remove decision" and "Remove override" delete the decision and its typed rationale, the audit record of the choice, with no confirmation or undo, while removing an element, system or profile in the same draft asks. The Tailor controls primary writes to the draft at once, yet the footer still offers "Cancel", which reverts nothing, and the shared discard prompt labels its safe choice "Cancel" under a title and description that ask the same question twice.

Fix: confirm the removal (or offer an undo toast); rename the dialogs' secondary to "Close" once changes apply live, or stage changes until the primary; label useConfirmation's safe choice "Keep editing" for `discardChanges` and let callers set it.

**PA3-4 · Add from library and Add system from product have no way back to the choice** (medium)\
[add-from-library.tsx:136](../../../src/components/prototype/add-from-library.tsx#L136), [:553-765](../../../src/components/prototype/add-from-library.tsx#L553-L765), [:799-806](../../../src/components/prototype/add-from-library.tsx#L799-L806), [add-product-system.tsx:54-65](../../../src/components/prototype/add-product-system.tsx#L54-L65)

Continue moves from the picker to the confirm Dialog and nothing moves back. The only exit is Cancel, which runs the draft guard and discards the scope, element codes, exclusions and rationale; VariantDialog replaces the configuration picker the same way. A reader who picked the wrong item must cancel, discard, reopen, search and enter everything again.

Fix: a subtle Back at the start of DialogFooter (the wizard's order: Back, then Cancel and the primary) that returns to the picker and keeps the chosen item, scope, specs, exclusions and rationale; the same for VariantDialog. No kit part is needed.

**PA4-7 · Change control baseline opens as "Adopt a profile" with no profile, whatever the element uses** (medium)\
[system-baseline.tsx:553](../../../src/components/prototype/system-baseline.tsx#L553), [:613-616](../../../src/components/prototype/system-baseline.tsx#L613-L616), [:801-810](../../../src/components/prototype/system-baseline.tsx#L801-L810)

The dialog always starts in adopt mode with an empty profile and never names the current baseline. On the WS-X90 boundary, whose rail says "WS-X90 Tailored Security Baseline · Draft · From the boundary SSP · 546 controls", it opens on "Adopt a profile and tailor controls", and choosing a profile replaces the whole 546-control selection without saying what is lost.

Fix: start in inherit mode whenever the element has no explicit adoption (`effective.data.source_label !== "Explicit system adoption"`, which covers the inherited and boundary-SSP cases); show the current baseline as KeyValues at the top; confirm before a base-profile change discards tailored picks.

**PA5-1 · Allocate requirement is a hand-built picker in a Dialog, not a PickerSheet** (medium)\
[requirement-allocations.tsx:188-445](../../../src/components/prototype/requirement-allocations.tsx#L188-L445); twin: [system-requirements.tsx:363-447](../../../src/components/prototype/system-requirements.tsx#L363-L447)

The requirement side builds a DataTable, search and rationale into a 1120px Dialog with its own selection count and dirty guard, and saves with a client loop of lookup-then-insert, so a partial failure leaves "3 of 5 allocations confirmed". The same operation from the system side is a PickerSheet with useDraftGuard and a toast. At 390px Name has no priority, so only codes show, the "Already allocated" reason folds away behind a faint disabled checkbox, and an empty submit puts its error off screen.

Fix: rebuild on PickerSheet (search in `search`, rationale in `toolbar`, `selected`/`total`/`onClear`, action "Allocate to N systems", which disables at zero); use useDraftGuard; give Name priority 0 and the code 1; send one multi-row insert or a shared `allocate_requirement` RPC; toast on success.

**PA5-3 · Allocations, control mappings and evidence links cannot be removed** (medium)\
[requirement-allocations.tsx:96-137](../../../src/components/prototype/requirement-allocations.tsx#L96-L137), [requirement-control-mappings.tsx:259-273](../../../src/components/prototype/requirement-control-mappings.tsx#L259-L273), [requirement-evidence.tsx:147-221](../../../src/components/prototype/requirement-evidence.tsx#L147-L221), [:386-421](../../../src/components/prototype/requirement-evidence.tsx#L386-L421)

The Allocation tab has no row actions and a read-only preview, control mappings offer only "Edit mapping", and linked evidence has no row action at all. `src/lib` has no delete or unlink command, although the schema allows deleting current-revision rows, so the only way out is the schema inspector's generic Delete; deleting an allocation there leaves its mappings scoped to a system the requirement is no longer allocated to. An allocation's rationale cannot be edited either.

Fix: add Remove allocation, Remove mapping and Unlink evidence as row actions and preview overflow items, each through a destructive useConfirmation and a domain command in `src/lib`, with a toast; add Edit allocation.

### States

**PA3-5 · The Add from library confirm step shows negative answers while its queries load** (medium)\
[add-from-library.tsx:121-129](../../../src/components/prototype/add-from-library.tsx#L121-L129), [:553-765](../../../src/components/prototype/add-from-library.tsx#L553-L765), [add-product-system.tsx:80-117](../../../src/components/prototype/add-product-system.tsx#L80-L117)

The confirm frame reads SSP revisions, selected controls, system components and controls outside any QueryState, so until they arrive it says "The boundary has no draft SSP revision…", every claim reads "No draft SSP" or "Not in baseline", and the primary is enabled. VariantDialog has no QueryState at all: its Program profile field stays empty until five unguarded queries resolve, and a submit meanwhile says "Choose one of the program's profiles."

Fix: wrap the confirm frame's body and VariantDialog's fields in QueryState over their own queries.

**PA1-12 · The wizard hand-rolls alerts, loading text, grey-string empties and native disclosures** (medium)\
[program-wizard.tsx:264-281](../../../src/components/app/program-wizard.tsx#L264-L281), [:362-380](../../../src/components/app/program-wizard.tsx#L362-L380), [editor.tsx:220-239](../../../src/components/app/profile-tailoring/editor.tsx#L220-L239), [control-detail.tsx:41-57](../../../src/components/app/profile-tailoring/control-detail.tsx#L41-L57), [catalog.tsx:195-199](../../../src/components/app/program-wizard/catalog.tsx#L195-L199), [:283-286](../../../src/components/app/program-wizard/catalog.tsx#L283-L286), [workspace.tsx:104-120](../../../src/components/app/workspace.tsx#L104-L120)

The reference-load failure, "Program could not be created" and "Resolve tailoring conflicts" are danger-bordered Boxes, not Alert; wizard and ControlDetail loading are grey `<p role="status">` with a hand-rolled retry; empty regions are subtle paragraphs; "Reference notes" and "Additional details" are native `<details>` two lines from a kit Collapsible; the sign-in error is a raw paragraph. They lose the kit's announcements and its retry with stale content, and look like no other screen.

Fix: Alert (danger, with AlertAction for Retry) for failures, QueryState or PageSkeleton for loading, Empty `size="compact"` for empty regions, Collapsible for disclosures.

**PA3-7 · Empties in record bodies are a bare title or grey text** (medium)\
[work-common.tsx:95-112](../../../src/components/prototype/work-common.tsx#L95-L112), [library-components.tsx:346](../../../src/components/prototype/library-components.tsx#L346), [:900](../../../src/components/prototype/library-components.tsx#L900), [:925](../../../src/components/prototype/library-components.tsx#L925), [library-products.tsx:386-389](../../../src/components/prototype/library-products.tsx#L386-L389), [system-library.tsx:333-335](../../../src/components/prototype/system-library.tsx#L333-L335)

EmptyMessage renders an Empty with only a title, so "No requirements have been linked through these system implementations" sits in heading size on a blank tab. The version-less component and requirement records offer no Create version, although their Actions menus have one, and ControlInspector and SystemLibrary print `<p className="text-subtle">No parameters declared.</p>`.

Fix: give EmptyMessage required `illustration` and `description` (or replace it with Empty); give version-less records their Create version action under the same role check; explain where derived links (Requirements, Evidence) come from instead of offering a create; use Empty `size="compact"` in the inspector and preview.

### Vocabulary and titles

**PA2-12 · Relationship collections say "Create" where they link, with machine nouns** (medium)\
[record-tools.tsx:360-371](../../../src/components/prototype/record-tools.tsx#L360-L371), [:436-441](../../../src/components/prototype/record-tools.tsx#L436-L441), [product-records.ts:55-66](../../../src/lib/product-records.ts#L55-L66), [findings-views.tsx:228-282](../../../src/components/prototype/findings-views.tsx#L228-L282)

EntitySection always labels its action with `productCreateLabel`, and join tables fall back to `labelFor`, so an operational issue offers "Create issue observation", "Create issue poa&m" and "Create task issue", and the finding and asset records "Create finding risk" and "Create inventory component". Readers are told they will create a record when they link one, and "Remediation commitments" lists what the vocabulary calls remediation items. The generic empty sentence is in the [pattern audit](../pattern-audit-2026-09-17.md).

Fix: give EntitySection an explicit operation, required for join tables so a missing one is a type error (Link observation, Link remediation item, Link task), add noun entries for every join table, and rename the section Remediation items.

**PA3-9 · "Create component" means two record types, and "Add" opens Create dialogs** (medium)\
[product-records.ts:4-5](../../../src/lib/product-records.ts#L4-L5), [:14](../../../src/lib/product-records.ts#L14), [library-components.tsx:302-309](../../../src/components/prototype/library-components.tsx#L302-L309), [product-structure.tsx:232-241](../../../src/components/prototype/product-structure.tsx#L232-L241), [:513-516](../../../src/components/prototype/product-structure.tsx#L513-L516), [add-product-system.tsx:201](../../../src/components/prototype/add-product-system.tsx#L201)

`productRecordNoun` maps both component_definitions and defined_components to "component", so the register's primary and the Structure tab's Create component create different things. Product structure's "Add subsystem" and "Add component" open "Create element", "Add system from product" creates an identity, and "Implementation state" labels operational progress.

Fix: rename the column "Implementation status" now, and give defined_components its own noun. "Add subsystem · Add component" is a settled decision for the program tree too ([next.md:125](../../next.md#L125), [products.md:21](../../products.md#L21), [program-workflow.md:24](../program-workflow.md#L24), [:60](../program-workflow.md#L60)), so renaming those to Create means changing the contract, those docs and the tree together.

**PA5-5 · The control-mapping edit is labelled three ways, from a stale noun key** (medium)\
[product-records.ts:34](../../../src/lib/product-records.ts#L34), [requirement-control-mappings.tsx:263](../../../src/components/prototype/requirement-control-mappings.tsx#L263), [:551](../../../src/components/prototype/requirement-control-mappings.tsx#L551), [:770](../../../src/components/prototype/requirement-control-mappings.tsx#L770)

The noun map keys `requirement_control_mappings`, but the table is `requirement_control_links`, so the preview's primary reads "Edit requirement control link", the row action "Edit mapping" and the dialog "Edit control mapping". The preview also shows the raw enum "derived_from" where the table shows "Derived from", and `requirement_allocations` has no noun.

Fix: rename the key (noun "control mapping"), add `requirement_allocations` ("allocation"), make the row action "Edit control mapping", render `relationship_type` through the labels map, and add a unit test that every noun key is a table in `database.types.ts`.

**PRT-9 · Route labels and titles break the vocabulary: Lead, Test campaign, POA&M commitment** (medium)\
[workstreams.$workstreamId.tsx:117](../../../src/routes/workstreams.$workstreamId.tsx#L117), [campaigns.$campaignId.tsx:137](../../../src/routes/campaigns.$campaignId.tsx#L137), [register.poam.$poamId.tsx:4](../../../src/routes/register.poam.$poamId.tsx#L4), [poam-documents.$documentId.tsx:4](../../../src/routes/poam-documents.$documentId.tsx#L4)

The workstream rail labels its owner "Lead", and a missing campaign says "Test campaign not found". The remediation item route is titled "POA&M commitment" and /poam-documents "POA&M document", where the nouns are remediation item and POA&M plan, and [screen-inventory.json](../screen-inventory.json) encodes both titles. State for Status on the task rail ([tasks.$taskId.tsx:261](../../../src/routes/tasks.$taskId.tsx#L261)) is already in the [pattern audit](../pattern-audit-2026-09-17.md).

Fix: Owner and Status; MissingRecord kind "Assessment campaign"; titles "Remediation item — Program Assurance" and "POA&M plan — Program Assurance" in the routes and the inventory. Derive route titles and MissingRecord kinds from `productRecordNoun` so they cannot drift.

## Accessibility and responsiveness in composition

**PA4-3 · Every router-rendered breadcrumb ancestor announces aria-current="page"** (high)\
Kit: [breadcrumb.tsx:518-540](../../../packages/design-system/src/components/breadcrumb.tsx#L518-L540); app: [program-workspace.tsx:163-182](../../../src/components/prototype/program-workspace.tsx#L163-L182), [program-record.tsx:103-120](../../../src/components/prototype/program-record.tsx#L103-L120), [assurance-views.tsx:165-177](../../../src/components/prototype/assurance-views.tsx#L165-L177)

TanStack Router's Link sets `aria-current="page"` whenever its path is active, matching non-exactly by default, and BreadcrumbLink passes it through. On /programs/<id>/baseline three crumbs claim to be the current page, the "Programs" link among them, and the same holds on every program, system and component record and focused view. `activeProps={{ "aria-current": undefined }}` cannot help, because Link applies its static active props last; in focused views the program crumb is a BreadcrumbPage, not a link.

Fix: pass `activeOptions={{ exact: true }}` through a shared app adapter for every router Link that BreadcrumbLink renders, or have the kit's BreadcrumbLink remove `aria-current` from its host unless the caller marks the level current; link the program crumb when a view is set; add a pattern test that exactly one crumb carries `aria-current`.

**PA4-1 · The evidence decision uses two Checkboxes as a radio group** (medium)\
[system-evidence.tsx:478-493](../../../src/components/prototype/system-evidence.tsx#L478-L493)

DecideEvidenceUse renders Accept and Not applicable as Checkboxes of which only one can be checked. Clicking the checked one does nothing, arrow keys do not move between them, and screen readers hear two independent checkboxes named "Accept" and "Not applicable" while the visible text reads "Accept: link this exact version as support here" (WCAG 4.1.2, 2.5.3).

Fix: RadioGroup inside a FieldSet with the legend "Decision", no `aria-label` overrides, focus on the checked radio.

**PA3-6, PA4-5 · The "Include everything inside" toggle has no visible on state** (medium)\
[system-library.tsx:248-256](../../../src/components/prototype/system-library.tsx#L248-L256), [system-requirements.tsx:200-202](../../../src/components/prototype/system-requirements.tsx#L200-L202), [:257-266](../../../src/components/prototype/system-requirements.tsx#L257-L266), [system-evidence.tsx:342-351](../../../src/components/prototype/system-evidence.tsx#L342-L351)

Three screens render a subtle Button with a raw `aria-pressed`, but the kit paints the selected state only through `isSelected`, so it measures transparent before and after pressing and reads as plain text. Sighted users cannot tell whether the list includes children. On Requirements a `useEffect` also toggles the "Allocated to" column on mount and on every press, overriding a column the reader showed in the saved view.

Fix: `isSelected={includeInside}` (which also sets `aria-pressed`) or the kit Toggle; show the scope column by default when the scope includes children, without calling `toggleVisibility` on the saved view; add a Toolbar.mdx line on where a single boolean filter goes.

**PA3-16 · Checkbox hints are not tied to their checkboxes, and one name drops its visible text** (medium)\
[product-structure.tsx:587-613](../../../src/components/prototype/product-structure.tsx#L587-L613), [add-from-library.tsx:523-537](../../../src/components/prototype/add-from-library.tsx#L523-L537), [:698-711](../../../src/components/prototype/add-from-library.tsx#L698-L711), [library-products.tsx:1005-1011](../../../src/components/prototype/library-products.tsx#L1005-L1011)

Configuration checkboxes sit in hand-rolled labels, and the reasons "Not in X: parent is not a member" and "Unticking removes the N elements inside…" are sibling spans with no `aria-describedby`, so a screen reader meets a disabled checkbox with no reason, or unticks one without hearing the consequence. The claim cell's checkbox is named "Seed AC-2 on SYS-…" while it shows "Will seed" or "Excluded" (WCAG 2.5.3).

Fix: Field `orientation="horizontal"` with FieldLabel and FieldDescription wired through `aria-describedby`, as Checkbox.mdx describes; make the claim's name include its visible text, or drop the text.

**PA4-9 · Boundary flags, missing impacts and impact provenance are named on generic spans** (medium)\
[program-systems-tree.tsx:204-222](../../../src/components/prototype/program-systems-tree.tsx#L204-L222), [system-assurance-details.tsx:31-37](../../../src/components/prototype/system-assurance-details.tsx#L31-L37), [:239-243](../../../src/components/prototype/system-assurance-details.tsx#L239-L243)

The tree marks authorization boundaries with a span carrying `aria-label` and `title` around a hidden Shield icon, and ARIA ignores names on generic elements, so screen reader and touch users cannot tell which rows are boundaries. ImpactBadge's missing value is `<span aria-label="Not recorded">—</span>`, and the preview passes impact provenance as `aria-label` on Indicator, a plain span, so "recorded on this element" is never heard.

Fix: `sr-only` "Authorization boundary" text beside the icon, or a visible Indicator (lint allows `sr-only`); `sr-only` text beside the dash until Absent announces itself; provenance as visible subtle text.

**PA2-14, PA5-15 · Editing from a preview unmounts it, and focus falls out of the task** (medium)\
[assessment-campaign.tsx:97-101](../../../src/components/prototype/assessment-campaign.tsx#L97-L101), [:842-890](../../../src/components/prototype/assessment-campaign.tsx#L842-L890), [assessment-browser.tsx:100-103](../../../src/components/prototype/assessment-browser.tsx#L100-L103), [ssp-assembly.tsx:627](../../../src/components/prototype/ssp-assembly.tsx#L627), [evidence-browser.tsx:155-163](../../../src/components/prototype/evidence-browser.tsx#L155-L163), [:215-231](../../../src/components/prototype/evidence-browser.tsx#L215-L231)

The campaign edit clears the selection before opening its Dialog, and SSP and evidence hide the preview while a form is open, so the Dialog's return-focus target is gone: after Cancel, focus lands on the body, the table's eye or the sheet's h2, and the reader has lost their place. EntitySection and RecordSummaryPreview keep the preview and reselect the saved row. Complete run locks the run with no confirmation, and on success the focused button disappears with no announcement.

Fix: keep the non-modal Shell.Panel mounted under a Dialog opened from it, so the default `finalFocus` returns to the trigger; for forms opened from the modal version PreviewSheet, keep replacing the frame and focus the recorded trigger once it remounts; put Complete run behind useConfirmation and toast on success, as the app's other `toast.add` callers do.

**PRT-3 · The task's Workstream link renders as plain text** (medium)\
[tasks.$taskId.tsx:265-275](../../../src/routes/tasks.$taskId.tsx#L265-L275)

The Workstream fact is a bare router `<Link>`, which Tailwind's preflight renders in the inherited colour with no underline, so the only way from a task to its workstream looks like every other value. Lint passes because `text-link-navigation` checks only TextLinks. This is the reference record page.

Fix: `<TextLink render={<Link to="/workstreams/$workstreamId" …/>}>` or RecordLink `table="workstreams"`; extend `ledger/prefer-text-link` to flag a Link or anchor with text children outside TextLink, BreadcrumbLink, a Button or a menu item's `render`.

**PRT-4 · Portfolio's two columns follow the viewport, so an open preview crushes both tables to 252px** (medium)\
[index.tsx:108](../../../src/routes/index.tsx#L108)

The grid switches to `minmax(0,1fr) 320px` at `xl`. With a Programs preview open at 1440, Main is 652px, the activity column keeps its 320px, and each table gets 252px: Risk posture shows only its Risk column, the views menu reads "All rec…" and Create program drops to a second row.

Fix: lay the columns out intrinsically, a wrapping Flex with a main column of about 560px minimum and a 320px basis for activity, or an auto-fit `minmax` template as Grid.mdx's IntrinsicInAPanel shows, so the feed drops below when a panel narrows Main. No new Grid prop.

## Low-severity findings

| Id     | Finding | Where | Fix |
| ------ | ------- | ----- | --- |
| PA1-14 | Wizard steps assume desktop: two-column grids with no base breakpoint, a vertical Stepper that takes the first 300px at 390px inside an unlabelled `<aside>`, native date inputs. | [program.tsx:30](../../../src/components/app/program-wizard/program.tsx#L30), [:86-105](../../../src/components/app/program-wizard/program.tsx#L86-L105), [program-wizard.tsx:283-309](../../../src/components/app/program-wizard.tsx#L283-L309) | One column at base; a compact Stepper below `lg` (a container-responsive orientation in the kit would help); DatePicker; label or drop the aside. |
| PA1-15 | One act, three phrases ("From a product…", "From a product", "Add system"); h1 "New program" against "Create program"; PageHeader.Lead is plain text. | [elements.tsx:356-366](../../../src/components/app/program-wizard/elements.tsx#L356-L366), [program-wizard.tsx:252-257](../../../src/components/app/program-wizard.tsx#L252-L257) | "Create system from product" throughout; h1 "Create program"; a Breadcrumb to Programs in Lead. |
| PA1-16 | The top nav re-implements `Shell.TopNav.End overflow`; My work and Profiles share one icon; Bell opens My work; Settings opens "Profile and appearance"; the schema shell hand-rolls its account block. | [shell.tsx:163-202](../../../src/components/app/shell.tsx#L163-L202), [schema-shell.tsx:112-121](../../../src/components/app/schema-shell.tsx#L112-L121) | Use `overflow`, distinct icons, one name for trigger and dialog, Shell.Profile. |
| PA1-18 | The review step shows three unlabelled impact badges ("High Moderate Low") and raw ISO dates. | [review.tsx:107-110](../../../src/components/app/program-wizard/review.tsx#L107-L110), [:194-205](../../../src/components/app/program-wizard/review.tsx#L194-L205) | Label C, I and A (or KeyValue rows); format dates through the locale. |
| PA1-19 | Schema inspector: "Not recorded" for Absent, one query per reference cell (up to 100 a page), Box properties, bordered count cards with four status regions, a raw router Link, two Empty anatomies. The loading "Record" h1 is [pattern audit](../pattern-audit-2026-09-17.md) §7. | [record-browser.tsx:134-157](../../../src/components/app/record-browser.tsx#L134-L157), [:1152-1196](../../../src/components/app/record-browser.tsx#L1152-L1196) | KeyValue, Absent, Stat.Grid, TextLink; batch-resolve titles per page; a Skeleton title. |
| PA1-20 | Evidence upload: a raw file input with a fixed id, a plain span for the file, relabelled buttons for busy, no success announcement. | [evidence-file.tsx:215-217](../../../src/components/app/evidence-file.tsx#L215-L217), [:255-297](../../../src/components/app/evidence-file.tsx#L255-L297) | `useId`; Attachment with uploading and done states; `role="status"` or a toast; Button `isLoading`. Kit: a file-select or drop-zone control. |
| PA1-21 | Add system and Add component insert blank rows that stay after the Sheet closes and block Continue ("Element 1: Enter a name."); Remove is not destructive. | [elements.tsx:138-167](../../../src/components/app/program-wizard/elements.tsx#L138-L167), [:249-271](../../../src/components/app/program-wizard/elements.tsx#L249-L271) | Add on Done with a name, or drop untouched rows on close; mark Remove destructive. |
| PA2-15 | /briefing's side list is Boxes and raw text, says "1 published versions", has mismatched empties with no route, and titles the decision preview with a raw ISO date. | [package-views.tsx:445-546](../../../src/components/prototype/package-views.tsx#L445-L546) | Keep the dashboard (inventory exception); Related/Item.Group, a compact Empty with a TextLink to Authorization packages, `formatPlural`, a locale date. |
| PA2-18 | Descriptions are unlabelled paragraphs ("No description recorded."); the issue rail omits Status and the campaign rail Owner. | [assessment-campaign.tsx:637-640](../../../src/components/prototype/assessment-campaign.tsx#L637-L640), [findings-views.tsx:337-359](../../../src/components/prototype/findings-views.tsx#L337-L359) | Prose labelled Description (it has no `pre-wrap`, so keep line breaks), Absent when empty, Status and Owner in Details. |
| PA3-13 | Seven `<p role="alert">` above tab content never clear; row actions, Publish and Create version succeed silently; ComponentRevision's error state is dead. | [library-components.tsx:324-328](../../../src/components/prototype/library-components.tsx#L324-L328), [:382](../../../src/components/prototype/library-components.tsx#L382), [library-products.tsx:760-791](../../../src/components/prototype/library-products.tsx#L760-L791) | Toast menu and row-action outcomes; delete the dead state. Alert for persistent errors is a sweep across all 25 sites. |
| PA3-19 | Record pages load tenant-wide tables and hold every tab, even a description-only Overview, behind one loading state. | [library-components.tsx:373-376](../../../src/components/prototype/library-components.tsx#L373-L376), [:849-854](../../../src/components/prototype/library-components.tsx#L849-L854), [add-from-library.tsx:117-131](../../../src/components/prototype/add-from-library.tsx#L117-L131) | Filter by the ids needed; QueryState per tab. |
| PA3-20 | Name cells with an icon, link, badge or second line are hand-built spans with `title` tooltips. | [product-structure.tsx:186-204](../../../src/components/prototype/product-structure.tsx#L186-L204), [system-library.tsx:135-153](../../../src/components/prototype/system-library.tsx#L135-L153) | Kit: icon, secondary-line and badge options on `c.text` and `c.id`, or a Table.Name part. |
| PA3-21 | "1 elements"; "{n} requirements" at 1; a raw import UUID in the trail; hrefs as plain text; `toLocaleDateString` beside LocalizedDate; "Consumer resp…" cut in the rail. | [add-from-library.tsx:568](../../../src/components/prototype/add-from-library.tsx#L568), [library-controls.tsx:289-291](../../../src/components/prototype/library-controls.tsx#L289-L291), [system-library.tsx:290](../../../src/components/prototype/system-library.tsx#L290) | The local `plural` helper (moved to `src/lib`), the source title, TextLink, LocalizedDate and Absent, `labelWidth` 160 on the component rail. |
| PA4-14 | Drilling into Contains swaps the preview's record with no Back, and previous and next follow table order. | [program-systems-tree.tsx:444-454](../../../src/components/prototype/program-systems-tree.tsx#L444-L454) | Open the child as a nested RecordPreviewPanel, or expand and scroll the tree to the active row. |
| PA4-17 | Empty copy says "Create the first activity event" where no create exists; prerequisites say "Add a POA&M plan first". | [program-shared.tsx:490-503](../../../src/components/prototype/program-shared.tsx#L490-L503), [program-workspace.tsx:472-486](../../../src/components/prototype/program-workspace.tsx#L472-L486) | Explanatory copy when creating is not allowed; Create in prerequisites. |
| PA4-18 | The remediation item is "POA&M commitment" in its title and MissingRecord; tabs "POA&M" and "Documents"; "No poa&m items yet". | [assurance-views.tsx:409-412](../../../src/components/prototype/assurance-views.tsx#L409-L412), [record-tools.tsx:434-437](../../../src/components/prototype/record-tools.tsx#L434-L437) | Remediation items, POA&M plans, Remediation item; keep acronym case in EntitySection. |
| PA4-19 | Create system from a record's Actions opens nothing after save. | [program-record.tsx:378-384](../../../src/components/prototype/program-record.tsx#L378-L384) | Pass `onSaved` so the new child's preview or record opens; a toast after a baseline change is optional. |
| PA4-20 | The component record body starts with two bare TextLinks; the control record has a body Button and a raw ISO Updated; the program rail shows Sponsor as strings and Code as text. Partly tracked: SystemProperties in docs/next.md (17 September), dates in responsive-2026-09-18 #8. | [program-record.tsx:400-540](../../../src/components/prototype/program-record.tsx#L400-L540), [program-workspace.tsx:496-506](../../../src/components/prototype/program-workspace.tsx#L496-L506) | Labelled KeyValues in Details; the objectives action in Actions; Absent, Id and formatted dates. |
| PA5-16 | The requirement preview gates Edit on insert permission, the record page on update. | [requirements-table.tsx:447-451](../../../src/components/prototype/requirements-table.tsx#L447-L451), [requirement-record.tsx:101-111](../../../src/components/prototype/requirement-record.tsx#L101-L111) | One `canEditIdentity` for both frames. |
| PA5-18 | A contentless requirement shows viewers an instruction they cannot act on; MissingRecord renders an h1 inside tabs; three missing-value styles on one screen. The generic empty sentence is [pattern audit](../pattern-audit-2026-09-17.md) §2. | [requirement-record.tsx:126-133](../../../src/components/prototype/requirement-record.tsx#L126-L133), [:227-238](../../../src/components/prototype/requirement-record.tsx#L227-L238), [record-tools.tsx:436-442](../../../src/components/prototype/record-tools.tsx#L436-L442) | Empty under the role check; an `inline` MissingRecord; Absent from projections. |
| PA5-19 | The reference requirements table links code and name to one record (three tab stops a row); a warning is a raw status paragraph; four dialogs hand-roll draft guards; components call Supabase directly. | [requirements-table.tsx:335-365](../../../src/components/prototype/requirements-table.tsx#L335-L365), [requirement-control-mappings.tsx:64-103](../../../src/components/prototype/requirement-control-mappings.tsx#L64-L103) | The code as a plain Id; Banner or Alert; useDraftGuard; queries into `src/lib`. |
| PA5-20 | Allocate, Map control, Link evidence and Create requirement revision close silently; a newly published evidence version is not preselected. | [requirement-allocations.tsx:339-345](../../../src/components/prototype/requirement-allocations.tsx#L339-L345), [requirement-evidence.tsx:196-210](../../../src/components/prototype/requirement-evidence.tsx#L196-L210) | Toast what was saved; return to RecordBrowser with the new version selected. |
| PRT-16 | Completing a task shows its pending label in a closed menu, succeeds silently and fails as a raw paragraph. | [tasks.$taskId.tsx:68-83](../../../src/routes/tasks.$taskId.tsx#L68-L83), [:141-150](../../../src/routes/tasks.$taskId.tsx#L141-L150) | A success toast; Alert or an error toast app-wide, with a lint rule against `role="alert"` on a bare `<p>`. |
| PRT-17 | Catalog Sources uses raw h2s larger than any Section title, raw URLs as new-tab link text, a `<pre>` of JSON, and EmptyMessage for empty collections. | [catalog.tsx:323-356](../../../src/routes/catalog.tsx#L323-L356), [profiles.$profileId.tsx:277-331](../../../src/routes/profiles.$profileId.tsx#L277-L331) | A Section or Item per source with a short labelled link and a cue; CodeBlock; Empty with the create action. |
| PRT-18 | The /components "Design system" playground sits in the product's System nav, with "Primary" and "Reset clicks" buttons. | [components.tsx:19-63](../../../src/routes/components.tsx#L19-L63), [shell.tsx:90](../../../src/components/app/shell.tsx#L90) | Josef's call: remove it and its inventory exception, or reduce it to a link to Storybook or `llms.txt`. |
| PRT-19 | The root error page shows a failure as Empty with raw error text; the 404's h1 is "Page" and it has no browser title. | [__root.tsx:37](../../../src/routes/__root.tsx#L37), [:68-98](../../../src/routes/__root.tsx#L68-L98) | Alert with Retry and a collapsed technical detail; "Page not found" as h1 and title. |
| PRT-20 | Aside landmarks are named five ways, primaries differ in size, the task's Actions trigger has no chevron, and the workstream has a bespoke divider. | [tasks.$taskId.tsx:133](../../../src/routes/tasks.$taskId.tsx#L133), [:257](../../../src/routes/tasks.$taskId.tsx#L257), [workstreams.$workstreamId.tsx:91-101](../../../src/routes/workstreams.$workstreamId.tsx#L91-L101), [:112](../../../src/routes/workstreams.$workstreamId.tsx#L112) | `<Record type> details`, default-size primaries, RecordActions' trigger, no divider. |

## Already tracked

- PA1-1, tailoring dialogs put the editor under a 1,196-row list below about 830px (high): [docs/next.md](../../next.md) Responsive follow-ups (WorkPane drill-in, Josef's open decision). Interim app fixes that do not wait on it: on select in the stacked layout, scroll the detail into view and focus its heading; default the control filter to "In effective set"; add a WorkPane story for CI's narrow project.
- PA2-2, PA3-3, three disagreeing tone maps and raw enum state badges: docs/next.md "A domain component layer". One domain StatusBadge and tone map aligned with [status-vocabulary.md](../status-vocabulary.md), whose stale file references need refreshing; until then, follow WorkTable's `labelFor` and `statusTone` in the library registers, Versions tables and rails.
- PA2-8, warnings and errors as Sections or bare `<p role="alert">`: [pattern audit](../pattern-audit-2026-09-17.md). Alert `tone="warning"` with `role="status"` for the static SSP divergence; `role="alert"` only for errors an action raises.
- PA2-13, State for Status, "Test campaign", "Search findings": pattern audit vocabulary table.
- PA2-19, SSP preview body action rows and repeated link names: pattern audit. Name the step links by number and instruction.
- PA3-11, the component Controls eye previews the control, not the row's implementation: pattern audit.
- PA3-22, pass-through adapters (LibraryLoading, LibraryEditor) and dead imports: pattern audit.
- PA5-7, requirement rail "Status: draft" and no identity in the preview: pattern audit (State vs Status). Label it State with StatusBadge, and add Code, Version and State under the preview's header.
- PA5-17, KeyValue labels truncate at 104px with no title: docs/next.md "Pixel widths as props".
- PRT-13, the Suppliers preview offers Edit organization to viewers: pattern audit.
