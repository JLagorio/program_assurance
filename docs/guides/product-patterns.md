# Product pattern contract

Part two. Read [part one, the core](product-patterns-core.md), first: principles, page types, actions, budgets. Each type names a reference file: copy it and read its header comment, which keeps what holds for that screen alone. Never infer a shape from a neighbouring screen. A rule changes here and in its reference file together.

## Every page

A page starts with `Page` from [the app shell](../../src/components/app/shell.tsx): its `PageHeader`, then its body; a loading or missing-record state takes the same `Page`. A screen never builds its own root `Stack`. The browser title is `<Screen or record type> — Program Assurance` from the route's `head()`; a loaded record names itself first (`useRecordTitle` in [browser-title](../../src/components/app/browser-title.ts)), a program view `<view> — <program name> — …` (`useViewTitle`). The side nav has two scopes, the organization's and a program's or product's work (a program's records included), each entry current by route and tab ([scope-navigation](../../src/components/app/scope-navigation.tsx)). Only Settings opens the schema inspector.

Tabs are a named `TabsList variant="line"` with no wrap, width or overflow class and no space added under the strip. A record's tab lives in the address, its only owner; a preview's tabs are its own state. A tab holds no second strip: its collections sit under `Section` headings. A filter over one collection is a `ToggleGroup` or a Toolbar filter, never a tab. A tab that counts its collection shows a `Count` with `max={9999}`, none while loading or failed. `RetainedTabPanels` in [program-shared](../../src/components/prototype/program-shared.tsx) draws a panel when first shown.

## Home

My work: line tabs Tasks and Attention, each a register of the reader's own work. Attention gives each item its reason and a link to its source; seen and done belong to the reader and that revision. Reference: [attention-inbox](../../src/components/prototype/attention-inbox.tsx).

- Do lead with what waits on the reader. Do give each row its reason. Do link the source.
- Don't chart. Don't repeat a register's filters as tiles. Don't change a status from an acknowledgement.

## Overview

A dashboard is a `PageHeader` holding only the name, a `Stat.Grid frame="band"` of at most four linked `Stat.Tile`s, then widgets in an `@container` grid: charts and top-N two thirds, activity one third. A tile counts one thing a reader acts on, its note names what to look at first, and its `link` opens the register on the tile's question (`questionSearch`; `{ filters: [] }` for all of it). A chart is a `Chart` frame titled with what it counts and how it splits, its description saying what it leaves out, its table twin one toggle away; a mark links to the register filtered to it, a zero to nothing. A top-N widget is a `Section` with a View all `TextLink` over a `DataTable` of at most five rows and no toolbar. The activity feed is a `Timeline size="small" wrap`, newest first. Reference: [the Portfolio](../../src/routes/index.tsx).

A record's Overview says where it stands before it lists anything: each group a `Tray` whose heading is the count and opens what it counts, over a `Stat.List` worst first, toned only where the value is a problem. A program's standing views (Control status, Posture and the rest) are listed in the `ViewSwitcher` that leads their part (`ProgramViewRow` in [program-views](../../src/components/prototype/program-views.tsx)) where they apply and the side nav does not name them, never only in a menu, each with its own h1, trail (program › part) and title, and no program Details. References: [program-overview](../../src/components/prototype/program-overview.tsx), [program-control-status](../../src/components/prototype/program-control-status.tsx).

- Do make every number open the register that holds it, asked for exactly those records. Do keep a map's table one toggle away. Do keep a count's place while it loads.
- Don't draw prose or a second band. Don't draw an unread number as zero. Don't put a view only in a menu.

## Register

One `PageHeader` with the name, then a frameless `DataTable` with `fill`: no sentence, no `Section` around it, no create button in the header. Every collection composes [ProductCollection](../../src/components/prototype/product-collection.tsx) with its reads as `queries`; an adapter adds a domain's columns, never a copy of a kit part, and headings only where its caller asks. The reader's question (search, sort, filters, page) lives in the address under the table's `view`; a link to a register on a question uses `questionSearch` with a view from [register-views](../../src/lib/register-views.ts); in a dialog, sheet or picker, `keepQuestion={false}`. A page of several registers draws them as line tabs under its one h1. Reference: [WorkTable](../../src/components/prototype/work-table.tsx).

The toolbar is the kit `Toolbar`: search (Find and the collection), saved views, filters with `activeFilters`, then Columns, Settings and the Collection actions overflow (Export) as children, and one small primary. A second way to create makes it a `ButtonGroup` with a labelled icon menu ([program-systems-tree](../../src/components/prototype/program-systems-tree.tsx)). A register of several programs' records has a Program column and filter ([program-filter](../../src/components/prototype/program-filter.ts)). Omit what nobody uses; never rebuild its row.

Columns come from `defineColumns` by kind: `c.date` with its raw value, `c.person`, `c.list`, `c.status`. The name is a `RecordLink` ([record-preview](../../src/components/prototype/record-preview.tsx)) at `priority: 0`, never into the schema inspector, and a record with no name reads "Unnamed <noun>"; one with no page is named by a link-styled Button opening its preview; in a Dialog or Sheet, plain text. A row click goes where the name goes and is never the only opener; a revision opens what it versions; a join row is named by the record it links. A kind, mark or second line is the column's `icon`, `badge` or `description`.

Every product DataTable is responsive. An unsized name takes the spare width; a column saying one thing on every row folds (`fold`). Resizing changes no visibility, filter, sort, selection or export; never fix a narrow table with page overflow or a smaller font. A collection pages 25 rows; past about 200 it pages or virtualizes; one that can hold thousands reads a page from the server through `useServerCollection` ([collection-question](../../src/components/prototype/collection-question.ts)), its filters passing `options` and its Export reading the whole result. Reference: CCIs in [catalog](../../src/routes/catalog.tsx).

A register acted on several rows at once is `selectable` for an editor: chosen rows swap the toolbar for `DataTable.SelectionBar`; a verb acts on every chosen row; Select all N is a second, explicit step ([assign-owner](../../src/components/prototype/assign-owner.tsx)). Record collections are DataTables even embedded; the kit `Table` stays for ordered lists whose order is their meaning (version history, Source imports, Cyber resiliency, Layers, a baseline's stack), with no search, sort or eye.

- Do write the empty state: illustration, title, one line, the toolbar's create. Do keep stale rows under one alert with Retry. Do tell a filtered empty (Clear filters) from an empty collection.
- Don't head or explain a tab's only collection. Don't colour or bolden a name. Don't draw every row at once.

## Record

One h1 names the record. `PageHeader.Lead` holds a `RecordTrail` ([record-trail](../../src/components/prototype/record-trail.tsx)); in a work scope it is `ProgramTrail`: the program's code › the part listing the page › any element holding it, no current level. A program has no tab strip; its parts, and views the side nav names, have no trail. Its parts are the side nav's entries, each at its `?tab=` address with its own h1 and title, the Overview's naming the program ([program-workspace](../../src/components/prototype/program-workspace.tsx)). `RecordHeading` ([work-common](../../src/components/prototype/work-common.tsx)) puts the `StatusBadge` beside the name; `RecordActions` holds Edit as the primary and the other commands in one Actions menu. `PageHeader.Facts` is the line under the name: a program's categorization and its one standing fact, `PageHeader.Standing` (`ProgramStandingFacts`). A code goes in the trail or Details, never for the name, except a control's code and title (`controlName`). Reference: [the task record](../../src/routes/tasks.$taskId.tsx).

Details are an `Inspector` in a `Shell.Aside` named `<Record type> details`, summary the `StatusBadge`, the `aside` of an `AsideLayout` around the body (Overview's panel when tabbed); narrow, a closed disclosure carrying the state. `KeyValue.Group` takes a named `labelWidth`. A property edited in place is an `Editable` in Details, a due day `Editable.Date`; authored text stays in the body. One revision read by every tab is named in a version menu before the Actions menu. A Section's count is its `count` (`countMax={9999}`), progress a labelled `Progress`; its description is authored; provenance sits in a collapsed Details section, while a warning stays where it affects the task. Comments and activity are a `Timeline`, newest first, written in its `Composer`.

The chain records (control, requirement, evidence artifact, assessment finding, operational issue, risk, remediation item) open with `TraceBand` ([assurance-trace](../../src/components/prototype/assurance-trace.tsx)) after the header and before the `AsideLayout`: up to four numbers, then a Trace of every stage in order, a stage not reached saying so. A gap the reader may close carries its fix: a link where it is made elsewhere, a link-styled Button opening over the page where it is made on the record ([next-step](../../src/components/prototype/next-step.tsx)).

A preview opens in `Shell.Panel` beside its collection, which stays mounted. Its outer header, named `<Record type> preview`, is navigation only: Back, `RecordPreviewActions` (previous, next, position, the full record) and Close. `RecordPreviewPanel` draws one inner `PageHeader` from `title` and `recordActions`: the name as h2, one small primary, an overflow menu; facts below, long text as `Prose`. `RecordSummaryPreview` serves a collection with no preview of its own; the evidence version review is the one modal preview. Reference: [requirements-table](../../src/components/prototype/requirements-table.tsx).

- Do say a missing record with `Empty`, the search illustration and a route back. Do give Details the state, owner, dates and identifiers. Do hold a band's numbers while the trace loads.
- Don't put the name or actions in the outer header. Don't add an action row or a description. Don't render a `Shell.Aside` outside an `AsideLayout`.

## Workspace

One job over many records, its own interaction family. The [Workbook](../../src/routes/programs.$programId_.workbook.tsx) stages edits locally, reviews every affected record and field before and after in one Dialog, and applies them in one revision-checked transaction; a formula never becomes an assurance fact. The [Control baseline](../../src/components/prototype/control-baseline.tsx) is one `WorkPane`: the stack as list, the catalog at the chosen layer as detail, its step and take in the address.

- Do keep every cell reachable by keyboard. Do put the job's verb where its work ends. Do keep drafts through a failed save.
- Don't draw a second chart. Don't save a what-if. Don't mix the grid with a register's table.

## Flow

A create or edit surface is a `Dialog` titled with the operation and the singular noun; trigger, title and primary say the same words (`productRecordNoun`, `productCreateLabel` in [product-records](../../src/lib/product-records.ts)). `DialogBody` scrolls; the footer holds Cancel, then the primary, which says the operation (Close where choices apply as made). Every control sits in a kit `Field` through [fields](../../src/components/app/fields.tsx), with no ids or ARIA of its own: a day is a `DatePicker`, a moment a `DateTimeField`, a limit `characterLimit`, a choice waiting on another `readOnly` with its reason. Validate on submit, then on change: a `FieldError` that says the fix, an `ErrorSummary` for several (`useFormFeedback`); a failure not about one field is an `Alert` atop the body. A dirty close, a route change from a draft and a destructive decision go through `useConfirmation` ([confirmation](../../src/components/app/confirmation.tsx)) and `useDraftGuard`; a pending save locks the surface; a failed one keeps the draft. Reference: [CreateTaskDialog](../../src/components/prototype/create-task-dialog.tsx).

The other surfaces, a closed list: Program setup is a page wizard on a `Stepper`; one property is an `Editable`, a filter or reason at its button a `Popover`; choosing records is a `PickerSheet`, which may collect one shared choice and applies all of it in one request; a next step opens its picker over the record; specifications are a Dialog; linking is a `RecordBrowser`, whose previews belong to the choice; the inspector keeps `/records/:collection/new`. Any other form is a Dialog, never a Sheet.

- Do keep the opener mounted. Do choose a record id once where a retry must be safe (`useSaveOnce`). Do show a refusal inside the surface.
- Don't write OK, Submit or Save alone. Don't stack an independent record workflow. Don't say optional in a placeholder.

The lint holds the rest: `initialFocus` not `autoFocus`, Cancel before the primary, a `width` step, no `role="alert"` paragraph, `isLoading` never with `disabled`, `useConfirmation` not `window.confirm`, `LinkButton` for navigation.

## Library

Reference data an administrator loads: the catalog, its controls and CCIs, reference baselines and the NIST SP 800-160 frameworks. An empty one says so and never asks the reader to import. A shared reference record shows no Actions menu. A control has the catalog's record and the program's, which its name opens inside a program. A framework item is named for what it is and read by its `code`. Reference: [the profile record](../../src/routes/profiles.$profileId.tsx).

- Do print the publication's words and order. Do name an ATT&CK item by identifier and name. Do link to where it is used.
- Don't create reference data. Don't sort an ordered list. Don't compute sentences about it.

## Verbs

Create makes a record, Edit changes it, Delete removes it; Add or Link connects one and Unlink or Remove takes the link away. Map control records a mapping, Allocate requirement an allocation, Assign owner one owner for the chosen records. Plan an assessment, Plan delta assessment and Add to assessment campaign plan controls as the objectives they count. Publish freezes a draft. Take version brings a newer version in, keeping what the program changed. Record and Clear determination judge in a product assessment; Mark as modified or inherited records what a program changed in an inherited element. Import reads a file in; Export writes a result out.

## Hierarchy

Type: `heading.page` (24) is the h1 alone; `figure` (20) a Stat figure; `heading.overlay` (17) a dialog title; `heading.section` (15) a Section, h2 (h3 under a dialog title); a card title stays below its section's; `body` (13) cells and values, a name at medium; `body.small` (12) labels. A title no part draws is a `Heading`, never a raw `h1`–`h6`. A container never outranks its parent.

Colour: a status, state, severity or impact is drawn by [status](../../src/components/app/status.tsx) over the one map in [src/lib/status](../../src/lib/status.ts); `c.status` takes the same words. Danger is wrong or late, warning needs attention, success a judgement reached, neutral none; brand blue is the primary, focus, selection and links. A name keeps the text colour.

Density: one line a row, no second line in a cell. Rows are 40px, 36 when compact.

## States

`QueryState` in [work-common](../../src/components/prototype/work-common.tsx) holds loading, failure and retry. A record page and each retained tab panel is a failure region: one alert whose Retry refetches every read in it; stale content stays; an empty block says Could not load. A value with its own failure is `QueryValue` with `ReportFailures`; a related name is `RelationName`. Loading is never empty, failure never blank. `Empty` is an empty region, `Absent` a missing value, never a dash. Dates go through `DateTime`; a due day is `DueDate` (Overdue, Due today, Due soon while open). Reads are scoped on the server with the columns drawn; no register, record, tab or Details reads the record schema.

## Glossary

- **Operational issue**; **Findings** groups issues and observations. **Assessment finding** is an assessor's; **Assessment results** hold a campaign's findings.
- **System**; **Task**; **My work** is the reader's, **Schedule** a program's tasks, gates and responsibilities. **Suppliers** lists organizations.
- **Risk register**; **POA&M** and **Risks**, a program's parts. **Remediation item**, versioned as **remediation commitments**, in a **POA&M plan**.
- **Overlay** adds or removes controls; **Tailoring** is a program's last layer; **Control baseline** the result; **Configuration baseline** the configuration record.
- **Assessment campaign**; **Assessment objective** by label and text (AC-02a.[01]).
- **Status** for progress, **State** for draft or published. **Verified**: reviewed evidence, not Satisfied. **Due date** in a form, **Due** in a column: a day. **Owner**, never Lead; Sponsor, Assessor, Observer.
- **Control status**: No requirement, No evidence, Not assessed, Other than satisfied, Partially satisfied, Satisfied; **Next step**. **Baseline standing**: In baseline, Added, Removed, Not selected.
- **Resiliency technique**, **Approach**, **Architectural layer**, **Security outcome**, **Life cycle process**. **ATT&CK technique** by identifier and name, **Matrix** Enterprise or ICS; **Countering control**.
- **Business line**, **Product**, **Delta** (Inherited, Shared, Changed here, Program only), **Product status**, **Compliance**. A **component set** groups **components**; offers: Offer to owner, Withdraw offer, Accept, Return.
- **Authorization**: ATO, ATO with conditions, IATT, ATU, DATO, ATD the day one ends (`authorizationTypes`); ATO expired, Revoked.

## Process

- **Lab lane.** Try a form before it is a kit part in [`src/components/prototype/lab/`](../../src/components/prototype/lab/README.md), each file's header starting `@lab YYYY-MM-DD`. Every lint rule stays on: primitives and tokens build any form, and changing a kit part's own styling is a kit change. After 30 days `test:app` fails until it becomes a kit part through `/ledger-add-part` (approved, and wanted by a second screen) or is deleted.
- **Adding a part.** `/ledger-add-part`.
- **Decisions.** Josef's decisions are dated lines in [the decisions log](../decisions.md), not rules.
- **This contract.** An addition removes as many words, or a dated "Contract budget" entry raises the cap that `check:contract-budget` reads.

## What checks it

`npm run lint` (Storybook Guidance/Lint rules; no cross-file workflow); `npm run test:app` (boundary, lint scope, inventory, lab expiry); `scripts/test-screen-families.mjs` over every inventory route; `npm run test:app-a11y`; `npm run test:patterns` at 1440, 390 and 340px; the schema tests in `supabase/tests/`.

Before calling a screen done (`/verify-screen`), check it running: real names and links; preview order and endpoints; a failed save, a dirty cancel, a pending dismissal; empty and filtered recovery; table bounds with the panel open and closed; Details beside the body, and a disclosure at 390px; the header and tab strip one width on every tab; the outer preview header navigation only; a one-row tab strip; the toolbar at 390 and 340px; touch emulated. A scrollable frame alone is not responsive.
