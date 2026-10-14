import {
  createSheet,
  createWorkbook,
  deserializeWorkbook,
  serializeWorkbook,
  validateStyle,
  type CellStyle,
  type Sheet,
  type SheetColumn,
  type Workbook,
} from "@ledger/spreadsheet-core";
import {
  ASSURANCE_WORKBOOK_ROW_LIMIT,
  applyAssuranceChangesSchema,
  mappingPatchSchema,
  mappingRelationships,
  requirementCellPatch,
  requirementWorkbookFields,
  type ApplyAssuranceChanges,
  type AssuranceWorkbookSnapshot,
  type MappingWorkbookChange,
} from "./assurance-workbook";

type SourceRecord = { id: string; revision?: number | null } & Record<string, unknown>;
export type WorkbookChange = {
  id: string;
  record: string;
  field: string;
  before: string;
  after: string;
};
const value = (input: unknown): string =>
  input === null || input === undefined ? "" : String(input);
const column = (id: string, name: string, options: Partial<SheetColumn> = {}): SheetColumn => ({
  id,
  name,
  readonly: true,
  width: 190,
  ...options,
});

function recordSheet(
  id: string,
  name: string,
  records: SourceRecord[],
  columns: SheetColumn[],
): Sheet {
  const sheet: Sheet = {
    id,
    name,
    mode: "records",
    columns,
    rows: [
      { id: "headers", readonly: true },
      ...records.map((record) => ({
        id: record.id,
        recordId: record.id,
        ...(record.revision ? { revision: String(record.revision) } : {}),
      })),
    ],
    cells: {
      headers: Object.fromEntries(columns.map((field) => [field.id, { input: field.name }])),
    },
    frozenRows: 1,
    frozenColumns: 1,
  };
  for (const record of records)
    sheet.cells[record.id] = Object.fromEntries(
      columns.map((field) => [
        field.id,
        {
          input: value(record[field.id]),
          binding: {
            recordId: record.id,
            fieldId: field.id,
            ...(record.revision ? { revision: String(record.revision) } : {}),
          },
        },
      ]),
    );
  return sheet;
}

/** Stable record and field identities are retained even when the view sorts or filters rows. */
export function sourceSheets(snapshot: AssuranceWorkbookSnapshot): Sheet[] {
  const requirements = recordSheet("requirements", "Requirements", snapshot.requirements, [
    column("code", "Requirement"),
    ...requirementWorkbookFields.map((field) =>
      column(field.key, field.label, {
        fieldId: field.key,
        readonly: false,
        required: field.required,
        ...(field.kind === "choice"
          ? { type: "select" as const, options: [...field.options] }
          : {}),
        ...(field.kind === "record"
          ? { type: "select" as const, options: snapshot.owners.map((owner) => owner.id) }
          : {}),
        width: field.key === "statement" || field.key === "acceptance_criteria" ? 300 : 190,
      }),
    ),
    column("allocation", "Allocation"),
    column("control_mapping", "Control coverage"),
    column("allocated_to", "Allocated to"),
    column("linked_controls", "Linked controls"),
    column("evidence_count", "Evidence links", { type: "number" }),
    column("verification_count", "Verification links", { type: "number" }),
  ]);
  for (const record of snapshot.requirements)
    if (!record.content_id || !record.revision) {
      const row = requirements.rows.find((candidate) => candidate.id === record.id);
      if (row) row.readonly = true;
    }
  return [
    requirements,
    recordSheet("mappings", "SCTM", snapshot.mappings, [
      column("requirement_code", "Requirement"),
      column("requirement_title", "Title"),
      column("control_code", "Control"),
      column("control_title", "Control title"),
      column("system_code", "System"),
      column("scope_label", "Scope"),
      column("relationship_type", "Relationship", {
        readonly: false,
        fieldId: "relationship_type",
        type: "select",
        options: [...mappingRelationships],
        required: true,
      }),
      column("rationale", "Rationale", { readonly: false, fieldId: "rationale", width: 300 }),
      column("part_name", "Control part"),
      column("baseline_source", "Baseline source"),
      column("baseline_inherited", "Inherited"),
      column("needs_review", "Needs review", { type: "boolean" }),
    ]),
    recordSheet("allocations", "Allocations", snapshot.allocations, [
      column("requirement_code", "Requirement"),
      column("system_code", "System"),
      column("system_name", "System name"),
      column("provider_capability_id", "Provider capability"),
      column("security_process_id", "Security process"),
      column("rationale", "Rationale"),
    ]),
    recordSheet("evidence", "Evidence", snapshot.evidence, [
      column("requirement_code", "Requirement"),
      column("artifact_title", "Artifact"),
      column("version_number", "Linked version", { type: "number" }),
      column("state", "State"),
      column("claim", "Claim"),
      column("applicability_rationale", "Applicability rationale"),
      column("evidence_version_id", "Version ID"),
    ]),
    recordSheet("systems", "Systems", snapshot.systems, [
      column("code", "System"),
      column("name", "Name"),
      column("system_type", "Type"),
      column("source_label", "Baseline source"),
      column("inherited", "Inherited"),
      column("profile_resolution_id", "Baseline resolution"),
    ]),
    recordSheet("selectedControls", "Selected controls", snapshot.selectedControls, [
      column("control_code", "Control"),
      column("control_title", "Title"),
      column("profile_resolution_id", "Baseline resolution"),
      column("catalog_revision_id", "Catalog revision"),
    ]),
  ];
}

