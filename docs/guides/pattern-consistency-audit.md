# Pattern consistency audit

> Reviewed and consolidated on 2026-09-17 in [Consolidated pattern consistency audit](pattern-consistency-consolidated.md). Use that report for corrected counts, evidence qualifications, priorities, and the reconciled recommendations. This original census is retained as supporting evidence; Appendix C is a proposal, not an adopted contract. The sentences that report's corrections table names were amended in place on 2026-09-17.

2026-09-16. Every screen the prototype routes to (53 route files, 48 prototype and app components), measured against the kit's written rules (`docs/guides/component-library.md` "Rules that stay in the head"; the Storybook pages Pages, Overlays, PageHeader, Section, Toolbar, DataTable, Shell, PreviewSheet, RecordBrowser) and Josef's recorded decisions (the two-line record header, the task table's toolbar shape, no frame on a table, a proper Empty everywhere). Josef's complaint that prompted it: AI developers produce dialogs on some create forms and sheets on others, tables that sometimes follow the pattern and sometimes do not, headers with and without descriptions, previews that sometimes have an eye and sometimes not, sometimes in the panel and sometimes in a sheet, sometimes with the previous/next controls and sometimes without.

Method: five cataloguing passes, one per navigation group, every cell with a file and line; the headline sites re-read by hand. Facts only in the findings; the recommendations are decisions and wait for Josef. No code changed.

A parallel session wrote `docs/guides/design-consistency-audit-2026-09-16.md` the same evening, from the running app, with captures under `artifacts/design-consistency-audit/`. The two agree on the diagnosis and divide the work: this document is the census (every screen, every dimension, the furniture, the decisions); that one carries the defects this census only saw in source: live-verified there are the header collapse, the keyboard rows, the extra h1s and the label leak; source-verified are the date columns, the Sheet draft guard and Catalog's rows. They are folded in below where they change a finding: a title-and-description header that collapses to a zero-width title at phone width, table rows a keyboard cannot open, date columns sorted as text, an "Add organization" button that opens a "Create party" dialog, a product element Sheet that drops a draft without asking, and a `no-kit-shadow` lint rule that scans folders the kit no longer has.

## The short version

The complaint is accurate and it is not random. Every dimension below has a written rule; every dimension has two to five shapes in the app; and in most of them the kit's own stories or docs show more than one answer. The rules live in places a coding agent does not read (the Storybook MDX, one guide, the living list, and Claude's session memory), the lint checks tokens but never composition, and four shared "furniture" files, written for the schema inspector and reused for product screens, carry their own conventions to sixty-odd registers at once.

