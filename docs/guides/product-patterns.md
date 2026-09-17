# Product pattern contract

The application's composition guide. Read it before creating or changing a screen. Ledger's Storybook documents what each part does; this guide decides which part this application uses for each shape, names the exceptions, and points at the file to copy. Do not infer a shape from a neighbouring screen, and do not keep a second copy of these rules anywhere else. A screen that needs a shape this guide does not cover gets a written recommendation (kit part or bespoke) before it is built. When a rule changes, change this guide and its reference file together.

## Registers

A standalone register is one `PageHeader` with the name in `PageHeader.Heading` / `PageHeader.Title`, followed by a frameless `DataTable` with `fill`. Nothing else: no sentence under the title, no `Section` around the only table, no create button in the page header (the toolbar carries it). Reference: [WorkTable](../../src/components/prototype/work-table.tsx).

The toolbar is the kit `Toolbar`: search first, saved views in `views`, filters in `filters`, Columns and Settings as permanent children, and one small primary in `actions`. Only filters collapse into More; on a phone the search takes its own row while views and actions stay visible. Omit a capability the collection or the reader's role has no use for. Never rebuild the row with an `Inline` or a second wrapper.

Columns come from `defineColumns` by kind. A date is `c.date` with the raw value; formatting never becomes the sort value. The record's name is a `TextLink` rendering a router `Link` to its record page, through `RecordLink` in [record-preview](../../src/components/prototype/record-preview.tsx); a model without a dedicated page links to its schema record. A row click follows the name's destination and is never the only opener. A collection with a preview gives its id column `preview` and `active`, which draws the eye. Buttons act; links navigate.

A tab whose only content is a collection starts with its toolbar and table. The tab already names the collection: do not repeat its heading or put explanatory prose above it. Multiple distinct collections in a record body use `Section` headings, h2, or h3 under a dialog title; never a second page h1. Authored descriptions belong in labelled record properties. Baseline provenance, counts and derivation belong in a collapsed Details section; genuine warnings, missing prerequisites and instructions inside a picker or form remain visible where they affect the task. A shared adapter carries table and data rules only, never a copy of a kit part; a new adapter needs a domain responsibility beyond renaming the table's props.

Record collections use `DataTable` even when embedded: component Structure and Program uses, product Variants, and requirement Adopted by follow this shape. Two named uses keep the kit `Table`: component/product version history selects the current version with an explicit button, and a profile's Source imports describes its ordered lineage and selection rules. These are version-selection and definition lists, not collection previews. Preserve their meaningful order; do not add search, sorting or an eye merely to resemble a register. This exception depends on the task, not an assumed small row count.

Every product `DataTable` explicitly sets `responsive`. The shared renderer measures its actual container, including space lost to an Aside or Panel, and retains the primary identity and row actions while moving lower-priority fields into a labelled More fields row disclosure. Give the primary name `priority: 0` and a readable width/minimum (usually 180–220px); lower numbers stay in the row longer. No field disappears: resize must not change stored column visibility, filters, sorting, selection, preview state or export. Do not solve narrow tables with a page overflow rule or a smaller font. Reference: [ProgramSystemsTree](../../src/components/prototype/program-systems-tree.tsx).

Every empty collection supplies an illustration, a title, a one-line explanation and the same create action as its toolbar, under the same role check. A filtered result with nothing in it uses the table's built-in Clear filters unless the collection needs different copy. Empty data and an empty filter result are different states.

## Collection previews

The eye opens a `Shell.Panel` with two distinct headers. The outer preview header contains only global preview navigation: Back when a nested frame is open, previous/next, the full-record link and Close. Its accessible name may use visually hidden text; it never visibly repeats the record name or holds record actions. The collection stays mounted, so filters, sort, selection and drafts survive preview navigation. `RecordPreviewProvider` owns one panel across registers; `RecordPreviewPanel` replaces a nested record frame while keeping its parent mounted for Back. Shell owns the panel's placement at every width and returns focus on close.

Every collection preview passes `RecordPreviewActions` from [record-preview](../../src/components/prototype/record-preview.tsx) to `RecordPreviewPanel.navigation`: it renders the kit `PreviewNavigation` with previous, next, an announced position and a real open-in-new-tab link to the full record. Feed it the table's displayed rows from `useDisplayedRecords`, so the endpoints follow the current filter, sort, page and tree state, and a row that has left the displayed order is not shown as present. The kit control takes callbacks, availability, position and a caller-supplied link; the application composition owns row order and destinations; Shell owns placement. Neither the kit nor Shell imports application routing. Reference: the requirement preview in [requirements-table](../../src/components/prototype/requirements-table.tsx).

The body starts with one inner record `PageHeader`: the record's name is its h2 title, and its domain actions belong in `PageHeader.Actions`. `RecordPreviewPanel` supplies this header from `title` and `recordActions`; consumers do not render a second copy. Use one small primary (Edit system) and, when there is more than one action, an overflow `DropdownMenu` behind a subtle icon button for the rest. Keep the title readable as the inner header reflows at narrow widths. Status, owner, dates, identifiers and editors are labelled properties below it. Do not add a separate body action row or repeat the full-record link at the bottom. Reference: [the system preview in ProgramSystemsTree](../../src/components/prototype/program-systems-tree.tsx).

The one modal preview is the evidence artifact's version review, where the task must hold focus: a `PreviewSheet` with global navigation in its outer header, identity and record actions in its inner record header, labelled properties below, and a real full-record destination. A preview inside `PickerSheet` or `RecordBrowser` belongs to the selection task and never becomes a second record workflow. A panel for a task that is not a collection may omit collection navigation when its label says so; its record identity still belongs in the inner header.