export function analysisSheet(_snapshot: AssuranceWorkbookSnapshot): Sheet {
  const sheet = createSheet("Analysis", { rows: 100, columns: 26 });
  sheet.id = "analysis";
  sheet.rows = sheet.rows.map((_, index) => ({ id: `analysis-row-${index + 1}` }));
  sheet.columns = sheet.columns.map((column, index) => ({
    ...column,
    id: `analysis-column-${index + 1}`,
  }));
  // The complete source may grow after this analysis is saved; its bounded ranges must grow
  // with it without rewriting authored formulas or silently omitting newly added records.
  const last = ASSURANCE_WORKBOOK_ROW_LIMIT + 1;
  const mappings = ASSURANCE_WORKBOOK_ROW_LIMIT + 1;
  const data = [
    ["Program assurance", "Value"],
    ["Requirements", `=COUNTA(Requirements!A2:A${last})`],
    ["Evidence links", `=SUM(Requirements!L2:L${last})`],
    ["Verification links", `=SUM(Requirements!M2:M${last})`],
    ["Control mappings", `=COUNTA(SCTM!A2:A${mappings})`],
    ["Mappings needing review", `=COUNTIF(SCTM!L2:L${mappings},TRUE)`],
    [""],
    ["Write formulas here. Source sheet row 1 contains field names."],
    ["Record edits stay staged until you review and apply them."],
    ["Counts describe links, not implementation or verification outcomes."],
  ];
  data.forEach((row, r) =>
    row.forEach((input, c) => {
      (sheet.cells[sheet.rows[r]!.id] ??= {})[sheet.columns[c]!.id] = {
        input,
        ...(r === 0 ? { style: { bold: true } } : {}),
      };
    }),
  );
  sheet.columns[0]!.width = 300;
  sheet.frozenRows = 1;
  return sheet;
}

/** Source presentation cannot change the interpretation of canonical field values. */
function sourcePresentationStyle(input: unknown): CellStyle | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) return undefined;
  const style = Object.fromEntries(
    Object.entries(input).filter(([key]) => key !== "format" && key !== "decimals"),
  ) as CellStyle;
  try {
    validateStyle(style);
    return Object.keys(style).length ? structuredClone(style) : undefined;
  } catch {
    return undefined;
  }
}

function sourcePresentationStyles(sheet: Sheet) {
  const styles = sheet.rows.flatMap((row) =>
    sheet.columns.flatMap((column) => {
      const style = sourcePresentationStyle(sheet.cells[row.id]?.[column.id]?.style);
      return style ? [{ rowId: row.id, columnId: column.id, style }] : [];
    }),
  );
  // Preserve the exact shape of older pending save receipts when no styles are set.
  return styles.length ? { styles } : {};
}

/** Only freeform analysis and source presentation are persisted as a workbook document. */
export function workbookDocument(workbook: Workbook): Record<string, unknown> {
  const analysis = workbook.sheets.filter((sheet) => sheet.mode === "freeform");
  return {
    version: 1,
    sheetOrder: workbook.sheets.map((sheet) => sheet.id),
    analysis: JSON.parse(
      serializeWorkbook({
        ...workbook,
        id: "analysis-document",
        revision: 0,
        sheets: analysis.length ? analysis : [createSheet("Analysis")],
      }),
    ),
    layouts: Object.fromEntries(
      workbook.sheets
        .filter((sheet) => sheet.mode === "records")
        .map((sheet) => [
          sheet.id,
          {
            columns: sheet.columns.map(({ id, width, hidden }) => ({
              id,
              width,
              ...(hidden ? { hidden } : {}),
            })),
            rows: sheet.rows
              .filter((row) => row.hidden || row.height !== undefined)
              .map(({ id, hidden, height }) => ({
                id,
                ...(hidden ? { hidden } : {}),
                ...(height !== undefined ? { height } : {}),
              })),
            ...sourcePresentationStyles(sheet),
            frozenRows: sheet.frozenRows,
            frozenColumns: sheet.frozenColumns,
          },
        ]),
    ),
  };
}

