# Product design consistency audit — 16 September 2026

> Reviewed together with Claude's census on 2026-09-17 in [Consolidated pattern consistency audit](pattern-consistency-consolidated.md). Use that report for the combined findings, the newly verified lint-scope gap, historical-policy context, and implementation priorities. This original report retains the live evidence and captures.

**Verdict:** the inconsistency is real. Ledger supplies strong styling and component behavior, but the application does not consistently implement complete workflows. A developer can use Ledger throughout, pass the existing checks, and still ship a different creation, table, or preview experience.

This audit separates confirmed defects from choices that the current documentation explicitly permits. No application implementation or business records were changed.

**Scope and evidence**

Reviewed active application routes and shared components, Ledger layout/table/preview/form contracts, Storybook guidance, lint, and CI. Historical fixtures were excluded. Inspected the local running application at `http://localhost:8080` using the seeded workspace: Suppliers, Evidence, My work, Programs, Findings, Profiles, Packages, Products, and the program Requirements and Schedule tabs. Opened supplier and evidence previews, requirement preview, and supplier/product creation dialogs without saving. Desktop checks used 1440 × 1000; focused mobile checks used 390 × 844.

This is a source audit with representative live verification, not an exhaustive visual regression of every route, role, data state, or color mode. Some empty collections could only be assessed from their implementation. Findings marked **source** were not independently reproduced through the browser.

Source inventory: 30 direct `DataTable` JSX sites, 6 `ModelTable` sites, 16 `AssessmentTable` sites, 9 `Shell.Panel` sites, 1 `PreviewSheet` site, and 3 explicit ID-column preview callbacks. These are component call sites, not unique screens, and wrapper counts must not be added to the direct-table count as a screen total. Only one of the nine panel sites supplies the complete previous/next/full-record header.

**Representative preview behavior**

| Experience | Open preview | Surface | Previous / next | Open full record |
| --- | --- | --- | --- | --- |
| Engineering requirements | Eye; separate record links | Shell panel | Yes | Header link, new tab |
| Program systems/elements | Eye or row click | Shell panel | No | No standard header link |
| Catalog controls / CCIs | Row click; no eye | Shell panel | No | No standard record link |
| Suppliers | Name button or row click; no eye | Shell panel | No | Only a related-components link |
| Authorization packages | Name button or row click; no eye | Shell panel | No | Link in body |
| Evidence register | Row click; no eye | Preview sheet | No | “Inspect artifact” in footer |
| Requirement-linked evidence | Eye or row click | Plain dialog | No | No full-record link |
| Observations | Name button or row click; no eye | Plain dialog | No | Inspect link in body |
| Add-evidence picker | Eye or row click | Internal pane in selection dialog | Yes | Selection task intentionally stays in picker |

An eye can be hidden until hover/focus by design. The missing-eye findings above are based on column configuration and DOM inspection, not screenshots alone.

**1. High — incorrect header composition breaks mobile layout. Live confirmed.**

Suppliers and Findings render `PageHeader.Title` and `PageHeader.Description` as separate direct children. The parent has two columns: heading and actions. The description therefore occupies the actions column rather than sitting below the title. At 390px the Suppliers title column measures **0px** and the title wraps one character per line, pushing the table far down the screen.

The same composition occurs in Briefing and the Design system route (**source**). This is an actual misuse of the header contract, not a preference about whether descriptions should exist.

Evidence: [Suppliers](/Users/joseflagorio/Downloads/program_assurance/src/routes/vendors.tsx:23), [Findings](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/findings-views.tsx:32), [Briefing](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/package-views.tsx:373), [Design system](/Users/joseflagorio/Downloads/program_assurance/src/routes/components.tsx:20), [grid definition](/Users/joseflagorio/Downloads/program_assurance/packages/design-system/src/styles/layout.css:39).

