# Ledger: the component library

Ledger is the design system. It is the workspace package `@ledger/design-system` in
`packages/design-system`, one folder per layer, and the layer says how much a component is allowed
to know. Everything a screen is made of comes from one of them. The Storybook docs are the truth
for any family; this page is the map.

| #   | Layer          | Folder                       | Knows about                                                                                      | Imports from         |
| --- | -------------- | ---------------------------- | ------------------------------------------------------------------------------------------------ | -------------------- |
| 0   | **Tokens**     | `tokens/` → `src/generated/` | Nothing. DTCG JSON built into CSS variables, the Tailwind theme map and per-token utilities.     | —                    |
| 1   | **Primitives** | `src/primitives/`            | Layout and text. Every design value is a token-typed prop; an invalid value is a type error.     | Tokens               |
| 2   | **Components** | `src/components/`            | One element, one job. No domain types, no data contracts.                                        | Primitives           |
| 3   | **Patterns**   | `src/patterns/`              | Several components with a data contract. Still no domain words.                                  | Components           |
| 4   | **Shapes**     | `src/shapes/`                | A whole screen region and the job it does.                                                       | Patterns, Components |
| 5   | **Shell**      | `src/shell/`                 | The frame around a screen. The product owns the nav data and the router; `NavItem` is `asChild`. | Everything below     |
| —   | **Mode**       | `src/mode/`                  | Colour mode and density: a root attribute, a provider, a switch and the before-paint script.     | Components           |

Domain files (`src/components/app/*.tsx`) and routes assemble these. They may own a tone map for
their vocabulary and a component that binds data to a pattern. They never declare a component that
shares a kit name.

## Importing

One entry. App code imports the package, never a file inside it:

```ts
import { Badge, Table, DataTable, defineColumns, useDataTable } from "@ledger/design-system";
import { ActionBar, Inspector, Shell, ModeSwitch } from "@ledger/design-system";
```

The stylesheet imports three subpaths in this order: `reset.css`, `ledger.css`, `base.css`. The
ESLint preset is `@ledger/design-system/eslint`; `cn` is on `@ledger/design-system/cn`.

The app resolves the package from source (`exports` maps `.` to `src/index.ts`), so a change in the
kit is live in `npm run dev` with no build. `npm run build -w @ledger/design-system` emits ESM
JavaScript, `.d.ts` declarations and the stylesheets into `packages/design-system/dist/`, which is
gitignored; `types` in `exports` points there, and falls back to the source while it is absent.

Inside the package, files import each other by relative path (`../lib/cn`, `../components/badge`)
so the dependency graph stays visible, and a layer only imports from layers below it. The package
imports nothing from the app (`@/…`), nothing from the prototype and no router; the lint's
portability rule holds all three.

## Naming

- **Full words.** `Table.Row`, not `Tr`. A name says what the thing is, never how it looks: `Id`,
  not `Mono`.
- **Compound for parts.** A component with parts hangs them off its name: `Table.Cell`,
  `DropdownMenu.Item`, `Stat.Tile`, `DataTable.Filter`. Flat exports otherwise.
- **One name per idea.** Two components that do one job become one. `Tabs` absorbed `TabStrip`;
  `RailGroup` became `Inspector.Group`; `TreeCell` became `Table.Tree`.
- **No domain words in the kit.** Severity, finding, control and package live in routes and `lib`.
  The kit knows tones, identifiers and values.

## Families

Every export has a story under `src/stories` and every family a Matrix story; `npm run ds:check`
fails when one is missing. Each family's docs page (`src/stories/**/*.mdx`) carries the full parts
table and rules; the one line here is the rule that decides whether to reach for it.

### Primitives

| Family | Root and parts    | Rule                                                                                           |
| ------ | ----------------- | ---------------------------------------------------------------------------------------------- |
| Box    | `Box`             | Padding and a surface. No margins, ever; a Box records the surface it paints for its children. |
| Stack  | `Stack`, `Inline` | A column or a row with one gap. Reach for these first.                                         |
| Flex   | `Flex`, `Grid`    | The layouts Stack and Inline cannot express.                                                   |
| Bleed  | `Bleed`           | The one place a negative margin is written.                                                    |
| Text   | `Text`, `Heading` | Interface text on the body ramp; titles on the heading ramp. Colour is a token, not a class.   |

### Structure

