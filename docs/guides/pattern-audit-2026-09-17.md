# Pattern consistency audit, 17 September 2026

Audited against [the product pattern contract](product-patterns.md). This merges two independent same-day passes over the same source (no product file changed after 12:43): Claude's, which read every file under `src/routes`, `src/components/app` and `src/components/prototype` and drove every global register, its preview, its create form and fifteen record pages in the running app at 1440px; and Codex's, which added a 390px and touch pass, kit-level reproductions and four lint probes, with captures under [artifacts/design-audit-2026-09-17](../../artifacts/design-audit-2026-09-17/). Both reached the same five headline findings. Line numbers are as of this audit.

## Summary

The kit is fine. The application drifts because almost nothing in the contract is checked by a tool, and the shared adapters that were supposed to carry the contract each carry a slightly different version of it.

- `npm run lint` exits 0 (24 warnings over `src`, 44 over the whole repo), all `ledger/use-primitives` (layout classes on a native `form`, `fieldset`, `span` or `div`). The five composition rules the contract names (`no-native-confirm`, `text-link-navigation`, `dialog-footer-order`, `product-responsive-table`, `product-line-tabs`) all pass. None of the drift listed below is visible to lint, because lint cannot see whether a register has an eye, whether a tab repeats its heading, whether a preview feeds `useDisplayedRecords`, or whether an h1 names the record.
- The three things that were fixed yesterday held: no native `confirm`, every create form opened from a global register is a `Dialog` titled with the same words as its trigger and primary, Cancel sits before the primary, the first field takes focus, and `responsive` is set on all 34 `DataTable`s.
- Everything else varies by adapter. Six different shared wrappers render tables (`ModelTable`/`EntitySection`, `ProgramCollection`, `AssessmentTable`, `WorkTable`, the library tables, `RecordBrowser`), and they disagree on whether there is an eye, a saved-views menu, a heading above the table, a `Section` frame, an Export button, and where loading and errors go.

## The six complaints, with evidence

### 1. "Dialogs on some create forms, sheets on others"

Confirmed in the source, but narrower than it feels. Every create action reachable from a global register opens a `Dialog` (checked live: task, risk, profile, component, product, evidence artifact, assessment campaign, operational issue, remediation item, organization, authorization package, requirement). The remaining `Sheet`s are:

| Surface | File | Status |
|---|---|---|
| Wizard element editor | `src/components/app/program-wizard/elements.tsx:432` | allowed by the contract |
| Control tailoring (decision + rationale) | `src/components/app/profile-tailoring/control-picker.tsx:93` | raw `Sheet` with `WorkPane`, not a `PickerSheet`; records a decision. It edits the wizard's draft profile and is read-only on a saved profile, so it is arguably the wizard exception, but the contract's closed list names only the element Sheet. Decide and write it down. |
| Parameter override | `src/components/app/profile-tailoring/parameter-picker.tsx:74` | same |
| Allocate requirements | `src/components/prototype/system-requirements.tsx:373` | `PickerSheet` that also collects a rationale and writes rows in a loop, no dirty or pending guard |
| Add from library | `src/components/prototype/add-from-library.tsx:450` | `PickerSheet` with a second confirm frame that collects specs, no dirty guard |

What actually varies more than the surface is the words. The generic dialog's edit path is titled `Edit {noun}` but its primary says `Save {noun}` (`src/components/app/record-browser.tsx:790`). Triggers use domain synonyms the dialog does not repeat: Edit determination, Edit commitment, Edit plan, Edit run, Edit artifact, Record review, Assign person, Map control, Change baseline → Change control baseline → Save baseline. Two dialogs have no `<form>` at all and submit from `onClick` (`src/components/prototype/add-product-system.tsx:256`, `src/components/prototype/library-products.tsx:967`). One create dialog has no dirty guard and no disabled fieldset while saving (`add-product-system.tsx:171`); reproduced live by typing a name, pressing Cancel and getting no confirmation ([capture](../../artifacts/design-audit-2026-09-17/variant-form-desktop.png)). That dialog and Create configuration also have no scrolling field region, so their fields run flush against the dialog edges at 390px while the kit's `DialogContent` clips overflow (`packages/design-system/src/components/dialog.tsx:62`, [phone capture](../../artifacts/design-audit-2026-09-17/variant-form-mobile.png)). Seven dialogs do not focus their first field (`add-requirement-details-dialog.tsx:203`, `requirement-control-mappings.tsx:526`, `requirement-allocations.tsx:377`, `system-baseline.tsx:722`, `system-evidence.tsx:428`, `library-update-review.tsx:243`, `requirement-evidence.tsx:493`), and the inspector's own create page never does because `autoFocus` is gated on `formLayout === "dialog"` (`record-browser.tsx:754`).

