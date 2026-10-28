import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { applyOperation, cellAt, createWorkbook, type Workbook } from "@ledger/spreadsheet-core";
import { calculateWorkbook, initializeCalculation } from "@ledger/spreadsheet-core/calculation";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { AssuranceWorkbookSnapshot } from "./assurance-workbook";
import { uuid } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const { projectWorkbook, proposeWorkbookChanges, sourceSheets, workbookDocument } =
  await import("./workbook-projection");

function snapshot(): AssuranceWorkbookSnapshot {
  const requirement = {
    id: uuid(3),
    tenant_id: uuid(1),
    program_id: uuid(2),
    code: "REQ-001",
    content_id: uuid(4),
    revision: 7,
    title: "Service access",
    statement: "Review access annually.",
    acceptance_criteria: "A recorded review exists.",
    rationale: "Least privilege",
    requirement_type: "security" as const,
    owner_party_id: uuid(20),
    owner_name: "Alex Morgan",
    allocation: "Allocated",
    control_mapping: "Mapped",
    allocated_to: "Production",
    linked_controls: "AC-2",
    allocations: [],
    control_sources: [],
    parent_id: null,
    ancestors: [],
    depth: 0,
    unstructured: false,
    evidence_count: 2,
    verification_count: 3,
    updated_at: "2026-10-13T12:00:00Z",
  };
  return {
    complete: true,
    programId: uuid(2),
    capturedAt: "2026-10-13T12:00:00Z",
    workbook: null,
    requirements: [
      requirement,
      {
        ...requirement,
        id: uuid(5),
        code: "REQ-002",
        title: "Draft record",
        content_id: null,
        revision: null,
        evidence_count: 1,
        verification_count: 0,
      },
    ],
    mappings: [
      {
        id: uuid(6),
        tenant_id: uuid(1),
        program_id: uuid(2),
        revision: 3,
        requirement_id: uuid(3),
        requirement_code: "REQ-001",
        requirement_title: "Service access",
        content_id: uuid(4),
        control_id: uuid(7),
        catalog_revision_id: uuid(8),
        control_code: "AC-2",
        control_title: "Account management",
        control_part_id: null,
        part_name: null,
        control_part_prose: null,
        system_id: null,
        system_code: null,
        system_name: null,
        selected_control_id: null,
        relationship_type: "maps_to",
        rationale: "Access mapping",
        scope_label: "No explicit system context",
        profile_resolution_id: null,
        baseline_source_system_id: null,
        baseline_source: null,
        baseline_inherited: null,
        needs_review: true,
        updated_at: "2026-10-13T12:00:00Z",
      },
    ],
    allocations: [
      {
        id: uuid(9),
        revision: 1,
        requirement_id: uuid(3),
        requirement_code: "REQ-001",
        content_id: uuid(4),
        system_id: uuid(10),
        system_code: "SYS-001",
        system_name: "Production",
        provider_capability_id: null,
        security_process_id: null,
        rationale: null,
      },
    ],
    evidence: [
      {
        id: uuid(11),
        revision: 2,
        requirement_id: uuid(3),
        requirement_code: "REQ-001",
        content_id: uuid(4),
        evidence_version_id: uuid(12),
        claim: "Review completed",
        applicability_rationale: null,
        artifact_id: uuid(13),
        artifact_title: "Access review",
        version_number: 4,
        state: "published",
      },
    ],
    systems: [
      {
        id: uuid(10),
        code: "SYS-001",
        name: "Production",
        system_type: "system",
        parent_system_id: null,
        profile_resolution_id: uuid(14),
        source_system_id: uuid(10),
        inherited: false,
        source_label: "Production",
      },
      {
        id: uuid(15),
        code: "SYS-002",
        name: "Inherited system",
        system_type: "system",
        parent_system_id: uuid(10),
        profile_resolution_id: uuid(14),
        source_system_id: uuid(10),
        inherited: true,
        source_label: "Production",
      },
    ],
    owners: [
      { id: uuid(20), name: "Alex Morgan" },
      { id: uuid(21), name: "Dana Lee" },
    ],
    selectedControls: [
      {
        id: uuid(16),
        control_id: uuid(7),
        profile_resolution_id: uuid(14),
        control_code: "AC-2",
        control_title: "Account management",
        catalog_revision_id: uuid(8),
      },
    ],
    counts: {
      requirements: 2,
      mappings: 1,
      allocations: 1,
      evidence: 1,
      systems: 2,
      owners: 2,
      selectedControls: 1,
    },
  };
}

