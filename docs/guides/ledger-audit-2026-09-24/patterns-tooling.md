# Family deep dive: editing, record and selection patterns, previews and tooling

Part of the [Ledger audit, 24 September 2026](README.md).

Five groups: editing (EDT), record display (REC), selection (PIK), previews (PRV), and tooling and the shared lib (TOO). Five problems cross the groups and are cheapest fixed once:

- Focus lands on `<body>` or on a container after a save, a send, a close or a step: EDT-10, EDT-12, PIK-6, PIK-8, PRV-3, PRV-4, PRV-7.
- Names come from the wrong field: raw ids stand in for them, visibly or in the accessible name (EDT-4, PIK-1, PIK-2, PIK-14), or the id that tells rows apart is left out (REC-11).
- The kit has no pending or failed-save state for these patterns, so screens build their own: EDT-2, EDT-10, PIK-3, PIK-5, PIK-7.
- State styling still keys off Radix attributes, or has no forced-colours rule: REC-4, REC-9, EDT-15, TOO-7.
- Pattern strings bypass the locale: EDT-19, REC-20, PIK-17.

## Editable and Composer

Editable's save engine is solid: one save at a time, safe against races and unmount, IME-aware and well tested. The API around it is thin: a refused save throws the draft away (EDT-2), and with no editing callbacks, no `{value, label}` options and no temporary lock, the requirement form, its only consumer, snoops DOM events, maps labels back to ids and disables a whole fieldset, so focus drops on every save. Escape also leaks to enclosing overlays, and touch readers cannot cancel an edit. Composer is well built but unused, its docs cite app parts that do not exist, its suggestions are silent to screen readers, and focus drops after Send.

**Keep:** serialized, race-safe optimistic commit (operation counter, unmount guard, external updates kept on rollback, covered by the SerializedSave play test); IME composition guarded in Editable.Text, Composer and DataTable's Enter-moves-down; `label` required and read before the value, save states announced in a status region, Spinner named Saving; Editable.Select composes the kit Select and Combobox, so it gets native combobox semantics and a searchable popup past eight options; Composer leaves serialization and suggestion identity to the caller, ignores stale suggestions, keeps a newer controlled draft after submit and the draft on rejection, and is read-only while pending; Composer's Escape closes suggestions without dismissing a containing overlay; strong Don't stories and content rules.

**EDT-2 · A failed save throws away the reader's draft, with no retry** (medium)

