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
  `DropdownMenu.Item`, `Stat.Tile`, `Inspector.Group`. Flat exports otherwise.
- **One name per idea.** Two components that do one job become one. `Tabs` absorbed `TabStrip`;
  `RailGroup` became `Inspector.Group`.
- **No domain words in the kit.** Severity, finding, control and package live in routes and `lib`.
  The kit knows tones, identifiers and values.

## Families

Every family has a story under `src/stories`; `npm run ds:check` fails when an export has none.

### Structure

| Family      | Root and parts                                                     | Notes                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table       | `Table`, `.Row`, `.Cell`, `.Header`, `.Id`, `.Selection`, `.Group` | `.Header` sorts with `sort`/`onSort` and pins with `sticky`; `.Row selected` tints; `.Selection` is the checkbox column; `.Group` is a band of rows that opens and closes. |
| Pagination  | `Pagination`                                                       | Row range on the left, up to seven page numbers with gaps on the right. Pages are 1-based.                                                                                 |
| Item        | `Item`, `.Group`                                                   | One record in a list: id, title, meta, trailing. Links with `to` or selects with `onSelect`.                                                                               |
| Timeline    | `Timeline`, `.Group`, `.Item`                                      | Dated events under day or phase labels. `marker`, `tone`, `emphasis` for unread.                                                                                           |
| Stepper     | `Stepper`, `.Item`, `StepState`                                    | Ordered stages: done, current, upcoming, blocked. Horizontal or vertical.                                                                                                  |
| Tree        | `Tree`, `.Item`                                                    | Nested rows with depth lines and expand toggles; a leaf shows a dot.                                                                                                       |
| Accordion   | `Accordion`, `.Item`                                               | Several titled sections, one or many open.                                                                                                                                 |
| Collapsible | `Collapsible`                                                      | One titled section that opens and closes; `count` beside the title.                                                                                                        |
| Breadcrumb  | `Breadcrumb`                                                       | A trail of muted links; the last item is the current page and is not a link.                                                                                               |
| Tabs        | `Tabs`                                                             |                                                                                                                                                                            |
| Toolbar     | `Toolbar`                                                          | Search, filters and view controls in one band.                                                                                                                             |
| ScrollArea  | `ScrollArea`                                                       | The kit's thin scrollbar for rails and picker lists; `orientation`.                                                                                                        |
| Resizable   | `Resizable`, `.Panel`, `.Handle`                                   | Panes a person sizes. A number is a percentage of the group; a string carries its unit (`"240px"`).                                                                        |
| CodeBlock   | `CodeBlock`                                                        | Source with a sticky line-number gutter; `lines` are rendered nodes so the caller owns highlighting, `start` numbers a window.                                             |
| Separator   | `Separator`                                                        | Hairline, horizontal or vertical.                                                                                                                                          |
| Skeleton    | `Skeleton`, `Spinner`                                              | Loading placeholder (`lines` stacks bars) and the in-button spinner.                                                                                                       |

### Identity and value

| Family   | Root and parts                                   | Notes                                                                                                              |
| -------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Id       | `Id`, `.List`                                    | Marks an identifier. Inherits the surrounding font, size and colour; adds tabular numerals. Never blue on its own. |
| Badge    | `Badge`, `Dot`, `Indicator`                      | Badge is the only pill. Indicator is dot plus text.                                                                |
| Progress | `Progress`, `.Stacked`                           | One bar or several segments; Radix underneath for the aria.                                                        |
| Avatar   | `Avatar`, `.Stack`, `Person`                     | Person is avatar plus name.                                                                                        |
| Stat     | `Stat`, `.Tile`, `.Grid`                         | Bare number, framed number, band of tiles.                                                                         |
| Text     | `Eyebrow`, `Absent`, `Prose`, `Fact`, `KeyValue` | `Eyebrow` is the 11px caps micro-label. `Absent` is the absent value; `Empty` is the pattern for no rows.          |
| Kbd      | `Kbd`                                            | A key cap: `⌘K`, `esc`.                                                                                            |

### Input

