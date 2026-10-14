import { describe, expect, it, vi } from "vitest";
import type { AssuranceWorkbookSnapshot } from "@/lib/assurance-workbook";
import { uuid } from "@/lib/testing/fake-client";
import { applyEdits, applyOperation, cellAt } from "@ledger/spreadsheet-core";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));
vi.mock("@/components/app/use-draft-guard", () => ({ useDraftGuard: () => ({}) }));

const { readWorkbenchDraft, writeWorkbenchDraft, workbookSourcesChanged } =
  await import("./use-assurance-workbench");
const { projectWorkbook, proposeWorkbookChanges, workbookDocument } =
  await import("@/lib/workbook-projection");

const snapshot = (): AssuranceWorkbookSnapshot => ({
  complete: true,
  programId: uuid(2),
  capturedAt: "2026-10-13T12:00:00Z",
  requirements: [],
  mappings: [],
  allocations: [],
  evidence: [],
  systems: [],
  owners: [],
  selectedControls: [],
  counts: {
    requirements: 0,
    mappings: 0,
    allocations: 0,
    evidence: 0,
    systems: 0,
    owners: 0,
    selectedControls: 0,
  },
  workbook: null,
});

function populatedSnapshot(): AssuranceWorkbookSnapshot {
  const baseline = snapshot();
  baseline.requirements = [
    {
      id: uuid(10),
      tenant_id: uuid(1),
      program_id: baseline.programId,
      code: "REQ-1",
      content_id: uuid(11),
      revision: 7,
      title: "Original title",
      statement: "Original statement",
      acceptance_criteria: "Measured criteria",
      rationale: null,
      requirement_type: "security",
      owner_party_id: null,
      owner_name: null,
      allocation: "Allocated",
      control_mapping: "Mapped",
      allocated_to: "System",
      linked_controls: "AC-1",
      allocations: [],
      control_sources: [],
      parent_id: null,
      ancestors: [],
      depth: 0,
      unstructured: false,
      evidence_count: 1,
      verification_count: 0,
      updated_at: baseline.capturedAt,
    },
  ];
  baseline.mappings = [
    {
      id: uuid(12),
      tenant_id: uuid(1),
      program_id: baseline.programId,
      revision: 3,
      requirement_id: uuid(10),
      requirement_code: "REQ-1",
      requirement_title: "Original title",
      content_id: uuid(11),
      control_id: uuid(13),
      catalog_revision_id: null,
      control_code: "AC-1",
      control_title: "Access",
      control_part_id: null,
      part_name: null,
      control_part_prose: null,
      system_id: null,
      system_code: null,
      system_name: null,
      selected_control_id: null,
      relationship_type: "maps_to",
      rationale: "Original mapping",
      scope_label: "No explicit system context",
      profile_resolution_id: null,
      baseline_source_system_id: null,
      baseline_source: null,
      baseline_inherited: null,
      needs_review: true,
      updated_at: baseline.capturedAt,
    },
  ];
  baseline.counts["requirements"] = 1;
  baseline.counts["mappings"] = 1;
  return baseline;
}

function encode(draft: Parameters<typeof writeWorkbenchDraft>[2]) {
  let stored = "";
  writeWorkbenchDraft(
    {
      setItem: (_key, value) => {
        stored = value;
      },
    },
    "scoped-key",
    draft,
  );
  return stored;
}

function recovery() {
  const baseline = snapshot();
  const workbook = projectWorkbook(baseline);
  const document = workbookDocument(workbook);
  baseline.workbook = {
    id: uuid(3),
    tenant_id: uuid(1),
    program_id: baseline.programId,
    name: workbook.name,
    document,
    schema_version: 1,
    revision: 7,
    created_at: baseline.capturedAt,
    updated_at: baseline.capturedAt,
  };
  return {
    baseline,
    workbook,
    mappings: [],
    savedId: uuid(3),
    savedRevision: 7,
    savedDocument: JSON.stringify(document),
    saveAttempt: {
      requestId: uuid(4),
      programId: baseline.programId,
      workbookId: uuid(3),
      expectedRevision: 7,
      name: workbook.name,
      document,
    },
  };
}