function source(workbook: Workbook, id: string) {
  return workbook.sheets.find((sheet) => sheet.id === id)!;
}
function edit(workbook: Workbook, sheetId: string, rowId: string, field: string, input: string) {
  source(workbook, sheetId).cells[rowId]![field]!.input = input;
}

beforeAll(async () => {
  const buffer = readFileSync(
    createRequire(import.meta.url).resolve("@ironcalc/wasm/wasm_bg.wasm"),
  );
  await initializeCalculation(new Uint8Array(buffer).buffer);
});

describe("assurance record projections", () => {
  it("exposes only authored fields and preserves normalized baseline and record identities", () => {
    const sheets = sourceSheets(snapshot());
    const requirements = sheets.find((sheet) => sheet.id === "requirements")!;
    expect(
      requirements.columns.filter((column) => !column.readonly).map((column) => column.id),
    ).toEqual([
      "title",
      "statement",
      "acceptance_criteria",
      "rationale",
      "requirement_type",
      "owner_party_id",
    ]);
    expect(requirements.rows.find((row) => row.id === uuid(3))).toMatchObject({
      recordId: uuid(3),
      revision: "7",
    });
    expect(requirements.cells[uuid(3)]?.["statement"]?.binding).toEqual({
      recordId: uuid(3),
      fieldId: "statement",
      revision: "7",
    });
    expect(requirements.rows.find((row) => row.id === uuid(5))?.readonly).toBe(true);
    for (const id of ["allocations", "evidence", "systems", "selectedControls"])
      expect(
        sheets.find((sheet) => sheet.id === id)?.columns.every((column) => column.readonly),
      ).toBe(true);
    expect(
      sheets.find((sheet) => sheet.id === "mappings")?.cells[uuid(6)]?.["scope_label"]?.input,
    ).toBe("No explicit system context");
    expect(
      sheets.find((sheet) => sheet.id === "evidence")?.cells[uuid(11)]?.["evidence_version_id"]
        ?.input,
    ).toBe(uuid(12));
    expect(
      sheets
        .find((sheet) => sheet.id === "selectedControls")
        ?.rows.slice(1)
        .map((row) => row.id),
    ).toEqual([uuid(16)]);
    expect(
      snapshot().systems.every(
        (system) =>
          system.profile_resolution_id === snapshot().selectedControls[0]!.profile_resolution_id,
      ),
    ).toBe(true);
  });

  it("calculates default analysis from complete source sheets and keeps requirement text inert", () => {
    const data = snapshot();
    data.requirements[0]!.statement = "=1+1";
    const workbook = projectWorkbook(data);
    const results = calculateWorkbook(workbook);
    const analysis = workbook.sheets.find((sheet) => sheet.name === "Analysis")!;
    expect(
      [1, 2, 3, 4, 5].map(
        (row) =>
          results.sheets[analysis.id]?.[analysis.rows[row]!.id]?.[analysis.columns[1]!.id]?.value,
      ),
    ).toEqual([2, 3, 3, 1, 1]);
    expect(results.sheets["requirements"]?.[uuid(3)]?.["statement"]?.value).toBe("=1+1");
  });
});

