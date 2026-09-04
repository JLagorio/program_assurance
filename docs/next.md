# What's next

A living list for the design system and the prototype. Josef owns the decisions; whoever is working owns the work. Tick a box when it lands and move it to Done with the date. Keep it short: one line per item, the reasoning lives in the spec or the audit it points at.

Updated 2026-09-03.

## Decisions waiting on Josef

- [ ] **Token sheet sign-offs.** Palette ramps, semantic colour in both modes, the type, space, shape, dimension and motion specimens. Spec steps 1–3 in `docs/superpowers/specs/2026-09-02-token-architecture.md`. The grey borders that AA contrast costs are part of this.
- [ ] **Cutover compromises** (spec step 8): margins became padding on unpainted elements, so hit areas grew by the old margin; `border-l-2` quote rules are one pixel; `opacity-60/70` dims are `opacity-disabled`; the 30–34px stat is `font-heading-large` at 28px; the control-workspace rings take their track colour inline.
- [ ] **Where the data drives the UI** (`docs/superpowers/specs/2026-09-02-ui-patterns-audit.md`): the tree's ten columns (proposal: fold C/I/A into the Control set cell and Kind into the name hint, leaving seven); the categorized element's fourteen header facts against the rule of six (proposal: drop Scopes, Requirements and Controls reached); coverage's Method and Owner columns (proposal: drop them, they are on the requirement record).
- [ ] **Chart's first screen.** Candidates: the program dashboard's coverage by family, the home page's framework coverage. Risk scoring stays without a sparkline or gauge on purpose.
- [ ] **A non-modal Sheet**, only if the peek panel should stay open while the table behind it is clicked (audit item 7).

## Kit

- [ ] **Data table, the calls.** Eight calls made without asking in `docs/superpowers/specs/2026-09-03-data-table.md`, plus one more from step 6: Tab moves across an editable table, Enter moves down. Overturn any in one reading.
- [ ] **Registers still on `Table`.** The coverage view, the control board and the rest move onto `DataTable` when touched; the rule for which is in the Data table docs page.
- [ ] **Step 9 · Publishable build** with type declarations, when the second project appears.
- [ ] **`docs/guides/component-library.md`** still describes `src/ds`. Rewrite onto the package or retire it in favour of the Storybook docs.

## Prototype

- [ ] **Picker adoption.** (The kit side is done: PickerSheet's story runs both frames on DataTable.) "Allocate a requirement" (system-tree.tsx) and the tailoring pane's two Comboboxes move onto `PickerSheet`; `ApplicabilityModal` becomes the row action in its second frame. Spec: `docs/superpowers/specs/2026-09-02-picker-sheet.md`, with three calls for Josef to overturn.
- [ ] **The peek stack in the URL.** `NodePreviewSheet` drills into a child with no way back; `PreviewSheet` has `onBack` now. Keep the stack in a `?peek=` search param so the chevron and the browser's back are the same thing.
- [ ] **One preview body per record type**, at two densities (glance for HoverCard, peek for PreviewSheet). `ProgramPeek`, `RiskPeek` and `NodePreviewSheet` are three unrelated bodies today.
- [ ] **Forms.** No form marks a required field and none validates on submit. The kit side landed 2026-09-02 (Field `isRequired` draws the asterisk, `error` turns the control's border red and shows the message). The app side is per form: name the required fields, pass `error` on submit. 146 Fields, 11 pass either today.
- [ ] **Hydration mismatch** on `/programs/$programId/baseline` (server text differs from client). Seen 2026-09-02; not the kit's; unowned.
- [ ] **Link-looking buttons** that are not blue (`<button className="hover:underline">`, rmf-timeline and a few others). Neither `Button variant="link"` nor TextLink; decide whether they are links, actions, or plain text.

## Done

- 2026-09-03 · **Data table, step 6**: editable text and status cells with the grid role and Enter moving down the column; both PickerSheet frames on DataTable.
- 2026-09-03 · **Data table, step 5**: virtual scroll, server mode, `toRows`/`toCsv`, and the URL adapter in `src/lib/table-state.ts`; the risks route keeps sort, page, search and filters in the URL and exports its CSV.
- 2026-09-03 · **Data table, step 4**: tree mode with the treegrid keyboard, detail rows, groups, pinned rows, totals in the footer, row reordering by handle; the system tree on tree mode.
- 2026-09-03 · **Data table, step 3**: pinned columns with offsets and the scrolled edge, resizing, drag and keyboard reordering, hiding from the Columns menu or the header's own, column groups; the reader's order, widths, visibility and pins persist per table in localStorage with Reset view. Risks and programs on it.
- 2026-09-03 · **Data table, step 2**: `DataTable.SelectionBar` with select-all-pages, `.Filter` chips built from each column's facet or range, `.Search`, `.Presets` with counts; the routes' tabs and chips are one filter state.
- 2026-09-03 · **Data table, steps 0 and 1**: TanStack Table 9 through `useDataTable`, `defineColumns` by kind, `DataTable` with sorting, search, pagination and the states; risks and programs on it, `useSort`/`usePage` deleted; density a setting beside the mode switch, before-paint script and all.
- 2026-09-02 · **Step 7, the mode switch**: provider, three-state control, storage, before-paint script; the light pin is off the prototype root and the switch sits in the top bar.
- 2026-09-02 · **Audit items 9–11 in the kit**: `PickerSheet` with its spec, `PreviewSheet` with `onBack`, `status` and `facts` on the compact header, the hover ladder written down.
- 2026-09-02 · **The spine audit's kit items**, all five: TextLink (147 links, 2 wrapped buttons and 9 text buttons swept onto it), PreviewSheet (node-preview on it), Table.Tree (system-tree on it, `tree-cell.tsx` gone), ToggleGroup `count` (coverage on it), Fact.Group and RecordHeader `facts` (the four strips on them). Every `<colgroup>` in the prototype (119) became `Table.Header width`; two lint rules keep both from coming back. Items 7 and 8 stay as the audit decided.
- 2026-09-02 · **Invalid state on the controls** (`aria-invalid` turns the border red) after Josef's note on forms.
- 2026-09-02 · **Matrices render once**; the Storybook toolbar switches the mode. The side-by-side decorator is gone.
- 2026-09-02 · **Coverage batch**: a matrix story per family, the ratchet in the build, the Vocabulary and control-board sheets back, the Chart family.
- 2026-09-02 · **Prototype cutover**, steps one and two: the prototype runs on `@ledger/design-system` alone.