Two destructive decisions render their own `AlertDialog` instead of `useConfirmation` (`record-browser.tsx:985`, `product-structure.tsx:343`).

### 2. "Sometimes the DataTable pattern is consistent, sometimes not"

Live census of the thirteen global registers:

| Register | Eye | Preview surface | Saved views | Create in toolbar | Second action in toolbar | Heading repeated inside tab |
|---|---|---|---|---|---|---|
| My work | no | none | yes | Create task | no | h2 Tasks under h1 My work |
| Programs | no | none | yes | none (Create program lives on Portfolio) | Export | no |
| Test campaigns | no | none | no | Create assessment campaign | no | no |
| Evidence | yes | modal PreviewSheet | yes | Create evidence artifact | no | no |
| Findings & assets | yes | Shell.Panel | no | Create operational issue | no | h2 Operational issues |
| POA&M & risk | yes | Shell.Panel | no | Create remediation item | Export in page header | h2 POA&M items |
| Packages | (empty) | Shell.Panel | no | Create authorization package | no | no |
| Catalog | yes | Shell.Panel | no (catalog select instead) | none | no | no |
| Profiles | no | none | yes | Create profile | no | no |
| Components | no | none | no | Create component | Export | no |
| Products | no | none | no | Create product | Export | no |
| Requirements | (empty) | none | no | Create requirement | no | no |
| Suppliers | yes | Shell.Panel | no | Create organization | no | no |
| Risk register | no | none | no | Create risk | Export | no |

Source-level detail behind the table:

