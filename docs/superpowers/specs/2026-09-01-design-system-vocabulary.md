# Design system vocabulary

Proposal, 2026-09-01. Every component the kit exports today, placed in a layer and given the name it will carry. Numbers are the count of files that import it. Nothing here is applied yet.

## Layers

| #   | Layer      | Folder           | Knows about                                                                    | Imports from                 |
| --- | ---------- | ---------------- | ------------------------------------------------------------------------------ | ---------------------------- |
| 0   | Tokens     | `ds/tokens.css`  | Nothing. Colour, type ladder, radius, depth, density as CSS variables.         | —                            |
| 1   | Primitives | `ds/primitives/` | One element, one job. No domain types, no data contracts.                      | Tokens                       |
| 2   | Patterns   | `ds/patterns/`   | Several primitives with a data contract. Still no domain words.                | Primitives, Tokens           |
| 3   | Shapes     | `ds/shapes/`     | A whole screen region and the job it does.                                     | Patterns, Primitives, Tokens |
| 4   | Shell      | `ds/shell/`      | Navigation and the frame around a screen. Knows the route table, nothing else. | Everything below             |

## Naming rules

- **Full words.** No HTML abbreviations. Table.Row, not Tr. A name says what the thing is, never how it looks: Id, not Mono.
- **Compound for parts.** A component with parts hangs them off its name: Table.Cell, Menu.Item, Stat.Tile. Flat exports otherwise.
- **One name per idea.** Two components that do one job become one. Tabs absorbs TabStrip, RailGroup becomes Inspector.Group.
- **No domain words in the kit.** Severity, finding, control and package live in routes and lib. The kit knows tones, identifiers and values.
- **Layers only look down.** A file in a layer imports only from lower layers. Routes import from a layer's index, never from a file inside it.

## 0 · Tokens

| Today                  | Proposed     | Files | Change | Why                                                                                                |
| ---------------------- | ------------ | ----: | ------ | -------------------------------------------------------------------------------------------------- |
| `@theme in styles.css` | `tokens.css` |     1 | move   | The theme block leaves the app stylesheet so a second app can take the tokens without the app CSS. |

## 1 · Primitives

| Today                         | Proposed                        | Files | Change   | Why                                                                              |
| ----------------------------- | ------------------------------- | ----: | -------- | -------------------------------------------------------------------------------- |
| `Button`                      | `Button`                        |    57 | keep     |                                                                                  |
| `IconButton`                  | `IconButton`                    |     2 | keep     |                                                                                  |
| `Badge`                       | `Badge`                         |    82 | keep     | The only pill.                                                                   |
| `Dot`                         | `Dot`                           |    22 | keep     |                                                                                  |
| `Severity`                    | `Indicator`                     |    29 | rename   | Dot plus text is domain-neutral. Severity is one thing it shows, not what it is. |
| `Mono`                        | `Id`                            |    76 | rename   | It no longer means monospace. It marks an identifier and adds tabular numerals.  |
| `IdList`                      | `Id.List`                       |     3 | compound |                                                                                  |
| `IdCell`                      | `Table.Id`                      |    18 | compound | It is a table cell with row-identity behaviour, so it belongs to Table.          |
| `Kbd`                         | `Kbd`                           |     3 | keep     |                                                                                  |
| `Avatar`                      | `Avatar`                        |     3 | keep     |                                                                                  |
| `AvatarStack`                 | `Avatar.Stack`                  |     1 | compound |                                                                                  |
| `Person`                      | `Person`                        |    19 | keep     | Avatar plus name.                                                                |
| `Meter`                       | `Meter`                         |    24 | keep     |                                                                                  |
| `StackedBar`                  | `Meter.Stacked`                 |    10 | compound |                                                                                  |
| `Input · Select · Textarea`   | `Input · Select · Textarea`     |    68 | keep     |                                                                                  |
| `Field`                       | `Field`                         |    18 | keep     | Label, control, hint.                                                            |
| `Label`                       | `Eyebrow`                       |    10 | rename   | It is the 11px caps micro-label. Label collides with form labels.                |
| `Dash`                        | `Empty`                         |    10 | rename   | Names the meaning, an absent value, not the glyph.                               |
| `KeyValue`                    | `KeyValue`                      |    38 | keep     |                                                                                  |
| `Fact`                        | `Fact`                          |     6 | keep     | Inline label and value in the strip under a record header.                       |
| `Prose`                       | `Prose`                         |     2 | keep     |                                                                                  |
| `Stat`                        | `Stat`                          |     5 | keep     | The bare number.                                                                 |
| `Tile`                        | `Stat.Tile`                     |     6 | compound | The framed number.                                                               |
| `Tiles (compositions.tsx)`    | `Stat.Grid`                     |     2 | compound | The band of tiles. Numbers become one family and compositions.tsx goes away.     |
| `Notice`                      | `Notice`                        |     3 | keep     |                                                                                  |
| `Table`                       | `Table`                         |    68 | keep     |                                                                                  |
| `Tr`                          | `Table.Row`                     |    61 | compound | Full words. Reads as a system, not as markup.                                    |
| `Td`                          | `Table.Cell`                    |    61 | compound |                                                                                  |
| `Th`                          | `Table.Header`                  |    60 | compound |                                                                                  |
| `TabStrip`                    | `Tabs`                          |    18 | rename   | Already handles both links and buttons, so it becomes the one Tabs.              |
| `Tabs`                        | `Tabs`                          |     3 | fold     | Link-only variant. Folds into the renamed TabStrip.                              |
| `FilterChip`                  | `FilterChip`                    |     8 | keep     |                                                                                  |
| `SegmentedControl`            | `SegmentedControl`              |     2 | keep     |                                                                                  |
| `Menu · MenuItem · MenuLabel` | `Menu · Menu.Item · Menu.Label` |     6 | compound |                                                                                  |
| `Toolbar`                     | `Toolbar`                       |    12 | keep     |                                                                                  |
| `Tone (type)`                 | `Tone`                          |    37 | keep     | neutral · success · warning · danger · info. The only route to colour.           |

