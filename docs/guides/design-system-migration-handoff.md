# Design-system migration handoff

Continue migrating `@ledger/design-system` from shadcn's Base UI source, preserving Ledger tokens and useful product options. Completed families are Breadcrumb, Badge, Separator, Skeleton, Kbd, Button/IconButton, Toggle/ToggleGroup, Switch, RadioGroup, Checkbox, HoverCard, Popover, Tooltip, DropdownMenu, Select, Tabs, Accordion, Collapsible, Dialog, Sheet, AlertDialog, Command, Progress and ScrollArea.

## Direction and sources

Follow [Component contracts](component-library.md#component-contracts) and the [package README](../../packages/design-system/README.md). Check the current official shadcn Base UI docs **and implementation source**, then verify the API against the installed Base UI version. This batch used shadcn's base-nova registry and Base UI 1.7.0. Match public parts and native composition; adapt styling to existing Ledger tokens. Patterns assemble components into workflows.

Reference catalogs remain in `src/components/ui/`, `src/components/reui/` and `src/components/examples/` so they can be refreshed in place. Port source with relative imports and package `cn`; never import application source into the package. Product code imports the package root. Reference-catalog Radix dependencies remain separate from package implementation dependencies.

Preserve native targets, refs, ARIA, keyboard/focus behavior and render composition. Inspect consumers before editing and preserve unrelated changes. [Repository instructions](../../AGENTS.md) prohibit rewriting published Lovable history. Family pages own detailed usage and migration examples; do not duplicate their prop tables here.

## Integration constraints

- Button keeps its disabled capture guard and focusable loading behavior. Navigation uses `buttonVariants` on real anchors/router Links. Attachment.Trigger is an action; attachment navigation remains a styled anchor.
- ToggleGroup uses array values; required selection belongs in caller callbacks. Checkbox uses boolean checked plus separate indeterminate. Field binding, native input targets and caller-owned reset behavior remain part of the existing control contracts.
- Tabs uses flat parts; List owns manual/automatic activation and default/line styling. Existing application strips explicitly retain line styling and automatic activation. ShowPage keeps its route-controlled layout.
- Accordion uses flat Item/Trigger/Content and array selection in both modes. Collapsible is independent boolean state. Use native render, keepMounted, hiddenUntilFound and data-open/data-closed. The unused legacy disclosure adapters are removed. Item's internal disclosure also uses Base UI, so Section and Stepper share that behavior.
- Dialog, Sheet and AlertDialog now use Base UI. Root owns native open state and cancellable onOpenChange; Content owns native initialFocus/finalFocus, refs and layout. Application bodies, headers, footers, pending guards and widths are explicit compositions. Use a surviving finalFocus target when the opener is removed.
- Sheet defaults to the physical right edge and supports top/right/bottom/left. Ledger additionally accepts logical start/end for existing RTL-aware callers. Existing sheets explicitly retain end placement and their widths. Shared slide utilities use Tailwind's RTL variant: a bare :dir selector was lowered to language-based selectors in production and missed explicit direction overrides.
- AlertDialogAction is a Button, matching shadcn. Successful work closes the caller's controlled root; the Action itself does not close automatically. Cancel is a native Close. Existing confirmations use a Cancel ref for initial focus and cancel dismissal while pending.
- Base UI handles nested popup portals and Escape within its own dialog tree. Do not force these popups inside a dialog DOM node. The shared portal lookup and Radix Escape/focus helpers remain only for Vaul Drawer. Menu-to-dialog and Select/Tooltip/Combobox/DatePicker integrations retain focus and hit-target checks.
- Command intentionally remains cmdk, as in shadcn's Base UI source. CommandDialog uses Base UI Dialog and an explicit Command child. Flat parts retain CommandLoading/Footer/Count. Put loading content alongside the listbox. Supply a Close control when showCloseButton is false; CommandPalette/RecordPicker use their Escape hint as a button.
- Progress uses native numeric/null values, ranges, labeling and value formatting. Ledger retains tone/size and the separate ProgressStacked coverage bar. The standard Progress composes its own Track/Indicator. ScrollArea composes its native viewport/default vertical bar; add ScrollBar for horizontal scrolling and use viewportProps for scrolling-element refs/events/ARIA.

The package's direct Radix Dialog, AlertDialog, Collapsible, Progress and ScrollArea dependencies are removed. Radix Slot remains in parts that expose asChild; cmdk and Vaul can retain transitive Radix dependencies.

## Next candidates

Avatar already uses Base UI but still exposes the earlier Ledger shorthand/compound contract. Check shadcn's Avatar parts and migrate that family next. Combobox also already uses Base UI but has a larger configured API and experimental composition surface; reconcile it with shadcn in its own bounded batch. Drawer should follow shadcn's actual implementation, which currently uses Vaul; do not replace a dependency merely to remove the word Radix from the lockfile.

## Completion workflow

Follow [Adding to the kit](component-library.md#adding-to-the-kit): implementation and affected consumers, representative stories, one accurate family page, changelog and relevant checks. Keep assertions on useful examples and remove duplicate stories/filler as a family is touched.

Extend the [packed-consumer fixtures](../../packages/design-system/build/consumer-fixture/) when exports or consumer integration change. Build the package before `npm run test:consumer -w packages/design-system`; packing deliberately skips lifecycle scripts. The fixtures check installed declarations, SSR, the Vite production bundle and consumer CSS without workspace aliases.

Only intentional public contract changes need `npm run ds:api:update`; review its diff. Policy notes are optional. Matrix reports remain ignored and generated on demand.

Run package/application typechecks, lint, API/coverage checks and relevant stories in both modes. Shared behavior can justify the full Storybook suite. Run package tests, the packed consumer, production/Storybook builds and visual review. Inspect `git diff --check`; preserve concurrent application work and report any unrelated validation failures separately.

## Latest validation

The batch passed package/application typechecks, package lint, API/coverage checks, package and production builds, Storybook build and the installed-tarball consumer check. Package tests passed 15 tests; the final application run passed 106 with one skipped. The full Storybook run passed 1,104 checks across 220 light/dark files; the final sheet/confirmation and picker rerun passed another 24 checks. Coverage reports 201 exports with stories, 103 family pages and 552 stories, with no gaps. Scoped application lint has no errors and 24 warnings for existing layout/hook patterns.

Built dialogs and confirmations were reviewed at 375px, alongside dark RTL sheets, Progress ranges/indeterminate state, native PageDown scrolling and RecordPicker filtering/dismissal. All seven built family pages rendered without console errors. Visual review caught and fixed production RTL motion and asynchronous focus/visibility assertions. Temporary browser artifacts were moved outside the repository. Concurrent application work was preserved; these edits do not imply a commit or release.
