# Ledger: the design system

Ledger is the product design system. It is a package, `@ledger/design-system`, at
`packages/design-system`, and the prototype is its first consumer. Its Storybook is the contract:
maintained catalog components are exercised in stories, each family has a documentation page, and
`npm run build` checks that coverage. Matrices are useful when variants need comparison.
This guide says how the package is shaped and how a screen uses it. The reasoning lives in the specs
under `docs/superpowers/specs/`, and the parts document themselves in the package's Storybook
(`npm run storybook` inside the package, port 6007).

## Layers

The folders separate presentation, application layout and reusable interaction. Components and primitives do not import patterns or layout; patterns may compose layout parts. The application owns routing, data and domain decisions.

| Layer       | Folder                                       | Responsibility                                                                                        |
| ----------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Tokens      | `tokens/`, `src/generated/`                  | Shared values and generated utilities.                                                                |
| Primitives  | `src/primitives/`                            | Spacing, alignment and type: Box, Stack, Inline, Flex, Grid, Bleed, Text, Heading and VisuallyHidden. |
| Components  | `src/components/`                            | Controls and display families built from shadcn Base UI foundations.                                  |
| Layout      | `src/layout/`                                | Shell regions, PageHeader, Section and PageSkeleton.                                                  |
| Patterns    | `src/patterns/`                              | Repeated interactions: DataTable, RecordPicker, Composer, Editable, Inspector and coordinated charts. |
| Mode        | `src/mode/`                                  | Colour mode, storage and the before-paint script; it re-exports LedgerProvider from `src/lib/`.       |
| Application | `src/routes/`, `src/components/`, `src/lib/` | Persistent product navigation, route content, permissions, data and workflows.                        |

Editable, Gates, Toolbar and the Chart recipe family live in `src/patterns/`. They own inline-save recovery, readiness checks, search/filter/action layout, and chart exploration/export respectively. Chart remains Recharts-based, as in [shadcn’s chart source](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/chart.tsx); the Ledger family adds coordinated views and actions. Toolbar is the tab-navigated search row, distinct from [Base UI’s arrow-navigated Toolbar](https://base-ui.com/react/components/toolbar). Public imports still come from `@ledger/design-system`.

Stepper, Timeline, Stat, Attachment, Banner, CodeBlock and KeyValue remain components. They describe a step sequence, event feed, metric, file, message, code display or fact; they do not own a wizard, upload service or record workflow. Composing small parts alone does not make a component a pattern.

Inspector, ActionBar and WorkPane live with the patterns; Block is replaced by the layout Section. Inspector has its own page. ActionBar and WorkPane have no stories or page (`RETIRED_STORY_EXPORTS` in `scripts/ds-check.mjs`), so no render, accessibility or layout check reaches them: the application's control and parameter pickers use WorkPane, and nothing uses ActionBar. Do not start a new use of either; a screen that needs one raises it first.

The application's components and routes assemble these. A domain concept with one visual
representation (a status, a record link, an identifier) gets one application component that binds
its vocabulary to a kit part, from one map in the domain layer, and every screen uses it; a screen
keeps no tone map of its own. Application code never declares a primitive or a copy of a kit part;
the lint (`ledger/no-kit-shadow`) names the kit part to import instead.

Event kinds, task states and the mention format belong to the product, not the kit. Ledger owns
the reusable Composer and TaskRow patterns, and Timeline.Item supplies the feed item: the
application supplies suggestion identities, insertion text and task status content. Package
stories cover these neutral contracts; the application's compositions are verified in the running
app, never in a story (the package Storybook is the only one).

## Importing

Product code imports the package's root, never a file inside it:

```ts
import { Badge, Table, Id, Indicator, PageHeader, Shell, ModeSwitch } from "@ledger/design-system";
```

The stylesheet is three imports after Tailwind, in this order, and optionally a fourth,
`fonts.css`, for the self-hosted Geist faces the type tokens name:

```css
@import "tailwindcss" source(none);
@source "./src";
@import "@ledger/design-system/reset.css";
@import "@ledger/design-system/ledger.css";
@import "@ledger/design-system/base.css";
@import "@ledger/design-system/fonts.css";
```

Hooks that belong with parts live in the package too: `useSort` and `usePage` for a Table,
`useCommandPalette` for the ⌘K palette, `useSideNav` for the shell. A product keeps no copy of
anything generic; the prototype is the test vehicle, and when it
breaks the system is what gets fixed.

The package has no router. `BreadcrumbLink` takes a router link through `render`.
Navigation with button styling is a `LinkButton` (or `LinkIconButton` for an icon alone) with the
router's Link through `render`. TextLink and Shell navigation use `render`, while Item accepts a
link element as a prop.
Custom rendered elements must accept the merged attributes, handlers and ref.

## Component contracts

Start with the local shadcn Base UI components in `src/components/ui/`, reuse their primitives,
composition and accessibility behavior, and adapt them to the product. Shadcn is the foundation;
its API is not a ceiling. Extend the same component with useful options when the product needs
them, keeping one clear component for one job. A status badge is `Badge`.

Keep `src/components/ui/`, `src/components/reui/` and `src/components/examples/` in their
installer locations as reference material so they can be refreshed or reinstalled. Product
screens consume `@ledger/design-system`; the references are source material for migrating its
families to shadcn/Base UI. Their presence is intentional, not a second product component library.

Use native props and refs, familiar component names and explicit composable parts. Preserve
keyboard, focus, ARIA and `render` behavior when extending a component. Spread props in one
order in every part: the part's defaults first (a default `aria-label`), then the consumer's
props, then the part's identity last (`data-slot`, a landmark role, the `id` and `tabIndex` a
skip link needs, the accessible name the part computes from its own props), so a stray prop
cannot un-landmark an area; merge `className` with `cn` and, in a `render` part, pass the
consumer's props to `mergeProps` first for the same effect. Spell every optional prop
`?: T | undefined`: the package has `exactOptionalPropertyTypes` on, and `label={maybe}` must
typecheck. Document defaults,
interactions between options and intentional visual differences in the same component's page.
Port source with relative imports and package `cn`; never import application source into the
package. Use Ledger tokens for styling and keep the existing layer boundaries.