| Family     | Root and parts                                                                                          | Notes                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Button     | `Button`, `IconButton`, `ButtonGroup`                                                                   | ButtonGroup joins buttons of one size: corners meet, inner borders collapse.        |
| Toggle     | `Toggle`, `ToggleGroup`                                                                                 | One thing on or off; several that share one answer.                                 |
| Field      | `Field`, `Input`, `Textarea`, `InputGroup`, `NativeSelect`                                              | InputGroup puts an icon, text or Kbd before or after an Input.                      |
| Choice     | `Checkbox`, `Switch`, `RadioGroup`, `.Item`                                                             | Children become the label. A checked state is the selection use of the blue budget. |
| Select     | `Select`, `.Item`, `.Group`, `.Separator`                                                               | Radix select for records and forms; NativeSelect stays for dense filter rows.       |
| Combobox   | `Combobox`, `ComboboxOption`                                                                            | Searchable single choice from a list; options carry `keywords` and `meta`.          |
| Command    | `Command`, `.Input`, `.List`, `.Empty`, `.Group`, `.Item`, `.Separator`, `.Footer`, `.Count`, `.Dialog` | The palette and every record picker, on cmdk. `.Dialog` wraps it in an overlay.     |
| Date       | `DatePicker`, `Calendar`                                                                                | ISO `yyyy-MM-dd` in and out; Calendar is react-day-picker in kit clothes.           |
| Editable   | `Editable.Text`, `Editable.Select`, `EditableProps`                                                     | Click-to-edit with `validate` and `save`; the rail and record headers use it.       |
| FilterChip | `FilterChip`                                                                                            | An applied filter with its value and a way to clear it.                             |

### Overlay and notice

| Family       | Root and parts                                  | Notes                                                                                       |
| ------------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Dialog       | `Dialog`                                        | Centred modal with title, body, footer.                                                     |
| AlertDialog  | `AlertDialog`                                   | Confirm before something that cannot be undone; `tone="danger"`, `pending`.                 |
| Sheet        | `Sheet`                                         | Panel from the edge; `side`.                                                                |
| Drawer       | `Drawer`                                        | Bottom sheet that drags to close, on vaul.                                                  |
| DropdownMenu | `DropdownMenu`, `.Item`, `.Label`, `.Separator` | One element as trigger; the render-prop forms still compile.                                |
| Popover      | `Popover`, `.Close`                             | Anchored surface for a small task: a filter form, a picker.                                 |
| HoverCard    | `HoverCard`                                     | A peek at a record from its id; no actions. The child must take a ref and spread its props. |
| Tooltip      | `Tooltip`                                       | Short label on hover or focus; wraps its trigger.                                           |
| Alert        | `Alert`                                         | Inline notice with a tone; `role` follows the tone.                                         |
| Toast        | `Toaster`, `toast`                              | One Toaster near the root; confirmations from anywhere.                                     |

### Patterns and shapes

| Family    | Root and parts                                   | Notes                                                                  |
| --------- | ------------------------------------------------ | ---------------------------------------------------------------------- |
| Card      | `Card`, `.Header`                                |                                                                        |
| Empty     | `Empty`                                          | No rows, nothing matches, nothing yet: title, description, one action. |
| Headers   | `PageHeader`, `RecordHeader`                     | The top of an index and the top of a record.                           |
| Related   | `Related`, `.Row`                                | A list of related records with one link out.                           |
| WorkPane  | `WorkPane`, `.Row`                               | Master–detail.                                                         |
| Inspector | `Inspector`, `.Group`                            | Sticky facts. `.Group` is also the group in legacy rails.              |
| ActionBar | `ActionBar`, `ActionBarState`, `ActionBarAction` | First state is the bar's only pill; the rest are dot plus text.        |
| Block     | `Block`                                          | A titled region of a screen.                                           |

Legacy, no new uses: `Section`, `IndexPage`, `ShowPage`, `PreviewRail`. They retire route by route
as screens move to shapes.

### What is underneath

Radix: `Dialog`, `AlertDialog`, `Sheet`, `DropdownMenu`, `Popover`, `HoverCard`, `Tooltip`,
`Select`, `Accordion`, `Collapsible`, `Toggle`, `ToggleGroup`, `Progress`, `ScrollArea`,
`Checkbox`, `Switch`, `RadioGroup`. Focus, Escape, outside-click, keyboard and aria come from
there; the kit owns the API and the look. Elsewhere: cmdk under `Command` and `Combobox`, vaul
under `Drawer`, react-day-picker under `Calendar` and `DatePicker`, react-resizable-panels under
`Resizable`, sonner under `Toaster`. No screen imports any of these directly.

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
