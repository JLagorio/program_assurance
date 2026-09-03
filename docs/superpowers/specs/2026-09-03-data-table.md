# Data table: the register grows up

Date: 2026-09-03. Josef's ask: a robust, mature table set on TanStack Table with good conventions, read against Base Web (Uber) and Atlassian, that does pinned columns, drag-and-drop reordering, filtering, row selection, nested rows and child tables properly. Companion to `2026-09-02-picker-sheet.md` (a table inside a sheet), `2026-09-02-requirements-tracking.md` (the coverage view and the RTM export) and items 2, 4 and 9 of `2026-09-02-ui-patterns-audit.md`.

The two sites are blocked from this environment, so the reading is of what the packages ship: `baseui@16` (`table`, `table-semantic`, `table-grid`, `data-table`) and `@atlaskit/dynamic-table@19`, `@atlaskit/table-tree@13`, `@atlaskit/table@1`, their types, READMEs and examples, plus `@tanstack/react-table@9.2.4`, which is the current major.

## What the kit has

One `Table` with seven parts (`Row`, `Cell`, `Header`, `Id`, `Selection`, `Group`, `Tree`): sticky header, `sort`/`onSort` on a header, `sticky` on the leading column, `width` in pixels, selected and static rows, a folding band, a treegrid cell. The prototype draws every register with it.

| In the prototype | Count |
| --- | ---: |
| Files rendering `Table` | 76 |
| Sortable headers | 14, in 2 files, on the app's own `useSort` |
| Paginated tables | 4, on the app's own `usePage` |
| Hand `.sort(` calls in routes and components | 27 |
| `Table.Selection` | 3 files |
| `Table.Tree` (treegrid) | 1, the system tree |
| `Table.Group` | 1 |
| Pinned, resizable, reorderable or hideable columns | 0 |
| Filters inside a table, child tables, virtualized rows | 0 |

The state lives in each route: sort in one hook, page in another, filter in a `useMemo`, selection in a `Set`. Nothing shares a vocabulary and nothing survives a reload.

## Taken

| From | Idea | Ours already | Add |
| --- | --- | --- | --- |
| Base Web | Four tables: `Table` (flex), `TableSemantic` (markup, `TableBuilder` columns), `TableGrid` (CSS grid, do-it-yourself), `DataTable` (batteries) | One, the markup | Two: `Table` stays the markup; `DataTable` is the batteries. `useDataTable` sits between, for a layout the renderer cannot draw |
| Base Web DataTable | Typed column kinds (String, Numerical, Categorical, Datetime, Boolean, Anchor, Custom, RowIndex), each with its sort, its filter and its alignment | `Table.Id`, `Absent`, tabular numerals on `Id` | `columns.id`, `.text`, `.number`, `.date`, `.status`, `.person`, `.actions`, `.custom`: the alignment, formatter, sort and filter come with the kind |
| Base Web DataTable | Selection with `batchActions`; the bar reads the count and clears | `Table.Selection` | `DataTable.SelectionBar`: count, actions, Clear; select-all across pages is explicit |
| Base Web DataTable | `rowActions` revealed on the hovered row | The eye on `Table.Id` | `columns.actions`: an overflow `DropdownMenu` on hover and focus, always the last column |
| Base Web DataTable | Text query plus per-column filters, each a chip with a description | `FilterChip`, `Toolbar`, `Input` | Global filter in the toolbar; column filters as chips whose popover is built from the column's facet |
| Base Web DataTable | Virtualized rows at a fixed `rowHeight` | `dimension.row` fixes the height | `virtualize` on `DataTable`, on `@tanstack/react-virtual` |
| Base Web | Controlled and stateful pairs of every component | Nothing | One component; every slice of state is `initialX` or `x`/`onXChange`, TanStack's own contract |
| Atlassian DynamicTable | `isRankable`: drag a row to reorder, `onRankEnd` reports source and destination | Nothing | `reorderRows` with a `Table.Handle` cell, keyboard included |
| Atlassian DynamicTable | `shouldTruncate` per head cell, `isFixedSize`, `emptyView` inside the frame, `highlightedRowIndex`, `rowsPerPage` | Truncation by default, `Pagination`, `Empty` | `layout: "fixed"`, the empty and loading states drawn inside the table's frame, `highlight` on a row |
| Atlassian TableTree | `Headers` carry widths; `Rows` take `items`, `hasChildren`, `isExpanded`; a data helper appends children lazily | `Table.Tree`, the treegrid aria | `tree` mode on `DataTable` on TanStack's `getSubRows`; lazy children through `manualExpanding` |
| Atlassian Table (experimental) | `ExpandableRow`, `ExpandableCell`, `ExpandableRowContent`: a row opens into a full-width region | Nothing | `Table.Detail`: one `tr`, one `td` spanning every column; the child table is what goes inside |
| Atlassian Table | `isSelectable` on the table, not per row; `SortableColumn` | `Table.Selection` per row | The selection column is one option, `selectable`, and the kit draws the column |
| Both | Loading keeps the frame and the header; the empty state sits inside the table | `Skeleton`, `Empty` | `state: "loading" \| "empty" \| "error"` on `DataTable`; skeleton rows at the row height |
| Both | The header is sticky and the table scrolls inside its own frame | `sticky top-0` on `Table.Header`, which only works when the wrapper scrolls | `Table.Scroll`: the frame with `maxHeight`, both axes, and the edge shadows pinned columns need |

