import { describe, expect, it } from "vitest";
import { args, fakeClient, uuid } from "./testing/fake-client";

const {
  applyAssuranceChanges,
  applyAssuranceChangesSchema,
  readAssuranceWorkbook,
  requirementCellPatch,
  saveAssuranceWorkbook,
  workbookMappingControls,
  workbookMappingPlacement,
} = await import("./assurance-workbook");
type Snapshot = import("./assurance-workbook").AssuranceWorkbookSnapshot;

const context = { tenantId: uuid(1), token: "signed-in-token" };
const programId = uuid(2);
const emptySnapshot = {
  complete: true,
  programId,
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
};

describe("complete assurance workbook reads", () => {
  it("uses one scoped snapshot command and forwards cancellation and identity", async () => {
    const { client, calls } = fakeClient(() => ({ data: emptySnapshot, error: null }));
    const signal = new AbortController().signal;
    expect(await readAssuranceWorkbook(client, context, programId, signal)).toEqual(emptySnapshot);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.table).toBe("rpc:read_assurance_workbook");
    expect(args(calls[0], "rpc")[0]?.[0]).toEqual({
      p_tenant_id: context.tenantId,
      p_program_id: programId,
      p_row_limit: 10000,
    });
    expect(args(calls[0], "abortSignal")[0]).toEqual([signal]);
    expect(args(calls[0], "setHeader")[0]).toEqual(["Authorization", "Bearer signed-in-token"]);
  });

  it("refuses a current page, incomplete counts or a different program", async () => {
    for (const snapshot of [
      { ...emptySnapshot, complete: false },
      { ...emptySnapshot, counts: { ...emptySnapshot.counts, requirements: 12 } },
      { ...emptySnapshot, programId: uuid(3) },
    ]) {
      const { client } = fakeClient(() => ({ data: snapshot, error: null }));
      await expect(readAssuranceWorkbook(client, context, programId)).rejects.toThrow();
    }
  });
});

describe("bound requirement values", () => {
  it("keeps the authored-field contract, required text and controlled identities", () => {
    expect(requirementCellPatch("title", "  Recorded title  ")).toEqual({
      title: "Recorded title",
    });
    expect(requirementCellPatch("acceptance_criteria", "Measured")).toEqual({
      acceptanceCriteria: "Measured",
    });
    expect(requirementCellPatch("rationale", "  ")).toEqual({ rationale: null });
    expect(requirementCellPatch("owner_party_id", "")).toEqual({ ownerPartyId: null });
    expect(() => requirementCellPatch("statement", " ")).toThrow();
    expect(() => requirementCellPatch("owner_party_id", "Someone's name")).toThrow();
    expect(() => requirementCellPatch("requirement_type", "uncontrolled")).toThrow();
  });
});

describe("atomic assurance apply", () => {
  const request = {
    requestId: uuid(3),
    programId,
    requirements: [
      {
        requirementId: uuid(4),
        contentId: uuid(5),
        expectedRevision: 2,
        patch: { title: "Title" },
      },
    ],
    mappings: [{ operation: "delete" as const, id: uuid(6), expectedRevision: 4 }],
  };

  it("submits the mixed change set once and propagates an atomic refusal", async () => {
    const { client, calls } = fakeClient(() => ({
      data: null,
      error: { code: "PT409", message: "A mapping changed; nothing was applied." },
    }));
    await expect(applyAssuranceChanges(client, context, request)).rejects.toThrow(
      "nothing was applied",
    );
    expect(calls).toHaveLength(1);
    expect(args(calls[0], "rpc")[0]?.[0]).toEqual({
      p_tenant_id: context.tenantId,
      p_program_id: programId,
      p_request_id: request.requestId,
      p_requirements: request.requirements,
      p_mappings: request.mappings,
    });
  });

  it("rejects duplicate records, empty batches and attempts to edit derived values", () => {
    expect(
      applyAssuranceChangesSchema.safeParse({
        ...request,
        requirements: [...request.requirements, ...request.requirements],
      }).success,
    ).toBe(false);
    expect(
      applyAssuranceChangesSchema.safeParse({ ...request, requirements: [], mappings: [] }).success,
    ).toBe(false);
    expect(
      applyAssuranceChangesSchema.safeParse({
        ...request,
        requirements: [{ ...request.requirements[0], patch: { allocation: "Allocated" } }],
      }).success,
    ).toBe(false);
  });
});

describe("workbook metadata saves", () => {
  it("keeps metadata persistence separate from canonical edits and compares its revision", async () => {
    const result = { id: uuid(8), revision: 4, updatedAt: "2026-10-13T12:00:00Z" };
    const { client, calls } = fakeClient(() => ({ data: result, error: null }));
    expect(
      await saveAssuranceWorkbook(client, context, {
        requestId: uuid(9),
        programId,
        workbookId: uuid(8),
        expectedRevision: 3,
        name: "Analysis",
        document: { source: { programId }, formula: "=SUM(A1:A4)" },
      }),
    ).toEqual(result);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.table).toBe("rpc:save_assurance_workbook");
    expect(args(calls[0], "rpc")[0]?.[0]).toMatchObject({
      p_expected_revision: 3,
      p_workbook_id: uuid(8),
    });
  });
});