describe("workbook persistence boundary", () => {
  it("stores analysis and layout without stale canonical cells, then reads fresh record values", () => {
    const data = snapshot();
    const workbook = projectWorkbook(data);
    edit(workbook, "requirements", uuid(3), "statement", "Unapplied proposal");
    const requirements = source(workbook, "requirements");
    requirements.columns[0]!.width = 48;
    requirements.columns[1]!.width = 640;
    requirements.frozenRows = 0;
    requirements.frozenColumns = 0;
    const analysis = workbook.sheets.find((sheet) => sheet.mode === "freeform")!;
    cellAt(analysis, { row: 1, column: 1 })!.input = "=SUM(2,3)";
    const document = workbookDocument(workbook);
    expect(JSON.stringify(document)).not.toContain("Unapplied proposal");
    expect(JSON.stringify(document)).not.toContain("Review access annually.");
    data.requirements[0]!.statement = "Fresh recorded value";
    const restored = projectWorkbook(data, document);
    expect(source(restored, "requirements").cells[uuid(3)]?.["statement"]?.input).toBe(
      "Fresh recorded value",
    );
    expect(
      source(restored, "requirements")
        .columns.slice(0, 2)
        .map((column) => column.width),
    ).toEqual([48, 640]);
    expect(source(restored, "requirements")).toMatchObject({ frozenRows: 0, frozenColumns: 0 });
    expect(
      cellAt(
        restored.sheets.find((sheet) => sheet.mode === "freeform")!,
        { row: 1, column: 1 },
      )?.input,
    ).toBe("=SUM(2,3)");
  });

  it("rejects unsupported documents and persisted canonical source sheets", () => {
    const data = snapshot();
    expect(() => projectWorkbook(data, { version: 99, analysis: {} })).toThrow("unsupported");
    expect(() =>
      projectWorkbook(data, {
        version: 1,
        analysis: createWorkbook("Invalid", sourceSheets(data)),
      }),
    ).toThrow("invalid source bindings");
  });

  it("keeps saved default summary ranges complete when new source records arrive", () => {
    const data = snapshot();
    const document = workbookDocument(projectWorkbook(data));
    data.requirements.push({
      ...data.requirements[0]!,
      id: uuid(40),
      content_id: uuid(41),
      code: "REQ-003",
      evidence_count: 5,
      verification_count: 6,
    });
    data.counts["requirements"] = data.requirements.length;
    data.mappings.push({
      ...data.mappings[0]!,
      id: uuid(42),
      requirement_id: uuid(40),
      requirement_code: "REQ-003",
      content_id: uuid(41),
    });
    data.counts["mappings"] = data.mappings.length;
    const restored = projectWorkbook(data, document);
    const results = calculateWorkbook(restored);
    const analysis = restored.sheets.find((sheet) => sheet.name === "Analysis")!;
    expect(
      [1, 2, 3, 4, 5].map(
        (row) =>
          results.sheets[analysis.id]?.[analysis.rows[row]!.id]?.[analysis.columns[1]!.id]?.value,
      ),
    ).toEqual([3, 8, 9, 2, 2]);
  });
});

