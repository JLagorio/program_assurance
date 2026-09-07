# Ledger: the design system

Ledger is the product design system. It is a package, `@ledger/design-system`, at
`packages/design-system`, and the prototype is its first consumer. Its Storybook is the contract:
every export has a story, every family has a matrix and a page on the template, and `npm run build` fails when one is missing.
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

The package has no router. `BreadcrumbLink` takes a router link through `render`; existing
Button and TextLink use `asChild`, while Item and RecordHeader accept a link element as a prop.
Custom rendered elements must accept the merged attributes, handlers and ref.

## Component contracts

Start with the local shadcn Base UI components in `src/components/ui/`, reuse their primitives,
composition and accessibility behavior, and adapt them to the product. Shadcn is the foundation;
its API is not a ceiling. Extend the same component with useful options when the product needs
them, keeping one clear component for one job. A status badge is `Badge`.

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
`icon` options in one component. See the [Badge migration guide](badge-migration.md). Other
families keep their current APIs until their own migration updates implementation, consumers,
stories, API metadata and migration notes together.

The [migration handoff](design-system-migration-handoff.md) records the completed Breadcrumb and Badge
slices, the recommended Separator slice, integration constraints, and validation commands for the
next agent.

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
- A record header carries at most six facts; the rest go in the rail.
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

1. For a standard family, start from the local shadcn Base UI reference and adapt the same
   component to product needs while preserving native and accessible interaction behavior. Put the part in its layer with relative imports and the package `cn`. Class strings
   use Ledger token utilities; the package lints itself with the strict preset (`npm run lint`
   there). Put multi-component compositions in patterns; keep useful single-component options on the component.
2. Give the family a story file under the package's `src/stories` (`<Family>.stories.tsx`).
   Document and exercise every named part in that family, including flat exports, with representative states and interactions. Use a Matrix when it helps compare variants. Add `play` assertions to the same examples; Storybook tests every story by default. The toolbar switches the mode. `node scripts/ds-check.mjs` from the repo root says
   what is missing; `npm run build` runs it first.
3. Write the part's page (`<Part>.mdx`) on the template: Anatomy, Variants, Sizes, States, Modifiers, Content, Style,
   Accessibility, Props (`<ArgTypes of={Part} />`, generated from the types, so every prop carries a JSDoc
   line), Related, Don't (a `Pair` per mistake). A heading that does not apply says so under itself. The
   ratchet lists the headings a page is missing; the families not yet walked are grandfathered in
   `scripts/ds-check.allow`, which only shrinks. `Components/Button` and `Components/Input` are the pages to copy; a family that is a choice keeps an
   overview page (Overlays, Pages, Shapes, Primitives) that says which part to reach for. Forms belongs under Patterns: compose Ledger controls with TanStack Form and Zod for state and validation.
4. Check it in both modes in Storybook. Then, and only on a go, move the prototype onto it.

## Versioning and publishing

The [API prop matrix](design-system-api-matrix.md) records component and compound props,
semantic axes and explicit unresolved details. After an API change, run `npm run ds:api:matrix`
and review the generated diff. `npm run ds:api:matrix:check` rejects stale output in CI.

`npm run ds:api:check` compares compiler-emitted public declarations and their reachable
dependencies with `packages/design-system/api/public-api.json`. A deliberate signature change
requires compatibility review, migration notes where needed, and `npm run ds:api:update`.
CI also reports changes relative to the pull request's base snapshot. This detects declaration
drift, including dependency changes; it does not prove behavioral compatibility or assign a
semantic version automatically. Initial adoption records the current API without retrospectively
certifying earlier changes.

Semantic versions, recorded in `packages/design-system/CHANGELOG.md` with the story that shows each
change. Until 1.0 a rename or a removed prop is a minor step; it ships with a deprecation the lint
fixes wherever one is possible (`ledger/no-deprecated-name`, `ledger/no-deprecated-token`), and the
old name stays one version. CI (`.github/workflows/ci.yml`) runs the contract on every push: the
generated tokens match the source, every export has a documented story, the
package and the prototype typecheck and lint, the tests pass, everything builds, the Storybook
builds, and the package packs; the tarball is the build's artifact. A second product in another
repository installs that tarball, or the package from the organisation's registry once there is
one: `npm publish` from the package folder is the whole release, after `npm version` and a
changelog entry.

## What is underneath

Base UI powers Avatar and Combobox and supplies Badge and BreadcrumbLink's composition helpers. The rest
of Breadcrumb is native HTML; there is no dedicated Base UI breadcrumb primitive. Existing
families still use Radix under overlays, choice controls, Tabs, Toggle, Progress and ScrollArea;
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
