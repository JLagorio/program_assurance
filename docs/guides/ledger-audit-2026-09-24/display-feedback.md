# Family deep dive: status, feedback and content display

Part of the [Ledger audit, 24 September 2026](README.md).

Six groups: status and identity (STS), feedback (FDB), empty states (EMP), content display (CNT), structures (STR), and Stat and Attachment (STA).

Several kit files changed while this audit ran, so line anchors in them were checked against the working tree and moved where the code had moved: data-table.tsx, table.tsx, text-link.tsx, key-value.tsx, work-pane.tsx, locale-format.ts, button.tsx, Stat.mdx, FilterChip.stories.tsx and docs/next.md.

## Badge, Count, Dot, Indicator, FilterChip, Avatar, Id

The kit layer is sound. One tone table feeds every status part, and Badge and FilterChip are well built and tested. The product layer undoes it: seven local tone mappers and ImpactBadge disagree, so WS-X90's "Active" is grey on Portfolio and green on /programs and in its Details rail, and impact levels are pills with Low in green. The fix is one status map in `src/lib` behind one product status component, the open "domain component layer" item (STS-1), backed by a lint rule for Badge's bold default. What remains in the kit: Badge clips long RMF words, added and removed Counts differ by colour alone, AvatarGroupCount fits only two sizes, and the Count and Avatar docs are stale.

**Keep:** one tone table ([status-tone.ts](../../../packages/design-system/src/lib/status-tone.ts)) with token-named tones feeds Badge, Dot, Indicator, Progress and Avatar.Badge; the contrast gate covers every status subtle, bold, text and icon pairing in light and dark; Badge `render` keeps a real anchor, merges refs and handlers, and grows a 24px touch target only when interactive; role boundaries are documented with Do and Don't pairs (status is a Badge, rank an Indicator, a number a Count, one bold per view); FilterChip switches between `aria-pressed` and `aria-expanded`, with plays for focus return and folding into More; the prototype has no hand-rolled pills or raw tone classes; Avatar uses Base UI image loading with fallback and retry, gives each name a stable hue, and Person hides its avatar beside the visible name; every tone and avatar treatment is legible in dark mode.

**STS-2 · Badge defaults to brand bold, so a status without `variant="secondary"` turns solid** (medium)