## 2 · Patterns

| Today                      | Proposed                | Files | Change   | Why                                                                    |
| -------------------------- | ----------------------- | ----: | -------- | ---------------------------------------------------------------------- |
| `Card · CardHeader`        | `Card · Card.Header`    |    15 | compound |                                                                        |
| `PageHeader`               | `PageHeader`            |    18 | keep     |                                                                        |
| `RecordHeader`             | `RecordHeader`          |    26 | keep     |                                                                        |
| `Modal`                    | `Modal`                 |    15 | keep     |                                                                        |
| `Drawer`                   | `Drawer`                |     4 | keep     |                                                                        |
| `PreviewRail`              | `PreviewRail`           |     6 | keep     | Preview surface beside a table. Never the record itself.               |
| `RelatedCard · RelatedRow` | `Related · Related.Row` |     2 | compound | It is a list, not a card.                                              |
| `EmptyState`               | `EmptyState`            |    24 | keep     |                                                                        |
| `RailGroup`                | `Inspector.Group`       |    30 | fold     | The pre-Inspector group. Alias first, then codemod.                    |
| `Section`                  | `Section`               |    48 | legacy   | No new uses. Block and Disclosure replace it as routes move to shapes. |
| `IndexPage · ShowPage`     | `IndexPage · ShowPage`  |    36 | legacy   | The two old archetypes. Retire when the last route leaves them.        |

## 3 · Shapes

| Today                              | Proposed                                         | Files | Change   | Why                                     |
| ---------------------------------- | ------------------------------------------------ | ----: | -------- | --------------------------------------- |
| `WorkPane · WorkPaneRow`           | `WorkPane · WorkPane.Row`                        |     2 | compound |                                         |
| `ActionBar · BarState · BarAction` | `ActionBar · ActionBar.State · ActionBar.Action` |     4 | compound | The two types take the bar's name.      |
| `Inspector · InspectorGroup`       | `Inspector · Inspector.Group`                    |     5 | compound |                                         |
| `InspectorRow`                     | `KeyValue`                                       |     0 | delete   | Zero uses. KeyValue already is the row. |
| `Disclosure`                       | `Disclosure`                                     |     4 | keep     |                                         |
| `Block`                            | `Block`                                          |     4 | keep     |                                         |

## 4 · Shell

| Today   | Proposed | Files | Change | Why                                                             |
| ------- | -------- | ----: | ------ | --------------------------------------------------------------- |
| `Shell` | `Shell`  |    41 | keep   | Sidebar and TopBar stay internal until a second app needs them. |

## Infrastructure

- **Folders follow layers.** src/ds/ with tokens.css, primitives/, patterns/, shapes/, shell/, each with an index.ts. Routes import @/ds/primitives and friends. ui.tsx, shapes.tsx, shell.tsx and compositions.tsx dissolve into them. The old rule that ui.tsx must not be split is lifted; it protected a prototype, and the system is now the deliverable.
- **Rules become lint.** Layer boundaries via no-restricted-imports per folder. Three small local rules: a Table.Cell className carries no colour, weight or size token; an Id is never text-primary outside a Link or button; no file outside src/ds declares a component that shares a kit name. One script checks that every export in src/ds has a story.
- **Storybook mirrors the layers.** Story titles become Tokens/…, Primitives/…, Patterns/…, Shapes/…, Shell/…. The sidebar then is the vocabulary, and this page retires into docs/guides once the renames land.
- **Dead weight goes.** src/components/ui holds 46 shadcn files that nothing imports. Deleting them removes the second Button and the second Badge from every search result.

## Open questions

1. Name of the system. Ledger, matching the light theme, so the folder is src/ledger? Or plain src/ds?
2. Compound names (Table.Cell) or flat (TableCell)? Compound is the recommendation; the codemod is the same either way.
3. The four renames that change meaning: Mono to Id, Severity to Indicator, Label to Eyebrow, Dash to Empty. Any you would name differently?
4. Retire Section, IndexPage and ShowPage now (84 files change) or when routes move to shapes route by route?
5. Delete the shadcn folder?

## Then

On a go: one codemod commit per layer (rename, then move), lint rules in a fourth commit, Storybook titles in a fifth. Type-check, lint and Storybook stay green after each.

## Applied

Landed 2026-09-02 on main in six commits: primitives renamed, patterns and shapes renamed, kit
moved into `src/ds` by layer, local copies folded and cells finished going plain, rules as lint plus
`ds:check`, Storybook retitled, shadcn deleted. Deviations from the table above: `ActionBar.State`
and `ActionBar.Action` are the flat types `ActionBarState` and `ActionBarAction` (the repo's lint
forbids TypeScript namespaces); `InspectorGroup` the type became `InspectorGroupData`. The five open
questions resolved to the defaults: folder `src/ds`, system name Ledger, compound names, legacy
archetypes retire route by route, shadcn deleted. The current vocabulary lives in
`docs/guides/component-library.md`.
