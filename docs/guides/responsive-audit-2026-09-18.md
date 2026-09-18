# Responsive audit, 18 September 2026

Audited the Ledger kit (`packages/design-system`) and the product screens that compose it at four widths: 1440 (desktop), 800 (tablet), 390 (phone) and 340 (small phone). Method: every one of the 554 Storybook stories was rendered in the Storybook iframe with Playwright at each width, after its play function, and measured for document overflow, visible elements past the viewport edge that are not inside a horizontal scroller, and content clipped by `overflow: hidden` without an ellipsis. The same measure ran over 55 product URLs (the 52 routes in [the screen inventory](screen-inventory.json), with real record ids from the seeded developer workspace) signed in as the seeded user. Every flagged render was screenshotted and read. The sweep scripts live in the session scratchpad, not the repo; the recommendation to make one a check is below.

## What landed the same day

On Josef's "fix it all" the kit findings 1 to 8, 11 and 12 and the two product notes landed (the changelog entry "Responsive audit fixes" names the story for each): PageHeader wraps its actions under a title that cannot keep its measure; the shell gives the aside the window's remainder when it follows Main; `Shell.TopNav.End` takes `overflow`; horizontal Stepper and Timeline scroll inside a Scroller; PageSkeleton's head follows the width; the Toolbar's views row and the Presets strip scroll inside their row; KeyValue `wrap` breaks unbroken values; `sm` and `xl` are tokens; the Storybook has 390 and 340 viewports, ten narrow stories carry them, and every story fails if it scrolls the page sideways at the width it renders at. The schema shell folds its end items and the record rail formats stored timestamps. Not changed, by decision: the Breadcrumb's separator placement (finding 9) needs the separator inside the item it precedes, an API change, and is left for a Breadcrumb walk; the primary column's width policy (finding 10) works as designed, the identity column already keeps its preferred width; the touch-target heights (finding 13) wait for the touch pass.

## Summary

Most of the kit already behaves: the Shell's side nav, panel and icon rail; Dialog, AlertDialog and Sheet at 340; the Tabs strip; DataTable `responsive` and `fill` on every register; the Toolbar's stacking; RecordBrowser and WorkPane; every popup (Select, Combobox, DropdownMenu, Popover, HoverCard). No popup and no overlay overflowed at any width. What does not respond is a short list of parts that were built at one width and never rendered narrow: the page header, the shell's stacked aside, the top nav's end region, the horizontal Stepper and Timeline, the page skeleton, and the saved-view strip. Two of those are the ones a reader meets on every record page on a phone, which is why "some things don't collapse well" feels broader than it is.

The underlying cause is coverage: only Shell has stories at 240, 320, 390 and 640, and the a11y run renders every story once at the default width. Nothing in CI renders a part at 390 or 340, so a part with a fixed pixel width or a `shrink-0` column ships unnoticed.

## Kit findings, ranked

### 1. PageHeader never stacks its actions outside a Shell.Panel

`page-header` is `grid-template-columns: minmax(0, 1fr) auto` and `PageHeader.Actions` is `shrink-0` ([page-header.tsx](../../packages/design-system/src/layout/page-header.tsx), [layout.css](../../packages/design-system/src/styles/layout.css)). The actions column takes its full intrinsic width and the title gets what is left. The only stacking rule is `@container shell-panel (width < 400px)` in shell.css, which applies inside a panel and nowhere else.

Measured: the campaign record at 340 gives the title column 109px beside a 187px "Edit assessment campaign" primary; "Assessment" breaks mid-word over five lines. The Layout/Shell Frame story at 390 renders "Programs" one letter per line beside three buttons. The Layout/PageHeader Constrained story proves the narrow case with a 60px "Actions" button only, so it passes while a full-label primary fails.

Fix: make the header its own inline-size container (`container-type: inline-size` on `page-header`) and move the panel's stacking rule to a header-level query so it applies on a page, in a panel and in a sheet alike; below the threshold, actions take a full row, right-aligned, and wrap. Add a Constrained story with a full-label primary and a menu at 340. Product headers then need no change.

### 2. On a narrow screen the aside lands below the fold of an empty main

