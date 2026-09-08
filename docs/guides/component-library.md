# Ledger: the design system

Ledger is the product design system. It is a package, `@ledger/design-system`, at
`packages/design-system`, and the prototype is its first consumer. Its Storybook is the contract:
maintained catalog components are exercised in stories, each family has a documentation page, and
`npm run build` checks that coverage. Matrices are useful when variants need comparison.
This guide says how the package is shaped and how a screen uses it. The reasoning lives in the specs
under `docs/superpowers/specs/`, and the parts document themselves in the package's Storybook
(`npm run storybook` inside the package, port 6007).

## Layers

One folder per layer; the layer says how much a part is allowed to know. A layer imports only from
the layers below it, by relative path, so the dependency graph stays visible.

| #   | Layer          | Folder           | Knows about                                                                                                                                          |
| --- | -------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | **Tokens**     | `tokens/`        | Nothing. DTCG JSON, built by Style Dictionary into `src/generated/` (CSS variables, the Tailwind theme map, per-token utilities, `token()`).         |
| 1   | **Primitives** | `src/primitives` | Layout and type: Box, Stack, Inline, Flex, Grid, Bleed, Text, Heading. Every prop is a token name.                                                   |
| 2   | **Components** | `src/components` | Reusable component families. Standard families follow the shadcn Base UI contracts as they migrate; existing families retain their documented APIs. |
| 3   | **Patterns**   | `src/patterns`   | Several components with a contract and no domain words: PageHeader, RecordHeader, Card, PreviewRail, PreviewSheet, PickerSheet, the page archetypes. |
| 4   | **Shapes**     | `src/shapes`     | A whole screen region and the job it does: ActionBar, Block, Inspector, WorkPane.                                                                    |
| 5   | **Shell**      | `src/shell`      | The navigation system: banner, top nav, side nav, main, panel, and the items that go in them. It knows nothing about routes.                         |
| 6   | **Mode**       | `src/mode`       | The colour mode: provider, switch, storage, the before-paint script.                                                                                 |