describe("Stage control mapping places a mapping on each of the requirement's systems", () => {
  // REQ-001's details (4) are allocated to the boundary SYS-001 (10) and the element SYS-002 (11),
  // both on baseline 14, which selects AC-2 (7) and AC-10 (8); SYS-003 (12) is on baseline 15,
  // which selects AC-10 alone. REQ-002 (5) is allocated to SYS-003 alone, REQ-003 (6) to nothing,
  // and REQ-004 has no details.
  const requirement = (id: number, code: string, content: number | null) => ({
    id: uuid(id),
    code,
    content_id: content === null ? null : uuid(content),
  });
  const system = (id: number, code: string, resolution: number) => ({
    id: uuid(id),
    code,
    name: `${code} name`,
    profile_resolution_id: uuid(resolution),
  });
  const selection = (id: number, control: number, code: string, resolution: number) => ({
    id: uuid(id),
    control_id: uuid(control),
    control_code: code,
    control_title: `${code} title`,
    profile_resolution_id: uuid(resolution),
  });
  const allocation = (content: number, systemId: number | null) => ({
    content_id: uuid(content),
    system_id: systemId === null ? null : uuid(systemId),
  });
  const base = {
    requirements: [
      requirement(1, "REQ-001", 4),
      requirement(2, "REQ-002", 5),
      requirement(3, "REQ-003", 6),
      requirement(9, "REQ-004", null),
    ],
    // Listed out of code order: placement sorts by code.
    systems: [system(11, "SYS-002", 14), system(10, "SYS-001", 14), system(12, "SYS-003", 15)],
    selectedControls: [
      selection(20, 8, "AC-10", 14),
      selection(21, 7, "AC-2", 14),
      selection(22, 8, "AC-10", 15),
    ],
    allocations: [allocation(4, 11), allocation(4, 10), allocation(5, 12), allocation(6, null)],
    mappings: [] as {
      content_id: string;
      control_id: string;
      system_id: string | null;
      control_part_id: string | null;
      part_name: string | null;
    }[],
  };
  const snapshot = (overrides: Partial<typeof base> = {}) =>
    ({ ...base, ...overrides }) as unknown as Snapshot;
  const mapping = (systemId: number | null, part: string | null = null) => ({
    content_id: uuid(4),
    control_id: uuid(7),
    system_id: systemId === null ? null : uuid(systemId),
    control_part_id: part ? uuid(30) : null,
    part_name: part,
  });

  it("puts one mapping on each allocated system whose baseline selects the control, in code order", () => {
    expect(workbookMappingPlacement(snapshot(), uuid(1), uuid(7))).toEqual({
      kind: "targets",
      targets: [
        { systemId: uuid(10), selectedControlId: uuid(21) },
        { systemId: uuid(11), selectedControlId: uuid(21) },
      ],
      mapped: 0,
      eligible: 2,
    });
  });

  it("passes over a system that holds the whole control, recorded, staged or by its statement", () => {
    expect(
      workbookMappingPlacement(snapshot({ mappings: [mapping(10)] }), uuid(1), uuid(7)),
    ).toEqual({
      kind: "targets",
      targets: [{ systemId: uuid(11), selectedControlId: uuid(21) }],
      mapped: 1,
      eligible: 2,
    });
    expect(
      workbookMappingPlacement(
        snapshot({ mappings: [mapping(10, "statement")] }),
        uuid(1),
        uuid(7),
        [
          {
            operation: "create",
            id: uuid(40),
            contentId: uuid(4),
            controlId: uuid(7),
            systemId: uuid(11),
            selectedControlId: uuid(21),
            relationshipType: "maps_to",
          },
        ],
      ),
    ).toEqual({ kind: "mapped", eligible: 2 });
    // One objective, or a mapping that names no system, holds nothing on a system.
    expect(
      workbookMappingPlacement(
        snapshot({ mappings: [mapping(10, "assessment-objective"), mapping(null)] }),
        uuid(1),
        uuid(7),
      ),
    ).toMatchObject({ kind: "targets", mapped: 0, eligible: 2 });
  });

  it("refuses a requirement with no details, allocated to no system, or whose systems leave the control out", () => {
    expect(workbookMappingPlacement(snapshot(), uuid(9), uuid(7))).toEqual({ kind: "no_details" });
    expect(workbookMappingPlacement(snapshot(), uuid(3), uuid(7))).toEqual({ kind: "unallocated" });
    expect(workbookMappingPlacement(snapshot(), uuid(2), uuid(7))).toEqual({
      kind: "not_selected",
    });
    expect(workbookMappingPlacement(snapshot(), uuid(2), uuid(8))).toEqual({
      kind: "targets",
      targets: [{ systemId: uuid(12), selectedControlId: uuid(22) }],
      mapped: 0,
      eligible: 1,
    });
  });

  it("offers the controls its systems' baselines select, once each, in code order", () => {
    expect(workbookMappingControls(snapshot(), uuid(1)).map((row) => row.control_code)).toEqual([
      "AC-2",
      "AC-10",
    ]);
    expect(workbookMappingControls(snapshot(), uuid(2)).map((row) => row.id)).toEqual([uuid(22)]);
    expect(workbookMappingControls(snapshot(), uuid(3))).toEqual([]);
    expect(workbookMappingControls(snapshot(), uuid(9))).toEqual([]);
  });
});
