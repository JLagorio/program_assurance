# Coverage-gap round

Part of the [Ledger audit, 24 September 2026](README.md).

After the first round, a completeness critic read the whole index against the export and story lists and named eight dimensions that no unit had run systematically, from long unbroken content to reduced motion at runtime. Units G1 to G8 checked those dimensions across the kit and the app, with the same audit and verify stages as the rest.

## G1 · Long, unbroken and expanded content stress (plus WCAG 1.4.12 text spacing)

Most of the kit holds up: pseudo-German copy (+40%) broke only Card and the default Tabs, and the 1.4.12 text-spacing overrides clipped nothing visible in 118 stories. Unbroken values are the problem. The kit has no base overflow-wrap rule, and several parts put `break-words` on flex containers, where it does nothing. Fix Select's `max-w-full` and the base rule first, then promote Breadcrumb's private `useFullTextTitle` as the one truncation reveal for KeyValue, Table cells, Related and the nav labels.

**G1-1 · Overlay titles and descriptions clip unbroken values, including server error text** (medium)
[dialog.tsx:62](../../../packages/design-system/src/components/dialog.tsx#L62), [:124-140](../../../packages/design-system/src/components/dialog.tsx#L124-L140), [alert-dialog.tsx:59](../../../packages/design-system/src/components/alert-dialog.tsx#L59), [:118-134](../../../packages/design-system/src/components/alert-dialog.tsx#L118-L134), [sheet.tsx:108](../../../packages/design-system/src/components/sheet.tsx#L108), [:161-177](../../../packages/design-system/src/components/sheet.tsx#L161-L177), [drawer.tsx:151-166](../../../packages/design-system/src/components/drawer.tsx#L151-L166), [program-wizard.tsx:449](../../../src/components/app/program-wizard.tsx#L449)

The title and description slots set no overflow-wrap. At 390px, a 71-character hash in a Dialog title runs to x=634 in a 290px box and is cut at the popup edge, and an AlertDialog titled "Create WS-X90_Expanded_Control_Set_…?" scrolls sideways inside itself (scroll width 627 against 358). The app puts data into these slots (`Create {draft.name.trim()}?`, `Remove ${removing.name}?`), so an underscored program name or a constraint name in an error loses its end, which is the part that says what went wrong.

Fix: DialogHeader, SheetHeader and DrawerHeader are stretched flex columns, so G1-3's base rule (or the lint-allowed `break-words`) is enough; `wrap-anywhere` is not needed. Route product error text through FieldError or AlertDescription.

**G1-2 · Empty's centred message widens past both sides of its frame** (medium)
[empty.tsx:68-80](../../../packages/design-system/src/components/empty.tsx#L68-L80), [:109-137](../../../packages/design-system/src/components/empty.tsx#L109-L137), [data-table.tsx:991-992](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L991-L992), [related.tsx:95-97](../../../packages/design-system/src/patterns/related.tsx#L95-L97)

EmptyTitle and EmptyDescription have no overflow-wrap and are flex items of a centred column, so one unbroken token sets the width of the whole block. In the Empty playground at 390px with a hash appended, the title box runs from x=-204 to 594 and the page scrolls to 594px. The start of every description line sits left of x=0, where no scroll reaches, and the DataTable empty and filtered states and Related's empty state all render these parts.

Fix: `wrap-anywhere max-w-full` on EmptyTitle and EmptyDescription, once the lint accepts it (G1-3). Consider `safe center` alignment on centred flex parts, so overflow never goes to the unreachable side.

**G1-3 · The kit has no base overflow-wrap rule** (medium)
[base.css:26-31](../../../packages/design-system/src/styles/base.css#L26-L31), [typography.tsx:57](../../../packages/design-system/src/components/typography.tsx#L57), [page-header.tsx:49-55](../../../packages/design-system/src/layout/page-header.tsx#L49-L55), [section.tsx:111-118](../../../packages/design-system/src/layout/section.tsx#L111-L118), [card.tsx:60-70](../../../packages/design-system/src/components/card.tsx#L60-L70), [timeline.tsx:350-355](../../../packages/design-system/src/components/timeline.tsx#L350-L355)

No stylesheet sets overflow-wrap: eighteen parts opt in with `break-words`, and the rest inherit `normal`. At 390px, a 71-character hash scrolls the page to 583px in a Fact value, 528px in PageHeader.Description, 492px in Section.Description and 560px in a Timeline description, and Card's `overflow-hidden` clips CardDescription. Fact.mdx says "a fact never breaks across lines", yet the dd neither wraps nor truncates, so a UUID or URL fact pushes the whole page.

Fix:

- Add `overflow-wrap: break-word` to `body` in base.css, then remove the per-part `break-words`. It breaks only a word that would otherwise overflow.
- Add `wrap-(normal|break-word|anywhere)` to the structural allowlist at [eslint-plugin/index.js:173](../../../packages/design-system/eslint-plugin/index.js#L173), which accepts only `break-*` today. G1-2 and G1-4 need `wrap-anywhere`, and Tailwind 4.3 treats `break-words` as a legacy alias of `wrap-break-word`.
- Decide in Fact.mdx whether a value wraps anywhere or truncates with a reveal.

**G1-4 · `break-words` on a flex container does nothing: AlertTitle, Select options and Combobox options overflow** (medium)
[alert.tsx:37](../../../packages/design-system/src/components/alert.tsx#L37), [select.tsx:191](../../../packages/design-system/src/components/select.tsx#L191), [combobox.tsx:220](../../../packages/design-system/src/components/combobox.tsx#L220), [menu.ts:6](../../../packages/design-system/src/components/menu.ts#L6)

In these `flex min-w-0 … break-words` slots the text is an anonymous flex item whose minimum width is its min-content, which `break-word` does not lower, so the text never breaks. An AlertTitle with a hash scrolls the page at 390px, and in the open Select matrix every option runs to x=551 in a 230px row, cut by the popup's `overflow-hidden` with the check indicator over the cut text. The belief behind the pattern goes back to [responsive-audit-2026-09-18.md:59](../responsive-audit-2026-09-18.md#L59), which glosses `break-words` as `overflow-wrap: anywhere`; MNU-8 records the same cut labels in menus.

Fix: `wrap-anywhere` on the three slots (after G1-3's allowlist change), or wrap the text in a `block min-w-0` span. Add a lint check that flags `break-words` together with `flex` or `inline-flex` on one element.

**G1-7 · A Select trigger grows past its field with a long selected value** (medium)
[select.tsx:54](../../../packages/design-system/src/components/select.tsx#L54), [system-baseline.tsx:812](../../../src/components/prototype/system-baseline.tsx#L812), [requirement-control-mappings.tsx:576](../../../src/components/prototype/requirement-control-mappings.tsx#L576), [:722](../../../src/components/prototype/requirement-control-mappings.tsx#L722)

The trigger is `flex w-fit` with no `max-w-full`, so SelectValue truncates only when the caller sets a width. Set to "NIST SP 800-53 Rev 5.1.1 Security and Privacy Controls for Information Systems" at 390px, an unconstrained trigger grows to 478px and scrolls the page to 534px; 12 of the app's 17 triggers set no width, including the baseline dialog's profile select and Map control's system and relationship selects, whose dialog bodies then scroll sideways. It reproduces with ordinary spaced labels, so it is the G1 defect most likely to hit real use (see also SEL-7).

Fix: add `max-w-full min-w-0` to the trigger defaults, and say in Select.mdx that a Select in a Field fills it.

**G1-8 · KeyValue reveals a truncated value only when its child is a single string** (medium)
[key-value.tsx:34-44](../../../packages/design-system/src/components/key-value.tsx#L34-L44), [requirement-evidence.tsx:259-261](../../../src/components/prototype/requirement-evidence.tsx#L259-L261), [table.tsx:384](../../../packages/design-system/src/components/table.tsx#L384)

The dd gets a `title` only when `!wrap && typeof children === "string"`, so composed values such as `{code} · {title}`, a TextLink, a RelationName or a Person truncate with no reveal. On the Add evidence RecordBrowser at 390px, the Requirement row reads "REQ-001 · AC Enforcement Re…" with no title, and the app renders 192 KeyValues. Table cells have the same string-only limit, which confirms TBL-7.

Fix: promote Breadcrumb's `useFullTextTitle` ([breadcrumb.tsx:498-525](../../../packages/design-system/src/components/breadcrumb.tsx#L498-L525)) to a shared hook and use it in the KeyValue dd and in Table cells; an explicit `title` prop is a reasonable escape hatch. Do not default `wrap` by surface: rails depend on one-line rows.

**G1-12 · No story or test exercises long or unbroken content** (medium)
[.storybook/preview.tsx:40-58](../../../packages/design-system/.storybook/preview.tsx#L40-L58), [:109-135](../../../packages/design-system/.storybook/preview.tsx#L109-L135), [Timeline.stories.tsx](../../../packages/design-system/src/stories/components/Timeline.stories.tsx)

`test:layout` renders stories as written, with short English fixtures, so none of G1-1 to G1-11 appears in CI. Only KeyValue has an Unbroken story, and no Dialog, Empty, Card, Select or Timeline story has a long title, action, value or stamp. Appending an 80-character URN and a hash to about 119 representative stories turned up problems in about 15 families.

Fix: a Storybook global "Content: long", or an injector in the test:layout play step, that appends a no-break token and lengthens words by 40%, then asserts no document scroll and no text cut by `overflow: hidden` without an ellipsis. Start with the families above.

| Id | Finding | Where | Fix |
| --- | --- | --- | --- |
| G1-6 | Timeline's default `end` stamp has no maximum width, and a truncated title has no reveal; with a German stamp at 390px, titles shrink to "Verified by Pri…" | [timeline.tsx:288-296](../../../packages/design-system/src/components/timeline.tsx#L288-L296), [:329](../../../packages/design-system/src/components/timeline.tsx#L329), [:347-349](../../../packages/design-system/src/components/timeline.tsx#L347-L349) | Cap the stamp (max width, truncate, `timeTitle` as its reveal); reveal cut titles through the shared title hook; point long stamps at `timePosition="below"` in Timeline.mdx; add a `wrap` story |
| G1-9 | Default (segmented) Tabs neither scroll nor wrap, and in a 320px frame the centred overflow cuts off the start of the first tab; the app uses line tabs | [tabs.tsx:39-40](../../../packages/design-system/src/components/tabs.tsx#L39-L40), [:62](../../../packages/design-system/src/components/tabs.tsx#L62), [:112](../../../packages/design-system/src/components/tabs.tsx#L112) | Give the default variant the `line` Scroller, or `justify-start` with scrolling, or limit it in Tabs.mdx to two or three short labels |
| G1-10 | More parts truncate with no reveal: the Related h3 and card titles, side-nav labels, the top nav's workspace name, the Banner message and Text `maxLines`; RecordPicker's id never shrinks and leaves the title 12px wide. Confirms FLT-6, CNT-10, SHA-12 and FDB-12 | [related.tsx:78](../../../packages/design-system/src/patterns/related.tsx#L78), [side-nav.tsx:291](../../../packages/design-system/src/layout/shell/side-nav.tsx#L291), [top-nav.tsx:179-181](../../../packages/design-system/src/layout/shell/top-nav.tsx#L179-L181), [banner.tsx:59](../../../packages/design-system/src/components/banner.tsx#L59), [text.tsx:22](../../../packages/design-system/src/primitives/text.tsx#L22), [record-picker.tsx:86-90](../../../packages/design-system/src/patterns/record-picker.tsx#L86-L90) | Reveal through the promoted `useFullTextTitle`, keeping Banner on one line; let headings (the Related h3, the Item group h3) wrap; bound RecordPicker's id so it truncates before the title |
| G1-13 | No written rule for long content: the Fact, Badge, Timeline, KeyValue and Text pages each decide alone, and none covers ids, hashes, URLs or file names | [component-library.md](../component-library.md), [Fact.mdx:36](../../../packages/design-system/src/stories/components/Fact.mdx#L36), [Badge.mdx:92](../../../packages/design-system/src/stories/components/Badge.mdx#L92), [Timeline.mdx:22](../../../packages/design-system/src/stories/components/Timeline.mdx#L22) | Add a Long content section to component-library.md and point AGENTS.md at it: ids, hashes and URLs wrap anywhere; titles, headings, errors and notifications always wrap; only row fields truncate, always with a reveal; file names truncate in the middle. Align the MDX pages with it |

Already tracked:

- G1-5, a Card title breaks mid-word, or collapses to one character a line, beside a wide CardAction ([card.tsx:29-42](../../../packages/design-system/src/components/card.tsx#L29-L42)): responsive-2026-09-24 #4 (residual) and docs/next.md "Card action fold". Put the card header on the section-header rule.
- G1-11, Badge has no max width, so a long label pushes the page ([badge.tsx:27](../../../packages/design-system/src/components/badge.tsx#L27)): docs/next.md Responsive follow-ups.

## G2 · Axe and console sweep of every app route and open state

The kit is close to axe-clean on static markup: at 1440, 46 of 54 routes have no violations in light or dark, and no route, dialog, menu, sheet or palette has a colour-contrast violation. The failures that matter come from interaction: on phones Tab leaves the open side-nav overlay, a TextLink inside a sentence fails link-in-text-block, and the program wizard drops focus at every step. Fix the overlay and TextLink's in-text underline first, since each is one kit change that every screen inherits, then the Inspector heading level and useRows' whole-table loads.

**G2-1 · On phones, Tab leaves the open side-nav overlay for the page it covers** (high)
[side-nav.tsx:122-150](../../../packages/design-system/src/layout/shell/side-nav.tsx#L122-L150)

At 390x844 on /risks with the overlay open, 40 Tab presses went through the 18 nav items and the profile, then into Search risks, Saved questions, More, Create risk and the table rows, each of them under the nav or the scrim while the overlay stayed open. Focus stays on the top-nav toggle when the overlay opens, and the only `inert` in the shell is for the closing animation ([:128](../../../packages/design-system/src/layout/shell/side-nav.tsx#L128), [:141](../../../packages/design-system/src/layout/shell/side-nav.tsx#L141)). Below 1024px, keyboard, switch and screen-reader users reach controls they cannot see.

Fix:

- While the overlay is present below lg, set `inert` on every other shell area: TopNav except the toggle, Main, Aside, Panel and Banner. The existing Escape and scrim focus return cover the rest.
- Add a phone Shell story whose play tabs past the last item and asserts that focus stays in the nav.

**G2-2 · A TextLink inside a sentence has no underline and fails link-in-text-block** (high)
[text-link.tsx:24-43](../../../packages/design-system/src/components/text-link.tsx#L24-L43), [catalog.tsx:180](../../../src/components/app/program-wizard/catalog.tsx#L180), [:247](../../../src/components/app/program-wizard/catalog.tsx#L247)

axe flags the "Open catalog" link and four "Open profile" links on step 2 of /programs/new, at 1440 and 390 in both modes: none is underlined, and each is 1.52:1 against the surrounding text in light and 1.31:1 in dark. TextLink already detects the case (`markInText` sets `data-in-text`), but the attribute only removes the touch area, and [TextLink.mdx:31](../../../packages/design-system/src/stories/components/TextLink.mdx#L31) leaves the prose underline to the consumer. The same links open a new tab with no warning.

Fix: add `data-in-text:underline` to TextLink, so a link with sibling text is underlined at rest, and update TextLink.mdx:31. Add a story with a link inside `font-body-small text-subtle` so test:a11y covers the pairing, and consider a new-window indication for `target="_blank"`.

**G2-3 · The program wizard disables Continue on each new step, so focus drops to the body** (high)
[program-wizard.tsx:401-415](../../../src/components/app/program-wizard.tsx#L401-L415), [program-wizard.ts:96](../../../src/lib/program-wizard.ts#L96)

Enter on Continue renders the next step with Continue disabled, because its fields are still empty, so `document.activeElement` becomes BODY on steps 2 and 3 and nothing announces the step. The only reason given is a sibling span and a `title` that are not tied to the button, and on the catalog step it is the generic uuid message "Choose an existing record." This confirms INP-3 and adds the focus loss; Chromium keeps the Tab starting point at the disabled button, so the harm is lost focus and silence, not a restart from the skip links.

Fix: keep Continue enabled and validate on press, with errors at the fields. On a step change, focus a step h2 with `tabIndex=-1`, which also fixes G2-11. Give `catalogRevisionId` its own message, such as "Choose a catalog edition."

**G2-5 · Inspector.Group always renders h3, so the Details rail skips a heading level on 8 routes** (medium)
[inspector.tsx:74](../../../packages/design-system/src/patterns/inspector.tsx#L74)

axe heading-order fires in all four modes on the system record and on seven program views (authorization, baseline, export, ingestion, inheritance, risk, te-phases): the outline goes from the h1 straight to "Details" and "References" at h3. The program Overview passes only because its main area happens to have h2 sections. This confirms REC-16 on the live app.

Fix: give Inspector and Inspector.Group a heading level (default 2), or have Shell.Aside render a visually hidden h2 from its label so the groups sit at h3. Document the choice on the Inspector page.

**G2-7 · useRows downloads whole tables: the program Controls tab fetches 14.8 MB in 82 requests** (medium)
[models.ts:110](../../../src/lib/models.ts#L110), [use-system-assurance.ts:11](../../../src/components/prototype/use-system-assurance.ts#L11), [add-from-library.tsx:124](../../../src/components/prototype/add-from-library.tsx#L124), [system-baseline.tsx:181](../../../src/components/prototype/system-baseline.tsx#L181)

On localhost, /programs/<WS-X90>?tab=Controls made 82 REST requests for 14.8 MB in 7.5 s, with selected_controls alone taking 19 sequential 1000-row pages (6.9 MB). useRows loops `for (let offset = 0; offset < 100_000; offset += 1000)`, and nine call sites load selected_controls unfiltered. On a real network or a phone the tab takes much longer and holds megabytes in memory; this extends PRF-7 (4.3 MB on the Requirements tab) and PA3-19.

Fix: filter on the server by program, system or resolution ids, which useRows already accepts, and move aggregates into views or RPCs. Keep full-table loading for small collections, and log any collection that pages past a few thousand rows.

| Id | Finding | Where | Fix |
| --- | --- | --- | --- |
| G2-4 | On phones an open preview panel leaves the page with no main landmark and no h1 (16 axe best-practice hits) | [shell.css:194-199](../../../packages/design-system/src/styles/shell.css#L194-L199) | Switch the panel's role to main from the existing `panelCompactQuery`, or say on Shell.mdx that the compact panel is the page's region and its record title is the h2 |
| G2-8 | Kbd names glyphs with `aria-label` on `<kbd>`, which ARIA prohibits on a generic element (8 nodes per open CommandPalette) | [kbd.tsx:18](../../../packages/design-system/src/components/kbd.tsx#L18) | aria-hidden glyph plus a visually hidden name, or `role="img"`; route the command-keys names through `useLedgerLocale` |
| G2-11 | The wizard's Review step puts h3 card titles straight under the h1 | [review.tsx:44](../../../src/components/app/program-wizard/review.tsx#L44) | h2 for the summary cards, or the step h2 from G2-3 |
| G2-12 | Preview panel names are lower-case for most record types ("risk preview") and capitalised for others | [record-summary-preview.tsx:60](../../../src/components/prototype/record-summary-preview.tsx#L60) | One shared helper that capitalises the noun. Cosmetic: speech does not convey case |
| G2-13 | Create task opens with focus on Task title, below the required Program select that comes first | [create-task-dialog.tsx:372](../../../src/components/prototype/create-task-dialog.tsx#L372) | Focus Program when no program context is supplied; otherwise make Task title the first field |

Already tracked:

- G2-6, register previews show raw timestamps ("Updated 2026-09-12T18:01:21.982404+00:00") and enum values that the table formats ([record-summary-preview.tsx:87](../../../src/components/prototype/record-summary-preview.tsx#L87)): the same issue as VW1-3, reproduced here on /risks and /evidence.
- G2-10, the catalog step's RadioGroup switches from uncontrolled to controlled ([catalog.tsx:162](../../../src/components/app/program-wizard/catalog.tsx#L162)): the same as CTL-10. Pass `value={draft.catalogRevisionId}`.
- G2-14, `Button render={<Link>}` logs Base UI's "expected a native <button>" error at 8 call sites (48 errors, one on every missing-record URL): BTN-1, API-1, VW1-18. Correction to the fix: `nativeButton={false}` adds `role="button"` to the anchor, so render the anchor through `useRender` with `buttonVariants` (a LinkButton part) instead.
- G2-15, targets under 24px on table headers, the eye and the name link the eye overlaps (76 route loads at 390): responsive-2026-09-24 #10, and #11 for the overlap.
- G2-16, the signed-out sign-in screen has no main landmark: TOO-10.
- G2-17, picker rows named by UUID and every eye named "Preview row": DTC-1, DTP-2, PIK-2 (also VW1-6). The labels live at [data-table.tsx:811](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L811) and [table.tsx:445](../../../packages/design-system/src/components/table.tsx#L445), and [record-browser.tsx:182](../../../packages/design-system/src/patterns/record-browser.tsx#L182) finds the opener by the literal "Preview row", so move it to a data-slot selector when the eye is named per row.
- G2-18, merged with G2-9, no product suite runs axe ([test-screen-families.mjs:239](../../../scripts/test-screen-families.mjs#L239)): A11-12 (item e). When axe is added, exclude `[data-base-ui-focus-guard]` from aria-hidden-focus and portaled popups from region, each with a comment citing Base UI.

## G3 · Systematic focus-indicator sweep: clipping and contrast, light and dark

Ledger has one focus ring, and it is strong in dark mode (at least 4.8:1 on every surface measured), but containers that clip or scroll leave it no room: 238 of 3,022 story focus stops lose half the ring or more. The register's name link, the Saved questions trigger, line tabs, ScrollArea viewports and the program's lifecycle gates show little or no focus at 1440, and Treemap tiles and Donut's extra tab stops fail in the kit. The fix that matters is one kit-wide rule and a check: a part that clips leaves 4px of ring room or gives focusable children an inset ring (the geometry already exists as `outline-field-focused`), and a focus-clip assertion joins the story run.

**G3-1 · Horizontal Stepper and Timeline steps have almost no visible focus, and the program lifecycle timeline has none** (high)
[stepper.tsx:86-93](../../../packages/design-system/src/components/stepper.tsx#L86-L93), [:226](../../../packages/design-system/src/components/stepper.tsx#L226), [timeline.tsx:139-146](../../../packages/design-system/src/components/timeline.tsx#L139-L146), [:303](../../../packages/design-system/src/components/timeline.tsx#L303), [scroller.tsx:323-326](../../../packages/design-system/src/components/scroller.tsx#L323-L326), [program-timeline.tsx:60-83](../../../src/components/prototype/program-timeline.tsx#L60-L83)

An actionable step draws its ring on an `after:absolute after:inset-0` overlay around its li, which fills a ScrollerViewport that is `overflow-x-auto overflow-y-hidden` with no padding, so the ring loses its top, its bottom and the first step's start edge; the Scroller has wrapped every horizontal Stepper and Timeline since the 18 September fix. Measured loss is 91.5% on the first step of Stepper Paths, 92.6% in Timeline Runs and 100% on the PDR gate of the program's Lifecycle timeline at 1440 and 390, so a keyboard user cannot see which gate has focus before pressing Enter. The app's own `role=region tabIndex=0` rail around the kit Timeline adds a second scroller and tab stop (PA4-12, STR-7).

Fix:

- Draw the ring inset on step and item overlays (an outline-offset of minus the ring width on the ::after), as `outline-field-focused` does.
- Delete the app rail and its arrows in program-timeline.tsx, and let the Timeline's own Scroller scroll.
- Assert in the Stepper and Timeline plays that the focused step's ring stays inside the viewport.

**G3-4 · Line tabs lose 85–89% of their ring inside the kit's ScrollArea** (high)
[tabs.tsx:68-97](../../../packages/design-system/src/components/tabs.tsx#L68-L97), [:112](../../../packages/design-system/src/components/tabs.tsx#L112), [scroll-area.tsx:19](../../../packages/design-system/src/components/scroll-area.tsx#L19), [:27](../../../packages/design-system/src/components/scroll-area.tsx#L27)

A horizontal line TabsList always sits in a ScrollArea whose root is `overflow-hidden`, while TabsTrigger draws its ring 2px outside itself, so the ring is cut above, below and at the first tab's start. Measured loss is 84.7% in 9 Tabs stories, 84.9% on the program record's Overview tab and 88.7% on /campaigns at 1440 and 390; what shows is a vertical line at the tab's end, and the visible underline is the selection indicator. VW1-1 recorded these rings as clipped top and bottom and A11-1's verifier rated the tab case low, but at these losses a tab reached by Tab shows no focus on every product page and preview.

Fix: give the tabs viewport block padding the size of the ring, keeping the underline on the content edge, or draw the trigger ring inset (offset −2px). Keep the reveal logic at [tabs.tsx:79-94](../../../packages/design-system/src/components/tabs.tsx#L79-L94) accounting for the ring.

**G3-5 · The Row actions and More fields buttons lose both side edges of their ring** (medium)
[data-table.tsx:150](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L150), [:561-576](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L561-L576), [:865-876](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L865-L876), [table.tsx:386](../../../packages/design-system/src/components/table.tsx#L386)

Both controls sit in 32px `px-0` cells (`NARROW`) that inherit Table.Cell's `truncate`, so a 28px IconButton leaves 2px a side where the ring needs 4px and 52.9% of the ring is lost. It shows on every "More fields for …" button on /programs and /campaigns at 390, in the Add from library sheet, and on 70 stops in 9 DataTable stories. On a phone these are the only keyboard routes to row commands and hidden fields.

Fix: widen these columns to 36px in `NARROW`, `actions` and the pinned-offset arithmetic (there is no space.450 token; the widths are px constants), or give the cells `overflow-visible`, or use the inset ring on IconButtons in these cells.

**G3-6 · Truncating and animating wrappers clip focus rings, and the kit patches them one by one** (medium)
[data-table.tsx:514-522](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L514-L522), [table.tsx:541](../../../packages/design-system/src/components/table.tsx#L541), [timeline.tsx:287-295](../../../packages/design-system/src/components/timeline.tsx#L287-L295), [collapsible.tsx:28](../../../packages/design-system/src/components/collapsible.tsx#L28), [accordion.tsx:57](../../../packages/design-system/src/components/accordion.tsx#L57), [heatmap.tsx:133](../../../packages/design-system/src/patterns/chart/heatmap.tsx#L133)

Measured, each case checked in a screenshot: the DataTable Id glance trigger loses 90.1% of its ring (80 stops in 12 stories; kit only, see FLT-7), a TextLink in a Timeline.Item title 89.9%, a trigger at the edge of an open Collapsible or Accordion panel 52.2% because the panel stays `overflow-hidden` once open, Heatmap edge cells 26.1%, and a button in a truncating /campaigns cell 21.8%. With no rule or check, every new link or button in a clipping part repeats the bug. The same cause is behind A11-1, CNT-9, EDT-1 and FDB-9.

Fix:

- Write one rule in component-library.md: a part that clips leaves 4px of ring room in its padding box, or gives focusable children the inset ring. Ship an `outline-focused-inset` utility for that ring.
- For Collapsible and Accordion, put `overflow: hidden` inside the collapse keyframes rather than on the panel. `data-starting-style` and `data-ending-style` mark only the first and last frame, so they cannot scope it.

**G3-9 · Each Donut adds two unnamed tab stops** (medium)
[donut.tsx:212-240](../../../packages/design-system/src/patterns/chart/donut.tsx#L212-L240)

Both `<Pie>` elements leave Recharts' `rootTabIndex` at 0, so each chart renders two `g.recharts-pie` stops with no role and no name after the svg's own stop, focused with the browser's 1px ring that the svg clips by 74–100%. Nothing happens on Enter, so a dashboard of four gauges adds eight dead stops. This contradicts [docs/next.md:151](../../next.md#L151) ("no roving tabindex on the marks"); CHO-2 covers the svg's own dead stop.

Fix: pass `rootTabIndex={-1}` on both Pies, and assert in a play that the Donut has exactly one tab stop.

| Id | Finding | Where | Fix |
| --- | --- | --- | --- |
| G3-7 | The light-mode `border.focused` (blue-500) drops to 2.70–2.96:1 over grey and tinted fills (the side-nav item beside the active one, "Skip to program preview"), and the contrast test pairs it only with plain surfaces. It matches Atlassian's token, so this is a test gap rather than a WCAG failure | [tokens.css:125](../../../packages/design-system/src/generated/tokens.css#L125), [contrast.test.mjs:88-94](../../../packages/design-system/test/contrast.test.mjs#L88-L94), [side-nav.tsx:250-255](../../../packages/design-system/src/layout/shell/side-nav.tsx#L250-L255) | Add `border.focused` pairings for the neutral, neutral.hovered and selected.* fills on each surface first; treat blue-600 as a design decision that departs from Atlassian's token |
| G3-14 | A Toolbar placed directly on a Table has the bottom of each control's ring covered by the opaque sticky header; app registers are unaffected (DataTable's toolbar slot has `pb-200`) | [table.tsx:268](../../../packages/design-system/src/components/table.tsx#L268), [data-table.tsx:1461](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1461) | Keep the toolbar-to-table gap in Table's register recipe and stories |
| G3-15 | ScrollerViewport is `outline-none` with no focus replacement: the Scroller stories make it a tab stop with no indicator, and Stepper and Timeline add the ring back by hand. Related to NAV-5 | [scroller.tsx:315-331](../../../packages/design-system/src/components/scroller.tsx#L315-L331), [Scroller.stories.tsx:39](../../../packages/design-system/src/stories/components/Scroller.stories.tsx#L39) | An inset `focus-visible:outline-focused` on ScrollerViewport; drop the hand-added copies; document when the viewport is a tab stop |
| G3-16 | The column resize handle, bare HoverCardTrigger anchors and Tooltip trigger anchors fall back to the browser's ring. Confirms TBL-10 for the handle | [table.tsx:316-346](../../../packages/design-system/src/components/table.tsx#L316-L346), [hover-card.tsx:20-22](../../../packages/design-system/src/components/hover-card.tsx#L20-L22) | The inset kit ring on the separator; TextLink styling on HoverCardTrigger by default, or document composing it with TextLink |
| G3-17 | The Command and CommandPalette search input shows no focus indicator, which matters in inline Command and RecordPicker | [command.tsx:44-50](../../../packages/design-system/src/components/command.tsx#L44-L50) | A focus-within indicator on the input row, or the field inset ring outside a dialog |

Already tracked:

- G3-2, the register's name link loses 96% of its ring in the id or preview cell (/programs at 1440 and 390): A11-1. The inset ring that fixes G3-5 and G3-6 fixes it too.
- G3-3, the Saved questions trigger loses 100% of its ring on every register, and preset toggles lose 85–86%: VW1-1, TLB-2, NAV-1.
- G3-8, a focused Treemap tile shows no ring (15–52% clipped, the rest painted over by later tiles): the same as CHO-3, reproduced here. Draw the indicator as an SVG stroke painted last.
- G3-10, ScrollArea's own viewport ring is 100% clipped: NAV-4. Tabs set `tabIndex: -1` on their viewport, so this one does not reach Tabs.
- G3-11, controls in a KeyValue value still lose the inline sides of their ring (13–22%, and 61.8% for a truncated TextLink): EDT-1. Prefer the inset ring.
- G3-12, ProgressStacked segments use the browser ring, 99.5% clipped: FDB-9.
- G3-13, Card's `overflow-hidden` flattens one edge of an Item link's ring (12.9%): CNT-9.
- G3-18, Button rendered as a Link and the catalog RadioGroup log Base UI errors that no check sees: the same as G2-14 (VW1-18, API-1) and G2-10 (CTL-10). Its `<Link className={buttonVariants(…)}>` fix and a `ledger/no-button-render-link` lint rule agree with the G2-14 correction.
- G3-19, the story setup spies only on console.error: TOO-17.

## G4 · Slow and failing loads on record pages, program tabs, previews and pickers

The first load of a primary record is handled correctly, and failed writes keep their selections and drafts. The weak point is what happens after a failed background refresh or a new query key: a failed refetch on window focus unmounts the SSP assembly and loses an open narrative draft (critical), every search keystroke on a schema inspector register unmounts the toolbar (high), and the System tab preview closes on any failed stale refresh. Fix first by rendering whenever `data !== undefined`, in early returns, in preview gates, and in ProductCollection through DataTable `state="loading"` and `keepPreviousData`. Then fix the smaller QueryState problems: one alert per region, disabled queries not counted as loading, and recovery that is announced and keeps focus.

**G4-1 · A failed background refetch unmounts the SSP assembly and destroys an open control-narrative draft** (critical)
[ssp-assembly.tsx:66](../../../src/components/prototype/ssp-assembly.tsx#L66), [:161-162](../../../src/components/prototype/ssp-assembly.tsx#L161-L162), [:363](../../../src/components/prototype/ssp-assembly.tsx#L363), [:858](../../../src/components/prototype/ssp-assembly.tsx#L858), [requirement-record.tsx:359-360](../../../src/components/prototype/requirement-record.tsx#L359-L360)

`if (systems.isPending || systems.error) return <ProgramQueryState …/>`, and the same test at :161-162, return early whenever a query has an error, even with cached data, and the editor state, the SSP control preview and the ProductRecordDialog all live under that return. Live on the Controls tab at 1440, with a narrative typed in Edit control implementation, failing only GET ssp_revisions on a window-focus refetch took the dialog away, lost the text and dropped focus to BODY; the page showed "Showing the last loaded records" above an empty area, and Retry restored neither the dialog nor the draft. The dirty-draft guard never runs, because the dialog is unmounted rather than closed, and RequirementHierarchy uses the same early return.

Fix:

- Return early only when `data === undefined`, as [program-record.tsx:223](../../../src/components/prototype/program-record.tsx#L223) already does, and render stale content under QueryState.
- Keep editors and previews above any loading or error boundary.
- Add a test:patterns case that opens a dialog, fails a refetch on focus, and asserts that the dialog and draft survive.

**G4-2 · Schema inspector search unmounts the toolbar on every keystroke** (high)
[record-browser.tsx:214](../../../src/components/app/record-browser.tsx#L214), [:313](../../../src/components/app/record-browser.tsx#L313), [work-common.tsx:63](../../../src/components/prototype/work-common.tsx#L63), [:90](../../../src/components/prototype/work-common.tsx#L90)

The list query key includes `pagination` and `search` but sets no `placeholderData`, so each keystroke creates a query with no data, and QueryState treats it as pending and hides its children: the whole DataTable, toolbar included. On /records/parties with 1.5 s latency, typing "ab" left no search box on the page after "a", focus on BODY, and a settled value of "a". Paging unmounts the pagination control under the pointer the same way.

Fix: `placeholderData: keepPreviousData` and a debounced search for server-paged queries. While a keyed query has no data, ProductCollection passes DataTable `state="loading"`, which keeps the toolbar and draws skeleton rows, instead of letting QueryState hide the table. DTC-10 covers the DataTable's missing refreshing state in server mode.

**G4-3 · The System tab preview closes whenever any assurance query fails to refresh** (medium)
[program-systems-tree.tsx:385](../../../src/components/prototype/program-systems-tree.tsx#L385)

The preview renders only as `{preview && !pending && !error && (…)}`, and useSystemAssurance sets `error` for any failed query, even while stale rows show. Failing GET systems on a focus refetch left the table (28 rows and the stale Alert) but removed the panel, while the row's eye still showed as active. After Retry the panel came back with focus on BODY, and the nested frames and their Back history were gone.

Fix: gate on the stale data, for example `preview && assuranceRows.some((r) => r.id === preview.id)`, and let the region's QueryState report the failed refresh. No Shell or RecordPreviewProvider change is needed.

**G4-4 · Add from library says "Nothing published to apply" while profiles load, and when they fail** (medium)
[add-from-library.tsx:124-129](../../../src/components/prototype/add-from-library.tsx#L124-L129), [:172-190](../../../src/components/prototype/add-from-library.tsx#L172-L190), [:808-819](../../../src/components/prototype/add-from-library.tsx#L808-L819), [picker-sheet.tsx:76-81](../../../packages/design-system/src/patterns/picker-sheet.tsx#L76-L81)

The profile choices come from selected_controls, profile_imports, catalog_revisions and profiles, but the picker's QueryState watches a different list. On CN-109001, Source: Profile lists 4 rows once loaded, but with catalog_revisions delayed 6 s it shows 0 rows, "Nothing published to apply" and "0 to choose from", and with catalog_revisions failing it shows the same Empty and no Alert. A reader may give up or publish a duplicate; this extends PA3-5 (empty results while the confirm step loads) to the profile list and to failure.

Fix: add selections, imports, catalogs and profileRecords to the picker's QueryState, or derive readiness from exactly the queries that feed `choices`. Pass `total={undefined}` and DataTable `state="loading"` until they have data; no new PickerSheet prop is needed.

**G4-5 · QueryState counts a disabled dependent query as loading, so a failure shows an Alert and a permanent "Loading records…"** (medium)
[work-common.tsx:63](../../../src/components/prototype/work-common.tsx#L63), [requirements-table.tsx:226-229](../../../src/components/prototype/requirements-table.tsx#L226-L229), [:445-446](../../../src/components/prototype/requirements-table.tsx#L445-L446)

`pending = queries.some((q) => q.isPending && q.data === undefined)`, and in TanStack Query v5 a query with `enabled: false` stays `isPending` with an idle fetch status. RequirementsTable's control-statements query runs only when three upstream queries succeed, so when one of them fails the tab shows an Alert, Retry, the spinner and "Loading records…" together, and screen readers hear the polite loading status beside the alert. The profile page avoids this only by leaving the disabled query out by hand ([profiles.$profileId.tsx:246](../../../src/routes/profiles.$profileId.tsx#L246)).

Fix: count a query as loading only when it is fetching with no data (`isLoading`, or `isPending && fetchStatus !== "idle"`), and treat dependants of a failed query as failed or absent.

**G4-6 · Program setup hides every step until about 25 reference queries load, and keeps "Loading…" after a failure** (medium)
[program-wizard.tsx:264-282](../../../src/components/app/program-wizard.tsx#L264-L282), [:145](../../../src/components/app/program-wizard.tsx#L145)

`ready` requires every reference query to have data, including selected_controls (18,580 rows in 19 pages). With GET parameters slow, /programs/new shows a status line and no inputs, so even step 1's program name cannot be typed. With parameters failing, the page shows the error, "Your form entries are retained." (while the entries stay hidden), Retry references, and still the loading status.

Fix: hide the loading status once `resources.error` is set, and render step 1 without waiting for catalog data, after checking the `resources.ready` draft hydration at :145. Per-step readiness is the fuller fix. Recover through QueryState's Alert, with Retry in AlertAction.

**G4-7 · One outage produces one Alert and one "Retry loading" button per block** (medium)
[work-common.tsx:69-84](../../../src/components/prototype/work-common.tsx#L69-L84), [record-tools.tsx:55-67](../../../src/components/prototype/record-tools.tsx#L55-L67)

Each QueryState renders its own Alert and full-width Button, and RelationName wraps a single value in QueryState, so a failed lookup puts an Alert inside a KeyValue or a cell. With all GETs failing on a focus refetch, a POA&M record showed 6 alerts and 6 identically named buttons, one above the breadcrumb and one squeezed into the rail's Document value; the program Overview and the system record showed 5 and the task record 4. Each Retry refetches only its own block (FDB-4 covers the button's own feedback).

Fix: report failure once per region, at page or tab level plus the record header's stale notice, with one Retry that refetches every failed query in that region. Never render QueryState inside a value or cell. Give any Retry that remains a distinct name ("Retry loading comments").

**G4-8 · Failed lookups read as facts: "Not assigned", "Unavailable person", "Requirement unavailable"** (medium)
[program-workspace.tsx:500-503](../../../src/components/prototype/program-workspace.tsx#L500-L503), [tasks.$taskId.tsx:176-178](../../../src/routes/tasks.$taskId.tsx#L176-L178), [workstreams.$workstreamId.tsx:118-121](../../../src/routes/workstreams.$workstreamId.tsx#L118-L121), [requirement-record.tsx:405-408](../../../src/components/prototype/requirement-record.tsx#L405-L408)

The program rail's Sponsor falls back to `parties.isPending ? "Loading…" : "Not assigned"`, so when parties fails the program Overview and all 9 focused views say the program has no sponsor. The task Assignments table prints "Unavailable person" while parties loads or fails, the workstream rail prints "Lead: Unavailable person", and RequirementRevisionLink prints the same text for a missing record and for a failed request. An assurance reader can act on a load failure as if it were recorded data; this is the failure half of REC-7.

Fix: one app lookup component (extend RelationName) with three outcomes: an inline Skeleton while loading, "Could not load" tied to the region's single alert, and Absent when the id is null. Use it in rails and cells. It is not a kit KeyValue state.

**G4-10 · A successful Retry is silent and drops focus to the document** (medium)
[work-common.tsx:69-90](../../../src/components/prototype/work-common.tsx#L69-L90)

The Retry button exists only while `failed` is true, so it unmounts when the refetch succeeds, and nothing announces the restored content. On a task record whose GET tasks had failed, Enter on Retry loading left focus on BODY. A MutationObserver on every status, alert and live region recorded no updates.

Fix: on recovery, focus the region's heading or its first restored control, and announce "Records loaded" in a polite status region that QueryState owns. FDB-4 covers the feedback while retrying.

**G4-12 · A failure in any related collection hides the whole record page, header included** (medium)
[library-products.tsx:303-308](../../../src/components/prototype/library-products.tsx#L303-L308), [library-components.tsx:273-278](../../../src/components/prototype/library-components.tsx#L273-L278), [profiles.$profileId.tsx:73-80](../../../src/routes/profiles.$profileId.tsx#L73-L80)

The product record wraps the whole page, PageHeader included, in `<LibraryLoading queries={[product, revisions, configurations]}>`, and the component record does the same with definition and revisions. A failed list of revisions therefore hides a product that loaded. Live, with only the primary record passing, both pages showed one Alert and no h1.

Fix: render the PageHeader (breadcrumb and name) once the primary record exists, and put QueryState around each dependent region (versions, configurations). The loading skeleton stays with PGL-6 and FDB-3.

| Id | Finding | Where | Fix |
| --- | --- | --- | --- |
| G4-11 | postgrest-js retries GET three times on 503/520 and network errors (1 s, 2 s, 4 s), though useRows sets `retry: false`: a 503 shows "Loading records…" for 8 s before the Alert, and each Retry repeats the wait | [models.ts:106](../../../src/lib/models.ts#L106), [:134](../../../src/lib/models.ts#L134) | Choose one retry owner and write it down next to `retry: false`: disable postgrest retries for reads (`.retry(false)` in scopedQuery, or the client option), or keep them and show "Retrying…" in QueryState |
| G4-18 | A successful save stays pending until every workspace query has refetched: useModelSave awaits invalidation, and the baseline dialog invalidates five tenant-wide prefixes, selected_controls among them (not confirmed live) | [models.ts:184-201](../../../src/lib/models.ts#L184-L201), [system-baseline.tsx:731-736](../../../src/components/prototype/system-baseline.tsx#L731-L736) | Close the surface when the write resolves, then invalidate without awaiting, or only the affected keys; let QueryState report a failed refetch |
| G4-19 | The failed-load browser checks cover one register: GET parties failing on Suppliers | [test-pattern-consistency.mjs:287-320](../../../scripts/test-pattern-consistency.mjs#L287-L320) | test:patterns scenarios for a failed stale refetch with a dialog, preview and nested frame open; a secondary-collection failure on a record page; a slow and a failed picker; typing in a server-searched register |

Already tracked:

- G4-9, the profile rail says "Not resolved" while loading ([profiles.$profileId.tsx:236-248](../../../src/routes/profiles.$profileId.tsx#L236-L248)): VW3-10. This unit adds the failure case: with secondary collections failing, Kind, Catalog and Controls stay "Not resolved" and Imports stays "Loading…" for good, and on Overview a reference-data failure is never reported.
- G4-13, a pending save drops focus to the document, and it stays there after a failure (Allocate requirements, Add from library, the requirement Title Editable): BTN-1 and EDT-10. Kit half: add `isLoading` to PickerSheet's `action` and forward it to Button.
- G4-14, the Allocate requirements error lands below all 640 candidate rows: PIK-5.
- G4-15, a failed Editable save reverts the field and moves the draft to a block at the bottom of the page: EDT-2. Treat it as a contract change: a failed-draft mode in Editable, updated together with Editable.mdx, the Failing story and product-patterns.
- G4-16, RecordBrowser lets the selection change while Link evidence is pending: PIK-7. Disable the table selection, the preview checkbox and Clear selection while saving.

## G5 · Reflow at short heights (400% and 200% zoom) for overlays and the shell

Menus, Select, Combobox, Sheet, Drawer, PreviewSheet and the preview panel stay reachable at 320x256. Overlays that pin several regions fail at 400% zoom (320x256), though, and two kit rules hide keyboard focus in the short scroll region that is left: the global focus scroll-margin cannot fit a scroller under about 160px, and WorkPane's sticky list label covers every focused row in Tailor controls even at 1280x720 and 200%. Fix first: scope the focus scroll-margin to the page, make WorkPane reserve its sticky label's height, and give DialogContent a scrolling fallback alongside MOD-3's DialogBody. Then stop pinning RecordBrowser's context and PickerSheet's toolbar.

**G5-1 · Link evidence is unusable at 400% zoom: the title and Close scroll off the top, and the results get 32px** (high)
[record-browser.tsx:221](../../../packages/design-system/src/patterns/record-browser.tsx#L221), [:231-242](../../../packages/design-system/src/patterns/record-browser.tsx#L231-L242), [:339-362](../../../packages/design-system/src/patterns/record-browser.tsx#L339-L362), [requirement-evidence.tsx:336-351](../../../src/components/prototype/requirement-evidence.tsx#L336-L351)

RecordBrowser sets the popup to 90dvh, renders `context` as a fixed row outside the scroller, and lets the footer wrap. At 320x256 on the requirement's Add evidence, the 103px header sits at -64 with the title and Close above the viewport, the context takes 123px, the results 32px and the footer 81px, and autofocus on the search scrolled the overflow-hidden popup with no scrollbar to scroll back. More filters, Create evidence artifact and every other row checkbox are 0% visible when focused; the same dialog works at 640x360.

Fix:

- Move `context` into the results scroller, above the DataTable, so it scrolls with the list. Do not fold it behind a disclosure, because it can hold an alert.
- Give the body a minimum of about three rows, rely on G5-3's popup fallback scroller, and keep the footer on one row with a truncated count.
- App: [requirement-evidence.tsx:100](../../../src/components/prototype/requirement-evidence.tsx#L100) sets `ready` false while the queries are still loading, so the "could not be loaded completely" alert shows during a normal load and adds to the context height.

**G5-2 · The global focus scroll-margin scrolls focused rows out of short scroll regions** (high)
[layout.css:90-96](../../../packages/design-system/src/styles/layout.css#L90-L96)

Every focus-visible control gets a `scroll-margin-block` of 64px before and 80px after, even in portaled dialogs with no top nav over them, and when that box is taller than the scroller and already straddles it, `nearest` scrolling does nothing. In the PickerSheet story at 320x256 (a 31px list), REQ-0101, 0103 and 0105 are 0% visible when tabbed to, and all are visible with `scroll-margin-block: 0`. Add from library, Tailor controls, Set parameter values and Add evidence alternate the same way (WCAG 2.4.7).

Fix: scope the margin to the page, with `html { scroll-padding-block: var(--shell-top) var(--ds-space-1000) }` as the panel already does, or `.shell-main :focus-visible`, so dialogs, sheets and inner lists get no margin. Add a play that tabs through a 40px list and asserts that each row comes into view.

**G5-3 · DialogContent clips with no scrollbar, and focus scrolls the popup so the title and Close disappear** (high)
[dialog.tsx:62](../../../packages/design-system/src/components/dialog.tsx#L62), [:86-122](../../../packages/design-system/src/components/dialog.tsx#L86-L122)

The popup is `flex-col overflow-hidden` with a max height of `calc(100dvh - 2rem)` and a fixed header and footer, so nothing scrolls when they and a body that cannot shrink exceed the popup, yet `focus()` still scrolls it. The app's Help and shortcuts dialog at 320x256 cuts its second paragraph mid-sentence, and tabbing to Open schema inspector sets `scrollTop` to 127 and puts the header at -111. MOD-3 and A11-15 cover the pinned layout; the new part is a popup that focus can scroll and a pointer cannot, which is also the mechanism in G5-1.

Fix: make the popup the fallback scroller (`overflow-y-auto`) and give the body a minimum height. Below a height threshold (for example `max-height: 30rem`), let the header scroll and keep the footer sticky. Ship it with MOD-3's DialogBody.

**G5-4 · WorkPane's sticky list label hides every focused row in Tailor controls at 1280x720 and 200% zoom** (high)
[work-pane.tsx:99-109](../../../packages/design-system/src/patterns/work-pane.tsx#L99-L109), [control-picker.tsx:122-146](../../../src/components/app/profile-tailoring/control-picker.tsx#L122-L146), [parameter-picker.tsx:102-111](../../../src/components/app/profile-tailoring/parameter-picker.tsx#L102-L111)

When the pane stacks, the listLabel is `sticky top-0 z-10` in the dialog's scroller, and Tailor controls puts the search, the Control set select and the count there, 126px in all. At 640x360 the label covers 113–239 of a 186px scroller, so every focused control row lands under the select trigger (0 of 9 sample points hit the row), and a keyboard user tabbing through 1,196 controls never sees which one has focus (WCAG 2.4.11); Set parameter values fails the same way. PA1-1 explains why the pane stacks in a 1040px dialog, and REC-10 covers the listLabel used as a toolbar.

Fix:

- Kit: have the pane measure the label and publish its height (for example `--work-pane-label`), then set `scroll-margin-top` on its own rows, which beats the zero-specificity global rule. The pane does not own the dialog's scroller, so its scroll-padding is not the place.
- App: keep only the search sticky, and move the filter and the count to the dialog header or a Filters popover.

**G5-5 · PickerSheet pins its header, toolbar and footer at every height, leaving a one-row list** (medium)
[picker-sheet.tsx:93-161](../../../packages/design-system/src/patterns/picker-sheet.tsx#L93-L161)

Only the children scroll: at 320x256 the PickerSheet story measures header 67px, toolbar 85px (the search and chips wrap), list 31px and footer 73px. In the app, Add from library on a system record shows one row at a time, and with G5-2 every other focused row is invisible as well. This is A11-15's pinned-chrome pattern, in PickerSheet.

Fix: below a height threshold, make the toolbar a sticky first row inside the scroller, or let the header and toolbar scroll away and pin only the footer. Truncate the summary to keep the footer on one line, and add a 320x256 story.

**G5-6 · RecordBrowser's preview overflows its region at short heights** (medium)
[record-browser.tsx:272-331](../../../packages/design-system/src/patterns/record-browser.tsx#L272-L331)

The preview section is `flex min-h-0 flex-col` with no overflow rule, its body has no `flex-1`, and the Select label is `mt-auto shrink-0`, so at 320x256 in Browse and link the 70px section has to hold a 53px id row, a 32px body and a 43px Select label. The h3 that takes focus is 38% visible under the dialog footer, and the checkbox is drawn over "0 selected". The fixed rows alone exceed the section, so `flex-1` and `overflow-hidden` would only clip the Select.

Fix: let the whole preview column scroll as one below a height threshold, or move the Select checkbox into the id row.

**G5-9 · Tailor controls and Set parameter values leave 46px and 28px bodies behind 121–139px headers** (medium)
[control-picker.tsx:111-121](../../../src/components/app/profile-tailoring/control-picker.tsx#L111-L121), [parameter-picker.tsx:92-100](../../../src/components/app/profile-tailoring/parameter-picker.tsx#L92-L100)

Both dialog descriptions run four to five lines at 288px, so at 320x256 Tailor controls measures header 121px, body 46px and footer 57px, and Set parameter values 139px, 28px and 57px. The Dialog cause is A11-15 and G5-3, and the stacking at 1040px is PA1-1; what remains here is app copy. Together with G5-4 it makes the step unusable at 400%.

Fix: move the profile title out of the description, since it is already the step's context, and keep one short sentence.

| Id | Finding | Where | Fix |
| --- | --- | --- | --- |
| G5-7 | With the stack expanded at 320x256, the oldest of four toasts sits partly above the viewport | [toaster.tsx:149-165](../../../packages/design-system/src/components/toaster.tsx#L149-L165), [toast.css:2-13](../../../packages/design-system/src/styles/toast.css#L2-L13) | Cap the viewport at `max-height: calc(100dvh - 2 * space.200)` with `overflow-y: auto` while expanded, or lower the limit at short heights |
| G5-8 | The banner, top nav and panel header stay sticky at every height: at 320x256 with a banner and panel, 144 of 256px never scroll. New; SHB-7 and FDB-12 cover banner truncation, not stickiness | [shell.css:44-57](../../../packages/design-system/src/styles/shell.css#L44-L57), [:87-99](../../../packages/design-system/src/styles/shell.css#L87-L99), [panel.tsx:182](../../../packages/design-system/src/layout/shell/panel.tsx#L182) | One `@media (max-height: 30rem)` that sets `--shell-top` to 0 and makes the banner and top nav static (WCAG technique C34) |
| G5-11 | CommandPalette keeps its fixed 80px top offset on short screens, which leaves about three results | [command.tsx:201-207](../../../packages/design-system/src/components/command.tsx#L201-L207) | `top: min(var(--ds-space-1000), 10dvh)`, with matching max-height arithmetic |

Already tracked:

- G5-10, DatePicker's calendar opens above the viewport inside a Dialog at short heights, spanning -122 to 183 at 320x256 ([popover.tsx:41-45](../../../packages/design-system/src/components/popover.tsx#L41-L45)): FLT-1. Add the in-Dialog 640x360 case to the story that fix adds.

## G6 · Non-text contrast and state visibility in dark mode

Dark mode's text and icon tokens hold up: the dark focus ring is 11:1 on the page, and categorical chart series are 3.6–5.3:1. One real kit bug shows only in dark: overlays never publish `utility.elevation.surface.current`, so sticky headers, pinned cells, eye slots and Scroller arrows paint page-coloured bands inside every picker and link dialog. States are weak in both modes and carry no cue but colour: the current page, the default Tabs indicator, the previewed row on touch and the warning Progress fill. The unit's dark measurements for fields, pressed and selected tints, the Switch, the nav and the contrast gate go to INP-12, TOK-7, CTL-3, SHA-5 and TOK-13.

**G6-1 · Overlays do not set the current surface, so tables and scroll arrows inside them paint the page colour in dark mode** (medium)
[dialog.tsx:58-62](../../../packages/design-system/src/components/dialog.tsx#L58-L62), [sheet.tsx:91-108](../../../packages/design-system/src/components/sheet.tsx#L91-L108), [drawer.tsx:106](../../../packages/design-system/src/components/drawer.tsx#L106), [popover.tsx:58-61](../../../packages/design-system/src/components/popover.tsx#L58-L61), [table.tsx:268](../../../packages/design-system/src/components/table.tsx#L268), [record-browser.tsx:275](../../../packages/design-system/src/patterns/record-browser.tsx#L275), [scroller.tsx:94-98](../../../packages/design-system/src/components/scroller.tsx#L94-L98), [Color.mdx:125](../../../packages/design-system/src/stories/tokens/Color.mdx#L125)

Color.mdx says a surface sets `utility.elevation.surface.current` and that sticky headers read it; Card does, but DialogContent, SheetContent, Drawer and PopoverContent paint `bg-surface-overlay` without setting it, so children fall back to `elevation.surface`. In the Link evidence dialog in dark mode, 5 sticky header cells, 20 pinned cells, 20 eye slots and the preview pane paint #14141c on a #1c1c25 dialog, the wizard's product PickerSheet shows the same, and by code so do Scroller arrows, Stepper circles, Stat tiles, the AvatarGroup ring and chart surface strokes inside a Card, Dialog or Sheet. None of it shows in light mode, where most review happens.

Fix:

- Have the static surface utilities (`bg-surface-raised`, `bg-surface-overlay`, `bg-surface-sunken`) publish `--ds-utility-elevation-surface-current` themselves, as Box does, or set it in each overlay part. No new public export is needed (`raisedSurface` is internal).
- Make the Scroller's default surface `bg-surface-current`, and point the avatar ring, the Stepper circles, the Stat tile, the RecordBrowser preview and chart `surface()` at it.
- Add a dark assertion that a DataTable header inside a Dialog has the dialog's background.

**G6-3 · Default (segmented) Tabs: in dark mode the selected chip is darker than its track** (medium)
[tabs.css:13-15](../../../packages/design-system/src/styles/tabs.css#L13-L15), [tabs.tsx:44](../../../packages/design-system/src/components/tabs.tsx#L44), [:113](../../../packages/design-system/src/components/tabs.tsx#L113)

The indicator paints `elevation.surface` with `shadow.raised` over a `bg-neutral` list: 1.12:1 on the track in light, and in dark 1.19:1 and darker than the track, so it reads as a hole, with a 1.03:1 ring and a black shadow on black. The label changes only from text-subtle to text-default (1.54:1 apart in dark) with no weight change, so the state fails 1.4.11 in both modes. The app uses line tabs, but the other products the kit serves get this default.

Fix: carry the state with a cue that is not a fill and reaches 3:1, such as an inset `border.selected` or `border.bold` outline, or a semibold label. For the dark lift, layer a translucent neutral on the track (for example `background.neutral.pressed`), because surface.raised and surface.overlay are also darker than the track in dark. Add an indicator-vs-track pair to contrast.test.mjs.

**G6-4 · The current page in a pager is a 1.04:1 fill in dark mode** (medium)
[data-table/pagination.tsx:98](../../../packages/design-system/src/patterns/data-table/pagination.tsx#L98), [pagination.tsx:67](../../../packages/design-system/src/components/pagination.tsx#L67), [button.tsx:38](../../../packages/design-system/src/components/button.tsx#L38)

The current page is a secondary Button (`bg-surface-raised` plus `shadow-raised`) among subtle ones: its fill is 1.00:1 and its ring 1.17:1 in light, 1.04:1 and 1.22:1 in dark, and its text is 1.54:1 from the other pages in dark. Every register pager uses it, and on /risks in dark the current page is a barely visible tile. Assistive technology gets `aria-current`, but the visual state is far below 3:1.

Fix: style the current page from `aria-current` or `data-current`, not `isSelected`, which adds `aria-pressed`. Use a 2px `border.selected` underline like the line Tabs indicator, plus `font-semibold`, and add the pair to the gate.

**G6-5 · The previewed row is marked only by a blue eye on a faint tint, and on touch every eye shows** (medium)
[table.tsx:451-456](../../../packages/design-system/src/components/table.tsx#L451-L456), [:497-505](../../../packages/design-system/src/components/table.tsx#L497-L505), [:415-417](../../../packages/design-system/src/components/table.tsx#L415-L417)

The active eye is `bg-selected` plus `icon-selected` and the row itself gets no mark; the active and idle icons are 1.03:1 apart in light and 1.31:1 in dark, and the tile is 1.05–1.34:1 against the row. With a pointer only the active eye shows at rest, but with `hover:none` every eye is visible. On a tablet or touch laptop, and for a colour-blind reader, nothing shows which row the panel holds.

Fix: give the active eye a cue that is not colour, such as a filled or different glyph or a 3:1 `border.selected` ring on the tile; optionally, a `data-active` on Table.Row draws a 2px inline-start `border.selected` bar. Do not tint the row `bg-selected`, which is the selection state. Keep `aria-pressed`, and fold in the forced-colours case (TBL-18, DTC-19).

**G6-6 · Warning Progress fills are 1.38:1 on their track in light mode** (medium)
[status-tone.ts:44](../../../packages/design-system/src/lib/status-tone.ts#L44), [progress.tsx:69](../../../packages/design-system/src/components/progress.tsx#L69), [:118-122](../../../packages/design-system/src/components/progress.tsx#L118-L122), [contrast.test.mjs:136](../../../packages/design-system/test/contrast.test.mjs#L136)

`toneClasses.warning.fill` is `bg-warning-bold`, orange-300 in both modes, a fill meant to carry dark text: in light mode it is 1.38:1 against the track and 1.56:1 against the page, so a caution meter is nearly invisible. The contrast gate skips `warning.bold` as a fill, and no story renders a warning Progress, so nothing guards it. The other tones pass in both modes.

Fix: point bar fills at the existing chart status tokens, at least for warning: `color.chart.warning` (orange-600, 3.10:1 on the light track), through `bg-chart-warning`. Keep `background.warning.bold` for fills that carry text, and add fill-vs-track pairs and a warning story row.

| Id | Finding | Where | Fix |
| --- | --- | --- | --- |
| G6-2 | In dark mode a Dialog or Sheet is 1.17:1 against its backdrop and its `surface.sunken` footer 1.00:1, so the bottom edge fades out (3.34:1 and 3.20:1 in light). A consistency issue, not a 1.4.11 failure | [dialog.tsx:111](../../../packages/design-system/src/components/dialog.tsx#L111), [sheet.tsx:153](../../../packages/design-system/src/components/sheet.tsx#L153), [alert-dialog.tsx:110](../../../packages/design-system/src/components/alert-dialog.tsx#L110) | Drop `bg-surface-sunken` from DialogFooter, SheetFooter, AlertDialogFooter and the Drawer footer, keeping the overlay surface and its border-t as Atlassian's ModalFooter does; optionally raise the dark `shadow.overlay` ring alpha to about 0.12 |

Already tracked:

- G6-7, field borders are 2.16:1 on the dark page and 1.98:1 inside a Dialog or Sheet: INP-12, with TOK-3 and A11-3 for choice controls. Add the overlay measurement there.
- G6-8, selected, pressed and highlighted fills are 1.19–1.34:1 in dark with no second cue: TOK-7, A11-2, BTN-2.
- G6-9, the Switch's off track is 1.19:1 in dark: CTL-3. Dark is better than light, but the off track still cannot be seen.
- G6-10, the low sequential and diverging chart steps fall below 3:1 on the dark surface: TOK-13. If it is kept, empty heatmap cells must stay distinguishable from low-value cells.
- G6-12, nothing in CI catches a non-text contrast regression in dark: TOK-13 and A11-12. Add the pairs this unit names: current page vs page, tab indicator vs track, Progress fill vs track per tone, and a DataTable header in a Dialog vs the dialog surface.
- G6-13, the current destination is a 1.15:1 tile in dark, and on record and register pages often none is marked: SHA-5 (strengthen the existing weight cue or add a bar) and VW3-8.

## G7 · Sign-in, workspace bootstrap, session end and account flows

The sign-in happy path works: field types and autocomplete are right, values survive a failure, a second submit cannot fire, and deep links return to their record. WorkspaceProvider, though, collapses every state that is not ready into one bespoke screen, so a pending sign-in unmounts the form and a bootstrap failure is shown as the sign-in form with a raw server string. The most important fix is GAP-2, confirmed live and here extended to a same-tab sign-out. The one new kit issue is that a single-select ToggleGroup (ModeSwitch) puts its tab stop on the first item rather than the pressed one.

**G7-1 · Ending a session throws away unsaved drafts with no prompt, in another tab or the same tab** (medium)
[workspace.tsx:71-81](../../../src/components/app/workspace.tsx#L71-L81), [:110-111](../../../src/components/app/workspace.tsx#L110-L111), [shell.tsx:116-119](../../../src/components/app/shell.tsx#L116-L119), [create-task-dialog.tsx:167-173](../../../src/components/prototype/create-task-dialog.tsx#L167-L173)

On SIGNED_OUT, or SIGNED_IN with a different user, the provider clears the query cache and sets the workspace to null, and children render only while a workspace exists, so AppLayout and any open dialog unmount at once; draft guards are `useBlocker` hooks that fire only on router navigation, and `signOut()` checks nothing. Live, a Create task draft on /work vanished when Sign out ran in a second tab, and a Program name typed on /programs/new vanished on a same-tab Sign out, with no confirmation either time. auth-js also emits SIGNED_OUT when a token refresh fails for good, so an idle, expired tab loses its draft the same way; this confirms GAP-2 and extends it to the same-tab sign-out.

Fix:

- Same tab: register dirty and pending state in a small app context. Sign out awaits `useConfirmation(discardChanges(…))` while anything is dirty, and is blocked while a save is pending.
- Involuntary SIGNED_OUT for the same user: keep the tree mounted behind a blocking kit AlertDialog ("You were signed out. Sign in again to keep your changes.") that calls `signInWithPassword` in place. Clear and unmount only when a different identity signs in or the reader discards, and do not stash tenant drafts in sessionStorage.
- Add a browser check for both paths.

**G7-2 · A workspace bootstrap failure is shown to a signed-in user as the sign-in form** (medium)
[workspace.tsx:62-65](../../../src/components/app/workspace.tsx#L62-L65), [:110-174](../../../src/components/app/workspace.tsx#L110-L174), [database.ts:40-43](../../../src/lib/database.ts#L40-L43)

Any error from `loadWorkspace` leaves the workspace null, so rendering falls through to the sign-in form, with the error as a red line and a subtle Retry connection under it. With `ensure_personal_tenant` returning 500, the page showed "Could not open the workspace: internal error" above empty credentials and a primary Sign in, with no main landmark, no Sign out and the title "My work — Program Assurance". A reload gave the same screen, and a stored session that `getUser` rejects lands there too.

Fix: model the provider as signedOut, loading, failed and ready. For failed, render a PageHeader "Workspace unavailable", a danger Alert with plain copy ("The workspace could not be opened. Check your connection and retry."), a primary Retry with `isLoading`, Sign out with scope local, and the server message as secondary text. Do not copy the Empty-as-error in [__root.tsx:75-96](../../../src/routes/__root.tsx#L75-L96) (PRT-19).

**G7-3 · A failed sign-in drops focus to the body, and the error is not tied to the fields** (medium)
[workspace.tsx:92-101](../../../src/components/app/workspace.tsx#L92-L101), [:116-120](../../../src/components/app/workspace.tsx#L116-L120), [:128-149](../../../src/components/app/workspace.tsx#L128-L149)

`signIn()` swaps the Screen for a loading line, so the form unmounts, and on failure a fresh form mounts with nothing moving focus: at 1440 and 390, focus was on BODY after a wrong password. The error is a raw `<p role="alert">` holding Supabase's "Invalid login credentials", and neither input has `aria-describedby`. The kit side is GAP-1 (no Field error binding).

Fix: fix the remount first (G7-4). On failure, keep the email, focus the password field (or the email field), and point both inputs' `aria-describedby` at the message. Render it as a danger Alert above the fields, and map `invalid_credentials` to "Email or password is incorrect. Check both and try again."

**G7-4 · A pending sign-in replaces the form with "Loading workspace…"** (medium)
[workspace.tsx:92-93](../../../src/components/app/workspace.tsx#L92-L93), [:104-109](../../../src/components/app/workspace.tsx#L104-L109), [:150-152](../../../src/components/app/workspace.tsx#L150-L152)

`setLoading(true)` in `signIn()` swaps the whole screen for a status line, so 150 ms after Enter there is no form, only "Loading workspace…" left-aligned on a blank page. On failure the form jumps back and focus is lost (G7-3). A second Enter sent no request only because the form was gone.

Fix: keep the form. Disable the fields while pending, give the primary `isLoading` rather than `disabled` so it keeps focus (BTN-1), and announce "Signing in…". Switch to the workspace-loading state only after the credentials succeed.

**G7-6 · Sign-in, loading and failure screens keep the route's browser title and have no Sign in heading** (medium)
[__root.tsx:37](../../../src/routes/__root.tsx#L37), [workspace.tsx:114](../../../src/components/app/workspace.tsx#L114)

The gate renders inside whichever route matched, so the sign-in form is titled "Portfolio — Program Assurance" at /, "My work — …" at /work, "Program — …" on a record and "Create program — …" on /programs/new. The only heading is the h1 "Program Assurance", and there is no main landmark (TOO-10). A screen-reader user arriving from a bookmark hears a record title and then finds a sign-in form (WCAG 2.4.2).

Fix: prefer a real /sign-in route with its own `head()` title, "Sign in — Program Assurance", and a redirect search parameter back to the deep link, listed in screen-inventory.json. If the gate stays, title the gated states through the router's head, not a raw `document.title` write. Make the h1 "Sign in to Program Assurance", and wrap the screen in `<main>`.

**G7-10 · A single-select ToggleGroup puts its tab stop on the first item, not the pressed one** (medium)
[mode.tsx:139](../../../packages/design-system/src/mode/mode.tsx#L139), [:149-157](../../../packages/design-system/src/mode/mode.tsx#L149-L157), [shell.tsx:274-291](../../../src/components/app/shell.tsx#L274-L291), [filter.tsx:441](../../../packages/design-system/src/patterns/data-table/filter.tsx#L441)

Opening Profile and appearance put focus on Light, which was not pressed, while Match system was pressed, because Base UI's CompositeRoot makes the first item the tab stop; a keyboard user may take Light for the current mode, and Space switches to it. Base UI Radio and Tabs put the stop on the selected item, as the APG radio group does, and the DataTable filter toggle has the same problem. The dialog's unlabelled workspace name and icon-only switch are TOK-12.

Fix: in ToggleGroup, make the pressed item the roving tab stop for single-select groups (not `multiple`), and document it under Keyboard in ToggleGroup.mdx with a play test. In the app, use `<ModeSwitch showLabels />` in a labelled Appearance row, add a labelled Workspace property, and keep the top-nav switch.

**G7-14 · No check or contract covers sign-in failure, bootstrap states or session end** (medium)
[test-browser.mjs:62](../../../scripts/test-browser.mjs#L62), [test-pattern-consistency.mjs:216](../../../scripts/test-pattern-consistency.mjs#L216), [screen-inventory.json](../screen-inventory.json), [product-patterns.md](../product-patterns.md)

Every browser suite signs in as setup, and none tries a wrong password, a slow or failing `ensure_personal_tenant`, a sign-out, or a session end with a dirty draft. The screen inventory has no sign-in or bootstrap family, and product-patterns.md has no section on them. That is why G7-1 to G7-9 are invisible to test:patterns and verify-screen.

Fix:

- Add test:patterns flows for a wrong password (focus, described error), a delayed and a 500 bootstrap (loading, and failure with Retry and Sign out), a deep link after sign-in, and a cross-tab sign-out with a dirty Create task dialog.
- List the screen in screen-inventory.json once it is a /sign-in route, or add a gate entry to the inventory schema, and add a contract section on sign-in, workspace states and session end.

| Id | Finding | Where | Fix |
| --- | --- | --- | --- |
| G7-5 | On every reload, the workspace loading state is one 13px line on a blank page, with no spinner, main landmark or h1 | [workspace.tsx:104-109](../../../src/components/app/workspace.tsx#L104-L109), [__root.tsx:118-122](../../../src/routes/__root.tsx#L118-L122) | A centred kit Spinner with a delay (about 400 ms) and a visible "Loading workspace" label, inside `<main aria-busy="true">` |
| G7-7 | Sign-out and session end give no reason, and focus is lost on every auth transition | [workspace.tsx:71-81](../../../src/components/app/workspace.tsx#L71-L81), [shell.tsx:295-311](../../../src/components/app/shell.tsx#L295-L311) | Fold the involuntary-reason message into G7-1's re-auth AlertDialog; after an explicit sign-out, focus the sign-in h1 or the email field; after sign-in, focus the page's h1 or main (see PGL-11) |
| G7-8 | Retry connection appears after a wrong password, and clicking it silently clears the error | [workspace.tsx:168-172](../../../src/components/app/workspace.tsx#L168-L172) | Offer Retry only on G7-2's failure screen, never on the credential form |
| G7-9 | The sign-in form uses native validation bubbles, unlike the reference forms (CreateTaskDialog, CreateEvidenceDialog); the same pattern as PA4-8 | [workspace.tsx:121-126](../../../src/components/app/workspace.tsx#L121-L126) | `noValidate`; inline "Enter your email address" and "Enter your password" messages wired with `aria-describedby`; focus the first empty field |
| G7-13 | The Settings trigger opens a dialog titled Profile and appearance; the chevron and `aria-haspopup` half is SHB-14 | [shell.tsx:179-184](../../../src/components/app/shell.tsx#L179-L184), [:274-277](../../../src/components/app/shell.tsx#L274-L277) | Give the trigger and the dialog title the same words |

Already tracked:

- G7-11, ModeSwitch's strings ("Match system", "Colour mode") contradict the Mode page ("System", "Appearance"): TOK-11. Align the defaults at [locale-format.ts:161-162](../../../packages/design-system/src/lib/locale-format.ts#L161-L162) with the page, drop the unused `label` field, and assert the group's name in a play test.
- G7-12, the account trigger's name runs the avatar initial, the email and the role together: SHB-13, SHA-14, VW3-20. Hide the avatar slot from assistive technology in Shell.Profile; in the app, show the person's name from the auth metadata when it exists.

## G8 · Reduced motion at runtime, with interactions

Reduced motion is honoured by the kit's animate-* keyframes, the shell's grid and width transitions, Tabs, Drawer, Toast, the side-nav flyout and Chart, and every overlay ran enter and exit at 0.01 ms. Bare Tailwind transitions and dnd-kit do not honour it: chevrons rotate for 110 ms at eleven sites, Badge and stacked Progress segments use `transition-all`, and dnd-kit slides rows and columns for 200 ms, with smooth keyboard scrolling, in DataTable reordering, which about ten registers turn on. The Scroller's hover scrolling was checked too, and it is scrolling the user controls, not an unrequested animation. Fix the transitions with one self-reducing rule plus a lint rule, pass the chart's reduced-motion hook into the dnd-kit options, and add a computed-style scan to the reduced-motion test projects.

**G8-2 · DataTable drag reordering slides rows and headers for 200 ms under reduced motion** (medium)
[reorder.tsx:56-58](../../../packages/design-system/src/patterns/data-table/reorder.tsx#L56-L58), [:149-157](../../../packages/design-system/src/patterns/data-table/reorder.tsx#L149-L157), [:185-192](../../../packages/design-system/src/patterns/data-table/reorder.tsx#L185-L192)

useColumnDrag and useRowDrag put dnd-kit's `transition` straight into inline style, and DragContext creates the KeyboardSensor with no options, so dnd-kit's defaults apply (a 200 ms `ease` transform transition and `scrollBehavior: 'smooth'`) and nothing reads `prefers-reduced-motion`. With reduced motion on, a keyboard row reorder recorded ten 200 ms transform transitions on `tr`, and a column move six on `th`. That makes reordering the largest movement left under reduced motion, and the hard-coded 200 ms also breaks the token rule.

Fix: move the chart's `useReducedMotion` ([_shared.tsx:513-525](../../../packages/design-system/src/patterns/chart/_shared.tsx#L513-L525)) into src/lib. Pass `useSortable` a `transition` of `null` when reduced (otherwise the motion tokens' duration and easing) and `animateLayoutChanges: () => !reduced`, and give the KeyboardSensor `scrollBehavior: reduced ? "auto" : "smooth"`. The Scroller and use-side-nav-overlay can share the hook.

| Id | Finding | Where | Fix |
| --- | --- | --- | --- |
| G8-8 | Nothing in CI checks that movement stops under reduced motion: the reduced-motion projects run every story, but only a few plays assert motion, which is how the findings in this group sat under a claim of full coverage | [vitest.config.ts:83-106](../../../packages/design-system/vitest.config.ts#L83-L106) | After render, fail on any element whose computed transition-property includes transform, rotate, translate, scale, width, height or all above 0.01 ms, or that runs a movement animation above 10 ms, with a short allow-list; record `transitionrun` during play for inline JavaScript transitions such as dnd-kit's; pair it with the lint rule from G8-1 |

Already tracked:

- G8-1, disclosure chevrons still rotate for 110 ms under reduced motion at eleven sites, the app's system tree among them: TOK-15. Add one unlayered reduced-motion rule in motion.css (`.transition-transform { transition-duration: 0s }`, mirroring the `.animate-pulse` stop) or a self-reducing `transition-turn` utility, plus a lint rule for new sites.
- G8-4, the Inspector's Details chevron looks the same open or closed: REC-4 and DSC-2. New detail: seven story copies use Radix's `data-[state=open]`, the Motion page's own chevron demo among them; fold them into REC-4's fix.
- G8-5, the indeterminate Progress pulse keeps running because `motion-reduce:animate-none` loses on specificity: FDB-7. The same dead class sits on five popups, which are fine only because their animate utilities reduce themselves.
- G8-6, `transition-all` on Badge and ProgressStacked segments animates ring geometry and segment widths: TOK-15. Use `transition-colors`, and reject `transition-all` in the package lint.
- G8-7, the Motion page overstates reduced motion: TOK-15. The Spinner needs no decision, because the code, Spinner.mdx and its Preference story agree that it stops; correct [Motion.mdx:69](../../../packages/design-system/src/stories/tokens/Motion.mdx#L69) and the table rows at :42, :48 and :50.
