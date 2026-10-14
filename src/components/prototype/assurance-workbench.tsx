import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  Command,
  Upload,
  MessageSquare,
  CircleChevronDown,
  Sigma,
} from "lucide-react";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  ChangeReview,
  CommandPalette,
  CommandScope,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  FileTrigger,
  Inline,
  IconButton,
  Spinner,
  Spreadsheet,
  SpreadsheetToolbar,
  Stack,
  Text,
  type ScopedCommand,
  type SpreadsheetSelection,
  type SpreadsheetMenuContext,
  type SpreadsheetCell,
} from "@ledger/design-system";
import {
  applyOperation,
  columnName,
  createSheet,
  deserializeWorkbook,
  exportDelimited,
  normalizeRange,
  parseDelimited,
  translateFormula,
  type CellRange,
  type CellStyle,
  type CellBorder,
  type BorderPreset,
  type CellValidation,
  type Workbook,
} from "@ledger/spreadsheet-core";
import { createWorkbookFileClient } from "@ledger/spreadsheet-core/file-client";
import type { RequirementWorkbookField } from "@/lib/assurance-workbook";
import { labelFor } from "@/lib/records";
import { ProgramQueryState } from "./program-shared";
import { RequirementRecordContent, type RequirementTab } from "./requirement-record";
import { RecordPreviewActions, RecordPreviewPanel } from "./record-preview";
import { useAssuranceWorkbench } from "./use-assurance-workbench";
import { useWorkbookPresence } from "./use-workbook-presence";
import { WorkbookAnalysis } from "./workbook-analysis";
import {
  WorkbookFormatting,
  WorkbookViewControls,
  type WorkbookQuestion,
} from "./workbook-toolbar";
import { WorkbookTraceability } from "./workbook-traceability";
import {
  WorkbookCellDialog,
  WorkbookMappingDialog,
  WorkbookSheetDialog,
  WorkbookTransformDialog,
} from "./workbook-dialogs";