[editable.tsx:111-124](../../../packages/design-system/src/patterns/editable.tsx#L111-L124), [columns.tsx:178-186](../../../packages/design-system/src/patterns/data-table/columns.tsx#L178-L186), [requirement-form.tsx:150-159](../../../src/components/prototype/requirement-form.tsx#L150-L159), [:277-303](../../../src/components/prototype/requirement-form.tsx#L277-L303)

On rejection the hook restores the previous value and closes into the Failed state. In the Failing story, keyboard only, a long owner string was gone after the refusal: no input held it, and reopening showed the old value with the reason cleared. Revision concurrency makes refusals routine; DataTable's editable text column has no recovery, and requirement-form rebuilt one by hand ("Unsaved change" with Retry and Discard), which shows the error twice.

**Fix:** keep rolling back the committed value, but hold the rejected draft: reopen the editor with the draft and the error, or offer Retry and Discard in the message row ([product-patterns.md](../product-patterns.md) Forms: "a failed save keeps the draft and allows a retry"). Cover it in the Failing and DataTable Editing stories, then delete requirement-form's parallel panel.

**EDT-10 · The requirement form disables every field around a save, so focus drops to `<body>`** (medium)

[requirement-form.tsx:198-204](../../../src/components/prototype/requirement-form.tsx#L198-L204), [requirement-record.tsx:155](../../../src/components/prototype/requirement-record.tsx#L155)

`<fieldset key={generation} disabled={busy || !!pending}>` disables every Editable while a save runs and until Retry or Discard, and the form also remounts by key after a successful save. Live at 1440px, `document.activeElement` was BODY during the save, after the failure and after Discard change; the disabled Selects turn into grey form fields, and a click on a second field is swallowed.

**Fix:** stop disabling the fieldset and stop remounting on save. Use the kit's per-row pending state plus a consumer-controlled lock with a reason (see Missing) for the one-change-at-a-time rule, and return focus to the row that saved.

**EDT-3 · No editing or draft callbacks, so the prototype listens to the kit's DOM events** (medium)

[editable.tsx:32-43](../../../packages/design-system/src/patterns/editable.tsx#L32-L43), [:169-174](../../../packages/design-system/src/patterns/editable.tsx#L169-L174), [requirement-form.tsx:171-183](../../../src/components/prototype/requirement-form.tsx#L171-L183), [:100-110](../../../src/components/prototype/requirement-form.tsx#L100-L110)

Editable exposes only `value`, `onChange`, `validate` and `save`. To feed `useBlocker` and `beforeunload`, RequirementForm wraps each Editable.Text in a div that reads `event.target` as an input and guesses in `onKeyDownCapture` that Escape cancelled. A change to Editable's internals would silently break draft protection, and DataTable's editable columns cannot protect drafts at all.

**Fix:** add `onEditingChange(editing)`, `onDraftChange(draft)` or `onDirtyChange(dirty)`, and `onCancel`, and forward them from DataTable's EditableOptions.

**EDT-4 · Editable.Select options are plain strings, so the owner picker shows UUIDs** (medium)

[editable.tsx:271-278](../../../packages/design-system/src/patterns/editable.tsx#L271-L278), [:357-376](../../../packages/design-system/src/patterns/editable.tsx#L357-L376), [requirement-form.tsx:67-79](../../../src/components/prototype/requirement-form.tsx#L67-L79), [:215-262](../../../src/components/prototype/requirement-form.tsx#L215-L262)

`options: readonly T[]` is both value and label, so the owner select passes names and maps them back to party ids. Two parties with the same name appear as "name · uuid", and an "Unassigned" sentinel stands in for no owner, which forces a real party named Unassigned into disambiguation. The kit's own Select already takes `{value, label}` items.

**Fix:** accept `options: readonly { value: T; label: string }[]` (or `itemToLabel`), search and announce by label, commit by value, and add an explicit none option (`emptyLabel` or `clearable`). DataTable's status `editable.options` takes the same shape.

**EDT-1 · Focus ring, hover tint and editing field are clipped inside a default KeyValue** (medium)

[editable.tsx:164-167](../../../packages/design-system/src/patterns/editable.tsx#L164-L167), [:201](../../../packages/design-system/src/patterns/editable.tsx#L201), [key-value.tsx:34](../../../packages/design-system/src/components/key-value.tsx#L34)

The resting row exactly fills the `dd`, and its 2px outline and `::before` tint sit outside that box. In the Failing story at 480px the focused row shows no ring at all (WCAG 2.4.7), and in edit mode the Bleed makes the Input 232px wide in a 224px `dd`, so its side borders are cut and the field reads as two rules. The in-progress `overflow-x-clip` change ([responsive-audit-2026-09-24](../responsive-audit-2026-09-24.md) #10) fixes the vertical clip; the horizontal clipping remains in any non-`wrap` KeyValue, including the Rail story, the documented placement.

**Fix:**

- Either KeyValue clips and ellipsizes only string or number children and lets element children (Editable, TextLink) own their truncation, as Editable already does on its value span; or Editable keeps its geometry inside its own box (a negative `outline-offset`, padding in place of the Bleed). `overflow-clip-margin` is not portable, because Safari lacks it.
- Add a play assertion that the editing Input stays inside the `dd`.

**EDT-6 · Escape cancels the edit and also closes an enclosing Dialog, Sheet or Popover** (medium)

[editable.tsx:222-229](../../../packages/design-system/src/patterns/editable.tsx#L222-L229)

The editor's Escape handler calls `preventDefault` but not `stopPropagation`, and Base UI's dismiss closes on any Escape without checking `defaultPrevented`. An Editable in a PickerSheet, Dialog or Popover closes the whole overlay when the reader backs out of one value, possibly discarding other work. It is latent in the app; Composer handles the same case correctly ([composer.tsx:218-221](../../../packages/design-system/src/patterns/composer.tsx#L218-L221)).

**Fix:** stop propagation when the editor consumes Escape, and add a story with Editable in a Dialog whose play function presses Escape and asserts the dialog stays open.

**EDT-7 · Touch readers cannot cancel an edit, and an invalid blur leaves an open editor without focus** (medium)

[editable.tsx:210-212](../../../packages/design-system/src/patterns/editable.tsx#L210-L212)

Blur always commits and Escape is the only cancel, so on a phone keyboard, which has no Escape, the only way out is to retype the old value. In the Validation story, clicking away from a refused value leaves the editor open and invalid while focus moves to BODY, and Escape then does nothing.

**Fix:** show compact confirm and cancel buttons while editing, at least under `any-pointer: coarse` and for multiline (Atlassian's InlineEdit shows them by default), and decide the invalid-blur policy: revert, or keep the editor with a visible cancel.

**EDT-5 · After a failed save the Text row is not described by its error, and the reason is never announced** (medium)

[editable.tsx:236-244](../../../packages/design-system/src/patterns/editable.tsx#L236-L244), [:145-158](../../../packages/design-system/src/patterns/editable.tsx#L145-L158)

After a rejection, focus is on "Owner: Dana Whitfield" with no `aria-describedby` or `aria-invalid`. The only live output is "Not saved"; "The owner must be on the programme." sits in a non-live `<p>`, so screen-reader users learn that the save failed but not why. Editable.Select's trigger already has both attributes ([:297-301](../../../packages/design-system/src/patterns/editable.tsx#L297-L301)).

**Fix:** point the button's `aria-describedby` at the message, set `aria-invalid` while an error shows, and announce "Not saved: <reason>".

**EDT-9 · A multiline value at rest is one large button** (medium)

[editable.tsx:236-258](../../../packages/design-system/src/patterns/editable.tsx#L236-L258), [requirement-form.tsx:272-274](../../../src/components/prototype/requirement-form.tsx#L272-L274)

With `multiline`, the whole paragraph renders inside the `<button>`: its name is the entire text, it cannot be selected or copied at rest, it can never hold a link, and nothing without hover says it edits. The requirement's Statement, Acceptance criteria and Rationale are each one of these buttons, and they read as plain text.

**Fix:** for multiline, render the value as text with a separate compact "Edit <label>" button. Consider an edit verb in the single-line name as well, like Atlassian's `editLabel`.

**EDT-11 · Editable.Select renders an empty value as nothing** (medium)

[editable.tsx:313-315](../../../packages/design-system/src/patterns/editable.tsx#L313-L315)

With value `""` the row shows only the Select chevron and is named "Status:". Editable.Text falls back to the placeholder or Absent ([:253](../../../packages/design-system/src/patterns/editable.tsx#L253)), DataTable's status column patches it with a custom render ([columns.tsx:362-370](../../../packages/design-system/src/patterns/data-table/columns.tsx#L362-L370)), and the prototype uses its sentinel option.

**Fix:** give Select the same `placeholder` and Absent fallback as Text, paired with the none option from EDT-4.

**EDT-12 · Composer drops focus to `<body>` after Send** (medium)

[composer.tsx:337-343](../../../packages/design-system/src/patterns/composer.tsx#L337-L343)

Send is `disabled={disabled || !value.trim()}`. In the Playground story, after Tab to Send and Enter, the draft clears, Send becomes natively disabled and focus is on BODY, so a keyboard user must find the composer again for the next comment.

**Fix:** after a fulfilled submit, return focus to the textarea, or keep Send focusable with `aria-disabled`, and assert it in SaveRecovery.

**EDT-13 · Composer suggestions are silent to screen readers** (medium)

[composer.tsx:264-270](../../../packages/design-system/src/patterns/composer.tsx#L264-L270), [:276-311](../../../packages/design-system/src/patterns/composer.tsx#L276-L311)

The textarea has only `aria-autocomplete`, `aria-controls` and `aria-activedescendant`, and no live region exists while the list is open, so nothing says that suggestions appeared, how many there are or which is active. Tab inserts the active option, so a screen-reader user typing a mention can insert text they never heard. A textarea cannot take `role=combobox`, so `aria-expanded` is not available.

**Fix:** add a polite live region that announces "<n> suggestions, Up and Down to choose" and the active option as it moves, add `aria-haspopup="listbox"`, and document the Tab insertion.

**EDT-14 · Composer's suggestion list is not portaled and has no collision handling** (medium)

[composer.tsx:276-283](../../../packages/design-system/src/patterns/composer.tsx#L276-L283)

The list is an absolute `<ul>` with no portal, flip or available-height limit. At the bottom of a feed, panel or dialog it opens below the fold or extends the scroller, and it is clipped by overflow-hidden ancestors such as Shell.Panel ([panel.tsx:145](../../../packages/design-system/src/layout/shell/panel.tsx#L145)).

**Fix:** render it through a kit positioner (portal, flip, `--available-height`), as Combobox does ([combobox.tsx:127-145](../../../packages/design-system/src/components/combobox.tsx#L127-L145)), or build on Base UI Autocomplete.

**EDT-15 · In forced colours the active suggestion is invisible, and so is every highlighted list item** (medium)

[composer.tsx:295-298](../../../packages/design-system/src/patterns/composer.tsx#L295-L298), [menu.ts:13](../../../packages/design-system/src/components/menu.ts#L13), [forced-colors.css](../../../packages/design-system/src/styles/forced-colors.css)

The active option is marked only with `bg-neutral-subtle-hovered`, and the options carry no data-slot, so after ArrowDown in the Suggestions story both options look identical with forced colours on. The gap is kit-wide: highlighted items in Select, Combobox and DropdownMenu share the menu classes and have no forced-colours rule either.

**Fix:** add one forced-colours rule for highlighted items (`[data-highlighted]` and `[role=option][aria-selected=true]` inside kit listboxes get Highlight/HighlightText or a CanvasText outline), and give Composer's options a data-slot or the shared menu classes. See TOO-7.

**EDT-16 · Composer has no consumer, its docs cite app parts that do not exist, and task comments use a generic Dialog** (medium)

[tasks.$taskId.tsx:84-97](../../../src/routes/tasks.$taskId.tsx#L84-L97), [:193-224](../../../src/routes/tasks.$taskId.tsx#L193-L224), [Composer.mdx:61](../../../packages/design-system/src/stories/patterns/Composer.mdx#L61), [component-library.md:35-38](../component-library.md#L35-L38)

The task record's Comments open the generic ModelForm dialog from "Create comment" and render hand-rolled Box rows that bypass Timeline.Item, the feed item component-library.md names. Composer.mdx and component-library.md point at an application Activity.Composer and a "Product / Workflows" Storybook, neither of which exists. product-patterns.md has no rule for comments, and "any other create or edit form is a Dialog" rules Composer out.

**Fix:** decide it in product-patterns.md: a closed exception for a Composer at the end of a record's Comments section, used on the task record, or drop the part. Remove the Activity.Composer and Product / Workflows references either way.

| Id     | Finding                                                                                                                                                                                                           | Where                                                                                                                                                                                                                                                                                                                                                                                                           | Fix                                                                                                                                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| EDT-8  | Switching tabs or windows commits a half-typed value: blur fires on window deactivation, and in the requirement record each commit creates a revision.                                                            | [editable.tsx:210-212](../../../packages/design-system/src/patterns/editable.tsx#L210-L212)                                                                                                                                                                                                                                                                                                                        | In `onBlur`, keep editing while `!document.hasFocus()` or `document.hidden`; commit only when focus moves within the document. Pairs with EDT-7.                                                               |
| EDT-17 | The read-only branches render grey "Not recorded" and "No value" instead of Absent, and never say why the field cannot change.                                                                                    | [requirement-form.tsx:168-169](../../../src/components/prototype/requirement-form.tsx#L168-L169), [:212-213](../../../src/components/prototype/requirement-form.tsx#L212-L213), [:233-234](../../../src/components/prototype/requirement-form.tsx#L233-L234), [:286](../../../src/components/prototype/requirement-form.tsx#L286)                                                                                           | Render `<Absent/>` for empty read-only values and keep "Unassigned" as a value. The kit need is the temporary lock with a reason (EDT-10), not a permanent read-only mode.                                     |
| EDT-18 | The Editable page has drifted: `multiline` is missing from the props table, the tables are hand-written, the parts are exported only as members of `Editable`, and Anatomy says 24px where the row measures 22px. | [Editable.mdx:19](../../../packages/design-system/src/stories/patterns/Editable.mdx#L19), [:108-117](../../../packages/design-system/src/stories/patterns/Editable.mdx#L108-L117), [editable.tsx:177](../../../packages/design-system/src/patterns/editable.tsx#L177), [:288](../../../packages/design-system/src/patterns/editable.tsx#L288), [:385-388](../../../packages/design-system/src/patterns/editable.tsx#L385-L388) | Export EditableText and EditableSelect by name, use `<ArgTypes>`, and give the resting row and the editor one height so opening the editor does not move the rail.                                             |
| EDT-19 | Hard-coded English in the multiline hint and Composer's defaults, a "Ctrl/⌘ + Enter to send" hint on touch devices, and Composer drops the server's error reason.                                                 | [editable.tsx:261-264](../../../packages/design-system/src/patterns/editable.tsx#L261-L264), [composer.tsx:90-97](../../../packages/design-system/src/patterns/composer.tsx#L90-L97), [:195-196](../../../packages/design-system/src/patterns/composer.tsx#L195-L196)                                                                                                                                                    | Move the Editable hint into the locale messages; move Composer's defaults there too, or say why not. Hide or reword the hint under `any-pointer: coarse`, and allow `errorMessage` as a function of the error. |

**Missing in this family:**

- `{value, label}` options and a none option on Editable.Select: stored values are ids, and readers must see names (EDT-4, EDT-11). High.
- `onEditingChange`, `onDraftChange` and `onCancel` on Editable and DataTable's EditableOptions: the contract requires draft protection on navigation, and today it takes DOM snooping (EDT-3). High.
- A Failed state that keeps the rejected draft with Retry and Discard: revision concurrency makes refusals routine, and losing typed paragraphs is data loss (EDT-2). High.
- `readOnly` with an optional reason: viewer roles and published revisions are core to the product, and consumers hand-roll plain-text branches (EDT-17; the temporary lock in EDT-10). Medium.
- Confirm and cancel buttons while editing, at least on coarse pointers and for multiline: touch keyboards have no Escape, and blur always commits (EDT-7). Medium.
- A product rule for record comments, Composer or Dialog: the part is orphaned under the current contract (EDT-16). Medium.

## Inspector, Related, Glance, Gates, TaskRow, WorkPane

The parts are sound; the defects sit in the two the prototype leans on. WorkPane, the shape of both tailoring dialogs, puts the detail tens of thousands of pixels below a 767-row list when narrow, gives every row a Tab stop, exposes no selected state, names rows by title alone and leaves its landmark unnamed; RecordBrowser's Back to results is the in-kit model to copy. Inspector.Group, on every Details rail, has a chevron that never rotates and cannot start closed. In the app, linked records drawn as stacks of Inspector groups and "Loading…" shown forever on a failed query matter most; the rest is docs, locale and naming.

**Keep:** Item's one-grid, stretched-title design keeps a row as one link or button, with separate stops for actions and the chevron; Related's docs (when to use it, content, Don't pairs, a play test over card and preview navigation); Gates speaks its state through a hidden Met:/Not met: prefix and says why it is not a score; TaskRow keeps completion, navigation and actions as sibling controls, and a play test proves completing does not open the row; Related.Card's title gets a coarse-pointer touch target, and its actions stay in the tab order; WorkPane now measures its container and nearest scroller rather than the viewport (in-flight fix); Glance's docs are honest about HoverCard's limits.

**REC-1 · WorkPane stacked puts the detail below the entire list; selecting a row on a phone shows nothing** (high)

[work-pane.tsx:92-108](../../../packages/design-system/src/patterns/work-pane.tsx#L92-L108), [parameter-picker.tsx:103-156](../../../src/components/app/profile-tailoring/parameter-picker.tsx#L103-L156), [control-picker.tsx:122-181](../../../src/components/app/profile-tailoring/control-picker.tsx#L122-L181)

Below a 768px container WorkPane is one column, list then detail. In the wizard's Set parameter values at 390px the list is 767 rows and 36,090px tall; after tapping the ninth row the detail starts at 36,245px, the scroll stays at 0, and the enabled primary submits a form the reader cannot see. The viewport keying is [responsive-audit-2026-09-24](../responsive-audit-2026-09-24.md) #1; this stacking behaviour is new.

**Fix:**

- When stacked, show one pane at a time, as RecordBrowser already does ([record-browser.tsx:271-310](../../../packages/design-system/src/patterns/record-browser.tsx#L271-L310)): the detail replaces the list and focus moves to its heading, and Back returns focus to the chosen row.
- Add a WorkPane story at 390px with a long list, and a product-patterns check at 390 and 340px.

**REC-2 · WorkPane's list makes every row a Tab stop and exposes no selected state** (high)

[work-pane.tsx:128-142](../../../packages/design-system/src/patterns/work-pane.tsx#L128-L142), [item.tsx:117-125](../../../packages/design-system/src/components/item.tsx#L117-L125), [:168](../../../packages/design-system/src/components/item.tsx#L168)

Each WorkPane.Row is its own `<button>`, and `isActive` only adds `bg-selected`, with no `aria-current`, `aria-selected` or `aria-pressed`. The parameter dialog puts 767 row buttons between the search box and the editor, so a keyboard user tabs through hundreds of rows, and a screen-reader user cannot tell which record the detail shows (WCAG 4.1.2, 2.1.1).

**Fix:**

- Make the list one composite widget: a listbox with `aria-selected`, or a grid list with roving tabindex, arrows, Home/End and type-ahead.
- At minimum set `aria-current="true"` on the active row and add a Skip to detail link. Expose selected state from Item's `isActive`, since every active Item has the same gap.

**REC-4 · Inspector.Group's chevron never rotates** (medium)

[inspector.tsx:75-79](../../../packages/design-system/src/patterns/inspector.tsx#L75-L79)

The icon rotates on `group-data-open/collapsible`, but Base UI 1.7's CollapsibleTrigger sets `data-panel-open`; `data-open` is on the Root. Live on the WS-X90 program record the open Details trigger has `data-panel-open` and the chevron's transform is `none`, so open and closed groups look the same, while the Accordion form of Inspector does rotate.

**Fix:** key the rotation off `group-data-panel-open/collapsible` or `aria-expanded`, as AccordionTrigger does, assert it in the new Inspector story, and grep the kit for other `group-data-open` uses on triggers.

**REC-6 · No collapsed Details group; the app hand-rolls it five ways** (medium)

[inspector.tsx:60-72](../../../packages/design-system/src/patterns/inspector.tsx#L60-L72), [editor.tsx:202-219](../../../src/components/app/profile-tailoring/editor.tsx#L202-L219), [:229-236](../../../src/components/app/profile-tailoring/editor.tsx#L229-L236), [:240-250](../../../src/components/app/profile-tailoring/editor.tsx#L240-L250), [system-baseline.tsx:503-512](../../../src/components/prototype/system-baseline.tsx#L503-L512), [ssp-assembly.tsx:605-612](../../../src/components/prototype/ssp-assembly.tsx#L605-L612), [profiles.$profileId.tsx:433-440](../../../src/routes/profiles.$profileId.tsx#L433-L440)

Inspector.Group always renders `<Collapsible defaultOpen>` and takes no `defaultOpen`, `open`, `onOpenChange`, `className` or `id`, although the contract puts provenance, counts and derivation in a collapsed Details section. The app builds that four times as a Collapsible with a subtle Button whose chevron never turns, and once as a native `<details>`, with different inner rows each time, so collapsed Details look and behave differently on every screen.

**Fix:**

- Add `defaultOpen`, `open`, `onOpenChange` and `className` to Inspector.Group.
- Pick one shape for the body's collapsed Details in product-patterns.md, with a reference file: Inspector.Group closed, or a kit disclosure trigger whose chevron follows `aria-expanded`. Migrate the five sites; the static chevron is the defect at all of them.

**REC-7 · Absent is a silent dash, and the app writes "—", "Not assigned" and a permanent "Loading…"** (medium)

[typography.tsx:40-42](../../../packages/design-system/src/components/typography.tsx#L40-L42), [library-products.tsx:666](../../../src/components/prototype/library-products.tsx#L666), [:671](../../../src/components/prototype/library-products.tsx#L671), [library-components.tsx:772-774](../../../src/components/prototype/library-components.tsx#L772-L774), [program-workspace.tsx:502](../../../src/components/prototype/program-workspace.tsx#L502), [:504-505](../../../src/components/prototype/program-workspace.tsx#L504-L505), [elements.tsx:587](../../../src/components/app/program-wizard/elements.tsx#L587), [:590](../../../src/components/app/program-wizard/elements.tsx#L590), [:637](../../../src/components/app/program-wizard/elements.tsx#L637)

Absent is a bare "—" span, so a screen reader hears nothing or "em dash" for an unset value, and the program rail shows "Not assigned", "—" and "—" side by side. Five places render `data?.length ?? "Loading…"`, which shows "Loading…" forever when the query fails, against "Loading and failure are different states".

**Fix:**

- App: route the secondary counts through QueryState, or Absent plus a retry on error, and replace the literal "—" with Absent.
- Kit: give Absent an optional label or a visually hidden, localized "Not set", and update [Fact.mdx:68](../../../packages/design-system/src/stories/components/Fact.mdx#L68). A KeyValue loading state is optional.

**REC-9 · Related card actions vanish while their own menu is open** (medium)

[related.tsx:204](../../../packages/design-system/src/patterns/related.tsx#L204)

The actions span uses `has-[[data-state=open]]:opacity-100`, a Radix attribute; Base UI's MenuTrigger sets `data-popup-open`. In the Related matrix story with "More for Ground segment" open, the actions container's opacity is 0, so the trigger disappears under its menu, although Related.mdx promises it stays. The Table's copy of this rule is already fixed ([table.tsx:310](../../../packages/design-system/src/components/table.tsx#L310)).

**Fix:** use `has-[[data-popup-open]]:opacity-100` (or `has-[[aria-expanded=true]]`) and add a play step that opens the menu and asserts the trigger stays visible.

**REC-10 · WorkPane's listLabel is used as a toolbar, so the landmark and the list are unnamed** (medium)

[work-pane.tsx:96-106](../../../packages/design-system/src/patterns/work-pane.tsx#L96-L106), [control-picker.tsx:124-145](../../../src/components/app/profile-tailoring/control-picker.tsx#L124-L145), [parameter-picker.tsx:105-112](../../../src/components/app/profile-tailoring/parameter-picker.tsx#L105-L112)

`listLabel` names the aside through `aria-labelledby`, but both callers pass a search Input, a ChoiceField and a count, because WorkPane has no slot for list controls. Live, the complementary landmark and the inner list have no name (the fallback is a hard-coded "List"), and both callers pass a grey `<p>` as `detail` instead of an Empty ([control-picker.tsx:178-181](../../../src/components/app/profile-tailoring/control-picker.tsx#L178-L181), [parameter-picker.tsx:153-156](../../../src/components/app/profile-tailoring/parameter-picker.tsx#L153-L156)).

**Fix:** a text `listLabel` that names both the aside and the Item.Group, a `listToolbar` slot for search and filters, and callers passing an Empty to `empty`, with `detail` left undefined when nothing is chosen.

**REC-11 · WorkPane.Row is named by its title alone** (medium)

[work-pane.tsx:128-142](../../../packages/design-system/src/patterns/work-pane.tsx#L128-L142), [item.tsx:117-125](../../../packages/design-system/src/components/item.tsx#L117-L125), [:191](../../../packages/design-system/src/components/item.tsx#L191)

The row puts the id and meta in Item's `description`, which the button does not reference. The parameter list reads "personnel or roles", "personnel or roles", "Parameter", with ac-01_odp.01 and .02 as loose text after them, so a screen-reader user cannot tell which parameter they are choosing.

**Fix:** link `description` to the title control with `aria-describedby` in Item, which helps every Item, or include the id in WorkPane.Row's name ("ac-01_odp.01, personnel or roles").

**REC-15 · Inspector.Group is used as a list of records, and Details mixes raw enums, three date formats and a Select** (medium)

[library-components.tsx:759-767](../../../src/components/prototype/library-components.tsx#L759-L767), [:893-897](../../../src/components/prototype/library-components.tsx#L893-L897), [:904-921](../../../src/components/prototype/library-components.tsx#L904-L921), [library-controls.tsx:331](../../../src/components/prototype/library-controls.tsx#L331), [program-workspace.tsx:506](../../../src/components/prototype/program-workspace.tsx#L506), [record-tools.tsx:291-296](../../../src/components/prototype/record-tools.tsx#L291-L296)

The component record's Requirements and Evidence views, and a control's parameters, render each linked record as its own Inspector.Group with no RecordLink and a UUID fallback title. Status reads "closed" or "published" on some records and a StatusBadge on others, dates appear as "Sep 15, 2026" and as a truncated "9/12/2026, 11:01:21 …", and a LibrarySelect inside Details breaks the label and value grid.

**Fix:**

- Use DataTable, or Related in a rail, for linked-record lists.
- Render status and state through the one StatusBadge, format dates with the locale helper, and move version selection to the header or trail, or into a KeyValue value.

| Id     | Finding                                                                                                                                                                                                     | Where                                                                                                                                                                                                                                                                                                                                                                                                                 | Fix                                                                                                                                                                                                                                                                      |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REC-5  | Each Details fact is its own one-item `<dl>` (6 on the program rail, 7 on the component record), so screen readers announce "description list, 1 item" per fact.                                            | [key-value.tsx:27-38](../../../packages/design-system/src/components/key-value.tsx#L27-L38), [inspector.tsx:87-91](../../../packages/design-system/src/patterns/inspector.tsx#L87-L91)                                                                                                                                                                                                                                      | Inspector.Group renders the one `<dl>` and gives KeyValue context to render `<div><dt/><dd/></div>` inside it, keeping the standalone `dl` elsewhere. Update [KeyValue.mdx:37](../../../packages/design-system/src/stories/components/KeyValue.mdx#L37) in the same change. |
| REC-12 | TaskRow's checkbox name flips between "Complete: <title>" and "Reopen: <title>", so a reader hears "Reopen: Check figures, checkbox, checked".                                                              | [task-row.tsx:51-57](../../../packages/design-system/src/patterns/task-row.tsx#L51-L57)                                                                                                                                                                                                                                                                                                                                  | Give the checkbox a stable name (the title) and let `aria-checked` carry the state; change the `completionLabel` doc to a stable name.                                                                                                                                   |
| REC-14 | Gates, Glance and TaskRow have no prototype consumer, TaskRow.mdx cites an app Task wrapper that does not exist, and the wizard and tailoring editor hand-roll their blocked-action lists.                  | [TaskRow.mdx:58](../../../packages/design-system/src/stories/patterns/TaskRow.mdx#L58), [Choosing.mdx:29](../../../packages/design-system/src/stories/docs/Choosing.mdx#L29), [program-wizard.tsx:371-379](../../../src/components/app/program-wizard.tsx#L371-L379), [:401-415](../../../src/components/app/program-wizard.tsx#L401-L415), [editor.tsx:221-228](../../../src/components/app/profile-tailoring/editor.tsx#L221-L228) | Fix TaskRow.mdx:58 and the stale next.md history. Adopting Gates for the wizard's step-4 list and the tailoring conflicts is an option, not a requirement. Do not mark the parts experimental because this prototype does not use them.                                  |
| REC-16 | Related, Inspector.Group and Item.Group hard-code `<h3>`; the system preview reads H2 title, H3 Details, H2 Description, H3 Contains.                                                                       | [related.tsx:78](../../../packages/design-system/src/patterns/related.tsx#L78), [inspector.tsx:74](../../../packages/design-system/src/patterns/inspector.tsx#L74), [item.tsx:307](../../../packages/design-system/src/components/item.tsx#L307)                                                                                                                                                                               | App: render the preview body's Section titles at h3 (`Section.Title render={<h3/>}`) under the preview's h2. Kit: optionally add `render` or a heading level to the three parts, like Section.                                                                           |
| REC-17 | KeyValue labels truncate with no title and no wrap ("Consumer resp…"), so sighted readers and screen readers read different labels.                                                                         | [key-value.tsx:32](../../../packages/design-system/src/components/key-value.tsx#L32)                                                                                                                                                                                                                                                                                                                                     | Let labels wrap, top-aligned, or add a `title` for string labels, and document a length budget for labels.                                                                                                                                                               |
| REC-18 | The Inspector trigger's hover fill hugs its text, and CollapsibleContent's `overflow-hidden` can cut the start of an edge-flush link's focus ring (reasoned from the CSS; no live task record was checked). | [inspector.tsx:75](../../../packages/design-system/src/patterns/inspector.tsx#L75), [collapsible.tsx:28](../../../packages/design-system/src/components/collapsible.tsx#L28), [tasks.$taskId.tsx:278-280](../../../src/routes/tasks.$taskId.tsx#L278-L280)                                                                                                                                                                     | Drop `overflow-hidden` once `data-open` settles, or use `overflow-clip` with `overflow-clip-margin` where supported (Safari lacks it, see EDT-1), rather than padding every group.                                                                                       |
| REC-20 | Gates, TaskRow, WorkPane and Related hard-code "Met:", "Not met:", "Completed", "Reopen", "Complete", "List" and "Nothing linked yet".                                                                      | [gates.tsx:45](../../../packages/design-system/src/patterns/gates.tsx#L45), [task-row.tsx:38](../../../packages/design-system/src/patterns/task-row.tsx#L38), [:55](../../../packages/design-system/src/patterns/task-row.tsx#L55), [work-pane.tsx:98](../../../packages/design-system/src/patterns/work-pane.tsx#L98), [related.tsx:66](../../../packages/design-system/src/patterns/related.tsx#L66)                               | Move them into the locale messages with `{title}` templates, and keep the per-part overrides.                                                                                                                                                                            |
| REC-21 | Gates renders a bare `<ul>` that cannot take a name, and its actions are a bare "Add" and "Resolve".                                                                                                        | [gates.tsx:32-33](../../../packages/design-system/src/patterns/gates.tsx#L32-L33), [Gates.stories.tsx:96-128](../../../packages/design-system/src/stories/patterns/Gates.stories.tsx#L96-L128)                                                                                                                                                                                                                              | Add `label` and `labelledBy`, as Item.Group has, and recommend action names that include the gate ("Add success criterion").                                                                                                                                             |

**Missing in this family:**

- `defaultOpen`, `open` and `onOpenChange` on Inspector.Group: the contract requires a collapsed Details section, and the group can only start open (REC-6). High.
- A single-pane narrow mode for WorkPane, with Back: a stacked list-then-detail is unusable with the tailoring dialogs' 370–767 rows (REC-1). High.
- A selectable WorkPane list with one Tab stop and `aria-selected` or `aria-current`: the open row needs a programmatic state, and a long list must not cost a Tab stop per row (REC-2). High.
- A `listToolbar` slot on WorkPane: both callers need search and filters above the list and misuse `listLabel` for it (REC-10). Medium.
- A heading level on Related, Inspector.Group and Item.Group: they sit under an h1 page, an h2 panel title or an h3 dialog title (REC-16). Medium.

**Already tracked:**

- REC-3, Inspector and WorkPane have no story file or MDX page, and Inspector.Group, the Details rail on 38 groups in 21 app files, renders in no story: a documented gap in [TestingAndReview.mdx:39](../../../packages/design-system/src/stories/docs/TestingAndReview.mdx#L39) and ds-check's RETIRED_STORY_EXPORTS ([ds-check.mjs:18-20](../../../scripts/ds-check.mjs#L18-L20)); [docs/next.md](../../next.md) "Part props tables render nothing" is the related docgen item. What remains: WorkPane is retired in ds-check but is the live shape of both tailoring dialogs, so un-retire it with a story (desktop, 320px frame, long list, in a Dialog) or replace it in the prototype.
- REC-8, DetailFacts and ModelFacts put a 12px Stack between KeyValue rows, so rails differ in rhythm ([work-common.tsx:208-217](../../../src/components/prototype/work-common.tsx#L208-L217), [record-tools.tsx:298-321](../../../src/components/prototype/record-tools.tsx#L298-L321), [system-assurance-details.tsx:178-186](../../../src/components/prototype/system-assurance-details.tsx#L178-L186)): label widths are [docs/next.md](../../next.md) "Pixel widths as props". Drop the Stack in both adapters.
- REC-13, the kit's Recipes say linked records are Related while the contract routes embedded collections to DataTable, and the preview's Contains card sits between the two ([Recipes.mdx:27](../../../packages/design-system/src/stories/docs/Recipes.mdx#L27), [product-patterns.md:15](../product-patterns.md#L15), [system-assurance-details.tsx:322-341](../../../src/components/prototype/system-assurance-details.tsx#L322-L341)): the row's meta is [docs/next.md](../../next.md) "A row's meta in a narrow list". What remains: name Contains as an exception in product-patterns.md or make it a DataTable, and trim its row to id, name and one trailing value.
- REC-22, Inspector's `groups` Accordion form has no call site and disagrees with Inspector.Group in keyboard behaviour and chevron: [docs/next.md](../../next.md) "Inspector's two forms" (2026-09-05).

## PickerSheet, RecordPicker, RecordBrowser

The three patterns are well documented, and RecordBrowser's pending-confirmation guard holds. In the running app the kit's gaps are real defects: picker checkboxes and RecordBrowser's preview are named by UUIDs, a no-match search in any of the four app pickers says there is nothing to add, and RecordPicker and Allocate requirements drop focus to the body on close. Fix first a default human row label in DataTable, table-owned search in PickerSheet, and single selection plus pending, error, initial-focus and empty states. RecordBrowser also needs a responsive table whose toolbar stays in view, sized to its container rather than by the window-based `fill`.

**Keep:** RecordBrowser's pending confirmation blocks Cancel, Escape, the close button and outside press, runs once at a time, and ignores a late completion from an unmounted session (the 18 September deep audit's #2, covered by the Pending Confirmation story); selection survives search, filters, pagination and preview, and controlled `selectedIds` lets the Create evidence hand-off return with earlier choices; Escape is layered correctly, preview first, then the dialog; under 800px the preview replaces the results through a container query and keeps the table mounted; PickerSheet passes `finalFocus` through, so a hand-off does not bounce focus to the opener; strong content guidance (the title is the task, the primary is named in full with the count, Don't pairs); one answer per shape across Choosing, Recipes, Forms and product-patterns.

**PIK-2 · Every picker row checkbox is named "Select row <uuid>"** (high)

[data-table.tsx:811](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L811), [system-requirements.tsx:363](../../../src/components/prototype/system-requirements.tsx#L363), [library-component-picker.tsx:65](../../../src/components/app/library-component-picker.tsx#L65), [requirement-evidence.tsx:320](../../../src/components/prototype/requirement-evidence.tsx#L320)

Table.Selection is labelled from `row.id`, which is a UUID in every product picker, and useDataTable offers no way to change it. Live, Allocate requirements announces "Select row 68bb2272-8639-…" for each of 538 rows, and Add from library and the evidence browser do the same; the stories pass only because their ids are readable (WCAG 4.1.2, 2.4.6).

**Fix:** DataTable already derives a readable row name for More fields ([data-table.tsx:769-778](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L769-L778): the tree label, else the first identity cell's text). Use it by default for the selection checkbox and the eye, and add a `rowLabel?: (row) => string` override.

**PIK-1 · RecordBrowser shows the raw record id as the preview header and in its Select label** (high)

[record-browser.tsx:278](../../../packages/design-system/src/patterns/record-browser.tsx#L278), [:329](../../../packages/design-system/src/patterns/record-browser.tsx#L329)

The preview header renders `preview.id` and the checkbox reads "Select {preview.id}", although the caller supplies `recordTitle`. In Add evidence on REQ-001 at 1280px both read "63f405ca-298e-5fb6-a218-d57a77ecc42e", so sighted readers see database noise in the core linking flow, screen-reader users cannot tell what they select, and a code stands in for the name.

**Fix:**

- Render `recordTitle`, or a new optional `recordCode`, in the header eyebrow, and name the checkbox from a `recordLabel: (r) => string`, since `recordTitle` returns a ReactNode.
- Add a story with UUID ids so the play function catches a regression.

**PIK-4 · PickerSheet's search is disconnected from its table, so a no-match search says there is nothing to add** (high)

[picker-sheet.tsx:35-37](../../../packages/design-system/src/patterns/picker-sheet.tsx#L35-L37), [:117-128](../../../packages/design-system/src/patterns/picker-sheet.tsx#L117-L128), [system-requirements.tsx:343-345](../../../src/components/prototype/system-requirements.tsx#L343-L345), [:431-438](../../../src/components/prototype/system-requirements.tsx#L431-L438), [library-component-picker.tsx:24-32](../../../src/components/app/library-component-picker.tsx#L24-L32), [:95-100](../../../src/components/app/library-component-picker.tsx#L95-L100), [product-configuration-picker.tsx:22-30](../../../src/components/app/product-configuration-picker.tsx#L22-L30), [:95-100](../../../src/components/app/product-configuration-picker.tsx#L95-L100), [add-from-library.tsx:288-294](../../../src/components/prototype/add-from-library.tsx#L288-L294), [:826](../../../src/components/prototype/add-from-library.tsx#L826)

PickerSheet takes `search: { value, onChange }` and "the caller filters the rows", so all four app pickers filter `data` before useDataTable, and the table sees an empty collection rather than a filtered one. Typing "zzzzqq" in Allocate requirements, with 538 candidates, shows "Every requirement is already allocated here" and a pointer to the library, with no Clear search; Add from library and the product picker would say "Nothing published to add".

**Fix:** PickerSheet takes the table and drives `table.setGlobalFilter`, which also lets it derive `selected` and `total`; or at minimum the doc comment, the MDX and all four callers switch to `setGlobalFilter`, so DataTable's filtered empty with Clear filters appears.

**PIK-6 · Focus is not returned to the opener after RecordPicker or Allocate requirements closes** (high)

[record-picker.tsx:73](../../../packages/design-system/src/patterns/record-picker.tsx#L73), [system-requirements.tsx:409](../../../src/components/prototype/system-requirements.tsx#L409)

RecordPicker's CommandInput has `autoFocus`, which runs before Base UI records the element to return to, so closing by Escape, by Enter on an option or by click leaves focus on `<body>` every time, against [RecordPicker.mdx:71](../../../packages/design-system/src/stories/patterns/RecordPicker.mdx#L71). Allocate requirements puts an `autoFocus` Textarea in PickerSheet's toolbar, with the same result after Escape or Discard; Add from library, which does not autoFocus, returns focus to Actions correctly.

**Fix:**

- Remove `autoFocus` from RecordPicker; Base UI focuses the first tabbable, which is the input.
- Forward `initialFocus` in PickerSheet (PIK-5) and point it at the rationale. Add play functions that assert opener focus after Escape and after a pick. A lint rule against `autoFocus` in overlay content is reasonable, because the app opens overlays from state.

**PIK-5 · PickerSheet has no pending, error or initial-focus API; Allocate requirements hand-rolls all three** (medium)

[picker-sheet.tsx:23-56](../../../packages/design-system/src/patterns/picker-sheet.tsx#L23-L56), [:84-91](../../../packages/design-system/src/patterns/picker-sheet.tsx#L84-L91), [:151-158](../../../packages/design-system/src/patterns/picker-sheet.tsx#L151-L158), [system-requirements.tsx:407-446](../../../src/components/prototype/system-requirements.tsx#L407-L446)

`action` is `{ label, onClick, disabled }`, and the kit's Cancel cannot be disabled. AllocateToElement swaps the label to "Allocating…", wraps the table in a disabled fieldset and relies on the draft guard returning early, so Cancel and the X look enabled but do nothing while saving. Its failure is a `<p role="alert">` after 538 unpaginated rows, where no sighted reader sees it.

**Fix:** add `action.isLoading`, a `pending` flag that disables Cancel and the close button and cancels `onOpenChange`, an `error` slot rendered as the kit Alert between the body and the footer, outside the scroller, and `initialFocus` forwarded to SheetContent. Add a story that exercises pending and failure.

**PIK-3 · RecordBrowser's empty copy is inverted, and it has no no-eligible or loading state** (medium)

[record-browser.tsx:246-249](../../../packages/design-system/src/patterns/record-browser.tsx#L246-L249), [data-table.tsx:1216-1229](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1216-L1229), [requirement-evidence.tsx:239-311](../../../src/components/prototype/requirement-evidence.tsx#L239-L311)

RecordBrowser passes "No matching records. Try another search or clear a filter." as `empty`, which DataTable shows only when nothing is filtered, and then as a bare state without the toolbar. With zero eligible records the reader is told to change a search that is not on screen, and Create evidence artifact disappears, so the app renders its own 70-line lookalike Dialog. That Dialog's context alert ([:345](../../../src/components/prototype/requirement-evidence.tsx#L345)) says "could not be loaded" whenever the data is not ready, including during a refetch.

**Fix:**

- Give RecordBrowser an `empty` for no eligible records (`title`, `description`, `action`, `secondary`) that keeps `context` and `actions` visible, and pass `state` and `error` through to DataTable, which already has both. Leave no-match to DataTable's filtered empty.
- Delete the lookalike Dialog and fix the refetch alert.

**PIK-7 · RecordBrowser keeps the selection editable while a confirmation is pending** (medium)

[record-browser.tsx:199-216](../../../packages/design-system/src/patterns/record-browser.tsx#L199-L216), [:318-327](../../../packages/design-system/src/patterns/record-browser.tsx#L318-L327), [:343](../../../packages/design-system/src/patterns/record-browser.tsx#L343)

`confirm()` snapshots the selection and awaits `onConfirm`, but nothing disables the checkboxes, Clear selection, search or filters meanwhile. In the Pending Confirmation story, unchecking EVD-001 after clicking Link evidence (2) leaves "Link evidence (1)" on screen while two records are being linked. On success the last edit is silently ignored; on failure the retry links a different set.

**Fix:** while saving, make the results read-only (inert, or a disabled fieldset around the table, plus the preview checkbox and Clear selection) and set `aria-busy` on the results region.

**PIK-8 · RecordBrowser's previous and next drop focus at the endpoints, announce no position and walk one page** (medium)

[record-browser.tsx:136-139](../../../packages/design-system/src/patterns/record-browser.tsx#L136-L139), [:173](../../../packages/design-system/src/patterns/record-browser.tsx#L173), [:180-186](../../../packages/design-system/src/patterns/record-browser.tsx#L180-L186), [:279-298](../../../packages/design-system/src/patterns/record-browser.tsx#L279-L298), [preview-navigation.tsx:8-21](../../../packages/design-system/src/patterns/preview-navigation.tsx#L8-L21)

RecordBrowser hand-rolls two IconButtons over the current page's rows. At 1280px, Next onto EVD-020, the page's last row, disables itself while focused and focus falls to BODY; no position is announced, and closing returns focus to the first row opened rather than the one being read. PreviewNavigation handles endpoints and position, but it requires `openLink`, which an in-task preview should not have.

**Fix:** make PreviewNavigation's `openLink` optional for in-task previews and use it here ("a preview inside RecordBrowser belongs to the selection task"), walk the filtered and sorted rows across pages by turning table pages, and update `openerId` on each step.

**PIK-9 · RecordBrowser's table is not responsive, and its toolbar and header scroll away** (medium)

[record-browser.tsx:239-243](../../../packages/design-system/src/patterns/record-browser.tsx#L239-L243)

The DataTable sets neither `responsive` nor `fill`, and the Toolbar scrolls with the rows. In Add evidence at 1280px with the preview open, the 659px results frame holds a 1097px table, so Owner, Context and Collected sit behind a horizontal scrollbar, and scrolling down pushes search, Columns and the header off the top. The contract does not accept a scrollable table frame as responsive.

**Fix:**

- Render the DataTable with `responsive`, so it folds against the measured results pane, and document that RecordBrowser columns need a priority-0 name.
- Move the Toolbar out of the scrolling div, or add a container-fill mode to DataTable (flex-1 in its parent, header sticky inside the frame). Do not use the window-based `fill`.

**PIK-11 · Single-choice pickers are built on multi-select checkboxes, with a live Select all** (medium)

[library-component-picker.tsx:54-68](../../../src/components/app/library-component-picker.tsx#L54-L68), [product-configuration-picker.tsx:53-67](../../../src/components/app/product-configuration-picker.tsx#L53-L67), [add-from-library.tsx:313-326](../../../src/components/prototype/add-from-library.tsx#L313-L326), [data-table.tsx:1336-1346](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L1336-L1346)

Three pickers pass `selectable: true, enableMultiRowSelection: false` and mirror one chosen id by hand, while DataTable still renders checkboxes and a header select-page checkbox that ignores single mode. In Add from library the header shows indeterminate, and clicking it checks the last row ("1 chosen of 3"); there are no radios, so readers are told they can choose many.

**Fix:** add `selectionMode: "single"` to useDataTable and DataTable: a radio per row in one named group, no header control, and a row click selects. PickerSheet then reads the count as the chosen record's name, and the three callers collapse onto it.

**PIK-12 · Eight hand-rolled record comboboxes in the app, while RecordPicker has no use** (medium)

[record-browser.tsx:413-526](../../../src/components/app/record-browser.tsx#L413-L526) (app), [create-task-dialog.tsx:39-101](../../../src/components/prototype/create-task-dialog.tsx#L39-L101), [create-evidence-dialog.tsx:40-101](../../../src/components/prototype/create-evidence-dialog.tsx#L40-L101), [fields.tsx:115-170](../../../src/components/app/fields.tsx#L115-L170), [requirement-control-mappings.tsx:602-690](../../../src/components/prototype/requirement-control-mappings.tsx#L602-L690), [system-element-dialog.tsx:276](../../../src/components/prototype/system-element-dialog.tsx#L276), [add-requirement-details-dialog.tsx:251](../../../src/components/prototype/add-requirement-details-dialog.tsx#L251)

Nothing in `src/` imports RecordPicker; eight Combobox record pickers repeat the same `isItemEqualToValue` and value-to-option plumbing, and TaskChoice and EvidenceChoice differ only in name. ReferencePicker, behind every product Create dialog, queries the server on every keystroke without debounce, caps at 50, and shows "Type to narrow the matching records" unlinked to the input.

**Fix:**

- Build one app-level RecordField in `src/components/app` over the kit Combobox's async recipe: debounce, ComboboxStatus for loading and "more results", described-by wiring, and an off-list selected value. Move ReferencePicker, PartyField and the Choice fields onto it.
- In the kit, at most add debounce and a "showing first N" status to the AsyncResults story, plus a two-line item recipe. No new kit pattern.

**PIK-13 · RecordPicker announces "Search for a command to run." and does not tie its count to the field** (medium)

[record-picker.tsx:61-74](../../../packages/design-system/src/patterns/record-picker.tsx#L61-L74), [:101](../../../packages/design-system/src/patterns/record-picker.tsx#L101), [command.tsx:190-193](../../../packages/design-system/src/components/command.tsx#L190-L193)

RecordPicker passes no description, so the command palette's default becomes the dialog's description every time it opens. The count has no `aria-describedby` and no live region, although [RecordPicker.mdx:74](../../../packages/design-system/src/stories/patterns/RecordPicker.mdx#L74) says it is read with the field, and one `emptyHint` serves both "no records" and "no match".

**Fix:** add `description` with a record-oriented default through the locale, link CommandInput's hint by `aria-describedby` and announce the count politely once typing settles, split empty from no-match, and expose `loading` through CommandLoading.

**PIK-14 · RecordBrowser puts the eye only on the `c.id` column, so evidence rows are identified as "Version 1"** (medium)

[record-browser.tsx:140-155](../../../packages/design-system/src/patterns/record-browser.tsx#L140-L155), [requirement-evidence.tsx:62-70](../../../src/components/prototype/requirement-evidence.tsx#L62-L70)

`preview` and `active` go only to columns of kind `id`, so the evidence browser makes Version its id column. Every row starts with "Version 1" in brand blue beside the eye, while the artifact name, the thing being compared, is plain text and truncated.

**Fix:** let RecordBrowser take `previewColumn`, or pick the priority-0 column; in the app, give the artifact title priority 0 and move Version to a secondary column.

**PIK-15 · On a phone, Allocate requirements folds the Statement behind More fields** (medium)

[system-requirements.tsx:347-353](../../../src/components/prototype/system-requirements.tsx#L347-L353)

The candidate columns are code, statement (`minWidth: 300`) and type, with no `priority`. At 390px the table keeps the code and "Security" and moves each Statement into More fields, so the reader chooses among codes and has to expand each row to learn what it requires.

**Fix:** give the statement `priority: 0` and a readable minimum of about 180–220px, or render code and statement as one title cell, so Type folds first. PickerSheet.mdx should require a priority-0 readable column.

| Id     | Finding                                                                                                                                                                                                                                     | Where                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Fix                                                                                                                                                                                                                                                                                                   |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PIK-10 | PickerSheet draws every candidate with no pagination or virtualization, and "Select all rows on this page" selects all 538 in Allocate requirements, which then writes 538 allocations one by one.                                          | [picker-sheet.tsx:136-138](../../../packages/design-system/src/patterns/picker-sheet.tsx#L136-L138), [system-requirements.tsx:355-361](../../../src/components/prototype/system-requirements.tsx#L355-L361), [use-data-table.ts:173](../../../packages/design-system/src/patterns/data-table/use-data-table.ts#L173)                                                                                                                                                                                                                                    | Add a large-set line to PickerSheet.mdx (set `pageSize` or `virtualize` past about 100 rows). Set `pageSize` in AllocateToElement, offer "Select all N" through the SelectionBar or the footer, and replace the save loop with one batch RPC.                                                         |
| PIK-16 | PickerSheet's MDX and stories contradict the code and the contract: story tables scroll instead of `responsive`, the count is called live text with no role, a Related link points at a missing anchor, and a stale frame override remains. | [PickerSheet.mdx:39](../../../packages/design-system/src/stories/patterns/PickerSheet.mdx#L39), [:76-78](../../../packages/design-system/src/stories/patterns/PickerSheet.mdx#L76-L78), [:88](../../../packages/design-system/src/stories/patterns/PickerSheet.mdx#L88), [PickerSheet.stories.tsx:184-189](../../../packages/design-system/src/stories/patterns/PickerSheet.stories.tsx#L184-L189), [:256](../../../packages/design-system/src/stories/patterns/PickerSheet.stories.tsx#L256)                                                                 | Rewrite Sizes to require `responsive` with a priority-0 column and update both story frames. Fix or remove the dead Pages link, correct the checkbox naming line, and drop the `rounded-none border-0` override. Keep the details frame; the app's contract already moves spec authoring to a Dialog. |
| PIK-17 | The selection patterns hard-code English and differ in count wording, live regions and the Cancel variant; RecordBrowser's search always says "Search records", and its failure is a raw `<p role="alert">`.                                | [picker-sheet.tsx:76-81](../../../packages/design-system/src/patterns/picker-sheet.tsx#L76-L81), [:145](../../../packages/design-system/src/patterns/picker-sheet.tsx#L145), [record-browser.tsx:247-248](../../../packages/design-system/src/patterns/record-browser.tsx#L247-L248), [:280-296](../../../packages/design-system/src/patterns/record-browser.tsx#L280-L296), [:341-351](../../../packages/design-system/src/patterns/record-browser.tsx#L341-L351), [record-picker.tsx:101](../../../packages/design-system/src/patterns/record-picker.tsx#L101) | Route every string through useLedgerLocale, use one count phrasing with `role=status` in both, add `searchPlaceholder`, render errors as the kit Alert, and make Cancel subtle in both footers.                                                                                                       |
| PIK-18 | The app's 1,272-line record-browser.tsx is the schema inspector, not a record browser, and hand-rolls an error paragraph, a `<details>`, a styled h2 and bordered count tiles.                                                              | [record-browser.tsx:91-97](../../../src/components/app/record-browser.tsx#L91-L97), [:836-843](../../../src/components/app/record-browser.tsx#L836-L843), [:1116](../../../src/components/app/record-browser.tsx#L1116), [:1152-1181](../../../src/components/app/record-browser.tsx#L1152-L1181)                                                                                                                                                                                                                                                          | Rename it schema-inspector.tsx, or split out record-editor.tsx. In RecordEditor, the path product Create dialogs use, replace ErrorMessage with FieldError tied by `aria-describedby` and `<details>` with Collapsible. The tiles and heading are low-priority polish.                                |
| PIK-19 | Below 800px the preview's Back to results is an X, 40px under the dialog's own X Close, so a reader returning to the list can dismiss the browser and lose the selection.                                                                   | [record-browser.tsx:293-298](../../../packages/design-system/src/patterns/record-browser.tsx#L293-L298)                                                                                                                                                                                                                                                                                                                                                                                                                                           | When the preview replaces the results, render a leading back chevron labelled Back to results; keep the trailing X only side by side.                                                                                                                                                                 |
| PIK-20 | RecordBrowser unmounts its content on close, so the dialog loses its exit animation; the app's callers also mount these surfaces with `open` hard-coded true.                                                                               | [record-browser.tsx:77-84](../../../packages/design-system/src/patterns/record-browser.tsx#L77-L84), [system-requirements.tsx:229](../../../src/components/prototype/system-requirements.tsx#L229), [requirement-evidence.tsx:318-320](../../../src/components/prototype/requirement-evidence.tsx#L318-L320), [elements.tsx:668-670](../../../src/components/app/program-wizard/elements.tsx#L668-L670)                                                                                                                                                    | Keep the content mounted through the exit and reset the session with a key per open (or in `onOpenChangeComplete`), keeping the late-completion guard on that key. The callers' conditional mounting is a separate app-wide motion decision.                                                          |

**Missing in this family:**

- `selectionMode: "single"` for PickerSheet and DataTable, with radio rows: three pickers need exactly one choice and fake it with checkboxes and a live Select all (PIK-11). High.
- A `rowLabel` on useDataTable, used by selection, the eye and More fields: selection checkboxes are named by UUIDs in every product picker (PIK-2). High.
- `pending`, `error` and `initialFocus` on PickerSheet: the contract requires pending protection for a PickerSheet with a shared rationale, and the one such caller re-implements it and misplaces the error (PIK-5, PIK-6). High.
- Loading and error states on RecordBrowser, and an empty-eligible state that keeps its actions: without them the app built a lookalike Dialog (PIK-3). High.
- PreviewNavigation without `openLink`, for in-task previews: RecordBrowser cannot reuse the kit's endpoint focus and position (PIK-8). Medium.
- A play-tested RecordPicker story ([RecordPicker.stories.tsx:62](../../../packages/design-system/src/stories/patterns/RecordPicker.stories.tsx#L62)) and ArgTypes on [RecordBrowser.mdx](../../../packages/design-system/src/stories/patterns/RecordBrowser.mdx): the focus-return bug shipped because RecordPicker has no play function (PIK-6). Medium.

## PreviewSheet, PreviewHeader, PreviewNavigation

The family is well factored: the kit owns controls and focus, the app owns order and destinations, and the outer and inner header split is asserted in stories and browser suites. The biggest problem is reach: useDisplayedRecords reads the paginated row model, so previous and next stop at the table page and announce a page-sized total, and the contract says the same, so the fix changes product-patterns.md too. Several host behaviours are deliberate and asserted by test-preview-frames.mjs but worth revisiting: Close pops one frame, Back sends focus to the panel rather than the invoking eye, and the endpoint focus hop is unnecessary once `focusableWhenDisabled` is used. In the kit, PageHeader.Title needs `render`, and PreviewNavigation.mdx and Pages "Queue with panel" still teach the name in the outer header.

**Keep:** the ownership split (PreviewNavigation takes position, total, callbacks and a caller-supplied link; no routing or row state lives in the kit); the navigation-only outer header and inner record PageHeader asserted by story play functions and [scripts/tests/preview-header.mjs](../../../scripts/tests/preview-header.mjs); endpoint focus and the outside-results state exist and are tested; a real anchor opens the full record in a new tab with one consistent name; strings and numbers localized through useLedgerLocale, with a Localized story; useDisplayedRecords used by about 25 previews, following filter, sort and tree state; PreviewSheet's focus containment, title-first focus and `finalFocus`; RecordPreviewProvider keeps parent frames and the collection mounted, so Back and register state survive; at 390px the panel replaces Main, the header fits four 28px targets and nothing scrolls sideways.

**PRV-1 · Preview navigation stops at the table page and announces a page-sized total** (high)

[record-preview.tsx:334-342](../../../src/components/prototype/record-preview.tsx#L334-L342), [:313-317](../../../src/components/prototype/record-preview.tsx#L313-L317)

useDisplayedRecords builds its list from `table.getRowModel().rows`, the current page only. On /findings the footer reads "1–20 of 62" and the preview "1 of 20 records"; after 19 presses of Next it reads "20 of 20 records", Next is disabled, and nothing says why. The Requirements tab of WS-X90 shows "1–25 of 640" against "25 of 25", turning the table page leaves the preview "outside the current results", and getting from the last row's preview to row 1 of the next page took 2 plus 65 Shift+Tabs.

**Fix:**

- Walk the whole filtered and sorted row model (`getPrePaginationRowModel` with expansion applied), and advance the table's page index when Next crosses a page edge, so the active row stays visible and marked.
- At minimum report the full count ("20 of 62"), and change the [product-patterns.md](../product-patterns.md) line "follow the current filter, sort, page and tree state" so the page does not bound navigation.

**PRV-2 · In a nested frame, Close and Escape only go back one frame** (medium)

[record-preview.tsx:119-133](../../../src/components/prototype/record-preview.tsx#L119-L133), [:143](../../../src/components/prototype/record-preview.tsx#L143), [:147-158](../../../src/components/prototype/record-preview.tsx#L147-L158)

The provider passes the same `close` to Shell.Panel's Close, its Escape handler and the Back button, and for a child frame it only removes that frame. From an evidence row's preview inside REQ-001, "Close details" leaves the panel open on the requirement, so leaving from depth N takes N clicks or N Escapes, while [PreviewSheet.mdx:37](../../../packages/design-system/src/stories/patterns/PreviewSheet.mdx#L37) says Close dismisses.

**Fix:** decide one meaning of Close for both preview surfaces and write it into product-patterns.md (Collection previews). If Close dismisses, call every frame's `onClose`, root last, restore focus to `rootOpener`, and update the assertion at [test-preview-frames.mjs:202-205](../../../scripts/test-preview-frames.mjs#L202-L205).

**PRV-3 · Going Back leaves focus on the panel instead of the invoking eye** (medium)

[record-preview.tsx:134-138](../../../src/components/prototype/record-preview.tsx#L134-L138)

A layout effect focuses the panel container whenever the frame changes. After Back, focus is on the "Requirement preview" aside, not on the evidence eye that opened the child, which is still mounted in the retained parent, so keyboard users lose their place in the Evidence tab and tab from the top of the panel.

**Fix:** keep focusing the panel when a child opens. On Back, restore focus to the child's invoking element, captured at register time, when it is still connected, falling back to the panel, and change the assertion at [test-preview-frames.mjs:196](../../../scripts/test-preview-frames.mjs#L196).

**PRV-4 · The package version preview remounts its frame on every Next** (medium)

[package-views.tsx:265-285](../../../src/components/prototype/package-views.tsx#L265-L285)

`<PackageVersion key={selected.id}>` remounts RecordPreviewPanel on each step, which registers a new root frame and fires the panel-focus effect. A keyboard user pressing Next lands on the panel container after every step and must tab back to Next. Every other consumer keeps the panel stable and keys only the body ([requirements-table.tsx:550](../../../src/components/prototype/requirements-table.tsx#L550), [program-systems-tree.tsx:445](../../../src/components/prototype/program-systems-tree.tsx#L445)).

**Fix:** key the content, not the component that renders RecordPreviewPanel. Consider a stable frame identity on RecordPreviewPanel, so a remount cannot silently create a new root frame.

**PRV-6 · The live status announces only a number, never the record, and nothing on open** (medium)

[preview-navigation.tsx:50-55](../../../packages/design-system/src/patterns/preview-navigation.tsx#L50-L55)

The `role=status` region mounts with its text already present, so most screen readers say nothing when the preview opens. On Next they hear only "2 of 3 records" while the inner h2 changes silently, and the cluster is a bare div with no group role or label.

**Fix:** accept an optional `recordLabel` and announce "<name>, 2 of 3", render the region empty on mount and fill it after the first change, and wrap the controls in `role=group` with a localized "Record navigation" label.

**PRV-7 · The endpoint focus hop reverses a repeated Enter, and native disabled hides the endpoint control** (medium)

[preview-navigation.tsx:36-48](../../../packages/design-system/src/patterns/preview-navigation.tsx#L36-L48), [:62](../../../packages/design-system/src/patterns/preview-navigation.tsx#L62), [:74](../../../packages/design-system/src/patterns/preview-navigation.tsx#L74)

At the last record Next gets native `disabled` and focus moves to Previous, so a user pressing Enter to advance reaches the end and then walks backward, hearing "19 of 20 records"; the Collection story's play function confirms it. Because disabled controls leave the tab order, a user tabbing through the header never learns the other control exists.

**Fix:** pass Base UI's `focusableWhenDisabled` to both IconButtons (Button already forwards it, [button.tsx:125](../../../packages/design-system/src/components/button.tsx#L125), [:171](../../../packages/design-system/src/components/button.tsx#L171)), delete the hop effect, and change the product-patterns.md endpoint sentence and the Collection play function together.

**PRV-8 · Kit docs and the cited recipe story put the record name in the outer panel header** (medium)

[PreviewNavigation.mdx:8](../../../packages/design-system/src/stories/patterns/PreviewNavigation.mdx#L8), [component-library.md:160](../component-library.md#L160), [Pages.stories.tsx:199](../../../packages/design-system/src/stories/layout/Pages.stories.tsx#L199), [:232](../../../packages/design-system/src/stories/layout/Pages.stories.tsx#L232), [:414](../../../packages/design-system/src/stories/layout/Pages.stories.tsx#L414)

PreviewNavigation.mdx says "The panel title is the record's name", component-library.md sends previews to `Shell.Panel.actions`, and the story [Recipes.mdx:41](../../../packages/design-system/src/stories/docs/Recipes.mdx#L41) cites, Pages "Queue with panel", titles the outer header with the record, has no inner header, ends with an Open full record button and asserts the landmark is named after the record. Agents told to read the Storybook first copy it, against the contract.

**Fix:** align the three with [Shell.mdx:29](../../../packages/design-system/src/stories/layout/Shell.mdx#L29): a navigation-only Panel.Header with Panel.Actions and Panel.Close, the landmark named by `label`, and an inner PageHeader with an h2 in Panel.Body; or re-point Recipes.mdx to Shell's Record header narrow story. Update Queue with panel's assertions and remove its body button.

**PRV-9 · PageHeader.Title has no `render`, so both inner record headers copy its classes** (medium)

[page-header.tsx:40-47](../../../packages/design-system/src/layout/page-header.tsx#L40-L47), [record-preview.tsx:196](../../../src/components/prototype/record-preview.tsx#L196), [preview-sheet.tsx:119-123](../../../packages/design-system/src/patterns/preview-sheet.tsx#L119-L123), [panel.tsx:91](../../../packages/design-system/src/layout/shell/panel.tsx#L91), [:157-165](../../../packages/design-system/src/layout/shell/panel.tsx#L157-L165)

PageHeader.Title is a fixed h1, so record-preview.tsx and PreviewSheet both copy its class list onto an h2, and a change to the title's type style has to be made in three places. Shell.Panel's sugar props always render a visible title, so the conforming preview is hand-composed from Splitter, Header, Actions, Close and Body.

**Fix:** add `render` to PageHeader.Title through useRender, like PageHeader.Lead, and use `PageHeader.Title render={<h2 />}` (in PreviewSheet, `render={<SheetTitle />}`). A PreviewPanel part or a Shell.Panel `navigation` slot is optional; the documented Panel composition already serves a second product.

**PRV-10 · RecordSummaryPreview shows raw enums and ISO dates and repeats the name** (medium)

[record-summary-preview.tsx:85-88](../../../src/components/prototype/record-summary-preview.tsx#L85-L88), [record-tools.tsx:254-260](../../../src/components/prototype/record-tools.tsx#L254-L260)

ModelTable previews render each field through `displayValue` unless the field has a render function, so on /findings the row's "Low" badge becomes "Severity: low" and "Status: closed" in the preview, dates come through as raw ISO strings, and a Title property repeats the h2 above it. This happens on every ModelTable register (Findings, Risks, POA&M).

**Fix:** reuse each column's kind formatter (status badge, date, number) for its field, and drop the name or title field when fields are given.

| Id     | Finding                                                                                                                                                                                 | Where                                                                                                                                                                                                                                                                                                                                                                                                                   | Fix                                                                                                                                                        |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRV-5  | The position and the "outside the current results" reason are screen-reader only, so sighted readers see two faint disabled chevrons with no explanation.                               | [preview-navigation.tsx:51-55](../../../packages/design-system/src/patterns/preview-navigation.tsx#L51-L55)                                                                                                                                                                                                                                                                                                                | Add an optional visible position label and a visible "Not in current results" note at position 0. Keep the pair rendered and disabled for a single record. |
| PRV-12 | Previous, Next, Back and Close pass `isTooltipDisabled`, and the open link has only a native `title`, so four icon-only controls have no visible label.                                 | [preview-navigation.tsx:58](../../../packages/design-system/src/patterns/preview-navigation.tsx#L58), [:70](../../../packages/design-system/src/patterns/preview-navigation.tsx#L70), [preview-sheet.tsx:102](../../../packages/design-system/src/patterns/preview-sheet.tsx#L102), [:111](../../../packages/design-system/src/patterns/preview-sheet.tsx#L111)                                                                     | Let the IconButtons show their tooltips, and use the kit Tooltip for the open link.                                                                        |
| PRV-13 | PreviewSheet requires `openTo` even when `navigation` suppresses it, and `id` although both callers pass null; its fallback "Open the full record" is English and a same-tab text link. | [preview-sheet.tsx:29](../../../packages/design-system/src/patterns/preview-sheet.tsx#L29), [:41](../../../packages/design-system/src/patterns/preview-sheet.tsx#L41), [:77-79](../../../packages/design-system/src/patterns/preview-sheet.tsx#L77-L79), [:107](../../../packages/design-system/src/patterns/preview-sheet.tsx#L107), [evidence-browser.tsx:377-386](../../../src/components/prototype/evidence-browser.tsx#L377-L386) | Make `id` optional, type `navigation` and `openTo` as a union, localize the fallback, and consider PreviewNavigation's link styling for it.                |
| PRV-14 | The previous, next and back chevrons do not mirror in RTL, unlike Pagination, Scroller, DropdownMenu and Calendar.                                                                      | [preview-navigation.tsx:61](../../../packages/design-system/src/patterns/preview-navigation.tsx#L61), [:73](../../../packages/design-system/src/patterns/preview-navigation.tsx#L73), [preview-sheet.tsx:101](../../../packages/design-system/src/patterns/preview-sheet.tsx#L101)                                                                                                                                               | Add `rtl:rotate-180`, as [pagination.tsx:80](../../../packages/design-system/src/components/pagination.tsx#L80) does, and an RTL case to the Localized story. |
| PRV-15 | preview-header.tsx is imported by nothing, not exported, and has no story or baseline entry, yet the staged diff still edits it.                                                        | [preview-header.tsx:1-35](../../../packages/design-system/src/patterns/preview-header.tsx#L1-L35)                                                                                                                                                                                                                                                                                                                          | Delete it. Fold any compact identity row that is still wanted into PreviewSheet's metadata block.                                                          |

**Missing in this family:**

- `render` or a level on PageHeader.Title: inner record headers need an h2 with the title's styling, and two files copy its class list (PRV-9). Medium.
- A visible position label on PreviewNavigation: sighted users get no position and no reason when the record is outside the results (PRV-5). Medium.
- `recordLabel` on PreviewNavigation for announcements: say which record is shown, not only its number (PRV-6). Medium.

**Already tracked:**

- PRV-11, Close vs Close details on the two preview surfaces: [pattern-audit-2026-09-17](../pattern-audit-2026-09-17.md) §5. What remains: the two Backs differ too, a ChevronLeft "Back" at the start of PreviewSheet (the same glyph as Previous record) and an ArrowLeft "Back to previous record" beside Previous in the panel ([preview-sheet.tsx:97-113](../../../packages/design-system/src/patterns/preview-sheet.tsx#L97-L113), [record-preview.tsx:147-158](../../../src/components/prototype/record-preview.tsx#L147-L158)). Give Back one treatment, an ArrowLeft at the start of the outer bar, separated from previous and next.
- PRV-16, the authorization decision preview's title is a derived label with a raw `decided_at` timestamp ([package-views.tsx:488](../../../src/components/prototype/package-views.tsx#L488)): [pattern-audit-2026-09-17](../pattern-audit-2026-09-17.md) (inner title is a type label).

## ESLint plugin, ds-check, API baseline, tests, Storybook config, packaging, lib helpers

The tooling is thorough: a token-generated allowlist, an export ratchet, axe on every story in light and dark, narrow and contained layout projects, and a packed-tarball consumer test. Its largest gap is that the token lint never reads the kit's own `classes()` helper, className callbacks, class constants or style props: arbitrary overlay widths and an invisible Combobox separator shipped because of it, and 20 product dialogs sit on 13 pixel widths. Next come a tailwind-merge config with no width groups, so a consumer's className loses to the kit's token class, and test projects that never emulate touch, never run axe's target-size rule and cover forced colours for four families. The props docs omit inherited Base UI props, a medium gap because the MDX prose covers the key ones; versioning drift is low-stakes for a private package whose API the baseline already gates.

**Keep:** the class allowlist, deprecations and spacing keys generated from the token build, so lint and tokens cannot drift; ds-check resolves the public barrel through TypeScript, counts only executable story references and blocks allowlist growth against git (the allowlist is now empty); axe on every story in light and dark, with one reasoned disable; layout checks at 390px and in a 320px frame, with per-story reasons and failure messages that say what to fix; composition rules that resolve real bindings, aliases and namespaces and require a prop after any spread; an API baseline that fingerprints the dependency contracts the kit exposes; a packed-tarball consumer test over SSR, tsc and a Vite build, with the ESLint plugin working from components.json; Storybook's stylesheet in the app's import order; product code clean under a stricter lint (0 hidden violations in 164 files), and /programs, /risks and /work at 0 default axe violations.

**TOO-1 · The token lint never reads `classes()`, className callbacks, class constants or style** (medium)

[eslint-plugin/index.js:21](../../../packages/design-system/eslint-plugin/index.js#L21), [:25-96](../../../packages/design-system/eslint-plugin/index.js#L25-L96), [:123-146](../../../packages/design-system/eslint-plugin/index.js#L123-L146), [base-ui.ts:4](../../../packages/design-system/src/lib/base-ui.ts#L4)

CLASS_FNS lists only cn, clsx, twMerge and cva, and `collect()` returns nothing for an identifier, a function or another call, so every Base UI part styled through `classes()` (27 files) goes unlinted; an in-memory run of the real rules gave zero reports for `classes("mt-4 w-[240px] text-red-500")`, a className callback, a const, a style object and `triggerClassName`. Rewriting `classes(` to `cn(` surfaces 12 hidden errors: the pixel widths and calc heights in [dialog.tsx:62](../../../packages/design-system/src/components/dialog.tsx#L62) and [alert-dialog.tsx:59](../../../packages/design-system/src/components/alert-dialog.tsx#L59), `my-050` and the non-existent `bg-border` in [combobox.tsx:273](../../../packages/design-system/src/components/combobox.tsx#L273), and one each in [scroll-area.tsx:27](../../../packages/design-system/src/components/scroll-area.tsx#L27), [toggle-group.tsx:64](../../../packages/design-system/src/components/toggle-group.tsx#L64) and [collapsible.tsx:28](../../../packages/design-system/src/components/collapsible.tsx#L28). The shared separator in [menu.ts:28](../../../packages/design-system/src/components/menu.ts#L28) reaches `classes()` as an identifier, so its margin is invisible even to cn.

**Fix:**

- Add `classes` to CLASS_FNS, make the list configurable (`settings.ledger.classFunctions`), and reuse `staticClasses()` from composition-rules.js, which already follows function bodies and single-definition consts. Also check object properties and props named `/[cC]lassNames?$/`, with rule tests for each shape.
- Fix the 12 errors: dialog widths on `dimension.layout.dialog.*` tokens, the separator (TOO-3) and the calc gap.

**TOO-4 · Style props bypass the tokens: 20 product dialogs and sheets set 13 pixel widths** (medium)

[create-task-dialog.tsx:265](../../../src/components/prototype/create-task-dialog.tsx#L265), [record-browser.tsx:1257](../../../src/components/app/record-browser.tsx#L1257), [requirement-allocations.tsx:364](../../../src/components/prototype/requirement-allocations.tsx#L364), [control-picker.tsx:111](../../../src/components/app/profile-tailoring/control-picker.tsx#L111), [requirement-evidence.tsx:250](../../../src/components/prototype/requirement-evidence.tsx#L250), [Dialog.mdx:36](../../../packages/design-system/src/stories/components/Dialog.mdx#L36)

No ledger rule reads `style`, and product code sets `maxWidth` on 20 DialogContent and SheetContent instances, from 360 to 1120px plus 90vw/90dvh, so Create task opens at 620 and Create evidence at 660 and a token change cannot move either. DialogContent has no size while AlertDialog has one ([dialog.tsx:44](../../../packages/design-system/src/components/dialog.tsx#L44), [alert-dialog.tsx:40](../../../packages/design-system/src/components/alert-dialog.tsx#L40)), and Dialog.mdx and Select.mdx tell consumers to set widths through style.

**Fix:**

- Give DialogContent a `size` on layout tokens (for example small 400, medium 600, large 800, xlarge 960, full) and migrate the 20 callers.
- Add a ledger rule, an error in recommended, that reports literal lengths, colours and margins in style objects on kit parts and native elements, with an escape hatch for computed values.

**TOO-5 · tailwind-merge has no width, min-width, max-width or side-radius groups, so className overrides lose** (medium)

[tokens.mjs:224-240](../../../packages/design-system/build/tokens.mjs#L224-L240), [:333](../../../packages/design-system/build/tokens.mjs#L333), [merge-config.ts](../../../packages/design-system/src/generated/merge-config.ts)

The generator emits no w, min-w or max-w group, so `cn("w-layout-rail", "w-full")`, `cn("min-w-control-medium", "min-w-0")`, `cn("max-w-layout-measure", "max-w-full")` and `cn("rounded-t-medium", "rounded-t-none")` keep both classes, and Tailwind's alphabetical output order lets the kit's token class win. `<Toggle className="min-w-0">` or a vertical Attachment with `className="w-full"` silently does nothing, and no test exercises mergeConfig.

**Fix:** emit w, min-w and max-w groups (and h and min-h for every layout dimension), extend tailwind-merge's theme scales so side radii merge too, and add a node test that runs each generated utility through `cn(kitDefault, override)`.

**TOO-7 · Forced-colours checks cover four families; ToggleGroup's pressed state and Calendar's range disappear** (medium)

[vitest.config.ts:88-92](../../../packages/design-system/vitest.config.ts#L88-L92), [forced-colors.css:1-75](../../../packages/design-system/src/styles/forced-colors.css#L1-L75)

The forced-colours project runs only Switch, RadioGroup, Tabs and Progress, and forced-colors.css styles only their slots. With forced colours on, the ToggleGroup matrix's pressed items look identical to unpressed ones, and a Calendar range's days lose their background, leaving only the focused day's outline; Tree selection, SideNav's current item and DataTable's selected rows use the same `bg-selected` and were not checked. No prototype screen is affected today; this extends [design-system-deep-audit-2026-09-18](../design-system-deep-audit-2026-09-18.md) #4, whose four families are fixed.

**Fix:** add forced-colours rules keyed on state (`[data-pressed]`, `[aria-pressed=true]`, `[aria-selected=true]`, `[aria-current]`, DayPicker's selected and range modifiers) with SelectedItem/SelectedItemText or Highlight/HighlightText, or a system-colour border. Widen the project to every family's matrix story, with a play assertion that the selected item differs. See EDT-15.

**TOO-8 · No test project emulates touch, and touch behaviour rests on three media predicates** (medium)

[vitest.config.ts:47](../../../packages/design-system/vitest.config.ts#L47), [:95-110](../../../packages/design-system/vitest.config.ts#L95-L110), [touch.css:7](../../../packages/design-system/src/styles/touch.css#L7), [related.tsx:204](../../../packages/design-system/src/patterns/related.tsx#L204), [data-table.tsx:171](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L171), [splitter.tsx:169](../../../packages/design-system/src/layout/shell/splitter.tsx#L169)

Test contexts set only reduced motion and forced colours, and the 390px project is desktop Chromium with a fine pointer and hover, so the hover-free row actions and hit areas being fixed now ([responsive-audit-2026-09-24](../responsive-audit-2026-09-24.md) #2, #10) cannot be asserted. Touch behaviour keys off `any-pointer: coarse`, the primary-pointer `pointer-coarse:`, `hover: none` and `any-pointer-coarse`, so on a hybrid laptop the touch targets grow while Related's actions stay hover-only.

**Fix:** add a storybook-touch project with `hasTouch` and `isMobile` at 390px, assert visible actions and 24px hit areas in the touch stories, and choose one predicate (`any-pointer: coarse` or `any-hover: none`) for all touch behaviour.

**TOO-9 · The a11y gate never runs axe's target-size rule** (medium)

[.storybook/preview.tsx:78](../../../packages/design-system/.storybook/preview.tsx#L78)

The preview sets `a11y: { test: "error" }` with no rules, and axe-core 4.13 ships `target-size` (WCAG 2.5.8) disabled. The 14–20px checkboxes, chevrons and row buttons of [responsive-audit-2026-09-24](../responsive-audit-2026-09-24.md) #10 therefore pass, and the stated 24px minimum is never checked automatically.

**Fix:** enable `target-size` at least in the touch and narrow projects. axe measures boxes, not the `::before` hit area `touch-target` draws, so add a play-level check of the pseudo-element for parts that rely on it.

**TOO-10 · Product screens get no automated accessibility pass** (medium)

[test-screen-families.mjs](../../../scripts/test-screen-families.mjs), [product-patterns.md:103](../product-patterns.md#L103), [workspace.tsx:36](../../../src/components/app/workspace.tsx#L36)

No script runs axe, and Storybook's runner disables the region rule, so headings, landmarks and names in composed Dialog forms, previews and wizard steps regress unnoticed. A live axe pass found 0 violations on /programs, /risks and /work, but the sign-in screen has no `<main>` and four nodes outside any landmark.

**Fix:** inject axe-core, already installed, into test-screen-families.mjs for each route and width, including sign-in, an open create Dialog and an open preview. Separately, render the sign-in Screen's outer element as `<main>`: a best-practice fix, not a WCAG failure.

**TOO-2 · Generated props omit every inherited Base UI prop, and 28 family pages have no ArgTypes** (medium)

[.storybook/main.ts:19](../../../packages/design-system/.storybook/main.ts#L19), [llms.mjs:94-99](../../../packages/design-system/build/llms.mjs#L94-L99), [DataTable.mdx:212-224](../../../packages/design-system/src/stories/patterns/DataTable.mdx#L212-L224)

The docgen `propFilter` drops any prop declared under node_modules, so Switch's docs, and the Storybook MCP, list only style, className, render and size, and Select has no Props section. 28 family pages have no `<ArgTypes>`, hand-written tables drift (DataTable's omits `responsive`, the one prop product lint requires), and llms.txt replaces props with a pointer. Agents are told a prop exists only when the docs show it, so they will hand-roll controlled state the part already has.

**Fix:**

- In `propFilter`, keep props whose parent file is under `node_modules/@base-ui/`, and drop only React DOM attribute types.
- Add an ArgTypes-present check to ds-check for component and pattern families, and add `responsive` to the DataTable table. [docs/next.md](../../next.md) "Part props tables render nothing" is the related Object.assign item, with a different cause.

**TOO-6 · The package is linted without react-hooks or the JS and TS recommended rules** (medium)

[design-system/eslint.config.js:5-12](../../../packages/design-system/eslint.config.js#L5-L12), [eslint.config.js:55](../../../eslint.config.js#L55)

The package config registers only the TS parser and the ledger preset, and the root config, which has react-hooks and typescript-eslint, ignores packages. Running react-hooks over package src found 8 exhaustive-deps reports, for example [calendar.tsx:164](../../../packages/design-system/src/components/calendar.tsx#L164), [panel.tsx:132](../../../packages/design-system/src/layout/shell/panel.tsx#L132), [side-nav.tsx:103](../../../packages/design-system/src/layout/shell/side-nav.tsx#L103), [data-table.tsx:735](../../../packages/design-system/src/patterns/data-table/data-table.tsx#L735) and [view-store.ts:59](../../../packages/design-system/src/patterns/data-table/view-store.ts#L59); some are intentional, none is suppressed with a reason, and the kit is held to a lower bar than its consumer.

**Fix:** add `js.configs.recommended`, typescript-eslint recommended and react-hooks (rules-of-hooks as an error, exhaustive-deps as a warning, then an error) to the package config, suppress the intentional cases inline with a reason, and treat story render functions as components.

**TOO-11 · The generic `development` export condition hands other bundlers raw TypeScript** (medium)

[package.json:10-19](../../../packages/design-system/package.json#L10-L19), [consumer-smoke.mjs:1](../../../packages/design-system/build/consumer-smoke.mjs#L1), [:50-52](../../../packages/design-system/build/consumer-smoke.mjs#L50-L52), [README.md:96](../../../packages/design-system/README.md#L96)

`exports` lists `development` first, mapped to `src/index.ts` and `src/lib/cn.ts`. webpack 5 in development mode, and Next.js dev without `transpilePackages`, adds that condition and does not transpile TypeScript in node_modules, so a second product on either fails to start in dev, and the smoke test avoids development conditions and never runs a dev server. The app's own dev server and test:patterns also run src while `vite build` ships dist.

**Fix:** rename the condition to a custom one (for example `@ledger/source`), set in the app's tsconfig `customConditions` and Vite `resolve.conditions`; add a dev-mode step to the consumer smoke test, and optionally run one test:patterns pass against a production build.

| Id     | Finding                                                                                                                                                                                                                                                                                                                                                                    | Where                                                                                                                                                                                                                                                                                                                                                                                                                                              | Fix                                                                                                                                                                                                                                                                                                 |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TOO-3  | ComboboxSeparator draws nothing: `bg-border` is not a class, so grouped comboboxes have no divider, unlike Select and menus. Present since 28a8e95, hidden by TOO-1; no product screen uses it.                                                                                                                                                                            | [combobox.tsx:273](../../../packages/design-system/src/components/combobox.tsx#L273)                                                                                                                                                                                                                                                                                                                                                                  | `classes(menuSeparator, className)`, as Select does, guarded by the TOO-1 lint fix.                                                                                                                                                                                                                 |
| TOO-12 | Three weeks of breaking removals (IndexPage, ShowPage, RecordHeader, PreviewRail, PreviewSplit, standalone Panel and Block, TopNav.End `moreLabel`) sit under "Unreleased" at 0.6.0 with no Breaking or Deprecated headings, and the removed layout parts have no no-deprecated-name entries. Every CI tarball is named 0.6.0.                                             | [CHANGELOG.md:3-7](../../../packages/design-system/CHANGELOG.md#L3-L7), [:59](../../../packages/design-system/CHANGELOG.md#L59), [:79](../../../packages/design-system/CHANGELOG.md#L79), [:196](../../../packages/design-system/CHANGELOG.md#L196), [eslint-plugin/index.js:273-323](../../../packages/design-system/eslint-plugin/index.js#L273-L323)                                                                                                           | Cut a version per landed batch, with Breaking, Deprecated, Added and Fixed headings. Add no-deprecated-name entries with a note for the removed layout parts, pointing to Shell.Aside and Shell.Panel, PageHeader and Section.                                                                      |
| TOO-13 | Lint and testing docs disagree with the code: Lint.mdx says use-primitives is an error in the package, which does not enable it (324 reports in 67 kit files, 27 warnings in 20 product files); the table omits three recommended rules; README cites the removed app Storybook on 6006; the `narrow` and `matrix` tags are read by nothing.                               | [Lint.mdx:8-24](../../../packages/design-system/src/stories/docs/Lint.mdx#L8-L24), [eslint-plugin/index.js:760-788](../../../packages/design-system/eslint-plugin/index.js#L760-L788), [:810-812](../../../packages/design-system/eslint-plugin/index.js#L810-L812), [README.md:51](../../../packages/design-system/README.md#L51), [Button.stories.tsx:24](../../../packages/design-system/src/stories/components/Button.stories.tsx#L24)                        | Generate the Lint table from `plugin.configs`. Enable use-primitives in the package with a shrinking allowlist or drop the claim, and ratchet the 27 product warnings to errors. Remove the dead tags and the 6006 line.                                                                            |
| TOO-14 | Most rules have no unit tests, and probes found false negatives: no-kit-shadow misses memo, forwardRef and default exports; footer order ignores AlertDialogFooter and `render` children; the `useDensity()` and `densityScript` entries can never fire; namespace members slip through; a TextLink with neither href nor render passes. No product code hits these today. | [lint-classes.test.mjs](../../../packages/design-system/test/lint-classes.test.mjs), [eslint-plugin/index.js:303-310](../../../packages/design-system/eslint-plugin/index.js#L303-L310), [:584-589](../../../packages/design-system/eslint-plugin/index.js#L584-L589), [:675-688](../../../packages/design-system/eslint-plugin/index.js#L675-L688), [composition-rules.js:212-274](../../../packages/design-system/eslint-plugin/composition-rules.js#L212-L274) | Add valid and invalid fixtures per rule to `test/`, then close each false negative: memo, forwardRef and default exports in no-kit-shadow, AlertDialogFooter and `render` children in footer order, identifiers and namespace members in no-deprecated-name, and a TextLink without href or render. |
| TOO-15 | Stale lint config: the root no-kit-shadow exemption for shell.tsx exempts nothing (CLAUDE.md still calls it the one allowed shadow), LEGACY maps PreviewSplit to itself, a removed part, and `plugin.meta.version` stays 0.1.0, so `eslint --cache` keeps stale results after a rule change.                                                                               | [eslint.config.js:126-130](../../../eslint.config.js#L126-L130), [eslint-plugin/index.js:364](../../../packages/design-system/eslint-plugin/index.js#L364), [:754](../../../packages/design-system/eslint-plugin/index.js#L754)                                                                                                                                                                                                                             | Delete the shell.tsx override and its [CLAUDE.md](../../../CLAUDE.md) mention, remove self-mapped LEGACY entries, and read the plugin version from package.json.                                                                                                                                       |
| TOO-17 | The story setup spies only `console.error`, so Base UI's dev warnings on `console.warn` pass; RecordPicker, ChartBar, ChartArea, ChartScatter, CodeBlock, Gates, Glance, Indicator, Count and Id have no play functions (287 play functions over 610 stories).                                                                                                             | [storybook.setup.ts:294](../../../packages/design-system/test/storybook.setup.ts#L294)                                                                                                                                                                                                                                                                                                                                                                | Also fail on `console.warn` messages that start with "Base UI:" and on React warnings. Add play assertions for RecordPicker selection, chart legend isolation and keyboard choose, and CodeBlock copy.                                                                                              |
| TOO-18 | CI runs test:a11y and test:layout before the app typecheck, lint and test:app in one sequential job, so one axe failure hides app errors; CI pins Node 22 against local Node 26, with no `engines` field.                                                                                                                                                                  | [ci.yml:34-47](../../../.github/workflows/ci.yml#L34-L47)                                                                                                                                                                                                                                                                                                                                                                                             | Split into parallel jobs (package static checks, Storybook tests, app checks and build), or run the fast checks first, and declare `engines`.                                                                                                                                                       |

**Missing in this family:**

- A props reference that includes each part's inherited Base UI contract: agents may only use documented props, and today the docs omit controlled state, form and callback props for every Base UI-backed part (TOO-2). High.
- Dialog size presets on layout tokens: product dialogs each pick a pixel width through style, and the kit's own 520px default is an arbitrary value (TOO-1, TOO-4). Medium.
- A lint rule for design values in style props: style is the one open route around the token rules, and the kit's docs point consumers at it (TOO-4). Medium.
- A touch-emulating Storybook project (`hasTouch`, `isMobile`, coarse pointer, no hover): touch targets and hover-free row actions are being built now, and nothing in CI can assert them (TOO-8). Medium.
- An axe pass in the product browser suites: the only automated accessibility gate covers kit stories, not the composed screens (TOO-10). Medium.

**Already tracked:**

- TOO-16, private layout utilities (`shell-*`, `sticky-bar`, `sticky-rail`, `min-h-work`, `grid-cols-main-rail`, `grid-cols-list-detail`) pass the lint in product code as if public ([eslint-plugin/index.js:228](../../../packages/design-system/eslint-plugin/index.js#L228)): [docs/next.md](../../next.md) "Private CSS shipped as public" (2026-09-05).