describe("workbench recovery and concurrency boundaries", () => {
  it("recovers sparse authored edits, analysis, layout and sheet order with the original exact apply receipt", () => {
    const baseline = populatedSnapshot();
    const initial = projectWorkbook(baseline);
    let workbook = applyEdits(initial, "requirements", [
      { rowId: uuid(10), columnId: "title", value: "  Proposed title  " },
    ]);
    workbook = applyEdits(workbook, "mappings", [
      { rowId: uuid(12), columnId: "rationale", value: "Proposed rationale" },
    ]);
    const analysis = workbook.sheets.find((sheet) => sheet.mode === "freeform")!;
    workbook = applyOperation(workbook, {
      type: "paste",
      sheetId: analysis.id,
      start: { row: 11, column: 0 },
      values: [["2", "=A12*3"]],
    });
    workbook = applyOperation(workbook, {
      type: "resize-column",
      sheetId: "requirements",
      columnId: "title",
      width: 280,
    });
    workbook = applyOperation(workbook, { type: "move-sheet", sheetId: analysis.id, index: 0 });
    const mappings = [{ operation: "delete" as const, id: uuid(12), expectedRevision: 3 }];
    const applyAttempt = {
      ...proposeWorkbookChanges(baseline, workbook, mappings).request,
      requestId: uuid(30),
    };
    const draft = {
      baseline,
      workbook,
      mappings,
      applyAttempt,
      savedId: uuid(31),
      savedRevision: 9,
      savedDocument: JSON.stringify(workbookDocument(initial)),
    };
    const json = encode(draft);
    const packed = JSON.parse(json);
    expect(packed.format).toBe(2);
    expect(packed.workbook).toBeUndefined();
    expect(packed.sourceEdits).toHaveLength(2);
    expect(packed.sourceEdits[0]).toEqual({
      sheetId: "requirements",
      rowId: uuid(10),
      columnId: "title",
      value: "  Proposed title  ",
    });
    const restored = readWorkbenchDraft(json, baseline.programId);
    expect(restored).toEqual(draft);
    expect(restored.baseline.requirements[0]!.revision).toBe(7);
    expect(restored.applyAttempt!.requirements![0]!.expectedRevision).toBe(7);
    expect(restored.applyAttempt!.mappings).toEqual(mappings);
    expect(restored.workbook.sheets[0]!.id).toBe(analysis.id);
    expect(cellAt(restored.workbook.sheets[0]!, { row: 11, column: 1 })!.input).toBe("=A12*3");
    expect(
      restored.workbook.sheets.find((sheet) => sheet.id === "requirements")!.cells[uuid(10)]![
        "title"
      ]!.binding,
    ).toEqual({ recordId: uuid(10), fieldId: "title", revision: "7" });
  });

  it("keeps the exact pending save receipt and CAS metadata in the compact format", () => {
    const draft = recovery();
    expect(readWorkbenchDraft(encode(draft), draft.baseline.programId)).toEqual(draft);
  });

  it("rejects corrupted compact revisions, identities, duplicate edits, readonly fields and receipt mismatches", () => {
    const baseline = populatedSnapshot();
    const workbook = applyEdits(projectWorkbook(baseline), "requirements", [
      { rowId: uuid(10), columnId: "title", value: "Proposed title" },
    ]);
    const draft = {
      baseline,
      workbook,
      mappings: [],
      applyAttempt: { ...proposeWorkbookChanges(baseline, workbook).request, requestId: uuid(30) },
    };
    const packed = JSON.parse(encode(draft));
    const invalid = (patch: Record<string, unknown>) =>
      readWorkbenchDraft(JSON.stringify({ ...packed, ...patch }), baseline.programId);
    expect(() => invalid({ format: 3 })).toThrow("unsupported");
    expect(() =>
      invalid({ sourceEdits: [{ ...packed.sourceEdits[0], columnId: "code" }] }),
    ).toThrow("read only");
    expect(() =>
      invalid({ sourceEdits: [{ ...packed.sourceEdits[0], rowId: uuid(999) }] }),
    ).toThrow("no longer exists");
    expect(() => invalid({ sourceEdits: [packed.sourceEdits[0], packed.sourceEdits[0]] })).toThrow(
      "twice",
    );
    expect(() =>
      invalid({ sourceEdits: [{ ...packed.sourceEdits[0], value: "Different proposal" }] }),
    ).toThrow("does not match");
    expect(() =>
      invalid({ workbookMetadata: { ...packed.workbookMetadata, revision: -1 } }),
    ).toThrow();
    expect(() =>
      invalid({ workbookMetadata: { ...packed.workbookMetadata, sheetOrder: ["analysis"] } }),
    ).toThrow("sheet identities");
    expect(() => readWorkbenchDraft("{".repeat(5_000_001), baseline.programId)).toThrow(
      "too large",
    );
  });

  it("fits a substantial snapshot once without duplicating thousands of record cells in recovery", () => {
    const baseline = populatedSnapshot();
    const first = baseline.requirements[0]!;
    baseline.requirements = Array.from({ length: 640 }, (_, index) => ({
      ...first,
      id: uuid(1000 + index),
      content_id: uuid(2000 + index),
      code: `REQ-${index + 1}`,
      statement: `Requirement ${index}: ${"Detailed source statement. ".repeat(130)}`,
    }));
    baseline.mappings[0]!.requirement_id = baseline.requirements[0]!.id;
    baseline.mappings[0]!.content_id = baseline.requirements[0]!.content_id!;
    baseline.counts["requirements"] = baseline.requirements.length;
    const workbook = applyEdits(projectWorkbook(baseline), "requirements", [
      { rowId: baseline.requirements[0]!.id, columnId: "title", value: "One staged edit" },
    ]);
    const draft = {
      baseline,
      workbook,
      mappings: [],
      applyAttempt: { ...proposeWorkbookChanges(baseline, workbook).request, requestId: uuid(30) },
    };
    expect(new TextEncoder().encode(JSON.stringify(draft)).byteLength).toBeGreaterThan(5_000_000);
    const compact = encode(draft);
    expect(new TextEncoder().encode(compact).byteLength).toBeLessThan(5_000_000);
    expect(JSON.parse(compact).sourceEdits).toHaveLength(1);
    const restored = readWorkbenchDraft(compact, baseline.programId);
    expect(restored.workbook).toEqual(workbook);
    expect(restored.applyAttempt).toEqual(draft.applyAttempt);
    expect(restored.baseline).toEqual(baseline);
  });
  it("retains the exact pending request and original saved revision through recovery", () => {
    const draft = recovery();
    const restored = readWorkbenchDraft(JSON.stringify(draft), draft.baseline.programId);
    expect(restored.saveAttempt).toEqual(draft.saveAttempt);
    expect(restored.savedId).toBe(uuid(3));
    expect(restored.savedRevision).toBe(7);
    expect(restored.savedDocument).toBe(draft.savedDocument);
    const {
      savedRevision: _revision,
      savedId: _id,
      savedDocument: _document,
      ...legacyDraft
    } = draft;
    expect(
      readWorkbenchDraft(JSON.stringify(legacyDraft), draft.baseline.programId).savedRevision,
    ).toBe(7);
  });

  it("refuses another program, incomplete snapshots and mismatched persisted requests", () => {
    const draft = recovery();
    expect(() => readWorkbenchDraft(JSON.stringify(draft), uuid(8))).toThrow("another program");
    expect(() =>
      readWorkbenchDraft(
        JSON.stringify({ ...draft, baseline: { ...draft.baseline, complete: false } }),
        draft.baseline.programId,
      ),
    ).toThrow();
    expect(() =>
      readWorkbenchDraft(
        JSON.stringify({ ...draft, saveAttempt: { ...draft.saveAttempt, programId: uuid(8) } }),
        draft.baseline.programId,
      ),
    ).toThrow("does not match");
    expect(() =>
      readWorkbenchDraft(
        JSON.stringify({
          ...draft,
          saveAttempt: { ...draft.saveAttempt, document: { replaced: true } },
        }),
        draft.baseline.programId,
      ),
    ).toThrow("does not match");
    expect(() =>
      readWorkbenchDraft(JSON.stringify({ ...draft, savedRevision: -1 }), draft.baseline.programId),
    ).toThrow("invalid save metadata");
  });

  it("writes the retry receipt synchronously and propagates storage refusal", () => {
    const draft = recovery();
    const setItem = vi.fn();
    writeWorkbenchDraft({ setItem }, "scoped-key", draft);
    expect(setItem).toHaveBeenCalledOnce();
    const [key, value] = setItem.mock.calls[0]!;
    expect(key).toBe("scoped-key");
    expect(JSON.parse(value as string).saveAttempt.requestId).toBe(draft.saveAttempt.requestId);
    expect(() =>
      writeWorkbenchDraft(
        {
          setItem: () => {
            throw new Error("Storage unavailable");
          },
        },
        "scoped-key",
        draft,
      ),
    ).toThrow("Storage unavailable");
    expect(() =>
      writeWorkbenchDraft({ setItem }, "scoped-key", {
        ...draft,
        savedDocument: "😀".repeat(1_250_001),
      }),
    ).toThrow("too large");
    expect(setItem).toHaveBeenCalledOnce();
  });

  it("distinguishes focus refresh timestamps from actual canonical source changes", () => {
    const before = snapshot();
    const after = { ...before, capturedAt: "2026-10-13T13:00:00Z" };
    expect(workbookSourcesChanged(before, after)).toBe(false);
    expect(
      workbookSourcesChanged(before, { ...after, owners: [{ id: uuid(5), name: "New owner" }] }),
    ).toBe(true);
    const saved = recovery().baseline;
    expect(workbookSourcesChanged(before, saved)).toBe(false);
  });
});