Left behind: Base Web's flex `Table` and `TableGrid` (a `<table>` with `position: sticky` does what the grid did); Base Web's `Categorical` filter as a component (ours is a facet in a popover, one part for every kind); Atlassian's per-cell `colSpan` in data (`Table.Detail` and `Table.Group` are the only spanning rows); the per-column filter row (audit, 2026-09-02); Atlassian's analytics props.

## Two tables and one hook

**`Table`** (components) is the markup and stays as it is. The author lays the rows out by hand. For a table with no state: a form laid out as a table, a fact sheet, a totals table, a specimen. Rule of thumb: under thirty rows, nothing to sort, nothing to choose.

**`useDataTable`** (patterns) is TanStack Table v9 through `createTableHook`, with the kit's features and cell components baked in. It returns the `table`. An author reaches for it when the renderer cannot draw the layout: PickerSheet's second frame, a matrix with row and column headers, a table whose rows are cards.

**`DataTable`** (patterns) is the renderer. It takes the `table` from the hook and draws header groups, rows and cells with `Table` parts; the toolbar slot above, pagination or the virtual scroller below, the states inside the frame, the selection bar when rows are chosen. Every feature is one option on the hook and one part in the renderer.

```tsx
const columns = defineColumns<Risk>((c) => [
  c.id("id", { onPreview }),
  c.text("title", { header: "Risk", minWidth: 240, pin: "start" }),
  c.status("status", { tone: riskTone }),
  c.person("owner"),
  c.number("residual", { header: "Residual", format: "integer" }),
  c.date("due", { format: "short" }),
  c.actions((row) => riskActions(row)),
]);

const table = useDataTable({ columns, data: risks, getRowId: (r) => r.id, selectable: true, sorting, onSortingChange });
return <DataTable table={table} toolbar={<Toolbar>…</Toolbar>} pageSize={25} state={risks.length ? "ready" : "empty"} />;
```

The rule for which: a table sorts, filters, pages, chooses, pins, nests or scrolls inside itself, so it is a `DataTable`. Otherwise it is a `Table`. No route sorts, filters or pages by hand once the pattern lands; `useSort` and `usePage` in `src/lib/table-state.ts` go.

## Why TanStack Table 9

- Features are opt-in imports (`rowSortingFeature`, `columnPinningFeature`, …) composed with `tableFeatures`, so the kit ships one hook with the seventeen it needs and the app pays for nothing else.
- `createTableHook` is a design-system hook: it takes the features and a set of `cellComponents` and `headerComponents`, and returns `useAppTable`, `createAppColumnHelper` and the contexts. That is `useDataTable` and `defineColumns` for free, typed to the kit's features.
- Row models are functions (`createSortedRowModel`, `createFilteredRowModel`, `createPaginatedRowModel`, `createExpandedRowModel`, `createGroupedRowModel`, `createFacetedRowModel`), each `manual*` when the server does it.
- State is atoms; `table.Subscribe` and the `selector` argument keep a thousand rows from re-rendering when one checkbox changes.
- It ships `columnPinningFeature` with offsets, `columnResizingFeature`, `columnOrderingFeature`, `columnVisibilityFeature`, `rowExpandingFeature` (`getSubRows`, `manualExpanding`, `paginateExpandedRows`), `rowPinningFeature`, `rowSelectionFeature`, `columnFacetingFeature`, `globalFilteringFeature`, `columnGroupingFeature` and `rowAggregationFeature`. Drag and drop and virtualization are not its job, so they are `@dnd-kit` and `@tanstack/react-virtual`.

