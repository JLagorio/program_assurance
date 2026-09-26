# Appendix: method and coverage

Part of the [Ledger audit, 24 September 2026](README.md).

## How the audit ran

The audit ran as a set of Claude Code workflows over the working tree of the `design-system` branch on 24 and 25 September 2026, while another session was fixing the 24 September responsive audit in the same checkout. Every agent was read-only: no edits, builds, test suites or git changes. Line numbers are those of the working tree at the time and may drift as that session's fixes land.

1. **Audit.** 47 units ran in parallel. Each of the 33 kit families read its source, stories, MDX page and tests; judged each part against the WAI-ARIA Authoring Practices, WCAG 2.2 AA, Base UI's behaviour and peer systems (Atlassian first, then Carbon, Polaris, Base Web, shadcn/ui and React Aria); and traced every use of the part in `src/`. Five cross-cutting units looked at missing components, API consistency, accessibility across the kit, documentation and performance. Six prototype units read every file under `src/components` and `src/routes` against the [product pattern contract](../product-patterns.md). Three agents walked the running app, signed in as the seeded developer on WS-X90, at 1440 and 390 (1024 for record pages), and read their own screenshots. Live checks used Storybook on port 6007 and the app on port 8080, one headless browser per agent, because the machine was already loaded.
2. **Verify.** Each unit's findings went to a separate adversarial verifier. It re-opened the cited code, looked for mechanisms that already handle the case, re-rendered where that was cheap, re-rated the severity, and corrected the location or fix where needed. Its default was to refute what it could not confirm. 21 of 997 findings were refuted and dropped.
3. **Reproduce.** A ranking agent picked the 30 high findings most likely to lead the report, and a fresh agent tried to reproduce each one from scratch. All 30 reproduced. 10 were downgraded to medium because the real effect was narrower than first stated: CNT-1, CTL-1, EDT-2, GAP-1, NAV-2, PA1-3, PA5-3, PRF-3, TOO-1, VW1-3.
4. **Coverage-gap round.** A completeness critic read the whole index against the export list and the story list. It found no family without an owner but named eight dimensions no unit had run systematically, from long unbroken content to reduced motion at runtime. Those became units G1 to G8, with the same audit and verify stages.
5. **Write.** Section writers composed this document from verified findings only, applying each verifier's corrections.

In total 55 units produced 997 findings. 976 were kept: 1 critical, 101 high, 488 medium and 386 low.

## What this audit did not do

- It ran no test suites, type checks or builds, and did not run axe on every story. The Storybook a11y suite covers that; G2 ran axe on the app's routes.
- The app walks used the seeded WS-X90 workspace. Screens that only appear with other data (very large programs, other roles, an empty workspace) were reached where the auditors could seed the state without writing data, and not otherwise.
- The first run hit the session limit before the reproduction pass. It was re-planned as described above, so only the top 30 high findings were reproduced independently. The other high findings passed one adversarial verifier.

## Units

