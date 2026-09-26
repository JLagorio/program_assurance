# Responsive audit, 24 September 2026

Second pass over Ledger (`packages/design-system`) and the app that composes it, after the [18 September audit](responsive-audit-2026-09-18.md) and its fixes. This pass looks for two kinds of failure:

- a part that does not respond: it overflows, clips, or collides;
- a part that responds by stacking where it should fold, so a phone screen is mostly chrome.

## What landed

On Josef's "build it all", taking the audit's recommendations for the four open decisions, every finding below landed in the kit, uncommitted. The changelog entry "Responsive audit, second pass" names the story for each.

| #   | Finding                       | Fix                                                                                                                                                                                       |
| --- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Viewport-keyed parts          | `Stat.Grid` (the `stat-grid` utility), Calendar, Pagination and WorkPane follow their own width. Grid keeps viewport breakpoints by design, and its page shows the intrinsic alternative. |
| 2   | Hover-only controls           | Row actions, the eye and header menus show where nothing can hover.                                                                                                                       |
| 3   | CI coverage                   | `npm run test:layout` runs every story at 390px and in a 320px frame. CI runs it, and chart and fixture stories are fluid.                                                                |
| 4   | Section header                | Section.Header, and PageHeader for short titles, keep a readable measure and wrap their actions. Card, Inspector and ActionBar do the same.                                               |
| 5   | Toolbar                       | Folds its filters, then its display controls, into More; two rows on a phone. The product contract says the same.                                                                         |
| 6   | Breadcrumb                    | Collapses the middle behind "Show hidden levels" and never leaves a separator dangling.                                                                                                   |
| 7   | InputGroup and top-nav search | InputGroup clips at its edge and hides the keyboard hint when narrow. The phone search is an icon button.                                                                                 |
| 8   | Pinned columns                | Give way in a narrow frame.                                                                                                                                                               |
| 9   | FilterChip                    | Stays on one line. ToggleGroup wraps.                                                                                                                                                     |
| 10  | Touch targets                 | `touch-target` and its band variants, applied across the small controls.                                                                                                                  |
| 11  | Smaller items                 | The eye no longer covers text; `Table` `minWidth`; Donut and Sparkline scale; the Scroller keeps the current item in view.                                                                |

Beyond the findings:

- Move left and Move right in a column's menu, so a column can be reordered without dragging.
- Localised labels for the new menus.
- A KeyValue value clips only across, so controls inside keep their focus ring and hit area.
- The IconButton tooltip no longer reopens after its menu closes.
- The panel splitter stays in place while the panel scrolls.
- Docs tables scroll on a phone.

Open items the builders recorded are in the changelog's stories and in `docs/next.md`.

## Method

Every one of the 568 stories was rendered in the Storybook iframe with Playwright:

- **Nine widths.** 1440, 1280, 1024, 768, 600, 480, 390, 340 and 320, after each story's play function.
- **Live resize.** Each story was resized from 1440 to 390 and back without reloading, and compared with a fresh render.
- **Container test.** 522 stories (all but Shell, Pages and Tokens) were rendered inside a 320px box and a 560px box on a 1440 viewport. This is the case a part meets inside a Shell.Panel, an aside or a sheet.

The app's 49 inventoried routes were rendered at six widths, signed in as the seeded developer on the WS-X90 program. On registers, the first row's preview panel was opened as well.

Each render was measured for:

- page overflow;
- elements past the viewport edge outside any scroller;
- clipped content with no ellipsis;
- words broken mid-word;
- text squeezed into a sliver;
- colliding text or controls;
- targets under 24px at touch widths.

Flagged renders were then read as screenshots, and the cause was traced to source.

The sweep scripts are in the session scratchpad, not the repo. The first coverage recommendation below says how to keep the useful part.

## Summary

The 18 September fixes hold. No app route scrolls sideways at any width, and PageHeader wraps its actions under a long title. The record rail follows the content on a phone, and the top nav folds its end items into one menu. The responsive DataTable folds to its name and a More fields disclosure at 320px, both on a phone and in a 320px box. Charts, measured as parts rather than inside their story frames, fit 390px: the legend and the Table, download and expand controls wrap onto their own rows. Every live resize ended in the same layout as a fresh render.

What remains falls into three groups.

1. **Parts that key off the viewport but live in containers.** `Stat.Grid` and the two-month `Calendar` switch on `sm:`/`lg:` viewport variants. In a 320px panel on a desktop screen they keep their wide layout: four or six crushed stat columns, or a second month spilling 160px out of the panel.
2. **Stacking where folding is needed.** None of these parts is broken on its own, but together they are why a phone "does not collapse well":
   - `Section.Header` keeps its actions beside the title until the title breaks mid-word.
   - The `Toolbar` becomes three or four rows.
   - The `Breadcrumb` wraps over three lines with dangling separators.

   On the SCTM view at 340px, the top nav, trail, title, Actions, tabs, section title and toolbar take about 470px before the first row.

