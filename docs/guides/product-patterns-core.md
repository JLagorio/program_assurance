# Product contract, part one: the core

Every session loads this page. It says what each screen is for and what it leaves out; [part two](product-patterns.md) gives each page type's anatomy, the verbs, hierarchy, states, the glossary and the process. Ledger's Storybook says what each part does. A sentence that holds for one screen lives in that screen's file header, never here. Both parts stay under 4,000 words and this one under 1,500 (`npm run check:contract-budget`).

## Principles

1. **One question, one primary.** Each surface answers one question and shows at most one filled primary, in its page type's slot. A primary that cannot run keeps its place with `disabledReason`; a viewer sees no edit verb. Check: B2, `ledger/dialog-footer-order`.
2. **State beside the name.** A record's status sits beside its h1, its trail above it and its facts in Details; its next step is derived (`src/lib/next-steps.ts`), never authored. Check: B6, B14.
3. **Say it once.** One home per fact; anywhere else it is a number that opens that home. Check: B5.
4. **Absence is silent; problems are loud.** No zero rows, empty facts, constant columns or charts under seven points. A missing owner and a past date say so in warning words. A value that could not be read is never a zero. Check: B3, B4, B13, `DueDate`.
5. **Numbers and status words, not sentences.** Labels, numbers, RMF's words and verbs; a description is authored, never computed. Check: B1, B8, B9.
6. **Places are visible; menus hold commands.** Every destination, tab and view is on the page and in the address, never only in a menu. Buttons act; links navigate. Check: B10, B11, `ledger/link-button-navigation`, `ledger/text-link-navigation`.

## Page types

Every screen is one of seven page types. One that fits none gets a dated entry in [the decisions log](../decisions.md) before it is built. The [screen inventory](screen-inventory.json) names each route's family and holds its budget values; the schema inspector (`/schema`, `/records/*`) is diagnostics, outside the seven.

| Type      | It answers                             | Today                                                                                     | Its one primary                                       | Words above the fold        |
| --------- | -------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- | --------------------------- |
| Home      | What needs me?                         | My work (Tasks, Attention)                                                                | a row's own verb; Create task in Tasks                | 90, no chart                |
| Overview  | Where does it stand, and what moves it? | Authorization decisions, a record's Overview tab, a program's standing views | none: each count opens the register that does the work | 80, four figures, one chart |
| Register  | Which records, and which first?        | every standalone register, the Portfolio's hierarchy too; a tab that is one collection | Create, small, in the toolbar; the selection bar's verbs | 40 of chrome, seven columns |
| Record    | What is it, what state, what next?     | every record page and its preview                                                         | Edit in the header; a preview's one small primary     | 120, three sections         |
| Workspace | One job over many records              | Workbook, Traceability matrix, Control baseline                                           | the job's finalizing verb                             | 60, one visual; B10 spares its toolbar |
| Flow      | One decision                           | Dialog, PickerSheet, RecordBrowser, confirmation, Program setup                           | the footer's, in its trigger's words                  | 80 a step, eight fields     |
| Library   | Read reference data                    | the catalog and its controls, profiles, framework items                                   | none; Publish on a draft                              | 60 of chrome                |

## Actions

Each kind of action has one home, so a reader knows where the next step is before reading.

| Kind     | Examples                                                       | Home                                                                    | Weight                                                   |
| -------- | -------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------- |
| Advance  | Map a requirement, Add to assessment campaign, Publish assessment results | a record's slot or trace stage; a preview                               | a link-styled Button that opens over the page, or the primary |
| Sign     | Record decision, Accept risk                                    | the same slots, for its role only                                       | others see it with its reason; never in a selection bar  |
| Create   | Create risk                                                    | a register's toolbar; a section's toolbar elsewhere                     | small primary on a register, small secondary elsewhere   |
| Global   | Edit, Delete, Create version 3                                  | the record header: Edit, then the Actions menu                          | primary, then menu                                       |
| Content  | Link evidence, Map control, Assign owner                        | the section's toolbar; the selection bar                                | small secondary                                          |
| Row      | Unlink requirement, Remove allocation                           | the row's actions and the same item in the preview's overflow           | subtle; danger where it removes                          |
| Finalize | Create task, Apply, Publish version                             | the dialog or sheet footer; a workspace's own bar                       | that surface's primary                                   |
| Navigate | tabs, the views row, the trail, trace stages, View all          | links, line tabs, `LinkButton`                                          | never a Button, never only in a menu                     |

## Budgets

Rules every route keeps. A route's values sit beside it in the screen inventory and may only fall; raising one takes a dated entry in the decisions log.

- **B1** Words above the fold within the page type's budget (40 to 120).
- **B2** Exactly one filled primary per surface.
- **B3** A zero row, tile or segment is not drawn; a group of only zeros is one line.
- **B4** A column whose values are all identical or empty is not drawn (it folds).
- **B5** A label and value pair appears once per page.
- **B6** No empty fact rows; a rail of at most 8 rows.
- **B7** At most 3 sections above the fold; adjacent empty sections merge into one line.
- **B8** A description is authored text of at most 80 characters, never computed copy.
- **B9** UI strings of at most 12 words; an empty state's line at most 10.
- **B10** At most 12 visible buttons in the page body, row controls aside.
- **B11** At most 7 tabs.
- **B12** At most 2 marks per table cell.
- **B13** One chart per page outside a workspace; a trend needs 7 points.
- **B14** A status pill only where the status varies on the page.
- **B15** No name cut at 1440px while its table has unused width.
- **B16** At most 2 saturated status hues above the fold.
