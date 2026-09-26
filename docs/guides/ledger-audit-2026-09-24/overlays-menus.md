# Family deep dive: overlays, menus and disclosure

Part of the [Ledger audit, 24 September 2026](README.md).

Four groups: modal overlays (MOD), floating surfaces (FLT), menus and commands (MNU), and disclosure (DSC).

## Dialog, AlertDialog, Sheet, Drawer

Dialog, AlertDialog, Sheet and Drawer are thin, faithful wrappers over Base UI 1.7, but the family stops at the popup: it has no body part, no size scale and no pending state. About 20 prototype overlays rebuild their own scroll bodies, widths and dirty and pending guards, and two of those rebuilds are defects verified live. Focus drops to `<body>` when a create or edit dialog closes (MOD-1), and the generic record form cannot be scrolled or submitted at 844×390 or at 200% zoom (MOD-2). Fix those two first, then add DialogBody, a size scale and one shared form-dialog guard, and correct the Overlays docs, which promise props that do not exist.

**Keep:** thin Base UI wrappers that keep generic payloads, handles, cancellable `onOpenChange`, refs, `render` and state-function `className` on every part; header and footer outside the scroll area with a dvh cap (the Scrollable story works at 844×390); AlertDialog puts Cancel first, so the safe action takes focus, with role `alertdialog`, a linked description and outside clicks ignored; play tests for the focus trap, Escape, focus return, pending cancellation, a nested Select and DatePicker, and a Dialog inside a Sheet; logical sides with RTL-aware motion and reduced motion honoured; Drawer on Base UI's native swipe, snap points and nested stack; one confirmation hook plus the `no-native-confirm` and `dialog-footer-order` rules.

**MOD-1 · Create and edit dialogs drop focus to `<body>` when they close** (high)