describe("reviewable atomic workbook proposals", () => {
  it("uses stable IDs despite row order and ignores derived columns or records without current content", () => {
    const data = snapshot();
    const workbook = projectWorkbook(data);
    source(workbook, "requirements").rows.reverse();
    edit(workbook, "requirements", uuid(3), "statement", "Review access quarterly.");
    edit(workbook, "requirements", uuid(3), "owner_party_id", uuid(21));
    edit(workbook, "requirements", uuid(3), "evidence_count", "100");
    edit(workbook, "requirements", uuid(5), "title", "Not a current content record");
    edit(workbook, "mappings", uuid(6), "relationship_type", "satisfies");
    const proposal = proposeWorkbookChanges(data, workbook);
    expect(proposal.changes).toHaveLength(3);
    expect(proposal.changes.find((change) => change.field === "Owner")).toMatchObject({
      before: "Alex Morgan",
      after: "Dana Lee",
    });
    expect(proposal.request).toEqual({
      programId: uuid(2),
      requirements: [
        {
          requirementId: uuid(3),
          contentId: uuid(4),
          expectedRevision: 7,
          patch: { statement: "Review access quarterly.", ownerPartyId: uuid(21) },
        },
      ],
      mappings: [
        {
          operation: "update",
          id: uuid(6),
          expectedRevision: 3,
          patch: { relationshipType: "satisfies" },
        },
      ],
    });
  });

  it("reviews the normalized values that will be applied and omits whitespace-only changes", () => {
    const data = snapshot();
    const workbook = projectWorkbook(data);
    edit(workbook, "requirements", uuid(3), "title", "  Service access  ");
    edit(workbook, "requirements", uuid(3), "statement", "  Review quarterly.  ");
    edit(workbook, "requirements", uuid(3), "rationale", "  ");
    edit(workbook, "mappings", uuid(6), "rationale", "  Revised rationale  ");
    const proposal = proposeWorkbookChanges(data, workbook);
    expect(proposal.changes.map((change) => [change.field, change.after])).toEqual([
      ["Statement", "Review quarterly."],
      ["Rationale", ""],
      ["Rationale", "Revised rationale"],
    ]);
    expect(proposal.request.requirements?.[0]?.patch).toEqual({
      statement: "Review quarterly.",
      rationale: null,
    });
    expect(proposal.request.mappings?.[0]).toMatchObject({
      patch: { rationale: "Revised rationale" },
    });
  });

  it("validates the entire proposal before a command and gives deletion priority over staged edits", () => {
    const data = snapshot();
    const workbook = projectWorkbook(data);
    edit(workbook, "requirements", uuid(3), "statement", "");
    expect(() => proposeWorkbookChanges(data, workbook)).toThrow("Enter a requirement statement");
    edit(workbook, "requirements", uuid(3), "statement", data.requirements[0]!.statement!);
    edit(workbook, "mappings", uuid(6), "rationale", "Should be removed");
    const deletion = { operation: "delete" as const, id: uuid(6), expectedRevision: 3 };
    const proposal = proposeWorkbookChanges(data, workbook, [deletion]);
    expect(proposal.changes).toHaveLength(1);
    expect(proposal.changes[0]).toMatchObject({
      field: "Remove control mapping",
      before: "maps_to · No explicit system context",
      after: "",
    });
    expect(proposal.request.mappings).toEqual([deletion]);
    expect(() => proposeWorkbookChanges(data, workbook, [deletion, deletion])).toThrow(
      "Combine each record",
    );
  });

  it("describes new system-specific mappings and existing mapping updates accurately", () => {
    const data = snapshot();
    const workbook = projectWorkbook(data);
    const proposal = proposeWorkbookChanges(data, workbook, [
      {
        operation: "create",
        id: uuid(30),
        contentId: uuid(4),
        controlId: uuid(7),
        systemId: uuid(10),
        selectedControlId: uuid(16),
        relationshipType: "satisfies",
      },
      {
        operation: "update",
        id: uuid(6),
        expectedRevision: 3,
        patch: { rationale: "Actual revised rationale" },
      },
    ]);
    expect(proposal.changes[0]).toMatchObject({
      record: "REQ-001 → AC-2",
      field: "New control mapping",
      after: "satisfies · Production",
    });
    expect(proposal.changes[1]).toMatchObject({
      record: "REQ-001 → AC-2",
      field: "Rationale",
      before: "Access mapping",
      after: "Actual revised rationale",
    });
  });
});