| Dimension | The rule | What the app does |
| --- | --- | --- |
| Create and edit forms | Over the page: Dialog, titled with the verb. Beside the list: Sheet, titled with the name. | 13 bespoke Dialogs, 1 generic Dialog reached from ~60 buttons, 4 form Sheets. The same job (edit an element of a tree) is a Sheet in two places and a Dialog in the third. Three footer shapes; 28 native `window.confirm`s and 2 AlertDialogs. |
| Previews | Names are links, the eye opens the preview, previous/next and open-in-new-tab sit in `Shell.Panel.actions`, an overlay is never the record. | Five surfaces (Panel, PreviewSheet, Dialog, inline box, none), three ways in (eye on 3 tables, a link drawn as a button on 25+, row click). One of nine panels has the documented header. Four Dialogs are the record. |
| Register headers | A collection page is a PageHeader and a DataTable with `fill`. Sentences under headings were swept out on 2026-09-05. | Title only (6), title plus a hand-written `<p>` inside the header (5), title plus `PageHeader.Description` (4). "New X" is in the header on 4 pages and in the toolbar on 8. A second PageHeader renders inside a tab, a legacy view or a dialog body on about thirty surfaces, all through one shared component. |
| Record headers | Trail, title, one primary action or an Actions menu; status and owner in Details, never the header. | Breadcrumb trail on 6 records, a back link inside the header on 5, a back link above the header with the status badge in the description slot on 7. Three secondaries and no primary on the system record; the requirement's title is its code. Four rail placements; four not-found idioms. |
| Table toolbars | The task table's shape: Search, Presets, Filters, then Columns, Settings, a small primary Add. | That shape in 15 files, the kit `Toolbar` in 10, neither in 2. Settings missing on 5, Presets on most. The kit's own DataTable stories draw both shapes. |
| Empties | A proper Empty everywhere, never a grey string. | `DataTable.empty` on the registers; ~20 plain `<p className="text-subtle">` strings on tabs, sections and rails. |
| Titles | One product. | Browser titles end "— Equinox" on 7 routes, "— Program Assurance" on 11, and 34 set none (16 program sub-routes inherit the Programs title, 18 the root's); the shell says Equinox. Panel titles are the code on 4 and the name on 5. |

## Why it happens

1. **The rules are not where a coding agent reads.** There is no `CLAUDE.md`; `AGENTS.md` carries only Lovable's history warning. The composition rules are in `docs/guides/component-library.md` under "Rules that stay in the head", in the package's Storybook MDX pages, which nothing in the app or its instructions points at, in `docs/next.md`, and in Claude's per-project memory (the task-table toolbar rule of 2026-09-07, the two-line header of 2026-09-05, no frame on a table, Empty everywhere). Lovable, Codex and any fresh session have none of the last three.
2. **The kit shows two answers.** `DataTable.stories.tsx` draws one register with the kit `Toolbar` (lines 218–227) and one with an `Inline` of Search, Presets, Columns and Settings (289–296). `Pages.stories.tsx:194` shows a `Shell.Panel` with a title only while `Shell.stories.tsx:821–839` shows one with Previous and Next. `Toolbar.mdx` says "the Section above names the register"; `Pages.mdx` says "a collection page is a PageHeader and a DataTable"; screens do both. On forms the kit contradicts itself: the Overlays page says a focused task over the page is a Dialog and a Sheet's title is a record's name, while the Forms page's Style table (`Forms.mdx:79–86`) says editing a few fields of a record is a Sheet and a Dialog is for one or two fields. A five-field create form fits both, so the product element became a Sheet and the system element a Dialog, each following a page.
3. **The lint checks tokens, not composition.** The fifteen `ledger/*` rules flag a margin class, an arbitrary value, a shadowed kit name. Nothing flags a `<p>` inside a PageHeader, a TextLink rendered as a `<button>`, a `window.confirm`, a second PageHeader inside a tab, a DialogContent without a DialogFooter, or a Dialog whose title is a noun. The one composition rule there is, `no-kit-shadow`, scans the obsolete `shapes` and `shell` folders and skips `layout`, so a locally declared `PageHeader` or `Section` passes (the companion audit ran the check).
4. **No reference implementation is named.** The guide calls the requirement record "the first application reference", and `requirements-table.tsx:523–575` is the only preview panel that implements Shell.mdx's header, but nothing says "copy this file". Every session re-derives the shape from whichever story or neighbour it opened first.
5. **Shared furniture predates the rules and wins by volume.** `record-tools.tsx` (`ModelTable`, `EntitySection`), `program-shared.tsx` (`ProgramCollection`, `ProgramRecordDialog`), `assessment-table.tsx` and `product-record-dialog.tsx` (which renders the schema inspector's `RecordEditor`) draw more than sixty of the app's ~120 list surfaces and most of its create and edit forms. Each carries its own conventions: a name cell that is a button, a preview that is an inline box or a Dialog, a PageHeader inside a tab, "Add {title.toLowerCase()}", a primary-first footer, no eye, no filtered copy of its own.

## What to do

Decisions, in the order that removes the most drift per change.

1. **Put the contract in the repo, where an agent reads first.** One page in `AGENTS.md` (below the Lovable block) or a `CLAUDE.md`: the surface table (create/edit = Dialog with a verb title and `DialogFooter` Cancel-then-primary; choose many = PickerSheet; a large comparison = RecordBrowser; a preview beside a queue = `Shell.Panel` with previous/next and open-in-new-tab; a modal detail = PreviewSheet; a confirmation = AlertDialog; never a Dialog as the record, never `window.confirm`), the register recipe (PageHeader with the title only; DataTable `fill`; the toolbar shape; `empty` with an illustration and a `filtered` state; the name is a link and the eye previews), the record recipe (Lead breadcrumb, Title is the name, one primary or an Actions menu, details in the rail, an Empty for not-found), and the three files to copy: `work-table.tsx` (register), `requirements-table.tsx:523` (preview panel), `create-task-dialog.tsx` (form dialog). Draft offered below the appendix.
2. **Make the kit show one answer.** Choose the toolbar: promote the task table's `Inline` to a `DataTable.Toolbar` part with `search`, `presets`, `filters`, `actions` slots so the kit `Toolbar` and the hand-composed row become one, or move every register onto `Toolbar`; delete the other from the stories. Add `Shell.Panel.Navigation` (previous, next, open in new tab, taking the table and the selected id) so the documented header is a part rather than fifty lines to copy, and retire the title-only panel story. Decide whether `PageHeader.Description` survives at all: the two-line rule says no on records, the sweep said no on registers.
3. **Lint the mechanical half.** Repair `no-kit-shadow`'s folder list first, then six rules: `page-header-children` (only `PageHeader.*` parts inside a PageHeader), `one-page-header` (none inside `TabsContent`, one per route), `text-link-is-a-link` (`render` must be an anchor or router Link), `no-native-confirm`, `dialog-footer` (a `DialogContent` with a form contains a `DialogFooter`, Cancel before the primary), `no-string-empty` (a `<p>` as the empty branch of a length check; a warning).
4. **Fix the four furniture files, then the residue.** `record-tools.tsx`: a `c.id` column with a real link and the eye, a preview in a Panel with navigation, Add labels from a noun map, no Section title when the tab already names the register. `program-shared.tsx`: drop the nested PageHeader; `ProgramRecordDialog`'s view mode becomes a Panel or a route. `assessment-table.tsx`: `filtered` empties and presets. `product-record-dialog.tsx`/`RecordEditor`: a `DialogFooter`, Cancel then primary, AlertDialog on discard. Then the two element Sheets become Dialogs (or the system element Dialog becomes a Sheet: one call, applied three times).
5. **Decide the record shape once.** The rail: `Shell.Aside` on every tab (system record), on the Overview tab only (program), or a Section in the first tab (requirement). Not-found: the `EmptyState` the task record uses. Title: the name, with the code in the trail.
6. **One app name and one title suffix** across the 52 child routes.

## Findings

### 1. Create and edit forms

**Surfaces.** Dialog: `CreateTaskDialog`, `CreateEvidenceDialog`, `NewConfigurationDialog`, `SystemElementDialog`, `VariantDialog` (step two of `AddProductSystem`), `BaselineDialog`, `MappingDialog`, `AllocateRequirementDialog`, `AddRequirementDetailsDialog`, `DecideEvidenceUse`, `LibraryUpdateReview`, `PrepareEvidence`, plus the generic `ProductRecordDialog` (`product-record-dialog.tsx:80`, reached through `LibraryEditor`, `EntityEditor`, `ModelForm` and `ProgramEditor` from roughly sixty buttons) and `ProgramRecordDialog` (`program-shared.tsx:135`). Sheet: the product element editor (`product-structure.tsx:490–503`), the wizard element editor (`program-wizard/elements.tsx:416–448`), the tailoring control and parameter pickers (`control-picker.tsx:97`, `parameter-picker.tsx:85`). PickerSheet: `AddFromLibrary`, `LibraryComponentPicker`, `ProductConfigurationPicker`, `AllocateToElement`. RecordBrowser: linking evidence to a requirement (`requirement-evidence.tsx:292–336`). A route page: the program wizard and the schema inspector's create form. Inline: the requirement's `Editable` fields.

**The same job on different surfaces.**

- An element of a tree: a Sheet titled "Element · {name}" with "Under {parent}." in the product library (`product-structure.tsx:484–503`) and "Component · {name}" in the wizard (`elements.tsx:424–440`); a Dialog titled "Add system" / "Add child system" / "Edit system" with "Under {code} · {name}" in the program's system tree (`system-element-dialog.tsx:195–207`). Same fields, same parent line, two surfaces.
- Allocating requirements: a 1120px Dialog with a selectable tree table from the requirement (`requirement-allocations.tsx:362–427`); a PickerSheet from the element (`system-requirements.tsx:372–394`).
- Linking evidence: the kit `RecordBrowser` from the requirement (`requirement-evidence.tsx:292`); nine "Link requirement / implementation / observation…" buttons that each open the generic Dialog from the evidence sheet (`evidence-browser.tsx:590–602`).
- Creating a record: a bespoke Dialog with typed fields for tasks and evidence; the generic schema-driven Dialog for campaigns, events, objectives, findings, risks, POA&M items, packages, organizations, profiles, components, products, requirement definitions, scopes, verifications and inventory.

**Footers.** The Forms page says "Cancel, then the primary" (`Forms.mdx:74`). Three shapes. `DialogFooter` with Cancel then the primary: `create-task-dialog.tsx:441–456`, `create-evidence-dialog.tsx:450–467`, `library-products.tsx:803–810`, `add-product-system.tsx:248–260`, `system-element-dialog.tsx:363–376`, `requirement-control-mappings.tsx:728–744`, `requirement-allocations.tsx:411–427`, `product-structure.tsx:603–623`. Buttons inside the form with the primary first and Cancel second, no `DialogFooter`: `record-browser.tsx:774–788`, which is what every `ProductRecordDialog` and `ProgramRecordDialog` shows, the most-used dialog in the app. Cancel then a default-variant confirm, no primary: `add-requirement-details-dialog.tsx:307–314`, `system-baseline.tsx:897–907`, `system-evidence.tsx:423–434`, `library-update-review.tsx:211–221`. Cancel is `subtle` in eight dialogs, `secondary` in five, and the kit's default variant in PickerSheet and RecordBrowser.

**Discard prompts.** 28 `window.confirm` calls in 14 files (`create-task-dialog.tsx:168,177,186`, `create-evidence-dialog.tsx:155,164,173`, `system-element-dialog.tsx:98,106`, `requirement-control-mappings.tsx:416,424`, `requirement-allocations.tsx:266,281`, `add-requirement-details-dialog.tsx:93,103`, `system-baseline.tsx:611,619`, `requirement-form.tsx:102`, `record-browser.tsx:577,588`, `program-wizard.tsx:90`, `program-wizard/elements.tsx:177,186`, `program-wizard/catalog.tsx:66,103`, `control-picker.tsx:73,79,88`, `parameter-picker.tsx:63`). The kit's `AlertDialog` is used twice: the wizard's "Create {name}?" (`program-wizard.tsx:435–468`) and the product element's "Remove {name}?" (`product-structure.tsx:340–367`). `docs/next.md` lists only the wizard's prompt as open. The product element Sheet has no guard at all: closing it drops the draft (`product-structure.tsx:490–495`), while the system element Dialog asks first (`system-element-dialog.tsx:96–108`), so the choice of surface also decides whether work survives a stray Escape.

**Titles.** Dialog titles are verbs almost everywhere ("Create task", "Map control", "Change control baseline"); two are nouns because the Dialog is showing a record (`observations-register.tsx:76`, `ssp-assembly.tsx:456`). Sheet titles are names, as the rule says. PickerSheet titles are verbs ("Add from library", "Allocate requirements"), which the PickerSheet page prescribes.

### 2. Previews

**Ways in.** The eye (`c.id` with `preview`) on three tables: `requirements-table.tsx:320`, `program-systems-tree.tsx:164`, `requirement-evidence.tsx:136`. A `TextLink` rendered as a `<button>` on the first cell in three shared components, which is what "the name is a link" becomes on twenty-five or more registers: `record-tools.tsx:182` (every `ModelTable` and `EntitySection`), `program-shared.tsx:420` (every `ProgramCollection`), `ssp-assembly.tsx:334`. Row click only, with the name plain: catalog controls and CCIs, the assessment browser's events and objectives, the campaign tables, the system record's Controls and Library tabs, the evidence browser; vendors, packages and every other `ModelTable` reach the panel through the name button. A non-tree row with only `onRowClick` is not focusable and has no focusable child, so on Evidence (companion audit, live) and the Catalog (source) a keyboard cannot open the record at all.

**Surfaces.** `Shell.Panel` on nine sites: `routes/catalog.tsx:255`, `routes/vendors.tsx:84`, `library-controls.tsx:207` (the control inspector, also used by the profile, component and system Controls tabs and the control record), `assessment-browser.tsx:381`, `assessment-campaign.tsx:400`, `package-views.tsx:115`, `program-systems-tree.tsx:299`, `requirements-table.tsx:523`, `system-library.tsx:232`. `PreviewSheet` on one: `evidence-browser.tsx:230`. A Dialog that is the record on four: observations (`observations-register.tsx:68–80`, 820px, no footer), a linked evidence version (`requirement-evidence.tsx:358–396`, with a "Close preview" footer), the SSP control assembly (`ssp-assembly.tsx:445–464`, 90vw by 90dvh), and `ProgramRecordDialog` in view mode (`program-shared.tsx:195–245`: KeyValue rows, an "Edit record" button, linked records that replace the content with a "Back to previous record" button, because the Overlays page calls a Dialog over a Dialog a sign the first should have been a page). An inline sunken box above the table on the twenty-three nested `EntitySection` registers (`record-tools.tsx:368–386`) and the briefing's decision record (`package-views.tsx:401–416`). None, the row navigates: programs, profiles, the library indexes, findings, issues, assets, risks, POA&M, tasks.

**Panel header.** The written rule (`Shell.mdx:24`, `component-library.md` "Collection previews put previous/next controls and an Open full record in new tab link in `Shell.Panel.actions`") is implemented once: `requirements-table.tsx:528–571` (a status count, Previous, Next, an external-link button). `program-systems-tree.tsx:304–336` puts three verbs there (Add child, Edit, Add from library) and the full-record link at the bottom of the body (`system-assurance-details.tsx:262`). `system-library.tsx:238` puts "Review version N". The other six pass no `actions`; the full-record link is the first line of the body (`package-views.tsx:117`), points at the schema inspector or a related list rather than a product record (assessment browser and campaign, vendors), or is absent (catalog, library controls). `defaultWidth` is set on three (640, 620, 560) and left to the kit on six. `label` is set on three.

**Panel title.** The code on four (`catalog.tsx:255`, `library-controls.tsx:207`, `program-systems-tree.tsx:300`, `requirements-table.tsx:524`), the name on five (`vendors.tsx:84`, `assessment-browser.tsx:381`, `assessment-campaign.tsx:401`, `package-views.tsx:115`, `system-library.tsx:233`). The kit does not say: PreviewSheet puts the id beside the status and the name as the title; RecordBrowser's preview bar shows the id and the name as an h3 below; `Shell.Panel` only says "the built-in header's heading".

**The PreviewSheet.** `evidence-browser.tsx:230–256` gives `id`, `title`, `subtitle`, `openTo` and `actions`, none of `status`, `facts` or `links`; `openTo` reads "Inspect artifact" and points at the schema inspector because evidence has no record page.

**Panel bodies.** `Inspector.Group` rows (catalog, library controls, system library), a `Section "Details"` with a hand `<dl>` grid (assessment browser and campaign), a bare `Stack` of KeyValues with an "Edit" button and an "Inspect record" link (vendors, packages), the record's own tabs (requirements), a raw `<h2>` and Sections (system tree).

### 3. Register page headers

Top-level registers by header shape:

- Title only, in a `<div className="min-w-0">` or `Box`: Programs (`routes/programs.tsx:142`), Evidence (`routes/evidence.tsx:12`), Test campaigns (`routes/campaigns.tsx:14`), My work (`routes/work.tsx:25`), Risk register (`assurance-views.tsx:65`), Authorization packages (`package-views.tsx:41`).
- Title plus a hand-written `<p className="pt-050 font-body-small text-subtle">` inside the header: Catalog (`routes/catalog.tsx:100`), Profiles (`routes/profiles.index.tsx:97`), Components (`library-components.tsx:94`), Products (`library-products.tsx:107`), Requirements (`library-requirements.tsx:86`). The 2026-09-05 sweep removed string descriptions that were sentences; these five came back as raw paragraphs rather than `PageHeader.Description`, so no grep for the part finds them.
- Title plus `PageHeader.Description`: Findings & assets (`findings-views.tsx:34`), ATO briefing room (`package-views.tsx:375`), Supplier registry (`routes/vendors.tsx:25`), Design system (`routes/components.tsx:23`), the schema inspector (`record-browser.tsx:190`). On the first four the Title and the Description are direct children of the header rather than wrapped in `PageHeader.Heading`, so the description takes the actions column; at 390px the Suppliers title column measures zero and wraps one character per line (companion audit, live, with captures).
- A `Lead` category word: Portfolio ("Portfolio", `routes/index.tsx:72`), Design system ("System"), the wizard ("Programs").

**Where the primary action lives.** In `PageHeader.Actions`: Portfolio (Export, Create program), Components (Export, New component), Products (Export, New product), Requirements (New requirement definition), the POA&M register (Export). In the toolbar: Programs (Export, New program), Profiles, Evidence, Campaigns, Tasks, Risks (Export, Create risk), Packages, Vendors. So "New X" sits in the header on four registers and in the toolbar on eight, and Export moves with it.

**A second PageHeader inside a tab.** `ProgramCollection` renders its own `PageHeader` with a title and a hand `<p>` (`program-shared.tsx:479–484`) and is mounted under a page's own header, so the page has two h1s, on: the program's Schedule tab (twice: lifecycle gates, responsibilities, `program-workspace.tsx:410–444`), Findings (`:449–465`), POA&M (twice, `:662–692`), Risk (`:472–486`) and Activity (`:489–501`) tabs; the six legacy views reached from the header's "Views" menu (Configuration baseline `:713`, Authorization `:732`, Inheritance resolution `:757`, Continuous monitoring `:774`, Scanner ingestion `:794`, Residual risk `:810`); the system record's Verification, Inventory and SSP-revisions tabs (`program-record.tsx:309–341`); the component and control records (`:563–576`, `:624–653`); the campaign browser's Scopes tab (`assessment-browser.tsx:326–375`); and, as a `PageHeader.Title` inside a Dialog body, the thirteen linked registers of `ProgramRecordDialog` (`program-shared.tsx:542–765`). `RiskList` renders a `PageHeader` "Risk register" (`assurance-views.tsx:65`) and is mounted inside the Register's Risks tab under the Register's `PageHeader` "POA&M & risk register" (`assurance-views.tsx:368, 410`).

**The same collection on two furniture files.** The program's Findings, POA&M and Risk tabs draw issues, POA&M items and risks through `ProgramCollection` (row click navigates; buttons read "Record finding", "Add remediation item", "Record risk"), while `/findings` and `/register` draw the same tables through `ModelTable` and `EntitySection` (buttons read "Add operational issues", "Add poa&m items", "Create risk"). Same data, two toolbars, two empties, two vocabularies.

**A Section title over a table on a page that has a header.** My work (`Section "Tasks"`, `routes/work.tsx:30`), Workstream (`Section "Tasks"`, `routes/workstreams.$workstreamId.tsx:99`), every `EntitySection` (a `Section "Operational issues"` inside the tab named "Operational issues", `record-tools.tsx:352`), and hand `<h2 className="font-heading-small">` headings over the requirements table (`requirements-table.tsx:450`), the SSP assembly (`ssp-assembly.tsx:144`), control mappings (`requirement-control-mappings.tsx:168`) and allocations (`requirement-allocations.tsx:69`). `Toolbar.mdx` says the Section names the register; `Pages.mdx` says the PageHeader does.

**Outer wrapper.** `Stack space="space.200"` with `min-w-0` (7), with `animate-rise` (6), with neither (12), `space.300` (Portfolio), `space.400` (My work).

### 4. Record headers

The rule: a two-line header, trail then title with the actions beside it; one primary action or an Actions menu; status, ownership and editors in a labelled Details section, never the header.

- **The rule, with drift.** Program (`program-workspace.tsx:172–216`: breadcrumb, title, "Edit program" secondary plus a "Views" menu of nine legacy routes, a third navigation model beside the twelve tabs and the side nav; in a view a hand `<p>` under the title), the program's component record (title only, no actions, `program-record.tsx:534`) and control record (title "code · title", `:611–613`), system (`program-record.tsx:92–129`: breadcrumb, title, three secondary buttons and no primary), requirement (`requirement-record.tsx:421–456`: breadcrumb, the code as the title, no actions), task (`routes/tasks.$taskId.tsx:78–125`: breadcrumb, title, a `StatusBadge` under the title, "Edit task" and "Complete"), workstream (`routes/workstreams.$workstreamId.tsx:58–91`: breadcrumb, title, the `StatusBadge` inside `PageHeader.Actions`, then a hand `Box border-b` divider), campaign (`routes/campaigns.$campaignId.tsx:45–81`: breadcrumb, title, a badge and a date range under the title, no actions).
- **A back link inside the header column, plus a hand description.** Profile (`routes/profiles.$profileId.tsx:66`), component (`library-components.tsx:208–212`), product (`library-products.tsx:223–227`), requirement definition (`library-requirements.tsx:208–215`, with an `Id` and the description in one `<p>`), the export page (`programs.$programId_.export.tsx:49`). Two buttons, a secondary "Edit details" and a primary "New version", which does follow the one-primary rule; the version `Select`, the state `Badge` and "Publish version" follow in the body.
- **A back link above the header and the status badge in the description slot.** Finding (`findings-views.tsx:124–133`), issue (`:277–286`), asset (`:373–378`), risk (`assurance-views.tsx:147–156`), POA&M item (`:466–475`), POA&M document (`:604–610`, no actions at all), package (`package-views.tsx:157–162`). `PageHeader.Actions` holds a default-variant Edit button and an "Inspect backend record" `TextLink`.

**The rail.** `Shell.Aside` on every tab: system (`program-record.tsx:138`), task, workstream, profile, component, product, requirement definition. On the Overview tab only: program (`program-workspace.tsx:509`). None: requirement (details in a `Section "Requirement details"` inside the Statement tab), campaign (`Section "Campaign"`). A 320px grid column of Sections: finding (`findings-views.tsx:149–208`), risk (`assurance-views.tsx:180–223`).

**Not found.** `EmptyState` with the search illustration: campaign, task, workstream. `<p role="alert">`: requirement, system, component, control. A bare `<p>`: the seven assessment records. The title string "X not found" with the rest of the page still drawn: profile, component, product, requirement definition.

### 5. Table toolbars

Josef's rule (2026-09-07): every DataTable register takes the task table's toolbar, an `Inline` of `DataTable.Search`, `DataTable.Presets` (menu), `DataTable.Filter`s, then `ml-auto` with `DataTable.Columns`, `DataTable.Settings` and a small primary Add (`work-table.tsx:133–174`).

- **That shape**: `work-table.tsx`, `routes/programs.tsx`, `routes/profiles.index.tsx`, `routes/catalog.tsx` (both tables), `library-controls.tsx`, `library-components.tsx`, `library-products.tsx`, `library-requirements.tsx`, `evidence-browser.tsx`, `program-shared.tsx`, `record-tools.tsx`, `assessment-table.tsx`, `requirement-evidence.tsx`, `ssp-assembly.tsx`.
- **The kit `Toolbar`**: `requirements-table.tsx:473`, `product-structure.tsx:294`, `program-systems-tree.tsx:287`, `program-library.tsx`, `system-library.tsx:212`, `system-evidence.tsx`, `system-requirements.tsx:259`, `system-baseline.tsx:499`, `requirement-allocations.tsx:380` (search only), `profile-tailoring/editor.tsx:279`.
- **Neither**: the schema inspector's list (a kit `Input`, a count and two buttons, `record-browser.tsx:209–233`), the baseline dialog's table (`system-baseline.tsx:786–813`).

**Parts.** `Settings` is missing on the three library indexes, requirement evidence and the SSP assembly. `Presets` appear on nine sites. Requirement evidence has Search and Columns only. Placeholders vary between "Find X" and "Search X" (`Toolbar.mdx`: "The placeholder names what is searched"). The kit's `DataTable.stories.tsx` shows both shapes (218–227 and 289–296), so either is "what the kit does".

**`fill`.** On the top-level registers and the program's System, Library, Requirements, Assessments and Evidence tabs (the last two set it inside `AssessmentBrowser` and `EvidenceBrowser`). Not on the program's Findings tab (`program-workspace.tsx:466`, the observations register) or Schedule tab (`:409`, the task table), nor on the system record's Controls, Requirements, Library and Evidence tabs, though each is the tab's one block.

**Column kinds.** Work and Evidence format dates into strings and declare them `c.text` (`work-table.tsx:72, 86`; `evidence-browser.tsx:76, 90`), so Due and Collected sort alphabetically; Programs declares `c.date` (`routes/programs.tsx:67`). Same chrome, different behaviour.

**Empties on tables.** `DataTable.empty` on 29 of the 30 sites (the allocation picker takes the defaults); no site passes `filtered`, and the kit's default covers it (the search picture, "Nothing matches", Clear filters). Every site but Programs names an illustration; Programs takes the `records` default (`routes/programs.tsx:155–164`). `EntitySection` builds its Add label as `Add {title.toLowerCase()}` (`record-tools.tsx:348`), which yields "Add poa&m items", "Add findings", "Add operational issues".

### 6. What a row click does

`DataTable.mdx`: `onRowClick` "opens the record, never selects". In the app a row click navigates (programs, profiles, the library indexes, the findings tabs, risks, POA&M, tasks), opens a panel (catalog, vendors, packages, campaign events and objectives, the system record's tabs), opens a Sheet that is the edit form (`product-structure.tsx:284`), opens a Dialog (observations, SSP, every `ProgramCollection`), sets a filter and switches to another tab (the Campaigns tab, `assessment-browser.tsx:224–227`), opens the edit dialog directly (activity and procedure steps, `assessment-campaign.tsx:559–563, 627–632`), or does nothing (the requirements table, whose code cell links and whose eye previews; system requirements and evidence).

### 7. Empties off the table

Against "a proper Empty everywhere, never a grey string" (2026-09-05), a plain `<p className="text-subtle">` stands in on: Portfolio's programs and activity (`routes/index.tsx:211, 238`), catalog sources (`routes/catalog.tsx:314`), a profile's imports, resolutions and rules (`routes/profiles.$profileId.tsx:296, 317, 420`), a component's structure, programs, requirements and evidence tabs (`library-components.tsx:500, 576, 683, 710`), a product's variants (`library-products.tsx:499`), a requirement definition's adopters (`library-requirements.tsx:366`), control mappings (`requirement-control-mappings.tsx:311`), allocations (`requirement-allocations.tsx:171`), edit history (`requirement-record.tsx:257`), the SSP dialog's tables (`ssp-assembly.tsx:633, 687`), the briefing's package list (`package-views.tsx:441`), evidence reviews (`evidence-version-details.tsx:105`), "Nothing inside this element" (`system-assurance-details.tsx:257`). Three Empty idioms sit beside them: the `EmptyState` wrapper in `work-common.tsx:35`, the kit `Empty` composed by hand (schema inspector, product structure, tailoring editor), and `DataTable.empty`.

### 8. Titles

Browser titles: 18 of the 52 child routes set one; 7 end "— Equinox" (work, the portfolio, evidence, campaigns, tasks, workstreams) and 11 "— Program Assurance" (catalog, profiles, the three libraries, programs, the wizard); 34 set none: the 16 program sub-routes inherit "Programs — Program Assurance" from their parent route, and 18 (findings, register, packages, briefing, vendors, schema, the design-system page and the schema records) inherit the root's "Program Assurance". The shell's logo reads "Equinox" (`components/app/shell.tsx:135`).

### 9. Loading and errors

Three idioms: `QueryState` from `work-common.tsx:79–99` (a `<p role="status">Loading records…</p>` and a Retry button), `LibraryLoading` from `library-shared.tsx:54–75` (replaces the whole table with a paragraph), and the DataTable's own `state="loading"` (`product-structure.tsx:282`, `routes/programs.tsx:150`, `requirements-table.tsx:464`). `PageSkeleton` has no consumer.

### 10. The furniture

Four files carry most of the drift because most screens flow through them.

| File | What it draws | Its conventions |
| --- | --- | --- |
| `record-tools.tsx` (`ModelTable`, `EntitySection`, `EntityEditor`) | 40+ registers on the findings, register, packages, vendors and observation screens and every nested list on their records | name cell as a `<button>` (182); preview as an inline box above the table (368–386); `Section` title plus `<p>` above every table (352); "Add {lowercase}" (348); toolbar in the task shape but no presets; the generic Dialog for every form |
| `program-shared.tsx` (`ProgramCollection`, `ProgramRecordDialog`) | the program's Schedule, Findings, POA&M, Risk and Activity tabs, its six legacy views, the system record's Verification, Inventory and SSP tabs, the component and control records, the campaign browser's Scopes tab, and thirteen linked registers inside its own dialog: about thirty mounts | a `PageHeader` inside a tab or a dialog body (479–484); name cell as a `<button>` (420); a Dialog that is the record, with its own back-stack (195–245); "Record X" / "Add X" labels per table |
| `assessment-table.tsx` | 16 tables on the campaign screens | Search, Columns, Settings only; default empties with no description or action; no `fill` inside Sections |
| `product-record-dialog.tsx` → `record-browser.tsx` `RecordEditor` | the create and edit form for every schema-driven record | no `DialogFooter`; primary first, Cancel second (774–788); `window.confirm` on discard (577, 588); title "Create {noun}" from a database noun map, so Suppliers' "Add organization" opens "Create party" with a "Create party" button (`routes/vendors.tsx:30`, `lib/product-records.ts:16`) |

## Appendix A: the registers

Key: header = the page header over the table (T title only, T+p title with a hand paragraph, T+D title with `PageHeader.Description`, S a Section title, h2 a hand heading, — none of its own); toolbar = I the task-table `Inline`, K the kit `Toolbar`, — none; open = what a row or its name does; preview = the surface.

| Screen | Route or tab | Header | Toolbar | `fill` | Open | Preview surface | Preview header actions | Create |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| My work · Tasks | `/work` | T + S "Tasks" | I | no | row → task | — | — | toolbar + empty → Dialog |
| Programs | `/programs` | T | I | yes | row → program | — | — | toolbar + empty → wizard page |
| Portfolio · Risk posture, Programs | `/` | Lead + T + Actions | — (hand `Table`) | n/a | title link | — | — | header → wizard page |
| Test campaigns · Campaigns | `/campaigns` | T, then Tabs | I | yes | row sets filter + switches tab | — | — | toolbar + empty → generic Dialog |
| Test campaigns · Events, Objectives | `/campaigns` | T, Tabs | I | yes | row → panel | `Shell.Panel` (title = name) | none | toolbar + empty → generic Dialog |
| Assessment scopes | program Assessments tab | second `PageHeader` in the tab | I | yes | name button → Dialog | `ProgramRecordDialog` | back-stack | toolbar + empty → same Dialog |
| Campaign · 13 section tables | `/campaigns/$id` | S per section | I (Search, Columns, Settings) | no | row → panel or edit dialog | `Shell.Panel` (title = name) | none | Section action → generic Dialog |
| Task · Assignments | `/tasks/$id` | S | — (hand `Table`) | n/a | row Edit button | — | — | Section action → generic Dialog |
| Workstream · Tasks | `/workstreams/$id` | S | I | yes | row → task | — | — | toolbar + empty → Dialog |
| Evidence | `/evidence`, program Evidence tab | T | I | yes (route only) | row → sheet | `PreviewSheet` | Edit artifact | toolbar + empty → Dialog |
| Findings · Operational issues, Findings, Assets | `/findings` | T+D, Tabs, S | I | yes | row → record | — | — | toolbar + empty → generic Dialog |
| Findings · Observations | `/findings`, program Findings tab | S + `<p>` | I | yes (route only) | name button → Dialog | Dialog (820px) | none | none |
| Register · POA&M, Documents | `/register` | T + Actions (Export), Tabs, S | I | yes | row → record | — | — | toolbar + empty → generic Dialog |
| Register · Risks | `/register`, `/risks` | second `PageHeader` in the tab | I | yes | row → record | — | — | toolbar + empty → generic Dialog |
| Register · Unrolled findings | `/register` | — | I | yes | row → record | — | — | none |
| Packages | `/packages` | T | I | yes | name button → panel | `Shell.Panel` (title = name) | none; "Open package" link in body | toolbar + empty → generic Dialog |
| Briefing · Authorization decisions | `/briefing` | T+D, S + `<p>` | I | no | row → inline Section | inline | — | none |
| Catalog · Controls, CCIs | `/catalog` | T+p, Tabs | I | yes | row → panel | `Shell.Panel` (title = code) | none | none |
| Profiles | `/profiles` | T+p | I | yes | row → profile | — | — | toolbar + empty → generic Dialog |
| Profile · Controls | `/profiles/$id` | Select + table | I | yes | row → panel | `Shell.Panel` (title = code) | none | none |
| Profile · Source imports, rules | `/profiles/$id` | h2 + button | — (hand `Table`) | n/a | — | — | — | h2 button → generic Dialog |
| Components | `/library/components` | T+p + Actions (Export, New) | I (no Settings) | yes | row → component | — | — | header → generic Dialog |
| Component · Controls | `/library/components/$key` | button row above table | I (no Columns menu right) | no | row → edit Dialog or panel | `Shell.Panel` (title = code) | none | button → generic Dialog |
| Component · Structure, Versions, Programs | `/library/components/$key` | h2 + button | — (hand `Table`) | n/a | row buttons | — | — | h2 button → generic Dialog |
| Products | `/library/products` | T+p + Actions (Export, New) | I (no Settings) | yes | row → product | — | — | header → generic Dialog |
| Product · Structure | `/library/products/$key` | — | K | no | row → edit Sheet | Sheet (edit form) | — | toolbar + empty → Sheet; row menu → PickerSheet then Sheet |
| Product · Configurations | `/library/products/$key` | — | I (no Settings) | no | row menu | — | — | toolbar + empty → Dialog |
| Requirements (library) | `/library/requirements` | T+p + Actions (New) | I (no Settings) | yes | row → definition | — | — | header → generic Dialog |
| Supplier registry | `/vendors` | T+D | I | yes | name button → panel | `Shell.Panel` (title = name) | none | toolbar + empty → generic Dialog |
| Schema inspector · collection | `/records/$collection` | T+D + Actions | — (kit `Input`, count, buttons) | n/a | first cell link | — | — | header + empty → route page |
| Program · System | program System tab | — | K | yes | row → panel; name → record | `Shell.Panel` (title = code) | Add child, Edit, Add from library; "Open record" in body | toolbar + empty → Dialog; "From a product…" → PickerSheet then Dialog |
| Program · Requirements | program Requirements tab | h2 + `<p>` | K | yes | code → record; eye → panel | `Shell.Panel` (title = code) | count, Previous, Next, open in new tab | toolbar + empty → generic Dialog |
| Program · Library | program Library tab | — | K | yes | row → definition | — | — | none |
| Program · Overview | `/programs/$id` | S "Lifecycle timeline", S "System boundaries", S "Program work" | I (tasks) | no | link / row → task | — | — | Section actions; string empties |
| Program · Schedule, Findings, POA&M, Risk, Activity | program tabs | second `PageHeader` in the tab (×7) | I | some | name button → Dialog; Findings and Risk rows navigate | `ProgramRecordDialog` | back-stack | toolbar + empty → same Dialog |
| Program · six legacy views | Views menu (`/baseline`, `/authorization`, `/inheritance`, `/conmon`, `/ingestion`, `/risk`) | second `PageHeader` in the view | I | yes | name button → Dialog | `ProgramRecordDialog` | back-stack | toolbar + empty → same Dialog |
| Program component, control records | `/components/$id`, `/controls/$id` | second `PageHeader` under the record header | I | no | name button → Dialog | `ProgramRecordDialog` | back-stack | toolbar + empty → same Dialog |
| Program · Controls (SSP) | program Controls tab | h2 + `<p>` + Select | I (no Settings) | no | code button → Dialog | Dialog (90vw) | "Back to control" | Section → generic Dialog |
| System record · Controls | `/programs/$id/systems/$scope` | hand baseline strip | K | no | row → panel | `Shell.Panel` (title = code) | none | toolbar + empty → Dialog; row menu → PickerSheet |
| System record · Requirements | same | — | K | no | code → requirement | — | — | toolbar → PickerSheet ×2 |
| System record · Library | same | — | K | no | row → panel | `Shell.Panel` (title = name) | "Review version N" | toolbar + empty → PickerSheet |
| System record · Evidence | same | — | K | no | — | — | — | row menu → Dialog |
| System record · Verification, Inventory, SSP revisions | same | second `PageHeader` in the tab | I | no | name button → Dialog | `ProgramRecordDialog` | back-stack | toolbar + empty → same Dialog |
| Requirement record · Control mappings, Allocation | `/programs/$id/requirements/$req` | h2 + button + `<p>` | — (hand `Table`) | n/a | row Edit button | — | — | h2 button → Dialog |
| Requirement record · Evidence | same | `<p>` + button | I (Search, Columns) | no | eye or row → Dialog | Dialog (800px) | "Close preview" | button → RecordBrowser or Dialog |

## Appendix B: the records

| Record | Trail | Title | Under the title | Actions | Rail | Not found |
| --- | --- | --- | --- | --- | --- | --- |
| Program | breadcrumb | name (or the view's name) | hand `<p>` in a view | Edit program (secondary), Views menu | `Shell.Aside`, Overview only | PageHeader "Program not found" + link |
| System element | breadcrumb | name | — | Add from library, Add child, Edit record (three secondaries) | `Shell.Aside`, every tab | `<p role="alert">` |
| Requirement | breadcrumb | the code | — | none | none; Section in the Statement tab | `<p role="alert">` |
| Program component | breadcrumb | name | — | none | `Shell.Aside`, generic facts | `<p role="alert">` |
| Program control | breadcrumb | code · title | — | Edit record (draft only) | `Shell.Aside`, generic facts | `<p role="alert">` |
| Program transfer (export) | link above the title, not in Lead | "Program transfer" | — | Export (primary) | none | — |
| Task | breadcrumb | title | `StatusBadge` | Edit task, Complete/Reopen | `Shell.Aside` | `EmptyState` |
| Workstream | breadcrumb | title | — (badge in Actions) | badge, Edit workstream | `Shell.Aside` | `EmptyState` |
| Campaign | breadcrumb | title | badge + date range | none | none; Section "Campaign" | `EmptyState` |
| Profile | back link in header | title | — | New revision (primary) | `Shell.Aside` | title string |
| Component, Product, Requirement definition | back link in header | name | hand `<p>` description | Edit details, New version | `Shell.Aside` | title string |
| Finding, Issue, Risk, POA&M item | back link above header | title | `StateBadge` in `Description` | Edit (default), Inspect link | none or a 320px Section column | bare `<p>` |
| Asset, Package | back link above header | name/title | — | Edit, Inspect link | none | bare `<p>` |
| POA&M document | back link above header | title | — | none | none | bare `<p>` |
| Schema record | back link above header | title | code · revision in `Description` | Delete, Edit record | none | `<h1>` |

## Appendix C: a draft of the in-repo contract

For `AGENTS.md`, below the Lovable block, or a `CLAUDE.md`. Forty lines; the reasoning stays in the guides it points at.

```
## Screens are composed from @ledger/design-system; these are the shapes

Registers: PageHeader (Title only; no description, no hand paragraphs) then DataTable `fill`.
  Toolbar = DataTable.Search, DataTable.Presets (menu), DataTable.Filters, then ml-auto
  DataTable.Columns, DataTable.Settings, one small primary "New/Add <noun>". Copy work-table.tsx.
  `empty` names an illustration, a title, a line and the same primary; give `filtered` too.
  The name cell is a router Link to the record. The eye (c.id preview) opens the preview.
  A row click opens the record or the preview, never selects, never edits.
Previews beside a queue: Shell.Panel, title = the record's name, `actions` = previous, next,
  open in new tab (copy requirements-table.tsx:523). Body = the record's own content.
  A modal detail: PreviewSheet. Never a Dialog as the record.
Records: PageHeader.Lead = Breadcrumb, Title = the name, one primary action or an Actions
  menu. No badge, id, description or editor in the header; those go in Shell.Aside
  (Inspector.Group "Details"). Not found = the Empty from routes/tasks.$taskId.tsx.
Forms: a Dialog titled with the verb ("Create task"), a DialogFooter with Cancel (subtle)
  then the primary. Copy create-task-dialog.tsx. Discard = AlertDialog, never window.confirm.
  Choose many = PickerSheet. Compare and link many = RecordBrowser. A Sheet is for a
  record's detail or a picker, never a create/edit form.
Empties: kit Empty everywhere; never a <p className="text-subtle"> in place of one.
Headings: one PageHeader per route; never inside a tab. A Section names a region on a
  record; it does not sit over the only table on a register.
Titles: every route sets head.title "<Screen> — Program Assurance".
```
