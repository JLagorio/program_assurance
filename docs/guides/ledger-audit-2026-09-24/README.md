# Ledger audit, 24 September 2026

This audit read every family of Ledger (`packages/design-system`): each part's source, stories, MDX page and tests, judged against the WAI-ARIA Authoring Practices, WCAG 2.2 AA, Base UI's own behaviour and peer systems, Atlassian and Carbon first. It traced how the prototype in `src/` uses each part against the [product pattern contract](../product-patterns.md), and walked the running app signed in as the seeded developer on WS-X90. The work ran as 55 audit units, including a coverage-gap round of eight units for dimensions the first round had not covered systematically: long content, axe on every route, focus rings, failing loads, short heights, dark-mode contrast, sign-in and session end, and reduced motion. An adversarial verifier re-checked every finding and dropped the 21 it could not confirm. A separate agent then reproduced the 30 most important high findings from scratch; all 30 held, and 10 proved narrower and are rated medium. The [24 September responsive audit](../responsive-audit-2026-09-24.md) is being fixed in parallel in the same checkout, so its items are cross-referenced here as "responsive-2026-09-24 #n" rather than repeated. Line numbers are those of the working tree on 24 and 25 September and will drift as those fixes land.

| Critical | High | Medium | Low | Kept |
| -------- | ---- | ------ | --- | ---- |
| 1        | 101  | 488    | 386 | 976  |

## Summary

- **The foundations are sound.** Parts are thin wrappers over Base UI, styling is tokens only, and the tooling is thorough: a public-API baseline, a token-generated lint allowlist, axe on every story in light and dark, narrow layout projects and a packed-tarball consumer test. The prototype follows the contract's structure almost everywhere. Registers go through ProductCollection onto a responsive DataTable with a RecordLink name, the eye and preview navigation; record pages keep one h1 and a Details rail; decisions go through `useConfirmation`; browser titles follow the rule.
- **Visual state is the kit's weakest layer.** The one focus ring is strong, but containers that clip or scroll cut it off, so focus is invisible on the saved-views trigger, the record name link and the line tabs, which every register keeps. Highlight, pressed and selected states are faint tints that vanish in forced colours, and the Checkbox, Radio and Switch boundaries sit between 1.1:1 and 1.9:1.
- **Focus falls to the page body wherever one surface hands over to another.** Create and edit dialogs, pending saves, wizard steps, RecordPicker and the desktop preview panel all lose the reader's place. Base UI already handles most of this; the app and a few kit parts defeat it with `autoFocus`, `disabled` on the focused button and element swaps.
- **Forms do not say what is wrong.** Field only does layout, so no product form marks an invalid field, errors arrive one at a time under the form, and 53 hand-written `<p role="alert">` stand in for a form message. The reference CreateTaskDialog does this too, so every new form copies it.
- **DataTable's engine is good; its human edges are not.** Row controls are named by UUIDs, the views trigger fails Label in Name on nearly every register, results are never announced, and the table cannot tell data a caller narrowed from data that does not exist. Rows re-render on every state change and on every pixel of a panel animation.
- **The overlays stop at the popup.** There is no body part, width scale or dismissal lock, so about 20 dialogs rebuild them, and the generic create form cannot be completed in a short window or at 200% zoom.
- **Readers meet raw data.** Previews list UUIDs, raw enums and ISO timestamps, seven tone maps paint one status in different colours, and the same timestamp shows different days because kit columns use UTC while app facts use the host zone.
- **The main risk is that the prototype has stopped testing the kit.** It renders no chart and uses no Stat, Attachment, DatePicker, Composer or FieldError, so defects in those parts, such as a textured Donut that loses three of its four slices, surface only in Storybook. The one critical defect is in the app: a failed background refresh destroys an open SSP narrative draft.

## Top findings

Ordered by effect on readers: work that is lost or written wrongly first, then tasks that cannot be completed, then failures that reach every screen.

**1. A failed background refresh destroys an open control-narrative draft** (critical · G4-1)