- Toolbar rebuilt or extended with raw nodes: `Inline` inside `actions` (`library-components.tsx:168`, `library-products.tsx:179`, `program-systems-tree.tsx:274`, `system-requirements.tsx:206`, `product-structure.tsx:245`); saved views mounted as permanent children instead of `views` (`program-library.tsx:198`, `system-baseline.tsx:486`, `system-evidence.tsx:333`, `profile-tailoring/editor.tsx:285`); a record count in `filters` (`catalog.tsx:276`); a raw `<label>` plus `Checkbox` as a filter (`system-library.tsx:243`, `system-evidence.tsx:334`, `system-requirements.tsx:266`); the schema register toolbar built entirely from `Inline` (`record-browser.tsx:230`).
- Create action in the page header, not the toolbar: Portfolio (`routes/index.tsx:84`, two actions), POA&M register export (`assurance-views.tsx:409`), schema register (`record-browser.tsx:213`); create as a `Section` action above the table: Campaign Runs (`assessment-campaign.tsx:473`), Component Controls (`library-components.tsx:624`).
- Create actions that never render: `ProgramCollection` discards any `createLabel` that does not start with Link, Pin, Set, Adopt, Assign, Connect or Attach (`program-shared.tsx:497`). Twenty-seven labels such as "Record risk", "Schedule assessment", "Add gate" are dead code; the live button always says `Create {noun}`. Consistency here is accidental, and `poam_item_revisions` has no noun entry, so its buttons read "Create poa&m item revision" and "Edit poa&m item revision" (`src/lib/product-records.ts`).
- Primary name not a link, so the row click is the only opener: `program-library.tsx:119`, `system-baseline.tsx:357`, `product-structure.tsx:158`, `profile-tailoring/editor.tsx:273`. No opener at all: `system-evidence.tsx:249`. Name links to the schema inspector while a second column carries the real destination: `assessment-browser.tsx:212-228`.
- `RecordLink` bypassed with `TextLink` + `Link` in 15 places (`work-table.tsx:88`, `programs.tsx:43`, `program-systems-tree.tsx:134`, `system-library.tsx:135`, `system-requirements.tsx:147`, `requirements-table.tsx:324`, `library-components.tsx:505`, `ssp-assembly.tsx:653`, `index.tsx:152`, `record-browser.tsx:323` and others).
- `priority: 0` missing from the primary name column on 22 tables; the reference requirements table puts it on the statement column (`requirements-table.tsx:339`) and gives the code column 152px. Without an explicit priority the renderer treats the first non-action column in current order as the identity (`packages/design-system/src/patterns/data-table/responsive.ts:13-16`), so `responsive` alone does not keep the name visible: running the real `fitColumns` on the task columns reordered State → Title → Assignees at 342px keeps State and Assignees and moves Title and its link into More fields; the library control columns at 240px keep Code only.
- Kit `Table` used for 18 collections outside the two named exceptions, including embedded record collections the contract says are `DataTable` (`requirement-allocations.tsx:100`, `requirement-control-mappings.tsx:201`, `tasks.$taskId.tsx:169`, `evidence-browser.tsx:632`, `ssp-assembly.tsx:641`, `profile-tailoring/editor.tsx:315`). Four of them are wrapped in `overflow-x-auto`, which the contract forbids as a responsive fix.
- `fill` missing on eleven tables that are the region's only block (`library-components.tsx:635`, `library-products.tsx:782`, `library-requirements.tsx:416`, `product-structure.tsx:282`, `ssp-assembly.tsx:422`, `system-baseline.tsx:466`, `system-evidence.tsx:316`, `system-library.tsx:222`, `system-requirements.tsx:245`, `profile-tailoring/editor.tsx:270`, `requirement-evidence.tsx:223`).
- Loading and errors: thirteen tables use the `DataTable` `state`/`error` props instead of `QueryState`, and the kit only renders rows in the ready state and swaps the whole table for an alert on error with no Retry (`packages/design-system/src/patterns/data-table/data-table.tsx:1089,1164`), so a failed background refresh empties those registers while Suppliers, on `QueryState`, keeps its cached rows. The browser suite proves recovery for Suppliers only (`scripts/test-pattern-consistency.mjs:308`); three thin re-wrappers of `QueryState` exist under different names (`record-tools.tsx:34`, `library-shared.tsx:55`, `program-shared.tsx:94`); two screens hand-roll `<p role="status">` and `<p role="alert">` (`requirement-allocations.tsx:88`, `requirement-control-mappings.tsx:187`); `QueryState` itself renders loading as a grey paragraph (`work-common.tsx:81`).
- Empties: no illustration (`ssp-assembly.tsx:426`), no `empty` prop at all (`requirement-allocations.tsx:387`), bare `<p>` strings (`index.tsx:225`, `catalog.tsx:358`), the same generic sentence for every `EntitySection` (`record-tools.tsx:416`), nine empty collections with no create action while the screen has one elsewhere, and a loaded task record rendering "Task not found" for its empty Assignments, Comments and Activity sections (`tasks.$taskId.tsx:207,250,270`), which also puts four h1s on the page. This is the file the contract names as the record reference.

### 3. "Sometimes a page header with a description, sometimes not"

In the global registers this is now clean: no register renders a sentence under its h1 (only `/components`, the design-system preview page, keeps `PageHeader.Description`). The inconsistency you see is the heading *inside* the tab:

