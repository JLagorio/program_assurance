# Ledger: the design system

Ledger is the product design system. It is a package, `@ledger/design-system`, at
`packages/design-system`, and the prototype is its first consumer. Its Storybook is the contract:
every export has a story, every family has a matrix and a page on the template, and `npm run build` fails when one is missing.
This guide says how the package is shaped and how a screen uses it. The reasoning lives in the specs
under `docs/superpowers/specs/`, and the parts document themselves in the package's Storybook
(`npm run storybook` inside the package, port 6009).

## Layers

One folder per layer; the layer says how much a part is allowed to know. A layer imports only from
the layers below it, by relative path, so the dependency graph stays visible.

| #   | Layer          | Folder           | Knows about                                                                                                                                          |
| --- | -------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0   | **Tokens**     | `tokens/`        | Nothing. DTCG JSON, built by Style Dictionary into `src/generated/` (CSS variables, the Tailwind theme map, per-token utilities, `token()`).         |
| 1   | **Primitives** | `src/primitives` | Layout and type: Box, Stack, Inline, Flex, Grid, Bleed, Text, Heading. Every prop is a token name.                                                   |
| 2   | **Components** | `src/components` | One job each, on Radix where there is behaviour: Button, Badge, Table, Tabs, the controls, the overlays, the pickers, Chart.                         |
| 3   | **Patterns**   | `src/patterns`   | Several components with a contract and no domain words: PageHeader, RecordHeader, Card, PreviewRail, PreviewSheet, PickerSheet, the page archetypes. |
| 4   | **Shapes**     | `src/shapes`     | A whole screen region and the job it does: ActionBar, Block, Inspector, WorkPane.                                                                    |
| 5   | **Shell**      | `src/shell`      | The navigation system: banner, top nav, side nav, main, panel, and the items that go in them. It knows nothing about routes.                         |
| 6   | **Mode**       | `src/mode`       | The colour mode: provider, switch, storage, the before-paint script.                                                                                 |

Domain files (`src/components/app/*.tsx`) and routes assemble these. They may own a tone map for
their vocabulary and a component that binds data to a pattern. They never declare a primitive or a
copy of a kit part; the lint (`ledger/no-kit-shadow`) names the kit part to import instead.

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

Hooks that belong with parts live in the package too: `useRequired` for a form's required fields,
`useSort` and `usePage` for a Table, `useCommandPalette` for the ⌘K palette, `useSideNav` for the
shell. A product keeps no copy of anything generic; the prototype is the test vehicle, and when it
breaks the system is what gets fixed.

Links are slots. The package has no router: a Button or TextLink takes the router's Link as its
child (`asChild`), Item and RecordHeader take a link element as a prop.

## Naming

- **Full words.** `Table.Row`, not `Tr`. A name says what the thing is, never how it looks: `Id`,
  not `Mono`.
- **Compound for parts.** A component with parts hangs them off its name: `Table.Cell`,
  `DropdownMenu.Item`, `Stat.Tile`, `Fact.Group`. Flat exports otherwise.
- **One name per idea.** Two components that do one job become one. `Tabs` absorbed `TabStrip`;
  `RailGroup` became `Inspector.Group`.
- **No domain words in the kit.** Severity, finding, control and requirement live in routes and
  `lib`. The kit knows tones, identifiers and values.
- **Props are the grammar.** `tone`, `size`, `isSelected`, `isActive`, `count`, `width`,
  `asChild`. Sizes are `xsmall`, `small`, `medium`, `large`. Tones are the status vocabulary:
  `neutral`, `information`, `success`, `warning`, `danger`, and `brand` where a chart needs it.

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

1. Put the part in its layer with relative imports and the package `cn`. Class strings are token
   utilities; the package lints itself with the strict preset (`npm run lint` there).
2. Give it a story under `src/stories` and a `*Matrix` story that lays out its variants and states,
   rendered once. The toolbar switches the mode. `node scripts/ds-check.mjs` from the repo root says
   what is missing; `npm run build` runs it first.
3. Write the family's page on the template: Anatomy, Variants, Sizes, States, Modifiers, Content, Style,
   Accessibility, Props (`<ArgTypes of={Part} />`, generated from the types, so every prop carries a JSDoc
   line), Related, Don't (a `Pair` per mistake). A heading that does not apply says so under itself. The
   ratchet lists the headings a page is missing; the families not yet walked are grandfathered in
   `scripts/ds-check.allow`, which only shrinks. `Components/Button` is the page to copy.
4. Check it in both modes in Storybook. Then, and only on a go, move the prototype onto it.

## Versioning and publishing

Semantic versions, recorded in `packages/design-system/CHANGELOG.md` with the story that shows each
change. Until 1.0 a rename or a removed prop is a minor step; it ships with a deprecation the lint
fixes wherever one is possible (`ledger/no-deprecated-name`, `ledger/no-deprecated-token`), and the
old name stays one version. CI (`.github/workflows/ci.yml`) runs the contract on every push: the
generated tokens match the source, every export has a story and every family a matrix, the
package and the prototype typecheck and lint, the tests pass, everything builds, the Storybook
builds, and the package packs; the tarball is the build's artifact. A second product in another
repository installs that tarball, or the package from the organisation's registry once there is
one: `npm publish` from the package folder is the whole release, after `npm version` and a
changelog entry.

## What is underneath

Radix under the overlays, the choice controls, Tabs, Toggle, Progress and ScrollArea; cmdk under
Command and Combobox; vaul under Drawer; react-day-picker under Calendar and DatePicker;
react-resizable-panels under Resizable; sonner under Toaster; recharts under Chart. Focus, Escape,
outside-click, keyboard and aria come from there; the kit owns the API and the look. No screen
imports any of these directly.

## Where the thinking is

- `docs/superpowers/specs/2026-09-02-token-architecture.md`: the token grammar, the build, the
  primitives, the lint, and the sequence of steps with what landed when.
- `docs/superpowers/specs/2026-09-02-ui-patterns-audit.md`: the audit of the spine surfaces, the
  decisions, and the patterns flagged after it.
- `docs/superpowers/specs/2026-09-02-picker-sheet.md`: choosing many from hundreds.
- `docs/superpowers/specs/2026-09-02-navigation-system.md`: the shell on Atlassian's grammar, what was
  left out, and the prototype's cutover plan.
- `docs/next.md`: the living list of what is next and what is waiting on a decision.
