# Layout composability audit

2026-09-13. The layout layer of `@ledger/design-system`: `src/layout/shell.tsx`, `slots.tsx`, `storage.ts`, `page-header.tsx`, `section.tsx`, `page-skeleton.tsx`, `index.ts` and `src/styles/layout.css`, with the Layout stories as the record of how the parts compose. Measured against the package's own conventions (parts over configuration props; every part forwards native props and refs; polymorphism through Base UI `render`; no `Children` introspection; the smallest useful contract; layout contracts as CSS variables) and against Atlassian's navigation system, which the Shell is modelled on.

The same day the panel became the full height of the window and the Shell stories moved under Layout; the fixes below marked **done** shipped with that batch. Everything under **decisions** changes a public shape and waits for Josef.

## Done in this batch

1. **Dead selectors.** The Ctrl+[ guard, the flyout's hold and its click-outside test looked for `data-state="open"` and `[data-radix-popper-content-wrapper]`, attributes only Radix emitted and the kit no longer has. They read Base UI's `data-open`, `data-popup-open` and the kit's `data-slot="…-portal"` now. Before this the shortcut fired inside an open dialog and a menu opened from the flyout closed the flyout under itself.
2. **A remembered-collapsed side nav could not fly out.** `applyShell` put `data-shell-sidenav="collapsed"` back on the root after every change, and the before-paint rule it drives is unlayered `display: none`, which beats the flyout's utilities. The app runs with `persist`, so this was live. React removes the attribute once it has restored the state; the head script sets it again before the next paint. The Remembered story covers it.
3. **`TopNav.End` introspected its children.** `Children.toArray` wrapped whatever it found in `<li>`, so a component returning a fragment of four buttons became one list item, and the same elements were rendered twice for the fold. It renders its children as given inside a named group now. The fold below `md` is unchanged (see decisions).
4. **`defaultWidth` reset a dragged width on every mount.** Both SideNav's and Panel's `defaultWidth` ran in an effect with `[]`, so a panel re-mount clobbered the width the reader dragged or the browser remembered, and under `persist` the stored panel width never survived a consumer that sets a default. They apply only while no width is set, in a layout effect so the column does not open at one width and jump to another.
5. **Listeners.** SideNav assigned `onCollapse`/`onExpand` onto the shared context object on every render, never cleared them, and wrote them onto the detached stand-in when rendered outside a Shell. They register with dependencies, clear on unmount, and skip the stand-in.
6. **Panel header.** The built-in header is the top nav's height, so beside it the two hairlines are one line; a wrapping title still grows it.
7. **Small things.** The comment above `PEEK_CLOSE_DELAY` described a constant that no longer exists; `ShellProps` omitted Aside from the order; the compact query was `79.999rem` beside CSS that says `width < 80rem` (now one named constant); the aside layout rules keyed on the `aside` element while the panel rules keyed on `data-shell-area` (both key on the attribute); the Shell story drew a second header and close button inside the panel instead of using the panel's own.

## Decisions, all taken the same day

Josef agreed to every item below on 2026-09-13 and they shipped in the second batch of the day. The text keeps the shape each took so the reasoning stays with it; the status line on each says what landed.

### 1. `Shell.Panel` is a monolith beside a parts-based `SideNav`

**Landed.** `Panel.Header`, `Panel.Title` (`render` for the level, names the landmark), `Panel.Actions`, `Panel.Close`, `Panel.Body`, `Panel.Splitter`; `title` and `actions` still render the built-in header. See Layout/Shell's Composed panel.

`Shell.Panel` bakes in the header (title, actions, close), the splitter and a padded body, and takes `title`, `label`, `actions`, `onClose`, `defaultWidth` as configuration. `SideNav` next to it is `Header`/`Body`/`Footer`/`Section`/`Item`/`Splitter`. Consequences: the resize and close labels cannot be localised or observed (`ShellSplitterProps` is exported but the panel's splitter is unreachable); the body padding cannot be removed; `title` shadows the native attribute, against the Alert precedent; the accessible name is always the visible title.

Proposed, additive: `Shell.Panel` stays the area (placement, Escape, focus return, context with `onClose` and the title id) and gains `Panel.Header`, `Panel.Title` (h2 by default, `render` for another level), `Panel.Actions`, `Panel.Close`, `Panel.Body`, `Panel.Splitter`. The props keep working as sugar: when `title` or `actions` is given the root renders the built-in Header, Body and Splitter exactly as today. The seven app consumers (`requirements-table`, `library-controls`, `assessment-browser`, `assessment-campaign`, `package-views`, `catalog`, `vendors`) do not change.

### 2. Half the parts forward nothing

**Landed.** Every part forwards native props and its ref, stamped `data-slot`; `Profile` renders through `useRender` and is a menu's trigger in Layout/Shell's Forwarding; `role` is a deprecated alias of `description`.

`Main`, `Aside`, `Panel`, `AppLogo` and `SideNav.Item` forward native props and refs. `Shell`, `Banner`, `TopNav` and its three slots, `SideNav` and `Header`/`Body`/`Footer`/`Section`, `Expandable`, `ToggleButton`, `AppSwitcher`, `Profile`, `Mark` and `PageSkeleton` accept a handful of named props and drop the rest. Two of these block real composition: `Profile` and `AppSwitcher` cannot be a `DropdownMenuTrigger` or `PopoverTrigger` `render` target, so an account menu has to be built around them.

Proposed, additive and mechanical: type each as `ComponentProps<…>` (with `Omit` where a shorthand such as `label` exists), spread the rest after the defaults as `Main` does, `data-slot="shell-…"` on each, `Profile` through `useRender`. One hazard: `ProfileProps.role` is the person's job title and collides with the ARIA attribute the moment native props are forwarded; rename to `description` with `role` kept as a deprecated alias for a release. This is one pass and the public API file regenerates with it; it needs a go because it touches every part's type.

### 3. `PageHeader`'s grid contract is implicit

**Landed.** `PageHeader.Lead` and `PageHeader.Heading`; `.page-header` is a `@utility`. The stories moved onto them; the app's nine files still work and can move when touched.

`.page-header` is `minmax(0, 1fr) auto`, so only one element may sit in the first column per row: consumers wrap Title and Description in a `div` (with or without `min-w-0`, the stories disagree) and hand-write `col-span-full` on a breadcrumb or category line. Nine of the app's twenty-four PageHeader files carry that class.

Proposed, additive: `PageHeader.Lead` (spans both columns, `render` for a Breadcrumb) and `PageHeader.Heading` (the first-column group). Existing wrappers keep working; the docs switch to the parts. The template moves from a bare `.page-header` rule to a `@utility`, which is what the file's own preamble says it is for.

### 4. `Section` is props-configured beside a composable `PageHeader`

**Landed.** `Section.Header`, `Section.Heading`, `Section.Title`, `Section.Description`, `Section.Actions`; `title` is optional. See Layout/Section's Composed.

`title`, `count`, `description`, `action`, `divided`; the heading is always an `h2`, so a Section inside a Panel (whose heading is an h2) flattens the outline, and there is no room for a badge other than `Count` or for two actions. `title` shadows the native attribute. Eighty-one app call sites, six with `count`, one with `action`, none with `description`.

Proposed, additive: `Section.Header`, `Section.Title` (`render` for the level), `Section.Description`, `Section.Actions`, with the props kept as sugar. Native `title` comes back only when the sugar retires.

### 5. `TopNav.End` folds its children into More by rendering them twice

**Landed as the third option.** The fold is gone and `moreLabel` with it; the app's shell renders a More menu below `md` with the same three actions.

Below `md` the same children mount again inside a Popover, so a stateful child such as `ModeSwitch` exists twice while it is open, and a consumer `id` duplicates. Options: keep and document; a `TopNav.More` part the consumer fills separately; or drop the fold (Atlassian's shape) and let the product render its own narrow-screen menu.

### 6. The toggle is a prop of `TopNav.Start`

**Landed.** The button places itself through `.shell-topnav-start > [data-slot="shell-sidenav-toggle"]`; `toggle` stays as sugar.

`toggle={<SideNav.ToggleButton />}` exists only so the slot can move it to the end of the row while the side nav is inline. `ToggleButton` already knows that state and can position itself as a plain child; `toggle` would stay as sugar.

### 7. Breakpoints live in four places

**Landed.** `dimension.breakpoint.{md,lg,aside,panel,wide}`; the build writes them as literal `--breakpoint-*` theme keys, `layout.css` reads `theme(--breakpoint-panel)`, the shell reads `tokenValue("dimension.breakpoint.panel")`, and `panel:`-style variants exist. Metrics lists them.

`(min-width: 64rem)` and `(width < 80rem)` in the shell, `lg:` and `md:` classes, `64/75/80/110rem` in `layout.css`, and `1200/1280/1760px` in the docs. A `breakpoint` token group would give the CSS, the JS and the docs one source; it touches the token pipeline, so it is its own step.

### 8. Smaller shapes

**Landed**, all but the z-index token group: `Shell.Mark` forwards; the helper is `AreaPortal` and the panel's focus effect runs only inside a Shell; the splitter measures its area; Main carries `data-shell-area`; side nav icons take an element; sections are labelled by their eyebrow; the stacking order is three variables on `.shell-root`; the shell's strings are locale messages.

- `Shell.Mark` is a default value exported as a part with no props; give it `ComponentProps<"span">` or drop it from the compound and document `mark` on `AppLogo`.
- The `Slot` helper in `slots.tsx` shares a name with the Radix part the package removed; rename internally. `Shell.Panel` outside a Shell still runs its focus effect; guard it on being inside one.
- `Splitter` measures `parentElement`, so it must be a direct child of its area; measure `closest("[data-shell-area]")`.
- Main is found by the `.shell-main` class while every other area has `data-shell-area`; add the attribute.
- `SideNav.Item` and `Expandable` take an icon constructor (`icon={ShieldCheck}`) where every other icon slot in the kit takes an element; a union is additive, and the two duplicated icon types should be one exported type.
- `SideNav.Section` names its group with `aria-label={heading}` while the visible Eyebrow could carry the id for `aria-labelledby`.
- z-index is a hand-kept ladder across two files (30 chrome, 40 scrim, 50 flyout and every popup); variables on `.shell-root` would state the order.
- English strings in the shell and the skeleton (`Skip to`, `Close side navigation`, `Resize details`, `Close details`, `Loading`) sit beside a `lib/locale`; the Panel parts remove the two worst.

## What is still open

Nothing. The deep-dive that followed the same day (`layout-followup-plan.md`) found only residue, and all three of its batches landed the same evening: see that plan's Landed section. The deprecated `Profile.role` alias and `SideNavSlotProps` go at the next minor.