export function projectWorkbook(
  snapshot: AssuranceWorkbookSnapshot,
  document = snapshot.workbook?.document,
): Workbook {
  let analysis: Sheet[] = [analysisSheet(snapshot)];
  const sources = sourceSheets(snapshot);
  if (document) {
    if (document["version"] !== 1 || !document["analysis"])
      throw new Error(
        "This saved workbook version is unsupported. Export a backup before replacing it.",
      );
    const saved = deserializeWorkbook(JSON.stringify(document["analysis"]));
    if (saved.sheets.some((sheet) => sheet.mode !== "freeform"))
      throw new Error("Saved analysis contains invalid source bindings.");
    analysis = saved.sheets;
    const layouts = document["layouts"] as
      | Record<
          string,
          {
            columns?: { id: string; width?: number; hidden?: boolean }[];
            rows?: { id: string; height?: number; hidden?: boolean }[];
            styles?: { rowId: string; columnId: string; style: unknown }[];
            frozenRows?: number;
            frozenColumns?: number;
          }
        >
      | undefined;
    for (const source of sources) {
      const layout = layouts?.[source.id];
      const columnLayouts = Array.isArray(layout?.columns) ? layout.columns : [];
      const rowLayouts = new Map(
        (Array.isArray(layout?.rows) ? layout.rows : [])
          .filter((entry) => entry && typeof entry.id === "string")
          .map((entry) => [entry.id, entry]),
      );
      for (const field of source.columns) {
        const saved = columnLayouts.find((entry) => entry && entry.id === field.id);
        const width = saved?.width;
        if (typeof width === "number" && Number.isFinite(width) && width >= 48 && width <= 640)
          field.width = width;
        if (saved?.hidden === true) field.hidden = true;
      }
      for (const row of source.rows) {
        const saved = rowLayouts.get(row.id);
        if (saved?.hidden === true) row.hidden = true;
        if (
          typeof saved?.height === "number" &&
          Number.isFinite(saved.height) &&
          saved.height >= 24 &&
          saved.height <= 240
        )
          row.height = saved.height;
      }
      const rowIds = new Set(source.rows.map((row) => row.id));
      const columnIds = new Set(source.columns.map((column) => column.id));
      for (const entry of Array.isArray(layout?.styles) ? layout.styles : []) {
        if (!entry || !rowIds.has(entry.rowId) || !columnIds.has(entry.columnId)) continue;
        const style = sourcePresentationStyle(entry.style);
        const cell = source.cells[entry.rowId]?.[entry.columnId];
        if (style && cell) cell.style = style;
      }
      // A newer source may have fewer records; never restore an entirely invisible sheet.
      if (source.rows.every((row) => row.hidden)) delete source.rows[0]!.hidden;
      if (source.columns.every((field) => field.hidden)) delete source.columns[0]!.hidden;
      if (
        typeof layout?.frozenRows === "number" &&
        Number.isInteger(layout.frozenRows) &&
        layout.frozenRows >= 0 &&
        layout.frozenRows <= source.rows.length
      )
        source.frozenRows = layout.frozenRows;
      if (
        typeof layout?.frozenColumns === "number" &&
        Number.isInteger(layout.frozenColumns) &&
        layout.frozenColumns >= 0 &&
        layout.frozenColumns <= source.columns.length
      )
        source.frozenColumns = layout.frozenColumns;
    }
  }
  const sheets = [...sources, ...analysis];
  const order = document?.["sheetOrder"];
  if (
    Array.isArray(order) &&
    order.length <= 32 &&
    order.every((id: unknown) => typeof id === "string" && /^[\w-]{1,160}$/.test(id)) &&
    new Set(order).size === order.length
  ) {
    const rank = new Map(order.map((id: string, index: number) => [id, index]));
    // Missing or newly added source sheets remain present after the saved identities.
    const fallback = new Map(sheets.map((sheet, index) => [sheet.id, order.length + index]));
    sheets.sort(
      (a, b) => (rank.get(a.id) ?? fallback.get(a.id)!) - (rank.get(b.id) ?? fallback.get(b.id)!),
    );
  }
  return createWorkbook(snapshot.workbook?.name ?? "Assurance workbook", sheets);
}

