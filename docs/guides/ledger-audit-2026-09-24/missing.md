# Missing components and patterns

Part of the [Ledger audit, 24 September 2026](README.md).

This section answers what Ledger should have that it does not. It merges the gap analysis (GAP) with the missing parts every other unit reported. The codes after each name are the units that reported it, and the priority is the highest any of them gave.

Ledger covers most of what a record workspace needs. Several apparent gaps are the prototype ignoring parts the kit already has (GAP-10):

- FieldError and the Forms contract exist, but no product form uses them.
- Timeline.Item already carries an actor, a subject link, a time and a body, yet the feeds are hand-built.
- Stat, CodeBlock, FilterChip, DatePicker and Alert are almost unused.
- The program timeline wraps Timeline's own Scroller in a second one (GAP-11).

The gaps that survive sit where the product is heaviest: form errors, file upload, date and time entry and display, long authored text, version comparison, dialog structure and pending state, heading levels and announcements.

The first fix is in the app, not the kit. Bring the reference CreateTaskDialog onto the documented Forms contract (GAP-1), then add the Field error binding and ErrorSummary below.

## Add now

The prototype already hand-rolls each of these, or a current flow needs it.

**Field error binding** (INP, G7, GAP). One way to mark a field invalid that wires FieldError, `aria-invalid`, `data-invalid` and `aria-describedby`, with the id, required and disabled state, so the accessible form is the easy path for about 20 product forms.