Patterns assemble repeated interactions, such as record selection or inline editing. Options
for one component, such as Badge's status tone, size and icon, belong on that component.

Family pages in Storybook own each component's current API, defaults, integration examples and migration guidance. Keep shared rules here; keep release changes in the [changelog](../../packages/design-system/CHANGELOG.md). The [handoff](design-system-migration-handoff.md) records completed migration work and remaining integration risks.

## Naming

- **Standard component names.** Preserve shadcn's flat named exports for migrated families,
  such as `BreadcrumbItem` and `BreadcrumbLink`. Existing compound APIs remain until their
  family migrates. Custom patterns can name their own parts by role.
- **Meaningful custom names.** A custom name says what the thing is: `Id` marks an identifier.
  Use full words and avoid naming a component after its current visual treatment.
- **One name per idea.** Two components that do one job become one. `Tabs` absorbed `TabStrip`;
  `RailGroup` became `Inspector.Group`.
- **No domain words in the kit.** Severity, finding, control and requirement live in routes and
  `lib`. The kit knows tones, identifiers and values.
- **Extend components deliberately.** Keep native DOM names and composition behavior,
  and add useful product options to the same component. Existing Ledger axes retain their documented meanings
  until migrated: sizes include `xsmall`, `small`, `medium`, `large`; tones describe
  `neutral`, `information`, `success`, `warning`, `danger`, and `brand` where supported.

## What the lint enforces

The package ships an ESLint plugin with two presets: `package` for its own code, `recommended` for
every product. A product's own config adds nothing about the kit, apart from the two opt-in product
layout rules this application turns on for its product files. The [product pattern contract](product-patterns.md) selects application workflows and named exceptions.

Every rule, what it reports, what to write instead and which preset turns it on is one table, on the
Storybook's [Lint rules](../../packages/design-system/src/stories/docs/Lint.mdx) page (Guidance/Lint
rules, also in `packages/design-system/llms.txt`). Change that table with the rule.

The kit's own structural utilities, defined on tokens in `src/styles/`, pass `ledger/no-non-token-class` by name; the `structural` list in `eslint-plugin/index.js` holds them all. The ones that carry a responsive or touch rule:

