# Ledger: the component library

Ledger is the design system. It lives in `src/ds`, one folder per layer, and the layer says how
much a component is allowed to know. Everything a screen is made of comes from one of them.

| #   | Layer          | Folder               | Knows about                                                                                       | Imports from         |
| --- | -------------- | -------------------- | ------------------------------------------------------------------------------------------------- | -------------------- |
| 0   | **Tokens**     | `src/ds/tokens.css`  | Nothing. Colour, type ladder, radius, depth, density as CSS variables and the Tailwind theme map. | —                    |
| 1   | **Primitives** | `src/ds/primitives/` | One element, one job. No domain types, no data contracts.                                         | Tokens               |
| 2   | **Patterns**   | `src/ds/patterns/`   | Several primitives with a data contract. Still no domain words.                                   | Primitives           |
| 3   | **Shapes**     | `src/ds/shapes/`     | A whole screen region and the job it does.                                                        | Patterns, Primitives |
| 4   | **Shell**      | `src/ds/shell/`      | Navigation and the frame around a screen. Knows the route table, nothing else.                    | Everything below     |

Domain files (`src/components/app/*.tsx`) and routes assemble these. They may own a tone map for
their vocabulary and a component that binds data to a pattern. They never declare a primitive.

## Importing

App code imports a layer's index, never a file inside it:

```ts
import { Badge, Table, Id, Indicator } from "@/ds/primitives";
import { Card, RecordHeader } from "@/ds/patterns";
import { ActionBar, Inspector, WorkPane } from "@/ds/shapes";
import { Shell } from "@/ds/shell";
```

Inside `src/ds`, files import each other by path (`./tone`, `../primitives/badge`) so the
dependency graph stays visible. A layer only imports from layers below it.

## Naming

- **Full words.** `Table.Row`, not `Tr`. A name says what the thing is, never how it looks: `Id`,
  not `Mono`.
- **Compound for parts.** A component with parts hangs them off its name: `Table.Cell`,
  `Menu.Item`, `Stat.Tile`, `Inspector.Group`. Flat exports otherwise.
- **One name per idea.** Two components that do one job become one. `Tabs` absorbed `TabStrip`;
  `RailGroup` became `Inspector.Group`.
- **No domain words in the kit.** Severity, finding, control and package live in routes and `lib`.
  The kit knows tones, identifiers and values.

## Families

| Family    | Root and parts                                   | Notes                                                                                       |
| --------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Table     | `Table`, `.Row`, `.Cell`, `.Header`, `.Id`       | `.Id` is the row-identity cell: plain at rest, blue on row hover.                           |
| Id        | `Id`, `.List`                                    | Marks an identifier. Inherits the surrounding font, size and colour; adds tabular numerals. |
| Badge     | `Badge`, `Dot`, `Indicator`                      | Badge is the only pill. Indicator is dot plus text.                                         |
| Meter     | `Meter`, `.Stacked`                              |                                                                                             |
| Avatar    | `Avatar`, `.Stack`, `Person`                     | Person is avatar plus name.                                                                 |
| Stat      | `Stat`, `.Tile`, `.Grid`                         | Bare number, framed number, band of tiles.                                                  |
| Menu      | `Menu`, `.Item`, `.Label`                        |                                                                                             |
| Card      | `Card`, `.Header`                                |                                                                                             |
| Related   | `Related`, `.Row`                                | A list of related records with one link out.                                                |
| WorkPane  | `WorkPane`, `.Row`                               | Master–detail.                                                                              |
| Inspector | `Inspector`, `.Group`                            | Sticky facts. `.Group` is also the group in legacy rails.                                   |
| ActionBar | `ActionBar`, `ActionBarState`, `ActionBarAction` | First state is the bar's only pill; the rest are dot plus text.                             |
| Text      | `Eyebrow`, `Empty`, `Prose`, `Fact`, `KeyValue`  | `Eyebrow` is the 11px caps micro-label. `Empty` is the absent value.                        |
| Choice    | `Checkbox`, `Switch`, `Radio`, `.Item`           | Children become the label. A checked state is the selection use of the blue budget.         |
| Tooltip   | `Tooltip`                                        | Short label on hover or focus; wraps its trigger.                                           |
| Popover   | `Popover`, `.Close`                              | Anchored surface for a small task: a filter form, a picker.                                 |
| Toast     | `Toaster`, `toast`                               | One Toaster near the root; confirmations from anywhere.                                     |
| Skeleton  | `Skeleton`                                       | Loading placeholder; `lines` stacks bars.                                                   |
| Separator | `Separator`                                      | Hairline, horizontal or vertical.                                                           |

Legacy, no new uses: `Section`, `IndexPage`, `ShowPage`. They retire route by route as screens
move to shapes.

Overlays and choice controls (`Modal`, `Drawer`, `Menu`, `Popover`, `Tooltip`, `Checkbox`, `Switch`,
`Radio`) are Radix underneath. Focus, Escape, outside-click, keyboard and aria come from there; the
kit owns the API and the look. A `Menu` trigger opens the menu itself; the `toggle` in its render
prop is inert and stays only so existing triggers compile.

## Rules that lint enforces

- **`ledger/cell-plain`.** A `Table.Cell` className carries no colour, weight or size token. A row
  is 13px regular foreground; only a Badge, Dot, Indicator or `text-danger` may differ.
- **`ledger/id-not-blue`.** An `Id` is `text-primary` only inside a `Link`, `a`, `button` or
  `Button`. Blue means link.
- **`ledger/no-kit-shadow`.** No file outside `src/ds` declares a component that shares a kit
  name. Import it.
- **Layer boundaries.** `no-restricted-imports` per folder: primitives cannot import patterns,
  shapes or the shell; patterns cannot import shapes or the shell; shapes cannot import the shell;
  nothing in `src/ds` imports app code except `@/lib/utils`. App code cannot import a file inside a
  layer.

## Adding a component

1. Decide the layer by what it needs to know. If it needs a domain type, it is not a kit component.
2. Put it in the family file it belongs to, or a new file named for the family. Export the root;
   hang parts off it with `Object.assign`.
3. Add it to the layer's `index.ts`.
4. Give it a story under `src/stories/<Layer>/`. `npm run ds:check` fails on an export without one.
5. Update the docs in this folder that the change touches.

## Rules that stay in the head

- **No `description` on anything new.** A heading may carry a count or a constraint, never an
  explanation of the model.
- **Status is a Badge on a tone map.** A domain chip is `Badge` plus a `Record<Value, Tone>` from
  `lib/`. One line each.
- **Three copies makes a pattern.** The second time a read-out is built by hand, stop and lift it.
