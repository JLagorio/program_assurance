# Walk of the running app

Part of the [Ledger audit, 24 September 2026](README.md).

Three signed-in walks of the running app as the seeded developer on the WS-X90 program, at 1440 and 390: VW1 covered the dashboards and global registers, VW2 the program record, its tabs, focused views and the create wizard, and VW3 the record pages, forms and confirmations, dark mode and a keyboard pass. The frame holds. Every global register and program tab has the same shape: one h1, the kit Toolbar in two rows on a phone, a frameless fill DataTable with pagination at the bottom, and illustrated empties that keep bare and filtered states apart. No walked route scrolls sideways at 1440, 1024 or 390. Browser titles are right on every route, record pages keep the two-line header and a Details rail, missing records get a proper Empty, preview navigation follows the contract, draft protection works in every create dialog, and dark mode holds. Quality drops below that frame, in the generic plumbing and at the seams between screens. The generic adapters (ModelFacts, ModelTable, RecordSummaryPreview, ProgramCollection) print raw enums, ISO timestamps and UUID titles beside screens that format them. One status gets three colours, and the Controls tab sends every control into the schema inspector although a product control record exists. Focus is lost or invisible in four places: the saved-views trigger, the tabs, the catalog preview and every create dialog on close. The dashboards and the program Overview are hand-built collages where kit parts now fit.

Screenshots are in the session scratchpad, /private/tmp/claude-501/-Users-joseflagorio-Downloads-program-assurance/4950168c-a626-485c-8818-76b2259964c3/scratchpad/audit/, and are named below relative to that folder.

## Dashboards

**VW1-16 · Portfolio 'Assurance activity' is a raw audit log** (medium)

