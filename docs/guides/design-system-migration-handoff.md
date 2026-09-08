# Design-system migration handoff

Continue migrating `@ledger/design-system` from the local shadcn Base UI references,
one complete family at a time. **Breadcrumb, Badge, Separator, Skeleton, Kbd,
Button/IconButton, Toggle/ToggleGroup, Switch, RadioGroup, Checkbox, HoverCard, Popover, Tooltip, DropdownMenu, Select and Tabs are complete.**

## Direction and sources

Follow [Component contracts](component-library.md#component-contracts) and the
[package README](../../packages/design-system/README.md). Shadcn is the foundation;
use its Base UI components and public API, then adapt the styling to Ledger tokens.
Useful product options belong on the same component. Keep one component per job and
use existing tokens. Patterns assemble components into workflows or larger regions.

Reference catalogs stay in `src/components/ui/`, `src/components/reui/` and
`src/components/examples/` so they can be refreshed in place. Port source into the
package with relative imports and package `cn`; never import application source.
Product screens consume the package root. Do not refresh the whole reference catalog
as part of a family migration.

Preserve native targets, refs, keyboard/focus behavior, ARIA and render composition.
Document defaults, option interactions and intentional visual differences on the
family page. Inspect consumers before editing and preserve unrelated user changes.
[Repository instructions](../../AGENTS.md) prohibit rewriting published Lovable history.

Completed contracts and migration examples live on their family pages:
[Breadcrumb](../../packages/design-system/src/stories/components/Breadcrumb.mdx),
[Badge](../../packages/design-system/src/stories/components/Badge.mdx),
[Separator](../../packages/design-system/src/stories/components/Separator.mdx),
[Skeleton](../../packages/design-system/src/stories/components/Skeleton.mdx),
[Kbd](../../packages/design-system/src/stories/components/Kbd.mdx),
[Button/IconButton](../../packages/design-system/src/stories/components/Button.mdx),
[Toggle/ToggleGroup](../../packages/design-system/src/stories/components/ToggleGroup.mdx),
[Switch](../../packages/design-system/src/stories/components/Switch.mdx),
[RadioGroup](../../packages/design-system/src/stories/components/RadioGroup.mdx),
[Checkbox](../../packages/design-system/src/stories/components/Checkbox.mdx),
[HoverCard](../../packages/design-system/src/stories/components/HoverCard.mdx),
[Popover](../../packages/design-system/src/stories/components/Popover.mdx),
[Tooltip](../../packages/design-system/src/stories/components/Tooltip.mdx),
[DropdownMenu](../../packages/design-system/src/stories/components/DropdownMenu.mdx),
[Select](../../packages/design-system/src/stories/components/Select.mdx), and
[Tabs](../../packages/design-system/src/stories/components/Tabs.mdx).

Keep RecordHeader's tested separator behavior for empty breadcrumb fragments/arrays.
Badge retains shared Tone and separate Count/Dot/Indicator contracts. The native
Separator, Skeleton and Kbd migrations require no existing consumer edits.

## Integration constraints

Button owns Base UI action behavior and IconButton delegates to it. Keep the small
capture guard: render-child handlers otherwise run before Base UI's disabled guard.
Loading uses the primitive's focusable disabled state. Ledger variants and sizes remain.
Navigation uses `buttonVariants` on real anchors/router Links; Base UI Button gives
rendered targets button semantics, including Space activation. Attachment.Trigger is
an action; attachment navigation uses a styled anchor.

ToggleGroup uses explicit ToggleGroupItem children and Base UI's array selection API.
Keep required single-selection rules in consumer callbacks. DataTable.Presets may have
no selected item when filters match no preset; ModeSwitch with an explicit value and no
callback stays read-only. Groups forward orientation and provide Base UI direction
context from Ledger locale or an explicit dir. Their two package Radix dependencies are
removed; reference catalogs and their dependencies remain refreshable in place.

Switch uses external labels/descriptions and shadcn's `default`/`sm` size names.
Its default span owns the root ref; `id` and `inputRef` target the hidden checkbox.
`nativeButton` moves the ID to a rendered button. Keep Field ARIA binding without
overriding native `required` announcements with undefined values. Native form reset
is caller-owned with the installed Base UI version; the settings story shows controlled
state and an explicit `onReset`. Its package Radix dependency is removed.

RadioGroup uses flat RadioGroupItem exports and external labels/descriptions, including
the program wizard's typed framework selection. Layout uses classes; the installed
Base UI API has no orientation or loopFocus prop. Both arrow axes select and wrap,
with direction supplied through Ledger locale or explicit dir. Item IDs/input refs
target hidden inputs unless nativeButton renders a button. Keep Field binding on the
group and controlled form reset in the caller. Its package Radix dependency is removed.

Checkbox uses external labels/descriptions, boolean checked and separate indeterminate,
including Table.Selection. Mixed select-all controls keep checked=false so activation
selects all. The Indicator reads Base UI state to show a dash even when CheckboxGroup
derives mixed state. Table.Selection stops the visible click; Base UI stops the generated
input click. TaskRow's completion control sits above Item's stretched title target.
Space toggles; Enter can submit the form without toggling. Field binding and caller-owned
form reset remain. The package's Radix Checkbox dependency and old choice-label helpers
are removed.

HoverCard composes flat HoverCardTrigger and HoverCardContent over PreviewCard. Native
links retain their default action; render can also compose the existing table buttons
and focusable spans. Trigger timing is 600/300ms; Content defaults to bottom/center with
4px offsets and 256px width. Existing glances explicitly keep 300px and start alignment.
Root supports generic payloads and cancellable state changes. Content dir overrides
positioning direction as well as popup text. Table.List closes its controlled card when
its action runs. The package's Radix HoverCard dependency is removed.

Popover uses shadcn's flat parts plus Base UI Close. Trigger and Close default to native
buttons and accept render composition. Content has 288px width, bottom/center placement
and 4px side offset; existing picker widths and start/end alignments remain explicit.
Root defaults to nonmodal. With installed Base UI 1.7, focus trapping requires a Close
part inside the popup. Title/Description provide dialog associations; Content owns
initialFocus/finalFocus. Chart cards use Base UI positioners with their own anchors and
retain plot/cell focus return. The package's Radix Popover dependency is removed.
Combobox and Popover share the enclosing-dialog portal lookup while modal wrappers
remain on Radix. Keep fixed positioning for those enclosed popups and the shared
Escape guard so dismissing a nested popup does not also close its parent surface.
Dialog entry animation releases its transform when complete so fixed popups are not
clipped by the rounded frame. DatePicker explicitly restores its trigger after Clear;
its nested-dialog story checks real pointer hit targets as well as focus and dismissal.

Tooltip uses flat Trigger, Content and Provider parts. Provider defaults to zero delay;
Shell and Storybook explicitly preserve 300ms delay/timeout. Without a provider, the
upstream trigger default is 600ms; there is no private fallback provider. IconButton
supplies its own tooltip, so duplicate app-header and Shell-story wrappers are removed.
Trigger render preserves native links/spans without adding button semantics. Its disabled
prop disables the tooltip, so native disabled state belongs on the rendered button.
Base UI 1.7 supplies no automatic tooltip role or described-by association; accessible
names and essential instructions stay independent. Content has a 320px maximum, 4px
offset and decorative arrow. It shares the enclosing-dialog portal and Escape guard.
The package's Radix Tooltip dependency is removed; Recharts tooltips remain unchanged.

DropdownMenu uses shadcn's flat Base UI Menu parts, plus native LinkItem for navigation.
Content defaults to trigger width with a 128px minimum, bottom/start and 4px side offset;
existing callers retain explicit widths. Checkbox/radio items stay open by default;
exclusive saved views, sorting and Editable.Select explicitly close. Group labels belong
inside Group or RadioGroup. Disabled items remain keyboard-focusable but cannot activate.
Submenus use logical inline-end placement. Native props, state callbacks, refs, generic
root payloads and cancellable change events remain upstream contracts. Columns/Settings
custom triggers are ReactElements, matching render composition. The shared menu recipes
remain compatible with Select and Command. The package's Radix DropdownMenu dependency
is removed; reference dependencies remain.

Modal focus restoration resolves disappearing menu items to their stable trigger, including
submenus. Keep the shared enclosed-popup Escape guard and portal lookup until the modal
families migrate. DataTable row actions use opacity so concealed triggers remain tabbable.

Select uses shadcn's ten flat parts over Base UI Select. Root owns generic single/multiple
values and native form props; Trigger binds Ledger Field ARIA without clearing upstream
announcements. Content names its listbox from Field or explicit Content ARIA; decorated
items supply a plain-text label for typeahead. Trigger sizes are default/sm and native style replaces width. Value needs
Root items, a formatter or object conversion for readable labels. Existing app and Forms
callers preserve labels, nullable selection handling and below-trigger positioning.
Content makes List the bounded scroller in either positioning mode. It defaults to
selected-item alignment, trigger width with a 144px minimum and
bottom/center with 4px side offset. It shares the enclosed-dialog portal and Escape guard.
Form reset stays caller-owned. The package Radix Select dependency and now-unused
Radix menuMotion recipe are removed; reference catalogs and dependencies remain.

Tabs now uses shadcn's four flat parts and tabsListVariants over Base UI Tabs. List
owns default/line styling, activateOnFocus (manual by default) and loopFocus. App strips
explicitly retain line styling, full width and automatic activation. Counts and status
badges are ordinary children. ShowPage composes its page root and selected body through
render, preserving the route-controlled value and layout. Root forwards orientation and
locale direction; inactive retained panels remain hidden even with display classes.
The custom underline measurement/observers and package Radix Tabs dependency are removed.

Next candidate: Accordion. Check shadcn's Base UI Accordion source and the installed
contract. Trace Inspector and other consumers before changing compound composition,
single/multiple selection, disabled items, controlled values and panel mounting.

## Completion workflow

Follow [Adding to the kit](component-library.md#adding-to-the-kit): implementation and
affected consumers, representative stories, one accurate family page, changelog and
relevant checks. Keep assertions on useful stories; remove redundant demonstrations
and filler prose as the family is touched. Update this handoff's next selection.

Extend [packed-consumer fixtures](../../packages/design-system/build/consumer-fixture/)
when exports or consumer integration change. These are ordinary files copied into the
temporary installed consumer by [consumer-smoke.mjs](../../packages/design-system/build/consumer-smoke.mjs).
Build the package before running the consumer check.

Only intentional public contract changes need `npm run ds:api:update`; review its diff.
Audit policy notes are optional and `npm run ds:api:matrix` produces ignored reports on
demand. Neither matrix generation nor exhaustive prop prose is routine migration work.

From the repository root, run package/application typechecks, package lint, API/coverage
checks and affected story tests in both modes. Use `npm run test:a11y -w packages/design-system --`
with the relevant story paths. Run package tests and packed-consumer validation for
shared implementation or integration changes; build Storybook and visually review changed
pages. Broaden checks when shared behavior warrants it, and inspect `git diff --check`.
Do not repeat passing checks without later edits or an unresolved concern.

## Latest validation

Tabs package/application typechecks, package lint, API/coverage checks, 15 package tests,
package/production/Storybook builds and packed-consumer checks passed. The application
suite run passed 93 tests with one skipped. Scoped lint on migrated application callers
had no errors and 18 existing hook-dependency warnings. Concurrent application and
DataTable changes were preserved, including their API snapshot entries.

All 56 affected Storybook checks pass in light and dark modes: Tabs, Pages, PreviewSplit,
PreviewRail, RecordHeader and Shell. The four Tabs stories cover manual/automatic
activation, disabled focus, numeric and null selection, cancellation, retained form
state, unmounted panels, refs/render/state callbacks, native links and modified clicks,
orientation, locale direction and narrow-strip scrolling. ShowPage's existing Show story
checks panel association, selection and details-rail restoration after its entrance
animation. A positioned List keeps Base UI 1.7's scroll offsets relative to the strip;
Home/End checks ensure selected tabs remain fully visible in LTR and RTL.

Packed fixtures cover all five value exports and four prop types, native refs, render
composition, numeric selection, RTL/vertical semantics, anchor hrefs, hidden retained
panels and unmounted content. The package Radix Tabs dependency is removed. Coverage
reports 152 exports with stories, 103 family pages and 565 stories, with no gaps.

Built docs, default/line variants, dark RTL/vertical tabs and ShowPage were visually
reviewed. ShowPage retains its 12px root gap, grid/rail structure and exactly one selected
panel. Final built variant and orientation playback finished without component console
errors; the temporary static server initially returned a favicon 404. Review artifacts
were moved outside the repo.