Captures: [Suppliers desktop](/Users/joseflagorio/Downloads/program_assurance/artifacts/design-consistency-audit/suppliers-header-desktop.png), [Suppliers mobile](/Users/joseflagorio/Downloads/program_assurance/artifacts/design-consistency-audit/suppliers-header-mobile.png).

**2. High — missing preview affordances also remove keyboard access. Live confirmed for Evidence.**

Evidence uses plain text/status cells and opens the artifact only through a row `onClick`. The inspected row is a `tr` with `tabIndex = -1`, no interactive role, and **zero focusable links or buttons**. A keyboard user cannot reach an equivalent record-opening control in that row. Catalog controls have the same source pattern.

The table gives keyboard row behavior to tree mode; a standard clickable table row does not automatically become keyboard accessible. Requirements demonstrates the stronger implementation: record links plus an explicit eye button.

Evidence: [Evidence columns](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/evidence-browser.tsx:84), [row click](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/evidence-browser.tsx:134), [Catalog control columns](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/library-controls.tsx:64), [table row implementation](/Users/joseflagorio/Downloads/program_assurance/packages/design-system/src/patterns/data-table/data-table.tsx:581).

**3. High — the complete preview workflow exists as a one-off. Live and source confirmed.**

Requirements manually assembles previous, next, position announcement, full-record link, and Close. Other collections recreate subsets of this experience. Suppliers has only Close in the header; Evidence uses a different modal surface and puts the schema-inspector destination in its footer; Packages puts its record link in the body.

This contradicts the documented collection-preview convention requiring previous/next and a full-record link in the panel header. `Shell.Panel` standardizes layout and dismissal, but its actions are optional. It cannot ensure record navigation on its own.

The app wrappers also propagate the omission: `ModelTable` and `AssessmentTable` expose row-open/select callbacks without a matching preview-column contract. Using the wrapper does not produce the eye automatically.

Evidence: [required convention](/Users/joseflagorio/Downloads/program_assurance/docs/guides/component-library.md:149), [complete Requirements implementation](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/requirements-table.tsx:523), [optional panel actions](/Users/joseflagorio/Downloads/program_assurance/packages/design-system/src/layout/shell/panel.tsx:32), [ModelTable](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/record-tools.tsx:111), [AssessmentTable](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/assessment-table.tsx:99).

Captures: [Requirements panel](/Users/joseflagorio/Downloads/program_assurance/artifacts/design-consistency-audit/requirements-preview-panel.png), [Requirements mobile](/Users/joseflagorio/Downloads/program_assurance/artifacts/design-consistency-audit/requirements-preview-mobile.png), [Suppliers panel](/Users/joseflagorio/Downloads/program_assurance/artifacts/design-consistency-audit/suppliers-preview-desktop.png), [Evidence sheet](/Users/joseflagorio/Downloads/program_assurance/artifacts/design-consistency-audit/evidence-preview-sheet.png).

**4. Medium — creation/editing conventions disagree, including draft protection. Source confirmed; dialog examples inspected live.**

Task, evidence, system, and generic product forms use dialogs. Product elements use a sheet. Program creation uses a dedicated wizard page. Some of these distinctions are justified, but the instructions do not define one consistent product decision.

The Forms guide recommends a page/wizard for multi-part creation, a sheet for editing a few fields, and a dialog/popover for one or two fields. The application README and `ProductRecordDialog` instead establish dialogs for product create/edit. Developers have competing instructions and examples to copy.

The differences extend to behavior: `ProductElementSheet` closes unconditionally and unmounts its local draft. It does not check dirty state or block dismissal during save. `SystemElementDialog` and `ProductRecordDialog` guard dismissal. This makes form choice affect recoverability as well as appearance.

Evidence: [Forms surface policy](/Users/joseflagorio/Downloads/program_assurance/packages/design-system/src/stories/patterns/Forms.mdx:80), [product dialog convention and guard](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/product-record-dialog.tsx:79), [product element sheet close](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/product-structure.tsx:490), [sheet unmount](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/product-structure.tsx:305), [system dialog guard](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/system-element-dialog.tsx:96).