[index.tsx:182-207](../../../src/routes/index.tsx#L182-L207), [:210](../../../src/routes/index.tsx#L210), [:218](../../../src/routes/index.tsx#L218)

`/` at 1440. Screenshots: VW1/f_1440_root_full.png, VW1/1440_root.png.

Every entry is titled 'Updated' over a raw audit string ('REQ-0042.1: created revision 6 from revision 5; changed Owner.') and a timestamp with seconds. Eight of the ten are revisions of one requirement, with no actor and no link to the record. Below the feed sit '1 adopted scope baselines' and an 'Inspect backend data' link into the schema inspector, so a full column of the dashboard gives a manager nothing to act on.

Fix: reuse the activity feed the kit already documents ([Timeline.stories.tsx](../../../packages/design-system/src/stories/components/Timeline.stories.tsx), Activity and People) and [requirement-record.tsx:299-344](../../../src/components/prototype/requirement-record.tsx#L299-L344) already renders: actor, linked record, time. Group consecutive revisions of one record, fix the plural and drop the schema link.

**VW1-17 · The 'Packages for review' empty is louder than its heading** (medium)

[package-views.tsx:538](../../../src/components/prototype/package-views.tsx#L538), [work-common.tsx:95-112](../../../src/components/prototype/work-common.tsx#L95-L112)

`/briefing` at 1440 and 390. Screenshots: VW1/1440_briefing.png, VW1/390_briefing.png.

The 320px rail renders 'No published package versions have been recorded' at the default Empty title size: two large centred lines, with no illustration, description or action, larger than the section heading and the main empty. The main empty tells the reader to 'Open a published package version' and gives no route to Packages.

Fix: pass `compact` at this call site (leave EmptyMessage's default alone), and give the main empty a TextLink to `/packages`.

## Registers

**VW1-12 · Library registers show raw lowercase enums and keys** (medium)

[library-controls.tsx:63](../../../src/components/prototype/library-controls.tsx#L63), [:99](../../../src/components/prototype/library-controls.tsx#L99), [library-components.tsx:103-107](../../../src/components/prototype/library-components.tsx#L103-L107), [profiles.index.tsx:95](../../../src/routes/profiles.index.tsx#L95), [library-products.tsx:121](../../../src/components/prototype/library-products.tsx#L121), [columns.tsx:374-378](../../../packages/design-system/src/patterns/data-table/columns.tsx#L374-L378)

`/catalog`, `/library/components/`, `/profiles/`, `/library/products/` and `/register/` at 1440. Screenshots: VW1/1440_catalog.png, VW1/1440_library_components_.png, VW1/1440_register_.png.

The catalog shows Family 'ac' and Status 'active' or 'withdrawn'. Components, profiles and products show 'draft' and 'published', and component Type reads 'policy', 'service' or 'hardware'. The POA&M register's search says 'Search poa&m items'. Campaigns shows 'Active' because AssessmentTable maps its values, so the library screens read as database dumps next to the operational registers.

Fix: no kit humaniser. Apply the mapping ModelTable and AssessmentTable already use, `labelFor` in the table data ([record-tools.tsx:140-146](../../../src/components/prototype/record-tools.tsx#L140-L146), [assessment-table.tsx:107-120](../../../src/components/prototype/assessment-table.tsx#L107-L120)), which also labels sort, search and the filter facets. Show the family as its group title or the uppercase code, and build the search label from the product noun.

**VW1-9 · The catalog folds the control ID first, leaving rows of identical 'Policy and Procedures'** (medium)

[library-controls.tsx:77-83](../../../src/components/prototype/library-controls.tsx#L77-L83), [library-products.tsx:101](../../../src/components/prototype/library-products.tsx#L101)

`/catalog` at 390 and at 1280 with the panel open; `/library/products/` at 390. Screenshots: VW1/390_catalog.png, VW1/p_1280_catalog_1.png, VW1/390_library_products_.png.

The code column is `hideable: false` but has no priority, so it folds before the title. Every family's first control is titled 'Policy and Procedures' (AC-1, AT-1, AU-1 and so on), and the rows cannot be told apart without opening More fields; on the products register both rows read 'kk'. The same fold causes VW1-5.

Fix: follow [requirements-table.tsx:335-341](../../../src/components/prototype/requirements-table.tsx#L335-L341): code at priority 1 and pinned to the start, name at priority 0. Do not give both columns priority 0.

**VW1-10 · ModelTable registers cannot set column priority** (medium)

[record-tools.tsx:67-72](../../../src/components/prototype/record-tools.tsx#L67-L72), [:153-206](../../../src/components/prototype/record-tools.tsx#L153-L206), [assurance-views.tsx:96-106](../../../src/components/prototype/assurance-views.tsx#L96-L106)

`/risks` at 1280 with the preview open. Screenshot: VW1/p_1280_risks_1.png.

DisplayColumn has no priority. When the register narrows it keeps Owner (every row '—') and Updated (every row 'Sep 12, 2026'), and moves Latest severity and Status, the two columns a risk reader scans, into More fields.

Fix: add `priority` and `minWidth` to DisplayColumn and forward them to `defineColumns`. Give status and severity low numbers in the Risk register, Findings and Portfolio.

**VW1-13, VW2-22 · The campaigns Events cell is cut to 'Show 0 even' and links to nothing** (medium)

[assessment-browser.tsx:209-226](../../../src/components/prototype/assessment-browser.tsx#L209-L226)

`/campaigns`, the program's Assessment campaigns tab and `/programs/:id/te-phases` at 1440. Screenshots: VW1/1440_campaigns.png, VW2/tab05-Assessmentcampaigns-1440.png, VW2/view-te-phases-1440.png.

The 90px cell holds an 89px 'Show 0 events' button plus padding: the button ends at x=1427 and the table at 1416, so every row is cut at the table's edge with no ellipsis. Every row also offers a link to an empty list.

Fix: show the count in a `c.number` column headed Events, and link it only when it is above zero. If a link stays, widen the column to about 120px and truncate without wrapping.

**VW1-8, VW3-15 · My work opens on 'Nothing matches' for a filter the reader never set** (medium)

[work-table.tsx:118](../../../src/components/prototype/work-table.tsx#L118), [:136](../../../src/components/prototype/work-table.tsx#L136), [:153-165](../../../src/components/prototype/work-table.tsx#L153-L165)

`/work` at 1440 and 390, as the seeded owner. Screenshots: VW1/1440_work.png, VW1/390_work.png, VW3/reg-work-390.png.

The default view 'Assigned to you 0' applies a column filter in `initialState`, so the table takes the filtered-empty branch: 'Nothing matches — Clear the search or a filter to see every row', with Clear filters. The workspace has 10 tasks and nothing was typed. The personal landing register tells a new user that their search failed, and Clear filters actually switches to all tasks.

Fix: app only. Compute `empty.filtered` from `table.state.columnFilters`: when the active preset is 'Assigned to you' and there is no search, show 'Nothing assigned to you' with a 'Show all tasks' action that selects the all preset. Keep the default copy for real misses. No per-preset kit API is needed.

**VW1-7 · Search and filter results change silently** (medium)

[data-table.tsx:1290-1310](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1290-L1310)

`/findings/` and `/vendors` at 1440 and 390, searching 'zzqxnomatch'. Screenshots: VW1/e_1440_findings_.png, VW1/e_1440_vendors.png, VW1/e_390_findings_.png, VW1/e_390_vendors.png.

Nothing under `patterns/data-table` or the Toolbar is a live region, so a screen-reader user gets no word that the table emptied. The pagination footer disappears, so nothing on screen says '0 of 62'. The views trigger keeps 'All records 62', which is correct: it counts the saved view, as saved-view counts do in peer tools.

Fix: add a polite, visually hidden `role=status` region to DataTable, debounced after search and filter changes, that announces the count ('0 of 62'), and optionally show it in the pagination line. The default filtered copy may echo the query.

**VW1-6 · Every preview eye is named 'Preview row'** (medium)

[table.tsx:443](../../../packages/design-system/src/components/table.tsx#L443)

`/programs` at 1440, where seven buttons share the name; counted by script, no screenshot.

The neighbouring disclosure is named per row ('More fields for Laptop disk encryption u…'), but in a buttons list, or while tabbing through a register, the eyes cannot be told apart. The header handles read 'Reorder column' without the column's name.

Fix: have DataTable pass the row's primary value to PreviewButton for a localised 'Preview {label}', following the expandLabel/collapseLabel pattern ([table.tsx:693](../../../packages/design-system/src/components/table.tsx#L693)). Do the same for the Reorder handle ([table.tsx:823](../../../packages/design-system/src/components/table.tsx#L823)).

**VW1-18 · Navigation built as `Button render={<Link>}` logs Base UI errors** (medium)

[programs.tsx:158](../../../src/routes/programs.tsx#L158), [record-browser.tsx:1205-1222](../../../src/components/app/record-browser.tsx#L1205-L1222), [schema-shell.tsx:64](../../../src/components/app/schema-shell.tsx#L64), [work-common.tsx:153](../../../src/components/prototype/work-common.tsx#L153), [\_\_root.tsx:94](../../../src/routes/__root.tsx#L94), [shell.tsx:269](../../../src/components/app/shell.tsx#L269)

`/`, `/programs` and `/schema`, from the console log; no screenshot.

Each site renders an anchor through Button, and Base UI logs that a component acting as a button expected a native button element. Button.mdx says navigation uses a real anchor or router Link styled with `buttonVariants`, and no lint rule catches the pattern, since `ledger/text-link-navigation` covers TextLink only. The pattern has spread to seven sites, including the Programs register's Create program, and the console noise hides real errors.

Fix:

- Render `<Link className={buttonVariants({ variant })}>`, per [Button.mdx:52-58](../../../packages/design-system/src/stories/components/Button.mdx#L52-L58), or add a LinkButton to the kit.
- Add a ledger rule that rejects Button or IconButton whose `render` is an anchor or router Link without `nativeButton={false}`.

## Previews

**VW1-4 · The catalog control preview prints raw OSCAL markup and buries the control text** (high)

[library-controls.tsx:173](../../../src/components/prototype/library-controls.tsx#L173), [:152-181](../../../src/components/prototype/library-controls.tsx#L152-L181), [:256-278](../../../src/components/prototype/library-controls.tsx#L256-L278)

`/catalog` at 1280 and 390, the AC-1 and AC-2 previews. Screenshots: VW1/p_1280_catalog_1.png, VW1/p_1280_catalog_2.png, VW1/p_390_catalog_1.png, VW1/p_390_catalog_2.png.

The statement reads 'Develop, document, and disseminate to {{ insert: param, ac-1_prm_1 }}:', and each part carries grey 'statement' or 'item' pills and ids such as ac-1_smt.a. Above it, an expanded Details group holds 'Selected profiles' as one unsorted run of about 40 names with '(1)' suffixes, in a different order per control, so at 390 the control text starts below the first screen. The catalog exists to read controls, and the reader gets template syntax where the assignment belongs.

Fix:

- Render insert markup as a labelled placeholder ('[Assignment: organization-defined personnel or roles]') from the parameter's label, or the program's value where one exists. Show part labels (a., 1., (a)) instead of part ids.
- Collapse Details by default, as the contract says for provenance and counts.
- Show Selected profiles as a sorted count and list ('Selected by 42 profiles'), baselines first.

**VW1-3 · Generic previews show raw values: lowercase enums and ISO timestamps** (medium)

[record-summary-preview.tsx:83-87](../../../src/components/prototype/record-summary-preview.tsx#L83-L87), [record-tools.tsx:254-260](../../../src/components/prototype/record-tools.tsx#L254-L260), [records.ts:81-86](../../../src/lib/records.ts#L81-L86), [library-controls.tsx:263](../../../src/components/prototype/library-controls.tsx#L263), [package-views.tsx:488](../../../src/components/prototype/package-views.tsx#L488)

`/risks` at 1280 and 390, `/` and `/findings/` at 1440. Screenshots: VW1-3r/risks_1280.png, VW1-3r/risks_390.png, VW1/p_1280_catalog_1.png.

The first risk row reads 'Closed' and 'Sep 12, 2026'. Its preview shows Status 'closed', Updated '2026-09-12T18:01:21.982404+00:00' wrapped over two lines, and a 'Risk' property that repeats the h2 title. RecordSummaryPreview renders `displayValue(data[key])`, which is `String(value)` for strings; Portfolio ('Status closed') and the Operational issues tab ('Severity low') show the same, the catalog preview shows Status 'active', and by source the authorization decision preview is titled with the raw `decided_at`.

Fix: pass the preview the labelled row the table renders, or reuse each column's kind. Format dates with the exported `useLedgerLocale().formatDate` or one app formatter shared with `displayFact` (the kit's LocalizedDate is private to [columns.tsx:132](../../../packages/design-system/src/patterns/data-table/columns.tsx#L132)). Render statuses through the shared status binding (VW1-2), absent values with Absent, and drop the field that repeats the title. This is the same formatter as VW3-2.

**VW3-3 · Previews of link-table rows are schema dumps titled with a UUID** (medium)

[program-shared.tsx:196-240](../../../src/components/prototype/program-shared.tsx#L196-L240), [records.ts:77-80](../../../src/lib/records.ts#L77-L80)

`/tasks/:id` at 1440, the eye on an Assignments row. Screenshot: VW3/preview-task-assignment-1440.png.

The inner h2 is 'c43cecc0-5cbd-5e8a-92a7-07f237623de9', because `recordTitle` falls back to the id. The properties are every schema column through `labelFor`: 'Task ID: Confirm keycloak-idp…', 'Party ID: Victor Amsel', 'Assignment role: responsible', 'Revision: 1' and a raw ISO Created at. The name link 'Victor Amsel' opens `/records/task_assignments/…` in the schema inspector, with its different shell.

Fix: show only the columns the collection declares, formatted through the VW3-2 formatter, and hide revision and audit timestamps. Title a link-row preview with the related record's name. Pointing the name link and the eye at the party instead would change the contract's link rule, so change [product-patterns.md](../product-patterns.md) first if that is wanted.

## Program record, tabs and focused views

**VW2-1 · Control names on the Controls tab open the schema inspector** (high)

[ssp-assembly.tsx:388](../../../src/components/prototype/ssp-assembly.tsx#L388), [:589](../../../src/components/prototype/ssp-assembly.tsx#L589), [record-preview.tsx:250-275](../../../src/components/prototype/record-preview.tsx#L250-L275)

`/programs/:id?tab=Controls` at 1440 and 390, on WS-X90 (546 controls). Screenshots: VW2-1r/controls-tab-1440.png, VW2-1r/after-enter-1440.png, VW2-1r/tap-390.png, VW2-1r/product-control-1440.png.

The Title link, the row click, a tap at 390 and the preview's full-record link all go to `/records/selected_controls/:uuid`, because `recordDestination` has no case for selected_controls or implemented_requirements. The reader lands in the Schema inspector: a UUID h1, the title 'Schema record — Program Assurance', raw ISO timestamps, no implementation narrative, and 'Back to prototype' to `/` as the only way out. The designed ProgramControlRecord at `/programs/:id/controls/:implementationId` renders well, and nothing in the app links to it.

Fix:

- Add an implemented_requirements case to `recordDestination` that returns `/programs/$programId/controls/$controlId`, and use it for the Title link, the row click and the preview's open link when `row.implementation` exists.
- A control with no implementation yet opens its preview (or the Controls tab), not the schema record.
- Add the route to test-screen-families so the name link is asserted.

**VW2-2 · On a phone the selected program tab scrolls out of view once the counts load** (medium)

[scroller.tsx:216-240](../../../packages/design-system/src/components/scroller.tsx#L216-L240), [program-workspace.tsx:219-226](../../../src/components/prototype/program-workspace.tsx#L219-L226)

Program tabs at 390 with touch: Controls, Schedule, POA&M and Activity. Screenshots: VW2/tab04-Controls-390.png, VW2/tab06-Schedule-390.png, VW2/tab09-POAM-390.png, VW2/tab11-Activity-390.png.

Measured 8 seconds after load, the selected tab sits wholly outside the strip: Controls at x 389–449 with the strip ending at 374, and the strip on POA&M reads 'ent campaigns 2 | Schedule | Findings | Evider'. `keepCurrentInView` reveals the current item only on the first overflow or when the strip narrows. The Count badges arrive after each query and grow the strip, which pushes the revealed tab off-screen, so every `?tab=` deep link lands this way. Responsive-2026-09-24 #11 covered narrowing only.

Fix: keep revealing on growth until the reader scrolls, wheels, touches or moves focus in the strip, and ignore programmatic `scrollBy`. Also reveal when the current item changes programmatically, as when the Overview queue buttons switch the tab. Add a Tabs story at 390 whose counts arrive after mount.

**VW2-6 · System tree names are cut without an ellipsis, and the boundary marker is clipped away** (medium)

[program-systems-tree.tsx:197-219](../../../src/components/prototype/program-systems-tree.tsx#L197-L219), [:231-235](../../../src/components/prototype/program-systems-tree.tsx#L231-L235)

The System tab and the system record at 1440 and 1024. Screenshots: VW2/tab01-System-1440.png, VW2/rec-system-1024.png, VW2/full-rec-system-1024.png.

Names stop mid-letter ('WS-X90 Sentinel Mission Syst', 'Secure Boot Contro'), because the RecordLink has no `truncate` or `min-w-0` and the cell clips. The Shield 'Authorization boundary' icon comes after the name, at x=518 in a cell that ends at 507, so the only boundary marker never shows. Code, Type and a 220px Baseline keep their full width while the impact headers read 'Confi…', 'Integ…' and 'Avail…'.

Fix: let RecordLink take a `className`, or wrap it in a `min-w-0 truncate` span. Make the icons `shrink-0` and put the Shield before the name. Consider C, I and A headers with full-text titles.

**VW2-7 · Tree rows use the same down chevron for 'expanded' and for 'More fields'** (medium)

[data-table.tsx:865-878](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L865-L878), [table.tsx:689-703](../../../packages/design-system/src/components/table.tsx#L689-L703)

The System tab and system record at 1440 and 390. Screenshots: VW2/tab01-System-1440.png, VW2/tab01-System-390.png, VW2/rec-system-390.png.

An expanded tree row shows a rotated ChevronRight at its start, and the closed More fields toggle shows a ChevronDown at its end. The two glyphs look the same and mean opposite things; on a phone each row ends in eye, ⋯ and ⌄ after its leading ⌄. A reader who taps the trailing chevron to collapse the branch opens a detail row instead.

Fix: give More fields its own glyph (MoreHorizontal with a count, or '+N'), or a labelled 'N more fields' link in the name cell. Keep the chevron for tree and group disclosure only.

**VW2-8 · The program Actions menu hides nine views behind onClick items** (medium)

[program-workspace.tsx:186-214](../../../src/components/prototype/program-workspace.tsx#L186-L214), [programs.$programId_.dashboard.tsx:4-11](../../../src/routes/programs.$programId_.dashboard.tsx#L4-L11)

Program record at 1440. Screenshot: VW2/actions-menu-1440.png.

The menu is ten flat items, Edit program and nine views, with no group or separator. Each is a `div` menu item that navigates in `onClick`, so none opens in a new tab or can be copied. 'Program dashboard' redirects to `?tab=Overview`, the page the menu was opened from, and a stray `{" "}` text node sits inside DropdownMenuContent ([:191](../../../src/components/prototype/program-workspace.tsx#L191)).

Fix: keep Edit program as the action. Move the views into a labelled Views group of DropdownMenuLinkItem rendering router Links (DropdownMenuGroup and DropdownMenuSeparator are already exported). Remove Program dashboard and the stray text node.

**VW2-18 · The Overview is hand-built: bespoke stat tiles, a heading around a heading, 'Open schedule' twice** (medium)

[program-workspace.tsx:245-350](../../../src/components/prototype/program-workspace.tsx#L245-L350), [:282-293](../../../src/components/prototype/program-workspace.tsx#L282-L293), [:336-348](../../../src/components/prototype/program-workspace.tsx#L336-L348)

Program Overview at 1440 and 390. Screenshots: VW2/tab00-Overview-1440.png, VW2/full-overview-390.png.

Open tasks, Open issues and Open risks are raw buttons styled by hand rather than Stat.Tile, and they navigate although they are buttons; at 390 they stack as three full-width cards, about 170px for three numbers. 'Program work' is a Section whose only child is the Section 'Tasks', 'Open schedule' appears twice, and the Tasks empty repeats the Schedule tab's word for word.

Fix: use `Stat.Grid cols={3}` with each Stat.Tile wrapped in a router Link, per [Stat.mdx:50](../../../packages/design-system/src/stories/components/Stat.mdx#L50); expect two columns plus one at 390. Drop the outer 'Program work' Section and keep one 'Open schedule'. Replace the embedded Tasks table with a short 'Next tasks' summary, or remove it, since Schedule owns it.

**VW2-3 · Focused views underline a sibling tab that does nothing, and the program crumb is not a link** (medium)

[program-workspace.tsx:163-181](../../../src/components/prototype/program-workspace.tsx#L163-L181), [:219-228](../../../src/components/prototype/program-workspace.tsx#L219-L228), [programs.$programId_.authorization.tsx:9](../../../src/routes/programs.$programId_.authorization.tsx#L9), [programs.$programId_.baseline.tsx:9](../../../src/routes/programs.$programId_.baseline.tsx#L9)

`/programs/:id/baseline`, `/authorization` and `/inheritance` at 1440. Screenshots: VW2/view-baseline-1440.png, VW2/view-authorization-1440.png, VW2/view-inheritance-1440.png.

Each focused route selects a sibling tab, so 'System' is underlined above 'No configuration baselines yet' and 'Controls' above 'No provider capabilities yet'. Clicking the underlined tab does nothing, because Base UI Tabs fires `onValueChange` only on a change; from `/authorization` the Overview tab cannot be reached by clicking it. The program crumb is a BreadcrumbPage whenever a view shows, so both obvious ways back are dead.

Fix: render the program crumb as a BreadcrumbLink to `/programs/$programId` whenever a view shows, as `/export` already does. Then drop the tab strip on focused views, or give Tabs a value no trigger carries so every tab navigates back.

**VW2-9 · Several focused views repeat a tab instead of showing what their names promise** (medium)

[program-workspace.tsx:738-816](../../../src/components/prototype/program-workspace.tsx#L738-L816)

`/programs/:id/sctm`, `/risk`, `/te-phases` and `/conmon` at 1440. Screenshots: VW2/view-sctm-1440.png, VW2/view-risk-1440.png, VW2/view-te-phases-1440.png, VW2/view-conmon-1440.png.

'Traceability matrix' stacks the Requirements table above the Controls table, with no requirement-by-control matrix and the second table starting about 1,100px down. 'Residual risk' is the Risk tab minus its Updated column, with no residual rating. 'Cyber T&E phases' is the Assessment campaigns tab, and 'Continuous monitoring' repeats Schedule's Tasks above a table whose toolbar says 'Create assessment campaign'.

Fix: build the named shapes (a requirement-to-control matrix, a residual-risk view with likelihood and impact), or remove the duplicates and point the menu at the equivalent tab. Record the decision in docs/next.md, as the contract asks for any shape it does not cover.

**VW2-10 · Program transfer (`/export`) breaks the focused-view family** (medium)

[programs.$programId_.export.tsx:69-121](../../../src/routes/programs.$programId_.export.tsx#L69-L121)

`/programs/:id/export` at 1440. Screenshot: VW2/view-export-1440.png.

It has no tab strip, a three-line paragraph under the header, which the record contract rules out, and four loose KeyValue rows with truncated labels ('Requirement id…', 'Security plan re…', 'Evidence artifa…'), so the counts the reader came to check cannot be read. Its rail shows a raw 'active', uses 'Not recorded' where the siblings show '—', and drops Sponsor, Updated and References.

Fix: keep its linked program crumb and bring the siblings to it (VW2-3). Reuse the program Details rail with StatusValue and Absent, show the counts as a Stat.Grid or as KeyValue rows with a `labelWidth` that fits, and move the explanation out from under the title.

**VW2-13 · The control, component and requirement records each break the record contract differently** (medium)

[program-record.tsx:571-593](../../../src/components/prototype/program-record.tsx#L571-L593), [:670-677](../../../src/components/prototype/program-record.tsx#L670-L677), [:106-117](../../../src/components/prototype/program-record.tsx#L106-L117)

The program control, component and requirement records at 1440. Screenshots: VW2/rec-control-1440.png, VW2/rec-component-1440.png, VW2/rec-requirement-1440.png.

The control record puts a full-width 'Read control and assessment objectives' button in the body, between Implementation and Statement implementations, and its empty says 'Create the first implementation statement for this program.' The component record opens with two bare, unlabelled links under its header, 'Open system element' and 'WS-X90 Sentinel Mission System'. The requirement keeps Owner and Requirement type as Editables in the body, with the chevron about 700px from the value, and only the requirement's trail has a collection crumb.

Fix:

- Move 'Read control and assessment objectives' into PageHeader.Actions or the Actions menu.
- Show the system and system element as labelled 'System' and 'System element' rows in Details.
- Move the requirement's Owner into the Details rail as an Editable.
- Build every program sub-record trail as Programs › Program › collection › record.

## Record pages

**VW3-2, VW2-12 · Record rails and bodies print raw database values** (high)

[record-tools.tsx:290-296](../../../src/components/prototype/record-tools.tsx#L290-L296), [:90](../../../src/components/prototype/record-tools.tsx#L90), [records.ts:81-86](../../../src/lib/records.ts#L81-L86), [assurance-views.tsx:523-530](../../../src/components/prototype/assurance-views.tsx#L523-L530), [findings-views.tsx:339-356](../../../src/components/prototype/findings-views.tsx#L339-L356), [program-record.tsx:666](../../../src/components/prototype/program-record.tsx#L666), [program-workspace.tsx:506](../../../src/components/prototype/program-workspace.tsx#L506), [requirement-record.tsx:222](../../../src/components/prototype/requirement-record.tsx#L222), [assessment-browser.tsx:189-195](../../../src/components/prototype/assessment-browser.tsx#L189-L195)

`/register/poam/:id`, `/register/risks/:id`, `/issues/:id`, `/poam-documents/:id`, `/records/parties/:id` and the program, control, requirement and component records at 1440. Screenshots: VW3/rec-poam-1440.png, VW3/rec-risk-1440.png, VW3/rec-issue-1440.png, VW3/rec-schemarec-1440.png, VW2/rec-control-1440.png, VW2/rec-requirement-1440.png, VW2/rec-component-1440.png.

Sibling records show 'Status in_progress', 'Severity low', 'Component type hardware', 'Status draft' for what is the revision's State, raw ISO strings ('Updated 2026-09-12T18:01:…', a party's timestamp over three lines) and times with seconds ('Opened at 11/11/2026, 1:00:00 AM'). Next to them, the task and workstream rails show a StatusBadge and 'Sep 12, 2026'. ModelFacts goes through `displayFact` and `displayValue`, which return `String(value)` or a timestamp with seconds and bypass StatusBadge ([work-common.tsx:36](../../../src/components/prototype/work-common.tsx#L36)) and `displayDate` ([work-format.ts:3](../../../src/components/prototype/work-format.ts#L3)). ModelTable's `DATE_KEYS = /_(at|on)$/` also misses `*_date` columns, so planned_completion_date shows as '2026-09-08'. docs/next.md records on 18 September that the record rail formats timestamps, which holds for some rails only.

Fix: one fact formatter that no caller can bypass, used by ModelFacts, DetailFacts, ModelTable cells and the ProgramCollection preview (VW1-3, VW3-3):

- status and state keys through StatusBadge or StateBadge, with draft and published labelled State;
- enums through `labelFor`, dates through `displayDate`, timestamps in one date-time format without seconds;
- missing scalars through Absent.

**VW3-8 · The side nav highlights the wrong destination, or none, on record pages** (medium)

[shell.tsx:60](../../../src/components/app/shell.tsx#L60), [:80](../../../src/components/app/shell.tsx#L80), [:212](../../../src/components/app/shell.tsx#L212)

`/tasks/:id`, `/issues/:id`, `/poam-documents/:id`, `/workstreams/:id` and `/risks` at 1440. Screenshots: VW3/rec-task-1440.png, VW3/rec-issue-1440.png, VW3/rec-poamdoc-1440.png, VW3/rec-workstream-1440.png.

An item is active when `pathname.startsWith(item.to)`. Task, issue and POA&M document records highlight nothing, although their breadcrumbs start at a section. `/workstreams/:id` highlights My work, because '/workstreams' starts with '/work', while its trail says Programs, and `/risks` matches no item. My work and Profiles both use the ShieldCheck icon, so the collapsed rail shows the same glyph twice.

Fix: match on path segments (`pathname === to || pathname.startsWith(to + "/")`) and add an explicit route-to-section map: tasks to My work; issues and findings to Findings & assets; register, risks and poam-documents to POA&M & risk register; workstreams to Programs. Give Profiles its own icon.

**VW3-9, VW2-11 · KeyValue labels truncate with no way to read them** (medium)

[key-value.tsx:19-32](../../../packages/design-system/src/components/key-value.tsx#L19-L32)

Profile, component, POA&M item, risk and control records and `/programs/:id/export` at 1440. Screenshots: VW3/rec-profile-1440.png, VW3/rec-component-1440.png, VW3/rec-poam-1440.png, VW3/rec-risk-1440.png, VW2/rec-control-1440.png, VW2/view-export-1440.png.

The `dt` is `truncate` in a fixed 104px column with no title, while the value gets one when it truncates. Labels read 'OSCAL docum…', 'Consumer resp…' and 'Not applicable …' (even where the row passes `wrap`), and the POA&M item body cuts 'Planned compl…' and 'Completion rati…' with about 700px free beside them. On touch there is no hover at all.

Fix:

- Kit: give the `dt` a full-text title when it truncates, for parity with the `dd`, which is the kit's own rule that truncated text stays recoverable.
- App: pass `labelWidth` where labels are long (about 160 on the control rail) and a wider width for ModelFacts in Section bodies. Named widths are the open 'Pixel widths as props' item in docs/next.md.

**VW3-10 · The profile rail says 'Not resolved' while it is still loading** (medium)

[profiles.$profileId.tsx:489-514](../../../src/routes/profiles.$profileId.tsx#L489-L514)

`/profiles/:id` at 1440 and 390. Screenshots: VW3/rec-profile-1440.png, VW3/rec-profile-390.png.

A timed trace showed the rail at 1.0s as 'Kind: Not resolved' and 'Controls: Loading…', with no skeleton on the page; at 3.3s Kind became 'Reference'. The code `inspection ? … : "Not resolved"` treats pending as absent, so the reader sees a false fact that changes under them.

Fix: use the query status to separate pending (a Skeleton in the value) from absent (Absent). Do the same for Catalog, Controls and Imports.

**VW3-11 · Embedded collections are ordered by UUID, so milestones read 1, 3, 2** (medium)

[models.ts:113](../../../src/lib/models.ts#L113), [assurance-views.tsx:620-633](../../../src/components/prototype/assurance-views.tsx#L620-L633), [record-tools.tsx:93-215](../../../src/components/prototype/record-tools.tsx#L93-L215)

`/register/poam/:id` at 1440, light and dark. Screenshots: VW3/rec-poam-1440.png, VW3/dark-rec-poam-1440.png.

`useRows` orders every query by id, and ModelTable and EntitySection set no initial sort. Milestones therefore list sequence 1, 3, 2, so the remediation plan reads out of order, and every embedded collection's order is arbitrary.

Fix: give EntitySection and ModelTable an initial sort by column kind (sequence_number ascending, version_number descending, otherwise updated_at descending), or let `useRows` order by a declared column.

**VW3-13 · Embedded collections wrap one row in full register chrome** (medium)

[data-table.tsx:1462](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1462), [record-tools.tsx:425-445](../../../src/components/prototype/record-tools.tsx#L425-L445), [product-collection.tsx:61-67](../../../src/components/prototype/product-collection.tsx#L61-L67)

`/issues/:id` at 1440 and 390; the task Assignments, asset, POA&M document and POA&M item collections look the same. Screenshots: VW3/rec-issue-1440.png, VW3/rec-issue-390.png, VW3/rec-asset-1440.png, VW3/rec-poamdoc-1440.png.

The issue record has three one-row tables. Each has search, an 'All records 1' views menu, Columns, Settings, a primary, a header row and a footer reading '1–1 of 1 · 20 per page · ‹ 1 ›'. Chrome outweighs content about four to one, and at 390 the page is 1379px tall.

Fix:

- Kit: hide the pager when the row count is no larger than the smallest page size.
- App: ProductCollection renders no views menu when the default preset is the only one.

**VW2-14 · Between 1024 and 1199px the record Details land below a full-length table** (medium)

[theme.css:6](../../../packages/design-system/src/generated/theme.css#L6), [shell.css:141-158](../../../packages/design-system/src/styles/shell.css#L141-L158)

The system record, the component record and the program Overview at 1024 with the side nav open. Screenshots: VW2/full-rec-system-1024.png, VW2/rec-system-1024.png, VW2/rec-component-1024.png.

The aside switches at a 75rem viewport. At 1024 the system record's Details (Code, Type, C/I/A, Lifecycle, Authorization, Baseline) start about 1,450px down, after all 28 tree rows, and nothing above hints that they exist. Collapsing the side nav frees 228px, which the breakpoint ignores.

Fix:

- Lower the aside threshold when the side nav is collapsed or in icon mode, with a `:has()` or data-attribute rule on the shell root beside the media query.
- For a tabbed record whose Overview holds a long register, move the register to its own tab (a register tab fills the work area without the rail), or put Details before it when stacked.

## Program setup wizard

**VW2-15 · Wizard validation shows one error at a time, in a footer hint, with Continue disabled** (medium)

[program-wizard.tsx:199-201](../../../src/components/app/program-wizard.tsx#L199-L201), [:399-418](../../../src/components/app/program-wizard.tsx#L399-L418)

`/programs/new` at 1440, steps 1 to 3. Screenshots: VW2/wiz1-empty-1440.png, VW2/wiz2-1440.png, VW2/wiz3-sheet-1440.png, VW2/wiz3-after-1440.png.

Step 1 with both required fields empty shows only 'Enter a code.' beside a disabled Continue, whose reason sits in a title attribute that a disabled button does not expose; step 2 says 'Choose an existing record.' when a catalog edition is missing. On step 3 the element Sheet closes on Done with six required fields empty, and the footer then reveals one problem per round trip ('System 1: Enter a code.', then 'Audit system: Choose a system type.'). The Forms contract says to validate on submit with the primary enabled, which docs/next.md's 4 September note that the wizard keeps its own blocking message contradicts.

Fix:

- Keep Continue enabled. On Continue, mark the invalid fields inline and focus the first, or reopen the Sheet on the element at fault.
- Validate the Sheet on Done, with an explicit 'Keep as draft'.
- Write field-specific messages ('Choose a catalog edition').

**VW2-17 · On a phone the wizard spends 170px on the stepper and truncates the system it asks you to fix** (medium)

[program-wizard.tsx:283-306](../../../src/components/app/program-wizard.tsx#L283-L306), [program-wizard/elements.tsx](../../../src/components/app/program-wizard/elements.tsx)

`/programs/new` at 390. Screenshots: VW2/wiz1-empty-390.png, VW2/wiz3-390.png, VW2/wiz4-390.png.

The Grid has only an `lg` template, so the vertical Stepper, four steps with a meta line each, takes y≈140–310 above the first field on every step. On step 3 the system row reads 'Unna… Cod… System Choose a program profile ⋯': the name and code are cut to four letters while the grey hint keeps its full width, and the ⋯ menu is the only visible way to edit.

Fix: below `lg`, use the horizontal Stepper (it scrolls) or a one-line 'Step 2 of 4 · Catalog & profiles' header. Let the element row wrap its hint under the name, keep the name and code, and make the row itself open Edit.

## Forms and confirmations

**VW3-5 · Create forms report one error at a time, away from the field, and mark nothing invalid** (medium)

[records.ts:115-118](../../../src/lib/records.ts#L115-L118), [record-browser.tsx:634-676](../../../src/components/app/record-browser.tsx#L634-L676), [:845-849](../../../src/components/app/record-browser.tsx#L845-L849), [create-task-dialog.tsx:218-228](../../../src/components/prototype/create-task-dialog.tsx#L218-L228), [:434-443](../../../src/components/prototype/create-task-dialog.tsx#L434-L443)

Create risk on `/risks`, Create organization on `/vendors` and Create task on `/work`, at 1440 and 390 with writes blocked. Screenshots: VW3/form-risk-2empty-1440.png, VW3/form-org-2empty-1440.png, VW3/form-task-2empty-1440.png, VW3/form-task-2empty-390.png.

An empty submit on Create risk shows only 'Title is required.' at the foot of the form, although Program is required too. Create task shows 'Choose a program.' followed by failed-save copy ('Your task details are retained. Retrying the same request will not create a duplicate.') for a client-side check, and on the 726px phone dialog the message sits below every field. No field gets `aria-invalid` or a red border and focus stays on submit, because `saveRecord` throws on the first empty column and the task dialog reads only the first issue.

Fix: move RecordEditor and CreateTaskDialog onto the existing Forms pattern ([Forms.mdx](../../../packages/design-system/src/stories/patterns/Forms.mdx), States). Collect every issue, render each under its field with FieldError and `aria-invalid`, focus the first invalid control, and show the retry copy only after a failed write.

**VW3-16 · Generic create forms use schema vocabulary, and the create dialogs look like different products** (medium)

[record-browser.tsx:720-780](../../../src/components/app/record-browser.tsx#L720-L780), [product-record-dialog.tsx:117](../../../src/components/prototype/product-record-dialog.tsx#L117), [create-task-dialog.tsx:57-66](../../../src/components/prototype/create-task-dialog.tsx#L57-L66)

Create risk, Create organization and Create task at 1440 and 390. Screenshots: VW3/form-risk-2empty-1440.png, VW3/form-org-2empty-1440.png, VW3/form-task-2empty-1440.png, VW3/form-task-1open-390.png.

Create risk asks for 'Owner party' ('Choose party…'), marks required fields with ' \*' in the label text, has no description and is 760px wide. Create organization shows a disabled 'Party type \* Organization' select and a second field labelled 'Organization', and says 'Email' where the register says 'Contact email'. Create task is 620px wide, with a description, a red `aria-hidden` asterisk and 'Choose…' placeholders.

Fix:

- Use product labels ('Owner'), hide the fixed discriminator field (the title names the type), and rename the parent field 'Parent organization'.
- Follow the required-marker convention in [Forms.mdx](../../../packages/design-system/src/stories/patterns/Forms.mdx) Modifiers: an `aria-hidden` asterisk plus `aria-required`. About 30 hand-rolled copies across src/ and the stories argue for a small kit part.
- One dialog width token and one placeholder convention.

**VW2-16, VW3-6 · The discard confirmation offers 'Cancel' right after the reader pressed Cancel** (medium)

[confirmation.tsx:60](../../../src/components/app/confirmation.tsx#L60), [:71-76](../../../src/components/app/confirmation.tsx#L71-L76)

The wizard's Cancel at 390, and a dirty Cancel on Create task, Create risk and Create organization at 1440. Screenshots: VW2/wiz-discard-390.png, VW3/form-task-4confirm-1440.png, VW3/dark-confirm-task-1440.png.

The dialog asks 'Discard changes?', repeats the question as its description ('Discard this unsaved program setup?') and offers 'Cancel' and 'Discard changes', with the form's own Cancel still visible beneath. The dismiss label is hard-coded, so 'Cancel' after 'Cancel' can be read either way, and a hurried reader can lose a draft.

Fix: add `cancelLabel` to ConfirmationOptions and default `discardChanges` to 'Keep editing', the contract's own words. Make the description state the consequence ('Your program name, profiles and 1 system will be lost.').

## Dark mode

Dark mode (`prefers-color-scheme: dark`) holds on the Risk register, the task and POA&M records and the Create task dialog. Tokens, badges, links and the danger button stay legible, and no light surface leaks through. The one defect is VW3-7 (low, in the table below): a confirmation over a dialog has no backdrop of its own, and in dark mode only the footer band separates the two popups.

## Keyboard and focus

What holds: every stop shows a 2px outline, three skip links lead the order, a record's order runs breadcrumb, Actions, tabs, rail, the line tabs use manual activation, and the Actions menu focuses its first item and returns focus to its trigger on Escape. Four places lose focus or hide it.

**VW1-1 · Focus on the saved-views trigger is invisible, and tab focus is clipped** (high)

[toolbar.tsx:297-298](../../../packages/design-system/src/patterns/toolbar.tsx#L297-L298), [scroller.tsx:322-327](../../../packages/design-system/src/components/scroller.tsx#L322-L327), [tabs.tsx:70-96](../../../packages/design-system/src/components/tabs.tsx#L70-L96), [filter.tsx:402](../../../packages/design-system/src/patterns/data-table/filter.tsx#L402)

`/programs` at 1440 and 390, `/work` at 1440, and the `/findings/` tabs at 1440. Screenshots: VW1/z_1440_programs_views_focus.png, VW1/z_1440_work_toolbar.png, VW1/z_390_programs_toolbar.png, VW1/z_1440_findings_tabfocus.png.

The views trigger's scroller viewport has exactly the button's bounds, no padding and `overflow-x-auto overflow-y-hidden`, so its 2px outline at a 2px offset is clipped away entirely; at rest its 1px ring is cut to faint corner arcs on every register, beside the fully bordered More and Columns. An arrow-focused tab shows only the sides of its outline. The trigger's accessible name is also 'Saved questions' where it reads 'All programs 7', which fails WCAG 2.5.3 Label in Name.

Fix:

- Give the horizontal ScrollerViewport and the Tabs ScrollArea viewport block and inline padding of the ring size (4px, `space.050`) and let the row take the height, or draw focus inset for items inside a horizontal scroller. A matching negative margin is not available: `ledger/no-margin` rejects it outside Bleed ([eslint-plugin/index.js:767](../../../packages/design-system/eslint-plugin/index.js#L767), [:779-782](../../../packages/design-system/eslint-plugin/index.js#L779-L782)).
- Let the visible text lead the trigger's accessible name.
- Add a play test that the focused element's outline box sits inside its clipping ancestor.

**VW3-1 · Focus drops to the page body whenever a create dialog closes** (high)

[product-record-dialog.tsx:107-117](../../../src/components/prototype/product-record-dialog.tsx#L107-L117), [record-tools.tsx:366](../../../src/components/prototype/record-tools.tsx#L366), [work-table.tsx:123-130](../../../src/components/prototype/work-table.tsx#L123-L130), [:146](../../../src/components/prototype/work-table.tsx#L146)

Create task on `/work`, Create risk on `/risks` and Create organization on `/vendors`, at 1440 and 390; logged by script, no screenshot.

After Cancel with no changes, Escape or Discard changes, `document.activeElement` was BODY every time. The dialogs are opened from parent state and unmounted on close, and the toolbar trigger is disabled while they are open, so Base UI has nothing to return focus to. A keyboard user lands at the top of the document and tabs through the skip links, the top nav and 17 side-nav items to get back, on the app's most common form flow (WCAG 2.4.3).

Fix:

- Give ProductRecordDialog and CreateTaskDialog a `finalFocus` target, usually a ref to the trigger (DialogContent already forwards it), or keep the Dialog mounted and drive `open` so Base UI's own close path runs. Enabling the trigger alone does not fix it.
- No kit API is needed: [Dialog.mdx:26](../../../packages/design-system/src/stories/components/Dialog.mdx#L26) already says to supply a stable `finalFocus` target for triggerless tasks. At most, add a story that opens a dialog from state and asserts focus return.
- Assert focus return to the trigger in test:patterns.

**VW1-5 · Opening a catalog preview drops focus to the page body** (medium)

[library-controls.tsx:74-113](../../../src/components/prototype/library-controls.tsx#L74-L113), [library-products.tsx:100](../../../src/components/prototype/library-products.tsx#L100), [library-components.tsx:86](../../../src/components/prototype/library-components.tsx#L86), [profiles.index.tsx](../../../src/routes/profiles.index.tsx), [product-structure.tsx:206](../../../src/components/prototype/product-structure.tsx#L206)

`/catalog` at 1280; at 390 the panel takes focus correctly. Screenshot: VW1/p_1280_catalog_1.png.

Enter or a click on the first 'Preview row' eye leaves `activeElement` on BODY, while the same sequence on `/risks` keeps focus on the eye. Opening the panel narrows the table, and responsive folding moves the eye into the identity cell and unmounts the focused button (VW1-9). The same loss likely affects every register whose eye sits on a code column that is not the identity column.

Fix:

- App: code column at priority 1 and pinned to the start, as in [requirements-table.tsx:335-341](../../../src/components/prototype/requirements-table.tsx#L335-L341).
- Kit: when a re-layout unmounts a focused preview eye, DataTable moves focus to that row's new eye, found by row id.
- Add a focus assertion after opening the eye to test:patterns.

**VW2-4 · Every ancestor crumb is announced as the current page** (medium)

[breadcrumb.tsx:518-545](../../../packages/design-system/src/components/breadcrumb.tsx#L518-L545), [:576](../../../packages/design-system/src/components/breadcrumb.tsx#L576), [program-record.tsx:108-117](../../../src/components/prototype/program-record.tsx#L108-L117), [program-workspace.tsx:163-166](../../../src/components/prototype/program-workspace.tsx#L163-L166)

`/programs/:id/systems/:systemId`, the requirement record and `/programs/:id/baseline`, read from the DOM; no screenshot.

TanStack Router marks a Link active by path prefix and adds `aria-current="page"`, and BreadcrumbLink passes it through. 'Programs', the program and the current page all carry it, and `/baseline` has three. A screen-reader user hears 'current page' at every level, on every record page and focused view.

Fix: add an app crumb adapter (for example CrumbLink in src/components/app) that renders a router Link with `activeOptions={{ exact: true }}` inside BreadcrumbLink, and replace the 21 call sites with it. Add one line to [Breadcrumb.mdx](../../../packages/design-system/src/stories/components/Breadcrumb.mdx): a router link used as an ancestor crumb must not mark itself current. Assert exactly one `aria-current` per breadcrumb in test:patterns.

## Parts the screens are missing

| Part | Kind | Why | Priority | Findings |
| --- | --- | --- | --- | --- |
| One product binding of status, state, severity and impact to tone (StatusBadge, SeverityIndicator) | component | Six tone helpers colour the same status differently and leave severity untoned. | high | VW1-2, VW2-5 |
| DataTable result count in a live region | state | Search and filter changes are not announced. | medium | VW1-7 |
| OSCAL prose renderer with parameter placeholders | pattern | Control text shows raw insert markup and part ids; needed in the catalog, profile tailoring and the SSP. | medium | VW1-4 |
| Required marker on FieldLabel | prop | Forms mark required fields two ways; the Forms.mdx convention exists, with about 30 hand-rolled copies. | medium | VW3-16 |
| Pagination that hides when every row fits one page | state | '1–1 of 1 · 20 per page' under one row, on every record body. | medium | VW3-13 |
| KeyValue label that stays readable, with a width that fits page bodies | variant | Fixed 104px labels truncate with no title. | medium | VW3-9, VW2-11 |
| Dimming or a backdrop for a nested AlertDialog | state | A confirmation over a Dialog does not stand out, especially in dark mode. | low | VW3-7 |
| Visually hidden text on Absent | prop | The dash has no text alternative; an optional improvement, not a WCAG fix. | low | VW1-11, VW3-19 |

## Low-severity findings

| Id | Finding | Where | Fix |
| --- | --- | --- | --- |
| VW1-14 | Headers and names truncate at 1440 while other columns have slack: 'Configuratio…' and 'Eleme…' beside a 300px Product column holding 'kk', 'Latest revis…', 'Supplied comp…', and Evidence titles cut at 290px while Owner keeps 170px. | `/library/products/`, `/profiles/`, `/vendors`, `/evidence`; VW1/1440_library_products_.png, VW1/1440_evidence.png; [library-products.tsx:117-118](../../../src/components/prototype/library-products.tsx#L117-L118), [profiles.index.tsx:94](../../../src/routes/profiles.index.tsx#L94), [vendors.tsx](../../../src/routes/vendors.tsx), [evidence-browser.tsx:106-127](../../../src/components/prototype/evidence-browser.tsx#L106-L127) | Widen the named columns. A measured header minimum in the kit is optional, and `grow` already exists. |
| VW1-19 | Sibling registers differ in small ways: three create primaries lack the Plus icon, placeholders alternate 'Find' and 'Search', views say 'All records' or 'All programs', tab counts appear on two registers, 'Controls 1196' sits beside 'All records 99+', Programs pages 25 rows and others 20, panel names mix 'risk preview' and 'Evidence artifact preview', and Products has both 'State' and 'Product state'. | Library, catalog, programs and evidence registers at 1440; VW1/1440_catalog.png, VW1/1440_library_components_.png; [library-components.tsx:176-181](../../../src/components/prototype/library-components.tsx#L176-L181), [catalog.tsx:123](../../../src/routes/catalog.tsx#L123), [programs.tsx:121](../../../src/routes/programs.tsx#L121), [record-summary-preview.tsx:59](../../../src/components/prototype/record-summary-preview.tsx#L59), [library-products.tsx:122](../../../src/components/prototype/library-products.tsx#L122) | Centralise in ProductCollection: a default primary icon, one placeholder verb with the noun, a default views label, one page size and one Count max. Sentence-case panel names; rename 'Product state' to 'Status'. |
| VW1-20 | On a phone the top nav keeps Light, Dark and Match system as three icon buttons while Help, My work and Settings fold into More. A bell labelled 'Open my work' is a button that navigates. | `/` at 390 and 1440; VW1/390_root.png, VW1/1440_root.png; [shell.tsx:163-185](../../../src/components/app/shell.tsx#L163-L185) | Keep ModeSwitch in Settings and the account menu, or one toggle menu. Replace the bell with real notifications or drop it; where it stays, render a link. |
| VW1-21 | The Evidence preview heads 'Versions' with an h2, the same level as the record title, over two toolbar rows for one row. | `/evidence` preview at 1280 and 390; VW1/p_1280_evidence_1.png, VW1/p_390_evidence_1.png; [evidence-browser.tsx:348-361](../../../src/components/prototype/evidence-browser.tsx#L348-L361) | `Section.Title` with `render={<h3 />}` ([section.tsx:95-101](../../../packages/design-system/src/layout/section.tsx#L95-L101)). Omit search and saved views because the preview task does not need them, not by row count; keep the create action. |
| VW1-23 | The schema inspector home doubles the gutter (about 48px a side at 390), stacks four count cards full width, and shows 'Build your assurance record' with 7 programs recorded. | `/schema` at 1440 and 390; VW1/1440_schema.png, VW1/390_schema.png; [record-browser.tsx:1183-1229](../../../src/components/app/record-browser.tsx#L1183-L1229) | Drop the extra Box padding so Main owns the gutter; two count columns when narrow; show the onboarding card only when there are no programs. |
| VW2-19 | Placeholders and empty copy come from table names: 'Find POA&M documents' beside 'Create POA&M plan', 'Find assessment campaigns' under Monitoring assessments, 'Search observations'. Activity says 'Create the first activity event' where nothing can be created; observation names carry '(Fail)' and Method shows raw 'examine'. | Program POA&M, Activity and Findings tabs at 1440; VW2/tab09-POAM-1440.png, VW2/tab11-Activity-1440.png, VW2/full-findings-1440.png; [program-shared.tsx:467-497](../../../src/components/prototype/program-shared.tsx#L467-L497), [observations-register.tsx:29](../../../src/components/prototype/observations-register.tsx#L29) | Derive the placeholder from `productRecordNoun` with one verb (VW1-19); suggest creating only when the create action shows; a Result column through the status binding; label Method values. |
| VW2-20 | At 390 the Controls tab shows titles only because AC-2(1) folds away; requirement rows link both code and name, two tab stops per row; view counts read '99+' where the tab says 640. | Program Controls and Requirements tabs; VW2/tab04-Controls-390.png, VW2/tab03-Requirements-1440.png, VW2/tab03-Requirements-390.png; [ssp-assembly.tsx:372-390](../../../src/components/prototype/ssp-assembly.tsx#L372-L390), [requirements-table.tsx:471-545](../../../src/components/prototype/requirements-table.tsx#L471-L545) | Show the code as a prefix in the title cell (see VW1-9); link only the name; one Count max for views and tabs. |
| VW2-21 | The wizard review lists C, I and A as three unlabelled 'High' badges; a screen reader hears 'High High High'. | `/programs/new` review at 1440 and 390; VW2/wiz4-1440.png, VW2/wiz4-390.png; [review.tsx:196-199](../../../src/components/app/program-wizard/review.tsx#L196-L199), [system-assurance-details.tsx:31-54](../../../src/components/prototype/system-assurance-details.tsx#L31-L54) | Prefix each badge with its dimension, or give ImpactBadge a dimension prop. |
| VW2-22 | Beyond the Events clipping (VW1-13), the Library tab's empty sends the reader to another tab with no link, and Activity's suggests creating an event that cannot be created. | Program Library and Activity tabs at 1440; VW2/tab02-Library-1440.png | Give the Library empty an 'Open System' action; drop the create suggestion on Activity (VW2-19). |
| VW3-7 | A confirmation over a dialog renders no backdrop of its own; both popups use `bg-surface-overlay`, so in dark mode only the footer band separates them. | Create risk with 'Discard changes?' at 1440, light and dark; VW3/form-task-4confirm-1440.png, VW3/dark-confirm-task-1440.png, VW3/crop-alert-dark.png; [alert-dialog.tsx:26-37](../../../packages/design-system/src/components/alert-dialog.tsx#L26-L37), [:55-62](../../../packages/design-system/src/components/alert-dialog.tsx#L55-L62) | Dim or scale the parent under `[data-nested-dialog-open]` with tokens and motion tokens, or `forceRender` the nested Backdrop; add a Dialog-plus-AlertDialog story checked in dark mode. |
| VW3-12 | Sibling records disagree on the header menu ('Actions ⌄' or a plain 'Actions'), on where 'Inspect record' lives, on a hand-made rule under the workstream header, and on the text measure: issue and campaign descriptions run about 140 characters a line. | Task, issue, component, workstream and campaign records at 1440; VW3/rec-task-1440.png, VW3/rec-workstream-1440.png, VW3/rec-campaign-1440.png; [work-common.tsx:219-250](../../../src/components/prototype/work-common.tsx#L219-L250), [tasks.$taskId.tsx:133](../../../src/routes/tasks.$taskId.tsx#L133), [workstreams.$workstreamId.tsx:101-107](../../../src/routes/workstreams.$workstreamId.tsx#L101-L107), [findings-views.tsx:334-335](../../../src/components/prototype/findings-views.tsx#L334-L335) | RecordActions, or one shared trigger, wherever a header holds a menu; remove the workstream rule; the layout measure and default colour on authored descriptions. |
| VW3-14 | The workstream's Tasks renders WorkTable with `fill` inside a record body, so its empty stretches to a 530px dashed box, and a nested scroller follows once it has tasks. | `/workstreams/:id` at 1440 and 390; VW3/rec-workstream-1440.png, VW3/rec-workstream-390.png; [workstreams.$workstreamId.tsx:109](../../../src/routes/workstreams.$workstreamId.tsx#L109) | Remove `fill` there, or rule on it in the contract, since a record body is not a register page. |
| VW3-17 | The Details rail's divider ends where its facts end (y≈340–530), because the border sits on the aside rather than its grid cell. | Task, issue, component and product records at 1440; VW3/rec-task-1440.png, VW3/rec-product-1440.png; [shell.css:186-192](../../../packages/design-system/src/styles/shell.css#L186-L192) | Put the border on the `[data-shell-slot=aside]` cell or stretch the aside; or drop the line. |
| VW3-20 | The account button's accessible name runs together as 'Ddeveloper@program-assurance.localOwner', and its chevron promises a menu but it opens Settings, which the gear also opens. | Side-nav footer, keyboard pass; VW3/kbd-01.png; [top-nav.tsx:241-262](../../../packages/design-system/src/layout/shell/top-nav.tsx#L241-L262), [shell.tsx:222-231](../../../src/components/app/shell.tsx#L222-L231) | `aria-hidden` on the avatar slot in Shell.Profile; draw the chevron only for a menu trigger, or let the caller turn it off. |
| VW3-21 | The profile Overview is one Section saying to review the revision in the tabs above, and the rail's version choosers put their label above a Select while every other fact sits beside its value. | `/profiles/:id` at 1440, and the component and POA&M rails; VW3/rec-profile-1440.png, VW3/rec-component-1440.png, VW3/rec-poam-1440.png; [profiles.$profileId.tsx:257-262](../../../src/routes/profiles.$profileId.tsx#L257-L262), [:478-486](../../../src/routes/profiles.$profileId.tsx#L478-L486), [assurance-views.tsx:540-550](../../../src/components/prototype/assurance-views.tsx#L540-L550) | Give Overview the profile's purpose, base profile and catalog, or open on Controls; render the chooser as a KeyValue whose value is the Select. |
| VW3-22 | On a phone the task's State, Priority and Due sit at about y=830, after every collection, as the rail-follows-Main design intends. | `/tasks/:id` and `/issues/:id` at 390; VW3/rec-task-390.png, VW3/rec-issue-390.png; [shell.css:141-148](../../../packages/design-system/src/styles/shell.css#L141-L148) | Record an open decision in docs/next.md: a one-line status summary under the title when narrow, or Details before long collections. |

## Already tracked

- VW1-2, VW2-5, one status in several colours ('Active' green on `/programs`, grey on the Portfolio, amber on `/campaigns`; Critical as grey as Low on the Findings tab): [docs/next.md:43](../../next.md#L43) 'A domain component layer', open, Josef's call. Put one binding in the app, not the kit, with severity as Indicator per [status-vocabulary.md:37](../status-vocabulary.md#L37), and fix that guide's stale file pointers at :38.
- VW3-4, link-table names on primary buttons and empties ('Create issue poa&m', 'Create task issue'): [pattern audit, What to fix first #6](../pattern-audit-2026-09-17.md#what-to-fix-first), open; `productRecordNoun` lowercases `labelFor(table)` for five link tables.
- VW1-15, Portfolio metrics hand-built, unlinked, and headlined 'Unsatisfied findings 0' beside 62 open operational issues: [docs/next.md:111](../../next.md#L111), open. `Stat.Grid frame="band"` is usable now; removing the widgets' toolbars needs a contract decision first.
- VW1-11, VW3-19, missing values written as '—', 'Not recorded', 'Not assigned' and 'Unassigned': [docs/next.md:119](../../next.md#L119) 'The dash by hand', open. Render Absent in the UI layer; `displayValue` also feeds search and sort, so it keeps returning a string.
- VW3-18, one POA&M item under four names, and 'Lead' for Owner on the workstream: [pattern audit, Vocabulary drift](../pattern-audit-2026-09-17.md#vocabulary-drift), open. The title 'POA&M commitment' is also in [screen-inventory.json:400](../screen-inventory.json#L400), so change both together.
- VW1-24, responsive-2026-09-24 items on the global registers: #2 holds (header actions show without hover), #5 holds (two toolbar rows at 390), #11 holds (names ellipsise before the eye), and #10 does not reproduce for the header controls. Hiding the drag handle on touch is optional, since Move left and Move right exist.