| Family     | Root and parts                                                                                                                 | Rule                                                                                                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table      | `Table`, `.Header`, `.Row`, `.Cell`, `.Id`, `.Selection`, `.Group`, `.Tree`, `.Detail`, `.Handle`                              | The register, by hand, for a table with nothing to sort, filter, page or choose. `.Detail` is the row a record opens into; `.Handle` is the grip of a row that reorders.   |
| DataTable  | `defineColumns`, `useDataTable`, `DataTable`, `.SelectionBar`, `.Filter`, `.Search`, `.Presets`, `.Columns`, `toRows`, `toCsv` | The register with its state: columns by kind, TanStack Table underneath. A table that sorts, filters, pages, chooses, pins, nests or scrolls inside itself is a DataTable. |
| Pagination | `Pagination`                                                                                                                   | Row range on the left, pages on the right. Pages are 1-based.                                                                                                              |
| Item       | `Item`, `.Group`                                                                                                               | One record in a list: mark, id, title, meta, value, actions. `link` takes a link element; `onSelect` makes it a button.                                                    |
| Breadcrumb | `Breadcrumb`, `.Item`                                                                                                          | A trail back up the record tree; the last item is the page and not a link.                                                                                                 |
| Timeline   | `Timeline`, `.Group`, `.Item`                                                                                                  | Dated events along one rail under sticky group labels.                                                                                                                     |
| Stepper    | `Stepper`, `.Item`, `StepState`                                                                                                | Ordered stages: done, current, upcoming, blocked.                                                                                                                          |
| Tree       | `Tree`, `.Item`                                                                                                                | A hierarchy the caller flattens, without columns; with columns it is `Table.Tree`.                                                                                         |
| Disclosure | `Accordion`, `.Item`, `Collapsible`                                                                                            | Reference material, closed by default. Collapsible is one section; Accordion is several that know about each other.                                                        |
| Tabs       | `Tabs`, `.Tab`                                                                                                                 | The underline strip. It draws the strip and reports the selection; the caller owns the panels, because a tab is usually a route.                                           |
| Toolbar    | `Toolbar`                                                                                                                      | Search, filters and view controls in one band above a table.                                                                                                               |
| ScrollArea | `ScrollArea`                                                                                                                   | The kit's thin scrollbar for rails and picker lists.                                                                                                                       |
| Resizable  | `Resizable`, `.Panel`, `.Handle`                                                                                               | Panes a person sizes. A number is a percentage; a string carries its unit.                                                                                                 |
| CodeBlock  | `CodeBlock`                                                                                                                    | Source with a sticky line-number gutter; the caller owns highlighting.                                                                                                     |
| Separator  | `Separator`                                                                                                                    | Hairline, horizontal or vertical.                                                                                                                                          |
| Loading    | `Skeleton`, `Spinner`                                                                                                          | Skeleton holds the layout still; Spinner is `small` beside text and `medium` alone.                                                                                        |

### Identity and value

| Family   | Root and parts                                                                 | Rule                                                                                                                                                      |
| -------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Id       | `Id`, `.List`                                                                  | Marks an identifier: inherits the surrounding type, adds tabular numerals. Never blue on its own.                                                         |
| Badge    | `Badge`, `Count`, `Dot`, `Indicator`                                           | One tone table. Badge is the only pill in a row; Count is a number; Indicator is Dot plus text for severity or priority.                                  |
| Alert    | `Alert`                                                                        | A tinted callout in a tone; danger announces itself.                                                                                                      |
| Progress | `Progress`, `.Stacked`                                                         | One bar or several segments; Radix underneath for the aria.                                                                                               |
| Stat     | `Stat`, `.Tile`, `.Grid`, `Tiles`                                              | Bare number, framed number, band of tiles. Zero reads muted.                                                                                              |
| Chart    | `Chart.Bar`, `.Line`, `.Area`, `.Donut`, `.Sparkline`, `.Legend`, `chartColor` | Recharts draws, the chart tokens paint. A status tone on a series is data; categories take the categorical set. No animation.                             |
| Avatar   | `Avatar`, `.Stack`, `Person`                                                   | Person is avatar plus name.                                                                                                                               |
| Facts    | `Fact`, `.Group`, `KeyValue`, `Prose`, `Eyebrow`, `Absent`                     | Fact is label and value inline; `.Group` is the strip under a record header, at most six. `Absent` is the muted dash; `Empty` is the pattern for no rows. |
| Kbd      | `Kbd`                                                                          | A key cap: `⌘K`, `esc`.                                                                                                                                   |

### Input