| Code | Kind | Scope | Raised | Kept | Refuted | High or critical |
|---|---|---|---|---|---|---|
| BTN | Kit family | Actions: Button, IconButton, ButtonGroup, Toggle, ToggleGroup | 20 | 19 | 1 | 3 |
| INP | Kit family | Text inputs and fields: Input, Textarea, InputGroup, Field, Forms recipes | 18 | 18 | 0 | 3 |
| CTL | Kit family | Choice controls: Checkbox, RadioGroup, Switch, controls.tsx | 18 | 18 | 0 | 4 |
| SEL | Kit family | Select and Combobox | 20 | 19 | 1 | 1 |
| DAT | Kit family | Dates: Calendar and DatePicker | 15 | 14 | 1 | 2 |
| MOD | Kit family | Modal overlays: Dialog, AlertDialog, Sheet, Drawer | 16 | 15 | 1 | 4 |
| FLT | Kit family | Floating: Popover, HoverCard, Tooltip | 13 | 12 | 1 | 0 |
| MNU | Kit family | Menus and commands: DropdownMenu, menu.ts, Command, CommandPalette, command-keys, Kbd | 20 | 20 | 0 | 3 |
| DSC | Kit family | Disclosure: Tabs, Collapsible, Accordion | 16 | 16 | 0 | 2 |
| TBL | Kit family | Table (plain) and table-state | 19 | 19 | 0 | 0 |
| DTC | Kit family | DataTable core | 19 | 19 | 0 | 3 |
| DTP | Kit family | DataTable parts: columns, filters, columns menu, group-by, reorder, selection bar, pagination, metrics, responsive | 22 | 22 | 0 | 3 |
| TLB | Kit family | Toolbar, ActionBar, Pagination component | 18 | 16 | 2 | 4 |
| STS | Kit family | Status and identity: Badge, Count, Dot, Indicator, FilterChip, status-tone, Avatar, Id | 20 | 20 | 0 | 1 |
| FDB | Kit family | Feedback: Alert, Banner, Toaster, Progress, Spinner, Skeleton | 17 | 17 | 0 | 1 |
| EMP | Kit family | Empty states: Empty and its illustrations | 16 | 16 | 0 | 2 |
| CNT | Kit family | Content display: Card, Item, KeyValue, Fact, Separator, Typography, CodeBlock, TextLink | 20 | 20 | 0 | 2 |
| STR | Kit family | Structures: Tree, Timeline, Stepper | 20 | 20 | 0 | 2 |
| NAV | Kit family | Navigation and scrolling: Breadcrumb, Scroller, ScrollArea, Resizable | 16 | 15 | 1 | 1 |
| STA | Kit family | Stat and Attachment | 17 | 17 | 0 | 1 |
| SHA | Kit family | Shell A: root, context, side nav, overlay, storage | 15 | 15 | 0 | 2 |
| SHB | Kit family | Shell B: top nav, panel, splitter | 20 | 20 | 0 | 1 |
| PGL | Kit family | Page layout: PageHeader, Section, PageSkeleton, slots, landmark title, fill window | 19 | 19 | 0 | 1 |
| PRM | Kit family | Primitives: Box, Stack, Inline, Flex, Grid, Bleed, Text, Heading | 17 | 15 | 2 | 1 |
| TOK | Kit family | Tokens, theming, colour mode, density, global styles | 19 | 19 | 0 | 3 |
| CHF | Kit family | Chart foundation: shared, Frame, Chart | 20 | 20 | 0 | 3 |
| CHX | Kit family | Cartesian charts: Bar, Line/Area, Sparkline | 18 | 18 | 0 | 2 |
| CHO | Kit family | Other charts: Donut/gauge, Scatter, Heatmap, Treemap | 20 | 20 | 0 | 3 |
| EDT | Kit family | Editing patterns: Editable, Composer | 19 | 19 | 0 | 0 |
| REC | Kit family | Record display patterns: Inspector, Related, Glance, Gates, TaskRow, WorkPane | 22 | 21 | 1 | 2 |
| PIK | Kit family | Selection patterns: PickerSheet, RecordPicker, RecordBrowser | 20 | 20 | 0 | 4 |
| PRV | Kit family | Preview patterns: PreviewSheet, PreviewHeader, PreviewNavigation | 17 | 16 | 1 | 1 |
| TOO | Kit family | Tooling and shared lib: ESLint plugin, ds-check, API baseline, tests, Storybook config, packaging, lib helpers | 18 | 18 | 0 | 0 |
| GAP | Cross-cutting | Missing components and patterns (gap analysis) | 15 | 15 | 0 | 0 |
| API | Cross-cutting | Kit-wide API consistency | 20 | 20 | 0 | 1 |
| A11 | Cross-cutting | Systemic accessibility | 17 | 17 | 0 | 5 |
| DOC | Cross-cutting | Documentation and guidance quality | 19 | 19 | 0 | 0 |
| PRF | Cross-cutting | Performance and packaging | 14 | 12 | 2 | 2 |
| PA1 | Prototype slice | Prototype conformance: app shell, wizard, tailoring, record browser, fields | 21 | 21 | 0 | 2 |
| PA2 | Prototype slice | Prototype conformance: assessments, findings, packages, SSP, work | 20 | 20 | 0 | 1 |
| PA3 | Prototype slice | Prototype conformance: libraries and products | 22 | 21 | 1 | 1 |
| PA4 | Prototype slice | Prototype conformance: program and system views | 20 | 20 | 0 | 2 |
| PA5 | Prototype slice | Prototype conformance: requirements, evidence, previews, record tools | 20 | 20 | 0 | 1 |
| PRT | Prototype slice | Prototype conformance: routes | 20 | 20 | 0 | 2 |
| VW1 | App walk | App walk: dashboards and global registers | 24 | 23 | 1 | 3 |
| VW2 | App walk | App walk: program record, program tabs and focused views, wizard | 23 | 22 | 1 | 1 |
| VW3 | App walk | App walk: record pages, forms, confirmations, dark mode, keyboard | 23 | 22 | 1 | 3 |
| G1 | Coverage gap | Long, unbroken and expanded content stress (plus WCAG 1.4.12 text spacing) | 13 | 13 | 0 | 0 |
| G2 | Coverage gap | Axe and console sweep of every app route and open state | 18 | 18 | 0 | 3 |
| G3 | Coverage gap | Systematic focus-indicator sweep: clipping and contrast, light and dark | 19 | 19 | 0 | 4 |
| G4 | Coverage gap | Slow and failing loads on record pages, program tabs, previews and pickers | 19 | 18 | 1 | 2 |
| G5 | Coverage gap | Reflow at short heights (400% and 200% zoom) for overlays and the shell | 11 | 11 | 0 | 4 |
| G6 | Coverage gap | Non-text contrast and state visibility in dark mode | 13 | 12 | 1 | 0 |
| G7 | Coverage gap | Sign-in, workspace bootstrap, session end and account flows | 14 | 14 | 0 | 0 |
| G8 | Coverage gap | Reduced motion at runtime, with interactions | 8 | 7 | 1 | 0 |