- `page-header` (layout.css): PageHeader's row; the heading keeps a 14rem measure, and actions that do not fit beside it take the next row, at the end.
- `section-header` (layout.css): Section.Header's row, on the same rule at body size with a 12rem measure, or the heading's own width when that is shorter.
- `touch-target` (touch.css): an invisible hit area at least 24px square, centred on a control, wherever any pointer is coarse; pair it with `relative`.
- `touch-target-block` (touch.css): its band twin, the control's own width and at least 24px tall, for an inline link that wraps; `touch-target-block-after` draws it on `::after` where `::before` is taken.
- `stat-grid`, `stat-grid-2` to `stat-grid-6` (stat.css): Stat.Grid's columns from its own width, folding in balanced steps with each tile at least 128px.

## Pattern direction

Record screens should make state, ownership and the next action visible before background detail. The requirement record is the first application reference: attention items lead to work, assessment results have a clear status, evidence opens as an artifact, and activity and provenance have their own views. Preserve the full requirement statement and audit information without repeating it across the header, body and rail.

Use list or board views for queues, labelled properties for ownership and status, and explicit editing actions for completing work. Linear's [display options](https://linear.app/docs/display-options), HubSpot's [record composition](https://knowledge.hubspot.com/object-settings/customize-records) and Salesforce's [record workspaces](https://trailhead.salesforce.com/content/learn/modules/lightning-experience-for-salesforce-classic-users/work-with-your-data) are references for this direction. Choose the layout around the work the user is doing; adding cards alone does not create a workflow.

The root route mounts `AppLayout` once around its outlet. Routes compose `PageHeader`, primitives, controls and `TabsContent` in Main. `Shell.Aside` contributes supporting properties and `Shell.Panel` contributes selected-record or task content to stable destinations outside Main. React portals preserve route context, and route unmount removes the contribution; these slots render after client mount. Keep at most one contribution per region in the active route tree.

Control and requirement content lives in `src/components/prototype/`; `record-preview.tsx` owns shared application preview navigation and destinations. Full-record routes and collection previews consume the same feature content, editors and action rules; each caller supplies its header and properties placement. Routes own `PageHeader`, `Shell.Aside` and `Shell.Panel`. Keep domain workflow out of the design-system package. Record names are full-record links; the eye opens the preview. Selected record, control scope and work tab live in route search parameters so Back, Forward and refresh reproduce the view. Tabs use separate `keepMounted` panels to retain drafts while changing tabs; changing records or leaving the view ends the local editing session.

Aside follows Main below 1200px and sits beside it above that. A Panel is inline from 1280px, the full height of the window, with the banner and the top nav stopping at its edge; below that it replaces the visible work area under the top nav while Main remains mounted. With both regions present, Aside follows Main until 1760px. Main uses document scrolling; Panel scrolls within the available viewport. Resizing, Escape, visible close and focus return belong to Panel. Use Base UI Sheet when the task needs modal focus containment.

A collection preview's outer panel bar is navigation only: it composes `Shell.Panel.Header`, `Panel.Actions` holding [PreviewNavigation](../../packages/design-system/src/stories/patterns/PreviewNavigation.mdx) (previous, next, the announced position and an open-in-new-tab link to the full record), Back for a nested frame, and `Panel.Close`. The record's visible name and its actions are an inner `PageHeader` at the start of `Panel.Body`, its title an h2. Navigation follows the table's current filtered, sorted and expanded rows. For linking many related records, use [RecordBrowser](../../packages/design-system/src/stories/patterns/RecordBrowser.mdx): a large dialog with table search, filters, multi-selection and an internal preview. Application adapters supply eligible records and relationship rules. Previewing is independent of selecting; confirmation links the selection, including records hidden by a filter or another page.

`IndexPage`, `ShowPage`, `RecordHeader`, `PreviewRail`, `PreviewSplit`, the standalone `Panel` frame and `Block` are removed. One composable `PageHeader` accepts native props and refs; record fields and editing stay outside the header. `Section` is an optional titled presentation region with an opt-in rule. Disclosure uses Collapsible. RecordPicker, PreviewSheet, DataTable and Composer remain reusable interactions.

The [Pages guide](../../packages/design-system/src/stories/layout/Pages.mdx) holds the layout examples and records the conventions: meaningful headings, task-based tabs, real navigation links, explicit dismissal, preserved in-progress work and responsive focus behavior. Keyboard and modal behavior follow WAI-ARIA and Base UI; visual composition follows the task and available space.

## Rules that stay in the head

- A list row carries the name, one status, the number the reader sorts by, at most one bar, and
  the actions. Everything else goes in the peek.
- A record header carries identity and one primary action or Actions menu beside the title. The title keeps a readable measure; when the row cannot hold it beside the actions, the actions take the next row at the end. PageHeader and Section.Header follow the same rule on a page, in a panel and in a sheet. Status, ownership and editors belong in a labelled Details section or supporting properties, never in page or preview headers.
- Hover previews provide brief context. A selected-record surface supports the actions that make sense without leaving the queue, with a clear route to the full record.
- Choose an inline panel or an overlay based on available space and whether the underlying queue must remain usable. Both can contain actions.
- Shell.Panel supplies placement, heading, close and content spacing. A dismissible surface needs a visible close and a surviving focus target. Use Base UI Sheet when the rest of the page should be blocked.
- Toolbar folds rather than stacks, by its container's width: `filters` fold into More first, then the display controls in `children` (grouping, columns, settings) follow them into More under Display, still operable there. Search, saved views in `views` and the buttons in `actions` stay visible; when they cannot share one row the toolbar takes two, and a third only when More and the primary cannot share a line. The folded controls return when space does.
- A part responds to the space it is given, not the window: prefer intrinsic layout (`flex-wrap`, fitted grids, `min-w-0`) and use a container query where a switch is needed. Viewport breakpoints belong to page-level parts (the Shell's regions, overlays, the Grid primitive's responsive columns).
- Anything interactive is reachable without hover (`[@media(hover:none)]:opacity-100` on a revealed control), and a control drawn under 24px carries `relative touch-target`, an invisible hit area where the pointer is coarse.
- Long requirements, success criteria and assessment objectives wrap. Edit criteria directly in the cell with `Editable.Text multiline` and use a searchable chooser with confirmation for assessment relationships.
- A screen is shaped by the reader's question. When a column, fact or block exists because the
  store has the field, it goes.
- A real pattern the kit lacks is flagged in writing with a recommendation (kit or bespoke); the
  decision is Josef's. A raw element standing in for a kit part is a defect.

## Adding to the kit

1. Implement the component and update affected consumers. For a standard family, start from
   the local shadcn Base UI reference, preserve native and accessible behavior, and use Ledger
   tokens, relative imports and package `cn`. Multi-component compositions belong in patterns.
2. Exercise every named part in the family's `<Family>.stories.tsx` with representative
   states and interactions. Add `play` assertions to those examples; use a matrix when it
   helps compare variants. One playground usually covers the controls. Preserve distinct
   regression cases when consolidating examples. Storybook tests all stories in both modes.
3. Keep one accurate `<Family>.mdx` page with a useful example, generated props
   (`<ArgTypes of={Part} />`) and relevant usage/accessibility guidance. JSDoc explains
   package-specific props and defaults. Add anatomy, sizes, content rules or anti-examples
   only when they help; there is no required heading set or “Not applicable” filler.
   Keep migration examples on that page, or link to one focused guide for a larger migration.
4. Add a changelog entry and run the relevant type, lint, story and package checks. Update the
   API baseline only when declarations or exposed dependency contracts change. Extend the
   packed-consumer fixture when exports, packaging or consumer integration change.

`npm run ds:check` checks executable component coverage and family-page presence. Coverage
exceptions in `scripts/ds-check.allow` may only shrink. Review documentation against the
implementation and examples; the coverage check does not verify prose accuracy.

## Versioning and publishing

`npm run ds:api:check` compares package-owned public declarations and compact fingerprints of
reachable dependency contracts with `packages/design-system/api/public-api.json`. A deliberate
contract change needs review, migration notes where useful, and `npm run ds:api:update`.
CI also reports changes relative to the pull request's base snapshot. Dependency fingerprints
flag which package needs review; consumer type and interaction tests establish the impact.
React and TypeScript ambient declarations rely on typechecks and consumer tests rather than
whole-file hashes. The baseline detects declaration drift, not behavioral compatibility or
semantic versions.

For an audit, `npm run ds:api:matrix` generates `prop-matrix.md` and `prop-matrix.json` under
the ignored `artifacts/design-system-api/` directory. These are optional inspection reports,
not committed baselines or CI freshness gates. `api/axis-policy.json` contains optional notes
for package semantics and intentional integration behavior; new components and inherited
native props do not require exhaustive review prose. Current usage guidance lives in Storybook.

Semantic versions, recorded in `packages/design-system/CHANGELOG.md` with the story that shows each
change. Until 1.0 a rename or a removed prop is a minor step; it ships with a deprecation the lint
fixes wherever one is possible (`ledger/no-deprecated-name`, `ledger/no-deprecated-token`), and the
old name stays one version. CI (`.github/workflows/ci.yml`) runs the contract on every push: the
generated tokens match the source, maintained catalog exports have documented stories, the
package and the prototype typecheck and lint, the tests pass, everything builds, the Storybook
builds, and the package packs; the tarball is the build's artifact. A second product in another
repository installs that tarball, or the package from the organisation's registry once there is
one: `npm publish` from the package folder is the whole release, after `npm version` and a
changelog entry.

## What is underneath

Base UI powers Button/IconButton, Toggle/ToggleGroup, Switch, RadioGroup, Checkbox,
CheckboxGroup, Field and FieldSet, Input, Textarea (Field.Control), NumberField, HoverCard,
Popover, Tooltip, DropdownMenu, Select, Tabs, Accordion, Collapsible, Dialog, Sheet, AlertDialog,
Progress, ScrollArea, Avatar, Combobox, SearchDialog (Autocomplete) and Separator. Its `useRender`
and `mergeProps` supply the `render` composition of Badge, BreadcrumbLink, LinkButton and the
other parts that take `render`. The rest of Breadcrumb is native HTML. Command uses cmdk with a Base UI
Dialog shell, matching shadcn's Base UI implementation. Drawer also uses Base UI, including native swipe and snap-point behavior. Toast uses Base UI, with native manager operations and composable parts. TextLink and Shell navigation use useRender/mergeProps. The package has no direct Radix, Sonner or Vaul dependencies; cmdk can retain transitive Radix dependencies.
Calendar and DatePicker use react-day-picker;
react-resizable-panels under ResizablePanelGroup/Panel/Handle; recharts under Chart. Preserve the
dependency's focus, Escape, outside-click, keyboard and ARIA behavior through the public parts.
Screens import the package's documented APIs.

## Where the thinking is

- `docs/superpowers/specs/2026-09-02-token-architecture.md`: the token grammar, the build, the
  primitives, the lint, and the sequence of steps with what landed when.
- `docs/superpowers/specs/2026-09-02-ui-patterns-audit.md`: the audit of the spine surfaces, the
  decisions, and the patterns flagged after it.
- `docs/superpowers/specs/2026-09-02-picker-sheet.md`: choosing many from hundreds.
- `docs/superpowers/specs/2026-09-02-navigation-system.md`: the shell on Atlassian's grammar, what was
  left out, and the prototype's cutover plan.
- `docs/next.md`: the living list of what is next and what is waiting on a decision.
- `packages/design-system/AGENTS.md`: the entry point for a coding agent working on the package; it points here, at the Storybook's Guidance/Agents page and at the checks. `packages/design-system/llms.txt` is the Storybook as one generated file.

## Forms

Forms belongs under **Patterns** in Storybook. The [Forms pattern](http://localhost:6007/?path=/docs/patterns-forms--docs) composes Field, the controls and primitives, with TanStack Form for state and Zod for validation in its examples, and documents the mapping to shadcn's TanStack guidance; the kit exports presentation, not form state. The create or edit Dialog is the form recipe on Guidance/Recipes.

The application's forms follow the form contract in [product-patterns.md](product-patterns.md) (Forms and confirmations). Its reference is `CreateTaskDialog` in `src/components/prototype/create-task-dialog.tsx`, and `useDraftGuard` in `src/components/app/use-draft-guard.tsx` holds its dirty and pending protection with the kit's `pending` lock.