| Family     | Root and parts                                                                                          | Rule                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Button     | `Button`, `IconButton`, `ButtonGroup`                                                                   | One `primary` per view. `asChild` makes a router Link a button. IconButton requires `label`.                                 |
| TextLink   | `TextLink`                                                                                              | Navigation that reads as text. `Button variant="link"` is an action that only looks like one.                                |
| Toggle     | `Toggle`, `ToggleGroup`                                                                                 | One thing on or off; several that share one answer, with a `count` per item.                                                 |
| Field      | `Field`, `Input`, `Textarea`, `InputGroup`, `NativeSelect`, `controlBase`                               | Field wraps one control with label, hint and error; `isRequired` draws the asterisk, `error` turns the border red.           |
| Choice     | `Checkbox`, `Switch`, `RadioGroup`, `.Item`                                                             | Children become the label. A checked state is the selection use of the blue budget.                                          |
| Select     | `Select`, `.Item`, `.Group`, `.Separator`                                                               | A short, fixed list whose options carry a Dot or a Badge; NativeSelect for a plain list of words.                            |
| Combobox   | `Combobox`, `ComboboxOption`                                                                            | A list worth searching: a Command in a Popover.                                                                              |
| Command    | `Command`, `.Input`, `.List`, `.Empty`, `.Group`, `.Item`, `.Separator`, `.Footer`, `.Count`, `.Dialog` | The palette and every record picker, on cmdk. `.Dialog` wraps it in an overlay.                                              |
| Date       | `DatePicker`, `Calendar`                                                                                | ISO `yyyy-MM-dd` in and out; Calendar is react-day-picker in kit clothes.                                                    |
| Editable   | `Editable.Text`, `Editable.Select`                                                                      | Click-to-edit where the value sits, optimistic with rollback; `validate` and `save`. A DataTable's editable cells are these. |
| FilterChip | `FilterChip`                                                                                            | An applied filter with its value and a way to clear it; a DataTable builds its own from each column.                         |

### Overlay and notice

| Family       | Root and parts                                  | Rule                                                                                                             |
| ------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Tooltip      | `Tooltip`                                       | A short label on hover or focus; wraps its trigger.                                                              |
| HoverCard    | `HoverCard`                                     | A glance at a record from its id: facts, no actions. The first rung of the hover ladder.                         |
| Popover      | `Popover`, `.Close`                             | A small task on click: a filter form, a picker.                                                                  |
| DropdownMenu | `DropdownMenu`, `.Item`, `.Label`, `.Separator` | A list of actions or options from one trigger element.                                                           |
| Dialog       | `Dialog`                                        | A focused task over the page: title, body, footer with the primary on the right.                                 |
| AlertDialog  | `AlertDialog`                                   | A decision that needs a word first; no close button, `tone="danger"`, `pending` while the caller saves.          |
| Sheet        | `Sheet`                                         | A detail surface that leaves the page visible; `eyebrow`, `facts`, `toolbar`, `onBack` for one frame of a stack. |
| Drawer       | `Drawer`                                        | The bottom sheet, on vaul.                                                                                       |
| Toast        | `Toaster`, `toast`                              | One Toaster near the root; confirmations from anywhere.                                                          |

### Patterns

| Family       | Root and parts                                    | Rule                                                                                                                                                                                                |
| ------------ | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Headers      | `PageHeader`, `RecordHeader`                      | The top of an index and the top of a record. `facts` under the title holds at most six; the rest go in the rail.                                                                                    |
| Card         | `Card`, `.Header`                                 | A framed block on the raised surface.                                                                                                                                                               |
| Empty        | `Empty`                                           | No rows, nothing matches, nothing yet: title, one line of why, one action.                                                                                                                          |
| Related      | `Related`, `.Row`                                 | A small card of linked records with a count.                                                                                                                                                        |
| PreviewSheet | `PreviewSheet`                                    | The peek: a Sheet with the compact record header, at most three facts, the footer's first link opening the record. `onBack` inside a stack.                                                         |
| Glance       | `Glance`                                          | One record type's preview body, written once by the app: id, one status, title, meta and at most four KeyValue rows. A HoverCard shows it at `glance` density; a PreviewSheet at `peek`, rows only. |
| PickerSheet  | `PickerSheet`                                     | Choosing many from hundreds by attribute: search and filters that stay put, a table with selection, a footer that counts; a second frame fills per-row fields.                                      |
| PageSkeleton | `PageSkeleton`                                    | The page before its data.                                                                                                                                                                           |
| Legacy       | `IndexPage`, `ShowPage`, `Section`, `PreviewRail` | No new uses. They retire route by route as screens move to shapes and the peek moves to PreviewSheet.                                                                                               |

### Shapes, shell and mode

