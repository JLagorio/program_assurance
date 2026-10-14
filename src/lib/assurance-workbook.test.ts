import { describe, expect, it, vi } from "vitest";
import { args, fakeClient, uuid } from "./testing/fake-client";

vi.mock("@/components/app/workspace", () => ({ useWorkspace: () => ({}) }));

const {
  applyAssuranceChanges,
  applyAssuranceChangesSchema,
  readAssuranceWorkbook,
  requirementCellPatch,
  saveAssuranceWorkbook,
} = await import("./assurance-workbook");

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