The cost: v9 is a year old and most of the internet's examples are v8. The hook and the column helper hide the difference from the app: a route sees `defineColumns`, `useDataTable` and `DataTable`, never TanStack.

## Features

Each row: the option on the hook, the TanStack feature under it, the part that draws it, the story that proves it.

| Feature | Option | Under it | Draws | Story |
| --- | --- | --- | --- | --- |
| Sort | `sorting`, one column at a time; shift-click for a second when `multiSort` | `rowSortingFeature`, `sortFn_alphanumeric` for text with numbers, `sortFn_datetime` for dates | `Table.Header sort` (exists) | Sorting |
| Search | `globalFilter`, the toolbar's `Input` | `globalFilteringFeature`, `filterFn_includesString` on text and id kinds | `DataTable.Search` in the toolbar slot | Searching |
| Filter by column | `columnFilters` | `columnFilteringFeature`, `columnFacetingFeature` for the values on offer | `DataTable.Filter`: a `FilterChip` whose `Popover` lists the facet as checkboxes (status, person), a range (number, date), or a text field; applied filters read as chips with Clear | Filtering |
| Saved questions | `presets: { label, state }[]` | A named partial state applied at once | `ToggleGroup count` in the toolbar, the count from a faceted row model per preset | Presets |
| Choose rows | `selectable`, `getRowId` | `rowSelectionFeature`; `enableRowSelection(row)` for rows that cannot be | `Table.Selection` (exists) as the first column; `DataTable.SelectionBar` with count, actions, Clear; "Select all 340" as a second step after the page's 25 | Selection |
| Row actions | `c.actions(row => Action[])` | A display column | `DropdownMenu` on a kebab `IconButton`, visible on row hover and focus, last column, 40px, never sortable | Row actions |
| Open and preview | `c.id("id", { onPreview })`, `onRowClick` | The row is a link (`TextLink` on the id) | `Table.Id` (exists) | Register |
| Paginate | `pageSize`, `pagination`/`onPaginationChange`; `rowCount` when the server pages | `rowPaginationFeature`, `createPaginatedRowModel`, `manualPagination` | `Pagination` (exists) under the table | Pagination |
| Scroll instead | `virtualize`, `height` | `@tanstack/react-virtual` on the `Table.Scroll` frame; rows are `dimension.row` tall so no measuring | `Table.Scroll` with a spacer row above and below | Virtualized |
| Pin columns | `pin: "start" \| "end"` on a column is the author's default; the reader pins and unpins from the column menu and it is kept in their view | `columnPinningFeature`; `column.getStart()` and `getAfter()` give the offsets | `Table.Header`/`Table.Cell` `pinned` with `insetInlineStart`/`End` from the offset; a shadow on the inner edge while the frame is scrolled (`data-scrolled-start`/`-end` on `Table.Scroll`) | Pinned columns |
| Resize columns | `resizable` | `columnSizingFeature` + `columnResizingFeature`, `columnResizeMode: "onEnd"` | A handle on the trailing edge of `Table.Header`, `min-width` from the kind, a double-click resets | Resizing |
| Reorder columns | `reorderColumns` | `columnOrderingFeature`; `@dnd-kit/core` + `@dnd-kit/sortable` (horizontal) on the header row, `KeyboardSensor` for the keyboard, `restrictToHorizontalAxis` | A grip on `Table.Header` hover; the dragged header as an overlay; pinned columns stay in their band | Reordering columns |
| Hide columns | `hideable` (default on; `hideable: false` on a column that must stay) | `columnVisibilityFeature` | `DataTable.Columns`: a `DropdownMenu` with `Item isSelected` per column, then Reset view. The audit's "cut first, menu later" resolves to both: the author cuts the columns nobody needs, the reader hides the rest | Column choice |
| Column groups | `c.group("Confidentiality", [...])` | Header groups | Two header rows; the group heading spans and is centred | Column groups |
| Nested rows | `tree: { getChildren, initialExpanded }` | `rowExpandingFeature`, `getSubRows`, `createExpandedRowModel`; `manualExpanding` for children loaded on open | `Table.Tree` (exists) in the first data column; `role="treegrid"`, `aria-level`, `aria-expanded`; arrow keys open, close, move | Tree |
| Child tables | `detail: (row) => ReactNode` | `rowExpandingFeature` with `getRowCanExpand` | `Table.Detail`: the expanded row's content spanning every column; a chevron cell at the start; `aria-controls` from the chevron to the detail row; a `Table` or `DataTable` inside | Detail rows |
| Row groups | `groupBy: "family"` | `columnGroupingFeature`, `createGroupedRowModel`, `rowAggregationFeature` for the counts | `Table.Group` (exists) per group, the count from the aggregation; opened and closed as one | Groups |
| Pin rows | `pin` on a row | `rowPinningFeature` | Pinned rows sit under the header or above the footer at the row height, `Table.Row isStatic` | Pinned rows |
| Totals | `c.number("cost", { footer: "sum" })` | `footer` on the column, `aggregationFn_sum` | A `tfoot` of `Table.Row isStatic` | Totals |
| Reorder rows | `reorderRows`, `onReorder(from, to)` | `@dnd-kit/sortable` (vertical) on the body; sorting and grouping switch off while it is on | `Table.Handle`: a grip cell, first column after selection | Reordering rows |
| Edit in place | `c.text("claim", { editable: { validate, save } })` | Nothing of TanStack's | `Editable` (exists) inside `Table.Cell`; Tab and Enter move down the column | Editing |
| Server mode | `manual: { sorting, filtering, pagination }`, `rowCount` | `manual*` on every row model | Nothing changes in the frame | Server |
| Density | None on the table: a setting, beside the mode switch, read through `data-density` on the root | Nothing | `dimension.row.default` (40) and `.compact` (36); the header stays 32; `Table` reads the attribute in CSS, so a bare `Table` follows the setting too | Matrix |
| States | `state: "ready" \| "loading" \| "empty" \| "error"`, `empty` and `error` slots | Nothing | Skeleton rows inside the frame; `Empty` inside the frame; `Alert` inside the frame; the header stays | States |
| Export | `toRows(table)` | The visible cells of the current row model | A lib function; the RTM export (requirements spec) is its first use | — |