| Family    | Root and parts                                                                      | Rule                                                                                                                       |
| --------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| WorkPane  | `WorkPane`, `.Row`                                                                  | Working through a list; the list stays and the detail changes.                                                             |
| Inspector | `Inspector`, `.Group`                                                               | The facts stay put while the content scrolls; every group open until folded.                                               |
| ActionBar | `ActionBar`, `ActionBarState`, `ActionBarAction`                                    | State and the actions that change it, pinned. The first state is the bar's only pill; a blocked action carries its why.    |
| Block     | `Block`                                                                             | A block of work, always open; Collapsible is its closed twin.                                                              |
| Shell     | `Shell`, `.Sidebar`, `.Brand`, `.Mark`, `.NavGroup`, `.NavItem`, `.User`, `.TopBar` | The frame. The product passes the nav data and wraps its Link in `NavItem asChild`; the sidebar never holds phases.        |
| Mode      | `modeScript`, `ModeProvider`, `ModeSwitch`, `useMode`                               | `data-color-mode` on the root; the script in the head applies the stored choice before paint. Nothing else knows the mode. |
| Density   | `densityScript`, `DensityProvider`, `DensitySwitch`, `useDensity`                   | `data-density="compact"` on the root resolves `dimension.row` to 36px; no table takes a density prop.                      |

### What is underneath

Radix: `Dialog`, `AlertDialog`, `Sheet`, `DropdownMenu`, `Popover`, `HoverCard`, `Tooltip`,
`Select`, `Accordion`, `Collapsible`, `Toggle`, `ToggleGroup`, `Progress`, `ScrollArea`,
`Checkbox`, `Switch`, `RadioGroup`. Focus, Escape, outside-click, keyboard and aria come from
there; the kit owns the API and the look. Elsewhere: TanStack Table and Virtual under `DataTable`,
dnd-kit under its reordering, cmdk under `Command` and `Combobox`, vaul under `Drawer`,
react-day-picker under `Calendar` and `DatePicker`, react-resizable-panels under `Resizable`,
recharts under `Chart`, sonner under `Toaster`. No screen imports any of these directly.

## Rules that lint enforces

The package exports an ESLint plugin (`@ledger/design-system/eslint`) whose allowlist is generated
by the token build. Two presets: `package` for the kit itself, `recommended` for a consumer.

- **`no-arbitrary-value`.** `text-[13px]`, `w-[240px]` bypass the tokens.
- **`no-alpha-token`.** A state is a token, never alpha on a base token.
- **`no-dark-variant`.** A `dark:` class means a token is missing.
- **`no-margin`.** Spacing between siblings comes from Stack, Inline and Bleed. `m-auto` is allowed.
- **`no-static-design-value`.** `rounded`, `opacity-50`, `duration-200`, `border-2`, `ring-2`,
  `bg-white` encode a value the tokens own.
- **`no-non-token-class`.** Every class is a token utility or a structural utility from the
  documented list.
- **`no-deprecated-token`.** A deprecated token's utility, with its replacement under `--fix`.
- **`use-primitives`.** Layout in product code goes through Box, Stack, Inline, Flex and Grid.
  Error in the package, warning in `recommended`.
- **`prefer-text-link`.** A `Link` or `a` carrying `text-brand` or `hover:underline`, or a
  `Button variant="link" asChild`, is a TextLink.
- **`no-colgroup`.** Column widths go on `Table.Header width`, not in a `colgroup`.
- **Portability**, inside the package only: no import from `@/…`, from the prototype or from a
  router.

The app's own config (`eslint.config.js` at the root) adds three rules about assembling the kit,
reading the kit's names from the package: **`cell-plain`** (a `Table.Cell` carries no colour,
weight or type token), **`id-not-blue`** (an `Id` is blue only inside a link or button) and
**`no-kit-shadow`** (a domain file imports a kit component instead of declaring its own).

## Adding a component

1. Decide the layer by what it needs to know. If it needs a domain type, it is not a kit component.
2. Put it in the family file it belongs to, or a new file named for the family. Export the root;
   hang parts off it with `Object.assign`.
3. Add it to the layer's `index.ts`.
4. Give it a story under `src/stories/<layer>/`, in the family's Matrix. `npm run ds:check` fails on
   an export without one.
5. Write the rule into the family's `.mdx` page and the row into the table above.

## Rules that stay in the head

- **No `description` on anything new.** A heading may carry a count or a constraint, never an
  explanation of the model.
- **Status is a Badge on a tone map.** A domain chip is `Badge` plus a `Record<Value, Tone>` from
  `lib/`. One line each.
- **Three copies makes a pattern.** The second time a read-out is built by hand, stop and lift it.

## Where the docs are

`npm run storybook -w @ledger/design-system` (port 6007). Guidance pages under
`packages/design-system/src/stories/docs/`: Introduction, Getting started, Token grammar, Lint
rules. Token sheets under `stories/tokens/`, read from the generated docs. One `.mdx` per family
under `stories/primitives/`, `stories/components/` and `stories/patterns/` (Pages, Data table,
Shapes, Shell), each beside the stories it embeds. The specs behind the decisions are in
`docs/superpowers/specs/`.