- Findings & assets and POA&M & risk wrap every tab's single table in an `EntitySection`, so the tab "Operational issues" gets an h2 "Operational issues" and the tab "Assessment findings" gets an h2 "Findings" (`findings-views.tsx:57-106`, `assurance-views.tsx:427-481`). Test campaigns and Catalog do not.
- On the program record the Findings tab shows h2 "Findings and operational issues" plus a second section "Observations"; the Risk tab shows h2 "Risk register"; the System tab shows nothing. `ProgramCollection` always renders its own `Heading` (`program-shared.tsx:507`), never a `Section`, so program bodies mix two heading styles.
- Library record tabs wrap their only table in `Section` (`library-components.tsx:667,724`, `library-products.tsx:561`, `library-requirements.tsx:415`); the Profile Derivation tab hand-builds an `h2` inside an `Inline` (`profiles.$profileId.tsx:270`).
- Six registers wrap `PageHeader.Title` in a bare `div` or `Box` instead of `PageHeader.Heading` (`work.tsx:36`, `evidence.tsx:13`, `campaigns.tsx:15`, `catalog.tsx:107`, `index.tsx:81`, `program-wizard.tsx:253`).
- Second action rows under the record header, which the contract forbids: state badge plus Publish version on component, product and requirement definition records (`library-components.tsx:564`, `library-products.tsx:486`, `library-requirements.tsx:376`); a version `LibrarySelect` row between header and body on profiles and POA&M commitments (`profiles.$profileId.tsx:115`, `assurance-views.tsx:568`).

### 4. "Sometimes the preview eye exists, sometimes not"

Five of thirteen global registers have an eye. The ones without are the primary registers for their record type: Programs, Tasks, Risks, Campaigns, Profiles, Components, Products, Requirements. In total 22 product `DataTable`s have no preview surface. Three tables open a preview from a row click with no eye and no active-row marker (`system-baseline.tsx:471`, `profile-tailoring/editor.tsx:273`, `library-components.tsx:402` via a row menu item "Read control"); on the system Controls tab the row is a plain `tr` with no keyboard target that opens anything ([capture](../../artifacts/design-audit-2026-09-17/system-controls-desktop.png)). Where the eye does exist it is invisible on touch: the kit keeps it at opacity 0 until hover, focus or active selection (`packages/design-system/src/patterns/data-table/data-table.tsx:544-547`, `packages/design-system/src/components/table.tsx:465-469`), and in a 390px `(hover: none)` context the Supplier eye's container computed to opacity 0 while the visible chevron was More fields, a different action ([capture](../../artifacts/design-audit-2026-09-17/supplier-touch-hidden-eye.png)). Three pickers set `active` without `preview`, which borrows the eye's highlight for selection (`add-from-library.tsx:279`, `library-component-picker.tsx:39`, `product-configuration-picker.tsx:37`).

### 5. "Sometimes the panel, sometimes a preview sheet"

Every register preview is the `Shell.Panel` through `RecordPreviewPanel`, except Evidence, whose eye opens the modal `PreviewSheet` (`evidence-browser.tsx:284`). The contract reserves the modal for the version review, but here it is the artifact register's collection preview, and it carries ten Link buttons, a Create evidence version section action and a Record review action, which makes it a full record workflow inside a modal. Its Close button says "Close" while every panel says "Close details". Its full-record link, like Catalog's and Suppliers', lands on the schema inspector because evidence artifacts, controls and parties have no product record page.

The two profile-tailoring sheets are the other exception in feel: the row click on "Effective control set" opens an editing `Sheet`, so a read-only look at a control is only reachable through an edit surface.

### 6. "Sometimes the header controls with next/previous and full record, sometimes not"

All eighteen panel previews render `RecordPreviewActions`, so the outer header is consistent when it opens. What varies is whether the control works and what sits below it:

- Dead navigation: `ProgramRecordDialog` opened from the timeline and the workspace without `records`/`onSelect` falls back to a one-row list, so the panel shows "1 of 1" with both arrows disabled (`program-workspace.tsx:629`, `program-timeline.tsx:194`, fallback at `program-shared.tsx:246`); the control inspector opened from a program control record does the same (`program-record.tsx:708`, fallback at `library-controls.tsx:252`).
- The reference file for `useDisplayedRecords` does not use it; `requirements-table.tsx:418` re-implements it inline. The nested evidence preview in SSP assembly feeds a hand-built list (`ssp-assembly.tsx:500`). The library-components control preview follows the order of a different table (`library-components.tsx:426`).
- Inner header: eleven previews pass no `recordActions`, so a viewer sees "Edit record" on Findings and POA&M, "Edit organization" on Suppliers, "Edit artifact" on Evidence, "Edit system" on the tree and nothing on Catalog, requirements, CCIs, packages, observations, SSP controls and evidence. One inner title is a type label, not the record's name (`package-views.tsx:484`).
- Body action rows and bottom links the contract forbids: `Section` action "Edit control implementation" (`ssp-assembly.tsx:521`), "Open the library definition" repeated at the bottom (`system-library.tsx:348,360,373`), "Review supplied component definitions" (`vendors.tsx:114`), "Create evidence version" section action inside the modal (`evidence-browser.tsx:335`), a loose row of "Record observation" buttons (`assessment-campaign.tsx:1090`), an inline `EntityEditor` in the POA&M revision preview (`assurance-views.tsx:748`).

### 7. "Sometimes a correct header title, sometimes not"

- The nine program focused views (`/programs/:id/sctm`, `/baseline`, `/conmon`, `/ingestion`, `/inheritance`, `/risk`, `/authorization`, `/te-phases`, `/export`) put the view name in the record's h1 in place of the program name and drop the Details rail (`program-workspace.tsx:189,495`). Live: the h1 on `/sctm` is "Traceability matrix"; the browser title is "Control traceability"; neither is the program.
- Browser title, side-nav label and h1 disagree on eight screens: Suppliers / Supply chain / Supplier registry; Briefing / Authorization decisions / ATO briefing room; Portfolio / Portfolio / Overview; Schema / Schema inspector; Program export / Program transfer; and all six focused views (`vendors.tsx:18,31`, `briefing.tsx:4` with `package-views.tsx:455`, `index.tsx:34,81`, `schema.tsx:4`, `programs.$programId_.export.tsx:20`).
- The same risk record is served at `/risks/:id` and `/register/risks/:id` with the same title (`risks.$riskId.tsx`, `register.risks.$riskId.tsx`); `/programs/:id/dashboard` duplicates the program Overview under a different title.
- Program trail carries only the code, never the name (`program-workspace.tsx:175`). Campaign, program requirement and POA&M document records have no header action at all (`campaigns.$campaignId.tsx:51`, `requirement-record.tsx:433`, `assurance-views.tsx:682`). POA&M documents and every schema record page have no Details rail.
- Not-found states: `<p role="alert">` (`requirement-allocations.tsx:90`, `requirement-control-mappings.tsx:189`), an `EmptyMessage` without illustration or route back (`requirement-record.tsx:113`), and no not-found state at all on the schema record page, which shows the literal h1 "Record" (`record-browser.tsx:959`).

## Vocabulary drift

One concept, several labels, each used in a different adapter:

| Concept | Labels in use |
|---|---|
| Operational issue | Findings (program tab), Findings and operational issues (h2), Operational issues (register tab), Finding (column), Operational issue (title) |
| Assessment finding | Assessment findings (tab), Findings (h2), Assessment finding (title), Finding (not-found) |
| System | System (tab), scope (`$scopeId`, rail label Scope), Element sections (tabs label), System composition (title) |
| Task | Schedule (program tab, URL aliases tasks/work/team), Program work (section), Open schedule (action), My work, Tasks, Assigned work, Risk work |
| Supplier | Supply chain (nav), Suppliers (title), Supplier registry (h1), Organization (column, create) |
| Risk register | Risk register (`/risks`), POA&M & risk register (`/register`), POA&M & risk (nav), Risks (tab), Risk (program tab) |
| Campaign | Test campaigns (nav, title), Campaigns (tab), Assessments (program tab), Create assessment campaign (create), Schedule assessment (dead label) |
| State of a record | State (task, profile, component rails) vs Status (workstream, campaign, program, requirement) |
| Person responsible | Lead, Owner, Sponsor, Assessor |
| Create | Create, Record, Add, Schedule, Assign, Map (and "Add requirement details" for a create) |

## Why the contract does not bite