## Record pages

One page-level h1 names the record. The breadcrumb goes in `PageHeader.Lead`, the name in `PageHeader.Title`, and one primary action or an Actions menu in `PageHeader.Actions`. A code goes in the trail or in Details, never in place of the name. The header has no back-chevron row, sentence description, status badge, property editor or second action row. Reference: [the task record](../../src/routes/tasks.$taskId.tsx).

State, owner, identifiers and dates sit in an `Inspector` group named Details. A tabbed record renders `Shell.Aside` on Overview; a tab that is a register fills the work area without the rail. A record without tabs keeps its Details rail. A supported inline edit is an `Editable`; a larger change follows the form contract.

A missing record is an `Empty` with the search illustration, a clear title, an explanation and a route back. It is never an error alert or an empty title. Loading and failure are different states from not found.

## Tabs

Every product page and preview uses a named `TabsList variant="line"`. Its underline spans the content width, up to a rail or panel boundary. The kit owns the horizontal `ScrollArea` and `ScrollBar`: tabs stay in one row and the strip scrolls when it is narrower than its labels, in a desktop preview and on a phone alike. Do not add `flex-wrap`, a width class or an overflow class to `TabsList`. Arrow keys reveal the focused tab without scrolling the page.

## Forms and confirmations

The create and edit surface is a `Dialog` titled with the operation and the singular product noun. The trigger, the dialog title and the primary use the same words: Create task, Create organization, Create risk. `productRecordNoun` and `productCreateLabel` in [product-records](../../src/lib/product-records.ts) own the generic vocabulary, including the party subtype. Create makes a new record; Add or Link connects an existing one. Reference: [CreateTaskDialog](../../src/components/prototype/create-task-dialog.tsx).

The first field takes focus. Validate on submit with the primary enabled; show errors that say what fixes them and keep the entered values after a failure. The footer stays outside the scrolling field region and belongs to the form through native form ownership (use `form` on the submit button when its footer sits outside the form). In `DialogFooter`, Cancel is a subtle button before the operation's primary. A button says the operation, never OK, Submit or Save alone.

A dirty dismissal, a route change away from a draft and a destructive decision go through `useConfirmation` in [confirmation](../../src/components/app/confirmation.tsx) (`discardChanges` for a draft), which renders the kit `AlertDialog`; never `window.confirm`. Keep editing keeps the values and the location; an explicit discard may close or navigate. A pending save blocks edits, a repeat submission, Escape, outside dismissal and navigation; a failed save keeps the draft and allows a retry. Reload and tab-close protection is the browser's `beforeunload`, never a custom dialog.

The closed list of other surfaces:

- Program setup is a page wizard; its element Sheet edits the wizard's own draft.
- The diagnostic schema inspector keeps addressable `/records/:collection/new` create pages. Product workflows use the Dialog default; the inspector shares its validation, labels and draft protection.
- One supported property is an `Editable`; a filter or a reason at its button is a `Popover`.
- Choosing records is a `PickerSheet`; linking related records is a `RecordBrowser`. Their internal preview belongs to the selection task.
- The evidence version review is the modal preview above.

Any other create or edit form is a Dialog, never a Sheet. An `AlertDialog` may open over the Dialog or Sheet that owns the decision; an independent record workflow navigates or replaces the current frame instead of stacking. Dirty and pending protection survive a change of surface.

## States and identity

Loading, errors and retry go through `QueryState` in [work-common](../../src/components/prototype/work-common.tsx), which keeps stale content usable after a failed refresh; libraries recover the same way. `Empty` describes an empty region (`size="compact"` in a small one); `Absent` describes a missing scalar. A failure is never a blank table, and a load in progress is never an empty state.

Every route sets its browser title as `<Screen or record type> — Program Assurance`; a child route never inherits its parent's title. Labels use the same words across program tabs, global registers, create actions and forms.

## What checks it

`npm run lint` runs the Ledger rules on every application file: tokens only, no margins, no copied kit parts, `TextLink` for links (`ledger/text-link-navigation` rejects an action element rendered by one), `ledger/no-native-confirm` and `ledger/dialog-footer-order`. A custom link adapter passes when it renders an anchor and forwards props and ref; the browser checks verify the destination. The app-only rules `ledger/product-responsive-table` and `ledger/product-line-tabs` enforce the table and tab contracts, including imported aliases and overriding prop spreads; generic kit examples keep their supported variants. Lint does not read cross-file workflow semantics.

`npm run test:app` guards the application boundary and the lint scope; the package tests cover public-export discovery and composition rules. `npm run test:patterns` drives representative product flows against a disposable local workspace at desktop, 390px and 340px widths (app on port 8080, or `APP_TEST_URL`); the `product-patterns` CI job provisions the committed Supabase schema and pinned reference data with `supabase/setup-cli` and runs it.

Before calling a changed screen done, check it in the running app: real names and links, preview order and endpoints, a failed save, a dirty cancel, a pending dismissal, empty and filtered recovery, and actual table bounds with the panel both open and closed. Check that the outer preview header contains global navigation only and that one inner record header contains the visible name and record actions. Verify a one-row scrollable preview tab strip, a full-width underline, hidden-field access and unchanged reader state after resizing. A scrollable table frame alone does not count as responsive. The Storybook tests cover the kit, not these compositions.