export function proposeWorkbookChanges(
  snapshot: AssuranceWorkbookSnapshot,
  workbook: Workbook,
  extraMappings: MappingWorkbookChange[] = [],
): { changes: WorkbookChange[]; request: Omit<ApplyAssuranceChanges, "requestId"> } {
  const changes: WorkbookChange[] = [];
  const requirements: NonNullable<ApplyAssuranceChanges["requirements"]> = [];
  const mappings: MappingWorkbookChange[] = [];
  const reqSheet = workbook.sheets.find((sheet) => sheet.id === "requirements");
  const mapSheet = workbook.sheets.find((sheet) => sheet.id === "mappings");
  for (const source of snapshot.requirements) {
    if (!source.content_id || !source.revision) continue;
    const patch: Record<string, unknown> = {};
    for (const field of requirementWorkbookFields) {
      const input = reqSheet?.cells[source.id]?.[field.key]?.input ?? value(source[field.key]);
      const before = value(source[field.key]);
      if (input === before) continue;
      const fieldPatch = requirementCellPatch(field.key, input);
      const after = value(fieldPatch[field.patch]);
      if (after === before) continue;
      Object.assign(patch, fieldPatch);
      changes.push({
        id: `${source.id}:${field.key}`,
        record: source.code,
        field: field.label,
        before:
          field.key === "owner_party_id"
            ? (snapshot.owners.find((owner) => owner.id === before)?.name ?? before)
            : before,
        after:
          field.key === "owner_party_id"
            ? (snapshot.owners.find((owner) => owner.id === after)?.name ?? after)
            : after,
      });
    }
    if (Object.keys(patch).length)
      requirements.push({
        requirementId: source.id,
        contentId: source.content_id,
        expectedRevision: source.revision,
        patch,
      });
  }
  for (const source of snapshot.mappings) {
    if (extraMappings.some((change) => change.id === source.id)) continue;
    const patch: Record<string, string | null> = {};
    for (const [field, key, label] of [
      ["relationship_type", "relationshipType", "Relationship"],
      ["rationale", "rationale", "Rationale"],
    ] as const) {
      const input = mapSheet?.cells[source.id]?.[field]?.input ?? value(source[field]);
      const before = value(source[field]);
      const fieldPatch = mappingPatchSchema.parse({
        [key]: key === "rationale" ? input.trim() || null : input,
      });
      const after = value(fieldPatch[key]);
      if (before === after) continue;
      Object.assign(patch, fieldPatch);
      changes.push({
        id: `${source.id}:${field}`,
        record: `${source.requirement_code} → ${source.control_code}`,
        field: label,
        before,
        after,
      });
    }
    if (Object.keys(patch).length)
      mappings.push({
        operation: "update",
        id: source.id,
        expectedRevision: source.revision,
        patch: patch as Extract<MappingWorkbookChange, { operation: "update" }>["patch"],
      });
  }
  for (const operation of extraMappings) {
    const source = snapshot.mappings.find((mapping) => mapping.id === operation.id);
    if (operation.operation !== "create" && !source)
      throw new Error(
        "This mapping is no longer in the complete snapshot. Reload before applying changes.",
      );
    if (operation.operation === "update" && source) {
      const patch = mappingPatchSchema.parse(operation.patch);
      for (const [field, key, label] of [
        ["relationship_type", "relationshipType", "Relationship"],
        ["rationale", "rationale", "Rationale"],
      ] as const) {
        if (patch[key] === undefined) continue;
        const before = value(source[field]);
        const after = value(patch[key]);
        if (before !== after)
          changes.push({
            id: `${source.id}:${field}`,
            record: `${source.requirement_code} → ${source.control_code}`,
            field: label,
            before,
            after,
          });
      }
      continue;
    }
    const requirement =
      operation.operation === "create"
        ? snapshot.requirements.find((record) => record.content_id === operation.contentId)
        : undefined;
    const control =
      operation.operation === "create"
        ? snapshot.selectedControls.find(
            (record) =>
              record.id === operation.selectedControlId &&
              record.profile_resolution_id ===
                snapshot.systems.find((system) => system.id === operation.systemId)
                  ?.profile_resolution_id,
          )
        : undefined;
    changes.push({
      id: operation.id,
      record: source
        ? `${source.requirement_code} → ${source.control_code}`
        : `${requirement?.code} → ${control?.control_code}`,
      field: operation.operation === "create" ? "New control mapping" : "Remove control mapping",
      before: source ? `${source.relationship_type} · ${source.scope_label}` : "",
      after:
        operation.operation === "create"
          ? `${operation.relationshipType} · ${snapshot.systems.find((system) => system.id === operation.systemId)?.name ?? operation.systemId}`
          : "",
    });
  }
  const request = {
    programId: snapshot.programId,
    requirements,
    mappings: [...mappings, ...extraMappings],
  };
  if (changes.length) {
    const validated = applyAssuranceChangesSchema.parse({
      ...request,
      requestId: crypto.randomUUID(),
    });
    return {
      changes,
      request: {
        programId: validated.programId,
        requirements: validated.requirements,
        mappings: validated.mappings,
      },
    };
  }
  return { changes, request };
}