The standalone Shapes catalog is retired. Its runtime exports remain for existing consumers;
Block and Inspector still appear in integration stories. ActionBar and WorkPane retain API
compatibility checks but no dedicated stories. Build new compositions from the components and
patterns as their shadcn/Base UI migrations land, rather than extending the Shapes catalog.

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
import {
  Badge,
  Table,
  Id,
  Indicator,
  RecordHeader,
  Shell,
  ModeSwitch,
} from "@ledger/design-system";
```

The stylesheet is three imports after Tailwind, in this order:

```css
@import "tailwindcss" source(none);
@source "./src";
@import "@ledger/design-system/reset.css";
@import "@ledger/design-system/ledger.css";
@import "@ledger/design-system/base.css";
```

Hooks that belong with parts live in the package too: `useRequired` for legacy consumers,
`useSort` and `usePage` for a Table, `useCommandPalette` for the ⌘K palette, `useSideNav` for the
shell. A product keeps no copy of anything generic; the prototype is the test vehicle, and when it
breaks the system is what gets fixed.

The package has no router. `BreadcrumbLink` takes a router link through `render`.
Navigation with button styling uses `buttonVariants` on a real router Link. TextLink uses
`asChild`, while Item and RecordHeader accept a link element as a prop.
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

Patterns assemble components into workflows or larger regions, such as RecordHeader. Options
for one component, such as Badge's status tone, size and icon, belong on that component.

Breadcrumb exports `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`,
`BreadcrumbPage`, `BreadcrumbSeparator` and `BreadcrumbEllipsis`. Lists and separators are
explicit; BreadcrumbLink uses Base UI `useRender` and `mergeProps`. Badge uses the same
composition helpers and combines six shadcn variants with `tone`, `appearance`, `size` and
`icon` options in one component. See the [Badge page](../../packages/design-system/src/stories/components/Badge.mdx#migration). Other
families keep their current APIs until their own migration updates implementation, consumers,
stories and any necessary compatibility notes together.

[Separator](../../packages/design-system/src/stories/components/Separator.mdx#migration)
uses the Base UI primitive. [Skeleton](../../packages/design-system/src/stories/components/Skeleton.mdx#migration)
and [Kbd/KbdGroup](../../packages/design-system/src/stories/components/Kbd.mdx#migration)
follow shadcn's native element contracts. These families retain their Ledger options and
styling while accepting native attributes and refs; existing callers need no edits.
[Toggle and ToggleGroup](../../packages/design-system/src/stories/components/ToggleGroup.mdx#migration)
use shadcn's Base UI API: composed `ToggleGroupItem` children, array selection,
`default`/`outline` variants and `default`/`sm`/`lg` sizes. Required single-selection
rules belong in the consuming screen or pattern's callback.
[Switch](../../packages/design-system/src/stories/components/Switch.mdx#migration)
uses shadcn's Base UI control with external labels and descriptions, `default`/`sm`
sizes and native root/input refs. It continues to bind to Ledger Field.
[RadioGroup](../../packages/design-system/src/stories/components/RadioGroup.mdx#migration)
uses flat `RadioGroupItem` exports and external labels/descriptions; CSS controls layout.
Field group binding and Base UI's native selection, form and keyboard behavior remain.
[Checkbox](../../packages/design-system/src/stories/components/Checkbox.mdx#migration)
uses external labels and descriptions, boolean `checked` and a separate `indeterminate`
prop. Table.Selection uses the same state split; keep `checked={false}` while mixed so
activation selects all. Field binding and Ledger's check/minus indicators remain.
[HoverCard](../../packages/design-system/src/stories/components/HoverCard.mdx#migration)
composes `HoverCardTrigger` and `HoverCardContent` over Base UI PreviewCard. Timing belongs
on the trigger; positioning and native popup styles belong on the content. Existing
glances keep their 300px width and start alignment, with locale-aware placement.
[Popover](../../packages/design-system/src/stories/components/Popover.mdx#migration-and-api)
uses flat trigger, content, header, title, description and close parts. Root owns open
state and modality; Content owns placement, native styles and initial/final focus.
Compose existing buttons through Trigger or Close's `render` prop.
[Tooltip](../../packages/design-system/src/stories/components/Tooltip.mdx#migration-and-api)
composes flat Trigger, Content and Provider parts. Provider defaults to zero delay;
Shell explicitly keeps a shared 300ms delay. IconButton already supplies a tooltip.
Keep accessible names and essential instructions independent of the visual popup.
[DropdownMenu](../../packages/design-system/src/stories/components/DropdownMenu.mdx#migration-and-api)
uses flat Base UI parts. Actions use `onClick`; independent and exclusive choices use
CheckboxItem or RadioGroup. Content owns placement and width. Use LinkItem for navigation
and Group for labeled sections; existing single-choice consumers explicitly close.
[Select](../../packages/design-system/src/stories/components/Select.mdx#migration-and-api)
composes Root, Trigger, Value and Content. Root owns selected/form state; Trigger binds
Field labels and native events; Value owns display labels and the placeholder. Use
`items` or Value children for readable labels, and handle nullable single selections.
[Tabs](../../packages/design-system/src/stories/components/Tabs.mdx#migration-and-api)
uses flat List, Trigger and Content parts. List owns default/line styling and
`activateOnFocus`; counts and badges are children. Root owns orientation and values;
ShowPage composes its existing root and body with `render`.
The [migration handoff](design-system-migration-handoff.md) records the next family and
integration constraints. Family pages own their detailed contracts.

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
| `ledger/prefer-text-link`       | A Link or anchor carrying `text-brand` or `hover:underline`             | TextLink around the link element.                     |
| `ledger/no-colgroup`            | `<colgroup>`                                                            | `width` on each Table.Header.                         |
| `ledger/use-primitives`         | A `div` or `span` carrying layout classes (warning)                     | Box, Stack, Inline, Flex or Grid.                     |
| `ledger/cell-plain`             | A Table.Cell carrying a neutral colour, weight or type token            | Nothing; only a status colour may differ.             |
| `ledger/id-not-blue`            | An Id with `text-brand` outside a link or button                        | Wrap it in a link, or drop the class.                 |
| `ledger/no-kit-shadow`          | A local component named like a kit part                                 | Import the kit part.                                  |
| `ledger/button-icon-slot`       | An element with `size-icon-*` inside a Button or IconButton             | `iconBefore`, `iconAfter` or `icon`, passed bare.     |

## Rules that stay in the head

- A list row carries the name, one status, the number the reader sorts by, at most one bar, and
  the actions. Everything else goes in the peek.
- A record header carries the trail, title, brief meta and actions; details go in the rail.
- Hover on an id is a glance (HoverCard, facts only); click is the peek (PreviewSheet, facts and
  the actions that make sense without leaving); the footer link is the record.
- Rail beside an index table that leaves room; sheet over a full-width table and wherever the
  preview carries actions. Never both on one page.
- The shell's Panel is an area, not a feature. The peek is a Sheet over the page and the nav.
  On a record the Panel is the rail, details and related information, always there and never
  dismissed; a panel the reader opens, a thread or a form, has a close and a trigger.
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

Base UI powers Button/IconButton, Toggle/ToggleGroup, Switch, RadioGroup, Checkbox, HoverCard, Popover, Tooltip, DropdownMenu, Select, Tabs, Avatar, Combobox and Separator and supplies Badge and BreadcrumbLink's composition helpers. The rest
of Breadcrumb is native HTML; there is no dedicated Base UI breadcrumb primitive. Existing
families still use Radix under overlays, Progress and ScrollArea;
cmdk under Command; vaul under Drawer; react-day-picker under Calendar and DatePicker;
react-resizable-panels under Resizable; sonner under Toaster; recharts under Chart. Preserve the
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

Application record forms use `src/lib/record-form.ts`: `useRecordForm` configures TanStack's validation policy and exposes its `form.Field` render props, values and form ref. It validates on submit, then on change; changing an action's required fields revalidates existing errors. Submission metadata selects the save command, so draft saves and conditional confirmation actions retain their behavior. All former application `useRequired` callers have been migrated; the exported legacy hook remains for package compatibility.

## Accordion and Collapsible

Accordion coordinates a set of sections using explicit item values and root-owned selection. Collapsible owns one independent boolean toggle. Compose titles, counts, actions, borders and body spacing with their parts; no extra disclosure pattern is needed. Both expose native attributes and refs on their named parts. See [the migration guide](disclosure-migration.md) for the former title/count/Group API and temporary legacy adapters.