- Evidence: 0 uses of FieldError, `aria-invalid` or `data-invalid` in `src/`, against 50 hand-written `<p role="alert" className="text-danger">`. Four local wrappers do the wiring differently ([fields.tsx:22](../../../src/components/app/fields.tsx#L22), [create-task-dialog.tsx:39](../../../src/components/prototype/create-task-dialog.tsx#L39), [create-evidence-dialog.tsx:39](../../../src/components/prototype/create-evidence-dialog.tsx#L39)). The sign-in inputs have no `aria-invalid` or `aria-describedby`. See GAP-1.
- Closest part: Field and FieldError. Field is layout only ([field.tsx:63-75](../../../packages/design-system/src/components/field.tsx#L63-L75)) and FieldError has no id wiring ([:153-181](../../../packages/design-system/src/components/field.tsx#L153-L181)), so every form has to wire the relationship by hand, and the product has stopped doing it.
- Reference: Base UI Field.Root and Field.Error; Atlassian Field `fieldProps` and ErrorMessage; React Aria TextField.

**ErrorSummary** (INP, GAP). Every issue in one place on submit, each item a button that moves focus to its field, for long dialogs and the program wizard.

- Evidence: the wizard's summary is a `role="alert"` list of plain text with no link to the step or field ([program-wizard.tsx:371-380](../../../src/components/app/program-wizard.tsx#L371-L380)). CreateTaskDialog reports only the first issue ([create-task-dialog.tsx:228](../../../src/components/prototype/create-task-dialog.tsx#L228)). [Forms.mdx:100](../../../packages/design-system/src/stories/patterns/Forms.mdx#L100) promises the summary, and says the application supplies its own.
- Closest part: Alert with a tone already covers a form-level result, so no separate form-message part is needed (GAP-1). Nothing lists the issues and moves focus. The Forms recovery story builds one with "Review name" buttons ([Forms.stories.tsx:999-1020](../../../packages/design-system/src/stories/patterns/Forms.stories.tsx#L999-L1020)); lift it into a titled Alert whose items focus their controls.
- Reference: GOV.UK Error summary; Carbon forms pattern; WCAG 3.3.1 and 3.3.3.

**DialogBody and SheetBody** (API, MOD, PA3, PRM, PA1). The one scrolling region between a fixed header and footer that the form contract needs ("the footer stays outside the scrolling field region"), with standard padding. MOD also asks for AlertDialogBody and DrawerBody.

- Evidence: 19 of 20 prototype overlay files write their own scroller, with three different insets ([create-task-dialog.tsx:272](../../../src/components/prototype/create-task-dialog.tsx#L272), [requirement-allocations.tsx:382](../../../src/components/prototype/requirement-allocations.tsx#L382), [control-picker.tsx:121](../../../src/components/app/profile-tailoring/control-picker.tsx#L121)). Kit patterns do the same ([picker-sheet.tsx:136](../../../packages/design-system/src/patterns/picker-sheet.tsx#L136), [preview-sheet.tsx:115](../../../packages/design-system/src/patterns/preview-sheet.tsx#L115)). Three dialogs use a fieldset that does not scroll ([record-browser.tsx:816-820](../../../src/components/app/record-browser.tsx#L816-L820), [library-products.tsx:990](../../../src/components/prototype/library-products.tsx#L990), [product-structure.tsx:544](../../../src/components/prototype/product-structure.tsx#L544)), which makes the generic record form unusable at short heights.
- Closest part: DialogHeader and DialogFooter exist; there is no body part.
- Reference: Atlassian ModalBody; Carbon ModalBody; Polaris Modal.Section.

**Form dialog recipe** (MOD, DOC). The default create and edit surface as one documented, copyable composition: a controlled root, a form that unmounts with the popup, the submit in the footer through `form`, validation on submit, and useDraftGuard for dirty dismissal and focus return. It pairs with the `pending` state in GAP-4.

- Evidence: useDraftGuard has 3 users while about 15 files hand-roll the guard, and 18 literal-open dialogs lose focus on close (MOD-1). The Dialog "Form" story is not a form ([Dialog.stories.tsx:34-50](../../../packages/design-system/src/stories/components/Dialog.stories.tsx#L34-L50), [:101](../../../packages/design-system/src/stories/components/Dialog.stories.tsx#L101); [Recipes.mdx:51](../../../packages/design-system/src/stories/docs/Recipes.mdx#L51)).
- Closest part: the Forms page documents fields and errors, not the dialog around them.
- Reference: product-patterns.md "Forms and confirmations"; Base UI Dialog controlled example.

**FileTrigger and DropZone** (GAP, STA). Attaching evidence, the product's core artefact: pick or drop, `accept` and `maxSize` checked on selection, per-file progress and error, retry and an announced result. This is GAP-7 (medium).

- Evidence: the evidence file region is a raw `<h2>` and an `Input type="file"` labelled "Attach a file (up to 50 MiB)" ([evidence-file.tsx:254-316](../../../src/components/app/evidence-file.tsx#L254-L316)). The native button reads as plain text. Upload file stays disabled until a file is chosen, which the contract forbids for a primary. Upload status is the label "Uploading…", and download is a hand-made anchor ([:240-246](../../../src/components/app/evidence-file.tsx#L240-L246)). There is no drag and drop and no progress for a 50 MiB file.
- Closest part: Attachment models idle, uploading, processing and error states with `aria-busy`, but by design selects no files.
- Fix: a generic FileTrigger and drop zone that feeds Attachment rows in uploading, error and done states, with Progress and a polite status. Validate on selection with a FieldError and keep the primary enabled. Rebuild EvidenceFile on it and keep its reserved-path recovery.
- Reference: Carbon File uploader; React Aria FileTrigger and DropZone; Polaris DropZone.

**TimeField, or a date-and-time field** (DAT, PA2, GAP). Task due, evidence collected and expiry, and every timestamp column in the generic record dialog need a date and a time.

- Evidence: native `datetime-local` in [create-task-dialog.tsx:406-420](../../../src/components/prototype/create-task-dialog.tsx#L406-L420), [create-evidence-dialog.tsx:411-424](../../../src/components/prototype/create-evidence-dialog.tsx#L411-L424) and every timestamp column of [record-browser.tsx:781](../../../src/components/app/record-browser.tsx#L781). The live task dialog renders "mm/dd/yyyy, --:-- --". The native input ignores Ledger styling and LedgerProvider, differs by browser and leaves the time zone ambiguous.
- Closest part: DatePicker is `mode="single"`, pick-only and has no time ([date-picker.tsx:151](../../../packages/design-system/src/components/date-picker.tsx#L151)). Its min/max and typed entry are under DatePicker below; GAP-6 is tracked.
- Reference: Atlassian DateTimePicker and TimePicker; Carbon time picker; React Aria TimeField.

**LinkButton and LinkIconButton** (API, BTN). Navigation that should look like a button.

- Evidence: 7 uses of `<Button render={<Link …/>}>` ([programs.tsx:158](../../../src/routes/programs.tsx#L158), [:186](../../../src/routes/programs.tsx#L186), [index.tsx:167](../../../src/routes/index.tsx#L167), [work-common.tsx:153](../../../src/components/prototype/work-common.tsx#L153), [__root.tsx:94](../../../src/routes/__root.tsx#L94), [shell.tsx:269](../../../src/components/app/shell.tsx#L269), [schema-shell.tsx:64](../../../src/components/app/schema-shell.tsx#L64)). Base UI rejects these, and its `nativeButton` errors appear in the console on /programs, /schema and a missing task. The "Open my work" IconButton navigates from `onClick` ([shell.tsx:173-178](../../../src/components/app/shell.tsx#L173-L178)).
- Closest part: `buttonVariants` gives the styling without the icon slot or insets, and TextLink is a text link. Add a lint rule for Button rendering a link at the same time (see the lint entry below).
- Reference: Atlassian LinkButton and LinkIconButton (href takes a router config); Polaris Button `url`.

**Heading level context** (PA2, PGL, PRM, PA1, PA4, PA5). Sections inside a preview, sheet or dialog sit one level below its title, and rail groups sit under the right parent, without every call site composing Section.Title with `render`.

- Evidence: Section always renders h2 ([section.tsx:95-104](../../../packages/design-system/src/layout/section.tsx#L95-L104)). The live requirement preview is an H2 name followed by four H2 sections, and the SSP preview headings are all H2 ([ssp-assembly.tsx:701-831](../../../src/components/prototype/ssp-assembly.tsx#L701-L831)). On the WS-X90 program record the rail's H3 Details sits under the last main-column H2, Tasks. Levels are hard-coded in [inspector.tsx:74](../../../packages/design-system/src/patterns/inspector.tsx#L74), [item.tsx:307](../../../packages/design-system/src/components/item.tsx#L307), [related.tsx:78](../../../packages/design-system/src/patterns/related.tsx#L78) and [section.tsx:100](../../../packages/design-system/src/layout/section.tsx#L100).
- Closest part: Section.Title and Shell.Panel.Title take `render`, and nothing passes a level down. The per-part level props this replaces are listed under Headings below.
- Reference: Atlassian HeadingContextProvider; React Aria Heading level context; WCAG 1.3.1.

**Live announcer** (A11). One reliable channel for status messages: `announce()` plus persistent polite and assertive regions, for table results, saves, route changes, preview moves and palette results.

- Evidence: the kit has no aria-live helper. The app hand-rolls 53 `role="alert"` and 15 `role="status"` elements, and DataTable, Toolbar, Command and the chart Plot announce nothing (A11-5, A11-6, TLB-4, CHF-1).
- Closest part: none. Each consumer, listed under DataTable, Command, PreviewNavigation and Chart below, would otherwise build its own region.
- Reference: React Aria live-announcer; WCAG 4.1.3.

**Domain status binding** (VW1, VW2, STS). One component per status concept (status, state, severity, impact) that binds the product vocabulary to a label, tone and sort rank, as CLAUDE.md asks of a concept with one visual representation.

- Evidence: six or seven tone helpers paint the same status differently across registers ([record-tools.tsx:37-45](../../../src/components/prototype/record-tools.tsx#L37-L45), [work-format.ts:12-19](../../../src/components/prototype/work-format.ts#L12-L19), [program-shared.tsx:68-80](../../../src/components/prototype/program-shared.tsx#L68-L80), [program-timeline.tsx:94](../../../src/components/prototype/program-timeline.tsx#L94), ImpactBadge in [system-assurance-details.tsx:31](../../../src/components/prototype/system-assurance-details.tsx#L31)), and severity is untoned. `c.status` takes a tone function per column and sorts statuses alphabetically unless a `sortBy` is written ([columns.tsx:336-338](../../../packages/design-system/src/patterns/data-table/columns.tsx#L336-L338)).
- Closest part: Badge and Indicator give the look. The binding (StatusBadge, SeverityIndicator) belongs in the app. The kit's share is letting `c.status` take one shared map of value to label, tone and rank.
- Reference: Atlassian Lozenge appearances; Carbon status indicator; [status-vocabulary.md](../status-vocabulary.md).

**Router-aware record trail** (NAV, PA4). The breadcrumb on every record page, built from the route with exact active matching.

- Evidence: 19 BreadcrumbList compositions in 15 files, for example [program-record.tsx:103-120](../../../src/components/prototype/program-record.tsx#L103-L120) and [program-workspace.tsx:164-182](../../../src/components/prototype/program-workspace.tsx#L164-L182). BreadcrumbLink forwards the router Link's `aria-current="page"` ([breadcrumb.tsx:518-540](../../../packages/design-system/src/components/breadcrumb.tsx#L518-L540)), so at /programs/&lt;id&gt;/sctm the "Programs" crumb announces itself as the current page. One screen uses a parent as the current page.
- Closest part: Breadcrumb, which cannot know the route. The adapter is app code (a RecordTrail next to RecordLink). The kit adds a documented router-link recipe for BreadcrumbLink that drops `aria-current` on ancestors.
- Reference: WAI-ARIA APG Breadcrumb.

**Global search: a TopNav search item and a SearchDialog** (SHB, MNU). A search across record types that is a field from `md` and an icon button below it, bound to ⌘K, opening a dialog whose rows show record identity (id, meta, badge) with loading and error states.

- Evidence: the Shell stories hand-roll an 80-line TopNavSearch ([Shell.stories.tsx:192-270](../../../packages/design-system/src/stories/layout/Shell.stories.tsx#L192-L270)). The app builds a different Button that spills out of its border at 320px and has no ⌘K ([shell.tsx:150-161](../../../src/components/app/shell.tsx#L150-L161)). It opens the CommandPalette for record search ([shell.tsx:122-141](../../../src/components/app/shell.tsx#L122-L141), [:238-250](../../../src/components/app/shell.tsx#L238-L250)), which [CommandPalette.mdx:10](../../../packages/design-system/src/stories/patterns/CommandPalette.mdx#L10) says it must not be, and so inherits command vocabulary, no record identity, no loading or error state and id-based filtering.
- Closest part: CommandPalette is for commands. RecordPicker's row anatomy is the starting point for the results. Related to responsive-2026-09-24 #7.
- Reference: Atlassian navigation-system Search; Carbon global header search.

**Focus and announcement on navigation** (SHA, PGL, A11). On client-side navigation, close the phone overlay, move focus to Main and announce the new page, at every width.

- Evidence: [shell.tsx:295-311](../../../src/components/app/shell.tsx#L295-L311) hand-builds this only below a hard-coded 64rem query. After desktop navigation the active element is BODY (A11-7). [schema-shell.tsx](../../../src/components/app/schema-shell.tsx) has nothing, and /schema at 390px keeps the overlay open after a destination is chosen.
- Closest part: Shell owns the overlay and Main, but leaves the overlay open and focus lost.
- Reference: Polaris Navigation.Item and Frame `onNavigationDismiss`; Next.js route announcer; WCAG 2.4.3 and 4.1.3.

**Disclosure header and collapsible Section** (DSC, G8, PGL). The collapsed Details sections the contract requires, and rail groups: a title inside a heading, a trailing chevron that turns with `aria-expanded`, hover and focus treatment, and the reduced-motion rule.

- Evidence: five hand-rolled Button triggers and two native `<details>` ([ssp-assembly.tsx:605-606](../../../src/components/prototype/ssp-assembly.tsx#L605-L606), [system-baseline.tsx:504](../../../src/components/prototype/system-baseline.tsx#L504), [editor.tsx:203](../../../src/components/app/profile-tailoring/editor.tsx#L203), [:231](../../../src/components/app/profile-tailoring/editor.tsx#L231), [:241](../../../src/components/app/profile-tailoring/editor.tsx#L241), [profiles.$profileId.tsx:433-435](../../../src/routes/profiles.$profileId.tsx#L433-L435), [record-browser.tsx:836](../../../src/components/app/record-browser.tsx#L836)), each with the trigger outside any heading and a chevron that never turns. Inspector.Group keeps its own inline copy and guesses the open-state selector wrong ([inspector.tsx:74-80](../../../packages/design-system/src/patterns/inspector.tsx#L74-L80)). Seven story copies use Radix's `group-data-[state=open]`.
- Closest part: Collapsible ships no chevron and documents no state selector. Accordion owns its icon, but it is a group.
- Reference: React Aria Disclosure; WAI-ARIA APG Disclosure; Polaris Collapsible; Carbon Accordion.

**Overflow-aware truncation** (G1, FLT). Long record names in registers, rails and lists get a title or Tooltip only when the text is actually cut, on hover and on keyboard focus.

- Evidence: about 20 slots use a bare `truncate`. Text `maxLines` has no reveal ([text.tsx:22](../../../packages/design-system/src/primitives/text.tsx#L22)), and KeyValue reveals only a string child ([key-value.tsx:44](../../../packages/design-system/src/components/key-value.tsx#L44)). [related.tsx:78](../../../packages/design-system/src/patterns/related.tsx#L78), [:169](../../../packages/design-system/src/patterns/related.tsx#L169), [:198](../../../packages/design-system/src/patterns/related.tsx#L198), [timeline.tsx:291](../../../packages/design-system/src/components/timeline.tsx#L291), [:348](../../../packages/design-system/src/components/timeline.tsx#L348) and [side-nav.tsx:291](../../../packages/design-system/src/layout/shell/side-nav.tsx#L291) truncate with no title. [table.tsx:380](../../../packages/design-system/src/components/table.tsx#L380) and [data-table.tsx:604](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L604) add a mouse-only title for plain strings, so a truncated TextLink on the program Controls tab has none. The app patches the profile email itself ([shell.tsx:224](../../../src/components/app/shell.tsx#L224), [schema-shell.tsx:115](../../../src/components/app/schema-shell.tsx#L115)). Closes G1-6, G1-8, G1-10 and FLT-6.
- Closest part: Text `maxLines` and Tooltip, which each caller has to wire, and most do not.
- Reference: Carbon Overflow content; Atlassian Tooltip for unavoidable truncation.

**KeyValue.Group** (CNT). One `dl` for a record rail or More fields that shares the label width through context and stacks label over value below a container width.

- Evidence: rails thread a width through every row: `const width = 112` in [program-record.tsx:411](../../../src/components/prototype/program-record.tsx#L411), `labelWidth={124}` eight times in [system-assurance-details.tsx:179-304](../../../src/components/prototype/system-assurance-details.tsx#L179-L304), DetailFacts in [work-common.tsx:208](../../../src/components/prototype/work-common.tsx#L208), and More fields in [data-table.tsx:886-896](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L886-L896). Each rail becomes N single-item lists.
- Closest part: KeyValue, one row at a time. The group also fixes truncated labels in narrow panels (see KeyValue below).
- Reference: Polaris DescriptionList; Carbon StructuredList.

**Overlay surface context** (G6). Dialog, Sheet, Drawer, Popover, AlertDialog, HoverCard and Related.Card set `surface.current`, so the parts that paint it (sticky headers, pinned cells, eye slots, Timeline groups) match the overlay.

- Evidence: in dark mode the RecordBrowser story paints 5 sticky `th`, 20 sticky `td` and 20 eye slots at #14141c inside a #1c1c25 dialog, and the wizard's product PickerSheet shows the same. Only [card.tsx:6-8](../../../packages/design-system/src/components/card.tsx#L6-L8) sets the variable, and several parts hard-code `elevation.surface`.
- Closest part: the `surface.current` variable, set by Card alone.
- Reference: Ledger Color.mdx (surface.current); Atlassian `utility.elevation.surface.current`.

**A selected and current indicator that is not a fill** (G6). One shared treatment for toggle pressed, the pager's current page, default Tabs, the active preview eye, selected rows and the calendar range.

- Evidence: each relies on a tint or hue of 1.04 to 1.34:1 in dark mode, and each part reinvents it (G6-3, G6-4, G6-5, G6-8).
- Closest part: the line Tabs indicator, at 7.67:1, is the kit's own working example.
- Reference: WCAG 1.4.11 and 1.4.1.

**A reserved minimum width for Main** (SHA). The side nav and the panel are each capped at 50vw, independently, so together they can leave Main at nothing.

- Evidence: Shell Collapsed at 1440px with both splitters dragged to the end: nav 720px, panel 720px, Main 48px.
- Closest part: Shell.mdx says the panel covers nothing; the splitters do not enforce it.
- Reference: Shell.mdx.

**Chart.Frame context for size, data and format** (CHF). Data, size and format passed once to the Frame, so Expand redraws the plot at `large` and the table twin and the plot share one format.

- Evidence: the expand dialog passes `size="large"` and the plot ignores it ([frame.tsx:516-534](../../../packages/design-system/src/patterns/chart/frame.tsx#L516-L534), CHF-4). Stories repeat the same props on the Frame and the part ([Chart.stories.tsx:66-67](../../../packages/design-system/src/stories/patterns/Chart.stories.tsx#L66-L67), [:243-271](../../../packages/design-system/src/stories/patterns/Chart.stories.tsx#L243-L271), CHF-5).
- Closest part: Chart.Frame frames the plot but provides nothing to it.
- Reference: Carbon Charts and Polaris Viz take data and options once per chart.

**A table view for Donut, Scatter, Treemap and Heatmap** (CHO). The keyboard and screen-reader alternative those pages promise (CHO-4), and a visible-values route for the Heatmap (CHO-5).

- Evidence: the Frame builds its table twin only when `data`, `x` and `series` are all set ([frame.tsx:283](../../../packages/design-system/src/patterns/chart/frame.tsx#L283)); [ChartScatter.mdx:85](../../../packages/design-system/src/stories/patterns/ChartScatter.mdx#L85) promises it; no story shows a twin for these parts.
- Closest part: the table twin, which fits category charts only.
- Reference: Carbon Charts "Show as table" on every chart type.

**Focus-ring clipping check in the story run** (G3). A check that tabs through each story and fails when a ring is clipped, so responsive fixes stop bringing clipped rings back.

- Evidence: 238 of 3,022 story focus stops lose half or more of the ring, and 12% are clipped at all. The 2026-09-18 Stepper and Timeline Scroller change brought one back. The sweep's measurement builds the ring rectangle from the outline or `::after` and walks the clipping ancestors; it could run in the `afterEach` of [storybook.setup.ts](../../../packages/design-system/test/storybook.setup.ts) beside the layout checks.
- Closest part: the layout guard, which checks overflow and not rings. The fix to the rings themselves is the inset focus utility under Focus and state below.
- Reference: WCAG 2.4.7 and 2.4.11.

**Short-height overlay checks** (G5). Dialogs, sheets and pickers rendered and tabbed through at 320×256, which is 1280×1024 at 400%.

- Evidence: only Command has a short-viewport story (844×390). `npm run test:layout` renders at 390px wide and in a 320px box, never short. The [responsive audit](../responsive-audit-2026-09-24.md) lists Dialog and Sheet at short heights as not re-verified.
- Closest part: `test:layout`.
- Reference: WCAG 1.4.10.

## Add when the product needs it

**DateTime, RelativeTime and DateLabel** (PRT, GAP, STR, PA2). Every date the product shows (due, expiry, milestones, updated, activity) through one formatter: a `<time dateTime>`, the full value in a title or tooltip, a relative option, and a DateLabel that marks due and overdue. This is GAP-9 (medium).

- Evidence:
  - `displayDate` ([work-format.ts:3-10](../../../src/components/prototype/work-format.ts#L3-L10), 39 calls) uses the host locale and returns the string "Not recorded" instead of Absent.
  - Six places call `toLocaleString` or `toLocaleDateString` directly, for example the home feed ([index.tsx:195](../../../src/routes/index.tsx#L195)) and the requirement activity ([requirement-record.tsx:327-329](../../../src/components/prototype/requirement-record.tsx#L327-L329)). [program-timeline.tsx:31](../../../src/components/prototype/program-timeline.tsx#L31) builds its own en-US/UTC formatter, and the profile page prints raw ISO ([profiles.$profileId.tsx:341](../../../src/routes/profiles.$profileId.tsx#L341), [:377](../../../src/routes/profiles.$profileId.tsx#L377)).
  - The wizard review prints "Starts 2026-10-01 · Ends unset" ([review.tsx:107-110](../../../src/components/app/program-wizard/review.tsx#L107-L110)). The export rail prints raw `starts_on` ([programs.$programId_.export.tsx:99-100](../../../src/routes/programs.$programId_.export.tsx#L99-L100)). The program rail shows "Updated 9/12/2026, 11:01:21 …" cut off ([program-workspace.tsx:506](../../../src/components/prototype/program-workspace.tsx#L506)).
  - Task comments show the date only ([tasks.$taskId.tsx:204](../../../src/routes/tasks.$taskId.tsx#L204)), so same-day order is lost.
  - Tasks have due dates, evidence has expiry and POA&M items have milestones, yet no screen marks anything overdue.
- Closest part: `useLedgerLocale().formatDate` is exported ([mode/index.ts:15-16](../../../packages/design-system/src/mode/index.ts#L15-L16)) and the app never uses it. `c.date` formats inside DataTable only. Timeline.mdx describes "2h ago" with the full stamp as the tooltip, but nothing implements it ([locale-format.ts:186](../../../packages/design-system/src/lib/locale-format.ts#L186) has `formatDate` only).
- Fix: build DateTime on useLedgerLocale, add DateLabel with a due and overdue tone, and replace `displayDate` and the direct `toLocale*` calls.
- Reference: Atlassian DateLabel; GitHub Primer RelativeTime; Intl.RelativeTimeFormat.

**Long-form Prose** (GAP, VW1). Multi-paragraph authored text (control statements, implementation statements, rationales, SSP narratives), with a safe Markdown option. The app then renders OSCAL `markup-multiline` and parameter insertions on top of it. Today control statements show raw `{{ insert: param, … }}` markup and part ids ([library-controls.tsx:173](../../../src/components/prototype/library-controls.tsx#L173)).

- Evidence: 34 `<p className="whitespace-pre-wrap">` in `src/`, for example [ssp-assembly.tsx:704-840](../../../src/components/prototype/ssp-assembly.tsx#L704-L840) and [requirement-control-mappings.tsx:221](../../../src/components/prototype/requirement-control-mappings.tsx#L221).
- Closest part: Prose renders a single `<p>` and is unused ([typography.tsx:55-61](../../../packages/design-system/src/components/typography.tsx#L55-L61)). Text has no `preserveLineBreaks` (see Text below).
- Reference: Atlassian renderer; Primer Markdown; NIST OSCAL insert/param.

**Diff and comparison view** (GAP). Library updates, profile tailoring and requirement or control revisions ask the reader to compare two narratives.

- Evidence: the library update review puts "Now" and "Version N" full text in two wrapped DataTable cells with nothing highlighted ([library-update-review.tsx:125-138](../../../src/components/prototype/library-update-review.tsx#L125-L138)). The profile page's copy promises a "tailoring diff" ([profiles.$profileId.tsx:428](../../../src/routes/profiles.$profileId.tsx#L428)).
- Closest part: none. DataTable shows both values, not the change.
- Reference: GitHub diff view; Confluence page history compare.

**DateRangePicker** (DAT). A range field with a trigger summary, and presets for filters: program periods and the DataTable date filter.

- Evidence: program start and end are two unlinked native inputs ([program.tsx:88-104](../../../src/components/app/program-wizard/program.tsx#L88-L104)), and so is the date filter ([filter.tsx:95-113](../../../packages/design-system/src/patterns/data-table/filter.tsx#L95-L113)). [DatePicker.mdx:29](../../../packages/design-system/src/stories/components/DatePicker.mdx#L29) tells callers to compose Calendar in a Popover with an inline style. The reporting-period pattern in [design-system-polish-audit.md:121](../design-system-polish-audit.md#L121) needs the same.
- Closest part: Calendar supports ranges; DatePicker does not expose them. Once DatePicker has min/max (below), a range picker is optional (GAP-6). Add it when the filter or a reporting period needs the summary and presets.
- Reference: Carbon date range picker; React Aria DateRangePicker; Polaris DatePicker `allowRange`.

**SearchField** (INP, TLB). One search input with an icon, a clear button, Escape and sizes, for Toolbar, the DataTable filter and PickerSheet.

- Evidence: three kit patterns rebuild it differently ([toolbar.tsx:236-258](../../../packages/design-system/src/patterns/toolbar.tsx#L236-L258), [filter.tsx:332-341](../../../packages/design-system/src/patterns/data-table/filter.tsx#L332-L341), [picker-sheet.tsx:118-127](../../../packages/design-system/src/patterns/picker-sheet.tsx#L118-L127)). [input.tsx:20](../../../packages/design-system/src/components/input.tsx#L20) hides the native cancel button, so no search can be cleared with a pointer, and a phone has no Escape (TLB-9).
- Closest part: Input `type="search"` in an InputGroup.
- Reference: React Aria SearchField; Carbon Search; Polaris TextField `clearButton`.

**CheckboxGroup** (CTL). Multi-select lists with select-all.

- Evidence: three lists keep selection by hand ([product-structure.tsx:588-600](../../../src/components/prototype/product-structure.tsx#L588-L600), [add-from-library.tsx:699-708](../../../src/components/prototype/add-from-library.tsx#L699-L708), [catalog.tsx:224](../../../src/components/app/program-wizard/catalog.tsx#L224)). [Checkbox.mdx:29](../../../packages/design-system/src/stories/components/Checkbox.mdx#L29) sends consumers to import `@base-ui` directly for select-all.
- Closest part: Checkbox.
- Reference: Base UI CheckboxGroup; Polaris ChoiceList `allowMultiple`; Carbon Checkbox group.

**VisuallyHidden and an Icon label** (PA4). Naming status icons and other visual-only marks.

- Evidence: screens put `aria-label` on spans, which assistive tech ignores ([program-systems-tree.tsx:215-219](../../../src/components/prototype/program-systems-tree.tsx#L215-L219), [system-assurance-details.tsx:31-37](../../../src/components/prototype/system-assurance-details.tsx#L31-L37), [:239-243](../../../src/components/prototype/system-assurance-details.tsx#L239-L243)).
- Closest part: the kit uses `sr-only` internally but exports no VisuallyHidden. Absent's own fix is under Empty and Absent below.
- Reference: Atlassian VisuallyHidden and Icon `label`; React Aria VisuallyHidden.

**A foldable TopNav end item** (SHB, GAP). TopNav.End builds its More menu from items and keeps chosen items (the colour mode) visible, instead of the all-or-nothing `overflow` prop.

- Evidence: the app hand-rolls `hidden md:contents` and a duplicate `md:hidden` DropdownMenu ([shell.tsx:163-202](../../../src/components/app/shell.tsx#L163-L202)). The schema inspector's overflow drops ModeSwitch below `md` ([schema-shell.tsx:51-71](../../../src/components/app/schema-shell.tsx#L51-L71)).
- Closest part: TopNav.End `overflow` ([top-nav.tsx:30](../../../packages/design-system/src/layout/shell/top-nav.tsx#L30), [:95-111](../../../packages/design-system/src/layout/shell/top-nav.tsx#L95-L111)). A `persistent` slot, or ModeSwitch moved into the menu, lets shell.tsx drop its split (GAP-10).
- Reference: Atlassian navigation-system EndItem, Help, Settings and Notifications.

**A disabled action with a reason** (BTN, MNU). Telling the reader why a primary or a menu action is unavailable: a focusable `aria-disabled` control with a tooltip or description.

- Evidence: [program-wizard.tsx:412-416](../../../src/components/app/program-wizard.tsx#L412-L416) sets a `title` that never shows, because disabled buttons have `pointer-events-none`. Other unexplained disabled primaries: [control-picker.tsx:189](../../../src/components/app/profile-tailoring/control-picker.tsx#L189), [requirement-evidence.tsx:216](../../../src/components/prototype/requirement-evidence.tsx#L216), [library-components.tsx:658](../../../src/components/prototype/library-components.tsx#L658). "Publish version" is disabled for missing content or configuration with no reason ([library-products.tsx:337-349](../../../src/components/prototype/library-products.tsx#L337-L349), [library-components.tsx:312-317](../../../src/components/prototype/library-components.tsx#L312-L317)).
- Closest part: Button `disabled` and Tooltip. DropdownMenuItem has no description line (see Menus below).
- Reference: Atlassian "Avoid disabling buttons where possible"; Base UI `focusableWhenDisabled`; Polaris ActionList `helpText`.

**DataTable.Sort toolbar menu** (DTP). Sorting, and seeing the sort, when the responsive renderer has folded the headers.

- Evidence: on /work at 390px after sorting by Due, no header carries `aria-sort` ([data-table.tsx:1358-1362](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1358-L1362)). Folded columns cannot be sorted by at all.
- Closest part: the header menus, which fold away with their headers.
- Reference: Polaris IndexFilters sort control.

**A single-pointer column width option** (TBL). Setting a column's width from the header menu without dragging (TBL-10).

- Evidence: resizing is drag-only ([columns-menu.tsx:180-238](../../../packages/design-system/src/patterns/data-table/columns-menu.tsx#L180-L238)) on six app registers, for example [work-table.tsx:116](../../../src/components/prototype/work-table.tsx#L116) and [requirements-table.tsx:407](../../../src/components/prototype/requirements-table.tsx#L407).
- Closest part: the header menu, which already has Move left and Move right.
- Reference: WCAG 2.5.7.

**A table query serializer** (DTC). Search, sort, filters and page survive opening a record and coming back, through the URL or the session.

- Evidence: Back on /programs lost the search and the sort. [DataTable.mdx:148](../../../packages/design-system/src/stories/patterns/DataTable.mdx#L148) points to a `src/lib/table-state.ts` that does not exist.
- Closest part: the view store, which keeps layouts, not the question; its own comment states this intent ([view-store.ts:9-13](../../../packages/design-system/src/patterns/data-table/view-store.ts#L9-L13)).
- Reference: none beyond the view store's design.

**Increased-contrast mode** (TOK). Keep the recorded low-contrast defaults (1.87:1 field borders, about 1.1:1 selected, pressed and highlight fills, a 1.22:1 hairline) and give readers who ask for more contrast 3:1 boundaries and state fills.

- Evidence: nothing in `packages/design-system/src` responds to `prefers-contrast` (TOK-3, TOK-7).
- Closest part: the forced-colours stylesheet, which serves a different mode.
- Reference: Atlassian light and dark increased-contrast themes; CSS Media Queries 5 `prefers-contrast`.

**Packaged font faces** (TOK). A `fonts.css` entry, so consumers render Geist without rediscovering the Storybook's Google Fonts link (TOK-6).

- Evidence: the token names Geist, but the package ships no `@font-face`. The app's [__root.tsx](../../../src/routes/__root.tsx) head loads no font, and `@fontsource-variable/geist` sits unused in [package.json:49](../../../package.json#L49).
- Closest part: none.
- Reference: Carbon `@carbon/styles` font-face mixin; Primer ships its fonts.

**Axe and console sweep over product screens** (G2, TOO). An accessibility gate on composed screens and open states, which the story gate cannot see, with the Base UI exclusions documented.

- Evidence: no axe in `scripts/*.mjs`. A live run found `landmark-one-main` and `region` failures on the sign-in screen (G2-9, G2-18).
- Closest part: `test:a11y`, which covers stories only.
- Reference: `@axe-core/playwright`.

**A touch-emulating Storybook project** (TOO). `hasTouch`, `isMobile`, a coarse pointer and no hover, so CI can assert the touch targets and hover-free row actions being built now.

- Evidence: [vitest.config.ts:47](../../../packages/design-system/vitest.config.ts#L47) sets no `hasTouch`. Three different touch predicates are in use ([touch.css:7](../../../packages/design-system/src/styles/touch.css#L7), [related.tsx:204](../../../packages/design-system/src/patterns/related.tsx#L204), [data-table.tsx:171](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L171)).
- Closest part: `test:layout` at 390px, which does not emulate touch.
- Reference: Playwright `hasTouch` and `isMobile`; WCAG 2.5.8.

**Lint rules for `style` values, Badge tone and Button links** (TOO, API). Close the one open route around the token rules, and two misuses that compile and have shipped.

- Evidence: no ledger rule reads `style`, and [Dialog.mdx:36](../../../packages/design-system/src/stories/components/Dialog.mdx#L36) and Select.mdx recommend it for widths; product files hold 23 `style={{}}`. Badge `tone` without `variant` shipped at [control-detail.tsx:63](../../../src/components/app/profile-tailoring/control-detail.tsx#L63), and Button rendering a link at [work-common.tsx:153](../../../src/components/prototype/work-common.tsx#L153).
- Closest part: `ledger/text-link-navigation`, the model for both.
- Reference: Atlassian `eslint-plugin-ui-styling-standard` (style only for dynamic values) and `ensure-design-token-usage`.

## Consider later

| Part                                 | For                                                                                  | Evidence                                                                                                                                                                                                                                                                                                                                | Closest part, and why it is not enough                                         | Reference                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------- |
| NumberField (INP)                    | Retention days, budgets and numeric record columns                                   | Raw `type="number"` with `step="any"` in the generic record dialog ([record-browser.tsx:772-785](../../../src/components/app/record-browser.tsx#L772-L785))                                                                                                                                                                                                      | Input: no locale formatting, wheel and spinner quirks. Base UI 1.7's NumberField is already installed | React Aria NumberField; Carbon NumberInput    |
| List (PRM)                           | Bulleted validation and conflict messages                                            | Hand-built `list-disc` with a guessed inset ([program-wizard.tsx:374](../../../src/components/app/program-wizard.tsx#L374), [editor.tsx:223](../../../src/components/app/profile-tailoring/editor.tsx#L223), [:233](../../../src/components/app/profile-tailoring/editor.tsx#L233), [parameter-picker.tsx:278](../../../src/components/app/profile-tailoring/parameter-picker.tsx#L278), [ssp-assembly.tsx:717](../../../src/components/prototype/ssp-assembly.tsx#L717)) | None                                                                           | Polaris List; Carbon UnorderedList            |
| CopyButton and Id copy (GAP)         | Copying UUIDs, control ids and OSCAL identifiers into tickets and documents          | The only copy control is private to CodeBlock ([code-block.tsx:73-110](../../../packages/design-system/src/components/code-block.tsx#L73-L110)); `navigator.clipboard` has 0 uses in `src/`                                                                                                                                                                                       | CodeBlock, whose CopyButton is not exported                                    | Carbon Copy button; Primer ClipboardCopy      |
| File download helper (PRT)           | CSV and export downloads                                                             | Three hand-built Blob and anchor downloads, with synchronous and deferred revoke ([programs.tsx:129-137](../../../src/routes/programs.tsx#L129-L137), [programs.$programId_.export.tsx:54-61](../../../src/routes/programs.$programId_.export.tsx#L54-L61), [record-tools.tsx:465-473](../../../src/components/prototype/record-tools.tsx#L465-L473))                                              | `toCsv` builds the text, not the download                                      | The Chart CSV and PNG download                |
| Platform modifier helper (MNU)       | ⌘ or Ctrl, chosen once, for the palette, Shell tooltips and shortcut hints           | [side-nav.tsx:466](../../../packages/design-system/src/layout/shell/side-nav.tsx#L466), [command-keys.tsx](../../../packages/design-system/src/lib/command-keys.tsx); parked in docs/next.md "⌘ or Ctrl"                                                                                                                                                                                                             | Kbd, which leaves the glyph to each caller                                     | React Aria platform utilities                 |
| Container-size tokens (TOK)          | Container queries, which Stat.Grid and Calendar now add more of                      | Tailwind's untokenized scale (`@3xs`, `@md` at 28rem while the viewport `md` is 48rem) and raw literals ([layout.css:95](../../../packages/design-system/src/styles/layout.css#L95), [shell.css:117](../../../packages/design-system/src/styles/shell.css#L117))                                                                                                                                                      | Breakpoint tokens, which are viewport-only                                     | Tailwind 4 `--container-*` namespace          |
| Public-API conformance test (API)    | Enforcing `?: T \| undefined`, ref, `data-slot` and `className` reaching the root     | About half the parts break one rule ([badge.tsx:245-247](../../../packages/design-system/src/components/badge.tsx#L245-L247), [locale-format.ts:172-178](../../../packages/design-system/src/lib/locale-format.ts#L172-L178), [id.tsx:5-11](../../../packages/design-system/src/components/id.tsx#L5-L11), [timeline.tsx:194](../../../packages/design-system/src/components/timeline.tsx#L194))                                                                                                        | The API baseline records the surface, not the contract                         | AGENTS.md; [component-library.md:81-87](../component-library.md#L81-L87) |

## Missing variants, props and states of existing parts

Grouped by part. Each entry gives its priority and units, then the evidence.

**Dialog, Sheet and AlertDialog**

- **`size` presets on layout tokens** (high; API, DOC, MOD, PA1, PA2, PA3, PA4, PA5, TOK, TOO). About 20 product dialogs set an inline `maxWidth`, in a dozen pixel values from 480 to 1120px, plus 90vw. The kit's own 520px default is an arbitrary value ([dialog.tsx:62](../../../packages/design-system/src/components/dialog.tsx#L62)), and [Dialog.mdx:36](../../../packages/design-system/src/stories/components/Dialog.mdx#L36) and [Sheet.mdx:31](../../../packages/design-system/src/stories/components/Sheet.mdx#L31) tell readers to use `style`. Examples: [create-task-dialog.tsx:265](../../../src/components/prototype/create-task-dialog.tsx#L265), [system-baseline.tsx:756](../../../src/components/prototype/system-baseline.tsx#L756), [requirement-allocations.tsx:364](../../../src/components/prototype/requirement-allocations.tsx#L364), [record-browser.tsx:1257](../../../src/components/app/record-browser.tsx#L1257). AlertDialog already has `size`. Reference: Atlassian Modal width small to x-large; Carbon Modal sizes.
- **`pending` (non-dismissible) state** (high; MOD, GAP). Written up as GAP-4 below. PickerSheet's Cancel and close stay active while pending, too.
- **Short-height mode** (high; G5). Let the header scroll with the content, or the whole dialog scroll in the viewport, when height runs out. Dialog and Sheet are `overflow-hidden` columns with a fixed header and footer ([dialog.tsx:62](../../../packages/design-system/src/components/dialog.tsx#L62), [sheet.tsx:108](../../../packages/design-system/src/components/sheet.tsx#L108)), and PickerSheet and RecordBrowser add more fixed rows ([picker-sheet.tsx:113](../../../packages/design-system/src/patterns/picker-sheet.tsx#L113), [record-browser.tsx:232](../../../packages/design-system/src/patterns/record-browser.tsx#L232)), so pickers pin 150–225px of chrome. Reference: Atlassian ModalDialog `shouldScrollInViewport`; WCAG technique C34.
- **Nested-dialog parent state and backdrop** (medium; MOD, VW3). The discard prompt over Create task has no blanket and no dimming, so the decision does not stand out, especially in dark mode ([alert-dialog.tsx:26-37](../../../packages/design-system/src/components/alert-dialog.tsx#L26-L37)). Reference: Base UI `data-nested-dialog-open`, `--nested-dialogs` and DialogBackdrop `forceRender`.

**PickerSheet, RecordBrowser and PreviewNavigation**

- **PickerSheet `pending`, error slot and `initialFocus`** (high; PIK). The contract requires dirty and pending protection for a PickerSheet with a shared rationale; its only such caller re-implements it and misplaces the error ([system-requirements.tsx:407-446](../../../src/components/prototype/system-requirements.tsx#L407-L446)).
- **RecordBrowser loading, error and no-records states that keep the create action** (high; PIK, PA5). RecordBrowser has only a hard-coded filtered empty ([record-browser.tsx:246-249](../../../packages/design-system/src/patterns/record-browser.tsx#L246-L249)), so with no eligible records it shows no-match copy and hides the create action. The evidence link flow forks a 90vw Dialog lookalike to get a real empty state ([requirement-evidence.tsx:239-318](../../../src/components/prototype/requirement-evidence.tsx#L239-L318)).
- **PreviewNavigation without `openLink`** (medium; PIK). An in-task variant, so RecordBrowser can reuse endpoint focus and position instead of hand-rolling previous and next and dropping focus ([preview-navigation.tsx:8-21](../../../packages/design-system/src/patterns/preview-navigation.tsx#L8-L21), [record-browser.tsx:279-298](../../../packages/design-system/src/patterns/record-browser.tsx#L279-L298)).
- **PreviewNavigation visible position and `recordLabel`** (medium; PRV). The position is `sr-only`, so sighted readers see no position and no reason when the record has left the results; announcements give the number but not which record ([preview-navigation.tsx:51-55](../../../packages/design-system/src/patterns/preview-navigation.tsx#L51-L55)). Reference: Polaris Pagination `label`; WCAG 4.1.3.

**DataTable**

- **`selectable: "single"`** (high; DTC, DTP, PIK, PA3). Radio rows for one-of-N pickers. Three pickers fake it with checkboxes, a live Select all that picks only the first row, and a hand-written state bridge ([library-component-picker.tsx:54-68](../../../src/components/app/library-component-picker.tsx#L54-L68), [product-configuration-picker.tsx:53-67](../../../src/components/app/product-configuration-picker.tsx#L53-L67), [add-from-library.tsx:312-326](../../../src/components/prototype/add-from-library.tsx#L312-L326)). Reference: Carbon Data table radio selection; React Aria `selectionMode="single"`.
- **`rowLabel`** (high; DTC, PIK). A human name for per-row controls (select, reorder, eye, actions, detail). Today they are named by `getRowId`, a UUID in every product picker: "Select row 68bb2272-…" ([data-table.tsx:811](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L811), [:830](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L830), [:573](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L573), [:842](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L842)). Reference: React Aria row `textValue`; WCAG 2.4.6.
- **Caller-declared narrowing (`narrowed`)** (high; DTC, EMP, PA4). Data filtered outside table state (a scope toggle, a route filter, a PickerSheet search) needs the filtered empty with its toolbar. Today the bare empty removes the toolbar whenever there are no rows and no table filter ([data-table.tsx:1203-1230](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1203-L1230)), so "Include everything inside" vanishes exactly when it is needed ([system-requirements.tsx:257-266](../../../src/components/prototype/system-requirements.tsx#L257-L266), [system-evidence.tsx:342-351](../../../src/components/prototype/system-evidence.tsx#L342-L351), [system-library.tsx:250-256](../../../src/components/prototype/system-library.tsx#L250-L256)). The schema browser's "Clear related-record filter" has the same need ([record-browser.tsx:318-330](../../../src/components/app/record-browser.tsx#L318-L330)), and four pickers show "Nothing published…" on a no-match search (DTC-3).
- **Result and state announcements** (high; TLB, VW1, DTP). One polite status, through the live announcer, for result count after search, filter and paging, and for selection, sort and page changes. The saved-views count stays at the unfiltered total ("All records 62" over an empty result). Selection bar and pagination range update silently ([selection-bar.tsx:35-50](../../../packages/design-system/src/patterns/data-table/selection-bar.tsx#L35-L50), [pagination.tsx:44-49](../../../packages/design-system/src/patterns/data-table/pagination.tsx#L44-L49)); the Pagination story adds its own `<p role="status">`.
- **Embedded mode** (medium; PA2, PA1, VW3, PRT). For one-row collections in record bodies and previews: a compact empty, no views menu when there is one preset, and no pager when everything fits. DataTableEmpty has no size ([data-table.tsx:82-94](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L82-L94)), so an embedded empty is a 290–310px hero; one row gets "1–1 of 1 · 20 per page · ‹1›" ([data-table.tsx:1442-1454](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1442-L1454)); registers without saved views still show a one-option "All records" menu named "Saved questions" ([product-collection.tsx:61-69](../../../src/components/prototype/product-collection.tsx#L61-L69), [filter.tsx:403](../../../packages/design-system/src/patterns/data-table/filter.tsx#L403), [:442](../../../packages/design-system/src/patterns/data-table/filter.tsx#L442)).
- **`refreshing` state with `aria-busy`** (medium; DTC). Keep the rows during a refetch and mark the table busy; DataTableState has only ready, loading, empty and error, and the Server story wraps itself in its own `aria-busy` ([DataTable.stories.tsx:1459](../../../packages/design-system/src/stories/patterns/DataTable.stories.tsx#L1459)). Reference: Atlassian Dynamic table `isLoading`.
- **Membership facet for list columns** (medium; DTP). Routes join arrays into strings to get checkboxes, producing combination facets such as "policy, technical" and "technical, policy" ([catalog.tsx:214](../../../src/routes/catalog.tsx#L214), [work-table.tsx:70-76](../../../src/components/prototype/work-table.tsx#L70-L76)).
- **Search in long facets, and an empty-facet message** (medium; DTP). Status and person facets are unlimited and text facets reach 30 options with no search; an empty facet renders a blank popover, as on /work's "Assigned to" ([filter.tsx:33](../../../packages/design-system/src/patterns/data-table/filter.tsx#L33), [:157](../../../packages/design-system/src/patterns/data-table/filter.tsx#L157), [:235](../../../packages/design-system/src/patterns/data-table/filter.tsx#L235)).
- **Per-preset empty message** (medium; EMP). "Assigned to you" with nothing in it should say "Nothing assigned to you", not "Nothing matches / Clear filters" ([work-table.tsx:118](../../../src/components/prototype/work-table.tsx#L118), [:150-172](../../../src/components/prototype/work-table.tsx#L150-L172)).
- **Versioned views (`{ id, version }`)** (medium; DTC). Ten view names carry `-v1` to `-v3` to invalidate stored layouts ([library-controls.tsx:120](../../../src/components/prototype/library-controls.tsx#L120), [program-systems-tree.tsx:331](../../../src/components/prototype/program-systems-tree.tsx#L331)); the stored `v` is fixed at 1 ([view-state.ts:2-10](../../../packages/design-system/src/patterns/data-table/view-state.ts#L2-L10)).
- **Rich name cell** (medium; PA3). Icon, secondary line and badge on `c.text` or `c.id`; tree and library tables hand-build them with raw spans ([product-structure.tsx:186-204](../../../src/components/prototype/product-structure.tsx#L186-L204), [system-library.tsx:135-153](../../../src/components/prototype/system-library.tsx#L135-L153), [program-library.tsx:156-165](../../../src/components/prototype/program-library.tsx#L156-L165)).
- **Row link (`rowHref`)** (low; DTC). A real link on row click would honour modifier and middle click and ignore text selection; 15+ registers call `navigate()` from `onRowClick` ([work-table.tsx:135](../../../src/components/prototype/work-table.tsx#L135), [program-shared.tsx:489](../../../src/components/prototype/program-shared.tsx#L489)).

**Table**

- **Row-header cell (`th scope="row"`)** (high; TBL). Every cell is a `td` ([table.tsx:379](../../../packages/design-system/src/components/table.tsx#L379)); /findings, /vendors and /campaigns have 0 row headers (TBL-1). Reference: React Aria `isRowHeader`; WCAG technique H63.
- **Logical `align` on Table.Header and Table.Cell** (high; TBL). End-aligned numbers are a content rule, but the only route is a physical `text-right` class, which fails for headers (TBL-2) and in RTL (TBL-3) ([Table.stories.tsx:510](../../../packages/design-system/src/stories/components/Table.stories.tsx#L510), [:561](../../../packages/design-system/src/stories/components/Table.stories.tsx#L561), [:829](../../../packages/design-system/src/stories/components/Table.stories.tsx#L829)); DataTable keeps its own `alignClass` ([data-table.tsx:152-153](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L152-L153)).
- **`label` on PreviewButton, PreviewEye and Table.Id** (high; TBL). The eye is the only per-row control whose name cannot include the record ([table.tsx:425-433](../../../packages/design-system/src/components/table.tsx#L425-L433), [:441](../../../packages/design-system/src/components/table.tsx#L441)), although DataTable already computes the identity for More fields ([data-table.tsx:775](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L775)).
- **`wrap` on Table.Cell and Table.Header** (medium; TBL). Wrapping a column takes a class override ([profiles.$profileId.tsx:295](../../../src/routes/profiles.$profileId.tsx#L295)), while DataTable has `meta.wrap`.

**Toolbar**

- **Applied-filter count on More** (medium; TLB). When filters fold, an applied filter disappears behind a plain "More" ([toolbar.tsx:341](../../../packages/design-system/src/patterns/toolbar.tsx#L341), TLB-6). Reference: Polaris Filters. The search clear button is SearchField above.

**Command and CommandPalette**

- **Loading, error, title and empty-message props** (high; MNU, PA1). The list shows its empty sentence while loading and after a failure, the title is fixed as "Command palette", and the app renders its error behind the modal ([command-palette.tsx:31-38](../../../packages/design-system/src/patterns/command-palette.tsx#L31-L38), [:74-108](../../../packages/design-system/src/patterns/command-palette.tsx#L74-L108), [shell.tsx:238-250](../../../src/components/app/shell.tsx#L238-L250)).
- **Result announcement** (high; MNU). Counts and "no match" through the live announcer, once in Command for the palette, RecordPicker and a future search ([command.tsx:70-80](../../../packages/design-system/src/components/command.tsx#L70-L80), [:166-179](../../../packages/design-system/src/components/command.tsx#L166-L179)).

**Combobox, Select and DropdownMenu**

- **Virtualized or limited Combobox list** (high; SEL). The Map control dialog mounts 546 options in a 15,296px list. ComboboxList's Scroller structure blocks Base UI's virtualized recipe, `limit` is undocumented, and the generic dialog caps results at 50 by hand ([record-browser.tsx:431](../../../src/components/app/record-browser.tsx#L431)).
- **Option description slot** (low; SEL, PA5). Two-line options (name and email, code and prose, label and a disabled reason) are hand-built ([fields.tsx:160-163](../../../src/components/app/fields.tsx#L160-L163), [requirement-control-mappings.tsx:680-693](../../../src/components/prototype/requirement-control-mappings.tsx#L680-L693)).
- **DropdownMenuItem description** (medium; MNU). A helper line for disabled prerequisites and similar actions; see the disabled-with-a-reason entry above. Reference: Atlassian DropdownItem `description`; Polaris ActionList `helpText`.
- **Menu-button trigger chevron** (medium; MNU). Eight Actions menus and two create menus draw triggers differently ([program-workspace.tsx:189](../../../src/components/prototype/program-workspace.tsx#L189) against [program-record.tsx:126](../../../src/components/prototype/program-record.tsx#L126); [program-systems-tree.tsx:344-349](../../../src/components/prototype/program-systems-tree.tsx#L344-L349)).

**Button and IconButton**

- **Loading label with a stable width** (medium; BTN). `isLoading` adds 16px, so six dialogs swap to "Saving…" labels instead ([system-element-dialog.tsx:370](../../../src/components/prototype/system-element-dialog.tsx#L370), [system-baseline.tsx:915-920](../../../src/components/prototype/system-baseline.tsx#L915-L920), [add-requirement-details-dialog.tsx:315](../../../src/components/prototype/add-requirement-details-dialog.tsx#L315), [library-update-review.tsx:269](../../../src/components/prototype/library-update-review.tsx#L269)). Reference: Atlassian Button `isLoading` overlay.
- **IconButton `xsmall` or compact size** (medium; BTN). Row, tree and header controls are 20–24px, and the kit hand-rolls the same raw button about eight times ([table.tsx:448](../../../packages/design-system/src/components/table.tsx#L448), [data-table.tsx:435](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L435), [tree.tsx:314](../../../packages/design-system/src/components/tree.tsx#L314), [item.tsx:150](../../../packages/design-system/src/components/item.tsx#L150), [reorder.tsx:167](../../../packages/design-system/src/patterns/data-table/reorder.tsx#L167), [columns-menu.tsx:173](../../../packages/design-system/src/patterns/data-table/columns-menu.tsx#L173)). Reference: Atlassian IconButton `spacing="compact"`.

**TextLink and RecordLink**

- **In-text underline from `data-in-text`** (high; G2). The kit detects a link inside a sentence and leaves the underline to each consumer, who forgets it; axe reports `link-in-text-block` on /programs/new step 2 ([text-link.tsx:24-43](../../../packages/design-system/src/components/text-link.tsx#L24-L43)). Reference: WCAG 1.4.1.
- **`external` (new tab)** (medium; CNT, PA5, G2, PRT, GAP, PA1). Target, `rel="noopener"`, a trailing icon and hidden localised text. Eleven links open new tabs without saying so ([catalog.tsx:339](../../../src/routes/catalog.tsx#L339), [system-evidence.tsx:383](../../../src/components/prototype/system-evidence.tsx#L383), [library-components.tsx:915](../../../src/components/prototype/library-components.tsx#L915), [catalog.tsx:180-183](../../../src/components/app/program-wizard/catalog.tsx#L180-L183), [elements.tsx:570-578](../../../src/components/app/program-wizard/elements.tsx#L570-L578), [evidence-version-details.tsx:62-69](../../../src/components/prototype/evidence-version-details.tsx#L62-L69)). `prefer-text-link` misses `<a className="underline">` ([eslint-plugin/index.js:430-444](../../../packages/design-system/eslint-plugin/index.js#L430-L444)), and RecordLink cannot open in a new tab ([editor.tsx:166-169](../../../src/components/app/profile-tailoring/editor.tsx#L166-L169)). See GAP-13. Reference: Atlassian Link `newWindowLabel`; WCAG G201.

**Field, FieldSet and inputs**

- **FieldSet `disabled` that reaches Base UI controls** (high; CTL). The app's pending and read-only guard is a native `<fieldset disabled>`, which leaves Checkbox, RadioGroup and Switch live (CTL-1; [program-wizard.tsx:311-313](../../../src/components/app/program-wizard.tsx#L311-L313), [library-products.tsx:990](../../../src/components/prototype/library-products.tsx#L990), [add-from-library.tsx:580](../../../src/components/prototype/add-from-library.tsx#L580)). GAP-4 depends on it.
- **FieldLabel `required`** (medium; INP, VW3). One accessible marker instead of six hand-written spans and a plain-text " *" ([fields.tsx:54](../../../src/components/app/fields.tsx#L54), [:87](../../../src/components/app/fields.tsx#L87), [create-task-dialog.tsx:57-66](../../../src/components/prototype/create-task-dialog.tsx#L57-L66), [record-browser.tsx:724](../../../src/components/app/record-browser.tsx#L724)). Reference: Atlassian RequiredAsterisk.
- **Textarea `autoResize` with `minRows` and `maxRows`** (medium; INP). Implementation statements and rationales are long, and the box is a fixed 64px with manual resize ([textarea.tsx:11](../../../packages/design-system/src/components/textarea.tsx#L11), [input-group.tsx:126](../../../packages/design-system/src/components/input-group.tsx#L126), [requirement-form.tsx:184-192](../../../src/components/prototype/requirement-form.tsx#L184-L192)). Reference: Atlassian Textarea `resize="smart"`.
- **16px control text on coarse pointers** (medium; TOK). Controls use 13px text ([controls.tsx:3](../../../packages/design-system/src/components/controls.tsx#L3)), so iOS zooms on every field at phone widths (TOK-8).
- **Read-only look for Checkbox, RadioGroup and Switch** (medium; CTL). They look editable when read-only, unlike Input and Select ([checkbox.tsx:15](../../../packages/design-system/src/components/checkbox.tsx#L15), [radio-group.tsx:36](../../../packages/design-system/src/components/radio-group.tsx#L36), [switch.tsx:19](../../../packages/design-system/src/components/switch.tsx#L19)). Reference: Carbon read-only states.

**DatePicker**

- **min/max and typed entry** (high; GAP). Disabled days so a start and end can constrain each other, and typed entry (the open docs/next.md decision). Program end before start is caught only at the review step ([program.tsx:86-104](../../../src/components/app/program-wizard/program.tsx#L86-L104), [program-wizard.ts:210](../../../src/lib/program-wizard.ts#L210)). Then move program dates, task due and evidence expiry onto DatePicker, keeping the wizard's Continue enabled and validating on press. GAP-6 is tracked.
- **Date variant of Editable** (low; DAT). Task Due and POA&M planned completion are read-only facts, so changing a date needs a full dialog or is impossible ([tasks.$taskId.tsx:263](../../../src/routes/tasks.$taskId.tsx#L263), [assurance-views.tsx:613](../../../src/components/prototype/assurance-views.tsx#L613)); listed as not built in docs/next.md.

**Editable**

- **`onEditingChange`, `onDraftChange` and `onCancel`** (high; EDT, PA5). Hosts must guard uncommitted drafts on route change, but Editable reports nothing until commit, so RequirementForm sniffs native input and Escape events through a wrapper ([requirement-form.tsx:171-183](../../../src/components/prototype/requirement-form.tsx#L171-L183), [editable.tsx:32-43](../../../packages/design-system/src/patterns/editable.tsx#L32-L43)). Reference: Atlassian InlineEdit `isEditing`, `onEdit`, `onCancel`.
- **Failed state that keeps the rejected draft, with Retry and Discard** (high; EDT). Revision concurrency makes refused saves routine; the prototype hand-built it ([requirement-form.tsx:277-303](../../../src/components/prototype/requirement-form.tsx#L277-L303)).
- **Editable.Select options as `{ value, label }`, with a none option** (high; EDT). Stored values are party ids and readers must see names; the form maps labels back to ids, shows "name · uuid" for duplicate names and uses an "Unassigned" sentinel ([requirement-form.tsx:67-79](../../../src/components/prototype/requirement-form.tsx#L67-L79), [:239-261](../../../src/components/prototype/requirement-form.tsx#L239-L261)).
- **`readOnly` with an optional reason** (medium; EDT, PA5). Viewer roles and published revisions are core to the product; consumers hand-roll plain-text branches ([requirement-form.tsx:168-169](../../../src/components/prototype/requirement-form.tsx#L168-L169), [:212-213](../../../src/components/prototype/requirement-form.tsx#L212-L213)).
- **Confirm and cancel buttons** (medium; EDT). At least on coarse pointers and for multiline: a touch keyboard has no Escape, and blur always commits ([editable.tsx:210-229](../../../packages/design-system/src/patterns/editable.tsx#L210-L229)). Reference: Atlassian InlineEdit action buttons.

**Stat and Card**

- **Linked Stat.Tile, or a clickable Card** (high; STA, PA4, CNT, API, GAP). Dashboard counts open their filtered register. The documented link around the tile breaks the grid and hides focus, so three screens hand-roll clickable tiles from raw buttons ([index.tsx:85-107](../../../src/routes/index.tsx#L85-L107), [program-workspace.tsx:282-293](../../../src/components/prototype/program-workspace.tsx#L282-L293), [record-browser.tsx:1162-1180](../../../src/components/app/record-browser.tsx#L1162-L1180)), and Related cards show a hover shadow when they are not clickable ([related.tsx:186](../../../packages/design-system/src/patterns/related.tsx#L186)). GAP-12 is tracked in docs/next.md. Reference: Carbon clickable tile.
- **Stat loading and unavailable states** (medium; STA, PRT, GAP). Screens write "Loading…", "…" or "Unavailable" into the number slot, which shifts layout ([index.tsx:97-103](../../../src/routes/index.tsx#L97-L103), [program-workspace.tsx:289](../../../src/components/prototype/program-workspace.tsx#L289), [record-browser.tsx:1175-1176](../../../src/components/app/record-browser.tsx#L1175-L1176)). Reference: Carbon skeleton states.

**KeyValue, Item, Badge and truncation**

- **KeyValue label that wraps or reveals, auto width in page bodies, a named width scale** (medium; VW3, PA5). Fixed 104px labels truncate with no title ("OSCAL docum…", "Planned compl…", "Requirement re…"), and callers pass ad-hoc pixel widths in one list ([key-value.tsx:19](../../../packages/design-system/src/components/key-value.tsx#L19), [:26-31](../../../packages/design-system/src/components/key-value.tsx#L26-L31), [:32](../../../packages/design-system/src/components/key-value.tsx#L32), [requirement-record.tsx:374](../../../src/components/prototype/requirement-record.tsx#L374), [:384](../../../src/components/prototype/requirement-record.tsx#L384)).
- **Item title wrap or line clamp** (medium; CNT). Record names are long, and Item truncates titles, ids and meta with no reveal ("Router managem…", "Bank reconc…" at 340px; [item.tsx:101](../../../packages/design-system/src/components/item.tsx#L101)).
- **Middle truncation** (medium; G1). Evidence file names and ids differ at the end (date, extension), which end truncation removes ([attachment.tsx:97-105](../../../packages/design-system/src/components/attachment.tsx#L97-L105)). Reference: Carbon Overflow content, mid-line truncation.
- **Badge `maxWidth` and accessible truncation** (medium; STS). Long RMF determinations such as "Other than satisfied" clip in status columns (STS-3). Reference: Atlassian Lozenge `maxWidth`.

**Tree, Timeline, Stepper and Scroller**

- **Tree.Item hint or meta slot that yields width** (high; PA1, STR). The trailing slot is `shrink-0`, so a code or profile beside the name collapses the name to "Unna…" at 390px ([tree.tsx:334-337](../../../packages/design-system/src/components/tree.tsx#L334-L337), [elements.tsx:296-334](../../../src/components/app/program-wizard/elements.tsx#L296-L334), [:387-423](../../../src/components/app/program-wizard/elements.tsx#L387-L423)). Table.Tree already has `hint` ([table.tsx:654-676](../../../packages/design-system/src/components/table.tsx#L654-L676)).
- **ScrollerViewport focusable only while overflowing, and named** (medium; NAV). Callers hard-code `tabIndex={0}` with no name, so non-overflowing strips become unnamed tab stops ([stepper.tsx:91](../../../packages/design-system/src/components/stepper.tsx#L91), [timeline.tsx:142](../../../packages/design-system/src/components/timeline.tsx#L142)). Reference: Base UI ScrollArea viewport.
- **Horizontal Timeline item width and title wrap** (low; PA4). Items are `flex-1` and titles truncate; `wrap` applies to vertical only, so the program timeline overrides child widths with `*:` selectors ([program-timeline.tsx:85-101](../../../src/components/prototype/program-timeline.tsx#L85-L101), [timeline.tsx:124-136](../../../packages/design-system/src/components/timeline.tsx#L124-L136)).
- **Container-responsive Stepper orientation** (low; PA1). A wizard wants a vertical Stepper beside the form and a horizontal one above it when narrow ([stepper.tsx:34-90](../../../packages/design-system/src/components/stepper.tsx#L34-L90), [program-wizard.tsx:283-309](../../../src/components/app/program-wizard.tsx#L283-L309)).

**WorkPane**

- **Single-pane narrow mode with Back** (high; REC, PA1). Stacked below 768px, WorkPane puts the detail after the whole list; the tailoring dialogs hold up to 1,196 rows, and at 390px the detail lands at y=36,245 ([work-pane.tsx:74-111](../../../packages/design-system/src/patterns/work-pane.tsx#L74-L111)). Open in docs/next.md as a design decision.
- **Selectable list with one tab stop and `aria-selected`** (high; REC). The open row needs a programmatic state, and 767 row buttons cost 767 tab stops ([parameter-picker.tsx:113-131](../../../src/components/app/profile-tailoring/parameter-picker.tsx#L113-L131)). Reference: WAI-ARIA APG Listbox; React Aria GridList.
- **`listToolbar` slot** (medium; REC). Both callers misuse `listLabel` for search and filter, which unnames the landmark ([control-picker.tsx:124-145](../../../src/components/app/profile-tailoring/control-picker.tsx#L124-L145), [parameter-picker.tsx:105-112](../../../src/components/app/profile-tailoring/parameter-picker.tsx#L105-L112)).

**Inspector, Related and Item.Group**

- **Inspector.Group `defaultOpen`, `open` and `onOpenChange`** (high; REC). The contract requires a collapsed Details section, and the group can only start open, so four screens hand-roll one (see Disclosure header above).
- **Heading level** (medium; G2, REC, DSC). Inspector.Group hard-codes h3 ([inspector.tsx:74](../../../packages/design-system/src/patterns/inspector.tsx#L74)), so 8 routes skip h2; the live system preview reads H2 title, H3 Details, H2 Description, H3 Contains. AccordionTrigger's `headingLevel` existed in 0.5.0 and was lost ([CHANGELOG.md:394](../../../packages/design-system/CHANGELOG.md#L394)). The heading level context above covers this.

**Headings and titles**

- **PageHeader.Title `render` or level** (high; API, PGL, PA5, PRV, A11). Previews and sheets need the record title as h2, and two files copy the Title's classes onto a raw h2 ([page-header.tsx:40-47](../../../packages/design-system/src/layout/page-header.tsx#L40-L47), [record-preview.tsx:194-198](../../../src/components/prototype/record-preview.tsx#L194-L198), [preview-sheet.tsx:117-125](../../../packages/design-system/src/patterns/preview-sheet.tsx#L117-L125)). PageHeader.Lead, Section.Title and Shell.Panel.Title already take `render`.
- **Heading sizes for the titles the kit renders** (high; PRM). The page and record title (20/26 semibold) and the section title (13px) are not on the Heading ramp, so every kit title and 12 app headings copy class strings ([page-header.tsx:45](../../../packages/design-system/src/layout/page-header.tsx#L45), [section.tsx:107](../../../packages/design-system/src/layout/section.tsx#L107), [stat.tsx:49](../../../packages/design-system/src/components/stat.tsx#L49), [control-detail.tsx:26](../../../src/components/app/profile-tailoring/control-detail.tsx#L26), [library-controls.tsx:172](../../../src/components/prototype/library-controls.tsx#L172)). Reference: Atlassian Heading sizes.
- **Section landmark opt-in** (medium; PGL). Titled Sections are always regions; record pages show six or more, and previews add regions around three-line paragraphs. Reference: WAI-ARIA APG Landmark Regions.
- **Chart.Frame title level** (low; CHF). The title is a span ([frame.tsx:321](../../../packages/design-system/src/patterns/chart/frame.tsx#L321)), so dashboards with several charts have no heading navigation.

**Empty and Absent**

- **EmptyTitle heading level** (high; EMP). The title looks like a heading but is a div, so a page whose main content is an Empty (not found, route error, first run) has no heading in the outline ([empty.tsx:109-123](../../../packages/design-system/src/components/empty.tsx#L109-L123), [work-common.tsx:149](../../../src/components/prototype/work-common.tsx#L149)). Reference: Atlassian EmptyState `headingLevel`.
- **Accessible text on Absent** (medium; PA2, VW3, CNT, PA4). The em dash has no text alternative and is silent under NVDA defaults, so the app types "Not recorded" in some places and not others ([typography.tsx:40-42](../../../packages/design-system/src/components/typography.tsx#L40-L42), [records.ts:82](../../../src/lib/records.ts#L82); 64 product uses). Reference: WCAG 1.1.1 and 1.3.1.
- **An "unavailable" Empty kind** (low; EMP). Not recommended: GAP-3 settles a route failure as Alert with Retry inside Shell.Main, and at most a documented composition on the Alert and Empty pages ([__root.tsx:69-94](../../../src/routes/__root.tsx#L69-L94)).

**Text, primitives and CodeBlock**

- **Text `preserveLineBreaks`, `breakWord` and `numeric`** (medium; PRM). Narratives, comments and ids need pre-wrap and overflow-wrap, and counts need tabular numerals; the app has 34 `whitespace-pre-wrap`, 5 `break-words`/`break-all` and 3 `tabular-nums` ([ssp-assembly.tsx:704](../../../src/components/prototype/ssp-assembly.tsx#L704), [tasks.$taskId.tsx:206](../../../src/routes/tasks.$taskId.tsx#L206), [record-browser.tsx:176](../../../src/components/app/record-browser.tsx#L176)). Reference: Polaris Text `breakWord` and `numeric`.
- **Min-size and shrink control on the layout primitives** (medium; PRM). `grow="fill"` without a zero min-size forces 40 `min-w-0`, 14 `min-h-0 flex-1 overflow-y-auto` and 5 `shrink-0` by hand in `src/`.
- **CodeBlock `code` string, `showLineNumbers` and a caption** (medium; CNT). CodeBlock needs pre-split lines and always draws a gutter, so the product shows JSON in a raw `<pre>` ([profiles.$profileId.tsx:460](../../../src/routes/profiles.$profileId.tsx#L460), [code-block.tsx:86](../../../packages/design-system/src/components/code-block.tsx#L86)); a caption would give Copy a home that does not cover the code. Reference: Atlassian CodeBlock `text`, `shouldShowLineNumbers`.
- **`formatFileSize` in the Ledger locale** (medium; STA). Attachment's description is meant to carry a readable size, and the evidence facts print raw bytes ([evidence-browser.tsx:505-506](../../../src/components/prototype/evidence-browser.tsx#L505-L506), [evidence-version-details.tsx:74-75](../../../src/components/prototype/evidence-version-details.tsx#L74-L75)).

**Shell**

- **Phone side-nav overlay as a modal** (high; G2, SHA). Initial focus, contained Tab, an inert background and a visible close. The overlay covers 90vw and the scrim the rest, yet Tab reaches the covered top nav and `inert` is set only while closing ([side-nav.tsx:122-150](../../../packages/design-system/src/layout/shell/side-nav.tsx#L122-L150), G2-1). Reference: WAI-ARIA APG Dialog (Modal); Polaris Frame TrapFocus.
- **Shell.Panel `initialFocus` and `finalFocus`** (high; SHB). On desktop focus never enters the panel (65 Tabs on /findings), and the app re-implements focus return and still returns to a stale row ([record-preview.tsx:62-133](../../../src/components/prototype/record-preview.tsx#L62-L133)). Reference: Base UI Dialog `initialFocus` and `finalFocus`.
- **SideNav.Item selected state** (medium; SHA). The current page is about 1.1:1, looks like hover and disappears in forced colours. Reference: Atlassian `color.background.selected`.
- **SideNav.Expandable `isActive`** (medium; SHA). A closed group, and the rail, must still show that it contains the current page ([side-nav.tsx:367](../../../packages/design-system/src/layout/shell/side-nav.tsx#L367), [shell.css:321-327](../../../packages/design-system/src/styles/shell.css#L321-L327)).
- **Layout mode on `useSideNav`** (medium; SHA). Products need to know whether the nav is an overlay without repeating the breakpoint ([shell.tsx:303](../../../src/components/app/shell.tsx#L303) calls `matchMedia('(min-width: 64rem)')`); the expand callback hard-codes its trigger ([root.tsx:127](../../../packages/design-system/src/layout/shell/root.tsx#L127)).
- **Panel placement between `lg` and the panel breakpoint** (medium; SHB). From 1024 to 1279px a preview replaces the register it previews (at 1180px on /findings). Reference: Atlassian navigation-system, inline from 1024px and overlay below.
- **Wrapping Banner** (medium; SHB). At 320px, 430px of banner text shows in 127px because the row height is fixed ([shell.css:44-50](../../../packages/design-system/src/styles/shell.css#L44-L50)). Reference: Atlassian Banner ("truncation is not accessible"); WCAG 1.4.10.

**Popover, HoverCard and Tooltip**

- **`anchor` and `collisionPadding`** (medium; FLT). Anchoring to a mark, a cell or a point is an ordinary need; without the props the chart code rebuilds the Popover surface from Base UI primitives ([_shared.tsx:1324-1350](../../../packages/design-system/src/patterns/chart/_shared.tsx#L1324-L1350), [heatmap.tsx:224-252](../../../packages/design-system/src/patterns/chart/heatmap.tsx#L224-L252), FLT-2).

**Focus and state styling**

- **Inset focus ring utility** (high; G3, A11). `outline-focused` sits 2px outside the element and is clipped by truncating cells, scroll viewports and animating hosts: the DataTable preview-cell name link has no visible ring, and the line Tabs ring is partly cut (A11-1). `outline-field-focused` already insets a ring for fields ([utilities.css:996-999](../../../packages/design-system/src/generated/utilities.css#L996-L999)); links, buttons and overlays in Table.Id, preview cells, the Scroller, ScrollArea and Tabs viewports, Timeline and Stepper, Collapsible panels and Card items need the same. Reference: Atlassian Focusable `isInset`.
- **Forced-colours treatment for highlighted, selected, pressed and current** (high; A11). [forced-colors.css](../../../packages/design-system/src/styles/forced-colors.css) covers switch, radio, tabs and progress only; menu highlight, toggle pressed and tree selection vanish when colours are forced (A11-2).

**PageSkeleton**

- **Register- and record-shaped loading skeletons** (medium; PGL). The router's PageSkeleton matches no page and data loads fall back to a spinner, so every page changes shape twice while loading ([work-common.tsx:85-89](../../../src/components/prototype/work-common.tsx#L85-L89)). Reference: Carbon DataTableSkeleton.

**Chart**

- **Announcement region on Plot** (high; CHF). Without it, the arrow-key walk and Enter to choose do nothing for screen-reader users; a live check found no `aria-live` after ArrowRight ([_shared.tsx:726-812](../../../packages/design-system/src/patterns/chart/_shared.tsx#L726-L812), CHF-1).
- **Narrow category labels** (high; CHX). Wrap to two lines or switch to horizontal: the Bar Negatives story at 340px labels 2 of 6 phases, and Bar Single at 480px labels 3 of 5 (CHX-2). Reference: Carbon Charts and Highcharts label wrapping.
- **Heatmap key bound to its scale** (medium; CHO). Chart.Scale is free text, disconnected from the binning, and has no status variant for the risk matrix ([heatmap.tsx:115-116](../../../packages/design-system/src/patterns/chart/heatmap.tsx#L115-L116), [:261-297](../../../packages/design-system/src/patterns/chart/heatmap.tsx#L261-L297), CHO-16).
- **`onRetry` on Chart.Frame** (medium; CHF). The error's retry belongs beside its message, as in DataTable, not in the header actions ([frame.tsx:419-434](../../../packages/design-system/src/patterns/chart/frame.tsx#L419-L434), [Chart.stories.tsx:105-118](../../../packages/design-system/src/stories/patterns/Chart.stories.tsx#L105-L118)).
- **Sparkline baseline (`zero` or `auto`)** (medium; CHX). A fixed zero start flattens any trend on a high base, such as coverage percentages ([sparkline.tsx:122](../../../packages/design-system/src/patterns/chart/sparkline.tsx#L122)).
- **Native props and ref on the plot parts** (low; CHO). Donut, Scatter, Treemap and Heatmap take only `className`, so `id`, `aria-describedby` and `data-*` are impossible.
- **Total at the end of a stacked bar** (low; CHX). End labels print only for unstacked bars ([bar.tsx:484](../../../packages/design-system/src/patterns/chart/bar.tsx#L484)), so the total per family sits in the tooltip or the table.

## Missing documentation

| Page or rule                                   | Missing                                                                                                                    | Evidence                                                                                                                                                                                                                                                              | Priority (units)   |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Inspector                                      | A family page with ArgTypes and an MCP entry; a composable root that can hold Groups                                       | 21 app files use it and the contract requires it; no Inspector.mdx ([inspector.tsx:21-96](../../../packages/design-system/src/patterns/inspector.tsx#L21-L96))                                                                                                                                                 | high (DOC, API)    |
| LedgerProvider and locale                      | A page for locale, time zone and direction, and how product code uses `useLedgerLocale`                                     | The formatter defaults to UTC and the app never mounts the provider ([locale-format.ts:188](../../../packages/design-system/src/lib/locale-format.ts#L188)); Shell.mdx names a nonexistent LedgerLocaleProvider                                                                                        | high (DOC, PA2)    |
| Props reference                                | Each part's inherited Base UI props (controlled state, form, callbacks)                                                    | MCP `docs-show` for Switch lists only style, className, render and size; Select has no props; llms.txt has none ([llms.mjs:94-99](../../../packages/design-system/build/llms.mjs#L94-L99))                                                                              | high (TOO)         |
| Product contract                               | When a collection must page or virtualize                                                                                  | A dialog shipped 1,196 unpaged rows with about 0.8s clicks ([system-baseline.tsx:655-671](../../../src/components/prototype/system-baseline.tsx#L655-L671)); DataTable.mdx already recommends `virtualize` for a thousand rows                                                                      | high (PRF)         |
| DataTable                                      | A render-budget test for "one row redraws per checkbox"                                                                    | DataTable.mdx promises it; nothing tests it, and it is false today (PRF-1)                                                                                                                                                                                            | high (PRF)         |
| Stepper                                        | Where focus goes when a wizard step changes                                                                                | The one wizard loses focus on every step change (STR-1, STR-2)                                                                                                                                                                                                        | high (STR)         |
| Product contract                               | Which shape activity and history take in a record body, rail and register                                                  | Four renderings ([index.tsx:182-206](../../../src/routes/index.tsx#L182-L206), [tasks.$taskId.tsx:226-240](../../../src/routes/tasks.$taskId.tsx#L226-L240), [requirement-record.tsx:299](../../../src/components/prototype/requirement-record.tsx#L299), [program-workspace.tsx:472-485](../../../src/components/prototype/program-workspace.tsx#L472-L485)); see GAP-8 | medium (STR)       |
| Product contract                               | Sign-in, workspace states and how a session ends                                                                           | No section in product-patterns.md and no sign-in family in [screen-inventory.json](../screen-inventory.json); see GAP-2                                                                                                                                                  | medium (G7)        |
| Product contract                               | Record comments: Composer or Dialog                                                                                        | Composer is orphaned and the task record builds comments by hand ([tasks.$taskId.tsx:84-97](../../../src/routes/tasks.$taskId.tsx#L84-L97), [:193-224](../../../src/routes/tasks.$taskId.tsx#L193-L224))                                                                                              | medium (EDT)       |
| Empty                                          | A not-found story to copy                                                                                                  | Four hand-rolled not-found shapes, one with no route back ([assessment-campaign.tsx:997-1004](../../../src/components/prototype/assessment-campaign.tsx#L997-L1004), [record-browser.tsx:943-963](../../../src/components/app/record-browser.tsx#L943-L963), [:98-121](../../../src/components/app/record-browser.tsx#L98-L121), [work-common.tsx:128-158](../../../src/components/prototype/work-common.tsx#L128-L158)) | medium (EMP)       |
| Checkbox and RadioGroup                        | The choice card (title, meta, link, error)                                                                                 | The wizard hand-built it ([catalog.tsx:160-263](../../../src/components/app/program-wizard/catalog.tsx#L160-L263)); it is one sentence in Field.mdx                                                                                                                                           | medium (CTL)       |
| Migrated Base UI families                      | When to use, when not to, Content, and a Do/Don't pair                                                                     | About 20 pages give provenance only (Dialog, Sheet, Select, Tabs); 49 of 102 story files have no pair                                                                                                                                                                | medium (DOC)       |
| RecordPicker and RecordBrowser                 | A play-tested RecordPicker story; ArgTypes on RecordBrowser                                                                 | [RecordPicker.stories.tsx:62](../../../packages/design-system/src/stories/patterns/RecordPicker.stories.tsx#L62) has no play function, which is how the focus-return bug shipped; [RecordBrowser.mdx:36-42](../../../packages/design-system/src/stories/patterns/RecordBrowser.mdx#L36-L42) documents props in prose                                                  | medium (PIK)       |
| Chart                                          | Stories under a non-default LedgerProvider and in forced colours                                                           | Every chart story runs en-US, UTC and default colours; they would have caught CHF-6, CHF-7 and CHF-12                                                                                                                                                                 | medium (CHF)       |
| Toolbar                                        | Which part a boolean filter uses                                                                                           | Three screens use a Button with raw `aria-pressed`; see GAP-5                                                                                                                                                                                                         | low (PA3)          |
| Chart                                          | Stories for Donut legend isolation in a Frame, Heatmap empty cells, Scatter coincident points                              | Documented, never exercised (CHO-10, CHO-14)                                                                                                                                                                                                                          | low (CHO)          |
| Breadcrumb and Resizable                       | RTL stories                                                                                                                | Neither is rendered right-to-left; both have RTL defects                                                                                                                                                                                                              | low (NAV)          |
| Shell                                          | An accessibility and persistence section                                                                                   | No contract for overlay focus, skip links over hidden areas, or keys shared between Shells                                                                                                                                                                            | low (SHA)          |

## Findings from the gap analysis

GAP-7 (evidence upload) and GAP-9 (no date display part) are written up above, under FileTrigger and DropZone and under DateTime.

**GAP-1 · Product forms report one error at the bottom and never mark a field invalid** (medium)
[create-task-dialog.tsx:228](../../../src/components/prototype/create-task-dialog.tsx#L228), [:434-443](../../../src/components/prototype/create-task-dialog.tsx#L434-L443), [system-element-dialog.tsx:117-129](../../../src/components/prototype/system-element-dialog.tsx#L117-L129), [:358](../../../src/components/prototype/system-element-dialog.tsx#L358), [program-wizard.tsx:260-262](../../../src/components/app/program-wizard.tsx#L260-L262), [:363-380](../../../src/components/app/program-wizard.tsx#L363-L380), [fields.tsx:22-60](../../../src/components/app/fields.tsx#L22-L60)

Every product form puts one hand-written error paragraph at the bottom, and none uses FieldError. On Create task at 390×844, an empty submit shows "Choose a program. Your task details are retained. Retrying the same request will not create a duplicate." about 540px below the Program field. No control is marked invalid and focus stays on Task title. A second submit is needed to learn the title is missing, and the "retained" line appears although no request was sent. At 375×667 the message sits below the scroller's bottom and nothing scrolls to it, so a sighted reader sees no change. Notices that are not errors ("An editor, admin, or owner can create a task.") are announced as alerts ([create-task-dialog.tsx:304](../../../src/components/prototype/create-task-dialog.tsx#L304), [program-wizard.tsx:260](../../../src/components/app/program-wizard.tsx#L260)).

Fix:

- App: bring CreateTaskDialog, the reference form, onto the Forms.mdx contract: FieldError per field, `data-invalid` and `aria-invalid`, focus on the first invalid control, every issue listed. Show the "retained" note only after a failed request. Give notices that are not errors `role="status"` or plain text.
- Kit: the Field error binding and ErrorSummary above. No new form-message part: Alert with a tone covers a form-level result.

**GAP-2 · A session that ends unmounts the app and destroys open drafts** (medium)
[workspace.tsx:71-80](../../../src/components/app/workspace.tsx#L71-L80), [:110-111](../../../src/components/app/workspace.tsx#L110-L111)

On SIGNED_OUT, or SIGNED_IN as a different user, the provider clears the query cache and renders the sign-in screen instead of its children. Every open Dialog, the wizard and inline drafts unmount, and the draft guards, which cover navigation only, never run. A reader writing a control narrative loses it without warning when they sign out in another tab or the refresh token is rejected.

Fix: an app fix, not a kit part.

- Keep clearing on a different user's SIGNED_IN, for tenant isolation.
- On the same user's SIGNED_OUT or a failed refresh, keep the tree mounted behind a blocking AlertDialog, "Sign in again", that re-authenticates in place. Clear the cache only after dirty surfaces are confirmed or discarded, or stash open drafts first.
- The kit needs at most a documented composition.

**GAP-3 · Only the root route has an error boundary, so any render error replaces the whole shell** (medium)
[__root.tsx:43-50](../../../src/routes/__root.tsx#L43-L50), [router.tsx:18-26](../../../src/router.tsx#L18-L26), [empty.tsx:166-178](../../../packages/design-system/src/components/empty.tsx#L166-L178)

No child route sets `errorComponent` and the router sets no `defaultErrorComponent`, so every error bubbles to the root match. There WorkspaceError replaces the providers, AppLayout and the Toaster. One broken chart or a bad OSCAL rule payload makes the whole app "Workspace unavailable": the side navigation disappears, drafts elsewhere on the page unmount, and the reader can only reload or go home.

Fix:

- Set a router `defaultErrorComponent` that renders inside Shell.Main: Alert `tone="danger"` with Retry (`router.invalidate` and reset) and a route home.
- Add boundaries around Panel and tab bodies where a local failure should not take the page.
- Do not add an Empty "error" kind. At most, show the boundary composition on the Alert and Empty pages.

**GAP-4 · Dialog and Sheet have no pending state, so 17 surfaces build their own guard** (medium)
[dialog.tsx:44-49](../../../packages/design-system/src/components/dialog.tsx#L44-L49), [field.tsx:7-15](../../../packages/design-system/src/components/field.tsx#L7-L15), [use-draft-guard.tsx:1-40](../../../src/components/app/use-draft-guard.tsx#L1-L40), [program-wizard.tsx:311-313](../../../src/components/app/program-wizard.tsx#L311-L313)

DialogContent offers only `showCloseButton`. Seventeen files repeat `onOpenChange` with `details.cancel()`, `showCloseButton={!busy}`, in-flight and bypass refs and a `useBlocker` (for example [create-task-dialog.tsx:258](../../../src/components/prototype/create-task-dialog.tsx#L258), [system-element-dialog.tsx:192](../../../src/components/prototype/system-element-dialog.tsx#L192), [library-update-review.tsx:211](../../../src/components/prototype/library-update-review.tsx#L211)), while the shared useDraftGuard has three users. Sixteen files write `<fieldset disabled className="min-w-0 border-0 p-0">` because FieldSet adds a gap, and one needs `eslint-disable ledger/use-primitives`. The rule that a pending save blocks Escape, outside dismissal and navigation exists in about 20 copies, and one, in RecordBrowser, has already drifted.

Fix:

- Kit: add `pending` to DialogContent and SheetContent. It maps to Base UI `disablePointerDismissal`, cancels Escape and hides the close button. Document `<FieldSet disabled={pending}>` in Forms.mdx rather than adding a variant, and make FieldSet's `disabled` reach Base UI controls (FieldSet, above).
- App: route every product form through useDraftGuard, or a DraftDialog wrapper in `src/components/app`, and replace the 16 raw fieldsets with FieldSet.

**GAP-5 · The "Include everything inside" filter shows no pressed state** (medium)
[system-library.tsx:249-256](../../../src/components/prototype/system-library.tsx#L249-L256), [system-evidence.tsx:343-350](../../../src/components/prototype/system-evidence.tsx#L343-L350), [system-requirements.tsx:258-265](../../../src/components/prototype/system-requirements.tsx#L258-L265)

Each screen passes a raw `aria-pressed` to a subtle Button without `isSelected`, the prop that paints the selected state ([button.tsx:26](../../../packages/design-system/src/components/button.tsx#L26), [:67](../../../packages/design-system/src/components/button.tsx#L67)). On the system record's Library tab at 1440px the background, colour and weight are identical before and after the click; only the saved-view count changes, from 1 to 28. Readers cannot tell whether the register includes descendant elements.

Fix:

- Use FilterChip, or Button with `isSelected`, on all three screens, and say in Toolbar.mdx which part a boolean filter uses.
- Consider a lint rule that rejects `aria-pressed` on a kit Button without `isSelected`.

**GAP-10 · The prototype rebuilds kit parts, so it no longer tests them** (medium)
[index.tsx:85-106](../../../src/routes/index.tsx#L85-L106), [profiles.$profileId.tsx:460-462](../../../src/routes/profiles.$profileId.tsx#L460-L462), [record-browser.tsx:176](../../../src/components/app/record-browser.tsx#L176), [:836-845](../../../src/components/app/record-browser.tsx#L836-L845), [editor.tsx:221-240](../../../src/components/app/profile-tailoring/editor.tsx#L221-L240), [shell.tsx:163-202](../../../src/components/app/shell.tsx#L163-L202), [evidence-browser.tsx:498](../../../src/components/prototype/evidence-browser.tsx#L498), [evidence-version-details.tsx:62-68](../../../src/components/prototype/evidence-version-details.tsx#L62-L68), [program-timeline.tsx:139-146](../../../src/components/prototype/program-timeline.tsx#L139-L146)

The Portfolio stat strip is a bordered Grid of `<p>`s. JSON rule definitions are `<pre>{JSON.stringify(…)}</pre>`. "Additional details" and "Reference notes" are native `<details>`. External artefact links are raw `<a className="underline">`, tailoring conflicts and wizard failures are `Box border-danger`, and "No lifecycle gates defined" is a bordered Box of subtle text. In `src/`, Stat, Attachment, DatePicker, FilterChip, Tooltip, Chart and Banner have 0 imports, Alert has 1, and Text has 12 uses against 113 raw `<p className>`. These screens miss CodeBlock's height cap and copy, Collapsible's semantics and motion, Stat's muted zero and Alert's layout, and the kit's own defects surface late.

Fix:

- Sweep the sites onto Stat.Grid and Stat.Tile, CodeBlock, Collapsible, TextLink, Alert and Empty `size="compact"`.
- For TopNav, add a `persistent` slot to TopNav.End or move ModeSwitch into the menu (the foldable end item above); then drop shell.tsx's hand-rolled split.
- Later: a product-usage count per part in ds-check. Lint for `<details>`, `<pre>` and raw `<a>` in product files is lower priority.

**GAP-11 · The program timeline nests its own scroller around Timeline's** (medium)
[program-timeline.tsx:56-84](../../../src/components/prototype/program-timeline.tsx#L56-L84), [timeline.tsx:138-144](../../../packages/design-system/src/components/timeline.tsx#L138-L144)

GateRail wraps a horizontal Timeline in a `role="region"` `tabIndex={0}` scroller with its own previous and next buttons, although horizontal Timeline already renders a Scroller with a focusable viewport and edge arrows. On the WS-X90 overview at 1440px the strip costs two tab stops, and the ‹ › buttons show beside a single gate that does not overflow.

Fix: remove the wrapper and the app's arrows, and give the label through Timeline's `label`.

| Id     | Finding                                                                                                                                   | Where                                                                                                                                                                                                                   | Fix                                                                                                                                                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GAP-13 | TextLink has no external form, so 11 links open new tabs without saying so, one inside a RadioGroup option's label in the wizard          | [catalog.tsx:339](../../../src/routes/catalog.tsx#L339), [program-wizard/catalog.tsx:175-186](../../../src/components/app/program-wizard/catalog.tsx#L175-L186), [elements.tsx:570-578](../../../src/components/app/program-wizard/elements.tsx#L570-L578), [text-link.tsx:34-52](../../../packages/design-system/src/components/text-link.tsx#L34-L52) | TextLink `external` (above). Have PreviewSheet's `openTo` announce the new tab as PreviewNavigation does. Move the wizard's catalog link out of the radio label.                            |
| GAP-14 | Catalog and library empties tell the reader to import a release, but reference data only arrives through the `seed:reference` CLI         | [catalog.tsx:263-266](../../../src/routes/catalog.tsx#L263-L266), [:348-351](../../../src/routes/catalog.tsx#L348-L351), [library-controls.tsx:135](../../../src/components/prototype/library-controls.tsx#L135), [program-workspace.tsx:791-800](../../../src/components/prototype/program-workspace.tsx#L791-L800) | Reword as read-only, for example "Reference data is loaded by a workspace administrator." An import flow is a product decision, not a kit gap.                                             |
| GAP-15 | Choosing a part has no rows for date range and time, date display, version comparison or error summary; ActionBar and WorkPane have no page | [Choosing.mdx:1-137](../../../packages/design-system/src/stories/docs/Choosing.mdx#L1-L137), [ds-check.mjs:20](../../../scripts/ds-check.mjs#L20), [:165](../../../scripts/ds-check.mjs#L165)                                                                               | Add the rows, pointing at the parts above, and a short "Not in the kit" list. Deprecate ActionBar (no consumers) with a lint fixer. Settle WorkPane per docs/next.md: a page, or a scheduled replacement. |

Already tracked:

- GAP-6, native date and datetime inputs, and DatePicker without min/max, typed entry or time: docs/next.md "Typed date entry". The kit and app work is under TimeField and DatePicker above.
- GAP-8, activity and comments built three ways with no actor, subject link or changes: docs/next.md "The prototype's feeds" and "A quote on an event". No new part: move the home feed, task comments and task activity onto Timeline.Item, with the actor as marker, the subject as a router link and the changes in a Collapsible.
- GAP-12, Stat.Tile cannot be a link and has no loading or unavailable state: docs/next.md "The dashboard's headline numbers". See Stat and Card above.

## Present and sufficient

Checked against Atlassian and Carbon for a records app, the catalogue breadth matches: about 60 components, 20 patterns, the Shell regions and a full Chart family. Ledger already covers these peer parts, so none of them is needed:

- a dual list or transfer (RecordPicker, PickerSheet, RecordBrowser);
- a virtual list, sortable list or filter builder (DataTable's virtualization, nested rows, row and column reorder, facets, saved views and `toCsv`);
- upload state rows (Attachment);
- empty and not-found states (Empty's 12 illustrations and MissingRecord);
- record paging with a labelled new-tab link (PreviewNavigation);
- deterministic locale formatting and translatable messages (LedgerProvider and `useLedgerLocale`);
- an activity or comment entry (Timeline.Item, per GAP-8);
- a form-level result message (Alert with a tone, per GAP-1);
- a route error state (Alert inside Shell.Main, per GAP-3).

Choosing a part is organised by need and already says that an unlisted need is a gap to flag.