The program wizard is a legitimate exception. Its internal editing sheet updates the parent wizard draft; it should not be equated with the product-element sheet's local-draft dismissal behavior.

**5. Medium — table behavior drifts even when the table looks consistent. Source confirmed.**

Work converts due dates into display strings and configures them as text columns. Evidence does the same for Collected. Text columns sort alphanumerically, so formatted English month names can sort alphabetically instead of chronologically. Programs correctly uses date columns. Consistent chrome therefore does not guarantee consistent sorting/filter behavior.

Evidence: [Work date transformation](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/work-table.tsx:72), [Work text column](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/work-table.tsx:86), [Evidence transformation](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/evidence-browser.tsx:76), [Evidence text column](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/evidence-browser.tsx:90), [text sorting implementation](/Users/joseflagorio/Downloads/program_assurance/packages/design-system/src/patterns/data-table/columns.tsx:166), [Programs date columns](/Users/joseflagorio/Downloads/program_assurance/src/routes/programs.tsx:67).

**6. Medium — nested table sections use page headings. Live confirmed.**

The program Schedule tab renders three h1s: the program name, “Lifecycle gates,” and “Program responsibilities.” `ProgramCollection` always uses `PageHeader.Title`, including when embedded as a section or inside a record dialog. Ledger's documented convention is one page h1, with panel/dialog headings using h2 semantics. Requirements already uses an h2 for its embedded table heading.

Evidence: [ProgramCollection heading](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/program-shared.tsx:479), [Schedule consumers](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/program-workspace.tsx:410), [heading convention](/Users/joseflagorio/Downloads/program_assurance/packages/design-system/src/stories/layout/PageHeader.mdx:17), [Requirements section heading](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/requirements-table.tsx:450).

**7. Medium — labels change between the trigger and the form. Live confirmed.**

Suppliers says “Add organization,” then opens a dialog titled “Create party,” with a “Create party” submit button and a Party type field. The generic editor's database-derived noun leaks into a workflow that already has a clear user-facing name. This contributes directly to the feeling that screens were assembled independently.

Evidence: [supplier trigger/editor](/Users/joseflagorio/Downloads/program_assurance/src/routes/vendors.tsx:30), [generic dialog heading](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/product-record-dialog.tsx:92), [party noun](/Users/joseflagorio/Downloads/program_assurance/src/lib/product-records.ts:16), [dialog capture](/Users/joseflagorio/Downloads/program_assurance/artifacts/design-consistency-audit/supplier-create-dialog.png).

**8. Policy gap — description presence and typography are discretionary.**

Evidence, Programs, Test campaigns, and Packages omit descriptions; library pages supply them, often using hand-styled smaller paragraphs. The current PageHeader documentation explicitly says descriptions are optional. Their absence is therefore not presently a rule violation. A product rule must first say which collection pages need explanatory copy and when omission is intentional.

Similarly, plain div wrappers around a title/description can render correctly. The absence of `PageHeader.Heading` alone is not a defect; the direct-sibling layout in finding 1 is.

Evidence: [optional description policy](/Users/joseflagorio/Downloads/program_assurance/packages/design-system/src/stories/layout/PageHeader.mdx:15), [Evidence header](/Users/joseflagorio/Downloads/program_assurance/src/routes/evidence.tsx:12), [Products custom description](/Users/joseflagorio/Downloads/program_assurance/src/components/prototype/library-products.tsx:107), [standard description styling](/Users/joseflagorio/Downloads/program_assurance/packages/design-system/src/layout/page-header.tsx:54).

**Why the existing enforcement misses this**