The shell root is `min-height: 100dvh` with rows `auto auto minmax(0, 1fr) auto` ([shell.css](../../packages/design-system/src/styles/shell.css)). Below the aside breakpoint the aside moves to the `context` row under main, but main keeps the `1fr` row, so a short record leaves a blank band and the Details rail starts a screen down.

Measured: the campaign record at 390 ends its content at 427px; the rail starts at 681px; 254px of nothing between them. The same happens on every record with a short Overview (library component, product, profile). It is by design that the rail stacks; it is not by design that it hides.

Fix: below the aside breakpoint, when the aside is in the context row, give the main row `auto` and let the context row absorb the remaining height (`grid-template-rows: auto auto auto minmax(0, 1fr)` in that state), or drop the root's `min-height` from the main row and put it on the grid as a whole with `align-content: start`. Verify with the Shell Record rail story at 390.

### 3. Shell.TopNav.End has no overflow behaviour

`TopNav.End` is `flex shrink-0`. Whatever it holds pushes the top nav wider than the viewport and the whole document scrolls sideways. Measured: the Shell Frame, Collapsed, Skip links, Banner toggle, Remembered and Record rail stories overflow the document by 65px at 340 (the Light / Dark / Match system toggle group is 226px); the product's schema inspector shell overflows by 39px at 390 and 89px at 340 ("Sign out" is cut). The product shell in [shell.tsx](../../src/components/app/shell.tsx) avoids it by hand with an `md:hidden` overflow menu.

