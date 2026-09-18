# Feature compositions

The screens of the product, composed from `@ledger/design-system` parts over the domain modules in `src/lib`. Each file here is one feature composition or the shared adapter several of them use. This map says what each one is and which files are the references named by [the product pattern contract](../../../docs/guides/product-patterns.md); read that contract before changing a screen, and copy its reference for the shape you are building rather than the nearest neighbour.

## Shared adapters and hosts

| File                                                       | Role                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `product-collection.tsx`                                   | **Reference: register adapter.** Every product collection composes it: toolbar, query recovery, responsive table and empty region. Domain adapters keep their typed columns.                                                                           |
| `record-preview.tsx`                                       | **Reference: preview host.** `RecordPreviewProvider` owns one `Shell.Panel` across registers; `RecordPreviewPanel` and `RecordPreviewActions` supply the outer navigation and inner record header; `RecordLink` renders a name as a router `TextLink`. |
| `record-summary-preview.tsx`                               | A generic preview body for collections without a domain-specific one.                                                                                                                                                                                  |
| `record-tools.tsx`                                         | The schema-record register on `DataTable`: kinds decided by key, the two empties. Used by the inspector routes.                                                                                                                                        |
| `work-common.tsx`                                          | **Reference: states.** `QueryState` (loading, failure, retry with stale content kept), `StatusBadge` and the shared tone maps for work records.                                                                                                        |
| `work-format.ts`, `library-utils.ts`, `assessment-tabs.ts` | Formatting, download and tab helpers. No rendering.                                                                                                                                                                                                    |
| `use-system-assurance.ts`                                  | The one projection every system surface reads: tree, preview and record.                                                                                                                                                                               |

## Registers

| File                                                                                                                       | Collection                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `work-table.tsx`                                                                                                           | **Reference: standalone register.** My work: the task table whose toolbar shape every register takes.  |
| `requirements-table.tsx`                                                                                                   | **Reference: collection preview.** Requirements with the panel preview fed from the displayed rows.    |
| `assessment-table.tsx`, `assessment-browser.tsx`                                                                           | Assessment campaigns, events, objectives and a program's scopes.                                       |
| `evidence-browser.tsx`                                                                                                     | Evidence artifacts; the version review is the one modal preview (`evidence-version-details.tsx`).      |
| `findings-views.tsx`                                                                                                       | Findings: operational issues and observations (`observations-register.tsx`).                           |
| `assurance-views.tsx`                                                                                                      | The risk register and the POA&M workspace.                                                             |
| `package-views.tsx`                                                                                                        | Authorization packages.                                                                                |
| `library-components.tsx`, `library-products.tsx`, `library-requirements.tsx`, `library-controls.tsx`, `library-shared.tsx` | The libraries: components, products, requirement definitions, the control table and the shared select. |
| `program-workspace.tsx`                                                                                                    | The programs register and the program tab set.                                                         |

## Records and their tabs

| File                                                                                                                                            | Record                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `program-record.tsx`, `program-shared.tsx`, `program-timeline.tsx`                                                                              | The program record: tabs in the URL, the shared tone map and panel host, milestones from the recorded gate schedule.                                |
| `program-systems-tree.tsx`                                                                                                                      | **Reference: responsive table and system preview.** The program's System tab: the tree, the preview whose inner header carries the record actions.  |
| `system-assurance-details.tsx`, `system-baseline.tsx`, `system-requirements.tsx`, `system-library.tsx`, `system-evidence.tsx`                   | The element record's tabs: Overview details, Baseline, Requirements, Library, Evidence.                                                             |
| `system-element-dialog.tsx`                                                                                                                     | Create or edit a canonical system identity.                                                                                                         |
| `requirement-record.tsx`, `requirement-form.tsx`, `requirement-evidence.tsx`, `requirement-allocations.tsx`, `requirement-control-mappings.tsx` | The requirement record: the page and the preview share it; one authored field saved at a time through `Editable`; allocations and control mappings. |
| `assessment-campaign.tsx`                                                                                                                       | The campaign record.                                                                                                                                |
| `product-structure.tsx`, `product-record-dialog.tsx`                                                                                            | A product version's element tree and the product form content.                                                                                      |
| `program-library.tsx`, `library-update-review.tsx`                                                                                              | The program's Library roll-up and the review of taking a newer library version.                                                                     |
| `ssp-assembly.tsx`                                                                                                                              | Boundary SSP assembly.                                                                                                                              |

## Forms and pickers

| File                                 | Operation                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------- |
| `create-task-dialog.tsx`             | **Reference: create form.** Create task: the Dialog whose trigger, title and primary agree. |
| `create-evidence-dialog.tsx`         | Create evidence artifact.                                                                   |
| `add-requirement-details-dialog.tsx` | Add authored content to a requirement.                                                      |
| `add-from-library.tsx`               | Add from library: the `PickerSheet` with the target × claim matrix.                         |
| `add-product-system.tsx`             | From a product: pick a published version and configuration.                                 |

The wizard, the pickers shared with the inspector, the confirmation dialog and the shell live in `src/components/app`. Routes in `src/routes` assemble these compositions and set the browser title; a route holds no domain logic of its own.