[create-task-dialog.tsx:256-258](../../../src/components/prototype/create-task-dialog.tsx#L256-L258), [work-table.tsx:122-129](../../../src/components/prototype/work-table.tsx#L122-L129), [:145](../../../src/components/prototype/work-table.tsx#L145), [:188](../../../src/components/prototype/work-table.tsx#L188), [product-record-dialog.tsx:104-106](../../../src/components/prototype/product-record-dialog.tsx#L104-L106), [campaigns.$campaignId.tsx:95-101](../../../src/routes/campaigns.$campaignId.tsx#L95-L101)

A React `autoFocus` on a field inside a Dialog or Sheet opened without a DialogTrigger makes Base UI record that field as the return target. On close, focus falls to `<body>` and the next Tab lands on the skip link (WCAG 2.4.3). This was verified after Escape, Cancel and Discard changes on Create task, Create risk and Edit assessment campaign, and on the wizard's Add system Sheet, which stays mounted and controlled ([elements.tsx:433](../../../src/components/app/program-wizard/elements.tsx#L433), [:468](../../../src/components/app/program-wizard/elements.tsx#L468)). With only `autoFocus` suppressed, Create risk returns focus to its trigger, so conditional mounting is not the cause. Separately, the WorkTable trigger is disabled while its dialog is open, which breaks focus return by itself.

**Fix:**

- Prototype: replace `autoFocus` inside overlays with `initialFocus` on DialogContent or SheetContent, as [requirement-allocations.tsx:366](../../../src/components/prototype/requirement-allocations.tsx#L366) does, starting with the reference CreateTaskDialog. Stop disabling the WorkTable trigger while the dialog is open.
- Kit: DialogContent and SheetContent capture `document.activeElement` during render, before the children's `autoFocus` runs, and use it as the default `finalFocus`. A ledger lint rule rejects `autoFocus` inside DialogContent, SheetContent and AlertDialogContent.
- Docs: [Forms.mdx:52](../../../packages/design-system/src/stories/patterns/Forms.mdx#L52), [Recipes.mdx:46](../../../packages/design-system/src/stories/docs/Recipes.mdx#L46) and Dialog.mdx say that the first field takes focus through `initialFocus`, never `autoFocus`. Add a story opened from state that asserts focus return.

**MOD-2 · The generic record form cannot be scrolled or submitted in a short window** (high)

[record-browser.tsx:816-820](../../../src/components/app/record-browser.tsx#L816-L820), [library-products.tsx:990-994](../../../src/components/prototype/library-products.tsx#L990-L994), [product-structure.tsx:544-548](../../../src/components/prototype/product-structure.tsx#L544-L548), [dialog.tsx:62](../../../packages/design-system/src/components/dialog.tsx#L62)

RecordEditor, Create configuration and the product element dialog use `<fieldset className="min-h-0 flex-1 overflow-y-auto">` as the scroll body. In Chromium (checked in 151 and 153), a fieldset flex item under a max-height parent never scrolls, while a `<div>` in the same slot does. On Create risk at 844×390, the fieldset is 254px tall with 380px of content. Wheel, `scrollTo` and touch scrolling all leave it at 0, and a click at the centre of the Create risk button lands on the Owner party combobox, which is painted over the footer. Create assessment campaign fails the same way at 1366×657, so any register form taller than the window cannot be completed on a landscape phone, in a split window or at 200% zoom (WCAG 1.4.10, 1.4.4).

**Fix:**

- Scroll a `<div>` with the fieldset inside it, as CreateTaskDialog does, then move all three dialogs onto DialogBody (MOD-3).
- Add an 844×390 story that fills the form and hit-tests the primary. The 24 September audit left Dialog at short heights unverified.

**MOD-3 · There is no DialogBody or SheetBody: 19 of 20 overlay files hand-roll the scroll region** (high)

[dialog.tsx:62](../../../packages/design-system/src/components/dialog.tsx#L62), [:86-122](../../../packages/design-system/src/components/dialog.tsx#L86-L122), [alert-dialog.tsx:59](../../../packages/design-system/src/components/alert-dialog.tsx#L59), [Dialog.mdx:37](../../../packages/design-system/src/stories/components/Dialog.mdx#L37)

DialogContent is a flex column with `overflow-hidden`, and Dialog.mdx tells callers to "place scrolling body padding in children". Every prototype overlay file but one writes its own body:

- with its own padding and overscroll values ([create-task-dialog.tsx:272](../../../src/components/prototype/create-task-dialog.tsx#L272), [library-products.tsx:993](../../../src/components/prototype/library-products.tsx#L993));
- as a fieldset that does not scroll (MOD-2);
- with no scroller at all, so the popup clips it in a short window: the shell's Help and Profile dialogs ([shell.tsx:252-293](../../../src/components/app/shell.tsx#L252-L293)) and the read-only branch of [product-record-dialog.tsx:43-61](../../../src/components/prototype/product-record-dialog.tsx#L43-L61).

AlertDialogContent scrolls the whole popup, so its footer scrolls away, unlike Dialog's.

**Fix:**

- Add DialogBody, SheetBody, DrawerBody and AlertDialogBody: a div with `min-h-0 flex-1 overflow-y-auto`, the standard padding, and tabIndex handling for read-only scrollers. Use them in every story.
- Lint overflow utilities on a fieldset, and on scroll containers written as direct DialogContent or SheetContent children. Allow a `<form>` that wraps the body and footer ([record-browser.tsx:810](../../../src/components/app/record-browser.tsx#L810), [library-products.tsx:981](../../../src/components/prototype/library-products.tsx#L981), [product-structure.tsx:535](../../../src/components/prototype/product-structure.tsx#L535)).

**MOD-4 · About 15 dialogs re-implement pending and dirty protection** (high)

[create-task-dialog.tsx:125-184](../../../src/components/prototype/create-task-dialog.tsx#L125-L184), [:256-265](../../../src/components/prototype/create-task-dialog.tsx#L256-L265), [:449-461](../../../src/components/prototype/create-task-dialog.tsx#L449-L461), [use-draft-guard.tsx:6-47](../../../src/components/app/use-draft-guard.tsx#L6-L47), [parameter-picker.tsx:67](../../../src/components/app/profile-tailoring/parameter-picker.tsx#L67), [:79](../../../src/components/app/profile-tailoring/parameter-picker.tsx#L79)

The contract requires a pending save to block edits, repeat submission, Escape, outside dismissal and navigation. The kit offers only `details.cancel()` in `onOpenChange`. The reference CreateTaskDialog hand-rolls all of it:

- in-flight and bypass refs, and `useBlocker`;
- an `onOpenChange` that always cancels;
- `showCloseButton={!busy}`;
- disabled buttons.

About 15 dialogs repeat this block, and `showCloseButton={!…}` appears 16 times. `useDraftGuard`, which already packages the logic, has 3 users, and product-patterns.md does not name it.

The copies have drifted. parameter-picker asks "Discard the unrecorded parameter override?" on close but says "Your parameter override has not been recorded." on navigation. PickerSheet's Cancel and X look enabled while a save is pending, and pressing them silently does nothing.

**Fix:**

- Add `pending` to Dialog, Sheet and AlertDialog. It cancels every dismissal reason, disables or hides Close, and sets `aria-busy` on the popup.
- Make `useDraftGuard` (or a FormDialog wrapper) the one API for dirty state, pending state, route blocking, `beforeunload` and focus return. Migrate CreateTaskDialog first and name the hook in product-patterns.md.

**MOD-5 · The overlay docs promise props that do not exist and describe placement the app no longer has** (medium)

[Overlays.mdx:46](../../../packages/design-system/src/stories/components/Overlays.mdx#L46), [:72-74](../../../packages/design-system/src/stories/components/Overlays.mdx#L72-L74), [llms.txt:4970](../../../packages/design-system/llms.txt#L4970), [Dialog.mdx:32-37](../../../packages/design-system/src/stories/components/Dialog.mdx#L32-L37), [AlertDialog.mdx:30-34](../../../packages/design-system/src/stories/components/AlertDialog.mdx#L30-L34)

The docs contradict the code in four places:

- Overlays.mdx says controlled modals accept `returnFocusRef` and `pending`. Neither exists; the component pages say `returnFocusRef` became `finalFocus`. llms.txt repeats the claim.
- Overlays.mdx gives Sheet an `onBack`, which only PreviewSheet and PickerSheet have.
- Dialog.mdx describes 520 and 860px widths with top placement, and AlertDialog.mdx a 440px maximum with top placement. The app uses 12 widths and centred placement ([confirmation.tsx:54](../../../src/components/app/confirmation.tsx#L54)).
- The Dialog, AlertDialog and Sheet pages are mostly migration history, with no guidance on when to use them, sizing, pending or content.

Agents read these pages as the contract.

**Fix:** Delete the Modifiers paragraph, or implement `pending` (MOD-4). Move the `onBack` sentence to PreviewSheet. Replace the migration sections with present-tense guidance: when to use, sizes, the body part, the pending recipe, focus return (MOD-1) and content rules. Then regenerate llms.txt.

**MOD-6 · The discard prompt's safe action says Cancel, and its description repeats the question** (medium)

[confirmation.tsx:13-18](../../../src/components/app/confirmation.tsx#L13-L18), [:60](../../../src/components/app/confirmation.tsx#L60), [:71-76](../../../src/components/app/confirmation.tsx#L71-L76), [create-task-dialog.tsx:171](../../../src/components/prototype/create-task-dialog.tsx#L171), [:180](../../../src/components/prototype/create-task-dialog.tsx#L180), [use-draft-guard.tsx:9](../../../src/components/app/use-draft-guard.tsx#L9)

`useConfirmation` hard-codes `<AlertDialogCancel>Cancel</AlertDialogCancel>` and has no `cancelLabel`, so the prompt reads "Discard changes? / Discard this unsaved task? / Cancel / Discard changes". The contract and the kit's own SmallConfirmation story use "Keep editing", and AlertDialog.mdx asks for the consequence in the description. In a discard prompt, "Cancel" can read as cancelling the edit, and the second question says nothing about what will be lost.

**Fix:** Add `cancelLabel` to ConfirmationOptions and default it to "Keep editing" in `discardChanges()`. Have `discardChanges` state the consequence ("The task details you entered will be lost.") from a noun the caller passes.

**MOD-7 · `useConfirmation` closes before the destructive command runs** (medium)

[confirmation.tsx:25-30](../../../src/components/app/confirmation.tsx#L25-L30), [:61](../../../src/components/app/confirmation.tsx#L61), [product-structure.tsx:152-176](../../../src/components/prototype/product-structure.tsx#L152-L176), [record-browser.tsx:899-927](../../../src/components/app/record-browser.tsx#L899-L927), [program-wizard.tsx:437-470](../../../src/components/app/program-wizard.tsx#L437-L470)

The Action calls `settle(true)`, which closes the dialog before the caller's mutation starts. Delete record and Remove element therefore show no progress in the dialog, and a failure appears somewhere else on the page. This contradicts AlertDialog.mdx and Overlays.mdx, which both say to close only after the command succeeds. The one confirmation that needed a spinner, "Create {program}?", hand-rolls its own AlertDialog.

**Fix:** Let `confirm()` take an async `action`. While it runs, keep the AlertDialog open with the Action loading and Cancel disabled, and cancel dismissal. Show a failure inside the dialog, with the Action as retry. Then replace the wizard's copy.

**MOD-9 · Modal popups lose their edge in forced-colours mode** (medium)

[dialog.tsx:62](../../../packages/design-system/src/components/dialog.tsx#L62), [alert-dialog.tsx:59](../../../packages/design-system/src/components/alert-dialog.tsx#L59), [sheet.tsx:108](../../../packages/design-system/src/components/sheet.tsx#L108), [forced-colors.css:1-80](../../../packages/design-system/src/styles/forced-colors.css#L1-L75)

The popups draw their edge only with `bg-surface-overlay` and `shadow-overlay`, and forced-colors.css has no overlay rule. With forced colours active, the Dialog Form popup has no border, no outline and no shadow, and the blanket is not painted. Only the header and footer rules show, so a Windows High Contrast user cannot see where the modal ends or that the page behind it is blocked.

**Fix:** Give every overlay popup `outline: var(--ds-border-width) solid transparent`, or a `CanvasText` border on the four popup slots under `forced-colors: active`. Add these stories to the forced-colours browser project. Tooltip (FLT-3) and menu rows (MNU-1) have the same gap.

**MOD-10 · No size scale: prototype dialogs use 12 inline widths** (medium)

[dialog.tsx:44](../../../packages/design-system/src/components/dialog.tsx#L44), [:62](../../../packages/design-system/src/components/dialog.tsx#L62), [alert-dialog.tsx:39-41](../../../packages/design-system/src/components/alert-dialog.tsx#L39-L41), [sheet.tsx:95-105](../../../packages/design-system/src/components/sheet.tsx#L95-L105)

DialogContent has no `size` and defaults to 520px, so prototype dialogs pass `style={{ maxWidth }}` with values from 560 to 1120. One uses 90vw by 90dvh ([requirement-evidence.tsx:250](../../../src/components/prototype/requirement-evidence.tsx#L250)). Sheet widths are inline too: 420px by default, 480px in [elements.tsx:438](../../../src/components/app/program-wizard/elements.tsx#L438). As a result, create forms of the same kind open at different widths, and a full-screen task needs inline style.

**Fix:** Add `size` to DialogContent: small, medium, large, xlarge and fullscreen (for example 400, 600, 800 and 968px, plus a size that fills the viewport). Give SheetContent a matching scale, and map the prototype widths onto them. Leave AlertDialog's `sm` to a kit-wide size-naming pass (AlertDialog, Card, Select, Switch, InputGroup) with deprecated aliases.

| Id     | Finding                                                                                                                                                                                                                                      | Where                                                                                                                                                                                                                                                                                         | Fix                                                                                                                                                                                                           |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MOD-8  | An AlertDialog stacked on a Dialog or Sheet has no blanket and does not dim the parent, so under the discard prompt the parent's primary still looks active.                                                                                   | [dialog.tsx:28-39](../../../packages/design-system/src/components/dialog.tsx#L28-L39), [:57-64](../../../packages/design-system/src/components/dialog.tsx#L57-L64), [alert-dialog.tsx:26-38](../../../packages/design-system/src/components/alert-dialog.tsx#L26-L38)                                  | Style `[data-slot=dialog-content][data-nested-dialog-open]` and the sheet equivalent with an `::after` blanket or a `--nested-dialogs` scale. Cover it in the Overlays Stacked story.                         |
| MOD-12 | The close X renders after the footer in the DOM but is drawn at the top end, so Tab moves through the fields and the footer, then jumps back to the top corner.                                                                                  | [dialog.tsx:66-80](../../../packages/design-system/src/components/dialog.tsx#L66-L80), [sheet.tsx:114-128](../../../packages/design-system/src/components/sheet.tsx#L114-L128)                                                                                                                      | Render the X inside DialogHeader, or before the children in the DOM.                                                                                                                                                 |
| MOD-13 | `DialogFooter showCloseButton` appends Close after the primary. `dialog-footer-order` only checks for a literal "Cancel" in DialogFooter. PickerSheet's Cancel uses the default variant, not the subtle one the contract names.                          | [dialog.tsx:100-121](../../../packages/design-system/src/components/dialog.tsx#L100-L121), [composition-rules.js:233-273](../../../packages/design-system/eslint-plugin/composition-rules.js#L233-L273), [picker-sheet.tsx:148](../../../packages/design-system/src/patterns/picker-sheet.tsx#L148) | Render the footer Close before the children. Extend the rule to AlertDialogFooter, AlertDialogCancel and SheetFooter.                                                                                             |
| MOD-14 | SheetPortal and SheetOverlay are private, while the other overlays export theirs. SheetHeader's 16px inline padding does not match SheetFooter's 20px.                                                                                             | [sheet.tsx:23-39](../../../packages/design-system/src/components/sheet.tsx#L23-L39), [:140](../../../packages/design-system/src/components/sheet.tsx#L140), [:153](../../../packages/design-system/src/components/sheet.tsx#L153)                                                                      | Align SheetFooter with SheetHeader and the body at space.200, or move all three to 250 to match Dialog. Export SheetPortal and SheetOverlay if custom sheets are to be supported.                                     |

**Missing in this family:**

- DialogBody, plus SheetBody, DrawerBody and AlertDialogBody: one scroll region between a fixed header and footer, with standard padding. Without it every dialog hand-rolls its own, and one guess makes the generic form unusable (MOD-2, MOD-3). High.
- `pending` on Dialog, Sheet and AlertDialog: the contract's pending rules, without per-screen `details.cancel()`, `showCloseButton={!busy}` and disabled buttons (MOD-4). High.
- Form dialog recipe: one documented composition that uses `initialFocus` instead of `autoFocus`, puts the footer outside the form through the `form` attribute, and uses `useDraftGuard` for dirty and pending state. It removes the duplicated guard and the focus loss (MOD-1, MOD-4). High.
- Dialog size scale: create and edit forms of the same kind open at the same width, and a full-screen task needs no inline style (MOD-10). Medium.
- Nested-dialog parent state: the one permitted stack, an AlertDialog over a Dialog or Sheet, needs the parent to look inactive (MOD-8). Medium.

**Already tracked:**

- MOD-15, Drawer has no consumer, spans the full desktop width and does not wrap Base UI's VirtualKeyboardProvider: [docs/next.md](../../next.md) "The Drawer has no consumer" (2026-09-04).
- MOD-16, `radius.xlarge` says "Dialogs, sheets", but overlays use xxlarge and Sheet is square: [docs/next.md](../../next.md) "Four drifts the token pages found" (2026-09-04).

## Popover, HoverCard, Tooltip

Popover, HoverCard and Tooltip are thin, well-typed wrappers over Base UI 1.7. Focus return, Escape layering, hoverable popups and RTL all work. The defects are at the screen edge and in forced colours. Popover and HoverCard have no available-height cap, so a DatePicker on a landscape phone opens partly off-screen (FLT-1), and the Tooltip loses its whole boundary under forced colours (FLT-3). PopoverContent offers only four positioning props, which pushed the chart cards to rebuild the surface from Base UI, and those copies have drifted (FLT-2). Next come a truncation helper, generalised from Breadcrumb's, that shows the full text of non-string cells, and a lighter disabled-button recipe in the Tooltip docs.

**Keep:** thin wrappers that pass through every Base UI prop, ref, `render` and state callback, with type tests; WCAG 1.4.13 met (hoverable popups, Escape dismisses, they persist until hover or focus leaves); Escape inside a Dialog closes the tooltip or popover first and keeps focus; Popover focus moves in, Tab can leave it and focus returns on close, and touch opens no virtual keyboard; RTL placement asserted in play functions; popups capped at `--available-width` and on screen at 320px; token motion with reduced-motion opt-outs; honest docs that tooltips are visual only, and IconButton ties its tooltip to its `aria-label`; payload-driven shared roots for HoverCard on an id; the prototype never hand-rolls a popover or hover card.

**FLT-1 · Popover and HoverCard have no available-height cap, so tall content opens off-screen** (medium)

[popover.tsx:41-45](../../../packages/design-system/src/components/popover.tsx#L41-L45), [hover-card.tsx:39-43](../../../packages/design-system/src/components/hover-card.tsx#L39-L43), [toolbar.tsx:348-349](../../../packages/design-system/src/patterns/toolbar.tsx#L348-L349), [filter.tsx:292-293](../../../packages/design-system/src/patterns/data-table/filter.tsx#L292-L293)

PopoverContent and HoverCardContent set a width and a maximum width but no maximum height or overflow. DropdownMenu, Select and Combobox all cap at `var(--available-height)`, and Toolbar More and DataTable Filters patch the gap in each call. In the DatePicker playground at 740×360, with the field moved 150px down, the calendar flipped above the field and rendered at y=-143. The month caption and the previous and next arrows were off-screen, so the month could not be changed. Table.List's hover card ([table.tsx:901-915](../../../packages/design-system/src/components/table.tsx#L901-L915)) lists every item with no cap, so it can fail the same way.

**Fix:** Add `maxHeight: "var(--available-height)"` and `overflow-y-auto` to both defaults, remove the two per-call patches, and add a short-landscape DatePicker story.

**FLT-2 · PopoverContent exposes only four positioning props, so the chart cards rebuild the surface** (medium)

[popover.tsx:26-27](../../../packages/design-system/src/components/popover.tsx#L26-L27), [chart/\_shared.tsx:1324-1350](../../../packages/design-system/src/patterns/chart/_shared.tsx#L1324-L1350), [heatmap.tsx:224-252](../../../packages/design-system/src/patterns/chart/heatmap.tsx#L224-L252)

PopoverContentProps picks only `align`, `alignOffset`, `side` and `sideOffset`. The chart details card and the Heatmap card need `anchor` and `collisionPadding`, so both import `@base-ui/react/popover`, rebuild the Portal, Positioner and Popup, and copy the surface classes. The copies have drifted from PopoverContent:

- font-body instead of font-body-small, and gap-150 instead of gap-100;
- sideOffset 6 instead of 4, and collisionPadding 8;
- a hand-written direction wrapper.

HoverCardContent and TooltipContent have the same four props, so a product that anchors to a cell or a virtual point has to reach under the kit.

**Fix:**

- Extend the Pick on all three Content parts with at least `anchor` and `collisionPadding`, and ideally `collisionBoundary`, `collisionAvoidance`, `sticky` and `positionMethod`.
- Re-point the chart card and the Heatmap to PopoverContent. Consider exporting the surface classes as one constant.

**FLT-3 · The Tooltip has no boundary in forced-colours mode** (medium)

[tooltip.tsx:65](../../../packages/design-system/src/components/tooltip.tsx#L65), [:76-79](../../../packages/design-system/src/components/tooltip.tsx#L76-L79), [forced-colors.css](../../../packages/design-system/src/styles/forced-colors.css)

The tooltip is drawn with a `bg-neutral-bold` fill and `shadow-overlay` and has no border. Under forced colours the fill becomes Canvas and the shadow is removed. On the IconButtons story it computed to white on a white page with no border or outline, and "Copy link" floated as plain text with no container or arrow. Popover and HoverCard keep a border and are unaffected.

**Fix:** Add `border border-transparent` to the popup; forced colours paints it as CanvasText. Add a Tooltip case to the forced-colours browser project. This is the same gap as MOD-9 and MNU-1.

**FLT-6 · Truncated record names cannot show their full text** (medium)

[table.tsx:380](../../../packages/design-system/src/components/table.tsx#L380), [data-table.tsx:604](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L604), [shell.tsx:224](../../../src/components/app/shell.tsx#L224)

Table.Cell and the DataTable cell add a native `title` only when the content is a plain string. A record name is a TextLink, so it gets nothing. On the WS-X90 Controls tab at 1440px, "Automated Temporary and Emergency Account Ma…" has no title and no tooltip, and where a title does exist it is mouse-only. Readers cannot see a truncated name without opening the record, and keyboard users never can from the list.

The app patches the Shell.Profile email with titles ([schema-shell.tsx:115](../../../src/components/app/schema-shell.tsx#L115)), while Breadcrumb already has an overflow-aware hook ([breadcrumb.tsx:501](../../../packages/design-system/src/components/breadcrumb.tsx#L501)).

**Fix:** Generalise Breadcrumb's `useFullTextTitle` into one exported truncation helper. It shows the full text in a Tooltip on hover and when the focusable element takes keyboard focus. Apply it in Table.Cell and the DataTable cell for non-string content, in header labels, and in Shell.Profile. Breadcrumb collapse is responsive-2026-09-24 #6.

| Id     | Finding                                                                                                                                                                                                                                       | Where                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Fix                                                                                                                                                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FLT-4  | A disabled IconButton has `pointer-events-none` and native `disabled`, so its tooltip, the only visible label, never shows. Tooltip.mdx recommends a `span tabIndex=0 role="group"` wrapper, which adds a tab stop that is not a control.                          | [button.tsx:31](../../../packages/design-system/src/components/button.tsx#L31), [:168-169](../../../packages/design-system/src/components/button.tsx#L168-L169), [:229-235](../../../packages/design-system/src/components/button.tsx#L229-L235), [Tooltip.mdx:44](../../../packages/design-system/src/stories/components/Tooltip.mdx#L44), [Tooltip.stories.tsx:221-236](../../../packages/design-system/src/stories/components/Tooltip.stories.tsx#L221-L236) | Rewrite Tooltip.mdx "Accessibility and disabled actions" and the Unavailable story around `focusableWhenDisabled` on the Button or IconButton, and drop the wrapper. Optionally add a reason wired through `aria-describedby`. Do not make every disabled IconButton focusable by default. |
| FLT-7  | The `c.id` glance trigger is a `<span tabIndex={0}>` with no role. It adds a Tab stop to every row that only shows a card, it is silent to screen readers, and a tap never opens it.                                                                                   | [data-table.tsx:514-530](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L514-L530)                                                                                                                                                                                                                                                                                                                                                                          | Remove the tab stop and rely on the eye and the preview, or attach the glance to the name link, as HoverCard.mdx prescribes. Do not make the id a second link.                                                                                                     |
| FLT-8  | Table.List sets both a native `title` and a HoverCard on the same trigger, so two popups appear. The card also truncates each label and meta line it exists to show.                                                                                 | [table.tsx:877](../../../packages/design-system/src/components/table.tsx#L877), [:905-908](../../../packages/design-system/src/components/table.tsx#L905-L908), [:919-944](../../../packages/design-system/src/components/table.tsx#L919-L944)                                                                                                                                                                                                                                             | Remove the `title`. Expose the full list through visually hidden text referenced by `aria-describedby`. Let card items wrap, or clamp them at two lines.                                                                                                                     |
| FLT-9  | Base UI tooltips set neither `role=tooltip` nor `aria-describedby`. In the lead example, the shortcut (`Search <Kbd>K</Kbd>`) exists only in the tooltip, and the trigger has no `aria-keyshortcuts`.                                                                   | [Tooltip.mdx:12-17](../../../packages/design-system/src/stories/components/Tooltip.mdx#L12-L17), [:42](../../../packages/design-system/src/stories/components/Tooltip.mdx#L42), [tooltip.tsx:61-80](../../../packages/design-system/src/components/tooltip.tsx#L61-L80)                                                                                                                                                                                                                    | Add an opt-in `describe` on TooltipContent that renders a visually hidden copy referenced by the trigger's `aria-describedby`. Document `aria-keyshortcuts` and set it in the lead example.                                                                               |
| FLT-10 | TooltipProvider defaults to a 0ms delay, Shell uses 300ms, and a tooltip outside any provider uses Base UI's 600ms. Overlays.mdx says focus opens a tooltip after 300ms, but focus opens it immediately.                                                                          | [tooltip.tsx:9-11](../../../packages/design-system/src/components/tooltip.tsx#L9-L11), [root.tsx:292](../../../packages/design-system/src/layout/shell/root.tsx#L292)                                                                                                                                                                                                                                                                                                                  | Default TooltipProvider to delay 300 and timeout 300, let Shell rely on that, and correct the Overlays table.                                                                                                                                              |
| FLT-11 | HoverCardContent defaults `alignOffset` to 4 with `align="center"`, so cards sit about 4px off their trigger and callers reset the offset to 0.                                                                                                    | [hover-card.tsx:34](../../../packages/design-system/src/components/hover-card.tsx#L34), [:58](../../../packages/design-system/src/components/hover-card.tsx#L58), [popover.tsx:61](../../../packages/design-system/src/components/popover.tsx#L61)                                                                                                                                                                                                                                         | Default `alignOffset` to 0. Record the choice between font-body and font-body-small on the Overlays page.                                                                                                                                                     |
| FLT-12 | Tooltip.mdx cites an UnavailableAction component that does not exist. The Unavailable story puts a `title` on a disabled button, where it never shows, and the wizard's Continue button copies it, although the reason is already visible text.                                        | [Tooltip.mdx:44](../../../packages/design-system/src/stories/components/Tooltip.mdx#L44), [Tooltip.stories.tsx:232](../../../packages/design-system/src/stories/components/Tooltip.stories.tsx#L232), [program-wizard.tsx:415](../../../src/components/app/program-wizard.tsx#L415)                                                                                                                                                                                                       | Remove the sentence, and drop the `title` from the story and the dead one from the wizard.                                                                                                                                                                     |

**Missing in this family:**

- Overflow-aware truncation tooltip: registers truncate names by design, and readers need the full text on hover and on keyboard focus without opening the record. Today only plain-string cells get a title, and it is mouse-only (FLT-6). Medium.
- `anchor` and `collisionPadding` on PopoverContent, HoverCardContent and TooltipContent: anchoring to a mark, a cell or a virtual point is an ordinary need, and without these props the kit bypasses its own part (FLT-2). Medium.

**Already tracked:**

- FLT-5, native `title` attributes in the prototype carry real information: [docs/next.md](../../next.md) "Hand titles in the prototype" (2026-09-04, open). Two points remain: give the boundary shield ([program-systems-tree.tsx:216](../../../src/components/prototype/program-systems-tree.tsx#L216)) `role="img"` with its label, and decide whether the per-control tailoring rationale ([system-baseline.tsx:388](../../../src/components/prototype/system-baseline.tsx#L388)) shows by default or as a preview property.

## DropdownMenu, Command, CommandPalette, Kbd

DropdownMenu is sound on Base UI Menu: roles, typeahead, focusable disabled items, looping and link items work and are play-tested. It has four confirmed defects:

- the row highlight disappears in forced colours, and Select, Combobox and Command share this;
- a disabled destructive item stays red;
- the kit's own fixed-width menus clip long labels;
- DropdownMenuLabel throws outside a Group.

The cmdk-based Command family is the weaker half. `aria-activedescendant` is empty on open and stale after filtering, and results and "no match" are never announced. The palette also scores its uuid ids, so short queries barely narrow the list. The app uses CommandPalette as its global record search, against the palette's own docs, with fixed "Command palette" wording and no loading or error state. Fix the active descendant and add a live region first, then the id-free filter and a kit record-search pattern with loading and error states, then forced-colours rules for every floating-list row.

**Keep:** Base UI Menu roles, typeahead, Home/End, looping, focusable disabled items and cancellable change details; play tests for keyboard open, typeahead, the RTL submenu flip, LinkItem navigation and a nested menu in a dialog; menu width that fits its content, is at least the trigger's width and never exceeds the viewport, tested for one-line labels; long menus scroll in a Scroller with arrows only for a hovering pointer; one row look in menu.ts for DropdownMenu, Select, Command and Combobox; the CommandDialog short-viewport footer fix holds at 390×420; PaletteCommand keeps its identity by id; Kbd renders native `<kbd>`, nested for chords.

**MNU-1 · Menu and command row highlight is invisible in forced colours** (high)

[menu.ts:10-13](../../../packages/design-system/src/components/menu.ts#L10-L13), [command.tsx:134](../../../packages/design-system/src/components/command.tsx#L134), [forced-colors.css:1-75](../../../packages/design-system/src/styles/forced-colors.css#L1-L75)

The highlighted row is shown only by a background (`data-[highlighted]:bg-neutral-subtle-hovered`, and `data-[selected=true]:` in Command) on a row with `outline-none`. forced-colors.css has no rule for menu, select, combobox or command rows. In the DropdownMenu matrix with forced colours on and keyboard focus on Duplicate, no row is marked, and disabled Reassign looks the same as the enabled rows. A high-contrast user cannot see what Enter will activate in any Actions or Columns menu, Select, Combobox, the palette or the record picker (WCAG 2.4.7).

**Fix:**

- In forced-colors.css, give `[data-slot$="-item"][data-highlighted]`, `[data-slot=dropdown-menu-sub-trigger][data-popup-open]` and `[cmdk-item][data-selected=true]` the rule `forced-color-adjust: none; background: Highlight; color: HighlightText`, or a 2px Highlight outline.
- Show disabled rows in GrayText, and add a forced-colours specimen to the DropdownMenu and Command stories.

**MNU-3 · Command's `aria-activedescendant` is empty on open and stale after filtering** (high)

[command.tsx:38-56](../../../packages/design-system/src/components/command.tsx#L38-L56)

In the CommandPalette matrix, the input's `aria-activedescendant` is null on open while "Record an assessment" is selected. After typing "exp" it names an element that is no longer in the document, and after "go" it is null again. It only matches after an arrow key. Screen-reader users filtering in the palette, the app's search or RecordPicker hear no active option, or a stale one, and press Enter on a record they were never told about (WCAG 4.1.2).

**Fix:** In CommandInput, derive `aria-activedescendant` from the current selection (`useCommandState(s => s.value)`, resolved to the item's id after render) and override cmdk's attribute, or patch or upgrade cmdk. Add play assertions that it equals the id of the `[aria-selected=true]` option on open and after each keystroke.

**MNU-4 · Filter results and "no match" are never announced** (high)

[command.tsx:70-80](../../../packages/design-system/src/components/command.tsx#L70-L80), [:166-179](../../../packages/design-system/src/components/command.tsx#L166-L179), [command-palette.tsx:103](../../../packages/design-system/src/patterns/command-palette.tsx#L103)

CommandEmpty renders cmdk's Empty, which has `role="presentation"`, and CommandCount is a plain span. After typing "zzz" there is no live region anywhere in the palette. A screen-reader user hears nothing when nothing matches, and nothing when the list shrinks, and this is the app's global search (WCAG 4.1.3).

**Fix:** Give Command one polite, visually hidden and debounced live region that announces the count or the empty message through the locale (`formatPlural`), and have CommandCount and CommandEmpty feed it.

**MNU-2 · CommandPalette scores the command id, so short queries barely narrow** (medium)

[command-palette.tsx:87-90](../../../packages/design-system/src/patterns/command-palette.tsx#L87-L90)

Each item's `value` is its id, and cmdk scores the value and the keywords together. In the app the ids are `program-<uuid>`, `risk-<uuid>` and `finding-<uuid>` ([shell.tsx:122-141](../../../src/components/app/shell.tsx#L122-L141)). On /programs with 53 records, "a" returns 53, "de" 49 and "12" 32, and "TEST · TEST" matches "de" only through its uuid. Score sorting keeps the best hits on top, so the harm is a list that does not narrow and a count that tells the reader nothing.

**Fix:** Pass Command a `filter` that ignores the id: score the keywords only, or use `` `${label}\u0000${id}` `` as the value and strip the suffix before scoring. Keep identity unique for the RepeatedCommandIdentity story, and add a play test that a two-letter query does not match through an id.

**MNU-5 · The app's global search is a CommandPalette, which the palette's docs rule out** (medium)

[shell.tsx:122-141](../../../src/components/app/shell.tsx#L122-L141), [:147-159](../../../src/components/app/shell.tsx#L147-L159), [:238-243](../../../src/components/app/shell.tsx#L238-L243), [command-palette.tsx:65](../../../packages/design-system/src/patterns/command-palette.tsx#L65), [:79](../../../packages/design-system/src/patterns/command-palette.tsx#L79), [:81](../../../packages/design-system/src/patterns/command-palette.tsx#L81), [:103](../../../packages/design-system/src/patterns/command-palette.tsx#L103), [:105](../../../packages/design-system/src/patterns/command-palette.tsx#L105)

CommandPalette.mdx says the palette does not find records or search the product. Even so, the shell turns every program, risk and finding into a PaletteCommand behind "Search programs, risks, and findings". The part hard-codes the title and label "Command palette", the empty text "No commands match." and the footer verb "to run". Screen-reader users therefore land in a "Command palette" dialog, and rows show only a label, with no id or status. With no kit search pattern and a palette that cannot be relabelled, misusing the palette is the easiest route.

**Fix:**

- Add a kit record-search pattern (see Missing below) and move the shell onto it.
- In the meantime, let CommandPalette take its title and label, empty text and footer verb, with defaults from the locale.

**MNU-6 · With no loading or error state, the palette says "No commands match" while records load or fail** (medium)

[command-palette.tsx:31-38](../../../packages/design-system/src/patterns/command-palette.tsx#L31-L38), [:103](../../../packages/design-system/src/patterns/command-palette.tsx#L103), [command.tsx:69-105](../../../packages/design-system/src/components/command.tsx#L69-L105), [shell.tsx:244-250](../../../src/components/app/shell.tsx#L244-L250)

CommandPaletteProps has no loading or error prop, and cmdk's Empty shows whenever the filtered count is 0, so CommandLoading and CommandEmpty can show together. With the palette's queries aborted, it says "No commands match." on an empty query. Meanwhile the shell's `role="alert"` error renders outside the dialog, behind the backdrop, and pushes the whole shell down. The contract says a load in progress is never an empty state.

**Fix:** Suppress CommandEmpty while loading, add an error row with Retry, expose loading and error on CommandPalette and RecordPicker, and remove the shell's alert from outside the dialog.

**MNU-7 · A disabled destructive item keeps its danger colour** (medium)

[dropdown-menu.tsx:119-146](../../../packages/design-system/src/components/dropdown-menu.tsx#L119-L146), [menu.ts:22](../../../packages/design-system/src/components/menu.ts#L22)

`data-[variant=destructive]:text-danger` and `data-[disabled]:text-disabled` have the same specificity, and the danger rule is emitted later. A disabled Archive therefore keeps the enabled colour, while disabled Reassign fades to 18% alpha. The record browser's Delete, disabled while a delete runs ([record-browser.tsx:1023-1026](../../../src/components/app/record-browser.tsx#L1023-L1026)), looks as available as one that would run. DataTable row actions with tone danger and disabled share the code path ([data-table.tsx:582-586](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L582-L586)).

**Fix:** Scope the destructive text and highlight classes with `not-data-[disabled]:`, or emit the disabled rule after them. Add a disabled destructive item to the Actions matrix.

**MNU-8 · Long menu labels are cut mid-word, and the kit's own menus fix narrow widths** (medium)

[dropdown-menu.tsx:54-58](../../../packages/design-system/src/components/dropdown-menu.tsx#L54-L58), [:119-124](../../../packages/design-system/src/components/dropdown-menu.tsx#L119-L124), [menu.ts:8-10](../../../packages/design-system/src/components/menu.ts#L8-L10), [data-table.tsx:580](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L580), [columns-menu.tsx:78](../../../packages/design-system/src/patterns/data-table/columns-menu.tsx#L78), [:126](../../../packages/design-system/src/patterns/data-table/columns-menu.tsx#L126), [:180](../../../packages/design-system/src/patterns/data-table/columns-menu.tsx#L180), [filter.tsx:407](../../../packages/design-system/src/patterns/data-table/filter.tsx#L407), [frame.tsx:390](../../../packages/design-system/src/patterns/chart/frame.tsx#L390)

Items are `whitespace-nowrap`, the popup is capped at the available width, and the Scroller viewport hides horizontal overflow. In ActionLabelWidths at 320px, a longer label is cut at "…from the organizatio" with no ellipsis. The kit's row-actions, Columns, Settings, filter and chart menus set fixed widths of 200 to 240px, which leaves about 160px for a label. The comment at menu.ts:8 says rows "grow for wrapped labels", which the item classes prevent.

**Fix:**

- Replace the fixed `width` in the kit's menus with `minWidth`, so labels size the menu as the contract says.
- When a label still exceeds the available width, truncate it with an ellipsis (a `min-w-0 truncate` label span plus a title or tooltip). Fix the menu.ts comment and add a 320px long-label play test. Switching to wrapping would be a contract decision.

**MNU-9 · The program Actions menu uses action items for nine page destinations** (medium)

[program-workspace.tsx:188-214](../../../src/components/prototype/program-workspace.tsx#L188-L214)

"Configuration baseline", "Traceability matrix", "Program dashboard" and six more are `DropdownMenuItem onClick={() => navigate(...)}`. They render as `div role=menuitem` with no href, in one flat list after Edit program, and a stray `{" "}` text node sits at line 191. Readers cannot open a view in a new tab or copy its link, and screen readers announce the destinations as actions. Three other menus use `DropdownMenuItem render={<Link/>}` ([program-record.tsx:129](../../../src/components/prototype/program-record.tsx#L129), [work-common.tsx:242](../../../src/components/prototype/work-common.tsx#L242), [schema-shell.tsx:58](../../../src/components/app/schema-shell.tsx#L58)). That works, but it departs from the documented LinkItem.

**Fix:** Use DropdownMenuLinkItem with a router Link for the nine views, in a labelled Views group after a separator, and keep Edit program first. Switch the three `render={<Link/>}` items to LinkItem.

**MNU-10 · Menu triggers are inconsistent** (medium)

[program-workspace.tsx:189](../../../src/components/prototype/program-workspace.tsx#L189), [work-common.tsx:235](../../../src/components/prototype/work-common.tsx#L235), [program-record.tsx:126](../../../src/components/prototype/program-record.tsx#L126), [library-products.tsx:328](../../../src/components/prototype/library-products.tsx#L328), [library-components.tsx:300](../../../src/components/prototype/library-components.tsx#L300), [library-requirements.tsx:351](../../../src/components/prototype/library-requirements.tsx#L351), [tasks.$taskId.tsx:133](../../../src/routes/tasks.$taskId.tsx#L133), [record-browser.tsx:1017](../../../src/components/app/record-browser.tsx#L1017), [program-systems-tree.tsx:344-349](../../../src/components/prototype/program-systems-tree.tsx#L344-L349), [assessment-campaign.tsx:1043-1048](../../../src/components/prototype/assessment-campaign.tsx#L1043-L1048)

Two record headers give Actions a trailing ChevronDown and six do not. "Create system" and "Create observation" look like direct create primaries but open menus. DropdownMenuTrigger adds no menu-button affordance and the MDX example shows none, so readers cannot predict whether Create system creates a system or asks how.

**Fix:**

- Write the rule in DropdownMenu.mdx and under Record pages in product-patterns.md: a labelled menu trigger carries a trailing ChevronDown, and a primary that opens a choice says so.
- Give DropdownMenuTrigger a default Button-with-chevron rendering when `render` is omitted, or add a small MenuButton part, without injecting anything into arbitrary children. Sweep the eight triggers and update ActionLabelWidths.

**MNU-11 · Kbd's `label` is an `aria-label` on a generic `<kbd>`, so screen readers read the glyph** (medium)

[kbd.tsx:14-24](../../../packages/design-system/src/components/kbd.tsx#L14-L24), [command-keys.tsx:11-16](../../../packages/design-system/src/lib/command-keys.tsx#L11-L16)

ARIA 1.2 prohibits naming an element with the generic role, and the text read in reading order keeps the glyph. The Kbd story sentence reads "Press ⌘ K to search.", and the palette footer reads "↑ ↓ to move ↵ to run". Screen-reader users hear "place of interest sign K" instead of "Command K", so the `label` prop does not do what it promises.

**Fix:** Inside the `<kbd>`, render the glyph `aria-hidden` next to a visually hidden name. Keep `label` as the API, and add a play assertion on the text alternative.

**MNU-12 · useCommandPalette's shortcut toggles on key repeat and ⌘⇧K, and opens over other dialogs** (medium)

[command-palette.tsx:41-54](../../../packages/design-system/src/patterns/command-palette.tsx#L41-L54)

The listener fires on `(metaKey || ctrlKey) && key === 'k'` and does not check for repeat, other modifiers, `defaultPrevented`, composition or an open dialog. One ⌘K plus two repeats left the palette open, and a following ⌘⇧K closed it. Pressed inside a dirty Create dialog, it stacks a second modal that offers navigation away from the draft, and on macOS it takes Ctrl+K away from text fields. Shell's own shortcut already skips when a dialog is open ([root.tsx:204-207](../../../packages/design-system/src/layout/shell/root.tsx#L204-L207)).

**Fix:** Ignore repeat, other modifiers, `defaultPrevented` and composition events. Use `metaKey` on Apple platforms and `ctrlKey` elsewhere. Skip when another dialog is open, and register one listener per page through context.

**MNU-13 · The Command family hard-codes English** (medium)

[command.tsx:53](../../../packages/design-system/src/components/command.tsx#L53), [:166-179](../../../packages/design-system/src/components/command.tsx#L166-L179), [:191-192](../../../packages/design-system/src/components/command.tsx#L191-L192), [command-palette.tsx:65](../../../packages/design-system/src/patterns/command-palette.tsx#L65), [:79](../../../packages/design-system/src/patterns/command-palette.tsx#L79), [:81](../../../packages/design-system/src/patterns/command-palette.tsx#L81), [:103](../../../packages/design-system/src/patterns/command-palette.tsx#L103), [command-keys.tsx:6](../../../packages/design-system/src/lib/command-keys.tsx#L6), [:13](../../../packages/design-system/src/lib/command-keys.tsx#L13), [:24](../../../packages/design-system/src/lib/command-keys.tsx#L24)

These strings bypass `t()`:

- the dialog title and description;
- CommandCount's "match"/"matches" ternary;
- the palette placeholder and "No commands match.";
- the footer's "to move", "to choose", "to run" and "to close";
- cmdk's default list label, "Suggestions".

The hints also disagree on `esc` and `Esc`. A localised product gets mixed-language dialogs and wrong plurals, and a record search is announced as "Suggestions".

**Fix:** Move every string to [locale-format.ts](../../../packages/design-system/src/lib/locale-format.ts): the palette title and description, the no-commands text, a `formatPlural` match count, the four key verbs and the list label. Pass `label` to CommandList, and use one Escape glyph.

**MNU-14 · Disabled menu items cannot say why** (medium)

[menu.ts:22](../../../packages/design-system/src/components/menu.ts#L22), [library-products.tsx:337-349](../../../src/components/prototype/library-products.tsx#L337-L349), [library-components.tsx:312-317](../../../src/components/prototype/library-components.tsx#L312-L317)

`data-[disabled]:pointer-events-none` blocks hover, so no Tooltip can explain a disabled item, and items have no description slot. "Publish version" is disabled when the version has no content or no active configuration, and nothing tells the reader which prerequisite is missing. The contract asks for missing prerequisites to stay visible.

**Fix:** Add an item description line for a short reason ("Add content to publish"). Keep pointer events on disabled items, since Base UI already blocks activation. Document "disabled with a reason" in the MDX.

| Id     | Finding                                                                                                                                                                                                                                                                                                | Where                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Fix                                                                                                                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MNU-15 | Shortcut parts are plain spans inside the item, so items are named "Edit E" and "Export the SSP ⇧E". The palette renders its own span instead of CommandShortcut, and leaves it empty when there is no hint.                                                                                                                         | [dropdown-menu.tsx:295-304](../../../packages/design-system/src/components/dropdown-menu.tsx#L295-L304), [command.tsx:225-234](../../../packages/design-system/src/components/command.tsx#L225-L234), [command-palette.tsx:97](../../../packages/design-system/src/patterns/command-palette.tsx#L97)                                                                                                                                                                              | Make the Shortcut parts `aria-hidden`, add a `shortcut` prop that sets `aria-keyshortcuts`, and use CommandShortcut in the palette.                                                                                                           |
| MNU-16 | In a menu that mixes toggles and actions, an unchecked checkbox item looks like a plain action: unchecked "Owner" matches "Reset view". Radio items use the same check glyph.                                                                                                                                                | [dropdown-menu.tsx:221-282](../../../packages/design-system/src/components/dropdown-menu.tsx#L221-L282), [columns-menu.tsx:80-89](../../../packages/design-system/src/patterns/data-table/columns-menu.tsx#L80-L89)                                                                                                                                                                                                                                                              | Document that checkable and radio items go in their own labelled Group, separated from actions. Optionally give RadioItem a dot indicator.                                                                                              |
| MNU-17 | DropdownMenuLabel wraps `Menu.GroupLabel`, which throws "MenuGroupContext is missing" outside a Group, so a heading at the top of a menu takes down the route.                                                                                                                                              | [dropdown-menu.tsx:105-117](../../../packages/design-system/src/components/dropdown-menu.tsx#L105-L117)                                                                                                                                                                                                                                                                                                                                                                     | Outside a group, fall back to a presentational label (or wrap it in a Group), warn in development, and say so in the MDX.                                                                                                                  |
| MNU-19 | The shell keeps its own search state and never calls useCommandPalette, so Ctrl+K does nothing on /programs. The search button shows no shortcut, and the Help and shortcuts dialog lists no shortcuts.                                                                                                                        | [shell.tsx:109](../../../src/components/app/shell.tsx#L109), [:147-159](../../../src/components/app/shell.tsx#L147-L159), [:251-273](../../../src/components/app/shell.tsx#L251-L273)                                                                                                                                                                                                                                                                                             | After MNU-12, bind the search through the kit hook, show a Kbd hint on the search button at md and up, and list ⌘K and Ctrl+[ in the Help dialog.                                                                                         |
| MNU-20 | The docs have drifted from the code. DropdownMenu.mdx's example sets `width: 200`, against its own rule that menus fit their contents, and it mentions a "Radix dialog". Kbd.mdx points to a `trailing` slot that has been removed. The CommandPalette Style table names tokens the code does not use. command.tsx:20 calls Command the search behind Combobox, which does not use it. DropdownMenu.mdx has no when-to-use or content section, as the mixed program menu (MNU-9) and the wizard's unmarked Remove ([elements.tsx:259-268](../../../src/components/app/program-wizard/elements.tsx#L259-L268)) show. | [DropdownMenu.mdx:13](../../../packages/design-system/src/stories/components/DropdownMenu.mdx#L13), [:55](../../../packages/design-system/src/stories/components/DropdownMenu.mdx#L55), [Kbd.mdx:65](../../../packages/design-system/src/stories/components/Kbd.mdx#L65), [CommandPalette.mdx:64-65](../../../packages/design-system/src/stories/patterns/CommandPalette.mdx#L64-L65), [command.tsx:20](../../../packages/design-system/src/components/command.tsx#L20) | Make the examples and Style tables match the code, remove the stale references, and add When to use and Content sections modelled on Atlassian's DropdownMenu guidance.                                                                     |

**Missing in this family:**

- SearchDialog, a global record search: the top nav needs a search across record types, with id, type and status on each row, loading and error states, and a title. CommandPalette.mdx says the palette must not be that search (MNU-5; responsive-2026-09-24 #7). High.
- Loading and error states on Command and CommandPalette: records load asynchronously, and without these states the list shows its empty sentence during loads and failures (MNU-6). High.
- Live result announcement in Command: adding it once in Command covers the palette, RecordPicker and a future search (MNU-4, WCAG 4.1.3). High.
- DropdownMenuItem description line: explains disabled prerequisites and tells similar actions apart without clipping (MNU-14). Medium.
- Menu-button trigger affordance (a chevron): a kit default removes the per-screen decision for eight Actions menus and two create menus (MNU-10). Medium.
- Platform modifier helper (`useModifierKey` or `Kbd.Mod`): today the palette and future shortcut hints each choose ⌘ or Ctrl on their own (MNU-18). Low.

**Already tracked:**

- MNU-18, platform modifier glyphs are chosen by each caller: [docs/next.md](../../next.md) "⌘ or Ctrl" (2026-09-04). Shell's Ctrl [ is correct everywhere. Scope the helper to chords that follow the platform modifier: palette hints and the useCommandPalette binding (MNU-12).

## Tabs, Collapsible, Accordion

The Tabs engine is sound. It has Base UI roving focus, manual activation by default, RTL, vertical strips, and one measured indicator with reduced-motion and forced-colours fallbacks. Its most visible defect is the line-tab focus ring: the ScrollArea viewport clips it to two vertical bars on every product strip (DSC-1), so fix it first. The disclosure half ships no styled trigger and no heading level. As a result the prototype hand-rolls Details sections with a chevron that never turns, and records whose body has no h2 before the rail skip from h1 to h3. In the prototype, no tab panel uses `keepMounted`, so register search is lost on every tab switch. Three strips render no tabpanel, and two Details disclosures open below a fill table, where nobody sees them.

**Keep:** Base UI tablist semantics with manual activation, Home/End, looping, focusable disabled tabs and cancellable `onValueChange`; direction and orientation passed to Base UI, so arrow keys follow RTL and Up/Down; one measured indicator with reduced-motion and forced-colours treatments; a line strip that stays on one row, scrolls with Scroller arrows and keeps the selected tab in view as it narrows; a reused panel that replays its entrance without losing refs or scroll position; play tests that sample motion frames and cover link tabs, refs and `keepMounted`; type tests that pin the migration surface; product-line-tabs lint that handles prop spreads and aliased imports; Collapsible forwards `hiddenUntilFound`, `keepMounted` and a cancellable `onOpenChange`; the Collapsible.Group lint entry warns without an unsafe autofix.

**DSC-1 · The line-tab focus ring is clipped to two vertical bars on every product strip** (high)

[tabs.tsx:112](../../../packages/design-system/src/components/tabs.tsx#L112), [:70-100](../../../packages/design-system/src/components/tabs.tsx#L70-L100), [utilities.css:986-989](../../../packages/design-system/src/generated/utilities.css#L986-L989)

`outline-focused` draws a 2px outline at a 2px offset, so the ring extends 4px outside the tab. Horizontal line tabs sit in a ScrollArea viewport that scrolls on both axes and is exactly as tall as the list (33px), so the top and bottom of the ring are cut off, and the first tab loses its left side too. On the WS-X90 program, at 1440px and at 390px, a focused "System 28" shows only a bar on either side, which looks like a pair of separators, and in the preview like the scroller hairline (WCAG 2.4.7).

**Fix:** Draw the line-tab ring inside the box: a negative `outline-offset` equal to the ring width, or an inset shadow token, scoped with `group-data-[variant=line]/tabs-list`. Alternatively, pad the viewport's block axis by the ring's extent. Add a play assertion that the focused tab's outline box lies within the viewport's clip rect.

**DSC-2 · The kit has no styled disclosure trigger, so Details sections are hand-rolled with a chevron that never turns** (high)

[collapsible.tsx:10-21](../../../packages/design-system/src/components/collapsible.tsx#L10-L21), [inspector.tsx:74-80](../../../packages/design-system/src/patterns/inspector.tsx#L74-L80), [ssp-assembly.tsx:606-608](../../../src/components/prototype/ssp-assembly.tsx#L606-L608), [system-baseline.tsx:504-506](../../../src/components/prototype/system-baseline.tsx#L504-L506), [editor.tsx:203-209](../../../src/components/app/profile-tailoring/editor.tsx#L203-L209), [:241-247](../../../src/components/app/profile-tailoring/editor.tsx#L241-L247), [:231-232](../../../src/components/app/profile-tailoring/editor.tsx#L231-L232), [profiles.$profileId.tsx:435-441](../../../src/routes/profiles.$profileId.tsx#L435-L441), [record-browser.tsx:836-838](../../../src/components/app/record-browser.tsx#L836-L838)

CollapsibleTrigger adds only a focus outline and a disabled colour, so without `render` it looks like plain body text, with no chevron and no hover. Five product disclosures therefore render a subtle small Button with a ChevronDown that still points down when the section is open. The only open cue is Button's `aria-expanded` pressed tint ([button.tsx:41](../../../packages/design-system/src/components/button.tsx#L41)), so "Baseline details" looks like a latched button. Two more disclosures use native `<details>` with the browser's marker. Inspector.Group re-implements an h3, a trigger and a rotating chevron inline, and Item has its own chevron ([item.tsx:140](../../../packages/design-system/src/components/item.tsx#L140)).

**Fix:**

- Add a disclosure header part: CollapsibleHeader, or a `variant` on CollapsibleTrigger. It comes in two forms: `section`, a title with a trailing chevron as in Inspector.Group, and `button`, a subtle Button whose chevron rotates on `data-panel-open`. Give it a `headingLevel`.
- Make Inspector.Group, AccordionTrigger and Item compose it. Migrate the five Button triggers and both `<details>` blocks, and lint native `<details>` in product files.

**DSC-3 · Disclosure headings are fixed at h3 or absent, so some records skip from h1 to h3** (medium)

[accordion.tsx:33](../../../packages/design-system/src/components/accordion.tsx#L33), [inspector.tsx:74](../../../packages/design-system/src/patterns/inspector.tsx#L74), [CHANGELOG.md:410](../../../packages/design-system/CHANGELOG.md#L410)

AccordionTrigger wraps its own Header and exposes no level, so it is always an h3. CollapsibleTrigger has no heading, and Inspector.Group hard-codes `<h3>`. 0.5.0 shipped `headingLevel` on Collapsible and Accordion, and the current parts dropped it with no changelog entry. On the system record, the H1 "WS-X90 Sentinel Mission System" is followed directly by the H3 "Details". Screen-reader users browsing by heading meet the same skipped level on any record whose body has no h2 before the rail.

**Fix:** Restore `headingLevel` (2 to 6) on AccordionTrigger, Inspector.Group and the new disclosure header (DSC-2). Document the level a rail group takes: h2 on a page, h3 under a preview's h2 title.

**DSC-4 · Register tabs lose their search and filters on every tab switch** (medium)

[program-workspace.tsx:228-241](../../../src/components/prototype/program-workspace.tsx#L228-L241), [program-record.tsx:304-309](../../../src/components/prototype/program-record.tsx#L304-L309), [program-systems-tree.tsx:97-100](../../../src/components/prototype/program-systems-tree.tsx#L97-L100), [requirement-record.tsx:150-151](../../../src/components/prototype/requirement-record.tsx#L150-L151), [library-controls.tsx:309](../../../src/components/prototype/library-controls.tsx#L309), [component-library.md:156](../component-library.md#L156)

Nine strips reuse one TabsContent and switch its children with `tab === "X" &&`. Three render a panel per value. None uses `keepMounted`, so the previous tab's subtree unmounts. On the WS-X90 program, "AC-2" typed in the Requirements search was gone after a round trip through Overview, and the URL held only `?tab=Requirements`. This breaks component-library.md's rule that tabs use separate `keepMounted` panels, and the contract's promise that retained panel state survives selection.

**Fix:** Give register and draft tabs a TabsContent per value with `keepMounted`, or lift DataTable search and filter state into the route. Add a test:patterns check that types a search, switches tabs and comes back.

**DSC-5 · Three tab strips have no tabpanel** (medium)

[findings-views.tsx:47-55](../../../src/components/prototype/findings-views.tsx#L47-L55), [assurance-views.tsx:193-204](../../../src/components/prototype/assurance-views.tsx#L193-L204), [:407-415](../../../src/components/prototype/assurance-views.tsx#L407-L415)

/findings, /register and the risk record close `</Tabs>` right after `</TabsList>` and render the register as a sibling. Live, /findings and /register each have four tabs with `aria-controls` null and no `role=tabpanel`. Screen-reader users hear "tab, 1 of 4" with no panel to move to, and these screens skip the panel entrance and spacing that other strips get. product-line-tabs checks only the variant and layout classes.

**Fix:** Wrap each register in TabsContent inside the Tabs root. Extend product-line-tabs, or add a composition rule, to fail a Tabs root that holds a TabsList and no TabsContent.

**DSC-6 · Details disclosures below fill registers open off-screen** (medium)

[system-baseline.tsx:498-509](../../../src/components/prototype/system-baseline.tsx#L498-L509), [ssp-assembly.tsx:604-611](../../../src/components/prototype/ssp-assembly.tsx#L604-L611)

"Baseline details" and "SSP details" come right after a DataTable with `fill`, which sizes itself to the window. In the system preview at 1440×900, opening "Baseline details" put its content between 884px and 1024px in a 900px viewport. The only visible change was the button's pressed tint, so readers think nothing happened.

**Fix:**

- Put register provenance where it stays visible when opened: the record's Overview properties or its Inspector, or a leading Details disclosure above the toolbar. Otherwise, a tab that ends with a section does not use `fill`.
- Add the rule "nothing expandable follows a fill table" to product-patterns.md.

**DSC-7 · The default (filled) TabsList overflows its container and hides its first tab** (medium)

[tabs.tsx:40](../../../packages/design-system/src/components/tabs.tsx#L40), [:68](../../../packages/design-system/src/components/tabs.tsx#L68), [:112](../../../packages/design-system/src/components/tabs.tsx#L112)

Only the horizontal line strip goes through the Scroller. The default list is `inline-flex w-fit max-w-full justify-center`, and its triggers are `shrink-0 whitespace-nowrap`. At 200px the list stayed 200px wide while its centred tabs spilled to x=250, so the first label read "verview" past the container's start, with no scroll or wrap. This app forces line tabs, but other products that use the documented default meet this in any narrow panel.

**Fix:** Route the default horizontal variant through the same Scroller and ScrollArea, with `justify-start` when it overflows, or let triggers shrink and truncate. Add a narrow filled strip to ResponsiveWidths.

**DSC-8 · Accordion drops a state-function `className`, and AccordionContent styles the wrong element** (medium)

[accordion.tsx:15](../../../packages/design-system/src/components/accordion.tsx#L15), [:25](../../../packages/design-system/src/components/accordion.tsx#L25), [:36-39](../../../packages/design-system/src/components/accordion.tsx#L36-L39), [:57-60](../../../packages/design-system/src/components/accordion.tsx#L57-L60), [base-ui.ts:3-11](../../../packages/design-system/src/lib/base-ui.ts#L3-L11)

The four Accordion parts use `cn(base, className)`, where Tabs and Collapsible use `classes()`, so a `className={(state) => …}`, which Base UI's types accept, is silently discarded. AccordionContent sends `className` to an inner `pb-200` div, not to the Panel that carries `data-open` and the height variable, and AccordionTrigger hides its Header and chevron. For now this is a latent trap and an inconsistency with Collapsible. Its only current effect is a doubled bottom padding in InspectorRoot, which appears only in the Shell story.

**Fix:** Switch all four parts to `classes()`, and send AccordionContent's `className` to the Panel. Expose Header props or `render`, and an icon slot, on AccordionTrigger. Add a types test that a function `className` compiles and applies.

| Id     | Finding                                                                                                                                                                                                                                                                                                                                                  | Where                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Fix                                                                                                                                                                                                                                                                                                                          |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DSC-9  | Tab history and activation differ from screen to screen. The program workspace pushes a history entry per tab while the campaign record replaces it. Catalog, campaign and the assessment browser activate on focus, and Catalog's tab change closes the open control preview.                                                                                                                            | [program-workspace.tsx:139-141](../../../src/components/prototype/program-workspace.tsx#L139-L141), [campaigns.$campaignId.tsx:126-131](../../../src/routes/campaigns.$campaignId.tsx#L126-L131), [catalog.tsx:113-119](../../../src/routes/catalog.tsx#L113-L119), [assessment-campaign.tsx:134](../../../src/components/prototype/assessment-campaign.tsx#L134), [assessment-browser.tsx:135](../../../src/components/prototype/assessment-browser.tsx#L135)                                                                                                                                                                                                                                                                                                   | Follow [component-library.md:156](../component-library.md#L156): route-synced record tabs push history and use manual activation. The campaign drops `activateOnFocus` and `replace`, and the catalog moves its tab into the route. A `useRouteTab` hook would be optional app code.                                                                                               |
| DSC-10 | Four screens set `className="contents"` on Tabs or TabsContent, which stops the panel entrance. The gap between strip and content ranges from 16px to 28px.                                                                                                                                                                                                                                       | [catalog.tsx:117](../../../src/routes/catalog.tsx#L117), [:127](../../../src/routes/catalog.tsx#L127), [library-products.tsx:530](../../../src/components/prototype/library-products.tsx#L530), [:543](../../../src/components/prototype/library-products.tsx#L543), [library-components.tsx:618](../../../src/components/prototype/library-components.tsx#L618), [:640](../../../src/components/prototype/library-components.tsx#L640), [profiles.$profileId.tsx:235](../../../src/routes/profiles.$profileId.tsx#L235), [program-workspace.tsx:219](../../../src/components/prototype/program-workspace.tsx#L219), [:229](../../../src/components/prototype/program-workspace.tsx#L229) | The kit owns the gap between strip and panel, through a Tabs gap or TabsContent padding. Remove the `contents` overrides. product-line-tabs could reject display and gap overrides on Tabs and TabsContent.                                                                                                                                  |
| DSC-11 | A CollapsibleContent inside an open AccordionPanel inherits `--accordion-panel-height: auto`, so it snaps open or shut instead of easing.                                                                                                                                                                                                                         | [motion.css:73-91](../../../packages/design-system/src/styles/motion.css#L73-L91), [collapsible.tsx:28](../../../packages/design-system/src/components/collapsible.tsx#L28)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Animate one part-local `--ds-collapse-height`, set on each Content part, or reset `--accordion-panel-height` on the collapsible content. Add a nested-motion sample to the Collapsible story.                                                                                                                                              |
| DSC-12 | TabsList's `onFocusCapture` reveals the focused tab with its own maths before the Scroller's `revealFocus` runs, so the Scroller's fixes (RTL, scroll padding, items larger than the viewport) never reach tab strips.                                                                                                                                                         | [tabs.tsx:78-92](../../../packages/design-system/src/components/tabs.tsx#L78-L92), [scroller.tsx:176-214](../../../packages/design-system/src/components/scroller.tsx#L176-L214), [:254](../../../packages/design-system/src/components/scroller.tsx#L254)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Delete the Tabs handler and rely on the Scroller. Keep the story assertions that End and Home reveal the last and first tabs.                                                                                                                                                                                                       |
| DSC-13 | Counts in tab and disclosure labels are plain text on some screens ("Controls · {n}") and a `<Count>` on others, capped at 999, 9999 or 99999, even within one record.                                                                                                                                                                                                  | [editor.tsx:207](../../../src/components/app/profile-tailoring/editor.tsx#L207), [:245](../../../src/components/app/profile-tailoring/editor.tsx#L245), [:254-255](../../../src/components/app/profile-tailoring/editor.tsx#L254-L255), [profiles.$profileId.tsx:438](../../../src/routes/profiles.$profileId.tsx#L438), [library-products.tsx:535-538](../../../src/components/prototype/library-products.tsx#L535-L538), [program-workspace.tsx:224](../../../src/components/prototype/program-workspace.tsx#L224), [catalog.tsx:123](../../../src/routes/catalog.tsx#L123)                                                                                                                                                                                     | Always use a Count with one cap per product, written in Tabs.mdx and product-patterns.md. A visually hidden unit ("1196 controls") is optional polish.                                                                                                                                                                    |
| DSC-14 | The Unreleased CHANGELOG says the Legacy disclosure adapters are removed (line 117), and also that they stay deprecated through the next minor release (lines 175-176). Collapsible.Group and `headingLevel` from 0.5.0 went away with no alias and no entry. Collapsible.mdx says Section uses Base UI disclosure, which it does not.                                                                           | [CHANGELOG.md:117](../../../packages/design-system/CHANGELOG.md#L117), [:175-176](../../../packages/design-system/CHANGELOG.md#L175-L176), [:221-228](../../../packages/design-system/CHANGELOG.md#L221-L228), [:410](../../../packages/design-system/CHANGELOG.md#L410), [eslint-plugin/index.js:310-321](../../../packages/design-system/eslint-plugin/index.js#L310-L321), [disclosure-migration.md](../disclosure-migration.md), [Collapsible.mdx:33](../../../packages/design-system/src/stories/components/Collapsible.mdx#L33)                                                                                                                                                                                                         | Write one breaking entry that lists the removals: Collapsible.Group, title/count, `headingLevel` and the Legacy adapters. Restore a thin deprecated Collapsible.Group alias for one version, or state the exception. Correct the "explicit Header" claim at line 175, or export AccordionHeader. Fix Collapsible.mdx:33. |
| DSC-16 | The hover tints on AccordionTrigger and Inspector.Group start at the first glyph because they have no inline padding, a regression from 0.5.0's `space.100` bleed. Line tabs have 4px of padding and a 24px gap, so a click between two labels hits nothing.                                                                                                                             | [accordion.tsx:37](../../../packages/design-system/src/components/accordion.tsx#L37), [inspector.tsx:75](../../../packages/design-system/src/patterns/inspector.tsx#L75), [tabs.tsx:45](../../../packages/design-system/src/components/tabs.tsx#L45), [:112](../../../packages/design-system/src/components/tabs.tsx#L112)                                                                                                                                                                                                                                                                                                                                                                                                                                     | Restore the `space.100` bleed with Bleed, or with inline padding plus a negative inline offset. Move the line-tab gap into the triggers' padding.                                                                                                                                                                                  |

**Missing in this family:**

- Disclosure header, in section and button forms: one trigger for Details sections and rail groups, with a chevron that rotates with `aria-expanded`, hover and focus treatment, and a heading level. It replaces five hand-rolled Button triggers, two native `<details>` blocks and Inspector.Group's inline copy (DSC-2). High.
- `headingLevel` on AccordionTrigger, the disclosure header and Inspector.Group: records jump from h1 to h3, and the prop existed in 0.5.0 ([CHANGELOG.md:410](../../../packages/design-system/CHANGELOG.md#L410)) before it was lost (DSC-3). Medium.

**Already tracked:**

- DSC-15, the Tabs, Collapsible and Accordion docs lack a tab-count limit, when-not-to-use guidance, Details and heading-level guidance and props tables, and the Accordion stories put `aria-label` on a root with no role: [docs/next.md](../../next.md) "The program record's twelve tabs" and "Part props tables render nothing".