Fix: `min-w-0` on the three regions; an owned overflow rule for End (below the `md` breakpoint the region's non-essential children fold into one menu, as the product shell does today), or at least a documented recipe and a 340 story that the a11y run renders. The schema shell then adopts it.

### 4. Horizontal Stepper is 420px wide whatever the container

[stepper.tsx](../../packages/design-system/src/components/stepper.tsx) sets `minWidth: 420` inline on the horizontal list and nothing scrolls it. Every horizontal Stepper story is clipped at 390 and 340 (five stories, plus the Dont page). The program wizard uses this part.

Fix: wrap the horizontal list in `Scroller orientation="horizontal"` as Tabs does, so the steps scroll with edge arrows, or switch to the vertical orientation under a container width. Add a 340 story.

### 5. Horizontal Timeline is 420px wide whatever the container

Same cause in [timeline.tsx](../../packages/design-system/src/components/timeline.tsx) (`minWidth: 420` when horizontal); the Matrix and Runs stories clip at 390 and 340. Same fix.

### 6. PageSkeleton uses fixed pixel widths

[page-skeleton.tsx](../../packages/design-system/src/layout/page-skeleton.tsx) draws its lines at 440, 240, 96, 80, 72, 64 and 48px. The 440px line overflows the viewport at 390 and 340 and the skeleton table does not fold like the table it stands in for, so the loading state is the one screen that scrolls sideways on a phone. Fix: percentage or `max-w-full` widths for the lines, and a column count that follows the container (three columns under 480px).

### 7. Saved views overflow the toolbar at 340

DataTable.Presets renders a ToggleGroup in the Toolbar's `views` slot, which is `shrink-0`. In the Register and Matrix stories the strip ("All 24 · Overdue 6 · In review 6 · Dana's 5") is 339px wide at 340 and overflows by 15px. `DataTable.Presets variant="menu"` exists; either the Toolbar folds views into it under a width, or the strip scrolls. Related: when the Toolbar stacks at phone widths it becomes three rows (search; views and More; Columns, Settings and the primary right-aligned) with the primary flush to the edge. It works and matches the contract; making the permanent group take the full third row would read better.

### 8. KeyValue values do not break unbroken strings

[key-value.tsx](../../packages/design-system/src/components/key-value.tsx) truncates by default and, with `wrap`, wraps words only. A UUID or an ISO timestamp neither wraps nor truncates and is clipped by the rail's Collapsible: the POA&M document at 1440 clips "2026-09-12T18:01:21.982404+…" by 34px. Fix: `break-words` (`overflow-wrap: anywhere`) on the `dd` when `wrap` is set. The product should also format that date; the kit should still not clip.

### 9. Breadcrumb wraps by item, separator last

At phone widths the trail wraps and a chevron is left at the end of a line ("WS-X90 Sentinel Mission System ›" then the next crumb below). `BreadcrumbEllipsis` exists but nothing collapses the middle automatically. Fix: keep each separator with the item it precedes (one `li` per separator-plus-item, `white-space: nowrap` on the pair), and consider collapsing the middle items to the ellipsis under a container width.

### 10. DataTable's primary column does not take the width its folded neighbours free

Evidence register at 390: Artifact 221px, Version 105px, More fields 32px. Folding works and nothing is lost, but the name truncates at about 25 characters while a short secondary column keeps 105px. Improvement, not a defect: let the `priority: 0` column grow into freed space before secondary columns keep theirs.

### 11. Breakpoint hygiene

The tokens define `md`, `lg`, `aside`, `panel` and `wide`. `sm` (640px) and `xl` (1280px) are Tailwind defaults, not tokens, and are used in Stat, Pagination, Calendar, Chart Frame, Grid and the product shell; [toast.css](../../packages/design-system/src/styles/toast.css) hard-codes `min-width: 640px`; Field's `@md/field-group` container query uses Tailwind's default 448px. Decide whether `sm` becomes a token (and `xl` is retired in favour of `panel`), and move the toast query onto it.

### 12. Charts are never rendered narrow

All 80 flagged chart renders are story wrappers fixed at 480–760px; Chart.Frame itself uses a `ResponsiveContainer` at 100%. So the frame shrinks in a product, but tick density, legends, end labels, targets and the details drawer at 340 are unverified. Add one narrow story per kind and read it.

### 13. Touch targets on touch widths

Breadcrumb links are 16px tall and inline TextLinks 18px; the eye and the disclosure chevron are 24px. Low priority; note it for the touch pass.

## Coverage, and what to add

- No story sets a viewport global. `preview.tsx` defines `ledgerNarrow` (320), `ledgerDesktop` and `ledgerWide`, and only the Shell, Pages, Drawer and ScrollArea stories reference viewports at all. The responsive stories (PageHeader Constrained, Shell Record rail, Stepper, Timeline, PageSkeleton, DataTable Register, Toolbar, Breadcrumb) should carry a 340 or 390 global so `test:a11y` renders them narrow.
- The sweep that produced this audit (render every story at four widths, fail on document overflow or a visible element past the viewport outside a scroller) is a few dozen lines of Playwright. Committed as a package check with a small allow-list of `dont` stories and fixed-width fixture stories, it would have caught 1, 3, 4, 5, 6 and 7 before they shipped.
- Story noise to leave alone: the "in rows" tables (Badge, Id, Indicator, Switch), Forms Layout, Toolbar Live, the Editable stories' `w-layout-list` frame, Stack Alignment, Box Surfaces, Grid Dont, Bleed, Tokens/Metrics and the Pages route switch are fixed-width demo fixtures that overflow at phone widths because the fixture is wider than the phone. The `dont` stories fail on purpose. The Command, CommandPalette, RecordPicker and Calendar "clipped" hits are visually hidden labels.

## Product notes for the next screen pass

These are compositions, not kit defects; they are here so the kit fixes are verified against them.

- The schema inspector shell (`schema-shell.tsx`) puts Back to prototype, the mode toggle and Sign out in `TopNav.End` with no overflow rule (finding 3).
- The POA&M document rail shows a raw ISO timestamp for Updated at (finding 8).
- The program record has enough tabs that its strip scrolls at 1440 with the rail open. Not a responsive bug, but the strip scrolls everywhere.
- Not verified: the program record and the program wizard at 390 and 340 were still loading when measured; assessment findings, assets, authorization packages, requirement definitions and workstreams have no records in the developer workspace, so those record pages were not rendered. Seed them before the product pass.

## Verified fine

Shell side nav overlay and icon rail at 390; panel replacing main below 1280; Dialog and AlertDialog at 340 (`calc(100% - 2rem)`); Sheet at 340 (full width, `maxWidth` 420 on desktop); Drawer; Tabs strip scrolling with one row and a full-width underline; DataTable `responsive` folding on every register at 390 and 340 with pagination in place; Toolbar stacking; Field's container query; RecordBrowser under 800px; WorkPane under `lg`; Calendar; Pagination; Stat grids; every popup and menu; Empty, Alert, Banner, Card, Item, Related, Gates, Glance, Composer, Editable (at their own widths).
