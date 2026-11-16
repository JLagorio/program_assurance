// From the product pattern contract (docs/guides/product-patterns.md), moved here on
// 2026-11-16 when the contract was cut to its rules: what holds for this screen alone, and the
// full wording of rules the contract now states in fewer words.
//
// A program workbook is a dedicated working surface for requirements, traceability mappings and
// analytical sheets. Its grid uses Ledger's Spreadsheet pattern, with a formula/name bar, worksheet
// navigation, selection, typed editing and a bounded scrolling viewport. It is a separate
// interaction family from the responsive DataTable registers. The existing registers retain their
// navigation and preview contracts; their collection actions link to the workbook. The workbook
// keeps record drill-through and the shared record preview, including at 390px. Its compact toolbar
// groups editing, column sizing, filtering, sorting, view selection, formatting and workbook
// commands directly above the formula bar. Review and Save stay in the workbook header. The toolbar
// scrolls horizontally with visible overflow arrows on narrow screens, independently of the
// two-dimensional cell viewport; keyboard focus reveals each control. Column-header menus expose
// sizing, sorting, filtering and, on analysis sheets, insertion and deletion. Cell, row and column
// context menus use the clicked target and preserve an existing range when invoked inside it. A
// single worksheet strip exposes the sheet picker, per-sheet actions, dimensions and add controls.
// Letter-only headings avoid repeating field names from row one. Hidden axes retain canonical
// addresses, and analysis comments, dropdown rules, formatting and sheet order persist with the
// analysis document. Row boundaries support dragging, fit-to-content and automatic sizing; wrapped
// text and larger fonts grow automatic rows, while fixed rows clip their content. Vertical
// alignment controls placement in tall rows. Visual styles on source cells persist by stable
// row/column identity, separately from canonical values and field types. Source structures remain
// managed by their record workflows; duplicating a source creates an independent analysis copy.
// Filtering and sorting use displayed values without changing canonical cell addresses. Every cell
// remains keyboard reachable.
//
// Record-backed sheets bind cells to immutable record and field identities. Sorting and filtering
// change presentation only. Authored requirement fields and permitted mapping fields enter a local
// changeset; derived fields and relationship identities stay read-only. Completing a cell edit,
// including clicking away, only stages that edit. Narrative fields preserve line breaks, and owner
// pickers, cell display, filtering and sorting use consistent human-readable labels. A review
// Dialog names every affected record and field, shows before/after values and validation errors,
// and applies the changes through one revision-checked, idempotent server transaction. A failed or
// uncertain save retains its request identity and draft. Undo before applying affects the local
// changeset; a persisted reversal is a new audited edit. Formula results never silently become
// authoritative assurance facts.
//
// The application owns typed field definitions, source queries, permission checks, relationship
// pickers and persistence. Ledger owns neutral cell interactions, command scopes and change
// presentation. The spreadsheet core owns workbook operations, calculation and interchange, with no
// dependency on application records or UI. Analytical sheets may reference the complete bounded
// source snapshot; the workbook identifies that snapshot and refuses partial results rather than
// presenting a current page as a complete program. Refreshing source data must preserve or
// explicitly resolve outstanding edits. Workbook layout and analytical content persist separately
// from canonical requirement and mapping records.
//
// Commands are registered once per active scope and reused by buttons, menus and the workbook
// command palette. Text composition and an active cell editor retain their keyboard ownership. The
// workbook palette uses a separate shortcut from the application's record search. Optional presence
// describes collaborators' selections, and is not an authorization mechanism or a saved business
// change.

import { createFileRoute } from "@tanstack/react-router";
import { RecordPending } from "@/components/app/shell";
import { useViewTitle } from "@/components/app/browser-title";
import { useRow } from "@/lib/models";
import { ProgramWorkspace } from "@/components/prototype/program-workspace";
export const Route = createFileRoute("/programs/$programId_/workbook")({
  head: () => ({ meta: [{ title: "Workbook — Program Assurance" }] }),
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    sheet?: string | undefined;
    reviewRow?: string | undefined;
    reviewColumn?: string | undefined;
  } => ({
    sheet: typeof search["sheet"] === "string" ? search["sheet"] : undefined,
    reviewRow: typeof search["reviewRow"] === "string" ? search["reviewRow"] : undefined,
    reviewColumn: typeof search["reviewColumn"] === "string" ? search["reviewColumn"] : undefined,
  }),
  pendingComponent: RecordPending,
  component: ProgramView,
});
function ProgramView() {
  const { programId } = Route.useParams();
  const record = useRow("programs", programId);
  useViewTitle("Workbook", record.data?.name);
  return <ProgramWorkspace programId={programId} view="Workbook" />;
}