## Refuted claims

These were raised and then dropped by a verifier. They are listed so nobody re-raises them without new evidence.

| Id | Claim | Why it was dropped |
|---|---|---|
| BTN-10 | ToggleGroup has no required single-selection option, so each consumer re-implements the guard | This is a deliberate, documented decision. The migration handoff (docs/guides/design-system-migration-handoff.md:16) says 'required selection belongs in caller callbacks', and ToggleGroup.mdx:23,41 documents `details.cancel()`. |
| SEL-15 | Selects without `items` restate each label in SelectValue and lose their value types | The type claim is wrong. Base UI's Select Root infers Value from the `value` prop (SelectRoot.d.ts:139-143), and every cited call site passes `value`. The casts (`value as Relationship`, `value as Source`) strip the nullable `/ null` from onValueChange; the value is not `unknown`. |
| DAT-12 | DatePicker's onBlur fires when focus moves into its own popup | The blur does fire when focus moves into the popup, as with any trigger whose popup takes focus; the kit's Select behaves the same way. But the kit's form contract validates on submit (product-patterns Forms; the InField and FocusIntegration stories use revalidateLogic mode "submit"). |
| MOD-11 | React autoFocus overrides Base UI's touch-open focus, so the phone keyboard opens immediately | The premise is false for the prototype. Base UI's touch rule (createDefaultInitialFocus, popupStoreUtils.mjs:27-28) depends on openMethod, and only DialogTrigger sets it (DialogTrigger.mjs:59; the store default is null). |
| FLT-13 | The three pages are mostly API and migration notes, with no when-to-use, content guidance or Don't sections | The comparison is inaccurate. Button.mdx itself no longer has Anatomy, Content or Don't sections: its headings are Variants and sizes, Loading and forms, Composition, Accessibility, Props and Related. |
| TLB-13 | Toolbar's More labels, popover titles and group name are hard-coded English | Already fixed in the working tree. toolbar.tsx:318-327,374 now use t("moreFiltersAndDisplay"), t("moreDisplay"), t("moreFilters"), t("filtersAndDisplay"), t("filters") and t("display"). The keys were added to locale-format.ts:151-155, and Toolbar.mdx:97 documents them. |
| TLB-18 | The 'Collection actions' overflow is rebuilt by hand wherever it is needed | The overflow is built once in the product, in ProductCollection (product-collection.tsx:75-99), the shared adapter that product-patterns designates to own the register toolbar. The other copies are kit stories demonstrating the composition. No drift across screens is shown. |
| NAV-16 | Scroller re-observes every child of the viewport on every child-list change | The mechanism is real: observeChildren re-observes every direct child on each childList mutation (scroller.tsx:246-257), and ComboboxList's options are direct children. But ResizeObserver delivers one batched callback per frame, and nothing shows a measurable cost. The finding itself says it is unlikely to be visible. |
| PRM-12 | Flex duplicates Stack and Inline under a second vocabulary and is never used | Flex mirrors Atlassian's primitives, which keep Flex with gap/alignItems/justifyContent beside Inline and Stack's space/alignBlock/alignInline. The kit serves several products, so 'unused in this product' is not grounds to deprecate. |
| PRM-14 | Viewport-keyed Grid templates are used inside dialogs | component-library.md:174 explicitly lists overlays and 'the Grid primitive's responsive columns' as places where viewport breakpoints belong. DialogContent is capped at 520px, so the dialog's width follows the viewport one-to-one below the cap: one column under 640px and two above it. |
| REC-19 | Related.Card rises on hover like a clickable card, but only the title is clickable | The hover elevation is a documented, deliberate state. Related.mdx's States table reads 'Hover on a card: elevation.shadow.raised under it; the actions appear; the name underlines under the pointer'. |
| PRV-17 | App preview checks cover anatomy, not frame semantics or position accuracy | The central claim is false. scripts/test-preview-frames.mjs:134-205 checks, at 1600px and 390px: Close and Escape at the root, focus returning to the eye, a keyboard-opened nested frame with the panel focused, Back with the panel focused and parent search retained, and Close in a nested frame returning to the parent and then closing. |
| PRF-10 | dnd-kit is mounted in every DataTable and ships in the shared production chunk though one app table reorders | The premise is false. |
| PRF-12 | In dev, the root barrel loads every kit module, including recharts, on every page | True but not worth fixing. It affects only dev: the `development` condition maps the package to src/index.ts so kit edits hot-reload in the app, and production already tree-shakes Chart, Calendar and Resizable (no recharts-wrapper or react-day-picker in .output, rebuilt 2026-09-24 23:54). |
| PA3-18 | Names in library collections open the diagnostic schema inspector | The contract sanctions this directly: "a model without a dedicated page links to its schema record", and the finding concedes it. Its alternative, making the name open the preview, conflicts with "Buttons act; links navigate" and "A row click follows the name's destination and is never the only opener". |
| VW1-22 | Tab strip on touch shows a persistent grey scrollbar under the underline | The visible horizontal ScrollBar on touch is the documented overflow cue. Tabs.mdx:34 says the Scroller's click arrows mark the overflowed edge for pointer readers and replace the scrollbar while they show; touch readers swipe with the bar. |
| VW2-23 | Status of known responsive-2026-09-24 items in this walk | This is a status roll-up, not a finding. The claim that #11 (the eye covers text) still reproduces is inaccurate. The kit now puts the preview body in a 'min-w-0 flex-1 truncate' span beside the eye (data-table.tsx:607-614), so the eye no longer overlays text. |
| VW3-23 | Status of the 24 September responsive items on these record pages at 390 | This is a status note on items another session is tracking (responsive-2026-09-24 #2, #4, #5, #6), not a defect report. Its one new observation, a scrollbar under the campaign tab strip at 390 but none on the profile, is timing-dependent and unconfirmed. |
| G4-17 | Loading is a bare 'Loading records…' line everywhere, down to single values, and Retry is a full-width button outside the Alert | This is true, but it duplicates FDB-3, FDB-4 and PGL-6 (loading shape and retry feedback) and G4-7 (one boundary per region), and it says so itself. It is also already recorded in docs/guides/pattern-audit-2026-09-17.md:62 ('QueryState itself renders loading as a grey paragraph'). |
| G6-11 | Resize handles are a 1px hairline at 1.23:1 (light) and 1.36:1 (dark); the Shell splitter shows nothing until hovered | Resizable (resizable.tsx:39) shows its boundary as the region's border-default hairline and turns brand on hover. The Shell splitter (splitter.tsx:161) reveals brand.bold on hover, focus or drag, and widens its hit area on coarse pointers. |
| G8-3 | Scroller hover zones in menus and comboboxes scroll continuously under reduced motion | The behaviour is real: in components-scroller--vertical under reduced motion, 500ms of hover on the end zone scrolled 0 to 245px. But this is not an animation the reader did not ask for. The hover zone is the scroll control. |