function download(value: string | Uint8Array, filename: string, type: string) {
  const bytes = typeof value === "string" ? value : new Uint8Array(value).buffer;
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const emptyQuestion: WorkbookQuestion = {
  search: "",
  filterColumn: "",
  sort: "",
  descending: false,
};

export function AssuranceWorkbench({
  programId,
  initialSheet = "requirements",
}: {
  programId: string;
  initialSheet?: string | undefined;
}) {
  const work = useAssuranceWorkbench(programId);
  const [activeSheet, setActiveSheet] = useState(initialSheet);
  const [selection, setSelection] = useState<SpreadsheetSelection | null>(null);
  const [questions, setQuestions] = useState<Record<string, WorkbookQuestion>>({});
  const [view, setView] = useState("grid");
  const [filterOpen, setFilterOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [sheetDialog, setSheetDialog] = useState<"add" | "rename" | null>(null);
  const [sheetDialogTarget, setSheetDialogTarget] = useState<string | null>(null);
  const [cellDialog, setCellDialog] = useState<{
    kind: "comment" | "dropdown";
    sheetId: string;
    cell: SpreadsheetCell;
    range: CellRange;
  } | null>(null);
  const gridHost = useRef<HTMLDivElement>(null);
  const [gridHeight, setGridHeight] = useState<number | undefined>();
  const [mappingDialog, setMappingDialog] = useState(false);
  const [transformDialog, setTransformDialog] = useState(false);
  const [formulaHelp, setFormulaHelp] = useState(false);
  const [palette, setPalette] = useState(false);
  const [previewId, setPreviewId] = useState<string | undefined>();
  const [previewTab, setPreviewTab] = useState<RequirementTab>("Overview");
  const [fileBusy, setFileBusy] = useState(false);
  const [presenceEnabled, setPresenceEnabled] = useState(false);
  const presence = useWorkbookPresence(
    programId,
    {
      sheetId: activeSheet,
      rowId: selection?.focus.rowId,
      columnId: selection?.focus.columnId,
    },
    presenceEnabled,
  );
  const fileClient = useRef<ReturnType<typeof createWorkbookFileClient> | null>(null);
  useEffect(() => {
    fileClient.current = createWorkbookFileClient();
    return () => fileClient.current?.dispose();
  }, []);
  const workbook = work.workbook;
  const sheet =
    workbook?.sheets.find((candidate) => candidate.id === activeSheet) ?? workbook?.sheets[0];
  useEffect(() => {
    const host = gridHost.current;
    if (!host || view !== "grid") return;
    const measure = () => {
      const chrome =
        host.querySelector<HTMLElement>('[data-slot="spreadsheet-toolbar"]')?.offsetHeight ?? 44;
      const formula =
        host.querySelector<HTMLElement>('[data-slot="spreadsheet-formula"]')?.offsetHeight ?? 36;
      const footer =
        host.querySelector<HTMLElement>('[data-slot="spreadsheet-sheet-bar"]')?.offsetHeight ?? 40;
      setGridHeight(
        Math.max(
          280,
          Math.floor(
            window.innerHeight - host.getBoundingClientRect().top - chrome - formula - footer - 72,
          ),
        ),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(host.parentElement ?? host);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [sheet?.id, view, work.error, work.recovery]);
  const question = useMemo(() => {
    const saved = questions[sheet?.id ?? ""] ?? emptyQuestion;
    const columns = new Set(sheet?.columns.map((column) => column.id));
    return {
      ...saved,
      filterColumn: columns.has(saved.filterColumn) ? saved.filterColumn : "",
      sort: columns.has(saved.sort) ? saved.sort : "",
    };
  }, [questions, sheet?.id, sheet?.columns]);
  const ownerOptions = useMemo(() => {
    const owners = work.baseline?.owners ?? [];
    const names = new Map<string, number>();
    for (const owner of owners) names.set(owner.name, (names.get(owner.name) ?? 0) + 1);
    return [
      { value: "", label: "Unassigned" },
      ...owners
        .map((owner) => ({
          value: owner.id,
          label:
            (names.get(owner.name) ?? 0) > 1 ? `${owner.name} · ${owner.id.slice(-8)}` : owner.name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [work.baseline?.owners]);
  const display = useCallback(
    (rowId: string, columnId: string) => {
      if (!sheet) return "";
      const raw = sheet.cells[rowId]?.[columnId]?.input ?? "";
      if (rowId !== "headers") {
        if (sheet.id === "requirements" && columnId === "owner_party_id")
          return ownerOptions.find((owner) => owner.value === raw)?.label ?? raw;
        if (raw && sheet.columns.find((column) => column.id === columnId)?.type === "select")
          return labelFor(raw);
      }
      return work.results?.sheets[sheet.id]?.[rowId]?.[columnId]?.display ?? raw;
    },
    [sheet, ownerOptions, work.results],
  );
  const visibleRows = useMemo(() => {
    if (!sheet) return [];
    const search = question.search.trim().toLocaleLowerCase();
    const rows = sheet.rows.filter(
      (row) =>
        row.id !== "headers" &&
        (!search ||
          sheet.columns.some(
            (column) =>
              (!question.filterColumn || question.filterColumn === column.id) &&
              display(row.id, column.id).toLocaleLowerCase().includes(search),
          )),
    );
    if (question.sort)
      rows.sort((a, b) => {
        const left = display(a.id, question.sort);
        const right = display(b.id, question.sort);
        return (
          left.localeCompare(right, undefined, { numeric: true }) * (question.descending ? -1 : 1)
        );
      });
    const header = sheet.rows.find((row) => row.id === "headers");
    return header ? [header, ...rows] : rows;
  }, [sheet, question, display]);
  const range = useMemo<CellRange | undefined>(() => {
    if (!sheet || !selection) return;
    const start = {
      row: visibleRows.findIndex((row) => row.id === selection.anchor.rowId),
      column: sheet.columns.findIndex((column) => column.id === selection.anchor.columnId),
    };
    const end = {
      row: visibleRows.findIndex((row) => row.id === selection.focus.rowId),
      column: sheet.columns.findIndex((column) => column.id === selection.focus.columnId),
    };
    if (Math.min(start.row, start.column, end.row, end.column) < 0) return;
    return normalizeRange({ start, end });
  }, [sheet, selection, visibleRows]);
  const readonly = work.locked || fileBusy || (sheet?.mode === "records" && !work.canEdit);
  function switchSheet(id: string) {
    setActiveSheet(id);
    setSelection(null);
  }
  function setQuestion(patch: Partial<WorkbookQuestion>) {
    if (!sheet || work.cellDraftDirty) return;
    setQuestions((previous) => ({
      ...previous,
      [sheet.id]: { ...(previous[sheet.id] ?? emptyQuestion), ...patch },
    }));
    setSelection(null);
  }
  function selectedOperation(operation: (range: CellRange) => void) {
    if (!sheet || !range) throw new Error("Select a cell or a range first.");
    if (question.sort || question.search)
      throw new Error(
        "Clear the sort and filter before changing sheet structure or formatting a range.",
      );
    operation(range);
  }
  function format(style: CellStyle) {
    selectedOperation(
      (range) =>
        sheet &&
        work.perform({ type: "format", sheetId: sheet.id, range, style, visibleOnly: true }),
    );
  }
  function borders(preset: BorderPreset, border: CellBorder) {
    selectedOperation(
      (range) =>
        sheet &&
        work.perform({
          type: "borders",
          sheetId: sheet.id,
          range,
          preset,
          border,
          visibleOnly: true,
        }),
    );
  }
  function preview(rowId: string) {
    const id =
      sheet?.id === "requirements"
        ? rowId
        : sheet?.id === "mappings"
          ? work.baseline?.mappings.find((row) => row.id === rowId)?.requirement_id
          : sheet?.id === "allocations"
            ? work.baseline?.allocations.find((row) => row.id === rowId)?.requirement_id
            : sheet?.id === "evidence"
              ? work.baseline?.evidence.find((row) => row.id === rowId)?.requirement_id
              : undefined;
    if (id && id !== "headers") {
      setPreviewId(id);
      setPreviewTab("Overview");
    }
  }
  async function importFile(file: File) {
    if (!workbook || readonly) return;
    if (file.size > 10_000_000) throw new Error("Import a workbook smaller than 10 MB.");
    setFileBusy(true);
    try {
      let imported: Workbook;
      let warnings: string[] = [];
      if (/\.xlsx$/i.test(file.name)) {
        const result = await fileClient.current!.importXlsx(await file.arrayBuffer(), file.name);
        imported = result.workbook;
        warnings = result.warnings;
      } else if (/\.json$/i.test(file.name)) {
        imported = deserializeWorkbook(await file.text());
      } else if (/\.(csv|tsv)$/i.test(file.name)) {
        const values = parseDelimited(await file.text(), /\.tsv$/i.test(file.name) ? "\t" : ",");
        const added = createSheet("Imported data", {
          rows: Math.max(values.length, 20),
          columns: Math.max(1, ...values.map((row) => row.length)),
        });
        // CSV is data. Formula-shaped external text is retained literally until explicitly edited.
        values.forEach((row, r) =>
          row.forEach((input, c) => {
            (added.cells[added.rows[r]!.id] ??= {})[added.columns[c]!.id] = {
              input,
              style: { format: "text" },
            };
          }),
        );
        imported = {
          version: 1,
          id: crypto.randomUUID(),
          name: file.name,
          revision: 0,
          sheets: [added],
        };
      } else throw new Error("Choose an XLSX, CSV, TSV or workbook JSON file.");
      const names = new Set(workbook.sheets.map((item) => item.name.toLocaleLowerCase()));
      for (const item of imported.sheets) {
        let name = item.name;
        let index = 1;
        while (names.has(name.toLocaleLowerCase()))
          name = `${item.name.slice(0, 22)} import ${index++}`;
        if (name !== item.name)
          imported = applyOperation(imported, { type: "rename-sheet", sheetId: item.id, name });
        names.add(name.toLocaleLowerCase());
      }
      // A file is an analysis workbook, never an authority to bind or write application records.
      const additions = imported.sheets.map((item) => {
        const copy = structuredClone(item);
        copy.id = crypto.randomUUID();
        copy.mode = "freeform";
        copy.rows = copy.rows.map(({ id, hidden, height }) => ({
          id,
          ...(hidden ? { hidden } : {}),
          ...(height ? { height } : {}),
        }));
        copy.columns = copy.columns.map(({ id, name, width, hidden }) => ({
          id,
          name,
          ...(width ? { width } : {}),
          ...(hidden ? { hidden } : {}),
        }));
        for (const row of Object.values(copy.cells))
          for (const cell of Object.values(row)) {
            delete cell.binding;
            if (item.mode === "records") cell.style = { ...cell.style, format: "text" };
          }
        return copy;
      });
      work.update({ ...workbook, sheets: [...workbook.sheets, ...additions] });
      if (additions[0]) switchSheet(additions[0].id);
      work.setStatus(`Imported ${additions.length} analysis sheets. ${warnings.join(" ")}`);
    } finally {
      setFileBusy(false);
    }
  }
  async function exportXlsx() {
    if (!workbook) return;
    setFileBusy(true);
    try {
      download(
        await fileClient.current!.exportXlsx(workbook, work.results),
        "assurance-workbook.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
    } finally {
      setFileBusy(false);
    }
  }
  function transform(field: RequirementWorkbookField) {
    if (!sheet || !range || !work.baseline || !workbook || sheet.mode !== "freeform")
      throw new Error("Select an analysis range first.");
    if (!work.results || work.calculating)
      throw new Error("Wait for the current calculation to finish before transforming values.");
    if (range.end.column - range.start.column !== 1)
      throw new Error("Select exactly two columns: requirement code and proposed value.");
    const seen = new Set<string>();
    const edits = visibleRows.slice(range.start.row, range.end.row + 1).map((row) => {
      const code = display(row.id, sheet.columns[range.start.column]!.id).trim();
      const requirement = work.baseline!.requirements.find((record) => record.code === code);
      if (!requirement?.content_id || !requirement.revision)
        throw new Error(
          `No editable requirement matches “${code}”. Use exact codes and exclude headings.`,
        );
      if (seen.has(requirement.id)) throw new Error(`Requirement ${code} appears more than once.`);
      seen.add(requirement.id);
      const result =
        work.results?.sheets[sheet.id]?.[row.id]?.[sheet.columns[range.end.column]!.id];
      if (result?.error) throw new Error(`${code}: fix the formula error first.`);
      return {
        rowId: requirement.id,
        columnId: field,
        value: result?.value === null || result?.value === undefined ? "" : String(result.value),
      };
    });
    work.perform({ type: "edit", sheetId: "requirements", edits });
    setReviewing(true);
  }
  async function removeSheet(sheetId = sheet?.id) {
    const target = workbook?.sheets.find((item) => item.id === sheetId);
    if (!target || target.mode !== "freeform") return;
    if (
      await work.confirm({
        title: `Delete ${target.name}?`,
        description:
          "The sheet and its cells will be removed from this draft. References to it will become #REF! errors. You can undo before reloading the workbook.",
        confirmLabel: "Delete sheet",
      })
    ) {
      work.perform({ type: "delete-sheet", sheetId: target.id });
      if (sheet?.id === target.id) switchSheet("requirements");
    }
  }
  const gridSelection = view === "grid" && Boolean(range);
  const bothFrozen = Boolean(sheet?.frozenRows && sheet?.frozenColumns);
  const commandDefinitions: ScopedCommand[] = [
    {
      id: "review",
      label: `Review ${work.proposal.changes.length} changes`,
      group: "Source records",
      shortcut: "Alt+R",
      enabled: work.canEdit && (work.proposal.changes.length > 0 || work.cellDraftDirty),
      run: () => {
        if (!work.cellDraftDirty) setReviewing(true);
      },
    },
    {
      id: "save",
      label: work.saveAttempt ? "Retry saving analysis" : "Save analysis",
      group: "Workbook",
      shortcut: "Alt+S",
      enabled:
        work.canEdit &&
        !work.busy &&
        !work.applyAttempt &&
        !fileBusy &&
        (work.analysisDirty ||
          Boolean(work.saveAttempt) ||
          (work.cellDraftDirty && sheet?.mode === "freeform")),
      run: work.saveAnalysis,
    },
    {
      id: "reload",
      label: "Reload source records",
      group: "Source records",
      enabled: !work.busy && !fileBusy,
      run: work.refresh,
    },
    {
      id: "add-sheet",
      label: "Add analysis sheet",
      group: "Sheets",
      enabled: !readonly,
      run: () => setSheetDialog("add"),
    },
    {
      id: "rename-sheet",
      label: "Rename sheet",
      group: "Sheets",
      enabled: !readonly && sheet?.mode === "freeform",
      run: () => {
        setSheetDialogTarget(sheet?.id ?? null);
        setSheetDialog("rename");
      },
    },
    {
      id: "duplicate-sheet",
      label: "Duplicate as analysis",
      group: "Sheets",
      enabled: !readonly,
      run: () => {
        if (sheet) work.perform({ type: "duplicate-sheet", sheetId: sheet.id });
      },
    },
    {
      id: "delete-sheet",
      label: "Delete sheet",
      group: "Sheets",
      enabled:
        !readonly &&
        sheet?.mode === "freeform" &&
        (workbook?.sheets.filter((item) => item.mode === "freeform").length ?? 0) > 1,
      run: () => removeSheet(),
    },
    {
      id: "move-left",
      label: "Move sheet left",
      group: "Sheets",
      enabled: !readonly && sheet?.mode === "freeform",
      run: () => {
        if (sheet && workbook)
          work.perform({
            type: "move-sheet",
            sheetId: sheet.id,
            index: Math.max(0, workbook.sheets.indexOf(sheet) - 1),
          });
      },
    },
    {
      id: "add-rows",
      label: "Add 100 rows",
      group: "Structure",
      enabled: !readonly && sheet?.mode === "freeform",
      run: () => {
        if (sheet)
          work.perform({
            type: "insert-rows",
            sheetId: sheet.id,
            index: sheet.rows.length,
            count: 100,
          });
      },
    },
    {
      id: "insert-row",
      label: "Insert row above",
      group: "Structure",
      enabled: !readonly && sheet?.mode === "freeform" && gridSelection,
      run: () =>
        selectedOperation(
          (range) =>
            sheet &&
            work.perform({
              type: "insert-rows",
              sheetId: sheet.id,
              index: range.start.row,
              count: 1,
            }),
        ),
    },
    {
      id: "delete-rows",
      label: "Delete selected rows",
      group: "Structure",
      enabled: !readonly && sheet?.mode === "freeform" && gridSelection,
      run: () =>
        selectedOperation(
          (range) =>
            sheet &&
            work.perform({
              type: "delete-rows",
              sheetId: sheet.id,
              index: range.start.row,
              count: range.end.row - range.start.row + 1,
            }),
        ),
    },
    {
      id: "insert-column",
      label: "Insert column before",
      group: "Structure",
      enabled: !readonly && sheet?.mode === "freeform" && gridSelection,
      run: () =>
        selectedOperation(
          (range) =>
            sheet &&
            work.perform({
              type: "insert-columns",
              sheetId: sheet.id,
              index: range.start.column,
              count: 1,
            }),
        ),
    },
    {
      id: "delete-columns",
      label: "Delete selected columns",
      group: "Structure",
      enabled: !readonly && sheet?.mode === "freeform" && gridSelection,
      run: () =>
        selectedOperation(
          (range) =>
            sheet &&
            work.perform({
              type: "delete-columns",
              sheetId: sheet.id,
              index: range.start.column,
              count: range.end.column - range.start.column + 1,
            }),
        ),
    },
    {
      id: "freeze",
      label: bothFrozen ? "Unfreeze headings and identity" : "Freeze first row and column",
      group: "View",
      enabled: !readonly,
      run: () => {
        if (sheet)
          work.perform({
            type: "freeze",
            sheetId: sheet.id,
            rows: bothFrozen ? 0 : 1,
            columns: bothFrozen ? 0 : 1,
          });
      },
    },
    {
      id: "map",
      label: "Stage control mapping",
      group: "Source records",
      enabled: work.canEdit && !readonly,
      run: () => setMappingDialog(true),
    },
    {
      id: "remove-mapping",
      label: "Stage removal of selected mapping",
      group: "Source records",
      enabled:
        work.canEdit &&
        !readonly &&
        sheet?.id === "mappings" &&
        Boolean(selection) &&
        selection?.anchor.rowId !== "headers",
      run: () => {
        const row = work.baseline?.mappings.find((item) => item.id === selection?.anchor.rowId);
        if (row)
          work.stageMapping({ operation: "delete", id: row.id, expectedRevision: row.revision });
      },
    },
    {
      id: "transform",
      label: "Transform requirements from selection",
      group: "Source records",
      enabled: work.canEdit && !readonly && sheet?.mode === "freeform" && gridSelection,
      run: () => setTransformDialog(true),
    },
    {
      id: "export-csv",
      label: "Export sheet CSV",
      group: "Files",
      enabled: !fileBusy,
      run: () => {
        if (sheet)
          download(
            exportDelimited(sheet, { ...(work.results ? { results: work.results } : {}) }),
            `${sheet.name}.csv`,
            "text/csv;charset=utf-8",
          );
      },
    },
    {
      id: "export-xlsx",
      label: "Export workbook XLSX",
      group: "Files",
      enabled: !fileBusy,
      run: exportXlsx,
    },
    {
      id: "backup",
      label: "Download workbook backup",
      group: "Files",
      run: () => {
        const json = work.downloadDraft();
        if (json) download(json, "assurance-workbook.json", "application/json");
      },
    },
    { id: "formulas", label: "Formula reference", group: "Help", run: () => setFormulaHelp(true) },
    {
      id: "presence",
      label: presenceEnabled ? "Turn off live presence" : "Show live presence",
      group: "View",
      run: () => setPresenceEnabled((enabled) => !enabled),
    },
    {
      id: "palette",
      label: "Workbook commands",
      shortcut: "Mod+Shift+P",
      group: "Help",
      run: () => setPalette(true),
    },
  ];
  const commands = commandDefinitions.map((command) => ({
    ...command,
    enabled:
      command.enabled !== false &&
      (!work.cellDraftDirty || ["review", "save", "formulas", "presence"].includes(command.id)),
  }));
  function run(id: string) {
    // Keep Review/Save clickable so pointer focus can commit the cell first. A refused or
    // still-pending cell edit must settle before either action consumes the workbook.
    if (work.cellDraftDirty && ["review", "save"].includes(id)) return;
    const command = commands.find((item) => item.id === id);
    if (command && command.enabled !== false) work.safely(command.run);
  }
  if (!workbook || !sheet || !work.baseline)
    return (
      <ProgramQueryState queries={[work.query]}>
        {work.initializationError ? (
          <Alert tone="danger">
            <AlertTitle>The saved analysis could not open</AlertTitle>
            <AlertDescription>{work.initializationError}</AlertDescription>
            <AlertAction>
              <Inline space="space.100" shouldWrap>
                <Button
                  size="small"
                  onClick={() => {
                    const backup = work.downloadSavedAnalysis();
                    if (backup) download(backup, "saved-analysis-backup.json", "application/json");
                  }}
                >
                  Download saved analysis
                </Button>
                <Button size="small" onClick={() => work.safely(work.startNewAnalysis)}>
                  Open new analysis draft
                </Button>
              </Inline>
            </AlertAction>
          </Alert>
        ) : work.error ? (
          <Alert tone="danger">
            <AlertTitle>The workbook could not open</AlertTitle>
            <AlertDescription>{work.error}</AlertDescription>
          </Alert>
        ) : (
          <Spinner label="Opening workbook" />
        )}
      </ProgramQueryState>
    );
  const structureDisabled =
    readonly || work.cellDraftDirty || Boolean(question.search || question.sort);
  function contextRange(context: SpreadsheetMenuContext): CellRange {
    const rowIndexes = context.rowIds
      .map((id) => sheet!.rows.findIndex((row) => row.id === id))
      .filter((index) => index >= 0);
    const columnIndexes = context.columnIds
      .map((id) => sheet!.columns.findIndex((column) => column.id === id))
      .filter((index) => index >= 0);
    if (!rowIndexes.length || !columnIndexes.length) throw new Error("Select a cell first.");
    return {
      start: { row: Math.min(...rowIndexes), column: Math.min(...columnIndexes) },
      end: { row: Math.max(...rowIndexes), column: Math.max(...columnIndexes) },
    };
  }
  function openCellDialog(kind: "comment" | "dropdown", context?: SpreadsheetMenuContext) {
    if (!sheet || sheet.mode !== "freeform" || structureDisabled || (!context && !selection))
      return;
    const cell = context?.cell ?? selection!.focus;
    const selected = context ? contextRange(context) : range;
    if (selected) setCellDialog({ kind, sheetId: sheet.id, cell, range: selected });
  }
  function changeAxis(
    axis: "rows" | "columns",
    context: SpreadsheetMenuContext,
    operation: "before" | "after" | "delete",
  ) {
    if (!sheet || !workbook || sheet.mode !== "freeform" || structureDisabled) return;
    const ids = axis === "rows" ? context.rowIds : context.columnIds;
    const indexes = ids
      .map((id) => sheet[axis].findIndex((item) => item.id === id))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b);
    if (!indexes.length) return;
    work.safely(() => {
      if (operation === "delete") {
        // Separate visible runs avoid deleting hidden rows/columns between the selected headers.
        const groups: { index: number; count: number }[] = [];
        for (const index of indexes) {
          const last = groups.at(-1);
          if (last && last.index + last.count === index) last.count++;
          else groups.push({ index, count: 1 });
        }
        let next = workbook;
        for (const group of groups.reverse())
          next = applyOperation(next, {
            type: axis === "rows" ? "delete-rows" : "delete-columns",
            sheetId: sheet.id,
            ...group,
          });
        work.update(next);
      } else
        work.perform({
          type: axis === "rows" ? "insert-rows" : "insert-columns",
          sheetId: sheet.id,
          index: operation === "before" ? indexes[0]! : indexes.at(-1)! + 1,
          count: indexes.length,
        });
      setSelection(null);
    });
  }
  function sheetAction(id: string, action: string) {
    const target = workbook?.sheets.find((item) => item.id === id);
    if (!target || !workbook || work.locked || fileBusy || work.cellDraftDirty) return;
    if (action === "rename" && target.mode === "freeform") {
      setSheetDialogTarget(id);
      setSheetDialog("rename");
    } else if (action === "duplicate") {
      work.safely(() => {
        const next = applyOperation(workbook, { type: "duplicate-sheet", sheetId: id });
        const added = next.sheets.find(
          (item) => !workbook.sheets.some((previous) => previous.id === item.id),
        );
        work.update(next);
        if (added) switchSheet(added.id);
      });
    } else if (action === "delete") work.safely(() => removeSheet(id));
    else if (action === "move-left" || action === "move-right")
      work.safely(() =>
        work.perform({
          type: "move-sheet",
          sheetId: id,
          index: workbook.sheets.indexOf(target) + (action === "move-left" ? -1 : 1),
        }),
      );
  }
  function updateHidden(axis: "rows" | "columns", ids: readonly string[]) {
    if (!workbook || !sheet || readonly) return;
    const next = structuredClone(workbook);
    const target = next.sheets.find((item) => item.id === sheet.id)!;
    const hidden = new Set(ids);
    target[axis].forEach((item) => {
      if (hidden.has(item.id)) item.hidden = true;
      else delete item.hidden;
    });
    work.safely(() => work.update(next));
  }
  const workbookControls = (
    <>
      {view === "grid" && (
        <WorkbookFormatting
          style={{
            bold: selection?.anchor.rowId === "headers",
            ...sheet.cells[selection?.anchor.rowId ?? ""]?.[selection?.anchor.columnId ?? ""]
              ?.style,
          }}
          disabled={structureDisabled || !range}
          numberFormatDisabled={sheet.mode !== "freeform"}
          selectionKey={JSON.stringify([sheet.id, selection?.anchor, selection?.focus])}
          onFormat={(style) => work.safely(() => format(style))}
          onBorders={(preset, border) => work.safely(() => borders(preset, border))}
        />
      )}
      {view === "grid" && (
        <>
          <IconButton
            label="Cell dropdown"
            icon={<CircleChevronDown />}
            size="small"
            variant="subtle"
            disabled={structureDisabled || !range || sheet.mode !== "freeform"}
            onClick={() => openCellDialog("dropdown")}
          />
          <IconButton
            label="Cell comment"
            icon={<MessageSquare />}
            size="small"
            variant="subtle"
            disabled={structureDisabled || !range || sheet.mode !== "freeform"}
            onClick={() => openCellDialog("comment")}
          />
          <IconButton
            label="Formula reference"
            icon={<Sigma />}
            size="small"
            variant="subtle"
            onClick={() => setFormulaHelp(true)}
          />
        </>
      )}
      <WorkbookViewControls
        name={sheet.name}
        columns={sheet.columns}
        question={question}
        onQuestion={setQuestion}
        view={view}
        onView={(value) => {
          if (!work.cellDraftDirty) {
            setView(value);
            setSelection(null);
            setFilterOpen(false);
          }
        }}
        disabled={work.cellDraftDirty}
        filterOpen={filterOpen}
        onFilterOpenChange={setFilterOpen}
      />
      <FileTrigger
        size="small"
        variant="subtle"
        aria-label="Import workbook"
        iconBefore={<Upload />}
        accept=".xlsx,.csv,.tsv,.json"
        disabled={readonly || work.cellDraftDirty}
        isLoading={fileBusy}
        onSelect={(files) => {
          const file = files[0];
          if (file) work.safely(() => importFile(file));
        }}
      >
        Import
      </FileTrigger>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="small"
              variant="subtle"
              aria-label="Workbook actions"
              iconAfter={<ChevronDown />}
            >
              Workbook
            </Button>
          }
        />
        <DropdownMenuContent>
          {commands
            .filter((command) => !["review", "save", "palette"].includes(command.id))
            .map((command) => (
              <DropdownMenuItem
                key={command.id}
                disabled={command.enabled === false}
                onClick={() => run(command.id)}
              >
                {command.label}
              </DropdownMenuItem>
            ))}
          <DropdownMenuSeparator />
          <DropdownMenuLinkItem
            closeOnClick
            render={
              <Link
                to="/programs/$programId"
                params={{ programId }}
                search={{ tab: "Requirements" }}
              />
            }
          >
            Requirements register
          </DropdownMenuLinkItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <IconButton
        label="Commands"
        size="small"
        variant="subtle"
        icon={<Command />}
        onClick={() => setPalette(true)}
      />
    </>
  );
  const sourceChanged = work.sourceChanged;
  const displayedRowCount = Math.max(0, visibleRows.length - (sheet.mode === "records" ? 1 : 0));
  return (
    <CommandScope commands={commands} onCommandError={(error) => work.setError(error.message)}>
      <Stack space="space.200">
        <Inline space="space.150" spread="space-between" shouldWrap>
          <Inline space="space.100" shouldWrap>
            <Text weight="medium">{sheet.name}</Text>
            <Badge>{sheet.mode === "records" ? "Source records" : "Analysis"}</Badge>
            <Text size="small" color="color.text.subtle">
              {displayedRowCount.toLocaleString()} {displayedRowCount === 1 ? "row" : "rows"} ·{" "}
              {work.calculating ? "Calculating…" : "Snapshot loaded"}
            </Text>
          </Inline>
          <Inline space="space.100" shouldWrap>
            <Button
              size="small"
              variant="primary"
              disabled={!commands[0]!.enabled}
              onClick={() => run("review")}
            >
              Review changes
              {work.proposal.changes.length ? ` (${work.proposal.changes.length})` : ""}
            </Button>
            <Button
              size="small"
              disabled={!commands[1]!.enabled}
              isLoading={work.busy && Boolean(work.saveAttempt)}
              onClick={() => run("save")}
            >
              {work.saveAttempt ? "Retry save" : "Save analysis"}
            </Button>
          </Inline>
        </Inline>
        {work.recoveryError && (
          <Alert tone="danger">
            <AlertTitle>The recovery draft could not open</AlertTitle>
            <AlertDescription>{work.recoveryError}</AlertDescription>
            <AlertAction>
              <Inline space="space.100" shouldWrap>
                <Button
                  size="small"
                  onClick={() => {
                    const backup = work.downloadRecoveryDraft();
                    if (backup) download(backup, "recovery-backup.json", "application/json");
                  }}
                >
                  Download recovery backup
                </Button>
                <Button size="small" onClick={work.discardRecovery}>
                  Discard recovery
                </Button>
              </Inline>
            </AlertAction>
          </Alert>
        )}
        {work.recovery && (
          <Alert>
            <AlertTitle>A workbook draft is available</AlertTitle>
            <AlertDescription>
              Recover the draft kept in this browser tab, including any pending request.
            </AlertDescription>
            <AlertAction>
              <Inline space="space.100" shouldWrap>
                <Button size="small" onClick={work.recover}>
                  Recover draft
                </Button>
                <Button size="small" variant="subtle" onClick={work.discardRecovery}>
                  Discard recovered draft
                </Button>
              </Inline>
            </AlertAction>
          </Alert>
        )}
        {work.error && !reviewing && (
          <Alert tone="danger">
            <AlertTitle>The workbook operation could not finish</AlertTitle>
            <AlertDescription>{work.error}</AlertDescription>
            <AlertAction>
              <Button
                size="small"
                onClick={() =>
                  work.saveAttempt
                    ? run("save")
                    : work.applyAttempt
                      ? setReviewing(true)
                      : run("reload")
                }
              >
                {work.saveAttempt
                  ? "Retry save"
                  : work.applyAttempt
                    ? "Review and retry"
                    : "Reload records"}
              </Button>
            </AlertAction>
          </Alert>
        )}
        {work.storageError && (
          <Alert tone="warning">
            <AlertDescription>{work.storageError}</AlertDescription>
            <AlertAction>
              <Button size="small" onClick={() => run("backup")}>
                Download backup
              </Button>
            </AlertAction>
          </Alert>
        )}
        {work.query.error && (
          <Alert tone="danger">
            <AlertTitle>Source refresh failed</AlertTitle>
            <AlertDescription>
              {work.query.error.message} Your current draft remains available.
            </AlertDescription>
            <AlertAction>
              <Button size="small" onClick={() => run("reload")}>
                Retry refresh
              </Button>
            </AlertAction>
          </Alert>
        )}
        {work.calculationError && (
          <Alert tone="danger">
            <AlertTitle>Calculation stopped</AlertTitle>
            <AlertDescription>{work.calculationError}</AlertDescription>
            <AlertAction>
              <Button size="small" onClick={work.retryCalculation}>
                Retry calculation
              </Button>
            </AlertAction>
          </Alert>
        )}
        {sourceChanged && !work.query.error && (
          <Text size="small" color="color.text.subtle">
            A newer snapshot is available. Reload records to use it; the current draft keeps its
            original revisions.
          </Text>
        )}
        {presenceEnabled && (
          <Inline space="space.100" shouldWrap>
            <Text size="small" color="color.text.subtle">
              {presence.status === "connected"
                ? `${presence.participants.length} other readers connected. Presence shows location only; each reader edits a separate draft.`
                : presence.status === "connecting"
                  ? "Connecting live presence…"
                  : "Live presence is unavailable. The workbook remains usable."}
            </Text>
            {presence.status === "disconnected" && (
              <Button size="small" variant="subtle" onClick={presence.reconnect}>
                Reconnect presence
              </Button>
            )}
          </Inline>
        )}
        {view === "matrix" ? (
          <WorkbookTraceability
            snapshot={work.baseline}
            workbook={workbook}
            proposals={work.mappingChanges}
            onOpen={setPreviewId}
            actions={workbookControls}
          />
        ) : view === "analysis" ? (
          <Stack space="space.150">
            <SpreadsheetToolbar label="Workbook controls">{workbookControls}</SpreadsheetToolbar>
            <WorkbookAnalysis
              key={sheet.id}
              sheet={sheet}
              rowIds={visibleRows.map((row) => row.id)}
              results={work.results}
            />
          </Stack>
        ) : (
          <div ref={gridHost} className="min-w-0" data-workbook-grid>
            <Spreadsheet
              headerDisplay="letters"
              density="compact"
              fillAvailable
              height={gridHeight}
              label={`${sheet.name} spreadsheet`}
              columns={sheet.columns.map((column) => ({
                id: column.id,
                label: column.name,
                type: column.type === "select" ? "choice" : column.type,
                options:
                  column.id === "owner_party_id"
                    ? ownerOptions
                    : column.options?.map((option) => ({ value: option, label: labelFor(option) })),
                readOnly: column.readonly,
                width: column.width,
              }))}
              rows={visibleRows.map((row) => ({
                id: row.id,
                label: String(sheet.rows.indexOf(row) + 1),
                rowNumber: sheet.rows.indexOf(row) + 1,
                values: Object.fromEntries(
                  sheet.columns.map((column) => [
                    column.id,
                    sheet.cells[row.id]?.[column.id]?.input ?? "",
                  ]),
                ),
              }))}
              selection={selection}
              onSelectionChange={setSelection}
              onDraftChange={work.setCellDraftDirty}
              readOnly={readonly}
              pending={work.busy}
              isCellReadOnly={({ rowId }) =>
                Boolean(
                  sheet.rows.find((row) => row.id === rowId)?.readonly ||
                  work.mappingChanges.some(
                    (change) => change.id === rowId && change.operation === "delete",
                  ),
                )
              }
              onChange={(edits) =>
                work.perform({ type: "edit", sheetId: sheet.id, edits: [...edits] })
              }
              translateInput={sheet.mode === "freeform" ? translateFormula : undefined}
              presence={presence.participants
                .filter((peer) => peer.sheetId === sheet.id && peer.rowId && peer.columnId)
                .map((peer) => ({
                  id: peer.id,
                  name: peer.label,
                  cell: { rowId: peer.rowId!, columnId: peer.columnId! },
                }))}
              displayValue={({ rowId, columnId }) => display(rowId, columnId)}
              isCellLiteral={({ rowId, columnId }) =>
                sheet.mode === "records" || sheet.cells[rowId]?.[columnId]?.style?.format === "text"
              }
              preparePasteValue={({ rowId, columnId }, value) =>
                sheet.mode === "records" || sheet.cells[rowId]?.[columnId]?.style?.format === "text"
                  ? value
                  : value.startsWith("=")
                    ? `'${value}`
                    : value
              }
              clipboardValue={({ rowId, columnId }, raw) => {
                const result = work.results?.sheets[sheet.id]?.[rowId]?.[columnId];
                return result ? (result.value === null ? "" : String(result.value)) : raw;
              }}
              getCellComment={({ rowId, columnId }) => sheet.cells[rowId]?.[columnId]?.comment}
              getCellOptions={({ rowId, columnId }) => {
                const validation = sheet.cells[rowId]?.[columnId]?.validation;
                return validation
                  ? [
                      ...(validation.allowBlank !== false ? [{ value: "", label: "Blank" }] : []),
                      ...validation.options.map((value) => ({ value, label: value })),
                    ]
                  : undefined;
              }}
              getCellError={({ rowId, columnId }) =>
                work.results?.sheets[sheet.id]?.[rowId]?.[columnId]?.error
              }
              getCellStyle={({ rowId, columnId }) => {
                const style = sheet.cells[rowId]?.[columnId]?.style;
                return {
                  bold: style?.bold ?? rowId === "headers",
                  italic: style?.italic,
                  underline: style?.underline,
                  strikethrough: style?.strikethrough,
                  fontFamily: style?.fontFamily,
                  fontSize: style?.fontSize,
                  color: style?.color,
                  background: style?.background,
                  wrap: style?.wrap,
                  verticalAlign: style?.verticalAlign,
                  borderTop: style?.borderTop,
                  borderRight: style?.borderRight,
                  borderBottom: style?.borderBottom,
                  borderLeft: style?.borderLeft,
                  align:
                    style?.align === "left"
                      ? "start"
                      : style?.align === "right"
                        ? "end"
                        : style?.align,
                  tone: work.proposal.changes.some((change) => change.id === `${rowId}:${columnId}`)
                    ? "warning"
                    : "neutral",
                };
              }}
              onUndo={work.undo}
              onRedo={work.redo}
              canUndo={work.canUndo && !readonly}
              canRedo={work.canRedo && !readonly}
              {...(["requirements", "mappings", "allocations", "evidence"].includes(sheet.id)
                ? { onOpenRow: preview }
                : {})}
              activeRowId={previewId}
              sheets={workbook.sheets.map((item) => ({ id: item.id, label: item.name }))}
              activeSheetId={sheet.id}
              onSheetChange={switchSheet}
              onAddSheet={() => {
                if (!work.cellDraftDirty && !readonly) setSheetDialog("add");
              }}
              getSheetActions={(id) => {
                const target = workbook.sheets.find((item) => item.id === id)!;
                const index = workbook.sheets.indexOf(target);
                const disabled = work.locked || fileBusy || work.cellDraftDirty;
                return [
                  ...(target.mode === "freeform"
                    ? [{ id: "rename", label: "Rename", disabled }]
                    : []),
                  {
                    id: "duplicate",
                    label: target.mode === "records" ? "Duplicate as analysis" : "Duplicate",
                    disabled,
                  },
                  ...(target.mode === "freeform"
                    ? [
                        { id: "move-left", label: "Move left", disabled: disabled || index === 0 },
                        {
                          id: "move-right",
                          label: "Move right",
                          disabled: disabled || index === workbook.sheets.length - 1,
                        },
                        {
                          id: "delete",
                          label: "Delete",
                          destructive: true,
                          disabled:
                            disabled ||
                            workbook.sheets.filter((item) => item.mode === "freeform").length <= 1,
                        },
                      ]
                    : []),
                ];
              }}
              onSheetAction={sheetAction}
              sheetRowCount={sheet.rows.length}
              sheetColumnCount={sheet.columns.length}
              onAddRows={
                sheet.mode === "freeform" && !structureDisabled ? () => run("add-rows") : undefined
              }
              onAddColumns={
                sheet.mode === "freeform" && !structureDisabled
                  ? () =>
                      work.safely(() =>
                        work.perform({
                          type: "insert-columns",
                          sheetId: sheet.id,
                          index: sheet.columns.length,
                          count: 1,
                        }),
                      )
                  : undefined
              }
              hiddenRowIds={sheet.rows.filter((row) => row.hidden).map((row) => row.id)}
              hiddenColumnIds={sheet.columns
                .filter((column) => column.hidden)
                .map((column) => column.id)}
              onHiddenRowIdsChange={readonly ? undefined : (ids) => updateHidden("rows", ids)}
              onHiddenColumnIdsChange={readonly ? undefined : (ids) => updateHidden("columns", ids)}
              rowHeights={Object.fromEntries(
                sheet.rows.filter((row) => row.height).map((row) => [row.id, row.height!]),
              )}
              onRowHeightsChange={
                readonly
                  ? undefined
                  : (heights) => {
                      const next = structuredClone(workbook);
                      const target = next.sheets.find((item) => item.id === sheet.id)!;
                      target.rows.forEach((row) => {
                        if (heights[row.id]) row.height = heights[row.id]!;
                        else delete row.height;
                      });
                      work.safely(() => work.update(next));
                    }
              }
              onClearFormatting={
                !structureDisabled
                  ? (context) =>
                      work.safely(() =>
                        work.perform({
                          type: "clear-formatting",
                          sheetId: sheet.id,
                          range: contextRange(context),
                          visibleOnly: true,
                        }),
                      )
                  : undefined
              }
              renderCellMenu={(context) =>
                sheet.mode === "freeform" ? (
                  <>
                    <DropdownMenuItem
                      disabled={structureDisabled}
                      onClick={() => openCellDialog("dropdown", context)}
                    >
                      <CircleChevronDown />
                      Dropdown…
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={structureDisabled}
                      onClick={() => openCellDialog("comment", context)}
                    >
                      <MessageSquare />
                      {sheet.cells[context.cell.rowId]?.[context.cell.columnId]?.comment
                        ? "Edit comment"
                        : "Comment"}
                    </DropdownMenuItem>
                  </>
                ) : null
              }
              renderRowMenu={(_row, context) =>
                sheet.mode === "freeform" ? (
                  <>
                    <DropdownMenuItem
                      disabled={structureDisabled}
                      onClick={() => changeAxis("rows", context, "before")}
                    >
                      Insert {context.rowIds.length} {context.rowIds.length === 1 ? "row" : "rows"}{" "}
                      above
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={structureDisabled}
                      onClick={() => changeAxis("rows", context, "after")}
                    >
                      Insert {context.rowIds.length} {context.rowIds.length === 1 ? "row" : "rows"}{" "}
                      below
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={structureDisabled || context.rowIds.length >= sheet.rows.length}
                      onClick={() => changeAxis("rows", context, "delete")}
                    >
                      Delete {context.rowIds.length} {context.rowIds.length === 1 ? "row" : "rows"}
                    </DropdownMenuItem>
                  </>
                ) : null
              }
              freezeFirstRow={sheet.frozenRows > 0}
              freezeFirstColumn={sheet.frozenColumns > 0}
              columnWidths={
                readonly
                  ? undefined
                  : Object.fromEntries(
                      sheet.columns.map((column) => [column.id, column.width ?? 140]),
                    )
              }
              onColumnWidthsChange={
                readonly
                  ? undefined
                  : (widths) => {
                      const next = structuredClone(workbook);
                      const target = next.sheets.find((item) => item.id === sheet.id)!;
                      target.columns.forEach((column) => {
                        const width = widths[column.id];
                        if (width) column.width = width;
                      });
                      work.safely(() => work.update(next));
                    }
              }
              actions={workbookControls}
              onFreezeFirstColumnChange={
                readonly
                  ? undefined
                  : (frozen) =>
                      work.safely(() =>
                        work.perform({
                          type: "freeze",
                          sheetId: sheet.id,
                          rows: sheet.frozenRows,
                          columns: frozen ? 1 : 0,
                        }),
                      )
              }
              renderColumnMenu={(column, context) => (
                <>
                  <DropdownMenuItem
                    disabled={work.cellDraftDirty}
                    onClick={() => setQuestion({ sort: column.id, descending: false })}
                  >
                    Sort sheet A to Z
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={work.cellDraftDirty}
                    onClick={() => setQuestion({ sort: column.id, descending: true })}
                  >
                    Sort sheet Z to A
                  </DropdownMenuItem>
                  {question.sort === column.id && (
                    <DropdownMenuItem onClick={() => setQuestion({ sort: "", descending: false })}>
                      Clear sort
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    disabled={work.cellDraftDirty}
                    onClick={() => {
                      setQuestion({ filterColumn: column.id });
                      setFilterOpen(true);
                    }}
                  >
                    Filter by this column
                  </DropdownMenuItem>
                  {sheet.mode === "freeform" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={structureDisabled}
                        onClick={() => changeAxis("columns", context, "before")}
                      >
                        Insert {context.columnIds.length}{" "}
                        {context.columnIds.length === 1 ? "column" : "columns"} left
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={structureDisabled}
                        onClick={() => changeAxis("columns", context, "after")}
                      >
                        Insert {context.columnIds.length}{" "}
                        {context.columnIds.length === 1 ? "column" : "columns"} right
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={
                          structureDisabled || context.columnIds.length >= sheet.columns.length
                        }
                        onClick={() => changeAxis("columns", context, "delete")}
                      >
                        Delete {context.columnIds.length}{" "}
                        {context.columnIds.length === 1 ? "column" : "columns"}
                      </DropdownMenuItem>
                    </>
                  )}
                </>
              )}
            />
          </div>
        )}
        {sheet.mode === "records" && (
          <Text size="small" color="color.text.subtle">
            Edit authored fields, then review and apply. Linked records, allocations, evidence
            versions and baseline provenance are read only. Open a row to inspect its requirement.
          </Text>
        )}
        {work.cellDraftDirty && (
          <Text size="small" color="color.text.subtle">
            Enter or clicking away keeps the cell edit in this draft. Escape cancels; Alt+Enter adds
            a line break in text cells.
          </Text>
        )}
        {work.mappingChanges.length > 0 && (
          <Inline space="space.100" shouldWrap>
            <Text size="small">
              {work.mappingChanges.length} mapping additions or removals staged.
            </Text>
            <Button
              size="small"
              variant="subtle"
              disabled={readonly}
              onClick={work.unstageMappings}
            >
              Discard mapping proposals
            </Button>
          </Inline>
        )}
        <Text size="small" color="color.text.subtle" role="status">
          {work.status ||
            `${work.proposal.changes.length} proposed field changes · ${work.analysisDirty ? "Analysis has unsaved changes" : "Analysis saved or unchanged"}. Local undo applies to this draft.`}
        </Text>
        {work.results?.warnings.length ? (
          <Alert tone="warning">
            <AlertDescription>{work.results.warnings.join(" ")}</AlertDescription>
          </Alert>
        ) : null}
      </Stack>
      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        title="Workbook commands"
        commands={commands
          .filter((command) => command.enabled !== false && command.id !== "palette")
          .map((command) => ({
            id: command.id,
            label: command.label,
            group: command.group ?? "Workbook",
            shortcut: command.shortcut,
            run: () => run(command.id),
          }))}
      />
      <Dialog open={reviewing} pending={work.busy} onOpenChange={setReviewing}>
        <DialogContent width="xlarge">
          <DialogHeader>
            <DialogTitle>Review source changes</DialogTitle>
            <DialogDescription>
              Apply this complete change set atomically. Requirement edits and mapping changes are
              checked against the revisions originally loaded. A conflict keeps the entire proposal
              unapplied.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <ChangeReview
              changes={work.proposal.changes}
              pending={work.busy}
              error={work.error}
              onRetry={work.applyAttempt ? () => work.safely(work.applyChanges) : undefined}
            />
          </DialogBody>
          <DialogFooter>
            <Button variant="subtle" disabled={work.busy} onClick={() => setReviewing(false)}>
              Close review
            </Button>
            <Button
              variant="primary"
              isLoading={work.busy}
              disabled={!work.canEdit || !work.proposal.changes.length || Boolean(work.saveAttempt)}
              onClick={() =>
                work.safely(async () => {
                  await work.applyChanges();
                  setReviewing(false);
                })
              }
            >
              {work.applyAttempt ? "Retry applying changes" : "Apply changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {sheetDialog && (
        <WorkbookSheetDialog
          currentName={
            sheetDialog === "rename"
              ? workbook.sheets.find((item) => item.id === sheetDialogTarget)?.name
              : undefined
          }
          onClose={() => setSheetDialog(null)}
          onSave={(name) => {
            if (sheetDialog === "rename")
              work.perform({ type: "rename-sheet", sheetId: sheetDialogTarget ?? sheet.id, name });
            else {
              const added = createSheet(name);
              work.perform({ type: "add-sheet", sheet: added });
              switchSheet(added.id);
            }
          }}
        />
      )}
      {cellDialog &&
        (() => {
          const target = workbook.sheets.find((item) => item.id === cellDialog.sheetId);
          if (!target) return null;
          const cell = target.cells[cellDialog.cell.rowId]?.[cellDialog.cell.columnId];
          const address = `${columnName(target.columns.findIndex((column) => column.id === cellDialog.cell.columnId))}${target.rows.findIndex((row) => row.id === cellDialog.cell.rowId) + 1}`;
          return (
            <WorkbookCellDialog
              kind={cellDialog.kind}
              address={address}
              comment={cell?.comment}
              validation={cell?.validation}
              onClose={() => setCellDialog(null)}
              onSave={(value) => {
                if (cellDialog.kind === "comment")
                  work.perform({
                    type: "set-comment",
                    sheetId: target.id,
                    ...cellDialog.cell,
                    comment: value as string | null,
                  });
                else
                  work.perform({
                    type: "set-validation",
                    sheetId: target.id,
                    range: cellDialog.range,
                    validation: value as CellValidation | null,
                  });
              }}
            />
          );
        })()}
      {mappingDialog && (
        <WorkbookMappingDialog
          snapshot={work.baseline}
          onStage={work.stageMapping}
          onClose={() => setMappingDialog(false)}
        />
      )}
      {transformDialog && (
        <WorkbookTransformDialog
          count={range ? range.end.row - range.start.row + 1 : 0}
          onStage={transform}
          onClose={() => setTransformDialog(false)}
        />
      )}
      <Dialog open={formulaHelp} onOpenChange={setFormulaHelp}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Formula reference</DialogTitle>
            <DialogDescription>
              Write formulas in analysis sheets. Source sheet row 1 contains field names.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Stack space="space.200">
              <Text>
                Arithmetic: =B2*C2 · Totals: =SUM(B2:B100) · Conditions:
                =IF(B2&gt;0,"Covered","Gap")
              </Text>
              <Text>
                Lookup: =XLOOKUP(A2,Requirements!A2:A100,Requirements!B2:B100) · Count:
                =COUNTIF(SCTM!G2:G100,"satisfies")
              </Text>
              <Text>
                Use $A$1 to fix a reference. Quoted sheet names use ={"'Sheet name'"}!A1 with
                straight single quotes. Copy and fill translate relative references; cross-sheet
                changes recalculate in a worker.
              </Text>
              <Text>
                Imported CSV values remain text. Workbook limits are 32 sheets, 20,000 rows, 256
                columns and 200,000 populated cells. XLSX preserves supported values, formulas and
                basic formatting; unsupported Excel features are reported on import.
              </Text>
            </Stack>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setFormulaHelp(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {previewId && (
        <RequirementRecordContent
          key={previewId}
          programId={programId}
          requirementId={previewId}
          tab={previewTab}
          onTabChange={setPreviewTab}
          preview
          renderFrame={({ title, content, actions }) => (
            <RecordPreviewPanel
              title={title}
              label="Requirement preview"
              recordActions={actions}
              defaultWidth={640}
              onClose={() => setPreviewId(undefined)}
              navigation={
                <RecordPreviewActions
                  table="engineering_requirements"
                  record={{ id: previewId, program_id: programId }}
                  rows={work.baseline!.requirements}
                  onSelect={(record) => setPreviewId(record.id)}
                  openLink={
                    <Link
                      to="/programs/$programId/requirements/$requirementId"
                      params={{ programId, requirementId: previewId }}
                      search={{ tab: previewTab }}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                />
              }
            >
              {content}
            </RecordPreviewPanel>
          )}
        />
      )}
      {work.confirmation}
    </CommandScope>
  );
}