describe("source presentation persistence", () => {
  it("keeps legacy unstyled document layout shapes for exact save receipt recovery", () => {
    const document = workbookDocument(projectWorkbook(snapshot()));
    for (const layout of Object.values(document["layouts"] as Record<string, object>))
      expect(Object.hasOwn(layout, "styles")).toBe(false);
  });

  it("restores hidden records and row heights by identity while keeping canonical values and field rules authoritative", () => {
    const source = snapshot();
    let workbook = projectWorkbook(source);
    const requirements = workbook.sheets.find((sheet) => sheet.id === "requirements")!;
    const recordId = source.requirements[0]!.id;
    workbook = applyOperation(workbook, {
      type: "set-rows-hidden",
      sheetId: "requirements",
      rowIds: [recordId],
      hidden: true,
    });
    workbook = applyOperation(workbook, {
      type: "set-columns-hidden",
      sheetId: "requirements",
      columnIds: ["statement"],
      hidden: true,
    });
    workbook = applyOperation(workbook, {
      type: "resize-row",
      sheetId: "requirements",
      rowId: recordId,
      height: 96,
    });
    workbook = applyOperation(workbook, {
      type: "format",
      sheetId: "requirements",
      range: {
        start: { row: 1, column: 0 },
        end: { row: 1, column: requirements.columns.length - 1 },
      },
      style: { wrap: true, verticalAlign: "bottom", fontSize: 18, color: "#123456" },
    });
    expect(() =>
      applyOperation(workbook, {
        type: "format",
        sheetId: "requirements",
        range: { start: { row: 1, column: 0 }, end: { row: 1, column: 0 } },
        style: { format: "number" },
      }),
    ).toThrow("Source field types");
    const saved = workbookDocument(workbook);
    expect(JSON.stringify(saved["layouts"])).not.toContain("Review access annually.");
    expect(JSON.stringify(saved["layouts"])).not.toContain("recordId");
    source.requirements[0]!.statement = "A newer canonical statement";
    source.requirements.reverse();
    const refreshed = projectWorkbook(source, saved).sheets.find(
      (sheet) => sheet.id === "requirements",
    )!;
    expect(refreshed.rows.find((row) => row.id === recordId)).toMatchObject({
      hidden: true,
      height: 96,
    });
    expect(refreshed.columns.find((field) => field.id === "statement")).toMatchObject({
      hidden: true,
      fieldId: "statement",
      readonly: false,
    });
    expect(refreshed.cells[recordId]!["statement"]!.input).toBe("A newer canonical statement");
    expect(refreshed.cells[recordId]!["statement"]!.style).toEqual({
      wrap: true,
      verticalAlign: "bottom",
      fontSize: 18,
      color: "#123456",
    });
    expect(refreshed.cells[recordId]!["code"]!.style?.wrap).toBe(true);
    expect(proposeWorkbookChanges(source, projectWorkbook(source, saved)).changes).toEqual([]);
    expect(requirements.rows.find((row) => row.id === recordId)?.hidden).toBeUndefined();
  });

  it("ignores malformed presentation entries without importing injected source fields", () => {
    const source = snapshot();
    const saved = workbookDocument(projectWorkbook(source));
    saved["layouts"] = {
      requirements: {
        styles: [
          {
            rowId: source.requirements[0]!.id,
            columnId: "statement",
            style: { wrap: true, format: "number", decimals: 3 },
            input: "Injected",
          },
          {
            rowId: source.requirements[0]!.id,
            columnId: "code",
            style: { color: "url(bad)", wrap: true },
          },
          { rowId: "absent-record", columnId: "statement", style: { wrap: true } },
          null,
        ],
        rows: [
          { id: source.requirements[0]!.id, height: -3, hidden: "yes", recordId: "different" },
          null,
        ],
        columns: [
          { id: "statement", width: 99999, hidden: "yes", readonly: true, fieldId: "injected" },
          null,
        ],
      },
    };
    const sheet = projectWorkbook(source, saved).sheets[0]!;
    expect(sheet.cells[source.requirements[0]!.id]!["statement"]!.style).toEqual({ wrap: true });
    expect(sheet.cells[source.requirements[0]!.id]!["statement"]!.input).toBe(
      source.requirements[0]!.statement,
    );
    expect(sheet.cells[source.requirements[0]!.id]!["code"]!.style).toBeUndefined();
    expect(sheet.cells["absent-record"]).toBeUndefined();
    expect(sheet.rows[1]!.hidden).toBeUndefined();
    expect(sheet.rows[1]!.height).toBeUndefined();
    expect(sheet.rows[1]!.recordId).toBe(source.requirements[0]!.id);
    expect(sheet.columns.find((column) => column.id === "statement")).toMatchObject({
      width: 300,
      readonly: false,
      fieldId: "statement",
    });
  });
});