Everything on that list is one kit part or one option; nothing is a second table.

## Conventions

Written into `Table.mdx` under "Rules", and enforced where a rule can be.

- **Alignment.** Text starts; numbers end, with tabular numerals, and their header ends with them; a status or a person starts. A number never centres. Column kinds carry this, so a `DataTable` cannot get it wrong.
- **Widths.** The kind gives the minimum (id 92, status 120, person 160, date 112, number 96, actions 40); the author gives `width` for fixed columns and one column takes the slack. `layout: "fixed"` when the reader resizes or reorders, so a change does not reflow the others.
- **Truncation.** Cells truncate to one line; the full text is the cell's `title`. A column that must wrap says `wrap: true` and the row grows; that column is never sortable by eye.
- **Header.** Sentence case, no trailing colon, no units in the label when the cells carry them. An icon-only header carries an `aria-label`. The sort arrow appears on hover and stays when sorted.
- **Rows.** Hairline between rows, no zebra, hover on the current surface's hovered token, selected on `selected`. The row is the link; the id is blue on hover; actions are in the last column.
- **Empty values.** `Absent`, never a blank cell or a dash typed by hand.
- **Sticky header** is the default and needs the frame: a `DataTable` always renders `Table.Scroll`, so the header sticks to the frame, not the page. A bare `Table` can opt in with `maxHeight`.
- **Pinned columns** are the id and the name, at most two at the start and one at the end (actions). The shadow appears only when there is something behind it.
- **Selection** is a checkbox column, never a click on the row (the row opens the record). Shift-click chooses a range. The bar names the count and the verbs; Escape clears.
- **Keyboard.** A `DataTable` is a `table`: Tab moves through the interactive elements in reading order and that is enough. A `tree` is a `treegrid` with arrow keys. Only an editable table is a `grid` with a roving tabindex, and then arrow keys move between cells.
- **Loading** never removes the header or changes the height of what is already there.
- **Lint.** `ledger/cell-plain` (exists) covers `DataTable` cells because they are `Table.Cell`. New: `ledger/no-hand-sort`, a `.sort(` in a file that renders `Table.Header sort` is a `DataTable` waiting to happen.