[badge.tsx:47](../../../packages/design-system/src/components/badge.tsx#L47), [:53-54](../../../packages/design-system/src/components/badge.tsx#L53-L54), [control-detail.tsx:63](../../../src/components/app/profile-tailoring/control-detail.tsx#L63), [components.tsx:50-52](../../../src/routes/components.tsx#L50-L52)

`defaultVariants` is `{ variant: "default" }`, which resolves to the brand tone with bold appearance, and a `tone` passed alone keeps the bold emphasis. About 35 app call sites repeat `variant="secondary"` to avoid this. Four forgot: "Withdrawn" renders as a solid orange fill, and /components shows Draft, Published and In progress all bold, against "one bold per view".

**Fix:**

- Add a lint rule: a Badge with a status tone and no `variant` or `appearance` is an error, with a fixer that adds `variant="secondary"`. Do not make the appearance depend on whether `variant` was passed, which would contradict the documented default.
- Fix the four sites, and let the product status component (STS-1) own the variant.

**STS-3 · Badge clips its label with no ellipsis and no full text** (medium)

[badge.tsx:27](../../../packages/design-system/src/components/badge.tsx#L27), [columns.tsx:33](../../../packages/design-system/src/patterns/data-table/columns.tsx#L33), [:378](../../../packages/design-system/src/patterns/data-table/columns.tsx#L378)

The recipe is `inline-flex w-fit shrink-0 overflow-hidden whitespace-nowrap`, with no `max-w-full`, no truncating inner span and no title. In the Badge "In rows" story, a 112px Status column renders the mandated RMF word "Other than satisfied" as "Other than satisfie", and the reader has no sign that it is cut. The family truncates three ways: Badge clips, Indicator ellipsises with no title ([badge.tsx:314](../../../packages/design-system/src/components/badge.tsx#L314)), and FilterChip ellipsises and sets a title ([chip.tsx:60](../../../packages/design-system/src/components/chip.tsx#L60)).

**Fix:** Add `max-w-full`, wrap the label in a truncating span and expose the full text as a Tooltip or title, as FilterChip does. Size DataTable status columns from their longest option, or raise the 120px status minimum.

**STS-7 · Count's added and removed appearances differ by colour alone** (medium)

[badge.tsx:237-238](../../../packages/design-system/src/components/badge.tsx#L237-L238), [:253-264](../../../packages/design-system/src/components/badge.tsx#L253-L264)

Count renders only `String(value)`, and the two appearances differ only in fill. In Count "In context" the accessibility tree reads "Rows changed 12 3", and under forced colours both pills become bare numbers, so screen-reader, colour-blind and high-contrast users cannot tell rows added from rows removed. Count.mdx says "The appearance is not the only signal", which is not true for this pair.

**Fix:** Render a sign for these two appearances ("+12", and "−3" with U+2212) or visually hidden "added" and "removed" text, and correct Count.mdx.

**STS-8 · AvatarGroupCount fits only small and medium avatars, and the overlap is fixed at every size** (medium)

[avatar.tsx:229](../../../packages/design-system/src/components/avatar.tsx#L229), [:243](../../../packages/design-system/src/components/avatar.tsx#L243)

The count circle is `size-300`, or `size-400` beside medium avatars, with a fixed `font-body-xsmall`. Beside 40px and 64px avatars it stays 24px, and beside 16px avatars it is larger than they are. The 6px overlap is 37% of a 16px avatar and 9% of a 64px one, so a reviewer group at any other size looks broken, and the hidden members cannot be seen at all.

**Fix:**

- Read the members' size through context, as AvatarBadge does through RootContext, or with group-has selectors for every size, and scale the overlap per size.
- Do not add `max`. Add a story and docs that make AvatarGroupCount a Popover or HoverCard trigger listing the hidden names.

**STS-11 · Impact and severity levels are pills, with Low in success green** (medium)

[system-assurance-details.tsx:39-55](../../../src/components/prototype/system-assurance-details.tsx#L39-L55), [index.tsx:137](../../../src/routes/index.tsx#L137), [program-systems-tree.tsx:240](../../../src/components/prototype/program-systems-tree.tsx#L240), [program-record.tsx:468](../../../src/components/prototype/program-record.tsx#L468), [assessment-browser.tsx:383](../../../src/components/prototype/assessment-browser.tsx#L383), [review.tsx:197-199](../../../src/components/app/program-wizard/review.tsx#L197-L199)

ImpactBadge renders each FIPS 199 C/I/A level as a Badge pill, three per row, maps low to success, and shows a raw "—" with an `aria-label` on a span when a level is missing. Portfolio's "Latest severity" column shows Moderate as neutral and Critical as danger. [status-vocabulary.md](../status-vocabulary.md#L37) and the Indicator Don't story say Critical and High are danger, Moderate warning and Low neutral ("A low severity is not good news"), so rows carry several pills and the same level changes colour between screens.

**Fix:** Render levels through Indicator everywhere, driven by the shared status map (STS-1), and use Absent for a missing level.

| Id     | Finding | Where | Fix |
| ------ | ------- | ----- | --- |
| STS-4  | Ghost and link Badges on a static span gain a hover fill and an underline, because their hovers are not scoped to `[a]` as the filled treatments are. No consumer uses them this way yet. | [badge.tsx:38](../../../packages/design-system/src/components/badge.tsx#L38), [:83](../../../packages/design-system/src/components/badge.tsx#L83) | Scope both hovers to `[a]` and `[button]`, and assert in a play that a static span does not change on hover. |
| STS-5  | A brand subtle, outline or ghost Badge link drops to 4.18:1 on hover in both modes, and contrast.test.mjs never checks `text.brand` on `brand.subtlest`. Nothing in the product uses the combination. | [badge.tsx:76-83](../../../packages/design-system/src/components/badge.tsx#L76-L83), [contrast.test.mjs:106-107](../../../packages/design-system/test/contrast.test.mjs#L106-L107) | Paint the hovered fill with `text.brand.bolder` or `text.selected`, or retune `brand.subtlest.hovered`. Add `text.brand` on `brand.subtlest` and on its hovered step, plus the Avatar accents, to the test. |
| STS-9  | Shell.Profile renders its avatar beside the visible name without hiding it, so the account button reads "D developer@program-assurance.local Owner". shell.tsx also sets a `title` and a `hue` that does nothing on the neutral variant. | [shell.tsx:224-226](../../../src/components/app/shell.tsx#L224-L226), [top-nav.tsx:252](../../../packages/design-system/src/layout/shell/top-nav.tsx#L252) | Shell.Profile renders its `avatar` `aria-hidden`, since the name is always present. Drop the `title` and `hue` in shell.tsx. No Avatar `name` prop: Avatar.mdx already documents role=img plus aria-label. |
| STS-10 | FilterChip.mdx recommends "a toggle that cycles", which keeps `aria-pressed=true` while its name goes from "Owner" to "Owner Dana Whitfield" to "Owner Priya Natarajan". | [FilterChip.mdx:33](../../../packages/design-system/src/stories/components/FilterChip.mdx#L33), [FilterChip.stories.tsx:148-157](../../../packages/design-system/src/stories/components/FilterChip.stories.tsx#L148-L157), [chip.tsx:38](../../../packages/design-system/src/components/chip.tsx#L38) | Remove the cycling row (three values become a Popover chip) and rewrite the InToolbar Owner chip as a Popover trigger. |
| STS-13 | `c.status` renders the 20px small Badge, while Badge.mdx and every hand-rendered row status use the 16px xsmall, so Portfolio's two tables show different pill heights. | [columns.tsx:366](../../../packages/design-system/src/patterns/data-table/columns.tsx#L366), [:378](../../../packages/design-system/src/patterns/data-table/columns.tsx#L378), [Badge.mdx:90](../../../packages/design-system/src/stories/components/Badge.mdx#L90) | Render xsmall in `c.status` and its Editable, or let the table's density pick the size. |
| STS-15 | Count's `max` and `appearance` omit `\| undefined`. Id and Dot take no native props or ref, and Indicator and Count exclude ref. FilterChip's root has no data-slot, and the Avatar parts spread consumer props after data-slot. The prototype puts a prohibited `aria-label` on an Indicator span. | [badge.tsx:245-247](../../../packages/design-system/src/components/badge.tsx#L245-L247), [id.tsx:5-20](../../../packages/design-system/src/components/id.tsx#L5-L20), [chip.tsx:36](../../../packages/design-system/src/components/chip.tsx#L36), [avatar.tsx:114-117](../../../packages/design-system/src/components/avatar.tsx#L114-L117), [system-assurance-details.tsx:239-243](../../../src/components/prototype/system-assurance-details.tsx#L239-L243) | Spell the optionals `?: T \| undefined`, forward native span props and ref on Id, Dot, Indicator and Count, add FilterChip's data-slot, put data-slot after the spread in Avatar, and remove the aria-label from the Indicator. |
| STS-16 | Count prints `String(value)` rather than the locale formatter, and four tabs pass `max={99999}`, so 1,189 renders as "1189" and five digits get past the documented 9999 ceiling. | [badge.tsx:253](../../../packages/design-system/src/components/badge.tsx#L253), [catalog.tsx:123](../../../src/routes/catalog.tsx#L123), [library-products.tsx:536](../../../src/components/prototype/library-products.tsx#L536), [library-components.tsx:634](../../../src/components/prototype/library-components.tsx#L634), [profiles.$profileId.tsx:230](../../../src/routes/profiles.$profileId.tsx#L230) | Format with `useLedgerLocale().formatNumber`, and cap tab counts at 9999 or show exact totals in a Stat. |
| STS-17 | Count.mdx says consumers hide a zero count and lists Tabs and Collapsible as taking one, though Tabs dropped its count and the assessment tabs show "0". Avatar.mdx has no ArgTypes or usage guidance, and AvatarBadge's docstring uses danger for "away". | [Count.mdx:39](../../../packages/design-system/src/stories/components/Count.mdx#L39), [:88](../../../packages/design-system/src/stories/components/Count.mdx#L88), [Tabs.mdx:79](../../../packages/design-system/src/stories/components/Tabs.mdx#L79), [assessment-browser.tsx:139-149](../../../src/components/prototype/assessment-browser.tsx#L139-L149), [avatar.tsx:106](../../../packages/design-system/src/components/avatar.tsx#L106) | Update Count.mdx for composed counts and the zero rule, bring Avatar.mdx up to the family template with ArgTypes, and define presence as its own vocabulary, not status tones. |
| STS-18 | Id.mdx says an id is "selected like any word", but double-clicking CTRL-0412 selects "-" and AC-2(3) selects "2". | [Id.mdx:28](../../../packages/design-system/src/stories/components/Id.mdx#L28) | Correct the sentence. Do not use `user-select: all`, which would hijack selection in sentences, cells and links; if copying ids proves a workflow, add a copy action in Inspector Details. |
| STS-19 | control-detail.tsx is a second copy of library-controls.tsx's parts tree and renders `part.source_id` as a plain span. Codes are also plain text in the wizard review, parameter-picker and the tailoring editor. | [control-detail.tsx:4-37](../../../src/components/app/profile-tailoring/control-detail.tsx#L4-L37), [library-controls.tsx:170](../../../src/components/prototype/library-controls.tsx#L170), [review.tsx:196](../../../src/components/app/program-wizard/review.tsx#L196), [parameter-picker.tsx:249](../../../src/components/app/profile-tailoring/parameter-picker.tsx#L249), [editor.tsx:449](../../../src/components/app/profile-tailoring/editor.tsx#L449) | Share one control-parts composition and wrap codes in Id. |
| STS-20 | The Count, Indicator and Id stories have no play functions, so the 99+ cap, Dot's naming switch, Indicator truncation and Id.List's empty word are untested. | [Count.stories.tsx:27](../../../packages/design-system/src/stories/components/Count.stories.tsx#L27) | Add plays for the Count cap, Dot naming in both modes, Indicator truncation with the full text reachable, and Id.List empty and wrap. |

**Missing in this family:**

- Shared status map (value to label, tone and sort rank): every status column and badge needs one source for its tone, label and rank. Today `c.status` takes a local tone function per column and sorts alphabetically unless a `sortBy` is written ([columns.tsx:336-338](../../../packages/design-system/src/patterns/data-table/columns.tsx#L336-L338)) (STS-1). High.
- Badge `maxWidth` with accessible truncation: RMF determinations are long product words that must fit status columns without losing text (STS-3). Medium.

**Already tracked:**

- STS-1, status-to-tone mapping re-implemented seven times ([work-format.ts:12-19](../../../src/components/prototype/work-format.ts#L12-L19), [program-shared.tsx:68-83](../../../src/components/prototype/program-shared.tsx#L68-L83), [record-tools.tsx:37-45](../../../src/components/prototype/record-tools.tsx#L37-L45), [program-timeline.ts:35-41](../../../src/lib/program-timeline.ts#L35-L41), [system-baseline.tsx:149-155](../../../src/components/prototype/system-baseline.tsx#L149-L155), [system-assurance-details.tsx:103-108](../../../src/components/prototype/system-assurance-details.tsx#L103-L108)), so "Blocked" is red in My work and amber in program tables: [docs/next.md:43](../../next.md#L43) "A domain component layer", open. Add one map in `src/lib` for every status enum in database.types.ts and one app component (for example RecordStatus) that also feeds `c.status` tone and `sortBy`, delete the local mappers and the three wrappers, and test that every enum value maps exactly once.
- STS-6, a bare Dot is colour-only for sighted users, and Indicator.mdx recommends it: [docs/next.md:115](../../next.md#L115) "A status column of bare Dots". Stop recommending a Dot as the status alone (use Indicator where no word fits beside it), keep Dot where visible text carries the state, rewrite the Do story, and make WorkPane.Row ([work-pane.tsx:135](../../../packages/design-system/src/patterns/work-pane.tsx#L135)) require `meta` when `tone` is not neutral.
- STS-12, [status-vocabulary.md](../status-vocabulary.md) and Badge.mdx disagree on In remediation, Accepted and In progress, and the guide cites files that no longer exist: [docs/next.md:43](../../next.md#L43), with STS-1. Once the map exists, Badge.mdx owns the kit's meanings and status-vocabulary.md the product's values.
- STS-14, Count, AvatarGroupCount, Avatar and AvatarBadge lose their shapes in forced colours: [design-system-deep-audit-2026-09-18.md #4](../design-system-deep-audit-2026-09-18.md#L88), same class, these parts not listed. Give them a transparent border, give the presence mark a system colour through `forced-color-adjust`, and add these stories to the forced-colours check.

## Alert, Banner, Toaster, Progress, Spinner, Skeleton

The feedback parts sit soundly on Base UI but have edge defects: Alert's action link renders as plain text, every Alert is an assertive live region, indeterminate Progress ignores reduced motion and looks complete, and a toast with an action times out after 4s. The larger problems are in how the prototype reports state. It hand-rolls 53 `<p role="alert">` messages in 35 files (FDB-1), QueryState replaces each register with a spinner line instead of the DataTable's skeleton rows (FDB-3), and Retry after a failed refresh gives no feedback (FDB-4). Toast timing and Banner truncation are guidance questions more than live defects, because the prototype raises no error or action toasts and renders no Banner.

**Keep:** Toaster on native Base UI (F6 to the viewport, pause on hover, focus and window blur, loading toasts exempt from timers, `promise()`, localised Close and Notifications, works over dialogs); a clear division in the docs, Alert about a record, Banner about the site, a toast after an act; Banner's action focus ring uses currentColor and its story asserts it; the Progress track and indicator survive forced colours, with a test; Skeleton is aria-hidden by default, stops pulsing under reduced motion and uses a small shape vocabulary that matches content; DataTable already has skeleton loading rows and an in-table error Alert; the Spinner delay latches once shown, and Button marks its spinner decorative and keeps focus while loading; native props, refs and class merging are tested in plays across the family.

**FDB-2 · A link in AlertAction renders as plain body text** (medium)

[alert.tsx:61-71](../../../packages/design-system/src/components/alert.tsx#L61-L71), [Alert.mdx:17-19](../../../packages/design-system/src/stories/components/Alert.mdx#L17-L19), [Alert.stories.tsx:49-51](../../../packages/design-system/src/stories/components/Alert.stories.tsx#L49-L51)

AlertTitle and AlertDescription underline links with `[&_a]:underline`, but AlertAction does not, and preflight resets anchors to inherit colour and decoration. In Alert "Variants", "Read the required format" is a third line of red text at normal weight with no underline, so the recovery link cannot be recognised as a link (WCAG 1.4.1), and the MDX anatomy teaches this shape.

**Fix:** Add `[&_a]:underline [&_a]:underline-offset-2` to AlertAction. Change the anatomy and stories to TextLink for navigation and a small Button for actions, and assert in a play that the link is visually distinct.

**FDB-4 · After a refresh failure with cached rows, Retry gives no feedback and spans the page** (medium)

[work-common.tsx:69-84](../../../src/components/prototype/work-common.tsx#L69-L84)

The QueryState Alert has no title or icon and appends the raw server message to its prose ("… Showing the last loaded records. Service unavailable"). Retry is a separate Button in a Stack, so it stretches across the page, and because a refetch after an error keeps `isPending` false in TanStack Query v5, 1.2s after a click on /programs it was still enabled with no spinner and no status. Users click again, and the block pushes the table about 90px down.

**Fix:**

- Add `isFetching` to the QueryStatus type and bind the Retry Button's `isLoading` to it, as [\_\_root.tsx:88](../../../src/routes/__root.tsx#L88) does.
- Put Retry in AlertAction as a small button, add an AlertTitle ("Records could not be refreshed") with the server text as a detail, and keep the block compact so a register still spends at most two rows before its first record.

**FDB-5 · Alert is `role="alert"` for every tone** (medium)

[alert.tsx:12-19](../../../packages/design-system/src/components/alert.tsx#L12-L19), [Alert.mdx:27](../../../packages/design-system/src/stories/components/Alert.mdx#L27), [:38](../../../packages/design-system/src/stories/components/Alert.mdx#L38)

The role is hard-coded before `{...props}` whatever the tone, so a neutral "Review imported records" notice gets the loudest announcement, and an Alert rendered on load can interrupt the page-title announcement. The MDX justifies the default as "following shadcn"; the APG says role alert is not for static content.

**Fix:**

- Default to no live role (or `role="status"`), and require an explicit `role="alert"` for a failure that follows a user action. Rewrite the Accessibility section as a decision table: static, updated, urgent.
- [work-common.tsx:71](../../../src/components/prototype/work-common.tsx#L71) relies on the default for a real failure and must then pass `role="alert"`, as [data-table.tsx:1301](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1301) already does. Record the change in the MDX migration note and the CHANGELOG.

**FDB-7 · Indeterminate Progress keeps pulsing under reduced motion** (medium)

[progress.tsx:69](../../../packages/design-system/src/components/progress.tsx#L69), [motion.css:301-305](../../../packages/design-system/src/styles/motion.css#L301-L305)

`data-indeterminate:animate-pulse` has higher specificity than `motion-reduce:animate-none`, and the global reduced-motion rule matches only the bare `.animate-pulse` class. With reduced motion on, the indeterminate indicator in "Values and ranges" still reports the animation "pulse" mid-cycle.

**Fix:** Use `data-indeterminate:motion-reduce:animate-none`, or add `[data-slot=progress-indicator][data-indeterminate]` to the reduced-motion block, and assert it in the ValuesAndRanges play.

**FDB-9 · Clickable ProgressStacked segments have a clipped focus ring, 8px targets and silent spans** (medium)

[progress.tsx:148-181](../../../packages/design-system/src/components/progress.tsx#L148-L181)

Segment buttons have no focus classes and sit inside `overflow-hidden rounded-full`, so at 3x zoom only a hairline of the browser ring shows, and the segments are 8px tall and touching, with no touch target. When segments are clickable the bar becomes a group, and non-clickable segments ("4 unassessed") are spans with only a `title`, so screen-reader users lose part of the breakdown. The touch-target half belongs with [responsive-2026-09-24 #10](../responsive-audit-2026-09-24.md#L183), whose table does not list this part.

**Fix:**

- Draw an inset kit ring (`focus-visible:outline-focused` with a negative offset) or move the clip off the segments, and give segments `touch-target` or a taller hit area.
- In group mode, expose non-clickable segments as visually hidden text, and forward native props and ref like the other parts.

**FDB-10 · A toast with an action still times out after 4s** (medium)

[toaster.tsx:86-99](../../../packages/design-system/src/components/toaster.tsx#L86-L99), [:148-157](../../../packages/design-system/src/components/toaster.tsx#L148-L157), [Toaster.mdx:24](../../../packages/design-system/src/stories/components/Toaster.mdx#L24), [:28](../../../packages/design-system/src/stories/components/Toaster.mdx#L28)

Toaster sets `timeout = 4000` for every toast and `actionProps` does not change it; only the WithAction story passes `timeout: 0` by hand. An Undo or View action can vanish before a keyboard or screen-reader user reaches it with F6, and the MDX never says the action must also exist on the page (WCAG 2.2.1).

**Fix:** A toast with `actionProps` and no explicit timeout gets `timeout: 0`, applied in the kit's toast helper or documented and asserted in a story. State in Toaster.mdx that every toast action is also reachable on the page.

**FDB-12 · Banner truncates most of its message on a phone** (medium)

[banner.tsx:53](../../../packages/design-system/src/components/banner.tsx#L53), [:59](../../../packages/design-system/src/components/banner.tsx#L59), [shell.css:44-50](../../../packages/design-system/src/styles/shell.css#L44-L50)

The message is `min-w-0 truncate` inside a fixed 48px `h-layout-banner`, and the shell's banner area is fixed at the same token. At 390px the kit's own examples show 165 of 430px and 155 of 323px ("The audit window closes i…"), with no title and no way to expand. This is a design decision to revisit, not an oversight, and the prototype renders no Banner today.

**Fix:**

- Below `sm`, let the message wrap to two lines: `min-height` instead of `height` on `.shell-banner` and the Banner, with the shell setting `--shell-banner` from the measured height, since the top nav's sticky offset reads it.
- At minimum, shorten the story copy to meet the content rule, and give the Banners story a 390 viewport so CI renders it narrow.

**FDB-14 · Evidence upload disables its button and swaps the label instead of using `isLoading`** (medium)

[evidence-file.tsx:285-296](../../../src/components/app/evidence-file.tsx#L285-L296), [:261-262](../../../src/components/app/evidence-file.tsx#L261-L262), [button.tsx:171](../../../packages/design-system/src/components/button.tsx#L171)

Upload, Recover and Download set `disabled={!!busy}` and change their labels to "Uploading…", "Recovering…" or "Downloading…" for files up to 50 MiB, with no spinner, status or progress. The disabled button drops keyboard focus to `<body>` during the longest background task in the app, and screen-reader users hear nothing until the result.

**Fix:** Use `isLoading` on the button that started the work, which keeps focus through `focusableWhenDisabled`. Show the file through Attachment in its uploading state (STA-2), and announce completion or failure in the region.

| Id     | Finding | Where | Fix |
| ------ | ------- | ----- | --- |
| FDB-6  | Alert has no tone icon, unlike Banner and the default toast list, and no border, so its severity is colour alone and the whole tone disappears in forced colours. QueryState's danger Alert is a plain pink bar. | [alert.tsx:22-23](../../../packages/design-system/src/components/alert.tsx#L22-L23), [banner.tsx:16-20](../../../packages/design-system/src/components/banner.tsx#L16-L20), [toaster.tsx:121-135](../../../packages/design-system/src/components/toaster.tsx#L121-L135), [work-common.tsx:71](../../../src/components/prototype/work-common.tsx#L71) | Add an AlertIcon part that picks the tone's icon (Banner's map plus success), use it in QueryState, and add a CanvasText outline for `[data-slot=alert]` under forced colours. |
| FDB-11 | Toaster.mdx makes 8000ms the rule for errors but never mentions `priority: "high"`, which Base UI needs to route a toast to its alert region, so error toasts are announced politely. The prototype's success toasts carry 15 to 25 words on a 4s default. | [Toaster.mdx:24](../../../packages/design-system/src/stories/components/Toaster.mdx#L24), [Toaster.stories.tsx:54](../../../packages/design-system/src/stories/components/Toaster.stories.tsx#L54), [program-wizard.tsx:227-231](../../../src/components/app/program-wizard.tsx#L227-L231), [library-update-review.tsx:195-199](../../../src/components/prototype/library-update-review.tsx#L195-L199) | Document: errors belong inline, or persistent (`timeout: 0`) with `priority: "high"` when a toast is unavoidable; success toasts are a title and at most one short line. Consider a 5–6s default or length-scaled timeouts. |
| FDB-13 | Spinner's status is an svg named by `aria-label` and inserted together with its region, so most screen readers say nothing. PageSkeleton has the same shape, and the Skeleton Do examples use `aria-busy` with no status text. | [spinner.tsx:55-59](../../../packages/design-system/src/components/spinner.tsx#L55-L59), [page-skeleton.tsx:20-24](../../../packages/design-system/src/layout/page-skeleton.tsx#L20-L24), [Skeleton.stories.tsx:46](../../../packages/design-system/src/stories/components/Skeleton.stories.tsx#L46) | Render visually hidden text inside the Spinner's status (the Polaris pattern), or document that the containing region's persistent live region owns the announcement. Add a loading message to the Skeleton Do examples. |
| FDB-15 | Toast `type` uses Sonner's `info` and `error`, not the kit's `information` and `danger`, and Base UI types it as `string`, so `type: "danger"` type-checks and renders with no icon. | [toaster.tsx:121-135](../../../packages/design-system/src/components/toaster.tsx#L121-L135) | Export a typed ToastType union, accept the Tone names as aliases, and document the mapping. |
| FDB-16 | The toast root is `select-none`, so an error message or record code cannot be copied out of a toast. | [toaster.tsx:44](../../../packages/design-system/src/components/toaster.tsx#L44) | Mark ToastTitle and ToastDescription with Base UI's `data-base-ui-swipe-ignore` and `select-text`, accepting that a swipe starts outside the text; otherwise keep it as a documented trade-off. |
| FDB-17 | The Alert, Toaster, Progress and Spinner pages lack when-to-use, content and Don't sections. Progress says "Task completion" while its stories are coverage meters, its "indeterminate progress" value text is not localised, and spinner.tsx promises a delay whose default is 0. | [Alert.mdx:36-38](../../../packages/design-system/src/stories/components/Alert.mdx#L36-L38), [Toaster.mdx:6-24](../../../packages/design-system/src/stories/components/Toaster.mdx#L6-L24), [Progress.mdx:12](../../../packages/design-system/src/stories/components/Progress.mdx#L12), [spinner.tsx:7-8](../../../packages/design-system/src/components/spinner.tsx#L7-L8) | Bring the four pages onto the Button template. Say when to use a progressbar and when a meter, recommend a Spinner delay, and pass a localised `getAriaValueText`. |

**Already tracked:**

- FDB-1, status and error messages hand-rolled as bare `<p role="alert">`, now 53 in 35 files and two kit patterns ([record-browser.tsx:335](../../../packages/design-system/src/patterns/record-browser.tsx#L335), [composer.tsx:315](../../../packages/design-system/src/patterns/composer.tsx#L315)), with static permission notes such as [create-task-dialog.tsx:304](../../../src/components/prototype/create-task-dialog.tsx#L304) as assertive alerts: [pattern-audit-2026-09-17.md](../pattern-audit-2026-09-17.md#L62), two screens then. No new part is needed: name Alert with an explicit role in product-patterns.md Forms (alert for a failure after an action, none or note for a permission note), add a compact appearance if needed, move the product and kit patterns onto it, and lint `role="alert"` and `role="status"` on plain elements in product files.
- FDB-3, QueryState swaps each register for a one-line spinner, so the DataTable's skeleton rows ([data-table.tsx:1286-1293](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1286-L1293)) never show and the toolbar and rows pop in together: [pattern-audit-2026-09-17.md](../pattern-audit-2026-09-17.md#L62) ("a grey paragraph" then) and [docs/next.md:146](../../next.md#L146) "A spinner's delay in the prototype". In ProductCollection, render the DataTable with `state="loading"` while pending, mark the Spinner `isDecorative` inside the labelled status, and give it a delay.
- FDB-8, an indeterminate bar is a full-width fill identical to 100% complete: [docs/next.md:112](../../next.md#L112) "An indeterminate bar needs a duration". The blocker is gone (`--ds-motion-duration-slow` is 400ms and slower 700ms), so build a sweeping segment, or leave waits to the Spinner and document that `value={null}` is not used.

## Empty and EmptyIllustration

The Empty family is well built and documented; the serious problems are in how empties behave. DataTable chooses between "no records" and "filtered" from its own filter state alone, so a toggle or route filter outside the table hides the toolbar and shows a false "No … yet" (EMP-1), and "Nothing matches" is never announced (EMP-2). EmptyTitle is a styled div rather than a heading, and the `document` illustration paints its back page over the front. In the prototype, My work's saved view reads as a failed search, and the reference task record puts a full scene and a duplicate button in its compact empties.

**Keep:** composable parts (Empty, EmptyMedia, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent) that read size from context, so the title is heading-sized in the hero and body text in compact; twelve illustrations drawn from surface tokens at one 128×84 size, which follow dark mode with no second asset and hide from assistive technology; DataTable separates the no-records empty from the filtered empty and ships a working, localised Clear filters; the MDX has a kind-to-situation-to-action table, content rules and a Do/Don't story; a 400px message measure with balanced wrapping that holds at 320px with no page overflow; Related and Item.Group reuse the compact Empty, so rail lists get a proper empty state.

**EMP-1 · DataTable hides the toolbar when the caller narrows data outside table state** (high)

[data-table.tsx:1212-1245](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1212-L1245), [system-requirements.tsx:242-266](../../../src/components/prototype/system-requirements.tsx#L242-L266), [system-evidence.tsx:331-350](../../../src/components/prototype/system-evidence.tsx#L331-L350), [system-library.tsx:236-256](../../../src/components/prototype/system-library.tsx#L236-L256), [record-browser.tsx:318-339](../../../src/components/app/record-browser.tsx#L318-L339)

`narrowed` checks only `columnFilters` and `globalFilter` ([:1214-1215](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1214-L1215)), and an empty, un-narrowed table renders the dashed Empty alone. The system Requirements, Evidence and Library tabs filter `data` with an "Include everything inside" toggle in the toolbar, and the schema inspector filters on the server with "Clear related-record filter" in the toolbar, so both controls vanish with it. On Ground Support Subsystem, the Requirements tab says "No requirements allocated here" with no toggle and no keyboard stop that reaches one, although its children hold 486 allocations, and /records/tasks filtered to one program says "No tasks yet" with a create prompt and no sign of the filter.

**Fix:**

- Add a caller-declared input, `narrowed?: boolean | undefined` or `empty.filtered.active`, so the filtered branch (toolbar, header and the caller's filtered copy) renders. Use it in the three system tabs and the record browser.
- Add a DataTable States story with externally filtered data and a play that asserts the toolbar survives.

**EMP-2 · "Nothing matches" is never announced** (high)

[data-table.tsx:1303-1323](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1303-L1323)

The filtered empty is a static table row holding an Empty with no `role="status"` or `aria-live`, and neither DataTable nor Toolbar has a status region. A screen-reader user who types in any register search hears nothing when the rows disappear, and does not learn that Clear filters is available (WCAG 4.1.3).

**Fix:** Add a polite, visually hidden status to DataTable that announces "Nothing matches" when the filtered empty appears, debounced, skipped on the first render, with a caller-supplied noun. A result count after other searches is good practice rather than a conformance requirement. Cover it in the States play.

**EMP-3 · EmptyTitle is a div styled as a heading** (medium)

[empty.tsx:109-123](../../../packages/design-system/src/components/empty.tsx#L109-L123), [Empty.mdx:45](../../../packages/design-system/src/stories/components/Empty.mdx#L45), [heading.tsx:13-17](../../../packages/design-system/src/primitives/heading.tsx#L13-L17)

EmptyTitle renders a div with `font-heading-small`, while the MDX calls it "a heading in the default size". "Task not found", "This page could not be loaded" and every register's no-records title are missing from the heading outline, so a page whose main content is an Empty offers only its h1 (WCAG 1.3.1).

**Fix:** Give EmptyTitle `as?: HeadingElement | "div" | undefined`, following Heading's contract, and let callers choose the level, since a table cell and a page body need different ones. Default to div, or let DataTable take a level. Fix the MDX wording.

**EMP-4 · The `document` illustration paints its back page over the front** (medium)

[empty.tsx:253-277](../../../packages/design-system/src/components/empty.tsx#L253-L277)

The back page's `-translate-x-100 -translate-y-075` is the CSS `translate` property, which creates a stacking context and paints above its untransformed later sibling. In light mode the card is blank with a white edge poking out; in dark mode the front is a near-black slab. Every "No evidence", "No packages yet" and "No SSP recorded" empty (8 prototype sites) looks like a rendering glitch.

**Fix:** Put the front page in the same paint layer after the back page (`relative`, or a zero `translate`), or `isolate` the scene with the back page behind. Assert in the Illustrations story that the front page is topmost.

**EMP-5 · My work with nothing assigned reads as a failed search** (medium)

[work-table.tsx:118](../../../src/components/prototype/work-table.tsx#L118), [:133-145](../../../src/components/prototype/work-table.tsx#L133-L145), [data-table.tsx:1313-1321](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1313-L1321), [Empty.mdx:58](../../../packages/design-system/src/stories/components/Empty.mdx#L58)

WorkTable's `mineOnly` starts with an "Assigned to you" column filter and passes no `empty.filtered`, so a new user sees the search picture, "Nothing matches" and Clear filters, which switches them to everyone's tasks. Empty.mdx prescribes the inbox kind for "Nothing assigned or waiting for you", but the kit's filtered empty is one message and cannot vary by saved view.

**Fix:**

- Kit: let a DataTable.Presets preset carry its own `empty`, used while that preset is active. Give "Assigned to you" the inbox kind ("Nothing assigned to you") with a link to all tasks.
- Interim: pass `empty.filtered` from WorkTable only while the column filters equal the mine preset and there is no search.

**EMP-8 · The reference task record puts a full illustration in compact empties and repeats the create action** (medium)

[tasks.$taskId.tsx:211-222](../../../src/routes/tasks.$taskId.tsx#L211-L222), [:242-252](../../../src/routes/tasks.$taskId.tsx#L242-L252)

Comments and Activity use `<Empty size="compact">` with a 128×84 `inbox` illustration, so the badge hangs below the row, and "Create comment" appears in both the Section header and the Empty, twice in the tab order. Empty.mdx gives compact an icon and reserves `inbox` for "Nothing assigned", and this is the file other screens are told to copy.

**Fix:**

- Use `EmptyMedia variant="icon"` (MessageSquare, History) in the task record's compact empties, and show the create action once.
- Only the register case of the duplicate action is settled, so state the Section-header case once in the Section and Empty docs. Guard compact illustrations with a lint rule or a development warning rather than a compact illustration size.

| Id     | Finding | Where | Fix |
| ------ | ------- | ----- | --- |
| EMP-9  | Not-found states are hand-rolled four ways: MissingRecord; the record browser's h1 "Record not found" over an Empty titled "Unavailable record"; CollectionNotFound; and a dashed "Run not found" with no description. The kit has no not-found story. | [assessment-campaign.tsx:997-1004](../../../src/components/prototype/assessment-campaign.tsx#L997-L1004), [record-browser.tsx:943-963](../../../src/components/app/record-browser.tsx#L943-L963), [:98-121](../../../src/components/app/record-browser.tsx#L98-L121), [work-common.tsx:128-158](../../../src/components/prototype/work-common.tsx#L128-L158), [Recipes.mdx:29](../../../packages/design-system/src/stories/docs/Recipes.mdx#L29) | Give the run a one-line description in a compact or frameless Empty inside the panel, align the record browser's h1 and Empty title, and add a Not found story to Empty.stories. |
| EMP-10 | The evidence version review's empty pairs the green `done` check with "Not reviewed yet". | [evidence-browser.tsx:538-548](../../../src/components/prototype/evidence-browser.tsx#L538-L548) | Use `document` or an icon Empty, and document which kind means "waiting on someone". |
| EMP-11 | Three prototype empties nest EmptyMedia inside EmptyHeader, so the picture sits 8px above the title instead of 24px. Nothing in the types, lint or Anatomy section prevents it. | [ssp-assembly.tsx:69-78](../../../src/components/prototype/ssp-assembly.tsx#L69-L78), [:199-208](../../../src/components/prototype/ssp-assembly.tsx#L199-L208), [record-browser.tsx:107-114](../../../src/components/app/record-browser.tsx#L107-L114), [empty.tsx:67-81](../../../packages/design-system/src/components/empty.tsx#L67-L81) | Fix the three sites, state the order for both sizes in Anatomy, and add a composition lint rule. |
| EMP-12 | ProductCollection and ModelTable reuse the toolbar's small primary in the hero empty, so "Allocate requirements" is 28px where Empty.mdx specifies a medium button. | [product-collection.tsx:54](../../../src/components/prototype/product-collection.tsx#L54), [record-tools.tsx:244](../../../src/components/prototype/record-tools.tsx#L244), [Empty.mdx:82](../../../packages/design-system/src/stories/components/Empty.mdx#L82) | Have EmptyContent size its buttons by context (medium in default, small in compact), or have DataTable render a caller-supplied create descriptor at the right size. |
| EMP-14 | In forced colours the `chart` and `calendar` scenes become empty rectangles, badges lose their circles and the first `people` avatar disappears. The art is decorative, so this is not a WCAG requirement. | [empty.tsx:192-204](../../../packages/design-system/src/components/empty.tsx#L192-L204), [:324-358](../../../packages/design-system/src/components/empty.tsx#L324-L358), [forced-colors.css](../../../packages/design-system/src/styles/forced-colors.css) | Set `forced-color-adjust: none` on the scene with CanvasText and GrayText fills, or outline the ghost bars and give badges a ButtonText border. |
| EMP-15 | DataTable.mdx lists `illustration` as four values though it accepts twelve kinds. Empty.mdx says "an error is an Alert", while the route error boundary rightly composes an icon Empty with Retry. | [DataTable.mdx:219](../../../packages/design-system/src/stories/patterns/DataTable.mdx#L219), [Empty.mdx:84-86](../../../packages/design-system/src/stories/components/Empty.mdx#L84-L86), [\_\_root.tsx:69-94](../../../src/routes/__root.tsx#L69-L94), [locale-format.ts:100](../../../packages/design-system/src/lib/locale-format.ts#L100) | Fix the type line. Add a "failed to load" row: an Alert in a region that keeps other content, an icon Empty with Retry for a page or region with nothing else. Leave the unused "Nothing here" fallback, or make it "No records yet". |
| EMP-16 | Only Playground has a play. Nothing asserts that illustrations are aria-hidden, the compact column placement or each scene's topmost surface, which is how EMP-4 got through, and DataTable States has no externally narrowed case. | [Empty.stories.tsx:65-76](../../../packages/design-system/src/stories/components/Empty.stories.tsx#L65-L76), [:133-154](../../../packages/design-system/src/stories/components/Empty.stories.tsx#L133-L154), [:207-235](../../../packages/design-system/src/stories/components/Empty.stories.tsx#L207-L235) | Add those plays, with an `elementFromPoint` check per kind, and the narrowed case (EMP-1). |

**Missing in this family:**

- DataTable caller-declared narrowing (`narrowed` or `empty.filtered.active`): toggles, route filters and server filters need the filtered empty with its toolbar, not a hero that hides the control that restores the rows (EMP-1). High.
- EmptyTitle `as`, a heading level: pages whose main content is an Empty (not found, route error, first run) need the title in the heading outline at the right level (EMP-3). High.
- Per-preset empty message on DataTable.Presets: a saved view is not an ad-hoc filter, so "Assigned to you" with nothing in it should say "Nothing assigned to you", not "Nothing matches" (EMP-5). Medium.
- Not found story in Empty.stories: the prototype has four hand-rolled not-found shapes, one with no route back, and a story would settle the title, picture and route back (EMP-9). Medium.
- Unavailable or failed-to-load empty, as a kind and a documented shape: the app already builds one from an icon Empty with Retry, but the docs send errors to Alert and there is no picture for it (EMP-15). Low.

**Already tracked:**

- EMP-6, the prototype's EmptyMessage ([work-common.tsx:92-110](../../../src/components/prototype/work-common.tsx#L92-L110)) strips Empty to a title and a line, and about 30 uses tell readers to create or import with no button: [pattern-audit-2026-09-17.md](../pattern-audit-2026-09-17.md#L63) "Empties". The collection contract applies to collection sites only; record-body sections and derived lists (history, resolutions, assessments) take a compact Empty with a short title and no invented action, and copy that points at a missing capability (catalog import) goes.
- EMP-7, EntitySection's default says "Create … to start this collection" to viewers and read-only sections ([record-tools.tsx:359](../../../src/components/prototype/record-tools.tsx#L359), [:436-441](../../../src/components/prototype/record-tools.tsx#L436-L441)): [pattern-audit-2026-09-17.md](../pattern-audit-2026-09-17.md#L63). Branch the default on `canAdd`, as ProductCollection does ([product-collection.tsx:49-53](../../../src/components/prototype/product-collection.tsx#L49-L53)).
- EMP-13, grey paragraphs and ProgramTimeline's hand-built bordered box stand in for empties ([library-controls.tsx:295](../../../src/components/prototype/library-controls.tsx#L295), [program-timeline.tsx:137-146](../../../src/components/prototype/program-timeline.tsx#L137-L146)): [docs/next.md:141](../../next.md#L141), the "fourteen grey strings". A compact Empty with an icon for lists, Absent for scalar values.

## Card, Item, KeyValue, Fact, Separator, Typography, CodeBlock, TextLink

The content parts are solid one by one; the two the prototype leans on, KeyValue and TextLink, carry the real defects. KeyValue labels truncate with no way to read them, on pages and in DataTable's More fields (CNT-2), and in-sentence TextLinks are told apart by colour alone (CNT-1). Item's `isActive` is visual only, so the tailoring pickers never say which row is open (CNT-3). Next come the Copy button over one-line commands, the silent Absent dash, the focus ring clipped in Related cards, unannounced new-tab links, and lists and count tiles hand-rolled where Timeline, Item.Group and a linked Stat.Tile belong.

**Keep:** Item has one six-column subgrid per group, so marks, ids and dates line up, with the title as the only link or button stretched over the row and the toggle and actions as separate tab stops; Item's disclosure chevron sits above the overlay with a 24px target, checked in a play; TextLink uses Base UI `render` with router links, refs and handlers merged; TextLink's in-sentence detection applies WCAG 2.5.8's inline exception correctly; CardHeader moves its action by container query, not the viewport; KeyValue `wrap` breaks UUIDs and timestamps, and a truncated string value carries its full text as a title; CodeBlock has a sticky, unselectable gutter, a named and focusable scroll frame, and localised Copy and Copied labels with a status region; Separator has `isDecorative` and `render`, covered by plays; the MDX pages say when to use each part and when not, with content rules, token tables and Don't pairs.

**CNT-2 · KeyValue labels truncate with no way to read them** (high)

[key-value.tsx:19](../../../packages/design-system/src/components/key-value.tsx#L19), [:32](../../../packages/design-system/src/components/key-value.tsx#L32), [:36-43](../../../packages/design-system/src/components/key-value.tsx#L36-L43), [data-table.tsx:886-896](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L886-L896), [programs.$programId_.export.tsx:116-119](../../../src/routes/programs.$programId_.export.tsx#L116-L119)

The `<dt>` is `truncate text-subtle` with no title, `wrap` changes only the value, and the label column is a fixed 104px that does not grow with text size. On the program export page at 1440px the main column's labels read "Requirement id…", "Security plan re…" and "Evidence artifa…" with half the page empty beside them, and in DataTable's More fields at 390px two fields read "Implementation" and "Implementation…", which breaks the contract's "no field disappears" (WCAG 1.4.4). About 16 call sites have labels of 17 characters or more, and rails work around it by passing 112, 124, 128 or 144 to every row.

**Fix:**

- Let the dt wrap (`break-words`, baseline-aligned), or at least give it `title={label}`.
- Let Inspector.Group, or the More fields Stack, supply the label width through context instead of every row, and consider a stacked label-over-value layout below a container width for More fields. Named widths stay the separate [docs/next.md:120](../../next.md#L120) "Pixel widths as props" decision.

**CNT-3 · Item `isActive` is visual only, so the tailoring pickers never say which row is open** (high)

[item.tsx:168](../../../packages/design-system/src/components/item.tsx#L168), [work-pane.tsx:132-147](../../../packages/design-system/src/patterns/work-pane.tsx#L132-L147), [parameter-picker.tsx:126](../../../src/components/app/profile-tailoring/parameter-picker.tsx#L126), [control-picker.tsx:158](../../../src/components/app/profile-tailoring/control-picker.tsx#L158)

`isActive` adds only a selected background; neither the title link nor the title button gets `aria-current`, `aria-pressed` or `aria-selected`, and WorkPane.Row passes it straight through. In the profile-tailoring pickers used by the program wizard and profile editing, a screen-reader user hears the same thing for every row and cannot tell which control or parameter the detail pane shows (WCAG 4.1.2, 1.3.1). Table's PreviewEye does set `aria-pressed` for its active state ([table.tsx:446](../../../packages/design-system/src/components/table.tsx#L446)).

**Fix:** Put `aria-current="true"` on the title element, link or button, when `isActive` is set; WorkPane inherits it. Document it in Item.mdx and add plays in the Item and WorkPane stories.

**CNT-1 · In-sentence TextLinks are told apart by colour alone** (medium)

[text-link.tsx:25-31](../../../packages/design-system/src/components/text-link.tsx#L25-L31), [:43](../../../packages/design-system/src/components/text-link.tsx#L43), [TextLink.mdx:31](../../../packages/design-system/src/stories/components/TextLink.mdx#L31), [catalog.tsx:179-184](../../../src/components/app/program-wizard/catalog.tsx#L179-L184), [:245-256](../../../src/components/app/program-wizard/catalog.tsx#L245-L256), [contrast.test.mjs:140](../../../packages/design-system/test/contrast.test.mjs#L140)

TextLink underlines only on hover and leaves a persistent underline to the caller, although it already marks in-sentence links with `data-in-text`. Against surrounding text the link colour is 2.04:1 in dark mode and 1.53:1 inside subtle text in light mode, below the 3:1 that F73 requires without another cue (a Level A failure), and the contrast gate checks `text.brand` only against the surface. In the wizard's Catalog & profiles step, the only in-sentence links in src/ today, "Open catalog" and "Open profile" cannot be told from their subtle small text in greyscale.

**Fix:** Underline whenever `data-in-text` is set (`data-in-text:underline`), and update TextLink.mdx so the kit owns the rule. Add `text.brand` against `text` and `text.subtle` to contrast.test.mjs in both modes, or accept the underline as the non-colour cue.

**CNT-4 · CodeBlock's Copy button covers the code and hangs out of a one-line block** (medium)

[code-block.tsx:86](../../../packages/design-system/src/components/code-block.tsx#L86)

Copy is `absolute end-100 top-100` over the scrolling frame, with no reserved padding or minimum height, and the subtle button has no fill. On a one-line command at 390px, the case CodeBlock.mdx recommends Copy for, the button hangs 8px below the frame, its icon is drawn over "--network", and scrolled text passes under it, so the reader cannot read what they are about to paste.

**Fix:** Move Copy into a header row that also shows `label` as a visible caption (file name or format). Otherwise give the frame a minimum height of the button plus insets, reserve inline-end padding on the first lines, and give the button a surface background.

**CNT-5 · Absent is a bare em dash with no accessible text** (medium)

[typography.tsx:40-42](../../../packages/design-system/src/components/typography.tsx#L40-L42), [Typography.mdx:68](../../../packages/design-system/src/stories/components/Typography.mdx#L68), [Fact.mdx:68](../../../packages/design-system/src/stories/components/Fact.mdx#L68)

Absent renders `<span className="text-subtlest">—</span>` and takes no props, and NVDA's default punctuation level does not speak an em dash. Across 64 prototype uses, mostly KeyValue values, an NVDA user hears "Assessor" and then silence, and cannot tell an empty value from a skipped or loading one, the distinction the docs say the dash exists to make.

**Fix:** Render the dash `aria-hidden` beside visually hidden locale text ("None" or "Not recorded"), or add a `label` prop. Correct the claims in Typography.mdx and Fact.mdx.

**CNT-6 · Card has no linked form, so the prototype hand-rolls clickable tiles** (medium)

[card.tsx:10-25](../../../packages/design-system/src/components/card.tsx#L10-L25), [program-workspace.tsx:282-294](../../../src/components/prototype/program-workspace.tsx#L282-L294), [record-browser.tsx:1162-1181](../../../src/components/app/record-browser.tsx#L1162-L1181)

Card has no link, `isSelected` or interactive prop. The program Overview's queue tiles are raw buttons drawn as cards, with an ArrowUpRight glyph for a tab switch, "…" while loading and `ml-auto`; the schema home's RecordCount is a hand-built card with a TextLink title and a "Loading…" string. Each screen invents its own hover, loading and affordance rules.

**Fix:** Give Stat.Tile, or Card, a `link` (and optionally `onSelect`) that stretches its label over the tile, with a rule that a linked tile holds no other interactive children, and a loading state; this is STA-1. Move the two tiles onto it, and drop ArrowUpRight from the queue tiles, which switch a tab (STA-6).

**CNT-7 · TextLink has no new-tab affordance, and six prototype links open new tabs without warning** (medium)

[text-link.tsx:34-53](../../../packages/design-system/src/components/text-link.tsx#L34-L53), [catalog.tsx:182](../../../src/components/app/program-wizard/catalog.tsx#L182), [:254](../../../src/components/app/program-wizard/catalog.tsx#L254), [elements.tsx:578](../../../src/components/app/program-wizard/elements.tsx#L578), [library-components.tsx:915](../../../src/components/prototype/library-components.tsx#L915), [system-evidence.tsx:383](../../../src/components/prototype/system-evidence.tsx#L383), [routes/catalog.tsx:339](../../../src/routes/catalog.tsx#L339)

TextLink passes `target` through with no icon, no hidden "opens in a new tab" text and no `rel` default, and TextLink.mdx never mentions `target`. From inside the wizard, "Open catalog" and "Open profile" move the reader to a new tab without notice, so they may think they have left their draft, and `rel` varies from link to link.

**Fix:** Add `isExternal`, or detect `target="_blank"`: render a trailing external icon, localised hidden "(opens in a new tab)" text using PreviewNavigation's locale approach, and `rel="noopener noreferrer"` for cross-origin hrefs. Document when a new tab is justified.

**CNT-8 · Item.Group has no consumers, and lists are hand-rolled as bordered Box stacks** (medium)

[tasks.$taskId.tsx:200](../../../src/routes/tasks.$taskId.tsx#L200), [:233](../../../src/routes/tasks.$taskId.tsx#L233), [index.tsx:191](../../../src/routes/index.tsx#L191), [package-views.tsx:521-533](../../../src/components/prototype/package-views.tsx#L521-L533), [evidence-browser.tsx:522](../../../src/components/prototype/evidence-browser.tsx#L522), [evidence-version-details.tsx:88-103](../../../src/components/prototype/evidence-version-details.tsx#L88-L103)

Comments and Activity on the reference task record, the home page's Assurance activity, published packages and evidence reviews are `<Box className="border-b border-default py-150">` rows in a Stack, and evidence-version-details forces reviews into KeyValue with the decision as the label. Screen-reader users get no "list, N items", and spacing, hairlines and truncation differ from screen to screen.

**Fix:** Move comments and activity to Timeline, the kit's event feed (STR-11), and published packages and evidence reviews to Item.Group, with the decision as a Badge and the rationale as children. Name both shapes in product-patterns.md with a reference file.

**CNT-9 · Card's `overflow-hidden` clips the focus ring on flush Item rows** (medium)

[card.tsx:18](../../../packages/design-system/src/components/card.tsx#L18), [item.tsx:105-106](../../../packages/design-system/src/components/item.tsx#L105-L106), [utilities.css:986-989](../../../packages/design-system/src/generated/utilities.css#L986-L989)

A flush Item's focus ring is a 2px outline at a 2px offset spanning the full card width, so Card clips its sides. In the Related matrix only the top and bottom lines show, and a keyboard user sees two blue rules that look like row separators.

**Fix:** Draw an inset ring on flush rows (a negative `outline-offset`, or an inset shadow on the overlay), or use `overflow: clip` with `overflow-clip-margin` on Card, which keeps the rounded corners.

**CNT-11 · Item.Group's empty check misses nested arrays and fragments** (medium)

[item.tsx:274](../../../packages/design-system/src/components/item.tsx#L274), [related.tsx:71](../../../packages/design-system/src/patterns/related.tsx#L71)

`Array.isArray(children) ? children.some(Boolean) : Boolean(children)` treats `[[], false]` and any fragment as content, so a list fed from two mapped sources renders an empty `<ol>` instead of its `empty`. Related already uses `Children.toArray(children).some(Boolean)`.

**Fix:** Use `Children.toArray`, as Related does, and add a play with two mapped arrays.

| Id     | Finding | Where | Fix |
| ------ | ------- | ----- | --- |
| CNT-13 | CodeBlock's gutter numbers are `select-none` but not `aria-hidden`, so browse mode reads "40 { 41 control …", and the frame is always a tab stop, even when nothing scrolls. | [code-block.tsx:45](../../../packages/design-system/src/components/code-block.tsx#L45), [:57-62](../../../packages/design-system/src/components/code-block.tsx#L57-L62), [table.tsx:81](../../../packages/design-system/src/components/table.tsx#L81) | Mark the gutter `aria-hidden`, and make the frame focusable only when it overflows, as Table does. |
| CNT-14 | The profile's tailoring rules and the record browser render JSON in raw `<pre>` in the body font. CodeBlock has no product consumer because it needs pre-split lines and always draws a gutter. | [profiles.$profileId.tsx:460-462](../../../src/routes/profiles.$profileId.tsx#L460-L462), [record-browser.tsx:176](../../../src/components/app/record-browser.tsx#L176), [CodeBlock.mdx:27](../../../packages/design-system/src/stories/components/CodeBlock.mdx#L27) | Add a `code` string convenience and `showLineNumbers={false}`, use them at both sites with `wrap` and a label, and fix the stale export-page claim in CodeBlock.mdx. |
| CNT-15 | A failed clipboard write only fills an sr-only status; the icon and label stay "Copy", so a sighted user pastes stale contents. | [code-block.tsx:101-108](../../../packages/design-system/src/components/code-block.tsx#L101-L108) | Show a visible failure for a moment ("Copy failed" with a danger icon), or raise the kit toast. |
| CNT-16 | CodeBlock, Fact, Fact.Group, Eyebrow, Prose and Absent forward no native props or refs. Card sets its data-slot and data-size before the prop spread, and uses `size="sm"` where Button and TextLink use `small`. | [typography.tsx:64-79](../../../packages/design-system/src/components/typography.tsx#L64-L79), [code-block.tsx:12-26](../../../packages/design-system/src/components/code-block.tsx#L12-L26), [card.tsx:10](../../../packages/design-system/src/components/card.tsx#L10), [component-library.md:81](../component-library.md#L81) | Forward native props and refs in the documented order, move Card's identity after the spread, and treat sm to small as one kit-wide rename with `@deprecated` aliases and a `ledger/no-deprecated-name` fixer. |
| CNT-17 | CardTitle is a div, while Item.Group's and Related's titles are always h3, so a titled group directly under an h1, or under a preview's h2, can skip or duplicate levels. | [item.tsx:307](../../../packages/design-system/src/components/item.tsx#L307), [related.tsx:78](../../../packages/design-system/src/patterns/related.tsx#L78), [card.tsx:46-57](../../../packages/design-system/src/components/card.tsx#L46-L57) | Follow Section.Title: expose the heading as a part or accept `render` for the title (default h3), and state one heading policy in component-library.md. |
| CNT-18 | Raw `<a target="_blank" className="underline">` anchors pass lint, because `prefer-text-link` fires only on the brand and hover-underline classes. A rule is drawn with a bordered Box, and one Item id is wrapped in Id twice. | [evidence-browser.tsx:498](../../../src/components/prototype/evidence-browser.tsx#L498), [evidence-version-details.tsx:62-69](../../../src/components/prototype/evidence-version-details.tsx#L62-L69), [index.js:430-444](../../../packages/design-system/eslint-plugin/index.js#L430-L444), [workstreams.$workstreamId.tsx:101](../../../src/routes/workstreams.$workstreamId.tsx#L101), [system-assurance-details.tsx:326](../../../src/components/prototype/system-assurance-details.tsx#L326) | Use TextLink with `href`, widen `prefer-text-link` to any `<a href>` in product files, use Separator for the divider, and pass the plain code to Item. |
| CNT-19 | Each KeyValue is its own one-item `<dl>`, so a rail of 5 to 17 facts is announced as 5 to 17 lists, and rails thread `labelWidth` through every row. KeyValue.mdx rules out a group component, so this revisits that decision. | [key-value.tsx:27-45](../../../packages/design-system/src/components/key-value.tsx#L27-L45), [KeyValue.mdx:37](../../../packages/design-system/src/stories/components/KeyValue.mdx#L37), [work-common.tsx:208-217](../../../src/components/prototype/work-common.tsx#L208-L217), [program-record.tsx:411](../../../src/components/prototype/program-record.tsx#L411) | Let Inspector.Group supply `labelWidth`, and later a stacked layout, through context, optionally inside one `<dl>`, without a new exported part. |

**Missing in this family:**

- KeyValue.Group, or Inspector.Group doing the same through context (CNT-19): one `<dl>`, a label width shared through context, and a stacked label-over-value layout below a container width, which fixes truncated labels in narrow panels and in More fields (CNT-2). High.
- TextLink `isExternal`: six product links open new tabs with no icon or announcement and inconsistent `rel`, and the kit should own the icon, the localised hidden text and the `rel` default (CNT-7). Medium.
- Linked Stat.Tile or Card: a stretched-title link variant with a no-internal-actions rule would replace the hand-rolled clickable count cards (CNT-6, STA-1). Medium.
- Item title wrap or line clamp: titles, ids and meta truncate with no reveal in rails and on phones, and record names in this domain are long (CNT-10). Medium.
- CodeBlock `code` string, `showLineNumbers` and a visible caption: the product shows JSON in raw `<pre>`, and a header caption gives Copy a home that does not cover the code (CNT-4, CNT-14). Medium.
- Absent accessible label: a hidden localised word keeps the visual mark and makes the empty value audible (CNT-5). Medium.

**Already tracked:**

- CNT-10, Item titles, ids and group headings truncate with no title, "Bank reconc…" at 340px and "Router managem…" in the Related rail ([item.tsx:101](../../../packages/design-system/src/components/item.tsx#L101)): [docs/next.md:135](../../next.md#L135) "A row's meta in a narrow list". Minimum fix: set `title` on a string title and id when not wrapped, as KeyValue does; optionally a two-line clamp for lists of long names such as WorkPane control titles.
- CNT-12, missing values written three ways (64 Absent, 46 literal words, 8 literal "—"), plus the export page's raw "active" and blank counts while loading ([programs.$programId_.export.tsx:104-105](../../../src/routes/programs.$programId_.export.tsx#L104-L105)): [docs/next.md:119](../../next.md#L119) "The dash by hand", now 8 literals instead of 77. Absent in rendered UI, with CNT-5's text, and words only where the value is itself a statement.
- CNT-20, Prose has no product consumer ([typography.tsx:55](../../../packages/design-system/src/components/typography.tsx#L55)): [docs/next.md:118](../../next.md#L118) "Prose has no consumer". Adopt it for labelled paragraphs in rails, or deprecate it.

## Tree, Timeline, Stepper

The three structures are well documented, and Tree is close to the APG tree view. The fix that matters most is focus in the program wizard: Continue disables itself on arrival at a blocked step, and the kit swaps the current step's button for a span, so keyboard and screen-reader users land on `<body>` at every step change (STR-1, STR-2). Next come Tree rows whose labels overflow the fixed row, whose accessible name includes every trailing badge and button, and whose trailing slot crushes names at phone width. After those: Timeline's closed props and visual-only states, an unnamed tab stop on every horizontal Stepper and Timeline, a second scroller around the program timeline, and activity drawn four ways with no contract entry.

**Keep:** Tree matches the APG tree view (one roving tab stop, the arrow keys, Home/End, typeahead that cycles on a repeated letter, Enter and Space to select); Tree infers `aria-posinset` and `aria-setsize` from visible rows, with overrides for partial or virtualised sets; Tree restores focus to a preceding row when the focused row is removed and keeps its entry stop through collapse and selection, play-tested; the caller owns the data, the open set and the selection; the parent-shows-selection rule for a collapsed branch is documented and demonstrated; Stepper renders one button per reachable step with a hidden state prefix, done and blocked carry icons as well as colour, and `ol` and `li` props and refs forward; Timeline's rail sits in a shared grid and subgrid through the marker centres at every size; Timeline's stretched title keeps the menu, attachments and body controls as separate stops, and `dateTime` renders a real `<time>`; horizontal Stepper and Timeline scroll inside the kit Scroller, which keeps the current step in view; thorough anatomy, content and Don't guidance, with keyboard plays.

**STR-1 · The program wizard drops keyboard focus to `<body>` on every step change** (high)

[program-wizard.tsx:414-419](../../../src/components/app/program-wizard.tsx#L414-L419), [:298-304](../../../src/components/app/program-wizard.tsx#L298-L304)

Continue calls `setIndex(index + 1)`, and its disabled rule makes it disable itself while focused when the next step is still empty; nothing moves focus to the new step. On /programs/new at 1280 and 390, Enter on Continue left `document.activeElement` on BODY for steps 1→2 and 2→3, and activating a step in the stepper did the same. On the one flow that creates a program, a keyboard user starts again from the skip links and a screen-reader user hears nothing about the new step (WCAG 2.4.3).

**Fix:**

- On a step change, move focus to the new step's heading (`tabIndex={-1}`) or its first field, and announce "Step 2 of 4, Catalog & profiles".
- Keep Continue enabled and validate on submit, as the Forms rule already says. Document the focus rule in the Stepper page's wizard guidance.

**STR-2 · A Stepper step swaps its button for a span when it becomes current** (high)

[stepper.tsx:192-204](../../../packages/design-system/src/components/stepper.tsx#L192-L204), [:107-112](../../../packages/design-system/src/components/stepper.tsx#L107-L112)

`const Tag = onSelect ? "button" : "span"`, and Stepper.mdx tells wizards to put `onSelect` on every done step and the next one, so the step the reader activates becomes current, loses `onSelect` and remounts as a span, destroying the focused element. Where the current step stays a button, `aria-current` sits on the `<li>` and the spoken prefix is empty, so its name is "MS-C 18 Sep · 10d out" with no current state, and upcoming steps read "4 Not started: Assess", number first.

**Fix:**

- Keep the element stable: while any step takes `onSelect`, the current step stays a `<button>` carrying `aria-current="step"` itself, with a "Current: " prefix, and activating it does nothing. Read the number after the state, or drop it from the name.
- Do not turn every reporting step into an `aria-disabled` button: [Stepper.mdx:93](../../../packages/design-system/src/stories/components/Stepper.mdx#L93) keeps them out of the tab order, and the stop count is the open [docs/next.md:124](../../next.md#L124) "A stepper's keyboard". Moving focus after a wizard step change stays the consumer's job (STR-1).

**STR-3 · Tree labels never truncate, so long names spill over neighbouring rows** (medium)

[tree.tsx:291-294](../../../packages/design-system/src/components/tree.tsx#L291-L294), [:328-333](../../../packages/design-system/src/components/tree.tsx#L328-L333)

The row has a fixed height, but the label span has no `truncate` or `nowrap`. At a 260px tree width a long control title grew to 54px inside a 32px row and overlapped the rows above and below. Tree.mdx promises one line, Table.Tree truncates its name ([table.tsx:710](../../../packages/design-system/src/components/table.tsx#L710)), and the wizard wraps its own `truncate` spans ([elements.tsx:327-332](../../../src/components/app/program-wizard/elements.tsx#L327-L332)).

**Fix:** Truncate inside the label, expose the full text (a title, or a Tooltip on focus) when it truncates, and add a narrow-container story with a long label.

**STR-4 · A Tree row's accessible name includes its trailing badges, counts and menu button** (medium)

[tree.tsx:267-298](../../../packages/design-system/src/components/tree.tsx#L267-L298), [:334-338](../../../packages/design-system/src/components/tree.tsx#L334-L338)

The treeitem has no `aria-labelledby`, so its name is computed from all its content: "Finance 12", and in the wizard "Unnamed system Code required System Choose a program profile Row actions for unnamed system". Screen-reader users hear that on every arrow-key move, although Tree.mdx says the label is the row's name.

**Fix:** Set `aria-labelledby` to the label span's id, expose non-interactive trailing content through `aria-describedby` or a hidden phrase ("12 controls"), and keep interactive trailing controls out of both.

**STR-5 · The wizard packs secondary text into Tree's non-shrinking trailing slot** (medium)

[elements.tsx:296-334](../../../src/components/app/program-wizard/elements.tsx#L296-L334), [:387-423](../../../src/components/app/program-wizard/elements.tsx#L387-L423), [tree.tsx:335](../../../packages/design-system/src/components/tree.tsx#L335)

The trailing wrapper is `flex shrink-0`, and the wizard puts a Badge, a 240–360px profile or library description, the type text and a menu into it, against Tree.mdx's "a Count, a Badge or a Dot". At 390px on step 3 the label gets 87px and trailing 225px, so the name reads "Unna…" and the code "Cod…" while "Choose a program profile" stays whole.

**Fix:**

- Kit: add a `hint` slot on Tree.Item that truncates before the label, as Table.Tree has ([table.tsx:659-680](../../../packages/design-system/src/components/table.tsx#L659-L680)), and let trailing text shrink.
- Wizard: keep trailing to the Badge and the kebab, and move the code, type and profile text to the hint or to the element Sheet the row opens.

**STR-6 · Horizontal Stepper and Timeline add an unnamed tab stop even when nothing overflows** (medium)

[stepper.tsx:90-96](../../../packages/design-system/src/components/stepper.tsx#L90-L96), [timeline.tsx:141-147](../../../packages/design-system/src/components/timeline.tsx#L141-L147)

Both wrap the list in `<ScrollerViewport tabIndex={0}>` with no role or name, unconditionally. In the Stepper matrix the first Tab lands on a div whose scroll width equals its client width, and on the WS-X90 Overview the order is a hand-rolled region, then the kit viewport, then the first gate, so keyboard users meet a ring around a strip that does nothing and screen readers announce an unnamed element.

**Fix:** Make the viewport focusable only while it overflows and holds no focusable descendants, and when it is focusable give it `role="group"` and a name derived from the list's label.

**STR-7 · ProgramTimeline wraps the kit's scrolling Timeline in a second scroller with its own arrows** (medium)

[program-timeline.tsx:56-121](../../../src/components/prototype/program-timeline.tsx#L56-L121), [:139-147](../../../src/components/prototype/program-timeline.tsx#L139-L147), [timeline.tsx:125](../../../packages/design-system/src/components/timeline.tsx#L125), [:136](../../../packages/design-system/src/components/timeline.tsx#L136)

GateRail adds always-visible Scroll backward and forward buttons and a `role="region" tabIndex={0} overflow-x-auto` div around a horizontal Timeline that already scrolls with arrows, resizes the kit's items with `*:` child selectors and undoes their title truncation. At 390px one gate shows both sets of arrows, and since the kit's own viewport absorbs the 420px minimum the outer div probably never overflows, so the hand-rolled buttons are likely inert. The empty state is a bordered Box with a sentence, not Empty.

**Fix:**

- Drop the wrapper and the buttons and use the kit strip alone, with a compact Empty for "No lifecycle gates defined".
- Kit: add an item width or minimum option, or style passthrough (STR-12), and let `wrap` apply across.

**STR-8 · Timeline's `isActive` and `emphasis` are visual only** (medium)

[timeline.tsx:292](../../../packages/design-system/src/components/timeline.tsx#L292), [:314-321](../../../packages/design-system/src/components/timeline.tsx#L314-L321), [:342-346](../../../packages/design-system/src/components/timeline.tsx#L342-L346)

`isActive` adds only a selected background, and the title control gets no `aria-current` or `aria-expanded`; `emphasis`, which the MDX calls "unread", only sets `font-medium`. A screen-reader user cannot tell which event's detail is open beside the list, or which events are unread.

**Fix:** Set `aria-current="true"` on the title control when `isActive`, or `aria-expanded` when it opens an adjacent panel. For `emphasis`, add hidden "Unread" text or require a labelled Count. Assert both in a play.

**STR-10 · Timeline's absolute time is only a `title`, and the kit has no relative-time formatter** (medium)

[timeline.tsx:329-340](../../../packages/design-system/src/components/timeline.tsx#L329-L340), [requirement-record.tsx:327-329](../../../src/components/prototype/requirement-record.tsx#L327-L329), [locale-format.ts:196](../../../packages/design-system/src/lib/locale-format.ts#L196)

`timeTitle` becomes a `title` attribute, which keyboard, touch and screen-reader users never get, yet Timeline.mdx tells consumers to show relative words with the absolute stamp only on hover. The locale factory offers `formatDate` and nothing relative, so today the requirement Edit history shows `toLocaleString()` visibly with the raw ISO string as its tooltip, and each screen invents its own time wording.

**Fix:** Add `formatRelativeTime` (Intl.RelativeTimeFormat) to the locale factory, and have Timeline render `timeTitle` as visually hidden text after the relative words, instead of or as well as the title.

**STR-11 · Activity is drawn four ways, and the contract names no shape for it** (medium)

[index.tsx:182-206](../../../src/routes/index.tsx#L182-L206), [tasks.$taskId.tsx:226-240](../../../src/routes/tasks.$taskId.tsx#L226-L240), [requirement-record.tsx:299-345](../../../src/components/prototype/requirement-record.tsx#L299-L345), [program-workspace.tsx:472-485](../../../src/components/prototype/program-workspace.tsx#L472-L485), [assurance-views.tsx:364-370](../../../src/components/prototype/assurance-views.tsx#L364-L370)

Home's Assurance activity and the task record's Activity are hand-rolled bordered rows with no `<time>`, actor, marker or list semantics; the requirement Edit history uses Timeline; the program Activity tab and risk activity are DataTable registers. product-patterns.md has no activity entry and [screen-inventory.json](../screen-inventory.json) has no Timeline or Stepper, so each new screen invents another variant. The feed format is tracked as [docs/next.md:128](../../next.md#L128) "The prototype's feeds"; the hand-rolled lists are new.

**Fix:** Add an activity and history shape to product-patterns.md: Timeline in a record body or rail (size, time position, newest first), and a DataTable only for the filterable audit register. Then move Home and the task record onto Timeline (CNT-8).

**STR-12 · Timeline parts forward no native props, refs, style or id** (medium)

[timeline.tsx:83-111](../../../packages/design-system/src/components/timeline.tsx#L83-L111), [:125](../../../packages/design-system/src/components/timeline.tsx#L125), [:155-165](../../../packages/design-system/src/components/timeline.tsx#L155-L165), [:194-253](../../../packages/design-system/src/components/timeline.tsx#L194-L253)

TimelineProps, TimelineGroupProps and TimelineItemProps are closed types: the root takes only `className` and hard-codes `minWidth: 420` when horizontal, and Item and Group take no `className`, `id`, ref or `aria-*`. Consumers cannot give an event an id for a deep link or notification anchor, add a description or change the minimum, which is why program-timeline.tsx reaches for child selectors (STR-7).

**Fix:** Extend `ComponentProps<"ol">` for Timeline and `ComponentProps<"li">` for Item and Group, forward refs, spread in the contract order (defaults, consumer, identity), and let caller style override the horizontal minimum, as Stepper does.

| Id     | Finding | Where | Fix |
| ------ | ------- | ----- | --- |
| STR-13 | Timeline.Group's label is a fixed `<Eyebrow as="h3">`, so a grouped timeline under an h1 or inside an h3 section skips or inverts levels. | [timeline.tsx:179](../../../packages/design-system/src/components/timeline.tsx#L179) | Give it a `render` escape, as Section's heading has ([section.tsx:95](../../../packages/design-system/src/layout/section.tsx#L95)), or a documented `headingLevel`, defaulting to h3. |
| STR-14 | The sticky group label and each row's marker column are both `z-10` in one stacking context, so markers and the rail paint over the label while the feed scrolls. | [timeline.tsx:170](../../../packages/design-system/src/components/timeline.tsx#L170), [:437](../../../packages/design-system/src/components/timeline.tsx#L437) | Raise the sticky header (`z-20`), or `isolate` each row. |
| STR-15 | The trailing wrapper stops click propagation, so a click on a row's static Count or Badge moves focus but does not select the row. | [tree.tsx:281-286](../../../packages/design-system/src/components/tree.tsx#L281-L286), [:334-338](../../../packages/design-system/src/components/tree.tsx#L334-L338) | Widen the row's interactive guard to role-based controls and focusable elements, then drop the `stopPropagation`. |
| STR-16 | Read-only trees render `aria-selected="false"` on every row and a hover tint with no action, and ArrowRight, ArrowLeft and the chevron ignore RTL. | [tree.tsx:235-256](../../../packages/design-system/src/components/tree.tsx#L235-L256), [:276](../../../packages/design-system/src/components/tree.tsx#L276), [:294](../../../packages/design-system/src/components/tree.tsx#L294), [:316](../../../packages/design-system/src/components/tree.tsx#L316) | Decide per row: `aria-selected` only when `onSelect` or `isSelected` is set, and the tint and cursor only with `onSelect`. Read the computed direction as Scroller does, swap the keys and add `rtl:rotate-180` to the closed chevron. |
| STR-17 | Stepper and Timeline render a bare `<ol>` under preflight's `list-style: none`, which WebKit drops from the list role, so VoiceOver may lose "3 of 6". | [stepper.tsx:60-70](../../../packages/design-system/src/components/stepper.tsx#L60-L70), [timeline.tsx:120-126](../../../packages/design-system/src/components/timeline.tsx#L120-L126) | Add `role="list"` to the ol elements, including Timeline.Group's inner list. |
| STR-18 | The wizard's Stepper has no label, so it reads as an unnamed "list, 4 items"; `label` is optional on Stepper and Timeline but required on Tree. | [program-wizard.tsx:285](../../../src/components/app/program-wizard.tsx#L285), [stepper.tsx:37](../../../packages/design-system/src/components/stepper.tsx#L37), [tree.tsx:35](../../../packages/design-system/src/components/tree.tsx#L35) | Pass `label="Program setup"`, and make `label` required on Stepper and Timeline, or default it from the locale. |
| STR-19 | Stepper.mdx has a garbled history fragment and history phrasing, and claims every step's state is in its name. Tree.mdx says the label is the name and documents a whole tree inside a trailing slot, which the ARIA tree pattern does not define. | [Stepper.mdx:43](../../../packages/design-system/src/stories/components/Stepper.mdx#L43), [:92](../../../packages/design-system/src/stories/components/Stepper.mdx#L92), [:100-102](../../../packages/design-system/src/stories/components/Stepper.mdx#L100-L102), [Tree.mdx:24](../../../packages/design-system/src/stories/components/Tree.mdx#L24), [:103-107](../../../packages/design-system/src/stories/components/Tree.mdx#L103-L107) | Rewrite in the present tense after STR-2 and STR-4, and move the nested tree to a Don't pair that points at Table.Tree or a disclosure. |
| STR-20 | Done markers are success green on a blue selected rail, and upcoming markers use `color.border`, which has no 3:1 check, so the path ahead is hard to see. Polish, not a 1.4.11 failure. | [stepper.tsx:100-105](../../../packages/design-system/src/components/stepper.tsx#L100-L105), [:162-172](../../../packages/design-system/src/components/stepper.tsx#L162-L172) | Draw the done rail in `color.border.success`, move upcoming rings to `color.border.bold`, and update Stepper.mdx lines 21, 51 and 79. |

**Missing in this family:**

- Wizard step-change focus guidance on the Stepper page: it says which steps take `onSelect` but not where focus goes when the step content changes, and the one wizard loses focus on every change (STR-1, STR-2). High.
- Tree.Item `hint`: rows need a code, kind or profile beside the name; with no slot the wizard fills the non-shrinking trailing slot and the name collapses to "Unna…" at 390px (STR-5). Medium.
- Locale-backed event-time helper for Timeline: its content rules ("2h ago", "Yesterday", the full stamp as the tooltip) have no implementation, so screens pass `toLocaleString()` or raw ISO strings (STR-10). Medium.
- Activity and history shape in product-patterns.md: four renderings exist, and the contract does not say which one a record body, rail or register uses (STR-11). Medium.

**Already tracked:**

- STR-9, a selected Tree row and an active Timeline row vanish in forced colours, and none of the three parts has a data-slot to target ([tree.tsx:294](../../../packages/design-system/src/components/tree.tsx#L294), [timeline.tsx:345](../../../packages/design-system/src/components/timeline.tsx#L345)): extends [design-system-deep-audit-2026-09-18.md #4](../design-system-deep-audit-2026-09-18.md#L88). Key a forced-colours rule on ARIA state (`[role=treeitem][aria-selected=true]`, and the `aria-current` that STR-8 adds) with Highlight and HighlightText or a 2px Highlight outline, and add a Tree case to the forced-colours browser project.

## Stat and Attachment

Stat and Attachment are careful presentational parts: Stat.Grid folds by its own width and zero reads muted. The prototype uses neither. The evidence file flow is the most serious gap: a bare filename, an unstyled native file input, a primary disabled until a file is chosen, no progress, no cancel, and a Storage client that aborts every request after 30s, so a large upload on a modest uplink fails with no feedback (STA-2). Stat's documented link-around-the-tile draws a grey band and clips focus, and its docs name no loading or unavailable state, so Portfolio's band and the program queue tiles are hand-rolled.

**Keep:** Stat.Grid folds by its own width with no media queries (6 or 5 to 3, then 2, then 1), a short last row fills its row, and plays check it in a 320px panel; zero reads muted whatever the tone, and the Do/Don't stories hold the tone to one status number; tabular numerals, with toned values sharing Badge's text colours; refs, ids, ARIA and className forwarding are checked for Stat, Stat.Tile and Stat.Grid; Attachment leaves the lifecycle to the caller, maps states to `aria-busy` and style only, and does no file operations; Trigger and Actions are sibling controls, with focus order and hit-testing checked in a play; Attachment.Action requires a label by type, held by type tests; the WithActions story removes with Undo and restores focus to the surviving control; the docs never make colour the only error signal and let error text wrap; reduced motion is honoured through `animate-rise`, `stagger-children` and Spinner.

**STA-2 · The evidence file flow does not use Attachment** (high)

[evidence-file.tsx:254-316](../../../src/components/app/evidence-file.tsx#L254-L316)

An attached file is a bare `<span>` with the last path segment beside a Download button, with no type, size or icon although the row has `media_type` and `byte_size`, and the only upload progress is the label "Uploading…" for files up to 50 MiB. The AbortController fires only on unmount, so a wrong upload cannot be stopped; errors are a raw `<p role="alert">`, the heading a raw `<h2>`, and Upload stays disabled until a file is chosen, against "validate on submit with the primary enabled". This renders in the evidence version preview and the requirement evidence dialog, nothing in src/ imports Attachment, and [docs/next.md:70](../../next.md#L70) still records evidence as using Attachment previews, which was true of code since removed (STA-15).

**Fix:**

- Compose EvidenceFile from Attachment: idle with name, formatted size and type and a Remove named with the filename; uploading with Progress (indeterminate unless the upload moves to Supabase's resumable TUS upload) and a Cancel; error with the message and Retry; done with Download. Keep the primary enabled, validate on submit, and use Section instead of the raw h2.
- Give Cancel its own path: abort, clear `operation.current` and `busy`, and leave the reserved path recoverable through the existing Recover flow. Lift the 30s timeout for the upload request, or scale it to the file size.

**STA-1 · Stat has no linked form, and the documented link-around-the-tile breaks Stat.Grid** (medium)

[Stat.mdx:50](../../../packages/design-system/src/stories/components/Stat.mdx#L50), [stat.css:24-41](../../../packages/design-system/src/styles/stat.css#L24-L41), [stat.tsx:7-19](../../../packages/design-system/src/components/stat.tsx#L7-L19), [:109](../../../packages/design-system/src/components/stat.tsx#L109)

Stat.mdx says a tile that takes the reader somewhere is a link around the tile, but stat.css sizes the grid's direct children, so the anchor stretches to 102px while the tile keeps 68px and a 34px band of gutter colour shows beneath it. The anchor's focus ring is the browser default, clipped top and bottom by the frame's `overflow-hidden`, so the kit gives dashboards no working way to link a headline count to its register, and the program queue tiles hand-roll one (STA-6).

**Fix:** Add `render` (a router Link) or `href` to Stat.Tile and Stat, so the anchor is the grid child, with a hover surface and an inset focus ring (negative `outline-offset`) that `overflow-hidden` cannot clip. Rewrite Stat.mdx:50.

**STA-3 · There is no file picker or drop zone, and the native file input reads as plain text** (medium)

[evidence-file.tsx:270-283](../../../src/components/app/evidence-file.tsx#L270-L283), [input.tsx:20](../../../packages/design-system/src/components/input.tsx#L20)

`<Input type="file">` is the only way to choose evidence, and Input strips the native button's border and background, so "Choose File No file chosen" reads as one line of text in a field frame, with no drop target. Attachment.mdx leaves file selection to the application, but the kit offers nothing to build it from, so each future upload surface (comments, SSP attachments, the create-evidence dialog) will hand-roll its own.

**Fix:** Add a FileTrigger (a Button that opens a hidden input, with `accept`, `multiple` and `onSelect`) and a DropZone (keyboard-operable, with drag-over and invalid states and accept and size hints), both handing off to Attachment. Document the constraints line ("PDF, up to 50 MB") and the error copy.

**STA-4 · Stat has no loading or unavailable state** (medium)

[stat.tsx:7-19](../../../packages/design-system/src/components/stat.tsx#L7-L19), [index.tsx:98-102](../../../src/routes/index.tsx#L98-L102), [program-workspace.tsx:289](../../../src/components/prototype/program-workspace.tsx#L289), [record-browser.tsx:1172-1177](../../../src/components/app/record-browser.tsx#L1172-L1177)

StatProps takes only label, value and tone, so screens write "Loading…", "…" or "Unavailable" into the number slot in heading type, where a load looks like data and a failure like a value. RecordCount wraps its "Loading…" in `<p role="status">`, so /schema announces every tile as it finishes loading.

**Fix:** Document Loading (`value={<Skeleton shape="heading" />}` with `aria-busy` on the tile or grid) and Unavailable (`value={<Absent />}` with a note such as "Could not load") in Stat.mdx States, and add `isLoading` only if that composition proves awkward. Drop `role="status"` from RecordCount.

**STA-5 · The Portfolio band is a hand-rolled Stat.Grid that misaligns on a phone** (medium)

[index.tsx:85-107](../../../src/routes/index.tsx#L85-L107)

The band is a Grid of Boxes with raw `<p>` elements copying Stat.Tile's classes, keyed to the viewport, with `first:ps-0` removing the padding from the first tile only. At 390px the second row starts 16px right of the first with no hairline between the columns, and at 1280px "Unsatisfied findings 0" shows at full weight, with numbers formatted by host-locale `toLocaleString()`.

**Fix:** Replace it with `<Stat.Grid cols={4} frame="band">` and Stat.Tile, which folds by container and mutes zero. Linking each tile to its register depends on STA-1; add it and the STA-4 states when they land.

**STA-6 · The program Overview queue tiles are buttons that navigate** (medium)

[program-workspace.tsx:250-295](../../../src/components/prototype/program-workspace.tsx#L250-L295), [:139-141](../../../src/components/prototype/program-workspace.tsx#L139-L141)

Open tasks, Open issues and Open risks are `<button onClick={() => select(queue.tab)}>` with hand-written classes, and `select()` navigates to a new URL, so readers cannot open a queue in a new tab or copy its link. The focused tile shows the browser's default ring, "0 Open tasks" is at full weight, the ArrowUpRight suggests leaving the app, and the grid switches at the viewport `sm` breakpoint.

**Fix:** Render each queue as a linked Stat (STA-1), or at least a router Link to the tab URL with the kit focus ring, zero muted and no external glyph, inside Stat.Grid.

**STA-7 · Attachment.Trigger covers the Title, so the full filename can never be read** (medium)

[attachment.tsx:97-105](../../../packages/design-system/src/components/attachment.tsx#L97-L105), [:137-149](../../../packages/design-system/src/components/attachment.tsx#L137-L149), [Attachment.mdx:20](../../../packages/design-system/src/stories/components/Attachment.mdx#L20)

Attachment.mdx says a native `title` can expose the full name, but the Trigger is `absolute inset-0 z-10` over the content, so the title's tooltip never appears, and the button's `select-none` stops copying. The Title truncates at the end, so "acas-scan-ws-x90-2026-09-01.pdf" and "…-09-15.pdf" lose the date and extension that tell them apart.

**Fix:** Give Title middle truncation that keeps the extension, or a Tooltip with the full name on the Trigger's hover and focus. Fix Attachment.mdx:20 so that with a Trigger the full-name title goes on the Trigger or the root.

**STA-10 · Stat does not format numbers with the Ledger locale** (medium)

[stat.tsx:10-11](../../../packages/design-system/src/components/stat.tsx#L10-L11), [:57](../../../packages/design-system/src/components/stat.tsx#L57), [:78](../../../packages/design-system/src/components/stat.tsx#L78), [index.tsx:102](../../../src/routes/index.tsx#L102), [record-browser.tsx:1176](../../../src/components/app/record-browser.tsx#L1176)

`value` renders as given, so `1234` shows with no grouping, and the prototype formats with host-locale `toLocaleString()`, while the kit's locale layer defaults to en-US and never the host ([locale-format.ts:173](../../../packages/design-system/src/lib/locale-format.ts#L173)). Large counts read without separators, or with separators that change with the machine.

**Fix:** When `value` is a number, format it with `useLedgerLocale().formatNumber`, and pass strings through unchanged. Document it in Content.

| Id     | Finding | Where | Fix |
| ------ | ------- | ----- | --- |
| STA-8  | A card-wide Trigger sets `hover:bg-transparent active:bg-transparent`, so a card that opens a preview or downloads looks exactly like a static one. | [attachment.tsx:143](../../../packages/design-system/src/components/attachment.tsx#L143) | Style the root on trigger hover and press (`has-[[data-slot=attachment-trigger]:hover]:bg-surface-raised-hovered` and a pressed token), with no hover when the trigger is disabled. |
| STA-9  | Every Attachment example writes "PDF · 2.4 MB", but the locale has no file-size formatter, the evidence facts print raw bytes, and evidence-file.tsx hard-codes "50 MiB". | [evidence-browser.tsx:505-506](../../../src/components/prototype/evidence-browser.tsx#L505-L506), [evidence-version-details.tsx:74-75](../../../src/components/prototype/evidence-version-details.tsx#L74-L75), [locale-format.ts:187-217](../../../packages/design-system/src/lib/locale-format.ts#L187-L217) | In the prototype, show a formatted size with the exact bytes ("2.4 MB (2,457,600 bytes)"). A kit `formatFileSize` is a small convenience that belongs with Attachment's docs. |
| STA-11 | The DataTable metrics story and Stat's Frames story lay out bare Stats in viewport-keyed grids, the layouts Stat.Grid was built to avoid, and DataTable.mdx shows the same. | [DataTable.stories.tsx:296-307](../../../packages/design-system/src/stories/patterns/DataTable.stories.tsx#L296-L307), [Stat.stories.tsx:142-161](../../../packages/design-system/src/stories/components/Stat.stories.tsx#L142-L161), [DataTable.mdx:37](../../../packages/design-system/src/stories/patterns/DataTable.mdx#L37) | Use Grid with a container-intrinsic auto-fit template in both stories and in DataTable.mdx; `frame="none"` on Stat.Grid is optional. |
| STA-12 | For a link or download, the docs tell consumers to copy Trigger's overlay geometry into an `<a>`, and the class string appears in four places. | [Attachment.mdx:65-80](../../../packages/design-system/src/stories/components/Attachment.mdx#L65-L80), [Attachment.stories.tsx:92-102](../../../packages/design-system/src/stories/components/Attachment.stories.tsx#L92-L102), [attachment.types.tsx:15-25](../../../packages/design-system/test/attachment.types.tsx#L15-L25) | Export Attachment.Link, an anchor with the overlay geometry that forwards ref, `href`, `download` and `target` and takes `render` for router links, or an `attachmentTriggerVariants` helper. |
| STA-13 | The uploading example has Progress but no Cancel, and no story shows the polite status region the MDX describes. | [Attachment.stories.tsx:256-305](../../../packages/design-system/src/stories/components/Attachment.stories.tsx#L256-L305), [Attachment.mdx:57-65](../../../packages/design-system/src/stories/components/Attachment.mdx#L57-L65), [:100](../../../packages/design-system/src/stories/components/Attachment.mdx#L100) | Add a "Cancel uploading <name>" action and one polite status that announces "Uploaded <name>" or the failure, and mention both in Accessibility. |
| STA-16 | Stat.mdx rules out a sparkline, while ChartSparkline's InTiles story puts one in Stat.Tile's value slot, where `isZero` cannot see a zero inside the span. | [ChartSparkline.stories.tsx:55-98](../../../packages/design-system/src/stories/patterns/ChartSparkline.stories.tsx#L55-L98), [Stat.mdx:30](../../../packages/design-system/src/stories/components/Stat.mdx#L30), [stat.tsx:30](../../../packages/design-system/src/components/stat.tsx#L30) | Either add a `trend` slot beside the value (with an explicit polarity, and sign and text as well as colour), or move the sparkline under the note and keep `value` a number. |
| STA-17 | Stat.Grid's dividers are the grid background showing through 1px gaps, so forced colours removes them, and Stat.Grid has no data-slot. | [stat.tsx:114](../../../packages/design-system/src/components/stat.tsx#L114), [stat.css:23](../../../packages/design-system/src/styles/stat.css#L23), [forced-colors.css](../../../packages/design-system/src/styles/forced-colors.css) | Add `data-slot="stat-grid"` and a forced-colours rule: a CanvasText grid background with `forced-color-adjust: none` and tiles on Canvas, or per-tile borders. |

**Missing in this family:**

- FileTrigger and DropZone: every evidence upload starts by choosing a file, and the kit has nothing for it, so the prototype uses a native input that reads as plain text, with no drop target and no accept or size hints (STA-3). High.
- Linked Stat (`href` or `render` on Stat.Tile and Stat): dashboards need a count that opens its filtered register, and the documented link-around-the-tile breaks the grid and hides focus (STA-1, CNT-6). High.
- Stat loading and unavailable states: every dashboard count loads asynchronously and can fail, and screens now write "Loading…", "…" or "Unavailable" in the number slot (STA-4). Medium.
- `formatFileSize` in the Ledger locale: Attachment's Description is meant to carry a human-readable size, and the evidence facts print raw bytes (STA-9). Medium.

**Already tracked:**

- STA-14, the Timeline stories declare a local `Attachment`, a paperclip ButtonGroup chip, that shadows the kit part ([Timeline.stories.tsx:82-95](../../../packages/design-system/src/stories/components/Timeline.stories.tsx#L82-L95)): [docs/next.md:127](../../next.md#L127) "An Attachment of its own", which still asks whether to build a part that exists. Compose the kit Attachment (xsmall, Download as an action) in the feed story and close the item.
- STA-15, [Stat.mdx:30](../../../packages/design-system/src/stories/components/Stat.mdx#L30) cites a dashboard stat and tinted counts that are gone, and next.md records evidence as using Attachment previews: [docs/next.md:110-111](../../next.md#L110-L111) and [:70](../../next.md#L70). Rewrite Stat's "Not built" paragraph without the stale references, close the two open items, and reopen the evidence item as STA-2.