describe("workbook sheet order", () => {
  it("persists analysis between canonical source sheets without importing source rows", () => {
    const source = snapshot();
    const original = projectWorkbook(source);
    const moved = applyOperation(original, { type: "move-sheet", sheetId: "analysis", index: 1 });
    const saved = workbookDocument(moved);
    expect(saved["sheetOrder"]).toEqual(moved.sheets.map((sheet) => sheet.id));
    const restored = projectWorkbook(source, saved);
    expect(restored.sheets.map((sheet) => sheet.id)).toEqual(moved.sheets.map((sheet) => sheet.id));
    expect(restored.sheets[0]!.cells).toEqual(original.sheets[0]!.cells);
    expect(proposeWorkbookChanges(source, restored).changes).toEqual([]);
    saved["sheetOrder"] = ["analysis", "no-longer-present"];
    const partial = projectWorkbook(source, saved);
    expect(partial.sheets[0]!.id).toBe("analysis");
    expect(partial.sheets).toHaveLength(original.sheets.length);
  });

  it("ignores malformed saved ordering and remains compatible with documents without order", () => {
    const source = snapshot();
    const original = projectWorkbook(source);
    for (const order of [
      undefined,
      "analysis",
      ["analysis", "analysis"],
      ["analysis", null],
      Array.from({ length: 33 }, (_, index) => `sheet-${index}`),
    ]) {
      const saved = workbookDocument(original);
      if (order === undefined) delete saved["sheetOrder"];
      else saved["sheetOrder"] = order;
      expect(projectWorkbook(source, saved).sheets.map((sheet) => sheet.id)).toEqual(
        original.sheets.map((sheet) => sheet.id),
      );
    }
  });
});

describe("source conditional formatting persistence", () => {
  it("keeps old receipts unchanged when rules are empty", () => {
    const workbook = projectWorkbook(snapshot());
    source(workbook, "requirements").conditionalFormats = [];
    const document = workbookDocument(workbook);
    for (const layout of Object.values(document["layouts"] as Record<string, object>))
      expect(Object.hasOwn(layout, "conditionalFormats")).toBe(false);
  });
  it("persists appearance by identity without canonical values and prunes removed source identities", () => {
    const data = snapshot();
    const workbook = projectWorkbook(data);
    const sheet = source(workbook, "requirements");
    sheet.conditionalFormats = [
      {
        id: "review-emphasis",
        rowIds: data.requirements.map((row) => row.id),
        columnIds: ["statement", "code"],
        condition: { kind: "text", operator: "contains", value: "review" },
        style: { background: "#FFF0AA", bold: true },
      },
    ];
    const document = workbookDocument(workbook);
    expect(JSON.stringify(document["layouts"])).not.toContain("Review access annually.");
    expect(JSON.stringify(document["layouts"])).not.toContain("recordId");
    const fresh = snapshot();
    fresh.requirements = fresh.requirements.slice(0, 1);
    fresh.requirements[0]!.statement = "New canonical text";
    const projected = projectWorkbook(fresh, document);
    const restored = source(projected, "requirements");
    expect(restored.conditionalFormats?.[0]).toEqual({
      ...sheet.conditionalFormats[0],
      rowIds: [fresh.requirements[0]!.id],
    });
    expect(restored.cells[fresh.requirements[0]!.id]!["statement"]!.input).toBe(
      "New canonical text",
    );
    expect(restored.columns.find((column) => column.id === "code")!.readonly).toBe(true);
    expect(proposeWorkbookChanges(fresh, projected).changes).toEqual([]);
    fresh.requirements = [];
    expect(
      source(projectWorkbook(fresh, document), "requirements").conditionalFormats,
    ).toBeUndefined();
  });
  it("rejects malformed conditions, unsafe styles, duplicate IDs and type-changing appearance", () => {
    const data = snapshot();
    const document = workbookDocument(projectWorkbook(data));
    const valid = {
      id: "safe",
      rowIds: [data.requirements[0]!.id],
      columnIds: ["statement"],
      condition: { kind: "blank", isBlank: true },
      style: { bold: true },
    };
    for (const rules of [
      [{ ...valid, condition: { kind: "expression", value: "arbitrary()" } }],
      [{ ...valid, style: { background: "url(unsafe)" } }],
      [{ ...valid, style: { format: "number" } }],
      [{ ...valid, rowIds: "wrong" }],
      [valid, valid],
    ]) {
      const modified = structuredClone(document);
      (modified["layouts"] as Record<string, Record<string, unknown>>)["requirements"]![
        "conditionalFormats"
      ] = rules;
      expect(() => projectWorkbook(data, modified)).toThrow();
    }
  });
});