[ssp-assembly.tsx:66](../../../src/components/prototype/ssp-assembly.tsx#L66)

The SSP assembly returns early on `query.error`, so when a refetch on window focus fails, the whole assembly unmounts, including an open narrative dialog. The draft guard never runs because the dialog is unmounted rather than closed, and the Alert says "Showing the last loaded records" above a page that shows nothing. This breaks both the States rule (stale content stays usable) and the Forms rule (dirty protection survives).

**Fix:** return early only when `data === undefined`, as program-record.tsx already does, keep editors above any loading or error boundary, and add a test:patterns case that fails a refetch while a dialog is open.

**2. Publishing an immutable version is one unconfirmed click, and new requirement versions save placeholder text** (high · PA3-2)

[library-requirements.tsx:291-321](../../../src/components/prototype/library-requirements.tsx#L291-L321)

In the component, product and requirement libraries, Publish creates a version nobody can change from a single menu item, with no confirmation and no feedback; this was reproduced from the keyboard with every write stubbed. Create requirement version inserts a row with placeholder statement and acceptance text when there is no current version, and programs then adopt that definition by reference. An author also cannot tell why Publish is greyed out.

**Fix:** put Publish behind `useConfirmation` ("Published versions cannot be changed"), toast on success, explain a disabled Publish, and make Create requirement version open the version Dialog pre-filled instead of inserting a row.

**3. Enter in a toolbar search submits the surrounding form** (high · TLB-1)

[toolbar.tsx:276-284](../../../packages/design-system/src/patterns/toolbar.tsx#L276-L284)

In Allocate requirement, pressing Enter in the search saves the allocations if any systems are checked, before the reader has reached the Rationale field below the table; with none checked it shows a confusing validation error. This was reproduced on REQ-001 with every write aborted. Any Toolbar inside a Dialog or a form has the same trap.

**Fix:** in Toolbar, prevent Enter's default on the search (skipping IME composition), add `enterKeyHint="search"`, and add a play test with the Toolbar inside a `<form>`.

**4. Tailoring controls is impossible below about 830px** (high · PA1-1, REC-1, G5-4, REC-2, CNT-3 · decision open in docs/next.md, Responsive follow-ups)

[work-pane.tsx:92-108](../../../packages/design-system/src/patterns/work-pane.tsx#L92-L108)

When WorkPane stacks, it puts the detail after the whole list, so choosing one of 1,196 controls appears to do nothing: at 390px the rationale field rendered at y=56,538 in a 652px scroller. At 1280×720 and 200% zoom, the sticky list label hides every focused row. The list also gives every row a Tab stop and never exposes which row is open, because Item's `isActive` is visual only. Responsive-2026-09-24 #1 covered WorkPane's viewport keying; the stacking is new.

**Fix:** make stacked WorkPane a drill-in whose Back returns focus to the row, as RecordBrowser's Back to results already does (D5), put `aria-current` on the active Item, and meanwhile scroll the detail into view on select and default the filter to "In effective set".

**5. The generic create and edit form cannot be completed in a short window or at zoom** (high · MOD-2, G5-3, G5-1, MOD-3, API-3)

[record-browser.tsx:816-820](../../../src/components/app/record-browser.tsx#L816-L820)

The generic product form scrolls a `<fieldset>`, which never scrolls inside the max-height dialog, and DialogContent clips its overflow with no scrollbar. On Create risk at 844×390, wheel, `scrollTo` and touch all leave the fieldset at 0, and a click on the primary lands on a combobox painted over the footer (Chrome 151 and 153). At 400% zoom, Link evidence scrolls its title and Close off the top and leaves a 32px results region. The kit has no body part, so 19 of 20 prototype overlays hand-build their scroll region.

**Fix:** add DialogBody and SheetBody, make the popup a fallback scroller with a minimum body height, and move the generic form's fieldset inside a scrolling `<div>`.

**6. Narrowed data shows the "nothing here" empty and removes the control that restores it** (high · EMP-1, PA4-2, DTC-3, PIK-4, PA1-6; also VW1-8, PA2-20, EMP-5, VW3-15)

[data-table.tsx:1203-1230](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1203-L1230)

DataTable chooses between "no records" and "filtered" from its own filter state only. On a system record, "Include everything inside" lives in the toolbar, which the no-records empty removes: WS-X90's Ground Support has 0 direct allocations and 486 in its subtree, so readers are told nothing is allocated and cannot widen the scope. In all four pickers the search filters data outside the table, so a typo reads as "Nothing published to add" with no Clear filters. The reverse also happens: My work opens on "Nothing matches, Clear filters" for a reader with nothing assigned.

**Fix:** add a caller-declared `narrowed` input to DataTable that selects the filtered branch and keeps the toolbar, and bind picker searches to `table.setGlobalFilter`, as the PickerSheet story already does.

**7. Focus is invisible on the controls every register keeps** (high · NAV-1, TLB-2, VW1-1, G3-3, A11-1, G3-2, DSC-1, G3-4, G3-1)

[scroller.tsx:315-335](../../../packages/design-system/src/components/scroller.tsx#L315-L335)

The saved-views trigger sits in a horizontal ScrollerViewport that clips its whole ring: on /programs the button spans y 106–134 and its ring would reach 102–138. The record name link, the primary opener on every register with a preview, loses its ring to the truncating cell span. Line tabs keep only two vertical bars inside their ScrollArea, and horizontal Stepper and Timeline steps, including the program's lifecycle gates, show almost none. All fail WCAG 2.4.7.

**Fix:** one kit rule: a clipping container either leaves 4px of ring room with padding (the kit bans margins) or draws an inset ring on focusable descendants with the `outline-field-focused` geometry, checked by a story assertion that a focused element's outline box lies inside its clipping ancestor.

**8. Create and edit dialogs return focus to the page body** (high · MOD-1, A11-4, VW3-1, PIK-6)

[create-task-dialog.tsx:256-258](../../../src/components/prototype/create-task-dialog.tsx#L256-L258)

After every create, edit, cancel or discard, keyboard and screen-reader users land at the top of the document and must tab past the skip links, the top nav and 17 side-nav items to get back. The reproduced cause is a React `autoFocus` on a field inside a dialog opened without a trigger: Base UI records that field as the return target. The requirement allocation dialog uses `initialFocus` instead and returns focus correctly. RecordPicker drops focus on every close for the same reason.

**Fix:** replace `autoFocus` in overlay content with `initialFocus`, keep triggers enabled while their dialog is open, pass `finalFocus` where the opener disappears, and assert focus return in test:patterns.

**9. Saving drops focus, because every loading button is also disabled** (high · BTN-1, G4-13, BTN-6)

[create-task-dialog.tsx:457-458](../../../src/components/prototype/create-task-dialog.tsx#L457-L458)

Eleven call sites pass the pending flag to both `isLoading` and `disabled`, so pressing Create task, Add from library or Create program moves focus to the body and shows the spinner on a grey disabled button instead of the loading palette. This was reproduced with the create-task request held for 3 seconds and then failed: afterwards the reader has to find the button again. Several dialogs also swap the label to "Saving…" on a natively disabled button.

**Fix:** drop the pending flag from `disabled` at the call sites, since `isLoading` already blocks activation, and add a lint rule that flags a `disabled` expression reusing the `isLoading` identifier.

**10. The program wizard loses focus at every step and blocks validate-on-submit** (high · G2-3, STR-1, STR-2, INP-3, PA1-3, VW2-15)

[program-wizard.tsx:399-427](../../../src/components/app/program-wizard.tsx#L399-L427)

Continue disables itself on arriving at an incomplete step, and the kit Stepper swaps the current step's button for a span, so focus is lost at each step change and nothing announces the new step. The reason is a vague title on the disabled button and a grey footer hint that names one issue at a time. This is the only way to create a program, and it breaks the Forms rule "validate on submit with the primary enabled".

**Fix:** keep Continue and Create program enabled, validate on press with errors at the fields, move focus to the new step's heading, and keep the current Stepper step a stable button carrying `aria-current="step"`.

**11. No product form tells the reader which field is wrong** (high · INP-1, INP-2, GAP-1, PA1-7, PA2-9, PA3-1, VW3-5, PA4-8, PA5-9, FDB-1 · form alerts first raised in the 17 September pattern audit)

[field.tsx:63-75](../../../packages/design-system/src/components/field.tsx#L63-L75)

Field only does layout, so wiring an error costs five attributes and two ids per field, and no product form does it. Errors arrive one at a time as a sentence at the bottom of the scroll body, no field is marked invalid, and focus stays on the submit button; CreateTaskDialog, the reference every screen copies, behaves this way. Form-level messages are 53 hand-written `<p role="alert">` in 35 files.

**Fix:** decide how Field binds (D1), rebuild CreateTaskDialog with a FieldError per field and focus on the first invalid one, and name Alert with an explicit role as the form-level message in product-patterns.md.

**12. On phones the side-nav overlay looks modal but is not** (high · G2-1, SHA-1, SHA-3)

[side-nav.tsx:122-150](../../../packages/design-system/src/layout/shell/side-nav.tsx#L122-L150)

Below 1024px, opening the nav leaves focus on the covered toggle, and Tab reaches six controls under the nav or its scrim; nothing is inert, so screen-reader users can read and activate the page behind. Choosing a destination neither closes the overlay nor moves focus. The app hand-builds that step, and the schema inspector, which does not, stays covered after every navigation.

**Fix:** build the overlay on Base UI's modal focus management with the rest of the Shell inert and a visible Close, and have the kit close it and focus Main when a destination is chosen.

**13. Opening a preview on desktop leaves focus on the eye** (high · SHB-1, A11-8, SHB-2)

[panel.tsx:96-113](../../../packages/design-system/src/layout/shell/panel.tsx#L96-L113)

At desktop widths the panel does not take focus and is last in the tab order, so a keyboard user presses the eye and nothing seems to happen; reproduced on /findings at 1440px. To reach the preview they must tab through every remaining row. Close then returns focus to the opener captured when the panel mounted, not the eye the reader last used, although the contract expects later keys to stay inside the preview.

**Fix:** drop the compact-only guard so the labelled aside takes focus on open at every width, add an `initialFocus` prop with an opt-out, and return focus to the latest opener.

**14. The saved-views trigger's name hides its visible label on every register** (high · TLB-3, BTN-5, DTP-5, PRT-12, TLB-7, DTP-18, PA3-8)

[filter.tsx:403](../../../packages/design-system/src/patterns/data-table/filter.tsx#L403)

The trigger shows "All records 62" but is named "Saved questions", so a voice-control user who says "click All records" gets nothing and a screen-reader user never hears the active view (WCAG 2.5.3, Level A). This was reproduced on /work, /vendors, /catalog, /programs and /risks. ProductCollection makes it worse by injecting a one-option "All records" menu on about 32 of 43 collections, against the contract's rule to omit a capability the collection has no use for.

**Fix:** drop the `aria-label` so the visible text names the button, add its purpose as a visually hidden prefix, and remove ProductCollection's single-preset fallback.

**15. Row controls are named by database UUIDs** (high · DTC-1, DTP-2, PIK-2, PIK-1, G2-17, VW1-6, TBL-1)

[data-table.tsx:811](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L811)

Every selection checkbox is named "Select row" plus the row id, which in the app is a UUID, so choosing requirements to allocate means hearing a hex string for each of 538 rows. RecordBrowser shows the raw id as its preview header and in its Select label. Every eye is "Preview row" and every kebab "Row actions", so rows cannot be told apart.

**Fix:** name row controls from the readable row name DataTable already computes for More fields (the tree label, then the identity cell), with a `rowLabel` override, for select, reorder, preview, actions and details alike.

**16. Searches, filters and empty results are never announced** (high · A11-5, TLB-4, EMP-2, MNU-4, VW1-7, DTC-7)

[data-table.tsx:1266-1300](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1266-L1300)

A screen-reader user who types in a register search, picks a filter or changes page hears nothing: not the count and not "Nothing matches". The table sets no `aria-busy` while it loads. This was reproduced with a live-region recorder in Storybook and in the app, and the command palette's record search is silent in the same way. WCAG 4.1.3 fails wherever a visible status such as "Nothing matches" appears.

**Fix:** one debounced polite status inside DataTable ("8 of 24 tasks", "No matching tasks") with `aria-busy` while loading, and the same through a shared announcer for Command.

**17. Previews and rails print raw database values** (high · PA2-1, PA5-2, VW3-2, VW1-3, G2-6, PRV-10, VW3-3, PA4-16, PRT-7, VW1-12, PA3-3)

[record-summary-preview.tsx:74-89](../../../src/components/prototype/record-summary-preview.tsx#L74-L89)

RecordSummaryPreview lists every column when its caller gives no fields, so the Assessment campaigns preview, the allocation preview and every AssessmentTable preview show UUIDs, raw enums and ISO timestamps, while the owner and program name are missing. ModelFacts and ModelTable print `in_progress` on one record where its sibling shows a badge. In a compliance tool this reads as a bug and undercuts trust in the record.

**Fix:** make `fields` required on RecordSummaryPreview and route every fact and generic cell through one formatter that renders statuses, enums, dates and relations by kind.

**18. The same timestamp shows different days on different screens** (high · DAT-3, PRT-8, PA5-12, GAP-9)

[work-format.ts:3-11](../../../src/components/prototype/work-format.ts#L3-L11)

The app never mounts LedgerProvider, so kit date columns format in UTC while app facts use the host zone: a task due at 11:59 PM PDT on 18 September reads Sep 19 in My work and Sep 18 on its record. Reproduced in Asia/Tokyo, WS-X90 shows "Updated at: Sep 12, 2026" in /records/programs and "Updated 9/13/2026, 3:01:21 AM" in its Details rail. A fourth format leaks raw "2026-10-02" into POA&M tables, because the `/_(at|on)$/` key test misses `_date` columns.

**Fix:** mount LedgerProvider in `__root` with the reader's zone (D4), replace `displayDate` and `toLocaleString` with the provider's formatters, and choose column kinds from the schema type rather than the key name.

**19. One status, several colours** (high · STS-1, VW1-2, PA2-2, VW2-5, STS-11 · tracked in docs/next.md, "A domain component layer")

[record-tools.tsx:37-45](../../../src/components/prototype/record-tools.tsx#L37-L45)

Seven local tone mappers disagree, so WS-X90's "Active" is grey on Portfolio and green in its Details rail, and "Blocked" is red in My work and amber in program tables. Severity and impact are drawn as pills, with Low in success green, against the Indicator rule. Readers learn that colour cannot be trusted.

**Fix:** one status map in `src/lib` (label, tone and sort rank for every enum) with one app component that `c.status` also uses, and severity drawn as Indicator (D3).

**20. Control names on the Controls tab open the schema inspector** (high · VW2-1)

[ssp-assembly.tsx:388](../../../src/components/prototype/ssp-assembly.tsx#L388)

On WS-X90's Controls tab (546 controls), all 20 title links on the first page point under `/records/selected_controls/`, so the most-used compliance register sends readers into a diagnostic view with a UUID title and raw timestamps. The designed control record, with its narrative and contributions, can only be reached by typing its URL.

**Fix:** add an `implemented_requirements` case to `recordDestination` that returns `/programs/$programId/controls/$controlId` when the row has an implementation, and open the preview when it does not.

**21. Writing a task comment means passing seven relationship pickers** (high · PRT-1)

[tasks.$taskId.tsx:84-98](../../../src/routes/tasks.$taskId.tsx#L84-L98)

Create comment opens the generic schema dialog, whose labels run Program, Issue, Risk, POA&M item, Assessment campaign, Evidence artifact, Package and only then Body. Setting any of the pickers can only fail the save against the comments table's exactly-one-target check. This is the contract's reference record page, so other record pages copy it.

**Fix:** rank `body` first in the shared form's leading fields and hide the rest of a polymorphic target group once context sets one; an inline Composer is the follow-up (D11).

**22. Preview navigation stops at the table page** (high · PRV-1)

[record-preview.tsx:334-342](../../../src/components/prototype/record-preview.tsx#L334-L342)

`useDisplayedRecords` reads the paginated row model, so on /findings the footer says "1–20 of 62" while the preview announces "1 of 20 records", and Next disables after 20 with no visible reason. An assessor walking hundreds of requirements must close the preview, page the table and reopen it every 20 records. The page bound is written into the contract.

**Fix:** walk the pre-pagination row model and advance the table page as Next crosses it, and change the contract line with it (D6).

**23. Responsive tables give the spare width to the code column** (high · DTP-4)

[responsive.ts:17-20](../../../packages/design-system/src/patterns/data-table/responsive.ts#L17-L20)

Once the columns fit, the responsive layout hands all slack to the identity and draws every unsized text column at its minimum. On the Catalog CCIs register at 1440px the CCI column is 447px wide and Definition 150px, so readers must open every row to read a definition. This overrides the documented rule that authors size the fixed columns and one column takes the slack.

**Fix:** share slack among the unsized columns, keep the author's width as the identity's target, and add a story asserting that an unsized text column grows at 1280px.

**24. Highlight, pressed and selected states are faint tints that vanish in forced colours** (high · A11-2, TOK-1, MNU-1, SEL-2, BTN-2, TOK-7, G6-8)

[menu.ts:10-13](../../../packages/design-system/src/components/menu.ts#L10-L13)

In menus, Select, Combobox and Command, the keyboard highlight is a light fill that disappears under Windows High Contrast; reproduced by sampling pixels with forced colours off and on. Toggle and ToggleGroup draw pressed in the same 6% grey as hover, so the colour-mode switch on every page fails WCAG 1.4.11, and Tree selection has the same gap. DataTable selection is unaffected because its checkbox carries the state.

**Fix:** give each state a second cue (an inset outline for highlight, a border or icon change for pressed, a start-edge bar for selection) and add Highlight and HighlightText rules for `[data-highlighted]`, `[data-pressed]` and `[aria-selected]` to forced-colors.css.

**25. Checkbox, radio and switch boundaries are below 3:1** (high · TOK-3, CTL-7, A11-3, CTL-3 · open decision in docs/next.md:71)

[checkbox.tsx:15](../../../packages/design-system/src/components/checkbox.tsx#L15)

Checkbox and Radio draw their box in `color.border.input`, at 1.87:1 against the page, so low-vision readers may not see that an unchecked choice exists (WCAG 1.4.11). The Switch off track is 1.12:1 in light mode and 1.19:1 in dark. These are the most common form controls, in forms, filter menus and every selection column.

**Fix:** give Checkbox and Radio `color.border.bold` (3.78:1) or a new choice-border token at 3:1 or more, give the Switch off track its own 3:1 token, and add the pairs to contrast.test (D2).

## Themes

**Clipping containers cut off the focus ring.** The kit's ring is drawn outside the element, and scrollers, truncating cells, clipped cards and ScrollArea viewports cut it away; the kit patches this one case at a time. Ids: NAV-1, TLB-2, VW1-1, G3-3, A11-1, G3-2, DSC-1, G3-4, G3-1, NAV-4, G3-10, G3-5, G3-6, G3-11, EDT-1, CNT-9, G3-12, FDB-9, CHO-3, G3-8, G5-2, G5-4. Systemic fix: a rule that every part that clips either leaves ring room with padding or gives focusable descendants an inset ring (the `outline-field-focused` geometry under a general name), enforced by one story-run assertion instead of per-part review.

**Focus is dropped where one surface hands over to another.** Base UI returns focus correctly by default, and four mechanisms defeat it: `autoFocus` inside dialogs opened without a trigger (MOD-1, A11-4, VW3-1, PIK-6); `disabled` on the focused button (BTN-1, G4-13, BTN-6, TLB-5, DTP-10, G2-3, INP-3); elements swapped or unmounted under focus (STR-2, STR-1, TLB-11, PRV-4, G4-10); and hosts with no focus contract (SHB-1, A11-8, SHB-2, PRV-3, SHA-1, SHA-3, G2-1, A11-7, PGL-11). Systemic fix: three written rules on the Guidance page (never disable or unmount the focused control, never `autoFocus` inside an overlay, keep an element's type stable across states), a focus contract for every host (Panel, the phone overlay, route changes), lint rules for the first two, and a test:patterns assertion of where focus lands after each close.

**State is shown by a faint tint or by colour alone.** Highlight, pressed, selected, the current page and in-text links rely on fills of about 1.1–1.4:1 or on hue, and most disappear in forced colours, which CI tests for four families. Ids: A11-2, TOK-1, MNU-1, SEL-2, TOK-4, TOK-7, G6-8, BTN-2, BTN-8, MOD-9, FLT-3, DAT-6, STR-9, SHA-5, G6-3, G6-4, G6-5, G6-6, TOK-3, CTL-7, A11-3, CTL-3, INP-12, G2-2, CNT-1, A11-10, STS-6, STS-7, CHF-6, CHX-6, TOO-7. Systemic fix: a second cue for every state (an inset outline, a start-edge bar, a border or icon, an underline), one forced-colours rule set keyed on the shared data attributes, the forced-colours project run over every family, and a 3:1 pair for each state in contrast.test.

**Changes happen silently.** Results, empties, route changes, preview steps and suggestion lists update without a status message, and each part that does announce builds its own region. Ids: A11-5, TLB-4, EMP-2, MNU-4, VW1-7, DTC-7, A11-6, A11-7, PGL-11, PRV-6, EDT-13, PIK-13, DTP-11, G4-10, CHF-1, CHX-1, FDB-13. Systemic fix: one `announce()` helper backed by persistent polite and assertive regions that Shell mounts once, used by DataTable, Command, route changes and PreviewNavigation; DataTable's column-move `useStatus` is the starting point.

**The kit stops one part short, so screens rebuild the rest.** Dialog has no body, width or lock; Field has no binding; there is no disclosure header, heading-level context, single-selection mode, narrowing input, linked Stat or record search. Each gap has produced drifting hand-built copies: 19 dialog scroll bodies, 13 dialog pixel widths, 53 form alerts, and a collapsed Details section built five ways. Ids: API-3, MOD-3, MOD-4, MOD-10, GAP-4, TOK-10, TOO-4, INP-1, GAP-1, FDB-1, DSC-2, REC-6, PGL-12, PGL-1, API-4, PRV-9, PRM-1, PRM-2, DTC-2, DTP-3, PIK-11, EMP-1, DTC-3, PIK-4, TLB-10, STA-1, GAP-12, MNU-5, SHA-3, EDT-3. Systemic fix: add the missing part and migrate every copy in the same pull request, and add a lint rule wherever the copy is detectable (pixel widths on DialogContent, `role="alert"` on plain elements, native `<details>`, raw h1–h6 with font classes).

**Readers see the database, and one concept renders several ways.** UUIDs stand in for names, raw enums and ISO timestamps reach previews, link-table names reach buttons ("Create issue poa&m"), and there are seven tone maps and four date formats. Ids: PA2-1, PA5-2, VW3-2, VW1-3, G2-6, PRV-10, VW3-3, PA4-16, PRT-7, VW1-12, PA3-3, VW1-4, DTC-1, DTP-2, PIK-1, PIK-2, VW3-11, STS-1, VW1-2, PA2-2, VW2-5, STS-11, DAT-3, PRT-8, PA5-12, GAP-9, VW3-4, PA2-12, CNT-5, REC-7, VW1-11, PA2-11, CNT-12, VW3-19. Systemic fix: the domain component layer docs/next.md already proposes (D3): one status map, one fact and cell formatter, one date rule through LedgerProvider, a readable row name by default, and adapters that cannot fall back to a raw column.

**The test vehicle no longer exercises the kit, and the gates miss whole classes of failure.** The prototype renders no chart and uses no Stat, Attachment, DatePicker, Composer or Item.Group, and hand-builds activity feeds and metric tiles, so defects in those parts surface late (GAP-10, CHF-15, CHX-17, CHO-20, STA-2, DAT-4, EDT-16, API-20, CNT-8, PRT-2, STR-11, REC-14). CI never emulates touch, never runs axe's target-size rule, covers forced colours for four families and runs no axe on the app, and the token lint never reads `classes()` (TOO-1, SEL-9, TOO-5, TOO-7, TOO-8, TOO-9, TOO-10, G2-18, A11-12, G1-12, G8-8, TOK-13, G6-12). Systemic fix: move the hand-built screens onto the parts, count product usage per part in ds-check, and add the missing gates as one batch.

## Order of work

Each batch below is sized as one pull request. The responsive session's uncommitted change set covers most of the DataTable, Toolbar, Scroller, Table, Tree, Item, KeyValue, TextLink, Timeline, Section, Inspector, WorkPane, Editable, Panel and chart files, plus `eslint-plugin/index.js`, `vitest.config.ts`, `layout.css`, `CHANGELOG.md`, `docs/next.md` and `product-patterns.md`. Batches 1 to 10 stay out of those source files; they still add changelog and contract entries, so rebase those onto that session's commit. Batches 11 to 19 should start from that commit. Each batch adds the play or test:patterns assertion its findings name.

### Start now

1. **Keep the reader's work.** G4-1, G4-2, G4-3, PA3-2, G7-1, GAP-2. Early returns only when `data === undefined`; `keepPreviousData` and DataTable `state="loading"` in ProductCollection, so a keyed query never unmounts the toolbar; a confirmation and a toast on Publish, and Create requirement version through the Dialog; Sign out and an involuntary sign-out held behind a draft check and an in-place re-authentication dialog. App files only.
2. **Keep the reader's focus.** MOD-1, A11-4, VW3-1, PIK-6, BTN-1, G4-13, BTN-6, CTL-4, PA4-1, and the PA1-1 interim. `initialFocus` instead of `autoFocus` in every overlay, starting with CreateTaskDialog; enabled triggers and `finalFocus` where an opener disappears; pending flags out of `disabled`; RadioGroup for the evidence decision; in the tailoring dialogs, scroll the detail into view and default the filter to "In effective set". App files, plus `record-picker.tsx`, which is outside the responsive set.
3. **Destinations, trails and tabs.** VW2-1, PGL-10, PA4-3, NAV-2, VW2-4, NAV-9, NAV-10, PA4-4, VW2-3, DSC-4, PA2-4, DSC-5, PA2-3, PA4-15, PRT-12 (app half), TLB-7, DTP-18, PA3-8, PRT-1, VW3-4, PA2-12, TOK-2. The control record destination; one `TrailLink` adapter with `activeOptions={{ exact: true }}` at all 21 trail sites; focused views as `DropdownMenuLinkItem`s; `keepMounted` and real tab panels on register and draft tabs; ProductCollection omitting `views` when there are none; Body first in the shared form and an exhaustive `productRecordNoun`; the shadcn reference theme out of `src/styles.css`. App files, plus ButtonGroupSeparator's variant spelling.
4. **Overlays: body, width and short heights.** API-3, DOC-2, MOD-3, MOD-10, G5-3, A11-15, MOD-5, G5-1, G5-5, then MOD-2, TOK-10, TOO-4, PA2-10, PA3-14, PA5-10, PA1-13. DialogBody, SheetBody, DrawerBody and AlertDialogBody; a `width` preset (small, medium, large, xlarge, fullscreen) named per axis-policy.json; the popup as fallback scroller with a short-height rule; RecordBrowser's context inside its results scroller; then every product dialog moved off inline pixel widths. The dismissal lock (MOD-4, GAP-4) joins once D8 is settled. The kit files are outside the responsive set.
5. **Forms that say what is wrong** (after D1). INP-1, INP-2, GAP-1, INP-3, INP-5, INP-13, G2-3, STR-1, STR-2, PA1-3, VW2-15, PA1-7, PA2-9, PA3-1, VW3-5, PA4-8, PA5-9, FDB-1, FDB-5, CTL-1, CTL-2, SEL-3. Field binding, with the controls and FieldSet's disabled state following it; invalid choice controls that still show focus; the Stepper's current step kept a button; then CreateTaskDialog first, because it is the reference, followed by the wizard and the generic form; Alert with an explicit role named in the Forms contract. The kit files are outside the responsive set.
6. **State cues and contrast.** A11-2, TOK-1, MNU-1, SEL-2, TOK-4, TOK-7, G6-8, BTN-2, BTN-8, MOD-9, FLT-3, DAT-6, then, after D2, TOK-3, CTL-7, A11-3, CTL-3, G6-9, INP-12, G6-7. A second cue per state, one forced-colours rule set in `forced-colors.css`, then the choice-control and Switch tokens with their contrast.test pairs. Tree selection (STR-9), ToggleGroup and the forced-colours project list (TOO-7) touch responsive-set files and wait for batch 19.
7. **Command, Combobox and the global search.** MNU-3, MNU-4, MNU-2, MNU-5, MNU-6, MNU-12, PA1-9, SHA-10, SHB-11, PIK-13, SEL-1, SEL-5, SEL-8, TOO-3. An active descendant that follows the selection and a live count in Command; filtering on labels, not ids; a record-search pattern with loading and error states, or at least a palette the app can relabel; ComboboxInput's chevron out of the tab order, and `autoHighlight`. Outside the responsive set.
8. **The Shell's focus contract.** G2-1, SHA-1, SHA-3, SHA-4, A11-6, A11-7, PGL-11, then SHB-1, A11-8, SHB-2, SHB-10. The phone overlay on Base UI's modal focus management with the rest of the Shell inert; the kit closing it and focusing Main on navigation; one `announce()` helper mounted by Shell, with a router-agnostic route-change helper. `side-nav.tsx` and `root.tsx` are outside the responsive set; the panel half (focus on open at every width, the latest opener, Escape that ignores editable targets) touches `panel.tsx`, which is inside it.
9. **One status, value and date layer** (after D3 and D4). STS-1, VW1-2, PA2-2, VW2-5, STS-11, VW3-2, PA2-1, PA5-2, VW1-3, G2-6, PRV-10, VW3-3, PA4-16, PRT-7, VW1-12, PA3-3, VW1-4, VW1-11, PA2-11, VW3-19, CNT-5, REC-7, DAT-3, DAT-5, PRT-8, PA5-12, GAP-9, DOC-6. One status map and component; one fact and cell formatter; `fields` required on RecordSummaryPreview; OSCAL parameter inserts shown as labelled placeholders; LedgerProvider in `__root`; column kinds from the schema type; Absent with accessible text. App files, plus Absent in `typography.tsx` and a Locale docs page.
10. **Preview navigation** (after D6). PRV-1, PRV-2, PRV-3, PRV-6, PIK-8. Walk the pre-pagination rows and advance the page; announce the record, not only its position; return focus to the invoking eye on Back. `record-preview.tsx`, the preview tests and RecordBrowser; the contract line in `product-patterns.md` changes with it.

### After the responsive session commits

11. **Room for the focus ring.** NAV-1, TLB-2, VW1-1, G3-3, A11-1, G3-2, DSC-1, G3-4, G3-1, NAV-4, G3-10, G3-5, G3-6, G3-11, EDT-1, CNT-9, G5-2, G2-2, CNT-1, A11-10. Inset rings for focusable descendants of scrollers, truncating cells and clipped cards; padding without margins where an inset ring does not fit; the global focus scroll-margin scoped to the page; TextLink underlined inside text; and the clipping assertion in the story run. The Tabs, ScrollArea and Stepper half is outside the responsive set and can go first.
12. **DataTable names and announcements.** DTC-1, DTP-2, PIK-2, PIK-1, G2-17, VW1-6, TBL-1, TLB-3, BTN-5, DTP-5, PRT-12 (kit half), A11-5, TLB-4, EMP-2, DTC-7, VW1-7. Row controls named from the readable row name with a `rowLabel` override; the views trigger named by its visible text, with `test-demo-browser.mjs` and the stories that query "Saved questions" updated; one debounced polite status and `aria-busy`, through batch 8's announcer.
13. **DataTable narrowing, single selection and picker search.** TLB-1, EMP-1, PA4-2, DTC-3, PIK-4, PA1-6, VW1-8, PA2-20, EMP-5, VW3-15, DTC-2, DTP-3, PIK-11, PA3-17, PIK-5, TLB-10. The Toolbar's Enter guard first, since it is one line; a `narrowed` input; `selectable: "single"`; PickerSheet owning its search through `setGlobalFilter`, with pending, error and `initialFocus`; then the four pickers and three system tabs moved onto them.
14. **DataTable rendering and fitting.** PRF-1, PRF-2, DTC-4, DTP-21, DTP-4, DTP-8, PRF-3. A row memo that holds (a stable `leading`, a value-keyed layout context, a latest-ref `onRowClick`); re-fit only when the fitted set changes; slack shared among unsized columns; the 1,196-control baseline picker virtualised; a render-count story test.
15. **Editable keeps the draft.** EDT-2, G4-15, EDT-3, EDT-5, EDT-6, EDT-7, EDT-10. A refused save keeps the draft with Retry and Discard; editing and draft callbacks so the requirement form stops listening to internal events; Escape that stops at the editor; a temporary lock in place of the disabled fieldset.
16. **WorkPane, Item and Tree rows** (after D5). REC-1, PA1-1, G5-4, G5-9, REC-2, CNT-3, REC-10, REC-11, PA1-2, STR-3, STR-4, STR-5, VW2-6. Stacked WorkPane as a drill-in; the list as one composite with a selected state; `aria-current` on active Items; Tree labels that truncate, a trailing slot that shrinks and a row name without the trailing content.
17. **Headings and disclosure** (after D7). PRM-1, PRM-2, API-4, A11-16, PGL-1, PRV-9, PGL-3, PA2-6, PA5-6, PA4-10, PA1-8, G2-5, DSC-3, REC-16, EMP-3, DSC-2, REC-6, PGL-12, REC-4, G8-4. A heading-level context; `render` on PageHeader.Title; EmptyTitle as a heading; one disclosure header for the collapsed Details section, with a chevron that follows `data-panel-open`.
18. **Charts.** CHO-1, CHF-1, CHX-1, CHF-2, BTN-11, CHF-3, CHO-2, CHO-3, G3-8, G3-9, CHX-2, CHF-6, CHX-6. Texture defs in the Donut; a named plot with a persistent live region; one name for the Table toggle; legend clicks that clear the highlight; focusable marks where choosing is wired (D9); tick thinning that measures the drawn label. Last among the fixes, because no product screen renders a chart.
19. **Guards.** TOO-1, SEL-9, TOO-5, TOO-7, TOO-8, TOO-9, TOO-10, G2-18, A11-12, G1-12, G8-8, TOK-13, G6-12, TOO-17, STR-9. The token lint reads `classes()`, class constants and style props; tailwind-merge learns the width groups; the forced-colours project covers every family; a touch project and axe's target-size rule; an app axe suite built from G2's route list; long-content stories. The lint rules batches 2, 4 and 5 rely on land here too, unless the responsive session has already committed: `autoFocus` in overlay content, a `disabled` that reuses the `isLoading` identifier, pixel widths on DialogContent, and `role="alert"` on plain elements.

## Decisions for Josef

**D1. How does Field bind errors to its control?** (INP-1, INP-2, SEL-3, CTL-1)
Options: back the kit's Field with Base UI `Field.Root`, so `invalid`, `disabled` and `required` reach Input, Textarea, Select, Combobox, the choice controls and FieldError with ids and `aria-describedby` wired automatically; or keep Field presentational and write the app-side `useRecordForm` the Forms docs promise. The first reverses the removal recorded at Field.mdx:71.
Recommendation: back Field with `Field.Root`. It keeps Base UI underneath, gives FieldSet a disabled state the choice controls honour, and makes the correct form the short one to write.

**D2. What boundary do choice controls and fields get?** (TOK-3, CTL-7, A11-3, CTL-3, INP-12, G6-7; docs/next.md:71)
Options: keep `color.border.input` (1.87:1); use `color.border.bold` (3.78:1) for Checkbox and Radio only; add a choice-border token at 3:1 or more; raise text-field borders too, always or only under `prefers-contrast: more`. The Switch off track (1.12:1 light, 1.19:1 dark) needs its own token whichever is chosen, because `color.background.neutral` is shared with buttons and badges.
Recommendation: `color.border.bold` for Checkbox and Radio; `color.background.neutral.bold` for the Switch off track, as Atlassian's toggle does, provided it clears 3:1 on every surface; text fields unchanged except under `prefers-contrast: more`; and every pair in contrast.test.

**D3. Does the app get its domain component layer now?** (STS-1, VW1-2, VW3-2, PA3-3; docs/next.md:43)
Options: one status map in `src/lib` (label, tone and sort rank per enum) and one app component that every screen and `c.status` use, beside one fact formatter; or keep per-screen mappers and reconcile them by hand. Either way the binding stays in the app, not the kit.
Recommendation: build the layer. It is the only fix that stops the seven maps drifting again, and it closes the raw-value findings in the same pass. Draw severity and impact as Indicator, as status-vocabulary.md says.

**D4. Which zone do dates render in, and is "due" a day or an instant?** (DAT-3, DAT-5, DAT-13, PRT-8)
Options for the zone: the reader's browser zone, a profile setting, or UTC everywhere. Options for due: a calendar day (a date column and DatePicker, as POA&M planned completion already is) or an instant, shown with its time everywhere. Typed date entry, open since 4 September, rides on the same choice.
Recommendation: mount LedgerProvider with the reader's zone and keep it the same on server and client, and make task and assessment due a calendar day, since no screen shows the time today. Add typed entry to DatePicker in the same kit change.

**D5. What does WorkPane do when it stacks?** (REC-1, PA1-1, G5-4; docs/next.md, Responsive follow-ups)
Options: a drill-in (the list, then the detail with a Back that returns focus to the row); scroll the detail into view and focus its heading; or never stack, and keep the tailoring dialogs wide.
Recommendation: the drill-in, copying RecordBrowser's Back to results. Ship the scroll-and-focus interim in batch 2 so tailoring works while the kit change lands.

**D6. How far does preview navigation walk, and what does Close mean?** (PRV-1, PRV-2)
The contract says previous and next "follow the current filter, sort, page and tree state", so navigation stops at the page edge and counts 20 of 62. Options: keep the page bound and report the full count; or walk the whole filtered, sorted set and advance the table page as Next crosses it. Separately, Close and Escape in a nested frame pop one frame, which test-preview-frames.mjs asserts and PreviewSheet contradicts.
Recommendation: walk the whole set and advance the page, as Polaris and Jira do; make Close and Escape dismiss the whole preview and keep Back as the only way to pop a frame. Both change product-patterns.md and the preview tests.

**D7. Which title sizes does Heading own, and how do levels change?** (PRM-1, PRM-2, PGL-1, PGL-3, API-4)
Options: re-cut `font.heading` and Heading to the sizes the kit ships (the page and record title at 20/26 semibold, and a section-title size) and build PageHeader.Title, Section.Title and the overlay titles on it; or restyle those titles onto the existing ramp. Either way, levels need an override (`render` on PageHeader.Title) and a context, so a Section under an h2 becomes an h3.
Recommendation: re-cut the ramp to what ships, which changes no screen, and add the heading-level context in the same batch.

**D8. Where does the pending-save dismissal lock live?** (MOD-4, GAP-4, API-3)
Options: a kit prop on Dialog, Sheet and AlertDialog that cancels every dismissal reason, disables Close and sets `aria-busy`; or the app's `useDraftGuard` as the only mechanism, adopted by every dialog.
Recommendation: both, split by job. The kit lock covers PickerSheet and RecordBrowser, whose Cancel and X look enabled during a save and do nothing; `useDraftGuard` stays the one app hook for dirty state, route blocking and `beforeunload`.

**D9. Can the keyboard choose chart marks?** (CHO-2; docs/next.md:123)
The 4 September decision was no roving tabindex on marks, and the 18 September deep audit reversed it for the Treemap only. The Donut's and Scatter's `details` cards are pointer-only, and their plot is a dead tab stop.
Options: focusable marks wherever `onSelect` or `details` is set; or pointer-only choosing with a page control as the alternative, and no `details` on these parts.
Recommendation: focusable marks when choosing is wired, as the Treemap now does, and `role="img"` with no tab stop when nothing chooses.

**D10. Can a reader remove an allocation, a control mapping or an evidence link?** (PA5-3)
Today only the schema inspector can. Options: Remove, with a destructive confirmation through a domain command; retire the link so its history stays visible; or keep removal in the inspector.
Recommendation: Remove, behind `useConfirmation` and a command in `src/lib`, with a toast. Retire only if an assessor must see that a link once existed. The work is app-only and fits batch 3.

**D11. Are task comments a dialog or an inline Composer?** (PRT-1, EDT-16)
Options: keep Create comment as the generic Dialog, with Body first and the target group hidden; or write comments in an inline Composer under the Comments section, a new closed exception under Forms. The Composer page already names comments, and Composer has no consumer.
Recommendation: fix the shared form now (batch 3), then adopt the Composer as a named exception, which also puts Composer under test in the app.

**D12. What does the preview do between 1024 and 1279px?** (SHB-6)
By design the panel replaces the whole register at these widths, so the list, its filters and the reader's row disappear on small laptops and iPad landscape. Options: keep the replacement; collapse the side nav to its icon rail while a panel is open; or overlay the panel on the end of Main.
Recommendation: collapse the side nav to the rail, which leaves Main about 560px at 1180, and keep full replacement below 1024. Record the rule in Shell.mdx.

**D13. What shape is a dashboard?** (VW1-15, VW1-16, PRT-6, STA-5)
screen-inventory.json declares that each Portfolio collection owns its toolbar, and product-patterns.md has no dashboard section, so the Portfolio embeds two full registers and a hand-built metric strip. Options: keep that; or write a dashboard shape into the contract: a Stat band whose tiles link to filtered registers, top-N widgets with View all and no Columns, Settings or pagination, and a Timeline activity feed.
Recommendation: write the dashboard shape first, then rebuild the Portfolio on it. Linking a Stat.Tile needs a kit addition (STA-1).

## How to read the rest

Every finding keeps its id, so an id cited above can be searched for in the part that owns its unit. Low-severity findings sit in a table at the end of each group.

- [Missing components and patterns](missing.md): what the kit lacks, what to add now, and the variants, props and states existing parts are missing.
- [Prototype conformance](prototype.md): `src/` read against the product pattern contract, with the kit gaps the screens work around.
- [Walk of the running app](app-walk.md): what the three signed-in walks saw at 1440 and 390.
- [Cross-cutting findings](cross-cutting.md): API consistency, systemic accessibility, documentation, performance and packaging.
- [Coverage-gap round](coverage-gaps.md): units G1 to G8, the dimensions the first round had not covered systematically.
- Family deep dives: [actions and inputs](actions-inputs.md); [overlays, menus and disclosure](overlays-menus.md); [tables and collection controls](tables.md); [status, feedback and content display](display-feedback.md); [navigation, shell, page layout, primitives and tokens](layout-foundations.md); [charts](charts.md); [editing, record and selection patterns, previews and tooling](patterns-tooling.md).
- [Appendix](appendix.md): the method, every unit with its counts, what the audit did not do, and the claims verifiers refuted.

### Where each id lives

| Id prefix | Unit | Part |
|---|---|---|
| GAP | Missing components and patterns (gap analysis) (cross-cutting lens) | [Missing components and patterns](missing.md) |
| PA1 | Prototype conformance: app shell, wizard, tailoring, record browser, fields (prototype slice) | [Prototype conformance](prototype.md) |
| PA2 | Prototype conformance: assessments, findings, packages, SSP, work (prototype slice) | [Prototype conformance](prototype.md) |
| PA3 | Prototype conformance: libraries and products (prototype slice) | [Prototype conformance](prototype.md) |
| PA4 | Prototype conformance: program and system views (prototype slice) | [Prototype conformance](prototype.md) |
| PA5 | Prototype conformance: requirements, evidence, previews, record tools (prototype slice) | [Prototype conformance](prototype.md) |
| PRT | Prototype conformance: routes (prototype slice) | [Prototype conformance](prototype.md) |
| VW1 | App walk: dashboards and global registers (app walk) | [Walk of the running app](app-walk.md) |
| VW2 | App walk: program record, program tabs and focused views, wizard (app walk) | [Walk of the running app](app-walk.md) |
| VW3 | App walk: record pages, forms, confirmations, dark mode, keyboard (app walk) | [Walk of the running app](app-walk.md) |
| API | Kit-wide API consistency (cross-cutting lens) | [Cross-cutting findings](cross-cutting.md) |
| A11 | Systemic accessibility (cross-cutting lens) | [Cross-cutting findings](cross-cutting.md) |
| DOC | Documentation and guidance quality (cross-cutting lens) | [Cross-cutting findings](cross-cutting.md) |
| PRF | Performance and packaging (cross-cutting lens) | [Cross-cutting findings](cross-cutting.md) |
| G1 | Long, unbroken and expanded content stress (plus WCAG 1.4.12 text spacing) (coverage gap) | [Coverage-gap round](coverage-gaps.md) |
| G2 | Axe and console sweep of every app route and open state (coverage gap) | [Coverage-gap round](coverage-gaps.md) |
| G3 | Systematic focus-indicator sweep: clipping and contrast, light and dark (coverage gap) | [Coverage-gap round](coverage-gaps.md) |
| G4 | Slow and failing loads on record pages, program tabs, previews and pickers (coverage gap) | [Coverage-gap round](coverage-gaps.md) |
| G5 | Reflow at short heights (400% and 200% zoom) for overlays and the shell (coverage gap) | [Coverage-gap round](coverage-gaps.md) |
| G6 | Non-text contrast and state visibility in dark mode (coverage gap) | [Coverage-gap round](coverage-gaps.md) |
| G7 | Sign-in, workspace bootstrap, session end and account flows (coverage gap) | [Coverage-gap round](coverage-gaps.md) |
| G8 | Reduced motion at runtime, with interactions (coverage gap) | [Coverage-gap round](coverage-gaps.md) |
| BTN | Actions: Button, IconButton, ButtonGroup, Toggle, ToggleGroup (kit family) | [Family deep dive: actions and inputs](actions-inputs.md) |
| INP | Text inputs and fields: Input, Textarea, InputGroup, Field, Forms recipes (kit family) | [Family deep dive: actions and inputs](actions-inputs.md) |
| CTL | Choice controls: Checkbox, RadioGroup, Switch, controls.tsx (kit family) | [Family deep dive: actions and inputs](actions-inputs.md) |
| SEL | Select and Combobox (kit family) | [Family deep dive: actions and inputs](actions-inputs.md) |
| DAT | Dates: Calendar and DatePicker (kit family) | [Family deep dive: actions and inputs](actions-inputs.md) |
| MOD | Modal overlays: Dialog, AlertDialog, Sheet, Drawer (kit family) | [Family deep dive: overlays, menus and disclosure](overlays-menus.md) |
| FLT | Floating: Popover, HoverCard, Tooltip (kit family) | [Family deep dive: overlays, menus and disclosure](overlays-menus.md) |
| MNU | Menus and commands: DropdownMenu, menu.ts, Command, CommandPalette, command-keys, Kbd (kit family) | [Family deep dive: overlays, menus and disclosure](overlays-menus.md) |
| DSC | Disclosure: Tabs, Collapsible, Accordion (kit family) | [Family deep dive: overlays, menus and disclosure](overlays-menus.md) |
| TBL | Table (plain) and table-state (kit family) | [Family deep dive: tables and collection controls](tables.md) |
| DTC | DataTable core (kit family) | [Family deep dive: tables and collection controls](tables.md) |
| DTP | DataTable parts: columns, filters, columns menu, group-by, reorder, selection bar, pagination, metrics, responsive (kit family) | [Family deep dive: tables and collection controls](tables.md) |
| TLB | Toolbar, ActionBar, Pagination component (kit family) | [Family deep dive: tables and collection controls](tables.md) |
| STS | Status and identity: Badge, Count, Dot, Indicator, FilterChip, status-tone, Avatar, Id (kit family) | [Family deep dive: status, feedback and content display](display-feedback.md) |
| FDB | Feedback: Alert, Banner, Toaster, Progress, Spinner, Skeleton (kit family) | [Family deep dive: status, feedback and content display](display-feedback.md) |
| EMP | Empty states: Empty and its illustrations (kit family) | [Family deep dive: status, feedback and content display](display-feedback.md) |
| CNT | Content display: Card, Item, KeyValue, Fact, Separator, Typography, CodeBlock, TextLink (kit family) | [Family deep dive: status, feedback and content display](display-feedback.md) |
| STR | Structures: Tree, Timeline, Stepper (kit family) | [Family deep dive: status, feedback and content display](display-feedback.md) |
| STA | Stat and Attachment (kit family) | [Family deep dive: status, feedback and content display](display-feedback.md) |
| NAV | Navigation and scrolling: Breadcrumb, Scroller, ScrollArea, Resizable (kit family) | [Family deep dive: navigation, shell, page layout, primitives and tokens](layout-foundations.md) |
| SHA | Shell A: root, context, side nav, overlay, storage (kit family) | [Family deep dive: navigation, shell, page layout, primitives and tokens](layout-foundations.md) |
| SHB | Shell B: top nav, panel, splitter (kit family) | [Family deep dive: navigation, shell, page layout, primitives and tokens](layout-foundations.md) |
| PGL | Page layout: PageHeader, Section, PageSkeleton, slots, landmark title, fill window (kit family) | [Family deep dive: navigation, shell, page layout, primitives and tokens](layout-foundations.md) |
| PRM | Primitives: Box, Stack, Inline, Flex, Grid, Bleed, Text, Heading (kit family) | [Family deep dive: navigation, shell, page layout, primitives and tokens](layout-foundations.md) |
| TOK | Tokens, theming, colour mode, density, global styles (kit family) | [Family deep dive: navigation, shell, page layout, primitives and tokens](layout-foundations.md) |
| CHF | Chart foundation: shared, Frame, Chart (kit family) | [Family deep dive: charts](charts.md) |
| CHX | Cartesian charts: Bar, Line/Area, Sparkline (kit family) | [Family deep dive: charts](charts.md) |
| CHO | Other charts: Donut/gauge, Scatter, Heatmap, Treemap (kit family) | [Family deep dive: charts](charts.md) |
| EDT | Editing patterns: Editable, Composer (kit family) | [Family deep dive: editing, record and selection patterns, previews and tooling](patterns-tooling.md) |
| REC | Record display patterns: Inspector, Related, Glance, Gates, TaskRow, WorkPane (kit family) | [Family deep dive: editing, record and selection patterns, previews and tooling](patterns-tooling.md) |
| PIK | Selection patterns: PickerSheet, RecordPicker, RecordBrowser (kit family) | [Family deep dive: editing, record and selection patterns, previews and tooling](patterns-tooling.md) |
| PRV | Preview patterns: PreviewSheet, PreviewHeader, PreviewNavigation (kit family) | [Family deep dive: editing, record and selection patterns, previews and tooling](patterns-tooling.md) |
| TOO | Tooling and shared lib: ESLint plugin, ds-check, API baseline, tests, Storybook config, packaging, lib helpers (kit family) | [Family deep dive: editing, record and selection patterns, previews and tooling](patterns-tooling.md) |