3. **Touch.** The DataTable's row-actions menu and the table header's column actions stay invisible until hover, and nothing shows them on a touch screen. Checkboxes, radios, tree chevrons and row buttons are 14–20px.

The reason these ship is coverage. CI renders 10 of 568 stories at a phone width and none in a narrow container. Every chart story sits in a fixed 300–760px frame, so no check ever sees a chart narrow.

## Findings, ranked

### 1. Stat.Grid and Calendar lay out by the viewport, not their container (high)

`Stat.Grid` sets its columns with `sm:grid-cols-*`, `md:grid-cols-5` and `sm:grid-cols-3 lg:grid-cols-6` ([stat.tsx:85-91](../../packages/design-system/src/components/stat.tsx#L85-L91)).

- On a 390px phone it correctly shows two columns.
- In a 320px panel on a 1440 screen, `cols={4}` gives four columns of about 75px, with notes stacked a word per line ("Across / 6 / families").
- `cols={6}` gives six columns with every label clipped.

Stories: Components/Stat Six Across and Frames, in a 320px box.

The two-month `Calendar` sets its months side by side with `sm:flex-row` ([calendar.tsx:77](../../packages/design-system/src/components/calendar.tsx#L77)). In a 320px box the second month sits 160px outside it. Stories: Calendar Range, Navigation Layouts.

The same viewport keying has not caused a visible break yet in:

- the Grid primitive's responsive columns ([grid.tsx:15](../../packages/design-system/src/primitives/grid.tsx#L15));
- Pagination's Previous/Next words ([pagination.tsx:68](../../packages/design-system/src/components/pagination.tsx#L68));
- WorkPane's list-detail split ([work-pane.tsx:33](../../packages/design-system/src/patterns/work-pane.tsx#L33)). WorkPane only appears in a 1040px dialog today.

**Fix:**

- Make each part's root an inline-size container and switch on container variants (`@sm:`, `@lg:`), as Field already does with `@md/field-group`.
- Add one Stat and one Calendar story rendered in a 320px frame on a wide canvas.

### 2. Row actions and header actions are invisible on touch (high on phones)

The DataTable row-actions trigger is `opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100` ([data-table.tsx:516](../../packages/design-system/src/patterns/data-table/data-table.tsx#L516)), and nothing makes it visible without hover. A reader on a phone sees no "…" on any row. Table header trailing actions (the column menu) behave the same way ([table.tsx:275](../../packages/design-system/src/components/table.tsx#L275)).

The kit already has the fix in two places:

- the preview eye adds `[@media(hover:none)]:opacity-100` ([data-table.tsx:557](../../packages/design-system/src/patterns/data-table/data-table.tsx#L557), [table.tsx:471](../../packages/design-system/src/components/table.tsx#L471));
- Related cards add `pointer-coarse:opacity-100` ([related.tsx:203](../../packages/design-system/src/patterns/related.tsx#L203)).

**Fix:** Apply the same rule to the row-actions trigger and the header's trailing actions.

### 3. CI does not render parts narrow (high, process)

`vitest.config.ts` renders every story at `ledgerDesktop` (1200px) unless the story sets a viewport global ([vitest.config.ts:40-45](../../packages/design-system/vitest.config.ts#L40-L45)). Only 10 stories do. The sideways-scroll guard in `test/storybook.setup.ts` therefore checks 10 of 568 stories at a phone width, and none in a narrow container.

Every chart story wraps the part in a fixed `Box` (e.g. [ChartLine.stories.tsx:182](../../packages/design-system/src/stories/patterns/ChartLine.stories.tsx#L182), width 640). About 40 chart stories scroll a phone sideways for that reason alone, and none shows the chart fluid.

**Fix:**

- Add a vitest project that renders every story at 390px and again inside a 320px box on a desktop canvas, under the existing guard. Also make it fail on a word broken mid-word.
- Give it an allow-list for `Dont` stories and deliberate fixed-width fixtures. Most of those fixtures should become fluid (`maxWidth` instead of `width`), so the list stays short.

This would have caught findings 1, 4, 6, 7 and 8.

### 4. Section.Header never wraps its actions (medium)

The header is a non-wrapping flex row ([section.tsx:78](../../packages/design-system/src/layout/section.tsx#L78)). Its actions are `shrink-0` ([:126](../../packages/design-system/src/layout/section.tsx#L126)), and the title has `break-words` ([:107](../../packages/design-system/src/layout/section.tsx#L107)). At 320px, Layout/Section Composed breaks "Recorded runs" into "Recorde / d runs" beside Export and Add test run.

PageHeader received the fix on 18 September: the heading keeps a 14rem measure and the actions wrap under it ([layout.css:43-55](../../packages/design-system/src/styles/layout.css#L43-L55)). Section, which heads most record-body collections, did not.

**Fix:** Give `section-header` the same rule. Wrap the row, give the heading `flex: 1 1 min(100%, 12–14rem)`, and push the actions to the end.

### 5. Toolbar stacks into three or four rows on a phone (medium; the contract decides)

At 340px the Operational issues register spends four rows (about 150px) before its first record:

1. search;
2. All records and More;
3. Columns and Settings;
4. Create.

Record pages repeat this for every embedded collection, even a one-row one. Where the rows break depends on the length of the create label: Issue observations puts Columns and Create on separate rows, while Remediation commitments fits both. The cause is that once stacked, the end group wraps on its own ([toolbar.tsx:158](../../packages/design-system/src/patterns/toolbar.tsx#L158)).

This follows [the product contract](product-patterns.md), which keeps Columns and Settings as permanent children and folds only filters. The Toolbar itself follows its container correctly: in a 320px box it stacks exactly as on a phone.

**Decision needed:** below a container width, fold Columns and Settings into the Collection actions overflow and keep search, More and the one primary. The result is two rows, and the change belongs in the contract as well as in the kit.

### 6. Breadcrumb wraps with dangling separators and never collapses (medium, open since 18 September)

On `/issues/<id>` at 340px, "Findings & assets ›" ends its line and the current page drops below. On the SCTM view the trail takes three lines, each ending in a chevron. `BreadcrumbEllipsis` exists, but nothing collapses the middle.

**Fix:**

- Keep each separator with the item it precedes (unchanged from the 18 September recommendation).
- Below a container width, show the parent and the current page, with the middle behind the ellipsis.

### 7. InputGroup spills its addons when squeezed; TopNav has no narrow search (medium)

`InputGroup` has `min-w-0` but no clipping ([input-group.tsx:15](../../packages/design-system/src/components/input-group.tsx#L15)), and its addons are `shrink-0` ([:46](../../packages/design-system/src/components/input-group.tsx#L46)). In the Shell stories at 320–340px, `TopNav.Middle` squeezes the search group to 28px. That leaves a 16px input, and the trailing "⌘K" hint slides under the Create button.

The app avoids this with a Search button. The kit documents only the input group.

**Fix:**

- Clip the group and hide optional `InputGroupText` hints below a container width.
- Document, with a story, a TopNav search that becomes an icon button opening the search or the command palette below `md`.

### 8. Pinned columns never release in a narrow frame (medium)

In the Pinned columns story inside a 320px box, the pinned ID and name columns take the whole frame. Status, Owner and Due scroll through a sliver about 30px wide, and the name is cut with no ellipsis.

**Fix:** Ignore start pins when the pinned band would exceed about 60% of the frame, or let `responsive` take over. The same case inside a `responsive` table was not tested.

### 9. FilterChip wraps its label inside the pill (medium-low)

`FilterChip` is `h-control-small` with neither `whitespace-nowrap` nor `shrink-0` ([chip.tsx:36-43](../../packages/design-system/src/components/chip.tsx#L36-L43)). Squeezed in a row, "Status filter · In review" wraps into two lines inside a one-line pill (Data table "Filters follow live rows", 390px). The contract says button labels stay on one line.

**Fix:** Add `shrink-0 whitespace-nowrap`, and truncate the value at a max width.

### 10. Touch targets (medium, open since 18 September)

Interactive elements under 24×24px at 390px, counted across stories:

| Element                                | Size               | Count    |
| -------------------------------------- | ------------------ | -------- |
| Checkboxes                             | 16×16              | 95       |
| Radios                                 | 16×16              | 24       |
| Row and tree icon buttons (`size-250`) | 20×20              | about 45 |
| Table group and tree expand chevrons   | 14×14              | 10       |
| Breadcrumb links                       | 16px tall          | 20+      |
| Switches                               | 32×20; small 24×16 | 16       |
| Related item links                     | 18px tall          | 11       |
| Editable triggers                      | 22px tall          | 18       |
| Gates buttons                          | 24×18              | 5        |
| Badge links                            | 20px tall          | —        |

WCAG 2.5.8's spacing exception probably covers a row checkbox in a 40px row. It does not cover a 14px chevron beside a link.

**Fix:** Grow hit areas under `pointer: coarse` with an inset `::after`, starting with the chevrons, row icon buttons and breadcrumb links.

### 11. Smaller items (low)

- **Preview eye covers text.** The eye overlays the end of the ID or name, with no ellipsis. Examples: "WS-X90 Expanded Control Se" on `/campaigns` at 1280px with the panel open, and "CTRL-0" in Table Register at 390px. The cell should reserve the eye's width while it shows.
- **Plain `Table` squeezes the name column.** At 390px in Table Register, the name shrinks to "Segr…" while Owner keeps its full width. Finding 10 of 18 September remains true for Table. The responsive DataTable handles this, and product registers use it.
- **`Chart.Donut` size is fixed.** It takes a fixed pixel `size` and is `shrink-0` ([donut.tsx:148-149](../../packages/design-system/src/patterns/chart/donut.tsx#L148-L149)), so a large gauge overflows a narrow panel. Add `max-w-full` and scale the SVG through its viewBox.
- **Scroller keeps its scroll position after narrowing.** In a horizontal Stepper, the current step can end half outside the strip. Scroll it into view when the strip shrinks.
- **`Inline` does not wrap by default.** This matches Atlassian's default. Rows of controls built with it run off a phone, as in the Data table "Filters follow live rows" story. Guidance: use `shouldWrap` or the Toolbar.

## Status of the 18 September findings

| #    | Finding                      | Now                                                                                       |
| ---- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| 1    | PageHeader stacking          | Fixed. Actions wrap under long titles at 340px in the app and in the panel.               |
| 2    | Aside below an empty Main    | Fixed. The Record rail follows the content at 320px.                                      |
| 3    | TopNav.End overflow          | Fixed. The end items fold into one More menu at 320px. The search in Middle is finding 7. |
| 4, 5 | Horizontal Stepper, Timeline | Fixed. The Stepper Milestones and Timeline matrix overflows are fixed-width story frames. |
| 6    | PageSkeleton                 | Fixed.                                                                                    |
| 7    | Presets strip                | Fixed. The strip scrolls with an arrow at 320px.                                          |
| 8    | KeyValue unbroken values     | Fixed. UUIDs wrap in the preview panel.                                                   |
| 9    | Breadcrumb separators        | Open, now finding 6.                                                                      |
| 10   | Primary column width         | Fixed for DataTable `responsive`; still true for the plain Table (finding 11).            |
| 11   | Breakpoint tokens            | Fixed.                                                                                    |
| 12   | Charts never rendered narrow | The parts fit 390px. Their stories still never render narrow (finding 3).                 |
| 13   | Touch targets                | Open, now finding 10.                                                                     |

## Verified fine

- **App.** No route scrolls the page sideways at 1440, 1280, 1024, 768, 390 or 340px.
- **Preview panel.** At 390px it replaces Main with a header that holds navigation only, and the record header, properties and embedded collection fit.
- **Record pages at 1024px.** The rail moves under Main as designed.
- **Main's width with everything open.** With the side nav and the panel both open at 1280px, Main keeps about 730px, and the aside yields until 1760px.
- **Tabs.** The strip stays on one row and scrolls with arrows at 340px.
- **Shell.** The icon rail's expand control over the mark is intended.
- **DataTable `responsive`.** It folds on a phone and in a 320px box, and pagination fits.
- **Toolbar.** It follows its container.
- **Charts** at 390px as parts: Line, stacked Bar, the Heatmap matrix and Scatter, plus Overview Narrow at 320px.
- **Other parts.** Empty in a 320px box, Attachment at 390px, and the responsive Stepper and Timeline.
- **Live resize.** No part was left folded or overflowing after 1440 → 390 → 1440. The only differences were open popups closing and scroll positions.

Not re-verified in this pass:

- Dialog and Sheet at short heights. By source, Dialog caps at `calc(100dvh - 2rem)` and Sheet at `max-h-dvh`; the open-dialog render at 844×390 did not run.
- RecordBrowser on a phone.
- The pinned-columns story at a 320px viewport, as opposed to the 320px box.

## Story fixtures seen (not part defects)

These overflow a phone because the story fixes a width. Most would still be better fluid:

- Badge Categories and "in rows";
- Gates Matrix (260px cells);
- Separator Native composition (360px);
- Forms Choices (640px) and Pickers (420px);
- Typography In rail;
- ScrollArea Vertical;
- the Editable stories (`w-layout-list`);
- RadioGroup In field (360px);
- FilterChip In toolbar (640px);
- Stepper Milestones (520px);
- Timeline matrix (520px);
- HoverCard On an Id (a raw table);
- Mode Matrix;
- the Primitives and Tokens specimens;
- every chart story.