1. Lint checks syntax the contract does not care about and cannot check what it does. Only five rules are composition rules, and all of them pass while the drift above ships. Four in-memory JSX probes against the real ESLint configuration each returned zero errors and zero warnings: a Create task form built on `Sheet`; a register header with `PageHeader.Description`; a `RecordPreviewPanel` with no `navigation`; a responsive `DataTable` with a hand-built `Inline` toolbar. `RecordPreviewPanel.navigation` is an optional prop (`src/components/prototype/record-preview.tsx:34`); the boundary test blocks a direct `Shell.Panel` but does not require navigation (`scripts/tests/design-system-boundary.test.mjs:88`).
2. The reference files are themselves off-contract. `tasks.$taskId.tsx` renders four h1s and three "not found" empties on a loaded record. `requirements-table.tsx` bypasses `useDisplayedRecords`. `work-table.tsx` builds its name link without `RecordLink` and gives it 330px. An agent that copies the reference copies the drift.
3. Six table adapters, three query-state wrappers, two generic dialogs. Each was written to a slightly different version of the rules, so which screen looks right depends on which adapter its author happened to import. `ProgramCollection` even overrides what its callers ask for.
4. Silent fallbacks. `rows={records ?? [row]}` and `onSelect ?? (() => {})` (`program-shared.tsx:246`, `library-controls.tsx:252`) let a caller ship a navigation control that navigates nothing. `createVerb` lets a caller believe its label is used.
5. `test:patterns` covers representative flows on the adapters that were fixed yesterday. Its header assertion (`scripts/test-pattern-consistency.mjs:69`) is called for Suppliers and Findings only, checks h1 count, description absence, bounds and title suffix, and does not reject the repeated tab-level h2 it walks past on Findings. The registers with no eye, the focused views, the library tabs, the schema pages, column reordering, touch discoverability and failed refresh are not in it, and nothing obliges a new screen to join it.

## What to fix first

In order of how much drift each one removes:

1. Collapse the table adapters onto one. `ModelTable`/`EntitySection`, `ProgramCollection`, `AssessmentTable` and the library tables should share one register composition that always renders: kit `Toolbar` with search, `views`, `filters`, one small primary; `RecordLink` name with `priority: 0`; eye with `preview`+`active` feeding `RecordPreviewPanel` through `useDisplayedRecords`; `QueryState`; `Empty` with illustration and the toolbar's create action; `fill` when it is the block; no heading of its own. Delete `createVerb`'s allow-list and the `records ?? [row]` fallbacks so a caller that forgets is a type error, not a dead control.
2. Give the eight eyeless primary registers the eye and the panel (Programs, Tasks, Risks, Campaigns, Profiles, Components, Products, Requirements), and move Evidence's register preview into the panel, keeping the modal only for the version review it was written for.
3. Fix the references before anything copies them again: task record empties, requirements table navigation, work table name column, program focused-view h1 and rail.
4. Make the section heading a decision of the tab, not the adapter: a tab whose only content is a collection renders no heading; a body with several collections uses `Section`. Remove the second action rows and version-select rows under record headers; those belong in `PageHeader.Actions` or the Details rail.
5. Add browser checks for the things lint cannot see, run over every route rather than a sample: one h1 per page and it is the record name; every register has search, a name link and either an eye or a documented reason; every panel's previous/next are enabled when the register has more than one row; every tab whose content is one table has no h2 above it; browser title equals the h1's screen type.
6. Fill `nouns` in `src/lib/product-records.ts` (at least `poam_item_revisions`) and settle the vocabulary table above in the contract so the same concept has one word everywhere. Name the two profile-tailoring Sheets in the contract's closed list, or migrate them.
7. Make the eye discoverable without hover in the kit, so a touch reader has a visible preview affordance, and keep it keyboard-focusable.
8. Keep an inventory of screen families and exceptions tied to the browser assertions, so a new screen has to declare which family it belongs to or which exception it claims, and the suite grows with the app instead of staying at the flows fixed yesterday.

Detailed inventories from this audit (every table, preview, form and route with its properties) are in the two session transcripts; the file:line references above are the actionable subset. Neither pass changed application code or records; Codex's browser contexts blocked writes, and Claude's opened create dialogs without submitting.