| Layer | What it currently catches | What remains possible |
| --- | --- | --- |
| Ledger ESLint | Tokens, deprecated names, styling, some composition mistakes | Different create surfaces, missing preview navigation, missing record openers, incorrectly assembled page headers |
| Component API | Individual component props and behavior | Optional actions/preview callbacks omitted by consumers |
| `ds:check` | Story references, family documentation presence, public API inventory | Screens using the wrong composition; contradictory prose/examples |
| CI | Kit stories, accessibility checks, types, lint, domain tests, packaging | Cross-screen product consistency; existing product browser scripts are not invoked by this workflow |
| AI instructions | Lovable history protection | No direction in AGENTS.md to read or follow the current product patterns |

Evidence: [lint rule list](/Users/joseflagorio/Downloads/program_assurance/packages/design-system/eslint-plugin/index.js:799), [CI](/Users/joseflagorio/Downloads/program_assurance/.github/workflows/ci.yml:34), [app Vitest scope](/Users/joseflagorio/Downloads/program_assurance/vitest.app.config.ts:8), [AGENTS.md](/Users/joseflagorio/Downloads/program_assurance/AGENTS.md:1).

Three additional enforcement problems were verified:

- **A real stale lint bug:** `no-kit-shadow` scans the obsolete `shapes` and `shell` folders but omits `layout`. Its export regex also misses named-export declarations. In-memory checks against the actual root ESLint configuration allowed locally declared `PageHeader`, `Section`, `Shell`, and `Badge`, while correctly rejecting local `Stack` and `DataTable`. [Inventory implementation](/Users/joseflagorio/Downloads/program_assurance/packages/design-system/eslint-plugin/index.js:320).
- **Conflicting reference examples:** the Layout queue story omits previous/next and puts an inert “Open full record” button in the body, despite the product convention requiring a real header link. `PreviewSheet` still supports status/facts in its header while the current header guidance excludes them. [Queue specimen](/Users/joseflagorio/Downloads/program_assurance/packages/design-system/src/stories/layout/Pages.stories.tsx:194), [PreviewSheet header](/Users/joseflagorio/Downloads/program_assurance/packages/design-system/src/patterns/preview-sheet.tsx:88).
- **Workflow omissions pass lint:** an in-memory route combining different create surfaces, a panel without record navigation, and a PageHeader without a Title returned **0 errors and 0 warnings**. This demonstrates absent rules; it is not a claim that adding more token lint would solve the workflow problem.

`npm run ds:check` passed during this audit: **275 exports with stories, 99/99 family pages, 529 stories, 751 public API symbols**. Those checks are useful, but their successful result does not establish product-pattern consistency.

**Recommended order of work**

1. **Resolve the product policy and reference examples.** Specify collection versus embedded-table headings, description policy, standard record-opening behavior, create/edit surfaces, and the allowed exceptions. Make AGENTS.md point to that single current source. Update Storybook examples to demonstrate the same contract.
2. **Make the standard workflow reusable in the app.** Centralize the collection preview's eye, selected record, displayed-row navigation, record destination, title, and close behavior. Centralize form framing, consistent action labels/order, and dirty/pending dismissal guards. Keep these as narrow product compositions over the existing Ledger parts.
3. **Repair the confirmed defects and migrate shared wrappers first.** Fix header grouping/mobile collapse, keyboard-accessible row opening, date column types, nested headings, and product-element draft protection. Extend ModelTable/AssessmentTable so consumers can follow the preview convention without rebuilding it.
4. **Enforce the product contract.** Fix the export inventory behind `no-kit-shadow`. Add focused checks for invalid header composition and meaningful browser checks for record links/eyes, previous/next, full-record destinations, displayed-order navigation, dismissal guards, and mobile layout. Run representative actual product flows in CI alongside the kit tests.

Do not flatten all workflows into one surface. The program wizard, record selection/linking dialogs, and focus-contained review tasks can remain distinct when the policy explains their purpose. The goal is that each difference follows an explicit rule and that the standard path no longer depends on every developer remembering a checklist.
