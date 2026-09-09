# Design-system migration handoff

Continue migrating `@ledger/design-system` from shadcn's Base UI source, preserving Ledger tokens and useful product options. Completed families are Breadcrumb, Badge, Separator, Skeleton, Kbd, Button/IconButton, Toggle/ToggleGroup, Switch, RadioGroup, Checkbox, HoverCard, Popover, Tooltip, DropdownMenu, Select, Tabs, Accordion, Collapsible, Dialog, Sheet, AlertDialog, Command, Progress, ScrollArea, Avatar, Input, Textarea, InputGroup, Combobox, Field, Alert, ButtonGroup, Drawer, Calendar/DatePicker, Pagination, Resizable, Card, Empty and Spinner. Toaster’s Sonner wrapper cleanup is also complete.

## Direction and sources

Follow [Component contracts](component-library.md#component-contracts) and the [package README](../../packages/design-system/README.md). Check the current official shadcn Base UI docs **and implementation source**, then verify the API against the installed Base UI version. This batch used shadcn's base-nova registry and Base UI 1.7.0. Match public parts and native composition; adapt styling to existing Ledger tokens. Patterns assemble components into workflows.

Reference catalogs remain in `src/components/ui/`, `src/components/reui/` and `src/components/examples/` so they can be refreshed in place. Port source with relative imports and package `cn`; never import application source into the package. Product code imports the package root. Reference-catalog Radix dependencies remain separate from package implementation dependencies.

Preserve native targets, refs, ARIA, keyboard/focus behavior and render composition. Inspect consumers before editing and preserve unrelated changes. [Repository instructions](../../AGENTS.md) prohibit rewriting published Lovable history. Family pages own detailed usage and migration examples; do not duplicate their prop tables here.

## Integration constraints

- Button keeps its disabled capture guard and focusable loading behavior. Navigation uses `buttonVariants` on real anchors/router Links. Attachment.Trigger is an action; attachment navigation remains a styled anchor.
- ToggleGroup uses array values; required selection belongs in caller callbacks. Checkbox uses boolean checked plus separate indeterminate. Explicit Field associations, native input targets and caller-owned reset behavior remain part of the existing control contracts.
- Tabs uses flat parts; List owns manual/automatic activation and default/line styling. Existing application strips explicitly retain line styling and automatic activation. ShowPage keeps its route-controlled layout.
- Accordion uses flat Item/Trigger/Content and array selection in both modes. Collapsible is independent boolean state. Use native render, keepMounted, hiddenUntilFound and data-open/data-closed. The unused legacy disclosure adapters are removed. Item's internal disclosure also uses Base UI, so Section and Stepper share that behavior.
- Dialog, Sheet and AlertDialog now use Base UI. Root owns native open state and cancellable onOpenChange; Content owns native initialFocus/finalFocus, refs and layout. Application bodies, headers, footers, pending guards and widths are explicit compositions. Use a surviving finalFocus target when the opener is removed.
- Sheet defaults to the physical right edge and supports top/right/bottom/left. Ledger additionally accepts logical start/end for existing RTL-aware callers. Existing sheets explicitly retain end placement and their widths. Shared slide utilities use Tailwind's RTL variant: a bare :dir selector was lowered to language-based selectors in production and missed explicit direction overrides.
- AlertDialogAction is a Button, matching shadcn. Successful work closes the caller's controlled root; the Action itself does not close automatically. Cancel is a native Close. Existing confirmations use a Cancel ref for initial focus and cancel dismissal while pending.
- Base UI handles nested popup portals and Escape within its own dialog tree. Do not force these popups inside a dialog DOM node. Drawer now participates in that same tree; the shared portal lookup and Radix Escape/focus helpers are deleted. Menu-to-dialog and Select/Tooltip/Combobox/DatePicker integrations retain focus and hit-target checks.
- Command intentionally remains cmdk, as in shadcn's Base UI source. CommandDialog uses Base UI Dialog and an explicit Command child. Flat parts retain CommandLoading/Footer/Count. Put loading content alongside the listbox. Supply a Close control when showCloseButton is false; CommandPalette/RecordPicker use their Escape hint as a button.
- Progress uses native numeric/null values, ranges, labeling and value formatting. Ledger retains tone/size and the separate ProgressStacked coverage bar. The standard Progress composes its own Track/Indicator. ScrollArea composes its native viewport/default vertical bar; add ScrollBar for horizontal scrolling and use viewportProps for scrolling-element refs/events/ARIA.

- Avatar uses flat Image/Fallback/Badge/Group/GroupCount parts. Callers supply fallback content and native accessible names; Person remains the avatar-plus-name composition. avatarInitials and avatarHue preserve existing product identity formatting. Group members and overflow counts belong to callers.
- Input wraps Base UI Input; Textarea stays native, following shadcn. Input supports native refs/render/state callbacks and cancellable onValueChange. Both accept explicit Field label/message associations. InputGroup owns the shared field border and composes Addon/Text/Button/Input/Textarea parts; addons can contain accessible actions and block headers/footers.
- Combobox has one generic root with native selection/query/form behavior. ComboboxInput renders the shared InputGroup through Base UI InputGroup so the entire control anchors the popup; anchoring only its inner input produced a ResizeObserver loop inside animated dialogs. Use ComboboxChipsInput for multiple selection and useComboboxAnchor for the chips container. Form reset remains caller-owned. Both input shapes retain data-combobox-input for integration identification.
- NativeSelect is removed from the package. Existing form/filter callers use Select/Trigger/Value/Content/Item, with Root items supplied for closed labels and nullable onValueChange callbacks. Trigger owns blur/ARIA/size/style. Refreshable reference catalogs remain separate.

The package's direct Radix Dialog, AlertDialog, Collapsible, Progress and ScrollArea dependencies are removed. Radix Slot remains in parts that expose asChild; cmdk can retain transitive Radix dependencies. Vaul is removed from the package; the application reference catalog’s dependencies remain untouched.

- Field uses shadcn's native Field/Label/Description/Error/Set/Legend/Group/Content/Title/Separator composition. The binding context, child cloning and useFieldControl are removed. Callers supply stable IDs, labels, descriptions, invalid and required announcements on the actual control. TanStack owns validation and submission. Custom controls forward native props; grouped choices keep their individual names.
- Alert uses flat Title/Description/Action exports, native div props and shadcn default/destructive variants with Ledger tone. Existing callers explicitly retain their announcement roles and tone; new roots default to role=alert. Ledger actions stay in normal flow.
- ButtonGroup uses native div props/ref, horizontal/vertical orientation and flat Text/Separator parts. Text uses Base UI useRender/mergeProps. Horizontal corners use logical edges.

- Drawer uses current shadcn Base UI parts, measured swipe/snap/stack CSS and native focus/cancellable open changes. Root supports payload handles; Content forwards native props/ref/render/class callbacks. Popup defaults to focus on itself, matching Base UI; use initialFocus for a specific field/action. The native popup tree replaces the old Vaul containment, Escape and restoration bridge across all overlays and charts.
- Calendar keeps React DayPicker and exports CalendarDayButton. Default component identities are stable across selection changes; week-number cells are native row headers. Preserve provider-localized date-only formatting and native locale/component/formatter overrides. DatePicker remains the ISO single-date form convenience around Button + Popover + Calendar, including external forms and caller-owned controlled reset.
- Pagination has flat nav/list/item/link/previous/next/ellipsis parts. Base UI 1.7 Button imposes role=button and Space activation on rendered anchors, so PaginationLink uses buttonVariants on a real anchor. In-memory DataTable paging uses native Buttons in the internal pagination pattern; page algorithms and summaries are not part of the primitive.
- ResizablePanelGroup/Panel/Handle forward react-resizable-panels props, element refs and imperative refs. Numeric sizes now mean pixels; former percentage numbers are migrated to explicit percent strings. Persistence uses upstream useDefaultLayout at the consuming composition, preserving stable IDs/storage keys. PreviewSplit retains 55% list minimum and 26% rail default bounded at 18–45%.

- Card and Empty now live in components with flat native div parts/refs. CardTitle leaves heading level to callers; migrated headers retain h2 children. Preserve the raised-surface CSS variable for sticky tables. Empty retains its framed/default and compact layouts; top-level media spans the compact message/actions without cloning icons. Related and DataTable retain their own empty-message options and compose these parts.
- Spinner forwards native SVG props/ref and explicit ARIA overrides while retaining size, appearance, localization, decorative behavior and its latched reveal delay. Toaster forwards Sonner props/ref; partial icons, toastOptions.style and per-part classNames preserve unspecified defaults. Stories use independent toaster IDs, with real live toasts rather than copied DOM or singleton bookkeeping.

## Next candidates

TextLink and Shell navigation are the two remaining direct Radix Slot import sites. Migrate their asChild composition to Base UI useRender/mergeProps while retaining native link behavior and Shell layout.

Source correction: shadcn's current main Toast docs and toast.tsx use Base UI Toast; the separate sonner.tsx still exists. This batch implements the explicitly requested Sonner passthrough cleanup. A full Toast-manager migration remains a separate candidate and should update toast call sites, undo/promise behavior and popup/focus integration together.

Review Item, Table, Chart and larger Shell compositions only for concrete duplication or contract problems. Their product behavior is intentional. Missing catalog families such as Slider, ContextMenu, Menubar and Carousel are optional additions driven by an application need, not migration debt.

## Completion workflow

Follow [Adding to the kit](component-library.md#adding-to-the-kit): implementation and affected consumers, representative stories, one accurate family page, changelog and relevant checks. Keep assertions on useful examples and remove duplicate stories/filler as a family is touched.

Extend the [packed-consumer fixtures](../../packages/design-system/build/consumer-fixture/) when exports or consumer integration change. Build the package before `npm run test:consumer -w packages/design-system`; packing deliberately skips lifecycle scripts. The fixtures check installed declarations, SSR, the Vite production bundle and consumer CSS without workspace aliases.

Only intentional public contract changes need `npm run ds:api:update`; review its diff. Policy notes are optional. Matrix reports remain ignored and generated on demand.

Run package/application typechecks, lint, API/coverage checks and relevant stories in both modes. Shared behavior can justify the full Storybook suite. Run package tests, the packed consumer, production/Storybook builds and visual review. Inspect `git diff --check`; preserve concurrent application work and report any unrelated validation failures separately.

## Latest validation

Card, Empty, Spinner and Toaster passed all 26 focused story checks and the complete 1,062-check Storybook suite in both themes (218 files). Package/application typechecks, package lint, API/coverage checks, package/production/Storybook builds and the packed consumer passed. Package unit tests passed 15; application tests passed 165 with one skipped.

Coverage reports 271 exports with stories, 102 family pages and 531 stories, with no gaps. After visual review fixed Sonner’s mobile RTL overflow, all eight final Toaster story checks passed. The four touched family pages each use five focused sections. Card/Empty are under Components. Visual review covered narrow Card/Empty layouts, dark mode, explicit RTL roots, native Toaster options and all four documentation pages. Packed-consumer fixtures cover the flat exports, native refs/props, SSR markup, raised surfaces, SVG naming and the production bundle.
