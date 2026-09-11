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

| Layer       | Folder                               | Responsibility                                                                                        |
| ----------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Tokens      | `tokens/`, `src/generated/`          | Shared values and generated utilities.                                                                |
| Primitives  | `src/primitives/`                    | Spacing, alignment and type: Box, Stack, Inline, Grid.                                                |
| Components  | `src/components/`                    | Controls and display families built from shadcn Base UI foundations.                                  |
| Layout      | `src/layout/`                        | Shell regions, PageHeader, Section and PageSkeleton.                                                  |
| Patterns    | `src/patterns/`                      | Repeated interactions: DataTable, RecordPicker, Composer, Editable, Inspector and coordinated charts. |
| Mode        | `src/mode/`                          | Colour mode, storage and the before-paint script.                                                     |
| Application | `src/routes/`, `src/components/app/` | Persistent product navigation, route content, permissions, data and workflows.                        |

Editable, Gates, Toolbar and the Chart recipe family live in `src/patterns/`. They own inline-save recovery, readiness checks, search/filter/action layout, and chart exploration/export respectively. Chart remains Recharts-based, as in [shadcn’s chart source](https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/bases/base/ui/chart.tsx); the Ledger family adds coordinated views and actions. Toolbar is the tab-navigated search row, distinct from [Base UI’s arrow-navigated Toolbar](https://base-ui.com/react/components/toolbar). Public imports still come from `@ledger/design-system`.

Stepper, Timeline, Stat, Attachment, Banner, CodeBlock and KeyValue remain components. They describe a step sequence, event feed, metric, file, message, code display or fact; they do not own a wizard, upload service or record workflow. Composing small parts alone does not make a component a pattern.

The Shapes category is removed. Inspector, ActionBar and WorkPane live with reusable patterns; Block is replaced by the layout Section. ActionBar and WorkPane remain for existing application consumers without restoring the retired standalone catalog.

Domain files (`src/components/app/*.tsx`) and routes assemble these. They may own a tone map for
their vocabulary and a component that binds data to a pattern. They never declare a primitive or a
copy of a kit part; the lint (`ledger/no-kit-shadow`) names the kit part to import instead.

Activity and Task are application compositions in `src/components/app`: their event kinds,
task states and mention format belong to this product. Their stories live in the application
Storybook under **Product / Workflows**. Ledger owns the reusable Composer and TaskRow patterns: the application supplies suggestion
identities/insertion text and task status content. Timeline.Item already supplies the feed item.
Package stories cover these neutral contracts; workflow stories cover product decisions.

## Importing

Product code imports the package's root, never a file inside it:

```ts
import { Badge, Table, Id, Indicator, PageHeader, Shell, ModeSwitch } from "@ledger/design-system";
```

The stylesheet is three imports after Tailwind, in this order:

```css
@import "tailwindcss" source(none);
@source "./src";
@import "@ledger/design-system/reset.css";
@import "@ledger/design-system/ledger.css";
@import "@ledger/design-system/base.css";
```

Hooks that belong with parts live in the package too: `useSort` and `usePage` for a Table,
`useCommandPalette` for the ⌘K palette, `useSideNav` for the shell. A product keeps no copy of
anything generic; the prototype is the test vehicle, and when it
breaks the system is what gets fixed.

The package has no router. `BreadcrumbLink` takes a router link through `render`.
Navigation with button styling uses `buttonVariants` on a real router Link. TextLink and Shell navigation use
`render`, while Item accepts a link element as a prop.
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
keyboard, focus, ARIA and `render` behavior when extending a component. Document defaults,
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
every product. A product's own config adds nothing about the kit.

| Rule                            | Reports                                                                 | Instead                                               |
| ------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------- |
| `ledger/no-arbitrary-value`     | `text-[13px]`, `w-[240px]`                                              | A token utility or a primitive prop.                  |
| `ledger/no-non-token-class`     | A class that is neither a token utility nor a documented structural one | A token utility.                                      |
| `ledger/no-margin`              | `mt-200`, `-mx-100`                                                     | Stack or Inline space, or Bleed.                      |
| `ledger/no-static-design-value` | `rounded`, `opacity-50`, `duration-200`, `bg-white`                     | The named token.                                      |
| `ledger/no-dark-variant`        | `dark:`                                                                 | Nothing; every token flips by itself.                 |
| `ledger/no-deprecated-token`    | A deprecated token's utility                                            | Its replacement, applied by `--fix`.                  |
| `ledger/no-deprecated-name`     | A part's old name (`Shell.Sidebar`, `Shell.NavItem`)                    | Its replacement; `--fix` does the one-to-one renames. |
| `ledger/prefer-text-link`       | A Link or anchor carrying `text-brand` or `hover:underline`             | TextLink render with the link element.                |
| `ledger/no-colgroup`            | `<colgroup>`                                                            | `width` on each Table.Header.                         |
| `ledger/use-primitives`         | A `div` or `span` carrying layout classes (warning)                     | Box, Stack, Inline, Flex or Grid.                     |
| `ledger/cell-plain`             | A Table.Cell carrying a neutral colour, weight or type token            | Nothing; only a status colour may differ.             |
| `ledger/id-not-blue`            | An Id with `text-brand` outside a link or button                        | Wrap it in a link, or drop the class.                 |
| `ledger/no-kit-shadow`          | A local component named like a kit part                                 | Import the kit part.                                  |
| `ledger/button-icon-slot`       | An element with `size-icon-*` inside a Button or IconButton             | `iconBefore`, `iconAfter` or `icon`, passed bare.     |

## Pattern direction

Record screens should make state, ownership and the next action visible before background detail. The requirement record is the first application reference: attention items lead to work, assessment results have a clear status, evidence opens as an artifact, and activity and provenance have their own views. Preserve the full requirement statement and audit information without repeating it across the header, body and rail.

Use list or board views for queues, compact editable properties for ownership and status, and focused detail surfaces for completing work. Linear's [display options](https://linear.app/docs/display-options), HubSpot's [record composition](https://knowledge.hubspot.com/object-settings/customize-records) and Salesforce's [record workspaces](https://trailhead.salesforce.com/content/learn/modules/lightning-experience-for-salesforce-classic-users/work-with-your-data) are references for this direction. Choose the layout around the work the user is doing; adding cards alone does not create a workflow.

The root route mounts `AppLayout` once around its outlet. Routes compose `PageHeader`, primitives, controls and `TabsContent` in Main. `Shell.Aside` contributes supporting properties and `Shell.Panel` contributes selected-record or task content to stable destinations outside Main. React portals preserve route context, and route unmount removes the contribution; these slots render after client mount. Keep at most one contribution per region in the active route tree.

Aside follows Main below 1200px and sits beside it above that. A Panel is inline from 1280px; below that it replaces the visible work area while Main remains mounted. With both regions present, Aside follows Main until 1760px. Main uses document scrolling; Panel scrolls within the available viewport. Resizing, Escape, visible close and focus return belong to Panel. Use Base UI Sheet when the task needs modal focus containment.

`IndexPage`, `ShowPage`, `RecordHeader`, `PreviewRail`, `PreviewSplit`, the standalone `Panel` frame and `Block` are removed. One composable `PageHeader` accepts native props and refs; metadata stays outside its h1. `Section` is an optional titled presentation region with an opt-in rule. Disclosure uses Collapsible. RecordPicker, PreviewSheet, DataTable and Composer remain reusable interactions. See the [layout examples](../../packages/design-system/src/stories/layout/Pages.mdx).

The [Pages guide](../../packages/design-system/src/stories/patterns/Pages.mdx) records the conventions: meaningful headings, task-based tabs, real navigation links, explicit dismissal, preserved in-progress work and responsive focus behavior. Keyboard and modal behavior follow WAI-ARIA and Base UI; visual composition follows the task and available space.

## Rules that stay in the head

- A list row carries the name, one status, the number the reader sorts by, at most one bar, and
  the actions. Everything else goes in the peek.
- A record header carries identity, current state, ownership and useful actions. Supporting properties go in a compact rail or a focused details view.
- Hover previews provide brief context. A selected-record surface supports the actions that make sense without leaving the queue, with a clear route to the full record.
- Choose an inline panel or an overlay based on available space and whether the underlying queue must remain usable. Both can contain actions.
- Shell.Panel supplies placement, heading, close and content spacing. A dismissible surface needs a visible close and a surviving focus target. Use Base UI Sheet when the rest of the page should be blocked.
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

Base UI powers Button/IconButton, Toggle/ToggleGroup, Switch, RadioGroup, Checkbox, HoverCard,
Popover, Tooltip, DropdownMenu, Select, Tabs, Accordion, Collapsible, Dialog, Sheet, AlertDialog,
Progress, ScrollArea, Avatar, Combobox and Separator. It also supplies Badge and BreadcrumbLink's
composition helpers. The rest of Breadcrumb is native HTML. Command uses cmdk with a Base UI
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

## Forms

Forms belongs under **Patterns** in Storybook. Use TanStack Form for state and submission, Zod for validation, and Ledger Field and controls for presentation. The [Forms pattern](http://localhost:6007/?path=/docs/patterns-forms--docs) documents the mapping to shadcn's TanStack guidance.

Application record forms use `src/lib/record-form.ts`: `useRecordForm` configures TanStack's validation policy and exposes its `form.Field` render props, values and form ref. It validates on submit, then on change; changing an action's required fields revalidates existing errors. Submission metadata selects the save command, so draft saves and conditional confirmation actions retain their behavior. Form state and validation stay with TanStack; the package exports presentation controls.