## The reader's view

Decided 2026-09-03 (Josef): every rendering of a table is that reader's own, so the layout persists in `localStorage`, per table, per browser; the reader can pin; density is a setting, not a prop.

- **Two owners of state.** The URL owns the question: sort, filters, search, page, expanded rows, the peek. It is shareable and the back button works. `localStorage` owns the reader's layout: column order, widths, visibility and pinning. A shared link never carries one reader's layout, and a reload never loses it.
- **`view` on the hook.** `useDataTable({ view: "risks", … })` names the table; the hook reads `ledger.table.risks.view` on mount, applies it over the author's defaults, and writes it on every change of the four slices. No `view`, nothing persists.
- **Reconciling with the columns.** A stored column id the table no longer has is dropped; a column the store does not know takes its default place. The store is `{ v: 1, order, sizing, visibility, pinning }`; a bump of `v` discards older stores.
- **Reset view** is the last item of `DataTable.Columns` and clears the store for that table.
- **Hydration.** The app renders on the server, so the default layout is what the server sends and the stored view applies after mount, in one commit. Widths and order can shift once on first paint; the setting for density does not, because it rides the mode switch's before-paint script.
- **Density is a setting.** It joins the mode switch: the same provider and store (`ledger.density`, `"default" | "compact"`), a `data-density` attribute set before paint, the control beside the mode switch. `Table` resolves `h-row` from the attribute, so every table in the app follows it and no table takes a `density` prop. The one exception is a table that is compact by design, such as PickerSheet's, which sets `data-density` on its own frame.
- **Storage is a convenience.** Every read and write is wrapped; a private window or a cleared site renders the defaults.

## Files

```
packages/design-system/src/
  components/table.tsx           + Table.Scroll, Table.Detail, Table.Handle; `pinned` and `resize` on Header, `pinned` on Cell
  patterns/data-table/
    features.ts                  tableFeatures({ …the seventeen })
    use-data-table.ts            createTableHook(...) → useDataTable, useTableContext
    columns.ts                   defineColumns and the kinds; ColumnMeta augmentation (align, kind, minWidth, wrap, pin)
    data-table.tsx               the renderer: frame, header groups, rows, detail, footer, states, pagination
    selection-bar.tsx            DataTable.SelectionBar
    filter.tsx                   DataTable.Filter, DataTable.Search, presets
    columns-menu.tsx             DataTable.Columns
    reorder.tsx                  the dnd-kit contexts for headers and rows
    virtual.tsx                  the virtualizer bound to Table.Scroll
    to-rows.ts                   export
    view-store.ts                the reader's view in localStorage, reconciled with the columns
  mode/                          + density: the same provider and before-paint script as the mode switch, `data-density` on the root
  stories/patterns/DataTable.stories.tsx   one story per feature row above, then Matrix
  stories/patterns/DataTable.mdx           the rule for which table; the option table
  stories/components/Table.mdx             + Rules, + Scroll, Detail, Handle
```

Dependencies on the package: `@tanstack/react-table@^9.2`, `@tanstack/react-virtual@^3.14`, `@dnd-kit/core@^6.3`, `@dnd-kit/sortable@^10`, `@dnd-kit/modifiers@^9`. The kit has no router, so URL state stays in the app: `src/lib/table-state.ts` becomes one adapter that binds `sorting`, `columnFilters`, `pagination` and `expanded` to TanStack Router's validated search, replacing `useSort` and `usePage`.

## Prototype

Three surfaces move, one per kind of table, and prove the pattern. The other seventy-three stay on `Table` until a route is touched for another reason.

1. **Risks index** (`risks.tsx`): sort, search, filters as chips, pagination, row actions, the id's preview. `useSort` and `usePage` are deleted with it.
2. **PickerSheet frame one**: `useDataTable` with `selectable`, global filter and facets; the sheet's footer reads `table.getSelectedRowModel()`. Frame two is `useDataTable` with `Editable` cells and the defaults row.
3. **System tree** (`system-tree.tsx`): `tree` mode replaces the hand-rolled walk; expanded state moves to the URL adapter; the Suspect count (requirements spec) is a column.

Then, as they come up: the coverage view (presets are the saved questions; the bar per row is the `Progress.Stacked` cell), the control board, and every register the audit listed.

## Order

Each step is one commit, Storybook first, app second, screenshots for Josef, `docs/next.md` ticked.

0. **Spike**, half a day. Install v9, put the risks table through `createTableHook` and the existing `Table` parts. Confirm the typing holds with `cellComponents`, and that `Subscribe` keeps a 1,000-row selection cheap. Decision gate: v9 or v8. *Landed 2026-09-03: v9 stays. The typing holds once a kind reads its field through an accessor function rather than a key (TanStack's deferred conditional over `DeepKeys` does not resolve inside a generic wrapper). Selection at a thousand rows is kept cheap by memoizing the row on what it shows, not by `Subscribe`: the route needs the re-render for its selection bar, so the hook keeps the whole-state selector and the rows opt out. One click went from 1.6 s to 0.2 s in headless Chromium.*
1. **Foundation.** `features.ts`, `useDataTable`, `defineColumns` with the seven kinds, `DataTable` with sorting, search, pagination, states, `Table.Scroll`; density as a setting beside the mode switch. Risks index on it. `useSort`/`usePage` gone. Stories: Register, Sorting, Searching, Pagination, States, Matrix. *Landed 2026-09-03 with the spike: risks and programs both moved (programs was the other user of `usePage`, and its Columns popover now drives `columnVisibility`). `Table.Scroll` is a `maxHeight` on `Table` for now; the frame with the edge shadows comes with pinning in step 3. Sorting, search, pagination and the states share the Register and States stories rather than one each.*
2. **Choosing.** Selection, the bar, select-all-pages, row actions, column filters on facets, presets. PickerSheet on it. Stories: Selection, Row actions, Filtering, Presets.
3. **Columns.** Pinning with offsets and the edge shadow, resizing, hiding, column groups, reordering by drag and keyboard, and the reader's view in `localStorage` with Reset view. Stories: Pinned columns, Resizing, Column choice, Column groups, Reordering columns, Saved view.
4. **Rows.** Tree mode with the treegrid keyboard, detail rows, groups on the grouped row model, pinned rows and totals, row reordering with the handle. System tree on it. Stories: Tree, Detail rows, Groups, Pinned rows, Totals, Reordering rows.
5. **Scale.** Virtualization, server mode, the URL adapter, `toRows`. Stories: Virtualized, Server.
6. **Editing.** `Editable` cells with the column keyboard model, the grid role when a table is editable. PickerSheet frame two on it. Story: Editing.

Steps 3, 4 and 5 are independent once 1 and 2 have landed, so two agents can take them side by side without touching the same file: 3 is columns and headers, 4 is rows and bodies, 5 is the frame.

## Calls made without asking, for Josef to overturn in one reading

1. TanStack Table **9**, not 8. The hook hides it, and 8 is the one with an end date.
2. **dnd-kit**, not Atlassian's pragmatic-drag-and-drop. Keyboard reordering comes built in; pragmatic needs it written. Both are one file (`reorder.tsx`) to swap.
3. The tree is a **mode of `DataTable`**, not a third component. Atlassian's `TableTree` is a separate package because their tables predate it; ours has `Table.Tree` already.
4. **`DataTable` takes a `table`**, not columns and data. One line more at the call site; the state's owner (a route, a sheet, the URL) is always visible.
5. **No per-column filter row.** Filters are chips in the toolbar, built from facets. The audit said so on 2026-09-02 and Base Web's own filter chips agree.
6. **Plain `table` role** by default; `treegrid` for trees; `grid` only when cells are editable.
7. Sorting is **one column** by default; shift-click for a second only when a table says `multiSort`.
8. **Three surfaces migrate**, not seventy-six. The rest move when touched.

## Decided 2026-09-03

- A reader's column choices, order, widths and pins persist per table in `localStorage`; the URL keeps the question. Section "The reader's view".
- The reader can pin; the author's `pin` is only the default.
- Density is a setting beside the mode switch, not a prop; 40 stays the default and compact is the reader's choice.
